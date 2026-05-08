---
title: "Track and Ingest Lossless Content into Chroma (with Change Detection)"
lede: "A second ingestion pipeline parallel to the context-v corpus — for the ~5K Lossless content files scattered across the monorepo. Driven by its own sources map, with content-hash-based change detection so re-runs only re-embed what actually changed."
date_created: 2026-05-08
date_modified: 2026-05-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.1
tags:
  - Plan
  - ChromaDB
  - Content-Ingestion
  - Change-Detection
  - Sources-Map
  - Lossless-Content
status: Draft
---

# Track and Ingest Lossless Content into Chroma (with Change Detection)

## What this plan is for

We have **~5K content files** across `lossless-monorepo` — essays, vocabulary, concepts, tooling notes, project pages, anything in `content/` and similar — that are *not* context-v files but are still high-value text we want queryable in the same Chroma instance. The existing context-v corpus pipeline (`ingest-to-chroma.py`) doesn't reach these; a parallel pipeline does.

**The hard requirement that differentiates this from the corpus pipeline:** at this scale, naive re-embed-on-every-run is wasteful. We need **content-hash change detection** so re-runs only embed files that actually changed. Chroma doesn't do this for us; we build it on top of upsert + metadata.

This plan covers:
1. The sources-map artifact (parallel to `sources.md` but for content)
2. The change-detection mechanics — and *exactly* what Chroma provides vs. what we have to build
3. The script's behavior end-to-end
4. The collection naming and metadata shape

## How Chroma handles updates / same files / new files (direct answer)

Since you asked: out of the box, Chroma's **only persistence primitive for "same file, has it changed?"** is comparing IDs.

| Operation | Behavior |
|---|---|
| `add(ids, docs, metadatas)` | Inserts; **errors if any ID already exists** |
| `update(ids, docs, metadatas)` | Updates existing; errors if any ID missing |
| `upsert(ids, docs, metadatas)` | Insert new, update existing — **idempotent on ID, but always re-embeds the document** |
| `delete(ids)` or `delete(where=...)` | Removes by ID or metadata filter |
| `get(ids=...)` | Reads stored metadata + (optionally) documents/embeddings |

**What Chroma does NOT do natively:**
- Watch the filesystem
- Track source file mtimes or hashes
- Skip re-embedding when content is unchanged
- Detect deleted source files
- Version records / keep history

So `upsert()` alone is *idempotent on ID* but not *cost-aware* — call it 1000 times with the same content and you pay the embedding cost 1000 times. For 5K files that's a lot of wasted compute (and, if we ever switch from local Ollama embeddings to a hosted API, a lot of wasted dollars).

**The pattern we build on top:**

1. Compute a content hash (sha256) of each file at walk time.
2. `get(ids=[stable_id], include=["metadatas"])` to see if Chroma already has a record at that ID.
3. If yes and `metadata["content_hash"] == current_hash` → **skip entirely** (no re-embed, no upsert).
4. If yes and hash differs → **re-embed and upsert** (mark as updated in stats).
5. If no record → **embed and upsert** (mark as new).
6. After the walk, periodic GC: query all stored IDs scoped to this content collection, set-diff against the on-disk file list, delete records for files that no longer exist.

This makes a re-run fast and cheap when nothing changed, and surgical when little did.

## The sources-map artifact

A new file at `ai-labs/context-vigilance-kit/content-sources.md` (parallel to the existing `sources.md`). Same shape — YAML frontmatter is machine-consumable, body is human curation rationale.

Sketched frontmatter:

```yaml
---
title: "Lossless Content — Sources for Chroma Ingestion"
description: "Folders within lossless-monorepo holding non-context-v content files to ingest into Chroma with change detection."
date_created: 2026-05-08
date_modified: 2026-05-08
schema_version: 1
content_sources:
  - path: /Users/mpstaton/code/lossless-monorepo/content
    kind: lossless-content
    include: true
    subdirs:
      - essays
      - concepts
      - vocabulary
      - tooling
      - moc
      - organizations
      - projects
    note: "The big content tree — essays, concepts explainers, vocab, tooling notes, MOCs."
  - path: /Users/mpstaton/code/lossless-monorepo/astro-knots/sites/mpstaton-site/src/content
    kind: site-content
    include: false
    note: "Personal site content. Sensitive - opt in deliberately."
---
```

Schema decisions:

- **Field name `content_sources:`** (not `sources:`) so the same-named loader functions in different scripts can disambiguate.
- **`kind` values:** `lossless-content` (the canonical big tree), `site-content` (per-site Astro content collections), `legacy-content` (anything else). Add as needed.
- **`subdirs:` is an explicit whitelist** — most content trees have nested junk we don't want to ingest (build outputs, attached images, draft folders).
- **Default `include: false`** for newly-discovered roots, same opt-in-deliberately discipline as the corpus pipeline.

## The companion assembler

`scripts/assemble-content-sources.py` — analogous to `assemble-context-v-sources.py`. Walks the monorepo for candidate content roots and appends new finds to `content-sources.md` with `include: false`. Idempotent.

What constitutes a "candidate content root"? Heuristic for v0: any directory containing ≥10 markdown files at depth ≤3 inside a non-`context-v/`, non-`node_modules/`, non-`dist/`, non-`.git/` location. Refine the heuristic when it produces noise.

The user reviews and curates `content-sources.md` before the ingester runs against it.

## The ingester — `scripts/ingest-content-to-chroma.py`

End-to-end flow per file:

1. **Walk.** For each `include: true` source, recursively find `*.md` files under the configured `subdirs`. Skip the same SKIP_PATH_SUBSTRINGS as the corpus pipeline (`/context-v/extra/`, `/context-v/skills/`, `/context-v/changelog/`, `/context-v/changelogs/`) — even though we're targeting non-context-v content, files matching these patterns are still out of scope.
2. **Hash.** `sha256(file_bytes)` — fast, deterministic, no false positives.
3. **Stable ID.** `content::<source-slug>::<safe-relative-path>::<chunk-idx>`. The `content::` prefix namespaces these IDs so a future "find all content records" query is one metadata filter away.
4. **Look up.** `collection.get(ids=[file_id_chunk_0])` — checking just the first chunk's record is sufficient because we re-embed all chunks together when a file changes.
5. **Compare.** If stored `content_hash` matches current → skip. Increment `unchanged` counter and move on.
6. **Chunk.** If file is new or changed: split by `## ` headings (same convention as the corpus). Fall back to fixed-token splitting (~1000 tokens with 100 overlap) for files exceeding ~3000 chars without internal headings — many essays don't have `## ` structure.
7. **Embed + upsert.** Same default model (`all-MiniLM-L6-v2`) as the corpus. Metadata per chunk:

```yaml
source_path: <abs path>
path_from_monorepo_root: content/essays/Foo.md
source_kind: lossless-content        # mirrors sources entry
chunk_index: 0
chunk_heading: "Section title or empty"
content_hash: <sha256 of full file>
char_count: 12345
ingested_at: 2026-05-08
last_modified_mtime: 2026-05-08T...
```

8. **Track for GC.** Add the file's stable IDs to an in-process `seen_ids` set.
9. **Garbage collection.** After the walk: `collection.get(where={"source_kind": "lossless-content"})`, set-diff against `seen_ids`, `collection.delete(ids=...)` the orphans.

Stats output:

```
ingested into collection: lossless-content
  files seen:       4983
  unchanged:        4972  (skipped, hash match)
  updated:          8     (hash differed, re-embedded)
  new:              3     (no prior record)
  deleted:          5     (files no longer on disk)
  chunks total:     35921
  embedding cost:   ~0.3s per chunk × ~30 chunks = 9s of compute
```

## Collection naming and isolation

Two real options:

- **One collection per source kind.** `lossless-content`, `site-content`, etc. Filtering at query time by collection.
- **One unified `lossless-everything` collection.** Differentiated by `source_kind` metadata. Filter by `where={"source_kind": ...}` at query time.

**Recommend per-kind collections.** Smaller indexes mean faster queries when scope is known, and a future "kill the site-content ingest" decision is one `delete_collection()` call instead of a metadata-scoped delete that has to scan everything.

So the kit's `.chroma/` directory ends up hosting:

| Collection | Source | Rough size |
|---|---|---|
| `context-vigilance-corpus` | the curated context-v files | 4,833 chunks (current) |
| `lossless-content` | the ~5K content files | 30K-50K chunks (estimate) |
| `claude-code-sessions` | session transcripts (planned) | grows over time |

Cross-collection semantic queries are still possible — Chroma's MCP server exposes each collection as a separate resource, and Claude Code can `@`-mention either or both per query.

## Watch mode vs. cron mode

Real-time watching of 5K files across a monorepo (using `watchdog`) is doable but heavy — a long-running process with `inotify`/`fsevents` subscribed to many roots, plus the risk of missed events during process restarts.

**Recommend cron-friendly `--once` as the default.** A re-run with content-hash detection is fast (only embeds changed files), so running it every 15 minutes via launchd (macOS) or systemd timer is sufficient. Real-time `--watch` is a v1+ if/when sub-minute freshness matters.

Modes the script supports:

- `--once` — single pass, exit (default)
- `--gc-only` — skip ingestion, only do the orphan-cleanup pass
- `--no-gc` — skip the cleanup pass (useful when running against a partial source set)
- `--limit N` — for smoke testing
- `--source <slug>` — restrict to one source kind from `content-sources.md`
- `--reset` — drop and recreate the collection (rare; use after schema changes)

## Open sub-questions

- **Embedding cost trajectory.** Local Ollama via the default `all-MiniLM-L6-v2` is free; if we move to a hosted embedding API, 5K files × ~10 chunks each = 50K embeddings is real money. Hash-based skipping makes the *steady-state* cost trivial, but the *first run* still pays the full bill. Worth budgeting before the first full run.
- **What's the `content/` subset that's truly stable?** `essays/`, `concepts/`, `vocabulary/`, `tooling/` are mature. `MOCs/` (maps-of-content) update frequently. `organizations/`, `projects/` change as the world changes. Worth tagging stability per-source so query-time filters can prefer stable content.
- **Image/PDF/non-md content.** v0 is markdown-only. The content tree has images, PDFs, sometimes JSON. Add a `kind: pdf-content` reader later when the value justifies the build.
- **Cross-collection queries from the splash.** When the splash gets a semantic search box (per [[Add-Chroma-Local-UI-Interface]]), should it search `context-vigilance-corpus` only, all collections, or scope by user toggle? Lean: user toggle, default to corpus-only because that's the curated content.
- **Privacy.** Lower than transcript ingestion (these files are already in a git repo), but still: anything in `content/` that's marked `publish: false` or `private: true` in frontmatter should be skipped. Add to v0.
- **Content-hash collisions across files.** Stable-ID collisions are impossible (path-derived). Hash collisions across files are negligible (sha256). But two *different files* with the *same content* would have the same hash — fine, since they have different stable IDs and the hash is per-file not per-ID.

## Why this is a separate script, not a flag on the corpus ingester

Considered: extending `ingest-to-chroma.py` with a `--mode content` flag. Rejected because:
- Different sources file, different schema, different change-detection logic
- Different collection target
- Different embedding cost profile
- Different operational cadence (corpus rebuilds rarely, content runs every 15 min)

Two clean scripts beat one branchy one. They share helpers (parse_sources, repo_slug_for, iter_markdown_files, count_lines) which should eventually move into a shared `kit_lib.py` — but that refactor is out of scope here.

## Cross-references

- [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] — parent exploration; introduces Chroma as the multi-source ingestion substrate
- [[Collate-Context-Files-into-Context-Vigilance-as-Repo-&-Project]] — sister track; the corpus pipeline this content pipeline parallels
- [[Write-Custom-Chroma-MCP-Server]] — sibling plan; transcript ingestion is the third axis after corpus and content
- [[Add-Chroma-Local-UI-Interface]] — splash inspection surface that will need to handle multiple collections
- [[Tidy-Context-Vigilance-Files-Across-All]] — adjacent quality plan; content files have their own tidy story (not in scope here)
- `context-vigilance-kit/scripts/ingest-to-chroma.py` — the mature corpus pipeline to mirror for shape
- `context-vigilance-kit/scripts/assemble-context-v-sources.py` — the sources-map assembler to mirror for shape
- `context-vigilance-kit/sources.md` — the existing sources file; `content-sources.md` will be its sibling

## Outcome

*(Open. Update when the v0 ingester ships and a re-run cycle confirms the unchanged/updated/new/deleted counters move correctly across iterations.)*

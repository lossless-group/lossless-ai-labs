---
title: "Metadata on Paste — Make an Added Link Name Itself"
lede: "Fixes the three defects in Pasted-Link-Shows-Host-Instead-Of-Title: paste performs no fetch, Preview discards the metadata it learns, and the preview pane renders Jina's header block as article text. The fetch and the parse already work — the metadata simply never reaches the row, so a pasted a16z article displays as `a16z.com` while the correct title sits on screen one row below. Resolves four decision points and implements the cheap tier the two-tier convention already specified."
date_authored_initial_draft: 2026-08-08
date_authored_current_draft: 2026-08-08
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-08-08
at_semantic_version: 0.0.0.1
status: Draft
publish: false
category: Plan
augmented_with: Claude Code on Claude Opus 5 (1M context)
authors:
  - Michael Staton
tags:
  - Plan
  - Memopop-Native
  - Source-Curation
  - Metadata
  - Two-Tier-Fetch
  - Jina
from: "memopop-ai"
from_path: "context-v/plans/Metadata-On-Paste-For-Source-Curation.md"
---
# Metadata on Paste

> Implements the fix for [[../issues/Pasted-Link-Shows-Host-Instead-Of-Title]]. The diagnosis is there; this is the decisions and the build.

## The shape of the fix

Three defects, one path:

| | Defect | Fix |
|---|---|---|
| **A** | `add()` fetches nothing — `title: ''` → row renders `hostOf(url)` | Paste fires the cheap tier |
| **B** | `preview()` learns title/date, writes only `previews[url]` | Both paths merge into `rows` via one shared method |
| **C** | `/actions/fetch-source` returns raw Jina text, preamble and all | Return the parsed body + lifted fields |

The server already parses correctly (`parse_jina_preamble`, unit-tested). Nothing new needs inventing — the work is plumbing what exists into the row the analyst actually looks at.

## Decisions

**D1 — Fetch on paste, capped at 3 concurrent. Decided: fetch immediately.**
An analyst pasting ten links in a row would otherwise fire ten simultaneous Jina calls. Deferring to blur or a batch button adds a step to the action reached for most often, which is the wrong trade on a surface whose founding complaint was "going through them takes forever". Immediate fetch, a small concurrency gate, and the row is usable the instant it appears — the title just arrives a beat later.

**D2 — Paste writes a `candidate` source file. Decided: yes.**
This is precisely the candidate tier `source-with-extracts-md` describes: *"On save, pull cheap metadata + a ~200-char excerpt."* Writing it means on-disk state matches the list from the first moment rather than only after someone happens to click Preview. Cost is one small file per pasted URL, with `content_pulled: false` — the full body still waits for promote. The alternative (metadata in memory only) recreates the exact bug this plan fixes, one layer down.

**D3 — Strip the preamble from the body; surface `published_at` in the row meta. Decided: strip.**
The header is provenance, not content, and Preview's job is answering *"is this real content"*. Four lines of `Title: / URL Source: / Published Time: / Markdown Content:` in front of the article actively works against that. The information isn't lost — it moves to where it belongs: `published_at` on the row's meta line, `fetched_via` in `extra_metadata`.

**D4 — No retro-fix pass. Decided: defer.**
ImmuneCo's 79 sources already carry titles, so this only affects newly pasted rows. A "fetch missing metadata" bulk action is easy to add later against `rows.filter(r => !r.title)`, and building it now would be speculative. Revisit if a real deal shows up with untitled rows at volume.

**D5 (new) — Analyst-typed titles always win. Decided: never overwrite a non-empty title.**
A scraped `<title>` is frequently worse than what a person typed — SEO suffixes, site names, truncation. The merge is fill-the-blanks, not replace. This also makes the fetch idempotent and safe to re-run.

## Build

**Server — `/actions/fetch-source`**
Return the parsed shape rather than the raw string, since the parse already happens for persistence:
`{ markdown (body only), title, published_at, publisher, excerpt, saved_to }`.
Add `metadata_only: bool` so paste can request the cheap tier — same endpoint, `full=False`, writes a `candidate` file and skips storing the body.

**Store — `sources.svelte.ts`**
- `applyFetchedMetadata(url, res)` — one merge point for both paths. Fill-the-blanks per D5, then `touch()` so autosave persists it.
- `add()` becomes fire-and-forget: insert the row, then `void this.fetchMetadata(url)`.
- `fetchMetadata(url)` — cheap tier, concurrency-gated per D1.
- `preview()` calls the same merge, so previewing also corrects a bad title.
- Per-row `fetchingMeta` set so the UI can show the pending state.

**UI — `SourceApproval.svelte`**
Row title shows the host with a subtle "fetching…" affordance while pending; `published_at` joins the meta line.

## Acceptance

- Pasting the a16z URL yields a row titled **“GMV Retention: The Marketplace Metric Most Ignore”**, not `a16z.com`.
- That row's meta line shows `2022-04-28`.
- `inputs/sources/2026-08-08_gmv-retention-the-marketplace-metric-most-ignore.md` exists with `status: candidate`, `content_pulled: false`, a populated `excerpt`, and no body.
- Preview on that row shows article prose from the first line — no `Title:` / `URL Source:` header.
- Editing a title by hand, then re-previewing, leaves the typed title intact.
- A paste whose fetch fails still leaves a usable, approvable row showing the host.
- Re-search works on a pasted row (it needs the title that was previously missing).

## References

- [[../issues/Pasted-Link-Shows-Host-Instead-Of-Title]] — the diagnosis.
- `agent-skills/source-with-extracts-md` — the two-tier rule D2 implements.
- `corpora-builder/context-v/blueprints/Source-File-Schema-Reconciliation.md` — `title` / `published_at` semantics.

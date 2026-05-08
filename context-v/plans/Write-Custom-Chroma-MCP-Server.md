---
title: "Write Custom Chroma MCP Server (v0: a session-transcript ingester)"
lede: "Defer the community djm81/chroma_mcp_server. Roll our own session-transcript ingester that writes into the same Chroma instance our corpus already lives in — preserving the metadata alignment that lets us cross-query corpus and conversation history together."
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
  - MCP
  - Agent-Traces
  - Session-Transcripts
  - Context-Engineering
status: Draft
---

# Write Custom Chroma MCP Server (v0: a session-transcript ingester)

## Title note

The filename says "Custom Chroma MCP Server." **What we actually build at v0 is a session-transcript ingester** — a Python process that watches Claude Code's session JSONL files and upserts chunks into the existing Chroma instance via the same `chroma-core/chroma-mcp` we've already wired up. A *full* custom MCP server (replacing chroma-core's) is a v1+ ambition; the title leaves room for that evolution. Read this plan as the v0 ingester scoped under that broader umbrella.

## What this plan is for

We have:
- Chroma running in `PersistentClient` mode against `.chroma/` in the kit
- The first-party `chroma-core/chroma-mcp` wired into Claude Code at user + project scope
- 4,833 chunks of curated corpus already ingested

What we do **not** have, and what this plan adds:
- Anything that captures Claude Code session transcripts into Chroma
- A way to ask "show me past sessions where I worked on the splash" or "did we already debug this MCP issue?"

The original [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] exploration listed transcript-ingestion as a "stretch within v0." This plan is the concrete commitment to that stretch.

## Why custom over the community option

We considered the community [`djm81/chroma_mcp_server`](https://github.com/djm81/chroma_mcp_server) which ships an `auto_log_chat` IDE-rule mechanism for chat ingestion. Three reasons to roll our own instead:

1. **Custom metadata is the asset, not the liability.** The corpus is indexed with `source_root`, `source_repo_slug`, `kind`, `bucket`, `chunk_index`, stable IDs of shape `<repo>::<rel-path>::<chunk-idx>`. A *parallel* shape on transcripts (`session_id`, `turn_index`, `project`, `role`, `tools_used`, `timestamp`) lets us cross-query corpus + conversation in the same Chroma instance. The community server auto-creates its own collections with its own shape — we'd lose the alignment.
2. **`auto_log_chat` is Cursor-IDE-rule-targeted.** Making it fire from Claude Code requires building a hook anyway. At that point we've replaced one custom component without saving custom work.
3. **One MCP server is simpler than two.** Adding djm81 alongside `chroma-core/chroma-mcp` doubles the entries in `~/.claude.json` and project `.mcp.json` files; double the things to break when versions move.

What we explicitly give up: djm81's *bidirectional linking* (auto-connect a session to the code changes that came out of it) and *auto-summarization*. Both are real features. Both can be added later as scripts on top of the v0 ingester foundation.

## Pre-requisite — redaction layer (do not skip)

**Claude Code session transcripts contain everything the agent saw, including secrets.** Files read from disk before they were gitignored. API keys printed during debug. Database URLs paste-injected. *Before any transcript hits Chroma*, the ingester must strip these. The cost of skipping this is permanent — a vector store doesn't have a "redact in place" — and embeddings of secrets are still leakable via similarity search.

A separate spec at `context-vigilance-kit/context-v/specs/Transcript-Redaction-Layer.md` should land before the ingester ships. Minimum scope:
- Regex-based scrubbing of common secret formats (AWS keys, OpenAI/Anthropic keys, GitHub tokens, JWT-shaped strings)
- File-content redaction when the transcript shows large file reads (replace with `<redacted-file-contents-of-N-bytes>`)
- An allowlist for file paths the user explicitly tags as safe to ingest verbatim
- Off-by-default behavior: ingest fails closed if the redaction module isn't loaded

## v0 scope — what we build

**Single Python process** at `ai-labs/context-vigilance-kit/scripts/ingest-claude-sessions.py`.

Behavior:
1. **Source.** Watches `~/.claude/projects/-Users-mpstaton-code-lossless-monorepo-ai-labs/` for new or modified `.jsonl` session files. (Other Claude Code projects can be added by extending the watch list.)
2. **Read.** Each `.jsonl` is a sequence of turn records — user messages, assistant responses, tool calls, tool results.
3. **Redact.** Pipes through the redaction module (pre-req above). Failure-closed.
4. **Chunk.** Per *user-turn boundary* — a chunk is one user message plus the assistant turn(s) that followed it through the next user message. This preserves conversational coherence in a way `## ` heading splitting can't (transcripts have no headings).
5. **Embed.** Same default embedding model the corpus uses (`all-MiniLM-L6-v2` via onnxruntime, already cached at `~/.cache/chroma/`).
6. **Upsert.** Stable ID format: `session::<session-id>::turn::<turn-idx>`. Chroma collection: `claude-code-sessions` (sibling to `context-vigilance-corpus` in the same `.chroma/` instance).
7. **Metadata per chunk:**
   ```
   session_id            (UUID from filename)
   turn_index            (int)
   role                  (user | assistant | system)
   timestamp             (ISO from the turn)
   project               (the slug derived from the .claude/projects dir name)
   tools_used            (comma-separated; empty if none)
   ingested_at           (ISO date)
   ```

Modes:
- `--once` — single sweep, exit (cron-friendly).
- `--watch` — `inotify`/macOS `fsevents` style watcher (use `watchdog` Python package).
- `--limit N` for smoke testing.

## Cross-querying — the payoff this enables

With both collections in the same Chroma instance, queries like:

- *"Show me sessions in the last week that retrieved corpus chunks tagged `bucket=worked-on` from `astro-knots`."* — join via metadata + similarity
- *"What's the overlap between the sessions where we discussed splash conventions and the corpus docs about `maintain-splash-pages`?"* — semantic similarity across collections
- *"Did we already debug this MCP issue?"* — query `claude-code-sessions` for current-error text; surface prior turns that hit similar error strings

These queries become the agent's working memory. The MCP server we already have (chroma-core/chroma-mcp) exposes both collections to Claude Code via `@`-mentions automatically — no MCP changes needed. The ingester is the only new component.

## Open sub-questions

- **Watcher granularity.** Re-ingest the whole file on every mtime bump (simple, redundant), or track byte-offsets per file (efficient, more bookkeeping)? Lean: simple-and-redundant for v0; idempotent upserts on stable IDs make redundancy harmless.
- **Cross-project scope.** v0 watches only `-Users-mpstaton-code-lossless-monorepo-ai-labs/`. When do we expand to other Claude Code projects? Decide after one week of single-project ingestion shows the value/cost ratio.
- **Pi sessions.** Pi has its own session log format. Should the ingester be source-agnostic with pluggable readers (Claude JSONL, Pi format, future-X)? Lean: yes — design the ingester with a `Reader` interface from the start, even if only one implementation lands at v0.
- **Eviction / TTL.** Sessions accumulate. Do we keep all of them forever, or compact older sessions into summaries? See [[memory-layers-for-agents]] study (mem0, OpenClaw "dreaming" cycle) for the conventions in this space. Punt to v1.
- **When does this become a "custom MCP server" proper?** When the ingester needs to expose query primitives that `chroma-core/chroma-mcp` doesn't (e.g., session-aware search, cross-collection joins, summary-on-demand). Until then, ingester + first-party MCP is sufficient.

## Future direction (v1+) — the *actual* custom MCP server

When this v0 ingester accumulates enough complexity (cross-collection queries, summary generation, bidirectional linking to code changes), the natural evolution is to *replace* `chroma-core/chroma-mcp` with our own MCP server that wraps the underlying Chroma instance and exposes higher-level tools to Claude Code:

- `recall_session(query)` — semantic search over `claude-code-sessions` with summary post-processing
- `link_session_to_commit(session_id, commit_sha)` — bidirectional linking djm81 has natively
- `summarize_session(session_id)` — agent-driven session summarization stored as a derived collection
- `cross_query(corpus_query, session_query)` — joins surfaced as a single tool

That's the doc's filename in scope. v0 is just the substrate.

## Cross-references

- [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] — parent exploration; this plan operationalizes the "session-transcript ingester" stretch goal
- [[Collate-Context-Files-into-Context-Vigilance-as-Repo-&-Project]] — Track 3 of which this is the conversational complement to the corpus track
- [[Add-Chroma-Local-UI-Interface]] — sibling plan; UI inspection is how we'll verify the session collection populates correctly
- [[memory-layers-for-agents]] study at `ai-labs/studies/memory-layers-for-agents/` — `mem0`, `neo`, `OpenClaw` writeup. Re-read before sealing eviction/compaction decisions
- [[feedback_mcp_project_scope]] memory — MCP scoping discipline that applies if/when we wire a custom MCP server later
- `context-vigilance-kit/scripts/ingest-to-chroma.py` — the corpus ingester; the new transcript ingester should mirror its shape (parse-source, chunk, upsert, idempotent)

## Outcome

*(Open. Update when the v0 ingester ships, or when we revisit and decide djm81 is actually the better path after all.)*

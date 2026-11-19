---
name: Logseq Profile
title: Logseq — Profile
slug: logseq
upstream: https://github.com/logseq/logseq
pinned_sha: 4f754fccee
pinned_date: 2026-11-19
version_at_pin: "nightly-37-g4f754fccee (nearest tag: nightly)"
license: AGPL-3.0
maintainer: The Logseq team (logseq org)
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/logseq
profile_kind: Block outliner — ClojureScript app over a DataScript graph persisted to SQLite
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Reference
site_uuid: 4a33bd84-b9c4-4ff5-b099-0f37269a42f2
hex_code: o4rrsb
lede: >-
  The archetypal Markdown outliner has quietly stopped being a Markdown app:
  on master the graph lives in SQLite, and Markdown is now an import format
  and a one-way mirror.
summary: >-
  Profile of Logseq as pinned in the content-authoring-tools study. Covers the
  move from file graphs to DB graphs (DataScript datoms stored in a single
  SQLite kvs table), the Electron-only Markdown Mirror that writes derived
  .md files the DB never reads back, and the agent surface that replaced the
  files: a token-gated local HTTP API with an MCP endpoint, an OCaml/Melange
  CLI that installs its own agent skill, and an AgentBridge that routes TODO
  blocks assigned to an agent into Codex sessions.
tags:
  - Profile
  - Logseq
  - Outliner
  - PKM
  - SQLite
  - MCP
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Logseq.md"
---
# Logseq — Profile

A profile of Logseq as it lives in this study (`studies/content-authoring-tools/logseq`, pinned at `4f754fccee`, 2026-11-19, `nightly` channel). AGPL-3.0, ClojureScript (shadow-cljs), React via Rum, DataScript, Electron desktop plus Capacitor mobile.

The study README pinned Logseq to ask *"how does a block-first model serialize to plain files, and what happens as the project moves toward a database-backed version?"* The pinned source answers the second half definitively: the move already happened.

## TL;DR

On master, file graphs are gone. A run of commits on 2026-01-22 (`git log --grep "file graph"`: `ab137a962a fix: remove file graph imports`, `6312f8236a fix: remove file graph :block/file and dependent code`, `a6c3569ea3 fix: remove most file-graph references from frontend and electron`) removed the code path where a page *was* a `.md` file. What remains is a DB graph, an importer for old Markdown/org graphs, and a derived Markdown mirror.

**One sentence:** *Logseq is now an agent-reachable database that can emit Markdown, not a Markdown folder an agent can edit — and it compensated by building one of the most agent-forward surfaces in the study.*

## How it works

- **Stack.** ClojureScript compiled by shadow-cljs; UI in Rum (React wrapper); document state in DataScript, an in-memory Datalog database (`CODEBASE_OVERVIEW.md`). A DB worker owns the graph; the renderer talks to it.
- **Persistence.** DataScript storage serialized into one SQLite table: `create table if not exists kvs (addr INTEGER primary key, content TEXT, addresses JSON)` (`deps/db/src/logseq/db/common/sqlite.cljs:13`). The schema is the DataScript schema, not SQL; the SQLite file is a key-value page store of datom chunks.
- **Sync.** A new "RTC" sync, in alpha, backed by a Cloudflare worker with D1 migrations (`deps/db-sync/worker/migrations/`). The README is blunt: the DB version is beta and *"data loss is possible"* (`README.md:73`).
- **Plugins.** `@logseq/libs` (`libs/`), iframe/shadow-sandboxed, async RPC over `postMessage`; plugins query via `logseq.DB.q` (Datalog) and must branch on `checkCurrentIsDbGraph()` (`libs/SKILL.md`).

## What's on disk

A graph directory holds `db.sqlite` (plus `search-db.sqlite` and `client-ops-db.sqlite`, which backups exclude: `docs/cli/logseq-cli.md`, "Backup scope note"). Nothing in it is readable without DataScript.

If the Markdown Mirror is on, Electron additionally writes `mirror/markdown/pages/<Title>.md` and `mirror/markdown/journals/<date>.md`, plus a path-stability index at `mirror/markdown/.index.edn` (`docs/adr/0016-markdown-mirror.md:22-30`, `:90-98`). The mirror syntax (`docs/logseq-markdown-syntax.md:6-62`):

```markdown
id:: 11111111-1111-4111-8111-111111111111

* page-property:: [[Page value]]

- Oscar Wilde
  * description::
    - Irish poet and playwright
  * books::
    - The Picture of Dorian Gray
      * year:: 1891
```

Note the split: blocks are `-` bullets, properties are `*` bullets with `key::`, so a parser can tell them apart without context.

## Agent reach

Read: yes, several ways. Write: yes, but **never through the files**.

- **Mirror is write-only from the app's side.** *"Markdown Mirror is derived output. The DB remains the source of truth"* and *"Files under `mirror/markdown/**` must be ignored by graph import, file watchers, and graph parsing so the mirror never feeds back into the graph"* (`docs/adr/0016-markdown-mirror.md:31-33`). An agent editing a mirror file is editing a cache.
- **Local HTTP API + MCP.** The Electron app runs a server on port `12315` by default (`src/electron/electron/server.cljs:22`), token-checked (`:84-94`), with `POST /api` and an MCP Streamable-HTTP endpoint at `/mcp` (`:146-150`). Tools: `getPage`, `listPages`, `listTags`, `listProperties`, `searchBlocks`, and a batch `upsertNodes` with `add|edit` × `block|page|tag|property` and a `dry-run` flag (`src/electron/electron/mcp_server.cljs:101-121`, `:193-197`).
- **CLI.** `logseq` is a Node program compiled from OCaml via Melange (`cli/package.json`, `cli/lib/*.ml`) that spawns and manages a headless `db-worker-node` per graph. It takes Markdown outline input (`logseq upsert block --blocks $'- Parent\n  - Child'`), resolves `[[Page]]` to UUID links, and supports `--dry-run` that prints planned outliner ops (`docs/cli/logseq-cli.md:331-360`).
- **The CLI installs its own agent skill**: `logseq skill install [--global]` writes `./.agents/skills/logseq-cli/SKILL.md` (`docs/cli/logseq-cli.md:178-181`).

## What's clever or unique

1. **AgentBridge: tasks in the graph are an agent's inbox.** `cli/lib/agent.ml` routes a block to an agent only if it has a stable UUID, carries the `Task` tag, has status `todo`, lists the agent's name in `:logseq.property/assignee`, and has no `:logseq.property.agent/session-id` yet (`cli/lib/agent.ml:154-166`). It then runs `codex --sandbox danger-full-access exec` (`:183-193`) and writes the session id back onto the block. The master prompt enforces a write discipline: *"Only the master agent may write task results back into the target graph. Subagents may read graph context but must not write graph content"* (`:43-45`). Replies go in as comments, referencing result blocks by `[[block-uuid]]` (`:72-80`). Assignment, status and agent session are all just properties on a block — the human's task list *is* the job queue.
2. **A mirror that refuses to guess.** Duplicate titles get stable `Foo (2).md` suffixes that never renumber; two entities mapping to one path *fail the job with a diagnostic instead of overwriting* (`docs/adr/0016-markdown-mirror.md:82-106`); a write guard rejects any path outside `mirror/markdown/` (`:111-112`). That is the careful version of "export to files", and it keeps UUID identity out of filenames so Obsidian and Emacs stay happy (`:77-81`).
3. **Dry-run everywhere an agent writes.** Both MCP `upsertNodes` and the CLI accept `dry-run` and return planned ops plus `would-create-pages` without committing. Cheap, and exactly what an agent needs before a destructive batch.
4. **Typed properties with schema coercion.** In CLI Markdown input, `key:: value` sets an *existing* property and coerces to its schema type; unknown properties fail (`docs/cli/logseq-cli.md`, "Markdown block input"). Structure is enforced at write time, not discovered at read time.
5. **A local embedding sidecar.** `sidecar/embedding_server.py` serves `all-MiniLM-L6-v2` sentence-transformers over HTTP for semantic search, launched from Electron (`src/electron/electron/embedding_server.cljs`).

## Costs / limits

- **The plain-file promise is broken.** A graph is a SQLite blob of DataScript chunks. `rg`, git diffs, and file-sync tools see nothing meaningful. The mirror is one-way and Electron-only (`docs/adr/0016-markdown-mirror.md:34-35`).
- **Beta with data-loss warnings**, plus an alpha sync, on the version that is now the only version on master.
- **Agent surfaces need a running process** — the Electron app (API/MCP) or a CLI-managed `db-worker-node`. No offline file edit path exists.
- **Codex-specific bridge.** AgentBridge hard-codes the `codex` binary and its flags (`cli/lib/agent.ml:175-193`).

## Relevance to flave

- **Avoid Logseq's trajectory.** It is the cautionary tale for flave's "the directory is the working format" bet: once the DB became the source of truth, Markdown became a lossy export. Compare [[Profile__SilverBullet]], which kept files canonical and solved concurrency with merge instead.
- **Borrow the task-as-agent-inbox pattern.** A `TODO` block with an `assignee` and an `agent-session-id` property is a clean, in-document protocol for "hand this to an agent and record what happened" — worth mapping onto flave's operation set and `.flave/review/` area.
- **Borrow `dry-run` on every agent write path** — the planned-ops response is a natural preview for flave's "four callers, one operation set".
- **Borrow the `*` vs `-` split** for properties vs blocks if flave ever needs block-level metadata in prose; it is unambiguous to parse.
- **Note `logseq skill install`**: a tool that ships the agent skill for itself is a cheap, high-leverage habit flave could copy.

## Read next

- `docs/adr/0016-markdown-mirror.md` — the whole derived-files contract
- `cli/lib/agent.ml:30-80`, `:154-193` — AgentBridge prompt, routing rules, Codex launch
- `src/electron/electron/mcp_server.cljs:101-232` — the MCP tool set
- `docs/cli/logseq-cli.md:122-216`, `:331-360` — CLI commands and Markdown block input
- `docs/adr/` — 23 ADRs on sync, undo, and the DB transition

## Related

- [[Profile__SiYuan]] — the other block outliner; JSON-per-document on disk rather than a DB blob
- [[Profile__SilverBullet]] — files stay canonical; concurrency via three-way merge
- [[Profile__Trilium]] — SQLite from the start, honest about it, with ETAPI and MCP
- [[Profile__Baalda]] — plain `.md` plus CRDT plus MCP, the bridge Logseq chose not to build
- [[Profile__Anytype]], [[Profile__AFFiNE]] — other DB/CRDT-as-truth stores

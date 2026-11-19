---
name: SiYuan Profile
title: SiYuan — Profile
slug: siyuan
upstream: https://github.com/siyuan-note/siyuan
pinned_sha: e6794a0c44
pinned_date: 2026-11-19
version_at_pin: "v3.8.11"
license: AGPL-3.0 (open source; some features gated to paid membership)
maintainer: siyuan-note org / b3log — editor engine Lute by 88250
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/siyuan
profile_kind: Block-based PKM — Go kernel + TypeScript/Electron UI, one JSON AST file per document
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
site_uuid: 56254994-2129-4e05-867e-86afbac8ec84
hex_code: s2k6bz
lede: >-
  Every document is a file, but the file is a serialized editor AST rather than
  Markdown — and the kernel has grown a full agent runtime, an MCP server with
  per-action read/write declarations, and a written spec telling agents when
  not to touch the files.
summary: >-
  Profile of SiYuan as pinned in the content-authoring-tools study. Covers the
  .sy format (Lute AST serialized to JSON, filename equals block ID,
  parent.sy plus same-named directory for children), the rebuildable SQLite
  indexes that make direct file writes risky, the three sanctioned mutation
  paths (HTTP API, MCP, CLI), and the agent layer inside the Go kernel: a
  built-in multi-provider agent, workspace skills in data/storage, a
  long-term-memory store of canonical Markdown records, and MCP tools that
  declare LocalRead/LocalWrite effects per action.
tags:
  - Profile
  - SiYuan
  - Outliner
  - PKM
  - MCP
  - Agent-Runtime
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__SiYuan.md"
---
# SiYuan — Profile

A profile of SiYuan as it lives in this study (`studies/content-authoring-tools/siyuan`, pinned at `e6794a0c44`, tag `v3.8.11`, 2026-11-19). AGPL-3.0. Go kernel (`kernel/`), TypeScript UI (`app/`) in Electron, plus Android, iOS and HarmonyOS shells; the editor engine is Lute (`github.com/88250/lute`) and the data repo/sync layer is dejavu (README architecture table).

The README tagline has changed since this study's kickoff: *"From thought to insight, with agents."* The kernel backs it up.

## TL;DR

SiYuan sits between [[Profile__Logseq]] and [[Profile__SilverBullet]]: files on disk, one per document, but each file is the editor's AST in JSON, not Markdown. An agent *can* read and write those files, and the project publishes a careful spec for doing so — while telling agents to prefer the API, MCP or CLI because direct writes desynchronize the indexes.

**One sentence:** *SiYuan is the most agent-equipped app in this group, but its "files" are a format only SiYuan writes fluently, so agent reach really means kernel reach.*

## How it works

- **Kernel.** A Go server (`kernel/main.go`, gin router) owns serialization, block-ID allocation and indexing. The UI is a client of it, even on desktop.
- **Indexes are derived.** `temp/siyuan.db` (FTS5), `temp/blocktree.db` (block ID → file path), `asset_content.db`, `history.db` — all rebuildable (`docs/WORKSPACE.md:15-62`, "Persistent data vs rebuildable indexes").
- **Sync.** A snapshot data repo under `<workspace>/repo/` (dejavu). Third-party sync disks are explicitly unsupported: *"otherwise data may be corrupted"* (`README.md:497`). Cloud sync targets are a paid feature (`README.md:499`).
- **Encryption.** Per-notebook encryption; encrypted `.sy` files are ciphertext and the CLI refuses them (`README.md:408`).

## What's on disk

```
data/<boxID>/
  <docID>.sy          # document = JSON AST; filename = root block ID
  <docID>/            # same-named dir holds that doc's children
    <childID>.sy
```

*"Document `A`'s on-disk representation = the `A.sy` file + the `A/` directory"* — the hierarchy is the directory tree, so moving a doc means moving its directory too (`docs/WORKSPACE.md:118-140`). IDs are `YYYYMMDDHHMMSS-xxxxxxx`, creation time plus seven random characters (`docs/WORKSPACE.md:255`).

A real file from the bundled guide (`app/guide/20240530133126-axarxgx/20240530101000-znj103k.sy`, truncated):

```json
{
  "ID": "20240530101000-znj103k",
  "Spec": "2",
  "Type": "NodeDocument",
  "Properties": { "id": "20240530101000-znj103k", "title": "感謝の言葉",
                  "type": "doc", "updated": "20261016202856" },
  "Children": [
    { "ID": "20240530101000-tgqo8nb", "Type": "NodeParagraph",
      "Properties": { "id": "20240530101000-tgqo8nb", "updated": "20240530101000" },
      "Children": [ { "Type": "NodeText", "Data": "SiYuan は、多くの…" } ] }
  ]
}
```

*"A plaintext `.sy` file is a Lute AST tree serialized to JSON… There is no separately maintained JSON Schema — the Lute `ast.Node` and `ListData` Go structs are the serialization source of truth"* (`docs/SY-FORMAT.md:13`). Block attributes travel as an IAL map (`Properties`), which Markdown export renders as kramdown `{: key="value"}`.

## Agent reach

Read: yes. Write: yes — through four doors, ranked by the project itself (`docs/SY-FORMAT.md:33-52`):

| Path | Role |
|---|---|
| HTTP API (`Authorization: Token …`, `docs/API.md:153`) | Richest; full CRUD on docs/blocks/transactions |
| MCP (`/mcp`, admin role required, `kernel/mcp/server.go:44`) | Subset for agents |
| CLI (`siyuan notebook list -w ~/SiYuan`, `README.md:404-425`) | Offline: search, export, SQL; no server needed |
| Raw `.sy` | Bulk/offline only; needs an index rebuild after |

The MCP surface is wide: ~56 tool files (`kernel/mcp/tools/`), consolidated as action-multiplexed tools — `document`, `block`, `sql`, `search`, `database`, `memory`, `skill`, `template`, `sync`, `decision`, `question`, `todo_write`, `web_fetch`, and more.

## What's clever or unique

1. **Tools declare their effects per action.** `DocumentTool` carries `EffectScope: EffectScopeLocal` and an `ActionEffects` map — `get`/`list` are `LocalRead`, `create`/`delete`/`move` are `LocalWrite` (`kernel/mcp/tools/document.go:18-31`). An action-multiplexed tool still tells the host exactly which calls mutate. That is the right granularity for approval prompts.
2. **A format spec written for agents.** `docs/SY-FORMAT.md` distinguishes *canonical writes* from *compatible reads* (`:17-27`), versions the document `Spec` per feature (`"2"`…`"7"`, never lowered: `:80`), and opens with *when not to use it*. Companion docs (`WORKSPACE.md`, `DOCUMENT-ADDRESSING.md`, `API-CONTRACTS.md`) make the store legible without reading Go.
3. **The agent runtime lives in the kernel.** `kernel/agent/` holds a provider-agnostic loop (Anthropic, OpenAI, Gemini tests), compaction, a `doom_loop.go` guard, tool-round limits, and a `decision` tool for structured human choices over block IDs (`kernel/mcp/tools/decision.go`). The same tools serve the built-in agent and external MCP clients.
4. **Skills and memory are files in the workspace.** Skills live at `data/storage/ai/agent/skills/<dir>/SKILL.md`, with `~/.agents/skills` shown read-only alongside; edits require the item's current revision and there is *no force-overwrite* (`docs/SKILL-MANAGER.md:5`, `:17-19`). Long-term memory *"uses canonical Markdown records… It does not add SQLite, vector search, a knowledge graph"* (`docs/LONG-TERM-MEMORY.md:11`), with explicit remember / correct / suspend / forget semantics.
5. **A standalone Markdown editor that stays out of the workspace.** `docs/MARKDOWN-EDITOR.zh-CN.md` designs a sandboxed window that edits user-authorized external `.md` files directly — no import, no `.sy`, no workspace sync.

## Costs / limits

- **Not Markdown on disk.** `.sy` is deeply nested JSON with marker nodes (`NodeCodeBlockFenceOpenMarker`, `NodeOpenBracket`…, `docs/SY-FORMAT.md:149`). A text diff of a one-word edit is noisy; `rg` works, but a hand edit is a structural edit.
- **Direct writes break invariants.** Block refs depend on `blocktree.db`; skip the rebuild and links and search go stale (`docs/SY-FORMAT.md:35`, `:52`).
- **Hostile to file sync.** Dropbox/Syncthing of the workspace is explicitly unsupported.
- **Open source, paid features.** *"Some features are only available to paid members"* (`README.md:114`).
- **Scale of the kernel.** The agent and MCP layers are large and fast-moving (`AGENTS.md` alone is a dense operations manual); integrating against them means tracking a moving target.

## Relevance to flave

- **Borrow per-action effect declarations** (`LocalRead`/`LocalWrite`) for flave's operation set; it is the data an approval UI and a clearance check both need.
- **Borrow the "canonical write vs compatible read" discipline** and a monotonically increasing per-document `Spec` for the `.flave` format — upgrade on write, never downgrade.
- **Avoid AST-as-file.** SiYuan shows the cost: the store is reachable but not authorable by anything except the kernel. flave's Markdown-first source keeps a plain-text diff meaningful.
- **Note the skills-in-workspace pattern with revision-checked writes** — a skill directory beside the documents, edited with optimistic concurrency, is a good fit for trigger-pack definitions.
- **Note the memory design** (Markdown records, provenance, explicit forget) as prior art if flave ever keeps agent memory per document.

## Read next

- `docs/SY-FORMAT.md:1-140` — the format, and when not to write it directly
- `docs/WORKSPACE.md:15-140`, `:251-290` — layout, parent/child pairing, IDs
- `kernel/mcp/server.go:40-46` and `kernel/mcp/tools/document.go` — MCP auth and a typical tool
- `kernel/agent/` — the built-in agent loop
- `docs/LONG-TERM-MEMORY.md`, `docs/SKILL-MANAGER.md` — workspace-resident agent state

## Related

- [[Profile__Logseq]] — the other block outliner, which went further and put everything in a DB
- [[Profile__SilverBullet]] — Markdown files as truth; the opposite answer to "what's on disk"
- [[Profile__Trilium]] — SQLite store, also with an in-app agent and MCP, and a "hide from LLM" label
- [[Profile__Anytype]], [[Profile__AppFlowy]], [[Profile__AFFiNE]] — other local-first stores with their own APIs

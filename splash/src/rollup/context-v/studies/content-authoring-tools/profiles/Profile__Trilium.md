---
name: Trilium Profile
title: Trilium — Profile
slug: trilium
upstream: https://github.com/TriliumNext/Trilium
pinned_sha: 76561ae16c
pinned_date: 2026-11-22
version_at_pin: "v0.108.0-rc.1-189-g76561ae16c (nearest tag: v0.108.0-rc.1)"
license: AGPL-3.0
maintainer: TriliumNext community (successor to zadam/trilium) — Elian Doran et al.
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/trilium
profile_kind: Hierarchical note store — TypeScript monorepo over a single SQLite database
date_created: 2026-11-19
date_modified: 2026-11-23
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Reference
site_uuid: eead2203-62ac-424b-9a39-3081f0b86e50
hex_code: 4mxwfp
lede: >-
  Honest about being a database: no files to edit, but a typed REST API, an
  MCP server whose tools convert HTML notes to Markdown at the agent boundary,
  and a single label that makes any subtree invisible to the LLM.
summary: >-
  Profile of Trilium (TriliumNext) as pinned in the content-authoring-tools
  study. Covers the SQLite schema (notes, branches for multi-parent cloning,
  attributes as labels and relations, content-addressed-ish blobs, an
  entity_changes log that drives sync), the rule that every write goes through
  the Becca cache, ETAPI with an OpenAPI spec, the token-gated MCP endpoint
  with read-only/destructive hints, in-app chat that drives Claude Code, Codex,
  Copilot and Antigravity as subscription agents, and the excludeFromLlm label.
tags:
  - Profile
  - Trilium
  - PKM
  - SQLite
  - MCP
  - ETAPI
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Trilium.md"
---
# Trilium — Profile

A profile of Trilium as it lives in this study (`studies/content-authoring-tools/trilium`, pinned at `76561ae16c`, 2026-11-22, 189 commits past `v0.108.0-rc.1`). AGPL-3.0. A pnpm TypeScript monorepo: Preact client (`apps/client`), Express + better-sqlite3 server (`apps/server`), Electron desktop, an in-browser "standalone" build on SQLite WASM + OPFS, a Capacitor mobile shell, and a shared `packages/trilium-core` (`CLAUDE.md`, "Monorepo Structure").

The study README pinned it as *"SQLite-backed tree with attributes and relations; agents reach it via ETAPI or the DB directly."* The first half holds. The second half — "or the DB directly" — is something the project tells contributors not to do.

## TL;DR

There is no file-per-note anywhere: everything is rows in one SQLite file. In exchange, Trilium has the cleanest *typed* agent surface in this group: ETAPI with an OpenAPI spec, plus an MCP server built on the same tool registry as its in-app chat, with Markdown as the agent-facing text format.

**One sentence:** *Trilium is the study's well-behaved database — unreachable by `rg`, but with an API an agent can trust, and the only per-note "keep this away from the LLM" switch in the group.*

## How it works

- **Schema** (`packages/trilium-core/src/assets/schema.sql`): `notes` (title, `type`, `mime` default `text/html`, `blobId`, soft-delete fields: `:32-45`), `branches` (`noteId`, `parentNoteId`, `notePosition`, `prefix`: `:21-31`), `attributes` (`type`, `name`, `value`, `isInheritable`: `:67-78`), `blobs` (`content` plus a `textRepresentation`: `:109-115`), `revisions`, `attachments`, `etapi_tokens`, and `entity_changes` (`:1`).
- **Tree ≠ hierarchy.** A note can sit under several parents because placement lives in `branches`, not in the note (README, "cloning"). Attributes are labels (`#name=value`) or relations (`~name=noteId`), optionally inheritable down the subtree.
- **All writes through the cache.** *"Always use cache methods, not direct DB writes. Cache methods create `EntityChange` records needed for synchronization"* (`CLAUDE.md:91`). The Becca cache is the real write API.
- **Sync** is push/pull of `EntityChange` records with HMAC login and content-hash verification against a self-hosted sync server (`CLAUDE.md`, "Entity Change & Sync Protocol").
- **Scripting.** Code notes run as backend or frontend scripts, triggered by labels such as `#run=frontendStartup`, `#run=hourly`, or relations like `~runOnNoteChange` (`docs/User Guide/User Guide/Scripting.md:27`; `docs/User Guide/User Guide/Scripting/Script API/Backend API.md:24`).

## What's on disk

One `document.db` (SQLite) per data directory (`apps/server/src/services/data_dir.ts:45`), plus backups. A text note is a `notes` row (`type='text'`, `mime='text/html'`) pointing at a `blobs` row whose `content` is CKEditor HTML. A minimal shape from the schema:

```sql
notes      (noteId, title, type='text', mime='text/html', blobId, isProtected, ...)
branches   (branchId, noteId, parentNoteId, notePosition, prefix, ...)
attributes (attributeId, noteId, type /* label|relation */, name, value, isInheritable, ...)
blobs      (blobId, content, textRepresentation, ...)
```

Protected notes are encrypted per note (README features list), so even the DB rows are opaque for those.

## Agent reach

Read and write — through APIs, not files.

- **ETAPI** (`apps/server/src/etapi/`, spec at `apps/server/src/assets/etapi.openapi.yaml`): `/create-note`, `/notes` (search), `/notes/{id}/content`, `/notes/{id}/export|import`, `/notes/{id}/revisions`, `/branches`, `/attributes`, `/attachments`, calendar and inbox helpers (`/inbox/{date}`, `/calendar/days/{date}`), `/backup/{name}` (`:45-1200`). Token auth via `Authorization` (`apps/server/src/etapi/etapi_utils.ts:48`); *"keep it backwards compatible"* (`CLAUDE.md:142`).
- **MCP** at `/mcp`, Streamable HTTP; *"Every request must carry an ETAPI token… there is no unauthenticated path, on any address"* (`apps/server/src/routes/mcp.ts:1-9`), with a per-IP limiter that only spends budget on would-be 401s (`:26-60`).
- **Same tools, two hosts.** `mcp_server.ts` *"exposes existing LLM tools via the MCP protocol"* (`apps/server/src/services/mcp/mcp_server.ts:1-6`); the registry lives in `packages/trilium-core/src/services/llm/tools/` (note, hierarchy, attribute, attachment, icon, help, skill tools).

## What's clever or unique

1. **`excludeFromLlm`.** A label that hides a note — and, if inheritable, its whole subtree — from every LLM tool (`packages/trilium-core/src/services/llm/tools/helpers.ts:35-41`). `getLlmNote` returns `null` for missing *or* excluded notes *"so the LLM cannot tell the two apart"* (`:43-47`); attributes are hidden if their owner or relation target is excluded. A one-label, inheritable privacy boundary that applies to MCP clients too.
2. **Markdown at the agent boundary, HTML in the store.** `get_note_content`: *"Text notes are returned as Markdown"*; `set_note_content`/`append`: *"For text notes, provide Markdown content"* (`note_tools.ts:82`, `:106`, `:165`), via `getNoteContentForLlm` / `setNoteContentFromLlm` (`helpers.ts:93`, `:120`). The agent never sees CKEditor HTML.
3. **Honest tool hints and transactions.** Each tool declares `mutates` and `additive`; MCP maps them to `readOnlyHint` / `destructiveHint` (append is not destructive), and every mutating call runs inside `sql.transactional` (`apps/server/src/services/mcp/mcp_server.ts:27-45`). Failures carry `isError: true` because *"an agent… takes a failure for a success"* otherwise (`:47`).
4. **The in-app chat drives the user's own agents.** Providers wrap Claude Code via the Agent SDK — using the user's `claude` login and subscription, with Claude Code's own file/bash tools disabled and Trilium's MCP server as its only tools (`apps/server/src/services/llm/providers/claude_agent.ts:1-20`) — and Copilot, Antigravity and Codex over the Agent Client Protocol (`acp_agent.ts:1-12`). Tool calls can wait for per-turn user approval (`packages/trilium-core/src/services/llm/tool_approval.ts:1-10`).
5. **Protected system notes.** `root`, `_hidden`, `_share` and friends cannot be deleted, moved or cloned by the LLM (`helpers.ts:33`).

## Costs / limits

- **No plain-file store at all.** Markdown exists only as import/export and as the agent wire format. Direct SQLite edits bypass Becca and `entity_changes`, so sync and caches silently diverge (`CLAUDE.md:91`).
- **HTML is the canonical text format** (CKEditor 5). Round-tripping through Markdown on every agent write can normalize away formatting the human chose.
- **Server process required** for ETAPI/MCP; the standalone build keeps the DB in browser OPFS, further from any agent.
- **Sync versions gate interop** — clients must match the server's sync version (README, TriliumDroid note).

## Relevance to flave

- **Borrow `excludeFromLlm` as a clearance level.** flave's clearance axis (`private → team → lp → public`) has no explicit "never show to an agent" point; Trilium's inheritable, indistinguishable-from-missing exclusion is a well-specified model for one.
- **Borrow `mutates`/`additive` → `readOnlyHint`/`destructiveHint`** on flave's named operations; "append" vs "overwrite" is a distinction approval UIs need.
- **Note the subscription-agent providers** (Claude Agent SDK with built-in tools disabled, ACP for others): a working pattern for a Tauri app's Chat rail that reuses the user's existing agent login rather than asking for API keys.
- **Avoid HTML-as-truth with Markdown-at-the-edge.** It works for Trilium's WYSIWYG, but flave's source is Markdown, so the agent and human should see the same bytes.

## Changes since the previous pin (2026-11-18 → 2026-11-22)

`c536ebee6240` → `76561ae16c0f`, 309 commits. `v0.108.0-rc.1` was tagged inside the range (2026-11-21); its notes (`docs/Release Notes/Release Notes/v0.108.0-rc.1.md`) cover everything since `v0.107.0`, so many of the fixes listed there landed before the previous pin.

- **The agent surface did not move.** No commit in the range touches `apps/server/src/etapi/`, `apps/server/src/services/mcp/`, `apps/server/src/services/llm/` or `packages/trilium-core/src/services/llm/`. `excludeFromLlm`, the tool hints and the MCP auth read as described above.
- **Markdown round trips lose one less thing.** A fenced code block ending in an empty line gained another blank line on every export/import cycle; fixed in `packages/commons/src/lib/markdown_renderer.ts` (commit `b457343c56`). This is the kind of drift the "HTML in the store, Markdown at the edge" design invites.
- **Links can target a heading or anchor** inside text and Markdown notes and inside PDF, EPUB, DOCX and ODT files (commit `3c60eac13f`), with matching fixes to ZIP import/export and shared pages.
- **The web clipper needs a token over the LAN.** With desktop "Network access" on, `/api/clipper/*` was reachable from other devices without one; now gated in `apps/server/src/services/desktop_network_gate.ts` (commit `8d922ed427`).
- **Share fixes.** Notes inheriting `shareHiddenFromTree` from outside the share are now hidden (`packages/trilium-core/src/share/handlers.ts`).
- Most of the remaining commits are the tablet layout for the mobile app, the website and showcase assets, and translations. `CLAUDE.md` gained mobile-CSS and Outline-sidebar guidance; the two lines this profile quotes moved to `:91` and `:142`.

## Read next

- `packages/trilium-core/src/assets/schema.sql` — the whole data model in ~160 lines
- `packages/trilium-core/src/services/llm/tools/helpers.ts:25-70` — exclusion and protection rules
- `apps/server/src/services/mcp/mcp_server.ts` and `apps/server/src/routes/mcp.ts` — MCP wiring and auth
- `apps/server/src/assets/etapi.openapi.yaml` — ETAPI contract
- `apps/server/src/services/llm/providers/claude_agent.ts`, `acp_agent.ts` — driving subscription agents from inside a notes app

## Related

- [[Profile__Logseq]] — also SQLite now, but arrived there from files
- [[Profile__SiYuan]] — files on disk, but an in-kernel agent and MCP comparable to Trilium's
- [[Profile__SilverBullet]] — scripting from inside notes, but over Markdown files
- [[Profile__Joplin]], [[Profile__Notesnook]] — other DB-backed note stores, with encryption front and center
- [[Profile__Outline]] — the team-wiki counterpart: DB store, public API

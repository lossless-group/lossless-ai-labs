---
name: Docmost Profile
title: Docmost — Profile
slug: docmost
upstream: https://github.com/docmost/docmost
pinned_sha: 53ac58b4
pinned_date: 2026-11-23
version_at_pin: "v0.98.0-14-g53ac58b4"
license: "Open core — AGPL-3.0 core; Docmost Enterprise License for apps/server/src/ee, apps/client/src/ee and packages/ee"
maintainer: Docmost, Inc.
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/docmost
profile_kind: Team wiki / Notion-Confluence alternative — React + NestJS + Postgres, Tiptap editor, Yjs via Hocuspocus
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
site_uuid: a339364a-76d8-4445-ae75-5234e623cfe6
hex_code: 3qdtwq
lede: >-
  Markdown goes in and out of Docmost only by way of HTML, and the doors an
  agent would use — API keys and MCP — are the parts you have to license.
summary: >-
  Profile of Docmost as pinned in the content-authoring-tools study. Docmost
  stores each page as Tiptap JSON, Yjs state and extracted plain text in
  Postgres. Markdown is a format flag on the REST API, converted
  Markdown → HTML (marked) → ProseMirror on the way in and ProseMirror → HTML →
  Markdown (Turndown) on the way out, with a small set of custom rules for
  callouts, math, footnotes, tabs and details. Agent writes go through the live
  Hocuspocus document so open editors see them, but only append, prepend and
  whole-document replace exist. Standing API keys and the MCP server are
  enterprise features whose server code lives in a private submodule. The
  interesting product work is elsewhere: sync blocks (transclusion), "bases"
  with a formula engine, and an editor-ext package of ~40 Tiptap extensions.
tags:
  - Profile
  - Docmost
  - Team-Wiki
  - Tiptap
  - ProseMirror
  - Yjs
  - Open-Core
  - Markdown-Round-Trip
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Docmost.md"
---
# Docmost — Profile

A profile of Docmost as it lives in this study (`studies/content-authoring-tools/docmost`, pinned at `53ac58b41f50`, 2026-11-23, `git describe` → `v0.98.0-14`). AGPL-3.0 core plus a Docmost Enterprise License over three `ee/` directories (`README.md`, `packages/ee/LICENSE`).

This is the study's **open-core Notion/Confluence** entry, and the natural sibling of [[Profile__Outline]]: same storage shape, different answers on Markdown fidelity and on what is free.

## TL;DR

**Verdict: a capable wiki whose Markdown story is an import/export convenience, not a data model — and whose agent surface is behind the license line.** The REST API accepts and returns Markdown, but the path is lossy by construction (two hops through HTML), and edits are coarse (append / prepend / replace).

## How it works

- **Stack.** pnpm + Nx monorepo: `apps/client` (React, Vite), `apps/server` (NestJS, Kysely over Postgres, Redis, BullMQ), `packages/editor-ext` (shared Tiptap extensions), `packages/base-formula` (formula engine for "bases"), `packages/ee` (license file only in this checkout).
- **Editor.** Tiptap 3.35 on ProseMirror (`package.json:34-60`), extended by `packages/editor-ext/src/lib/` — callout, columns, tabs, details, math, footnotes, drawio, excalidraw, mention, status, subpages, transclusion, unique-id, a ProseMirror→DOCX converter and more. Extension model = Tiptap's: `Node.create({...})` with `addAttributes`, `parseHTML`, `renderHTML`, `addCommands`.
- **Collaboration.** Yjs via Hocuspocus 4.9 (`package.json:26-30`), `apps/server/src/collaboration/` with authentication, persistence and Redis-sync extensions.
- **The `ee/` line in practice.** `apps/server/src/ee` is a git submodule pointing at `https://github.com/docmost/ee` (`.gitmodules`) and is **empty in this checkout** — the server-side enterprise code is not public. `apps/client/src/ee` is present (AI, AI chat, API keys, MFA, SCIM, page permissions, templates, …).

## What's on disk / in the DB

A page row (`apps/server/src/database/types/db.d.ts:355-381`) holds:

| Column | Role |
|---|---|
| `content` (`Json`) | Tiptap/ProseMirror JSON — the canonical snapshot |
| `ydoc` (`Buffer`) | Yjs state; if missing, rebuilt from `content` on load (`collaboration/extensions/persistence.extension.ts:84-108`) |
| `textContent` | Plain text extracted on every store, for search (`:145-149`) |
| `tsv`, `slugId`, `parentPageId`, `position`, `contributorIds`, `isBase` | search vector, tree, ordering, attribution, database-page flag |

Persistence skips the content write when the new JSON deep-equals the old, but since the 2026-11-20 collab-persistence fix it still saves the newer Yjs state (`persistence.extension.ts:165-168`). There is no Markdown column at all. A callout exported to Markdown looks like:

```markdown
:::warning
Body text, converted from the callout's HTML by Turndown.
:::
```

(`packages/editor-ext/src/lib/markdown/utils/turndown.utils.ts:204-216`). On import, any type other than `info|success|warning|danger` is coerced to `info` (`callout.marked.ts:20-25`), and YAML frontmatter is stripped before parsing (`marked.utils.ts:57-60`).

## Agent reach

**Read and write over REST, as a user — the long-lived credentials and MCP are licensed.**

- **REST.** `POST /pages/info|create|update|delete|move|duplicate|history|backlinks|…` (`core/page/page.controller.ts`), guarded by `JwtAuthGuard` (`:58`). `create`, `update` and `info` take `format: 'json' | 'markdown' | 'html'` (`dto/create-page.dto.ts:11-35`, `dto/page.dto.ts:40-41`).
- **Edit granularity.** `UpdatePageDto.operation` is `'append' | 'prepend' | 'replace'` (`dto/update-page.dto.ts:15`, `:36-38`). No patch, no block addressing.
- **Live writes.** `updatePageContent` converts to ProseMirror JSON and hands it to the collaboration gateway (`services/page.service.ts:451-466`), which opens a direct Hocuspocus connection and mutates the Y.Doc (`collaboration/collaboration.handler.ts:92-127`). Editors with the page open see it — but `replace` **deletes the entire XML fragment** and inserts a freshly built Y.Doc (`:109-119`), unlike Outline's diffing `updateYFragment`.
- **API keys.** The JWT strategy accepts an `api_key` token type but `require`s `./../../../ee/api-key/api-key.service` to validate it (`core/auth/strategies/jwt.strategy.ts:54-59`, `:100-106`). Without the EE module, there are no standing keys.
- **MCP.** `mcp` and `mcp:controls` are listed licensed features (`apps/client/src/ee/features.ts:13`, `:28`); enabling it checks `licenseCheckService.hasFeature(..., 'mcp', ...)` (`core/workspace/services/workspace.service.ts:396-397`). The MCP server implementation itself is not in the public tree, so its tools could not be verified.

## What's clever or unique

1. **Markdown via HTML, on purpose.** `parseProsemirrorContent` does `markdownToHtml` (marked) → `htmlToJson` (Tiptap's HTML parser) (`page.service.ts:1401-1422`); export does `generateHTML` with the editor's extensions → Turndown (`integrations/export/export.service.ts:88-106`). The trick is that each Tiptap node already knows its `parseHTML`/`renderHTML`, so Markdown support costs one marked extension and one Turndown rule per custom node, not a Markdown serializer per node. Cheap to extend, inherently lossy.
2. **Sync blocks (transclusion).** `transclusionSource` / `transclusionReference` nodes with an explicit acyclicity rule — sources cannot contain sources or references, "which keeps the transclusion graph acyclic and lets the renderer skip cycle-aware traversal entirely" (`packages/editor-ext/src/lib/transclusion/constants.ts:1-12`). A reference carries only `sourcePageId` and `transclusionId` (`transclusion-reference.ts:44-55`), and there is no Turndown rule for it, so it has nothing to say in Markdown.
3. **Bases with a formula engine.** `isBase` pages plus `packages/base-formula` (AST, compiler, evaluator, dependency graph — `src/ast.ts`, `compile.ts`, `eval.ts`, `graph.ts`) shared between client and server builds. Notion-style databases inside the wiki.
4. **Turndown rules for structure Markdown lacks.** Tabs export as `####` headings per panel (`turndown.utils.ts:132-154`); details are preserved as raw `<details><summary>` HTML (`:240-274`). Pragmatic degradations, each one written down.
5. **Content-format negotiation on every endpoint.** The same `format` flag on read and write makes Markdown a first-class *wire* format for scripts even though it is not a storage format.

## Costs / limits

- **Lossy both ways.** Two conversions through HTML; colgroups stripped (`export.service.ts:100-105`), callout types coerced, frontmatter discarded, transclusions and bases have no Markdown form.
- **Coarse edits.** Whole-document replace resets the Yjs fragment; an agent cannot change one paragraph without rewriting the page.
- **The agent doors are paid.** API keys, MCP, AI, DOCX/Confluence/PDF import, page permissions, templates are all enterprise features (`apps/client/src/ee/features.ts`), and the server code for them is in a private repo.
- **No files.** Postgres is the store; there is nothing on disk for an agent to open.

## Relevance to flave

- **Note the HTML-hop pattern, then avoid it.** Letting every node's HTML serialization double as its Markdown bridge is the fastest way to "support Markdown", and Docmost shows the cost: Markdown becomes a degraded export. flave's direction (source is the Markdown; render is derived) is the inverse and should stay that way.
- **Avoid `replace` as the agent primitive.** Docmost's only fine-grained options are append and prepend. flave's Phase 1 `block.replace` / `block.edit` at block grain is precisely the gap Docmost leaves; [[Profile__Outline]]'s quote-to-locate patch is the reference to beat.
- **Borrow the acyclicity rule for transclusion.** If flave ever lets a block embed another block, "sources are leaves" is a one-line constraint that removes cycle detection from the renderer.
- **Note the license line as a design lesson.** Docmost puts agent access behind EE; flave's premise is that the agent door is the same as the human door. Keeping operations in the open core is a product decision worth stating explicitly.

## Changes since the previous pin (2026-11-19 → 2026-11-23)

Old pin `ef50d8c8487c`, new pin `53ac58b41f50`: 26 commits, release `v0.98.0` (2026-11-20). The Markdown path (marked → HTML → ProseMirror in, ProseMirror → HTML → Turndown out), the append/prepend/replace edit set, the `replace` fragment reset, and the EE gating of API keys and MCP are all unchanged. What moved:

- **More node types with no real Markdown form.** New Tiptap nodes: template variables and placeholders (`packages/editor-ext/src/lib/template-variable.ts`, `template-placeholder.ts`), a "pages by label" block (`items-by-label.ts`), and a "recently updated pages" block (`recently-updated.ts`). "Pages by label" exports to Markdown as a single paragraph holding its heading, or *"Pages by label"* (`markdown/utils/turndown.utils.ts:20-45`, `:78-82`); the query behind it is lost. Both blocks may sit inside a sync-block source (`transclusion/constants.ts:34-35`). The list of things the Markdown export degrades keeps growing.
- **Export renders HTML with the full template extension set** rather than the generic `jsonToHtml`, so new node types render on export (`apps/server/src/integrations/export/export.service.ts:50-58`, `:88`).
- **Persistence fixes.** The Yjs state is saved even when the visible JSON is unchanged, a failed Yjs-to-JSON conversion saves the Yjs state and returns instead of throwing, and a rejected store re-queues itself so a newer save is not lost (`apps/server/src/collaboration/extensions/persistence.extension.ts:133-142`, `:165-168`, `:218-229`).
- **New read endpoint** `POST /pages/recently-updated`, scoped `read` for API keys and OAuth (`apps/server/src/core/page/page.controller.ts:423-429`).
- Richer HTML/Confluence import (comment images, linked images, emoji, indentation, highlight colours) under `apps/server/src/integrations/import/`. Tiptap moved to 3.35 and Hocuspocus to 4.9.

## Read next

- `apps/server/src/core/page/services/page.service.ts:451-466`, `:1401-1428` — format negotiation
- `apps/server/src/collaboration/collaboration.handler.ts:92-150` — API writes into the live Y.Doc
- `packages/editor-ext/src/lib/markdown/utils/turndown.utils.ts` — every Markdown degradation in one file
- `packages/editor-ext/src/lib/transclusion/` — sync blocks

## Related

- [[Profile__Outline]] — same architecture; better Markdown patching and a free MCP server, under BSL
- [[Profile__Milkdown]] — what it looks like when Markdown, not HTML, is the bridge format
- [[Profile__AFFiNE]] and [[Profile__AppFlowy]] — the other open-core Notion alternatives in the study

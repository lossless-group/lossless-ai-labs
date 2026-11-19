---
name: Outline Profile
title: Outline — Profile
slug: outline
upstream: https://github.com/outline/outline
pinned_sha: 396f196de
pinned_date: 2026-11-19
version_at_pin: "v1.12.0-305-g396f196de (package.json and LICENSE already say 1.13.0)"
license: "Source-available — Business Source License 1.1 (Additional Use Grant excludes running a competing 'Document Service'; converts to Apache-2.0 on 2030-11-15)"
maintainer: General Outline, Inc.
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/outline
profile_kind: Team wiki — React + Koa + Postgres, ProseMirror editor, Yjs collaboration via Hocuspocus
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
site_uuid: 777f212e-03f6-4cab-b49b-453f0848f01b
hex_code: 0okygp
lede: >-
  The wiki that admits its Markdown is lossy, then builds the best agent write
  path in the study on top of that admission: patch by quoting the Markdown,
  land the change as a ProseMirror splice and a Yjs update.
summary: >-
  Profile of Outline as pinned in the content-authoring-tools study. Outline
  stores each document three ways in Postgres (a deprecated Markdown text
  column, a ProseMirror JSON snapshot, and Yjs binary state), treats Markdown as
  an export and an agent-facing lingua franca rather than the source of truth,
  and ships a first-party MCP server whose update_document tool supports a
  "patch" mode: find a verbatim Markdown substring, map it back to ProseMirror
  positions through a serializer that records a block map, and splice only the
  affected blocks. Covers the storage model, the Markdown dialect (:::notice,
  +++ toggles, mention:// links), the MCP tools and served skills, and what a
  ProseMirror-first wiki teaches a source-pane-first editor like flave.
tags:
  - Profile
  - Outline
  - Team-Wiki
  - ProseMirror
  - Yjs
  - MCP
  - Markdown-Round-Trip
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Outline.md"
---
# Outline — Profile

A profile of Outline as it lives in this study (`studies/content-authoring-tools/outline`, pinned at `396f196de`, 2026-11-19, `git describe` → `v1.12.0-305`). Business Source License 1.1 from General Outline, Inc., converting to Apache-2.0 on 2030-11-15 (`LICENSE`).

This is the study's **team-wiki-with-a-real-API** entry. The question it answers: when the store is a database and the editor is ProseMirror, how close can an agent get to editing "the same thing the human edits"?

## TL;DR

**Verdict: not a Markdown store, but the most careful Markdown *interface* in the study — the MCP `patch` mode is the pattern to steal.** Markdown is explicitly demoted to a lossy export (`server/models/helpers/DocumentHelper.tsx:363`), yet the agent write path lets a model quote Markdown it read and get a surgical, collaboration-safe edit back.

## How it works

- **Stack.** React + MobX + styled-components frontend built with Vite; Koa + Sequelize + Redis/Bull backend (`docs/ARCHITECTURE.md`). The editor lives in `shared/editor`, "based on Prosemirror", and is shared by client and server so the server can parse and serialize the same schema.
- **Editor.** Raw ProseMirror (not Tiptap), with Outline's own `Extension` base class (`shared/editor/lib/Extension.ts:20`) exposing `plugins`, `rulePlugins` (markdown-it plugins), input rules and commands. Each node implements `toMarkdown` / `parseMarkdown` (`shared/editor/nodes/Node.ts:48-52`); parsing is markdown-it, serializing is `prosemirror-markdown`'s state machine (`package.json:176-209`).
- **Collaboration.** Yjs over Hocuspocus 1.1.3 (`package.json:79-82`, `:263-267`), with server extensions in `server/collaboration/` for auth, persistence, connection limits, awareness identity and views.
- **Extension surface for operators.** `plugins/` holds integrations, not editor plugins — each a `plugin.json` plus client/server folders (`plugins/github/plugin.json`: "Adds a GitHub integration for link unfurling"). Notion, Slab and Confluence-style importers, Slack, webhooks, Zapier, OIDC, storage live here. There is no public API for third parties to add editor node types.

## What's on disk / in the DB

One `documents` row carries three representations (`server/models/Document.ts`):

| Column | Type | Role |
|---|---|---|
| `text` | `TEXT` | Markdown. `@deprecated Use content instead, or DocumentHelper.toMarkdown if exporting lossy markdown` (`:401-413`) |
| `content` | `JSONB` | ProseMirror JSON, "a snapshot at the last time the state was saved" (`:422-426`) |
| `state` | `BLOB` | Yjs collaborative state, capped at 1.5 MB (`:429-438`; `shared/validations.ts:84`) |

Loading falls back in that order — `content`, else `state`, else `text` (`Document.ts:92-108`). The Markdown that does come out is an Outline dialect, defined node by node:

```markdown
:::info
Notices serialize as a named container (Notice.tsx:179-187).
:::

+++
Toggle blocks use plus fences, one more + per nesting level (ToggleBlock.ts:474-478).
+++

See @[Roadmap](mention://<id>/document/<modelId>) — internal mentions keep a
mention:// scheme so they parse back into live mentions (Mention.tsx:512-518).
```

With `commonMark: true` on export, external mentions fall back to their real URLs (`Mention.tsx:505-515`; `DocumentHelper.tsx:378-398`). Frontmatter is stripped on import, with a frontmatter `title` taking precedence (`server/commands/documentImporter.test.ts:331-354`).

## Agent reach

**Read and write, through a first-party MCP server — not files.**

- **MCP server** at `server/routes/mcp`, gated by a team preference rather than a license (`server/routes/mcp/index.ts:174`). Tools: documents (search, list, create, move, update, delete, restore), collections, comments, revisions, templates, attachments, users, `fetch` (`server/mcp/tools/*.ts`, ~2,700 lines of non-test code).
- **Served skills.** The server also hands out `SKILL.md` files over the MCP skills extension (`io.modelcontextprotocol/skills`, `server/mcp/skills/index.ts`): `find-and-cite`, `meeting-notes`, `collection-digest`, `capture-conversation`. The tool teaches its own usage.
- **REST API.** `documents.import`, `documents.export`, `documents.update`, `documents.search` and friends (`server/routes/api/documents/documents.ts`); the same `editMode` / `findText` fields are accepted there (`schema.ts:470-477`).
- **Live propagation.** An API write publishes on a Redis channel; `APIUpdateExtension` reloads state and broadcasts to every connected editor (`server/collaboration/APIUpdateExtension.ts:18-30`, `:190`). An agent's edit appears in the human's open tab.

## What's clever or unique

1. **Patch by quoting Markdown, apply as ProseMirror.** `update_document`'s description tells the model to prefer `editMode: "patch"` because `replace` will "lose any formatting that cannot be represented in markdown" (`server/mcp/tools/documents.ts:637`). The implementation (`DocumentHelper.tsx:596-727`) serializes the doc with `serializeWithPositions`, which returns the Markdown *and* a `blockMap` of `{mdFrom, mdTo, pmFrom, pmTo}` per top-level block (`shared/editor/lib/markdown/serializer.ts:74-81`). It finds `findText`, maps the hit to the overlapping blocks, tries a single-block surgical patch (`trySurgicalPatch`, `:778`), and otherwise re-parses only the affected region and splices it between untouched siblings. Comments, highlights and table widths elsewhere survive.
2. **Agent writes land as one Yjs change, not a reset.** After computing the new doc, `updateYFragment` diffs it into the existing Y.Doc (`DocumentHelper.tsx:741-757`), so collaborators' cursors and undo history are not blown away. Compare [[Profile__Docmost]], whose `replace` deletes the whole fragment.
3. **Honest about lossiness, in code.** `toMarkdown` and `toHTML` are documented as "lossy... should only be used for export" (`DocumentHelper.tsx:363`, `:419`); `toMarkdownDiff` explicitly diffs *un-normalized* serializer output because patch matching depends on it (`:563-582`).
4. **Fail-loud writes.** `update_document` compares `revisionCount` before and after, and returns an error instead of a false success when nothing persisted (`documents.ts:741-760`). A patch echoes the resulting content back so the agent can verify (`:763-770`).
5. **Mentions as a scheme, not a lookup.** `mention://id/type/modelId` keeps identity inside plain Markdown so a round trip through an LLM does not sever links (`Mention.tsx:484-519`).

## Costs / limits

- **BSL 1.1.** Self-hosting is fine; offering Outline as a document service to third parties is not, until 2030-11-15 (`LICENSE`).
- **No files.** The human's store is Postgres. An agent never touches a `.md` on disk; every write goes through auth, policies and the API.
- **Dialect.** `:::`, `+++` and `mention://` are Outline-specific. Exported Markdown renders elsewhere, but not as notices, toggles or mentions.
- **Patch semantics are first-occurrence string matching** (`documents.ts:661-663`); ambiguity is the caller's problem.
- **Heavy stack.** Postgres, Redis, a separate collaboration service (`server/collaboration/Procfile`), an older Hocuspocus line (1.1.3).

## Relevance to flave

- **Borrow the block map.** flave's `block.edit(ref, patch)` in Phase 1 needs exactly what `serializeWithPositions` provides: a table from source offsets to structural blocks. In flave the source *is* the Markdown, so the map is cheaper — build it from the lfm AST positions and every caller (menu, palette, rendered page, agent) can address a block by quoting it.
- **Borrow "quote to locate".** Letting an agent identify a target by a verbatim substring of what it just read, with first-match semantics and a hard error on no match, is a robust agent affordance that needs no stable ids. It complements, rather than replaces, flave's planned `BlockRef`.
- **Borrow fail-loud and echo-back.** "No change persisted" as an error, and echoing patched content, belong in flave's operation results.
- **Avoid the three-representation row.** Outline carries Markdown, PM JSON and Yjs state and has to document which is authoritative. flave's single source-of-truth file is the advantage; keep derived forms derived.
- **Note the served-skills idea.** Outline ships its own agent playbooks over MCP. A `.flave` workspace could ship trigger-pack usage notes the same way.

## Read next

- `server/models/helpers/DocumentHelper.tsx:596-760` — the whole agent write path
- `shared/editor/lib/markdown/serializer.ts:74-81`, `:260-280` — position tracking inside the serializer
- `server/mcp/tools/documents.ts:632-800` — tool contract as the model sees it
- `server/collaboration/APIUpdateExtension.ts` — API → live editors

## Related

- [[Profile__Docmost]] — same shape (Postgres + ProseMirror JSON + Yjs + MCP), weaker Markdown path, open core
- [[Profile__Milkdown]] — the editor-framework view of the same round-trip problem, via remark instead of markdown-it
- [[Profile__AFFiNE]] — the other CRDT-native docs tool in the study
- [[Profile__SilverBullet]] — the counterpoint where pages really are `.md` files on a server

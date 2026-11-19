---
name: AFFiNE Profile
title: AFFiNE — Profile
slug: affine
upstream: https://github.com/toeverything/AFFiNE
pinned_sha: dc2b221244
pinned_date: 2026-11-17
version_at_pin: "v2026.11.18-canary.905"
license: Open core — MIT for the client and everything outside packages/backend and packages/common/native; those two are under the AFFiNE Enterprise Edition (EE) license
maintainer: toeverything (TOEVERYTHING PTE. LTD.) and contributors
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/affine
profile_kind: Docs + whiteboard + database app on BlockSuite, Yjs-family CRDT store (y-octo in Rust), Electron desktop + NestJS server
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
site_uuid: d874a905-fa7a-4fd7-85fd-01bd89e7e742
hex_code: 262kwo
lede: >-
  The CRDT block tree is the truth and Markdown is a guest — but a well-mannered
  one: when the file and the doc disagree in a way a three-way merge can't
  express, AFFiNE writes a review candidate instead of guessing.
summary: >-
  Profile of AFFiNE as pinned in the content-authoring-tools study. It is the
  block-tree-CRDT-as-source-of-truth entry. Covers the BlockSuite data model
  (blocks as Yjs maps with sys:/prop: keys), the nbstore storage layer with
  SQLite snapshots/updates on desktop, the canary-only "Disk Markdown Sync"
  that three-way-merges a Markdown folder against CRDT checkpoints and parks
  unmergeable output under .affine-sync/candidates, and the workspace MCP
  endpoint whose update_document tool structurally diffs Markdown into the
  CRDT. Compares it with Baalda's string-CRDT bridge.
tags:
  - Profile
  - AFFiNE
  - BlockSuite
  - CRDT
  - Yjs
  - Local-First
  - MCP
  - Open-Core
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__AFFiNE.md"
---
# AFFiNE — Profile

A profile of AFFiNE as it lives in this study (`studies/content-authoring-tools/affine`, pinned at `dc2b221244`, 2026-11-17, tag `v2026.11.18-canary.905`). A TypeScript monorepo (BlockSuite editor framework vendored under `blocksuite/`) with Rust native modules, an Electron desktop, and a NestJS + Prisma server.

The license is split by directory: *"All content that resides under the `packages/backend` and `packages/common/native` directory … is licensed under … `packages/backend/server/LICENSE`"* — the EE license, production use only under the AFFiNE Subscription Terms — and everything else is MIT (`LICENSE:3-7`, `packages/backend/server/LICENSE:1-10`).

It is here as one half of the head-to-head against [[Profile__AppFlowy]] and [[Profile__Anytype]], and as the counterweight to [[Profile__Baalda]]: same Yjs family, opposite choice of what the CRDT holds.

## TL;DR

A page is a Yjs document whose `blocks` map holds one map per block, keyed `sys:id` / `sys:flavour` / `sys:children` / `prop:*` (`blocksuite/framework/store/src/__tests__/collection.unit.spec.ts:240-258`). On desktop those docs live as binary snapshots and update logs in SQLite. Markdown appears only as a projection: on export, in the MCP tools, and — new and behind a canary flag — in a two-way sync with a local Markdown folder.

**One sentence:** *AFFiNE is what a CRDT-first tool looks like when it tries to grow a plain-file surface: correct, careful, and visibly lossy at the edges, so it asks a human to review rather than overwrite.*

## How it works

- **Editor model: BlockSuite.** Blocks have a *flavour* (`affine:page`, `affine:note`, `affine:paragraph`, `affine:database`, `affine:surface`, …) and live under `blocksuite/affine/blocks/` (attachment, callout, code, database, embed, frame, latex, table, surface, …). The same model drives docs, the edgeless whiteboard, and databases.
- **Storage: `nbstore`.** `packages/common/nbstore/src/impls/` has interchangeable doc/blob storages: `idb` (browser), `sqlite` (desktop), `cloud` (server), `broadcast-channel`, and `disk` (the Markdown folder bridge). A sync layer reconciles any pair.
- **CRDT engine.** Yjs in the browser; on the Rust side AFFiNE's own Yjs-compatible `y-octo` (`Cargo.toml:114`).
- **Server.** NestJS + Prisma + Postgres, with a `copilot` plugin for AI and MCP (`packages/backend/server/src/plugins/copilot/`).

## What's on disk

Desktop workspace storage is a SQLite file whose core schema is four tables (`packages/frontend/native/schema/src/lib.rs:20-36`):

```sql
CREATE TABLE "snapshots" (doc_id VARCHAR PRIMARY KEY NOT NULL, data BLOB NOT NULL, ...);
CREATE TABLE "updates"   (doc_id VARCHAR NOT NULL, created_at TIMESTAMP ..., data BLOB NOT NULL,
                          PRIMARY KEY (doc_id, created_at));
CREATE TABLE "clocks"    (doc_id VARCHAR PRIMARY KEY NOT NULL, timestamp TIMESTAMP NOT NULL);
CREATE TABLE "blobs"     (key VARCHAR PRIMARY KEY NOT NULL, data BLOB NOT NULL, mime VARCHAR NOT NULL, ...);
```

A non-AFFiNE program can open the file but gets Yjs binary per doc. Decoded, a block is a flat map:

```js
'0': { 'sys:id': '0', 'sys:flavour': 'affine:page', 'sys:version': 2,
       'sys:children': ['1'], 'prop:title': 'hello', 'prop:count': 0, ... }
```

## Agent reach

- **Files — only with Disk Markdown Sync, and only on canary.** The flag `enable_disk_sync` (*"Sync workspace pages with Markdown files in a local folder"*) is configurable only on Electron canary builds and defaults off (`packages/frontend/core/src/modules/feature-flag/constant.ts:299-305`). When on, an agent can edit the `.md` files.
- **MCP (server).** `/api/workspaces/:workspaceId/mcp` (`plugins/copilot/mcp/controller.ts:51`) serves `read_document`, `doc_search`, `create_document`, `update_document`, `update_document_meta` (`provider.ts:114-323`). Access tokens default to `READ_ONLY`; write tools appear only for `READ_WRITE` (`provider.ts:109`, `:206`). `update_document` takes a full Markdown body and *"uses structural diffing to apply minimal changes, preserving document history and enabling real-time collaboration"*; it does not yet handle database or image blocks (`provider.ts:271-275`).
- **No local API.** The MCP endpoint lives on the (EE-licensed) server, so a purely local workspace has no agent surface other than the experimental folder sync.

## What's clever or unique

**1. Three-way Markdown merge against a CRDT checkpoint.** The disk-sync session (`packages/frontend/native/src/disk_sync/`, ~4,100 lines of Rust) keeps a `SourceCheckpoint` per doc: the CRDT snapshot *and* the Markdown it produced. When a file changes, `merge_markdown` is called with `baseline` (checkpoint snapshot), `current` (live doc), `source_before` (checkpoint Markdown) and `source_after` (the file) and returns a CRDT delta (`session/source_import.rs:124-185`). This is structurally the right merge: it diffs Markdown-to-Markdown and maps the change into the block tree, rather than re-importing the file.

**2. Review candidates instead of silent loss.** If the merged result does not re-export to exactly the file's Markdown — i.e. the block model could not represent the edit — the merged text is written to `.affine-sync/candidates/<hash>.md` and the import is refused with *"has concurrent edits; review …"* (`source_import.rs:169-176`, `session/mod.rs:106-111`). The export side is symmetric: if the file on disk is dirty relative to the checkpoint, export pauses; if it differs from what would be written, a candidate is written rather than overwriting (`session/source_export.rs:153-181`). The TypeScript storage surfaces this as `DISK_SOURCE_REVIEW_REQUIRED` (`packages/common/nbstore/src/impls/disk/doc.ts:63`).

**3. Identity rides in frontmatter.** A file is bound to its doc by an `id:` frontmatter key; title, tags, favorite and trash are mirrored there too (`disk_sync/frontmatter.rs:1-60`). An unmarked file gets a generated id.

**4. One store abstraction, many backends.** `nbstore` treats IndexedDB, SQLite, the cloud, and the Markdown folder as peers with clocks, which is how a folder-of-files could be added as just another sync target.

**5. MCP writes are CRDT writes.** Like [[Profile__Baalda]], an agent's `update_document` lands as a minimal structural diff in the shared doc, so it merges with concurrent human edits.

## Costs / limits

- **Markdown is not the native format.** Whiteboards, databases, and images do not round-trip; the MCP tool says so (`provider.ts:274-275`), and the review-candidate machinery exists because Markdown→block→Markdown is not an identity.
- **The folder bridge is experimental.** Canary-only, default off, Electron-only.
- **Key merge code is not in this repo.** `merge_markdown`, `export_markdown_source`, and `build_full_doc` come from the external crate `affine_doc_loader = "0.2.1"` (`Cargo.toml:19`); this profile could not read their implementation.
- **The agent API is in the EE half.** MCP lives in `packages/backend`, under the EE license.
- **Opaque by default.** Without the flag, a workspace is SQLite rows of Yjs binary.

## Relevance to flave

- **Borrow the review-candidate pattern.** When a bridge cannot represent an edit, write a sibling candidate file and ask, rather than overwrite or drop. It maps cleanly onto flave §8.4's v2 structured review and the §9.1 `propose` contract.
- **Borrow the checkpoint triple** (CRDT snapshot, Markdown it rendered to, metadata hash). It is the minimum state needed to tell "the file changed" from "the doc changed", whatever engine sits behind it.
- **Avoid block-tree-as-truth.** AFFiNE shows the cost: every Markdown edit goes through a lossy projection, so an agent writing plain LFM can be refused. flave's "the directory is the working format" stance is the opposite bet and should stay that way.
- **On the CRDT deferral:** AFFiNE confirms the [[Profile__Automerge]] finding from the other side. A structured CRDT over a rich document is what makes the file secondary. If flave ever adds CRDT, [[Profile__Baalda]]'s string-level `Y.Text` is the shape that keeps LFM primary; AFFiNE's is the shape that doesn't.

## Read next

- `packages/frontend/native/src/disk_sync/session/source_import.rs:124-200` — the three-way merge and candidate refusal
- `packages/frontend/native/src/disk_sync/session/source_export.rs:117-196` — dirty check before export
- `packages/backend/server/src/plugins/copilot/mcp/provider.ts:100-330` — the MCP tool set
- `packages/frontend/native/schema/src/lib.rs` — what is actually on disk

## Related

- [[Profile__Baalda]] — Yjs over a raw Markdown string; the file wins more often
- [[Profile__AppFlowy]] — yrs collab objects in RocksDB; no file bridge at all
- [[Profile__Anytype]] — object graph, local API + MCP instead of files
- [[Profile__Outline]], [[Profile__Docmost]] — server-first wikis with similar Markdown-as-projection trade-offs

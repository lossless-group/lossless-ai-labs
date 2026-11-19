---
name: AppFlowy Profile
title: AppFlowy — Profile
slug: appflowy
upstream: https://github.com/AppFlowy-IO/AppFlowy
pinned_sha: 8fcee27d9
pinned_date: 2026-10-28
version_at_pin: "0.15.0"
license: AGPL-3.0
maintainer: AppFlowy-IO and contributors
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/appflowy
profile_kind: Flutter UI over a Rust core (yrs collab objects in RocksDB, SQLite for app state), optional AppFlowy Cloud sync
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
site_uuid: c4c1a5da-4260-4cd5-a176-dbd1761c3edc
hex_code: bsrey2
lede: >-
  The purest CRDT-as-truth entry in the study: every page, database and folder
  is a yrs document in an embedded RocksDB, reachable only through a Flutter
  FFI — and Markdown exists solely as an export menu item.
summary: >-
  Profile of AppFlowy as pinned in the content-authoring-tools study. It is the
  Rust-and-Flutter head-to-head with AFFiNE and Anytype. Covers the collab
  object model (pages, databases, folders as yrs documents from the external
  AppFlowy-Collab crates), RocksDB as the local store with zipped history
  backups, the Local vs AppFlowy Cloud plugin switch, the Dart FFI event bus
  as the only programmatic surface, the local-AI (Ollama + sqlite-vec) work,
  and an MCP client module that is present but commented out.
tags:
  - Profile
  - AppFlowy
  - CRDT
  - yrs
  - Local-First
  - Rust
  - Flutter
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__AppFlowy.md"
---
# AppFlowy — Profile

A profile of AppFlowy as it lives in this study (`studies/content-authoring-tools/appflowy`, pinned at `8fcee27d9`, 2026-10-28, tag `0.15.0`). AGPL-3.0 (`LICENSE`). Flutter UI in `frontend/appflowy_flutter`, Rust core in `frontend/rust-lib`.

It is here as the head-to-head with [[Profile__AFFiNE]] and [[Profile__Anytype]]: three local-first "Notion alternatives" with three different stores. AppFlowy's README pitch is *"the AI workspace where you achieve more without losing control of your data."*

## TL;DR

The data model and CRDT do not live in this repo. Pages, databases, folders and user state are **collab objects** from `AppFlowy-Collab` crates (`collab`, `collab-document`, `collab-database`, `collab-folder`, `collab-plugins`, …) pinned by git rev `4dfccef`, built on `yrs = "0.21.0"` (`frontend/rust-lib/Cargo.toml:90-98`, `:150-157`). Locally, each collab is persisted through a `RocksdbDiskPlugin` into a per-user `collab_db` RocksDB directory (`collab-integrate/src/collab_builder.rs:288-296`, `flowy-user/src/services/entities.rs:82-86`).

**One sentence:** *AppFlowy treats the CRDT as the database and the UI as its only client, which makes it robustly local-first and almost entirely closed to an agent that isn't speaking its protobuf event bus.*

## How it works

- **Rust core, ~30 crates** under `frontend/rust-lib/`: `flowy-document`, `flowy-database2`, `flowy-folder`, `flowy-user`, `flowy-ai`, `flowy-search`, `flowy-storage`, `flowy-sqlite` (Diesel), `flowy-sqlite-vec`, `flowy-server`, plus `collab-integrate` gluing in the external collab crates.
- **Two backends, one switch.** `CollabPluginProviderType` is `Local` or `AppFlowyCloud`; only Cloud attaches sync plugins, Local adds none (`collab_builder.rs:339-352`). `flowy-server/src/` has `local_server/` and `af_cloud/` implementations of the same server traits.
- **Flutter ↔ Rust via FFI.** `dart-ffi/src/lib.rs` exports `init_sdk`, `async_event`, `sync_event` and stream ports (`:114-254`). Every feature is a `lib-dispatch` plugin registering protobuf events; `flowy-document` registers 21, e.g. `OpenDocument`, `ApplyAction`, `ApplyTextDeltaEvent`, `ConvertDocument` (`flowy-document/src/event_map.rs:12-51`).
- **Editor.** `appflowy_editor`, a separate Flutter package pinned by git ref (`appflowy_flutter/pubspec.yaml:185-188`).

## What's on disk

```
<user_data_dir>/
├── collab_db/            ← RocksDB: every page, database, folder as yrs state
├── collab_db_history/    ← zipped RocksDB backups, validated before use
└── <sqlite db>           ← Diesel SQLite: user/workspace/app state, vectors
```

Before opening, AppFlowy zips `collab_db` into `collab_db_history` and validates it, so a corrupt DB can roll back (`flowy-user/src/services/db.rs:40-52`).

A document decoded through `collab-document` is a flat block map with a separate children map and text map (`flowy-document/src/document_data.rs:4-35`): each block has `id`, `ty`, `data` (JSON), `parent`, `children`, and optional `external_id`/`external_type`; the document `meta` carries a `children_map` and a `text_map`. Rich text is a Quill-style delta. The HTML importer's doc comment shows the shape (`flowy-document/src/parser/external/parser.rs:24-28`):

```json
{ "type": "page", "data": {}, "children": [
  { "type": "paragraph", "children": [],
    "data": { "delta": [{ "insert": "Hello", "attributes": { "bold": true } }] } } ] }
```

## Agent reach

- **Files: no.** RocksDB is not a format another program should write. There is no folder-of-Markdown mode.
- **Local API: none found.** The only programmatic surface in this repo is the in-process FFI event bus; there is no HTTP/gRPC listener for third parties.
- **Export / import.** `DocumentExportType` is `json`, `markdown`, `text`, `html` (`appflowy_flutter/lib/workspace/application/export/document_exporter.dart:13-18`); Markdown import is `lib/shared/markdown_to_document.dart`. One-way, user-driven.
- **MCP: client only, and disabled.** `flowy-ai/src/mcp/manager.rs` is an MCP *client* that spawns stdio servers and lists their tools (`:7-37`), but the module is commented out: `// pub mod mcp;` (`flowy-ai/src/lib.rs:10-11`).
- **Self-hosted cloud.** AppFlowy Cloud (separate repo, not pinned) is the server-side route to the data.

## What's clever or unique

**1. A CRDT for everything, not just text.** Folders, databases (grid/board/calendar rows) and documents are all collab objects with one persistence and sync path. That uniformity is what lets the same app run fully offline (`Local`) or synced (`AppFlowyCloud`) by swapping plugins at `finalize` (`collab_builder.rs:304-356`).

**2. Rust core, thin UI.** All logic and storage sits behind a protobuf event bus, so desktop, mobile, and a test harness (`event-integration-test/`) share one core. It is a clean architecture for a product, and an opaque one for an agent.

**3. Defensive local storage.** Validated zip backups of the CRDT database before every open (`db.rs:40-52`) is a pragmatic answer to "the CRDT store got corrupted", a failure plain-file tools don't have.

**4. Local AI as a first-class path.** `flowy-ai` reloads an Ollama client per workspace when the server URL changes (`flowy-ai/src/ai_manager.rs:159`, `:363-384`), and `flowy-sqlite-vec` provides a `SqliteVectorStore` for local embeddings (`flowy-ai/src/lib.rs:16-17`). New collabs are queued for embedding as they are built (`collab_builder.rs:316-325`). The AI reads *from* the store; nothing here lets an outside agent write *to* it.

## Costs / limits

- **Least agent-reachable of the four.** No files, no local API, MCP client disabled. To an outside agent the store is a black box.
- **The interesting code is elsewhere.** The data model, CRDT usage, and RocksDB plugin live in `AppFlowy-Collab` (not pinned); the editor lives in `appflowy-editor` (not pinned); sync lives in AppFlowy Cloud (not pinned). This profile could not inspect them.
- **Markdown is lossy export.** Databases and rich blocks become JSON or flattened text.
- **AGPL-3.0.** Building on the core obliges source release for network use.

## Relevance to flave

- **Note it as the negative exemplar for the study question.** Strong local-first, zero agent reach without the vendor's server. flave's file-first stance is the explicit answer to this design.
- **Borrow the backend switch.** One trait, `Local` vs `Cloud` providers, chosen per workspace at build time. If flave adds sync later, a pluggable provider keeps the single-user path dependency-free.
- **Borrow the "one operation bus, many callers" shape** (FFI events with typed payloads like `ApplyAction` and `ApplyTextDeltaEvent`) — it is the same idea as flave's planned single operation set with four callers, but flave should expose it to agents, not only to its own UI.
- **On the CRDT deferral:** AppFlowy shows what full CRDT-as-database buys (uniform sync for docs, tables, folders) and what it costs (the files vanish). It supports keeping CRDT out of flave until a concrete multi-writer need appears; see [[Profile__Automerge]].

## Read next

- `frontend/rust-lib/collab-integrate/src/collab_builder.rs:274-356` — RocksDB plugin and Local/Cloud switch
- `frontend/rust-lib/flowy-document/src/event_map.rs` — the document API as events
- `frontend/rust-lib/flowy-document/src/document_data.rs` — the block/children/text map shape
- `frontend/rust-lib/flowy-ai/src/lib.rs:10-11` and `mcp/manager.rs` — the parked MCP client

## Related

- [[Profile__AFFiNE]] — Yjs block tree with an experimental Markdown folder bridge
- [[Profile__Anytype]] — object graph with a local JSON API and MCP
- [[Profile__Baalda]] — Yjs over raw Markdown, files stay primary
- [[Profile__Trilium]], [[Profile__SiYuan]] — other database-backed stores with a local API, for contrast

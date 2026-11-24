---
name: VNote Profile
title: VNote — Profile
slug: vnote
upstream: https://github.com/vnotex/vnote
pinned_sha: e9fbd4bb
pinned_date: 2026-11-22
version_at_pin: "v4.15.1 (also the rolling continuous-build tag on master)"
license: LGPL-3.0
maintainer: vnotex — Le Tan (primary author by a wide margin)
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/vnote
profile_kind: Native Qt 6 / C++ note platform — Markdown, Typst, mind maps, PDF — over notebook folders, with a native cmark core and a scoped local HTTP API
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
site_uuid: 823795e9-7b9d-4190-8961-b9ea31c4ba3b
hex_code: qf0m04
lede: >-
  The only editor in this group that built a door for agents: a loopback HTTP
  API with scoped bearer tokens, If-Match preconditions, and a hard refusal to
  overwrite a human's unsaved buffer.
summary: >-
  Profile of VNote as pinned in the content-authoring-tools study. A Qt 6 / C++
  note platform whose notebooks are real folders of Markdown, in either "raw"
  form (plain folder, identities kept in a local profile DB) or "bundled" form
  (a vx_notebook/ sidecar tree of per-folder vx.json records). A single native
  cmark parse feeds reader, preview and export, with wikilinks enabled. Covers
  the opt-in /api/v1 HTTP API (built for an external MCP server), the content-aware
  external-change poller, the comments.json sidecar that travels with its file,
  Git sync, WordPress-style hooks, and notebook-task trust.
tags:
  - Profile
  - VNote
  - Markdown-Editor
  - Qt
  - HTTP-API
  - Agent-Surface
  - Notebooks
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__VNote.md"
---
# VNote — Profile

A profile of VNote as it lives in this study (`studies/content-authoring-tools/vnote`, pinned at `e9fbd4bb`, 2026-11-22, release `v4.15.1`, tag `continuous-build`). LGPL-3.0, Qt 6.9+ (QtWebEngine for reading), C++17, CMake. Core notebook and buffer logic lives in the `libs/vxcore` submodule and the source editor in `libs/vtextedit`. **Neither nested submodule is checked out in this pin**, so claims about them below come from VNote's own `AGENTS.md` files, not from their source.

This is the study's **native-app, agent-API** entry. The other two editors in this group are Electron, and VNote is the only one that ships a programmatic surface besides the filesystem.

## TL;DR

VNote is "more than a Markdown editor": Markdown, Typst (with live PDF preview), plain text and code, mind maps (`.mmm`, `.emind`) and a PDF reader with annotations (`README.md`, "Supported formats"). Notes live in **notebooks**, which are folders on disk. A view window has two modes, `Read` and `Edit` (`src/core/global.h:62`), with an edit-plus-preview arrangement on top.

**One sentence:** *VNote is the editor that answered this study's question in code. An agent can list, read (saved or live), search, create, replace, append, rename and trash notes in the same notebook a human has open, through a narrow, versioned, token-scoped API that will not clobber an unsaved buffer.*

## How it works

- **One native Markdown parse.** "Reader, EditPreview and WebEngine export use native cmark HTML, not a JavaScript Markdown parser" (`src/widgets/AGENTS.md:1183`). The same cmark profile serves direct Read, editor snapshots, heading links and export, and a parse tree is reused when source bytes and options are identical (`src/controllers/AGENTS.md:206-209`). VNote ships a cmark fork (`vnotex/cmark`), vendored twice, with a test that fails if the two pins drift (`AGENTS.md`, "cmark is vendored twice").
- **The web view only enhances.** cmark HTML is passed through js-xss, re-validated per URL, installed as inert nodes, and then Prism, KaTeX/MathJax, Mermaid, PlantUML, Graphviz and flowchart workers run over it (`src/widgets/AGENTS.md:1187-1205`; `src/data/extra/web/js/`).
- **Wikilinks are cmark syntax** and are enabled in reader and export (`src/widgets/AGENTS.md:1192`).
- **Export.** Markdown, HTML, PDF, Typst, MindMap and **Custom** (`src/export/exportdata.h:18`), from sources ranging from the current buffer to the whole notebook or workspace (`:10-16`).
- **Services layer.** `src/core/services/` is deliberately free of Qt Widgets and VTextEdit (`src/core/services/AGENTS.md:7`): buffers, a save queue, notebook IO gates, search, sync, comments, tasks and hooks.

## What's on disk

Two notebook backends (`docs/http-api.md:115-130`):

- **Raw notebook.** A plain folder of files. Stable node identities live in the *local profile's metadata database*, not in the folder, so removing and re-adding a raw notebook does not preserve identity.
- **Bundled notebook.** The folder plus a reserved `vx_notebook/` tree (`src/core/services/foldersharepackager.cpp:50`) holding `config.json`, an optional `encryption.vne`, and a mirror tree `vx_notebook/contents/<folder>/vx.json` with one record per file (`foldersharepackager.cpp:665-666`, `:827`; `folderbundleimporter.h:18-20`). Each record carries an `id`, `name`, integral created/modified UTC timestamps, a `metadata` object, a `tags` string array and an optional `attachments` array (`foldermetadatavalidator.cpp:95-140`).

Other sidecars:

- **Comments.** `comments.json` "travels with the file": in the per-file attachments folder for bundled notebooks, or as `<filename>.comments.json` beside the file for raw notebooks and external files (`src/core/services/AGENTS.md:954-962`).
- **Settings.** App configuration is `vnotex.json`, merged as an RFC 7386 patch over typed defaults. Session state, including HTTP-API listener settings and task trust, lives in local `session.json` / `vxsession.json` (`src/core/AGENTS.md:117`; `docs/http-api.md:24-26`).

## Agent reach

- **Files: yes.** Raw notebooks are just folders. Bundled notebooks are folders plus JSON an agent could edit, but strict validators exist precisely because hand-transplanted `vx.json` is easy to break (`foldermetadatavalidator.h:14-30`).
- **HTTP API: yes, built for agents.** Opt-in, loopback only (`127.0.0.1:18765`), bearer tokens issued in Settings with per-notebook grants and four independent scopes: `notes:read`, `notes:read-live`, `notes:write`, `notes:trash` (`docs/http-api.md:9-22`, `:56-63`). "VNote exposes an opt-in note-automation API for non-browser clients, including a separately maintained MCP server. It is not an MCP server" (`:3-4`). There is an OpenAPI 3.1 contract (`docs/http-api.openapi.yaml`).
  - **Endpoints:** `/info`, `/notebooks`, `/nodes`, note metadata, paged `/content` (`view=saved|live`), `/search`, create-empty, replace, exact append, rename and trash. All mutations are asynchronous (202 plus operation polling) (`:192-206`).
  - **Concurrency contract:** mutations need `If-Match` with the saved `contentVersion` (428 without it, 412 if stale). If the human has unsaved changes, `unsaved_changes` returns 409, and "the API neither overwrites nor silently saves it" (`:236-256`). Replacement preserves encoding, BOM and line endings (`:222-224`).
  - **Honest partial outcomes:** `committed` and `saved` are reported separately, mutations are never auto-retried, and create-then-write is deliberately two operations whose partial result must be reported "honestly to the human/MCP consumer" (`:258-303`).
  - **Not exposed:** arbitrary paths, rendered HTML, attachments, tags/config mutation, plugins, UI commands (`:315-319`).
- **External writes are noticed by polling, not watching.** A 2-second timer checks the active buffer and every buffer on app re-focus. The vxcore check flags `FILE_CHANGED` only when the on-disk bytes differ from the buffer (exact, then EOL-normalized); a bare `mtime` bump just refreshes the stamp. Buffers with a pending or in-flight save are skipped so a self-save is never reported as external (`src/core/services/AGENTS.md:354-363`).
- **Plugins:** an in-process, WordPress-style `HookManager` with named hooks such as `vnote.notebook.before_open` and `vnote.node.after_create` (`src/core/hooknames.h:18-48`; `src/core/exampleplugin.h`). These are C++ hooks, not a scripting API.

## What's clever or unique

1. **The API is a model of "agent-friendly without agent-native."** Saved vs. live reads, the `dirty` flag on live, opaque per-representation validators (`saved-`, `live-`, `metadata-`, `state-`), and the refusal to touch dirty buffers together answer this study's "smallest delta" question better than any manifesto (`docs/http-api.md:217-256`).
2. **Audit without leakage.** Every request is logged as structured JSON (route template, token id, status, duration) with no note names, content, paths or queries (`docs/http-api.md:74-112`).
3. **Content-aware change detection.** Comparing bytes before declaring an external change removes a whole class of false conflicts from cloud sync, Git and lazy Windows `mtime` flushes (`src/core/services/AGENTS.md:361`).
4. **Sidecars that survive older builds.** `comments.json` keeps unknown anchor types and unknown keys verbatim, writes in a stable order so Git diffs stay readable, and its writes nudge the Git auto-sync debounce rather than forcing a sync (`src/core/services/AGENTS.md:998-1043`).
5. **Notebook tasks need trust.** Tasks defined inside a notebook (shell commands) cannot run until the user approves that notebook; clones and imports never inherit trust (`src/core/services/AGENTS.md:87-109`). This is the right instinct for any document format that carries executable bits.
6. **Git sync is built in.** HTTPS/`file:///` remotes only, PAT kept out of the URL, auto-sync on a trailing-throttle debounce (`src/core/services/AGENTS.md:193-201`, `:246-268`).

## Costs / limits

- **Native C++ and Qt is a heavy toolchain.** CMake, Qt 6.9 with WebEngine, a C++20 compiler for the syntax indexer, and nested submodules with strict push discipline (`AGENTS.md`, "Submodule Push Discipline").
- **Two metadata stories.** Raw notebooks keep identity in a local DB that does not travel with the folder. Bundled notebooks travel, but add a `vx_notebook/` tree that other tools must ignore.
- **No citations.** No CSL, BibTeX or citeproc handling was found in `src/`. Academic output would have to go through the Custom exporter.
- **Not verified here:** the editor internals (`libs/vtextedit`) and the notebook library (`libs/vxcore`) are uninitialized submodules in this pin. Exact JSON key spellings for timestamps come from `vxcore/notebook_json_keys.h`, which was not readable.

## Relevance to flave

- **Borrow the API contract, not the transport.** flave's "one operation set with four callers" should take on VNote's rules: saved vs. live reads, an opaque version per representation, mandatory `If-Match` on writes, 409 on a dirty human buffer, and `committed`/`saved` reported separately. Whether flave exposes it over MCP, Tauri IPC or HTTP, these are the semantics that make an agent safe in a human's document.
- **Compare file watching against MarkText and Zettlr.** VNote polls and compares content; [[Profile__MarkText]] and [[Profile__Zettlr]] watch with chokidar and also compare content before prompting. Content comparison is the common rule; for Tauri, a `notify` watcher plus a byte or hash comparison gets both benefits.
- **Note "the store travels with the file"** for flave's `.flave/review/` and comments. A sibling sidecar that is moved on rename, keeps unknown keys verbatim and is written in stable order is a cheap, Git-friendly design.
- **Note task trust** for flave's parked script tier: executable content in a document needs per-workspace consent that clones do not inherit.
- **Avoid** identity that lives outside the folder (the raw-notebook DB). flave's stable block ids should live in the document bundle.

## Changes since the previous pin (2026-11-19 → 2026-11-22)

`36d88daac72b` → `e9fbd4bb28c4`, 16 commits, ending on the `[Release] VNote 4.15.1` commit (tags `v4.15.1` and the rolling `continuous-build`). The nested `libs/vxcore`, `libs/vtextedit` and `libs/m3` gitlinks moved too, and are still not checked out here.

- **The HTTP API contract did not change.** `docs/http-api.md` and `docs/http-api.openapi.yaml` are identical; only the backend batches the metadata checks behind raw-notebook search (`src/integrations/httpapi/vnoteapibackend.cpp`, PR #2789).
- **Search lost its ripgrep backend.** Content search now always uses vxcore's built-in Simple engine, and the old `search.backends` key in `vxcore.json` is ignored (`src/core/services/AGENTS.md:420-427`).
- **vxcore reads return typed Qt records instead of JSON** for folder listings, tags and search (`src/core/services/AGENTS.md:24-53`). Internal, but it explains the line shifts in that file.
- **Notes now open in Edit mode by default**, with a migration that forces Edit for profiles older than 4.15.1, and the editor input mode (`normal`, `vi`, `vscode`) moved to one shared `editor.core.inputMode` key (`src/core/AGENTS.md:192-215`).
- The rest is TODO-panel work and fixes. Line citations into `src/widgets/AGENTS.md` and `src/core/services/AGENTS.md` above were re-located at the new pin.

## Read next

- `docs/http-api.md` and `docs/http-api.openapi.yaml`: the whole agent contract
- `src/core/services/AGENTS.md:354-363`: content-aware external-change detection
- `src/core/services/AGENTS.md:945-1115`: the comments sidecar and its forward-compatibility rules
- `src/widgets/AGENTS.md:1181-1205`: native cmark HTML and how the web view sanitizes it
- `src/core/hooknames.h`, `src/core/exampleplugin.h`: the hook system

## Related

- [[Profile__Zettlr]]: CM6 and citations, but no agent surface
- [[Profile__MarkText]]: Electron WYSIWYG, a single file and nothing else
- [[Profile__SiYuan]], [[Profile__Trilium]]: the other entries that expose a local HTTP API over the human's store
- [[Profile__Joplin]]: notebooks of Markdown with a local data API

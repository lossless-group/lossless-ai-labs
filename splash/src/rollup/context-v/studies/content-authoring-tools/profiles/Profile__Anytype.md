---
name: Anytype Profile
title: Anytype — Profile
slug: anytype
upstream: https://github.com/anyproto/anytype-ts
pinned_sha: 72af77e0eb
pinned_date: 2026-11-10
version_at_pin: "v0.57.8-alpha (client); middleware.version pins anytype-heart 0.51.9"
license: Source-available — Any Source Available License 1.0 (ASAL-1.0)
maintainer: Any Association
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/anytype-ts
profile_kind: Electron + React/MobX desktop client over a prebuilt Go middleware (anytype-heart) spoken to via gRPC-web
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
site_uuid: a5f7909c-9b56-4185-9baf-168511a0a6b9
hex_code: bml5cg
lede: >-
  No files at all, and the most deliberate agent door of the four: a localhost
  JSON API with per-space, read-or-write grants that the human approves, and a
  one-click MCP config pointing at it.
summary: >-
  Profile of Anytype's desktop client as pinned in the content-authoring-tools
  study. It is the object-graph entry. The core (anytype-heart, Go) is not
  pinned; the client downloads it as a prebuilt grpc-server binary plus
  protobuf bindings. Covers the object model (objects with layouts, typed
  relations, a block tree with range-based marks), the gRPC-web dispatcher,
  the Local API on 127.0.0.1:31009 with scoped API keys and a human approval
  flow, the bundled @anyproto/anytype-mcp config, Markdown as import/export
  only, and the source-available license.
tags:
  - Profile
  - Anytype
  - Object-Graph
  - Local-First
  - Local-API
  - MCP
  - Source-Available
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Anytype.md"
---
# Anytype — Profile

A profile of the Anytype desktop client as it lives in this study (`studies/content-authoring-tools/anytype-ts`, pinned at `72af77e0eb`, 2026-11-10, tag `v0.57.8-alpha`). Electron + React + MobX, built with Vite/Bun.

**The core is not here.** The client's `update.sh` downloads a prebuilt `grpc-server` from `anyproto/anytype-heart` releases, renames it `dist/anytypeHelper`, and unpacks its protobuf bindings into `dist/lib/` (`update.sh:3`, `:29-70`). The version is pinned in `middleware.version` (`0.51.9`). This profile works from the TS client, its command layer, and its interface definitions; anything about storage format or sync internals beyond what the client shows is out of reach here.

License: *"Any Association grants you … a license to use, modify, and redistribute the Software, but only (a) for Non-Commercial Use, or (b) for Commercial Use in Allowed Networks"* (`LICENSE.md:1-11`). Source-available, not open source.

## TL;DR

Everything is an **object** in a **space**: an object has a layout (`Page`, `Task`, `Set`, `Collection`, `Type`, `Relation`, `Note`, `Bookmark`, `Participant`, … — `src/ts/interface/object.ts:1-21`), a bag of typed relation values ("details"), and a tree of blocks. The README pitch: *"Local‑first, peer‑to‑peer & end‑to‑end‑encrypted knowledge OS"* with *"define your own data model"* (`README.md:3`, `:10`).

**One sentence:** *Anytype gives up plain files entirely and compensates with the best-designed local agent API in this group — scoped, revocable, human-approved, and MCP-ready.*

## How it works

- **Client ↔ middleware.** The renderer speaks gRPC-web to the local helper process (`src/ts/lib/api/dispatcher.ts:7-9`). Every operation is a named RPC wrapped in `src/ts/lib/api/command.ts` — e.g. `BlockTextSetText` (`:444`), `ObjectCreate` (`:1168`), `ObjectImport` (`:1300`), `ObjectListExport` (`:1696`).
- **Blocks.** A block is `{ id, type, layout, parentId, fields, content, childrenIds, … }` (`src/ts/interface/block/index.ts:110-120`) with `type` one of `text`, `dataview`, `layout`, `file`, `bookmark`, `link`, `relation`, `latex`, `table`, `widget`, `chat`, … (`:14-36`).
- **Rich text is not Markdown.** A text block stores a plain string plus `marks: { range, type, param }[]`, where type is `Bold`, `Italic`, `Link`, `Mention`, `Object`, `Latex`, … (`src/ts/interface/block/text.ts:30-47`, `:66-70`). `BlockTextSetText` sends text and marks separately (`command.ts:444-456`).
- **Sync.** Optional P2P/any-sync with end-to-end encryption, per the README; the implementation is in the unpinned middleware.
- **Browser extension.** A Go native-messaging host lets the web clipper find the app's ports and launch it (`go/nativeMessagingHost.go:1-5`).

## What's on disk

Nothing an outside program should read directly; the store is owned by `anytype-heart` (not pinned, not inspected). What the client exposes are **interchange formats**:

- **Export** (`src/ts/interface/common.ts:205-216`): `Markdown`, `Protobuf`, `Json`, `Dot`, `Svg`, `GraphJson`, `AnyBlockV2`, `Html`, `Pdf`. Any-Block v2 is labelled *"more readable and more compact than Any-Block v1 … in preview … should not be used for backups"* (`src/json/text.json:1950-1951`).
- **Import** (`common.ts:126-135`): `Notion`, `Markdown`, `External`, `Protobuf`, `Html`, `Text`, `Csv`, `Obsidian`.

## Agent reach

**Read and write, through an API the human grants — not through files.**

- **Local API.** The middleware is started with `jsonApiListenAddr` (`command.ts:159`, `:175`), default `127.0.0.1:31009` (`src/json/url.ts:29`, `src/ts/store/auth.ts:22`); the port is configurable in Settings → Local API (`src/ts/component/page/main/settings/api.tsx:58`).
- **Scoped keys.** A grant is `{ spaceIds, allSpaces, perm: Read | ReadWrite }` (`src/ts/interface/linkApproval.ts:2-11`). Keys have a name, a grant and an optional expiry; only an all-spaces ReadWrite grant is compatible with API v1 (`src/ts/lib/apiKey.ts:24-36`).
- **Human approval.** An outside app requesting access triggers an approval window that shows the caller's process path, browser origin, and whether its signature verified, and returns an allow/deny with a grant (`linkApproval.ts:19-46`). The code comments are candid: *"The name is caller-supplied. Only the process and browser origin are attributable."*
- **MCP.** Settings offers "Copy MCP config", which emits an `npx -y @anyproto/anytype-mcp` server entry wired to the key and port (`api.tsx:131`, `:157-158`; template at `src/json/constant.ts:249-261`). The MCP server is a separate package, not pinned here.
- **AI providers.** `AiProvider` starts with `Ollama` (`common.ts:137-140`).

## What's clever or unique

**1. Consent as the API's front door.** Of the four entries in this group, Anytype is the only one where an agent gets *partial* reach chosen by the human — specific spaces, read-only or read-write, with expiry — and the approval UI shows what can and cannot be attributed about the caller. [[Profile__Baalda]] and [[Profile__AFFiNE]] gate MCP with tokens; Anytype adds per-space scope and an OS-level identity check.

**2. User-defined schema in the store.** Types and Relations are themselves objects (`ObjectLayout.Type`, `ObjectLayout.Relation`), so the data model is data. That is the "define your own data model" claim, visible in the layout enum.

**3. Marks over ranges, not inline syntax.** Storing formatting as ranges beside plain text keeps text edits and formatting edits independent, which is friendlier to CRDT merge than a Markdown string where `**` can be split by a concurrent edit (the residual risk [[Profile__Baalda]]'s spec accepts).

**4. Many lossless-ish exits.** Protobuf, JSON, Any-Block v2 and a graph export (`Dot`, `GraphJson`) give an agent several ways to get the graph out whole, even though none is a live working format.

## Costs / limits

- **No plain files, ever.** Markdown is import/export; edits on an exported folder do not flow back.
- **The core is a binary download.** Studying or building on storage and sync means the separate `anytype-heart` repo.
- **Source-available.** ASAL-1.0 restricts commercial use outside "Allowed Networks".
- **Docs drift.** The README says AI "Agents" are explained in `AGENTS.md` (`README.md:19`), but `AGENTS.md` is a generic Electron/MobX architecture note describing a `webpack` layout the repo no longer uses (`AGENTS.md:28-44`, vs `vite.config.ts` at the root).
- **Client/middleware version skew.** Client `0.57.8-alpha` pins middleware `0.51.9`; the protocol is whatever that binary ships.

## Relevance to flave

- **Borrow the grant model for flave's agent layer.** Per-scope (here: per-space; for flave: per-workspace or per-clearance) read vs read-write grants with expiry and a human approval prompt map naturally onto flave's clearance axis. An agent with a `public`-only read grant is a clean way to make "nothing above public leaks" enforceable at the API, not only at publish.
- **Note "Copy MCP config" as a cheap affordance** worth copying: one button that emits a ready-to-paste client config with the key and port filled in.
- **Avoid range-marks as the storage format.** It is good for merge, but it is exactly what flave's "the directory is the working format" principle rejects. If flave needs merge-friendly formatting later, it can be a CRDT-layer concern, not a file-format one.
- **On the CRDT deferral:** Anytype doesn't change the case. Its sync story is in unpinned middleware, and its trade (no files) is one flave has already declined. [[Profile__Baalda]] is the entry that bears on the deferral; see [[Profile__Automerge]].

## Read next

- `src/ts/interface/linkApproval.ts` and `src/ts/lib/apiKey.ts` — the grant and approval model
- `src/ts/lib/api/command.ts` — the full RPC surface the middleware exposes
- `src/ts/interface/block/` — block and mark shapes
- `update.sh` — how the client obtains the core

## Related

- [[Profile__AFFiNE]] — Yjs block tree with server-side MCP
- [[Profile__AppFlowy]] — yrs collab objects, no outside API
- [[Profile__Baalda]] — plain Markdown plus Yjs plus MCP
- [[Profile__Trilium]], [[Profile__SiYuan]] — other stores reached through a local HTTP API

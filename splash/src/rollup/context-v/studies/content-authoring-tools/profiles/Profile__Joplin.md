---
name: Joplin Profile
title: Joplin — Profile
slug: joplin
upstream: https://github.com/laurent22/joplin
pinned_sha: 58fbd837c
pinned_date: 2026-11-22
version_at_pin: "server-v3.7.6-57-g58fbd837c (nearest tag)"
license: Open core — AGPL-3.0-or-later for the apps and libraries; packages/server under the Joplin Server Personal Use License
maintainer: Laurent Cozic (laurent22) and the Joplin contributors; trademark held by JOPLIN SAS
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/joplin
profile_kind: Offline-first Markdown notes app — SQLite locally, file-per-item sync with optional E2EE, plugin API, REST Data API, and a built-in MCP server
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
site_uuid: f1aa07ce-b1c2-46b0-a212-f635e4ffa28c
hex_code: f8esk8
lede: >-
  End-to-end encryption that guards the wire and the server but not the laptop,
  which is exactly why an agent on that laptop can be handed a well-designed MCP
  surface over plaintext Markdown notes.
summary: >-
  Profile of Joplin as pinned in the content-authoring-tools study. Covers the
  SQLite-backed local store, the "title / body / key: value" item serialization
  used on every sync target, E2EE applied only at serialize-for-sync time with a
  plaintext metadata envelope, the line-based three-way conflict auto-merge, and
  the AI primitives (local embeddings, provider privacy gate, joplin.ai plugin
  API, and an MCP server on the Web Clipper port with write tools off by
  default). Compared against Notesnook (encrypted at rest too) and Khoj (agent
  reads a server-side copy).
tags:
  - Profile
  - Joplin
  - Markdown
  - E2EE
  - MCP
  - Local-First
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Joplin.md"
---
# Joplin — Profile

A profile of Joplin as it lives in this study (`studies/content-authoring-tools/joplin`, pinned at `58fbd837cac2`, nearest tag `server-v3.7.6`, 2026-11-22). TypeScript monorepo: desktop (Electron), mobile (React Native), CLI, web clipper, and Joplin Server.

This is the study's **encrypted-sync-but-readable-locally** entry, and the counterweight to [[Profile__Notesnook]]. Both encrypt end to end; only Joplin leaves the local store in plaintext, which is what makes its agent surface possible.

## TL;DR

Notes are Markdown bodies in a local SQLite database. Sync writes each item as one text file to a pluggable target (Joplin Server, Nextcloud/WebDAV, Dropbox, OneDrive, S3, local folder), encrypting at that moment if E2EE is on. On top sits the most deliberate agent surface in this group: a purpose-built MCP server whose write tools are off until the user turns them on.

**One sentence:** *Joplin encrypts the copy that leaves the device and nothing else, so it can give an agent read/write access to the human's own notes, gated by per-tool toggles.*

## How it works

- **Stack.** TypeScript throughout; shared logic in `packages/lib`, apps in `packages/app-desktop`, `app-mobile`, `app-cli`. Sync engine is `packages/lib/Synchronizer.ts`, which takes a `SyncTarget` whose `file-api-driver-*` exposes generic file operations (`readme/dev/spec/sync.md:27-35`).
- **Data model.** Notes, notebooks (folders), tags, resources (attachments), all `BaseItem` subclasses with 32-hex ids. Per-target sync state lives in a `sync_items` table (`readme/dev/spec/sync.md:37`).
- **Sync target metadata.** An `info.json` on the target carries E2EE state, the active master key, the encrypted master keys, and a public/private keypair for sharing, each with an `updatedTime` for conflict resolution (`readme/dev/spec/sync.md:45-89`).
- **Licence split.** Root `LICENSE` makes everything AGPL-3.0-or-later *unless* a directory has its own licence; `packages/server/LICENSE.md` is the Joplin Server Personal Use License (v.1, 21 December 2021). The clients are open; the server is not open source.

## What's on disk

Locally: a SQLite database, not a folder of `.md` files. On a sync target: one file per item, produced by `BaseItem.serialize` (`packages/lib/models/BaseItem.ts:474-518`), which emits the title, a blank line, the body, a blank line, then `key: value` lines. A real note from the test snapshots (`packages/app-cli/tests/support/syncTargetSnapshots/3/normal/5c0b421ac1e645e48dbdba4ed5328327.md`, trimmed):

```
note4

id: 5c0b421ac1e645e48dbdba4ed5328327
parent_id: c227e85585674332badfbc09c50907ec
updated_time: 2021-08-07T17:03:33.720Z
is_todo: 0
encryption_applied: 0
markup_language: 1
type_: 1
```

The same note with E2EE on (`.../3/e2ee/00dceec04659436196bae6b56eea10ad.md`, trimmed): the envelope survives, the content becomes a `JED01…` blob.

```
id: 00dceec04659436196bae6b56eea10ad
parent_id: 8897f538ba4343cfba78eafd6c71a29c
updated_time: 2021-08-07T17:03:37.267Z
encryption_cipher_text: JED01000022051f3b6b71948c4f5d909d1af6588c78bb000504{"iv":...
encryption_applied: 1
type_: 1
```

A non-AI program can parse the plaintext form. It is not a vault you would hand-edit, and the folder hierarchy is a `parent_id` graph rather than a directory tree. Markdown-with-front-matter is an import/export format, not storage (`readme/dev/spec/interop_with_frontmatter.md:1-20`).

## Agent reach

| Surface | Read | Write | Notes |
|---|---|---|---|
| **MCP server** | yes | yes, opt-in | `POST /mcp` on the Web Clipper port (41184), same token; `mcp.enabled` defaults off and returns 403 when off (`packages/lib/services/rest/routes/mcp.ts:23`, `readme/dev/spec/ai_mcp.md:126-132`) |
| **REST Data API** | yes | yes | `http://localhost:41184/notes?token=…`, full entity surface (`readme/api/references/rest_api.md:9-41`) |
| **Plugin API** | yes | yes | `joplin.data`, `joplin.workspace`, `joplin.contentScripts`, and now `joplin.ai` (`packages/lib/services/plugins/api/Joplin.ts:73-137`) |
| **Files** | sync target only | no | Writing item files behind the synchroniser's back is not a supported path |

Yes: an agent can both read and write the human's store, through a surface Joplin designed for it.

## What's clever or unique

**An MCP tool surface that was designed, not generated.** `readme/dev/spec/ai_mcp.md` explains why the tools are not a Data API wrapper: *"An LLM doesn't need any of that — it needs a small, opinionated capability surface."* (`:105-109`) Eleven tools live in `packages/lib/services/ai/tools/global/`. The read side has three ideas worth copying:

- `read_note` caps at 8000 characters (`readNote.ts:15`) and offers `outline: true`, which returns tab-separated `path chars heading` lines, so the model sees the size of each section before asking for one (`ai_mcp.md:60-89`).
- `section` takes a positional path (`"1.2.1"`) or exact heading text. An ambiguous heading is an error listing the candidates, *"never an arbitrary pick"* (`ai_mcp.md:83`).
- `search_notes` returns the enclosing `section` of each hit, so the next call can go straight to `read_note(id, section)` (`ai_mcp.md:97-103`). `read_notes` splits one 8000-character budget across up to 20 notes.

**Write access is a deliberate grant.** `create_note`, `update_note`, `delete_note`, `manage_tags`, and `create_notebook` all default off. `delete_note` moves to trash. `update_note` supports `append`, `prepend`, and `replace_text` for small edits (`ai_mcp.md:44-58`). Errors split into `ToolError`, which the model sees and can recover from, and real exceptions, which become JSON-RPC `InternalError` (`ai_mcp.md:111-118`).

**AI as primitives with a two-switch privacy gate.** `ai_primitives.md` defines five primitives: provider abstraction, local embeddings, retrieval helpers, guardrails, and MCP. They share one rule, *"Plugins don't choose the provider."* Providers are classified `local` or `remote`, and an OpenAI-compatible URL counts as local when it resolves to loopback, RFC 1918, or `.internal`/`.home.arpa` (`packages/lib/services/ai/classification.ts:56`). A remote call throws unless `ai.allowRemote` is on (`AiService.ts:116`). Embeddings run `multilingual-e5-small` via ONNX into sqlite-vec, are local-only and not synced, and inject the title (doubled) into chunk 0 (`readme/dev/spec/ai_embeddings.md:18-39`).

**Encrypt at serialize time, with a declared plaintext envelope.** `serializeForSync` (`BaseItem.ts:547-603`) encrypts the serialized item, then rebuilds a reduced item from a `keepKeys` allow-list (`:593`): `id`, `parent_id`, `share_id`, `updated_time`, `deleted_time`, `type_`, and others. The spec says so directly: *"Items are encrypted only during synchronisation"* (`readme/dev/spec/e2ee/index.md:49`). There is also a guard against silent downgrade. With E2EE on, a plaintext upload must be confirmed unless `encryption.allowUnencryptedUploads` is set (`packages/lib/services/synchronizer/utils/mustConfirmPlaintextUploads.ts:4-6`).

**Conflict auto-merge that refuses to guess.** It is a three-way, line-based merge from a stored base (`sync_items.base_body`). Word-level merge was *"tried and dropped because it could silently duplicate text"*. When the base is missing or either note can't be decrypted, it falls back to a conflict note (`readme/dev/spec/conflict_auto_merge.md`).

## Costs / limits

- **Not files.** The working store is SQLite, and the sync format is one item per file named by id. Neither `rg` over a vault nor Obsidian-style folder editing works without export.
- **The E2EE envelope leaks structure.** Notebook tree (`parent_id`), share membership, timestamps, and item types stay plaintext on the target.
- **No token scopes.** Per-tool toggles are the only granularity. MCP is HTTP-only (stdio needs `mcp-remote`), with no resources or prompts (`ai_mcp.md:141-147`).
- **Embeddings are desktop-only** and unavailable on macOS Intel, CLI, mobile, and server. A fresh 10k-note vault takes about 8 hours to index (`ai_embeddings.md:55-72`).
- **Server licence** blocks building a commercial service on `packages/server`.

## Relevance to flave

- **Borrow the `outline` → `section` read pattern** for flave's agent operations. Positional path plus exact-heading addressing, errors on ambiguity, and section-anchored search hits map directly onto flave's stable block ids. It is the cheapest way to keep an agent's context small on long `.flave` documents.
- **Borrow "write tools default off, per-tool toggles"** as the v0 shape of flave's operation set for agent callers, until clearance-aware scopes exist.
- **Encryption is not clearance; note the envelope.** Joplin's `keepKeys` shows that even good E2EE publishes the *shape* of the content (tree, timestamps, sharing). Flave's v1 leak scan should treat headings, block ids, and file names in a public artifact as content, not metadata.
- **Copy `mustConfirmPlaintextUploads`'s posture for publishing.** A downgrade (here encrypted→plaintext, in flave `team`→`public`) needs an explicit confirmation or setting, never an implicit default.
- **Avoid the SQLite-as-truth store.** Joplin needs a Data API and an MCP server *because* the notes aren't files. Flave's "the directory is the working format" gets that reach for free.

## Changes since the previous pin (2026-11-19 → 2026-11-22)

Old pin `6d514ce3904a`, new pin `58fbd837cac2`: 13 commits, no release tags in range (`server-v3.7.6` is still the nearest tag; the desktop changelog in `readme/about/changelog/desktop.md` gained pre-release entries). The MCP design, the serialization format, and the E2EE envelope described above are unchanged. Small changes that touch the agent surface:

- **Better ranking for multi-word searches.** The search engine now weights how many query terms hit the title and marks notes that contain the whole phrase (`packages/lib/services/search/SearchEngine.ts`, `ftsPhraseRegex.ts`). The MCP `search_notes` tool calls `SearchEngine` (`packages/lib/services/ai/tools/global/searchNotes.ts`), so agent searches get the same ranking.
- **Embedding indexer waits 30 s after startup** before its first tick and switches back to the fast cadence whenever a batch is full, for example after a large import (`packages/lib/services/ai/EmbeddingIndexer.ts`). The spec still says the first tick fires at startup (`readme/dev/spec/ai_embeddings.md:41`), so the spec now lags the code.
- **Server:** an `API_EMAIL_LOGIN_ENABLED` option can force apps to use the browser login, and users are nudged to enable MFA (`packages/server/src/env.ts`, `packages/server/src/routes/api/sessions.ts`).

## Read next

- `readme/dev/spec/ai_mcp.md` — the whole MCP design rationale; the best short read in this group
- `packages/lib/services/ai/tools/global/readNote.ts` — outline/section/paging in code
- `packages/lib/models/BaseItem.ts:474-603` — serialize, then encrypt with a plaintext envelope
- `readme/dev/spec/conflict_auto_merge.md` — bounded diff3 and its refusal cases
- `readme/dev/spec/ai_chat.md:69-82` — the local/remote privacy gate

## Related

- [[Profile__Notesnook]] — encrypts the local database too; an agent gets a write-only inbox instead of a tool surface
- [[Profile__Khoj]] — the opposite direction: the agent lives server-side and reads an uploaded copy
- [[Profile__Trilium]] — the other SQLite-backed notes store with a local API (ETAPI)
- [[Profile__SilverBullet]] — Markdown pages as actual files on a server

---
name: SilverBullet Profile
title: SilverBullet — Profile
slug: silverbullet
upstream: https://github.com/silverbulletmd/silverbullet
pinned_sha: 8bdfe664
pinned_date: 2026-11-18
version_at_pin: "2.12.0-354-g8bdfe664 (nearest tag: 2.12.0)"
license: MIT (repo); Desktop app is a separate product, free for personal use, Pro license required at work
maintainer: Zef Hemel and contributors (silverbulletmd org)
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/silverbullet
profile_kind: Programmable Markdown knowledge base — Rust server, TypeScript/CodeMirror 6 browser client
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
site_uuid: f82f17bb-0944-4eb5-8952-d613482ce6c5
hex_code: dv80y8
lede: >-
  The one entry in this group that treats coding agents editing the files as a
  first-class collaborator: plain Markdown stays the source of truth, and
  concurrency is solved with three-way merge rather than a CRDT.
summary: >-
  Profile of SilverBullet as pinned in the content-authoring-tools study.
  Covers the space-as-folder-of-Markdown model, the Rust server with ETag
  conditional writes and a diff3 merge crate, Git-backed revisions, Space Lua
  (extensions authored as pages under Library/), baked sections that write
  query output into the Markdown between HTML-comment markers, signatures and
  mentions as in-text attribution, and an OAuth-protected MCP endpoint whose
  skills are pages tagged meta/skill.
tags:
  - Profile
  - SilverBullet
  - Markdown
  - PKM
  - MCP
  - Space-Lua
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__SilverBullet.md"
---
# SilverBullet — Profile

A profile of SilverBullet as it lives in this study (`studies/content-authoring-tools/silverbullet`, pinned at `8bdfe664`, 2026-11-18, 354 commits past tag `2.12.0`). MIT. Rust server (`server/`, `server-common/`, `bin/silverbullet/`), a TypeScript client built on CodeMirror 6 with Preact UI (`client/`), a Rust CLI `sb` (`bin/sb/`), and Space Lua libraries (`libraries/`) (`README.md:14-33`).

The study README filed it as the *"Markdown files, but programmable"* end of the spectrum. That undersells the more important finding: it is the entry that has thought hardest about *other writers* — including agents — touching the same files.

## TL;DR

*"Your Space is just files on disk, and those files are the source of truth… third-party tools (or other people) should also be able to freely edit files"* — explicitly naming *"coding agents that make edits"* (`docs/Collaboration.md:17-21`). Because of that commitment, it rejects CRDT collaboration and uses file watching plus three-way merge (`:23`, `:33`).

**One sentence:** *SilverBullet is the closest prior art in this study to flave's bet — a Markdown directory that a human, a script and an agent can all edit, made programmable from inside the documents themselves.*

## How it works

- **A space is a folder.** The server serves it over a file HTTP API: `GET /.fs` lists, `GET`/`PUT /.fs/<path>` reads and writes (`docs/HTTP API.md:34-45`).
- **Optimistic concurrency.** Every read returns `ETag: "sha256:<hash>"`; writes accept `If-Match` and `If-None-Match: *`, failing with `412` instead of clobbering (`docs/HTTP API.md:46-55`).
- **Merge, not CRDT.** `server-merge/src/diff3.rs` exports `merge(base, a, b)` (`:12`); merging is line- and word-aware; true collisions are written as Git-style conflict markers, which the editor renders as an inline *edit conflict* widget (`docs/Collaboration.md:33-40`). Binaries conflict to `name.conflicted-<hash>.ext` siblings (`:43`).
- **Index lives in the client.** Pages are parsed into an Object Index (pages, tasks, items, tags, attributes) that is rebuilt from the files and updated incrementally; queries may lag edits by seconds (`docs/Object Index.md:13-24`).
- **History is Git.** Optional per-space Git-backed revisions, exposed over `GET /.revisions/` with per-commit author and message (`docs/Revisions.md`, `docs/HTTP API.md:56-62`).

## What's on disk

Plain `.md` with YAML frontmatter, wikilinks, `#tags`, `[attribute: value]`, `* [ ] tasks`, and `${lua}` / `space-lua` code. SilverBullet's own docs are a space, and every docs page cites the source files it describes in frontmatter (`docs/Collaboration.md:1-13`):

```markdown
---
description: "How concurrent edits are merged and conflicts are resolved."
tags: glossary maturity/experimental
references:
- server-common/src/space/disk.rs
- server-merge/...   (abridged)
---
A [[Space]] can be shared: several people with [[Dashboard|accounts]] …
```

A **baked section** — query output written into the file (`docs/Baked Sections.md:13-20`):

```markdown
<!--#lua query[[ from f = tags.feature where f.tag == "page" select f.name ]] -->
| name |
| ---- |
| Baked Sections |
| Publishing |
<!--/lua-->
```

## Agent reach

Read and write, by every route, and the files are canonical:

- **Files directly** — the design assumes it (`docs/Collaboration.md:19-21`); external edits stream into open editors as cursor-preserving, undoable changes, highlighted with author attribution when known (`:45-46`).
- **HTTP API** with conditional writes (above).
- **MCP** at `/.mcp`, off by default, OAuth 2.1 with PKCE; the agent acts as the approving account, only on the spaces ticked on the consent screen (`docs/MCP.md:9`, `:24`, `:27-45`). Desktop serves it on `127.0.0.1:3999/.mcp` (`:49`). Tools: `help`, `read` (optionally *rendered*, with queries evaluated and lint problems listed), `write`, `edit`, `search`, `lua`, `screenshot` (`:12-18`).
- **CLI** `sb`, a thin HTTP client whose `sb help` prints the space's skills and map for an assistant (`docs/CLI.md:8`).

## What's clever or unique

1. **Concurrency designed around foreign writers.** ETag preconditions + diff3 + conflict markers rendered as widgets is a complete, file-native answer to "the agent wrote while I was typing" — no opaque CRDT state, no conflict-copy files for text (`docs/Collaboration.md:23-43`, `server-merge/src/lib.rs`).
2. **Extensions are pages.** `space-lua` blocks run only on *tool pages* under `Library/`; elsewhere they are inert and lint-warned (`docs/Space Lua.md:21`, `:40`). Commands, slash commands, widgets, templates, tag schemas and styles are all Markdown pages with Lua or CSS (`server-mcp/src/instructions.md:11`). The extension system is version-controlled content.
3. **Skills are pages too.** Any page tagged `meta/skill` is listed by the MCP `help` tool and loaded by reading it (`docs/MCP.md:21`). Users can author agent skills inside their own notes.
4. **Baked sections.** Dynamic output is serialized into the Markdown between HTML-comment markers *"so every markdown renderer ignores them"*, keeping the file useful on GitHub or in Obsidian while the opening marker stays the source of truth for refresh (`docs/Baked Sections.md:21`).
5. **Rendered reads for agents.** MCP `read` with `rendered` returns the page as a human sees it (queries evaluated, lint problems listed), and `screenshot` lets an agent verify a widget it built (`server-mcp/src/instructions.md:6-9`). The agent can check its own work against the human's view.
6. **Attribution in the text.** `-- @name` at the end of a line signs a block and emits an `authored` relation; `@name` mentions populate a Mention Inbox and a `recipients` attribute (`docs/Authorship.md`, `docs/Recipient.md`). Who-wrote-what and who-it's-for are plain-text syntax.

## Costs / limits

- **Server-first.** The full feature set (merge, MCP, revisions) assumes the Rust server; the Object Index is a client-side derived cache, so queries lag edits (`docs/Object Index.md:18-21`).
- **Merge is best-effort.** Same-word edits conflict; stale clients on flaky links can produce spurious conflicts (`docs/Collaboration.md:33-38`). Collaboration and MCP are tagged `maturity/experimental`.
- **Dialect lock-in.** `${…}`, `space-lua`, `[attr: value]` are SilverBullet Markdown; other renderers show raw source unless baked.
- **License split.** The repo is MIT, but *"Using [Desktop] at work requires a Pro license"* (`docs/Licensing.md:1`). Desktop's source is not in this repo.

## Relevance to flave

- **Borrow ETag/`If-Match` conditional writes plus diff3 merge** as flave's answer to concurrent human + agent edits on a working directory. It is the cheap middle tier between "async file exchange" and the deferred CRDT tier, and it keeps files as files.
- **Borrow baked sections** for flave's publish step: compute a query, chart, or audience-filtered block, write the result between comment markers, keep the expression as the source. That is how a `.flave` stays readable in any Markdown viewer.
- **Borrow "extensions are documents."** SilverBullet's `Library/` tool pages are the same idea as flave trigger packs; note its safety rule — code is inert outside a designated directory — and its lint warning when it is not.
- **Borrow rendered reads / screenshots on the agent surface** so an agent can verify a trigger-pack component renders, not just that the source parsed.
- **Note `-- @name` signatures and `recipients`** as plain-text provenance and audience syntax, adjacent to flave's clearance/audience model.

## Read next

- `docs/Collaboration.md` — the whole foreign-writer philosophy and merge behavior
- `server-merge/src/diff3.rs` — the merge
- `docs/HTTP API.md:34-62` — file API, conditional writes, revisions
- `docs/MCP.md`, `server-mcp/src/instructions.md` — agent surface and how it briefs agents
- `docs/Space Lua.md`, `docs/Baked Sections.md` — programmability that survives outside the app

## Related

- [[Profile__Logseq]] — the outliner that left files behind; the counterexample
- [[Profile__SiYuan]] — files on disk, but a JSON AST only the kernel writes comfortably
- [[Profile__Trilium]] — scripting from inside notes too, but in SQLite
- [[Profile__Baalda]] — plain `.md` plus a CRDT: the other answer to concurrent edits
- [[Profile__Khoj]] — agent over your notes, from the outside

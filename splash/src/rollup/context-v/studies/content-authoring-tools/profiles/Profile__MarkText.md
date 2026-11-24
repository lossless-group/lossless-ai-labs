---
name: MarkText Profile
title: MarkText — Profile
slug: marktext
upstream: https://github.com/marktext/marktext
pinned_sha: e4ed4cf4
pinned_date: 2026-11-17
version_at_pin: "v0.20.0-236-ge4ed4cf4 (nearest tag; workspace package.json says 0.24.0-dev)"
license: MIT
maintainer: MarkText org — most recent commits by Ran Luo and Jocs, plus contributors
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/marktext
profile_kind: WYSIWYG desktop Markdown editor — Electron + Vue 3 shell over the Muya block engine
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
site_uuid: 3539f0c2-3261-4cfa-8cc4-1bdf394367cd
hex_code: 14xh12
lede: >-
  The purest "the file is the document" entry in the study — one .md file, no
  sidecars, no project — paid for by re-serializing your Markdown from a block
  tree every time you save.
summary: >-
  Profile of MarkText as pinned in the content-authoring-tools study. A revived,
  TypeScript-rewritten WYSIWYG Markdown editor whose engine, Muya, parses
  Markdown with marked into an ot-json1 block state and writes it back out with
  its own serializer. Covers the WYSIWYG-vs-source split (Muya plus a CodeMirror
  5 source mode), the conformance-locked parser, the careful external-change
  handling that makes it a good neighbour for an agent writing the same file,
  pandoc-backed export, and the gaps — no citations, no wikilinks, no project
  metadata, no plugin API beyond Muya UI plugins, no agent surface.
tags:
  - Profile
  - MarkText
  - Markdown-Editor
  - WYSIWYG
  - Electron
  - File-Watching
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__MarkText.md"
---
# MarkText — Profile

A profile of MarkText as it lives in this study (`studies/content-authoring-tools/marktext`, pinned at `e4ed4cf4`, nearest tag `v0.20.0`, 2026-11-17). MIT, Electron 45 + Vue 3 + Pinia, pnpm monorepo with three packages: `packages/desktop` (the app), `packages/muya` (the editor engine, `@muyajs/core`), and `packages/website`.

This is the study's **WYSIWYG-over-a-plain-file** entry: what you get, and what you give up, when the editing surface is a rendered block tree rather than the Markdown text.

## TL;DR

MarkText opens one `.md` file (or a folder as a sidebar tree) and renders it as editable blocks, Typora-style. There is no workspace file, no vault index, no per-folder metadata. The Markdown on disk is the whole document.

**One sentence:** *MarkText is the cleanest "agent writes the same file the human edits" story in this group, because it watches the file carefully and owns nothing else; but the WYSIWYG engine regenerates the Markdown on save, so a human edit can reformat the bytes an agent wrote.*

## How it works

- **Shell.** Electron main process owns IO, dialogs and file watching. The renderer is sandboxed (`contextIsolation`, `sandbox: true`), and every Node call crosses a typed `contextBridge` (`AGENTS.md`, "Architecture: Main, Preload and Renderer"; IPC contract in `packages/desktop/src/shared/types/ipc.ts`).
- **Two editors in one window.** The renderer hosts **Muya** for WYSIWYG and **CodeMirror 5** for source-code mode (`AGENTS.md`; `packages/desktop/package.json:69` pins `codemirror ^5.65.21`). So "source mode" is a separate legacy editor, not a view of the same state.
- **Muya, the engine.** A TypeScript rewrite of MarkText's original engine, now in-repo. `new Muya(element)` swaps the element for a `contenteditable` div. A block tree (`TreeNode → Parent → Content|Format`) is backed by a `JSONState` whose edits are `ot-json1` operations with `ot-text-unicode` ops nested inside for inline text (`packages/muya/AGENTS.md`, "State and markdown round-trip"). Inline content is tokenized by a custom lexer and rendered to a virtual DOM with `snabbdom`.
- **Parse and serialize.** `state/markdownToState.ts` parses with `marked`; `state/stateToMarkdown.ts` (714 lines) writes the tree back out. HTML paste goes through `turndown` + `joplin-turndown-plugin-gfm` (`state/htmlToMarkdown.ts`).
- **Conformance is ratcheted.** The spec suite runs CommonMark 0.31 and GFM 0.29 fixtures. An `expected-failures.json` list means compliance can only go up: an example that starts passing fails the suite until it is removed from the list. The pinned headline is 593/652 CommonMark (91.0%) and 600/672 GFM (89.3%) (`packages/muya/test/spec/conformance.md`).
- **Rich blocks.** KaTeX, Mermaid, Vega/Vega-Lite, PlantUML, Prism, footnotes, front matter, GitHub alerts (`packages/muya/README.md`).

## What's on disk

Just the Markdown file. MarkText keeps app state (preferences, sessions, crash-recovery checkpoints) in its user-data directory, not beside the document (`packages/desktop/src/main/applicationState/`). On load it records the file's **raw** byte facts so it can detect a change later:

```ts
// packages/desktop/src/shared/types/files.ts:199-200
export type DiskBaseline =
  { exists: false } | { exists: true; sizeBytes: number; mtimeMs: number; rawSha256: string }
```

It also preserves encoding (via `iconv-lite` plus a guesser), line endings, mixed-line-ending detection and trailing-newline count per document (`main/filesystem/markdown.ts:16-33`). A save refuses characters the original encoding cannot represent rather than silently corrupting them (`markdown.ts:52-66`).

## Agent reach

- **Files: yes, and this is the whole story.** No API, no CLI beyond launch flags (`--new-window`, `--read-only`, `--user-data-dir`; `main/cli/parser.ts:44-60`), no MCP, no plugin host. An agent reaches MarkText by writing the `.md` file.
- **External writes are noticed and handled well.** A per-window `chokidar` watcher (`main/filesystem/watcher.ts`) reports `add`/`change`/`unlink`, and the renderer decides what to do (`renderer/src/store/editor.ts:1345-1418`):
  - **byte-identical content** (a `git checkout` that only touched metadata): ignore silently (`:1370-1380`);
  - **tab has no unsaved edits**: reload in place without asking, and cancel any pending autosave so it cannot overwrite the external write (`:1382-1394`);
  - **tab is dirty**: mark `diskConflict` and show a confirm notification instead of clobbering either side (`:1396-1407`);
  - **file deleted**: mark `diskMissing`, flip the tab to unsaved, warn (`:1354-1365`).
- **Self-write suppression.** The editor's own saves register a time window; a change event inside it is ignored, with an `mtime` re-check for cloud drives that echo changes late (`watcher.ts:480-535`). `awaitWriteFinish` is applied only to the per-file watcher, which reads content, and not to the directory watcher, which only re-sorts the sidebar. The comments cite the two bugs this trade-off came from (`watcher.ts:314-325`).

## What's clever or unique

1. **External-change policy is a decision table, not a dialog.** The three cases (identical, clean, dirty) each get a different answer, and the "clean tab reloads silently" rule is explicitly independent of autosave, because autosave would write the stale buffer back over the external editor's change (`editor.ts:1382-1386`). This is the policy an agent-co-edited file needs.
2. **Writes are epoch-gated.** `DocumentWriteCoordinator` gives each tab an epoch. Going read-only, or an IO barrier such as a sidebar move, bumps it, and a save captured under an old epoch is dropped rather than written (`main/filesystem/documentWrites.ts:9-66`). That is a small, clean primitive for "don't let a stale save race a rename."
3. **A conformance ratchet on a WYSIWYG engine.** Most WYSIWYG editors cannot tell you how much CommonMark they get wrong. Muya publishes the per-section numbers and makes regressions fail CI (`test/spec/conformance.md`).
4. **OT-ready state with no transport.** The `ot-json1` state exposes `invert`/`compose`/`transform`, so the engine is collaboration-shaped even though nothing is wired to it (`packages/muya/AGENTS.md`).
5. **Typography as CSS variables.** `--mu-font-size`, `--mu-line-height`, `--mu-code-font-family` and the rest can be set as options or overridden in pure CSS (`packages/muya/AGENTS.md`, "Appearance contract").

## Costs / limits

- **The serializer, not the user, owns the bytes.** Tables are re-padded and their delimiter rows rebuilt from computed column widths (`muya/src/state/stateToMarkdown.ts:570-607`). List indentation follows a preference (`number`/`tab`/`dfm`, `:62-103`). The parser does record bullet markers (`markdownToState.ts:270`), but anything the state does not model is normalized. A file an agent formatted one way may come back formatted another way after a human edits it.
- **Link reference definitions are a workaround.** They are stored as raw paragraph text so they round-trip, not as a block type (`packages/muya/AGENTS.md`).
- **No citations, no wikilinks, no backlinks.** A search of `muya/src` and `desktop/src` finds no citation or wikilink handling.
- **Export.** Styled HTML and PDF (`webContents.printToPDF`) come from Muya's HTML (`renderer/src/util/exportHtml.ts`; `main/menu/actions/file.ts:133`). Other formats shell out to pandoc if it is installed (`file.ts:29`, `:237`).
- **Extension.** `Muya.use(Plugin)` registers *UI* plugins: toolbars, menus, pickers (`muya/src/muya.ts:143`). Adding new syntax means adding a block class and registering it in `registerBlocks()`, which is engine work, not a user-level extension.

## Relevance to flave

- **Borrow the external-change decision table verbatim** for flave's file watching: identical content means no-op, a clean buffer means silent reload (and cancel pending autosave), a dirty buffer means conflict UI, and a deleted file means missing state. MarkText's `editor.ts:1345-1418` is a compact reference.
- **Borrow the raw-byte baseline** (`DiskBaseline` with `rawSha256`, separate from the normalized editor hash) so "did the file change?" is answered by content, not `mtime`. Both [[Profile__Zettlr]] and [[Profile__VNote]] arrived at the same rule independently.
- **Avoid the WYSIWYG-serializer trap.** flave's CM6 source pane keeps the author's (or agent's) bytes authoritative, which is exactly what MarkText gives up. Do not add a rendered-pane editing path that writes back by re-serializing an AST.
- **Note the conformance ratchet** as a cheap discipline for LFM: an expected-failures list that fails when something *starts* passing keeps the numbers honest.

## Changes since the previous pin (2026-11-17 → 2026-11-17)

No upstream change: `develop` is still at `e4ed4cf4a3de` as of the 2026-11-23 refresh (0 commits), so everything above still holds.

## Read next

- `packages/desktop/src/renderer/src/store/editor.ts:1345-1418`: the external-change policy
- `packages/desktop/src/main/filesystem/watcher.ts:295-330`, `:480-535`: chokidar options and self-write suppression
- `packages/desktop/src/main/filesystem/documentWrites.ts`: the epoch-gated write coordinator
- `packages/muya/AGENTS.md`: the engine architecture in one page
- `packages/muya/test/spec/conformance.md`: how much CommonMark/GFM a WYSIWYG engine actually gets right

## Related

- [[Profile__Zettlr]]: the same "file is the document" stance with a source-first CM6 editor, citations and projects
- [[Profile__VNote]]: native Qt, cmark-backed, with a scoped local HTTP API for agents
- [[Profile__Milkdown]]: the other WYSIWYG-round-trips-Markdown engine in the study

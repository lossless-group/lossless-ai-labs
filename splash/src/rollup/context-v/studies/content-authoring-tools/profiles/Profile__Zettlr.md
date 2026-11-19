---
name: Zettlr Profile
title: Zettlr — Profile
slug: zettlr
upstream: https://github.com/Zettlr/Zettlr
pinned_sha: 450e040c8
pinned_date: 2026-11-19
version_at_pin: "v4.10.0-21-g450e040c8 (nearest tag)"
license: GPL-3.0
maintainer: Zettlr project — Hendrik Erz (lead maintainer), with community contributors
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/zettlr
profile_kind: Academic Markdown editor — Electron + Vue 3, CodeMirror 6 with live-preview widgets, Pandoc/citeproc publishing
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
site_uuid: 6b874461-a5e5-40b1-8c74-542e7c244cb7
hex_code: 9p2frq
lede: >-
  flave's closest living sibling: a CodeMirror 6 editor in which Pandoc
  citations, wikilinks and callouts are real Lezer syntax nodes, rendered in
  place until the cursor touches them.
summary: >-
  Profile of Zettlr as pinned in the content-authoring-tools study. A
  source-first Markdown editor whose CM6 stack extends @lezer/markdown with
  sixteen custom block and inline parsers (Pandoc citations with CSL locators, Zettelkasten
  links and tags, Pandoc divs and spans, admonitions, grid tables, math,
  frontmatter), renders them as replace-widgets that step aside under the
  selection, and keeps every open document in a main-process "document
  authority" synced to editors over @codemirror/collab. Covers the
  .ztr-directory project sidecar, the Pandoc-defaults export pipeline, the
  per-document bibliography, remote-change handling, and the absence of any
  agent or AI surface.
tags:
  - Profile
  - Zettlr
  - Markdown-Editor
  - CodeMirror-6
  - Citations
  - Pandoc
  - Zettelkasten
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Zettlr.md"
---
# Zettlr — Profile

A profile of Zettlr as it lives in this study (`studies/content-authoring-tools/zettlr`, pinned at `450e040c8`, nearest tag `v4.10.0`, 2026-11-19). GPL-3.0, Electron 44 + Vue 3 + Pinia, CodeMirror 6 + Lezer, chokidar, citeproc-js, Pandoc for publishing.

This is the study's **source-first, citation-native** entry, and the one whose architecture is closest to flave's. Read it as a parts catalogue.

## TL;DR

Zettlr edits plain `.md` files in a CM6 source editor. In its default `renderingMode: 'preview'` (`markdown-editor/util/configuration.ts:39`, `:109`), headings, links, images, math, Mermaid, tasks, tables and **citations** are replaced by rendered widgets wherever the cursor is not. The text on disk never stops being Markdown, and there is no second rendered document. Publishing goes through Pandoc with user-editable defaults files.

**One sentence:** *Zettlr proves that "source pane plus rendered widgets" scales to a serious academic dialect (Pandoc citations, crossrefs, divs, grid tables) without giving up byte-level ownership of the file. It is also a reminder that an editor can do all of that and still offer an agent nothing but the filesystem.*

## How it works

- **Main process as server.** Singleton service providers (`source/app/service-providers/`: `documents`, `fsal`, `citeproc`, `links`, `tags`, `search`, …) serve renderer windows over IPC. The README describes it as a "classical server/single-page-application pattern" (`README.md:229-269`).
- **One parser, many extensions.** `parser/markdown-parser.ts` calls `markdown({ base: markdownLanguage, extensions })` and adds 7 block parsers (Pandoc div, admonition, YAML frontmatter, block math, footnote refs, grid and pipe tables) and 9 inline parsers (Pandoc span, inline math, footnote, **citation**, Zettelkasten link, tag, Pandoc link, Pandoc attributes, highlight) (`markdown-parser.ts:219-251`). Each new node type is declared in `defineNodes` with a highlight tag; the `Name/...` convention styles every child (`:255-313`).
- **About 65 fenced-code language entries** are mapped by info string. Mermaid gets an *empty* `StreamLanguage` so that it still produces a `FencedCode` node for the renderer to find (`markdown-parser.ts:128-134`).
- **Renderers are syntax-tree walkers.** `renderers/base-renderer.ts` iterates `syntaxTree(state)` over the visible ranges, **skips any node the selection overlaps** (`:88`), asks `shouldHandleNode`, and emits `Decoration.replace({ widget })`. Inline renderers are `ViewPlugin`s that re-run on doc, viewport or selection changes. Block renderers are `StateField`s over the whole document, because multi-line replacements need to be (`:144-196`). Whether a cursor *adjacent* to a node also reveals its syntax is a preference (`:79`).
- **Document authority over `@codemirror/collab`.** Editors do not own document state. `plugins/remote-doc.ts` wraps `collab()` with a push/pull loop against the main process (`:54`). If the authority answers `false`, the editor dispatches `reloadStateEffect` and rebuilds (`:38`). The main-process `Document` record holds `currentVersion`, `minimumVersion`, `lastSavedVersion`, `lastSavedContent` and the granular `updates[]` (`documents/index.ts:66-110`). Several panes and windows editing one file is the same problem as collaboration, solved with the same library.

## What's on disk

Markdown files, plus an optional `.ztr-directory` JSON sidecar per folder that only exists when settings differ from the defaults (`fsal/fsal-directory.ts:67-80`). Its shape, from the two templates in that file (`:26-46`), when the folder is a **project**:

```json
{
  "sorting": "name-up", "project": {
    "title": "Untitled", "profiles": [], "files": [],
    "cslStyle": "", "templates": { "tex": "", "html": "" } },
  "icon": null, "color": null
}
```

`profiles` names Pandoc defaults files. Those ship as YAML in `static/defaults/`, for example `XeLaTeX PDF.yaml` (`reader: markdown`, `writer: pdf`, `filters: [{type: citeproc}]`, `pdf-engine: xelatex`). The citation library is per document: frontmatter `bibliography:` wins, else the global library (`common/util/get-bibliography-for-descriptor.ts`). Only the first entry is used when several are listed. Zettelkasten IDs default to `idRE: '(\d{14})'` / `idGen: '%Y%M%D%h%m%s'` (`config/get-config-template.ts:374-375`).

## Agent reach

- **Files: read and write, yes.** Notes, `.ztr-directory`, defaults YAML and the CSL JSON/BibTeX library are all plain files an agent can edit.
- **External writes are noticed.** A chokidar watchdog covers the workspace (`fsal/fsal-watchdog.ts:17`). Separately, the documents provider watches *open* files and runs `handleRemoteChange` (`documents/index.ts:1055`). It ignores events whose `mtime` is not newer, a guard against OneDrive/Box jitter (`:1079`), and events whose disk bytes equal `lastSavedContent` (`:1088`). Otherwise it reloads silently if the buffer is clean and `alwaysReloadFiles` is on. In every other case it asks "Keep editor contents / Load changes from disk" (`:1093-1136`). Reloading drops the authority's document and broadcasts `FILE_REMOTELY_CHANGED` (`:1303-1311`). This is a whole-document replace, not a merge.
- **The citation library is watched too**, so an agent appending to the CSL JSON or `.bib` updates autocomplete and rendering live (`citeproc/index.ts:95-150`).
- **No API, no MCP, no plugin host, no AI.** The CLI flags are `--data-dir`, `--clear-cache`, `--disable-hardware-acceleration` and `--launch-minimized` (`app/service-providers/cli-provider.ts:19-54`). A search for OpenAI/Anthropic/Ollama/LLM finds nothing. "Snippets", custom CSS and Pandoc defaults are the user-level extension points (`source/win-assets/`).

## What's clever or unique

1. **Citations are parsed, not regexed.** `citation-parser.ts` follows the Pandoc manual and mounts child nodes for prefix, suppress-author flag, `@`, citekey, locator and suffix. Locator labels come from the CSL locale files in English, German and French (`:46-80`), so `[see @doe2020, S. 12]` resolves to the `page` term. `nodeToCiteItem` (`:229`) turns a node into a CSL cite item, and `extractCitationNodes` (`:323`) feeds the bibliography sidebar.
2. **Citations render in place via citeproc.** `CitationWidget` asks `window.getCitationCallback(library)` for formatted HTML and sanitizes it (`renderers/render-citations.ts:65`). If every key starts `fig:`, `tbl:`, `eq:` or `sec:`, it renders a pandoc-crossref label instead (`:37-55`). Right-click opens a citation menu. Autocomplete ranks citekeys by how often they already appear in the document (`autocomplete/citations.ts`).
3. **Tables are edited in nested CodeMirror subviews.** Each cell is a CM instance that "mirrors the main document, but only allows editing the span of text within a given table cell" (`table-editor/subview.ts:10-14`). The table stays Markdown, with no separate grid model.
4. **Lint is a stack of `@codemirror/lint` sources.** remark-lint rules (`linters/md-lint.ts:79-94`), YAML frontmatter lint, spellcheck and LanguageTool, all surfaced through one gutter and status bar.
5. **Wikilinks degrade on export by policy.** A Lua filter unlinks or strips `[[links]]` according to frontmatter `zettlr.strip_links` (`static/lua-filter/links.lua:17`). The link syntax is native in the editor and negotiable in the published output.

## Costs / limits

- **Pandoc is the publisher.** Export quality and features are Pandoc's. Zettlr's job is to produce the defaults file, the CSL style and the filters (`commands/exporter/`).
- **Single bibliography per document** (`get-bibliography-for-descriptor.ts`, "cannot properly merge multiple libraries").
- **Remote change is reload-or-keep, never merge.** The collab machinery is used only between Zettlr's own panes. An external writer forces a full document reload.
- **`.ztr-directory` write path.** As pinned, `persistSettings` deletes a default-settings file and then writes it anyway (no early return, `fsal-directory.ts:67-80`). A small inconsistency, but the "sidecar only when non-default" intent is not fully enforced.
- **GPL-3.0.** Patterns can be learned from, but code cannot be lifted into a differently-licensed flave.

## Relevance to flave

- **Borrow the renderer shape.** A `shouldHandleNode` / `createWidget` pair over the Lezer tree, with "skip if the selection overlaps," inline as a `ViewPlugin` and block as a `StateField` (`base-renderer.ts`). This is a direct template for flave's trigger packs inside the CM6 pane, if flave ever adds in-source previews alongside its rendered pane.
- **Borrow the citation node anatomy.** Separate `CitationPrefix` / `CitationAtSign` / `CitationCitekey` / `CitationLocator` / `CitationSuffix` nodes make autocomplete, hover, context menus and linting cheap. LFM's hex-code citations would benefit from the same decomposition into child nodes. Also look at the frequency-ranked citekey autocomplete.
- **Consider the document-authority pattern** (`remote-doc.ts` + `@codemirror/collab`) when flave's Tauri side gains file watching. One authority per file in Rust or the host, editors as collab clients, and an external change becomes "authority replaces the doc" rather than each pane guessing.
- **Copy the remote-change guards.** Newer-`mtime` only, then content-equals-last-saved, then a clean-buffer silent reload behind a remembered preference. This matches [[Profile__MarkText]]'s decision table.
- **Note what is missing.** No agent surface at all. flave's "one operation set with four callers" (menu, palette, page, agent) is the step Zettlr never took.
- **Avoid a single-bibliography assumption.** flave's sources bibliography should merge multiple libraries from the start.

## Read next

- `source/common/modules/markdown-editor/parser/markdown-parser.ts:219-313`: the whole dialect in one `extensions` object
- `source/common/modules/markdown-editor/renderers/base-renderer.ts`: the reveal-on-cursor widget pattern
- `source/common/modules/markdown-editor/parser/citation-parser.ts` and `renderers/render-citations.ts`: citations end to end
- `source/common/modules/markdown-editor/plugins/remote-doc.ts` and `source/app/service-providers/documents/index.ts:1055-1136`: the authority and remote changes
- `static/defaults/*.yaml` and `static/lua-filter/`: the publishing contract

## Related

- [[Profile__MarkText]]: the WYSIWYG counterpoint; same "file is the document" stance, no citations
- [[Profile__VNote]]: native Qt, cmark wikilinks, and a scoped HTTP API, the agent surface Zettlr lacks
- [[Profile__mystmd]]: the other citation-and-crossref Markdown dialect in the study
- [[Profile__SilverBullet]]: CM6 live preview over Markdown files, served from a browser

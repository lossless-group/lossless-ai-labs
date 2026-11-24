---
title: "app/src/routes/ — the page"
lede: "One prerendered page that is the whole app: tree, list, search, reader, changes and capture."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/app/src/routes"
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Current
category: Mirror
type: Mirrors
tags:
  - Mirror
  - SvelteKit
  - Frontend
site_uuid: c461a642-d3ce-40d7-885f-8cbdac566a33
hex_code: 9ugod2
summary: "Mirror of app/src/routes/. +page.svelte is the largest frontend file; most screen behaviour lives there."
from: "corpora-builder"
from_path: "context-v/mirrors/app/src/routes/index.md"
---
# app/src/routes/ — the page

> [!info] Mirror of `corpora-builder/app/src/routes`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

## Files

### Main screen

`app/src/routes/+page.svelte` · 824 lines

The whole corpus screen: folder tree, source list, topic filter, search, source reader, recent changes and adding new links.

**What it can do**

- loads workspace and topics (`load`), the folder tree (`loadTree`), and recent changes (`loadChanges`)
- filters by topic folder and by focus (`toggleFocus`), searches with debounce (`applySearch`), pages with `showMore`
- uses ranked Pagefind search when the bundle is current (`wireSearch`), server-side search otherwise
- opens a source in the reader (`view`) and a folder or file from the tree (`pickNode`, `toggleDir`)
- captures a pasted link (`capture`) and rebuilds the index (`reindex`)
- ignores late answers to superseded requests (`Latest`)

**Interface**

- uses components: `DomainCombo`, `CorpusTree`, `WorkspaceMenu`, `ModeToggle`, `CorporaMark`, `SearchPanel`
- calls `api.meta`, `api.tree`, `api.sources`, `api.source`, `api.changes`, `api.capture`, `api.reindex`, `api.pagefindBase`, `api.binaryUrl`

### Page wrapper

`app/src/routes/+layout.svelte` · 11 lines

Loads the colour theme, applies the saved light/dark mode and titles the window "corpora".

**Interface**

- imports `tokens.css`; runs `mode.init()`; title `corpora`

### Page build setting

`app/src/routes/+layout.ts` · 4 lines

Tells the build to make a ready-made page rather than one drawn by a server.

**Interface**

- `prerender = true`, `ssr = false`

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

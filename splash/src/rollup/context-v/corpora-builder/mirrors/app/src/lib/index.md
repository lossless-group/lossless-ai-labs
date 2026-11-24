---
title: "app/src/lib/ — screen logic"
lede: "The server client and the small pure helpers the screen relies on, each tested beside its own file."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/app/src/lib"
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
  - TypeScript
  - Frontend
site_uuid: 07b471ac-4c1d-4842-ac69-08d057f77dc2
hex_code: nulwhq
summary: "Mirror of app/src/lib/. api.ts is the only file that talks to the server; keep it to get/post."
from: "corpora-builder"
from_path: "context-v/mirrors/app/src/lib/index.md"
---
# app/src/lib/ — screen logic

> [!info] Mirror of `corpora-builder/app/src/lib`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

Tests sit beside the code (`*.test.ts`, node's own runner via
`app/scripts/run-tests.mjs`); each test name starts with the spec ID it proves.

## Files

### Talking to the local server

`app/src/lib/api.ts` · 188 lines

Sends every request the screen makes to the local server on this machine, on port 8787 by default.

**What it can do**

- two transport methods only, `get` and `post`, against `VITE_CORPORA_API` or `http://127.0.0.1:8787`

**Interface**

- `api.meta()` → `GET /api/meta` : `Meta`
- `api.sources(domain?, search?, focus?, limit=200)` → `GET /api/sources` : `Listing`
- `api.source(path)` → `GET /api/source` : `string`
- `api.capture(url, domain, full)` → `POST /api/capture` : `CaptureResult`
- `api.tree()` → `GET /api/tree` : `{total, tree: TreeNode[]}`
- `api.reindex()` → `POST /api/reindex` : `ReindexResult`
- `api.changes(repo, prefix?, limit=20)` → `GET /api/changes` : `ChangePage`
- `api.pagefindBase()` → URL string for the search bundle
- `api.binaryUrl(key)` → URL string for `GET /api/binary`
- types: `Listing`, `SourceRow`, `Change`, `ChangePage`, `Meta`, `ReindexResult`, `CaptureResult`, `WorkspaceInfo`, `FocusDef`, `TreeNode`

### Ranked search

`app/src/lib/search.ts` · 252 lines

Runs searches against the search index the local server provides, and decides when that index is up to date enough to trust.

**Interface**

- `class RankedSearch` — runs queries against the loaded Pagefind bundle
- `loadBundle(base, fingerprint): Promise<Bundle | null>`
- `decideSearch(...): SearchDecision` — `ranked` or `server`, and why
- `poolCoversCorpus(poolSize, selected): boolean`
- `safeExcerpt(raw): string` — text plus `<mark>` only
- `keyOf(data): string`
- types: `PagefindApi`, `PagefindResponse`, `PagefindResult`, `PagefindData`, `RankedHit`, `RankedPage`, `Bundle`, `SearchMode`, `SearchDecision`

### Topic matching

`app/src/lib/domains.ts` · 146 lines

Scores how well typed words match each topic folder, and steps back up the folder path one level at a time.

**Interface**

- `normalize(s)`, `words(s)`
- `score(query, domain): number` (`NO_MATCH = -1`), `rank(query, domains): string[]`
- `chopSegment(value)`, `isNavigable(value, domains)`, `splitForDisplay(domain): {prefix, rest}`

### Ignore stale answers

`app/src/lib/latest.ts` · 51 lines

Drops answers to questions the screen has since stopped asking, so a slow old reply can't overwrite a newer one.

**Interface**

- `class Latest`

### Colour mode rules

`app/src/lib/modes.ts` · 33 lines

Defines the light, dark and vibrant cycle, what a click switches to, and the button's hover text.

**Interface**

- `MODES = ['light', 'dark', 'vibrant']`, `type Mode`
- `nextMode(current)`, `modeTooltip(current)`, `isMode(value)`

### Colour mode memory

`app/src/lib/mode.svelte.ts` · 52 lines

Keeps track of the current colour mode and applies it to the page.

**Interface**

- `mode` — the shared mode state (`mode.init()` applies the saved mode)
- re-exports `MODES`, `modeTooltip`, `nextMode`, `Mode`

### Workspace label

`app/src/lib/workspace.ts` · 27 lines

Works out what to call the workspace in the header and where its files live, never showing a blank name.

**Interface**

- `workspaceLabel(ws, label?)`, `workspaceStorage(ws)`

### Colours and type

`app/src/lib/styles/tokens.css` · 345 lines

The app's colours, fonts and spacing for light, dark and vibrant modes, in two layers so parts never pick raw colours.

**What it can do**

- Tier 1 named colours, Tier 2 semantic tokens components read; three modes (light, dark, vibrant); checked by `design-drift.mjs`

### Topic matching tests

`app/src/lib/domains.test.ts` · 154 lines

Checks topic scoring, tie-breaking and stepping back up a folder path.

### Search tests

`app/src/lib/search.test.ts` · 335 lines

Checks ranked search, highlighted excerpts, and when the search index is trusted.

### Stale answer tests

`app/src/lib/latest.test.ts` · 55 lines

Checks that an out-of-date reply is ignored.

### Colour mode tests

`app/src/lib/mode.test.ts` · 36 lines

Checks the light/dark/vibrant cycle and the switch's hover text.

### Workspace label tests

`app/src/lib/workspace.test.ts` · 29 lines

Checks the header never shows a blank workspace name.

## Inside

* [app/src/lib/components/ — screen parts](components/) - Tree, topic picker, search panel, workspace menu, mode switch, logo.

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

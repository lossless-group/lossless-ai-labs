---
title: "app/src/ — the screen"
lede: "The one page people use, the parts it's built from, and the logic behind them."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/app/src"
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
site_uuid: 90d12078-4284-4978-ae5c-1890bae65f88
hex_code: 7yu38v
summary: "Mirror of app/src/. Prerendered static shell; the page loads data from the local server at runtime."
from: "corpora-builder"
from_path: "context-v/mirrors/app/src/index.md"
---
# app/src/ — the screen

> [!info] Mirror of `corpora-builder/app/src`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

`routes/` holds the single page; `lib/` holds everything it uses, imported
through the `$lib/` alias.

## Files at this level

### Page frame

`app/src/app.html` · 21 lines

The empty page the screen is drawn into.

## Inside

* [app/src/routes/ — the page](routes/) - The layout wrapper and the main screen.
* [app/src/lib/ — screen logic](lib/) - Server client, search, topic matching, modes, tokens.

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

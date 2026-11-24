---
title: "app/ — desktop app"
lede: "A Tauri window around a one-screen SvelteKit app that starts the local Python server and talks only to it."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/app"
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.2
status: Current
category: Mirror
type: Mirrors
tags:
  - Mirror
  - Tauri
  - SvelteKit
  - Desktop-App
site_uuid: c545dd30-73b2-4a48-ba2f-1118cfaefda7
hex_code: h4w48y
summary: "Mirror of app/. The screen never touches R2; everything goes through src/server over 127.0.0.1:8787."
from: "corpora-builder"
from_path: "context-v/mirrors/app/index.md"
---
# app/ — desktop app

> [!info] Mirror of `corpora-builder/app`, taken 2026-11-22 at commit `72a0aa7`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

SvelteKit 3 on Vite 8 with the static adapter (no server-side rendering),
Svelte 5 runes, TypeScript 6. SvelteKit 3 reads its configuration from the
`sveltekit({...})` plugin in `vite.config.js`; there is no
`svelte.config.js`. The Rust side starts the Python server, waits for `/healthz`, and
kills it on exit. The webview calls the server directly over localhost rather
than through Rust commands, so the server's CORS list is part of the contract.
Dev preview runs on port 1420.

## Files at this level

### App build settings

`app/vite.config.js` · 23 lines

Holds all the screen's build settings: ready-made files the window can load, the $lib shortcut, and the dev preview on port 1420.

**Interface**

- `sveltekit({ preprocess: vitePreprocess(), adapter: adapter({ fallback: 'index.html' }), alias: { $lib: 'src/lib' } })`
- `$lib` is an explicit alias: SvelteKit 3 replaced it with `#lib`; kept for convergence with memopop-native
- dev server on port `1420`, `strictPort`; ignores `src-tauri/**`

## Inside

* [app/src-tauri/ — launcher](src-tauri/) - Starts, checks and stops the Python server.
* [app/src/ — the screen](src/) - The one page, its components and its logic.
* [app/scripts/ — app tools](scripts/) - Search-index builder, design-rules check, test runner.

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `72a0aa7` on `development`.

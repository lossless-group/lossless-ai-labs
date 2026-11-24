---
title: "app/src-tauri/ — launcher"
lede: "Rust that starts the Python server on 8787, trusts it only after /healthz answers, and kills it on exit."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/app/src-tauri"
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
  - Tauri
  - Rust
site_uuid: 47932b93-62a5-41e2-bcc0-b7621224b9fa
hex_code: sscnxu
summary: "Mirror of app/src-tauri/. Note: the launcher adopts any process already answering on 8787."
from: "corpora-builder"
from_path: "context-v/mirrors/app/src-tauri/index.md"
---
# app/src-tauri/ — launcher

> [!info] Mirror of `corpora-builder/app/src-tauri`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

Finds the repo (`CORPORA_REPO`, or derived from its own location), runs
`.venv/bin/python -m src.server` with `CORPORA_PORT=8787`, polls `/healthz`
until it answers or times out (and kills what it started on timeout). It
always probes before trusting a tracked process. See the reminder
`context-v/reminders/The-Sidecar-Port-Is-Adopted-Not-Owned.md`: anything
already answering on 8787 becomes the app's backend.

## Files

### Desktop launcher

`app/src-tauri/src/lib.rs` · 174 lines

Starts the local server when the app opens, checks it answers before trusting it, and stops it when the app closes.

**What it can do**

- starts the server eagerly at app launch, not on first request
- fails with a clear message when there is no `.venv` (run `uv sync --extra dev`)
- drains the child's output so it can't block

**Interface**

- `pub fn run()` — builds the Tauri app with the shell and opener plugins
- command `sidecar_status() -> {ok, base}` — what the screen can call to make sure the server is up
- `ensure_sidecar(app)` — probe, spawn if needed, wait for health
- `healthz_ok()`, `sidecar_url(path)`, `repo_root()`, `venv_python(repo)` — helpers
- constant `SIDECAR_PORT = 8787`

### App start

`app/src-tauri/src/main.rs` · 6 lines

Starts the desktop launcher, hiding the extra console window on Windows.

**Interface**

- `main()` calls `corpora_native_lib::run()`

### Launcher build step

`app/src-tauri/build.rs` · 3 lines

Standard one-line build step for the desktop launcher.

**Interface**

- `tauri_build::build()`

### App icon drafts

`app/src-tauri/icons/drafts/contact-sheet.html` · 53 lines

A sheet showing draft app icons side by side for choosing one; not part of the running app.

### App icon drafts, round 2

`app/src-tauri/icons/drafts/round2/contact-sheet.html` · 26 lines

A second sheet of draft app icons for comparison; not part of the running app.

### App icon drafts, sheet 3

`app/src-tauri/icons/drafts/round2/sheet3.html` · 26 lines

Another sheet of draft app icons for comparison; not part of the running app.

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

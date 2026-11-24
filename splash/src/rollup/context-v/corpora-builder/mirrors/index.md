---
title: "corpora-builder, as built"
lede: "The repo's tree, mirrored: what every folder and file is for, what it can do, and the interface it offers."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder repository"
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
  - Architecture
  - Corpora-Builder
site_uuid: 4224c124-0b39-4eee-bc80-23573bbb9c5e
hex_code: j9s3df
summary: "Root of the corpora-builder mirror. Read it to understand what exists in the code today without opening the source; follow the Inside links down the same tree the repo has. Taken from source at the commit in the header; re-take it rather than editing it once the code has moved."
from: "corpora-builder"
from_path: "context-v/mirrors/index.md"
---
# corpora-builder, as built

> [!info] Mirror of `corpora-builder repository`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

> [!note] Mirrors are experimental
> In this repo a mirror copies the project's tree, not necessarily all the way
> down, and says for every file what it is for, what it can do, and what
> interface it offers: functions, classes, routes, props. It is the code's
> current shape in words, so a person or an agent can find their way without
> reading source. Unlike a spec, it doesn't say what we intend; unlike a
> blueprint, it doesn't explain why the design is the way it is. It reports.

## In one paragraph

corpora-builder collects source material (web pages, PDFs, reports) into
named collections called corpora, one per client workspace, stored in
Cloudflare R2. There are two ways in: the `corpora` command line, and a
desktop app (Tauri + SvelteKit) that starts a small FastAPI server on
`127.0.0.1:8787` and talks only to it. Both stand on one Python engine under
`src/`: capturing links, the source-file format, PDFs stored once by content
hash, a catalogue (the manifest) plus a Pagefind search index, a change list
read from git, workspaces, and a storage interface with R2, local-disk and
cached implementations.

## The tree

```
corpora-builder/
├── src/                 the engine, the CLI, and the local server (Python)
│   ├── cli.py           the `corpora` command
│   ├── ledger.py        spec-ID bookkeeping for the test loop
│   ├── server/          FastAPI server the desktop app talks to
│   ├── capture/         link → source file
│   ├── model/           what a source file is
│   ├── binary/          PDFs and other large files, stored by hash
│   ├── index/           the manifest and the search index
│   ├── feed/            what changed, from git history
│   ├── store/           storage interface: R2, local disk, cached
│   └── identity/        which workspace, and where it lives
├── app/                 desktop app
│   ├── src-tauri/       Rust launcher: starts and watches the server
│   ├── src/routes/      the one screen
│   ├── src/lib/         screen logic and components
│   └── scripts/         search-index builder, design check, test runner
├── scripts/             check ladder, spec ledger, R2 helpers
└── tests/               pytest suite, each test tagged with spec IDs
```

## How the pieces connect

```
 desktop window ──(http://127.0.0.1:8787)──► src/server ──┐
 corpora CLI ─────────────────────────────────────────────┤
                                                          ▼
              capture · model · binary · index · feed · identity
                                                          │
                                                     src/store
                                          ┌───────────────┼──────────────┐
                                     Cloudflare R2   local folder   in-memory cache
```

Outside services the code calls: Cloudflare R2 (via `boto3`), Jina Reader
(`r.jina.ai`, full-page fetch), Pagefind (search bundle, built with Node),
Ghostscript and `pdftotext` (PDF shrinking, optional), and `git` (change list).

## Configuration it reads

| Variable | Read by | Effect |
|---|---|---|
| `CORPORA_WORKSPACE`, `CORPORA_WORKSPACE_NAME` | `src/cli.py`, `src/identity/static.py` | which client workspace, and its display name |
| `CORPORA_R2_BUCKET`, `CORPORA_R2_PREFIX` | `src/cli.py`, `src/identity/static.py` | where that workspace's corpus lives |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_API_ENDPOINT` | `src/cli.py` | R2 credentials; missing ones stop the CLI with a hint |
| `CORPORA_LOCAL` | `src/server/__main__.py` | serve a local folder instead of R2 |
| `CORPORA_WRITABLE` | `src/server/__main__.py` | `1` lets the server capture and re-index |
| `CORPORA_PORT` | `src/server/__main__.py`, set by the launcher | default `8787` |
| `CORPORA_CACHE_DIR`, `XDG_CACHE_HOME` | `src/binary/store.py` | where this machine keeps its PDF cache |
| `CORPORA_REPO` | `app/src-tauri/src/lib.rs` | where the launcher finds the Python repo |
| `VITE_CORPORA_API` | `app/src/lib/api.ts` | point the screen at a different server |

Values come from `.env` at the repo root (never committed).

## Inside

* [src/ — engine, CLI and server](src/) - The Python engine, the corpora command and the local server.
* [app/ — desktop app](app/) - The Tauri launcher and the SvelteKit screen.
* [scripts/ — maintenance](scripts/) - The check ladder, the spec ledger and R2 helpers.
* [tests/ — test suite](tests/) - Pytest suite, every test tagged with the spec ID it proves.

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

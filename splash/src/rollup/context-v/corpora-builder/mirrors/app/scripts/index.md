---
title: "app/scripts/ — app tools"
lede: "Three dependency-free Node scripts: build the search bundle, enforce the design rules, run the frontend tests."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/app/scripts"
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
  - Node
  - Tooling
site_uuid: aca7de02-21db-477d-9301-753f8671fabd
hex_code: dmhnrq
summary: "Mirror of app/scripts/. build-search-index.mjs is called by src/index/search_index.py; the other two by scripts/check.sh."
from: "corpora-builder"
from_path: "context-v/mirrors/app/scripts/index.md"
---
# app/scripts/ — app tools

> [!info] Mirror of `corpora-builder/app/scripts`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

## Files

### Search index builder

`app/scripts/build-search-index.mjs` · 123 lines

Builds the search index from the catalogue of sources, without opening any source file or talking to R2.

**What it can do**

- reads a manifest file, never the corpus and never R2
- prints one JSON line: `{records, errors}`

**Interface**

- `node scripts/build-search-index.mjs --manifest <path.jsonl> --out <dir>`
- called by `build_search_index` in `src/index/search_index.py`

### Design rules check

`app/scripts/design-drift.mjs` · 144 lines

Fails if a screen part uses a raw colour or a colour name that doesn't exist, or if the design doc and colours disagree.

**Interface**

- checks D1 no component reads a Tier-1 token, D2 no colour literal outside Tier 1, D3 step numbers track darkness, D4 `DESIGN.md` and `tokens.css` agree on every Tier-1 hex, D5 no component reads a token that doesn't exist
- exits non-zero on any violation; run by `scripts/check.sh`

### Screen test runner

`app/scripts/run-tests.mjs` · 57 lines

Runs the screen's tests and saves the results where the spec progress report can read them.

**Interface**

- writes `app/.spec-results.json` for `scripts/spec_status.py`; run by `scripts/check.sh`

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

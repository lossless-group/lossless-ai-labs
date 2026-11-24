---
title: "scripts/ — maintenance"
lede: "The check ladder, the spec ledger, and the tools for setting up, verifying and filling an R2 bucket."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/scripts"
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
  - Tooling
  - Cloudflare-R2
site_uuid: 45566809-d0bb-4694-baba-d64f79044c67
hex_code: skicoy
summary: "Mirror of scripts/. check.sh is the ladder every change must pass; spec_status.py is the only source of spec status."
from: "corpora-builder"
from_path: "context-v/mirrors/scripts/index.md"
---
# scripts/ — maintenance

> [!info] Mirror of `corpora-builder/scripts`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

## Files

### Full quality check

`scripts/check.sh` · 69 lines

Runs formatting, linting, type checks, all tests, the design rules check and the spec progress report, cheapest first.

**Interface**

- rungs, cheapest first: `black --check`, `ruff check`, design drift, mypy (reports, never blocks), `pytest`, frontend tests, the ledger
- Node rungs are skipped, not failed, when Node is absent

### Spec progress report

`scripts/spec_status.py` · 225 lines

Runs all tests and reports which numbered spec requirements are proven, failing or missing a test.

**Interface**

- `run_frontend_tests() -> int` — Run the app's tests so `app/.spec-results.json` is fresh.
- `run_pytest() -> int` — Run the suite so the results file is fresh. Returns pytest's exit code.
- `load_results(path: Path=RESULTS_PATH) -> dict[str, dict]`
- `main() -> int`
- constants: `REPO_ROOT`, `SPECS_DIR`, `RESULTS_PATH`, `APP_RESULTS_PATH`

### Set up R2 keys

`scripts/import_r2_credentials.py` · 167 lines

Copies R2 access keys from what Cloudflare gave you into the local settings file.

**Interface**

- `main() -> int`
- constants: `ENV_PATH`

### Check R2 keys work

`scripts/verify_r2.py` · 129 lines

Tries the R2 keys in local settings to prove they work before anything relies on them.

**Interface**

- `load_env() -> dict[str, str]`
- `main() -> int`
- constants: `ENV_PATH`, `PROBE_KEY`

### Upload a corpus to R2

`scripts/mirror_corpus.sh` · 105 lines

Copies a corpus folder on this machine up to its R2 bucket, one direction only.

**Interface**

- `./scripts/mirror_corpus.sh <source-dir> [--verify] [--dry-run]`
- uses `rclone copy`, never `sync`: it can't delete anything in the client bucket

### R2 command helper

`scripts/r2.sh` · 66 lines

Runs any rclone command against this workspace's R2 bucket using keys from local settings, without saving them elsewhere.

**Interface**

- `./scripts/r2.sh <rclone args…>` — credentials from `.env` at run time, never written to `rclone.conf`

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

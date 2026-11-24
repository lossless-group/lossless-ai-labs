---
title: "src/ — engine, CLI and server"
lede: "One Python engine behind two front doors: the corpora command and the local server the app talks to."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/src"
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
  - Python
  - Corpora-Builder
site_uuid: 38f30954-340f-47f7-bce3-8ba3293b97c3
hex_code: nftxfs
summary: "Mirror of src/: the CLI entry, the ledger logic, and links to each engine package. Imports are absolute (src.x.y); the engine packages never import src/server."
from: "corpora-builder"
from_path: "context-v/mirrors/src/index.md"
---
# src/ — engine, CLI and server

> [!info] Mirror of `corpora-builder/src`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

Flat `src/` with absolute `src.`-prefixed imports, so `python -m src.server`
works from the repo root (the launcher depends on that). Dependency direction:
`cli.py` and `server/` use the engine packages; the engine packages use
`model/` and `store/`; nothing in the engine imports `server/`.

| Package | Uses |
|---|---|
| `capture/` | `model`, `binary`, `index`, `store` |
| `index/` | `model`, `store` |
| `binary/` | `store` |
| `feed/` | git (subprocess) |
| `identity/` | nothing |
| `server/` | everything above |

## Files at this level

### The corpora command

`src/cli.py` · 396 lines

Adds links, lists and shows sources, fetches PDFs, shows changes, re-indexes, fills missing addresses and starts the local server.

**What it can do**

- `corpora add <url> [--domain type/slug] [--fetch] [--origin]` — capture a link; without `--domain` it files to the inbox
- `corpora ls [prefix] [--limit 50]` — list sources (default prefix `live/`)
- `corpora show <path>` — print one source file
- `corpora fetch <key-or-wrapper> [--out]` — bring a stored PDF back from `bin/` to disk
- `corpora changes [--repo .] [--prefix] [--limit 10] [--max-paths 5] [--json]` — what changed, as prose or JSON
- `corpora reindex [--prefix]` — rebuild the manifest and the search index
- `corpora backfill-urls [--prefix] [--sample 5]` — add `normalized_url` where missing; dry run by default
- `corpora serve [--port 8787] [--host 127.0.0.1]` — start the local server
- every command takes `--local <dir>` to use a folder instead of R2

**Interface**

- `load_env() -> dict[str, str]`
- `build_store(env: dict[str, str], local: str='') -> tuple[CorpusStore, Workspace]` — The store and the workspace it belongs to.
- `cmd_add(args: argparse.Namespace) -> int`
- `cmd_ls(args: argparse.Namespace) -> int`
- `cmd_fetch(args: argparse.Namespace) -> int` — `corpora fetch` — bring a binary back from `bin/` to a local path.
- `cmd_changes(args: argparse.Namespace) -> int` — `corpora changes` — what changed in a corpus, and why.
- `cmd_show(args: argparse.Namespace) -> int`
- `cmd_reindex(args: argparse.Namespace) -> int` — `corpora reindex` — rebuild the manifest, and the search bundle from it.
- `cmd_backfill_urls(args: argparse.Namespace) -> int` — `corpora backfill-urls` — give every source a stable identity.
- `cmd_serve(args: argparse.Namespace) -> int`
- `main(argv: list[str] | None=None) -> int`
- constants: `ENV_PATH`

### Spec checklist logic

`src/ledger.py` · 124 lines

Reads each spec's numbered test list and marks every item green, red or missing from real test results.

**Interface**

- **class `TestRecord`**(`TypedDict`) — One test function's contribution to a spec ID.
  - fields: `nodeid`, `outcome`
- **class `SpecEntry`**(`TypedDict`) — The joined state of one spec ID: worst outcome plus its claimants.
  - fields: `outcome`, `tests`
- `parse_spec_ids(path: Path) -> tuple[list[str], list[str]]` — Return ``(active_ids, retired_ids)`` from a spec's ``## Tests`` section.
- `worst(outcomes: list[str]) -> str` — Return the most severe outcome in ``outcomes``.
- `join_outcomes(spec_ids_by_node: dict[str, list[str]], outcome_by_node: dict[str, str]) -> dict[str, SpecEntry]` — Join collected spec markers to test outcomes.
- `classify(spec_id: str, results: dict[str, SpecEntry]) -> str` — Return GREEN, RED, or MISSING for one spec ID against a results map.
- constants: `GREEN`, `RED`, `MISSING`, `RETIRED`, `GATED`, `SEVERITY`, `ID_PATTERN`

### Engine folder marker

`src/__init__.py` · 0 lines

Marks the engine's folder; empty.

## Inside

* [src/server/ — local server](server/) - FastAPI server: 11 routes, read-only unless started writable.
* [src/capture/ — capturing sources](capture/) - Link in, source file out; failures are recorded, never dropped.
* [src/model/ — source files](model/) - The source-file format, names, URLs, topics and the URL backfill.
* [src/binary/ — large files](binary/) - PDFs stored once by content hash, cached per machine.
* [src/index/ — catalogue and search](index/) - The manifest and the Pagefind search bundle.
* [src/feed/ — what changed](feed/) - Change records read from git, rendered as prose or JSON.
* [src/store/ — storage](store/) - One storage interface over R2, a local folder, or a cache.
* [src/identity/ — workspaces](identity/) - Which client workspace, and where its corpus lives.

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

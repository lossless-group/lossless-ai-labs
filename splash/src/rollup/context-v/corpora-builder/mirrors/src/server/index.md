---
title: "src/server/ — local server"
lede: "The FastAPI server the desktop app talks to: 11 routes on localhost, read-only unless started writable."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/src/server"
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
  - FastAPI
  - Server
site_uuid: 38731313-2898-43dc-8b5b-0f30892009d8
hex_code: tnp0zw
summary: "Mirror of src/server/. Lists every route with its parameters and gating. Use it before adding a route or calling one from the app."
from: "corpora-builder"
from_path: "context-v/mirrors/src/server/index.md"
---
# src/server/ — local server

> [!info] Mirror of `corpora-builder/src/server`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

Started by `python -m src.server` (what the desktop launcher runs) or
`corpora serve`. Binds `127.0.0.1` only. Whether it may write is decided once
at start (`CORPORA_WRITABLE=1` or `--writable`), never per request. There is
no sign-in: anything on this machine that can reach the port can call it.
CORS allows the Tauri webview origins (`tauri://localhost`, `http(s)://tauri.localhost`) and the dev preview (`localhost:1420`, `127.0.0.1:1420`).

> [!warning] Observed
> The desktop launcher sets only `CORPORA_PORT` when it starts the server, so
> the packaged app is read-only unless `CORPORA_WRITABLE=1` is already in the
> environment the app was started from. Capture from the screen answers 403
> otherwise.

## Routes

| Method & path | Parameters | Does | Gated |
|---|---|---|---|
| `GET /healthz` | – | `{ok, label, writable}`; the launcher probes it | – |
| `GET /` | – | the plain HTML page in `static/index.html` | – |
| `GET /api/meta` | – | workspace (`slug`, `display_name`, `bucket`), source count, domains, focus definitions, `writable`, `indexed`, and the search bundle's fingerprint | – |
| `GET /api/tree` | – | the corpus as a folder tree from keys alone | – |
| `GET /api/sources` | `prefix`, `domain`, `focus`, `search`, `limit` (1–2000, default 200), `offset` | a page of source rows, newest first | – |
| `GET /api/source` | `path` (required) | one source file's raw text; 400 on traversal, 404 if missing | – |
| `GET /api/changes` | `repo` (required), `prefix`, `limit` (1–200, default 20) | change records from a git copy of the corpus | – |
| `GET /api/binary` | `key` (must start `bin/`) | a stored file's bytes; fills this machine's cache | – |
| `GET /pagefind/{rel:path}` | – | search-bundle files out of the corpus, with correct content types (`application/wasm`) | – |
| `POST /api/reindex` | – | rebuild manifest and search bundle | 403 unless writable |
| `POST /api/capture` | body `{url, domain?, full?}` | capture a link via `add_source` with `JinaFetcher` | 403 unless writable |

## Files

### Server address book

`src/server/app.py` · 295 lines

Lists every address the app can ask the local server for, and refuses captures and re-indexing unless writing was switched on.

**Interface**

- `create_app(store: CorpusStore, label: str='corpus', writable: bool=False, bin_store: BinStore | None=None, workspace: Workspace | None=None) -> FastAPI` — The sidecar.
- constants: `STATIC`

### Reading a corpus for display

`src/server/browse.py` · 478 lines

Builds the source list, topic counts and single-source view, and still lists files it cannot read, along with their error.

**What it can do**

- lists sources two ways: from the manifest when one exists (every row affordable; search and focus filter rows), or by reading only the page requested when it doesn't
- reports `index_stale` when the store holds sources the manifest has never seen, and reads just those
- narrows by folder (`domain`), by topic reference with cascade (`focus`), and by text (`search`)
- skips `index.md`, `AGENTS.md`, `README.md` and everything under `index/` (they describe the corpus, they aren't sources)
- lists a file that won't parse, carrying its error
- re-exports `build_manifest`, `source_keys`, `NOT_SOURCES` from `src/index/build.py` for existing callers

**Interface**

- **class `SourceRow`** — One row of the listing.
  - fields: `path`, `domain`, `title`, `status`, `content_pulled`, `published_at`, `fetched_at`, `excerpt`, `url`, `binary_key`, `binary_state`, `binary_bytes`, `binary_optimized`, `domains`, `error`
  - `as_dict(self) -> dict[str, object]`
- **class `Listing`**
  - fields: `rows`, `total`, `domains`, `corpus_total`, `index_stale`
- `list_domains(store: CorpusStore, prefix: str='') -> tuple[int, list[str]]` — `(count, domains)` from keys alone — no file body is read.
- **class `DomainDef`** — A domain's own declaration of what it is.
  - fields: `folder`, `type`, `slug`, `title`, `path`
  - `value(self) -> str` — The `domains:` tag this folder answers to.
  - `to_json(self) -> dict`
- `list_domain_defs(store: CorpusStore, prefix: str='') -> list[DomainDef]` — Every domain that declares itself, by reading its `index.md`.
- `focus_folders(focus: str, defs: list[DomainDef]) -> list[str]` — Every folder that falls under `focus`, per the corpus's own declarations.
- `in_any_folder(key: str, folders: list[str]) -> bool` — Whether `key` sits under any of `folders`. Empty list is never a match.
- `row_from_entry(entry: Entry, bin_store: BinStore | None) -> SourceRow` — A listing row. **The only row builder there is.**
- `list_sources(store: CorpusStore, prefix: str='', search: str='', limit: int=200, offset: int=0, bin_store: BinStore | None=None, domain: str='', focus: str='') -> Listing` — Every source under `prefix`, `domain` and `focus`, newest first.
- `load_source(store: CorpusStore, path: str) -> str` — One source's raw text, unmodified.
- constants: `DOMAIN_INDEX`

### Folder tree builder

`src/server/tree.py` · 158 lines

Turns the list of file names into a folder tree without opening any file, so the tree draws quickly even on large corpora.

**Interface**

- **class `TreeNode`** — One row in the tree.
  - fields: `name`, `path`, `is_dir`, `children`, `count`
  - `to_json(self) -> dict`
- `visible_keys(keys: list[str]) -> list[str]` — The keys a reader should see. What `/api/tree` counts, as well as draws.
- `build_tree(keys: list[str]) -> list[TreeNode]` — The corpus's directory structure, from its keys.
- constants: `FLATTENED`, `HIDDEN`

### Server starter

`src/server/__main__.py` · 49 lines

Starts the local server on this machine only, on port 8787 unless told otherwise, read-only unless writing is switched on.

**Interface**

- `run() -> None`

### Plain browser page

`src/server/static/index.html` · 166 lines

A simple one-page view of the corpus the server shows when opened directly in a browser.

**Interface**

- served at `GET /`; no other route references it

### Server folder marker

`src/server/__init__.py` · 1 lines

Marks the local server's folder; holds no code.

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

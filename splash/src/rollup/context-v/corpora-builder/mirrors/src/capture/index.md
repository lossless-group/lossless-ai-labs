---
title: "src/capture/ — capturing sources"
lede: "Link in, source file out. Metadata first, full text only when asked, and a broken link is still filed."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/src/capture"
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
  - Capture
site_uuid: 4fa86cb2-4775-4181-8b20-1df5c86a18fc
hex_code: 34qezk
summary: "Mirror of src/capture/. add_source is the one entry point both the CLI and POST /api/capture call."
from: "corpora-builder"
from_path: "context-v/mirrors/src/capture/index.md"
---
# src/capture/ — capturing sources

> [!info] Mirror of `corpora-builder/src/capture`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

Two rules run through this package. **Two-tier fetch:** a plain capture keeps
metadata and a short excerpt (`content_pulled: false`); the full body only on
`full=True` / `--fetch`. **A failure is a fact:** an unreachable URL still
produces a file, with the failure in `machine_verdict`.

Where a capture lands: `domain_prefix("thesis/x")` → `live/thesis/x/sources/`;
no domain → the inbox (`INBOX_PREFIX`, `live/inbox/`). Before writing, it
looks for a file with the same `normalized_url` **in that destination folder
only** (manifest first, reading files the manifest doesn't cover); a match is
returned as `duplicate_of` and nothing is written. The same link filed under a
different domain is not caught. A capture updates the manifest if one exists
and never creates one.

## Files

### Adding a source

`src/capture/add.py` · 170 lines

Turns a link into a source file with a short excerpt, fetching the full page only when asked, and records failures instead of skipping them.

**Interface**

- **class `AddResult`** — What `add_source` did, including when it deliberately did nothing.
  - fields: `path`, `created`, `source`, `duplicate_of`
- `domain_prefix(domain: str | None) -> str` — `thesis/consumer-immunology` -> `live/thesis/consumer-immunology/sources/`.
- `add_source(store: CorpusStore, url: str, fetcher: Fetcher, domain: str | None=None, full: bool=False, origin: str='analyst-paste', now: str='', bin_store: BinStore | None=None) -> AddResult` — Fetch `url`, build a source file, and write it unless it already exists.
- constants: `EXCERPT_CHARS`, `INBOX_PREFIX`

### Fetching a page

`src/capture/fetch.py` · 138 lines

Gets a web page's text and title through Jina Reader; a broken link comes back as a recorded failure, not an error.

**Interface**

- **class `FetchResult`** — What came back, including when nothing did.
  - fields: `ok`, `status`, `title`, `publisher`, `published_at`, `body`, `content_type`, `raw`
- **class `Fetcher`**(`Protocol`) — Anything that can turn a URL into a `FetchResult`.
  - `fetch(self, url: str, full: bool=False) -> FetchResult` — Retrieve `url`. When `full` is False, metadata and a short excerpt.
- **class `JinaFetcher`** — Fetch through `r.jina.ai`, as augment-it and memopop both do.
  - `__init__(self, endpoint: str='https://r.jina.ai/', timeout: float=30.0) -> None`
  - `fetch(self, url: str, full: bool=False) -> FetchResult`
- `parse_jina_preamble(text: str) -> tuple[dict[str, str], str]` — Split Jina's `Key: value` preamble from the markdown body.

### PDF alongside a source

`src/capture/binary.py` · 66 lines

Decides whether a link is a file like a PDF, and records where it was stored or why it failed.

**Interface**

- `is_binary(url: str, content_type: str) -> bool` — Whether this resource should be stored as a binary sibling.
- `build_binary_asset(filename: str, data: bytes, downloaded_at: str, status: str, ref: BinaryRef | None=None) -> BinaryAsset` — Describe a stored (or failed) binary.
- constants: `BINARY_TYPES`

### Capture entry point

`src/capture/__init__.py` · 15 lines

Gathers the capture tools into one place for the command line and server.

**Interface**

- re-exports `EXCERPT_CHARS`, `AddResult`, `add_source` from `src.capture.add`
- re-exports `Fetcher`, `FetchResult`, `JinaFetcher` from `src.capture.fetch`

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

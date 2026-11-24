---
title: "src/index/ — catalogue and search"
lede: "The manifest that keeps listings fast, and the Pagefind search bundle built from it, both stored inside the corpus."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/src/index"
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
  - Search-Index
  - Manifest
site_uuid: 2adf48a9-5783-44e6-b309-8d5488a66e75
hex_code: w2cy70
summary: "Mirror of src/index/. The manifest lives at index/sources.jsonl in the corpus; the search bundle under index/. Rebuilt only on request."
from: "corpora-builder"
from_path: "context-v/mirrors/src/index/index.md"
---
# src/index/ — catalogue and search

> [!info] Mirror of `corpora-builder/src/index`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

The manifest (`MANIFEST_KEY`, JSONL, one entry per source) holds what a
listing row needs, so browsing never opens every file. The search bundle is
built from the manifest by `app/scripts/build-search-index.mjs` (Node +
Pagefind) and written into the corpus under `index/`, which keeps a private
bucket private: the app fetches it through `GET /pagefind/...`.

Rebuilding reads every source once and only happens on `corpora reindex` or
`POST /api/reindex`. No Node, no bundle, no failure: the build reports
`skipped`. Only keys under `index/` are ever written here.

## Files

### Building the catalogue

`src/index/build.py` · 101 lines

Reads every source once and writes one catalogue row per source, including a row with the error for any file that won't read.

**Interface**

- `select_sources(keys: list[str]) -> list[str]` — The captured sources among `keys`.
- `source_keys(store: CorpusStore, prefix: str='') -> list[str]` — Every key under `prefix` that is a captured source.
- `read_many(store: CorpusStore, keys: list[str]) -> dict[str, bytes | Exception]` — Read `keys` concurrently, recording failures rather than raising.
- `entry_for(key: str, blob: bytes | Exception) -> Entry` — One key's manifest entry, whether or not it parsed.
- `build_manifest(store: CorpusStore, prefix: str='') -> Manifest` — Read the corpus once and write down what a listing needs.
- constants: `NOT_SOURCES`

### Source catalogue

`src/index/manifest.py` · 201 lines

Keeps one row per source (title, excerpt, topics, errors) so listings never need to open every file.

**Interface**

- `listing_excerpt(source: SourceFile) -> str` — The excerpt a listing shows for `source`.
- **class `Entry`** — One source, as a listing needs it.
  - fields: `key`, `title`, `url`, `normalized_url`, `status`, `content_pulled`, `published_at`, `fetched_at`, `excerpt`, `domains`, `binary_key`, `binary_bytes`, `binary_optimized`, `error`
  - `to_json(self) -> dict[str, object]` — Falsy fields are omitted, so a text-only source is one short line.
  - `from_json(cls, raw: dict[str, object]) -> Entry`
- `entry_from_source(key: str, source: SourceFile) -> Entry` — The entry for a source that parsed.
- `entry_from_failure(key: str, error: str) -> Entry` — The entry for a file that would not parse.
- **class `Manifest`** — Every indexed source, keyed by corpus key.
  - fields: `entries`
  - `keys(self) -> set[str]`
  - `render(self) -> bytes` — JSONL, sorted by key. Byte-identical for identical input.
  - `parse(cls, blob: bytes) -> Manifest` — A damaged line costs one source, not the manifest — rule 4.
- `fingerprint(blob: bytes) -> str` — The manifest's identity, for anything built downstream of it.
- `load_manifest(store: CorpusStore) -> Manifest | None` — The corpus's manifest, or `None` when it has never been indexed.
- `save_manifest(store: CorpusStore, manifest: Manifest) -> bytes` — Write it, and hand back the bytes so a caller can fingerprint them.
- constants: `INDEX_PREFIX`, `MANIFEST_KEY`, `PREVIEW_CHARS`

### Re-index everything

`src/index/rebuild.py` · 45 lines

Reads every source once to rebuild the catalogue, then the search index; only runs when someone asks.

**Interface**

- **class `ReindexResult`**
  - fields: `sources`, `fingerprint`, `search`
- `reindex(store: CorpusStore, prefix: str='', search: bool=True) -> ReindexResult` — Rebuild the manifest, then the search bundle built from it.

### Search index storage

`src/index/search_index.py` · 196 lines

Builds the search index with Pagefind and stores it inside the corpus, skipping quietly when Node isn't installed.

**Interface**

- **class `BuildResult`** — What a bundle build did, including when it deliberately did nothing.
  - fields: `ok`, `skipped`, `error`, `records`, `files`, `written`, `written_keys`
- `bundle_key(rel: str) -> str` — The corpus key for a path within the bundle.
- `bundle_content_type(rel: str) -> str`
- `bundle_cache_control(rel: str) -> str` — How long a bundle file may be reused.
- `bundle_fingerprint(store: CorpusStore) -> str` — The manifest fingerprint the current bundle was built from, or empty.
- `build_search_index(store: CorpusStore, manifest_blob: bytes) -> BuildResult` — Build a Pagefind bundle from `manifest_blob` and write it into the store.
- constants: `BUNDLE_PREFIX`, `BUNDLE_FINGERPRINT_KEY`, `CONTENT_ADDRESSED`, `REPO_ROOT`, `BUILDER`

### Catalogue entry point

`src/index/__init__.py` · 30 lines

Gathers the catalogue tools into one place.

**Interface**

- re-exports `INDEX_PREFIX`, `MANIFEST_KEY`, `Entry`, `Manifest`, `entry_from_source`, `fingerprint`, `listing_excerpt`, `load_manifest`, `save_manifest` from `src.index.manifest`

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

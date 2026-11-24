---
title: "src/store/ — storage"
lede: "One storage interface, six operations, three implementations: Cloudflare R2, a local folder, and a cache in front of either."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/src/store"
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
  - Storage
  - Cloudflare-R2
site_uuid: dc86e988-8601-46d3-b5c6-253672dfc077
hex_code: wbnqv2
summary: "Mirror of src/store/. Every read and write in the engine goes through CorpusStore; nothing else talks to S3 or the filesystem for corpus bytes."
from: "corpora-builder"
from_path: "context-v/mirrors/src/store/index.md"
---
# src/store/ — storage

> [!info] Mirror of `corpora-builder/src/store`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

`CorpusStore` is bytes at keys and nothing about what keys mean. The CLI
builds `CachedStore(R2Store(...))` for a workspace, or `LocalFsStore` with
`--local <dir>`. A future `PosixStore` would be one more implementation, not a
migration.

| Operation | Contract |
|---|---|
| `read(key)` | bytes, or `KeyNotFound` |
| `write(key, data)` | replaces whatever is there |
| `exists(key)` | bool |
| `stat(key)` | `ObjectStat(size, content_hash)`, no download |
| `list(prefix)` | every key under prefix, recursive, sorted |
| `delete(key)` | `KeyNotFound` if absent |

## Files

### Storage rules

`src/store/base.py` · 83 lines

The one set of read, write, list and check operations every storage option must offer.

**Interface**

- **class `KeyNotFound`**(`KeyError`) — Raised when a key does not exist in the store.
- **class `ObjectStat`** — What a store can tell you about an object without reading it.
  - fields: `size`, `content_hash`
- **class `CorpusStore`**(`ABC`) — Bytes at keys. Nothing about what the keys mean.
  - `read(self, key: str) -> bytes` — Return the bytes at `key`, or raise `KeyNotFound`.
  - `write(self, key: str, data: bytes) -> None` — Write `data` at `key`, replacing anything already there.
  - `exists(self, key: str) -> bool` — Whether `key` currently holds anything.
  - `stat(self, key: str) -> ObjectStat` — Return size and content hash for `key`, or raise `KeyNotFound`.
  - `list(self, prefix: str='') -> list[str]` — Return all keys under `prefix`, recursively, sorted.
  - `delete(self, key: str) -> None` — Remove `key`. Raises `KeyNotFound` if it was not there.

### Storage in Cloudflare R2

`src/store/r2.py` · 98 lines

Stores corpus files in a client's Cloudflare R2 bucket.

**Interface**

- **class `R2Store`**(`CorpusStore`) — Keys become object keys in `bucket`.
  - `__init__(self, bucket: str, client: Any, prefix: str='') -> None`
  - `read(self, key: str) -> bytes`
  - `write(self, key: str, data: bytes) -> None`
  - `exists(self, key: str) -> bool`
  - `stat(self, key: str) -> ObjectStat`
  - `list(self, prefix: str='') -> list[str]`
  - `delete(self, key: str) -> None`

### Storage on this disk

`src/store/local.py` · 65 lines

Stores corpus files in an ordinary folder on this machine.

**Interface**

- **class `LocalFsStore`**(`CorpusStore`) — Keys become paths under `root`. Directories are created as needed.
  - `__init__(self, root: Path) -> None`
  - `read(self, key: str) -> bytes`
  - `write(self, key: str, data: bytes) -> None`
  - `exists(self, key: str) -> bool`
  - `stat(self, key: str) -> ObjectStat`
  - `list(self, prefix: str='') -> list[str]`
  - `delete(self, key: str) -> None`

### Faster repeat reads

`src/store/cached.py` · 51 lines

Wraps another storage option and remembers files already read so repeat reads are instant.

**Interface**

- **class `CachedStore`**(`CorpusStore`) — Wraps `backing`, serving repeat reads from memory.
  - `__init__(self, backing: CorpusStore) -> None`
  - `read(self, key: str) -> bytes`
  - `write(self, key: str, data: bytes) -> None`
  - `exists(self, key: str) -> bool`
  - `stat(self, key: str) -> ObjectStat`
  - `list(self, prefix: str='') -> list[str]`
  - `delete(self, key: str) -> None`

### Storage entry point

`src/store/__init__.py` · 17 lines

Gathers the storage options into one place.

**Interface**

- re-exports `CorpusStore`, `KeyNotFound`, `ObjectStat` from `src.store.base`
- re-exports `CachedStore` from `src.store.cached`
- re-exports `LocalFsStore` from `src.store.local`
- re-exports `R2Store` from `src.store.r2`

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

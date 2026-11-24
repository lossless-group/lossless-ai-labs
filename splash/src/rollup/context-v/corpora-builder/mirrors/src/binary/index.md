---
title: "src/binary/ — large files"
lede: "PDFs and other large files, stored once under a name made from their contents and cached per machine."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/src/binary"
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
  - Binary-Storage
  - PDF
site_uuid: d5923d91-ea7e-4c09-8f54-289d5468cc0b
hex_code: fnp3cb
summary: "Mirror of src/binary/. Read before touching bin/ keys, PDF optimisation, or the machine cache."
from: "corpora-builder"
from_path: "context-v/mirrors/src/binary/index.md"
---
# src/binary/ — large files

> [!info] Mirror of `corpora-builder/src/binary`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

```
remote        r2://<client-bucket>/<prefix>/bin/<ab>/<sha256><ext>   one per client
local cache   ~/Library/Caches/corpora/bin/<ab>/<sha256><ext>         one per machine
```

The key is the checksum, so verifying a file is a `stat`, never a download,
and evicting the local copy can't lose data. The cache is shared across
corpora; the remote isn't (bucket-per-client isolation). A markdown wrapper
points at its binary through a `binary_asset:` block.

PDFs are shrunk with Ghostscript only when the text layer survives; otherwise
the original is kept and the reason recorded (`SKIPPED_SCANNED`,
`SKIPPED_TEXT_LOSS`, `SKIPPED_NOT_SMALLER`, `SKIPPED_NO_OPTIMIZER`).

## Files

### Large file storage

`src/binary/store.py` · 181 lines

Keeps one copy of each large file in the client's R2 bucket and a saved copy on this machine, and checks them without downloading.

**Interface**

- `default_cache_dir() -> Path` — Machine-level, deliberately outside any repo (rule 1).
- **class `BinaryStatus`**
  - fields: `state`, `key`, `bytes`
  - `is_present(self) -> bool`
- **class `VerifyResult`**
  - fields: `key`, `outcome`, `detail`
  - `ok(self) -> bool`
- **class `BinStore`** — Content-addressed binaries over a `CorpusStore`, with a machine cache.
  - `__init__(self, remote: CorpusStore, cache_dir: Path | None=None) -> None`
  - `is_cached(self, key: str) -> bool`
  - `put(self, ref: BinaryRef, data: bytes) -> BinaryRef` — Store bytes at their content key, remotely and in the cache.
  - `status(self, ref: BinaryRef) -> BinaryStatus` — Present locally, or not downloaded. Never fetches (Behaviour 8).
  - `fetch(self, ref: BinaryRef) -> bytes` — Cache first, remote second (rule 2). Populates the cache on a miss.
  - `verify(self, ref: BinaryRef) -> VerifyResult` — Confirm the remote holds these exact bytes, without reading them.
  - `evict(self, ref: BinaryRef) -> VerifyResult` — Drop the local copy, once the remote is confirmed to hold it.
  - `cache_bytes(self) -> int` — What the machine-level cache currently costs on disk.
- constants: `NOT_DOWNLOADED`, `PRESENT`, `OK`, `MISSING`, `HASH_MISMATCH`

### Content-based names

`src/binary/keys.py` · 126 lines

Names each large file after a fingerprint of its contents, so the same file always gets the same name.

**Interface**

- `sha256_of(data: bytes) -> str`
- `key_for(digest: str, ext: str='') -> str` — `bin/<first-two-hex>/<sha256><ext>`.
- `key_for_bytes(data: bytes, ext: str='') -> str`
- **class `BinaryRef`** — The frontmatter join — what a wrapper `.md` carries about its binary.
  - fields: `key`, `sha256`, `size`, `source_sha256`, `source_size`, `optimized`
  - `from_key(cls, key: str, size: int=0) -> BinaryRef` — Rebuild a ref from a key alone.
  - `verbatim(cls, data: bytes, ext: str='') -> BinaryRef` — Stored exactly as received — no optimizer ran, or it was rejected.
  - `from_optimized(cls, source: bytes, stored: bytes, ext: str='') -> BinaryRef`
  - `to_frontmatter(self) -> dict[str, object]` — The block a wrapper `.md` carries. Key order is deliberate.
- constants: `BIN_PREFIX`

### Filing a large file

`src/binary/ingest.py` · 133 lines

Shrinks a PDF when safe, stores it under a name made from its contents, and points the source file at it; also moves existing PDFs over.

**Interface**

- **class `IngestResult`**
  - fields: `ref`, `optimize`, `source_path`
  - `saved_bytes(self) -> int`
- `ingest_binary(store: BinStore, data: bytes, ext: str='.pdf', *, optimize: bool=True, compress: Callable[[bytes], bytes] | None=None, extract_text: Callable[[bytes], str] | None=None, source_path: Path | None=None) -> IngestResult` — Optimize (if it is a PDF and it is safe), store by content hash, describe.
- `migrate_tree(store: BinStore, root: Path, suffixes: tuple[str, ...]=('.pdf', '.docx', '.pptx', '.xlsx'), *, optimize: bool=True, write_wrappers: bool=True) -> list[IngestResult]` — File every binary under `root` into `bin/` **and point its wrapper at it**.

### PDF shrinking

`src/binary/optimize.py` · 171 lines

Shrinks PDFs with Ghostscript, and keeps the original if shrinking would lose the searchable text.

**Interface**

- **class `OptimizeResult`** — What to store, and whether anything was done to it.
  - fields: `data`, `optimized`, `reason`, `text_before`, `text_after`
- `ghostscript_available() -> bool`
- `gs_compress(data: bytes, settings: str=DEFAULT_PDF_SETTINGS) -> bytes` — Run Ghostscript over PDF bytes. Raises if it is absent or fails.
- `pdftotext_extract(data: bytes) -> str` — Extract a PDF's text layer. Returns empty string when unavailable.
- `optimize_pdf(data: bytes, *, compress: Callable[[bytes], bytes] | None=None, extract_text: Callable[[bytes], str]=pdftotext_extract) -> OptimizeResult` — Optimize, or explain why it did not.
- constants: `SCANNED_TEXT_FLOOR`, `TEXT_RETENTION_FLOOR`, `DEFAULT_PDF_SETTINGS`, `SKIPPED_NO_OPTIMIZER`, `SKIPPED_SCANNED`, `SKIPPED_TEXT_LOSS`, `SKIPPED_NOT_SMALLER`

### Linking source to file

`src/binary/pointer.py` · 168 lines

Adds or removes the lines in a source file that point to its stored PDF, leaving everything else untouched.

**Interface**

- **class `Pointer`** — What a migration adds to a wrapper.
  - fields: `binary_key`, `optimized`, `optimized_sha256`, `optimized_bytes`, `source_sha256`, `source_bytes`
  - `creation_lines(self, indent: str='  ') -> list[str]` — A whole block, for a wrapper that had none. Carries the source facts because nothing else in the file records them.
  - `lines(self, indent: str='  ') -> list[str]`
- `strip_pointer(text: str) -> str` — Remove exactly the lines this module adds. The inverse of `apply_pointer`.
- `apply_pointer(text: str, pointer: Pointer) -> str` — Add (or refresh) the pointer keys inside `binary_asset:`, touching nothing else.
- `has_pointer_for(text: str, source_sha256: str) -> bool` — Whether this wrapper already points at an object for exactly this source.
- constants: `OWNED_KEYS`

### Large files folder marker

`src/binary/__init__.py` · 0 lines

Marks the large-files folder; holds no logic.

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

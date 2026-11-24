---
title: "src/model/ — source files"
lede: "What a source file is: header fields in a fixed order, names, tidy URLs, topic references, and the URL backfill."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/src/model"
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
  - Schema
  - Frontmatter
site_uuid: eb3e6cbc-2902-4b86-92b7-bb46e22f0270
hex_code: 77kzp8
summary: "Mirror of src/model/. SourceFile is the schema in code; read it before adding a frontmatter field."
from: "corpora-builder"
from_path: "context-v/mirrors/src/model/index.md"
---
# src/model/ — source files

> [!info] Mirror of `corpora-builder/src/model`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

A source is a markdown file: YAML frontmatter plus a body. Only `url` is
required. Keys are written in `FIELD_ORDER`, never alphabetically, so a diff
shows what changed rather than a reshuffle. Keys the model doesn't know are
kept in `unknown` and written back untouched; legacy spellings are accepted
via `FIELD_ALIASES`.

**Domain references are not tags.** `domains:` holds `kind:slug` scopes
(`strategy:workforce-development`) that cascade: focusing `strategy` reaches
every strategy. `tags:` holds Train-Case labels and doesn't cascade.

## Files

### Source file

`src/model/source.py` · 341 lines

Defines what a source file holds (link, title, dates, verdicts, PDF pointer and text) and keeps header fields in a fixed order.

**Interface**

- **class `BinaryAsset`** — The markdown's pointer to its binary, which lives in `bin/`.
  - fields: `filename`, `content_type`, `size_bytes`, `sha256`, `downloaded_at`, `download_status`, `binary_key`, `optimized`, `optimized_sha256`, `optimized_bytes`, `bytes`, `original_bytes`, `compressed`, `source`
  - `working_bytes(self) -> int` — Size of whatever `binary_key` points at, across every spelling.
  - `was_compressed(self) -> bool` — Whether these bytes are smaller than what the publisher served — by our optimizer or by whatever produced `compressed: true`.
- **class `SourceFile`** — Only `url` is required. Everything else degrades gracefully.
  - fields: `url`, `normalized_url`, `title`, `publisher`, `authors`, `fetched_at`, `published_at`, `status`, `content_pulled`, `excerpt`, `description`, `origin`, `origin_detail`, `domains`, `sections`, `tags`, `rank`, `sensitivity`, `verdict`, `verdict_reason`, `machine_verdict`, `confidence`, `note`, `binary_asset`, `extra_metadata`, `body`, `unknown`, `aliases_used`, `present_keys`, `had_frontmatter`
  - `to_frontmatter(self) -> dict[str, Any]` — The mapping to serialise, unknown keys included.
  - `from_frontmatter(cls, data: dict[str, Any], body: str='') -> SourceFile` — Build from a parsed mapping, routing unrecognised keys to `unknown`.
  - `render(self) -> str` — The complete file: frontmatter plus body.
  - `parse(cls, text: str) -> SourceFile` — Read a complete file. Raises `StrandedContent` on a truncated fence.
- constants: `FIELD_ORDER`, `FIELD_ALIASES`, `VALID_STATUS`, `VALID_DOWNLOAD_STATUS`

### Source file header

`src/model/frontmatter.py` · 141 lines

Reads and writes the header block at the top of a source file without losing fields it didn't expect.

**Interface**

- **class `StrandedContent`**(`ValueError`) — Frontmatter-looking content found after the closing fence.
- `parse_frontmatter(text: str) -> tuple[dict[str, Any], str]` — Split `text` into (frontmatter mapping, body).
- `render_frontmatter(data: dict[str, Any], body: str, order: list[str]) -> str` — Render `data` + `body` back to a file, keys in `order` first.

### Source file names

`src/model/naming.py` · 60 lines

Builds a source's file name from its title, or from its link when there is no title.

**Interface**

- `slugify(raw: str) -> str` — Lowercase, collapse punctuation to single dashes, trim.
- `source_filename(title: str, fetched_date: str, url: str='', taken: Iterable[str]=(), suffix: str='.md') -> str` — Build the filename, falling back to `url` when `title` is empty.

### Tidy web addresses

`src/model/urls.py` · 84 lines

Cleans up a link into one standard form so the same page isn't captured twice.

**Interface**

- `normalize_url(raw: str) -> str` — Return a canonical form of `raw` suitable for cross-source dedup.

### Topic references

`src/model/domains.py` · 61 lines

Decides whether a source's topic reference falls under the topic being looked at, including broader topics above it.

**Interface**

- `cascade_prefixes(reference: str) -> list[str]` — Every chain `reference` answers to, shortest first.
- `matches(reference: str, focus: str) -> bool` — Does `reference` fall under `focus`?
- `any_match(references: list[str], focus: str) -> bool` — Whether any of a source's references falls under `focus`.
- constants: `SEP`

### Short excerpt

`src/model/text.py` · 53 lines

Picks the first real sentence or two from fetched text, skipping menus and page clutter.

**Interface**

- `prose_excerpt(body: str, limit: int) -> str` — The first real sentence or two, skipping navigation chrome.

### Fill in missing addresses

`src/model/backfill.py` · 190 lines

Adds a tidy web address line to older source files that lack one, changing nothing else in the file.

**What it can do**

- plans before it writes: a dry run and a real run produce the same `Plan`
- inserts one `normalized_url:` line under `url:` and leaves every other byte alone (no re-render through `FIELD_ORDER`)
- reports why each skipped file was skipped

**Interface**

- **class `Backfill`** — What a single file needs, and why it was skipped when it was.
  - fields: `key`, `url`, `normalized`, `skipped`
  - `writes(self) -> bool`
- **class `Plan`** — Every file considered. A dry run and a real run produce the same plan.
  - fields: `entries`
  - `writes(self) -> list[Backfill]`
  - `reasons(self) -> dict[str, int]`
- `plan_one(key: str, text: str) -> Backfill` — What this file needs. Pure — no store, no I/O.
- `apply_one(text: str, entry: Backfill) -> str` — Insert `normalized_url` directly beneath `url:`, changing nothing else.
- `plan(store, keys: list[str]) -> Plan` — Read every key and decide what it needs. Writes nothing.
- `apply(store, plan_: Plan) -> int` — Write the planned insertions. Returns how many files changed.
- constants: `URL_KEYS`

### Source file entry point

`src/model/__init__.py` · 30 lines

Gathers the source file tools into one place.

**Interface**

- re-exports `StrandedContent`, `parse_frontmatter`, `render_frontmatter` from `src.model.frontmatter`
- re-exports `slugify`, `source_filename` from `src.model.naming`
- re-exports `FIELD_ALIASES`, `FIELD_ORDER`, `VALID_STATUS`, `BinaryAsset`, `SourceFile` from `src.model.source`
- re-exports `prose_excerpt` from `src.model.text`
- re-exports `normalize_url` from `src.model.urls`

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

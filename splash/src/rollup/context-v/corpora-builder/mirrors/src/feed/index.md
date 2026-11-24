---
title: "src/feed/ — what changed"
lede: "Change records read from a corpus's git history and rendered for a client as prose, or for the app as JSON."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/src/feed"
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
  - Change-Feed
site_uuid: ef7c5a0c-dc1d-4d5a-8a63-7d6711411d5d
hex_code: eewm9l
summary: "Mirror of src/feed/. Renderers read Change records, never git, so the history engine can change without touching them."
from: "corpora-builder"
from_path: "context-v/mirrors/src/feed/index.md"
---
# src/feed/ — what changed

> [!info] Mirror of `corpora-builder/src/feed`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

`ChangeSource` is the seam: git today (`GitChangeSource`), something else
later. Rules carried by `Change`: counts are derived from path lists, never
stored; the commit subject is kept verbatim (the `verb(scope): sentence`
convention is parsed in addition, never instead); a rename is a rename, not a
remove plus an add; `when` is timezone-aware UTC.

## Files

### A change record

`src/feed/change.py` · 160 lines

Describes one change to a corpus (added, changed, renamed, removed and why) independent of where history is kept.

**Interface**

- `parse_subject(subject: str) -> tuple[str | None, str | None, str]` — Split a commit subject into `(verb, scope, sentence)`.
- **class `Rename`** — One path that moved. Kept as a pair so a renderer can say so.
  - fields: `old`, `new`
- **class `Change`** — One unit of work against a corpus, whatever engine recorded it.
  - fields: `id`, `when`, `who`, `subject`, `added`, `changed`, `removed`, `renamed`, `bytes_total`
  - `verb(self) -> str | None`
  - `scope(self) -> str | None`
  - `sentence(self) -> str`
  - `n_added(self) -> int`
  - `n_changed(self) -> int`
  - `n_removed(self) -> int`
  - `n_renamed(self) -> int`
  - `n_paths(self) -> int` — Every path this change touched, renames counted once.
  - `paths(self) -> list[str]` — Every touched path, renames represented by their destination.
- **class `ChangePage`** — A bounded window onto a change history.
  - fields: `changes`, `truncated`
- **class `ChangeSource`**(`ABC`) — Where changes come from. Git today; a Kopia repository or our own checkpoints later, without anything above this line noticing.
  - `changes(self, prefix: str='', limit: int=20) -> ChangePage` — Changes touching `prefix`, newest first, at most `limit`.

### Reading git history

`src/feed/git_source.py` · 209 lines

Reads a corpus copy's git history and turns each commit into a change record.

**Interface**

- **class `GitRepoError`**(`RuntimeError`) — The path is not a git repository, or git refused the request.
- **class `GitChangeSource`**(`ChangeSource`) — Changes read from a git repository's history.
  - `__init__(self, repo: str | Path) -> None`
  - `changes(self, prefix: str='', limit: int=20) -> ChangePage`

### Showing changes

`src/feed/render.py` · 129 lines

Turns change records into a readable summary for a client, or data for the app.

**Interface**

- `has_reason(change: Change) -> bool` — Whether this change carries a sentence worth showing a client.
- `to_json(page: ChangePage) -> str` — The stable machine shape. What a web view or a digest consumes.
- `render_prose(page: ChangePage, max_paths: int=DEFAULT_MAX_PATHS) -> str` — The human surface — what a client reads.
- constants: `DEFAULT_MAX_PATHS`

### Change list entry point

`src/feed/__init__.py` · 0 lines

Gathers the 'what changed' tools into one place.

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

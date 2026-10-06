---
title: "Corpus Tree"
lede: "A corpus is a folder the client can't see. The tree is built from keys alone, so showing 944 files costs zero reads."
publish: true
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: Draft
site_uuid: 5f2a9e01-3c74-4b8d-a6e5-71d0c8b34f92
hex_code: b9zk3r
tags:
  - Spec
  - Corpora-Builder
  - Navigation
  - Frontend
from: "corpora-builder"
from_path: "context-v/specs/Corpus-Tree.md"
---
# Corpus Tree

## Why

The domain combobox answers *"take me to the folder I can name."* It does not
answer *"what is in here?"* — and for a client looking at work done on their
behalf, that second question is the whole point. reach-edu is **944 objects
across five directory levels**, and until now the app could show a flat list of
sources and nothing else.

The pattern is lifted from `flave-ai`'s editor, which has had a working file
tree since its first surface. What travels is the *shape*; what does not travel
is where the bytes come from — see
`ai-labs/context-v/blueprints/Show-The-Filesystem-Of-A-Workspace.md`.

## The one hard constraint

**A corpus is not a filesystem.** flave-ai walks a real directory with
`fs::read_dir` in the Tauri host. corpora-builder's corpus is behind
`CorpusStore` — R2 in production, a local folder in tests — and its only listing
primitive is a flat list of keys.

That turns out to be a gift rather than a limitation. `list_domains` already
established the rule this repo runs on: **structure lives in the key, so deriving
it costs zero reads.** Painting the whole tree of 944 objects is one `list()`
call. Deriving the same thing by opening files took 20.6 seconds and was the bug
that made the window look hung.

## What is shown

Everything. `live/` and `bin/`, 845 wrappers and 92 PDFs and 7 CSVs.

`bin/` in particular is content-addressed and unreadable by eye —
`bin/00/0029ed…d5.pdf` — and there is a real temptation to hide it as "the app's
business." flave-ai does exactly that with dotfiles and is right to. **This is a
different case.** The operator moved 92 binaries into that store this morning and
the reason they are hard to see is the reason to show them: a client asking
*"where did my PDFs go"* deserves an answer that is not "trust us."

Folders collapse, so noise costs one row rather than fifty-eight.

**With one exception, found by rendering it.** `bin/` fans out by the first two
hex characters of the digest so that one directory never holds thousands of
entries — restic and Kopia do the same. Drawn literally that is *55 folders named
`00`, `05`, `09`, each holding exactly one file*, and because `bin` sorts before
`live` it is the first thing the tree shows. That level is a storage
optimisation, not information, so it is collapsed: `bin/` lists its objects
directly. Every object stays visible; a file node's `path` is always its real
key. Same instinct as flave-ai skipping dotfiles — the app's business, not the
reader's.

## Behaviours

### 1. Built from keys, read from nothing

`build_tree(keys)` is a pure function. No store, no I/O, no async. The endpoint
that wraps it makes exactly one `list()` call.

This is also what makes it testable without a fixture corpus on disk.

### 2. Directories carry a recursive count

A folder shows how many files sit beneath it, at any depth. `funders/` reads
`66` because that is the number the operator cares about, not the number of
immediate children.

Free from the keys, and it is the difference between a tree you navigate and a
tree you expand hoping.

### 3. Folders first, then alphabetical

flave-ai's rule, and it is right: *the order a person expects*. Within a kind,
plain alphabetical — the same correction the domain combobox needed, for the same
reason.

### 4. A node's path is what you would type

For a file, the node's `path` is its key. For a folder, it is the prefix ending
in `/`. Both are corpus-relative and neither is ever absolute — the client never
sees, and cannot construct, a path outside the corpus.

### 5. Collapsed below the first level

944 rows opened at once is the same failure as 112 `<option>`s. Everything opens
on request.

`live/` — the corpus's actual content — is the one folder open on arrival. `bin/`
is not: it is content-addressed, so its *contents* are the point and its
*structure* carries nothing, and 92 rows of hex digest is not a useful first
impression of somebody's corpus.

### 6. A folder selects; a file opens

Clicking a folder sets the domain filter and returns to Sources — the tree and
the combobox are two views of one idea, and picking a folder in one should mean
the same thing as typing it in the other. Clicking a file opens the existing
viewer.

Folders are buttons here, unlike flave-ai's, where a directory is inert and only
files are clickable. The difference is that flave-ai's tree has nowhere for a
directory to *go*; this one does.

The **filter** action appears only on folders that actually map to a domain —
under `live/`, at the `<type>/<slug>` depth. On `bin/` it would mean nothing, and
an affordance offered where it does nothing is worse than one that is absent.

## Tests

| ID | Given / When / Then |
|---|---|
| `TREE-01` | Given a flat list of keys, when a tree is built, then nesting matches the `/` structure and no store read occurs |
| `TREE-02` | Given keys at several depths under one folder, when the tree is built, then that folder's count is every file beneath it, not its immediate children |
| `TREE-03` | Given a folder containing both files and folders, when the tree is built, then folders sort before files and each group sorts alphabetically |
| `TREE-04` | Given a file node and a folder node, when their paths are read, then the file's path is its key and the folder's path is its prefix ending in `/` |
| `TREE-05` | Given a key with no `/`, when the tree is built, then it appears as a root-level file |
| `TREE-06` | Given no keys, when the tree is built, then the result is empty rather than a phantom root |
| `TREE-07` | Given a corpus holding both `live/` and `bin/`, when the tree is built, then both appear — the content-addressed store is not hidden |
| `TREE-08` | Given a store, when the tree endpoint is called, then it returns the whole tree having read no file bodies |
| `TREE-09` | Given `bin/<ab>/<digest>.ext`, when the tree is built, then the two-hex fan-out level is collapsed and the file node's `path` is still the real key |

## Related

- `ai-labs/context-v/blueprints/Show-The-Filesystem-Of-A-Workspace.md` — the cross-app pattern
- `context-v/specs/Domain-Navigation.md` — the other half of navigating a corpus
- `context-v/specs/Browse-Corpus.md` — `list_domains`, the same keys-not-bodies trick

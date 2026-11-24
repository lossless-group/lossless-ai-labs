---
title: "src/identity/ — workspaces"
lede: "Which client workspace you are in and where its corpus lives. Read from settings today; a didi.sh login later."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/src/identity"
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
  - Workspaces
  - Identity
site_uuid: 8e5f9bb3-a5e5-457f-bf2e-388fe0c34cc1
hex_code: 2fq3yx
summary: "Mirror of src/identity/. Nothing outside a resolver names a bucket or prefix; call sites ask for a Workspace."
from: "corpora-builder"
from_path: "context-v/mirrors/src/identity/index.md"
---
# src/identity/ — workspaces

> [!info] Mirror of `corpora-builder/src/identity`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

A `Workspace` carries its own storage location (`bucket`, `prefix`), because
real buckets were provisioned by people and can't be derived from the slug.
`default_bucket_name(slug)` is only the default for new workspaces.
`StaticWorkspaceResolver` is the only resolver today.

## Files

### What a workspace is

`src/identity/base.py` · 84 lines

Defines a client workspace and where its files live, and suggests a bucket name for new ones.

**Interface**

- **class `Workspace`** — The unit a corpus belongs to, and where its bytes actually live.
  - fields: `slug`, `display_name`, `bucket`, `prefix`
- **class `WorkspaceResolver`**(`ABC`) — Answers 'which workspace am I operating on, and where does it live?'
  - `resolve(self) -> Workspace` — Return the active workspace.
- `humanise(slug: str) -> str` — A readable name for a slug, when nobody has configured one.
- `default_bucket_name(slug: str) -> str` — The bucket a NEWLY PROVISIONED workspace should get.
- constants: `BUCKET_PREFIX`

### Workspace from settings

`src/identity/static.py` · 59 lines

Supplies the workspace from local settings; the only way to choose one until didi.sh login exists.

**Interface**

- **class `StaticWorkspaceResolver`**(`WorkspaceResolver`) — Returns a workspace supplied at construction time.
  - `__init__(self, slug: str, display_name: str='', bucket: str | None=None, prefix: str='') -> None`
  - `resolve(self) -> Workspace`
  - `from_env(cls) -> StaticWorkspaceResolver` — Build from CORPORA_WORKSPACE / CORPORA_R2_BUCKET / CORPORA_R2_PREFIX.

### Workspace entry point

`src/identity/__init__.py` · 19 lines

Gathers the workspace tools into one place.

**Interface**

- re-exports `BUCKET_PREFIX`, `Workspace`, `WorkspaceResolver`, `default_bucket_name` from `src.identity.base`
- re-exports `StaticWorkspaceResolver` from `src.identity.static`

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

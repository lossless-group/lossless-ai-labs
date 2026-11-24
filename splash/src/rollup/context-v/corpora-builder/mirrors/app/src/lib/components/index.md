---
title: "app/src/lib/components/ — screen parts"
lede: "Six Svelte 5 components the main page is built from, each with a typed Props interface."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/app/src/lib/components"
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
  - Svelte
  - Components
site_uuid: 72eee39d-4d76-4a00-95fe-89f0b563e445
hex_code: nzj8j6
summary: "Mirror of app/src/lib/components/. Props listed are the component's public interface."
from: "corpora-builder"
from_path: "context-v/mirrors/app/src/lib/components/index.md"
---
# app/src/lib/components/ — screen parts

> [!info] Mirror of `corpora-builder/app/src/lib/components`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

All are used by `app/src/routes/+page.svelte` through `$lib/components/`.

## Files

### Folder tree

`app/src/lib/components/CorpusTree.svelte` · 131 lines

Shows the corpus as folders and files that open and close, including where the PDFs are kept.

**Interface**

- props: `nodes: TreeNode[]`, `depth = 0`, `open: Set<string>`, `ontoggle(path)`, `onpick(node)`
- renders itself recursively for child folders

### Topic picker

`app/src/lib/components/DomainCombo.svelte` · 204 lines

A type-to-search box for choosing which topic folder of the corpus to look at.

**Interface**

- props: `value` (bindable), `domains: string[]`, `allowNew = false`, `placeholder = 'domain…'`, `anyLabel?`, `onchange?(value)`
- Backspace steps up one path segment (`chopSegment`); `allowNew` lets capture file somewhere new

### Search box and results

`app/src/lib/components/SearchPanel.svelte` · 173 lines

Searches the corpus and lists the best-matching sources with the matching words highlighted.

**Interface**

- props: `rows: SourceRow[]`, `marks: Map<string,string>`, `total`, `searching = false`, `limit = 8`, `ranked`, `tagLabel(value)`, `onpick(row)`, `onclose()`
- hides the previous answer while `searching`

### Workspace menu

`app/src/lib/components/WorkspaceMenu.svelte` · 125 lines

Shows which client workspace is open and where its files are stored.

**Interface**

- props: `workspace: WorkspaceInfo | null`, `label = ''`, `writable = false`

### Colour mode switch

`app/src/lib/components/ModeToggle.svelte` · 57 lines

A button that cycles the app between light, dark and vibrant colours.

**Interface**

- no props; reads and advances the shared `mode`

### Logo

`app/src/lib/components/CorporaMark.svelte` · 99 lines

Draws the corpora logo in the header.

**Interface**

- props: `size = 24`, `title = 'corpora'`

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.

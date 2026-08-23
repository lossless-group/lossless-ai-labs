---
title: "Show the Filesystem of a Workspace"
lede: "Every ai-labs app sits on a folder the user cannot see. The tree is the same five decisions each time; the backend is the only part that differs."
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
site_uuid: 7d4f6a63-d42c-4582-ac36-1fb683d46f7e
hex_code: 79x653
publish: true
tags:
  - Blueprint
  - File-Tree
  - Workspace-Pattern
  - Tauri
  - Svelte
  - Applied-AI-Labs
summary: >-
  Extracted from flave-ai's editor and corpora-builder's Files tab — the first
  two ai-labs surfaces to show a workspace tree, over a real disk and an object
  store respectively. Codifies the node shape, the ordering rule, the
  path-relativity invariant, the swappable-backend seam, and the recursive
  component. Read before building a third; the differences between the two
  existing implementations are where the decisions actually are.
---

# Show the Filesystem of a Workspace

## Why this blueprint exists

Every app in this tree sits on top of a folder the user cannot see. flave-ai has
a `workspace/`. corpora-builder has a client's corpus in R2. dididecks has a deck
directory. augment-it has record sets on disk. In all four the same question
arrives from the same place — *what is actually in there?* — and it arrives
loudest from the person paying for the work.

Two implementations exist and they disagree about exactly one thing, which is
what makes them worth extracting:

| | `flave-ai` | `corpora-builder` |
|---|---|---|
| Surface | `apps/editor/src/FileTree.svelte` | `app/src/lib/components/CorpusTree.svelte` |
| Backend | Tauri host, `fs::read_dir` | `CorpusStore.list()` over R2 or a local dir |
| Scale | a dozen files | 944 objects, 5 levels |
| Directories | inert | clickable — they map to a domain |
| Expansion | always open | collapsed, opened on request |

**What travels is the node shape, the ordering, and the path invariant. What
does not travel is the traversal.**

## The five decisions

### 1. The node shape is four fields, plus whatever the surface needs

```ts
interface FsNode {
  name: string;      // what you show
  path: string;      // what you send back
  is_dir: boolean;
  children: FsNode[];
}
```

flave-ai stops there. corpora-builder adds `count` — files beneath, at any depth
— because with 66 children per folder the difference between *navigating* a tree
and *expanding one hopefully* is knowing what is inside before you open it.

Add fields when the surface needs them. Do not remove these four.

### 2. Paths are workspace-relative, always, and the host enforces it

This is the invariant that matters most, and it is worth stating as a
prohibition: **the frontend never handles an absolute path.**

flave-ai enforces it in Rust because the other side of the boundary is a real
disk:

```rust
/// Reject `..`, absolute paths, and anything that resolves outside the root.
fn resolve(root: &str, rel: &str) -> Result<PathBuf, String> {
    if Path::new(rel).is_absolute() { return Err(...); }
    for c in Path::new(rel).components() {
        if matches!(c, Component::ParentDir) { return Err(...); }
    }
    Ok(Path::new(root).join(rel))
}
```

corpora-builder gets it structurally instead — a `CorpusStore` key has no
concept of a parent — but still asserts it, because "structurally impossible" is
a claim that stops being true the day someone adds a passthrough:

```python
assert all(not n.path.startswith("/") and ".." not in n.path for n in walk(tree))
```

Write the check even when the language makes the failure hard. The cost is one
assertion and the alternative is discovering it from a support ticket.

### 3. Folders first, then alphabetical

flave-ai's comment says it best — *the order a person expects*. Both
implementations sort exactly this way:

```python
sorted(nodes, key=lambda n: (not n.is_dir, n.name))
```

**Alphabetical within a kind, and nothing cleverer.** corpora-builder's domain
combobox briefly sorted same-depth siblings by string length, on a defensible-
sounding "shorter is broader" argument. Rendered, it listed *ecmc, blackrock,
bridgespan, judy-dimon* and was indistinguishable from random. A ranking rule
that cannot be predicted by the person reading it is worse than no ranking.

### 4. Hide the app's business, show the user's

flave-ai skips dotfiles: *"Dotfiles are the app's business, not the author's."*
Right, and the principle generalises further than dotfiles.

corpora-builder shows `bin/` — 92 content-addressed PDFs under unreadable
digest names — because the operator moved those binaries there and a client
asking *where did my PDFs go* deserves better than "trust us." But it **collapses
the two-hex fan-out level**, because `bin/00/`, `bin/05/`, `bin/09/` each holding
exactly one file is a sharding optimisation that restic and Kopia also use, and
is structure carrying no information.

The test is not *"is this internal?"* but **"does this level tell the reader
anything?"** A digest folder does not. A `sources/` folder does — it says these
are captured sources rather than outputs.

And when you flatten for display, **flatten what you draw, never what you hand
back**. corpora-builder's `bin/` node lists objects directly while each file
node's `path` remains its real key, or clicking one would 404.

### 5. Write the backend seam before there is a second backend

flave-ai's `WorkspaceFs` is the pattern:

```ts
export interface WorkspaceFs {
  readonly kind: 'tauri' | 'memory';
  root(): Promise<string>;
  tree(): Promise<FsNode[]>;
  read(path: string): Promise<string>;
  write(path: string, contents: string): Promise<void>;
}
```

Its own comment carries the argument: *"writing the seam before the second
backend exists is the only time it is cheap."*

The `MemoryFs` fallback is worth copying for its honesty as much as its utility.
It exists so `pnpm dev` shows a working surface in a browser, and it **says so in
the UI** — `'in-memory workspace — launch the desktop app for real files'` —
rather than accepting writes and losing them.

## The recursive component

Both are the same nine lines of structure. Import yourself, pass `depth + 1`,
push indentation through a custom property rather than nesting padding:

```svelte
<script lang="ts">
  import Self from './FileTree.svelte';
  let { nodes, depth = 0, ... } = $props();
</script>

<ul class="tree" style="--depth: {depth}">
  {#each nodes as node (node.path)}
    ...
    <Self nodes={node.children} depth={depth + 1} ... />
  {/each}
</ul>
```

```css
padding-left: calc(var(--space-3) + var(--depth) * 12px);
```

`--depth` as a CSS variable rather than nested margins means a row at depth five
still computes its indentation from one number, and the tree does not accumulate
layout per level. It is also a **component-local custom property** — the tier
augment-it added after finding that forbidding the honest option does not prevent
the value, it only prevents the value from having a name. A design-drift checker
should allow it; corpora-builder's D5 initially did not and was wrong.

## Rows are not controls

The one styling trap, and it bites in any app with a global control primitive.

`input, select, button { border; background; padding: .35rem }` is the right base
rule — until a tree renders 944 buttons and every row acquires a border and a
field background. Tree rows must **opt out and state their own shape**: no
border at rest, no fill, hover expressed as a border colour.

Discovered in corpora-builder by rendering it. It is not visible in the markup.

## Directories: inert or navigable?

The one genuine disagreement between the two implementations, and both are right
for their app.

flave-ai's directories are **inert spans** — a directory has nowhere to go, so
only files are buttons, and its comment ties this to the capability model:
*"Selecting a file is a READ, which is why it does not breach §7.2's capability
ceiling."*

corpora-builder's directories are **buttons** — `live/<type>/<slug>/` maps to a
domain, so clicking one sets the filter and returns to the list. The tree and the
domain combobox become two views of one idea.

**Decide by asking whether a folder means anything in your model.** If it does,
make it navigable and say what the click does. If it does not, an affordance that
does nothing is worse than none — which is why corpora-builder shows its `filter`
action only on folders that actually map to a domain, and not on `bin/`.

## Deriving a tree without a filesystem

The adaptation corpora-builder needed, and the one any store-backed app will.

An object store has no directories. It has keys, and the structure is *in* them:

```python
def build_tree(keys: list[str]) -> list[TreeNode]:
    """Pure: no store, no I/O, nothing to mock."""
```

This is better than walking a disk, not worse, and the reason is measured. In
corpora-builder `/api/meta` once derived a source count and a domain list by
**reading all 845 files** — 20.6 seconds cold against R2, presenting as a window
stuck on "Starting the backend…". Both facts were in the keys. One `list()` call,
0.8 seconds.

So the rule for a store-backed tree is: **structure lives in the key; painting it
costs zero reads.** And the promise is testable in the only terms that survive a
faster laptop:

```python
assert CountingStore.reads == 0
```

Not elapsed time. A wall-clock assertion passes on a fast machine and rots
quietly; a read count is what you actually mean.

## Checklist for the third implementation

1. `FsNode { name, path, is_dir, children }`, plus `count` if the tree is large.
2. Paths relative, asserted — even when the language makes escape hard.
3. Folders first, then plain alphabetical.
4. Collapse levels that carry no information; keep every object reachable; never
   flatten the value you hand back.
5. Backend behind an interface, with a second implementation that is honest about
   being one.
6. Recursive component, `--depth` custom property, rows opted out of the control
   primitive.
7. Directories navigable **only** if a folder means something in your model.
8. Store-backed? Derive from keys and assert the read count is zero.

## Related

- `flave-ai/apps/editor/src/FileTree.svelte`, `workspace-fs.ts`, `src-tauri/src/lib.rs` — the first implementation
- `corpora-builder/context-v/specs/Corpus-Tree.md` — the second, and the keys-not-directories adaptation
- `corpora-builder/context-v/specs/Domain-Navigation.md` — the other half of navigating a large workspace
- [[Per-App-Workspace-Conventions]] — the surrounding pattern; this blueprint is one surface within it

---
title: "Header Chrome"
lede: "The workspace becomes a switcher, not a label. The mode toggle shows one icon and says what the next click gets you."
publish: true
date_created: 2026-08-23
date_modified: 2026-08-23
date_authored_initial_draft: 2026-08-23
date_authored_current_draft: 2026-08-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: Draft
site_uuid: 9b3c50ae-1f7d-4e62-8a94-c0d5e2f7a613
hex_code: h6dn4s
tags:
  - Spec
  - Corpora-Builder
  - Frontend
  - Theme-System
from: "corpora-builder"
from_path: "context-v/specs/Header-Chrome.md"
---
# Header Chrome

## Why

The header says `corpora reach-edu (reach-edu)`. That is a slug printed twice
and a bucket name leaking into the product, and it is not a control — there is no
way to see or change which workspace you are in.

Both halves already exist elsewhere in the tree and neither needs inventing.

## Behaviours

### 1. The workspace is a switcher, in augment-it's shape

Ported from `augment-it/shell/src/WorkspaceSwitcher.svelte` — the same trigger,
the same listbox, the same interaction contract. Pattern port, **not a shared
dependency**, per the no-shared-dependency-across-ai-labs-apps convention.

- The trigger shows the **display name only**: *Reach Edu*.
- The **slug appears only inside the dropdown**, on its row, beside the name —
  which is where an operator goes when they need to know exactly which corpus
  they are pointed at.
- Dot, label, chevron. `aria-haspopup="listbox"`, rows are `role="option"` with
  `aria-selected`, the active row carries a check.
- Escape closes; a pointer-down outside closes.

Top right, because that is where it sits in augment-it and a person who uses both
should not have to look in two places.

### 2. A display name is derived, not demanded

`display_name` currently defaults to the slug, which is how `reach-edu
(reach-edu)` happened. When nothing is configured it is **humanised from the
slug** instead: `reach-edu` → `Reach Edu`.

`CORPORA_WORKSPACE_NAME` still wins when set, because a derived name is a
reasonable guess and not an authority — `ncad-forge` should be able to say
*NCAD-Forge*.

### 3. The API hands over structure, not a rendered string

`/api/meta` returned `label: "reach-edu (reach-edu)"` — a formatted string the
client could only print. It now returns the workspace as fields, so the client
decides what to show where. A server that pre-renders a label has made a layout
decision on the client's behalf and taken away the only thing the client is for.

### 4. One mode icon, and it says what comes next

The canonical three icons — sun, crescent, four-point star — are lifted verbatim
from `ai-labs/splash/src/components/ModeToggle.astro`, where the same three modes
have the same three glyphs.

Splash pages show **all three** and glow the active one. Here it is a **straight
swap**: one icon, the current mode, and clicking advances. A three-button group
is right on a marketing page where the modes are part of the pitch; in a dense
tool it is three targets to do one thing.

**The tooltip is what makes a single icon honest.** An icon that changes on click
without saying what it becomes is a guessing game:

```
Light mode · click for Dark
Dark mode · click for Vibrant
Vibrant mode · click for Light
```

The cycle is `light → dark → vibrant → light`, and the tooltip is generated from
it rather than written out, so the two cannot disagree.

### 5. A partial payload degrades to the name we have

`label` — the server's own name for the corpus — predates the `workspace` field
and is still sent. When a client is holding a `meta` older than that field, the
trigger shows `label` rather than an em dash.

This was reported from the running app: Vite HMR swapped the new component in
without re-running the initial fetch, so `meta` came from a sidecar that had no
`workspace` key. A hard reload fixes that instance; **rendering nothing while a
usable name sat unused beside it is the part that was actually wrong.**

And a missing `workspace` is **not** the same as a local folder. Saying "local
folder" because a field was absent is a confident wrong answer about where
somebody's corpus lives, so the footer says nothing instead.

## Tests

| ID | Given / When / Then |
|---|---|
| `HEADER-01` | Given a slug and no configured name, when the workspace resolves, then the display name is the humanised slug and the slug itself is unchanged |
| `HEADER-02` | Given `CORPORA_WORKSPACE_NAME`, when the workspace resolves, then the configured name wins over the derived one |
| `HEADER-03` | Given a workspace, when `/api/meta` is called, then slug and display name are separate fields rather than one rendered label |
| `HEADER-04` | Given each mode in turn, when the next mode is asked for, then the cycle is light → dark → vibrant → light |
| `HEADER-05` | Given each mode, when its tooltip is generated, then it names the current mode and the one a click produces, and never disagrees with the cycle |
| `HEADER-06` | Given a payload with no `workspace` field, when the trigger renders, then it falls back to `label`; and the footer claims a storage location only when one was actually reported |

## Related

- `augment-it/shell/src/WorkspaceSwitcher.svelte` — the switcher this ports
- `ai-labs/splash/src/components/ModeToggle.astro` — the three canonical icons
- `app/DESIGN.md` — the three-mode contract and the control primitive
- `context-v/specs/Browse-Corpus.md` — `/api/meta`, whose shape this changes

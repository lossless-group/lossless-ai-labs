---
title: Design Briefs — The Water Foundation
directory_role: design-briefs
date_created: 2026-08-14
version: 0.0.0.1
from: "dididecks-ai/the-water-foundation"
from_path: "context-v/design-briefs/README.md"
---
# `context-v/design-briefs/`

One file per **design brief**: a written spec for how a specific slide (or
alternate treatment of a slide) should look and behave, authored *before* the
slide is built.

A design brief is not a slide and not a plan. It sits between them — it names
the slot, states what the slide has to accomplish, and commits to a visual
approach in enough detail that the Scroll-UI implementation and its Play-UI
counterpart can both be built from it without re-deciding the look.

## Scope

Briefs here govern deck work for The Water Foundation. The visual vocabulary
they draw on is fixed by [`../../DESIGN.md`](../../DESIGN.md) — a copy of the
website's contract at `astro-knots/sites/twf_site/DESIGN.md`. A brief may
extend that vocabulary for slide scale; it may not quietly contradict it.

## Naming

`Design-Brief--<Deck>--<Slot>--<Treatment>.md`

## Related

- [`../../DESIGN.md`](../../DESIGN.md) — the design contract these briefs work within
- `inputs/2026-08-14_The-Water-Foundation_HAK-Invitation/` — the client-supplied
  source deck. Gitignored, so it is present only in a working tree that received
  it out-of-band; briefs must carry enough description to stand without it.

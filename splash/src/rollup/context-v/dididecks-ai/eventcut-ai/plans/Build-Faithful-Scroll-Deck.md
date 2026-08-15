---
title: "Build the EventCut faithful scroll deck (Phase 1)"
date_created: 2026-08-02
date_modified: 2026-08-02
authors:
  - Michael Staton
augmented_with: Claude Opus 4.8 on Claude Code
semantic_version: 0.0.0.1
status: Implementing
lede: "Phase 1 of the deck-iteration-workflow for EventCut: a single-page Astro scroll deck built VERBATIM from the extracted source narrative — design-only re-do, content locked. The my-take fork comes after."
tags:
  - Deck
  - Scroll-Deck
  - Faithful
  - EventCut
  - Phase-1
from: "dididecks-ai/eventcut-ai"
from_path: "context-v/plans/Build-Faithful-Scroll-Deck.md"
---
## Decision context

Two content-states, represented as two shell decks (no shell change — see
[[Two-Content-States-Not-Shell-Feature]] reasoning in session):

- **`faithful`** — EventCut's content **verbatim**, locked (this plan). Fidelity
  contract: **no copy edits.** Design-only revision.
- **`my-take`** — didi's editorial fork (later). Content changes, shipped with a
  `context-v/narratives/My-Take-Content-Diff.md`.

Content source of record: [[Source-Deck-Extraction]] (15 of 17 slides; 16–17
missing = the Ask + Close, requested from client).

## Brand (from the source deck — use as-is for faithful)

- Wordmark: **EDIT ON THE SPOT** (play-triangle mark). Products: **Eventcut** /
  **Gradcut**. This site is the Eventcut deck.
- Palette: maroon/brick accent (~`#A32B2B`), near-black text (~`#1a1a1a`), white
  bg. Accent used on one emphasized word per headline ("Live", "workflow",
  "solution", "instantly", "revenue", "Size", "SOM", "event scale", "decades").
- Type: clean sans, large centered headlines, kicker + headline pattern.

## Phase 1 build

1. **Theme tokens** — set EventCut palette in the existing `theme.css`/`global.css`
   (currently chroma's blue/amber). Maroon accent, white bg, near-black text.
2. **Register the deck** — `src/data/decks.ts` add `faithful`; `src/data/slides.ts`
   add its 15 slots (00–14 or 01–15 per the extraction).
3. **Scroll page** — `src/pages/scroll/faithful/as-supplied/index.astro`: one page,
   each of the 15 slides a `<section>` component, inline Tailwind, no JS. Reuse the
   `deck-*` primitives already in the styles.
4. **Slide inventory** (verbatim from extraction):
   01 Cover · 02 Problem · 03 Solution · 04 Value Prop · 05 Outcome ·
   06 Two products · 07 Traction · 08 Market Size · 09 Business Model ·
   10 TAM·SAM·SOM · 11 GTM · 12 Why We Win · 13 Competition matrix ·
   14 Team · 15 Financials. (16 Ask + 17 Close pending client.)
5. **Checkpoint after ~3 slides + theme** so the design direction is approved
   before committing all 15.

## Not in scope here

- Play-UI counterparts (Phase 1→2 conversion comes later).
- my-take content fork + diff doc.
- Slides 16–17 (missing from source).
- Any `@dididecks/shell` change (graduate `basis`/`derivesFrom`/diff later).

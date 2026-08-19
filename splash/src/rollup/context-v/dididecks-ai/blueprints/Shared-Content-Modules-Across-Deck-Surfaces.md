---
title: "Shared Content Modules Across Deck Surfaces"
lede: "One typed content module per deck variant drives Scroll-UI, Play-UI, and the PPTX exporter — so copy cannot drift between surfaces."
date_created: 2026-07-28
date_modified: 2026-07-28
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
semantic_version: 0.0.1.0
tags:
  - Content-Modules
  - Single-Source
  - Play-UI
  - Scroll-UI
  - PPTX-Export
  - Google-Slides
  - Citations
  - DidiDecks
publish: true
site_uuid: ee059d7e-a0f3-4aa7-bdb8-b303d868e79a
hex_code: 64etcg
date_authored_initial_draft: 2026-07-28
date_authored_current_draft: 2026-07-28
from: "dididecks-ai"
from_path: "context-v/blueprints/Shared-Content-Modules-Across-Deck-Surfaces.md"
---
# Shared Content Modules Across Deck Surfaces

## The problem this solves

A DidiDecks deck lives on multiple surfaces with incompatible constraints:

- **Scroll-UI** — responsive sections, scroll-snap, inline scripts allowed.
- **Play-UI** — rigid 1920×1080, no responsive CSS, no JS, letterboxes anywhere,
  exports to PDF without hydration.
- **PPTX / Google Slides** — no HTML at all; native text boxes and autoshapes,
  a crippled font universe, no gradient text, no scrolling.

Hand-writing each surface means the same sentence exists in three places. The
moment an operator sharpens a headline on one surface, the others are stale —
and with cited, verification-hardened decks, drift isn't cosmetic: a corrected
figure that updates in the web deck but not the PPT is a **wrong number in
front of a funder**.

## The pattern

**Per deck variant, one plain-data content module** is the single source of
truth for everything except layout:

```
src/data/deck-content/<variant>.mjs     ← plain JS (.mjs so Node scripts can
                                          import it without a TS toolchain)
  export const META   = { deckSlug, variant, sectionDir, title }
  export const SLIDES = [ { slot, slug, kind, title: [segments],
                            lede?, items?, note?, cites… }, … ]
```

Three consumers, zero shared rendering code:

1. **Play-UI**: one generic renderer (`PitchPlaySlide.astro`) switches on
   `kind` ('cover' | 'statement' | 'grid' | 'sources'). Per-slot files are
   40-line generated wrappers (`<slot>-<slug>.astro`) that exist only because
   the shell's route glob needs real files — they contain no content.
2. **PPTX exporter** (`scripts/export-pitch-decks-pptx.mjs`): the same `kind`
   switch, rendered as pptxgenjs native shapes, once per theme mode.
3. **Scroll-UI** (convergence pending): sections still hold their own copies of
   the arrays; the module was transcribed *from* them. Next refactor points the
   sections at the module too — until then, Scroll is the authoring surface
   and the module is downstream of it.

### Content is structured, not prose-in-markup

The load-bearing prerequisite: slides carry **typed data arrays** — stats,
cards, chips, steps — plus headline *segments* (`[{t, accent?}]`), never
rendered strings. That's what makes a slide expressible as flexbox, as fixed
1920×1080, or as five rounded rectangles in a PPT, without re-authoring.
Accent segments render as gradient text on the web and flatten to the mode's
secondary color in PPT — the *decision* ("this phrase pops") lives in data;
each surface interprets it within its own means.

### Citations ride along by hex code

Slides reference citations as **canonical hex codes** (`cites: ['57ce95']`)
from the per-client registry — never as numbers. Every surface derives `[n]`
from the deck's citation array order (first appearance) at build time:

- Scroll-UI: `<InlineCitation>` popovers + a paginated Sources slide.
- Play-UI: superscript `[n]` + per-slide footnote strips.
- PPTX: superscript text runs; hex codes + URLs preserved in **speaker
  notes**; the sources list paginated across closing slides (PPT can't
  scroll).

Reorder slides on any surface and every pairing survives — the same property
the hex-code discipline gives the narratives extends to every export.

### Kinds are a deliberately tiny vocabulary

Four kinds cover eight funder decks. Resist adding a kind per slide: a new
kind must be implemented **once per surface** (that's the tax that keeps the
promise). If a slide doesn't fit, first try expressing it as `grid` with
different data density — `cols`, chip/stat/head/body optionality, and a
`note` line absorb most "special" layouts.

## Why this beats the alternatives

- **vs hand-written slides per surface**: 8 modules + 1 renderer + 1 exporter
  replaced ~80 slide files, and edits land everywhere at once.
- **vs DOM-scraping HTML → PPT**: scraping inherits every CSS trick PPT can't
  express and breaks silently; data-driven generation targets each surface's
  native idiom (the reason Google Slides imports stay *editable*).
- **vs screenshots → PPT**: pixel-faithful but dead — no editing, no
  reflow, unusable to a team that works in Slides.

## Costs, honestly

- **Scroll-UI duplication until convergence** — the one open drift risk;
  close it by making sections import the module (mechanical, not yet done).
- **Layout intelligence lives in renderers**, so a slide that looks perfect
  on the web can overflow a PPT card; the fix is always a renderer
  parameter (density thresholds, font clamps), never a fork of the content.
- **Copy edits move from markup to data** — operators edit a `.mjs` array
  rather than an `.astro` file. Same effort, different location; document it.

## Reference implementation

reach-edu-hub (client-sites/reach-edu-hub), 2026-07-28:

- `src/data/deck-content/{um,wd,rib,aln,fjd,nf,awm,ref}-p1.mjs`
- `src/components/slides/PitchPlaySlide.astro` + generated wrappers under
  `src/components/slides/<variant>/`
- `scripts/export-pitch-decks-pptx.mjs` → `exports/pitch-decks/
  <variant>--{dark,light}.pptx` (16 files, both palettes from theme tokens)
- Plan that anticipated it: reach-edu-hub `context-v/plans/
  Sixteen-Nine-Export-Variant-and-PPT-Pipeline.md`
- Prior art: the rural-income v1 hand-mapped exporter
  (`scripts/export-rural-income-native.mjs`, 2026-07-07) — the layout
  vocabulary this generalizes.

## Lift candidates

The renderer + exporter pair is a natural `@dididecks/shell` promotion once a
second client adopts the pattern (chroma-decks is the obvious next). The
content-module schema should be published as a typed interface in the shell at
the same moment — the schema, not the renderers, is the real contract.

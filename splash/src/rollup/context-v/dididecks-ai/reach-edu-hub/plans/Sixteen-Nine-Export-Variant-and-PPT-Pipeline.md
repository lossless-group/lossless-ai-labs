---
title: "16:9 Export Variant (Play-UI) and the PPT/PDF Pipeline"
lede: "Plan for the fixed-aspect, no-scroll, no-animation variant of each strategy pitch deck — the Play-UI conversion per the DidiDecks discipline — plus a native-shapes PPT exporter tuned for clean Google Slides import, and PDF via the shell's print route. Written 2026-07-28 while building the Scroll-UI decks, so the conversion is anticipated, not retrofitted."
date_authored_initial_draft: 2026-07-28
date_authored_current_draft: 2026-07-28
date_last_updated: 2026-07-28
at_semantic_version: 0.0.1.0
status: Draft
category: Plan
tags: [Play-UI, Export, PPT, PDF, Google-Slides, pptxgenjs, Deck-Iteration, reach-edu]
authors:
  - Michael Staton
augmented_with: "Claude Code (Fable 5)"
from: "dididecks-ai/reach-edu-hub"
from_path: "context-v/plans/Sixteen-Nine-Export-Variant-and-PPT-Pipeline.md"
---
# 16:9 Export Variant and the PPT/PDF Pipeline

## What the operator asked for

A variant of each pitch deck that is "more or less the same" but fits exactly
into 16:9 with **no scroll behavior or animations**, in preparation for export
to **PDF and PPT** — where the PPT must be near-perfect because the team works
in **Google Slides** (imports from PPT with few glitches *when the markup is
elegant*).

## Why this is the Play-UI phase, by the book

The dididecks discipline already names this exactly (repo CLAUDE.md): every
deck has two coordinated implementations —

- **Scroll-UI** (built 2026-07-28): responsive sections, scroll-snap, inline
  scripts allowed. This is where we design.
- **Play-UI**: standalone per-slide files at
  `src/components/slides/{variant}/{slot}-{slug}.astro`, rendered by the
  shell's `/play/[deck]/[variant]/[slot]` route inside `SlideCanvas` — rigid
  **1920×1080**, **no responsive CSS, no JS in the slide** — which letterboxes
  to any viewport and exports to PDF without hydration. The shell already
  ships `/play/.../print.astro` for the PDF path.

So "the 16:9 variant" = the Play-UI conversion of each `*-p1` variant,
slot-for-slot per `slides.ts` (recreate, don't extract — per
`/api/slide-decompose` discipline).

## The load-bearing anticipation: content as data

Every Scroll-UI section built in this pass keeps its content in **typed
frontmatter arrays** (`stats`, `kpis`, `rows`, `steps`, `tiers`, `arc`) plus a
headline/eyebrow — not prose baked into markup. That makes three consumers
possible from one source:

1. Scroll-UI section (exists)
2. Play-UI slide (this plan)
3. **PPT exporter** (this plan)

**Refactor step (do first):** lift each deck's content arrays out of the
section frontmatter into `src/layouts/sections/{deck}/content.ts` (typed,
per-slot exports), and make sections import from it. Citations already live in
per-deck `citations.ts` with canonical hex codes and build-time `[n]`
indexing — the exporter reuses them as-is.

## PPT pipeline (the part that must be perfect)

**Approach: generate native PPT shapes with `pptxgenjs` — never raster.**
Google Slides imports native text boxes, autoshapes, and tables with high
fidelity; it mangles embedded images-of-text and ignores exotic effects.

- One Node script per client: `scripts/export-pptx.mjs` reading
  `content.ts` + `citations.ts` + `slides.ts` per deck → one `.pptx` per deck
  (and optionally one combined).
- **Layout**: 13.333in × 7.5in (16:9). A small layout vocabulary mirroring the
  deck primitives: cover, statement (centered quote), stat-grid (2–4 cols of
  stat cards as rounded rectangles + text), list-cards, table-wall, sources.
- **Tokens → PPT theme**: export in **light mode** values from `theme.css`
  Tier-2 tokens (background, text, muted, accent, secondary). Gradient
  headline spans render as solid accent color in PPT (gradient-filled text
  does not survive Slides import).
- **Fonts**: map to Google-Slides-native faces (custom webfonts do not embed
  through Slides import). Heading → a Slides-safe geometric sans; body →
  Arial/Inter fallback. Record the mapping in DESIGN.md when it exists.
- **Citations in PPT**: inline `[n]` as superscript text runs (pptxgenjs
  `superscript: true`); each deck ends with **paginated Sources slides** —
  a PPT can't scroll, so chunk the ordered citation list ~10–12 per 16:9
  slide (`Sources 1/3`, `2/3` …). Hex codes stay in the speaker notes per
  slide for traceability.
- **No animations, no transitions** — by construction.
- **Verification loop**: import the generated PPT into Google Slides and walk
  it (browser-drive per the verification blueprint) before it ever goes to
  the team; glitches found → fix the generator, not the file.

## PDF pipeline

Primary: the shell's `/play/[deck]/[variant]/print` route (all slides,
1920×1080, no hydration) → headless Chromium print-to-PDF (Playwright), one
PDF per deck. The Sources slides use the same pagination as PPT (no scroll in
print). Fallback: pptx → PDF via LibreOffice headless if a single toolchain is
preferred.

## Sequencing

1. **Content-module refactor** — lift arrays to `content.ts` per deck; wire
   Scroll-UI sections to import them (no visual change; verify with build +
   smoke).
2. **Play-UI exemplar** — convert `upward-mobility` slot-by-slot
   (`src/components/slides/um-p1/{slot}-{slug}.astro`), register in the shell
   chooser; operator walks it.
3. **PPT exporter exemplar** — `export-pptx.mjs` for upward-mobility; import
   into Google Slides; iterate until clean.
4. **Fan out** both to the remaining seven decks (mechanical once the
   vocabulary is proven).
5. **PDF batch** via the print route.

## Constraints to respect (learned this pass)

- Sources lists exceed one screen — pagination is a first-class layout, not
  an afterthought (Scroll-UI got `SourcesPager`; Play/PPT get numbered
  Sources slides).
- Header/chrome: Play-UI and exports have **no site chrome at all** — the
  scroll deck's auto-hide header and `c`-toggle are Scroll-UI-only concerns.
- Overwhelm slides (KPI walls, money maps) must be re-typeset for fixed
  1920×1080 — auto-fit grids don't exist in PPT; the content.ts arrays make
  per-slot column counts an explicit exporter parameter.

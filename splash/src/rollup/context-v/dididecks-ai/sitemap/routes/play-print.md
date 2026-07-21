---
title: "/play/[deckSlug]/[variantSlug]/print/ — one-shot PDF export surface; renders the whole variant stacked for the browser print dialog"
lede: "Print-styled route that renders every slot for a given (deck, variant) as a stacked sequence of SlideCanvas instances, page-broken with `page-break-after: always` per slide. No @page size override — the browser decides paper size; each SlideCanvas letterboxes inside that printable area via CSS-only container-query scaling (`cqi`/`cqb`). Reader prints via the browser dialog; PDF comes out as one slide per page. Static HTML/CSS, no JS — same constraint as Play-UI slides themselves, because runtime hydration would break the print render."
artifact_kind: route
ownership: shell
mode: play-ui
status: shipped
shell_version_introduced: 0.0.1
route_pattern: "/play/[deckSlug]/[variantSlug]/print/"
prerender: false
composes:
  - SlideCanvas
  - DecomposeFirstPlaceholder
theming_tokens_consumed:
  - --color-background
  - --color-text
plan_of_record: "[[../../plans/Port-Enhanced-v2-Scroll-Slides-to-Static-16x9-Play-Slides-for-PDF-Export]]"
file: apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/print.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-15
date_last_updated: 2026-06-07
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Calmstorm-Pattern
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/play-print.md"
---
# /play/[deckSlug]/[variantSlug]/print/

## Render approach (calmstorm pattern, verbatim)

- Walks `SLOTS[variantSlug]` in order
- For each slot, looks up per-slide file at `src/components/slides/{variant}/{slot}-{slug}.astro`; if found, renders inside `<SlideCanvas>`; if missing, renders `<DecomposeFirstPlaceholder>`
- Each slide carries `page-break-after: always` so the browser inserts a page break between them
- No `@page` size override — browser dialog decides paper size. SlideCanvas's `container-type: size` lets the 1920×1080 design stage letterbox to whatever printable area appears.

## Why not @page

Setting `@page size: 1920px 1080px` works in Chrome but is inconsistent across reader environments (Firefox print preview interprets differently; Safari struggles with non-letter sizes). Letting the browser pick paper size + scaling SlideCanvas within it is the more compatible path.

## Status

- ✅ Shipped — calmstorm uses this in production for the LP-facing PDF send
- ✅ Plan reference: `Port-Enhanced-v2-Scroll-Slides-to-Static-16x9-Play-Slides-for-PDF-Export`

## Related

- [[play-slot]] — the per-slot interactive route this complements
- [[play-index]] — variant index
- [[../components/SlideCanvas]] — the 16:9 wrapper component
- [[../components/DecomposeFirstPlaceholder]] — the "not yet ported" stand-in
- [[../../plans/Port-Enhanced-v2-Scroll-Slides-to-Static-16x9-Play-Slides-for-PDF-Export]]

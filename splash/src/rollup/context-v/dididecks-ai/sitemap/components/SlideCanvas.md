---
title: "SlideCanvas — pure-CSS 16:9 wrapper that scales a 1920×1080 stage to fit any canvas"
lede: "Per @dididecks/shell contract, rendered play decks must be static HTML + CSS — no JS in the scaling pipeline. SlideCanvas uses CSS container queries (`container-type: size`) to compute a unitless scale ratio from canvas size to the design size (1920×1080 by default), then applies `transform: scale()` to a `position: absolute` stage. `min(100cqw/designW, 100cqh/designH)` picks whichever axis is the binding constraint so the slide letterboxes correctly when canvas aspect ≠ 16:9. The route's `[slot].astro` is responsible for sizing the canvas; this component just translates that size into a scaled stage."
artifact_kind: component
ownership: shell
mode: play-ui
status: shipped
shell_version_introduced: 0.1.0-rc.0
composes: []
composed_by:
  - "/play/[deckSlug]/[variantSlug]/[slot] route"
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety]]"
file: apps/deck-shell/src/components/SlideCanvas.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-13
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Pure-CSS
  - No-ContentFit-Yet
from: "dididecks-ai"
from_path: "context-v/sitemap/components/SlideCanvas.md"
---
# SlideCanvas

## Props

```ts
interface Props {
  designWidth?: number;   // default 1920
  designHeight?: number;  // default 1080
  title?: string;
  background?: string;
}
```

## Why pure-CSS (no JS)

The Play-UI contract: rendered play decks are static HTML/CSS so they ship clean to any host, share-link, or PDF-export pipeline. CSS container queries (`100cqw`, `100cqh`) make script-free aspect-ratio scaling possible. Calmstorm's `ContentFit` (ResizeObserver + scale-transform) is the JS-driven equivalent — A++.3 lifted `SlideCanvas` only; `ContentFit` remains unlifted and will be needed for slides whose content size isn't known at author-time.

## Reveal-animation note

Scroll-deck reveal animations (`[data-reveal]`, `.reveal-item`) depend on IntersectionObserver and don't run inside the static canvas. A global CSS rule pins their visible state so reveal-opt-in slides still render correctly in Play.

## Status

- ✅ Shipped pure-CSS scaling.
- ⚠️ `ContentFit` sibling primitive not yet lifted from calmstorm (A++.3 partial).
- ⚠️ Composed by `/play/[slot]` route today; will be composed by `DeckOverlay--Play-UI` once the route migrates.

## Related

- [[DeckOverlay--Play-UI]] — target composition parent.
- [[../routes/play-slot]] — current direct consumer.
- [[../../plans/Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety]] — origin plan (A++.3 + A++.4).

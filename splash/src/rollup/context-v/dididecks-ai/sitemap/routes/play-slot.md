---
title: "/play/[deckSlug]/[variantSlug]/[slot]/ — single-slot Play-UI renderer with keyboard nav"
lede: "Static route emitted for every slot in `SLOTS[variantSlug]`. Resolves the slot's `slug` from the registry, then dynamic-imports the per-slide component at `/src/components/slides/{variant}/{slot}-{slug}.astro` via `import.meta.glob` and renders it inside SlideCanvas; falls back to DecomposeFirstPlaceholder if the file doesn't exist. Today the route directly composes DididecksNav + DeckChrome + SlideCanvas inline; the target shape composes them via `DeckOverlay--Play-UI`, which also wraps the slide in `<section data-slot data-variant>` so SlideRankPill mounts work (closes A++.2 structurally)."
artifact_kind: route
ownership: shell
mode: play-ui
status: partial
shell_version_introduced: 0.1.0-rc.0
route_pattern: "/play/[deckSlug]/[variantSlug]/[slot]/"
emits_for: "every slot in SLOTS[variantSlug] for every (deck, variant)"
composes:
  - DididecksNav
  - DeckChrome
  - SlideCanvas
  - DecomposeFirstPlaceholder
target_composition:
  - "DeckOverlay--Play-UI (wraps DeckChrome + SlideRankPill + SlideCanvas)"
theming_tokens_consumed:
  - --ddd-play-*
  - --ddd-chrome-*
consumer_dependency: "Per-slide components live in the consumer's `src/components/slides/{variant}/`"
plan_of_record: "[[../../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]]"
file: apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/[slot].astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-12
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Migration-Pending-To-DeckOverlay
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/play-slot.md"
---
# /play/[deckSlug]/[variantSlug]/[slot]/

## What it does

- `getStaticPaths` enumerates every slot of every variant from the registry.
- Render-time dynamic-imports the per-slide component; falls back to `DecomposeFirstPlaceholder`.
- Wraps the slide in `SlideCanvas` (16:9, 1920×1080 design size, pure-CSS scaling).
- Provides full keyboard contract via the inline `DeckChrome` mount.

## Migration target

Replace the direct `<DididecksNav> + slide + <DeckChrome>` composition with a single `<DeckOverlay--Play-UI>` mount. Net effects:
- `SlideRankPill` mounts (in-play ranking — A++.2).
- The `C` chrome-toggle correctly fades nav + classifier together.
- Position conflict between `DeckChrome` (bottom-right) and `SlideRankPill` (bottom-right) needs resolution before this migration ships — see [[../components/DeckOverlay--Play-UI]] open questions.

## Status

- ✅ Renders. 16 slot pages emit for enhanced-v3.
- ⚠️ Migration to `DeckOverlay--Play-UI` pending — closes A++.2.
- ⚠️ `ContentFit` not yet lifted (A++.3 partial); content larger than the design size gets clipped today.

## Related

- [[../components/DeckOverlay--Play-UI]] — migration target.
- [[../components/SlideCanvas]], [[../components/DeckChrome]], [[../components/DididecksNav]], [[../components/DecomposeFirstPlaceholder]] — current direct compositions.
- [[play-index]] — redirect source.
- [[toc]] — `[view →]` links land here.

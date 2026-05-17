---
title: "/toc/[deckSlug]/[variantSlug]/ — bird's-eye-view audit dashboard with rank pills + scaffold buttons"
lede: "Static table-of-contents route emitted for every (deck, variant) pair in the consumer's `DECKS` registry. Renders one row per slot from `SLOTS[variantSlug]`, each row showing the slot number, title, five rank pills (mirroring SlideRankPill's enum), a scaffold button that POSTs to /api/slide-decompose, and — when the per-slide file exists — a `[view →]` link to `/play/{deck}/{variant}/{slot}/`. The TOC is the read-only-on-deploy / read-write-in-dev audit surface; it complements (does not replace) the in-place SlideRankPill on scroll-deck routes."
artifact_kind: route
ownership: shell
mode: n/a
status: shipped
shell_version_introduced: 0.0.1
route_pattern: "/toc/[deckSlug]/[variantSlug]/"
emits_for: "every (deck, variant) in DECKS registry"
composes:
  - DididecksNav
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]]"
file: apps/deck-shell/src/routes/toc.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-12
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Iteration-Pending
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/toc.md"
---
# /toc/[deckSlug]/[variantSlug]/

## Data flow

- `getStaticPaths` enumerates every `(deck, variant)` from the deck registry.
- Render-time reads `SLOTS[variantSlug]` for rows and the audit registry for current ranks.
- Each row's `[view →]` link is conditional on `perSlideFileExists(...)`.

## What needs iteration (founder note 4 from A+ smoke-test)

Unspecified. Founder will supply pointers next session. Likely candidates:
- Re-skin to match `DeckChrome`'s themable namespace.
- Surface decompose-stub state more clearly (icon? row tint? scaffolded-but-empty vs. scaffolded-and-populated?).
- `?focus={slot}` query param wired by `DecomposeFirstPlaceholder` should auto-scroll to that row and highlight it.

## Status

- ✅ Shipped Phase A; A+ added `[view →]` links.
- ⚠️ Cosmetic iteration outstanding.

## Related

- [[../components/DididecksNav]]
- [[api-slide-rank]], [[api-slide-decompose]]
- [[play-slot]] — destination of `[view →]` links.
- [[../../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]] — origin plan.

---
title: "/toc/[deckSlug]/ — deck-level dual-surface review matrix (one row per slot × one column per variant)"
lede: "The deck-level audit surface — distinct from `/toc/[deckSlug]/[variantSlug]/` which is the per-variant TOC. This route renders the full variants × slots matrix with dual-surface (Scroll + Play) ratings per cell, per-variant shippability rollups in the column headers, and a per-row drift indicator (`≠`) when scroll and play disagree. Effectively just embeds the `DeckMatrix` component with `showNav={true}` so the variant-chooser pills sit at the top. Reads from the same audits registry the per-slot SlideRankPill writes to — values match what reviewers actually clicked."
artifact_kind: route
ownership: shell
mode: n/a
status: shipped
shell_version_introduced: 0.0.1
route_pattern: "/toc/[deckSlug]/"
prerender: false
composes:
  - DeckMatrix (with showNav={true})
  - DididecksNav (via DeckMatrix)
theming_tokens_consumed:
  - --color-background
  - --color-surface
  - --color-text
  - --color-text-muted
  - --color-border
  - --color-accent-1
plan_of_record: "[[../../plans/Redesign-TOC-as-Deck-Level-Dual-Surface-Review-Matrix]]"
file: apps/deck-shell/src/routes/toc-deck.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-15
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
related_models:
  - "[[../../models/Slide-Audit-Registry-Data-Model]]"
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/toc-deck.md"
---
# /toc/[deckSlug]/

## Distinction from /toc/[deckSlug]/[variantSlug]/

| Route | Granularity | Shape |
|---|---|---|
| `/toc/[deckSlug]/` (this file) | one deck, all variants | variants × slots matrix; dual-surface ratings per cell |
| `/toc/[deckSlug]/[variantSlug]/` ([`toc.md`](./toc.md)) | one (deck, variant) pair | single column of slots; per-slot rank pills + scaffold buttons |

Both exist. The per-variant TOC is the older / day-to-day surface; the deck-level matrix is the cross-variant review surface that lets a reviewer see "is enhanced-v3 shippable yet" at a glance.

## Data flow

- `getStaticPaths` enumerates `DECKS[*].slug` for every deck
- Render-time: passes `deckSlug` to `<DeckMatrix>` with `showNav={true}` (renders the DididecksNav variant-chooser pills above the matrix); the matrix internally reads `loadAuditRegistry()` + `playableSlotsByVariant()` + per-slide file existence
- Optional `?variant={slug}` query param highlights the column for that variant (passed through to DeckMatrix as `focusVariant`)

## Status

- ✅ Shipped
- ✅ Embedded by consumer landings too — both chroma and humain mount `<DeckMatrix>` directly on `src/pages/index.astro`

## Related

- [[toc]] — the per-variant sibling route
- [[../components/DeckMatrix]] — the component this route is mostly a wrapper around
- [[../components/DididecksNav]] — variant chooser pills (composed via DeckMatrix)
- [[../../models/Slide-Audit-Registry-Data-Model]] — the audit registry that powers the matrix
- [[../../plans/Redesign-TOC-as-Deck-Level-Dual-Surface-Review-Matrix]]

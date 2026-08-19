---
title: "DeckMatrix — the rich audit-rated dual-surface matrix; the deck-level review surface, embeddable on any landing"
lede: "The embeddable variants × slots matrix: each cell pairs a Scroll-UI and Play-UI rating, with `≠` flagging where the two surfaces disagree."
artifact_kind: component
ownership: shell
mode: n/a
status: shipped
shell_version_introduced: 0.0.1
composes:
  - DididecksNav (when props.showNav === true)
composed_by:
  - "toc-deck route (apps/deck-shell/src/routes/toc-deck.astro)"
  - "chroma-decks/src/pages/index.astro (consumer landing)"
  - "humain-vc-decks/src/pages/index.astro (consumer landing — wired this session)"
theming_tokens_consumed:
  - --color-background
  - --color-surface
  - --color-text
  - --color-text-muted
  - --color-border
  - --color-accent-1
data_inputs:
  - DECKS registry (loadDecksRegistry)
  - SLOTS registry (loadSlotsRegistry)
  - audits registry (loadAuditRegistry)
  - per-slide file existence (perSlideFileExists)
plan_of_record: "[[../../plans/Redesign-TOC-as-Deck-Level-Dual-Surface-Review-Matrix]]"
file: apps/deck-shell/src/components/DeckMatrix.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-15
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
related_models:
  - "[[../../models/Slide-Audit-Registry-Data-Model]]"
date_created: 2026-05-15
date_modified: 2026-06-07
publish: true
site_uuid: 7a7ca52b-0cd0-49d7-8b55-82068b76b508
hex_code: 7brdos
date_authored_current_draft: 2026-05-15
from: "dididecks-ai"
from_path: "context-v/sitemap/components/DeckMatrix.md"
---
# DeckMatrix

## Props

```ts
interface Props {
  deckSlug: string;                  // required
  focusVariant?: string | null;      // highlights a column (passes from ?variant= query on /toc/[deckSlug]/)
  title?: string | null;             // h1 above the matrix; pass null to omit
  lede?: string | null;              // descriptor below the h1; pass null to omit
  showNav?: boolean;                 // mount DididecksNav variant-chooser pills above (default false)
}
```

## Cell rendering

Each cell of the matrix is a (variant × slot) pair. Layout:

- Left half: Scroll-UI rating glyph (★ perfect / P passable / C non-urgent-could-be-better / U needs-rework / — pending)
- Right half: Play-UI rating glyph (same enum)
- Far right of row: `≠` symbol when scroll status ≠ play status (drift indicator)
- Click-target on each half navigates to that surface for that slot

## Column-header rollups

Each variant column header shows a shippability rollup: a count of `★` cells / `P` cells / `C` cells / `U` cells / `—` cells across the column. Lets a reviewer see "is this variant ready" without scanning rows.

## Sibling lightweight component (removed)

A sibling `SlideStatusMatrix` component briefly existed as a lighter-weight build-status alternative (file-existence glyphs only, no audit data). Deleted 2026-06-06 (commit `c5a275b`) after a zero-importer audit confirmed neither chroma nor humain reached for it — `DeckMatrix` covers every landing use case the team has. See [Lift-Chroma-Decks-Generic-Code-into-Shared-Shell](../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell.md) Phase 5 status.

## Status

- ✅ Shipped — production-used on chroma's landing + humain's landing + `/toc/[deck]/` route

## Related

- [[../routes/toc-deck]] — the route wrapper
- [[DididecksNav]] — variant-chooser pills (composed when showNav=true)
- [[DeckStatsPanel]] — the 4-tile sibling that mounts above the matrix on landing pages
- [[../../models/Slide-Audit-Registry-Data-Model]] — the data source
- [[../../plans/Redesign-TOC-as-Deck-Level-Dual-Surface-Review-Matrix]]

---
title: "/scroll/pitch/enhanced-v3/ — the most-recent Scroll-UI variant of the Chroma pitch deck"
lede: "Single long page composed of 16 inline `<section data-slot data-variant>` tags representing the full pitch in Scroll-UI mode. The active slot is discovered by SlideRankPill's IntersectionObserver via the data-attrs. Mounts SlideRankPill directly today; target migration is to swap that for `<DeckOverlay--Scroll-UI deckSlug=\"pitch\" variantSlug=\"enhanced-v3\" />` so future overlay additions (variant cycling, notes, telemetry) compose without further consumer edits."
artifact_kind: route
ownership: consumer
mode: scroll-ui
route_pattern: "/scroll/pitch/enhanced-v3/"
status: shipped
variant_slug: enhanced-v3
slot_count: 16
data_attrs_present: true
mounts_overlay: false
mounts_directly:
  - SlideRankPill
target_composition:
  - "DeckOverlay--Scroll-UI"
shell_artifacts_consumed:
  - "[[../../../../../ai-labs/dididecks-ai/context-v/sitemap/components/SlideRankPill]]"
authors:
  - Michael Staton
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Migration-Pending-To-DeckOverlay
from: "dididecks-ai/chroma-decks"
from_path: "context-v/sitemap/routes/scroll-pitch-enhanced-v3.md"
---
# /scroll/pitch/enhanced-v3/

## Section structure

16 sections, each `<section data-slot="NN" data-variant="enhanced-v3">`. Slot numbers reconciled with `src/data/slides.ts` SLOTS entries.

## Migration target

Replace the inline `<SlideRankPill deckSlug variantSlug />` mount with:

```astro
<DeckOverlay__ScrollUI deckSlug="pitch" variantSlug="enhanced-v3" />
```

Zero behavior change; opens the door for `nav`/`notes`/`telemetry` named slots when Phase 2 / 3 / D ship.

## Related

- [[../slides/enhanced-v3/01-cover]], [[../slides/enhanced-v3/15-ask]] — the two slots that ALSO have per-slide Play-UI files.
- [[../../../../../ai-labs/dididecks-ai/context-v/sitemap/components/DeckOverlay--Scroll-UI]] — migration target.

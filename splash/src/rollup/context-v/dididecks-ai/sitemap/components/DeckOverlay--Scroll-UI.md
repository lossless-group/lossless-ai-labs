---
title: "DeckOverlay--Scroll-UI — the floating overlay layer for Scroll-mode decks"
lede: "Single mount point that composes the persistent overlay affordances riding over a Scroll-UI deck: the classifier pill (today), variant-cycling nav + counter (Phase 2 via PageAsDeckWrapper), presenter notes (Phase 3), and engagement telemetry (Phase D). Each is a named slot so consumers can rearrange or omit. The overlay element itself is layout-neutral (`display: contents`) — its children own their own fixed/absolute positioning. The Scroll-UI variant of this paired family; see DeckOverlay--Play-UI for the slot-per-route sibling."
artifact_kind: component
ownership: shell
mode: scroll-ui
status: shipped
shell_version_introduced: 0.1.0-rc.0
composes:
  - SlideRankPill
composed_by: []
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]]"
file: apps/deck-shell/src/components/DeckOverlay--Scroll-UI.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-15
date_last_updated: 2026-05-15
at_semantic_version: 0.0.1.0
status_tags:
  - Shipped
  - New-In-This-Pass
from: "dididecks-ai"
from_path: "context-v/sitemap/components/DeckOverlay--Scroll-UI.md"
---
# DeckOverlay--Scroll-UI

## Purpose

When a reader scrolls through a single-page deck variant (e.g. chroma's `/scroll/pitch/enhanced-v3/`), three (eventually four) affordances should ride along on top of the slides as a cohesive layer:

1. **Classifier pill** — tag the active slot with one of the enum statuses (Urgent / Could-be-better / Passable / Perfect / Pending). The component in the screenshot.
2. **Variant nav + counter** — cycle to a sibling variant, with the current `#s-N` anchor preserved. Phase 2; wired through the `ddd:section-changed` event contract `DeckChrome` already listens for.
3. **Presenter notes drawer** — Phase 3.
4. **Engagement telemetry beacons** — Phase D (password-gated public/share embeds emit pixels on slot visibility).

Before this overlay existed, those affordances were either separate top-level mounts on the consumer page (`<SlideRankPill>` alone) or non-existent. The overlay gives them one home and one toggle surface.

## Props

```ts
interface Props {
  deckSlug: string;
  variantSlug: string;
  /** Hide the classifier pill (e.g. for public/share-tier embeds). Default false. */
  hideClassifier?: boolean;
}
```

## Composition

Default composition (zero-config):

- `<slot name="classify">` defaults to `<SlideRankPill deckSlug variantSlug />`.

Empty slots ready for future fill:

- `<slot name="nav">` — for the Phase 2 variant-cycling DeckChrome variant.
- `<slot name="notes">` — Phase 3 presenter-notes drawer.
- `<slot name="telemetry">` — Phase D beacon component.
- Default `<slot />` — catch-all.

## Consumer usage

```astro
---
import DeckOverlay__ScrollUI from "@dididecks/shell/components/DeckOverlay--Scroll-UI.astro";
---
<PageAsDeckWrapper>{/* Phase 2; today: plain <main> */}
  <section data-slot="01" data-variant="enhanced-v3">…</section>
  <section data-slot="02" data-variant="enhanced-v3">…</section>
  …
  <DeckOverlay__ScrollUI deckSlug="pitch" variantSlug="enhanced-v3" />
</PageAsDeckWrapper>
```

The IntersectionObserver inside `SlideRankPill` discovers the active section from the `section[data-slot][data-variant]` tags — the overlay does not require Phase 2's `PageAsDeckWrapper` to function. PageAsDeckWrapper is the *additional* layer that broadcasts `ddd:section-changed` for cross-component coordination.

## Status

- ✅ Component exists at `apps/deck-shell/src/components/DeckOverlay--Scroll-UI.astro` as of 2026-05-15.
- ⚠️ Not yet adopted by chroma's enhanced-v3 scroll variant — chroma still mounts `<SlideRankPill>` directly. Migration is one-line at the chroma side.
- ⚠️ Not yet exported by name in the package exports map (the `./components/*` glob covers it, but a named export is cleaner).

## Open questions

- The `--` in the filename is intentional per founder naming preference. Astro+Vite handle it; verify it survives any future Rollup pass during package publish.
- Whether the Phase 2 variant-cycling nav reuses `DeckChrome` (rendered with `showVariantNav={true}`) or gets its own slimmer component is open. The overlay's `nav` slot is mode-agnostic; whichever lands fills it.

## Related

- [[DeckOverlay--Play-UI]] — sibling component for Play-mode routes.
- [[SlideRankPill]] — the default `classify` slot content; rename to `SlideClassifierPill` pending.
- [[DeckChrome]] — composed by the Play-UI sibling; may be reused here under Phase 2.
- [[../../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]] — origin of the in-scroll ranking pattern.
- [[../../plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]] — defines the chrome theming contract this overlay's children inherit.

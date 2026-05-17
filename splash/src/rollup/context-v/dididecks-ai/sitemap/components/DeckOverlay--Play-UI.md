---
title: "DeckOverlay--Play-UI — the floating overlay layer for Play-mode decks"
lede: "Single mount point for /play/[deck]/[variant]/[slot]/ that composes DeckChrome (paginator + slot-step nav + keyboard contract) and SlideRankPill (classifier) above the active slide, plus named slots for Phase 3 presenter notes and Phase D telemetry. Wraps the slide in a `<section data-slot data-variant>` so SlideRankPill's existing IntersectionObserver finds exactly one section — the play-mode adapter is the section-wrap itself, no special play-mode prop required. Sets `data-play-root` + `data-chrome-hidden` so DeckChrome's `C` keypress fades the whole overlay together."
artifact_kind: component
ownership: shell
mode: play-ui
status: shipped
shell_version_introduced: 0.1.0-rc.0
composes:
  - DeckChrome
  - SlideRankPill
composed_by: []
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety]]"
file: apps/deck-shell/src/components/DeckOverlay--Play-UI.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-15
date_last_updated: 2026-05-15
at_semantic_version: 0.0.1.0
status_tags:
  - Shipped
  - New-In-This-Pass
  - Closes-A-Plus-Plus-Gap-2
from: "dididecks-ai"
from_path: "context-v/sitemap/components/DeckOverlay--Play-UI.md"
---
# DeckOverlay--Play-UI

## Purpose

The Play-mode counterpart to `<DeckOverlay--Scroll-UI>`. Wraps a single slide rendered at `/play/[deck]/[variant]/[slot]/` and composes the persistent overlay affordances:

1. **DeckChrome** — paginator (`01 / 16 · Enhanced v2`), ← / → slot nav, TOC link, keyboard contract.
2. **Classifier pill** — same five-button enum as Scroll-UI; reads the current slot from the section-wrap.
3. **Presenter notes drawer** — Phase 3.
4. **Telemetry beacons** — Phase D.

Closes A++.2 (in-play ranking) without modifying `SlideRankPill`: the overlay's `<section data-slot data-variant>` wrap is the play-mode adapter the existing IntersectionObserver finds.

## Props

```ts
interface Props {
  // Slot identity — wraps the rendered slide in <section data-slot data-variant>
  deckSlug: string;
  variantSlug: string;
  slot: string;

  // DeckChrome (nav) props — passed straight through
  totalSlots: number;
  variantLabel: string;
  prevHref: string | null;
  nextHref: string | null;
  firstHref: string;
  lastHref: string;
  tocHref: string;
  prevVariantHref?: string | null;
  nextVariantHref?: string | null;
  variantCounter?: string;
  cycling?: boolean;
  showVariantNav?: boolean;
  showHelp?: boolean;
  enableKeyboard?: boolean;

  // Overlay-level toggles
  hideClassifier?: boolean;
  hideNav?: boolean;
}
```

## Composition

Default composition (zero-config):

- `<slot name="nav">` defaults to `<DeckChrome {...chromeProps} />`.
- `<slot name="classify">` defaults to `<SlideRankPill deckSlug variantSlug />`.
- Default `<slot />` is the rendered slide — wrapped automatically in `<section data-slot data-variant>` so the classifier's IO picks it up.

Empty slots:

- `<slot name="notes">` — Phase 3 presenter notes.
- `<slot name="telemetry">` — Phase D beacons.

## Wrapping discipline

- Sets `data-play-root` on its outer element. `DeckChrome`'s inline script uses `closest("[data-play-root]")` to find the root for the `C` chrome-toggle behavior — this overlay is therefore the canonical mounting context.
- Sets `data-chrome-hidden="false"` initially; the `C` keypress flips this to `"true"`, which descendant selectors on `DeckChrome` / `SlideRankPill` react to.
- The stage area (`.ddd-overlay__stage`) is flex-centered with `min-height: 100dvh` — placeholder containment until `SlideCanvas` + `ContentFit` land (A++.3 → A++.4).

## Consumer usage (target shape)

The `/play/[deckSlug]/[variantSlug]/[slot].astro` route is currently authored against the older flat layout. The target migration:

```astro
---
import DeckOverlay__PlayUI from "@dididecks/shell/components/DeckOverlay--Play-UI.astro";
const { deckSlug, variantSlug, slot } = Astro.params;
// …compute prevHref, nextHref, firstHref, lastHref, tocHref, Component…
---
<html lang="en"><body>
  <DeckOverlay__PlayUI
    deckSlug={deckSlug}
    variantSlug={variantSlug}
    slot={slot}
    totalSlots={SLOTS[variantSlug].length}
    variantLabel={variantLabel}
    prevHref={prevHref}
    nextHref={nextHref}
    firstHref={firstHref}
    lastHref={lastHref}
    tocHref={tocHref}
  >
    {Component ? <Component /> : <DecomposeFirstPlaceholder slot={slot} />}
  </DeckOverlay__PlayUI>
</body></html>
```

## Status

- ✅ Component exists at `apps/deck-shell/src/components/DeckOverlay--Play-UI.astro` as of 2026-05-15.
- ⚠️ `/play/[slot].astro` not yet refactored to consume the overlay — still uses inline chrome + DeckChrome composition. The overlay is built and ready; integration is the next pass.
- ⚠️ When integrated, `SlideRankPill` will mount inside Play for the first time. This closes A++.2.

## Open questions

- **Position conflict with DeckChrome.** Both DeckChrome and SlideRankPill default to fixed bottom-right. In Play mode, they'll overlap. Options: (a) move SlideRankPill to top-right when inside Play-UI (requires SlideRankPill to accept a position prop); (b) stack them as siblings in a corner cluster; (c) inline the classifier into DeckChrome's capsule as a sixth button group. Option (a) is the cleanest minimal change; pending decision.
- **`section[data-slot]` and SlideCanvas interaction.** Once A++.4 wraps slide content in `<SlideCanvas>`, the section-wrap stays outside the canvas (overlay sets it, canvas is its child). Verify IntersectionObserver still fires correctly on the section element.
- **Help overlay.** `showHelp` prop is plumbed but `DeckChrome`'s `?` button has no behavior yet.

## Related

- [[DeckOverlay--Scroll-UI]] — sibling for Scroll-mode pages.
- [[DeckChrome]] — composed in the `nav` slot.
- [[SlideRankPill]] — composed in the `classify` slot; rename to `SlideClassifierPill` pending.
- [[SlideCanvas]] — will wrap the default `<slot />` content under A++.4.
- [[../routes/play-slot]] — the route this overlay was built for.
- [[../../plans/Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety]] — origin of the in-play classifier gap (A++.2).
- [[../../plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]] — defines the chrome theming contract.

---
title: "PageAsDeckWrapper — Scroll-UI navigation primitive: scroll-snap + keyboard + section counter + reveal-on-intersect"
lede: "Wraps a series of `<section data-slot data-variant>` children in a scroll-snap deck. Delivers: vertical scroll-snap, the full keyboard contract (Arrow ↑/↓, PageUp/Down, Home, End, `c` chrome toggle, `f` fullscreen), double-click step, floating section indicator top-right (`NN / total`), `#s-N` hash navigation on load, IntersectionObserver-driven reveal animations for `.reveal-item` children, and the event protocol (dispatches `deck:section-changed`, listens for `deck:section-prev` / `deck:section-next` so DeckChrome buttons drive the same nav as keyboard / scroll). Lifted from `chroma-decks/src/layouts/PageAsDeckWrapper.astro` on 2026-06-06."
artifact_kind: component
ownership: shell
mode: scroll-ui
status: shipped
shell_version_introduced: 0.2.0
composes: []
composed_by:
  - ScrollDeckPage (bundled as the canonical Scroll-UI overlay)
  - "chroma-decks/src/layouts/PageAsDeckWrapper.astro (re-exports shell version via shim — same path as before)"
theming_tokens_consumed:
  - --ddd-scroll-pill-radius
  - --ddd-scroll-glass-bg
  - --ddd-scroll-glass-border
  - --ddd-scroll-text-muted
  - --ddd-scroll-text
  - --ddd-scroll-counter-radius
  - --ddd-scroll-font
  - --ddd-scroll-display
  - (fallback chain through --color-glass-bg, --color-border, --color-text-muted, --color-text, --font-body, --font-display, --radius)
props:
  - "enableScrollSnap?: boolean (default true)"
  - "showNavigationHints?: boolean (default true; auto-fade hint pill)"
  - "hintDuration?: number (default 2400 ms)"
plan_of_record: "[[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]]"
file: apps/deck-shell/src/components/PageAsDeckWrapper.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-06-06
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
  - Lifted-From-Chroma
from: "dididecks-ai"
from_path: "context-v/sitemap/components/PageAsDeckWrapper.md"
---
# PageAsDeckWrapper

## Behaviors delivered

- **Scroll-snap** — `scroll-snap-type: y mandatory` on the inner container; direct-child `<section>` children get `scroll-snap-align: start`
- **Keyboard** — Arrow ↑/↓, PageUp/Down, Home, End, `c` chrome toggle, `f` fullscreen
- **Double-click** — upper half of viewport → prev; lower half → next
- **Section counter** — floating top-right "NN / total"; updates via IntersectionObserver on scroll
- **Hash nav** — `#s-N` on load jumps to section index N
- **Reveal-on-intersect** — child `.reveal-item` elements fade-in when 15% intersecting

## Event protocol

- **Dispatches** `deck:section-changed` with `{index, total, isFirst, isLast}` on every section change (scroll-driven or programmatic). DeckChrome listens for this to update its prev/next button enabled state.
- **Listens for** `deck:section-prev` / `deck:section-next` — so DeckChrome's prev/next buttons fire the same nav code path as the keyboard.

This is the load-bearing seam that lets the chrome composite cleanly: navigation is single-source-of-truth even though click handlers and key handlers live in different components.

## Section discovery

Counts only direct top-level `<section>` children of `.ddd-deck-content` — decorative nested `<section>` elements inside slot content are deliberately excluded from the count (would over-count "17 / 24" when only 17 slots).

## CSS prefix discipline

Classes use `.ddd-*` prefix (e.g. `.ddd-deck-wrapper`, `.ddd-deck-content`, `.ddd-section-indicator`, `.ddd-nav-hint`). Chroma's old class names (`.deck-wrapper`, `.section-indicator`) — chroma now consumes via shim, so any chroma global CSS targeting old names is broken; re-target or use the `--ddd-scroll-*` tokens.

## Status

- ✅ Shipped — humain consumes via ScrollDeckPage; chroma consumes via local shim at `chroma-decks/src/layouts/PageAsDeckWrapper.astro` that re-exports the shell version

## Related

- [[ScrollDeckPage]] — bundles PageAsDeckWrapper as the canonical scroll-deck overlay
- [[DeckChrome]] — the floating chrome that uses the event protocol
- [[DeckOverlay--Scroll-UI]] — the overlay layer that sits on top of PageAsDeckWrapper
- [[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]]

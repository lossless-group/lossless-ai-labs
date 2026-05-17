---
title: "DeckChrome — themable floating navigation capsule for Play-UI (and eventually Scroll-UI variant cycling)"
lede: "Floating bottom-right capsule with paginator, ← / → slot nav, TOC link, optional ↑ ↓ variant cycling, and the full keyboard contract (← → Space PageUp/Down Home End F C T Esc). Replaces v0.1's heavy dark PlayChrome bar. Structure / behavior / styling are separated by discipline: structure is the Astro template, behavior is the inline keyboard script and `ddd:section-*` event dispatch, styling reads only `--ddd-chrome-*` CSS custom properties (neutral defaults inline; consumer overrides at any wrapping element). Lives inside `DeckOverlay--Play-UI` as the default `nav` slot today; will also serve as the variant-cycling element of `DeckOverlay--Scroll-UI` under Phase 2."
artifact_kind: component
ownership: shell
mode: play-ui
status: shipped
shell_version_introduced: 0.1.0-rc.0
composes: []
composed_by:
  - "DeckOverlay--Play-UI"
  - "PlayChrome (deprecated shim)"
theming_tokens_consumed:
  - --ddd-chrome-bg
  - --ddd-chrome-bg-hover
  - --ddd-chrome-backdrop
  - --ddd-chrome-border
  - --ddd-chrome-radius
  - --ddd-chrome-fg
  - --ddd-chrome-fg-strong
  - --ddd-chrome-fg-muted
  - --ddd-chrome-font
  - --ddd-chrome-font-mono
  - --ddd-chrome-size-counter
  - --ddd-chrome-size-button
  - --ddd-chrome-button-w
  - --ddd-chrome-button-h
  - --ddd-chrome-idle-opacity
  - --ddd-chrome-fade-ms
  - --ddd-chrome-z
  - --ddd-chrome-tooltip-bg
  - --ddd-chrome-tooltip-fg
  - --ddd-chrome-tooltip-radius
  - --ddd-chrome-tooltip-pad
  - --ddd-chrome-tooltip-fade-ms
plan_of_record: "[[../../plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]]"
file: apps/deck-shell/src/components/DeckChrome.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-14
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Themable
from: "dididecks-ai"
from_path: "context-v/sitemap/components/DeckChrome.md"
---
# DeckChrome

## Keyboard contract (preserved verbatim from v0.1 PlayChrome)

| Key | Action |
|---|---|
| ← / PageUp / Shift+Space | prev slot |
| → / PageDown / Space | next slot |
| Home | first slot |
| End | last slot |
| F | toggle fullscreen |
| C | toggle chrome visibility (sets `data-chrome-hidden` on closest `[data-play-root]`) |
| T | jump to TOC |
| Esc | exit fullscreen + restore chrome |

## Event contract

Listens for `ddd:section-changed` (`{index, isFirst, isLast, sectionId?}`) and updates `data-at-first` / `data-at-last` on its root — the boundary state that hides the irrelevant arrow at the first/last slot. Dispatched by Phase 2's `PageAsDeckWrapper` (not yet built).

Reserved dispatch names for when Scroll-UI variant cycling is wired through DeckChrome buttons: `ddd:section-prev` / `ddd:section-next`. Not emitted today (variant nav uses real `href`s).

## Theming namespace

Reads only `--ddd-chrome-*` custom properties. Neutral defaults inline; richer defaults at `apps/deck-shell/src/styles/themes/neutral.css`; per-client overrides go in `client-sites/<client>/src/styles/dididecks-chrome.css` (scoped via `data-deck-skin="<client>"`).

## Status

- ✅ Shipped at 470 LOC.
- ✅ `PlayChrome` is now a deprecated shim around it.
- ⚠️ Per-client override stylesheet for chroma (Restore plan Step 7) not yet authored.
- ⚠️ Sibling primitives from the same plan still missing: `DeckHeader`, `ModeToggleScrollPlay`, `ContentFit`.

## Composition

Default-composed by `DeckOverlay--Play-UI` as the `nav` slot.

The `/play/[slot].astro` route currently mounts `DeckChrome` directly; migration to `DeckOverlay--Play-UI` is the integration that closes A++.2 and adopts this composition.

## Related

- [[DeckOverlay--Play-UI]] — primary host.
- [[DeckOverlay--Scroll-UI]] — future host (Phase 2 variant cycling).
- [[../routes/play-slot]] — current direct consumer.
- [[../../plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]] — origin plan, full theming-token catalog.

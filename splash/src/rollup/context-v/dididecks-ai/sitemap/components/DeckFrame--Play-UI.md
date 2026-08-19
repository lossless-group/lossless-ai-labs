---
title: "DeckFrame--Play-UI — Play-UI chrome wrapper around SlideCanvas, plus the keyboard contract"
lede: "Play-UI's outer frame at `/play/[deck]/[variant]/[slot]/` — `<SlideCanvas>` plus the floating DeckChrome and document keyboard listener."
artifact_kind: component
ownership: shell
mode: play-ui
status: shipped
shell_version_introduced: 0.0.1
composes:
  - SlideCanvas
  - DeckChrome
composed_by:
  - "play-slot route (apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/[slot].astro)"
theming_tokens_consumed:
  - --color-background
  - --color-text
  - --ddd-chrome-bg
  - --ddd-chrome-fg
  - --ddd-chrome-border
plan_of_record: "[[../../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]]"
file: apps/deck-shell/src/components/DeckFrame--Play-UI.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-13
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
date_created: 2026-05-13
date_modified: 2026-06-07
publish: true
site_uuid: dc6b9036-8273-4f0c-97b3-018e7910affc
hex_code: 3yg3s5
date_authored_current_draft: 2026-05-13
from: "dididecks-ai"
from_path: "context-v/sitemap/components/DeckFrame--Play-UI.md"
---
# DeckFrame--Play-UI

## Purpose

The Play-UI chrome that surrounds a single slot's `SlideCanvas`. Renders the floating `DeckChrome` capsule at bottom-right + attaches the document keyboard listener.

## Keyboard contract (preserved verbatim from v0.1 PlayChrome)

- `←` / `PageUp` / `Shift+Space` → prev slot
- `→` / `PageDown` / `Space` → next slot
- `Home` → first slot
- `End` → last slot
- `F` → toggle fullscreen
- `C` → toggle chrome visibility
- `T` → jump to TOC
- `Esc` → exit fullscreen + restore chrome

## Composition

- Inside: `<SlideCanvas>` wrapping the per-slide play file at `src/components/slides/{variant}/{slot}-{slug}.astro`
- Floating: `<DeckChrome>` capsule (the calmstorm-elegant chrome, themable via `--ddd-chrome-*` tokens)

## Status

- ✅ Shipped — used by every play-slot route
- Symmetric pair: Scroll-UI now consolidates the equivalent chrome into `ScrollDeckPage` (which composes `ModeToggle + PageAsDeckWrapper + DeckOverlay--Scroll-UI`)

## Related

- [[SlideCanvas]] — the 16:9 stage component this frames
- [[DeckChrome]] — the floating capsule this hosts
- [[DeckOverlay--Play-UI]] — the layered overlay (SlideRankPill, etc.) above SlideCanvas
- [[ScrollDeckPage]] — the Scroll-UI sibling (single shell overlay for scroll decks)
- [[../routes/play-slot]]
- [[../../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]]

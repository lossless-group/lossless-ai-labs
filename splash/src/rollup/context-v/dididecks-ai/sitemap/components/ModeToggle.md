---
title: "ModeToggle — three-mode color-toggle (light → dark → vibrant) with per-client localStorage namespace"
lede: "Fixed top-right button that cycles light → dark → vibrant on click. Renders three SVG icons (sun / moon / star); CSS shows only the matching icon for the current `data-mode` on `<html>`. Inline-imports the `runtime/mode-switcher` factory and installs the singleton at mount with a `client` prop value used as the localStorage namespace (`{client}:mode`) so multiple decks deployed on the same domain don't collide on mode persistence. Lifted from `chroma-decks/src/components/basics/ModeToggle.astro` on 2026-06-06 as part of the chroma-to-shell promotion pass."
artifact_kind: component
ownership: shell
mode: both
status: shipped
shell_version_introduced: 0.2.0
composes:
  - "runtime/mode-switcher (inline import + createModeSwitcher call)"
composed_by:
  - ScrollDeckPage (default mount)
  - "chroma-decks/src/pages/index.astro (and chroma scroll pages via DeckOverlay--Scroll-UI? historically via direct mount)"
  - "humain-vc-decks/src/pages/index.astro (direct mount on landing)"
  - "humain-vc-decks/src/pages/scroll/pitch/*/index.astro (indirectly via ScrollDeckPage)"
theming_tokens_consumed:
  - --ddd-mode-toggle-top
  - --ddd-mode-toggle-right
  - --ddd-mode-toggle-size
  - --ddd-mode-toggle-radius
  - --ddd-mode-toggle-border
  - --ddd-mode-toggle-bg
  - --ddd-mode-toggle-fg
  - --ddd-mode-toggle-hover-fg
  - --ddd-mode-toggle-hover-border
  - --ddd-mode-toggle-hover-glow
  - (fallback chain to --color-background, --color-border, --color-text, --color-primary, --radius)
props:
  - "client: string (required) — per-client localStorage namespace"
  - "defaultMode?: 'light' | 'dark' | 'vibrant' (default 'light')"
  - "respectSystemPreference?: boolean (default false; opt-in to prefers-color-scheme)"
plan_of_record: "[[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]]"
file: apps/deck-shell/src/components/ModeToggle.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-06-06
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
  - Lifted-From-Chroma
from: "dididecks-ai"
from_path: "context-v/sitemap/components/ModeToggle.md"
---
# ModeToggle

## Three-mode contract

`light → dark → vibrant → light → …` on each click. The HTML element gets `data-mode="{current}"` attribute; theme.css redefines all Tier-2 + `--fx-*` tokens per `[data-mode="X"]` rule (the [`three-mode theme architecture`](../../../client-sites/humain-vc-decks/DESIGN.md) discipline).

## Per-client localStorage namespace

The `client` prop is required — it becomes the localStorage key prefix:

```
localStorage["humain-vc-decks:mode"] = "dark"
localStorage["chroma-decks:mode"] = "vibrant"
```

This prevents collisions when multiple decks deploy on overlapping domains (e.g. preview-deploys on `*.vercel.app`).

## ARIA / accessibility

- Button label updates dynamically to reflect current mode + the next mode click would cycle to ("Color mode: light. Click for dark.")
- All three SVGs are aria-hidden; the button itself carries the semantic label

## CSS prefix discipline

Classes use `.ddd-mode-toggle*` prefix (not `.chroma-mode-toggle` like the original). Any chroma CSS overrides targeting `.chroma-mode-toggle` no longer match — re-target to `.ddd-mode-toggle` OR override via the `--ddd-mode-toggle-*` token interface.

## Status

- ✅ Shipped — humain consumes; chroma migrated via shim re-export (`chroma-decks/src/components/basics/ModeToggle.astro` is now a 1-line re-export of the shell version)

## Related

- [[../runtime/mode-switcher]] — the TS factory that owns the state machine
- [[ScrollDeckPage]] — bundles ModeToggle as part of the canonical scroll-deck overlay
- [[../../models/Engagement-Telemetry-Data-Model]] — future home for mode-cycle events
- [[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]]
- [[../../agent-skills/theme-system/SKILL.md]] — three-mode architecture skill

---
title: "DeckStatsPanel — the 4-tile quick-stats row above the matrix on landing pages (Variants · Slide Files · People · Companies)"
lede: "Four-tile stats row above `DeckMatrix` — Variants, Slide Files, People, Companies — counted from the same globs `/data-assets/*` uses."
artifact_kind: component
ownership: shell
mode: n/a
status: shipped
shell_version_introduced: 0.0.1
composes: []
composed_by:
  - "chroma-decks/src/pages/index.astro"
  - "humain-vc-decks/src/pages/index.astro (wired this session, commit cc135bf)"
theming_tokens_consumed:
  - --ddd-stats-bg
  - --ddd-stats-surface
  - --ddd-stats-surface-hover
  - --ddd-stats-border
  - --ddd-stats-border-hover
  - --ddd-stats-fg
  - --ddd-stats-fg-muted
  - --ddd-stats-radius
  - (fallback chain to --color-background, --color-surface, --color-text, --color-border, --radius)
data_inputs:
  - DECKS registry (variant count + labels)
  - SLOTS registry (registered slot count per variant)
  - perSlideFileExists() (static-ported / authored slide files)
  - /data/**/(team|portfolio)/*.md glob (people count — role_class present)
  - /data/**/portfolio/*.md glob (company count — no role_class)
  - colocated headshot files glob (headshot count)
plan_of_record: "(no explicit plan — emerged from Calmstorm + chroma parity work; absorbed by lift-into-shell discipline)"
file: apps/deck-shell/src/components/DeckStatsPanel.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-15
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
date_created: 2026-05-15
date_modified: 2026-06-07
publish: true
site_uuid: a6a81047-8d66-4a70-b6f2-d185eee53c8f
hex_code: 4gn8y6
date_authored_current_draft: 2026-05-15
from: "dididecks-ai"
from_path: "context-v/sitemap/components/DeckStatsPanel.md"
---
# DeckStatsPanel

## Tile composition

| Tile | Count source | Links to |
|---|---|---|
| **Design Variants** | `DECKS[deckSlug].variants.length` | `/scroll/` |
| **Slide Files** | `perSlideFileExists` per (variant, slot) | per-variant scroll page (or `/play/{deck}/{variant}/` if any variant has play files) |
| **People** | `/data/**/{team,portfolio}/*.md` filtered to role_class set | `/data-assets/people` |
| **Companies** | `/data/**/portfolio/*.md` filtered to role_class unset | `/data-assets/companies` |

## Theming contract

Reads through `--ddd-stats-*` tokens with sensible fallback chain through consumer semantic tokens (`--color-background`, `--color-surface`, `--color-text`, `--color-border`, `--radius`). Consumer sites don't need to declare `--ddd-stats-*` — defaults look correct against any normal theme.

## Glob discipline (load-bearing)

Tile counts use the SAME globs the `/data-assets/*` audit routes use. This is by construction — tile numbers should always match what the audit pages render, with no opportunity for divergence. Don't introduce a separate `loadStatsCounts()` helper that uses different globs.

## Status

- ✅ Shipped — embedded on chroma's landing since rollout; humain wired this session

## Related

- [[../routes/data-assets-people]] — destination of the People tile
- [[../routes/data-assets-companies]] — destination of the Companies tile
- [[DeckMatrix]] — the matrix that sits below DeckStatsPanel on landings
- [[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]] — the lift discipline that brought it into the shell

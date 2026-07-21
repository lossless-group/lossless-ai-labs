---
title: "/data-assets/companies — reviewer audit of portfolio-company metadata + brand assets across every engagement layout"
lede: "Static reviewer audit page that globs every `<consumer>/data/**/portfolio/*.md` and renders one row per portfolio company — name, slug, sector, homepage, the colocated trademark + favicon previews, confidence/status pills, and links into upstream sources. Companies are distinguished from People (which also live under `portfolio/`) by the *absence* of a `role_class` frontmatter field. Adapts to all three known data layouts: calmstorm's `data/firms/{firm}/portfolio/`, chroma's `data/investors/{firm}/portfolio/`, and humain's flat `data/portfolio/` operating-company variant. SSR'd (`prerender = false`) so it routes through the consumer's auth middleware — protects portfolio graphs from being public-by-accident."
artifact_kind: route
ownership: shell
mode: n/a
status: shipped
shell_version_introduced: 0.0.1
route_pattern: "/data-assets/companies"
prerender: false
discovery_glob: "/data/**/portfolio/*.md (rows where frontmatter.role_class is NOT set)"
asset_discovery_glob: "/data/**/portfolio/*.{png,jpg,jpeg,webp,avif,svg,ico}"
composes: []
composed_by:
  - DeckStatsPanel (the "Companies" tile links here)
theming_tokens_consumed:
  - --color-background
  - --color-surface
  - --color-text
  - --color-text-muted
  - --color-border
plan_of_record: "[[../../plans/Refactor-Data-Assets-Audit-for-Brand-Quality-Ratings-and-Render-Guards]]"
file: apps/deck-shell/src/routes/data-assets/companies.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-17
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
  - SSR-gated
related_models:
  - "[[../../models/Company-Data-Model]]"
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/data-assets-companies.md"
---
# /data-assets/companies

## Data flow

- Build-/request-time globs `<consumer>/data/**/portfolio/*.md` via `import.meta.glob({eager: true, query: "?raw", import: "default"})`
- Parses frontmatter; filters to rows where `role_class` is unset (Persons are the inverse filter — see [`data-assets-people`](./data-assets-people.md))
- Parallel asset glob `*.{png,jpg,jpeg,webp,avif,svg,ico}` colocated with each `.md` discovers the row's `trademark__` / `favicon__` files
- Renders one table row per company with: slug, name, homepage (link), sector, brand-asset previews (trademark + favicon), confidence pill, status pill, source-URLs row

## Render guards

- `prerender = false` — every request goes through the consumer's auth middleware. Audit pages contain portfolio graphs that should stay private. (Patched at the shell tier per the [`Refactor-Data-Assets-Audit-for-Brand-Quality-Ratings-and-Render-Guards`](../../plans/Refactor-Data-Assets-Audit-for-Brand-Quality-Ratings-and-Render-Guards.md) plan.)
- No CSS overflow trap on `.table-wrap` (a prior version trapped sticky table headers; one-line fix dropped the overflow). On narrow viewports the table pushes the page horizontally instead.

## Layout compatibility

| Consumer layout | Glob result |
|---|---|
| `data/firms/{firm}/portfolio/` (calmstorm) | matched |
| `data/investors/{firm}/portfolio/` (chroma) | matched |
| `data/portfolio/` (humain flat operating-company variant) | matched |

Identical render path; only the firm-grouping in the table varies.

## Status

- ✅ Shipped
- ✅ SSR-gated 2026-05-17
- ✅ Sticky-header trap fixed 2026-05-17

## Related

- [[data-assets-people]] — sibling route over `data/**/{team,portfolio}/` filtered to `role_class != null`
- [[../components/DeckStatsPanel]] — landing-page tile that links here
- [[../components/DeckMatrix]] — landing matrix that surfaces the same data in audit-rating form
- [[../../models/Company-Data-Model]] — full schema documentation
- [[../../plans/Refactor-Data-Assets-Audit-for-Brand-Quality-Ratings-and-Render-Guards]]

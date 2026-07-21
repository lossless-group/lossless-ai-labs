---
title: "/data-assets/people — reviewer audit of team / advisor / portco-ceo metadata + headshots across every engagement layout"
lede: "Static reviewer audit page that globs every `<consumer>/data/**/{team,portfolio}/*.md` and renders one row per person — name, slug, role_class, title, org, link chips (LinkedIn / Twitter / website), the colocated headshot preview, bio_short, confidence + status pills. People are distinguished from Companies (which also live under `portfolio/`) by the *presence* of a `role_class` frontmatter field. Adapts to all three known data layouts (calmstorm's `data/firms/{firm}/team/`, chroma's `data/investors/{firm}/team/` + flat `data/team/`, humain's flat `data/team/` + `data/portfolio/{co-slug}-ceo.md`). SSR'd (`prerender = false`) for auth gating."
artifact_kind: route
ownership: shell
mode: n/a
status: shipped
shell_version_introduced: 0.0.1
route_pattern: "/data-assets/people"
prerender: false
discovery_glob: "/data/**/{team,portfolio}/*.md (rows where frontmatter.role_class IS set)"
asset_discovery_glob: "/data/**/{team,portfolio}/*.{png,jpg,jpeg,webp,avif,svg}"
composes: []
composed_by:
  - DeckStatsPanel (the "People" tile links here)
theming_tokens_consumed:
  - --color-background
  - --color-surface
  - --color-text
  - --color-text-muted
  - --color-border
plan_of_record: "[[../../plans/Refactor-Data-Assets-Audit-for-Brand-Quality-Ratings-and-Render-Guards]]"
file: apps/deck-shell/src/routes/data-assets/people.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-17
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
  - SSR-gated
related_models:
  - "[[../../models/Person-Data-Model]]"
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/data-assets-people.md"
---
# /data-assets/people

## Data flow

- Build-/request-time globs `<consumer>/data/**/{team,portfolio}/*.md`
- Filter: rows where `frontmatter.role_class` is set (companies are the inverse — see [`data-assets-companies`](./data-assets-companies.md))
- Reads the canonical set of fields: `name · slug · role_class · title · org · deck_role_label · linkedin · twitter · github · website · headshot · headshot_source_url · firm_slug · company_slug · bio_short · status · confidence`
- Colocated headshot files discovered via parallel asset glob; rendered as small preview thumbnail per row

## role_class groupings (table sections)

The table sections rows by `role_class` — first the firm's own team (`managing-partner`, `vc-team`, `venture-partner`), then advisors/external (`advisor`, `external`), then portfolio-company CEOs (`portco-ceo`). Identifiable by the colored tag column.

## Render guards

- `prerender = false` (same rationale as `/data-assets/companies` — headshots + bios should ride the auth gate)
- Gracefully handles older calmstorm-shape frontmatter (`profiles[]` nested vs flat `linkedin`) — reads both, but the table column renders the flat-string fields preferentially

## Status

- ✅ Shipped
- ✅ SSR-gated 2026-05-17

## Related

- [[data-assets-companies]] — sibling route
- [[../components/DeckStatsPanel]] — landing-page tile that links here
- [[../../models/Person-Data-Model]] — full schema documentation
- [[../../plans/Refactor-Data-Assets-Audit-for-Brand-Quality-Ratings-and-Render-Guards]]

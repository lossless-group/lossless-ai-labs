---
title: "/toc/[deckSlug]/[variantSlug]/ — bird's-eye-view audit dashboard with rank pills + scaffold buttons"
lede: "Per-variant TOC — one row per slot with five rank pills and a scaffold button POSTing to `/api/slide-decompose`. Read-write in dev only."
artifact_kind: route
ownership: shell
mode: n/a
status: shipped
shell_version_introduced: 0.0.1
route_pattern: "/toc/[deckSlug]/[variantSlug]/"
emits_for: "every (deck, variant) in DECKS registry"
composes:
  - DididecksNav
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]]"
file: apps/deck-shell/src/routes/toc.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-12
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Iteration-Pending
date_created: 2026-05-12
date_modified: 2026-05-15
publish: true
site_uuid: e3622bb4-4aec-49c7-b551-176817435a3b
hex_code: s3dmcm
date_authored_current_draft: 2026-05-12
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/toc.md"
---
# /toc/[deckSlug]/[variantSlug]/

## Data flow

- `getStaticPaths` enumerates every `(deck, variant)` from the deck registry.
- Render-time reads `SLOTS[variantSlug]` for rows and the audit registry for current ranks.
- Each row's `[view →]` link is conditional on `perSlideFileExists(...)`.

## What needs iteration (founder note 4 from A+ smoke-test)

Unspecified. Founder will supply pointers next session. Likely candidates:
- Re-skin to match `DeckChrome`'s themable namespace.
- Surface decompose-stub state more clearly (icon? row tint? scaffolded-but-empty vs. scaffolded-and-populated?).
- `?focus={slot}` query param wired by `DecomposeFirstPlaceholder` should auto-scroll to that row and highlight it.

## Status

- ✅ Shipped Phase A; A+ added `[view →]` links.
- ⚠️ Cosmetic iteration outstanding.

## Related

- [[../components/DididecksNav]]
- [[api-slide-rank]], [[api-slide-decompose]]
- [[play-slot]] — destination of `[view →]` links.
- [[../../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]] — origin plan.

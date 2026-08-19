---
title: "/play/[deckSlug]/[variantSlug]/ — variant-index redirect to slot 01"
lede: "Enumerates every (deck, variant) and 302s to slot 01 — unconditionally today, so slot-less variants like chroma's proto land on a 404."
artifact_kind: route
ownership: shell
mode: play-ui
status: partial
shell_version_introduced: 0.1.0-rc.0
route_pattern: "/play/[deckSlug]/[variantSlug]/"
emits_for: "every (deck, variant) in DECKS registry"
composes: []
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety]]"
file: apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/index.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-12
date_last_updated: 2026-05-15
at_semantic_version: 0.0.1
status_tags:
  - Partial
  - Closes-A-Plus-Plus-Gap-1-When-Fixed
date_created: 2026-05-12
date_modified: 2026-05-15
publish: true
site_uuid: ae39fef9-e914-4e80-b1db-26f93af50e64
hex_code: fol4vb
date_authored_current_draft: 2026-05-12
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/play-index.md"
---
# /play/[deckSlug]/[variantSlug]/

## Current behavior

```
GET /play/pitch/enhanced-v3/   → 302 /play/pitch/enhanced-v3/01/   (works)
GET /play/pitch/proto/         → 302 /play/pitch/proto/01/         → 404
```

## Target behavior (A++.1)

```
GET /play/pitch/proto/         → 200 "no slots yet" page (SLOTS[proto] empty)
GET /play/pitch/enhanced-v3/   → 302 /play/pitch/enhanced-v3/01/   (unchanged)
```

## Status

- ✅ Redirect path works for variants with slots.
- ⚠️ A++.1 gate not yet implemented — proto / v1 / v2 still 404 after the redirect.

## Related

- [[play-slot]] — the redirect target.
- [[../../plans/Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety]] — A++.1 closes this.

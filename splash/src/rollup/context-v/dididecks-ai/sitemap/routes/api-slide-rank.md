---
title: "/api/slide-rank — read + write per-slide classifier state into the consumer's audits file"
lede: "Dev-only API route (`prerender = false`) that reads + writes the audit registry at the consumer's `data/audits/slides.json` (default path; configurable via the integration options). GET returns the full ranks map; POST upserts a single `{deckSlug, variantSlug, slot, status}` entry with `rankedAt` ISO timestamp + `rankedBy: 'founder'`. Status `'pending'` is the implicit default — never persisted; a POST with `status === 'pending'` deletes the existing entry. Fails-soft in production static builds (the route doesn't exist there, both GET and POST 404 — SlideRankPill catches and degrades to read-only)."
artifact_kind: route
ownership: shell
mode: n/a
status: shipped
shell_version_introduced: 0.0.1
route_pattern: "/api/slide-rank"
prerender: false
storage_file: "<consumer>/data/audits/slides.json (configurable)"
storage_schema_version: 1
composes: []
consumed_by:
  - SlideRankPill (GET on mount, POST on click)
  - /toc route (build-time read via loadAuditRegistry)
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]]"
file: apps/deck-shell/src/routes/api/slide-rank.ts
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-12
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Dev-Only
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/api-slide-rank.md"
---
# /api/slide-rank

## Storage shape (schema 1)

```json
{
  "schema": 1,
  "ranks": {
    "<deckSlug>/<variantSlug>/<slot>": {
      "status": "urgent-redo" | "non-urgent-could-be-better" | "passable" | "perfect",
      "rankedAt": "<ISO-8601>",
      "rankedBy": "founder",
      "notes": null
    }
  }
}
```

Composite key `deckSlug/variantSlug/slot` via `buildRankKey()` so cross-deck rank data lives in one file per consumer.

## Status

- ✅ Dev-only POST + GET working.
- ⚠️ Per-client database (V2) is a Phase D concern — public/share-tier ranks need real persistence, auth, telemetry. Today everything is local-dev only.

## Related

- [[../components/SlideRankPill]] — primary consumer.
- [[toc]] — build-time reader.
- [[api-slide-decompose]] — sibling write-API.

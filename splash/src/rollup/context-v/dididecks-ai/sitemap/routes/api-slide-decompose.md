---
title: "/api/slide-decompose — non-destructive stub generator for the Phase 1 → Phase 2 transition"
lede: "Dev-only route that writes an empty per-slide stub and refuses to overwrite — 409 if the file exists. Static Vercel builds never carry it."
artifact_kind: route
ownership: shell
mode: n/a
status: shipped
shell_version_introduced: 0.0.1
route_pattern: "/api/slide-decompose"
prerender: false
mutates_files: true
mutation_target: "<consumer>/src/components/slides/<variant>/<slot>-<slug>.astro"
composes: []
consumed_by:
  - "/toc route scaffold buttons"
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]]"
file: apps/deck-shell/src/routes/api/slide-decompose.ts
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-12
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Dev-Only
  - Non-Destructive
date_created: 2026-05-12
date_modified: 2026-05-15
publish: true
site_uuid: ad3a1f82-6942-4ed7-8e23-602dec12d20c
hex_code: x5firz
date_authored_current_draft: 2026-05-12
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/api-slide-decompose.md"
---
# /api/slide-decompose

## Workflow position

This endpoint is the **Phase 1 → Phase 2 bridge** in the deck-iteration-workflow skill:

1. Phase 1 — the scroll-deck variant exists as a single long page.
2. The founder ranks slots in-place (via SlideRankPill) or on the TOC.
3. Click **scaffold** on a slot. This route fires. An empty stub appears at the per-slide path.
4. Phase 2 — the founder recreates the slot's content into the stub at component-library quality. The single-page variant continues rendering unchanged.

The "recreate, don't extract" discipline is encoded in the stub's header comment.

## Safety

- Refuses to overwrite (`409 Conflict` on existing files).
- Validates the slot is in `SLOTS[variantSlug]` before writing.
- Static builds never include this route — file mutations are dev-loop only.

## Related

- [[../components/SlideRankPill]] — surfaces the workflow that produces decompose requests.
- [[toc]] — scaffold buttons.
- [[../components/DecomposeFirstPlaceholder]] — fallback rendered when a slot exists in SLOTS but no per-slide file exists yet (i.e. decompose hasn't been run).
- [[api-slide-rank]] — sibling read/write API.

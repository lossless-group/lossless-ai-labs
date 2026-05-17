---
title: "/dev/icons — recurring design-review workbench"
lede: "Originally a one-off Phase 4 review surface for the dual-surface icon pair on the TOC redesign. Founder picked Pair B 'Frameless glyphs' on 2026-05-17; rather than delete the route, the pattern was kept: a single /dev/* page per project that renders every candidate for a visual-primitive decision side-by-side at multiple sizes, on multiple backgrounds, inside the real composed context (chip-next-to-icon, drift case, missing-file dimmed case). Alternates live one directory deeper at `apps/deck-shell/src/components/icons/alternates/` and remain importable so the design history stays legible. Future icon families, chip variants, badge styles, button states extend this route with additional sections rather than spawning a new /dev/* route per decision."
artifact_kind: route
ownership: shell
mode: utility
status: shipped
shell_version_introduced: 0.1.0-rc.0
route_pattern: "/dev/icons"
emits_for: "single static page"
composes:
  - "[[../components/ScrollIcon]]"
  - "[[../components/PlayIcon]]"
  - "alternates/ScrollIcon-A.astro"
  - "alternates/PlayIcon-A.astro"
  - "alternates/ScrollIcon-C.astro"
  - "alternates/PlayIcon-C.astro"
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Redesign-TOC-as-Deck-Level-Dual-Surface-Review-Matrix]]"
file: apps/deck-shell/src/routes/dev/icons.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-17
date_last_updated: 2026-05-17
at_semantic_version: 0.0.1
status_tags:
  - Shipped
  - Design-Review-Workbench
  - Project-Local-Discipline
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/dev-icons.md"
---
# /dev/icons

## Current behavior

```
GET /dev/icons   → 200, renders:
                     - "Canonical" section: the chosen icon pair at 16/24/32/48px
                       on light, dark, and brand-tinted backgrounds, with a
                       composed-cell strip showing matrix-cell context
                       (no-drift / drift / pending cases)
                     - "Alternates · design history" section: every unchosen
                       candidate, dimmed, with the same swatches but no
                       composed-cell strip
                     - About-this-route footer explaining the pattern
```

`noindex,nofollow` meta. Not linked from anywhere — discoverable by typed URL only.

## Why the route is kept

The Phase 4 work could have ended with "founder picks B → delete A and C and the review route." It didn't, by deliberate choice, because the **pattern** generalizes:

- Every future icon family, chip variant, badge style, or button-state set faces the same problem: render candidates in isolation, candidates lie. Render them inside the real composed UI context they'll live in, and the right pick falls out.
- The discipline of "preserve unchosen candidates as design history in `alternates/` directories, importable but not used in production" keeps the decision context legible to anyone reading the codebase cold.
- A single project-local `/dev/*` route that aggregates these reviews is cheaper than a new route per decision and easier for the founder to navigate.

This is project-local discipline today. If the pattern proves useful in a second project (memopop-ai, another dididecks consumer), it graduates to a cross-project skill in `lossless-skills`. See the question deferred from 2026-05-17.

## Related discipline

- **`maintain-design-md` skill** — the sibling pattern for *documenting chosen* design tokens. DESIGN.md is the contract; `/dev/icons` is the workbench where it gets decided.
- **`theme-system` skill** — two-tier tokens + three-mode contract; orthogonal to icon choices but relevant to chip palettes.
- **The `context-v/sitemap/` discipline** — this file is one of those mini-specs. Routes that exist for discipline-reasons (not user-reasons) belong here so they survive future status sweeps without being mistaken for stale.

## Open

- **Pattern promotion to skill.** Deferred 2026-05-17 — revisit when a second consumer or a second design-decision wave validates the pattern.
- **DESIGN.md for dididecks-ai.** Deferred 2026-05-17 — chroma is the only consumer; theming hasn't been stress-tested. Wait for a second client engagement to surface what actually wants to vary before locking the contract.

## Plan of record

[[../../plans/Redesign-TOC-as-Deck-Level-Dual-Surface-Review-Matrix]] §D + Phase 4.

---
title: "SlideRankPill — floating five-button classifier for the active slot (rename pending → SlideClassifierPill)"
lede: "Bottom-right floating pill that shows the active slot's number + title and exposes five enum buttons — Urgent / Could-be-better / Passable / Perfect / Pending. In Scroll-UI it discovers the active slot via IntersectionObserver over `section[data-slot][data-variant]` tags; in Play-UI the DeckOverlay--Play-UI wraps the slide in such a section so exactly one is in view. Hydrates ranks from `GET /api/slide-rank` on mount, posts optimistically on click, fails-soft in production builds. Rename to `SlideClassifierPill` is queued — 'classify' matches the cognitive act more accurately than 'rank' (the enum is a finite tag set, not an ordering)."
artifact_kind: component
ownership: shell
mode: both
status: shipped
shell_version_introduced: 0.1.0-rc.0
composes: []
composed_by:
  - "DeckOverlay--Scroll-UI"
  - "DeckOverlay--Play-UI"
theming_tokens_consumed:
  - --color-border
  - --color-surface
  - --color-background
  - --color-text
  - --color-text-muted
  - --color-accent-1
plan_of_record: "[[../../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]]"
file: apps/deck-shell/src/components/SlideRankPill.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-12
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Rename-Pending
from: "dididecks-ai"
from_path: "context-v/sitemap/components/SlideRankPill.md"
---
# SlideRankPill (→ SlideClassifierPill, rename pending)

## Purpose

The in-place classifier the founder uses while reading her own deck. Instead of leaving the scroll page for the TOC every time she wants to tag a slot's status, the pill tracks her scroll position and offers the same five-enum control inline.

## Enum

| Button | `data-status` value | Meaning |
|---|---|---|
| U | `urgent-redo` | Urgent — redo before next pass |
| C | `non-urgent-could-be-better` | Could be better, not urgent |
| P | `passable` | Passable as-is |
| ★ | `perfect` | Perfect / ship as-is |
| – | `pending` | Clear rank (back to unranked) |

Same enum the TOC ranking surface uses; same `/api/slide-rank` payload.

## API contract

- **Mount**: `GET /api/slide-rank` — fetches the entire ranks map, filters to `${deckSlug}/${variantSlug}/` keys, hydrates local cache.
- **Click**: `POST /api/slide-rank` with `{deckSlug, variantSlug, slot, status}`. Optimistic update first; revert on non-2xx.
- **Production**: both calls fail-soft. The pill renders read-only with whatever was build-time-injected (today: nothing — see open questions).

## Status

- ✅ Shipped in Phase A+ for Scroll-UI use.
- ✅ Now also reachable from Play-UI via `DeckOverlay--Play-UI`'s section-wrap (no code change to this component — A++.2 closes the gap structurally).

## Naming-rename plan

`SlideRankPill` → `SlideClassifierPill`. Reason: the enum is unordered (Perfect is not "more ranked" than Passable — they're parallel classifications). "Classifier" matches the founder's cognitive act. The rename is queued for the next API-stable pass; no behavioral change.

## Theming drift

This component reads `--color-*` tokens, not the `--ddd-chrome-*` namespace defined under the Restore-Calmstorm-Nav-Elegance plan. Pending retoken pass to align with the namespace so a single `data-deck-skin` attribute re-skins everything overlay-related uniformly.

## Open questions

- **Production behavior.** Pill currently renders in static builds; fails-soft on API calls. Open: hide entirely under `import.meta.env.PROD`, or keep visible as a read-only display? Phase A+ Open Question #1, still unresolved.
- **Play-mode positioning conflict with DeckChrome.** Both default to fixed bottom-right. See `DeckOverlay--Play-UI` open question.

## Related

- [[DeckOverlay--Scroll-UI]] — default composition target.
- [[DeckOverlay--Play-UI]] — default composition target via section-wrap.
- [[../routes/api-slide-rank]] — the API endpoint.
- [[../../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]] — origin plan.
- [[../../plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]] — theming-namespace target.

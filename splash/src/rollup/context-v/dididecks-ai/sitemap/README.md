---
title: "Sitemap — Living Map of the DidiDecks Universal-Frontend-over-Client-Decks Architecture"
lede: "A living mini-spec per artifact (route, component, per-slide component) across the dididecks-ai shell and its client-site consumers. Splits across two levels: this directory describes the *universal* shell artifacts inherited by every client deck; per-client overrides and consumer-authored artifacts live in each `client-sites/<client>/context-v/sitemap/`. Each entry is short, kept up-to-date with the running code, and cross-linked so an agent reading any one file can trace composition, theming inheritance, and the plan-of-record that produced it."
date_authored_initial_draft: 2026-05-15
date_authored_current_draft: 2026-05-15
date_last_updated: 2026-05-15
at_semantic_version: 0.0.1.0
status: Draft
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Sitemap-Index
tags:
  - Sitemap
  - Living-Map
  - Shell-vs-Consumer
  - Scroll-UI-and-Play-UI
  - Component-Registry
authors:
  - Michael Staton
from: "dididecks-ai"
from_path: "context-v/sitemap/README.md"
---
# Sitemap — Universal Shell Layer

## What this directory is

A **living map** of every artifact in `@dididecks/shell`. One mini-spec per file. Routes go in `routes/`, components in `components/`. Each entry is short on purpose — long enough that an agent (or a human) can answer "what does this thing do, what does it compose, and where did it come from" in under a minute, no longer.

This is the **universal layer**. Every client deck under `client-sites/*` inherits these artifacts unchanged. Per-client overrides and consumer-authored pages/components live in `client-sites/<client>/context-v/sitemap/`.

## Naming-is-fuzzy note — Scroll-UI vs. Play-UI

DidiDecks' proprietary process maintains **two coordinated implementations** of every deck — NOT two views of the same content. They are different components with different constraints, deliberately coupled only by slot identity:

- **Scroll-UI slide** — a **section component** inside one long `/scroll/{deck}/{variant}/index.astro` page. Responsive CSS, vertical reading, JS / animations allowed. The surface Claude (and humans) design **in**, because responsive sections come naturally.
- **Play-UI slide** — a **standalone component file** at `<consumer>/src/components/slides/{variant}/{slot}-{slug}.astro`. Rigid 16:9 at 1920×1080 design size. **No responsive CSS. No JS.** Static HTML/CSS only, so it letterboxes cleanly and PDF-exports without runtime hydration. The surface Claude is **bad at** — rigid-aspect / no-responsive / no-JS is unfamiliar territory.

The workflow this implies: **design in Scroll-UI first, then convert each section into its Play-UI counterpart.** The conversion is non-trivial — "recreate, don't extract" is the discipline encoded in `/api/slide-decompose`. This is Phase 1 → Phase 2 of the deck-iteration-workflow.

Practical consequence for this sitemap: a deck **has** Play-UI only when its per-slide files exist. The presence of a `/scroll/` route does **not** imply `/play/` is renderable. Mini-specs for `routes/play-slot.md` and `components/SlideCanvas.md` reflect this; consumer-side sitemaps under `client-sites/*/context-v/sitemap/` should annotate which slot files exist (status `shipped` vs `stub` vs `planned`).

Several **overlay** components ship in paired variants — most prominently `<DeckOverlay--Scroll-UI>` and `<DeckOverlay--Play-UI>` — because the overlay *surfaces* differ even though both wrap the same conceptual slot. The `--Scroll-UI` / `--Play-UI` suffix is part of the public name; the two variants are sibling files, not props on one file. The slides themselves are not paired in this way — they are unrelated files coordinated only by slot identity.

Glossary:
- **slide** = one slot's worth of content (one section or one standalone file).
- **variant** = an ordered set of slides (e.g. `enhanced-v3`).
- **deck** = a variant as rendered in whichever UI mode the reader is in.

## Directory shape

```
context-v/sitemap/
├── README.md                  ← this file
├── routes/                    ← shell-injected routes
│   ├── toc.md
│   ├── play-index.md
│   ├── play-slot.md
│   ├── api-slide-rank.md
│   ├── api-slide-decompose.md
│   └── dev-icons.md           ← design-review workbench (kept by deliberate discipline)
└── components/                ← shell-exported components
    ├── DeckOverlay--Scroll-UI.md
    ├── DeckOverlay--Play-UI.md
    ├── DeckChrome.md
    ├── SlideRankPill.md       ← rename pending → SlideClassifierPill
    ├── SlideCanvas.md
    ├── DididecksNav.md
    └── DecomposeFirstPlaceholder.md
```

## Frontmatter conventions (mini-spec entries)

Every artifact mini-spec uses this shape:

```yaml
---
title: <component or route name + one-line purpose>
lede: <one paragraph that an agent can lift verbatim into a plan>
artifact_kind: route | component | per-slide-component
ownership: shell | consumer
mode: scroll-ui | play-ui | both | n/a
status: shipped | partial | planned | deprecated
shell_version_introduced: 0.1.0-rc.0
composes: [list of other artifacts this one mounts or wraps]
composed_by: [list of artifacts that mount or wrap this one]
theming_tokens_consumed: [--ddd-chrome-bg, --ddd-chrome-fg, ...]
plan_of_record: [[../../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]]
file: apps/deck-shell/src/components/DeckChrome.astro
authors: [Michael Staton]
date_last_updated: YYYY-MM-DD
---
```

The `composes` / `composed_by` fields are the load-bearing ones — together they form the **composition graph** the agent walks when answering "what changes if I touch X."

## How to keep this alive

- When a new artifact is added to the shell, **add its mini-spec in the same commit**. The author of the artifact is the author of its spec.
- When an artifact is renamed, deprecated, or removed, **update the spec same-commit**.
- When composition changes (a component starts mounting another), **update the `composes` / `composed_by` graph**.
- This is *not* a wholesale autogenerated registry. Mini-specs include intent, naming reasoning, and history that source code does not encode. Don't auto-generate; author.

## Per-client sitemap entries

Each `client-sites/<client>/context-v/sitemap/` carries:

- `routes/` — consumer-authored routes (homepage, `/scroll/*`, `/changelog`, etc.)
- `slides/<variant>/<slot>-<slug>.md` — one mini-spec per per-slide component, with frontmatter field `injects_into_shell_slot` that points back at this directory's `routes/play-slot.md`.

When a new client deck is spun up, the new client's sitemap starts empty except for its consumer-authored routes. The shell sitemap is referenced by wikilink, not copied.

## Related

- [[../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]] — Phase A.
- [[../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]] — Phase A+.
- [[../plans/Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety]] — Phase A++.
- [[../plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]] — themable chrome.
- [[../explorations/Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] — architecture exploration.
- [[../explorations/Plans-Inventory-and-Phase-A-Outcome]] — phase-A retrospective.

---
title: "Sitemap — chroma-decks consumer-side artifacts (routes the client deck authors, plus per-slide components)"
lede: "Living map of artifacts authored *inside* chroma-decks — pages the client owns (homepage, /scroll/* routes, /changelog) and per-slide components that fill the shell's /play slots. Universal shell artifacts (DeckOverlay, DeckChrome, SlideRankPill, /toc, /play, /api/*) are NOT specced here — they live in `ai-labs/dididecks-ai/context-v/sitemap/` and are referenced by wikilink. When a new client deck spins up, that client's sitemap starts mostly empty; the shell sitemap is inherited."
date_authored_initial_draft: 2026-05-15
date_authored_current_draft: 2026-05-15
date_last_updated: 2026-05-15
at_semantic_version: 0.0.1.0
status: Draft
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Sitemap-Index
tags:
  - Sitemap
  - Consumer-Side
  - Chroma-Decks
  - Per-Slide-Components
authors:
  - Michael Staton
from: "dididecks-ai/chroma-decks"
from_path: "context-v/sitemap/README.md"
---
# Sitemap — chroma-decks (consumer layer)

## What this directory is

The consumer-side half of the DidiDecks sitemap convention. The shell-side half lives at `ai-labs/dididecks-ai/context-v/sitemap/` and is inherited unchanged; this directory captures only what chroma authors itself.

## Naming-is-fuzzy reminder

See `../../../../CLAUDE.md` "Naming is fuzzy here — Scroll-UI vs. Play-UI". Short version: Scroll-UI slides and Play-UI slides are **different files with different constraints**, not two views of the same content. Chroma authors:

- **Scroll-UI sections** inline in `src/pages/scroll/pitch/{variant}/index.astro` — responsive CSS, vertical reading, JS allowed.
- **Play-UI standalone files** at `src/components/slides/{variant}/{slot}-{slug}.astro` — rigid 16:9, no responsive CSS, no JS, designed for letterboxed presentation.

The Play-UI counterparts are written by **recreating** each scroll-section into its rigid play form, not by extracting. Coordination between the two is by slot identity (`pitch/enhanced-v3/05` is the same conceptual slot in both). A deck **has** Play-UI only insofar as its per-slide files exist; today only `enhanced-v3` has any (and only slots 01 + 15 are fully recreated; slot 05 is a decompose-stub).

## Directory shape

```
context-v/sitemap/
├── README.md                       ← this file
├── routes/                         ← consumer-authored pages
│   ├── homepage.md
│   ├── scroll-index.md
│   ├── scroll-pitch-index.md
│   ├── scroll-pitch-enhanced-v3.md
│   ├── scroll-pitch-enhanced-v2.md
│   ├── scroll-pitch-enhanced-v1.md
│   ├── scroll-pitch-proto.md
│   └── play-chooser.md             ← the consumer-side /play/index.astro
└── slides/                         ← per-slide components consumed by /play/[slot]
    └── enhanced-v3/
        ├── 01-cover.md
        ├── 05-bottleneck.md        ← decompose-stub only
        └── 15-ask.md
```

## Frontmatter shape — per-slide entries

```yaml
---
title: <slot title>
artifact_kind: per-slide-component
ownership: consumer
variant_slug: enhanced-v3
slot: "01"
slug: cover
injects_into_shell_slot:
  route: /play/[deck]/[variant]/[slot]
  deck: pitch
  variant: enhanced-v3
  slot: "01"
status: shipped | stub | planned
shell_artifact_consumed: "[[../../../../ai-labs/dididecks-ai/context-v/sitemap/routes/play-slot]]"
---
```

The `injects_into_shell_slot` field is the load-bearing one — it says "this consumer file is the content the shell route renders for slot N."

## Universal artifacts inherited from the shell

Linked, not copied:

- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/components/DeckOverlay--Scroll-UI]]
- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/components/DeckOverlay--Play-UI]]
- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/components/DeckChrome]]
- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/components/SlideRankPill]]
- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/components/SlideCanvas]]
- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/components/DididecksNav]]
- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/components/DecomposeFirstPlaceholder]]
- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/routes/toc]]
- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/routes/play-slot]]
- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/routes/play-index]]
- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/routes/api-slide-rank]]
- [[../../../../ai-labs/dididecks-ai/context-v/sitemap/routes/api-slide-decompose]]

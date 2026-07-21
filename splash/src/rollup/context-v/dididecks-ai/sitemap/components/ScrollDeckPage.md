---
title: "ScrollDeckPage — THE single shell overlay for a scroll-deck variant page; one-import wiring"
lede: "Bundles every shell concern a scroll-deck variant page needs into ONE component: pagination (scroll-snap + keyboard via `PageAsDeckWrapper`), the four-state rating pill bottom-right (via `DeckOverlay--Scroll-UI` which hosts `SlideRankPill`), and the three-mode color toggle top-right (via `ModeToggle`). The consumer authors only the `<section data-slot data-variant>` blocks inside the slot; ScrollDeckPage handles all the wiring. The `client` value (per-deployment localStorage namespace for ModeToggle) is read from the shell's resolved options on `globalThis.__dididecksShellOptions` — consumers don't have to re-pass it on every page. Authored 2026-06-07 after the chroma-to-shell lift pass exposed that humain was making three separate imports and three mount sites per variant — this collapses to one."
artifact_kind: component
ownership: shell
mode: scroll-ui
status: shipped
shell_version_introduced: 0.2.0
composes:
  - ModeToggle (unless props.hideModeToggle)
  - PageAsDeckWrapper (always; wraps the default slot)
  - DeckOverlay--Scroll-UI (always; hideClassifier propagates)
composed_by:
  - "humain-vc-decks/src/pages/scroll/pitch/proto/index.astro"
  - "humain-vc-decks/src/pages/scroll/pitch/tech-bio-canon/index.astro"
  - "humain-vc-decks/src/pages/scroll/pitch/lab-notebook/index.astro"
  - "(future client-site scroll pages — the canonical entry point)"
theming_tokens_consumed: (inherits through composed children — no direct tokens)
props:
  - "deckSlug: string (required)"
  - "variantSlug: string (required)"
  - "hideClassifier?: boolean (default false; propagates to DeckOverlay--Scroll-UI)"
  - "hideModeToggle?: boolean (default false; for pages whose parent layout already mounts ModeToggle)"
  - "defaultMode?: 'light' | 'dark' | 'vibrant' (default 'light'; passes to ModeToggle)"
  - "respectSystemPreference?: boolean (default false; passes to ModeToggle)"
plan_of_record: "(no explicit plan — emerged from the chroma-to-shell lift pass; user feedback that 'the shell should be the single overlay' on 2026-06-06)"
file: apps/deck-shell/src/components/ScrollDeckPage.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-06-07
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
  - Canonical-Entry-Point
from: "dididecks-ai"
from_path: "context-v/sitemap/components/ScrollDeckPage.md"
---
# ScrollDeckPage

## The before / after that motivated this component

**Before — three shell imports + three mount sites per variant page:**

```astro
---
import ModeToggle from "@dididecks/shell/components/ModeToggle.astro";
import PageAsDeckWrapper from "@dididecks/shell/components/PageAsDeckWrapper.astro";
import DeckOverlayScrollUI from "@dididecks/shell/components/DeckOverlay--Scroll-UI.astro";
---
<body>
  <ModeToggle client="humain-vc-decks" defaultMode="light" />
  <PageAsDeckWrapper>
    <section data-slot="01" data-variant="proto" ...>…</section>
    …
  </PageAsDeckWrapper>
  <DeckOverlayScrollUI deckSlug="pitch" variantSlug="proto" />
</body>
```

**After — one import, one mount site:**

```astro
---
import ScrollDeckPage from "@dididecks/shell/components/ScrollDeckPage.astro";
---
<body>
  <ScrollDeckPage deckSlug="pitch" variantSlug="proto">
    <section data-slot="01" data-variant="proto" ...>…</section>
    …
  </ScrollDeckPage>
</body>
```

## Client-value auto-resolution

The `client` value (per-deployment localStorage namespace for `ModeToggle`) is read from `globalThis.__dididecksShellOptions` (resolved by the `dididecksShell({...})` integration at `astro:config:done`). Consumers don't need to pass it.

## Escape hatches (the prop set)

Default behaviors match the canonical scroll-deck contract. Props exist for the rare cases:

- `hideClassifier={true}` — disable the rating pill (e.g. a public-tier embed where reviewers shouldn't see ranks)
- `hideModeToggle={true}` — don't mount ModeToggle (when a parent layout already does)
- `defaultMode="dark"` — light-canon clients can override; ditto for vibrant-first clients
- `respectSystemPreference={true}` — opt into `prefers-color-scheme: dark` honoring (off by default; brand canon usually beats OS preference)

## Status

- ✅ Shipped this session (commit `84e9c93`)
- ✅ All three humain variants consume

## Related

- [[ModeToggle]]
- [[PageAsDeckWrapper]]
- [[DeckOverlay--Scroll-UI]]
- [[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]] — the lift pass that surfaced the consolidation need

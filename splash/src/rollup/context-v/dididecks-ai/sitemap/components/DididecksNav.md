---
title: "DididecksNav — shell-injected global header linking Scroll · TOC · Play · Changelog"
lede: "Shell-injected global header auto-mounted on `/toc/*` and `/play/*`, with links derived from the consumer's own deck registry."
artifact_kind: component
ownership: shell
mode: both
status: shipped
shell_version_introduced: 0.1.0-rc.0
composes: []
composed_by:
  - "/toc route"
  - "/play/[slot] route (via DeckOverlay--Play-UI target)"
  - "consumer routes (opt-in import)"
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]]"
file: apps/deck-shell/src/components/DididecksNav.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-12
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Brand-Slot
date_created: 2026-05-12
date_modified: 2026-05-15
publish: true
site_uuid: 09ca1b6b-e5cb-494c-b090-62889a34fab9
hex_code: z7yucd
date_authored_current_draft: 2026-05-12
from: "dididecks-ai"
from_path: "context-v/sitemap/components/DididecksNav.md"
---
# DididecksNav

## Auto-mount vs. opt-in

- **Auto** on every shell-injected route (`/toc/*`, `/play/*`).
- **Opt-in** on consumer routes — the consumer imports it where its design language fits.

## Brand override

```astro
<DididecksNav>
  <Wordmark slot="brand" />
</DididecksNav>
```

## Status

- ✅ Shipped Phase A+. Active-link state, brand slot, deck-registry-driven links all working.
- ⚠️ Not yet re-tokenized to the `--ddd-chrome-*` namespace (Restore plan), though it's lower-priority than DeckChrome.
- ⚠️ Tier-awareness (showing Design System / Components links at non-private tiers) is Phase B.

## Related

- [[DeckChrome]] — sibling nav primitive for inside-the-deck navigation.
- [[DeckHeader]] — *not yet built*; Restore plan Step 3 sibling.
- [[../routes/toc]], [[../routes/play-slot]] — auto-mount sites.
- [[../../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]] — origin plan.

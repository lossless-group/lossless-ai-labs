---
title: "DecomposeFirstPlaceholder — empty-slot fallback rendered when a per-slide file doesn't exist yet"
lede: "Empty-slot fallback on the play route — an invitation to begin the rank → decompose → recreate loop, deliberately not an error state."
artifact_kind: component
ownership: shell
mode: play-ui
status: shipped
shell_version_introduced: 0.1.0-rc.0
composes: []
composed_by:
  - "/play/[deckSlug]/[variantSlug]/[slot] route"
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]]"
file: apps/deck-shell/src/components/DecomposeFirstPlaceholder.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-12
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
date_created: 2026-05-12
date_modified: 2026-05-15
publish: true
site_uuid: 801a3b39-3dfa-479d-9488-d4486c71c093
hex_code: 0qufnu
date_authored_current_draft: 2026-05-12
from: "dididecks-ai"
from_path: "context-v/sitemap/components/DecomposeFirstPlaceholder.md"
---
# DecomposeFirstPlaceholder

## Props

```ts
interface Props {
  deckSlug: string;
  variantSlug: string;
  slot: string;
  slug: string;
  title: string;
}
```

## Tone-of-voice contract

Helpful, instructive — not apologetic and not error-like. Reads to the founder as "the next action is right here," not "something went wrong." Flagged as Open Question #3 in [[../../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]]; current copy in the component is the initial answer.

## Status

- ✅ Shipped. Links to `/toc/{deck}/{variant}/?focus={slot}` for one-click jump.
- ⚠️ Will render inside `SlideCanvas` (and eventually `ContentFit`) once `/play/[slot]` migrates — placeholder should look like a presentation slot saying "this is empty," not a half-page message.

## Related

- [[SlideCanvas]] — future containment layer.
- [[DeckOverlay--Play-UI]] — future containment layer.
- [[../routes/play-slot]] — direct consumer.

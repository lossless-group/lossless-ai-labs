---
publish: true
lede: "eventcut-ai stood up as a gated DidiDecks client-site — derived from the chroma-decks template, rebranded to EventCut, registries emptied, build green."
date: 2026-08-02
from: "dididecks-ai/eventcut-ai"
from_path: "changelog/2026-08-02_scaffold-eventcut-client-site.md"
---
# Scaffold the eventcut-ai client-site

Stood up `eventcut-ai` as a private, gated fundraise-materials workspace for
EventCut ([eventcut.ai](https://eventcut.ai)), following the proven
per-client-repo ritual rather than the (deferred) shared multi-tenant host.

## What landed

- Cloned the `chroma-decks` template (the most-wired baseline: auth middleware
  + `@dididecks/shell` + Turso + Vercel) and stripped all chroma-private
  content — founder photos, investor data, brand assets, slides, corpus.
- Rebranded to EventCut across the functional surfaces: session cookie
  `ec_session`, app-slug `eventcut-ai`, seeded orgs `lossless.group` +
  `eventcut.ai` (domain-as-id), the access gate, the text wordmark, and the
  landing hub.
- Emptied the deck registries (`src/data/decks.ts`, `src/data/slides.ts`) and
  made the landing tolerate a zero-deck workspace — the galleries already did.
- `pnpm build` green; `astro:db` seed runs.

## What's next

- Turso remote DB + Vercel project (need the operator's authenticated CLIs).
- The first EventCut deck, from the operator-supplied source material.

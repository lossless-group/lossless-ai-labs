---
from: "dididecks-ai/chroma-decks"
from_path: "context-v/narratives/README.md"
---

# narratives/ — top-level outlines only

> **Convention update — 2026-06-08.** The `slides-content/` per-slide convention this directory originally hosted **moved out of the shared corpus** and into each client-site's own `context-v/slides-content/`. Per-slide concept files are engagement-specific, not cross-engagement reusable, so they belong with the client they describe rather than in a shared store. This directory now holds only **top-level full-deck outlines** that exist before slide boundaries firm up. The lossless-decks slides-content/ scaffold + first four concepts are at `client-sites/lossless-decks/context-v/slides-content/` in the lossless-decks repo.

## What lives here now

**One flavor only: top-level outlines** — one file per deck arc, used for early-stage outlines before slide boundaries are decided, or when an existing deck is being recreated and the source document is the artifact already. The two ChromaDB outlines below are the legacy precedent.

| File | Purpose |
|---|---|
| `ChromaDB_Deck-Outline__Proto.md` | The 13-slide management-supplied proto baseline for chroma-decks (legacy) |
| `ChromaDB_Deck-Outline__Enhanced-v1.md` | The 16-slide enhanced variant outline that diverged from the proto (legacy) |

## Where per-slide concept files now live

In each client-site's own context-v:

```
client-sites/<slug>/context-v/slides-content/
  ├── _TEMPLATE.md
  └── <slug>--<slide-slug>.md
  └── ...
```

First reference implementation: `client-sites/lossless-decks/context-v/slides-content/` with four slide concepts (credibility / firm-wide-emergent-practices / born-from-lived-experience / ideal-engagement).

## Why the move

Two realities surfaced during the lossless-decks engagement that the original "shared corpus" framing didn't account for:

1. **Per-slide concepts are deeply engagement-specific.** A "Chroma cover slide" and a "Lossless credibility slide" don't share reusable content the way brand assets or vendor PDFs do. Keeping them in the shared corpus added a cross-engagement-scope feel that wasn't real.
2. **Co-location with the rendering helps the workflow.** When the per-slide narrative lives in the same repo as the `.astro` slide component that renders it, the cross-reference (component header comment → narrative file) is a relative path, the editorial round-trip is one repo, and the slide's *content* and *form* version together.

The corpus stays the home for **substantiation material** (PDFs, source decks, brand-asset libraries, intake documents) and these **top-level full-deck outlines** that don't fit cleanly inside a single client-site.

## Filename convention for top-level outlines

`<Deck-Name>_<Deck-Type>__<Variant>.md` — TitleCase with double-underscores marking sub-segments. Legacy convention from the ChromaDB outlines; preserve when adding new top-level outlines so historical references resolve.

## See also

- Convention reference: `client-sites/lossless-decks/context-v/slides-content/_TEMPLATE.md` — the canonical per-slide template, now living in the client-site
- The slides-content scaffold-and-maintenance pattern is documented in `dididecks-ai/context-v/agent-skills/setup-new-dddecks-workspace/SKILL.md`

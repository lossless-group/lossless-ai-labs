---
title: "Deck Collections — a menu/aggregation layer above single-deck convergence"
lede: "Everything dididecks has built so far (calmstorm, chroma) operates inside ONE deck: converging on a single narrative through variants and versions. reach-edu-hub needs the layer above that — a curated menu of several DISTINCT decks, each its own narrative (a 'strategy'). This doc names that layer 'deck collections', fixes the conceptual model (a collection groups peer decks; a variant is an alternate design of the same deck — different axis entirely), specifies the near-term reach instantiation (a Strategies collection of ~5, possibly more, decks), codifies the per-deck authoring loop (LLM-authored narrative markdown → Claude designs the deck Scroll-UI-first → register → drop into the existing dididecks variant/version workflow only if needed), and proposes how the concept graduates into the shared @dididecks/shell so it's reusable across client-sites."
date_authored_initial_draft: 2026-06-29
date_authored_current_draft: 2026-06-29
date_last_updated: 2026-06-29
at_semantic_version: 0.0.1.0
status: Seedling
augmented_with: Claude Code (Opus 4.8, 1M context)
category: Exploration
tags:
  - Deck-Collections
  - Dididecks-Shell
  - Reach-Edu-Hub
  - Strategies
  - Information-Architecture
  - Menu-Layer
  - Deck-Iteration-Workflow
  - Narrative-First-Authoring
  - Shell-Abstraction-Candidate
authors:
  - Michael Staton
related:
  - "[[Integrate-Reach-Edu-Hub-into-Dididecks-Shell]]"
  - "../../../context-v/agent-skills/deck-iteration-workflow"
  - "../narratives/pipeline-building-automation"
from: "dididecks-ai/reach-edu-hub"
from_path: "context-v/explorations/Deck-Collections-A-Menu-Layer-Above-Single-Deck-Convergence.md"
---
# Deck Collections — a menu layer above single-deck convergence

## The idea, in one paragraph

dididecks today is a machine for **perfecting one deck**. You take a single
narrative and converge on it — `proto` → `enhanced-v1` → `enhanced-v2` → … —
exploring **variants** and **versions** until one is fundraise-grade. The whole
shell UI (TOC, the rank pill, `/scroll`, `/play`, the deck-overview dashboard)
lives inside that single-deck loop. reach-edu-hub needs something the shell
doesn't have yet: a way to present **several distinct decks at once** — five (and
likely more) separate narratives, each a different **strategy** — behind one
aggregating **menu**. We call that grouping a **deck collection**. It is a new,
higher layer of information architecture, not a new kind of variant.

## Where it sits in the hierarchy

The existing dididecks vocabulary (see the root `CLAUDE.md` "naming is fuzzy"
note) has three layers. Collections add a fourth, on top:

```
COLLECTION   ← NEW. A curated, ordered, named set of peer DECKS + a menu surface.
   └─ DECK         one conceptual artifact / narrative (e.g. "story", a "strategy")
        └─ VARIANT     a whole-deck composition of that narrative (e.g. "enhanced-v3")
             └─ SLIDE      one slot's worth of content (Scroll-UI section / Play-UI file)
```

- A **collection** answers *"which deck do I want to look at?"*
- A **deck** answers *"which telling of this narrative?"* (its variants)
- A **variant** answers *"which slide, in this telling?"* (its slots)

## The load-bearing distinction: collection vs. variant

This is the thing to get right, because it's easy to conflate.

| | **Variant** | **Deck in a collection** |
|---|---|---|
| Relationship to siblings | Same narrative, **different design** | **Different narrative**, peer strategy |
| Axis | Depth — convergence on one story | Breadth — a portfolio of stories |
| Example | `story/baseline` vs `story/editorial` | "Apprenticeship-degree strategy" vs "Workforce-pipeline strategy" |
| Lives at | `/scroll/{deck}/{variant}/` | a card in the collection menu → links to the deck |
| When you make one | The story is right; the *design* isn't | You have a **new** story to tell |

Rule of thumb: **if two things argue the same point differently, they're
variants of one deck. If they argue different points, they're different decks —
and a collection is how you shelve them together.**

## Near-term: the reach-edu instantiation (decided 2026-06-29)

reach-edu has **three parallel collections**, each a menu over its member decks:

| Collection (slug) | Members today | Grows to |
|---|---|---|
| `stories` | `story` deck (variants `baseline`, `editorial`) | more story decks |
| `automations` | `automation` deck (variant `pipeline`) | more automation decks |
| `strategies` | — (new) | **~5+ strategy decks**, one per narrative |

Resolved structural decisions (from the AskUserQuestion on 2026-06-29):

- **Collections are menus over decks; decks keep their slugs.** A collection
  *references* decks by slug — it does **not** rename them or appear in the deck
  URL. So the routes shipped in the integration plan are untouched:
  `/scroll/story/baseline`, `/scroll/story/editorial`, `/scroll/automation/pipeline`
  all stay. New strategy decks live at `/scroll/{strategy}/{variant}/` like any
  deck.
- **New menu routes:** `/stories`, `/automations`, `/strategies` — one
  aggregating page per collection.
- **`strategies` is its own separate collection** — the five new narrative decks,
  not mixed into `stories`/`automations`.

The immediate, most-critical work is the **`strategies`** collection: build ~5
decks around 5 narratives behind the `/strategies` menu.

### Scaffold landed 2026-06-29

- `src/data/collections.ts` — `COLLECTIONS` registry (the three collections) +
  `getCollection()` / `getCollectionDecks()` (resolves deckSlugs against `DECKS`,
  skips not-yet-built decks, computes each deck's default-variant href).
- `src/components/basics/DeckCollectionMenu.astro` — presentational card menu
  (lift candidate for the shell later).
- `src/pages/{stories,automations,strategies}/index.astro` — the three menu
  routes (`prerender = true`; verified building to static HTML). `/stories` and
  `/automations` show their decks; `/strategies` shows the empty state until a
  strategy deck is registered.
- `context-v/narratives/strategies/rural-income/README.md` — first **draft**
  strategy narrative (web-researched, figures flagged `⚠ VERIFY`). Deck not yet
  designed; once built + registered in `decks.ts`/`slides.ts`, add `rural-income`
  to the `strategies` collection's `deckSlugs` and the menu lights up.

### rural-income deck v1 built 2026-06-29

- `src/styles/deck-primitives.css` — **new token-driven section vocabulary**
  (`.deck-section`, `.deck-h1/h2`, `.deck-gradient`, `.deck-card`, `.deck-stat`,
  `.deck-chip`, `.deck-glow`, `.deck-verify`, …). Reads ONLY Tier-2 semantic +
  `--fx-*` tokens, so light/dark/vibrant work with no per-element variant
  classes. This is the **drag-and-drop convergence target** — the answer to "if
  we stick to what we have it never improves; if we go wild there's no
  coherence." The old story/automation sections hardcode `dark:`/`vibrant:`
  triples and ignore the brand `--fx-headline-gradient` / `--fx-card-shadow`;
  new strategy decks build on these primitives instead. **Lift candidate for
  `@dididecks/shell`.**
- `src/layouts/sections/rural-income/T01–T11.astro` — 11 sections (incl. the
  funder-pipeline slide), all on the primitives; figures `⚠ VERIFY`-flagged via
  `.deck-verify`.
- `src/pages/scroll/rural-income/v1/index.astro` — the deck page (`theme-default`
  + `data-mode` wired so the tokens resolve).
- Registered in `decks.ts`, `slides.ts`, `seo.ts`; added to the `strategies`
  collection. Live at `/scroll/rural-income/v1`; `/strategies` and
  `/toc/rural-income/v1` (11 slots) verified.

### ⚠ Shell limitation surfaced — variant slugs are GLOBALLY keyed

The shell keys the slot registry by **variant slug alone** (`SLOTS[variantSlug]`,
`slotsByVariant[variant.slug]`), not by `deck/variant`. So every strategy deck's
first variant wants `v1`/`baseline` but they would **collide**. rural-income uses
`v1` (free today); the *next* strategy can't also use `v1`. **Top Phase-E
shared-tooling fix:** scope SLOTS by `deckSlug + variantSlug` (composite key or
nested map) in `apps/deck-shell` so each deck's variants are independent. Until
then, strategy variant slugs must be hand-kept globally unique. (Also noted in
[[Integrate-Reach-Edu-Hub-into-Dididecks-Shell]].)

**Not yet done (next-session candidates):** nav entries for the three menus
(open question #4 — hub home vs. menus); verifying the narrative's flagged
figures + filling regional/local funder tiers; the SLOTS-scoping shell fix above;
lifting `DeckCollectionMenu`, `collections.ts`, and `deck-primitives.css` into
`@dididecks/shell`.

## The authoring workflow (codify this — it's the repeatable loop)

Per strategy deck, the loop is:

1. **Narrative first, in markdown (LLM-assisted).** Each strategy gets its own
   **directory** of markdown — three layers:
   `context-v/narratives/strategies/<strategy-name>/`. A strategy is a *folder*,
   not a single file, so its narrative can span multiple markdown files (the
   through-line, per-section content, supporting research), mirroring how
   `narratives/pre-rag-synthesis/` already holds files 01–07 in one subdir. This
   is the gold/source content for the deck.
2. **Claude designs the deck — Scroll-UI first.** Following the
   `deck-iteration-workflow` skill (Phase 1: whole-narrative single-page scroll
   deck, sections, inline Tailwind, no premature componentization). This produces
   one deck at `/scroll/{strategy}/{variant}/`.
3. **Register it.** Add the deck to `src/data/decks.ts` + slots to
   `src/data/slides.ts`, and add it to the collection (see abstraction below).
   Remember: **variant slugs must be globally unique** across the client (the
   shell's `SLOTS` map is variant-keyed — see the integration plan).
4. **Iterate variants/versions ONLY if needed.** If a strategy deck needs
   alternate designs, *now* it enters the existing dididecks convergence loop
   (variants, rank pill, Play-UI conversion, etc.). Most strategy decks may never
   need more than their first Scroll-UI cut.

The collection layer is deliberately **thin**: it's a menu over step 2's outputs.
All the heavy machinery stays in the per-deck layer that already exists.

## Abstracting into dididecks (the shell) — the graduation path

reach is the proving ground; the goal is that **any** client-site can declare a
collection. Proposed shape (to refine when we build it):

- **A collections registry** — `src/data/collections.ts` exporting
  `COLLECTIONS: Collection[]`, where roughly:
  ```ts
  interface Collection {
    slug: string;          // URL slug, e.g. "strategies"
    title: string;         // "Reach Strategies"
    lede: string;
    deckSlugs: string[];   // ordered references into DECKS (decks.ts)
    status?: DeckStatus;   // rolls up from member decks
  }
  ```
  Decks stay defined once in `decks.ts`; a collection just **references** them by
  slug and imposes order + framing. (A deck could in principle belong to more
  than one collection.)
- **A menu/index route per collection** — reach uses one page per collection at
  its own top-level slug (`/stories`, `/automations`, `/strategies`), each card
  deep-linking to `/scroll/{deck}/{defaultVariant}/`. (The generic shell form
  could be `/collections/[collectionSlug]`, or a helper that a client mounts at
  whatever path it wants — reach mounts them at the bare collection slug.) Deck
  URLs are unchanged; the collection slug does **not** enter the deck path.
- **A shell menu component** — e.g. `DeckCollectionMenu.astro` /
  `CollectionGallery.astro`, rendering deck cards (thumb, title, lede, status).
  **Precedent already exists:** chroma's `src/pages/index.astro` composes
  `@dididecks/shell/components/DeckStatsPanel.astro` + `DeckMatrix.astro`, and
  the shell already has `lib/deck-overview.ts`. The collection menu is the same
  family of gallery component, one level up.
- **Sequencing:** build it *concretely in reach first* (local `collections.ts` +
  a local menu page), confirm the shape, then lift the generic parts into
  `apps/deck-shell/` — exactly the chroma→shell promotion discipline in
  [[Integrate-Reach-Edu-Hub-into-Dididecks-Shell]] and the Lift-Chroma plan.
  Don't pre-build the shell abstraction before reach has exercised it.

## Open questions

*(Resolved 2026-06-29: collection membership → three collections, decks keep
slugs; routing → per-collection menu at `/stories` etc., collection slug not in
deck path. See "Near-term" above.)*

Still open:

1. **Public label:** is "strategy" the reader-facing label for a deck in the
   `strategies` collection, or only internal? Is "collection" the right public
   word, or "portfolio" / "set"?
2. **Cross-collection decks:** is a deck allowed in more than one collection? The
   `deckSlugs`-reference model permits it; confirm we want that.
3. **Per-collection identity:** does a collection carry its own framing (intro
   blurb, palette accent, ordering rules), or is it purely a menu of cards?
4. **Hub home vs. menus:** how do `/stories` `/automations` `/strategies` relate
   to the existing editorial home at `/`? (Nav entries? Does `/` feature one
   collection?)
5. **Strategy roster:** the names/narratives of the first ~5 strategies (drives
   the `narratives/strategies/<strategy-name>/` dirs and the deck slugs).

## Related

- [[Integrate-Reach-Edu-Hub-into-Dididecks-Shell]] — reach just joined the shell;
  this builds the next layer on top.
- `deck-iteration-workflow` skill — the per-deck (step 2+) loop this sits above.
- `context-v/narratives/strategies/<strategy-name>/` — per-strategy markdown
  directories where the narratives (step 1) live (three layers).
- Root `CLAUDE.md` "Scroll-UI vs Play-UI" + "slide/variant/deck" definitions.

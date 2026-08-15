---
title: "Deck Convergence: Slot-Level Alternatives and Compositions"
lede: "Generative AI can produce a hundred ways to pitch the same slide. The bottleneck is no longer making alternatives — it's converging on one. This spec moves the alternative from the deck to the slot, so 'we've been pitching it this way, make alternatives, we pick, we converge' becomes a durable, resumable artifact instead of a memory."
date_authored_initial_draft: 2026-08-04
date_authored_current_draft: 2026-08-04
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-08-04
at_semantic_version: 0.0.1.0
status: In-Discussion
category: Specification
augmented_with: Claude Code on Claude Opus 5 (1M context)
authors:
  - Michael Staton
tags:
  - Spec
  - Dididecks-AI
  - Dididecks-Shell
  - Convergence
  - Slot-Level-Alternatives
  - Compositions
  - Deck-Lineage
  - Generative-Abundance
  - Deck-Matrix
  - Variant-Model
date_created: 2026-08-04
date_modified: 2026-08-04
publish: false
from: "dididecks-ai"
from_path: "context-v/specs/Deck-Convergence-Slot-Level-Alternatives-and-Compositions.md"
---
# Deck Convergence: Slot-Level Alternatives and Compositions

> **In-Discussion — 2026-08-04.** Shaped through a working session against eventcut-ai's
> live surface. Open question 1 (the my-take decks) is **decided**; questions 2 (naming)
> and 3 (Composition URLs) remain open and still gate sign-off. One item has shipped
> ahead of sign-off — the `DeckMatrix` uncap in shell v0.4.0 — because it fixes a
> present-tense bug (the client's own deck being invisible by default) and does not
> presuppose the unresolved naming or routing decisions. Per [[developing-a-spec]], the
> narrative pass happens after sign-off, not before.

## Why care?

The loop a founder or VC actually runs is this:

> *"We have been pitching it this way with this deck. Create alternatives. We pick from
> alternatives, converge on a new way of pitching."*

Generative AI is extremely good at the middle step. It can research a market, rewrite a
value proposition six ways, and lay each out in competent HTML. **Making alternatives is
no longer the bottleneck. Choosing between them is.**

Today DidiDecks has no durable representation of that choosing. Alternatives are produced
as whole decks, comparison happens by opening two tabs, and the decision lives in
someone's head until it's re-litigated next week. This spec proposes the smallest model
change that makes convergence a first-class, resumable artifact.

It operationalizes three design principles already stated in
[[Dididecks-AI-Slide-Decks-as-Code]]: **#3 non-destructive iteration**, **#4 an
always-playable MVP deck**, and **#5 continuous iterate / fork / personalize.**

## The problem, stated precisely

`variant` is currently doing the work of three different concepts:

| What it really is | Live example | Do slots align across it? |
|---|---|---|
| **Narrative** — a different story | eventcut: `faithful` vs `zero` vs `hypercut` vs `continuum` | ❌ never |
| **Treatment** — same content, different design/copy | **humain: `proto` vs `tech-bio-canon` vs `lab-notebook`** | ✅ always |
| **Cut** — subset/reorder for length | *(none yet)* | ✅ mostly |

**The Treatment axis is not hypothetical — humain-vc-decks already does it correctly, and
that matters more than the eventcut problem does.** Its three variants are three *design
bets on one deck*, differing only in visual treatment ("faithful baseline, on-brand
canonical, scientific-editorial"). Measured on the live matrix 2026-08-04: **29 rows,
three columns, and zero `missing-slot` markers** — every variant carries every slot.
Compare eventcut, where rows 11–17 are missing across most columns.

Notably, humain's `SLOTS` registry is literally `{}`. The alignment is not hand-declared —
it *emerges* from the shell's scroll-page scanner reading `<section data-slot data-variant>`
out of each variant's page. Three independently-authored design treatments converged on
the same slot skeleton because they are genuinely renderings of the same deck. That is
the strongest available evidence that slot identity is the right spine for this model.

And `humain/data/audits/slides.json` carries **25 real rank entries** written by
`founder` on 2026-06-07, all on the `scroll` surface of `tech-bio-canon`.

So the convergence loop has been exercised, on the right axis, by a real user. The model
in this spec is not speculative — it is a generalization of what humain already proves,
extended down one level (from whole-variant to per-slot) so that picks can be *mixed*
rather than taken wholesale.

**eventcut is the deviation, not the norm.** It used the variant axis for content forks,
which is why its matrix degrades into a misleading union and its audits file is empty.

`DeckMatrix` assumes row 2 — slot identity stable across columns. eventcut produced only
row 1. The observable consequences, verified live on 2026-08-04:

- `/toc/pitch` renders **three** columns. `MAX_VISIBLE_VARIANTS = 3` defaults to the last
  three in registry order, so `faithful` — the client's actual deck — is **invisible by
  default**.
- Forcing all four in (`?variants=faithful,zero,continuum`) yields a 17-row union where
  rows 11–17 are correctly marked missing for the 10-slot narratives, but rows 01–10 take
  their **title from whichever variant is listed first**. Row 02 reads "The Problem"
  (faithful's) while the same row for `zero` is "The editing tax" and for `continuum` is
  "The barrier to publishing is the edit". Drop `faithful` from the column set and every
  row title silently changes.
- eventcut's `data/audits/slides.json` is `[]`. One deck, four variants, forty-seven
  slots, **zero rankings** — while humain, on the aligned axis, accumulated 25 in a
  single sitting. Nothing has been converged on eventcut because nothing was comparable.

The matrix is not broken. It is being fed the wrong axis.

## The core proposal: alternatives belong to the slot

You never pick a narrative wholesale. You pick *this* framing of the problem slide and
*that* treatment of the market slide. **The unit of choice is the slot, so the unit of
alternation must also be the slot.**

```
Deck              "EventCut · Pitch"          ← evolving artifact, carries lineage
 └─ Slot          01 … 17                     ← unit of content AND unit of convergence
     └─ Alternative   a, b, c … n             ← candidate renderings of THAT slot
Composition       one pick per slot           ← derivesFrom: the baseline it improves on
```

A **Composition** is the deliverable: a set of `slot → alternative` picks plus a
`derivesFrom` pointer to the baseline it was converged from. Converging produces a new
composition, which becomes the next baseline, and the loop runs again. This is the
`basis` / `derivesFrom` / diff concept that
[[Build-Faithful-Scroll-Deck]] explicitly deferred — *"Any `@dididecks/shell` change
(graduate `basis`/`derivesFrom`/diff later)."* This is that graduation.

### The always-playable constraint shapes the default

Design Principle #4 says a deck must be presentable **at every moment**. That forces a
specific rule:

> **Every slot always has a champion.** An unconverged slot falls back to the baseline's
> alternative. A Composition is therefore never partial and never un-presentable — it
> starts as an exact clone of its baseline and diverges one slot at a time.

This is what makes the model safe to iterate inside. There is no half-built state.

### Non-destructive by construction

Design Principle #3 says never destroy. Losing alternatives stay on disk, stay ranked,
stay revivable — a rejected alternative is just one that isn't currently champion. The
slide library is the accumulated set of non-champion alternatives, and it costs nothing
extra to maintain because it is simply *the files that already exist*.

## Two surfaces, because there are two kinds of comparison

The current TOC attempts both and therefore serves neither.

**1. The convergence matrix — *within* a deck.** Slots as rows, alternatives as columns,
dual Scroll/Play rating per cell. This is `DeckMatrix` and its design is correct. It needs:

- The 3-column cap replaced by horizontal scroll with a **pinned slot column**.
- A **pinned baseline column** — "what we've been pitching" — always visible at the left
  edge regardless of scroll position, because every comparison is against it.
- Columns ordered by rank so the strongest candidates sit nearest the baseline.

**2. The portfolio — *across* decks and narratives.** Cards, not columns. Different
stories cannot be row-aligned and should not be forced into a grid. This is reach-edu-hub's
already-built `collections.ts` + `DeckCollectionMenu`, named as a lift candidate in
`changelog/2026-06-29_01.md` and still unlifted.

## Converge in Scroll; decompose only the champion to Play

The highest-leverage consequence of the model.

Generate alternatives in **Scroll-UI** — responsive, cheap, forgiving, and the surface
modern LLMs are genuinely good at. Rank them, pick a champion. **Only the champion is
recreated as a rigid 16:9, no-JS Play-UI slide.**

You never pay the expensive conversion on a candidate that loses. This is the existing
Phase 1 → Phase 2 flow from [[deck-iteration-workflow]] with the funnel finally pointed
the right way, and it is already expressible in the shell's data model: `RankEntryV2`
carries a **dual** scroll/play rating per slot, so *scroll-rated* reads as "converging"
and *play-rated* reads as "shipped."

## What changes in `@dididecks/shell`

Concrete, ordered by dependency:

1. **Rank key gains an alternative axis.** `buildRankKey(deck, variant, slot)` →
   `(deck, variant, slot, alt)`. The dual-surface `RankEntryV2` shape is untouched.
   **`data/audits/slides.json` is `[]` across every consumer, so there is no migration
   cost — this is free today and expensive later.**
2. **Per-slide file shape.**
   `slides/{variant}/{slot}-{slug}.astro` → `slides/{variant}/{slot}-{slug}/{alt}.astro`.
   Both `perSlideFileExists` and `play-availability.ts` already parse this path with a
   regex; each is a one-line change.
3. ~~**Uncap `DeckMatrix`.**~~ **SHIPPED 2026-08-04 in shell v0.4.0.** `MAX_VISIBLE_VARIANTS`
   retired; every registered variant renders as a column, with horizontal scroll and
   sticky Slot / Title / baseline columns. The **baseline** is `variants[0]` (which
   `decks.ts` already documents as the canonical default) — always visible, always
   leftmost, and un-droppable even via an explicit `?variants=` list. Verified on
   eventcut: `/toc/pitch` now renders all four columns with `faithful` first, 17 union
   rows. Still open from this item: **rank-ordering the alternative columns**, which
   depends on the rank-key change in item 1.
4. **Composition registry.** `compositions.ts` exporting
   `{slug, derivesFrom, picks: {slot: alt}}`. Small, and it is the artifact that makes
   convergence durable rather than remembered.
5. **Scope `SLOTS` by `deck + variant`.** Already filed in `changelog/2026-06-29_01.md`
   as the next shared-tooling task; it becomes load-bearing here.
6. **Portfolio surface.** Lift `collections.ts` + `DeckCollectionMenu` from reach.

### Prerequisite: slot-level components

Slot-level alternatives require slot-level component files. eventcut's four
single-file scroll decks (844–1,160 lines each) are the obstacle, and
[[Componentize-Slides-and-Establish-Component-Library]] is the plan that removes it.
That plan is a hard prerequisite for step 2 onward.

## Migration path — eventcut-ai as the pilot

eventcut is the right pilot for the same reason it was the pilot for the libSQL
migration: it is not yet deployed and carries no reader expectations.

Proposed (pending the first open question below): `faithful` becomes the **baseline** —
it is the client's real deck under a fidelity contract. The three my-take narratives
(`zero`, `hypercut`, `continuum`) are **decomposed into slot-level alternatives against
it**. That converts existing work into a populated convergence matrix on day one instead
of standing up an empty one, and it is non-destructive: the three narratives keep their
own scroll routes and remain presentable as whole decks.

Where slot identity genuinely does not correspond (the my-take narratives have 10 slots to
faithful's 17, and their stories differ), the alternative attaches to the slot it
*argues against*, not the slot it happens to be numbered as. That mapping is editorial and
should be done by hand once, not inferred.

## Non-goals

- **Not** relitigating hand-authored `.astro` slides versus store-served data. That fork
  belongs to [[Bridging-PLG-Self-Serve-with-Previous-Approach]] and is untouched here.
- **Not** multi-tenant. This model is a prerequisite for `dddecks.ai` self-serve but does
  not deliver it; see [[Structural-Frontend-for-Single-Tenant-Client-Sites]].
- **Not** automated alternative generation. This spec defines where alternatives *live*
  and how they are *chosen*. What prompts an agent to produce them is separate work.
- **Not** a change to the `/play` runtime, which was verified working end-to-end on
  eventcut on 2026-08-04 (chrome, canvas, variant switcher, in-play rating, print route).

## Open questions

These are unresolved and block sign-off.

1. ~~**Do the four my-take decks become narratives (portfolio) or an alternative pool
   (matrix)?**~~ **DECIDED 2026-08-04 — both.** They stay coherent peer decks behind a
   portfolio menu *and* their slides register as slot-level alternatives against
   `faithful`. This preserves the "four complete, independently-branded stories" framing
   while still populating the convergence matrix on day one. Costs more modelling: a
   slide is then addressable both as *part of narrative X* and as *alternative n for slot
   Y*, so the alternative registry references slides rather than owning them.
2. **Naming.** This spec uses Narrative / Treatment / Alternative / Composition.
   `variant` is currently load-bearing in URLs, registries, rank keys, and file paths
   across six client-sites — renaming has real cost and should be decided deliberately
   rather than drifting. A cheaper option: keep `variant` in the URL and introduce only
   `alternative` + `composition` as new concepts.
3. **Does a Composition get its own URL**, or is it a saved pick-set rendered through the
   existing `/scroll/{deck}/{variant}/`? This determines whether the work is a routing
   change or purely a data change.

## Stale prior art to revisit after sign-off

- [[Redesign-TOC-as-Deck-Level-Dual-Surface-Review-Matrix]] — the plan `DeckMatrix` was
  built from. Its variant model is the one this spec revises; it will need a
  `superseded_by` or an amendment.
- `client-sites/eventcut-ai/src/data/decks.ts` — its header comment documents the
  two-axis deck/variant model as canonical.

## Related

- [[Dididecks-AI-Slide-Decks-as-Code]] — parent spec; design principles #3, #4, #5
- [[Structural-Frontend-for-Single-Tenant-Client-Sites]] — the sibling gap analysis
- [[Bridging-PLG-Self-Serve-with-Previous-Approach]] — the authoring-unit fork
- [[Redesign-TOC-as-Deck-Level-Dual-Surface-Review-Matrix]] — the matrix's plan of record
- [[Componentize-Slides-and-Establish-Component-Library]] — hard prerequisite
- [[Build-Faithful-Scroll-Deck]] — where `basis`/`derivesFrom` was deferred
- `changelog/2026-06-29_01.md` — deck collections + `SLOTS` keying, both load-bearing here

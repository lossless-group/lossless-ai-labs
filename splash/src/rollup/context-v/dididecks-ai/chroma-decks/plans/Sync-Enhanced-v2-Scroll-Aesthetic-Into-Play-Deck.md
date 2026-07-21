---
title: "Sync enhanced-v2 scroll-deck aesthetic into the play-deck components and re-export"
lede: "Plan of record for reconciling the divergence between src/pages/scroll/pitch/enhanced-v2/index.astro (heavily evolved through 2026-05-14) and the per-slide play components at src/components/slides/enhanced-v2/ (last touched 2026-05-12 except for three uncommitted edits and the new 09b Blue Ocean Canvas). Output: a consistent play deck at /play/pitch/enhanced-v2/ plus a fresh PDF export. SHELVED 2026-05-14 in favor of finishing the @dididecks/shell first — return to this after the shell can iterate playable decks cleanly."
date_created: 2026-05-14
date_modified: 2026-05-14
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7 (1M context)
semantic_version: 0.0.1.0
tags:
  - Plan
  - Enhanced-v2
  - Play-Deck
  - Scroll-Deck
  - Sync
  - Blue-Ocean-Canvas
  - PDF-Export
  - Chroma
status: Shelved
from: "dididecks-ai/chroma-decks"
from_path: "context-v/plans/Sync-Enhanced-v2-Scroll-Aesthetic-Into-Play-Deck.md"
---
# Sync enhanced-v2 scroll-deck aesthetic into the play-deck components

> **Status: Shelved 2026-05-14.** During this iteration we evolved the scroll deck (`/scroll/pitch/enhanced-v2/`) substantially while the per-slide play components froze on 2026-05-12. The right move is to first land the `@dididecks/shell` work so iterating on a *playable* deck is mechanically easier — *then* execute this sync plan against a more mature shell, including any new chrome / containers the shell adds. This document captures the audit + sync mechanics so we can resume without re-deriving them.

## Why this work exists

In the current chroma-decks layout there are **two parallel surfaces** for enhanced-v2:

| Surface | File(s) | Sizing model | Last evolved |
|---|---|---|---|
| **Scroll deck** (continuous narrative) | `src/pages/scroll/pitch/enhanced-v2/index.astro` — one big page with inlined `<section data-slot="…">` blocks per slide | Responsive `clamp(…)` sizing, scrolls in the browser | 2026-05-14 (≈ +790 / -296 lines uncommitted past the 2026-05-12 port) |
| **Play deck** (one-slide-at-a-time) | `src/components/slides/enhanced-v2/*.astro` — one component per slot | Fixed 1920×1080 design stage; the shell's `SlideCanvas` scales it via CSS container queries | Mostly 2026-05-12; three uncommitted edits 2026-05-13; `14-use-of-funds.astro` + new `09b-blue-ocean-canvas.astro` on 2026-05-14 |

We iterated on the scroll deck first because it was faster to reason about the full arc on one page. The play components are now visibly behind.

The shell (`@dididecks/shell`, at `dididecks-ai/apps/deck-shell/`) globs the play components at `/src/components/slides/{variant}/{slot}-{slug}.astro` for both interactive play and the print-to-PDF surface. So **the play components are the source-of-truth for PDF export.** Whatever the play deck shows is what ships in `exports/`.

## State snapshot at the moment of shelving (2026-05-14)

### Play-component files for enhanced-v2

| Slot | File | Last touched | Notes |
|---|---|---|---|
| 01 | `01-cover.astro` | 2026-05-12 | Untouched since initial port (`7c0e5a5`) |
| 02 | `02-opening.astro` | 2026-05-12 | Untouched |
| 03 | `03-traction.astro` | 2026-05-12 | Untouched |
| 04 | `04-market.astro` | 2026-05-12 | Untouched |
| 05 | `05-bottleneck-solution.astro` | 2026-05-12 | Untouched |
| 06 | `06-difficult-problems.astro` | 2026-05-12 | Untouched |
| 07 | `07-two-segments.astro` | 2026-05-12 | Untouched |
| 08 | `08-case-study-xai.astro` | 2026-05-12 | Untouched |
| 09 | `09-competition.astro` | 2026-05-12 | Untouched |
| **09b** | `09b-blue-ocean-canvas.astro` | 2026-05-14 **(new)** | Created during the Blue Ocean Canvas iteration. **Not in `src/data/slides.ts`** — play runtime + `print.astro` currently skip it. |
| 10 | `10-team.astro` | 2026-05-13 | Uncommitted edits from prior session |
| 11 | `11-backed-by.astro` | 2026-05-13 | Uncommitted edits from prior session |
| 12 | `12-business-model.astro` | 2026-05-12 | Untouched |
| 13 | `13-capital-efficiency.astro` | 2026-05-12 | Untouched |
| 14 | `14-use-of-funds.astro` | 2026-05-14 | Title rename "→ Buying one milestone" → "→ Use of Proceeds: In pursuit of milestones" applied. |
| 15 | `15-ask.astro` | 2026-05-13 | Uncommitted edits from prior session |
| 16 | `16-closing.astro` | 2026-05-12 | Untouched |

### Diff stat (HEAD vs working tree) at shelving

```
src/components/slides/enhanced-v2/10-team.astro          |  49 +-
src/components/slides/enhanced-v2/11-backed-by.astro     |  76 +-
src/components/slides/enhanced-v2/14-use-of-funds.astro  |   2 +-
src/components/slides/enhanced-v2/15-ask.astro           |   2 +-
src/pages/scroll/pitch/enhanced-v2/index.astro           | 957 +++++++++++++++------
```

The scroll page is the heavy mover. Everything else is small.

### Registry state

`src/data/slides.ts` `SLOTS["enhanced-v2"]` enumerates slots **01 through 16** (16 entries). Adding `09b` requires a 1-line append; renaming any slot's `slug` requires also renaming the per-slide component file to match.

## What "consistency" means here

Three classes of drift to reconcile when this plan unshelfs:

1. **Text drift.** Headlines, eyebrows, body copy that changed in the scroll inline version but not in the play component. (Example already fixed: slide 14's "Buying one milestone" → "Use of Proceeds: In pursuit of milestones" — applied to both during the iteration.)
2. **Layout / styling drift.** Spacing, grid columns, color tokens, typography that we tightened in the scroll version. Most of these are cosmetic; some — like the Blue Ocean Canvas — are entirely new structures.
3. **Structural drift.** New slides that exist in the scroll deck but not in the play deck (the 09b canvas), or vice versa. The scroll-page header counter reads `09b / 17` while `slides.ts` still claims 16; the play deck doesn't see 09b at all.

## Two numbering options for 09b (decide first when resuming)

- **(a) Keep `09b`.** Minimal churn. One-line append to `slides.ts`. Slot count reads `17` in the registry but visually it's "09b" in the strip header. Cleanest if we expect to add more between-slot insertions later.
- **(b) Renumber 09b → 10, shift 10–16 → 11–17.** Cleaner final state. Touches: every slot-header label in 7 play components (`10-team` through `16-closing`), every `data-slot` value in those slots, all matching entries in `slides.ts`, plus all the inline `<section data-slot="…">` headers in the scroll page. Larger one-time edit, no future ambiguity.

**Author's lean: (b).** Worth the one-time pain, especially because the print PDF's slot labels will look sloppy with `09b` mixed into otherwise sequential numbering.

## Execution plan (5 steps, in order, when this unshelfs)

### Step 1 — Decide numbering (a) or (b)

Author decides. Then either:
- **(a)** Append `{ slot: "09b", title: "Blue Ocean — Strategy Canvas", slug: "blue-ocean-canvas" }` to `SLOTS["enhanced-v2"]` between slots 09 and 10. Done.
- **(b)** Rename `09b-blue-ocean-canvas.astro` → `10-blue-ocean-canvas.astro`. Rename each subsequent component file by `+1`. Update the `data-slot=` attribute and the slot-header label inside each renamed file. Update `SLOTS["enhanced-v2"]` to enumerate 01–17 with the new ordering. Update `data-slot=` and the slot-counter labels inside every inlined `<section>` in `src/pages/scroll/pitch/enhanced-v2/index.astro`.

### Step 2 — Drift audit per slot

For each slot 01–16 (or 01–17 after renumber), produce a side-by-side punch list:

| Slot | Component file | Scroll inline at line | Drift items |
|---|---|---|---|
| 01 | `01-cover.astro` | …around 140 | (headline / eyebrow / spacing changes) |
| … | … | … | … |

No edits yet — just the list. Spawning an `Explore` agent with a tight prompt produces this faster than reading 17 files in the main context.

### Step 3 — Sync slot-by-slot

Walk the punch list. Port each scroll change back into the corresponding play component. Keep the play component's fixed 1920×1080 sizing — the scroll version's `clamp(…)` responsive sizing does **not** translate; redo proportions for the fixed stage.

Apply to the new shell-aware containers if Step 0 (shell work) has introduced any new wrappers (e.g., a print-only header strip, slide-number chrome, etc.) — that's the reason this plan was shelved.

### Step 4 — Confirm play runtime + print route render every slot

```bash
pnpm dev
# Visit /play/pitch/enhanced-v2/01/ and arrow-key through every slot
# Visit /play/pitch/enhanced-v2/print/ — every slot should appear, page-break-after between each
```

Any slot that 404s or rendered the `DecomposeFirstPlaceholder` means `slides.ts` doesn't match the component filename. Reconcile.

### Step 5 — Re-export PDF

Browser-print `/play/pitch/enhanced-v2/print/` to PDF. Save to:

```
exports/2026-05-XX_Chroma_Series-A_DDDeck-MS_enhanced-v2.pdf
```

following the date-prefix convention already established in `exports/`. Commit the PDF along with the synced components.

## Dependencies blocking resume

- **`@dididecks/shell` matures past v0.1.0.** Per `apps/deck-shell/README.md`, v0.1.0 is "TOC route + slide-ranking UI + decomposition stub generator. That's it." The `/play` runtime and PlayChrome are already there (see `apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/[slot].astro`), but additional chrome the shell may add (presenter notes, slide-number footer, mode-aware backgrounds, export buttons) will affect how the play components should be structured. Resuming this sync **before** the shell stabilizes risks re-doing the work.
- **Decision on numbering option (a) vs (b).** Author input required at Step 1.

## When to unshelf

Unshelf when **all** of these are true:

1. `@dididecks/shell` has shipped its next minor (v0.2.x) with whatever play-chrome and print-route changes are in flight.
2. The scroll deck `/scroll/pitch/enhanced-v2/` is stable for at least 48 hours without further aesthetic edits — otherwise we're chasing a moving target.
3. A PDF export from the play deck is needed for a date-certain stakeholder send (otherwise scroll-only delivery suffices).

## Cross-references

- [[apps/deck-shell/README.md]] — the shell that consumes play components
- [[apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/[slot].astro]] — interactive play runtime
- [[apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/print.astro]] — PDF-export surface
- [[src/data/decks.ts]] — deck/variant registry
- [[src/data/slides.ts]] — per-variant slot registry (the file that gates whether a slot renders in play/print)
- [[context-v/plans/Author-Enhanced-v1-from-MemoPop-Research.md]] — sibling plan; the enhancement narrative that produced today's scroll-deck evolution
- [[context-v/skills/deck-iteration-workflow]] — the methodology (single-page narrative → individual slides → cleanup) this drift is a natural consequence of

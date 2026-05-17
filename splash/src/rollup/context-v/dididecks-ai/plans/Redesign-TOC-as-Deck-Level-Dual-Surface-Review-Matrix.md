---
title: "Redesign TOC as a Deck-Level Dual-Surface Review Matrix"
lede: "Today's `/toc/[deck]/[variant]/` answers a build-system question ('which slot has a Play-UI file?') when the deck-iteration-workflow centers on a workflow question ('where am I in the review cycle, and which variant is closest to shippable?'). The calmstorm-decks `/index` shows the right shape: variants as columns, slides as rows, a review-status chip per cell. We go one step further than calmstorm: each cell carries TWO chips, one per surface — scroll-review and play-review — because the workflow reviews each slide twice (once during scroll-iteration, once after porting to Play-UI). The goal the matrix should make obvious at a glance: find a single column where every slide is ≥ passable on both surfaces, with as many ★s as possible. Drift between scroll-rating and play-rating is itself a workflow signal (the port may have lost fidelity). This redesign migrates the audits schema from one rating per (slot, variant) to two ratings, makes the SlideRankPill surface-aware, builds a new `/toc/[deck]/` deck-level matrix route, and keeps the per-variant `/toc/[deck]/[variant]/` route alive as the variant landing/index — distinct purpose from the matrix. [Original lede said \"folds the per-variant TOC into a redirect\"; revised 2026-05-17 in-flight when in-browser review made clear the two surfaces serve different workflow needs.]"
date_authored_initial_draft: 2026-05-17
date_authored_current_draft: 2026-05-17
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-17
at_semantic_version: 0.0.1.0
status: Draft
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Plan
tags:
  - Dididecks-Shell
  - TOC-Redesign
  - Deck-Level-Matrix
  - Dual-Surface-Rating
  - Scroll-UI-Play-UI-Paired-Review
  - Audits-Schema-Migration
  - SlideRankPill-Surface-Awareness
  - Deck-Iteration-Workflow
  - Calmstorm-Pattern-Adoption
authors:
  - Michael Staton
date_created: 2026-05-17
date_modified: 2026-05-17
from: "dididecks-ai"
from_path: "context-v/plans/Redesign-TOC-as-Deck-Level-Dual-Surface-Review-Matrix.md"
---
# Redesign TOC as a Deck-Level Dual-Surface Review Matrix

> Plan of record for the next slice of `@dididecks/shell`. Replaces the per-variant TOC with a deck-level matrix that surfaces the question the founder actually asks every day: *"which variant is closest to ready, and what's left to fix in it — on both the scroll surface and the play surface?"*

## Why now

The Phase A++ work (DeckOverlay--Play-UI, in-play SlideRankPill, the `/play/` chooser, the Scroll-UI vs. Play-UI framing correction) leaves us with a fully two-surface workflow but a one-surface TOC. The founder reviewed today's `/toc/pitch/enhanced-v3/` next to calmstorm-decks's `/index` and named the gap directly: dididecks' TOC shows port-status (Play-UI file exists or not) as the headline information; calmstorm's TOC shows review-status, with port-status folded in as a quieter "ADAPTED" chip. The calmstorm framing is the right one — port-status is plumbing, review-status is workflow.

This plan adopts the calmstorm pattern, and pushes one step further: where calmstorm rates a slide once per variant, dididecks rates it twice — once on Scroll-UI, once on Play-UI — because the deck-iteration-workflow walks both surfaces and they can drift.

## The workflow this serves (literal, from founder's articulation)

1. Start from materials (PDF / per-slot markdown).
2. Generate ~3 design variants, scroll form.
3. Walk each variant in **scroll mode**, rating every slot U / C / P / ★.
4. Pick a preferred variant — possibly remixing favorite slots across variants.
5. Iterate "U" (urgent) slots first.
6. Iterate "C" (could-be-better) slots.
7. Confirm the preferred variant is not embarrassing in scroll form.
8. Port each scroll slot to **play mode** (per-slide Play-UI files).
9. Walk the play surface, rating every slot again (independently — porting may lose fidelity).
10. Ship when one column has every cell ≥ passable on both surfaces, ideally most ★, ideally scroll-rating == play-rating.

The TOC is the answer to *"where am I in this loop, right now?"*

## Scope boundary

**In scope:**

- **Audits schema v2 migration.** One entry per `(deck, variant, slot)` grows from `{status}` to `{scroll: {status, rankedAt, ...}, play: {status, rankedAt, ...}}`. Forward-compat reader for schema v1 (treat v1 `status` as `scroll.status` since that's the surface the v1 ratings were entered against — Phase A+ pill was scroll-mounted only).
- **`/api/slide-rank` POST surface.** Add a `surface: "scroll" | "play"` field to the POST body and to the on-disk record. GET unchanged in shape (returns the whole audit object; clients read whichever surface they care about).
- **SlideRankPill surface-aware.** New `surface` prop (`"scroll" | "play"`). The pill writes to that surface's branch. Default behavior matches mount context — scroll routes pass `surface="scroll"`; `DeckOverlay--Play-UI` passes `surface="play"` to the pill it composes.
- **New `/toc/[deck]/` matrix route.** Variants × slots grid. Per-cell paired chips. Per-column shippability rollup (dominant). Per-row drift indicator (subtle, right-edge).
- **Two SVG icons.** Scroll-glyph and play-glyph, balanced as a pair. Tooltips spell out "Scroll review" / "Play review". The chip itself is rating-only.
- **`/toc/[deck]/[variant]/` stays alive as a variant landing.** ~~Deprecate to redirect.~~ REVISED 2026-05-17: per-variant TOC is the "land in one variant" surface; the deck-level matrix is the cross-variant-comparison surface. Both have a place. Variant-name in matrix → per-variant TOC.
- **Cell click behavior — whole-half navigates, no inline editing.** Scroll half → `/scroll/{deck}/{variant}/#slot-NN`. Play half → `/play/{deck}/{variant}/{slot}/`. Rating editing happens via the SlideRankPill on the surface itself (one source of truth for the rate action).
- **Port-status folds into the cell.** No separate "ADAPTED" column. If the per-slide Play-UI file is missing, the play half renders dimmed/disabled — the absence IS the port-status signal.

**Out of scope (explicit defers):**

- **In-matrix rating.** Tempting; rejected for v1. Adds a second rate-action surface, a re-render path, and complicates "which is canonical when the matrix and pill disagree mid-write?" Defer until the read-only matrix proves insufficient.
- **Cross-deck dashboard.** `/toc/index` showing all decks side-by-side. Not needed; chroma is the only deck today.
- **Bulk re-rating tools.** "Mark all v2 slots as passable" etc. Defer to workflow-quirk phase.
- **Per-row "remix-from-multiple-variants" affordance.** The workflow step 4 ("possibly prefer the layout of individual slides in another variant") implies a slot-level variant-mixing feature. Out of scope here; the matrix surfaces the *decision* (clear cross-variant comparison) but doesn't yet act on it.
- **A.7 publish.** Still orthogonal. This plan stays in workspace-link mode.
- **Theming the new matrix.** Defaults inherit chroma's existing TOC palette; no new tokens. If the founder dislikes the visual register, that's a separate small plan.

## Preconditions

1. Phase A++.2 shipped (today, 2026-05-17). `/play/[slot].astro` consumes `<DeckOverlay--Play-UI>`; in-play SlideRankPill renders and persists. Build green.
2. Audits file at `client-sites/chroma-decks/data/audits/slides.json` contains ~17 entries from the 2026-05-12 scroll-side ranking session. Those entries are valuable user data and must migrate cleanly to schema v2.
3. Working tree clean except for the documented submodule-content drift on `calmstorm-decks/`. No other in-flight branches in dididecks-ai.

## Architecture decisions to lock before code

### A. Audits schema v2 shape

Schema v1 (today):

```json
{
  "schema": 1,
  "ranks": {
    "pitch/enhanced-v2/01": {
      "status": "perfect",
      "rankedAt": "2026-05-12T10:37:27.882Z",
      "rankedBy": "founder",
      "notes": null
    }
  }
}
```

Schema v2 (proposed):

```json
{
  "schema": 2,
  "ranks": {
    "pitch/enhanced-v2/01": {
      "scroll": {
        "status": "perfect",
        "rankedAt": "2026-05-12T10:37:27.882Z",
        "rankedBy": "founder",
        "notes": null
      },
      "play": {
        "status": "passable",
        "rankedAt": "2026-05-17T19:02:15.881Z",
        "rankedBy": "founder",
        "notes": null
      }
    }
  }
}
```

**Migration rule.** On first read of a schema 1 file, the loader rewrites it to schema 2 in-memory and persists the rewrite on the next write. The v1 `status` becomes `scroll.status` (since Phase A+ pill was scroll-only). `play` is absent for v1-rooted entries — the matrix renders an empty play chip (distinct from "pending" — empty means "never rated"; pending means "explicitly cleared").

**One-time migration script** at `apps/deck-shell/scripts/migrate-audits-v1-to-v2.ts` for the founder to run manually after pulling this plan's commits. The loader's auto-rewrite covers it lazily, but a one-shot script lets the founder verify the migration before any writes happen.

### B. `surface` field — required at write, optional at read

POST `/api/slide-rank` requires `surface: "scroll" | "play"`. The route refuses requests without it (400) — eliminates "ambiguous old client" ambiguity. The SlideRankPill always sends it. GET returns the full audit blob; clients project the surface they care about.

The shell's `RankEntry` type splits into `SurfaceRankEntry` (the inner `{status, rankedAt, rankedBy, notes}`) and `RankEntryV2` (the outer `{scroll?, play?}`). The TOC reads both surfaces per row.

### C. SlideRankPill — surface as a prop, no auto-detect

Auto-detection ("am I inside DeckOverlay--Play-UI? then I'm play-mode") is too magical. Make it an explicit prop:

```astro
<SlideRankPill deckSlug variantSlug surface="scroll" />     <!-- scroll mount -->
<SlideRankPill deckSlug variantSlug surface="play" position="top-right" />  <!-- play mount -->
```

`DeckOverlay--Play-UI` passes `surface="play"` to the SlideRankPill it composes. Chroma's scroll route updates to pass `surface="scroll"` explicitly. The pill's inline script includes `surface` in its POST body. No backwards-compat default — if a consumer omits the prop, log a one-time console warning and default to `"scroll"` to preserve v1 behavior; this gives consumers time to update without breaking writes.

### D. Two SVG icons — `<ScrollIcon>` and `<PlayIcon>`

Paired, visually balanced, ~16×16, currentColor-fillable, line-drawn. Initial sketch:

- **ScrollIcon** — a downward arrow inside a narrow vertical rectangle, suggesting "scroll down the page". (Alternates: mouse-wheel; page-down glyph; column with horizontal lines + chevron.)
- **PlayIcon** — the classic ▶ rightward-pointing triangle inside a square frame, matching the calmstorm aesthetic.

Both as inline `<svg>` Astro components at `apps/deck-shell/src/components/icons/`. Draft three pairs at the start of the build, founder picks one.

### E. Per-column shippability banner — the dominant rollup

At each variant-column header:

```
ENHANCED-V3
SCROLL  ●14  ⬢2  ◐0  ✖0    ┐
PLAY    ●9   ⬢4  ◐2  ✖1    ┘  → "READY" badge if both surfaces all ≥ passable
                                otherwise: "2 of 16 need work" (count of non-≥P)
```

Glyphs (★ ● vs P ⬢ vs C ◐ vs U ✖) carried directly into the rollup; tooltips on each. The "READY" badge is the binary signal that says "this column is shippable." It's green when both `scroll` and `play` for every slot in this variant are ≥ passable.

### F. Per-row drift indicator — the subtle rollup

At each slot-row's right edge, a small `≠` symbol when at least one cell in the row has scroll-status ≠ play-status. Hovering shows which variants drifted and what the drift was. Click does nothing; this is a glance affordance only.

For row aggregate "best across variants" — defer. Too much, and the drift indicator is the more workflow-aligned signal.

### G. Route shape and registry

Inject one new route from the shell:

```
/toc/[deckSlug]                      → deck-level matrix (NEW)
/toc/[deckSlug]/[variantSlug]        → 302 to /toc/[deckSlug]?variant=X (existing route becomes redirect)
```

The `?variant=X` query param scrolls the matrix horizontally so that column is centered, and adds a subtle ring around it. No backend rendering change beyond the redirect.

## Phase 1 — Audits schema v2 migration

Goal: the storage layer supports two surfaces per (slot, variant) without losing v1 data.

1. Update `apps/deck-shell/src/types/index.ts`:
   - `SurfaceRankEntry` = today's `RankEntry` (`{status, rankedAt, rankedBy, notes}`).
   - `RankEntryV2` = `{scroll?: SurfaceRankEntry, play?: SurfaceRankEntry}`.
   - `Audit` becomes `{schema: 2, ranks: Record<string, RankEntryV2>}`.
2. Update `registry-loader.ts` `loadAuditRegistry`:
   - If file has `schema: 1`, transform each `ranks[k]` from `{status, ...}` to `{scroll: {status, ...}}`. Return as schema 2 in memory.
   - On next `writeAuditRegistry`, persist as schema 2 (the in-memory rewrite naturally flows through).
3. Add `apps/deck-shell/scripts/migrate-audits-v1-to-v2.ts` — one-shot CLI that reads the audits file, applies the same transform, writes it back. Founder runs once per consumer site that has audits.
4. Run migration manually against `client-sites/chroma-decks/data/audits/slides.json` and verify the 17 enhanced-v2 entries land under `scroll.status` cleanly.

**Acceptance:** schema v1 file loads as v2; v1 ratings appear under `scroll` and not under `play`; `pnpm build` green.

## Phase 2 — `/api/slide-rank` surface-aware POST

Goal: the rank endpoint writes to the correct surface.

1. Extend POST body shape to require `surface: "scroll" | "play"`.
2. Validate: 400 if `surface` missing or not in `{scroll, play}`.
3. Apply write: `audit.ranks[key] ??= {}; audit.ranks[key][surface] = {...entry}`. For `status === "pending"` delete only that surface; if both surfaces are absent after deletion, remove the key entirely.
4. GET unchanged (returns whole audit).

**Acceptance:** POST `surface="scroll"` writes only `scroll.status`; POST `surface="play"` writes only `play.status`; the other surface untouched.

## Phase 3 — SlideRankPill surface-as-a-prop

Goal: the pill writes to whichever surface it's mounted on.

1. Add `surface: "scroll" | "play"` prop to `SlideRankPill.astro`.
2. Pill renders `data-surface={surface}` on the root element.
3. The pill's inline GET reads `audit.ranks[key]?.[surface]?.status` (not just `audit.ranks[key]?.status`).
4. The pill's inline POST adds `surface` to its body.
5. The pill's title-bar UI says "Scroll review" or "Play review" — small label change so the founder always knows which surface they're rating from.
6. **Backcompat warning:** if `surface` prop is omitted, console.warn once and default to `"scroll"`. Removed in a later release.
7. Update `DeckOverlay--Play-UI.astro` to pass `surface="play"` to the composed pill.
8. Update `chroma-decks/src/pages/scroll/pitch/enhanced-v3/index.astro` `<DeckOverlayScrollUI>` so the pill inside passes `surface="scroll"`. (Or wire `DeckOverlay--Scroll-UI` to set it by default — likely the right move; check the component.)

**Acceptance:** rating a slot from `/scroll/.../enhanced-v3/` writes to `scroll.status`; rating the same slot from `/play/.../enhanced-v3/05/` writes to `play.status`; both visible in the audits file.

## Phase 4 — Two SVG icons

Goal: scroll-glyph and play-glyph, balanced as a pair.

1. Draft three pairs in `apps/deck-shell/src/components/icons/` (e.g. `ScrollIcon.astro`, `PlayIcon.astro`).
2. Render all three pairs on a one-off `/dev/icons` page for founder review.
3. Founder picks one; remove the other two.
4. Final pair exported via `@dididecks/shell/components/icons/ScrollIcon.astro` and `.../PlayIcon.astro`.

**Acceptance:** two `<svg>` Astro components, currentColor-fillable, balanced when placed side-by-side at 16px, founder-approved.

**Stop-and-show point:** founder picks icon pair before Phase 5 begins.

## Phase 5 — `/toc/[deck]/` matrix route

Goal: the new deck-level matrix.

1. Inject route `/toc/[deckSlug]` at `apps/deck-shell/src/routes/toc-deck.astro`.
2. `getStaticPaths` enumerates decks (not variants).
3. Page-level: load all variants for this deck, all slots for each variant (union into rows by slot/slug identity), and the full audit blob.
4. Render the matrix:
   - Header row: per-variant column with the shippability banner (scroll counts | play counts | READY badge).
   - Body rows: per-slot, one cell per variant.
   - Each cell: `<ScrollIcon><Chip status={ranks[k].scroll?.status} />` link to `/scroll/{deck}/{variant}/#slot-NN` + `<PlayIcon><Chip status={ranks[k].play?.status} />` link to `/play/{deck}/{variant}/{slot}/`.
   - Disabled / dimmed play half if the per-slide Play-UI file does not exist (uses the existing `perSlideFileExists` helper).
   - Right-edge of each row: `≠` if any variant in this row has scroll != play.
5. Chip palette inherits from chroma's existing TOC palette tokens; no new tokens introduced.
6. `?variant=X` query — vanilla anchor + a CSS ring on the matching column. No JS required if implemented via `:target` or a query-param-driven class.

**Acceptance:** `/toc/pitch/` renders the matrix; every cell links to the correct surface; the READY badge appears on variants where every cell is ≥ passable on both surfaces; the drift indicator appears on rows with scroll != play.

**Stop-and-show point:** founder opens `/toc/pitch/`, confirms the matrix answers "which variant is closest to ready" at a glance.

## Phase 6 — Keep `/toc/[deck]/[variant]/` as the variant landing (REVISED 2026-05-17)

Goal: the per-variant TOC stays alive as the **variant landing/index** — distinct from the deck-level matrix.

The original Phase 6 ("deprecate to a redirect") was a wrong call surfaced during in-flight review. The two surfaces serve different needs:

- **`/toc/[deck]/` matrix** — cross-variant comparison. "Which variant is closest to ready? Where's the drift between scroll and play?"
- **`/toc/[deck]/[variant]/` per-variant TOC** — land in one variant. "What slots are in this variant? What's each one's status? What's available for me to open?"

Both have a place. Folding the per-variant TOC into a redirect would lose the "land in one variant" surface — exactly the affordance the founder reaches for when clicking a variant name in the matrix header. Confirmed during 2026-05-17 in-flight review: variant-name in matrix → per-variant TOC.

Revised Phase 6 scope (smaller, more sensible):

1. **Keep `apps/deck-shell/src/routes/toc.astro`** as-is functionally. It already reads via `preferredSurfaceEntry` for dual-surface awareness. No deprecation.
2. **Audit internal links** to verify the per-variant URL is reachable as a landing target (matrix variant name → it; chroma's variant cards → it). No regressions.
3. **Polish pass** if needed — make the page feel like a variant landing, not just a slot list. Could include: variant lede above the table, a "Now showing in matrix view ↗" link back to `/toc/[deck]/?variant={v}`, scroll/play surface launch buttons paralleling the matrix's per-column rows. This is judgment-pass work, not load-bearing.

**Acceptance:** clicking a variant name in the matrix header lands at `/toc/[deck]/[variant]/` and shows that variant's slot list. No broken links anywhere in chroma's build output. Per-variant TOC has a clear identity distinct from the deck-level matrix.

## Phase 7 — Cross-cutting verification + version bump

Goal: ship cleanly with no regressions.

1. `pnpm build` against chroma — all routes green, 46+ static pages emitted.
2. Manual smoke-test:
   - `/toc/pitch/` matrix renders with chroma's audits.
   - Click scroll-chip in cell → `/scroll/pitch/enhanced-v3/#slot-05` (or wherever).
   - Click play-chip in cell → `/play/pitch/enhanced-v3/05/`.
   - Rate slot 05 in `/scroll/` → reload `/toc/pitch/` → scroll-chip updates.
   - Rate slot 05 in `/play/` → reload `/toc/pitch/` → play-chip updates.
   - Drift `≠` appears on row 05.
3. Old TOC URL `/toc/pitch/enhanced-v3/` redirects cleanly.
4. Bump `apps/deck-shell/package.json` from `0.1.0-rc.0` to `0.1.0-rc.2`.
5. Bump audits schema noted in changelog.
6. Submodule pointer bump in `dididecks-ai`.

**Acceptance:** build green, all surfaces round-trip, founder confirms the matrix is the right shape.

## Stop-and-show points

1. **End of Phase 1** — audits migrated. Founder opens the audits JSON and sees v1 entries now nested under `scroll`. Quick check.
2. **End of Phase 4** — founder picks icon pair from three drafts. Blocks Phase 5.
3. **End of Phase 5** — the big one. Founder opens `/toc/pitch/` and either says "yes, this is the workflow view I wanted" or names a specific further gap.

## Open questions to resolve in flight

1. **Anchor format for `/scroll/{variant}/#slot-NN`.** Chroma's scroll route uses `<section data-slot="01">` — does it also have `id="slot-01"`? If not, anchors won't work; either add the IDs or use `?focus=01` + JS scroll-into-view. Verify in Phase 5.
2. **READY badge threshold.** "Every cell ≥ passable on both surfaces" — does "empty / never rated" count as ≥ passable, or as a blocker? Default: blocker (a never-rated slot is unverified, so the column isn't ready). Founder confirms in Phase 5.
3. **Variant column width on narrow viewports.** Four variants × two chips each gets crowded under 1200px. Sticky first column + horizontal scroll on small viewports? Or collapse to "stacked variant cards" under a breakpoint? Decide in flight; default to horizontal scroll.
4. **Drift severity gradation.** A `U`-on-scroll vs `★`-on-play is a much louder drift than `P`-vs-★. Worth a coloured indicator (yellow vs red) or is "≠ exists / doesn't exist" enough? Defer; v1 binary, iterate if founder asks.
5. **The "remix" affordance.** Workflow step 4 says the founder may pick slot 03 from v2 and slot 09 from v3. The matrix surfaces the comparison but doesn't act on it. Out of scope here — but worth a follow-up plan: a "blessed slot" concept where per-(slot,variant) carries an extra `blessed: true` flag, and a "build chimera variant" affordance walks blessings into a new variant. Capture as a follow-up.
6. **/toc/index for multi-deck dashboard.** Not needed today (chroma is the only deck). If/when dididecks grows a second client deck, revisit.

## Follow-up plans this work queues

These are *separate* plans this work makes possible:

1. **Blessed-slot remix affordance.** Per-(slot, variant) flag + a chimera-variant builder that walks blessings into a new variant. Workflow step 4 made literal.
2. **In-matrix rate-from-TOC.** Add the SlideRankPill's 4-button mini-pill to each cell so the founder can rate without navigating. Requires resolving "what's canonical" — defer until the read-only matrix proves insufficient.
3. **Phase B — full calmstorm primitive lift.** Still queued. Unchanged by this plan.
4. **Phase A.7 — publish.** Still blocked on org-name decision. Unchanged by this plan.

## Cross-references

- [[../explorations/Plans-Inventory-2026-05-16]] — current state of the union; this plan extends Path A and folds in a TOC-iteration thread the founder had flagged.
- [[Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety]] — A++.2 (just shipped) is the precondition for play-side rating writes.
- [[Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]] — Step 7 (chroma override sheet) is the other partial-shipped plan; both touch the chroma-side theming surface but don't conflict.
- [[../sitemap/components/DeckOverlay--Play-UI]] — composes the surface-aware SlideRankPill this plan extends.
- [[../sitemap/components/SlideRankPill]] — surface prop lives here.
- [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — parent spec; this plan operationalizes "review status as workflow state".
- `deck-iteration-workflow` skill — the workflow this plan literalizes into a UI.
- `context-vigilance` skill (status-discipline reference) — for the status-sweep at the end of each phase.
- Calmstorm-decks `client-sites/calmstorm-decks/src/pages/index.astro` — the reference TOC pattern this plan adopts (with the dual-surface extension).

## Status / next step

**Status:** Draft, ready for founder approval.

**Immediate next step on approval:** Phase 1 — audits schema v2 migration. Smallest contained change; lays groundwork for everything else.

**Total estimated effort:** Phases 1–3 are small (under an hour each). Phase 4 is bounded by founder-icon-picking. Phase 5 is the substance — half a day for the matrix to be the right shape. Phase 6 is trivial. Phase 7 is verification. Total: roughly one focused day plus a quick founder check-in for the icons.

**Required from the founder during execution:** (a) confirm v1 → v2 audits migration looks right after Phase 1; (b) pick the icon pair after Phase 4; (c) the *big* one — confirm the matrix is the workflow view they wanted after Phase 5.

---
title: "Port Enhanced-v2 Scroll Slides to Static 16:9 Play Slides for PDF Export"
lede: "The scroll deck for chroma's pitch/enhanced-v2 is shippable by the founder's design eye, but its sections live in a scroll-flow context — `min-h-screen` heights, brand-orb gradients that bleed across section boundaries, the customer marquee animation — that won't export cleanly to PDF. This plan ports each of the 16 v2 sections, non-destructively, into static 16:9 per-slide files under `src/components/slides/enhanced-v2/{slot}-{slug}.astro` so the existing /play/[deck]/[variant]/[slot]/ runtime renders them at a predictable aspect ratio. Then a one-shot print route stacks all 16 vertically, ⌘P saves as PDF, deck ships to founder tonight. Tomorrow's Phase A++ (calmstorm-grade /play chrome + SlideCanvas/ContentFit lift) is orthogonal and not blocked by this."
date_authored_initial_draft: 2026-05-12
date_authored_current_draft: 2026-05-12
date_authored_final_draft: 2026-05-12
date_first_published: 2026-05-12
date_last_updated: 2026-05-16
at_semantic_version: 0.0.1.0
status: Shipped
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Plan
tags:
  - Deck-Iteration-Workflow
  - Phase-2-Decompose-Recreate
  - Non-Destructive-Port
  - Static-16x9
  - PDF-Export
  - Chroma-Decks
  - Enhanced-v2
  - Ship-Tonight
  - Founder-Ready
authors:
  - Michael Staton
date_created: 2026-05-12
date_modified: 2026-05-12
from: "dididecks-ai"
from_path: "context-v/plans/Port-Enhanced-v2-Scroll-Slides-to-Static-16x9-Play-Slides-for-PDF-Export.md"
---
# Port Enhanced-v2 Scroll Slides to Static 16:9 Play Slides for PDF Export

> Operational plan executing the **Phase 2 → Phase Present** boundary of the `deck-iteration-workflow` skill against chroma's `/scroll/pitch/enhanced-v2/`. The scroll deck is design-approved. Goal: a PDF in the founder's inbox tonight.

## Why this plan exists

Three concrete facts make this urgent and small:

1. **Scroll deck v2 is shippable.** The founder confirmed it (slot 01 perfect, 08 perfect, 09 perfect, 16 perfect; the rest passable or non-urgent-could-be-better). Design iteration is complete for shipping purposes; deeper tweaks ride along after.
2. **The scroll layout doesn't export to PDF cleanly.** Three categories of problems:
   - `min-h-screen` ties section height to viewport, not to a fixed canvas. Print rendering picks whichever viewport the browser had open.
   - `.v2-orb` brand-gradient circles use `position:absolute` with negative offsets (`top:-15vw; right:-15vw`) so they bleed *across* section boundaries in the scroll page. Print engines either clip them or carry them onto neighboring pages.
   - `.v2-marquee` is a CSS keyframe animation (the customer ticker). Printing captures it mid-frame at whatever the browser was rendering.
3. **The infrastructure already exists.** The `@dididecks/shell` /play runtime injects routes at `/play/[deckSlug]/[variantSlug]/[slot]/` and renders per-slide files at `src/components/slides/{variant}/{slot}-{slug}.astro` via `import.meta.glob`. Empty slots fall back to `<DecomposeFirstPlaceholder />`. Sixteen v2 SLOTS are already registered. **Each port lights up its own /play URL with zero shell-side changes.**

Phase A++ (calmstorm-grade /play chrome, SlideCanvas + ContentFit lift) is the *bigger* visual-fidelity story. This plan defers all of that. Tonight is about getting the PDF out.

## Non-destructive guarantee (per deck-iteration-workflow)

The scroll deck — `client-sites/chroma-decks/src/pages/scroll/pitch/enhanced-v2/index.astro` — is **not modified** by this plan. Every per-slide file is a fresh recreation under `src/components/slides/enhanced-v2/{slot}-{slug}.astro`. Both render targets coexist; the scroll page keeps rendering exactly as it does today.

If a port goes badly, delete the per-slide file. The scroll deck is unaffected.

## Scope boundary

**In scope:**
- Port all 16 enhanced-v2 scroll sections into static 16:9 per-slide files.
- One new shell-side route (`/play/[deck]/[variant]/print/`) that lays all 16 slots on one page for one-shot ⌘P → PDF.
- Browser print-to-PDF the whole deck.
- Hand it to the founder.

**Out of scope (explicit defers — picked up in Phase A++ or later):**
- Calmstorm-grade /play visual chrome (SlideCanvas, ContentFit, ResizeObserver scale transforms). Tomorrow.
- Touching the scroll deck. Not now, not as part of this plan.
- New content authoring beyond what's in scroll today.
- Per-slide content for variants other than enhanced-v2. The proto / enhanced-v1 / enhanced-v3 variants stay as they are.
- Auto-export pipeline (Playwright + CI). One-shot ⌘P is enough for tonight; pipeline is Phase E.

## Preconditions

1. `pnpm dev` runs cleanly on chroma-decks; the floating rank pill works on `/scroll/pitch/enhanced-v2/`. ✅ (verified earlier today)
2. `SLOTS["enhanced-v2"]` exists in `client-sites/chroma-decks/src/data/slides.ts` with all 16 entries. ✅
3. `/play/pitch/enhanced-v2/01/` (and 02–16) currently render `<DecomposeFirstPlaceholder>`. ✅
4. Audit registry shows all 16 v2 slots ranked. ✅ — informs port order:
   - **Perfect (4):** 01 cover, 08 case-study-xai, 09 competition, 16 closing — port last (least likely to surprise).
   - **Passable (6):** 02, 03, 04, 12, 13, 15 — port middle.
   - **Could-be-better (2):** 07, 10 — port middle-late, may want a small tweak during port.
   - **Urgent-redo (4):** 05, 06, 11, 14 — *port these first*. They've already been redesigned in this session; the redesigns now need a static-canvas counterpart anyway.

## Architecture decisions to lock before code

### A. Canvas shape — 1920×1080 fixed pixels, not aspect-ratio responsive

Each per-slide file renders into a fixed-pixel canvas:

```css
.play-slide {
  width: 1920px;
  height: 1080px;
  position: relative;
  overflow: hidden;
}
```

Why fixed pixels instead of `aspect-ratio: 16/9` + `100vw`:

- Print engines size pages from CSS pixel dimensions, not from viewport ratio. Using fixed 1920×1080 means the PDF page renders predictably regardless of which browser window prints it.
- 1920×1080 is the canonical "fullHD" presentation size that Keynote / Google Slides / PowerPoint all map cleanly to.
- All `clamp()` viewport-scaled type in the scroll deck collapses to a single computed size at this canvas dimension. We can pick the size that *would* render at 1920px wide and bake it in.

Tradeoff: at smaller viewport widths the play slide will overflow / scroll horizontally. That's fine — `/play/` is the *presentation* surface, not a responsive deck. We're optimizing for export and projector display.

### B. Page route for printing — `/play/[deck]/[variant]/print/`

A new shell-side route that:
- Enumerates SLOTS for the variant
- Renders every slot back-to-back on one page, each in its own 1920×1080 box
- Inserts `page-break-after: always` between slots so ⌘P → "Save as PDF" produces 16 pages

The route uses the same `import.meta.glob` lookup as `[slot].astro`. Slots with no per-slide file get the `<DecomposeFirstPlaceholder>` (so we can see progress mid-port).

CSS for the print container:

```css
@page {
  size: 1920px 1080px landscape;
  margin: 0;
}
@media print {
  .print-slide {
    width: 1920px;
    height: 1080px;
    page-break-after: always;
    overflow: hidden;
  }
}
```

### C. Port pattern — copy markup, swap container, freeze animations

Every per-slide file follows this template:

```astro
---
/*
 * Slot NN — {Title}  (enhanced-v2, static 16:9 port)
 *
 * Static recreation of the matching section in
 * /scroll/pitch/enhanced-v2/. No min-h-screen, no marquee animation,
 * no viewport-dependent clamp() — sized to render at exactly 1920×1080.
 */
import "../../../styles/global.css";
---
<section class="play-slide" data-slot="NN" data-variant="enhanced-v2">
  {/* … content lifted from scroll-deck section, adapted per the rules below … */}
</section>

<style>
  .play-slide {
    width: 1920px;
    height: 1080px;
    position: relative;
    overflow: hidden;
    background: <whatever the scroll-section bg is>;
    color: <whatever the scroll-section text color is>;
  }
  /* ...scoped styles lifted from the scroll page or section... */
</style>
```

Rules for the per-section adaptation:

| Scroll-deck pattern | Static-canvas adaptation |
|---|---|
| `min-h-screen w-full overflow-hidden` | `width: 1920px; height: 1080px; overflow: hidden` (on .play-slide) |
| `px-[clamp(2rem,5vw,7rem)]` | Resolve at 1920 viewport: `clamp(2rem, 5vw, 7rem) @ 1920 = clamp(32px, 96px, 112px) = 96px`. Use `padding: 96px` directly. |
| `text-[clamp(7rem,17vw,19rem)]` | Resolve at 1920: `17vw = 326px`, clamped to `19rem = 304px`. Use `font-size: 304px`. Bake the computed value. |
| `.v2-orb` with negative offsets | Keep the orbs but verify they're clipped by the section's `overflow: hidden`. Adjust offsets if they extend beyond the new canvas in a way that crops the highlight badly. |
| `.v2-marquee` (animated ticker) | Replace with a static row: render the customers as a single non-overflowing line. If they don't fit, truncate to top 8 or wrap to 2 lines. |
| `scroll-snap-align: start` | Remove. No scroll context. |
| `@media (min-width: 768px) → md:col-span-N` | Keep — at 1920 the md: breakpoint always applies. (Optional: hard-bake the grid spans.) |

### D. Animations — none in the static canvas

The `v2-marquee` keyframe animation on the slot-03 customer ticker is the only time-based animation in the deck. The static port replaces it with a non-animated horizontal flex row of the 13 cloud customers. If they don't fit at 1920px wide, drop to the first 10 and let the design speak.

Other "animations" (the cobalt pulse on the slot-09 competition matrix, the orb glows) use `animation: pulse` or static blur — visual treatments that print fine at whatever frame the browser captures. No action needed.

### E. Type sizes — pre-compute clamp() at 1920px

Every `text-[clamp(min, vw, max)]` resolves to a single value at the static canvas width. Bake those into the per-slide file rather than keeping clamp(). Quick reference:

- `1vw at 1920px = 19.2px`
- `5vw = 96px`, `10vw = 192px`, `15vw = 288px`, `18vw = 345.6px`, `20vw = 384px`
- `clamp(min, Nvw, max)` resolves to `max(min, min(N × 19.2, max))`

Example: `text-[clamp(7rem,17vw,19rem)]` → `clamp(112px, 326.4px, 304px)` → **304px** (capped). Use `text-[304px]` or `font-size: 19rem`.

### F. PDF export — Chromium print, not Playwright (tonight)

For tonight: open `/play/pitch/enhanced-v2/print/` in Chrome/Edge, ⌘P, "Save as PDF", paper size = "Manage custom sizes" → 1920×1080 px (or landscape A4 if the founder needs standard format), margins = "None", background graphics = ON. Done.

Playwright/automated pipeline can come later; it's not in the critical path for tonight.

## Phase 0 — Print route + canvas template (30 min)

Goal: the print route exists and renders one *real* static slot so the pattern is validated before we port the other 15.

1. Add `apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/print.astro` — a shell-injected route mirroring `[slot].astro` but enumerating all slots for the variant and emitting them stacked vertically with `page-break-after: always` between them, plus the `@page` rule for 1920×1080 landscape.
2. Inject the route in `apps/deck-shell/src/index.ts` alongside the existing `/play` patterns.
3. Add CSS for `.play-slide` and the print container in a shared shell stylesheet that `print.astro` imports.
4. Pick **slot 14 (use-of-funds)** as the validation port. Why: it has the percent-column collision we just fixed *and* the `Number go up!` eyebrow; clear visual signature to check the port preserved the design.
5. Create `client-sites/chroma-decks/src/components/slides/enhanced-v2/14-use-of-funds.astro` per Decision C's template.
6. Visit `/play/pitch/enhanced-v2/14/` in dev — confirm it renders at 1920×1080.
7. Visit `/play/pitch/enhanced-v2/print/` — confirm slot 14 renders inline alongside 15 `<DecomposeFirstPlaceholder>` slots, with page breaks.
8. ⌘P preview the print route — confirm slot 14 prints at one page, 1920×1080, no margins, no glitches.

**If slot 14 prints clean, the pattern works. Proceed to Phase 1.**
**If not, iterate on the canvas CSS / @page rules before porting 15 more slots.**

## Phase 1 — Port the four urgent-redo slots (~90 min)

Goal: 05, 06, 11, 14 done. These are the ones whose scroll versions got the most iteration today; the most likely to need careful porting.

1. **Slot 05 — Bottleneck → Solution.** Two-column flow diagram with cobalt beam. Risks: SVG arrow positioning, orb clipping. Port at 1920×1080.
2. **Slot 06 — Difficult problems.** Two lists (system + data). Largely typographic. Easy port — bake the clamp() values and go.
3. **Slot 11 — Backed by.** Quiet Capital hero + operators grid. Risks: the operator-grid flex-wrap behavior at 1920px width may need a column-count adjustment to look balanced.
4. **Slot 14 — Use of funds.** Already done in Phase 0.

Validation: visit each `/play/.../{slot}/` in dev, eyeball against the scroll counterpart, confirm visual register holds. Print preview each.

## Phase 2 — Port the eight passable slots (~120 min)

Goal: 02, 03, 04, 07, 10, 12, 13, 15 done.

Port order driven by visual complexity (simpler first to build velocity):
1. **Slot 02 — Opening.** Almost just a headline. ~10 min.
2. **Slot 04 — Market.** $113B hero + 3-row info table. ~15 min.
3. **Slot 13 — Capital efficiency.** Bar chart. ~20 min (chart layout is the hard part).
4. **Slot 12 — Business model.** Funnel composition. ~20 min.
5. **Slot 15 — The ask.** Just iterated; recreate at 1920×1080 with same Series A / $12M stack + info column. ~15 min.
6. **Slot 03 — Traction.** Hero metric + KPI stack + ticker. Marquee → static row. ~25 min.
7. **Slot 07 — Two segments.** Mirror layout, two Chroma boxes. Largely structural. ~20 min.
8. **Slot 10 — Team.** Names-as-typography composition. Tricky; the flex-wrap may need a different grid at 1920px. ~25 min.

## Phase 3 — Port the four perfect slots (~45 min)

Goal: 01, 08, 09, 16 done. Last because they're least likely to surprise.

1. **Slot 01 — Cover.** Asymmetric composition with orbs. ~10 min.
2. **Slot 08 — Case-study-xAI.** Hero quote + Powering box + Also-powering ticker. ~15 min.
3. **Slot 09 — Competition.** 2×2 matrix with pulsing chroma dot. ~15 min.
4. **Slot 16 — Closing.** Mirrors the cover. ~5 min (often a near-copy of slot 01).

## Phase 4 — Print + ship (~20 min)

1. Visit `/play/pitch/enhanced-v2/print/` in Chrome.
2. ⌘P → custom paper size 1920×1080 → margins None → background graphics ON.
3. "Save as PDF" → `chroma-pitch-enhanced-v2.pdf`.
4. Visually flip every page in Preview. Sanity-check:
   - No clipped content.
   - No mid-animation freeze frames.
   - No missing fonts (Inter and IBM Plex Mono are fontsource-provided; should embed correctly).
   - All 16 slot numbers visible, in order.
5. Email / Slack / DM the PDF to the founder.
6. Sleep. Phase A++ tomorrow.

## Stop-and-show points

Just one: **end of Phase 0.** Slot 14 prints cleanly → proceed. Otherwise iterate on the canvas pattern before scaling to 15 more slots.

## Open questions to resolve in flight

1. **Custom paper size in browser print dialog.** Chrome/Edge support custom paper sizes but the UI varies. If 1920×1080 isn't easy to set, fall back to a standard landscape page (Letter or A4 landscape) and let the slides be slightly cropped or letterboxed. Decide in Phase 0 print test.
2. **Background graphics.** Vercel-deployed sites sometimes have aggressive background-clip rules. Confirm the orbs and gradient backgrounds print correctly in Phase 0.
3. **PDF file size.** Sixteen 1920×1080 slides with gradient orbs and fontsource-embedded fonts could push 5–10 MB. If too large for email, host on the existing splash deploy and send a link.
4. **Marquee replacement on slot 03.** The customer-ticker animation in scroll-mode is part of the design's energy. Static replacement: a single horizontal row of all 13 names. If they don't fit, decide whether to wrap to 2 lines or truncate. Decide during the slot 03 port.
5. **The "by Q4 2026" caption on slot 14.** Currently above the $10M numeral. At 1920×1080 it might float into the gradient. Check during Phase 1 port.

## Follow-up plans this work queues

1. **Phase A++ — calmstorm-grade /play chrome + SlideCanvas/ContentFit lift.** Tomorrow. Replaces the fixed 1920×1080 canvas with a viewport-fitting ContentFit so the same per-slide files render at any browser size. The static per-slide files from this plan are forward-compatible — `<SlideCanvas>` just wraps them.
2. **Automated PDF export pipeline.** Playwright script that hits each /play URL, sets viewport, captures, merges into PDF. Useful once decks change frequently and manual print is friction. Phase E or later.
3. **Per-variant ports.** Once v2 is shipped, the same port pattern applies to proto / enhanced-v1 / enhanced-v3 if they ever need PDF export. Probably won't — v2 is the canonical version for founder delivery.

## Cross-references

- `deck-iteration-workflow` skill — the Phase 2 → Phase Present boundary this plan operationalizes.
- [[Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]] — established the `/play/[deck]/[variant]/[slot]/` runtime + `import.meta.glob` per-slide pattern this plan consumes.
- [[Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety]] — the calmstorm primitive lift deferred to after this ships.
- [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — NS-2 "player so good they present live" is the eventual target; this is the static-export interim that gets the founder a PDF tonight without waiting for the full vision.

## Status / next step

**Status:** Draft, ready to execute right now.

**Immediate next step on approval:** Begin Phase 0 — author the `/play/[deck]/[variant]/print/` route, add canvas CSS, port slot 14 as the validation slide. ~30 min. If clean, the remaining 15 slots are mechanical ports.

**Total estimated effort:** ~5 hours of focused work end-to-end if the canvas pattern validates in Phase 0. Tonight is plausible.

**Required from the user during execution:**
- (a) confirm Phase 0 print preview looks clean before porting 15 more slots,
- (b) eyeball each ported slot at `/play/.../{slot}/` mid-port,
- (c) do the final ⌘P → Save as PDF (since the print dialog is interactive),
- (d) send the PDF.

Agent does (a)–(c)'s prep; user does the final review + send.

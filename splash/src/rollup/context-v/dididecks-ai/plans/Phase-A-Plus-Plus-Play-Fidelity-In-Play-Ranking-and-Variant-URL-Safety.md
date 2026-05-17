---
title: "Phase A++ — Play Fidelity, In-Play Ranking, and Variant URL Safety"
lede: "Phase A+ shipped the global nav, the floating in-scroll rank pill, a working `/play` runtime, two seeded per-slide files, and the TOC `[view →]` link — all the surfaces the founder asked for. Day-of smoke-test surfaced three concrete gaps: `/play/pitch/proto/` 404s because the proto variant has no `SLOTS[]` entry yet (the index-redirect was unconditional), the Play runtime doesn't yet have the elegant UI of calmstorm-decks (chrome feels like a dev tool, not a presentation surface), and the `<SlideRankPill>` is mounted in `/scroll` but not in `/play` even though the founder is reading-and-judging slides there too. Phase A++ closes all three without touching Phase A.7's still-blocked publish step, and seeds the calmstorm-primitive lift the larger Phase B will continue."
date_authored_initial_draft: 2026-05-12
date_authored_current_draft: 2026-05-12
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-16
at_semantic_version: 0.0.1.0
status: Partially-Shipped
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Plan
tags:
  - Dididecks-Shell
  - Phase-A-Plus-Plus
  - Play-Fidelity
  - In-Play-Ranking
  - Variant-URL-Safety
  - SlideCanvas-Lift
  - ContentFit-Lift
  - Calmstorm-Primitive-Lift
  - Non-Destructive-Adoption
  - Workspace-Link-Mode
authors:
  - Michael Staton
date_created: 2026-05-12
date_modified: 2026-05-12
from: "dididecks-ai"
from_path: "context-v/plans/Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety.md"
---
# Phase A++ — Play Fidelity, In-Play Ranking, and Variant URL Safety

> Plan of record for the next slice of `@dididecks/shell`, picking up where [[Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]] left off. Closes the three gaps the founder named within minutes of opening `pnpm dev` against the Phase A+ shell. Still operates in workspace-link mode; orthogonal to Phase A.7's publish.

## What Phase A+ accomplished (smoke-tested, working)

The Phase A+ session landed the entire scope of its plan. As of the 2026-05-12 smoke test:

- ✅ **Global nav `<DididecksNav>`** auto-mounted on `/toc/*` and `/play/*` shell routes, with `aria-current="page"` active state, brand slot, and consumer-side opt-in import path (`@dididecks/shell/components/DididecksNav.astro`). Reads the consumer's `DECKS` registry at render time so Scroll / TOC / Play links resolve to the first deck's first variant.
- ✅ **`<SlideRankPill>` floating overlay** mounted in chroma's `/scroll/pitch/enhanced-v3/`. Uses `IntersectionObserver` to detect the active `section[data-slot]`, hydrates the local rank cache from `GET /api/slide-rank`, posts back optimistically on click. Founder confirmed this works in-browser — "now I see it the floating rank pill."
- ✅ **`/play/[deckSlug]/[variantSlug]/[slot]/`** route injected. Renders the per-slide component if it exists at `src/components/slides/{variant}/{slot}-{slug}.astro` via `import.meta.glob`, falls back to `<DecomposeFirstPlaceholder>` if not. Build emits all 16 enhanced-v3 slot pages.
- ✅ **`/play/[deckSlug]/[variantSlug]/`** redirect route to slot 01.
- ✅ **`PlayChrome` wrapper** with the keyboard contract: ← / → / Space / Home / End / F / C / T / Esc. Bottom strip shows `{slot}/{total}` + variant label + ←/TOC/→ buttons.
- ✅ **`<DecomposeFirstPlaceholder>`** empty-slot fallback with link back to TOC (`?focus={slot}` query param).
- ✅ **Slot 01 — Cover (faithful recreation)** at `client-sites/chroma-decks/src/components/slides/enhanced-v3/01-cover.astro`. Self-contained styles + `import "../../../styles/global.css"` so v3-* tokens resolve in standalone play context.
- ✅ **Slot 15 — Ask (deliberate redesign)** at `15-ask.astro`. Mega-numeral `$12M` hero, two-column `Round` / `Status` `<dl>` blocks, milestones footer. No inline `<pre>` blocks. Plan deviation: original plan said "slot 16 — ask"; the page's actual section ordering placed ask at section 15 with COLOPHON at 16. Slides.ts reconciled to match the page.
- ✅ **TOC `[view →]` links** added on rows whose per-slide file exists. Verified 3 links (slots 01, 05, 15).
- ✅ **slides.ts reconciled** with the actual 16 page sections (renames: `category-size` → `market-context`; `vs-pinecone` slot 14 → slot 13; `ask` slot 16 → slot 15; new `colophon` at slot 16). Existing decompose stub at `05-bottleneck.astro` untouched. Audit registry key `pitch/enhanced-v3/05` continues to map cleanly.
- ✅ **Shell version bumped** from `0.0.1` to `0.1.0-rc.0` to signal in-flight pre-release.
- ✅ **Typecheck + build green.** Build emits 16 slot-page HTMLs + 4 variant-index redirects + the scroll + toc routes, all bytestable against pre-A+ except for the additive pill mount + data-attrs.

The founder verified in browser: the pill works, the nav renders, the play route loads. **Phase A+ is functionally complete.**

## What Phase A+ did NOT accomplish (the founder's three notes)

Direct quotes from the 2026-05-12 smoke test:

> **Note 1.** "Play 404 at `/play/pitch/proto/01/`."

The `/play/[deckSlug]/[variantSlug]/index.astro` redirect was authored unconditionally — it 302s to `{...}/01/` regardless of whether that slot exists. The `[slot].astro` route only emits paths for slot entries present in `SLOTS[variantSlug]`. Proto, enhanced-v1, and enhanced-v2 have no entries (only enhanced-v3 does). Result: the redirect target 404s for those variants.

> **Note 2.** "Play works, doesn't have an elegant UI like calmdecks, needs more fidelity to that UI we worked on it hard."

The Phase A+ `PlayChrome` is intentionally minimal — a thin top bar + bottom strip wrapping a `<slot />`. Calmstorm-decks has a mature `/play` runtime built across [[../explorations/Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] §"Mature primitives in calmstorm" with `PageAsDeckWrapper`, `SlideCanvas`, `ContentFit`, tier-aware `MetaTags`, `DeckHeader`, `DeckNav`, `GateScript`, and the brand-mark slot pattern. The shell shipped *none* of those in A+. The visual register gap is real and the founder named it specifically.

> **Note 3.** "Play doesn't seem to have the enum ranking UI to prioritize improvements."

The `<SlideRankPill>` lives only in `/scroll/`. The Phase A+ plan didn't include mounting it in `/play/` — the assumption was that ranking happens during scroll-reading. But the founder uses Play to *review* slides at presentation fidelity; that's exactly when "this one needs work" judgments form. The pill belongs in `/play/` too.

> **Note 4 (implicit).** "TOC is there, needs iteration."

Unspecified scope. Captured as an open question; Phase A++ does not pre-commit to specific TOC changes. The founder iterates on `/toc/` next session with concrete pointers.

## Scope boundary

**In scope:**

- **Variant URL safety.** `/play/[deck]/[variant]/` index route gates its redirect on `SLOTS[variantSlug]` existing and non-empty. Empty-SLOTS variant routes render a small "no slots yet" page that links back to `/toc/{deck}/{variant}/` (which itself shows the "Create slides.ts entry" hint).
- **Mount `<SlideRankPill>` inside `/play/`.** The pill renders in `PlayChrome`'s chrome area (above the bottom strip, or as a separate corner overlay). Same component, same `/api/slide-rank` round-trip. The pill watches the *currently-rendered* slot in Play (no IntersectionObserver needed — exactly one slot is on screen at a time).
- **Lift `SlideCanvas` + `ContentFit` from calmstorm into the shell.** Two related primitives that together make a slide render at a fixed aspect ratio (typically 16:9) and auto-fit content to viewport with a scale transform. These are the *minimum* visual-fidelity lift to make `/play/` feel like calmstorm-decks's play runtime, not a developer preview.
- **Refactor `PlayChrome`** to wrap its slot content in `SlideCanvas`. Adds the dotted-grid backdrop, the aspect-ratio container, the content-fit scale, and the (now standard) "slide-as-presentation" feel.
- **Keep the keyboard contract identical.** Founder muscle-memory must transfer between Phase A+ and Phase A++ without retraining.
- **Verify end-to-end** in `pnpm dev` and `pnpm build`. Static output should still emit 16 slot pages; chroma's scroll deck should be byte-stable.

**Out of scope (explicit defers):**

- **Phase A.7 publish.** Still orthogonal. Phase A++ remains in workspace-link mode. When A.7 unblocks, A+ and A++ ship together as `0.1.0`.
- **The rest of Phase B's calmstorm primitive lift.** `PageAsDeckWrapper`, tier-aware `MetaTags`, `DeckHeader`, `DeckNav`, `GateScript`, the brand-mark slot pattern, the mode-switcher behavior. Phase B territory. Phase A++ lifts just `SlideCanvas` + `ContentFit` because they are the visual-fidelity bottleneck the founder named — *not* the full mature primitive set.
- **Calmstorm-decks's own migration onto the shell.** Phase B.
- **TOC iteration.** Out until the founder provides specifics. The Phase A++ session may surface a TOC sub-plan if the founder shares pointers during execution.
- **Auth + telemetry + admin.** Phase D.
- **Per-slide content authoring beyond slots 01 + 15.** Founder runs the rank → decompose → recreate loop at her own pace.
- **The `/play/[deck]/` deck-chooser route.** The shell's `/play/index.astro` redirect logic is fine for now; the deck-chooser surface lives in the consumer's `src/pages/play/index.astro` (chroma already has this).

## Preconditions

1. Phase A+ is shipped and verified (as of 2026-05-12 smoke-test). All deliverables above marked ✅ are working in `pnpm dev`.
2. `apps/deck-shell/package.json` is at `0.1.0-rc.0`. Phase A++ will bump to `0.1.0-rc.1` at the end.
3. Founder is available for one stop-and-show check after A++.3 lands (the first `SlideCanvas`-wrapped Play render is the moment where "does this look like calmstorm?" is answerable).
4. Calmstorm-decks is on its `development` branch with the existing `SlideCanvas`, `ContentFit`, and `PageAsDeckWrapper` in `client-sites/calmstorm-decks/src/components/` reachable from the dididecks-ai pseudomonorepo. (Don't move; just read.)

## Architecture decisions to lock before code

### A. Variant URL safety — gate the redirect, render a "no slots" page if absent

Current behavior (A+):

```
GET /play/pitch/proto/         → 302 /play/pitch/proto/01/
GET /play/pitch/proto/01/      → 404 (slot was never emitted by getStaticPaths)
```

New behavior (A++):

```
GET /play/pitch/proto/         → 200 "no slots yet" page if SLOTS[proto] empty/undefined
GET /play/pitch/proto/         → 302 /play/pitch/proto/01/ if SLOTS[proto] has entries
GET /play/pitch/proto/01/      → 404 unchanged (the slot doesn't exist; correct)
```

The "no slots yet" page mirrors the existing `<DecomposeFirstPlaceholder>` aesthetically: shell-styled, links to `/toc/{deck}/{variant}/` (which surfaces the "create slides.ts entry" affordance), explains the contract.

**Rationale:** the redirect lying to the user is worse than no redirect. A 404 from a static deploy is jarring; a friendly explanation page is a known-state surface. Render-time check (in `index.astro` frontmatter) on `SLOTS[variantSlug]?.length ?? 0`.

### B. In-play ranking — mount the existing `<SlideRankPill>` inside `PlayChrome`

The same component, re-mounted. Differences from the scroll-deck mount:

- **No IntersectionObserver needed.** Exactly one slot is on screen at a time. The pill reads `slot` and `variantSlug` from `PlayChrome`'s known render context.
- **Position.** Bottom-right is taken by the play bottom-strip (slot counter, ←/TOC/→ buttons). Place the play-mode pill at top-right, or as an inline element in the bottom strip (small icon + status).
- **Visibility.** Hideable via `C` (chrome toggle) along with the rest of the chrome.
- **No fetch on every navigation.** Cache the audit registry once per page load; surface the current slot's rank from cache.

**Component reuse strategy:** add a `mode: "scroll" | "play"` prop to `<SlideRankPill>`. The mode prop:
- `scroll` (default): existing behavior — IntersectionObserver-driven, fixed bottom-right
- `play`: takes the active slot from a prop (`activeSlot: string`), positions in the play-mode location

This keeps the component logic and the API surface stable; the consumer just passes `mode="play"` and an `activeSlot`.

### C. Lift `SlideCanvas` + `ContentFit` — minimum-viable calmstorm primitive lift

`SlideCanvas` (calmstorm) provides:
- Fixed aspect-ratio container (typically 16:9)
- Optional dotted-grid backdrop
- A `<ContentFit>` child that auto-scales its contents to fit the canvas via CSS scale transform + ResizeObserver

`ContentFit` (calmstorm) provides:
- Measures children at natural size
- Computes the scale factor that fits inside the parent's aspect-ratio box
- Applies `transform: scale(N) translate(...)` to center

Together they make a slide that's authored at "natural" size (typically a 1280×720 or 1920×1080 conceptual canvas) render correctly at any viewport. This is what makes calmstorm's `/play` feel like a finished presentation and not a webpage with a header.

**Lifting strategy:**
1. Read `client-sites/calmstorm-decks/src/components/SlideCanvas.astro` and `ContentFit.astro` (or wherever they live).
2. Copy into `apps/deck-shell/src/components/SlideCanvas.astro` + `ContentFit.astro`. Strip any calmstorm-specific brand assets / mode toggles (those are Phase B).
3. Export from `@dididecks/shell/components/SlideCanvas.astro` (and `ContentFit.astro`).
4. Refactor `PlayChrome` to wrap its `<slot />` in `<SlideCanvas><ContentFit>...</ContentFit></SlideCanvas>`.

**The seed slides update accordingly.** `01-cover.astro` and `15-ask.astro` are currently authored as min-height-100vh sections. Inside `SlideCanvas`, the canvas controls min-height; the slide's content should drop the min-height-100vh and let `ContentFit` handle sizing. Two-file edit.

**Calmstorm-decks itself is NOT migrated in this plan.** Calmstorm continues using its own local copies. The shell version becomes the canonical version; calmstorm migrates to the shell version in Phase B. (This is the standard "fork, stabilize, replace" lift pattern.)

### D. Visual-fidelity acceptance criterion

After Phase A++ lands, the founder opens `/play/pitch/enhanced-v3/01/` and `/play/pitch/enhanced-v3/15/` and says "yes, this looks like a presentation" — or names a specific further gap. The plan's success criterion is *the founder confirming the visual register lifted enough* — not a pixel-perfect match to calmstorm.

If after A++.3 + A++.4 the founder says "still doesn't look like calmstorm," the followup is Phase B's larger primitive lift (`PageAsDeckWrapper`, mode-switcher, brand-mark, `DeckHeader`, `DeckNav`). That's a *separate* plan, not a continuation of A++.

### E. `pnpm dev` discipline — kill background servers between iterations

Phase A+ surfaced a workflow trap: leaving `pnpm dev` running across edits caused HMR caching that masked real bugs (the slot-child rendering quirk took an extra hour to diagnose because the dev server cached intermediate states). Phase A++ session discipline:

- One `pnpm dev` at a time. Kill before edits to shell/components.
- After major edits to the shell, hard-restart dev (kill + restart).
- Use `pnpm build` for final verification — caching doesn't apply there.

## Phase A++.1 — Variant URL safety

Goal: `/play/{deck}/{variant}/` never redirects to a slot that doesn't exist.

1. **Refactor `apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/index.astro`** to read `SLOTS[variantSlug]` and branch:
   - If non-empty: redirect to slot 01 as today.
   - If empty/undefined: render an inline "no slots yet for this variant" panel using the shell's nav + a small explainer + a link to the TOC.
2. **Smoke-test:** `/play/pitch/proto/`, `/play/pitch/enhanced-v1/`, `/play/pitch/enhanced-v2/` all render the empty-state panel; `/play/pitch/enhanced-v3/` still redirects to `01/`.
3. **Build verification:** `pnpm build`. The three "no slots" variant indexes emit as static HTML.

Acceptance: no 404 reachable from a click anywhere on the site.

## Phase A++.2 — `<SlideRankPill>` mode prop and play-mode mount

Goal: rank a slot from within `/play/` without leaving the page.

1. **Add `mode` prop** to `<SlideRankPill>` with default `"scroll"`. Implement the `"play"` branch:
   - Skip the `IntersectionObserver` setup.
   - Accept `activeSlot` prop (string, e.g. `"01"`).
   - Position via `top: 16px; right: 16px;` (top-right) when mode is `"play"`.
   - Otherwise same UI, same status buttons, same `/api/slide-rank` POST behavior.
2. **Update `PlayChrome`** to mount `<SlideRankPill mode="play" deckSlug={deckSlug} variantSlug={variantSlug} activeSlot={slot} />` next to the nav (or in the chrome top-right corner).
3. **Hide via `C` chrome toggle** — already wrapped in `.dididecks-play__chrome`, so it toggles automatically.
4. **Smoke-test:** open `/play/pitch/enhanced-v3/05/`, the pill shows current rank (urgent-redo — already set in audits). Click a different status; navigate away and back; rank persisted.

Acceptance: pill renders in Play, ranking from Play persists into the same audits file the scroll and TOC read.

## Phase A++.3 — Lift `SlideCanvas` + `ContentFit`

Goal: the shell carries calmstorm-grade slide-canvas primitives, usable by any future Play wrapper.

1. **Read calmstorm's implementations** at `client-sites/calmstorm-decks/src/components/SlideCanvas.astro` and `ContentFit.astro` (or wherever they live — discover first).
2. **Copy + strip** into `apps/deck-shell/src/components/SlideCanvas.astro` and `ContentFit.astro`. Remove any calmstorm-specific brand / mode wiring. Keep:
   - The aspect-ratio container math.
   - The dotted-grid backdrop (theme-tokenized — `var(--color-border)` for dots).
   - The `ContentFit` ResizeObserver + scale-transform pattern.
3. **Add `aspectRatio` prop** (default `"16/9"`) to `SlideCanvas` for forward-compatibility.
4. **Export** via `@dididecks/shell/components/SlideCanvas.astro` and `ContentFit.astro`.
5. **Typecheck.**

Acceptance: the two components exist, are exported, are typesafe, and render a 16:9 box around their children with the children scaled to fit.

## Phase A++.4 — `PlayChrome` consumes `SlideCanvas`

Goal: `/play/` renders slides at presentation fidelity, not as webpage sections.

1. **Refactor `PlayChrome.astro`** to wrap its `<slot />` in `<SlideCanvas><ContentFit>...</ContentFit></SlideCanvas>`. The stage area becomes a fixed-aspect canvas with the slide content scaled.
2. **Update seed slides** (`01-cover.astro`, `15-ask.astro`):
   - Drop `min-height: 100vh` from the section (canvas controls height).
   - Set explicit "natural" dimensions if `ContentFit` requires them (calmstorm pattern likely needs a sized inner element).
   - Verify visual fidelity in dev.
3. **Update `DecomposeFirstPlaceholder`** similarly so it lives inside the canvas too — placeholders should look like a presentation slot saying "this is empty," not a half-page message.
4. **Stop-and-show point:** founder opens `/play/pitch/enhanced-v3/01/` and `/play/pitch/enhanced-v3/15/`. Founder confirms "looks like calmstorm" or names a specific further gap.

Acceptance: Play renders with fixed aspect ratio, scaled content, calmstorm-grade visual register. Founder verifies the gap is closed (or identifies the next slice for Phase B).

## Phase A++.5 — Cross-cutting verification + version bump

Goal: ship A++ cleanly with no regressions.

1. **Scroll-deck byte-stability.** `pnpm build`; compare `dist/scroll/pitch/enhanced-v3/index.html` size to pre-A++ baseline. Should be unchanged (no edits to scroll-side files in A++).
2. **TOC unchanged.** Same nav, same `[view →]` links, same rank pills. No regressions.
3. **`/play/pitch/{proto,enhanced-v1,enhanced-v2}/`** all show the empty-state panel; no 404 reachable.
4. **`/play/pitch/enhanced-v3/{01..16}/`** all render. Slot 01 + slot 15 with real content (inside SlideCanvas), slots 02–14 + 16 with placeholder (inside SlideCanvas).
5. **In-play ranking persistence.** Rank slot 16 via Play, navigate to TOC, see the rank reflected.
6. **Bump version** in `apps/deck-shell/package.json` from `0.1.0-rc.0` to `0.1.0-rc.1`.
7. **Commit shape:**
   - `add(deck-shell, play): variant URL safety + no-slots empty-state page` *(A++.1)*
   - `add(deck-shell, slide-rank-pill): mode=play prop + mount in PlayChrome` *(A++.2)*
   - `add(deck-shell, slide-canvas): lift SlideCanvas + ContentFit from calmstorm` *(A++.3)*
   - `update(deck-shell, play-chrome): wrap slot in SlideCanvas for presentation fidelity` *(A++.4)*
   - `update(chroma-decks, slides/enhanced-v3): drop min-height-100vh from cover + ask for canvas-wrapped render` *(submodule side, A++.4)*
   - Submodule pointer bump in dididecks-ai.

Acceptance: build green, dev round-trips all five surfaces, founder confirms `/play/` fidelity.

## Stop-and-show points

1. **End of A++.1** — variant URL safety. The founder clicks `/play/pitch/proto/` and sees a friendly panel, not a 404. Quick check; trivial.
2. **End of A++.2** — in-play ranking works. The founder ranks a slot from Play; the rank shows up in TOC. Visible signal of "this works."
3. **End of A++.4** — the big one. The founder opens `/play/pitch/enhanced-v3/01/` and either says "yes, looks like calmstorm now" or names the next visual gap.

## Open questions to resolve in flight

1. **`SlideCanvas` aspect ratio default.** 16:9 is the safe default for fundraise decks. But chroma's enhanced-v3 has a long-form vertical feel — does that translate to 4:3 instead? Open: stay 16:9 default; consumer-overridable per-slot if needed (Phase B).
2. **`ContentFit` for overflowing content.** Some slides may have content taller than the natural canvas. ContentFit's scale-transform shrinks fonts; what if shrinking makes them illegible? Open: cap minimum scale at e.g. 0.5; below that, allow scrolling within the canvas? Decide in flight.
3. **Position of the in-play rank pill.** Top-right vs. inline-in-bottom-strip vs. floating-overlay-mode-aware. Decide in flight; default to top-right and iterate if the founder dislikes.
4. **TOC iteration scope.** Captured as TBD. The founder will name specifics; A++ does not pre-commit. A separate small plan (or an A++.6 step) can fold in late if the founder shares pointers mid-session.
5. **`<SlideRankPill>` in production builds.** Phase A+ left this as "keep visible; revisit if disliked." Still open. With the play-mode mount, the pill is now on more pages in production; the question of dev-only vs. always-on may bind sooner.

## Follow-up plans this work queues

These are *separate* plans Phase A++ makes possible:

1. **Phase B — full calmstorm primitive lift.** `PageAsDeckWrapper`, tier-aware `MetaTags`, `DeckHeader`, `DeckNav`, `GateScript`, the mode-switcher behavior, the brand-mark slot pattern. Calmstorm-decks itself migrates onto the shell in this phase. Larger scope, requires a quiet calmstorm window. A++.3 + A++.4 are the *seed* of this lift.
2. **Phase A.7 — publish.** Still blocked on the org-name decision. A.7 unblocks independently of A++.
3. **TOC iteration sub-plan.** Authored once the founder shares specifics. May be a one-pager.
4. **Per-slide content sprint.** Founder fills in slots 02–14 + 16 at her own pace via the rank → decompose → recreate loop. Not a "plan" — it's the framework's iteration rhythm. The `deck-iteration-workflow` skill is the doc for it.
5. **Componentize-Slides destination retarget.** One-paragraph edit; still queued; doesn't block.

## Cross-references

- [[Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]] — Phase A+. This plan's preconditions. All A+ deliverables are now ✅.
- [[Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]] — Phase A. A.1–A.6 complete; A.7 still blocked on org name.
- [[../explorations/Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] — the architecture exploration. Phase A++ pulls forward the first slice of Phase B (SlideCanvas + ContentFit) because the founder named it as the visual-fidelity bottleneck.
- [[../explorations/Plans-Inventory-and-Phase-A-Outcome]] — the gap-analysis exploration that framed A+.
- [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — parent spec; NS-2's "player so good they present live" is what `SlideCanvas` lift starts unlocking.
- `deck-iteration-workflow` skill — the rhythm A++ continues operationalizing (rank → decompose → recreate → present).
- `astro-knots` skill — framework prohibitions A++ inherits.
- `theme-system` skill — relevant for the SlideCanvas dotted-grid backdrop tokenization.

## Status / next step

**Status:** Draft, ready for the next agent (or this one in a fresh session) to execute.

**Immediate next step on approval:** Begin Phase A++.1 — refactor `/play/[deck]/[variant]/index.astro` to gate the redirect on `SLOTS[variantSlug]` existing. Smallest, most contained change; ships in under 30 minutes.

**Total estimated effort:** A++.1 + A++.2 are small (under an hour each). A++.3 is the calmstorm-read + copy-and-strip — half a day if `SlideCanvas` and `ContentFit` are well-isolated in calmstorm, longer if they have deep dependencies that also need to come over. A++.4 is the integration — half a day with the founder's eye on visual fidelity. A++.5 is verification — under an hour. Total: roughly one focused day of agent-augmented work.

**Required from the user during execution:** (a) confirm the no-slots empty-state copy after A++.1; (b) confirm the in-play pill position after A++.2; (c) the *big* one — confirm the visual fidelity after A++.4. The founder is the only one who can sign off on "this looks like calmstorm now."

## Remaining work (as of 2026-05-16)

This plan is partially shipped. What's done and what's left:

### Shipped
- **A++.3 — SlideCanvas lift (partial).** `apps/deck-shell/src/components/SlideCanvas.astro` exists (pure-CSS 16:9 wrapper using container queries). Composed by `/play/[slot]` route today and slot files self-wrap inside it.
- **A++.4 — `/play/[slot]` consumes SlideCanvas.** Wired and rendering for chroma's three playable variants (proto, enhanced-v2, enhanced-v3).
- **A++.5 — version + verification.** Shell bumped to `0.1.0-rc.0`; `pnpm build` green; chroma builds + Vercel-previews cleanly.

### Not yet shipped
- **A++.1 — variant URL safety.** `/play/[deck]/[variant]/` index.astro still redirects unconditionally. Variants without per-slide files still 404 after the redirect. *Side-effect mitigation:* the new `/play/` chooser (chroma-side, 2026-05-16) AND-intersects file × `SLOTS` so it can no longer *link* to those routes — but typed URLs still 404.
- **A++.2 — in-play classifier mount.** `SlideRankPill` is reachable in Play-UI structurally via `<DeckOverlay--Play-UI>` (new, 2026-05-16), but `/play/[slot].astro` has not been refactored to consume the overlay. So the pill renders in Scroll-UI only today.
- **A++.3 — ContentFit lift (the other half).** `SlideCanvas` shipped without its calmstorm sibling `ContentFit`. Slides whose natural size exceeds the canvas don't scale-fit; they clip. Lift `ContentFit.astro` from calmstorm into the shell and wire `SlideCanvas` to compose it.

### Other notes
- The `SlideRankPill` position prop (`bottom-right` | `top-right`) added 2026-05-15 was the structural prerequisite for A++.2. The remaining work is the route refactor.
- The DeckOverlay components landed 2026-05-15 expose the right shape for A++.2 (composes DeckChrome + SlideRankPill with section-wrap adapter); see [[../sitemap/components/DeckOverlay--Play-UI]].

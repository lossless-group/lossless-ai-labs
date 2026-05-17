---
title: "Phase A+ — In-Deck Ranking, Shared Nav Chrome, and a Working /play Runtime"
lede: "After Phase A landed `@dididecks/shell` with a working TOC + slide-ranking API + decomposition-stub generator, three concrete gaps surfaced on first founder smoke-test: no global navigation chrome connecting Scroll · TOC · Play, no way to rank a slide *from within* the scroll deck (you have to leave for a separate route), and nothing to verify the /play runtime works because the shell injects no /play route yet and chroma has no per-slide files for one to render. Phase A+ closes all three together — shell-injected global nav, a shell-exported `<SlideRankPill>` floating overlay the founder drops into the scroll deck via data-attrs, a minimum-viable `/play/[deckSlug]/[variantSlug]/[slot]?` route with ← / → keyboard nav, and two seeded per-slide files in chroma so the whole loop (rank → decompose → recreate → present) is provable end-to-end. All in workspace-link mode; Phase A.7's publish step is orthogonal."
date_authored_initial_draft: 2026-05-12
date_authored_current_draft: 2026-05-12
date_authored_final_draft: 2026-05-12
date_first_published: 2026-05-12
date_last_updated: 2026-05-16
at_semantic_version: 0.0.1.0
status: Shipped
post_ship_note: |
  All A+ deliverables shipped 2026-05-12 (verified in the A++ doc + the
  2026-05-12_02 changelog). This plan's framing of TOC + Scroll + Play
  as "same content viewed three ways" was later sharpened — Scroll-UI
  and Play-UI are two coordinated implementations with different
  constraints, not two views of the same content. See CLAUDE.md
  "Naming is fuzzy here" for the corrected framing.
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Plan
tags:
  - Dididecks-Shell
  - Phase-A-Plus
  - Global-Nav-Chrome
  - In-Scroll-Rank-Pill
  - Floating-Overlay
  - Play-Runtime
  - Keyboard-Nav
  - Phase-1-to-Phase-2-Bridge
  - Non-Destructive-Adoption
  - Workspace-Link-Mode
authors:
  - Michael Staton
date_created: 2026-05-12
date_modified: 2026-05-12
from: "dididecks-ai"
from_path: "context-v/plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime.md"
---
# Phase A+ — In-Deck Ranking, Shared Nav Chrome, and a Working `/play` Runtime

> Plan of record for the next slice of `@dididecks/shell`, picking up where [[Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]] left off (A.1–A.6 complete, A.7 administratively blocked). Closes the three gaps documented in [[../explorations/Plans-Inventory-and-Phase-A-Outcome]] §"The three gaps the founder named". Operates entirely in workspace-link mode — does not depend on A.7's publish step, and benefits when A.7 eventually resolves without requiring rework.

## Why this plan exists

Phase A shipped the smallest provable slice: an integration that injects a TOC + a ranking API + a non-destructive stub generator. That slice proved the architecture but left three specific surfaces missing — three surfaces that the founder identified within minutes of smoke-testing the running shell against chroma.

The three gaps in plain language:

1. **A reader cannot navigate between Scroll, TOC, and Play in one click.** Each surface is its own URL and has its own (or no) header. The mental model of "same content viewed three ways" is invisible.
2. **A founder cannot rank a slide without leaving the scroll deck.** Today's only rank surface is the TOC at `/toc/[deck]/[variant]/`. Reading-and-ranking the natural way (in-place while scrolling) is impossible. **Neither calmstorm nor chroma has this today** — it is genuinely new framework territory.
3. **Nothing verifies the `/play` runtime works.** The shell injects no `/play` route. Chroma's `src/pages/play/` is empty by design ([[Init-Chroma-Decks-Client-Site]] deferred it). The decomposition-stub generator writes empty files at `src/components/slides/{variant}/{slot}-{slug}.astro` but nothing consumes them.

Phase A+ closes all three in a single coherent slice. It is the natural Phase 1 → Phase 2 → Phase Present loop the deck-iteration-workflow skill points at, made concrete end-to-end against chroma's enhanced-v3 variant.

## Scope boundary

**In scope:**

- A shell-injected **global navigation header** mounted on all shell routes (TOC, Play) AND exported as a `<DididecksNav>` component the consumer can import into their own scroll-deck routes.
- A shell-exported **`<SlideRankPill>`** floating-overlay component that the consumer drops into a scroll deck once (not per-section), which detects the active section via `IntersectionObserver` and provides in-place ranking via the existing `/api/slide-rank` endpoint.
- A shell-injected **`/play/[deckSlug]/[variantSlug]/[slot]?`** route with ← / → keyboard navigation, F-fullscreen, C-chrome-toggle. Renders per-slide files from the consumer's `slidesComponentsRoot`; renders a "decompose first" placeholder for slots without files.
- **Two seeded per-slide files** in chroma's `src/components/slides/enhanced-v3/` so the `/play` route renders real content end-to-end (not just placeholders). One faithful recreation, one deliberate redesign — to prove the variant-per-slide pattern from the start.
- A small revision to the **TOC route** so that decompose-button-clicked slots get a link to `/play/.../[slot]/` once their file exists (closes the loop from the TOC side).
- End-to-end verification in `pnpm dev` and `pnpm build`.

**Out of scope (explicit defers):**

- **Phase A.7's publish step.** Orthogonal. Phase A+ runs in workspace-link mode; when A.7 resolves, Phase A+'s changes ship in the same release with Phase A's.
- **Auth + telemetry + admin** (Phase D of [[Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]]).
- **Lifting calmstorm's mature primitives** (`PageAsDeckWrapper`, `SlideCanvas`, `ContentFit`, tier-aware `MetaTags`, `GateScript`, calmstorm's full `DeckHeader` / `DeckNav`). Phase B territory; Phase A+ builds a *minimum* nav fresh, not a lift.
- **Calmstorm's migration onto the shell.** Phase B.
- **Per-slide *content* authoring beyond the two seed files.** The founder fills in the rest at her own pace via the rank → decompose → recreate loop.
- **SSR / realtime / per-client database.** V2 hook per the exploration.
- **The componentization plan's destination retarget.** One-paragraph edit; queued under exploration Open Question #4. Not blocking; not in this plan.

## Preconditions

1. Phase A.1–A.6 is in place. `apps/deck-shell/` exists, builds, and is consumed by chroma via `"@dididecks/shell": "workspace:*"`. `pnpm install` from the **dididecks-ai root** (not from inside chroma-decks — see [[../explorations/Plans-Inventory-and-Phase-A-Outcome]] for the `ignore-workspace=true` story) resolves cleanly.
2. `pnpm dev` from inside chroma at `localhost:4321/toc/pitch/enhanced-v3/` renders the TOC with 16 slot rows.
3. **Workspace discipline.** All edits to the shell happen at `apps/deck-shell/src/...`. All edits to chroma happen at `client-sites/chroma-decks/...`. The shell's `package.json` is bumped from `0.0.1` to `0.1.0-rc.0` at the end of A+.5 to signal an in-flight pre-release; the actual `0.1.0` ship happens at A.7 (which Phase A+ does not gate on).
4. Don't commit chroma's `package.json` change (`"@dididecks/shell": "workspace:*"`) to chroma-decks's GitHub repo until A.7 publishes. See [[Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]] Phase A.6 caveat.

## Architecture decisions to lock before code

### A. Global nav — auto on shell routes, opt-in elsewhere

The shell **mounts the nav automatically** on every route it injects (TOC, Play). For routes that live in the **consumer's** `src/pages/` (chroma's scroll deck index, variant indexes, homepage, changelog), the nav is **opt-in via import** — the consumer adds `<DididecksNav />` where appropriate.

Rationale: shell routes are uniformly shell-controlled; consumer routes have their own design language (chroma's scroll deck uses a different visual register than the TOC, and the founder may want different chrome on the homepage vs. a deck). Making the nav opt-in on consumer routes preserves consumer flexibility while ensuring shell routes are uniform.

Tier-awareness: today the nav renders Scroll · TOC · Play · Changelog when at `private` tier. When `share`/`public` tiers land in Phase B, the nav adds Design System / Components / etc. conditionally.

### B. In-scroll rank pill — floating overlay with IntersectionObserver, not per-section inline

The shell exports **one** component, `<SlideRankPill>`, that the consumer drops into a scroll-deck variant **once** (not per-section). The component:

- Reads `data-slot="01"` and `data-variant="enhanced-v3"` from sibling `<section>` elements in the scroll deck.
- Uses `IntersectionObserver` to detect which section is centered in viewport.
- Renders a small fixed-position pill (bottom-right corner, low-opacity until hovered) showing the current section's rank + 5 status buttons.
- Clicking a button POSTs to `/api/slide-rank` (the same endpoint the TOC uses) and updates the pill optimistically.

Rationale for floating overlay over inline-per-section:
- **Less invasive.** Consumer adds two data-attrs to existing `<section>` tags (a 16-line edit for chroma's enhanced-v3). No new component imports per slide section.
- **More leveraged.** One mounted component handles all 16 slots automatically.
- **Better UX.** A small persistent pill avoids cluttering the slide content; it appears where the reader's hand is (on the trackpad / mouse), not embedded in the slide design.

Consumer integration looks like this in chroma's existing enhanced-v3 variant (illustrative, not the full file):

```astro
---
import { SlideRankPill } from "@dididecks/shell/components";
const deckSlug = "pitch";
const variantSlug = "enhanced-v3";
---
<PageAsDeckWrapper>
  <section data-slot="01" data-variant="enhanced-v3">… cover content …</section>
  <section data-slot="02" data-variant="enhanced-v3">… abstract content …</section>
  …
  <SlideRankPill deckSlug={deckSlug} variantSlug={variantSlug} />
</PageAsDeckWrapper>
```

### C. `/play` route shape — slot-in-URL for shareable links

The shell injects two routes:

| Route | Behavior |
|---|---|
| `/play/[deckSlug]/[variantSlug]/` | Redirects to slot 01 (the first slot in the variant's registry). |
| `/play/[deckSlug]/[variantSlug]/[slot]/` | Renders that slot. ← / → keyboard nav moves between slots. URL updates as user navigates. |

The slot URL is the **shareable unit**. `/play/pitch/enhanced-v3/05/` is the URL the founder shares with a partner who needs to look at slot 05 specifically.

### D. Per-slide file rendering — dynamic component import at build time

At build time, the shell scans `slidesComponentsRoot/{variantSlug}/` for `.astro` files matching the slot pattern `{slot}-{slug}.astro`. For each match, it emits a static slot page. For each *missing* file (the slot is in the registry but no per-slide file exists yet), it emits a placeholder page with a link back to the TOC ("Decompose this slot first").

The dynamic component import uses Astro's standard pattern:

```astro
---
// apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/[slot].astro (illustrative)
const { variantSlug, slot, slug } = Astro.params; // (params derived from getStaticPaths)
const opts = globalThis.__dididecksShellOptions!;
const Component = await import(/* @vite-ignore */
  `${opts.absolute.slidesComponentsRoot}/${variantSlug}/${slot}-${slug}.astro`
).then(m => m.default).catch(() => null);
---
{Component ? <Component /> : <DecomposeFirstPlaceholder slot={slot} ... />}
```

`@vite-ignore` because the path is computed and Vite's static analysis would warn. The catch fallback handles the missing-file case so the build never fails on an un-decomposed slot.

### E. Keyboard contract for `/play`

Matches calmstorm's `/play` runtime by convention so muscle memory transfers when calmstorm migrates onto the shell:

| Key | Action |
|---|---|
| `→` / `Space` / `PageDown` | Next slot |
| `←` / `Shift+Space` / `PageUp` | Previous slot |
| `Home` | First slot |
| `End` | Last slot |
| `F` | Toggle fullscreen |
| `C` | Toggle chrome (hide / show nav header) |
| `T` | Jump back to TOC for this variant (`/toc/[deck]/[variant]/`) |
| `Esc` | Exit fullscreen / show chrome |

### F. ModeToggle inside the nav — defer to consumer's existing one

The shell's nav **does not** include a ModeToggle in Phase A+. Chroma's existing `ModeToggle.astro` continues to work on consumer routes. Lifting the ModeToggle behavior into the shell as a canonical runtime is Phase B (exploration step 14). Phase A+ keeps the nav minimal: links only.

## Phase A+.1 — Shell-provided global nav

Goal: a shell-mounted header consistent across `/toc/*`, `/play/*`, and any consumer routes that opt in.

1. **Author `apps/deck-shell/src/components/DididecksNav.astro`.** Renders a horizontal nav with conditional links derived from the consumer's deck registry:
   - `Scroll` → `/scroll/{firstDeckSlug}/` (first deck in the registry's default variant, since `/scroll` itself is a chooser in chroma).
   - `Play` → `/play/{firstDeckSlug}/{firstVariantSlug}/01/` (first slot of the first variant).
   - `TOC` → `/toc/{firstDeckSlug}/{firstVariantSlug}/`.
   - `Changelog` → `/changelog/` (consumer-side; renders only if the consumer has the route).
   - Brand mark slot — a `<slot name="brand"></slot>` the consumer can override with their wordmark. Default: text `dididecks · {client}` from the integration options.
2. **Add a route-scope option** for which links are active. The current route's path is read from `Astro.url.pathname`; the matching nav link gets an `aria-current="page"` attribute and a visual active state.
3. **Refactor `apps/deck-shell/src/routes/toc.astro`** to import and mount `<DididecksNav />` at the top of the body. Adjust the existing TOC header styles so the nav sits above gracefully.
4. **Inject the nav automatically into all shell routes** by importing it from the route files (toc.astro, /play routes from Phase A+.3). No separate "layout" abstraction needed yet — direct import is simpler for v0.1 of the nav.
5. **Export from `@dididecks/shell/components`.** Update `apps/deck-shell/package.json` exports map if needed (already covers `./components/*`).
6. **Typecheck + smoke-test:** `pnpm --filter @dididecks/shell typecheck` clean; navigate to `/toc/pitch/enhanced-v3/` and confirm nav renders with Scroll / Play / TOC / Changelog all clickable.

Acceptance: nav appears on TOC route, links resolve, active-state pseudo-class shows on the current route's link.

## Phase A+.2 — In-scroll-deck `<SlideRankPill>` floating overlay

Goal: founder can rank slots from within `/scroll/pitch/enhanced-v3/` without leaving the page.

1. **Author `apps/deck-shell/src/components/SlideRankPill.astro`.** Astro frontmatter is minimal (reads `deckSlug` + `variantSlug` props). The component renders an empty `<div data-slide-rank-pill>` and a `<script is:inline>` that:
   - Initializes an `IntersectionObserver` watching `section[data-slot][data-variant]` elements.
   - Tracks the active section (the one most centered in viewport).
   - On mount, fetches `GET /api/slide-rank` to populate the local ranks cache.
   - Renders the pill UI: fixed bottom-right, low-opacity initially, hover/focus to 1.0 opacity. Shows active section's title + current rank + 5 status buttons.
   - On status click: optimistic update + POST to `/api/slide-rank` with the active section's `{deckSlug, variantSlug, slot, status}`.
2. **Style the pill** with inline `<style>` scoped to the component. Tokens: respect `var(--bg)`, `var(--fg)`, `var(--accent)` from chroma's theme so the pill picks up chroma's light/dark/vibrant mode automatically. Pill width ~280px, height ~120px.
3. **Edit chroma's enhanced-v3 variant** at `client-sites/chroma-decks/src/pages/scroll/pitch/enhanced-v3/index.astro`:
   - Add `data-slot="01"` and `data-variant="enhanced-v3"` attributes to each of the 16 `<section>` tags. Match the slot numbers to chroma's `src/data/slides.ts` SLOTS list.
   - Import `<SlideRankPill>` and mount it once at the end of the wrapper.
4. **Verify in dev:** scroll through enhanced-v3, the pill should track the active section. Click status buttons; refresh; rank persists in `data/audits/slides.json`.
5. **Static-build verification:** `pnpm build`. The pill's mounted `<script>` is dev-AND-prod compatible (the GET fetch fails-soft against a non-existent prod endpoint; the optimistic POST also fails-soft). In production the pill is functionally a read-only display of build-time ranks — fine. *(Alternative: prerender-aware skip the pill when `import.meta.env.PROD` is true. Decide in flight; default keep-it-on for now.)*

Acceptance: scroll-deck shows the pill following section changes; ranking from within scroll persists into the same audits file the TOC reads.

## Phase A+.3 — `/play` route in the shell

Goal: shell-injected play runtime renders per-slide files with keyboard nav. Empty slots show a "decompose first" placeholder.

1. **Author `apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/[slot].astro`.** Frontmatter:
   - `getStaticPaths()` enumerates every `{deck, variant, slot}` combo from the consumer's `decks.ts` + `slides.ts` registries.
   - At render time: resolve the slot's `slug` from `SLOTS[variantSlug]`; compute the per-slide file path at `${slidesComponentsRoot}/${variantSlug}/${slot}-${slug}.astro`; attempt dynamic import; on success render the component, on miss render the placeholder.
   - Compute `prev` and `next` slot URLs for keyboard nav.
2. **Author `apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/index.astro`.** Just redirects to the first slot (`Astro.redirect(\`/play/\${deckSlug}/\${variantSlug}/01/\`)`).
3. **Wire the `injectRoute` calls** in `apps/deck-shell/src/index.ts`:
   ```ts
   injectRoute({
     pattern: "/play/[deckSlug]/[variantSlug]",
     entrypoint: new URL("./routes/play/[deckSlug]/[variantSlug]/index.astro", import.meta.url).href,
   });
   injectRoute({
     pattern: "/play/[deckSlug]/[variantSlug]/[slot]",
     entrypoint: new URL("./routes/play/[deckSlug]/[variantSlug]/[slot].astro", import.meta.url).href,
   });
   ```
4. **Author `apps/deck-shell/src/components/PlayChrome.astro`** — the wrapper that surrounds the rendered slot. Provides:
   - The keyboard listener (← / → / Space / F / C / T / Esc per Decision E).
   - A small bottom strip showing `{slotNumber} / {totalSlots}` + the variant label, hideable via C.
   - The shared `<DididecksNav />` at top (also hideable via C).
5. **Author `apps/deck-shell/src/components/DecomposeFirstPlaceholder.astro`** — the empty-slot fallback. Shows the slot title, a "this slot hasn't been decomposed yet" message, and a button linking back to `/toc/{deck}/{variant}/` with a query param suggesting `?focus={slot}`.
6. **Typecheck + smoke-test:** visit `/play/pitch/enhanced-v3/` → redirects to `/play/pitch/enhanced-v3/01/`. The cover slot is empty (no per-slide file), so the placeholder renders. ← / → keyboard moves between placeholders. F toggles fullscreen. T jumps to TOC.

Acceptance: every slot is reachable via ← / →; URL updates per slot; missing per-slide files render the placeholder cleanly; the build passes (`getStaticPaths` enumerates all slot URLs).

## Phase A+.4 — Seed two per-slide files in chroma to prove the loop

Goal: at least two of chroma's enhanced-v3 slots have populated per-slide files so `/play` renders real content for them, not just placeholders.

1. **Pick the seed slots.** Two recommended candidates:
   - **Slot 01 — Cover.** Faithful recreation: copy the cover section's content into `src/components/slides/enhanced-v3/01-cover.astro`. Keep the existing visual language (the v3-cover class, the headline, the eyebrow). This proves the play runtime can render a real slot that looks identical to its scroll-deck counterpart.
   - **Slot 16 — Ask.** Deliberate redesign: author the closing slot at component-library quality — large numerical emphasis on `$12M`, clean typographic hierarchy, no inline pre-blocks. This proves the play runtime can render a *better* version of a slot than the scroll deck currently has (the whole point of Phase 2 of the deck-iteration-workflow).
2. **Procedure for each:** use the TOC's `scaffold` button to create the empty stub if it doesn't already exist. Then hand-author the content in the resulting `.astro` file. **Non-destructive:** the single-page scroll deck variant stays as-is; the new per-slide files are independent renders.
3. **Update `client-sites/chroma-decks/src/data/slides.ts`** if any slot title/slug needs adjusting based on what shipped. (May not be necessary; check during the recreation pass.)
4. **Verify in dev:** `/play/pitch/enhanced-v3/01/` renders the cover slot real; `/play/pitch/enhanced-v3/16/` renders the redesigned ask; every other slot renders the placeholder.
5. **Verify in build:** `pnpm build` succeeds; `dist/play/pitch/enhanced-v3/{01,02,...,16}/index.html` all exist.

Acceptance: two real per-slide renders, fourteen placeholders, all reachable, all build-stable.

## Phase A+.5 — Cross-cutting verification

Goal: nothing else broke. The shell adoption remains purely additive.

1. **Scroll deck unchanged.** Open `/scroll/pitch/enhanced-v3/` in dev. Confirm visual output is identical to pre-Phase-A+ (modulo the new floating pill, which is a known addition). The 16 sections render exactly as before.
2. **TOC route updates.** The TOC at `/toc/pitch/enhanced-v3/` now:
   - Wears the global nav at the top.
   - Shows a `[view]` link on each row whose per-slide file exists, linking to `/play/pitch/enhanced-v3/{slot}/`.
3. **Build verification.** `pnpm build` from inside chroma. Inspect `.vercel/output/static/` and confirm:
   - `toc/pitch/{proto,enhanced-v1,enhanced-v2,enhanced-v3}/index.html` exist.
   - `play/pitch/enhanced-v3/{01,02,...,16}/index.html` exist (sixteen files).
   - `play/pitch/{proto,enhanced-v1,enhanced-v2}/...` exist *if* `slides.ts` has SLOTS entries for those variants (in Phase A+ they likely don't; the build skips them by emitting nothing, or emits empty placeholders depending on `getStaticPaths` semantics — decide in flight; either is acceptable).
   - `scroll/pitch/...` files exist with sizes within 5% of pre-Phase-A+ (the only added bytes should be the SlideRankPill mount + data-attrs).
4. **Bump the shell version** in `apps/deck-shell/package.json` from `0.0.1` to `0.1.0-rc.0`. Signals "Phase A+ included, but not yet published."
5. **Commit shape** (in the dididecks-ai monorepo, not chroma-decks):
   - `add(deck-shell, nav): inject global DididecksNav on shell routes + export for opt-in`
   - `add(deck-shell, slide-rank-pill): floating overlay component for in-scroll ranking`
   - `add(deck-shell, play): inject /play runtime with keyboard nav + decompose-first placeholder`
   - One commit on the chroma-decks submodule side: `add(slides, play): seed enhanced-v3 cover + ask per-slide files; wire SlideRankPill into scroll deck`
   - Submodule pointer bump in dididecks-ai.

Acceptance: dev exercises all five surfaces (Scroll, Scroll with floating pill, TOC, Play with real slot, Play with placeholder); static build is green; existing scroll deck is byte-stable (modulo additive script injection).

## What's left untouched after Phase A+

- Chroma's existing layouts (`PageAsDeckWrapper.astro`, `SlideShell.astro`), `ModeToggle.astro`, `Wordmark.astro` — all stay. The shell's nav is additive; the consumer's mode toggle and brand mark stay where they are.
- Chroma's 13 other variants (`proto`, `enhanced-v1`, `enhanced-v2`, the rest of `enhanced-v3`'s slots beyond 01 and 16) — untouched. The founder fills them in over time via the rank → decompose → recreate loop.
- Calmstorm's entire surface. No edits to `client-sites/calmstorm-decks/`. Calmstorm adopts the shell in Phase B.
- The Phase A.7 publish flow. When the org-name decision lands, A.7 runs the publish + version-range switch independently of Phase A+. Phase A+'s changes will be in the same `0.1.0` release.

## Stop-and-show points

Five natural pauses for founder verification:

1. **End of A+.1** — global nav renders on TOC. Click around between TOC, Scroll, Play. Confirm the nav model feels right; iterate on link order / labels before moving on.
2. **End of A+.2** — floating pill works in scroll deck. Scroll, rank a slot, see it persist. This is the first "in-place ranking" feeling — high signal-to-noise feedback moment.
3. **End of A+.3** — `/play` route renders placeholders end-to-end. ← / → navigation works. Founder confirms keyboard contract feels right before any real content lands.
4. **End of A+.4** — first real per-slide renders exist. The cover should look identical to its scroll-deck counterpart; the ask should look better. Founder verifies both.
5. **End of A+.5** — static build green, all routes accessible, nothing regressed.

## Open questions to resolve in flight

1. **`<SlideRankPill>` styling in production.** The pill is technically functional in production builds (the API routes are dev-only and POST attempts fail-soft). Should the build hide the pill when `import.meta.env.PROD` is true? Pro: cleaner production surface. Con: removes a visible signal that the deck is internally-iterated. Default: keep the pill visible; revisit if the founder dislikes it in a shared link.
2. **TOC `[view]` link styling.** Tiny detail — should the link be a separate cell, an icon next to the slot title, or an inline `→` arrow at row's end? Decide when implementing A+.5 step 2.
3. **Empty-slot placeholder design.** The "decompose first" placeholder needs to communicate clearly what the next action is without feeling like an error state. Tone: helpful, instructive, not apologetic.
4. **Chroma's `/play/pitch/proto/` and other-variant routes.** Phase A+.4 only seeds enhanced-v3. Should the shell skip emitting `/play/.../proto/*` URLs entirely (clean) or emit all-placeholder URLs (consistent)? Default: emit all, even all-placeholder, so the URL space is uniform across variants.
5. **Keyboard contract conflict with chroma's existing scroll-snap.** Chroma's scroll deck uses arrow keys for scroll-snap navigation. Adding `<SlideRankPill>` doesn't take keyboard focus, so it shouldn't conflict — but verify in dev. If conflict arises, the pill's pill-buttons should require focus to receive keys.

## Follow-up plans this work queues

These are *separate* plans that Phase A+ makes possible:

1. **Phase B plan — Lift calmstorm's mature primitives into the shell.** Now that the shell carries a nav, a ranking pill, AND a /play runtime, Phase B is the larger calmstorm-side migration that brings `PageAsDeckWrapper`, `SlideCanvas`, `ContentFit`, tier-aware `MetaTags`, etc. Sequenced after Phase A+ because (a) Phase A+ exercises the shell's API surface enough to find awkward edges before the bigger migration; (b) calmstorm is mid-iteration with a sensitive audience and needs a quiet window.
2. **Phase A.7 publish.** Still blocked on the org-name decision. Phase A+ does not unblock it; the user does, by picking option 1 / 2 / 3 from [[Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]] §"What's Next".
3. **Componentize-slides plan destination retarget.** One-paragraph edit per Open Question #4 of [[Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]]. Still queued; can ship anytime; doesn't block.
4. **Per-slide content sprint.** Once `/play` works end-to-end and the rank-decompose-recreate loop is fluid, the founder runs the loop across the rest of enhanced-v3's slots (and the other variants). That's not really a "plan" — it's the framework's iteration rhythm. The deck-iteration-workflow skill is the doc for it.

## Cross-references

- [[../explorations/Plans-Inventory-and-Phase-A-Outcome]] — the inventory + gap-analysis exploration that frames this plan.
- [[Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]] — Phase A. A.1–A.6 are this plan's preconditions; A.7 is orthogonal.
- [[Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] — the architecture exploration. Phase A+ pulls forward (small subsets of) what would otherwise live in Phase B (nav chrome) and Phase D (`/play` runtime).
- [[Init-Chroma-Decks-Client-Site]] — the chroma scaffold plan whose `/play` deferral this plan lifts. Two-seed-files is the minimum to verify `/play`, not the wholesale port the original deferral imagined.
- [[Componentize-Slides-and-Establish-Component-Library]] — its destination retarget is queued; Phase A+ doesn't execute it but does land inside the shell's component directory, which is where the componentization plan eventually lives.
- [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — parent spec; NS-2's "player so good they present live" is the eventual target of the `/play` runtime line.
- [[../../changelog/2026-05-12_02]] — the Phase A ship-note. Phase A+ gets its own changelog entry when it lands.
- `deck-iteration-workflow` skill — the rhythm Phase A+ fully operationalizes (rank → decompose → recreate → present).
- `astro-knots` skill — framework prohibitions Phase A+ inherits.
- `theme-system` skill — relevant when the floating pill picks up chroma's theme tokens.

## Status / next step

**Status:** Draft, ready for the next agent (or this one in a fresh session) to execute.

**Immediate next step on approval:** Begin Phase A+.1 — author `apps/deck-shell/src/components/DididecksNav.astro`, refactor the TOC route to mount it, verify in dev. Pause at the first stop-and-show point for founder feedback on the nav model before continuing.

**Total estimated effort:** A focused half-day session for A+.1 through A+.3 (shell-side); a second half-day for A+.4 (the real per-slide-file authoring is where the founder's eye is needed) and A+.5 (verification). Roughly one full day of agent-augmented work end-to-end.

**Required from the user during execution:** (a) confirm the nav link set after A+.1; (b) confirm the rank-pill design feels right after A+.2; (c) confirm the keyboard contract after A+.3; (d) author or approve the cover + ask redesigns in A+.4. Otherwise the agent runs autonomously.

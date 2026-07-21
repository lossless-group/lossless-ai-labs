---
title: "Lift chroma-decks' generic layouts, utilities, and registry-derivation helpers into the shared @dididecks/shell so every client-site inherits the same primitives instead of forking from chroma"
lede: "Chroma-decks was built before the @dididecks/shell carve-out, so it carries the original implementations of several deck-generic primitives (PageAsDeckWrapper, SlideShell, mode-switcher, ModeToggle, deck-overview) inside client-specific paths. Each new client-site onboarded since then has either re-implemented the same behavior locally (humain-vc-decks initially had no keyboard nav at all) or copy-pasted from chroma without a clean import boundary. The humain-vc-decks onboarding on 2026-06-06 surfaced this drift directly when the new client's scroll pages shipped without scroll-snap, keyboard arrows, or a section counter — affordances every client should get for free from the shell. PageAsDeckWrapper has already been lifted (commit c87c643) as the first cut; this plan formalizes the rest of the audit list and sequences the remaining promotions so that (a) every client-site can consume the same vocabulary, (b) chroma's local copies migrate off cleanly without breaking the working production deck, and (c) future client onboardings start with a fresh-shell audit pass before any copy-paste."
date_authored_initial_draft: 2026-06-06
date_authored_current_draft: 2026-06-06
date_authored_final_draft:
date_first_published: 2026-06-06
date_last_updated: 2026-06-06
at_semantic_version: 0.0.2.0
status: Mostly-Shipped   # Phases 1, 2, 3, 5 shipped 2026-06-06; Phase 4 (deck-overview) held — see Phase 4 deferral note below
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Plan
tags:
  - Dididecks-Shell
  - Shell-Promotion
  - Chroma-Decks-Migration
  - Humain-VC-Decks
  - PageAsDeckWrapper
  - SlideShell
  - ModeToggle
  - Mode-Switcher
  - Deck-Overview
  - Shared-Primitives
  - Themable-CSS-Custom-Properties
  - Audit-Discipline
  - Client-Site-Onboarding
  - Phase-B-Foundation
authors:
  - Michael Staton
related:
  - "[[Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]]"
  - "[[Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]]"
  - "[[Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]]"
  - "../../client-sites/humain-vc-decks/context-v/plans/Install-Auth-Surface-from-Calmstorm-Pattern.md"
from: "dididecks-ai"
from_path: "context-v/plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell.md"
---
# Lift chroma-decks' generic code into the shared shell

## Why this plan exists

The `@dididecks/shell` package was carved out of chroma-decks *after* chroma had already built working implementations of several primitives. Those primitives were deck-generic (not Chroma-branded), but the carve-out wasn't completed for everything — only the most obvious pieces (`DeckChrome`, `SlideCanvas`, `DeckFrame--Play-UI`, `DeckOverlay--{Scroll,Play}-UI`, `SlideRankPill`, the registry-loader, the route injection) landed in `apps/deck-shell/`.

The remainder kept living inside `client-sites/chroma-decks/src/`. As long as chroma was the only client-site, this was invisible. The humain-vc-decks onboarding on 2026-06-06 made it visible:

1. Humain's three scroll-deck variants were scaffolded against the shell's contract — registries, scroll-page sections with `data-slot` / `data-variant` annotations, theme.css ported from `DESIGN.md`.
2. The dev server booted. The variants rendered. **But there was no keyboard nav, no scroll-snap, and no section counter** — affordances the user had every reason to expect because they exist in chroma.
3. Tracing the gap: the working pagination was in `chroma-decks/src/layouts/PageAsDeckWrapper.astro`, not in the shell.

The user's verbatim correction: *"I'm very confused as to how so much functionality we made in client-sites/chroma-decks/ seems to not be in the shell."*

That correction is the load-bearing premise of this plan. **Every behavior that belongs to "the deck" (not "this client's branding") should live in the shell.** This document lists the remaining lift candidates, scopes each promotion, sequences the work, and codifies an audit step for future onboardings.

## What's already lifted as of this plan's authoring

- **`PageAsDeckWrapper.astro`** — promoted into the shell at `apps/deck-shell/src/components/PageAsDeckWrapper.astro` on 2026-06-06 (commit `c87c643`). Delivers scroll-snap, keyboard nav (Arrow / PageUp/Down / Home / End / `c` chrome / `f` fullscreen), double-click step, section indicator (`NN / total`), `#s-N` hash navigation, `reveal-item` IntersectionObserver, and the `deck:section-changed` / `deck:section-prev` / `deck:section-next` event protocol that lets `DeckChrome` buttons drive the same nav as keyboard / scroll. CSS classes prefixed `ddd-*` to avoid client collisions; theming reads through `--ddd-scroll-*` tokens with sensible fallbacks so consumers aren't forced to declare them. Humain consumes via `import PageAsDeckWrapper from "@dididecks/shell/components/PageAsDeckWrapper.astro"`. Chroma still has its local copy — migration off pending (Phase 3 below).

## The remaining audit list

Snapshot of chroma-decks' source tree as of 2026-06-06, with verdicts:

| Chroma path | Purpose | Verdict | Notes |
|---|---|---|---|
| `src/layouts/SlideShell.astro` | Per-slide wrapper — shared padding, min-height, scroll-snap-align | **LIFT** | Generic to any deck; ships as `@dididecks/shell/components/SlideShell.astro`. |
| `src/utils/mode-switcher.js` | Cycles `data-mode` between `light` / `dark` / `vibrant`; persists in `localStorage` | **LIFT** | Generic state machine. The persisted key may need a per-client namespace to avoid collisions across deployments on the same domain — bake a `client` option in. |
| `src/components/basics/ModeToggle.astro` | The UI button consuming `mode-switcher.js` | **LIFT** | Visual styling is currently chroma-flavored; lift with the same `ddd-*` class prefix + token fallback discipline used for `PageAsDeckWrapper`. |
| `src/lib/deck-overview.ts` | Reads `DECKS` + `SLOTS` + glob of `src/components/slides/**` → produces landing-page summary (variant cards, slot counts, status pills) | **LIFT** | Pure derivation from the shell's existing registry contract. Move to `@dididecks/shell/lib/deck-overview.ts`. |
| `src/components/basics/SlideStatusMatrix.astro` | Per-deck status matrix UI | **RECONCILE** | Overlaps the shell's existing `DeckMatrix.astro`. Audit whether they diverge, then either fold into `DeckMatrix` or rename the chroma one for client-specific concerns. |
| `src/components/basics/AssetsDataPanel.astro` | Surfaces a "Substantiation" data panel | **AUDIT** | Needs inspection — could be a generic substantiation pattern (then lift) or chroma-specific. |
| `src/components/basics/Wordmark.astro` | Chroma wordmark SVG | **KEEP CLIENT** | Brand-specific. The slot-via-DESIGN.md pattern handles cross-client wordmarks. |
| `src/components/basics/ChromaMark.astro` | Chroma logo mark | **KEEP CLIENT** | Brand-specific. |
| `src/lib/auth/` | OAuth + magic-link + session + token + lossless_id + passcode | **DEFER — DEBATABLE** | Each client may want different OAuth providers, different organization seeds, different gating tiers. Keeping per-client gives flexibility; lifting as `@dididecks/shell/auth` with config slots gives consistency. Discuss before lifting. Decision can wait until humain's auth installs (per its `Install-Auth-Surface-from-Calmstorm-Pattern.md` plan). |

## Scope of this plan

**In scope (Phases 1–4):**
- Lift `SlideShell`, `mode-switcher.js`, `ModeToggle`, and `deck-overview.ts` into the shell.
- Reconcile `SlideStatusMatrix` against `DeckMatrix`.
- Migrate chroma-decks off its local `PageAsDeckWrapper.astro` to consume the shell's version.
- Onboard humain-vc-decks to the lifted primitives.

**Out of scope (deferred to separate plans):**
- Auth surface promotion — wait until humain's auth install pass.
- `AssetsDataPanel` audit — separate inspection pass.
- Branded components (`Wordmark`, `ChromaMark`) — staying client-side is correct.
- Anything play-UI runtime (already in shell).

## Phase 1 — `SlideShell.astro`

**Risk:** Low. Pure layout primitive with no behavior.

**Steps:**
1. Read `chroma-decks/src/layouts/SlideShell.astro` to understand the contract.
2. Author `apps/deck-shell/src/components/SlideShell.astro` with the same shape:
   - `padding`, `min-height`, and `scroll-snap-align` defaults
   - CSS class prefixed `ddd-slide-shell`
   - All visual values read through `--ddd-slide-*` tokens with fallbacks to `--color-background` / `--color-text` so consumers aren't required to declare new tokens.
3. Update humain-vc-decks to wrap each section's *inner content* with `<SlideShell>` if it helps the lab-notebook narrow-column pattern; otherwise skip — `PageAsDeckWrapper` already handles scroll-snap-align.
4. Leave chroma's local copy intact for now; the migration commit happens in Phase 3.

**Acceptance:** Humain's three variants render identically with or without `SlideShell`; chroma's enhanced-v3 still renders against its local copy.

## Phase 2 — Mode toggle + mode-switcher

**Risk:** Low–medium. The persisted localStorage key needs a per-client namespace to avoid collisions if multiple decks deploy on the same domain.

**Steps:**
1. Promote `src/utils/mode-switcher.js` → `apps/deck-shell/src/runtime/mode-switcher.ts` (rewrite in TS to match shell convention). Add a `client` argument that gets baked into the localStorage key (`{client}:mode`).
2. Promote `src/components/basics/ModeToggle.astro` → `apps/deck-shell/src/components/ModeToggle.astro`. Inline-import the runtime; accept `client` as a required prop. CSS classes `ddd-mode-toggle-*`. Theming via `--ddd-mode-toggle-*` tokens with fallbacks.
3. Humain consumes:
   ```astro
   import ModeToggle from "@dididecks/shell/components/ModeToggle.astro";
   <ModeToggle client="humain-vc-decks" />
   ```
4. Chroma's local copy stays until Phase 3.

**Acceptance:** Humain's landing page and scroll pages mount the shell's `ModeToggle` and cycle modes correctly with its own theme.css. Chroma keeps working off its local copy.

## Phase 3 — Migrate chroma off its local copies

**Risk:** Medium. Touching chroma's working production deck is a non-trivial action; needs care to not regress.

**Steps:**
1. Update chroma's imports:
   - `src/pages/scroll/**/*.astro` and `src/pages/index.astro`: swap `import PageAsDeckWrapper from "../layouts/PageAsDeckWrapper.astro"` → `import PageAsDeckWrapper from "@dididecks/shell/components/PageAsDeckWrapper.astro"`.
   - Same for `SlideShell` (after Phase 1 lands) and `ModeToggle` (after Phase 2 lands).
2. Test chroma's enhanced-v3 deck against the shell version: scroll-snap, keyboard arrows, section counter, mode toggle, `#s-N` hash. Side-by-side with the local copy.
3. Once parity is verified, delete the local copies:
   - `rm src/layouts/PageAsDeckWrapper.astro`
   - `rm src/layouts/SlideShell.astro`
   - `rm src/utils/mode-switcher.js`
   - `rm src/components/basics/ModeToggle.astro`
4. Commit chroma's migration with a clear message: *"refactor(shell-consume): migrate chroma off local layouts/utils to @dididecks/shell"*.

**Acceptance:** Chroma's enhanced-v3 deck renders identically to before this plan started. No local-copy fallback paths remain.

**Status (2026-06-06): Shipped via shim re-exports.** Commit `0eef7fe` in chroma-decks. Five files were rewritten as thin shim re-exports of the shell versions:

- `src/layouts/PageAsDeckWrapper.astro` → `@dididecks/shell/components/PageAsDeckWrapper.astro`
- `src/layouts/SlideShell.astro` → `@dididecks/shell/components/SlideShell.astro` (ChromaMark plugged into `<slot name="mark">` when `showMark` is true; preserves original on-screen result)
- `src/utils/mode-switcher.js` → `@dididecks/shell/runtime/mode-switcher.ts` (singleton installed at module top-level via `createModeSwitcher({ client: "chroma-decks", defaultMode: "light", respectSystemPreference: true })`)
- `src/components/basics/ModeToggle.astro` → `@dididecks/shell/components/ModeToggle.astro` (pre-configured with chroma defaults)
- `src/components/basics/SlideStatusMatrix.astro` → `@dididecks/shell/components/SlideStatusMatrix.astro`

The plan called for full local-copy deletion after parity verification. We chose shim re-exports instead because chroma has ~25 downstream importers (proto + enhanced scroll pages, per-slide play files, landing page, scroll gallery) that all use the original local paths. Shim re-exports preserve those import paths transparently; only the implementation behind them swaps to the shell version. Net effect — 781 lines deleted in chroma, 119 lines added (the shim files), one source of truth for the implementation.

The "delete local copies and update all importers" cleanup is now a smaller follow-up that can happen any time without rush; deleting a shim file means updating ~5–10 importers per file. Held for a separate, deliberate pass when chroma is otherwise quiet.

## Phase 4 — `deck-overview.ts`

**Risk:** Low. Pure data derivation.

**Steps:**
1. Lift `chroma-decks/src/lib/deck-overview.ts` → `apps/deck-shell/src/lib/deck-overview.ts`. Update imports to reach into the shell's already-exported `loadDecksRegistry` and `playableSlotsByVariant` rather than chroma's local equivalents.
2. Export from the shell's package entrypoint (`@dididecks/shell/lib/deck-overview`).
3. Humain's `src/pages/index.astro` consumes:
   ```astro
   import { loadDeckOverview } from "@dididecks/shell/lib/deck-overview";
   const overview = loadDeckOverview("pitch");
   ```
4. Chroma's local copy stays until tested, then deletes in a follow-up commit.

**Acceptance:** Humain's landing page renders a Chroma-style summary (variant cards with `Scroll` / `TOC` / `Play` links, slot counts, status pills) without copying any code from chroma.

**Status (2026-06-06): Partial — humain consumes; chroma migration held.** The shell version exists at `apps/deck-shell/src/lib/deck-overview.ts` (commit `07802d1`) and humain consumes it via `import { loadDeckOverview } from "@dididecks/shell/lib/deck-overview"` (commit `2b7b14a`).

Chroma's local copy at `src/lib/deck-overview.ts` was NOT migrated in Phase 3 — two reasons:

1. **Sync→async API drift.** The shell version is `async` because it `await`s `loadDecksRegistry(opts.absolute.decksRegistry)` (esbuild-evaluates the consumer's TS registry). Chroma's local version is sync (it imports `DECKS`/`SLOTS` directly). Chroma's landing page calls `loadDeckOverview("pitch")` synchronously, so a drop-in replacement would break.
2. **Substantiation-counts dependency.** Chroma's `DeckOverview.totals` carries `peopleCount`, `headshotCount`, `investorFirmCount`, `portfolioCompanyCount` from walking `data/team`, `data/investors`, `public/people`. The shell version intentionally dropped these as per-client concerns. The chroma landing page reads them, so a drop-in replacement would null them out.

Migrating later means either: (a) updating chroma's landing-page callsites to `await` AND extending chroma's local `deck-overview.ts` as a thin wrapper that adds the substantiation counts on top of `await loadShellOverview(deckSlug)`, or (b) leaving the sync chroma copy in place and documenting that new code uses the shell's async version. Decision deferred; chroma keeps working off its local copy until then.

## Phase 5 — `SlideStatusMatrix` ↔ `DeckMatrix` reconciliation

**Risk:** Low. Documentation + small refactor.

**Steps:**
1. Inspect both components. Identify what differs (likely: SlideStatusMatrix is per-deck per-slide whereas DeckMatrix is multi-deck overview, or one is older).
2. Decide:
   - **If they overlap functionally:** keep `DeckMatrix` (already in shell), delete `SlideStatusMatrix` from chroma.
   - **If they serve distinct purposes:** rename `SlideStatusMatrix` → `chroma-decks/src/components/basics/ChromaSlideStatus.astro` to signal client-specificity, OR lift it to shell as a distinct component.
3. Document the decision in this plan.

**Acceptance:** No ambiguous duplication remains; the shell's matrix vocabulary is clear about what each component does.

**Status (2026-06-06): Revised verdict — `SlideStatusMatrix` deleted from both the shell and chroma's shim.** The initial Phase 5 verdict treated `DeckMatrix` (rich, audit-rated, dual-surface) and `SlideStatusMatrix` (lightweight, file-existence glyphs) as distinct siblings and promoted both into the shell. After humain landed on the lightweight one — which then got swapped to the rich `DeckMatrix` to match chroma's landing — a grep across all three trees (`apps/deck-shell/`, `client-sites/chroma-decks/src/`, `client-sites/humain-vc-decks/src/`) for `SlideStatusMatrix` importers returned **zero hits** outside the component files themselves. Neither client uses it; "keep it for a hypothetical future client" wasn't a strong enough rationale to carry ~250 lines of well-documented dead code in the shell. Deleted in the same session:

- `apps/deck-shell/src/components/SlideStatusMatrix.astro`
- `client-sites/chroma-decks/src/components/basics/SlideStatusMatrix.astro` (Phase-3 shim from earlier in the session)

`DeckMatrix` is the canonical landing matrix from now on. If a future client genuinely wants a smaller widget, the pattern can be lifted back — but until then, one source of truth, less drift.

## Audit discipline for future onboardings

A separate feedback memory was saved (`feedback_audit-prior-client-for-shell-lift`) that codifies the audit step for every new client-site onboarding: *"Before authoring this new client's first scroll page, audit the most recent client's `src/layouts/`, `src/utils/`, `src/lib/`, `src/components/basics/` for shell-worthy code and lift it first."*

That memory is the active discipline. This plan is the one-time migration of the existing backlog.

## Notes on theming and class naming

Every lifted component follows the convention established by `PageAsDeckWrapper`:

- **CSS class prefixes:** `ddd-` (e.g. `ddd-slide-shell`, `ddd-mode-toggle`). Avoids collisions with client-side classes and makes shell-owned elements identifiable in DevTools.
- **Theming tokens:** `--ddd-{component}-{property}` (e.g. `--ddd-mode-toggle-bg`, `--ddd-slide-shell-padding`). Each token has a fallback chain to the consumer's semantic tokens (e.g. `var(--ddd-slide-shell-bg, var(--color-background, white))`) so consumers are never *required* to declare shell-specific tokens.
- **Behavior contracts:** Documented in the component's docblock, including the keyboard contract, event protocol, and any global state assumptions.

## Out of scope — won't be in this plan

- **Auth surface promotion.** Deferred until humain's auth install completes; see `client-sites/humain-vc-decks/context-v/plans/Install-Auth-Surface-from-Calmstorm-Pattern.md`. After both clients have working auth, revisit whether to lift.
- **Play-UI runtime additions.** Already in shell.
- **DESIGN.md ↔ theme.css automation.** Separate concern.
- **`@astrojs/db` integration paths.** Per-client; not a shell concern.

## See also

- `Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives.md` — the predecessor pattern (calmstorm nav primitives lifted as themable shell components). This plan extends that discipline to the remaining audit list.
- `Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking.md` — the original shell carve-out.
- `Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime.md` — companion phase for play-side primitives (already in shell).
- `client-sites/humain-vc-decks/context-v/plans/Install-Auth-Surface-from-Calmstorm-Pattern.md` — humain's own auth install plan; references this plan for the order-of-operations decision around auth.

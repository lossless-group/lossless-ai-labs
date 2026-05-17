---
title: "Plans Inventory 2026-05-16 — Post-DeckOverlay, Post-/play-Chooser-Fix, Post-Status-Sweep"
lede: "Snapshot of `dididecks-ai/context-v/plans/` as of 2026-05-16, four days after Phase A+ shipped and two days after the Restore-Calmstorm-Nav-Elegance partial landed. Supersedes `Plans-Inventory-and-Phase-A-Outcome.md` (which froze at 2026-05-12 and predates the Scroll-UI/Play-UI framing correction). Designed for a cold-start future-session land: what shipped, what's running, what's actively partial, what's deferred, and three reasonable directions for the next iteration."
date_authored_initial_draft: 2026-05-16
date_authored_current_draft: 2026-05-16
date_last_updated: 2026-05-16
date_first_published: 2026-05-16
at_semantic_version: 0.0.1.0
status: Active
supersedes: "[[Plans-Inventory-and-Phase-A-Outcome]]"
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Exploration
tags:
  - Plans-Inventory
  - State-Of-The-Union
  - Cold-Start-Resume
  - Post-DeckOverlay
  - Post-Play-Chooser-Fix
  - Post-Status-Sweep
  - Scroll-UI-vs-Play-UI-Correction
authors:
  - Michael Staton
date_created: 2026-05-16
date_modified: 2026-05-16
from: "dididecks-ai"
from_path: "context-v/explorations/Plans-Inventory-2026-05-16.md"
---
# Plans Inventory 2026-05-16

> Cold-start orientation doc. If you're an agent or a human landing in `dididecks-ai/` for the first time after 2026-05-16, read this first. The plans on disk are largely accurate (they were status-swept on 2026-05-16 per the new `Maintain-Status-Discipline-Across-Context-V-Files` habit), but this doc is the cheaper map.

## Read this first — Scroll-UI vs. Play-UI

**Scroll-UI and Play-UI are not "two views of the same content."** They are two coordinated *implementations* of every slide:

- **Scroll-UI slide** = a section component inside `src/pages/scroll/{deck}/{variant}/index.astro`. Responsive CSS, vertical reading, JS allowed. The surface Claude (and humans) design **in**.
- **Play-UI slide** = a standalone file at `src/components/slides/{variant}/{slot}-{slug}.astro`, rendered by the shell's `/play/[slot]` route inside `SlideCanvas`. Rigid 16:9 at 1920×1080. **No responsive CSS. No JS.** Static-only. The surface Claude is **bad at** without explicit constraint.

Coupling is by **slot identity only** (`pitch/enhanced-v3/05` is the same conceptual slot in both). The two files are unrelated and require a deliberate **recreate-don't-extract** conversion (Phase 1 → Phase 2 of the deck-iteration-workflow, encoded in `/api/slide-decompose`). A deck **has** Play-UI only insofar as its per-slide files exist.

If this framing is new to you, also see: `dididecks-ai/CLAUDE.md` "Naming is fuzzy here", `context-v/sitemap/README.md`, and the agent memory `feedback_scroll_vs_play_are_different_components`.

## What shipped between 2026-05-12 and 2026-05-16

Beyond Phase A+ (which the prior inventory covers), the substantive deltas:

### Restore-Calmstorm-Nav-Elegance (partial, 2026-05-14)
- `apps/deck-shell/src/styles/chrome-tokens.css` — the `--ddd-chrome-*` token namespace
- `apps/deck-shell/src/components/DeckChrome.astro` (470 LOC) — floating themable capsule replacing v0.1 `PlayChrome`
- `apps/deck-shell/src/styles/themes/neutral.css` — default theme
- `PlayChrome.astro` now an `@deprecated` shim around `DeckChrome`
- The event contract (`ddd:section-changed`, `ddd:section-prev/next`) — wired in `DeckChrome`, ready for Phase 2's scroll-side `PageAsDeckWrapper`

### DeckOverlay components (new, 2026-05-15)
- `<DeckOverlay--Scroll-UI>` + `<DeckOverlay--Play-UI>` — composition wrappers in the shell. Named slots for `nav` / `classify` / `notes` / `telemetry`. Establishes the `--Scroll-UI` / `--Play-UI` paired-suffix discipline for any component where UI mode matters.
- `SlideRankPill` `position` prop (`bottom-right` default, `top-right` for Play-UI) — resolves the corner-stacking conflict with `DeckChrome`.
- Chroma's `/scroll/pitch/enhanced-v3/` swapped its `<SlideRankPill>` mount for `<DeckOverlay--Scroll-UI>`.

### /play/ chooser fix (new, 2026-05-16)
- `DeckFormat` axis retired from `chroma-decks/src/data/decks.ts`.
- `chroma-decks/src/data/play-availability.ts` — runtime-detects Play-UI availability via `import.meta.glob` over `src/components/slides/**`. AND-intersects file existence with `SLOTS[variant]` so it's structurally incapable of linking to a route the shell can't emit.
- `/play/index.astro` ported the card-grid pattern from `/scroll/index.astro`; primary CTA points at the newest playable variant.
- `SLOTS["proto"]` populated (13 entries matching the existing per-slide files; slot 06 deliberately skipped).

### Context-vigilance amendments (new, 2026-05-16)
- `context-v/sitemap/` — new directory in dididecks-ai with 13 shell-side mini-specs (`components/*` + `routes/*`) and a README codifying the convention.
- `client-sites/chroma-decks/context-v/sitemap/` — consumer-side counterpart with 5 mini-specs.
- `dididecks-ai/CLAUDE.md` — new "Naming is fuzzy here" section codifying Scroll-UI vs. Play-UI.
- Memory: `feedback_scroll_vs_play_are_different_components.md` saved at user-memory level.

### Lossless-skills + monorepo (out of scope for dididecks-ai but worth knowing)
- `context-vigilance` skill amended with a status-discipline framework. New deep-reference at `references/status-discipline.md`.
- New habit at `lossless-monorepo/context-v/habits/Maintain-Status-Discipline-Across-Context-V-Files.md`.
- All 9 plans in `dididecks-ai/context-v/plans/` swept and status-promoted on 2026-05-16.

## Plans on disk — current status

| Plan | Status | What's done | What's left |
|---|---|---|---|
| [[../plans/Init-DidiDecks-as-core-Submodule-of-AI-Labs]] | **Shipped** | All. `dididecks-ai` is a first-class repo + submodule under `ai-labs/`. | — |
| [[../plans/Init-Chroma-Decks-Client-Site]] | **Shipped** | All. The `/play` deferral noted in-body was lifted by Phase A+. | — |
| [[../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]] (Phase A) | **Partially-Shipped** | A.1–A.6 (shell scaffolded, TOC + rank + decompose APIs, chroma consumes via workspace-link) | A.7 publish to private registry — **blocked on the GitHub-org-name decision** (create `dididecks` org / rename to `@lossless-group/dididecks-shell` / use Verdaccio). A.8 Vercel preview verification follows A.7 trivially. |
| [[../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]] | **Shipped** | All A+ deliverables (DididecksNav, SlideRankPill, /play runtime, two seeded slides, TOC `[view →]` links). Carries the old "same content viewed three ways" framing in its body — see post-ship note. | — |
| [[../plans/Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety]] | **Partially-Shipped** | A++.3 SlideCanvas lift + A++.4 `/play` consumes SlideCanvas + A++.5 build green | A++.1 variant URL safety (enhanced-v1 still 404s — see Working URLs below); A++.2 `/play/[slot].astro` refactor to consume `<DeckOverlay--Play-UI>` (closes in-play classifier); A++.3 ContentFit (the other half of SlideCanvas — slides exceeding 1920×1080 currently clip) |
| [[../plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]] | **Partially-Shipped** | Steps 1, 2, 5, 6, 8, 9 (chrome-tokens.css, DeckChrome, event contract, neutral theme, PlayChrome shim, /play uses DeckChrome) | Step 3 `<DeckHeader>`; Step 4 `<ModeToggleScrollPlay>`; Step 7 chroma override sheet (the proof the theming contract works end-to-end); Step 10 smoke test; Step 11 README docs |
| [[../plans/Port-Enhanced-v2-Scroll-Slides-to-Static-16x9-Play-Slides-for-PDF-Export]] | **Shipped** | All 17 enhanced-v2 slides ported. | — |
| [[../plans/Refactor-Scroll-Ported-Slides-to-Static-Play-Format]] | **Shipped** | Reusable discipline; applied to chroma enhanced-v2 on 2026-05-14. | Per-client repeat-application is normal use, not outstanding work. |
| [[../plans/Componentize-Slides-and-Establish-Component-Library]] | **Deferred** | — | Destination retargets to `apps/deck-shell/components/`; DeckOverlay is the first instance of this componentization in the shell. One-paragraph in-body edit pending. |

## Working URLs (smoke-tested 2026-05-16)

| URL | Status |
|---|---|
| `/play/` chooser | ✅ Lands at `/play/pitch/enhanced-v3/01/` (newest playable variant) |
| `/play/pitch/proto/{01..05,07..14}/` | ✅ All 13 proto slots playable; ←→ keyboard nav |
| `/play/pitch/enhanced-v2/{01..16}/` | ✅ All 17 v2 slots playable |
| `/play/pitch/enhanced-v3/{01..16}/` | ✅ All 16 v3 slots playable |
| `/play/pitch/enhanced-v1/` and `/play/pitch/enhanced-v1/01/` | ❌ 404 — A++.1 gap (v1 has no SLOTS, no per-slide files) |
| `/scroll/pitch/{proto,enhanced-v1,enhanced-v2,enhanced-v3}/` | ✅ All four variants scroll |
| `/toc/pitch/{any variant}/` | ✅ TOC renders with rank pills + scaffold buttons + `[view →]` where per-slide files exist |
| In-play classifier pill | ❌ Not mounted — A++.2 gap (route doesn't consume `<DeckOverlay--Play-UI>` yet) |
| Slides exceeding 1920×1080 in Play-UI | ❌ Clip — A++.3 ContentFit gap |

## Buttoning-up remainders (context-v hygiene, not code)

After this session, the following hygiene items are still pending. Roughly in order of cheapness × value:

1. **Changelog entries.** No `changelog/2026-05-15.md` or `2026-05-16.md` in either `dididecks-ai/changelog/` or `client-sites/chroma-decks/changelog/`. Several days of commits go undocumented; per `changelog-conventions` skill, shipping a coherent chunk should produce a changelog entry.
2. **Sitemap stubs for planned-but-not-built components.** `ContentFit.md`, `DeckHeader.md`, `ModeToggleScrollPlay.md` should exist as `status: planned` mini-specs under `context-v/sitemap/components/`, back-linked to the Restore plan. Sitemap currently documents only what's built; should document the *intended* architecture so the gap is legible.

The other items from the original buttoning-up list have been addressed:
- ✅ Plan status updates (this session, items 1 & 2 of the original list)
- ✅ Plans-Inventory refresh (this very doc)
- ✅ Historical-doc correction header (added to `Plans-Inventory-and-Phase-A-Outcome.md` frontmatter on supersession)

## Three reasonable next iterations

When you (or the next agent) pick this up, three candidates close meaningful gaps:

### Path A — A++.2 route refactor (founder-facing impact)
Refactor `/play/[deckSlug]/[variantSlug]/[slot].astro` to consume `<DeckOverlay--Play-UI>`. Closes A++.2 — in-play classifier ranking. Medium risk (touches a working route used daily). The overlay is already built, props-shaped, and exported. The migration is mainly: import the overlay, pass DeckChrome props through to it, and pass the slide as the default `<slot>`. The overlay's section-wrap is the play-mode adapter for `SlideRankPill`'s IntersectionObserver — no changes needed to the pill itself.

**Estimated effort:** 1–2 hours including dev-server verification.

### Path B — Restore Step 7 (themable-contract validation)
Author `client-sites/chroma-decks/src/styles/dididecks-chrome.css` with chroma's brand palette (orange `#f05100`, cream `rgb(251 248 241 / 0.92)`, dark brown `#27201c`) scoped to `:root[data-deck-skin="chroma"]`. Wire the `data-deck-skin="chroma"` attribute somewhere appropriate (likely a top-level layout). Smoke-test the result: the floating capsule should pick up the orange/cream skin instead of the neutral default.

**Estimated effort:** 1 hour. Low-risk; purely additive; validates the entire `--ddd-chrome-*` contract end-to-end.

### Path C — A++.1 empty-state for variants without SLOTS (cheap completeness)
Refactor `apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/index.astro` to gate the redirect on `SLOTS[variantSlug]?.length`. If empty, render a "no Play-UI yet for this variant" panel with a link back to `/scroll/{deck}/{variant}/` and `/toc/{deck}/{variant}/`. This closes the last typed-URL 404 path (chroma's `enhanced-v1`).

**Estimated effort:** 30 minutes. Smallest contained change; lowest risk.

There are other directions too — Restore Steps 3 + 4 (DeckHeader + ModeToggleScrollPlay), ContentFit lift (A++.3-other-half), unblocking A.7 publish (org-name decision). Pick whichever matches the energy of the next session.

## Cross-references

- [[Plans-Inventory-and-Phase-A-Outcome]] — the doc this supersedes (frozen at 2026-05-12)
- [[Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] — the architecture exploration whose Phases A–E this inventory traces
- [[../plans/Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety]] — the partial-shipped plan most relevant to Paths A and C above
- [[../plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]] — the partial-shipped plan most relevant to Path B above
- [[../sitemap/README]] — the living map of shell artifacts (routes + components)
- [[../../client-sites/chroma-decks/context-v/sitemap/README]] — consumer-side living map
- [[../../CLAUDE.md]] — "Naming is fuzzy here — Scroll-UI vs. Play-UI" section
- `context-v/skills/context-vigilance/references/status-discipline.md` (in lossless-agent-skills) — the framework that produced 2026-05-16's status sweep
- `lossless-monorepo/context-v/habits/Maintain-Status-Discipline-Across-Context-V-Files.md` — the habit for future sweeps

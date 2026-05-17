---
title: "Plans Inventory and Phase A Outcome — What Shipped, What Remains, and the Three Gaps the Founder Surfaced on First Smoke-Test"
lede: "Four plans live in `dididecks-ai/context-v/plans/`. Two have been fully executed (the dididecks-ai monorepo init and the chroma-decks scaffold). One is partly executed (Phase A of `@dididecks/shell` — A.1 through A.6 working in workspace-link mode; A.7 publish is administratively blocked). One is fully deferred (the slide componentization sweep, which now retargets into the shell). After landing the shell today, the founder smoke-tested the running surface and named three concrete gaps: no global navigation chrome, no in-scroll-deck slide-rank UI (a feature neither calmstorm nor chroma has today), and no per-slide static HTML files to feed a `/play` runtime. The next plan — Phase A+ — closes those three in a single coherent slice."
date_authored_initial_draft: 2026-05-12
date_authored_current_draft: 2026-05-12
date_authored_final_draft: 2026-05-12
date_first_published: 2026-05-12
date_last_updated: 2026-05-16
at_semantic_version: 0.0.1.0
status: Superseded
superseded_by: "[[Plans-Inventory-2026-05-16]]"
historical_correction_note: |
  This doc characterizes TOC + Scroll + Play as "the same content viewed
  three ways." That framing was later sharpened: Scroll-UI and Play-UI
  are two coordinated IMPLEMENTATIONS per slide (different files,
  different constraints — responsive sections vs. rigid 16:9 no-JS
  standalone files), coupled only by slot identity, NOT two views of the
  same content. See `CLAUDE.md` "Naming is fuzzy here — Scroll-UI vs.
  Play-UI" and the memory note `feedback_scroll_vs_play_are_different_components`
  for the corrected model.
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Exploration
tags:
  - Plans-Inventory
  - Phase-A-Outcome
  - Founder-Smoke-Test
  - Gap-Analysis
  - Global-Nav-Chrome
  - In-Scroll-Rank-UI
  - Play-Runtime
  - Phase-A-Plus
  - Context-Engineering
authors:
  - Michael Staton
date_created: 2026-05-12
date_modified: 2026-05-12
from: "dididecks-ai"
from_path: "context-v/explorations/Plans-Inventory-and-Phase-A-Outcome.md"
---
# Plans Inventory and Phase A Outcome

> Snapshot of `dididecks-ai/context-v/plans/` as of 2026-05-12, after Phase A of `@dididecks/shell` landed. Two purposes: (1) make the running state legible to the next agent who lands cold, and (2) frame the **three gaps the founder observed during smoke-testing** that the next plan ([[../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]]) is scoped to close.

## Why this exists

Today's session landed the first cross-client capability — `@dididecks/shell` as an Astro integration, installed into `client-sites/chroma-decks` via a pnpm workspace link, with a working `/toc/[deck]/[variant]/` route, a working `/api/slide-rank` write-back, and a working `/api/slide-decompose` non-destructive stub generator. The plan-of-record ([[../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]]) ran end-to-end through Phase A.6.

When the founder ran `pnpm dev` and clicked around, three concrete gaps surfaced — gaps that **none of the four existing plans on disk close as written.** This document inventories the plans, maps each to its execution status, and frames the missing slice the Phase A+ plan will pick up.

## The four plans on disk

`dididecks-ai/context-v/plans/` currently contains:

| Plan | First authored | Semver | Status | What it covers |
|---|---|---|---|---|
| [[../plans/Init-DidiDecks-as-core-Submodule-of-AI-Labs]] | 2026-05-11 | 0.0.1.0 | **Largely executed** | Promote `dididecks-ai` from a folder under `ai-labs/context-v/` to a first-class repo + submodule; move client-sites under `client-sites/`; relocate the parent spec + sibling specs into the new context-v; scaffold the splash; three-tier branches at parity. |
| [[../plans/Init-Chroma-Decks-Client-Site]] | 2026-05-11 | 0.0.1.0 | **Largely executed** | Stand up `client-sites/chroma-decks` derived from calmstorm-decks substrate; `/scroll` + `/play` as thumb-gallery indexes; three-modes scaffolded; `corpus/` substantiation folder; three-tier branches; Vercel preview wired. |
| [[../plans/Componentize-Slides-and-Establish-Component-Library]] | 2026-05-11 | 0.0.3.0 | **Deferred — destination retargets** | The calmstorm-side slide-by-slide refactor with 9-category taxonomy (`primitives/`, `patterns/`, `share/`, `publish/`, `audit/`, `diagrams/`, etc.), the "≥2 uses to promote" rule, the distribution-tier discipline, the per-slide cadence, the component registry as agent-readable manifest, the `/design-system/` + `/component-library/` two-route split. Substance unchanged but the destination shifts from `client-sites/calmstorm-decks/src/components/` to `@dididecks/shell/components/` per [[Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] Open Question #4 — not yet edited. |
| [[../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]] | 2026-05-12 | 0.0.1.0 | **Phase A.1–A.6 executed · A.7 blocked · A.8 pending** | Scaffold `apps/deck-shell/` as `@dididecks/shell`; inject the TOC + slide-rank + slide-decompose routes; install in chroma-decks via workspace-link; publish v0.1.0 to private registry; verify Vercel preview build. |

Two additional sibling docs anchor the architecture but are not themselves plans:

- [[../explorations/Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] — the architecture exploration whose **resolution section** the active shell plan executes. Phase A is operative; Phases B (lift calmstorm primitives), C (iteration affordances), D (`/play` + auth + telemetry), E (export pipeline) are sequenced but not yet planned at granular level.
- [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — the parent spec whose NS-1 commits us to the two-sided system; the shell is the architectural seed of NS-1's white-label publish surface.

## What's running today

A reading of the running state, mapped back to which plan landed what:

```
dididecks-ai/                                        ← init plan (Init-DidiDecks)
├── apps/deck-shell/                                 ← shell plan (Stand-Up-Dididecks-Shell)
│   ├── package.json                  · @dididecks/shell @ 0.0.1, peer astro ^6
│   ├── src/index.ts                  · integration factory + injectRoute calls
│   ├── src/options.ts                · resolves consumer paths to absolute
│   ├── src/registry-loader.ts        · esbuild-backed TS module evaluator
│   ├── src/types/index.ts            · DididecksShellOptions, Deck, SlotRef, AuditRegistry, buildRankKey
│   ├── src/routes/toc.astro          · STATIC route, 16 slot rows for chroma's enhanced-v3
│   ├── src/routes/api/slide-rank.ts  · DEV-ONLY (prerender=false), composite-key persistence
│   └── src/routes/api/slide-decompose.ts · DEV-ONLY, non-destructive 409 guard
│
├── client-sites/chroma-decks/                       ← chroma plan (Init-Chroma-Decks)
│   ├── astro.config.mjs              · NOW imports + registers @dididecks/shell
│   ├── src/data/decks.ts             · 4 variants (proto, enhanced-v1, enhanced-v2, enhanced-v3)
│   ├── src/data/slides.ts            · NEW — 16-slot registry for enhanced-v3
│   ├── data/audits/slides.json       · NEW — composite-key audit registry, one demo rank seeded
│   ├── src/components/slides/enhanced-v3/05-bottleneck.astro · NEW — decompose-demo stub
│   ├── src/pages/scroll/pitch/{proto,enhanced-v1,v2,v3}/index.astro · unchanged
│   └── src/pages/play/                            · EMPTY (no per-slide files yet, no /play runtime)
│
├── client-sites/calmstorm-decks/                   ← inherited substrate
│   └── (40+ feature surfaces; will adopt the shell in Phase B per the exploration)
│
└── context-v/plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking.md
    ↑ Phase A.7 stalls on a single decision — see "What blocks A.7" below
```

Three surfaces work in `pnpm dev` against chroma right now:

| URL | What it shows | Working? |
|---|---|---|
| `/scroll/pitch/enhanced-v3/` | The chroma scroll deck (single-page, 16 inline sections) | Yes — unchanged, purely additive shell adoption |
| `/scroll/pitch/` | Chooser for enhanced-v3 / enhanced-v2 / enhanced-v1 / proto | Yes |
| `/toc/pitch/enhanced-v3/` | TOC with 16 rows + 5 rank pills per row + `scaffold` button | **NEW** — shell-injected; ranks + decompose work end-to-end |

The static build (`pnpm build`) produces TOC HTML for all 4 variants and leaves the existing scroll deck untouched (48 KB, byte-identical to pre-adoption).

## What blocks A.7

The plan's Phase A.7 says: **publish `@dididecks/shell@0.1.0` to a private registry, switch chroma's dep from `workspace:*` to `^0.1.0`, verify Vercel.** The blocker is one decision:

> GitHub Packages scopes packages to GitHub orgs. `@dididecks/shell` requires a GitHub org literally named `dididecks` — none exists today. Three branches:
>
> 1. Create a `dididecks` GitHub org (~2 minutes user-side).
> 2. Rename the package to `@lossless-group/dididecks-shell`.
> 3. Use a non-GitHub registry (npm-private paid, self-hosted Verdaccio).
>
> Until this is decided, A.7 cannot run.

A.7 is *not* a precondition for the next plan. The shell already works in workspace-link mode against chroma; Phase A+ can build on top of that and the published-vs-linked switch happens once A.7's org question resolves.

## The three gaps the founder named

After running the shell against chroma and clicking around, the founder surfaced three concrete missing surfaces. Each is genuine — none of the existing plans close any of them as written.

### Gap 1 — No global nav chrome

**What's missing:** A consistent header across deck-related routes (Scroll · Play · TOC · Design System · Changelog) that lets a reader move between modes without typing URLs. Chroma's homepage links to `/scroll` and `/play`; chroma's scroll-deck variants have inline ModeToggle + Wordmark but no nav row. The new `/toc/[deck]/[variant]/` route the shell injects has its own minimal header but no link back to the scroll deck.

**Why it matters:** The TOC, the scroll deck, and (eventually) the play view are the **same content viewed three ways**. A founder walking through her own materials, or a partner who clicks a shared link, needs the navigation to be persistent and obvious. Three separate routes with three separate headers (or no header at all) breaks the mental model.

**Where it should live:** In the shell. The exploration's Phase B step 12 calls for lifting calmstorm's `DeckHeader.astro` + `DeckNav.astro` into the shell, tier-aware. Phase A+ pulls that forward as a smaller, leaner shell-provided primitive — built fresh, not lifted, because chroma is the first consumer and calmstorm's header carries assumptions chroma doesn't have.

### Gap 2 — No in-scroll-deck slide-rank UI (NEITHER chroma NOR calmstorm has this)

**What's missing:** When a founder is reading her own scroll deck — actually scrolling through, eyes on the content — she has no way to mark a section as "urgent-redo" or "passable" or "perfect" *from where she is*. The only ranking surface today is `/toc/[deck]/[variant]/`, which is a separate route. To rank, she has to leave the deck, find the slot in a table, click a pill, come back.

This is **a new feature for both client-sites.** Calmstorm doesn't have it either. The plan-of-record for the shell put rank pills only on the TOC because that was the smallest provable slice.

**Why it matters:** The founder's natural reading-and-ranking rhythm is *while scrolling*, not *after a separate trip to a table view*. The friction between "I just read this slot" and "I want to mark it for redo" should be one click in-context. The TOC remains useful as a bird's-eye-view audit dashboard, but it shouldn't be the *only* surface.

**Where it should live:** As a shell-exported `<SlideRankPill>` component the consumer drops into each scroll-deck section. Reads the current rank from the audits registry at build time; POSTs to the same `/api/slide-rank` endpoint the TOC uses; updates optimistically. Optionally a floating pill that follows the active section via `IntersectionObserver` — to be decided in the plan.

### Gap 3 — No per-slide static HTML; can't verify `/play` works

**What's missing:** The shell's `/api/slide-decompose` route *creates empty stub files* at `src/components/slides/{variant}/{slot}-{slug}.astro`. The decompose-demo test wrote one such file (slot 05). But nothing **consumes** those stubs yet — there is no `/play` route in the shell that renders them sequentially with keyboard nav, and there are no populated per-slide files for chroma's variants. The chroma play directory at `src/pages/play/` is empty by design ([[../plans/Init-Chroma-Decks-Client-Site]] explicitly defers `/play`).

**Why it matters:** The Phase 1 → Phase 2 transition the founder needs is **rank → decompose → recreate → present**. Today the loop runs only as far as decompose. Without a `/play` runtime, the founder can't verify the per-slide files render, and the deck-iteration-workflow's Phase 2+ phases (per-slide iteration, audience-specific variants, the `/play` audience surface) are functionally blocked.

**Where it should live:** In the shell, as `/play/[deckSlug]/[variantSlug]/[slot]?`. Calmstorm has a working `/play` runtime today; the shell's version is a minimum-viable reimplementation (← / → keyboard, fullscreen F, chrome-toggle C). When calmstorm migrates onto the shell in Phase B, calmstorm's mature `/play` features fold back into the shell's version — for now, ship the minimum that lets chroma test the loop.

## Why these three together (and not separately)

A reasonable instinct is to author three small plans. Better: one cohesive Phase A+ plan, because:

1. **They share infrastructure.** The global nav, the in-scroll rank pill, and the `/play` runtime all live in the shell. Authoring them together keeps the shell's API additions coherent and avoids three round-trips through "expose this in the shell" → "consume in chroma" → "iterate."
2. **They share a consumer.** Chroma is the test substrate for all three. The same `pnpm dev` cycle exercises all three surfaces; the same Vercel preview verifies them.
3. **They share a verification target.** End-to-end the founder should be able to: open `/scroll/pitch/enhanced-v3/`, rank a slot in-place, click decompose, populate the per-slide file, hit `/play/pitch/enhanced-v3/` and present it. That story is the acceptance test of all three surfaces.
4. **None requires Phase A.7.** All three work in workspace-link mode. When the org-name decision resolves and we publish, Phase A+'s changes go to the registry together with Phase A's.

## What stays explicitly out of scope for Phase A+

These remain deferred to later phases or other plans — flagged here so the next plan stays small:

- **Lifting calmstorm's mature primitives** (PageAsDeckWrapper, SlideCanvas, ContentFit, MetaTags, GateScript, mode-switcher behavior, brand-mark slot). This is Phase B from the exploration. The Phase A+ global nav is the *only* primitive Phase A+ pulls forward from Phase B; the rest waits.
- **Auth + telemetry + admin.** Phase D from the exploration. Chroma's audience stays restricted-but-trusted; calmstorm stays on its own auth stack.
- **Export pipeline.** Phase E from the exploration.
- **The componentization plan's full execution.** Its destination-shift edit (one paragraph, per Open Question #4 of the exploration) is queued; the substance runs in Phase B / C.
- **Tier-aware MetaTags + `share/` + `publish/` infrastructure.** Captured in the componentization plan, lifted with calmstorm primitives in Phase B.
- **The dididecks-ai splash content-rollup of `@dididecks/shell`'s changelog + adoption status.** Exploration Open Question #5; splash-side work.

## Quick reference — where each gap is closed

| Gap | Where it's closed |
|---|---|
| Global nav chrome | [[../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]] Phase A+.1 |
| In-scroll-deck rank UI | Phase A+.2 |
| `/play` runtime + populated per-slide files | Phase A+.3 + Phase A+.4 |
| GitHub Packages org-name decision | Pending — unblocks Phase A.7 of [[../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]]; orthogonal to Phase A+ |
| Componentization-plan destination retarget | One-paragraph edit; queued under exploration Open Question #4 |

## Related

- [[../plans/Init-DidiDecks-as-core-Submodule-of-AI-Labs]] — the foundational repo-shape plan.
- [[../plans/Init-Chroma-Decks-Client-Site]] — chroma's scaffold; `/play` deferred here lands in Phase A+.
- [[../plans/Componentize-Slides-and-Establish-Component-Library]] — substantively unchanged; destination retargets into the shell.
- [[../plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]] — Phase A; status as documented above.
- [[../plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime]] — the next plan this exploration frames.
- [[Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] — the architecture exploration whose Phases A–E this inventory traces.
- [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — parent spec.
- [[../../changelog/2026-05-12_02]] — the ship-note for Phase A.

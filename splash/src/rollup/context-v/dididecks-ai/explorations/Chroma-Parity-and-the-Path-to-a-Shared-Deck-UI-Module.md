---
title: "Chroma-Decks Parity with Calmstorm-Decks, and the Path to a Shared Deck UI Module"
lede: "Calmstorm-decks carries roughly forty UI feature-surfaces that chroma-decks does not yet have. Initial framing weighed three paths (verbatim port, abstract-while-porting, full monorepo split); dialog landed on a fourth and lighter shape — the wrapping UI becomes `@dididecks/shell`, an Astro integration published to a private pnpm-scoped npm registry, consumed by each client-site's `astro.config.mjs`. Each client-site stays a standalone repo with its own Vercel deploy; content stays put; only the chrome travels. Phase A is the TOC + slide-ranking UI inside the shell, which doubles as the Phase 1 → Phase 2 tooling from the `deck-iteration-workflow` skill."
date_authored_initial_draft: 2026-05-12
date_authored_current_draft: 2026-05-12
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-12
at_semantic_version: 0.0.2.0
status: Draft
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Exploration
tags:
  - Chroma-Decks
  - Calmstorm-Decks
  - Parity
  - Shell-as-Integration
  - Astro-Integration
  - Path-Selection
  - Dididecks-Shell
  - Tier-Aware-Architecture
  - Deck-Iteration-Workflow
authors:
  - Michael Staton
date_created: 2026-05-12
date_modified: 2026-05-12
from: "dididecks-ai"
from_path: "context-v/explorations/Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module.md"
---
# Chroma-Decks Parity with Calmstorm-Decks, and the Path to a Shared Deck UI Module

> Living exploration. v0.0.1.0 mapped the option-space ("packages/ as a seed of a future monorepo"). v0.0.2.0 — captured after a dialog session on 2026-05-12 — replaces the recommendation with what the dialog actually landed: **`@dididecks/shell` as an Astro integration published to a private pnpm-scoped npm registry, consumed by each client-site's `astro.config.mjs`, each client deploying to its own Vercel project as before.** The option-space mapping is preserved below for future readers to see how we got here; the resolution section is the operative answer.

## Why this exists

Three client-engagements in (twf_site → calmstorm-decks → chroma-decks), we've discovered the recurring pattern called *deck workspace*: a private Astro site that holds one or more decks plus the audit, iteration, and (sometimes) gating chrome around them. **`calmstorm-decks` is the most-evolved instance**; it carries roughly forty UI feature-surfaces (auth, telemetry, admin, audit, component-library, design-system, drafts, export pipeline, plus the actual decks). **`chroma-decks` is the leanest**; it is a few days post-scaffold, with three-mode theming landed, one deck and four whole-deck variants registered, and almost none of calmstorm's chrome.

The user's framing in conversation:

> *"We have a lot of functionality there we do NOT YET have in `chroma-decks` and we would like to get to parity asap."*

This doc names what *parity* concretely means, then evaluates the three options the user proposed in that conversation. The companion plans this doc coordinates with:

- [[../plans/Init-Chroma-Decks-Client-Site]] — the scaffold plan that explicitly deferred `/play`, auth, and the variant chooser pattern as "not in v0.1." Some of those deferrals are now ready to lift; others are still appropriately out of scope.
- [[../plans/Componentize-Slides-and-Establish-Component-Library]] — the calmstorm-side plan to fix the `basics/`-as-dumping-ground taxonomy and stand up `primitives/`, `patterns/`, `share/`, `publish/`, `audit/`, `diagrams/`. **The componentization plan is the upstream supply of any shared module that chroma might consume.** Chroma cannot inherit components calmstorm has not yet promoted out of inline.
- [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — parent spec; NS-1 commits us to a two-sided system whose "Side 2" is the white-label publish surface this exploration is the early architectural seed of.

## The current state, in two columns

The gap, summarized:

| Feature surface | calmstorm-decks | chroma-decks | Comment |
|---|---|---|---|
| Page-as-deck wrapper (scroll-snap, keyboard, indicator) | `src/layouts/PageAsDeckWrapper.astro` | `src/layouts/PageAsDeckWrapper.astro` (parallel, simpler) | Two copies of the same pattern. **Prime abstraction candidate.** |
| Per-slide frame (16:9 letterbox or natural section) | `src/components/slides/SlideCanvas.astro` + `ContentFit.astro` | `src/layouts/SlideShell.astro` (natural section, no canvas) | Different shapes for different needs — canvas is for `/play` pixel-perfect; shell is for scroll. Both belong in a shared runtime. |
| Three-mode theme system (light/dark/vibrant) | Yes, Material-shape tokens | Yes, shadcn-shape tokens, all three modes filled | Token *shapes* differ per client brand; the *contract* (mode-switcher behavior) is identical. **Mode-switcher is abstraction-ready; tokens stay per-site.** |
| Mode toggle UI | `src/utils/...` (per-site) | `src/utils/mode-switcher.js` + `ModeToggle.astro` | Calmstorm doesn't surface the toggle (single-mode site). Chroma does. |
| Deck header + nav chrome (TOC, scroll, changelog, design-system, components) | `src/components/basics/DeckHeader.astro` + `DeckNav.astro` | Absent (homepage `index.astro` does it inline) | **Tier-aware abstraction candidate** — header content varies by which features the site exposes. |
| Variant-chooser route (deck variants gallery) | 17 per-slide choosers under `/{slug}/` | One whole-deck chooser at `/scroll/pitch/` | **Different patterns for different units** — calmstorm chooses *per-slide variant*, chroma chooses *per-deck variant*. Both are valid and both are first-class. |
| Scroll-deck cycler (←/→ between v1/v2/v3) | `src/lib/scroll-decks.ts` + `DeckNav` wiring | Absent — chooser is the entry, but in-deck cycle is not | **Should be abstracted as the deck/variant runtime layer.** |
| `/play` keyboard presenter mode | Full: `/play`, `/play/section/[slot]`, `/play/variant/[variant]`, F-fullscreen, C-chrome-toggle | Empty stub by design (Init plan defers) | Pull wholesale into chroma when the engagement asks for it, not before. |
| Drafts / per-slide A/B comparison surface | `/drafts/{slug}/{slug}-v{N}/` for 4 slides under active iteration | Absent — chroma uses whole-deck variants instead | These two patterns are complementary, not equivalent. Chroma is unlikely to need the per-slide pattern at this engagement. |
| Auth: passcode + signed-link, astro:db session, middleware, 90-day cookie | Full stack: `src/middleware.ts`, `src/lib/auth/`, `src/lib/gate.ts`, `/api/access/*` | Absent | **High-leverage abstraction** — every DD-grade deck needs it eventually. But chroma's audience right now is restricted-but-trusted; defer unless founder asks. |
| Telemetry: identities, sessions, pageviews, actions | `/api/track` + `/admin/activity` dashboard | Absent | Coupled to auth. Move together. |
| Data assets management (.md records for team/portfolio + audit pages) | `data/firms/calm-storm-ventures/{team,portfolio}/*.md` + `/data-assets/{companies,people,slides}` + `data-assets.ts` | Absent (chroma slide data is currently inline per slide) | Likely needed for chroma at the team / customer / asset-review stage. |
| Slide registry + status enum (urgent-redo / passable / perfect / pending) | `src/lib/slides.ts`, `slide-status.ts`, `data/audits/slides.json`, `/data-assets/slides` | Absent (status lives at the deck and variant level in `decks.ts`) | Calmstorm tracks slide-level; chroma tracks variant-level. Both useful at different scales. |
| Component registry (`component-registry.ts` — 39 KB, 647 lines, machine-readable manifest) | Yes | Absent | Calmstorm's is the seed corpus for the eventual `dididecks-visual-library` (per the [Visual library spec](../specs/Dididecks-AI-Visual-and-Diagram-Component-Library.md)). Premature to import into chroma. |
| `/design-system/` live token rendering | Yes | Absent (DESIGN.md exists; no route) | Worth porting to chroma in a small form — it's a one-page route that doubles as agent-readable contract. |
| `/component-library/` catalog index + per-component pages | Yes, scaffolded; per-component pages mid-build | Absent | Premature for chroma. |
| SEO + tier-aware MetaTags + share-card mechanics | `src/lib/seo.ts`, `MetaTags.astro` | Absent | **Top of the parity priority list** — even private decks need basic head meta + noindex. |
| LFM markdown rendering (`AstroMarkdown`, `Callout`, `CodeBlock`, `MarkdownImage`) | Yes, integrated | Absent | Worth pulling for the changelog route and any future memo-derived content. |
| Changelog route (index + per-entry) | `/changelog/` + `/changelog/[slug]/` with LFM | Repo has `changelog/` dir but no route | Trivially portable. |
| Export pipeline (Playwright + PDF stitch via `/dev/shot`) | `scripts/export-decks.ts` | Absent | **High-value for DD handoff.** Pull wholesale; it has no client-specific assumptions. |
| Component taxonomy under `src/components/` | `basics/`, `markdown/`, `nav/`, `patterns/`, `slides/`, `auth/` (mid-Phase-0 of the componentization plan) | `basics/`, `slides/` only | Chroma is *pre-Phase-0* — which is actually an advantage: it can adopt the post-Phase-0 taxonomy directly without paying for the migration. |

Forty-ish surfaces. About a quarter are *obvious abstractions*, half are *port-but-keep-local*, and the rest are *not yet, maybe never for this client.*

## Initial framing — three option-space candidates

> Preserved from v0.0.1.0 as the option-space mapping; the dialog (captured below in "Where the dialog landed") superseded this recommendation with a fourth and lighter shape. Keep reading for the historical reasoning that produced the resolution.

The user named three paths in conversation. Restating and pressure-testing each:

### Option 1 — Verbatim port, feature by feature

**Shape.** Copy the file from calmstorm-decks, adjust imports, ship. Repeat for every feature in the table above that chroma needs. No abstraction, no shared module, no taxonomy work.

**Why this is tempting.** The Chroma init plan explicitly says *"no yak shaving"* — the engagement is a friend-of-the-house fundraise with most of the round committed before materials needed to be polished. Speed matters; perfection is the enemy. Verbatim port is the fastest route to a feature on screen.

**Why this is a trap anyway.**
- It encodes a taxonomy debt we already know how to fix. Calmstorm's `basics/` is the *symptom* the componentization plan exists to address. Porting `basics/AssetsDataPanel.astro` into chroma's `basics/` doubles the migration cost when the componentization plan eventually catches up.
- It produces *two* copies of every primitive (PageAsDeckWrapper, SlideCanvas, ContentFit, mode-switcher, MetaTags). Changing one means remembering to change the other. Calmstorm's plan-author called this exact problem out: *"the cost of changing the 'card' style today is editing it in 51+17×3 = 102 places."*
- It teaches the agent (and the next agent who arrives) that *copy-then-adjust* is the right gesture. The Lossless cross-engagement learning loop ([[Client-Site-Baseline-v2]] — not yet authored) is supposed to close exactly this loop. Verbatim port is the gesture that prevents it from closing.

**When option 1 *is* the right gesture.** For features that **a)** have no abstraction surface yet because calmstorm hasn't promoted them out of inline, **and b)** chroma needs *right now* to ship to a partner meeting. Specifically: the export pipeline (`scripts/export-decks.ts`) is portable as-is, no abstraction needed. So is the changelog route. Verbatim is fine *for these.*

### Option 2 — Abstract while porting

**Shape.** Each time chroma needs a feature from calmstorm, ask: *is this a primitive worth promoting to a shared workspace package, or is it a client-bespoke surface?* If primitive: lift to a shared module and have *both* sites consume it. If bespoke: port verbatim and move on.

**Why this fits.** Chroma-decks is near-greenfield — it has no legacy slides to refactor. The abstraction pressure is on the *source* side (calmstorm has the legacy), not the *destination* (chroma is empty). That's the *easy* direction for promotion: write the abstraction once for chroma, then ask "can calmstorm consume this too?" If yes, two consumers → abstraction validated. If no, the abstraction was premature; back out.

This also matches the parent spec's principle of letting empirics drive the library, not advance speculation. From the parent spec: *"Six prior implementations means we have strong empirical priors about what works, what we keep rebuilding, and what every new engagement deserves to inherit instead of re-invent."*

**Why this is uncomfortable.** It's slower than option 1 *for each individual feature.* The first port is "feature + workspace package + two consumers" instead of just "feature." But the rate of abstraction is one-feature-at-a-time and bounded by what chroma actually needs — so the slowdown is measured and visible, not open-ended.

**The risk to name.** *Premature abstraction.* The discipline that keeps option 2 honest: a primitive only gets promoted when it has **two consumers**, not just one. If chroma needs a feature and calmstorm has it but doesn't currently want to refactor onto a shared module, **the feature gets copied for now and the shared-module plan is deferred until the third engagement asks for it.**

### Option 3 — Initiate the full Didi Decks monorepo, with frontend UI fully separated

**Shape.** Promote `dididecks-ai/` from "pseudomonorepo with two `client-sites/` children" to a true monorepo with `packages/` (the runtime, UI kit, design tokens), `apps/` (the native shell from memopop-ai precedent, the white-label publish surface), and `client-sites/` (calmstorm + chroma + reach-edu-hub) becoming consumers of `packages/`. This is the parent spec's NS-1 endgame and the eventual home of the Component Library described in the [Visual library spec](../specs/Dididecks-AI-Visual-and-Diagram-Component-Library.md).

**Why this is right *eventually*.** Every architectural commitment in the parent spec (two-sided system, white-label publish surface, native private workspace, embedded chat, bundled agent-skills) bottoms out in a true monorepo with `packages/`, `apps/`, and shared design-tokens. Option 3 is not a *whether*; it's a *when*.

**Why it is wrong *now*.** The componentization plan explicitly defers the cross-site library: *"Does not generalize to other client-sites yet. The library that emerges here is the seed of the cross-site library described in the sibling spec — promotion to a shared package (under `dididecks-ai/packages/` or similar) is a separate, future plan."* That deferral is load-bearing — we haven't shipped enough engagements yet for the abstractions to be right. Calmstorm + chroma is **N=2 in active iteration**. The third client-site (reach-edu-hub) hasn't been deeply re-touched yet. **N=3 is the minimum** before the right primitives reveal themselves; option 3 at N=2 ships a brittle abstraction we'd then have to break.

There is also a sequencing risk: option 3 has a large surface (workspace tooling, build pipelines, package publishing posture, versioning policy, the native shell question per NS-1, etc.). It is the kind of multi-week setup task that displaces the actual fundraise work the engagements exist to deliver. The Chroma init plan's *no-yak-shave* discipline applies here at the meta level.

## Where the dialog landed (2026-05-12)

The three options above are real, but a fourth shape emerged in conversation and turned out to be cleaner than any of them: **the wrapping UI becomes `@dididecks/shell`, an Astro integration published to a private pnpm-scoped npm registry; each client-site stays a standalone Astro project + standalone GitHub repo + standalone Vercel project, with `@dididecks/shell` added as a single dep in `package.json` and registered in `astro.config.mjs`.** All wrapping functionality (layouts, nav chrome, mode-switcher, TOC, audit/ranking UI, `/play` runtime, auth/telemetry when needed, export pipeline) lives in the shell. All content (decks, theme tokens, deck registry, audit data, brand assets, `DESIGN.md`, `corpus/`) stays in the client-site. The client experiences a single coherent static site at a single domain (e.g., `decks.trychroma.com`); the shell/content split is invisible to them.

This is option 3 (full monorepo split) in a much lighter form. It is option 2 (abstract while porting) with a real published artifact rather than a workspace-local package. It is *not* option 1 (verbatim port). And it is *not* the `packages/` proposal from v0.0.1.0 of this doc — that proposal could not deploy to Vercel cleanly because Vercel couldn't resolve `workspace:*` deps from a standalone client-site repo. Publishing to a private pnpm-scoped npm registry fixes that without forcing the client-sites to give up their independent repo posture.

### The architecture, concretely

**`@dididecks/shell`** — a pnpm-managed scoped package, published privately, structured as an [Astro integration](https://docs.astro.build/en/reference/integrations-reference/). Lives at `dididecks-ai/apps/deck-shell/` in the dididecks-ai monorepo. Consumed by each client-site via:

```ts
// client-sites/chroma-decks/astro.config.mjs
import { defineConfig } from 'astro/config';
import dididecksShell from '@dididecks/shell';

export default defineConfig({
  integrations: [
    dididecksShell({
      client: 'chroma-decks',
      contentRoot: './src',           // where decks, theme, registry live
      auditsPath: './data/audits/slides.json',
      distributionTier: 'private',    // tier resolver default for unmapped routes
    }),
  ],
});
```

The integration uses Astro's `injectRoute` hook to add the wrapping routes (TOC, audits, `/play`, `/changelog`, `/design-system`, eventually `/admin`), exposes layouts and components via package exports (`@dididecks/shell/layouts`, `@dididecks/shell/components`), and registers middleware via `astro:config:setup` when the client opts into auth/telemetry. The chroma-side repo's `src/` shrinks to:

- `src/pages/scroll/pitch/{variant}/index.astro` — the actual decks (Phase 1 single-page variants, plus eventually Phase 2 decomposed per-slide files)
- `src/data/decks.ts` — deck registry (already exists)
- `src/styles/theme.css` — brand tokens (already exists, all three modes filled)
- `data/audits/slides.json` — slide-ranking persistence (new; the shell reads + writes here)
- `public/` — brand assets (already exists)
- `DESIGN.md`, `corpus/`, `changelog/` — as they are
- `package.json` with `"@dididecks/shell": "^0.x.y"` — the single new dep

The integration injects everything else from `@dididecks/shell`. The client-site no longer needs its own `PageAsDeckWrapper`, `SlideShell`, `ModeToggle`, `Wordmark` (when shell-provided variants exist), header chrome, or any of the calmstorm-port surfaces below.

**Deployment topology (Path A from the dialog).** Each client-site stays exactly as it deploys today:

- Vercel project connects to `lossless-group/chroma-decks` (standalone repo, unchanged).
- Build command: `pnpm install && pnpm build`.
- Output: single static `dist/` served at `decks.trychroma.com` or whichever production domain.
- Upgrading the shell is intentional: `pnpm up @dididecks/shell` in the client repo, commit the `package.json` + lockfile bump, push, Vercel redeploys. The client controls when their shell version moves.

**Tooling note:** the toolchain is pnpm end-to-end. Every install, publish, lockfile, script, doc snippet, CI config, and Dockerfile uses `pnpm` — not npm, not yarn, not bun. `@dididecks/shell` publishes to the npm registry (because that is the registry), but every CLI invocation is pnpm. This is non-negotiable; see saved feedback memory `feedback_pnpm-always-never-npm.md`.

### Per-feature parity plan (post-dialog)

Working order recast around the dialog's actual priorities. Phase A is the founder-facing iteration loop; everything else falls in behind it.

**Phase A — Stand up `@dididecks/shell` at minimum scope + ship the TOC + slide-ranking UI (highest priority, founder-facing).**

This is the actual next step the user asked for. The TOC + slide-ranking UI doubles as the **Phase 1 → Phase 2 transition tooling from the `deck-iteration-workflow` skill**: as the founder ranks each slide of a single-page variant, the ranking output generates the decomposition queue (urgent-redo slides first), and the shell scaffolds empty per-slide files (`src/components/slides/{variant}/{nn}-{slot}.astro`) ready for the non-destructive recreation pass that makes the play UI work.

1. **Scaffold `apps/deck-shell/`** in the dididecks-ai monorepo. Astro integration package, pnpm-managed. `package.json` declares `"name": "@dididecks/shell"`, `"publishConfig": { "access": "restricted", "registry": "..." }`, and an entrypoint that exports the integration factory. Initial dependencies: `astro` (peer), no other runtime deps yet.
2. **Implement the integration's `astro:config:setup` hook** to inject the seed routes. For Phase A, that is just two: `/toc/[deckSlug]/[variantSlug]` (slide table-of-contents for a given deck variant, with per-slide ranking pills) and `/api/slide-rank` (POST upsert; dev-only, static-build skips it). Source the route bodies from `apps/deck-shell/src/routes/`.
3. **Read the deck registry** from the client-site at build time via `Astro.glob` or a content-collection adapter, falling back to `import('../../data/decks.ts')` based on the `contentRoot` integration option.
4. **Build the TOC view.** Lists each section of the active variant (for a Phase 1 single-page deck like chroma's enhanced-v3, sections are read from the variant's `.astro` file's section IDs or from a manually-declared `src/data/slides.ts` registry — start with the manual registry, automate later if it stabilizes). Each row shows the section's title, current status from `data/audits/slides.json`, and four ranking pills using the existing calmstorm enum verbatim: `urgent-redo` / `non-urgent-could-be-better` / `passable` / `perfect` / `pending` (pending is the implicit default).
5. **Wire the write-back.** Click a pill → POST `/api/slide-rank` with `{ deckSlug, variantSlug, slot, status, notes? }` → the shell upserts into `<client>/data/audits/slides.json`. Dev-only; static build skips the route (as calmstorm's `/api/slide-status` already does).
6. **Wire the decomposition stub generator.** When a slide is ranked `urgent-redo` or `non-urgent-could-be-better` for the first time, the shell offers a "scaffold per-slide file" action that creates `client-sites/chroma-decks/src/components/slides/{variant}/{nn}-{slot}.astro` as an empty non-destructive recreation stub. The single-page variant remains untouched (the scroll UI keeps rendering from it); the new per-slide file becomes the unit the play UI eventually renders. This is the Phase 1 → Phase 2 boundary made concrete.
7. **Install in chroma-decks.** During shell development, install via pnpm using a tarball or local-link (`pnpm add ../../../apps/deck-shell` from the chroma repo, or `pnpm link --global`). Once the shell stabilizes, publish v0.1.0 to the private pnpm-scoped npm registry and switch chroma to the published version. `pnpm pack` + visual smoke test before the first publish.
8. **Verify on Vercel.** Push chroma-decks to its `development` branch, confirm Vercel resolves `@dididecks/shell` from the private registry, build succeeds, `/toc/pitch/enhanced-v3/` renders the four-variant TOC with ranking pills.

**Phase B — Lift calmstorm's mature primitives into the shell; chroma becomes the first consumer.**

Calmstorm is the *source* of mature, battle-tested primitives (calmstorm has shipped to a sensitive partner audience and has been through real iteration). Chroma carries lighter parallel copies of a few of them. The shell takes the calmstorm versions; chroma deletes its own lighter copies and imports from the shell. Calmstorm itself migrates onto the shell *after* chroma has stress-tested the shell's API — that ordering is deliberate (see Open Question #3 on calmstorm migration window).

9. **Lift calmstorm's `PageAsDeckWrapper.astro` into `@dididecks/shell/layouts/`.** Calmstorm's `src/layouts/PageAsDeckWrapper.astro` is the source; the shell version supersedes both calmstorm's and chroma's. Chroma's lighter `src/layouts/PageAsDeckWrapper.astro` deletes; its consumers import `from '@dididecks/shell/layouts'`.
10. **Lift calmstorm's `SlideCanvas.astro` + `ContentFit.astro` pair into `@dididecks/shell/layouts/`.** These are the 16:9-letterboxed slide stage that the `/play` runtime will eventually render and that the export pipeline captures. Chroma's lighter `SlideShell.astro` (natural section, no canvas) stays alongside as a second layout option in the shell — both are valid slide-frame patterns and both are part of the shell's surface.
11. **Lift calmstorm's `MetaTags.astro` into `@dididecks/shell/meta/`.** Tier-aware per the [componentization plan Phase 0.5](../plans/Componentize-Slides-and-Establish-Component-Library.md). Chroma at `private` tier emits `noindex,nofollow`, base meta, no OG, no canonical, no JSON-LD. Default fail-closed to `private`. Pull `src/lib/seo.ts` shape (not the calmstorm-specific values) into the shell as well.
12. **Lift calmstorm's `DeckHeader.astro` + `DeckNav.astro` into `@dididecks/shell/components/`.** Both are tier-aware: nav links query the distribution-tier resolver to decide what to surface. Chroma at `private` tier shows TOC · Scroll · Changelog; calmstorm at `private` tier additionally shows Design System and Components because those routes exist on calmstorm. Header *shape* is shared; header *content* is configured per-client via integration options.
13. **Lift calmstorm's `GateScript.astro` + `src/lib/gate.ts` into `@dididecks/shell/auth/`.** The "polite" localStorage gate (not a security boundary). Available to client-sites that want the cover-page-gate posture without the full auth stack.
14. **Build the mode-switcher behavior into `@dididecks/shell/runtime/`.** This is the one primitive calmstorm doesn't have (calmstorm is single-mode). Chroma's `src/utils/mode-switcher.js` is the working reference — the shell version is a clean reimplementation of the same contract (storage key, system-preference detection, cycle order, custom event), not a chroma-side lift. The UI affordance (`ModeToggle.astro`) stays per-client because the toggle's *visual* presentation varies per brand; shell exports a default `ModeToggle.astro` clients may override.
15. **Lift the per-client brand-mark slot pattern.** Shell provides `BrandMark.astro` that takes a `variant` prop and slots in the client's SVG by convention (`public/brand/{variant}.svg`). Chroma's `Wordmark.astro` and `ChromaMark.astro` collapse to thin client-side overrides if they need to stay; the SVGs themselves stay in `client-sites/chroma-decks/public/brand/`.

**Phase C — Iteration affordances and parity routes.**

16. **`/changelog/` route** — shell injects the route, reads from `<client>/changelog/`, renders via LFM (`@lossless-group/lfm` + `AstroMarkdown`). LFM stays an existing Lossless package, not re-exported through `@dididecks/shell`.
17. **`/design-system/` single-page route** — live rendering of the client's `DESIGN.md` token tables. Shell-injected route, client-provided source.
18. **Polish the variant chooser at `/scroll/pitch/`** — richer cards, status badges, last-updated. Either stays as a client-side page or moves into the shell as `/scroll/[deckSlug]/` index.

**Phase D — Deferred surfaces (pull when the engagement asks).**

19. **The full Componentize-Slides plan executes inside `@dididecks/shell/components/`** — not inside `client-sites/calmstorm-decks/src/components/`. This is a meaningful shift from [[../plans/Componentize-Slides-and-Establish-Component-Library]] as currently written: the destination of the componentization is the shell, and *every client benefits simultaneously* as primitives stabilize. The plan's directory taxonomy (`basics/`, `primitives/`, `patterns/`, `share/`, `publish/`, `audit/`, `diagrams/`) lands in the shell. Calmstorm's existing `src/components/` migrates *into* the shell as the seed corpus, with client-bespoke remainders staying behind.
20. **`/play` runtime** — keyboard left/right, fullscreen, chrome toggle. Renders the per-slide files generated by Phase A's decomposition stub generator. Pulled wholesale from calmstorm's `/play`, `/play/section/[slot]`, `/play/variant/[variant]`. Lives in the shell.
21. **Auth + telemetry + admin** — `@dididecks/shell` exposes opt-in middleware that registers the auth flow (passcode + signed-link), session model, telemetry endpoints, and admin dashboard. Client-sites enable it via the integration option. Chroma probably stays *off* until the audience graduates from restricted-but-trusted; calmstorm stays *on*. The underlying database is per-client (each Vercel project gets its own astro:db / Turso / Postgres) so cross-client data never mixes.
22. **Data-assets `.md`-driven content + audit pages** — shell injects the `/data-assets/{companies,people,slides}` routes; client provides the `.md` records.

**Phase E — Opportunistic.**

23. **Export pipeline (`scripts/export-decks.ts`)** — lifted from calmstorm wholesale; lives in the shell as `pnpm dlx @dididecks/shell export` (or `@dididecks/shell/cli`). Runs Playwright against the client's running dev server, captures `/play/section/{slot}` snapshots, stitches per-variant PDFs. Chroma immediately benefits.

### Looking ahead: realtime / SSR as a v2 hook

V1 is static — every content change rebuilds the per-client container/dist and redeploys. **Deliberate v2 hook:** when a client surface eventually needs realtime data (live KPI tickers, in-meeting Q&A capture, telemetry-driven slide adaptation, founder-side live edits during a partner meeting), the shell upgrades to Astro SSR + a per-client database connection. The integration shape lets us toggle this per-client via an option (`runtime: 'static' | 'ssr'`) without rewriting consumer code. Not a v1 concern; explicitly flagged so the architecture leaves room for the swap.

### What this commits to vs. defers

**Commits to:**

- `@dididecks/shell` exists as an Astro integration package and ships v0.1.0 to a private pnpm-scoped npm registry as the Phase A deliverable.
- Client-sites stay standalone GitHub repos with standalone Vercel projects. The submodule pattern in dididecks-ai keeps working; the content lives in the same place it does today.
- `dididecks-ai/apps/deck-shell/` is the canonical home of the shell source within the monorepo.
- pnpm everywhere, never npm CLI.

**Defers (in priority order):**

- The componentization plan's directory-taxonomy migration moves *into the shell* rather than landing inside calmstorm's `src/components/`. The plan needs a small follow-up edit to record that destination change; the *substance* of the plan (the taxonomy, the primitive promotion rules, the tier-aware split) stays correct.
- Full monorepo flip (the original "option 3"). Not needed for Path A deployment; revisit only if a client engagement triggers a deeper integration requirement.
- The native shell from NS-1 (Tauri inheritance from memopop-ai). Future spec-level work; the published `@dididecks/shell` is a precondition but not blocker.
- SSR + realtime DB hydration. V2 hook, not v1 concern.
- `@dididecks/visual-library` as a separate package. Emerges from the componentization plan's Phase 2 once primitives stabilize with two real consumers.

## Why this shape is right (the meta-argument, restated)

Three forces push toward the resolution:

1. **Vercel-deployability without architectural compromise.** Path A makes each client-site's deploy *identical to today's* — same repo, same Vercel project, same domain, same `dist/` — while still letting the shell evolve as a single coherent unit. No monorepo-flip refactor, no submodule juggling, no package-publishing infrastructure beyond a single private pnpm-scoped registry.
2. **The empirical-prior commitment from the parent spec.** Letting the shell stabilize via *real consumption* by chroma (Phase A) before pulling calmstorm onto it (Phase B) is the disciplined ordering. Chroma is greenfield enough to absorb a v0.1 shell without legacy-component drag; calmstorm migrates second when the shell's API has been tested against one real consumer.
3. **The non-destructive-iteration commitment from the parent spec.** Design Principle #3 — "*never destroy.*" The shell-as-integration architecture lets chroma adopt the shell while keeping its current `src/` intact during transition: install dep, register integration, gradually shrink `src/` as shell-provided surfaces take over. Calmstorm follows the same path. No big-bang refactor; no working state ever broken.

## Concrete next-step actions

If you sign off on this resolution, the next plan to author lives at `dididecks-ai/context-v/plans/`:

`Plan-Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking.md` — the Phase A executable plan. Breaks into:

1. Scaffold `apps/deck-shell/` as an Astro integration package (pnpm, scoped, restricted publish access).
2. Implement the TOC + slide-ranking routes inside the shell.
3. Implement the decomposition-stub generator that bridges deck-iteration-workflow Phase 1 → Phase 2.
4. Install in chroma-decks (local link during dev; private publish + `pnpm up` for the first stable release).
5. Verify on Vercel: chroma-decks builds with shell as dep, TOC + ranking renders, write-back works in dev, static build succeeds.

The plan also queues a small follow-up edit to [[../plans/Componentize-Slides-and-Establish-Component-Library]] noting that the componentization destination moves from calmstorm's `src/components/` to `@dididecks/shell/components/` — the substance is unchanged, just the location.

## Open questions

1. **Reach-edu-hub as third consumer.** When does reach-edu-hub adopt the shell? Strong prior: after chroma + calmstorm have both consumed v0.1 cleanly, route reach onto it as a "visiting consumer" pass. Adds the N=3 data point without disrupting reach's own iteration cadence.
2. **Private pnpm-scoped npm registry — which registry?** Options: GitHub Packages (free for private, integrates with lossless-group org auth), npm-private (paid), self-hosted Verdaccio. Strong default: **GitHub Packages**, because auth piggybacks on existing org membership and Vercel can authenticate to it with a single `NPM_AUTH_TOKEN` env var. Confirm before Phase A step 1 ships.
3. **Calmstorm migration window.** Phase B asks calmstorm to delete its own `PageAsDeckWrapper` etc. in favor of the shell's. Calmstorm is mid-iteration with a sensitive partner; the migration commit is "install shell + switch imports + delete originals" in one diff, visually verified before push. Acceptable if you call a quiet window for it.
4. **Componentize-Slides plan edit.** That plan currently refactors calmstorm's components in place. Now that the destination is `@dididecks/shell`, the plan needs a small frontmatter / Phase-0 update saying "the migration destination is the shell, not in-place." Substance unchanged; one short paragraph. Do this as part of Phase A or as a separate cleanup?
5. **What rolls up to the dididecks-ai splash.** Once `@dididecks/shell` is published privately, the splash should surface its README, version, changelog, and per-client adoption status. Splash work is its own concern; flagged here so the splash plan ([Phase 3 of the Init plan](../plans/Init-DidiDecks-as-core-Submodule-of-AI-Labs.md)) knows about the package when it lands.

## Related

- [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — parent spec. NS-1's two-sided system commits us to a shared frontend UI eventually; `@dididecks/shell` is the architectural seed of NS-1 Side 2's white-label publish surface.
- [[../specs/Dididecks-AI-Visual-and-Diagram-Component-Library]] — sibling spec. Visual primitives eventually live inside `@dididecks/shell/diagrams/` (or split into a sibling `@dididecks/visual-library` if the surface grows).
- [[../specs/Dididecks-AI-DD-Ready-Citation-and-Source-Access]] — sibling spec. Citation primitive remains a north-star concern; not on the Phase A/B path.
- [[../plans/Componentize-Slides-and-Establish-Component-Library]] — the componentization plan's destination shifts from calmstorm's `src/components/` to `@dididecks/shell/components/`. Substance unchanged; needs a small frontmatter / Phase-0 edit. Tracked in Open Question #4.
- [[../plans/Init-Chroma-Decks-Client-Site]] — the chroma scaffold plan that deferred `/play`, auth, drafts. This exploration's Phase A respects those deferrals; everything past Phase B defers further.
- [[../plans/Init-DidiDecks-as-core-Submodule-of-AI-Labs]] — the dididecks-ai monorepo init plan. This exploration adds `apps/deck-shell/` to that monorepo's eventual shape; the init plan's phases are otherwise unaffected.
- [[Chroma-Brand-and-Deck-Notes]] — the per-client design-token call (shadcn for chroma vs. Material for calmstorm). Relevant because the shell reads semantic tokens whose shapes intentionally differ per client.
- [[Dididecks-AI-Business-Model]] — sibling exploration. The hosted-tier and Forward-Deployed motions are downstream of having a shippable runtime; `@dididecks/shell` is upstream of those motions becoming concrete.
- `astro-knots` skill — framework prohibitions `@dididecks/shell` inherits (no React, no JSX, no Angular).
- `deck-iteration-workflow` skill — the six-phase rhythm Phase A's TOC + ranking + decomposition-stub-generator operationalizes.
- `pseudomonorepos` skill — the placement rules for `apps/` vs. `packages/` vs. `client-sites/`.
- `theme-system` skill — the two-tier-tokens / three-modes / read-semantic-tokens discipline the shell enforces.
- `context-vigilance` skill — the framework this exploration follows.

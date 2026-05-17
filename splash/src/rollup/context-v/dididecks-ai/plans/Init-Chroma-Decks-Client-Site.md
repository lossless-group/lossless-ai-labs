---
title: "Init Chroma Decks Client-Site"
lede: "Stand up `client-sites/chroma-decks` for an early-growth-stage portfolio company raising a round — radically improve the founder's existing materials, marry them with MemoPop-generated investment memos and market research, and use the engagement to harden the calmstorm-decks template into a reusable client-site baseline."
date_created: 2026-05-11
date_modified: 2026-05-16
date_first_published: 2026-05-11
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.1.0
tags:
  - Plan
  - Client-Site
  - Chroma
  - Founder-Fundraise
  - MemoPop-Integration
  - Calmstorm-Decks-Derivative
  - Three-Modes-Discipline
status: Shipped
post_ship_note: |
  The `/play` deferral noted inside this plan was lifted by Phase A+
  (DidiDecks shell `/play/[deckSlug]/[variantSlug]/[slot]/` runtime).
  Chroma now has Play-UI for proto, enhanced-v2, and enhanced-v3
  variants via per-slide files under `src/components/slides/`.
from: "dididecks-ai"
from_path: "context-v/plans/Init-Chroma-Decks-Client-Site.md"
---
# Init Chroma Decks Client-Site

> Plan of record for scaffolding `dididecks-ai/client-sites/chroma-decks` as a private GitHub repo under the `lossless-group` org, derived from the `calmstorm-decks` infrastructure but rebuilt from scratch with the structural lessons baked in. The engagement is a friend-of-the-house founder fundraise — most of the round is already committed, materials are the rate-limiter, and Chroma's existing webUI does not yet honor the three-modes (dark / light / vibrant) discipline. This plan covers init through a presentable v0.1; deck-content authoring is downstream.

## Engagement context (read this first)

- **Client.** Chroma (the vector-DB / embeddings company). The founder is known, trusted, and a friend. We use the product.
- **Fundraise posture.** Early-growth stage. **Most of the round is committed** before materials needed to be polished — so the bar is *radical improvement of an already-good story*, not *create from nothing under panic.* The slack on timeline is real but not infinite; treat as a 1–2 week sprint, not a 6-day burn.
- **Audience asymmetry.** Unlike `calmstorm-decks` (a VC firm pitching LPs), `chroma-decks` is a **startup pitching VCs.** Same DD-focused use case — startup DD still demands technical depth, ARR/usage curves, retention, design partners, infra economics, AI-era positioning — but **the bar is a bit lower** here because much of the round is already committed and the founder is trusted-relationship-funded, not cold-pitching. Pragmatic implication: **no yak shaving**. We move quickly, ship the scroll surface, and leave perfectionism for the next deck.
- **Existing prior art.** Founder's deck exists. Chroma's brand exists. **Neither follows the Lossless three-modes discipline** (dark / light / vibrant) — they have a single visual register. We **scaffold all three modes from day one** because retrofitting tokens later causes painful refactor loops; the second and third modes will be designed in a **separate, dedicated session** where we iterate with the user to converge a three-mode palette that respects Chroma's identity. Not in scope for this plan.
- **MemoPop already ran on Chroma.** Multiple investment-memo variants exist from prior MemoPop work. Those + the company's own materials will live in a `corpus/` folder inside the new client-site (mirrors how we put `context-v` files into Chroma for context-vigilance work — same pattern, inverted direction). **Do not block this plan on integrating the corpus** — scaffold the folder, drop the materials in later.

## Pseudomonorepo discipline this plan honors

- **Inline-first, submodule-when-stable.** The strict pattern is "each client-site is its own GitHub repo, attached as a submodule." For speed, we will create the GitHub repo *and* the submodule pointer up front (cheap to do, expensive to retrofit). The work happens on `development` from minute one. See [[Init-DidiDecks-as-core-Submodule-of-AI-Labs]] for the precedent.
- **Three-tier branch model from day one.** `development` → `main` → `master`. All three branches created at repo init so we don't pay the cost later. `development` is the working branch.
- **Branch alignment vigilance.** Per the pseudomonorepos skill: "we need to try to keep `main` and `master` at parity over time." Document a promotion rhythm in the changelog (Phase 6 below) rather than letting them drift silently.
- **Universal directories.** `context-v/` and `changelog/` as siblings at the repo root from day one.
- **Rollup-readiness.** `branch = development` in `dididecks-ai`'s `.gitmodules`. Conventional `context-v/` and `changelog/` shapes so the dididecks-ai splash (and ai-labs splash above it) can later surface this repo's content via the GitHub Content API.

## What we are deliberately keeping vs. rebuilding from `calmstorm-decks`

`calmstorm-decks` is the most recent, most-evolved client-site we've shipped. It is the substrate, not the template. We **keep its primitives** and **rebuild its content surface** with the lessons learned.

### Keep (copy verbatim, then adapt)

- `astro.config.mjs` shape — Astro 6 + Tailwind v4 via `@tailwindcss/vite` + `@astrojs/vercel` static + Astro Fonts API.
- `tsconfig.json`, `.npmrc`, `.gitignore`, `pnpm-workspace.yaml` shape.
- `src/layouts/SlideLayout.astro` and `src/layouts/PageAsDeckWrapper.astro` as the deck primitives.
- `src/layouts/sections/` pattern for reusable section wrappers.
- `src/components/basics/` and `src/components/markdown/` — generic UI atoms and LFM renderers.
- `src/pages/api/` and `src/pages/changelog/` patterns.
- `src/pages/drafts/{slug}/{slug}-vN.astro` variant-page pattern — the non-destructive iteration discipline (Design Principle #3 of the parent spec).
- `scripts/export-decks.ts` — Playwright-based Keynote-grade export (Design Principle #6).
- `DESIGN.md` as a Stitch-spec document. Re-author its contents for Chroma; keep the structure.
- `context-v/` directory roles (specs / explorations / narratives / changelogs / sitemap).
- `package.json` metadata pattern (the `calmstorm: { ... }` site-surfaces block becomes `chroma: { ... }`).

### Rebuild (do not copy)

- All `src/pages/{topic}/` route folders — those are Calm/Storm-specific surfaces (thesis, identity-pillars, fund-terms, LPAC, etc.). Chroma's routes will reflect a startup pitch, not a fund teaser.
- `src/slides/by-title/` — entirely Calm/Storm slide variants.
- `src/data/*.ts` — calmstorm-specific structured data (LPAC members, venture team, portfolio snapshot). Chroma will have its own typed data (design partners, customers, infra metrics, team).
- `context-v/narratives/01-…-17-*.md` — the Calm/Storm slide-by-slide narrative source-of-truth. Chroma will write its own narrative set, numbered to match its slide order.
- `draft-palette__CalmStorm.json` — replaced with `draft-palette__Chroma.json` driven by Chroma's brand.
- `vercel.json` — verify and adapt for the new project.

### Introduce (new for this engagement)

- **`/scroll` and `/play` are thumb-gallery indexes, not auto-launching slideshows.** Both `/scroll/index.astro` and `/play/index.astro` render a **gallery of available decks** (thumbnail cards with title, lede, last-updated). The user clicks a card to enter a deck. **The format-namespace is not a single deck.** Individual decks live at `/scroll/{deck-slug}/` and `/play/{deck-slug}/`. This pattern travels — a client engagement often produces multiple decks (teaser, full pitch, board update, audience-specific variants) and the format-index is where they coexist.
- **`/scroll` is the v0.1 surface — not `/thesis`.** Calmstorm uses `/thesis` for its scroll-deck routes; `thesis` is a fund-side word. Chroma uses `/scroll` — the format name travels better for a startup deck. **The rate-limiter for v0.1 is: `/scroll/` (gallery) and `/scroll/{first-deck-slug}/` (one real deck) both build and render.** Everything else is paced to land after this.
- **`/play` deferred — pull from calmstorm-decks later.** The Reveal-style "play" runtime (left/right slide-by-slide navigation, presenter mode) lives in calmstorm-decks. We **do not port it during v0.1.** A stub `/play/index.astro` exists rendering an empty gallery state ("no play decks yet"), so the route shape is reserved, but the runtime and any actual play decks are lifted from calmstorm in a later pass. Deliberate ordering: scroll first, play later, *not* both at once. (This is the no-yak-shave posture.)
- **`corpus/` folder** at the repo root. Holds MemoPop-generated investment memos, market-research artifacts, the founder's original deck, and any source material the deck draws from. **Not deployed.** This is the substantiation layer — the DD-bar evidence behind every claim that surfaces in `src/`. Mirrors the way we put `context-v` files into Chroma the database for context-vigilance work, but inverted: here Chroma-the-company's source material lives in a folder named `corpus/` and feeds the deck. (See Phase 5 for `.gitignore` posture.)
- **Three-modes scaffolding from day one — load-bearing.** Stand up `theme.css` with `light`, `dark`, `vibrant` modes immediately. **Reason: retrofitting tokens into components later causes painful refactor loops** — every component has to be revisited and re-wired. Cheaper to scaffold all three slots up front, even if two are stubs, than to add the third mode after the fact. Chroma's current visual register fills *one* of the three slots (TBD which — to be decided in the brand-iteration session below).
- **Chroma three-mode palette is OUT OF SCOPE here — separate session.** Chroma's brand does not currently carry a three-mode palette. Designing one that respects their identity is **its own dedicated session** with the user, not part of this scaffold plan. For v0.1, Chroma's existing register fills one slot; the other two carry placeholder tokens marked `TBD` so the build does not break. Converging the real three-mode palette is a follow-up — do not block this plan on it.
- **No three-modes toggle in the UI yet.** Build the token system; defer the user-facing toggle until the brand-iteration session lands modes 2 and 3.

## Phase 1 — Create the empty GitHub repo (private, lossless-group org)

**Final location of the working tree:** `ai-labs/dididecks-ai/client-sites/chroma-decks/`.
**Final location on GitHub:** `https://github.com/lossless-group/chroma-decks` (private).

### Actions

1. **Create the GitHub repo via `gh`** while it is still empty. No README/license/gitignore from GitHub — we will seed those locally in Phase 2.
   ```bash
   gh repo create lossless-group/chroma-decks --private --description "Chroma · founder fundraise materials — Astro-driven, private, gated workspace presenting the company's positioning, traction, team, and round terms to a controlled audience of prospective VCs."
   ```
2. **Verify** the repo exists and is private.
   ```bash
   gh repo view lossless-group/chroma-decks --json visibility,defaultBranchRef
   ```
3. **Do not clone yet.** Phase 2 builds the working tree locally, then pushes.

### Constraints / verification

- Confirm `gh auth status` is logged in under the user (`mpstaton`) with `lossless-group` org access. (Already true per the user's note.)
- Default branch on GitHub will get overwritten when we push `development` in Phase 3 — don't worry about it being `main` at creation.

## Phase 2 — Scaffold the working tree locally (copy-then-strip from calmstorm-decks)

**Goal:** A buildable Astro project at `ai-labs/dididecks-ai/client-sites/chroma-decks/` with the calmstorm primitives kept, the calmstorm content stripped, and the Chroma-specific stubs in place.

### Actions

1. **Create the directory** under `client-sites/`.
   ```bash
   mkdir -p ai-labs/dididecks-ai/client-sites/chroma-decks
   ```
2. **Copy the keep-list from `calmstorm-decks`** (see the "Keep" section above). Use `cp -R` for directories; copy files individually so we are intentional.
   - Config files: `astro.config.mjs`, `tsconfig.json`, `.npmrc`, `.gitignore`, `pnpm-workspace.yaml`, `vercel.json`, `.env.example`.
   - `src/layouts/` (the whole folder).
   - `src/components/basics/`, `src/components/markdown/` (skip `src/components/slides/` — those are calmstorm-specific).
   - `src/pages/api/`, `src/pages/changelog/`, `src/pages/drafts/` (keep folder, replace contents with a placeholder draft).
   - `src/styles/` — keep token scaffolding (`theme.css`, `globals.css`), strip calmstorm palette specifics.
   - `scripts/export-decks.ts`.
3. **Strip calmstorm-specific content.** Delete all `src/pages/{topic}/` folders except `api/`, `changelog/`, `drafts/`. Delete `src/slides/`. Delete `src/data/*.ts`. Delete `context-v/narratives/*`. Delete `draft-palette__CalmStorm.json`. **Note `/thesis` goes** — Chroma uses `/scroll` instead (see step 3a below).
3a. **Stand up `/scroll` and `/play` as thumb-gallery indexes plus one real `/scroll` deck.**
   - `src/pages/scroll/index.astro` — renders a thumbnail gallery of available scroll decks. Cards show title, lede, last-updated, and a thumbnail image (placeholder svg for v0.1; real thumbs come later). Pulls from a typed `src/data/decks.ts` (or Astro content collection) so adding a deck is a data-only change.
   - `src/pages/scroll/{deck-slug}/index.astro` — at least **one real deck route** at v0.1 (pick a working slug, e.g. `chroma-fund-iv-teaser` or whatever the founder's current deck is named). This is where `PageAsDeckWrapper.astro` + `SlideLayout.astro` actually compose into a scroll deck. Empty-but-valid is fine for v0.1; content lands in the next plan.
   - `src/pages/play/index.astro` — renders an empty-state thumbnail gallery ("no play decks yet — coming after `/scroll` lands"). Route reserved; runtime deferred.
   - `src/pages/index.astro` — minimal landing page linking to `/scroll` and `/play`.
   - **Thumbnail asset convention:** thumbs live at `public/thumbs/{deck-slug}.{webp|svg}`; the data file points at them. SVG placeholders for v0.1 to keep moving — real thumbs (Playwright screenshots of slide 1, à la calmstorm's `export-decks.ts`) are a later pass.
   - **Do not build variant pages or slide-by-slide chooser routes yet** — those come from calmstorm-decks in a later pass.
4. **Rewrite `package.json`** — rename to `chroma-decks`, version `0.0.1.0`, keywords reframed for Chroma fundraise, `chroma: { ... }` block describing site surfaces (TBD pending narrative outline), homepage TBD (Vercel preview will populate).
5. **Rewrite `DESIGN.md`** as a Chroma-flavored Stitch spec. **Source values are already extracted** in [[../explorations/Chroma-Brand-and-Deck-Notes]] (color tokens from production CSS, typography, geometry, anti-patterns). Promote that file's §2–§7 substance into `chroma-decks/DESIGN.md`. The `light` mode carries the real production values; `dark` and `vibrant` are documented `TBD` slots awaiting the brand-iteration session. **Note: trychroma.com uses shadcn-style semantic tokens** (`--background`, `--foreground`, `--primary`, etc.) not Material/M3 (`surface`, `on-surface`); chroma-decks adopts the shadcn shape (see notes §1 for the rationale). (Invoke `maintain-design-md` skill when writing this.)
6. **Create `draft-palette__Chroma.json`** with the extracted tokens (mirrors the table in notes §2). Save the wordmark from `https://www.trychroma.com/_next/static/media/chroma-wordmark.0~1c352v-zy35.svg` to `public/brand/chroma-wordmark.svg`.
7. **Stub `context-v/`** with the conventional subdirectories: `specs/`, `explorations/`, `narratives/`, `changelogs/`, `sitemap/`. Empty except for a `README.md` in each explaining its role (lifted from the `context-vigilance` skill).
8. **Stub `changelog/`** at the repo root with an inaugural entry: `changelog/2026-05-11__chroma-decks-init.md`. Follow the `changelog-conventions` skill format.
9. **Create `corpus/`** at the repo root with a `README.md` explaining it holds investment memos, market research, and the founder's original materials. **Add `corpus/` to `.gitignore`** for now — we will decide later whether parts of it should be committed (likely not; this is the private substantiation layer, not part of the deployed site). Note: this is intentionally distinct from `src/` and `context-v/`.
10. **Install dependencies** with pnpm to make sure the scaffolded `package.json` resolves cleanly.
    ```bash
    cd ai-labs/dididecks-ai/client-sites/chroma-decks
    pnpm install
    pnpm run build  # confirm the empty-shell scaffold compiles
    ```

### Constraints / verification

- The empty shell must `pnpm run build` cleanly before Phase 3. Do not push a broken scaffold.
- No calmstorm content should be reachable in a grep over `client-sites/chroma-decks/src/`. (`grep -r -i "calmstorm\|calm/storm\|EuVECA\|Fund III" src/` should return zero hits.)

## Phase 3 — Init git, three-tier branches, push to GitHub

**Goal:** Working tree under git, three branches (`development`, `main`, `master`) all pointing at the same inaugural commit, pushed to the remote.

### Actions

1. **`git init`** inside `client-sites/chroma-decks/`.
2. **Stage and commit** the inaugural scaffold. Commit message per `git-conventions` skill.
   ```bash
   git add .
   git commit -m "init(scaffold): chroma-decks derived from calmstorm-decks substrate

   Scaffolds the chroma-decks client-site as a private Astro project under
   lossless-group/dididecks-ai/client-sites/. Keeps the calmstorm-decks
   structural primitives (layouts, draft-variant pattern, export script,
   three-modes-aware theme.css) and rebuilds the content surface (pages,
   slides, narratives, data) from scratch for the Chroma fundraise.
   "
   ```
3. **Create all three tier branches** from this single commit so they start at parity.
   ```bash
   git branch -M development      # rename default to development
   git branch main development
   git branch master development
   ```
4. **Add the remote and push all three branches.**
   ```bash
   git remote add origin git@github.com:lossless-group/chroma-decks.git
   git push -u origin development
   git push origin main
   git push origin master
   ```
5. **Set `development` as the default branch on GitHub.**
   ```bash
   gh repo edit lossless-group/chroma-decks --default-branch development
   ```

### Constraints / verification

- `git log development main master --oneline` should show all three tips at the same commit.
- `gh repo view lossless-group/chroma-decks --json defaultBranchRef` should report `development`.

## Phase 4 — Attach as a submodule of `dididecks-ai`

**Goal:** `dididecks-ai/.gitmodules` carries an entry for `client-sites/chroma-decks` with `branch = development`, the gitlink commits cleanly, and `git submodule status` reports the working-tree commit.

### Actions

1. From the **`dididecks-ai` repo root** (one level up), `cd` and run:
   ```bash
   cd ai-labs/dididecks-ai
   git submodule add -b development git@github.com:lossless-group/chroma-decks.git client-sites/chroma-decks
   ```
   This will (a) clone the remote into the existing path if the path is empty or (b) recognize the existing local tree if `git submodule add` detects it. If the local tree already exists and `submodule add` refuses, the safe path is:
   - Move the working tree aside (`mv client-sites/chroma-decks /tmp/chroma-decks-stash`),
   - Run `git submodule add -b development ...` to clone fresh,
   - Confirm the clone matches the stashed tree,
   - Delete the stash.
2. **Verify `.gitmodules` carries `branch = development`** on the new entry. If missing, add it manually and run `git submodule sync`.
3. **Commit the submodule add** at the `dididecks-ai` level.
   ```bash
   git add .gitmodules client-sites/chroma-decks
   git commit -m "add(submodule): client-sites/chroma-decks tracking development"
   ```
4. **Do NOT auto-bump the parent ai-labs gitlink.** Per the user's submodule-propagation feedback, the parent pseudomonorepo's gitlink is tidied deliberately, not as a side effect. Leave `ai-labs`'s pointer alone.

### Constraints / verification

- `git submodule status client-sites/chroma-decks` shows the SHA, the path, and the tracked branch.
- `cat .gitmodules | grep -A2 chroma-decks` includes a `branch = development` line.

## Phase 5 — Wire the corpus, environment, and Vercel preview

**Goal:** The substantiation layer is in place (even if mostly empty), env conventions are documented, and there is a live preview URL to iterate against.

### Actions

1. **`corpus/` posture.** Add to `.gitignore`. Document its role in `corpus/README.md`:
   - Holds the MemoPop-generated Chroma investment memos (multiple variants).
   - Holds the founder's original deck and any raw materials he shares.
   - Holds market-research artifacts surfaced during the engagement.
   - **Is the DD-bar substantiation layer.** Every non-obvious claim in `src/` should be traceable to a `corpus/` source.
   - **Is not deployed.** Decide later whether selected corpus items get committed in a separate private mirror; default is git-ignored.
2. **`.env.example`** carries placeholder rows for `SITE_URL` and any future LLM/API keys. No secrets committed.
3. **Vercel project setup.**
   - Create a new Vercel project linked to `lossless-group/chroma-decks`.
   - Default deployment branch: `development` (so the preview URL tracks active work).
   - Production branch: `main` (so promotion is deliberate).
   - Add `SITE_URL` to the Vercel env panel once the production domain is decided.
4. **Confirm the first preview deploy lands cleanly.** A blank-but-buildable Astro shell should produce a preview URL.

### Constraints / verification

- The preview URL is reachable and renders the placeholder homepage.
- `.gitignore` includes `corpus/` (and `node_modules/`, `.env`, `.DS_Store`, etc. inherited from calmstorm-decks).

## Phase 6 — Establish the working rhythm (and document main/master parity)

**Goal:** A documented rhythm for how this engagement runs day-to-day, including the discipline for keeping `main` and `master` near parity over time (per the user's note).

### Actions

1. **Write `context-v/specs/Working-Rhythm-Chroma-Decks.md`** — short, lived-with doc that captures:
   - Daily working branch is `development`.
   - **Promote `development` → `main`** when a milestone is presentable (an investor sees it, founder signs off on a section, etc.).
   - **Promote `main` → `master`** when the dust has settled — usually after the meeting it was prepped for has happened *and* the next round of edits has not yet kicked off. Cadence target: at minimum *weekly during active iteration*, *immediately after each milestone meeting*.
   - **Parity bias:** when in doubt, fast-forward `main` and `master` up — never roll them backwards. If divergence appears, stop and reconcile rather than papering over.
2. **Inaugural changelog entry** at `chroma-decks/changelog/2026-05-11__init.md` references this spec.
3. **Reflective entry at the parent level** — once the scaffold is shipped, write a short note in `dididecks-ai/context-v/explorations/Client-Site-Baseline-v2.md` capturing **what we kept, what we dropped, and what we changed** between `calmstorm-decks` and `chroma-decks`. This is the closure of the "we keep rebuilding from scratch" loop the parent spec ([[../specs/Dididecks-AI-Slide-Decks-as-Code]]) calls out. The third client-site we scaffold should start from this exploration, not from another fresh copy of calmstorm.

### Constraints / verification

- `Working-Rhythm-Chroma-Decks.md` exists with the parity rule written down.
- `Client-Site-Baseline-v2.md` exists and links both upstream specs (the Dididecks parent spec) and downstream sites (calmstorm-decks, chroma-decks).

## Out of scope (explicitly deferred — no yak shaving)

These are real, but not this plan. Timeline is short; the goal is `/scroll` shippable, not perfect.

- **`/play` runtime.** Reveal-style slide-by-slide navigation, presenter mode, keyboard nav. **Pull from calmstorm-decks in a later pass**, after `/scroll` is presentable.
- **Variant pages (`/drafts/{slug}/{slug}-vN`).** Pattern is kept in the scaffold (folder exists) but no variants are authored in v0.1.
- **Slide-by-slide variant chooser routes (`/{slug}` per slide).** Calmstorm's pattern; deferred until needed.
- **Deck content authoring.** Narratives, slides, data structures — all downstream of this scaffold. A separate plan or spec frames the slide-by-slide content sprint once `/scroll` is live.
- **Chroma three-mode palette design.** **Dedicated session with the user.** The token *system* is scaffolded here; the *palette values* for modes 2 and 3 are decided separately.
- **Three-modes UI toggle.** Token system is built; user-facing toggle waits on the palette-iteration session.
- **MemoPop integration mechanics.** The `corpus/` folder is provisioned; *how* MemoPop outputs flow into the deck is its own design.
- **Native-app side (NS-1) and live-player (NS-2).** Per the parent spec, these are the DidiDecks-AI north stars, not this engagement.
- **Splash page for chroma-decks itself.** A `splash/` directory is not part of v0.1. If the dididecks-ai splash needs to surface chroma-decks, it does so via rollup, not by chroma-decks shipping its own splash.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Brand mismatch — Chroma's existing visual register is not three-modes-aware; pushing all three modes from day one may feel like overreach to the founder. | Build the three-mode token system internally; ship only their current register in the UI; introduce `light`/`vibrant` only after a directed proposal he approves. |
| Calmstorm primitives carry hidden Calm/Storm assumptions that are not obvious in copy-then-strip. | Phase 2 verification step: `grep -r -i "calmstorm\|calm/storm\|EuVECA\|Fund III" src/` must be empty before Phase 3 commit. |
| The corpus folder grows large quickly (PDFs, transcripts, video clips). Adding it to git would balloon the repo. | `corpus/` is `.gitignore`'d. Substantiation tracking happens via filename references in narratives/data, not via committing the source material. |
| `development` / `main` / `master` drift starts immediately and never gets caught up. | Phase 6 writes the parity rhythm down. The reflective entry at the dididecks-ai level (`Client-Site-Baseline-v2.md`) explicitly captures whether the rhythm held — feedback for the next client-site. |
| Submodule pointer in `dididecks-ai` gets out of sync with the working branch. | `.gitmodules` declares `branch = development`. Verification step in Phase 4 enforces it. |

## Done definition (for v0.1 of this plan)

1. `https://github.com/lossless-group/chroma-decks` exists, private, default branch `development`, three tier branches at parity.
2. Working tree at `ai-labs/dididecks-ai/client-sites/chroma-decks/` builds cleanly with `pnpm run build`.
3. **`/scroll/` renders a thumb-gallery index** (at least one card visible), **`/scroll/{deck-slug}/` renders one empty-but-valid scroll deck**, and **`/play/` renders an empty-state gallery** ("no play decks yet"). All three routes resolve in `pnpm run dev` and in the Vercel preview. This is the load-bearing v0.1 signal — without it, nothing else matters.
4. Calmstorm content fully stripped; Chroma-flavored DESIGN.md and palette in place; **three-modes tokens scaffolded in `theme.css` with all three slots present** even though only one is filled with real values (the other two are `TBD` placeholders, settled in a follow-up session).
5. `corpus/` exists, is git-ignored, has a README explaining its role.
6. Submodule entry in `dididecks-ai/.gitmodules` carries `branch = development`.
7. Vercel preview URL is live and shows the empty-but-buildable shell with `/scroll` reachable.
8. `context-v/specs/Working-Rhythm-Chroma-Decks.md` documents the development → main → master parity rhythm.
9. `dididecks-ai/context-v/explorations/Client-Site-Baseline-v2.md` captures the kept/dropped/changed delta vs. calmstorm-decks.

When all nine are true, Phase 1 of the engagement is done. Deck-content authoring (and `/play` port from calmstorm-decks) begins under a separate plan.

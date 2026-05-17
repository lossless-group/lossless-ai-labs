---
title: "Stand Up @dididecks/shell and Ship the Chroma TOC + Slide-Ranking UI"
lede: "Phase A of the exploration that landed on `@dididecks/shell` as the path to chroma-↔-calmstorm parity. Scaffold `apps/deck-shell/` inside the dididecks-ai monorepo as an Astro integration; ship two seed routes (TOC + slide-ranking pills) and one decomposition-stub generator that bridges the deck-iteration-workflow Phase 1 → Phase 2 transition; install in `client-sites/chroma-decks/` first via local link, then via a v0.1.0 publish to a private pnpm-scoped npm registry. Each client-site stays a standalone repo on its own Vercel project; the shell is the only thing that travels."
date_authored_initial_draft: 2026-05-12
date_authored_current_draft: 2026-05-12
date_authored_final_draft:
date_first_published: 2026-05-12
date_last_updated: 2026-05-16
at_semantic_version: 0.0.1.0
status: Partially-Shipped
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Plan
tags:
  - Dididecks-Shell
  - Astro-Integration
  - Monorepo-First-Capability
  - Chroma-Decks
  - TOC-and-Ranking
  - Phase-1-to-Phase-2-Bridge
  - Decomposition-Stub-Generator
  - Private-Pnpm-Scoped-Registry
  - GitHub-Packages
  - Deck-Iteration-Workflow
  - Non-Destructive-Adoption
authors:
  - Michael Staton
date_created: 2026-05-12
date_modified: 2026-05-12
from: "dididecks-ai"
from_path: "context-v/plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking.md"
---
# Stand Up @dididecks/shell and Ship the Chroma TOC + Slide-Ranking UI

> Plan of record for **Phase A** of [[../explorations/Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]]. The exploration's resolution: `@dididecks/shell` is an Astro integration published to a private pnpm-scoped npm registry; each client-site stays a standalone repo on its own Vercel project; the shell is the single dependency they share. This plan executes the **minimum-viable first slice** of that architecture: a scaffolded integration package with just enough surface to ship the founder-facing TOC + slide-ranking UI that doubles as the **Phase 1 → Phase 2 transition tooling** from the [[../../../../context-v/skills/deck-iteration-workflow/SKILL]] skill.
>
> Everything past Phase A — lifting calmstorm's mature primitives, the `/play` runtime, auth + telemetry, the export pipeline — gets its own follow-up plan once this one has been stress-tested by chroma. This plan is intentionally small.

## Why this plan exists

This is the **first monorepo capability** the dididecks-ai pseudomonorepo ships. Until now `dididecks-ai/` has been a host for two unrelated submodules (`client-sites/calmstorm-decks` and `client-sites/reach-edu-hub`, plus the newer `client-sites/chroma-decks`) and a context-v/. There has been no parent-level shared code. The exploration documents three forces pushing toward `@dididecks/shell`:

1. **Vercel-deployability without architectural compromise.** Each client-site's deploy stays identical to today — standalone repo, standalone Vercel project, single `dist/`, single domain — while the shell evolves as one coherent unit consumed via npm.
2. **The empirical-prior commitment from the parent spec.** Chroma is greenfield enough to absorb a v0.1 shell without legacy drag; calmstorm migrates onto the shell *second*, after the API has been stress-tested by one real consumer.
3. **The non-destructive-iteration commitment** (Design Principle #3 of [[../specs/Dididecks-AI-Slide-Decks-as-Code]]). Adding the shell is purely additive in chroma's repo: install dep, register integration, gradually shrink `src/` as shell-provided surfaces take over. The current working state is never broken.

The TOC + slide-ranking UI is chosen as the Phase A deliverable for one specific reason: **it is the tooling the founder needs to drive the Phase 1 → Phase 2 transition.** Today chroma's enhanced-v1 / v2 / v3 each live as a single-page `.astro` variant. The deck-iteration-workflow says: rank each slide of a single-page variant, then decompose the urgent-redo + non-urgent-could-be-better slides into per-slide files first. Ranking is the input; decomposition is the output. The shell wires both ends together: rank → click "scaffold per-slide file" → empty `src/components/slides/{variant}/{nn}-{slot}.astro` exists in the chroma repo, ready for the recreation pass that makes the `/play` runtime work.

## Scope boundary

**In scope for Phase A (this plan):**

- A new package at `dididecks-ai/apps/deck-shell/`, named `@dididecks/shell`, structured as an [Astro integration](https://docs.astro.build/en/reference/integrations-reference/).
- Two routes injected by the integration: `/toc/[deckSlug]/[variantSlug]` (TOC view) and `/api/slide-rank` (POST upsert, GET registry; `prerender = false`).
- One developer-facing action: a "scaffold per-slide file" button per ranked-as-urgent-redo or non-urgent-could-be-better row that writes an empty stub into the **client-site's** working tree at the canonical per-slide path.
- Local-link install in `client-sites/chroma-decks/` for development.
- v0.1.0 publish to a private pnpm-scoped npm registry once the shell stabilizes.
- Vercel verification: chroma-decks builds with the published shell as a dep, the TOC + ranking route renders, the static build cleanly skips the dev-only write-back route.

**Explicitly out of scope (defers to follow-up plans):**

- Lifting calmstorm's `PageAsDeckWrapper`, `SlideCanvas`, `ContentFit`, `MetaTags`, `DeckHeader`, `DeckNav`, `GateScript`, mode-switcher, brand-mark, etc., into the shell. That is Phase B of the exploration.
- The `/play` keyboard presenter runtime (Phase D).
- Auth + telemetry + admin (Phase D).
- Export pipeline (Phase E).
- The componentize-slides destination shift (now lands in `@dididecks/shell/components/` instead of `client-sites/calmstorm-decks/src/components/`) — flagged for follow-up edit, not executed in this plan.
- Calmstorm's migration onto the shell. Calmstorm is mid-iteration with a sensitive partner audience and stays untouched by this plan.
- SSR / realtime / per-client database hydration. V2 hook per the exploration.

## Preconditions

These have to land before Phase A.1 starts:

1. **Registry decision.** [[../explorations/Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] flags GitHub Packages as the strong default (free for private, integrates with `lossless-group` org auth, single `NPM_AUTH_TOKEN` env var for Vercel). Confirm before scaffolding the package — the `publishConfig.registry` field in `apps/deck-shell/package.json` and the `.npmrc` template that ships with chroma both depend on it. Default to GitHub Packages unless a reason to choose otherwise surfaces.
2. **pnpm in dev; Vercel does whatever Vercel does.** The discipline is dev-mode strict: every local install, lockfile, script, doc snippet, and the `pnpm-lock.yaml` checked into each repo is pnpm — not `npm`, not `yarn`, not `bun`. The shell publishes *to* the npm registry (because that is the registry), but every CLI invocation a human runs in this plan is `pnpm`. On the deploy side, Vercel auto-detects the package manager from the lockfile and that's fine — no need to pin a custom build command unless something breaks. If the plan shows an `npm` command in the dev-side instructions, that is a bug to fix before executing; if Vercel internally falls back to `npm` to install once the lockfile is committed, that's a Vercel implementation detail and not a violation.
3. **Branch tier.** `dididecks-ai` is on `development`; `client-sites/chroma-decks` is on `development`. Both stay on `development` for the duration of Phase A. Phase A does not promote either to `main` — promotion happens after the v0.1.0 shell publish is verified on a Vercel preview build.

## Architecture decisions to lock before code

These are choices the implementation will encode. Lock them up front so a downstream reader of the integration's source can see the rationale without re-deriving it.

### A. Package identity and layout

- **Name:** `@dididecks/shell` (scoped to `@dididecks`).
- **Location in monorepo:** `dididecks-ai/apps/deck-shell/`.
- **Package manager:** pnpm. `apps/deck-shell/` is a pnpm workspace member of `dididecks-ai/` — but the **published artifact** is what client-sites consume; workspace linkage is dev-only.
- **Module entrypoint:** `apps/deck-shell/src/index.ts` exports `dididecksShell(options)` as a default. Astro integration contract.
- **Side entrypoints exposed via `package.json` exports:**
  - `@dididecks/shell` — the integration factory (default).
  - `@dididecks/shell/routes/*` — route components the integration injects (Astro doesn't import these from user code; they live here so the injection paths are stable).
  - `@dididecks/shell/components/*` — empty in Phase A; will hold `PageAsDeckWrapper`, `SlideCanvas`, etc. in Phase B.
  - `@dididecks/shell/runtime/*` — empty in Phase A; will hold mode-switcher etc. in Phase B.
- **Astro version:** declared as a `peerDependency` (`"astro": "^5.0.0"`), never a runtime dep. The client-site brings its own Astro.
- **`publishConfig`:** `{ "access": "restricted", "registry": "<the registry decided in Precondition 1>" }`.

### B. Integration options shape

The factory takes one options object. v0.1.0 surface, kept deliberately small:

```ts
export interface DididecksShellOptions {
  /** Required. The client-site identifier — e.g. "chroma-decks". Logged + used in route titles. */
  client: string;

  /** Where the client's deck registry lives, relative to the client-site root. Default: "./src/data/decks.ts". */
  decksRegistryPath?: string;

  /** Where slide-ranking state persists, relative to the client-site root. Default: "./data/audits/slides.json". */
  auditsPath?: string;

  /** Default tier resolver fallback for unmapped routes. Default: "private". Phase B fills this in. */
  distributionTier?: "private" | "shared" | "public";
}
```

Phase B adds `runtime`, `auth`, `telemetry`, `theme` options. Phase A does not, to keep the v0.1.0 surface minimal and the cost of breaking changes low.

### C. The audit registry's shape

Calmstorm's `data/audits/slides.json` is a flat `{ slideId: status }` map keyed by `{nn}-{slug}-v{N}`. That key shape is specific to calmstorm's 51-file `by-title/` pattern. Chroma's variants are **single-page composites** (`/scroll/pitch/enhanced-v3/index.astro`), so the shell needs a richer key.

**New key shape:**

```json
{
  "schema": 1,
  "ranks": {
    "pitch/enhanced-v3/01-cover": {
      "status": "urgent-redo",
      "rankedAt": "2026-05-12T18:24:00.000Z",
      "rankedBy": "founder",
      "notes": null
    },
    "pitch/enhanced-v3/02-tldr": { "status": "passable", "rankedAt": "...", "rankedBy": "founder", "notes": null }
  }
}
```

Backwards-compat for calmstorm: calmstorm's existing flat-map shape stays untouched. When the shell eventually replaces calmstorm's local `slide-status.ts` (Phase B / Phase C), a one-time migration translates the flat keys to `{deck}/{variant}/{slot}`. Not in this plan; flagged for the calmstorm migration plan.

### D. Status enum

Verbatim from calmstorm — proven vocabulary, no need to redesign:

- `urgent-redo`
- `non-urgent-could-be-better`
- `passable`
- `perfect`
- `pending` (implicit default for unranked slides; not persisted)

The shell exports this as a runtime const and a TS type. Client-sites that wrap or extend it (calmstorm later, reach-edu-hub eventually) override at the integration option level — not in v0.1.0.

### E. Route paths the integration injects

| Route | Method | Purpose | Static or dev-only |
|---|---|---|---|
| `/toc/[deckSlug]/[variantSlug]/` | GET | TOC view: list slots in the variant, current rank per slot, pills to upsert rank, "scaffold per-slide file" button for ranks ∈ {urgent-redo, non-urgent-could-be-better} that have no existing per-slide file yet. | Static at build, hydrates ranks via fetch in dev. |
| `/api/slide-rank` | GET / POST | Read full registry or POST `{ deckKey, variantKey, slot, status, notes? }` to upsert. `prerender = false`. | Dev-only — static build skips it cleanly. |
| `/api/slide-decompose` | POST | Body `{ deckKey, variantKey, slot, slug }`. Writes empty stub file at `src/components/slides/{variant}/{nn}-{slug}.astro` in the client-site working tree. Refuses if file already exists (non-destructive). | Dev-only — `prerender = false`. |

Three routes total in Phase A. No `/admin`, no `/access`, no auth in front of any of them — `/api/slide-rank` and `/api/slide-decompose` are dev-only and depend on a running `pnpm dev` against the local working tree. They never ship to a Vercel build artifact.

### F. The "scaffold per-slide file" contract (the Phase 1 → Phase 2 bridge)

The most architecturally specific decision in the plan. The button on the TOC fires `POST /api/slide-decompose` with the slot to decompose. The shell writes:

```
client-sites/chroma-decks/src/components/slides/{variant}/{NN}-{slug}.astro
```

…with content that is **deliberately empty** (just the Astro frontmatter `---\n---` and a placeholder `<section>` element). The single-page variant at `src/pages/scroll/pitch/{variant}/index.astro` keeps rendering as it is — the new file is dormant until something imports it. This honors Design Principle #3 ("never destroy"): the working scroll deck is untouched; the per-slide file is a new fork off the single-page source the founder recreates non-destructively during the next iteration session.

**The shell never inlines content into the stub.** It does not parse the single-page variant, does not extract the slot's existing HTML, does not heuristically guess what should go in the per-slide file. That is the founder's recreation pass — the whole point of the deck-iteration-workflow Phase 2 boundary is that the per-slide file is *recreated*, not *extracted*. Extraction encodes whatever inline shape happened to exist; recreation forces the founder to re-author the slot at component-library quality. The shell only sets up the empty container.

### G. How the shell discovers the deck registry

Phase A reads `client-sites/chroma-decks/src/data/decks.ts` via a build-time dynamic import. The path comes from `decksRegistryPath` integration option, resolved relative to the Astro project root. The `Deck`/`VariantRef` types are the shell's canonical types (re-exported as `@dididecks/shell/types`); chroma's `decks.ts` already conforms because the shape was authored before the shell existed but already matches the canonical-types contract — that is a useful empirical signal.

How the shell discovers the **slot list inside a variant** in Phase A: it does NOT parse the single-page `.astro` files. Instead, the integration looks for an optional `src/data/slides.ts` registry in the client-site. If present, it reads `SLOTS[variantSlug]` → `Array<{ slot: string; title: string; slug: string }>`. If absent, the TOC route renders a "no slot registry found" empty state with copy that points to a one-paragraph how-to.

This is deliberate: the slot registry is a small, hand-authored file (chroma's enhanced-v3 has ~14 slots; 30 lines of TS); maintaining it is cheap; auto-extracting from `.astro` ASTs is expensive engineering for a feature that should be founder-authored anyway. Phase B may add an opt-in auto-extract; Phase A does not.

### H. Verifying ranks change the build without it

`/api/slide-rank` is dev-only — the static build skips it. But the TOC route is static. When does a Vercel rebuild pick up new ranks?

**Answer:** the static build reads `data/audits/slides.json` at build time and emits it into the TOC page. Pushing a commit that updates `data/audits/slides.json` triggers a Vercel redeploy and the new ranks appear in the next build. The dev write-back loop posts to `/api/slide-rank` which writes to the same JSON file — the founder rank → commit → push → Vercel rebuild flow is "rank, then commit." The shell does not maintain a separate database; the JSON file is the database.

This is a deliberate v1 simplification. Multi-author live ranking and conflict resolution are v2 hooks (the SSR + per-client DB direction the exploration flags).

## Phase A.1 — Scaffold `apps/deck-shell/`

The first commit. Pure structure; no behavior yet.

1. Confirm `dididecks-ai/` has a root `pnpm-workspace.yaml`. If not, create one declaring `packages: ['apps/*', 'client-sites/*']`. Note: `client-sites/*` are git submodules with their own `package.json`s — they are in the workspace for dev-link purposes but each is independently publishable / deployable.
2. `mkdir -p apps/deck-shell/src/{routes,components,runtime,types}` from the dididecks-ai root.
3. Author `apps/deck-shell/package.json`:
   - `"name": "@dididecks/shell"`
   - `"version": "0.0.1"`
   - `"type": "module"`
   - `"main": "./src/index.ts"`
   - `"types": "./src/index.ts"`
   - `"exports"` field with the four entrypoints from decision A.
   - `"peerDependencies": { "astro": "^5.0.0" }`
   - `"publishConfig": { "access": "restricted", "registry": "<from Precondition 1>" }`
4. Author `apps/deck-shell/tsconfig.json` extending the dididecks-ai root config if one exists, otherwise a minimal Astro-compatible TS config.
5. Author `apps/deck-shell/src/index.ts` exporting a placeholder factory:
   ```ts
   import type { AstroIntegration } from "astro";
   export interface DididecksShellOptions { /* per decision B */ }
   export default function dididecksShell(options: DididecksShellOptions): AstroIntegration {
     return {
       name: "@dididecks/shell",
       hooks: {
         "astro:config:setup": ({ logger }) => {
           logger.info(`@dididecks/shell loaded for client: ${options.client}`);
         },
       },
     };
   }
   ```
6. Author `apps/deck-shell/README.md` — one screen: what it is, install command, minimal `astro.config.mjs` snippet, link back to this plan.
7. From the dididecks-ai root: `pnpm install`. Verify `node_modules/@dididecks/shell` symlinks back to `apps/deck-shell/`.
8. Commit: `init(deck-shell): scaffold @dididecks/shell as Astro integration package`.

Acceptance: `pnpm --filter @dididecks/shell typecheck` passes; the placeholder factory is importable from a sibling workspace member.

## Phase A.2 — Wire the integration to inject routes

Second commit. The integration starts injecting routes — but the routes are still empty placeholders. Separating route-injection from route-content keeps the two diffs reviewable.

1. In `apps/deck-shell/src/index.ts`, expand the `astro:config:setup` hook to call `injectRoute` for each of the three routes from decision E. Pattern entry points reference `./routes/toc.astro`, `./routes/api/slide-rank.ts`, `./routes/api/slide-decompose.ts` from the package's own directory.
2. Author each of the three route files as **minimal placeholders** that return a 200 with a stub body — `<h1>TOC — deck: {deckSlug}, variant: {variantSlug}</h1>` for the TOC route; `Response.json({ stub: true })` for the API routes.
3. Verify route-injection works by creating a throwaway `apps/deck-shell/.test-host/` minimal Astro project that consumes the integration and runs `pnpm astro dev`. The three routes should be reachable.
4. Commit: `add(deck-shell): inject TOC + slide-rank + slide-decompose route placeholders via astro:config:setup`.

Acceptance: the placeholder TOC route renders, the placeholder API routes respond.

## Phase A.3 — Implement the TOC view

Third commit. The TOC route gains real content. The slide-rank API is still placeholder.

1. In `apps/deck-shell/src/routes/toc.astro`:
   - Read the deck registry from the path the integration was given. Use dynamic import keyed on the resolved absolute path.
   - Read the audits file from the path the integration was given. Tolerate missing-file → empty registry.
   - Read the slot registry (`src/data/slides.ts` shape from decision G). Tolerate missing-file → empty-state copy.
   - Cross-reference per-slide file existence: for each slot, check whether `src/components/slides/{variant}/{nn}-{slug}.astro` exists in the client-site. This drives whether the "scaffold per-slide file" button shows.
   - Emit one row per slot with: number, title, current rank (or "Pending"), five pill buttons (one per status), and a conditional "scaffold per-slide file" button.
   - Style with inline `<style>` scoped to the route — no external CSS dependencies. The shell's v0.1.0 visual cost should be zero; chroma's theme tokens are not consumed yet.
2. Verify in the test-host: visit `/toc/pitch/enhanced-v3/`, see all 14-ish slots of enhanced-v3 listed.
3. Verify in chroma: register the shell as a workspace dep (Phase A.6 covers the full install path; this is just enough to render the route from chroma's own variants).
4. Commit: `add(deck-shell): render TOC route with slot rows + rank pills + decompose button visibility`.

Acceptance: the TOC route lists slots, shows their current rank, and the decompose button shows up for the right rows (no per-slide file yet + rank is urgent-redo or non-urgent-could-be-better).

## Phase A.4 — Implement the rank write-back API

Fourth commit. The slide-rank API now reads + writes the audits file.

1. Replace `apps/deck-shell/src/routes/api/slide-rank.ts` placeholder with a real implementation:
   - `export const prerender = false;` at module scope.
   - On `GET`: read the audits file from the integration's resolved path. Return the full registry as JSON.
   - On `POST`: validate body `{ deckKey: string; variantKey: string; slot: string; status: Status; notes?: string|null }`. Build the composite key `${deckKey}/${variantKey}/${slot}`. Upsert into the `ranks` map with `rankedAt: new Date().toISOString()`, `rankedBy: "founder"` (placeholder; later integration options will provide the identity). On `status === "pending"`, delete the key.
   - Persist back to the audits file with sorted keys for deterministic diffs (same discipline as calmstorm's `api/slide-status.ts`).
2. Update the TOC route's client-side pill `onClick` to POST to `/api/slide-rank` and optimistically update the displayed rank.
3. Verify the round-trip: rank a slot in dev, hard-refresh the TOC route, see the rank persist; check `git diff data/audits/slides.json` and see the expected upsert.
4. Commit: `add(deck-shell): implement /api/slide-rank read/write with per-deck/variant/slot composite key`.

Acceptance: ranking a slot from the dev TOC writes to the chroma working tree's `data/audits/slides.json` with the new key shape, and re-rendering picks up the change.

## Phase A.5 — Implement the decomposition stub generator

Fifth commit. The decompose API and the button wire together.

1. Replace `apps/deck-shell/src/routes/api/slide-decompose.ts` placeholder:
   - `export const prerender = false;`.
   - Validate body `{ deckKey, variantKey, slot, slug }`. Compute the target path inside the client-site: `src/components/slides/{variantKey}/{slot}-{slug}.astro`.
   - **Refuse to overwrite** if the file already exists. Return 409 with a clear error.
   - Otherwise, write the empty stub. The stub is exactly:
     ```astro
     ---
     // Generated by @dididecks/shell as a Phase 1 → Phase 2 decomposition stub.
     // Recreate the slot content here; do not extract from the single-page variant.
     ---
     <section data-slot="{slot}" data-variant="{variantKey}"></section>
     ```
   - Return 200 with the new file path.
2. Wire the TOC route's decompose button to POST to this endpoint with the right body, then re-render the row (the button hides, the file-exists indicator shows).
3. Verify: rank a slot as `urgent-redo`, click decompose, see the empty file appear in `client-sites/chroma-decks/src/components/slides/enhanced-v3/{nn}-{slug}.astro`. Confirm the existing scroll deck at `/scroll/pitch/enhanced-v3/` is unchanged.
4. Commit: `add(deck-shell): scaffold per-slide stub files on rank-driven decompose action`.

Acceptance: the Phase 1 → Phase 2 boundary is now operational — a founder can rank, then one-click decompose the slots they want to recreate, and end up with an empty per-slide file in their working tree without touching the working single-page variant.

## Phase A.6 — Install in chroma-decks via local link

Sixth commit. Chroma-decks gains its first dependency on the shell.

1. From `client-sites/chroma-decks/`: `pnpm add '@dididecks/shell@workspace:*'` (since chroma is a workspace member, pnpm resolves to the local `apps/deck-shell/` source). Lockfile updates.
2. Add the integration to `client-sites/chroma-decks/astro.config.mjs`:
   ```ts
   import dididecksShell from "@dididecks/shell";
   export default defineConfig({
     integrations: [
       dididecksShell({
         client: "chroma-decks",
         decksRegistryPath: "./src/data/decks.ts",
         auditsPath: "./data/audits/slides.json",
         distributionTier: "private",
       }),
     ],
   });
   ```
3. Create `client-sites/chroma-decks/src/data/slides.ts` with the slot registry for at least one variant (start with enhanced-v3 — the densest, most ready). 14-ish entries. Hand-authored.
4. Create `client-sites/chroma-decks/data/audits/slides.json` as `{"schema": 1, "ranks": {}}`.
5. `pnpm --filter chroma-decks dev` → visit `/toc/pitch/enhanced-v3/`. Verify the TOC renders, ranks persist, decompose works.
6. Commit (in the chroma-decks submodule): `add(deps,toc): consume @dididecks/shell; wire TOC + slide-ranking for enhanced-v3`.
7. Commit (in dididecks-ai): submodule pointer bump for chroma-decks.

Acceptance: the founder can drive the TOC + ranking + decompose flow end-to-end in `pnpm dev` against chroma's actual content.

## Phase A.7 — Publish v0.1.0 to the private registry and switch chroma to the published version

Seventh commit (in the deck-shell package + chroma-decks separately). The point where the workspace-link goes away and chroma starts consuming the shell exactly as a future client-site would.

1. Bump `apps/deck-shell/package.json` version to `0.1.0`.
2. `pnpm --filter @dididecks/shell pack` → inspect the resulting tarball. Verify the exports map is correct, no source-only files like tsconfig or test-host leak, the README is included.
3. Authenticate to the chosen registry (Precondition 1 — GitHub Packages default). For GitHub Packages: add `~/.npmrc` line `//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}`; ensure the token has `read:packages` and `write:packages` scopes.
4. `pnpm --filter @dididecks/shell publish` (with `--access restricted` if not already in publishConfig).
5. Confirm visibility: `pnpm view @dididecks/shell --registry=<registry>` returns the just-published version.
6. In `client-sites/chroma-decks/`: change the `package.json` dep from `"workspace:*"` to `"^0.1.0"`. Add an `.npmrc` in the chroma-decks repo root pointing the `@dididecks` scope at the registry. Document the required `NPM_AUTH_TOKEN` (or `GITHUB_TOKEN`) env var.
7. `pnpm install` from chroma's repo (outside the workspace context — simulate the standalone-repo install). Verify resolution succeeds against the registry, not the workspace.
8. Run chroma's dev server again; the integration should behave identically.
9. Commits: in deck-shell, `ship(deck-shell): publish v0.1.0 to private registry`; in chroma-decks, `update(deps): consume @dididecks/shell from private registry (was workspace-linked)`.

Acceptance: chroma-decks resolves `@dididecks/shell` from the published private registry; the workspace-link is no longer relied on; the dev server still works identically.

## Phase A.8 — Verify on Vercel

Final commit on the chroma side. Phase A is not done until a Vercel production-shape build succeeds with the shell as a dep.

1. Configure the Vercel project for `lossless-group/chroma-decks` to pass `NPM_AUTH_TOKEN` (or `GITHUB_TOKEN`) as an env var so the private-registry resolution works. Let Vercel auto-detect the package manager from the committed `pnpm-lock.yaml`; do not pin a custom build command unless detection fails. (Per Precondition 2, the pnpm discipline is dev-mode strict; Vercel's internal choice of installer is not constrained.)
2. Push the chroma-decks `development` branch. Watch the Vercel preview build.
3. Verify in the build log: `@dididecks/shell@0.1.0` resolves cleanly from the private registry; the build completes; the static `dist/` includes `/toc/pitch/enhanced-v3/index.html`.
4. Visit the preview URL. The TOC route should render with the seeded ranks (whatever was committed to `data/audits/slides.json` at push time). The `/api/slide-rank` and `/api/slide-decompose` routes should 404 cleanly on the static build — that is the intended behavior; they are dev-only.
5. Verify the existing scroll deck at `/scroll/pitch/enhanced-v3/` is unchanged — same content, same styling, same behavior. The shell adoption was purely additive.

Acceptance: Vercel preview build succeeds, TOC renders, scroll deck is unchanged. Phase A is complete.

## What's left untouched after Phase A

A reading of the chroma-decks working tree after Phase A should show:

- `package.json` has one new dep (`@dididecks/shell`).
- `astro.config.mjs` has one new integration registered.
- `src/data/slides.ts` is new (the slot registry).
- `data/audits/slides.json` is new.
- A handful of `src/components/slides/{variant}/{nn}-{slug}.astro` empty stubs (zero to many, depending on how much decomposition the founder did during testing).
- `.npmrc` is new (scope-to-registry routing).
- Everything else — `src/layouts/PageAsDeckWrapper.astro`, `SlideShell.astro`, `ModeToggle.astro`, `Wordmark.astro`, the four `src/pages/scroll/pitch/{variant}/index.astro` files, `DESIGN.md`, `corpus/`, `changelog/` — is **unchanged**. The shell adoption is purely additive in Phase A. Phase B is where the lighter parallel copies of calmstorm's primitives get deleted in favor of shell-provided versions.

This is the non-destructive-iteration commitment made concrete.

## Open questions to resolve in flight

These do not block starting. Flagged for resolution during the build:

1. **Private registry final choice.** Precondition 1 leans GitHub Packages. If something specific to GitHub Packages' auth flow surfaces during Phase A.7, fall back to npm-private or self-hosted Verdaccio. The architecture cost of switching is bounded: change `publishConfig.registry` in the shell, change `.npmrc` in chroma, re-publish.
2. **`slides.ts` slot-registry shape.** The plan assumes `Record<variantSlug, Array<{slot, title, slug}>>` keyed by variant. If chroma's enhanced-v1/v2/v3 turn out to have meaningfully different slot orderings or titles, the shape might need to be richer (per-slot per-variant overrides). Keep the registry hand-authored for v0.1; revisit only if the founder reports friction.
3. **Composite-key format `{deck}/{variant}/{slot}`.** Forward-slashes are nice for URLs but awkward when used as JSON object keys (the dot-and-slash combos some tools parse weirdly). If issues surface, switch to `::` separator. Cheap to change before the registry has real data.
4. **Decompose stub content.** The current stub is just `<section data-slot="..." data-variant="..."></section>`. If founders consistently end up adding the same boilerplate by hand on top, promote that boilerplate into the stub template. Otherwise leave the stub deliberately minimal.
5. **What about decompose for a `passable` or `perfect` rank?** The current rule hides the button for those ranks. Counter-argument: a slot could be passable for the scroll deck but still want a separate per-slide file for `/play`. If founders ask for the button to always show, change the rule. Currently bias toward hiding to prevent accidental "I clicked it without meaning to" stub files.

## Follow-up plans this work queues

These are *separate* plans that Phase A makes possible. None of them block Phase A; all of them are easier once Phase A has shipped:

1. **Edit [[../plans/Componentize-Slides-and-Establish-Component-Library]] to retarget the destination from `calmstorm-decks/src/components/` to `@dididecks/shell/components/`.** The substance of that plan is unchanged — the taxonomy split (`primitives/`, `patterns/`, `share/`, `publish/`, `audit/`, `diagrams/`), the per-slide cadence, the "promote on ≥2 uses" rule, the tier-aware-MetaTags discipline — all of it stays. The only change is where the files land. A small Phase-0-update edit per [[../explorations/Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] Open Question #4.
2. **Phase B plan — Lift calmstorm's mature primitives into `@dididecks/shell`.** `PageAsDeckWrapper`, `SlideCanvas`, `ContentFit`, tier-aware `MetaTags`, `DeckHeader`, `DeckNav`, `GateScript`, mode-switcher behavior, brand-mark slot. Chroma deletes its lighter parallel copies; calmstorm migrates second in a quiet window.
3. **Phase D plan — The `/play` runtime in the shell.** Once enough per-slide files exist (the output of Phase A's decompose action), the `/play` keyboard presenter has something to render. Lift wholesale from calmstorm's `/play`, `/play/section/[slot]`, `/play/variant/[variant]`.
4. **Phase E plan — Export pipeline as `pnpm dlx @dididecks/shell export`.** Calmstorm's Playwright-based `scripts/export-decks.ts` lifted into the shell as a CLI subcommand. Both clients benefit immediately.

Each gets its own plan in `context-v/plans/` when its turn comes.

## Cross-references

- Parent exploration: [[../explorations/Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] — the document this plan executes Phase A of. Specifically §"Where the dialog landed (2026-05-12)" → §"Per-feature parity plan (post-dialog)" → Phase A items 1–8.
- Parent spec: [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — NS-1 commits to the two-sided system; `@dididecks/shell` is the architectural seed of NS-1 Side 2's white-label publish surface.
- Sibling spec: [[../specs/Dididecks-AI-Visual-and-Diagram-Component-Library]] — the diagram primitives live in `@dididecks/shell/diagrams/` (or split into a `@dididecks/visual-library` sibling) once Phase B + Phase C have stabilized.
- Sibling plan: [[../plans/Componentize-Slides-and-Establish-Component-Library]] — its destination shifts from calmstorm in-place to the shell; queued as follow-up #1 above.
- Sibling plan: [[../plans/Init-Chroma-Decks-Client-Site]] — chroma's scaffold plan explicitly deferred `/play`, auth, and the variant chooser pattern. This plan honors all of those deferrals; only the TOC + rank UI lands.
- Sibling plan: [[../plans/Init-DidiDecks-as-core-Submodule-of-AI-Labs]] — the monorepo-init plan. `apps/deck-shell/` is the first inhabitant of `apps/`; the init plan's later phases (splash roll-up, package surfaces) inherit this without further edits.
- Calmstorm reference files the shell takes its pattern from (not lifted in Phase A, but Phase B's source-of-truth):
  - `client-sites/calmstorm-decks/src/lib/slide-status.ts` — the build-time row-builder pattern.
  - `client-sites/calmstorm-decks/src/pages/api/slide-status.ts` — the dev-only POST/GET API pattern with `prerender = false`.
  - `client-sites/calmstorm-decks/data/audits/slides.json` — the flat-map shape Phase A's composite-key registry supersedes.
- Skills loaded for this work:
  - `pseudomonorepos` — `apps/` is the right home for the shell per the placement rules.
  - `astro-knots` — hard prohibitions the shell inherits (no React, no JSX, no Angular). pnpm-only.
  - `context-vigilance` — this plan's own framework.
  - `deck-iteration-workflow` — the six-phase rhythm Phase A's TOC + rank + decompose operationalizes.
  - `theme-system` — relevant in Phase B when the mode-switcher behavior lifts into the shell.
  - `maintain-splash-pages` — relevant when the dididecks-ai splash surfaces the shell's version + adoption status (Open Question #5 in the exploration).

## Status / next step

**Status:** Draft, awaiting user sign-off.

**Immediate next step on approval:** Begin Phase A.1 — scaffold `apps/deck-shell/` as an Astro integration package, commit the bare structure, verify it imports cleanly from a sibling workspace member. No behavior yet; just the package shape.

**Stop-and-show points** during execution (where the work pauses for user verification before continuing):

1. End of Phase A.1 — package scaffolds, but does nothing.
2. End of Phase A.4 — TOC renders + rank persists in dev. Founder can take it for a spin before the decompose generator goes in.
3. End of Phase A.6 — chroma is consuming the shell via workspace-link. The full dev loop is exercisable end-to-end.
4. End of Phase A.7 — chroma is consuming the *published* shell. The architecture is real.
5. End of Phase A.8 — Vercel preview build is green. Phase A done.

## Remaining work (as of 2026-05-16)

- **Phase A.7 — publish `@dididecks/shell@0.1.0` to a private registry.** Still blocked on the GitHub-org-name decision. Three branches remain:
  1. Create a `dididecks` GitHub org (~2 minutes user-side).
  2. Rename the package to `@lossless-group/dididecks-shell`.
  3. Use a non-GitHub registry (npm-private paid, self-hosted Verdaccio).
- **Phase A.8 — Vercel preview build verification post-publish.** Trivially follows once A.7 resolves.

All other Phase A milestones (A.1–A.6) are shipped — `apps/deck-shell/` exists, TOC + `/api/slide-rank` + `/api/slide-decompose` work, chroma consumes via `workspace:*`. The shell is at `0.1.0-rc.0`; A.7 graduates it to `0.1.0`.

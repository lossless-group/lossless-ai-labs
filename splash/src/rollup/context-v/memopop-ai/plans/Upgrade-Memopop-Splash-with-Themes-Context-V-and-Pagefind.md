---
title: "Upgrade the MemoPop AI splash with three-mode theming, context-v rollup, peer-aware discovery, and Pagefind"
lede: "The current memopop-site shipped fast but pre-dates the conventions astro-knots/splash settled into a few days later. This plan brings memopop-site up to that bar — three-mode toggle on a two-tier token system, a context-v archive alongside the existing changelog, peer-directory rollup that walks the monorepo (apps/* and packages/*) instead of children, and Pagefind across both archives — without touching the design language. Implementation is free to invent its own visual identity; this plan only locks down the mechanics."
date_authored_initial_draft: 2026-05-06
date_authored_current_draft: 2026-05-06
date_authored_final_draft: "[]"
date_first_published: "[]"
date_last_updated: "[]"
at_semantic_version: 0.1.0.0
augmented_with: Claude Code (Claude Opus 4.7, 1M context)
category: Plans
date_created: 2026-05-06
date_modified: 2026-05-06
status: Draft
tags:
  - Splash-Page
  - Astro-Knots
  - Three-Mode
  - Two-Tier-Tokens
  - Pagefind
  - Pseudomonorepo
  - Context-V
  - Changelog-Rollup
  - Peer-Discovery
authors:
  - Michael Staton
  - AI Labs Team
image_prompt: "An exploded-axonometric drawing of a small Astro site at the center of a workshop bench, with five tributary cables labeled 'orchestrator', 'native', 'web-app', 'site', and 'monorepo' converging into it; a tri-state toggle switch hovers above, casting three different colored shadows."
applies_to: apps/memopop-site
from: "memopop-ai"
from_path: "context-v/plans/Upgrade-Memopop-Splash-with-Themes-Context-V-and-Pagefind.md"
---
# Upgrade the MemoPop AI splash with three-mode theming, context-v rollup, peer-aware discovery, and Pagefind

## Why this plan exists

`apps/memopop-site/` was the first splash we built. It works. It's also pre-convention — it landed before `astro-knots/splash/` solidified the **two-tier tokens + three-mode contract**, before we decided every splash should expose a `/context-v/` archive (not just `/changelog/`), and before we adopted **Pagefind** for static site search (per [`context-v/explorations/Using-PRs-More.md`](../../../context-v/explorations/Using-PRs-More.md) and the broader Astro Knots search story).

This is also the **first nested splash** — every other splash is the repo root. `memopop-site` lives at `apps/memopop-site/`, two levels deeper, with three sibling apps (`memopop-orchestrator`, `memopop-native`, `memopop-web-app`) plus a `packages/shared-styles` peer. The astro-knots `process.cwd()/..` shortcut doesn't work here. The discovery layer needs to be **monorepo-aware**, not just child-aware.

## What stays. What changes. What's new.

| Layer | Current state | After this plan |
|---|---|---|
| Theme | Single dark palette in `BaseLayout.astro` `<style is:global>` block, hardcoded `--clr-lossless-*` tokens | Two-tier tokens in `src/styles/theme.css`; **light · dark · vibrant** modes via `data-mode` on `<html>`; live `ModeToggle` in the header, persisted to `localStorage` |
| Discovery | Four hardcoded collections (`changelog-monorepo`, `-orchestrator`, `-native`, `-site`) in `content.config.ts`, each pointing at one specific peer path | Two collections (`changelog`, `context-v`) each loaded by a **peer-walking unionLoader** that scans `apps/*/`, `packages/*/`, and the parent root for `changelog/` and `context-v/` directories |
| Provenance | `[source]/[slug]` URL with hand-listed sources | `from` frontmatter field auto-injected per file; URL becomes `/changelog/<from>/<slug>` and `/context-v/<from>/<slug>`; filter pills generated dynamically from discovery, not from a hardcoded enum |
| context-v rendering | **Missing.** No route. | New `/context-v/` index + `[from]/[...slug]` detail, mirroring the changelog routes, with subdirectory support (`specs/`, `plans/`, `explorations/`, flat files) |
| Search | None | **Pagefind** indexed across changelog + context-v at build time; `/search` page + a header search box |
| Splash content | Marketing-heavy (hero, time comparison, supporters, pipeline, CLI mock, dual CTA) | **All preserved.** Design is open territory; this plan does not touch the marketing prose. |
| Submodule handling | `memopop-orchestrator` is a git submodule, content read from local checkout | **Same.** No GitHub Content API fetcher needed because all peers are on disk (the orchestrator is checked-out via the submodule). A future `rollup:sync` is out of scope. |

## The shape we're aiming at

```
apps/memopop-site/
  astro.config.mjs                 # +pagefind integration hook
  package.json                     # +pagefind, +astro-pagefind
  public/
    favicon.svg
  src/
    styles/
      theme.css                    # NEW — tier-1 + tier-2 tokens, three modes
    layouts/
      BaseLayout.astro             # MOD — pre-paint mode script, theme.css import
    components/
      ModeToggle.astro             # NEW
      SearchBox.astro              # NEW — Pagefind UI mount
      Analytics.astro              # unchanged
      GuiCallout.astro             # unchanged
    loaders/
      peerDiscovery.ts             # NEW — walks the monorepo for peer content dirs
      frontmatter.ts               # NEW — minimal YAML parser (port from splash)
      unionLoader.ts               # NEW — Astro content collection loader factory
    pages/
      index.astro                  # MOD lightly — header gets ModeToggle + SearchBox
      changelog/
        index.astro                # MOD — dynamic filter pills from discovery
        [from]/
          [...slug].astro          # RENAMED from [source]/[...slug].astro
      context-v/
        index.astro                # NEW
        [from]/
          [...slug].astro          # NEW
      search.astro                 # NEW — full-page Pagefind UI fallback
    content.config.ts              # REWRITE — two collections, peer-walking loaders
```

## Step-by-step

### 1. Establish the theme system

**Goal:** Replace the inline `<style is:global>` block in `BaseLayout.astro` with a real `theme.css` shaped like the astro-knots splash, but with MemoPop's brand bias (the existing aquamarine / cyan / purple palette stays — this is a *system upgrade*, not a rebrand).

1. Create `src/styles/theme.css`. Structure:
   - **Tier 1 — named tokens** (BEM-ish: `--color__cyan-electric`, `--color__aqua-bright`, `--color__plum-deep`, `--font__sans`, `--font__mono`). Mode-invariant raw values. Carry the existing palette over and add any neutrals required for the three modes.
   - **Tier 2 — semantic tokens** (kebab-case: `--color-bg`, `--color-bg-soft`, `--color-bg-elevated`, `--color-text`, `--color-text-soft`, `--color-text-dim`, `--color-accent`, `--color-accent-soft`, `--color-accent-warm`, `--color-accent-hot`, `--color-thread`, `--color-border`, `--color-border-strong`, `--shadow-glow`, `--shadow-card`, `--gradient-thread`). Reference tier-1.
   - Three blocks: `:root, :root[data-mode='dark']` (default), `:root[data-mode='light']`, `:root[data-mode='vibrant']`. Each rebinds the same tier-2 keys.
   - Reset, base typography, container utility, `prefers-reduced-motion` short-circuit. Mirror the astro-knots organization but pick MemoPop's own values.
2. Delete the inline `<style is:global>` from `BaseLayout.astro`. Add `import '@styles/theme.css';` (after configuring the alias).
3. **Migration map for existing styles:** the current page-level stylesheets (`index.astro`, `changelog/index.astro`, `[source]/[...slug].astro`) reference `--clr-lossless-*` tokens directly. Add a temporary **alias block** at the bottom of `theme.css`:
   ```css
   /* Back-compat aliases — to be removed once components are migrated. */
   :root {
     --clr-primary-bg: var(--color-bg);
     --clr-lossless-accent--brightest: var(--color-accent);
     --clr-lossless-accent--aquamarine: var(--color-accent-soft);
     --clr-lossless-accent--purple: var(--color-accent-hot);
     --clr-lossless-primary: var(--color-text);
     --clr-lossless-primary-light: var(--color-text-soft);
     --clr-lossless-primary-dim: var(--color-text-dim);
     --clr-lossless-primary-dimmer: var(--color-text-dimmer);
     --clr-border-subtle: var(--color-border);
   }
   ```
   This lets the three-mode swap work instantly across existing markup. We can decide later whether to do a sweep that drops the alias and uses semantic names directly.
4. **Path aliases.** Add to `tsconfig.json` to mirror the astro-knots splash (`@components/*`, `@layouts/*`, `@loaders/*`, `@styles/*`, `@lib/*`, `@/*`) — non-blocking but keeps loader code tidy.

### 2. Build the ModeToggle

1. Port `src/components/ModeToggle.astro` from `astro-knots/splash` essentially as-is. Change the `localStorage` key from `astro-knots-mode` to **`memopop-mode`**.
2. In `BaseLayout.astro` `<head>`, add the **pre-paint inline script** that reads the persisted mode and applies it to `<html data-mode="...">` *before* CSS evaluates — prevents the flash-of-wrong-theme on first paint. (Use the astro-knots pattern verbatim, with the new storage key.)
3. Mount `<ModeToggle />` in the header on every page (`index.astro`, `changelog/index.astro`, `changelog/[from]/[...slug].astro`, `context-v/index.astro`, `context-v/[from]/[...slug].astro`, `search.astro`). Best done by introducing a small `Header.astro` component to avoid duplication.

### 3. Replace hardcoded peer paths with monorepo-aware discovery

This is the unique-to-memopop part. The plan:

1. Create `src/loaders/peerDiscovery.ts` exporting:
   ```ts
   export interface PeerSource {
     slug: string;       // e.g. 'memopop-orchestrator', 'memopop-site', 'shared-styles', 'memopop-ai'
     kind: 'app' | 'package' | 'parent';
     absDir: string;     // absolute path on disk to the source's root
   }

   export async function discoverPeers(opts: {
     siteDir: string;    // absolute path to apps/memopop-site/
   }): Promise<PeerSource[]>;
   ```
   Logic:
   - `parentDir = resolve(siteDir, '..', '..')` — that's the monorepo root.
   - Push `{ slug: <package.json#name of root, fallback 'memopop-ai'>, kind: 'parent', absDir: parentDir }`.
   - Read `parentDir/apps/*` (excluding the site itself) — push each as `kind: 'app'` if it's a directory and it has at least one of `changelog/` or `context-v/`.
   - Read `parentDir/packages/*` — same predicate, `kind: 'package'`.
   - Skip submodule directories that are unpopulated (i.e., `.git` file present but no working tree files) — log and continue.
   - Return sorted: parent first, then apps alphabetical, then packages alphabetical.
2. Why peer-walking, not parent-walking-recursively-for-`changelog/`-anywhere: bounded scope, predictable, mirrors the actual workspace shape from `package.json#workspaces` (`apps/*`, `packages/*`). If `memopop-ai` ever adds e.g. `tools/*`, we add a third glob.

### 4. Rewrite `content.config.ts` around two collections

Replace the four hardcoded collections with two: `changelog` and `context-v`. Each uses a `unionLoader` (factory in `src/loaders/unionLoader.ts`) that:

1. Calls `discoverPeers({ siteDir: process.cwd() })`.
2. For each peer, globs `<peer.absDir>/<collectionName>/**/*.md` (recursive — `context-v/` has subdirs `specs/`, `plans/`, `explorations/`, plus flat files).
3. For each file:
   - Read.
   - Parse frontmatter (port `parseFrontmatter` from `astro-knots/splash/src/loaders/frontmatter.ts`).
   - Skip if `data.publish === false`.
   - Inject provenance fields **only if absent**: `from = peer.slug`, `from_path = <relative path within the collection dir>`, `from_kind = peer.kind`.
   - Compute id as `${peer.slug}/${relPathWithoutExtension}`.
   - `parseData` against the schema (lenient, passthrough; same shape as splash but with MemoPop's existing date-key list — `date_authored_initial_draft`, `date_first_published`, etc.).
   - `store.set({ id, data, body })`.
4. Log `[union:<collection>] <local-parent>+<from-apps>+<from-packages> = <total> entries` once at end.

Schemas: keep the lenient zod preprocessors that already exist in `content.config.ts`. Add the same `from`, `from_path`, `from_kind` provenance fields to both schemas. Both collections share the same date-fallback chain because authors use the same frontmatter conventions across the monorepo.

### 5. Rewire `/changelog/` routes

1. Update `src/pages/changelog/index.astro`:
   - `getCollection('changelog')` (singular).
   - Compute filter pills **dynamically** by grouping entries on `data.from`. Order: parent first, apps alphabetical, packages alphabetical. Display label = `from` value; counts derived from the array.
   - Each entry's link becomes `${base}changelog/${entry.data.from}/${slugWithinPeer}` — where `slugWithinPeer = entry.id.replace(`${entry.data.from}/`, '')`.
   - Keep the existing client-side filter script; just generate buttons dynamically instead of from the four-source enum.
2. Move `src/pages/changelog/[source]/[...slug].astro` → `src/pages/changelog/[from]/[...slug].astro`. Rewrite `getStaticPaths()` to iterate `getCollection('changelog')` once and split id back into `{ from, slug }`. Render the body with `<Content />` exactly as today; provenance line ("From <kind>: <from>") replaces the four hardcoded source-badge classes — colors come from a hash-into-token-palette helper or a simple registry mapped onto thread tokens.
3. Source-badge palette: define `--thread__memopop-orchestrator`, `--thread__memopop-native`, etc. in tier-1 of `theme.css` so per-app colors stay configurable.

### 6. Add the `/context-v/` archive (the missing surface)

1. `src/pages/context-v/index.astro` — same shape as the new `changelog/index.astro`. List entries newest first by `date_modified ?? date_created`. Filter pills by `from`. **Bonus filter:** sub-category dropdown derived from the first segment of `from_path` when it matches `specs|plans|explorations|blueprints|prompts|habits` — these are real conventions, surfaced as pills if present.
2. `src/pages/context-v/[from]/[...slug].astro` — render with `<Content />`. Header strip identical to changelog detail (badge, date, version, status, category). Body styles re-use the same `:global(...)` ruleset; consider extracting to `src/styles/prose.css` and importing in both detail pages.
3. Wire a "Notes" link in the index header next to "Changelog".

### 7. Add Pagefind

Per [`context-v/explorations/Using-PRs-More.md`](../../../context-v/explorations/Using-PRs-More.md) and the splash-page convention being adopted, search lands as **build-time-indexed Pagefind**.

1. **Install:**
   ```bash
   bun add -D pagefind astro-pagefind
   ```
2. **Astro config** (`astro.config.mjs`):
   ```js
   import pagefind from 'astro-pagefind';
   export default defineConfig({
     site: 'https://lossless-group.github.io',
     base: '/memopop-ai/',
     trailingSlash: 'ignore',
     integrations: [pagefind()],
   });
   ```
   `astro-pagefind` runs Pagefind against `dist/` after `astro build` and copies `pagefind/` assets into the published output. No build-script glue needed.
3. **Mark indexable bodies.** On `changelog/[from]/[...slug].astro` and `context-v/[from]/[...slug].astro`, add `data-pagefind-body` to the article wrapper. Add `data-pagefind-meta` for `from`, `kind`, and date so filters work. Mark non-indexable chrome (header, footer, nav) with `data-pagefind-ignore`.
4. **Filters.** Use `data-pagefind-filter="from:..."` and `data-pagefind-filter="kind:changelog"` (set on the wrapper: changelog detail = `kind:changelog`, context-v detail = `kind:context-v`). Lets a single search bar disambiguate.
5. **UI.**
   - `src/components/SearchBox.astro` — header-mounted, includes a `<link rel="stylesheet" href={`${base}pagefind/pagefind-ui.css`}>` and `<script src={`${base}pagefind/pagefind-ui.js`}>` plus a small init script that calls `new PagefindUI({ element: '#search', showImages: false, baseUrl: base })`.
   - `src/pages/search.astro` — full-page version for users who hit `/search` directly. Same mount, larger surface.
6. **Dev mode:** Pagefind can't index until after a build. Document in the site README: `bun run build && bun run preview` to see search locally; `bun dev` will render the search box but it won't return results.
7. **GitHub Pages deploy:** the existing `pages.yml` already runs `bun run build`. After this change, the action will additionally produce `dist/pagefind/`. Verify by checking the workflow's deployed artifact contains a `pagefind/` directory.

### 8. Migrate the splash page itself

The marketing content (`src/pages/index.astro`) is the page the user sees first. It stays — but:

1. Add `<Header />` with `<ModeToggle />` at the top.
2. Ensure the hero gradient uses `--gradient-thread` (semantic), not the hardcoded `linear-gradient(135deg, ...)`. One-line change; instantly modal.
3. The "Supported by" row, time comparison, stats grid, why-grid, pipeline, CLI mock, dual-CTA — all retained. They're already token-driven via the legacy `--clr-lossless-*` aliases (which we kept), so they pivot with mode out of the box.
4. The "Latest changelog" teaser block (currently absent on memopop-site) is **optional creative territory** — pull the top 3 published entries from `getCollection('changelog')` and surface them above the footer. Up to the implementer.

### 9. Documentation + housekeeping

1. Update `apps/memopop-site/README.md`: new local-dev story, where peer content lives, how Pagefind is built, how to add a new app and have its content appear automatically.
2. Add a changelog entry under `apps/memopop-site/changelog/` once shipped (per [`changelog-conventions`](../../../astro-knots/context-v/conventions/Changelog-Conventions.md) — strict frontmatter, ISO dates, "it exists" priority).
3. Add a one-line entry to `MEMORY.md`-style index in `context-v/MEMORY.md` if that index exists for the parent (it doesn't yet — skip if absent).

## Out of scope

- **Rebranding.** Tokens move from one place to another; values stay close to today's. Major palette changes are a separate plan.
- **GitHub Content API rollup-sync.** All four sources are on disk (orchestrator is a checked-out submodule). If we ever want to surface a sibling repo *outside* the monorepo, the astro-knots `rollupFetch.ts` is a clean port — but that's a future plan.
- **MDX or LFM-rendered changelogs.** Today's site uses Astro's stock markdown rendering with a hand-rolled prose stylesheet. The Astro Knots ecosystem is moving toward `@lossless-group/lfm` for richer markdown, but adopting it here is a separate upgrade path. Pagefind works against either.
- **PR / commit-link blocks in changelog entries.** Adopt later, after the [`Using-PRs-More`](../../../context-v/explorations/Using-PRs-More.md) practice settles.
- **Visual design.** Implementer's call. The only constraint is: every color, every spacing, every shadow comes from `theme.css` semantic tokens — no inline hex except inside tier-1 declarations.

## Acceptance criteria

A reviewer should be able to verify each of these on the deployed Pages site:

1. **Three modes visibly differ.** Click each pill in the toggle; background, text, accents, and hero gradient all pivot. Reload — the chosen mode persists. No flash of wrong theme on first paint.
2. **Changelog discovery is automatic.** Drop a new file into `apps/memopop-native/changelog/2026-05-10_01.md`. Run `bun run build:site`. The new entry appears in the changelog list, filterable under a `memopop-native` pill, with a working detail URL at `/changelog/memopop-native/2026-05-10_01/`.
3. **A new app is discovered without code changes.** Create `apps/memopop-tools/changelog/2026-05-10_01.md`. Build. The new pill `memopop-tools` appears, populated with the entry. No edits to `content.config.ts` were required.
4. **Context-v archive renders.** Visit `/context-v/`. See the existing parent-level files (e.g. `Preferred-Format-for-Changelog`), the `specs/` files, the `plans/` files (this plan should appear once published), the `explorations/` file, and any per-app context-v entries (orchestrator, native, web-app). Each loads at `/context-v/<from>/<slug>/`.
5. **Pagefind works.** Type a unique phrase from any indexed file into the header search; the result links to that page. Apply a `from:memopop-orchestrator` filter and the result set narrows.
6. **No regressions on the marketing page.** Hero, time comparison, stats, why-grid, pipeline, CLI mock, dual-CTA, GUI callout, footer all render and behave as today, but pivot with mode.
7. **Type-check passes.** `bun run typecheck` (or `astro check`) is clean. The new schema's lenient passthrough doesn't reject any current frontmatter.

## Risks & open questions

- **First-mode preference.** Today the site is dark-only. Default the toggle to dark, or to `prefers-color-scheme`? Recommend: respect `prefers-color-scheme` for first-time visitors, fall back to dark. (This is what the splash inline script does.)
- **Vibrant mode tonality.** Astro-knots's vibrant is "neon on midnight." MemoPop's existing palette (cyan/aquamarine/purple) is already pretty saturated against `#0a0a0f`. The implementer should decide whether MemoPop's vibrant cranks saturation harder or pivots to a different accent (e.g., chartreuse on `#060612`). Open creative call.
- **Provenance tag colors.** Once the discovery loop adds new apps automatically, we either (a) define a fixed `--thread__<slug>` per known app and fall back to a hash-based color, or (b) let users add the token in `theme.css` when they add a new app. Recommend (a) with a sensible hashing fallback so adding a new app never produces an "uncolored" pill.
- **Index id collisions.** Two peers with the same filename (e.g., both have `changelog/2026-05-01_01.md`) won't collide because id = `<peer.slug>/<rel-path>`. But if one peer ever has the *same slug as the parent project* (`memopop-ai/changelog/foo.md` and the parent's `from` field is also `memopop-ai`), they collide. The discovery layer must **guarantee unique `peer.slug` values** — by using package.json `name` field (with a fallback to directory name), and by erroring loudly if two peers resolve to the same slug.
- **Pagefind in dev.** `astro-pagefind` no-ops in `astro dev`. The search UI mounts but returns nothing. Acceptable, but document loudly so an implementer doesn't think they broke it.
- **Build time.** Pagefind adds ~2–6s to the build for a small site. Acceptable.

## Suggested implementation order

A short feedback loop matters here — keep main shippable at every step.

1. **Theme system + ModeToggle** (steps 1–2). Verify visually: the existing site pivots correctly, no functional change. Ship.
2. **Discovery + collection rewrite** (steps 3–4). Verify the existing four sources still appear, just routed through the new pipeline. Ship.
3. **Changelog route rewrite** (step 5). Verify URLs, filter pills, and detail pages still work. Ship.
4. **Context-v archive** (step 6). New surface, no risk to existing pages. Ship.
5. **Pagefind** (step 7). Last, because it depends on stable indexable URLs from the prior steps. Ship.
6. **Splash polish** (step 8). Creative pass; do not block earlier ships on this.

## What "good" looks like at the end

- A new contributor lands on the deployed site, hits the vibrant toggle, and immediately sees the convention this project is built around.
- A new app added under `apps/` shows up in both the changelog list and the context-v archive with **zero edits to the splash codebase**.
- A `/search` for an obscure phrase returns the right entry across all four (or N) projects.
- The marketing page still does its marketing job — but it's no longer the only thing this site does.

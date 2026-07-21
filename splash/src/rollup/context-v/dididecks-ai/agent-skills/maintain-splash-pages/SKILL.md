---
name: maintain-splash-pages
description: The Lossless Group's pattern for repo-level splash pages — small Astro sites at <repo>/splash/ that ship to GitHub Pages on push to main, render the repo's changelog/ + context-v/ alongside curated marketing copy, and stay isolated from any package the repo also publishes. Use proactively whenever scaffolding a noteworthy new repo (every "important" repo wants one), when shipping a coherent chunk of work that an external reader would land on, when adding a feature (search, sort, tags row, theme mode) to an existing splash, when converting a legacy apps/<name>/ site to splash/, when troubleshooting a Pages deploy, or when the user mentions "splash", "GitHub Pages", "lossless-group.github.io", "Pagefind on our site", or working under a splash/ directory. Codifies the proven shape across three reference implementations (memopop-site, content-farm/splash, lfm/splash) and the package-isolation discipline that keeps splashes safe to add to repos that also publish to JSR/npm.
status: Draft
from: "dididecks-ai"
from_path: "context-v/agent-skills/maintain-splash-pages/SKILL.md"
---
# Maintain Splash Pages

> A splash is the source repo's own GitHub Pages presence — distinct from any future custom-domain marketing site. The directory is named `splash/` precisely to keep that linguistic space open.

**Status: Draft.** This skill codifies the pattern after three confirmed instances. It pairs with a sibling **habit** titled *"Maintain a Github Splash Page for each Repo"* that explains the *why*; this skill is canonical for the *how*. The habit currently lives under `lossless-monorepo/context-v/habits/` but may move — search for it by title before assuming a path. Always cross-reference the most recent reference implementation (currently `lfm/splash/`) before scaffolding fresh.

## Reasoning step before implementation: does this repo deserve a splash?

The convention is "every important repo." That word is doing work — not every repo earns one. Use this rough cut:

**Yes, scaffold a splash:**
- The repo will be shared with people outside the team (clients, collaborators, hiring loops, conference talks)
- The repo has — or will have — a non-trivial `changelog/` worth surfacing
- The repo publishes a package (npm/JSR) and you'd like an installable-package landing page that isn't just the registry's auto-generated one
- The repo is an Astro Knots site or feature
- The repo is a study, blueprint, or reference that other repos will link to
- Someone has asked "where's the README rendered?" or "is there a page for this?"

**Probably not (yet):**
- The repo is purely internal scratch — experiments, sandboxes, throwaway studies that aren't meant to outlive the week
- The repo is a fork where we're contributing upstream
- The repo is a private tool with no external audience

**When in doubt, ask the user.** The cost of *not* having a splash is "no public face" — fixable later. The cost of having a stale, unmaintained one is worse than nothing.

**Surface the question proactively.** When working in a repo that meets the *yes* criteria but doesn't have a splash, mention it. ("This repo doesn't have a splash yet; want me to scaffold one?") That's how the convention spreads.

## Second reasoning step: visual posture — codified or creative?

Splash pages are one of the few places in the Lossless ecosystem where **aesthetic experimentation is explicitly encouraged, not just tolerated.** Astro Knots sites have their own marketing identities. Packages have design languages tied to their function. Splashes are deliberately the place where individual repos can have distinct *feels* — and where agent creativity in visual design and layout is wanted, not feared.

Before laying out a single component, **ask the user this question**:

> *"Are we following a design pattern from a reference splash, or are we getting creative on visual design?"*

The two answers warrant different work, and the answer should be explicit:

- **"Follow the reference":** Lift the closest sibling splash structurally and adapt only what the new repo's content requires. Same hero composition, same type stack, same card chrome — fresh content, recognizable surface. Faster, lower-risk.
- **"Get creative":** Treat this as the experimentation surface it's meant to be. **Diverge in *shape*, not just in *color*.** Reach for typographic moves, layout moves, ornament moves — not just remap the brand-spine tokens to different hues.

### The trap to watch for

The recurring failure mode across the first three splashes (before this one) was visible in retrospect: each new splash inherited the previous one's hero composition, card geometry, and ornament strategy, then renamed the brand-spine variables to "make it different." The output: the same aesthetic three times in three palettes.

Recognizable signs you're sliding into the trap:

- The hero is centered with stacked headline + tagline + CTA — *because the last splash was*
- The cards have rounded glass with a glow shadow — *because the last splash had them*
- The background is a radial mesh with a faint grid — *because the last splash used one*
- The display + sans pairing is the obvious modern default — *because that's what gets reached for*
- You're picking colors but not picking **moves**

When you notice this happening, **stop, surface, and propose**.

### Surface a posture proposal before laying out components

When the user says "get creative" (or doesn't specify and the splash matters enough to diverge), send a one-paragraph posture proposal *before* writing any layout. Name the axes you're considering:

> *"For this splash I'm thinking light-mode default + serif display (Newsreader) + asymmetric hero with the diagram dominant on the right + paper-grain background with a manuscript margin rule + literary voice in the copy. That makes it visibly distinct from memopop (dark, sans, centered, radial mesh, matter-of-fact) and content-farm/splash. Sound right, or want to push in a different direction?"*

Cheap to send, gets the user a chance to nudge before code lands, and reinforces that **aesthetic posture is an explicit decision, not a default.**

The detailed *what's locked vs. what's free* table lives further down under [Visual identity — divergent by design](#visual-identity--divergent-by-design). Read it before drafting the proposal.

## When to use this skill

- The user asks to scaffold a splash for a new repo
- The user wants to add search, sort, tags, mode toggle, or any other feature to an existing splash
- Converting a legacy `apps/<name>/` site to the canonical `splash/` location
- Troubleshooting a GitHub Pages deploy of a splash
- The user mentions "splash", "GitHub Pages", "lossless-group.github.io/<repo>/", "Pagefind on our site"
- You're working anywhere under a `splash/` directory in any Lossless repo
- The user wants to verify a splash meets the convention ("is this splash done?")

## Composes with other skills

Skills this one always pulls along:

- **`astro-knots`** — framework rules, hard prohibitions (no React, no JSX). The splash is built in Astro.
- **`theme-system`** — two-tier tokens, three-mode contract. The splash uses these.
- **`context-vigilance`** — `context-v/` schemas, frontmatter, lenient parsing. The splash renders `context-v/`.
- **`changelog-conventions`** — `changelog/` structure. The splash renders `changelog/`.
- **`pseudomonorepos`** — search-first behavior, parent-vs-child level discipline. Especially for the rollup variant.

## Reference implementations

Three confirmed splashes as of writing. Read at least one end-to-end before scaffolding a new one:

| Repo | Variant | Path | Notable |
|---|---|---|---|
| `ai-labs/memopop-ai/apps/memopop-site/` | Single-project (legacy location, predates the habit) | `apps/<name>/` | First instance. Has Pagefind search. |
| `content-farm/splash/` | Pseudomonorepo (rollup) | `splash/` | Canonical reference. Submodule rollup via GitHub Content API. |
| `lfm/splash/` | Single-project, package-publishing repo | `splash/` | Second Pagefind instance. Asymmetric hero. Package-isolation discipline. |

The habit names `content-farm/splash/` as the reference implementation — read its `README.md` end-to-end.

## Variants

Pick once, stick with it:

- **Single-project repo** — no submodules. `content.config.ts` reads `../changelog` and `../context-v` directly. No `src/rollup/`, no `scripts/rollup-sync.ts`, no `splash/.env`. Examples: `lfm/splash/`.
- **Pseudomonorepo** — children as submodules. Splash aggregates each child's `changelog/` and `context-v/` via the GitHub Content API. Sync-on-demand (`pnpm rollup:sync`), never sync-on-build. Examples: `content-farm/splash/`.
- **Package-publishing repo** — repo also publishes to JSR/npm. Splash must be excluded from publish allowlists. See *Package isolation* below. Examples: `lfm/splash/`.

The variants compose: lfm is single-project + package-publishing. content-farm is pseudomonorepo + non-publishing.

## Locked conventions

These are deliberate. Don't drift without a reason.

### Tech & structure

- **Astro.** No React, no JSX. (See `astro-knots`.)
- **Directory name:** `splash/` at repo root. *Not* `site/`. *Not* `apps/<name>` (legacy memopop only). The name preserves linguistic space for a future custom-domain marketing site.
- **Package name:** `<repo>-splash`. `private: true`. Astro is the only required dep at minimum; `astro-pagefind` + `pagefind` if search is enabled.
- **TypeScript path aliases** in `tsconfig.json`: `@components/*`, `@layouts/*`, `@loaders/*`, `@lib/*`, `@styles/*`, `@content/*`, `@pages/*`, `@/*`. Loader code never needs `../../../` guesswork.

### Build & host

- **Host:** GitHub Pages, project-page form. Live URL pattern: `https://lossless-group.github.io/<repo>/`.
- **`astro.config.mjs`:** `site: 'https://lossless-group.github.io'`, `base: '/<repo>/'`, `trailingSlash: 'ignore'`, `build.format: 'directory'`. Custom domain later? Set `site` to the domain and `base` to `'/'`.
- **Build trigger:** push to `main`. Aligns with the `development` → `main` → `master` tier model.
- **Deploy action:** `actions/deploy-pages@v4` with `actions/configure-pages@v5` using `enablement: true` so the workflow bootstraps Pages on first run.
- **No submodule fetching in CI** even for pseudomonorepos — rolled-up content is pre-synced and committed; CI does pure file IO.

### Local dev

- `pnpm install --ignore-workspace` — required because the parent monorepo's `pnpm-workspace.yaml` does not include splash sites; the splash installs deps independently.
- `pnpm dev` respects the configured `base`; visit `http://localhost:4321/<repo>/`.
- For Pagefind: search index is built at deploy time only — `pnpm dev` shows the search box mounted with a missing-state message. Run `pnpm build && pnpm preview` to exercise search locally.

## Reference file layout

```
<repo>/
├── splash/
│   ├── astro.config.mjs              # base: '/<repo>/', trailingSlash: 'ignore'
│   ├── package.json                  # private; "<repo>-splash"; astro (+ astro-pagefind, pagefind)
│   ├── tsconfig.json                 # path aliases
│   ├── .gitignore                    # node_modules/, dist/, .astro/, .env
│   ├── .env.example                  # GITHUB_API_TOKEN= (pseudomonorepos only)
│   ├── README.md                     # local dev, deploy, where content lives, how to update
│   ├── public/                       # favicon.svg, og image, brand marks
│   ├── scripts/
│   │   └── rollup-sync.ts            # pseudomonorepos only
│   └── src/
│       ├── content.config.ts         # lenient schemas + (pseudomono) unionLoader
│       ├── content/<thing>-highlights/   # curated gallery cards (one .md per item)
│       ├── rollup/                   # pseudomono only — synced submodule content; committed
│       ├── loaders/                  # frontmatter, githubContentApi, parseGitmodules, rollupFetch
│       ├── lib/seo.ts                # static SEO copy
│       ├── lib/date.ts               # toDate / formatDate / isoDate helpers
│       ├── layouts/BaseLayout.astro  # tokens, fonts, head, body shell, mode pre-paint
│       ├── components/               # Header, MetaTags, ModeToggle, FeatureCard, SearchBox, SortControls, MetaTags
│       ├── styles/                   # theme.css (two-tier tokens), prose.css
│       └── pages/
│           ├── index.astro
│           ├── search.astro
│           ├── changelog/index.astro
│           ├── changelog/[...slug].astro
│           ├── context-v/index.astro
│           └── context-v/[...slug].astro
└── .github/workflows/pages.yml       # deploy splash/ on push to main
```

## Package isolation (for repos that publish to JSR / npm)

This was the design constraint that determined whether the splash could be added to LFM at all. The boundary is enforced by **explicit allowlists**, not by what exists in the working tree:

| Channel | Defined in | Allowlist | Splash files |
|---|---|---|---|
| JSR (canonical) | `deno.json` → `publish.include` | `src/**/*.ts`, `src/**/*.md`, `deno.json`, `LICENSE`, `README.md` | excluded |
| npm | `package.json` → `"files"` | `src`, `dist`, `README.md`, `LICENSE` | excluded |
| Build (`tsup`) | `tsup.config.ts` `entry` | hard-coded `src/...ts` paths | excluded |
| Workspace install | parent `pnpm-workspace.yaml` | `packages: [...]` omits `splash/` | excluded |

`splash/package.json` carries `"private": true` as defense-in-depth — the boundary is the allowlists, the `private` flag is the suspenders to the allowlist's belt. Both belong.

When scaffolding a splash for a publishing repo: **verify all four boundaries before declaring the work done.** It's cheap to check; the failure mode (publishing splash files to npm) is hard to undo.

## Content schemas — lenient, never throw

Every field in `content.config.ts` uses `z.preprocess` to coerce empty strings, nulls, and unexpected types gracefully. Schemas **never throw** on legacy entries — they `safeParse` and store raw frontmatter as a fallback. Pages stay defensive too: any code that calls `.getTime()` on a date goes through a `toDate(unknown)` helper because the loader's "store raw" fallback path means strings can arrive where Dates are expected.

The lenient preprocessor stack to lift verbatim:

- `lenientString` — coerces empty strings and nulls to `undefined`
- `lenientStringArray` — coerces a single string to a one-item array, accepts arrays as-is. **Important:** the changelog-conventions skill specifies `augmented_with` is a *list* field. Use `lenientStringArray` for it, not `lenientString`. Older legacy entries used a bare string; the lenient array preprocessor accepts both forms.
- `lenientDate` — accepts Date | number | string; tolerates `"[]"`, `"~"`, `"TBD"`, `"tbd"` as undefined; never throws
- `lenientNumber`, `lenientBoolean` — same pattern

Schemas use `.passthrough()` so unknown fields (`site_uuid`, `slug`, `image_prompt`, `usageCount`, `usage_count`, etc.) ride along without validation noise.

### The defensive-rendering pair

Lenient schemas alone aren't enough. When schema validation fails for *any* reason, the loader's `safeParse` falls back to raw frontmatter — which means dates arrive as strings, not Date objects. **Every render-side call site that touches a date must go through a `toDate(unknown): Date | undefined` helper** in `@lib/date.ts`. Sort code that calls `.getTime()` directly on a possibly-string field will crash the page; defensive code never does.

```ts
// @lib/date.ts
export function toDate(v: unknown): Date | undefined {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;
  if (typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '' || t === '[]' || t === '~' || t === 'TBD' || t === 'tbd') return undefined;
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}
```

The lenient schemas + defensive renderers are a *pair*. Skipping either one creates page-crash classes that only surface when a particular legacy entry happens to violate the schema.

The full pattern is in `lfm/splash/src/content.config.ts` and `lfm/splash/src/lib/date.ts` — copy and adapt, don't re-invent.

## Search — Pagefind by default

The convention is set: every splash ships search-by-default. The exploration `astro-knots/context-v/explorations/Implementing-Full-Text-Search-by-Default.md` named Pagefind as the strong default; we've now confirmed it twice (memopop-site, lfm/splash).

### Wire-up

1. **Deps:** `pnpm add astro-pagefind pagefind --ignore-workspace`
2. **Integration in `astro.config.mjs`:** `import pagefind from 'astro-pagefind'; integrations: [pagefind()]`
3. **Build format:** `build.format: 'directory'` — Pagefind needs stable per-page URLs.
4. **`SearchBox.astro` component:** lift verbatim from `lfm/splash/src/components/SearchBox.astro` or `memopop-site/src/components/SearchBox.astro`. Two variants — `compact` (header popover) and `full` (search page). `<details>` for the popover (no JS state needed). Global `/` keyboard shortcut.
5. **`/search` page:** full-panel SearchBox with `autoFocus`.
6. **Header:** mount `<SearchBox compact />` in the actions area; add a `Search` nav link to `/search/`.

### `data-pagefind-*` placement

**Critical Pagefind behavior to know:** once *any* page on the site uses `data-pagefind-body`, only pages with that marker are indexed. Pages without it are silently skipped. This is desirable here — we want results pointing at content, not list/home/search/navigation surfaces. But if you're debugging "why is page X not in the index," check whether *some other* page on the site has `data-pagefind-body` set, which made all unmarked pages opt-out.

| Page | Markers |
|---|---|
| Detail pages (`changelog/[...slug]`, `context-v/[...slug]`) | `data-pagefind-body` on `<main>`, `data-pagefind-meta="title:..."`, hidden `<span data-pagefind-filter="kind:Changelog\|Context">`, hidden `<span data-pagefind-filter="tag:..."` per tag, `data-pagefind-ignore` on chrome (back link, meta line, status pill row) |
| List pages (`/changelog/`, `/context-v/`) | `data-pagefind-ignore="all"` on the `<ul>` |
| Home / search / index pages | Nothing — they're not indexable since none have `data-pagefind-body` |

### Filter taxonomy

The convention has two facet keys:

- `kind:` — `Changelog` | `Context` (and `Notes` in legacy memopop). One value per page.
- `tag:` — emits one hidden filter span per entry tag. Train-Case values per the changelog/context-v conventions.

Pseudomonorepos add a third facet: `from:<peer>` — peer-app or submodule slug. Single-project splashes drop it; conventions still hold.

### UI overrides — token-driven

Pagefind's default UI exposes CSS variables. Map them to your semantic tokens so the search UI pivots through light/dark/vibrant modes with the rest of the site:

```css
:global(.pagefind-ui) {
  --pagefind-ui-primary: var(--color-accent);
  --pagefind-ui-text: var(--color-text);
  --pagefind-ui-background: var(--color-bg);
  --pagefind-ui-border: var(--color-border-strong);
  --pagefind-ui-tag: var(--color-bg-soft);
  --pagefind-ui-font: var(--font__sans);
  /* ... */
}
```

Don't fork the UI. Variable overrides have been sufficient through three implementations.

## Sort controls on list pages

Both `/changelog/` and `/context-v/` carry a `<SortControls>` component above the list. Default sort: `date_modified` descending (newest first). Options: `Modified` | `Created` | `Published` | `Title`.

Wire-up:

- **Server pre-sorts** by the default key/direction so the static HTML matches the UI default — page reads correctly even before JS hydrates or with JS off.
- **Each `<li>`** carries `data-sort-modified`, `data-sort-created`, `data-sort-published`, `data-sort-title` attrs. ISO date strings sort lexicographically (correct as time-order); titles are lowercased for stable alpha sort. Empty values always sink to the bottom regardless of direction.
- **Each `<ul>`** carries `data-sort-target="<page-name>"` so the SortControls JS can find all sortable lists on the page (multiple `<ul>`s on grouped views like context-v).
- **Persistence:** per-page in `localStorage` under `lfm-splash-sort:<name>` (or analogous). `<page-name>` is the namespace — `changelog` and `context-v` get independent prefs.
- Direction label adapts to value type: dates show "Newest first / Oldest first", titles show "A → Z / Z → A".

Lift `lfm/splash/src/components/SortControls.astro` directly. The component is generic — takes a `name`, `options[]`, `defaultKey`, `defaultDirection`.

## Tags row in list previews

Each `<li>` in list views renders the entry's tags below the lede, wrapping to multiple lines as needed. **No slice limit by default — show every tag.** (Memopop-site sliced to the first 5; the newer convention is "let it wrap" — entries with many tags shouldn't have most hidden, since tags are a primary discoverability surface.) Train-Case values come straight from frontmatter `tags:` arrays. Visual: small mono-font chips with hairline borders, `flex-wrap: wrap`.

```astro
{entry.data.tags && entry.data.tags.length > 0 && (
  <ul class="entry-list__tags" aria-label="Tags">
    {entry.data.tags.map((t) => (
      <li class="entry-list__tag">{t}</li>
    ))}
  </ul>
)}
```

## Visual identity — divergent by design

Each splash should *look distinct from its siblings* while keeping the same architectural shape. The structural shape is locked because affordance consistency matters; the aesthetic surface is free because individual-project feel matters. The discipline is to know which is which.

### What's locked (don't break) vs. what's free (encouraged to diverge)

| Locked — architectural | Free — aesthetic |
|---|---|
| `data-mode` on `<html>` + the three-mode contract | Which mode is the **default** |
| Semantic token names (`--color-bg`, `--color-text`, `--color-accent`, `--color-thread`, ...) | The Tier-1 **values** behind them |
| The pre-paint mode-resolution script in `BaseLayout` (no FOUC) | The **brand spine** (cyan vs. ink-violet vs. ...) |
| Accessibility primitives (focus rings, `prefers-reduced-motion`) | The **typeface stack** (display + sans; mono usually JetBrains) |
| Component primitive shapes (`.pill`, `.eyebrow`, `.gradient-text`, `.from-tag`, `.folio`, `.chip`) | The **hero composition** (centered, asymmetric, manuscript-style, terminal-style, …) |
| Lenient schema + defensive rendering pair | The **card chrome** (rounded glass, hairline borders, printer's-mark corners, brutalist no-border, …) |
| `data-pagefind-*` placement convention | The **background ornament** (radial mesh, paper grain, ASCII diagram lines, riso noise, …) |
| `BaseLayout` props surface | The **density** (airy vs. dense), **voice** (matter-of-fact vs. literary vs. terminal vs. academic) |
| Content collection structure (`feature-highlights`, `sct-examples`, etc.) | The component *visuals* layered on top |

A reader navigating between two Lossless splashes back-to-back should feel the **family resemblance** — same affordances, same conventions, search in the same place, mode toggle in the same place — but each splash should also feel like **its own thing**, not a recolor of the last one.

### Examples of divergence in the existing splashes

| Axis | memopop-site | content-farm/splash | lfm/splash |
|---|---|---|---|
| Default mode | dark (operator) | dark | **light** (writer's mode) |
| Display + sans | Fraunces + Inter | (similar to memopop) | **Newsreader + Manrope** |
| Hero composition | centered, stacked CTAs | (similar) | **asymmetric, diagram-dominant** |
| Card chrome | rounded glass, glow shadows | (similar) | **squarer corners, hairline borders, printer's-mark corner ticks** |
| Background ornament | radial mesh + faint grid | (similar) | **paper grain + manuscript margin rule** |
| Brand spine | cyan + aquamarine + plum | (similar palette family) | **ink-violet + sienna + moss** |
| Voice | matter-of-fact | matter-of-fact | **literary, manuscript-flavored** |

The first two splashes shipped before the divergence discipline was named — they came out feeling like the same site twice. The lfm splash was the first to break the mold deliberately. **Treat that as the bar going forward**, not the ceiling — the next splash should feel different from all three.

### Concrete divergence axes worth pushing on

Don't just pick colors. Pick **moves**:

- **Mode default**: light, dark, vibrant. Each has a different voice.
- **Type pairing**: serif display + geometric sans, monospace-forward, all-mono, variable-axis serif, slab + grotesque.
- **Hero composition**: centered stacked, asymmetric two-column, full-bleed with ornament, terminal-prompt frame, manuscript-page header, magazine-style pull-quote.
- **Card chrome**: glassmorphism, hairline + corner ticks, brutalist no-border, notebook-tab tabbed, ledger-row dense, polaroid-frame.
- **Background ornament**: radial mesh, paper grain, ASCII diagram strokes, risograph noise, gradient bands, dot grid, blueprint grid.
- **Voice**: matter-of-fact, literary, terminal/CLI, academic, hand-written zine, datasheet.

Mix freely *across* axes; pulling from the same column on every axis is the trap. If the new splash's row in the table above looks like a copy of an existing splash's row, push harder.

## Acceptance — "this repo has a splash"

Verify before declaring the habit met (lifted from the habit doc, slightly tightened):

- [ ] `splash/` directory exists at repo root
- [ ] `splash/astro.config.mjs` has correct `site` and `base: '/<repo>/'`
- [ ] `splash/package.json` has `"private": true` and the `<repo>-splash` name
- [ ] `splash/tsconfig.json` declares the path aliases
- [ ] `splash/README.md` documents local dev, deploy, package isolation (if applicable), and where content lives
- [ ] `pnpm install --ignore-workspace && pnpm build` succeeds from a clean clone
- [ ] `splash/dist/` includes routes for `/`, `/search/`, `/changelog/`, `/context-v/`, plus per-entry detail routes when entries exist
- [ ] `splash/dist/pagefind/pagefind-entry.json` exists with `page_count` matching the number of detail pages
- [ ] `.github/workflows/pages.yml` exists, builds `splash/`, deploys via `actions/deploy-pages@v4`, uses `actions/configure-pages@v5` with `enablement: true`
- [ ] GitHub Pages source is set to **"GitHub Actions"** in repo settings
- [ ] First deploy reaches `https://lossless-group.github.io/<repo>/` and loads cleanly
- [ ] Mode toggle works: light/dark/vibrant all render without FOUC, persist across reloads
- [ ] Search returns results when typing into the header popover or `/search` page
- [ ] Sort controls reorder correctly on `/changelog/` and `/context-v/`; default is `date_modified` descending
- [ ] (Pseudomonorepos only) `pnpm rollup:sync` runs locally; `splash/src/rollup/` is committed; rolled-up content appears with provenance
- [ ] (Publishing repos only) Verify all four package-isolation boundaries — JSR `publish.include`, npm `files`, build entry list, parent workspace exclusion

## Maintenance cadence

- **On every shipped change** — author a `changelog/` entry; surfaces on the splash on next deploy
- **(Pseudomonorepos) when a child ships** — run `pnpm rollup:sync`, commit `src/rollup/`, push
- **When the curated gallery drifts** — edit `src/content/<thing>-highlights/`. New item? Add a file. Retired? Delete it.
- **Periodically (e.g. weekly)** — sync rollup to catch upstream drift even without a triggering event

## Typical flow when scaffolding a new splash

1. **Walk the tree.** Per `pseudomonorepos`, search for prior splash work in the repo and parent levels. Note any context-v entries about search, theming, or splash-specific design decisions.
2. **Pick the variant** — single-project, pseudomonorepo, or package-publishing (or combination).
3. **Read at least one reference splash end-to-end** — the habit doc names `content-farm/splash/`. For single-project + publishing, `lfm/splash/` is closest.
4. **Scaffold the directory** matching the reference layout. Lift `astro.config.mjs`, `package.json`, `tsconfig.json`, `BaseLayout.astro`, `Header.astro`, `MetaTags.astro`, `ModeToggle.astro`, `SearchBox.astro`, `SortControls.astro`, `frontmatter.ts` directly.
5. **Resolve the visual posture with the user** — ask: *"following a reference or getting creative?"* If creative, propose the divergence axes (mode default, type pairing, hero composition, card chrome, ornament, voice) before laying out components. Stay distinct from sibling splashes; reuse the semantic-token contract.
6. **Wire the content collections** with lenient schemas pointing at `../changelog` and `../context-v`. Use the proven preprocessor stack.
7. **Add Pagefind** — `data-pagefind-body` on detail pages, `data-pagefind-ignore="all"` on list teasers, `kind:` + `tag:` filter spans.
8. **Add the GitHub Pages workflow** — `.github/workflows/pages.yml` with `actions/deploy-pages@v4`.
9. **Write `splash/README.md`** — local dev, deploy, package isolation table (if publishing), where to edit content.
10. **Verify acceptance criteria** — run through the checklist above before declaring done.
11. **Author a changelog entry** at the repo root for the splash addition. Per `changelog-conventions`, lead with `## Why Care?` then `## What's New?`.
12. **For publishing repos** — run the parent's build (`pnpm build`, `tsup`, etc.) once more to confirm the splash hasn't broken the package.

## Lessons learned (from the lfm/splash session)

These are the gotchas worth flagging in advance so the next implementation doesn't rediscover them.

1. **`augmented_with` is a list field.** The changelog-conventions skill says "same ul-list preference as authors." Schemas that declare it as a `lenientString` will trip `safeParse` on convention-correct entries, kicking the loader into raw-frontmatter fallback. Always `lenientStringArray`.
2. **Schema validation failure → date strings, not Date objects.** When a schema falls back to raw frontmatter, every date field arrives as a string. Render-side sort and format code must go through `toDate(unknown)`. The lenient schema and the defensive renderer are a *pair* — skipping either is a deferred crash.
3. **Pagefind's "once one page has `data-pagefind-body`, only marked pages are indexed."** Add the marker to the routes you actually want indexed (`changelog/[...slug]`, `context-v/[...slug]`). The home, list, and search pages will silently drop out of the index — which is what you want, but be ready to explain it.
4. **Tags row: no slice limit.** Wrap, don't truncate.
5. **Default sort by `date_modified` descending — server-pre-sort to match the UI default.** Static HTML must read correctly even with JS off; the SortControls component reorders client-side once mounted, but the initial render needs to already be in default order.
6. **Sort UI persists per-page** in `localStorage` under namespaced keys (`lfm-splash-sort:changelog`, `lfm-splash-sort:context-v`). Different pages have different prefs.
7. **Walk the tree before re-deciding architecture questions.** Per `pseudomonorepos`. The exploration `astro-knots/context-v/explorations/Implementing-Full-Text-Search-by-Default.md` exists for a reason — read it before relitigating the search-engine choice.
8. **Second instance crystallizes a convention.** Memopop-site shipped Pagefind first as an exploration; lfm/splash shipped it as a confirmed pattern. When you find yourself implementing something "just like the last splash," that's the moment to update the skill (and any companion blueprint) so the third instance doesn't have to rediscover the choices.
9. **Light is a legitimate default mode.** Memopop defaults dark; lfm defaults light. The three-mode contract is symmetric — pick the default that fits the splash's voice.
10. **Single `<details>` element is enough for the search popover.** No JS state machine needed for "open on click, close on outside-click." The `<details data-search-compact>` pattern from `SearchBox.astro` is the cleanest version.
11. **Render the existing changelog conventions field-for-field.** When wiring a changelog/ list, remember the conventions skill's mandatory frontmatter (8 fields including `lede`). The splash should display all of them gracefully — but never crash if a legacy entry is missing several.
12. **Convention fixes belong in the schema, not in per-page code.** When you find a frontmatter-shape bug (e.g. `augmented_with` mismatch), fix it in `content.config.ts` so every page benefits. Don't paper over it at the call site.
13. **Aesthetic divergence is the goal, not a risk to manage.** The first three splashes (before lfm) ended up looking like each other — same hero shape, same card geometry, same ornament strategy, with brand-spine recolors layered on top. The path out: ask the user upfront whether to follow a reference or get creative, propose the divergence axes explicitly, and **diverge in shape, not just in hue**. When agent creativity in visual design produces something genuinely distinct, that's the right outcome — splashes are the experimentation surface where this kind of move belongs.

## What this skill deliberately is not

- **Not the design system.** The component shapes here are minimum viable; nothing prevents richer per-splash UI (search hotkeys, animated mode transitions, custom filters). The skill defines the *floor* of consistency.
- **Not a runtime dependency.** Every component is meant to be lifted/copied. We don't ship a `@lossless-group/splash-kit` package — that would couple splashes through versioning. Per the Astro Knots philosophy: copy-pattern, not runtime dep.
- **Not the eventual marketing site.** When a project deserves a custom-domain marketing site, build that separately. The splash stays put as the source repo's own Pages presence.

## See also

- **Habit:** *"Maintain a Github Splash Page for each Repo"* — currently at `lossless-monorepo/context-v/habits/`. The *why*. Search by title; the path may evolve.
- **Reference splashes:** `lfm/splash/` (most recent), `content-farm/splash/` (canonical reference, pseudomonorepo variant), `ai-labs/memopop-ai/apps/memopop-site/` (first instance, legacy `apps/` location).
- **Spec:** `content-farm/context-v/specs/Github-Splash-Page-for-Content-Farm.md` — the spec the canonical reference implements.
- **Search exploration:** `astro-knots/context-v/explorations/Implementing-Full-Text-Search-by-Default.md` — establishes Pagefind as the default for Astro Knots. The lfm/splash work is the second confirmed instance; promoting to a blueprint is the natural next step.
- **Sibling skills:**
  - `astro-knots` — framework rules and prohibitions
  - `theme-system` — two-tier tokens, three-mode contract
  - `context-vigilance` — context-v frontmatter and rendering
  - `changelog-conventions` — changelog frontmatter and ship-note structure
  - `pseudomonorepos` — parent-repo patterns, search-first behavior, roll-up convention

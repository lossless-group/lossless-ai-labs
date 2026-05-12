# ai-labs splash

GitHub Pages splash for the `ai-labs` pseudomonorepo.
Live target: `https://lossless-group.github.io/ai-labs/`.

## Local dev

```bash
pnpm install --ignore-workspace
pnpm rollup:sync                  # one-shot — reads from sibling submodules
pnpm dev
# visit http://localhost:4321/ai-labs/
```

`--ignore-workspace` is required because the parent (`ai-labs/`) workspace
boundaries do not include this splash; the splash installs its own deps.

## Build

```bash
pnpm build
# output in dist/
```

## How rollups work

`pnpm rollup:sync` walks each child submodule's locally-checked-out
`changelog/` and `context-v/` and writes them into `src/rollup/` with
provenance frontmatter (`from`, `from_path`). The build then reads the
union of:

- the parent's own `../changelog/` + `../context-v/`
- the synced `src/rollup/changelog/<child>/...` + `src/rollup/context-v/<child>/...`

Commit `src/rollup/` so the build does not need to clone submodules in CI.
Re-run `pnpm rollup:sync` when a child ships a notable entry — entries are
the unit, not commits.

Children rolled up: `context-vigilance-kit`, `memopop-ai`, `dididecks-ai`.

## Visual posture

- **Default mode:** dark (bench).
- **All three modes first-class:** dark · light · vibrant. Persists to
  `localStorage`; pre-paint script resolves before first paint.
- **Type:** mono-forward — Space Grotesk display, Inter Tight sans, JetBrains
  Mono dominant for eyebrows / metadata / labels / status pills.
- **Card chrome:** bench-card — hairline border, mono label-tab clipped to
  top-left like a hand-labelled drawer, status pill upper-right.
- **Background:** faint blueprint grid (8px fine + 32px major), masked to
  fade out below the fold.
- **Brand spine:** sodium amber (accent) · electric cyan trace (thread) ·
  plum-magenta (signal).

See `src/styles/theme.css` for the full token surface.

## Where content lives

- **Curated product cards:** `src/content/product-highlights/*.md`.
- **Hero / discipline / studies copy:** hand-curated in `src/pages/index.astro`.
- **Rolled-up changelog + context-v:** `src/rollup/` (regenerated, committed).
- **Tokens:** `src/styles/theme.css`.

## Status

First-pass scaffold. Pagefind search and a `.github/workflows/pages.yml`
will follow in the next iteration; the build target ("pnpm build succeeds
from a clean clone") is met.

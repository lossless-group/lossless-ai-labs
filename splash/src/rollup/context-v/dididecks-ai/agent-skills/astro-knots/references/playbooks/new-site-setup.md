---
from: "dididecks-ai"
from_path: "context-v/agent-skills/astro-knots/references/playbooks/new-site-setup.md"
---

# Playbook: New Site Setup

How to initialize a new Astro-Knots site from zero. This is the **pattern and decision flow** — for executable commands, file templates, and narrative context, see `astro-knots/context-v/prompts/New-Site-Quickstart-Guide.md` in the monorepo.

**Philosophy:** the setup process nudges developers toward Astro-Knots pseudomonorepo conventions *before* project-specific needs dominate. Without this nudge, developers jump straight into project work and skip the structural conventions (changelog, design-system, brand-kit, submodule registration) that make sites composable across the family.

## Prerequisites

- **pnpm** installed globally (never npm — workspace protocol breaks with npm)
- **gh CLI** authenticated to GitHub
- **Lossless Group org access** on GitHub (for repo creation under `lossless-group`)
- **JSR registry access** (for installing `@lossless-group/lfm`)
- **Parent pseudomonorepo cloned** (`astro-knots`) at `~/code/lossless-monorepo/astro-knots/`

## The Flow (12 steps)

### 1. Develop README, create repo, push

Before any code:

1. Draft a minimal README (project name, one-sentence purpose, link to parent monorepo)
2. Use `gh repo create lossless-group/<site-name> --public` to initialize under the org
3. Push the README as the first commit

**Why first:** the site must exist as an independent repo *before* becoming a submodule. Submodules point to remote repos, not local directories.

See Quickstart Guide for exact commands and README template.

### 2. Remove local, add as submodule

After pushing:

1. `cd` back to parent (`~/code/lossless-monorepo/astro-knots/`)
2. `rm -rf` the local site directory
3. Add the newly-created GitHub repo as a git submodule: `git submodule add https://github.com/lossless-group/<site-name>.git sites/<site-name>`
4. `git submodule update --init sites/<site-name>`

Now the site lives as a submodule under `astro-knots/sites/`.

### 3. Configure no-true-monorepo expectations

**Critical:** the site must deploy independently from its own repo. Do NOT let it become dependent on the parent workspace.

- **Add to `pnpm-workspace.yaml`** for development convenience only: `- sites/<site-name>`
- **Do NOT use `workspace:*` dependencies** in the site's `package.json` — sites install published packages (like `@lossless-group/lfm`) from registries, not from the workspace
- **Every site has its own `pnpm-lock.yaml`** at the site root (in addition to the parent monorepo's lockfile). The parent's lockfile is invisible to a standalone clone, so without a site-local one, every Vercel deploy fails with `Headless installation requires a pnpm-lock.yaml file`. Generate it with `pnpm install --ignore-workspace --lockfile-only` from the site directory and commit it. Step 12 covers the full deploy-config dance.
- Verify the site can `pnpm install --ignore-workspace && pnpm build` from its own directory alone, without the parent.

See the "Site Independence Model" section in `astro-knots/CLAUDE.md` for the full rationale.

### 4. Scaffold: `pnpm create astro@latest`

Inside the site directory (now a submodule):

```bash
cd sites/<site-name>
pnpm create astro@latest .
```

Always `@latest` unless explicitly told otherwise (has never happened). Choose template based on project needs (typically "Empty" or "Blog" for content-heavy sites).

### 5. Install Tailwind: `tailwindcss@latest`

Astro Knots is Tailwind-first. Install immediately after scaffold:

```bash
pnpm astro add tailwind
```

This installs Tailwind and configures `astro.config.mjs`.

### 6. Install LFM: `@lossless-group/lfm` from JSR

Immediately after Tailwind:

```bash
pnpm add @lossless-group/lfm
```

**Why immediately:** LFM is the markdown processing backbone for all Astro-Knots content. Installing it early signals intent and avoids the "oh we should have used LFM" realization three weeks in.

Even if the site won't have markdown-heavy content initially, the package install is cheap and the import is lazy. Better to have it than retrofit later.

See `ecosystem.md` for LFM capabilities and the `@lossless-group/lfm` README for usage.

### 7. Ask for most recent project — identify scaffold reference

Before inventing structure, **ask the user which recent project to reference**. Common answers:

- `mpstaton-site` — most recent LFM consumer, Context-V rendering
- `cilantro-site` — strong reference for config, SEO, content collections
- `twf_site` — cleanest LFM + markdown rendering, includes `parseContent` utility
- `hypernova-site` — canonical three-mode switcher (light/dark/vibrant)
- `dark-matter` — most expansive design-system catalog

Copy relevant directory structure (`src/components/`, `src/layouts/`, `src/pages/`, `public/`) and initial config files (`astro.config.mjs`, `tailwind.config.mjs`, `tsconfig.json`) from the reference.

**Don't blindly copy everything** — reference sites have drift. Ask which parts to copy.

### 8. Ask for theme/modes reference docs — improvise or codify

Ask the user:

1. **Do you have hard theme/brand decisions?** (color palette, fonts, logo)
   - If yes: point to Figma, brand guidelines, or reference site
   - If no: **enter improvise mode** (see below)

2. **Which sites best exemplify the three-modes (light/dark/vibrant) pattern?**
   - Likely answer: `hypernova-site` for the switcher utilities
   - May also reference `cilantro-site` or `twf_site` for token structure

3. **Should we analyze a reference site's code for tokens/theme?**
   - Often yes — inspect `src/styles/theme.css` and `tailwind.config.mjs` from the reference

**Improvise mode (common):**
- No Figma designs = agent improvises in Tailwind before hard decisions
- Start with Tailwind utilities directly in components
- User reviews, iterates, says "that works"
- **Once styling stabilizes and user is satisfied, codify:** extract to two-tier token system

**Soft rule:** anything going to production should eventually follow Lossless frontend design-system standards (two-tier tokens, theme.css, mode switcher). But improvisation before codification is normal.

**Critical: Vibrant mode must be visually distinct from light mode**  
A recurring setup error: vibrant mode inherits light mode colors and looks identical. Vibrant mode is **dark-based** (like dark mode), not light-based. See "Vibrant Mode Implementation" below.

### 9. Two-tier token system — named + semantic

When theme/brand decisions solidify (or immediately if they're known):

**Tier 1: Named tokens** (raw values, private, BEM-ish `__` separator)
```css
:root {
  --color__blue-azure: #1f7ae0;
  --color__cyan-bright: #06b6d4;
  --color__violet-deep: #7c3aed;
  --color__lime-terminal: #84cc16;
  --color__slate-950: #020617;
  --color__white: #ffffff;
  --font__lato: 'Lato', system-ui, sans-serif;
}
```

**Tier 2: Semantic tokens** (system layer, kebab-case, reference named via `var()`)
```css
.theme-default {
  --color-primary: var(--color__blue-azure);
  --color-accent: var(--color__lime-terminal);
  --font-body: var(--font__lato);
}
```

**Why two tiers:**
- Named tokens = raw named values the client chose
- Semantic tokens = how the system uses them (components only ever read semantic)
- Client iteration = change named token value or re-point semantic token, components don't change

**Tailwind v4 only generates utilities for kebab-case tokens** — the semantic tier must stay kebab-case.

**Mode-specific semantic tokens:**  
Each mode (`[data-mode="light"]`, `[data-mode="dark"]`, `[data-mode="vibrant"]`) redefines semantic tokens for its context. Components read `var(--color-surface)`, which resolves differently per mode.

Full spec: `astro-knots/context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md` §2.1.

### 9a. Vibrant Mode Implementation (Critical)

**The error:** Setting vibrant mode to just override a couple tokens like `--fx-glow-opacity` causes it to inherit light mode's surface/text colors, making light and vibrant indistinguishable.

**The pattern (per fullstack-vc reference):**

Vibrant mode is **dark-based**, not light-based. It's "dark mode but louder."

```css
[data-mode="vibrant"] {
  /* Dark background like dark mode */
  --color-background: var(--color__black);
  --color-surface: color-mix(in srgb, var(--color__violet-deep) 20%, var(--color__slate-950));
  --color-text: var(--color__white);
  --color-text-muted: color-mix(in srgb, var(--color__cyan-bright) 60%, var(--color__white));
  --color-border: var(--color__blue-azure);  /* neon borders */
  
  /* Effect tokens — maximum intensity */
  --fx-glow-opacity: 0.55;  /* vs 0.22 in dark, 0.06 in light */
  --fx-glow-spread: 48px;   /* vs 24px in dark, 8px in light */
  
  /* Multi-color neon gradients */
  --fx-headline-gradient: linear-gradient(
    120deg,
    var(--color__lime-terminal) 0%,
    var(--color__cyan-bright) 40%,
    var(--color__blue-azure) 70%,
    var(--color__violet-deep) 100%
  );
  
  /* Glassmorphic card shadows with color-mix */
  --fx-card-shadow:
    0 0 0 1px color-mix(in srgb, var(--color__blue-azure) 50%, transparent),
    0 0 24px color-mix(in srgb, var(--color__blue-azure) 30%, transparent);
}
```

**Key vibrant characteristics:**
- **Dark background** (black or deep slate, not white)
- **Glassmorphic surfaces** using `color-mix()` with transparency
- **Neon borders** (bright accent colors, not muted grays)
- **Multi-stop gradients** (4+ colors: lime → cyan → blue → violet)
- **High glow/shadow opacity** (0.5+, not 0.1)
- **Large glow spread** (40px+, not 8px)

**Reference implementation:** `sites/fullstack-vc/src/styles/theme.css` lines 90-130.

**Verify vibrant works:**
1. Toggle to vibrant mode
2. Background should be **dark** (not white)
3. Borders should be **neon bright** (not gray)
4. Headline gradient should be **multi-color** (not subtle two-color)
5. Light and vibrant should be **obviously different** at a glance

### 10. Content collections: immediately only `changelog/`

The only content collection required at setup is **`changelog/`**.

1. Create `src/content/config.ts`
2. Define `changelog` collection with the Lossless frontmatter schema (see `changelog-conventions` skill)
3. Create `changelog/` directory structure

**Why immediately:** the `changelog/` enforces the "ship and log" habit from day one. Without it, developers ship work and forget to document.

**Other collections:** user may anticipate more (blog posts, case studies, docs). Ask for reference — typically `mpstaton-site` (Context-V rendering) or `cilantro-site` (SEO-optimized collections). But project-specific collections happen during development, not setup. Don't invent them prematurely.

Load the `changelog-conventions` skill for the full format (`publish`, `lede`, ISO dates, filename pattern).

### 11. Early structure enforcement: `/changelog`, `/brand-kit`, `/design-system`

If the scaffold doesn't include these three surfaces, **discuss with user and impose early**:

- **`changelog/`** — content collection (covered in step 10)
- **`src/pages/brand-kit/`** — stakeholder-facing brand reference (colors, typography, marks, signature layouts)
- **`src/pages/design-system/`** — developer-facing component catalog (exhaustive, with variants/props/CSS contracts)

Both pages must:
- Use `BaseThemeLayout` (or equivalent — preserves theme/mode toggle)
- Render correctly in all three modes (light/dark/vibrant)
- Emit `<meta name="robots" content="noindex, nofollow" />` (internal-only)

**Why early:** these surfaces decay if added late. Adding them at setup nudges maintenance as a habit.

**Canonical references:**
- Brand Kit: `hypernova-site/src/pages/brand-kit/`, `twf_site/src/pages/brand-kit/`
- Design System: `dark-matter/src/pages/design-system/` (most expansive sub-page structure)

Full conventions: `astro-knots/context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions.md`.

### 12. Deploy config: Vercel adapter, JSR `.npmrc`, site-local lockfile, `vercel.json`, `.gitattributes`

Before first deploy:

**Vercel adapter + dependencies:**
```bash
pnpm astro add vercel
```

This installs `@astrojs/vercel` and configures `astro.config.mjs`.

**`.npmrc` (JSR registry — public, no auth):**
```
@jsr:registry=https://npm.jsr.io
```

That's the entire file. JSR is the canonical registry for Lossless packages — it's public and requires no token. Install `@lossless-group/*` packages with the `jsr` CLI:

```bash
pnpx jsr add @lossless-group/lfm
```

This rewrites the dep in `package.json` to `"@lossless-group/lfm": "npm:@jsr/lossless-group__lfm@^x.y.z"` (the JSR npm-compat scope). Imports stay the same: `import { parseMarkdown } from '@lossless-group/lfm'`.

> ⛔ **Do not** use `@lossless-group:registry=https://npm.pkg.github.com` with a `GITHUB_TOKEN`. The GitHub Packages path requires a Vercel env var, fails on fresh CI clones, and contradicts the astro-knots playbook. Always JSR.

**Site-local `pnpm-lock.yaml` (mandatory — sites must deploy independently):**

Pseudomonorepo sites are deployed from their own GitHub repo, not from the parent monorepo. Vercel clones just the site repo, so it needs `pnpm-lock.yaml` at the **site root**. The parent workspace's lockfile (at the monorepo root) isn't visible to a standalone clone.

After scaffolding, before first deploy:

```bash
cd sites/<site-name>
pnpm install --ignore-workspace --lockfile-only
git add pnpm-lock.yaml
```

- `--ignore-workspace` tells pnpm to treat this site as standalone (instead of looking up to the parent workspace and using its lockfile).
- `--lockfile-only` writes `pnpm-lock.yaml` without touching `node_modules`.

Commit `pnpm-lock.yaml`. Without it, the first Vercel deploy fails with `ERROR Headless installation requires a pnpm-lock.yaml file`.

**This is a recurring foot-gun.** Every Astro Knots site has its own `pnpm-lock.yaml` at the site root, in parallel with the parent monorepo's lockfile. Both are maintained.

**`vercel.json` (force pnpm, frozen lockfile):**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build"
}
```

Without this, Vercel may auto-detect the wrong package manager and fall back to `npm install`, which doesn't honor `pnpm-lock.yaml` and fails differently. Pinning is non-negotiable: **frozen lockfile, always.**

**`.gitattributes` (for genuinely large assets only — videos):**
```
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.mov filter=lfs diff=lfs merge=lfs -text
```

> ⛔ **Do NOT route `*.png`, `*.jpg`, `*.jpeg`, or `*.webp` to Git LFS.** Vercel does **not** pull LFS objects during build — deploys will silently serve 131-byte LFS pointer files in place of the real images. The OG image will fail to unfurl on every social platform; favicons and on-page assets will appear missing or broken. The validator at metatags-validator reports this as `The OG Image URL appears to be invalid or unreachable`. Verified 2026-05-04 on reach-edu-hub.
>
> Keep images out of LFS unless the asset is >5MB and rarely changes. OG images, favicons, headshots, screenshots — all stay as regular git blobs. If you must use LFS for video, fine; for raster images, never.

To recover from a site that already has images in LFS:

```bash
# Drop the patterns from .gitattributes (keep mp4/mov if you want)
# Then re-stage all affected files per the new attributes
git add .gitattributes
git add --renormalize public/
git commit -m "fix(deploy): pull image assets out of Git LFS"
git push
```

`git add --renormalize` rewrites the index using current `.gitattributes`, so existing LFS-tracked files become real git blobs in the next commit. Verify with `git show :path/to/image.png | head -c 8 | xxd` — should show the PNG header `89 50 4e 47`, not `version https://git-lfs.github.com`.

**`.env.example` and `.env`:** projects have similar-but-differing needs. Create stubs at setup, fill during development. Typical vars: `PUBLIC_SITE_URL`, `PUBLIC_BRAND`, feature flags. **Do not** add `GITHUB_TOKEN` — JSR is public, no auth needed.

See Quickstart Guide for full file templates.

## What's NOT in scope for setup

**Don't invent these at setup** — they happen during development:

- Project-specific content collections (blog, case studies, docs)
- Complex component libraries (beyond baseline layout/typography)
- API integrations or server endpoints
- Full LFM component suite (AstroMarkdown, Sources, Callout, CodeBlock) — copy these when markdown rendering is actually needed
- OG image generation, advanced SEO, sitemap config

Setup nudges conventions. Development builds features.

## Cross-references

- **Executable commands, file templates, narrative:** `astro-knots/context-v/prompts/New-Site-Quickstart-Guide.md` (in the monorepo)
- **Site independence model:** `astro-knots/CLAUDE.md` § "Site Independence Model"
- **Two-tier token system:** `astro-knots/context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md` §2.1
- **Brand Kit + Design System conventions:** `astro-knots/context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions.md`
- **Changelog format:** `changelog-conventions` skill
- **LFM capabilities:** `ecosystem.md`, `@lossless-group/lfm` README
- **Spec-first workflow:** `context-vigilance` skill, `references/developing-a-spec.md`

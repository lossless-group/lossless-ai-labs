---
from: "dididecks-ai"
from_path: "context-v/agent-skills/astro-knots/references/playbooks/github-pages-deploy.md"
---

# Playbook: Deploying to GitHub Pages

Free, per-repo deploy target for splash pages and other low-traffic Lossless sites — distinct from Vercel deploys (which most production sites use). Follows the "splash page per repo" habit at `lossless-monorepo/context-v/habits/Maintain-a-Github-Splash-Page-for-each-Repo.md`.

**Use this playbook when:**
- A repo wants its own free landing page on `lossless-group.github.io/<repo>/`
- The site is a splash that should rebuild on push to `main` (or `master` if that's the publication branch)
- The Astro app lives at a subpath inside the repo (typically `splash/` or `apps/<site-name>/`), not the repo root

## The workflow shape

A canonical GitHub Pages deploy workflow at `.github/workflows/<name>.yml`:

```yaml
name: Deploy <site-name> to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'splash/**'                    # or apps/<site>/** — limit triggers
      - '.github/workflows/<name>.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: splash       # or apps/<site>
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive          # critical for content-rollup loaders
          fetch-depth: 1

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: splash/pnpm-lock.yaml

      - run: pnpm install --frozen-lockfile=false
      - run: pnpm build

      - uses: actions/configure-pages@v5
        with:
          enablement: true               # ← required, see Gotcha 1

      - uses: actions/upload-pages-artifact@v3
        with:
          path: splash/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Reference workflows in the tree:

- `lossless-monorepo/content-farm/.github/workflows/pages.yml` — content-farm splash, pnpm + Astro
- `lossless-monorepo/ai-labs/memopop-ai/.github/workflows/deploy-site.yml` — memopop-site, bun + workspace filter

## astro.config.mjs base path

GitHub Pages serves the repo at `https://<org>.github.io/<repo>/`. The Astro site's `base` must match:

```js
export default defineConfig({
  site: 'https://lossless-group.github.io',
  base: '/<repo>/',                       // e.g. '/content-farm/'
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
```

If a custom domain ever gets added (via `public/CNAME`), set `site` to that domain and `base` to `/`.

## The three gotchas (and the order to fight them)

These bite in setup-time order. Hit them all on every new repo until the team automates them.

### Gotcha 1: Pages not provisioned yet → `Get Pages site failed` 404

**Symptom:** First workflow run fails inside the `Configure Pages` step with `Error: Get Pages site failed. ... Not Found - https://docs.github.com/rest/pages/pages#get-a-apiname-pages-site`.

**Cause:** `actions/configure-pages` queries an existing Pages site for the repo. On a brand-new repo, that site doesn't exist yet and the API returns 404.

**Fix:** Add `enablement: true` to the `configure-pages` step (already in the canonical workflow above). On first run it self-provisions; subsequent runs reuse the existing site.

### Gotcha 2: `Branch "main" is not allowed to deploy to github-pages due to environment protection rules`

**Symptom:** The `deploy` job fails with that exact message, even though `main` is where the workflow runs.

**Cause:** GitHub auto-creates a `github-pages` environment with a default protection rule that limits deploys to the **repository's default branch**. If `master` is still the default, `main` can't deploy.

**Fix — pick one:**

- **(A) Allow `main` in the environment:** Settings → Environments → `github-pages` → "Deployment branches and tags" → "Add deployment branch or tag rule" → enter `main`. Optionally also `master`.
- **(B) Change repo default branch to `main`:** Settings → Branches → switch default to `main`. More invasive — affects PR base branches, branch protection rules, contributor expectations.

Pick (A) by default. Pick (B) only as part of an explicit "rolling out the dev → main → master tier model across all Lossless repos" pass. Both work.

### Gotcha 3: Pages Source still set to "Deploy from a branch"

**Symptom:** Settings → Pages shows a Branch dropdown (e.g. `master`) and a Folder dropdown (`/ (root)` or `/docs`), with a Jekyll-theme link. The workflow runs but Pages serves something else (or 404).

**Cause:** Pages was previously configured with the legacy "build from branch" mode, which conflicts with GitHub Actions deploy.

**Fix:** Settings → Pages → scroll up to **"Build and deployment"** → **Source** dropdown → switch from "Deploy from a branch" to **"GitHub Actions"**. The branch+folder pickers disappear and a workflow-status panel takes their place.

This one is sneakily easy to miss because the screen-real-estate the legacy mode uses *looks like* the configuration UI you want to be in.

## Setup checklist (in order)

1. Add the canonical workflow file to the repo. Push to a branch that triggers it (or `workflow_dispatch`).
2. **Watch the first run fail** at `Configure Pages` if you forgot `enablement: true`. Add it. Push again.
3. **Watch the deploy fail** with "environment protection rules" if `main` isn't the default branch. Apply Gotcha 2's fix.
4. **Visit Settings → Pages and confirm Source is "GitHub Actions"**, not "Deploy from a branch". Apply Gotcha 3's fix if needed.
5. Re-run the workflow (Actions tab → workflow → "Run workflow" → branch → Run, or push any commit to the trigger branch).
6. Watch it deploy. Visit `https://<org>.github.io/<repo>/`.

Each repo pays this setup tax once. After that, the workflow handles itself.

## Verification

- **Workflow runs** at `https://github.com/<org>/<repo>/actions`
- **Deploy URL** appears as a deployment under the workflow run's `deploy` job
- **Live site** at `https://<org>.github.io/<repo>/` (matches your `astro.config.mjs` `base`)
- **Settings → Pages** shows "Your site is live at ..." with a green checkmark

## What this playbook is not

- Not for Vercel deploys (covered in `new-site-setup.md` step 12)
- Not for repos that need server-side rendering or runtime APIs — GitHub Pages is static-only
- Not for high-traffic sites — Pages has bandwidth limits; promote to Vercel when traffic warrants

## Cross-references

- `references/playbooks/new-site-setup.md` — the broader 12-step new-site flow (Vercel-default deploy)
- `pseudomonorepos/references/content-rollup.md` — how splash sites should aggregate child repos' content via the GitHub Content API at build time
- `lossless-monorepo/context-v/habits/Maintain-a-Github-Splash-Page-for-each-Repo.md` — the habit this playbook serves
- `changelog-conventions` skill — what the rendered `/changelog` page expects to find

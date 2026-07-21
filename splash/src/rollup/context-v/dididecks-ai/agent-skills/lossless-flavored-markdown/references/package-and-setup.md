---
from: "dididecks-ai"
from_path: "context-v/agent-skills/lossless-flavored-markdown/references/package-and-setup.md"
---

# LFM Package & Setup

Installing `@lossless-group/lfm`, choosing between GitHub Packages and JSR, configuring `remarkLfm`, and the trigger-map override pattern. Read this when adding LFM to a new site or upgrading it.

## The two packages

| Package                       | What it does                                                | Required?                  |
| ----------------------------- | ----------------------------------------------------------- | -------------------------- |
| `@lossless-group/lfm`         | The remark plugin and AST normaliser                        | Yes                        |
| `@lossless-group/lfm-astro`   | Astro integration — wires the plugin and ships components   | Yes for Astro Knots sites  |

For non-Astro consumers (rare; e.g. a Svelte/Solid site), use `@lossless-group/lfm` directly with your `unified` pipeline and ship your own components.

## JSR is the canonical registry

LFM is published to **[JSR](https://jsr.io)** as `@lossless-group/lfm` and `@lossless-group/lfm-astro`. JSR is the public, no-auth-required path that downstream sites and apps consume. **Default to JSR for any new install.** GitHub Packages is a secondary mirror retained for internal-only Lossless consumers that already have tokens configured — not the recommended path.

### Install from JSR (recommended)

```bash
pnpm dlx jsr add @lossless-group/lfm
pnpm dlx jsr add @lossless-group/lfm-astro
```

Or in `package.json` directly:

```json
{
  "dependencies": {
    "@lossless-group/lfm":       "npm:@jsr/lossless-group__lfm@^0.x",
    "@lossless-group/lfm-astro": "npm:@jsr/lossless-group__lfm-astro@^0.x"
  }
}
```

(The `npm:@jsr/…` syntax is JSR's npm-compat shim. `pnpm dlx jsr add` writes it for you.)

JSR install needs no auth tokens, no `.npmrc`, no GitHub credentials. Open-source contributors can clone a downstream site and `pnpm install` immediately.

### GitHub Packages (mirror — internal use only)

Only reach for this when working inside the Lossless private toolchain that already requires a GitHub token, *and* JSR is unsuitable for some reason. For everything else, JSR.

```bash
# .npmrc at repo root
@lossless-group:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

```bash
pnpm add @lossless-group/lfm @lossless-group/lfm-astro
```

Token needs `read:packages` scope.

## Astro integration

### Minimum config

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import lfm from '@lossless-group/lfm-astro';

export default defineConfig({
  integrations: [lfm()],
});
```

### Full config (annotated)

```js
import { defineConfig } from 'astro/config';
import lfm from '@lossless-group/lfm-astro';

export default defineConfig({
  integrations: [
    lfm({
      // Trigger-map sources, layered (later overrides earlier)
      triggers: [
        '@lossless-group/lfm/triggers/default.yaml',  // built-ins (always first)
        'src/config/lfm-triggers.yaml',                // site-specific
      ],

      // Variants
      variants: 'src/config/lfm-variants.yaml',
      strictVariantAttributes: 'error',  // 'error' | 'warn' | 'silent'

      // Build-time OG fetch (for popovers, link previews, citations)
      ogFetch: {
        enabled: true,
        timeout: 5000,           // 5s — never bump above 10s
        maxConcurrent: 10,
        cacheDir: '.lfm-cache/',
        cacheTtl: '7d',
        userAgent: 'lfm/1.x (+https://lossless.group)',
        fallback: 'graceful',    // missing OG → render link without preview
      },

      // Citation system
      citations: {
        format: 'hex',           // 'hex' (recommended) | 'numeric' (legacy)
        sourceCatalogue: 'src/content/sources/*.md',  // optional
      },

      // Code-fence syntax highlighting (Shiki)
      shiki: {
        theme: 'catppuccin-frappe',
        // …or themes: { light: 'github-light', dark: 'github-dark' }
      },

      // Mermaid (auto-render fenced ```mermaid blocks)
      mermaid: { enabled: true, theme: 'forest' },

      // Wikilinks (Beta)
      wikilinks: {
        enabled: true,
        collections: ['posts', 'sources'],   // resolve against these
        unresolved: 'warn',                   // 'warn' | 'error' | 'silent'
      },
    }),
  ],
});
```

## The trigger-map override pattern

The trigger map is a layered config. The package ships defaults; sites override only what they need.

### `@lossless-group/lfm/triggers/default.yaml` (built-in, never edit)

Defines the ~20 stable triggers (callout, link-preview, image, etc.). Treat as read-only.

### `src/config/lfm-triggers.yaml` (site-specific)

Add new triggers, override built-ins, or disable them:

```yaml
triggers:
  # Add a new component
  - name: pricing-table
    syntax:
      - pattern: ':::pricing-table{$attrs}\n$children\n:::'
    component: PricingTable
    component_path: src/components/lfm/PricingTable.astro
    props:
      tiers: { required: true, type: number }

  # Override a built-in's component (e.g. swap the default Callout)
  - name: callout
    component_path: src/components/lfm/CustomCallout.astro
    # syntax and props inherited from default.yaml

  # Disable a built-in (rare)
  - name: card-carousel
    enabled: false
```

The override semantics:

- **Identity match** by `name`. A site entry with the same `name` as a built-in *replaces* the built-in (not merges, unless you use the explicit `extends:` pattern).
- **`extends:`** lets a site entry layer onto the built-in:

```yaml
- name: callout
  extends: '@lossless-group/lfm:callout'   # explicit reference to the built-in
  component_path: src/components/lfm/CustomCallout.astro
  # everything else (syntax, props) inherited
```

## CLI commands

```bash
# Validate the trigger map and frontmatter against schemas
pnpm lfm:check

# Pre-build OG cache (useful before a deploy)
pnpm lfm:fetch-og

# Validate citation hex codes (uniqueness, format)
pnpm lfm:check-citations

# Render a single file to HTML for preview
pnpm lfm:render src/content/posts/some-article.md
```

These are exposed via `@lossless-group/lfm-astro`'s package scripts. If they're not available, your version is stale — upgrade.

## Upgrading

LFM follows semver-ish versioning (the four-part `epoch.major.minor.patch` for the *spec*; standard semver for the package).

```bash
# Minor / patch — usually safe
pnpm update @lossless-group/lfm @lossless-group/lfm-astro

# Major / epoch — read the changelog first
cat node_modules/@lossless-group/lfm/CHANGELOG.md
```

The package's `CHANGELOG.md` follows the [changelog-conventions skill](../../changelog-conventions/) — `publish: true`, `lede`, ISO dates, etc.

## Co-developing LFM itself

When you (the agent or team member) are working *on* LFM rather than just consuming it, the source lives at:

```
lossless-monorepo/astro-knots/packages/lfm/         # the remark plugin / parser
lossless-monorepo/astro-knots/packages/lfm-astro/   # the Astro integration
```

If the team has graduated LFM to its own repo by the time you read this, check `astro-knots/CANDIDATES.md` or the lossless-skills `README.md` for the new home.

### Local development workflow

```bash
# In astro-knots/
pnpm install                 # workspace-aware
pnpm --filter @lossless-group/lfm build
pnpm --filter @lossless-group/lfm test
pnpm --filter @lossless-group/lfm-astro build

# Run the docs/playground site against the local package
pnpm --filter astro-knots-playground dev
```

The workspace `pnpm-workspace.yaml` already points at `packages/*` so the playground / consumer sites resolve `@lossless-group/lfm` to the in-tree source. No `pnpm link` dance.

### Testing changes against an external site

For consumers outside the workspace (e.g. a separate `lossless-monorepo/some-site` repo):

```bash
# Build a JSR tarball locally
cd astro-knots/packages/lfm
pnpm dlx jsr publish --dry-run --allow-dirty   # validate
pnpm pack                                        # tarball

# In the consumer site
pnpm add file:/path/to/lossless-group-lfm-0.x.tgz
```

Avoid `pnpm link --global` for cross-repo testing — it introduces version-resolution surprises that JSR-installed users won't hit.

## Publishing (maintainers only)

LFM publishes to JSR first, GitHub Packages second (mirror).

1. Bump `version` in `packages/lfm/jsr.json`, `packages/lfm/package.json`, and the matching `lfm-astro` files. Keep them in lockstep.
2. Add a `changelog/` entry in `astro-knots/changelog/` (or the LFM repo's own `changelog/` once it spins out) following the [changelog-conventions skill](../../changelog-conventions/) — `publish: true`, `lede`, ISO dates, etc.
3. Run the full validation suite:
   ```bash
   pnpm --filter @lossless-group/lfm test
   pnpm --filter @lossless-group/lfm build
   pnpm dlx jsr publish --dry-run
   ```
4. Tag and push:
   ```bash
   git tag lfm-vX.Y.Z
   git push --tags
   ```
5. CI publishes to JSR on tag push. The GitHub Packages mirror runs after JSR succeeds.

For hotfixes when CI is broken, manual publish:

```bash
pnpm dlx jsr publish        # JSR — no auth, signed via OIDC in CI; locally needs jsr login
pnpm publish                # GitHub Packages mirror
```

## Troubleshooting

| Symptom                                      | Likely cause                                          | Fix                                                       |
| -------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| `401 Unauthorized` from `npm.pkg.github.com` | Missing or expired GitHub token                       | Check `.npmrc` and `GITHUB_PACKAGES_TOKEN` env var       |
| Build hangs for 30+ seconds                  | OG fetch timeout too high                             | Drop `timeout` to 5000 in `ogFetch` config                |
| Popovers empty                               | OG fetch disabled or cache-miss without network       | Run `pnpm lfm:fetch-og` to pre-populate                   |
| Variant attribute typo passes silently       | `strictVariantAttributes: 'silent'`                   | Set to `'error'` in CI config                             |
| Wikilinks 404                                | Target collection not in `wikilinks.collections`      | Add the collection name to the array                      |
| Mermaid blocks render as code                | `mermaid.enabled: false` or Mermaid.js not loaded     | Enable in config; check the integration is included       |

---
title: "Clear the Splash's Dependabot Alerts, 2026-11-21"
lede: "52 open alerts, all in the splash. Six were real and are fixed. The other 46 were fixed on November 1 and GitHub never noticed."
publish: true
date_created: 2026-11-21
date_modified: 2026-11-21
date_authored_initial_draft: 2026-11-21
date_authored_current_draft: 2026-11-21
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: In-Progress
tags:
  - Dependency-Security
  - Dependabot
  - Splash
site_uuid: dac85ad2-cfdf-4d1a-a8c9-57434e370308
hex_code: atvkyl
summary: "Triage of the 52 open Dependabot alerts on dididecks-ai as of 2026-11-21, what was fixed on development, and the remaining steps (promote to main, confirm GitHub rescans, dismiss stale alerts if it doesn't). Read before touching splash dependencies or the alert list."
from: "dididecks-ai"
from_path: "context-v/plans/Clear-Splash-Dependabot-Alerts-2026-11-21.md"
---
# Clear the Splash's Dependabot Alerts, 2026-11-21

## Where the alerts are

All 52 open alerts (2 critical, 21 high, 22 medium, 7 low) point at
`splash/package.json` or `splash/pnpm-lock.yaml`. Nothing in `apps/`,
`packages/` or the client sites is flagged. The splash is a static GitHub
Pages build, so the server-side Astro issues (SSRF, the image endpoint,
reflected XSS through request input) never had a running server to attack.
The fix is still worth making, because the build runs in CI with a token.

## Triage

| Group | Alerts | State before this plan | Action |
|---|---|---|---|
| Astro 7.4.4 still vulnerable | #53–56 (fixed in 7.4.5 and 7.4.7) | Real | Upgrade to 7.4.13 |
| fflate 0.7.3 through satori | not yet raised by Dependabot; `pnpm audit` found it | Real | pnpm override to `^0.7.5` |
| Everything else: older Astro, devalue, vite, js-yaml, esbuild, nanoid, postcss, sharp, svgo, smol-toml, source-map-js, zod | 46 alerts | Already fixed by `0452bc2` (2026-11-01), which moved the splash to Astro 7.4.4. The lockfile on every branch has patched versions, and js-yaml and esbuild are no longer in the tree. | Wait for GitHub to rescan, then dismiss what's left |

Why the stale 46 stayed open: GitHub's dependency graph lists **no
manifests** for this repo (GraphQL `dependencyGraphManifests` returns
nothing and the SBOM endpoint returns 404), so pushes aren't rescanned and
fixed alerts never auto-close.

**Cause, found the same day:** the dependency graph was off for this repo, and
the org's default for new repos is off too. Michael turned it on for
dididecks-ai on 2026-11-21. Within minutes GitHub found 10 manifests, closed
the 46 stale alerts, and raised 6 real ones in files it had never read
before (below). Every other lossless-group repo under ai-labs except
lossless-ai-labs also has an empty graph and needs the same switch. It's
free per repo; only the org-wide Advanced Security page is a paid upsell.

## Second round: alerts the rescan surfaced

| Alerts | Where | Fix |
|---|---|---|
| #61, #62 image-size (high, DoS) | `packages/deck-export` via pptxgenjs, which pins `^1.2.1` and never loads it | Override `image-size: ^2.0.3` in a new `packages/deck-export/pnpm-workspace.yaml`. That folder already had its own lockfile; the file makes the override apply there, and the root workspace still lists the package |
| #57, #60 @sveltejs/adapter-vercel (medium) | `apps/frontend` | `^5.10.2` → `^6.3.5`, which still supports SvelteKit 2. Kit `^2.39.5` → `^2.70.4` |
| #58, #59 @sveltejs/kit (low) | `apps/frontend` | **Fixed the same day** by migrating to SvelteKit 3.4 (Vite 8, TypeScript 6, vite-plugin-svelte 7, adapter-vercel 7). See changelog 2026-11-21_03 |

The frontend builds on the new versions. `svelte-check` reports 3 errors
both before and after the bump (`SeoContentPage.svelte` modifiers,
`seo/page.ts` type complexity), so the bump didn't cause them.

## Steps

1. **Done on `development`:** Astro `^7.4.13`. An `fflate: ^0.7.5` override in
   `splash/pnpm-workspace.yaml`, with a comment saying when to drop it.
   Checked with a frozen install on pnpm 10.15 (the version CI uses) and on
   pnpm 12, a clean `pnpm audit`, and a build of 64 pages.
2. **Promote to `main`** so the Pages workflow builds the patched tree. This
   needs Michael's go-ahead, because pushing to `main` deploys.
3. **Check whether alerts close** after the push to `development` (the default
   branch). If #1–52 stay open, open Settings → Code security and turn the
   dependency graph off and on again to force a rescan.
4. **If they still don't close,** dismiss the 46 stale alerts with reason
   `fix_started` and a comment citing `0452bc2` and this plan. Alerts reopen by
   themselves if the vulnerable version comes back.
5. **Prevent a repeat:** turn on Dependabot security updates (currently
   `disabled`), so new advisories arrive as pull requests rather than a
   backlog.

## How not to regress versions

Every change here moves a package forward. Where a dependency pins a
vulnerable version exactly (satori → fflate 0.7.3), the fix is a pnpm
`overrides` entry that forces the patched version across the tree, not a
downgrade of the parent. Each override carries a comment naming the advisory
and when to remove it.

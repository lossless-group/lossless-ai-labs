---
title: "Integrate reach-edu-hub into the shared @dididecks/shell — scroll-UI first, adopting the shell's /scroll/[deck]/[variant] URL convention"
lede: "reach-edu-hub is the one client-site still standing fully outside the shell: it is not in the root pnpm-workspace, carries zero @dididecks/shell references, ships output: 'static' with no auth, and renders three bespoke scroll decks (/story, /story/version-2, /automation) on a locally-ported PageAsDeckWrapper with its own scroll-decks.ts variant registry and seo.ts. Every sibling (chroma-decks, humain-vc-decks, lossless-decks) already consumes the shell as a workspace integration. This plan onboards reach using chroma-decks as the canonical template: join the workspace, add the integration call, author the decks.ts / slides.ts / audits.json contract files, migrate the three decks to the shell's /scroll/[deck]/[variant] routing, and add slot-discovery annotations to the T01–T11 section components — incrementally (scroll-UI through the shell now; the rigid no-JS Play-UI per-slide conversion is deferred to a later pass). The session this plan opens also has two adjacent tracks: build a few new reach decks on the freshly-integrated shell, and push any shell friction the integration surfaces back into apps/deck-shell rather than working it around in reach."
date_authored_initial_draft: 2026-06-29
date_authored_current_draft: 2026-06-29
date_authored_final_draft:
date_first_published: 2026-06-29
date_last_updated: 2026-06-29
at_semantic_version: 0.0.2.0
status: Phases-A-D-Shipped   # scroll-UI integration done + verified 2026-06-29; Phase E (new decks, shell iteration) ongoing
augmented_with: Claude Code (Opus 4.8, 1M context)
category: Plan
tags:
  - Dididecks-Shell
  - Reach-Edu-Hub
  - Client-Site-Onboarding
  - Scroll-UI
  - Shell-Integration
  - Workspace-Wiring
  - Deck-Registry
  - Slot-Discovery
  - URL-Convention-Migration
  - Phase-B-Foundation
authors:
  - Michael Staton
related:
  - "[[Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]]"
  - "[[Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking]]"
  - "[[Init-Chroma-Decks-Client-Site]]"
  - "../../client-sites/humain-vc-decks/context-v/plans/Install-Auth-Surface-from-Calmstorm-Pattern.md"
from: "dididecks-ai"
from_path: "context-v/plans/Integrate-Reach-Edu-Hub-into-Dididecks-Shell.md"
---
# Integrate reach-edu-hub into the shared shell

## Why this plan exists

`reach-edu-hub` is the last client-site under `dididecks-ai/client-sites/` that has
never been wired to `@dididecks/shell`. It is:

- **Not in the root `pnpm-workspace.yaml`** (which lists `chroma-decks`,
  `humain-vc-decks`, `lossless-decks`), so `workspace:*` cannot even resolve the
  shell for it today.
- **Shell-free** — zero references to `@dididecks/shell`, `dididecksShell`, or
  `deck-shell` anywhere in its source.
- **`output: 'static'`, no auth, deliberately public** (the sitemap decision is
  "Gating: none").
- Rendering **three bespoke scroll decks** on a locally-ported
  `PageAsDeckWrapper`, with its own `src/lib/scroll-decks.ts` variant registry and
  `src/lib/seo.ts`, at custom URLs.

The integration follows the proven onboarding shape established by chroma-decks
(the canonical template) and refined by humain-vc-decks. calmstorm-decks is the
*donor* the shell was lifted from and is **not** an integration template (it does
not consume the shell).

## Decisions locked with the user (2026-06-29)

1. **Integration depth:** scroll-UI through the shell *first*. Defer the rigid
   16:9 no-JS Play-UI per-slide-file conversion (deck-iteration-workflow Phase 2)
   to a later pass.
2. **URL strategy:** adopt the shell's `/scroll/[deck]/[variant]` convention
   (migrate off the bespoke `/story`, `/automation` URLs).
3. **Decks to create today:** for reach-edu-hub, on the freshly-integrated shell.
4. **Variant slugs:** `baseline` / `editorial` (not `v1`/`v2`).
5. **distributionTier:** `shared` (the hub is public).
6. **Old→new redirects:** add them (keep any links already shared with Reach alive).
7. **ModeToggle:** keep reach's own for this pass (limit theme-token risk); revisit
   swapping to the shell's later.

## Deck / variant model (current → shell convention)

| Current route        | New shell route               | Deck slug    | Variant slug | Slots      |
|----------------------|-------------------------------|--------------|--------------|------------|
| `/story`             | `/scroll/story/baseline/`     | `story`      | `baseline`   | T01–T09    |
| `/story/version-2`   | `/scroll/story/editorial/`    | `story`      | `editorial`  | T01–T09    |
| `/automation`        | `/scroll/automation/baseline/`| `automation` | `baseline`   | T01–T11    |

## Phase A — workspace + integration wiring

- [x] A1. Added `client-sites/reach-edu-hub` to root `pnpm-workspace.yaml`.
- [x] A2. Added `"@dididecks/shell": "workspace:*"` to reach's `package.json`.
- [x] A3. Added the `dididecksShell({...})` integration to reach's `astro.config.mjs`
      — `client: "reach-edu-hub"`, four registry paths, `distributionTier: "shared"`.
      **Output flipped from `static` → `server`** (see D1 finding below): under
      `static`, the shell's injected-route `getStaticPaths` runs
      `esbuild.transform` inside Astro's bundled prerender context, which has no
      `__filename` and crashes the build. `server` renders the injected routes
      on-demand — the same reason every other consumer uses server output.
- [x] A4. Created reach's standalone-Vercel guards: appended `ignore-workspace=true`
      (+ hoist/peer settings) to `.npmrc`, kept the jsr registry line, and created a
      local `pnpm-workspace.yaml` with `onlyBuiltDependencies: [esbuild, sharp]`.
- [x] A5. `pnpm install` from the monorepo root — 6 workspace projects, shell linked.

## Phase B — contract files

- [x] B1. Authored `src/data/decks.ts` (`DECKS` — `story` + `automation`).
- [x] B2. Authored `src/data/slides.ts` (`SLOTS` for `baseline`, `editorial`,
      `pipeline`). Variant slugs are globally unique to avoid the variant-keyed
      collision (automation's variant is `pipeline`, NOT `baseline`).
- [x] B3. Created `data/audits/slides.json` = `{ "schema": 2, "ranks": {} }`.

## Phase C — migrate scroll pages to shell convention

- [x] C1. Created the three pages at `src/pages/scroll/{deck}/{variant}/index.astro`
      with corrected import depths; deleted the old `/story` + `/automation` route dirs.
- [x] C2. Converted reach's local `PageAsDeckWrapper` into a thin shell re-export
      shim; added `<DeckOverlay--Scroll-UI deckSlug variantSlug />` to each page.
- [x] C3. Added `data-slot`/`data-variant` to all 29 `T0x` section components.
      (For TOC/discovery the manual `slides.ts` map is authoritative — the scanner
      can't see through reach's component imports; these annotations drive the
      in-scroll SlideRankPill IntersectionObserver.)
- [x] C4. Added `redirects` (old URLs + bare `/scroll`, `/scroll/story`,
      `/scroll/automation` deck roots) → canonical variant routes.
- [x] C5. Updated `src/lib/scroll-decks.ts` hrefs, `src/lib/seo.ts` keys, Header
      nav links + active-state detection, and the homepage showcase link.

## Phase D — verify

- [x] D1. Dev server: `/scroll/story/baseline`, `/scroll/story/editorial`,
      `/scroll/automation/pipeline`, `/toc/story`, `/toc/story/baseline` all 200;
      old `/story` + `/automation` 200 via redirect; `/toc/story/baseline` shows
      9 slot rows; scroll overlay + `ddd-deck-wrapper` + `SlideRankPill` + section
      annotations all render. Reach's `theme.css` tokens satisfy the shell chrome
      (it reads `--ddd-*` with fallbacks). **Finding:** `output: 'static'` is
      incompatible with the shell's esbuild-in-prerender path → flipped to `server`.
- [x] D2. `pnpm --filter reach-edu-hub build` clean (server output, Vercel adapter).

## Phase E — adjacent session tracks (post-integration)

- **New reach decks** built as new variants/decks on the integrated shell (content
  specced when we get there).
- **Shell tooling iteration:** any friction this integration surfaces (slot
  discovery without annotations, token-contract gaps, static-vs-server tension)
  gets pushed back into `apps/deck-shell` rather than worked around in reach, and
  noted in [[Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]].

## Risks / watch-items

- **`output: 'static'` + injected `prerender=false` routes.** Siblings use
  `output: 'server'` because of auth; reach has none. Astro's static output with
  the Vercel adapter supports per-route on-demand rendering, so static *should*
  hold. Fallback: flip to `server` (no DB/middleware needed, just SSR-capable).
- **Theme-token contract.** Shell chrome reads `--color-*` / `--ddd-chrome-*`
  tokens. Reach's local `PageAsDeckWrapper` already uses `--color-surface`,
  `--color-border`, `--color-text-muted`, `--color-text`, so `theme.css` likely
  satisfies the contract — audit during D1, don't assume.
- **Slot discovery.** Reach's slides are separate `T0x` component files, not inline
  sections. They must carry `data-slot` / `data-variant` or the TOC comes up empty
  even with `slides.ts` populated.

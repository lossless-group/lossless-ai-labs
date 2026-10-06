---
title: "Generate an HTML Page for Lossless and a Collaborator, Rendered in the AI Labs Splash"
lede: "Step 3 of 3: turn the evidence and the comparison into one splash page. Visual highlights up top, the detailed narrative below."
date_created: 2026-10-03
date_modified: 2026-10-03
date_authored_initial_draft: 2026-10-03
date_authored_current_draft: 2026-10-03
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
semantic_version: 0.0.1.0
tags:
  - Plan
  - Studies
  - Collaborations
  - Splash-Page
  - Astro-Knots
  - Data-Visualization
status: Ready
site_uuid: 3064177b-b68c-4585-a30b-37039811db5b
hex_code: 5cjo3u
publish: true
from: "studies"
from_path: "context-v/plans/Generate-HTML-Page-for-Lossless-and-Collaborator-rendered-in-AI-Labs-Splash.md"
---
# Generate an HTML Page for Lossless and a Collaborator, Rendered in the AI Labs Splash

**Step 3 of 3** in a collaboration study. The method and ground rules are in
[[Explore-Collaborator-Codebases-for-Insights-Comparative-Highlights]]
(`studies/context-v/explorations/`).

| Step | Plan | Depends on |
|---|---|---|
| 1 | Analyze-Harness-like-Evidence-in-Collaborator-Codebase | — |
| 2 | Compare-Contrast-Harness-like-Artifacts-between-Lossless-&-Collaborator | Step 1 output |
| **3** | **Generate-HTML-Page-for-Lossless-and-Collaborator-rendered-in-AI-Labs-Splash** (this) | Steps 1 and 2 output |

## Parameters

| Name | Meaning | Example |
|---|---|---|
| `{collaborator}` | Folder slug under `studies/collaborations/` | `example-app` |
| `{notes}` | Where steps 1 and 2 wrote their output | `studies/collaborations/example-app/` |
| `{public_name}` | How the collaborator appears on the page | `The Collaborator` |
| `{route_slug}` | URL slug for the page | `silo-to-silo-01` |

## Anonymity on the public page (read first)

The splash is a public site, deployed to GitHub Pages on every push to
`main`, `development` or `master`, and indexed by search engines and
`llms.txt`. As with our changelogs, **the rendered page must not identify the
collaborator**:

- Use `{public_name}` everywhere. Never the folder slug, their GitHub
  account, their repo name, a person's name, their product name, or their
  domain.
- Describe their system by kind ("a spoken-assessment app on Firebase"), not
  by name. Strip identifying details from quoted paths and snippets (rename
  folders that carry the product name).
- Don't link to their repo. Don't link to `{notes}` either, since those files
  name them.
- The route and page title use `{route_slug}` and generic words only.
- Lossless projects (augment-it, memopop-ai) are named freely.

## Inputs

- `{notes}/01-Harness-Evidence__{collaborator}.md` (step 1)
- `{notes}/02-Compare-Contrast-Harness-Artifacts__{collaborator}.md` (step 2)
- The splash itself: `splash/README.md`, `splash/DESIGN.md` (the design
  contract), `splash/src/styles/theme.css` (the runtime tokens),
  `splash/src/layouts/BaseLayout.astro` (takes `title` and `description`),
  and `splash/src/pages/studies/index.astro` as the nearest sibling page.

Load the `astro-knots`, `theme-system`, `maintain-design-md` and `dataviz`
skills, plus `artifact-diagramming` for how to draw diagrams that show the
real mechanism.

## The page

Route: `splash/src/pages/studies/collaborations/{route_slug}.astro`, served
at `/lossless-ai-labs/studies/collaborations/{route_slug}/`. Build it as a
cascade from broad to specific, the same four-audience order our changelogs
use:

1. **Hero.** A title and a lede about silo against silo, and two short lines
   on who this is for (us, and them).
2. **The layer map (the centerpiece).** A 2×2: Lossless and `{public_name}`
   across, the developer-agents harness and the in-product-agents harness
   down, with depth shown in each cell. Arrows show the main lesson flowing
   from each side's deep layer to the other side's thin one. A reader who
   sees only this should get the takeaway.
3. **Highlights band.** Step 2's highlights as five to eight cards or stat
   tiles: the biggest lesson each way, then counts per bucket.
4. **The harness maps.** Step 2's side-by-side maps, one per layer, rebuilt
   as visuals: two columns (Lossless and `{public_name}`), with artifacts
   grouped by category and lines joining shared and similar pairs.
5. **The loops, per layer.** Each side's developer loop, then each side's
   in-product generation loop, drawn in parallel so the differences show at
   a glance.
6. **Shape against harness.** Monolith against monorepo, and where the
   instructions and context sit in each.
7. **Shared / Similar / Different / Missing, by layer.** Four sections, each opening
   with a one-sentence summary and a small visual, then the narrative.
8. **Insights and recommendations.** Two clearly separated columns or tabs,
   "For Lossless" and "For `{public_name}`", each with insights then ranked
   recommendations, labelled by layer.
9. **Method and sources.** How the study ran, the date, a link to the
   exploration, and a note that the collaborator is anonymized on purpose.

Above the fold, a reader should get the whole story from visuals and short
text alone. Everything below rewards someone who keeps scrolling.

## Visual rules

- **Use the splash's own design system.** Only tokens from `theme.css`
  (sodium amber, cyan trace, plum signal, the bench neutrals), the
  blueprint-grid backdrop and the mono-forward type. Check all three modes
  (dark "bench", light "field notebook", vibrant).
- **Diagrams as inline SVG**, styled with CSS custom properties so they
  follow the mode toggle. The splash has no Mermaid integration. Don't add a
  runtime one. Either hand-author the SVG, or pre-render step 2's Mermaid at
  authoring time (`npx -y @mermaid-js/mermaid-cli`, not added to
  `package.json`) and then re-theme the result to use tokens. Text inside
  SVGs must stay legible in every mode.
- **No new dependencies.** No React, no JSX, no charting library (the
  `astro-knots` prohibitions apply). Astro components and plain
  CSS, plus a small amount of vanilla JS only if a tab or toggle truly needs it.
- **Phone width works.** Use a 16px side gutter and no horizontal scroll. The
  harness map may stack into one column on narrow screens.
- **Accessible.** Real headings in order. Each SVG gets a `<title>` and a
  description that says what it shows. Color is never the only signal for a
  bucket.

## Wiring

- Add the page to `splash/src/pages/studies/index.astro` as a link in a
  "Collaborations" section (a small hand-maintained list is fine).
- Give it a `title` and `description` through `BaseLayout`. The
  description is the OpenGraph text, so keep it anonymous.
- Leave `llms.txt` and the sitemap alone. They pick the page up on their own.

## Verify

1. `pnpm install` (if needed) and `pnpm build` in `splash/` succeed.
2. Run `pnpm preview`, then check the page in a real browser, with
   Playwright MCP if it's available or a headless Playwright script if not.
   Check the route loads, every section heading is present, every SVG
   renders, the page switches between all three modes, and there's no
   horizontal scroll at 390px. Use accessibility snapshots. Take screenshots
   only to judge layout and theme.
3. **Anonymity check.** Grep the built HTML in `splash/dist/` for the folder
   slug, their GitHub account, their repo name and their product name. There
   must be zero hits.

## Guardrails

- **Don't commit and don't push.** Pushing deploys the page publicly. A
  human reviews the anonymized page first.
- Only touch files under `splash/`. Never edit `{notes}`, the plans, or any
  other project.
- Don't regenerate the splash rollup (`pnpm rollup:sync`). That's a separate,
  deliberate job.

## Done when

- [ ] The page builds and passes every check in Verify.
- [ ] The layer map appears right after the hero, and the highlights,
      harness maps and loops all come before the detailed narrative.
- [ ] Every claim on the page traces back to step 1 or step 2 (no new
      findings invented for the page).
- [ ] The anonymity grep over `dist/` comes back empty.
- [ ] `git status` shows changes only under `splash/`.

**Report back** in under 200 words: the route, the files changed, what the
checks showed, the result of the anonymity grep, and anything that should
look different before it ships.

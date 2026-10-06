---
title: "Prompt: Verify a deck variant plays through the Scroll-UI shell"
lede: "Subagent brief for shell QA: drive the variant's /scroll/ route in a real browser and confirm pagination, counter, mode toggle, rank pill, and responsive layout work, then return pass or a defect list."
publish: false
date_created: 2026-10-02
date_modified: 2026-10-02
date_authored_initial_draft: 2026-10-02
date_authored_current_draft: 2026-10-02
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Draft
tags:
  - Prompt
  - Subagent-Brief
  - Quality-Gate
  - Browser-Drive
  - Scroll-UI
called_by: "[[Remake-Source-Deck-into-Design-Variants]]"
from: "dididecks-ai"
from_path: "context-v/prompts/Verify-Variant-Plays-in-Scroll-Shell.md"
---
# Prompt: Verify a variant plays in the Scroll-UI shell

> Called by: [[Remake-Source-Deck-into-Design-Variants]] (step 5, once per variant, after registry wiring)
> Pattern: browser-drive verification (Playwright MCP preferred), per the repo `CLAUDE.md`

## Role

You are **shell QA**. You prove that the variant works as a deck in the
shell. You do **not** judge whether the design is good; a human does that.
You only read. If something is broken, you report it; you don't fix it.

## Inputs

- `{{CLIENT_SITE}}`, `{{DECK_SLUG}}`, `{{VARIANT_SLUG}}`, the expected slide count
- `{{BASE_URL}}`: the dev server the orchestrator already started (usually `http://localhost:4321`). Don't start your own; parallel servers fight over ports.
- `{{COOKIE_JAR}}`: a curl cookie-jar file holding an authenticated viewer session. Client-sites gate every non-public route behind `src/middleware.ts`, so an unauthenticated request just redirects to `/access`. The orchestrator logs in once and hands you the jar. Use it with `curl -b {{COOKIE_JAR}}`. In a browser, sign in through `/access` instead. **Never print or log the passcode.**

## Click-path (run in this order)

1. `GET {{BASE_URL}}/scroll/{{DECK_SLUG}}/` lists the variant in the chooser.
2. Open `{{BASE_URL}}/scroll/{{DECK_SLUG}}/{{VARIANT_SLUG}}/`. It returns 200, and the console has no errors (a site-wide `/favicon.ico` 404 is a known exclusion).
2b. No shell chrome (the counter at top right, the mode toggle, the rank pill at bottom right) covers variant content. Check the top-right and bottom-right corners of a few slides.
3. The section count in the DOM (`.ddd-deck-content > section`) equals the expected slide count, and the counter reads `1 / N`. The counter is the `SlidePaginator`: read `.ddd-paginator-current` as an `<input>` (`.value`) and `.ddd-paginator-total` as text.
4. Press PageDown (or ArrowDown) N−1 times. The counter advances to `N / N`. The Scroll-UI binds only the vertical keys and doesn't write the hash, so don't test ArrowRight or hash updates here; those belong to Play-UI.
5. Load `#s-3` in a **fresh page**, not with `goto` on the same URL, which is a same-document navigation. The page lands on section 3.
6. Click the mode toggle (`.ddd-mode-toggle`; the cycle is dark → vibrant → light) through each mode. `<html data-mode>` changes, and no section turns unreadable: body text needs at least 4.5:1 contrast, and large display text at least 3:1. Single-mode variants (slides that ignore the toggle) are allowed; note it as an observation, not a fail. Take one screenshot per mode, of slide 1 only.
7. The rank pill (`.dididecks-slide-rank-pill__slot` / `__title`) is present at the bottom right and follows the centered slide.
8. At a 390px viewport, nothing scrolls horizontally (`document.documentElement.scrollWidth <= innerWidth`).
9. After scrolling through every section (images lazy-load), every `<img>` has loaded (`naturalWidth > 0`).
10. `{{BASE_URL}}/toc/{{DECK_SLUG}}/{{VARIANT_SLUG}}/` lists every slot from `slides.ts`.

Shell facts: `@dididecks/shell` resolves to `apps/deck-shell/` (not `packages/`). The scroller is `.ddd-deck-wrapper` (scroll-snap y), not the window, so scroll *it* when lazy-loading images. Computed colors may come back as `oklab()`/`lab()`; parse those before computing contrast, or confirm any flags with a screenshot.

Prefer accessibility snapshots over screenshots, and take screenshots only
for step 6. Try these drivers in order:

1. **Playwright MCP**, if it's loaded in this session.
2. **The Playwright library in `packages/deck-export`**: write a throwaway `.mjs` script in your scratch directory that imports `playwright` from `<dididecks-ai>/packages/deck-export/node_modules/playwright/index.mjs`, loads the cookie jar's session cookie into the browser context (the jar's line starts with `#HttpOnly_`; don't skip it as a comment), and runs the click-path. Run it with `node`. If the bundled browser is missing, launch with `channel: 'chrome'`. Don't add Playwright to the client-site's dependencies.
3. **`curl` only**: cover steps 1, 2, and 10, run a DOM count on the fetched HTML for step 3, and mark steps 4–9 as `NOT-DRIVEN`, not passed.

## Return to the orchestrator

```text
VERDICT: PASS | FAIL | PARTIAL (not driven)
Step results: 1 ✓  2 ✓  3 ✗ (expected 15, found 14: Section__Team missing from index.astro) ...
Defects: <file + one-line fix suggestion each>
Screenshots: <paths>
```

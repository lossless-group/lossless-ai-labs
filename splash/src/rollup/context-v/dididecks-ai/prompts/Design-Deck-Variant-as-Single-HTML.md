---
title: "Prompt: Design a clean-room deck variant as one coherent HTML file"
lede: "Subagent brief for one of N parallel designers: design the whole deck from the extracted content alone, with liberal creativity, as a single HTML + CSS + Tailwind file. No peeking at the original or at sibling variants."
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
  - Clean-Room-Design
  - Scroll-UI
  - Tailwind
called_by: "[[Remake-Source-Deck-into-Design-Variants]]"
from: "dididecks-ai"
from_path: "context-v/prompts/Design-Deck-Variant-as-Single-HTML.md"
---
# Prompt: Design a deck variant as one coherent HTML file

> Called by: [[Remake-Source-Deck-into-Design-Variants]] (step 3, run N times in parallel)
> Next step for the same variant: [[Refactor-HTML-Variant-into-Astro-Scroll-Sections]]

## Role

You are a **deck designer** with a strong point of view, working in a
**clean room**. You get the deck's *content* and nothing about how anyone
else has laid it out. Design the whole deck in one sitting, as one page,
holding the full narrative arc in your head. That is where coherent design
comes from (see the `deck-iteration-workflow` skill, "Holistic before
piecewise").

## Inputs: you may read ONLY these

- `{{CLIENT_SITE}}/src/content/source-decks/{{SOURCE_SLUG}}/slides.json`
- `{{CLIENT_SITE}}/src/content/source-decks/{{SOURCE_SLUG}}/data/*.csv`
- `{{CLIENT_SITE}}/src/assets/source-decks/{{SOURCE_SLUG}}/*` (logos, photos, screenshots: reusable raw material)
- `{{CLIENT_SITE}}/context-v/narratives/Source-Deck-Extraction--{{SOURCE_SLUG}}.md`, for wording, flags, and the observed palette. Not any other narrative file.
- If `{{BRAND_POLICY}}` is `client-brand`: whichever brand source the orchestrator names in your brief (`DESIGN.md`, the extraction's palette, or `theme.css`).
- Your **design seed** from the orchestrator (one sentence of direction; see below)

## Clean-room rules (hard)

You must **not** open, list, or search:

- `inputs/` (the original deck and its renders)
- `layout.md` (the original layout narrative). It sits next to `slides.json`, so don't `ls` or glob that folder; open `slides.json` and `data/` by name.
- `design-drafts/` (other variants' HTML)
- `src/components/scroll/` or `src/pages/scroll/` (other variants' Astro)
- Any scratch or temp folder other than the one the orchestrator assigned you (`{{SCRATCH_DIR}}`). Put every screenshot, test page, and check script there.

Write your draft to its exact path, creating `design-drafts/{{DECK_SLUG}}/` if it's missing, without listing that folder first.

You are not redrawing their deck. You are designing **{{COMPANY}}'s story**
from first principles. The one exception is a variant the orchestrator
explicitly assigns as `faithful`, and it will tell you so.

## Content rules

- `{{CONTENT_POLICY}}` = `verbatim`: keep every headline and body string word for word. You choose layout, hierarchy, and visuals.
- `{{CONTENT_POLICY}}` = `rewrite-ok`: you may rewrite, reorder, merge, split, or cut slides to make the story land.
- **In both modes, facts are locked.** Every number, name, logo, and claim must trace back to `slides.json` or a CSV. Never invent a metric, customer, quote, or team member. If the story needs something the source doesn't have, put in a visible placeholder (`[NEEDS: Series A amount]`) and list it in your report.
- Missing slots (see `missing_slots`) become placeholder sections, clearly marked.

## Design brief

- **Structural numbers are fine.** Slot counters (`03 / 17`), decorative timecodes, and unlabelled chart geometry computed from source values don't count as facts. Anything a reader would take as a claim does.
- **Liberal creativity.** Choose a concept, a type pairing, a rhythm, and a layout vocabulary. Charts, diagrams, big-number moments, and asymmetric grids are all welcome. "Generic SaaS template" is the failure mode.
- **One design seed** comes from the orchestrator (for example "editorial magazine, serif display, lots of white space" or "dark, data-forward, the market-size slide is the hero"). Commit to it. The seeds are different on purpose so the N variants diverge.
- `{{BRAND_POLICY}}` = `client-brand`: use the client's palette, fonts, and logo from `theme.css` / `DESIGN.md`. Layout and composition are still yours.
- `{{BRAND_POLICY}}` = `free`: invent the identity, and document the palette and fonts in the report.
- Turn charts and tables into real visuals built from the CSV data (inline SVG or CSS), not screenshots.

## Technical constraints (they make the next step mechanical)

Write a single file: `{{CLIENT_SITE}}/design-drafts/{{DECK_SLUG}}/{{VARIANT_SLUG}}.html`

- One complete HTML document. Tailwind v4 through the browser build: `<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>`. Put custom CSS in one `<style type="text/tailwindcss">` block, with tokens declared in `@theme { ... }`.
- **One `<section>` per slide**, each with `data-slot="NN"` (the slide's position in *your* deck, after any reordering; report the mapping from source slots) and `data-name="<PascalName>"` (for example `data-name="MarketSize"`). Each section is at least one viewport tall (`min-h-screen`) and laid out responsively. These sections become `Section__<PascalName>.astro` files in the next step.
- Prefer Tailwind utilities. Use the `@theme` tokens (`bg-primary`, `text-accent`) instead of raw hex in class lists.
- Reference images with relative paths into `../../src/assets/source-decks/{{SOURCE_SLUG}}/`, so the draft renders when opened from disk.
- **No JavaScript** except the Tailwind script. No frameworks, no animation libraries. CSS transitions are fine.
- Use HTML entities for typographic punctuation (`&rsquo;`, `&mdash;`), so the text survives any charset.

## Verify

- Open the file in a browser, or drive it with Playwright, if available (`packages/deck-export/node_modules/playwright`, launched with `channel: 'chrome'` if its bundled browsers are missing), at 1440px and 390px wide. Every section renders, and nothing overflows horizontally.
- `grep -c '<section' file` equals the planned slide count.
- Every number in the file's *visible text* appears in `slides.json` or a CSV. Check text nodes, not CSS values, and skip slot counters and frame labels. Spot-check every stat slide.

## Return to the orchestrator

- The variant concept in one line, and a suggested display label (for example "Continuum").
- The slide list: `NN · PascalName · one-line purpose`.
- Every `[NEEDS: ...]` placeholder.
- Any content you cut, merged, or reordered (only under `rewrite-ok`).
- The file path.

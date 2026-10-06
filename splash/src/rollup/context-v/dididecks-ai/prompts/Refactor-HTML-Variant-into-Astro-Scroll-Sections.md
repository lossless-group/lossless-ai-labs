---
title: "Prompt: Refactor a single-HTML deck variant into Astro Section__ components"
lede: "Subagent brief for the Astro engineer role: split one approved HTML draft into Section__<Name>.astro files rendered in order from a single index.astro inside the shell's ScrollDeckPage, without changing how it looks."
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
  - Astro
  - Scroll-UI
  - Refactor
called_by: "[[Remake-Source-Deck-into-Design-Variants]]"
from: "dididecks-ai"
from_path: "context-v/prompts/Refactor-HTML-Variant-into-Astro-Scroll-Sections.md"
---
# Prompt: Refactor an HTML variant into Astro scroll sections

> Called by: [[Remake-Source-Deck-into-Design-Variants]] (step 4, once per variant)
> Input comes from: [[Design-Deck-Variant-as-Single-HTML]]
> Skills to load: `astro-knots` (no React, no JSX-style syntax; see `context-v/reminders/Never-Use-JSX-Syntax.md`), `theme-system`

## Role

You are the **Astro engineer**. A designer handed you one HTML file. Your job
is a **faithful refactor**: the Astro version must look the same as the
draft. You are not redesigning. If something in the draft is broken, fix
the smallest thing that resolves it and note it in your report.

## Inputs

- `{{CLIENT_SITE}}/design-drafts/{{DECK_SLUG}}/{{VARIANT_SLUG}}.html`
- `{{CLIENT_SITE}}/src/styles/global.css` and `theme.css`
- An existing scroll page to copy the wiring from: any `{{CLIENT_SITE}}/src/pages/scroll/*/*/index.astro`
- `{{DECK_SLUG}}`, `{{VARIANT_SLUG}}`

## Outputs

```
{{CLIENT_SITE}}/src/components/scroll/{{DECK_SLUG}}/{{VARIANT_SLUG}}/
├── Section__Cover.astro
├── Section__Problem.astro
├── ...                              # one per <section data-name> in the draft
└── variant.css                      # only if the draft's @theme / custom CSS can't go in Tailwind utilities
{{CLIENT_SITE}}/src/pages/scroll/{{DECK_SLUG}}/{{VARIANT_SLUG}}/index.astro
```

**Do not edit** `src/data/decks.ts` or `src/data/slides.ts`. Other variants
are being refactored in parallel, and the orchestrator does those registry
edits once, at the end. Return the registry entries in your report instead.

## Steps

### Step 1: Split into sections

For every `<section data-slot="NN" data-name="X">` in the draft, create
`Section__X.astro`:

- **The `<section>` element is the component's root.** The shell's scroll-snap and section counter select `.ddd-deck-content > section`, so wrapping it in a `<div>` breaks pagination.
- Keep `data-slot="NN"`, and add `data-variant="{{VARIANT_SLUG}}"`, `data-slot-title`, and `data-slot-slug` (the shell's existing pages carry all four). Placeholder slots for missing source slides get neutral slugs (`placeholder-16`).
- Move the text out of the markup into frontmatter constants at the top of the file (`const headline = "...";`). The markup stays readable and the copy is easy to edit later (Phase 3 of `deck-iteration-workflow`). Write constants in plain Unicode (`—`, `’`), not HTML entities: `{expr}` escapes entities. Use `set:html` only for strings that carry inline markup such as `<em>`.
- Small helper components shared by sections (for example a repeated slide header) may sit in the same folder without the `Section__` prefix.
- Import images with `import { Image } from "astro:assets"` and `import shot from "../../../../assets/source-decks/{{SOURCE_SLUG}}/07-....png"`. Don't use relative `<img src>` strings. `<Image>` adds `width`/`height` attributes, so add `h-auto` to fluid or `aspect-*` images, or they stretch.
- Read CSV-driven visuals from the CSV at build time, or inline the numbers as typed constants with a comment naming the CSV. Never retype numbers by hand without that comment.

### Step 2: Styles

- Tailwind classes copy across unchanged.
- The draft's `@theme` tokens: if the brand source the orchestrator named is `theme.css` itself, map any stray raw hex to the existing token. Otherwise (`free`, or a `client-brand` deck whose palette came from `DESIGN.md` or the extraction because `theme.css` styles the hub), put the variant's tokens in a scoped `variant.css`, keyed off a wrapper attribute (`[data-deck-variant="{{VARIANT_SLUG}}"]`). Never add a free-brand variant's colors to the site-wide `theme.css`.
- Component-specific CSS goes in that component's `<style>` block (Astro scopes it).
- **Scoped-variant pattern** (Tailwind v4): make `variant.css` its own small Tailwind root (`@import "tailwindcss/theme"` and `"tailwindcss/utilities"` with `source(none)`, plus `@source "./"`), declare the variant tokens as `--<variant>-*` variables under `html[data-deck-variant="{{VARIANT_SLUG}}"]`, and expose them as utilities with `@theme inline`. Put `data-deck-variant` on `<html>`: `ScrollDeckPage` has no wrapper attribute, and `html[...]` beats the site's `:root` and `[data-mode]` token blocks.
- **Body styles:** `global.css` styles `html, body` outside any layer, which beats any `@layer base` rule. Leave the variant's body paper, ink, and font rule unlayered (still scoped by the attribute).
- **Fonts:** if the draft uses fonts the site doesn't load, keep the draft's Google Fonts `<link>` in the page `<head>`.

### Step 3: The single index.astro

```astro
---
import "../../../../styles/global.css";
import ScrollDeckPage from "@dididecks/shell/components/ScrollDeckPage.astro";
import Section__Cover from "../../../../components/scroll/{{DECK_SLUG}}/{{VARIANT_SLUG}}/Section__Cover.astro";
import Section__Problem from "../../../../components/scroll/{{DECK_SLUG}}/{{VARIANT_SLUG}}/Section__Problem.astro";
// ...one import per section, in slot order
---
<ScrollDeckPage deckSlug="{{DECK_SLUG}}" variantSlug="{{VARIANT_SLUG}}">
  <Section__Cover />
  <Section__Problem />
  <!-- ... -->
</ScrollDeckPage>
```

Match the existing pages' head and layout wrapper. If they wrap
`ScrollDeckPage` in a layout for `<html>`, `<head>`, and fonts, do the same.
**Leave the classifier on:** don't pass `hideClassifier`, even if the page you
copy from does, because humans rank slides with that pill. Set `defaultMode` to
the mode the design was drawn in.
The render order is the import order; nothing else decides it.

### Step 4: Build check

From `{{CLIENT_SITE}}`: `pnpm exec astro check`, and fix any errors in *your* files. **Don't run `pnpm build`** when the orchestrator says sibling variants are being refactored in parallel: concurrent builds in one site clobber `dist/`. The orchestrator builds once after all of you finish. Client sites run with `output: 'server'`; don't change that.

**Verify:** the number of `Section__*.astro` files equals the number of
`<section>` elements in the draft, and `astro check` reports no errors in your files. The command can exit
non-zero because of errors in other variants, so filter its output by your
paths, and list any errors outside your files in the report.

## Return to the orchestrator

- The list of section files, in slot order.
- A ready-to-paste `VariantRef` for `decks.ts` (`slug`, `label`, `lede`, `status: "draft"`, `lastUpdated`).
- A ready-to-paste `SlotRef[]` for `slides.ts` (`slot`, `title`, `slug`).
- Any visual differences from the draft that you couldn't avoid.

---
title: "Never Use JSX Syntax"
date_created: 2026-08-02
date_modified: 2026-08-02
authors:
  - Michael Staton
semantic_version: 0.0.0.1
status: Signed-Off
tags:
  - Astro
  - Reminder
  - Deck-Iteration
  - Build-Discipline
publish: true
site_uuid: ec061e8f-1b5e-41d3-82cb-057a0b3fb441
hex_code: q8mfvh
date_authored_initial_draft: 2026-08-02
date_authored_current_draft: 2026-08-02
from: "dididecks-ai"
from_path: "context-v/reminders/Never-Use-JSX-Syntax.md"
---
## The rule

**WE NEVER EVER USE JSX SYNTAX.**

The stack is **Astro + Svelte**, never React. Inside `.astro` files this bans:

- `{list.map((x) => <El/>)}` — JSX-element factories in templates
- `.map((x) => { ...; return ( <jsx/> ); })` — block form with logic and a JSX return
- any JSX element expression, `className`, or React-style control flow

## Why this exists

JSX-style `.map`-returns-element in Astro templates is a fragile landmine during
edits. A deck timeline-slide rebuild left the build dead with
`generateRows is not defined` — a dangling variable from a half-swapped `.map`
track — plus a stray `{^` typo. Every time an agent rewrites a slide, the inline
JSX map is where the break creeps in. Ban the pattern, remove the whole class of
bug.

## What to do instead

Render lists **without** inline JSX maps:

1. **Preferred (keeps shell components like `<InlineCitation {...c} />`):**
   destructure the curated rows into named consts in the frontmatter and
   hand-author **explicit static markup** per row.

   ```astro
   ---
   const [uA, uB, uC] = understandRows;
   ---
   <li class="tl-node">
     <span class="tl-model">{uA.model}<InlineCitation {...timelineIdx.get(uA.cite)} /></span>
     <span class="tl-leap">{uA.leap}</span>
     <span class="tl-cost">{uA.cost}</span>
   </li>
   <!-- repeat explicitly for uB, uC -->
   ```

2. **Component-free lists:** build an HTML string and inject with `set:html`.

   ```astro
   ---
   const rowsHtml = rows.map((r) => `<li>${r.model} — ${r.cost}</li>`).join("");
   ---
   <ol set:html={rowsHtml}></ol>
   ```

Curated deck subsets are small (a handful of rows per track), so explicit markup
is cheap and bulletproof — and it doubles as the honest source for the Play-UI
static-HTML counterpart.

## Gotcha: `set:html` content does NOT get Astro's scoped styles

Elements injected via `set:html` are raw HTML strings — they never receive
Astro's per-component scope hash, so a normal scoped `<style>` rule (`.tl-node {}`)
will **not** match them and the injected markup renders unstyled. This burned a
whole rework pass once.

Fix: style injected content with **`<style is:global>`**, and namespace every
selector under a page-unique ancestor (the slide's section class or `id`, e.g.
`#s06 .tl-node { … }`). Each deck is its own page, so a page-unique prefix cannot
leak to other decks. Template elements (the wrappers you actually wrote in the
template) still take normal scoped styles; only the `set:html` descendants need
the global block.

## Related

- Deck iteration: `deck-iteration-workflow` skill; Scroll-UI vs Play-UI split.
- Global memory: `never-use-jsx-syntax` (do not delete).

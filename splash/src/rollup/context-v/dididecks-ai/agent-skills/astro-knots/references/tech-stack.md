---
from: "dididecks-ai"
from_path: "context-v/agent-skills/astro-knots/references/tech-stack.md"
---

# Astro Knots Tech Stack — Rationale

The full justification for each approved, conditional, and prohibited technology.

## The Hierarchy (restated)

1. HTML & CSS
2. Vanilla JS
3. A small focused package
4. A framework (only the approved few)

Always reach for the lowest level that works.

## Approved

### Astro — default site framework

**Why:** Server-renders by default. Ships zero JS unless you opt in. Partial hydration via `client:*` directives is explicit, scoped, and minimal. `.astro` files are HTML+JS+TS without a virtual DOM. Content collections, MD/MDX support out of the box, image optimization, view transitions.

**Use for:** every site, unless there's an extraordinary reason otherwise.

**Conventions:**
- Use `.astro` syntax, not JSX, even when Astro permits it
- Prefer content collections for `.md`/`.mdx` content
- Use `client:visible` over `client:load` when possible
- Avoid `client:only` unless the component cannot SSR

### Svelte — interactivity & SSR

**Why:** Compiles to small, focused vanilla JS. No virtual DOM. Reactivity model is straightforward. Plays well with Astro's island architecture.

**Use for:** components that need real reactivity (forms with complex state, interactive data viz, drag-and-drop). When in doubt, ask: could this be a vanilla JS sprinkle instead?

**Conventions:**
- Svelte 5 runes are the default for new components
- Keep components small; lift state to URL or `localStorage` when it can leave the component
- Don't reach for `+page.svelte`/SvelteKit inside an Astro project — use Svelte components inside `.astro` pages

### GSAP — animations beyond CSS

**Why:** When you need timeline orchestration, complex easing, scroll-driven sequences, or SVG morphing that CSS animations + transitions cannot deliver.

**Use for:** the rare case where the animation is the experience. Marketing hero sequences, interactive presentations, etc.

**First check:** can this be done with CSS animations, transitions, or `@scroll-timeline`? If yes, do that.

### Reveal.js — presentations as code

**Why:** Plain-HTML slides authored as Markdown. Versionable, embeddable, themeable, accessible.

**Use for:** decks that need to live alongside their related code/docs.

**Note:** Reveal is one of three presentation-as-code renderings used. // TBD: confirm the other two (likely **Marp** and **Slidev**) and document when each is preferred.

## Conditional / on probation

Anything not in the approved list is on probation. We test things; we remain skeptical. To promote a tool from probation to approved:

1. Use it in a real project for a meaningful slice of work
2. Write a blueprint capturing what it's good at and where it falls short
3. Write a reminder noting the boundary conditions
4. Discuss with the team
5. Update this doc

## Prohibited

### React — no

**Why not:**
- Bundle weight (even with tree-shaking, the runtime is significant)
- Virtual DOM tax for diffing on every state change
- Ecosystem sprawl: React + state lib + router + form lib + styling lib...
- JSX is a non-standard syntax that requires a build step everywhere it touches
- Hydration cost for SSR'd React is real

**If asked to add React:** push back. Offer Astro + Svelte equivalents. Only proceed if the user confirms with full understanding of the tradeoffs.

### JSX — no, even outside React

**Why not:** It's a non-standard syntax that obscures what the markup actually is. Astro's `.astro` files give you the same component composition with real HTML. Use that.

**Note:** Astro technically permits JSX-style expressions for compatibility. We don't use them. Stick to `.astro` syntax.

### Angular — no

**Why not:** Heavy runtime, opinionated dependency injection that doesn't compose with anything outside Angular, ecosystem largely orthogonal to web standards.

### "Bloat" — no

A judgment call. Signs:
- The library brings 50+ transitive deps for a small feature
- It assumes a SPA architecture
- It requires a build step incompatible with Astro's
- It's a mega-framework solving problems we don't have

Ask before installing.

## On UI libraries

Most "I need a UI library" requests are answered by:

1. Write the component in Astro or Svelte (often 30 lines)
2. Use a headless library only when complex behavior (a11y-correct combobox, focus-trapped modal, virtual list) genuinely requires it
3. Style with CSS — avoid CSS-in-JS

Tailwind is acceptable when used (we use it on multiple sites), but plain CSS is also welcome. Don't impose Tailwind on a project that doesn't already use it.

## On dependency hygiene

Before installing anything, ask:

1. Can the platform do this? (HTML, CSS, web standards)
2. Can a 20-line vanilla helper do this?
3. Is the package actively maintained, small, and tree-shakeable?
4. Does it bring transitive deps we don't want?
5. Does it lock us into a paradigm (e.g., SPA) we're avoiding?

If any of those answers are unsatisfying, don't install.

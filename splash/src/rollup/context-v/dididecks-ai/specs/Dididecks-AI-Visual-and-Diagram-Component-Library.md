---
title: "Dididecks-AI: Visual and Diagram Component Library"
lede: "DD-grade decks lean on a wide universe of recurring visual primitives — concept diagrams, mental models, classification schemes, frameworks. A reusable, AI-composable library of these primitives is what lets each new deck reach 'wow' without re-drawing from scratch."
date_authored_initial_draft: 2026-05-11
date_authored_current_draft: 2026-05-11
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-11
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Specification
tags:
  - Visual-Library
  - Diagrams
  - Mental-Models
  - Frameworks
  - Infographics
  - Dididecks
  - Component-Library
authors:
  - Michael Staton
image_prompt: "An apothecary's cabinet of curiosities reimagined for ideas — each drawer pulled open reveals a single diagram on parchment: a 2x2 matrix, a value-chain flow, a layered stack, a Venn, a sankey, an org-tree. Brass labels in fine engraving. Warm gaslight, deep wood, archival mood, restrained palette."
date_created: 2026-05-11
date_modified: 2026-05-11
from: "dididecks-ai"
from_path: "context-v/specs/Dididecks-AI-Visual-and-Diagram-Component-Library.md"
---
# Dididecks-AI: Visual and Diagram Component Library

> **Stub — 2026-05-11.** Sibling spec to [[Dididecks-AI-Slide-Decks-as-Code]]. Forked out preemptively per the anxiety-trigger principle in the `context-vigilance` skill: the visual-component universe is large enough to deserve its own design space rather than bloating the parent spec.

## The Question This Spec Will Answer

What set of **reusable, AI-composable visual primitives** does Dididecks-AI need so that every new deck can reach DD-grade conceptual clarity without redrawing the same diagrams from scratch — and what's the architecture for letting Claude *compose* these primitives intelligently from a narrative description?

## The North Star

> **A managing partner says to the embedded chat: *"Show this as a 2x2 with traction on the x-axis and conviction on the y-axis, our four target companies plotted, with the two we already passed on shown in muted grey."* — and within seconds, that slide exists, in the firm's brand, with the right components composed.** That is the bar. No drag-and-drop. No fiddling with shape coordinates. Conversation in, composed-visual out, every time, reliably.

## Why this is its own spec (and not a section in the parent)

The parent spec, [[Dididecks-AI-Slide-Decks-as-Code]], names a "universe of diagrams / visuals / mental models" as Input #3 of the design rationale. But the visual-library design space — primitive taxonomy, composition grammar, brand-aware theming, AI-composition prompting — is large enough that putting it inline would bloat the parent past the comfortable-reading threshold. Forked out preemptively. See `~/.claude/skills/context-vigilance/references/philosophy.md` → *"On capability ≠ wisdom-to-use-it"* for the rationale.

## What this spec covers (placeholder section list — to be developed)

> Headers only. Each will be filled through discussion.

### The Primitive Taxonomy

<!-- developing — the catalogued set of visual primitives DD decks recurringly need. First-pass list:
- 2x2 matrices (BCG-style, prioritization, positioning)
- Value chains / process flows
- Layered stacks (tech stack, market stack, capability stack)
- Venn diagrams (2-circle, 3-circle, weighted)
- Sankey / flow diagrams (capital flow, user flow, conversion funnel)
- Org trees / hierarchy diagrams (reporting, decision rights, holding structure)
- Comparison grids (feature matrices, comp tables-as-visuals)
- Timelines (linear, branched, milestone-tagged)
- Geographic / market maps
- Network / ecosystem diagrams
- Quadrant analyses (Gartner-style)
- Scorecard / radar / spider charts (already partially in citation spec)
- Mental-model frames (jobs-to-be-done, AARRR, RACI, North Star metric trees)
The taxonomy is not closed — new primitives are added as patterns recur. -->

### Composition Grammar

<!-- developing — primitives compose. A "Comp Set" slide is a comparison-grid primitive with logo + KPI-card sub-primitives plotted inside. A "Market Map" is a 2D-positioning primitive with logo-bubble + cluster-label sub-primitives. The grammar needs to be explicit so Claude can compose without inventing inconsistent shapes. -->

### Brand-Aware Theming

<!-- developing — every primitive must render in the active firm's brand: colors, type, line weights, corner radii, dark/light/vibrant mode. Inherits from `astro-knots/`'s two-tier token system. Components only ever read semantic tokens (per `theme-system` skill); the firm's brand config remaps the named tier. -->

### AI Composition Prompting

<!-- developing — how does Claude reliably translate a natural-language description into the correct primitive + correct data binding? Probably: each primitive ships with (a) a structured schema describing inputs, (b) example natural-language prompts that resolve to it, (c) a renderer that takes the schema and produces the slide. The agent-skill packaging is where this lives. -->

### Authoring vs. Library Storage

<!-- developing — when the user generates a one-off variant (e.g., "the same 2x2 but with the y-axis flipped"), does it go in the deck only, or also into a "tried this once" archive (per Design Principle #3, non-destructive iteration)? Per the parent spec's optionality discipline: the latter. Library is generative. -->

### Export Fidelity

<!-- developing — every primitive must render correctly in PDF export to the Design-Principle-#6 standard. No SVG-to-raster degradation. No font fallback. No off-spec spacing. This is also where the Reveal.js / static-HTML / PDF-pipeline distinctions matter most. -->

### Cross-Deck Reuse

<!-- developing — a 2x2 framework proven in one client engagement should be reusable in another (with brand re-themed). The library is the persistent surface. Per-client customizations live as overrides, not forks. -->

## Prior Art

- `astro-knots/context-v/sitemap/components/Component__Message-Hierachy-Bare-Component` — a primitive already in our component sitemap; canonical example of the kind of thing this library catalogues.
- `astro-knots/context-v/sitemap/components/Component__Rapid-Slide-Search-&-Nav` — adjacent; navigation rather than visualization, but the sitemap pattern itself is the model for cataloguing.
- `astro-knots/context-v/strategy/Exploring-Publishing-Component-Library-for-VC-Firms` — closest existing strategic thinking; directly upstream.
- `dididecks-ai/client-sites/calmstorm-decks/src/` — the most recent live implementation of slide-as-component patterns; the candidates for "promotion to library" are in there.
- `frontend-design` agent skill — for the design-quality discipline. Each primitive must hit the "distinctive, production-grade" bar; generic AI aesthetics fail DD.
- `maintain-design-md` skill — every primitive references locked design tokens, never invents values.

## Open Questions

1. **Library substrate** — Astro components? Vanilla SVG with a JSON schema? A new format? Probably Astro components inside a shared package (next step beyond `@knots/*` workspace-local pattern packages).
2. **Versioning** — primitives evolve. A deck published in May 2026 should still render correctly in May 2028. How do we version primitives without breaking deployed decks?
3. **Discoverability** — how does a user (or Claude on their behalf) browse the library? A `/design-system` page like astro-knots sites already maintain? An MCP-accessible registry?
4. **Long-tail customization** — when a client wants a primitive that isn't in the library, what's the workflow? Per-deck custom component → promotion to library if recurring? Or per-firm extension namespace?
5. **AI composition reliability** — how do we make the "say a description, get the right primitive" path *boringly reliable* rather than impressively wonky? Test corpus of natural-language → expected-primitive mappings, evaluated continuously.
6. **Skill packaging** — does this whole library ship as one agent-skill (`dididecks-visual-library`), several composable skills (one per primitive family), or as MCP-served tools?

## Related

- [[Dididecks-AI-Slide-Decks-as-Code]] — parent spec.
- [[Dididecks-AI-DD-Ready-Citation-and-Source-Access]] — adjacent sibling spec. Charts and KPI primitives straddle both — citation-grounded quantitative components live in the citation spec; concept/mental-model diagrams live here.
- [[../explorations/Dididecks-AI-Business-Model]] — relevant because a curated library is part of the hosted-tier value-add.
- `frontend-design` agent skill.
- `maintain-design-md` skill.
- `theme-system` skill.
- `astro-knots` skill.
- `context-vigilance` skill — for the fork-and-cross-reference discipline this spec exists to honor.

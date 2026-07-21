---
from: "dididecks-ai"
from_path: "context-v/agent-skills/astro-knots/references/philosophy.md"
---

# Astro Knots — Philosophy & Vision

Read this when you need the *why* behind the conventions, not just the conventions.

## Internet as originally intended

The web started as documents and links. Hypertext. Composable, addressable, durable. Somewhere along the way "web app" colonized "website" and we got 5MB JavaScript bundles to render a paragraph of text.

Astro Knots is a quiet rebellion. We build sites that:

- Render meaningfully without JavaScript
- Ship the smallest possible runtime
- Use semantic HTML and modern CSS as primary tools
- Treat content as first-class, not as data fed to a SPA
- Have URLs you can paste

This isn't nostalgia. Modern HTML and CSS are profoundly capable. Most "we need React for this" claims are unexamined defaults from a decade ago.

## Build in public

Imperfect work in public beats perfect work in private. We commit early, document while shipping, and treat the messy middle as the thing worth showing — not just the polished outcome.

This is why every Astro Knots project has a `context-v/` (see the `context-vigilance` skill). The documentation is the work. Specs, blueprints, explorations, and issue logs are not overhead — they are deliverables on equal footing with code.

The Lossless Group's "Lost in Public" practice is the parent culture. Astro Knots is one of its expressions.

## Generate meaningful content while shipping

We are skeptical of projects that produce only code. The work is shaped by thought; the thought, when externalized, becomes durable.

Every meaningful unit of work should produce at least one of:

- A spec that future contributors (human or AI) can build against
- A blueprint that codifies a pattern we've earned
- A reminder that prevents a mistake from recurring
- An exploration that maps a decision space
- An issue log that prevents a debugging journey from being repeated
- Web content (essay, gallery, walkthrough) that communicates outward

If a sprint produces only code, ask: what did we learn that's worth writing down?

## Forefront of Human + AI + Agent collaboration

We are betting that the next decade of software development will be defined by how well humans and agents collaborate. We aspire to make meaningful contributions to that frontier:

- **`context-v/` framework** — externalized memory for AI sessions
- **LFM (Lossless Flavored Markdown)** — content as composable components, addressable by both humans and agents
- **Astro Knots conventions** — a stack lean enough that an agent can hold a whole project in working memory
- **Pseudomonorepos** — context aggregation across loosely-grouped repos

These contributions are open source. They're meant to be borrowed, critiqued, and improved.

## On opinions

Astro Knots is opinionated. The opinions are earned, not arbitrary:

- "No React" is not a fashion stance — it's the result of repeatedly choosing simpler stacks and watching them outperform.
- "HTML & CSS first" is not nostalgia — it's the result of seeing how much modern web platforms can do without JS.
- "Document while shipping" is not waterfall — it's the result of watching projects without context die when their first contributor leaves.

Norms are negotiable. Vision is not. If a proposal violates the vision, push back before implementing.

## On scale

We have ~10 sites, plus 3 more in the next two weeks. Each one ships faster than the last because the conventions compound. New sites inherit:

- The Tech Hierarchy (no re-litigating React)
- The `context-v/` structure (no re-litigating documentation)
- The component patterns (refined across earlier sites)
- The deploy + content workflows (already wired up)

Velocity isn't a goal. It's a side effect of refusing to repeat decisions.

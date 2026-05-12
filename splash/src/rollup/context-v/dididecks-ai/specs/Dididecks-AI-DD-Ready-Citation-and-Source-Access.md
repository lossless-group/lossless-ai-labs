---
title: "Dididecks-AI: DD-Ready Citation and Source-Access System"
lede: "Every claim in a Due Diligence deck must be backable — by an academic-grade citation, a sourceable artifact, and a downloadable trail that a receiving decision-maker can pull on without asking the sender for permission."
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
  - Citations
  - Source-Access
  - Due-Diligence
  - Charts-and-KPIs
  - Infographics
  - Dididecks
  - North-Star
authors:
  - Michael Staton
image_prompt: "A library reading-room desk overlaid with translucent dashboards — bar charts, KPI cards, a stacked area graph — each chart with a fine ink line trailing down to a stamped, numbered citation card stacked at the desk's edge. Brass magnifying glass on top. Warm parchment, restrained palette, archival mood."
date_created: 2026-05-11
date_modified: 2026-05-11
from: "dididecks-ai"
from_path: "context-v/specs/Dididecks-AI-DD-Ready-Citation-and-Source-Access.md"
---
# Dididecks-AI: DD-Ready Citation and Source-Access System

> **Stub — 2026-05-11.** Sibling spec to [[Dididecks-AI-Slide-Decks-as-Code]]. Forked out preemptively per the anxiety-trigger principle in the `context-vigilance` skill: this is a substantial sub-system that deserves its own design space rather than bloating the parent spec.

## The Question This Spec Will Answer

How does Dididecks-AI make every claim, chart, KPI, and key metric in a deck **backable** — with a citation that survives transmission, a source artifact the receiving party can independently retrieve, and a level of rigor that satisfies academic-grade scrutiny without breaking the authoring loop?

## The North Star

> **A receiving-side decision-maker performing their own Due Diligence on a Dididecks-authored deck can click a citation, pull the original source, verify the claim, and continue their DD process without ever contacting the sender.** That is the bar. Anything short of that fails the *receiving-side DD* test that the parent spec hangs its identity on.

## Why this is its own spec (and not a section in the parent)

The parent spec, [[Dididecks-AI-Slide-Decks-as-Code]], commits to a *Due Diligence Bar* and lists "chart/KPI heavy with academic-grade citations" as Input #2 of the design rationale. But the citation-and-source-access system is large enough — in scope, in component primitives, in protocol design, in trust architecture — that putting it inline would bloat the parent past the comfortable-reading threshold. Forked out preemptively. The parent keeps the *map*; this spec carries the *detail.* See `~/.claude/skills/context-vigilance/references/philosophy.md` → *"On capability ≠ wisdom-to-use-it"* for the rationale.

## What this spec covers (placeholder section list — to be developed)

> Headers only. Each will be filled through discussion.

### The DD-Ready Citation Primitive

<!-- developing — what is a "citation" in a Dididecks slide? Footnote? Inline marker? Hover-card? All three? How does it survive PDF export, projector view, white-label publish surface? What's the data shape (title, author, publisher, published-date, retrieved-date, URL, DOI, archive snapshot, claim-being-supported)? Inherits from the LFM citation pattern at `lossless-monorepo/packages/lfm/` and the AstroMarkdown renderer's footnote handling. -->

### Chart, Table, and KPI Component Primitives

<!-- developing — the standardized visual building blocks for DD-grade quantitative content. Bar/line/area/sparkline charts, KPI cards with deltas, comparison tables, ranked lists, scorecards. Each component must (a) accept a data source object that includes the citation, (b) render correctly across web/PDF/projector/share-card, (c) display a "source" affordance the reader can act on. -->

### Infographic Layout Patterns

<!-- developing — recurring full-slide layouts that combine multiple chart/table/KPI components with a unifying narrative. Examples: "Market Map," "Comp Set," "Growth Trajectory," "Unit Economics Snapshot," "Risk Register." These are reusable across decks; library-first. -->

### Source-Access Protocol (the receiver's side)

<!-- developing — when a receiver clicks a citation, what happens? (a) Public source → fetched and displayed. (b) Paywalled source → routed through the firm's institutional access (if integrated) or shown with a clean "request access" affordance. (c) Confidential / NDA-only source → gated behind the same OAuth posture from NS-1 Side 2. (d) Internally-generated source → served from the workspace's published artifact store. -->

### Source Archival and Link-Rot Mitigation

<!-- developing — URLs rot. DD decks are sometimes referenced years later. Archive-on-cite (Wayback / archive.today / internal snapshot) so citations survive even when the original disappears. -->

### Citation Capture Workflow

<!-- developing — when the user pastes a stat into a slide, the system prompts (or auto-extracts) the source. Drag a PDF onto the workspace → citation primitive scaffolded. Paste a URL → metadata fetched, citation pre-filled. AI helps; user confirms; nothing un-cited gets into a published deck. -->

### Receiving-Side UX

<!-- developing — what does a DD-performer actually see and do when they open a Dididecks deck? Hover-on-claim shows footnote. Click-on-claim opens source. Pull-all-sources downloads a citation bundle (CSV / RIS / BibTeX). Toggle to a "sources-only" rendering for the analyst doing source-review-mode. -->

## Prior Art

- `lossless-monorepo/packages/lfm/` — the citation handling in `@lossless-group/lfm`, especially the hex-code footnote renumbering and `tree.data.citations` enrichment. **Directly upstream.**
- `dididecks-ai/client-sites/calmstorm-decks/` — the most recent Dididecks-pattern site; its citation rendering is one half-step ahead of LFM's general case. Worth studying for what extra it ships.
- `astro-knots/sites/cilantro-site/` — strong reference for SEO/OG meta + content-collections architecture.
- `astro-knots/sites/twf_site/` — cleanest LFM integration; `parseContent` polyfills for citation/callout handling.
- The `chroma-agent-skills` skill at `lossless-monorepo/context-v/skills/chroma-agent-skills/` — semantic retrieval discipline that's relevant when a deck draws from a large internal source corpus.
- The `crawl-fetch-ingest` skill at `lossless-monorepo/context-v/skills/crawl-fetch-ingest/` — auto-populating citation metadata from a URL.

## Open Questions

1. **Citation schema** — extend the existing LFM footnote shape, or design a new structured citation type that LFM adopts upstream?
2. **PDF export fidelity** — citations need to survive PDF export (per parent spec Design Principle #6). What rendering layer guarantees this? Native PDF generation (Playwright + print CSS, like `calmstorm-decks` does) or a separate citation-aware pipeline?
3. **Archive timing** — archive-on-cite (write-time) or archive-on-publish (publish-time)? Cost / fidelity / staleness tradeoffs.
4. **Receiver-side authentication for paywalled sources** — should Dididecks integrate with the receiving firm's institutional access (Bloomberg, S&P Capital IQ, etc.) or stay neutral and route the user to their own login?
5. **Bundled-skill packaging** — does this whole sub-system ship as a single agent-skill (`dididecks-citations`) bundled into the workspace install, or as several composable skills (`citation-capture`, `chart-with-source`, `source-archive`)?

## Related

- [[Dididecks-AI-Slide-Decks-as-Code]] — parent spec.
- [[Dididecks-AI-Visual-and-Diagram-Component-Library]] — adjacent sibling spec. Charts and infographics straddle both — citation-grounded quantitative content lives here; concept diagrams and mental models live there.
- [[../explorations/Dididecks-AI-Business-Model]] — relevant because citation/source-archival has hosted-cost implications.
- `lossless-monorepo/packages/lfm/` — upstream code.
- `lossless-flavored-markdown` skill — the existing LFM conventions this builds on.
- `context-vigilance` skill — for the fork-and-cross-reference discipline this spec exists to honor.

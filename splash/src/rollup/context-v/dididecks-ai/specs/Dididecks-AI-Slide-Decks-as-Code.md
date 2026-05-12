---
title: "Dididecks-AI: Slide Decks as Code"
lede: "A code-first paradigm for slide deck generation, iteration, and management — where AI coding assistants treat slides as components, decks as repositories, and presentations as living, versioned software rather than artifacts trapped in proprietary binary formats."
date_authored_initial_draft: 2026-05-11
date_authored_current_draft: 2026-05-11
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-11
at_semantic_version: 0.1.2.0
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Specification
tags:
  - Slide-Decks
  - Decks-as-Code
  - AI-Coding-Assistants
  - Astro-Knots
  - Pseudomonorepo-Candidate
  - North-Star
authors:
  - Michael Staton
image_prompt: "A draftsman's workbench in a steam-punk study, where slide carousels and projector reels have been replaced by stacks of typeset code on parchment. A brass pantograph copies a single slide into many variants. Behind it, a wall of indexed file drawers labeled by deck, by scene, by audience. Warm gaslight, ink and gear motif."
date_created: 2026-05-11
date_modified: 2026-05-11
from: "dididecks-ai"
from_path: "context-v/specs/Dididecks-AI-Slide-Decks-as-Code.md"
---
# Dididecks-AI: Slide Decks as Code

> **Stub — 2026-05-11.** Frontmatter + north star + prior-art pointers only. Body sections are placeholders awaiting discussion. Per [[developing-a-spec]] rhythm, this file exists so other agents and future-us can find it; structure will emerge through dialog.

## The Question This Spec Will Answer

What does slide deck generation, iteration, and management look like when the primary author is an AI coding assistant (Claude), the source of truth is code in a git repository, and the deliverable is a presentation that can be re-rendered, re-themed, re-audienced, and re-versioned the way software is — not the way PowerPoint files are?

## The North Star

> **A lofty, likely-unreachable, directional aspiration:** invent a new kind of slide deck generation and management system where AI coding assistants treat slides as components, decks as repositories, and presentations as living, versioned software. The paradigm is *code and code-generation*, not *slides and slide-decks*.

What that means in practice (to be sharpened through discussion):

- **Decks are repositories**, not files. They have a `src/`, a `package.json`, a `DESIGN.md`, a changelog, branches, and a deployment surface.
- **Slides are components**, not pages. They're composed, parameterized, re-themed, and re-mixed across decks. A "section" or "scene" is a meaningful unit of code, not a manually-arranged grid of shapes.
- **Variants are first-class.** The same underlying narrative is rendered for different audiences, formats (5-min lightning, 20-min board, 60-min workshop), and channels (web, projector, PDF export, share-card unfurl) without re-authoring.
- **AI is the primary author.** Claude doesn't *assist* deck creation by typing into a WYSIWYG; Claude *writes the code* that becomes the deck. Humans direct, review, iterate — same loop we already use for software.
- **Management is software management.** Version control, code review, semantic versioning, CI deploys, share previews, link metadata — the deck inherits the discipline of the surrounding monorepo.

## The Due Diligence Bar

The codename **DidiDecks** is a contraction of **Due Diligence.** That isn't decoration — it is the entire reason this product exists.

The slide decks we are building tools for are not "pitch decks" in the Gamma sense. They are the materials that get sent ahead of, or shown during, a **Due Diligence process** on the receiving side: an LP evaluating whether to commit to a fund, a co-investor sizing up a deal, a board reviewing portfolio performance, a regulator reading the room, an acquirer kicking the tires.

That receiving-side DD bar is what makes this work *hard*:

- A pretty deck that can't be backed up by source material **doesn't pass DD.**
- A deck that renders beautifully on screen but loses fidelity in a PDF handed across the table **doesn't pass DD.**
- A deck that risks leaking confidential portfolio data into the wrong hands **doesn't get sent in the first place.**
- A claim without a citable source is a vibe, not a substantiation — **DD eats vibes for breakfast.**

Gamma, Beautiful.ai, and adjacent tools stop at *"make a pretty deck."* Dididecks-AI is the strictly harder thing: a **content development system + company-brain contextual understanding** that produces materials that *pass DD on the receiving side*, not just *look good on the sending side.*

The DD bar is the bar. Every Design Principle, every North Star, every sub-system architecture in this spec is **downstream of it.**

## Key Product North Stars

The paradigmatic North Star above defines the *philosophy*. The two below are the **concrete product bets** that operationalize it — hard targets without which Dididecks-AI has failed at its job.

### NS-1: A two-sided system — private native workspace ↔ white-label publish surface

VCs (and similar firms) want a **subdomain** (`decks.theirfirm.com`) or a **path redirect** off their own domain that lands visitors on *their* managed decks-and-slideshow gateway. Most of the tooling we build is about **quickly ingesting, iterating, or redesigning what the client already has** — not green-fielding from scratch. Dididecks must absorb their brand (color palettes, imagery, vector art, fonts, voice) on first contact and use it everywhere from that moment forward.

**This is not duct-taped white-label.** Dididecks has two deliberately distinct sides:

**Side 1 — The Native App (private workspace).** A desktop shell — Tauri-pattern, inheriting directly from the MemoPop AI architecture at `ai-labs/memopop-ai/` — where the user chats with Claude to develop publishable decks. Includes private filesystem, private data store, private content ingestion. **Native, not browser, because busy professionals struggle with attention-splitting in browser-based tools.** They'll *use* browser tools, but they get distracted, jump tabs, lose the thread. A native app holds focus the way a tab cannot. The native shell is also where the hard data-privacy constraint lives — self-hosting / containerizing source data, near-zero leakage risk, runtime under the client's control.

**Side 2 — The Publish Target → External-Facing UI (white-label public surface).** Fully white-label. **Lives in the client's brand. Feels like their website**, not like a SaaS tool wearing their logo. Balances two posture-modes simultaneously:

- **Public**: SEO-discoverable, GEO-discoverable (legible to generative engines via llms.txt / structured data), share-rich on Twitter/X and LinkedIn — for the material the firm *wants* found.
- **Gated**: OAuth-protected, persistent-session, telemetry-aware access for serious potential funders going through Due Diligence on confidential materials. (Builds directly on the prior art in [[../../client-sites/calmstorm-decks/context-v/specs/Confidential-Access-v2-Persistent-Sessions-and-Telemetry]].)

The **boundary between these two sides is itself the product**: ingest privately → develop privately → publish to white-label, with the gating posture chosen per-deck or per-section.

### NS-2: A player so good they present *from it*, live, in the meeting

Yes, our primary value-delivery is the Due Diligence process — making materials that *pass* DD on the receiving side. But the **slide development → iteration → player** loop (up/down scroll, left/right play) has to work **so well that the user would rather present *live from their white-label DD Decks library* than export to Keynote and present from there.**

That is the unambiguous, brutal bar:

- The author of the deck uses Dididecks to make it.
- The author of the deck *also uses Dididecks to play it* — in front of the LP, the GP, the prospective funder, the board.
- The Keynote/PPT/PDF export still exists (per Design Principle #6) and is Keynote-grade, but the export becomes a **handoff artifact**, not the **presentation runtime.**

If we don't reach NS-2, we've built a content tool. **If we reach NS-2, we've built a content + delivery operating system** — and that's what changes the category economics from "fight Gamma on UI" to "make Gamma irrelevant for high-stakes DD work."

## Who This Is For (and Who's Building It)

**The Lossless Group** is an innovation consulting collective of practitioner-builders — code, sites, sometimes full apps. Venture Capital firms are a recurring client base; many of us also wear venture-partner / supporting-partner / community-advisor hats with VCs we don't actively consult to.

The word *lossless* is load-bearing: we build systems that **preserve the original intent and mission of an initiative all the way through to delivery, and then exceed the expectations implicit in that intent.** The bar isn't "shipped." The bar is *wow.*

Dididecks-AI exists to give that *wow* discipline a permanent home for the specific recurring artifact — slide decks for high-stakes VC work — that we currently re-invent on every client engagement.

## The Existing Footprint

We have already implemented some form of "slides as code" — at minimum, letting the client list and share decks — across **six sites**:

- `astro-knots/sites/twf_site`
- `astro-knots/sites/hypernova-site`
- `astro-knots/sites/banner-site`
- `astro-knots/sites/darkmatter-site`
- `astro-knots/sites/fullstack-vc`
- `site/` (the root `lossless-site`)

Plus two newer, active engagements that are driving this rethink:

- `dididecks-ai/client-sites/calmstorm-decks` — Calm/Storm fundraise materials.
- `dididecks-ai/client-sites/reach-edu-hub` — Reach University fundraising surface.

Six prior implementations means we have **strong empirical priors** about what works, what we keep rebuilding, and what every new engagement deserves to inherit instead of re-invent. Dididecks-AI is the consolidation of that learning.

## What "Slides as Code" Means in Our Stack

Across the existing footprint, "slides as code" shows up as any combination of:

- **Scroll Decks** — web pages with up/down navigation; sections sized like slides.
- **Markdown-rendered decks** — content in markdown, rendered as a navigable deck.
- **HTML / Tailwind / CSS decks** — directly authored deck markup.
- **Reveal.js-compliant HTML / Tailwind / CSS decks** — same authoring, with Reveal as the runtime.

Dididecks-AI must accommodate all four flavors — often mixed within a single client engagement.

## Design Principles (the recurring needs)

These are the patterns that recur across every VC engagement. Each one is a hard requirement; together they define the gap that single-deck tools (Gamma, Beautiful.ai, etc.) don't fill.

### 1. Auth vs. publish, balanced

A constant tension between protecting PII / confidential content and the desire to publish and share decks (sometimes broadly). The system must hold both at once — confidential by default for sensitive materials, easy-to-publish for the rest, with the boundary visible and controllable.

> See the existing prior art: [[../../client-sites/calmstorm-decks/context-v/specs/Confidential-Access-v2-Persistent-Sessions-and-Telemetry]] and [[../../../../astro-knots/context-v/explorations/Rethinking-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]].

### 2. AI design agents that "wow"-ify prior art

Take ugly prior decks, or a narrative outline (e.g., a Google Doc), and reach shareable polish — often on a **6-day turnaround** because a key funder meeting just got scheduled on Friday for the following Wednesday. The AI is not optional. The timeline is not optional. The polish bar is not optional. All three at once is the actual problem.

### 3. Non-destructive iteration, optionality preserved

Tweak, embellish, try variants, reorder — but **never destroy.** Tried a layout, decided not to use it Wednesday → send to archive / slide library, don't delete. Reducing the client's mental anxiety about losing work is itself a *feature*, not just a side-effect of good engineering. Optionality is a deliverable.

### 4. MVP-playable deck, always, rigid

At any given moment, **a deck must be ready to present.** On-the-fly opportunities don't wait — an investor pulls you aside at a coffee shop and your "current best version" is what you show. This is a hard floor, not a nice-to-have.

### 5. Continuous iterate / fork / personalize

Coexists with #4. Improve, fork, personalize, often racing toward a specific meeting on short notice — *without ever breaking the always-playable MVP.* The architecture has to make "iterating" and "stable presentable" non-conflicting states.

### 6. Passable PDF export, indistinguishable from Keynote/PPT

Looks-like-it-came-from-Keynote is the export bar. No "obviously generated by a web tool" tells — no off-spec fonts, no broken kerning, no transparent-checkerboard backgrounds, no layout drift. The reader should not be able to tell the deck was authored in code.

> See the existing prior art: [[../../client-sites/calmstorm-decks/context-v/explorations/High-Resolution-High-Fidelity-Deck-Exports-from-Code-to-Images-&-PDFs]].

### 7. Periodic urgent content integration

New market research, fresh news, yesterday's call transcript — gets folded in *near-urgently* when it lands. The system must accept new substance on short notice and reflow it into existing decks without manual rebuild.

## Positioning

Gamma, Beautiful.ai, and the rest are good at designing **a single deck.**

What our clients — high-need, high-willingness-to-pay VC firms — actually need is a **holistic content development system**: one that uses AI + slides-as-code to give superpowers across the full lifecycle.

```
ingest  →  wow-ify  →  variant  →  publish (with auth)  →  export (Keynote-grade)
                                          ↑                          │
                                          └──── re-integrate ────────┘
                                                fresh inputs
```

Dididecks-AI is positioned against **that systems gap**, not against any single-deck tool. It is not a "better Gamma." It is the category single-deck tools don't address: an end-to-end deck-content operating system for repeat, high-stakes, time-pressured client work.

## Sub-System: The Private Workspace (Native-App Side)

NS-1 commits us to a two-sided system. This section sharpens what **Side 1** — the private native workspace — actually is.

### The hard constraint

Customers in this space are anxious about data security and privacy **to the point where self-hosting or containerizing source data, with a private workspace whose leakage surface is near-zero, is a hard constraint.** Not "we'd prefer." Not "if you can." A binary gate. If we cannot offer them a runtime they control, they will not adopt the product — regardless of how good the output is.

This is not a fringe segment. For most managing partners at funds large enough to pay our hosted rates, *some* portion of the data feeding into a deck is either PII, materially non-public information, LP-confidential, deal-team-only, or otherwise legally fenced. The architectural answer must satisfy the strictest reasonable customer; everyone else benefits as a side-effect.

### What that demands of the architecture

- **Tauri (or equivalent) native shell.** Inherits from `ai-labs/memopop-ai/apps/memopop-native/` — the precedent worked. Native gives us a runtime under the client's control, a private filesystem they own, and a process boundary that isolates data from "the cloud" by default.
- **Local-first data store.** All source data — pitch decks, financial models, transcripts, news ingests, brand assets — lives in the client's filesystem unless they *explicitly* publish or share. The default trust direction is *toward the client*, not toward our infrastructure.
- **Optional containerization.** For firms with stricter security postures (institutional LPs, regulated funds), the entire workspace must be runnable inside their containerized environment with no outbound calls except those they explicitly whitelist (typically: their chosen LLM provider).
- **Bring-your-own-API-keys for LLMs by default.** The native shell talks to Claude (or whichever LLM) via the client's own API key. We do not proxy. We do not see the prompt traffic. Hosted-billing is an option (see *Embedded Chat & Agent Architecture* below), but it is *opt-in*, not the default. See [[../explorations/Dididecks-AI-Business-Model]] for the pricing implications.
- **Auditable boundary.** When something does leave the workspace (publishing a deck, exporting a PDF, triggering an MCP server call to a remote tool), the act is logged, visible, and reversible. Surveillability *of the boundary itself* is a feature.

### Why "browser" is not the answer

A browser tab can technically be locked down with the right architecture, but it does not *feel* private to the customer. Privacy is partly a felt experience — the same way a deadbolt feels safer than a smart lock even when both are equally secure. The native shell is also where attention-splitting collapses (per NS-1) — those two virtues *compound*, they don't trade off.

### Eventually: Individual ↔ Team private workspaces

The v1 "private workspace" is **individual** — one user, one local data store, one trust boundary. Sufficient for the solo managing partner running her own deck library.

**The North Star architecture must extend to** *both individual and team* **private workspaces in the same install.** The same firm typically has:

- **Individual-private** material — a partner's personal deal notes, draft scoring, half-formed thinking they're not ready to share with the partnership yet.
- **Team-private** material — fund-internal materials, deal-team-only working sets, LP-confidential content shared across the deal team but not beyond.
- **(Eventually) firm-public** material — anything destined for the white-label external surface.

The architectural commitments this implies:

- **A privacy-scope state on every directory and file.** Each artifact in the workspace carries a designation: `individual` (default for new content), `team`, or `firm-public` (i.e., flagged for publish). The designation is *user-controlled and visible* — never inferred silently.
- **Promotion is explicit, demotion is supported.** A user can promote individual content to team-shared with a deliberate action. Demoting team content back to individual is also supported (mistakes happen; a team-shared draft sometimes needs to retreat to one person's workspace).
- **Sync semantics for team-private content.** Some team-shared store — git, S3-compatible object storage, or a client-hosted equivalent — backs the team-private tier. The sync layer must be auditable (per the broader auditable-boundary principle above) and must respect the same self-host / container constraints as the individual tier.
- **Identity and access at the workspace level, not the deck level.** Who-can-see-what is a workspace-level state, not a per-deck ACL. A user is a member of zero or more teams; team-private content is visible to members of that team and no one else, regardless of which deck or chat session is open.
- **Backward compatibility from v1.** A v1 individual-only install upgrades cleanly to multi-tier without data migration drama — all existing content stays `individual` until the user designates otherwise.

This is **explicitly v2+ scope**, not v1. But the v1 architecture must not foreclose it: the file-metadata model, the chat-context boundary, and the publish pipeline all need to be designed *as if* the team tier exists from day one, even when only the individual tier ships.

### Cross-references

The private-workspace constraint connects directly to:

- The OAuth-gated publishing posture on Side 2 of NS-1.
- The **Confidential-Access v2** prior art at [[../../client-sites/calmstorm-decks/context-v/specs/Confidential-Access-v2-Persistent-Sessions-and-Telemetry]] — that pattern is *upstream* of what gets shipped here.
- The downstream pricing question explored at [[../explorations/Dididecks-AI-Business-Model]].

## Sub-System: Embedded Claude Chat & Agent Architecture

The other half of NS-1 Side 1: how the user actually *talks to Claude* inside the native workspace.

### The user we are designing for

A managing partner at a $400M-AUM VC, mid-raise on a $300M Fund IV, mother of two children, sitting in fifteen meetings this week. **She will not open a terminal. She will not `git clone`. She will not learn a new IDE.** She is busy in the specific high-skill, high-judgment way that the wealthiest professionals are busy — and her tools have to meet that condition.

She *will*, however, chat with an assistant inside an app she trusts. That's the whole UX gravity well. Designing against any other behavior loses her.

### What we have learned trying alternatives

The Lossless Group has, across multiple engagements, tried to get VCs onto:

- **Claude Code (CLI)** — failed adoption. The terminal is a non-starter for this user.
- **Hermes Agent** — failed adoption for the same reason. The interaction model is built for builders, not operators.
- **Claude Native (desktop app)** — partial adoption. Closer, but every conversation starts from zero. No project context, no agent-skills, no MCP servers — so the user has to *re-explain* their world every session. They quit.

The lesson: **for the real paying customer, the only viable UX is chat embedded in an app that already knows their context.** Dididecks-AI must ship that or it ships nothing for the people who actually pay.

### The architecture

- **Chat-in-app, not chat-in-browser-tab.** The chat surface lives inside the native shell, alongside the deck library, the asset browser, the publish pipeline. One window, one focus, one trust boundary.
- **MCP servers as the integration substrate.** The native app brokers MCP-compliant tool calls — to the client's filesystem, to their content pipeline, to publishing actions, to citation lookups, to brand-asset retrieval, to outline ingestion. We do not invent a new tool-call protocol; we inherit MCP and contribute to it.
- **Agent-skills bundled as part of the install.** Every Dididecks workspace ships with a curated skill pack — `deck-iteration-workflow`, `generate-consistent-og-images`, `theme-system`, `crawl-fetch-ingest`, `maintain-design-md`, `open-graph-share-seo-geo`, and the citation/visual-library skills that will emerge from the sibling specs. The user doesn't author skills. They *benefit from* them. Canonical sources at `lossless-monorepo/context-v/skills/`.
- **Bring-your-own-API-keys, or use ours (with billing).** Two pricing/runtime modes:
  - **BYO-keys** (default for self-hosted / containerized users): the client's Anthropic API key, the client's Anthropic bill. We never see the traffic. Aligns with the privacy constraint above.
  - **Hosted billing** (for the busy partner who doesn't want to manage API keys): we charge a markup, run the proxy, take on the operational burden. *Opt-in, not default.*

### Why this is the moat

A managing-partner chat-in-app with project-context, MCP-integrated tools, and bundled agent-skills is **not something Gamma can bolt on later.** It requires a fundamentally different architectural starting point — local-first, native-shell, MCP-first — than a browser-based deck designer. Each month we invest in this architecture, the cost-to-clone goes up. The moat *thickens with use.*

### Cross-references

- The pricing dual-mode (BYO-keys vs. hosted) is also a business-model question — see [[../explorations/Dididecks-AI-Business-Model]].
- The two sibling specs being created in parallel — [[Dididecks-AI-DD-Ready-Citation-and-Source-Access]] and [[Dididecks-AI-Visual-and-Diagram-Component-Library]] — will likely ship as additional agent-skills (or extensions of existing ones) bundled into the install.

## Why This Spec Lives in `ai-labs/context-v/specs/`

The intended home for the eventual code is **`ai-labs/dididecks-ai/`** (a future git submodule, strawman name). It does not exist yet. This spec lives at the **`ai-labs/` pseudomonorepo level**, not inside any specific child, for two reasons:

1. **Cross-cutting scope.** Dididecks-AI will sit as a sibling to `memopop-ai/` under `ai-labs/`. A spec that initiates a new child belongs in the parent's `context-v/specs/` per the `pseudomonorepos` skill — the parent owns *the space between* children.
2. **Pattern parentage from `memopop-ai`.** The existing true-monorepo-with-mixed-stacks-that-talk-to-each-other inside `ai-labs/` is `memopop-ai`. Dididecks-AI will likely inherit the same architectural shape (backend / frontend / cross-platform divisions, multiple apps under one repo). The `memopop-ai` spec rhythm — see `memopop-ai/context-v/specs/An-Onboarding-User-Journey-for-Memopop-Native.md` and `memopop-ai/context-v/specs/Character-Cast-for-Live-Agent-Indication.md` — is the writing rhythm we want to replicate.

When the submodule is scaffolded, this file (or its successor) may migrate into `dididecks-ai/context-v/specs/` once that repo exists. Until then: here.

## Prior Art and Reference Surface

The work being adapted into a living spec:

### Calmstorm-decks project (the most recent empirical input)

The project-level artifacts under `dididecks-ai/client-sites/calmstorm-decks/`:

- [[../../client-sites/calmstorm-decks/README]] — README for the most recent deck-as-Astro-site project (CalmStorm fundraise decks).
- [[../../client-sites/calmstorm-decks/DESIGN.md]] — Stitch-spec design tokens locked for the project; the contract a deck-generation system would need to read.
- `dididecks-ai/client-sites/calmstorm-decks/src/` — components, slide primitives, scene composition patterns.
- `dididecks-ai/client-sites/calmstorm-decks/scripts/` — generation, export, and management scripts already in place.
- `dididecks-ai/client-sites/calmstorm-decks/data/` — content authored separately from presentation.
- `dididecks-ai/client-sites/calmstorm-decks/exports/` — the deliverable surface (PDF, share-cards, etc.).

Calmstorm-decks `context-v/`:

- [[../../client-sites/calmstorm-decks/context-v/explorations/High-Resolution-High-Fidelity-Deck-Exports-from-Code-to-Images-&-PDFs]] — the export-from-code problem: how do code-defined slides reach high-fidelity images and PDFs? Core to "decks as code" credibility.
- [[../../client-sites/calmstorm-decks/context-v/specs/Confidential-Access-v2-Persistent-Sessions-and-Telemetry]] — confidential-access spec; relevant whenever a deck is shared with restricted audiences (most fundraise decks).

### Astro-knots family (cross-cutting deck patterns)

Prior art at the `astro-knots/` pseudomonorepo level — patterns that span more than one deck or site, and are therefore candidates for promotion into Dididecks-AI primitives:

Strategy:

- [[../../../../astro-knots/context-v/strategy/Exploring-Publishing-Component-Library-for-VC-Firms]] — the closest existing thinking about generalizing deck/site components into a reusable library aimed at VC firms. **Directly upstream of this spec.**

Specifications, prompts, and explorations:

- [[../../../../astro-knots/context-v/explorations/Rethinking-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]] — family-level exploration of the same auth pattern the calmstorm-decks spec implements.
- [[../../../../astro-knots/context-v/prompts/Implement-Portfolio-with-Confidential-Access-in-new-Site]] — prompt for replicating confidential-access in a new site; a candidate template for Dididecks deck-init flows.
- [[../../../../astro-knots/context-v/prompts/Set-Up-Index-and-Basic-Components-using-Brand-Theme]] — the brand-theme-driven scaffolding prompt; a candidate template for Dididecks deck-init.

Issue resolution:

- [[../../../../astro-knots/context-v/issue-resolution/Resolving-Mode-Switching-Across-Multiple-Components]] — concrete pain log around theme-mode propagation across components; surface this when designing Dididecks' mode/variant system.

Reminders (battle-scarred guardrails):

- [[../../../../astro-knots/context-v/reminders/Design-System-Pages-Per-Site]] — every site/deck deserves its own design-system surface; the generative system must respect this.
- [[../../../../astro-knots/context-v/reminders/Flare-Components-Creative-Workflow]] — how "flare" components (visual flourishes) get authored without breaking the design system.
- [[../../../../astro-knots/context-v/reminders/Improvising-within-Design-System-Color-Palettes]] — how to extend palettes during creative work without exploding token scope.

Component sitemap (component-level prior art):

- [[../../../../astro-knots/context-v/sitemap/components/Component__Message-Hierachy-Bare-Component]] — message-hierarchy primitive; a likely Dididecks slide-component archetype.
- [[../../../../astro-knots/context-v/sitemap/components/Component__Rapid-Slide-Search-&-Nav]] — rapid in-deck search & navigation; directly speaks to runtime UX of a code-backed deck.

### Related skills (already-codified discipline)

- `deck-iteration-workflow` skill (at `lossless-monorepo/context-v/skills/deck-iteration-workflow/`) — the Lossless Group's slide-iteration rhythm aligned with the `calmstorm-decks` patterns.
- `crawl-fetch-ingest` skill (at `lossless-monorepo/context-v/skills/crawl-fetch-ingest/`) — the workflow for filling in team/portfolio metadata from a firm's site; directly relevant when a Dididecks deck needs to auto-populate from a URL.
- `chroma-agent-skills` skill (at `lossless-monorepo/context-v/skills/chroma-agent-skills/`) — semantic/vector store discipline; relevant if Dididecks needs cross-deck similarity, scene reuse, or retrieval-augmented authoring.
- `astro-knots` skill — the conventions, prohibitions, and tech hierarchy any deck site inherits.
- `generate-consistent-og-images` skill — share-imagery discipline that a deck deployment surface depends on.
- `open-graph-share-seo-geo` skill — unfurl, sitemap, llms.txt; relevant if decks ship to the public web.
- `maintain-design-md` skill — the design-token contract a generative system must respect.
- `theme-system` skill — two-tier tokens, three modes, the runtime layer.

### Architectural parentage (the structural input)

- `ai-labs/memopop-ai/` — the true monorepo with mixed-stack apps that already divides backend/frontend/cross-platform cleanly. Dididecks-AI inherits this shape.
- `ai-labs/memopop-ai/context-v/specs/` — the spec-writing rhythm we're matching.
- `ai-labs/memopop-ai/apps/memopop-native/` (if/as relevant) — Tauri + Svelte 5 pattern, useful if Dididecks ever has a native shell.

### Cross-cutting context

- [[../../../../context-v/specs]] (root `lossless-monorepo/context-v/specs/`) — the wider Lossless slide / deck thinking, if any prior specs exist there. **TBD: walk the tree before next iteration to surface what's already written.**
- The "Develop a Slides-only Astro Site for a Fundraise Process" specification referenced by the `deck-iteration-workflow` skill — the closest existing precedent for slides-only Astro sites.

## Hypothesis (to be tested through discussion)

The reason "slide decks as code" hasn't displaced WYSIWYG tools at scale isn't because the paradigm is wrong — it's because authoring code by hand for a deck is slower than dragging a textbox. **AI coding assistants invert that economics.** Once Claude can author, refactor, re-theme, and re-audience a slide-component in seconds, the code paradigm wins on every axis WYSIWYG previously won on (speed, ease, iteration) plus every axis it already won on (versioning, reuse, theming, programmatic generation, multi-format export).

Dididecks-AI is the bet that this inversion is now real.

## What This Spec Will Eventually Cover (placeholders)

> Sections below are headers only. Each will be filled in through discussion. The shape is provisional; expect reorganization before sign-off.

### Audience and Use Cases

<!-- developing — who are the first users? VC pitch decks, fundraise rooms, internal strategy, conference talks, courseware? -->

### Architecture (cross-stack divisions)

<!-- developing — backend (generation, asset pipelines, AI orchestration), frontend (Astro deck shell, runtime), cross-platform (CLI, native shell if any). Mirrors memopop-ai layering. -->

### The Authoring Loop

<!-- developing — what does it feel like for a human to direct Claude to generate / iterate / re-audience a deck? Where does the human edit vs. where does Claude edit? -->

### Source-of-Truth Format

<!-- developing — what is a "deck" as data? A directory of components? A canonical YAML/MD? Both? How do narrative, design tokens, content, and presentation separate? -->

### Variants and Re-Audiencing

<!-- developing — same narrative, different audiences/lengths/formats. The mechanism. -->

### Deployment Surface

<!-- developing — web, PDF, share-cards, projector, presenter-view. Each is a render target, not a separate authoring task. -->

### Relationship to Calmstorm-Decks

<!-- developing — what we keep, what we generalize, what we leave behind. -->

### Relationship to Memopop-AI

<!-- developing — what architectural patterns we lift wholesale, what we adapt. -->

### Phasing

<!-- developing — first usable version vs. north-star version. What's v0.1? What's v1.0? What's the directional aspiration that may never ship? -->

## Open Questions (will grow during discussion)

1. **Submodule vs. inline.** Does Dididecks-AI become its own `ai-labs/dididecks-ai/` submodule, a folder inside `memopop-ai`, or something else? Submodule is the strawman; defend or refute.
2. **Astro lock-in vs. renderer-agnostic.** The empirical work is Astro-based (`calmstorm-decks`). Is Dididecks-AI an Astro project, an Astro-flavored framework, or a renderer-agnostic spec that *happens* to have an Astro reference implementation?
3. **What is the "deck file"?** Single canonical document → many rendered surfaces, or a directory-of-components with no single canonical entry point?
4. **Where does AI live in the loop?** Authoring (Claude writes the components), iteration (Claude edits in place), or both — and what's the human/AI handoff shape?
5. **Reusability across decks.** A slide pattern proven in one deck — how does it migrate to the next? Component library? Copy-paste? Generated from prompts? **Partially addressed by** [[Dididecks-AI-Visual-and-Diagram-Component-Library]] — that sibling spec is where this question gets answered for *visual* primitives. Question still open for narrative/copy patterns.
6. **Versioning model.** Semantic versioning of *what*? The whole deck, individual scenes, the design tokens, all three independently?
7. ~~**The naming.** "Dididecks" is a strawman. Worth keeping?~~ **Resolved 2026-05-11:** keeping it. "Didi" = **Due Diligence**, which is the bar this product is built to clear. See *The Due Diligence Bar* section above.

## What's Explicitly NOT in This Spec (yet)

- Implementation choices for the eventual repo (stack, build, dependencies). The spec is *what & why*; the prompts that follow it are *how*.
- Migration plan for existing `calmstorm-decks` content. That's a downstream concern.
- **Citation, source-access, charts/KPIs.** Forked into the sibling spec [[Dididecks-AI-DD-Ready-Citation-and-Source-Access]].
- **Visual primitive library, diagrams, mental-model components.** Forked into the sibling spec [[Dididecks-AI-Visual-and-Diagram-Component-Library]].
- **Pricing, packaging, GTM, Forward-Deployed motion, OSS licensing posture.** Lives in the exploration [[../explorations/Dididecks-AI-Business-Model]] — not a spec, because the destination is genuinely unclear until we have usage signal.

## Related

**Sibling specs (forked from this parent per the anxiety-trigger principle):**

- [[Dididecks-AI-DD-Ready-Citation-and-Source-Access]] — the citation + source-access sub-system. Charts, tables, KPIs, infographics, receiving-side DD UX.
- [[Dididecks-AI-Visual-and-Diagram-Component-Library]] — the universe of recurring concept diagrams, mental models, classification schemes, and AI-composable visual primitives.

**Exploration (business model, not architecture):**

- [[../explorations/Dididecks-AI-Business-Model]] — OSS posture, hosted upsell, Forward Deployed motion, pricing dimensions.

**Architectural parentage and neighbor work:**

- `memopop-ai/context-v/specs/An-Onboarding-User-Journey-for-Memopop-Native.md` — neighbor-child spec; rhythm and frontmatter precedent.
- `memopop-ai/context-v/specs/Character-Cast-for-Live-Agent-Indication.md` — neighbor-child spec; example of UI-paradigm spec.
- `dididecks-ai/client-sites/calmstorm-decks/` — the primary empirical input being adapted.
- `ai-labs/memopop-ai/` — the architectural-parentage reference.

**Skills:**

- `deck-iteration-workflow` skill — the working slide-iteration discipline.
- `astro-knots` skill — the conventions any Astro-based renderer inherits.
- `pseudomonorepos` skill — for placement decisions when Dididecks-AI gets scaffolded.
- `context-vigilance` skill — the framework this spec follows.

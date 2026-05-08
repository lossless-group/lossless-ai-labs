---
title: "Context Vigilance Splash Page — Narrative Brief"
lede: "Designer brief for the Context Vigilance splash. The functional plumbing exists; the structural skills are codified elsewhere. This doc is only about the *story* — the four-act narrative arc and the emotional move each act should produce."
date_created: 2026-05-08
date_modified: 2026-05-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.1
tags:
  - Plan
  - Splash-Page
  - Narrative
  - UI-Design
  - Context-Vigilance
  - Marketing-Copy
status: Draft
---

# Context Vigilance Splash Page — Narrative Brief

## What this doc is for

You — the UI designer picking this up — are inheriting a working splash page at `ai-labs/context-vigilance-kit/splash/`. It builds, it renders 573 corpus pages, it has clickable links and a dark theme. **What it lacks is the story.** Right now the hero is one borrowed line and a stat line. The catalog dominates without setup. There is no closer.

This brief is *only* about that story. The functional pieces are documented elsewhere — see "What's already decided" below. Your job is to take the four-act narrative laid out here, design layout/typography/illustration around it, sharpen copy where you can do better, and ship a splash that produces the four emotional moves named in each act.

## Audience — who lands on `contextvigilance.com`

The splash needs to work cold for three readers, in priority order:

1. **The skeptical engineer** who has been burned by AI agents that "almost" work. Has seen the marketing of every coding agent for two years and bounces fast. Wants proof, not pitch. **Lands at the hero, scrolls to the corpus to see if it's real, leaves if it isn't.**
2. **The peer practitioner** — another small agency, indie team, or in-house lead doing context work and recognizing the moves. Wants vocabulary, conventions, prior art. Wants to know who else is doing this. **Lands at the hero, lingers on Act 2 to learn the names, browses the corpus deeply.**
3. **The decision-maker** considering whether their team should adopt the discipline. Skims everything. Wants the leverage claim and the open spec. **Reads only the hero and the closer.**

All three should leave with a different next action available — corpus to browse for #1, methodology to study for #2, GitHub repo / contact for #3.

## The four-act narrative arc

Each act maps to a vertical scroll section of the page. The emotional move named at the end of each act is what the designer should solve *for*, not just decorate around.

### Act 1 — The Hook (above the fold)

> Most coding agents fail not because the code is hard, but because the **context is missing**. You hand the agent a problem; it doesn't know your conventions, your prior decisions, the mistakes you made last quarter. So it guesses.
>
> Treat context with the same vigilance as code — versioned, reviewed, cross-linked — and something flips. **Code becomes regenerable.** A bug fix compresses from days to minutes. Migrating across languages goes from "we'll plan a quarter for that" to "we did it Tuesday afternoon." The agent didn't get smarter. It finally has the ground it needed to stand on.

**Emotional move:** relief. *"Oh — that's why it's been so frustrating."*

**Designer notes:**
- "Treat context with the same vigilance as code" is the headline. Strong typographic treatment.
- "Code becomes regenerable" is a sub-claim worth its own visual weight. Could be a callout, a stat-style treatment, or animated reveal.
- The before/after time compressions ("days to minutes", "quarter to Tuesday afternoon") are pull-quotes worth scattering.
- Avoid hero CTAs that demand commitment. The reader hasn't earned a *Sign Up*. Maybe a *Read the corpus* and a *See the spec*, both low-commitment.

### Act 2 — The Practice (what Context Vigilance actually is)

> Six folders: **specs, prompts, blueprints, reminders, explorations, issues**. Three cognitive modes: **Prep** (deciding what to build), **Reflection** (codifying what works and what doesn't), **Journey** (capturing research and the painful debugging paths).
>
> Every file is written for three readers: the human editing it, the agent loading it as context tomorrow, and the public reader who lands on it cold. Frontmatter is a contract. Cross-links are how attention navigates a tree too big for any one head.

**Emotional move:** legibility. *"This is a craft I could learn."*

**Designer notes:**
- This is the section most likely to want a *diagram*. Six folders × three cognitive modes can be a 2×3 grid, a tree, an annotated cabinet — pick what fits the brand.
- Risk: too much vocabulary in 60 seconds of reading. If the diagram works, the prose can shrink to one paragraph + the diagram does the heavy lifting.
- "Frontmatter is a contract" is a pull-quote candidate. Compresses a whole convention into five words.
- Cross-link to the [[context-vigilance]] skill / spec page for readers who want depth here. Don't try to teach the whole practice on the splash.

### Act 3 — The Proof (the corpus is the body of the page)

> Below is the proof. **583 living docs from 28 projects.** One small agency's actual work over 18 months — not a theory paper. **110** mature. **263** started. **210** stubs we'll fill out with agent help.
>
> Some are specs for products you can fork. Some are reminders born after the third time we made the same mistake. Some are explorations that ended in *"we decided not to pursue"* — and those are valuable too. Browse them. Search them. Steal what's useful.

**Emotional move:** trust. *"They're not selling me; they're showing me their actual mess."*

**Designer notes:**
- The catalog (currently the dominant feature in the v0 splash) is the artifact this section introduces. Frame it; don't bury it.
- The numbers (583 / 28 / 110 / 263 / 210) are alive — they update as the kit re-runs the manifest. Build with that in mind; render from the manifest's frontmatter, not hardcoded.
- "Their actual mess" is the tonal anchor for this whole section. We're not pretending it's polished. Stubs are visible, status fields are visible. The vulnerability *is* the marketing.
- Search box is non-negotiable here. Pagefind handles the keyword case (already a convention per the splash skill); semantic search via the local Chroma instance is an aspiration for v1+.
- Don't sort the catalog "best first." The disorder is part of the proof.

### Act 4 — The Invitation (closer, before the footer)

> This isn't our IP. The directory pattern, the file format, the practice — they're an open specification, in the spirit of the original Hyperloop paper. *We thought of this; here's how it works; someone please build it, fork it, improve on it, or adopt it as-is.*
>
> Schema and tooling are MIT. The kit that produced this site is on GitHub. Build with us, build alongside us, or build your own.

**Emotional move:** agency. *"I can do something with this."*

**Designer notes:**
- Three CTAs of different commitment level: (a) read the spec, (b) star/fork the kit, (c) get in touch (Lossless Group contact).
- "Like the original Hyperloop paper" is the analogy that makes the openness legible. Worth a visual nod — a pull quote, an icon, a color treatment.
- Avoid logo soup or testimonial walls. We don't have them and we don't need them. The corpus already proved the point in Act 3.

## Tonal register

A "calm essayist" register — first-person plural, declarative, generous, occasionally dry. Not manifesto-pitched (we're not selling a religion). Not documentation-flat (we're trying to make people care). The published voice should match the voice in the corpus itself — see any of the [[Collate-Context-Files-into-Context-Vigilance-as-Repo-&-Project]]-class explorations for tone calibration.

If a piece of copy reads like it could be ad copy for a SaaS product, rewrite it. The credibility move is *understated competence* — every line should sound like someone who'd rather show you the work than convince you of it.

## What's already decided (functional plumbing — don't relitigate)

Reference these existing skills and decisions; the designer is not asked to re-decide any of them:

- [[maintain-splash-pages]] — splash conventions, GitHub Pages publish path, package isolation, "creative posture" guidance
- [[theme-system]] — two-tier token system, three-mode contract (light/dark/vibrant), `theme.css` organization
- [[lossless-flavored-markdown]] — markdown rendering pipeline; if the splash needs custom markdown extensions, lift from LFM rather than rolling new ones
- [[astro-knots]] — Astro 6 conventions, hard prohibitions (no React/JSX), interactivity via Svelte
- [[changelog-conventions]] — for any per-update ship notes the splash surfaces

Functional choices already made:
- **Astro 6.3.1**, project at `ai-labs/context-vigilance-kit/splash/`
- **Domain:** `contextvigilance.com` (primary, no hyphen); `context-vigilance.com` registered defensively, 301 to primary
- **Hosting:** GitHub Pages (`lossless-group.github.io/context-vigilance-kit/` until custom domain DNS lands)
- **Search:** Pagefind for keyword search (convention); local Chroma for semantic search is aspirational v1+
- **Content source:** the corpus collection at `corpus/<repo-slug>/...`, exposed as an Astro content collection in `src/content.config.ts`. Manifest stats live in `corpus-manifest.md` frontmatter — render from that, do not hardcode.

## What the designer is explicitly empowered to decide

- Layout, typography, type pairing
- Color palette within the existing two-tier token system (vibrant mode is the experimentation surface per [[maintain-splash-pages]])
- Diagrams, illustrations, motion (within Astro Knots' framework prohibitions — no React; Svelte for interactivity)
- Copy *refinements* to any of the four acts. The narrative arc is fixed; the prose is rough draft.
- The exact rendering of Act 2's diagram (or whether a diagram is right at all)
- Whether Act 3 is a single integrated catalog page or splits into "browse" + "search" surfaces
- The OG image. **Lead with the marketing-flare quote** ("treat context like code → context becomes the parent to the code") on the OG card, not with a screenshot.
- The 404 page voice (it can be funny; the rest of the splash should not be)

## What is NOT to be touched without explicit signoff

- The hero's core claim ("context becomes the parent to the code"). Refinements yes; replacement no.
- The four-act order (HOOK → PRACTICE → PROOF → INVITATION).
- The Hyperloop-paper analogy in Act 4.
- The numerical proof in Act 3 — those numbers are sourced from the manifest, not invented.
- The dark-mode default (per the brand discipline of `worked-in-the-night` aesthetic until the brand spine says otherwise).

## Open questions for the designer to answer (or surface)

1. **Diagram or no diagram for Act 2?** A clear visual of *six folders × three cognitive modes* could carry that section better than prose. Or it could be a distraction. Designer's call after a paper sketch round.
2. **How aggressive is the *corpus-as-living-thing* framing in Act 3?** Static stats vs. animated counters vs. a "what changed this week" stream. Each is more work than the last; not all are worth it.
3. **Is the closer (Act 4) one panel or three?** A single CTA is cleanest. Three (one per audience tier) is most generous. Lean cleanest first, expand only if a/b testing rejects it.
4. **Does the splash carry a "browse the kit's own context-v" surface** in addition to the corpus catalog? The kit's own specs/plans/explorations are interesting *as content* (this very brief is one of them). Could fold into Act 3 or get its own page.
5. **Pull quotes — how many, what density?** I've seeded several throughout this brief. The designer chooses which earn the visual weight and which stay inline.

## Reference content already in the corpus you can lift from

The splash itself can quote the corpus — increases authenticity, gives the designer real text to typeset against:

- [[Collate-Context-Files-into-Context-Vigilance-as-Repo-&-Project]] — the founding exploration; "1.5 years of practice" framing
- [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] — the "context becomes the parent to the code" pivot is articulated here
- [[Tidy-Context-Vigilance-Files-Across-All]] — operationalizes the "we're proud of them" goal; useful for Act 3's *actual mess* honesty
- [[context-vigilance]] skill (in `lossless-skills`) — the canonical reference for the practice; link target for "learn more" CTAs

## Acceptance — when this is done

A reasonable splash visit follows this trajectory:

1. **Hero hits.** The skeptical engineer pauses on "context becomes the parent to the code" and reads the second paragraph instead of bouncing.
2. **Act 2 educates.** The peer practitioner sees their own struggle named ("six folders, three modes") and recognizes the craft.
3. **Act 3 convinces.** Both readers scroll the corpus, click into 2-3 docs, see the actual mess, and form an unconscious assessment: *these people are doing the work*.
4. **Act 4 enables action.** Each reader has a CTA at their own commitment level: read the spec, fork the kit, get in touch.

If a reader reaches the footer without taking any of those actions, the page mostly worked anyway — they internalized that this practice exists and has a name. That's the floor.

## Cross-references

- [[Collate-Context-Files-into-Context-Vigilance-as-Repo-&-Project]] — parent exploration; this brief is downstream
- [[Tidy-Context-Vigilance-Files-Across-All]] — sibling plan; the catalog's quality depends on tidy's progress
- [[Add-Chroma-Local-UI-Interface]] — sibling plan; the "browse" surface in Act 3 may eventually become a Chroma-backed semantic search
- [[maintain-splash-pages]] skill — functional conventions
- [[theme-system]] skill — token contract
- [[astro-knots]] skill — framework prohibitions and conventions
- [[lossless-flavored-markdown]] skill — markdown rendering for any custom syntax
- `context-vigilance-kit/splash/src/pages/index.astro` — current v0 implementation; rewrite freely against this brief
- `context-vigilance-kit/corpus-manifest.md` — source of truth for the live numbers in Act 3

## Outcome

*(Open. Update with the live URL once the designed splash deploys, plus before/after screenshots for the kit's `context-v/issues/` log of the v0 → v1 transition.)*

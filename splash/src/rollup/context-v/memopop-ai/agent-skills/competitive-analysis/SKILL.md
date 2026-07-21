---
title: "Competitive Analysis Taxonomy"
lede: "Two orthogonal axes for classifying a target company's competitors: the stage ring (concentric circles outward from the target's own stage) and the competitor type (direct / adjacent / indirect / noisewashing). Reference for humans and for any agent writing the competitive landscape section."
date_authored_initial_draft: 2026-06-09
at_semantic_version: 0.0.0.1
usage_index: 0
publish: false
category: Reference
tags: [Competitive-Analysis, Taxonomy, Investment-Memo, Stage-Rings, Competitor-Types]
authors:
  - Michael Staton
augmented_with: "Claude Code (Opus 4.7)"
from: "memopop-ai"
from_path: "context-v/agent-skills/competitive-analysis/SKILL.md"
---
# Competitive Analysis Taxonomy

Competitive analysis for an investment memo is built on two orthogonal axes:

1. **Stage ring** — concentric circles outward from the target company's own stage of development. The target sits at the center; competitors are placed on the ring that matches *their* stage, not the target's.
2. **Competitor type** — how structurally similar the competitor's offering, value proposition, and customer set are to the target's.

Every competitor named in a memo should be tagged on both axes.

## Axis 1 — Stage Rings

The target company sits at the center. Competitors are sorted onto rings by their own funding stage / scale, not the target's. A seed-stage target with `incumbents` on its outer ring tells a very different story than a seed-stage target whose entire landscape is other seed-stage companies.

| Ring | Definition |
|---|---|
| `early stage` | Pre-Seed, Seed, Series A |
| `early scaleup` | Series B, Series C |
| `scaleup` | Series D and beyond, prior to mezzanine |
| `mezzanine` | Pre-IPO rounds where valuation exceeds ~$2–3B |
| `incumbents` | Public companies, or massive PE-owned rollups |

### How to use the rings

- Place the target on its own ring first. Everything else gets classified *relative to that center*, but each competitor is named on the ring matching its own stage.
- A complete competitive picture spans multiple rings outward — being only compared against same-ring peers usually hides the real threat (`noisewashing` incumbents, or scaleups about to enter the segment).
- A target with no `early stage` competitors but many `incumbents` is in a different position than one surrounded by same-ring peers — both facts belong in the memo.

## Axis 2 — Competitor Types

These four types describe the *structural* relationship between a competitor and the target. They are listed roughly inside-out by directness of threat.

### `direct`

Offers **essentially the same set of services/products**, has **essentially the same value proposition**, and sells to **essentially the same customer set**.

**There should be very few of them.** If a memo lists more than a handful of direct competitors, the classification is probably too loose — most of them are actually `adjacent`.

### `adjacent`

A **similar set of services/products**, with **slightly different value propositions**, and **often different ideal customer profiles or market segments**.

These are the companies that could become `direct` competitors with a small product or positioning shift. Often the most important set to track because the boundary is mobile.

### `indirect`

**Analogous services/products** with **comparable value propositions but different framing**, and typically **entirely different target markets**.

The customer could in principle substitute the indirect competitor's solution, but they live in a different category and reach the customer through different channels.

### `noisewashing`

**Incumbent companies that have many products, services, and markets** and **make a lot of noise that they have a similar offering to the challenger company**.

They are not actually a credible alternative in the target's specific category — the overlapping product is a checkbox in a broader suite, not the focus — but their marketing, SEO, sales motion, and analyst presence crowd the category. They show up in buyer shortlists by virtue of size, not fit.

Flag noisewashing explicitly. The memo's job is to distinguish *category presence* from *category competence*.

#### Noisewashing vs. genuine incumbent threat

Incumbents are **mostly** noisewashing but **sometimes** the noise covers a real threat. Google and Microsoft both produce enormous category noise — clicks, mentions, press, analyst coverage — that makes them look like innovators even when the underlying offering is barely used. But sometimes there is sustained heavy investment behind the noise and the offering becomes real. Microsoft Azure is now a genuine threat in cloud services. Google's Waymo is a genuine threat in self-driving cars.

Use this test to separate noise from threat:

| Signal | Noisewashing | Genuine threat |
|---|---|---|
| Coverage / PR / analyst mentions | High | High (same — coverage doesn't discriminate) |
| Actual paying users in the target's specific category | Low | Growing |
| Multi-year sustained capex / headcount / org commitment | No (it's a feature in a suite) | Yes (it's a standalone bet) |
| Listed as the offering's category in the incumbent's own earnings calls / segment reporting | No | Yes |
| Buyers actually shortlist *and choose* them on merit (not procurement convenience) | No | Yes |

If only the first row is "high," it is noisewashing. If the bottom rows light up too, reclassify — usually as `adjacent` or `direct` on the `incumbents` ring, and call out the reclassification explicitly in the memo so the reader sees the judgment.

## Classification Discipline

For every competitor named in the memo:

1. **Tag the ring.** Where on the concentric circles does this competitor sit by *its own* stage?
2. **Tag the type.** Direct / adjacent / indirect / noisewashing — pick exactly one, and prefer the looser classification when on the boundary (most "direct" candidates are really `adjacent`).
3. **Sanity-check counts.** Very few `direct`. Several `adjacent`. A handful of `indirect`. Noisewashing as many as are actually crowding the category.
4. **Watch for ring/type combinations that change the story.**
   - `incumbent` + `noisewashing` is the classic enterprise-software pattern.
   - `early scaleup` + `adjacent` is often the real future competitor.
   - `early stage` + `direct` is a head-to-head race for the same segment.

## Two outputs: exhaustive research, synthesized memo section

Competitive analysis is one of the things venture investors ponder most heavily, and it produces **two artifacts at very different fidelities** in the same pipeline run:

1. **Dedicated competitive research file(s).** These can and should be **long and exhaustive** — every competitor surfaced by research, classified on both axes (ring + type), with full notes, sources, and the reasoning behind any reclassification (e.g., a noisewashing-to-genuine-threat call). This is the analyst's working corpus, not the reader-facing artifact.
2. **Competitive section of the final memo.** This must be **synthesized**, not exhaustive. A reader-facing memo section almost always needs at least one of: a **table** (e.g., competitors × rings, or competitors × dimensions like price/segment/moat), a **list grouped by type or ring**, or a **diagram** (concentric-ring landscape, 2x2, matrix). Raw prose listing every competitor is a failure mode — it signals the synthesis step was skipped.

The rule of thumb: the exhaustive research file is where classification happens; the memo section is where classification *pays off* by collapsing the corpus into something a partner can scan in under a minute.

A memo section with no table/list/diagram and a research file that is short are both red flags that one of the two artifacts is doing the other's job.

## What this skill does NOT do

- Does not author or revise the competitive landscape section of a specific memo — that lives in the orchestrator's pipeline (`apps/memopop-orchestrator/src/agents/competitive_landscape_researcher.py` and `competitive_landscape_evaluator.py`).
- Does not drive those agents at runtime — they have their own prompts. This file is the reference both they and a human author should converge on.
- Does not prescribe how many competitors belong in a memo, or how to source them.

## See also

- [[Grill-Me-Per-Section-User-Input-Moment]] — proposed orchestrator checkpoint that asks the user to pick the synthesis frame (table / ring diagram / grouped list / short list + footnote / 2×2) before the writer collapses the exhaustive research file into the memo section. Competitive is the first adopter. See `context-v/explorations/Grill-Me-Per-Section-User-Input-Moment.md`.
- `apps/memopop-orchestrator/src/agents/competitive_landscape_researcher.py` — the runtime agent that researches the landscape.
- `apps/memopop-orchestrator/src/agents/competitive_landscape_evaluator.py` — the runtime evaluator pass.
- `apps/memopop-orchestrator/src/agents/dataroom/extractors/competitive_extractor.py` — pulls competitive signals out of dataroom documents.
- `apps/memopop-orchestrator/templates/outlines/` — outline YAMLs that define the competitive section's guiding questions per memo type.

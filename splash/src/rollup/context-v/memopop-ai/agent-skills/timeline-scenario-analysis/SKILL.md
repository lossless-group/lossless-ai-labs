---
title: "Timeline Scenario Analysis"
lede: "Answers the second of the two foundational VC questions — *how fast can it get that big?* — by stress-testing the company's current MoM/YoY growth at its actual unit of sale across four scenarios: sustain, improve, plateau, reduce. Operates on the penetration grid produced by the sibling skill [[market-capture-analysis]]; sensitivity tables show what it takes to reach each cell and how time-to-base-case shifts with small growth-rate changes."
date_authored_initial_draft: 2026-06-09
at_semantic_version: 0.0.0.1
usage_index: 0
publish: false
category: Reference
tags: [Timeline-Scenarios, Growth-Sensitivity, MoM-YoY, Investment-Memo, Synthesis]
authors:
  - Michael Staton
augmented_with: "Claude Code (Opus 4.7)"
from: "memopop-ai"
from_path: "context-v/agent-skills/timeline-scenario-analysis/SKILL.md"
---
# Timeline Scenario Analysis

## The second foundational VC question

There are really only two questions a venture investor is asking:

1. **How big can it get?** ← sibling skill [[market-capture-analysis]]
2. **How fast can it get that big?** ← this skill

This skill is where time enters the picture. It takes the penetration grid produced by [[market-capture-analysis]] and asks: given the company's actual current growth at its actual unit of sale, what does it take to reach any given cell — and how sensitive is that timeline to small changes in growth rate? Doing this skill without its sibling produces a growth curve with no destination (compounding toward nothing in particular); see *Why this skill alone is incomplete* below.

## What it answers

> *Given the capture grid from [[market-capture-analysis]] and the company's current growth trajectory at its actual unit of sale, what does it take to reach each penetration cell — and how sensitive is that timeline to changes in growth rate?*

## Inputs

| Input | Source |
|---|---|
| Capture grid | Output of [[market-capture-analysis]] |
| Current growth rate | Reported MoM and/or YoY at the company's unit of sale |
| Unit of sale | Same as the capture grid — must be consistent |
| Cohort behavior (if known) | Retention, expansion, churn — affect whether reported growth is durable |

## The four scenarios

For any starting growth rate (the canonical example: **10% MoM**), the analysis walks four scenarios:

1. **Sustain** — what does it take to *hold* the current growth rate? Sales hiring pace, channel saturation timing, ICP exhaustion. Most companies cannot sustain their current growth rate at scale; saying so is not bearish, it is honest.
2. **Improve** — what would have to be true for growth to *accelerate*? New product line, geographic expansion, channel unlock, pricing change. Often the bull case of the memo.
3. **Plateau** — at what point and at what rate does growth *flatten*? S-curve realism. Where on the S-curve is the company today?
4. **Reduce** — what causes growth to *decelerate* and how fast? Competitive entry, market saturation, macro, ICP exhaustion, churn catching up.

Each scenario lands the company at one or more cells in the capture grid by year (or by quarter for early-stage). The output is a small set of named trajectories pointing at named cells — not an open-ended chart.

## Sensitivity discipline

Growth rate is the lever. Show the timeline impact of small changes:

- 10% MoM held for 24 months vs. 8% MoM vs. 12% MoM
- 10% MoM for 12 months then plateau to 3% MoM
- Time-to-reach-base-case-cell under each of the four scenarios

This is where the analyst earns their pay. The numbers themselves are not the point; the *named trade-off* between scenarios is.

## Output shape

Same exhaustive-vs-synthesized discipline as [[market-capture-analysis]] and [[competitive-analysis]]:

| Artifact | This skill lands as |
|---|---|
| Dedicated research file (exhaustive) | Full four-scenario walk-through with sensitivity tables for every growth-rate variation considered |
| Memo section (synthesized) | A small chart or table comparing the four scenarios on time-to-base-case, plus prose calling out the most consequential sensitivity |

Raw prose listing every scenario value is a failure mode — same as it is for [[competitive-analysis]] and [[market-capture-analysis]].

## Failure modes

- **Compounding a recent growth spike forever.** A 15% MoM month does not mean the company grows 15% MoM for 5 years. Anchor on the multi-quarter trend, not the latest data point.
- **Using YoY when MoM is more honest.** For early-stage, MoM exposes the volatility YoY smooths over. Use both; do not let YoY hide a recent deceleration.
- **No plateau scenario.** Every honest set of scenarios includes a plateau case. A memo with only sustain + improve scenarios reads as advocacy, not analysis.
- **Skipping the base-case time-to-reach number.** "10% MoM gets us to a $1B revenue cell in 4.2 years" is the single most useful sentence this skill produces. If it is not in the memo, the synthesis is incomplete.

## Why this skill alone is incomplete

Timeline scenarios without a capture grid produce a growth curve aimed at nothing in particular. A "company growing 10% MoM" is a fact; without the capture grid from [[market-capture-analysis]], there is no answer to "growing toward what?" — no cells to hit, no base case to defend, no upper bound to anchor against.

Run both skills. They are split to keep each focused, not because they are independent.

## Candidate for [[Grill-Me-Per-Section-User-Input-Moment]]

This section is a strong candidate for a `grill_me:` block. The judgment calls the model should not silently make:

- Which scenario is the **headline** (sustain? improve? plateau-and-still-attractive?)
- Whether to lead with **MoM or YoY** in the sensitivity output
- Which sensitivity variations are worth showing — the analyst could produce dozens; the memo wants 2–4
- Whether to feature **time-to-base-case** or **revenue-at-year-N** as the synthesizing metric

Each has multiple defensible answers and depends on firm/partner/deal preference rather than corpus content.

## What this skill does NOT do

- Does not perform the calculations or build the scenarios — that belongs to runtime agents in `apps/memopop-orchestrator/src/agents/` (no dedicated timeline-scenario agent exists yet at time of writing).
- Does not prescribe the exact memo chart/table layout — that is brand/outline-specific and lives in `templates/outlines/`.
- Does not define the capture grid itself — that is the sibling skill's job, see [[market-capture-analysis]].

## See also

- [[market-capture-analysis]] — sibling skill; produces the capture grid this skill operates on.
- [[competitive-analysis]] — same exhaustive-vs-synthesized discipline applied to competitors.
- [[Grill-Me-Per-Section-User-Input-Moment]] — proposed orchestrator checkpoint this section should adopt.
- `apps/memopop-orchestrator/templates/outlines/` — outline YAMLs that define the traction/growth section's guiding questions.

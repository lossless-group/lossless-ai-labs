---
title: "Market Capture Analysis"
lede: "Answers the first of the two foundational VC questions — *how big can it get?* — by walking revenue and EBITDA across penetration steps of SAM/SOM/TAM at the company's existing pricing and business model. A static if-then picture: the size of the prize at each penetration step, with assumptions named so they can be challenged. Pairs with the sibling skill [[timeline-scenario-analysis]], which answers *how fast?*"
date_authored_initial_draft: 2026-06-09
at_semantic_version: 0.0.0.1
usage_index: 0
publish: false
category: Reference
tags: [Market-Capture, TAM-SAM-SOM, Penetration-Grid, Revenue-Modeling, Investment-Memo]
authors:
  - Michael Staton
augmented_with: "Claude Code (Opus 4.7)"
from: "memopop-ai"
from_path: "context-v/agent-skills/market-capture-analysis/SKILL.md"
---
# Market Capture Analysis

## The first foundational VC question

There are really only two questions a venture investor is asking:

1. **How big can it get?** ← this skill
2. **How fast can it get that big?** ← sibling skill [[timeline-scenario-analysis]]

This skill codifies the analytical structure for question 1. It is deliberately a **static, if-then picture** — it does not yet involve time. It is the size of the prize at each penetration step, with every assumption named so the reader can react to it. The companion timeline-scenario skill is what stress-tests the *path* to any cell in the grid. Doing this skill without its sibling produces a destination with no route; see *Why this skill alone is incomplete* below.

> Terminology note: this document uses the standard **SAM / SOM / TAM** triad (Serviceable Addressable Market / Serviceable Obtainable Market / Total Addressable Market). The author's original term `TOM` is parked here as a seam: if `TOM` means a distinct fourth concept (e.g., Total Obtainable Market — wider than SOM, narrower than SAM), it can be reintroduced as a fourth tier in a later version. Until then, the three-tier standard is used.

## What it answers

> *Given the company's existing pricing (or stated pricing assumptions) and existing business model, what is their top-line revenue and EBITDA at increasing levels of market penetration?*

## Inputs

| Input | Source |
|---|---|
| Pricing | Stated price card, contract data, or explicit assumption flagged as such |
| Business model | Subscription / transaction / take-rate / per-seat / etc. — must be named, not implied |
| Unit of sale | Whatever the company *actually* sells (seats, contracts, transactions, GMV, gallons) — not a generic "customer" |
| EBITDA margin assumption | At-scale or stage-appropriate; cite the comparable if it isn't the company's own |
| SAM | Serviceable Addressable Market — the portion of TAM reachable with the current product and business model |
| SOM | Serviceable Obtainable Market — the portion of SAM realistically capturable given competition, distribution, and execution constraints |
| TAM | Total Addressable Market — total demand if 100% share |

## Penetration grid

Walk revenue and EBITDA across each penetration step, for **each** of SAM / SOM / TAM:

- **1%, 3%, 5%, 10%, 25%, 35%, 50%, 60%**

The grid produces 24 cells per market definition × 2 outputs (revenue, EBITDA) = up to 144 values. The analyst's job is to surface the *handful* of cells that actually matter for the deal narrative, not to dump all 144 in the memo.

## Output shape

Following the same exhaustive-vs-synthesized discipline as [[competitive-analysis]]:

| Artifact | This skill lands as |
|---|---|
| Dedicated research file (exhaustive) | Full SAM/SOM/TAM × 8-step penetration × revenue + EBITDA grid, with every assumption cited |
| Memo section (synthesized) | One table, 3–5 chosen cells, base case named, anchored on the most defensible market definition (usually SAM) with TAM as a ceiling reference |

The memo synthesis must also state:

- A **named "base case"** — the penetration step the investment thesis implicitly assumes — called out explicitly so the reader can react to it.
- **Stated assumptions** for pricing, margin, and market sizing — every one of them is challengeable; hiding them is a credibility leak.

## Failure modes

- **Picking the optimistic cell silently.** "At 25% of TAM the company is a $4B revenue business" is meaningless without saying why 25% and why TAM rather than SAM/SOM. Always state the cell *and* defend it.
- **Margin assumed from training data rather than from comparables or company guidance.** EBITDA margin is the single largest lever in the grid; a generic "30% SaaS margin" is a tell that no one did the work.
- **Conflating "unit of sale" with "customer."** A 10-seat customer at $50/seat is not the same as a 1-seat customer at $500/seat even though both are "1 customer" — the unit of sale drives every subsequent timeline scenario in the sibling skill.

## Why this skill alone is incomplete

Market capture alone produces a static set of cells with no path to any of them. The capture grid is the destination; the timeline scenarios in [[timeline-scenario-analysis]] are what test whether each destination is reachable and at what rate of growth. A memo that ships a capture grid but no timeline scenarios reads as a fantasy: "if the company captured 10% of SAM they'd be a $500M revenue business" is true and useless without an honest accounting of what it would take.

Run both skills. They are split to keep each focused, not because they are independent.

## Candidate for [[Grill-Me-Per-Section-User-Input-Moment]]

This section is a strong candidate for a `grill_me:` block. The judgment calls the model should not silently make:

- Which penetration cell is the **base case** the memo defends
- Which market definition (SAM vs. SOM vs. TAM) the synthesis table anchors on
- Whether to lead with revenue or EBITDA in the headline cell

Each has multiple defensible answers and depends on firm/partner/deal preference rather than corpus content.

## What this skill does NOT do

- Does not perform the calculations or pull the inputs — that belongs to runtime agents in `apps/memopop-orchestrator/src/agents/` (no dedicated market-capture agent exists yet at time of writing).
- Does not prescribe the exact memo table layout — that is brand/outline-specific and lives in `templates/outlines/`.
- Does not address market-sizing methodology itself (top-down vs. bottom-up, etc.). Sizing is an input to this skill, not its subject.
- Does not handle the time dimension — see sibling skill [[timeline-scenario-analysis]].

## See also

- [[timeline-scenario-analysis]] — sibling skill; answers *how fast?* and operates on this skill's output grid.
- [[competitive-analysis]] — same exhaustive-vs-synthesized discipline applied to competitors.
- [[Grill-Me-Per-Section-User-Input-Moment]] — proposed orchestrator checkpoint this section should adopt.
- `apps/memopop-orchestrator/templates/outlines/` — outline YAMLs that define the market section's guiding questions.

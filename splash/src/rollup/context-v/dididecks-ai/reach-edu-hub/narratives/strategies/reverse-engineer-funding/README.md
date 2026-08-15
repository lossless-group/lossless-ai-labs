---
title: "Reverse Engineer Available Funding"
lede: "Grant funding follows a power law: a small number of mega-foundations move most of the dollars, and a fast-growing population of ultra-wealthy individuals — especially 'new money' — hold enormous discretionary giving capacity. So don't spray small applications across a long tail. Concentrate where the money is: study the biggest, most-aligned funders' public footprint, get an intro call to learn their actual strategy, pattern-match across their giving, and design the ask to hit the sweet spot for the largest plausible amount."
date_authored_initial_draft: 2026-06-29
date_authored_current_draft: 2026-07-28
date_last_updated: 2026-07-28
at_semantic_version: 0.0.2.0
status: Draft
augmented_with: Claude Code on Claude Opus 4.8 (initial draft) + Fable 5 (hex-code citation pass)
category: Strategy Narrative
tags:
  - Strategy
  - Grant-Strategy
  - Funder-Research
  - Power-Law
  - Foundations
  - UHNWI
  - Wealth-Transfer
  - Prospect-Research
  - Reach-University
  - Draft
authors:
  - Michael Staton
date_created: 2026-06-29
date_modified: 2026-07-28
from: "dididecks-ai/reach-edu-hub"
from_path: "context-v/narratives/strategies/reverse-engineer-funding/README.md"
---
# Reverse Engineer Available Funding

> **DRAFT — seed for deck design.** A `strategies`-collection narrative; an
> *operating* doctrine for the grants/partnerships team. Audience: Reach/NCAD
> leadership and the development team. Grant-seeking framing throughout. **Figures
> are from wealth/philanthropy reports and flagged `⚠ VERIFY`** — confirm against
> primary sources before presenting. Citations use stable hex codes per the LFM
> convention; definitions in `## Citations` below and in the per-client registry
> (`../../citations/registry.csv`). *Note: this narrative has no corpus strategy
> slug yet (nearest corpus home: `topics/grant-prospecting-tools`) — decide
> whether it becomes a corpus strategy or stays operating doctrine.*

## The through-line

Most fundraising effort is distributed roughly evenly across many prospects.
Available funding is not — it follows a **power law**. A small number of
foundations give out vastly more than the rest, [^6fced1] [^b3229d] and a growing
population of ultra-high-net-worth individuals — especially the newly, self-made
wealthy — sit on enormous *discretionary* giving capacity. [^552e9e] The
implication is simple and uncomfortable: **stop spreading effort evenly;
concentrate it where the dollars actually are.**

The method is to *reverse engineer* the few funders who can write the biggest,
most-aligned checks: study what they already fund, talk to them to learn the
strategy behind it, recognize the pattern, and shape Reach's ask to land in their
sweet spot at the largest plausible size — instead of defaulting to a small,
generic request.

## The shape of the money

*(All figures verified against primary sources 2026-07-28; the June draft's
Mellon/RWJ figures were ~2015-era aggregator data and are replaced below.)*

- **The pool is at a record.** U.S. charitable giving hit **$617.2B in 2025**
  — crossing $600B for the first time (+5.7% current dollars, +3.0% after
  inflation). [^4c940e]
- **Foundations are radically concentrated.** Of ~120,000 U.S. foundations,
  grantmakers giving $50M+ are just **0.1% of funders yet supply 40% of all
  grant dollars**; [^6fced1] the largest 1,000 (~1%) account for roughly half
  to 60% of tracked foundation giving. [^b3229d] Gates — the largest U.S.
  private foundation — paid out $8.0B in 2024; [^1a2cb7] Mellon (~$540M,
  2024) [^f4fc11] and RWJF (~$550M/yr) [^5c3e27] each move over half a
  billion annually. The distribution is a power law, not a bell curve.
- **A wave of new wealth is arriving.** Cerulli now projects **$124T**
  transferring through 2048, of which **~$18T flows to charity**. [^f4987b]
- **The ultra-wealthy population is large and growing.** 556,850 UHNW
  individuals (net worth >$30M) globally in 2025, holding $63.8T; the U.S. is
  home to ~37% (~206,000); [^552e9e] global HNWI wealth reached a record
  $98.3T (Capgemini — investable-assets basis, do not mix with Altrata
  headcounts). [^56142e]

## Why "new money" specifically

⚠ Framing (to validate): newly- and self-made-wealthy donors tend to have **more
discretionary capital** (less locked into legacy structures), **make decisions
faster** than large bureaucratic foundations, and are often **seeking causes that
express their identity and values**. They are more reachable, more flexible on
deal shape, and more willing to make a large bet quickly than a 40-person
foundation with a fixed RFP cycle. The trade-off: less predictable, relationship-
driven, and you have to find them before they've formalized their giving.

## The method — reverse engineering a funder

1. **Study the public footprint.** IRS Form 990s reveal a foundation's actual
   grantmaking history (who, how much, how often); [^a7d443] Candid/GuideStar
   profiles, websites, press, and the principals' public statements fill in
   strategy and values. [^4b538e] (For individuals: their wealth source, prior
   gifts, boards, public causes.)
2. **Get the intro call.** The 990 tells you *what* they funded; a conversation
   tells you *why* — the thesis behind the checks, what they're trying to buy,
   what they're tired of seeing. This is the highest-leverage step.
3. **Pattern-recognize.** Across their giving, find the recurring shape — the
   cause, the geography, the stage, the outcome they keep paying for.
4. **Align to the sweet spot.** Map Reach's work onto that pattern and design the
   ask to the **largest amount that still fits their pattern** — not a default
   small request. Reverse the usual flow: start from what they can/ want to give,
   then shape the program to match.

## Prioritize by the power law

Effort should follow dollars. A handful of deeply-researched, precisely-aligned
asks to the biggest, best-fit funders will out-raise a hundred generic
applications to the long tail. Rank prospects by *capacity × alignment*, and
spend the team's scarce time at the top of that list.

## How to operationalize it

This is exactly what a **funder corpus + agents** are for. Reach already has a
funder corpus under augment-it (`augment-it/clients/reach-edu/` — dozens of
funders, hundreds of documents); the [[agent-workflow-maxxing]] grants front
describes the agent-assisted research, corpus, and brand-voice tooling. Reverse-
engineering is the *strategy*; that corpus + those agents are the *engine* —
they make studying many funders' footprints and pattern-matching tractable for a
small team. The 2026-07-28 mega-gifts-by-topic research (84 verified gifts across
six topic lanes, per-strategy CSVs in the corpus) is the first worked product of
exactly this method. (Cross-links: [[Agent-Workflow-Maxxing]], augment-it's
reach-edu corpus + the First-Pass Corpus Quality Scan plan.)

## Proposed slide outline (Scroll-UI first, ~9 slots)

1. **Cover** — Reverse Engineer Available Funding.
2. **Funding follows a power law** — not a bell curve (the hero data slide).
3. **Two concentrated pools** — mega-foundations + new-money UHNWIs.
4. **Why new money** — more discretionary, faster, identity-driven (with the
   trade-offs).
5. **The method** — study footprint → intro call → pattern-match → align the ask.
6. **Pattern recognition** — find the recurring shape they keep paying for.
7. **Size to the sweet spot** — design the largest ask that fits their pattern.
8. **Prioritize by capacity × alignment** — effort follows dollars.
9. **The engine** — funder corpus + agents make it tractable (→ Agent Workflow
   Maxxing). Close.

## Core messages (one-liners)

- "Funding is a power law — chase the few, not the many."
- "The 990 tells you what they funded; the call tells you why."
- "Start from what they can give, then shape the ask."
- "New money: more discretionary, faster, looking for a cause to call its own."
- "A few precise asks beat a hundred generic ones."

## Open questions / decide before deck build

- ~~Verify every figure~~ **Done 2026-07-28** (primary sources fetched;
  stale Mellon/RWJ figures replaced; Giving USA/Cerulli/Altrata updated to
  current editions; $98.3T re-attributed to Capgemini). Hero numbers chosen:
  **$617.2B (2025 record)**, [^4c940e] **0.1% of grantmakers = 40% of grant
  dollars**, [^6fced1] **$124T transfer / ~$18T to charity**. [^f4987b]
- ~~Find a clean, citable foundation-concentration statistic~~ **Found**:
  Candid FY2022 — grantmakers giving $50M+ are 0.1% of funders and 40% of
  grant dollars; [^6fced1] Foundation 1000 (~1% of funders) ≈ 50–60% of
  tracked giving. [^b3229d]
- How explicit to be about the UHNWI / individual-donor play in a version that
  might be funder-facing (it's candid operating doctrine).
- Tie-in depth to augment-it's funder corpus — reference, or show it.
- Whether this narrative gets a corpus strategy slug of its own.

## Citations

[^4c940e]: 2026, Jun 01. [Giving USA 2026: U.S. charitable giving rose to $617.20 billion in 2025, surpassing $600B for the first time](https://givingusa.org/giving-usa-charitable-giving-rose-to-617-20-billion-in-2025-surpassing-the-600-billion-mark-for-the-first-time/)
[^6fced1]: [Candid, "US social sector: Money" (grantmakers giving $50M+ are 0.1% of funders but 40% of grant dollars, FY2022)](https://candid.org/impact-insights/us-social-sector/money/)
[^b3229d]: 2023, Sep 21. [Candid, Foundation 1000 trends analysis (largest 1,000 foundations ~1% of funders, ~50–60% of tracked grant dollars)](https://candid.org/blogs/a-crash-course-trends-analysis-using-candids-foundation-1000-data-set/)
[^1a2cb7]: [Gates Foundation Annual Report 2024 (total charitable support $8.015B)](https://www.gatesfoundation.org/about/financials/annual-reports/annual-report-2024)
[^f4fc11]: [Mellon Foundation Annual Report 2024 (~650 grants, ~$540M grantmaking)](https://www.mellon.org/annual-report/2024)
[^5c3e27]: [RWJF Financials (annual grantmaking ~$550M; Form 990-PF)](https://www.rwjf.org/en/about-rwjf/financials.html)
[^f4987b]: 2024, Dec 05. [Cerulli: $124 trillion in wealth will transfer through 2048; ~$18T to charity](https://www.cerulli.com/press-releases/cerulli-anticipates-124-trillion-in-wealth-will-transfer-through-2048)
[^552e9e]: 2026, Jun 23. [Altrata World Ultra Wealth Report 2026: 556,850 global UHNW ($30M+) holding $63.8T in 2025; U.S. home to ~37%](https://www.prnewswire.com/news-releases/altratas-world-ultra-wealth-report-2026-finds-the-global-ultra-wealthy-population-reaches-all-time-high-of-556-850-individuals-302806898.html)
[^56142e]: [Capgemini World Wealth Report 2026: global HNWI wealth reached a record $98.3T in 2025 (via Family Wealth Report)](https://www.familywealthreport.com/article.php/Rise-In-High-Net-Worth-Individuals%27-Global-Wealth-In-2025%3B-US-Adds-Most-Millionaires-%E2%80%93-Capgemini-?id=207881)
[^4b538e]: [Instrumentl, "A Nonprofit's Guide To Grant Prospect Research"](https://www.instrumentl.com/blog/grant-prospect-research)
[^a7d443]: [Grant Ready KY, "How to Use IRS Form 990s for Grant Prospecting"](https://www.grantreadyky.org/learn/resources/990s-for-grant-prospecting)

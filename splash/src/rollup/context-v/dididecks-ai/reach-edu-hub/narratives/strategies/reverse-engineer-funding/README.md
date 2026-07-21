---
title: "Reverse Engineer Available Funding"
lede: "Grant funding follows a power law: a small number of mega-foundations move most of the dollars, and a fast-growing population of ultra-wealthy individuals — especially 'new money' — hold enormous discretionary giving capacity. So don't spray small applications across a long tail. Concentrate where the money is: study the biggest, most-aligned funders' public footprint, get an intro call to learn their actual strategy, pattern-match across their giving, and design the ask to hit the sweet spot for the largest plausible amount."
date_authored_initial_draft: 2026-06-29
date_authored_current_draft: 2026-06-29
date_last_updated: 2026-06-29
at_semantic_version: 0.0.1.0
status: Draft
augmented_with: Claude Code on Claude Opus 4.8 (1M context) + web search
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
date_modified: 2026-06-29
from: "dididecks-ai/reach-edu-hub"
from_path: "context-v/narratives/strategies/reverse-engineer-funding/README.md"
---
# Reverse Engineer Available Funding

> **DRAFT — seed for deck design.** A `strategies`-collection narrative; an
> *operating* doctrine for the grants/partnerships team. Audience: Reach/NCAD
> leadership and the development team. Grant-seeking framing throughout. **Figures
> are from wealth/philanthropy reports and flagged `⚠ VERIFY`** — confirm against
> primary sources before presenting.

## The through-line

Most fundraising effort is distributed roughly evenly across many prospects.
Available funding is not — it follows a **power law**. A small number of
foundations give out vastly more than the rest, and a growing population of
ultra-high-net-worth individuals — especially the newly, self-made wealthy — sit
on enormous *discretionary* giving capacity. The implication is simple and
uncomfortable: **stop spreading effort evenly; concentrate it where the dollars
actually are.**

The method is to *reverse engineer* the few funders who can write the biggest,
most-aligned checks: study what they already fund, talk to them to learn the
strategy behind it, recognize the pattern, and shape Reach's ask to land in their
sweet spot at the largest plausible size — instead of defaulting to a small,
generic request.

## The shape of the money

- **The pool is huge.** ⚠ VERIFY — U.S. charitable giving reached ~$592.5B in
  2024 (Giving USA 2025), up ~6.3%.
- **Foundations are concentrated.** ⚠ VERIFY — of ~120,000+ U.S. foundations, a
  few hundred of the largest move a hugely disproportionate share of grant
  dollars (e.g. Gates is the largest; top annual grantmakers like Mellon ~$302M
  and RWJ ~$293M dwarf the median). The distribution is a power law, not a
  bell curve.
- **A wave of new wealth is arriving.** ⚠ VERIFY — Cerulli projects an **$84.4T**
  "great wealth transfer" through 2045, of which **~$11.9T flows to charity**.
- **The ultra-wealthy population is large and growing.** ⚠ VERIFY — ~426,330
  UHNW individuals (net worth >$30M) as of 2025 (Altrata), within ~41.3M HNW
  individuals (>$1M); HNWI wealth ~$98.3T. Counts differ by source/threshold.

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
   grantmaking history (who, how much, how often); Candid/GuideStar profiles,
   websites, press, and the principals' public statements fill in strategy and
   values. (For individuals: their wealth source, prior gifts, boards, public
   causes.)
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
small team. (Cross-links: [[Agent-Workflow-Maxxing]], augment-it's reach-edu
corpus + the First-Pass Corpus Quality Scan plan.)

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

- Verify every figure (giving total, transfer, UHNWI counts, foundation
  concentration) and pick 2–3 hero numbers.
- Find a clean, citable **foundation-concentration** statistic (top N% of
  foundations = X% of grant dollars) — the snippets imply it but don't quantify it.
- How explicit to be about the UHNWI / individual-donor play in a version that
  might be funder-facing (it's candid operating doctrine).
- Tie-in depth to augment-it's funder corpus — reference, or show it.

## Sources (web search 2026-06-29 — deep-read before relying)

- Giving USA 2025 — U.S. charitable giving $592.5B in 2024:
  https://givingusa.org/giving-usa-2025-u-s-charitable-giving-grew-to-592-50-billion-in-2024-lifted-by-stock-market-gains/
- Foundation Source, "From Foundations to DAFs: Key Takeaways From Giving USA's 2025 Report":
  https://foundationsource.com/blog/from-foundations-to-dafs-key-takeaways-from-giving-usas-2025-report-on-philanthropy/
- Arco Lab, "World's 100 largest philanthropic foundations list":
  https://www.arcolab.org/en/worlds-100-largest-philanthropic-foundations-list/
- The Grantsmanship Center, "Top Giving Foundations": https://www.tgci.com/funding-sources/all/top
- Altrata, World Ultra Wealth Report 2025 (UHNWI counts): https://altrata.com/reports/world-ultra-wealth-report-2025
- Cerulli, "Anticipates $84 Trillion in Wealth Transfers Through 2045":
  https://www.cerulli.com/press-releases/cerulli-anticipates-84-trillion-in-wealth-transfers-through-2045
- NPTrust, Charitable Giving Statistics: https://www.nptrust.org/philanthropic-resources/charitable-giving-statistics/
- Instrumentl, "A Nonprofit's Guide To Grant Prospect Research": https://www.instrumentl.com/blog/grant-prospect-research
- Grant Ready KY, "How to Use IRS Form 990s for Grant Prospecting": https://www.grantreadyky.org/learn/resources/990s-for-grant-prospecting

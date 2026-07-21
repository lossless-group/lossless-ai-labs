---
title: "Discrepancy Reconciliation — Founder Deck + Call Notes vs MemoPop"
lede: "Side-by-side reconciliation of every fact-bearing claim where the founder's Series A deck (2026-05-11), the founder call notes (2026-04-29), live primary sources (2026-05-12), and the MemoPop-generated investment memo (ChromaDB v0.0.7, 2026-05-03) intersect or disagree. The call notes substantially close the open questions from v0.0.1.0; what remains is the disclosure-level decision on the Ask slide and a small handful of memo-only-but-keepable category-framing claims."
date_created: 2026-05-11
date_modified: 2026-05-12
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7 (1M context)
semantic_version: 0.0.2.0
tags:
  - Reconciliation
  - Chroma
  - Enhanced-v1
  - DD-Citation-Discipline
  - Fact-Check
  - Founder-vs-Memo
  - Call-Notes-Integrated
status: Draft
from: "dididecks-ai/chroma-decks"
from_path: "context-v/explorations/Discrepancy-Reconciliation__Founder-Deck-vs-MemoPop.md"
---
# Discrepancy Reconciliation — Founder Deck + Call Notes vs MemoPop

> Walks Proto slide by slide against the founder's call notes (the new ground truth), MemoPop's research, and live primary sources. **As of v0.0.2.0, founder call notes from the 2026-04-29 conversation supersede most prior escalations.** The MemoPop memo is now relegated to *supporting category framing* — it never sources a specific Chroma number that ships on Enhanced-v1.

## What changed in v0.0.2.0

- Founder call notes (2026-04-29) ingested as a new primary input. Notes live at `~/content-md/lossless/ChromaDB.md` (outside the repo).
- Five rows previously `escalated-pending` are now `resolved` from the call notes alone: round size + stage (5), lead investor (6), team headcount framing (7 — defer; founder OK with current 12-person slide), syndicate naming (12), use-of-funds split direction (founder anchors in ingestion-agent leadership + outbound enterprise engine).
- Two rows materially clarified: the "Series B Oct 2025 $18M" claim in the MemoPop capital-efficiency section is **confirmed hallucinated** — there is no Series B. Funding history is: pre-seed (rolling notes, May 2022) → priced seed $18M at $75M premoney (April 2023, Quiet leads) → current Series A $12M at $120M post (Quiet leads again).
- New material the deck doesn't currently surface but the founder confirmed in conversation: **Context-1** flagship model, **enterprise ASP $300K/year**, customer breadth (Paramount, Qualcomm, Slack, Notion, Krea AI, Nebius, CoreWeave), **$4M cash + ARR**, **>9 months runway without raise**, board composition (Jeff + Alex Kvame from Quiet).
- Enhanced-v1 narrative restructured around these facts; Market slide retained as analyst framing because management will screen the deck before send.

## Inputs

- **Founder call notes (NEW, primary):** `~/content-md/lossless/ChromaDB.md` — notes from a 2026-04-29 call with Jeff Huber. Includes financing history, current round details, customer list, ASP, runway, board, and product-cadence quotes.
- **Founder deck:** `corpus/management-supplied/2026-05-11_Chroma-Series-A_MS-Resort.pdf` — 14 pages, captured 2026-05-11. The artifact Jeff presents from live.
- **Live primary sources** checked 2026-05-12:
  - GitHub `chroma-core/chroma`: **27,915 stars · 2,241 forks** · created 2022-10-05
  - PyPI `chromadb`: **13,780,462** monthly downloads · 3,710,469 weekly · 597,664 daily
  - npm `chromadb`: **765,383** monthly · 185,136 weekly · ~25K daily
- **MemoPop memo:** `corpus/memos/memopop-generated/ChromaDB-v0.0.7/` — generated 2026-05-03. Fact-check pass classifies 39 of its claims as `unverifiable`, 3 as `contradicted`, 5 as needing `correction`. Useful for **directional category framing** only.

## Headline finding

**The founder's call notes are now the operative source.** They confirm the deck's numbers, supersede the memo on funding history, and add concrete material (ASP, cash position, runway, customer breadth, board composition, the Context-1 flagship) that the deck is silent on. **Most of the work in this reconciliation is no longer "memo vs founder" — it's "what of the new founder material should ship on Enhanced-v1."**

The MemoPop memo retreats to supporting research. It can still be cited (in `data-source` attributes) for the Market slide's analyst-consensus framing, but it never sources a specific Chroma claim that ships.

## Funding picture, fully resolved

| | Pre-seed (May 2022) | Seed (April 2023) | Series A (current, May 2026) |
|---|---|---|---|
| **Vehicle** | Rolling convertible notes | Priced round (notes converted) | Priced round |
| **Total at this stage** | (notes, undisclosed) | **$18M** | **$12M target** ($10M committed, $2M available) |
| **Pre-money** | n/a | **$75M** | **$108M** (implied from $120M post − $12M) |
| **Post-money** | n/a | **$93M** | **$120M** |
| **% sold** | n/a | **19.3%** | **10%** |
| **Lead** | (none — operator angels) | **Quiet Capital** (Astasia Myers) | **Quiet Capital again** (Astasia Myers) — second lead |
| **Board** | — | — | Jeff Huber + Alex Kvame (Quiet) |
| **Institutional participation** | — | Quiet, Bloomberg Beta, Air Street Capital, AIX Ventures | Quiet $3M, Bloomberg Beta $250K, AIX Ventures $250K, insider syndicate $4.5M |
| **Operator angels (named)** | Anthony Goldbloom (Kaggle), Nat Friedman (ex-GitHub CEO) | + Naval Ravikant, Max + Jack Altman, Guillermo Rauch (Vercel), Amjad Masad (Replit), Akshay Kothari (Notion), Spencer Kimball (CockroachDB), Jordan Tigani (MotherDuck) | "all institutional insiders participating" |

**Cumulative funded post-Series-A: $30M.** Modest by category. (Pinecone ~$138M / $750M valuation; Weaviate ~$68M / $200M+ valuation per the call-notes comparable table.)

**The MemoPop memo's "$36M total ($18M seed + $18M Series B Oct 2025)" framing is wrong.** The $18M Series B was sourced from a single weak source (SalesTools AI) and never happened. The capital-efficiency section's runway, gross-margin, and unit-economics inferences are downstream of that error and should not be cited.

## Reconciliation table

Legend for **Type**: `contradiction` | `unit-conflation` | `different-thing` | `sequential` | `gap` | `framing`. Legend for **Status**: `resolved` | `founder-confirmed-on-call` | `escalated-pending` | `screening-by-management` (i.e. on the slide but flagged for Jeff's review).

| # | Slide | Claim | Founder | Memo | Live (2026-05-12) | Type | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | 03 Traction | GitHub stars | **27k** (call notes: 27.7K) | 12,000+ | **27,915** | contradiction | Use founder. Live confirms. Memo is ~18 months stale. | resolved |
| 2 | 03 Traction | Downloads | **14M monthly** | 15M+ weekly npm | PyPI 13.78M/mo, npm 0.76M/mo | unit-conflation | Use founder ("14M monthly downloads"). Combined PyPI+npm monthly ≈ 14.5M, matches. Memo's "15M weekly npm" was a units error. **Don't add "PyPI" qualifier — that would be a new conflation.** | resolved |
| 3 | 03 Traction | Cloud teams | **50K** | "500K+ MAU" | n/a | different-thing | Use founder (50K cloud teams). Memo's MAU is unverified and measures the OSS user base — different denominator, doesn't contradict. Don't add MAU. | resolved |
| 4 | 03 Traction | Cloud run rate | **$2.4M** | (silent) | n/a | gap | Use founder. | resolved |
| 5 | 15 Ask | Round size & stage | "raising $12M" / "Series A" | "$18M seed (Apr '23) + $18M Series B (Oct '25)" → $36M total | n/a | sequential (memo also wrong about Series B) | Use founder. The $18M Series B is hallucinated — drop entirely. Funding history is pre-seed → seed $18M @ $75M premoney → current Series A $12M @ $120M post. Quiet leads both priced rounds. | resolved (call-notes confirmed) |
| 6 | 15 Ask | Lead investor (current round) | (deck is silent) | (silent for current) | n/a | gap | **Quiet Capital again.** Disclosure level on the slide is a separate decision (max disclosure / middle / conservative — see §"Open disclosure decisions" below). | founder-confirmed-on-call |
| 7 | 10 Team | Headcount | 12 on slide | "~25 employees" (unverified, capital-efficiency section) | n/a | different-thing | Use founder. The 12 on the slide are the visible team / leadership the deck wants to surface; total HC isn't load-bearing. **No "12 of N" sublede unless founder asks for it.** | resolved |
| 8 | 09 Competition | Pinecone share / framing | (positioned bottom-left on matrix) | "30% overall market share, managed-only" | n/a | framing | Use founder positioning. Memo's specific share number is unverified per fact-check. The matrix already encodes the strategic argument; no share number ships. | resolved |
| 9 | 09 Competition | Chroma market share | (orange dot, top-right; no number) | "25% OSS / 15% overall" | n/a | framing | **Omit any specific share number.** Founder didn't claim, memo unverified. The orange-dot positioning carries the leadership claim visually; that's enough. | resolved |
| 10 | 09 Competition | Competitor list | Opensearch · Pinecone · Turbopuffer · Glean · "Labs" · In-house | Pinecone · Weaviate · Qdrant · Zilliz/Milvus | n/a | framing (different-thing — different question) | Use founder. His list answers "where do we sit on the open/platform axis"; memo's lists vector-DB peers. Both can be true, the founder's framing is the strategic one. | resolved |
| 11 | 04 Market (NEW) | TAM / CAGR | (silent) | "$113B → $250B; ~45% CAGR; $28B SAM" | n/a | gap (memo-only addition) | **Keep slide.** Numbers ship as analyst-cited framing (cite IDC + Gartner directionally, no fabricated report URL). All numbers visible on the slide flagged in `data-source-status` as `memo-borrowed-directionally`. **Management screens before send.** | screening-by-management |
| 12 | 11 Backed by (NEW) | Capital syndicate | (deck silent) | partial list (capital-syndicate section) | n/a | gap | **Use call notes (full + correct list).** Lead callout = Quiet Capital (Astasia Myers, both rounds). Institutional grid: Bloomberg Beta, Air Street Capital, AIX Ventures. Operator-angels grid: Kimball, Tigani, Rauch, Masad, Kothari, Goldbloom (Kaggle), Naval, Max + Jack Altman. Pre-seed mention: Goldbloom + Nat Friedman. | founder-confirmed-on-call |
| 13 | 07 Case Study | xAI quote / Grok integration | full slide content | (silent on xAI specifically) | n/a (verifiable on Chroma blog) | gap | Use founder. Add an "Also powering" logo strip below from call notes: Paramount, Qualcomm, Slack, Notion, Krea, Nebius, CoreWeave. | resolved |
| 14 | 12 Roadmap | Token throughput target | "400 → 10k tok/s" | (silent) | n/a | gap | Use founder. | resolved |
| 15 | 12 Roadmap | Single-index size target | "250M → 100B" | (silent) | n/a | gap | Use founder. | resolved |
| 16 | 03 Traction | "Authored Context Rot report" | claim on slide | (silent) | verifiable on trychroma.com/blog | gap | Use founder. | resolved |
| 17 | 02 Opening | "Agents will automate knowledge work…" | headline | (no equivalent) | n/a | framing | Use founder. | resolved |
| 18 | 04 Bottleneck | "Bottleneck is no longer reasoning failures, it's context and memory failures" | headline | (memo frames as "AI-native search infrastructure") | n/a | framing | Use founder. | resolved |
| 19 | (omit) | Gartner Visionary status | (not asserted) | "Gartner 2025 Vector DB Magic Quadrant Visionary" | unverified | aspirational | **Omit.** Memo asserts, fact-check tags `unverifiable`, founder didn't claim it. | resolved |
| 20 | (omit) | Forrester developer-preference | (not asserted) | "40% of AI developers prefer ChromaDB for prototyping" | unverified | aspirational | **Omit.** Same. | resolved |
| 21 | 11 Business Model (NEW LINE) | Enterprise ASP | (deck silent) | (memo silent) | n/a | gap (call-notes-only addition) | Add: *"Enterprise ASP — $300K/year"* as a small footnote on the Enterprise tier. Founder-confirmed on call. | founder-confirmed-on-call |
| 22 | 13 Capital Efficiency (NEW SLIDE) | Comparable funding | (deck silent) | (silent) | publicly verifiable per call-notes table | gap (call-notes-derived addition) | Add new slide: Pinecone $138M / $750M · Weaviate $68M / $200M+ · **Chroma $30M post-A / $120M**. Story: more brand, more adoption, less capital. | founder-confirmed-on-call (table is from call notes; competitor numbers verifiable) |
| 23 | 12 Roadmap (REFRAMED) | Product cadence | three-stream chart (Sync · Database · Agent) | (silent) | n/a | framing | Reframe with founder's words from call: *"Frontier models — done. Search agent — done. Ingestion agent — next."* Same three streams; sharper headers. | founder-confirmed-on-call |
| 24 | 07 Case Study (NEW STRIP) | "Also powering" customer logos | (deck shows 13 logos on slide 3) | (memo names Replicate + LangChain only) | n/a | gap (call-notes addition) | Add small "Also powering" logo strip below xAI block: Paramount, Qualcomm, Slack, Notion, Krea, Nebius, CoreWeave. Crawl-fetch-ingest for the SVGs. | founder-confirmed-on-call |
| 25 | (DROPPED) | Gross margin footnote on slide 11 (Business Model) | (founder silent) | "75–85% gross margins on managed Cloud" | unverified | gap (memo-only inference) | **Drop.** No founder gross margin or unit economics provided. Even framed as "infra-software benchmark," it implies Chroma has those margins. | resolved |
| 26 | (DROPPED) | "24–36 months runway" line on slide 14 (Use of Funds) | "9+ mo without raise; $4M cash + ARR" | "24–36 months runway" | n/a | gap (memo-only inference) | **Drop the line.** Use of Funds describes *what the money does*, not how long it lasts. Founder's actual runway figure is on a different fact basis (pre-raise) and shouldn't be extrapolated. | resolved |
| 27 | (DROPPED) | "MongoDB / Elastic / Confluent precedent" footnote on slide 11 | (founder silent) | implied by capital-efficiency-section comparables | n/a | framing (memo-only) | **Drop.** Category-history claim Chroma didn't make; not strong enough to stand without founder validation. | resolved |
| 28 | 15 Ask (NEW LINE) | Fast facts: cash + AR + runway + board | "9+ mo without raise; $4M cash + ARR" (call); founder confirms 2026-05-12: **$4M cash + AR · 9–12 months runway without raise (current burn, no cuts) · Board: Jeff Huber + Alex Kvame (Quiet)** | (silent) | n/a | gap (call-notes addition + founder confirmation) | Add as small muted footnote on the Ask slide. Pro-VC convention: *cash on hand + AR = runway without raise* is the standard first question. Surfacing it preempts the question and signals raising-from-strength. The **"current burn, no cuts"** qualifier is load-bearing — pro VCs occasionally see inflated runway figures that assume hypothetical cuts; stating "no cuts" upfront signals the founder is being straight. | founder-confirmed-on-call (with 2026-05-12 disclosure-level confirmation) |

## Open disclosure decisions (Ask slide only)

The Ask slide (#15) is the one place where founder discretion is most consequential. Three postures, ranked from most to least disclosure:

1. **Maximum disclosure** — *"Series A · $12M at $120M post · Quiet Capital leading again (their second lead) · $10M committed by insiders · $2M available."* Best for a tightly-pre-qualified LP list; signals momentum and insider conviction.
2. **Middle** — *"Series A · $12M · led by Quiet Capital · $10M committed by insiders."* Drops post-money (which anchors negotiations). Good default if the deck might leak or be forwarded.
3. **Conservative (current Proto)** — *"raising $12M"* with no further detail. Leaves the conversation entirely for the meeting.

**Default recommendation: Middle.** Names the lead (which strengthens the deck), shows insider commitment (which signals momentum), but doesn't anchor valuation.

Founder picks; reflect in slide 15 on the next iteration.

## Discipline notes for Enhanced-v1

**The founder is the source.** The call notes + the deck are the primary inputs. The MemoPop memo is now *background research* — it can be cited in `data-source` attributes for the Market slide's analyst framing, but it does not source a specific Chroma claim that ships.

**Citation discipline.** Every fact-bearing line in Enhanced-v1 carries `data-source` and `data-source-status` attributes. Status values used:
- `founder-deck` — appears in the founder's PDF
- `founder-call-2026-04-29` — from the founder call notes
- `live-verified` — verified against a primary source (GitHub API, PyPI, etc.) at `data-source-checked`
- `memo-borrowed-directionally` — analyst framing only (only used on the Market slide, screened by management before send)
- `analyst-consensus` — cited industry analyst (IDC/Gartner/Forrester) without claiming a specific report URL

**Management screens before send.** Per user instruction (2026-05-12), Enhanced-v1 in its current form goes to Jeff for review before any external distribution. The Market slide and any analyst-framed numbers are flagged for his veto.

## Cross-references

- Plan: [[../plans/Author-Enhanced-v1-from-MemoPop-Research]]
- Enhanced-v1 narrative: [[../../../../context-v/narratives/ChromaDB_Deck-Outline__Enhanced-v1]]
- Proto narrative: [[../../../../context-v/narratives/ChromaDB_Deck-Outline__Proto]]
- Founder deck: `corpus/management-supplied/2026-05-11_Chroma-Series-A_MS-Resort.pdf`
- **Founder call notes (primary source as of v0.0.2.0):** `~/content-md/lossless/ChromaDB.md` (outside repo; user's content vault)
- Memo (consolidated): `corpus/memos/memopop-generated/ChromaDB-v0.0.7/7-ChromaDB-v0.0.7.md`
- Memo (densest fact reference): `corpus/memos/memopop-generated/ChromaDB-v0.0.7/8-one-pager-content.json`
- Memo (fact-check audit): `corpus/memos/memopop-generated/ChromaDB-v0.0.7/4-fact-check-verified.md`
- DD-citation spec: [[../../../../context-v/specs/Dididecks-AI-DD-Ready-Citation-and-Source-Access]]

---
title: "ChromaDB · Deck Outline · Enhanced-v1"
lede: "The first enhanced variant of Chroma's Series A pitch — diverging from Proto by integrating founder call notes (2026-04-29), live-checked primary sources (2026-05-12), and a tightly-screened layer of analyst-cited category framing. Adds three substantive new slides (Market, Backed by, Capital Efficiency) plus a reframed Use of Funds; locks in the funding picture, the syndicate, the enterprise ASP, and the Q4 2026 revenue milestone. Authored as one coherent through-line so design improvisation can reason about the deck holistically. Management (Jeff Huber) screens before send."
date_authored_initial_draft: 2026-05-11
date_authored_current_draft: 2026-05-12
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-12
at_semantic_version: 0.1.2.0
status: Draft
augmented_with:
  - Claude Code on Claude Opus 4.7 (1M context)
authors:
  - Michael Staton
category: Deck Outline
tags:
  - ChromaDB
  - Deck-Outline
  - Enhanced-v1
  - Whole-Deck-Variant
  - Diverges-From-Proto
  - Series-A-Fundraise
  - Founder-Call-Notes-Integrated
  - Management-Screened
deck_variant: Enhanced-v1
deck_slug: pitch
deck_route: /scroll/pitch/enhanced-v1/
deck_repo: lossless-group/chroma-decks
deck_branch: development
diverged_from: ChromaDB_Deck-Outline__Proto.md
diverged_at_commit: 06d5e59
date_created: 2026-05-11
date_modified: 2026-05-12
from: "dididecks-ai/chroma-decks"
from_path: "context-v/narratives/ChromaDB_Deck-Outline__Enhanced-v1.md"
---
# ChromaDB · Deck Outline · Enhanced-v1

> **Read this end-to-end before designing.** Enhanced-v1 is meant to be improvised as a whole deck, not slide-by-slide. The narrative arc, voice, and visual register described in §§ 1–4 below are load-bearing — they tell the agent *why* the slide order is what it is and *how* to keep the pacing coherent. The slide-by-slide section (§5) is the spec; the through-line in §1 is the rationale. If a design choice on one slide breaks the through-line, the through-line wins.
>
> **Source discipline (locked at v0.1.2.0):** the founder's call notes (2026-04-29, `~/content-md/lossless/ChromaDB.md`) and the founder's deck (2026-05-11) are the operative sources. The MemoPop memo retreats to *background research* — it sources only the analyst framing on the Market slide (#4), and even that is flagged for management screening before send. **Management (Jeff Huber) reviews this deck before any external distribution.**

## 1. The through-line (the narrative arc, end to end)

Enhanced-v1 tells one continuous story in three movements. The reader (a Series A LP) should leave each movement with a specific, accumulating conviction.

**Movement I — "There is a real category here, and Chroma already leads it." (slides 1–4)**
Open with the future-state premise (agents automate knowledge work everywhere). Establish that Chroma is *already* one of the leading brands in developer AI by the numbers. Then ground that lead in a real, sized, growing category — not a niche bet. By slide 4, the LP knows: this is a category that will be big, and this company is its open-source leader.

**Movement II — "And here is the actual technical and strategic insight." (slides 5–9)**
Pivot from market scale to product reasoning. The bottleneck framing is the deck's intellectual centerpiece — *reasoning isn't the constraint anymore, context is.* Then show what the layer looks like (Chroma as the missing piece), why it's hard (the system + data problem), who it's for (two segments), and proof it works (xAI Grok, plus a quiet "also powering" strip of Paramount, Qualcomm, Slack, Notion, Krea, Nebius, CoreWeave). By slide 9, the LP knows: this team has correctly named the next infrastructure layer and is shipping it at production scale across enterprise, neoclouds, and frontier-AI.

**Movement III — "And here is why it's defensible, who's behind it, and how the economics work." (slides 10–16)**
Defend the position (competition slide), name the team, name the syndicate that has already led twice (Quiet Capital), show the open-core economics with the enterprise ASP, the roadmap stated in the founder's own product cadence, the capital-efficiency story (Chroma has built more brand and adoption with a fraction of competitors' capital), the use of funds tied to a concrete Q4 2026 revenue milestone, and close on the ask. By slide 16, the LP knows: the moats are real, the people are right, the lead is doubling down, the money has a job, the milestone is named, and the math works.

**Holding it together:** every slide should feel like the same deck. The visual register is *technical-credible, lowercase-comfortable, generous-whitespace, surgical-color* — the same register trychroma.com uses (see [[../explorations/Chroma-Brand-and-Deck-Notes]]). Color is information, not decoration; the orange means something every time it appears. Typography is Inter for everything except code (IBM Plex Mono). The pixel-art icons (cubes / brush / terminal / airplane) are recurring motif markers — they bookend the deck on the cover and closer.

## 2. Voice (the founder, in his own words)

Jeff Huber's voice on the existing Proto deck and on the 2026-04-29 call is **declarative, technical, restrained, lowercase-comfortable**. Lines like:

- "Agents will automate knowledge work at every organization on earth."
- "The bottleneck is no longer reasoning failures, they are context and memory failures."
- "Chroma makes the context and memory infrastructure for AI."
- "Every agent needs context and memory."
- (From the call, unprompted opener:) "**Context for Agents.**"
- (From the call, on product cadence:) "**Frontier models — done. Search agent — done. Ingestion agent — next.**"

These read like a thesis-statement cadence — short, present tense, no hedging. **Enhanced-v1 must preserve this voice on every founder-voice headline.** Where Enhanced-v1 adds new copy (analyst framing on the Market slide, syndicate names, fund allocations, capital-efficiency comparisons) it speaks in a slightly more *expository* voice — still terse, still lowercase-comfortable, but allowed to use words like "category," "$X TAM," "led by," "more brand, more adoption, less capital." The founder's voice is for assertion; the supporting voice is for substantiation. Never blend them in the same line.

**Anti-patterns we explicitly reject:**
- VC-deck filler ("disruptive," "best-in-class," "synergies," "leveraging")
- Hedged claims ("we believe," "we think," "could be")
- Adjective stacks ("scalable, secure, performant")
- Memo-style framings as Chroma claims ("Gartner Visionary," "40% of developers prefer us," "75–85% gross margins") — these are unverified per the MemoPop fact-check pass and the founder didn't put them on the deck or in the call. They do not appear on Enhanced-v1.

## 3. Visual register (so improvisation stays inside the lane)

Bring forward verbatim from the brand notes; this section is what improvisation should hold to:

- **Background:** white (`var(--color-background)` resolves to `#ffffff` in light mode). Cards/dividers may use `--muted` `#f5f5f5` for surface separation. Never use color as background.
- **Primary text:** near-black `#0a0a0a` for body, **warm `#27201c` `--color-chroma-black` for the wordmark and hero typography**. The two are not interchangeable — the warm tone is identity-load-bearing.
- **Accent — the orange:** `#f05100` `--chart-1` used surgically. Examples: the Chroma dot on the competition matrix; a subtle highlight under "Memory & Context" or "context engineering"; the `+ Enrichment (Sync-1)` label on the roadmap. **Rule of thumb: at most one orange thing per slide, and it should mean something.**
- **Accent — the cobalt:** the founder's deck uses a cobalt blue (~`#1a73e8`) for "Memory & Context" and "The missing piece" callouts. This is the second accent. Use only on slide 5 (the bottleneck/solution slide) and slide 6 (difficult problems mini-stack), where it carries the "this is the named missing layer" semantic.
- **Typography:** Inter, weight scale 300–700. Headlines 600–700, body 400, labels 500. IBM Plex Mono only for code or numeric stat values where mono adds legibility.
- **Density:** slides should feel *spacious*. The Proto baseline already gets this right — preserve it. New slides (Market, Backed by, Capital Efficiency, Use of Funds) should not be denser than the Proto slides.
- **Iconography:** the four pixel-art icons (yellow cubes, blue brush, green terminal, red airplane) appear on slides 1 and 16 (cover and closer) as a recurring motif. Source assets: `public/brand/icons/` (currently SVG approximations; founder's actual assets are in the PDF and need extraction or replacement).
- **Wordmark:** the two-overlapping-circles mark in cobalt + amber appears at top-right of every slide except the cover (where it's centered with the wordmark) and closer. Currently rendered via `<ChromaMark />`.

## 4. What changed from Proto and why

Three structural changes:

1. **Three new slides + one reframed slide:**
   - **Slide 4 — Market** (NEW, between Proto's slides 3 and 4): sizes the category. *Analyst-cited framing only* — flagged for management screening. Without it, the LP is asked to take Movement I's "leading brand" claim on faith of stats alone. The market slide grounds it in an analyst-cited category size and growth rate, sourced from MemoPop's `2-sections/05-colossal-market-size.md`.
   - **Slide 11 — Backed by** (NEW, between Proto's team and business-model): names the lead and syndicate from both the seed and the current Series A. **Quiet Capital led both rounds** — that's the anchor signal. Confirmed in the founder call notes; ships without escalation.
   - **Slide 13 — Capital Efficiency** (NEW, between Proto's business-model and roadmap): the "more brand, more adoption, less capital" argument. Pinecone $138M / $750M; Weaviate $68M / $200M+; Chroma $30M post-A / $120M. This story is stronger than the Market slide for this audience and is fully sourced from facts in the call notes + verifiable competitor public funding.
   - **Slide 14 — Use of Funds** (NEW, between Proto's roadmap and ask): explicit allocation of the $12M, anchored not in months-of-runway but in the *milestone the money buys* — **$10M run rate by Q4 2026** (the founder's stated GTM milestone, already on the Proto Ask slide). The Proto deck jumps from roadmap to ask with no allocation; LPs always ask. With this slide, the use of funds maps directly to the milestone.

2. **Numbers reconciled against live primary sources and founder call notes** — full audit in [[../../client-sites/chroma-decks/context-v/explorations/Discrepancy-Reconciliation__Founder-Deck-vs-MemoPop]]. Headline:
   - **27k stars** stays (live: 27,915 as of 2026-05-12; founder cites 27.7K). Memo's "12k" is stale.
   - **14M monthly downloads** stays (combined PyPI 13.78M + npm 0.76M ≈ 14.5M monthly). Memo's "15M weekly npm" was a units error.
   - **50K cloud teams** stays (founder's number). Memo's "500K MAU" measures a different denominator (OSS user base) and doesn't ship.
   - **$2.4M cloud run rate** stays (founder's number).
   - **Round resolved:** Series A · $12M at $120M post · Quiet Capital leads again (their second consecutive lead) · $10M committed by insiders · $2M available · ~10% of company. The MemoPop "$18M Series B Oct 2025" claim was hallucinated; dropped entirely.

3. **Citation discipline** — every fact-bearing line in Enhanced-v1 has a `data-source` HTML attribute or comment pointing at the source (call notes file, deck PDF + page, live URL + ISO date, or memo file path), plus a `data-source-status` flag (`founder-deck` | `founder-call-2026-04-29` | `live-verified` | `memo-borrowed-directionally` | `analyst-consensus`). Invisible to the rendered slide; visible to any DD reviewer doing source-trace.

**What didn't change:** the founder's voice on every existing headline. The visual register. The slide order from Proto where Enhanced-v1 doesn't insert a new slide. Slide 5 stays merged (Bottleneck + Solution as one slide).

**What was rejected from earlier drafts:**
- Gross-margin footnote on slide 12 (Business Model) — no founder GM provided; dropped.
- "24–36 months runway" line on slide 14 (Use of Funds) — memo-only inference; dropped. Use of Funds anchors in the **revenue milestone** instead.
- "MongoDB / Elastic / Confluent precedent" footnote on slide 12 — Chroma didn't make this lineage claim; dropped.

## 5. The 16 slides

Conventions used below:

- **Stays from Proto:** content / layout that carries forward unchanged from Proto's spec.
- **Changes in Enhanced-v1:** specific divergences from Proto.
- **Sources:** the source backing each fact-bearing claim. `CALL` = the 2026-04-29 founder call notes (`~/content-md/lossless/ChromaDB.md`). `DECK p.N` = the founder's PDF, page N. `LIVE` = a primary source checked 2026-05-12. `MEMO/{path}` = the MemoPop memo file (only used on slide 4, screened by management).
- **Design-improvisation hints:** what the agent should hold loose vs hold firm when designing this slide.

---

### Slide 1 · Cover

**Stays from Proto:** Centered composition. Wordmark over title. "Confidential" italic. 4-icon row on dotted background.

**Changes in Enhanced-v1:**
- Replace the SVG icon approximations with **Chroma's actual pixel-art icons** extracted from the founder PDF (cubes/brush/terminal/airplane in their original colors yellow/blue/green/red).
- **Optional sublede under the title:** *"Context for Agents."* — the founder's own elevator pitch from the call, shorter and punchier than the longer title. If used, set in muted secondary text.
- Optional small "Series A · 2026" label in bottom-left, gray-on-white, very subtle.

**Sources:** DECK p.1 (title, layout, icons). CALL ("Context for Agents" — founder's unprompted opener).

**Design hints:** Resist the temptation to add anything else here. The cover's job is brand-establish + topic-frame. The dotted background grid behind the icons is part of the look — keep it.

---

### Slide 2 · Opening

**Stays from Proto:** Centered, single large headline. Wordmark top-right.

**Headline (verbatim, do not edit):** "Agents will automate knowledge work at every organization on earth"

**Changes in Enhanced-v1:** None. This slide is perfect as is.

**Sources:** DECK p.2.

**Design hints:** Less is more. Don't add a sublede, don't add a visual.

---

### Slide 3 · Traction

**Stays from Proto:** Title · 4 stat cards · "Context Rot" subhead · customer logo grid · "Cloud platform customers" caption.

- **Title:** "One of the leading brands in developer AI"
- **Subhead:** "Chroma authored the Context Rot report and popularized context engineering."
- **Caption:** *Cloud platform customers* (italic)

**Changes in Enhanced-v1:**
- **Stat cards (4) — keep founder numbers exactly as they are:**
  - `27k` GitHub Stars `→` keep (live-verified at 27,915)
  - `14M` monthly downloads `→` keep label as-is. Do NOT add "PyPI" qualifier — founder's "monthly downloads" reads as combined PyPI + npm (PyPI 13.78M + npm 0.76M ≈ 14.5M). Adding PyPI would be a new conflation.
  - `50K` cloud teams `→` keep (founder's number)
  - `$2.4M` cloud run rate `→` keep (founder's number)
- **Customer logos (13) — replace text-label placeholders with real SVG logos:** xAI · Mintlify · FTAI Aviation · KREA · Skydance Animation · Weights & Biases · Conduit · Qualcomm · Cofounder · The Prompting Company · Isara · Propel · CBS News. Source via the `crawl-fetch-ingest` skill from each company's brand assets / website.

**Sources:**
- Stars: `LIVE: gh api repos/chroma-core/chroma 2026-05-12` (27,915, rounds to "27k") · `DECK p.3` · `CALL` ("27.7K stars · 2.2K forks")
- Downloads: `LIVE: pypistats.org/api/packages/chromadb/recent 2026-05-12` (PyPI 13.78M/mo) · `LIVE: api.npmjs.org chromadb 2026-05-12` (npm 0.76M/mo) · `DECK p.3`
- Cloud teams + run rate: `DECK p.3` (founder-internal)
- Context Rot: `LIVE: trychroma.com/blog`
- Customer logos: each company's brand assets

**Design hints:** The most data-dense slide in the deck. Keep the four stat cards equal-weight; the eye should bounce, not get caught. The logo grid is the visual signal of *enterprise + frontier-AI + media* breadth — let xAI lead and CBS News close.

---

### Slide 4 · Market (NEW — analyst framing, screened by management)

**Why this slide exists:** Without it, the LP has to take "leading brand" on faith of usage stats alone. With it, the deck establishes that Chroma is leading a *category that will be big*, not just a niche.

**Source discipline:** all numbers on this slide are **analyst framing** sourced from the MemoPop memo, classified `data-source-status="memo-borrowed-directionally"`. Per the user instruction (2026-05-12), this slide is **flagged for Jeff's review before send**. He may edit any number, replace the framing, or veto the slide entirely.

**Composition:** Centered, three-tier layout. A single large number at top (TAM), the growth rate as a subtle curve or sparkline below, the SAM as a third element.

**Content (treat as analyst-cited framing, not Chroma claim):**
- **Headline:** "A category sized at $100B+, growing 35–45% per year."
- **Three numbered framings:**
  - **TAM** `$113B` → `$250B` by 2030 (AI infrastructure spending where vector + context-search is load-bearing)
  - **SAM** `$28B` developer-first, open-source segment
  - **CAGR** `~45%` through 2030 (vector-DB segment)
- **Sublede (one line):** "Vector + context-search is becoming the default infrastructure layer for AI applications, the way object storage became the default for cloud."

**Sources:** `MEMO/2-sections/05-colossal-market-size.md` for all three numbers, `data-source-status="memo-borrowed-directionally"`. Cite IDC + Gartner directionally without claiming a specific report URL.

**Design hints:** This slide is the LP-conversion moment of Movement I. Big numbers, lots of white space, no chart-junk. The sublede analogy ("the way object storage became the default for cloud") is meant to do real work — it lands the *category timing* point in one line. **One slide, one idea.**

---

### Slide 5 · The Bottleneck → Chroma's Solution

**Stays from Proto:** Centered, two-column. Left = bottleneck framing with 3-box stack. Right = Chroma's 5-layer block with side annotations. Cobalt SVG arrow connecting Memory & Context (left) to the right column.

**Left column:**
- **Title (verbatim):** "The bottleneck is no longer reasoning failures, they are <u>context and memory failures.</u>"
- **3-box stack:**
  - Agents · Coding, support, product, operations
  - **Memory & Context** · Learning, Unified real-time context layer · *spotlighted in cobalt*
  - Underlying raw data · docs, code, chat, email, agent traces

**Right column:**
- **Callout (cobalt):** "The missing piece"
- **Title:** "Chroma makes the context and memory infrastructure for AI"
- **5-layer Chroma block with side annotations:**
  - Governance · auth, audit, policy
  - Intelligence · synthesis, querying · ← *Powered by Context-1, our SOTA agentic search model*
  - Database · serverless, scalable · ← *Powered by ChromaDB, the most popular AI-native database*
  - Syncing · slack, github, notion…
  - Evals · tests, drift, versioning · ← *Authored Context Rot Report*

**Changes in Enhanced-v1:** None to copy. The Context-1 side annotation is now extra-load-bearing — per the call notes, it's a **flagship achievement** ("frontier-grade model at agentic search, done"). Keep it as a side annotation here, but note it also appears as a milestone on slide 13 (Capital Efficiency) and is referenced on slide 12 (Roadmap) as "search agent — done."

**Sources:** DECK pp.5–6 (PDF treats as two slides; merged in Proto). `LIVE: trychroma.com/blog/context-rot` for the Context Rot reference. `CALL` for the Context-1 framing as flagship.

**Design hints:** This is the deck's intellectual centerpiece. The cobalt arrow is doing real semantic work — the *literal connection* between the named missing piece and the Chroma layer. One clean SVG arrow. The five-layer block reads like a stack diagram — equal-height layers, layer name bigger than description, side annotations smaller and to the right. This is the slide most likely to get re-asked about; design it to be screenshot-able.

---

### Slide 6 · Difficult Problems

**Stays from Proto:** Centered. Title + 3-box mini-stack on the left + two-column bullet list on the right.

- **Title:** "Context and memory are difficult problems"
- **Mini-stack:** Agents ↕ **Context & memory** (cobalt) ↕ Raw Data
- **Two columns:**
  - **The system problem:** Scalable and serverless indexing and search · Intelligent agentic search · Correctable · Legible · Auditable · Compounding
  - **The data problem:** Permission-aware filtering · Conflicting information · Fragmented information · Continuously changing information

**Changes in Enhanced-v1:** None to content.

**Sources:** DECK p.7.

**Design hints:** A "we know the territory" slide. Two columns deliberately read as *symmetric problem domains* — system + data. Keep them visually balanced. The mini-stack is a callback to slide 5's larger stack.

---

### Slide 7 · Two Segments

**Stays from Proto:** Centered split layout (Teams ↔ Developers). Each side has title, lede, sublede (left only), 3-band mini stack diagram.

- **Left — Context for Teams:** "Agents that know your business" · *Focusing currently on engineering teams with 10–100 engineers* · stack: Slack, MCP, Web → **Chroma** → Raw data (Slack, Notion, Agent traces, Github)
- **Right — Context for Developers:** "Memory and context infrastructure for your own products." · stack: Your Agent, your App → **Chroma** → Your user's raw data (chat, agent traces, email, documents, crm, code, skills, tools, OLTP, OLAP, S3, filesystems)

**Changes in Enhanced-v1:** None.

**Sources:** DECK p.8.

**Design hints:** The vertical divider between the two columns is doing real work — the visual argument that these are *parallel but distinct* GTM motions. The "Chroma" middle band should be visually identical on both sides — same component; the data sources are the variable.

---

### Slide 8 · Case Study (xAI) + "Also powering" strip

**Stays from Proto:** Centered. Title · sublede · two-column (3-row stack left, pull-quote + powering list right).

- **Title:** "Case Study"
- **Sublede:** "Chroma powers the context layer for xAI's Grok"
- **Stack (3 rows):** User (queries to Grok) → Grok (xAI agent · xAI mark) → Chroma (context layer · Chroma mark)
- **Pull quote:** *"Now that we use Chroma for hybrid search, we've saturated our existing evals." — xAI*
- **Powering list:** Grok Collections API · Business Connectors · Consumer Connectors

**Changes in Enhanced-v1:**
- Replace the "xAI" text label with **xAI's actual SVG mark** (sourced via `crawl-fetch-ingest`).
- **NEW: "Also powering" strip below the xAI block** — a small, muted row of 7 logos: Paramount · Qualcomm · Slack · Notion · Krea AI · Nebius · CoreWeave. From the call notes' key-customer list. Visually subordinate to the xAI block (smaller, gray, no individual emphasis). Captioned: *"Also powering"* in italic muted text, no period.
  - **Slack and Notion are also investors** — the dual investor/customer relationship is real and worth a `data-source` annotation, but probably not visually called out on the slide (it would crowd; the LP can ask).

**Sources:** DECK p.9 for the xAI block. `CALL` for the "also powering" customer list (Paramount, Qualcomm, Slack, Notion, Krea, Nebius, CoreWeave).

**Design hints:** The xAI block stays the visual center. The "also powering" strip is a quiet *and there's more* signal — small, single-row, muted gray. The pull quote should feel like a quote — italic, larger weight than body, attribution on its own line.

---

### Slide 9 · Competition

**Stays from Proto:** Top-aligned (the only slide with `align="start"`). Title · 2×2 quadrant matrix · "How we win" right rail.

- **Title:** "Competition"
- **Matrix axes:** X = Component → Full platform · Y = Closed-source ↔ Open-source
- **Dots:**
  - Top-left (open-source / component): Opensearch
  - **Top-right (open-source / full platform): Chroma — highlighted orange**
  - Middle: In-house
  - Bottom-left (closed-source / component): Pinecone, Turbopuffer
  - Bottom-middle: Labs
  - Bottom-right (closed-source / full platform): Glean

**Changes in Enhanced-v1:**
- **Tighten "How we win" copy from 4 short paragraphs to 4 single-line claims** with the elaboration revealed on hover/click (or as smaller gray text below each line, always-visible but visually subordinate). Lines:
  - **vs Vector DBs** — *they're a component; we're the platform.*
  - **vs Labs** — *they push their own gardens; we're model-agnostic.*
  - **vs In-House** — *very few teams will successfully roll their own.*
  - **vs Enterprise Search** — *they don't own the database or the model; search isn't memory.*

**Sources:** DECK p.4 for the matrix and the four claims.

**Design hints:** The orange dot on Chroma is *the* place orange shows up most prominently in the deck; it's load-bearing. Resist adding more competitors; the four-quadrant strategic argument is exactly as crisp as it needs to be.

---

### Slide 10 · Team

**Stays from Proto:** Centered. Title · 6×2 card grid (12 members).

- **Title:** "Team"
- **Row 1 (6):** Jeff Huber (CEO, YC) · Hammad Bashir (CTO, YC, Snap, UC Berkeley) · Matt Brailey (Head of GTM, VP Weka) · Philip Thomas (Webflow, OpenDNS) · Robert Escriva (Lacework, Dropbox, PhD Cornell) · Tanuj Nayak (Yugabyte, CMU DB)
- **Row 2 (6):** Gabriel Shahbazian (Superhuman, Amazon) · Sicheng Pan (UC Berkeley, Sky Lab) · Kyle Diaz (Datadog) · Itai Smith (Amazon, UC Berkeley) · TJ Krusinski (Meta) · Kelly Hong (UC Berkeley)

**Changes in Enhanced-v1:**
- **Replace the initials-in-circles avatars with real headshots** (sourced via `crawl-fetch-ingest` from LinkedIn + Chroma's about page).
- **No "12 of N" sublede** — call notes don't make headcount load-bearing; the 12 visible faces are the slide.

**Sources:** DECK p.10 for names + roles + prior-affiliations. Headshots sourced live.

**Design hints:** Team slides are emotional, not analytical — face + name + brand pedigree in 0.5 seconds per person. Circular avatars (matches Proto), uniform size, no harsh borders. Names in primary text; affiliations in muted text. Keep affiliations to ≤2 brands per person.

---

### Slide 11 · Backed by (NEW — confirmed via call notes)

**Why this slide exists:** LPs reading a Series A deck want to know who's already in the cap table. The call notes confirm a strong syndicate; Quiet Capital's second consecutive lead is the anchor signal.

**Composition:** Centered. Title · lead callout (large) · institutional row · operator-angels grid · pre-seed mention.

- **Title:** "Backed by operators who built this category"
- **Lead callout (large, centered):** **Quiet Capital** · Astasia Myers, lead · *led both rounds (seed and Series A)*
- **Institutional row (smaller, beside or below):** Bloomberg Beta · Air Street Capital · AIX Ventures
- **Operator-angels grid (6, in 2 rows × 3, with affiliation under each):**
  - Spencer Kimball · CockroachDB
  - Jordan Tigani · MotherDuck
  - Guillermo Rauch · Vercel
  - Amjad Masad · Replit
  - Akshay Kothari · Notion
  - Anthony Goldbloom · Kaggle / AIX Ventures
- **Optional secondary line (smaller text):** Naval Ravikant · Max + Jack Altman
- **Pre-seed mention (footnote-size, italic gray):** *"Pre-seed by Anthony Goldbloom (Kaggle) and Nat Friedman (former GitHub CEO)."*

**Sources:** `CALL` (entire syndicate confirmed). `LIVE: trychroma.com/company/seed` for the seed-round announcement.

**Design hints:** Quiet authority. No avatars; just names + brands. Logos of CockroachDB, MotherDuck, Vercel, Replit, Notion, Kaggle if easily sourced — otherwise text-only is fine and more disciplined. The lead callout for Quiet is biggest / first; the syndicate grid is uniform after that. **The "led both rounds" phrasing is the deck's strongest single conviction signal — give it room.**

---

### Slide 12 · Business Model

**Stays from Proto:** Centered. Title · 3 tier cards.

- **Title:** "Open-core, usage-based, enterprise"
- **Open-source:** Free · ChromaDB, self-hosted · → unlimited usage, → community support, → top of funnel
- **Cloud:** Usage-based · fully-managed cloud · → zero ops, → zero friction
- **Enterprise:** Platform-fee + usage · BYOC, SLAs, Support · → SOC 2, SSO, → BYOC dedicated infra · **Enterprise ASP — $300K/year**

**Changes in Enhanced-v1:**
- **Add: Enterprise ASP — $300K/year** as a small footnote / extra line on the Enterprise tier. Founder-confirmed on call. Concrete and slide-worthy.
- **No gross-margin footnote.** No founder gross margin or unit economics provided; dropped.
- **No MongoDB/Elastic/Confluent precedent footnote.** Chroma didn't make this lineage claim; dropped.

**Sources:** DECK p.11 for the three tiers. `CALL` for the ASP.

**Design hints:** Three equal-weight tier cards. Don't make Cloud bigger because it's the monetization story. The progression top-of-funnel → managed → enterprise reads left-to-right. The ASP belongs visually inside the Enterprise card, in smaller weight than the tier title.

---

### Slide 13 · Capital Efficiency (NEW — call-notes-derived)

**Why this slide exists:** This is the deck's strongest single argument for the round, and neither the deck nor the memo currently tells it. **Chroma has built more brand and adoption with a fraction of competitors' capital** — and the syndicate is betting Chroma reaches the same outcome with much less. Sourced from the comparable funding table in the call notes plus public funding records for Pinecone and Weaviate.

**Composition:** Centered. Title · three-column comparison · one-line summary at bottom.

- **Title:** "More brand, more adoption, less capital"
- **Three-column comparison cards:**
  - **Pinecone** · Total funding ~$138M · Valuation $750M · Closed-source, managed-only
  - **Weaviate** · Total funding ~$68M · Valuation $200M+ · Open-source, heavier infra
  - **Chroma** · Total funding **$30M** (post-Series-A) · Valuation **$120M** post · Open-source, lightweight, unified search
- **Bottom line (one sentence, centered):** *"More open, more loved by developers, ~25% of Pinecone's capital — and Quiet leads Chroma's round again."*

**Sources:** `CALL` for the comparable funding table (Pinecone $138M / $750M; Weaviate $68M / $200M+; Chroma $30M post-A). All three competitor numbers are publicly verifiable (Pitchbook, Crunchbase, press releases) and cited in the call-notes file.

**Design hints:** This is a *comparison* slide, not a celebration slide — tone matters. The three columns are equal-weight visually (no implicit "Chroma is biggest"); the *story* is in the *numbers* in the columns, not in visual emphasis. The bottom-line sentence does the explicit framing in restrained voice. **No bar chart, no "we're the best" badging** — let the numbers speak. The Quiet-leads-again line at the bottom ties this slide to slide 11 (Backed by) — same anchor signal, different lens.

---

### Slide 14 · Use of Funds (NEW — anchored in the milestone)

**Why this slide exists:** Proto jumps from roadmap to ask with no allocation. Every Series A LP asks *what is the money for?*. This slide answers that and, critically, ties the allocation to the **revenue milestone** the founder has already named on the Ask slide ($10M run rate). The Use of Funds isn't "X months of runway"; it's "the milestone we're buying."

**Composition:** Centered. Title · 3 allocation cards left-to-right · the milestone bottom line.

**Conditional on founder confirmation of the percentages.** Default split below mirrors the founder's stated bets (ingestion-agent leadership + outbound enterprise engine + continued OSS / brand investment).

- **Title:** "Use of funds"
- **Three allocation cards (placeholder splits — confirm with founder):**
  - **Engineering — 50%** · Database scale (→ 100B index) · Agent throughput (→ 10k tok/s) · Connectors (Postgres, Clickhouse, Databricks, GDrive, Notion, Slack)
  - **Research — 20%** · Context-1 model · Sync-1 enrichment · Fine-tuning capability
  - **Go-to-market — 30%** · Outbound enterprise engine (Matt Brailey) · Developer evangelism · 2× OSS community
- **Bottom line (one sentence, larger weight):** **"To $10M run rate by Q4 2026."**

**Sources:** `CALL` for the bets (ingestion agents, outbound enterprise engine, continued OSS) and the **$10M run rate by Q4 2026** milestone. The percentage split is proposal-pending-founder-confirm; it directionally maps to where the bets are.

**Design hints:** Three allocation cards visually mirror the roadmap (slide 12) — same composition, same proportions. This is intentional: the LP reads the roadmap, then sees the same shape on Use of Funds, and *the money goes where the roadmap goes*. The bottom-line milestone is the *biggest type on the slide* — bigger than the percentages. **The slide is about the milestone; the allocation explains how.** No pie chart; the cards already do the visual work. **No runway-in-months claim** — the milestone is the right anchor.

---

### Slide 15 · The Ask

**Stays from Proto:** Centered. Title (large) · two-column list ("Chroma today" | "Milestones by Series B").

- **Title (founder picks disclosure level — see reconciliation doc § "Open disclosure decisions"):**
  - **Default (middle):** "Chroma is the context layer for agents · Series A · $12M · led by Quiet Capital · $10M committed by insiders"
  - **Maximum disclosure:** "Chroma is the context layer for agents · Series A · $12M at $120M post · led by Quiet Capital (their second lead) · $10M committed · $2M available"
  - **Conservative (current Proto):** "Chroma is the context layer for agents, raising $12M"
- **Chroma today (left):** → Loved by millions of developers · → Full integrated solution · → Proven infra at-scale · → Open-source
- **Milestones by Series B (right):** Research → 3,000 tok/s · Engineering → Massive datasets (100B+) · Marketing → 2× OSS community · **GTM → $10M run rate by Q4 2026**
- **Fast facts (small, muted, single line below the two columns or beside the headline):** *"$4M cash in bank + AR · 9–12 months runway without raise (current burn, no cuts) · Board: Jeff Huber + Alex Kvame (Quiet)"*

**Changes in Enhanced-v1:**
- **Add "by Q4 2026" qualifier to the GTM milestone** (per founder confirmation 2026-05-12). This same milestone anchors slide 14 (Use of Funds) — the deck reads coherently across the two slides.
- **Add a "Fast facts" footnote line** (per founder note 2026-05-12). Professional VCs always ask the same first question: *cash on hand + AR = how much time if no round?* Surfacing it preempts the question and signals the company is raising from strength, not desperation. The **"current burn, no cuts"** qualifier is load-bearing — pro VCs occasionally see runway figures inflated by hypothetical cost reductions; stating "no cuts" upfront signals the founder is being straight. Set in muted, footnote-weight type — visually subordinate to the headline and the two columns.
- **Disclosure level on the headline pending founder pick.** Default is the middle option; founder may go conservative (current Proto) or maximum disclosure.

**Sources:** DECK p.13. `CALL` for the round specifics ($120M post, $10M committed, $2M available, Quiet leads again), the Q4 2026 milestone qualifier, the **$4M cash + AR**, the **9–12 months runway-without-raise (current burn, no cuts) figure**, and the board composition.

**Design hints:** The two-column "today | by Series B" structure is the right shape — current state on the left, future state on the right, the ask in the headline pulling it together. The "→" arrow marker in front of each bullet is part of Chroma's visual vocabulary; preserve it. **The Q4 2026 date on the GTM milestone is the deck's specificity-and-conviction signal in this section** — it tells the LP this isn't a vague aspiration but a named target tied to the use of funds. **The Fast facts line is a quiet professionalism signal** — every pro VC reading the deck checks that box; surface it small, don't make it the headline. The "no cuts" qualifier is small but matters; don't drop it.

---

### Slide 16 · Closing

**Stays from Proto:** Centered. Large headline · sub · ChromaMark · 4-icon row.

- **Headline:** "Every agent needs context and memory"
- **Sub:** "Chroma is building context and memory infra for AI"
- **Visual:** ChromaMark · 4-icon row (same as cover)

**Changes in Enhanced-v1:**
- Use the **real pixel-art icons** (same as cover update on slide 1).
- Optional: a thin gray line below the icons with a CTA: *"hello@trychroma.com · trychroma.com"*. Founder may veto on grounds of "the closing should be a statement, not a transaction."

**Sources:** DECK p.14. CTA from `LIVE: trychroma.com`.

**Design hints:** The closing should bookend the cover — same icons, same dotted background, same wordmark presence. Don't ornament. White space is doing the work, just like on the opening.

---

## 6. Slide map (the order, at a glance)

| # | Title | New / from Proto | Movement | Primary source |
|---|---|---|---|---|
| 1 | Cover (icons replaced; optional "Context for Agents" sublede) | Proto + CALL | I — Premise | DECK + CALL |
| 2 | Opening — Agents will automate knowledge work | Proto verbatim | I — Premise | DECK |
| 3 | Traction — Leading brand in developer AI | Proto (numbers locked, logos sourced) | I — Premise | DECK + LIVE |
| 4 | **Market** — $100B+ category, 35–45% CAGR | **NEW** (analyst framing, screened by management) | I — Premise | MEMO (flagged) |
| 5 | The Bottleneck → Chroma's Solution | Proto (merged 5+6 from PDF) | II — Insight | DECK |
| 6 | Difficult Problems | Proto | II — Insight | DECK |
| 7 | Two Segments — Teams, Developers | Proto | II — Insight | DECK |
| 8 | Case Study — xAI / Grok (+ "also powering" strip) | Proto + CALL | II — Insight | DECK + CALL |
| 9 | Competition — quadrant + how-we-win | Proto (rail tightened) | III — Defense | DECK |
| 10 | Team | Proto (headshots sourced) | III — Defense | DECK |
| 11 | **Backed by** — Quiet leads both rounds + syndicate | **NEW** (call-notes confirmed) | III — Defense | CALL |
| 12 | Business Model — open-core (+ ASP $300K) | Proto + CALL | III — Defense | DECK + CALL |
| 13 | **Capital Efficiency** — more brand, more adoption, less capital | **NEW** (call-notes table + public competitor funding) | III — Defense | CALL + public records |
| 14 | **Use of Funds** — to $10M run rate by Q4 2026 | **NEW** (allocation pending founder; milestone confirmed) | III — Defense | CALL |
| 15 | The Ask — Series A $12M (disclosure level founder-pick) | Proto + CALL | III — Defense | DECK + CALL |
| 16 | Closing | Proto (icons replaced) | Coda | DECK |

**Net change vs Proto: +4 slides (4, 11, 13, 14).** The original plan's "aim for 2–4 net new" guardrail is at the upper bound; if pacing feels heavy on review, Capital Efficiency (13) and Market (4) are the two most-droppable in that order.

## 7. Citation discipline (how the source-trace works)

Every fact-bearing element on every Enhanced-v1 slide carries:

```html
<element
  data-source="CALL ~/content-md/lossless/ChromaDB.md#round-details-for-this-round"
  data-source-status="founder-call-2026-04-29"
  data-source-checked="2026-05-12"
>
  Quiet Capital
</element>
```

- **`data-source`** — relative path or full URL, with `#anchor` if the source has section anchors.
- **`data-source-status`** — one of:
  - `founder-deck` — appears in the founder's PDF
  - `founder-call-2026-04-29` — from the founder call notes
  - `live-verified` — verified against a live primary source at `data-source-checked`
  - `memo-borrowed-directionally` — analyst framing (only used on slide 4 Market, screened by management)
  - `analyst-consensus` — cited industry analyst (IDC/Gartner/Forrester) without claiming a specific report URL
- **`data-source-checked`** — ISO date the source was last verified.

These attributes are **invisible to the rendered slide** — they exist purely for DD source-trace.

## 8. Open decisions (founder picks)

Most Enhanced-v1 questions are now closed by the call notes. Three remain for founder pick:

1. **Ask slide disclosure level** — conservative ("raising $12M"), middle (named lead + insider commitment), or maximum (full post-money + available). Default: middle.
2. **Use of Funds split** — placeholder is 50% engineering / 20% research / 30% GTM, mapping to the bets named on the call. Adjust.
3. **Closing CTA** — optional one-line `hello@trychroma.com · trychroma.com`. Or keep closing as pure statement.

The **Market slide (#4)** is on the deck per user instruction, flagged for management screening. Founder may veto or edit numbers on review.

## 9. Cross-references

- Proto outline: [[ChromaDB_Deck-Outline__Proto]]
- Reconciliation doc (v0.0.2.0, call-notes integrated): [[../../client-sites/chroma-decks/context-v/explorations/Discrepancy-Reconciliation__Founder-Deck-vs-MemoPop]]
- Plan of record: [[../../client-sites/chroma-decks/context-v/plans/Author-Enhanced-v1-from-MemoPop-Research]]
- Brand notes (visual register): [[../explorations/Chroma-Brand-and-Deck-Notes]]
- Three-modes derivation: `chroma-decks/context-v/explorations/Three-Modes-Derivation.md`
- Parent specs:
  - [[../specs/Dididecks-AI-Slide-Decks-as-Code]] (the "decks as code" thesis)
  - [[../specs/Dididecks-AI-DD-Ready-Citation-and-Source-Access]] (the citation discipline this outline honors)
  - [[../specs/Dididecks-AI-Visual-and-Diagram-Component-Library]] (the primitive library that competition matrix, stack diagrams, allocation cards, comparison cards should eventually consume)
- **Founder call notes (primary source):** `~/content-md/lossless/ChromaDB.md` (outside repo; user's content vault)
- Source PDF (git-ignored): `chroma-decks/corpus/management-supplied/2026-05-11_Chroma-Series-A_MS-Resort.pdf`
- Source memo (entire folder, git-ignored, retreating to background research): `chroma-decks/corpus/memos/memopop-generated/ChromaDB-v0.0.7/`
- Pinned Proto: tag `chroma-pitch__proto` on commit `06d5e59`

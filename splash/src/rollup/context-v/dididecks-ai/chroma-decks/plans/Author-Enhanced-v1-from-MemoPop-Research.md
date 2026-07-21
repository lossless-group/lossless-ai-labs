---
title: "Author Enhanced-v1 deck variant from MemoPop research (ChromaDB-v0.0.7)"
lede: "Plan of record for diverging Enhanced-v1 from Proto by ingesting the MemoPop-generated investment memo (corpus/memos/memopop-generated/ChromaDB-v0.0.7/), reconciling the discrepancies between the founder's deck and Alpha Partners' verified research, and authoring concrete slide-by-slide enhancements that ground every claim in citable market data."
date_created: 2026-05-11
date_modified: 2026-05-11
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7 (1M context)
semantic_version: 0.0.1.0
tags:
  - Plan
  - Enhanced-v1
  - MemoPop-Integration
  - Chroma
  - Deck-Improvisation
  - Market-Research
  - DD-Citation-Discipline
status: Draft
from: "dididecks-ai/chroma-decks"
from_path: "context-v/plans/Author-Enhanced-v1-from-MemoPop-Research.md"
---
# Author Enhanced-v1 from MemoPop research

> Plan of record for taking the Proto baseline (tag `chroma-pitch__proto`, route `/scroll/pitch/proto/`) and diverging it into Enhanced-v1 by ingesting the **MemoPop-generated ChromaDB v0.0.7 memo** plus its supporting research artifacts. Enhanced-v1 is the **first variant the founder may present from**; Proto remains the recovery baseline.

## Why this exists

Proto is faithful to the founder's live deck — it says exactly what the founder says. **Proto is not yet substantiated.** The numbers on slide 3 (27k stars, 14M downloads, 50K cloud teams, $2.4M run rate) are stated without source. The competitive narrative on slide 4 is sketched (positioning matrix + four one-liners) but lacks the deeper "why each competitor loses" detail. The ask on slide 13 has a number ($12M) but no market sizing to anchor it.

Meanwhile, **MemoPop has already produced a fact-checked, source-cataloged 8-section investment memo** on ChromaDB at `corpus/memos/memopop-generated/ChromaDB-v0.0.7/`, structured around Alpha Partners' "7 C's" analytical framework:

1. Capital Syndicate
2. Category Leadership
3. CAGR (Compound Annual Revenue Growth)
4. Capital Efficiency
5. Colossal Market Size
6. Counter-cyclicality
7. Cash-on-cash return probability

This memo contains the **market context, citable sources, and quantified projections** that Proto is missing. Enhanced-v1 is where we bring them together.

A second, equally important reason: **MemoPop's verified facts and the founder's deck disagree on at least three numbers — and almost certainly more once we look closely.** Resolving those contradictions is its own structural phase of this plan, not a footnote to ingest. We ship neither a deck that contradicts itself nor a deck that papers over real data. We surface every contradiction, classify it, research it, recommend a resolution, confirm with the founder where they alone can decide, and document the outcome. Enhanced-v1 slide spec does not begin until reconciliation closes.

## Resolving contradictions as discipline

The deck is going to be read by VCs running their own DD process. **They will compare what the founder says against public data, third-party reports, and previously-circulated materials.** If our deck and a publicly-available memo on Chroma disagree, the founder gets a question we didn't prepare them for. The fix is upstream: reconcile *before* we ship.

Contradictions sort into five types, each with a different default resolution:

| Type | Symptom | Default resolution |
|---|---|---|
| **Stale data** | Memo cites a Q4 2025 stat; founder has a fresher Q1 2026 dashboard | **Founder wins.** Cite founder's source explicitly (`data-source="internal-dashboard, 2026-MM"`). |
| **Definition mismatch** | "Downloads/month" vs. "downloads/week"; "cloud teams" vs. "MAU" | **Show both** if both are true and load-bearing. Make the denominator legible. |
| **Aspirational vs. verified** | Founder's deck rounds 12k stars up to 27k for visual punch | **Memo wins.** DD reviewers will check; aspirational numbers fail DD. Use the verified figure with a target line if the founder wants to show momentum. |
| **Strategic framing** | Founder calls it "context layer for agents"; memo frames as "open-source vector database" | **Founder voice wins** on copy; **memo provides the substantiation** under the headline. Both can be true at different layers of the narrative. |
| **Genuine ambiguity** | Round is "$12M Series A" (founder) vs. "$18M seed" (memo) | **Escalate to founder** in writing. No defaults here — Enhanced-v1 cannot ship until the founder names which is current. |

The reconciliation doc this plan produces (`context-v/explorations/Discrepancy-Reconciliation__Founder-Deck-vs-MemoPop.md`) is structured so every contradiction lands in exactly one of these five types, with a recommendation and an explicit gate state: **resolved**, **founder-confirmed**, or **escalated-and-pending**.

**No Enhanced-v1 slide may reference a number that's still `escalated-and-pending`.** That is the hard gate between Phase 2 (Resolve) and Phase 3 (Spec).

## The discrepancies we already see

From `8-one-pager-content.json` (MemoPop's most-concentrated artifact) vs. Proto's slide 3:

| Metric | Founder's deck (Proto slide 3) | MemoPop verified (v0.0.7) | Δ |
|---|---|---|---|
| GitHub Stars | 27k | 12,000+ | 2.25× higher in founder deck |
| Downloads | 14M monthly | 15M+ **weekly** npm | Different cadence; weekly × 4.3 ≈ 64.5M monthly |
| Cloud customers | 50K cloud teams | 500K+ MAU | Different denominator (teams vs. users) |
| Cloud run rate | $2.4M | — | Not in memo |
| Round size + stage | "raising $12M" (no stage) | "**$18M seed**" with full syndicate named | Deck silent on stage + syndicate |

**Some of these are explainable.** The founder's deck is dated 2026-05-11; the memo cites earlier data (the 12k stars figure may simply be older). The npm downloads "weekly" vs. "monthly" is a units-not-magnitude question — both could be true at different snapshots. The teams-vs-MAU distinction is real (a cloud team contains multiple users).

**Some of these need a decision from the founder.** Is this a **$12M Series A** (founder deck) or an **$18M seed** (memo)? Likely the memo is outdated and the round has been re-shaped — but we should verify before committing to either in the deck.

Reconciling these is Phase 2 of this plan — its own structural step, gated against slide spec.

## Inputs (provenance map)

```
corpus/memos/memopop-generated/ChromaDB-v0.0.7/
├── 7-ChromaDB-v0.0.7.md                 ← consolidated memo (515 lines)
├── 8-one-pager-content.json             ← structured one-pager (most-concentrated)
├── header.md                            ← memo cover frontmatter
├── 1-research.md                        ← top-level research summary
├── 1-research/                          ← per-topic raw research (7 files)
│   ├── 01-capital-syndicate-research.md
│   ├── 02-category-leadership-research.md
│   ├── 03-cagr-research.md
│   ├── 04-capital-efficiency-research.md
│   ├── 05-colossal-market-size-research.md
│   ├── 06-counter-cyclicality-research.md
│   └── 07-cash-on-cash-return-probability-research.md
├── 1-competitive-research.md            ← competitor analysis
├── 1-competitive-evaluation.md          ← competitor evaluation
├── 2-sections/                          ← 9 standalone memo section drafts
│   ├── 00-executive-summary.md
│   ├── 01-capital-syndicate.md
│   ├── 02-category-leadership.md
│   ├── 03-cagr-compound-annual-revenue-growth.md
│   ├── 04-capital-efficiency.md
│   ├── 05-colossal-market-size.md
│   ├── 06-counter-cyclicality.md
│   ├── 07-cash-on-cash-return-probability.md
│   └── 08-closing-assessment.md
├── 3-source-catalog/                    ← citation provenance per section
│   └── 00..08-*-Complete-Source-List.md
├── 3-validation.md / .json              ← validation pass
├── 4-fact-check.md / .json              ← fact-check pass
├── 4-fact-check-verified.md / .json     ← fact-check verified subset
└── 4-corrections-log.md / .json         ← corrections applied
```

**Reading priority** (highest signal first):

1. `8-one-pager-content.json` — the densest extraction; use as the "key facts" reference card throughout
2. `2-sections/00-executive-summary.md` — the memo's own framing
3. `2-sections/02-category-leadership.md` — directly informs slides 3, 4
4. `2-sections/05-colossal-market-size.md` — directly informs the missing TAM/SAM/CAGR slide
5. `2-sections/01-capital-syndicate.md` — directly informs slide 9 (case study) and slide 13 (ask)
6. `1-competitive-research.md` + `1-competitive-evaluation.md` — directly informs slide 4 (competition)
7. `4-fact-check-verified.md` — sets the citation bar; only verified facts make it into Enhanced-v1
8. `2-sections/06-counter-cyclicality.md` + `07-cash-on-cash-return-probability.md` — informs the new use-of-funds / why-now framing
9. Remaining `1-research/*` and `3-source-catalog/*` — drilldown for specific citations as needed

## Outputs

By the end of this plan:

1. **Enhanced-v1 narrative outline** — `dididecks-ai/context-v/narratives/ChromaDB_Deck-Outline__Enhanced-v1.md` upgraded from the current Stub (which is a verbatim duplicate of Proto) to a genuine Enhanced spec, slide-by-slide.
2. **Reconciliation note** — `chroma-decks/context-v/explorations/Discrepancy-Reconciliation__Founder-Deck-vs-MemoPop.md` capturing every number Proto and the memo disagree on, what we recommend Enhanced-v1 use, and what we need the founder to verify.
3. **Code: `src/components/slides/enhanced-v1/`** — full slide pool for Enhanced-v1 (will diverge from `slides/proto/` slide by slide).
4. **Code: `src/pages/scroll/pitch/enhanced-v1/index.astro`** — the renderable route at `/scroll/pitch/enhanced-v1/`.
5. **Updated chooser** — `decks.ts` gains the Enhanced-v1 `VariantRef` so `/scroll/pitch/` lists both Proto and Enhanced-v1.
6. **Citation discipline** — every fact in Enhanced-v1's content layer carries a `source:` reference (filename + section header in the corpus) so any reviewer can trace claim → source in one hop. This honors [[Dididecks-AI-DD-Ready-Citation-and-Source-Access]].

## Discipline this plan honors

- **DD bar.** Every non-obvious claim must be traceable to a corpus source. If a slide makes a market claim, there's a footnote-style `data-source` attribute pointing at the corpus file. The deck doesn't ship a number Alpha Partners (or another DD-grade reviewer) couldn't substantiate in one hop.
- **Non-destructive iteration.** Proto stays. Enhanced-v1 is a new variant, not a replacement. The `chroma-pitch__proto` tag still recovers Proto; Enhanced-v1 lives parallel.
- **MVP-playable always.** Until Enhanced-v1 has all 13 slides authored and built, **Proto remains the canonical deck** for live presenting. We do not switch the founder over to Enhanced-v1 mid-build.
- **Two-tier token discipline.** All new slides use semantic tokens only — `var(--color-background)`, `var(--color-text)`, etc. No raw hex, no calmstorm-style names, no Tier-1 names leaking into component CSS.
- **Show-don't-enforce on copy.** Founder gets veto over every word. Even when MemoPop's framing is stronger or more accurate, the founder's voice wins on copy unless we have written agreement to swap.

## Phase 1 — Ingest

**Goal:** end this phase with a clean mental map of what the memo says, organized by topic, with every quantified data point cataloged. **No reconciliation yet** — just absorption.

### Actions

1. **Read the consolidated memo** `7-ChromaDB-v0.0.7.md` end to end. Take notes on:
   - Each section's headline claim (one sentence per section).
   - Quantified data points (every number, every percentage, every $).
   - Direct quotes from sources that could become slide-worthy pull quotes.
2. **Parse `8-one-pager-content.json`** as the structured key-facts reference. Save it as the canonical short-form fact sheet for the rest of this plan.
3. **Read each of the 9 section files** in `2-sections/` (00–08) — these are the cleanest per-topic prose the memo offers; the consolidated `7-ChromaDB-v0.0.7.md` may be longer but the sections read better in isolation when sourcing per-slide content.
4. **Read the fact-check-verified file** `4-fact-check-verified.md` — that's the bar for what claims survive in Enhanced-v1. Anything not in `4-fact-check-verified.md` doesn't ship as a positive claim in Enhanced-v1 (it can still appear *as the founder's voice* if it's the founder's claim, but not as an Enhanced-side substantiation).
5. **Catalog the source map** — for any potential Enhanced-v1 claim, note which file in `3-source-catalog/*` carries the verification chain back to a primary source. The catalog is the audit trail.

### Constraints / verification

- Phase 1 does not yet touch any slide code, the Enhanced-v1 outline, or the reconciliation doc.
- Phase 1 produces working notes — could be in `context-v/explorations/Memo-Reading-Notes.md` if useful, or scratchpad-only. The artifact that matters is the **internal model** the next phases operate on.

## Phase 2 — Resolve contradictions

**Goal:** every quantified or framing-level disagreement between the founder's deck and MemoPop's memo lands in one of five resolution states. **No Enhanced-v1 slide spec begins until this phase closes** — except for slides where no contradictions exist, which can be specified in parallel.

This phase is itself sub-staged: **Identify → Classify → Research → Recommend → Confirm → Document.**

### 2a. Identify every contradiction

Walk Proto slide by slide. For every fact-bearing statement (number, percentage, dollar, customer name, team-size claim, market claim), find the corresponding statement in the memo. List:

- **Matches** (good — no work needed).
- **Mismatches** (the contradictions — into the reconciliation doc).
- **Gaps** (founder makes a claim the memo doesn't address — flag for citation hunt; founder's primary source may need to be added to corpus).
- **Memo-only** (memo has a substantiated point the founder didn't include — these become candidate enhancement seeds for Phase 3, not contradictions).

### 2b. Classify each contradiction

For every mismatch, assign one of the five types from the *Resolving contradictions as discipline* table above:

- `stale-data` — both are true but at different timestamps; freshness decides
- `definition-mismatch` — both are true but measure different things
- `aspirational-vs-verified` — one is rounded/stretched, the other is exact
- `strategic-framing` — both are reasonable but say different things
- `genuine-ambiguity` — only the founder knows

Classification drives the default resolution and the level of effort required to close.

### 2c. Research where possible

For `stale-data` and `aspirational-vs-verified` contradictions, **don't just accept the memo or the deck — look at the live primary source where one exists.**

| Source type | How to check live |
|---|---|
| GitHub stars / forks / watchers | `gh api repos/chroma-core/chroma --jq '.stargazers_count'` — authoritative real-time. |
| npm download counts | https://api.npmjs.org/downloads/range/last-month/chromadb — official daily granularity. |
| Public customer list | Their website + recent blog posts (the customer logo grid on trychroma.com is the founder's preferred authoritative list). |
| Round size + lead investor | TechCrunch / The Information / Pitchbook for press; founder for ground truth. |
| Team composition | trychroma.com/about + LinkedIn current snapshot. |

Each live check produces a third number that often dispositively resolves the founder-vs-memo disagreement. Record the live number and its timestamp in the reconciliation doc.

### 2d. Recommend a resolution per contradiction

For each row, pick one of:

- **`use-founder`** — founder's number stands; memo was stale.
- **`use-memo`** — memo's number stands; founder was rounded/aspirational. (Founder may push back; that's fine — they go from `use-memo` to `escalated`.)
- **`use-live`** — neither matches the live primary source; use the live number.
- **`show-both`** — both are true; show them as different metrics with clear denominators.
- **`escalate`** — only the founder can resolve.

Each row has a **`reason`** field — one sentence explaining the call. A reviewer reading the reconciliation doc should be able to follow the logic in 5 seconds per row.

### 2e. Confirm with the founder where required

Bundle all `escalate` rows (plus any `use-memo` rows the founder might dispute) into a **single message to the founder** with the deck preview link. Ask explicitly:

- "We see two numbers for X — which is current?"
- "We see two framings for Y — which do you prefer?"
- "On Z, we couldn't verify from public sources; what's your primary source?"

Capture the response **in writing** (email, Slack, doc comment — anywhere not in-person-only). Quote the response into the reconciliation doc with a date.

### 2f. Document the resolution

The reconciliation doc — `context-v/explorations/Discrepancy-Reconciliation__Founder-Deck-vs-MemoPop.md` — is structured as a table where every contradiction has these columns:

| # | Proto slide | Claim | Founder source | Memo source | Live source (if applicable) | Type | Recommendation | Reason | Status |
|---|---|---|---|---|---|---|---|---|---|

`Status` is one of: **`resolved`**, **`founder-confirmed`**, **`escalated-pending`**. The phase closes when **zero rows** are `escalated-pending`.

### Constraints / verification

- Reconciliation doc lists **every** disagreement Phase 2a surfaced, not a curated subset.
- Each row has a non-empty `reason` field. No silent defaults.
- Each `escalate` row that gets a founder response has the response **quoted** in the doc with a date — not paraphrased.
- The reconciliation doc gets committed and pushed before Phase 3 begins. The git commit is the audit trail.

### Hard gate before Phase 3

**No Enhanced-v1 slide spec can reference a number whose row in the reconciliation doc has `Status: escalated-pending`.** Slides without contradictions can be specified in parallel with Phase 2 (e.g., the closing slide; the team slide once headshots are sourced). Slides with active disagreements wait.

## Phase 3 — Slide-by-slide enhancement spec

**Goal:** rewrite `dididecks-ai/context-v/narratives/ChromaDB_Deck-Outline__Enhanced-v1.md` to specify per-slide what changes and why.

### Actions

1. **For each of Proto's 13 slides**, write an Enhanced-v1 section block with:
   - **Stays the same as Proto:** (bullet list)
   - **Changes in Enhanced-v1:** (bullet list — content, layout, data, sources)
   - **New citations:** (corpus file references per claim)
   - **Open questions for founder:** (anything not resolvable from memo alone)
2. **Identify candidate new slides** — slides that aren't in Proto but Enhanced-v1 should consider:
   - **Market Size slide** (between current slide 2 "Agents will automate…" and slide 3 "Leading brand") — TAM $113B → $250B, 45% CAGR, $28B SAM, $4.2B vector-DB segment by 2026. Pulls from `2-sections/05-colossal-market-size.md`.
   - **Capital Syndicate slide** (slot TBD — likely after slide 13 ask, or as supporting detail on slide 13) — name the lead, name the syndicate (Spencer Kimball, Jordan Tigani, Guillermo Rauch, Amjad Masad, Akshay Kothari, Anthony Goldbloom), describe what each brings. Pulls from `2-sections/01-capital-syndicate.md`.
   - **Counter-cyclicality / Why-Now slide** — the memo's section 6 makes a specific argument about Chroma being recession-resilient as AI-infra spend grows independent of macro. Could be a 1-slide insertion strengthening "why this round, why now." Pulls from `2-sections/06-counter-cyclicality.md`.
   - **Use of Funds slide** (between slide 12 roadmap and slide 13 ask) — Proto skips straight from roadmap to ask. A 1-slide allocation table ($X for engineering, $Y for GTM, $Z for research) would strengthen the ask. Memo's `04-capital-efficiency.md` has the contribution-margin math to back this.
3. **Identify candidate slide removals** — slides that Enhanced-v1 might drop. None expected, but flag if reconciliation reveals one (e.g., if a Proto slide makes a claim the memo can't substantiate AND the founder can't either, ship it without the claim or drop the slide).
4. **Bump `at_semantic_version`** in the Enhanced-v1 outline from `0.1.0.0` (Stub) to `0.1.1.0` (Draft with at least one real divergence specified) once Phase 3 lands.
5. **Update `status`** in the outline frontmatter from `Stub` → `Draft`.

### Constraints / verification

- Every "Changes in Enhanced-v1" bullet for a fact-bearing claim has at least one corpus file path as its source.
- New-slide proposals come with a proposed slot in the deck order and a one-line rationale.
- The outline diffs visibly against the Proto outline at this point (was a verbatim duplicate; now has divergence).

## Phase 4 — Implement Enhanced-v1 slide components

**Goal:** ship the renderable Enhanced-v1 deck at `/scroll/pitch/enhanced-v1/`.

### Actions

1. **Scaffold `src/components/slides/enhanced-v1/`** — start by `cp -R src/components/slides/proto/ src/components/slides/enhanced-v1/` (or rebuild from scratch where the divergence is large enough). Either way, every slide is its own component edited in isolation, never inheriting from Proto via imports — Enhanced-v1's slide pool is **independent** of Proto's so we can recover Proto unchanged.
2. **Apply Phase 3 divergences one slide at a time.** For each Enhanced-v1 slide:
   - Write the slide component.
   - Cite sources in HTML comments and/or `data-source-*` attributes (DD-citation discipline).
   - Confirm token discipline (semantic tokens only).
3. **Author any new slides identified in Phase 3** — market size, capital syndicate, counter-cyclicality, use-of-funds — as new components in the `enhanced-v1/` folder with their own number prefix.
4. **Create `src/pages/scroll/pitch/enhanced-v1/index.astro`** — imports the new slide pool, orders them, wraps in `<PageAsDeckWrapper>`. Mode toggle wired in the same as Proto.
5. **Update `src/data/decks.ts`** — add Enhanced-v1 as a second `VariantRef` in the `pitch` deck's `variants[]` array. Status: `draft` initially; promotes to `presentable` once founder has reviewed.
6. **Build + verify** — `pnpm run build` should now generate `/scroll/pitch/enhanced-v1/index.html`. The chooser at `/scroll/pitch/` should list both Proto and Enhanced-v1.

### Constraints / verification

- Token-discipline audit (no raw hex, no rgb/rgba, all `var(--…)` references resolve to `theme.css`) is a hard gate before commit.
- Enhanced-v1 builds cleanly in all three modes (light / dark / vibrant).
- Proto remains untouched and still works at `/scroll/pitch/proto/`. Recovery via `git checkout chroma-pitch__proto` still produces the original.
- Vercel preview at `/scroll/pitch/enhanced-v1/` is live and presentable.

## Phase 5 — Founder review + iteration loop

**Goal:** founder approves Enhanced-v1 (or names specific changes) and we land them.

### Actions

1. **Send the Vercel preview link** to the founder with a short note pointing at what changed vs. Proto and why. Include:
   - "Here's the variant chooser: `/scroll/pitch/`"
   - "Proto (the deck as you currently present): `/scroll/pitch/proto/`"
   - "Enhanced-v1 (our suggested improvements): `/scroll/pitch/enhanced-v1/`"
   - "We need you to confirm: $12M Series A vs. $18M seed (from MemoPop) — which is right?"
   - "We need you to confirm: 27k stars (your deck) vs. 12k (the memo) — which is current?"
   - (Continue with any other unresolved items from the reconciliation doc.)
2. **Land founder feedback** — one commit per slide change keeps history readable.
3. **Promote status** — once founder approves, Enhanced-v1's status moves `draft` → `presentable` (in `decks.ts`); when actually used in a live meeting, `presentable` → `shipped`.
4. **Update the changelog** — a new `changelog/2026-MM-DD_NN.md` entry on the chroma-decks repo documenting Enhanced-v1 ship.
5. **Reflect at the parent level** — a short note in `dididecks-ai/context-v/explorations/Client-Site-Baseline-v2.md` (per the Init plan's Phase 6) capturing what we learned about MemoPop → deck integration that the **next** client engagement should inherit.

### Constraints / verification

- Founder confirmations on numbers are captured **in writing** in the Discrepancy-Reconciliation doc, not just verbally. ("Confirmed via email 2026-MM-DD: round is $12M Series A; memo's $18M was a prior-round draft.")
- No undocumented copy changes — every text divergence from Proto has a reason in the Enhanced-v1 outline.

## Phase 6 — Tag Enhanced-v1, log the loop

**Goal:** Enhanced-v1 has its own recoverable snapshot, and the cross-cutting learnings land at the parent.

### Actions

1. **Git-tag the Enhanced-v1 founder-approved commit** as `chroma-pitch__enhanced-v1` on the chroma-decks repo. Push the tag.
2. **Update the Enhanced-v1 narrative frontmatter** — `enhanced_v1_baseline_commit: <sha>`, `status: Presentable` (or `Shipped` if the meeting has happened).
3. **Cross-link Proto ↔ Enhanced-v1** in both outline docs.
4. **Parent-level publish** — write a one-paragraph reflective note in `dididecks-ai/changelog/` (the **Publish** phase of the Lossless Loop) on what shipped: "Enhanced-v1 of the Chroma pitch went live. Key moves: market sizing slide added, syndicate named, $18M → $12M reconciled, three placeholders (icons, logos, headshots) replaced. Variant convention validated."

### Constraints / verification

- `git checkout chroma-pitch__enhanced-v1` produces the founder-approved Enhanced-v1 state forever.
- Both the chroma-decks changelog and the dididecks-ai changelog reflect the ship (Project Progress + Parent Publish phases of the lifecycle).

## Out of scope (for this plan specifically)

- **Lightning-5min, Board-Update-v1, Audience-LP-v1** and other future whole-deck variants. The convention is locked; authoring those is a separate plan.
- **Per-slide variants** (`drafts/{slug}/{slug}-vN.astro`). Same.
- **`/play/` runtime** for Enhanced-v1. Once Enhanced-v1 has shipped as a scroll deck and gotten founder approval, a separate plan can port to `/play/`.
- **Real asset sourcing** (customer logos, team headshots, pixel-art icons). These are flagged in the Enhanced-v1 outline (Phase 3 spec) and slotted into the implementation (Phase 4) but the actual sourcing runs via the `crawl-fetch-ingest` skill in a separate sub-plan.
- **Mode-palette dial-in** for dark/vibrant beyond the current improvisation. Separate brand-iteration session.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| MemoPop's data is stale (months-old GitHub stars, npm downloads) and Enhanced-v1 ships with weaker numbers than the founder has on hand. | Reconciliation doc surfaces every disagreement explicitly. Founder gets veto. When in doubt, prefer the founder's data with a `data-source="founder-internal-dashboard, YYYY-MM"` attribute. |
| Enhanced-v1 inserts so many new slides (market size, syndicate, use of funds, counter-cyclicality) that the deck swells from 13 to 18+ slides and loses pacing. | Enhanced-v1 should aim to land **2–4 net new slides**, not all candidates. Prioritize market size + syndicate; defer the others to Enhanced-v2 if needed. |
| Citation discipline becomes annotation-noise — every slide cluttered with footnote markers. | Citations live in HTML comments and `data-source-*` attributes, **invisible to the rendered slide**. They're for DD review of the source, not for visual presence. |
| MemoPop's framing ("7 C's") seeps into the founder's voice and the deck starts sounding like an analyst memo, not a founder pitch. | Voice review is part of Phase 5 founder feedback. Default: founder's voice wins on copy; MemoPop wins on data. |
| The reconciliation doc lists 20+ disagreements and stalls Phase 2. | Time-box Phase 2a (Identify) and 2b (Classify) to 90 minutes. Run 2c (Research live primary sources) in parallel for the ones that can be auto-checked via API. Bundle all `escalate` rows into a single founder message rather than asking one at a time. |
| Phase 2 stalls indefinitely on founder unavailability for `escalate` rows. | Spec slides that don't depend on the escalated numbers (closing, opening, team) in parallel. Only the slides that need the escalated number wait. The deck progresses; the contested numbers wait. |

## Done definition

1. `chroma-decks/context-v/explorations/Discrepancy-Reconciliation__Founder-Deck-vs-MemoPop.md` exists, is comprehensive, and has **zero rows in `escalated-pending` status**. Every contradiction is `resolved` or `founder-confirmed`.
2. `dididecks-ai/context-v/narratives/ChromaDB_Deck-Outline__Enhanced-v1.md` reflects real Enhanced-v1 divergence — no longer a Proto duplicate. Status moved `Stub` → `Draft` → `Presentable`.
3. `chroma-decks/src/components/slides/enhanced-v1/` is populated with all Enhanced-v1 slide components. Every fact-bearing claim has a `data-source` attribute or HTML comment pointing at the corpus file path.
4. `chroma-decks/src/pages/scroll/pitch/enhanced-v1/index.astro` exists and renders.
5. `chroma-decks/src/data/decks.ts` lists Enhanced-v1 as a variant of the Pitch deck.
6. Vercel preview shows the chooser at `/scroll/pitch/` listing Proto + Enhanced-v1, and both variants render.
7. Founder has reviewed and either approved or named the specific changes needed. All founder confirmations on contested numbers are **quoted in the reconciliation doc with dates**.
8. `chroma-pitch__enhanced-v1` git tag exists on the approved commit.
9. Both `chroma-decks/changelog/` and `dididecks-ai/changelog/` have entries documenting the ship. The chroma-decks entry calls out the reconciled contradictions explicitly — Enhanced-v1's substantiation discipline is part of what it ships, not a hidden detail.

## Cross-references

- Proto outline: [[../../../../context-v/narratives/ChromaDB_Deck-Outline__Proto]] (parent-level)
- Enhanced-v1 outline: [[../../../../context-v/narratives/ChromaDB_Deck-Outline__Enhanced-v1]] (parent-level)
- Init plan that scaffolded chroma-decks: [[../../../../context-v/plans/Init-Chroma-Decks-Client-Site]] (parent-level)
- Parent spec: [[../../../../context-v/specs/Dididecks-AI-Slide-Decks-as-Code]] (the "decks as code" thesis)
- DD-citation spec: [[../../../../context-v/specs/Dididecks-AI-DD-Ready-Citation-and-Source-Access]] (the discipline this plan honors most directly)
- Source memo: `corpus/memos/memopop-generated/ChromaDB-v0.0.7/` (entire folder; git-ignored)
- Pinned Proto: tag `chroma-pitch__proto` on commit `06d5e59`

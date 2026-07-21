---
title: "ChromaDB · Deck Outline · Proto"
lede: "The faithful-recreation baseline of Chroma's live Series A pitch — 13 slides ported from the management-supplied PDF (2026-05-11_Chroma-Series-A_MS-Resort.pdf) into the chroma-decks codebase. This is the substrate every subsequent whole-deck variant (Enhanced-v1, etc.) diverges from."
date_authored_initial_draft: 2026-05-11
date_authored_current_draft: 2026-05-11
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-11
at_semantic_version: 0.1.0.0
status: Draft
augmented_with:
  - Claude Code (Opus 4.7)
authors:
  - Michael Staton
category: Deck Outline
tags:
  - ChromaDB
  - Deck-Outline
  - Proto
  - Whole-Deck-Variant
  - Faithful-Recreation
  - Series-A-Fundraise
deck_variant: Proto
deck_slug: pitch
deck_route: /scroll/pitch/proto/
deck_repo: lossless-group/chroma-decks
deck_branch: development
proto_baseline_commit: 06d5e59
date_created: 2026-05-11
date_modified: 2026-05-11
from: "dididecks-ai/chroma-decks"
from_path: "context-v/narratives/ChromaDB_Deck-Outline__Proto.md"
---
# ChromaDB · Deck Outline · Proto

## What "Proto" means in our convention

**Proto = the faithful-recreation baseline.** When we engage a client whose materials already exist (a Figma deck, a Pitch.com URL, a PDF), the first whole-deck variant we author in `chroma-decks` (or any client-decks repo) is **Proto** — the same content, same order, same structure, ported into the code substrate **without enhancement**. Proto's job is to give us:

1. A working code recreation we can verify against the live artifact ("does this say what the client says?").
2. A baseline that subsequent variants (Enhanced-v1, Enhanced-v2, Audience-LP-v1, Lightning-5min, etc.) can be honestly compared against — both visually and narratively.
3. A "no-yak-shaving" first pass — placeholders are accepted; what matters is that the spine is in code.

Proto is **never the version the founder presents from** once we've shipped an Enhanced variant. Proto exists to be diverged from. It also exists to be **recoverable** — if Enhanced-v3 turns out worse than Proto along some axis, we want to be able to checkout the proto commit and study what got lost.

> **Naming convention** (new, locked here, applies to all client-decks repos under `dididecks-ai/client-sites/*`):
>
> - File: `{ClientName}_Deck-Outline__{VariantName}.md` in `dididecks-ai/context-v/narratives/`.
> - VariantName patterns: `Proto`, `Enhanced-v1`, `Enhanced-v2`, `Lightning-5min`, `Board-Update-v1`, `Audience-LP-v1`, etc. Hyphen-cased, descriptive, suffix the audience/format/iteration.
> - The `__` (double underscore) separates DocType from VariantName; the `_` (single underscore) separates ClientName from DocType.
> - Whole-deck routes follow calmstorm's precedent: `/scroll/{deck-slug}/` (the canonical) plus optional `/scroll/{deck-slug}/v2/`, `/v3/` etc. for variants whose **whole composition** differs. Proto lives at the canonical `/scroll/{deck-slug}/`.

This answers the open question in [[Dididecks-AI-Slide-Decks-as-Code]] § Versioning Model — the answer is: **whole-deck variants are first-class, named, narrated by a `Deck-Outline` doc per variant**, while individual slide variants live in `/drafts/{slug}/{slug}-vN.astro` per the calmstorm pattern.

## Source artifact (Proto's faithfulness target)

- **PDF:** `corpus/management-supplied/2026-05-11_Chroma-Series-A_MS-Resort.pdf` (13 MB, 14 pages, git-ignored)
- **Title:** "Context and Memory Infrastructure for AI" (Chroma · Series A · MS Resort)
- **Capture date:** 2026-05-11
- **The CEO presents from this PDF live.** Proto must read like a code recreation of this artifact, not an enhanced reinterpretation.

## Code anchor

- **Repo:** `lossless-group/chroma-decks` (private, `branch = development`)
- **Route:** [`/scroll/pitch/proto/`](https://chroma-decks.vercel.app/scroll/pitch/proto/) (Vercel preview). `/scroll/pitch/` itself is now the **variant chooser** listing all variants of the Pitch deck (Proto today; Enhanced-v1, etc. tomorrow).
- **Slide components:** `src/components/slides/proto/01..14-*.astro` — one per slide, variant-scoped
- **Composition:** `src/pages/scroll/pitch/proto/index.astro` (imports + orders the 13 slide components inside `<PageAsDeckWrapper>`)
- **Pinned commit for Proto:** `06d5e59` — also git-tagged `chroma-pitch__proto`. Roll back to this exact state any time.

## The 13 slides

Note: the PDF has 14 pages. Slides 5 (bottleneck framing) and 6 (Chroma solution) were merged in code — they read as one narrative beat ("here's the gap → here's our answer") and benefit from being seen together. Whether to re-split them is a candidate divergence for Enhanced-v1.

---

### 01 · Cover
**File:** `src/components/slides/proto/01-cover.astro`
**Composition:** centered — Wordmark · Title · "Confidential" · 4-icon row on dotted background.

- **Title:** "Context and Memory Infrastructure for AI"
- **Subtitle:** *Confidential* (italic)
- **Footer visual:** 4 pixel-art icons (yellow boxes / blue brush / green terminal / red airplane) on a dotted grid — currently SVG approximations in `public/brand/icons/`; **needs replacement** with Chroma's actual icon assets.
- **Status:** Faithful ✓ · Icon assets = placeholder

---

### 02 · Opening Statement
**File:** `src/components/slides/proto/02-opening.astro`
**Composition:** centered, single large headline.

- **Headline:** "Agents will automate knowledge work at every organization on earth"
- **Status:** Faithful ✓

---

### 03 · Traction
**File:** `src/components/slides/proto/03-traction.astro`
**Composition:** center-aligned — title · 4 stat cards · "Context Rot" line · customer logo grid · "Cloud platform customers" caption.

- **Title:** "One of the leading brands in developer AI"
- **Stats (4):** `27k` Github Stars · `14M` monthly downloads · `50K` cloud teams · `$2.4M` cloud run rate
- **Subhead:** "Chroma authored the Context Rot report and popularized context engineering."
- **Customer logos (13):** xAI · Mintlify · FTAI Aviation · KREA · Skydance Animation · Weights & Biases · Conduit · Qualcomm · Cofounder · The Prompting Company · Isara · Propel · CBS News
- **Caption:** *Cloud platform customers* (italic)
- **Status:** Faithful ✓ · Logos = text-label placeholders (need real SVGs — `crawl-fetch-ingest` skill)

---

### 04 · Competition
**File:** `src/components/slides/proto/04-competition.astro`
**Composition:** top-aligned (the only slide retaining `align="start"`) — title · 2×2 quadrant matrix · "How we win" right rail.

- **Title:** "Competition"
- **Matrix axes:** X = Component → Full platform · Y = Closed-source ↔ Open-source
- **Dots:** Opensearch (top-left) · **Chroma (top-right, highlighted orange)** · In-house (middle) · Pinecone, Turbopuffer (bottom-left) · Labs (bottom-middle) · Glean (bottom-right)
- **"How we win" rail (4):**
  - **vs Vector DBs:** Massive up-lift to build around vector databases to get to platform utility
  - **vs Labs:** Labs can not offer language-model agnostic solutions, will only push their closed gardens
  - **vs In-House:** Very few teams will successfully roll their own solution.
  - **vs Enterprise search:** Enterprise search does not control their own database or models; search does not solve the memory problem.
- **Status:** Faithful ✓ · Dot positions estimated by eye from the PDF — may need micro-nudges

---

### 05 · Bottleneck + Chroma Solution (merged from PDF pages 5 + 6)
**File:** `src/components/slides/proto/05-bottleneck.astro`
**Composition:** centered, two-column. Connector line (cobalt SVG arrow) from Memory & Context box → right column.

**Left column:**
- **Title:** "The bottleneck is no longer reasoning failures, they are <u>context and memory failures.</u>"
- **3-box stack:** Agents (Coding, support, product, operations) ↕ **Memory & Context** (Learning, Unified real-time context layer · spotlighted in cobalt) ↕ Underlying raw data (docs, code, chat, email, agent traces)

**Right column:**
- **Callout:** "The missing piece" (cobalt)
- **Title:** "Chroma makes the context and memory infrastructure for AI"
- **Chroma 5-layer block** with side annotations:
  - Governance · auth, audit, policy
  - Intelligence · synthesis, querying · ← *Powered by Context-1, our SOTA agentic search model*
  - Database · serverless, scalable · ← *Powered by ChromaDB, the most popular AI-native database*
  - Syncing · slack, github, notion…
  - Evals · tests, drift, versioning · ← *Authored Context Rot Report*

**Status:** Faithful to the merged narrative ✓ · The PDF's "Agents + Humans" and "Raw data" framing bands around the Chroma block were dropped in the merge (the left column's 3-box stack already names that frame). Re-introducing them is a candidate Enhanced-v1 move.

---

### 06 · Difficult Problems (was slide 7 in PDF)
**File:** `src/components/slides/proto/07-difficult.astro` (file kept at `07-` for now; rendering order set by `pitch/index.astro` imports)
**Composition:** centered — title · 3-box mini-stack left · two-column bullet list right.

- **Title:** "Context and memory are difficult problems"
- **Mini-stack:** Agents ↕ **Context & memory** (cobalt) ↕ Raw Data
- **Two columns:**
  - **The system problem:** Scalable and serverless indexing and search · Intelligent agentic search · Correctable · Legible · Auditable · Compounding
  - **The data problem:** Permission-aware filtering · Conflicting information · Fragmented information · Continuously changing information
- **Status:** Faithful ✓

---

### 07 · Two Segments
**File:** `src/components/slides/proto/08-segments.astro`
**Composition:** centered split layout (Teams ↔ Developers), each side with title · lede · sublede · 3-band mini stack diagram.

- **Left — Context for Teams:** "Agents that know your business" · *Focusing currently on engineering teams with 10-100 engineers* · stack: Slack, MCP, Web → **Chroma** → Raw data (Slack, Notion, Agent traces, Github)
- **Right — Context for Developers:** "Memory and context infrastructure for your own products." · stack: Your Agent, your App → **Chroma** → Your user's raw data (chat, agent traces, email, documents, crm, code, skills, tools, OLTP, OLAP, S3, filesystems)
- **Status:** Faithful ✓

---

### 08 · xAI Case Study
**File:** `src/components/slides/proto/09-case-study.astro`
**Composition:** centered — title · sublede · two-column (3-row stack left, pull-quote + powering list right).

- **Title:** "Case Study"
- **Sublede:** "Chroma powers the context layer for xAI's Grok"
- **Stack (3 rows):** User (queries to Grok) → Grok (xAI agent · xAI mark) → Chroma (context layer · Chroma mark)
- **Pull quote:** *"Now that we use Chroma for hybrid search, we've saturated our existing evals." — xAI*
- **Powering list:** Grok Collections API · Business Connectors · Consumer Connectors
- **Status:** Faithful ✓ · xAI logo = text label placeholder

---

### 09 · Team
**File:** `src/components/slides/proto/10-team.astro`
**Composition:** centered — title · 6×2 card grid (12 members).

- **Title:** "Team"
- **Row 1 (6):** Jeff Huber (CEO, YC) · Hammad Bashir (CTO, YC, Snap, UC Berkeley) · Matt Brailey (Head of GTM, VP Weka) · Philip Thomas (Webflow, OpenDNS) · Robert Escriva (Lacework, Dropbox, PhD Cornell) · Tanuj Nayak (Yugabyte, CMU DB)
- **Row 2 (6):** Gabriel Shahbazian (Superhuman, Amazon) · Sicheng Pan (UC Berkeley, Sky Lab) · Kyle Diaz (Datadog) · Itai Smith (Amazon, UC Berkeley) · TJ Krusinski (Meta) · Kelly Hong (UC Berkeley)
- **Status:** Faithful ✓ · Avatars = initials-in-circles placeholders (need real headshots — `crawl-fetch-ingest` skill on LinkedIn or company about-page sources)

---

### 10 · Business Model
**File:** `src/components/slides/proto/11-business-model.astro`
**Composition:** centered — title · 3 tier cards.

- **Title:** "Open-core, usage-based, enterprise"
- **Open-source:** Free · ChromaDB, self-hosted · → unlimited usage, → community support, → top of funnel
- **Cloud:** Usage-based · fully-managed cloud · → zero ops, → zero friction
- **Enterprise:** Platform-fee + usage · BYOC, SLAs, Support · → SOC 2, SSO, → BYOC dedicated infra
- **Status:** Faithful ✓

---

### 11 · Roadmap
**File:** `src/components/slides/proto/12-roadmap.astro`
**Composition:** centered — title · 3 columns each with sub-title, content, mini bar chart.

- **Title:** "Roadmap"
- **Sync — More connectors:** today: Github, S3 → tomorrow: Postgres, Clickhouse, Databricks, Filesystems, Google Drive, Notion, Slack · *+ Enrichment (Sync-1)*
- **Database — More scale, more workloads:** Single Index size bar chart 250M → 100B
- **Agent — Faster, customer fine-tuning:** Tok/s bar chart 400 → 10k · *+ Fine-tuning*
- **Status:** Faithful ✓ · Bar proportions estimated by eye

---

### 12 · Ask
**File:** `src/components/slides/proto/13-ask.astro`
**Composition:** centered — title (large) · two-column list.

- **Title:** "Chroma is the context layer for agents, raising $12M"
- **Chroma today:** → Loved by millions of developers · → Full integrated solution · → Proven infra at-scale · → Open-source
- **Milestones by Series B:** Research → 3,000 tok/s · Engineering → Massive datasets (100B+) · Marketing → 2x OSS community · GTM → $10M run rate
- **Status:** Faithful ✓

---

### 13 · Closing
**File:** `src/components/slides/proto/14-closing.astro`
**Composition:** centered — large headline · sub · ChromaMark · 4-icon row.

- **Headline:** "Every agent needs context and memory"
- **Sub:** "Chroma is building context and memory infra for AI"
- **Visual:** ChromaMark · 4-icon row (same as cover)
- **Status:** Faithful ✓ · Icons = same placeholders as cover

---

## Asset placeholder status (the honest gap)

| Slide | Placeholder | Needs |
|---|---|---|
| 01, 13 | 4 pixel-art SVG icons (boxes/brush/terminal/airplane) | Chroma's actual icon assets — drop-in same dimensions |
| 03 | 13 customer text labels in dashed cards | Real SVG logos — `crawl-fetch-ingest` |
| 08 | "xAI" text label | xAI SVG |
| 09 | 12 initials-in-circles avatars | Real headshots — `crawl-fetch-ingest` (LinkedIn + about pages) |

These don't compromise Proto's role (faithful structural recreation). Enhanced-v1 should land them.

## Design choices baked into Proto

- **Three modes (light / dark / vibrant)** scaffolded but presented in light. Dark and vibrant are technically functional; the founder approves none of them yet for live use. Brand-iteration session is a separate beat.
- **`/scroll/pitch/` is the canonical Proto route.** No `/v2`, `/v3` siblings exist yet; Enhanced-v1 will likely live at `/scroll/pitch/enhanced-v1/` or under a new deck slug.
- **`#1a73e8` cobalt** is our best guess at the deck's spotlight blue. Eyeball it against the PDF; we'll dial.
- **Slide 5 = merged page 5 + page 6 from the PDF.** A deliberate code-narrative compression. Re-splitting them is on the table for Enhanced-v1.

## What Enhanced-v1 might do (candidate divergences)

> *This list is forward-looking and non-binding — captured here so reviewers of Proto can flag what they want to see Enhanced address.*

- **Land the missing assets** (icons, logos, headshots) — biggest single visual lift.
- **Re-cut slide 5 → re-split into 5a (bottleneck) and 5b (solution)** if reviewer feedback says the merged slide is too dense in print.
- **Tighten copy on slide 4** — "How we win" right rail is currently 4 short paragraphs; could be 1-line per row with a hover/click for the elaboration.
- **Replace stat cards on slide 3** with a richer visual** — sparklines, mini line charts showing growth not just point-in-time.
- **Add a "What we'll do with the $12M" slide between 12 and 13** — the PDF skips straight from roadmap to ask; a use-of-funds slide could strengthen.
- **Re-author the closing** to feel less like a bookend and more like a CTA. Currently "Every agent needs context and memory" + visual matches the cover; could end on a forward-looking line.
- **Variant-aware mode default.** Some audiences (LPs in print) want light; some audiences (live demos to engineering teams) want dark or vibrant. Bake the mode hint into the deck slug — `/scroll/pitch/`, `/scroll/pitch-dark/` — or surface a "best viewed in {mode}" hint.

## Cross-references

- Parent spec: [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — the "decks as code" thesis, including the Versioning Model open question this doc partly closes
- Sibling spec: [[../specs/Dididecks-AI-Visual-and-Diagram-Component-Library]] — the primitive library that competition matrix, stack diagrams, and bar charts on this deck should eventually consume
- Brand notes: [[../explorations/Chroma-Brand-and-Deck-Notes]]
- Three-modes derivation: `chroma-decks/context-v/explorations/Three-Modes-Derivation.md`
- Plan: [[../plans/Init-Chroma-Decks-Client-Site]]
- Changelog of Proto's ship: `chroma-decks/changelog/2026-05-11_02.md`
- The Enhanced-v1 outline (initially a duplicate of this doc): [[ChromaDB_Deck-Outline__Enhanced-v1]]

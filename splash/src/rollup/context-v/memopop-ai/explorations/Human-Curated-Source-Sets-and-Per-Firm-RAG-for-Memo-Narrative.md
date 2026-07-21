---
title: "Human-Curated Source Sets and Per-Firm RAG for Memo Narrative"
lede: "What if 'fighting Perplexity' is the wrong frame — and the fix is to keep its one-shot take as commentary, route the real research through validated harvesters, then let the analyst rank and prune sources in a GUI before any prose gets written, with the firm's own PDFs and transcripts as a parallel standing corpus the writer can cite from? Here's the pipeline shape and the retrieval-provider option set that supports it."
date_authored_initial_draft: 2026-05-22
date_authored_current_draft: 2026-05-22
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-22
at_semantic_version: 0.0.0.4
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Exploration
tags:
  - Source-Quality
  - Citation-Discipline
  - Human-in-the-Loop
  - Retrieval-Augmented-Generation
  - Chroma
  - Per-Firm-Corpus
  - Source-Harvester
  - Agent-Topology
  - MemoPop
authors:
  - Michael Staton
image_prompt: A three-station workshop bench — left station is a librarian-harvester pulling real URLs from a sea of stamped-and-rejected slips, center station is a human curator at a tall lectern dragging rows in a list to rank them with red X's beside discards, right station is a writer at a typewriter producing prose with footnote markers tethered by glowing threads back to the curator's ranked list; a parallel filing cabinet labeled "firm corpus — PDFs, transcripts, notes" feeds into the writer's desk; deep-violet uplight, hand-drawn blueprint annotations in monospaced font, technical-illustration aesthetic.
date_created: 2026-05-22
date_modified: 2026-05-22
from: "memopop-ai"
from_path: "context-v/explorations/Human-Curated-Source-Sets-and-Per-Firm-RAG-for-Memo-Narrative.md"
---
# Human-Curated Source Sets and Per-Firm RAG for Memo Narrative

## The trigger

We started MemoPop on Perplexity Sonar because it shipped *research with citations* in one API call. Six months in, that single-call convenience has cost us more in URL-fabrication triage than it ever saved in plumbing. [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] diagnosed the architectural reason; [[Curating-only-valid-Sources-across-Runs]] documented the symptom; the Trustworthy-Citations rollout plan is the executable response. This document is the next layer: **what if the pipeline put a human between retrieval and generation, on purpose** — and what the retrieval-provider landscape looks like in May 2026 if we're no longer asking one vendor to do both jobs.

The frame shift: we were fighting Perplexity. The thing to fight is the *pattern* of asking one model call to both search the web and write the prose. Once that frame breaks, two doors open. First, Sonar's output stops being load-bearing and becomes one *exhibit* in the artifact trail — interesting because clients genuinely want to know "what does the AI think about this deal" — without ever becoming the cited memo. Second, we can pick best-of-breed retrieval tools for the Source Harvester, route their results through a human curation step, and let the writer compose only against an analyst-approved corpus. The structural guarantee from [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] strengthens — and the curation step itself produces deliverables clients pay for.

## What we're carrying forward

This doc extends rather than restarts:

- [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] — the *why*: one LLM call cannot reliably retrieve and write at the same time. Harvester (librarian) / Writer (sealed behind glass) split.
- [[Curating-only-valid-Sources-across-Runs]] — the *symptom*: 392 "unique" URLs across seven runs, half dead-at-HTTP-200. Pass A/B/C curation with Pass C parked as "later, human-in-the-loop."
- `[[../../apps/memopop-orchestrator/context-v/plans/Trustworthy-Citations-Source-Harvester-Rollout]]` — the *plan*: six phases, validator → harvester → disarmed writer → audit. Status: Draft.
- `[[../../apps/memopop-orchestrator/AGENTS.md]]` — the *contract*: §2 closed-corpus citation, §4 hedge calibrated to evidence, §8 idempotent re-runs, §9 section independence at write / global consistency at assemble, §11 no agent over-reach.

The new contribution: Pass C — the human curation step that was filed as "later" — becomes the **spine**. And the writer's corpus becomes the union of a per-memo web harvest *and* a per-firm standing RAG store.

## Core moves

### 1. The "AI take" keeps a seat — as a quarantined exhibit

Clients have told us "what does the AI think about this deal" is interesting *as itself*. The one-shot generative output — Sonar, deep-research, or whatever — keeps a slot in the artifact trail (call it `0-ai-take.md`), clearly labeled, clearly NOT the cited memo. **One hard rule: no URL from the AI take ever propagates into the curated corpus.** The exhibit is sealed; its citations are display-only.

This reframes the cost of using Sonar. We don't have to win the URL-fabrication argument with a generative search model — we can use it the way it's actually good (synthesized commentary) and not the way it's catastrophically bad (load-bearing citations).

### 2. The human source-review gate (the spine)

Between the harvester and the writer sits a per-deal GUI step. The analyst sees, per section:

- The list of candidate sources the harvester found and the validator graded.
- A **validation verdict badge** per row (`verified-accessible`, `verified-gated`, `thin`, `title-swapped`, `verified-via-republish`, etc. — the ladder from the rollout plan).
- A **matched snippet** and **provenance**: which tool found it, what query was used.
- A **rank** — drag-to-sort, top-to-bottom, priority-first.
- An **x-out** — remove sources that are real-but-not-the-info-wanted, or low editorial quality.

The output: a stored decision per `(source, section, rank, included)` tuple that the writer reads as its corpus.

**Four things make this carry weight, not be UI sugar:**

1. **Validate before the human ranks.** Run the verdict ladder first. The analyst never clicks past dead URLs. The validator pre-sorts so the work in front of the analyst is already ordered roughly correctly.
2. **Rank does real work downstream.** It drives §4 hedge calibration (top rank → declarative voice; lower → attributed/hedged), and it's the §9 tie-break when two sources contradict (higher rank wins; the corpus picks an obvious winner). The ranking is not just for the GUI's benefit — it's a load-bearing signal into the writer prompt and the assembly pass.
3. **Persist as a markdown artifact with YAML frontmatter** — `deals/<deal>/inputs/Sources.md`. Frontmatter carries the structured `(source, section, rank, included, sensitivity)` data; the body documents *how the list was built*, *what was examined and rejected and why* (institutional memory that prevents re-adding junk next run), and *coverage gaps* (which sections still need work). This matches the team's convention everywhere else in `context-v/` — frontmatter for machines, prose for humans, one file. A re-run must honor it — §8 idempotency.
4. **One global source pool, section tags — not ten parallel lists.** A source might be top for "Market Context" and irrelevant for "Team." Represent that as a `(source, section, rank, included)` mapping with scoped views, not ten independent lists the analyst maintains in parallel. Ten sections × N sources is otherwise a lot of dragging.

### 3. Two corpora, not one

The writer cites from the **union** of:

- **Per-memo / per-deal corpus** — the analyst-approved web sources for *this* memo. Extracted via Jina Reader or Firecrawl after curation. Ephemeral; scoped to one deal.
- **Per-firm standing corpus** — the firm's PDFs, partner notes, call transcripts, prior memos. Long-lived; accumulates across deals.

Both delivered to the writer as Anthropic `search_result` content blocks (see §5 below). The firm's transcripts becoming first-class citable sources ("as raised in the 2026-03 partner call") is the home for the threads in `[[../../apps/memopop-orchestrator/context-v/issue-resolution/Containerizing-Internal-Comments-and-Recommendations-for-Consideration]]` and `[[../../apps/memopop-orchestrator/context-v/issue-resolution/Containerizing-Risk-Assessments-and-Diligence-Skepticism]]` — internal diligence becomes part of the cited record where appropriate.

### 4. Chroma topology — collections per firm, not databases per firm

The intuition that "a ChromaDB per firm might be too much" is correct. Chroma's real isolation unit is the **collection** plus `where`-filter, which is the pattern the Lossless tree already runs for its four corpus collections (`context-vigilance-corpus`, `lossless-changelog`, `claude-code-sessions`, `claude-code-tool-traces`). Separate DB *instances* per firm = N persistence dirs, N backups, version skew, operational overhead — for isolation a metadata field already gives you.

**Default:** one shared Chroma instance for MemoPop. Each record carries `firm_slug` metadata. Queries filter on it. Light, scalable, multi-tenant by metadata.

**Escalate to collection-per-firm** only if data governance demands a hard wall — firm A's partner notes must be physically incapable of surfacing in firm B's memo. That's a real reason, not a vibes reason; if a firm signs an SLA that says "our data lives in its own logical store," collection-per-firm gives you that without going all the way to DB-per-firm.

**Two cautions:**

- **Don't conflate this with the Lossless dev corpus.** The `chroma` MCP + four collections is *Claude Code developer tooling* on Michael's laptop. The MemoPop firm corpus is **product data** that ships with the app, has its own backup/security needs, and probably wants a separate Chroma deployment. Same technology, different system. Keep them mentally separated or the tangle becomes painful.
- **Sensitivity flag per record.** A partner-call transcript is fine in an internal memo and a liability in one shared with an LP. Each source record wants `internal_only: true` / `citable_externally: true`, and the writer + the export step both check. Connects to `[[../../apps/memopop-orchestrator/context-v/blueprints/Git-Submodules-for-Private-Data-and-Exports]]`.

### 5. Grounded generation: Anthropic `search_result` content blocks

The writer is Claude. The corpus — both per-memo and the retrieved-relevant slice of the per-firm standing store — gets handed to Claude as `search_result` content blocks (each with `source`, `title`, `content` text blocks, `citations.enabled: true`). Claude's response carries `search_result_location` citations bound to a `search_result_index` + block range, with the verbatim `cited_text`.

Three properties that matter:

1. **Structural ID-binding.** The writer cannot cite a source that isn't in the corpus, because there's no URL-shaped slot to fill — the citation references a block index, not a string. This is the closed-corpus invariant from AGENTS.md §2, native to the API.
2. **`cited_text` enables claim-vs-source quality checks** *when a citation is attached*. The model returns the exact passage it claims supports a sentence; a downstream check compares passage to sentence (string overlap, semantic similarity, or human spot-check). This lets us **measure** fabricated-citation rate per run rather than **enforce** 100% support — see the citation policy in §6 below. A partial step toward the claim-vs-source layer that [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] named as not-yet-solved.
3. **The Trustworthy-Citations plan shrinks.** Phase 3 step 13 (the ID-to-citation post-process) and Phase 4 (demote `citation_enrichment.py`) get *built-in*. We delete planned work.

### 6. Citation policy — strict on fabricated citations, permissive on uncited synthesis

The `search_result` mechanism guarantees that any citation we render points at a real corpus block. It does not, on its own, govern *which sentences should carry citations*. We want a softer rule there — because models genuinely do pattern-recognize across a corpus and produce useful synthesis, and forbidding all uncited claims would either turn the writer into a parrot or, worse, push it to fake-cite its own insights. The line between insight and hallucination is grey; the policy below picks a side per claim type without pretending the line is sharp.

**Three classes of sentence:**

- **Synthesis / insight** — the writer's pattern recognition across the corpus, an inference connecting two sources, a framing observation no single source states outright. **Allowed uncited. Forbidden to attach a citation.** The model must not fake-support its own synthesis with a corpus-block reference whose `cited_text` doesn't actually contain that sentence's content. Synthesis that earns a citation isn't synthesis — it's restated source content and should be marked as such.
- **Sourced content** — any sentence whose specifics originate from a corpus block. **Required to cite** that block. §2's closed-corpus invariant says the citation can only *point at* a real block; this rule adds *when* a citation is obligatory.
- **Numeric, named-entity, or dated specifics** — market size, revenue, GitHub stars, ARR, founding year, named investor, named comparable. **Should be cited if the corpus supports them.** If the corpus does not support them, the writer has two options:
  - **Leave the specific in the prose uncited.** The visible absence of a footnote *is* the analyst's signal — "verify this number." This is the quiet fallback and is genuinely useful: an uncited `$5B TAM` in the prose tells the reader exactly where to look, without burying the placeholder in agent ceremony.
  - **Emit a `<needs-source>` marker per AGENTS.md §5.** The loud signal — for sections where verification is critical, or where the writer wants to be unambiguous that it's hedging.

Both signals are acceptable; the writer chooses based on whether the specific is "best-effort with caveat" (uncited prose) or "I can't responsibly write this at all" (marker). This permissive fallback is a *complement* to §5's marker discipline, not a replacement.

**What this rules out:**

- **Fabricated citations on synthesis** — the single worst failure mode. The model decorates an insight with a `[src-014]` whose `cited_text` doesn't actually support the sentence. Detected by comparing `cited_text` to the cited sentence (string overlap, semantic similarity, or human spot-check). **Tolerance is low but non-zero;** the metric is "fabricated-citation rate" and it gets reported in the run summary.
- **Silent sourcing of corpus content** — a sentence paraphrases a corpus block but carries no citation, presenting source material as synthesis. Harder to detect (requires running the draft against the corpus and asking "does any block substantially overlap this sentence?") but worth instrumenting over time. **Tolerance is low**, applied judgmentally rather than mechanically.

**Tolerance, not enforcement.** We are not blocking ship on a non-zero rate of either failure. The point is to measure, surface in the run summary, and give the analyst visibility into where the writer is being loose. Hard enforcement throws away the genuinely valuable thing models do — synthesize across a corpus into something neither source said alone.

**Where the rate lives.** "Tolerance is low" is a measurement-and-reporting concept, not a writer-prompt parameter. The model cannot operationalize a percentage — it writes one sentence at a time and has no introspective access to its own aggregate behavior. Telling a writer "keep fabricated-citation rate under 5%" gets either ignored or, worse, produces theater (under-citing to "stay under the limit"). What goes into the writer prompt are the categorical, per-sentence rules below; what gets reported per run is the rate. The threshold for "this memo needs a human pass before ship" is a downstream calibration decision against measured baselines — see Decision Points.

**How the writer prompt encodes this** (rough shape — the exact wording lands in AGENTS.md when this exploration graduates):

- "Sentences that paraphrase or quote a source must carry that source's citation."
- "Sentences that synthesize across the corpus, draw inference, or frame patterns must NOT carry a citation. Do not invent block references to support synthesis."
- "Numeric, named-entity, and dated specifics should be cited when the corpus supports them. When the corpus does not, either leave the specific uncited (the analyst will spot-check) or emit `<needs-source>` (preferred where verification is critical)."

This complements §2 (closed-corpus citation — what *can* be cited) and §4 (hedge calibration — how confident the prose voice should be), without softening either. When this graduates, it becomes a new AGENTS.md section (likely §13) or an expansion of §2 — that's a settlement decision, not an exploration decision.

## The assembled flow

```
                                                                        ┌─→ ai-take exhibit ─→ display only
                                                                        │
web harvest ─→ validate (verdict ladder) ─→ HUMAN GATE (rank + x-out, per section)
  (Tavily,                                              │
   Exa,                                                 │ approved (source, section, rank, included)
   Valyu,                                               ▼
   Perplexity                                  extract (Jina / Firecrawl)
   Search API)                                          │
                                                        ▼
firm standing corpus ─→ semantic retrieval ──→ per-memo RAG corpus
  (Chroma, firm_slug,                                   │
   sensitivity flag)                                    ▼
                                       Writer (Claude + search_result blocks)
                                                        │
                                                        ▼
                                                 cited narrative
                                       (claim-vs-source check via cited_text)
```

## Three client-facing deliverables fall out

This pipeline produces, as natural by-products of running it once, three artifacts that have standalone value to firms — not just internal pipeline state:

1. **The AI take** — "here's what a well-read generalist thinks about this deal" (commentary only; no load-bearing claims).
2. **The curated, ranked source list per section** — research the firm can use independently of any memo.
3. **The extracted RAG content set** — the firm keeps a structured knowledge base of every primary source touched, growing with every deal. Their own institutional memory.

Plus the memo itself. The GUI should surface each as exportable — the memo isn't the only thing a firm pays for.

## The retrieval-provider option set (May 2026)

The market bifurcated since we built on Sonar. There's now a clean split between **retrieval APIs** (return real, fetched content; no LLM synthesis) and **grounded-generation patterns** (bind a writer's claims to a fixed corpus).

### Retrieval APIs (Harvester candidates)

| Provider | What it returns | Notable | Approximate pricing | Best fit for us |
|---|---|---|---|---|
| **Tavily** | Ranked results + extracted snippets; separate Extract & Crawl endpoints; new Research endpoint for end-to-end deep web research | Source-first discovery; security/PII layer | ~$8/1k requests | **Keep.** General research. Already wired. |
| **Exa** | Neural/semantic search; first 10 results return full text **free** per search (March 2026 update) | Trained on link prediction; good for "find me companies like X" | ~$7/1k standard, $12/1k agentic | **Add.** Conceptual / comparable-company queries where keyword search underperforms. |
| **Valyu** | Direct full-text **SEC filings, FRED, PubMed, arXiv, USPTO**, 36+ proprietary sources including financial data | Early-2026 benchmarks: ~18-point edge on finance questions vs. pure web search | $8/1k finance, $30–50/1k proprietary | **The sleeper for our domain.** Investment memos live on primary financial sources; this fetches the filing itself, not news *about* it. Retires the `@crunchbase` / `@pitchbook` / `@sec` Perplexity-`@`-syntax workaround in our outlines. |
| **Firecrawl** | Search + full-page extraction in **one call**; markdown-out; "curated index for AI agents, no slop" | MCP already wired in this repo | ~$83/100k credits, 2 credits per 10 results | **Add when needed.** Single-call retrieve+extract reduces plumbing. Strong RAG fit. |
| **Jina Reader** (`r.jina.ai`) | URL → clean LLM-friendly markdown; also a search endpoint (`s.jina.ai`) | Generous free tier; lowest-friction extractor | Free tier + cheap paid | **Add as default extractor** for already-curated URLs. Cheapest path from "curated URL" to "corpus block." |
| **Perplexity Search API** (≠ Sonar) | **Raw ranked results**, no LLM synthesis. Launched Sept 2025. | Keeps a Perplexity key without the Sonar pattern | $5/1k | **Optional fallback.** Keep if we want continuity with our existing Perplexity wiring; drop if we don't. |
| **Linkup** | Sourced answer + raw results; #1 on OpenAI SimpleQA benchmark; `includeInlineCitations` flag | EU-based; production-grade positioning | Per-call pricing | **Watch.** Worth a bake-off against Tavily on factual-recall sections (founding-year, raise sizes, named-investor questions). |
| **Brave Search API** | SERP metadata only; independent index | No Google dependency | $5/1k | **Skip for RAG.** Metadata-only is a worse fit than the extractors above. |
| **Serper / ScrapingDog** | SERP metadata; very cheap | Google results in JSON | $0.30–$1/1k | **Skip for RAG.** Same reason. |

### Generative-research APIs (the *pattern* we're stepping back from)

We don't want a Sonar replacement at this layer. Listed because clients ask:

| Provider | Pattern | Why we're not building on it |
|---|---|---|
| **Perplexity Sonar / Sonar Pro / Sonar Deep Research** | Generative search; `/chat/completions`; LLM-produced citations | The original problem. Hallucinated URLs are structural, not promptable-away. |
| **OpenAI Deep Research** (`o3-deep-research`, `o4-mini-deep-research`) | Same pattern at OpenAI; web search always on; $10/1k search calls on top of token cost | Same architectural conflation; just relocates the problem. |
| **Anthropic `web_search` tool** | Model-side search with auto-citations; $10/1k requests | Closer to safe — citations are over the model's *actual* tool-call results, not invented — but still mixes retrieval and generation in one call. Worth using only at the AI-take layer. |

### Grounded-generation pattern (the Writer's layer)

| Mechanism | What it gives | Cost |
|---|---|---|
| **Anthropic `search_result` content block** | We hand Claude `search_result` blocks (`source`, `title`, `content`). Response carries `search_result_location` citations bound to `search_result_index` + block range, with verbatim `cited_text`. Writer structurally cannot cite a URL we didn't provide. | No per-request fee — tokens only. ZDR-eligible. |

This is the keystone. It's what makes the "human-curated → grounded writer" pipeline cheap to build and structurally sound.

## What we're recommending

For MemoPop's next pipeline turn:

- **Harvester tools:** Tavily (keep) + **Valyu** (add — primary-source advantage in our domain) + **Firecrawl** (search+extract single-call, when needed) + **Jina Reader** (extractor for already-curated URLs). Keep **Perplexity *Search* API** as a fallback for continuity but drop Sonar as research engine.
- **AI take layer:** Run one synthesized commentary call per deal, save as `0-ai-take.md`, never let its URLs leak. Recommendation for the provider here: Anthropic `web_search` — citations at least over real tool-call results.
- **Curation gate:** Build the per-deal source-review GUI in MemoPop Native. Global source pool with section tags. Persist decisions to a stable `1.5-source-decisions.json` artifact.
- **Per-memo extraction:** Jina or Firecrawl, on the approved set only. Output is the per-memo corpus.
- **Per-firm standing corpus:** One shared Chroma instance, `firm_slug` metadata, sensitivity flag per record. Escalate to collection-per-firm only on customer governance request.
- **Writer:** Claude with `search_result` content blocks from `(per-memo corpus) ∪ (retrieved firm corpus slice)`.
- **Delete planned work:** Phase 3 step 13 (ID-to-citation post-process) and most of Phase 4 (`citation_enrichment.py`) in the Trustworthy-Citations rollout collapse into the `search_result` block mechanism.

## What this does NOT solve

- **The harvester's query construction.** Tavily/Exa/Valyu will still return whatever they're asked for; if the section's query is generic, the candidate pool is mediocre and the analyst is ranking from mediocrity. Outline-level concern, per-section query strategy, future work.
- **Editorial source-tier automation.** v1 makes the analyst the authority classifier. The rankings captured over many deals could later train an auto-classifier (primary / secondary / aggregator / content-farm). Out of scope for v1; explicitly deferred.
- **Long-tail of the firm standing corpus.** PDF parsing quality, transcript speaker attribution, OCR for scanned filings — each is its own engineering surface and isn't designed here.
- **Cross-firm patterns.** Even with `firm_slug` isolation, MemoPop *the platform* could surface "firms that backed X also looked at Y" — but the data-rights conversation needed to enable that lives in commercial agreements, not in code.

## Decision points

1. **Provider mix at v1.** Tavily + Valyu + Jina is the lean default. Do we add Firecrawl from day one (single-call simplicity) or only after the lean stack hits a coverage gap? Recommendation: **add Firecrawl when a per-section query strategy first hits a coverage gap** — not by default.
2. **Where the curation GUI lives.** MemoPop Native is the obvious surface, but the FastAPI sidecar already owns memo-run jobs. Does the GUI talk to the sidecar (consistency with existing job/SSE pattern) or hold curation state in the native app? Recommendation: **sidecar-owned state, native UI as view**, mirroring the memo-run pattern.
3. **Chroma deployment topology.** One Chroma instance for all MemoPop firms (multi-tenant by metadata) vs. one per major customer (deployment cleanliness). Recommendation: **shared until a customer asks for isolation**, then collection-per-firm before DB-per-firm.
4. **Sensitivity flag default.** Should ingested firm sources default to `internal_only: true` (safe; analyst opts in to external citability) or `citable_externally: true` (frictionless; relies on analyst to flag the sensitive ones)? Recommendation: **`internal_only: true` by default**. The cost of accidentally citing a transcript in a shared memo is much higher than the cost of asking the analyst to flip a flag.
5. **AI-take provider.** Sonar (continuity, cheap), Anthropic `web_search` (one less vendor, better-grounded citations even at the commentary layer), or OpenAI deep-research (deeper synthesis, higher cost)? Recommendation: **Anthropic `web_search`** — same vendor as the writer, citations at least over real tool-call results, simpler dependency surface.
6. **Where the `Sources.md` schema lives.** This artifact (frontmatter + body markdown at `deals/<deal>/inputs/Sources.md`) wants a stable frontmatter shape. Recommendation: **define alongside `MemoState` in `src/state.py`**, version it via the `at_semantic_version` frontmatter field, and treat frontmatter schema changes the way we treat outline schema changes. The body sections (`## How this list was built`, `## Excluded — examined and rejected`, `## Open questions / coverage gaps`) are conventional, not enforced — a `Sources.md` with frontmatter only and no body is valid, just impoverished. The "examined and rejected" section in particular is the institutional-memory layer that closed the loop on "the next re-run keeps surfacing the same junk."
7. **Threshold calibration sequence (§6).** What rate counts as "low enough to ship" for fabricated citations and silent sourcing? Recommendation: **don't pick a number before measurement.** Instrument the check, run it against the existing v0.0.1–v0.0.7 ChromaDB memos to establish a baseline distribution (we already have seven runs of artifacts to learn from), *then* pick a soft "report-and-surface" threshold and a harder "human-pass-required" threshold. Until we see what typical-good and typical-bad runs actually look like, any number is invention.

## Cross-references

**Sibling explorations (this doc extends them):**

- [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]]
- [[Curating-only-valid-Sources-across-Runs]]

**Orchestrator-local context:**

- `[[../../apps/memopop-orchestrator/AGENTS.md]]` — §2, §4, §8, §9, §11 (load-bearing)
- `[[../../apps/memopop-orchestrator/context-v/plans/Trustworthy-Citations-Source-Harvester-Rollout]]` — the active plan this doc shrinks
- `[[../../apps/memopop-orchestrator/context-v/blueprints/Anti-Hallucination-Source-Validation-and-Removal]]` — the verdict-ladder lineage
- `[[../../apps/memopop-orchestrator/context-v/blueprints/Git-Submodules-for-Private-Data-and-Exports]]` — the sensitivity-flag thread
- `[[../../apps/memopop-orchestrator/context-v/issue-resolution/Containerizing-Internal-Comments-and-Recommendations-for-Consideration]]`
- `[[../../apps/memopop-orchestrator/context-v/issue-resolution/Containerizing-Risk-Assessments-and-Diligence-Skepticism]]`

**External references (May 2026 retrieval landscape):**

- Anthropic `search_result` block — <https://platform.claude.com/docs/en/build-with-claude/search-results>
- Anthropic web search tool — <https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool>
- Perplexity Search API (raw, non-Sonar) — <https://www.infoq.com/news/2025/09/perplexity-search-api/>
- Exa pricing update (March 2026) — <https://exa.ai/docs/changelog/pricing-update>
- Tavily docs — <https://docs.tavily.com/documentation/api-reference/endpoint/search>
- Valyu search API — <https://www.valyu.ai/search-api>
- Firecrawl best-search-APIs review — <https://www.firecrawl.dev/blog/best-web-search-apis>
- OpenAI deep research API guide — <https://developers.openai.com/api/docs/guides/deep-research>
- Linkup API — <https://docs.linkup.so/pages/documentation/api-reference/endpoint/post-search>

## One-sentence version

Keep the Sonar one-shot as quarantined commentary, route real research through best-of-breed retrieval APIs (Tavily, Valyu, Firecrawl, Jina) into a per-deal human curation GUI where the analyst ranks and prunes per section, then let Claude write the cited memo against the union of that approved corpus and the firm's standing Chroma RAG store using native `search_result` content blocks — so every cited URL is one a human approved and a machine fetched, and the writer is structurally unable to invent another.

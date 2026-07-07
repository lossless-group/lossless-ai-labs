---
title: "The Drag in AI-Assisted Web Research — Diagnosis, Prior Art, and the Open Forks for a Source Curation Gate"
lede: "AI-assisted web research and research-driven content generation produce so many hallucinated sources and so much noise-over-signal that going through it all creates a drag heavy enough that manual Google + Google Docs starts to look time-competitive. This issue records the diagnosis (the drag is structural, not a prompt problem — and our own corpus diagnosed it twice), reveals the prior art already scattered across dididecks-ai / augment-it / memopop-ai, and captures the open forks being grilled before we converge a reusable Source Curation Gate pattern."
date_created: 2026-06-27
date_modified: 2026-06-27
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.8 (1M context)
semantic_version: 0.0.0.1
status: Open
category: Issue
tags:
  - Issue
  - Source-Vetting
  - Source-Curation
  - AI-Assisted-Web-Research
  - Hallucinated-Sources
  - Noise-vs-Signal
  - Retrieval-Augmented-Generation
  - Human-in-the-Loop
  - SearXNG
  - Perplexity
  - Grounded-Generation
  - Pseudomonorepo
  - Knots-Pattern
related_skills:
  - pseudomonorepos
  - search-lossless-corpus
  - context-vigilance
  - crawl-fetch-ingest
---

# The Drag in AI-Assisted Web Research

> Problem-and-discussion record. The convergent *solution* pattern lives in [[Source-Curation-Gate]] (blueprint). This issue is the *why it hurts*, the *what we already have*, and the *open decisions*. Captured per the `pseudomonorepos` REFLECT phase so the grilling isn't lost.

## The problem (operator's words)

We use AI-assisted web research and AI-generated, research-driven content methods. We are likely not applying best practices. Either way:

- We get a lot of **hallucinated sources**.
- We get **noise when there should be signal**.
- Going through all the sources is **time-consuming and beyond frustrating**.
- The thing that should save time instead creates **a ton of drag** — to the point where **Google Search + Google Docs manual content development might be more time-efficient**.

This shows up in two of our apps that tackled it differently: **augment-it** (primarily via a "pack-runner" UI) and **memopop-ai** (primarily via the filesystem). **dididecks-ai** has the corpus + citation-model side. We want to converge a *third, independent but very similar* surface that: takes an LLM-generated list of web resources (usually Perplexity), treats each entry as an object that can be **sorted, edited, deleted, or archived**, can **launch a SearXNG search** per entry to pull metadata from the most relevant results, and lets **relevant results be added back into the list**.

## The reframe — the drag is structural, and we already diagnosed it twice

The drag is not a prompt-quality problem. It has two structural causes, both already on record in our own corpus.

### Cause 1 — retrieval and generation are conflated

One model call asked to *both search and write* invents URL-shaped tokens to fill citation-shaped holes — that is the smoothest completion. Diagnosed in **`memopop-ai/context-v/explorations/Separating-Retrieval-from-Generation-in-Agent-Pipelines.md`** (2026-06-08). Production evidence: **65 fabricated `example.com` URLs in one Panthalassa memo (v0.0.2)**. Operator verdict on record: *"Perplexity completely hallucinates sources — cannot be trusted at all."*

The remedy is a **Harvester (finds + validates URLs, emits a corpus with stable IDs) / Writer (structurally disarmed, cites by ID only)** split.

### Cause 2 — triage happens at the wrong unit and the wrong time

Reviewing sources *per-URL*, *post-generation*, *after* fabrications are already woven into prose. **augment-it** ran the experiment and measured the cost: the **OfficialPulse audit hit a 99.7% reject rate** (1,982 responses, 3 accepts), root-caused not to the *volume* of triage but to the *unit of work* being wrong (per-URL when it should be per-source-object). The drag is a units bug.

### Cause 3 — Perplexity is being used against its grain

Sonar is a *generative-search* model: genuinely good at synthesized commentary ("what does a well-read generalist think about this deal"), catastrophic at load-bearing citations. **`memopop-ai/context-v/explorations/Human-Curated-Source-Sets-and-Per-Firm-RAG-for-Memo-Narrative.md`** (2026-05-22) already made the call: keep the Perplexity output as a **quarantined "AI take" exhibit** (`0-ai-take.md`), and **no URL from it ever propagates into the cited corpus**.

### The convergent fix already exists three times over

All three apps independently grew the same organ: a **human curation gate between retrieval and generation** that produces a *ranked, pruned, provenance-stamped* source set, which becomes the closed corpus a structurally-disarmed writer cites from (Anthropic `search_result` blocks bind citations to a block index, not a URL string). The keystone theory — **facts are *retrieved*, framing is *generated*** — is in **`ai-labs/context-v/explorations/Corpus-Grounded-Generation-of-Decks-and-Memos.md`** (2026-06-19). The UI the operator described *is the missing extraction of a pattern built three times.*

## The prior art (the reveal)

### Keystone documents

| Doc | Repo | Date | Contributes |
|---|---|---|---|
| `Corpus-Grounded-Generation-of-Decks-and-Memos.md` | ai-labs parent | 2026-06-19 | Five failure modes of drift; fact-slot/framing-slot reframe; 5-stage pipeline (ingest→graph→retrieve→generate→verify). The gate is the human front of Stage 3. |
| `Human-Curated-Source-Sets-and-Per-Firm-RAG-for-Memo-Narrative.md` | memopop | 2026-05-22 | The gate spec itself (candidate list, verdict badge, snippet+provenance, drag-to-rank, x-out, persist to `Sources.md`) + the May-2026 retrieval-provider landscape + `search_result` grounding. |
| `Separating-Retrieval-from-Generation-in-Agent-Pipelines.md` | memopop | 2026-06-08 | The why: harvester/writer split. |

### Half-built three times

**memopop (filesystem-primary):**
- `Curating-only-valid-Sources-across-Runs.md` (2026-06-08) — the **verdict ladder** (`verified-accessible`, `verified-gated`, `thin`, `title-swapped`, `verified-via-republish`) + heuristics (soft-404, paywall, title-swap, body-length < 2KB, known-hallucination URL shapes). Pass A (dedup) / B (validity) / C (human override).
- Live data model: `apps/memopop-orchestrator/io/<firm>/deals/<deal>/inputs/Sources.md` — YAML frontmatter per source: `url, title, publisher, sections[], rank, sensitivity, note`.
- Output artifacts: `redacted-hallucinations.md`, `source-validation-log-cleanup_sections.json`.

**augment-it (UI-primary — closest to the target UI that already runs):**
- `Search-Providers-as-First-Class-SearXNG-Default.md` — **SearXNG already the default connector**; Tavily for content-RAG. Seam at `services/social-search/src/connectors/{tavily,searxng,serpapi,gdelt,...}.ts`.
- `apps/pack-runner/App.svelte` + `ConnectorPalette.svelte` — per-row, per-provider re-fire. The "launch a SearXNG search from a list entry" mechanism, already coded.
- `services/social-search/src/scoring.ts` — confidence pill 0–100 (tier-1 URL-shape +60, name-exact +30, recency +10, sibling-ambiguity caps 60); `verification.ts` — hostname-whitelist + URL-normalization dedup key.
- `Response-Reviewer-Shell-and-Content-Reader-Mode.md`, `Enhanced-Records-List-and-Promotion-Checkpoint.md` — per-object triage + record identity (`record_uuid`) + promote-subset + `archived` flag.
- `Per-Record-Iteration-as-Primary-Surface-for-Pack-Fires.md` — validate on 4–8 records by hand *before* bulk fan-out.

**dididecks (corpus-primary):**
- `Substantiation-Corpus-Data-Model.md` (2026-06-07) — `CorpusItem` (pointer-only, provenance, `superseded_by`).
- `Dididecks-AI-DD-Ready-Citation-and-Source-Access.md` — receiving-side verifiability; archive-on-cite for link-rot.

**Shared substrate (ai-labs parent):**
- `Chat-As-Verb-Surface-Patterns.md` / `Per-App-Workspace-Conventions.md` — `CapabilityResult<T>` envelope + `entity.verb` registry the gate's `source.*` verbs register against.

## The packaging discipline — knots-style, NOT a shared dependency

**Hard constraint from the operator (2026-06-27):** dididecks-ai, augment-it, and memopop-ai are **fundamentally different apps and stay that way for now.** ai-labs is a pseudomonorepo. The cross-app sharing model is the **`astro-knots` `knots` lesson**: `@knots/*` as imported dependencies **failed** (too much abstraction overhead; UI components especially, because "sites diverge too much in design for generic components to be useful"). What survived: **co-located development + shared `context-v/` documents + selective copy-from sample code**, cross-referenced with `@context-v/*`. Only genuine dependencies get published (`@lossless-group/lfm` is the one real package).

**Therefore the Source Curation Gate is shared as a *pattern*, not a *package*:**

- The **blueprint** ([[Source-Curation-Gate]]) + any **sample code** live at the ai-labs parent level.
- Each app **re-implements** the gate against its own stack and data model, **conversationally linked** back to the blueprint via `@context-v/*` and `[[wikilinks]]`.
- **Do not** propose a shared microfrontend, a published `@gate/*` package, or any true import dependency across the three apps. That is the move that already didn't work.
- Convergence is achieved by **shared vocabulary and shared schema shape** (the Source object, the verdict ladder, the `source.*` verbs), not shared runtime code.

## The grilling — open forks (answers fold into [[Source-Curation-Gate]])

Recommendations attached; each is meant to be argued with.

### On research methodology

- **G1 — The gate's primary verb may need to be "search better," not "triage."** Candidate-pool quality is set upstream by query construction; a gate that only polishes a bad list is lipstick. memopop admits the gate "does NOT solve the harvester's query construction." *Recommendation: rejected sources teach the next SearXNG query (negative keywords, domain exclusions) — a query-refinement loop, not just a triage loop.* **Fork: is the gate a search loop or a triage tool?**
- **G2 — Perplexity is the worst possible seed and the task enshrines it.** Its URLs are structurally fabricated. *Recommendation: treat the Perplexity list as a topic-and-entity / claim extractor, discard its URLs wholesale, and use SearXNG/Valyu to find real sources for those claims.* **Fork: keep its URLs, or mine it for claims and throw the URLs away?**
- **G3 — SearXNG returns thin SERP metadata; grounding needs the fetched body.** *Recommendation: two-tier — SearXNG for discovery + ranking, then Jina Reader on promoted-only URLs for the verbatim body.* **Fork: two network tiers, or one-call retrieve+extract (Firecrawl) and eat the cost?**

### On RAG discipline

- **G4 — "Relevant results can be added" — relevant to *what*, measured *how*?** If relevance = eyeballs, it doesn't scale; if = a model score, it drifts. *Recommendation: relevance = embedding match against the specific unfilled fact-slot the deliverable needs, not against the topic.* **Fork: embedding-match relevance now, or human judgment at v1?**
- **G5 — Verbatim-or-bust at ingest.** Keystone doc forbids LLM-summarizing at ingest (failure mode #3, ingest distortion; MemPalace 92.9% vs Mem0 30–45% rides on this). *Recommendation: the gate may display an LLM summary as convenience, but the stored, citable artifact is always the verbatim fetched body.* **Fork: store verbatim only, or also store extracted "key facts" (and accept distortion)?**
- **G6 — Auto-validate before the human sees the list, or the drag never dies.** memopop principle: "validate before the human ranks; the analyst never clicks past dead URLs." *Recommendation: the verdict ladder runs automatically on import; the human spends attention only on rank + relevance, never on liveness.* **Fork: auto-validate as a hard precondition, or analyst-triggered at v1?**

### On scope and architecture

- **G7 — Does the gate end at "promoted corpus," or own generation too?** *Recommendation: stop at the promoted, grounded corpus (`Sources.md` + optional Chroma collection); generation is a separate consumer — that is what keeps it droppable into all three apps.* **Fork: stop at corpus, own generation, or also own upstream query refinement (G1)?**
- **G8 — "Independent" packaging.** *Settled by the knots constraint above:* shared **pattern + sample code** at the parent, **re-implemented per app**, never a shared dependency. The remaining sub-fork is only *where the first reference implementation gets built* (which app hosts the sample others copy from).

### The four load-bearing forks to settle first

1. **First reference implementation** — which app hosts the sample code the others copy from? (augment-it has the most already-built: pack-runner + connectors + scoring. memopop has the data model + the live pain. dididecks has the corpus/citation model.)
2. **Scope boundary (G7)** — stop at corpus / own generation / own query refinement.
3. **Perplexity seed handling (G2)** — keep URLs (validate hard) / mine claims and discard URLs / both (sealed AI-take + mined claims).
4. **Validation ownership (G6)** — auto-on-import / analyst-triggered / hybrid (cheap auto, deep on-promote).

## Anti-patterns (carried into the blueprint)

- Letting AI-take URLs leak into the corpus.
- Triaging post-generation, per-URL (OfficialPulse 99.7%).
- Treating rank as cosmetic (it drives hedge calibration + contradiction tie-break).
- HTTP-200 as validity (soft-404s, paywalls, title-swaps).
- **Proposing a shared dependency/microfrontend across the three apps** — knots already proved that fails; share the pattern, not the package.

## Related

- [[Source-Curation-Gate]] — the convergent solution pattern (blueprint).
- [[Corpus-Grounded-Generation-of-Decks-and-Memos]] — the generation theory the gate feeds.
- [[Human-Curated-Source-Sets-and-Per-Firm-RAG-for-Memo-Narrative]] — the gate spec + provider landscape (memopop).
- [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] — harvester/writer split (memopop).
- [[Curating-only-valid-Sources-across-Runs]] — verdict ladder + heuristics (memopop).
- `astro-knots/README.md` — the knots lesson on shared-pattern-vs-shared-dependency.
- augment-it: `apps/pack-runner/`, `services/social-search/src/{scoring,verification,connectors}.ts`.
- memopop: `apps/memopop-orchestrator/io/<firm>/deals/<deal>/inputs/Sources.md`.

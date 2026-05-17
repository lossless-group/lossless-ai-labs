---
title: "Separating Retrieval from Generation in Agent Pipelines"
lede: "When the same LLM agent both searches the web and writes the prose that cites those searches, it can't help fabricating URLs. This is not a bug — it's the predictable failure mode of asking one cognitive process to do two different jobs. Here's the agent topology that makes citation hallucination structurally impossible."
date_authored_initial_draft: 2026-05-14
date_authored_current_draft: 2026-05-14
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-14
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Exploration
tags:
  - Agent-Topology
  - Retrieval-Augmented-Generation
  - Hallucination
  - Source-Quality
  - Citation-Discipline
  - LangGraph
  - MemoPop
  - Architecture
authors:
  - Michael Staton
image_prompt: A factory line split into two stations — the first station is a librarian carefully pulling real books from a shelf and stamping each with a barcode; the second station is a writer at a typewriter pulling barcoded slips from a basket and composing prose, with a sealed glass wall between them so the writer can never reach the shelf directly; deep-violet background, technical annotation labels in a monospaced font, library-and-print-shop aesthetic.
date_created: 2026-05-14
date_modified: 2026-05-14
from: "memopop-ai"
from_path: "context-v/explorations/Separating-Retrieval-from-Generation-in-Agent-Pipelines.md"
---
# Separating Retrieval from Generation in Agent Pipelines

## The trigger

We just ran [[Curating-only-valid-Sources-across-Runs]] on the ChromaDB memo and got back 159 unique URLs across seven runs. Spot-checking the top of the master list surfaced an obvious soft-404: `https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-knowledge-bases-now-supports-four-new-data-sources/`. AWS returns a clean `HTTP 404` for that URL with `<title>404 Not Found</title>` in the body. The orchestrator had nonetheless catalogued it as `HTTP: 200` and the LLM-citation pass had used it.

The first instinct was: "we need better URL validation in the curation step." Build a Pass B that actually fetches each URL, sniffs the body for soft-404s, drops the dead ones. That's a real fix — but it's a *downstream* fix. The garbage is already in the artifact by the time curation runs. The deeper question is **how the URL got there in the first place**.

The answer: the **research agent** is responsible for both finding sources *and* writing the prose that cites them. When the same LLM call is doing both jobs, it doesn't reliably distinguish "URLs the search tool actually returned" from "URLs that would plausibly support this sentence I'm writing." It fills citation-shaped holes from training-data memory. The AWS URL is exactly what an AWS blog post about Bedrock data sources *would* be named if it existed — and the LLM rendered that as fact.

This document is the architectural option-space for making that failure mode structurally impossible.

## What's actually happening today

The current `research_enhanced.py` agent has tool access (Tavily, Perplexity, web search) AND it produces a written research synthesis with inline citations. The downstream `citation_enrichment.py` agent runs after the writer has drafted sections, and it asks Perplexity Sonar Pro to *add* citations to existing prose. Both agents conflate two different cognitive tasks:

1. **Retrieval** — calling a tool, getting back a deterministic set of real URLs and real fetched content.
2. **Generation** — writing prose that's coherent, on-thesis, and well-cited.

The LLM is good at both. It is *not* good at noticing which of the two it is currently doing. When prose generation needs a citation to feel complete, the model produces a plausible citation. The fact that no tool call retrieved that URL is invisible to the model — there's no internal "I made this up" flag.

The damage compounds:

- **`research_enhanced.py`** writes a sources array with URLs that may or may not have come from Tavily. No structural guarantee.
- **`citation_enrichment.py`** is *explicitly* asked to invent citations for existing prose. It's the worst offender — the prompt itself rewards URL fabrication.
- **`citation_validator.py`** has a buggy `if extracted_url and len(issues) == 0` clause that skips URL accessibility checks whenever any other issue is present. Self-disabling validation.
- **`remove_invalid_sources.py`** uses HEAD-only `urllib` checks. Misses soft-404s entirely because it never reads response bodies.

So even the existing "defenses" are accidentally porous, and the deeper architecture has no concept of "URLs must come from tool calls."

## The pattern: retrieval and generation as separate agents

In a well-designed RAG pipeline, retrieval is a closed-world tool call and generation is a closed-world prose call. The contract between them is **a corpus** — a finite, identified, fetched set of source records. The generation step is given the corpus *as data* and told to cite by ID, not by URL. The model never has the opportunity to invent a citation because there is no URL-shaped slot to fill — there is an ID-shaped slot, and the IDs are an enumerable list.

Concretely, two agents replace the current one:

### 1. Source Harvester

**Sole job:** find and validate URLs. **Sole output:** a corpus.

- Calls search tools (Tavily, Perplexity in research-only mode, Firecrawl, scraper modules) per a section-specific query strategy from the outline.
- Validates every returned URL inline: real GET, follow redirects, body sniff for soft-404 / paywall, fuzzy title match against the search-result snippet, hallucination-pattern preflight, 30-day disk cache.
- Drops anything that fails validation. The harvester's output never contains a URL that wasn't fetched and checked.
- Assigns a stable ID to each surviving source (`src-001`, `src-002`, …).
- Stores fetched body excerpts (first ~10KB of extracted text) alongside the metadata, so downstream agents can ground claims against real content rather than against URL-as-incantation.
- Emits `sourced_corpus.json` — an array of `{id, url, canonical_url, title, fetched_at, body_excerpt, summary, retrieval_query, retrieval_tool}`.

The harvester does **no narrative work**. It does not write prose. It does not synthesize findings into paragraphs. It is a librarian, not a writer.

### 2. Section Writer

**Sole job:** write prose. **Sole output:** marked-up section drafts.

- Receives `sourced_corpus.json` as structured data, not as prose to summarize.
- Receives the section's guiding questions from the outline.
- Is prompted explicitly: *cite from the corpus by `id` only; if a claim cannot be supported by an entry in the corpus, either drop the claim or surface a `<needs-source claim="..." />` marker*.
- Never has access to search tools. Cannot make tool calls. Cannot produce a URL.
- A post-process step swaps `id` references back to `[^N]` citation markers and assembles the citation list from the corpus.

The writer's prompt explicitly forbids URL generation. Even if it tried, the post-process would reject anything that didn't resolve to a corpus ID. The model is structurally disarmed from the failure mode.

### 3. Citation Enrichment (optional, narrow)

Today's enrichment step is the single biggest source of fabricated citations. In the new shape it's either deleted or reduced to a narrow role:

- It runs **only** where the writer surfaced `<needs-source>` markers.
- It passes those specific claims to the harvester (not directly to an LLM), asking the harvester to find supporting sources for each one.
- Any URLs the harvester returns go through the same validation gate as every other URL.
- The writer's `<needs-source>` markers are replaced with citations to the newly-harvested sources, OR the claim is left flagged for human review.

Either way, no URL ever enters the artifact without passing through the harvester.

## Why this works (and where it stops working)

The fundamental property: **every URL in every output is one the harvester fetched and validated.** Not "the LLM said it was real" — actually fetched. This isn't a heuristic, it's a structural invariant. The writer cannot violate it because the writer has no tool to violate it with.

That property holds *as long as the boundary holds*. The places it breaks:

- **A future engineer gives the writer a tool.** Tempting to add "let the writer call search if it really needs to." The moment that happens, the property is gone. The writer should be told its access pattern is intentional and document why.
- **The harvester's validator misses a soft-404.** Then the corpus contains a bad URL with a green checkmark. The writer dutifully cites it. Garbage in, garbage out — but at least it's *trackable* garbage with a clear point of failure (the validator), not diffuse garbage that could have come from anywhere.
- **The model invents a corpus ID.** It can write `[src-047]` when there are only 32 sources. The post-process catches this — `[src-047]` doesn't resolve, so it becomes a `<needs-source>` marker rather than a silent fabrication. Easy to detect; impossible to launder into output.

The retrieval/generation split doesn't make the system perfect. It moves the failure surface from "anywhere the LLM touched prose" to "the harvester's URL validator." That's a much smaller, more testable surface.

## What it costs

- **Two model calls instead of one per section.** Harvester runs the search-tool loop; writer runs a generation-only call. Roughly equivalent total tokens, but two API roundtrips and a serialized handoff.
- **A corpus-and-id contract.** State schema gets a new `sourced_corpus` field. Section prompts get an injected corpus block. Post-process gains an ID-to-citation swap. None of these are large; together they're a meaningful prompt-and-state-shape rewrite.
- **Loss of "elegant prose with citations naturally woven in."** Today the writer + enricher produce prose where citations feel organic to the sentence. The new pipeline produces prose with explicit ID slots, then mechanically swaps them. The result reads the same to a human, but the writer prompt is more constrained — less room for stylistic citation placement.
- **Cold-start cost.** First run on a new memo does real fetches for every source. Cache amortizes this on subsequent runs, but the first iteration is slower than today's tool-call-and-trust approach by ~30–60 seconds.

These costs are real. They're the price of the structural guarantee. The alternative — post-hoc curation, soft-404 sniffing, manual triage of 159 URLs — costs more in human attention and trust.

## What this does NOT solve

- **The harvester's choice of *which* sources to fetch.** Tavily and Perplexity will still return the same handful of high-PageRank URLs for similar queries across sections. The harvester needs section-specific query construction — different question per section, prompted to find non-overlapping evidence. Outline-level concern, not topology-level. Out of scope for this exploration but a known follow-up.
- **Source quality beyond URL validity.** A URL can be `verified` (real, fetched, content matches title) and still be a low-quality source — an SEO blog with no expertise, an aggregator copying a primary source, an AI-generated content farm. Editorial quality filtering is a separate layer.
- **Claims that the source doesn't actually support.** The writer can cite a real, validated source and still misrepresent what it says. Catching this requires reading both the claim and the source body and comparing them — a fact-checker job, not a topology job. The corpus's `body_excerpt` field makes this easier (the data is right there) but doesn't do it automatically.
- **The fact-corrector loop.** Today `fact_corrector.py` rewrites claims and can introduce new URLs in the process. Same retrieval-vs-generation problem. Either the corrector becomes pure rewrite-against-existing-corpus, or it routes new-source requests back through the harvester.

## Migration shape

Not a rewrite — a careful disentangling. Rough order:

1. **Extract a `source_harvester.py` agent** that takes the section's query strategy and emits a corpus. Initially: wrap the existing Tavily/Perplexity calls, add the validator from [[Curating-only-valid-Sources-across-Runs]] as the gate.
2. **Change the writer's prompt and state contract.** Inject `sourced_corpus` into the per-section writer call; demand `[src-NNN]` references; forbid bare URLs.
3. **Add the ID-to-citation post-process.** Swap `[src-NNN]` for `[^N]`, assemble citation list from the corpus.
4. **Demote `citation_enrichment.py`.** Make it a `<needs-source>`-resolver only, routing through the harvester. Or delete it outright if the writer's corpus coverage is good enough.
5. **Fix the `citation_validator.py` bypass bug** (line 302) regardless of which path we take — that's a one-line fix, free.
6. **Audit `fact_corrector.py` and other URL-introducing agents** for the same retrieval/generation conflation; route them through the harvester.

Each step is independently testable. The pipeline keeps working at every checkpoint; the structural guarantee strengthens incrementally.

## Decision points

1. **Strict mode or hybrid?** Strict = writer cannot output bare URLs, ever. Hybrid = writer can output URLs, but they must match a corpus entry or get auto-stripped. Recommendation: **strict from the start**. Hybrid is a slippery slope back to "the LLM mostly gets it right."
2. **What does the writer see — full body excerpts or just summaries?** Full excerpts make grounding stronger but blow up the prompt size. Recommendation: **summaries by default**, with full excerpts available on a per-source basis when the writer flags `<needs-deeper-grounding>`.
3. **Where does the harvester live in the graph?** Run-once-per-memo with all sections' queries batched, or run-per-section? Recommendation: **run-per-section**, so each section gets a targeted corpus. Allows cache hits across sections (a source useful in two sections only gets fetched once).
4. **`citation_enrichment.py` — narrow it or delete it?** Today it's load-bearing because the writer's coverage is thin. If we shift writer coverage up by feeding it a richer corpus, the enricher might be obsolete. Recommendation: **narrow it first**, measure how often the writer surfaces `<needs-source>`, then decide.

## Related

- [[Curating-only-valid-Sources-across-Runs]] — the downstream curation pass that surfaced this problem. The validator from that doc becomes the gate inside the harvester here.
- The orchestrator's `templates/outlines/` system already supports per-section `preferred_sources` and Perplexity `@`-syntax. That metadata is the natural input to the harvester's query strategy — it tells the harvester *where* to look, not just *what* to look for.

## The one-sentence version

Make it structurally impossible for an LLM to introduce a URL — every URL must come from a tool call, get validated, and earn an ID before any writer agent can reference it.

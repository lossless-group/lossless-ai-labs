---
title: "Graphiti Over the Lossless Corpus"
lede: "Chroma answers 'what did we write that sounds like this.' It cannot answer 'what changed about this, and when.' Graphiti's bi-temporal knowledge graph is the shape that second question wants — so we pointed it at the changelog rollup, the one slice of the corpus that is natively made of dated events, and left the other 28,000 chunks alone until the bet proves out."
date_created: 2026-08-14
date_modified: 2026-08-14
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.1.0
status: Draft
tags:
  - Graphiti
  - Knowledge-Graph
  - Temporal-Reasoning
  - Neo4j
  - ChromaDB
  - Retrieval
  - Context-Engineering
  - Ollama
publish: true
from: "context-vigilance-kit"
from_path: "context-v/explorations/Graphiti-Over-The-Lossless-Corpus.md"
---
# Graphiti Over the Lossless Corpus

## Why care?

The kit already has retrieval. Four Chroma collections, ~28,000 chunks, wired
into every session through an MCP server. It works, and the root `CLAUDE.md`
tells every agent to reach for it before answering from training data.

But Chroma is answering exactly one kind of question: *what did we write that
sounds like this?* Similarity over a bag of chunks. Ask it "when did we ship the
Chroma corpus" and it returns five chunks that talk about shipping and Chroma,
ordered by cosine distance, and you read them and work it out yourself. Ask it
"what changed about our OG image approach between May and August" and it has no
mechanism at all — there is no *between* in a vector index.

The [Graphiti profile](../../../studies/memory-layers-for-agents/context-v/profiles/Profile__Graphiti.md)
in the memory-layers study called this out before we ever tried it:

> You wouldn't replace `context-vigilance` with Graphiti — the human-readable
> markdown layer is irreplaceable for human review. But if we ever needed to
> make wikilink relationships first-class to an agent (e.g., "find every spec
> that depends on a blueprint that was superseded after 2025-Q1"), Graphiti's
> data model is the shape that question wants.

This exploration is the first attempt to cash that in.

## The bet

Graphiti stores **typed entities and typed, bi-temporally versioned edges**.
Every fact carries four time fields, and the split between two of them is the
whole point:

- `valid_at` / `invalid_at` — *valid time*. When the fact became, and stopped
  being, true in the world.
- `created_at` / `expired_at` — *system time*. When the graph learned it, and
  when the graph retired it.

Those can differ, and the difference is the interesting part. "We moved
calmstorm-decks under dididecks-ai" became true on one date and was recorded on
another. A vector index flattens both into "a chunk that mentions the move."

So the bet is: **a graph over dated events answers questions about change that a
vector index structurally cannot.**

## Why the changelog, and not the whole corpus

The instinct is to point it at `context-vigilance-corpus` — 9,453 chunks of
specs, plans, and explorations, the place "what did we decide about X" actually
lives. Two reasons we did not.

**Cost.** Graphiti is not Chroma. Chroma costs one cheap local embedding per
chunk; the whole ingest runs in minutes on a laptop. Graphiti runs an LLM
extraction call plus dedup calls *per episode*. Extrapolating across ~28,000
chunks is a serious bill and many hours of wall clock. That is not a reason
never to do it — it is a reason not to do it first.

**Fit.** Changelog entries are *dated events*, which is exactly the data shape
the bi-temporal model was designed for. Specs and explorations are mostly
atemporal by comparison — a spec describes a desired end state, not a thing that
happened on a date. If the temporal graph is going to earn its keep anywhere, it
earns it here first. If it *doesn't* pay off on 479 dated ship records, that is
a strong signal not to spend 20× more on the atemporal material.

Current slice: **479 changelog entries across the tree, 2025-01-02 → 2026-08-14.**

## The stack, and why each piece

| Layer | Choice | Why |
|---|---|---|
| Graph store | Neo4j 5.26 (Docker) | Reference backend for graphiti-core; Lucene fulltext; we already know it |
| Extraction | Anthropic `claude-haiku-4-5-latest` | graphiti-core's own default for the Anthropic client; right tier for high-volume structured output |
| Embeddings | Ollama `all-minilm` (384-dim) | Local, no API key, same MiniLM family the Chroma collections already use |
| Reranking | Passthrough | Reranking is search-time only; RRF/MMR recipes don't use it. Keeps us off a third API |

### Why not FalkorDB

Upstream's MCP server defaults to FalkorDB and bundles it in a single container,
which is genuinely simpler. We took Neo4j anyway, for one concrete reason
visible in the pinned source: **the FalkorDB driver degrades fulltext search.**

Graphiti's Neo4j path (`driver/neo4j/operations/search_ops.py:54-73`) runs
`lucene_sanitize` and preserves Lucene semantics with `max_query_length=8000`.
The FalkorDB path (`driver/falkordb_driver.py:344-425`) has to paper over
RediSearch: it translates ~30 punctuation characters to whitespace, strips
stopwords, joins the survivors with `' | '` — pure OR — and caps at 128 tokens.
Hybrid search fuses BM25 with cosine and BFS, so the other two legs carry you,
but the keyword leg is measurably weaker. That, plus zero learning cost, decided
it. FalkorDB's sparse-matrix traversal story gets more interesting if this ever
scales to the full corpus.

### Two upstream gotchas worth writing down

**1. There is no sentence-transformers embedder in graphiti-core.** The MCP
server README advertises `provider: "sentence_transformers"` for local setups.
That value is not implemented — `mcp_server/src/services/factories.py` handles
`openai`, `azure_openai`, `gemini`, `voyage`, then falls through to
`raise ValueError(f'Unsupported Embedder provider: {provider}')`. Local
embeddings therefore go through Ollama's OpenAI-compatible `/v1/embeddings`
endpoint using the `openai` provider. This works because `OpenAIEmbedder`
truncates dimensions client-side rather than sending a `dimensions` request
parameter Ollama would reject.

**2. The cross-encoder is constructed eagerly.** `graphiti.py:227` does a bare
`OpenAIRerankerClient()` when you pass `cross_encoder=None` — which raises on a
missing `OPENAI_API_KEY` even though reranking never runs during ingest. Passing
an explicit passthrough is what keeps an Anthropic-plus-local stack from
demanding an OpenAI key it will never use.

## The ontology

Custom Pydantic entity types are Graphiti's ontology surface, and the profile is
blunt that retrofitting them is painful — so they are defined up front, tuned to
what Lossless changelogs actually talk about:

- **Repo** — a repository or project in the tree
- **Capability** — a feature, surface, script, or command that shipped or changed
- **Convention** — a practice, standard, or rule adopted (skills, schemas, tiers)
- **Tool** — a third-party dependency, service, framework, or model
- **Person** — a named human

The `Capability` / `Convention` split is the one doing real work. A changelog
entry usually announces both — a thing built, and a rule adopted about how such
things get built — and they age differently. Capabilities get replaced;
conventions get superseded.

## What this does not replace

Chroma stays. The two indexes answer different questions and the honest posture
is that this is **additive, not a migration**:

- *"What have we written about X?"* → Chroma. Broad recall over the whole corpus,
  cheap, already covers all 28,000 chunks.
- *"When did X happen, what changed, what superseded what?"* → Graphiti. Narrow,
  expensive, currently covers only the changelog.

An agent that reaches for the graph to answer a similarity question will get
worse results than Chroma gives, because the graph has seen 479 documents and
Chroma has seen thousands.

## Open questions

1. **Does the extraction actually produce useful entities over Lossless prose?**
   Our changelogs are dense with proper nouns that are also common words
   (`splash`, `corpus`, `studies`, `knots`). Entity resolution could smear
   `splash` the Astro site into `splash` the generic noun. Unmeasured.

2. **Does supersession work without explicit pointers?** The profile flags this
   as the thing to be skeptical about — Graphiti has no `superseded_by` pointer
   pair, and depends on dedup quality at ingest to set `invalid_at` correctly.
   The tree has real supersession events (repo relocations, convention changes,
   the eight-folder taxonomy replacing the older one). Whether the graph
   represents them correctly is the sharpest test available.

3. **Is a haiku-tier model good enough for extraction?** graphiti-core defaults
   to it, but the profile warns that smaller models produce schema-mismatched
   JSON and extraction failures. The ingester counts failures per run; if that
   number is non-trivial, the next lever is a larger extraction model, not a
   different graph.

4. **77 of 479 entries have no date in frontmatter** and fall back to file
   mtime, which is a poor temporal anchor — a reformatting pass rewrites it.
   That is a `changelog-conventions` compliance gap the graph surfaced as a side
   effect. Worth fixing at the source regardless of what happens to Graphiti.

5. **Is MCP the right delivery surface, or is a script enough?** Every MCP
   server costs context in every session. Adding one for a 479-document graph
   needs to earn that. `scripts/query-graphiti.py` deliberately exists so the
   graph can be judged before the MCP server is wired.

## Status

Infrastructure is built and verified end to end — Neo4j up, indices created,
Ollama embeddings round-tripping at 384 dimensions, discovery finding all 479
entries. The extraction pass has **not** been run; it needs an
`ANTHROPIC_API_KEY`, which graphiti-core requires as a raw key and cannot borrow
from Claude Code's session auth.

## See also

- [[Profile__Graphiti]] — the study profile this exploration cashes in
- [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-v]] — the vector-index
  counterpart this sits beside
- `docker-compose.graphiti.yml`, `scripts/ingest-changelogs-to-graphiti.py`,
  `scripts/query-graphiti.py`, `scripts/graphiti_clients.py`

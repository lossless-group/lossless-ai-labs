---
site_uuid: 28ef44e0-398b-4e03-a578-aff0af29492b
hex_code: cnozec
title: "Chroma and Graphiti Gotchas"
lede: "Neo4j has to be running. The model alias in graphiti-core's own default doesn't resolve. And `publish: false` means one thing to the changelog ingester and nothing at all to the context-v one. Short, sharp, learned the hard way."
summary: "Corrections for agents working with the kit's two retrieval layers — Chroma for semantic search, Graphiti-on-Neo4j for the temporal graph. Covers the query discipline, the frontmatter keys each layer actually reads, the three load-bearing initialisation gotchas in graphiti_clients.py, and the publish-gate asymmetry between ingesters. Read before querying either layer, before running any ingest, and before changing frontmatter that a retrieval layer consumes."
publish: true
date_created: 2026-08-17
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: Draft
tags:
  - Reminder
  - Chroma
  - Graphiti
  - Neo4j
  - Retrieval
  - Ingestion
from: "context-vigilance-kit"
from_path: "context-v/reminders/Chroma-and-Graphiti-Gotchas.md"
---
# Chroma and Graphiti Gotchas

Two retrieval layers, different failure modes. Chroma answers *what did we say
about X*; Graphiti answers *what happened, when, and in what order*.

## Querying

**Search the corpus before answering from training data.** "What did we decide
about X", "when did we ship X", "why X over Y", "has this errored before",
"where did we put X" — all corpus questions. Start with
`mcp__chroma__chroma_query_documents`, `n_results=5`.

**Cap at 5 queries per question.** If the corpus does not have it, say so
explicitly. Do not quietly fall back to training data and present it as recall.

**Cite `source_path` + timestamp + `source_repo_slug` for every claim.** A corpus
answer without provenance is indistinguishable from a guess.

**Four collections — pick deliberately.** `context-vigilance-corpus` (section-
chunked context-v), `lossless-changelog` (cross-repo entries),
`claude-code-sessions` (prior message turns), `claude-code-tool-traces` (prior
tool calls, with success/error flags — this is the one for "has this failed
before").

## Ingestion

**Never re-ingest as a side effect of unrelated work.** The operator runs it
deliberately. `scripts/ingest-all.sh` is the master.

**Say when the corpus is stale.** After any sweep that touched frontmatter, the
indexes lag the tree. Answering from a stale index without flagging it is worse
than not answering — the reader cannot tell the difference.

**Graphiti ingestion is expensive.** Each episode is an LLM extraction call plus
dedup calls against recent episodes. It is not a cheap re-run.

**Episodes must be replayed oldest-first.** Graphiti resolves each episode
against the most recent prior ones, so chronological order is not cosmetic —
shuffling it produces a different graph.

## Frontmatter the retrieval layers actually read

**Graphiti's temporal anchor, in order:**

```
date_authored_initial_draft → date → date_created → date_modified → file mtime
```

An entry that reaches the mtime fallback lands at the **wrong point in the
graph** — a reformat pass rewrites mtime. The ingester counts these as `undated`;
that count is a defect signal, not noise.

**`publish: false` is not one rule.** The two ingesters disagree, and this has
already caused a real problem:

| Ingester | Skips on |
|---|---|
| `ingest-changelogs-to-chroma.py` | `private: true` **or** `publish: false` |
| `ingest-changelogs-to-graphiti.py` | `private: true` **or** `publish: false` |
| `ingest-to-chroma.py` *(context-v)* | `private: true` **only** |

So on a **context-v** document, `publish: false` gates the website and nothing
else. Only `private: true` keeps it out of the corpus. **Do not reach for
`publish: false` as a confidentiality control on a context-v doc** — it will not
do what it looks like it does.

**And `publish` is not an aggregation control either.** It is set by an author
for *their* repo's surface. See
[[Sweep-for-Frontmatter-Consistency-&-Improvements]].

## Graphiti + Neo4j initialisation

**Neo4j must be running.** `bolt://localhost:7687`, user `neo4j`. If ingestion or
queries fail with a connection error, check this first — it is the single most
common cause and it looks like a code bug.

**Three load-bearing, non-obvious things** live in `scripts/graphiti_clients.py`.
Both the ingester and the query script build from that module precisely so they
cannot drift apart:

1. **`EMBEDDING_DIM` must be in the environment BEFORE `graphiti_core` is
   imported.** It is read at module-import time into a constant used to build the
   zero-vector fallback. Set it late and the fallback is 1024-wide while the real
   vectors are 384-wide.

2. **Pass an explicit `cross_encoder`.** Passing `None` makes graphiti-core
   eagerly construct an `OpenAIRerankerClient`, which raises on a missing
   `OPENAI_API_KEY` — even though reranking only ever runs at search time. We
   stay off OpenAI entirely.

3. **Do not use graphiti-core's default model alias.** Its `DEFAULT_MODEL` is
   `claude-haiku-4-5-latest`, that alias does **not** resolve, and the API
   returns `404 not_found_error` on every call. Pin the dated id:
   `claude-haiku-4-5-20251001`.

**Never mix embedders against one graph.** Both layers use 384-dim `all-minilm`
via Ollama, which keeps the Chroma and Graphiti indexes comparable. A different
embedder silently poisons cosine search — no error, just quietly wrong
neighbours.

**Ollama compatibility depends on client-side truncation.** `OpenAIEmbedder`
truncates the returned vector rather than sending a `dimensions` request
parameter, which Ollama's OpenAI-compatible endpoint would reject. Do not
"optimise" that into a server-side dimension request.

## See also

- `context-v/skills/search-lossless-corpus/SKILL.md` — the full querying
  discipline
- [[Sweep-for-Frontmatter-Consistency-&-Improvements]] — why frontmatter quality
  is a retrieval concern
- [[Graphiti-Over-The-Lossless-Corpus]] — the exploration behind the graph

---
title: "Memory Layers for the In-App Chat Package"
lede: "The chat surface in dididecks-ai, memopop-ai, and augment-it will only feel 'within our system' if the agent on the other side has fast, cheap, accurate access to our patterns, prior decisions, project state, and what it already learned about this specific client. This explores how the eight memory systems pinned in studies/memory-layers-for-agents map onto roles in the chat package, what we'd pick for v1 given that we already lean on Chroma, and what to defer."
date_created: 2026-05-18
date_modified: 2026-05-18
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.1
tags:
  - Memory-Layers
  - Agent-Memory
  - Chroma
  - Knowledge-Graph
  - RAG
  - Self-Editing-Memory
  - MemGPT
  - Letta
  - Mem0
  - MemPalace
  - Graphiti
  - Volt
  - Neo
  - Delta-Mem
  - StateBench
  - In-App-Chat
status: Draft
---

# Memory Layers for the In-App Chat Package

> Companion to [[In-App-Chat-as-Agent-Surface-for-Client-Apps]] and the spec [[In-App-Agent-Chat-Core-Package]]. Reads against `ai-labs/studies/memory-layers-for-agents/` (the pinned study + eight per-system profiles in `studies/memory-layers-for-agents/context-v/profiles/`).

## The honest framing

We're new at this. So is most of the field. The eight systems in the study have collectively about three years of production miles, and the conventions are still actively diverging — vector-only vs. graph-augmented vs. self-editing-blocks vs. immutable-log-with-summaries. **There is no settled best practice yet.** What we *can* do is read the option space the study has already mapped, pick the smallest stack that earns its keep for our specific shape of problem, and be ready to change it.

The specific shape of our problem, restated:

- Each instance serves a single org (a client + their Lossless collaborators).
- The agent should "know our system" — skills, conventions, prior decisions across the Lossless tree.
- The agent should also know *this client's* prior usage — their decks, their memos, their brand kits, what we already told them about why we did X a certain way.
- Most chat turns are short. Most are bounded by a registered capability (per the spec). The retrieval problem isn't open-ended QA; it's *"give the model just enough context to call the right capability with the right arguments."*

That last sentence is load-bearing. It rules out half the design space.

## What we already have

A working substrate, not a guess:

- **Chroma** (local, MCP-wired) with four corpus collections — `context-vigilance-corpus`, `lossless-changelog`, `claude-code-sessions`, `claude-code-tool-traces`. Used in our internal Claude Code sessions today.
- **`context-vigilance-kit`** — the ingest scripts that section-chunk every `context-v/` and `changelog/` across the tree, with `source_path`, `source_repo_slug`, `created_at` metadata on every chunk.
- **The spec already plans** a fifth collection `client-app-sessions` parallel to `claude-code-sessions`, plus a `corpus.search` capability with a strict allowlist (no `claude-code-*` leakage to client apps).

So we are not starting from zero on retrieval. We are starting from "what should sit *next to* Chroma to fill the gaps Chroma doesn't fill."

## Mapping the study to roles in the chat package

Reading the eight profiles against the chat package's actual needs:

### Role 1 — "Our system" corpus (skills, patterns, prior decisions)

**Pick: stay with Chroma. Treat MemPalace as the discipline reference, not a dependency.**

The closest entry in the study is [MemPalace](../studies/memory-layers-for-agents/context-v/profiles/Profile__MemPalace.md): ChromaDB-backed, verbatim chunks, no LLM extraction at write time, hybrid recall (semantic + BM25 + closet-boost as signal not gate). Their published numbers (96.6% R@5 on LongMemEval, 92.9% vs Mem0's 30–45% on ConvoMem) point at a real insight — **extraction loses information for our shape of problem**, where the source-of-truth is human-authored prose (specs, explorations, changelogs) and the agent needs to retrieve it as written so it can quote and cite.

We already write everything we'd want to retrieve as markdown with frontmatter. Section-chunking it into Chroma verbatim is what we're doing. MemPalace's contribution to our thinking is the *discipline* — don't be tempted to "improve" the chunks by LLM-summarizing them at ingest time. They are right as they are.

What we add on top of vanilla Chroma:

- **Per-org metadata filter** on every retrieval call. Already in the spec.
- **A "closets" analogue** — soft tags that boost but don't gate. For us this is probably `tags` from frontmatter plus `source_repo_slug`. Worth implementing in the retrieval wrapper.

### Role 1b — Tenancy and isolation (Chroma siloing)

> **Added 2026-05-18 after a shipping conversation.** We currently serve each client by hand. Soon we want a tool other people can sign up for, BYOK, and run themselves. The Chroma layout has to support three modes at once without us paying for the third before it has users.

The three modes:

1. **Lossless-operated, single client.** What we do today. One Chroma, retrieval filters by `org_id` metadata.
2. **Lossless-operated, many clients on one instance.** Where we're going. One Chroma, **proper isolation per client by default**, with an explicit (opt-in, audited) path to cross-reference work across clients we operate.
3. **Self-hosted.** Someone else stands up their own Chroma + own keys + own everything. Designed-for but not optimized-for in v1.

**The siloing primitive: Chroma's native tenant / database / collection hierarchy.** Chroma supports `(tenant, database, collection)` as a three-level scope, with the multi-tenant API stable in current versions. We use it like this:

| Mode | Tenant | Database | Collection |
|---|---|---|---|
| Lossless-operated, per client | `client__{org_slug}` | `default` | `client-app-sessions`, `agent-cache`, `reminders-snapshots` |
| Lossless global corpus (shared, read-only across clients) | `lossless__global` | `default` | `context-vigilance-corpus`, `lossless-changelog` |
| Self-hosted | Their own Chroma instance entirely | their choice | their choice |

What this buys us:

- **Default-safe retrieval.** A `corpus.search` call from the chat surface is scoped at the client layer to `tenant=client__{org_slug}` OR `tenant=lossless__global` (the latter read-only). Cross-client leakage is impossible by *path*, not just by *filter* — no clever-but-wrong `where` clause can spill another client's data, because the request never enters their tenant.
- **A clean export/migration story.** If a client wants to leave and self-host, we dump their tenant (`chroma_fork_collection` or a raw export) and they import it into their own instance. No filter-and-pray over a shared collection.
- **An explicit cross-reference path.** A separate capability `corpus.search_cross_client` (admin-tier, requires confirmation, audit-logged to a Lossless-internal log) is the *only* way to retrieve across client tenants. Available only in Lossless-operated mode; absent from the registry entirely in self-hosted builds.
- **A graceful self-host degradation.** Self-hosted instances point the Chroma client at their own URL. The package's Chroma wrapper takes `{ url, tenant }` as config; the default web build hardcodes the Lossless instance, the Tauri build can override at install time, the self-host build reads from env. One abstraction, three deployment shapes.

What this does *not* require us to build now:

- **A signup/billing/provisioning service** for self-hosters. v1 ships the package; self-hosters who want to run it stand up their own Chroma + auth and wire it themselves. We document the contract; we don't operate it.
- **Cross-tenant analytics.** Tempting but premature. The `corpus.search_cross_client` capability gives us a one-off path when we *need* to learn across clients; productizing that comes later.
- **Per-client custom embedding models.** Everyone shares Chroma's default embedder until a real reason emerges to fork.

The cost of designing this in now vs. retrofitting: trivial vs. enormous. Chroma's multi-tenant API is the same code path; we just have to use it from day one. Retrofitting tenants onto a single-tenant install means rewriting every retrieval call, every ingest script, and every metadata convention — exactly the kind of cleanup we'd avoid by spending one afternoon on tenant routing now.

#### What changes in the existing four-collection convention

Today, `context-vigilance-kit/scripts/ingest-all.sh` writes to four collections in the default tenant. The change: those four collections move to `tenant=lossless__global, database=default`, and the new `client-app-sessions` (plus `agent-cache`, `reminders-snapshots`) live in per-client tenants. The kit gains a `--tenant` flag; the MCP server's connection config takes a default tenant; our own Claude Code sessions use `lossless__global` since we *are* the Lossless org.

This is a one-time migration on the ingest side and a search-and-replace in the retrieval wrapper. The MCP tool calls remain unchanged in shape — `mcp__chroma__chroma_query_documents` already passes tenant/database via the client config, not per-call.

### Role 2 — Entity / relationship memory (decks, slides, brand kits, characters, people)

**Pick: defer in v1. Use Chroma + project libSQL relational tables until the absence hurts.**

The study's strongest entry here is [Graphiti](../studies/memory-layers-for-agents/context-v/profiles/Profile__Graphiti.md) — a real bi-temporal graph with Cypher-flavoured backends, typed entities, single-LLM-call episode-to-graph extraction, hybrid recall. The bi-temporality (`valid_at`/`invalid_at` for real-world time, `created_at`/`expired_at` for system time) is genuinely interesting for our case — "this slide used the old brand kit between 2026-04 and 2026-05" is the kind of fact we'll eventually want.

But: adding Neo4j/FalkorDB/Kuzu/Neptune to each app's deploy footprint, plus an extraction pipeline per turn, plus a graph-traversal recall layer, is a lot of new substrate for a v1 where the chat is mostly invoking single capabilities. The relational structure we need today — *deck X has slides Y, slide Y uses brand kit Z, brand kit Z was authored by person P* — fits in libSQL tables. We can compose them into a "facts" block injected at the top of the chat context.

**When to revisit:** when the chat needs to answer *across-project* relational questions ("which decks of mine use this brand kit?", "which memos cite this source?"), graph traversal will beat N+1 SQL.

### Role 3 — What the agent learned about *this* client over time

> **Important nuance (added 2026-05-18 after lived experience):** there are memories the chat AI wants to create, and memories the user wants to create. **They should be handled differently.** Conflating them produces the worst of both worlds: the AI's hallucinated guesses get treated as rules, and the user's actual rules get drowned out by noise. The split below is load-bearing for the rest of this section.

|  | **User-authored reminders** | **AI-authored cache** |
|---|---|---|
| Trust | 99% truth + ruleset | "slightly better than random" |
| Write path | User (or admin), with optional `memory.suggest_reminder` from agent that requires user accept | Agent freely, no confirmation |
| Read path | **Always loaded** into system prompt | Retrieved by similarity only when relevant |
| Lifetime | Permanent until user edits | TTL or LRU eviction |
| Quotability | Agent may cite as authoritative | Agent must hedge ("I think I noted earlier that…") |
| Maps to | `context-v/reminders/` (existing convention) | A new cache table, not part of context-v |
| Disk layout | Markdown files, version-controlled, per-org | libSQL rows + optional Chroma index, per-org, per-thread or per-project |

This is the [context-vigilance](../studies/memory-layers-for-agents/context-v/profiles/Profile__Letta.md) `reminders/` role applied to the chat surface — reminders are what the user wants the agent to always know — extended with a *separate* cache layer for the agent's own guesses.

**Pick: borrow Letta's "memory blocks" pattern for the reminders side, persist them as markdown in our existing context-v discipline (`reminders/` is already a defined directory role). For the AI cache side, use a libSQL table with optional Chroma index, no Letta dependency anywhere.**

[Letta](../studies/memory-layers-for-agents/context-v/profiles/Profile__Letta.md) is the direct successor to MemGPT. Its headline move — **the agent edits its own memory via `core_memory_append` / `core_memory_replace`** — is more relevant to us than its operational stack (FastAPI + Postgres + pgvector + OpenAI-compat endpoint). But Letta blurs the trust line: the same agent-edited block becomes part of the system prompt on every turn. For our case, that's the exact mistake we're trying not to make. We adopt the *pattern* (markdown blocks rendered into the prompt) and split it into two surfaces along the trust axis.

Specifically the Letta profile notes a **git-backed memory mode** that renders blocks as files and turns every memory edit into a commit. That is uncannily close to what we already do — *the human as committer to a context-v* — and our extension is to keep the human as the committer for the always-loaded blocks (reminders) while letting the agent freely write to a separate, lower-trust cache.

#### Surface A — User-authored reminders (always-loaded, high-trust)

Markdown files under each org's context-v, following the existing `reminders/` directory role. Loaded as a short prefix on every chat turn. The agent **reads** these freely; the agent **cannot write** these directly. It can only propose:

```
memory.suggest_reminder(text, rationale)
  → returns a draft surfaced in the chat UI for the user to accept / edit / discard
```

Files to start with (per org, per app):
- `reminders/client_profile.md` — who they are, what they're trying to do, key people. Seeded at onboarding from the engagement intake form; only the user edits.
- `reminders/our_decisions.md` — "we picked X over Y because Z" decisions made *with* the client. Append-only via accepted suggestions.
- `reminders/gotchas.md` — small absolute rules. ("This client uses 'workshop' where we say 'sprint'." "Never export with the founder's old brand kit; it was retired 2026-04.")

The mental model is exactly the context-vigilance `reminders/` discipline applied at the per-org scope, with the agent in a "suggest, don't commit" role.

#### Surface B — AI-authored cache (retrieved, low-trust, hedged)

A `agent_memory_cache` libSQL table (per-app, per-org-scoped, optional Chroma index when the table grows). The agent writes to it freely via:

```
memory.cache_note(topic, content)
memory.cache_recall(topic_or_query, n=5)
```

What goes here: anything the agent thinks it learned but the user didn't ratify. "Client seemed to prefer the green palette over the blue last time" — useful, but not a rule. The agent retrieves from this cache by similarity, never by always-load, and the system prompt instructs it to **hedge any claim sourced from this cache** ("I think I noted earlier that…") and to **prefer reminders when the two conflict**.

The cache has a TTL (default 30 days) and an LRU cap (default 200 entries per org). Both are tunable per-org by admin.

**Why not put both in the same store and just tag them?** Because the always-loaded vs retrieved split has to happen *upstream* of retrieval — at prompt assembly time. Mixing the two and trying to separate them with a metadata filter on every recall is the bug factory. Two surfaces, two storage shapes, two capabilities — the cost is small and the clarity is worth it.

Two reasons not to take Letta as a dependency: (1) we'd inherit a Postgres + FastAPI stack we don't otherwise want, and (2) Letta does not enforce the user/AI memory trust split that we just argued is essential — we'd be paying for a runtime while still building the discipline ourselves.

### Role 4 — Long conversation compaction within a single thread

**Pick: borrow Volt's deterministic threshold pattern. Start with naive truncation, upgrade only if a thread gets long enough to need it.**

[Volt](../studies/memory-layers-for-agents/context-v/profiles/Profile__Volt.md) is a coding agent built around **Lossless Context Management** (the term collision with our org name is incidental — both phrases predate each other in different contexts). The interesting bet is **deterministic** soft/hard token thresholds driving a control loop, with two compaction modes (Dolt: evict oldest; Upward: recursive bottom-up condensation). Write/summarize policy is *not* LLM-decided; the LLM is invoked only when the threshold trips.

For us, most chat turns are short and won't hit a threshold. When they do, the Volt pattern — *threshold-triggered, deterministic eviction, optional summary node* — is the right shape and avoids the "LLM summarizes every turn" cost trap. v1 can be just "truncate to last N turns + always-prefix the memory blocks." Volt's design becomes the reference when we observe a real session blowing past the limit.

### Role 5 — Benchmarking whether any of this works

**Pick: pin StateBench but defer running it until the v1 stack is deployed.**

[StateBench](../studies/memory-layers-for-agents/context-v/profiles/Profile__StateBench.md) is a conformance benchmark, not an implementation. The value isn't in v1 — we don't have something to measure yet — but having it pinned means once the chat is shipping we can evaluate *our* memory stack against the same harness Mem0 and Neo report against. This is the difference between "the chat feels good" and "the chat retrieves the right thing 92% of the time on a held-out task set."

Add to the spec's "deferred questions" list: *"After v1 deploys to one paying client, run StateBench against the deployed stack and publish numbers."*

### Roles we are deliberately not filling in v1

- **In-model memory ([Delta-Mem](../studies/memory-layers-for-agents/context-v/profiles/Profile__Delta-Mem.md)).** Architecturally fascinating — a frozen-backbone adapter with a learned delta rule giving each attention head a state matrix. But it's a research artifact (Qwen3-4B adapter on HF), not a deployable library, and it requires running our own inference. We're consuming hosted Anthropic/OpenAI; the inference substrate is not ours to modify.
- **Composable hybrid memory layer ([Mem0](../studies/memory-layers-for-agents/context-v/profiles/Profile__Mem0.md)).** The most-starred entry in the field and the most explicit about being a *layer*. Worth re-reading when we want to refactor. Not v1 because adopting it means accepting their multi-store topology (vector + graph + KV) and write/update API as our memory contract, which would constrain a lot of future choices. MemPalace's 92.9% vs Mem0's 30–45% on ConvoMem is also a real shadow over the "Mem0 just works" story.
- **Typed/scoped facts with deterministic supersession ([Neo](../studies/memory-layers-for-agents/context-v/profiles/Profile__Neo.md)).** Smaller surface, cleanly readable, and the supersession discipline is genuinely appealing for the `our_decisions.md` block above. Worth reading end-to-end when we design that block's update policy.

## The recommended v1 stack

In ascending order of "we have it" → "we're adding it":

| Layer | What it stores | Where it lives | Status |
|---|---|---|---|
| Corpus retrieval | Verbatim chunks of our context-v + changelogs + (per-org) chat transcripts | Chroma (existing + new `client-app-sessions` per spec) | **Have** — extend with per-org `where` filters + tag-as-boost |
| Project facts | Decks, slides, memos, brand kits, characters, people, their relationships | Per-app libSQL (Turso web / local Tauri per spec) | **Have** — just need a `facts.list_for_project()` capability that formats them into a context prefix |
| Per-org **user reminders** (high-trust, always-loaded) | `reminders/client_profile.md`, `reminders/our_decisions.md`, `reminders/gotchas.md` | Markdown under per-org context-v, version-controlled | **New** — author convention, add `memory.suggest_reminder` (agent proposes, user commits) |
| Per-org **AI cache** (low-trust, retrieved) | Agent's own observations between turns | `agent_memory_cache` libSQL table, per-app, optional Chroma index | **New** — add `memory.cache_note` / `memory.cache_recall`, TTL + LRU policy |
| Per-turn working memory | Active thread messages | Transcript table (per spec) | **Have** — naive truncation v1, threshold pattern from Volt when it bites |

Total new substrate beyond what the spec already commits to: **one set of three markdown files per org, plus two capabilities.** Everything else is already in flight.

## What "preload the instance with our context" means concretely

Restating the user's framing in implementation terms. When a new client instance spins up, the bootstrap script does:

1. **Seed `client-app-sessions` Chroma collection** with the relevant prior context for this client — any deck/memo/note we already have for them, the relevant slice of `context-vigilance-corpus` and `lossless-changelog` they should be able to retrieve from, all tagged with their org_id.
2. **Write initial memory blocks** — `client_profile.md` is seeded from the engagement intake form; `our_decisions.md` starts empty with a heading; `gotchas.md` starts empty.
3. **Register the capability set** per the spec.
4. **Pin the system prompt hash** so all future answers from this instance are reproducible from a known prompt + a known corpus.

That bootstrap is the "tooling that preloads our context/agent instruction set" the user is asking about. It's a script, not a service.

## What we're explicitly betting on

1. **Verbatim retrieval beats extracted-fact retrieval** for our shape of source-of-truth (human-authored prose in context-v). MemPalace's benchmarks back this for similar shapes.
2. **User-authored reminders (always-loaded) and AI-authored cache (retrieved) are two surfaces, not one.** The trust line between "the user said so" and "the agent guessed" is the most important boundary in the whole memory stack. Letta blurs this; we don't.
3. **Graph storage can wait** until the relational questions we want to answer span projects, not just within one. Premature graph adoption is a real failure mode in this space.
4. **Deterministic compaction beats LLM-driven summarization** when a thread gets long. Volt's bet, lower cost, more reproducible.

We could be wrong on any of these. The point of writing them down is so that if we're wrong, we know where to look first.

## What faster / cheaper / more accurate actually requires

The user's framing — *"some tooling that will make the agent chat have quicker/faster/reduced token/more accurate access to context"* — decomposes into four concrete levers, each with a known technique:

| Lever | Technique | In our v1? |
|---|---|---|
| **Fewer tokens in the system prompt** | Retrieved corpus instead of stuffed corpus; tiny always-loaded memory blocks instead of full skill bodies | Yes |
| **Faster retrieval** | Pre-warmed Chroma, per-org metadata index, cap `n_results` at 5 (matches our CLAUDE.md cap), HNSW (Chroma default) | Yes |
| **More accurate retrieval** | Verbatim chunks + hybrid scoring (BM25 + cosine) + tag-as-boost; reranker only if quality demands it | Partially — start with cosine, add hybrid if needed |
| **Cheaper cold-start** | Prompt caching on Anthropic for the static spine + skill summaries; per-org memory blocks change rarely, so cache them too | Yes — fold into the spec under `claude-api` skill's caching guidance |

Of these, **prompt caching** is the one we get nearly for free and should be designed in from day one. The static system spine + the per-org memory blocks + the capability schemas are all cache-eligible — caching them across turns within a session can drop the per-turn cost by 80%+ on supported providers.

This should be added to the spec's "Migrations to write before v1" / system-prompt-content open question. (Suggested follow-up edit.)

## Next artifacts

If this lands, the follow-ups are small:

- A short blueprint at `<each-app>/context-v/blueprints/Per-Org-Memory-Block-Convention.md` defining where the three markdown files live per org, the supersession discipline for `our_decisions.md`, and the JSON-Schema for `memory.append` / `memory.replace`.
- An edit to the [[In-App-Agent-Chat-Core-Package]] spec adding (a) the two `memory.*` capabilities, (b) the prompt-caching design, (c) the StateBench-after-v1-deploy commitment.
- A pinned read of the Letta git-backed-memory implementation to confirm the file layout pattern before we commit to ours.

The big question this leaves open — *do we need a knowledge graph?* — is genuinely better deferred. The day a chat user asks "which of my decks use this brand kit" and we can't answer in one query is the day we re-read the [Graphiti profile](../studies/memory-layers-for-agents/context-v/profiles/Profile__Graphiti.md) with intent.

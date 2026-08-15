---
title: "Frontloaded Source-Approval Loop — enforce the set, then build the surface that fills it"
lede: "Burns down Constraining-Memo-Writing-to-an-Approved-Source-Set in dependency order: the membership predicate ships before the approval UI, because a UI whose output nothing enforces has an invisible failure mode. Splits the pipeline into a gather-candidates job and a write-constrained job, and inserts an `approving_sources` stage into memopop-native's FlowStage machine between create_deal and ready_to_run — so no run ever starts unconstrained. Each iteration lands one ticket with a named verification command, a changelog beat, and its own commit."
date_created: 2026-08-06
date_modified: 2026-08-06
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.1.0
proven_on:
tags:
  - Loop
  - MemoPop
  - Source-Curation
  - Allowlist-Enforcement
  - SearXNG
  - Memopop-Native
  - Feature-Execution
  - Browser-Drive
status: Authored-Not-Yet-Run
from: "memopop-ai"
from_path: "context-v/loops/Frontloaded-Source-Approval-Loop.md"
---
# Frontloaded Source-Approval Loop

> `context-v/loops/` is **experimental** (per the context-vigilance skill). This is memopop-ai's first loop; the cadence is borrowed from [[../../../augment-it/context-v/loops/Implement-Feature-Loop]] (ticket-per-iteration, bookend commits, human gate before ship) and specialized to one plan.

## What this loop burns down

[[../plans/Constraining-Memo-Writing-to-an-Approved-Source-Set]] — the full contract. This loop is its execution order.

The plan describes four phases. This loop **reorders them by dependency, not by phase number**, because two of them are load-bearing for the others:

- Phase 3's schema change (`SourceEntry` gains `title`) is a hard prerequisite for Phase 4's re-search — `attempt_url_recovery()` returns `None` without a title. It ships first, not third.
- Phase 1's membership predicate ships before any UI. A curation surface whose output nothing enforces produces **no observable failure** when it's wrong — you cannot test it. Enforcement first makes the UI's correctness measurable.

## The architectural move this loop adds to the plan

The plan assumed curation stays where `source_aggregator` already halts — mid-pipeline, reviewing whatever the research band produced. This loop **frontloads it** to the point the analyst defines the memo, per operator intent (2026-08-06):

> "What happens now is Perplexity just invents sources, and going through them takes forever."

Two failures in one sentence — the candidates are **fabricated**, and there are **too many** of them. Both are consequences of an LLM sitting in the candidate path.

**The governing constraint: no LLM in the candidate path.** A URL returned by SearXNG came out of a search index, so it cannot be hallucinated — the property is structural, not probabilistic. Candidates come from deck-derived terms fired at SearXNG (capped per term), plus the analyst's own searches and pastes. Perplexity is not consulted to *propose* a source anywhere in this flow.

That removes the need for a two-job split. If candidates don't come from the pipeline, curation is standalone and the run is never interrupted:

```
deck_analyst (light — terms only, no URLs)
      → SearXNG candidates + analyst search/paste
      → approve  →  inputs/Sources.md (mode: codified)
      → ONE constrained run: draft → …enrichers… → cleanup_sections [membership] → assemble → …
```

`source_aggregator.py:204`'s existing `🛑 HALTING PIPELINE` halt stays for the **legacy broad-search path** — it is not the frontloaded flow's mechanism, and this loop does not remove it.

**Volume is a first-class requirement, not a polish item.** If approving a deal's sources isn't tolerable in one sitting, the surface has failed regardless of correctness. Cap results per term, dedupe against the firm's standing corpus, and default to a short list the analyst extends — never a long one they must prune.

In `memopop-native`, this is one new `FlowStage` (`src/lib/stores/flow.svelte.ts:58`):

```
idle → outline_detail → create_firm → create_deal
     → approving_sources        ← NEW: the click-through to "approved sources"
     → ready_to_run → running_job
```

## What we take from augment-it — and what we deliberately don't

`../augment-it/apps/search-and-add/` is a **Svelte 5 module-federation remote** bound to `@augment-it/workspace`'s `invoke()` bus, NATS, and a SurrealDB resolver. memopop-native is a Tauri SvelteKit app talking to a FastAPI sidecar over HTTP. **Do not port it.** Take exactly three things:

| Take | From | Why |
|---|---|---|
| The SearXNG container + `settings.yml` | `augment-it/docker-compose.yml`, `services/social-search/searxng/settings.yml` | The genuinely reusable artifact. Upstream ships with the JSON API **off** and the limiter **on**; that settings file is the working config. Free, no API key. |
| `ConnectorResult` shape, verbatim | `services/social-search/src/connectors/types.ts` | `{url, title, content, score?, published_date?, known?}`. Already copied verbatim once (into `search-and-add/src/lib/types.ts`) — copy it again rather than forking a third shape. |
| Component *shape* only | `TermBar` / `ResultsList` / `ResultRow` / `ProviderPalette` | Rebuild in memopop-native's idiom. Read them for layout and interaction; import nothing. |

`SEARXNG_URL` is already the contract in [[../plans/Sources-Curation-UI-Tool]] with graceful degradation when unset — honor it, don't invent a new env var.

## Parameters

- `<feature-name>` — `source-approval`
- `<plan-doc>` — [[../plans/Constraining-Memo-Writing-to-an-Approved-Source-Set]]
- `<changelog-file>` — minted in Iteration 0 per `changelog-conventions`. **Two of them**: orchestrator work logs in `apps/memopop-orchestrator/changelog/`, client work in `changelog/` here (per this repo's `CLAUDE.md` §"Changelog scope").

## Skills to load at loop start

1. `context-vigilance` — frontmatter, status discipline, artifact placement
2. `pseudomonorepos` — **which repo each commit lands in**; never bump the parent gitlink as a side effect
3. `git-conventions` — header syntax, pre-commit checklist
4. `changelog-conventions` — the two changelog stubs
5. `astro-knots` — Svelte 5 runes discipline for the native half (no React, no unnecessary deps)

## Preconditions — verify before Iteration 1

| Check | Command | If it fails |
|---|---|---|
| SearXNG reachable | `curl -s 'http://localhost:8080/search?q=test&format=json' \| head -c 200` | Start augment-it's stack, or bring up the local compose from Iteration 1 |
| Sidecar boots | `.venv/bin/python -m src.server` → `curl localhost:8765/healthz` | Fix before touching endpoints |
| Native builds clean | `bun run typecheck && bun run lint` | Fix before touching Svelte |
| A codified deal exists to test against | a deal dir with `inputs/Sources.md`, `mode: codified` | Use a firm-private deal; **never mint test entities in canonical data** |

**Playwright MCP is not wired in this repo** (no `.mcp.json`). Add it in Iteration 0 — but per the root `CLAUDE.md`, **MCP servers load in the *next* session**. Iterations in the session that adds it verify via typecheck/lint/build + `curl` against the dev server; the browser drive runs from the following session onward. Do not claim a browser drive that didn't happen.

## The ladder

One ticket per iteration, in this order. **The order is the point** — each rung is verifiable because the ones below it exist.

### Orchestrator band (lands in `apps/memopop-orchestrator/`)

1. **Schema.** `SourceEntry` gains `title`, `publisher`, `published_date`, `verdict`. Promote `verdict` from a YAML comment to a real field. Import `canonical_url()` from `src/curation/best_sources.py` — do not re-implement normalization.
   *Verify:* round-trip a real `Sources.md` through `load_sources_md()` → all four fields survive; `tools/curate_sources.py` drops its regex verdict-recovery pass and still renders.

2. **`approved_urls()`** in `src/curation/sources_md.py` — canonicalized set. Pure function.
   *Verify:* unit test — trailing slash, `www.`, `utm_*`, and http/https variants all collapse to one entry.

3. **The membership predicate.** Fourth verdict `unapproved` in `remove_invalid_sources`, gated on `is_codified()`. **Soft-flag mode first** (annotate + worksheet, don't delete) per plan Decision 1.
   *Verify:* plant an unapproved URL in a section file → it's flagged, the worksheet names it with its section and claim, approved citations untouched. Non-codified run produces byte-identical output to pre-change (diff it).

4. **Close the emitters.** Gate `citation_enrichment`, `fact_corrector`, `fact_verifier` on `is_codified()`. Leave `enrich_socials`/`enrich_links`/`enrich_trademark` alone — they emit assets, not evidence.
   *Verify:* codified run emits zero new URLs from the three gated agents; LinkedIn links still appear.

5. **Candidate seeding, LLM-free.** `src/curation/candidates.py` — a SearXNG client (`SEARXNG_URL`, graceful no-op when unset) plus term derivation from an existing deck analysis (company, market category, named competitors). Cap results per term; dedupe via `canonical_url()`; mark `known` for URLs already in the firm's standing corpus.
   *Verify:* unit test with a recorded SearXNG payload → normalized `ConnectorResult`s, capped and deduped. Live test against `localhost:8080` returns real URLs. **Assert no Anthropic/Perplexity client is constructed anywhere in this module's import graph.**

6. **Sidecar endpoints.** Move `tools/curate_sources.py`'s four endpoints into `src/server/app.py`; add `POST /api/sources/recover` (wrapping `attempt_url_recovery()`) and the approve-set-and-continue action. Inherit the existing CORS allowlist for Tauri origins.
   *Verify:* `curl` each endpoint against a real deal. `/recover` returns ranked candidates with Jaccard scores for a deliberately broken URL.

### Native band (lands in `apps/memopop-native/`)

7. **FlowStage + route.** `approving_sources` between `create_deal` and `ready_to_run`; route under `src/routes/deals/[firm]/[deal]/`.
   *Verify:* typecheck + lint; the stage transition is reachable and reversible (back to `create_deal`).

8. **The list.** Sources with verdict badges; **Open** (system browser via `tauri-plugin-opener`, already a dep), **Preview** (Jina, `/api/fetch`), **Approve**, **Deny** + reason.
   *Verify:* a real aggregated file renders every source; approve/deny round-trips to disk and survives reload.

9. **Re-search + add + stream.** Re-search wired to `/api/sources/recover`; add-by-paste with Jina title prefill; register-as-stream per [[../plans/Streams-and-a-Stream-Index-for-the-Curation-UI]] (a blog index is not a citable source).
   *Verify:* recover a drifted URL and accept a candidate; paste a URL and see the title populate; register an index URL and confirm it lands in `stream-index.md`, **not** the approved set.

10. **Approve set & continue.** Writes `inputs/Sources.md` with `mode: codified` (backed up), launches job 2.
    *Verify:* end-to-end — the resumed run's citations are a **subset** of the approved set.

## Per-iteration rungs

Every iteration, in order. No skipping, no batching across tickets:

1. **Code** the one ticket.
2. **Verify** with the named command above. A rung with no command is not done.
3. **Changelog beat** into the correct repo's stub.
4. **Commit** per `git-conventions`, scoped to that ticket, in the repo it belongs to.

## Bookends

- `init(feature, source-approval)` opens the run.
- `ship(feature, source-approval)` closes it — **only after the human gate.**

## The human gate

Between "ladder complete" and `ship()`: the operator walks one real deal end to end — define memo → gather → approve → run → read the memo. A browser drive proves the buttons work; only the walkthrough judges whether curating 57 sources is *tolerable*. A fix-ticket spawned here is the gate earning its keep, not a deviation.

## Stop conditions

Halt the loop and return to the operator if:

- **Coverage collapses.** Enforcement is a ceiling; `Citation-Coverage-Promoter` measured 7-of-33 cited *before* any ceiling existed. If an enforced run cites fewer than ~1/3 of approved sources, stop — the counterweight plan needs to ship first.
- **The non-codified diff is non-empty** (Iteration 3). A regression on the default path is a hard stop.
- **An LLM re-enters the candidate path.** If any proposed source reaches the approval list from a model rather than a search index, stop. That is the defect this loop exists to remove.
- **The list is too long to work.** If a typical deal's candidate list can't be approved in one sitting, stop and tighten the caps before building further. "Going through them takes forever" is the originating complaint; re-creating it with better-sourced URLs is still failure.

## Cross-references

- [[../plans/Constraining-Memo-Writing-to-an-Approved-Source-Set]] — the contract
- [[../plans/Sources-Curation-UI-Tool]] — the built tool being graduated; `SEARXNG_URL` contract
- [[../plans/Streams-and-a-Stream-Index-for-the-Curation-UI]] — streams ≠ sources
- [[../explorations/Curating-only-valid-Sources-across-Runs]] — why reachability isn't enough
- [[../explorations/Moving-an-Agent-Orchestrator-to-an-API]] — the transport seam this respects
- `apps/memopop-orchestrator/context-v/plans/Citation-Coverage-Promoter.md` — the coverage floor; the stop condition above
- `../augment-it/context-v/loops/Implement-Feature-Loop.md` — the cadence this specializes
- `../augment-it/context-v/issues/Search-Providers-as-First-Class-SearXNG-Default.md` — why SearXNG is the default provider

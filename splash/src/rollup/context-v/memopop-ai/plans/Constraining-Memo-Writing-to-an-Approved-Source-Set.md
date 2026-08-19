---
title: "Constraining Memo Writing to an Approved Source Set"
lede: >-
  Every gate in the pipeline tests whether a URL resolves; none tests whether it was approved. Adds the missing membership predicate.
date_authored_initial_draft: 2026-08-06
date_authored_current_draft: 2026-08-06
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-08-06
at_semantic_version: 0.0.0.1
status: Draft
publish: false
category: Plan
augmented_with: Claude Code on Claude Opus 5 (1M context)
authors:
  - Michael Staton
tags:
  - Plan
  - Source-Curation
  - Citation-Discipline
  - Codified-Sources
  - Anti-Hallucination
  - Allowlist-Enforcement
  - Memopop-Native
  - MemoPop-Orchestrator
related_skills:
  - sources-md-curation
  - source-with-extracts-md
  - context-vigilance
site_uuid: e163f332-9db2-4d93-b706-bd867928c9b9
hex_code: 5rqxi5
from: "memopop-ai"
from_path: "context-v/plans/Constraining-Memo-Writing-to-an-Approved-Source-Set.md"
---
# Constraining Memo Writing to an Approved Source Set

> The enforcement half of the curation story. [[Sources-Curation-UI-Tool]] built the tool that *produces* an approved set; nothing in the pipeline *enforces* it. This plan supplies the missing predicate and graduates the tool into [[In-App-Chat-Surface-for-Memopop-Native]]'s host app. Direct descendant of [[Curating-only-valid-Sources-across-Runs]] (which proved curation alone can't win) and [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] (the full architectural fix this is the cheap down-payment on).

## The finding

Traced against a graphify knowledge graph of the orchestrator (3,773 nodes / 6,511 edges, 2026-08-06), then verified in source.

**Only four files in the orchestrator import the curation module:**

```
src/agents/codified_section_researcher.py   ← the researcher short-circuit
src/agents/source_aggregator.py             ← the curation HALT
src/server/app.py:195                       ← curate_best_sources
tools/curate_sources.py                     ← the standalone UI
```

The writer, every enricher, both cleanup gates, the citation validator, the fact-corrector, and the source cataloger have **no reference to `Sources.md` at all**. The approved set is a file one agent reads — not a constraint the pipeline enforces.

### Why the gates can't win

`remove_invalid_sources.validate_url()` (`src/agents/remove_invalid_sources.py:190`) runs three checks: a hallucination-pattern regex preflight, an HTTPS GET with a 32KB body sniff, and a soft-404/paywall phrase match. It is the agent behind **both** gates — `cleanup_research` (GATE 1) and `cleanup_sections` (GATE 2).

All three checks test **reachability**. None tests **membership**.

That asymmetry is the whole conflict. A producer agent can emit any URL; the gate can only reject the ones that happen to be *dead*. A live-but-wrong URL — a real McKinsey report that says nothing about this company, a real TechCrunch article about a different Sava — passes every gate cleanly. Inventing a *live* URL is easy, so the producers win by default. This isn't a tuning problem in the validator; the validator has been handed the wrong predicate.

[[Curating-only-valid-Sources-across-Runs]] reached the same conclusion from the other direction on 2026-06-08 (65 fabricated `example.com` URLs in a run where `mode: codified` was set, operator verdict: *"Perplexity completely hallucinates sources — cannot be trusted at all"*). Its prescription was the harvester/writer split. That split is right and still unbuilt. **Membership enforcement is the two-day version of the same idea**: instead of rebuilding retrieval so bad URLs can't be produced, make the gate reject anything not on the list.

### Where it leaks, in workflow order

Per `src/workflow.py:524-548`:

```
section_research ──┬─ codified short-circuit (reads Sources.md)  ✅ constrained
                   └─ broad Perplexity search
  → competitive_researcher → competitive_evaluator
  → cite  (citation_enrichment)          ← LEAK 1: its documented job is to ADD sources
  → cleanup_research   [GATE 1]          ← reachability only
  → aggregate_sources  (HALTs for analyst — but passes through silently in codified mode)
  → draft (writer)
  → inject_deck_images → enrich_trademark → enrich_socials → enrich_links
  → generate_tables → generate_diagrams → enrich_visualizations
  → revise_summaries                     ← LEAK 2: eight LLM/search-backed agents
  → cleanup_sections   [GATE 2]          ← reachability only
  → assemble_citations → … → fact_correct ← LEAK 3
```

`citation_enrichment.py:1-16` states its contract plainly: *"Ask Perplexity to add NEW citations starting from N+1… It only ADDS."* It runs **after** the codified researcher finished obeying the approved set, and nothing tells it the set exists.

## Prior art — what's already decided, built, or ruled out

Read these before implementing; several decisions below are already made elsewhere and this plan defers to them.

| Doc | What it already establishes | This plan's relation |
|---|---|---|
| [[Curating-only-valid-Sources-across-Runs]] | The 65-`example.com` incident; HTTP 200 means nothing; curation can't fix upstream invention; Pass A/B verdict ladder | Supplies the predicate its Pass B lacks |
| [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] | The Source Harvester / Section Writer split — writer never holds a search tool | This is the cheap down-payment; does **not** replace it |
| `Citation-Coverage-Promoter` (orchestrator) | **Decision Point #2 already proposes gating `citation_enrichment` on `is_codified()`** — unresolved. Also names fact-corrector/fact-verifier as the same fix. Phase 1 = the coverage floor | Phase 2 here **resolves** that decision point; coverage promoter is the matched pair |
| `Trustworthy-Citations-Source-Harvester-Rollout` (orchestrator) | Parent plan; the `citation_validator.py:302` self-disabling bug; Phase-2 harvester design | Sibling under the same parent effort |
| [[Sources-Curation-UI-Tool]] | The built tool: nav/edit/delete/reorder/Jina preview/SearXNG search/add/save. Names "graduation into memopop-native" as the refactor path | Phase 4 **is** that graduation |
| [[Streams-and-a-Stream-Index-for-the-Curation-UI]] | Streams ≠ citable sources; a blog index must be registered, not cited | UI must not let a stream become an approved source |
| [[Human-Curated-Source-Sets-and-Per-Firm-RAG-for-Memo-Narrative]] | The per-firm standing corpus the approved set eventually feeds | Downstream consumer |
| `issue-resolution/Faked-Sources-from-Perplexity` (orchestrator) | The original incident report | Root symptom |
| `blueprints/Anti-Hallucination-Source-Validation-and-Removal` (orchestrator) | The subtractive validator pattern + hallucination regexes | Extended, not replaced |
| `AGENTS.md` §10 (orchestrator) | `preferred_sources` — outline-level domain include/exclude | Precedent for a "where to look" registry; different scope (per-section, not per-deal) |

**Two things already exist that this plan just connects:**

1. `source_aggregator.py:204` already prints `🛑 HALTING PIPELINE for analyst curation.` — **the halt is built and headless.** It stops the run and tells the analyst to go edit a file in a terminal. Phase 4 gives that halt a UI.
2. `src/validation/url_recovery.py:attempt_url_recovery()` already does title-fuzzy-matched URL recovery via Tavily (`_title_jaccard`, `_derive_publisher_domain`, `gated_publishers.yaml` allow-list). **This is the "re-search for the real source" action, already written.** Phase 4 gives it a button.

## Phase 1 — The membership predicate (orchestrator)

The smallest change with the largest effect. In codified mode, a citation URL is valid iff it **resolves *and* is in the approved set.**

**Files:** `src/agents/remove_invalid_sources.py`, `src/curation/sources_md.py`

1. Add `approved_urls(sources_md) -> set[str]` to `src/curation/sources_md.py`, returning canonicalized URLs. Reuse the normalization already specified in [[Curating-only-valid-Sources-across-Runs]] Pass A (lowercase scheme/host, drop `www.`, strip trailing slash, drop `utm_*`/`ref`/`fbclid`/`gclid`, treat http/https as equal) and already implemented as `canonical_url()` in `src/curation/best_sources.py` — **import it, do not re-implement.**
2. In `remove_invalid_sources_agent`, load `Sources.md` once. If `is_codified()` is false, behave exactly as today (no regression on the broad-search path).
3. If codified, add a fourth verdict to the existing ladder: **`unapproved`** — the URL is not in the approved set. Treated as invalid; the citation is removed by the same machinery that removes 404s.
4. Both gates inherit it automatically — they are the same agent.
5. Every `unapproved` drop lands in the existing analyst worksheet (`remove_invalid_sources.py:603` already writes one) with the URL, the section, and the claim it was attached to. **The drop must be visible, not silent** — an unapproved citation usually means the writer had a claim it couldn't source from the approved set, which is signal the analyst needs.

Ship Phase 1 alone and measure. On a codified run it should reduce fabricated citations to zero by construction.

## Phase 2 — Close the emitters

Membership enforcement at the gate is subtractive: it deletes bad citations after they're written, leaving `<needs-source>`-shaped holes. Better to not emit them.

1. **`citation_enrichment` (`cite`)** — gate on `is_codified()`, mirroring the short-circuit `perplexity_section_researcher.py:519` already uses. In codified mode it no-ops. This **resolves Decision Point #2 of `Citation-Coverage-Promoter`**, which proposed exactly this and left it open. Its replacement in codified mode is the Coverage Promoter (redistribute within the fixed set) — the two are complements, and that plan already says so.
2. **`fact_corrector` / `fact_verifier`** — same gate. `Citation-Coverage-Promoter` §"What this plan does NOT solve" already flags these as unaddressed. In codified mode, a correction may not introduce a URL outside the set; if the only fix requires an unapproved source, emit `<needs-source>` per `AGENTS.md` §5 rather than inventing one.
3. **`enrich_socials` / `enrich_links` / `enrich_trademark`** — **exempt.** These emit LinkedIn profiles, org homepages, and logos. Those are not claims-with-evidence and must not be subject to the membership rule (see Phase 3 schema note).

## Phase 3 — Make the set structural, not incidental

Reading `Sources.md` from disk in each agent means every *new* agent silently opts out by default. Put it in state and the default flips: an agent has to actively ignore it.

1. Add `approved_sources: Optional[List[SourceEntry]]` and `sources_mode: str` to `MemoState` (`src/state.py`), populated once at workflow start.
2. **Split the URL namespace.** Introduce `kind` on citation-bearing URLs: `evidence` (subject to membership) vs `asset` (profile/logo/homepage — exempt). Without this split, Phase 1 will start deleting legitimate LinkedIn links and someone will add a third exception path to work around it.
3. **Extend `SourceEntry`.** It currently carries only `url, sections, rank, sensitivity, note` (`src/curation/sources_md.py:45`). It **drops `title`, `publisher`, `published_date`** — which is why `tools/curate_sources.py` parses raw frontmatter instead of using the loader (documented in [[Sources-Curation-UI-Tool]] §"Data handling"). Add `title`, `publisher`, `published_date`, and `verdict` as first-class fields. **This is a hard prerequisite for Phase 4's re-search:** `attempt_url_recovery()` requires `metadata.title` and returns `None` without it.
4. Promote `verdict` from a YAML **comment** to a real field. Verdicts currently survive only as `# verdict:` comments that `yaml.safe_load` discards, forcing a regex recovery pass. Approve/deny is the UI's primary output — it cannot live in a lossy channel.

## Phase 4 — The curation surface in `memopop-native`

Graduates `tools/curate_sources.py` from a standalone localhost tool into the desktop app, and gives `source_aggregator`'s existing headless halt a face.

### The loop

The aggregator already stops the pipeline and writes `Sources-aggregated.md`. Today the analyst is told to go edit YAML in a terminal. Instead:

```
run halts at aggregate_sources
  → native surfaces "N sources awaiting review" on the deal
  → analyst works the list
  → "Approve set & continue" writes inputs/Sources.md with mode: codified
  → run resumes (execute_from_checkpoint / submit_resume already exist)
```

### Per-source actions

| Action | Behavior |
|---|---|
| **Open** | Open the URL in the system browser (`tauri-plugin-opener`, already a dependency). One click, no preview needed. |
| **Preview** | Inline Jina-fetched markdown — reuse `POST /api/fetch`. For triage without leaving the app. |
| **Approve** | `verdict: approved` → enters the approved set. |
| **Deny** | `verdict: rejected` + reason (dead / paywalled / wrong-entity / low-quality / off-topic). Reason is training data for future verdict tuning — capture it. |
| **Re-search** | The third option, not a variant of deny. Calls `attempt_url_recovery()` with the entry's `title`/`publisher`; returns ranked candidates with Jaccard scores; analyst picks one, which **replaces** the URL and marks it `approved`. This is the "find the actual source of the article" case — a real article whose URL drifted. |
| **Register as stream** | Per [[Streams-and-a-Stream-Index-for-the-Curation-UI]] — a blog/insights index is not a citable source. Moves it to `stream-index.md`, out of the approved set. |

### Add a link

A single paste field. On paste: Jina-fetch for `title`/`publisher`, prefill, let the analyst set `sections` + `rank`, approve. Must be one field and one button — this is the action the analyst reaches for most, and it competes directly with letting an agent guess.

### Wiring

Follow the existing seam, per [[Moving-an-Agent-Orchestrator-to-an-API]] and `Wire-Memopop-Native-To-The-FastAPI-Sidecar` (orchestrator): the webview calls the FastAPI sidecar over HTTP; the Rust dispatcher isn't involved. The four endpoints already exist in `tools/curate_sources.py` (`/api/sources`, `/api/save`, `/api/search`, `/api/fetch`) — **move them into `src/server/app.py` rather than reimplementing**, add `POST /api/sources/recover` for the re-search action, and retire the standalone tool once parity is reached. Route: `src/routes/deals/[firm]/…`, alongside the existing deal workspace.

**Long-run tension worth naming now:** [[Sources-Curation-UI-Tool]] proposes graduation as `source.*` **chat verbs** in [[In-App-Chat-Surface-for-Memopop-Native]]; this plan proposes a **dedicated review surface**. They aren't exclusive — approve/deny/re-search over 57 sources is a list-shaped task that a chat transcript would make worse, while "add this link and tag it for the market section" is naturally a verb. Build the list surface; expose the same operations as verbs later. Don't build the verbs first.

## What this does NOT solve

- **Right URL, wrong claim.** An approved source can be cited for something it doesn't say. That's the fact-checker's job, and it's a different predicate again.
- **Source quality.** Membership trusts the analyst's judgment entirely. An approved SEO blog is still an approved source.
- **The broad-search path.** Everything here is gated on `is_codified()`. Non-codified runs behave exactly as today — deliberately, to avoid regression, but it means the default path stays unconstrained until codified mode is the default.
- **The architectural fix.** [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] remains the real answer. This makes invention *ineffective*; that makes it *impossible*.

## The coverage counterweight — do not ship Phase 1 alone and walk away

Clamping the ceiling reopens a known failure in the opposite direction. `Citation-Coverage-Promoter` measured it on ChromaDB v0.0.10: **33 curated URLs, 7 actually cited, 26 ignored.** The model doesn't spread across an approved set — it huddles on a handful.

Enforcement sets the ceiling; the Coverage Promoter sets the floor. They are one mechanism. Ship the ceiling first — an under-cited memo is fixable and a fabricated one isn't — but expect coverage to get *worse* before the promoter lands, and instrument for it (that plan's Phase 4 §Step 10 already defines the metric).

## Decision points

1. **Does `unapproved` hard-drop or soft-flag on the first run?** Recommendation: **soft-flag for one run** (annotate + worksheet, don't delete), so the first codified run shows the true size of the leak before it starts deleting prose citations. Hard-drop from run two.
2. **Where does the approved set live for multi-version deals?** `inputs/Sources.md` is per-deal, but versions accumulate. Recommendation: per-deal, with `curate_best_sources` (already built, `src/curation/best_sources.py`) as the cross-version merge feeding the next deal's starting list.
3. **Global vs per-deal deny memory.** A denial of a known-dead Gartner doc ID is reusable. Recommendation: **global overrides file**, matching [[Curating-only-valid-Sources-across-Runs]] Decision Point #4.
4. **Does the native surface replace `tools/curate_sources.py` or coexist?** Recommendation: replace once at parity — two curation UIs will drift, and the standalone tool was explicitly built as disposable.
5. **Should Phase 1 also gate the non-codified path against the aggregated set?** Recommendation: no, not yet. Aggregated ≠ approved; enforcing against an unreviewed list would encode the fabrications.

## Acceptance

- **Phase 1:** a codified run with a deliberately planted unapproved URL in a section file → that citation is dropped (or flagged, per Decision 1), the drop appears in the analyst worksheet with its section and claim, and no approved citation is touched. A non-codified run produces byte-identical output to pre-change.
- **Phase 2:** the same codified run emits zero new URLs from `cite`, `fact_correct`, and `fact_verify`; `enrich_socials` still adds LinkedIn links.
- **Phase 3:** `load_sources_md()` round-trips `title`, `publisher`, `published_date`, and `verdict` without the raw-frontmatter workaround; `tools/curate_sources.py` drops its regex verdict-recovery pass.
- **Phase 4:** from a halted run in the native app — approve one, deny one with a reason, re-search one and accept a recovered URL, add one by paste, register one as a stream → "Approve set & continue" writes a valid `mode: codified` `Sources.md` (backed up), the run resumes from checkpoint, and the resumed run's citations are a subset of the approved set.

## Repo boundary

Phases 1–3 are pipeline work: they land in `apps/memopop-orchestrator/` and its changelog, per that repo's `CLAUDE.md` §"Changelog scope". Phase 4 is client-surface work: `apps/memopop-native/`, logged here. This plan lives at the `memopop-ai` level because the mechanism spans the API seam and neither half is useful alone.

## One-sentence version

Teach the existing gates one new question — *was this source approved?* — and give the analyst a real surface for answering it, so the war between the researcher, the enricher, and the validator ends with the analyst holding the only pen that can add a source.

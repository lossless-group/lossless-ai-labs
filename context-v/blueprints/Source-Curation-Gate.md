---
title: "The Source Curation Gate — A Convergent Prune-and-Promote Surface for AI-Assisted Web Research"
lede: "Three apps independently grew the same organ: a human-driven step between web retrieval and content generation that ranks, prunes, and provenance-stamps sources before any prose exists. This blueprint extracts that organ into one independent, reusable surface — input is a raw LLM-generated resource list (usually Perplexity), output is a promoted, grounded corpus the writer is structurally unable to escape. It converges memopop's filesystem-first Sources.md, augment-it's pack-runner connector palette, and dididecks' CorpusItem provenance model into a single contract."
date_created: 2026-06-27
date_modified: 2026-06-27
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.8 (1M context)
semantic_version: 0.0.0.1
status: Draft
tags:
  - Blueprint
  - Source-Vetting
  - Source-Curation
  - Source-Pruning
  - AI-Assisted-Web-Research
  - Retrieval-Augmented-Generation
  - Human-in-the-Loop
  - SearXNG
  - Perplexity
  - Provenance
  - Closed-Corpus
  - Anti-Hallucination
  - Grounded-Generation
related_skills:
  - search-lossless-corpus
  - chroma-local
  - crawl-fetch-ingest
  - context-vigilance
  - lossless-flavored-markdown
---

# The Source Curation Gate

> Sibling to [[Corpus-Grounded-Generation-of-Decks-and-Memos]] (the *generation* theory) — this is the **front of Stage 3 (retrieve)**, the human-driven step that makes the fact-substrate trustworthy before any prose is written. Converges three independent prior implementations into one reusable surface.

## Why this exists

AI-assisted web research produces a list of "sources." Most of the cost is not finding them — it is discovering that a third of them are fabricated, half of the rest are noise, and the signal is buried so deep that manual Google + Google Docs starts to look time-competitive. That drag is not a prompt problem. It has two structural causes, both already diagnosed in our own corpus:

1. **Retrieval and generation are conflated.** One model call asked to both search *and* write invents URL-shaped tokens to fill citation-shaped holes. (See [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] — 65 fabricated `example.com` URLs in one memo.)
2. **Triage happens at the wrong unit and the wrong time.** Reviewing per-URL, post-generation, after fabrications are already woven into prose. (See the augment-it OfficialPulse audit: 99.7% reject rate, root-caused to the unit of work, not the volume.)

The fix that all three apps converged on independently: **a human curation gate between retrieval and generation** that produces a *ranked, pruned, provenance-stamped* source set, which becomes the closed corpus a structurally-disarmed writer cites from. This blueprint extracts that gate as a **shared pattern**, not a shared package.

## Packaging discipline — knots-style, not a dependency

dididecks-ai, augment-it, and memopop-ai are **fundamentally different apps and stay that way.** ai-labs is a pseudomonorepo; the cross-app sharing model is the `astro-knots` **`knots` lesson** — `@knots/*` as imported dependencies *failed* (abstraction overhead; UI especially, since "sites diverge too much in design for generic components to be useful"). What survived: co-located development + shared `context-v/` docs + **selective copy-from sample code**, cross-referenced with `@context-v/*`. So:

- This blueprint + any **sample code** is the shared artifact, at the ai-labs parent level.
- Each app **re-implements** the gate against its own stack, **conversationally linked** here via `[[wikilinks]]` / `@context-v/*`.
- **Convergence is shared *vocabulary and schema shape*** (the Source object, verdict ladder, `source.*` verbs) — **never shared runtime code, a shared microfrontend, or a published `@gate/*` package.** That move already didn't work.

See [[Drag-in-AI-Assisted-Web-Research-and-the-Source-Curation-Gate]] for the full diagnosis, prior-art reveal, and the grilling that drives the forks below.

## The one-sentence contract

> Input: a raw LLM-generated resource list. The gate treats each entry as a **Source object** that can be sorted, edited, deleted, or archived; each object can launch a fresh SearXNG search whose relevant results are promotable back into the list; the validated, ranked survivors are the **only** corpus the downstream writer may cite. Output: a promoted, provenance-stamped, grounded corpus.

## What converges here

| Prior implementation | Repo | What this blueprint takes from it |
|---|---|---|
| `Sources.md` artifact + verdict ladder | memopop | The **data model** (`url, title, publisher, sections[], rank, sensitivity, note`) and the **validation verdict ladder** (`verified-accessible`, `verified-gated`, `thin`, `title-swapped`, `verified-via-republish`). The "examined and rejected" body section as institutional memory. |
| pack-runner + ConnectorPalette + scoring | augment-it | The **per-object UI mechanics** — per-row provider re-fire, SearXNG-default connector seam, confidence pill (0–100, tier-1 URL-shape +60), URL-normalization dedup key, promote-subset + `archived` flag, per-record-iteration-before-bulk discipline. |
| CorpusItem + DD-ready citation | dididecks | The **provenance + lifecycle** layer — pointer-not-bytes, `superseded_by`, receiving-side verifiability, archive-on-cite for link-rot. |
| `search_result` content blocks | memopop (Anthropic API) | The **grounding mechanism** that makes the gate load-bearing: the writer cites a block index, not a URL string, so it cannot invent a source the gate didn't promote. |

## The Source object (draft schema — TODO: settle against forks)

```yaml
# one entry in the gate's working set
- source_id: <stable uuid>            # lineage-stable across re-runs / promotions
  url: <exact url>
  normalized_url: <dedup key>         # query/hash-stripped, trailing-slash-removed
  title: <as-fetched, not as-claimed>
  publisher: <domain or named publisher>
  origin: perplexity | searxng | analyst-added | ai-take
  verdict: verified-accessible | verified-gated | thin | title-swapped | dead | unchecked
  confidence: 0-100                   # tier-1 url-shape + name-match + recency - ambiguity
  sections: [<which deliverable sections this serves>]
  rank: <int, priority-first within section>
  status: candidate | promoted | archived | rejected
  sensitivity: internal_only | citable_externally
  provenance:
    found_by: <tool + query that surfaced it>
    fetched_at: <iso>
    published_at: <iso | null>
  note: <analyst rationale — why kept or why rejected>
```

## The operations (capability surface — TODO: register as `source.*` verbs)

Per the [[Chat-As-Verb-Surface-Patterns]] / [[Per-App-Workspace-Conventions]] capability registry:

- `source.import` — ingest a raw Perplexity list into candidates
- `source.sort` / `source.rank` — reorder; rank is load-bearing downstream (hedge calibration, contradiction tie-break)
- `source.edit` — correct title/publisher/sections inline; stale-companion-field discipline on URL edit
- `source.archive` / `source.delete` / `source.reject` — prune, with reject carrying a `note` into institutional memory
- `source.search` — launch a fresh SearXNG search from an object (the connector-palette move); pull metadata from top results
- `source.promote_result` — add a relevant SearXNG result back into the working set as a candidate
- `source.validate` — run the verdict ladder (soft-404, paywall, title-swap, body-length, known-hallucination shapes)
- `source.promote` — move the validated, ranked survivors into the grounded corpus (the gate's output)

## Delivery — an evolving agent-skill in chat Slab 3 (per app)

The gate's *discipline* (how to capture a source, how to wrap a pasted extract in the canonical LFM directive, when to promote) ships as a **product agent-skill**, not hardcoded logic — because the canonical syntax will be messy first and converge over time, and a skill body is editable prose designed to be rewritten. The gate's *operations* are the stable `source.*` / `extract.*` verbs. **Skill plans, verbs execute** — the [[Chat-As-Verb-Surface-Patterns]] `SkillCapability` contract.

How it wires (augment-it's `services/workspace/src/chat.ts` four-slab prompt is the reference):

```
[1] STATIC SPINE        — framing + answer/propose/invoke modes
[2] CAPABILITY SCHEMAS  — source.import / source.search / source.promote / extract.add …
[3] ACTIVE SKILLS       — the source-curation skill body, loaded by trigger-shape  ← this gate lives here
[4] PER-ORG REMINDERS   — client profile / decisions
```

- The skill loads into **Slab 3** only when the turn matches its `description` (trigger-shape), advises the model, and the model calls the executing verbs. The skill churns freely (syntax still converging); the verb contract underneath stays stable.
- **As of 2026-06-27, augment-it's Slab 3 is `const ACTIVE_SKILLS = ''`** — reserved, cache-breakpoint in place, no skill wired yet. Turning it on with the first `SkillCapability` is net-new work.
- **memopop already authored relevant skills as files** (`context-v/agent-skills/sources-md-curation`, `user-adds-adhoc-sources`) but consumes them **pipeline-side** (Python orchestrator), not via an in-app chat Slab 3. Bringing the gate to memopop's chat = standing up the four-slab assembly there, then injecting those skills.

**knots-correct placement:** this blueprint is the shared pattern; **each app authors its OWN source-curation agent-skill** (in `<app>/context-v/agent-skills/`) and wires its OWN Slab 3. Convergence is the shared verb vocabulary (`source.*`, `extract.*`) + the LFM extract-directive syntax — never a shared skill package. These are **product agent-skills** (app-runtime), distinct from Claude Code session skills (lossless-skills → `~/.claude/skills`); the lossless-skills authoring rule does not apply.

⚠ Open: which app wires Slab 3 first (augment-it has the chat machinery; memopop has the skill files). See [[Drag-in-AI-Assisted-Web-Research-and-the-Source-Curation-Gate]] fork 1.

## Stage stubs — TODO: fill as forks resolve

### A. Ingest the raw list
TODO. Parse Perplexity output (markdown / JSON). Quarantine the AI-take per [[Human-Curated-Source-Sets-and-Per-Firm-RAG-for-Memo-Narrative]] §1 — its URLs never auto-propagate.

### B. Pre-validate before the human touches it
TODO. Run the verdict ladder first so the analyst never clicks past dead URLs and the list arrives roughly pre-sorted. (memopop principle: "validate before the human ranks.")

### C. The object surface — sort / edit / delete / archive
TODO. Generic row rendering, sortable columns, inline edit, status chips, confidence pill, verdict badge, provenance hover. (augment-it Records-Surface + Response-Reviewer mechanics.)

### D. Per-object SearXNG expansion
TODO. ConnectorPalette-style per-row fire → metadata pull → promote relevant results back. Provider-first-class seam so SearXNG is default and others (Tavily/Valyu/Firecrawl/Jina) are overrides.

### E. Promote to grounded corpus
TODO. The survivors become `search_result` blocks. Persist as `Sources.md` (frontmatter for machines, "how built / examined-and-rejected / gaps" prose for humans). Optionally embed into a per-org Chroma standing corpus.

## Operator's proposed v1 shape (2026-06-27)

The operator's design theory — a **per-search UI over local filesystem storage**. Logged verbatim-in-intent; open questions flagged inline as `⚠`.

### Pass 1 — search → relevant_results → promote

1. **Add a search term.** It goes to **SearXNG via API**; the gate either renders the results in-UI *or* shoots the query into the browser. The gate can target different underlying engines — **document which engine each search used** (`engine:` in frontmatter).
2. **Come back with links.** The analyst posts chosen links as **`relevant_results`**. For each, **Jina Reader** pulls **metadata + the first 200 characters** (cheap preview — no full fetch yet).
3. **Promote-immediately option.** Promoting a result triggers **Jina pulling ALL the content** (or downloading the PDF) into the saved file.
4. **Storage.** `relevant_results/` is a **folder**; each saved article/content item is a **`.md` file with YAML frontmatter that maps to the Jina API result** (or whatever canonical tool replaces it later — adopt a canonical schema if one exists).
5. **Search-folder naming.** Each search auto-creates a folder named `YYYY-MM-DD_Search-Query-as-is-String`.

```
<gate-root>/
  2026-06-27_ocean-energy-market-size/        # ISO date + SLUGIFIED query (see Flag 1)
    _search.md                                # the search manifest (verbatim query + raw candidates + notes)
    relevant_results/
      ocean-energy-systems-annual-report.md   # one .md per saved item; YAML ← Jina result
      irena-2025-offshore-outlook.md
```

⚠ **Filename safety.** A raw query string contains characters illegal/awkward in folder names (`/ : ? " *`). Keep the **verbatim query in frontmatter** (`search_query:`) and a **slugified form in the folder name**. "As-is string" lives in YAML, not on disk.

**The search needs its own home — `_search.md` manifest.** Since the verbatim query no longer lives in the folder name, one manifest file per search folder holds it. Markdown-with-frontmatter (house convention): structured fields in YAML, human notes in the body. The leading underscore sorts it above `relevant_results/` and marks it as the folder manifest, not a saved item.

```yaml
# _search.md
---
search_query: "ocean energy market size: CAGR & TAM?"   # VERBATIM, as typed
slug: ocean-energy-market-size-cagr-tam                 # = the folder name
searched_at: <iso>
engines: [google, bing]                                 # which SearXNG engines ran
searxng_instance: <url>
result_count: 24                                        # raw results SearXNG returned
promoted_count: 0
status: open | exhausted
---

# Search: ocean energy market size

## Raw candidates (what SearXNG returned)     # provenance: returned vs. picked
- [title](url) — engine, snippet

## Notes                                        # search-level "examined and rejected"
Why this query, refinements tried, what was obvious junk and why.
```

The **Raw candidates** section is the provenance trail (returned-vs-picked); the **Notes** body is the search-level institutional memory that stops the next run re-surfacing the same junk (memopop's "examined and rejected" lesson, applied per-search).

⚠ **Per-search folders vs. one pool.** N searches = N folders = N parallel lists. memopop's hard-won lesson was the opposite — *"one global source pool, section tags, not ten parallel lists"* — because the same source surfaces across multiple searches and you don't want it duplicated/curated twice. **Fork: is the search-folder the unit of storage but a single per-deliverable pool the unit of curation (dedup on `normalized_url` across folders)?** (Raised, not resolved — for the post-log Q&A.)

### Per-item frontmatter (maps to Jina Reader result)

```yaml
---
title: <as-fetched>
url: <exact url>
normalized_url: <dedup key — query/hash-stripped>
source: searxng | analyst-paste
search_query: "ocean energy market size"     # verbatim; folder name is the slug of this
engine: google | bing | duckduckgo | brave   # which SearXNG engine returned it
fetched_at: <iso>
published_at: <iso | null>                    # jina metadata
description: <jina metadata>
excerpt: <first 200 chars>                     # the cheap preview
status: relevant | promoted | archived | rejected
content_pulled: false                          # true once promoted (full body / PDF)
asset_path: <path to downloaded PDF, if any>
# NOTE: extracts do NOT live in YAML — they live in the body as LFM directives (Pass 2).
# Frontmatter is for short, controlled scalars; quote/stat/reference text breaks YAML.
---
```

### Pass 2 — paste extracts (rich text → LFM directives in the body, NOT YAML)

The analyst pastes **quotes, claims, stats, or references** as rich-text strings. These do **not** go in YAML — quote/stat/reference text is full of `: " $ % [ ] |`, every character that breaks YAML. Instead they live in the **markdown body** as [[lossless-flavored-markdown|LFM]] **container directives** under `# Extracts`. The dangerous text is the directive *body* (plain markdown, zero escaping); only short controlled metadata is in *attributes*.

```markdown
# Extracts

## Quotes
:::quote{source="ocean-energy-systems-annual-report" page="12"}
"Ocean energy capacity will reach 10 GW by 2030 — a 40% CAGR: unmatched in marine power."
:::

## Claims
:::claim{confidence="high" source="irena-2025-offshore-outlook"}
Ocean energy is structurally counter-cyclical to fossil-fuel price swings.
:::

## Stats
:::stat{metric="market-size" value="5B" unit="USD" year="2030" source="ocean-energy-systems-annual-report"}
Global ocean energy TAM projected at $5B by 2030.
:::

## References
IRENA (2025). *Offshore Renewables Outlook*.[^9f3a1]

[^9f3a1]: 2025-03-10. [Offshore Renewables Outlook](https://irena.org/...). Publisher: IRENA. Published: 2025-03-01.
```

**Why this is the canonical move (Flag 3 resolved, not patched):**

- **Machine-readable by construction.** `remark-directive` (LFM's parser) turns `:::stat{...}` into `{ name: 'stat', attributes: {...}, children: [text] }`. The parse *is* the structured extraction — there is **no YAML mirror**, so there is **nothing to drift**. Flag 3's conflict-resolution question is deleted, not answered.
- **The pasted string never touches YAML or an attribute value** — it's the directive body. This is exactly the escaping problem, dissolved.
- **References are LFM hex-code citations** (`[^9f3a1]`, never sequential `[^1]` — breaks on reorder). The tree's existing stable citation system, with build-time OG hover-popovers, that the downstream grounded-generation writer can bind to (closed-corpus citation — the whole point of the gate).
- **If a consumer needs YAML/JSON**, it is *generated* by parsing the directives at write-time and marked `# generated — do not edit`. Generated mirrors can't drift.

⚠ **LFM rules to honor:** directive props are strings and must be quoted (`value="5B"`, not `value=5B`); `type` and `format` are reserved attribute names (use `metric=` on `:::stat`, not `type=`); `:::` open/close pairs are strict (lint with `pnpm lfm:check`). For the gate as pure storage, the directives parse for free even without registered components; register `quote`/`claim`/`stat` triggers only if a splash/site later *renders* them.

### Where this lands against the stages

Pass 1 = Stages A (ingest)→B (validate)→D (SearXNG expansion). Pass 2 + promote = the analyst hand-building the **fact-substrate** that Stage 5 verification later checks claims against. The two-tier Jina fetch (metadata+200 chars for candidates, full body/PDF on promote) **is exactly the G3 recommendation** — discovery cheap, grounding only on survivors.

## Open forks — being grilled (answers fold back in)

1. **Which app hosts the first reference implementation** the others copy-and-adapt from? (Packaging itself is settled — knots-style shared pattern, re-implemented per app, no shared dependency. augment-it has the most already-built: pack-runner + connectors + scoring. memopop has the live data model + the pain. dididecks has the corpus/citation model.) — TODO
2. **Where does the working set live — filesystem `Sources.md`, SurrealDB, Chroma, or a sidecar?** (TODO)
3. **Verdict ladder: automated heuristics, an LLM judge, or analyst-only at v1?** (TODO)
4. **Is "relevance" of a SearXNG result a score, an embedding match against the deliverable need, or pure human judgment?** (TODO)
5. **One global source pool with section tags, or per-section lists?** (memopop says global+tags — TODO confirm for the generic surface)
6. **Does the gate own grounded generation, or stop at "promoted corpus" and hand off?** (TODO — scope boundary)
7. **Sensitivity default: `internal_only` or `citable_externally`?** (memopop recommends internal_only — TODO)

## Anti-patterns

- **Letting AI-take URLs leak into the corpus.** The Perplexity exhibit is sealed; its citations are display-only.
- **Triaging post-generation, per-URL.** The whole point is pre-generation, per-object. (OfficialPulse 99.7%.)
- **Treating rank as cosmetic.** Rank drives hedge calibration and contradiction tie-break downstream.
- **HTTP-200 as validity.** A 200 is not a real page (soft-404s, paywalls, title-swaps). Run the ladder.
- **Re-inventing the connector seam's *vocabulary*.** Each app re-implements (knots-style), but copy-and-adapt augment-it's `connectors/` *shape* — don't coin a new provider abstraction per app.
- **Proposing a shared dependency across the three apps.** Knots already proved that fails; share the pattern + sample code, not a package or microfrontend.

## Related

- [[Corpus-Grounded-Generation-of-Decks-and-Memos]] — the generation theory this gate feeds (Stage 3 front).
- [[Human-Curated-Source-Sets-and-Per-Firm-RAG-for-Memo-Narrative]] — the gate spec + retrieval-provider landscape.
- [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] — the why (harvester/writer split).
- [[Curating-only-valid-Sources-across-Runs]] — the verdict ladder + validation heuristics.
- [[Chat-As-Verb-Surface-Patterns]] / [[Per-App-Workspace-Conventions]] — the capability-registry substrate.
- augment-it: `apps/pack-runner/`, `services/social-search/src/{scoring,verification,connectors}.ts` — the half-built UI + connector seam.
- memopop: `apps/memopop-orchestrator/io/<firm>/deals/<deal>/inputs/Sources.md` — the live data model.

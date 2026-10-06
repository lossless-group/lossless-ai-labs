---
title: "Handoff — grounded citations shipped, extraction half-wired"
lede: "Fabricated URLs are structurally impossible now. Extracts are produced and stored but never consumed, and codified research runs 6× too slow to use."
date_created: 2026-08-21
date_modified: 2026-08-21
date_authored_initial_draft: 2026-08-21
date_authored_current_draft: 2026-08-21
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: Active
publish: false
category: Handoff
tags:
  - Handoff
  - MemoPop
  - Anti-Hallucination
  - Grounding
  - Source-Extraction
  - Attribution
  - Citation-Discipline
site_uuid: a64eaeb4-ea9a-473e-8010-5012c9d21d04
hex_code: 1hea46
from: "memopop-ai"
from_path: "context-v/handoffs/2026-08-21-Grounded-Citations-Shipped-Extraction-Half-Wired.md"
---
## Where things stand

The plan of record is
[[../specs/Extract-Sources-Where-Possible-with-Fallback-to-Ground-Content]].
**We got a good way there and did not finish.** This handoff is the delta.

| Repo | HEAD | Pushed |
|---|---|---|
| `apps/memopop-orchestrator` | `3c7d134` (main) | ✅ |
| `memopop-ai` | `175f268` (main) | ✅ |
| `astro-knots/sites/mpstaton-site` | `88f23c4` (main) | ✅ |

171 Python tests pass. Nothing is half-applied on disk.

### What is genuinely done

**Citation reconciliation.** Every Sonar response carries `search_results` — the
documents actually retrieved. All ten call sites read only `message.content` and
threw it away, while the prompt asked the model to *type* URLs. Now citations are
rebuilt against the retrieved set. Fabricated URLs are unreachable rather than
filtered.

**Grounding.** Every extracted quote and stat must appear verbatim in the stored
document. This is the only check that catches a model **faking having read a
source** — provenance, liveness and fact-verification all pass an invented
quotation on a real URL.

**Attribution audit**, in the graph at `fact_check → attribution_audit →
fact_verify → fact_correct`, `flag` mode by default.

**Citation hygiene** (`src/citation_hygiene.py`) — cite-wide's spacing rule
ported to Python, plus punctuation order and paragraph-scoped dedupe.

**Durable foundation** — content and extracts live in `inputs/sources/*.md`, not
`outputs/<version>/`, so they survive across versions. Deck analysis cached per
deal by content hash.

**`cli/export_web.py`** — webpage export with the astro-knots reading-position
ToC, distinct from the print/PDF export.

## Do this first

**1. Codified section research is 6× too slow. This is the blocker.**

`codified_section_researcher.py:189` is a plain `for idx, section in
enumerate(...)`. The `perplexity_section_researcher` it replaced used
`ThreadPoolExecutor`. Add to that: the grounding retry fires on nearly every
section, doubling the calls, and each prompt carries up to 16 sources × 8000
chars. ChromaDB spent **20 minutes** in research where the old path took ~3.

Parallelise the loop first. Then consider gating the retry on a threshold rather
than any ungrounded span, and capping sources-per-section.

**2. Extracts are produced and never consumed.**

`extract_for_deal` runs and writes `# Extracts` into each source file. Section
synthesis still reads raw stored content — `load_extracts_for_deal` exists and
nothing calls it. **This is the last hop, and it is where the coverage benefit
actually lands.** Until it is wired, extraction is cost without payoff.

**3. A codified run that finds zero sources per section fails silently.**

ChromaDB's 37 sources were tagged against the decile-group taxonomy while the
deal used 12Ps. `sources_for_section` matched zero for every section, the
researcher correctly emitted `<needs-source>`, and the writer produced a
4,949-word memo with **zero citations** — with nothing treating that as an
error. It cost a full run and was only caught by reading a research file.

Make it loud. A codified run with no matching sources for a section is a
configuration error, not a degraded result.

## Findings worth keeping

**Fabrication rate is not a stable property.** Two identical runs of TrustedRouter
— same code, same temperature: Executive Summary went 0% → 90% fabricated;
Origins went 43% → 0%. You cannot threshold a distribution that wide, which is
the whole argument for closing the surface instead of filtering output.

**The measurement.** 129 web citations on one memo: **37% fabricated, 34%
pointing at real pages with the wrong title or date, 29% correct as written.**
Metadata drift affected the *majority of legitimate* citations and is invisible
to a click-the-link check.

**Fabrication concentrates where retrieval is thin.** Executive Summary (deck +
general research) 0%. Opportunity, Origins, Organization, Funding — the sections
about the company itself — 43–64%. The sections a partner reads hardest are the
ones least able to support themselves.

**Over-citation is systemic.** 46% of cited paragraphs repeated a citation; one
61-word paragraph carried `[^1]` three times and `[^3]` three times. The
exporter separately consolidated 154 duplicate footnotes to 16 unique sources.

**Codified mode does not help attribution — it may hurt.** A curated competitive
corpus is dense with *other companies'* numbers. TrustedRouter's Section 4 had
three misattributions presenting OpenRouter's $150M/$113M/$1.3B and its Stripe
acquisition as TrustedRouter's. Real figures, correctly cited, wrong subject.

## Gotchas that cost real time

- **The sidecar caches modules at startup.** It imported `sources_md` at 17:11,
  picked up a newer `codified_section_researcher` later, and died on
  `cannot import name 'is_explicitly_approved'`. The function existed, was
  committed, and imported fine in a fresh process. **Bounce the sidecar after any
  orchestrator code change** — same rule as MCP servers and skills.
- **The UI autosaves `Sources.md` and clobbers CLI writes.** A rejection written
  from a script was overwritten 53 seconds later. While the app has a deal open,
  it is authoritative. Curate in the UI or close the deal first.
- **Skipping a source in the UI approves it.** `is_approved_entry` is deny-based,
  so "unreviewed" and "approved" are indistinguishable in the data. The one
  source not clicked was the one meant to be excluded.
- **`export_branded.py` never overwrites.** It writes `.1.html`, `.2.html`, `.3`…
  Minutes were spent concluding config changes had not applied while reading a
  stale original. `export_web.py` overwrites.
- **Resolving source files by filename creates duplicates.** The canonical name
  embeds a capture date; across the midnight-UTC boundary, 28 of 28 sources
  resolved to a new name. Index by `normalized_url` — the source's real identity
  and the registry's UNIQUE key.
- **PDF sources cannot be fetched.** `_fetch_via_httpx` bails on non-HTML by
  design, so any PDF URL returns nothing. `fetch_local_file` already extracts PDF
  text; the fetcher just needs to download and hand off.
- **Fetch failure ≠ hallucination.** Of 9 ChromaDB failures, 8 were live and
  bot-blocked (ACM 403, Grand View 403, McKinsey timeout, a PDF). One
  (`anton.equipment`) does not resolve at all.
- **Verify by reading the artifact, not by grepping.** Three separate false
  conclusions tonight came from a bad `find`/`grep` rather than a real problem.

## Loose ends

- **SurrealDB registration is built and unwired.** `src/surreal_registry.py`
  mirrors `record-surrealdb-resolver`'s SurrealQL, connects, and was verified
  read-only (211 sources, 255 usages, clients `reach-edu` / `humain-vc`).
  **Nothing has been written.** Dry run for ChromaDB: 37 new rows, 0 collisions.
  Gated on `is_explicitly_approved` so the system of record stays clean.
- **`<needs-source>` on `group: synthesis` sections is wrong.** Sections 8 and 10
  are judgment, not sourcing. The marker should say `<needs-analyst-judgment>` —
  same empty slot, honest label. Do **not** feed the scorecard artifact in; the
  analyst does not want LLM judgment there.
- **`Reconciled N > Added N` in enrichment is uncharacterised.** File evidence
  shows citations increasing, not disappearing, so it is not destroying data —
  but there is no mechanism for it yet.
- **`preferred_sources` in the outlines is still decorative** — never reaches the
  API. No `search_domain_filter`, no `search_recency_filter`. Disambiguation
  excludes are enforced by asking the model in prose.
- **403 is still whitelisted** in `remove_invalid_sources`. The provenance
  sidecar exists to discriminate; the consult is unwired.
- **TrustedRouter v0.0.2 predates the attribution audit.** Three misattributions
  were fixed by hand in `2-sections/04-organization.md` and reassembled. A
  v0.0.3 would catch that class automatically and is cheap now.
- **`io/lossless` is untracked by design** — covered by the root `/io/*/` rule,
  no submodule. Brand config built from `lossless-changelog/DESIGN.md`
  cross-checked against `site/src/styles/lossless-theme.css`.
- **Both memos are on `mpstaton-site` with `publish: true`** and are being
  reviewed by hand before going live. Whether `publish` actually gates rendering
  depends on the page templates, which were not checked.

## Map

| Concern | File |
|---|---|
| Retrieved-source capture + reconciliation | `src/agents/perplexity_sources.py` |
| Verbatim evidence check | `src/grounding.py` |
| Per-source extraction | `src/agents/source_extractor.py` |
| `# Extracts` render/parse | `src/curation/extracts.py` |
| Subject attribution | `src/attribution.py`, `src/agents/attribution_audit.py` |
| Citation spacing / dedupe | `src/citation_hygiene.py` |
| Explicit-approval gate | `src/curation/sources_md.py` — `is_explicitly_approved` |
| Deck cache | `src/deck_cache.py` |
| SurrealDB registry | `src/surreal_registry.py` |
| Pre-curation triage | `cli/triage_sources.py` |
| Webpage export | `cli/export_web.py` |
| Plan of record | [[../specs/Extract-Sources-Where-Possible-with-Fallback-to-Ground-Content]] |
| Prior handoff | [[2026-08-08-Source-Approval-Shipped-Enforcement-Unrun]] |
| Coverage problem | [[../../apps/memopop-orchestrator/context-v/plans/Citation-Coverage-Promoter]] |
| Session changelog | `apps/memopop-orchestrator/changelog/2026-08-21_01.md` |

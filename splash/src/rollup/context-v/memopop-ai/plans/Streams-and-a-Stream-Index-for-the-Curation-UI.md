---
title: "Streams and a Stream-Index for the Sources Curation UI — A Plan"
lede: "A 'stream' is a URL that regularly publishes credible, relevant content — an insights/blog index, a newsroom, an RSS feed — as opposed to a one-off article. augment-it already named and modeled this exactly ('media_streams', the recurring publisher). This plan adopts that vocabulary and adds a stream-index.md registry plus light UI affordances to the existing curate_sources.py tool, so when the analyst finds a recurring publisher (e.g. rockhealthcapital.com/insights/) they can register it as a stream instead of mis-filing it as a citable source. Plan only; no polling/walking infrastructure here."
date_authored_initial_draft: 2026-06-28
date_last_updated: 2026-06-28
date_created: 2026-06-28
date_modified: 2026-06-28
at_semantic_version: 0.0.0.1
status: Draft
category: Plan
augmented_with: Claude Code on Claude Opus 4.8 (1M context)
authors:
  - Michael Staton
tags:
  - Plan
  - Streams
  - Stream-Index
  - Source-Curation
  - Recurring-Publisher
  - Media-Streams
  - MemoPop-Orchestrator
related_skills:
  - sources-md-curation
  - context-vigilance
from: "memopop-ai"
from_path: "context-v/plans/Streams-and-a-Stream-Index-for-the-Curation-UI.md"
---
# Streams and a Stream-Index for the Curation UI

> Extends [[Sources-Curation-UI-Tool]] (the `tools/curate_sources.py` tool). Introduces **streams** as a first-class kind distinct from one-off sources, stored in a `stream-index.md` registry. **Plan only — not agreed, not implemented.** Captured so the prior art isn't re-discovered later.

## The concept (adopt augment-it's vocabulary — don't fork it)

A **stream** is a *recurring publisher* that emits content over time — a blog/insights index, newsroom, RSS feed, Substack, YouTube channel, a journalist's beat page. It is **not corpus**; it is the *generator* of corpus. The blog index isn't the content — it's the thing you poll to *discover* content, and each poll yields N corpus items. Living example: `https://rockhealthcapital.com/insights/`.

This is augment-it's **three-kind taxonomy** (from `Funder-Fit-Engine-Org-Corpora-and-the-Story-Unlock-Cycle.md`, 2026-06-17):

| Kind | What it is | Temporal | Where it belongs |
|---|---|---|---|
| **Identity link** | who the org *is* (homepage, LinkedIn) | static, fetch once | org record |
| **Stream** | a *recurring publisher* (insights index, RSS, newsroom) | **polled on a cadence** | `media_streams` / **`stream-index.md`** |
| **Corpus item** | one piece of content (an article, a PDF) | fetched once, cited | `Sources.md` / corpus |

The key discipline this buys the curation tool: when the analyst hits `rockhealthcapital.com/insights/`, that is a **stream**, not a citable source — it should be registered, not dropped into `Sources.md` as if it were an article. (Mirrors `Funder-Content-Corpus-Workflow.md` Rule 2: feeds/category/archive pages "are NOT articles and never belong in the corpus.")

## Prior art (the reveal)

**augment-it — the concept, named and modeled:**
- `context-v/specs/Record-DB-Resolver.md` (2026-06-22) — explicit definition: *"A stream is the recurring publisher (blog index, RSS, newsroom), not a single piece of content."* Canonical field `media_streams { url, kind, party, url_domain, added_at }`.
- `context-v/explorations/Funder-Fit-Engine-Org-Corpora-and-the-Story-Unlock-Cycle.md` (2026-06-17) — the three-kind taxonomy + the **stream schema**: `media_streams: [{ url, kind, party, has_rss, rss_url, cadence, url_domain, last_polled_at, added_at }]`. First-party (org owns it; 1:1) vs third-party (media outlet; M:N) provenance split. Open question on record: *"who owns polling + freshness?"* — the poller is **not yet shipped** anywhere.
- `context-v/specs/Entity-Pulse-Bundle.md`, `Flow-for-Bundles-Packs.md`, `Funder-Content-Corpus-Workflow.md` — the operational packs that *discover and walk* streams (`official-blog-pack`, find-index → extract-posts), the operator field `official_updates_index_urls`, and connectors (`serpapi-site-search`, `firecrawl-nav-scan`, `firecrawl-nav-agent`) that find a `blog OR news OR press OR insights` index URL.

**memopop — the adjacent pieces (concept un-named):**
- `apps/memopop-orchestrator/AGENTS.md` §10 — `preferred_sources` (outline-level): `perplexity_at_syntax: [...]` + `domains.include/exclude`. A per-section "where to look" registry — the closest existing analog to a curated stream set.
- `context-v/explorations/Human-Curated-Source-Sets-and-Per-Firm-RAG-for-Memo-Narrative.md` — the **per-firm standing corpus** (Chroma, `firm_slug`) that accumulates across deals; the natural home a stream's harvested items would feed.
- `context-v/Links-for-Corpus.md` — a skeletal 2-URL list (`cbinsights.com/research/`, `builtin.com/`). **This is a proto-stream-index already** — exactly the kind of recurring-publisher index this plan formalizes.
- `agent-skills/sources-md-curation` + `source-with-extracts-md` — the per-deal `Sources.md` and per-source-file conventions this composes with (a stream is a *sibling* concept, not a `Sources.md` entry).

## The `stream-index.md` file

A frontmatter-driven registry (same machines-in-frontmatter / humans-in-body convention as `Sources.md`), adopting augment-it's `media_streams` field names so the two trees converge:

```yaml
---
kind: stream-index
firm: humain                  # streams are cross-deal → firm-level, not per-deal (see placement fork)
date_created: 2026-06-28
date_updated: 2026-06-28
streams:
  - url: https://rockhealthcapital.com/insights/
    title: "Rock Health Capital — Insights"
    publisher: "Rock Health Capital"
    kind: blog-index           # blog-index | rss | newsroom | substack | youtube | beat-page | topic-tag
    party: third_party         # first_party (the org's own) | third_party (a media outlet)
    has_rss: false             # true → cheap automatic poll; false → scrape the index
    rss_url:                   # populated if discovered
    cadence: few-per-month     # daily … few-per-year — sets future poll frequency
    url_domain: rockhealthcapital.com
    sections: [opportunity, opening]   # deliverable sections this stream tends to feed (optional)
    relevance: high            # analyst's credibility/interest/relevance call
    last_polled_at:            # null until a poller exists (future)
    added_at: 2026-06-28T00:00:00
    note: "Digital-health VC insights; strong for market + thesis framing."
---

# Streams — humain

## Why these
Analyst notes on each stream's credibility and what it's good for.

## Candidates / not-yet-added
Streams seen but not yet registered, with why.
```

**Placement fork (decide later):** streams are **cross-deal**, so the registry belongs above the deal. Default proposal: **`io/<firm>/stream-index.md`** (firm-level). A global media registry (`io/_streams/stream-index.md` or `memopop-ai/context-v/`) is an alternative for third-party outlets shared across firms — `Links-for-Corpus.md` would migrate into it. Not resolved here.

## UI integration into `curate_sources.py`

Light touches, reusing what's built; **no poller, no walking** in v1.

1. **"This is a stream, not a source" affordance.** On the focused source (and on each search/add result), a **`↪ register as stream`** button. It moves/copies the URL into `stream-index.md` (auto-fetching title via the existing Jina `/api/fetch`), with `kind`/`party`/`cadence` defaulting and editable. Keeps it *out* of `Sources.md` (where it doesn't belong).
2. **Add-a-stream box.** Like the new "Add a link by URL" card — paste an index URL, pick `kind`, register. (The rockhealth case: paste `…/insights/`, mark `blog-index`, done.)
3. **A Streams tab/panel.** A second list (toggle in the header: `Sources | Streams`) that loads/edits/saves `stream-index.md` with the same nav/edit/delete/reorder mechanics already built for sources.
4. **Endpoints** (mirror the existing ones, new file): `GET /api/streams`, `POST /api/streams/save` → `stream-index.md` (backed up). Reuse `/api/fetch` for title; `/api/search` unchanged.
5. **RSS hint (cheap, optional):** on register, probe a couple of common feed paths (`/feed/`, `/rss/`, `/atom.xml`) and set `has_rss`/`rss_url` if found. Pure convenience; no polling.

## Scope

**v1 (this plan's target):** register, edit, tag, and persist streams in `stream-index.md` from the curation UI. That's it — a curated registry.

**Explicitly out of scope (future, and unshipped even in augment-it):**
- The **poller / freshness engine** (cron/cadence-driven re-fetch). augment-it's open question "who owns polling + freshness?" is unresolved tree-wide.
- **Walking** a stream into corpus items (augment-it's `official-blog-pack` find-index→extract-posts) — that's the harvester's job, not the curation tool's.
- Embedding harvested items into the per-firm standing Chroma corpus.

## Open decisions (not for now)

1. Registry placement: firm-level `io/<firm>/stream-index.md` vs a global media registry. (Default: firm-level; migrate `Links-for-Corpus.md` if global.)
2. Does the curation tool *read* streams to suggest searches (e.g. "search within rockhealth insights"), or just register them? (v1: just register.)
3. Vocabulary lock: adopt augment-it's `media_streams` field names verbatim so the two trees converge (recommended), vs a memopop-local shape.
4. When a poller eventually exists, does it live in the orchestrator (Python) or a separate job? (Far future.)

## References

- augment-it `context-v/specs/Record-DB-Resolver.md` — the explicit "stream" definition + `media_streams`.
- augment-it `context-v/explorations/Funder-Fit-Engine-Org-Corpora-and-the-Story-Unlock-Cycle.md` — three-kind taxonomy, stream schema, first/third-party split, the unshipped poller.
- augment-it `context-v/specs/{Entity-Pulse-Bundle,Flow-for-Bundles-Packs,Funder-Content-Corpus-Workflow}.md` — discovery/walking packs and the "feeds aren't corpus" rule.
- memopop `apps/memopop-orchestrator/AGENTS.md` §10 — `preferred_sources`; `context-v/Links-for-Corpus.md` — the proto-stream-index.
- [[Sources-Curation-UI-Tool]] — the tool this extends. [[Source-Curation-Gate]] — the broader pattern.

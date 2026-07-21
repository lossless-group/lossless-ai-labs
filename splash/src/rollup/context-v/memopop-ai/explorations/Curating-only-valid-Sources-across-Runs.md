---
title: "Curating Only Valid Sources Across Runs"
lede: "The memo pipeline recycled the same sources as unique sources across sections, half of them dead pages returning HTTP 200.  Downstream curation cannot fix what `citation_enrichment.py` invents upstream. Verdict: Perplexity completely hallucinates sources — cannot be trusted at all.*"
date_authored_initial_draft: 2026-05-14
date_authored_current_draft: 2026-06-08
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-06-08
at_semantic_version: 0.0.0.2
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Exploration
tags: [Source-Validation, Citation-Quality, Soft-404, URL-Hallucination, Memo-Curation, MemoPop, Dedupe, Cross-Run-Merge]
authors:
  - Michael Staton
image_prompt: A pile of paper clippings stamped "HTTP 200" being run through a sieve, with most clippings falling through into a discard bin and only a few landing on a clean evidence shelf labeled "verified"; a magnifying glass over one clipping reveals a "Page Not Found" body underneath the green-stamped header; deep-violet background, library-card aesthetic, technical annotation labels in a monospaced font.
date_created: 2026-05-14
date_modified: 2026-05-14
from: "memopop-ai"
from_path: "context-v/explorations/Curating-only-valid-Sources-across-Runs.md"
---
# Curating Only Valid Sources Across Runs

## Update 2026-06-08 — Curation cannot save us from upstream invention

The May 14 draft framed curation as the safety net that compensates for whatever the pipeline produces upstream. We then ran the test that disproved that framing.

On 2026-06-07 we ran Alpha JWC's Panthalassa Series C memo with `inputs/Sources.md` set to `mode: codified` and seven analyst-curated institutional sources (IEA, IRENA, OES, Springer Nature). Codified mode is supposed to confine the research-phase agents to those URLs and forbid broad search. The downstream `citation_enrichment.py` step then runs Perplexity Sonar Pro on each `1-research/*.md` file to "enrich" it with additional citations.

Result: **65 fabricated `example.com` URLs across the v0.0.2 output.** Not "URLs that returned 404." Not "soft-404s that need Pass B's body sniff." Literal `example.com` placeholder URLs — the textbook example domain that exists only as IANA's reserved illustrative namespace. Perplexity invented these whole. The verdicts from the May 14 draft (`soft-404`, `paywall`, `title-swapped`, `thin`, `fetch-failed`, `hallucinated-pattern`) don't have a category for "domain that should never appear in any production URL"; they don't need to, because no reasonable upstream pipeline should be capable of emitting one. Ours was.

### Operator verdict, 2026-06-07

> "Perplexity completely hallucinates sources — cannot be trusted at all."

### What this means for curation specifically

1. **Pass B's heuristic list is necessary but not sufficient.** Soft-404 sniffing, title-swap detection, body-length thresholds — all the May 14 checks would catch `example.com` URLs trivially (the body is IANA's static page; the title doesn't match any claimed publication). But running curation *after* an LLM has already fabricated 65 such URLs is treating the symptom. Curation should never need to filter URLs whose top-level domain is `example.com`. The fact that it does is an indictment of the agent that produced them, not a curation bug.

2. **The 30-day cache (Pass B decision point #2) makes the problem worse, not better, when the upstream is hallucinatory.** If a fabricated URL passes a body-sniff once (the `example.com` static page returns 200 and a non-empty body), the cache will mark it `verified` for 30 days. Curation hardens the lie. The cache assumes upstream URLs are *real-but-possibly-dead*; it has no theory for *real-domain-but-never-existed-page* and no theory at all for *placeholder-URL-the-model-typed*.

3. **The right division of labor was named in the sister exploration but not yet built.** See [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] — every URL in every output must originate from a tool call that the Source Harvester actually executed, not from prose generation. Curation then has a meaningful job: validate the harvester's catalog. With that split in place, `example.com` URLs cannot enter the pipeline because no search tool ever returns them. Without that split, curation is the janitor cleaning up after the agent that invents URLs every run.

### Implication for the build order in this doc

Pass A (global dedupe + cross-section view) is still worth shipping — it's cheap, instant, and improves the analyst experience regardless of how upstream is fixed. Pass B (real validity check) is still worth building — but its priority has changed. **The harvester/writer split documented in [[Separating-Retrieval-from-Generation-in-Agent-Pipelines]] now takes precedence over Pass B in any prioritization conversation.** Pass B as a standalone fix is treating downstream symptoms; the architectural split addresses the root cause. Build Pass B as a defense-in-depth layer, not as the primary fix.

### If Perplexity is retained (tactical mitigation only)

[Unlocking Perplexity's Power — Proven](https://natesnewsletter.substack.com/p/unlocking-perplexitys-power-proven) (Nate's Newsletter). Practitioner guide to constraining Perplexity output through prompt structure, model selection (Sonar vs. Sonar Pro vs. Sonar Reasoning), and tool-mode discipline. Useful as a stopgap while the harvester/writer split is built, or as a baseline for evaluating whether constrained Perplexity is salvageable for a discovery-only role. **Not a substitute for the architectural fix.**

---

## The trigger

We ran the memo orchestrator against ChromaDB seven times — v0.0.1 through v0.0.7 — iterating on prompts, outlines, and section taxonomy. Each run emitted a `3-source-catalog/` directory: nine markdown files, one per section, each listing every URL the pipeline encountered with a status label (`Included`, `Added by Correction`, `Valid but Not Cited`, `Found in Research`, `Excluded — Uncertain`, `Excluded — Invalid`, `Hallucinated`). The intent was clean: every source the system ever saw, with its provenance.

We built a button in the MemoPop native app — **✨ Curate Best Sources** — that walked all seven version directories, deduped by URL within each section, kept the highest-ranked status, dropped `Excluded` and `Hallucinated`, and wrote a single `exports/best-of-sources/` catalog. The button worked. The output was unusable.

**392 "unique" sources across 26 section files.** When you scrolled the directory, the same dozen URLs appeared everywhere. When you clicked through, half of them were dead pages serving HTTP 200.

This document is the post-mortem on why, and the design for a curation step that produces something an analyst can actually start a memo from.

## What was actually wrong

### Problem 1 — "Dedupe" was per-section, not global

The merge keyed on `(section, url)`. If `https://en.wikipedia.org/wiki/ChromaDB` appeared in v0.0.5's executive-summary catalog AND v0.0.7's colossal-market-size catalog, both survived. The pipeline had been pulling the same handful of high-confidence URLs into every section because the underlying research pool was thin — so the union of seven runs across nine sections compounded that into ~390 entries representing maybe 60 distinct URLs.

A reader of the export dir doesn't see "60 unique sources arranged by section." They see "the same Wikipedia / TechCrunch / TryChroma blog post repeated until the eye glazes over." Worse: there's no view that says **"here is every URL exactly once, with the sections it covers."** That view is what an analyst actually wants.

### Problem 2 — HTTP 200 is not a signal of validity

The orchestrator's source validator marked any URL returning HTTP 200 as `Found in Research` and treated it as evidence. But on the modern web, 200 means almost nothing:

- **Soft 404s.** Most enterprise SaaS sites return 200 with a "page not found" body when you hit an unknown URL. The status code lies; the body tells the truth.
- **Paywall landings.** Bloomberg, FT, WSJ, the analyst firms — 200 with a "sign in to continue" stub and no article body.
- **SPA shells.** A single-page app returns 200 with an empty `<body>` and lets JavaScript fill it in. A naive fetch sees nothing.
- **Outright fabrications with placeholder IDs.** The v0.0.5 corrections layer "added" sources like `gartner.com/en/documents/4012345`, `forrester.com/report/The-Serverless-AI-Wave/RES180123`, `idc.com/getdoc.jsp?containerId=US52015`. Those returned 200 because Gartner/Forrester/IDC serve a generic gated landing page for any unrecognized doc ID. The doc IDs are obviously fake — sequential digits, no actual reports — but the validator only checked the status code and rubber-stamped them.

The pipeline's `Hallucinated` filter only catches URLs that smell wrong by pattern (made-up TLDs, malformed paths). It misses the much larger class of URLs that point to a real domain but a non-existent or content-free page on that domain.

### Problem 3 — Status inheritance is too generous

When v0.0.5 first labeled a URL `Found in Research` because of a 200, every subsequent run inherited that label. By v0.0.7 the URL was a load-bearing citation. Nothing in the pipeline ever re-checked whether the page still served real content, whether its title matched, whether the claim it was supposedly supporting was actually present in the body.

The catalog accumulated trust monotonically. There was no decay, no re-validation, no rebuttal mechanism. A URL marked valid in run N was treated as valid in run N+1 even when the only reason for the original label was a status code that meant nothing.

## What curation has to do

Two passes, in this order:

### Pass A — global dedupe + cross-section view (cheap, instant)

Before any network work, collapse the merged catalog from `(section, url)` keys to `url` keys, with normalization:

- Lowercase scheme and host.
- Drop `www.` prefix.
- Strip trailing slash.
- Drop tracking params (`utm_*`, `ref`, `fbclid`, `gclid`, etc.).
- Treat `http://` and `https://` as the same URL when host + path + non-tracking query match.

Then emit a top-level **`Master-Sources.md`** where each URL appears exactly once, with:

- The highest-ranked status it ever received.
- The set of sections it covered.
- The set of versions it appeared in.
- Aggregated metadata (HTTP code seen, claimed publication date, LLM-verification verdict if any).

Per-section files become short pointers — "section N's sources, by reference to the master list." The 26-file pile collapses to one canonical list with cross-references.

**Expected reduction**: 392 entries → ~60–100 truly unique URLs. The "recycled" feeling disappears immediately because the eye stops re-reading the same titles. This pass is pure local computation, runs in well under a second, and is the prerequisite for Pass B (no point validating the same URL three times).

### Pass B — real validity check (slow, networked, opinionated)

For each surviving URL, fetch it and run heuristics. This is a long-running job — at concurrency 10 with reasonable timeouts, 60–100 URLs is 1–3 minutes; 400 URLs is 5–10. The UI needs a progress signal (SSE pattern, mirroring `/memos/{id}/events`).

For each URL:

1. **Follow redirects, take the final status.** Anything not in `[200, 201, 203]` → drop. (We do allow 203 because some news CDNs use it.)
2. **Read first ~20KB of body.** Strip tags, look for soft-404 phrases against a heuristic list:
   - `page not found`, `we couldn't find`, `doesn't exist`, `no longer available`, `has been removed`, `404`, `oops`
   - Paywall sniffs: `sign in to continue`, `subscribe to read`, `this content is for subscribers`, `register to read`, `start your free trial`
   - Any match → flag `soft-404` or `paywall` and drop from "validated" set (keep for inspection).
3. **Extract `<title>` and `<h1>`.** Fuzzy-match (token Jaccard, threshold ~0.4) against the catalog's claimed title.
   - Big mismatch → flag `title-swapped`. Often a sign the URL was hallucinated and the page is unrelated (e.g. a search-results page, a category index).
4. **Body text length.** If extracted text body is < 2KB, flag `thin`. Real articles are rarely under 2KB; thin bodies are usually paywall stubs or soft 404s.
5. **Known-hallucination URL shapes.** A small sniff list, expandable:
   - `gartner.com/en/documents/{numeric-id}` without the canonical report-slug — Gartner real reports use a slug, not a bare numeric ID. Drop.
   - `forrester.com/report/{title}/{RES-id}` where the `RES-id` doesn't validate against Forrester's actual ID format. Drop.
   - `idc.com/getdoc.jsp?containerId=US{numeric}` — IDC's real URL shape is different; this one is a known fabrication template. Drop.
   - `mckinsey.com/...` paths that don't exist (we can't easily distinguish without fetching, so this falls back to the soft-404 detector).
6. **Cache by URL hash.** A run that already validated `https://www.trychroma.com/blog/seed-round` last week shouldn't re-fetch it. Store `{url_hash: {status, body_sha, validated_at, verdict}}` in `exports/best-of-sources/.validation-cache.json`. Re-validate after some TTL (30 days?) or on explicit request.

The output of Pass B is a verdict per URL: `verified`, `soft-404`, `paywall`, `title-swapped`, `thin`, `fetch-failed`, `hallucinated-pattern`. Only `verified` lands in the headline "best sources" set. The others are kept in a sibling `exports/best-of-sources/quarantine/` with the verdict labeled, so an analyst can spot-check and manually promote anything the heuristics got wrong.

**Expected reduction**: 60–100 unique URLs → ~25–40 verified. That's the real "best of."

### Pass C (later) — manual override and human-in-the-loop

Some real pages will fail Pass B falsely — bot detection on Bloomberg, JS-heavy SPAs that need a real browser, archived content on the Wayback Machine that the validator doesn't know to follow. The UI needs an affordance to mark a quarantined source as "I checked, it's real" and have that override stick across re-runs.

Implementation note: this is a stored decision per URL (`overrides.json` in the exports dir, or a section in the cache file), keyed by URL hash, with a timestamp and an optional note. The next curation run reads the overrides before computing verdicts and never re-quarantines an overridden source.

## Architectural placement

The current "Curate Best Sources" button calls `POST /actions/curate-sources` on the FastAPI sidecar synchronously. That worked for Pass A scale (filesystem-only, sub-second). Pass B needs the job-and-SSE pattern that `/memos` already uses:

- `POST /actions/curate-sources` becomes a job-creator returning `{job_id}`.
- `GET /actions/curate-sources/{job_id}/events` streams progress (`url_validated`, `url_dropped`, `section_finished`, `cache_hit`, `done`).
- The native UI's existing `LogStream.svelte` / `JobView.svelte` components can be reused — same shape as a memo run.

The validator itself lives in `apps/memopop-orchestrator/src/curation/`, alongside `best_sources.py`. New file: `validator.py`. Network calls via `httpx.AsyncClient` with `limits=httpx.Limits(max_connections=10)` and per-request timeout ≤ 8s. The soft-404/paywall heuristic list lives in `validator_heuristics.py` so we can extend it without touching the orchestrator.

## What this does NOT solve

- **The upstream problem of the pipeline pulling the same URLs into every section.** That's a research-quality issue: Perplexity Sonar Pro / Tavily are returning the same handful of high-PageRank URLs for every query because the queries are too generic. Fixing it means better query construction in the research agents — different question per section, prompted to find non-overlapping evidence. Out of scope for curation; curation is the safety net, not the fix.
- **Claims that the source actually doesn't support.** A URL can be `verified` (real article, real content) and still be the wrong source for the specific claim it was citation-linked to. Catching that is a separate fact-checking pass that needs to read both the claim and the article and compare them. We don't attempt it here.
- **Citation gaming.** A `verified` source can still be a low-quality source — a SEO blog with no expertise, an aggregator copying a primary source, an AI-generated content farm. Curation by URL validity is necessary but not sufficient for editorial quality.

## Decision points

1. **Build order.** Pass A first (cheap, immediately fixes the "recycled" perception), then Pass B (slow, kills the garbage at the root)? Or build them together so the first user-visible run is already real? Recommendation: **A first**, ship same-day, then B as a follow-up that lights up additional UI affordances.
2. **Cache TTL.** 7 days, 30 days, or until manually invalidated? Recommendation: **30 days**, with a "Re-validate all" button in the UI for forcing a refresh.
3. **Quarantine visibility.** Default-hidden with a counter ("17 quarantined sources — review"), or always-visible with section badges? Recommendation: **default-hidden**, so the headline view shows only verified sources, with a one-click expand.
4. **Override scope.** Per-deal or global? An override on `https://www.bloomberg.com/news/articles/X` is probably reusable across deals. Recommendation: **global by default**, per-deal opt-out — overrides live in a workspace-level file.

## Next steps

- Add `Master-Sources.md` emission to `best_sources.py` (Pass A). Convert per-section files to pointer files.
- Add URL-normalization helper (`_canonical_url`) used by the dedupe.
- Wire `Master-Sources.md` as the default view in the UI's curation banner — "View 73 unique sources →" rather than the file count of the section directory.
- Scaffold `validator.py` and the heuristics list. Make it runnable from the CLI first (`python -m src.curation.validator alpha-partners ChromaDB`) before plumbing the job/SSE wiring.
- Define the verdict schema and the cache file format.
- Decide on the override file format and where it lives.

The deeper lesson: the orchestrator was optimizing for "every citation gets a green checkmark" rather than "the green checkmark means something." Curation is where we re-introduce skepticism, and it has to do real work — read the page, not just the header.

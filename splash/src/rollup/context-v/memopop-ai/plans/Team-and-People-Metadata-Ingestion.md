---
title: "Team and People Metadata Ingestion"
lede: "Six phases to take any company URL → structured TeamRoster JSON the MemoPop app can render as cards. Each phase ships independently and is verifiable on its own."
date_authored_initial_draft: 2026-05-07
date_authored_current_draft: 2026-05-07
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-07
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Plan
tags: [Team-Extraction, Crawling, Firecrawl, Pydantic, LangChain, MemoPop, Implementation-Plan]
authors:
  - Michael Staton
implements_exploration: "[[Crawl-for-Better-Team-Structured-Output]]"
date_created: 2026-05-07
date_modified: 2026-05-07
from: "memopop-ai"
from_path: "context-v/plans/Team-and-People-Metadata-Ingestion.md"
---
# Team and People Metadata Ingestion

> Implements: [[Crawl-for-Better-Team-Structured-Output]]
> Touches: `apps/memopop-orchestrator/`

## Why this plan exists

Analysts spend 1–2 hours per memo assembling team-card data: name, title, headshot URL, professional socials. The orchestrator already produces team *prose* but throws away the structured intermediate. This plan adds a first-class **`TeamRoster`** artifact, sourced from a real browser crawl, with photo URLs probed for external durability and socials filtered to the professional set. The exploration doc covers tradeoffs and rationale; this doc is the build order.

## Build order, at a glance

1. **Phase 1 — Skeleton & schema.** Dep, env var, Pydantic types, empty CLI that prints help.
2. **Phase 2 — Discovery + extraction.** Walk candidate URLs, call Firecrawl `extract`, write `team-roster.json`.
3. **Phase 3 — Photo durability probe.** Mark each photo `is_externally_stable`.
4. **Phase 4 — Photo + social fallback agent.** When a photo fails or socials are missing, search.
5. **Phase 5 — Validation matrix.** Run against 5 test URLs covering known failure modes.
6. **Phase 6 — Refactor `improve_team_section.py` to consume the roster.**

Each phase is independently shippable. Stop after any phase if the next one isn't earning its keep.

---

## Phase 1 — Skeleton & schema

**Goal:** Land the dep, the env-var placeholder, the schemas, and a CLI stub that imports cleanly. No network calls yet.

**Precondition — ensure the venv exists.** The orchestrator's `.venv/` is known to disappear (see CLAUDE.md "Ongoing Troubleshooting"). Before anything else:
```bash
cd apps/memopop-orchestrator
[ -x .venv/bin/python ] || (rm -rf .venv venv && uv venv --python python3.11)
uv pip install -e .  # NOT pip — uv only
```

**Note:** `pydantic>=2.0.0` is already a declared dependency (used in `src/server/models.py`). No Pydantic install action needed.

**Actions:**

1. Add to `apps/memopop-orchestrator/pyproject.toml` under `[project] dependencies`:
   ```
   "firecrawl-py>=2.0.0",  # Web crawling for team roster extraction
   ```

2. Add to `apps/memopop-orchestrator/.env.example`:
   ```
   # Team Roster Extraction (optional — required only for cli/extract_team_roster.py)
   FIRECRAWL_API_KEY=your-firecrawl-key-here  # Get key at firecrawl.dev
   ```

3. Create `apps/memopop-orchestrator/src/schemas/team_roster.py` with the Pydantic models from the exploration doc: `SocialLinks`, `Photo`, `TeamMember`, `TeamRoster`. Use Pydantic v2 (`BaseModel`, `HttpUrl`, `model_json_schema()`).

4. Create `apps/memopop-orchestrator/cli/extract_team_roster.py` with argparse for `--url`, `--name`, `--description`, `--output-dir`, and a `--refresh` flag for skipping cache. Body: import schemas, print parsed args, exit 0. **No Firecrawl call yet.**

5. Reinstall: `cd apps/memopop-orchestrator && uv pip install -e .`

**Verify:**
- `.venv/bin/python -c "from firecrawl import Firecrawl; print('ok')"` prints `ok`.
- `.venv/bin/python -c "from src.schemas.team_roster import TeamRoster; print(TeamRoster.model_json_schema()['title'])"` prints `TeamRoster`.
- `.venv/bin/python cli/extract_team_roster.py --url https://example.com` exits 0 and echoes parsed args.
- `.env.example` has the placeholder; **no real key in any committed file**.

---

## Phase 2 — Discovery + extraction

**Goal:** From a single root URL, return a populated `TeamRoster` JSON. Photo durability and fallbacks come later.

**Actions:**

1. Create `apps/memopop-orchestrator/src/scrapers/team_roster_scraper.py`. Define a `Scraper` `Protocol` with two methods:
   ```python
   class Scraper(Protocol):
       def discover_team_pages(self, root_url: str) -> list[str]: ...
       def extract_roster(self, urls: list[str], schema: dict) -> dict: ...
   ```
   Implement `FirecrawlScraper(Scraper)` against `firecrawl-py 4.x`. Discovery is **link-graph-driven, not path-guessing** — let Firecrawl tell us what's actually linked from the site:
   - **Primary:** `firecrawl.map(root_url, search="team", limit=20)` returns URLs from the site's link graph ranked by relevance to "team". Take the top few.
   - **Secondary:** if `map` returns nothing, `firecrawl.scrape(root_url, formats=["links"])` and read the homepage's actual nav/footer links. Filter where path or anchor text contains `team|people|leadership|founders|about|who-we-are`.
   - **Last-resort fallback:** probe canonical paths (`/team`, `/about`, `/leadership`, `/people`) with HEAD requests. Only if both above are empty.
   - Return the deduplicated candidate list. Pass *all* of them into `extract_roster` — Firecrawl handles multi-URL extraction in one call.

2. Wire `cli/extract_team_roster.py`:
   - Load `.env`, fail loudly if `FIRECRAWL_API_KEY` is missing.
   - Instantiate `FirecrawlScraper`, run discovery, then `extract_roster(candidate_urls, TeamRoster.model_json_schema())`.
   - Validate the response with `TeamRoster.model_validate()`. On validation failure, save the raw response to `team-roster.raw.json` and surface the validation error.
   - Compute output dir: `output/{slug}-roster/` (separate from memo artifact dirs — rosters can be reused across memo versions).
   - Write `team-roster.json` and a markdown preview `team-roster.md` (one section per member: name as H3, title, bio, photo URL, socials list).

3. Add a `--from-memo <Company>` shortcut that reads `data/{Company}.json` for `url` and `description` so it stays consistent with the rest of the orchestrator's CLI ergonomics.

4. **Socials lookup (in-phase, not deferred to Phase 4).** A roster of names + titles + photos with empty socials is ~30% of the value. After extract, for each member with missing professional socials, run a search-by-name+title using the existing `src/agents/socials_enrichment.py` helpers (`search_for_social_profile(query, platform)` — Tavily-first, DuckDuckGo fallback). Skip per-member with `--no-enrich`. Apply the professional-only filter (no Facebook/Instagram; YouTube/TikTok only when the channel is clearly a professional/branded creator presence).

**Verify:**
- Run on a known-easy site (Astro Knots site you control or another small static site): produces `team-roster.json` with ≥3 members.
- Run on a representative VC site (e.g., `aixventures.com`): ≥1 member has a LinkedIn URL after enrichment, even if the team page didn't expose them.
- `TeamRoster.model_validate(json.load(f))` succeeds.
- No `facebook.com` or `instagram.com` URLs appear in any roster.
- The markdown preview renders without errors in any markdown viewer.

---

## Phase 3 — Photo durability probe

**Goal:** Set `Photo.is_externally_stable` correctly for every photo URL the extractor returned. Do **not** yet replace failing photos — just label them.

**Actions:**

1. Create `apps/memopop-orchestrator/src/scrapers/photo_probe.py` with `async def is_externally_stable(url: str) -> bool` per the exploration doc: HEAD with `User-Agent: MemoPop/1.0`, no Referer, no cookies; fall back to range-limited GET if HEAD is rejected; require `200` and `content-type` starting with `image/`.

2. In `cli/extract_team_roster.py`, after extraction, run probes concurrently with `asyncio.gather` (cap at 10 simultaneous). Set `member.photo.is_externally_stable` accordingly.

3. Surface the count in the CLI output: `8/12 photos externally stable`.

**Verify:**
- Pick a site whose photos are CDN-protected (most Squarespace, some Webflow): `is_externally_stable=False` on those photos.
- Pick a site with public photos: `is_externally_stable=True`.
- Probe runtime under 5 seconds for a 12-person team.

---

## Phase 4 — Photo fallback agent

**Goal:** When a photo is not externally stable, an agent runs targeted searches across durable sources and updates the roster. _(Social fallback moved into Phase 2's acceptance criteria — a roster without socials is not "extracted".)_

**Actions:**

1. Create `apps/memopop-orchestrator/src/agents/team_metadata_enrichment.py`. Reuse `socials_enrichment.py`'s `get_platform_domain` and `is_valid_profile_url` helpers — do not duplicate them.

2. **Photo fallback** priority list (try in order, accept the first that probes stable):
   - Wikipedia (`wikipedia.org`) — search `"{name}" "{title}" "{org}"`, look for an infobox image.
   - Crunchbase — only if `CRUNCHBASE_API_KEY` is set; otherwise skip.
   - Conference speaker pages — Tavily search restricted to known speaker-page hosts (TED, web summits, industry-specific).
   - GitHub avatar — only if a GitHub social was found.
   - **Public LinkedIn photo: explicitly off by default.** Add a `--allow-linkedin-photo` flag if the analyst opts in for a specific run.

3. **Social fallback** uses the existing `socials_enrichment.search_for_social_profile`. Apply the **professional filter** at the LLM layer with a clear rubric in the prompt:
   - Always include: LinkedIn, X/Twitter, Bluesky, Medium, GitHub, personal `.dev` / `.com` site.
   - Never include: Facebook, Instagram, personal email, phone.
   - Conditionally include YouTube and TikTok: include if the channel is branded around the person's professional identity AND has ≥1k subscribers OR is referenced from their LinkedIn/personal site. Skip otherwise. Log the rationale into `member.sources`.

4. Wire into `cli/extract_team_roster.py` behind a default-on `--enrich/--no-enrich` flag.

**Verify:**
- Run on a Phase 3 site that had failing photos: ≥50% of failed photos get a stable replacement, with `Photo.source` correctly populated.
- Run on a site with sparse socials (most pre-Series-A startups): the LLM successfully skips a personal Instagram and includes a professional X account.
- No Facebook/Instagram URLs appear in any `SocialLinks` field across the test set.

---

## Phase 5 — Validation matrix

**Goal:** Honest accuracy data on five representative sites before we commit to Firecrawl long-term.

**Actions:**

1. Pick five test URLs covering:
   - Static marketing site with a clean `/team` page.
   - SPA where `/team` is client-rendered.
   - Site with hot-link-protected photos.
   - Site where `/team` doesn't exist; bios live on `/about`.
   - Site behind Cloudflare bot challenge (intentionally hard).
   Record the actual URLs in `apps/memopop-orchestrator/tests/fixtures/team_roster_test_urls.yaml`.

2. For each URL, capture in a results table:
   - Did discovery find the right page?
   - Member count (extracted vs. ground truth from manual count).
   - Photo durability rate.
   - Social completeness (LinkedIn coverage; total socials per member).
   - Total runtime.
   - Total cost (Firecrawl + LLM).

3. Decide: ship Firecrawl, or invest in the Crawl4AI alternative implementation of the same `Scraper` protocol. Capture the call in a follow-up exploration or directly in the changelog.

**Verify:**
- Results table committed to `apps/memopop-orchestrator/changelog/` as part of the phase-5 ship note.
- Decision is recorded with reasoning, not just numbers.

---

## Phase 6 — Refactor `improve_team_section.py` to consume the roster

**Goal:** The prose path stops re-doing discovery. It calls `extract_team_roster` (or loads a cached roster) and runs Phase 2 (per-person deep dive) only on confirmed names.

**Actions:**

1. In `cli/improve_team_section.py`:
   - Before Phase 1, look for `output/{slug}-roster/team-roster.json`. If absent or `--refresh-roster`, invoke `extract_team_roster` programmatically.
   - Replace Phase 1's "spray and pray" Perplexity calls with the loaded roster's `members[].name` and `.title`.
   - Phase 2 (per-person Perplexity deep dives) runs unchanged but only against confirmed names.
   - Phase 3 synthesis prompt gets the structured roster passed in alongside the deep-dive results — fewer hallucinated names in the final prose.

2. The memo's `2-sections/04-team.md` no longer changes shape; the structured roster is a *parallel* artifact, not a replacement.

**Verify:**
- Run `improve_team_section.py` on a company that has a cached roster. Memo prose names match roster names exactly (no spelling drift, no extra people, no missing people).
- Citation count and prose quality are unchanged or better than the pre-refactor baseline.

---

## Done when

- [ ] `firecrawl-py` is in `pyproject.toml`; `FIRECRAWL_API_KEY` is in `.env.example`.
- [ ] `cli/extract_team_roster.py --url <root>` produces a valid `TeamRoster` JSON for any of the five validation URLs.
- [ ] Photo durability is correctly probed and labelled.
- [ ] Photo + social fallback agent fills gaps; no Facebook/Instagram leaks.
- [ ] Validation matrix is committed to a changelog entry with the Firecrawl-vs-Crawl4AI decision.
- [ ] `improve_team_section.py` consumes the roster instead of re-discovering names.

## Out of scope (for this plan)

- Stealth founders, ICs hidden from the team page (flag in `notes`, no automation).
- Automatic re-crawling on a schedule (manual `--refresh` only).
- Photo de-duplication / face-matching across sources.
- Multi-language team pages (English-only for v1).

## Notes & open questions

Carried forward from the exploration — answer as we go:

- **Roster artifact location:** Proposed `output/{slug}-roster/` (separate from memo version dirs). Confirms during Phase 2.
- **Cache invalidation:** Default 30 days; `--refresh` always re-crawls.
- **Should `find_durable_photo.py` be its own CLI?** Likely yes after Phase 4 — useful standalone for one-off fixes.
- **Confidence scoring:** `TeamMember.confidence` will need a clear rubric in Phase 4 — propose a draft in the Phase 4 PR.

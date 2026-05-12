---
title: "Crawl for Better Team Structured Output"
lede: "Building a team slide takes analysts 1–2 hours of clicking. The orchestrator already writes prose about teams; what it doesn't do is hand back the structured roster — names, titles, durable photo URLs, professional socials — that the MemoPop app needs to render cards. Here's the option space for closing that gap."
date_authored_initial_draft: 2026-05-07
date_authored_current_draft: 2026-05-07
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-07
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Exploration
tags: [Team-Extraction, Crawling, Firecrawl, Crawl4AI, LangChain, Structured-Output, Pydantic, Agent-Orchestration, MemoPop]
authors:
  - Michael Staton
image_prompt: A small grid of glowing team-card silhouettes floating above an open browser window, a stylized crawler bot threading silver lines between a company /team page and each card, social-network glyphs orbiting one card, a magnifying glass checking a photo URL for a green checkmark, deep-violet background, technical annotation labels in a monospaced font.
date_created: 2026-05-07
date_modified: 2026-05-07
from: "memopop-ai"
from_path: "context-v/explorations/Crawl-for-Better-Team-Structured-Output.md"
---
# Crawl for Better Team Structured Output

In modern memos and the decks that ride alongside them, the **team section** is rarely a bulleted list anymore. It's a row of cards — headshot, name, title, a one-liner, a couple of social glyphs. Done well it does more work than two pages of prose: it signals who the operators are, where they came from, whether they are public-facing thinkers, and whether the firm should send the deck to its co-investors as-is.

Building that row of cards is **monkey work**. An analyst clicks through a /team page, screenshots photos, opens LinkedIn in private mode to grab a clean profile URL, hunts for X/Bluesky/Medium handles, and validates that the photo URL still loads outside the company's own CDN. **One to two hours, per memo.** And it's the kind of work that LLMs *almost* do — they hand back names, sometimes titles, and a confident-but-fabricated profile URL that 404s.

This exploration walks the option space for getting the orchestrator to produce **structured, usable, app-ready** team data from any company URL: who is on the team, where their durable photo lives, and which professional social accounts are theirs.

## What we have today

There is already a team-shaped command in `apps/memopop-orchestrator/`, plus a few adjacent pieces. None of them produce structured roster output a UI could render.

- **`cli/improve_team_section.py`** — A three-phase Perplexity Sonar Pro pipeline. Phase 1 asks Perplexity to read the LinkedIn company page and the company's `/team` `/about` `/leadership` pages. Phase 2 does individual deep-dives. Phase 3 writes a memo Team section with citations. **It returns prose**, capped at six people, intended for the memo's `04-team.md`. The interim Phase 1→2 handoff briefly produces a JSON list with `name`, `title`, `linkedin_url`, `bio_snippet` — and then throws it away.
- **`src/agents/socials_enrichment.py`** — Tavily-first / DuckDuckGo-fallback search for individual social profiles. Knows about LinkedIn, X, Bluesky, Crunchbase, GitHub. Currently inlines the links into the memo prose. The matching logic and platform-domain helpers here are the right substrate to reuse.
- **`src/agents/dataroom/extractors/team_extractor.py`** — Claude + pdfplumber, structured `TeamData` / `FounderProfile` output. **Internal-document only** — pitch decks, team PDFs from a dataroom. No web crawling. The Pydantic shape here is the right place to extend.
- **`src/scrapers/research_pdf/`** — Citation scraping for research PDFs only. Not relevant here, but worth noting that "scrapers/" already exists as a package, so a new web crawler module fits the layout.

What we **don't** have:
- No browser-based crawler in the dependency tree (no Firecrawl client, no Crawl4AI, no Playwright). `httpx` + `beautifulsoup4` are present but never wired into the team flow — they wouldn't survive a JS-rendered SPA `/team` page anyway.
- No photo-URL stability check.
- No "find the team page from a root URL" discovery step. Today we hand `improve_team_section.py` a company name and trust Perplexity to figure it out.
- No structured roster artifact. Even when the system gets things right, it gets them right *in prose*.

## What we want

Inputs:
- A single URL (organization homepage, an explicit `/team` page, or anything in between).
- Optional: company name and description for disambiguation.

Outputs (the schema is the deliverable; everything else is plumbing):

```python
class SocialLinks(BaseModel):
    linkedin: HttpUrl | None = None
    x_twitter: HttpUrl | None = None
    bluesky: HttpUrl | None = None
    medium: HttpUrl | None = None
    youtube: HttpUrl | None = None       # only if "professional creator"
    tiktok: HttpUrl | None = None        # only if "professional creator"
    github: HttpUrl | None = None
    personal_site: HttpUrl | None = None

class Photo(BaseModel):
    url: HttpUrl
    source: Literal["org_site", "wikipedia", "crunchbase",
                    "conference", "github_avatar", "linkedin_public", "other"]
    is_externally_stable: bool          # passed our hot-link / referer test
    width: int | None = None
    height: int | None = None
    fetched_at: datetime

class TeamMember(BaseModel):
    name: str
    title: str
    bio_short: str | None = None        # one sentence
    bio_long: str | None = None         # paragraph
    photo: Photo | None = None
    socials: SocialLinks
    confidence: float                   # 0..1
    sources: list[HttpUrl]              # where each datum came from

class TeamRoster(BaseModel):
    organization: str
    organization_url: HttpUrl
    team_page_url: HttpUrl | None
    members: list[TeamMember]
    crawled_at: datetime
    crawler: Literal["firecrawl", "crawl4ai", "playwright"]
    notes: str | None = None
```

This is what the MemoPop app and the analyst both want. Not "a paragraph that mentions seven people."

## What gets hard

Three problems are doing most of the work here, and they're each real:

1. **Discovery.** The /team page is `/team` on 30% of sites, `/about` on another 30%, `/people`, `/leadership`, `/our-team`, `/our-people`, `/who-we-are`, `/founders`, `/company/team` on the rest. Some sites bury team in the footer of the About page. Some sites have a JS-rendered list that requires scrolling/clicking.
2. **JS-rendered DOMs.** Modern marketing sites are SPAs. `httpx.get()` returns an empty `<div id="root">`. We need a real browser.
3. **Photo URL durability.** A photo `<img src="">` on the team page is often a hot-link-protected CDN URL — works inside `theirsite.com`, returns `403` from anywhere else. The MemoPop app *will* be embedding these images on its own pages and PDFs. We need to **probe** each candidate URL with a clean Referer/cookie state and, if it fails, **fall back** to finding a public, durable image elsewhere (Wikipedia commons, conference speaker pages, public LinkedIn cover, GitHub avatar, Crunchbase).

A fourth, smaller problem: **the "professional socials" filter**. LinkedIn, X, Bluesky, Medium, GitHub, personal `.dev` sites — yes. Facebook, Instagram — no, by default. YouTube and TikTok are conditional: include them when the person is a public creator (channel branded around their professional identity, subscriber count over some threshold), exclude them when they're "their kid's dance recital" channels. This is a judgment call best made by the LLM with a clear rubric, not a hard regex.

## The four crawler options

### A. Firecrawl (hosted, schema-driven)

[Firecrawl](https://firecrawl.dev) is a hosted scraper-as-API. It renders JS, handles anti-bot, and — most importantly here — has an `/extract` endpoint that takes a JSON Schema or Pydantic schema and returns the structured data directly. It also has a `/crawl` endpoint that walks a site and a `/map` endpoint that returns a sitemap-like list of URLs.

The shape we'd write:

```python
from firecrawl import FirecrawlApp
fc = FirecrawlApp(api_key=...)
roster = fc.extract(
    urls=[f"{root}/team", f"{root}/about", f"{root}/leadership"],
    schema=TeamRoster.model_json_schema(),
    prompt="Extract every team member visible on these pages. "
           "Include their photo URL exactly as referenced in the HTML, do not paraphrase."
)
```

- **Pros:** Lowest time-to-first-result. JS rendering and schema extraction are someone else's problem. The discovery-then-extract pattern fits cleanly. Has `formats=["markdown", "html", "extract"]` so we can grab raw HTML for the photo-URL probe step.
- **Cons:** Per-page cost ($). Vendor lock-in on a critical path. The `/extract` endpoint sometimes "helps" by rewriting URLs into something it thinks is canonical — bad for photo URLs specifically. Anti-bot bypass varies site to site.
- **Cost shape:** ~$0.001–0.015 per page depending on plan and JS rendering. For a "scan 5 candidate URLs per company" workload, that's ~$0.05/run, which is rounding error in memo context.

### B. Crawl4AI (open-source, Playwright under the hood)

[Crawl4AI](https://github.com/unclecode/crawl4ai) is a Python library that wraps Playwright with crawling primitives, an LLM-driven extraction strategy, and clean markdown output. Self-hosted. Active project.

```python
from crawl4ai import AsyncWebCrawler
from crawl4ai.extraction_strategy import LLMExtractionStrategy

async with AsyncWebCrawler() as crawler:
    result = await crawler.arun(
        url=f"{root}/team",
        extraction_strategy=LLMExtractionStrategy(
            provider="anthropic/claude-sonnet-4-5",
            schema=TeamRoster.model_json_schema(),
            instruction="Extract every team member..."
        ),
    )
```

- **Pros:** Free at runtime (we still pay the LLM). Full control over the browser — we can run with auth, intercept network requests, save the rendered DOM, swap user agents. Plays well with the existing `src/scrapers/` package layout. No vendor risk.
- **Cons:** We own the operations. Playwright browsers need to be installed on whatever machine runs the orchestrator (CI, local dev, eventually whatever serverless environment we deploy to). Anti-bot is basic — for sites with Cloudflare challenges, we're stuck.
- **Cost shape:** Free + LLM tokens. For 5 pages of HTML through Sonnet 4.5, ~$0.03/run.

### C. Browserbase / Apify / ScrapingBee (hosted browsers)

The "give me a remote Chromium that doesn't get blocked" tier. Browserbase is the closest fit — you drive it with Playwright, but the browser runs on their infrastructure with anti-bot tooling already in place.

- **Pros:** Solves the hardest 5% of pages (Cloudflare, login walls, aggressive bot detection).
- **Cons:** Most expensive. Adds an extra integration and another credential to manage. Probably overkill for /team pages, which are usually marketing-grade unprotected HTML.

### D. Playwright direct

Just use Playwright. We get a browser, we walk the DOM, we write the heuristics ourselves.

- **Pros:** Zero abstraction tax. Total control.
- **Cons:** We re-implement what Crawl4AI already implements. Not a great use of time unless we have a pathological site.

## Photo-URL durability — separate sub-problem

This is a **different** problem from "scrape the team page", and it's worth saying so. Once we have a candidate `photo.url`, we run a probe:

```python
async def is_externally_stable(url: str) -> bool:
    async with httpx.AsyncClient(follow_redirects=True, timeout=10) as c:
        # No Referer, no cookies, generic UA — simulates the MemoPop app embedding the image
        r = await c.head(url, headers={"User-Agent": "MemoPop/1.0"})
        if r.status_code == 200 and r.headers.get("content-type", "").startswith("image/"):
            return True
        # Some servers reject HEAD; try a tiny GET
        r = await c.get(url, headers={"User-Agent": "MemoPop/1.0"})
        return r.status_code == 200 and r.headers.get("content-type", "").startswith("image/")
```

If it fails, the agent moves to **photo fallback search**, in priority order:

1. **Wikipedia / Wikimedia Commons** — best-case, durable forever, free to embed.
2. **Crunchbase profile photo** — durable, but needs a paid API key for the highest-res version.
3. **Public conference speaker pages** — TED, web-summit, industry-specific summits. Usually durable, often high-res.
4. **GitHub avatar** (for engineering roles) — durable, public, ~460×460 max.
5. **Public LinkedIn profile photo** — fragile and ToS-sketchy. Default off; flag as `linkedin_public` and let the analyst decide.

This logic is **independent of the crawler choice** — it sits on top.

## Recommendation

**Stand it up on Firecrawl first; abstract the scraper behind a `Protocol` so we can swap to Crawl4AI later.**

Why this order:

- Firecrawl gets us from "no command exists" to "structured roster from any URL" in roughly one prompt-iteration of work. Schema-driven extraction is exactly the affordance we need.
- The cost is small enough for the validation phase that it's not worth optimizing yet.
- Once we have a working pipeline and **honest accuracy data** on a handful of test URLs, we'll know whether the bottleneck is scraping (swap to Crawl4AI / Browserbase) or post-processing (no scraper change needed).
- A `Scraper` protocol with `discover_team_page(root_url) -> str | None` and `extract_roster(urls, schema) -> dict` keeps the swap cheap.

The two LangChain-style commands we'd land in `cli/`:

- **`cli/extract_team_roster.py`** — new. Takes `--url <root>`, optional `--name`, optional `--description`. Outputs `team-roster.json` (the Pydantic shape above) and `team-roster.md` (a human-readable preview). Standalone — does not require a memo to exist.
- **`cli/improve_team_section.py`** — existing. Refactor to *consume* the roster. Today it does discovery + research + writing in one Perplexity flow. Tomorrow it calls `extract_team_roster` first, then runs Phase 2 (per-person deep dive) only on confirmed names from the roster, then writes prose. This both **strengthens the prose path** (no more guessing names from search results) and gives us a clean place to invest in roster quality without disturbing the memo flow.

Both commands write to the same artifact directory layout the orchestrator already uses, so the MemoPop app can pick up `team-roster.json` next to `04-team.md`.

## What we'd want to validate before committing

A short list of test URLs across the failure modes, run end-to-end on each candidate scraper:

- A clean WordPress/Astro marketing site with a static `/team` page (easy mode).
- A React/Next.js SPA where /team is client-rendered (Crawl4AI / Firecrawl differentiator).
- A site with hot-link-protected photo URLs (validates the durability probe).
- A site where /team doesn't exist and bios live as cards on `/about` (validates discovery).
- A site behind Cloudflare bot challenge (where Firecrawl/Browserbase earn their cost).

If 4 of 5 succeed with Firecrawl, we ship Firecrawl and move on. If only 2 of 5 succeed, we're back here.

## Cross-references

- Existing prose-only path: `apps/memopop-orchestrator/cli/improve_team_section.py`
- Existing socials helper to reuse: `apps/memopop-orchestrator/src/agents/socials_enrichment.py`
- Existing structured-team extractor (internal docs only): `apps/memopop-orchestrator/src/agents/dataroom/extractors/team_extractor.py`
- Related: [[Moving-an-Agent-Orchestrator-to-an-API]] — the API surface that will eventually serve `team-roster.json` to the app.
- Related: [[An-Onboarding-User-Journey-for-Memopop-Native]] — the consumer of the roster on the app side.

## Open questions

- **Where does roster live in the artifact tree?** Proposed: `output/{Company}-v0.0.x/team-roster.json` alongside `2-sections/04-team.md`. Or under `2-sections/` as a sibling. Either way, it's a first-class artifact, not buried.
- **Do we cache rosters across memo versions?** Roster changes slowly; re-crawling every memo run is wasteful. Probably yes, with a `--refresh` flag.
- **Should the photo-fallback agent be its own CLI?** `cli/find_durable_photo.py "Person Name" --org "Company"` — useful even outside the team flow (e.g., manually fixing a single broken photo).
- **How do we handle people the org won't list publicly?** Stealth founders, ICs that aren't on the team page. Out of scope for v1; flag in `notes`.

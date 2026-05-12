---
title: "Add People Crawl Command to MemoPop Native"
lede: "Wire the orchestrator's `extract_team_roster` command into the MemoPop Native UI as a per-investor button — and as a batch action that runs it 5–20 times per memo, once for each co-investor in the round."
date_authored_initial_draft: 2026-05-08
date_authored_current_draft: 2026-05-08
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-08
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Plan
tags: [MemoPop-Native, Team-Extraction, Co-Investors, Batch-Workflow, API-Integration, UI-Integration, Implementation-Plan]
authors:
  - Michael Staton
implements_exploration: "[[Crawl-for-Better-Team-Structured-Output]]"
builds_on:
  - "[[Team-and-People-Metadata-Ingestion]]"
  - "[[Moving-an-Agent-Orchestrator-to-an-API]]"
  - "[[Where-Investor-Firm-Rosters-Live]]"
date_created: 2026-05-08
date_modified: 2026-05-08
from: "memopop-ai"
from_path: "context-v/plans/Add-People-Crawl-Command-to-Memopop-Native.md"
---
# Add People Crawl Command to MemoPop Native

> **Future-you orientation.** You don't remember any of the work that built this. Read this top-to-bottom and you'll know: what the command is, where it lives, how to invoke it, what it returns, why we need a button for it in MemoPop Native, and what's still unresolved.

## What this is

A standalone Python CLI lives in `apps/memopop-orchestrator/cli/extract_team_roster.py`. Given any organization URL, it returns a structured **team roster** — names, titles, photo URLs, and professional social profiles — as a validated JSON artifact. It uses [Firecrawl](https://firecrawl.dev) for both page crawling and people-search.

The command exists. **What's missing is making it routine** for analysts inside MemoPop Native, where the natural use is *not once-per-memo* but *5–20 times per memo* — once for the company being analyzed, then once for every co-investor in the round.

## The use case in one paragraph

A VC analyst writes a memo on Company X. Company X is raising a round with five named co-investors. The memo and the deck need a "Team" section for X (people who run the company) and an "Investors" section that's increasingly card-shaped — partner photos, LinkedIn links, AUM, prior exits. Today an analyst clicks through six websites by hand. Tomorrow they click one button per investor (or one batch button), wait ~30 seconds each, and the memo gets six structured rosters back. **Hours of monkey work disappear.** This is the high-leverage move; everything below is plumbing.

## Where things live right now

| Thing | Path |
| --- | --- |
| CLI entry point | `apps/memopop-orchestrator/cli/extract_team_roster.py` |
| Pydantic schemas (`TeamRoster`, `TeamMember`, `Photo`, `SocialLinks`) | `apps/memopop-orchestrator/src/schemas/team_roster.py` |
| Firecrawl scraper + discovery logic | `apps/memopop-orchestrator/src/scrapers/team_roster_scraper.py` |
| Socials enrichment via search | `apps/memopop-orchestrator/src/agents/team_roster_enrichment.py` |
| Required env var (in `.env`, not committed) | `FIRECRAWL_API_KEY` |
| Default output directory | `apps/memopop-orchestrator/output/{slug}-roster/` |

If you're picking this up cold and any of those files are missing, the implementation has been moved or rewritten — check git log on `apps/memopop-orchestrator/` before assuming it's broken.

## How to invoke the command (CLI today)

The orchestrator uses `uv` for dep management, **never `pip`**. Activate the venv first or call `.venv/bin/python` directly.

```bash
# From apps/memopop-orchestrator/
.venv/bin/python cli/extract_team_roster.py --url https://www.aixventures.com/ --name "AIX Ventures"
```

### Required (one of)
- `--url <root_url>` — Organization homepage. Discovery walks the link graph from here.
- `--from-memo <Company>` — Reads `url`, `name`, `description` from `data/{Company}.json` (the orchestrator's existing tenant-data convention).

### Optional flags
- `--name <str>` — Org name for disambiguation in social search queries. Defaults to the URL if omitted.
- `--description <str>` — One-line org description, also used for disambiguation.
- `--output-dir <path>` — Override the default `output/{slug}-roster/` location.
- `--refresh` — Ignore cached `team-roster.json` and re-crawl. **Default behavior is to skip if a roster already exists for this slug** — important so a batch of 20 calls doesn't burn credits re-crawling unchanged firms.
- `--no-enrich` — Skip the socials-via-search pass. Use when you only need names+titles+photos quickly, or when you've hit a Firecrawl quota and want extraction-only.
- `--allow-linkedin-photo` — Permit public LinkedIn photos as a fallback source. Off by default; treat as opt-in per run.
- `--dry-run` — Run discovery only; print candidate URLs without calling extract. Use for "is this URL going to work" sanity checks.

### What the command does (semantics, not code)

1. **Discovery** — three channels in parallel, results unioned and scored:
   - `firecrawl.map(root, search="team")` — ranked URLs from the site's link graph.
   - HEAD-probes a handful of canonical paths (`/team`, `/people`, `/leadership`, `/about`, ...).
   - The root URL itself, low-priority — for sites where the team is on the homepage.
2. **Extraction** — one `firecrawl.extract` call over the deduplicated top candidates with a hand-written flat JSON schema.
3. **Validation** — strict Pydantic v2 validation. Empty-string URLs are coerced to None; LinkedIn `/posts/<handle>_...` URLs are canonicalized to `/in/<handle>`.
4. **Socials enrichment** — for each member missing professional socials, one `firecrawl.search` query by name + organization. Results dispatched by domain. **Anchored URL regexes** per platform reject post/status URLs; **a name-handle overlap check** rejects URLs whose handle has no token in common with the member's name. Skip with `--no-enrich`.
5. **Output** — three files written to the output directory.

## What the output looks like

Three files per call. The canonical one is `team-roster.json`:

```
output/{slug}-roster/
├── team-roster.json       # canonical, Pydantic-validated, this is what consumers load
├── team-roster.md         # human-readable preview, for eyeballing in an editor
└── team-roster.raw.json   # Firecrawl's pre-validation payload, debug-only
```

The `TeamRoster` JSON shape (full schema in `src/schemas/team_roster.py`):

```jsonc
{
  "organization": "AIX Ventures",
  "organization_url": "https://www.aixventures.com/",
  "team_page_url": "https://www.aixventures.com/team",
  "members": [
    {
      "name": "Richard Socher",
      "title": "Co-Founder & Managing Partner",
      "bio_short": "...",
      "photo": {
        "url": "https://...",
        "source": "org_site",
        "is_externally_stable": false,    // populated by Phase 3, see below
        "fetched_at": null
      },
      "socials": {
        "linkedin": "https://www.linkedin.com/in/richardsocher",
        "x_twitter": null,
        "bluesky": null,
        "medium": null,
        "youtube": null,
        "tiktok": null,
        "github": null,
        "personal_site": null
      },
      "confidence": 0.0,
      "sources": []
    }
  ],
  "crawled_at": "2026-05-08T04:57:50.257108+00:00",
  "crawler": "firecrawl",
  "notes": null
}
```

**Two known limitations of the current output**, both deliberate, both flagged for follow-up plans:

- `photo.is_externally_stable` is always `false` until Phase 3 of [[Team-and-People-Metadata-Ingestion]] lands the durability probe. Don't trust this flag yet — assume any photo URL on a third-party CDN may 403 when embedded elsewhere.
- Socials coverage tops out around **60–70% of members** with composite search alone. The roster is *correct* but not *complete*. Expanding to per-platform `site:linkedin.com/in/` follow-up searches would push coverage up to ~90% at 4× the credit cost. Decision deferred.

## What we want in MemoPop Native

The native UI today has no team-roster button. **Add one.** Two surfaces matter:

### 1. Single-roster button — on the deal page

Where: in the deal's "Team" section header, and again in the deal's "Investors" / "Cap Table" section header. Same component, two locations.

```
┌────────────────────────────────────────────────┐
│  Team                          [↻ Pull roster] │
├────────────────────────────────────────────────┤
│  (existing team cards, or empty state)         │
└────────────────────────────────────────────────┘
```

Click → modal with:
- URL field (pre-filled if the deal record has one).
- Optional: name, description.
- Toggle: enrich socials (default on).
- Toggle: refresh cache (default off).
- "Run" button.

While running: progress strip with the current phase ("Discovering pages → Extracting roster → Searching socials"). Each phase is a real API event the backend should emit.

On completion: insert/replace cards in the section. Show a small "Last crawled: 2 days ago" pill that doubles as the re-run trigger.

### 2. Batch action — for co-investors in the round

This is the **load-bearing** UX. A round has 5–20 named co-investors. The analyst should be able to:

1. Paste or import a list of investor URLs (or pick from the deal's existing investor records).
2. Click "Pull rosters for all" once.
3. Watch a per-investor status panel: queued / running / done / failed.
4. See partial results stream in as each call completes — don't block on the slowest one.

```
┌─────────────────────────────────────────────┐
│  Co-investors (8)            [+ Add]        │
├─────────────────────────────────────────────┤
│  ✓ AIX Ventures        14 people            │
│  ✓ Lightspeed          8 people             │
│  ⟳ Sequoia             discovering...       │
│  ⟳ Index Ventures      extracting (3 urls)  │
│  ◯ Founders Fund       queued               │
│  ◯ a16z                queued               │
│  ✗ StealthCo VC        no team page found   │
└─────────────────────────────────────────────┘
```

Failures are normal (small VCs without team pages, behind-Cloudflare sites). The batch should never hard-fail — show what we got, let the analyst retry the misses individually.

**Concurrency cap: 3–5 in flight at once.** Firecrawl has per-account rate limits and our own free tier is 1k requests/month; running 20 calls in parallel will both rate-limit and burn through quota fast. The backend should enforce the cap, not the UI.

## The API contract MemoPop Native should hit

Today the orchestrator only has a CLI. Spawning a Python subprocess from the native app works for v0 but is fragile (no structured progress, no cancellation, no auth). The right shape is a real HTTP API — see [[Moving-an-Agent-Orchestrator-to-an-API]] for the broader plan.

### Recommended endpoints

```
POST /api/team-rosters
  body: { url, name?, description?, refresh?: bool, enrich?: bool, allow_linkedin_photo?: bool }
  returns: { job_id, status: "queued" }

GET /api/team-rosters/{job_id}
  returns: { status: "queued" | "running" | "done" | "failed",
             phase?: "discover" | "extract" | "enrich",
             progress?: { discovered: 3, extracted: 14, enriched: 9 },
             error?: string,
             roster?: TeamRoster }   // present when status === "done"

GET /api/team-rosters/{job_id}/events  (SSE stream)
  events: phase-changes, per-member updates as enrichment completes

POST /api/team-rosters/batch
  body: { items: [{url, name?, description?, ...}, ...] }
  returns: { batch_id, jobs: [{job_id, url}, ...] }
```

The orchestrator already has `fastapi`, `uvicorn`, and `sse-starlette` in `pyproject.toml`, plus an `src/server/` package and a `memopop-server` script entry. The endpoints belong there. **Do not** add them to the CLI — the CLI stays the canonical local-dev surface.

### Where the JSON should land

Two options. Pick one, write it down here when you do:

- **Inline only**: API returns `TeamRoster` JSON directly, app stores it in MemoPop Native's own database. No file artifacts in the orchestrator's `output/` tree at all when called via API.
- **Inline + tenant-aware persistence**: API returns the JSON *and* writes the artifact bundle (`team-roster.json` + `.md` + `.raw.json`) to a tenant-aware path the orchestrator already understands. Path shape unresolved — see [[Where-Investor-Firm-Rosters-Live]].

The "write to disk" option is more useful when MemoPop is one of multiple consumers (the memo orchestrator itself wants to load these rosters). The "inline only" option is simpler and avoids the firm-vs-deal duplication question. **Default to inline-only until proven wrong.**

## Cost shape & rate limits

Per call (single roster, current implementation):
- 1× `firecrawl.map(search="team")` — ~1 credit
- 4× HTTP HEADs to canonical paths — free, our own egress
- 1× `firecrawl.extract` over 3 candidate URLs — ~3 credits
- N× `firecrawl.search` (one per member, typical N = 5–15) — ~5–15 credits
- **Total: ~10–20 Firecrawl credits per call.**

A "5–20 investors per memo" workload at 15 credits average:
- 5 investors → 75 credits per memo
- 20 investors → 300 credits per memo

Firecrawl free tier (1k credits/month, current as of 2026-05) supports **3–13 memos/month** at this cost shape. Plan to upgrade once batch usage starts; the analyst-hours saved per memo dwarf the API spend at any sane plan.

## Output management for the batch case

Open question, deliberately not answered here. See [[Where-Investor-Firm-Rosters-Live]].

The short version: an investor firm roster (e.g., AIX Ventures) is a fact about the firm, but it's first generated as part of due diligence on a specific deal. Filing it under the deal duplicates it across every deal that firm participates in, and copies drift the moment one is re-crawled. Filing it globally under the firm loses point-in-time context for the memo it backed.

The current convention is **per-deal**: each roster is filed under the deal that triggered the fetch, e.g., `<orchestrator>/io/<tenant>/deals/<deal>/outputs/<firm-slug>-roster/`. This works for now. The duplication problem becomes concrete the second time we file the same investor's roster — at that point this question must be resolved before the batch action ships, otherwise the UI will be writing duplicate data into multiple deal trees with no plan for keeping them in sync.

## Open questions to resolve before building the UI

- **Do we persist rosters server-side at all, or just return JSON?** (See "Where the JSON should land" above.)
- **What's the deduplication story for the same investor across multiple deals?** ([[Where-Investor-Firm-Rosters-Live]].)
- **Does the orchestrator's API surface ship as a sidecar to MemoPop Native, or as a separate hosted service?** ([[Moving-an-Agent-Orchestrator-to-an-API]] — answer this before designing the auth model.)
- **Cancellation:** if the analyst closes the modal mid-crawl, do we kill the Firecrawl call or let it complete and cache? (Recommend: let it complete, results land in cache, refund credits is impossible anyway.)
- **Editing rosters:** does the analyst ever hand-correct a name or social URL in the UI? If yes, the schema needs a `manually_edited: true` flag and the persistence layer needs to handle merge-on-refresh.
- **Photo durability:** the `is_externally_stable` flag is hard-`false` today. Do we block UI rendering of un-probed photos (safer, slower) or render-and-pray (faster, occasional broken images)? Resolve when Phase 3 of [[Team-and-People-Metadata-Ingestion]] lands.

## Done when

- [ ] Backend exposes `POST /api/team-rosters`, `GET /api/team-rosters/{id}`, and the SSE events endpoint.
- [ ] Backend exposes the batch endpoint with concurrency cap.
- [ ] MemoPop Native has a "Pull roster" button on each of the two surfaces (Team section, Investors section).
- [ ] MemoPop Native has a batch panel for co-investors with per-row status, partial results streaming in.
- [ ] At least one real memo has been written end-to-end using the batch action — analyst confirms it saved them ≥1 hour vs. manual research.

## Cross-references

- [[Crawl-for-Better-Team-Structured-Output]] — the original exploration that motivated the command.
- [[Team-and-People-Metadata-Ingestion]] — the build plan for the command itself, including the deferred Phase 3 (photo durability) and Phase 5 (validation matrix).
- [[Moving-an-Agent-Orchestrator-to-an-API]] — the API surface this plan assumes.
- [[Where-Investor-Firm-Rosters-Live]] — the unresolved deal-vs-firm artifact question that must be answered before batch persistence ships.

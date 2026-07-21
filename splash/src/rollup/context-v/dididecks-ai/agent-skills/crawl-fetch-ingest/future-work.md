---
name: crawl-fetch-ingest-future-work
description: Known v1 limitations and planned extensions for the crawl-fetch-ingest skill
from: "dididecks-ai"
from_path: "context-v/agent-skills/crawl-fetch-ingest/future-work.md"
---
# Future Work

Things deliberately not in v1, captured so they don't get lost.

## PDF OCR (image-only decks)

**v1 behavior:** assumes the input PDF has a text layer. Image-only decks (scanned, exported-as-images) won't yield names/titles via straight extraction.

**Status:** **already solved in `memopop-orchestrator`.** When the need arises, port the OCR pipeline from there rather than reinventing.

**Where to look:** `memopop-orchestrator` repo (likely Python, possibly `pytesseract` + `pdfplumber` + `pdf2image`, in a `.venv`). Confirm the exact stack at port time.

**Integration shape (when ported):** add a `scripts/pdf-ocr.{ts,py}` step that runs *before* the discovery phase, producing a text-layered PDF or a markdown transcript that the rest of the pipeline consumes. Keep the OCR step optional — most VC decks have a text layer.

## Brandfetch (SVG logos + brand kits) — DONE in v2 (2026-05-10)

**v2 behavior:** Brandfetch is tier 4 of the logo cascade in `SKILL.md`. `scripts/brandfetch.ts` reads `BRANDFETCH_API_KEY` from `~/.secrets` and exposes three modes:

```bash
./brandfetch.ts stripe.com                              # full JSON response
./brandfetch.ts stripe.com --best-svg                   # one-line URL or exit 3
./brandfetch.ts stripe.com --best-raster                # one-line URL or exit 3
./brandfetch.ts stripe.com --cache-dir <path>           # cache by domain
```

`pickBestSvg` prioritizes `type=logo + theme=light` with transparent background. Free tier: 1k req/mo.

## Background-strip pipeline — DONE in v2 (2026-05-10)

**v2 behavior:** `scripts/bg-strip.sh` runs ImageMagick flood-fill from each corner (sampling the corner color, so it works on white *and* arbitrary brand-color backgrounds). Falls back to `rembg` (U²-Net) when flood-fill removes <5% of pixels — caller is expected to install rembg via `pipx install rembg[cli]` for the tier-2 fallback.

Outputs JSON like:

```json
{"method":"imagemagick-floodfill","bg_color":"#ffffff","pct_transparent":94.4,"output":"./logo.png"}
```

The CP3 portfolio fetch loop should call this automatically after every raster download, then write `logo_bg_stripped`, `logo_bg_strip_method`, and `logo_bg_color_detected` into the company's frontmatter.

## Inline SVG hunt — DONE in v2 (2026-05-10)

**v2 behavior:** `scripts/logo-hunt.sh` runs tiers 1–3 of the cascade locally (no paid APIs):
1. Inline `<svg>` from the homepage's nav/header
2. Common SVG paths + any `.svg` URLs scraped from the homepage HTML
3. Brand / press / media pages

Returns JSON like `{"tier":"site-svg-path","url":"https://..."}` or exits 2 if all three local tiers miss — caller then escalates to `brandfetch.ts` (tier 4), Tavily site-search (tier 5), or Google CSE (tier 6, still future).

## Google CSE `fileType=svg` (last-resort SVG search)

**v1 behavior:** not implemented.

**Future:** add `scripts/google-cse.ts` reading `GOOGLE_CSE_KEY` + `GOOGLE_CSE_CX` from `~/.secrets`. Use `fileType=svg` parameter. Free quota: 100 queries/day. Only worth the wiring when Brandfetch + Tavily site-search both miss frequently.

## Crunchbase API (vs. scraping)

**v1 behavior:** Tavily search → Firecrawl on the public Crunchbase page. Limited data (Crunchbase paywalls).

**Future:** if the team subscribes to Crunchbase API, add `scripts/crunchbase.ts`. Until then, public-page scraping is fine.

## Site adapters (mpstaton-site, fullstack-vc, hypernova-site, memopop-ai)

**v1 behavior:** the skill writes only to `<cwd>/data/firms/{firm-slug}/`. Wiring into a specific site's content collection is manual.

**Future:** per-site adapter scripts that read `data/firms/{firm-slug}/` and write to the site's content collection format. One adapter per site, lives *in the site's repo*, not in this skill (because each site's schema is different).

## Confidence-driven re-fetch

**v1 behavior:** files marked `confidence: low` or `flagged` need manual review.

**Future:** a `--retry-flagged` mode that re-runs only the flagged entities with a different cascade order (e.g., escalate to Firecrawl extraction with a stricter schema, or try alternate query phrasings in Tavily).

## Preview UI

**v1 behavior:** the user reviews `.md` files in their editor.

**Future:** a small Astro page (in `design-system-viewer` style) that renders `data/firms/{firm-slug}/` as a browsable preview — see all team members with headshots, all portfolio companies with logos, flag-status badges. Helps the human review pass go faster.

## Source-of-truth de-duplication

**v1 behavior:** each firm has its own copy of every entity. If Alfred Lin appears under both Sequoia and another firm we work with, two separate `team/alfred-lin.md` files exist.

**Future:** optional `~/.claude/skills/crawl-fetch-ingest/people/{global-slug}.md` index that firm-level files reference — so updating LinkedIn URL once propagates. Only worth building when the user has 3+ firms and the duplication starts costing time.

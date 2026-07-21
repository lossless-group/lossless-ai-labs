---
name: crawl-fetch-ingest
description: The Lossless Group's workflow for filling in team and portfolio metadata for VC firms and the operating companies they back — crawl a firm's site, fetch structured data + brand assets for people and companies referenced in a deck/PDF, ingest as canonical .md files with YAML frontmatter. Supports two starting anchors — firm-anchored (one VC → its team → its portfolio → portco CEOs) and company-anchored (one operating company → its backer firms → each backer's team + portfolio, stopping there) — for credibility-card use. Use whenever you need to recreate VC team pages, advisor sections, or portfolio company sections in HTML/Tailwind/Reveal slideshows; whenever the input is "here's a PDF and/or a firm URL, fill in the people and companies"; whenever you need headshots, LinkedIn URLs, company logos (SVG preferred), CEO metadata; whenever you need to "ingest our backers" or "make these investors legible to readers"; whenever the user mentions "fill out the team", "find the headshots", "credibility ingest", "we need their portfolio companies", or names this skill directly. Encodes the four-checkpoint cascade (VC team → advisors → portfolio companies → portco CEOs), the cross-tool fallback pattern (Firecrawl → Tavily → OpenGraph.io), the global-cache-per-firm convention so the same firm's data is reused across multiple decks/memos, and the loose canonical schema that sites converge toward on refactor (not enforced on ingest).
from: "dididecks-ai"
from_path: "context-v/agent-skills/crawl-fetch-ingest/SKILL.md"
---
# Crawl, Fetch, Ingest

> Given a deck PDF and/or a firm URL, fill in the team and portfolio metadata so a designer can drop it into HTML/Tailwind/Reveal slides without hand-collecting every headshot, title, and logo.

## When to use this skill

- Recreating a VC firm's team / advisor / portfolio sections for a redesigned deck or web presentation
- Filling team metadata for an investment memo, fund one-pager, or fundraise deck
- Asset hunt: SVG logos, favicons, headshots, LinkedIn URLs for people who appear in a PDF or on a firm's site
- Any "here's a PDF, give me a clean dataset of who's in it" task at the org/portfolio level
- Any 2nd / 3rd-order crawl: VC firm → portfolio companies → those companies' CEOs
- Credibility ingest for an operating company's fundraise — walk outward through its **backers** to make those firms legible to readers starting from near-zero context

## Anchor types — two starting points, same cascade

The skill supports two starting anchors. Both are first-class. They share the same fetch cascade (Jina / Firecrawl / OpenGraph.io / Brandfetch / SVG-tier fallback / bg-strip) and the same schema. Only the **entry point and stop condition** differ.

```
Anchor: VC firm                        Anchor: Operating company
 → team                                  → list of backer firms
 → portfolio cos                         → for each backer:
   → portco CEOs                             → team
                                              → portfolio cos
                                          (stop — no portco CEOs)
```

**Firm-anchored** (the original walk): one VC firm is the root. Used when you're rebuilding a firm's own deck, memo, or website. See `## The four checkpoints` below.

**Company-anchored** (credibility-card walk): one operating company is the root, and we walk outward through its named backers. Used when an operating company's deck/site needs to make its investor list legible to readers who don't know those firms. The traversal stops at the backers' portfolio companies — portco CEOs add no legibility at credibility-card distance. See `routines/investor-credibility-ingest.md`.

Both walks can run inside the same project. A typical fundraise repo ends up with:

```
<project>/data/
  team/                  # the operating company's own employees (company-anchored, CP1-only)
  investors/             # backer firms (investor-credibility-ingest routine)
    {firm-a}/firm.md + team/ + portfolio/
  firms/                 # if the project also did the firm-anchored walk on some specific VC
    {firm}/firm.md + team/ + portfolio/ + portco-ceos/
```

## Inputs (improvise with as little as possible)

The skill should accept any of:

- **PDF only** — extract names, titles, role labels, company logos visually present; infer firm context from cover/footer; ask user to confirm the firm before fetching
- **URL only** — treat as the firm's homepage; discover `/team`, `/portfolio`, `/about` from sitemap or anchor crawl; build entity roster from the site
- **PDF + URL** — best case; PDF defines *who's in the deck* (the authoritative list), URL drives discovery and asset-fetch

If only a name is given (e.g., "fill out Sequoia Capital"), search for the homepage with Tavily, confirm with user, then proceed as URL-only.

## Output layout

Per-project content + assets land here:

```
<cwd>/data/firms/{firm-slug}/
  firm.md                       # firm-level metadata
  team/{person-slug}.md         # CP1 (VC team) + CP2 (advisors) outputs
  team/{person-slug}.{jpg|png}  # headshot
  portfolio/{co-slug}.md        # CP3 output
  portfolio/{co-slug}.svg       # logo (svg preferred, png/jpg fallback)
  portfolio/{co-slug}-ceo.md    # CP4 output (CEO of that portco)
  portfolio/{co-slug}-ceo.{jpg|png}
```

Raw API responses are cached globally so the same firm's data is reused across decks/memos:

```
~/.claude/skills/crawl-fetch-ingest/cache/{firm-slug}/
  firecrawl/{url-hash}.json
  tavily/{query-hash}.json
  og/{url-hash}.json
```

Cache lookup is the first step before any paid call. Delete the firm's cache folder to force re-fetch.

## The four checkpoints

Each checkpoint is a **human-confirmation gate**. Run discovery, present the roster/list to the user, wait for "go" before paid fetches.

### CP1 — Everyone on the firm's own site

**Goal:** match deck names to firm-site bios; enrich with LinkedIn and other public profiles.

**Important:** firms scatter their people across **multiple sub-pages by role**, not just one `/team` page. A pure `/team` crawl misses venture partners, operating partners, EIRs, supporting partners, and the advisory board — all of whom may appear in the deck. CP1 must enumerate **all** of the firm's people-bearing pages, then categorize each person into the right `role_class`.

**Page-discovery cascade.** Try each path; treat 404 / missing-link as "this firm doesn't use that section." Keep going.

| Path family | Maps to `role_class` | Common path variants |
|---|---|---|
| Core team | `vc-team`, `managing-partner` (top of list usually) | `/team`, `/people`, `/who-we-are`, `/about/team` |
| Venture partners | `venture-partner` | `/venture-partners`, `/partners`, `/team#venture` |
| Operating partners | `operating-partner` | `/operating-partners`, `/platform`, `/team#operating` |
| Entrepreneurs in residence | `entrepreneur-in-residence` | `/eir`, `/residents`, `/entrepreneurs-in-residence` |
| Supporting partners / mentors | `supporting-partner` | `/support`, `/supporting-partners`, `/mentors`, `/community`, `/network` |
| Advisory board / LPAC | `advisor` | A separate section on `/team`, or dedicated `/lpac`, `/advisors`, `/board` pages |

For paths that paginate (e.g., `/support?page=2`), iterate until an empty page or a `Load more` button stops appearing.

**Per-person fetch cascade.** For each person discovered above:

1. **Jina Reader** the bio sub-page (`/team/{slug}`, `/supporting-partners/{slug}`, etc.) → markdown.
2. If the markdown is thin or missing structured fields, escalate to **Firecrawl** with a `{name, title, bio, headshot, profile_links}[]` extraction schema.
3. **Cross-reference** with deck names (if PDF was provided). Names that match a deck entry get priority + the deck's role-label preserved in `deck_role_label`.
4. **OpenGraph.io** on each linked profile URL to pull a higher-quality `og:image` headshot when the firm site's `<img>` is small.
5. For raw HTML scraping, the headshot is usually in `<meta property="og:image">` — but some firms (e.g., Webflow sites) put it in `background-image:url(...)` on a sibling `<div>`. Check both.
6. **Firecrawl** each person's LinkedIn URL (LinkedIn is JS-gated; Jina Reader usually returns thin content).

**Output:** `team/{person-slug}.md` with the appropriate `role_class` (see `schema/person.md` for the full list of 9 recognized values + disambiguation tips). All people from the firm's site go in `team/`, regardless of role_class — the file location stays uniform; the `role_class` field carries the meaning.

**Note on terminology mapping.** Firms use idiosyncratic labels — Calm/Storm calls their founder-mentor ecosystem "Supporting Partners," Sequoia calls it "Scouts," Bessemer has "Operating Advisors." Pick the closest matching `role_class` from the schema; preserve the firm's literal label in `deck_role_label` and `title`. Don't spawn new role_classes for one-off labels.

### CP2 — People in the deck NOT found on the firm's site

**Goal:** people named in the deck who didn't match anywhere in CP1's expanded discovery (any sub-page, any role). Resolve them via search.

If you've already broadened CP1 to cover all the role-bearing sub-pages above, CP2 will be smaller than it used to be — many "advisors" turn out to live on the firm's `/support` or `/lpac` page and get caught in CP1. CP2 is now genuinely "people the firm doesn't list publicly" — usually external advisors, occasional collaborators, or people the deck mentions by reputation.

**Cascade:**
1. **Tavily search** with query like `"{Name}" "{Firm Name}" advisor` or `"{Name}" "{Title from deck}"`
2. **Jina Reader** the top result for non-LinkedIn pages (personal site, news article, board-of-directors page)
3. **Firecrawl** for LinkedIn profiles (Jina Reader is thin on LinkedIn)
4. **OpenGraph.io** on the resolved profile URL for headshot
5. If no high-confidence match, write the file with `status: flagged` and `confidence: low` — never skip silently

**Output:** `team/{person-slug}.md` with `role_class: advisor` (if the deck's role label suggests a formal advisory/governance role) or `external` (if no clear category). Role-label hint from the deck preserved in `deck_role_label`.

### CP3 — Portfolio companies in the deck

**Goal:** for each company referenced in the deck, gather profile metadata + brand assets.

**Principle: match the asset role to the render context.** A single "the logo" doesn't exist — every company has multiple brand assets at different aspect ratios for different uses. Fetching just one and forcing it everywhere produces bad layouts (a horizontal wordmark squeezed into a square chip becomes invisible-tiny-text; a square favicon stretched to a wide header looks pixelated). The skill captures **three asset roles per company by default**, then the rendering layer picks whichever fits the slot:

| Role | Aspect ratio | Use case | Fetch helper |
|---|---|---|---|
| `trademark` (or `wordmark` + `appIcon`) | wide / horizontal | inline header, wordmark display, hero ribbon | `scripts/logo-hunt.sh` + `scripts/brandfetch.ts` |
| `favicon` | square (1:1) | small chip, tile, list-row icon, OS app icon | `scripts/favicon-hunt.sh` |
| `og:image` (URL only, no download by default) | 1.91:1 social card | portfolio detail-page hero, deck banner, social share preview | `scripts/og-image-hunt.sh` |

The CP3 fetch loop should run all three for every portfolio company — they're cheap, they hit different paths on the company site, and they cover the most common rendering contexts a downstream deck/site will need.

**Cascade:**
1. **Jina Reader** the firm's `/portfolio` (or `/companies`, `/investments`) → markdown
2. If structured fields needed, **Firecrawl** with `{name, website, sector, stage, description}[]` schema
3. **Cross-reference** with logos visually present in the deck PDF (often the deck has 6–12 portfolio logos on a "selected investments" slide)
4. **Tavily search** to fill in any company named in the deck but not on the firm's portfolio page
5. **OpenGraph.io** on each company homepage for favicon + `og:image` + description
6. **Crunchbase / LinkedIn** discovery via Tavily (`"{Co} crunchbase"`, `"{Co} linkedin"`) — fetch via Firecrawl (both are JS-gated)

**Trademark / wordmark cascade.** SVG quality matters: rasters cause three recurring problems in slide / card layouts — opaque backgrounds that clash with surfaces, low-resolution that pixelates when scaled, and inconsistent margin-to-glyph ratio across brands so logos in the same-size container look visually uneven. Always try harder for an SVG before settling for a raster.

Run the cascade in this order, stopping at the first SVG (or first usable raster on the final tier). Record `asset_strategy` in the company's frontmatter.

1. **Inline `<svg>` scrape** — fetch the company homepage HTML, look for `<svg>` elements inside `<header>` / `<nav>` / `[class*="logo"]`. Many modern sites inline the nav logo as SVG. If found, extract and serialize.
2. **Site SVG paths** — try in order: `/logo.svg`, `/assets/logo.svg`, `/img/logo.svg`, `/static/logo.svg`, `/images/logo.svg`, `/brand/logo.svg`, `/favicon.svg`, `/apple-touch-icon.svg`. Also upgrade any `<img src="...png">` in the nav to `.svg` and try.
3. **Brand / press kit pages** — fetch `/brand`, `/press`, `/media`, `/kit`, `/brand-assets`, `/about/press`, `/company/brand`, `/legal/brand`. These pages often link to a downloadable SVG explicitly. Jina Reader the page; grep for `.svg`.
4. **Brandfetch API** (if `BRANDFETCH_API_KEY` is set) — `https://api.brandfetch.io/v2/brands/{domain}` returns brand assets keyed by format. Prefer `format=svg`. Free tier: 1k req/mo. See `scripts/brandfetch.ts` (when added).
5. **Tavily site-search across SVG repos** — query `"{Co} logo svg" site:worldvectorlogo.com OR site:seeklogo.com OR site:vectorlogo.zone OR site:wikimedia.org OR site:upload.wikimedia.org`. These are SVG-first directories; a hit is usually clean.
6. **Google Custom Search with `fileType=svg`** (last resort, costs money) — only if you have `GOOGLE_CSE_KEY` + `GOOGLE_CSE_CX` in `~/.secrets`. Returns top URLs; download and validate it's actually an SVG.
7. **Raster fallback + background strip** — if all SVG paths fail: fetch the best raster (Brandfetch PNG > OpenGraph.io og:image > favicon), then run `scripts/bg-strip.sh` to remove the background. Set `logo_bg_stripped: true` and `asset_strategy: site-raster-stripped` (or whichever tier).

**SVG validation** — after fetching anything claiming to be SVG: file must contain `<svg`, have a `viewBox` or `width`/`height`, and be > 200 bytes (filters out 1×1 tracking pixels). Strip embedded `<script>` tags for safety.

**Background-strip rule for rasters** — sample the four corner pixels: if they're a uniform color (all same RGB within ~5%) and not already transparent, run `scripts/bg-strip.sh` automatically. The script does ImageMagick flood-fill from each corner first (fast, deterministic, ~70% of cases); falls back to `rembg` (U²-Net model) for non-uniform / soft-edge backgrounds if installed.

**Favicon cascade** (separate from the trademark cascade — runs in parallel):

1. `<link rel="apple-touch-icon" href="...">` from the homepage HTML — 180×180 polished square, designed for tile rendering. **Best tier** for chip/grid displays.
2. `<link rel="icon" href="...">` from homepage HTML — any size; biggest preferred.
3. Common paths: `/apple-touch-icon.png`, `/apple-touch-icon-precomposed.png`, then `/favicon.svg`, `/favicon-32x32.png`, `/favicon.png`, `/favicon.ico`.
4. PWA manifest icons via `<link rel="manifest">`.
5. **Google S2 favicon service** (`https://www.google.com/s2/favicons?domain={d}&sz=128`) — last-resort fallback that almost always returns *something* for resolvable domains.

Run via `scripts/favicon-hunt.sh <domain>` — returns JSON with `tier`, `url`, `format`. ICO outputs need converting to PNG before use in pipelines that don't accept ICO (Astro's `<Image>`, etc.) — use `magick "ico:input.ico" -resize 256x256\> output.png`.

**OG-image cascade** (URL only, no download by default):

1. `<meta property="og:image">` from homepage
2. `<meta property="og:image:url">`
3. `<meta name="twitter:image">`
4. `<meta name="twitter:image:src">`

Run via `scripts/og-image-hunt.sh <domain>` — captures a URL into the company's `og_image_url` frontmatter field. The URL is preserved for downstream consumers (a deck might pull it in for a hero slide; a portfolio detail page might use it as a banner). No bytes downloaded by default.

**Output:** `portfolio/{co-slug}.md`. Brand assets use the role-prefixed convention:

- Default trademark: `portfolio/trademark__{Company-Name}.svg` (or `.png` fallback with alpha guaranteed if bg-strip ran)
- When the brand has BOTH a wordmark and a separate icon: `portfolio/wordmark__{Company-Name}.svg` + `portfolio/appIcon__{Company-Name}.svg`
- Always: `portfolio/favicon__{Company-Name}.{svg|png}` (ICO converted to PNG)
- og:image URL recorded in frontmatter as `og_image_url:` (no file saved unless explicitly requested)

`Company-Name` is Train-Case (e.g. `Foundation-Health`, `9am-Health`, `Inne`). Full naming spec in `schema/company.md` → "Asset filename convention". The company's `.md` has separate `logo:` and `favicon:` fields pointing to their respective files.

### CP4 — CEOs of the CP3 companies

**Goal:** for each portfolio company resolved in CP3, find the CEO and gather their metadata.

**Cascade:**
1. **Tavily search** `"CEO of {Company}"` or `"{Company} founder"`
2. **Jina Reader** the company `/team` or `/about` page if not LinkedIn
3. **Firecrawl** the resolved LinkedIn profile
4. **OpenGraph.io** for headshot

**Output:** `portfolio/{co-slug}-ceo.md` (next to the company file).

## Tool inventory

| Tool | Type | Use for | When to prefer |
|---|---|---|---|
| **Jina Reader** | REST helper script (`scripts/jina-reader.ts`) | URL → clean markdown | **Default first call** when you just need a page's content. Fast, cheap, JS-rendering-aware. |
| **Firecrawl MCP** | MCP server | Structured extraction (URL + JSON schema → filled JSON) | When you need *structured* output (e.g., extract `{name, title, bio, headshot}[]` from a team page) or when Jina Reader returns thin content for a JS-heavy site. |
| **Tavily MCP** | MCP server | AI-native search — replaces "Google + scrape" | Advisor / CEO discovery, finding LinkedIn URLs by name+context, finding the right firm homepage from a name. |
| **OpenGraph.io** | REST helper script (`scripts/og-fetch.ts`) | OG metadata + image for any URL | Quick favicon / `og:image` / description without spinning up Firecrawl. |
| **Bash + curl** | built-in | Downloading assets to disk | After you've resolved the asset URL. |
| **Brandfetch API** | REST helper script (`scripts/brandfetch.ts` — to be added) | SVG logo + brand colors + fonts for a domain | Tier 4 in the logo cascade — when site SVG hunt fails. Free tier 1k/mo. Requires `BRANDFETCH_API_KEY` in `~/.secrets`. |
| **Tavily MCP (SVG repo search)** | Tavily, with `site:` filters | Find SVG logos hosted on `worldvectorlogo.com` / `seeklogo.com` / `vectorlogo.zone` / `wikimedia.org` | Tier 5 in the logo cascade — when Brandfetch returns nothing. |
| **Google Custom Search** | REST (helper to be added) | `fileType=svg` web-wide SVG search | Tier 6 (last resort). Costs money beyond 100 free queries/day. Requires `GOOGLE_CSE_KEY` + `GOOGLE_CSE_CX`. |
| **ImageMagick** (`magick`) | local CLI (`brew install imagemagick`) | Background removal via flood-fill from corners; also color sampling | Tier 1 of `scripts/bg-strip.sh`. Deterministic, no model deps, handles white + brand-color backgrounds. |
| **rembg** | local CLI (`pipx install rembg`) | AI-based background removal (U²-Net) for non-uniform / soft-edge logos | Tier 2 of `scripts/bg-strip.sh`. ~170MB model on first run, then offline. Optional — script gracefully degrades without it. |

**Decision flow per URL:**
1. Need just text content? → **Jina Reader**.
2. Need a structured object filled from the page? → **Firecrawl** with extraction schema.
3. Need favicon / og:image / description only? → **OpenGraph.io**.
4. Don't have a URL yet, just a name? → **Tavily** to find one, then go back to step 1.

**Cache before call:** every Jina / Firecrawl / Tavily / OpenGraph.io response is keyed on its URL or query hash and stored at `~/.claude/skills/crawl-fetch-ingest/cache/{firm-slug}/`. Always check the cache before invoking the tool. Document the hashing convention in `setup.md`.

## Schema

The skill's output schema is **canonical and loosely enforced**. Sites already have divergent shapes (mpstaton-site, fullstack-vc, hypernova-site, memopop-ai); adapting per-site happens on refactor, not on ingest. See:

- `schema/firm.md` — firm-level frontmatter
- `schema/person.md` — CP1 + CP2 + CP4 (all people are the same shape, distinguished by `role_class`)
- `schema/company.md` — CP3

Every file is `.md` with YAML frontmatter and a free-form body for prose bio / description / notes.

## Confidence + flagging

Every output file should have a `confidence` field in frontmatter: `high`, `medium`, `low`, or `flagged`. Use:

- `high` — direct match on firm site or LinkedIn with all required fields filled
- `medium` — match via search, plausible but not confirmed (e.g., common name)
- `low` — partial data, asset hunt failed, ambiguous match
- `flagged` — should be reviewed before publishing

Never silently drop an entity. If it appears in the deck and can't be resolved, write the file with `status: unresolved` + `confidence: flagged` and notes about what was tried.

## Workflow for Claude

When invoked:

1. **Identify inputs** — what does the user have? PDF? URL? Just a firm name? Confirm the firm slug (kebab-case, e.g., `sequoia-capital`).
2. **Discovery (Phase 1, no paid calls)** — extract names + companies from PDF if provided; identify firm site sections (`/team`, `/portfolio`) from URL if provided.
3. **Present roster** — show the user what was found and wait for confirmation before running paid fetches. Don't run all four checkpoints autonomously.
4. **CP1 → confirm → CP2 → confirm → CP3 → confirm → CP4 → confirm.** Each gate is a chance for the user to refine, deduplicate, or skip.
5. **Cache aggressively** — every API response goes to `cache/{firm-slug}/{tool}/`. Check before calling.
6. **Write files as you go** — don't accumulate in memory. The output dir is the state.
7. **Report at the end** — counts per checkpoint, list of `flagged` entities, list of assets that fell back from SVG → PNG, anything the user should manually review.

## Subroutines

Subroutines are sub-workflows that operate on the output of the main four-checkpoint ingest. They are invoked **after** (or independently of) the main ingest, typically as quality-assurance or human-in-the-loop steps. Each lives as its own markdown file in `routines/` with optional helper scripts in `scripts/`.

### `routines/triage-brand-assets.md`

**Invoke when:** the user asks to "triage", "review", "classify", or "audit" the brand assets fetched for a firm. Typically run after CP3 + bg-strip + rename are complete, before publishing.

**What it does:** for each portfolio company, runs an auto-classifier (`scripts/triage-classify.py`) that scores the logo across existence / format / bg-strip success / foreground luminance / resolution / file size / flagged-status, then walks the user through each ambiguous case asking for one of `good-to-go` / `not-urgent-passable` / `urgent-rework` / `deferred-for-now`. Persists the choice as `review_status` in the company's frontmatter.

**Output:** updated frontmatter on each `portfolio/{co-slug}.md` plus an end-of-routine summary listing the urgent-rework items with suggested next moves (e.g., "try Brandfetch tier 4," "manual cleanup in Figma").

### `routines/investor-credibility-ingest.md`

**Invoke when:** the user asks to "ingest our backers", "fill out the investor section", "do credibility ingest", "make these VCs legible", or supplies a list of firm names + the operating company they back. This is the **company-anchored** walk — root is the operating company, traversal goes outward through its named backers.

**What it does:** for each backer firm, runs CP1 (team across every role-bearing sub-page) + CP3 (portfolio + brand assets via the SVG cascade). **Skips CP4** — at credibility-card distance, portco CEOs add no legibility. Writes to `<cwd>/data/investors/{firm-slug}/` so multiple backers coexist alongside the operating company's own `data/team/`.

**Output:** `data/investors/{firm-slug}/firm.md` + `team/{person}.md` + `team/{person}.jpg` + `portfolio/{co}.md` + `portfolio/trademark__{Co}.svg` + `portfolio/favicon__{Co}.png` per backer firm. End-of-routine summary covers per-firm team/portfolio counts, SVG-vs-raster asset success rates, and cross-firm portfolio overlaps (co-investments are a credibility multiplier the rendering layer may want to highlight).

### Adding new subroutines

The pattern: drop a new `routines/{name}.md` with frontmatter (`name`, `description`), then add a one-paragraph entry in this section that tells the agent when to invoke it. Helper scripts go in `scripts/{name}.py|.sh|.ts` and are referenced from the routine doc, not from `SKILL.md` directly. This keeps `SKILL.md` as a stable map and lets subroutines evolve independently.

Examples of future subroutines that fit this pattern: `triage-person-assets.md` (same idea but for headshots — wrong person, low-res, missing), `re-fetch-flagged.md` (re-run the cascade with stricter parameters on entities marked `confidence: flagged`), `export-to-site.md` (per-site adapter that converts `data/firms/...` into a target site's content-collection schema).

## Important: this skill never adapts to a specific site's content collection

The skill writes only under `<cwd>/data/` — `data/firms/{firm-slug}/` (firm-anchored), `data/investors/{firm-slug}/` (company-anchored, via `investor-credibility-ingest`), or `data/team/` + `data/portfolio/` (flat operating-company variant). Wiring any of these outputs into a specific site's content collection (e.g., mpstaton-site's `src/content/team/`) is a **separate, per-site task**. That separation is intentional — sites diverge in schema, asset paths, and routing; the skill stays neutral.

## See also

- `setup.md` — one-time install (`.secrets`, MCP servers, npm packages, ImageMagick, rembg)
- `schema/{firm,person,company}.md` — canonical frontmatter (incl. logo asset_strategy fields)
- `scripts/jina-reader.ts` — URL → markdown
- `scripts/og-fetch.ts` — OpenGraph.io REST wrapper
- `scripts/brandfetch.ts` — Brandfetch API wrapper (tier 4 of the logo cascade); `--best-svg` / `--best-raster` / `--save-all` modes
- `scripts/bg-strip.sh` — auto-strip backgrounds from raster logos (ImageMagick → rembg cascade)
- `scripts/logo-hunt.sh` — run tiers 1–3 of the trademark/wordmark cascade locally for a domain
- `scripts/favicon-hunt.sh` — run the favicon cascade for a domain (apple-touch-icon → site icons → Google S2 fallback)
- `scripts/og-image-hunt.sh` — extract og:image / twitter:image URL from a homepage
- `future-work.md` — PDF OCR (port from memopop-orchestrator), Google CSE wrapper, design-system-viewer-style preview UI

---
name: investor-credibility-ingest
description: Sub-workflow of crawl-fetch-ingest. Company-anchored expansion through a list of backer firms — for each firm, ingest its team + its portfolio companies (with brand assets), so the operating company's deck/site can render credibility cards for readers starting from near-zero context. Stops at the firms' portfolio companies; does NOT descend to portco CEOs.
from: "dididecks-ai"
from_path: "context-v/agent-skills/crawl-fetch-ingest/routines/investor-credibility-ingest.md"
---
# Routine — Investor Credibility Ingest

A subroutine of `crawl-fetch-ingest`. Where the parent skill's primary walk is **firm-anchored** (one VC firm → its team → its portfolio → those portcos' CEOs), this routine inverts the starting point: **company-anchored** (one operating company → its list of backer firms → each backer's team + portfolio).

Both walks are first-class. The skill's cascade (Jina / Firecrawl / OpenGraph.io / Brandfetch / SVG-tier fallback / bg-strip) is shared. Only the **entry point and stop condition** differ.

## The perspective

The deck a reader is about to look at will name several VC firms most readers have never heard of. The skill's job here is to **make those firms — and by extension the round itself — legible**, by surfacing two cheap-to-fetch signals per firm:

1. **Who's on the team** (CP1) — a few partner names + photos. "These are real people, not a brand."
2. **Who they've already backed** (CP3) — a row of recognizable portfolio logos. "If those companies trust this firm, this round is in good company."

We deliberately **stop at the portfolio companies** — we do *not* descend to portco CEOs (CP4 in the parent skill). At credibility-card distance, portco-CEO faces don't add legibility; logos do.

## When to invoke

User says something like:

- "ingest our backers"
- "fill out the investor section"
- "do credibility ingest on these firms"
- "we need to make these VCs legible to readers who don't know them"
- "go get teams and portfolios for {Firm A}, {Firm B}, {Firm C}"
- "{operating company} is raising — give us context on the investors"

The user typically supplies a **list of firm names** (Quiet Capital, Bloomberg Beta, Air Street Capital, AIX Ventures) along with the **context company** they all back (e.g., Chroma). The context company is metadata — we don't crawl it here; the parent skill's `team/` flow already handles the operating company's own people.

## Inputs

- **Required:** list of backer firms. Names or URLs. If only names, resolve homepage via Firecrawl-search before proceeding.
- **Optional:** context company slug — gets recorded as `ingested_for: <company-slug>` in each firm's `firm.md` so future readers know why this data exists.
- **Optional:** `--marquee-portcos N` — cap portfolio capture at N companies per firm (default: capture all the firm lists; the rendering layer chooses which subset to display). Useful when a firm has 200+ portfolio companies and you only need ~12 marquee logos.

## Output layout

```
<cwd>/data/investors/{firm-slug}/
  firm.md                            # firm-level metadata; includes ingested_for
  team/{person-slug}.md              # CP1: every partner / venture partner / op partner / EIR / advisor
  team/{person-slug}.{jpg|png}       # headshot
  portfolio/{co-slug}.md             # CP3: every portfolio company surfaced
  portfolio/trademark__{Co-Name}.svg # primary logo (SVG preferred; raster fallback per cascade)
  portfolio/favicon__{Co-Name}.{png|svg}
  # NO {co-slug}-ceo.md — CP4 is skipped for this routine
```

The `data/investors/` directory parallels `data/firms/` (the firm-anchored anchor) and `data/team/` (operating-company team from the inverse run). All three can coexist in the same project — a fundraise deck typically has all three populated:

```
<project>/data/
  team/                       # the operating company's own employees (company-anchored run, CP1-only)
  investors/                  # backer firms (this routine)
    {firm-a}/firm.md + team/ + portfolio/
    {firm-b}/firm.md + team/ + portfolio/
  firms/                      # (only if the project also ran the firm-anchored walk on some specific VC)
    {firm}/firm.md + team/ + portfolio/ + portco-ceos/
```

If the project ALSO has a top-level `data/team/` for the operating company, that stays untouched — `data/investors/{firm}/team/` is namespaced under each backer firm.

## Workflow for Claude

For each firm in the input list, run the parent skill's checkpoints with the following scope:

### Per firm

1. **Discover firm site** — Firecrawl-search if only a name was given; confirm homepage with the user if ambiguous.
2. **Write `firm.md`** with `ingested_for: <company-slug>` and `ingest_routine: investor-credibility-ingest`.
3. **CP1 (team)** — enumerate every role-bearing sub-page per the parent skill's page-discovery cascade (`/team`, `/partners`, `/venture-partners`, `/operating-partners`, `/eir`, `/supporting-partners`, `/lpac`, `/advisors`, `/about/team`, paginated variants). Capture **all** partner-level people; the `role_class` field distinguishes managing-partner / venture-partner / operating-partner / EIR / supporting-partner / advisor. Headshots via OpenGraph.io on the per-person bio URL; LinkedIn via Firecrawl with stealth proxy.
4. **CP3 (portfolio)** — enumerate `/portfolio`, `/companies`, `/investments`. For each company:
   - **Trademark** via the 7-tier cascade (inline SVG → site SVG paths → press/brand kit → Brandfetch → SVG-repo Tavily → CSE → raster + bg-strip).
   - **Favicon** via the favicon cascade (apple-touch-icon → site icons → S2 fallback).
   - **og:image URL** captured into frontmatter (no file save).
   - **Company `.md`** with sector, stage, description, website.
5. **Skip CP4.**
6. **Cache aggressively.** Same `~/.claude/skills/crawl-fetch-ingest/cache/{firm-slug}/` convention as the parent skill — re-running this routine on the same firm is free.

### Across firms

- **Run firms in sequence, not parallel** at the routine level (each firm's CP1 + CP3 can parallelize internally). One firm's batch is a natural checkpoint; pause between firms only if the user is reviewing in real-time.
- **De-duplicate portfolio overlap.** Two firms can co-invest in the same company. If `data/investors/{firm-a}/portfolio/notion.md` and `data/investors/{firm-b}/portfolio/notion.md` both exist, that's fine and intentional — each firm's portfolio is its own narrative. Don't try to canonicalize.
- **Marquee selection is a rendering concern, not an ingest concern.** Capture the full portfolio; the deck/site picks the 6–12 logos to display. Don't pre-filter at ingest.

## Confidence + flagging

Same rubric as the parent skill (`high` / `medium` / `low` / `flagged`). For credibility-card use, the bar to publish is higher than for an internal one-pager — partner photos that look like generic LinkedIn placeholders, or logos that bg-strip mangled, should land as `low` or `flagged` so the human reviewer catches them.

## Reporting

When done, return a summary covering:

- Per-firm: team count + portfolio count + asset-success rate (logos SVG vs. raster vs. fallback).
- Cross-cutting flags — portfolio companies whose logo only resolved as raster with bg-strip (will likely look uneven next to clean SVGs in a row), partners whose headshot couldn't be resolved (will leave a gap in a partner-grid render).
- Notable overlaps — if multiple backer firms co-invest in the same well-known company, surface it; that's a credibility multiplier the rendering layer may want to highlight.

## Anti-patterns

- **Don't crawl portfolio-company team pages.** That's CP4 of the firm-anchored walk; deliberately out of scope here. A credibility card showing "Notion's CEO is X" is too deep — readers care that this firm backed Notion, not who runs Notion.
- **Don't paraphrase from training data when the firm has a public site.** Cache says no? Fetch the site. Always.
- **Don't try to rank firms by quality.** This routine surfaces facts (team + portfolio); ranking is editorial and belongs in the deck-authoring step, not the ingest.
- **Don't merge investor data into the operating company's own `data/team/`.** Backers live in `data/investors/{firm}/team/`; the company's own employees live in `data/team/`. Keeping them separate makes both renderings cleaner.

## See also

- `../SKILL.md` — the parent skill, the cascade definitions, the two anchor types
- `../schema/firm.md` — firm-level frontmatter
- `../schema/person.md` — person frontmatter incl. `role_class` taxonomy
- `../schema/company.md` — portfolio-company frontmatter incl. logo asset_strategy
- `./triage-brand-assets.md` — quality-review subroutine to run on `data/investors/{firm}/portfolio/` once this routine finishes (often the immediately next step)

---
title: "Refactor data-assets audit for per-asset quality ratings, brand-asset disambiguation, and deck-render guards"
lede: "The /data-assets/{companies,people} audit pages today treat brand imagery as a generic 'logo' field. In practice a company has FOUR distinct assets — favicon, trademark, wordmark, og:image — and each can be present-but-glitchy, missing, or immaculate. Decks bundle these assets at render time, and a glitchy favicon shipped into an investor's inbox is a brand-credibility wound that's expensive to recover from. This plan refactors the audit pages to (1) display each of the four assets as its own labeled cell, (2) carry a per-asset U/C/P/Star quality rating, (3) flag incomplete/missing/glitchy assets visibly, and (4) introduce a build-time render guard so a flagged asset can't accidentally ship to a final deck. People audit gets the parallel treatment for headshots + LinkedIn presence."
date_authored_initial_draft: 2026-05-17
date_authored_current_draft: 2026-05-17
date_last_updated: 2026-05-17
at_semantic_version: 0.0.1.0
status: Draft
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Plan
tags:
  - Data-Assets-Audit
  - Brand-Quality
  - Deck-Render-Guards
  - Shell-Refactor
  - Workflow
  - People-Audit
  - Companies-Audit
authors:
  - Michael Staton
from: "dididecks-ai"
from_path: "context-v/plans/Refactor-Data-Assets-Audit-for-Brand-Quality-Ratings-and-Render-Guards.md"
---
# Refactor data-assets audit for per-asset quality ratings, brand-asset disambiguation, and deck-render guards

## Why this exists

The `/data-assets/companies` and `/data-assets/people` audit pages were initially built as reviewer chrome — "are the headshots loading, do the logos render." They've earned their keep but the model is too coarse:

1. **One "logo" field collapses four distinct assets.** A company has a favicon (the 16/32px square that appears in browser tabs), a trademark (the registered mark — usually the logo *symbol*), a wordmark (the brand name as a styled type treatment), and an og:image (the social-share preview). Today these collapse into "logo present yes/no" + "favicon present yes/no" + "og:image present yes/no" — no distinction between trademark and wordmark; no visibility into whether the present asset is *good*.

2. **No quality signal.** An asset can be present but glitchy (compressed wrong, transparent-PNG-on-light-bg, wrong aspect ratio, low DPI, color-off). Today these render in the audit at the same fidelity as immaculate assets — the reviewer has no flag, so the glitchy ones get bundled into a deck and reach an investor's inbox. That's a brand-credibility wound the company often can't repair (the investor's first impression is set).

3. **No render guard.** When the deck build pulls assets, it doesn't know which ones are "good enough to ship." A flagged asset can be rendered into a slide without anyone noticing until the deck is sent.

4. **People audit is parallel.** Same shape: a person has a headshot + a LinkedIn link + a bio + a confidence rating. Headshots can be missing, low-DPI, or just-wrong (a stock photo, a mismatched person from same name). The current audit shows "headshot present yes/no" without quality signal.

This plan brings both audit surfaces to a four-asset (companies) / three-asset (people) per-row quality matrix with explicit ratings and a build-time guard.

## Open question — U / C / P / Star semantics

The user wants ratings labeled **U**, **C**, **P**, and **Star**. The plan scaffolds these as a four-level ordinal scale but **the meaning of each letter is TBD and needs to be filled in before implementation.** Likely candidates the plan can't choose between without confirmation:

| Letter | Possible meanings | One the user picks |
|---|---|---|
| **U** | Unverified / Unusable / Unknown / Untouched | _TBD_ |
| **C** | Complete / Confirmed / Canonical | _TBD_ |
| **P** | Provisional / Production-ready / Polished | _TBD_ |
| **Star** | Featured / Best-in-class / Immaculate / Hero | _TBD_ |

Frontmatter field name proposal: `quality: U | C | P | Star` per asset. Final naming + semantics resolved before Phase 2.

## Current state (2026-05-17)

### Files
- `apps/deck-shell/src/routes/data-assets/companies.astro` — globs `data/**/portfolio/*.md`, groups by firm slug, renders one table per firm
- `apps/deck-shell/src/routes/data-assets/people.astro` — globs `data/**/team/*.md` (and team-like paths)
- Both ship sticky firm-headers and (as of `f4d12c7`) sticky column headers

### Data shape (today's portfolio `.md` frontmatter — example from `data/investors/air-street-capital/portfolio/allcyte.md`)
```yaml
name: "Allcyte"
homepage: "allcyte.com"
sector: "TechBio"
description: "Diagnostics (acq. Exscientia)"
logo_file: "allcyte-logo.png"        # ← collapses trademark/wordmark
favicon_file: "allcyte-favicon.ico"
og_image_url: "https://..."
strategy: "none"
status: "complete"
```

### Audit columns rendered today (companies)
| Logo | Favicon | Name | Homepage | Sector | Description | og:image | Strategy | Status |
|---|---|---|---|---|---|---|---|---|

### Audit columns rendered today (people)
| Photo | Name | Title/Org | Links | Affiliation | Bio | Confidence | Status |
|---|---|---|---|---|---|---|---|

## Target state

### Companies audit

| Favicon | Trademark | Wordmark | og:image | Name | Homepage | Sector | Description | Status |
|---|---|---|---|---|---|---|---|---|

- **Favicon** cell: 16/32px thumb + rating chip (U/C/P/Star) + flag icon if flagged
- **Trademark** cell: square thumb (the symbol only, no text), rating chip, flag
- **Wordmark** cell: rectangular thumb (the brand name as type), rating chip, flag
- **og:image** cell: landscape thumb (the actual fetched image, NOT just the URL), rating chip, flag
- **Status**: row-level rollup ("complete" only if all four assets are present AND none flagged)
- **Filter pills above the firm-section header**: "show only rows with flagged assets" / "show only rows missing wordmark" / etc.

### People audit

| Photo | LinkedIn | Twitter | GitHub | Name | Title/Org | Affiliation | Bio | Status |
|---|---|---|---|---|---|---|---|---|

- **Photo** cell: portrait thumb + rating chip + flag
- **LinkedIn / Twitter / GitHub**: present/absent icon (no rating; binary), clickable to verify URL
- **Status**: row-level rollup

### Flag visual treatment
- **Missing asset**: empty cell with dashed border + tiny "missing" tag, rating defaults to U
- **Flagged glitchy asset**: red ring on the thumb + tooltip with the flag reason (`"wrong aspect ratio"`, `"transparent-on-light"`, `"low DPI"`, etc.)
- **Star-rated asset**: subtle gold ring on the thumb so the reviewer can see at-a-glance which assets are deck-ready

## Phases

Each phase is independently shippable. Estimated effort in calendar-time, assuming one focused work session per phase.

### Phase 0 — Resolve U/C/P/Star semantics (15 min, blocking)

Before any code lands, the user fills in the meaning of each letter and writes a 2-line definition for each in a sibling `context-v/specs/Brand-Asset-Quality-Rating-Definitions.md`. This becomes the source of truth referenced from the audit pages and the deck-render guard. Without this, the field name and the chip-rendering aesthetic can't be locked.

### Phase 1 — Schema additions on the per-asset `.md` frontmatter (1 hour)

Extend portfolio `.md` and team `.md` frontmatter shapes with explicit per-asset fields. Companies:

```yaml
# Existing
name: "Allcyte"
homepage: "allcyte.com"
sector: "TechBio"
description: "Diagnostics (acq. Exscientia)"

# New — per-asset blocks. Each is optional; missing block = asset missing.
favicon:
  file: "allcyte-favicon.ico"
  quality: P                              # U | C | P | Star
  flag: null                              # null | "wrong-aspect" | "low-dpi" | "transparent-on-light" | "color-off" | other
  notes: "16px ICO from /favicon.ico"

trademark:
  file: "allcyte-trademark.svg"
  quality: Star
  flag: null
  notes: "Clean SVG from press kit"

wordmark:
  file: "allcyte-wordmark.svg"
  quality: P
  flag: null
  notes: null

og_image:
  url: "https://..."
  file: "allcyte-og.jpg"                  # local cache (downloaded), optional
  quality: C
  flag: "stale"
  notes: "Cached 2026-04-12; site may have updated since"

status: "complete"                        # rolled up by the audit page, not authored
```

Migration: the existing `logo_file` field on each .md gets remapped manually to `trademark.file` or `wordmark.file` depending on what the file actually is. This is a one-time hand-pass per company; ~5 minutes per row times the count.

People mirrors:

```yaml
name: "Naval Ravikant"
slug: naval-ravikant
role_class: advisor
title: "Co-founder & Chairman"
org: "AngelList"
linkedin: "https://www.linkedin.com/in/navalr"     # binary present/absent
twitter: "https://x.com/naval"
github: ""

photo:
  file: "naval-ravikant.jpg"
  quality: P
  flag: null
  notes: "300x300 from speaker page"
```

### Phase 2 — Refactor `companies.astro` to render per-asset cells (3-4 hours)

- Replace the single Logo + Favicon columns with four cells: Favicon / Trademark / Wordmark / og:image.
- Each cell renders the thumb + the quality chip + (if flagged) the red ring + tooltip.
- Parse the new frontmatter shape; back-compat read the old `logo_file` as `trademark.file` with `quality: U` so unmigrated rows don't blank out.
- Sticky `<thead>` already works (commit `f4d12c7`); column count grows from 9 → 9 but cell semantics change.

### Phase 3 — Refactor `people.astro` to render per-asset cells (1-2 hours)

- Same pattern for photo + LinkedIn/Twitter/GitHub chips.
- LinkedIn/Twitter/GitHub are binary present/absent indicators, not rated (they're URLs, not visual assets).

### Phase 4 — Filter pills + row-level status rollup (2 hours)

Add a row of filter pills above each firm section:

- `All` (default)
- `Missing trademark` (rows where `trademark` block is absent)
- `Missing wordmark`
- `Flagged` (rows where any asset has a non-null `flag`)
- `Star-rated` (rows where any asset is rated Star — useful for "which decks have hero-quality imagery I can foreground")

Status column rollup logic:
- `complete` if all four assets present, all rated ≥ C, no flags
- `flagged` if any asset has a non-null flag
- `incomplete` if any asset missing
- `wip` if any asset rated U

### Phase 5 — Deck-render guard (2-3 hours)

A build-time check the deck consumer can opt into. The shell exposes a helper:

```ts
import { auditAssets } from "@dididecks/shell/audit";

// Called from astro.config.mjs `astro:build:start` hook, or from a custom
// build script. Throws if any asset referenced by the current deck variant
// is flagged or rated below the threshold.
auditAssets({
  variant: "enhanced-v3",
  minQuality: "P",                        // "C" | "P" | "Star"
  failOn: ["flagged", "missing"],         // disposition categories
});
```

The check traverses the variant's per-slide files, finds every `<Image src={data/...}>` or equivalent, looks up the matching .md, and rejects the build if:

- The referenced asset's `quality` is below `minQuality`, OR
- The asset has a non-null `flag`, OR
- The asset block is missing entirely

Failure mode is `process.exit(1)` with a list of offending (slide, asset, reason) triples. Override per-build with a `--allow-flagged` flag for "I know, ship anyway" moments (rare; the override is mostly for shipping a deck mid-iteration where one asset is known-glitchy and we'd rather ship than block).

### Phase 6 — Workflow documentation (30 min)

A short doc — `dididecks-ai/context-v/specs/Brand-Asset-Quality-Workflow.md` — capturing the loop:

1. Reviewer opens `/data-assets/companies` (or `/people`), sees rating chips + flagged thumbs
2. Reviewer files a flag inline (or in a sibling task tracker) for each glitchy asset
3. Brand-curation pass refreshes the asset, updates `.md` frontmatter rating
4. Deck-render guard re-runs, accepts the now-clean asset
5. Deck ships

Includes the override semantics ("when to use `--allow-flagged`"), the "Star" promotion criterion ("when can you award Star, and what does it signal to a future reviewer"), and the firm-curation policy (does the same physical PNG ever rate differently in two firms' portfolios? Probably no, but worth naming.)

## Out of scope for this plan (named so they don't drift in)

- **Automated asset-quality detection.** Computer-vision approaches that could auto-flag low-DPI, off-aspect, transparent-on-light, etc. Possibly worth a follow-up exploration; the human-rating + flag workflow is sufficient v1.
- **Per-firm asset-quality SLAs.** "Air Street's portfolio must be ≥ P across the board before we ship a deck to them." Conceivable; not v1.
- **Asset variants** (light-mode vs dark-mode logos, square vs landscape OG). The schema can grow to per-mode `quality:` but the v1 plan treats one canonical asset per slot.
- **CEO photo as a separate asset.** People audit covers it under `photo:`. Companies could carry a per-row `ceo_photo:` block but that's a Phase 7 if it earns its keep.
- **Auto-fetching missing assets** from third-party APIs (Clearbit, Logo.dev). Out of v1; the audit's job is to surface, not to remediate.

## Risks + open questions

- **Migration burden.** Every existing portfolio .md needs the `logo_file` → `trademark` or `wordmark` decision made by hand. ~5 min × N companies. Chroma alone has 345 entries across 4 firms; that's a focused day of work. Worth it for the deck-credibility downstream, but real.
- **Rating subjectivity.** "P vs Star" is judgment. Two reviewers may disagree. Phase 6 workflow doc needs to give criteria so the rating doesn't drift.
- **Per-firm vs per-asset rating.** If Air Street's portfolio is mostly C-rated assets and Chroma's is mostly Star, the firm-section header could carry an aggregate rating. Phase 4 could extend the rollup to firm-level. Defer until the per-row pattern proves out.
- **Star promotion semantics.** What earns Star? Is Star "this is the official press-kit asset from the company's own brand-asset folder" or "this looks great in our specific deck context"? Phase 0 resolves this.
- **Status column collision.** Today's audit has a `Status` column ("complete" | "incomplete" etc.). The new per-asset model essentially makes the row-level `Status` a derived field. Drop the per-row `status` from .md frontmatter? Or keep it for backwards-compat? Probably derive.

## Status / next step

**Status:** Draft. Phase 0 (resolve U/C/P/Star semantics) is the immediate next step before any code lands.

**Next step:** User fills in the four-letter definitions and signs off on the frontmatter field name (`quality:` vs alternative). Plan moves to Active.

## Cross-references

- `apps/deck-shell/src/routes/data-assets/companies.astro` — the companies audit (current)
- `apps/deck-shell/src/routes/data-assets/people.astro` — the people audit (current)
- Recent companion fix: shell commit `f4d12c7` added working sticky column headers
- `client-sites/chroma-decks/data/{investors,team}/` — the data tree this audit walks
- Parent ai-labs convention pointer: `dididecks-ai/CLAUDE.md` → "Auth surface conventions" (same docs-pointer pattern this plan should adopt when it lands its own spec doc)

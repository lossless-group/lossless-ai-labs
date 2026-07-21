---
title: "Company — portfolio companies + brand-asset metadata"
lede: "One markdown file per portfolio company, with sibling-colocated brand assets (trademark + favicon + optional og:image URL). The Person model also lives under portfolio/ — the discriminator is the presence/absence of `role_class`. Companies are everything in portfolio/ that does NOT carry role_class."
date_authored_initial_draft: 2026-06-07
date_last_updated: 2026-06-07
at_semantic_version: 0.0.1.0
status: As-observed-from-filesystem
applies_to:
  - client-sites/calmstorm-decks
  - client-sites/chroma-decks
  - client-sites/humain-vc-decks
schema_authority: apps/deck-shell/src/routes/data-assets/companies.astro
from: "dididecks-ai"
from_path: "context-v/models/Company-Data-Model.md"
---
# Company · Data Model

## What this model represents

A portfolio company — an operating company a VC firm has invested in (or is referenced in the deck as a track-record / exemplar / competitor). One `.md` file per company; sibling-colocated brand assets following the `trademark__{TrainCase}.{ext}` + `favicon__{TrainCase}.{ext}` naming convention.

The CEO of the company is a Person (see [`Person-Data-Model.md`](./Person-Data-Model.md)) — stored either next to the company file (humain pattern: `{co-slug}-ceo.md`) or referenced via a `ceo_slug` field (calmstorm pattern).

## Where it lives in the filesystem

| Client | Path pattern |
|---|---|
| `calmstorm-decks` | `data/firms/{firm-slug}/portfolio/{co-slug}.md` |
| `chroma-decks` | `data/investors/{firm-slug}/portfolio/{co-slug}.md` (one portfolio per backer firm — credibility-card pattern) |
| `humain-vc-decks` | `data/portfolio/{co-slug}.md` (flat operating-company variant — Humain Fund I's own portfolio) |

**Naming convention:** kebab-case slug; `.md` extension.

## Brand assets and discovery globs

The shell discovers companies via .md filenames; assets are discovered by image-extension glob, independent of any registry. Asset filename convention:

| Role | Filename pattern | Aspect | Use |
|---|---|---|---|
| Trademark / wordmark | `trademark__{Company-Name}.{svg\|png\|webp}` | wide / horizontal | Inline header, hero ribbon, wordmark display |
| Favicon | `favicon__{Company-Name}.{svg\|png\|ico\|webp}` | square (1:1) | Tile, list-row chip, app icon |
| og:image | *URL only, not downloaded* | 1.91:1 social card | Portfolio detail-page banner, deck hero |

`{Company-Name}` is **Train-Case** (`Foundation-Health`, `Unnatural-Products`, `9am-Health`), NOT kebab. This is a human-readability convention; the shell's asset glob doesn't care:

```js
// apps/deck-shell/src/routes/data-assets/companies.astro
const assetGlob = import.meta.glob(
  "/data/**/portfolio/*.{png,jpg,jpeg,webp,avif,svg,ico}",
  { eager: true, query: "?url", import: "default" }
);
```

The audit route renders whatever's there — Train-Case, kebab, mismatched, doesn't matter. Don't enforce naming in the DB; enforce by convention.

### Asset strategy metadata (chroma+calmstorm only)

Chroma and calmstorm record *which tier of the fetch cascade succeeded* in frontmatter — useful for the future "re-fetch all rasters as SVG" pass:

```yaml
logo: ./trademark__9am-Health.png
logo_format: png
logo_source: https://...
logo_bg_color_detected: "#000000"
logo_bg_strip_method: imagemagick-floodfill
logo_bg_stripped: true
logo_asset_strategy: og-image-stripped   # ← which tier succeeded
favicon: ./favicon__9am-Health.png
favicon_format: png
favicon_strategy: site-link-icon
og_image_url: https://...
og_image_strategy: og-image
```

Possible `logo_asset_strategy` values observed: `site-svg-path`, `site-raster`, `site-raster-stripped`, `og-image`, `og-image-stripped`, `brandfetch-svg`, `wikimedia-svg`.

**Humain omits all of these** — the humain ingest didn't run the full asset cascade (just grabbed the OG image as WebP from Squarespace). That's a content gap, not a schema gap. The DB column should be nullable.

## The canonical schema (current — chroma + humain convention)

```yaml
---
slug: unnatural-products             # required; kebab-case; filename stem
name: "Unnatural Products, Inc."     # required; display name
short_name: "UNP"                    # optional; abbreviation
website: https://www.unnaturalproducts.com  # required; homepage
homepage: https://www.unnaturalproducts.com # synonym; calmstorm uses `homepage`, chroma uses `website` ALSO

# Categorization
sector: "TechBio · Drug discovery"
sub_sector: "Synthetic macrocyclic peptide therapeutics"
stage: "Series A / partnership-driven"
location: "Santa Cruz, California, USA"
founded: 2018

# Firm linkage
firm_slug:                           # FK to Firm.slug; SET for chroma's backer-portfolio companies; NULL for humain's own portfolio

# People linkage
founders:
  - "Cameron Pye, PhD"
  - "Joshua Schwochert, PhD"
ceo: "Cameron Pye, PhD"
ceo_file: unnatural-products-ceo.md  # humain convention: sibling Person file
ceo_slug: unnatural-products-ceo     # calmstorm convention: FK to Person.slug

# Engagement-specific
humain_relationship: "Active Fund I portfolio (first warehoused investment, $40M post; pro-rata rights)"
deal_validation:
  - partner: "BridgeBio"
    year: 2021
  - partner: "Merck"
    year: 2023
    note: "Humain invested at $40M post around this milestone"
aggregate_deal_value: "$2B+ (per UC Santa Cruz Dean's Council profile, 2025)"
equity_raised: "$38M+"

# Body
description_short: "AI-designed macrocyclic peptide therapeutics — bridging the gap between small molecules and biologics"

# Brand assets
trademark: trademark__Unnatural-Products.webp
trademark_source: "static1.squarespace.com (UNP_Logo_Full_1200-01.png served as WebP)"
favicon: favicon__Unnatural-Products.webp
og_image_url: http://static1.squarespace.com/static/...
asset_strategy: site-raster

# Provenance + lifecycle
confidence: high
ingested_at: 2026-06-06
source_urls:
  - "https://www.unnaturalproducts.com"
  - "https://www.unnaturalproducts.com/about"
review_status: pending               # chroma-only; pending | reviewed | needs-rework
notes: "free-form authoring notes"
---

# Free-form markdown body — thesis, platform, partnerships, investment context.
```

### Older / calmstorm shape — preserved for backward compat

```yaml
---
slug: 9am-health
name: "9am.health"
homepage: https://www.9am.health/    # NOTE: `homepage` not `website`
firm_slug: calm-storm-ventures

# Asset metadata fully populated
logo: ./trademark__9am-Health.png    # NOTE: `./` prefix; `logo` field name
logo_format: png
logo_source: https://...
logo_bg_color_detected: "#000000"
logo_bg_strip_method: imagemagick-floodfill
logo_bg_stripped: true
logo_asset_strategy: og-image-stripped

description: "..."
sector: "Health Frontend, Health Backend"   # comma-separated string
deck_name: "9am Health"                     # calmstorm-only; verbatim deck label
deck_category: "Chronic Conditions"         # calmstorm-only

profiles:                            # NESTED ARRAY (calmstorm only)
  - type: firm-bio
    url: https://...
  - type: homepage
    url: https://www.9am.health/

ceo_slug: 9am-health-ceo

# Provenance
sources: [...]                       # NOTE: `sources` not `source_urls`
fetched_at: 2026-05-10T18:56:33Z     # ISO datetime
confidence: high
status: complete                     # NOTE: `complete` not `resolved`

# Favicon — same shape
favicon: ./favicon__9am-Health.png
favicon_format: png
favicon_strategy: site-link-icon
favicon_source: https://...
og_image_url: https://...
og_image_strategy: og-image
---
```

## Per-client variations (and why)

| Field | Calmstorm | Chroma | Humain |
|---|---|---|---|
| Homepage URL field | `homepage` | `website` (or `homepage`) | `website` |
| Logo field | `logo` (with `./` prefix) | `logo` OR `trademark` | `trademark` |
| Asset strategy metadata | full set | full set | absent (humain ingest skipped) |
| `profiles[]` nested array | yes | no | no |
| `deck_name` + `deck_category` | yes | no | no |
| `review_status` | no | yes (`pending`/...) | no |
| Provenance list | `sources` | `source_urls` | `source_urls` |
| Temporal | `fetched_at` (datetime) | `fetched_at` (datetime) | `ingested_at` (date) |
| Status enum | `complete`/`flagged` | `complete`/`flagged` | `resolved`/`flagged` |
| `humain_relationship` | n/a | n/a | yes (engagement-specific narrative) |

**Why the variation:** same answer as Person — calmstorm was first, chroma rewrote, humain inherited chroma's shape. The `humain_relationship` is engagement-specific narrative (one fund's-eye view); the DB shouldn't try to schematize it strictly — carry as JSON.

## How the shell consumes Company rows

**Route:** `apps/deck-shell/src/routes/data-assets/companies.astro`

**Discovery glob:** `import.meta.glob("/data/**/portfolio/*.md", { eager: true, query: "?raw", import: "default" })`

**Filter applied:** rows where `frontmatter.role_class` is NOT set. (Persons — see `Person-Data-Model.md` — also live under `portfolio/`, distinguished by the *presence* of `role_class`.)

**Fields the route reads:**

```
name · slug · homepage / website · firm_slug
sector · description / description_short
logo / trademark · favicon · og_image_url
asset_strategy fields (logo_asset_strategy, favicon_strategy, …)
confidence · status · ingested_at / fetched_at
ceo_slug (if present)
```

The audit route also pairs each company row with its colocated brand-asset files via the parallel asset glob.

## What's load-bearing

- **`slug`** — primary key; filename stem; URL fragment
- **Absence of `role_class`** — discriminator from Person on the same `portfolio/` glob
- **`trademark` + `favicon` filenames + colocated files** — without these the audit row shows dashes for assets
- **`firm_slug`** — required for chroma's multi-investor pattern (so the audit page can group by firm); nullable for humain's flat pattern

## Translation to a remote DB

### Prisma schema sketch

```prisma
model Company {
  // Identity
  id          String   @id @default(cuid())
  slug        String                          // kebab-case; per-engagement unique
  engagement  String                          // calmstorm-decks | chroma-decks | humain-vc-decks

  // Core
  name        String
  short_name  String?
  website     String?
  description String?  @db.Text

  // Categorization
  sector      String?
  sub_sector  String?
  stage       String?
  location    String?
  founded     Int?

  // Firm linkage
  firm_slug   String?                         // FK to Firm.slug; null for flat operating-company variant

  // CEO linkage
  ceo_slug    String?                         // FK to Person.slug (where role_class = portco-ceo)

  // Brand assets
  trademark_path        String?               // filename relative to company's .md dir
  trademark_format      String?               // svg | png | webp | …
  trademark_source      String?
  asset_strategy        String?               // see enum below; nullable for skipped clients
  logo_bg_stripped      Boolean?
  logo_bg_color_detected String?
  favicon_path          String?
  favicon_format        String?
  favicon_strategy      String?
  og_image_url          String?
  og_image_strategy     String?

  // Engagement-specific narrative (kept as JSON to avoid per-engagement column proliferation)
  engagement_narrative  Json?                 // e.g. humain_relationship, deal_validation[], aggregate_deal_value

  // Deck-label preservation (calmstorm)
  deck_name     String?
  deck_category String?

  // Calmstorm-shape preserved
  profiles_legacy Json?                       // nested {type, url}[]

  // Provenance + lifecycle
  status        String?                       // resolved | flagged | complete (calmstorm)
  confidence    String?                       // high | medium | low | flagged
  ingested_at   DateTime?                     // unified from `ingested_at` and `fetched_at`
  source_urls   String[]                      // unified
  review_status String?                       // chroma-only; pending | reviewed | needs-rework
  notes         String?  @db.Text

  // Full frontmatter capture
  raw_frontmatter Json?

  @@unique([engagement, slug])
  @@index([engagement, firm_slug])
  @@index([firm_slug])
}
```

### Asset-strategy enum (free-form text, but document the known values)

```
site-svg-inline     — extracted from <svg> inside the company's homepage HTML
site-svg-path       — found at /logo.svg or similar common path
site-raster         — PNG/JPG from /logo.png or similar
site-raster-stripped — same as above, with background flood-filled to transparency
og-image            — derived from <meta property="og:image"> on homepage
og-image-stripped   — og:image with bg strip
brandfetch-svg      — pulled from Brandfetch API (tier 4 of the cascade)
wikimedia-svg       — pulled from Wikimedia / SVG-repo search (tier 5)
google-svg          — Google Custom Search with fileType=svg (tier 6, last resort)
```

The full cascade is documented in `context-v/agent-skills/crawl-fetch-ingest/SKILL.md` § "Trademark / wordmark cascade".

## Open questions for the collaborator

1. **Brand-asset binary storage:** like Person headshots, do brand assets get an S3/CDN URL only, or also bytes-in-DB? Recommendation: URL only.

2. **`firm_slug` as nullable FK:** humain's `data/portfolio/` rows have no `firm_slug`. Should the DB enforce non-null + auto-populate with the engagement's own firm? Recommendation: leave nullable; humain's operating-company variant is a real shape that shouldn't be forced into firm-anchored.

3. **Engagement-specific narrative as JSON:** humain has `humain_relationship`, `deal_validation[]`, `aggregate_deal_value`, etc. — fields the next client may name differently (e.g., `chroma_position`, `co_invest_partners[]`). Recommendation: keep these as a Json column `engagement_narrative`; columnize only if a query layer needs to filter by them across engagements.

4. **De-dup across engagements:** if Calmstorm and Humain both invest in Company X, two rows or one? Recommendation: two rows, with a `canonical_company_id` FK that links if/when curated. Same answer as Person.

5. **Asset-strategy enum strictness:** new tiers may emerge. Recommendation: free-form text in DB; enum lives in the skill spec.

## See also

- [`Person-Data-Model.md`](./Person-Data-Model.md) — the sibling shape that also lives in `data/**/portfolio/`
- [`Firm-Data-Model.md`](./Firm-Data-Model.md) — the firm container that `firm_slug` references
- `context-v/agent-skills/crawl-fetch-ingest/schema/company.md` — the upstream skill's schema spec
- `context-v/agent-skills/crawl-fetch-ingest/SKILL.md` § "Trademark / wordmark cascade" — full asset-strategy taxonomy

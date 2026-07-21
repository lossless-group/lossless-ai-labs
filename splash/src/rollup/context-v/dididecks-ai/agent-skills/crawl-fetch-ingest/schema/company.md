---
name: company-schema
description: Canonical frontmatter shape for portfolio/{slug}.md (CP3 output — portfolio companies)
from: "dididecks-ai"
from_path: "context-v/agent-skills/crawl-fetch-ingest/schema/company.md"
---
# Company Schema

`data/firms/{firm-slug}/portfolio/{co-slug}.md`

## Frontmatter

```yaml
---
slug: stripe                       # required, kebab-case
name: "Stripe"                     # required, display name
homepage: https://stripe.com       # required if resolved
firm_slug: sequoia-capital         # required, the VC firm whose portfolio this is

# Trademark / wordmark — wide, for header/inline use
logo: ./trademark__Stripe.svg      # primary mark — see naming convention below
logo_format: svg                   # svg | png | jpg | webp | avif | none
logo_source: https://stripe.com/img/v3/home/twitter.png   # where the asset came from
logo_asset_strategy: site-inline-svg  # which tier of the cascade succeeded
logo_bg_stripped: false
logo_bg_strip_method: null         # imagemagick-floodfill | rembg | null
logo_bg_color_detected: null       # hex of the original bg, e.g. "#ffffff"; null for SVG
wordmark: ./wordmark__Stripe.svg   # optional — set when brand has BOTH wordmark and appIcon
appIcon: ./appIcon__Stripe.svg     # optional — set when brand has BOTH wordmark and appIcon

# Favicon — square 1:1 asset for chip/tile/icon use
favicon: ./favicon__Stripe.svg     # populated whenever favicon-hunt resolved anything
favicon_format: svg                # svg | png | jpg | webp (ICO converted to PNG on save)
favicon_strategy: site-apple-touch-icon  # which favicon-cascade tier succeeded
favicon_source: https://stripe.com/img/v3/touch-icon.png

# og:image — URL only by default. 1.91:1 social card; useful for hero/banner/detail.
og_image_url: https://stripe.com/img/v3/home/social.png
og_image_strategy: og-image        # og-image | twitter-image

description: "Online payment processing for internet businesses."   # from og:description or homepage hero
sector: "Fintech"                  # best-effort tag
stage_at_investment: null          # optional, the stage when this firm invested
year_invested: null                # optional, year of first investment
deal_lead: null                    # optional, slug of the partner who led — links to team/{slug}.md

profiles:                          # array of canonical company profile URLs
  - type: homepage
    url: https://stripe.com
  - type: linkedin
    url: https://www.linkedin.com/company/stripe/
  - type: crunchbase
    url: https://www.crunchbase.com/organization/stripe
  - type: twitter
    url: https://twitter.com/stripe

ceo_slug: stripe-ceo               # optional, points to portfolio/{slug}-ceo.md (CP4 output)

brand:                             # optional, populated if Brandfetch was used (or OG metadata gave colors)
  primary: null
  accent: null

sources:
  - https://www.sequoiacap.com/our-companies/
  - https://stripe.com
fetched_at: 2026-05-10T14:00:00Z
confidence: high                   # high | medium | low | flagged
status: complete                   # complete | partial | unresolved | flagged
notes: ""

# Set by the triage-brand-assets routine (see routines/triage-brand-assets.md)
review_status: pending             # pending | good-to-go | not-urgent-passable | urgent-rework | deferred-for-now
review_notes: ""                   # optional free-form note from human reviewer
reviewed_at: null                  # ISO timestamp when last classified, null if never
---
```

## Body

Free-form. Default structure:

```markdown
## Description

{Long-form description from firm portfolio page or company homepage}

## Notes

- {Anything notable from the deck context — why this co was featured, etc.}
```

## Asset rules

**Format preference: SVG > PNG-with-alpha > JPG (will need bg-strip).**

The cascade lives in `SKILL.md` under "Logo asset cascade." Always exhaust the SVG tiers before settling for a raster. Each tier records the corresponding `logo_asset_strategy` value:

| Tier | Source | `logo_asset_strategy` value |
|---|---|---|
| 1 | Inline `<svg>` extracted from the company homepage's nav/header | `site-inline-svg` |
| 2 | Common path on company site (`/logo.svg`, `/assets/logo.svg`, etc.) | `site-svg-path` |
| 3 | Linked from a brand / press / media page on the company site | `site-press-page` |
| 4 | Brandfetch API (`/v2/brands/{domain}`) returning SVG | `brandfetch-svg` |
| 5 | Tavily site-search hit on a vector-logo repository | `vector-repo` (note source domain in `logo_source`) |
| 6 | Google CSE `fileType=svg` web search | `google-cse-svg` |
| 7 | Brandfetch raster (PNG/WebP) | `brandfetch-raster` |
| 8 | OpenGraph.io `og:image` from the company homepage | `og-image` |
| 9 | Favicon upgraded as last resort | `favicon` |
| — | Nothing usable | `none` (set `logo_format: none`, `logo: null`, `confidence: flagged`) |

**Background-strip rule for raster tiers (4 and lower):**

- After download, sample the four corner pixels. If they're a uniform color (within ~5% RGB tolerance) and not already alpha=0, run `scripts/bg-strip.sh <file>`.
- The script tries ImageMagick flood-fill first (logs `imagemagick-floodfill`), and only falls back to `rembg` if (a) flood-fill removed < 5% of pixels, or (b) the background is non-uniform.
- Record the original background color in `logo_bg_color_detected` (hex) so reviewers can sanity-check.
- If both methods fail to produce a clean alpha mask: keep the original raster, set `logo_bg_stripped: false`, and add a `confidence: flagged` plus a note in `notes` for human cleanup (Photoshop / Figma).

**SVG validation** — every SVG, regardless of tier, must:
- Contain `<svg` near byte 0 (not be HTML or PNG-with-svg-extension)
- Have a `viewBox` or both `width` and `height` attributes
- Be at least 200 bytes (filters tracking pixels and broken responses)
- Have any `<script>` and external `<image href="http...">` references stripped before save (security hygiene)

**Path / extension** — see "Asset filename convention" below. The `ext` matches `logo_format`. If bg-strip ran on a JPEG, the output extension switches to `.png` (alpha required).

## Asset filename convention

Brand assets are saved next to the company's `.md` file using a **role-prefixed BEM-ish convention** (matches the `__` separator used elsewhere in the Lossless Group's design tokens):

```
{role}__{Company-Name}.{ext}
```

- **role** — camelCase string identifying what the asset is. Recognized roles:
  - `trademark` — the company's primary mark. Use when the company has only ONE distinct asset (whether that's a wordmark, a combined wordmark+icon, or a standalone icon). **This is the default.**
  - `wordmark` — used ONLY when the company also has a separate `appIcon`. The wordmark is the spelled-out company name in their typeface.
  - `appIcon` — used ONLY when paired with `wordmark`. A standalone icon big enough to render as a real visual asset (not a favicon-scale glyph).
  - `favicon` — small icon optimized for browser tab / OS-level use (16-256px range).
- **Company-Name** — Train-Case (Title-Case-Each-Word with hyphens replacing whitespace; non-alphanumeric leading chars stripped). Examples: `Stripe`, `Foundation-Health`, `9am-Health`, `Inne` (from `.inne`), `Thymia` (from `thymia`), `Everyman` (from `EVERYMAN`).
- **ext** — `svg` strongly preferred. `png` if SVG unavailable AND background was stripped. Avoid `jpg` for logos.

**Decision table for which role(s) to save:**

| Brand has… | Save as |
|---|---|
| Only a wordmark (no separate icon) | `trademark__Company-Name.svg` |
| Only an icon (no wordmark) | `trademark__Company-Name.svg` |
| A combined wordmark+icon as one mark | `trademark__Company-Name.svg` |
| A wordmark AND a separate icon | `wordmark__Company-Name.svg` + `appIcon__Company-Name.svg` |
| Plus a favicon (always save when available) | `favicon__Company-Name.svg` (or `.png`/`.ico`) |

**The `logo:` frontmatter field always points to the primary asset** — `trademark__...` if that's what was saved, otherwise `wordmark__...`. The optional `wordmark`, `appIcon`, `favicon` fields are populated only when those specific roles exist.

**Brandfetch detection helper:** in Brandfetch's response, `type=logo` ≈ wordmark (or combined mark), `type=symbol` / `type=icon` ≈ appIcon. The `brandfetch.ts` helper exposes `--save-all` to write each role with the correct filename.

## Slug rules

- Lowercase, kebab-case
- Match the company's canonical short name (`stripe`, `airbnb`, `notion`)
- For ambiguous names, append firm context: `acme-sequoia`
- The CEO file is at `portfolio/{slug}-ceo.md` — `ceo_slug` should be `{slug}-ceo`

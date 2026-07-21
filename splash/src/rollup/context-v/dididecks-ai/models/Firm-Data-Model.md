---
title: "Firm — VC firm / backer firm metadata"
lede: "One firm.md per firm-anchored directory — the metadata about the VC firm that the deck is either authored by or referencing as a backer. Present in calmstorm (single-firm) and chroma (multi-investor) layouts; absent from humain (flat operating-company layout — the operating company IS the firm and its metadata lives in DESIGN.md + the deck content itself, not a firm.md)."
date_authored_initial_draft: 2026-06-07
date_last_updated: 2026-06-07
at_semantic_version: 0.0.1.0
status: As-observed-from-filesystem
applies_to:
  - client-sites/calmstorm-decks
  - client-sites/chroma-decks
not_applicable_to:
  - client-sites/humain-vc-decks (flat operating-company variant — no firm container)
from: "dididecks-ai"
from_path: "context-v/models/Firm-Data-Model.md"
---
# Firm · Data Model

## What this model represents

The VC firm at the top of an anchor cascade. Two cases:

- **Firm-anchored ingest:** the firm is the root, and the cascade walks down through its team → portfolio → portco CEOs. Used when rebuilding the firm's own deck (calmstorm: Calm/Storm Ventures is the firm pitching its own LPs).
- **Company-anchored ingest (credibility-card):** the operating company is the root, and the cascade walks outward through its named backers. Each backer firm gets its own `firm.md` + `team/` + `portfolio/` so reviewers can see the backers as legible entities. Used when an operating company's deck needs to make its investor list visible to readers who don't know those firms (chroma: chroma is the operating company; investors/{bloomberg-beta, air-street-capital, quiet-capital, aix-ventures}/ are its named backers).

Humain doesn't have firm.md files because it's neither pattern — Humain Ventures *is* the firm AND its data layout is flat (`data/team/` + `data/portfolio/`). Humain's firm-level metadata lives in [`DESIGN.md`](../../client-sites/humain-vc-decks/DESIGN.md) (brand) + the deck content itself (mission, strategy).

## Where it lives in the filesystem

| Client | Path pattern |
|---|---|
| `calmstorm-decks` | `data/firms/{firm-slug}/firm.md` (one firm) |
| `chroma-decks` | `data/investors/{firm-slug}/firm.md` (one per backer firm — 4 of these for chroma) |
| `humain-vc-decks` | _absent — no firm.md exists in humain_ |

**Slug convention:** kebab-case; the directory name and the firm.md's frontmatter `slug` MUST match. Examples:

```
data/firms/calm-storm-ventures/firm.md
data/investors/bloomberg-beta/firm.md
data/investors/air-street-capital/firm.md
data/investors/quiet-capital/firm.md
data/investors/aix-ventures/firm.md
```

## The canonical schema

(Combining observed shapes from calmstorm + chroma — they're broadly consistent.)

```yaml
---
slug: calm-storm-ventures           # required; kebab-case; matches dir name
name: "Calm/Storm Ventures"          # required; display name
website: https://calmstorm.vc/
location: "Vienna, Austria"
founded: 2019
focus: "European TechBio + digital health"

# Asset
logo: ./trademark__Calm-Storm-Ventures.svg
logo_format: svg
logo_source: https://calmstorm.vc/

# Aggregate counts (provenance helper — these are derived from the team/ + portfolio/ subdirs at ingest time)
team_count: 12
portfolio_count: 47
portco_ceo_count: 23

# Provenance
sources: [...]                       # calmstorm
source_urls: [...]                   # chroma
fetched_at: 2026-05-10T00:00:00Z     # or ingested_at for chroma
confidence: high
status: complete                     # or resolved (chroma)
---

# Free-form markdown body — firm's positioning, thesis, fund structure, anything that doesn't fit a column.
```

## Per-client variations

| Field | Calmstorm | Chroma |
|---|---|---|
| Provenance | `sources` | `source_urls` |
| Temporal | `fetched_at` (datetime) | `ingested_at` (date) |
| Status | `complete` | `resolved` |
| Asset path prefix | `./` | bare |

Same pattern as Person + Company — calmstorm's older shape vs. chroma's rewrite. No need to retrofit; carry both shapes.

## How the shell consumes Firm rows

**There is no `/data-assets/firms` route in the shell** as of 2026-06-07. The firm container is consumed only *implicitly*:

- `/data-assets/people` route reads `firm_slug` on each Person row to group rows by firm
- `/data-assets/companies` route does the same for Company rows
- The audit pages (and possibly future "firm overview" pages) may eventually render the firm.md content itself, but that route doesn't exist yet

**This means:** the Firm model is more "namespace" than "queryable entity" today. The DB column for Firm primarily exists so Person + Company rows can foreign-key into it for grouping. Carrying the firm.md body content (positioning prose) is optional — useful for future firm-detail pages but not load-bearing yet.

## What's load-bearing

- **`slug`** — primary key; matches the directory name; what Person + Company rows FK into via `firm_slug`
- **`name`** — display name in any future firm-detail rendering

Everything else is nice-to-have.

## Translation to a remote DB

### Prisma schema sketch

```prisma
model Firm {
  // Identity
  id          String   @id @default(cuid())
  slug        String                          // kebab-case; matches dir name
  engagement  String                          // calmstorm-decks | chroma-decks
  // (humain has no Firm rows; if it ever wanted to record its own firm-level
  //  metadata structurally, a synthetic row with slug = humain-ventures would
  //  work — but humain's metadata currently lives in DESIGN.md and isn't
  //  schematized here.)

  // Anchor type
  anchor_type String                          // "firm-anchored" (the firm pitches itself) |
                                              // "company-anchored-backer" (the firm is a backer
                                              //  of the operating company doing the pitch)

  // Core
  name        String
  website     String?
  location    String?
  founded     Int?
  focus       String?

  // Asset
  trademark_path   String?
  trademark_format String?
  trademark_source String?

  // Aggregate counts (denormalized; refreshed on sync)
  team_count        Int @default(0)
  portfolio_count   Int @default(0)
  portco_ceo_count  Int @default(0)

  // Provenance + lifecycle
  status      String?
  confidence  String?
  ingested_at DateTime?
  source_urls String[]
  notes       String?  @db.Text

  // Body
  body_markdown String? @db.Text

  // Full frontmatter capture
  raw_frontmatter Json?

  // Relations
  people    Person[]  @relation("FirmPeople")
  companies Company[] @relation("FirmCompanies")

  @@unique([engagement, slug])
  @@index([engagement, anchor_type])
}
```

### Anchor type — important

The two anchor types describe *what role the firm plays in this engagement*:

- `firm-anchored`: this firm authored / is pitching from this deck (calmstorm's only firm; chroma has none — chroma is the operating company itself)
- `company-anchored-backer`: this firm is named in the deck as a backer of the operating company (chroma's 4 investor firms)

The DB column is useful because the same firm name can play different roles in different engagements (e.g., Bloomberg Beta is `company-anchored-backer` in chroma's deck, but would be `firm-anchored` in their own deck if they ever had one in this system).

## Open questions for the collaborator

1. **Should there be a `/data-assets/firms` route?** Today the audit pages only surface People + Companies; Firms are namespaces. If reviewers want to audit firm-level data (logos missing, firm.md descriptions incomplete), a third route would be the place. Recommendation: skip for now; revisit if the audit need actually materializes.

2. **Should humain get a synthetic Firm row?** Humain has no firm.md file but it IS a firm. If the DB enforces `Person.firm_slug` non-null for `role_class = managing-partner`, humain would need a placeholder Firm row with `slug = humain-ventures`. Recommendation: yes — synthesize on humain sync; keep the row's body fields minimal (slug + name + anchor_type = firm-anchored).

3. **Cross-engagement deduplication for firms:** if Bloomberg Beta appears as a backer in chroma AND ever appears in a different deck's investor list, one Firm row or two? Recommendation: one canonical Firm per (firm-name) + many engagement-rows that reference it. But that's a `CanonicalFirm` separate from `Firm` — defer until the second engagement creates the duplication.

4. **Body markdown — store or skip?** The firm.md body is currently mostly unused by routes. Carrying it in DB is cheap (a `Text` column) and lets future firm-detail pages render without re-fetching the .md. Recommendation: carry it.

## See also

- [`Person-Data-Model.md`](./Person-Data-Model.md) — Person rows FK into Firm via `firm_slug`
- [`Company-Data-Model.md`](./Company-Data-Model.md) — Company rows FK into Firm via `firm_slug`
- `context-v/agent-skills/crawl-fetch-ingest/schema/firm.md` — upstream skill's firm schema
- `context-v/agent-skills/crawl-fetch-ingest/SKILL.md` § "Anchor types — two starting points, same cascade" — full anchor model

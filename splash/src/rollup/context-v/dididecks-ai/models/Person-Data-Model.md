---
title: "Person — team members, advisors, portfolio CEOs"
lede: "One markdown file per person, with sibling-colocated headshot. The `role_class` field discriminates the person's relationship to the firm — vc-team, managing-partner, advisor, portco-ceo, etc. — and the shell's /data-assets/people route surfaces everything via a single glob across both team/ and portfolio/ directories."
date_authored_initial_draft: 2026-06-07
date_last_updated: 2026-06-07
at_semantic_version: 0.0.1.0
status: As-observed-from-filesystem
applies_to:
  - client-sites/calmstorm-decks
  - client-sites/chroma-decks
  - client-sites/humain-vc-decks
schema_authority: apps/deck-shell/src/routes/data-assets/people.astro (the route that reads the frontmatter — its reader is the de facto schema enforcer)
from: "dididecks-ai"
from_path: "context-v/models/Person-Data-Model.md"
---
# Person · Data Model

## What this model represents

A natural person — VC team member, advisor, founder testimonial-giver, portfolio-company CEO. One `.md` file per person; sibling-colocated headshot (`.png` / `.jpg` / `.avif` / `.webp`). The `role_class` frontmatter field is what tells the shell *how* this person relates to the deck — there is no separate "team table" vs. "CEO table"; it's one shape, discriminated by role.

## Where it lives in the filesystem

| Client | Path pattern |
|---|---|
| `calmstorm-decks` | `data/firms/{firm-slug}/team/{person-slug}.md` |
| `chroma-decks` | `data/investors/{firm-slug}/team/{person-slug}.md` + `data/team/{person-slug}.md` (flat fallback for the operating-company's own team) |
| `humain-vc-decks` | `data/team/{person-slug}.md` (operating-company variant) + `data/portfolio/{company-slug}-ceo.md` (CEO is a person stored next to the company) |

**Naming convention:** kebab-case slug; `.md` extension. Headshot is `{same-slug}.{ext}` colocated.

CEO files use a `{company-slug}-ceo.md` filename convention (humain) OR a separate `{co-slug}-ceo.md` next to the parent `{co-slug}.md` (also humain). Calmstorm uses `{slug}-ceo.md` in the portfolio dir too; chroma keeps CEO-like roles in the firm's `team/` dir with `role_class: advisor` or similar.

## The canonical schema (current — chroma + humain convention)

```yaml
---
name: "Aneil Mallavarapu, PhD"      # required; display name
slug: aneil-mallavarapu              # required; kebab-case; filename stem
role_class: managing-partner         # required; see role_class enum below
title: "Managing Partner & Co-Founder"   # required; the person's job title at the org
org: "Humain Ventures"               # required; the org the person belongs to
firm_slug: humain-ventures           # optional; FK to firm.md if firm-anchored
company_slug:                        # optional; FK to portfolio company (CEOs only)
deck_role_label: "Managing Partner"  # optional; the label the deck PDF used (preserved for fidelity)

# Contact links — all optional, all flat strings (no nested array)
linkedin: "https://www.linkedin.com/in/amallavarapu"
twitter: ""
github: ""
website: "https://www.humain.vc/"

# Assets — colocated files
headshot: "aneil-mallavarapu.png"    # filename, sibling to this .md
headshot_source_url: "https://..."   # upstream URL for refresh

# Body fields
bio_short: "Mathematical biologist…"  # 1-2 sentence summary the table column renders
location: "Austin, TX"

# Optional nested arrays — newer convention (humain, partial chroma)
education:
  - institution: "University of California, San Francisco"
    degree: "PhD"
honors:
  - "Council of Systems Biology Technology Award"

# Provenance + lifecycle
status: resolved                     # resolved | flagged | unresolved
confidence: high                     # high | medium | low | flagged
ingested_at: 2026-06-06              # YYYY-MM-DD
source_urls:
  - "https://www.humain.vc/"
  - "https://www.linkedin.com/in/amallavarapu"
notes: "free-form authoring notes"
---

# Free-form markdown body — long-form bio, career arc, deck appearance.
```

### Older schema (calmstorm) — preserved for backward compatibility

Calmstorm came first and uses different field names for the same concepts. **Do not retrofit**:

```yaml
---
name: "Ekaterina Gianelli"
slug: ekaterina-gianelli
title: "Venture Partner"
deck_role_label: "Partner"
role_class: vc-team
firm_slug: calm-storm-ventures

# Contact links — NESTED ARRAY (calmstorm only)
profiles:
  - type: firm-bio
    url: https://...
  - type: linkedin
    url: https://...

# Assets — same as new
headshot: ./ekaterina-gianelli.png   # note the ./ prefix (older Astro pattern)
headshot_source: https://...         # NOTE: `_source` not `_source_url`

# Body fields
bio_short: "..."

# Older-schema-only fields
prior_roles:
  - title: "..."
    org: "..."

# Provenance
sources: [...]                       # NOTE: `sources` not `source_urls`
fetched_at: 2026-05-10T00:00:00Z     # NOTE: ISO datetime not date
confidence: high
status: complete                     # NOTE: `complete` not `resolved`
---
```

## `role_class` enum (current set)

| Value | Used by | Meaning |
|---|---|---|
| `vc-team` | calmstorm | Core team member at a VC firm (Managing Partner, Partner, Associate) |
| `managing-partner` | humain | More specific than `vc-team`; the GP tier specifically |
| `venture-partner` | calmstorm | Part-time / non-employee venture partner |
| `operating-partner` | (latent) | Operating expertise role |
| `entrepreneur-in-residence` | (latent) | EIR |
| `supporting-partner` | calmstorm | Calmstorm's term for their mentor network |
| `advisor` | chroma | External advisor / board member; people the deck names but the firm doesn't list publicly |
| `portco-ceo` | humain | CEO of a portfolio company |
| `external` | (latent) | Catch-all when no clearer category fits |

The full enum lives in `~/.claude/skills/crawl-fetch-ingest/schema/person.md` (also copied to `context-v/agent-skills/crawl-fetch-ingest/schema/person.md`). The shell's `/data-assets/people` route doesn't enforce the enum — it just renders the value verbatim — so the column should be a string, not a strict enum, in the DB.

## Per-client variations (and why)

| Field | Calmstorm | Chroma | Humain |
|---|---|---|---|
| Contact links | nested `profiles[]` | flat `linkedin`/`twitter`/`github`/`website` | flat (same as chroma) |
| Headshot path prefix | `./prefix` (relative-explicit) | bare filename | bare filename |
| Headshot source field | `headshot_source` | `headshot_source_url` | `headshot_source_url` |
| Provenance list | `sources` | `source_urls` | `source_urls` |
| Temporal | `fetched_at` (ISO datetime) | `ingested_at` (date) | `ingested_at` (date) |
| Status enum | `complete`/`flagged` | `resolved`/`flagged`/`unresolved` | `resolved`/`flagged`/`unresolved` |
| Prior roles | `prior_roles[]` | (absent) | (absent) |
| Education | (absent) | (absent — for advisors) | `education[]` |
| Honors | (absent) | (absent) | `honors[]` |

**Why the variation:** chroma's schema is a deliberate rewrite. After authoring calmstorm, the operator (Michael) found the nested `profiles[]` shape annoying to query and inconsistent (people had different combinations of profile types). The flat-string rewrite at chroma made the rows uniformly queryable. Humain inherited chroma's shape on day one.

**Translation implication:** both shapes need to ingest. Either denormalize calmstorm's `profiles[]` into the same flat columns on ingest, or carry the original frontmatter as a `Json` column and project on read.

## How the shell consumes Person rows

**Route:** `apps/deck-shell/src/routes/data-assets/people.astro`

**Discovery glob:** `import.meta.glob("/data/**/{team,portfolio}/*.md", { eager: true, query: "?raw", import: "default" })`

**Filter applied:** rows where `frontmatter.role_class` is set. (Companies — see Company-Data-Model — also live under `portfolio/`, distinguished by the *absence* of `role_class`.)

**Fields the route reads** (the de facto schema-enforcement layer):

```
name · slug · role_class · title · org · deck_role_label
linkedin · twitter · github · website
headshot · headshot_source_url (falls back to headshot_source if absent)
firm_slug · company_slug
bio_short · status · confidence
```

Any field NOT in the above list is preserved in the source `.md` but not rendered by the audit route. (Some routes — like `DeckStatsPanel` — also only count, not read.)

## What's load-bearing

- **`slug`** — primary key; filename stem; URL fragment in some routes
- **`role_class`** — discriminator between Person and Company on the same `data/**/portfolio/*.md` glob
- **`headshot` field + colocated file** — the asset-discovery glob is `*.{png,jpg,jpeg,webp,avif,svg}` in the same directory; if the field points at a missing file, the asset row gets a dash in the audit table
- **`firm_slug` / `company_slug`** — FK; without these the cross-reference back to firm/company doesn't render

## Translation to a remote DB

### Prisma schema sketch

```prisma
model Person {
  // Identity
  id          String   @id @default(cuid())
  slug        String                          // kebab-case; per-engagement unique
  engagement  String                          // which client-site (calmstorm-decks, chroma-decks, humain-vc-decks)

  // Core
  name        String
  title       String?
  org         String?
  role_class  String                          // free-form enum; not strict-enum to allow new values

  // Discriminators / FKs
  firm_slug    String?                        // FK to Firm.slug (nullable for flat operating-company variant)
  company_slug String?                        // FK to Company.slug (set for portco-ceo)
  deck_role_label String?                     // the deck PDF's verbatim label

  // Contact (chroma+humain shape — flat)
  linkedin    String?
  twitter     String?
  github      String?
  website     String?

  // Assets
  headshot_path        String?                // filename relative to person's .md dir
  headshot_source_url  String?

  // Body
  bio_short   String?  @db.Text
  location    String?

  // Provenance + lifecycle
  status      String?                         // resolved | flagged | unresolved | complete (calmstorm)
  confidence  String?                         // high | medium | low | flagged
  ingested_at DateTime?                       // ingested_at (chroma+humain) OR fetched_at (calmstorm)
  source_urls String[]                        // unified — denormalized from calmstorm's `sources`
  notes       String?  @db.Text

  // Calmstorm-shape preserved (nested arrays — carry as JSON)
  profiles_legacy Json?                       // nested {type, url}[] — calmstorm only
  prior_roles     Json?                       // nested {title, org}[]

  // Humain-shape preserved (nested arrays — carry as JSON)
  education       Json?                       // nested {institution, degree, years?, notes?}[]
  honors          Json?                       // string[]

  // Full frontmatter capture (lossless ingest, for keys not yet columnized)
  raw_frontmatter Json?

  @@unique([engagement, slug])
  @@index([engagement, role_class])
  @@index([firm_slug])
  @@index([company_slug])
}
```

### Key decisions encoded above

1. **One table, discriminated by `role_class`** — matches the filesystem's single-glob discovery. Don't split into separate Team / Advisor / CEO tables.
2. **`engagement` column on every row** — separates the three client-sites (and any future ones). Globally-unique slugs would be brittle; per-engagement uniqueness matches the filesystem.
3. **`raw_frontmatter` JSON column** — captures everything not explicitly columnized, so we never silently lose data on ingest.
4. **`profiles_legacy` + `prior_roles` + `education` + `honors` as Json** — accommodates the per-client array shapes without forcing normalization.
5. **`role_class` as string** — accepts new values (next client may invent another role type). The enum lives in the skill schema, not in the DB.

## Open questions for the collaborator

1. **CEO storage:** humain stores `portco-ceo` rows in `data/portfolio/`. Should the DB carry a separate `CompanyCEO` table for clarity, or keep them in the `Person` table with `role_class = portco-ceo`? Filesystem says the latter. Recommendation: keep one table; query layer can filter.

2. **Headshot binary:** the actual image file lives on disk colocated with the .md. Does the DB store a reference URL (CDN path, S3 key), or also a `bytes` column? Recommendation: URL-only — let the static-asset pipeline (Vercel / Cloudflare / Bunny) handle binary delivery. The DB only needs the path so renderers can construct URLs.

3. **Confidence + status semantics:** these mean similar things but use different enums (calmstorm `complete`/`flagged`; chroma+humain `resolved`/`flagged`/`unresolved`). Pick a canonical enum, but on read also accept the legacy values. Recommendation: canonical = chroma+humain enum; calmstorm `complete` → `resolved` mapping on ingest.

4. **Cross-engagement uniqueness:** what if Linda Avey appears in *both* humain (her firm) and chroma's investor card (if Humain ever backs chroma)? Two rows or one? Recommendation: two rows, with a `canonical_person_id` FK that lets them link if/when needed. Cross-engagement de-dup is a separate problem.

5. **Versioning of the .md → DB sync:** when a .md file changes upstream, how does the DB pick that up? Recommendation: `ingested_at` is the watermark; the sync rebuilds rows whose source .md's mtime is newer than `ingested_at`.

## See also

- [`Company-Data-Model.md`](./Company-Data-Model.md) — the sibling shape that also lives in `data/**/portfolio/`
- [`Firm-Data-Model.md`](./Firm-Data-Model.md) — the firm container that `firm_slug` references
- [`Brand-Assets-and-Discovery-Globs`](./Company-Data-Model.md#brand-assets-and-discovery-globs) — colocated headshot + logo naming
- `context-v/agent-skills/crawl-fetch-ingest/schema/person.md` — the upstream skill's schema spec (authoritative for `role_class` enum)

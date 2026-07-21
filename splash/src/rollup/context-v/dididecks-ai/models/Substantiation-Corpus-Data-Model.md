---
title: "Substantiation corpus — source decks, intake material, raw assets"
lede: "The deliberately-not-tracked-by-git layer. Founder-supplied PDFs, page-burst PNGs, memopop-generated memos, brand-asset libraries, raw scraped HTML. Lives at <client>/corpus/ (gitignored) per the chroma pattern. A parent-level dddecks-corpus submodule was newly stood up on 2026-06-07 to give the team a private home for cross-engagement substantiation. The DB doesn't store this content — it's blob-on-disk by design — but should track references."
date_authored_initial_draft: 2026-06-07
date_last_updated: 2026-06-07
at_semantic_version: 0.0.1.0
status: As-observed-from-filesystem
applies_to:
  - client-sites/chroma-decks
  - client-sites/humain-vc-decks
  - client-sites/calmstorm-decks (corpus dir absent on disk — no substantiation captured for calmstorm yet)
  - dididecks-ai/corpus (new — dddecks-corpus submodule mounted 2026-06-07)
runtime_mutability: low (mostly authored at ingest time; appended as new substantiation lands)
storage: "Local filesystem only — gitignored at the per-client level; tracked at the parent corpus/ submodule level"
from: "dididecks-ai"
from_path: "context-v/models/Substantiation-Corpus-Data-Model.md"
---
# Substantiation Corpus · Data Model

## What this model represents

The **content the deck is built from but doesn't itself contain**:

- Founder-supplied PDFs (the input deck for redesign work)
- Page-burst PNGs (each PDF page rasterized for slide-by-slide reference)
- Memopop-generated memos (research outputs that fed the deck — chroma)
- Brand-asset libraries (the raw versions of company logos before trademark cascade selected one)
- Scraped HTML / cached API responses (the upstream source of truth for any "we ingested it from their site" data)

This material is large (PDFs + image bursts), sometimes confidential (founder material under NDA), and changes infrequently (a redesign starts with one source deck and that PDF doesn't churn). All four properties argue against tracking it in git inside the per-client client-site repo — and the chroma + humain conventions consistently gitignore it.

## Where it lives

| Client | Path | Tracked? |
|---|---|---|
| `calmstorm-decks` | `corpus/` | _absent — never created on disk_ |
| `chroma-decks` | `corpus/` | gitignored (in `.gitignore`) |
| `humain-vc-decks` | `corpus/` | gitignored |
| **dididecks-ai (parent)** | **`corpus/`** | **NEW — submodule of `https://github.com/lossless-group/dddecks-corpus` (private), mounted 2026-06-07** |

### Per-client corpus layout (chroma + humain)

**Chroma (`chroma-decks/corpus/`):**
```
corpus/
├── management-supplied/         # founder/team-supplied source decks, contracts, drafts
│   └── 2026-05-11_Chroma-Series-A_MS-Resort.pdf
└── memos/                       # memopop-generated research memos by content version
    └── ChromaDB-v0.0.6/
        ├── 1-research/
        ├── 2-sections/
        ├── 2-tables/
        └── 3-source-catalog/
```

**Humain (`humain-vc-decks/corpus/`):**
```
corpus/
├── management-supplied/
│   └── 2025-10-17_Humain-Deck-VCLab.pdf       # the input PDF from VC Lab cohort
└── intake-bursts/                              # page-by-page PNG rasterization of the input PDF
    ├── page-01.png
    ├── page-02.png
    ├── …
    └── page-29.png
```

### The new parent-level `corpus/`

Just stood up — see [`changelog/2026-06-07_01.md`](../../changelog/) (when authored) for the rationale. The repo at `https://github.com/lossless-group/dddecks-corpus` currently has only a README stub; content shape TBD as the first engagements migrate their corpus material up to a place where the team (not just one operator's local filesystem) can see it.

**Mounting pattern** (in `dididecks-ai/.gitmodules`):

```
[submodule "corpus"]
	path = corpus
	url = https://github.com/lossless-group/dddecks-corpus.git
	branch = development
```

## The implicit "schema" — naming conventions

Corpus material doesn't carry frontmatter. The discipline is filename:

| Convention | Used for | Example |
|---|---|---|
| `YYYY-MM-DD_{Descriptive-Title}.{ext}` | dated source material (decks, contracts, memos) | `2026-05-11_Chroma-Series-A_MS-Resort.pdf` |
| `page-NN.png` | PDF page bursts (zero-padded `01`, `02`, …, `29`) | `page-17.png` (slot 17's intake source content) |
| `{descriptive-slug}.{ext}` | anything else; freeform | `whitepaper-draft.docx` |

ISO date prefix is the load-bearing pattern — lets bursts and source decks sort chronologically and lets the agent quickly find "the latest version of this".

## How the shell consumes this — it doesn't

**The shell never reads corpus material at runtime.** Corpus is purely authoring-side substrate:

- An agent (or a human) opens `corpus/management-supplied/*.pdf` to extract slot-by-slot content during deck authoring (the humain deck authoring used `corpus/intake-bursts/page-NN.png` references in slot section comments)
- An agent runs `pdftoppm` to rasterize a PDF into `corpus/intake-bursts/`
- An agent might cross-reference `corpus/memos/{ContentVersion}/3-source-catalog/` when claim-checking content

**Nothing in `apps/deck-shell/` globs corpus paths.** This is deliberate — the production deck mustn't carry corpus material into the build output.

## What's load-bearing

- **The `corpus/` directory name** — gitignore patterns reference it; future tools may glob it; convention is uniform across all three clients.
- **Gitignore at the client-site level** — every client's `.gitignore` has `corpus/` listed. Without that, founder PDFs would inadvertently land in git history.
- **The parent submodule mount path = `corpus/`** — matches the convention. New collaborators expect `corpus/` to exist whether they're in a client-site or the parent.

## Translation to a remote DB — mostly: don't

This model is the **deliberate counter-example** to "everything should be in the DB." The corpus is binary blobs (PDFs, PNGs, HTML, raw API JSON) — they belong on disk (or in S3 / Bunny / a CDN), not in a relational DB. The DB's role here is to **reference** corpus material, not store it.

### What the DB SHOULD store: pointers

```prisma
model CorpusItem {
  id          String   @id @default(cuid())
  engagement  String                          // calmstorm-decks | chroma-decks | humain-vc-decks | (parent for dddecks-corpus-only items)

  // Path within the corpus tree (relative to <engagement>/corpus/ or dddecks-corpus/)
  path        String                          // e.g. "management-supplied/2025-10-17_Humain-Deck-VCLab.pdf"

  // Classification
  kind        String                          // "management-supplied" | "intake-burst" | "memo" | "brand-asset" | "scrape-cache" | …
  format      String                          // "pdf" | "png" | "html" | "docx" | "json" | …
  size_bytes  BigInt?

  // Metadata
  title       String?
  description String?  @db.Text
  source_url  String?                         // if this is a download of something, where it came from
  source_date DateTime?                       // the date prefix in the filename (when applicable)

  // Provenance
  added_at    DateTime @default(now())
  added_by    String?                         // who added it (Identity.id or freeform)

  // Storage (where the bytes actually live — pluggable backend)
  storage_backend String                      // "local-fs" | "s3" | "bunny" | "github-private" | …
  storage_uri     String                      // backend-specific reference: "file:///…", "s3://bucket/key", "https://github.com/…/raw/…"

  // Lifecycle
  superseded_by String?                       // if this corpus item was replaced by a newer version

  @@unique([engagement, path])
  @@index([engagement, kind])
  @@index([source_date])
}
```

### Why pointer-only, not bytes-in-DB

1. **Bytes don't query.** You'll never `SELECT … WHERE pdf_contents LIKE '%macrocycle%'` against a 5MB PDF. Indexable PDF content lives in a separate full-text-search index (Postgres' `tsvector`, Elasticsearch, a vector store) — and gets *derived from* the corpus, not stored in DB-cells.
2. **Bytes inflate backups.** Per-row DB backups are expensive for blob rows. Object storage is the right backend.
3. **Bytes break replication.** Turso (and most managed Postgres) impose row-size limits that PDFs blow past.
4. **Confidentiality boundaries differ.** Some corpus material is under NDA and shouldn't replicate to read-replicas in other regions. Object storage with per-key ACLs handles this cleanly; DB-cell rows don't.

### Derived corpus — full-text indexing (future)

When the team wants "search the corpus" — that's a separate data flow:

1. PDF bytes live in storage backend
2. A worker extracts text → stores in a `CorpusExcerpt` table (page-keyed) with a `tsvector` column for FTS
3. Or: text gets embedded → stored in a vector store (already we have Chroma DB running for the Lossless corpus per ai-labs CLAUDE.md)

For now: no FTS layer. Corpus is browse-by-filename, no in-DB search.

## Open questions for the collaborator

1. **Storage backend choice:** local-fs (current) doesn't scale across collaborators. Recommendation: S3 (or Cloudflare R2, or Bunny) with per-engagement bucket prefixes. The new `dddecks-corpus` submodule is currently git-backed which is OK for small things but bad for binary churn — eventually corpus files should move to object storage with `dddecks-corpus` carrying only the index / metadata.

2. **Per-client vs parent-level corpus — when does material migrate up?** The `<client>/corpus/` directories are private to one operator's local filesystem (gitignored). The parent `dddecks-corpus` submodule is the team-visible home. Recommendation: anything the team wants to review collaboratively migrates up; one-off operator-only material stays in client-site `corpus/`. The distinction is "team-shared substrate" vs "personal scratch."

3. **CorpusItem index ingestion:** when a new PDF lands in `corpus/management-supplied/`, who updates the DB? Recommendation: a `pnpm corpus:sync` script that walks the corpus tree and upserts CorpusItem rows. Trigger on commit hook in `dddecks-corpus`; trigger on local-FS event in per-client.

4. **Should `Person.headshot_path` and `Company.trademark_path` reference CorpusItem?** Today those are just relative filenames in `data/team/` and `data/portfolio/` — separate from corpus. Recommendation: keep them separate. Headshots + brand assets are the *output* of the crawl-fetch-ingest cascade; the *input* (raw scraped material) is corpus. Different lifecycle.

5. **Retention / cleanup:** corpus items rarely get deleted (substantiation is a permanent record of what the deck was built on), but stale memo versions and intermediate scrape caches can churn. Recommendation: `superseded_by` column lets new versions of a memo / scrape point at older ones; the older ones stay queryable but render as "historical" in any UI.

## See also

- `corpus/README.md` (root of dididecks-ai, post-2026-06-07) — explains why the parent corpus submodule exists
- Per-client `.gitignore` files — confirm `corpus/` is on every client's ignore list
- `apps/deck-shell/` — verify nothing globs corpus paths
- `context-v/agent-skills/crawl-fetch-ingest/cache/` — the **other** kind of cache (per-firm API response cache; lives in the agent-skill's directory, NOT in the deck's corpus)

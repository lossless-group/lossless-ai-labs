---
title: "Data + content models in dididecks-ai (as-observed-from-filesystem)"
lede: "A reference set for a collaborator designing the remote database. We've been using the local filesystem as a polyglot data store across calmstorm-decks, chroma-decks, and humain-vc-decks — different shapes per client, but with recoverable patterns. This directory documents what the patterns actually are so the remote DB design doesn't have to be guessed at."
date_authored_initial_draft: 2026-06-07
date_authored_current_draft: 2026-06-07
date_first_published: 2026-06-07
date_last_updated: 2026-06-07
at_semantic_version: 0.0.1.0
status: Initial-Draft
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Data-Model-Index
authors:
  - Michael Staton
from: "dididecks-ai"
from_path: "context-v/models/README.md"
---
# Data + content models · dididecks-ai

This folder documents how the three live client-sites — `calmstorm-decks`, `chroma-decks`, `humain-vc-decks` — use the local filesystem as a data store. The motivating problem: **a collaborator is designing a remote database and has been guessing at shapes**. The guessing produces friction. This folder replaces the guessing with verbatim filesystem evidence — frontmatter schemas, directory layouts, discovery globs, runtime mutation semantics — plus a translation sketch (Prisma-style or SQL DDL) per model so each can be lifted into a remote DB without re-deriving it from code.

## How to read this

Each file follows the same structure:

1. **What this model represents** — the entity in plain language
2. **Where it lives in the filesystem** — exact paths, per client, with variations called out
3. **The canonical schema** — frontmatter or TS interface, verbatim from a representative file
4. **Per-client variations** — calmstorm vs chroma vs humain, with hypothesized reasons
5. **How the shell consumes it** — which routes / glob patterns surface this data
6. **What's load-bearing** — which fields can't be dropped without breaking something
7. **Translation to a remote DB** — concrete Prisma / SQL DDL sketch
8. **Open questions** — decisions the collaborator needs to make that the filesystem doesn't pin down

## The models

| File | Entity | Storage today | Volatility |
|---|---|---|---|
| [`Person-Data-Model.md`](./Person-Data-Model.md) | Team members, advisors, portfolio CEOs | `data/**/{team,portfolio}/*.md` + sibling headshot | Append-mostly; bio refreshes |
| [`Company-Data-Model.md`](./Company-Data-Model.md) | Portfolio companies + brand assets | `data/**/portfolio/*.md` + sibling logos/favicons | Append-mostly; asset refreshes |
| [`Firm-Data-Model.md`](./Firm-Data-Model.md) | VC firm / backer firm metadata | `data/**/firms/{slug}/firm.md` (calmstorm) · `data/investors/{slug}/firm.md` (chroma) | Stable per engagement |
| [`Deck-Variant-Slot-Registry-Data-Model.md`](./Deck-Variant-Slot-Registry-Data-Model.md) | Decks, variants, slots — the deck-OS spine | TypeScript modules: `src/data/decks.ts` + `src/data/slides.ts` | Edited at authoring time |
| [`Slide-Audit-Registry-Data-Model.md`](./Slide-Audit-Registry-Data-Model.md) | Per-slot review ratings (4-state, dual-surface) | `data/audits/slides.json` | **Runtime-mutable** via `/api/slide-rank` |
| [`Auth-Surface-Data-Model.md`](./Auth-Surface-Data-Model.md) | Identity, Session, Token, Organization, Membership | `astro:db` (libSQL local · Turso remote) — `db/config.ts` | Runtime-mutable; append-only AuthEvent log |
| [`Engagement-Telemetry-Data-Model.md`](./Engagement-Telemetry-Data-Model.md) | PageView, Action — reader-behavior log | `astro:db` (same DB as auth) | Runtime-mutable; append-only |
| [`Substantiation-Corpus-Data-Model.md`](./Substantiation-Corpus-Data-Model.md) | Source decks, intake material, brand-asset libraries | `<client>/corpus/` (gitignored) · `dddecks-corpus` submodule (newly stood up) | Append-mostly; private |

## What's NOT in this folder

- **Component source code** — `src/components/slides/{variant}/{slot}-{slug}.astro` files are *renderers*, not data. They consume from the data layer documented here but they themselves are pure Astro markup. Not a model.
- **Theme tokens** — `src/styles/theme.css` is design-system runtime, not data. Documented in each client's `DESIGN.md` (Stitch-spec frontmatter).
- **The deck-shell itself** — the registry-loader, the `/data-assets/*` routes, the `DeckMatrix` and friends. Documented in `apps/deck-shell/` directly. The shell *consumes* every model in this folder.

## Translation philosophy — read first

A few decisions worth surfacing before the collaborator commits to a schema:

### 1. The filesystem is currently the source of truth; the DB will be a *projection* of it

The shell discovers data primarily via Vite globs (`/data/**/{team,portfolio}/*.md`). The .md files carry frontmatter that the routes read. A remote DB doesn't replace the .md files — it *projects* them so a query layer can index, filter, and join across engagements. The .md files stay where they are; the DB is denormalized read-side.

This means: **prefer a DB that can hold the full frontmatter as a typed JSON column alongside the columns that need indexing.** A Postgres `jsonb` column or Prisma's `Json` field is the natural fit. Don't shred every frontmatter key into a SQL column — only the keys that need filter/sort/join.

### 2. There are three layouts (single-firm-anchored, multi-investor, flat operating-company) and they all need to coexist

| Layout | Used by | Shape |
|---|---|---|
| Single-firm-anchored | `calmstorm-decks` | `data/firms/{firm-slug}/{team,portfolio,firm.md}` |
| Multi-investor (credibility cards) | `chroma-decks` | `data/investors/{firm-slug}/{team,portfolio,firm.md}` |
| Flat operating-company | `humain-vc-decks` | `data/{team,portfolio}/*.md` (no firm container — the operating company IS the firm) |

The shell handles all three via the same `data/**` glob. **The DB should also handle all three** — most easily via a nullable `firm_slug` column on Person and Company rows. When `firm_slug` is null, the entity is owned by the deck's operating company directly; when set, the entity is owned by a named firm (an investor for chroma, the firm for calmstorm).

### 3. Schema versioning is a thing — calmstorm is the older shape, chroma is newer, humain is newest

Each client converged on a slightly different schema for the same entity (Person, Company). The chronology matters: calmstorm was first and uses a `profiles[]` nested array for contact links; chroma rewrote it as flat columns (`linkedin`, `twitter`, `github`, `website`); humain inherited chroma's shape and added `education[]` + `honors[]` arrays for credentials.

**Don't try to retrofit calmstorm to the newer shape on ingest.** Carry both shapes in the DB and let the query layer normalize on read. The newer shape is what new clients should write; the older shape is a frozen historical record.

### 4. Some data is runtime-mutable; most is not

| Mutability | Models |
|---|---|
| **Static** (edited only at authoring time) | Person, Company, Firm, Deck-Variant-Slot-Registry, Substantiation |
| **Runtime-mutable** (POSTed from a UI / API) | Slide-Audit-Registry, Auth-Surface, Engagement-Telemetry |

The remote DB needs write APIs only for the runtime-mutable models. The static ones can be loaded from disk on each deploy and projected into the DB as a one-way sync; reads from the DB will then be O(1) instead of O(globs).

### 5. The shell's discovery globs are the contract

Anything the shell renders, it renders by globbing the filesystem. Specifically:

| Shell surface | Glob it reads |
|---|---|
| `/data-assets/people` route | `/data/**/{team,portfolio}/*.md` (filtered to entries with `role_class` set) |
| `/data-assets/companies` route | `/data/**/portfolio/*.md` (filtered to entries with NO `role_class`) |
| `DeckStatsPanel` (landing) | Same two globs as above for the counts |
| `DeckMatrix` (landing + `/toc/[deck]`) | `data/audits/slides.json` + the per-slide-file `import.meta.glob` |

If the DB sync changes the discovery semantics (e.g., a Company row exists in the DB but its .md isn't on disk), the shell routes will silently miss it. **The DB sync must remain a faithful projection of the filesystem, not a divergent source of truth.** When the team decides to flip authoritative source from filesystem to DB, that's a separate, intentional migration — not a side effect of standing up the DB.

## Status

Initial draft, 2026-06-07. All schemas captured from the live filesystem as of that date. The collaborator should treat this as a snapshot — the schemas continue to evolve, and any specific decisions called out as "open questions" in each model file want her input.

## Versioning

Files in this folder carry their own `at_semantic_version` in frontmatter per the [`context-vigilance`](../agent-skills/context-vigilance/SKILL.md) discipline (epoch.major.minor.patch). Bump appropriately when a model's structure changes — not just when the filesystem evidence updates.

---
title: "Slide audit registry — per-slot dual-surface review ratings"
lede: "The only runtime-mutable data model in the filesystem. A single JSON file per client stores reviewer ratings per (variant, slot) cell, separately for Scroll-UI and Play-UI, mutated by the shell's /api/slide-rank POST endpoint as reviewers click the rating pill in the deck overlay."
date_authored_initial_draft: 2026-06-07
date_last_updated: 2026-06-07
at_semantic_version: 0.0.1.0
status: As-observed-from-filesystem
applies_to:
  - client-sites/calmstorm-decks
  - client-sites/chroma-decks
  - client-sites/humain-vc-decks
schema_authority:
  - apps/deck-shell/src/registry-loader.ts → loadAuditRegistry() / writeAuditRegistry()
  - apps/deck-shell/src/routes/api/slide-rank.ts
  - apps/deck-shell/src/types/index.ts → AuditRegistry / RankEntryV2 / SurfaceRankEntry
runtime_mutability: high
from: "dididecks-ai"
from_path: "context-v/models/Slide-Audit-Registry-Data-Model.md"
---
# Slide Audit Registry · Data Model

## What this model represents

The reviewer-facing rating of each (deck, variant, slot) cell, **separately for the Scroll-UI surface and the Play-UI surface**. Reviewers click the 4-state rating pill (mounted at the bottom-right of every scroll deck via `DeckOverlay--Scroll-UI`, and at the top-right of every play slide via `DeckOverlay--Play-UI`) — the click POSTs to `/api/slide-rank`, which appends/updates this JSON file.

This is the **only filesystem data model that mutates at runtime**. Every other model in this folder is edited at authoring time. This one is mutated by reviewers in their browsers.

## Where it lives in the filesystem

| Client | Path |
|---|---|
| `calmstorm-decks` | `data/audits/slides.json` |
| `chroma-decks` | `data/audits/slides.json` |
| `humain-vc-decks` | `data/audits/slides.json` (currently `{schema: 2, ranks: {}}` — no ratings yet) |

Single JSON file. Per-client. Each client's audit is independent — there's no cross-engagement aggregation today.

## The canonical schema

The shell's `AuditRegistry` type is the contract:

```ts
export type Status = "perfect" | "passable" | "non-urgent-could-be-better" | "needs-rework";
//   ↑ four-state classifier. The exact label set is the load-bearing UX claim.

export type Surface = "scroll" | "play";

export interface SurfaceRankEntry {
  status: Status;
  rankedAt: string;     // ISO 8601 datetime
  rankedBy?: string;    // freeform — "founder" | "team" | "reviewer" | name
  notes?: string | null;
}

export interface RankEntryV2 {
  scroll?: SurfaceRankEntry;
  play?: SurfaceRankEntry;
}

export interface AuditRegistry {
  schema: 2;
  ranks: Record<string, RankEntryV2>;
  //              ↑ key shape: `${variantSlug}/${slot}`
  //                  e.g. "enhanced-v2/05b"
}
```

### Wire shape — actual JSON

```json
{
  "schema": 2,
  "ranks": {
    "proto/01": {
      "scroll": {
        "status": "perfect",
        "rankedAt": "2026-05-12T10:37:27.882Z",
        "rankedBy": "founder",
        "notes": null
      }
    },
    "enhanced-v2/05b": {
      "scroll": {
        "status": "passable",
        "rankedAt": "2026-05-15T14:02:11.450Z",
        "rankedBy": "founder",
        "notes": "the dotted-grid texture needs to come up 10%"
      },
      "play": {
        "status": "non-urgent-could-be-better",
        "rankedAt": "2026-05-15T14:05:03.100Z",
        "rankedBy": "founder",
        "notes": null
      }
    }
  }
}
```

### Schema v1 → v2 migration (in-memory)

Earlier (chroma) versions had `schema: 1` where each entry was just a flat `SurfaceRankEntry` (no scroll/play split). The registry-loader silently lifts v1 to v2 by interpreting all v1 ratings as `scroll` ratings:

```ts
function migrateV1ToV2(v1: AuditRegistryV1): AuditRegistry {
  const ranks: Record<string, RankEntryV2> = {};
  for (const [key, entry] of Object.entries(v1.ranks)) {
    ranks[key] = { scroll: entry };
  }
  return { schema: 2, ranks };
}
```

**The DB should ingest both shapes** and store the migrated v2 form. Any v1 files on disk get rewritten to v2 on the next `writeAuditRegistry()` call.

### Empty / missing file semantics

```ts
// loadAuditRegistry — when the file is missing:
catch (err) {
  if (code === "ENOENT") return { schema: 2, ranks: {} };
  throw err;
}
```

A missing file is NOT an error — it's "no ratings yet" (humain's current state). The shell renders DeckMatrix cells in their unrated state and offers reviewers a fresh rating UI. The DB equivalent: a Company / Person / Slot table without any audit rows for it.

## The four states — and what they mean

| Status | Display | Reviewer intent |
|---|---|---|
| `perfect` | ★ green | "Ship it" |
| `passable` | P blue | "Acceptable; could be better but not blocking" |
| `non-urgent-could-be-better` | C orange | "Has clear improvement direction; not gating shipment" |
| `needs-rework` | U red | "Blocking; redo before ship" |

(Color codes are the chroma deck's audit-pill rendering — see `apps/deck-shell/src/components/SlideRankPill.astro`.)

Only these four values are valid. New status values would be a schema change.

## Per-client variations

The audit registry is **identical across clients** — same `data/audits/slides.json` path, same shape, same `/api/slide-rank` API. The shell ships the discipline; consumers can't customize it.

The only variation is *which slots have ratings yet*:

| Client | Approx. populated cells |
|---|---|
| `calmstorm-decks` | substantial — multi-pass reviewer rounds |
| `chroma-decks` | substantial — `enhanced-v2` and `enhanced-v3` heavily rated |
| `humain-vc-decks` | none (ratings UI exists but no reviewer has clicked yet) |

## How the shell consumes the audit registry

**Read paths:**
- `apps/deck-shell/src/routes/data-assets/{companies,people}.astro` — reads audit registry only indirectly (no direct dependency)
- `apps/deck-shell/src/components/DeckMatrix.astro` — reads `data/audits/slides.json` directly via `loadAuditRegistry()`; renders each cell with its `scroll` status on the left, `play` status on the right, and a `≠` drift indicator on the row's right edge when scroll and play disagree
- `apps/deck-shell/src/components/SlideRankPill.astro` — reads on mount to populate its initial state; subscribes to nothing — re-renders on click via the POST round-trip

**Write paths:**
- `apps/deck-shell/src/routes/api/slide-rank.ts` — the only write surface; POST body shape: `{ key: "variantSlug/slot", surface: "scroll" | "play", status: Status, rankedBy?: string, notes?: string | null }`

**Atomic-write discipline:** `writeAuditRegistry()` sorts the `ranks` keys alphabetically before serializing, then `fs.writeFile`s the whole file. Concurrent writes from two reviewers will race — last-write-wins per the filesystem. Acceptable for the small-team / single-deck-at-a-time use case; would not be acceptable at multi-reviewer scale (the DB migration is what fixes this).

## What's load-bearing

- **`schema` version field** — protects against ingest of unknown future shapes
- **Key shape `${variantSlug}/${slot}`** — the dual composite key the audit rows hang on; matches `Slot` table's `(variant_id, slot)` composite
- **Per-surface entry shape** — `{ status, rankedAt, rankedBy?, notes? }` — every field except `rankedAt` and `status` is nullable; the absence of a surface key means "not yet rated on that surface"
- **The four-state enum** — exact label set drives the UI's pill states

## Translation to a remote DB

### Prisma schema sketch

```prisma
model SlideAudit {
  id            String   @id @default(cuid())
  // FKs — composite uniqueness on (slot_id, surface)
  slot_id       String                          // FK to Slot.id
  slot          Slot     @relation(fields: [slot_id], references: [id])
  surface       String                          // "scroll" | "play"

  // The rating itself
  status        String                          // perfect | passable | non-urgent-could-be-better | needs-rework
  ranked_at     DateTime
  ranked_by     String?                         // freeform — founder | team | reviewer | <name>
  notes         String?  @db.Text

  // Audit-of-audit (history is useful — see open question 2)
  superseded_at DateTime?                       // when this rating was overwritten by a later one
  superseded_by String?                         // FK to the SlideAudit id that replaced this

  created_at    DateTime @default(now())

  @@unique([slot_id, surface])                  // current state per surface
  @@index([slot_id])
}
```

Or, **if you want history preserved (recommended)**, drop the `@@unique` and append every rating as a new row, marking earlier ones with `superseded_at` + `superseded_by`. Queries for "current state per surface" then read the row with `superseded_at IS NULL`.

### Why `Slot` FK and not `(deck, variant, slot)` composite columns

The JSON key `"enhanced-v2/05b"` is a denormalized composite. In the DB, the Slot table already carries `(deck.slug, variant.slug, slot)` identity (via `Slot.variant_id` → `Variant.id` → `Variant.deck_id` → `Deck.id` → `Deck.slug`). Storing `slot_id` as FK keeps the audit row joinable to the variant + deck for free.

If the DB sync wants to populate from the JSON without first having `Slot` rows, derive `slot_id` from `(engagement, deck_slug, variant_slug, slot)` lookup; if no match, drop the audit row (or stash in a "orphaned audits" table for later reconciliation).

## How the runtime mutation API maps to a DB API

```
POST /api/slide-rank  (current filesystem)
  body: { key: "enhanced-v2/05b", surface: "scroll", status: "perfect",
          rankedBy: "founder", notes: null }
  semantics: upsert into ranks[key][surface]; write whole file

  ──── translates to ────────────────────────────────────────────────────

POST /api/slide-rank  (DB-backed)
  body: same shape
  semantics: parse key → (variant_slug, slot); look up Slot.id;
             if history-preserving: insert new SlideAudit row; mark previous row superseded_at = now()
             else: upsert SlideAudit row with @@unique([slot_id, surface])
```

The POST contract from the SlideRankPill's perspective stays identical — only the persistence layer changes. The shell's component doesn't need touching for the DB migration.

## Open questions for the collaborator

1. **History or no history?** The current JSON file overwrites in place; old ratings are lost. The DB CAN preserve history cheaply (just rows, never updates). Recommendation: preserve. "Who rated what when, and what did they used to rate it" is useful in long-running reviewer cycles.

2. **`rankedBy` — string or FK to Person/Identity?** Today it's freeform text. Once auth is installed in humain (see [`Auth-Surface-Data-Model.md`](./Auth-Surface-Data-Model.md)), the reviewer is an authenticated `Identity` row. Recommendation: dual — keep `ranked_by` as text for backfill compatibility, add `ranked_by_identity_id` as nullable FK for authenticated reviewers.

3. **Cross-engagement audit aggregation:** if Calmstorm and Humain both review a `pitch / enhanced-v1 / 05`, they're independent audits. Should there be a cross-engagement "this slot pattern is consistently rated `perfect` across N decks" rollup? Recommendation: skip until use case materializes.

4. **Drift detection (`≠`):** the DeckMatrix renders `≠` when scroll status differs from play status. That's a render-time comparison. Want a DB-side "drift_flag" boolean for fast filtering? Recommendation: yes, but compute on read via a view rather than denormalizing.

5. **Rating-state evolution:** the four-state enum has churned (was three states pre-`needs-rework`). When the team adds a fifth state in the future, the schema-version bump strategy: `schema: 3` + reader migration, same pattern as v1→v2. Recommendation: encode the state set in DB as a free-form text column, never an enum constraint — same logic as `role_class` on Person.

## See also

- [`Deck-Variant-Slot-Registry-Data-Model.md`](./Deck-Variant-Slot-Registry-Data-Model.md) — the `Slot` table this hangs off
- `apps/deck-shell/src/routes/api/slide-rank.ts` — the write API
- `apps/deck-shell/src/components/SlideRankPill.astro` — the rating UI
- `apps/deck-shell/src/components/DeckMatrix.astro` — the audit-matrix rendering
- `context-v/plans/Phase-A-Plus-Plus-Play-Fidelity-In-Play-Ranking-and-Variant-URL-Safety.md` — historical plan that landed the per-surface ranking

---
title: "Engagement telemetry — PageView + Action append-only logs"
lede: "Reader-behavior telemetry colocated in the same astro:db as the auth surface. Captures every page view + every meaningful action (clicked CTA, opened TOC, rated a slot, jumped to a slot) tied to a session. Append-only — never updated. Foundation for 'who looked at what for how long' reporting back to founders."
date_authored_initial_draft: 2026-06-07
date_last_updated: 2026-06-07
at_semantic_version: 0.0.1.0
status: As-observed-from-db-config
applies_to:
  - client-sites/chroma-decks (current implementation)
  - client-sites/calmstorm-decks (similar)
  - client-sites/humain-vc-decks (NOT YET — auth/db install pending)
schema_authority:
  - client-sites/chroma-decks/db/config.ts (PageView + Action tables)
runtime_mutability: high
storage: "astro:db (same DB as auth surface — auth.db locally, Turso remote)"
from: "dididecks-ai"
from_path: "context-v/models/Engagement-Telemetry-Data-Model.md"
---
# Engagement Telemetry · Data Model

## What this model represents

Reader-behavior data. Two tables, both colocated in the same database as the auth surface (so JOINs from PageView to Identity / Session are local):

- **`PageView`** — one row per page navigation. Fires from the deck-shell's middleware on every request that survives the auth gate.
- **`Action`** — one row per *meaningful interaction* — a CTA click, a TOC open, a slot-jump, a slide rating. Authored by the shell components (and consumer-site components) that explicitly call the action-recording API.

Together: "Founder X opened the deck 3 days ago, viewed it for 18 minutes, looked at the team slide longest, jumped from slot 5 to the warehouse slot, and rated the warehouse slot `perfect`." That whole narrative is reconstructed from PageView + Action rows tied to a Session tied to an Identity.

## Where it lives

Same physical DB as the auth surface — `auth.db` locally, Turso remote. The same `db/config.ts` defines them, and they JOIN against `Session.id`.

| Client | Status |
|---|---|
| `calmstorm-decks` | Present in older shape (PageView only; no Action; counts low) |
| `chroma-decks` | Both PageView + Action — actively used |
| `humain-vc-decks` | Not installed — auth/db not yet shipped |

## The canonical schema (chroma — current)

### `PageView`

```ts
columns: {
  id:            text primaryKey   // UUIDv7
  at:            datetime default now()
  session_id:    text optional references Session.id
  identity_id:   text optional references Identity.id  // denormalized from session for query speed
  path:          text             // e.g. "/scroll/pitch/enhanced-v2/" or "/play/pitch/enhanced-v2/05b/"
  referrer:     text optional     // HTTP referrer
  shared_label:  text optional     // when the session is passcode-tier (no Identity), carry the human-readable shared-session label
}
```

Recorded by **middleware** — every request that passes the auth gate generates a PageView (unless on the deny list — `/api/*`, static assets, etc.). Per-request cost is one INSERT.

### `Action`

```ts
columns: {
  id:            text primaryKey
  at:            datetime default now()
  session_id:    text optional references Session.id
  identity_id:   text optional references Identity.id
  kind:          text              // "cta-click" | "toc-open" | "slot-jump" | "slot-rate" | "mode-cycle" | …
  target:        text optional     // depends on kind: for cta-click it's the CTA's data-action; for slot-jump it's the target slot id; for slot-rate it's the variant/slot key
  payload_json:  text optional     // JSON-encoded freeform data — e.g. for slot-rate: {"surface":"scroll","status":"perfect"}
  shared_label:  text optional
}
```

Recorded by **explicit calls** — a CTA button click handler POSTs to `/api/action`, the shell's SlideRankPill component also POSTs an Action alongside the audit-registry update, etc. NOT automatic — every action is intentionally instrumented.

### Calmstorm's older shape

Calmstorm has `PageView` but **not `Action`** — actions weren't an explicit concept yet. Migrating calmstorm rows: they have no Action history to backfill; just start collecting from the migration date forward.

## What's load-bearing

- **`session_id` + `identity_id` dual reference** — denormalization for query speed. JOINing to Session every time would be O(rows); carrying `identity_id` directly on PageView/Action makes "all activity for this Identity" a single index scan.
- **`payload_json` as text-encoded JSON** — astro:db doesn't natively type JSON columns; storing as text is the convention. Postgres migration would upgrade to `jsonb`.
- **Append-only** — these tables are never UPDATEd or DELETEd. Rows accumulate forever. Retention is a future concern (90 days? 1 year? per-client?).

## How the shell consumes (or produces) these rows

### Production (writes)

- **`apps/deck-shell/src/middleware.ts`** (per consumer client; the shell ships the template) — INSERTs PageView on every request that passes auth.
- **`apps/deck-shell/src/components/SlideRankPill.astro`** — when reviewer clicks a rating, the POST to `/api/slide-rank` also inserts an Action with `kind: "slot-rate"`.
- **Consumer-site CTA components** — explicitly POST to `/api/action` from click handlers. The shell doesn't ship a generic `<TrackedCTA>` wrapper yet (that's an authoring discipline today — see the calmstorm-decks pattern of `data-action="hero-cta"` attributes that consumer-site scripts intercept).

### Consumption (reads)

- **No shell route reads these yet** — the rows accumulate but nothing in the shell renders them. They're written for the future "engagement report" surface (TBD).
- **Out-of-band consumers** — the operator queries Turso directly for "who's been looking at the deck this week" reports. SQL like:

  ```sql
  SELECT i.full_name, COUNT(pv.id) AS views, MAX(pv.at) AS last_view
  FROM PageView pv
  JOIN Session s ON pv.session_id = s.id
  JOIN Identity i ON s.identity_id = i.id
  WHERE pv.at > datetime('now', '-7 days')
  GROUP BY i.id ORDER BY views DESC;
  ```

## Translation to a remote DB

### Prisma schema sketch

```prisma
model PageView {
  id           String   @id @default(cuid())
  at           DateTime @default(now())
  app_slug     String                          // NEW for cross-app consolidation; today is hardcoded
  session_id   String?                         // FK to Session.id
  identity_id  String?                         // FK to Identity.id; denormalized
  path         String
  referrer     String?
  shared_label String?

  @@index([app_slug, at])
  @@index([identity_id, at])
  @@index([session_id])
}

model Action {
  id            String   @id @default(cuid())
  at            DateTime @default(now())
  app_slug      String                         // NEW
  session_id    String?
  identity_id   String?
  kind          String                         // "cta-click" | "toc-open" | "slot-jump" | "slot-rate" | "mode-cycle"
  target        String?
  payload       Json?                          // upgrade from text→jsonb
  shared_label  String?

  @@index([app_slug, at])
  @@index([identity_id, kind])
  @@index([kind, at])
}
```

### Why `app_slug` (new column)

Same reason as `AuthEvent.app_slug` — supports cross-app consolidation. If you consolidate to one shared DB (option B from [`Auth-Surface-Data-Model.md`](./Auth-Surface-Data-Model.md)), every telemetry row needs to know which app it came from.

If you stay on per-client Turso (option A), this column is unnecessary but harmless. Adding it now means later consolidation doesn't require a schema migration.

### Indexing strategy

Three query shapes are likely:

1. **"What did Identity X do?"** → `idx(identity_id, at)` — for personalized reports
2. **"What's happening on the deck right now?"** → `idx(app_slug, at)` — for ops dashboards
3. **"Where are CTAs converting?"** → `idx(kind, at)` for `Action` — for CTA effectiveness

The above indexes cover all three.

## Open questions for the collaborator

1. **Retention policy:** these tables grow unboundedly. 90-day rolling delete? Per-client decision? Recommendation: 1 year retention with quarterly archive to cold storage (S3 jsonl), then delete from primary DB. Decide before the first client's row count gets uncomfortable.

2. **`payload_json` typing:** today is freeform JSON. Should there be a `kind` → `payload_shape` registry? Recommendation: document expected shapes per kind in a `apps/deck-shell/src/types/actions.ts` file, but don't enforce in DB. New action kinds shouldn't require a migration.

3. **PII in `path`:** if a deck URL ever embeds a token or email, PageView.path would leak it. Today no deck URL does — but worth a discipline check before adding URL patterns like `/access/redeem?token=…`. Recommendation: middleware filters known-sensitive query strings before logging.

4. **Anonymous (passcode-tier) sessions:** `identity_id` is null; `session_id` is set; `shared_label` carries the human-readable label. Reports should treat anonymous sessions as a separate bucket — not roll them up with named identities. Recommendation: report layer always splits "named" from "anonymous".

5. **Real-time vs batch:** writes are per-request (real-time). Reads today are out-of-band (operator runs SQL). Future "engagement report" surface in the deck-shell would change that. Recommendation: build out the read path as its own route + component when the use case materializes; don't pre-optimize.

## See also

- [`Auth-Surface-Data-Model.md`](./Auth-Surface-Data-Model.md) — Session + Identity tables these reference
- `client-sites/chroma-decks/db/config.ts` — schema
- `client-sites/chroma-decks/src/middleware.ts` — the PageView writer
- `apps/deck-shell/src/routes/api/slide-rank.ts` — example of an Action writer (slot-rate kind)

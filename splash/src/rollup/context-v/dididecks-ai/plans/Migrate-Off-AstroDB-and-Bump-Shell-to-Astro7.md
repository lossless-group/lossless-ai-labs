---
title: "Migrate DidiDecks off deprecated @astrojs/db and bump @dididecks/shell to Astro 7"
date_created: 2026-08-02
date_modified: 2026-08-02
authors:
  - Michael Staton
augmented_with: Claude Opus 4.8 on Claude Code
semantic_version: 0.0.0.1
status: Draft
lede: "@astrojs/db is deprecated and the shell pins everyone to Astro 6. Move the client-site auth layer to direct @libsql/client (Turso) and republish the shell for Astro 7 — starting with eventcut-ai as the pilot."
tags:
  - Migration
  - Dididecks-Shell
  - Turso
  - libSQL
  - Astro-7
  - Auth-Surface
publish: false
site_uuid: 15c4223e-3abd-473d-8eab-286f9f32cd4c
hex_code: 2ej85x
date_authored_initial_draft: 2026-08-02
date_authored_current_draft: 2026-08-02
from: "dididecks-ai"
from_path: "context-v/plans/Migrate-Off-AstroDB-and-Bump-Shell-to-Astro7.md"
---
## Why Care?

Two facts forced this, both verified 2026-08-02:

- **`@astrojs/db` is deprecated.** npm: *"This package is deprecated. Use a
  database client (Drizzle, Kysely, etc.) directly instead."* The whole
  client-site auth layer (middleware, verify, seed, config) is built on its
  `astro:db` imports.
- **Everything is pinned to Astro 6.** `@dididecks/shell@0.1.0` declares
  `peerDependencies: astro ^6.0.0`; the client-sites install Astro `6.3.1`.
  Latest is Astro `7.1.6`.

`@libsql/client` (the direct Turso driver) is **already** a dependency of the
client-sites, so the replacement driver is in hand.

**eventcut-ai is the pilot** — it's freshly scaffolded, not yet deployed, and
carries no history, so it's the safe place to prove the new pattern before it
touches the live sites.

## Scope boundary

- **In scope today:** shell Astro-7 bump + republish; eventcut-ai auth layer
  moved to direct libSQL; eventcut-ai on Astro 7; eventcut-ai deployed.
- **Explicitly deferred:** migrating chroma-decks, calmstorm-decks,
  reach-edu-hub off @astrojs/db. They keep running on the old stack until we
  deliberately migrate each. This plan proves the pattern; it does not roll it
  out everywhere.

## The two migrations (separable)

### A. `@dididecks/shell` → Astro 7 (no DB work)

The shell is pure chrome/UI/routes; it has no database dependency.

1. **Assess Astro 7 breaking changes** against what the shell actually uses
   (integration API, `getStaticPaths`, route file shapes, content APIs).
   Size of the bump is UNKNOWN until this is done — do it first.
2. Update `apps/deck-shell/package.json`: `peerDependencies.astro` → allow
   `^7.0.0` (likely `>=6.0.0 <8` if we want both), devDep astro → 7.
3. Fix any breaks in `src/routes/*`, `src/components/*`, `src/index.ts`.
4. `pnpm --filter @dididecks/shell typecheck` green.
5. Publish **v0.2.0** to GitHub Packages.

### B. Client-site auth layer: `@astrojs/db` → `@libsql/client`

This is the larger piece. The `astro:db` surface to replace:

- `db/config.ts` — the `defineDb`/`defineTable` schema (10 tables). Becomes a
  SQL schema (migration) + a typed data-access module.
- `db/seed.ts` — org seeding. Becomes an idempotent SQL upsert.
- `src/middleware.ts` — session read/update/PageView insert.
- `src/pages/api/access/verify.ts` — session + membership + AuthEvent writes.
- `src/lib/auth/session.ts`, `token.ts`, etc. — anything importing `astro:db`.

New shape (proposal, to be refined in Phase B0):

- `src/lib/db/client.ts` — a `createClient({ url, authToken })` singleton from
  `@libsql/client`, reading **`TURSO_DATABASE_URL`** + **`TURSO_AUTH_TOKEN`**
  (renamed from `ASTRO_DB_*`). Local dev points at a file URL.
- `src/lib/db/schema.sql` — the table DDL (translated from config.ts).
- `src/lib/db/queries.ts` — typed helpers replacing the `db.select()...` calls.
- Consider Drizzle (libSQL adapter) vs hand-written SQL — decide in B0.

## Env var rename

| Old (`@astrojs/db`) | New (direct libSQL) |
|---|---|
| `ASTRO_DB_REMOTE_URL` | `TURSO_DATABASE_URL` |
| `ASTRO_DB_APP_TOKEN` | `TURSO_AUTH_TOKEN` |
| `ASTRO_DATABASE_FILE` (local) | `TURSO_DATABASE_URL=file:./auth.db` |

`SESSION_SECRET`, `ADMIN_PASSCODE`, `VIEWER_PASSCODE`, `GITHUB_TOKEN`,
`SITE_URL` are unchanged.

## Phases

- **B0 — decide the data-access approach** (Drizzle vs raw SQL) and write the
  schema.sql from config.ts. Small, decisive.
- **A — shell to Astro 7**, publish v0.2.0.
- **B — rewrite eventcut-ai's auth layer** on `@libsql/client`; rename env
  vars; re-push schema to `ddd-eventcut` via the new path.
- **C — bump eventcut-ai to Astro 7 + shell v0.2.0**; `pnpm build` green
  locally.
- **D — deploy eventcut-ai to Vercel** (env vars now `TURSO_*`).

## Open questions

- Drizzle vs raw SQL for the data layer? (B0)
- Does Astro 7 break the shell's integration hooks materially, or is it a clean
  bump? (A1 — unknown until assessed)
- Bump `@libsql/client` 0.14 → 0.17 at the same time? (low risk, probably yes)

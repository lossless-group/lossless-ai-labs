---
title: "Install Auth Across Applied AI Labs Apps"
lede: "Every app graduating out of `ai-labs/` — memopop-ai, dididecks-ai, augment-it, and the per-client deck workspaces dididecks already ships — needs the same shape of auth: signed-link invites for named stakeholders, optional OAuth for the wider audience, a passcode tier-3 fallback, and durable telemetry on every attempt. We don't need to re-derive that shape. The astro-knots family already converged on it, shipped it in production at calmstorm-decks and chroma-decks, and wrote it up at the parent level. This blueprint is the ai-labs handle on that pattern: what to pull in, which database backend to pick (Turso/libSQL when the calmstorm pattern is the right fit, Powabase/Postgres when the app also needs pgvector or wants GoTrue-managed OAuth out of the box), what to translate when the app is SvelteKit instead of Astro, and which org/identity conventions ai-labs apps inherit from the dididecks precedent."
date_created: 2026-06-05
date_modified: 2026-06-05
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7 (1M context)
semantic_version: 0.0.0.2
status: Draft
tags:
  - Blueprint
  - Authentication
  - Turso
  - libSQL
  - Astro-DB
  - Powabase
  - Postgres
  - GoTrue
  - Svelte
  - SvelteKit
  - Applied-AI-Labs
  - Cross-App-Pattern
  - Signed-Link-Tokens
  - OAuth
  - Org-Model
---

# Install Auth Across Applied AI Labs Apps

## What this is

A pointer-and-translation document. The canonical auth pattern for the Lossless tree already exists at the astro-knots parent — it is [[Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]] — and is in production at `astro-knots/sites/calmstorm-decks/` and `dididecks-ai/client-sites/chroma-decks/`. This blueprint exists so that when one of the **ai-labs** apps (`memopop-ai`, `dididecks-ai`, `augment-it`, future siblings) needs to install auth, an agent can find the right anchor without having to re-discover it from training-data folklore.

It does three things and only three things:

1. **Anchors** the canonical blueprint and its two reference implementations.
2. **Translates** the pattern for the ai-labs frame — most notably the Svelte / SvelteKit question and the Tauri-desktop quirk that memopop introduces.
3. **Codifies** the ai-labs-wide conventions that already crystallized in the dididecks-ai precedent (organization-as-domain identity, three-tier composition, telemetry surface).

When this blueprint and [[Shared-Auth-for-Applied-AI-Labs]] (the journey-mode exploration that produced the ai-labs framing) diverge, the exploration is the older artifact and this blueprint wins. When this blueprint and the parent astro-knots blueprint diverge, the parent wins.

## Why it exists

Three reasons, in order:

1. **Cost.** Auth0/Clerk/WorkOS/Stytch all price for a scale ai-labs isn't at and won't be at for a while. The pattern below is ~800 lines of code we own and can read on a plane.
2. **Reuse.** The first ai-labs app to install auth seeds the second and third — same `Identity` shape, same session lifecycle, same telemetry tables, same env-reader convention. Without a written blueprint, each app's first install re-derives the conventions and they drift.
3. **The work has already been done.** The astro-knots family burned through three iterations (the [[Confidential-Content-Access-Control-Blueprint]] v1 → [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] post-mortem → the current v2). Re-burning that fuel in ai-labs would be wasteful.

---

## The canonical pattern (one paragraph)

Three composable tiers — signed-link invite (Tier 1), OAuth + allowlist (Tier 2), universal passcode with admin/viewer split (Tier 3) — share one schema (`Identity`, `MintedToken`, `Session`, `AuthEvent`, `PageView`, `Action`) on a relational database (defaults: **libSQL via Turso** for the calmstorm pattern, or **Postgres via Powabase** for the GoTrue-managed variant — see § Choosing the database layer). Auth happens at the **middleware layer**: every gated request looks up the session, refreshes the cookie, inserts a `PageView`, gates admin routes with **404 (not 403)**, and continues. Every verify or redeem attempt writes one `AuthEvent` row. The session cookie is **httpOnly** — JavaScript cannot see it, so all "am I authed?" checks happen server-side. Env vars are read with a **dual-source `readEnv` helper** that checks `import.meta.env` first and `process.env` second, because Astro v6 populates the two from different places. The minimum useful adoption is **Tier 1 + Tier 3**; Tier 2 is added when the audience widens beyond named stakeholders.

Full pattern: [[Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]]. That document is the source of truth on the schema, the middleware contract, the bot-detector, and the telemetry shape. Do not duplicate that detail here — link to it. The parent blueprint is Turso-flavored; the § Choosing the database layer section below covers the Powabase fork.

---

## The Svelte / SvelteKit question

The user-facing framing of "Auth with Svelte and Turso" needs one clarification before adoption:

**The auth surface is server-side, not framework-specific.** The middleware, the API routes, the session lookup, the env-reader, the schema — none of that is Svelte. It is Astro server (`output: "server"`) talking to libSQL. Svelte enters the picture only at the **gate UI** (the form the user types a passcode into, the inline modal, the auth-status chip), which in astro-knots sites is plain `.astro` markup but **can be a Svelte island** without changing anything else in the stack.

Translation table for the three ai-labs hosts (orthogonal to the database-layer choice — see § Choosing the database layer):

| App stack | Middleware home | API routes | Session helper | Gate UI |
|---|---|---|---|---|
| **Astro + Svelte islands** (dididecks-ai web client-sites, augment-it likely) | `src/middleware.ts` | `src/pages/api/...` | `src/lib/auth/session.ts` (server) | `.astro` page; Svelte component if you want client-side interactivity |
| **Pure SvelteKit** | `src/hooks.server.ts` (the `handle` hook) | `+server.ts` files under `src/routes/...` | `$lib/server/auth/session.ts` | `+page.svelte` form posting to a `+server.ts` action |
| **Tauri desktop + Svelte 5** (memopop-ai) | Rust-side handler in `src-tauri/` for OS-keychain refresh tokens; HTTP-only cookies don't apply | Sidecar HTTP service (Python FastAPI for memopop) writes the same tables | OS keychain via `tauri-plugin-stronghold` or `keyring-rs` | Svelte 5 `$state` rune store, no cookies |

On either DB layer, the **middleware-home / API-routes / gate-UI** locations are identical — what changes between Turso and Powabase is what the session helper reads from (`@astrojs/db` typed client vs. Drizzle over Postgres or GoTrue JWT verification), not where the helper lives.

The **schema, the telemetry surface, and the org/identity model are identical across all three.** The session medium differs (HTTP-only cookie on web, OS keychain token on Tauri). Treat the Tauri auth path as a sibling, not a derivative — see [[Shared-Auth-for-Applied-AI-Labs]] § "memopop is desktop" for the reasoning.

---

## ai-labs conventions inherited from dididecks-ai

These were codified in the dididecks-ai CLAUDE.md and the calmstorm-decks reference. Treat them as defaults for any ai-labs app adopting auth, not as one-deck oddities:

### Organization-as-domain identity

`Organization.id` is the org's canonical email domain (`lossless.group`, `trychroma.com`, `calmstormvc.com`), **not** a slug or UUID. `Organization.slug` carries the human-readable handle for URLs. Personal-email signups (gmail, outlook, proton) bucket as `id = "personal"`.

Every ai-labs app seeds **at minimum two organizations** at install: `lossless.group` (the operating team) and whatever client domain the app primarily serves. memopop-ai and dididecks-ai both follow this. Cross-app dashboards can join on `Organization.id` because the value is stable across apps.

Full rationale: `../explorations/Shared-Auth-for-Applied-AI-Labs.md` → "Organization naming convention — domain-as-id" (in the parent ai-labs exploration). When that section moves into a spec, this blueprint will link the spec instead.

### Three-tier composition is opt-in, but the schema is not

A new app may legitimately ship only Tier 1 (signed-link invites, no OAuth, no passcode fallback). It still **creates all six tables**, because the telemetry surface and the future-tier columns cost nothing at create-time and a lot at retrofit-time. The reference site `chroma-decks` ships Tier 1 + Tier 3 only; Tier 2 is wired off and the columns are unused. That is the recommended starting posture.

### Local dev DB, prod DB, one typed client (Turso path)

When the app picks the **Turso/libSQL** path (default for content-presentation apps), `@astrojs/db` talks to a local file in dev and Turso in prod with no code change. The npm-script convention from the parent blueprint:

```jsonc
{
  "scripts": {
    "dev":            "ASTRO_DATABASE_FILE=./auth.db astro dev",
    "build":          "ASTRO_DATABASE_FILE=./auth.db astro build",
    "build:remote":   "astro build --remote",
    "db:push:remote": "tsx scripts/db-push.ts"
  }
}
```

When the app is SvelteKit (not Astro), substitute `@libsql/client` directly — same wire protocol, same SQL. The Drizzle or Kysely layer goes on top.

When the app picks the **Powabase/Postgres** path instead, the dev/prod story is different — see § Choosing the database layer below.

### Dual-source env reader is non-negotiable

Already canonical in the parent blueprint. Restated here so the ai-labs reader does not skip it:

```ts
function readEnv(name: string): string | undefined {
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  if (fromMeta) return fromMeta;
  return process.env[name];
}
```

For SvelteKit: use `$env/static/private` and `$env/dynamic/private` with the same fallback discipline (`static` first, `dynamic` second). The shape is identical; the imports differ.

### Bot-detect signed-link redeem routes

Signed-link URLs get pasted into WhatsApp, Slack, iMessage, etc., every one of which scrapes the URL for an OG preview *before* the human taps. Without intervention, that scrape consumes a `MintedToken.uses_remaining`, kills `max-uses=1` links, and leaves the recipient confused. The parent blueprint's bot-detector belongs at the top of any `/access/link/[token]` (or SvelteKit `/access/link/[token]/+page.server.ts`) handler in any ai-labs app that issues signed-link invites.

---

## Choosing the database layer: Turso (libSQL) or Powabase (Postgres)

The auth pattern itself — schema names, tier composition, middleware contract, telemetry surface, env-reader discipline — is **engine-neutral**. What the database layer changes is who owns identity, where OAuth lives, and what the dev story looks like. Pick once per app, at install time. Do not switch mid-life.

### Quick comparison

| Dimension | Turso (libSQL) — calmstorm pattern | Powabase (Postgres) — GoTrue variant |
|---|---|---|
| **Engine** | SQLite-compatible (libSQL fork) | Postgres + pgvector |
| **Hosting model** | Managed Turso project, edge-replicated | Managed Powabase project (no self-host path documented) |
| **Local dev DB** | Local file (`ASTRO_DATABASE_FILE=./auth.db`) — zero infra | Docker Postgres or a hosted dev project — actual infrastructure |
| **Typed client** | `@astrojs/db` (Astro) or `@libsql/client` (anywhere) | None. Raw HTTP to PostgREST + GoTrue, or Drizzle/Prisma over direct Postgres connection |
| **Identity table** | We own `Identity` end-to-end | GoTrue owns `auth.users`; we layer `Identity` (or `app_user`) referencing `auth.users.id` |
| **Sessions** | We own `Session` table + httpOnly cookie + the whole lifecycle | Two valid postures: (a) GoTrue issues JWT, we read it server-side and skip our `Session` table; (b) we keep `Session` for Tier 1/3 invites and use GoTrue only for Tier 2 OAuth — `Session` joins `auth.users` by `user_id` |
| **OAuth wiring** | We install `arctic` and write the login/callback routes ourselves | GoTrue endpoints handle it (`/auth/v1/authorize?provider=google`). No `arctic`, no callbacks to write |
| **Magic link** | Not in the parent blueprint; would be additional work | GoTrue endpoint, built-in |
| **Tier 1 signed-link invites** | Native — our `MintedToken` table + HMAC-SHA256 sign/verify | Not GoTrue-native. Build `MintedToken` in the public schema; at redeem time either mint a GoTrue user with a synthetic email + one-time password, or attach to an existing `auth.users` row |
| **Tier 3 passcode** | Native — our env-stored secrets + `Session` insert | Same shape (passcode is never a GoTrue concept), but the `Session` insert may or may not bridge to `auth.users` depending on which posture you picked above |
| **Telemetry tables (`AuthEvent`, `PageView`, `Action`)** | Our tables in libSQL | Our tables in the Postgres public schema — identical shape, different engine |
| **Vector storage for RAG** | Bolt-on (separate Chroma/Qdrant/etc.) | Built-in (pgvector in the same Postgres) |
| **Auth surface code we own** | ~800 lines (the parent blueprint's `src/lib/auth/*` plus middleware) | Substantially less for the OAuth/magic-link paths; about the same for Tier 1/3 and telemetry |

### When Turso is the better fit

- The app's primary entry is **Tier 1 signed-link invites** (calmstorm-decks, chroma-decks, future dididecks per-client deck workspaces). The parent blueprint is purpose-built for this shape and the typed `@astrojs/db` integration is the lowest-friction install path.
- The app **does not need vector storage** in the same database. Decks, splash pages, viewer surfaces, fundraise materials — none of these have a RAG layer attached.
- **Local-file dev DB is a genuine win** because the contributor list extends to non-dev-ops people who shouldn't have to run Docker.
- The app **may run at the edge** and you want SQLite-shaped read latencies near the user.

### When Powabase is the better fit

- The app **already needs Postgres + pgvector** for RAG (memopop-ai is the obvious case — it stores memo embeddings, agent transcripts, and reference corpus vectors; co-locating those with auth in one project is cleaner than maintaining a separate Turso + Chroma pair).
- The app's primary entry is **OAuth or magic-link self-service** for a wider audience, and you'd rather GoTrue own those flows than write and maintain them.
- The app **wants the full auth-as-a-service primitives** (password reset, email verification, OAuth callbacks, MFA hooks) without writing them. The parent blueprint is silent on most of those because the calmstorm shape didn't need them.
- You're **comfortable running Docker Postgres** locally and the contributor list is dev-shaped.

### What changes in the install (Powabase fork)

Anchor to the parent blueprint, then diverge at these specific points:

**Schema authoring.** Instead of `db/config.ts` (Astro DB), write Drizzle migrations under `migrations/` (or Prisma under `prisma/`) targeting the public schema. The six tables (`Identity`, `MintedToken`, `Session`, `AuthEvent`, `PageView`, `Action`) become Postgres tables. `Identity.id` may stay as a text slug, or you may collapse `Identity` into a 1:1 view over `auth.users` if you want GoTrue's identity row to be the only source of truth. The latter is cleaner; the former preserves the parent blueprint's idiom and is easier to migrate from later.

**Identity creation.** The `identity:create` CLI in the parent blueprint inserts into a single table. Under Powabase, it inserts into `auth.users` (via GoTrue admin API) **and** the `Identity` (or `app_user`) table you layer on top. Keep one CLI; have it do both writes in a transaction.

**OAuth.** Delete the `arctic` install. Delete the `src/pages/api/auth/{google,github,...}/{login,callback}.ts` routes from the fullstack-vc-style reference. Replace with two routes:
- `GET /auth/start?provider=google&redirect=…` — server-side redirect to `https://<your-powabase>/auth/v1/authorize?provider=google&redirect_to=…`
- `GET /auth/callback` — receives GoTrue's session, sets your httpOnly cookie (or stores the JWT depending on posture), upserts the `Identity` row, inserts the `AuthEvent`.

**Tier 1 signed-link invites.** Keep the parent blueprint's `MintedToken` table and the `mint-link.ts` CLI verbatim — neither depends on the engine. Change the redeem route to additionally `INSERT INTO auth.users` (or upsert by email) at redemption time so the resulting session sits inside GoTrue's user model.

**Tier 3 passcode.** Keep the parent blueprint's `verify.ts` verbatim. The `Session` row insert now happens in Postgres instead of libSQL. If you want passcode-redeemed sessions to also live in `auth.users`, create a synthetic user there at first redemption; if not, the `Session` row stands alone and `session.identity_id` references your `Identity` table directly.

**Session medium.** Two valid postures:
- **Posture A — keep our cookie, ignore GoTrue's JWT.** The middleware looks up `Session` in our table by cookie ID, exactly as the parent blueprint does. GoTrue's session is read once at OAuth/magic-link callback time, then translated into a row in our `Session` table. Lower cognitive load; closer to the parent blueprint; ignores some of what we're paying GoTrue for.
- **Posture B — use GoTrue's JWT as the session.** The middleware verifies the JWT (via GoTrue's JWKS endpoint or shared secret) on every request. Our `Session` table only exists for Tier 1/3 invites where there is no GoTrue user. This is closer to the "Powabase native" shape and saves a DB read per request, but the middleware logic forks by tier.

**Default to Posture A on first install.** It is the smaller divergence from the parent blueprint and gives the second Powabase install the data needed to decide whether Posture B's payoff justifies the fork. The decision rolls back into this blueprint when made.

**Local dev.** The parent blueprint's `ASTRO_DATABASE_FILE=./auth.db astro dev` flow does not translate. Three options, ranked by cost:
1. **Powabase dev project.** Cheapest cognitive cost; same wire as prod; requires network and burns Powabase quota.
2. **Local Postgres via Docker** (`docker run -d postgres` or `docker-compose` with the GoTrue image alongside). Closer to prod parity if you also run GoTrue locally; requires Docker on contributor laptops.
3. **Direct Postgres without GoTrue**, running auth flows against a stub. Lowest fidelity; only viable when you're iterating on app code and not auth code.

**Client lib.** There is no Powabase TypeScript SDK. The two real choices are: (a) **Drizzle** (or Prisma) over a direct Postgres connection using `pg` or `postgres.js`, hitting `DATABASE_URL`; (b) **raw `fetch`** to PostgREST + GoTrue REST endpoints. Drizzle is the recommended default for the auth surface — it gives the same typed-query experience as `@astrojs/db` for the calmstorm path. PostgREST is the more natural surface for the *app's own* data reads, where row-level security policies in the public schema do the gating.

**Env var shape.**

```
# Powabase project credentials
POWABASE_PROJECT_URL=https://<project>.powabase.app   # e.g.
POWABASE_ANON_KEY=...                                  # public, browser-safe
POWABASE_SERVICE_KEY=...                               # server-only — guards admin endpoints
POWABASE_JWT_SECRET=...                                # for verifying GoTrue JWTs server-side (Posture B)

# Direct Postgres (Drizzle / Prisma)
DATABASE_URL=postgres://...
```

All read through the same dual-source `readEnv` helper as the Turso path.

### Common ground (do not refork these)

These are the same regardless of engine choice; do not reinvent per-engine:

- The six-table schema names and column semantics
- The three-tier composition model
- The middleware contract (cookie lookup → `PageView` insert → role gate → continue)
- The 404-not-403 rule for admin routes
- The bot-detector at the top of signed-link redeem routes
- The dual-source `readEnv` helper
- The organization-as-domain identity convention
- The httpOnly cookie discipline (even under Posture B, the JWT lives in an httpOnly cookie, not local storage)
- The telemetry surface (`AuthEvent`, `PageView`, `Action`)
- The `auth_events_outbox` stub for cross-app roll-up

### Per-app recommendation (snapshot)

| App | Recommended layer | Reasoning |
|---|---|---|
| `dididecks-ai` and per-client deck workspaces | **Turso** | Tier-1-led, no RAG in the auth-bearing surface, calmstorm precedent is direct. |
| `memopop-ai` | **Powabase** | pgvector co-located with auth; OAuth-led self-service for client firms; Tauri desktop concerns are orthogonal to the DB choice. |
| `augment-it` | **TBD — likely Powabase** | If CRM-shaped data benefits from Postgres + RLS, lean Powabase. If presentation-shaped, lean Turso. Decide when the app's data shape is pinned. |

Treat these as defaults, not mandates. When an app's actual data shape disagrees with this table, the data shape wins.

---

## Two reference implementations, two patterns

The astro-knots tree has two production auth surfaces. They are **not the same shape**, and the difference matters when picking which one to copy from.

### `calmstorm-decks` and `chroma-decks` — middleware-gated, Tier-1-led

The canonical v2 implementation. Middleware (`src/middleware.ts`) gates every request, looks up `Session`, inserts `PageView`, enforces role. Primary entry is **Tier 1 signed-link invites** minted by an operator-side CLI (`pnpm mint-link`). Tier 3 passcode is the fallback. No OAuth wired.

**Pull from this when:** the audience is named in advance, you control the invite minting, and the app is content-presentation-shaped (a deck, a memo viewer, a client-facing surface).

### `fullstack-vc` — OAuth-first, per-page gate

A different shape. No `src/middleware.ts`. Instead each gated page reads the session at the top of its frontmatter via `src/lib/session.ts`, and **Tier 2 (OAuth) is the primary entry** with Google, GitHub, and LinkedIn callback routes already wired (`src/pages/api/auth/{google,github,linkedin}/{login,callback}.ts`). The lessons that produced the v2 blueprint were captured here first ([[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]], [[Troubleshooting-SSG-Authentication-and-Port-to-SSR-w-Database]]).

**Pull from this when:** the app expects self-service signup from a wider audience (anyone at the firm domain, anyone with a Google Workspace account), and per-page gating is more natural than blanket middleware (e.g., a mostly-public site with a few gated surfaces).

In practice most ai-labs apps will want both: middleware-level gate for the "logged-in app" surface, OAuth as the primary entry. The cleanest path is to **start from the calmstorm-decks shape and layer the fullstack-vc OAuth callbacks on top** — they share the same `Identity` and `Session` tables, so the addition is purely new routes, not a refactor.

---

## Adoption checklist for a new ai-labs app

A condensed version of the parent blueprint's adoption list, with ai-labs-specific additions in **bold**:

1. **Decide the host stack.** Astro+Svelte islands, pure SvelteKit, or Tauri+Svelte. Pick the corresponding row in the translation table above.
2. **Decide the database layer.** Turso (libSQL) or Powabase (Postgres). See § Choosing the database layer. The remaining steps fork at 3, 10, 11, 12, and 13.
3. **Pick tiers.** Default: Tier 1 + Tier 3. Add Tier 2 only if the audience genuinely needs self-service. (Tier 2 is substantially cheaper to install on Powabase because GoTrue is already in the box.)
4. Install client/ORM:
   - **Turso path:** `@astrojs/db` (Astro) or `@libsql/client` + Drizzle/Kysely (SvelteKit). Add `arctic` if Tier 2 is in scope.
   - **Powabase path:** Drizzle (recommended) or Prisma over the direct Postgres connection. Skip `arctic` even if Tier 2 is in scope — GoTrue handles it.
5. Copy `db/config.ts` from `calmstorm-decks` (Turso/Astro), transcribe to a `migrations/` folder (Turso/SvelteKit), or write Drizzle migrations against the Powabase public schema (Powabase). **Do not skip the `Organization` table even if you only ship one org on day one** — the cross-app dashboard seam depends on it.
6. **Seed `Organization` rows on first install:** `lossless.group` + whatever client domains apply. Stamp `Identity.org_id` to those domains. Personal emails → `id = "personal"`.
7. Copy `src/lib/auth/*` (Astro) or transcribe to `$lib/server/auth/*` (SvelteKit). The token signer, session helper, and `readEnv` are framework-neutral TS — only the import paths differ. On the Powabase path, replace the libSQL query layer with Drizzle/Postgres calls and (under Posture B) add a GoTrue JWT verifier.
8. Copy `src/middleware.ts` (Astro) or wire `src/hooks.server.ts` (SvelteKit). The PUBLIC_PREFIXES list will be app-specific.
9. Copy the routes under `access/`, `api/access/`, `admin/`. **Restyle the gate page to the app's brand vocabulary; keep the form fields exactly.** On Powabase + Tier 2, add the `/auth/start` and `/auth/callback` routes that bridge to GoTrue instead of the per-provider `arctic` routes.
10. Copy the CLIs: `identity-create.ts`, `mint-link.ts`, `db-push.ts` (Turso) or `migrate.ts` (Powabase), `wipe-sessions.ts`. Add corresponding `pnpm` scripts. On Powabase, the `identity:create` CLI does the GoTrue admin-API call **and** the `Identity` insert in one transaction.
11. Set env vars: `ADMIN_PASSCODE`, `VIEWER_PASSCODE`, `SESSION_SECRET` (≥16 chars, `openssl rand -base64 32`).
    - **Turso:** add `ASTRO_DB_REMOTE_URL`, `ASTRO_DB_APP_TOKEN`. **Use the app-prefixed env naming convention if the env is shared with sibling tooling** (e.g., `MEMOPOP_TURSO_URL`); alias inside `astro.config.mjs` so the Astro DB integration sees the canonical names.
    - **Powabase:** add `POWABASE_PROJECT_URL`, `POWABASE_ANON_KEY`, `POWABASE_SERVICE_KEY`, `POWABASE_JWT_SECRET` (Posture B only), and `DATABASE_URL` for direct-Postgres access.
12. **Provision the database scoped to the app.** One Turso DB per app, or one Powabase project per app. Do not share databases across ai-labs apps. The cross-app dashboard is built by *reading* from each app's local DB and writing to a roll-up store; it is not built by pointing two apps at one DB.
13. Apply the schema:
    - **Turso:** Set Vercel `buildCommand` to `pnpm astro build --remote` (Astro). Run `pnpm db:push:remote` once locally.
    - **Powabase:** Run Drizzle/Prisma migrations against the Powabase Postgres URL. No special build flag.
14. Seed the roster (`pnpm identity:create` per stakeholder, or write a `seed-clients.ts`).
15. Mint the first invite (`pnpm mint-link --identity=<id> --role=admin --days=365 --max-uses=10 --remote`). Verify the redeem flow end-to-end before any of this hits a client's WhatsApp.
16. **Add the `auth_events_outbox` stub even if the cross-app roll-up isn't built yet.** One extra table, zero cost, full optionality for the dashboard work later.

---

## Anti-patterns specific to ai-labs

The parent blueprint enumerates the framework-neutral anti-patterns (don't post raw passcode to telemetry, don't detect cookies in `document.cookie`, don't return 403 for admin routes, etc.). The ai-labs-specific ones:

**Don't share a database across ai-labs apps.** Each app gets its own Turso DB or its own Powabase project, even if two apps serve the same client. Cross-app queries are a smell — if you need them, the right shape is a roll-up store reading from each app's `auth_events_outbox`, not a shared primary DB. The cost of separation is two extra projects; the cost of conflation is irreversible.

**Don't mix engines within one app.** Pick Turso or Powabase at install time and live with it for the app's lifetime. Splitting `Identity`/`Session` onto one engine and `AuthEvent`/`PageView` onto another to "use each tool for what it's best at" creates two transactional islands, two backup stories, two failure modes, and a guaranteed source of phantom-row bugs at the join. If you outgrow the chosen engine, that's a migration project, not a daily-driver pattern.

**Don't put GoTrue's JWT in localStorage even though Powabase's example code might.** The httpOnly cookie discipline is non-negotiable across both engines. Under Posture B, the middleware verifies the JWT from an httpOnly cookie, not from `Authorization: Bearer` headers sent by JS that read the token out of `localStorage`.

**Don't skip the `Organization` table on the "MVP."** Every ai-labs app has more than one organization on day one (Lossless team + at least one client). Backfilling the org column after rows are in `Identity` is painful and bug-prone. The v2 schema's `org_id` is cheap to ship and expensive to retrofit.

**Don't reuse a session cookie name across ai-labs apps on the same domain.** Each app gets a unique cookie name (`cs_session` for calmstorm, `chr_session` for chroma, `mp_session` for memopop, etc.). Otherwise sibling apps on the same Vercel preview domain stomp each other's sessions.

**Don't try to lift `@lossless/auth-core` into a published package on the first install.** The [[Shared-Auth-for-Applied-AI-Labs]] exploration considers and parks this — the second install is what teaches you which seams belong in the shared package and which belong per-app. Copy, ship, then refactor with the benefit of two-implementations of hindsight.

**Don't treat the Tauri desktop session as the same shape as the web session.** memopop's auth uses OS keychain refresh tokens, not HTTP cookies. The web-app translation table above is misleading if you try to apply the cookie helpers verbatim to the Tauri build. Read [[Shared-Auth-for-Applied-AI-Labs]] § "memopop is desktop" first.

**Don't gate `/llms.txt` or other LLM/SEO surface files.** Public listings, sitemaps, llms.txt, robots.txt, OG image routes — these go in `PUBLIC_PREFIXES`. The middleware's default is "gate everything not in the public list," which is the right default but catches discoverability surfaces unless they're explicitly allowed.

---

## Reference implementations

All three live references are **Turso/libSQL flavored.** There is no in-tree Powabase reference yet — the Powabase path in § Choosing the database layer is forward-looking and the first app to install it (memopop-ai is the likely candidate) will become the seed reference. When that lands, add it here and bump this blueprint's `semantic_version`.

- **`astro-knots/sites/calmstorm-decks/`** — Astro v6, Turso/libSQL, middleware-gated, Tier 1 + Tier 3. The canonical v2 reference. Versions 0.0.6.0 and 0.0.7.0 walk through the install. Per-site changelogs at `sites/calmstorm-decks/context-v/changelogs/2026-05-10_07.md` and `_08.md` are the readable narrative of how it landed.
- **`ai-labs/dididecks-ai/client-sites/chroma-decks/`** — Astro v6, Turso/libSQL, uses `@dididecks/shell`, same v2 pattern transposed into the dididecks-shell-wrapped layout. The closer-to-ai-labs reference. Versions current as of 2026-05-17 onward.
- **`astro-knots/sites/fullstack-vc/`** — Astro v6 + Svelte 5 islands, Turso/libSQL, OAuth-first (Google + GitHub + LinkedIn), per-page gate. The reference for Tier 2 wiring via `arctic`. `src/pages/api/auth/{google,github,linkedin}/{login,callback}.ts`, `src/lib/session.ts`, `src/lib/oauth-roster.ts`, `src/lib/auth-events.ts`. **Note that the Powabase path replaces this entire surface with GoTrue endpoints; this site is the reference for the Turso/`arctic` shape only.**

When a fourth ai-labs app adopts this pattern cleanly — especially if it's the first Powabase install — the candidate for extraction as `@lossless-group/auth` becomes the next move. The shared package would expose both adapters (libSQL and Postgres) behind a common interface.

---

## Related

- **Parent blueprint (source of truth):** [[Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]]
- **Predecessor blueprint (v1, still valid for non-persistent gates):** [[Confidential-Content-Access-Control-Blueprint]]
- **Journey-mode exploration that produced the ai-labs framing:** [[Shared-Auth-for-Applied-AI-Labs]]
- **Lessons captured along the way:**
  - [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] — the fullstack-vc post-mortem
  - [[Troubleshooting-SSG-Authentication-and-Port-to-SSR-w-Database]] — the SSG → SSR pivot and callback-URL landmines
- **Sibling ai-labs blueprint:** [[Per-App-Workspace-Conventions]] — the workspace-package discipline that runs in parallel to this auth pattern across the three apps
- **Per-site install plan template** (in each dididecks client-site): `context-v/plans/Install-Auth-Surface-from-Calmstorm-Pattern.md`
- **External — Powabase docs:** <https://docs.powabase.ai/concepts/platform-overview> · [Auth model](https://docs.powabase.ai/concepts/auth-model.md) · [OAuth providers](https://docs.powabase.ai/guides/auth-oauth-providers.md) · [Drizzle guide](https://docs.powabase.ai/guides/orm-drizzle.md) · [Migrations](https://docs.powabase.ai/guides/migrations.md)

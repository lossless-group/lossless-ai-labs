---
title: "Calmstorm Auth — Inventory and Future-Package Map"
lede: "Session 1 deliverable of the Shared-Auth-for-Applied-AI-Labs three-session plan. Inventories the auth surface currently running in calmstorm-decks — every file, line count, dependency, env var, DB table — and maps each piece to its future location in the extracted `lossless-auth-core` package. The current calmstorm code implements ~70% of the v1 hard requirements from the parent exploration; this doc names what's package-ready, what's calmstorm-specific (and must stay in the consumer), and what's MISSING (Session 2 work)."
date_authored_initial_draft: 2026-05-17
date_authored_current_draft: 2026-05-17
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-17
at_semantic_version: 0.0.1.0
status: Active
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Spec
tags:
  - Shared-Auth
  - Lossless-Auth-Core
  - Calmstorm-Audit
  - Package-Extraction
  - Pre-Implementation
  - Session-1-Deliverable
authors:
  - Michael Staton
date_created: 2026-05-17
date_modified: 2026-05-17
parent_exploration: "[[../../../context-v/explorations/Shared-Auth-for-Applied-AI-Labs]]"
from: "dididecks-ai"
from_path: "context-v/specs/Calmstorm-Auth-Inventory.md"
---
# Calmstorm Auth — Inventory and Future-Package Map

> Session 1 of the three-session plan in [[../../../context-v/explorations/Shared-Auth-for-Applied-AI-Labs]]. Read that first for the decisions context (code-first via extraction; opaque UUIDv7 lossless_id; standalone-repo destined for JSR).

## Why this doc exists

Calmstorm-decks already runs a small, owned auth system. Today (2026-05-17) we debugged a prerender-bypass-middleware trap in it, which surfaced enough of the code to recognize that **the system implements ~70% of the v1 hard requirements** the Shared-Auth exploration calls for. Rather than spec a green-field design, we're going to:

1. **(this doc)** Inventory what calmstorm has; mark what moves to the package, what stays consumer-local, and what's MISSING.
2. **(Session 2)** Add the four missing pieces in calmstorm itself: OAuth via `arctic`, Organization + Membership tables, `lossless_id` UUIDv7, `app_slug` column on AuthEvent.
3. **(Session 3)** Stand up `github.com/lossless-group/lossless-auth-core`; extract; wire chroma-decks as the second consumer to surface leaky abstractions.

This inventory is the input to Sessions 2-3 — Session 2 knows what shapes to preserve; Session 3 knows what code physically moves.

## File inventory

11 files, 1096 LOC. Authoring the package against these reveals exactly how small the auth surface actually is.

| File | LOC | Role | Disposition |
|---|---:|---|---|
| `src/middleware.ts` | 162 | Per-request session gate; public-prefix allowlist; DB-unavailable graceful degradation | **Mostly package** — extract the gate logic; the `PUBLIC_PREFIXES` config stays a consumer-tunable input |
| `src/lib/auth/types.ts` | 16 | `Role`, `Tier`, `AuthOutcome`, `SESSION_COOKIE`, `SESSION_MAX_AGE_DAYS` | **Package** — straight lift; `Role` enum grows in Session 2 |
| `src/lib/auth/session.ts` | 71 | Cookie helpers: `setSessionCookie`, `clearSessionCookie`, `readSessionCookie`, `buildSessionCookieHeader`, `buildSessionCookieDeleteHeader`, `hashish`, `clientIpFromRequest` | **Package** — straight lift; cookie name configurable per-consumer |
| `src/lib/auth/token.ts` | 86 | Magic-link / invite token signing: `signLinkToken`, `verifyLinkToken`, `newRandomId`; HMAC-SHA-256 over JSON payload, b64url encoding | **Package** — straight lift; `LinkTokenPayload` shape stays |
| `src/lib/auth/passcode.ts` | 65 | Tier-3 pre-shared passcode matching with optional `-label` suffix (the "shared label" mechanism); env-var-driven (`ADMIN_PASSCODE`, `VIEWER_PASSCODE`) | **Hybrid** — the matching logic moves to the package; the env-var-driven config stays consumer-local (each consumer wires its own passcodes) |
| `src/pages/access/index.astro` | 112 | Passcode entry form; renders the gate UI; reads `?redirect=` and `?error=` params; brand-themed | **Stays in consumer** — UI surface, calmstorm brand; package provides the form-action endpoint and the error vocabulary |
| `src/pages/access/link/[token].astro` | 221 | Magic-link / invite redemption; bot-detection split (link-preview scrapers get OG-only HTML, real users get the redemption flow); creates Session row on success | **Mostly package** — the redemption *logic* extracts cleanly; the bot-detection list + the OG-preview HTML stay consumer (or become an opt-in package feature) |
| `src/pages/api/access/verify.ts` | 175 | Passcode verify endpoint; matches passcode → creates Session row → sets cookie → 302 redirect; logs AuthEvent on every outcome | **Package** — the POST handler extracts; consumer mounts via `injectRoute` or similar |
| `src/pages/api/access/logout.ts` | 50 | Session revoke + cookie delete + 302 to `/access` | **Package** — straight lift |
| `src/pages/api/access/debug-cookie.ts` | 29 | Diagnostic-only endpoint (returns harmless `cs_debug` cookie); kept after the cookie-loop debugging session | **Package** (dev-only) — extract as opt-in dev surface; default off in prod |
| `src/components/auth/TrackerScript.astro` | 109 | Vanilla-JS interaction tracker; POSTs interaction events to `/api/track` from gated pages | **Out of scope for auth-core** — this is engagement-tracking, sibling concern; lives in a separate package (or stays consumer-local). Belongs to the `PageView` / `Action` data path, not the auth path. |

## DB schema inventory

From `db/config.ts`. Astro:db over libSQL — drizzle-shaped typed access in TS; same tables addressable from Python via the libSQL HTTP client.

| Table | Role | Disposition |
|---|---|---|
| `Identity` | The "user" record — `id` (local PK), `label`, `full_name`, `email`, `org` (TEXT — early hardcode of org affiliation), `linkedin_url`, `notes`, `created_at`, `first_seen_at`, `last_seen_at` | **Package, with v1 additions:** add `lossless_id` UUIDv7, `primary_email`, profile-enrichment fields (handle, avatar). The `org` TEXT column gets superseded by a proper Membership row in Session 2. |
| `MintedToken` | Single-use, time-boxed invite/magic-link token; `id`, `identity_id`, `role`, `expires_at`, `max_uses`, `uses_remaining`, `minted_at`, `minted_by`, `revoked_at`, `notes` | **Package — straight lift.** Already implements the v1 invite-token requirements (single-use, time-boxed, admin-attributable, revocable). |
| `Session` | Active session; `id`, `identity_id` (nullable for anonymous tiers), `tier`, `role`, `shared_label`, `enrolled_at`, `last_seen_at`, `revoked_at`, `ua_hash`, `ip_hash`, `token_id` | **Package — straight lift.** The `tier` column captures the credential pathway (`passcode` / `signed_link` / future `oauth`). |
| `AuthEvent` | Append-only audit log; `id`, `at`, `outcome`, `reason`, `tier`, `role`, `identity_id`, `session_id`, `token_id`, `shared_label`, `ip_hash`, `ua_hash`, `passcode_hash_prefix` | **Package, with v1 addition:** add `app_slug` column. This table IS the `auth_events_outbox` the parent exploration calls for; rename in the package extraction to make the cross-app intent explicit. |
| `PageView` | Path-level page-view log; `id`, `at`, `session_id`, `identity_id`, `path`, `referrer`, `shared_label` | **Sibling concern** — not auth-core. Engagement tracking. Stays in calmstorm or its own package. |
| `Action` | Coarse interaction log; `id`, `at`, `session_id`, `identity_id`, `kind`, `target`, `payload_json`, `shared_label` | **Sibling concern** — same as PageView. Engagement tracking. |

## Environment variables in the auth path

| Var | Used in | Disposition |
|---|---|---|
| `ADMIN_PASSCODE` | `passcode.ts` | Stays consumer-local — each consumer picks its own passcode and threshold |
| `VIEWER_PASSCODE` | `passcode.ts` | Same |
| `SESSION_SECRET` | `token.ts` | Package — the HMAC secret for signed link tokens. **Each consumer ships its own value** (no cross-app secret sharing). |
| `NODE_ENV` | `session.ts` (toggles Secure flag) | Stays — read by helpers, standard |
| `ASTRO_DATABASE_FILE`, `ASTRO_DB_REMOTE_URL`, `ASTRO_DB_APP_TOKEN` | astro.config.mjs DB wiring | Stays consumer-local — each consumer chooses embedded vs Turso-hosted per the parent exploration's deployment-shape options |

## Public route map (current)

| Route | Method | What it does | Disposition |
|---|---|---|---|
| `/access` | GET | Passcode entry form (consumer-branded UI) | Consumer-local |
| `/access/link/{token}` | GET | Magic-link redemption (creates session, sets cookie, redirects) | Package — UI shell stays consumer |
| `/api/access/verify` | POST | Passcode form-action; creates session, sets cookie, 302s to `redirectTo` | Package — endpoint logic; consumer route just re-exports |
| `/api/access/logout` | GET, POST | Revoke session + clear cookie + 302 to `/access` | Package |
| `/api/access/debug-cookie` | GET | Diagnostic-only; sets `cs_debug` cookie | Package (dev-only opt-in) |
| `/api/track` | POST | Engagement events (used by TrackerScript) | **Not auth-core** — sibling tracker concern |

In the package: routes injected via an Astro integration (same shape as `@dididecks/shell` does for `/toc/`, `/play/`, `/data-assets/`). Consumer site mounts the integration; routes appear automatically.

## What's package-ready (high confidence)

The flow that's already proven:

1. **Cookie + middleware pattern** — the `cs_session` cookie shape, the `data-chrome-hidden`-style attribute pattern for graceful degradation, the public-prefix allowlist, the rolling-refresh on every authenticated request. All in `middleware.ts` + `session.ts`. Ports unchanged.
2. **HMAC-signed magic-link token + redemption flow** — `signLinkToken` / `verifyLinkToken` / the redemption route. The token payload shape is generic enough for OAuth state too.
3. **Bot-detection split on link redemption** — link-preview scrapers (WhatsApp/Slack/Telegram/etc.) get OG-rich HTML without consuming a token use; real users redeem. Generalizable utility.
4. **DB-unavailable graceful degradation** in middleware — `try { dbMod = await import("astro:db"); ... } catch { /* cookie-trust pass-through */ }`. Lets the gate stay up during infrastructure hiccups.
5. **AuthEvent log shape** — already an append-only audit table with `outcome`, `tier`, `ip_hash`, `ua_hash`, `passcode_hash_prefix`. Add `app_slug` and this IS the `auth_events_outbox` the exploration calls for.
6. **The `tier` + `role` two-axis credential model** — `tier` is HOW you authenticated (passcode / signed_link / OAuth-soon); `role` is WHAT you can do (admin / viewer / org_owner-soon / etc.). Clean separation, generalizes well.

## What's calmstorm-specific and stays in the consumer

- **`/access/index.astro` UI** — Calm/Storm brand, the cobalt-blue gradient, the typography. Each consumer authors its own variant of this page (calmstorm-themed, chroma-themed, memopop-themed). Package can offer a minimal-default `<AccessGate>` Astro component for sites that want one off the shelf.
- **`PUBLIC_PREFIXES` config in middleware** — calmstorm's list (`/access`, `/api/access`, `/changelog`, `/_image`, `/_astro`, `/dev` in dev) is calmstorm-specific. Package extracts middleware as a function that takes a `publicPrefixes` config + returns the Astro middleware handler.
- **`ADMIN_PASSCODE` / `VIEWER_PASSCODE` values** — each consumer picks its own. Reading them is package code; the values are consumer env.
- **`fsvc_session` JWT cookie** — observed in DevTools today; that's from a SEPARATE service (Firebase Studio / Cloud Workstation auth) and unrelated to our path. Not touched.
- **The TrackerScript + `PageView` + `Action` tables** — engagement tracking. Sibling package candidate (`lossless-tracking-core` someday?). Not auth.

## What's MISSING (the Session 2 additions)

Four discrete changes, each its own commit, validated in calmstorm before extraction:

### Missing 1 — OAuth via `arctic`

Calmstorm has no OAuth today. The parent exploration's v1 hard requirements include GitHub + Google Workspace. Session 2 work:

- Add `arctic` as a dep.
- New table `OAuthAccount` (1-to-many under Identity): `id`, `identity_id`, `provider` (`github` | `google`), `provider_subject` (the stable user ID from the provider), `provider_email`, `linked_at`, `last_used_at`.
- New routes `/access/oauth/github/{start,callback}` and `/access/oauth/google/{start,callback}` (Google Workspace deferred to Session 2.5 — start with GitHub).
- Unify the credential pathway: OAuth callback → upsert OAuthAccount → upsert Identity (by `provider_email`) → mint Session → set `cs_session` cookie → 302. Same Session table, same cookie, same middleware.
- `tier: "oauth_github"` / `tier: "oauth_google"` on the Session row.

Estimated effort: half-day. `arctic` is small and well-documented.

### Missing 2 — Organization + Membership tables

Calmstorm has `Identity.org` as a free-form TEXT column. The exploration calls for a proper Organization table + a Membership join, with the firm-vs-org dual-vocabulary baked in.

- New table `Organization`: `id`, `slug`, `name`, `created_at`.
- New table `FirmProfile` (1-to-1 with Organization, nullable): firm-specific fields (`firm_kind` — `vc` / `studio` / `lp` / `portco`; `portfolio_path`; `aum_tier`; `brand_assets_path`). Organizations without a firm profile are first-class (e.g. Lossless Group itself).
- New table `Membership`: `id`, `identity_id`, `organization_id`, `role`, `joined_at`, `revoked_at`. Roles per the exploration: `superuser`, `org_owner`, `org_admin`, `editor`, `viewer`.
- Migration: insert one Organization row for calm-storm-ventures; insert a FirmProfile for it; for every existing Identity with `org: "calm-storm-ventures"`, insert a Membership row.
- Update middleware + verify route to attach Membership context to the session.

Estimated effort: half-day with the migration.

### Missing 3 — `lossless_id` UUIDv7 on Identity

Per the locked decision: opaque UUIDv7, content-free, minted on first sign-in, lookup by `primary_email` thereafter.

- Add `lossless_id` column to Identity (text, indexed, unique).
- Add `primary_email` column to Identity (text, indexed; calmstorm's existing `email` becomes the primary).
- On first sign-in (any tier): if no Identity with this `primary_email`, mint a new Identity with a fresh UUIDv7 `lossless_id`. If an Identity exists, reuse.
- Backfill: every existing Identity gets a `lossless_id` minted from the audit log timestamps (UUIDv7 takes a timestamp; use `first_seen_at` if available, else `created_at`).

Estimated effort: 1-2 hours including the backfill script.

### Missing 4 — `app_slug` column on AuthEvent

Trivial. Adds the cross-app dimension the rollup needs.

- Add `app_slug` column to AuthEvent (text, indexed). Default `"calmstorm-decks"` for backfill.
- Every existing insert site sets the field explicitly. Single grep + replace.

Estimated effort: 20 minutes.

## The future-package map

```
github.com/lossless-group/lossless-auth-core/
├── package.json                          (name: "lossless-auth-core" or @lossless-group/lossless-auth-core)
├── jsr.json                              (JSR publish config)
├── src/
│   ├── index.ts                          (re-exports)
│   ├── types.ts                          ← from calmstorm src/lib/auth/types.ts (+ Role enum extensions)
│   ├── session.ts                        ← from calmstorm src/lib/auth/session.ts
│   ├── token.ts                          ← from calmstorm src/lib/auth/token.ts
│   ├── passcode.ts                       ← from calmstorm src/lib/auth/passcode.ts (matching logic only; env-reading stays in consumer)
│   ├── oauth/
│   │   ├── github.ts                     ← NEW (Session 2)
│   │   └── google.ts                     ← NEW (Session 2 — Workspace domain allowlist baked in)
│   ├── lossless_id.ts                    ← NEW (UUIDv7 minting + lookup by primary_email)
│   ├── middleware.ts                     ← factory that takes consumer config (publicPrefixes, cookieName, etc.) and returns the Astro middleware handler
│   ├── routes/
│   │   ├── access-verify.ts              ← from calmstorm src/pages/api/access/verify.ts
│   │   ├── access-logout.ts              ← from calmstorm src/pages/api/access/logout.ts
│   │   ├── access-link-redeem.astro      ← from calmstorm src/pages/access/link/[token].astro (logic; UI shell stays consumer)
│   │   ├── access-oauth-github-start.ts  ← NEW
│   │   ├── access-oauth-github-callback.ts ← NEW
│   │   └── access-oauth-google-{start,callback}.ts ← NEW
│   ├── integration.ts                    ← Astro integration that injectRoutes(...) + applies the middleware
│   └── db/
│       ├── schema.ts                     (Identity / OAuthAccount / MintedToken / Session / Organization / FirmProfile / Membership / AuthEvent)
│       └── migrations/
│           ├── 001-initial.sql
│           ├── 002-oauth-account.sql
│           ├── 003-organization-membership.sql
│           ├── 004-lossless-id.sql
│           └── 005-app-slug-on-auth-event.sql
├── README.md
├── LICENSE
└── tsconfig.json
```

Consumer integration (calmstorm post-extraction, chroma-decks Session-3 wiring, dididecks-ai eventually):

```ts
// astro.config.mjs
import losslessAuth from "lossless-auth-core";

export default defineConfig({
  integrations: [
    losslessAuth({
      appSlug: "calmstorm-decks",                 // stamped on AuthEvent.app_slug
      publicPrefixes: ["/changelog", "/_image"],  // consumer-defined gate-allowlist
      cookieName: "cs_session",                   // consumer-chosen cookie name
      cookieMaxAgeDays: 90,                       // optional override
      oauth: {
        github: { /* clientId, clientSecret env-var names */ },
        google: { /* workspace domain allowlist per-org */ },
      },
      passcodes: {                                // optional; legacy Tier-3 path
        admin: "ADMIN_PASSCODE",                  // env var names, not values
        viewer: "VIEWER_PASSCODE",
      },
      sessionSecretEnvVar: "SESSION_SECRET",
    }),
  ],
});
```

## What about the Python sidecar?

The parent exploration calls for a `lossless-auth-py` companion that reads the same Session table the TS package writes. Calmstorm doesn't have one (no Python sidecar today). memopop-ai does.

Defer to **Session 4 or later**, when memopop adoption forces it. The Session 2-3 work is web-only (calmstorm + chroma-decks); the package surface for Python isn't validated until a Python consumer exists. Stub the contract in the package's docs but don't write the Python side yet.

## Risks + open questions

- **Astro:db vs vanilla libSQL.** Calmstorm uses `astro:db` (the Astro-integration wrapper over libSQL). The package extraction has to decide whether to keep that dependency or drop to the bare `@libsql/client` interface. Astro:db is convenient for Astro consumers; awkward for non-Astro consumers (Tauri's Rust side, Python sidecar). **Lean**: package's TS code uses bare `@libsql/client`; consumers can wrap it with Astro:db if they want. Schema lives in raw SQL migrations.
- **The `Identity.org` migration.** Existing rows in calmstorm have `org: "calm-storm-ventures"` as a free-form TEXT. Migrate by inserting the Organization row, then mass-inserting Memberships. One-time script, idempotent.
- **`cs_session` cookie name on extraction.** Existing live calmstorm sessions are keyed off `cs_session`. Package default could be `lossless_session` but calmstorm would need to override to `cs_session` to not log everyone out on extraction day. Make cookie-name a consumer config; default to a Lossless-flavored name; calmstorm overrides explicitly.
- **OAuth-callback URL discipline.** Each OAuth provider needs a registered callback URL per environment (localhost / preview / prod). The provider config has to be per-consumer-per-env. Standard but worth flagging.

## Status / next step

**Status**: Active. Session 1 deliverable.

**Immediate next step**: begin Session 2 — add OAuth + Organization/Membership + lossless_id + app_slug to calmstorm-decks. Each as its own commit. The four additions are detailed in the "What's MISSING" section above.

**Once Session 2 lands**: Session 3 stands up `github.com/lossless-group/lossless-auth-core`, extracts the now-validated code, wires chroma-decks as the second consumer.

## Cross-references

- [[../../../context-v/explorations/Shared-Auth-for-Applied-AI-Labs]] — parent exploration; decisions captured in-flight 2026-05-17 in its "Decisions captured" section
- `dididecks-ai/client-sites/calmstorm-decks/src/middleware.ts` — the load-bearing gate
- `dididecks-ai/client-sites/calmstorm-decks/db/config.ts` — current DB schema
- `dididecks-ai/changelog/2026-05-17_02.md` — the prerender-bypass-middleware bug from today that surfaced this code in detail
- [Arctic OAuth library](https://github.com/pilcrowOnPaper/arctic) — the small OAuth handshake library Session 2 will use
- [Astro:db docs](https://docs.astro.build/en/guides/astro-db/) — what calmstorm is on today; package decision is to drop down to bare `@libsql/client`

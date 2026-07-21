---
title: "Confidential Access v2 — Persistent Sessions and Telemetry (calmstorm-decks)"
lede: "Site-level implementation spec for the v2 confidential access shape: server-validated passcode + signed pre-authed links, persistent sessions in Astro DB (libSQL), AuthEvent + PageView + Action telemetry, two-role access (admin / viewer), and a downstream-sharing attribution hack via passcode suffix."
date_authored_initial_draft: 2026-05-10
date_authored_current_draft: 2026-05-10
date_first_published:
date_last_updated: 2026-05-10
at_semantic_version: 0.0.1.0
status: In-Progress
augmented_with: Claude Code (Opus 4.7)
category: Spec
tags: [Authentication, Confidential-Access, Astro-DB, Turso, Persistent-Sessions, Auth-Telemetry, Server-Side-Gating]
authors:
  - Michael Staton
date_created: 2026-05-10
date_modified: 2026-05-10
from: "dididecks-ai/calmstorm-decks"
from_path: "context-v/specs/Confidential-Access-v2-Persistent-Sessions-and-Telemetry.md"
---
# Confidential Access v2 — Site Implementation Spec

> Pseudomonorepo-level exploration this implements: [[Rethinking-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]]
> Predecessor pattern: [[Confidential-Content-Access-Control-Blueprint]]
> Driving incident: the primary stakeholder could not enter the deck site with the configured passcode; second tester succeeded. Current gate is client-side only (`src/lib/gate.ts` + `src/components/basics/GateScript.astro`) — localStorage-driven, with no server validation and no telemetry.

## Why the current gate fails

`src/lib/gate.ts` self-documents the problem: *"It is NOT a security boundary (the code is shipped in the client bundle as `PUBLIC_DECK_CODE`)."* But more importantly for the lockout: it relies on `localStorage` being readable and writable, which silently breaks under:

- Safari Intelligent Tracking Prevention
- Private/Incognito mode
- Aggressive third-party cookie blocking
- Some VPN / corporate proxy setups
- Embedded webviews (some WhatsApp link previews)

And there's nowhere for the failure to leave evidence. Hence v2.

## Architecture summary

- **Output:** flip `output: "static"` → `output: "server"`. No per-page `prerender = true` for now; the deck pages SSR (low traffic, Vercel caches anyway).
- **DB:** Astro DB (libSQL, Astro-rebranded Turso) in dev; production points to Turso via env vars. Same schema either way.
- **Gate:** server-rendered `/access` page with a plain HTML form. POST to `/api/access/verify`. Server validates, writes `Session` + `AuthEvent`, sets cookie, redirects.
- **Links:** signed JWT tokens minted via CLI, redeemed at `/access/link/<token>`. Token references a pre-seeded `Identity` row.
- **Sessions:** 90-day rolling cookie. Server-side `Session` row keyed by cookie value.
- **Telemetry:** `AuthEvent` (every attempt), `PageView` (every gated request, middleware-driven), `Action` (interaction events, next pass).
- **Roles:** `Session.role` ∈ `{admin, viewer}`. Two distinct passcodes (`ADMIN_PASSCODE`, `VIEWER_PASSCODE`).
- **Suffix hack:** `VIEWER_PASSCODE-<label>` admits as viewer and stores `<label>` on `Session.shared_label` for downstream attribution.

## Schema (Astro DB tables in `db/config.ts`)

| Table | Purpose |
|---|---|
| `Identity` | Pre-seeded by us before mint. The "person" rolls of activity attach to. |
| `MintedToken` | Signed-link issuance ledger. References Identity. |
| `Session` | Live session, keyed by random id stored in the cookie. Has `role`, `tier`, `shared_label`. |
| `AuthEvent` | Every verify/redeem attempt — success or failure. |
| `PageView` | Per-request log from middleware (gated routes only). |
| `Action` | (Next pass) Fine-grained interaction events from a client-side tracker. |

## Routes added

| Route | Type | Purpose |
|---|---|---|
| `/access` | SSR page | Gate UI (passcode form + error rendering) |
| `/access/link/[token]` | SSR page | Redeem signed link, set cookie, redirect |
| `/api/access/verify` | API (POST) | Validate passcode (with suffix), mint Session, set cookie |
| `/api/access/logout` | API (POST/GET, next pass) | Revoke session |
| `/api/track` | API (POST, next pass) | Action event sink |
| `/admin/activity` | SSR page (next pass) | Per-Identity timeline of sessions + page views |

## Middleware

- Read session cookie.
- If unauthenticated and on a gated path → redirect to `/access?redirect=<encoded>`.
- If authenticated → bump `Session.last_seen_at`, re-issue cookie, insert `PageView` row.
- Public paths: `/`, `/changelog`, `/access`, `/access/link/*`, `/api/access/*`, static asset paths.

## Environment variables

| Var | Phase | Purpose |
|---|---|---|
| `ADMIN_PASSCODE` | v2 | Tier 3 admin passcode (plaintext for now; hash later) |
| `VIEWER_PASSCODE` | v2 | Tier 3 viewer passcode (plaintext for now) |
| `SESSION_SECRET` | v2 | HMAC secret for signed link tokens; also cookie integrity |
| `ASTRO_DB_REMOTE_URL` | v2 prod | Turso libSQL URL |
| `ASTRO_DB_APP_TOKEN` | v2 prod | Turso auth token |
| `PUBLIC_DECK_CODE` | v1 | **Deprecated** — kept while v1 client-gate coexists during transition; remove in follow-up |

## Migration plan from v1 client-gate

1. Add v2 code paths alongside v1 (this commit).
2. Once v2 is verified working in dev + prod (with telemetry confirming both admin and viewer flows), remove `GateScript.astro` insertions, delete `src/lib/gate.ts`, drop `PUBLIC_DECK_CODE`.
3. The `/` cover page becomes the only fully-public page (alongside `/changelog`); everything else is server-gated.

## What this commit includes

- Spec (this file)
- Astro DB integration, schema, migration scaffolding
- `output: "server"` + Vercel adapter (already present)
- Server-side `/access` gate + `/api/access/verify`
- Signed-link redeem at `/access/link/[token]`
- Middleware with session check + PageView insert
- Updated `.env.example`

## What's deferred to next pass

- `mint-link` and `identity:create` CLIs
- `/admin/activity` dashboard
- `/api/track` + vanilla JS event tracker (slide-viewed etc.)
- Logout endpoint
- Removal of v1 client gate
- Turso production cutover (waiting on user to fetch Turso key)
- **Prerender-vs-middleware wrinkle:** `/play/*` and `/changelog/[slug]` use `getStaticPaths`, which forces `prerender = true`. On Vercel, prerendered pages are served from the CDN and **middleware does not run**, so server-gating doesn't apply to those routes. Currently they retain only the v1 client-side gate (`GateScript.astro`). To server-gate them, the routes must be refactored from `getStaticPaths` to an SSR pattern that loads slide/changelog data at request time. Not a regression from v1 (those routes had the same exposure before); flagged for the cleanup pass that removes the v1 gate.

## Build & dev

Local build requires the Astro DB file path:

```
ASTRO_DATABASE_FILE=./astro.db pnpm build
```

For dev, the same env var. Production on Vercel uses `--remote` plus `ASTRO_DB_REMOTE_URL` + `ASTRO_DB_APP_TOKEN` (set in Vercel env panel).

## Related

- [[Rethinking-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]] (parent exploration)
- [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] (lessons)
- [[Troubleshooting-SSG-Authentication-and-Port-to-SSR-w-Database]] (lessons)

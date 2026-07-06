---
title: "id.didi.sh — the Didi Identity Service"
lede: "One small, owned identity service — headless-first API, a signed session cookie on .didi.sh, invite-only accounts created from inside whichever app the user arrived at. Built on Elixir/Phoenix: the one service in the estate where the implementation language is invisible by design, and the BEAM's reliability posture matches what an identity service actually is."
date_created: 2026-07-06
date_modified: 2026-07-06
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
semantic_version: 0.0.1.1
status: Implementing
category: Specification
tags:
  - Spec
  - Didi-Platform
  - Identity-Service
  - Auth
  - SSO
  - Elixir
  - Phoenix
  - Headless-API
  - Magic-Link
  - OAuth
  - Invite-Only
  - Org-Model
  - Multi-Tenant
---

# id.didi.sh — the Didi Identity Service

The central identity plane from [[../explorations/Didi-sh-One-Login-One-Agent-Three-Services|Didi-sh-One-Login-One-Agent-Three-Services]]:
one account, created **from inside whichever service the user is working in**,
valid across memos / decks / augment-it via a single `.didi.sh` session
cookie. This spec pins the contract (what consumers see), the internals
(schema, session model, API), the stack, and the implementation increments.

It supersedes the package-extraction destination in
[[../explorations/Shared-Auth-for-Applied-AI-Labs|Shared-Auth-for-Applied-AI-Labs]]
§Decisions while carrying its architecture over nearly verbatim — credential
pathways, domain-as-id orgs, roles, the stable person id, the scale posture
(invite-only, tens of people, code we own, no Auth0/Clerk).
`dididecks-ai/context-v/specs/Calmstorm-Auth-Inventory.md` is the behavioral
reference for token/session/invite mechanics; because this spec picks a
non-TS stack, calmstorm contributes **semantics, not code**.

### Second prior-art site: fullstack-vc (audited 2026-07-06)

`astro-knots/sites/fullstack-vc` runs a working Turso-backed identity today —
Astro DB (Drizzle over libSQL), **three live OAuth providers (GitHub,
LinkedIn, Google)** with a battle-tested multi-provider account-linking flow
(`src/lib/user-record.ts`: provider-sub lookups + email-array union merges),
stateless HS256 JWT sessions (`src/lib/session.ts`), and authorization via a
roster JSON. The decision on reuse: **import, don't share.** Its schema is
shaped for a roster-gated community site (row `id` is the lowercased roster
email — the mutable-key problem `didi_id` exists to avoid) and its symmetric
HS256 session model can't serve a multi-consumer platform (any verifier could
mint). What it contributes: its **user rows are imported by email → `didi_id`
when id.didi.sh goes live**, its **account-linking semantics** port as
reference behavior alongside calmstorm's, **LinkedIn** joins the OAuth
roadmap (already proven, and the right provider for a VC audience), and
fullstack-vc itself becomes a future *federated* consumer (own domain — no
`.didi.sh` cookie; provider-mode, per the exploration's clarification).

## The contract — all a consumer ever sees

Three artifacts. If these are stable, the implementation behind them is free
to be anything (which is what makes the stack choice below safe):

1. **A cookie**: `didi_session`, `Domain=.didi.sh`, `HttpOnly`, `Secure`,
   `SameSite=Lax`. Value is a **signed token** (see Session model) any
   `*.didi.sh` backend can verify locally.
2. **A JSON API** at `https://id.didi.sh/api/*` — headless-first, called by
   each service's own branded signup/login UI. The service owns the pixels;
   id.didi.sh owns the record and the session (the GTM hard requirement from
   the exploration).
3. **A public key set** at `https://id.didi.sh/.well-known/jwks.json` for
   local verification, plus `GET /api/me` for identity claims (orgs, roles).

## Stack: Elixir / Phoenix

The operator wants a non-typical stack here, and this is the right service to
do it on — not despite the estate being TypeScript, but because of how this
service relates to the estate:

**Why it's safe here specifically.** The headless-first contract means no
consumer imports this service's code — by design there is no shared library,
no shared types, no shared runtime with the TS estate. Consumers see HTTP, a
cookie, and a public key. This is the *only* service in the family with that
property (the didi agent, by contrast, is shared packages and must stay TS).
An unusual stack anywhere else leaks; here it can't.

**Why the BEAM actually fits.** An identity service is a small, long-running,
session-heavy, low-throughput, must-not-fall-over service — which is the
BEAM's native shape: supervision trees restart what crashes, one node is
plenty for tens of users, and the operational story is a single release in a
container. Concretely:

- **Phoenix** (1.8.x) — `phx.gen.auth` now generates **magic-link-first**
  authentication out of the box; our primary credential pathway is the
  framework default, not a bolt-on.
- **Assent** for the OAuth *client* flows (GitHub, Google Workspace) — the
  `arctic` equivalent: minimal provider plumbing, we own sessions and storage.
- **JOSE (erlang-jose)** for token signing (see Session model).
- **Ecto + a libSQL file** (decided 2026-07-06) — `ecto_sqlite3`/`exqlite`
  compiled against the **libSQL** amalgamation instead of vanilla SQLite.
  libSQL is a compliant fork (same file format, same C API), so the full
  Ecto + `phx.gen.auth` story works unchanged on a libSQL file — and the
  Turso door stays open by construction. **Litestream replicating to R2** is
  the backup layer (bucket + credentials recipe already verified in
  [[../../augment-it/context-v/explorations/JuiceFS-Pinned-Path-Off-Local-Substrate|JuiceFS-Pinned-Path-Off-Local-Substrate]]).
  The nuance that shaped the decision, pinned: **libSQL's compliance is in
  the file and the C API; the remote conveniences (embedded replicas with
  sync, Hrana-over-HTTP) live in Turso's client SDKs, which have no official
  Elixir member** — so libSQL-local is cheap and real today, and flipping the
  file to a Turso-synced replica is the *named upgrade path* for when an
  Elixir client matures, not a v1 dependency. Postgres remains the
  config-swap fallback if the hosting target makes it compelling.
- **Swoosh** for transactional email (magic links) with a Resend or Postmark
  adapter — provider decision open below.
- **Phoenix LiveView for the admin console** — invites, orgs, memberships,
  roles, sessions-kill, auth-event log, served at `id.didi.sh/admin` behind
  `superuser`. This is the "secondary account console" from the exploration,
  and it comes nearly free with the stack — a genuine point in Elixir's
  favor, since headless service + admin UI would otherwise mean a second
  frontend project.
- **Bandit** as the HTTP server; a standard multi-stage Dockerfile producing
  an OTP release; deploys wherever the augment-it deploy plan lands.

**The honest costs, named:**

- One more language in the estate. Contained by the no-shared-code property,
  but debugging/extending this service means Elixir competence, and agents
  working the tree should know this repo is the polyglot exception.
- Calmstorm's audited TS auth code cannot be extracted — only ported. The
  inventory becomes a behavioral checklist (token single-use semantics,
  session expiry, DB-unavailable graceful degradation), which is honestly
  most of its value anyway.
- Smaller ecosystem for oddball needs. Mitigated by how boring this service's
  needs are: HTTP, crypto, SQL, email.

## Session model

Two layers: a **stateless verify path** (so services never block on
id.didi.sh) and a **stateful authority** (so sessions are revocable and
refreshable).

### The token in the cookie

The `didi_session` cookie value is a compact signed token (JWT, **EdDSA /
Ed25519**; ES256 is the fallback if any consumer's JWT library balks):

```json
{
  "sub": "<didi_id>",          // stable person id (UUIDv7)
  "sid": "<session_id>",       // row in sessions table
  "iat": 1720281600,
  "exp": 1720324800,           // ~12h
  "iss": "https://id.didi.sh"
}
```

**Deliberately not in the token:** orgs, roles, email. Claims stay small and
role changes propagate fast — consumers fetch `GET /api/me` (ETag-cached)
when they need org/role context, which for most requests they've already
cached per `sid`.

### Verification (consumer-side, local)

A service verifies the signature against the JWKS public key and checks
`exp`. No network call per request. Key rotation: keys carry `kid`; JWKS is
cached with a sane TTL; rotation keeps the outgoing key published until all
tokens signed by it have expired.

### Refresh and revocation

- **Refresh.** Sessions are long-lived server-side (30-day rolling in the
  `sessions` table); the cookie token is short-lived (~12h). Any app seeing
  `exp` within a threshold triggers a silent same-site
  `fetch('https://id.didi.sh/api/session/refresh', { credentials: 'include' })`
  — id.didi.sh checks the session row and re-sets the cookie with a fresh
  token. No user-visible hop.
- **Revocation.** Killing a session (admin, or user "log out everywhere")
  deletes/expires the session row — refresh then fails and the token dies at
  its `exp`. **Accepted revocation lag: up to the token TTL (~12h).** At
  tens-of-users scale with invite-only accounts this is a documented
  trade, not a gap; if it ever matters, the escalation is a short denylist
  endpoint consumers poll — named, not built.
- **Logout** (`DELETE /api/session`) kills the session row *and* clears the
  cookie at `Domain=.didi.sh` — one logout, everywhere, matching the
  one-session promise.

### Minting authority

Only id.didi.sh mints and sets `didi_session`. Any `*.didi.sh` host *can*
technically set a parent-domain cookie — signed values make a forged cookie
inert (no valid signature → rejected) — but the trust-boundary rule from the
exploration stands regardless: nothing untrusted ever runs on `*.didi.sh`.

## Schema

Carried from [[../explorations/Shared-Auth-for-Applied-AI-Labs|Shared-Auth-for-Applied-AI-Labs]]
with the central-service simplifications applied:

| Table | Notes |
|---|---|
| `users` | `didi_id` (UUIDv7, **pinned — this is the rename of `lossless_id`**, minted here and only here), `primary_email` (unique, citext), profile fields (name, handle, avatar), timestamps. |
| `organizations` | **`id` = canonical email domain** (locked convention: `lossless.group`, `trychroma.com`, `personal` bucket), `slug`, `name`, apex-stripped. |
| `firm_profiles` | 1:1 nullable extension on organizations (firm_kind, brand fields). Same firm==org dual-vocabulary. |
| `memberships` | `(didi_id, org_id, role)`; role ∈ `superuser` / `org_owner` / `org_admin` / `editor` / `viewer`. Org-wide roles, no per-resource ACLs (v1 posture unchanged). |
| `oauth_accounts` | 1:N under users — provider, provider_uid, raw profile snapshot. |
| `user_emails` | Alt emails (added 2026-07-06): `(didi_id, email)`, unique on lowered email across all aliases; magic links to any alias authenticate the same `didi_id`. One person, many addresses — the fullstack-vc lesson normalized preemptively. |
| `login_tokens` | The unified single-use table: `kind` ∈ `magic_link` / `invite`, hashed token, `expires_at`, `claimed_at`, `issued_by`, `org_id` + `role` (for invites), delivery-channel metadata. Magic-link and invite are the same code path with different delivery — the Fork 4 insight, kept. |
| `sessions` | `sid`, `didi_id`, created/last_seen/expires, user-agent + IP snapshot, revoked_at. The refresh/revocation authority. |
| `auth_events` | Born central (the outbox collapse): `occurred_at`, `didi_id`, `app_slug`, `org_id`, `event_type`, payload. `app_slug` comes from the calling service's registered app record. |
| `apps` | The registered consumers: `slug` (`augment-it`, `decks`, `memos`), display name, allowed `next` redirect prefixes, enabled flag. Small but load-bearing — it's what stops an open-redirect via the `next` param and what stamps `app_slug` on events. |

Per-service authorization state (augment-it's workspaces, decks' deck
ownership) stays **in the services**. id.didi.sh answers *who you are and
what org-roles you hold*; each service maps that onto its own resources
(for augment-it: org ↔ workspace per
[[../../augment-it/context-v/specs/Workspaces-as-Tenant-Primitive|Workspaces-as-Tenant-Primitive]]).

## API surface

All JSON under `/api`, CORS restricted to `https://*.didi.sh` with
credentials. Invite-only: **there is no open create-account endpoint** —
accounts come into existence by redeeming an invite or (for a known email) a
magic link.

### Session + identity

| Endpoint | Does |
|---|---|
| `GET /api/me` | Identity + org memberships + roles for the presented cookie. ETag-cached. |
| `POST /api/session/refresh` | Re-mint the cookie token if the session row is alive. |
| `DELETE /api/session` | Logout: kill session row, clear cookie domain-wide. |
| `GET /.well-known/jwks.json` | Public keys for local verification. |

### Credential pathways (called from each app's own UI)

| Endpoint | Does |
|---|---|
| `POST /api/magic-links` | `{ email, app, next }` → if the email belongs to a known user, issue + send a magic link. Always 202 (no account enumeration). |
| `POST /api/magic-links/redeem` | `{ token }` → validate single-use + TTL, mint session, set cookie, return `{ next }` for the app to navigate. |
| `POST /api/invites/redeem` | `{ token }` + profile fields → **creates the account** (this is signup), attaches the membership the invite carried, mints session, sets cookie. |
| `GET /api/oauth/:provider/start?app=&next=` | Begin OAuth (GitHub / Google). 302 to provider. The one flow that must leave the app — the provider callback needs a stable redirect URI on id.didi.sh. |
| `GET /oauth/:provider/callback` | Complete OAuth: match or link `oauth_accounts` (Google Workspace per-org domain allowlist enforced here), mint session, set cookie, 302 to validated `next`. Existing-account match only — OAuth against an unknown identity does not create an account (invite-only). |

The redeem endpoints are `fetch`-able from app pages (same-site), so signup
and login render entirely inside the app's own UI — the GTM requirement. A
minimal hosted fallback page exists at `id.didi.sh/access` for edge cases
(expired-link recovery on a device with no app context), styled quiet.

### Admin (LiveView console at `/admin`, plus API for automation)

Invites (create with org+role, list, revoke), orgs + firm profiles CRUD,
memberships + role changes, sessions (list, kill), auth-event log, app
registry. `superuser` only; every superuser action writes an `auth_events`
row with the acting user (the audit-trail requirement from the original
exploration).

## Consumer adapters

Each consumer adds a **thin verification adapter + env vars** — no
rearchitecture (the deploy-independence clarification in the exploration):

| Consumer | Adapter |
|---|---|
| **augment-it** (first) | TS: parse `didi_session` on the workspace WS upgrade, verify via `jose` (npm) + cached JWKS, attach `{ didi_id, sid }` to the socket session; per-capability authorization consults cached `/api/me` org-roles mapped onto workspaces. Replaces the flat token map in `services/workspace/src/auth.ts`. The shell's login/signup panel calls the credential endpoints directly. |
| **decks** (second) | Astro middleware port of the calmstorm gate: same cookie parse + `jose` verify; `Organization`/`Membership` reads move to `/api/me`. Calmstorm's passcode flow retires in favor of invites. |
| **memos web** (third) | Same TS adapter on its web endpoints. |
| **memos desktop (Tauri)** | No cookie jar: system-browser OAuth/magic-link against id.didi.sh with a deep-link back carrying a one-time code → exchanged for a long-lived token held in the OS keychain → presented as `Authorization: Bearer` to the FastAPI sidecar, which verifies with `PyJWT` + JWKS. The token-exchange endpoint (`POST /api/device/exchange`) is the one Tauri-specific addition. |

A tiny per-language verify snippet (TS `jose`, Python `PyJWT`, ~30 lines
each) ships as *documentation in this spec's repo*, not as a published
package — consumers copy it in, per the no-shared-code property.

## Repo + deploy shape

- **New child repo `ai-labs/id-didi-sh/`** (submodule, per pseudomonorepo
  discipline), scaffolded with `context-v/` + `changelog/`. The polyglot
  exception in the tree — its CLAUDE.md says so and points here.
- Single container (multi-stage Dockerfile → OTP release), SQLite volume +
  Litestream sidecar (or supervised process) replicating to a dedicated R2
  bucket. Secrets: signing keypair, R2 creds, email API key, OAuth client
  secrets — via the deploy host's secret store, never in the repo.
- Deploys beside augment-it under the same deploy plan
  ([[../explorations/Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge|Two-Clients-One-Flow]]
  Thread 3); DNS `id.didi.sh` → this container. It must be deployed for the
  cookie to be real — there is no meaningful laptop-only mode beyond dev
  (`localhost` dev uses a host-only cookie and a dev keypair).

## Implementation increments

1. **Walking skeleton. ✅ DONE 2026-07-06** (`id-didi-sh@3e9f90e`). Full
   schema in one migration, Ed25519 keypair + JWKS, magic-link issue →
   redeem → `didi_session` cookie → `/api/me` → refresh → logout. 19 tests
   green; proven live by `scripts/prove-skeleton.sh` (including
   reuse-rejected and post-logout-rejected). Deviation from the plan as
   written: `phx.gen.auth` was NOT used — its generated code assumes
   browser-session flows (Phoenix signed sessions, LiveView forms), not our
   JWT-cookie + JSON-API contract, so the contexts are hand-rolled while
   mirroring its token-hashing discipline. Gotchas logged in the repo's
   changelog `2026-07-06_02`: config appended below `import_config`
   silently overrides every per-env file; schemaless `insert_all` needs
   maps JSON-encoded by hand on SQLite.
2. **First consumer: augment-it.**
   > **Update 2026-07-06 — the WS-gate half is DONE, dev mode**
   > (`augment-it@b642fba`, proven by `scripts/prove-didi-auth.mjs`):
   > the workspace upgrade verifies `didi_session` locally (jose + JWKS,
   > EdDSA-only), attaches `didi_id` to the session, with a
   > `DIDI_AUTH=off|optional|required` posture flag (dev default:
   > optional — legacy continuity tokens keep working). Local-dev
   > topology mirrors prod: host-only localhost cookies ignore ports, so
   > the dev id at `:4000` plays the role of `.didi.sh`; the container
   > fetches JWKS via `host.docker.internal`. **Update, same day: the shell half is DONE too**
   > (`augment-it@ebf1339` + id CORS plug): header DidiBadge with
   > server-verified state and the in-app magic-link sign-in popover,
   > over config-driven exact-origin CORS. **Remaining in this
   > increment:** the per-capability `didi_id` → org-role → workspace
   > mapping. `required` mode flips after increment 3's invites.

   Concretely, picking up from increment 1:
   - **Replace the flat token map** in
     `augment-it/services/workspace/src/auth.ts` (a `sessions.json`
     token→created_at map today) with a verify adapter: parse the
     `didi_session` cookie on the workspace **WS upgrade**, verify locally
     via `jose` (npm) against a cached JWKS fetch from the id service
     (re-fetch on unknown `kid`), and attach `{ didi_id, sid }` to the
     socket session.
   - **Per-capability check**: map `didi_id` → org memberships (cached
     `GET /api/me`, ETag) → workspace access, per
     [[../../augment-it/context-v/specs/Workspaces-as-Tenant-Primitive|Workspaces-as-Tenant-Primitive]].
   - **The shell's access panel** calls `POST /api/magic-links` +
     `/api/magic-links/redeem` directly (headless contract; the panel owns
     the pixels). Dev-mode: id at `http://localhost:4000`, augment-it
     pointing at it via env (`ID_ISSUER_URL`, `ID_JWKS_URL`), host-only
     cookie on localhost.
   - Dev users come from `mix id.seed` until increment 3's invites.
3. **Invites + admin console.** `login_tokens(kind=invite)`, the LiveView
   admin (invites, orgs, memberships, sessions), auth events. This is the
   increment that makes reach-edu + humain-vc onboarding real: mint invites,
   deliver by WhatsApp/1Password/email.
4. **OAuth.** GitHub (team fast-path), then Google Workspace with the per-org
   domain allowlist; LinkedIn follows (fullstack-vc's wiring as reference).
   Assent wiring + account-linking rules ported from the fullstack-vc merge
   chain.
5. **Deploy.** id.didi.sh live per the deploy plan; augment-it flips from dev
   id to prod id; **fullstack-vc identities imported (email → `didi_id`)**;
   first real client invites go out.
   > **Update 2026-07-06 — the hosting half landed early.** id-didi-sh runs
   > on Fly.io (`lax`, volume-mounted libSQL, migrate-at-boot, auto_stop
   > off), secrets set without exposure, JWKS live at `id-didi-sh.fly.dev`;
   > TLS cert issued for `id.didi.sh` pending two DNS records in Vercel
   > (the didi.sh registrar). The import + invite halves stay with
   > increments 3–4. Litestream→R2 is the named follow-up before real
   > client accounts exist. See the repo changelog `2026-07-06_04`.
6. **Consumers two and three.** decks middleware port (calmstorm retires its
   own gate), memos web, then the Tauri device-exchange flow.

## Acceptance criteria

1. An invited user opens an invite link **in the app that invited them**,
   completes signup without ever seeing an id.didi.sh page, and lands
   authenticated — cookie set for `.didi.sh`.
2. That user opens a second service and is **already logged in** — no click,
   no redirect.
3. Every service verifies sessions **locally** (signature + exp); id.didi.sh
   being briefly down breaks new logins and refreshes only, not existing
   traffic.
4. Logout in any app logs out of all apps; an admin can kill any session,
   effective within the token TTL.
5. Accounts exist only via invite redemption; magic links and OAuth
   authenticate existing accounts only; there is no self-serve signup path
   anywhere.
6. Google Workspace sign-in for an org with a domain allowlist rejects
   identities outside the domain; the `next` param only redirects to
   registered app prefixes.
7. Every superuser admin action and every sign-in/out lands in `auth_events`
   with `app_slug`; the LiveView console can answer "every sign-in for user X
   across all services" — the roll-up dashboard question, natively.
8. augment-it's capability gate authorizes by `didi_id` → org-role →
   workspace; the flat `sessions.json` token map is deleted.
9. The Tauri flow yields a keychain-held bearer token the FastAPI sidecar
   verifies offline via JWKS.

## Open questions

1. **Hosting target** — inherited from the deploy plan (Railway vs
   Hetzner/DO box). The store is decided (libSQL file + Litestream→R2);
   the host just needs a persistent volume. Managed Postgres is the fallback
   only if the chosen host makes volumes painful.
2. **Email provider** for magic links (Resend vs Postmark; Swoosh supports
   both). Needed by increment 1's end.
3. **EdDSA vs ES256** — confirm EdDSA verifies cleanly in the exact `jose`
   (npm) and `PyJWT` versions the consumers pin, else drop to ES256. One-time
   check in increment 2.
4. **`didi_id` pinned here** — flagged rather than open: this spec commits to
   the rename; object before increment 1 mints the first row.
5. **Session lifetimes** — 12h token / 30d rolling session are defensible
   defaults, not researched conclusions; revisit against real client usage.
6. **BYOK key storage** (exploration Q6) — deliberately *not* in this
   service's v1 schema. Web-tier BYOK keys stay per-service until the didi
   agent work forces the question.

## Related

- [[../explorations/Didi-sh-One-Login-One-Agent-Three-Services|Didi-sh-One-Login-One-Agent-Three-Services]] — the platform frame; the GTM headless requirement; the trust-boundary and deploy-independence clarifications this spec operationalizes.
- [[../explorations/Shared-Auth-for-Applied-AI-Labs|Shared-Auth-for-Applied-AI-Labs]] — the architecture source (pathways, org model, roles, scale posture); Fork 1 flipped 2026-07-06.
- `dididecks-ai/context-v/specs/Calmstorm-Auth-Inventory.md` — behavioral reference for token/session mechanics; ported, not extracted.
- `astro-knots/sites/fullstack-vc/src/lib/{user-record,session,oauth-roster}.ts` — the second prior-art implementation: three-provider OAuth + account-linking merge chain (imported + ported, not shared — see §Second prior-art site).
- [[../explorations/Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge|Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge]] — the deploy plan this rides; reach-edu + humain-vc are the first invited users.
- [[../../augment-it/context-v/blueprints/Auth-Patterns-following-Astro-Knots-Patterns|Auth-Patterns-following-Astro-Knots-Patterns]] — the augment-it gate this adapter lands in.
- [[../../augment-it/context-v/specs/Workspaces-as-Tenant-Primitive|Workspaces-as-Tenant-Primitive]] — the org↔workspace mapping on the consumer side.

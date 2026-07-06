---
title: "Shared Auth for Applied AI Labs"
lede: "We're about to need a real auth story across three sibling apps in ai-labs — memopop-ai, dididecks-ai, and the just-arriving augment-it. None of them is at the scale that justifies Auth0/Clerk pricing or robustness. We want a small, owned auth system that handles OAuth (GitHub + Google Workspace), pre-shared invites delivered by WhatsApp or 1Password, organization-scoped permissions, and a viewer-tier for memos and decks published on client subdomains — with a roll-up seam stubbed from day one so we can wire cross-app dashboards later without rewriting clients."
date_created: 2026-05-17
date_modified: 2026-07-06
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
  - Claude Code on Claude Fable 5
semantic_version: 0.0.1.0
tags:
  - Auth
  - Multi-Tenant
  - Org-Model
  - OAuth
  - GitHub
  - Google-Workspace
  - Magic-Link
  - WhatsApp-Invite
  - Lossless-ID
  - Roll-Up
  - Cross-App
  - Tauri
  - Astro
  - SvelteKit
  - libSQL
  - Turso
status: Draft
---

# Shared Auth for Applied AI Labs

## What this exploration is for

We have two actively-shipping AI products under `ai-labs/` — `memopop-ai` (multi-agent investment-memo orchestration) and `dididecks-ai` (slide-deck operating system for due-diligence-grade content) — and a third (`augment-it`) about to land. All three will need a login flow within weeks, and the shape of "a user" is essentially the same across them: a real person from a client firm or from the Lossless Group, signing in to do work, with light analytics on their session and (soon) organization-scoped admin powers.

This is a journey-mode doc, not a spec. The destination isn't pinned. The goal is to **converge on enough of an architecture that the first per-app implementation seeds the second and third instead of locking them out** — and to capture the forks we considered, even the ones we rejected, so a future agent (or future-Mike) reading this doesn't have to re-walk the option space.

When this exploration produces enough alignment, the next step is a spec — likely a sibling `[[Shared-Auth-Core-Package.md]]` in `specs/` plus per-app prompts. If the published-memo viewer-auth sub-system grows past a section, it forks to its own exploration: `[[Viewer-Auth-on-Published-Client-Surfaces.md]]`.

## What we're optimizing for (and what we're not)

**Optimizing for:**

- **Cost.** No Auth0, Clerk, WorkOS, Stytch. Their pricing assumes scale and consumer-grade ironclad security, neither of which matches us yet.
- **Code we own.** We're a small team. We'd rather understand 800 lines of auth than depend on 80,000 lines we can't read on a flight.
- **Pattern reuse across the three apps.** Same login flow, same session shape, same org/permission model. Different UIs, same primitives.
- **Per-project independence.** Each app keeps its own database. No central auth service is required for any single app to function.
- **A roll-up seam, stubbed from day one.** Every app stamps a stable `lossless_id` on its users and writes auth events to a local outbox table — so when we later want a cross-app dashboard, the data is already there to ingest, no client rewrites required.

**Explicitly NOT optimizing for:**

- Defending against motivated attackers, mass account creation, credential stuffing, etc. Our scale is "tens of people at a handful of client firms." Standard hashing, session expiry, and HTTPS are enough.
- SOC 2 / ISO compliance. If we win an engagement that demands it, we'll revisit.
- Anonymous user growth funnels. Every user is invited or known.
- High-throughput session validation. libSQL (SQLite-compatible) is fine.

## The three apps and what each needs

| App | Stack today | Who logs in | First org needs |
|---|---|---|---|
| `memopop-ai` | Tauri (Rust) + Svelte 5 frontend + Python FastAPI sidecar | Lossless team running memos for client firms; client firm members soon | Firm-scoped artifact ownership, "switch firm" UX, viewer-level access to published memos on client subdomains |
| `dididecks-ai` | Astro / SvelteKit (web-first) | Lossless team building decks; client firm presenters soon | Deck ownership at the firm level, shareable links for prospects, presenter-mode auth |
| `augment-it` | TBD, likely Astro / SvelteKit web | TBD — described as forthcoming | TBD; design assuming the same primitives apply |

The mix matters: **memopop is desktop (Tauri) and the other two are web-first**, so the auth core can't assume browser cookies are the universal session medium. The Tauri app uses the OS keychain for refresh tokens; the web apps use HTTP-only `SameSite=Lax` cookies on their own domains.

This is the smaller of the two known stack-bridging concerns. The bigger one is **published memos on client subdomains** (`memos.acmevc.com/deal-name`), where the page is served from a different origin than the app that authored it. That's why viewer auth gets its own treatment below.

## The recommended shape (so we can react to it, not start from blank)

A short version, then the forks underneath. Throughout: **libSQL via Turso** is the database layer (compliant SQLite fork with embedded replicas, native HTTP, and managed hosting we already have accounts for; first-class client support in our Astro/SvelteKit stack).

### 1. A shared TypeScript package: `@lossless/auth-core`

Single package, used by all three apps' frontends and any TS server middleware (SvelteKit endpoints, Astro server endpoints). Exports:

- **Schema** — `users`, `organizations`, `memberships`, `sessions`, `credentials`, `oauth_accounts`, `magic_links`, `invite_tokens`, `auth_events_outbox`. SQL migration files plus a thin TS layer (Drizzle or Kysely) for typed access.
- **OAuth flows** — built on [`arctic`](https://github.com/pilcrowOnPaper/arctic), which is a small, well-maintained library that does *just* the OAuth provider plumbing for GitHub, Google, Microsoft, etc. We write the session and storage code ourselves on top.
- **Session helpers** — issue, validate, revoke. Cookie-based for web; token-based for Tauri (returned in response body, stored client-side in the OS keychain).
- **Three credential pathways**, unified behind a single `authenticate(credential) → session` interface:
  1. OAuth — GitHub or Google Workspace
  2. Magic-link email — for clients without a usable OAuth identity, or as a recovery path
  3. Pre-shared invite token — same code path as magic-link but the delivery channel is whatever (WhatsApp DM, 1Password share, in-person QR code). The token itself is a single-use, time-boxed, server-issued string.
- **Permission predicates** — `canRead(user, resource)`, `isAdminOf(user, org)`, etc. Small composable helpers, not a full ACL/RBAC engine yet.

### 2. A slim Python companion: `lossless-auth-py`

Lives next to the orchestrator's existing FastAPI in `apps/memopop-orchestrator/src/`. **Reads the same `sessions` table the TS package writes to**, validates session tokens passed in `Authorization: Bearer …` headers, and exposes a FastAPI dependency:

```python
from lossless_auth import require_session

@app.get("/firms/{firm}/deals")
async def list_deals(firm: str, session = Depends(require_session)):
    ...
```

The TS and Python sides agree on the session table format and the token signing scheme (HMAC-SHA-256 of `session_id || expires_at` with a per-app secret). Nothing more is shared — no shared ORM, no shared models. The session table is the contract.

### 3. Per-app libSQL (Turso), with `lossless_id` everywhere

We use **libSQL** rather than vanilla SQLite — it's a compliant fork that adds embedded replicas, native HTTP/WebSocket access, encryption-at-rest, and Turso hosting on top of full SQLite wire compatibility. We already have Turso accounts, and the Astro/SvelteKit ecosystem in our stack ships first-class libSQL client support. Every place this doc later says "SQLite-shaped" should be read as "libSQL, with the SQLite contract preserved."

Per-app deployment shape options (any are valid; choose per app):

- **Embedded local file** (`file:./auth.db`) — for Tauri (memopop), where the database lives on the user's machine and the app is the only client.
- **Turso-hosted remote** — for the web apps (dididecks-ai, augment-it), where the server endpoint reads/writes against a Turso database over HTTP/WebSocket.
- **Embedded replica with sync to Turso** — for web apps that want low-latency local reads (the embedded replica) and Turso as the durable upstream. The libSQL client handles the sync.

Each app keeps its own `auth.db` (or includes the auth tables in its existing libSQL database). The `users` table carries:

- `id` — local app-scoped primary key
- `lossless_id` — UUID stable across all Lossless apps for the same person
- `primary_email`
- `created_at`, `last_seen_at`
- Profile fields (name, handle, avatar URL, etc.) — denormalized per app, refreshed on login

The `lossless_id` is minted the first time a user signs into *any* Lossless app and looked up by `primary_email` thereafter. (Email is the join key across apps. If a user's email changes, we re-stitch lazily — a known edge case to revisit.)

Roll-up later = `SELECT * FROM app1.users JOIN app2.users USING (lossless_id) JOIN app3.users USING (lossless_id)`. No central service needed for the first version.

### 4. The `auth_events_outbox` table — the roll-up seam

Every meaningful auth event (sign-in, sign-out, org-switch, role-change, viewer-impression-on-published-memo) writes a row to a local `auth_events_outbox` table. Format mirrors `claude-code-tool-traces`:

```sql
CREATE TABLE auth_events_outbox (
  id INTEGER PRIMARY KEY,
  occurred_at_ms INTEGER NOT NULL,
  lossless_id TEXT NOT NULL,
  app_slug TEXT NOT NULL,          -- 'memopop-ai' | 'dididecks-ai' | 'augment-it'
  org_id TEXT,                     -- nullable for org-less events
  event_type TEXT NOT NULL,        -- 'sign_in' | 'sign_out' | 'org_switch' | ...
  payload_json TEXT,               -- arbitrary event-specific data
  ingested_at_ms INTEGER           -- NULL until a central ingester claims the row
);
```

A future ingester (parallel to `context-vigilance-kit/scripts/ingest-all.sh`) pulls unclaimed rows from each app's libSQL database — either by walking local files (Tauri) or by querying the Turso-hosted ones over HTTP — writes them to a central store (likely a separate Turso database), and stamps `ingested_at_ms`. **We do not build this on day one.** The seam exists; the ingester can be a weekend project when we actually want the dashboard.

A nice property of staying on libSQL end-to-end: the central rollup store is the same shape as the per-app stores, so we can use the same client library and migration tooling for both.

### 5. Organization model: "firm" and "org" are the same row, different vocabularies

Per the discussion with Mike: a **firm** and an **org** refer to the same group of people / URL / brand identity. They differ in *what the system lets that group do*:

- "Firm" is the **client-facing noun**. The UI in memopop and dididecks says "Firm" because that's how Lossless and our clients talk about VC partners and operating companies.
- "Org" is the **system noun**. Admin panels, member management, role assignment, superuser permissions, and (eventually) the published-surface configuration sit under the "org" vocabulary.

Implementation: **one `organizations` table** is the auth primitive. A `firm_profile` extension (1:1, nullable) carries the firm-specific fields (portfolio, AUM tier, brand assets, vault path). The Lossless Group itself is an organization without a firm profile. Future non-firm orgs (LP groups? portcos that become direct users?) just get other extension profiles.

This avoids the trap of having two near-identical tables (`firms` and `orgs`) drifting apart over time.

#### Organization naming convention — domain-as-id

Locked 2026-05-17 during chroma-decks Phase 6 implementation: **the `Organization.id` is the org's canonical email domain.** `Organization.slug` carries the human-readable handle.

| Org type | `id` (canonical domain) | `slug` (handle) | `name` (display) | `firm_profile` |
|---|---|---|---|---|
| Lossless Group (consulting parent) | `lossless.group` | `lossless-group` | `Lossless Group` | absent |
| Chroma (portco, fundraising) | `trychroma.com` | `chroma` | `Chroma` | absent (operating company, not a VC firm) |
| Calm/Storm Ventures (VC firm) | `calmstormvc.com` | `calm-storm-ventures` | `Calm/Storm Ventures` | present (`firm_kind: vc`) |
| Personal-email bucket | `personal` | `personal` | `Personal email signups` | absent |

**Why domain-as-id:**

1. **OAuth-natural.** A Google Workspace OAuth callback gives you `user@trychroma.com`; `email.split('@')[1]` is the org_id. Zero translation table.
2. **Globally unique.** Two companies can both want the slug "studio"; nobody else gets your domain.
3. **Self-documenting.** Reading `organization_id = "trychroma.com"` tells the reader what they need to know. `"chroma"` requires a mapping.
4. **Cross-app rollup keys naturally.** When memopop, chroma-decks, and dididecks all stamp memberships against `trychroma.com`, the future rollup ingester joins on the same id without any client-side coordination.

**Default seeding pattern.** Every app in `ai-labs/` seeds two Organization rows on first boot:

1. **`lossless.group`** — the operating-team org. Lossless team members eventually attach here with role `superuser`.
2. **`{client-domain}`** — the deck / app's primary client (for chroma-decks this is `trychroma.com`; for memopop's per-engagement instances it's the firm's domain).

Apps with multiple clients in one deployment (a future "platform" mode) seed `lossless.group` plus one row per client domain.

**Edge cases:**
- **Personal emails** (`mpstaton@gmail.com`, `someone@hotmail.com`) — not real orgs. Bucket them as `id = "personal"` or `id = "personal:gmail.com"` (the second form lets analytics distinguish gmail vs proton vs outlook). Identity carries the actual person.
- **Acquired / multi-domain firms** — handle when first encountered. Either an `aliases` column on Organization or a separate `OrganizationDomain` join table. Not v1.
- **Subdomains** — strip to apex. `memos.acmevc.com` resolves to `acmevc.com`. Same org.

**Future-proofing the @lossless.group fast-path.** When OAuth (or magic-link) yields `primary_email.endsWith("@lossless.group")`, attach to `lossless.group` with role `superuser` automatically. Saves admin work for the operating team. Named here as an explicit follow-up, not v1.

### 6. Roles inside an organization

Initial roles, deliberately few:

| Role | Capabilities |
|---|---|
| `superuser` | Lossless Group employees only. Can act across orgs. Bypasses most permission checks. |
| `org_owner` | Full control of one organization. Can add/remove members, change roles, configure publishing surfaces, delete the org. |
| `org_admin` | Manage members and roles below `org_owner`. Cannot delete the org or transfer ownership. |
| `editor` | Create / modify / publish artifacts (memos, decks) in the org. Cannot manage members. |
| `viewer` | Read-only access to published artifacts the org has granted them visibility on. The default role for invited external readers. |

We do NOT start with per-resource ACLs ("user X can edit memo Y but not memo Z"). Resources are owned by orgs, and roles apply org-wide. If we hit a case where that's wrong, we revisit.

### 7. Published memos on client subdomains: public preview + auth-gated detail

Per the discussion with Mike, the published-surface design is **two layers per artifact**:

1. **Public preview page** — anyone on the internet can hit `memos.acmevc.com/some-deal` and see a summary: the headline, the framing, the firm's brand. Tracked anonymously via a fingerprint + first-party cookie so we can attribute repeat visits and conversions even pre-login.
2. **Auth-gated detail body** — the full memo (sections, sources, scorecard) lives behind a magic-link viewer auth. A "Read the full memo" CTA on the preview triggers an email-link flow; the viewer lands back on the page authenticated.

Viewer accounts are first-class but light:

- A `users` row with `lossless_id`, `primary_email`, denormalized profile
- An `organization_membership` row attaching them to the publishing org with role `viewer`
- Their profile is incrementally enrichable — they can add LinkedIn, role, firm affiliation, areas of interest — but nothing is required beyond the email they verified via magic link.

The mechanism that ties a published subdomain back to our infrastructure (DNS, hosting, the actual rendering of the memo + auth handshake on `memos.acmevc.com`) is **out of scope for this exploration** and probably forks to `[[Published-Memo-Hosting-and-Viewer-Auth.md]]` once we actually need to ship it. For now we just know the auth core needs a `viewer` role and a magic-link delivery path.

## The forks we considered

### Fork 1 — Library, service, or both?

| Option | Pros | Cons |
|---|---|---|
| **A. Shared library, per-app DB** ← recommended | Each app independent. No SPOF. Easy to ship the first app. Roll-up via outbox + join. | Schema drift risk between apps. Have to update three places when schema evolves. |
| B. Central auth service all apps call | Single source of truth. Easier cross-app session reuse. Org membership lookup in one place. | SPOF. Network call on every auth check. Requires hosting + uptime SLO before the first app ships. Heavier ops. |
| C. Both — shared library + thin central directory service | "Best of both" on paper. | More moving parts. Three codebases instead of two. Premature complexity for our scale. |

**Lean: A.** B becomes attractive if we hit a wall where the JOIN-by-`lossless_id` roll-up isn't enough (e.g., we want true SSO where signing into memopop signs you into dididecks). We can introduce a thin directory service then without rewriting clients — they'd just call it for `lossless_id` resolution instead of doing the email lookup themselves.

### Fork 2 — OAuth library: `arctic` vs `auth.js` vs `lucia` vs `better-auth`

| Option | Why considered | Why not |
|---|---|---|
| **`arctic`** ← recommended | Tiny, scoped, just provider plumbing. We control the session model. Maintained by the Lucia author with an explicitly minimal mandate. | Doesn't give us session storage, magic links, or invites — we write those. (That's actually a feature.) |
| `auth.js` (formerly NextAuth) | Mature, batteries-included, plays well with SvelteKit/Astro adapters. | Heavy. Opinionated about session shape. Tauri integration is awkward. We'd fight it as often as we'd use it. |
| `lucia` | Was the elegant pick a year ago. Maintenance posture became uncertain (the maintainer announced winding down core development). | Active uncertainty about long-term support. The `arctic` library is the spiritual continuation we'd use anyway. |
| `better-auth` | New, gaining traction, plugin model is nice. | Newer than we want to bet on for cross-platform Tauri + web. Plugin ecosystem is the value prop; we don't need the plugins. |

**Lean: `arctic` for the OAuth handshake, hand-rolled everything else.** The hand-rolled surface is small — maybe 600–800 lines including all three credential pathways — and is the part we want to own and inspect.

### Fork 3 — Session storage: cookies, tokens, or both?

| Option | Pros | Cons |
|---|---|---|
| **Both, contextually** ← recommended | Web apps get HTTP-only cookies (no XSS reach into the token). Tauri gets a bearer token stored in the OS keychain. Same backend session table either way. | Slightly more code in the helpers — `getSession(request)` has to look in both places. Worth it. |
| Cookies only | Simpler. | Doesn't work cleanly for Tauri — the webview's cookie jar isn't a great place to store long-lived auth, and there's no equivalent of a system keychain for cookies. |
| Tokens only | Works everywhere uniformly. | Tokens in `localStorage` on web are vulnerable to XSS in a way HTTP-only cookies are not. Even at our scale, that's the wrong default. |

### Fork 4 — Magic-link delivery vs invite-token delivery

These are the same code path with different delivery channels:

| Pathway | Trigger | Delivery | Use case |
|---|---|---|---|
| **Magic link** | User requests login by email | Transactional email (Resend / Postmark / similar) | Self-serve, "I'm coming back later," password-reset analog |
| **Invite token** | Admin provisions a user | Whatever channel — WhatsApp DM with the link, 1Password share, in-person QR | High-touch onboarding for a client we know |
| **Pre-shared secret** (option) | Admin creates user with a known passcode | User types the secret on first login, then we issue a session | When even a magic-link click is too much friction; rare |

Underneath, all three issue a `magic_links` (or `invite_tokens`) row with a hashed token, an `expires_at`, and a `claimed_at`. The delivery channel is metadata, not architecture.

### Fork 5 — Org model: same row as firm, or layered above?

Per Mike: "a firm and an org are referring to the same group of people. They have differing functions within the applications." So:

- **Chosen:** one `organizations` table + an optional `firm_profile` extension (1:1, nullable). "Firm" is the client-facing rendering; "org" is the system rendering. Same row.
- Rejected: separate `orgs` and `firms` tables with a relationship. Drift over time. Two places to update the same data.
- Rejected: keep `firms` as the table, bolt org-ness onto it. Doesn't accommodate orgs that aren't firms (Lossless Group itself, future categories).

### Fork 6 — Roll-up: now vs later

Per Mike: stub the seam now, build the ingester later. Concretely:

- **Now:** every app's `users` table has `lossless_id`; every app writes to a local `auth_events_outbox`. No central system exists yet.
- **Later:** an ingester pulls from each app's libSQL database (local file for Tauri, Turso HTTP for the web apps), normalizes events into a central Turso store, drives dashboards. We expect to build it when we have a real question we can't answer locally.

The cost of the seam is small: two columns and one table. The cost of *not* having the seam, when we want the dashboard six months from now, is rewriting client code across three apps.

## User stories and scenarios

The scenarios we want the auth system to make easy. Pre-populated from the discussion so far; **add, edit, or strike-through anything that doesn't match the real intention.** The shape of this list is the input we'd judge any spec against.

### Lossless Group team

1. **Mike signs into `memopop-native` via GitHub OAuth** on his Mac. The Tauri app stores his refresh token in the macOS keychain. He sees every firm he's authorized for and can switch between them without re-authenticating.
2. **Mike signs into `dididecks-ai` in his browser** the same day; the system recognizes him by `lossless_id` (same email) and shows the same firm memberships, but does NOT auto-sign him in (no central session; he goes through the OAuth flow again, which is fast because Google/GitHub remembers him).
3. **Mike, as superuser, acts on behalf of `alpha-partners`** to publish a memo to their subdomain. The published artifact is attributed to alpha-partners' org, not to Mike personally. An audit trail records that Mike-as-superuser did the publish.
4. **A second Lossless team member is added** without anyone touching code — Mike opens an admin panel, types their email, picks a role (`superuser` or `org_admin` at the Lossless org), and they get a magic-link invite.

### Client firm partners

5. **A GP at a client firm signs into `memopop-native`** via their firm's Google Workspace account. The system enforces that only `@theirfirm.com` Workspace identities can map to that org's membership (per-org domain allowlist).
6. **A GP whose firm doesn't use Google Workspace** receives a WhatsApp DM with a one-time invite URL. Clicking it on their phone authenticates them, sets a long-lived session cookie, and lands them in their firm's workspace. They never type a password.
7. **A GP enriches their profile** the first time they sign in — name, LinkedIn URL, role at firm, areas of focus. Optional but persistently nudged.
8. **A firm admin invites a colleague** (analyst, associate) at a lower role (`editor` or `viewer`). The invite can be email or "give me a link I can drop in Slack" (an org-scoped one-time token URL).

### Published-memo viewers

9. **A LinkedIn share** sends a stranger to `memos.acmevc.com/seed-stage-ai-startup-X`. They see the public preview page — headline, framing, branded by acmevc — with no friction.
10. The same stranger clicks **"Read the full memo"**, enters their email, gets a magic-link, lands back on the page now showing the gated content. Their viewer account is created on first click; the membership row attaches them to the acmevc org as `viewer`.
11. **The viewer comes back two weeks later** from a Google search, lands on the same URL, and is recognized via session cookie. They see the gated content immediately.
12. **An acmevc partner sees a "viewers" panel** showing who has read which memos, how recently, and which (if any) profile fields they've added. The panel surfaces engagement signal for their relationship workflow.

### Cross-app and roll-up

13. **A future Lossless dashboard** answers "which users are active across more than one app this week?" by JOIN-ing the per-app `users` tables on `lossless_id` — no code change to the apps themselves.
14. **A central security audit** can answer "every sign-in event for user X in the last 90 days across all three apps" by reading the rolled-up `auth_events_outbox` data.

### Edge / failure modes worth naming

15. **A viewer changes email addresses** between visits. We re-stitch lazily — the new email is recognized as a new `lossless_id` at first; if/when they prove ownership of the old email, we merge. (Mechanism TBD.)
16. **A client firm asks "delete everything you have on user X."** We can satisfy it per-app by querying on `lossless_id`. Cascade behavior across viewer-published-memo records needs a policy.
17. **A pre-shared invite token leaks** (forwarded WhatsApp message, screenshotted). Single-use + short TTL is the mitigation; admin "revoke pending invites" UI is the recovery.

> *Mike — extend this list freely. The next pass will turn each numbered scenario into a row in a traceability matrix against the requirements below.*

## Requirements

Three buckets: hard (won't ship without it), soft (nice to have, not blocking), explicitly out (named so we don't accidentally drift into them). **Edit freely.**

### Hard requirements (v1 must-haves)

- **OAuth — GitHub.** Used by the Lossless team day-one.
- **OAuth — Google Workspace.** Used by most client firms day-one; per-org domain allowlist (e.g., alpha-partners' membership only accepts `@alphapartners.com` identities).
- **Magic-link email.** Self-serve return path; also the delivery mechanism for some invite flows.
- **Pre-shared invite tokens.** Single-use, time-boxed, delivered by whatever channel the admin chooses (WhatsApp, 1Password share, email, etc.). Internally same as magic-link.
- **Session validation in Tauri.** Refresh token in OS keychain; session token on every sidecar HTTP call.
- **Session validation in web apps.** HTTP-only `SameSite=Lax` cookies on the app's own domain.
- **Organization model with the firm == org dual-vocabulary.** One `organizations` table, optional `firm_profile` 1:1 extension. memopop's existing `firms` concept migrates onto this.
- **Roles inside an org:** `superuser`, `org_owner`, `org_admin`, `editor`, `viewer`. No per-resource ACLs in v1.
- **`lossless_id` UUID** stamped on every user row in every app.
- **`auth_events_outbox`** table in every app, populated from day one. Central ingester not built yet.
- **Published-memo dual surface:** public preview page (anonymous, fingerprint+cookie tracking) + auth-gated detail body (magic-link viewer auth).
- **libSQL as the database layer**, Turso for hosting where remote makes sense.
- **Audit trail for superuser-as-X actions.** When a Lossless team member acts on behalf of a client org, the action records both the acting user and the assumed org.

### Soft requirements (would be lovely, not blocking)

- **SSO across the three apps.** Sign in to memopop, automatically signed into dididecks. Requires a central directory service we're deferring. Today the user re-runs OAuth in each app, which is ~2 seconds because the upstream provider remembers them.
- **Profile enrichment surface.** UI for users (and viewers) to add LinkedIn, role, firm affiliation, areas of interest. Schema needs to leave room; UI can come later.
- **"Who's reading my memo right now"** presence indicators for client firms watching their own published memos. Pure feature work, no auth dependency beyond the viewer-session-table.
- **2FA (TOTP) for admin roles.** Probably warranted before any client org has >2 admins. Not v1.
- **API tokens** for programmatic access (CLI scripts, automation). Modeled as a special-shaped row in the `credentials` table.
- **Per-firm-branded magic-link emails** (sending domain = client firm's domain, copy = client firm's brand). Requires per-org email-sending configuration. Could ship without it.
- **Anonymous reaction signal** on public preview pages (heart, save, "share with my team") even before login. Low-stakes, high signal.
- **Account-merge UI** for users who change email addresses or have separate sign-ins that should be unified.

### Explicitly out of scope for v1

- **Defending against motivated attackers, credential stuffing, bot networks.** Standard hashing + session expiry + HTTPS is our floor.
- **SOC 2 / ISO compliance.** Revisited if a client engagement demands it.
- **Self-serve sign-up.** Every user is invited or known. No "sign up" button anywhere.
- **Password-based auth.** Passwords are explicitly avoided — OAuth and magic-link only. (Pre-shared "secret in 1Password" is a *token*, not a password.)
- **Per-resource ACLs** (user X can edit memo Y but not memo Z). Roles are org-wide.
- **Multi-region replication** beyond what Turso provides for free. Latency is fine for our scale.

## Open ideas not yet placed

Loose ideas worth capturing before they evaporate. Each one is a candidate for *either* promoting into requirements above, *or* killing as out-of-scope, *or* forking to its own exploration. **None of these is a commitment yet.**

- **Use the existing Lossless GitHub org membership as a fast-path superuser check.** A user whose GitHub identity is in the `lossless-group` org gets `superuser` automatically on sign-in. Removes the need to manually grant Lossless team members access in each app. Risk: org membership privacy settings can hide it; we'd need to request the right scope.
- **System-browser OAuth vs in-app webview for Tauri.** System browser is cleaner UX (uses the user's existing Google/GitHub session), in-app webview is more controllable but a worse experience. Lean: system browser, deep-link back to the app.
- **Magic-link sending domain per client firm.** When acmevc invites a viewer, the email comes from `noreply@memos.acmevc.com` rather than `noreply@lossless.group`. Better delivery + brand. Cost: per-firm DNS / DKIM setup, optional Postmark/Resend sender configuration.
- **WhatsApp Business API for invite delivery.** Today we'd send the WhatsApp message manually. A future automation could send invite links programmatically via WhatsApp Business API, with delivery confirmation. Not v1.
- **Viewer-auth via OAuth as well as magic-link.** A viewer who happens to have a Google identity might prefer "continue with Google" over typing their email. Trivial to add since the OAuth machinery is already there for app users.
- **A "soft delete" tier for orgs and users** so we can sunset a client engagement without losing audit history. Standard pattern but worth thinking through before the first deletion request hits.
- **Cross-app shared "recently viewed" / "your work" stream** that aggregates artifacts a user touched across memopop + dididecks + augment-it. Requires the rollup ingester. Possibly the first thing it pays for.
- **Per-org webhook subscriptions** so a client firm can receive an event when their memo gets a new viewer, a partner publishes a draft, etc. Modeled on Stripe / Linear webhooks. Genuinely useful for active client orgs; doesn't have to land in v1.
- **Embedded auth for "viewer apps."** If a client firm wants to embed the viewer flow on their own site (an `<iframe>` or a JS widget) we'd need a public, sandboxed entry point. Out of v1 but the spec should not architect anything that *prevents* it later.

> *Mike — anything in this list that you actually want to commit to v1 should be promoted into the Hard or Soft requirements above. Anything you want to kill, strike through with a one-line note on why. Anything that's missing entirely, drop it in.*

## What this exploration deliberately leaves open

These need follow-up — either further exploration, or a spec, or both. Listed in roughly the order they'll bite us:

1. **The published-memo hosting and viewer-auth handshake.** How does `memos.acmevc.com` actually serve a page that's authored in `memopop-ai`? Reverse proxy? Per-firm rendered SSG? Edge function? The auth core knows about `viewer` roles and magic links; the hosting layer is its own beast. Fork to `[[Published-Memo-Hosting-and-Viewer-Auth.md]]` when we get serious.
2. **Email delivery.** Transactional email needs a provider account (Resend, Postmark, AWS SES). Costs are real but small. Decide before the first magic-link goes out.
3. **Google Workspace OAuth vs personal Google.** GitHub OAuth is straightforward. Google has two modes; if a client firm uses Google Workspace, we want to scope the app to their domain. Needs a few lines per-org of configuration.
4. **The `superuser` boundary.** Lossless team members acting across client orgs is the convenient default for early operations (we're doing all the work for clients today). But "superuser bypasses permission checks" is the kind of decision that erodes trust if we ever want a client to feel sovereign over their data. Worth an explicit policy.
5. **Account deletion / GDPR-shape requests.** Not urgent at our scale. Worth a paragraph in the spec when we get there.
6. **What `augment-it` actually is.** We're designing assuming the same primitives apply. Confirm or update when augment-it has a first commit.
7. **Profile enrichment surface.** Users (and viewers) adding to their own profile — LinkedIn, role, affiliations, interests. UX-shaped, not auth-shaped, but the schema needs to leave room.
8. **Cross-app session reuse.** Stubbed seam + JOIN-by-`lossless_id` doesn't give us "sign into memopop, you're signed into dididecks." If we want that, we add a central directory service. Not on the near-term path.

## Related context-v files

- `[[Curating-only-valid-Sources-across-Runs.md]]` — sibling exploration; informs nothing about auth directly but is part of the same "where we are right now in ai-labs" picture
- `[[Separating-Retrieval-from-Generation-in-Agent-Pipelines.md]]` — sibling exploration; same
- `[[ChromaDB-as-Context-Improvement-Across-Everything-Everyone.md]]` — the roll-up ingester pattern proposed here borrows directly from the `context-vigilance-kit` ingest pipeline already running for the corpus
- `[[Moving-an-Agent-Orchestrator-to-an-API.md]]` — directly relevant: as memopop's orchestrator moves toward an API, that API is the first place a real auth boundary needs to land

## Decision captured 2026-07-06 — didi.sh flips Fork 1 to a central identity service

We bought **`didi.sh`** and committed to one common login across the three
services. That is precisely the condition Fork 1 named as the trigger for
Option B ("we want true SSO where signing into memopop signs you into
dididecks"): with all three services under one apex domain, a single
`.didi.sh` session cookie *is* the SSO mechanism, so the central service is
now cheap where it used to be heavy. Everything below Fork 1 — the credential
pathways, the domain-as-id org model, the roles, `lossless_id`, the scale
posture — carries into the service intact. The three-session
calmstorm-extraction plan below is superseded in *destination* (extract into
the identity service, not into a vendored package; only Session 1 ever ran),
while [[../../dididecks-ai/context-v/specs/Calmstorm-Auth-Inventory.md]]
remains the reference implementation. Full framing and the didi-agent
companion plane: [[Didi-sh-One-Login-One-Agent-Three-Services]].

## Decisions captured in-flight 2026-05-17

The exploration originally recommended "open a spec next." After in-browser review and reflection on **calmstorm-decks' already-running auth system** (which implements ~70% of the v1 hard requirements — see [[../../dididecks-ai/client-sites/calmstorm-decks/src/middleware.ts]] and siblings), the path shifted from spec-first to code-first via extraction. Three decisions resolved before the first session:

1. **Order of work: code-first via calmstorm extraction.** Audit calmstorm's existing auth → add the four missing pieces (OAuth, Organizations, lossless_id, app_slug) in calmstorm itself → THEN extract to a shared package. The spec emerges from the working code rather than the working code conforming to a premature spec.
2. **`lossless_id` shape: opaque UUIDv7.** Random ID, no information leak. Email is the join key separately. Re-stitchable on email change. Natural time-ordering from UUIDv7's timestamp prefix.
3. **Package location: standalone repo destined for JSR.** Eventually `lossless-auth-core` published to JSR. Forces good API discipline (no peeking into private internals across consumer apps). Higher overhead than `ai-labs/packages/auth-core/` colocation, but commits to the package as a first-class shared artifact from the start.

### The three sessions

#### Session 1 — Audit + record-keeping
- Walk `calmstorm-decks/src/{lib/auth, middleware.ts, pages/access, pages/api/access}` end to end. Catalog file inventory + line counts + dependencies + env vars + DB tables.
- Identify what's calmstorm-specific (env passcodes, hardcoded firm_slug, `cs_` cookie prefix) vs. what's package-ready (MintedToken redemption flow, session cookie + middleware skeleton, AuthEvent log shape, DB-unavailable graceful degradation).
- Map each existing file to its future location in the extracted package.
- **Deliverable**: [[../../dididecks-ai/context-v/specs/Calmstorm-Auth-Inventory.md]] — itemized inventory + future-package map. The detail lives at the dididecks-ai tier where the code physically lives. This exploration links to it.

#### Session 2 — Four additions in calmstorm-decks
1. **OAuth via `arctic`** — GitHub provider first. `Identity` gains an `OAuthAccount` 1-to-many child. New `/access/oauth/github/{start,callback}` routes. `cs_session` issuance unified across all credential pathways.
2. **`Organization` + `Membership` tables** — minimal v1 columns. Migrate the hardcoded `firm_slug: calm-storm-ventures` to a real Organization row. `firm_profile` 1-to-1 nullable extension holds firm-specific fields (portfolio path, AUM tier, brand assets).
3. **`lossless_id` (UUIDv7)** on `Identity` — mint on first sign-in, lookup by `primary_email` thereafter.
4. **`app_slug` column** on `AuthEvent` — set to `"calmstorm-decks"`. Trivial.

Each addition independently testable. Calmstorm becomes the validated reference implementation.

#### Session 3 — Stand up the repo + extract
- Create `github.com/lossless-group/lossless-auth-core`. License + README + tsconfig + JSR `jsr.json` config.
- Move the validated code from calmstorm into the package. Calmstorm switches to consuming from the local clone via pnpm workspace, eventually from JSR-published.
- Wire **chroma-decks** (sub-submodule of dididecks-ai, currently zero auth) as the second consumer. The friction of consuming from a different site surfaces every leaky abstraction.
- memopop-ai (Tauri + Python sidecar) is harder — handle as Session 4 or later once the package is twice-proven on web.

### What gets specced later (not now)

A spec doc `context-v/specs/Shared-Auth-Core-Package.md` becomes worth writing *after* Session 3, when the package's API surface is empirically validated by two-consumer use. The spec then documents the locked contract for memopop-ai's Tauri integration and any future consumer to build against. Writing it before would risk pinning shapes calmstorm's actual code would have informed.

## Original recommended next move (now superseded by the three-session plan above)

> Open a spec — `context-v/specs/Shared-Auth-Core-Package.md` — that pins:

- Exact schema (DDL for the seven core tables, written against libSQL's SQLite-compatible dialect)
- libSQL client choice per app (Tauri/Rust: embedded `libsql` crate; web apps: `@libsql/client` for SvelteKit/Astro server endpoints; Python sidecar: `libsql-experimental` or the Turso HTTP client)
- Per-app deployment shape (embedded file, Turso-hosted, or embedded replica with sync)
- The TS package surface (function signatures, no implementations)
- The Python validator surface (FastAPI dependency, token format)
- The session token signing scheme (HMAC details, rotation policy)
- The OAuth provider configuration shape (per-org overrides for Google Workspace domain)
- A migration path for memopop's existing `firms` concept → `organizations + firm_profile`

Pair it with prompts:

- `context-v/prompts/Implement-Auth-Core-Package.md`
- `context-v/prompts/Wire-Auth-into-Memopop-Native.md` (first app to adopt; flushes out the Tauri-side keychain integration)
- `context-v/prompts/Wire-Auth-into-Dididecks-AI.md` (web-first reference implementation)

If anything in the spec phase surfaces a question this exploration didn't anticipate, that's the cue to either amend this doc or fork a new exploration — not to push it into the spec where it'll get lost.

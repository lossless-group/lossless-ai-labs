---
title: "Install Auth Surface in chroma-decks (from calmstorm pattern, with Session-2 additions baked in)"
lede: "Chroma-decks is greenfield for auth. This plan installs the full calmstorm-validated auth surface (middleware, sessions, magic-link redemption, /access UI, AuthEvent log) AND the four Session-2 additions from the Shared-Auth exploration (OAuth via arctic, Organization+Membership, lossless_id UUIDv7, app_slug) — all in one go, since there's no legacy schema to migrate. Sequencing was intentionally NOT made into 'chroma-decks is the reference'; calmstorm still gets a parallel decision later. For now: ship auth on chroma; calmstorm's app_slug diff sits unstaged."
date_authored_initial_draft: 2026-05-17
date_authored_current_draft: 2026-05-17
date_last_updated: 2026-05-17
at_semantic_version: 0.0.1.0
status: Active
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Plan
tags:
  - Shared-Auth
  - Chroma-Decks
  - Greenfield-Install
  - Calmstorm-Pattern
  - Session-2-Additions
authors:
  - Michael Staton
parent_exploration: "[[../../../../../context-v/explorations/Shared-Auth-for-Applied-AI-Labs]]"
parent_inventory: "[[../../../../context-v/specs/Calmstorm-Auth-Inventory]]"
from: "dididecks-ai/chroma-decks"
from_path: "context-v/plans/Install-Auth-Surface-from-Calmstorm-Pattern.md"
---
# Install Auth Surface in chroma-decks (from calmstorm pattern, with Session-2 additions baked in)

## Why this is its own plan (not "Session 2" of the parent)

The Shared-Auth exploration's three-session plan has calmstorm-decks as the validated reference (Session 2) and chroma-decks as the second consumer post-extraction (Session 3). On 2026-05-17 the user redirected: do the work in **chroma-decks** instead, and explicitly chose option *"Just chroma-decks for now — we'll decide about calmstorm later."*

That means:

- **The four Session-2 additions get installed in chroma-decks**, not calmstorm.
- They are NOT additions to existing code (chroma has no auth) — they're *baked into the initial schema* alongside the existing calmstorm surface. No migrations from a TEXT `org` column; no `cs_session` cookies to preserve.
- Calmstorm's existing auth stays as-is. The `app_slug` diff already produced in calmstorm sits unstaged on `development` until the user decides what to do with it.
- The "validated reference for package extraction" question is **explicitly deferred**. This plan does not declare chroma the reference.

## Pre-conditions (already verified)

- chroma-decks current state: `output: "static"`, Vercel adapter, **no** `@astrojs/db`, **no** `@libsql/client`, **no** `.env` (only `.env.example`).
- chroma-decks uses `@dididecks/shell` integration — no conflict with auth (shell adds `/toc/`, `/play/`, `/data-assets/`; auth adds `/access/*`, `/api/access/*`).
- Brand: see `chroma-decks/DESIGN.md` (and `draft-palette__Chroma.json`). The chroma-themed `/access` UI departs from calmstorm's cobalt-blue gradient.
- Calmstorm reference files live at `../calmstorm-decks/src/{lib/auth,middleware.ts,pages/access,pages/api/access}` and `../calmstorm-decks/db/config.ts`. Port — don't symlink.

## Architectural decisions locked into this plan

1. **`output: "server"` with NO `prerender` on gated routes.** Under `output: "server"` on Vercel, prerendered pages are CDN-served as static HTML and the middleware function NEVER runs in production — exactly the trap calmstorm fell into and fixed today (commit 677417f). For a gated deck this means anyone with a URL bypasses the gate. Chroma follows the post-fix calmstorm pattern: every gated route SSRs (no `prerender = true` directive); only future genuinely-public surfaces would prerender. The ~50ms per-request SSR cost is acceptable for fundraise-deck traffic.
2. **`@astrojs/db` over libSQL, embedded for dev + Turso remote for prod.** Mirrors calmstorm exactly.
3. **All `@dididecks/shell` routes (`/toc/*`, `/play/*`, `/data-assets/*`) are gated** by the middleware. Public prefixes are: `/access`, `/api/access`, `/_image`, `/_astro`, plus `/changelog` if a public changelog exists. No other public surfaces.
4. **Cookie name: `cd_session`** (vs calmstorm's `cs_session`). Per-app cookie keeps sessions isolated when both sites are open in the same browser.
5. **`APP_SLUG = "chroma-decks"`** on every AuthEvent insert. Constant exported from `src/lib/auth/types.ts`, will become consumer config on package extraction.
6. **No `firm_profile` on the Chroma organization row** (Chroma is the company, not a VC firm — it's a portco-style operating company; the `firm_profile` extension is nullable per the parent exploration's "firm == org dual-vocabulary" decision). If a future role needs a `company_profile` extension instead, that's a separate concern.
7. **GitHub OAuth only in Phase 6.** Google Workspace deferred — chroma's audience is broader than a single Google Workspace domain, and the GitHub identity-pool covers the technical-investor audience we're shipping to first.
8. **No legacy backfill required.** No existing rows; no Identity-with-TEXT-org-column to migrate. The schema lands clean.

## Phases (each its own commit)

### Phase 1 — Infrastructure: SSR + `@astrojs/db` + env

- `astro.config.mjs` — add `output: "server"`, add the `@astrojs/db` integration import + entry, keep Vercel adapter, keep `@dididecks/shell`.
- `package.json` — add `@astrojs/db`, `@libsql/client`. (Don't add `arctic` yet — Phase 6.)
- Deck-page-level: identify the prerendered routes (most pages under `/src/pages/`) and add `export const prerender = true` where they don't already have a server-side responsibility. Auth routes get `export const prerender = false` explicitly.
- `.env.example` — add `SESSION_SECRET`, `ADMIN_PASSCODE`, `VIEWER_PASSCODE`, `ASTRO_DATABASE_FILE` (dev), `ASTRO_DB_REMOTE_URL` + `ASTRO_DB_APP_TOKEN` (prod-Turso). Do NOT add OAuth client IDs yet.
- Verify: `pnpm install`, `pnpm exec astro sync`, `pnpm exec astro check` clean.

**Commit message draft:** `feat(chroma-decks, infra, auth-prep): switch to SSR output and wire @astrojs/db prereqs for auth surface`

### Phase 2 — Schema with Session-2 additions baked in

`db/config.ts` defines, in this order (calmstorm tables first, then additions):

- `Identity` — calmstorm columns PLUS `lossless_id` (text, unique, indexed), `primary_email` (text, indexed). The legacy `email` column from calmstorm is renamed `primary_email` in this fresh install (no backward-compat needed).
- `MintedToken` — straight from calmstorm.
- `Session` — straight from calmstorm.
- `AuthEvent` — calmstorm columns PLUS `app_slug` (text, default `"chroma-decks"`).
- `OAuthAccount` — NEW: `id`, `identity_id` (FK→Identity), `provider` (`github` for now), `provider_subject`, `provider_email`, `linked_at`, `last_used_at`.
- `Organization` — NEW: `id`, `slug`, `name`, `created_at`.
- `FirmProfile` — NEW: `id` (= Organization.id), `firm_kind`, `portfolio_path`, `aum_tier`, `brand_assets_path`. All optional; absence means "not a firm." Per decision 6, the Chroma Org won't have one.
- `Membership` — NEW: `id`, `identity_id` (FK→Identity), `organization_id` (FK→Organization), `role` (`superuser` | `org_owner` | `org_admin` | `editor` | `viewer`), `joined_at`, `revoked_at`.
- `PageView`, `Action` — port from calmstorm (engagement-tracking sibling concern, not auth, but consumers of the same DB).

`db/seed.ts` — one Organization row for Chroma (`slug: "chroma"`, `name: "Chroma"`), no FirmProfile. Memberships seeded only as actual users sign in.

**Commit message draft:** `feat(chroma-decks, db, auth-schema): define auth surface with lossless_id, Organization/Membership, OAuthAccount, app_slug`

### Phase 3 — Port auth helpers (`src/lib/auth/`)

- `types.ts` — port; change `SESSION_COOKIE = "cd_session"`, add `APP_SLUG = "chroma-decks"`. `Role` enum extended to the 5-role set (`superuser | org_owner | org_admin | editor | viewer`) per the parent exploration.
- `session.ts` — port unchanged except for cookie-name references (already via the `SESSION_COOKIE` constant; should require no changes).
- `token.ts` — port unchanged.
- `passcode.ts` — port unchanged (matching logic only; env-var reading is via `import.meta.env`).
- `lossless_id.ts` — NEW. Two exports: `mintLosslessId()` returns a fresh UUIDv7; `resolveOrCreateIdentity(primary_email)` returns the existing Identity row or creates one with a fresh `lossless_id`. Both called from the credential-success paths (verify route's success branch; link redemption's success branch; later, OAuth callback).

**Commit message draft:** `feat(chroma-decks, lib/auth): port session/token/passcode helpers from calmstorm; add lossless_id minting`

### Phase 4 — Middleware

Port `src/middleware.ts` from calmstorm, with:

- `PUBLIC_PREFIXES` updated for chroma's surfaces.
- The 2026-05-17 prerender-bypass fix preserved (reference: `dididecks-ai/changelog/2026-05-17_02.md`).
- DB-unavailable graceful degradation preserved.
- Rolling-refresh on every authenticated request preserved.

**Commit message draft:** `feat(chroma-decks, middleware): port session gate with prerender-aware bypass-fix`

### Phase 5 — `/access` UI + `/api/access` routes

- `src/pages/access/index.astro` — chroma-themed gate UI. Same form, different brand. Cobalt → chroma palette.
- `src/pages/access/link/[token].astro` — port; the bot-detection list and OG-preview HTML port unchanged. Brand-themed `MetaTags` for the OG-preview branch.
- `src/pages/api/access/verify.ts` — port; `APP_SLUG` stamped on every AuthEvent insert. Hook into `resolveOrCreateIdentity` from Phase 3.
- `src/pages/api/access/logout.ts` — port; `APP_SLUG` stamped.
- `src/pages/api/access/debug-cookie.ts` — port (dev-only diagnostic).

**Commit message draft:** `feat(chroma-decks, access): port /access UI + /api/access routes; chroma-themed`

### Phase 6 — OAuth via arctic (GitHub)

- Add `arctic` dep.
- `.env.example` — add `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `OAUTH_GITHUB_REDIRECT_URI`.
- `src/pages/access/oauth/github/start.ts` — initiate the auth-code flow via arctic; persist state to a short-lived HTTP-only cookie.
- `src/pages/access/oauth/github/callback.ts` — validate state, exchange code for token, fetch user identity, upsert `OAuthAccount`, upsert `Identity` (by `provider_email`), mint `lossless_id` if new, create `Session` with `tier: "oauth_github"`, set `cd_session` cookie, 302 to original `redirect`.
- `/access/index.astro` — add a "Continue with GitHub" button alongside the passcode form.

Defer Google Workspace OAuth and "lossless-group org → superuser fast-path" to a follow-up.

**Commit message draft:** `feat(chroma-decks, oauth): add GitHub OAuth via arctic; unified with cd_session issuance`

## Out of scope for this plan (named so they don't drift in)

- Google Workspace OAuth (deferred — chroma's audience is broader than one Workspace domain).
- "lossless-group GitHub org → superuser fast-path" (deferred; lives in the parent exploration's open-ideas list).
- Magic-link sending domain per-firm.
- Account-merge UI.
- TrackerScript / PageView / Action engagement-tracking surface (calmstorm has it; chroma can copy it later as a sibling concern — NOT auth).
- The `/admin/activity.astro` panel (port later if needed; not required for shipping the gate).
- Extracting any of this into a shared package. This plan is consumer-local code only.

## Risks + open questions

- **Brand styling of `/access`.** The chroma palette isn't fully specified yet — Phase 5 may need a quick `DESIGN.md` read or a small palette decision. Defer authoring until we get there.
- **Cookie collision with calmstorm.** If a developer has both calmstorm and chroma open in localhost on different ports, the `cs_session` and `cd_session` cookies are scoped per-host so there's no collision — but cookie path/domain config has to confirm this. Test in dev before merging.
- **Vercel SSR cold-start.** Switching `output: "static"` → `"server"` introduces function cold-starts on cache-miss. For fundraise-deck traffic patterns (low concurrency, returning visitors with sessions) this is fine; flag if it shows up in lighthouse.
- **The `lossless_id` minted in chroma is incompatible with any future merge with calmstorm's pre-existing identities.** If a person uses both decks, we mint two `lossless_id`s by email match later. Acceptable per the parent exploration's "lazy re-stitch on email change" stance.
- **OAuth callback URL discipline.** GitHub OAuth needs a registered callback per environment (`localhost`, preview, prod). Configure when Phase 6 starts.

## Status / next step

**Status:** Active. Phase 1 begins immediately after this plan lands.

**Next step:** Execute Phase 1.

## Cross-references

- `[[../../../../../context-v/explorations/Shared-Auth-for-Applied-AI-Labs]]` — parent exploration
- `[[../../../../context-v/specs/Calmstorm-Auth-Inventory]]` — Session 1 deliverable; file inventory + future-package map
- `../../../calmstorm-decks/src/middleware.ts` and siblings — reference implementation we port from
- `dididecks-ai/changelog/2026-05-17_02.md` — the prerender-bypass-middleware fix on the calmstorm side that this plan inherits
- [Arctic OAuth library](https://github.com/pilcrowOnPaper/arctic) — used in Phase 6

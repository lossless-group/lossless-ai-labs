---
title: "Auth — loose ends after the 2026-05-17 install"
date_created: 2026-05-17
date_modified: 2026-05-17
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7 (1M context)
semantic_version: 0.0.0.1
tags:
  - Reminder
  - Auth
  - Shared-Auth
  - Chroma-Decks
  - Calmstorm-Decks
  - Open-Items
status: Active
from: "dididecks-ai"
from_path: "context-v/reminders/Auth-Loose-Ends.md"
---
# Auth — loose ends after the 2026-05-17 install

The 2026-05-17 session installed the auth surface end-to-end in chroma-decks and closed the WhatsApp-invite loop. This list captures what's still open so it doesn't drift out of memory. Cross out (use `~~strikethrough~~`) as items land; delete the file when nothing is left.

## High-priority — needed before prod deploys to investors

### Vercel env vars for chroma-decks

Required for the prod build to function (these are the local `.env` values copied into Vercel → Project Settings → Environment Variables):

- [ ] `SESSION_SECRET` — must match local; rotation invalidates all existing sessions + outstanding magic links
- [ ] `ASTRO_DB_REMOTE_URL` — `libsql://ddd-chroma-mpstaton.aws-us-east-1.turso.io`
- [ ] `ASTRO_DB_APP_TOKEN` — from `turso db tokens create ddd-chroma-mpstaton`
- [ ] `ADMIN_PASSCODE` — `chromaadmin` (or whatever) — single passcode for ad-hoc grants
- [ ] `VIEWER_PASSCODE` — `chromaviewer` — read-only ad-hoc grants
- [ ] `SITE_URL` — `https://chroma-decks.vercel.app` (or the real prod domain when set) — so `scripts/invite.ts` prints prod URLs instead of the localhost default

### Turso prod-side seed

Before the first prod sign-in, populate the two seed orgs so the FK constraints on Membership have a target. Skip this if you don't mind the defensive-insert path in `/api/access/verify` and `/access/link/[token]` lazily inserting them — it works, just adds two writes on first sign-in.

```bash
turso db shell ddd-chroma-mpstaton "INSERT INTO Organization (id, slug, name, created_at) VALUES ('lossless.group', 'lossless-group', 'Lossless Group', CURRENT_TIMESTAMP), ('trychroma.com', 'chroma', 'Chroma', CURRENT_TIMESTAMP);"
```

## Medium-priority — useful soon

### GitHub OAuth env vars (optional but cheap)

Without these, the "Continue with GitHub" button on `/access` stays hidden. With them, any Lossless teammate (or any GitHub user) can sign in without typing a passcode. Register an OAuth App at github.com/settings/developers; callback URL must match the env value exactly per environment.

- [ ] `GITHUB_OAUTH_CLIENT_ID`
- [ ] `GITHUB_OAUTH_CLIENT_SECRET`
- [ ] `OAUTH_GITHUB_REDIRECT_URI` — `https://chroma-decks.vercel.app/access/oauth/github/callback`

### Token revocation CLI

Today there's no way to revoke a single MintedToken short of editing the row by hand in Turso. If a senior invitee leaves a firm, or a WhatsApp message gets forwarded and you want to kill the link, you'd want:

```bash
pnpm exec tsx scripts/revoke.ts --identity-email=mp@firm.com
# or
pnpm exec tsx scripts/revoke.ts --token-id=xyz
```

Sets `MintedToken.revoked_at`. The redemption route already checks this column and bounces to `/access?error=token_revoked`.

Estimated effort: ~30 min, same shape as `scripts/invite.ts`.

### `@lossless.group` superuser fast-path

Named in the parent Shared-Auth exploration's open-ideas. When an OAuth callback yields `primary_email.endsWith("@lossless.group")`, also attach `Membership` to the `lossless.group` org with role `superuser`. Saves manual admin work the first time anyone other than Mike on the Lossless team signs in.

File: `src/pages/access/oauth/github/callback.ts` — ~5 LOC inside the existing identity-resolved branch.

## Lower-priority — when there's time

### `lossless-auth-core` package extraction

Per the parent exploration's three-session plan, the eventual extraction. With chroma + calmstorm as two empirical consumers, the API surface is closer to validated. Trigger: a third consumer arrives (memopop's API surface, augment-it) and the cookie-name / role-enum drift between calmstorm and chroma starts being painful at the install-template tier.

### `lossless-auth-py` companion

Python validator that reads the same Session table the TS package writes. Comes online when memopop's orchestrator graduates from Tauri-only to a web-served API surface.

### Parallel calmstorm install of the Session-2 additions

Calmstorm has `app_slug` parity now (commit `df06779`). The other three Session-2 additions (Organization/Membership tables, lossless_id on Identity, OAuth via arctic) are not yet ported. Not urgent — calmstorm's existing schema works for calmstorm. Becomes important if the rollup ingester needs lossless_id from calmstorm to join against chroma's identities, or if a Lossless teammate wants OAuth into calmstorm without re-typing the passcode.

### Account-merge UI

Named in the parent exploration. When the same human signs in via different emails (personal email → magic-link → one lossless_id; firm email → OAuth → another lossless_id), they end up with two Identity rows. The lazy re-stitch on email change is hand-wave; a proper merge UI would let an admin combine them. Not v1.

## Out of scope (named so they don't drift back in)

- Self-serve sign-up. Every user is invited or known. There is intentionally no public "sign up" button.
- Password auth. Passwords explicitly avoided; OAuth + magic-link + passcode-token only.
- Per-resource ACLs ("user X can edit memo Y but not Z"). Roles are org-wide.
- SOC 2 / ISO compliance. Revisit only if a client engagement demands it.

## Cross-references

- Parent exploration: `[[../../../../context-v/explorations/Shared-Auth-for-Applied-AI-Labs]]`
- Session 1 deliverable: `[[../specs/Calmstorm-Auth-Inventory]]`
- Chroma install plan: `[[../../client-sites/chroma-decks/context-v/plans/Install-Auth-Surface-from-Calmstorm-Pattern]]`
- Tier-level changelog: `[[../../changelog/2026-05-17_06]]`
- Project-tier changelog: `[[../../client-sites/chroma-decks/changelog/2026-05-17_01]]`
- Top-tier changelog: `[[../../../changelog/2026-05-17_02]]`

---
date_created: 2026-07-06
date_modified: 2026-07-06
title: "Walking skeleton — magic link to signed cookie, proven live"
lede: "Increment 1 ships the same day as the scaffold: a Phoenix app with the full identity schema, an Ed25519 keypair behind a JWKS endpoint, and the whole magic-link → didi_session cookie → /api/me → refresh → logout loop — 19 tests green and every step proven against the live server by a curl script."
publish: true
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
files_changed:
  - mix.exs
  - config/{config,dev,test,runtime}.exs
  - priv/repo/migrations/20260706000001_identity_schema.exs
  - lib/id_didi_sh/{uuid7,keys,token,accounts}.ex
  - lib/id_didi_sh/accounts/{user,membership,login_token,session,magic_link_notifier}.ex
  - lib/id_didi_sh_web/session_cookie.ex
  - lib/id_didi_sh_web/controllers/{magic_link,session,me,jwks}_controller.ex
  - lib/id_didi_sh_web/router.ex
  - lib/mix/tasks/{id.gen.keypair,id.seed}.ex
  - scripts/prove-skeleton.sh
  - test/id_didi_sh/accounts_test.exs
  - test/id_didi_sh_web/controllers/auth_flow_test.exs
tags:
  - Progress-Update
  - Walking-Skeleton
  - Identity-Service
  - Elixir
  - Phoenix
  - EdDSA
  - Magic-Link
from: "id-didi-sh"
from_path: "changelog/2026-07-06_02_Walking-Skeleton-Magic-Link-To-Signed-Cookie-Proven-Live.md"
---
## Why Care?

The identity service stopped being a spec today. The core loop every didi.sh
service will depend on — prove who you are once, carry a locally-verifiable
signed cookie everywhere — runs end to end on localhost, with the exact
token discipline the spec pinned: EdDSA-signed (consumers can verify,
never mint), short-lived tokens over a rolling server-side session,
single-use hashed magic-link tokens, invite-only posture (unknown emails
get a silent 202 — no account enumeration).

## What's Here

- **The full identity schema** in one migration — users (didi_id UUIDv7,
  hand-rolled generator), organizations (domain-as-id), firm_profiles,
  memberships, oauth_accounts, login_tokens (unified magic-link/invite
  table), sessions, auth_events, apps. The skeleton wires four of them;
  the rest are data-shape ready for increments 3–4.
- **Keys + tokens** — Ed25519 via JOSE; dev keypair auto-generated
  (gitignored), prod key injected as `ID_SIGNING_JWK`; public half served
  at `/.well-known/jwks.json` with the RFC 7638 thumbprint as kid.
- **The API** — POST /api/magic-links (202 always), /api/magic-links/redeem
  (single-use, atomic claim), /api/session/refresh (accepts an
  expired-but-authentic token; the session row is the refresh authority),
  DELETE /api/session, GET /api/me.
- **Proof** — `scripts/prove-skeleton.sh` walks issue → redeem → reuse-
  rejected → me → JWKS → refresh → logout → post-logout-rejected against
  the live server. Plus 19 ExUnit tests including expiry, tamper, and
  case-insensitive email matching.

## Gotcha Worth Logging

Appending config to the END of `config.exs` puts it after
`import_config "#{config_env()}.exs"` — silently overriding every per-env
file. Five tests failed with a misleading "no signing key" error before the
block moved above the import. Config order is load-bearing in Phoenix apps.

## What's Next

Increment 2: augment-it's TS verify adapter (cookie parse on the workspace
WS upgrade + JWKS verify), replacing the flat token map — then invites and
the LiveView admin (increment 3), which makes reach-edu + humain-vc
onboarding real.

---
date_created: 2026-07-06
date_modified: 2026-07-06
title: "Production magic links land in a real inbox"
lede: "Steps 1 and 2 of the humain-vc unlock close on production: a hand-rolled Resend adapter over Req delivers real sign-in emails from the deployed service, orgs and memberships exist with mix tasks to seed them, and production carries Michael's full identity — plus two infrastructure bugs found and fixed along the way."
publish: true
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
files_changed:
  - lib/id_didi_sh/mailer/resend_adapter.ex
  - lib/id_didi_sh/accounts/organization.ex
  - lib/id_didi_sh/accounts.ex
  - lib/mix/tasks/{id.org,id.member,id.email.test}.ex
  - config/runtime.exs
  - fly.toml
tags:
  - Progress-Update
  - Email
  - Resend
  - Organizations
  - Memberships
  - Fly-Io
  - Identity-Service
from: "id-didi-sh"
from_path: "changelog/2026-07-06_06_Production-Magic-Links-Land-In-A-Real-Inbox.md"
---
## Why Care?

A magic-link identity service without email is a demo; with email it's a
product. As of tonight the deployed service sends real sign-in links that
land in a real inbox (screenshot-verified: two production sends in gmail),
and the org/membership legs of the users–orgs–workspaces triangulation
exist with a seeding path. The humain-vc unlock flow's two foundation
steps are done on both local and production.

## What's New?

- **Resend adapter, hand-rolled over Req** (~40 lines) — the official hex
  package pins hackney and fights the lockfile; Resend's send API is one
  JSON POST. Activated by `RESEND_API_KEY` presence; `EMAIL_FROM`
  overrides the sender (pinned to `onboarding@resend.dev` until the
  didi.sh domain is verified in Resend — verification also lifts the
  only-send-to-account-owner restriction).
- **Organizations + memberships** — `upsert_org` (domain-as-id) and
  `upsert_membership` (role-validated, upsert-by-natural-key), with
  `mix id.org` / `mix id.member`. Production seeded via release eval:
  both orgs, Michael's three addresses, superuser membership.
- **`mix id.email.test`** — real send through whatever adapter runtime
  resolved; proven from local and from production.

## Two infrastructure bugs, found the hard way

1. **256 MB OOM on admin sessions.** `bin/app eval`/`rpc` spawn a second
   BEAM beside the running server; two don't fit in 256 MB, so every
   seeding attempt OOM-killed the machine mid-session — presenting as
   hung ssh and mysteriously stopped machines. Now 512 MB (machine +
   fly.toml).
2. **Machine-level autostop survived fly.toml.** The web-launcher-created
   machine carried `autostop` in its own config; the proxy stopped it
   after every 5 idle minutes (`requested_stop=true` in events) despite
   `auto_stop_machines='off'` in fly.toml. Fixed with
   `fly machine update --autostop=off`.

Plus one for the tree's gotcha ledger: `fly ssh console -C` strips double
quotes — remote Elixir one-liners need `~s(...)` sigils.

## What's Next

Domain verification in Resend (didi.sh sender + unrestricted recipients),
the two `id.didi.sh` DNS records in Vercel (the emailed links point there
already), then build-order step 3: the membership gate in augment-it.

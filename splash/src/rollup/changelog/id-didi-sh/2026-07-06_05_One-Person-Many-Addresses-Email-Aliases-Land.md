---
date_created: 2026-07-06
date_modified: 2026-07-06
title: "One person, many addresses — email aliases land"
lede: "A didi.sh ID now carries alt emails: a magic link to any alias authenticates the same didi_id. Normalized from the start (a user_emails table, globally unique across primaries and aliases) instead of merge-chained after the fact — the fullstack-vc lesson, applied preemptively."
publish: true
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
files_changed:
  - priv/repo/migrations/20260706220001_user_email_aliases.exs
  - lib/id_didi_sh/accounts/user_email.ex
  - lib/id_didi_sh/accounts.ex
  - lib/mix/tasks/id.alias.ex
  - lib/id_didi_sh_web/controllers/me_controller.ex
  - test/id_didi_sh/accounts_test.exs
tags:
  - Progress-Update
  - Identity-Service
  - Email-Aliases
  - Schema
from: "id-didi-sh"
from_path: "changelog/2026-07-06_05_One-Person-Many-Addresses-Email-Aliases-Land.md"
---
## Why Care?

Real people have work addresses per engagement — michael@humain.vc and
michael@reach.edu are the same Michael as mpstaton@gmail.com, and treating
them as three accounts would fracture the one-login promise on day one.
fullstack-vc learned this the hard way (email-as-primary-key plus a
merge-fallback chain); here the aliases table exists before the second user
does.

## What's New?

- **`user_emails` table** — `(didi_id, email)`, unique on lowered email
  across ALL aliases; cross-table collision with primaries enforced in the
  context. `get_user_by_email/1` resolves primary-or-alias, so magic links
  to any address authenticate the same `didi_id` (proven live: a link to
  michael@reach.edu redeems as mpstaton@gmail.com's identity).
- **`mix id.alias <existing-email-or-didi_id> <alt-email>`** — the dev-mode
  attach path until increment 3's admin console carries it.
- **`/api/me` gains `alt_emails`** so consumers can show the full identity.
- 21 tests green (alias resolution, taken/invalid rejection, the
  authenticate-via-alias loop).

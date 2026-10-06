---
title: "Invite redemption failure is logged, not surfaced"
lede: "If attaching the invited membership fails, the person still gets an account and a session — and lands with no access, having been told they were invited to something."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
semantic_version: 0.0.0.1
status: Open
tags:
  - Issue-Resolution
  - Invites
  - Entities
  - Id-Didi-Sh
site_uuid: 6ad042f3-0767-44a4-979c-594999eb3eac
hex_code: vhbs0y
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
publish: false
from: "id-didi-sh"
from_path: "context-v/issues/Invite-Redemption-Failure-Is-Logged-Not-Surfaced.md"
---
# Invite redemption failure is logged, not surfaced

## What

`AccessController.attach_invited_membership/2` records
`invite_membership_failed` in `auth_events` and lets redemption continue. The
person gets an account and a session, but not the membership the invite was for.

## Why it matters

They clicked a link that said *"Alice invited you to join Apollo"* and arrived
somewhere with no Apollo. The failure is discoverable in `auth_events` — but only
by someone who thinks to look.

Failure modes that reach here: the entity was deleted between invite and
redemption, or the role string is no longer valid.

## Options

1. **Leave it.** The event exists; at three users someone will notice.
2. **Tell the person** — render a "something went wrong, ask whoever invited you"
   state rather than the generic done page.
3. **Tell the inviter** — email `issued_by` on failure.
4. **Refuse the redemption** so the token stays unclaimed and can be retried.
   Cleanest semantically, worst experience: they cannot sign in at all.

## Recommendation

Option 2 when the LiveView lands (increment 7). Not worth a bespoke page before
there is a UI to put it in.

## Related

- `lib/id_didi_sh_web/controllers/access_controller.ex`

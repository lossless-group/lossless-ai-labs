---
date_created: 2026-08-20
date_modified: 2026-08-20
title: "Entities land flat, and invites reach strangers"
lede: "Tenancy stops being a hierarchy nobody's collaborations fit: organization, workspace and project become three labels on one flat table, with no parent_id and no inheritance. Membership removal never cascades, and the API says out loud what a removal did not do. Adding an email that has no didi account now sends an invite from no-reply@didi.sh and attaches the membership when it's redeemed."
publish: true
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
files_changed:
  - priv/repo/migrations/20260820000001_create_entities.exs
  - priv/repo/migrations/20260820000002_invite_carries_entity.exs
  - lib/id_didi_sh/entities.ex
  - lib/id_didi_sh/entities/entity.ex
  - lib/id_didi_sh/entities/entity_membership.ex
  - lib/id_didi_sh/accounts.ex
  - lib/id_didi_sh/accounts/invite_notifier.ex
  - lib/id_didi_sh_web/controllers/entity_controller.ex
  - lib/id_didi_sh_web/controllers/access_controller.ex
  - lib/id_didi_sh_web/plugs/require_user.ex
  - lib/mix/tasks/id.entity.ex
tags:
  - Progress-Update
  - Identity-Service
  - Entities
  - Invites
  - Tenancy
site_uuid: 1450c44b-2a7b-4c37-8017-c30ba45bbc93
hex_code: vxtrvs
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
from: "id-didi-sh"
from_path: "changelog/2026-08-20_01_Entities-Land-Flat-And-Invites-Reach-Strangers.md"
---
## Why Care?

Every identity product assumes a tidy hierarchy: an organization contains
workspaces, workspaces contain projects, and access flows downhill because the
directory says the hill exists. Okta is built on it.

That shape cannot express how the operator actually works. Projects are
collaborations **among many organizations** — three companies on one effort is
the common case, not the exception. Encode a hierarchy and the common case
becomes the thing you fight the schema to express.

So there is no hierarchy. `organization`, `workspace` and `project` are three
**labels** on one flat `entities` table. No `parent_id`, no containment, no
inheritance of anything. A person belongs to any number of entities
independently, and a project with members from three companies is just a project
with members.

## Removal never cascades, and the API says so

The second half matters more than the first. People move fluidly: you might
remove someone from a workspace but keep them on the organization, or from the
organization but keep them in a workspace, or from a workspace but keep them on a
project. All three are ordinary. None is a data-integrity problem.

So each membership row is independent — no `ON DELETE CASCADE` between them, no
"remove from org" that tidies up the rest. A person who belongs to a project and
nothing else is in a normal state, not a dangling reference waiting to be cleaned
up.

The danger in that flexibility is a confident false belief: you click remove,
and think you have offboarded someone who is still in three other places. So the
disclosure is **part of the contract**, not a UI nicety.
`DELETE /api/entities/:id/members/:didi_id` returns every other entity the person
still belongs to, plus the sentence — *"Bob will keep access to: Apollo, Q3
Diligence."* Any client, including ones nobody has written, tells the truth about
what a removal did and did not do.

Three of the tests assert invariants rather than behaviour, so a later
"simplification" fails loudly instead of quietly: `entities have no parent_id` is
a schema assertion, and removal-does-not-cascade is asserted in both directions
and checked at the database rather than in the response.

## Invites reach people who have never heard of didi.sh

Adding a teammate used to require they already had an account. Now, adding an
email with no didi account issues an invite, mails it from `no-reply@didi.sh`
through Resend, and attaches the membership when they redeem it — account
creation included, no password to choose, nothing to install.

It reuses what was already there rather than building anything parallel:
`login_tokens` already carried `kind ∈ magic_link | invite` with a role, so this
added an `entity_id` and the send and redeem halves. One landing page handles
both token kinds, because the person clicking cannot tell which they hold and the
page should not care.

The response is **202, not 201**. Inviting someone who has never heard of the
platform is not a failure and should not read like one — but it has not happened
yet either, and a 201 would claim a member who cannot sign in.

Two failure modes leave traces rather than silence: a mail delivery failure does
not lose the invite (the token row exists either way, and the response says so,
so an operator can resend), and a membership that fails to attach on redemption
writes an `auth_events` row instead of stranding someone quietly.

## Also

`mix id.entity` creates entities and adds members from the terminal, so an
operator can work before the UI exists. It deliberately has **no remove verb** —
removal has to disclose what survives, which belongs where a human can read it.

A stale comment was corrected: `MagicLinkNotifier` claimed the sender had to stay
`onboarding@resend.dev` until didi.sh was verified in Resend. It has been
verified for weeks — self-host-stack sends client mail from `no-reply@didi.sh`.

Suite went 29 → **55 passing**.

## Not done

Credentials and lending — the reason the flat model exists — are next, and are
sequenced behind the move to Turso so that keys other people lend are never
written to an unreplicated volume. Five open questions are written up as issues
rather than carried in anyone's head, including the one that will bite: once
lending confers access, the removal disclosure has to count lenders too, or it
will under-report exactly when it matters most.

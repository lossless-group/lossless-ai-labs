---
title: "Role vocabulary strains on projects"
lede: "org_owner on a three-person project reads like a bug. The five-role lattice was designed for domain-scoped orgs and entities inherited it unexamined."
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
  - Entities
  - Roles
  - Id-Didi-Sh
site_uuid: 7e1277df-8ccd-4de5-8c12-d788e6bd1456
hex_code: json32
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
publish: false
from: "id-didi-sh"
from_path: "context-v/issues/Role-Vocabulary-Strains-on-Projects.md"
---
# Role vocabulary strains on projects

## What

Entity memberships reuse `Accounts.Membership.roles/0` —
`superuser | org_owner | org_admin | editor | viewer`. That lattice was written
when orgs were the only tenancy notion.

Entities are now flat: organization, workspace and project are labels on one
table. So creating a *project* makes you its `org_owner`, which is what the code
says and not what anyone means.

## Why it matters

It is cosmetic until it isn't. The words appear in API responses, and will appear
in the LiveView and in any client UI. "You are org_owner of Apollo" invites the
reader to believe there is an org involved, which is exactly the hierarchy the
model does not have (Ruling 1).

## Options

1. **Leave it.** Cheapest. The strain is real but nobody is confused yet at three
   users.
2. **Rename to entity-neutral roles** — `owner | admin | editor | viewer`, with
   `superuser` staying global. Touches `Accounts.Membership` too, which org
   memberships share.
3. **Separate vocabularies** per entity kind. Most expressive, most machinery,
   and probably premature.

## Recommendation

Option 2 when something else already forces a migration in this area — not on its
own. Renaming roles to fix a reading problem is a real migration for a
non-functional gain.

## Related

- `context-v/plans/Entities-and-Keys-Implementation-Plan.md` — OQ 2
- `ai-labs/context-v/specs/Flexible-Entity-Relationships-to-Mirror-Messy-IRL-Collaboration.md` — Ruling 1

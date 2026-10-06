---
title: "entities and organizations both exist"
lede: "Two tables now describe overlapping things: organizations carries domain-as-id and firm profiles, entities carries tenancy. Nothing is broken; the duplication will get resolved by accident if nobody decides it."
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
  - Schema
  - Id-Didi-Sh
site_uuid: 7a3d0fe1-22cd-4a0e-8611-87d2310a4487
hex_code: hgzg2l
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
publish: false
from: "id-didi-sh"
from_path: "context-v/issues/Entities-and-Organizations-Both-Exist.md"
---
# entities and organizations both exist

## What

`organizations` (PK = email domain, plus `firm_profiles`, plus org-wide
`memberships`) and `entities` (`kind: "organization" | "workspace" | "project"`,
plus `entity_memberships`) coexist.

`entities.org_id` links them, and is **descriptive only** — never consulted for
access or credential resolution (decision E1).

## Why it matters

A reader has to know which table answers which question. The risk is not
breakage, it is that a future change consults `entities.org_id` for access
because it happens to be there, quietly reintroducing the hierarchy Ruling 1
forbids.

## Options

1. **Leave both** with the descriptive-only rule enforced by convention and the
   comment in the migration.
2. **Collapse** `organizations` into `entities` with `kind: "organization"`, plus
   a side table for domain-as-id, billing and firm profile. One tenancy table,
   one membership table.
3. **Formalise the boundary** — keep both, but add a test asserting no query path
   reads `entities.org_id` for authorization.

## Recommendation

Option 3 now (cheap, prevents the actual failure), option 2 only if something
else forces a migration here.

## Related

- `context-v/plans/Entities-and-Keys-Implementation-Plan.md` — E1, OQ 1

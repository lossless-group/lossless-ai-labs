---
title: "SurrealDB MCP + a verification skill — querying augment-it's canonical layer directly, starting with FreedomFest 2026"
date_created: 2026-07-07
date_modified: 2026-07-07
status: Draft
tags:
  - Plan
  - MCP
  - Agent-Skills
  - SurrealDB
  - Augment-It
  - Canonical-Layer
  - FreedomFest
---

## Why this exists

Tonight's work on `apps/person-db-resolver` created real `persons` +
`organizations` + `affiliations` + `observations` rows in reach-edu's
SurrealDB Cloud instance — a handful of FreedomFest 2026 speakers and
orgs (Ethan Akimoto / Carl Menger Institute, Lyn Ulbricht, Rudolfo
Beltran, Kevin Brady, Lt Gov Stavros Anthony / State of Nevada, a
President-of-Basin-Ventures record, and others), created by hand while
testing the new UI. Every check on this data so far has been an ad-hoc
Node script (`connect → signin → use → query`, written fresh each time,
deleted after) — the same pattern used earlier tonight to clean up a
mis-created `ethan-akimoto` organization row. That's fine for a one-off
cleanup; it's the wrong tool for "verify tonight's batch is linked up
correctly," which is a recurring need every time a new event or client
gets processed through the resolver apps.

The fix is the same shape already proven for the Chroma corpus in this
tree ([[../skills/search-lossless-corpus/SKILL.md]]): an **MCP server**
for the raw query access, plus a **Skill** that carries the schema
knowledge and the verification discipline, so a future session doesn't
have to re-derive "what does an affiliation edge look like" from reading
`resolver.ts` again.

## Component 1 — SurrealMCP, project-scoped

[SurrealDB ships an official MCP server](https://github.com/surrealdb/surrealmcp)
(`surrealmcp`) that talks to both self-hosted SurrealDB and SurrealDB
Cloud — exactly augment-it's setup — over stdio/HTTP with bearer-token
auth. This is the right default over a community alternative
(`lfnovo/surreal-mcp`, `nsxdavid/surrealdb-mcp-server` also exist) since
it's maintained by SurrealDB itself and Cloud auth is a first-class case,
not a workaround.

Per this tree's standing MCP convention
([[feedback_mcp_project_scope]] — always `-s project`, never `-s local`,
since local scope has lost config in this tree before):

```bash
claude mcp add -s project surrealdb -- \
  <surrealmcp invocation, env-fed from augment-it/.env's SURREAL_URL / \
  SURREAL_NS / SURREAL_DB / SURREAL_USER / SURREAL_PASS>
```

Exact invocation TBD at build time — depends on whether `surrealmcp` is
run via `npx`/`bunx`, a installed binary, or Docker; check the repo's
current install instructions rather than assuming a `2026-07-07`
snapshot of them is still accurate.

**Open question — read-only vs. read-write.** The MCP connection would
have the same credentials the app's services already use, i.e. full
read-write. Every other consumer of this data (the resolver services,
the shell) already has write access, so this isn't a NEW exposure in
absolute terms — but an MCP-connected agent session operates with less
guardrail than a purpose-built capability (`person.apply`, `domain.retype`
etc., each of which validates its one specific shape). If SurrealDB
Cloud supports a scoped read-only role/user, creating one specifically
for the MCP connection is worth doing before this is used as a matter of
routine (not just for tonight's one-off verification) — flagged here,
not resolved.

## Component 2 — a verification skill

New skill (name TBD, working title `surrealdb-canonical-layer`),
authored in the canonical location per
[[feedback_skill_authoring_in_lossless_skills]] — the lossless-skills
repo, never inside augment-it directly — then symlinked via
`sync-skills-symlinks.sh` like every other skill in this tree.

**What it should carry** (the knowledge an agent needs but shouldn't
have to re-derive from reading service code each session):

- The schema shape: `persons`, `organizations`, `affiliations` (a real
  `RELATE` edge, `in`/`out`/`kind`/`client_access`/`added_at`),
  `observations` (`subject`/`predicate`/`object`/`source`/`observed_at`/
  `client` — schemaless, predicates grow freely: `has_name`,
  `has_email`, `has_linkedin_url`, `affiliated_with`, `located_in`, and
  the event-tie family `speaker_at`/`sponsor_of`/`exhibitor_at`/
  `attended`), `events` (`slug`/`name`/`client`/`client_access`/`source`).
  Cross-reference: `services/record-surrealdb-resolver/src/person-resolver.ts`
  and `context-v/plans/Person-Aware-Canonical-Resolver-Extension.md` in
  the augment-it repo are the source of truth if this drifts.
- **The verification pattern**, generalized past tonight's specific
  case: given an event slug, confirm every person/org tagged to it has
  (a) its core row, (b) an affiliation edge if an org was resolved for
  it, (c) an event-tie observation pointing at the event. Flag, don't
  silently fix: a person with no org is often correct (skip is a
  first-class outcome per [[Person-Aware-Canonical-Resolver-Extension]]),
  an org with no affiliation edge might mean it was resolved
  independently of any person (also correct, per the same plan) — the
  skill's job is to surface the shape of what's there, not assume every
  gap is a bug.
- Query recipes for the common shapes (find by `client_access`, find a
  person's affiliations, find all observations for a subject, find
  everything tied to one event) — SurrealQL, not a wrapper API, since
  the MCP server just gives raw query access.
- **Client tagging is its own explicit check, not an assumption baked
  into a WHERE clause.** This is a multi-tenant system — `client_access`
  is the only thing scoping reach-edu's data away from humain-vc's (or
  any future client's) in the same tables. The field isn't even uniform
  across tables, which the skill must document precisely rather than
  let an agent assume one shape everywhere:
  - `persons`, `organizations`, `events` — `client_access: string[]`
    (array, supports a row being visible to more than one client).
  - `affiliations` — `client_access: string[]` too (set on the `RELATE`
    edge itself).
  - `observations` — `client: string` (**singular**, not an array — a
    genuine inconsistency in the schema as it stands, not a typo to
    "fix" without checking every write path first).
  - `events` — carries **both** `client: string` and
    `client_access: string[]` (see `ensureEvent` in
    `person-resolver.ts`) — redundant, but real; check both if
    auditing this table specifically.
  The verification pass should confirm every row touched by tonight's
  work — every person, every org, the affiliation edges, every
  observation, the event row itself — actually carries `'reach-edu'` in
  whichever of these fields it uses, not just that the row exists. A
  row created without the tag (e.g. a bug in a future capability that
  forgets to stamp `client_access`) would be invisible to reach-edu's
  own UI filters but still sitting in the shared table — the kind of
  gap a "does the data exist" check alone would miss entirely.

## Tonight's actual verification task (the concrete first use)

Once both pieces exist, the first real run is exactly what was asked
for — confirm the FreedomFest 2026 batch created through manual UI
testing is coherent:

1. `SELECT * FROM persons WHERE source = 'person-db-resolver' AND client_access CONTAINS 'reach-edu';`
   — should list Ethan Akimoto, Lyn Ulbricht, Rudolfo Beltran, Kevin
   Brady, Lt Gov Stavros Anthony, and whoever else got created during
   tonight's testing.
2. For each, `SELECT * FROM affiliations WHERE in = $person_id;` —
   confirm the org side (Carl Menger Institute, Basin Ventures, State of
   Nevada, etc.) and that `kind` holds the right role/title.
3. `SELECT * FROM observations WHERE subject = $person_id;` — confirm
   `has_name` always present, and a `speaker_at` (or whatever predicate
   `parseEventObservation` derived) pointing at `events:freedomfest-2026`.
4. Cross-check the `events` row itself:
   `SELECT * FROM events WHERE slug = 'freedomfest-2026';` — one row,
   not duplicated across the several apply calls made during testing.
5. Report gaps plainly rather than auto-fixing — e.g. if the "President,
   Basin Ventures" org-only test never got a person affiliated (per the
   earlier org-independence fix, that's an expected, not broken, state).
6. **Client tagging, checked explicitly per row, not assumed from step
   1's filter.** Step 1 finds persons BY filtering on
   `client_access CONTAINS 'reach-edu'` — that only proves the filter
   works, not that every row from tonight actually has the tag. Re-check
   without that filter (`SELECT id, client_access FROM persons WHERE
   source = 'person-db-resolver';`) and confirm `'reach-edu'` is present
   on every one, then repeat for the matched/created organizations, the
   `affiliations` edges' `client_access`, every `observations` row's
   `client` field (singular, not the array — see Component 2), and the
   `events:freedomfest-2026` row's both `client` and `client_access`.
   Anything untagged or mistagged (e.g. `client_access` present but
   missing `'reach-edu'` specifically) is a real gap to flag, not
   something to silently patch during a "just verifying" pass.

## Open questions

- Exact skill name and whether it's scoped to augment-it specifically or
  written generally enough to serve any future SurrealDB-backed client
  in the tree (memopop-ai, dididecks-ai don't currently use SurrealDB,
  but the pattern — schemaless canonical layer, observations-as-log —
  could recur).
- Read-only MCP role (see Component 1) — resolve before this becomes a
  routine tool, not just tonight's one-off.
- Whether the skill should also carry write patterns (e.g. "add an
  observation via MCP" as an alternative to the `person-db-resolver` UI)
  or stay strictly read/verify — leaning toward read/verify only, so the
  UI's match/create/skip discipline (and its idempotency guarantees)
  isn't bypassed by a raw `CREATE` run through MCP.

## See also

- `augment-it/context-v/plans/Person-Aware-Canonical-Resolver-Extension.md`
  — the schema and the person/org/affiliation/observation write path this
  skill reads, doesn't reinvent.
- `context-v/skills/search-lossless-corpus/SKILL.md` — the Chroma
  precedent this plan's shape (MCP for access, Skill for discipline) is
  copied from.
- [SurrealMCP GitHub](https://github.com/surrealdb/surrealmcp),
  [SurrealMCP announcement](https://surrealdb.com/blog/introducing-surrealmcp)

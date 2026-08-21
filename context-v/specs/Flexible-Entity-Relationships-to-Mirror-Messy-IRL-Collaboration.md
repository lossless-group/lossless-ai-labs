---
title: "Flexible entity relationships, to mirror messy IRL collaboration"
lede: "Nobody wants to be the keymaster. So entities never own credentials — people lend them, lending is what makes you an admin, and when you walk away you take your keys and the work stays."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
semantic_version: 0.0.0.2
status: Draft
tags:
  - Spec
  - Id-Didi-Sh
  - Identity
  - Workspaces
  - Secrets-Management
  - BYOK
  - Capability-Plane
site_uuid: a19299fd-f565-47f0-adb8-6f093af7a08d
hex_code: kzrl0v
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
publish: false
---

# Flexible entity relationships, to mirror messy IRL collaboration

## Why Care?

> *"I'm in situations all the time where people are collaborating on another
> person's keys because they have the credit card."*
>
> *"I live in a world of individuals and small teams often collaborating across
> boundaries, where there are new services and APIs and MCPs popping up all the
> time and basically no one wants to go be the keymaster."*
> — Michael, 2026-08-20

No mainstream identity model expresses this. Vendors assume the organization buys
the key, the organization owns it, and someone in IT administers it. In the world
this spec is for, one person expenses an API account, four people from three
companies build on it, and when that person moves on the honest questions are
*whose key was that*, *what did it pay for*, and *what breaks now*.

The design stance is **deliberately over-flexible**. This is not a spec that
tries to be airtight; it is a spec that tries not to make an arrangement
unrepresentable. The failure mode being optimised against is not a breach — it is
a real collaboration that the model refuses to describe.

## What already exists — do NOT relitigate

The [[Id-Didi-Sh-Identity-Service]] amendment of **2026-08-09** already settled
tenancy. Carried forward wholesale:

- **The workspace is the tenancy boundary, and the boundary secrets attach to.**
- **Membership is explicit and email-domain-independent** — stated there as an
  **invariant** precisely so a later reader does not "simplify" it back into a
  domain check. Reaffirmed here.
- **A domain is a self-signup convenience, never an identity.**
- **Organizations survive, demoted** — domain-as-id, grouping, billing, firm
  profiles; not the access boundary.
- `workspaces` and `workspace_memberships` exist, the latter carrying
  `granted_by` and `via ∈ invite / auto_join / seed`.

## Ruling 1 — there is no hierarchy in code

**Organization, workspace, and project are three conventional labels for the same
kind of thing.** In spirit they nest. In code they do not, and no containment is
stored.

The reason is empirical, not aesthetic: **projects are collaborations among many
organizations.** A project that belongs to one org is the exception, not the rule.
A workspace is, in the operator's words, *"just a common convention for something
in between an organization and a project."* Encode a hierarchy and the common
case — three companies on one project — becomes the thing you have to fight the
schema to express.

So:

- **One `entities` table.** `kind ∈ organization | workspace | project` is a
  **display label**, carrying no structural meaning and no special powers.
- **No `parent_id`. No containment. No inheritance of anything, ever.**
- **A person may belong to any number of entities**, independently, at any label.
- A credential lent to an entity is available **in that entity only**. It does not
  reach anything above, below, or beside it, because there is no above, below, or
  beside.

### Retraction of the previous ruling

Version `0.0.0.1` of this spec argued for single-parent containment, on the
grounds that many-to-many containment makes a DAG in which credential inheritance
is undefined — *"if project P is contained by workspaces W1 and W2 and both grant
an OpenAI key, which key does P use?"*

That objection was **entirely contingent on inheritance existing.** With no
inheritance there is no conflict to resolve: every loan names exactly one entity
and applies to exactly that entity — and where a lender wants breadth, they name
several entities explicitly (Ruling 2b), which is a list, not a hierarchy. The
tree bought determinism that flatness gets for free, and charged for it in
expressiveness. Withdrawn.

### Entity links, if we want them at all

If it becomes useful to record that a project involves orgs A and B, do it as a
**purely descriptive** `entity_links` table — for breadcrumbs, grouping, and
display — and hold it as an invariant that it is **never consulted when resolving
access or credentials.** That is "in spirit parent-child, in practice not" made
literal. If that invariant ever feels inconvenient, the correct response is to
delete the table, not to consult it.

## Ruling 2 — credentials are *lent*, never owned by an entity

This is the core of the model, and the word is load-bearing.

**An entity never owns a credential.** A person lends one, and retains title the
entire time. There is no state in which a workspace "has" an API key the way it
has a name.

The lifecycle, in full:

1. **Lending.** A person attaches one of their credentials to an entity. The
   value stays theirs; the entity receives the *use* of it.
2. **Lending makes you an admin.** Not by appointment — **by contribution.** The
   person who put the key in is, by default, an admin of that entity for as long
   as the loan is live. This is the ruling that answers *"no one wants to be the
   keymaster"*: nobody is appointed keymaster, and whoever happens to lend is
   simply trusted with the room they just made usable.
3. **Walking away.** The lender ends the loan and takes their key. Nothing is
   destroyed.
4. **The entity is now keyless** — not broken, not deleted, just inert on that
   capability — **until someone else claims admin by lending theirs.**

An entity with no active loans is a perfectly valid entity. It has members,
history, and artifacts; it just cannot currently call anything that costs money.
That is an accurate description of a great many real projects between funding.

### Effective role

A person's role in an entity is the **greater of**:

- their assigned membership role (`entity_memberships.role`), and
- `admin`, if they currently have at least one live loan to that entity.

When the last loan from a person ends, their *derived* admin ends with it; any
separately assigned role is untouched. Admin is therefore self-healing in both
directions — it appears when someone contributes and recedes when they stop,
without anyone filing a ticket.

### What the model deliberately does not do

It does not ask who is *allowed* to lend. Any member may. Over-flexible by
choice: in a world where a new API shows up every week, the cost of asking
permission to be useful is higher than the cost of someone lending a key nobody
needed.

## Ruling 2b — the cascade is a lender's gesture, not a directory's structure

The contrast that makes this clear is Okta. Okta assumes a **tight** concept of
organization, a tight in-or-out, tight parent-child relationships, and
inheritance that follows from all of it. Access flows downhill because the
directory says the hill exists.

Here the hill does not exist — but the *gesture* people want still does. A lender
should be able to say, in one motion:

> *this organization, and everyone in it; that workspace, and everyone in it;
> that project, and everyone in it.*

That is a **cascade**, and the distinction from Okta is the whole point:

- In Okta, the cascade is **structural** — the directory decides what flows
  where, and the admin can only work with the shape it was given.
- Here, the cascade is **declared by the lender**, per lending act. It names an
  explicit set of entities. Nothing flows anywhere the lender did not name.

So one lending act may target several entities at once. It is still not
inheritance: no entity acquires a key because of its relationship to another
entity. Every reachable entity is one the lender pointed at.

**Consequences to hold:**

- A cascade is **a set of loans sharing a `cascade_id`**, not a new kind of
  object. End the cascade and every loan in it ends together — that is *"they
  take their keys."* End one entity's loan and the rest survive — partial
  withdrawal, which people will want the first time one collaboration sours and
  the others don't.
- **The spend cap belongs to the cascade; the meter reports per entity.** A
  lender is exposed on one card, so the ceiling that matters is the total across
  everywhere they lent. The breakdown they want to *read* is per entity — *"this
  project is burning it, that one isn't."* Cap at the cascade, attribute at the
  entity.
- **"Everyone in it" means everyone in it *later*, too.** Membership is dynamic,
  so a loan to an entity is a loan to whoever is in that entity for as long as
  the loan lives. The lending UI must say so plainly — *"this lends to the 3
  people in Apollo now, and anyone added to it later"* — because a lender who
  learns this after the fact will never lend again.

## Ruling 3 — separate the credential, the loan, and the artifact

"They take their keys with them" and "it's not destroyed per se" are both true and
about **different objects**. Conflating them is how this ends in an argument.

| Object | Belongs to | When the lender walks |
|---|---|---|
| **Credential** — the secret value | **The person**, always | Goes with them: exportable, revocable, deletable |
| **Loan** — an entity's right to *use* it | The lender's to give and end | Ends; that capability goes dark |
| **Artifact** — what was made through it: documents, indexes, memos, decks, embeddings | **The entity** | Stays |

Alice takes her key. The project keeps its work. What it loses is the
*capability*, and it should lose it **visibly**: *"Research search is
unavailable — the OpenAI key it used was lent by Alice Chen, and the loan has
ended,"* with a button to lend a replacement. Not a cryptic 401.

A credential value is **never copied into an entity.** A loan is a pointer plus
terms. This is "distribute capabilities, not secrets" from
[[Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal]], one level down.

## Ruling 4 — a lender needs a meter and a stop-button

Not as security posture. As the thing that makes lending survivable.

The reason people hesitate to lend a key is not missing ACLs. It is that once
lent, the lender is **blind and brakeless** — they cannot see what is being
charged to their card, and their only lever is the nuclear one: yank it, and
break several people's work with no warning.

So a loan carries terms, and the lender gets a view:

- **Attribution** — every use records the credential, the loan, the entity, the
  caller, the time, and a unit or cost figure where the provider gives one. The
  lender can answer *"what is my card paying for, and for whom."*
- **Spend cap** — optional, per period. Hitting it pauses the loan and notifies
  both sides. This is what makes leaving a key in place a reasonable act rather
  than an act of faith.
- **Expiry** — optional. Engagements end; loans should be able to end with them
  by default rather than by memory.
- **Wind-down notice** — a loan can be ended instantly, but the default is a
  grace window with notification, so the entity can find a replacement lender
  before anything stops working.

There is no `inherit_down` term. With no hierarchy there is nothing to inherit to.

## The two things that are not negotiable, and why

Given the explicit stance that this is not the moment for tight security, only
two constraints are held firmly — and both because **they are what makes
"lending" mean lending**, not because of any compliance frame:

1. **A borrower can never read the value.** Masked display only; no API returns
   it; it never enters a transcript. If Bob can read Alice's key, Alice did not
   lend it — she surrendered it, permanently, to everyone Bob will ever work
   with.
2. **Every use is attributed.** Without it the lender cannot make an informed
   decision about staying lent, so the rational move becomes never lending — and
   the whole model collapses back to everyone managing their own keys.

Everything else here can be loosened on contact with reality.

## The `user:org:workspace:project` idea, reframed

The colon tuple is worth keeping, but it is **not a path** — there is no
hierarchy to walk. It is an **acting context**: *who I am being right now*,
assembled from independent memberships that happen to co-occur.

It is **derived and sparse**. A person with no org shows `alice::…:apollo`. Render
it into audit rows and MCP resource URIs so a human reading a log can see the
context a capability was exercised in. Do not store it as a tuple — the copies
would disagree.

## Schema (proposed)

| Table | Notes |
|---|---|
| `entities` | `id` (UUIDv7), `kind ∈ organization / workspace / project` (**label only**), `slug`, `name`, `default_domain` (nullable, self-signup hint), `default_role`, timestamps. **No `parent_id`.** Generalises `workspaces`. |
| `entity_memberships` | `(didi_id, entity_id, role)`, unique on the pair, plus `granted_by` and `via ∈ invite / auto_join / seed` per the 2026-08-09 amendment. Generalises `workspace_memberships`. |
| `credentials` | `id`, `owner_didi_id` (**a person, never an entity**), `provider`, `label`, encrypted value, masked hint, `created_at`, `revoked_at`. |
| `credential_cascades` | One lending **act**. `id`, `credential_id`, `lent_by`, `lent_at`, `spend_cap`, `cap_period`, `expires_at`, `wind_down_until`, `ended_at`. **The cap lives here** — it is the lender's total exposure on one card. Ending this row pulls the key from every entity in the cascade at once. |
| `credential_loans` | One targeted entity. `id`, `cascade_id`, `entity_id`, `ended_at`. A row may end on its own (partial withdrawal) or with its cascade (*"take my keys"*). A live row confers derived `admin` on the cascade's `lent_by`. |
| `credential_usage` | Append-only: `credential_id`, `cascade_id`, `loan_id`, `entity_id`, caller `didi_id`, `app_slug`, `occurred_at`, `units` / `cost_estimate`. **Metered per entity, capped per cascade.** |
| `entity_links` | *Optional, descriptive only.* `(from_entity, to_entity, label)`. **Invariant: never consulted for access or credential resolution.** |

`organizations` (domain-as-id, billing, `firm_profiles`), `memberships` (org-wide
roles like `superuser`), `users`, `user_emails`, `sessions`, `login_tokens`,
`auth_events`, `apps` are unchanged.

Migration note: `workspaces` → `entities` with `kind: workspace`;
`workspace_memberships` → `entity_memberships`. Existing rows keep their ids.

## Open questions

1. **Does `organizations` survive as its own table**, or become `entities` rows
   with `kind: organization` plus a side table for domain-as-id, billing, and
   `firm_profiles`? The dual-vocabulary risk is real either way.
2. **Encryption posture for `credentials`** — envelope encryption per owner, or a
   single service key at rest? The unresolved half of parent **OQ#7**, and the
   piece that gates the non-client tier.
3. **Do artifacts derived from a lender's paid usage really stay?** This spec says
   yes. Worth confirming for the awkward case — embeddings generated entirely on
   Alice's key.
4. **Who sees `credential_usage`?** The lender certainly. Entity admins in
   aggregate? A member, for their own calls?
5. **Cost fidelity.** Most providers do not return per-call cost. Is a unit count
   plus a local price table honest enough, or does an approximate number start
   worse arguments than no number?
6. ~~**Can a loan be made to several entities at once?**~~ **Answered
   2026-08-20: yes — that is the cascade** (Ruling 2b). Remaining sub-question:
   when a cascade's cap is hit, does every entity in it stop at once, or does the
   lender get to say *"pause the noisy one, keep the rest running"*? The second is
   kinder and more work.

## Acceptance criteria

- [ ] A project can involve people from several organizations with no containment
      anywhere in the schema
- [ ] A person can belong to a project and nothing else, then join an org and a
      workspace later, without re-onboarding
- [ ] Lending a credential makes the lender an admin of that entity automatically
- [ ] Ending the last loan leaves the entity keyless, intact, and with every
      artifact — and a named, actionable message where the capability was
- [ ] Another member can restore the capability by lending theirs, becoming admin
      in the process, with no appointment step
- [ ] A lender can name several entities in one lending act (org + workspace +
      project), and nothing is reachable that they did not name
- [ ] A lender can pull their key from an entire cascade in one motion, or from
      one entity while the rest of the cascade survives
- [ ] The lending UI states that a loan reaches whoever is in the entity **later**,
      not only its current members
- [ ] A lender can see what their key was spent on, by whom, in which entity
- [ ] A lender can cap spend, and hitting the cap notifies rather than fails
      silently
- [ ] No borrower can read a credential value through any surface
- [ ] Membership remains email-domain-independent (2026-08-09 invariant holds)

## Anti-goals

- **No hierarchy, no inheritance** — Ruling 1. If a future need seems to want it,
  re-read the "collaborations among many organizations" line first. A cascade is
  not inheritance: it reaches only entities the lender named (Ruling 2b).
- **Not a vault.** Backing store stays parent **OQ#3**.
- **Not per-resource ACLs.** Which deck, which memo, which corpus stays in the
  services, per 2026-08-09.
- **Not a billing system.** `credential_usage` informs the lender; it does not
  invoice anyone.
- **Not a permissions cathedral.** Any member may lend. The model would rather
  admit an unnecessary key than block a useful one.

## Related

- [[Id-Didi-Sh-Identity-Service]] — the spec of record; the 2026-08-09 amendment
  this builds on
- [[Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal]] — the
  capabilities-not-secrets reframe; answers OQ#6 (scoping grammar) and most of
  OQ#7 (BYO-key custody)
- `id-didi-sh/context-v/explorations/Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane.md`
  — implementation-local notes, incl. the OAuth 2.1 gap
- `self-host-stack/context-v/specs/Homebase-MCP-One-Connector-Per-Client.md` —
  the consumer; its A1/A3 amendments depend on this model
- [[Workspaces-as-Tenant-Primitive]] (augment-it) — the sibling definition to
  reconcile toward

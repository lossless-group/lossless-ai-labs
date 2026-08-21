---
title: "Flexible entity relationships, to mirror messy IRL collaboration"
lede: "People collaborate on whoever's credit card is handy. The model has to let a key hang at any level, be shared deliberately, be watched while it's shared, and leave with its owner without taking the work with it."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
semantic_version: 0.0.0.1
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
> — Michael, 2026-08-20

That is the whole problem in one sentence, and no identity model in the
mainstream expresses it. Vendors assume the org buys the key and the org owns it.
In practice one person expenses an OpenAI account, four people build on it, and
eighteen months later that person leaves — at which point the honest questions
are *whose key was that*, *what did it pay for*, and *what breaks now*.

The current model cannot answer any of them, because a credential has nowhere to
hang except an environment variable.

This spec proposes where a credential hangs, who may use it, how its owner
watches it while it's shared, and what happens when they take it back.

## What already exists — do NOT relitigate

The [[Id-Didi-Sh-Identity-Service]] amendment of **2026-08-09** already settled
the tenancy question. Carried forward wholesale:

- **The workspace is the tenancy boundary, and the boundary secrets attach to.**
  Not the org. Already ruled.
- **Membership is explicit and email-domain-independent.** Stated there as an
  **invariant**, precisely so a later reader does not "simplify" it back into a
  domain check. This spec reaffirms it rather than restating it.
- **A domain is a self-signup convenience, never an identity.**
  `workspaces.default_domain` grants auto-join at `default_role`; the resulting
  membership row, not the domain, is thereafter the authority.
- **Organizations survive, demoted** — domain-as-id, useful for grouping,
  billing, and firm profiles; no longer the access boundary.
- Tables `workspaces` and `workspace_memberships` exist, the latter carrying
  `granted_by` and `via ∈ invite / auto_join / seed` so an audit can answer *how*
  someone got in.

**The delta this spec adds** is therefore narrower than it first appears:

1. a **project** level beneath workspace,
2. a ruling on **which relationships are many-to-many and which are not**,
3. **credentials as first-class objects** that attach to a scope,
4. **portability** — what leaves with a departing owner and what does not.

## The addressing idea, kept

`userid : organizationid : workspaceid : projectid` is a good instinct and should
become real: a **canonical scope address**, rendered into audit rows and MCP
resource URIs so a human reading a log can see exactly where a capability was
exercised.

It should be **derived, not stored**. Store the leaf scope; render the address by
walking up. Storing the full tuple invites the three copies to disagree.

## Ruling 1 — many-to-many for MEMBERSHIP, single-parent for CONTAINMENT

This is the one place the proposal needs to be narrowed, and it is worth the
paragraph.

Every example given is a **membership** statement: *"a user that is only in a
project… can then add their organization and create another workspace… can be
invited from a project into a workspace."* All of those work perfectly with a
person belonging to many scopes at once. None of them requires a *project* to sit
inside two workspaces simultaneously.

Make containment many-to-many and the scope graph becomes a **DAG**, at which
point credential inheritance is undefined. If project P is contained by
workspaces W1 and W2 and both grant an OpenAI key, which key does P use? Every
answer is either arbitrary or demands per-edge priority — a knob nobody will set
correctly, on a path nobody can debug.

**Therefore:**

- **A scope has at most one parent.** Containment is a tree.
- **A user may belong to any number of scopes at any level, independently.**
  Membership is many-to-many and always has been.
- Inheritance is a walk up a single chain, so "which key applies here" always has
  exactly one answer.

This preserves every collaboration shape described and costs nothing anyone
asked for. A genuinely shared project between two orgs is expressible as one
scope with members from both — which is what is actually happening in real life
anyway.

## Ruling 2 — one `scopes` tree, not three parallel tables

Adding `projects` alongside `workspaces` means a third table of near-identical
shape, a third membership table, and — the real cost — a third credential-grant
table. A fourth level later triples it again.

**Model tenancy as a single self-referential `scopes` table** with
`kind ∈ organization | workspace | project`, `parent_id` nullable. Membership,
credential grants, and audit all point at `scope_id` and stop caring how deep it
sits.

Consequences worth naming:

- `organizations` **stays** as its own table. It carries genuine extra meaning —
  domain-as-id, billing, the 1:1 `firm_profiles` extension — that workspaces and
  projects do not have. It gains a mirror row in `scopes` (`kind: organization`)
  so the tree has a root to hang from.
- `workspaces` and `workspace_memberships` **migrate into** `scopes` and
  `scope_memberships`. This is a real migration of a table currently in
  `Implementing` status, and it is the main cost of this spec. It buys: projects
  for free, arbitrary future depth for free, and one credential-grant mechanism
  instead of N.
- `workspaces.default_domain` / `default_role` move to `scopes` unchanged. The
  auto-join invariant is untouched.

If the migration is judged too expensive right now, the fallback is to keep
`workspaces` and add `projects` as a child table — but make the **credential
grant polymorphic over scope type from day one**, because that is the piece whose
duplication actually hurts.

## Ruling 3 — separate the credential, the grant, and the artifact

"They take their keys with them" and "it's not destroyed per se" are both correct
and they are about **different objects**. Conflating them is how this ends in a
dispute.

| Object | Belongs to | On departure |
|---|---|---|
| **Credential** — the secret value Alice pasted | **Alice**, always | Leaves with her: exportable, revocable, deletable |
| **Grant** — a scope's right to *use* that credential | Alice's to give and withdraw | Withdrawn; the capability goes dark |
| **Artifact** — what was produced through it: indexed documents, memos, decks, embeddings | **The scope** | Stays |

So: Alice takes her key. The workspace keeps its work. What the workspace loses
is the *capability*, and it loses it visibly — the correct UI is *"Research
search is unavailable: the OpenAI key it used was provided by Alice Chen and has
been withdrawn"*, with a button to attach a replacement. Not a cryptic 401.

A credential is **never** copied into a scope. A grant is a pointer plus terms.
This is the same "distribute capabilities, not secrets" reframe from
[[Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal]], applied one level
down: scopes receive capabilities, not key material.

## Ruling 4 — a shared key needs a meter and a stop-button, or sharing doesn't happen

This is the ruling that makes the rest work, and it is not a permissions problem.

The reason people hesitate to share a key is not that ACLs are missing. It is
that **once shared, the owner is blind and brakeless**: they cannot see what is
being spent on their card, and their only lever is the nuclear one — revoke, and
break four people's work without warning.

A grant therefore carries **terms**, and the owner gets a view:

- **Attribution.** Every use records `(credential_id, grant_id, scope_address,
  didi_id of the caller, timestamp, unit cost if the provider reports it)`. Alice
  can answer "what is my card paying for, and for whom."
- **Spend cap** — optional ceiling per period. Reaching it disables the grant and
  notifies both parties. This is the brake that makes leaving a key in place a
  reasonable act rather than an act of faith.
- **Expiry** — optional. Advisor engagements end; the grant should end with them
  by default rather than by memory.
- **Inherit-down** — boolean. Does this grant reach child scopes, or only this
  one? Defaults to **off**: a key given to a project should not silently become a
  key for its whole org.
- **Withdrawal notice** — a grant may be withdrawn immediately, but the default
  is a grace window with notification, so the scope can attach a replacement
  before anything breaks.

Every one of these exists to serve the credit-card sentence at the top.

## Schema (proposed)

| Table | Notes |
|---|---|
| `scopes` | `id` (UUIDv7), `kind ∈ organization / workspace / project`, `parent_id` (nullable, self-ref — **at most one parent**), `slug`, `name`, `default_domain` (nullable, self-signup hint only), `default_role`, timestamps. Replaces `workspaces`. |
| `scope_memberships` | `(didi_id, scope_id, role)`, unique on the pair. Carries `granted_by` and `via ∈ invite / auto_join / seed`, per the 2026-08-09 amendment. Replaces `workspace_memberships`. |
| `credentials` | `id`, `owner_didi_id` (**the person, never a scope**), `provider` (`openai`, `anthropic`, `decile`, …), `label`, encrypted value, `last_four` / masked hint, `created_at`, `revoked_at`. |
| `credential_grants` | `(credential_id, scope_id)` + terms: `inherit_down` (bool, default **false**), `spend_cap` + `period`, `expires_at`, `granted_by`, `granted_at`, `withdrawn_at`, `withdraw_notice_until`. |
| `credential_usage` | Append-only attribution: `credential_id`, `grant_id`, `scope_id`, `didi_id` of caller, `app_slug`, `occurred_at`, `units` / `cost_estimate`. What makes the meter real. |

`organizations`, `firm_profiles`, `memberships` (org-wide roles like `superuser`),
`users`, `user_emails`, `sessions`, `login_tokens`, `auth_events`, `apps` are
unchanged.

## Open questions

1. **Is the `scopes` migration worth it now**, or do we add `projects` as a child
   table and only make the grant polymorphic? Cost is a live migration on an
   `Implementing` service; benefit is every future level being free.
2. **Encryption posture for `credentials`** — envelope encryption with a
   per-owner key, or a single service key at rest? This is the unresolved half of
   parent **OQ#7** and it gates the non-client tier.
3. **Does withdrawal cascade to artifacts?** This spec says no. Confirm that is
   acceptable when the artifact is *derived from* the owner's paid usage — e.g.
   embeddings generated on Alice's key.
4. **Who sees `credential_usage`?** The owner certainly. The scope admin, in
   aggregate? A member, for their own calls? Visibility here is itself sensitive.
5. **Cost data quality.** Most providers do not return per-call cost. Is a
   token/unit count plus a local price table honest enough to show a human, or
   does an approximate number invite worse arguments than no number?
6. **Does a role vocabulary shared across org / workspace / project still fit**,
   or do projects need their own? The 2026-08-09 amendment shares one vocabulary;
   nesting may strain it.

## Acceptance criteria

- [ ] A user can belong to a project with no organization, then add an
      organization and a workspace later, without re-onboarding
- [ ] A user can be invited from a project *into* its parent workspace
- [ ] A credential attaches at any scope level, and inheritance to children is
      opt-in, defaulting to off
- [ ] An owner can see what their key was spent on, by whom, and in which scope
- [ ] An owner can cap spend, and hitting the cap notifies both parties instead of
      failing silently
- [ ] On departure the owner exports and revokes; the scope keeps every artifact
      and shows a named, actionable message where the capability used to be
- [ ] No credential value is ever copied into a scope, returned by an API, or
      written to a transcript
- [ ] Membership remains email-domain-independent (2026-08-09 invariant holds)

## Anti-goals

- **Not a vault.** Backing-store choice (OpenBao / Phase / encrypted-at-rest)
  stays parent **OQ#3**; this spec describes the object model above it.
- **Not per-resource ACLs.** Which deck, which memo, which corpus stays in the
  services, per the 2026-08-09 ruling.
- **Not a billing system.** `credential_usage` exists to inform the key's owner,
  not to invoice anyone.
- **Not many-to-many containment** — see Ruling 1.

## Related

- [[Id-Didi-Sh-Identity-Service]] — the spec of record; the 2026-08-09 amendment
  this one builds on
- [[Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal]] — the
  capabilities-not-secrets reframe, and OQ#6 (scoping grammar) / OQ#7 (BYO-key
  custody) that this spec is answering
- `id-didi-sh/context-v/explorations/Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane.md`
  — implementation-local notes, incl. the OAuth 2.1 gap
- `self-host-stack/context-v/specs/Homebase-MCP-One-Connector-Per-Client.md` —
  the consumer; its A1/A3 amendments (2026-08-20) depend on this model
- [[Workspaces-as-Tenant-Primitive]] (augment-it) — the sibling definition to
  reconcile toward

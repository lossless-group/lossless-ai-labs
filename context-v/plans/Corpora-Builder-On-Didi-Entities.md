---
title: "corpora-builder on didi.sh Entities — signup, login, and who sees which corpus"
lede: "The tenancy primitive is already built and it's flat. corpora-builder should inherit it, not invent a second one."
date_created: 2026-08-22
date_modified: 2026-08-23
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: Draft
site_uuid: d7539e87-715e-4114-909c-9a14ee5c168a
hex_code: khj241
applies_to:
  - ai-labs/corpora-builder
  - ai-labs/id-didi-sh
summary: >-
  Rough plan for putting corpora-builder behind didi.sh signup and login and
  binding corpus access to didi.sh entities. Its main contribution is what it
  found rather than what it proposes — the flat entity primitive
  (organization/workspace/project/team as labels, no hierarchy), independent
  memberships, and credential lending are already implemented in the Phoenix app,
  and corpora-builder already has the WorkspaceResolver seam waiting for them.
  Sequenced A-F, deliberately rough, with the questions that need answering before
  any of it is worth building. Revised 2026-08-23 with agent chat, which turns out
  to ask the identical question the R2 credential does — whose account does this
  install spend from — and to be answerable by the same lending primitive.
tags:
  - Plan
  - Rough
  - Corpora-Builder
  - Didi-Sh
  - Identity
  - Tenancy
  - Agent-Chat
publish: true
---

# corpora-builder on didi.sh Entities

> **Rough by intent.** Written to establish what exists and what the shape is,
> not to be implemented from. Phases are sketches; the test IDs come later, in
> per-phase specs.

## The ask

> If I'm building corpora for reach-edu, that's an organization membership. If
> I'm inviting someone to that organization, they see the corpora. To use it,
> they download corpora-builder.

## What already exists — verified 2026-08-22, not remembered

More is built than the ask assumes, and the shape is better than the ask
describes.

**In `id-didi-sh` (Elixir/Phoenix), shipped:**

| | |
|---|---|
| `accounts/user.ex`, `session.ex` | accounts and sessions |
| `magic_link_notifier.ex`, `login_token.ex` | **passwordless login already exists** |
| `invite_notifier.ex` | **invitations already exist** |
| `accounts/membership.ex` | `didi_id` + `org_id` + `role`, roles `superuser · org_owner · org_admin · editor · viewer` |
| `entities/entity.ex` | `kind` + `slug` + `name` + `org_id` |
| `entities.ex` | the flat tenancy context |
| `credential_controller.ex` | credentials, and **lending them to entities** |
| `accounts/app.ex` | per-app registration with `redirect_prefixes` — the OAuth-shaped seam |

**In `corpora-builder`, shipped:** `src/identity/base.py` defines
`WorkspaceResolver`; `static.py` implements it from `.env` and says in its own
docstring: *"When didi.sh grows a workspace claim, a `DidiWorkspaceResolver`
replaces this class and nothing above it changes."* **The seam is already there
and nothing above it names a bucket.**

### The correction the ask needs

`entities/entity.ex:4-11` states it outright:

> `kind` is a **DISPLAY LABEL**. It confers no structure and no powers.
> `@kinds ~w(organization workspace project team)`

And `entities.ex:10-22` gives three invariants, each flagged as *"the kind of
thing a later reader simplifies into something tidier"*:

1. **No hierarchy.** *"organization / workspace / project are labels. There is no
   `parent_id`, no containment, no inheritance. Projects are collaborations among
   many organizations; a tree cannot express that."*
2. **Memberships are independent.** Removing someone from one entity does nothing
   to any other. *"A person who belongs to a project and nothing else is in a
   normal state."*
3. **Lending confers admin.** Anyone with a live credential loan to an entity is
   effectively admin there, membership row or not — *"the person with the credit
   card is frequently not on the project."*

So *"that's an organization membership"* is right in effect and slightly off in
mechanism: **it is an entity membership, and `organization` is one label an
entity can wear.** Nothing changes about the behaviour you described — invite,
they see the corpora — but the schema binds a corpus to an **entity id**, never
to a kind. Binding to "organizations" specifically would reintroduce the
hierarchy this design deliberately refused.

This also supersedes the open tension in
[[Didi-Login-and-Workspace-Config-for-Corpora]] (2026-08-08), which argued
workspace-should-be-the-boundary-and-org-demoted. **Entities absorbed the
argument by making the distinction a label.** That plan's *config delivery*
content still stands; its tenancy debate is settled.

## The model, in one line each

- A **corpus belongs to an entity** (`entity_id`), whatever kind that entity wears.
- **Membership in that entity** is what lets you see the corpus. Independent of every other membership.
- **A role on that membership** decides read vs write. `viewer` reads; `editor` captures and triages.
- **R2 credentials are lent to the entity**, not held per user — the mechanism `credential_controller.lend/2` already implements.
- **The bucket stays per client.** Entity membership decides *who*; the bucket boundary stays *structural*, per [[Sync-Corpora-to-R2-and-Show-Clients-What-Changed]] and the binary spec's two-scopes resolution.
- **A model credential is a credential.** If agent chat ever runs inside the app, whose account it spends from is decided by the same `credential_controller.lend/2` that decides the R2 one — see below.

## Phases — sketches, not specs

### Phase A — name what corpora-builder needs *(no code)*

An explicit list of identity primitives, handed to `id-didi-sh` so the two move
in parallel. Draft: *list my entities*, *my role on entity X*, *lend/fetch the R2
credential for entity X*, *invite someone to entity X*. Most of this exists;
this phase is establishing which endpoints are the contract.

### Phase B — `DidiWorkspaceResolver` *(corpora-builder, Python)*

Implement the resolver the seam already anticipates. Reads entity + storage
location from didi.sh instead of `.env`. **`StaticWorkspaceResolver` stays** as
the offline path — a corpus you cannot open because an identity service is down
is a worse product.

### Phase C — login in the app *(corpora-builder, Tauri)*

Magic-link login against the existing `login_token` flow, with `apps.redirect_prefixes`
registering corpora-builder as a client. Token in the OS keychain, not a file.
Ends at: launch the app, sign in, see the entities you belong to.

### Phase D — entity → corpus binding

A corpus declares its `entity_id`. Listing corpora means listing entities you
belong to and resolving each to a bucket + prefix. Role gates write verbs.
**This is the phase that delivers the ask** — invite someone to the entity, they
open corpora-builder, they see the corpus.

### Phase E — the installer

Per the operator, 2026-08-22: collaborators will not run Tauri from source. A
signed installable app with its own icon that provisions everything it needs —
Python venv, **and Ghostscript**, which
[[../../corpora-builder/context-v/specs/Binary-Ingest-And-Bin-Store]] needs and
which `uv sync` cannot produce. This is W1's *"one artifact… brings every tool
with it"* becoming mandatory. Already noted against Phase 7 of the corpora-builder
MVP plan.

## Agent chat, and whose account it spends from

*Added 2026-08-23, from the operator's question: **can in-app agent chat just
interface with Claude Code on my machine instead of using tokens?***

Technically yes, three ways — the **Claude Agent SDK** (which picks up the `claude`
CLI's credentials when it is installed and logged in, so calls bill against a
Claude subscription seat rather than API credits), **spawning `claude -p` headless**
and reading its stream, or **inverting the whole thing** and exposing
corpora-builder as an MCP server so the operator talks to the corpus from the
Claude Code session they already have open.

corpora-builder is unusually well placed for the first two: the Python sidecar
already exists and already spawns processes, so it is a module beside
`src/server/`, not an architecture.

**But "instead of using tokens" is not what happens.** Tokens are still consumed;
they are billed to a subscription rather than to API credits. And that is the
whole reason this belongs in *this* plan rather than a chat one:

> **Using your own seat to power your own local tooling is one thing. Shipping
> corpora-builder to reach-edu so their install drives your seat is a different
> thing.**

Which is the same sentence as Open Question 1 with one noun changed. *Does a
client machine hold an R2 credential, or call something that reads on its behalf?*
becomes *does a client machine hold a model credential, or call something that
infers on its behalf?* Same question, same fork, and **didi.sh already has the
mechanism**: `credential_controller.lend/2` lends a credential to an entity, and
an Anthropic key is not structurally different from an R2 key.

So the answer is not "pick a chat integration." It is:

1. **MCP first, and soon.** Option three needs *no identity at all* — it is
   operator-only by construction, costs nothing, and makes the corpus reachable
   from a session that is already open. Nothing in this plan gates it.
2. **In-app chat waits for Phase D.** Once a corpus resolves through an entity,
   "which credential does this entity infer with" has somewhere to live. Building
   chat before that means hardcoding an answer and migrating it later.
3. **Read the terms before building on subscription auth.** Whether a
   distributed app may drive a seat is a licensing question, not a technical one,
   and it is the kind that gets an account flagged rather than erroring.

Two smaller things worth writing down now:

- **The CLI cannot be assumed.** A Tauri app on a collaborator's machine may have
  no `claude` on `PATH`. That needs detection and an honest fallback — *"Claude
  Code not found: install it, or add a key"* — not a chat box that silently does
  nothing. Adds to Phase E's install surface.
- **`viewer` gets a third meaning.** Open Question 2 asked whether a viewer reads
  the corpus or only the feed. Chat adds *can they spend inference against this
  entity* — plausibly the sharpest line of the three, because it is the one with
  a bill attached.

### Phase F — in-app chat *(after D, sketch only)*

Agent SDK in the sidecar, credential resolved per entity, model choice and spend
visible to whoever owns the entity. Deliberately last: everything above it is
about knowing *who is asking*, and a chat surface that cannot answer that is a
chat surface that cannot be given to a client.

## What this deliberately does not do

- **No new tenancy model.** If corpora-builder needs a concept didi.sh lacks, the
  answer is to add it to didi.sh, not to grow a second one here.
- **No hierarchy.** No org-contains-workspace-contains-project. It was refused on
  purpose and the reason is written down.
- **No change to the bucket boundary.** Entities decide who; buckets stay
  per-client and structural.
- **No client-facing web surface.** Still Phase 3 of the sibling plan.

## Open questions — these gate whether any of it is worth building

1. **Does a client ever hold R2 credentials directly?** Lending is built and
   confers admin. But a client machine holding a bucket credential is a different
   security posture from one calling an API that reads on their behalf. **This is
   the question that most changes the design**, and it is not a technical one.
2. **What does a `viewer` actually get?** Read the corpus, or read the *feed*
   only? The change feed already exists and is read-only by construction; the
   corpus is 30 MB of text plus fetched binaries. Cheapest useful answer may be
   feed-only, with corpus access a separate grant.
3. **Whose account does inference spend from?** The R2 question again, with the
   noun changed — see *Agent chat* above. Not answerable before Phase D, and
   worth not pretending otherwise.
4. **Which is the real first user?** A reach-edu collaborator, or a second
   Lossless operator? They want different things — the first needs the installer
   and read-only safety, the second needs write access and cares nothing about
   onboarding. Building for the wrong one first is the main way this wastes time.

## Related

- `ai-labs/id-didi-sh/lib/id_didi_sh/entities.ex` — the three invariants, read them before designing anything here
- `ai-labs/context-v/specs/Id-Didi-Sh-Identity-Service.md` — the spec of record
- [[Didi-Login-and-Workspace-Config-for-Corpora]] — the 2026-08-08 config-delivery plan; its tenancy debate is superseded, its credential content is not
- [[Sync-Corpora-to-R2-and-Show-Clients-What-Changed]] — the bucket boundary this does not touch
- `ai-labs/corpora-builder/src/identity/static.py` — the seam waiting for Phase B
- `ai-labs/id-didi-sh` `credential_controller.lend/2` — the primitive that answers both credential questions, R2 and model

---
title: "Entities and keys — implementation plan for id-didi-sh"
lede: "Build the flat entity model and credential lending into the Phoenix service: six tables, two contexts, a resolve path for server-side consumers, and eight increments each ending in something you can observe rather than believe."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
semantic_version: 0.0.0.1
status: Draft
tags:
  - Plan
  - Id-Didi-Sh
  - Entities
  - BYOK
  - Credentials
  - Elixir
site_uuid: e470cbcb-0f18-407f-933b-0fafa5e24b1b
hex_code: z82qld
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
publish: false
from: "id-didi-sh"
from_path: "context-v/plans/Entities-and-Keys-Implementation-Plan.md"
---
# Entities and keys — implementation plan for id-didi-sh

**Audience: an engineer who has not been in these conversations.** Everything
needed to build this should be here or one link away.

**The contract lives upstream.** The *why* and the rulings are
`ai-labs/context-v/specs/Flexible-Entity-Relationships-to-Mirror-Messy-IRL-Collaboration.md`.
Per this repo's standing reminder, contract changes go there first. This document
is the build plan only — modules, migrations, endpoint shapes, gates. **If this
plan and that spec disagree, the spec wins.**

## Read first, in this order

1. `ai-labs/context-v/specs/Flexible-Entity-Relationships-to-Mirror-Messy-IRL-Collaboration.md`
   — the model. Rulings 1, 1b, 2, 2b, 3, 4.
2. `ai-labs/context-v/specs/Id-Didi-Sh-Identity-Service.md` — the service of
   record: session model, JWKS, existing schema.
3. `context-v/notes/What-OAuth-and-OIDC-Actually-Are-and-What-didi-sh-Still-Needs.md`
   — background only; **OAuth is NOT in this plan's scope.**

## Ground truth about the codebase, as of 2026-08-20

Verified by reading, not assumed:

- **Elixir / Phoenix 1.8**, Ecto with **`ecto_sqlite3`**, deployed on Fly (`lax`).
- **Two migrations exist**: `20260706000001_identity_schema.exs` and
  `20260706220001_user_email_aliases.exs`.
- **Tables that exist**: `users` (PK `didi_id`, `:string`), `organizations` (PK
  `id`, `:string`, = email domain), `firm_profiles`, `memberships`,
  `oauth_accounts`, `login_tokens`, `sessions` (PK `id`, `:string`),
  `auth_events`, `apps` (PK `slug`), `user_emails`.
- **`workspaces` and `workspace_memberships` DO NOT EXIST.** The identity spec's
  2026-08-09 amendment made them first-class on paper; nothing was built. **There
  is therefore no migration to perform** — `entities` is greenfield. This is the
  single most important fact in this document.
- One context module, `IdDidiSh.Accounts` (`lib/id_didi_sh/accounts.ex`), with
  schemas under `lib/id_didi_sh/accounts/`.
- Helpers already present: `IdDidiSh.Token` (EdDSA sign/verify), `IdDidiSh.Keys`,
  `IdDidiSh.UUID7`, `IdDidiShWeb.SessionCookie`.
- Conventions to follow: string PKs (not Ecto `:binary_id`), `:utc_datetime`
  timestamps, `:map` columns for JSON, `mix id.*` tasks for operator actions
  (`id.org`, `id.member`, `id.seed`, `id.alias`).

## Scope

**In:** the entity model, membership, credentials, lending (cascades, loans),
usage metering, the resolve path server-side consumers use, and a minimal LiveView
for a human to paste and lend a key.

**Out:** OAuth/OIDC authorization-server endpoints (separate amendment, separate
branch); proxying provider API calls; billing; spend *forecasting*; per-member
grants inside an entity; the `entity_links` table (Ruling 1, optional, not now).

## Design decisions this plan makes

Numbered so they can be argued with individually.

| # | Decision | Why |
|---|---|---|
| **E1** | **`entities` is greenfield and independent. `organizations` is left untouched.** An entity may carry a nullable, descriptive `org_id`; it is **never consulted** for access or credential resolution. | No migration needed. `organizations` still earns its place for domain-as-id and `firm_profiles`. The duplication is real and logged as OQ 1. |
| **E2** | **String PKs holding UUIDv7**, via the existing `IdDidiSh.UUID7`. | Matches `users`, `sessions`, `organizations`. SQLite has no UUID type; deviating would make joins inconsistent. |
| **E3** | **Encryption at rest via `cloak_ecto`** (AES-256-GCM), key from `CREDENTIAL_ENCRYPTION_KEY`. | Encryption is the one place hand-rolling is indefensible. Cloak gives a transparent Ecto type and a documented rotation path. This is the only new dependency. |
| **E4** | **Two new contexts: `IdDidiSh.Entities` and `IdDidiSh.Credentials`.** Do not extend `Accounts`. | `Accounts` is already the whole service. Credentials have a genuinely separate lifecycle and a different blast radius. |
| **E5** | **Server-side consumers resolve a key via an app-authenticated endpoint** that returns plaintext, records usage, and enforces the cap. Browsers and humans never receive a value. | Ruling 3's invariant is that *a borrower* — a person — cannot read the value. A registered server-side app is not a borrower. Proxying every provider call is the eventual ideal and far too large for v1; logged as OQ 4. |
| **E6** | **FK `on_delete: :delete_all` from an entity to its memberships is correct and does NOT violate Ruling 1b.** | Ruling 1b forbids one *membership* removal cascading to another. Deleting the entity itself removing its own membership rows is ordinary referential integrity. Stated because the words look similar. |
| **E7** | **Derived admin is computed, never stored.** `effective_role/2` reads assigned role and live loans at call time. | A stored flag drifts the moment a loan ends. Ruling 2's "self-healing in both directions" only holds if it is derived. |

## Schema

Two migrations. SQLite types in parentheses.

### Migration 1 — `create_entities`

```
entities                          PK id :string (UUIDv7)
  kind          :string  not null   -- "organization" | "workspace" | "project" (LABEL ONLY)
  slug          :string  not null   -- unique
  name          :string  not null
  org_id        :string  null       -- descriptive only, references organizations(id), NEVER consulted
  default_domain :string null       -- self-signup hint only
  default_role  :string  null
  timestamps(type: :utc_datetime)
  unique_index [:slug]
  index [:kind]

entity_memberships                PK id (bigint auto)
  didi_id       :string  not null   -- references users(didi_id) on_delete: :delete_all
  entity_id     :string  not null   -- references entities(id)   on_delete: :delete_all
  role          :string  not null   -- shared vocabulary with memberships.role
  granted_by    :string  null       -- didi_id of granter
  via           :string  not null   -- "invite" | "auto_join" | "seed"
  timestamps(type: :utc_datetime)
  unique_index [:didi_id, :entity_id]
  index [:entity_id]
```

**No `parent_id`. Do not add one.** See Ruling 1 — projects are collaborations
among many organizations, and a hierarchy makes the common case unrepresentable.

### Migration 2 — `create_credentials`

```
credentials                       PK id :string (UUIDv7)
  owner_didi_id :string  not null   -- references users(didi_id), the PERSON, never an entity
  provider      :string  not null   -- "anthropic" | "openai" | "decile" | ...
  label         :string  not null   -- human name, e.g. "Jason personal Anthropic"
  value_encrypted :binary not null  -- Cloak.Ecto.Binary
  last_four     :string  not null   -- display hint, plaintext
  created_at / updated_at
  revoked_at    :utc_datetime null
  index [:owner_didi_id]

credential_cascades               PK id :string (UUIDv7)   -- ONE lending ACT
  credential_id :string  not null
  lent_by       :string  not null   -- didi_id; may NOT be a member of the targets (Ruling 2)
  lent_at       :utc_datetime not null
  spend_cap     :integer null       -- minor units (cents). NULL = uncapped
  cap_period    :string  null       -- "day" | "month"
  expires_at    :utc_datetime null
  wind_down_until :utc_datetime null
  ended_at      :utc_datetime null
  index [:credential_id]

credential_loans                  PK id :string (UUIDv7)   -- ONE targeted entity
  cascade_id    :string  not null
  entity_id     :string  not null
  ended_at      :utc_datetime null
  unique_index [:cascade_id, :entity_id]
  index [:entity_id]

credential_usage                  PK id (bigint auto)      -- append-only
  credential_id :string  not null
  cascade_id    :string  not null
  loan_id       :string  not null
  entity_id     :string  not null
  didi_id       :string  null       -- caller; null for unattributed system calls
  app_slug      :string  null       -- references apps(slug)
  occurred_at   :utc_datetime not null
  units         :integer null
  cost_estimate :integer null       -- minor units
  index [:credential_id, :occurred_at]
  index [:entity_id, :occurred_at]
```

`credential_usage` is **append-only**. No updates, no deletes. It is the lender's
evidence.

## Context APIs

### `IdDidiSh.Entities`

```
create_entity(attrs)                     -> {:ok, %Entity{}} | {:error, changeset}
get_entity(id) / get_entity_by_slug(slug)
list_entities_for(didi_id)               -> entities where member OR active lender
add_member(entity_id, didi_id, role, opts)   -- opts: :granted_by, :via
remove_member(entity_id, didi_id)        -> :ok
list_members(entity_id)
memberships_for(didi_id)                 -> all entity memberships (for the disclosure)
effective_role(entity_id, didi_id)       -> :admin | assigned role | nil   (E7)
```

`effective_role/2` returns `:admin` when the person has **any live loan** to that
entity, regardless of whether a membership row exists (Ruling 2 — lending does not
require membership).

### `IdDidiSh.Credentials`

```
create_credential(owner_didi_id, provider, label, raw_value)
list_credentials(owner_didi_id)          -> masked; NEVER returns the value
revoke_credential(id, by_didi_id)

lend(credential_id, [entity_id], terms, lent_by)   -> {:ok, %Cascade{}}   -- the cascade
end_cascade(cascade_id, by_didi_id)                -> pulls from every entity at once
end_loan(cascade_id, entity_id, by_didi_id)        -> partial withdrawal

resolve(entity_id, provider, app_slug, opts)  -> {:ok, plaintext} | {:error, reason}
record_usage(loan_id, attrs)
usage_for_credential(credential_id, range)     -> per-entity breakdown
spend_in_period(cascade_id)                    -> for cap enforcement
```

`resolve/4` is the **only** function that returns plaintext. It must:

1. find a live loan for `(entity_id, provider)` — not expired, not ended,
   cascade not ended, credential not revoked;
2. check the cascade's cap via `spend_in_period/1` and refuse with
   `{:error, :cap_exceeded}` if exhausted;
3. write a `credential_usage` row;
4. return the decrypted value.

If more than one live loan matches, pick the **most recently lent** and log a
warning. There is no inheritance to disambiguate (Ruling 1), so this is a genuine
ambiguity a human created, and it should be visible.

## HTTP API

All under `/api`, same CORS and cookie-session posture as existing endpoints.

### Entities

| Endpoint | Notes |
|---|---|
| `GET /api/entities` | Entities I am a member of or actively lend to |
| `POST /api/entities` | `{kind, slug, name, org_id?}` |
| `GET /api/entities/:id` | Includes my `effective_role` |
| `PATCH /api/entities/:id` | Admin only |
| `GET /api/entities/:id/members` | |
| `POST /api/entities/:id/members` | `{email, role}` — issues an invite via the existing `login_tokens` path |
| `DELETE /api/entities/:id/members/:didi_id` | **Response MUST include `also_member_of: [...]`** — Ruling 1b's disclosure requirement, enforced at the API so any UI gets it right |
| `GET /api/users/:didi_id/entities` | Powers the pre-removal disclosure |

### Credentials

| Endpoint | Notes |
|---|---|
| `GET /api/credentials` | Mine. `last_four` only — **never the value** |
| `POST /api/credentials` | `{provider, label, value}`. Response has no value |
| `DELETE /api/credentials/:id` | Revoke; ends all cascades |
| `POST /api/credentials/:id/cascades` | `{entity_ids: [...], spend_cap?, cap_period?, expires_at?}` — **the cascade** |
| `DELETE /api/cascades/:id` | Pull from every entity at once |
| `DELETE /api/cascades/:id/loans/:entity_id` | Partial withdrawal |
| `GET /api/credentials/:id/usage` | Per-entity breakdown — the meter |

### Internal resolve (app-authenticated, E5)

| Endpoint | Notes |
|---|---|
| `POST /api/internal/resolve` | `{entity_id, provider}`. Authenticated by a registered app in the existing `apps` table, **not** by a user session. Returns `{value}` and records usage. Rate-limited. Never callable from a browser — enforce by requiring the app credential and rejecting cookie auth |

## Increments and gates

Each ends in something observable. Do not start N+1 until N's gate passes.

| # | Increment | Gate |
|---|---|---|
| **1** | Migration 1 + `Entities` context + schemas | `mix test` green; a `mix id.entity` task creates one and adds a member |
| **2** | Entity HTTP endpoints incl. the removal disclosure | Removing a member returns `also_member_of` listing their other entities. **Test: remove from entity A, assert membership in B is untouched** (Ruling 1b) |
| **3** | `cloak_ecto` wired; Migration 2; `credentials` create/list/revoke | A credential round-trips; the raw value appears in **no** API response and in **no** log line |
| **4** | Lending: cascades + loans, `effective_role` derived admin | Lending to three entities in one act creates one cascade and three loans; the lender is `admin` in all three **without a membership row**; ending the cascade removes admin everywhere at once |
| **5** | `resolve/4` + `/api/internal/resolve` + usage rows | A registered app resolves a key and a `credential_usage` row appears with the right entity |
| **6** | Cap enforcement + `usage_for_credential` breakdown | Exceeding a cascade cap returns `:cap_exceeded`; the breakdown attributes spend per entity |
| **7** | Minimal LiveView: my keys, lend, withdraw, usage | A human pastes a key and lends it to two entities **without a terminal** — the persona requirement |
| **8** | First real use: one credential lent to one entity, consumed by one app | End-to-end, with the meter showing real numbers |

## Test requirements

Beyond unit coverage, these encode the invariants and must exist by name:

- `test "removing a member from one entity leaves other memberships intact"` — both directions (Ruling 1b)
- `test "a non-member lender is admin while the loan is live, and nothing after"` (Ruling 2)
- `test "ending a cascade ends every loan in it"` and `test "ending one loan leaves the rest of the cascade live"` (Ruling 2b)
- `test "credential value is never present in any API response"` — assert over the serialized body
- `test "resolve records usage and refuses past the cap"`
- `test "entities have no parent_id"` — a schema assertion, so a future migration adding one fails loudly (Ruling 1)

## Operational notes

### Storage reality, verified 2026-08-20

**SQLite** (`Ecto.Adapters.SQLite3`, libSQL-compatible file) at
`/data/id_didi_sh.db` on the Fly volume `idds_data`. App `id-didi-sh`, region
`lax`, `shared-cpu-1x` / 512 MB, `POOL_SIZE` 5, `auto_stop_machines = off`.

**Migrations run at BOOT, not as a release command.**
`[processes] app = "sh -c '/app/bin/migrate && /app/bin/server'"` — because Fly
release commands run on an ephemeral machine that does not mount the volume. Two
consequences for this work: a failing migration takes the identity plane down
rather than failing a deploy step, and every migration here must be safe to
re-run and safe to roll forward. Test each one against a copy of the prod file
before deploying.

### 🔴 PREREQUISITE — replication before credentials (blocks increment 3)

**Litestream is not configured yet.** `fly.toml` lists R2 credentials as future
work, so **the Fly volume is currently the only copy of the database.**

That is acceptable for magic links and sessions, which are recoverable by
re-authenticating. It is **not** acceptable for credentials other people have
lent us: losing the volume would destroy keys belonging to Jason, an advisor, or
a client, which is precisely the failure this model exists to prevent.

**Increment 3 must not ship until replication exists.** Either stand up
Litestream → R2 first, or make a deliberate, written decision to accept the risk
at three users. Do not let this pass silently.

- **`CREDENTIAL_ENCRYPTION_KEY`** must exist before Migration 2 runs. 32 random
  bytes, base64. **Losing it means every lent credential is unrecoverable** —
  back it up where the Fly secrets are backed up, and say so in the runbook.
  Note the recovery matrix: ciphertext lives on the volume, the key lives in Fly
  secrets, and you need **both**. They must not share a single failure domain.
- Add `mix id.entity` and `mix id.lend` alongside the existing `mix id.*` tasks,
  so an operator can act before increment 7's UI exists.
- SQLite + Litestream: `credential_usage` is the only high-write table here.
  Watch its growth before enabling anything chatty.

## Open questions for the engineer to raise, not silently answer

1. **`entities` vs `organizations` duplication** (E1). Long-term, does
   `organizations` collapse into `entities` with `kind: "organization"` plus a
   side table for domain and firm profile? Not in this plan; do not improvise it.
2. **Role vocabulary.** `memberships.role` uses the five-role lattice. Does an
   entity of kind `project` need the same five? Reuse for now; flag friction.
3. **Cap accounting when the provider reports no cost.** `cost_estimate` may be
   null for most calls. Is a units-only cap honest enough to show a lender? See
   parent spec OQ 5.
4. **Resolve returns plaintext (E5).** The eventual ideal is didi.sh proxying
   provider calls so the value never leaves. When does that become worth it?
5. **Wind-down semantics.** `wind_down_until` is in the schema but no increment
   enforces it. Decide whether v1 honours it or drops the column.

## Related

- `ai-labs/context-v/specs/Flexible-Entity-Relationships-to-Mirror-Messy-IRL-Collaboration.md` — **the contract; wins on conflict**
- `ai-labs/context-v/specs/Id-Didi-Sh-Identity-Service.md` — the service of record
- `ai-labs/context-v/explorations/Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal.md` — the persona this serves
- `context-v/notes/What-OAuth-and-OIDC-Actually-Are-and-What-didi-sh-Still-Needs.md` — the adjacent, out-of-scope thread

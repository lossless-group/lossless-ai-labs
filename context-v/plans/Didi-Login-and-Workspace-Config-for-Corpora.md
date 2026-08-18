---
title: "didi.sh Login and Workspace-Delivered Config — the plan across three repos"
lede: "corpora-builder should get its config — R2 credentials included — from the didi.sh workspace, not a local `.env`."
date_created: 2026-08-08
date_modified: 2026-08-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.3
status: Draft
revisions:
  - "2026-08-08 — v0.0.0.3 — second correction: secretspec was never installed, only its manifest format adopted. Demoted from 'the interface' to an option, with the honest for/against and a leaning to skip it here."
  - "2026-08-08 — v0.0.0.2 — operator correction: domain-as-id is too strict for how this actually works (palmer-ai accounts on a human.vc address; advisors, investors and service providers at every startup). Workspace becomes the tenancy AND secret boundary; domain demoted to an auto-join convenience. Route A dropped. secretspec named as the interface."
  - "2026-08-08 — v0.0.0.1 — initial draft, offering org-keyed (A) vs workspace-first (B)."
tags:
  - Plan
  - Id-Didi-Sh
  - Corpora-Builder
  - Identity
  - Secrets-Management
  - Workspaces
  - SecretSpec
  - Cloudflare-R2
site_uuid: 2b616039-8200-48c0-8e80-74d03dc51f90
hex_code: 1t2ade
date_authored_initial_draft: 2026-08-08
date_authored_current_draft: 2026-08-08
---

# didi.sh Login and Workspace-Delivered Config for Corpora

## What was asked

> *"I want a plan on implementing login from id.didi.sh. I want env variables to
> come from the didi workspaces."*

Login is an integration against something already built and running. Config from
the workspace makes didi.sh a **configuration and credential plane**, which it is
not today — and which the canonical spec currently assigns elsewhere.

## What exists today — verified 2026-08-08, not remembered

**id.didi.sh is live.** `GET /.well-known/jwks.json` returns 200;
`GET /api/me` correctly 401s without a session. The repo README's increment
checklist still shows "5 — Deploy" unchecked. **That checklist is stale**, and
planning against it rather than the running service would have been wrong.

| Endpoint | Shape |
|---|---|
| `POST /api/magic-links` | `{ email, app?, next? }` → always 202 (no enumeration); dev echoes `dev_token` |
| `POST /api/magic-links/redeem` | `{ token }` → session row, EdDSA token, `didi_session` cookie |
| `POST /api/session/refresh` · `DELETE /api/session` | rolling 30-day server session; logout |
| `GET /api/me` | `{ didi_id, email, alt_emails, name, handle, avatar_url, memberships: [{org_id, role}], session }` |
| `GET /.well-known/jwks.json` | public keys for local verification |

Tables: `users`, `user_emails`, `organizations`, `firm_profiles`, `memberships`,
`oauth_accounts`, `login_tokens`, `sessions`, `auth_events`, `apps`. **No
`workspaces` table; no config or secret storage of any kind.**

## The correction that settles the model

The first draft offered a choice between keying config on the **organization**
(cheap, honours the current spec) and making **workspaces** first-class. The
operator's answer removes the choice, and it is worth quoting because it is
ground truth rather than preference:

> *"While org emails are a good way to allow new user registrations, I live in a
> world where it's anything but strict. For instance, I created accounts for
> palmer-ai with a human.vc email. I'm supporting many organizations with
> sometimes their email and sometimes not. But I'm often even setting them up as
> an admin."*
>
> *"This happens all the time. Every startup I've been at you end up with service
> providers, advisors, investors, etc."*

This is not an edge case to accommodate — it is the **normal** case. The people
who most need access to a client's workspace are exactly the ones whose email
will never match its domain: fractional operators, advisors, investors, agencies,
and the person administering the whole thing from a different company's address.

`Id-Didi-Sh-Identity-Service.md` line 217 currently says per-service
authorization state (*"augment-it's workspaces … org ↔ workspace"*) lives with
each service, and the org model is **domain-as-id**. Both need amending.

### The corrected model

**The workspace is the tenancy boundary and the secret boundary.** Secrets
attach to a workspace. Membership is a workspace-level grant.

**Membership is explicit and email-domain-independent.** Anyone can be added to
any workspace at any role, whatever address they hold. This is the load-bearing
change: derive membership from an email domain and you have built a system that
structurally cannot express an advisor.

**A domain is a convenience on the workspace, not an identity.** A workspace may
declare a default domain, which means *"someone arriving with an address at this
domain may self-join at role X without an invite."* It is an onboarding
shortcut — a way to avoid hand-inviting forty people at one company — and it is
never consulted when deciding whether an existing member has access.

**Organizations survive, demoted.** They remain useful for grouping and billing,
and a workspace has a parent org. They stop being the access boundary.

This is the shape Slack, Notion and Linear all converged on, for the same reason:
optional domain-based auto-join, plus explicit invitations that ignore it
entirely.

## Two rules from the existing thinking that still bind

[[Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal]] is unambiguous:

> *"secret **values** must not be the thing we distribute. Instead … exposing
> authenticated **capabilities** whose backing credentials never leave the
> server."*

Read literally, "serve env vars from didi" contradicts that. A desktop app given
a durable `R2_SECRET_ACCESS_KEY` puts a permanent credential on every machine
that ever logs in, and revoking means rotating for everyone.

**R2's Temporary Credentials API dissolves the contradiction.** It derives
short-lived credentials from a parent token — scoped to a bucket *and prefix*,
TTL-bounded, with four permission levels — returning an access key, secret, and
session token. So:

- The **parent** R2 token lives on didi.sh and never leaves.
- corpora authenticates with its didi session.
- didi mints credentials **scoped to that workspace's bucket and prefix**, valid
  for minutes.
- corpora uses them until expiry, then asks again.

Configuration arrives from didi, and what is distributed is disposable and
structurally unable to reach another workspace's prefix. Offboarding stays "kill
the membership", never "rotate the bucket key on six laptops".

## secretspec — declared but not installed, so this is a real choice

The operator named it, then corrected the record: *"I flagged it I thought we
were using it but apparently we were just using its formatting and didn't have it
installed."* Confirmed — `secretspec` is not on PATH anywhere in the tree.

So the three `secretspec.toml` files are a **manifest format the team adopted**,
not a running pipeline. Adopting the tool for real is a fresh decision, not a
continuation, and the plan should not smuggle it in as one.

[secretspec](https://secretspec.dev/) is a declarative interface over secret
providers: `secretspec.toml` declares **what** a project needs; a provider
resolves **where** the values come from; `secretspec run -- <cmd>` injects only
the required values into the process. Its own framing —
*"never exposes provider credentials to your app"* — is the capability thesis in
another vocabulary.

Three declarations exist:
`self-host-stack/client-stacks/{lossless,palmer-ai,reach-edu}/secretspec.toml`.
reach-edu's header already anticipates this plan:

> *"Values NEVER live here. Providers: .env files here (gitignored), Railway
> variables, **didi.sh secret store (future)**."*

**The format is already earning its keep** even unused as a tool: it is the only
place in the tree that says, in one file, exactly which secrets a client stack
needs and which are optional. Keep writing it regardless of what follows.

**The architecture does not depend on adopting the tool.** Either way the shape
is the same: didi brokers credentials over HTTP, the Tauri shell fetches them and
injects them into the sidecar's environment at spawn, and **the Python side needs
no changes at all** — `R2_ACCESS_KEY_ID` and friends arrive in `os.environ`
exactly as they do from `.env` today.

What adopting secretspec would add, honestly:

- **For it:** 27 existing backends, so `.env`, the OS keychain, and 1Password all
  work for free; a `Provider` trait as a clean extension point; a standard CLI for
  the non-Tauri cases (`scripts/`, CI, the self-host stacks that motivated the
  format in the first place).
- **Against it:** a Rust binary every operator must install, which cuts against
  W1's one-artifact goal; and most of the value here is the didi provider we
  would write ourselves anyway. A bare `fetch` + env-injection in the shell is
  perhaps forty lines.

**Leaning: skip it for corpora, revisit for the self-host stacks.** corpora has
exactly one secret source once this lands, and one source does not need a
multi-provider abstraction. The stacks — three clients, many secrets, Railway and
`.env` and didi all in play — are where the abstraction would actually pay. That
also means the decision can be made later against a real case, which is the same
discipline applied to workspaces above.

## The phases

### Phase A — amend the canonical spec *(ai-labs, no code)*

Both the credential pathway and the tenancy change are parent-spec-first per
id-didi-sh's standing reminder. `Id-Didi-Sh-Identity-Service.md` gets:

1. **Workspaces as a first-class primitive** — schema, parent org, explicit
   membership with roles, and the demotion of domain to auto-join hint.
2. **Membership is never derived from email domain.** Stated as an invariant,
   with the advisor/investor case as its rationale, so a future reader does not
   "simplify" it back.
3. **The credential-brokering contract** — endpoints, scoping, TTLs, and the rule
   that only derived, expiring credentials are served.
4. **The device-authorization flow** for desktop clients.

**Gate: operator sign-off.** Nothing below starts first.

### Phase B — id.didi.sh *(Elixir/Phoenix)*

1. **`workspaces` + `workspace_memberships`.** Parent org, slug, display name,
   optional `default_domain`, per-member role. Migrating existing `memberships`
   is the delicate part: today's org memberships become memberships of that org's
   default workspace.
2. **Device authorization.** `POST /api/device/code` →
   `{ device_code, user_code, verify_url, interval, expires_in }`;
   `POST /api/device/token { device_code }` → 428 pending, then
   `{ token, expires_at }`; a LiveView page where a signed-in person approves the
   code. This is increment 6's *"Tauri device-exchange flow"* — corpora is its
   first caller, not a new requirement.
3. **Config + secret store, per workspace.** Non-secret settings (bucket, prefix,
   endpoint, display name) as plain rows. Secrets encrypted at rest — per the
   implementation-local exploration's leaning, encrypted columns in the existing
   libSQL store with the KEK in Fly secrets, behind a `SecretStore` behaviour so
   a vault swap is a module rather than a rewrite.
4. **Credential broker.**
   `POST /api/workspaces/:slug/credentials { purpose: "r2" }` → calls R2's
   temporary-credentials API with the parent token, scoped to the workspace's
   bucket and prefix, `object-read-write`, short TTL. Returns
   `{ access_key_id, secret_access_key, session_token, expires_at, bucket, prefix, endpoint }`.
   Never returns the parent token. Every issuance writes an `auth_events` row.
5. **`GET /api/workspaces`** → `[{ slug, name, role, org_id, default_domain }]`
   for the caller — the workspaces they are a member of, by grant, regardless of
   their address.
6. **Invite + auto-join, both paths.** An explicit invite to any address at any
   role; and self-join when an address matches `default_domain`.

### Phase C — the credential client *(Rust)*

A small module in the Tauri shell: read the stored didi token, call
`/api/workspaces/:slug/credentials`, cache until expiry, refresh transparently.
Roughly forty lines plus its error handling.

**If secretspec is adopted instead**, this becomes a `Provider` implementation
with the same body and a different signature — so choosing later costs nothing.
Either way it wants to be its own small crate eventually, since every Lossless
desktop app will need it.

### Phase D — corpora-builder *(Tauri + Python)*

1. **Login in the shell.** Rust opens the system browser to `verify_url` and
   shows `user_code`; polls `/api/device/token`; stores the token in the **OS
   keychain**, never in `.env` or a repo file.
2. **Workspace picker.** `GET /api/workspaces` populates it. This is where the
   corrected model becomes visible: the operator sees reach-edu, palmer-ai and
   lossless in one list, on one login, regardless of which address each was set
   up under.
3. **`DidiWorkspaceResolver`** implementing the existing `WorkspaceResolver`
   interface — the reason that seam exists. `StaticWorkspaceResolver` stays for
   offline and dev; no call site changes.
4. **Secrets injected at sidecar spawn.** The shell resolves via secretspec and
   passes the values in the child's environment. **The Python side is unchanged.**
5. **One real Python change:** `R2Store` must accept `aws_session_token` — temporary
   credentials carry one and the current constructor has no parameter for it.
   Small, but a signature change the conformance suite has to cover.

### Phase E — `.env` becomes the offline fallback

It stops being primary. The importer and verifier scripts stay: they are how
didi's own parent token gets bootstrapped in the first place.

## What this buys, concretely

- **No durable R2 secret on any laptop.** Today `corpora-builder/.env` holds a
  key that can read and write the whole `reach-edu` bucket, forever, with no
  audit trail. After: a minutes-long credential scoped to one prefix.
- **An advisor can be given access to one workspace** at viewer, from their own
  company's address, in one grant — and lose it in one revocation.
- **Offboarding is removing a membership**, not rotating a key and chasing every
  machine that has it.
- **One login across reach-edu, palmer-ai and lossless**, which is the actual
  daily shape of the operator's work.

## Open questions

1. **Migrating existing org memberships** into workspace memberships. There are
   few enough today that a hand-written migration is honest; it will never be
   cheaper than now.
2. **TTL.** R2's documented maximum was not on the page I read; verify against
   the API reference. Leaning 15 minutes with transparent refresh, matching
   Cloudflare's own example.
3. **Which keychain plugin**, and its Linux story.
4. **Offline.** A corpus is worth reading on a plane. Probably: the local mirror
   stays readable and writes queue. A real feature, unscoped here.
5. **Adopt secretspec at all?** Leaning no for corpora, yes-eventually for the
   self-host stacks. Decide against a real multi-provider case, not this one.
6. **Should corpora register in didi's `apps` table?** Free, and magic-links
   already take an `app` slug. Probably yes, deliberately.

## Related

- [[../specs/Id-Didi-Sh-Identity-Service]] — the canonical spec Phase A amends
- [[../explorations/Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal]] — the thesis
- `id-didi-sh/context-v/explorations/Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane.md` — implementation-local notes; flagged the workspace question first
- `id-didi-sh/context-v/explorations/What-Corpora-Builder-Needs-From-didi-sh.md` — the primitives list this fulfils
- `self-host-stack/client-stacks/*/secretspec.toml` — the declarations already in the tree
- `corpora-builder/context-v/specs/Storage-Seam.md` — the `WorkspaceResolver` seam Phase D fills

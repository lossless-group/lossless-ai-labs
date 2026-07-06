---
title: "Unlock: the humain-vc team (two people) logs into a deployed augment-it"
lede: "One concrete user flow, written down so we build exactly what it needs and nothing else: a humain-vc team member signs in with her work email, lands in the humain-vc workspace, and works the thesis corpus — on a hosted URL, with Michael as superuser. Single-tenant deploy on purpose; per-session tenancy, admin UIs, and storage rearchitecture all explicitly deferred."
date_created: 2026-07-06
date_modified: 2026-07-06
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
semantic_version: 0.0.0.1
status: Draft
tags:
  - Plan
  - User-Flow
  - Didi-Platform
  - Identity-Service
  - Augment-It
  - humain-vc
  - Deployment
  - Single-Tenant
  - Corpus-Sync
---

# Unlock: the humain-vc team logs into a deployed augment-it

## Why this document exists

The platform work is converging fast (identity service live, WS-gate verify
proven, badge in the shell), and the temptation is to build the general
thing everywhere — per-session multi-tenancy, org admin UIs, storage
abstraction layers. **This doc pins one flow we actually want unlocked
soon, so every build decision gets tested against "does the flow need
it?"** Anything the flow doesn't need is named in the deferred list, not
built.

## The flow (the whole spec, as a story)

> Linda (humain-vc) opens **augment.didi.sh** in her browser. She's not
> signed in, so the shell shows the sign-in panel. She enters
> **linda@humain.vc**, gets a real email, clicks the link, and lands back
> in augment-it — signed in, in the **humain-vc workspace**, with the
> strategy-curator surface showing the thesis corpus (consumer-immunology
> and whatever else exists). She curates: adds sources, fetches content,
> edits bibliography, tags. Her colleague does the same with his own
> email. **Neither of them can see, switch to, or infer the existence of
> reach-edu.** Michael signs in with any of his three addresses and gets
> the same workspace (superuser powers come later; presence works now).
> Nothing anyone does on the hosted instance is lost, and Michael can
> pull the corpus down locally.

Acceptance is this story working end to end, told by Linda without help.

## The triangulation, honestly assessed (2026-07-06)

Users / orgs / workspaces are three independent objects. Current state of
each leg and each edge:

| Leg / edge | State |
|---|---|
| **Users** (id-didi-sh) | ✓ Real — sessions, magic links, alt emails, EdDSA verify proven against augment-it dev |
| **Orgs** (id-didi-sh) | Table exists, **empty**. No creation path (admin console is spec increment 3) |
| **Memberships** (user↔org) | Table exists, **empty**. No creation path |
| **Workspaces** (augment-it) | ✓ Filesystem dirs under `clients/`; registry + switcher work |
| **Org ↔ workspace edge** | **Does not exist anywhere** |
| **Enforcement** | **None** — the WS gate verifies identity but authorizes nothing (`DIDI_AUTH=optional`); every capability is open; workspace switching is open |
| **Simultaneity** | Active workspace is **process-wide** — two users in different tenants would flip each other. Fine for two users in the SAME tenant; broken for mixed use |
| **Email** | Magic links only work via dev token echo — **no production email sending exists** |
| **Hosting** | augment-it runs on one laptop; id.didi.sh is deployed (Fly) pending DNS |
| **Corpus sync** | `clients/humain-vc/` exists locally only; no local↔remote story |

## The scope cut that makes "soon" possible: single-tenant deploy

The deployed augment-it instance is **pinned to humain-vc**
(`ACTIVE_CLIENT_ID=humain-vc`, switching disabled on the instance). This
one decision deletes the three biggest work items the flow does not need:

- **No per-session tenancy rearchitecture.** Everyone on the instance is in
  the same tenant, so the process-wide active is *correct*, not a bug.
  (This is Per-Client-Privacy's Path B — per-client deployment — chosen as
  the v0 posture; the multi-tenant Path C instance is a later move, and
  Michael's own multi-workspace work stays local where it already works.)
- **No workspace-authorization matrix.** The only check the instance needs:
  *does this didi_id belong to the humain.vc org (or hold superuser)?* One
  membership lookup at the gate, not a per-capability ACL.
- **No reach-edu isolation engineering.** reach-edu's data simply isn't on
  the instance's volume. Isolation by absence — the strongest kind.

## The build list (ordered; each item exists only because the flow needs it)

1. **Real email for magic links** (id-didi-sh). Pick Resend or Postmark,
   wire the Swoosh adapter, set the API key as a Fly secret, verify a real
   magic-link email round-trip. *The flow's only unavoidable new
   integration.*
2. **Seed the org + memberships** (id-didi-sh, interim path). `mix` task or
   `fly ssh console` eval: org `humain.vc` (domain-as-id), memberships for
   Linda + colleague (`editor`) and Michael (`superuser`). The admin
   console (increment 3) replaces this; the flow doesn't wait for it.
   `/api/me` already returns memberships.
3. **The membership gate** (augment-it workspace-service). Extend the didi
   adapter: on WS upgrade (with `DIDI_AUTH=required` on the instance),
   fetch `/api/me`, admit only didi_ids holding a membership in the
   instance's org (env: `REQUIRED_ORG_ID=humain.vc`) or `superuser`.
   Cache per session. ~30 lines on top of what shipped today.
4. **Deploy augment-it single-tenant** (the Fly pattern just proven on
   id-didi-sh): compose services as Fly apps or one machine running
   compose; volume for `/clients/humain-vc` + JSON stores; SurrealDB is
   already cloud; DNS `augment.didi.sh`; `.didi.sh` cookie works
   immediately because id.didi.sh is already live. Details belong to the
   deploy plan, not this doc — but the flow needs only ONE instance, one
   region, no HA.
5. **Corpus sync, option A** (the convergence doc's Thread 4, minimal
   flavor): the instance's volume is authoritative for humain-vc while the
   team works; **rclone syncs volume ↔ R2 ↔ Michael's laptop** on a
   schedule + on demand. Named trade: single-writer discipline (the team
   writes via the app; Michael's local edits push through R2 deliberately,
   not concurrently). R2-native storage (option B) stays the named
   evolution; the curator spec's thin storage interface is the seam.
6. **Instance posture flags**: `DIDI_AUTH=required`, switcher hidden when
   the instance is pinned, sign-in panel as the pre-auth wall (today the
   shell renders regardless — one conditional).

## Deliberately NOT built for this flow

- Per-session / per-connection active workspace (multi-tenant instance)
- Org/membership admin UI (increment 3's LiveView console does it right)
- Workspace-level ACLs beyond the one org gate
- Invites UI — seeded memberships + magic links suffice for two people
- The didi agent, BYOK, anything chat-adjacent
- R2-native corpus reads, JuiceFS, Litestream for augment-it's stores
  (Fly volume snapshots are the interim recovery story, same as id)
- Deployment of memos / decks — different flows, different docs

## Decisions needed before building (small, name them now)

1. **Email provider** — Resend vs Postmark (Swoosh supports both; pick on
   deliverability + price; didi.sh needs its DNS sender records either way).
2. **Sender identity** — `no-reply@didi.sh` (platform) vs a humain-vc-branded
   sender. Platform sender is the v0 lean.
3. **Instance URL** — `augment.didi.sh` (the platform subdomain, cookie
   works) — or a humain-specific alias later. Lean: `augment.didi.sh`.
4. **The two humain-vc emails** — confirm Linda's and the colleague's
   actual addresses before seeding.

## Related

- [[../specs/Id-Didi-Sh-Identity-Service|Id-Didi-Sh-Identity-Service]] — increments 2 (gate) and 3 (the admin console that retires the seeding interim)
- [[../explorations/Didi-sh-One-Login-One-Agent-Three-Services|Didi-sh-One-Login-One-Agent-Three-Services]] — the platform frame; the trust boundary this instance joins
- [[../explorations/Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge|Two-Clients-One-Flow]] — Threads 3 (deploy) and 4 (corpus substrate) that this flow forces in miniature
- [[../../augment-it/context-v/explorations/Per-Client-Privacy-and-the-Path-Off-Local|Per-Client-Privacy-and-the-Path-Off-Local]] — Path B (single-tenant per client) chosen as this flow's posture
- [[../../augment-it/context-v/specs/Workspaces-as-Tenant-Primitive|Workspaces-as-Tenant-Primitive]] — the tenant model; per-session active is its named later move

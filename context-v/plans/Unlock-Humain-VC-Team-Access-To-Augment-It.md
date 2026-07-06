---
title: "Unlock: the humain-vc team (two people) logs into a deployed augment-it"
lede: "One concrete user flow, written down so we build exactly what it needs and nothing else: a humain-vc team member signs in with her work email, lands in the humain-vc workspace, and works the thesis corpus — on a hosted URL, with Michael as superuser. Single-tenant deploy on purpose; per-session tenancy, admin UIs, and storage rearchitecture all explicitly deferred."
date_created: 2026-07-06
date_modified: 2026-07-06
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
semantic_version: 0.0.1.0
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

## Flows

### Flow 1 — side-by-side thesis corpus building (Michael + Aniel)

The concrete session this plan exists to unlock. **Michael** (sysadmin /
superuser) and **Aniel** (client — Humain VC founder) are sitting next to
each other, each on their own laptop, both signed into the hosted
instance:

1. **Sign in.** Aniel opens **augment.didi.sh**, enters **his humain.vc
   email**, clicks the real magic-link email, lands in the humain-vc
   workspace. Michael signs in with any of his three addresses. Neither
   can see, switch to, or infer the existence of reach-edu.
2. **Create theses.** Both can generate **`domain:type{thesis}`** entries —
   the curator speaks "Thesis" on this instance, not "Strategy" (the
   domain-type vocabulary item from the convergence doc, now
   flow-critical in its minimal form: a per-instance/workspace default
   type; the full type-picker can follow).
3. **Build the corpus per thesis.** Both enter links (`source.add` →
   metadata-first, fetch on demand) and **upload files** (`source.attach`
   — already built: base64 over WS, Ghostscript compression) against
   whichever thesis they're working.
4. **The UI is live for both.** Aniel adds a link → **Michael's screen
   updates without a refresh**, and vice versa. (This is multi-USER
   liveness within ONE tenant — the single-tenant posture makes it
   cheap: the WS layer already broadcasts NATS events to every connected
   session; the curator's domain/source mutations need to emit events and
   the curator surface needs to react to them.)
5. **DiDi assists.** The chat rail — named **didi** — helps curate the
   inbox (triage captured sources into theses) and talks them through
   glitches. It carries the necessary agent-skills and can invoke the
   curator's capabilities as verbs.
6. **The other microfrontends stay reachable, untouched.** No extra work
   to make them shine, no work to isolate them either — they're wanted
   soon, so nothing in this flow may make them harder.

Acceptance: this session happening for real, Aniel driving his own laptop
without help.

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
   `fly ssh console` eval: org `humain.vc` (domain-as-id), membership for
   Aniel (`editor` — or `org_owner`, he's the founder) and Michael
   (`superuser`). The admin console (increment 3) replaces this; the flow
   doesn't wait for it. `/api/me` already returns memberships.
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
7. **Thesis vocabulary, minimal form** (augment-it curator). A
   per-workspace/instance default domain type (`thesis` for humain-vc) +
   the copy rendering that noun. The backend is already generic
   (`DOMAIN_FOLDERS` knows `theses`); the UI constant is the gap. The
   full type-picker stays in the curator spec's queue — the flow needs
   only the default. Includes the `domain.retype` of the mis-filed
   `consumer-immunology`.
8. **Curator liveness** (augment-it). Emit NATS events from the
   domain/source capability handlers (`domain.created`, `source.added`,
   `source.updated`, `source.removed`, …), add them to the WS broadcast
   list, and make the curator surface react — both users are in the same
   tenant, so broadcast-to-all-sessions IS the multi-user model here. No
   presence, no cursors, no CRDTs: event → refetch is enough for two
   people.
9. **didi chat v0** (augment-it). The existing chat rail, given the didi
   name and pointed at this flow: able to invoke the curator's
   capabilities as verbs (inbox triage into theses, source fixes) and
   loaded with the necessary agent-skills (the `context-v/agent-skills/`
   pattern — an inbox-curation skill alongside the decile precedent).
   This is the didi persona's first mount, deliberately scoped to what
   the flow needs — not the cross-service agent, not BYOK.

## Deliberately NOT built for this flow

- Per-session / per-connection active workspace (multi-tenant instance)
- Org/membership admin UI (increment 3's LiveView console does it right)
- Workspace-level ACLs beyond the one org gate
- Invites UI — seeded memberships + magic links suffice for two people
- The cross-service didi agent, BYOK, shared agent runtime — didi v0
  above is this instance's chat rail with skills, nothing didi-wide
- Presence indicators, cursors, CRDTs — event-driven refetch is the
  liveness model for two people in one tenant
- The full domain-type picker UI — the per-instance default noun is the
  flow's whole need
- R2-native corpus reads, JuiceFS, Litestream for augment-it's stores
  (Fly volume snapshots are the interim recovery story, same as id)
- Deployment of memos / decks — different flows, different docs
- Making the other microfrontends flow-ready OR isolating them — they
  stay mounted as-is; the only rule is this flow must not break them

## Decisions needed before building (small, name them now)

1. **Email provider** — Resend vs Postmark (Swoosh supports both; pick on
   deliverability + price; didi.sh needs its DNS sender records either way).
2. **Sender identity** — `no-reply@didi.sh` (platform) vs a humain-vc-branded
   sender. Platform sender is the v0 lean.
3. **Instance URL** — `augment.didi.sh` (the platform subdomain, cookie
   works) — or a humain-specific alias later. Lean: `augment.didi.sh`.
4. **Aniel's actual address** (and any second humain-vc seat) — confirm
   before seeding memberships.
5. **didi's skill list for this flow** — which agent-skills the chat
   carries on the instance (inbox curation is named; what else earns a
   slot?).

## Related

- [[../specs/Id-Didi-Sh-Identity-Service|Id-Didi-Sh-Identity-Service]] — increments 2 (gate) and 3 (the admin console that retires the seeding interim)
- [[../explorations/Didi-sh-One-Login-One-Agent-Three-Services|Didi-sh-One-Login-One-Agent-Three-Services]] — the platform frame; the trust boundary this instance joins
- [[../explorations/Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge|Two-Clients-One-Flow]] — Threads 3 (deploy) and 4 (corpus substrate) that this flow forces in miniature
- [[../../augment-it/context-v/explorations/Per-Client-Privacy-and-the-Path-Off-Local|Per-Client-Privacy-and-the-Path-Off-Local]] — Path B (single-tenant per client) chosen as this flow's posture
- [[../../augment-it/context-v/specs/Workspaces-as-Tenant-Primitive|Workspaces-as-Tenant-Primitive]] — the tenant model; per-session active is its named later move

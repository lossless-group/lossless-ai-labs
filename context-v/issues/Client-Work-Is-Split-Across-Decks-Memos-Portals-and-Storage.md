---
title: "Client work is split across decks, memos, portals, and storage, and each new client deepens the split"
lede: "One client's confidential work can now live in four places: a dididecks client-site repo, a memopop io/<firm> repo, a client-portal config, and a Railway bucket. These will need to converge. For now the job is to stop each new client from making that harder."
date_created: 2026-10-18
date_modified: 2026-10-18
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
semantic_version: 0.0.0.1
origin_instance: "ai-labs/dididecks-ai/client-sites/lfg-hub (scaffolded 2026-10-18, the eighth standalone client-site)"
tags:
  - Issue
  - AI-Labs
  - Client-Work
  - Dididecks-AI
  - Memopop-AI
  - Client-Portal
  - Railway
  - Auth
  - Cross-App-Pattern
status: Open · Jotted
site_uuid: edc60195-020f-4212-a819-5bc71444ca4f
hex_code: 86guiw
date_authored_initial_draft: 2026-10-18
date_authored_current_draft: 2026-10-18
publish: false
---

# Client work is split across decks, memos, portals, and storage

## What triggered this

We scaffolded `dididecks-ai/client-sites/lfg-hub` for Link Freedom Group
(lfg.link) on 2026-10-18 by copying reach-edu-hub. It works, but it is the
eighth standalone client repo in dididecks alone. It also reopened a question
we keep putting off: where does *all* of one client's work live?

We are **not** converging anything yet. This issue names the three
convergences and the rules that keep them cheap to do later.

## The three convergences

### 1. Decks and memos keep separate private client repos

| | dididecks-ai | memopop-ai |
|---|---|---|
| Unit | One whole Astro site per client: `client-sites/<slug>/` | One data repo per firm: `apps/memopop-orchestrator/io/<firm>/` |
| Count today | 8 (calmstorm, reach-edu-hub, chroma, humain-vc, lossless, eventcut-ai, the-water-foundation, lfg-hub) | 11 (alpha-partners, hypernova, avalanche, emerge, dark-matter, two-magnolias, humain, motley-fool, alpha-jwc, lossless, twf-memobox-secure) |
| What's in it | Code **and** content: chassis, theme, gate, decks | Content only: `configs/`, `templates/`, `deals/<deal>/`, `versions.json` |
| Storage decision | None recorded | `memopop-ai/context-v/decisions/One-Workspace-Per-Firm-With-a-Private-Bucket.md` plus the jj-versions decision |

Clients already appear on both sides: humain, lossless, and the-water-foundation.
They are spelled differently on each side (`humain-vc-decks` vs `io/humain`,
`the-water-foundation` vs `twf-memobox-secure`). Nothing records that these name
the same client.

The deeper asymmetry is that a dididecks client repo mixes **code with
confidential content**. A memopop firm repo holds content only. The memopop
shape is the one that converges cleanly.

### 2. Client-sites and the client portal are two answers to one question

- **Client-sites** each deploy to their own Vercel project with their own gate.
  There are at least three gate implementations: reach/lfg's passcode-or-@domain
  cookie, calmstorm's astro:db Identity/Session/MintedToken, and eventcut's
  drizzle `auth.db`.
- **`clients.lossless.group`** (`astro-knots/sites/client-portals-site`) is the
  portal split out of `lossless-site`. It reads private content from
  `lossless-client-content` through live content collections. Its gate is per-portal
  `unlisted` or `passcode` HMAC cookies. The middleware was copied from calmstorm.
  Its routing table already lists `memo` and `deck` as two content kinds in one
  portal. That is the only place decks and memos meet today.
- **`lossless.at`** (`self-host-stack/hubs/lossless-at`, Railway) is a third,
  path-based, multi-tenant homebase. `self-host-stack/context-v/issues/Which-Domain-Hosts-What-lossless-at-vs-didi-sh.md`
  already says client apps ended up across domains by accident.
- **`id.didi.sh`** is the identity service meant to sit under all of it.
  memopop has already decided to sign in through it.

### 3. Deck content doesn't need a rebuild, but our decks still need one

Client files now sync and back up through Railway (volumes plus a private
bucket per firm, per memopop's decision). Decks, though, are Astro components,
so adding or changing a slide means a commit and a Vercel rebuild for each
client.

Much of that churn is content (copy, numbers, a new slot in a variant), not
layout. It could load at request time the way client-portals-site already does:
live content collections plus a webhook cache purge
(`client-portals-site/context-v/explorations/Refresh-Portal-Content-on-Push-Without-Rebuilds.md`,
Signed-Off). The precedent exists. The deck shell just doesn't use it yet.

The limit is that Play-UI slides are static 16:9 components by design. Anything
dynamic has to be **slide content as data rendered by stable slide components**.
It can't mean hot-loading arbitrary `.astro`. That is the same fork as
`dididecks-ai/context-v/explorations/Bridging-PLG-Self-Serve-with-Previous-Approach.md`
(spec rows compile to components).

## Why not converge now

- Each convergence has a different owner surface (dididecks shell, memopop
  orchestrator, astro-knots portal, self-host-stack) and runs under parallel
  agent sessions. A big-bang merge breaks live engagements.
- Moving repos triggers the relocation HARD STOP every time (branches, remotes,
  secrets). Eight plus eleven repos is a lot of exposure.
- The portal and `id.didi.sh` are still settling. Converging onto a moving
  target means converging twice.

## Holding pattern: rules that keep the later merge cheap

Proposed, not adopted. Each rule is meant to be cheap now and to save real work later.

1. **One client key, everywhere.** Use the domain-as-id convention already
   adopted for `Organization.id` (`lfg.link`, `trychroma.com`) as the client's
   key across decks, memos, portal config, bucket names, and didi.sh orgs. Add
   one small **client manifest** (one file per client, or one table) mapping the
   key to every repo, deploy, bucket, and portal entry that holds that client's
   work. This is the single cheapest move, and it makes the eventual merge a
   lookup rather than an archaeology dig.
2. **New client repos are named `<client>-hub`, not `<client>-decks`.** This
   says the repo holds client work of any kind. lfg-hub is the first under this
   rule (reach-edu-hub was the accidental precedent).
3. **Keep confidential content in folders that could be lifted out.** In new
   hubs, keep client content under a few top-level content paths
   (`src/content/`, `context-v/narratives/`, `data/`), separate from chassis
   code. Then a later split into "shared chassis + per-client content repo"
   (the memopop shape) is a folder move, not a refactor.
4. **No new gate implementations.** New hubs copy the reach/lfg passcode gate
   as-is, with the `<PREFIX>_GATE_PASSCODE` / `<PREFIX>_ALLOWED_EMAIL_DOMAIN`
   naming, until the portal or `id.didi.sh` gate is chosen as the one gate.
5. **Record which client lives where when it changes.** When a client gains a
   memo workspace, a portal, or a bucket, update the manifest in the same
   session.

## Open questions

- [ ] Does the merged home for one client's work look like **memopop's shape**
  (content-only repo per client, chassis elsewhere) or **dididecks' shape**
  (one site per client)? Our lean is memopop's shape, because it lets one
  portal or shell render decks and memos from the same content repo.
- [ ] Which surface is the eventual front door: `clients.lossless.group`, a
  per-client `*.didi.sh` hub, or `lossless.at/<client>`? The domain issue in
  self-host-stack should be decided first.
- [ ] Where does the client manifest live: ai-labs `context-v/`, the anchor
  root, or `self-host-stack` (which already has `client-stacks/<client>/stack.md`,
  close to a manifest already)?
- [ ] Is "slides as live content" a shell feature (a live loader in
  `@dididecks/shell`) or a portal feature (the portal renders deck content
  kinds)? Settle this alongside the Bridging-PLG fork, not separately.
- [ ] Write an exploration that walks one real client (humain or TWF, which
  already span decks, memos, and stacks) through each candidate end state.

## Related

- `dididecks-ai/context-v/explorations/Structural-Frontend-for-Single-Tenant-Client-Sites.md`: every client re-clones auth, routes, styles, and a landing page.
- `dididecks-ai/context-v/specs/Cloud-Workspace-for-Dididecks.md`: stub with a storage-adapter idea that doesn't yet cite memopop's bucket decision.
- `memopop-ai/context-v/decisions/One-Workspace-Per-Firm-With-a-Private-Bucket.md`
- `astro-knots/context-v/plans/Build-a-Client-Portals-Site.md`
- `astro-knots/context-v/blueprints/Maintain-Privacy-Gates-in-Three-Modes.md`
- `site/context-v/issues/Client-Content-Privacy-and-Decomposition-Deferred.md`
- `self-host-stack/context-v/issues/Which-Domain-Hosts-What-lossless-at-vs-didi-sh.md`

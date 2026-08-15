---
title: "What Corpora-Builder Needs From didi.sh — the primitives list, handed over early"
lede: "corpora-builder wants its workspace identity to come from didi.sh rather than a config constant. Increment 1 already supplies most of it — org, roles, didi_id — but two things are missing and one of them is structural: workspaces are not a thing here yet, and a CLI has nowhere to put a browser cookie. This enumerates exactly what the fourth consumer needs, so it can be specced alongside rather than discovered at integration time."
date_created: 2026-08-08
date_modified: 2026-08-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Open
tags:
  - Exploration
  - Id-Didi-Sh
  - Corpora-Builder
  - Identity
  - Workspaces
  - Consumer-Requirements
from: "id-didi-sh"
from_path: "context-v/explorations/What-Corpora-Builder-Needs-From-didi-sh.md"
---
# What Corpora-Builder Needs From didi.sh

## Why Care?

[[Corpora-Builder-System-Design]]'s wishlist item **W7** said this out loud when
the project was still an exploration:

> *"Workspaces, API keys, and related primitives **may need to be built into
> didi.sh in parallel** before corpora-builder can work properly. That makes
> id-didi-sh a build-order dependency, not just an integration: the
> corpora-builder spec should enumerate exactly which identity primitives it
> needs ... so the didi.sh side can be specced concurrently."*

This is that enumeration, written at the moment corpora-builder started building
rather than at the moment it tried to integrate. The operator's ask was direct:
*"integrate with id-didi-sh so that the workspace details are pulled from the
didi.sh account and workspace."*

Most of that is already shipped. Two pieces are not, and naming them now is
cheaper than discovering them at Phase 7.

## What corpora-builder needs, and what exists

| # | Need | Status in didi.sh today |
|---|---|---|
| P1 | A stable person id | ✅ **`didi_id`** (UUIDv7), minted only here |
| P2 | An org the person belongs to | ✅ **domain-as-id** (`lossless.group`, `trychroma.com`, …) |
| P3 | Editor vs viewer distinction | ✅ five org-wide roles incl. `editor` / `viewer` |
| P4 | Local verification without a network hop per request | ✅ EdDSA token + `/.well-known/jwks.json` |
| P5 | **A workspace claim distinct from org** | ❌ **does not exist** |
| P6 | **A non-browser credential** (CLI / headless / RAG consumer) | ❌ **does not exist** |

P1–P4 shipped in increment 1 (2026-07-06) and are exactly what corpora-builder
wants. The two gaps are below.

## Gap 1 — workspaces are not a thing here (P5)

`GET /api/me` returns **org + role claims**. corpora-builder's storage design
keys everything on a **workspace**: one R2 bucket per workspace
(`corpora-<workspace-slug>`), with R2's bucket-scoped API tokens as the
*structural* isolation boundary rather than a policy one.

Today those two collapse: workspace == org == email domain. That is workable and
is what corpora-builder will assume. It stops being workable when either:

- **one org needs several isolated corpora** — very likely, since a VC firm with
  two funds, or an agency with two clients, wants them in separate buckets under
  one login; or
- **a person belongs to a workspace their email domain does not imply** — an
  external analyst invited into one client's corpus and nothing else.

Both are the same request: **membership at a grain finer than the org**.

This question is already open on the didi.sh side, from a different direction —
[[Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane]] asks *"whether
**workspaces** (shared idea across didi.sh / augment-it / memopop-ai, flexible
and possibly nested) become the first-class unit a key attaches to"*, and flags
it parent-spec-first. Corpora-builder is a second consumer wanting the same
primitive for a different reason, which is usually the signal that it is real.

**What corpora-builder would consume, if it existed:** a `workspaces` array on
`/api/me`, each entry carrying a slug, a display name, the caller's role in it,
and its parent org. Nothing more. corpora-builder does not need to *create* or
*administer* workspaces through this API — the operator can do that in a didi
console. It needs to *read* which ones the caller may touch.

**Not blocking.** corpora-builder ships a `WorkspaceResolver` seam whose first
implementation reads static config, exactly as `CorpusStore`'s first
implementation is a local filesystem. When a workspace claim lands, a second
implementation reads it and nothing above the seam changes.

## Gap 2 — a CLI has nowhere to put a cookie (P6)

The didi.sh contract is a `didi_session` cookie: `Domain=.didi.sh`, `HttpOnly`,
`Secure`, `SameSite=Lax`, ~12h, obtained by clicking a magic link in a browser.
That is right for a web app and for a Tauri webview. It does not work for:

- **corpora-builder's CLI** (phases 1–6) — no browser, no cookie jar. Pasting a
  12-hour token into a config file is not a workflow.
- **RAG consumers** — W7's original ask was *"per-workspace API keys for RAG
  consumers"*: a long-lived credential a retrieval pipeline can hold, scoped to
  one workspace, revocable without touching a person's login.

Two candidate shapes, not decided here:

1. **Device-code flow** — the CLI prints a code, the operator approves it in a
   browser, the CLI receives a longer-lived refresh credential. Already
   anticipated: increment 6 names *"the Tauri device-exchange flow."* Extending
   it to a bare CLI is a small delta.
2. **Workspace-scoped API keys** — issued from a console, bearer-presented, no
   person attached. Better for RAG consumers, and the shape the secrets
   exploration is already circling.

They are not alternatives; corpora-builder eventually wants both (a human at a
terminal, and an unattended pipeline). The device flow is the one that unblocks
sooner.

**Timing note:** this is genuinely not urgent. corpora-builder's phases 1–6 are
single-operator on one machine, and Phase 7 is when a real identity is first
needed — which is also when the Tauri webview makes the existing cookie flow
work unmodified. The CLI credential only becomes load-bearing when a second
person or an unattended consumer appears.

## Sequencing — what would actually help, in order

1. **Nothing, for now.** corpora-builder is not blocked. The seam absorbs the
   wait.
2. **Resolve the workspace-vs-org question in the parent spec**
   ([[Id-Didi-Sh-Identity-Service]]), since two consumers now want it and the
   answer shapes both. Cheapest useful move.
3. **Add `workspaces[]` to `/api/me`** once that resolves — corpora-builder
   consumes it the day it exists.
4. **Device-code flow** (extending increment 6's Tauri exchange), when a CLI or
   a second operator needs it.
5. **Workspace-scoped API keys**, when a RAG consumer needs one.

## The consumer ordering this implies

The README's increment 6 lists *"consumers two and three: decks middleware,
memos web, the Tauri device-exchange flow."* corpora-builder is a **fourth
consumer**, arriving later than all of them, and it wants the same device
exchange the Tauri item already names. That is convenient: corpora-builder does
not add a new requirement to increment 6 so much as give it a second customer.

## Related

- [[Id-Didi-Sh-Identity-Service]] — the canonical spec (in `ai-labs/context-v/specs/`)
- [[Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane]] — where the workspace question is already open
- `corpora-builder/context-v/plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History.md` — the plan whose Phase 7 consumes this
- `corpora-builder/context-v/explorations/Corpora-Builder-System-Design.md` — W7, the original ask

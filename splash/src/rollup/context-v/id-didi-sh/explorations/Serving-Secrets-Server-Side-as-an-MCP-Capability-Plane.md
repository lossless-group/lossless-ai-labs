---
title: "Serving Secrets Server-Side as an MCP Capability Plane"
lede: "Implementation-local notes on the most likely new job for this service: a remote MCP endpoint that holds credentials server-side and hands collaborators capabilities instead of secrets. The canonical exploration and any contract changes live in the ai-labs parent — this doc only carries what is specific to building it here."
date_created: 2026-07-24
date_modified: 2026-07-24
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
semantic_version: 0.0.0.4
status: Open
tags:
  - Exploration
  - Id-Didi-Sh
  - Secrets-Management
  - MCP
  - Capability-Plane
  - Elixir
  - Implementation-Local
from: "id-didi-sh"
from_path: "context-v/explorations/Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane.md"
---
# Serving Secrets Server-Side as an MCP Capability Plane

## Where the canon lives

Per this repo's standing reminder ([[../reminders/Canonical-Spec-Lives-in-Ai-Labs]]): the problem framing, option space, and every contract-level decision live in the parent —
`ai-labs/context-v/explorations/Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal.md`, flowing into
`ai-labs/context-v/specs/Id-Didi-Sh-Identity-Service.md` when decisions harden. **New credential pathways are explicitly named there as parent-spec-first.** This doc holds only what an implementer inside this repo needs: what already exists to build on, the Elixir-specific unknowns, and an increments sketch.

## The one-paragraph version of the parent doc

Smart, non-technical collaborators across memos/decks/augment-it (and self-host-stack clients) will never open a terminal, so secret *values* must not be the thing we distribute. Instead: a remote MCP server speaking streamable HTTP, added to Claude Desktop and GPT Desktop as a connector (click link → browser sign-in), exposing authenticated **capabilities** whose backing credentials never leave the server. Identity, sessions, orgs, and roles for that plane are this service's existing job — which is why implementation likely lands here or on a sibling that authenticates against us.

## What this repo already brings

| Existing piece | What the capability plane gets from it |
|---|---|
| `didi_id` (UUIDv7) + 30-day server-side sessions | Per-person grant identity and the revocation authority — offboarding a collaborator is killing a session/role, never rotating a backing key |
| Short-lived EdDSA tokens + `/.well-known/jwks.json` | Local verification pattern any sibling MCP service could reuse without a per-request network call to us |
| Domain-as-id orgs, five roles | The scoping lattice for "which capabilities does this person see" |
| Invite-only, headless-first onboarding | The exact motion extends: the inviting app hands the collaborator a connector URL alongside the account invite |
| Phoenix on Fly, libSQL + Litestream | A running deploy target and a durable store the first increment can lean on before any external vault exists |

## Implementation-local open questions

1. **Elixir MCP ecosystem survey.** Streamable-HTTP MCP server support in Elixir needs a real look before committing — candidate libraries exist (the `hermes_mcp` package has been the visible one; naming collision with the unrelated Hermes *Agent* in self-host-stack, beware when searching) but maturity vs. the TypeScript/Python SDKs is unverified. Fallback if the ecosystem disappoints: the plane becomes a sibling service in TS/Python that verifies didi tokens via JWKS — which would also happen to settle the one-service-or-two fork by default. Survey first; this is the biggest Elixir-specific risk.
2. **OAuth 2.1 surface.** MCP authorization wants OAuth-server semantics (authorization + token endpoints, dynamic client registration in some clients). Growing this inside Phoenix is tractable but is a *contract* addition → parent spec first. The cheaper interim: token exchange from an existing `didi_session` to an MCP access token, if the desktop clients' actual behavior permits it — which the parent doc's spike #1 (Claude + GPT Desktop connector auth against a stub) must answer before any code here.
3. **Secrets at rest, increment one.** Encrypted-at-rest columns in the existing libSQL store (per-org envelope keys, Fly secrets holding the KEK) vs. standing up OpenBao/Phase on day one. Leaning: local encrypted storage first — the vault bake-off is deferred in the parent doc, and Litestream already gives us the recovery story. The storage interface should still be a behaviour (`SecretStore`) so the vault swap is a module, not a rewrite.
4. **Blast-radius posture if colocated.** If the plane lands inside this service rather than a sibling: separate Phoenix endpoint/pipeline, capability handlers with no direct Ecto access to identity tables (context-module boundary, enforced in review), and rate/scope limits so an MCP bug can't become an identity-store incident. If that discipline feels like it's fighting the codebase, that's evidence for the sibling-service fork — surface it, don't push through.
5. **Capability registration shape.** Where does "query the augment-it corpus" get defined — config in this repo, or registered by the consuming service over an API? The latter smells right (services own their capabilities; we own auth + secret custody) but it's a new contract → parent spec first.
6. **Admin dashboards land here.** The parent doc flags (deliberately without design) that the plane needs account-management dashboards: key entry with labeled fields, masked visibility, personal→org ownership moves, grant management — for clients on *our* keys and non-clients bringing *their own*. This repo is the natural home — id-didi-sh was created for exactly this kind of thing, and Phoenix LiveView is the obvious build surface for didi-authenticated admin UI. Two contract questions ride along, both parent-spec-first: whether **workspaces** (shared idea across didi.sh / augment-it / memopop-ai, flexible and possibly nested) become the first-class unit a key attaches to, and what custody we owe a non-client's pasted key (encryption posture, export/delete, spend liability).

## Increments sketch (pending parent-spec sign-off)

0. **Stub spike (no secrets):** minimal streamable-HTTP MCP server behind `mcp.didi.sh` or a path on the existing deploy; verify add-connector + auth flow end-to-end across the full client matrix — **Claude Desktop, GPT Desktop, Claude mobile, ChatGPT mobile** (2 vendors × 2 form factors; every real collaborator uses the mobile apps too, per the parent doc's ground-truth section). Kills or confirms the whole approach before real work.
1. **One capability, one collaborator:** a single read-only tool backed by one server-side credential (e.g. a Firecrawl or Decile read), granted via existing org/role, exercised by a named non-terminal collaborator. The parent doc's acceptance test.
2. **Scoping + revocation proven:** second collaborator, different role, different capability set; offboard one and verify access dies with the session.
3. **The `setup` skill, both slices:** the parent doc names `setup` as the first entry in the plane's catalog — the agent-followable onboarding procedure the collaborator's own Claude/GPT Desktop executes. Pre-connector slice published at a stable, publicly fetchable markdown URL (the `site/` or `splash/` surface here is the natural host); post-connector slice served over MCP as resources/prompts. Verifying what each desktop client actually renders of resources/prompts (parent doc open question #1's second half) happens on this increment, using `setup` itself as the test material.
4. **Resources/prompts tier, generalized:** serve a context-v file and further agent-skills over MCP, following whatever rendering reality increment 3 established.
5. **Admin dashboard, first slice:** a LiveView page behind didi login where an org admin can enter/replace one BYO key (masked after entry) and see which capabilities consume it. Gated on the workspace/custody contract questions resolving in the parent spec.

## Related

- [[../reminders/Canonical-Spec-Lives-in-Ai-Labs]] — the discipline this doc obeys
- `ai-labs/context-v/explorations/Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal.md` — the canonical exploration
- `ai-labs/context-v/specs/Id-Didi-Sh-Identity-Service.md` — where contract changes land first
- `self-host-stack/context-v/explorations/Per-Client-Self-Host-Stacks-Twenty-First-on-Railway.md` — the client-tier tenant of the same plane

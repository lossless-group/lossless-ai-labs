---
title: "In-App Chat Surface for MemoPop Native — A Plan"
lede: "Stand up a context-aware chat co-pilot inside the MemoPop Native Tauri app: a Svelte drawer that reads FlowState to anticipate the next verbs, a sidecar-side /chat/turn endpoint that assembles the four-slab prompt and routes a turn to answer / propose / invoke, and a capability layer that — at first — wraps the operations the app already has (memo runs, deal/firm creation, artifact open, roster crawl) before reaching for net-new source-curation verbs. Built on the existing two-method transport, the LLM-gateway invariant (sidecar holds the key), and the FlowState reactivity discipline — so chat is a new surface, not a new runtime. Plan only; no implementation here."
date_authored_initial_draft: 2026-06-27
date_last_updated: 2026-06-27
date_created: 2026-06-27
date_modified: 2026-06-27
at_semantic_version: 0.0.0.1
status: Draft
category: Plan
augmented_with: Claude Code on Claude Opus 4.8 (1M context)
authors:
  - Michael Staton
tags:
  - Plan
  - In-App-Chat
  - Agent-Surface
  - MemoPop-Native
  - Tauri
  - Svelte-5
  - Capability-Registry
  - Four-Slab-Prompt
  - Agent-Skills
  - Source-Curation-Gate
  - Verb-Surface
related_skills:
  - context-vigilance
  - pseudomonorepos
from: "memopop-ai"
from_path: "context-v/plans/In-App-Chat-Surface-for-Memopop-Native.md"
---
# In-App Chat Surface for MemoPop Native — A Plan

> Implements the [[Chat-As-Verb-Surface-Patterns]] (ai-labs) conventions for MemoPop, the way [[In-App-Chat-v0-0-1-for-Augment-It|augment-it implemented them first]]. This is memopop's turn — and the surface where the [[Source-Curation-Gate]] discipline eventually gets delivered as an agent-skill in Slab 3. **Plan only. Do not implement from this document; each phase forks a build session.**

## Goal

A chat co-pilot that renders inside the MemoPop Native Tauri webview, lets the analyst state intent in prose, and resolves it to the app's capabilities — answering, proposing, or invoking, with the proposal/invoke gate keeping it honest. It is **context-aware** (reads `FlowState` to know which screen the user is on) and **narrates** long-running work by reusing the existing SSE job stream.

Non-goals for v0.0.1: BYOK key entry, a hosted/web variant, net-new source-curation verbs (those are [[Source-Curation-Gate]] work, sequenced after the surface exists), multi-turn agentic planning loops.

## The architecture it must respect (read before designing)

These are load-bearing invariants of memopop-native; the chat conforms to them rather than bending them.

1. **The two-method transport seam.** `src/lib/transport/types.ts` defines `Transport.request()` (POST/GET through the Rust `api_dispatch` command → FastAPI sidecar at `127.0.0.1:8765`) and `Transport.subscribeEvents(jobId, onEvent)` (SSE **direct** webview→sidecar). MemoPop's CLAUDE.md is explicit: *"don't add a third method casually."* The chat turn is a `request()`; any long capability it spawns reuses `subscribeEvents()`. **No third method.**
2. **The LLM-gateway invariant.** Only the FastAPI sidecar holds the Anthropic key (same as memo runs today). Therefore **the chat's LLM call and four-slab assembly live in the sidecar**, i.e. inside the `apps/memopop-orchestrator/` **submodule** — not in the webview. The webview never sees a key.
3. **FlowState reactivity discipline.** Per `src/lib/stores/flow.svelte.ts`: append-only, high-frequency arrays live in `$state.raw` (not `$state`), with monotonic-seq dedup across EventSource reconnects — the fix for the "screen going black" GC/layout spike at 30+ events/sec. The chat message log and any narration stream follow the **same** discipline.
4. **The submodule boundary.** `apps/memopop-orchestrator/` is a separate GitHub repo. Sidecar/server work lands in *its* changelog and history; webview work lands here. Do not bump the parent gitlink as a side effect (see [[feedback_submodule_propagation]] discipline). Each phase below is tagged **[native]** or **[orchestrator]** for which repo it touches.

## The shape of a turn (end to end)

```
[webview]  user types ──▶ chat.svelte.ts store
                              │ getTransport().request('POST', '/chat/turn', { message, thread, context })
                              ▼
[rust]    api_dispatch ──────▶ forwards to sidecar (CORS allowlist already covers tauri origins)
                              ▼
[sidecar] /chat/turn: assemble 4 slabs ─▶ Anthropic call w/ 3 chat tools ─▶ ChatResponseFrame
                              ▼  (answer | propose | invoke)
[webview]  store renders:  text   | proposal cards | narrated invoke
                              │ on invoke of a job-shaped verb (e.g. memo.run):
                              │   request('POST', '/memos', …) ─▶ subscribeEvents(jobId) ─▶ existing JobView stream
                              ▼
                          lifecycle/narration events tail into the chat
```

The turn itself is **synchronous request/response** (simplest, honors the seam). Streaming narration is reused only when an *invoked capability* is a long job — which is exactly what `subscribeEvents` already does for memo runs.

> ⚠ If we later want token-streaming of the chat turn *itself*, that is a **deliberate, documented** generalization of `subscribeEvents` (its path is currently hardcoded to `/memos/{jobId}/events` in `transport/local.ts`), not a casual third method. Flag it, design it, don't sneak it. Out of scope for v0.0.1.

## Where it renders

A **collapsible right-rail drawer**, mounted in `src/routes/+layout.svelte` so it is available across every route (gallery, deal workspace, settings), toggled from `Header.svelte`. It reads `flow.stage.kind` for anticipation and **reuses the existing steam-punk character cast** (`src/lib/characters.ts` + `CharacterRow.svelte`) for the narration row, so the chat feels of-a-piece with `JobView`. Rationale: a docked co-pilot that can see the active view beats a separate `/chat` route, which would lose the context the anticipation pattern depends on.

## Phases

Each phase is independently shippable and ends in a working, demoable state. Acceptance criteria are concrete.

### Phase 0 — Decisions & contracts [native + orchestrator]

Settle and write down, before code:

- **Turn transport shape:** synchronous `request('POST','/chat/turn')` (recommended) vs. turn-as-job. → Recommend synchronous; job-stream only on invoke.
- **ChatResponseFrame TS type** (shared shape, hand-mirrored on both sides of the seam since the submodule is Python):

```ts
type ChatResponseFrame =
  | { mode: 'answer';  text: string }
  | { mode: 'propose'; text: string; proposals: Proposal[] }
  | { mode: 'invoke';  text: string; capability: string; args: Record<string, unknown> };

interface Proposal { capability: string; hint: string; args: Record<string, unknown>; }
```

- **v0.0.1 capability whitelist** — wrap **existing** operations only (see Phase 3). No net-new verbs.
- **Gating default:** strict-align — prefer `propose` over `invoke` for anything ambiguous; `invoke` only when the user named the verb or accepted a prior proposal (augment-it's discipline).

Acceptance: a short decisions note appended here (or a sibling `context-v/issues/` entry) recording the four choices.

### Phase 1 — Webview chat skeleton against a mock [native]

Build the UI with a **mock transport** returning canned frames — no sidecar dependency yet.

- New store `src/lib/stores/chat.svelte.ts` — `ChatState` class (singleton, runes). `messages = $state.raw<ChatMessage[]>([])` (append-only, FlowState discipline), `draft = $state('')`, `open = $state(false)`, `pendingProposals = $state.raw<Proposal[]>([])`, `busy = $state(false)`.
- Components in `src/lib/components/chat/`: `ChatPanel.svelte` (drawer shell), `ChatMessageList.svelte`, `ChatComposer.svelte`, `ProposalCard.svelte`, reuse `CharacterRow.svelte`.
- Mount `ChatPanel` in `+layout.svelte`; add a toggle button to `Header.svelte`.
- `MockTransport` behind a dev flag so `chat.svelte.ts` can develop without the endpoint.

Acceptance: drawer opens/closes; typing a message renders a user bubble and a canned answer; a canned `propose` renders proposal cards; no layout jank when spamming messages (verifies the `$state.raw` choice).

### Phase 2 — Sidecar /chat/turn endpoint [orchestrator]

In `apps/memopop-orchestrator/src/server/` (the FastAPI sidecar):

- New route `POST /chat/turn` accepting `{ message, thread?, context? }`, returning `ChatResponseFrame`.
- **Four-slab system prompt assembly** (mirror augment-it's `services/workspace/src/chat.ts`, cache-eligible order): `[1] STATIC SPINE` (memopop framing + the three response modes) · `[2] CAPABILITY SCHEMAS` (the whitelist, stable order) · `[3] ACTIVE SKILLS` (empty for now — reserved breakpoint) · `[4] PER-FIRM REMINDERS` (empty for now).
- Three chat **tools** (`chat_answer` / `chat_propose` / `chat_invoke`) — the model picks exactly one; translate the tool_use into a `ChatResponseFrame`.
- Anthropic call uses the sidecar's existing key + client. Add the route to the **CORS allowlist** that already covers tauri origins (CLAUDE.md transport note #2). Enable prompt caching on slabs 1–2.

Acceptance: `curl` the route with a sample message and get a well-formed frame for each of the three modes (drive mode by message phrasing); CORS preflight from a tauri origin succeeds.

### Phase 3 — Capability registry & dispatch (existing verbs only) [native + orchestrator]

Wrap operations the app **already performs** as `entity.verb` capabilities. Candidate v0.0.1 whitelist:

| Capability | Wraps (already exists) | Shape | Gating |
|---|---|---|---|
| `memo.run` | the `/memos` POST + `JobView` run path | job-spawning | propose-first (expensive) |
| `deal.create` | `DealCreationModal` flow | request | propose-first |
| `firm.create` | `FirmCreationModal` flow | request | propose-first |
| `outline.select` | outline gallery selection | request | invoke-ok |
| `artifact.open` | `openers.ts` / `ArtifactBrowser` | request | invoke-ok (read-only) |
| `roster.crawl` | [[Add-People-Crawl-Command-to-Memopop-Native]] CLI | job-spawning | propose-first |

- **Webview side:** a dispatch map `capability → handler` in `chat.svelte.ts` (or a small `capabilities.ts`). `memo.run` / `roster.crawl` handlers call `request('POST', …)` then `subscribeEvents(jobId)` — i.e. they reuse the existing job machinery and hand the stream to the chat narration row.
- **Sidecar side:** the capability *schemas* (args shapes) feed Slab 2 so the model fills args correctly.

Acceptance: from chat, "run the memo for this deal" → `propose memo.run` → accept → the existing `JobView` run actually starts and its milestones tail into the chat character row.

### Phase 4 — Response modes & the proposal/invoke gate [native]

- Render `answer` (text), `propose` (cards with editable prefilled args + an Accept affordance), `invoke` (narrated, runs immediately).
- Accepting a proposal calls the capability dispatch from Phase 3. Editable args before confirm.
- Enforce the strict-align default: ambiguous turns must come back as `propose`.

Acceptance: a destructive/expensive verb (`memo.run`) is never auto-invoked from an ambiguous phrasing; the user always gets a card to accept.

### Phase 5 — Anticipation & lifecycle narration [native]

- **Anticipation:** a map keyed on `flow.stage.kind` (`idle` / `outline_detail` / `ready_to_run` / `running_job` / `brand_setup`) → 1–3 suggested verbs shown as ghost chips above the composer. Pattern 3 of the blueprint; memopop's discriminated `FlowStage` union is already the input it wants.
- **Narration:** when an invoked capability is a job, its `JobEvent` milestones drive the chat character cast (reuse `characters.ts` stage→character mapping), so chat and `JobView` tell the same story.

Acceptance: landing on a `ready_to_run` stage surfaces "run this memo" as an anticipated chip without the user typing; a running job's milestones animate the chat character row.

### Phase 6 — Agent-skills into Slab 3 (the Source-Curation-Gate bridge) [orchestrator]

Turn on the reserved Slab 3 with the **first `SkillCapability`**, loading memopop's existing authored skills.

- Load `context-v/agent-skills/<skill>/SKILL.md` bodies into Slab 3 **by trigger-shape** (only when the turn matches the skill `description`), per the [[Chat-As-Verb-Surface-Patterns]] `SkillCapability` contract: the skill **advises**, the model then calls executing verbs. First adopters already on disk: `sources-md-curation`, `user-adds-adhoc-sources` (the latter is already the in-app-chat-verb contract — see [[project_user_adds_adhoc_sources_skill_for_agent_chat]]), plus `competitive-analysis` etc.
- This is the seam where the [[Source-Curation-Gate]] discipline enters memopop: the skill (evolving toward canonical LFM extract syntax) rides Slab 3; the stable `source.*` / `extract.*` verbs (net-new, sequenced after this plan) execute.

Acceptance: a turn matching a skill's description loads its body into the prompt (verifiable in a debug echo of the assembled slabs) and the model's behavior visibly follows the skill's instructions; non-matching turns leave Slab 3 empty (cache stays warm).

### Phase 7 — Hardening [native + orchestrator]

- Error envelopes (reuse `ApiError` shape) surfaced as chat system messages, not silent failures.
- Thread persistence (per deal/firm) — decide store location (Tauri `plugin-store` vs sidecar). Lean: `plugin-store`, client-side, per active firm.
- Prompt-cache verification (slabs 1–2 hit across turns).
- BYOK note: desktop v0.0.1 uses the sidecar's configured key; BYOK is future per [[In-App-Chat-as-Agent-Surface-for-Client-Apps]].

## File manifest (anticipated)

**memopop-native (this repo):**
```
src/lib/stores/chat.svelte.ts                 # ChatState (runes singleton)
src/lib/components/chat/ChatPanel.svelte       # drawer shell, mounted in +layout
src/lib/components/chat/ChatMessageList.svelte
src/lib/components/chat/ChatComposer.svelte
src/lib/components/chat/ProposalCard.svelte
src/lib/chat/capabilities.ts                   # webview dispatch map (verb → handler)
src/lib/transport/mock.ts                       # MockTransport (dev only, Phase 1)
# edits: src/routes/+layout.svelte (mount), src/lib/components/Header.svelte (toggle)
```

**memopop-orchestrator (submodule):**
```
src/server/chat.py (or routers/chat.py)        # /chat/turn, four-slab assembly, 3 tools
src/server/capabilities.py                      # capability schemas for Slab 2
src/server/skills.py                            # Slab 3 SkillCapability loader (Phase 6)
# edits: CORS allowlist; server registration of the new route
```

## Open decisions (resolve in Phase 0 or as they arrive)

1. **Turn streaming** — synchronous (recommended) vs. generalize `subscribeEvents` for token streaming. Default: synchronous; revisit only on a real UX need.
2. **Thread persistence location** — Tauri `plugin-store` (client) vs. sidecar. Default: `plugin-store`, per firm.
3. **Anticipation source of truth** — hardcoded map vs. derived from capability metadata + active view. Default: hardcoded map v0.0.1; generalize later.
4. **Where the v0.0.1 capability whitelist is canonical** — webview, sidecar, or a shared manifest. Default: sidecar owns schemas (Slab 2); webview owns handlers; keep names in sync by hand for four verbs.
5. **First skill to wire in Phase 6** — `user-adds-adhoc-sources` (already the chat-verb contract) is the natural first adopter.

## Risks & anti-patterns

- **Adding a third transport method.** The single biggest seam risk. Turn = `request`; job narration = `subscribeEvents`. Anything else is a flagged, designed change.
- **Putting the Anthropic call in the webview.** Violates the gateway invariant. The key lives only in the sidecar.
- **Events on a deep `$state` object.** Re-introduces the black-screen GC spike. Message log and narration arrays are `$state.raw` with seq dedup.
- **Inventing source-curation verbs inside this plan.** Out of scope — this plan builds the *surface*; the gate verbs come after, per [[Source-Curation-Gate]].
- **Bumping the parent gitlink** when orchestrator phases land. Let the user tidy parents deliberately ([[feedback_submodule_propagation]]).
- **A shared chat package across the three apps.** Knots already proved that fails — memopop builds its own surface against the shared *pattern* ([[Chat-As-Verb-Surface-Patterns]]), not shared runtime code.

## References

- [[Chat-As-Verb-Surface-Patterns]] — the five patterns (capability adapters, lifecycle events, anticipation, three modes, four slabs) this plan implements (ai-labs blueprint).
- [[Per-App-Workspace-Conventions]] — the FlowState/runes/capability-registry conventions memopop-native already embodies (ai-labs blueprint).
- [[In-App-Chat-as-Agent-Surface-for-Client-Apps]] — the journey-mode exploration (BYOK, four layers).
- [[Source-Curation-Gate]] — the discipline delivered via Slab 3 in Phase 6 (ai-labs blueprint).
- [[Drag-in-AI-Assisted-Web-Research-and-the-Source-Curation-Gate]] — why the gate exists; fork 1 (which app wires Slab 3 first).
- `apps/memopop-native/src/lib/transport/{types,index,local}.ts` — the seam this rides.
- `apps/memopop-native/src/lib/stores/flow.svelte.ts` — the reactivity discipline to mirror.
- augment-it `services/workspace/src/chat.ts` — the reference four-slab assembly (read, don't import — knots).

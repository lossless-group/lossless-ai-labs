---
title: "In-App Agent Chat — As-Built vs. As-Specced (Internal Audit)"
lede: "Phase 1 deliverable of the agent-harnesses/conversational-UI study plan. The four 2026-05-18 architecture docs got most of the shape right — but reality diverged from the letter of the spec in one load-bearing way: augment-it never built the shared @lossless/in-app-agent package, it built the WorkspaceAdapter pattern directly inside @augment-it/workspace instead. Memopop-native has zero agent code but a proven, generalizable Rust sidecar-dispatcher substrate. Dididecks is untouched. This changes what a cross-product native shell needs to reuse vs. build fresh."
date_created: 2026-07-13
date_modified: 2026-07-13
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Sonnet 5
semantic_version: 0.0.0.1
tags:
  - Exploration
  - Audit
  - In-App-Agent-Chat
  - Augment-It
  - Memopop-Native
  - Workspace-Pattern
  - Tauri
status: Draft
---

# In-App Agent Chat — As-Built vs. As-Specced

Phase 1 of `ai-labs/context-v/plans/Study-Agent-Harnesses-and-Conversational-UI-Before-Cross-Product-Shell.md`. Cites real paths, not paraphrase.

## The headline correction

The four 2026-05-18 docs ([[In-App-Agent-Chat-Walking-Skeleton]], [[Slides_Anatomy-of-the-In-App-Agent-Shell]], [[Slides_Per-App-Workspaces-and-the-Chat-as-Optional-Surface]], [[Slides_Agent-Capabilities_Hooking-the-Chat-Surface-into-Memopop]]) specced a shared `@lossless/in-app-agent` UI package, consumed by every app through a typed `WorkspaceAdapter`. `ai-labs/packages/in-app-agent/` was never created — confirmed empty search of `ai-labs/packages/` (only `mermaid-js-ai-agent/` and `odysseus/` exist there).

But the *pattern* the package would have enforced — chat is a thin UI consumer, the workspace singleton is the only mutation surface and owns the actual model call — **was built**, just inlined into augment-it's own code instead of extracted into a shared package:

- `augment-it/apps/chat/src/chat-state.svelte.ts:12` imports `workspace, ChatProposal, ChatToolCall` directly from `@augment-it/workspace` — not from any shared chat package.
- `chat-state.svelte.ts:52` calls `workspace.chatTurn({ message, thread_id, context, thread })` — the model call itself lives in the workspace package (`augment-it/packages/workspace/src/state.svelte.ts` and `transport.ts`, both `grep -l chatTurn` hits), not in the chat UI.
- The chat UI (`ChatSurface.svelte`, 224 lines; `chat-state.svelte.ts`, 154 lines; `CharacterCastRow.svelte`, 64 lines; `ResponseModeRenderer.svelte`, 187 lines; `PromptDraftPanel.svelte`, 92 lines) only renders transcript, character-cast, and response-mode affordances — it holds zero business data, exactly as the Anatomy doc's Configuration A prescribes.

**Correction to the plan's Context section:** augment-it's chat is not "fully bespoke, ignoring the pattern" — it faithfully implements the workspace/chat split, just as a monolithic per-app implementation rather than the shared-package + adapter-seam shape the spec called for. The `WorkspaceAdapter` interface itself (`subscribe`/`getSnapshot`/`invoke`/`getCapabilityRegistry`) was never extracted as a standalone typed contract; augment-it's chat imports the workspace's own types (`ChatProposal`, `ChatToolCall`) directly.

**What this means for a cross-product shell:** there is no existing shared adapter interface to reuse as-is. Any new shell either (a) revives the `WorkspaceAdapter` seam properly this time — extracting it from augment-it's working code rather than re-speccing from scratch — or (b) accepts that each backend gets its own bespoke thin client inside the new shell, same as augment-it did internally. Phase 3 (synthesis) should decide this explicitly rather than assume the spec's abstraction still holds.

## memopop-native: zero agent code, but a proven, generalizable substrate

Confirmed via `find memopop-ai/apps/memopop-native/src -iname "*agent*" -o -iname "*capabilit*" -o -iname "*chat*"` → no results. The "memopop adaptation" walking-skeleton doc ([[Slides_Agent-Capabilities_Hooking-the-Chat-Surface-into-Memopop]]) was written and never executed.

What *is* real and working, per `src-tauri/src/lib.rs` (39 lines) and `src-tauri/src/api/`:

- `lib.rs:11` registers a single `api::sidecar::SidecarManager` as managed Tauri state, and wires exactly **one** IPC command: `api_dispatch` (`lib.rs:32`, defined in `api/router.rs`, 216 lines). This is a generic JSON-RPC-shaped dispatcher, not one Tauri command per capability — directly relevant to a shell that needs to add capabilities per-context without touching the Rust binary's command surface.
- `lib.rs:18-27` handles both `CloseRequested` and `Destroyed` window events to call `manager.shutdown()` — the fix for a real incident (a stale Python sidecar surviving a closed window, "the bug that wasted hours of runtime" per the inline comment at `lib.rs:20`).
- `api/sidecar.rs` (215 lines): `ensure_running()` (`:49`) always probes `/healthz` first (`:60`) before deciding to spawn — self-healing against a dead-but-still-tracked child — then spawns `{repo}/.venv/bin/python -m src.server` and polls `/healthz` on a deadline (`:100-121`). `forward()` (`:121`) proxies requests to the sidecar. `find_venv_python()` (`:200`) locates the orchestrator's venv from a user-anchored path chosen once during onboarding.
- `api/queries.rs` (528 lines) and `api/actions.rs` (140 lines) are the read/write split on top of the dispatcher — queries hit the sidecar's FastAPI routes, actions mutate.

**What this means for a cross-product shell:** the `SidecarManager` pattern (lazy-spawn, healthz-probe-before-respawn, forward-by-proxy, clean shutdown on both close events) is transport-agnostic — it doesn't know or care that the backend is memopop's orchestrator specifically. Generalizing it to point at a *different* backend (augment-it's Node services, dididecks' SvelteKit API routes) per active context is plausible without a rewrite: the `forward()` proxy and `find_venv_python`-style path resolution would need to become per-context config rather than hardcoded to one repo, but the shape holds. This is the strongest argument for extending `memopop-native` rather than starting a new Tauri app from zero, matching what the user confirmed in-session.

## dididecks-ai: fully greenfield

Confirmed via `find dididecks-ai -iname "*chat*" -o -iname "*agent*"` → only unrelated deck *content* about "agentic" topics (client-site slide decks), zero implementation. No prior art to reconcile here; a cross-product shell that adds dididecks as a context is building that integration from scratch regardless of which shell-hosting decision Phase 3 makes.

## Net effect on Phase 3 (synthesis)

Three concrete inputs the synthesis doc must resolve, now that they're grounded rather than assumed:

1. **Adapter seam:** extract a real `WorkspaceAdapter`-shaped interface from augment-it's working `chatTurn()` contract (proven in production use), rather than re-deriving one from the unbuilt spec.
2. **Host substrate:** `memopop-native`'s `SidecarManager` + single-dispatcher-command pattern is the one piece of native-shell plumbing already de-risked in this tree — generalizing its `forward()`/`find_venv_python` config to be per-context (augment-it / dididecks / memopop) is the concrete engineering task if Phase 3 picks "extend memopop-native."
3. **dididecks integration** is greenfield either way and shouldn't anchor the host-substrate decision.

## Related

- `ai-labs/context-v/plans/Study-Agent-Harnesses-and-Conversational-UI-Before-Cross-Product-Shell.md`
- [[In-App-Agent-Chat-Walking-Skeleton]]
- [[Slides_Anatomy-of-the-In-App-Agent-Shell]]
- [[Slides_Per-App-Workspaces-and-the-Chat-as-Optional-Surface]]
- [[Slides_Agent-Capabilities_Hooking-the-Chat-Surface-into-Memopop]]
- `augment-it/apps/chat/src/chat-state.svelte.ts`, `augment-it/packages/workspace/src/`
- `memopop-ai/apps/memopop-native/src-tauri/src/lib.rs`, `src-tauri/src/api/{sidecar,router,queries,actions}.rs`

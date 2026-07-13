---
title: "Cross-Product Native Agent Shell — Synthesis and Architecture Decision"
lede: "Phase 3 of the study plan, and its actual deliverable. Resolves the fork the 2026-05-18 in-app-agent docs left open — extend memopop-native or build standalone — with a recommendation, then defines what 'context switching' and 'dynamic skill/MCP loading' concretely mean, grounded in sixteen pinned repos' actual source rather than either the original spec or training-data folklore."
date_created: 2026-07-13
date_modified: 2026-07-13
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Sonnet 5
semantic_version: 0.0.0.1
tags:
  - Exploration
  - Architecture-Decision
  - In-App-Agent-Chat
  - Tauri
  - Memopop-Native
  - MCP
  - Agent-Harnesses
  - Conversational-UI
status: Draft
---

# Cross-Product Native Agent Shell — Synthesis and Architecture Decision

This is the Phase 3 deliverable of `ai-labs/context-v/plans/Study-Agent-Harnesses-and-Conversational-UI-Before-Cross-Product-Shell.md`. It draws on:

- The internal audit: [[In-App-Agent-Chat-As-Built-vs-As-Specced]]
- Sixteen pinned-repo profiles across two studies: `ai-labs/studies/agent-harnesses/context-v/profiles/` (9 repos) and `ai-labs/studies/conversational-ui-and-native-shells/context-v/profiles/` (7 repos, one — `librechat` — added unrequested by a stray background process mid-run and not yet profiled; flagged for your review, not acted on further here)
- Two Phase 2 inquiry docs answering targeted questions: `ai-labs/studies/agent-harnesses/context-v/inquiry/Targeted-Questions-for-Cross-Product-Shell.md` and the sibling in `conversational-ui-and-native-shells/`

No code is written here. This is the decision the next, separate implementation plan should start from.

## 1. The fork: extend `memopop-native`, don't build standalone

**Recommendation: extend `memopop-native` into the cross-product shell.**

Three independent pieces of evidence converge on this, not one:

1. **Migrating a shell to Tauri is real, multi-month, sometimes-reverted work — evidence *for* starting from something already Tauri, not against migration in general.** Dive's own Electron→Tauri migration (`Profile__Dive.md`) added a Tauri backend, then explicitly reverted macOS back to Electron 25 days later, and is *still* Electron-only on macOS 11 months later per its own README. If a team dedicated to exactly this migration didn't finish it cleanly, building a *new* Tauri app from zero carries the same risk with none of `memopop-native`'s existing, working Rust plumbing to fall back on.

2. **Two unrelated projects converged independently on the same shell shape** — strong signal it's the right one. Dive's own architecture, once you look past its dual Tauri/Electron builds, is a thin native shell that does nothing but spawn a `dive_httpd` Python subprocess and proxy its port; *all* agent/tool/MCP logic lives in that separate process, not in either shell (`Profile__Dive.md`). `memopop-native`'s `SidecarManager` (`memopop-ai/apps/memopop-native/src-tauri/src/api/sidecar.rs`, per [[In-App-Agent-Chat-As-Built-vs-As-Specced]]) is structurally the same move: lazy-spawn a Python sidecar, healthz-probe before respawn, forward requests by proxy, clean shutdown on window close. Two teams that never talked to each other built the same shape. That's not precedent, that's convergent validation.

3. **`memopop-native` is the only one of the three products with a de-risked native substrate.** augment-it's chat works but is a web/Module-Federation microfrontend, not a native shell. dididecks has nothing. Building a fourth, brand-new Tauri app means re-solving sidecar lifecycle, IPC boundary design, and packaging from scratch — problems `memopop-native` already has working answers to (see [[In-App-Agent-Chat-As-Built-vs-As-Specced]] for exactly which files).

**What "extend" concretely means:** generalize `SidecarManager`'s `forward()` and `find_venv_python()`-style path resolution from "always the memopop orchestrator" to "whichever backend the active context points at" (§3). The single `api_dispatch` IPC command (`src-tauri/src/api/router.rs`) is already a generic-enough seam that adding capabilities per-context shouldn't require new Tauri commands — a config/registry-driven dispatch table is the natural next step, not a new command per capability per app.

**What this does not resolve on its own:** augment-it and dididecks don't run as local Python sidecars — augment-it's services are Node, dididecks is a SvelteKit app. `SidecarManager`'s pattern (spawn, healthz-probe, forward, shutdown) generalizes to "manage a local backend process," but the *specific* spawn command and health-check endpoint need to become per-context configuration, not a hardcoded Python venv path. This is real engineering work for the follow-up implementation plan, not a detail to wave away.

## 2. What "context switching" concretely means — and the evidence for how to build it

Two studies converge on the same negative-and-positive pair of findings:

**Negative: `anything-llm`'s "workspace" is not the model to copy.** Per `Profile__Anything-LLM.md`: a workspace is a database row of *parameters* (chatProvider, chatModel, slug); switching workspace triggers a route change and a plain fetch, with the LLM connector rebuilt stateless-per-call and the vector DB resolved from **one process-wide env var regardless of workspace**. This looks like context-switching in the UI while silently sharing state underneath — exactly the kind of bug that's invisible until two contexts collide over shared resources (a real risk if augment-it and memopop ever contend for the same local port or cache directory).

**A middle case: `open-vibe` isolates by process but not by adapter.** Per `Profile__Open-Vibe.md`: `spawn_workspace_session` genuinely spawns one distinct `codex app-server` child process per workspace over real JSON-RPC/stdio, keyed and deduped by workspace id — real process isolation, not shared state. But there is exactly one CLI wired in; no provider registry, no second backend anywhere in source. It sits between anything-llm (no isolation at all) and routa (isolation *and* swappable adapter) — useful as confirmation that process-per-context is achievable cheaply, but not sufficient alone.

**Positive: `routa` demonstrates the real thing.** Per `Profile__Routa.md`: `AcpManager` is a live-process registry (`HashMap<sessionId, ManagedProcess>`), not a config cache. Creating a session takes `workspace_id`, `cwd`, `provider`, `model` as real arguments, spawns a genuinely distinct OS child process, writes a workspace+session-scoped MCP config keyed by `wsId`/`sid` in its own endpoint URL, and persists all of it with a `workspace_id NOT NULL` foreign key. Routa's own ADR 0002 documents this as a deliberate move *away* from global env-var selection — meaning the team building it hit the exact anything-llm-shaped failure mode and fixed it, on purpose, with a paper trail.

**The concrete design for our shell, following routa's shape rather than anything-llm's:**

- A "context" (augment-it / dididecks / memopop) is a **live managed process handle**, keyed by context id, not a config row read fresh on every call.
- Switching context means: (a) tear down or suspend the previous context's `SidecarManager`-equivalent process handle, (b) spawn or resume the new context's process, (c) rebind the `WorkspaceAdapter` (§4) to the new handle. Nothing about the model call, the tool registry, or the trace log should be resolved from a shared global at request time — every one of those must carry the active context id explicitly, the way routa's MCP endpoint bakes `wsId`/`sid` into the URL rather than trusting ambient state.
- **Gating what's visible per context**, not just which process is running, follows `goose`'s three-tier permission model (`Profile__Goose.md`): separate "is this tool discoverable in this context" (an allowlist per context, analogous to goose's per-extension `available_tools`) from "does this specific call need user confirmation" (`AlwaysAllow`/`AskBefore`/`NeverAllow`, which augment-it's own capability registry already has a version of via `requiresUserConfirmation` per [[In-App-Agent-Chat-As-Built-vs-As-Specced]]).
- **Reconciling the MCP/tool set on switch** should follow `continue`'s diff-based approach (`Profile__Continue.md`, now archived but the pattern survives): compare the new context's required MCP connections against the currently-live set by connection identity (command+args+env, or url), tear down only what changed, keep what's shared. Continue's own code is explicit that a full profile switch still forces a full MCP-manager reload — don't assume a cheap pointer-swap is achievable; budget for real teardown/rebuild latency on context switch, and diff to minimize it rather than eliminate it.
- **An orthogonal trust axis worth adding, not currently in any of the in-house docs**: `codex`'s split between *sandbox policy* (can this process touch the filesystem/network at all, enforced at the OS level via Seatbelt/Landlock, `Profile__Codex.md`) and *approval policy* (does the user need to confirm this specific action) is a genuinely different, complementary axis to goose's single permission gate. For a shell juggling three products' worth of local processes and file access, this two-axis model — what can the process physically do vs. what does it need to ask permission for — is worth adopting even though it means more up-front design than copying goose's single gate.

## 3. The skill/MCP dynamic load-unload model

No repo in either study has fully solved "swap the entire skillset when the user switches project" — this needs to be said plainly rather than implied. The candidates that come closest, and what to take from each:

- **`opencode`** (`Profile__Opencode.md`): tools, skills, and MCP-derived capabilities converge into **one unified registry**, then a **wildcard permission filter** (`Permission.visibleTools()`) determines what's visible per-agent. This registry-then-filter split is the cleanest shape in the whole study for "load everything statically, then compute per-context visibility" — closer to how our shell should work than any per-context reload scheme.
- **`goose`**'s per-extension `available_tools` allowlist plus its three-tier permission gate is the other half: *discoverability* (is this tool in the registry for this context) is a separate concern from *trust* (can it fire without confirmation).
- **`cline`**'s Memory Bank is a cautionary counter-example, not a pattern to copy: it has **zero code implementation** — it's purely a `.clinerules/memory-bank.md` convention riding on cline's generic rules-file loader (`Profile__Cline.md`). And its MCP config is **machine-global, not per-project** — the opposite of what "swap context per product" needs. Both findings are useful precisely because they show a mature, widely-used harness that never actually built per-project dynamic MCP scoping; it's a documentation convention layered over a global config file.
- **`continue`**'s per-profile config directories (`.continue/{assistants,agents,configs}/*.yaml`) are the one clear example of *files on disk, scoped per project, selectable at runtime* — even though the project is archived, the file-layout idea (a directory of YAML profiles, one active at a time, swappable without restart) is worth lifting directly.

**Design implication for our shell:** skills and MCP servers should be declared per-context in on-disk config (continue's shape — a directory per context, not a single global file like cline's), loaded into one unified in-memory registry at context-switch time (opencode's shape), with visibility computed by a filter function rather than by rebuilding the registry from scratch (opencode again), and gated by both a discoverability allowlist and a trust tier (goose), optionally hardened with OS-level sandboxing for anything that touches the filesystem or network beyond the active context's own data (codex).

## 4. Reconciling with the `@lossless/in-app-agent` spec

Per [[In-App-Agent-Chat-As-Built-vs-As-Specced]], the shared package was never built; augment-it built the workspace/chat split directly instead, with `chat-state.svelte.ts` calling `workspace.chatTurn(...)` and the model call living inside `@augment-it/workspace` itself. There is no existing, reusable `WorkspaceAdapter` interface to import — but there is a **working, production-proven contract** (`chatTurn({ message, thread_id, context, thread }) → { mode, text, proposals?, tool_call? }`) to extract one from.

**Recommendation:** don't re-derive `WorkspaceAdapter` from the unbuilt 2026-05-18 spec. Extract it from augment-it's actual `chatTurn()` shape, generalized just enough to also fit memopop's and dididecks' eventual capabilities:

```ts
interface ContextAdapter {
  chatTurn(input: { message: string; thread_id: string; context?: unknown; thread: ChatMessage[] }): Promise<ChatTurnResult>;
  getCapabilityRegistry(): CapabilityRegistry; // per §3 — unified registry + visibility filter
  subscribe(listener: () => void): () => void; // per the original Anatomy doc's realtime-mirror requirement
}
```

This is deliberately a smaller interface than the original spec's `WorkspaceAdapter` (which also had `getSnapshot()`/`invoke()` as separate methods) — matching what's actually proven in production rather than what was speculatively designed. Each context (augment-it, dididecks, memopop) implements this against its own backend process (per §1–2); the shell holds one active `ContextAdapter` at a time, swapped per §2, never more than one live at once unless a future requirement genuinely needs concurrent multi-context sessions (which routa's per-session process model would support if that need arises — see `Profile__Routa.md`).

## 5. What this doc does not decide

- The exact on-disk config format for per-context skill/MCP declarations (continue-shaped directory vs. something else) — a follow-up implementation plan's concern.
- Whether dididecks and augment-it's non-Python backends (SvelteKit, Node) fit the generalized `SidecarManager` shape as cleanly as memopop's Python orchestrator does — needs a spike, not a synthesis-doc guess.
- The `librechat` submodule added unreviewed during this study's autonomous run — its per-file-type pluggable storage strategy (`local`/`s3`/`firebase`/`azure_blob`/`cloudfront`) is interesting prior art for settings/asset persistence but wasn't part of the original plan and hasn't been profiled; keep, drop, or profile it as a follow-up, not decided here.

## Related

- `ai-labs/context-v/plans/Study-Agent-Harnesses-and-Conversational-UI-Before-Cross-Product-Shell.md`
- [[In-App-Agent-Chat-As-Built-vs-As-Specced]]
- `ai-labs/studies/agent-harnesses/context-v/profiles/` — all 9 profiles
- `ai-labs/studies/conversational-ui-and-native-shells/context-v/profiles/` — all 7 (+librechat unprofiled) profiles
- `ai-labs/studies/agent-harnesses/context-v/inquiry/Targeted-Questions-for-Cross-Product-Shell.md`
- `ai-labs/studies/conversational-ui-and-native-shells/context-v/inquiry/Targeted-Questions-for-Cross-Product-Shell.md`
- [[In-App-Agent-Chat-Walking-Skeleton]], [[Slides_Anatomy-of-the-In-App-Agent-Shell]], [[Slides_Per-App-Workspaces-and-the-Chat-as-Optional-Surface]], [[Slides_Agent-Capabilities_Hooking-the-Chat-Surface-into-Memopop]] — the original 2026-05-18 docs this synthesis supersedes/corrects

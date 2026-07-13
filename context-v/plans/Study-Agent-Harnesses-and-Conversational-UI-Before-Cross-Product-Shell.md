---
title: "Study Agent Harnesses + Conversational UI, Then Decide the Cross-Product Native Shell"
lede: "Before building a native cross-platform (Tauri) chat app that swaps context between augment-it, dididecks-ai, and memopop-ai and dynamically loads/unloads skills and MCP servers, pin two new studies (agent harnesses; Tauri/conversational-UI apps), audit the in-house prior art the 2026-05-18 in-app-agent docs already produced, read externally against specific open questions, then synthesize one architecture decision doc. No code lands in this plan."
date_created: 2026-07-13
date_modified: 2026-07-13
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Sonnet 5
semantic_version: 0.0.0.1
tags:
  - Plan
  - Study
  - Agent-Harnesses
  - Conversational-UI
  - Tauri
  - In-App-Agent-Chat
  - Memopop-Native
  - Augment-It
  - Dididecks-AI
status: Draft
---

# Study Agent Harnesses + Conversational UI, Then Decide the Cross-Product Native Shell

## Context

The ask: study Agent Harnesses and Conversational UI apps before designing a native, cross-platform (Tauri) chat app that can swap context between augment-it, dididecks-ai, and memopop-ai, and dynamically load/unload skills and MCP servers per context. Understand how existing systems organize files, persist memory, leave traces, expose the right tools, and evolve skills — grounded in real upstream code, not recalled training data (per the `study-repos-first` skill).

Before proposing a study, I audited what's already in the tree, because it changes the shape of the study:

- **`ai-labs/context-v/plans/`** already has four detailed 2026-05-18 documents ([[In-App-Agent-Chat-Walking-Skeleton]], [[Slides_Anatomy-of-the-In-App-Agent-Shell]], [[Slides_Per-App-Workspaces-and-the-Chat-as-Optional-Surface]], [[Slides_Agent-Capabilities_Hooking-the-Chat-Surface-into-Memopop]]) that specced exactly this kind of chat-surface architecture: a shared `@lossless/in-app-agent` UI package, a per-app `@<app>/workspace` singleton (Module Federation `singleton: true`) as the sole source of business state, and a typed `WorkspaceAdapter` seam between them.
- **Reality diverged from that spec.** `ai-labs/packages/in-app-agent/` was never scaffolded. `augment-it/apps/chat/` exists and works (`ChatSurface.svelte`, `chat-state.svelte.ts`, `CharacterCastRow.svelte`, `ResponseModeRenderer.svelte`) but is bespoke to augment-it — it does not import a shared package.
- **`memopop-ai/apps/memopop-native/`** has zero chat/agent code (confirmed: no capability/agent/chat files under its `src/`), but it does have a proven, working Tauri 2 + SvelteKit shell with a Rust `SidecarManager` (`src-tauri/src/lib.rs`) that spawns a FastAPI sidecar, polls health, respawns on crash, and streams SSE directly from webview to FastAPI. This is the one product with real native-shell plumbing already de-risked.
- **`dididecks-ai`** has no chat/agent implementation at all — fully greenfield.
- The user confirmed this in-session: augment-it's chat is working (bespoke), memopop's was scoped but never implemented, and building the new cross-product native shell *inside* `memopop-native` (rather than a green-field app) is an acceptable, maybe preferred, path — since it already carries the working Tauri/sidecar substrate.

So the real open question is no longer "how do agent harnesses and chat UIs work in general" in the abstract — it's a concrete fork the 2026-05-18 docs already flagged and left open: **extend `memopop-native` into a multi-context shell, or build a new standalone Tauri app** — plus a genuinely new requirement those docs never addressed: **runtime context-switching with dynamic skill/MCP load-unload**, which the existing `WorkspaceAdapter` design (one fixed adapter per app, chosen at build time) doesn't cover. That's the gap external study should close, and it's why this plan front-loads reading over building.

I already ran two research passes (live GitHub API checks, not memory) to ground realistic candidates for two new `ai-labs/studies/` collections. Both existing sibling studies (`memory-layers-for-agents`, `open-specs-and-standards`) already cover memory-store internals and file-format specs (`AGENTS.md`, `SKILL.md`, MCP spec) respectively — this plan does not duplicate those, it adds the two collections that don't exist yet: how running harnesses actually behave, and how native/Tauri conversational shells are actually built.

## Phase 0 — Scaffold two new studies

Per the `study-repos-first` skill: name the question, pick the directory, pin submodules, write the README, add an inquiry log. Two studies, not one — the domain questions are genuinely different (runtime/backend harness behavior vs. frontend/native-shell architecture).

### `ai-labs/studies/agent-harnesses/`

**Question:** How do coding-agent / conversational-agent runtimes organize and write to files on disk, persist memory across sessions, log traces of tool calls and reasoning, decide which tools/MCP servers are in scope at a given moment, and load or evolve skills?

Candidate submodules (verified live via GitHub API this session — license, stars, last-push):

| Repo | License | Why it's here |
|---|---|---|
| `anomalyco/opencode` (moved from `sst/opencode`) | MIT | CLI-first harness; readable session-storage format, provider/tool registry, own MCP client |
| `aaif-goose/goose` (moved from `block/goose`) | Apache-2.0 | "Extensions" system *is* an MCP client wrapper; session/recipe YAML is directly inspectable |
| `Aider-AI/aider` | Apache-2.0 | Different philosophy — git-native, repo-map + diff edits; plain-file state (`.aider.chat.history.md`, git commits as trace) as contrast to MCP-native harnesses |
| `OpenHands/OpenHands` | MIT | Explicit event-stream/trajectory logging architecture; multi-agent delegation (CodeActAgent + micro-agents) |
| `modelcontextprotocol/python-sdk` (or `typescript-sdk`) | MIT | The reference MCP client/server implementation itself — tool discovery and capability negotiation at the protocol level, underneath every harness above |
| `continuedev/continue` | Apache-2.0 | IDE-first, not CLI-first; `.continue/` YAML config-loading is the closest existing analog to "swap skillset per project" |
| `microsoft/autogen` | MIT (core) | Multi-agent orchestration exemplar — conversation-state persistence, group-chat manager pattern |

Flagged and excluded: Claude Code itself and Cursor (closed source, not inspectable), `smol-developer` (unmaintained).

### `ai-labs/studies/conversational-ui-and-native-shells/`

**Question:** How do native, cross-platform conversational UI apps — especially Tauri-based ones — structure frontend state management, multi-context/workspace switching, local persistence, and MCP-client integration?

| Repo | Stack | Why it's here |
|---|---|---|
| `0xfrankz/Kaas` | Tauri + React, MIT | Clean local-first persistence pattern; multi-provider conversation storage on-device via Rust backend |
| `BANG404/openagent` | Tauri + SvelteKit | Very early/low-adoption but actively committed and closest feature match: multi-agent delegation, long-term memory, MCP, "Skills" loading — flag maturity caveat when citing |
| `OpenAgentPlatform/Dive` | Tauri **and** Electron dual-shipped, MIT | MCP host architecture (stdio + SSE transports), per-tool enable/disable, and a real Electron→Tauri migration in the same repo — directly informs the memopop-native build-stack question |
| `nanbingxyz/5ire` | Electron (comparison) | Mature local persistence (SQLite→PGlite), MCP-client with a server marketplace |
| `mintplex-labs/anything-llm` | Electron (comparison) | Workspace-based multi-context switching — closest existing pattern to "swap between different backend products" |
| `DrJonBrock/luke-desktop` | Tauri + React, MIT | Minimal didactic MCP-integration skeleton only — optional, low-value beyond illustration |

Excluded: `chatboxai/chatbox` (confirmed Electron despite reputation, open issue asking to switch to Tauri), LibreChat (self-hosted web app, not a native shell).

**Actions in this phase:**
1. Create both directories with `README.md` (question, table above, reading checklist) following the shape of `studies/memory-layers-for-agents/README.md`.
2. `git submodule add` each confirmed repo, nested inside its study (not at `ai-labs` root).
3. Add a `context-v/inquiry/` folder in each study for reading notes (per-study, not shared).
4. Update `ai-labs/studies/README.md`'s "Current studies" index with the two new entries.
5. Confirm final repo list with the user before adding submodules — the low-adoption ones (`openagent`, `luke-desktop`) are worth a yes/no.

## Phase 1 — Internal audit (read our own prior art before external code)

Cheapest, most relevant signal — read what's already built or specced in-house:

- The four existing plan docs (already read this session) — treat as authoritative on the *intended* architecture.
- `ai-labs/context-v/explorations/In-App-Chat-as-Agent-Surface-for-Client-Apps.md`, `ai-labs/context-v/specs/In-App-Agent-Chat-Core-Package.md`, `ai-labs/context-v/explorations/Memory-Layers-for-the-In-App-Chat-Package.md` — the deeper spec/exploration these plans summarize.
- `augment-it/apps/chat/src/*` and `augment-it/shell/src/flows.svelte.ts` + `augment-it/services/workspace`, `augment-it/packages/workspace` — the as-built (bespoke, non-shared-package) implementation, to see what's portable into a shared shell.
- `memopop-ai/apps/memopop-native/src-tauri/src/lib.rs` (the `SidecarManager`) and `src/lib/stores/flow.svelte.ts`, `src/lib/transport/*` — the proven Tauri+sidecar dispatcher pattern that's the leading candidate host for the new shell.
- `memopop-ai/apps/memopop-orchestrator/src/server/` — what FastAPI routes already exist to adapt as capabilities.

**Deliverable:** a short as-built-vs-as-specced note (added to this plan or a sibling file) — where the four architecture docs still hold, where augment-it diverged, and what memopop-native already offers for free.

## Phase 2 — External reading pass, driven by specific questions (not general summarizing)

Per the `study-repos-first` anti-pattern rule, no prose paraphrasing of whole repos. Read against targeted questions that resolve the actual open fork:

- How does `opencode`/`goose` decide which MCP servers + tools are in scope for a given session — is there a live enable/disable model we can copy for "swap context"?
- How does `anything-llm`'s workspace-switch model compare to our `WorkspaceAdapter` (one adapter per app, fixed at build time) — does it support swapping the *adapter itself* at runtime, which is what we'd need?
- How does `Dive`'s Electron→Tauri migration inform keeping `memopop-native` as the host vs. starting fresh?
- How does `OpenHands`'s event-stream/trajectory log map onto a cross-product trace/audit log?
- How does `continue`'s `.continue/` config loading handle per-project skill/rule swaps?

Notes land in each study's `context-v/inquiry/`, cited by path (`studies/<topic>/<repo>/<file>:<line>`), not summarized as prose.

## Phase 3 — Synthesis (still no code)

Write one new doc, `ai-labs/context-v/explorations/Cross-Product-Native-Agent-Shell.md`, that:

1. Resolves the fork: extend `memopop-native` into a multi-context shell vs. new standalone app — with reasoning from Phases 1–2, not a coin flip.
2. Defines what "context switching" concretely means: swapping which product's backend + `WorkspaceAdapter` + skillset + MCP servers are active, at runtime, without an app restart.
3. Defines the dynamic skill/MCP load-unload model — informed by whichever harness (opencode/goose/continue) has the cleanest answer.
4. Reconciles with the existing `@lossless/in-app-agent` spec: either revive it as the real shared package (retrofitting augment-it's bespoke code) or explicitly supersede it and say why.

This doc becomes the input to a *separate*, later implementation plan — not part of this one.

## Explicitly out of scope here

No package scaffolding, no submodule additions without a final confirmed list, no changes to `memopop-native`, `augment-it`, or `dididecks-ai` code. This plan only covers: setting up the two studies, the internal audit, the external reading pass, and one synthesis doc.

## Verification / done-when

- [ ] `ai-labs/studies/agent-harnesses/` and `ai-labs/studies/conversational-ui-and-native-shells/` exist with READMEs and confirmed submodules pinned.
- [ ] `ai-labs/studies/README.md` index updated.
- [ ] Internal audit note written (Phase 1 deliverable).
- [ ] Inquiry notes exist in both studies, keyed to the five targeted questions in Phase 2.
- [ ] `Cross-Product-Native-Agent-Shell.md` exists and states a clear recommendation on the memopop-native-vs-standalone fork.

## Related

- [[In-App-Agent-Chat-Walking-Skeleton]]
- [[Slides_Anatomy-of-the-In-App-Agent-Shell]]
- [[Slides_Per-App-Workspaces-and-the-Chat-as-Optional-Surface]]
- [[Slides_Agent-Capabilities_Hooking-the-Chat-Surface-into-Memopop]]
- `ai-labs/studies/README.md` — the studies index this plan adds two entries to
- `ai-labs/studies/memory-layers-for-agents/` — sibling study this one does not duplicate
- `ai-labs/studies/open-specs-and-standards/` — sibling study (AGENTS.md, SKILL.md, MCP spec) this one does not duplicate

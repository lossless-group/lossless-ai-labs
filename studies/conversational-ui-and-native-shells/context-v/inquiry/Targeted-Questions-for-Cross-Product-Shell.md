---
title: "Conversational UI / Native Shells — Answers to the Plan's Targeted Questions"
lede: "Phase 2 of the study plan. Not a survey of the study — two specific questions, answered by citing the profiles already written, in service of the Phase 3 synthesis decision."
date_created: 2026-07-13
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Sonnet 5
semantic_version: 0.0.0.1
tags:
  - Inquiry
  - Conversational-UI
  - Tauri
  - MCP
status: Draft
---

# Targeted Questions — Conversational UI and Native Shells

Per `ai-labs/context-v/plans/Study-Agent-Harnesses-and-Conversational-UI-Before-Cross-Product-Shell.md`, Phase 2. Answers cite the profiles in `context-v/profiles/`.

## Q1 — How does Dive's Electron→Tauri migration inform keeping `memopop-native` as the host vs. starting fresh?

**Dive** (`Profile__Dive.md`): the migration is **incomplete and partially reverted, not a clean cutover**. Tauri backend added 2025-07-28; macOS was moved to Tauri then explicitly reverted back to Electron just 25 days later (CI-only diff), and per the README's own platform table is *still* Electron-only ~11 months later. ~40 Tauri-tagged commits show steady incremental parity work, not a big-bang rewrite. Separately — and this is the more important architectural fact — **neither shell contains any agent/tool logic at all**: both the Tauri (`src-tauri/src/host.rs`) and Electron (`electron/main/service.ts`) builds just spawn the same `dive_httpd` Python subprocess and proxy its port; per-tool enable/disable lives entirely server-side in that subprocess, not in either native shell.

**Verdict for our shell:** two lessons, not one. (1) Migrating an *existing* Electron shell to Tauri is real, non-trivial, multi-month work with a documented partial-revert — this is evidence *for* extending `memopop-native` (already Tauri, no migration cost) rather than evidence that migration is easy. (2) Dive's actual architecture — native shell as a dumb process-spawner/proxy, all agent/tool/MCP logic in a separate backend process — is structurally identical to memopop-native's own `SidecarManager` pattern (spawn, healthz-probe, forward-by-proxy). This is independent confirmation, not just precedent: two unrelated projects converged on the same "native shell is a thin proxy in front of a real backend process" shape.

## Q2 — How does anything-llm's workspace-switch model compare to our `WorkspaceAdapter` — does it support swapping the adapter itself at runtime?

**anything-llm** (`Profile__Anything-LLM.md`): **No — verdict is shallow UI-level parameterization, not a full adapter swap.** A workspace is a Prisma/SQLite row (`chatProvider`, `chatModel`, `agentProvider`, `agentModel`, `openAiPrompt`, `slug`). Switching workspace in the UI is a React Router param change triggering a plain fetch — no adapter object is held across the switch. Server-side, `resolveProviderConnector` re-resolves the LLM connector from scratch per call (`workspace?.chatProvider || process.env.LLM_PROVIDER`), so LLM provider/model genuinely is per-workspace — but the vector DB is not: `getVectorDbClass()` is called with **zero arguments**, resolving one system-wide `process.env.VECTOR_DB` for the entire server. Per-workspace isolation there comes only from a slug-keyed namespace inside that one shared store. Net: one shared process, one DB connection, one vector-DB provider — workspaces vary parameters fed into a shared pipeline, not the pipeline itself.

**Verdict for our shell:** this is negative evidence, and useful precisely because it's negative. anything-llm's "workspace" is the wrong reference architecture for "swap between augment-it/dididecks/memopop" if those three genuinely need different backends, different auth, different data models (which they do — see the internal audit). Copying anything-llm's pattern would produce something that *looks* like context-switching in the UI but silently shares state across contexts underneath, which is exactly the kind of bug that's invisible until two contexts collide. Our `WorkspaceAdapter` seam (even though never fully built) was aimed at the right problem — a real swappable object, not a shared backend with a namespace param — and this profile is evidence to keep that ambition rather than settle for anything-llm's shallower shape.

## Related

- `ai-labs/context-v/plans/Study-Agent-Harnesses-and-Conversational-UI-Before-Cross-Product-Shell.md`
- `context-v/profiles/Profile__Dive.md`, `Profile__Anything-LLM.md`
- `ai-labs/context-v/explorations/Cross-Product-Native-Agent-Shell.md` — where these verdicts get used

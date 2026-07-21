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
from: "studies/conversational-ui-and-native-shells"
from_path: "context-v/inquiry/Targeted-Questions-for-Cross-Product-Shell.md"
---
# Targeted Questions — Conversational UI and Native Shells

Per `ai-labs/context-v/plans/Study-Agent-Harnesses-and-Conversational-UI-Before-Cross-Product-Shell.md`, Phase 2. Answers cite the profiles in `context-v/profiles/`.

## Q1 — How does Dive's Electron→Tauri migration inform the build-vs-migrate decision for a Tauri-based shell?

**Dive** (`Profile__Dive.md`): the migration is **incomplete and partially reverted, not a clean cutover**. Tauri backend added 2025-07-28; macOS was moved to Tauri then explicitly reverted back to Electron just 25 days later (CI-only diff), and per the README's own platform table is *still* Electron-only ~11 months later. ~40 Tauri-tagged commits show steady incremental parity work, not a big-bang rewrite. Separately — and this is the more important architectural fact — **neither shell contains any agent/tool logic at all**: both the Tauri (`src-tauri/src/host.rs`) and Electron (`electron/main/service.ts`) builds just spawn the same `dive_httpd` Python subprocess and proxy its port; per-tool enable/disable lives entirely server-side in that subprocess, not in either native shell.

**Takeaway:** two lessons, not one. (1) Migrating an *existing* Electron shell to Tauri is real, non-trivial, multi-month work with a documented partial-revert — evidence that starting fresh on Tauri avoids that migration cost, rather than evidence that migration itself is easy. (2) Dive's actual architecture — native shell as a dumb process-spawner/proxy, all agent/tool/MCP logic in a separate backend process — is a clean, portable pattern worth copying generally: keep the native shell thin (spawn a backend process, health-check it, proxy requests, shut it down cleanly) and let a separate long-running process own the actual agent/tool/MCP logic.

## Q2 — Does anything-llm's workspace-switch model achieve a genuine swappable-backend-per-context architecture?

**anything-llm** (`Profile__Anything-LLM.md`): **No — verdict is shallow UI-level parameterization, not a full adapter swap.** A workspace is a Prisma/SQLite row (`chatProvider`, `chatModel`, `agentProvider`, `agentModel`, `openAiPrompt`, `slug`). Switching workspace in the UI is a React Router param change triggering a plain fetch — no adapter object is held across the switch. Server-side, `resolveProviderConnector` re-resolves the LLM connector from scratch per call (`workspace?.chatProvider || process.env.LLM_PROVIDER`), so LLM provider/model genuinely is per-workspace — but the vector DB is not: `getVectorDbClass()` is called with **zero arguments**, resolving one system-wide `process.env.VECTOR_DB` for the entire server. Per-workspace isolation there comes only from a slug-keyed namespace inside that one shared store. Net: one shared process, one DB connection, one vector-DB provider — workspaces vary parameters fed into a shared pipeline, not the pipeline itself.

**Takeaway:** a useful negative example. anything-llm's "workspace" pattern is the wrong reference architecture for any use case where different contexts genuinely need different backends, different auth, or different data models. Copying this pattern would produce something that *looks* like context-switching in the UI but silently shares state across contexts underneath — exactly the kind of bug that's invisible until two contexts collide over a shared resource. The lesson: build a real swappable adapter object per context, not a shared backend parameterized by a namespace/slug field.

## Related

- `context-v/profiles/Profile__Dive.md`, `Profile__Anything-LLM.md`

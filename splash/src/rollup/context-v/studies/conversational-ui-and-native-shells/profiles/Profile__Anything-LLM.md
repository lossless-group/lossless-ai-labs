---
name: AnythingLLM Profile
title: "AnythingLLM — Profile"
slug: anything-llm
upstream: https://github.com/mintplex-labs/anything-llm
package: n/a (Node/Express server + collector service + React frontend; distributed as Docker image and a documented desktop/Electron build not present in this pinned checkout)
license: MIT
maintainer: Mintplex Labs Inc. (Timothy Carambat)
study: studies/conversational-ui-and-native-shells
profile_path: studies/conversational-ui-and-native-shells/anything-llm
profile_kind: Node/Express backend + Prisma/SQLite + React frontend, multi-user document-chat platform
date_created: 2026-07-13
date_modified: 2026-11-23
site_uuid: 7c95712a-ae10-4fbe-a60b-05ecb1e98e79
hex_code: j3p25r
date_authored_initial_draft: 2026-07-13
date_authored_current_draft: 2026-11-23
authors:
  - Michael Staton
lede: >-
  A "workspace" is a config row over one always-shared backend: the chat
  provider varies per workspace, the vector DB never can.
summary: >-
  Source-cited profile of the AnythingLLM submodule for the
  conversational-UI-and-native-shells study, and the study's workspace-switching
  reference. Opens with a correction to the study brief: this checkout is the
  Docker/Node web app (`server/`, `collector/`, `frontend/`), not a native shell, so it
  answers nothing about Tauri-vs-Electron — use `Profile__Dive.md` and `Profile__5ire.md`
  for that. Its load-bearing content is the answer to the study's sub-inquiry 2
  ("adapter swap or shallow filter?"): the `workspaces` Prisma row parameterizes one
  shared Express process; `resolveProviderConnector` rebuilds the LLM connector from
  `workspace.chatProvider` on every chat call, while `getVectorDbClass()` takes no
  workspace argument at all and resolves `process.env.VECTOR_DB` for the whole server,
  with per-workspace isolation coming only from a `slug`-keyed namespace/table.
  An agent should cite this profile when arguing that config-row parameterization is
  not equivalent to per-context adapter isolation, and should read `Profile__Routa.md`
  for the positive counterpart.
status: Reference
publish: true
type: Profiles
from: "studies/conversational-ui-and-native-shells"
from_path: "context-v/profiles/Profile__Anything-LLM.md"
---
# AnythingLLM — Profile

A profile of AnythingLLM as it lives in this study (`studies/conversational-ui-and-native-shells/anything-llm/`). `LICENSE:1-3` confirms MIT, "Copyright (c) Mintplex Labs Inc."; `package.json:2-8` confirms `"name": "anything-llm"`, `"version": "1.20.0"` (1.15.0 when first drafted), `"author": "Timothy Carambat (Mintplex Labs)"`. **Correction to the study brief**: this pinned checkout has no `electron/` directory anywhere in the tree (`find … -iname "*electron*"` returns nothing outside `CONTRIBUTING.md` prose) — AnythingLLM here is the self-hosted Docker/Node web app (`docker/`, `server/`, `collector/`, `frontend/`), not an Electron desktop shell. Read this profile as the study's **workspace-switching reference**, not a native-shell reference; pair with `Profile__Dive.md` and `Profile__5ire.md` for the shell-strategy questions.

## TL;DR

The README states its own scope plainly:

> **AnythingLLM:** The all-in-one AI app you were looking for.
> Chat with your docs, use AI Agents, hyper-configurable, multi-user, & no frustrating setup required.

Mechanically, the thing this study most needs to know: **"switching workspace" in AnythingLLM is a route-param change plus a per-request database lookup — not an adapter swap.** A `workspaces` row (`server/prisma/schema.prisma:121-152`) is a plain relational record carrying `chatProvider`, `chatModel`, `agentProvider`, `agentModel`, `openAiPrompt` (the system prompt, `schema.prisma:130-131`), `vectorTag`/`slug` (the vector-namespace key), `similarityThreshold`, `topN`, `chatMode`, and `vectorSearchMode`. The frontend route is `path: "/workspace/:slug"` (`frontend/src/main.jsx:48`); `ShowWorkspaceChat` (`frontend/src/pages/WorkspaceChat/index.jsx:27-81`) reacts to the `slug` param changing by calling `Workspace.bySlug(slug)` in a `useEffect` and setting local React state — a plain fetch-on-navigation, no provider/connection object held across the switch. Server-side, `streamChatWithWorkspace` (`server/utils/chats/stream.js:24-33`) receives the already-loaded `workspace` row as a plain argument and, **on every single chat call**, re-derives the LLM connector via a thin `resolveLLMConnector` wrapper (`stream.js:72`, defined at `stream.js:398-422`) around `resolveProviderConnector` (`server/utils/helpers/index.js:729-799`), which computes `const effectiveProvider = workspace?.chatProvider || process.env.LLM_PROVIDER` (line 740) and calls `getLLMProvider({ provider: workspace?.chatProvider, model: workspace?.chatModel, temperature: ... })` (lines 747-751) — a `require(...)` + `new SomeProviderLLM(...)` factory call, freshly constructed per request, never cached across requests or held in a session object. The vector DB is a **system-wide** choice, by contrast: `getVectorDbClass()` (`server/utils/chats/stream.js:103`) is called with **no arguments**, resolving `process.env.VECTOR_DB ?? "lancedb"` (`server/utils/helpers/index.js:88`) — one vector-DB provider for the whole running instance, every workspace included. Per-workspace isolation within that one shared vector DB happens by **namespace**, not by provider swap: `VectorDb.hasNamespace(workspace.slug)` / `VectorDb.namespaceCount(workspace.slug)` (`stream.js:106-107`) and, in the LanceDB provider, `client.openTable(_namespace)` (`server/utils/vectorDbProviders/lance/index.js:83,108`) opens a distinct table keyed by the workspace's slug inside the one shared LanceDB directory.

If you want one sentence: **AnythingLLM's "workspace" is a database row that parameterizes one shared, stateless request-handling pipeline — the LLM provider/model can differ per workspace because the connector is rebuilt from scratch on every chat call by reading `workspace.chatProvider`/`chatModel`, but the vector-DB *provider* is a single global `process.env.VECTOR_DB` setting for the whole server, with per-workspace isolation coming only from a namespace/table keyed by `workspace.slug` — this is UI-level routing over one shared backend, not a runtime adapter swap.**

## The Workspace schema — one row, many per-request-resolved fields

`workspaces` (`server/prisma/schema.prisma:121-152`) is the crux table:

```
model workspaces {
  id                  Int      @id @default(autoincrement())
  name                String
  slug                String   @unique
  vectorTag           String?
  openAiTemp          Float?
  openAiHistory       Int      @default(20)
  openAiPrompt        String?   // THIS IS THE SYSTEM PROMPT FOR THE WORKSPACE
  similarityThreshold Float?   @default(0.25)
  chatProvider        String?
  chatModel           String?
  topN                Int?     @default(4)
  chatMode            String?  @default("chat")
  agentProvider       String?
  agentModel          String?
  queryRefusalResponse String?
  vectorSearchMode    String?  @default("default")
  router_id           Int?
  ...
}
```

- **`chatProvider`/`chatModel` vs. `agentProvider`/`agentModel`** are two independent override pairs — a workspace can use one LLM for plain chat and a different one when its "@agent" mode is invoked (`server/utils/helpers/agents.js` reads `agentProvider`/`agentModel` separately from the chat path).
- **`Workspace.writable`** (`server/models/workspace.js:41-59`) is the whitelist of fields a PATCH request may touch — `slug` and `vectorTag` are commented out (lines 43-44), i.e. explicitly *not* mutable post-creation, because they're the identity keys the vector namespace and every foreign-key relation hang off of.
- **Per-field validators run on every write.** `server/models/workspace.js:61-146` — e.g. `chatProvider: (value) => { if (!value || typeof value !== "string" || value === "none") return null; return String(value); }` (lines 101-104) and `chatMode` falling back to `"automatic"` if not one of `Workspace.VALID_CHAT_MODES` (lines 36, 96-100) — so a workspace's provider override is validated shallowly (is it a non-empty string) but not checked against the live list of installed/configured providers at write time; an invalid provider name only surfaces as an error at the next chat call.
- **`router_id`** (`schema.prisma:142`) links to `model_routers`/`model_router_rules` (`schema.prisma:448-487`) — a rules engine (`condition_logic: "AND"|"OR"`, `route_provider`, `route_model`) that can override even the workspace's own `chatProvider` based on runtime conditions; `resolveProviderConnector` special-cases this: `if (effectiveProvider !== "anythingllm-router") { ...direct getLLMProvider... }` (`server/utils/helpers/index.js:745-756`), else it defers to `AnythingLLMModelRouter` (referenced in a guard comment at line 297 of the same file). This is a third layer of "which model actually answers" sitting above the plain per-workspace override.

## The provider-resolution chokepoint — rebuilt per request, not per session

`getVectorDbClass(getExactly = null)` (`server/utils/helpers/index.js:87-127`) and `getLLMProvider({ provider, model, temperature })` (lines 153-165, which delegates the provider switch to `getLLMProviderConnector` at line 172+) are both **factory functions**: a `switch` on a string, a `require(...)` of the matching module, and a `new SomeClass(...)` — called fresh every time, nothing cached in module-level state. The vector DB switch has ten cases (`pinecone`, `chroma`, `chromacloud`, `lancedb`, `weaviate`, `qdrant`, `milvus`, `zilliz`, `astra`, `pgvector` — lines 89-119) keyed off `getExactly ?? process.env.VECTOR_DB ?? "lancedb"` (line 88) — **no workspace argument accepted at all**. The LLM switch has 20+ cases (`server/utils/AiProviders/` holds directories for `openAi`, `azureOpenAi`, `anthropic`, `gemini`, `ollama`, `lmStudio`, `localAi`, `togetherAi`, `fireworksAi`, `perplexity`, `openRouter`, `mistral`, `groq`, `xai`, `bedrock`, `cohere`, `deepseek`, `nvidiaNim`, `koboldCPP`, `textGenWebUI`, `sambanova`, `foundry`, `moonshotAi`, `llmman` (which replaced `dockerModelRunner`), `novita`, `apipie`, `minimax`, `genericOpenAi`, `giteeai`, `cerebras`, `cometapi`, `liteLLM`, `zai`, `privatemode`, `ppio`, `lemonade`, `embeddedLemonade`, `vertex`, `omlx`, `modelRouter` — one directory per provider under `server/utils/AiProviders/`) and **does** accept `provider`/`model`, sourced from the workspace row one call up the stack (`resolveProviderConnector`, `server/utils/helpers/index.js:729-799`). `EmbeddingEngines/` mirrors the same one-directory-per-provider pattern (`lmstudio`, `voyageAi`, `cohere`, `gemini`, `openRouter`, `native`, `azureOpenAi`, `localAi`, `genericOpenAi`, `lemonade`, `ollama`, `liteLLM`, `mistral`, `openAi`) but `getEmbeddingEngineSelection()` (line 313) is read as a **system setting**, same shape as the vector DB — not a workspace field in the Prisma schema.

So the study's precise question — "is this a full adapter swap or a shallow filter" — has a two-part answer inside AnythingLLM itself: **the LLM connector is workspace-parameterized (shallow in mechanism, but genuinely per-workspace in effect — two workspaces really can talk to two different model providers)**, while **the vector DB and embedding-model choice are system-wide, workspace-scoped only by namespace/table key**. Neither is a "swap the whole running adapter object for the session" pattern — both are stateless factories re-resolved from a database row on every single request.

## Vector namespace isolation — one shared store, `slug`-keyed tables

- `streamChatWithWorkspace` (`server/utils/chats/stream.js:103`) calls `getVectorDbClass()` with zero arguments — confirms one active vector DB class per running server process, full stop.
- Namespace existence/count checks (`stream.js:106-107`) pass `workspace.slug`, and a query-mode chat against an empty workspace short-circuits with `workspace?.queryRefusalResponse ?? "There is no relevant information in this workspace..."` (`stream.js:110-115`) — another per-workspace override field read at request time.
- The LanceDB provider's `namespaceCount`/`hasNamespace`/similarity-search methods (`server/utils/vectorDbProviders/lance/index.js:78-112, 189+`) all take a `namespace` string and call `client.openTable(namespace)` — LanceDB tables are the isolation unit, one table per workspace slug inside a single shared LanceDB directory. `workspace_documents` (`schema.prisma:27-40`) ties uploaded/embedded documents to `workspaceId` at the relational-DB level, independent of the vector store's own per-namespace partitioning — two layers of scoping (Prisma FK + vector-store namespace) for the same workspace boundary.

## Multi-user and multi-tenancy — roles and per-workspace membership, still one shared instance

- `users` (`schema.prisma:61-90`) has a `role` field (default `"default"`) and relations into `workspace_chats`, `workspace_users`, `embed_configs`, `threads`, `memories`, etc.
- `workspace_users` (`schema.prisma:214-222`) is the join table — a user can belong to N workspaces, a workspace can have N users — confirming per-workspace access control sits **above** the shared backend rather than each workspace running an isolated process.
- `workspace_threads` (`schema.prisma:154-168`) further partitions a single workspace's chat history into named threads (`slug`-unique), each optionally tied to a `user_id` — sub-workspace conversation isolation, still all against the one shared `workspaces` row's provider/vector settings.
- `memories` (`schema.prisma:431-446`) has a `scope` field (default `"workspace"`) with an index on `[userId, workspaceId]` and `[userId, scope]` — long-term memory is explicitly scoped per-workspace-per-user, another field-level (not adapter-level) partition.

## System prompt / persona injection

`chatPrompt(workspace, user, opts)` (`server/utils/chats/index.js:129-151`) is the single place the system prompt is assembled: `const basePrompt = workspace?.openAiPrompt ?? SystemSettings.saneDefaultSystemPrompt;` (lines 132-133), then run through `SystemPromptVariables.expandSystemPromptVariables(basePrompt, user?.id, workspace?.id)` (lines 134-138, merge-tag substitution keyed by the `system_prompt_variables` table, `schema.prisma:337-349`), then through `promptWithMemories(...)` (line 144, skipped when `opts.skipMemories` is set) which appends any workspace/user-scoped long-term memories before the message is sent. Same pattern as everything else in this file: read one field off the already-fetched workspace row, no separate persona object or session-bound prompt-builder instance.

## What's inside this submodule

| Path | What's there |
|---|---|
| `server/prisma/schema.prisma` | The full relational schema — `workspaces` (the crux model), `workspace_users`, `workspace_threads`, `workspace_documents`, `memories`, `model_routers`/`model_router_rules` |
| `server/models/workspace.js` | `Workspace.writable` whitelist, per-field validators, `bySlug`/`new`/update logic |
| `server/utils/helpers/index.js` | `getVectorDbClass` (system-wide factory), `getLLMProvider` (per-workspace-parameterized factory), `resolveProviderConnector` (the `workspace.chatProvider \|\| process.env.LLM_PROVIDER` chokepoint), `getEmbeddingEngineSelection` |
| `server/utils/chats/stream.js` | `streamChatWithWorkspace` — the actual per-request pipeline: connector resolution, namespace check, streaming response |
| `server/utils/chats/index.js` | `chatPrompt` — system-prompt assembly + memory injection |
| `server/utils/AiProviders/*` | One directory per chat-LLM provider (20+), sharing a `BaseLLMProvider`-style contract |
| `server/utils/EmbeddingEngines/*` | One directory per embedding provider (14), same pattern, system-scoped not workspace-scoped |
| `server/utils/vectorDbProviders/*` | One directory per vector DB (10: pinecone, chroma, chromacloud, lancedb, weaviate, qdrant, milvus, zilliz, astra, pgvector) |
| `collector/` | Separate Node service — document ingestion/parsing (`processSingleFile/`, `processLink/`, `processRawText/`, `convertAudioToWav/`) that feeds embeddings into the vector store, decoupled from the chat-serving `server/` process |
| `frontend/src/main.jsx` | React Router route table — `/workspace/:slug`, `/workspace/:slug/settings/:tab` |
| `frontend/src/pages/WorkspaceChat/index.jsx` | `ShowWorkspaceChat` — the actual switch mechanism: `useParams()` → `Workspace.bySlug(slug)` → local state |
| `frontend/src/models/workspace.js` | Frontend API client for workspace CRUD/fetch |
| `docker/` | The shipped deployment target (Docker image) — no Electron packaging present in this checkout |

If you read three files: `server/prisma/schema.prisma` (the whole workspace shape lives here), `server/utils/helpers/index.js` (both factory functions plus the `resolveProviderConnector` chokepoint that decides per-workspace vs. system default), and `server/utils/chats/stream.js` (proof that both factories are invoked fresh on every single chat call, not cached per workspace or per session).

## Mental model for using it well

- **Treat a "workspace" as a config row, not a runtime object.** Nothing in AnythingLLM holds a live "active workspace" connector in memory across requests — every chat call re-reads the row and re-resolves both the LLM connector and (implicitly) the vector namespace from scratch.
- **Distinguish what's workspace-scoped from what's system-scoped before assuming full isolation.** LLM chat/agent provider: per-workspace (`chatProvider`/`chatModel`/`agentProvider`/`agentModel` fields). Vector DB *provider* and embedding *provider*: system-wide (`process.env.VECTOR_DB`, `getEmbeddingEngineSelection()`). Vector *namespace*: per-workspace, via `slug`.
- **The provider-abstraction shape here is the same "closed switch + one class per provider" pattern seen in Kaas's `LLMClient` enum** — but implemented as an ordinary JS `switch`/`require`/`new` factory rather than a typed enum, and resolved fresh per call rather than constructed once and reused.
- **If you need "swap the entire backend/data-layer per context,"** this is not that: two AnythingLLM workspaces still share one Express process, one Prisma/SQLite connection, one vector-DB provider, and one embedding-provider setting. They differ only in the *parameters* fed into that shared pipeline (system prompt, chat provider/model, similarity threshold, namespace).

## When NOT to reach for this

- **You need genuinely isolated adapters per context** (e.g., three distinct SurrealDB/product backends behind three different Tauri sidecars, as in the target architecture this study serves). AnythingLLM's workspace is a config row over ONE shared backend — it cannot express "workspace A talks to a completely different vector DB engine than workspace B," only "workspace A talks to a different namespace/table in the one engine the whole server is configured for."
- **You want a native desktop shell reference.** This checkout has no Electron (or Tauri) wrapper at all — it is a Docker/Node web app. `dive` and `5ire` are the study's actual shell-comparison entries.
- **You want compile-time-checked provider dispatch.** The `getLLMProvider`/`getVectorDbClass` switches are plain untyped JS `switch` statements over strings — contrast with Kaas's closed Rust `enum LLMClient`, where an invalid provider is a compile error, not a runtime `null`/exception surfaced only when a chat is attempted.
- **You need per-workspace embedding-model or vector-DB-provider choice.** Both are read from system-level settings/env, not from the `workspaces` table — if the target architecture needs "app A embeds via one model into one vector engine, app B into a completely different one," AnythingLLM's schema has no field for that distinction.

## How this compares to the rest of the study

| Axis | AnythingLLM | dive | 5ire |
|---|---|---|---|
| **Shell** | None in this checkout — Docker/Node web app (`docker/`, `server/`, `frontend/`) | Tauri **and** Electron (dual-shipped) | Electron |
| **Persistence** | Prisma over SQLite (`server/prisma/schema.prisma`), relational, code-migrated | (see `Profile__Dive.md`) | (see `Profile__5ire.md`) |
| **"Workspace"/context-switch model** | DB row (`workspaces`) parameterizing one shared Express process; LLM provider/model overridable per-row, vector-DB provider system-wide, namespace-scoped by `slug` | (see `Profile__Dive.md`) | (see `Profile__5ire.md`) |
| **LLM provider abstraction** | Untyped JS switch/factory, 20+ provider directories under `server/utils/AiProviders/`, resolved fresh per chat call from `workspace.chatProvider` | — | — |
| **Vector DB abstraction** | Untyped JS switch/factory, 10 providers under `server/utils/vectorDbProviders/`, **system-wide only** (`process.env.VECTOR_DB`), namespace = `workspace.slug` | — | — |
| **Multi-user** | `users`/`workspace_users` join table, roles, per-user+workspace `memories` scope | — | MCP-client + server marketplace (per study index) |
| **System prompt / persona** | `workspaces.openAiPrompt`, expanded via merge-tag variables + memory injection at `chatPrompt()` | — | — |
| **Best fit** | Reference for "one shared backend, N context rows" workspace switching — closest existing pattern to a config-driven multi-context UI, explicitly **not** a per-context adapter swap | Tauri/Electron dual-shell + MCP host comparison | Electron + mature local persistence + MCP marketplace comparison |

AnythingLLM's load-bearing contribution to this study is the **negative result on sub-inquiry 2**: its workspace-switch model is config-row parameterization of one always-shared backend (Express process, Prisma connection, vector-DB provider, embedding provider), not a runtime adapter swap. The one axis where it *does* genuinely vary per-workspace — which LLM provider/model answers — works because the LLM-provider factory happens to accept a `provider`/`model` argument sourced from the row; the vector-DB and embedding-provider factories do not accept any such argument, so those two concerns are hard system-wide settings no workspace can override. A true per-context adapter design (swapping the entire data/backend layer, not just a couple of parameters within one layer) is **not** what this codebase demonstrates.

## Changes since the previous pin (2026-07-10 → 2026-11-20)

Old pin `4482fd625f74`, new pin `472b1e3f4715`: 559 commits. Releases in range: v1.16.0, v1.16.1, v1.16.2, v1.17.0, v1.18.0, v1.19.0, v1.20.0 (`package.json` now says `1.20.0`). The thesis holds: a workspace is still a config row over one shared backend. `server/prisma/schema.prisma` is unchanged, `getVectorDbClass()` still takes no workspace argument and reads `process.env.VECTOR_DB`, and `resolveProviderConnector` still rebuilds the connector from `workspace.chatProvider` on each call. Line citations above were re-located at the new pin. The tree still has no `electron/` or desktop directory.

- **Workspace settings now reach agent sessions mid-thread.** Commit `91e26f912` (#6673) re-reads the workspace row on each agent turn in `server/utils/agents/index.js`, so a model change applies without restarting the session, and #6285 applies the workspace temperature to agents. This fits the profile's model: more per-request reads of the row, not a held adapter.
- **MCP servers can receive workspace identity.** Commit `db4bb7c4a` (#7038) adds an opt-in `anythingllm.forwardIdentity` setting per MCP server (`server/utils/MCP/identity.js`). Tool list and call requests then carry `X-AnythingLLM-*` headers on HTTP transports and `_meta["com.anythingllm/identity"]` on every transport, with `workspace.id` and `workspace.slug` among the fields. This is the first place a workspace identity crosses into a tool backend, though the MCP servers themselves are still shared across workspaces. Related: per-server MCP tool call timeouts (#6948) and developer API endpoints for MCP management (#7037).
- **Workspace switching ignores late responses.** `ShowWorkspaceChat` now sets a `cancelled` flag in its `useEffect` cleanup so a slow `Workspace.bySlug` response for the previous slug cannot overwrite the new one, and shows a loader after 300 ms (`frontend/src/pages/WorkspaceChat/index.jsx`, #7297). The switch is still fetch-on-navigation.
- **Provider churn.** `server/utils/AiProviders/` gained `llmman` (replacing `dockerModelRunner`), `vertex`, `omlx`, and `embeddedLemonade`. LanceDB similarity now floors cosine distance at or past 1.0 to a similarity of 0 and filters below-threshold chunks before reranking (`server/utils/vectorDbProviders/lance/index.js`).

## One-line summary

> AnythingLLM's "workspace" is a Prisma/SQLite row (`chatProvider`, `chatModel`, `agentProvider`, `agentModel`, `openAiPrompt`, `vectorTag`/`slug`) that parameterizes one always-running, shared Express backend — switching workspace in the UI is a React Router param change (`/workspace/:slug`) that triggers a plain `Workspace.bySlug()` fetch, and every chat request re-resolves its LLM connector fresh from that row via an untyped JS factory (`getLLMProvider`, keyed by `workspace.chatProvider`), while the vector-DB provider and embedding provider stay fixed for the whole server (`process.env.VECTOR_DB`), with per-workspace isolation coming only from a `slug`-keyed namespace/table inside that one shared vector store — a UI-level, row-parameterized filter over a single backend, not the full per-context adapter swap this study's target architecture needs.

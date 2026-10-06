---
name: Agent-Native Profile
slug: agent-native
upstream: https://github.com/BuilderIO/agent-native
package: "@agent-native/core (framework + CLI), @agent-native/dispatch, @agent-native/toolkit, plus Electron/Expo/VS Code shells — pnpm monorepo, 24 packages, 17 first-party templates"
license: "No root LICENSE file; root package.json says ISC, every published package.json under packages/ says MIT, only packages/vscode-extension/LICENSE.md exists as a file. GitHub's license classifier returns null. Reconcile before treating as MIT."
maintainer: Builder.io (Steve Sewell ~3.5k of ~6.7k commits at this pin; builder-io-integration[bot] next)
study: studies/conversational-ui-and-native-shells
profile_path: studies/conversational-ui-and-native-shells/agent-native
profile_kind: Web-first agent+UI application framework (Nitro/H3 + React Router + Postgres/PGlite) with an Electron webview-per-app shell, an Expo webview shell, and a cross-app control plane (Dispatch) over A2A and MCP
pinned_at: 1452a82854 (2026-10-03)
date_created: 2026-10-04
site_uuid: e77dacb3-337b-44a5-ba19-3f8b4d7c29f5
hex_code: fqbquh
date_authored_initial_draft: 2026-10-04
date_authored_current_draft: 2026-10-04
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
lede: >-
  The chat isn't bolted onto the app. The app's operations are one action
  registry that the UI, the agent, MCP, A2A and the CLI all call, and the
  conversation is just one more caller.
summary: >-
  Source-cited profile of Builder.io's agent-native framework for the
  conversational-UI-and-native-shells study. Its contribution is a different answer
  to "how is conversation state kept in sync with the app": it isn't a separate
  chat product with an adapter to a backend, it's an app framework in which every
  operation is a `defineAction` that is simultaneously an agent tool, a React Query
  hook, an HTTP route, an MCP tool and an A2A skill, and the agent learns what the
  user is looking at from a SQL `application_state` table the UI writes on every
  route change. Multi-context is solved by composition, not by swapping: many
  small apps, one Postgres, one auth, A2A between them, and Dispatch as the control
  plane for vault secrets, connections, routing and a single MCP gateway. The
  Electron shell is the thinnest possible host — one persistent `<webview>` per app,
  each in its own session partition, never unmounted. Per-user skills, memory,
  instructions, sub-agents and MCP servers live as path-addressed rows in one
  `resources` table and are layered into the prompt each turn. Caveats: Electron not
  Tauri, Postgres-only, Netlify-shaped in practice, and several places where the
  repo's own skills and docs disagree with its code.
tags:
  - Study-Profile
  - Conversational-UI
  - Agent-Native
  - Electron
  - MCP
  - A2A
publish: true
from: "studies/conversational-ui-and-native-shells"
from_path: "context-v/profiles/Profile__Agent-Native.md"
---
# Agent-Native — Profile

A profile of Builder.io's agent-native framework as it lives in this study (`studies/conversational-ui-and-native-shells/agent-native/`, pinned at `1452a82854`, 2026-10-03). It's the first entry in the study that isn't a chat app at all. It's a framework for building ordinary SaaS apps (mail, calendar, slides, CRM, forms) in which the chat agent is a full participant in the app's operations, not an assistant sitting beside them. Read it alongside `Profile__Routa.md` (a per-session process swap under one coordinator) and `Profile__Anything-LLM.md` (config-row workspaces over one backend). Agent-native answers the multi-context question a third way: **don't swap backends inside one shell; compose many small apps that share one database and one identity, and let their agents call each other.**

**Provenance note.** `QueTea333/agent-native` is a non-fork copy of this repo, frozen 2026-06-07, with three PRs of its own "Phase 0/1" Mail/Calendar work on top. Its `package.json` still points `repository.url` at `https://github.com/BuilderIO/agent-native`. This study pins the upstream.

## TL;DR

The repo states its own thesis in one line (`AGENTS.md:3-5`):

> This repository builds apps where the AI agent and UI are equal partners: everything the UI can do, the agent can do through the same SQL data and action surface.

`PRODUCT.md:19` extends it: "Application operations are defined once as shared actions and exposed across UI, agent, HTTP, MCP, A2A, and CLI surfaces. The agent is part of the application contract rather than a separate assistant layered on top."

Mechanically there are three moves:

1. **One action, many callers.** `defineAction` (`packages/core/src/action.ts:545-793`) turns a Zod schema plus a `run` function into an object carrying both a tool definition (`{ tool: { description, parameters }, run, http, agentTool, … }`, `:712-792`) and a run function that knows who called it: `ActionCaller = "tool" | "http" | "frontend" | "cli" | "mcp" | "webmcp" | "a2a" | "automation"` (`:21-29`). The agent and the React UI execute the identical `run`.
2. **The agent reads the screen from SQL.** The UI writes its route, URL and Cmd+I selection into an `application_state` key/value table. The server reads those keys before every turn and appends them to the user message as `<current-screen>`, `<current-url>` and `<selection>` blocks.
3. **Multi-context by composition.** A "workspace" is a pnpm monorepo of apps that share one `DATABASE_URL` and one Better Auth org, find each other through `/.well-known/agent-card.json`, and call each other over A2A. Dispatch is the control plane. The Electron shell just hosts each app in its own persistent `<webview>`.

One sentence: **agent-native puts the chat and the app on the same footing by making the action registry, not the conversation, the source of truth. The agent is one more caller of that registry, it learns what's on screen from rows the UI writes to SQL, and "switching context" means switching which app's webview is visible, not re-pointing one chat at a different backend.**

## The action surface: one registry, eight callers

- **The design rule.** `.agents/skills/actions/SKILL.md:17`: "Actions in `actions/` are the **single source of truth** … The agent calls them as tools, the frontend calls them through `useActionQuery` / `useActionMutation` … no duplicate `/api/` routes." The filename is the action name (`:29`). `http` chooses how it's exposed (`POST /_agent-native/actions/:name` by default, `{method:"GET"}` for reads, `false` for none, `:74-82`), and `agentTool: false` hides an action from the model while keeping it callable by the UI (`:65`). `AGENTS.md:226-231` enforces this with a guard: new hand-written `/api/*` CRUD fails `guard:no-action-twin-routes`.
- **One `run` wrapped in policy layers.** `defineAction` builds the JSON Schema from the Zod schema (`schemaToJsonSchema`, `action.ts:563`), then wraps `run` in access checks (`:582-585`), a `uiOnly` guard that throws when the caller isn't the frontend (`:586-597`), input and output validation (`:599-619`), audit (`:636-638`) and action tracking (`:639`).
- **Discovery.** `autoDiscoverActions` scans `actions/` (`packages/core/src/server/action-discovery.ts:390-399`), falls back to a generated static registry for serverless bundles (`:403-431`), then merges in package, workspace and core sharing actions (`:442-462`).
- **Action → agent tool.** `actionsToEngineTools` (`packages/core/src/agent/production-agent.ts:3485-3505`) skips `agentTool === false` and `uiOnly` entries and emits `{ name, description, inputSchema }`. In the loop, a tool call is literally `actionEntry.run(toolCall.input, actionContext)` with `caller: "tool"` (`:6774`, `:6792-6796`).
- **Action → UI hook.** `mountActionRoutes` (`packages/core/src/server/action-routes.ts:1161`, prefix `/_agent-native/actions`, `:127`) tags the caller as `frontend`, `http` or `a2a` (`:922-928`) and calls the same `entry.run` (`:980`). On the client, `useActionQuery` keys queries as `["action", name, params]` and `useActionMutation` invalidates `["action"]` on success (`packages/core/src/client/use-action.ts:1024-1071, 1118`). The same registry also produces a WebMCP manifest (`action-routes.ts:1169-1224`), an MCP server (below) and A2A agent-card skills (from actions marked `publicAgent`, `.agents/skills/a2a-protocol/SKILL.md:226`).
- **"All AI work goes through the agent chat. UIs do not call LLMs directly"** (`AGENTS.md:258`). An AI button in the UI sends a chat message; it doesn't call an LLM endpoint of its own.

## Shared state: how an agent edit shows up in the UI

- **`application_state` is a raw-SQL key/value table**: `(session_id, key, value, updated_at, PRIMARY KEY (session_id, key))` (`packages/core/src/application-state/store.ts:22-28`). `session_id` resolves to the user's email or capability (`script-helpers.ts:17-35`). Some keys are scoped to a browser tab by suffix (`navigation`, `navigate`, `__url__`, `__set_url__`, `settings-view`, `pending-selection-context`, `script-helpers.ts:104-111, 136-139`), and agent writes are tagged `requestSource: "agent"` (`:48-50`). `AGENTS.md:259-260` makes it a contract: "Application state belongs in SQL `application_state` so the agent can know the current navigation, selection, and focused object."
- **Agent edits reach the UI over the chat stream, not a sync channel.** When a tool finishes, the chat SSE processor fires a window event `agent-native:tool-done` with the side effect (`sse-event-processor.ts:1905-1925`). `useDbSync` turns that into action-source events, bumps local version counters and invalidates queries (`packages/core/src/client/use-db-sync.ts:1746-1796`). The `real-time-sync` skill says so plainly: "A local agent edit does not meet this rule. The chat run stream already invalidates action queries" (`.agents/skills/real-time-sync/SKILL.md:20-22`).
- **Background sync is opt-in and must justify itself.** `GET /_agent-native/poll` and `GET /_agent-native/events` (SSE) exist (`core-routes-plugin.ts:2740-2741`), backed by `sync_events` and `sync_version` tables (`server/poll.ts:495, 537`). A page subscribes only with `useDbSync({ realtime: { reason } })` (`real-time-sync/SKILL.md:42-47`). Idle polling backs off from 1 to 2 to 5 minutes and speeds up to 2.5 s during document collaboration (`:55`). Collaborative documents themselves are Yjs (`_collab_docs`, `packages/core/src/collab/storage.ts:11-17`).
- **Contrast with the rest of the study.** Every other entry keeps conversation state and app state in separate worlds connected by an HTTP or IPC boundary. Here they're the same Postgres database, and the "sync" between agent and UI is mostly React Query invalidation triggered by the chat stream.

## Context awareness: the agent's view of the screen

- **The stated pattern** (`.agents/skills/context-awareness/SKILL.md:16`): "The UI writes navigation state on every route change. The agent reads it before acting." Templates call `useAgentRouteState` (`:28-48`) and may define a `view-screen` action as "the agent's eyes" (`:88-94`). A one-shot `navigate` key lets the agent drive the UI (`:133-147`).
- **Injected into the user turn, not the system prompt.** In `production-agent.ts`, three thunks run in parallel with timeouts (`:9642-9644`):
  - `screenContextThunk` runs the template's `view-screen` or reads `navigation` and produces `<current-screen>` (`:9367-9403`)
  - `urlContextThunk` reads `__url__` and produces `<current-url>` (`:9405-9448`)
  - `selectionContextThunk` reads `pending-selection-context` with a 5-minute TTL and produces `<selection>` (`:9450-9471`)

  The blocks are concatenated (`:9675`) and appended to the user message text (`:9789-9791`).
- **Cmd+I.** `packages/toolkit/src/app/chat/AgentSidebar.tsx:871-891` catches `(e.metaKey || e.ctrlKey) && e.key === "i"`, reads `window.getSelection()`, writes it to `pending-selection-context`, and focuses the chat. Cmd+\ toggles the panel (`:860-869`).
- **Gaps.** A durable `selection` key described in the skill (`context-awareness/SKILL.md:76`) is not auto-injected; it only reaches the model if the template's `view-screen` reads it. All three thunks swallow errors silently (`catch { // DB not ready … skip silently }`, `production-agent.ts:9396, 9445, 9467`), which cuts against the repo's own "no silent coercion" guard.

## Conversation persistence

- **`chat_threads`** (`packages/core/src/chat-threads/schema.ts:4-23`) stores `thread_data` as JSON text, plus `scope_type/scope_id`, pin/archive flags, a share-token hash and ownable columns; `chat_thread_shares` sits alongside (`:25-36`). The JSON is an assistant-ui `ExportedMessageRepository`: messages with `parentId` plus a `headId` (`packages/core/src/agent/thread-data-builder.ts:808-862`), so the history is a branchable tree, and `forkThread` exists (`chat-threads/store.ts:890`).
- **Runs are separate and resumable.** `agent_runs`, `agent_run_events(run_id, seq, event_data)` and `agent_tool_ledger` (`packages/core/src/agent/run-store.ts:217-256`) let a client reconnect mid-run with `GET /runs/:id/events?after=N` (`server/agent-chat-plugin.ts:6491`). Long turns on Netlify run in a 15-minute background function (`packages/core/docs/content/durable-background-runs.mdx:3, 25-27`).
- **"Checkpoints" are git commits of the app's source, not chat snapshots.** `agent_checkpoints(thread_id, run_id, commit_sha…)` (`packages/core/src/checkpoints/store.ts:10-17`). The service shells out to `git commit-tree` and `git checkout <sha> -- .` (`checkpoints/service.ts:242-244, 328-330`). Rewinding undoes the agent's code edits; this exists for the self-modifying-app feature.

## Per-user workspace: skills, memory, instructions and MCP as SQL rows

The docs' claim is "Claude-Code-level customization per user … backed by PostgreSQL/PGlite, not a filesystem" (`packages/core/docs/content/agent-resources.mdx:3`). The README itself says only "Skills and memory" (`README.md:69`).

- **One `resources` table of path-addressed files** (`packages/core/src/resources/store.ts:1079`): `path, owner, content, mime_type, visibility, thread_id, run_id, metadata`, `UNIQUE(path, owner)`. The canonical paths mirror a Claude Code home directory: `AGENTS.md`, `instructions/<slug>.md`, `skills/<slug>/SKILL.md`, `context/<slug>.md`, `agents/<slug>.md` (sub-agents) and `mcp-servers/<slug>.json` (`agent-resources.mdx:99-105`). Memory writes `memory/<name>.md` and updates a `memory/MEMORY.md` index (`packages/core/src/scripts/resources/save-memory.ts:88, 129`).
- **Scope is an `owner` string**: `"__shared__"` (the app), `"__organization__:<orgId>"`, `"__workspace__[:…]"`, or the bare user email (`store.ts:36-38`). The effective view resolves `personal ?? shared ?? workspace` (`:2434`). New users get a personal `AGENTS.md` and `LEARNINGS.md` (`:1303-1340`).
- **Layered into every turn.** `loadResourcesForPrompt` (`packages/core/src/server/agent-chat/prompt-resources.ts:1549`, layers documented at `:1532-1543`) concatenates the workspace-core `AGENTS.md`, the template's `AGENTS.md` plus a skills index, SQL `AGENTS.md`/`instructions/*` from workspace → app → org → personal scope (`:1643-1709`), personal `memory/INSTRUCTIONS.md`, org `LEARNINGS.md` and the personal `memory/MEMORY.md` index (`:1783`). Skills are listed, not inlined; the agent reads one on demand (`:734-737`). If a required `AGENTS.md` read fails, the run stops (`:638`). Note the docs say "the later scope wins" (`agent-resources.mdx:107`), but for the prompt every layer is concatenated, not overridden.
- **MCP clients, per user.** External servers come from `mcp.config.json` (`packages/core/src/mcp-client/config.ts:176-193`), the `MCP_SERVERS` env var (`:168`), user/org settings rows `u:<email>:mcp-servers-remote` / `o:<orgId>:mcp-servers-remote` (`mcp-client/remote-store.ts:4-7, 47`) and workspace `mcp-servers/*.json` resources (`workspace-servers.ts:18`). There is **one process-wide `McpClientManager`** (`mcp-client/manager.ts`). Per-user scoping is by tool-name prefix (`user_<sha256(email)[:10]>_<name>`, `org_<org>_<name>`, `remote-store.ts:121-126, 723-729`) plus a per-request filter `isMcpToolAllowedForRequest` (`mcp-client/visibility.ts`). Stdio servers configured in files are visible to everyone.
- **Every app is also an MCP server, on by default.** `mountMCP` reuses "the same action registry as A2A + agent chat" (`server/agent-chat-plugin.ts:3150-3151`; `enabled` defaults to `true`, `agent-chat/mcp-options.ts:136`) at `/mcp` (`mcp/route-paths.ts:1-8`), with its own OAuth stores and an approval table (`mcp/oauth-store.ts:71-100`, `mcp/approval-store.ts:10`). `mcp-registry/` generates Official MCP Registry entries pointing at each app's deployed `/mcp` (`mcp-registry/README.md:3-13`).

## Multi-context: composition, Dispatch and A2A

- **A workspace is one monorepo of apps sharing one database.** Apps live in `apps/<name>` and mount at `/<name>` (`.agents/skills/adding-workspace-apps/SKILL.md:23-24, 46-47`). Pointing every app at the same `DATABASE_URL` shares users, orgs and settings; "If unset, each app uses its own process-local PGlite database, so users and organizations are not shared" (`packages/core/docs/content/multi-app-workspace.mdx:335`). A unified deploy on one origin gives a shared login and "zero-config cross-app A2A", and per-app deploys fall back to JWT A2A plus "identity federation with Dispatch as the hub" (`:332-333`).
- **Prefer many small apps.** `AGENTS.md:253-257`: "prefer many focused headless or small-UI mini-apps that discover and call each other over A2A instead of one oversized app. Pass artifact ids, URLs, and bounded summaries between apps instead of pasting large provider dumps through prompts." Discovery reads each peer's `/.well-known/agent-card.json` (`.agents/skills/composable-mini-apps/SKILL.md:13-15, 34-44`).
- **A2A is the wire protocol, hand-rolled.** JSON-RPC `message/send`, `message/stream`, `tasks/get` (`packages/core/src/a2a/handlers.ts:1309-1328`); the card advertises `protocolVersion: "0.3"` (`a2a/agent-card.ts:17`), and the client also speaks the 1.0 method names (`a2a/client.ts:1274-1288`). Peers are `remote-agents/<id>.json` rows in `resources` (`a2a-protocol/SKILL.md:59-75`). Auth is a caller-signed HS256 JWT with a 15-minute TTL from `A2A_SECRET` or an org secret, with no per-peer key (`:126-141`). An adapter wraps Anthropic Managed Agents as an A2A handler (`:191-218`).
- **Dispatch is the control plane.** `packages/dispatch/README.md:3-8` calls it "the Agent-Native workspace control plane and a separate product": vault secrets, grants and audit, destinations, approvals and "dreams" (`:12-29`). Inbound Slack, email, Telegram or WhatsApp messages land in `integration_pending_tasks`, run in a fresh function execution, and the Dispatch agent decides which app to call over A2A: "Dispatch is the orchestrator, not the specialist" (`packages/core/docs/content/dispatch.mdx:116, 162-166, 248`). External agents (Claude, ChatGPT, Codex, Cursor) add one MCP connector, `https://dispatch.agent-native.com/mcp`, to reach every granted app (`:118-129`), and `ask_app` routes a natural-language request to one (`packages/dispatch/src/actions/ask_app.ts:8-29`). "Dreams" is a recurring job that mines past runs and proposes memory, skill and instruction changes for review (`dispatch.mdx:146-148`).
- **Secrets never enter the prompt.** `app_secrets` is AES-256-GCM (`packages/core/src/secrets/schema.ts:16-28`, `secrets/crypto.ts:2-24`), and `${keys.NAME}` is substituted at call time: "The raw secret value NEVER enters the model's context" (`secrets/substitution.ts:4-24`). Workspace connections carry `credential_refs_json` that point to keys, not values (`workspace-connections/store.ts:39-60`). **Caveat:** Dispatch's own `vault_secrets.value` is a plain `TEXT NOT NULL` column (`packages/dispatch/src/db/schema.ts:128`), and `createSecret` inserts `input.value` without application-level encryption (`packages/dispatch/src/server/lib/vault-store.ts:382-394`). Only the copy synced into each app's `app_secrets` is visibly encrypted, which conflicts with the docs' "encrypted-at-rest" wording unless the database provides it.

## The native shells: thin hosts around web apps

- **Desktop is Electron**, not Tauri: `electron-vite`, `electron ^43.4.0`, `electron-builder` (`packages/desktop-app/package.json:21-22, 60`). Its README is the whole architecture in one line: "A minimal Electron chat-first workbench. Each app runs as an independent dev server and is embedded in an Electron `<webview>`" (`packages/desktop-app/README.md:1-6`).
- **Switching apps doesn't swap anything.** "Each opened app's `<webview>` is **mounted once and never unmounted**. Moving between chat, apps, and contextual surfaces simply hides inactive slots" (`README.md:78-80`). Each app gets its own persistent session partition (`persist:app-${appId}`, `src/renderer/components/AppWebview.tsx:623-633`). The rail comes from `@agent-native/shared-app-config` (each app has a `devPort` and a `prodUrl`, `packages/shared-app-config/templates.ts:28-29`). The only backend switches at runtime are the production/beta lane (`shared/environment-lane.ts:6-45`), dev versus prod URLs, and "Do locally", which repoints one app's preview at a freshly cloned local dev server (`README.md:122-129`).
- **Shell-level state** is JSON files in Electron `userData` (`src/main/app-store.ts:29-34`), written atomically. Apps talk to each other through an IPC relay, `window.electronAPI.interApp.send(...)` (`README.md:97-99, 185-207`). The shell runs its own MCP server exposing `openApp`/`listApps` so coding agents can drive it (`src/main/desktop-surface-mcp.ts:9-40`). Connecting remote MCP servers from desktop chat is stubbed: "Connected MCP settings require a secure desktop MCP capability broker" (`shared/chat-first-mcp.ts:18-19`).
- **Mobile is Expo with one webview per template** (`packages/mobile-app/package.json`: `expo 57.0.6`, `react-native 0.86.0`, `react-native-webview`), with the app list in AsyncStorage and tokens in SecureStore (`lib/app-store.ts`, `lib/session-token-store.ts`). The **VS Code extension** opens app surfaces in a side panel and offers "Connect Workspace to Agent-Native MCP" (`packages/vscode-extension/README.md:52-90`). **`packages/frame`** is a local dev frame: an h3 proxy hosting an app `<iframe>` beside agent chat (`packages/frame/package.json:5`).
- **The in-app agent isn't the coding agent.** `.agents/skills/harness-agents/SKILL.md:12`: "Full agent harnesses are not `AgentEngine` providers." The runtime loop is the framework's own `runAgentLoop` over `AgentEngine`s (Builder gateway, `@anthropic-ai/sdk`, Vercel AI SDK providers, a ChatGPT-subscription engine; `packages/core/src/agent/engine/builtin.ts:70-130`). Claude Code, Codex, pi and Gemini (via ACP) are separate harness adapters (`agent/harness/builtin.ts:13-17`, `acp-builtin.ts:15-30`), and in hosted production they're "tools-only: no repository, shell, or code editing" (`agent/harness/hosted.ts:20-21`). What the two kinds of agent share is the action and MCP surface, not the loop.

## The repo's own harness setup (a side lesson)

Worth knowing because it's the same problem our `lossless-agent-skills` repo solves:

- `CLAUDE.md -> AGENTS.md` and `.claude/skills -> ../.agents/skills` are symlinks; Gemini reads the same files by name (`.gemini/settings.json`). 86 skills live under `.agents/skills/`, most marked `scope: dev`, and the runtime-scoped ones are bundled into the app by a Vite plugin (`packages/core/src/vite/agents-bundle-plugin.ts:21-23`).
- `AGENTS.md:178-198` has a rule about rules: before adding guidance, run `scripts/agent-friction-report.mjs` to count how often the user has repeated a correction, name the pattern key the rule should move, and replace failing prose with a mechanism. It cites its own failure: a claim that unrequested branch creation "went to zero" was measured at 16 in two weeks.
- One hook only: `scripts/hooks/file-lease.mjs` blocks a write when another live session holds the file. It's a Claude Code-only mechanism, and the file says so (`AGENTS.md:162-169`).

## What's inside this submodule

| Path | What's there |
|---|---|
| `AGENTS.md` (`CLAUDE.md` symlink) | The invariants: architecture contract (`:200-277`), data/security rules (`:279-314`), the rule-about-rules (`:178-198`) |
| `PRODUCT.md` | Fifty-line product contract; the "defined once, exposed across UI, agent, HTTP, MCP, A2A, and CLI" positioning |
| `packages/core/src/action.ts` | `defineAction`, `ActionCaller` |
| `packages/core/src/server/action-discovery.ts`, `action-routes.ts` | Action registry discovery and the HTTP/WebMCP surface |
| `packages/core/src/client/use-action.ts`, `use-db-sync.ts` | `useActionQuery`/`useActionMutation`; chat-stream-driven invalidation and opt-in polling/SSE |
| `packages/core/src/application-state/` | The `application_state` table and change emitter |
| `packages/core/src/agent/production-agent.ts` | `runAgentLoop`, `actionsToEngineTools`, screen/URL/selection context injection |
| `packages/core/src/agent/engine/` | `AgentEngine` providers (Builder, Anthropic, AI SDK, ChatGPT) |
| `packages/core/src/agent/harness/` | Claude Code / Codex / pi / ACP harness adapters (separate from the engine) |
| `packages/core/src/resources/`, `server/agent-chat/prompt-resources.ts` | The `resources` table and per-turn prompt layering |
| `packages/core/src/mcp/`, `mcp-client/` | Each app's MCP server; the process-wide MCP client with per-user name prefixes |
| `packages/core/src/a2a/` | Hand-rolled A2A JSON-RPC server, client and agent card |
| `packages/core/src/chat-threads/`, `checkpoints/` | Branchable thread storage; git-commit code checkpoints |
| `packages/dispatch/` | Control plane: vault, connections, routing, approvals, dreams, MCP gateway |
| `packages/desktop-app/` | Electron webview-per-app shell; `README.md` is the best single read |
| `packages/mobile-app/`, `packages/vscode-extension/`, `packages/frame/` | The other three hosts |
| `templates/slides/` | A representative template: `AGENTS.md`, 28 skills, 143 `actions/`, Nitro plugins, `netlify.toml` |
| `packages/core/docs/content/` | MDX docs: `multi-app-workspace.mdx`, `dispatch.mdx`, `agent-resources.mdx`, `context-awareness.mdx` |
| `.agents/skills/` | 86 in-repo skills; `actions`, `context-awareness`, `real-time-sync`, `composable-mini-apps`, `a2a-protocol`, `harness-agents` are the design documents |

If you read three things: `packages/core/src/action.ts` (the one idea), `packages/desktop-app/README.md` (the shell in a page), and `packages/core/docs/content/multi-app-workspace.mdx` (how many apps become one workspace).

## Mental model for using it well

- **Treat the action registry, not the chat, as the product's API.** The chat is one caller among eight. Any new capability goes in `actions/` first, and the UI, agent, MCP, A2A and CLI all get it for free.
- **Treat `application_state` as the agent's eyes.** If the agent should know about something on screen, the UI has to write it there. The agent sees nothing the UI doesn't put in SQL.
- **Read "multi-context" as composition.** Agent-native never re-points one conversation at a different backend. Each app has its own agent, its own actions and its own chat; the shell shows one webview at a time, and cross-app work goes through A2A or Dispatch.
- **Read the shells as hosts, not clients.** All the logic lives in the Nitro server behind each web app. The Electron and Expo shells hold webviews, partitions, a JSON settings file and an IPC relay.
- **Trust the code over the skills when they disagree.** The skills are good design documents, but several have drifted (below).

## Doc/code disagreements worth knowing

1. **Vault scope:** the Dispatch README says secrets are "scoped per app" (`packages/dispatch/README.md:125-126`); the docs say access defaults to all apps, with per-app grants opt-in (`dispatch.mdx:112`).
2. **A2A secret generation:** the skill says `A2A_SECRET` is "never auto-generated" (`a2a-protocol/SKILL.md:135`); `dispatch.mdx:256` says hosted workspaces "auto-generate per-app A2A credentials at deploy time".
3. **Background sync:** `storing-data/SKILL.md:160` says polling streams DB changes "automatically via `useDbSync()`"; `real-time-sync/SKILL.md:42` says nothing streams unless the page opts in.
4. **Prompt layering:** the docs say "the later scope wins" (`agent-resources.mdx:107`); the prompt concatenates every layer.
5. **Self-modification tiers are prose only:** `self-modifying-code/SKILL.md:27-32` sets Data/Source/Config/Off-limits tiers, but `write-file` resolves any path against `process.cwd()` with no containment check (`packages/core/src/scripts/dev/write-file.ts:32-39`). The real guardrail is that the tool exists only in dev mode (`server/agent-chat-plugin.ts:1187-1218`).
6. **"Any host":** the docs list ten Nitro targets (`deployment.mdx:336-342`), but every first-party template ships a `netlify.toml` with `NITRO_PRESET=netlify`, long turns use a Netlify-specific background function, and the repo has no `wrangler.*` config.
7. **Core tables bypass Drizzle:** apps are told to use the Drizzle query builder, while core tables (`application_state`, `sync_events`, `agent_runs`, `resources`) are raw `CREATE TABLE` with `?` placeholders rewritten to `$n` (`packages/core/src/db/client.ts:599-708`).
8. **Two skills that sound like runtime features aren't:** `multi-frontier-desktop` is a local Codex + Claude Code co-driving workflow with a single-writer lease (`.agents/skills/multi-frontier-desktop/SKILL.md:12-16, 51-52`), and `concurrent-agents` is about many coding sessions in one checkout (`concurrent-agents/SKILL.md:15-19`). Neither is about switching apps or running in-app agents concurrently.

## When NOT to reach for this

- **You want a Tauri shell.** The desktop app is Electron 43, and its shell logic is mostly webview management. `kaas`, `openagent` and `routa` are the Tauri references.
- **You want to swap one chat between backends at runtime.** Agent-native has no such concept; the closest it gets is hiding one webview and showing another. `routa` (per-session process spawn) is the positive result for that question.
- **You want local-first, file-backed persistence.** Everything is Postgres (PGlite locally, Neon or postgres-js hosted; `packages/core/src/db/create-get-db.ts:994-1028`). The only file-backed state is the Electron settings JSON and an opt-in "Local File Mode" for content roots (`agent-native.json`).
- **You want a small reference.** This is a 313 MB monorepo with 24 packages, 17 templates and 100+ core tables.
- **You'd adopt it as a dependency across our products.** Our rule is to share patterns between dididecks, augment-it and memopop, not a package. Read it for the patterns.

## How this compares to the rest of the study

| Axis | agent-native | routa | anything-llm | dive |
|---|---|---|---|---|
| **Shell** | Electron 43 (webview per app) + Expo (webview per template) + VS Code panel | Tauri 2 + Next.js web + VS Code | None (Docker/Node web app) | Tauri **and** Electron |
| **What "context" means** | A separate app (mail, calendar, slides…) with its own agent and actions | A workspace (codebases, worktrees, tasks) hosting many sessions | A Prisma row of provider/model/prompt | None |
| **Swap unit** | The visible webview; apps aren't swapped, they're composed | A per-session ACP child process | A per-request connector rebuilt from a row | None |
| **Agent ↔ app state** | Same Postgres; agent calls the UI's own actions; UI writes `application_state` for the agent to read | Separate: agents are external CLIs reporting back over MCP | Separate: chat pipeline over documents | Separate: Python subprocess |
| **Persistence** | Postgres/PGlite (100+ tables); shell JSON in `userData` | SQLite (desktop) / Postgres (web) | SQLite via Prisma | Python host's store |
| **MCP** | Each app *is* an MCP server; process-wide client with per-user tool prefixes; Dispatch as one MCP gateway | Workspace+session-scoped coordination endpoint | None | MCP host (stdio + SSE) |
| **Cross-context calls** | A2A (hand-rolled, v0.3/1.0) + Dispatch routing | A2A, AG-UI, A2UI surfaces | None | None |
| **Best fit** | Reference for "the agent is a first-class caller of the app's own operations" and "multi-product suite via composition and a control plane" | Reference for a genuine per-session adapter/process swap | Negative result: config-row parameterization | Negative result: thin shell, one backend |

Agent-native's contribution to this study is to **reframe the question.** The study asks how a shell should swap between backend products at runtime. Agent-native's answer is to not swap at all: each product keeps its own agent, actions and UI on one shared database and identity. A thin shell hosts each one in a persistent webview, products call each other over A2A, and one control plane (Dispatch) owns secrets, connections, routing and a single MCP entry point. For our augment-it / dididecks-ai / memopop-ai suite under didi.sh, that maps more closely onto how the products already relate than a single chat that re-points itself.

## One-line summary

> Agent-native is Builder.io's framework for apps whose AI agent and UI are equal callers of one `defineAction` registry (also exposed over HTTP, MCP, A2A and CLI), where the agent reads what's on screen from a SQL `application_state` table and per-user skills, memory and MCP servers are path-addressed rows layered into each turn. Multi-context is handled by composing many small apps on one Postgres database and one identity, with A2A between them and Dispatch as the control plane, all hosted by an Electron shell that keeps one never-unmounted `<webview>` per app instead of swapping backends.

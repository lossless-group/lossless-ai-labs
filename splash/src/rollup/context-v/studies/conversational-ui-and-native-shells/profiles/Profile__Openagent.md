---
name: OpenAgent Profile
slug: openagent
upstream: https://github.com/BANG404/openagent
package: n/a (Tauri desktop app; frontend via bun/SvelteKit, backend via cargo/Rust)
license: GPL-3.0-or-later
maintainer: BANG404 (primary author, 469 commits), with iumm (98 commits) and github-actions[bot] (35 release commits)
study: studies/conversational-ui-and-native-shells
profile_path: studies/conversational-ui-and-native-shells/openagent
profile_kind: Tauri desktop chat client — Rust backend + SvelteKit webview, MCP-native
date_created: 2026-07-13
from: "studies/conversational-ui-and-native-shells"
from_path: "context-v/profiles/Profile__Openagent.md"
---
# OpenAgent — Profile

A profile of OpenAgent as it lives in this study (`studies/conversational-ui-and-native-shells/openagent/`). `LICENSE:1-4` plus `package.json:"license": "GPL-3.0-or-later"` and `src-tauri/Cargo.toml:7-8` (`license = "GPL-3.0-or-later"`, `license-file = "../LICENSE"`) confirm **GPL-3.0-or-later** — a copyleft choice, not the permissive MIT/Apache licensing common elsewhere in this study (`kaas/LICENSE:1` is MIT; `dive/LICENSE:1` is MIT). Read alongside [`Profile__Kaas.md`](./Profile__Kaas.md) and [`Profile__Dive.md`](./Profile__Dive.md) — the three are the study's closest analogs to a shell that dynamically loads skills/MCP servers per context, and OpenAgent is the only one of the three with an explicit "Skills" concept as a first-class, user-editable filesystem construct.

**Maturity, stated plainly up front:** this is an early-stage, low-adoption repo. `gh repo view` reports **4 stars, 0 forks, 0 watchers** as of this profile's date, despite a first commit on 2026-05-18 and a most recent commit on 2026-07-13 (today) — under two months old, but committed to nearly every day by what is functionally a two-person team (BANG404 + iumm, 567 human commits between them) plus an automated release bot. Versioning is pre-1.0 (`package.json:"version": "0.21.1"`) with alpha/beta/rc pre-release tags per `CLAUDE.md`'s release-process section. Treat every claim below as "this is what the code does today," not "this is a proven pattern" — the repo is a fast-moving solo/duo project, not a widely-adopted reference implementation.

## TL;DR

The README states its own scope (`README.md:80-84`):

> **Multi-Agent & Flash Agents Architecture** — A primary streaming **Chat Agent** for main conversations, and a suite of dedicated async **Flash Agents** (including **Memory Agent** for long-term memory synthesis, **Title Agent** for dynamic conversation renaming, and **Hook Agent** for background scheduled tasks).

Mechanically, the four features this study cares about most all exist, all are small enough to read in full, and all are honestly less mature than Goose's or opencode's equivalents in the sibling `agent-harnesses` study:

- **Multi-agent delegation** is a single tool, `spawn_agent` (`src-tauri/src/sub_agent.rs:60-96`), that the Chat Agent calls to fork off one sub-agent with its own SQLite-backed sub-conversation, its own cancellation flag, and a tool server that is a near-duplicate of the parent's — **except `SpawnAgentTool` itself is never registered on the sub-agent's tool server** (`sub_agent.rs:179-259` builds `sub_tools` from `ReadFileTool`/`WriteFileTool`/.../`TerminalListTool` but never adds `SpawnAgentTool`), so delegation is exactly one level deep by construction, not by a depth counter.
- **Long-term memory** is a hybrid SQLite store (`src-tauri/src/conversation_memory.rs`): a 384-dim `fastembed` vector column (`state.rs:12`, `Arc<Mutex<Option<Arc<fastembed::TextEmbedding>>>>`) blended with an FTS5 virtual table (`conversation_memory.rs:190-210`) via **reciprocal rank fusion**, not the fixed-weight blend the repo's own `CLAUDE.md` describes — `hybrid_search_agent_memories` (`conversation_memory.rs:1168-1235`) computes `1.0 / (60.0 + rank + 1.0)` per candidate list and adds a small exponential-decay freshness term (`(-0.01 * recency_days).exp() * 0.002`, `conversation_memory.rs:1219`), so the in-repo architecture doc is already slightly stale against the actual scoring function.
- **MCP client** support is real but thin: `src-tauri/src/mcp.rs` (270 lines total) wires exactly two transports — `StreamableHttpClientTransport` for HTTP MCP servers and `TokioChildProcess` for stdio servers (`mcp.rs:191-238`) — built on the `rig` crate's `rmcp` feature (`rig-core = { version = "0.36", features = ["rmcp"] }`, `Cargo.toml:26`). There is no permission-gating layer, no allowlist-per-server tool scoping, and no in-process/no-subprocess transport variant — every MCP tool that connects is simply appended to the shared `ToolServerHandle` (`skills_files_mcp.rs:263-301`, `save_mcp_servers` rebuilds and reconnects the whole tool server on every config change).
- **Skills** are the most literal implementation of the `agentskills.io`-style convention in this whole study: a directory with a `SKILL.md` file containing YAML frontmatter (`name`, `description`), discovered from two fixed roots — `~/.config/openagent/skills/` (global) and `<workspace>/.agents/skills/` (local) — via `skills.rs:15-21` (`global_skills_dir()`, `local_skills_dir()`) and walked by `discover_skills()` (`skills.rs:48-83`). Skills are **not** injected in full into the system prompt; only name+description+path are listed (`format_skills_for_prompt`, `skills.rs:93-128`), and the agent is expected to `read_file` the full `SKILL.md` on demand — the same lazy-load discipline Goose and Claude Code use.

If you want one sentence: **OpenAgent is a young, low-star, actively-committed Tauri+SvelteKit desktop chat client where delegation is a single non-recursive `spawn_agent` tool, long-term memory is a homegrown SQLite+FTS5+embeddings hybrid search using reciprocal rank fusion (not the fixed-weight blend its own docs claim), MCP support covers only HTTP and stdio transports with no permission layer, and Skills are directory-plus-`SKILL.md` discovery listed by name/description in the prompt and read in full on demand — every one of these four systems is functional and readable end-to-end in under 300 lines, but none of them is battle-tested at scale.**

## Why this exists — a two-process Tauri app, not a CLI harness

Unlike the CLI-first harnesses in `agent-harnesses` (Goose, Aider, opencode), OpenAgent's entire reason for existing is the desktop chat surface: `src-tauri/` (Rust, owns all I/O and LLM calls) and `src/` (SvelteKit SPA, SSR disabled, the webview) communicate over Tauri's IPC — commands for request/response, events (`chat-chunk`, `chat-tool-call`, `chat-tool-result`, `chat-done`) for streaming. The repo's own `CLAUDE.md` (checked into the submodule, not authored by this study) documents this split precisely and was used to cross-check every claim below against the actual source rather than trusted at face value — the one place its description proved stale is the memory-scoring weights, called out above.

Three design choices matter for this study's question ("how does a Tauri shell dynamically load/unload skills and MCP servers per context"):

1. **MCP servers are config-driven and reconnect wholesale, not incrementally.** `save_mcp_servers` (`skills_files_mcp.rs:254-302`) rebuilds *two* full `ToolServerHandle`s from scratch (one with conversation-recall tools, one without — `build_base_tool_server`'s `conversation_recall_enabled` flag, `mcp.rs:27-39,143-151`), aborts every previously-spawned MCP connection task (`h.abort()`, `skills_files_mcp.rs:295-297`), and reconnects all enabled servers via `connect_mcp_servers` (`mcp.rs:191-238`). There is no partial diffing of "which servers actually changed" — any edit to the MCP server list tears down and reconnects everything.
2. **Skills load by directory scan, not by explicit registration.** `load_all_skills` (`skills.rs:85-91`) always re-walks both the global and (if a workspace is set) local `skills/` directories on each call — there's no cached registry object that a workspace switch has to explicitly invalidate; switching workspaces just changes which local directory gets walked next time `context.rs:241-242` builds the system prompt.
3. **Sub-agents get a near-complete but deliberately pruned tool copy.** The sub-agent's tool server in `sub_agent.rs:179-259` includes file tools, fetch, web search (if configured), `render_html`, `search_agent_memory`, `update_agent_memory`, `schedule_chat_hook`, `ask_user`, and the full terminal tool family — but not `spawn_agent` itself, and not `SearchConversationMessagesTool` (the cross-session recall tool). This is a manually maintained allowlist, not a generic "everything except X" filter — worth noting as a place the two lists (`skills_files_mcp.rs`'s `build_base_tool_server` vs. `sub_agent.rs`'s inline `sub_tools` builder) could silently drift as new tools are added to one but not the other.

## Multi-agent delegation — `spawn_agent`, one level deep

`src-tauri/src/sub_agent.rs` is the whole mechanism:

- `SpawnAgentTool` (`sub_agent.rs:60-72`) holds clones of the parent's shared state (`config`, `workspace`, `app_handle`, `interrupt_channels`, `conversation_memory`, `embedding_model`, `terminal_sessions`, `terminal_approval_grants`, `cancel_flags`) — a sub-agent is not a separate process, just a second in-process agent loop sharing the same `Arc<Mutex<_>>` handles.
- `call()` (`sub_agent.rs:98-…`) generates a fresh `sub_conv_id`, persists a `ConversationMeta` row with `parent_conv_id` set to the caller's conv id (`sub_agent.rs:129-141`), emits a `subagent-started` event so the frontend sidebar can render the nested sub-conversation live (`sub_agent.rs:162-173`), then builds `system_prompt` and `sub_tools` fresh for the child.
- **Recursion is prevented structurally, not by a depth limit.** The comment at `sub_agent.rs:178` ("Build a sub-agent tool server (without spawn_agent to prevent recursion)") is enforced simply by never calling `.tool(SpawnAgentTool { ... })` when assembling `sub_tools` — compare against `skills_files_mcp.rs:132` where the top-level `build_base_tool_server` *does* register `SpawnAgentTool`. One layer of delegation is all the type system allows; there is no sub-sub-agent path in this codebase.
- **Cancellation cascades from parent to child.** Before starting, the code checks whether the parent's cancellation flag is already set and, if so, immediately cancels the child's flag too (`sub_agent.rs:261-277`, `parent_was_cancelled`) — closing a real race window between conversation creation and flag registration. The commit `02d50b8 fix(chat): cascade cancellation to sub-agents` (visible in `git log`) confirms this was a bug fix, not a day-one design.
- Streaming for the sub-agent reuses the same `stream_chat(...).multi_turn(10)` pattern as the primary Chat Agent (`sub_agent.rs:299-302`), capped at 10 tool-call turns, with progress persisted into the same checkpoint/file-change tables the parent conversation uses.

This is a materially thinner delegation model than, for example, Goose's `sub_agent`/session-type taxonomy (`SessionType::SubAgent` as one of six session kinds) — OpenAgent has exactly one delegation shape, no recipe-driven sub-agent configuration, and no parallel fan-out (the DAG-style `/graph` command mentioned in the README's highlights, backed by `CreateGoalGraphTool` at `tools.rs:388-393`, is a different, graph-of-goals mechanism layered on top of the same single-level `spawn_agent`, not a multi-agent fan-out primitive in itself — not read in full depth for this profile).

## Long-term memory — SQLite + FTS5 + embeddings, fused by rank not weight

`src-tauri/src/conversation_memory.rs` (1710 lines) is the single largest hand-written subsystem in the backend. Schema (`try_new`, `conversation_memory.rs:167-…`):

- `agent_memories` table: `id`, `scope`, `content`, `vector BLOB`, `created_at`, `updated_at`, `last_accessed_at`, `last_confirmed_at`, `status`, `source_conv_id`, `source_message_id` (`conversation_memory.rs:175-187`).
- `agent_memories_fts` — an FTS5 virtual table kept in sync via three triggers (`ai`/`ad`/`au`, `conversation_memory.rs:190-210`) so full-text search never falls out of date with the base table.
- Embeddings come from `fastembed`'s `TextEmbedding`, held as `Arc<Mutex<Option<Arc<fastembed::TextEmbedding>>>>` in `state.rs:12` — this is the `AllMiniLML6V2` 384-dim model the README's Highlights section names (`README.md:87`), though the model-selection line itself lives in initialization code not read in depth here.
- **Retrieval is reciprocal rank fusion, not a weighted linear blend.** `hybrid_search_agent_memories` (`conversation_memory.rs:1168-1235`) takes ANN candidates (`ann_candidates`, `conversation_memory.rs:98`) and FTS5 candidates (`fts_candidates`, `conversation_memory.rs:130`) as two independently-ranked lists, then scores each memory as `Σ 1/(60 + rank + 1)` across whichever lists it appears in, plus a small freshness bonus `(-0.01 * recency_days).exp() * 0.002` (`conversation_memory.rs:1213-1220`). This is a real, if small, discrepancy against the submodule's own `CLAUDE.md` (which describes "vector cosine similarity (weight 0.5), FTS5 keyword search / Dice coefficient (0.3), and exponential time decay (0.2)") — the actual code doesn't use those fixed weights at all; it's RRF with a separately-scaled freshness term. Worth flagging as a live example of an architecture doc drifting from the code it describes.
- **Write-time dedup uses cosine similarity directly** (not RRF): `save_agent_memory_with_similarity_filter` (`conversation_memory.rs:1237-…`) compares a new memory's embedding against every existing memory in the same scope via `cosine_similarity` (`conversation_memory.rs:1296,1699`), first checking for an exact-content duplicate (updates `last_confirmed_at` and returns early, `conversation_memory.rs:1281-1288`) before falling back to a similarity threshold.
- **Two zones inside a plain-text memory file coexist with the SQLite store.** Per the submodule's `CLAUDE.md`, `~/.config/openagent/memory.md` (global) and `<workspace>/.agents/memory.md` (local) hold a `[User-maintained]` section the Memory Agent must never touch and an `[Agent-maintained]` section below a fence comment that only the async Memory Agent (model: `claude-haiku-4-5` by default) writes to — this is a separate, simpler memory surface from the `agent_memories` SQLite table (source not re-verified line-by-line in this pass, taken from the submodule's own architecture doc which was otherwise accurate).

## MCP client — two transports, no permission layer

`src-tauri/src/mcp.rs` is short (270 lines) and does exactly what the README's "MCP-Native" bullet claims (`README.md:96`: *"Connect external MCP servers over HTTP or stdio; tools are injected into the agent at call time"*) — no more:

- `build_stdio_transport` (`mcp.rs:169-189`) resolves the executable via `PATH` (`rmcp::transport::which_command`, so Windows `.cmd` shims resolve correctly), spawns a `TokioChildProcess`, and on Windows sets `CREATE_NO_WINDOW` to suppress a console flash (`mcp.rs:182-186`).
- `build_http_transport_config` (`mcp.rs:154-167`) builds a `StreamableHttpClientTransportConfig` with custom headers and an optional bearer token — no OAuth flow, no credential-store abstraction comparable to Goose's `GooseCredentialStore`.
- `connect_mcp_servers` (`mcp.rs:191-238`) spawns one Tokio task per enabled server, logs connect/disconnect via `tracing::info!`/`warn!`, and simply lets the task run until the connection drops (`service.waiting().await`) — there's no reconnect-with-backoff loop visible in this file; a dropped connection just logs and exits the task.
- `probe_mcp_server` (`mcp.rs:240-270`) is the "Test connection" button's backend: connect, `list_all_tools()`, collect names, disconnect — used by `test_mcp_server` (`skills_files_mcp.rs:304-307`) before a server is saved into config.
- **No tool-scoping allowlist and no runtime permission gate exist in this file.** Contrast with Goose's `ExtensionConfig::is_tool_available()` (structural allowlist) and `PermissionLevel::{AlwaysAllow,AskBefore,NeverAllow}` (runtime gate) — OpenAgent's closest analog is the separate, coarser "Tool Approval" setting the README mentions (`README.md:99`, *"Choose per-call review, model-assisted approval, no approval, or a workspace-oriented sandbox"*), which is a global mode switch, not a per-server or per-tool structural filter, and lives outside `mcp.rs` (not read in depth for this profile).

## Skills — directory + `SKILL.md`, listed lazily, read on demand

`src-tauri/src/skills.rs` (144 lines total) is small enough to read end-to-end:

- `global_skills_dir()` → `~/.config/openagent/skills/` and `local_skills_dir(workspace)` → `<workspace>/.agents/skills/` (`skills.rs:15-21`) — the same `.agents/skills` convention Goose converges on for its project-scoped skills.
- `parse_frontmatter` (`skills.rs:24-46`) is a hand-rolled YAML-frontmatter reader (not a real YAML parser) that extracts exactly two fields, `name:` and `description:`, by line-prefix matching and quote-trimming — no nested `metadata` map like Goose's `agentskills.io`-spec `SkillFrontmatter` supports.
- `discover_skills` (`skills.rs:48-83`) walks one directory level (`fs::read_dir`), requires a `SKILL.md` to exist in each subdirectory, skips entries with no parsed `name`, and sorts alphabetically. `load_all_skills` (`skills.rs:85-91`) always calls this for both scopes (global first, then local if a workspace is set) — every prompt build re-walks the filesystem; there's no persistent in-memory skill registry to keep in sync.
- **Prompt injection is name+description+path only** (`format_skills_for_prompt`, `skills.rs:93-128`), bilingual (`en`/`zh` strings selected by `language`), explicitly instructing the model: *"If you need the full instructions, use read_file to read the corresponding SKILL.md file"* (`skills.rs:119`) — the full skill body is never eagerly loaded into context, mirroring Claude Code's and Goose's lazy-load discipline.
- **CRUD is a set of Tauri commands, not agent tools.** `list_skills`, `get_skill_content`, `save_skill_content`, `create_skill`, `delete_skill`, `get_skills_dir` (`skills_files_mcp.rs:3-90`) are invoked directly by the SvelteKit `SkillsView.svelte` component — a human edits skills through a UI panel; the agent only ever reads them via its ordinary `read_file` tool. `create_skill` (`skills_files_mcp.rs:25-65`) writes a bilingual placeholder body in Chinese (`"在此编写技能的详细指令、规范或参考信息..."`, `skills_files_mcp.rs:52`) regardless of the app's configured language — a minor but real rough edge for an English-only user creating their first skill from the UI.

## What's inside this submodule

| Path | What's there |
|---|---|
| `src-tauri/src/sub_agent.rs` | `SpawnAgentTool` — the entire multi-agent delegation mechanism, deliberately non-recursive |
| `src-tauri/src/conversation_memory.rs` | SQLite (`rusqlite`) schema, FTS5 triggers, `fastembed`-backed ANN, RRF hybrid search, cosine-similarity write-time dedup |
| `src-tauri/src/mcp.rs` | `build_base_tool_server`, HTTP (`StreamableHttpClientTransport`) + stdio (`TokioChildProcess`) MCP connectors, `probe_mcp_server` |
| `src-tauri/src/skills.rs` | Skill discovery (`SKILL.md` walk), frontmatter parsing, prompt formatting |
| `src-tauri/src/commands/skills_files_mcp.rs` | Tauri commands wrapping skills CRUD, MCP server CRUD/reconnect, workspace file listing |
| `src-tauri/src/tools.rs` (2816 lines) | Core tools: file I/O, `ask_user`, `render_html`, goal/graph tools (`CreateGoalGraphTool`), memory tools |
| `src-tauri/src/context.rs` | Assembles the system prompt: global/local memory, vector-retrieved history, skills list, git branch |
| `src-tauri/src/checkpoint.rs` | Checkpoint/file-change types backing per-turn rollback |
| `src-tauri/src/terminal.rs` | Foreground + background (session-based) terminal tool family |
| `src-tauri/src/state.rs` | `AppState` — shared mutexes, `EmbeddingModel` type, MCP join handles |
| `src/lib/components/SkillsView.svelte`, `MemoryView.svelte` | Frontend panels for skill and memory CRUD |
| `CLAUDE.md` (submodule root) | The maintainer's own architecture doc — mostly accurate; the memory-scoring-weights description is stale against the actual RRF code |
| `docs/design.md` (referenced by `CLAUDE.md`, not independently verified this pass) | Apple-style UI design spec the frontend is meant to follow |

If you read three files: `src-tauri/src/sub_agent.rs` (delegation, and the exact line where recursion is prevented by omission), `src-tauri/src/conversation_memory.rs:1168-1235` (`hybrid_search_agent_memories` — the real RRF scoring function), and `src-tauri/src/skills.rs` (the whole skills system fits in 144 lines).

## Mental model for using it well

- **Treat `spawn_agent` as "fork one flat sub-agent," not "build an agent tree."** There is no recursive delegation and no fan-out primitive at this layer — parallel/graph-structured work goes through the separate `/graph`+`CreateGoalGraphTool` mechanism instead.
- **Don't trust the submodule's own `CLAUDE.md` for the memory-scoring formula** — read `hybrid_search_agent_memories` directly; the doc says fixed weights, the code does reciprocal rank fusion plus a freshness term.
- **MCP server edits are all-or-nothing reconnects.** Expect every enabled server to restart when any one server's config changes (`save_mcp_servers`) — there's no incremental diffing to rely on for a live, many-server setup.
- **Skills are cheap to add and cheap to get wrong.** The frontmatter parser only reads `name`/`description` by literal line prefix — no real YAML library — so anything more elaborate (nested metadata, multi-line descriptions) will silently fail to parse rather than error loudly.
- **The tool lists in `mcp.rs`'s `build_base_tool_server` and `sub_agent.rs`'s inline `sub_tools` builder are maintained by hand in two places** — when reading or extending either, check both, since nothing enforces they stay in sync besides developer discipline.

## When NOT to reach for this

- **You need a proven, widely-adopted reference implementation.** 4 stars, 0 forks, under two months old, effectively a two-person project — this is a fast-moving experiment to read for ideas, not a hardened pattern to copy wholesale.
- **You need permission-gated or allowlisted MCP tool access.** There is no `PermissionLevel`-style runtime gate and no per-server `available_tools` structural filter in `mcp.rs` — every tool an MCP server advertises is exposed once connected.
- **You need recursive or fan-out multi-agent orchestration.** `spawn_agent` is exactly one level deep by construction; there's no sub-agent-of-a-sub-agent path and no built-in parallel dispatch across many sub-agents from a single call.
- **You need GPL-compatible licensing for a closed-source derivative.** `GPL-3.0-or-later` is copyleft — reusing substantial code from this repo obligates the same license on the derivative work, unlike `kaas` or `dive` (both MIT) in the same study.
- **You want a memory system whose scoring you can audit from documentation alone.** The maintainer's own `CLAUDE.md` already lags the code on this exact point — read `conversation_memory.rs` directly rather than the doc.

## How this compares to the rest of the study

| Axis | OpenAgent | kaas | dive |
|---|---|---|---|
| **Shell tech** | Tauri 2 + SvelteKit 5 + Rust | Tauri + React | Tauri **and** Electron (dual build path) |
| **License** | GPL-3.0-or-later (copyleft) | MIT | MIT |
| **Maturity signal** | 4 stars, 0 forks, ~2 months old, ~2 active human committers, daily commits | Being profiled in parallel | Being profiled in parallel |
| **Multi-agent delegation** | `spawn_agent` tool — one sub-agent, one level deep, recursion prevented by omitting the tool from the child's tool server (`sub_agent.rs:178-259`) | Not yet profiled | Not yet profiled |
| **Long-term memory** | SQLite + FTS5 + `fastembed` (384-dim) ANN, fused by reciprocal rank fusion + exponential freshness decay (`conversation_memory.rs:1168-1235`); separate two-zone `memory.md` files for global/local ambient context | Local persistence (mechanism not yet profiled) | Not yet profiled |
| **MCP client** | HTTP (`StreamableHttpClientTransport`) + stdio (`TokioChildProcess`) via the `rig` crate's `rmcp` feature; no permission/allowlist layer (`mcp.rs`) | Not yet profiled | MCP **host** (per this study's framing) — likely broader server-management surface, not yet read |
| **Skills concept** | `SKILL.md` + YAML frontmatter (`name`/`description` only), two fixed roots (`~/.config/openagent/skills/`, `<workspace>/.agents/skills/`), lazy full-content load via `read_file` (`skills.rs`) | Not yet profiled | Not yet profiled |
| **Tool approval model** | Global mode switch (per-call review / model-assisted / none / workspace sandbox) — coarser than a structural allowlist | Not yet profiled | Not yet profiled |
| **Best fit for this study's question** | Clearest, smallest, most literally `agentskills.io`-shaped Skills implementation to copy the *shape* of — but copy the idea, not the code, given GPL and immaturity | — | — |

The crucial axis OpenAgent owns in this study is **legibility**: every one of the four features this study cares about (delegation, memory, MCP, skills) fits in one or two files under 300 lines each and can be read start-to-finish in an afternoon — a useful worked example of "the smallest version of each of these four systems that actually functions," even though none of the four should be assumed production-hardened.

## One-line summary

> OpenAgent is a young (2-months-old, 4-star, effectively two-person), GPL-3.0-licensed Tauri+SvelteKit desktop chat client whose four closest-to-our-question features are all small and readable — a non-recursive `spawn_agent` delegation tool that omits itself from its own sub-agent's toolset, a SQLite+FTS5+fastembed hybrid memory store scored by reciprocal rank fusion (not the fixed-weight blend its own architecture doc claims), an MCP client covering only HTTP and stdio transports with no permission-gating layer, and a `SKILL.md`-plus-frontmatter Skills system that lists name/description in the prompt and lazy-loads full content via `read_file` — worth reading for the shape of each mechanism, not for adoption-tested reliability.

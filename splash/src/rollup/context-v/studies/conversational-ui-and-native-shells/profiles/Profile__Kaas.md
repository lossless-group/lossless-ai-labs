---
name: Kaas Profile
slug: kaas
upstream: https://github.com/0xfrankz/Kaas
package: n/a (Rust crate `kaas` + `kaas_lib`; distributed as Tauri desktop binaries — macOS/Windows/Linux)
license: MIT
maintainer: Frank Zhang (0xfrankz)
study: studies/conversational-ui-and-native-shells
profile_path: studies/conversational-ui-and-native-shells/kaas
profile_kind: Tauri (Rust backend) + React frontend, multi-provider chat client
date_created: 2026-07-13
from: "studies/conversational-ui-and-native-shells"
from_path: "context-v/profiles/Profile__Kaas.md"
---
# Kaas — Profile

A profile of Kaas as it lives in this study (`studies/conversational-ui-and-native-shells/kaas/`). Cites pinned paths so you can jump to source rather than trust paraphrase. `LICENSE:1` confirms MIT (Copyright 2024-present Frank Zhang); `src-tauri/Cargo.toml:3-9` confirms the Rust package name `kaas` v1.0.9, edition 2021, `license = "MIT"`. Read alongside `Profile__Openagent.md` (Tauri + SvelteKit, MCP + Skills) and `Profile__Dive.md` (Tauri + Electron dual-shell) — Kaas is the study's clearest example of **local persistence and provider abstraction living entirely in the Rust backend**, with the React frontend reduced to a thin, typed IPC client plus local UI/query-cache state.

## TL;DR

The README states its own scope plainly:

> Kaas is a ChatGPT client designed to serve multiple platforms. Built using Tauri and React, this client places significant emphasis on data privacy and security. It ensures this through local data storage practices... Your credentials and chat data are never sent to our servers. They are stored locally and securely on your device.

Mechanically: **all persistence and all provider dispatch happen in Rust; React never touches a database or an LLM SDK directly.** `Repository` (`src-tauri/src/services/db.rs:28-30`) wraps a single `sea_orm::DatabaseConnection` against a SQLite file at `<app_data_dir>/database.sqlite` (`src-tauri/src/init.rs:120-122`, `get_sqlite_path`), created and migrated via `sea-orm-migration` (`Migrator::up`, `db.rs:33-42`) with six schema migrations plus two seed migrations under `src-tauri/migration/src/` (e.g. `m20250214_000001_messages_add_reasoning_fields.rs` — the newest, adding reasoning-model support). `Repository` is registered once as Tauri managed state (`app.handle().manage(repo)`, `init.rs:60`) and every `#[tauri::command]` in `src-tauri/src/commands.rs` receives it via `State<'_, Repository>`.

Provider dispatch is a closed Rust enum, not a runtime plugin system: `LLMClient` (`src-tauri/src/services/llm/client.rs:21-30`) is `OpenAIClient | AzureClient | ClaudeClient | OllamaClient | OpenrouterClient | DeepseekClient | XaiClient | GoogleClient`, each wrapping an `async_openai::Client<C>` with a provider-specific `Config` impl (`src-tauri/src/services/llm/providers/{claude,deepseek,google,ollama,openrouter,xai}/config.rs`). `LLMClient::new()` (`client.rs:34-99`) matches on `Providers` from the model's stored config, deserializes a `Raw*Config` (`src-tauri/src/services/llm/types.rs`), and converts it `Into<ProviderConfig>` — so Claude and Ollama ride the **same** `async-openai` request/response plumbing as OpenAI, via a fork (`async-openai = { git = "...0xfrankz/async-openai.git", branch = "google-compatibility" }`, `Cargo.toml:16`) rather than separate SDKs per vendor.

Streaming crosses the Tauri IPC boundary as a **window event bus with string sentinels**, not Tauri's typed `Channel<T>` API: `emit_stream_start/data/done/error/stopped` (`commands.rs:687-736`) call `window.emit(tag, ...)` with payloads `"[[START]]"`, `"[[DONE]]"`, `"[[ERROR]]<msg>"`, `"[[STOPPED]]"`, or a JSON-stringified `BotReply`. The frontend's `useReplyListener(tag)` hook (`src/lib/hooks.tsx:680-778`) does `listen<string>(tag, ...)` and pattern-matches those exact string prefixes (`STREAM_START`, `STREAM_DONE`, `STREAM_STOPPED`, `STREAM_ERROR` constants) to reassemble the incremental reply, concatenating `message`/`reasoning` token deltas by hand. Cancellation is a second event, `stop-bot`, bound with `window.listen("stop-bot", ...)` inside the same async command handler (`commands.rs:594,673`) — the backend registers a listener for its own cancellation signal rather than using a cancellation token passed as an argument.

If you want one sentence: **Kaas keeps every LLM credential, every conversation, and every provider-specific request-shaping decision inside the Rust process — behind a SeaORM/SQLite repository and a closed `LLMClient` enum built on a forked `async-openai` — and exposes only typed `#[tauri::command]` functions plus a raw `window.emit`/`listen` string-sentinel event bus to a React frontend that owns nothing but Zustand UI state and a TanStack Query cache.**

## Local persistence — SeaORM over SQLite, one file, six tables

- **One connection, one file.** `get_sqlite_path()` (`src-tauri/src/init.rs:118-122`) resolves to `<app_data_dir>/database.sqlite`; `Builder::build()` (`db.rs:929-949`) calls `Sqlite::create_database` if missing, then `Database::connect("sqlite:{url}")` — a single `sea_orm::DatabaseConnection`, no pooling knobs exposed, no WAL mode configured (contrast with a harness that tunes journal mode explicitly).
- **Migrations are code, not raw SQL files.** `src-tauri/migration/src/` holds one Rust file per migration (`m20240101_000001_create_models.rs` through `m20250214_000001_messages_add_reasoning_fields.rs`), registered in `Migrator` and run via `Migrator::up(&self.connection, None)` (`db.rs:33-42`) on every app start — idempotent, no explicit schema-version gate visible in `db.rs` itself (SeaORM's migrator tracks applied migrations internally).
- **Soft delete is the default; hard delete is explicit and separate.** `delete_model`, `delete_conversation`, `delete_prompt` all set a `deleted_at` timestamp and update (`db.rs:106-123, 314-340, 904-921`); message deletion instead has two named paths, `hard_delete_messages` (bulk, by conversation) and `hard_delete_message` (single), both doing a real SQL `DELETE` (`db.rs:828-856`) — the only entity in this schema with a true-delete path, presumably because edited/regenerated bot turns shouldn't accumulate soft-deleted rows forever.
- **Provider-shaped options live as a serialized JSON blob per conversation, validated by round-tripping through a typed struct.** `conversations::Model.options: Option<String>` (`entity/src/entities/conversations.rs:21`) holds one of `AzureOptions | OpenAIOptions | ClaudeOptions | OllamaOptions` (same file, lines 117-394) depending on the linked model's provider. `update_conversation_options()` (`db.rs:402-498`) deserializes the incoming JSON into the provider-specific struct and **re-serializes it** before writing — `serde_json::from_str::<ClaudeOptions>(...)` then `to_string(&claude_options)` — so malformed or extra fields from the frontend are silently normalized away rather than stored verbatim. Every conversation-creation path (`create_conversation`, `create_conversation_with_content`, `update_conversation_model`, `db.rs:176-286, 537-578`) independently re-runs this same four-way provider match to set a fresh default-options blob, rather than centralizing it in one helper — the same `match model.provider.into() { Azure => ..., Claude => ..., Ollama => ..., _ => OpenAIOptions }` block is duplicated four times across `db.rs`.
- **Context assembly for a chat turn is a backend SQL query, not a frontend slice of cached messages.** `get_last_messages(conversation_id, n, before_message_id)` (`db.rs:628-666`) uses SeaORM's `cursor_by(Column::Id).last(n)` to fetch the last N rows directly from SQLite, then `load_many(contents::Entity, ...)` to eager-load each message's content rows — `commands.rs:405-448` (`call_bot`) computes `n` from a per-conversation `contextLength` option (falling back to a global `SETTING_MODELS_CONTEXT_LENGTH` setting) and prepends the system message if one exists. The frontend never assembles or trims context; it only tells the backend which conversation and where to cut (`before_message_id`, used for regenerate-from-here).
- **A separate content table, not inline message text.** `messages` and `contents` are distinct entities (`create_message`, `db.rs:671-715`, runs inside a `transaction::<_, MessageDTO, DbErr>` that inserts the message row, then bulk-inserts its `contents::ActiveModel` rows, then bumps `conversations.last_message_at`) — this is what lets a single message hold multiple content parts (text + image, per `ContentType` in `entity/src/entities/contents.rs`) atomically.

## The provider abstraction — one enum, one HTTP client shape, per-provider `Config` impls

`LLMClient` (`client.rs:21-30`) is a closed 8-variant enum (`OpenAI`, `Azure`, `Claude`, `Ollama`, `Openrouter`, `Deepseek`, `Xai`, `Google`), each variant tupling an `async_openai::Client<C>` with `Option<String>` (the resolved model name — `None` for Azure, which addresses the model via `deployment_id` instead, `types.rs:17-25`). `LLMClient::new()` (`client.rs:34-99`) is the single construction chokepoint:

1. Builds one shared `reqwest::Client` per call via `build_http_client(proxy_setting)` (`src-tauri/src/services/llm/utils.rs`, imported at `client.rs:16`) — proxy settings are looked up from the `settings` table (`SETTING_NETWORK_PROXY`, `commands.rs:87-97`) and threaded through to every provider uniformly.
2. Matches `config.provider.as_str().into(): Providers` and deserializes a `Raw*Config` struct (`types.rs`) — e.g. `RawClaudeConfig { api_key, model, api_version, endpoint }` (`types.rs:53-58`) — then converts it `Into<ClaudeConfig>` (`types.rs:60-71`), which itself implements `async_openai::config::Config` so the rest of the request/response/streaming machinery is fully shared with OpenAI's own code path.
3. Two providers ride on top of OpenAI's config type directly rather than a bespoke one: `Openrouter` reuses `RawOpenAIConfig`/`OpenAIConfig` but overrides the base URL (`with_api_base(DEFAULT_OPENROUTER_API_BASE)`, `client.rs:64-71`); `CUSTOM` (any OpenAI-compatible endpoint) shares the exact same match arm as `OpenAI` (`client.rs:43-49`).

`chat()` / `chat_stream()` (`client.rs:147-213`) both funnel through generic helpers (`execute_chat_request` / `execute_chat_request_stream`, `client.rs:101-145`) parameterized over an `F: FnOnce(&Client<C>, ..., String) -> Result<ChatRequestExecutor, String>` — a per-provider constructor function (`ChatRequestExecutor::claude`, `::ollama`, etc., defined in `src-tauri/src/services/llm/chat.rs`) — so adding a ninth provider means adding one enum variant, one `Raw*Config`/`*Config` pair, and one `ChatRequestExecutor::<name>` constructor, not touching the dispatch logic itself. `models()` (`client.rs:215-250`) is the one place providers genuinely diverge in capability: Azure explicitly returns `Err("List models API is not supported by Azure")` rather than a variant of the enum being unreachable.

## The Tauri↔React IPC boundary — typed commands for CRUD, raw events for streaming

Two distinct transports coexist, chosen per call shape:

- **Request/response CRUD goes through `#[tauri::command]` + `invoke`.** Every backend mutation (`create_model`, `list_conversations`, `upsert_setting`, etc. — `commands.rs:38-370`) is a plain async function returning `CommandResult<T> = Result<T, CommandError>` (`commands.rs:36`, `CommandError` defined in `src-tauri/src/errors.rs` as a tagged `ApiError | DbError` enum). The frontend wraps each in a typed `invoke<T>('command_name', {...})` call in `src/lib/commands.ts` (e.g. `invokeCreateModel`, `commands.ts:27-35`) and layers TanStack Query hooks on top (`useListModelsQuery`, `useCreateConversationMutation`, etc. — `src/lib/hooks.tsx:106-566`) for caching and optimistic updates (`useSubjectUpdater`'s `onMutate` snapshot/rollback, `hooks.tsx:498-529`).
- **Streaming chat replies go through `window.emit`/`listen`, keyed by a caller-supplied `tag` string, not a Tauri `Channel`.** `call_bot` (`commands.rs:~370-460`) takes a `tag: String` argument from the frontend, and every downstream `emit_stream_*` helper (`commands.rs:687-736`) emits on that exact event name. The frontend's `invokeCallBot` passes the same tag through `invoke`, then a separate `useReplyListener(tag)` hook (`hooks.tsx:680-778`) opens a `listen<string>(tag, ...)` subscription scoped to that one tag — meaning the "channel" is really just an app-wide event namespace disambiguated by a string the frontend invents per in-flight request. Payloads are hand-encoded sentinels (`"[[START]]"`, `"[[DONE]]"`, `"[[STOPPED]]"`, `"[[ERROR]]<message>"`) or raw JSON text for data frames — there is no `serde`-typed event payload enum shared between Rust and TS; both sides independently agree on the string format (`STREAM_START` etc. constants in `src/lib/constants.ts`, matched against literal strings written in `commands.rs`).
- **Cancellation is itself a third event, not a return value or an `AbortSignal`.** The backend, mid-stream, binds a listener for a fixed event name `"stop-bot"` (`commands.rs:594, 673`) scoped to the lifetime of that one request's async task, and unbinds it (`window_clone.unlisten(event_handle)`) once the stream ends — so a stray `stop-bot` emit after a request already finished is a no-op by construction, but two concurrent in-flight requests would both react to the same global `stop-bot` event (no per-request cancellation token is threaded through IPC; the `tag` namespacing only covers reply data, not the cancel signal).
- **Capabilities are declared, not inferred.** `src-tauri/capabilities/desktop.json` enumerates the exact permission set — `fs:allow-read-file`, `fs:allow-write-file`, an `fs:scope` allowlist restricted to `$APPDATA/*` and `$RESOURCE/*`, `clipboard-manager:*`, `shell:allow-open`, `dialog:allow-save`, `updater:default` — matching the README's claim that "we deliberately limit the privileges of the client to the minimum necessary."

## Provider-scoped options as first-class, schema-validated state

Rather than one generic `{temperature, maxTokens, ...}` options bag, each provider has its own Rust struct with its own defaults (`entity/src/entities/conversations.rs:117-394`): `AzureOptions`, `OpenAIOptions` (adds `reasoning_effort` for o-series models), `ClaudeOptions` (defaults `temperature: 0.5`, unlike every other provider's `1.0`), `OllamaOptions` (uses `num_ctx`/`num_predict` instead of `max_tokens`), `DeepseekOptions`, `XaiOptions`, `GoogleOptions` — all implementing a shared marker trait `Options` (`conversations.rs:115`) that gives no shared behavior beyond type grouping. On the frontend, `ConversationOptionsDialog.tsx` and `src/lib/schemas.ts` mirror this per-provider shape so the settings form rendered for a conversation depends on which provider its linked model uses. **Switching a conversation's model is a backend command** (`update_conversation_model`, `db.rs:537-578`) that re-derives a fresh default options blob for the new provider — old provider-specific settings (e.g. a tuned Claude `top_p`) do not carry over across a provider switch, by design of the match-and-overwrite pattern.

## What's inside this submodule

| Path | What's there |
|---|---|
| `src-tauri/src/services/db.rs` | `Repository` — every SQL operation, soft/hard delete split, provider-options re-validation, transactional message+content writes |
| `src-tauri/src/services/llm/client.rs` | `LLMClient` enum — the provider dispatch chokepoint, `new()`/`chat()`/`chat_stream()`/`models()` |
| `src-tauri/src/services/llm/types.rs` | `Raw*Config` structs — camelCase JSON-to-`async_openai::Config` conversion per provider |
| `src-tauri/src/services/llm/chat.rs` | `ChatRequestExecutor`, `BotReply`/`BotReplyStream`, `GlobalSettings` |
| `src-tauri/src/services/llm/providers/*/config.rs` | Per-provider `Config` impls (Claude, Deepseek, Google, Ollama, Openrouter, Xai) riding `async-openai`'s trait |
| `src-tauri/src/commands.rs` | Every `#[tauri::command]`; `call_bot`/`call_bot_stream`; the `emit_stream_*` event-sentinel helpers |
| `src-tauri/src/init.rs` | App bootstrap — app-data-dir resolution, `database.sqlite` path, migration run, cache dir, locale-derived default setting |
| `src-tauri/entity/src/entities/conversations.rs` | `ConversationDTO`, `GenericOptions`, and all seven per-provider `*Options` structs |
| `src-tauri/entity/src/entities/{models,messages,contents,prompts,settings}.rs` | Remaining SeaORM entities |
| `src-tauri/migration/src/` | One Rust file per schema migration, run via `Migrator::up` on every launch |
| `src-tauri/capabilities/desktop.json` | Tauri v2 capability/permission manifest — the declared privilege ceiling |
| `src/lib/commands.ts` | Typed `invoke()` wrappers, one per backend command |
| `src/lib/hooks.tsx` | TanStack Query hooks per entity; `useReplyListener` — the streaming-event consumer |
| `src/lib/store.ts` | Zustand `useAppStateStore` (models + settings cache) and `useConfirmationStateStore` — all client-only UI state |
| `src/lib/contexts.ts` | React contexts (`ConversationsContext`, `MessageListContext`, etc.) layered over the query cache |
| `src/components/Conversation/`, `src/components/Conversations/` | Per-conversation chat UI vs. the conversation-list/grid UI — split the same way message-vs-list state is split in hooks |
| `docs/options.md` | User-facing doc enumerating every supported config/option per provider |

If you read three files: `src-tauri/src/services/llm/client.rs` (the whole provider-abstraction shape lives here), `src-tauri/src/services/db.rs` (every persistence decision, including the duplicated provider-options-defaulting pattern), and `src-tauri/src/commands.rs` (the actual IPC surface — both the typed-command half and the raw-event-sentinel streaming half).

## Mental model for using it well

- **Treat the Rust backend as the only place that knows about providers.** The frontend never imports an OpenAI/Anthropic SDK; it sends a `GenericConfig { provider: String, config: String }` blob and gets typed DTOs back. Adding a provider means Rust-side work only (`LLMClient` variant + `Raw*Config` + `ChatRequestExecutor` constructor); the frontend just needs a new options schema and a provider tag string.
– **Distinguish the two IPC transports by call shape, not by convention alone.** One-shot CRUD → `#[tauri::command]`/`invoke`. Anything that streams tokens → an app-wide `window.emit`/`listen` event keyed by a request-generated `tag`, with hand-agreed string sentinels — there's no compile-time guarantee the Rust and TS sides agree on the payload shape here, unlike the CRUD commands where `serde`/TS types line up.
- **Read `conversations.options` as "the frozen provider-shaped request parameters for this one conversation,"** re-validated (parse-then-reserialize) on every write — don't expect arbitrary extra JSON keys from the frontend to survive a round trip.
- **Expect context assembly to happen server-side.** `call_bot` computes exactly which prior messages go to the model using a stored per-conversation or global context-length setting; the frontend's job is only to pick a `before_message_id` for "regenerate from here" semantics.
- **Watch the soft-vs-hard delete split.** Models/conversations/prompts are soft-deleted (`deleted_at`) and simply filtered out of list queries; messages are the one entity with true `DELETE` paths, because edit/regenerate flows would otherwise leave orphaned superseded turns.

## When NOT to reach for this

- **You want an MCP-client or tool-calling architecture.** There is no `mcp` string, no tool/function-calling abstraction, and no plugin system anywhere in `src-tauri/src/` — Kaas is a pure conversational client against chat-completion endpoints, not an agent harness. `openagent` (Tauri + SvelteKit, MCP + Skills) is the sibling entry for that shape.
- **You need a cross-shell (Electron-and-Tauri) reference.** Kaas ships one shell only; if the study question is specifically about dual-shell strategy, `dive` (Tauri + Electron dual) is the more relevant read.
- **You want typed, compiler-checked streaming payloads across the IPC boundary.** The `window.emit`/string-sentinel pattern (`"[[DONE]]"`, JSON-as-string data frames) works but has no shared schema; a harness or app needing stronger guarantees here should look at Tauri's `Channel<T>` API instead, which Kaas does not use.
- **You want per-request cancellation.** `stop-bot` is a single global event name, not scoped per in-flight `tag` — fine for a single-window single-active-stream chat client, insufficient if multiple concurrent streams need independent cancellation.
- **You need SQLite tuned for concurrent access (WAL mode, connection pooling).** `Repository` opens one `DatabaseConnection` with no journal-mode configuration visible in `db.rs` — adequate for a single-process desktop app, not a pattern to copy for anything with multiple readers/writers.

## How this compares to the rest of the study

| Axis | Kaas | openagent | dive |
|---|---|---|---|
| **Shell** | Tauri (Rust) + React | Tauri (Rust) + SvelteKit | Tauri **and** Electron (dual shell) |
| **Persistence** | SQLite via SeaORM, single `DatabaseConnection`, code-based migrations (`src-tauri/migration/`) | (see `Profile__Openagent.md`) | (see `Profile__Dive.md`) |
| **Provider abstraction** | Closed Rust enum (`LLMClient`, 8 variants) wrapping a forked `async-openai` per provider `Config` impl | — | — |
| **Tool-calling / MCP** | None — pure chat-completion client | MCP + Skills native | — |
| **Streaming IPC transport** | `window.emit`/`listen`, string-sentinel protocol (`"[[START]]"`/`"[[DONE]]"`/`"[[ERROR]]..."`), keyed by a frontend-generated `tag` | — | — |
| **Cancellation** | Global `stop-bot` window event, bound/unbound per in-flight request | — | — |
| **Conversation options model** | Per-provider Rust structs (`AzureOptions`, `ClaudeOptions`, etc.) stored as re-validated JSON in `conversations.options` | — | — |
| **Frontend state ownership** | Zustand (UI-only: models cache, settings, confirmation dialogs) + TanStack Query (server-cache) — no client ever touches SQL or an LLM SDK | — | — |
| **Best fit** | Local-first, credential-private multi-provider chat client where the backend is the trust boundary and the frontend is a thin typed client | Native shell wanting MCP/Skills-driven extensibility | Cross-shell (Tauri/Electron) comparison work |

Kaas's load-bearing contribution to this study is **the provider abstraction living entirely behind one Rust enum over a forked shared HTTP client library, paired with a persistence layer that treats "provider-specific options" as validated, re-serialized server state rather than opaque frontend JSON** — a clean answer to "how do you let a user swap providers/models mid-app without smearing provider knowledge into the UI layer."

## One-line summary

> Kaas is a Tauri + React desktop chat client where the Rust backend owns everything that matters — a single SeaORM/SQLite `Repository` with soft-delete-by-default and code-based migrations, a closed `LLMClient` enum that dispatches eight providers through one forked `async-openai` HTTP client and per-provider `Config`/`Options` Rust structs re-validated on every write — while the React frontend is reduced to typed `invoke()` CRUD calls plus a `window.emit`/`listen` string-sentinel event bus for streaming tokens, cancellable only via a single global `stop-bot` event, with Zustand holding pure UI state and TanStack Query holding the server-mirrored cache.

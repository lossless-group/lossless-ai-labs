---
title: "In-App Agent Chat — Core Package Spec"
lede: "Concretizes the chat-as-agent-surface exploration into a shippable package: capability registry schema, BYOK storage and proxy contract, chat UI component API, transcript schema, and a v1 acceptance scenario for dididecks. One shared package under ai-labs/packages/, per-app capability definitions, three guards that keep the agent inside our methods."
date_authored_initial_draft: 2026-05-17
date_authored_current_draft: 2026-05-17
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-17
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Specification
tags:
  - Chat-UI
  - In-App-Agent
  - Capability-Registry
  - BYOK
  - Anthropic-Tool-Use
  - Shared-Package
  - Dididecks
  - Memopop
  - Augment-It
  - libSQL
  - Chroma
authors:
  - Michael Staton
date_created: 2026-05-17
date_modified: 2026-05-17
---

# In-App Agent Chat — Core Package Spec

> Draft — derived from [[In-App-Chat-as-Agent-Surface-for-Client-Apps]]. Not yet implemented. Edit freely.

## Scope

One npm-publishable package, `@lossless/in-app-agent`, that ships:

1. A chat UI component (Svelte 5, since dididecks and memopop are already Svelte; Astro islands–compatible; Tauri-renderable without modification).
2. A capability registry interface and runtime.
3. A model/key router with BYOK proxying, with two backends — **web (HTTP/SSE to our server)** and **Tauri (IPC to a Rust sidecar)** — fronted by the same TS interface.
4. A transcript store interface (libSQL by default — Turso for web, local libSQL file for Tauri, with optional sync).
5. A Chroma retrieval wrapper bound to the four corpus collections plus a per-app session collection.

Out of scope for v1: voice, multi-user shared chat, agent-initiated chat, cross-app chat. See the exploration for why.

## Dual target: Web + Tauri

All three apps (`dididecks-ai`, `memopop-ai`, `augment-it`) ship a web frontend **and** a Tauri desktop frontend. Cross-platform is a product constraint, not a deferred nice-to-have. Tauri interprets/renders the same Svelte 5 components — the UI layer is single-source.

What this changes about the package: every server-side surface in this spec has **two** concrete implementations behind one TS interface, selected at build time per target.

| Concern | Web target | Tauri target |
|---|---|---|
| Chat endpoint | SvelteKit/Astro endpoint, SSE over HTTP | Tauri command (Rust), event stream over IPC |
| Capability dispatch | Server-side TS runtime | Rust sidecar invokes a bundled TS runtime (via embedded Deno or Node sidecar process) **or** delegates to our hosted server (org-configurable) |
| BYOK key storage | `user_api_keys` table on Turso, AES-GCM | OS keychain via `tauri-plugin-stronghold` or `keyring` crate; never written to libSQL on disk |
| Transcript store | Turso (org-shared, multi-device) | Local libSQL file at `$APPDATA/<app>/transcripts.db`; optional Turso sync when org has a paying tier |
| Model HTTP call | Always through our server proxy | **Paying:** through our server proxy. **BYOK:** direct from Rust sidecar to provider, with capability gate + redaction applied locally first |
| Auth session | Cookie + Shared-Auth | OAuth via `tauri-plugin-oauth`; refresh token in keychain |

The load-bearing invariant: **the Svelte UI cannot tell which backend it's talking to.** It calls `agent.chat(...)`, `agent.confirm(...)`, `agent.listKeys(...)` against an injected client. The package ships two client implementations:

```ts
// @lossless/in-app-agent/clients

export const webClient: AgentClient   = makeHttpClient({ baseUrl: '/api/agent' });
export const tauriClient: AgentClient = makeTauriClient();   // wraps invoke() + listen()
```

Each app picks the right one at build time. The same `<Chat />` mounts against either.

### Why Tauri-BYOK bypasses our server (and why that's fine)

For BYOK on desktop, the user's key lives in their OS keychain and the model call goes provider-direct from the Rust sidecar. We never see their key and we never see their prompts. This is a **privacy win** that desktop affords web cannot match.

We don't lose the three guards from the exploration:

1. **Capability registry as the only side-effect surface.** Still enforced — the Rust sidecar hosts the same TS runtime (or a Rust port for hot paths) and validates every tool call against the per-app registry before dispatch. The model can't bypass it because the model only ever sees the tool schemas, not a code-exec surface.
2. **System-prompt anchoring.** Bundled with the desktop app, signed, version-pinned. Updated on app update.
3. **Per-org policy.** Fetched once at session start from our server (read-only, cached), refreshed on focus. Admin-disabled capabilities are enforced locally.

What we lose: real-time observability of BYOK desktop usage. Mitigation: the transcript still gets written locally and, if the user opts in (default on for paying orgs, default off for lingering), sync-mirrored to Turso for the `client-app-sessions` Chroma ingest. Lingering BYOK users who opt out are effectively dark — that's the deal.

### Why not "Tauri just calls our server"

It would be simpler. But it cedes the two things Tauri actually buys us:

- **Offline-capable agent work** on a slow conference Wi-Fi or a plane. The whole point of cross-platform is that the desktop app isn't a thin shell.
- **Keys never on our server.** Some clients (we've already had this conversation) won't BYOK if the key transits our infrastructure, no matter how good the crypto. The keychain story is the closer.

The cost is the dual implementation. We pay it once at the package level so the three apps don't pay it three times.

## Companion docs

- [[In-App-Chat-as-Agent-Surface-for-Client-Apps]] — the exploration this concretizes.
- [[Shared-Auth-for-Applied-AI-Labs]] — supplies the user record, org scoping, and the place BYOK keys hang off.
- `dididecks-ai/context-v/specs/Dididecks-AI-Slide-Decks-as-Code.md` — the editable substrate the first capabilities target.
- `memopop-ai/context-v/specs/Character-Cast-for-Live-Agent-Indication.md` — the personification pattern the chat UI reuses for the "who is working" row.
- [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] — the corpus the retrieval wrapper queries.

## Package layout

```
ai-labs/packages/in-app-agent/
├── package.json
├── README.md
├── src/
│   ├── ui/                       # Svelte 5 — target-agnostic
│   │   ├── Chat.svelte           # top-level surface
│   │   ├── MessageList.svelte
│   │   ├── Composer.svelte
│   │   ├── CharacterRow.svelte   # reused personification
│   │   ├── CapabilityPreview.svelte   # patch preview / accept / discard
│   │   └── SettingsPanel.svelte  # BYOK, model, redaction
│   ├── client/                   # client-side abstraction over backends
│   │   ├── types.ts              # AgentClient interface
│   │   ├── http.ts               # web — fetch + EventSource
│   │   └── tauri.ts              # desktop — invoke() + listen()
│   ├── registry/                 # shared by both backends
│   │   ├── types.ts              # Capability, CapabilitySchema, CapabilityCall
│   │   └── runtime.ts            # validate + dispatch (pure TS, no IO)
│   ├── router/
│   │   ├── anthropic.ts          # provider clients (used by both backends)
│   │   ├── openai.ts
│   │   ├── proxy-web.ts          # server-side BYOK proxy for web
│   │   └── proxy-tauri.ts        # provider-direct call from desktop
│   ├── transcript/
│   │   ├── store.ts              # interface
│   │   ├── libsql-turso.ts       # web default
│   │   └── libsql-local.ts       # tauri default, file at $APPDATA
│   ├── retrieval/
│   │   └── chroma.ts             # wraps chroma HTTP client (works in both)
│   ├── server/                   # web backend
│   │   ├── chat.ts               # SSE endpoint
│   │   └── capabilities.ts       # capability dispatch endpoint
│   └── tauri/                    # desktop backend
│       ├── src-rust/             # crate consumed by the host app's tauri binary
│       │   ├── lib.rs            # commands: chat_stream, confirm, list_keys, set_key
│       │   ├── keychain.rs       # stronghold/keyring wrapper
│       │   └── runtime_bridge.rs # bridge to embedded TS runtime
│       └── ts-sidecar/           # the TS runtime the rust crate spawns
│           └── main.ts           # hosts registry/runtime.ts + router/proxy-tauri.ts
└── tests/
```

Per-app integration: each host app (`dididecks-ai`, `memopop-ai`, `augment-it`) imports the package, declares its own capability registry, mounts `<Chat />` inside the shell, and:

- For the **web** target, wires `src/server/*` routes into its SvelteKit/Astro endpoints.
- For the **Tauri** target, adds the `@lossless/in-app-agent-tauri` Rust crate to its `src-tauri/Cargo.toml` and bundles the ts-sidecar.

The Svelte UI code is identical across both targets; only the client wiring differs.

## Capability registry — schema

A capability is a typed, validated, server-side function the LLM is allowed to invoke. The registry is the **only** side-effect surface. No `bash`, no `fetch`, no arbitrary file writes.

```ts
// registry/types.ts

export interface Capability<TInput = unknown, TOutput = unknown> {
  /** Globally unique, dot-namespaced — e.g. "slide.variant". */
  name: string;

  /** Short, plain-language description shown to the LLM and in admin UI. */
  description: string;

  /** JSON Schema for inputs. Used both for LLM tool-use schema and runtime validation. */
  inputSchema: JSONSchema;

  /** What the capability does. May be sync or async. Pure-read or state-changing. */
  kind: "read" | "preview" | "mutate";

  /** Tier required. "viewer" = published surfaces; "user" = logged-in; "admin" = org admin. */
  requiredTier: "viewer" | "user" | "admin";

  /** When true, the result is shown to the user as a preview (patch, diff, draft)
   *  and requires explicit accept before any persistent state changes. */
  requiresUserConfirmation: boolean;

  /** Server-side handler. Runs after auth + schema validation + policy check. */
  handler: (input: TInput, ctx: CapabilityContext) => Promise<CapabilityResult<TOutput>>;
}

export interface CapabilityContext {
  user: AuthUser;             // from Shared-Auth-for-Applied-AI-Labs
  org: AuthOrg;
  projectId: string;          // deck_id, memo_id, etc.
  transcript: TranscriptHandle;
  logger: Logger;
}

export interface CapabilityResult<T> {
  ok: boolean;
  output?: T;
  preview?: {
    summary: string;          // "Changed slides/07.astro and slides/07.theme.css"
    artifacts: PreviewArtifact[];
  };
  error?: { code: string; message: string; recoverable: boolean };
}
```

### Reference registries (illustrative — full lists per app)

**Dididecks** (`dididecks-ai/src/server/capabilities.ts`):

| Name | Kind | Confirms | One-line |
|---|---|---|---|
| `slide.read` | read | no | Return slide source + rendered preview. |
| `slide.edit` | mutate | yes | Apply natural-language edit; returns patch for preview. |
| `slide.variant` | preview | yes | Generate an aesthetic variant on a new branch. |
| `deck.export` | mutate | no | Export deck with named brand kit + format. |
| `deck.og_image` | mutate | yes | Generate N OG-image variants for preview. |
| `deck.diagnostics` | read | no | Surface recent build/deploy errors. |

**Shared across all apps** (added per [[Memory-Layers-for-the-In-App-Chat-Package]] — note the strict user-vs-AI trust split):

*User-authored reminders (high-trust, always-loaded in the system prompt):*

| Name | Kind | Confirms | One-line |
|---|---|---|---|
| `reminders.read` | read | no | Read one or all per-org reminder files (`client_profile`, `our_decisions`, `gotchas`). |
| `reminders.suggest` | preview | **yes — user accept required** | Propose a new reminder or edit. Surfaced in the UI as a draft; only commits to disk on user accept. |

The agent has **no direct write** to reminders. `reminders.suggest` is the only path, and it always goes through `requiresUserConfirmation` UI. This enforces the trust boundary at the capability layer, not at runtime convention.

*AI-authored cache (low-trust, retrieved on demand, hedged in answers):*

| Name | Kind | Confirms | One-line |
|---|---|---|---|
| `cache.note` | mutate | no | Append a freeform observation to the per-org AI memory cache. |
| `cache.recall` | read | no | Similarity-recall up to 5 notes from the per-org AI memory cache, optionally filtered by topic. |

The system prompt instructs the model to hedge any claim sourced from `cache.recall` and to defer to reminders when the two conflict.

*Corpus retrieval (Chroma tenant-scoped, allowlisted collections):*

| Name | Kind | Confirms | One-line |
|---|---|---|---|
| `corpus.search` | read | no | Hybrid retrieval scoped to the current client's tenant + the read-only `lossless__global` tenant. |
| `corpus.search_cross_client` | read | **yes — admin tier, audit-logged** | Search across multiple client tenants. Lossless-operated mode only; absent from self-hosted builds. |

These eight capabilities are part of the package itself, not per-app — every app shares the same memory discipline.

### Tenancy and isolation (per [[Memory-Layers-for-the-In-App-Chat-Package]] Role 1b)

Chroma siloing uses native `(tenant, database, collection)` scope, not metadata filters on a shared collection. Three deployment modes share one package:

| Mode | Tenant routing | Available capabilities |
|---|---|---|
| Lossless-operated, single client | `tenant=client__{org_slug}` + read-only `tenant=lossless__global` | All eight, including `corpus.search_cross_client` (Lossless-staff session only) |
| Lossless-operated, many clients | Same as above; each client gets their own tenant | Same |
| Self-hosted | Their own Chroma URL + their own tenant; no Lossless tenants reachable | Seven — `corpus.search_cross_client` is not registered |

The Chroma client wrapper takes `{ url, tenant, database }` from package config; defaults are set at build time. Cross-client leakage is impossible by path, not by filter — the request never enters another tenant.

This obsoletes per-org metadata filters as the *primary* isolation mechanism. Metadata filters remain for finer scoping *within* a tenant (e.g., by project, by date) but are no longer the security boundary.

**Memopop** (`memopop-ai/investment-memo-orchestrator/src/server/capabilities.ts`):

| Name | Kind | Confirms | One-line |
|---|---|---|---|
| `agent.run` | mutate | yes | Trigger an existing LangGraph agent against an input ref. |
| `memo.score_section` | mutate | yes | Re-score a section against named criteria. |
| `memo.export` | mutate | no | Export memo in a named format. |
| `memo.citations` | read | no | List the sources backing a paragraph. |
| `cast.add` | mutate | yes | Add a character to the live-agent cast. |

## BYOK — storage and proxy contract

Two tiers; the chat UI looks identical for both.

### Storage — web target

A `user_api_keys` table on the auth-owned libSQL:

```sql
CREATE TABLE user_api_keys (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,        -- "anthropic" | "openai" | "groq" | ...
  ciphertext      BLOB NOT NULL,        -- AES-GCM, key from server env
  iv              BLOB NOT NULL,
  label           TEXT,                 -- user-supplied: "personal", "work"
  last_four       TEXT NOT NULL,        -- for masked display
  created_at      INTEGER NOT NULL,
  last_used_at    INTEGER,
  revoked_at      INTEGER
);
CREATE INDEX idx_user_api_keys_user ON user_api_keys(user_id) WHERE revoked_at IS NULL;
```

The key never leaves the server. The chat UI shows `sk-ant-…••••AB12` and a "rotate" / "revoke" affordance.

### Storage — Tauri target

No libSQL row. The key lives in the OS keychain (`tauri-plugin-stronghold` preferred; `keyring` crate as fallback for OSes where stronghold setup is heavyweight). Service name `group.lossless.<app>`, account name `byok:<provider>:<label>`.

A small local manifest at `$APPDATA/<app>/keys.json` records `{ provider, label, last_four, created_at, last_used_at }` for UI display — no ciphertext, no key material. Revocation = delete keychain entry + manifest row.

When the user signs in to a multi-device org with a paying tier, the manifest **does not** sync; keys are device-local on purpose. Switching devices means re-entering the key, which is the correct UX for a credential.

### Proxy contract — web target

Both paying and BYOK requests flow through the same server endpoint. The router selects the key:

```
POST /api/agent/chat
{
  "projectId": "deck_abc",
  "messages": [...],
  "model": "claude-sonnet-4-6",     // requested model
  "tools": ["slide.read", "slide.edit", ...]   // capability whitelist for this turn
}
```

Server logic:

1. Resolve user from session (Shared-Auth).
2. Resolve org's billing state.
3. **Key selection:**
   - If org has `billing_status = "paying"`, use the org's server-side key for the requested provider.
   - Else, look up a non-revoked user key for the requested provider.
   - If neither exists, return `402 Payment Required` with a structured payload pointing the UI at the BYOK settings panel.
4. Apply redaction policy (org-configurable: strip PII from outgoing prompts, etc.).
5. Stream model response over SSE.
6. When the model emits a tool call, dispatch through the capability registry runtime (next section).
7. Append the full turn (user msg, model msg, tool calls, tool results) to the transcript.

This means **BYOK users still get capability gating, redaction, and transcript persistence** — we don't hand them a raw model proxy.

### Proxy contract — Tauri target

Same logical contract, different transport. The Svelte UI calls `tauriClient.chat({...})`, which `invoke('chat_stream', {...})` against the Rust sidecar. The sidecar:

1. Resolves user from the cached session (token in keychain).
2. Resolves org billing state from the per-app sync'd `org_state.json` cache (refreshed on focus, max 24h stale).
3. **Key selection:**
   - Paying → call our hosted proxy endpoint, same shape as web. (We want telemetry + central rate limits for paying users.)
   - BYOK → read provider key from keychain, call provider directly. No round-trip through our server.
4. Apply redaction policy locally (policy doc is sync'd from the server, same cache as org state).
5. Stream model response back to Svelte via Tauri event channel.
6. Tool calls go through `registry/runtime.ts` hosted in the ts-sidecar.
7. Append turn to the local libSQL transcript; if sync is enabled, push to Turso opportunistically.

The Rust crate exposes exactly four commands: `chat_stream`, `confirm`, `list_keys`, `set_key`. Nothing else is callable from the webview.

## Capability dispatch runtime

When the model calls a tool:

```
1. Validate name is in the per-turn whitelist.    → reject if not
2. Validate input against capability.inputSchema. → reject if not
3. Check ctx.user meets capability.requiredTier.  → reject if not
4. Apply per-org policy (admin can disable specific capabilities).
5. Execute capability.handler(input, ctx).
6. If capability.requiresUserConfirmation && result.preview:
     emit a "preview" SSE event with the preview payload;
     pause the agent loop until the UI posts /api/agent/confirm with accept|discard.
7. Else: emit the result back into the model loop.
8. Persist the tool call + result in the transcript regardless of outcome.
```

Confirmation pause is the load-bearing safety property. The agent **cannot** silently mutate the deck/memo while the user is looking the other way.

## Chat UI component API

```svelte
<script lang="ts">
  import { Chat } from '@lossless/in-app-agent/ui';
  import type { ChatContext } from '@lossless/in-app-agent';

  export let context: ChatContext = {
    projectId: deck.id,
    projectKind: 'dididecks-deck',
    attachableNouns: [
      { kind: 'slide', list: deck.slides },
      { kind: 'brand-kit', list: org.brandKits },
    ],
    capabilityWhitelist: ['slide.*', 'deck.*'],   // glob matched against registry
    characterCast: deckCast,                      // optional, reuses Memopop pattern
  };
</script>

<Chat {context} chatEndpoint="/api/agent/chat" confirmEndpoint="/api/agent/confirm" />
```

The host app does not pass an API key, model selection, or system prompt. Those are resolved server-side from the org/user record. This keeps the UI inert and safe to ship into a viewer-adjacent surface without leaking credentials.

## Transcript schema

One row per turn. A turn = `user message` → `model response (with optional tool calls)` → `tool results`.

```sql
CREATE TABLE agent_transcripts (
  id              TEXT PRIMARY KEY,
  org_id          TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  project_id      TEXT NOT NULL,
  project_kind    TEXT NOT NULL,             -- "dididecks-deck" | "memopop-memo" | ...
  thread_id       TEXT NOT NULL,             -- groups turns within a conversation
  turn_index      INTEGER NOT NULL,
  user_message    TEXT,                      -- markdown
  model_message   TEXT,                      -- markdown
  tool_calls      TEXT,                      -- JSON array
  tool_results    TEXT,                      -- JSON array, with confirmation outcomes
  model           TEXT NOT NULL,
  key_source      TEXT NOT NULL,             -- "org" | "user-byok"
  tokens_in       INTEGER,
  tokens_out      INTEGER,
  latency_ms      INTEGER,
  created_at      INTEGER NOT NULL
);
CREATE INDEX idx_transcripts_project ON agent_transcripts(org_id, project_id, thread_id, turn_index);
```

A nightly job ingests new transcripts into a new Chroma collection `client-app-sessions` (parallel to `claude-code-sessions`), so the in-app agent can retrieve from real client usage on subsequent turns. Per-org isolation is enforced via metadata filter on every retrieval call.

## Retrieval wrapper

Thin wrapper around the existing `mcp__chroma__chroma_query_documents`. The agent gets a single tool, `corpus.search`, with mandatory metadata filters:

```ts
corpus.search({
  query: string,
  collections?: Array<"context-vigilance-corpus" | "lossless-changelog" | "client-app-sessions">,
  // Always implicitly scoped to current org for client-app-sessions.
  // context-vigilance-corpus and lossless-changelog are global-read.
  nResults?: number,   // default 5, max 10
})
```

`claude-code-sessions` and `claude-code-tool-traces` are **not** exposed — those contain our internal dev work and may include unredacted secrets. Strict allowlist.

System prompt strategy follows the exploration's "hybrid spine" recommendation: a short static spine ("you are an agent operating inside `{app_name}`; use Lossless patterns; bounded to the capabilities listed below"), plus retrieved context from `corpus.search` invoked by the model itself when it deems necessary.

### Prompt caching (Anthropic) — day-one design, not a v2

Per [[Memory-Layers-for-the-In-App-Chat-Package]] and the `claude-api` skill, prompt caching is the single biggest cost lever for this surface. The system prompt assembled for every chat turn has three slabs, in stable order:

1. **Static spine** (system role, framing, behavioral guardrails). Changes only on package release. **Cache-eligible across all sessions in an app.**
2. **Capability schemas** for the per-turn whitelist. Changes only when the registry changes. **Cache-eligible across all sessions in an app/version.**
3. **Per-org user reminders** (`reminders/client_profile.md` + `reminders/our_decisions.md` + `reminders/gotchas.md`). Changes only on user-accepted `reminders.suggest` — a handful of edits per week at most. **Cache-eligible per-org for the cache TTL.**

Followed by the volatile parts (current thread, retrieved corpus chunks, `cache.recall` results, user message) that we do *not* attempt to cache. The AI-authored cache lives below the cache boundary on purpose: it's both noisier and changes more often than reminders, so caching it would both poison hits and invalidate the prefix too often.

The router (web `proxy-web.ts` and Tauri `proxy-tauri.ts`) is responsible for emitting `cache_control: { type: "ephemeral" }` breakpoints between slabs 1/2, 2/3, and 3/volatile. Cache misses fall back to a normal call; cache hits drop per-turn cost on supported providers (Anthropic, increasingly others) by ~80%+ on the cached prefix.

Telemetry: every transcript row includes `cache_read_tokens` and `cache_creation_tokens` alongside `tokens_in`/`tokens_out` so we can verify caching is actually firing in production.

## V1 acceptance scenario (dididecks)

A lingering client logs into a dididecks instance with their Anthropic key.

1. Auth flow (Shared-Auth) puts them in their org, `billing_status = "lingering"`.
2. They open a deck and click the chat affordance in the shell.
3. Settings panel detects no org key, no user key. Prompts for BYOK. They paste an Anthropic key, labelled "personal".
4. They type: *"Give me a Chroma-style variant of slide 4."*
5. Server resolves: user key found, model = `claude-sonnet-4-6`, capability whitelist = `slide.*`, `deck.*`. Streams to Anthropic with tool definitions for those capabilities + `corpus.search`.
6. Model calls `corpus.search({ query: "Chroma deck aesthetic" })` → retrieves prior chroma-pitch notes from `context-vigilance-corpus`.
7. Model calls `slide.variant({ deck_id, slide_id: "04", style: "chroma" })`. Capability marked `requiresUserConfirmation: true`.
8. Handler generates a patch on a new branch `chat/slide-04-chroma-{ts}` per Astro Knots conventions, returns a preview payload.
9. UI surfaces preview: rendered new slide + diff of source files. User clicks Accept.
10. Confirm endpoint applies the patch to the deck's working branch (per branch tier model). Transcript row written with `key_source = "user-byok"`.
11. Nightly job ingests the transcript into `client-app-sessions` scoped to the client's org.

Failure modes the scenario must handle explicitly:
- BYOK key invalid → 402 + UI nudge.
- Model calls a capability outside whitelist → reject in dispatch, surface as text-only model reply.
- User abandons preview → branch left in place but flagged stale; cleanup job after 7 days.
- Model loops on `corpus.search` without converging → cap at 5 retrieval calls per turn (mirrors the CLAUDE.md cap for our own use of the corpus).

## Per-app rollout order

1. **Dididecks first.** Slides-as-code makes capability outputs (patches) easy to preview and reversible. Smallest blast radius.
2. **Memopop second.** Existing LangGraph agents become `agent.run` capabilities — wrapping, not rewriting. The character-cast UI is already specced.
3. **Augment-it third.** Scope still soft; by the time we get here, the registry pattern is proven and we just declare a new registry.

Each per-app prompt is a thin doc: "import `@lossless/in-app-agent`, declare these N capabilities, mount `<Chat />` in the shell at this location, run these migrations."

## Migrations to write before v1

**Web (Turso):**
- `user_api_keys` table on auth libSQL.
- `agent_transcripts` table on per-app libSQL.
- Org policy table extension: `disabled_capabilities TEXT` (JSON array of capability names).

**Tauri (local libSQL at `$APPDATA/<app>/transcripts.db`):**
- `agent_transcripts` table — same schema as web; `key_source` includes the literal `"user-byok-local"` to distinguish keychain-sourced BYOK from server-stored BYOK.
- `sync_state` table — last synced `created_at` per Turso shard, for opportunistic upstream replication when paying.

**Both:**
- **Chroma tenants:** create `lossless__global` (one-time, holds the four existing corpus collections) and one `client__{org_slug}` per onboarded client. Per-tenant collections at minimum: `client-app-sessions`, `agent-cache` (mirrors the libSQL `agent_memory_cache` table for similarity recall when it grows), and `reminders-snapshots` (point-in-time copies of the three reminder files, for retrieval-with-time-context).
- **Ingest migration:** `context-vigilance-kit/scripts/ingest-all.sh` gains a `--tenant` flag; existing four-collection writes move to `tenant=lossless__global`. One-time migration script reshapes the current default-tenant data into the new layout.
- Tauri writes flow upstream via Turso sync, not directly to Chroma.

## Open questions deferred from the exploration

These remain unresolved and should be settled before or during implementation; not blocking the spec going to draft:

1. **Tool-call format abstraction layer.** Use Vercel AI SDK vs. roll our own thin adapter. Lean AI SDK for v1 unless its BYOK story is awkward.
2. **Where the agent runtime lives.** Per-app server for v1, per the exploration. Revisit if duplication across three apps gets painful.
3. **System prompt content.** A first cut should be drafted and version-controlled at `ai-labs/packages/in-app-agent/prompts/system.md` so changes are reviewable. The Tauri bundle pins a hash of this file at build time.
4. **Cost ceiling for paying clients.** Per-org monthly token cap with a soft and hard threshold. Out of v1 scope but worth a placeholder column in the org table.
5. **TS-sidecar runtime choice.** Deno single-binary embed vs. Node sidecar process vs. porting `registry/runtime.ts` to pure Rust. Deno is the lightest cross-platform option; Node duplicates dependencies the webview already has; Rust port is the most performant but doubles maintenance. Default to Deno sidecar for v1, revisit if startup latency on cold app launch exceeds 500ms.
6. **Provider-direct calls from Tauri and CORS / API key validation.** Anthropic and OpenAI both accept direct HTTPS from a desktop binary — no CORS gotchas (no browser origin). Verify on first integration.
7. **Per-org reminders storage layout and supersession discipline.** Where do the three reminder markdown files live on disk per org — a per-org git repo, a subtree of the host app's content store, or rows in libSQL surfaced as virtual files? The blueprint at `<each-app>/context-v/blueprints/Per-Org-Reminders-Convention.md` settles this before implementation. Borrow Neo's typed/scoped fact + supersession discipline for `reminders/our_decisions.md` updates so accepted suggestions that contradict existing reminders get a clean supersede-not-duplicate path. Separately, the AI cache schema (`agent_memory_cache` table) needs TTL + LRU policy defaults pinned (proposed: 30-day TTL, 200-entry per-org LRU cap, admin-tunable).
8. **Knowledge-graph deferral revisit trigger.** Concrete trigger: the first chat user question that requires across-project relational reasoning ("which decks use this brand kit?") that we cannot answer in one libSQL query. At that point re-read the Graphiti profile with intent; not before.
9. **StateBench commitment.** After v1 deploys to one paying client, run StateBench against the deployed stack and publish numbers internally. Stops us from confusing "the chat feels good" with "the chat retrieves correctly."
10. **Self-host packaging.** Designed-for in v1 via the `{ url, tenant, database }` Chroma config seam and the absence of `corpus.search_cross_client` in self-hosted builds, but not optimized-for. When the first real self-hoster shows up: document the contract (env vars, schema migrations they run, where their auth plugs in), publish a `docker-compose.example.yml` for the Chroma + libSQL + Tauri sidecar combo, and decide whether to publish the package to npm public or keep it internal-with-tarball-distribution. Defer until there's demand.
11. **Cross-client retrieval policy.** When `corpus.search_cross_client` is invoked, what's the audit log shape, who's notified, and is there a per-client opt-out (a client telling us "do not surface our data in your other engagements even with consent")? Default position: opt-out is on by default for `lingering` tier, off by default for `paying` (as a term of the engagement contract). Settle the contract language before the capability ships.

## Next artifacts

- `ai-labs/packages/in-app-agent/` scaffolded (package.json, src skeleton, README pointing here).
- `dididecks-ai/context-v/prompts/Implement-In-App-Agent-Chat.md` — per-app integration prompt.
- A first capability for dididecks (`slide.read`) implemented end-to-end as a walking-skeleton before the rest are stubbed.

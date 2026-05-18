---
title: "In-App Agent Chat — Walking Skeleton Plan"
lede: "Starter kit for tomorrow's session. Three days of conversation have produced an exploration, a spec, a memory-layers exploration, and a tenancy decision. This plan turns all of it into one session's worth of concrete work: scaffold the package, do the Chroma tenant migration, settle two open questions that block everything downstream, and ship slide.read end-to-end as the proof the abstractions hold."
date_created: 2026-05-18
date_modified: 2026-05-18
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.1
tags:
  - Plan
  - In-App-Agent-Chat
  - Walking-Skeleton
  - Chroma-Multi-Tenant
  - Dididecks
  - Package-Scaffold
status: Draft
---

# In-App Agent Chat — Walking Skeleton Plan

## What this plan is for

Tomorrow's session has finite scope. The full spec ([[In-App-Agent-Chat-Core-Package]]) is multi-week. The goal of one session is to **make the riskiest substrate decisions reversible** and **prove the abstractions hold** by getting one capability working end-to-end. Everything else can iterate.

The three risks worth retiring first, in order:

1. **Chroma tenancy migration.** Cheap today, expensive after three apps depend on the old layout. Settle this before any new code lands.
2. **The Tauri-vs-web client abstraction.** If `AgentClient` doesn't naturally span both transports, the whole dual-target story collapses. Prove it with one capability before committing to seven.
3. **The user/AI memory trust split.** The capability shape (`reminders.suggest` requires user-accept; `cache.note` doesn't) is enforced at the registry runtime. If the runtime can't actually pause the agent loop for confirmation, the trust split is theatre.

The walking skeleton: dididecks chat surface invokes `slide.read` on a real deck through the web client, returns rendered preview. That's it. No mutations, no BYOK, no Tauri — but the registry runtime, the `AgentClient` interface, and the tenant-scoped corpus retrieval all get exercised.

## Read first (cold-start reading list)

A future-you walking in tomorrow with no context. Read in this order, total ~20 minutes:

1. [[In-App-Chat-as-Agent-Surface-for-Client-Apps]] — the framing exploration. The "verb on a noun the system already knows about" pattern and the three-guard model.
2. [[In-App-Agent-Chat-Core-Package]] — the spec. Skim the dual-target section, the eight capabilities table, the tenancy section, and the V1 acceptance scenario. Skip the deeper sub-sections for now.
3. [[Memory-Layers-for-the-In-App-Chat-Package]] — Role 1b (tenancy) and Role 3 (user/AI memory split). These are the two load-bearing design moves that aren't in the spec's surface scan.
4. `ai-labs/dididecks-ai/context-v/specs/Dididecks-AI-Slide-Decks-as-Code.md` — confirm the on-disk shape `slide.read` will return.
5. `ai-labs/context-vigilance-kit/README.md` — confirm the current ingest scripts and which tenant they write to today (default).

If anything in the spec disagrees with the explorations, the **explorations are newer and authoritative** — the spec has been edited to match but spot-check the capability tables and the prompt-caching section.

## Decisions to settle before coding (~30 min)

These are the open questions that, if left open, will block phase 3 the moment a real choice is needed. Settle them at the start, not when stuck.

1. **TS-sidecar runtime for Tauri** (spec open question #5). Default to Deno single-binary. Confirm or pick Node.
2. **Reminders storage layout** (spec open question #7). Three candidates: (a) per-org git repo, (b) subtree under each host app's content store, (c) libSQL rows surfaced as virtual files. Recommend (b) for v1 — lowest deploy complexity, fits the existing per-app libSQL story.
3. **System prompt content — first cut.** Draft the three slabs in plain prose (static spine, capability schema preamble, reminders prefix). Write to `ai-labs/packages/in-app-agent/prompts/system.md`. Doesn't need to be final; needs to exist so cache breakpoints have something to wrap.
4. **Tenant slug convention.** Spec says `client__{org_slug}`. Pin the slug rules (lowercase, kebab, max 32 chars, no leading digits). Five minutes; saves a future rename.

## Phase 1 — Scaffold the package (~45 min)

Goal: empty package compiles, imports nothing, can be imported by a sibling app.

```
ai-labs/packages/in-app-agent/
├── package.json                   # name: @lossless/in-app-agent
├── tsconfig.json
├── README.md                      # one paragraph + link to the spec
├── prompts/
│   └── system.md                  # from decision step 3
├── src/
│   ├── index.ts                   # re-exports
│   ├── client/
│   │   ├── types.ts               # AgentClient interface only
│   │   └── http.ts                # stub: throws "not implemented"
│   ├── registry/
│   │   ├── types.ts               # Capability, CapabilityContext, CapabilityResult
│   │   └── runtime.ts             # validate + dispatch (real impl)
│   └── retrieval/
│       └── chroma.ts              # wrapper takes { url, tenant, database }
└── tests/
    └── registry.runtime.test.ts   # one passing test
```

Concrete done-when:
- [ ] `pnpm install` from `ai-labs/packages/in-app-agent/` succeeds.
- [ ] `pnpm test` runs the one registry test and it passes.
- [ ] `dididecks-ai` can `import { runtime } from '@lossless/in-app-agent/registry'` without a build error (workspace link).

Skip in phase 1: UI components, Tauri crate, transcript store, router, server endpoints. Those land in phases 4+.

## Phase 2 — Chroma tenant migration (~60 min)

Goal: `lossless__global` tenant exists, the four existing collections live in it, the MCP server reads/writes to it by default, our own Claude Code sessions still work.

Steps:

1. **Read the current state.** Check what tenant `mcp__chroma__chroma_list_collections` reports today (will be `default_tenant`). Note the row counts for each of the four collections.
2. **Create `lossless__global`.** Via the Chroma client or a one-off Python script using `chromadb.HttpClient.create_tenant`.
3. **Migrate the four collections.** `chroma_fork_collection` if the API supports cross-tenant forking; otherwise dump + reingest using the existing `ingest-all.sh` against the new tenant. The reingest path is safer for v1 — we know the kit works.
4. **Update the MCP server config.** Wherever `.mcp.json` is configured (in `ai-labs/.mcp.json` and `~/.claude.json`), add the tenant to the connection. Restart MCP client.
5. **Add the `--tenant` flag to `ingest-all.sh`.** Default to `lossless__global` for the existing collections.
6. **Smoke test.** From this Claude Code session tomorrow, run `mcp__chroma__chroma_query_documents` and confirm the four collections are reachable in their new home.
7. **Don't delete the old default-tenant collections yet.** Rename or leave in place for one week as fallback. Schedule a delete-by date.

Concrete done-when:
- [ ] `lossless__global` tenant exists and contains the four collections with row counts matching pre-migration.
- [ ] An MCP query from a fresh Claude Code session returns expected results from `lossless__global`.
- [ ] `ingest-all.sh --tenant lossless__global` is idempotent against the new layout.
- [ ] The first per-client tenant (`client__lossless-internal`) is created as the test bed for phase 3. Empty collections, just the tenant.

Out of scope for tomorrow: actually onboarding a real client into their own tenant. That happens when dididecks goes live. Phase 2 only needs the *plumbing* to work for one test tenant.

## Phase 3 — Walking-skeleton capability: `slide.read` (~90 min)

Goal: end-to-end happy path. dididecks chat surface → web `AgentClient` → server route → capability runtime → `slide.read` handler → slide source + rendered preview returned to UI.

This is the smallest slice that exercises every layer except mutations, BYOK, Tauri, and reminders. Those are deferred.

Pieces to write, in dependency order:

1. **`slide.read` capability definition** in `dididecks-ai/src/server/capabilities.ts`:
   - `name: "slide.read"`, `kind: "read"`, `requiredTier: "user"`, `requiresUserConfirmation: false`
   - inputSchema: `{ deck_id: string, slide_id: string }`
   - handler: reads the slide file from the slides-as-code repo, returns `{ source: string, rendered_html: string }`

2. **Web SSE chat endpoint** at `dididecks-ai/src/routes/api/agent/chat/+server.ts` (SvelteKit):
   - Auth gate (reuse Shared-Auth session resolution — stub if not wired yet, but fail closed).
   - Resolve org → tenant (`client__{org_slug}`).
   - Build the system prompt from the three slabs (cache-control breakpoints on the static + capability + reminders slabs).
   - Stream Anthropic call with `slide.read` tool definition.
   - On tool call, dispatch through `registry.runtime.dispatch()`, return result into the model loop.

3. **`AgentClient` HTTP implementation** in `@lossless/in-app-agent/client/http.ts`:
   - `chat({ messages, projectId, model, tools })` opens an EventSource against the endpoint.
   - Surfaces three event kinds: `text` (streaming model output), `tool_call_started`, `tool_call_completed`.

4. **Minimal chat UI** in `dididecks-ai/src/lib/components/Chat.svelte`:
   - Composer + message list. No character row, no settings panel, no BYOK panel — those come later.
   - Mounts the `webClient` from the package.

5. **Manual test scenario:**
   - Log into dididecks as a Lossless-internal user (org → `lossless-internal` → tenant → `client__lossless-internal`).
   - Open a real deck. Open chat.
   - Type: *"Show me slide 4 of this deck."*
   - Expect: model calls `slide.read`, response includes the slide source quoted back.

Concrete done-when:
- [ ] One real chat turn end-to-end with `slide.read` invoked correctly.
- [ ] Transcript row written (even if minimal schema).
- [ ] Prompt cache headers visible in the Anthropic response (`cache_read_tokens > 0` on the second turn).
- [ ] `corpus.search` is *not* needed for this scenario — confirms the registry can present a partial tool whitelist correctly.

## Phase 4 — Stop and write down what hurt (~15 min)

Mandatory. The whole point of a walking skeleton is to surface friction the spec couldn't predict.

Append a `## Walking-Skeleton Session Notes` section to *this plan file*, covering:

- What in the spec was wrong, ambiguous, or harder than expected.
- What in the explorations needs revision.
- What the next session should attack first (slide.variant for the mutate path? Tauri client to prove the dual-target story? Reminders capability + suggest UI?).
- Whether the prompt-cache breakpoints actually fired.
- Whether the tenant routing was as transparent as the spec claims, or whether it leaked through the abstraction in some way.

If anything in this section reveals a wrong assumption in the spec, edit the spec same-session — drift between spec and implementation is the actual failure mode.

## What's explicitly out of scope tomorrow

Listing these so the session doesn't sprawl:

- BYOK key entry UI or storage.
- Tauri sidecar (Rust crate, ts-sidecar, keychain). The web walking skeleton has to work first.
- `slide.variant`, `deck.export`, or any mutating capability. Read-only proves the pipe; mutations test the preview/confirm loop and need their own session.
- The `reminders.*` and `cache.*` capabilities. Same reason — earn them once `slide.read` works.
- Character-cast UI from the Memopop spec. Cosmetic; doesn't change correctness.
- Memopop or augment-it integration. Dididecks first; the others land after the abstractions are proven on one real app.
- StateBench, telemetry dashboards, cost ceilings. Premature without traffic.

## Pre-flight checklist (run before opening the session)

Five minutes the night before / first thing tomorrow, so the session starts on substrate not setup:

- [ ] `pnpm` and `uv` both work in `ai-labs/`.
- [ ] Anthropic API key in `~/.secrets` and exported in shell (the prompt-cache test in phase 3 needs a real key — paying tier).
- [ ] Chroma is running and the MCP server can reach it from a fresh Claude Code session. (`mcp__chroma__chroma_list_collections` returns the four expected collections.)
- [ ] `dididecks-ai` is on a fresh `development` branch (per branch tier model) and the dev server starts cleanly.
- [ ] One real test deck exists in dididecks with at least 4 slides — phase 3 needs a real noun to invoke `slide.read` against.

## If the session runs short

Priority order if time runs out:

1. **Phase 2 must finish.** A half-migrated Chroma layout is worse than not starting — fall back to "do not start phase 2 unless ~60 min remain."
2. **Phase 3 step 1 (the `slide.read` capability definition)** is the smallest unit of permanent progress. Even without the SSE endpoint or UI, having the capability + a unit test against the registry runtime is a real artifact.
3. Phase 1 (scaffolding) is cheap and resumable — fine to leave half-done.

## Related artifacts to create or update during the session

- [ ] `ai-labs/packages/in-app-agent/README.md` — one paragraph, link to spec.
- [ ] `ai-labs/packages/in-app-agent/prompts/system.md` — first cut of the static spine.
- [ ] `ai-labs/dididecks-ai/context-v/blueprints/Per-Org-Reminders-Convention.md` — only if decision step 2 picks option (b) and there's time. Otherwise carry to next session.
- [ ] `ai-labs/context-vigilance-kit/scripts/ingest-all.sh` — add `--tenant` flag.
- [ ] `ai-labs/changelog/2026-05-19_In-App-Agent-Chat-Walking-Skeleton.md` — at end of session, per [[changelog-conventions]].

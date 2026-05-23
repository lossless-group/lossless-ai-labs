---
title: "Agent Capabilities — Hooking the Chat Surface into Memopop"
lede: "A journey-mode walkthrough for the team: how the In-App Agent Chat pattern (originally scoped against dididecks) maps onto memopop-ai, where each layer of the architecture lives in the existing repo, and what the smallest read-only proof-of-life looks like. Drafted to be turned into slides — each H2 is a slide candidate."
date_created: 2026-05-18
date_modified: 2026-05-18
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.1
tags:
  - Slides
  - Agent-Capabilities
  - In-App-Agent-Chat
  - Memopop
  - Walking-Skeleton
  - Capability-Registry
  - Team-Onboarding
status: Draft
---

# Agent Capabilities — Hooking the Chat Surface into Memopop

## Why this doc exists

I haven't done this before. The team hasn't either. So I'm being deliberate about documenting the journey before writing any code — what we're trying to do, why this shape and not another, and what the smallest version that proves it works looks like.

Reading order if you're new to the thread:

1. [[In-App-Chat-as-Agent-Surface-for-Client-Apps]] — why we want a chat surface at all
2. [[In-App-Agent-Chat-Walking-Skeleton]] — the dididecks-first plan that this doc adapts
3. This file — the memopop adaptation

## The core bet, in one sentence

Instead of designing a button for every request a client could make ("re-run the writer", "re-score the comparables", "export as one-pager"), we wire up a single chat surface that calls an LLM with our patterns, skills, and project context already loaded — and the LLM invokes a **bounded registry of capabilities** against the nouns the system already knows.

The pattern: *"verb on a noun the system already knows about."* Memopop already knows what a memo, a section, a citation, a scorecard, a firm, a deal are. Chat just lets the user name the verb.

## What memopop already has that dididecks doesn't

This is the surprise. Dididecks had to build the agent backend from scratch. Memopop already shipped most of it:

- `apps/memopop-orchestrator/` — Python FastAPI server + the actual agent graph, schemas, scorecards, scrapers, curation, final-draft pipeline
- `apps/memopop-native/` — the SvelteKit + Tauri desktop client where users actually work
- `apps/memopop-web-app/` — the SvelteKit web counterpart
- A real noun model: firms, deals, memos, sections, citations, scorecards, characters

So for memopop, capabilities aren't new functionality — they're **trigger surfaces into FastAPI routes that already exist**. Chat is the way to invoke the graph that already runs.

## Where each layer of the architecture lives

| Layer | Location |
|---|---|
| `@lossless/in-app-agent` package (UI + AgentClient + registry runtime + Chroma wrapper) | `ai-labs/packages/in-app-agent/` (shared across dididecks, memopop, augment-it) |
| Capability *definitions* for memopop | `memopop-ai/apps/memopop-native/src/lib/agent/capabilities.ts` |
| Capability *handlers* | thin TS shims that call FastAPI endpoints in `memopop-orchestrator/src/server/` |
| SSE chat endpoint | new SvelteKit route `apps/memopop-web-app/src/routes/api/agent/chat/+server.ts` |
| Chat UI mount | `apps/memopop-web-app/src/lib/components/Chat.svelte`, then later mirrored into `memopop-native` |

The split is the load-bearing decision: the orchestrator already owns memo state and the agent graph. Capabilities are **adapters**, not reimplementations. If the team takes one thing away from this doc, it's that line.

## How memopop's walking skeleton differs from dididecks's

Four real differences worth naming, so the team doesn't mechanically copy the dididecks plan.

### 1. The smallest read-only capability is different

Dididecks's walking skeleton is `slide.read({ deck_id, slide_id })` returning slide source + rendered HTML.

Memopop's analog is **`memo.read_section({ memo_id, section_id })`** returning `{ markdown, citations }`. Both already exist as concepts in memopop's schemas; chat just exposes them as agent-callable verbs. Both are read-only, both exercise the full pipe without touching mutation logic.

### 2. Chroma tenant migration is shared infrastructure, not memopop's problem

Phase 2 of the dididecks plan migrates the four collections into `lossless__global` and creates the first per-client tenant `client__lossless-internal`. That's universal — it happens once, before *either* app integrates. If it's already done by the time memopop starts, memopop reuses `client__{org_slug}` directly. Don't redo it.

### 3. Web app first, then Tauri — even though native is the active surface

Memopop's active client is `memopop-native` (Tauri). Tempting to go straight there. Don't — the plan defers Tauri sidecar plumbing for a reason (keychain, BYOK, single-binary runtime choice are all live decisions). Build the chat endpoint in `memopop-web-app` first, prove the abstraction with the same SvelteKit substrate dididecks uses, then mount the same component in native once the dust settles.

### 4. BYOK and per-org tenancy are heavier here

Memos are sensitive client data in a way slide aesthetics aren't. The walking skeleton still uses our keys + the `client__lossless-internal` tenant; per-org rollout (real client keys, real per-org Chroma tenants, redaction policy) is a later phase. Naming it now so we don't pretend the v1 is production-ready for paying clients.

## Character cast — defer, but it lands here naturally

The character-cast UI pattern is already specced in memopop ([[Character-Cast-for-Live-Agent-Indication]]). When chat ships and agent presence becomes a real thing the user can see, the cast is the obvious indicator surface. It's still out of scope for the walking skeleton (cosmetic, doesn't change correctness), but flagging it because memopop is the app where it eventually lives.

## The walking skeleton, scoped to memopop

Five steps, roughly one focused session:

1. Pick the capability: `memo.read_section({ memo_id, section_id })` → `{ markdown, citations }`.
2. Audit `memopop-orchestrator/src/server/` and confirm (or add) the FastAPI route that backs it.
3. Build the SvelteKit SSE chat route in `memopop-web-app/src/routes/api/agent/chat/+server.ts`.
4. Mount the chat component. Smoke-test one turn: *"Show me the market section of memo X with its citations."*
5. Write the session-notes section: what was wrong in the spec, what was harder than expected, what the next session attacks first.

If we can't get step 4 to fire end-to-end, the abstractions are wrong and we'd rather know now than after wiring seven capabilities.

## The three guards — why this isn't a security disaster

Worth saying out loud because it's the part skeptics will push on.

1. **Capability registry is the only side-effect surface.** No `bash`, no arbitrary file write, no `fetch`. The LLM either picks a registered capability or returns text-only.
2. **System prompt anchored in loaded skills.** "Use Lossless patterns. If a request doesn't map to a registered capability, explain what you'd do and ask the user to escalate to a paid engagement." That polite-refusal path is the *feature* — it converts requests we can't service into either a sale or a clean "no."
3. **Per-org policy.** An org admin can disable capabilities (e.g., "no exports without my approval") via the same admin powers the auth doc contemplates.

## Open question I'd like resolved before code lands

Is `@lossless/in-app-agent` already scaffolded (Phase 1 of the dididecks plan)? If neither dididecks nor memopop has built the package yet, **memopop can be the first consumer** — but then Phase 1 and Phase 2 of the original walking-skeleton plan run *here*, not in dididecks-ai.

This is a real fork in the road, not a detail. Worth deciding deliberately.

## What this doc is not

- Not the spec. The spec is [[In-App-Agent-Chat-Core-Package]].
- Not the master plan. The master plan is [[In-App-Agent-Chat-Walking-Skeleton]].
- Not a commitment to memopop-first. It's the memopop adaptation of a plan that was authored against dididecks-first; which app actually goes first is the open question above.
- Not slide-ready yet. Each H2 is a slide candidate, but the prose still needs the typical slide-mode compression pass before it deploys.

## Related artifacts

- `ai-labs/context-v/plans/In-App-Agent-Chat-Walking-Skeleton.md`
- `ai-labs/context-v/explorations/In-App-Chat-as-Agent-Surface-for-Client-Apps.md`
- `ai-labs/context-v/specs/In-App-Agent-Chat-Core-Package.md`
- `ai-labs/context-v/explorations/Memory-Layers-for-the-In-App-Chat-Package.md`
- `memopop-ai/apps/memopop-orchestrator/src/server/` — the FastAPI routes capabilities will adapt
- `memopop-ai/context-v/specs/Character-Cast-for-Live-Agent-Indication.md` — agent presence pattern

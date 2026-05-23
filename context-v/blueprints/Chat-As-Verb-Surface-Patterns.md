---
title: "Chat-As-Verb-Surface Patterns — How the In-App Chat Calls Skills, MCP Tools, and Scripts; How it Reads State and Anticipates Lightly"
lede: "The recyclable patterns that let augment-it, memopop-ai, and dididecks-ai share a chat surface without sharing a package. Five conventions: capability adapters (skill / MCP / script) that all return the same envelope, a lifecycle event stream every capability emits so the chat can narrate and quality-check execution, a state-aware anticipation map keyed on activeView, three explicit response modes (answer / propose / invoke) for loose alignment, and a fourth cache-eligible system-prompt slab for active skills. Grounded in agentskills.io, MCP 2025-11-25, 12-factor-agents F4/F5/F7/F8, and the Frictionless TableSchema. Each pattern names the upstream prior art so future-you can re-read source instead of trusting the summary."
date_created: 2026-05-22
date_modified: 2026-05-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.1
tags:
  - Blueprint
  - In-App-Agent-Chat
  - Capability-Adapter
  - Skill-Capability
  - MCP-Capability
  - Script-Capability
  - Lifecycle-Events
  - Anticipation
  - Loose-Alignment
  - Prompt-Cache-Slabs
  - Applied-AI-Labs
status: Draft
---

# Chat-As-Verb-Surface Patterns

## Why this blueprint exists

[[Per-App-Workspace-Conventions]] settles **where state lives** — in per-app `@<app>/workspace` packages. [[Remote-Mount-Contract-for-In-App-Agent]] settles **how the chat seam reaches that state** — through a typed `WorkspaceAdapter`. Both stop at the chat's outer edge.

This blueprint goes inside the chat. It answers five questions that show up the moment you wire a real capability:

1. A capability isn't always a hand-written TypeScript function. How does the chat invoke a **SKILL.md skill**, an **MCP tool**, or a **shell script** — without inventing three parallel runtimes?
2. When a capability runs (especially a script), how does the chat **narrate progress** and **catch quality regressions** in the output?
3. When the user lands on a screen, how does the chat **know where they are** and **suggest the next 1–3 verbs** without becoming a dialog tree?
4. When the model picks up an ambiguous turn, how does the chat decide whether to **answer**, **propose**, or **invoke** — and let you tune that knob per app or per session?
5. How do we cache the right slabs of the system prompt so this gets cheap, not expensive?

The patterns below are the discipline. None of this is shared code yet — they're conventions augment-it implements first ([[In-App-Chat-v0-0-1-for-Augment-It]]), memopop and dididecks implement against the same names, and the third app's extraction tells us where the shared package belongs.

## Anchoring prior art (in `studies/`)

Each pattern cites the upstream code that shaped it. Per the `study-repos-first` skill, re-read the source when extending — don't paraphrase from this doc.

- `studies/open-specs-and-standards/ai-skills/template/SKILL.md` — the two-field SKILL.md frontmatter (`name`, `description`)
- `studies/open-specs-and-standards/ai-skills/README.md:73-103` — discovery via description; dynamic loading
- `studies/open-specs-and-standards/modelcontextprotocol/schema/2025-11-25/schema.ts:1106-1132` — `CallToolResult` envelope (content + structuredContent + isError)
- `studies/open-specs-and-standards/modelcontextprotocol/schema/2025-11-25/schema.ts:1251-1299` — `Tool` interface and `ToolAnnotations` hints (readOnly, destructive, idempotent, openWorld)
- `studies/open-specs-and-standards/modelcontextprotocol/schema/2025-11-25/schema.ts:618` — `ProgressNotification` for long-running tools
- `studies/open-specs-and-standards/12-factor-agents/content/factor-04-tools-are-structured-outputs.md` — tools as structured outputs over deterministic execution
- `studies/open-specs-and-standards/12-factor-agents/content/factor-05-unify-execution-state.md` — one thread is both execution and business state
- `studies/open-specs-and-standards/12-factor-agents/content/factor-07-contact-humans-with-tools.md` — humans-as-tools (`request_human_input`, `done_for_now`)
- `studies/open-specs-and-standards/12-factor-agents/content/factor-08-own-your-control-flow.md` — three control-flow patterns: sync-continue, async-break, high-stakes-break
- `studies/data-analytics-specifications-and-standards/datapackage/profiles/dictionary/schema.yaml` — TableSchema field shape for record-set typing

## Pattern 1 — Capability adapters: one envelope, three sources

Per [[Per-App-Workspace-Conventions]], the capability registry is the only documented mutation surface. This blueprint adds: **a capability's `handler` doesn't have to be a TypeScript function**. Three adapter shapes cover everything we currently do, and all three return the **same `CapabilityResult<T>` envelope** so the chat doesn't care which adapter ran.

The envelope mirrors MCP's `CallToolResult` deliberately (see `schema.ts:1106-1132`): if we ever wrap a capability *as* an MCP tool for an external consumer, the shapes already line up.

### TS handler (the default)

A pure in-process function. Use for anything that's already a method on the workspace or its services. Example: `records.list`, `records.get`, `enrich.row`.

### SkillCapability — wraps a `SKILL.md`

A capability whose `handler` field references a SKILL.md path. The runtime, when the capability is in the per-turn whitelist:

1. Loads the SKILL.md body into the "active skills" prompt slab (see Pattern 5).
2. Exposes a single tool to the LLM whose name and description come from the skill's frontmatter — matching the agentskills.io two-field minimum (`studies/.../ai-skills/template/SKILL.md`).
3. Treats the model's tool call as a request for the skill to *advise*; the actual side effects still flow through *other* registered capabilities the skill instructs the model to call.

The trigger-shape pattern from Claude Code carries over: skills load when their description matches the turn, not always. Augment-it's `crawl-fetch-ingest` skill becomes a `SkillCapability` named `crawl_fetch_ingest`; the model calls it to *plan* an ingestion run, then calls `records.import` / `enrich.batch` to *execute*. Two-step separation keeps skills as instructions, not actions.

### McpCapability — wraps a single MCP tool

A capability whose `handler` invokes one named MCP tool through the user-scope MCP client. The chat doesn't speak MCP directly; the capability translates.

The capability descriptor carries the MCP `Tool.annotations` through (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`). Two of those map directly to discipline we already have:

| MCP annotation       | Workspace discipline                                               |
|----------------------|--------------------------------------------------------------------|
| `readOnlyHint: true` | Maps to `kind: 'read'`; no `requires_user_confirmation`            |
| `destructiveHint`    | Maps to `requires_user_confirmation: true`                         |
| `openWorldHint`      | Surfaced in the UI as "this can fetch external data" affordance     |
| `idempotentHint`     | Enables retry on lifecycle `error` without confirmation re-prompt |

Concrete first instance for augment-it v0.0.1: `corpus.search` wraps `mcp__chroma__chroma_query_documents`, scoped to `client__{org_slug}` + read-only `lossless__global` per [[Memory-Layers-for-the-In-App-Chat-Package]] Role 1b.

### ScriptCapability — wraps a shell command or pnpm script

A capability whose `handler` shells out. The descriptor adds three required fields beyond the base:

- `command: string` — the shell template, with `{{arg}}` placeholders bound from `args_schema`
- `expected_effect: { description: string, postconditions: Postcondition[] }` — what the script is supposed to make true (see Pattern 2)
- `cwd: string` — relative to the app root; the runtime refuses absolute paths or `..` traversal

The runtime never invokes a raw `bash` capability. Scripts are explicitly registered, with a typed input schema, just like any other capability. F4's discipline (`factor-04-tools-are-structured-outputs.md`) holds: the LLM emits structured args; deterministic code chooses *which* shell to spawn.

Concrete example for augment-it: a `records.import_csv` ScriptCapability wraps the existing CSV ingest script with `expected_effect: "records inserted equal to non-blank rows in the CSV; column count equal to header count"`.

## Pattern 2 — Lifecycle events + expectation contracts

Every capability invocation emits a typed event stream. Five event kinds, modeled on MCP's `ProgressNotification` (`schema.ts:618`) plus what augment-it's SSE pattern already does ([[Per-App-Workspace-Conventions]] §"SSE event ingestion"):

```
capability.started     { capability, args, invocation_id, ts }
capability.progress    { invocation_id, fraction?, message?, ts }
capability.output      { invocation_id, chunk: ContentBlock, ts }
capability.done        { invocation_id, result: CapabilityResult, ts }
capability.error       { invocation_id, error, recoverable: boolean, ts }
```

Both the chat surface and the Window subscribe to this stream (it's a sub-stream of `workspace.jobEvents` per the adapter interface). The character-cast row from the Memopop spec consumes it — "who's working right now" is literally a fold over open `invocation_id`s.

### Expectation contracts (the quality knob)

For `ScriptCapability` specifically, `expected_effect.postconditions` is a list of typed checks the runtime runs **after** `capability.done`. Each postcondition is one of:

- `row_count_change` — `{ entity: 'records', op: '+=' | '==' | '>=', value: number }`
- `file_created` — `{ glob: string, min_count: number }`
- `exit_code` — `{ equals: 0 }`
- `stdout_matches` — `{ pattern: string, mode: 'must' | 'must_not' }`
- `duration` — `{ max_ms: number }` (soft hint; emits a `quality.slow` event but doesn't fail)

When a postcondition fails, the runtime emits `capability.quality_violation` (a sixth event kind), keeps the capability `done`, but tags the transcript row with the failure. The chat's system prompt instructs the model to **acknowledge the violation in its next turn** rather than carrying on as if nothing happened — F9's "compact errors into context window" applied to soft failures, not just hard ones.

This is the seam the user asked for: "augment the command, or monitor quality of the command execution and output." Augmenting = the chat re-invokes with corrected args; monitoring = postconditions + the `quality_violation` event.

### Why not just check the result?

Because `result: CapabilityResult<T>` only tells you what the *handler returned*. It doesn't tell you the workspace ended up in the expected state. A CSV ingest can return `{ ok: true, inserted: 0 }` and that's a postcondition violation (the file had rows; zero inserted is a failure shape, not a successful no-op). The contract is workspace-aware.

## Pattern 3 — Anticipation map (state-aware "what's next")

Anticipation is **not** a dialog tree, not an LLM-loop, not freeform "what would you like to do next?" prompting. It's a flat lookup keyed on `(activeView.kind, last_capability)` returning **0–3 suggested capability names** with one-line invocation hints.

```ts
// in @<app>/workspace/src/anticipation.ts
type AnticipationKey = `${ActiveView['kind']}::${string | 'none'}`;

interface Suggestion {
  capability: string;          // 'enrich.batch'
  hint: string;                // "Enrich all 47 records with social profiles."
  prefill?: Record<string, unknown>;
}

export const anticipation: Record<AnticipationKey, Suggestion[]> = {
  'record_list::records.import':      [{ capability: 'enrich.batch', hint: '...' }, ...],
  'record_list::enrich.batch':        [{ capability: 'crm.export',    hint: '...' }, ...],
  'record_detail::none':              [{ capability: 'enrich.row',    hint: '...' }, ...],
  // ...
};
```

The chat's system prompt receives the current suggestions as a small `## Suggested next verbs` slab on every turn (cheap; uncached on purpose because it changes). The model can:

- Propose any of them (Pattern 4's "propose" mode).
- Invoke one directly if the user's turn names it.
- Ignore them entirely if the user asks something off-pattern.

Anticipation **lives in the per-app workspace**, not the chat package. Each app knows its own pipeline; the chat is domain-agnostic. The map is editable as a flat file — no infrastructure, no graph runtime, no learning loop. When the map gets uncomfortable (more than ~40 entries) split per `activeView.kind` into separate files.

### Why a flat map and not an LLM "what next?" call

Three reasons. First, latency: a flat lookup is sub-millisecond; an LLM call is 1–3 seconds of dead air after every capability. Second, predictability for client demos: the same screen suggests the same next verbs every time, which is what makes a demo feel like a product. Third, F8: own your control flow. The flat map *is* control flow; we're not asking the model to control flow on our behalf.

## Pattern 4 — Three response modes, explicit and tunable

The chat's system prompt declares three intents the model is allowed to emit, in the F4/F7 style. Per turn, the model picks exactly one:

| Mode      | What it returns                                                     | When it's right                                       |
|-----------|---------------------------------------------------------------------|-------------------------------------------------------|
| `answer`  | Text only, no capability invoked                                    | User asked a factual or conversational question        |
| `propose` | One or more capability suggestions, with prefilled args, awaiting user accept | User intent is plausible but not explicit; default for ambiguity |
| `invoke`  | A tool call against a single capability, with full args             | User named the verb, *or* accepted a prior `propose`   |

This is F7 applied to the workflow surface: `propose` is the equivalent of `request_human_input`. F8 applied: `invoke` may sync-continue (read) or break-for-confirmation (mutate with `requires_user_confirmation`).

### The looseness knob

A single per-app constant — `chat.alignment_mode: 'strict' | 'loose'` — biases how the model picks between `invoke` and `propose` on ambiguity:

- `strict`: prefer `propose` on anything not directly named. Lower error rate, more clicks.
- `loose`: prefer `invoke` when there's a single clear capability that matches the user's words. Faster, occasional misfires.

For augment-it v0.0.1 in a client meeting → `strict`. Once the demo's over and the user is doing real work → `loose`. The constant lives in `@<app>/workspace` config; toggling it is a code change, not a runtime flag (don't ship runtime UI for this until two apps have it).

### Why explicit modes instead of "model decides"

Without explicit modes, every turn is implicitly a coin flip between "I'll just say something" and "I'll execute." That's the failure mode the augment-it origin remembered ([[augment-it gating + microfrontend thesis]] — "bulk AI enrichment went haywire"). Three named intents + a default toward `propose` is the gate.

## Pattern 5 — Four cache-eligible system-prompt slabs

The spec's three slabs ([[In-App-Agent-Chat-Core-Package]] §"Prompt caching") become **four** when we add SkillCapability:

```
[1] STATIC SPINE          — package-version-pinned framing + the three response modes
[2] CAPABILITY SCHEMAS    — per-turn whitelist, in stable order
[3] ACTIVE SKILLS         — SKILL.md bodies for any SkillCapability in the whitelist
[4] PER-ORG REMINDERS     — client_profile / our_decisions / gotchas (per [[Memory-Layers-for-the-In-App-Chat-Package]])
---- cache boundary ----
[5] SUGGESTED NEXT VERBS  — Pattern 3 output; uncached
[6] CURRENT THREAD        — uncached
[7] RETRIEVED CORPUS / CACHE.RECALL  — uncached
[8] USER MESSAGE          — uncached
```

Cache breakpoints between 1/2, 2/3, 3/4, 4/volatile.

The discipline: **the active-skills slab must be stable across turns within a session** for cache hits to fire. Two implications:

- Whitelist changes mid-session (e.g., `activeView` transition pulls in a new capability that's a SkillCapability) invalidate the cache from that point forward. That's fine — measure it via the per-row `cache_creation_tokens` telemetry and move on.
- Don't *partially* load skills. A skill is either fully in slab 3 or not in slab 3. No truncation, no summary substitution. If a skill is too big to keep loaded, split it upstream and load only the relevant sub-skill — same discipline the `context-vigilance` skill recommends for over-long docs.

## How the patterns compose (one paragraph)

A user lands on `record_list` after running `records.import`. The workspace fires Pattern 3's lookup → returns `[{ capability: 'enrich.batch', hint: '...' }]`. That suggestion lands in slab 5 of the next turn's prompt. The user types "yeah, do that for the unscored ones." Pattern 4 sees an accepted proposal → `invoke`. The capability is `enrich.batch`, declared in `@augment-it/workspace` as a ScriptCapability (Pattern 1) with `expected_effect.postconditions` requiring `row_count_change: { entity: 'enrichments', op: '+=', value: matched_rows.length }`. Lifecycle events (Pattern 2) stream into the character-cast row; the chat narrates progress. Postconditions pass → `capability.done` with `display_hint: { mount: 'enrichment_job', layout: 'full' }`. `activeView` transitions; Pattern 3 fires again for the new screen. No new model call needed for the suggestion; cache hits on slabs 1–4 (Pattern 5) because nothing in the whitelist changed.

## Anti-patterns

1. **Returning the SKILL.md body as the capability result.** Skills are *instructions* loaded into the prompt; their result is whatever the model does next, not the skill text. SkillCapability's "tool call" is a signal that the skill was consulted, nothing more.
2. **Inventing a parallel envelope for MCP capabilities.** Use `CapabilityResult<T>` shaped to mirror `CallToolResult`. If you find yourself adding fields MCP already has, copy MCP's name.
3. **Running shell commands without an `expected_effect`.** A script with no postcondition is a script the chat can't verify. Either declare the contract or use a TS handler.
4. **Anticipation maps that call the model.** That's a control-flow agent, not a suggestion engine. The map is a flat lookup; if you need branching, add `activeView` variants, not LLM calls.
5. **Mixing `answer` and `invoke` content in one model turn.** Pick one intent per turn. Mixing them defeats Pattern 4's gating and makes Pattern 2's lifecycle events ambiguous (was that text the result of an `answer` or a side-channel of an `invoke`?).
6. **Caching the suggestions slab.** Anticipation changes per turn by design; caching it would poison the prefix.
7. **Borrowing field types for record schemas from training data instead of TableSchema.** Use Frictionless TableSchema's closed set (string, number, integer, date, time, datetime, boolean, object, ...). Same names, same semantics.

## What this enables for v0.0.1 (augment-it)

The augment-it plan ([[In-App-Chat-v0-0-1-for-Augment-It]]) implements exactly this slice:

- **Three capabilities, one of each adapter shape (Pattern 1):**
  - `records.list` — TS handler. `kind: 'read'`.
  - `corpus.search` — McpCapability wrapping `mcp__chroma__chroma_query_documents`. Tenant-scoped.
  - `records.import_csv` — ScriptCapability wrapping the existing CSV ingest script, with two postconditions (`row_count_change`, `exit_code`).
- **One `activeView` supported:** `record_list`. Pattern 3 map has three entries keyed off `record_list::*`.
- **Default alignment:** `strict` (Pattern 4) — for the client meeting.
- **System prompt:** all four slabs (Pattern 5), with the active-skills slab carrying one skill (the augment-it `crawl-fetch-ingest` reference) wrapped as a SkillCapability if time permits; otherwise three slabs and a one-line stub.
- **Lifecycle events** (Pattern 2) wired into a basic character-cast row.

Out of scope: BYOK, Tauri, mutate-with-confirmation flow, the `reminders.*` and `cache.*` capabilities. Those come in v0.0.2+ with their own grounded reads (Neo for supersession, etc.).

## Related

- [[Per-App-Workspace-Conventions]] — where state lives; the registry's mutation discipline
- [[Remote-Mount-Contract-for-In-App-Agent]] — the WorkspaceAdapter seam this blueprint extends
- [[In-App-Chat-as-Agent-Surface-for-Client-Apps]] — the originating exploration
- [[Memory-Layers-for-the-In-App-Chat-Package]] — the user/AI memory trust split this blueprint references for slab 4
- [[In-App-Agent-Chat-Core-Package]] — the (now superseded-by-architecture-revision) spec; cite for capability discipline, not for package layout
- [[In-App-Chat-v0-0-1-for-Augment-It]] — the concrete plan this blueprint enables (to be authored)
- `studies/open-specs-and-standards/ai-skills/` — SKILL.md prior art
- `studies/open-specs-and-standards/modelcontextprotocol/schema/2025-11-25/` — Tool / CallToolResult / ProgressNotification source-of-truth
- `studies/open-specs-and-standards/12-factor-agents/content/` — F4, F5, F7, F8
- `studies/data-analytics-specifications-and-standards/datapackage/` — TableSchema for record-set field typing

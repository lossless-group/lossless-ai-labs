---
title: "Per-App Workspace Conventions — Discipline, Not a Shared Package"
lede: "Each Applied AI Labs app — augment-it, memopop-ai, dididecks-ai — owns its own data model and ships its own workspace package. There is no universal @lossless/workspace package, because the intersection of memos, slide decks, and CRM-augmentation records is too small to be a meaningful shared abstraction. What IS shared is the *shape* of every per-app workspace: a singleton state class, a discriminated activeView union, a capability registry as the only mutation surface, an SSE event ingestion pattern that doesn't black-screen the WebView, and a typed WorkspaceAdapter interface the @lossless/in-app-agent chat package consumes. This blueprint codifies that shape so building a new app's workspace doesn't require re-deriving the conventions from scratch."
date_created: 2026-05-18
date_modified: 2026-05-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.2
tags:
  - Blueprint
  - Workspace-Pattern
  - In-App-Agent-Chat
  - Adapter-Pattern
  - State-Container
  - Capability-Registry
  - Applied-AI-Labs
status: Draft
---

# Per-App Workspace Conventions

> **Framework note (2026-05-18):** This document's React code examples are preserved as cross-framework reference. The augment-it implementation will be in **Svelte 5** — matching memopop-ai's `FlowState` pattern (`memopop-ai/apps/memopop-native/src/lib/stores/flow.svelte.ts`) and the broader Lossless family's no-React stance. The architectural pattern below is framework-neutral; translate React-specific primitives (`useSyncExternalStore`, hook plumbing) to their Svelte 5 equivalents (`$state` runes, singleton imports) when implementing. Memopop's `FlowState` is the canonical implementation reference; the React sketch is illustrative of the same pattern in a different framework.

## Why this blueprint exists

Three architectural moves we tried and rejected before landing here:

1. **A universal `@lossless/workspace` package.** Rejected because memopop's memos, dididecks's slide decks, and augment-it's CRM records are too divergent. A universal type would be either a megablob or an empty kernel.
2. **Putting state inside `@lossless/in-app-agent`.** Rejected because it couples the chat UI package to business data, breaks the "chat is optional" property, and makes the chat package non-reusable.
3. **Per-app workspaces that re-derive their own conventions.** Rejected because the three apps will silently drift apart on naming, mutation discipline, SSE handling, and capability shape — the same kinds of small differences that ended Tanuj's federation experiment in augment-it ([[Tanuj-Request-Reviewer-As-Built]]).

What survived: **per-app workspaces, shared discipline**. This blueprint is the discipline.

## The principle

Each app owns its own data model in its own package: `@augment-it/workspace`, `@memopop-ai/workspace`, `@dididecks-ai/workspace`. (Use full names — no abbreviations. The cost of `@augment-it/*` over `@aug/*` is six characters; the benefit is no name collisions, no abbreviation drift, no "which app is `@aug`?" moments for new contributors.)

What's shared:

- **The shape of the state class** — singleton, discriminated `activeView`, append-only event log
- **The capability registry pattern** — typed handlers, `entity.verb` naming, the only mutation surface
- **The SSE event ingestion discipline** — `lastSeenSeq` dedup, shallow reactivity for high-frequency arrays
- **The `WorkspaceAdapter` interface** — the typed seam the chat package speaks to
- **Naming conventions** — `useWorkspace()`, `invoke(capability, args)`, verb vocabulary

Conventions, not code.

## The WorkspaceAdapter interface

This is the single piece of code that *is* shared — it lives inside `@lossless/in-app-agent` as a typed interface. Each app provides an implementation.

```ts
// inside @lossless/in-app-agent
export interface WorkspaceAdapter {
  // Subscription — React.useSyncExternalStore-shaped
  subscribe(listener: () => void): () => void;
  getSnapshot(): WorkspaceSnapshot;

  // The only mutation surface — capability invocation
  invoke<TResult = unknown>(
    capability: string,
    args: unknown
  ): Promise<CapabilityResult<TResult>>;

  // Capability discovery — the chat enumerates available verbs through this
  getCapabilityRegistry(): CapabilityRegistry;

  // Optional — high-frequency job event stream the chat may subscribe to directly
  jobEvents?: EventTarget;
}

export interface WorkspaceSnapshot {
  tenant: string;
  user: UserContext;
  activeView: { kind: string; [k: string]: unknown };
  // App-specific entities live under a typed bag — the chat doesn't read these
  entities: Record<string, unknown>;
}

export interface CapabilityResult<T> {
  data: T;
  display_hint?: {
    mount: string;
    props?: Record<string, unknown>;
    layout?: 'inline' | 'panel' | 'full';
  };
}

export interface CapabilityRegistry {
  list(): CapabilityDescriptor[];
  get(name: string): CapabilityDescriptor | undefined;
}

export interface CapabilityDescriptor {
  name: string;                    // 'entity.verb'
  description: string;
  args_schema: unknown;            // zod or JSON-schema; consumed by the chat for tool-use surfaces
  required_tier?: 'viewer' | 'user' | 'admin';
  requires_user_confirmation?: boolean;
}
```

The chat package depends on **only this interface**. Apps that don't ship chat never load `@lossless/in-app-agent` and never implement the adapter. Apps that do ship chat construct an adapter that wraps their workspace.

## The state pattern

### Singleton state class — one instance per app process

The class owns:

- App-specific entities (records, memos, slides, …)
- `activeView` discriminated union
- Job events (append-only, high-frequency)
- Tenant + user identity
- Methods that transition state

Subscribers — Window, Chat, headless workflows — all read from the same singleton instance.

### Reference implementation (Svelte 5 — memopop's FlowState)

`memopop-ai/apps/memopop-native/src/lib/stores/flow.svelte.ts` is the canonical example:

```ts
class FlowState {
  stage = $state<FlowStage>({ kind: 'idle' });          // discriminated union — activeView
  events = $state.raw<JobEvent[]>([]);                  // append-only — RAW, not deep proxy
  startedAtMs = $state<number | null>(null);
  files = $state.raw<Map<string, FileEntry>>(new Map()); // file-watcher mirror — RAW
  private lastSeenSeq = -1;                              // SSE dedup

  showDetail(outline: Outline) { this.stage = { kind: 'outline_detail', outline }; }
  // ... transition methods
}

export const flow = new FlowState();
```

### Reference implementation (React 19 — pattern for augment-it)

The same shape translated to React using `useSyncExternalStore`:

```ts
// @augment-it/workspace/src/state.ts
import { useSyncExternalStore } from 'react';

type ActiveView =
  | { kind: 'idle' }
  | { kind: 'record_list'; recordSetId: string }
  | { kind: 'record_detail'; recordId: string }
  | { kind: 'enrichment_job'; jobId: string }
  | { kind: 'highlight_collection'; responseId: string; field?: string };

class AugmentItWorkspace {
  private listeners = new Set<() => void>();
  private snapshot: WorkspaceSnapshot = initialSnapshot();
  private lastSeenSeq = -1;

  // High-frequency arrays: identity-stable, mutated by replacing the reference
  private _events: JobEvent[] = [];

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): WorkspaceSnapshot => this.snapshot;

  // The only mutation API — all state changes go through here
  async invoke<T>(capability: string, args: unknown): Promise<CapabilityResult<T>> {
    const handler = this.registry.get(capability);
    if (!handler) throw new Error(`Unknown capability: ${capability}`);
    const result = await handler(args, this.ctx());
    // Handler may have transitioned state via this.set(...)
    return result;
  }

  // SSE event ingestion — dedup, replace array reference (don't push)
  ingestEvent(event: JobEvent) {
    if (event.seq <= this.lastSeenSeq) return;  // EventSource reconnect dedup
    this.lastSeenSeq = event.seq;
    this._events = [...this._events, event];     // new reference triggers subscribers
    this.notify();
  }

  private set(partial: Partial<WorkspaceSnapshot>) {
    this.snapshot = { ...this.snapshot, ...partial };
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const workspace = new AugmentItWorkspace();

export function useWorkspace(): WorkspaceSnapshot {
  return useSyncExternalStore(
    workspace.subscribe,
    workspace.getSnapshot,
    workspace.getSnapshot
  );
}
```

**Pick exactly one state-management library per app.** Svelte apps use `$state` natively. React apps pick one of: hand-rolled-with-`useSyncExternalStore` (above), Zustand, Jotai. Don't mix patterns within an app.

## The discriminated activeView union

The "which view is currently focused" is **a discriminated union on workspace state**, not a separate router or a separate mount registry. View transitions are state transitions.

```ts
type AugmentItActiveView =
  | { kind: 'idle' }
  | { kind: 'record_list'; recordSetId: string }
  | { kind: 'record_detail'; recordId: string }
  | { kind: 'enrichment_job'; jobId: string }
  | { kind: 'highlight_collection'; responseId: string; field?: string }
  | { kind: 'crm_export_review'; recordSetId: string };
```

Why discriminated union and not a flat `activeViewName: string + activeViewProps: unknown`:

- Type-safe pattern matching in render code (the canonical `<ActiveViewMount />`)
- Impossible-state-impossible (can't have `crm_export_review` without a `recordSetId`)
- Capability results' `display_hint.mount` maps directly to a `kind` value

Convention: `kind` values are `snake_case`. Variants always include the IDs they need; never rely on the consumer "still having" a previously-set ID.

## The capability registry

Capabilities are the **documented mutation surface**. The three-guards model from [[In-App-Chat-as-Agent-Surface-for-Client-Apps]] lives here: anything that changes workspace state goes through a registered capability, period.

### Shape

```ts
interface Capability<TArgs = unknown, TResult = unknown> {
  name: string;                              // 'entity.verb'
  description: string;                       // for chat tool-use surfaces
  args_schema: ZodSchema<TArgs>;             // validated before handler runs
  handler: (args: TArgs, ctx: CapabilityContext) => Promise<CapabilityResult<TResult>>;
  required_tier?: 'viewer' | 'user' | 'admin';
  requires_user_confirmation?: boolean;
}

interface CapabilityContext {
  workspace: WorkspaceInstance;              // for handlers to mutate state
  tenant: string;
  user: UserContext;
}
```

### Naming convention — `entity.verb`

| Verb | Meaning |
|---|---|
| `import` | Bring external data in (CSV, file, URL) |
| `list` | Read multiple entities, paginated |
| `get` | Read one entity by ID |
| `add` / `create` | Create a new entity from explicit args |
| `update` | Modify an existing entity |
| `delete` | Remove an entity (with appropriate confirmation gating) |
| `preview` | Compute something without committing it |
| `run` | Invoke a workflow that may have side effects (one-shot) |
| `batch` | Fan out the same workflow over many entities |
| `confirm` | Commit a previously-previewed action |
| `suggest` | Compute proposals that the user must `confirm` to commit |
| `draft` | Produce an editable, not-yet-committed artifact (typically a prompt, a memo section, a slide variant) that the user is expected to iterate on before it's `apply`'d or `confirm`'d |
| `improve` | Given an existing draft + user feedback (free-text or structured), produce a refined version of the same artifact. Distinct from `update` because it's the iterative-refinement loop, not a direct edit |
| `apply` | Bind a previously-drafted artifact (a prompt, a template, a brand kit) to a target entity or scope and execute against it. Distinct from `run` because the *what-to-do* was authored as a separate entity first |
| `export` | Emit data in a format for external consumption |

Examples:

- `records.import`, `records.list`, `records.get`
- `prompts.list`, `prompts.preview`, `prompts.draft`, `prompts.improve`, `prompts.apply`
- `enrich.row`, `enrich.batch`
- `highlights.suggest`, `highlights.confirm`
- `crm.export`, `crm.writeback`
- `memo.draft`, `memo.improve` (memopop)
- `slide.draft`, `slide.improve`, `slide.apply` (dididecks variant flow)

The `draft → improve → apply` triad is the **gated-enhancement pattern** — a user-authored artifact is iterated on conversationally before it gets bound to real records. It's the structural answer to [[project_augment_it_gating_and_microfrontend_thesis]] ("gate every enrichment step"): instead of one bulk `enrich.batch` call that goes wherever the model decides, the user drafts the prompt, refines it across one or two turns, and explicitly `apply`'s it. The chat's "improve" turn doesn't mutate anything in the workspace except the draft entity itself — workspace state stays clean until `apply`.

### Tier gating

Three tiers from the parent exploration:

- `viewer` — no mutation; read-only access
- `user` — most mutations
- `admin` — destructive mutations, policy changes, CRM write-back

Capabilities declare their required tier. The adapter enforces it before dispatch. Tier comes from the user context in the singleton.

### Confirmation gating

`requires_user_confirmation: true` means the capability's handler runs in "preview" mode by default — it computes the result and returns it with `display_hint`, but doesn't mutate state until the user confirms via a paired `confirm` capability. Examples: `highlights.suggest` → `highlights.confirm`, `crm.writeback` → `crm.confirm_writeback`.

This is what makes "verbs the chat invokes" safe for sensitive operations without requiring a separate approval system.

## SSE event ingestion — the memopop lessons, made portable

Both lessons come from production debugging in memopop's `FlowState`:

### Lesson 1 — Deep-proxying high-frequency arrays causes GC spikes

At 30+ events/sec into a 2000-element array, the per-element proxy regeneration causes layout/GC pauses severe enough to black-screen WebView windows. Memopop's fix was `$state.raw` (shallow reactivity).

The React translation: don't store the array via `useState` or in a class field that gets deep-watched. Use **identity-stable mutation** — replace the array reference, don't push to it. The above `ingestEvent` uses `this._events = [...this._events, event]` for this reason. Subscribers see a new reference; React re-renders; no per-element proxy work.

### Lesson 2 — EventSource reconnects replay the backlog; dedup is mandatory

When an SSE connection drops and the EventSource auto-reconnects, the server's bus replays its backlog from the start (no `Last-Event-ID` is honored unless explicitly implemented). Without dedup, the same event appears twice and any derived state goes off the rails.

The discipline: every event has a monotonic `seq` field; the workspace tracks `lastSeenSeq`; events with `seq <= lastSeenSeq` are dropped silently. Not reactive state — just a plain field that gates ingestion.

### The combined pattern

```ts
class Workspace {
  private _events: JobEvent[] = [];
  private lastSeenSeq = -1;

  ingestEvent(event: JobEvent) {
    if (event.seq <= this.lastSeenSeq) return;
    this.lastSeenSeq = event.seq;
    this._events = [..._events, event];  // new array reference
    if (this._events.length > MAX_EVENTS) {
      this._events = this._events.slice(-MAX_EVENTS);  // cap
    }
    this.notify();
  }
}
```

`MAX_EVENTS` cap is also from memopop — 2000 lines in a `{#each}` is the comfortable upper bound for WebView; same order of magnitude reasonable for React lists.

## What each per-app workspace package must export

Minimum surface every per-app workspace ships:

```ts
// @<app>/workspace/src/index.ts

// The singleton instance — apps and remotes import this directly
export const workspace: WorkspaceInstance;

// The adapter that wraps the workspace for @lossless/in-app-agent
export const adapter: WorkspaceAdapter;

// React hook (or Svelte rune equivalent) for subscription
export function useWorkspace(): WorkspaceSnapshot;

// Types so consumers can pattern-match on activeView etc.
export type { WorkspaceSnapshot, ActiveView, ... };
```

The chat package never imports the singleton or the hook directly — it goes through the adapter. The Window and any in-app components import the singleton or use the hook freely; they're trusted in-tree code.

## Naming conventions

| Concept | Convention | Example |
|---|---|---|
| Workspace package | `@<full-app-name>/workspace` | `@augment-it/workspace` |
| Singleton export | `workspace` | `import { workspace } from '@augment-it/workspace'` |
| React hook | `useWorkspace()` | returns `WorkspaceSnapshot` |
| Adapter export | `adapter` | passed to `<AgentProvider adapter={adapter}>` |
| Active view kind | `snake_case` | `'record_detail'`, `'enrichment_job'` |
| Capability name | `entity.verb` | `'records.import'`, `'enrich.batch'` |
| Capability handler file | `capabilities/<entity>.ts` | `capabilities/records.ts` |
| Event type | `TEntityVerbEvent` | `EnrichmentProgressEvent` |
| Job ID prefix | `<entity>_<uuid>` | `enrich_a1b2c3...` |

## Anti-patterns

1. **Sharing entities across apps via a common package.** The data model is the app's. Cross-app integration is through capability invocation, not type imports. (If memopop wants to use augment-it's exported records, it calls `augmentIt.invoke('crm.export', ...)` — it doesn't import a `Record` type.)
2. **Mutating state outside `invoke()`.** Breaks the three guards. Even *seemingly innocent* internal mutations belong inside a capability handler. The single mutation surface is the whole point.
3. **Deep-proxying high-frequency event logs.** Black-screens the WebView in production. Use shallow reactivity (raw / identity-stable arrays). Reference: memopop's `$state.raw` comment in `flow.svelte.ts`.
4. **Letting the chat package import per-app types directly.** Couples the chat to a specific app. Chat speaks only through `WorkspaceAdapter`.
5. **Conflating Window state and workspace state.** Window owns ephemeral UI state — form values, expansion, focus, scroll. Workspace owns entities and `activeView`. Don't put UI ephemera in the workspace, and don't put entities in the Window.
6. **Capability handlers that return React elements.** Capabilities run server-side (or at least non-renderable-side); JSX doesn't cross the boundary. Use `display_hint`.
7. **Capability names without an entity prefix.** `import`, `list`, `run` are not capability names. `records.import`, `enrich.run` are. The prefix is non-optional.
8. **Mixing state-management libraries within one app.** Pick Zustand OR `useSyncExternalStore` OR Jotai. Picking three confuses every future contributor and makes subscription debugging harder than it needs to be.

## Reference implementations

- **Canonical Svelte 5:** `memopop-ai/apps/memopop-native/src/lib/stores/flow.svelte.ts` — the `FlowState` class. Read this first.
- **Canonical React 19:** TBD — augment-it's `@augment-it/workspace` will become the reference once it ships. Until then, the React sketch in this doc is the model.

## Related

- [[Remote-Mount-Contract-for-In-App-Agent]] — the contract this workspace shape was designed to satisfy
- [[In-App-Chat-as-Agent-Surface-for-Client-Apps]] — the parent exploration that proposed the chat surface
- [[Slides_Anatomy-of-the-In-App-Agent-Shell]] — the four-roles distinction this blueprint operationalizes
- [[Federation-and-Bundler-Decision]] (augment-it) — picks the federation substrate this workspace pattern lives inside
- [[Multi-Agent-Research-Fan-Out-Per-Row]] (augment-it) — the job-event ingestion pattern this blueprint codifies
- `memopop-ai/apps/memopop-native/src/lib/stores/flow.svelte.ts` — the canonical reference implementation

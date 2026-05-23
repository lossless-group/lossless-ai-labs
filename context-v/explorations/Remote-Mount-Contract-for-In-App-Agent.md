---
title: "Remote Mount Contract for @lossless/in-app-agent — How the Chat Surface Drives Federated Views Without Owning State"
lede: "The three sub-questions that have been blocking the augment-it federation rewrite — how a capability returns 'mount this view', how the shell passes context to mounted remotes, and how remotes emit back into the shell — get answers borrowed from memopop's already-working FlowState pattern. The corrected architecture (third pass): state lives in per-app workspace packages (@augment-it/workspace, @memopop-ai/workspace, @dididecks-ai/workspace) per the [[Per-App-Workspace-Conventions]] blueprint. The chat package is UI-only — it speaks to whichever app it's mounted in through a typed WorkspaceAdapter interface. useWorkspace() (per-app) returns business state; useChat() (from in-app-agent) returns transcript and conversational state. Capability invocation goes through the workspace, not the chat. No typed event bus across federation seams. Same three-guards discipline the parent exploration committed to."
date_created: 2026-05-18
date_modified: 2026-05-18
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.1.0
tags:
  - Exploration
  - In-App-Agent-Chat
  - Module-Federation
  - Cross-Cutting
  - Memopop
  - Dididecks
  - Augment-It
  - Remote-Mount-Contract
  - Workspace-Adapter
  - Capability-Registry
status: Draft
---

# Remote Mount Contract for @lossless/in-app-agent

> **Framework note (2026-05-18):** This document's code examples are in React (hooks like `useWorkspace()`, `useChat()`, JSX). The contract itself is framework-neutral. Augment-it implements in **Svelte 5** — `useWorkspace()` becomes a direct singleton import (`import { workspace } from '@augment-it/workspace'`); `useChat()` becomes the equivalent Svelte rune-based getter; `<AgentProvider>` becomes Svelte context API (`setContext` / `getContext`). The `WorkspaceAdapter` interface (subscribe / getSnapshot / invoke / getCapabilityRegistry) is unchanged across frameworks. Read React examples as illustrative; consult `memopop-ai/apps/memopop-native/src/lib/stores/flow.svelte.ts` for the canonical Svelte 5 implementation reference.

## What this resolves

[[In-App-Chat-as-Agent-Surface-for-Client-Apps]] proposed `@lossless/in-app-agent` as a shared chat package across memopop, dididecks, and augment-it. [[Federation-and-Bundler-Decision]] (in `augment-it/context-v/`) committed augment-it to using the chat surface as part of its federation layout, with pipeline-stage UIs mounted as federated remotes.

That commitment left three sub-questions unanswered:

1. How does a capability return a "mount this view" instruction?
2. How does the shell pass context (auth, tenancy, state) into a mounted remote?
3. How does a remote emit back into the chat / workspace (saved data, capability re-invocations)?

This doc picks answers, anchored on the **memopop FlowState pattern** that already works in production, and aligned with the [[Per-App-Workspace-Conventions]] blueprint that codifies the per-app state shape.

## The corrected architecture, in one paragraph

State of truth lives **per-app**, in `@augment-it/workspace`, `@memopop-ai/workspace`, `@dididecks-ai/workspace`. Each implements its own domain entities, its own capability registry, its own `useWorkspace()` hook. The chat package (`@lossless/in-app-agent`) is **UI-only** — it owns transcripts, character-cast, and the AgentClient that streams model responses. It speaks to whichever app it's mounted in through a typed `WorkspaceAdapter` interface that the app constructs and passes to `<AgentProvider>`. Both Window and Chat subscribe to the same per-app workspace singleton via standard React subscription; updates mirror in realtime automatically. Capability invocation always goes through the workspace, never through the chat package. The chat is one driver of the workspace's mutation surface among many (Window buttons, headless workflow scripts, future agent modes).

## Prior art — memopop's FlowState

Memopop-ai's desktop app (`apps/memopop-native/`) is built around a single Svelte 5 state class in `src/lib/stores/flow.svelte.ts`:

```ts
class FlowState {
  stage = $state<FlowStage>({ kind: 'idle' });          // discriminated union — the activeView
  events = $state.raw<JobEvent[]>([]);                  // SSE-driven, append-only log
  startedAtMs = $state<number | null>(null);
  files = $state.raw<Map<string, FileEntry>>(new Map()); // live mirror of artifacts on disk
  private lastSeenSeq = -1;                              // SSE dedup
  // ... methods that transition stage and ingest transport events
}
```

`FlowStage` is a discriminated union over the app's modal states:

```ts
type FlowStage =
  | { kind: 'idle' }
  | { kind: 'outline_detail'; outline: Outline }
  | { kind: 'create_deal'; outline: Outline }
  | { kind: 'running_job'; outline: Outline; payload: DealPayload; jobId: string; ... }
  | { kind: 'brand_setup'; firm: string };
```

Components read from the singleton (`import { flow } from '$lib/stores/flow.svelte'`), and the view renders based on `flow.stage.kind`. Transport (a `getTransport()` abstraction over Tauri sidecar or fetch) feeds events into the store. State writes go through `flow.*` methods, not direct mutation.

**Three lessons from this code carry forward into the contract** (codified in [[Per-App-Workspace-Conventions]]):

1. **`$state.raw` for the event log** specifically because deep-proxying a 2000-event array at 30+ events/sec caused GC spikes severe enough to black-screen the WebView. Append-only logs want shallow reactivity; this becomes identity-stable mutation in React.
2. **SSE sequence numbers with `lastSeenSeq`** — EventSource reconnect replays the backlog, so dedup is mandatory if you don't want double-counted events.
3. **The discriminated union is the source of truth for which view to render** — there's no separate "mount this thing" register. Stage shape implies the view.

## The translation to per-app workspace + React + Module Federation

The conceptual mapping:

| Memopop (Svelte 5 monolith) | The corrected architecture (per-app workspace + chat package) |
|---|---|
| `FlowState` class as global singleton | `Workspace` class in `@<app>/workspace`, also a global singleton per app process |
| `FlowStage` discriminated union for active view | `ActiveView` discriminated union on the workspace |
| `flow.*` mutation methods | `workspace.invoke('entity.verb', args)` — the only documented mutation surface |
| Components import `flow` directly | Components use `useWorkspace()` from `@<app>/workspace`; chat-specific components use `useChat()` from `@lossless/in-app-agent` |
| `getTransport()` abstraction | Per-app transport that feeds events into the workspace via `workspace.ingestEvent(evt)` |
| n/a — memopop has no chat surface yet | `@lossless/in-app-agent` provides `<ChatSurface>` + transcript + character-cast, plugged into the app via `<AgentProvider adapter={workspaceAdapter}>` |

The host app (augment-it's shell, or memopop's, or dididecks's) renders something like:

```tsx
// augment-it shell — Configuration A (chat-as-primary)
import { workspace, useWorkspace, adapter } from '@augment-it/workspace';
import { AgentProvider, ChatSurface } from '@lossless/in-app-agent';

export function Shell() {
  return (
    <AgentProvider adapter={adapter}>
      <ChatSurface>
        <ActiveViewMount />
      </ChatSurface>
    </AgentProvider>
  );
}

function ActiveViewMount() {
  const { activeView } = useWorkspace();
  switch (activeView.kind) {
    case 'idle':              return null;
    case 'record_list':       return <RecordList recordSetId={activeView.recordSetId} />;
    case 'record_detail':     return <RecordDetail recordId={activeView.recordId} />;
    case 'enrichment_job':    return <EnrichmentJobView jobId={activeView.jobId} />;
    case 'highlight_collection': return <HighlightCollection {...activeView} />;
  }
}
```

`<ActiveViewMount />` is the only piece that's federation-aware. Its job is to switch on `workspace.activeView.kind` and dynamic-import the matching federated remote. The chat package doesn't know it exists.

## Answers to the three sub-questions

### Q1 — How does a capability return "mount this view"?

A capability's result type (defined in `@lossless/in-app-agent` and re-exported from the workspace packages) has an optional `display_hint` field:

```ts
interface CapabilityResult<T> {
  data: T;                              // the actual payload (a record, a list, a job_id, etc.)
  display_hint?: {
    mount: string;                       // e.g. 'record_list', maps to ActiveView.kind
    props?: Record<string, unknown>;     // props passed to the matching activeView variant
    layout?: 'inline' | 'panel' | 'full'; // where the chat puts it (advisory)
  };
}
```

When the workspace receives a result with a `display_hint`, it transitions `workspace.activeView` to a matching variant. Both Window and Chat (subscribers via `useWorkspace()`) see the new state and re-render. The capability *suggests* the view; the workspace *decides* whether to honor it (could ignore the hint, e.g., on mobile breakpoints or if the user has pinned the current view).

Why a `display_hint` field instead of returning a React element? Because capabilities can run server-side or in worker contexts (they're called by the chat agent and by headless workflows, not just by the UI), and JSX doesn't cross those boundaries. The hint is data — the workspace turns it into a state transition; the Window turns the state transition into a mount.

### Q2 — How does the shell pass context into a mounted remote?

**Two hooks, two responsibilities.** The split is the load-bearing point of the corrected architecture.

```ts
// from @<app>/workspace — business data + mutation surface
export function useWorkspace(): WorkspaceSnapshot;
// app-specific shape: entities, activeView, jobs, tenant, user

// from @lossless/in-app-agent — chat-specific state
export function useChat(): ChatContext;
interface ChatContext {
  transcript: TranscriptEntry[];
  cast: CharacterCast;                  // who's working right now (shared with augment-it research agents)
  isStreaming: boolean;
  sendMessage(text: string): Promise<void>;
  clearTranscript(): void;
}
```

Remotes import whichever hooks they need:

```tsx
// in apps/record-collector/src/RecordList.tsx (federated)
import { useWorkspace, workspace } from '@augment-it/workspace';

export function RecordList({ recordSetId }: { recordSetId: string }) {
  const { entities } = useWorkspace();
  const records = entities.records[recordSetId];

  const handleEnrichRow = async (recordId: string) => {
    await workspace.invoke('enrich.row', { record_id: recordId, agents: ['social_profiles', 'web_crawl'] });
  };

  return <table>...</table>;
}
```

A chat-aware component (a transcript pane, a character-cast widget) imports `useChat()` instead. Most remotes never touch `useChat()` at all — they're consumers of workspace state, not conversational state.

**Critical detail for Module Federation:** `@<app>/workspace` must be declared `singleton: true` in the MF config of host and every remote. `@lossless/in-app-agent` must also be `singleton: true` in apps that ship chat. Otherwise each remote loads its own instance and the singleton-shared-state guarantee silently breaks. Symptom is the classic "Context is undefined" / "hook returns defaults" bug, but harder to debug because nothing throws.

### Q3 — How does a remote emit back into the workspace?

**One mechanism only: `workspace.invoke('capability.name', args)`.** Remotes do not directly mutate workspace state. Every state change a remote needs to cause goes through a registered capability.

Why this discipline matters:

- The parent exploration's "three guards" model ([[In-App-Chat-as-Agent-Surface-for-Client-Apps]]) requires the capability registry to be the only side-effect surface. Direct state writes break that contract.
- Capability invocations are auditable in the transcript (when chat is mounted). Direct writes aren't.
- Capability invocations run through per-org policy checks and tier gating. Direct writes don't.
- Multi-user / multi-tab consistency: a capability invocation is a network roundtrip that other clients see; a direct write isn't.

In practice: highlight-collector saves a highlight by calling `workspace.invoke('highlights.confirm', {...})`, not by mutating an array locally. The workspace receives the result, transitions state, the next render reflects the new highlight. **Same flow whether the chat invoked the capability or a Window button did.**

**Exception: ephemeral UI state.** Local form values, expansion state, focus, scroll position, hover — all of this stays inside the remote and never touches `WorkspaceState`. The discipline applies to *persisted, shared, audit-relevant* state, not interaction ephemera.

## The WorkspaceAdapter — the chat's only seam into per-app state

Per the [[Per-App-Workspace-Conventions]] blueprint, every app's workspace exports an `adapter` that satisfies the `WorkspaceAdapter` interface from `@lossless/in-app-agent`:

```ts
// inside @lossless/in-app-agent
export interface WorkspaceAdapter {
  subscribe(listener: () => void): () => void;
  getSnapshot(): WorkspaceSnapshot;
  invoke<T>(capability: string, args: unknown): Promise<CapabilityResult<T>>;
  getCapabilityRegistry(): CapabilityRegistry;
  jobEvents?: EventTarget;
}
```

The chat package consumes the adapter for two things only:

1. **Enumerating capabilities** so it can present them as tool-use surfaces to the LLM (e.g., generating Anthropic-flavor tool definitions from the registry)
2. **Invoking capabilities** when the LLM emits a tool call

The chat never reads business entities directly. The chat doesn't render record cards or memo sections — those are workspace-side components, mounted by `<ActiveViewMount />` based on `activeView`. The chat's surface is the conversation + the character-cast + the transcript.

This is what makes the chat package reusable: it has zero domain knowledge. Augment-it's `enrich.batch` and memopop's `memo.write` look identical from the chat's perspective — both are entries in a registry, both return `CapabilityResult<T>` with optional `display_hint`.

## What this contract enables

1. **Augment-it can stub all six remotes** as React components that take props, use `useWorkspace()` from `@augment-it/workspace`, and call `workspace.invoke(...)`. No federation-specific code inside the remote. No chat-specific code unless the remote is itself a chat component.
2. **Memopop can adopt the contract without federation** — wrap `FlowState` to expose the `WorkspaceAdapter` interface, mount `<AgentProvider>` in the SvelteKit shell, gradually replace direct `flow.*` calls with `workspace.invoke()` calls. The chat package mounts as a panel; the existing DealWorkspace keeps working unchanged.
3. **Dididecks can adopt the same contract without federation** — single-bundle Astro Knots wrap routes in `<AgentProvider adapter={dididecksAdapter}>` and consume `useWorkspace()` from `@dididecks-ai/workspace`.
4. **Headless workflows bypass the chat entirely** — a CSV-augmentation runner imports `@augment-it/workspace`, calls `workspace.invoke('enrich.batch', {...})`, subscribes to job events via `adapter.jobEvents`, exits. No chat involved.
5. **Cross-app capability discovery becomes tractable** — a chat in memopop can in theory call augment-it's `crm.export` capability if the per-org registry permits it. Each app's adapter exposes its registry; an outer composition layer can merge them.

## What's still open

1. **`@<app>/workspace` package shape per app** — each app picks its state library (Svelte runes, `useSyncExternalStore`, Zustand, Jotai). The blueprint constrains shape, not implementation. Doesn't affect the contract.
2. **`display_hint.layout` semantics** — `'inline' | 'panel' | 'full'` is a sketch. Real layouts depend on the chat UI design.
3. **Cross-tab / cross-window state sync.** Memopop uses a single Tauri window. The web targets may want BroadcastChannel for multi-tab. Out of scope for v1.
4. **What happens when a remote calls `invoke()` and the capability is missing.** Probably the same failure shape as when the chat itself calls a missing capability: a typed error in the result. Define explicitly when first remote ships.
5. **Capability return types per app.** Each capability needs a typed result schema; the registry enforces that. Lives in per-app workspace packages.
6. **Character-cast as a shared component or per-app component.** Augment-it's research-agent fan-out ([[Multi-Agent-Research-Fan-Out-Per-Row]]) and memopop's character cast are conceptually the same UI. Probably belongs in `@lossless/in-app-agent` as a generic cast-row that consumes `useChat().cast`, with apps providing character definitions. Worth its own short doc.

## What this means for each app

**Augment-it:**

- Builds `@augment-it/workspace` per the conventions blueprint, with React 19 + `useSyncExternalStore` (or Zustand, app's choice)
- Six pipeline-stage UIs under `apps/*` are federated remotes consuming `useWorkspace()` and calling `workspace.invoke(...)`
- The shell mounts `<AgentProvider adapter={adapter}>` around `<ChatSurface>` and `<ActiveViewMount />`
- Capability list from [[Augment-It-Prior-Art-Survey]] gets typed return shapes including optional `display_hint`

**Memopop:**

- Wrap `FlowState` to expose the `WorkspaceAdapter` interface (small adapter file, no FlowState rewrite needed)
- New work goes through `workspace.invoke()`
- Walking-skeleton's ([[In-App-Agent-Chat-Walking-Skeleton]]) `slide.read` becomes `memo.read_section` per [[Slides_Agent-Capabilities_Hooking-the-Chat-Surface-into-Memopop]], returning `{ markdown, citations, display_hint?: { mount: 'memo_section', props: { section_id } } }`
- Chat panel lives alongside the existing `DealWorkspace`; both subscribe to the workspace singleton

**Dididecks:**

- Same contract, no federation needed for v1
- `@dididecks-ai/workspace` ships its own state class
- `<ActiveViewMount />` switches between inline Astro Knots components

## Anti-patterns to avoid

- **Returning React elements from capabilities.** Capabilities run server-side or in worker contexts; JSX doesn't serialize. Use `display_hint`.
- **Importing per-app workspace types inside `@lossless/in-app-agent`.** Couples the chat package to a specific app. Always through the adapter and through `WorkspaceSnapshot` (which is typed as `{ entities: Record<string, unknown> }` so the chat doesn't read into it).
- **Federation without singleton'ing the workspace and the chat package.** Each remote silently gets its own instance. Symptom: hooks return defaults; nothing crashes.
- **Direct state mutation from remotes.** Breaks the three guards. Every write through `invoke()`.
- **Cross-remote imperative calls.** If record-collector needs to "tell" highlight-collector something, it calls a capability that updates workspace state; highlight-collector reads the new state on next render. No `recordCollector.notifyHighlightCollector(...)`.
- **Putting business data inside the chat package's state.** The chat owns transcript and conversational state only. Records, memos, slides, highlights — all per-app.
- **Building a chat-required app.** Apps should be able to ship without the chat package. If your app can't function without `@lossless/in-app-agent` loaded, the workspace package has too much chat-shaped logic in it.

## Related

- [[In-App-Chat-as-Agent-Surface-for-Client-Apps]] — the parent exploration this implements
- [[Per-App-Workspace-Conventions]] — the blueprint this contract sits on top of
- [[Slides_Anatomy-of-the-In-App-Agent-Shell]] — the four-roles distinction (Shell / Workspace / Window / Chat) this contract operationalizes
- [[In-App-Agent-Chat-Walking-Skeleton]] — the package skeleton this contract slots into
- [[In-App-Agent-Chat-Core-Package]] — the core spec the contract extends
- [[Memory-Layers-for-the-In-App-Chat-Package]] — what `WorkspaceSnapshot` will need to hold beyond what's specified here
- [[Federation-and-Bundler-Decision]] (augment-it) — the federation substrate this contract assumes
- [[Multi-Agent-Research-Fan-Out-Per-Row]] (augment-it) — the per-row × per-agent job pattern the workspace's event ingestion serves
- [[Augment-It-Prior-Art-Survey]] (augment-it) — the capability list this contract types
- [[Slides_Agent-Capabilities_Hooking-the-Chat-Surface-into-Memopop]] (ai-labs/context-v/plans) — memopop's adoption path
- `memopop-ai/apps/memopop-native/src/lib/stores/flow.svelte.ts` — the working prior art

## Version notes

- **0.0.0.1** (2026-05-18) — Initial draft. Specced `useAgent()` as the single hook with state living inside `@lossless/in-app-agent`.
- **0.0.1.0** (2026-05-18) — Minor revision after architectural pushback. State container moved out of the chat package and into per-app `@<app>/workspace` packages per the [[Per-App-Workspace-Conventions]] blueprint. `useAgent()` split into `useWorkspace()` (per-app, business state) and `useChat()` (chat package, conversational state). Capability registry relocated from the chat package to the workspace. Chat now consumes a `WorkspaceAdapter` interface as its only seam into per-app state. Three concerns resolved: chat is no longer assumed-primary, headless workflows can bypass chat, the chat package becomes a real shared-UI thing without business-data coupling.

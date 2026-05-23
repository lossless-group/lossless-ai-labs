---
title: "Per-App Workspaces and the Chat as Optional Surface — The Architecture We Walked To"
lede: "The corrected architecture for the Applied AI Labs apps in three sentences. State of truth lives per-app in @augment-it/workspace, @memopop-ai/workspace, @dididecks-ai/workspace — packages each app owns, no universal data model package. The chat surface (@lossless/in-app-agent) is UI-only and consumes whichever app it's mounted in through a typed WorkspaceAdapter; it has zero domain knowledge. Both Window microfrontends and the Chat panel subscribe to the same workspace singleton through Module Federation, so realtime mirror is automatic. This deck captures the journey to that architecture — what we tried, what broke, what survived."
date_created: 2026-05-18
date_modified: 2026-05-18
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.1
tags:
  - Slides
  - Architecture
  - Workspace-Pattern
  - In-App-Agent-Chat
  - Applied-AI-Labs
  - Module-Federation
  - WorkspaceAdapter
  - Per-App-Packages
status: Draft
---

# Per-App Workspaces and the Chat as Optional Surface

> **Framework note (2026-05-18):** Code examples in this deck are React-shaped. The augment-it implementation is **Svelte 5** — matching memopop-ai and the broader Lossless family. The architectural distinction (per-app workspace, shared chat package, WorkspaceAdapter as the seam) is framework-neutral. When this deck becomes slides, the code snippets should be re-rendered in Svelte 5 syntax for accuracy.

## Why this deck exists

Over the course of designing the augment-it rewrite we walked through three architectural bets that *seemed* right and turned out wrong. Each iteration sharpened the next. The final shape is much cleaner than the first — but only because each rejection taught us something specific about the seam between business data and conversational UI.

This deck captures the journey for two audiences: the team (so future architectural conversations start from the right ground), and future-me (so we don't accidentally re-walk it in six months).

## Bet #1 — A universal `@lossless/workspace` package

The intuition: all three apps need to manage records / responses / state of truth somehow; let's share a package.

What broke it: the intersection of memopop's memos, dididecks's slide decks, and augment-it's CRM-augmentation records is too small. A universal type would be either a megablob of every entity any app might ever need, or an empty kernel everyone has to extend. Neither shape is useful.

What survived: the **shape of the workspace pattern**. Singleton state class, discriminated `activeView`, capability registry as the only mutation surface, SSE event ingestion with `lastSeenSeq` dedup, `MAX_EVENTS` cap. That shape is shareable as a discipline — codified in [[Per-App-Workspace-Conventions]] — without being a shared package.

## Bet #2 — State lives inside `@lossless/in-app-agent`

The intuition: the chat package is shared across apps; if we put the state container in there, every app gets state-sharing for free.

What broke it: three independent concerns.

- **Chat-primary isn't a given.** Not every app will use chat as the primary interaction mode. Some apps will use chat as a panel; some won't use it at all. Coupling state to chat assumes a UX shape we haven't decided.
- **Workflow tasks shouldn't require chat plumbing.** A headless CSV-augmentation runner should be able to operate against state without dragging chat dependencies along.
- **The chat can't be a clean shared-UI package if it owns business data.** Records, memos, slides, highlights — these are *each app's* domain, not the chat package's.

What survived: the chat-package idea itself. It's still shared (`@lossless/in-app-agent`), still UI, still owns conversational state — but it doesn't own business data. The seam to business data is a typed interface.

## Bet #3 — The corrected architecture

State lives **per-app**, in `@augment-it/workspace`, `@memopop-ai/workspace`, `@dididecks-ai/workspace`. Each:

- Holds its own domain entities (records, memos, slides, etc.)
- Owns its own capability registry
- Exposes its own `useWorkspace()` hook
- Provides its own `adapter` that satisfies `WorkspaceAdapter` (from `@lossless/in-app-agent`)
- Follows shared conventions ([[Per-App-Workspace-Conventions]]) so they don't drift

The chat package (`@lossless/in-app-agent`) is:

- UI-only — transcript, character-cast, AgentClient, the `<ChatSurface>` component
- Domain-agnostic — zero imports from any app's workspace
- Consumed via the `WorkspaceAdapter` interface, instantiated per-app

Both Window and Chat subscribe to the same per-app workspace singleton through Module Federation 2.0's `singleton: true` declaration. Realtime mirror is a consequence of being subscribers to the same store; no separate sync mechanism.

## The three-layer picture

```
┌──────────────────────────────────────────────────────────┐
│ App-specific (shell, Window, federated remotes)          │
│  Imports from: @<app>/workspace and (optionally)         │
│                @lossless/in-app-agent                    │
└────────────────────┬─────────────────────────────────────┘
                     │
       ┌─────────────┴────────────────┐
       ↓                              ↓
┌─────────────────┐         ┌──────────────────────────────┐
│ @<app>/         │         │ @lossless/in-app-agent       │
│ workspace       │←────────│  - Chat UI (transcript,      │
│  - Entities     │ adapter │    character-cast)           │
│  - activeView   │         │  - AgentClient               │
│  - Capabilities │         │  - WorkspaceAdapter          │
│  - useWorkspace │         │    interface (typed)         │
│  - adapter      │         │  - useChat() hook            │
└─────────────────┘         └──────────────────────────────┘

  Per-app, no shared        Shared across apps, optional
  data model                per app, zero domain knowledge
```

The chat package depends on a typed interface; each app implements it. The chat doesn't import from any specific app; apps don't have to import the chat at all.

## The WorkspaceAdapter — the seam

This is the single piece of code that *is* shared. Lives in `@lossless/in-app-agent`:

```ts
interface WorkspaceAdapter {
  subscribe(listener: () => void): () => void;
  getSnapshot(): WorkspaceSnapshot;
  invoke<T>(capability: string, args: unknown): Promise<CapabilityResult<T>>;
  getCapabilityRegistry(): CapabilityRegistry;
  jobEvents?: EventTarget;
}
```

The chat package uses the adapter for exactly two things:

1. **Enumerating capabilities** so it can present them as tool-use surfaces to the LLM
2. **Invoking capabilities** when the LLM emits a tool call

The chat never reads business entities directly. Record cards and memo sections and slide previews are rendered by *workspace-side* components, mounted by `<ActiveViewMount />` based on `workspace.activeView`. The chat's surface is the conversation; the workspace's surface is the data.

## Two singletons, not one

Apps that ship chat MF-singleton both packages:

- `@<app>/workspace` — singleton'd so all federated remotes see the same business state
- `@lossless/in-app-agent` — singleton'd so transcript and character-cast aren't duplicated per remote

If either is missed, the failure is silent — each remote gets its own instance, "shared state" fragments, and bugs appear that don't reproduce on a hard reload. The MF config has to be deliberate on both.

## useWorkspace + useChat — the hook split

Two hooks, two responsibilities:

```ts
// from @augment-it/workspace — business data
const { entities, activeView, jobs, user, tenant } = useWorkspace();

// from @lossless/in-app-agent — conversational state
const { transcript, cast, isStreaming, sendMessage } = useChat();
```

Most remotes import only `useWorkspace()`. Chat-specific components (a transcript pane, a character-cast widget) import `useChat()` additionally. Federation guarantees both hooks return data from the singletons no matter which remote is calling.

## Headless workflows prove the decoupling

The clearest test that we got the split right:

```ts
import { workspace } from '@augment-it/workspace';

async function nightlyEnrichmentRunner() {
  const jobId = await workspace.invoke('enrich.batch', {
    record_set_id: 'this-weeks-prospects',
    agents: ['social_profiles', 'web_crawl', 'press_mentions'],
  });
  for await (const event of subscribeToJob(jobId)) {
    if (event.stage === 'completed' && allAgentsDone(event)) break;
  }
  await workspace.invoke('crm.writeback', { record_set_id: 'this-weeks-prospects', target_crm: 'hubspot' });
}
```

No chat, no React, no UI. Just the workspace and its capabilities. **This script could not exist if state lived inside the chat package.** That it does is the proof of the decoupling.

## Naming conventions worth remembering

- Workspace packages: **full names**, no abbreviations — `@augment-it/workspace`, `@memopop-ai/workspace`, `@dididecks-ai/workspace`
- Singleton export: `workspace` — `import { workspace } from '@augment-it/workspace'`
- React hook: `useWorkspace()` — returns `WorkspaceSnapshot`
- Adapter export: `adapter` — passed to `<AgentProvider adapter={adapter}>`
- Active view kinds: `snake_case` — `'record_detail'`, `'enrichment_job'`
- Capability names: `entity.verb` — `'records.import'`, `'enrich.batch'`

The full names cost six characters over `@aug/*`; the benefit is zero collisions, no abbreviation drift, no "which app is `@aug`?" moments for new contributors.

## Reading guide

If you're new to this thread and want to load the architecture into your head, read in this order (~20 minutes):

1. [[Slides_Anatomy-of-the-In-App-Agent-Shell]] — the four roles (Shell / Workspace / Window / Chat)
2. This deck — the journey through three bets to the corrected architecture
3. [[Per-App-Workspace-Conventions]] — the shared discipline
4. [[Remote-Mount-Contract-for-In-App-Agent]] — the technical seam between chat and workspace
5. [[Federation-and-Bundler-Decision]] (augment-it) — augment-it's specific application
6. `memopop-ai/apps/memopop-native/src/lib/stores/flow.svelte.ts` — the working prior art

## Related

- [[Per-App-Workspace-Conventions]] — the conventions blueprint
- [[Remote-Mount-Contract-for-In-App-Agent]] — the seam
- [[Slides_Anatomy-of-the-In-App-Agent-Shell]] — the four-role framing
- [[Slides_Agent-Capabilities_Hooking-the-Chat-Surface-into-Memopop]] — memopop's adoption path
- [[Federation-and-Bundler-Decision]] (augment-it) — augment-it's specific federation choices
- [[In-App-Chat-as-Agent-Surface-for-Client-Apps]] — the parent exploration the whole thread builds from

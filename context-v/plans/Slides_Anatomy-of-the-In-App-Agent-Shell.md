---
title: "The Anatomy of the In-App Agent Shell — Shell, Workspace, Window, Chat"
lede: "When we said 'shell' we kept meaning four different things at once. Drawing the distinction explicitly: a thin layout frame, a per-app workspace package that owns business state, a visual workspace microfrontend (the 'Window'), and the conversational surface. The workspace is the source of truth — not the chat. Federation 2.0's singleton-module idiom guarantees one workspace instance across host + remotes; both Window and Chat subscribe to it and stay in realtime mirror automatically. Two configurations of the same contract, one for chat-primary apps (augment-it) and one for window-primary apps (memopop)."
date_created: 2026-05-18
date_modified: 2026-05-18
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.1.0
tags:
  - Slides
  - In-App-Agent-Chat
  - Architecture
  - Module-Federation
  - Shell-Pattern
  - Window-Pattern
  - Workspace-Pattern
  - Augment-It
  - Memopop
status: Draft
---

# The Anatomy of the In-App Agent Shell

## Why this matters

When the team says "shell," we keep meaning four different things at once. That ambiguity has been quietly costing us — past attempts conflated the visual workspace with the state container, then conflated the chat surface with the state container. Each conflation made every microfrontend question harder than it needed to be.

Federation 2.0 lets us split the four roles cleanly. Once split, the question of "how do Window and Chat mirror state in realtime?" answers itself: they both subscribe to the same singleton workspace. No event bus, no postMessage, no sync mechanism. The plumbing dissolves.

## The four things we've been calling "shell"

| Thing | Role | Lives In | Example |
|---|---|---|---|
| **Shell** | The thin layout frame that mounts `<AgentProvider>` and arranges remotes | App's own `shell/` directory | A 50-line React component, basically a CSS grid |
| **Workspace** | Per-app source of truth — entities, activeView, jobs, capability registry. The mutation surface (`invoke()`). | `@<app>/workspace` (per-app package) | `@augment-it/workspace`; memopop's `FlowState` is the same idea in Svelte 5 |
| **Window** | A visual microfrontend that renders the records / responses / highlights workspace | App's `apps/window/` or equivalent | `DealWorkspace.svelte` in memopop |
| **Chat** | The conversational surface — transcript, character-cast, AgentClient. UI-only. | `@lossless/in-app-agent` (shared across apps) | The chat panel mounted via `<ChatSurface>` |

**The two misreadings, both now corrected:**

- Misreading 1 (older): bundling visual workspace and state container into one thing called "Window." Fix: pull the state container out.
- Misreading 2 (more recent): putting the state container *inside* `@lossless/in-app-agent` so the chat package owned everyone's data. Fix: state container is per-app, not shared.

The chat package becomes UI-only. The workspace package becomes the source of truth. Both Window and Chat subscribe to the workspace. Realtime mirror is automatic.

## The pattern by its real name

In design-pattern vocabulary this is the **Mediator pattern** — a central object coordinates communication between peripherals. In Redux / Zustand terms it's a **Centralized State Container with Pub/Sub propagation**. In Module Federation specifically, it's the canonical **shared singleton module** idiom: declare `singleton: true` in both the host's and every remote's MF config, and the federation runtime guarantees one instance across them all.

**Two singletons, not one.** Apps that ship chat singleton both `@<app>/workspace` (business data) and `@lossless/in-app-agent` (conversational data). Both share-via-singleton across host + remotes. The Chat speaks to the Workspace through a typed `WorkspaceAdapter` interface — the chat package has zero knowledge of any app's domain entities.

The "Window and Chat have a realtime update of state that mirrors each other" property is not a separate mechanism. It's a *consequence* of both being subscribers to the same singleton workspace.

## Configuration A — Chat-as-primary (augment-it)

```
┌─────────────────────────────────────────────────────┐
│ Shell (thin layout)                                 │
│   <AgentProvider adapter={augmentItAdapter}>        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Chat (primary surface) from @lossless/in-app-   │ │
│ │ agent — transcript, character-cast              │ │
│ │   ┌─────────────────────────────────────────┐   │ │
│ │   │ <ActiveViewMount/> mounts a pipeline-   │   │ │
│ │   │ stage remote based on                   │   │ │
│ │   │ workspace.activeView                    │   │ │
│ │   └─────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
   ↑                              ↑
   Chat reads via                 Remotes read via
   useChat() + adapter            useWorkspace() from
                                  @augment-it/workspace
       (Both ultimately subscribe to the same singletons)
```

The chat surface is the primary UI. Pipeline-stage remotes (record-collector, prompt-template-manager, response-reviewer, highlight-collector, insight-manager) mount inside the chat as capabilities invoke them via `display_hint`. Window-style standalone navigation isn't required — the chat orchestrates which view is active.

Right shape when: the user's primary action is conversational; the rich UI is contextual — *"show me row 14's social profiles findings"*, *"compare this batch's web-crawl results to last week's"*.

## Configuration B — Window-with-chat-panel (memopop)

```
┌─────────────────────────────────────────────────────┐
│ Shell (thin layout)                                 │
│   <AgentProvider adapter={memopopAdapter}>          │
│ ┌────────────────────────────┐ ┌──────────────────┐ │
│ │ Window (DealWorkspace,     │ │ Chat panel       │ │
│ │   ArtifactBrowser,         │ │ from @lossless/  │ │
│ │   JobView, etc.) —         │ │ in-app-agent     │ │
│ │   reads useWorkspace()     │ │ (smaller)        │ │
│ │   from @memopop-ai/        │ │ reads useChat()  │ │
│ │   workspace                │ │ + adapter        │ │
│ └────────────────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────┘
   ↑                              ↑
   Window subscribes to           Chat subscribes via
   @memopop-ai/workspace          adapter, sees the
                                  same workspace
       (Realtime mirror via shared singleton)
```

Window is primary; chat is secondary. Both subscribe to the same `@memopop-ai/workspace` singleton. This is the shape memopop was already converging on with `FlowState` — `FlowState` *becomes* `@memopop-ai/workspace` once it's wrapped to expose the `WorkspaceAdapter` interface.

Right shape when: the user's primary action is interacting with a rich workspace; chat is an assistive companion — *"keep working on the deal, ask the chat for help when you need it."*

## Configuration C — Window-only (no chat at all)

```
┌─────────────────────────────────────────┐
│ Shell (thin layout)                     │
│   no <AgentProvider> needed             │
│ ┌─────────────────────────────────────┐ │
│ │ Window — reads useWorkspace()       │ │
│ │ from @<app>/workspace               │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

The workspace pattern doesn't require chat. An app can ship with just a Window and a workspace, no `@lossless/in-app-agent` loaded. Same workspace contract; chat is opt-in.

Right shape when: the app's audience is purely UI-driven, or when the chat package isn't ready yet for the app's domain. **This matters because it keeps the chat package genuinely optional** — apps don't inherit a chat dependency they don't want.

## Same contract, different layout

All three configurations use the same `useWorkspace()` hook from the per-app workspace package. Apps that ship chat additionally use the same `useChat()` hook from `@lossless/in-app-agent`, the same `WorkspaceAdapter` interface, the same `display_hint` mechanism for mounting remotes. The only difference is the shell's layout decision — *where* the chat sits relative to the visual workspace, or whether it's there at all.

This is what we get from splitting state container out of both Window and Chat: each app picks the layout (and the chat-or-not) that fits its primary action, without changing the contract that everything else hangs off.

## What this resolves for the build sequence

1. **The workspace is per-app, not shared.** Each app ships `@<app>/workspace` — `@augment-it/workspace`, `@memopop-ai/workspace`, `@dididecks-ai/workspace`. They follow shared conventions ([[Per-App-Workspace-Conventions]]) but don't share code. Federation `singleton: true` is per-package, per-app.
2. **The Window is app-shaped, not package-shaped.** Memopop builds its Window; augment-it merges Window into Chat (Configuration A); dididecks picks whichever fits.
3. **The shell is layout-shaped, not state-shaped.** Often a 50-line React component. State ownership doesn't live here.
4. **The chat is shared-package-shaped and singleton'd, but optional.** Apps that need it singleton `@lossless/in-app-agent` alongside their workspace. Apps that don't, ship without it.

Four roles, four different scoping rules, one shared discipline ([[Per-App-Workspace-Conventions]]). Once the team sees them separately, every architecture discussion downstream becomes about *one of the four*, not about "shell" as a shape-shifting blob.

## Related

- [[Remote-Mount-Contract-for-In-App-Agent]] — the contract this anatomy lives inside
- [[Per-App-Workspace-Conventions]] — the discipline the per-app workspaces follow
- [[In-App-Chat-as-Agent-Surface-for-Client-Apps]] — the parent exploration that proposed the chat surface
- [[Federation-and-Bundler-Decision]] (augment-it) — picks Configuration A and the rsbuild substrate
- `memopop-ai/apps/memopop-native/src/lib/stores/flow.svelte.ts` — the working FlowState that taught us the workspace pattern
- `memopop-ai/apps/memopop-native/src/lib/components/DealWorkspace.svelte` — Configuration B's "Window" today

## Version notes

- **0.0.0.1** (2026-05-18) — Initial draft. Specced four things — Shell, State container (inside `@lossless/in-app-agent`), Window, Chat.
- **0.0.1.0** (2026-05-18) — Revised after the workspace-vs-chat split was clarified in [[Per-App-Workspace-Conventions]]. "State container" replaced by "Workspace" (per-app package, not inside chat). Configurations A and B updated to show two singletons (workspace + chat) where applicable. Added Configuration C — Window-only with no chat — to make explicit that chat is optional, not assumed.

---
title: "Phase 1 — One Operation Set, Four Callers"
lede: "A menu, a palette, a rendered page you can type into, and an agent — all writing through the same named operations, so a human and an agent can never reach a state the other cannot describe."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Draft
spec_reference: "[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]"
tags:
  - Plan
  - Flave
  - Agent-Chat
  - Document-API
  - Command-Palette
  - Capability-Registry
  - Svelte
  - Augment-It
publish: true
site_uuid: 39d974c0-4063-41f9-b489-68b4c685992e
hex_code: 84nvor
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
from: "flave"
from_path: "context-v/plans/Phase-1-One-Operation-Set-Four-Callers.md"
---
# Phase 1 — One Operation Set, Four Callers

## Why care?

Documents edited by agents rot. Not because agents are careless, but because
every tool gives them a different door than it gives the human — the human drags
something, the agent writes bytes, and after ten sessions neither can explain
what the other did.

Flave's answer is that **there is only one door.** A menu click, a palette
command, typing in the rendered page, and an agent request all go through the
same named, typed operations. Which means the agent can always describe what you
just did, and you can always undo what it just did.

This phase builds that door. It does **not** build the chat surface — and the
reason is the most useful thing in this document.

## The claim

> *Every document mutation goes through a named, typed operation, and the same
> operation set is callable from the menu, from the palette, from the rendered
> page, and from a stub agent.*

## This is the spec's own instruction, not a new idea

§7.3 already states it as a standing architectural requirement:

> **Design consequence worth naming:** the command palette and the agent's
> Document API (§9.2) should be **the same operation set**, differing only in
> input modality — the palette is a typed, autocompleted front-end over the
> identical ops the agent calls. Build them as one layer. This is a real
> architectural instruction, not a nicety: it guarantees a human and an agent can
> never reach a state the other can't describe.

Phase 1 is that paragraph, executed, with two callers the spec had not yet
contemplated.

## Why the chat surface is *not* built here

`augment-it/apps/chat` is the reference implementation and the spec (§9.1) says
to *"port wholesale, not re-architect."* Reading the source bears that out — and
reveals why the port is cheap and therefore not urgent.

`chat-state.svelte.ts` is **163 lines** and contains almost no intelligence: a
turn union, a transcript array, and a transform into role/content pairs. The
whole surface is 672 lines of Svelte across five components. All the power sits
behind two calls into the host — `workspace.chatTurn({...})` and
`workspace.invoke(capability, args, actor)`. The `propose` mode never mutates; it
renders affordances and a human clicks.

**So the chat surface is thin, and thin things port late without penalty — but
only if there is a capability registry for them to call.**

> The risk was never "we build chat too late." It is *"we build the editor with
> direct mutation, so when chat arrives there is nothing to invoke, and the seam
> gets retrofitted underneath a working app."* That is the expensive version, and
> it is the one this phase exists to prevent.

Chat lands at M4 as specced. Phase 1 makes M4 a port rather than a
re-architecture.

## What gets built

### 1 · `@flave/doc` — the operation set

Only the §9.2 subset the editor actually needs:

```ts
block.insert(after: BlockRef, content: LfmSource): BlockRef
block.replace(ref: BlockRef, content: LfmSource): void
block.edit(ref: BlockRef, patch: TextPatch): void       // surgical, not rewrite
block.move(ref: BlockRef, to: BlockRef): void
block.remove(ref: BlockRef): void
pack.define(trigger: TriggerPackDef): void
```

**Not** `layout.*`, `theme.*`, `data.*`, `viz.*`, or `publish.*`. Those belong to
milestones that have not started, and speculative ops are how an operation set
becomes a framework.

Note the absence §9.2 insists on: there is no `style.setCss`. Not a ban on the
agent writing CSS — §9.6 expects it to — but a requirement that CSS always arrive
*attached to a named thing* with a home in the cascade. Free-floating CSS has no
name and no promotion path, which is precisely why documents rot after ten agent
sessions.

### 2 · The four callers

| Caller | Surface | Notes |
|---|---|---|
| **Menu bar** | Word-like, above the panes | **New — not in the spec.** See below |
| **Command palette** (`⌘K`) | §7.3 surface 2 | *"Promoted from a convenience to the primary layout interface"* |
| **Compose** | The rendered pane, right | Typing in plain prose → `block.edit()`. Bounded by D-23 in [[Phase-0-The-Live-Render-Loop]] |
| **Stub agent** | No UI | Returns canned `propose` turns. Enough to prove the seam |

### 3 · The menu bar needs one rule

A Word-like menu is a **mouse-driven write surface**, which brushes against
§7.2's resolution that *"the mouse reads; the keyboard and the agent write."*

The rule that resolves it: **every menu item invokes a named capability from the
same operation set.** The menu is then not a new emission path — it is a fourth
caller. The §7.2 ceiling holds untouched, because the ceiling was never about
input devices; it was about drag handles having to emit positional CSS. A menu
item emits a named op.

**It also fixes a problem §7.2 created.** Removing drag made the frame vocabulary
undiscoverable, and the palette was the only proposed mitigation. A menu is a
*better* discoverability surface than a palette for anyone who does not already
know what to type.

> ⚠️ **Worth surfacing, not resolving here:** a Word-like menu implies a less
> technical user than §3.2's operator-author persona, who the spec says *"would
> rather type `⌘K two-column, chart on the right` than hunt for a drag target."*
> Either the persona widens, or the menu is explicitly scaffolding for people
> §3.3 currently lists as anti-personas. That is a product call, not an
> engineering one.

### 4 · Port the chat *contract*, not the UI

From `augment-it/apps/chat`, take the shape and leave the surface:

- The **turn union** — `user | answer | propose | invoke | capability_result |
  error`. §9.1 is right that `propose` is *exactly* the contract for document
  editing: the agent never silently mutates; it proposes and the human accepts.
- The **`invoke(capability, args)`** call shape, so the real surface drops onto
  an existing registry at M4.
- The **inline-draft pattern** from `PromptDraftPanel.svelte` — drafts render as
  turns in the dialog, not as detached artifacts. Directly applicable to proposed
  document blocks, and worth carrying in the contract even before there is a UI.

### 5 · `@flave/workspace` — implement an interface that already exists

**The shared chat package is not a someday-ambition to design. It is already
specified, named, and has two prior adopters.** The contract lives one level up,
in the parent pseudomonorepo's `ai-labs/context-v/` — not in any child repo,
which is exactly right for something cross-cutting:

- [[Remote-Mount-Contract-for-In-App-Agent]] — `@lossless/in-app-agent` as a
  **UI-only** package with *"zero domain knowledge,"* talking to whatever app it
  is mounted in through a typed adapter.
- [[Per-App-Workspace-Conventions]] — the `WorkspaceAdapter` interface, the
  singleton state pattern, the capability registry, and the `entity.verb` naming
  convention.
- [[Chat-As-Verb-Surface-Patterns]] — capability adapters, lifecycle events and
  expectation contracts, the anticipation map, the three response modes, and the
  four cache-eligible prompt slabs.

The interface Flave implements:

```ts
export interface WorkspaceAdapter {
  subscribe(listener: () => void): () => void;
  getSnapshot(): WorkspaceSnapshot;
  invoke<T>(capability: string, args: unknown): Promise<CapabilityResult<T>>;
  getCapabilityRegistry(): CapabilityRegistry;
  jobEvents?: EventTarget;
}
```

> **The convergence worth noticing:** the contract says
> *"capability invocation always goes through the workspace, never through the
> chat package"* and names capabilities `entity.verb`. §9.2's Document API is
> already `block.insert`, `block.edit`, `pack.define` — **`entity.verb`, exactly.**
>
> So `@flave/doc` **is** Flave's capability registry. There is no second registry
> to build, and no adapter shim between them. `getCapabilityRegistry()` returns
> the operation set this phase already exists to define.

**What Flave owes the contract, and nothing more:** a `@flave/workspace`
singleton exposing `WorkspaceAdapter`, whose `invoke()` dispatches into
`@flave/doc`. Roughly a day's work, and it is what makes M4 a mount rather than
an integration.

**What Flave does not need:** module federation. The contract explicitly supports
adoption without it — *"Memopop can adopt the contract without federation… the
chat package mounts as a panel."* Flave is a local web app in Phase 1 and a Tauri
shell later; both mount a panel.

> **Flave is the contract's cleanest test.** Augment-it's chat imports
> `@augment-it/workspace` directly today, so extraction there means untangling a
> live coupling. Flave has no coupling to untangle — it implements the interface
> from the first line. If `@lossless/in-app-agent` is ever going to be a real
> shared package, Flave adopting the adapter *before* the chat surface exists is
> the strongest possible proof that the abstraction holds.

## Done conditions

1. A scripted sequence of capability invocations produces a document
   **byte-identical** to one composed by hand in the editor.
2. Every menu item and every palette command resolves to a named op in
   `@flave/doc` — no direct mutation path exists anywhere in the app.
3. Typing in the Compose pane produces a `block.edit()` call, not a buffer write.
4. The stub agent, returning canned `propose` turns, drives a real document
   change through accept — with no chat UI built.

Condition 2 is the one worth guarding. It is easy to satisfy 1, 3, and 4 while
leaving one convenient back door, and one back door is all it takes.

## Explicitly not in this phase

The chat surface itself · `layout.*` / `theme.*` / `data.*` / `viz.*` /
`publish.*` ops · `.flave/agent/` memory · `jj` and `@flave/vcs` · agent runtime
selection (D-10) · the settings dashboard · frames and the frame vocabulary.

## Open decisions that touch this phase

| ID | Decision | Bearing |
|---|---|---|
| D-10 | Agent runtime: in-app BYO-key / sidecar / hosted | Not blocking — the stub agent needs no runtime. Resolve before M4 |
| D-13 | Headless CLI in v1 scope? | Relevant: a CLI is a **fifth caller** of the same op set, and the cheapest possible proof the seam is real |
| D-23 | Synthesized nodes carry no source position | Bounds what Compose can edit. See [[Phase-0-The-Live-Render-Loop]] |

## See also

- [[Phase-0-The-Live-Render-Loop]] — the phase this one builds on
- [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] — §7.2 (the
  capability ceiling), §7.3 (editing surfaces), §9.1 (reuse from augment-it),
  §9.2 (the Document API), §9.6 (agent innovation discipline)
- `augment-it/context-v/plans/In-App-Chat-v0-0-1-for-Augment-It.md` — the shipped
  walking-skeleton precedent
- `augment-it/context-v/specs/Chat-Context-Awareness-Architecture.md`

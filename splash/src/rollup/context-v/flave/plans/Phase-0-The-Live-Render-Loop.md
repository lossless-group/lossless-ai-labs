---
title: "Phase 0 — The Live Render Loop"
lede: "Type Lossless Flavored Markdown, watch it become a styled document as you type, and invent new syntax without touching the renderer. The smallest thing that is already the product."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.3
status: Partially-Shipped
date_first_published: 2026-08-20
post_ship_note: >-
  Shipped 2026-08-20 in one pass. Done-conditions 1, 2 and 4 are green; #3
  (selecting a rendered element returns its source range) is asserted in markup
  only — there is no selection surface until Phase 1's Compose pane, hence
  Partially-Shipped rather than Shipped. Precondition 3 (owner sign-off on
  §1.1's v0 slices) was NEVER met; implementation proceeded at the operator's
  explicit instruction and sign-off remains outstanding. Measuring lfm falsified
  part of this plan's own D-23 reasoning — see the correction in that section.
  Toolchain cost two detours: Vite 8 + rolldown + Vitest 4 could not build a
  Svelte SSR test (pinned back to Vite 7 / Vitest 3), and pnpm 11 silently skips
  esbuild's postinstall without allowBuilds. One upstream defect found and
  written up: [[LFM-Barrel-Imports-Node-Builtins]]. Operator walk-through completed the same day:
  the app was opened by a human, typed into, and confirmed working —
  verdict "working but needs iteration". That closes the human rung; the
  CODIFIED browser drive is still absent, and a one-time human confirmation
  is not a regression test. Specific iteration items remain unnamed.
spec_reference: "[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]"
tags:
  - Plan
  - Flave
  - Lossless-Flavored-Markdown
  - Render-Pipeline
  - Trigger-Packs
  - CodeMirror
  - Svelte
  - Walking-Skeleton
publish: true
site_uuid: 459a637c-6cae-43fc-b6f5-655b992dae48
hex_code: 8oxl62
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
from: "flave"
from_path: "context-v/plans/Phase-0-The-Live-Render-Loop.md"
---
# Phase 0 — The Live Render Loop

## Why care?

Most document tools decide in advance what a document can contain. You get their
headings, their tables, their callouts, and when you need something they never
imagined, you are stuck — or you file a feature request.

Flave inverts that. You describe the thing you want, an agent writes a small
component, and the syntax exists. Not "in the next release" — in the next few
seconds, in the document you are already writing.

Phase 0 builds the loop that makes that true, and nothing else:

```
type markdown  →  see it rendered, instantly, in your styles
                       ↑
            ask an agent for a new syntax
                       ↓
     trigger-pack appears; editor hot-reloads; the syntax works
```

There is no bundle format here, no publishing, no clearance, no layout system,
no agent integration. Those are real and they are specced — see
[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] §13. They are
also not what makes the first day feel like anything. **This loop is.**

## The claim

> *I type LFM in a pane and see it rendered in my styles as I type. I hand-write
> one trigger-pack and a new syntax works without editing the renderer.*

Phase 0 is done when that sentence is demonstrably true, and not before.

## Why this and not §13's M0

The spec carries two ladders that disagree about the first move.

- **§13** numbers M0 · Format → M1 · Render. M0 opens with the `flave.yaml`
  schema, the CLI, and the format spec.
- **§1.1** defines "v0 — the editor" and states outright that *"the milestone
  list in §13 is not a queue to start at the top of."*

**We follow §1.1.** It was written later, at the spec owner's intervention, and
its reasoning holds: a folder of markdown files is already a valid `.flave`
bundle (§1.1, "a false binary"), so the format can be discovered by building
against it rather than frozen before anything renders.

§13 remains the map for v1. It is not the route to the first working thing.

## Preconditions

| # | Precondition | State as of 2026-08-20 |
|---|---|---|
| 1 | `lfm` reachable in-tree | ✅ **Resolved.** `lfm` was a gitlink with no `.gitmodules` mapping — it could never be initialized. Mapping added, submodule pulled. `@lossless-group/lfm@0.5.1` |
| 2 | A renderer contract to port from | ✅ **Prose, not code.** `AstroMarkdown.astro` is *not* in `lfm`. What is: its documented contract, across `lfm/context-v/` and the changelog. See "The port reference" below |
| 3 | §1.1's v0 slices signed off | ❌ **Open.** The spec is `status: Draft — v0.1, pre-engineering-handoff`. Do not sign off 2,623 lines; sign off §1.1's v0 only |
| 4 | D-13 — is the headless CLI in v1 scope? | ❌ **Open.** Gates whether the fixture harness runs through a CLI or only in-browser |

Preconditions 3 and 4 are the only two of §14's open decisions that gate this
phase. Everything else in that register can stay open.

## The port reference — what actually exists

The spec's anti-loop bet (§12.1) is that `@flave/render` is *"a port, not an
invention"* of `AstroMarkdown.astro`. Worth stating precisely, because it was
mis-read once already:

**The `.astro` file is not in `lfm`.** It lives in `astro-knots` (at
`packages/astro/src/components/markdown/`, not the `packages/lfm-astro/` path
the docs still cite — the package was renamed) and in `lossless-site`.

**What `lfm` carries is better for our purposes: the contract in prose.**

- `lfm/context-v/Maintain-Lossless-Markdown-and-Extended-Markdown-Render-Pipeline.md`
  — the recursive descent (`:74`) and the directive dispatch on `node.type` +
  `node.name` (`:122`).
- `lfm/changelog/2026-05-08_01.md:46` — the rule worth the most:

  > any Callout component MUST recurse via `<AstroMarkdown node={child} />`.
  > Never `toString(node)` or a plain-text fallback — that path silently
  > disables nesting and is the most common reason a freshly-copied Callout
  > looks "fine" until an author tries to embed something inside it.

- `lfm/changelog/releases/0.4.0.md:42` — a caution: every astro-knots site
  inlined a *different* slugify directly in its `AstroMarkdown.astro`,
  **including the canonical copy-from source.** There is no single clean thing
  to port from. There is a family with known divergence.

**Two rules carried over verbatim**, both named failure modes rather than
preferences:

1. Heading ids come from `lfm`'s `remarkHeadingIds` and are **never** recomputed
   in the renderer. *"One place decides what a fragment URL says; a second
   implementation in the render layer is exactly how the fleet's anchors drifted
   apart."*
2. Any container component recurses through the renderer. Never stringify
   children.

## What gets built

### 1 · Fixtures and the assertion harness — first

§1.1 calls this *"the highest-leverage anti-loop move,"* and it is what converts
"make the renderer good" (no end condition) into "make these pass" (an end
condition an agent can check itself).

- One assertion per trigger. `expect(html).toContain('class="callout callout--warning"')`.
- **No snapshots.** The spec is explicit and it is right — a snapshot suite
  passes by being regenerated, which is the opposite of a done-condition.
- Nesting fixtures are mandatory, not optional: a callout containing a table, a
  callout containing a callout, a callout containing a fenced block. These are
  the fixtures that catch the `toString` bug above.

### 2 · `@flave/render`

`FlaveMarkdown.svelte` — a single recursive dispatcher.

- Switches on `node.type`; imports itself to replace `Astro.self`; `$props()`
  replaces `Astro.props`; `{#if}` branches replace the `{type === "…" && (…)}`
  idiom.
- Threads an opaque `data` bag unchanged to every child.
- Subsidiary components only where real markup is needed: `Callout`,
  `CodeBlock`, `MarkdownImage`, `HeadingAnchor`, `Sources`.

Per §12.1 this is close to mechanical. Svelte 5 has every capability the Astro
version uses.

### 3 · The one extensibility branch

A final branch: an unrecognized `componentNode` or `containerDirective` looks up
the **trigger-pack registry** and renders its template with the parsed props.

> One branch, not a system. Resisting the urge to generalize here is most of the
> discipline of this phase.

### 4 · The trigger-pack registry

A `Map<name, Component>` plus one-line registration. **Not** §6.2's Tier 1
declarative YAML.

§12.1 already cut Tier 1 from v0 and the reasoning holds: its three
justifications were cross-renderer portability, sandboxing untrusted packs, and
letting a non-developer define syntax without code. The first two are not phase-0
concerns, and the third dissolved when an agent writes a Svelte component as
readily as it writes YAML.

### 5 · The editor pane

CodeMirror 6 → debounced `parseMarkdown()` from `@lossless-group/lfm` → MDAST →
render. One hand-edited `theme.css` of custom properties. No token pipeline, no
registry, no Tailwind generation.

### 6 · Source mapping — `data-block-id` and offsets

Every rendered element that maps to a source range carries its block id and
offsets. This is what makes Compose-pane editing possible in Phase 1, and it is
cheap now and expensive to retrofit.

**Prove it in the fixture suite**: select a rendered paragraph, assert you get
back the correct source range. Binary, checkable, and it either works or quietly
does not.

## D-23 — synthesized nodes carry no source position

> ✅ **RESOLVED 2026-08-20 — accept the constraint. Component regions are
> select-not-edit. Do not upstream position stamping to `lfm` now.**
> Decided by the PM of record. **Promote this row into §14 of the spec.**

Editing through the rendered pane requires mapping a rendered element back to a
source range. Plain markdown gives this free: remark stamps
`position.start.offset` / `position.end.offset` on every node.

**`lfm`'s synthesized nodes do not have it.** Surveyed 2026-08-20 across all nine
plugins — roughly 21 node-creation sites in `remark-lfm-wikilinks` (5),
`lfm-heading-blocks` (6), `remark-lfm-callouts` (5), `remark-lfm-citations` (3),
and `lfm-link-preview` (2) — **none set `position`.** The only plugin that reads
it does so defensively, and says so in its own comments:

> *"Returns false when either position is missing — a synthesized node cannot…"*
> *"a stale position that claims to cover both lines is worse than none"*

So `lfm` already knows synthesized nodes are unmapped and treats it as normal.

**Consequence — the editable line is imposed by the data, not chosen:**

| Node class | Behaviour in Compose |
|---|---|
| Plain prose — paragraph, heading, list item, blockquote, table cell, and inline marks within them | **Directly editable.** An edit becomes a text patch on a source range — precisely `block.edit(ref, patch)` from §9.2, *"surgical, not rewrite"* |
| Callouts, wikilinks, citations, link previews, heading blocks — everything `lfm` **synthesizes** | **Selectable, not directly editable.** No source range exists to patch. Selecting targets the block for the agent |
| Trigger-pack components (`:::metric-card`) | **Selectable, not directly editable — by choice, not by constraint.** See the correction below |

> ⚠️ **Correction, 2026-08-20 — measured, and this plan was partly wrong.**
> Written above: trigger-pack components have no source position. **They do.**
> A user-defined directive is a plain `remark-directive` node and keeps its
> range (`:::metric-card{…}` measured at `pos=0-54`); only `lfm`'s *synthesized*
> nodes lose it (`> [!note]` measured at `pos=NONE`). So the select-not-edit
> rule for components is not forced by the data — it is a **decision**, made for
> the reason immediately below. Both facts are now standing tests in
> `packages/render/test/render.test.ts`, so a future `lfm` release that changes
> either one turns the suite red instead of rotting the premise quietly.

**Keep this line even if position were free.** The alternative taxes the core
feature: if a user can type inside a trigger-rendered component, every
trigger-pack needs an *inverse serializer* — and "a Svelte component plus one
line" was the entire v0 pitch. This is also why a ProseMirror/Tiptap-style
rich-text model is the wrong substrate here: its schema cannot know
user-defined triggers in advance.

### Why accept rather than upstream

Stamping `position` on synthesized nodes in `lfm` is tractable — each plugin
consumed a known source range — and §15's no-fork rule plus D-16 already
contemplate upstream `lfm` PRs. It is still the wrong move now, for four reasons:

1. **The constraint and the correct design agree.** Even with position available,
   we would draw this line, because direct editing inside a component obliges
   every trigger-pack to ship an inverse serializer. The data is not forcing a
   compromise; it is enforcing a decision we would make anyway.
2. **It is not a one-way door.** Accepting costs nothing that upstreaming later
   would have to undo. Rendered elements carry `data-block-id` regardless; adding
   source offsets to more node classes later widens what Compose can edit without
   changing the seam.
3. **Upstreaming first means blocking Phase 0 on a PR to another repo** — five
   plugins, ~21 node-creation sites, and a review cycle — to enable an
   affordance nobody has yet missed.
4. **It matches how §12.1 already parked renderer drift**: *"I'm not worried
   about drift right now at all"* — correct, because two renderers can only
   disagree once two renderers matter. Same shape here. Select-not-edit can only
   annoy once someone is annoyed by it.

**Revisit when** a real document makes selection-instead-of-editing genuinely
irritating in use. That is a use signal, not a design argument, and it has not
happened yet because nothing has been used.

## Done conditions

Binary, checkable without judgement:

1. The fixture suite is green, including every nesting fixture.
2. A trigger-pack added by hand renders correctly **without any edit to
   `@flave/render`**.
3. Selecting a rendered plain-prose element returns the correct source range.
4. Typing in the source pane updates the rendered pane without a manual refresh.

## Explicitly not in this phase

Tauri · the bundle format and `flave.yaml` · layout, frames, surfaces · `deck`
and `paged` · themes as packages, the registry, Tailwind generation · clearance,
audiences, the leak scan · `jj` · DuckDB and `sql` fences · figures · HTMX ·
**the agent chat surface** · the declarative Tier 1 trigger-pack format.

Per §1.1, during Phase 0 the agent is Claude Code running in a terminal beside
the editor. It writes trigger-packs into the project; the editor hot-reloads
them. Almost no agent-integration work, and the loop is already real.

## Remaining work (as of 2026-08-20)

**Landed:** `@flave/render` with the recursive dispatcher, `Callout` and
`CodeBlock`, the trigger-pack registry branch, source-offset stamping, a
20-assertion fixture suite with the three nesting cases, `@flave/editor`
(CodeMirror 6 + live render + source toggle + stubbed menu bar), `theme.css`
copied from `splash/`, and `pnpm prove` covering rungs 0–2.

**Outstanding:**

1. **Owner sign-off on §1.1's v0 slices** — precondition 3, never met.
2. **A codified browser drive.** ✅ *Human rung closed 2026-08-20 — the
   operator opened the app and confirmed it works.* ❌ *Codified rung still
   open* — no click-path is named or automated, so nothing catches a silent
   break between two proof runs. Per the tree's browser-drive pattern the
   click-path belongs in the phase plan **before** implementation, and it did
   not; that sequencing mistake is the one worth not repeating in Phase 1.
3. **Done-condition 3, properly.** Source offsets are stamped and asserted in
   markup; nothing selects yet. Closes with Phase 1's Compose pane.
4. **Delete `apps/editor/src/node-builtin-stub.ts`** once `lfm` moves
   `og-cache` behind a subpath — see [[LFM-Barrel-Imports-Node-Builtins]].
5. **Wikilinks are absent from the corpus** because `lfm` gates them behind a
   per-site resolver. Fine for now; the fixture set should say so out loud when
   flave picks a resolution strategy.

## What comes next

[[Phase-1-One-Operation-Set-Four-Callers]] — the seam every writer goes through,
and where the agent-chat architecture actually gets decided.

## See also

- [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] — §1.1 (scope),
  §6.2 (trigger-packs), §12.1 (the renderer port), §13 (milestones), §14 (open
  decisions)
- `lfm/context-v/Maintain-Lossless-Markdown-and-Extended-Markdown-Render-Pipeline.md`
- `lfm/context-v/Maintain-Heading-Anchors-and-Share-Links.md`

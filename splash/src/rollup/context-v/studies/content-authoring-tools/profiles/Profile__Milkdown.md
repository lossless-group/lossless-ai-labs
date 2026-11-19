---
name: Milkdown Profile
title: Milkdown — Profile
slug: milkdown
upstream: https://github.com/Milkdown/milkdown
pinned_sha: 0655111f
pinned_date: 2026-10-27
version_at_pin: "v7.23.0-1-g0655111f"
license: MIT
maintainer: Mirone (Saul-Mirone) and the Milkdown contributors
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/milkdown
profile_kind: WYSIWYG Markdown editor framework — ProseMirror + remark (unified), plugin-composed, with Crepe as the batteries-included build
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Reference
site_uuid: f6187483-5b4b-408b-baed-32ee529904d4
hex_code: 5vib56
lede: >-
  The cleanest answer in the study to "how does a rich editor round-trip
  Markdown": every node declares how it reads and writes an mdast node, remark
  does the text, and anything the schema cannot name is an error rather than
  silent loss.
summary: >-
  Profile of Milkdown as pinned in the content-authoring-tools study. Milkdown
  is a framework, not an app: it stores nothing, and its document is a
  ProseMirror tree whose Markdown is produced on demand through remark. Covers
  the transformer (ParserState / SerializerState walking mdast ↔ ProseMirror),
  the $-prefixed composables ($nodeSchema, $remark, $command, $inputRule) that
  make a plugin, the fidelity tricks (remembering * vs _ markers, empty-line
  placeholders), the strict match-or-throw parser, Yjs collaboration via
  y-prosemirror, and the newer AI surface — streaming Markdown into the
  document and reviewing the result as accept/reject diff chunks — with its
  implications for flave's trigger packs and source-pane-first design.
tags:
  - Profile
  - Milkdown
  - ProseMirror
  - Remark
  - Unified
  - Editor-Framework
  - Markdown-Round-Trip
  - Plugin-Architecture
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Milkdown.md"
---
# Milkdown — Profile

A profile of Milkdown as it lives in this study (`studies/content-authoring-tools/milkdown`, pinned at `0655111f`, 2026-10-27, `git describe` → `v7.23.0-1`). MIT, copyright Mirone (`LICENSE`).

This is the study's **editor-engine** entry. [[Profile__Outline]] and [[Profile__Docmost]] are both ProseMirror wikis with a Markdown bridge bolted on; Milkdown is what it looks like when the bridge is the architecture.

## TL;DR

**Verdict: the best reference in the study for a schema-driven Markdown ↔ rich-tree round trip, and a direct comparison point for flave's trigger packs — but it is still a WYSIWYG model where the tree, not the text, is the truth.** Its new streaming + diff-review plugins are the most agent-native editor feature among the three repos in this group.

## How it works

- **Packages.** `core` (editor lifecycle and internal plugins), `ctx` (a slice/timer dependency container), `transformer` (mdast ↔ ProseMirror), `prose` (re-exported ProseMirror), `utils` (the `$` composables), `plugins/*` (presets and features), `components`, `crepe` (the opinionated full editor), `integrations/react|vue`, `kit` (re-export bundle).
- **The pipeline.** `remarkCtx` defaults to `unified().use(remarkParse).use(remarkStringify)` (`packages/core/src/internal-plugin/atoms.ts:57-58`). Parsing runs `remark.runSync(remark.parse(md))` and walks the mdast tree (`packages/transformer/src/parser/state.ts:209-216`); serializing builds an mdast tree from the ProseMirror doc and calls `remark.stringify` (`serializer/state.ts:362-363`). Markdown text never touches ProseMirror directly.
- **Startup as a dependency graph.** Internal plugins are slices plus timers: the serializer waits on `SchemaReady`, records `SerializerReady`, and only then builds (`packages/core/src/internal-plugin/serializer.ts:13-50`). Plugins compose by waiting on each other's timers rather than by load order.

## The node contract (the important part)

A node is one `$nodeSchema` call carrying ProseMirror spec **and** its Markdown mapping (`packages/utils/src/composable/composed/$node-schema.ts:40`). Blockquote, whole:

```ts
parseMarkdown: {
  match: ({ type }) => type === 'blockquote',
  runner: (state, node, type) => {
    state.openNode(type).next(node.children).closeNode()
  },
},
toMarkdown: {
  match: (node) => node.type.name === 'blockquote',
  runner: (state, node) => {
    state.openNode('blockquote').next(node.content).closeNode()
  },
},
```

(`packages/plugins/preset-commonmark/src/node/blockquote.ts:33-44`). The `match` is against **mdast**, not Markdown text, so new syntax is a two-step: register a remark plugin with `$remark` (`composed/$remark.ts:29-58`) so remark produces a node type, then add a `$nodeSchema` that matches that type. Commands (`$command`, `$command.ts:49`), input rules, keymaps, paste rules and node views are separate `$` composables bundled into a plugin array.

If no schema entry matches an mdast node, the parser throws `parserMatchError` (`parser/state.ts:66-79`); the serializer does the same for unknown ProseMirror types (`serializer/state.ts:77`). Loss is loud. Raw HTML survives as an atomic inline `html` node holding the source string (`preset-commonmark/src/node/html.ts:12-56`).

## What's on disk

Nothing — Milkdown has no store. The host gets Markdown back on demand (`serializerCtx`) or on every change through `@milkdown/plugin-listener`'s `markdownUpdated((ctx, markdown, prevMarkdown) => …)` (`docs/api/plugin-listener.md:17`), and persists it however it likes. With `plugin-collab`, the live truth is a Y.XmlFragment bound through `y-prosemirror` (`packages/plugins/plugin-collab/src/collab-service.ts:86-114`); `applyTemplate` seeds an empty shared doc from Markdown (`:190-215`).

## Agent reach

A framework's "agent reach" is whatever the host exposes. What Milkdown itself provides:

- **Named commands.** Every `$command` registers a key in `commandsCtx`; anything holding the editor calls `editor.action(callCommand(key, payload))` (`$command.ts:14-47`).
- **Streaming.** `startStreamingCmd`, `pushChunkCmd`, `endStreamingCmd`, `abortStreamingCmd` (`plugins/plugin-streaming/src/streaming-commands.ts:21`, `:98`, `:123`), with `insertAt: 'cursor' | 'selection' | <pos>` and a per-context insert strategy (`docs/api/plugin-streaming.md:60-200`).
- **Diff review.** `startDiffReviewCmd` takes proposed Markdown, locks the editor, and shows per-chunk Accept/Reject; `acceptDiffChunkCmd` / `rejectDiffChunkCmd` resolve by index (`plugins/plugin-diff/src/diff-commands.ts:31`, `:82`; `docs/api/plugin-diff.md`).
- **Crepe's AI feature** wires both behind a provider contract — `AIProvider = (context: {document, selection, instruction}, signal) => AsyncIterable<string>` (`packages/crepe/src/feature/ai/types.ts:14-26`) — with bundled `anthropic` and `openai` adapters (`packages/crepe/src/llm-providers/`).

There is no file, API or MCP surface; an out-of-process agent reaches a Milkdown document only through the host app.

## What's clever or unique

1. **mdast as the interchange, both directions.** Because the schema maps ProseMirror ↔ mdast rather than ↔ text, Milkdown inherits the whole unified ecosystem for free: any remark plugin that yields a node type can become an editable node with one `$nodeSchema`.
2. **Fidelity for things CommonMark treats as equivalent.** `remarkMarker` reads the source character at each `strong`/`emphasis` start offset and stores it, so `_x_` stays `_x_` (`preset-commonmark/src/plugin/remark-marker-plugin.ts:10-24`; `mark/emphasis.ts:25-48`). `remarkPreserveEmptyLine` round-trips deliberate blank paragraphs through a `<br />` placeholder (`remark-preserve-empty-line.ts:9-76`). Custom `remark-stringify` handlers stop trailing spaces becoming `&#20;` (`packages/core/src/__internal__/remark-handlers.ts:3-15`).
3. **Strict, not silent.** Match-or-throw on both sides (`parser/state.ts:76`, `serializer/state.ts:77`) means a schema gap is found in development, not as quietly vanished content in production.
4. **Streaming as a diff, not an append.** Each flush re-parses the whole buffer and applies only `computeDocDiff(old, new)` ranges as `tr.replace` steps (`plugins/plugin-streaming/src/flush.ts:19-42`; diff built on `prosemirror-changeset`, `plugin-diff/src/diff-compute.ts:1-6`). Half-written Markdown (an unclosed `**`) renders progressively without thrashing the DOM.
5. **Review is a first-class mode.** `endStreamingCmd({ diffReview: true })` restores the original and presents the stream as chunks to accept or reject (`docs/api/plugin-streaming.md:105-130`). "Agent proposes, human disposes" is a built-in editor state, not an app feature.

## Costs / limits

- **The tree is the truth.** Markdown is regenerated by `remark-stringify`; formatting choices beyond the preserved ones (list markers, line wrapping, escaping) are normalized. It round-trips *meaning* well and *bytes* only partly.
- **No directive or frontmatter support shipped.** A grep for `directive` and `frontmatter` across `packages/` finds nothing; `:::callout` or YAML would each need a remark plugin plus schema.
- **Framework tax.** A minimal editor is `Editor.make().use(commonmark)...`; a usable one is Crepe, which brings its own UI, theme and CodeMirror-in-code-block feature.
- **No storage, no server.** Collaboration means running your own Yjs provider (`docs/api/plugin-collab.md`).

## Relevance to flave

- **Trigger pack vs. `$nodeSchema` + `$remark`: flave's is cheaper, Milkdown's is two-way.** A flave trigger pack is a Svelte component plus one registration line and only has to *render*, because the source pane owns the text. A Milkdown node must also define `parseMarkdown` and `toMarkdown` because the rich view is editable. If flave's "rendered page you can type into" caller (Phase 1) grows beyond attribute edits, each pack will need a `toSource` half — Milkdown's runner shape is the template for it.
- **Borrow strict matching.** flave's renderer should treat an unregistered directive as a visible diagnostic, as Milkdown's `parserMatchError` does, rather than dropping it or rendering it as plain text.
- **Borrow streaming-as-diff and diff review for the agent caller.** Re-parse the buffer, apply only changed ranges, then let the human accept or reject chunks. In flave this is easier: the diff can be computed on source text and LFM blocks, and each accepted chunk becomes a named operation in the log.
- **Note: `$command` is "one operation set" at editor scope.** Named, keyed commands callable from keymaps, toolbars, slash menu and AI are Milkdown's version of flave's four callers — but they mutate the ProseMirror tree. flave's ops should mutate source and let the render follow; avoid letting the rendered pane become a second source of truth.
- **Avoid the WYSIWYG normalization trap.** remark-stringify rewrites what the author typed. A CodeMirror source pane preserves bytes; keep it the editable canonical surface and treat the rendered pane as a projection.

## Read next

- `packages/transformer/src/parser/state.ts`, `serializer/state.ts` — the whole round-trip engine in ~600 lines
- `packages/plugins/preset-commonmark/src/node/*.ts` — one node per file, both directions
- `packages/plugins/preset-commonmark/src/plugin/` — the fidelity remark plugins
- `packages/plugins/plugin-streaming/src/flush.ts` and `docs/api/plugin-diff.md` — the AI write path

## Related

- [[Profile__Outline]] — same problem solved with markdown-it + prosemirror-markdown, plus a server-side patch API
- [[Profile__Docmost]] — the HTML-hop alternative, and what it loses
- [[Profile__MarkText]] and [[Profile__Zettlr]] — app-level Markdown editors, for comparison with a framework
- [[Profile__mystmd]] — the unified/mdast ecosystem used for documents rather than editing

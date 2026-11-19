---
title: "Positioning Flave Against the Content-Authoring-Tools Study"
lede: "Twenty-three tools, and none of them carries one source through to several audiences with proof that nothing leaked. The study backs flave's core bet, backs most of its spec, and pushes back on exactly one rule: the agent will write bytes to files whether we allow it or not."
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
at_semantic_version: 0.0.0.1
status: Draft
publish: true
site_uuid: bc65dfaf-caf9-4669-ae85-505e8866813a
hex_code: rt5wgj
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
categories: Exploration
spec_reference: "[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]"
study_reference: "[[Synthesis__What-23-Authoring-Tools-Teach-About-Agent-Reach]]"
tags:
  - Exploration
  - Flave
  - Positioning
  - Competitive-Landscape
  - Agent-Reach
  - Clearance
  - Notebooks
type: Explorations
from: "flave"
from_path: "context-v/explorations/Positioning-Flave-Against-the-Content-Authoring-Tools-Study.md"
---
# Positioning Flave Against the Content-Authoring-Tools Study

Source material: the `content-authoring-tools` study
(`ai-labs/studies/content-authoring-tools/`), which profiles 23 open-source and
source-available authoring tools, plus its synthesis,
[[Synthesis__What-23-Authoring-Tools-Teach-About-Agent-Reach]]. Profile names
below (e.g. [[Profile__SilverBullet]]) point into that study's
`context-v/profiles/`; each one cites pinned upstream code at `file:line`.

This document maps those findings onto the
[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] spec. It
proposes; it doesn't change the spec.

## 1 · Where flave sits

Three axes separate the 23 entries:

1. **Where the truth lives:** a file you can open, or a database / CRDT the app owns.
2. **How an agent gets in:** not at all, by reading a copy, by writing files, or through typed operations.
3. **What happens to the workings:** discarded, compiled one way into output (§2.2's "literate-document tools"), or carried with the document and filtered per audience.

| | Truth | Agent reach | Workings |
|---|---|---|---|
| Logseq, SiYuan, Trilium, Joplin | Local DB / AST file | MCP / local API | Not a concept |
| AFFiNE, AppFlowy, Anytype | CRDT / object store | MCP, local API, or none | Not a concept |
| Outline, Docmost | Server DB + Yjs | MCP (Docmost: licensed) | Not a concept |
| Khoj | A copy of yours | Reads a copy; writes via Apply/Cancel | Not a concept |
| MarkText, Zettlr, VNote | File | File, or VNote's HTTP API | Not a concept |
| **SilverBullet** | **File** | **MCP + file co-editing with 3-way merge** | Baked query sections |
| **Baalda** | File as a port onto a CRDT | MCP into the live doc | Not a concept |
| mystmd, Evidence, Notebook Kit, Pluto, Livebook, Deepnote | File | File (some add CLI / MCP) | **Compiled one way** |
| **flave (spec)** | **File (folder = bundle)** | **Typed operations** | **Carried, filtered by clearance** |

**The positioning, stated against the field:**

> Notebooks and literate tools keep the file but throw the workings away on
> publish. Second brains and wikis let agents in but moved the truth into a
> database. Flave keeps the file, lets the agent in through typed operations,
> and is the only entry where the workings travel with the document and a
> verified publish filters them per audience.

The closest neighbours, and what each one already has that flave hasn't built:

- **[[Profile__SilverBullet]]:** plain Markdown as the truth, coding agents
  named as co-editors, `If-Match` writes plus server-side diff3, extensions as
  pages under `Library/`. Missing: typed block operations, clearance.
- **[[Profile__mystmd]]:** typed directives, a published AST, numbered
  cross-references, citations. The study's own words: *"what LFM keeps
  promising itself."* Missing: the editor, audiences, the private layer.
- **[[Profile__Baalda]]:** plain `.md` plus real-time collaboration plus MCP.
  Missing: typed operations, publishing.
- **[[Profile__Livebook]]:** Markdown notebooks, and the only entry that
  documents a Claude Code hook to push an agent's file edit into the live
  session.

## 2 · What the study backs

- **The folder is the bundle (§1.1, "a false binary").** Every pure editor
  and every notebook kept the file as the truth. The apps that left files did
  so for backlinks, queries and multiplayer, and paid for it with lossy
  Markdown ([[Profile__Logseq]] now only *mirrors* Markdown, one way).
- **The source pane is canonical.** Every rich editor that writes Markdown back
  from a tree loses bytes: Outline admits it, Docmost routes through HTML, and
  MarkText reformats on save. Even [[Profile__Milkdown]]'s strict round trip lets
  remark-stringify rewrite what the author typed. Keep CodeMirror canonical, and
  have the Compose caller emit operations, never a re-serialized AST.
- **Typed operations (§9.2).** The field is converging on the same shape:
  SiYuan declares `LocalRead`/`LocalWrite` per action; Trilium marks tools
  read-only or destructive; Outline locates edits through a
  Markdown↔ProseMirror block map. Flave's Document API is ahead of most of them,
  not behind.
- **Reserve block ids from M0 (§8.4).** [[Profile__Livebook]] shows the cost of
  not doing it: cell ids are random on every load, so nothing durable can point
  at a cell. [[Profile__Pluto]] shows the fix: a UUID per cell written into the
  text, plus a loader that repairs bad or duplicate ids instead of failing.
- **Clearance is a real gap (§11).** Per-block clearance, named audiences, and
  a publish that fails on a leak exist nowhere in the 23. This is the
  product's center of gravity (D-01), and the study finds it uncontested.

## 3 · Where the study pushes back

### 3.1 "The agent never writes bytes to files" (§9.2)

This is the one rule the field contradicts. Coding agents (Claude Code, Codex)
write files directly, and the tools that welcome them don't fight it:
SilverBullet's docs name them as co-editors, Livebook ships the hook,
Baalda diffs every disk edit into its CRDT.

**Proposal:** keep typed operations as the *preferred* path and add **file
reconciliation as a fifth caller.** When a watched file changes outside the app,
parse it, diff it against the current AST, and replay the difference as named
operations, so history, block ids and clearance checks see an ordinary edit.
Precedents:

- [[Profile__Livebook]] `POST /dev/sync`: re-parse, diff into session
  operations, apply.
- [[Profile__Baalda]] origin tags (`disk` / `editor` / `remote`) and a
  `lastWrittenHash` so the watcher drops its own echo.
- [[Profile__MarkText]]'s decision table: byte-identical → no-op; clean buffer
  → silent reload; dirty buffer → prompt; stale-epoch saves dropped.

This is also the cheapest answer to Phase 2's file watching.

### 3.2 The CRDT deferral (§8.4)

The deferral holds. Two findings change the ladder below it:

- **Insert a v1.5 rung that needs no CRDT:** conditional writes (`If-Match`,
  as in SilverBullet and VNote), server-side three-way merge, and conflicts
  written as reviewable candidates instead of guesses (AFFiNE's
  `.affine-sync/candidates/`). That covers "my agent and I both edited it"
  without a multi-quarter project.
- **When v3 comes, the prose layer is smaller than §8.4 assumes.** Baalda puts
  one Yjs `Y.Text` per Markdown file and keeps the file a faithful projection.
  The layout JSON and token layers are still the hard part, but prose
  multiplayer is a bounded project.

## 4 · What to borrow, by spec section

### Phase 1 operation set (§9.2, the four callers)

A rail checklist assembled from the study's convergent patterns. None of the 23
has all of these:

- [ ] **Agent writes off by default**; read is the default grant (Joplin, AFFiNE, Khoj).
- [ ] **Grants map onto clearance:** an agent holding a `public`-only grant can't read `team` blocks (Anytype's per-space Read/ReadWrite grant, approved by the human). That makes "nothing leaks" enforceable at the API, not only at publish.
- [ ] **Every operation declares its effect** (read / write / destructive), as in SiYuan and Trilium.
- [ ] **`If-Match` on every write**; refuse with a typed error rather than touch a dirty human buffer (VNote's 409 `unsaved_changes`).
- [ ] **Dry run** on batched writes (Logseq `upsertNodes`).
- [ ] **Fail loud:** a write that changes nothing is an error and echoes what it found (Outline).
- [ ] **Locate by block id first, by quoted text as fallback**, with ambiguity as an error rather than a guess (Outline `findText`, Joplin's heading rule).
- [ ] **Reads by outline, then section**, capped in size (Joplin's `read_note`).
- [ ] **Agent edits arrive as reviewable chunks** (Milkdown's diff plugin, Khoj's Apply/Cancel). This is the `propose` contract §8.4 already plans to reuse for v2 human review.

### Trigger packs (§6.2)

- **Add a typed schema to the registration line.** MyST's `DirectiveSpec`
  (typed `arg` / `options` / `body` plus `validate`) and Evidence's typed
  `attributes:` with `preview:` fixtures are both the right shape. A preview
  fixture doubles as the test that `pnpm prove` renders.
- **Match or throw.** An unregistered directive should be an error, not
  silently dropped ([[Profile__Milkdown]]).
- **If Compose ever edits inside a pack's output, the pack needs a `toSource`
  half.** Milkdown's `$nodeSchema` pairs `parseMarkdown` with `toMarkdown` for
  exactly this reason.
- **Packs and frames as documents.** SilverBullet keeps executable extensions
  under `Library/` and lint-warns them anywhere else; that's a clean trust
  boundary for `pack.install` (trust-gated in §9.2).

### Clearance and publishing (§11)

- **Encryption is not clearance.** Joplin's end-to-end encryption still leaves ids,
  parent ids and timestamps in plaintext. The leak scan should treat headings,
  block ids, file names and asset names as content.
- **Add an "agent-hidden" marker** next to the clearance ladder: Trilium's
  `excludeFromLlm` hides a subtree from every LLM tool, and excluded looks
  identical to missing.
- **Any retrieval index carries clearance.** If flave chunks documents for an
  agent (Khoj's heading-ancestry chunking is the pattern to copy), each chunk
  must carry its block's clearance and be filtered at query time. Otherwise
  retrieval is a back door around the publish scan.
- **Write-only contributors.** Notesnook's inbox (schema-checked, sanitized,
  provenance-tagged, revocable keys, can create but never read) fits an LP or
  outside contributor who must not see `private` blocks.

### Data, `sql` fences and figures (§7.4–7.6)

- **Named fences, names required and unique.** Evidence's named fences and
  Deepnote's `deepnote_variable_name` both bind a result to a name; Pluto shows
  that unique names are what make dependency order computable.
- **Compose queries by name** (`{{name}}`) and address `.sql` files by path, as
  Evidence does.
- **Pinned snapshots, keyed by hash (§7.5's "hard rule").** Notebook Kit
  freezes every query result into `.observable/cache/<nameHash>-<queryHash>.json`
  and rewrites the cell to read the file, so readers never need database access.
  That is §7.5's pinned snapshot, already built. Keep credentials out of the
  cache folder (Notebook Kit mixes them).
- **Outputs stay out of `content/`** (Livebook off by default, Deepnote
  sidecar snapshots).
- **Make the hash real provenance.** Deepnote's `snapshotHash` covers code and
  environment and explicitly disclaims data provenance. Folding the sha256s from
  `data/_sources.yaml` into the same hash gives flave what nobody in the study
  has: *this number came from these bytes, from this source.*
- **Keep DuckDB over `data/`.** Evidence's rewrite dropped in-browser DuckDB
  for live warehouse queries. That's right for a BI tool and wrong for flave,
  whose thesis is that the data ships inside the document.

### Citations and cross-references (LFM)

- [[Profile__Zettlr]] parses Pandoc citations as separate child nodes
  (prefix, citekey, locator, suffix) and renders them in place with citeproc
  until the cursor touches them. It's the closest working model for LFM's
  hex-code citations in a CodeMirror 6 pane, and it uses the same
  `shouldHandleNode`/`createWidget` renderer pattern flave would need.
- [[Profile__mystmd]] has numbered cross-references (`[](#label)` → "Figure 1")
  and DOI→CSL-JSON caching. Its colon-fence directive dialect is one LFM doesn't
  yet normalize.

### Agents inside the document (§9)

- **Tasks as an agent hand-off.** Logseq routes a block to an agent when it's a
  TODO with the agent as assignee and no session id, then writes the session id
  back. That's a document-native protocol for "agent, do this paragraph".
- **Bring the user's own agent.** Trilium's chat drives the user's Claude Code
  (file and shell tools disabled, Trilium's MCP as its only tools) and
  Copilot / Codex over the Agent Client Protocol. A model for the Chat rail that
  avoids flave paying for inference.

## 5 · What the study argues against

- **Don't store the AST as the file** ([[Profile__SiYuan]]'s `.sy`): agents can
  read it, but raw writes desync SiYuan's own indexes, and its docs rank file
  writes last.
- **Don't keep three representations** (Outline: Markdown, ProseMirror JSON and
  Yjs in Postgres).
- **Don't bridge through HTML** ([[Profile__Docmost]]): Markdown becomes a
  degraded export.
- **Don't let a block-tree CRDT become the truth** ([[Profile__AFFiNE]],
  [[Profile__AppFlowy]]). AppFlowy is the study's clearest case of robustly
  local-first with zero agent reach.

## 6 · Notebook ideas backlog

The owner keeps a separate backlog of ideas for a personal interactive notebook.
It isn't in this repo yet. When it's linked, each idea should be checked against
§2–§4: does a profiled tool already do it (borrow), does it collide with
flave's file-truth or clearance rules (reshape), or is it in a gap the study
found (build)?

## 7 · Suggested follow-ups

1. Decide §3.1 (file reconciliation as a caller) before Phase 2's file
   watching, since it changes what the watcher does.
2. Fold the §4 rail checklist into
   [[Phase-1-One-Operation-Set-Four-Callers]] as acceptance criteria.
3. Add the typed schema to the trigger-pack registration in §6.2 of the spec.
4. Draft the `sql` fence spec against Evidence, Notebook Kit and Deepnote before
   un-parking it.

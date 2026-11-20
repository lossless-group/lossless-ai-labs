---
title: "Positioning Flave Against the Content-Authoring-Tools Study"
lede: "Twenty-three tools, and none of them carries one source through to several audiences with proof that nothing leaked. The study backs flave's core bet, backs most of its spec, and pushed back on exactly one rule, that agents must not write files. That rule is now gone: agents write the files, and Jujutsu and git catch mistakes."
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
at_semantic_version: 0.0.1.0
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
2. **How an agent gets in:** not at all, by reading a copy, by writing files, or through an API.
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
| **flave (spec)** | **File (folder = bundle)** | **Writes the files; `jj` catches mistakes** | **Carried, filtered by clearance** |

**The positioning, stated against the field:**

> Notebooks and literate tools keep the file but throw the workings away on
> publish. Second brains and wikis let agents in but moved the truth into a
> database. Flave keeps the files, lets any agent write them directly with
> version control as the safety net, and is the only entry where the workings travel with the document and a
> verified publish filters them per audience.

The closest neighbours, and what each one already has that flave hasn't built:

- **[[Profile__SilverBullet]]:** plain Markdown as the truth, coding agents
  named as co-editors, `If-Match` writes plus server-side diff3, extensions as
  pages under `Library/`. Missing: clearance, audiences, publishing.
- **[[Profile__mystmd]]:** typed directives, a published AST, numbered
  cross-references, citations. The study's own words: *"what LFM keeps
  promising itself."* Missing: the editor, audiences, the private layer.
- **[[Profile__Baalda]]:** plain `.md` plus real-time collaboration plus MCP.
  Missing: publishing, clearance.
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
  have Compose edit the source text, never write back a re-serialized AST.
- **Agents write the files (§9.2, D-28).** Every tool that kept plain files
  lets agents edit them directly, and the ones that went to an API (SiYuan,
  Trilium, Outline) did so because their truth had left the file. Flave has no
  reason to follow them there.
- **Reserve block ids from M0 (§8.4).** [[Profile__Livebook]] shows the cost of
  not doing it: cell ids are random on every load, so nothing durable can point
  at a cell. [[Profile__Pluto]] shows the fix: a UUID per cell written into the
  text, plus a loader that repairs bad or duplicate ids instead of failing.
- **Clearance is a real gap (§11).** Per-block clearance, named audiences, and
  a publish that fails on a leak exist nowhere in the 23. This is the
  product's center of gravity (D-01), and the study finds it uncontested.

## 3 · Where the study pushes back

### 3.1 "The agent never writes bytes to files" (§9.2), resolved

This was the one rule the field contradicted. Coding agents (Claude Code,
Codex) write files directly, and the tools that welcome them don't fight it:
SilverBullet's docs name them as co-editors, Livebook ships the hook, Baalda
diffs every disk edit into its CRDT.

**Resolved 2026-11-19 by the owner (D-28):** there is no Document API. A flave
is a folder of low-data files; agents generate and write them; Jujutsu and git
catch renegade behavior. An earlier draft of this section proposed keeping typed
operations and treating outside file writes as a "fifth caller" to reconcile.
That was still backwards and is withdrawn.

What the study still offers is how the *app* should follow files that change
under it:

- [[Profile__Baalda]] origin tags (`disk` / `editor` / `remote`) and a
  `lastWrittenHash` so the watcher drops its own echo.
- [[Profile__MarkText]]'s decision table: byte-identical → no-op; clean buffer
  → silent reload; dirty buffer → prompt; stale-epoch saves dropped.
- [[Profile__Livebook]] `POST /dev/sync`: re-parse after an outside write and
  update the live view.

This is the whole of Phase 2's file watching.

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

### Around agent writes (§8.2, §9.2)

Rails from the study that still apply once agents write files directly. They
belong to the app, the validator and version control, not to an agent API:

- [ ] **Never clobber a dirty human buffer.** When a file changes on disk while
  the editor holds unsaved edits, keep both and ask (MarkText, VNote's
  `unsaved_changes`).
- [ ] **One `jj` step per agent session**, so a bad session undoes as one
  gesture whether the agent ran in the app or outside it.
- [ ] **The diff is the review.** Show what an agent session changed per file,
  the way Milkdown's diff plugin and Khoj's Apply/Cancel do, but after the fact
  and backed by `jj undo` rather than as a gate.
- [ ] **Fail loud in the validator.** Broken block references, duplicate ids,
  a data file with no `_sources.yaml` row: diagnostics with a fix (Pluto's
  loader repairs bad ids instead of failing).
- [ ] **Clearance at publish, not at write.** Any agent can read any file; the
  guarantee is that a publish for an audience can't include blocks above its
  clearance. For the in-app agent, optionally keep agent-hidden blocks out of
  its context (Docmost's `excludeFromLlm`).

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

1. ~~Decide §3.1~~ Resolved as D-28: agents write files. Build Phase 2's file
   watching against the §3.1 precedents.
2. Fold the §4 "around agent writes" checklist into the next agent phase as
   acceptance criteria. ([[Phase-1-One-Operation-Set-Four-Callers]] is
   superseded.)
3. Add the typed schema to the trigger-pack registration in §6.2 of the spec.
4. Draft the `sql` fence spec against Evidence, Notebook Kit and Deepnote before
   un-parking it.

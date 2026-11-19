---
title: "Synthesis — What 23 Authoring Tools Teach About Agent Reach"
lede: >-
  Plain Markdown on disk is losing ground as the store, MCP is now table stakes,
  and every serious entry independently invented the same handful of safety
  rails for agent writes. Nobody ships one source that publishes differently to
  different audiences.
summary: >-
  Cross-profile synthesis of the content-authoring-tools study's 23 pinned
  entries: second brains, team wikis, Markdown editors, and notebooks whose
  file is Markdown or plain source. Groups findings into eight patterns (where
  the truth lives, MCP as table stakes, the convergent agent-write safety
  rails, three answers to concurrency, the Markdown round-trip problem, typed
  extension models, notebook format design, and skills-as-documents) and
  closes with the gaps no entry fills.
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Draft
study: studies/content-authoring-tools
site_uuid: b78ce5ba-7ddc-48ca-b8c1-8295dd3865f9
hex_code: yqwlng
tags:
  - Synthesis
  - Content-Authoring-Tools
  - Agent-Reach
  - MCP
  - Local-First
  - Notebooks
publish: true
type: Explorations
from: "studies/content-authoring-tools"
from_path: "context-v/explorations/Synthesis__What-23-Authoring-Tools-Teach-About-Agent-Reach.md"
---
# Synthesis — What 23 Authoring Tools Teach About Agent Reach

This reads across the 23 profiles in [`../profiles/`](../profiles/). Every claim
here is sourced in a profile, which cites the pinned upstream code at
`file:line`. Go to the profile for the evidence; this page is the pattern.

The study's question: *which authoring tools let an AI agent read and write
the same store the human uses, without going through an app-specific cloud
API?* As of November 2026 the short answer is that **almost all of them now
let an agent in, and almost none of them let it in through files.**

## 1 · Where the truth lives: files are losing

Sort the 23 by what is actually authoritative:

| Source of truth | Entries |
|---|---|
| **Plain Markdown / source file** | [[Profile__SilverBullet]], [[Profile__MarkText]], [[Profile__Zettlr]], [[Profile__VNote]], [[Profile__Livebook]] (`.livemd`), [[Profile__Pluto]] (`.jl`), [[Profile__mystmd]], [[Profile__Evidence]], [[Profile__Notebook-Kit]] (`.html`) |
| **File as a port onto a CRDT** | [[Profile__Baalda]] (one Yjs `Y.Text` per note; the CRDT decides what the file says next) |
| **Structured file that isn't Markdown** | [[Profile__SiYuan]] (`.sy` = editor AST as JSON), [[Profile__Deepnote]] (YAML blocks) |
| **Local database** | [[Profile__Logseq]] (SQLite on master; file graphs removed), [[Profile__Trilium]] (one SQLite file), [[Profile__Joplin]] (plaintext SQLite; files only on the sync target), [[Profile__Notesnook]] (encrypted SQLite) |
| **CRDT / object store** | [[Profile__AFFiNE]], [[Profile__AppFlowy]] (yrs in RocksDB), [[Profile__Anytype]] (object graph) |
| **Server database** | [[Profile__Outline]] (Markdown + ProseMirror JSON + Yjs, three copies), [[Profile__Docmost]], [[Profile__Khoj]] (a copy of *your* notes in Postgres) |

The headline is **Logseq**. The archetypal Markdown outliner removed file
graphs on master; Markdown is now an import format and a one-way
mirror. Among the second brains, **SilverBullet is the only one still keeping
plain Markdown as the truth**, and it is also the one whose docs name coding
agents as expected co-editors.

The split is cleaner than it first looks: **apps that edit documents moved to
databases; tools that are documents stayed in files.** Every notebook and
every pure editor kept the file. The PKM and wiki apps, which need backlinks,
queries, sync and multiplayer, moved to a database and kept Markdown as an
export.

## 2 · MCP is table stakes

In 2026, an agent surface is no longer a differentiator:

- **Ships an MCP server or a local API built for one:** Logseq, SiYuan,
  SilverBullet, Trilium, Joplin, Outline, Baalda, AFFiNE (EE server half),
  Anytype (local API + one-click MCP config), Docmost (licensed), Deepnote
  (17 tools), VNote (loopback HTTP API designed for an external MCP server).
- **Agent surface of another shape:** Livebook (dev endpoints + a documented
  Claude Code hook), Evidence (CLI with `--json`, hosted Studio MCP), Khoj
  (MCP *client* plus a read-only ingest copy), Notesnook (write-only PGP inbox).
- **None:** AppFlowy (its MCP module is commented out), Zettlr, MarkText,
  Milkdown, Pluto, mystmd, Notebook Kit. Each of these is either a library or a
  tool whose file is already the API.

The second list matters more than the first: **when the file is the
document, the file is the agent API.** Pluto, mystmd and Notebook Kit need no
MCP because an agent edits them with a text diff.

## 3 · The convergent safety rails for agent writes

The most useful finding in the study. Entries that never read each other's
code invented the same rails:

| Rail | Who |
|---|---|
| **Off or read-only by default** | Joplin (write tools off), AFFiNE (READ_ONLY tokens), Khoj (`read` default), Outline (team setting), Trilium (ETAPI token always required) |
| **Scoped grants a human approves** | Anytype (per space, Read/ReadWrite, shows the caller's process path), VNote (four scopes incl. `read-live`), SilverBullet (OAuth per space), Notesnook (revocable, expiring keys) |
| **Optimistic concurrency** | SilverBullet (ETag + `If-Match` → 412), VNote (`If-Match` → 409 `unsaved_changes`), Baalda (`expectedRevision`) |
| **Never clobber a human's unsaved buffer** | VNote (409 on a dirty buffer; can read the live buffer separately) |
| **Declared effects per operation** | SiYuan (`LocalRead`/`LocalWrite` per action), Trilium (read-only/destructive hints), Joplin (read and write tool sets) |
| **Locate by quoting, not by offset** | Outline (`findText` + a Markdown↔ProseMirror block map), Baalda (exact-anchor edits), Khoj (SEARCH/REPLACE blocks), Joplin (outline → section reads; ambiguous heading = error) |
| **Dry run** | Logseq (`upsertNodes` dry-run) |
| **Fail loud** | Outline (a write that persists nothing errors), Milkdown (unknown node throws rather than dropping) |
| **Human approves the diff** | Khoj (Apply/Cancel on a word diff), Milkdown (accept/reject chunks), AFFiNE (review candidates on disk) |
| **Agent-invisible content** | Trilium (`excludeFromLlm` label; excluded looks identical to missing) |

Taken together this is a de-facto spec for "letting an agent write into a
human's document". No single entry has all of it.

## 4 · Three answers to "the human, the file and the agent all changed it"

1. **CRDT:** AFFiNE, AppFlowy, Outline, Docmost, and Baalda. Baalda's twist is
   that the CRDT holds *one string per note*, not a block tree, which keeps the
   file a faithful projection.
2. **Three-way merge:** SilverBullet (server-side diff3; real conflicts become
   Git-style markers rendered as an inline widget), AFFiNE's hidden disk sync,
   and Joplin (line-based merge; word-level merge was tried and dropped because it
   duplicated text).
3. **Reload or keep:** Zettlr, MarkText (an explicit decision table:
   identical bytes → no-op, clean tab → silent reload, dirty tab → prompt),
   VNote (2-second content poll).

The interesting move is the **refusal layer** that sits on top of any of the
three. AFFiNE writes `.affine-sync/candidates/<hash>.md` when a merge can't be
represented. Baalda refuses blank files, holds mass deletes over 20%, and
snapshots before rewrites above 60% churn. MarkText drops saves captured under
a stale epoch and suppresses its own echo. **The tools users trust guard the
edges, not just the merge.**

## 5 · Markdown round-trips are lossy wherever a rich editor sits on top

- Outline documents its own Markdown export as "lossy… only for export".
- Docmost goes Markdown → HTML → ProseMirror and back through Turndown, so
  callout types collapse to four and frontmatter is stripped.
- MarkText re-serializes from a block tree on every save, so a human edit can
  reformat what an agent wrote.
- Milkdown is the best of them: each node declares its mdast parse and
  serialize, and anything unnamed is an error. Even so, remark-stringify
  rewrites the author's bytes.

**Lesson: if Markdown is the source, the source pane must be canonical and
every rendered view must write back through operations on the source, never by
re-serializing an AST.**

## 6 · Extension models are getting typed

| Entry | Extension unit | Typed? |
|---|---|---|
| [[Profile__mystmd]] | `DirectiveSpec` (`arg`, `options`, `body`, `validate`, `run`), plus executable plugins in any language (AST JSON on stdin/stdout) | Yes |
| [[Profile__Evidence]] | Custom component = a Markdown file with typed `attributes:` (`query`, `column`, `sql`, …) and `preview:` fixtures, validated at call site | Yes |
| [[Profile__Milkdown]] | `$nodeSchema` with both `parseMarkdown` and `toMarkdown` | Yes, bidirectional |
| [[Profile__Zettlr]] | 16 Lezer parsers + `shouldHandleNode`/`createWidget` renderers | In the grammar |
| [[Profile__SilverBullet]] | `space-lua` pages under `Library/`, skills as pages tagged `meta/skill` | Convention |

The direction is clear: **an extension declares its schema, and the host
validates usage before rendering.** That's what makes extensions safe for an
agent to write and to call.

## 7 · Notebook format design has converged

Across Livebook, Pluto, Deepnote, Notebook Kit, mystmd and Evidence:

- **Outputs stay out of the source.** Livebook defaults `persist_outputs` to
  false; Deepnote moves outputs to sidecar snapshot files; Notebook Kit freezes
  query results into a hash-keyed cache; Pluto stores none.
- **Cell identity belongs in the text.** Pluto writes a UUID per cell and is
  forgiving on load; Notebook Kit's optional `id` exists "for editing";
  Deepnote has block ids plus `contentHash`. **Livebook's gap (random ids per
  load) is the cautionary case.**
- **Run order is derived from names, not position.** Pluto writes the file in
  topological order so it runs as a script; Notebook Kit compiles each cell to
  a function of its free references; Deepnote treats Jinja references inside SQL
  as dependency edges.
- **Snapshots are hashed.** mystmd caches execution on an MD5 of kernel +
  code + env; Notebook Kit keys on name and query hash; Deepnote's
  `snapshotHash` excludes timestamps and outputs. Deepnote states outright that
  this is *not* data provenance.
- **SQL in prose:** Evidence's named fences compose with `{{name}}` and
  address `.sql` files by path. Evidence's rewrite also *dropped* in-browser
  DuckDB for live warehouse queries, and its vendor names the trade-off.

## 8 · Skills are becoming documents, and agents are living inside them

- SiYuan runs an agent inside its kernel, with skills as `SKILL.md` files.
- SilverBullet's skills are pages; Outline serves `SKILL.md` playbooks over MCP;
  Evidence ships `agent/skills/*/SKILL.md`; Logseq's CLI installs its own skill.
- Logseq's AgentBridge turns tasks into an agent job queue (assignee + session
  id written back on the block); Deepnote has an `agent` block type with a
  per-block model.
- Trilium's chat drives the user's *own* subscription agents (Claude Code with
  its file and shell tools disabled, Trilium's MCP as its only tools; Copilot,
  Codex and others over the Agent Client Protocol).

## 9 · What nobody does

These are claims about the 23 profiles, not the whole market:

1. **One source, many audiences.** The nearest things are Notesnook's
   monographs (password or self-destruct per published note), Trilium's
   `excludeFromLlm` (one binary "hide from agents" flag), and SilverBullet's
   baked sections. None carries per-block clearance through to a verified
   audience-specific publish.
2. **Encryption is not clearance.** Joplin's end-to-end encryption leaves
   `id`, `parent_id`, `share_id` and timestamps in plaintext on the sync
   target. Structure leaks even when content doesn't.
3. **Data provenance in the document.** Deepnote hashes code and environment
   but disclaims data provenance. Notebook Kit snapshots results but not their
   origin. Nobody ships "where did this number come from" inside the file.
4. **The full rail set.** Every entry has some of §3's rails; none has all of
   them.
5. **File-truth plus typed agent operations plus live collaboration.**
   SilverBullet (file + merge + MCP) and Baalda (file-as-port + CRDT + MCP) come
   closest. Both lack typed block operations.

## Open questions this raises

- Is the move away from files inevitable for anything with backlinks and
  queries, or did Logseq move for reasons particular to Logseq? The profile
  points at a 2026-01-22 commit set but not at a rationale document.
- Baalda's README calls the file "the durable source of truth" while its code
  lets the CRDT overwrite the file. Which one do its users experience?
- Does any entry's refusal layer (§4) generalize into a spec others could
  adopt?

---
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/index.md"
---

# Profiles

* [AFFiNE — Profile](Profile__AFFiNE.md) - The CRDT block tree is the truth and Markdown is a guest — but a well-mannered one: when the file and the doc disagree in a way a three-way merge can't express, AFFiNE writes a review candidate instead of guessing.
* [Anytype — Profile](Profile__Anytype.md) - No files at all, and the most deliberate agent door of the four: a localhost JSON API with per-space, read-or-write grants that the human approves, and a one-click MCP config pointing at it.
* [AppFlowy — Profile](Profile__AppFlowy.md) - The purest CRDT-as-truth entry in the study: every page, database and folder is a yrs document in an embedded RocksDB, reachable only through a Flutter FFI — and Markdown exists solely as an export menu item.
* [Baalda — Profile](Profile__Baalda.md) - The plain-file-plus-CRDT promise is kept, but by making the file a port rather than the truth: every disk edit is diffed into a Yjs Y.Text, and the CRDT decides what the file says next.
* [Deepnote — Profile](Profile__Deepnote.md) - A commercial notebook that open-sourced its file format as YAML blocks with content hashes, moved outputs into sidecar snapshot files, and shipped an MCP server and agent-only blocks before shipping a local UI.
* [Docmost — Profile](Profile__Docmost.md) - Markdown goes in and out of Docmost only by way of HTML, and the doors an agent would use — API keys and MCP — are the parts you have to license.
* [Evidence — Profile](Profile__Evidence.md) - Named SQL fences plus Markdoc tags that write their own SQL. The pinned repo is a rewrite that abandoned in-browser DuckDB for live warehouse queries, which is the exact trade flave's parked `sql` fences have not yet made.
* [Joplin — Profile](Profile__Joplin.md) - End-to-end encryption that guards the wire and the server but not the laptop, which is exactly why an agent on that laptop can be handed a well-designed MCP surface over plaintext Markdown notes.
* [Khoj — Profile](Profile__Khoj.md) - Not an authoring tool but a reader of yours: Khoj gets agent reach by copying your notes into its own Postgres, and it writes back only through an editor plugin that shows SEARCH/REPLACE diffs and waits for you to click Apply.
* [Livebook — Profile](Profile__Livebook.md) - The notebook whose file is just Markdown with HTML comments for the leftovers, and the only entry that documents a Claude Code hook for pushing an agent's file edit into the live session.
* [Logseq — Profile](Profile__Logseq.md) - The archetypal Markdown outliner has quietly stopped being a Markdown app: on master the graph lives in SQLite, and Markdown is now an import format and a one-way mirror.
* [MarkText — Profile](Profile__MarkText.md) - The purest "the file is the document" entry in the study — one .md file, no sidecars, no project — paid for by re-serializing your Markdown from a block tree every time you save.
* [Milkdown — Profile](Profile__Milkdown.md) - The cleanest answer in the study to "how does a rich editor round-trip Markdown": every node declares how it reads and writes an mdast node, remark does the text, and anything the schema cannot name is an error rather than silent loss.
* [mystmd — Profile](Profile__mystmd.md) - The entry that already built what LFM keeps promising itself: directives with a typed schema, a published AST, numbered cross-references and real citations, all from plain Markdown an agent can write without a single API call.
* [Notebook Kit — Profile](Profile__Notebook-Kit.md) - A notebook that is one HTML file of `<script>` tags, where every SQL query and Python cell is run once, frozen into a cache file, and shipped as a snapshot. It is the cleanest answer in the study to "data the reader can see without database access".
* [Notesnook — Profile](Profile__Notesnook.md) - The entry that encrypts even the database on your own disk, so the only way an agent can take part is to drop sealed notes into a write-only, PGP-keyed mailbox it can never read back.
* [Outline — Profile](Profile__Outline.md) - The wiki that admits its Markdown is lossy, then builds the best agent write path in the study on top of that admission: patch by quoting the Markdown, land the change as a ProseMirror splice and a Yjs update.
* [Pluto — Profile](Profile__Pluto.md) - A notebook saved as a Julia script in dependency order, so `julia notebook.jl` just runs, with the display order and the whole package lockfile tucked into comments and string literals at the bottom.
* [SilverBullet — Profile](Profile__SilverBullet.md) - The one entry in this group that treats coding agents editing the files as a first-class collaborator: plain Markdown stays the source of truth, and concurrency is solved with three-way merge rather than a CRDT.
* [SiYuan — Profile](Profile__SiYuan.md) - Every document is a file, but the file is a serialized editor AST rather than Markdown — and the kernel has grown a full agent runtime, an MCP server with per-action read/write declarations, and a written spec telling agents when not to touch the files.
* [Trilium — Profile](Profile__Trilium.md) - Honest about being a database: no files to edit, but a typed REST API, an MCP server whose tools convert HTML notes to Markdown at the agent boundary, and a single label that makes any subtree invisible to the LLM.
* [VNote — Profile](Profile__VNote.md) - The only editor in this group that built a door for agents: a loopback HTTP API with scoped bearer tokens, If-Match preconditions, and a hard refusal to overwrite a human's unsaved buffer.
* [Zettlr — Profile](Profile__Zettlr.md) - flave's closest living sibling: a CodeMirror 6 editor in which Pandoc citations, wikilinks and callouts are real Lezer syntax nodes, rendered in place until the cursor touches them.

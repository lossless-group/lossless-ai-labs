---
name: Baalda Profile
title: Baalda — Profile
slug: baalda
upstream: https://github.com/naveedharri/baalda
pinned_sha: 90929b5a
pinned_date: 2026-11-04
version_at_pin: "staging (moving tag; nearest version tag v0.1.112)"
license: Apache-2.0 (everything outside ee/; ee/ is under the source-available Baalda Enterprise License)
maintainer: Naveed Harri (naveedharri)
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/baalda
profile_kind: Tauri v2 desktop notes app + Node/Hocuspocus/Postgres sync server, with a file↔Yjs bridge
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
site_uuid: 9af384bf-e982-417d-b91a-e9a8337eeeef
hex_code: neupx8
lede: >-
  The plain-file-plus-CRDT promise is kept, but by making the file a port rather
  than the truth: every disk edit is diffed into a Yjs Y.Text, and the CRDT
  decides what the file says next.
summary: >-
  Profile of Baalda as pinned in the content-authoring-tools study. It is the
  study's direct attack on the CRDT-vs-plain-files tension. Covers the one
  Y.Doc-per-note, one Y.Text-of-raw-markdown model; the NoteBridge that diffs
  disk changes into the CRDT with diff-match-patch and writes the CRDT back out
  with origin tags and a hash echo guard; the long list of refusals (0-byte
  files, mass deletes, stale writes) that make outside writers safe; the MCP
  endpoint whose writes take the same path as a teammate's keystrokes; and what
  all of this means for flave's v3 CRDT deferral.
tags:
  - Profile
  - Baalda
  - CRDT
  - Yjs
  - Local-First
  - Markdown
  - MCP
  - Collaboration
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Baalda.md"
---
# Baalda — Profile

A profile of Baalda as it lives in this study (`studies/content-authoring-tools/baalda`, pinned at `90929b5a`, 2026-11-04, nearest version tag `v0.1.112`). Apache-2.0 outside `ee/`; Tauri v2 (Rust) desktop app with a React + CodeMirror 6 UI, plus a Node server running Hocuspocus over Postgres.

It is here because its README names the exact tension this study is about: *"AI-editable notes need loose Markdown on disk as the source of truth. Real-time collaboration is built on CRDTs, whose state is an opaque binary blob. No tool combined them."* The question for this profile is how it actually reconciles the two.

## TL;DR

Each note is one `Y.Doc` holding one `Y.Text` of **raw Markdown** (`docs/specs/03-sync-engine.md:23`, `:35`). A watcher diffs any change to the `.md` file into that `Y.Text` as insert/delete operations; any CRDT change (local typing or a remote peer) is written back to the file atomically. Two guards stop the loop: transaction **origin tags** and a **`lastWrittenHash`** that makes the watcher ignore the bytes it just wrote (`spec 03 §5`, `:72-110`).

**One sentence:** *Baalda keeps the file plain by keeping the CRDT dumb — a Markdown string, not a block tree — and then spends most of its engineering on the dozen ways a filesystem lies about what changed.*

## How it works

| Layer | Choice (from `README.md:114-125`) |
|---|---|
| Desktop shell | Tauri v2, Rust core; the UI never touches disk |
| Editor | CodeMirror 6 — "the buffer *is* the Markdown" |
| Local index | SQLite FTS5 + backlinks + tags, fully derived and rebuildable |
| Sync | Yjs + Hocuspocus over WebSocket |
| Server store | Postgres holding Yjs updates and snapshots only |
| Auth | Better Auth organizations = vaults, per-folder ACLs |
| AI | MCP endpoint at `/api/mcp`, gated by the same ACL as people |

The bridge itself is `app/apps/desktop/src/lib/bridge/noteBridge.ts` (1,414 lines) and `diff.ts`. It is written as a pure module with all I/O injected, so it runs under vitest with an in-memory fake (`noteBridge.ts:6-7`).

- **Disk → CRDT.** On a debounced (150 ms) watcher event, hash the file; drop it if it matches `lastWrittenHash`; otherwise `diff_match_patch` the CRDT's *current* text against the file and replay the diff as `Y.Text` insert/delete ops inside a `'disk'`-origin transaction (`diff.ts:35-50`, `types.ts:207-214`).
- **CRDT → disk.** On any non-`'disk'` change, debounce 300 ms, set `lastWrittenHash` **before** writing, then atomic temp-file + rename and reindex. The watcher sees its own write, hashes, matches, and drops it (`spec 03:103-106`).

## What's on disk

A vault is an ordinary folder of `.md` files (plus `.markdown`, `.mdx`, `.txt`, `.html`, `.canvas` treated as text notes) with two app-owned extras (`.claude/skills/baalda-guide/references/file-formats.md`):

```
my-vault/
├── Projects/roadmap.md          ← plain Markdown, frontmatter rides in the same Y.Text
├── attachments/<content-hash>.png   ← the only binaries that sync
└── .context/                    ← app state: index.sqlite, the CRDT store, config.json, local trash
```

`.context/` is off-limits to outside writers; it is excluded from the tree walk, watcher, and index (`spec 03:159-162`). Everything there is described as a rebuildable layer over the files.

## Agent reach

**Read and write, two ways — and both converge in the same CRDT.**

- **Files.** A local agent (Claude Code, Codex) edits the `.md` directly. All four verbs are supported while the app is open: create registers a note, edit diff-merges, delete propagates after a 2.5 s grace window, rename/move keeps the `doc_id` (`spec 03:124-140`).
- **MCP.** `POST /mcp` (`app/apps/server/src/http/routes/mcp.ts:162`) exposes ~25 tools: `read_note`, `search_notes`, `create_note`, `update_note`, `append_note`, `edit_note`, `move_note`, `move_folder`, access-management tools, and skill tools (`app/apps/server/src/mcp/tools.ts:245-782`). `edit_note` takes exact-anchor `replace` / `insert_before` / `insert_after` / `delete` operations, refuses ambiguous anchors, and accepts an `expectedRevision` for optimistic concurrency (`tools.ts:546-585`).
- **The MCP write path is the human write path.** If a client has the note open, the server mutates the live Hocuspocus document, so the AI edit broadcasts to every editor and egests to their disks; otherwise it hydrates a detached `Y.Doc`, applies, and persists one incremental update (`app/apps/server/src/mcp/doc-writer.ts:25-38`).
- **Local agent runner.** The Rust side can spawn a user-selected installed CLI agent (`Claude` or `Codex`) with no shell and no persisted logs (`app/apps/desktop/src-tauri/src/agent_runner.rs:2`, `:25-28`).
- **Team skills.** A vault holds a versioned catalog of `SKILL.md` folders that every member's desktop installs into `~/.claude/skills/` and `~/.agents/skills/`; MCP exposes `list_skills` / `get_skill` / `read_skill_file` (`docs/SKILLS.md:12-29`).

## What's clever or unique

**1. The CRDT is a string, so the bridge is a diff.** Choosing `Y.Text`-of-raw-Markdown over a structural `Y.XmlFragment` (`spec 03:23`) is the whole trick. Serialization is `yText.toString()`; there is no Markdown↔block-tree round-trip to lose fidelity in. Compare [[Profile__AFFiNE]], which has to project a BlockSuite block tree to Markdown and back and therefore cannot always write the file.

**2. The file is a port, not the truth — and the code admits it.** The README says the `.md` is "the durable source of truth" (`README.md:93`), but the bridge keeps a persisted `diskBase` hash precisely because *"a doc that differs from it is AHEAD of the file"* (`noteBridge.ts:42-52`). When the file matches what was last synced and the doc has moved on, the file is treated as stale and overwritten, not diffed in (`noteBridge.ts:789-797`). Read honestly: the CRDT arbitrates; the file is a durable, editable projection that wins only when someone actually changed it.

**3. Refusals as a design surface.** The most instructive part of the spec is what the bridge will *not* believe:
- a 0-byte or body-blank file never clears a non-empty note (`spec 03:146-149`, `noteBridge.ts:817-845`);
- more than a fifth of the vault vanishing at once is held and the user is asked (`spec 03:150-154`);
- a folder move is recognized as one move when ≥80% of notes reappear byte-identical under a new path (`spec 03:182-188`);
- a read-only user's local edit is saved aside and the doc's text written back over it (`noteBridge.ts:848-866`);
- a file over 10 MB is not ingested (`types.ts:214`).

**4. Whole-file rewrites get a recovery snapshot first.** When a disk diff churns more than 60% of the text (`types.ts:213`, `diff.ts:21`), the bridge snapshots the pre-diff CRDT state before applying — the expected shape of an AI rewriting a note (`noteBridge.ts:907-931`). The spec is candid that a giant one-shot diff merges badly against concurrent edits (`spec 03:112-115`).

**5. Pull-before-seed ordering.** On sign-in it pulls server state first, then seeds orphan docs from disk; reversed, stale disk content seeds a doc under a fresh client id and the device diverges permanently (`spec 03:117-120`). `withoutPullInsertions` (`diff.ts:68`) strips text the pull already delivered so a peer's insertions aren't typed twice under this device's id.

**6. Prior art is cited, not hidden.** The spec credits YAOS's "content-acknowledged suppression", memrynote's origin parameter, and Obsidian Relay's y-sweet fork (`spec 03:103-105`, `:225-238`).

## Costs / limits

- **Structure changes need the app open.** Renames/moves/deletes made while Baalda is closed are not reconciled as structure: old paths come back and new paths register as new notes (`spec 03:195-199`). Content edits are fine any time.
- **Semantic merge is not guaranteed.** Two interleaved edits can merge into locally-invalid Markdown; the accepted MVP answer is "CRDT merge plus snapshots for recovery" (`spec 03:108-110`).
- **Server required for collaboration.** Self-hostable (Node + Postgres, Compose, Railway), but multiplayer means running Hocuspocus and Postgres.
- **"Never travels in plain text" is narrower than it reads.** Yjs updates carry the text. Vault keys seal the Postgres columns at rest, off by default, and the docs say plainly *"This is not end-to-end encryption"* (`docs/VAULT_KEYS.md:8-12`).
- **Open core.** `ee/` is source-available and requires a paid subscription for production use (`ee/README.md`); currently it holds only the license and README.
- **Code files are ignored on purpose** (`file-formats.md`), so it is a notes app, not a workspace-over-a-repo.

## Relevance to flave

- **It weakens the stated reason for flave's v3 deferral — for prose.** flave §8.4 defers CRDT because *"CRDT over a three-layer document (prose + layout JSON + tokens) … is a multi-quarter project."* Baalda shows the prose layer alone is tractable if the CRDT holds the raw LFM string and a bridge diffs the file in. One `Y.Text` per `.md` file, keyed by a stable id, is a bounded project, not a format rewrite. The layout-JSON and token layers remain the hard part, and Baalda does not touch them. See also [[Profile__Automerge]].
- **Borrow the bridge's guard set, even without CRDT.** flave's planned file watching (README "Next") and agent writes will face the same lies: editors that save by unlink+rewrite, `git checkout`, 0-byte placeholders, the app's own echo. Origin tags, a hash echo guard, a persisted `diskBase`, and the 0-byte/mass-delete refusals are worth having in v0.
- **Borrow `edit_note`'s contract for the agent operation set.** Exact-anchor edits that refuse on ambiguity, plus `expectedRevision`, are a close match for flave's "one operation set with four callers" and its §9.1 `propose` contract.
- **Note the stable-id lesson.** Baalda keys everything on `doc_id` so a rename never forks a doc (`spec 03:121-122`); this is the same reason flave §8.1 freezes block ids at M0.
- **Avoid the per-device-projection trap if flave stays file-first.** Baalda's file is re-derived per device from the CRDT; a `.flave` bundle sent by email has no CRDT behind it. If flave adds this later, the bundle must still be complete without `.context/`-style state.

## Read next

- `docs/specs/03-sync-engine.md:72-200` — the bridge algorithm and every outside-writer rule
- `app/apps/desktop/src/lib/bridge/noteBridge.ts:25-60`, `:760-930` — ingest guards in code
- `app/apps/desktop/src/lib/bridge/diff.ts` — the 97-line diff-to-ops core
- `app/apps/server/src/mcp/doc-writer.ts:25-38` and `tools.ts:546` — MCP writes as CRDT ops

## Related

- [[Profile__AFFiNE]] — the opposite bet: block-tree CRDT as truth, Markdown folder as an experimental export with review candidates
- [[Profile__AppFlowy]] — yrs-based collab objects in RocksDB; no file projection at all
- [[Profile__Anytype]] — object graph behind a local gRPC/JSON API and MCP
- [[Profile__SilverBullet]], [[Profile__Logseq]] — plain-files-first without CRDT
- [[Profile__Automerge]] — the sibling study's analysis of flave's CRDT deferral

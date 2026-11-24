---
name: Automerge Profile
title: Automerge — Profile
slug: automerge
upstream: https://github.com/automerge/automerge
pinned_sha: 09b19d508
pinned_date: 2026-11-13
version_at_pin: "js/automerge-3.5.0 (nearest tag)"
license: MIT
maintainer: Ink & Switch / automerge org — Alex Good, Orion Henry, et al.
study: studies/sync-and-content-version-control
profile_path: studies/sync-and-content-version-control/automerge
profile_kind: CRDT library — Rust core with WASM/JS and C bindings
date_created: 2026-08-22
date_modified: 2026-11-23
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-11-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.0.1
status: Reference
site_uuid: e003c56b-82d8-4d22-91a9-3b1935048310
hex_code: qwg9e1
lede: >-
  The only entry where two people editing the same paragraph is a solved case
  rather than a second file with a longer name — and it costs you the filesystem.
summary: >-
  Profile of Automerge as pinned in the sync-and-content-version-control study.
  It is the history-lives-in-the-document entry and the one that frames the
  deferred multiplayer tier so the deferral is a decision rather than an
  omission. Covers the CRDT data model (Map/List/Text plus Bytes scalars), the
  change DAG whose entries carry an optional message and actor id, the sync
  protocol's Bloom-filter have/need handshake and SYNC_RESET for read-only
  promotion, and the two structural costs — a document is not a directory, and
  there is no API anywhere for forgetting history.
tags:
  - Profile
  - Automerge
  - CRDT
  - Local-First
  - Collaboration
publish: true
type: Profiles
from: "studies/sync-and-content-version-control"
from_path: "context-v/profiles/Profile__Automerge.md"
---
# Automerge — Profile

A profile of Automerge as it lives in this study (`studies/sync-and-content-version-control/automerge`, originally pinned at `47908d6c`, nearest tag `js/automerge-3.4.1`, 2026-08-17; now pinned at `09b19d50`, past `js/automerge-3.5.0`, 2026-11-13). MIT, Rust core with WASM/JS and C bindings, from Ink & Switch.

This is the study's **history-lives-in-the-document** entry. It is here to make a deferral into a decision: `flave-ai`'s spec §8.4 stages collaboration as v1 async file exchange → v2 structured review → **v3 real-time CRDT multiplayer (Yjs / Automerge)**, deferred with the reason *"CRDT over a three-layer document (prose + layout JSON + tokens) with a sandboxed script tier is a multi-quarter project on its own."* This profile checks whether that reason holds and what exactly is being postponed.

## TL;DR

Automerge is a library, not a system. The README states the ambition plainly:

> Automerge is a library which provides fast implementations of several different CRDTs, a compact compression format for these CRDTs, and a sync protocol for efficiently transmitting those changes over the network… **Automerge aims to be PostgreSQL for your local-first app.**

A document is a tree of `Map`, `List`, and `Text` objects (`rust/automerge/src/types.rs:172-182`) holding scalars: `Bytes`, `Str`, `Int`, `Uint`, `F64`, `Counter`, `Timestamp`, `Boolean`, `Null` (`src/value.rs:519-534`, which also carries an `Unknown` variant for scalar types from future versions). Concurrent edits merge deterministically without a server and without conflict files.

**One sentence:** *Automerge is the only entry in this study where two people editing the same paragraph has a defined answer, and the price is that a document is a data structure rather than a directory of files.*

## What it has that nothing else here does

**Real merge.** Every other entry — [[Profile__Seafile]] with `(SFConflict …)`, [[Profile__Syncthing]] with `.sync-conflict-…` — resolves conflicts by renaming and keeping both, which hands a non-technical person two files and no guidance. [[Profile__Jujutsu]] does better by making conflicts first-class recorded values, but someone still resolves them. Automerge merges character-level `Text` edits with no user in the loop at all.

For the client-tinkering scenario that opened this study — *"they will want to tinker… I will want to automatically have the latest that they have"* — this is the only entry that answers the symmetric-multi-writer case rather than routing around it.

**Changes are labelled commits.** `CommitOptions` (`rust/automerge/src/transaction/commit.rs:3-8`):

```rust
pub struct CommitOptions {
    /// A message which describes the commit
    pub message: Option<String>,
    /// The unix timestamp (in seconds) of the commit (purely advisory, not used in conflict resolution)
    pub time: Option<i64>,
}
```

and a `Change` exposes `message()`, `actor_id()`, `timestamp()`, `deps()`, `hash()`, `seq()`, and since 0.12.0 / JS 3.5.0 an optional `author()` (`src/change.rs:48-99`). So the history is a hash-linked DAG of authored, timestamped, **optionally captioned** changes — the same legibility material as Kopia's `Description` and Seafile's `Commit.Desc`, at a much finer grain.

**`diff` between two points.** `Automerge::diff(&self, before_heads, after_heads) -> Vec<Patch>` (`src/automerge.rs:1830`) returns structured patches, not a text diff. Alongside `fork_at(heads)` (`:1029`), `get_heads` (`:1930`), and `get_changes` (`:1936`), that is a complete read-side for a progress feed: *what changed between what the client last saw and now*, as data rather than as a rendered diff. **This is the best raw material in the study for the make-progress-visible goal** — and also the least usable, because it describes changes to a data structure rather than to a document a person recognizes.

## The sync protocol

`rust/automerge/src/sync.rs` plus `sync/bloom.rs`, `sync/state.rs`, `sync/message_builder.rs`. A `Message` is (`sync.rs:529-547`, doc comments trimmed):

```rust
pub struct Message {
    pub heads: Vec<ChangeHash>,       // the heads of the sender
    pub need: Vec<ChangeHash>,        // changes explicitly requested from the recipient
    pub have: Vec<Have>,              // a summary of what the sender already has
    pub changes: ChunkList,           // changes for the recipient to apply (wraps Vec<Vec<u8>>)
    pub flags: Option<MessageFlags>,  // capability advertisements and transient signals
    pub version: MessageVersion,      // which wire version to encode as
}
```

`have` is Bloom-filter-summarized, so peers converge without enumerating full history each round. It is transport-agnostic — bytes in, bytes out — so it runs over WebSocket, WebRTC, a relay, or a file.

One flag is worth noting for the asymmetry question (`sync.rs:750-752`):

> **`SYNC_RESET`** — *"Signals the remote peer should clear its `sent_hashes` and perform a fresh sync. Used when switching from read-only to read-write mode."*

So read-only participation is a recognized mode with a defined promotion path, not something bolted on. It is a *protocol* affordance, though — nothing enforces it the way Seafile's server-side permission or Kopia's `readonly` storage wrapper does.

## The two structural costs

### 1. A document is not a directory

`ObjType` is `Map | Table | List | Text`. There are no paths, no directories, no file metadata. You can model a `.flave` bundle as a `Map` keyed by relative path — `Text` for markdown (character-level merge), `Bytes` scalars for binaries, nested `Map`s for layout JSON — and that is a genuinely good fit for flave's three-layer model. **But it is a modelling exercise, and once done, the bytes on disk are an Automerge document, not files.**

Every tool the tree relies on — `rg`, Obsidian, `rclone`, the augment-it scripts, Chroma ingest, any agent that reads a directory — stops working against it without an export step. That is the same wall [[Profile__Restic]] and [[Profile__Kopia]] hit, and it is *worse* here: their bucket at least holds one blob per content, while an Automerge document is a single opaque compressed artifact.

For a 517-file, 156MB corpus with PDFs, this is disqualifying. For a single `.flave` bundle it is arguable — flave already treats the bundle as a unit and ships it as a zip.

### 2. There is no forgetting

`save()` and `save_nocompress()` (`src/automerge.rs:1530`, `:1542`) produce a compressed document, and the compression is real — Automerge 3 claims roughly a 10x memory reduction. But **grepping the public API for a truncate, compact, or garbage-collect operation returns nothing.** Full history is retained by construction; that is what makes the merge guarantees work.

Set against this study's checklist that is a hard difference. [[Profile__Restic]] has `ExpirePolicy`, [[Profile__Kopia]] has a per-directory retention policy with pins, [[Profile__Syncthing]] has a thinning curve, [[Profile__Seafile]] has per-library `keep_days`. Automerge has none, and cannot easily. For a document edited by an agent on an autosave loop for a year, "history grows forever and every replica carries all of it" is a real operating cost, not a footnote.

### And the thing that is not in this repo

`automerge` is the CRDT and the sync protocol. **Storage adapters and network adapters live in [`automerge-repo`](https://github.com/automerge/automerge-repo)** — a separate project. Nothing here writes to S3, watches a filesystem, or manages peers. Adopting Automerge means adopting at least two projects and writing the glue between them and the filesystem the rest of the tree assumes.

## How it scores against the study checklist

| Checklist item | Automerge |
|---|---|
| **Unit of sync** | The **document** — one CRDT object graph. Not a directory; nesting is your data model |
| **Where history lives** | **In the document.** A hash-linked DAG of authored changes, inseparable from the content |
| **Content addressing** | Changes are hash-identified (`ChangeHash`); content itself is not addressed or deduped |
| **Blob-storage story** | Not in this repo. `automerge-repo` carries storage adapters |
| **Conflict semantics** | **Best in the study, by a distance.** Deterministic merge, no conflict files, character-level for `Text` |
| **Asymmetry** | Protocol-level only — `SYNC_RESET` acknowledges read-only mode; nothing enforces it. Unreleased `mask_author` adds a read-side view that hides an author's changes |
| **Hand-recoverability** | **Worst in the study.** One opaque compressed artifact; needs the library and an export step |
| **Labels / legibility** | Per-change `message` + `actor_id` + `timestamp`, a stable `author` since 0.12.0 / JS 3.5.0, plus structured `diff(before, after)` → `Vec<Patch>` |
| **Operational cost** | A library, not a service — but you also need `automerge-repo` and glue to reach files |

## What this settles for the Lossless decision

**flave §8.4's deferral is correct, and the stated reason is the right one.** Nothing here contradicts *"a multi-quarter project on its own."* What the pinned source adds is that the cost is not mainly the CRDT — it is that adopting Automerge means the document stops being files, and the format's whole value proposition (§2.2, *"you get the internals"*; §5.1, *"the directory is the working format"*) is that it **is** files.

Three things worth carrying forward now, none of which require adopting anything:

1. **Preserve the block-addressing scheme.** §8.4 already says the `.flave/review/` location and §8.1 block ids must be reserved and stable from M0. That instruction is even more load-bearing than it reads: stable ids are what a future CRDT layer would key on, and *"retrofitting stable block ids after people have real documents is the kind of migration that poisons a format"* is precisely right.
2. **`diff(before_heads, after_heads) -> Vec<Patch>` is the shape to imitate**, not the implementation to adopt. A progress feed wants *structured* change data — "this section was rewritten, this figure was added" — and every other entry in this study can only offer file-level counts. Whatever renders progress should be designed to consume patches, so a later engine change does not break the surface.
3. **Character-level merge is the only real answer to symmetric multi-writer.** If the design ends up needing two people editing the same document simultaneously, no amount of work on the transport or store layers produces it. That is the trigger condition for reopening this entry — and until it fires, structural asymmetry ([[Profile__Syncthing]]'s receive-only, [[Profile__Kopia]]'s readonly wrapper, [[Profile__Seafile]]'s server permissions) is the cheaper correct answer.

## Changes since the previous pin (2026-08-18 → 2026-11-13)

Pin moved from `47908d6c04a0` to `09b19d5080a8`: 96 commits on `main`. Releases in range: **`js/automerge-3.5.0`** and **`rust/automerge-0.12.0`** (`javascript/CHANGELOG.md`, which is new in range, and `rust/CHANGELOG.md`). The study pin sits past both, on unreleased work. Every path cited above still exists; the line numbers have been corrected to the new pin, and the `Message` struct above now matches the source (it already had `flags` and `version` at the old pin).

The two structural costs stand. There is still no truncate, compact, or garbage-collect operation in `rust/automerge/src/`, and a document is still a CRDT object graph rather than a directory. Two additions bear directly on this profile's checklist rows for legibility and asymmetry:

- **Authors, separate from actors (released).** Rust 0.12.0 and JS 3.5.0 add an `Author` type: opaque bytes that identify a person independently of the per-session actor id. `Automerge` and `AutoCommit` gain `set_author`, `get_author`, `get_authors`, `get_actors_for_author`, and `get_author_for_actor` (`rust/automerge/src/automerge.rs:536`, `:702`); the assignment is stored in the extra bytes of an actor's first change and survives merge and save/load; `Change::author()` reads it (`src/change.rs:48`). For a progress feed this closes a real gap: "who changed this" no longer depends on mapping random actor ids to people by hand. Breaking for Rust callers: `ChangeMetadata` and `ExpandedChange` gained an `author` field, and `AutomergeError` gained `DuplicateAuthor`.
- **Write frontiers and author masking (unreleased, on `main` after 3.5.0).** `mask_author(author, from_heads, log)` and `reveal_author` (`rust/automerge/src/automerge.rs:565`, `:582`), plus `set_write_frontier` (`:499`), hide an author's changes after a given set of heads. Per the doc comment, masked changes *"are still recorded and synced but hidden"*, and sequence positions refer to the visible document. Exposed to JS and WASM via `AutoCommit` (commit `7d6f95bb3`). This is the first read-side asymmetry primitive in the library: a reviewer can keep a contributor's edits out of the visible document until they choose to reveal them. It is a view, not an enforcement boundary and not deletion; the masked changes still travel to every replica, which leaves the "no forgetting" cost above unchanged. Most of the 96 commits are this work plus its tests (`rust/automerge/tests/write_frontier*.rs`).

Smaller items: rich-text patches now carry marks and embedded blocks when a text object is exposed, which fixes `diff` output that restores deleted rich text; `get_marks` is much faster (vendor-reported, 9ms to 1.6µs on 100,000 characters); a performance regression in large transactions is fixed; `Value::to_*` accessors are deprecated in favor of `as_*`; the `optree-visualisation` feature is removed. Experimental fragment APIs (`rust/automerge/tests/fragments.rs`) saw fixes but remain experimental.

## Read next

- `rust/automerge/src/sync.rs:529-547` — the whole sync message in one struct; note `have` is Bloom-summarized
- `rust/automerge/src/transaction/commit.rs:3-20` and `src/change.rs:48-99` — history as authored, captioned changes
- `rust/automerge/src/automerge.rs:1830`, `:1029`, `:1930-1960` — `diff`, `fork_at`, heads and changes: the read-side of a progress feed
- `rust/automerge/src/types.rs:172-182` and `src/value.rs:519-534` — the whole data model, and what modelling a directory in it would take
- [`automerge-repo`](https://github.com/automerge/automerge-repo) — not pinned here; where storage and network adapters actually live

## Related

- [[Profile__Jujutsu]] — the other history-in-the-artifact answer, reached from the VCS side, keeping files as files
- [[Profile__Kopia]] — the labelled-version idea at snapshot grain instead of keystroke grain, with retention Automerge lacks
- [[Profile__Syncthing]] — the structural asymmetry that is the cheap alternative to needing merge at all
- `ai-labs/flave-ai/context-v/specs/Master-Flave-An-Agent-Native-Document-Format-and-Publisher.md` §8.4 — the v3 deferral this profile tests

---
name: Jujutsu Profile
slug: jujutsu
upstream: https://github.com/jj-vcs/jj
pinned_sha: 9d905d5432869c7aa9539e6e5c7fece5842bed37
pinned_date: 2026-08-21
version_at_pin: 0.44.0
license: Apache-2.0
maintainer: jj-vcs org — originated at Google (Martin von Zweigbergk), now community-governed (GOVERNANCE.md)
study: studies/sync-and-content-version-control
profile_path: studies/sync-and-content-version-control/jj
profile_kind: Version control system (Rust library + CLI)
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.0.2
status: Draft
site_uuid: db950edb-0c90-4a69-a977-59f93ee0d3fe
hex_code: nyrny9
lede: >-
  The storage layer is five pluggable backends, not one — and only two of the
  five have a shipped implementation you could put in a bucket.
summary: >-
  Profile of Jujutsu as pinned in the sync-and-content-version-control study.
  Establishes the study's "history in the VCS" data point and settles the
  feasibility question flave's spec 8.2 depends on. Covers the Backend trait
  and why it is explicitly cloud-shaped, the five separate store factories a
  real remote backend would have to implement (not one), SimpleBackend as an
  acknowledged proof of concept, and the finding that most affects the Lossless
  decision: a colocated repo's git half is interchangeable but the operation
  log and change IDs live in .jj/ outside git, so syncing only the git half
  loses exactly the undo capability jj was chosen for.
tags:
  - Profile
  - Jujutsu
  - Version-Control
  - Content-Addressed-Storage
  - Sync
  - Flave
publish: true
from: "studies/sync-and-content-version-control"
from_path: "context-v/profiles/Profile__Jujutsu.md"
---
# Jujutsu (`jj`) — Profile

A profile of Jujutsu as it lives in this study (`studies/sync-and-content-version-control/jj`, pinned at `9d905d5` / v0.44.0 / 2026-08-21). Every claim cites a pinned path so you can read the source rather than trust the paraphrase.

This is the study's **history-lives-in-the-VCS** entry, and it is here for one specific reason: `flave-ai/context-v/specs/Master-Flave-An-Agent-Native-Document-Format-and-Publisher.md` §8.2 resolved on 2026-08-14 that **every `.flave` bundle is a `jj` repo**, driven by an agent under the hood. That decision rests on two load-bearing claims — *"git compatibility is retained, not sacrificed"* and *"the operation log with `jj undo` … is the single strongest argument for `jj` here."* This profile tests both against source.

## TL;DR

`jj` is a Git-compatible VCS whose distinguishing move is that **the working copy *is* a commit**, auto-snapshotted on every command — there is no staging area and no "did I forget to commit." On top of that sits an **operation log**: a second, higher-level history of *repository operations*, which is what makes `jj undo` able to reverse "the agent restructured six blocks and moved a chart" as one gesture.

Storage is deliberately abstracted. The architecture doc states the design principle outright (`docs/technical/architecture.md:29-38`):

> One overarching principle in the design is that it should be easy to change where data is stored. The goal was to be able to put storage on local-disk by default **but also be able to move storage to the cloud** at Google (and for anyone).

That principle is real in the trait design and **unimplemented in the shipped code**. Two things follow, and they pull in opposite directions for anyone hoping to marry `jj` to blob storage.

**One sentence:** *Jujutsu is a Git-compatible VCS with an operation-log undo model and a genuinely storage-agnostic five-backend architecture, of which exactly one backend (Git) is production-grade and none targets object storage.*

## Where history lives — and it is five places, not one

The single most useful correction this profile makes to the casual reading: **`jj` does not have "a backend."** `StoreFactories` (`lib/src/repo.rs:434-440`) registers **five independent factory kinds**:

```rust
pub struct StoreFactories {
    backend_factories: HashMap<String, BackendFactory>,              // commits, trees, files
    op_store_factories: HashMap<String, OpStoreFactory>,             // the operation log
    op_heads_store_factories: HashMap<String, OpHeadsStoreFactory>,  // heads of that log
    index_store_factories: HashMap<String, IndexStoreFactory>,       // the commit index
    submodule_store_factories: HashMap<String, SubmoduleStoreFactory>,
}
```

Each is selected by a type file on disk — `.jj/repo/store/type`, `.jj/repo/index/type`, `.jj/repo/op_store/type`, `.jj/repo/op_heads/type` (`docs/technical/architecture.md:41-44`) — and each resolves to a directory under `.jj/repo/` (`lib/src/repo.rs:221-255`). The working copy is a sixth store, at `.jj/working_copy/` (`lib/src/workspace.rs:139`), holding `tree_state` and `checkout` (`lib/src/local_working_copy.rs:1110`, `:2574`).

**Consequence for "put `jj` on R2":** implementing `Backend` gets you commits, trees, and file blobs in the bucket. The operation log — the feature §8.2 calls the strongest argument for `jj` — is `OpStore`, a *different* trait, and would need its own implementation, as would `OpHeadsStore` and `IndexStore`. "Write a jj backend" is four backends.

### The `Backend` trait is explicitly cloud-shaped

Credit where due: this is not a local-only interface retrofitted with async. `pub trait Backend` (`lib/src/backend.rs:728`) is `#[async_trait]` throughout, `read_file` returns a streaming `Pin<Box<dyn AsyncRead + Send>>` rather than a `Vec<u8>` (`lib/src/backend.rs:764-769`), and `concurrency()` documents the remote case in as many words (`lib/src/backend.rs:751-761`):

> An estimate of how many concurrent requests this backend handles well. A local backend like the Git backend … may want to set this to 1. **A cloud-backed backend may want to set it to 100 or so.**

`get_copy_records` returns a `BoxStream` and the doc says why: *"Streaming by design to better support large backends which may have very large single-file histories"* (`lib/src/backend.rs:847-853`). The door is deliberately open. Nobody has walked through it in-tree.

### What actually ships

`default_backend_factories()` (`lib/src/default_backend_factories.rs:31-56`) registers exactly three, one of which is test-only:

| Backend | Status | Storage |
|---|---|---|
| `GitBackend` | Production, feature-gated on `git` | A real Git object database, via [gitoxide](https://github.com/GitoxideLabs/gitoxide) |
| `SimpleBackend` | **"just a proof of concept"** (`docs/technical/architecture.md:92-95`) | One file per object, Blake2b-512 hashes |
| `SecretBackend` | `#[cfg(feature = "testing")]` | Test fixture |

`SimpleBackend` is the closest thing to a content-addressed store you could naively map onto a bucket — `init` creates five flat directories, `commits/`, `trees/`, `files/`, `symlinks/`, `conflicts/`, and writes one file per hash (`lib/src/simple_backend.rs:107-112`, `:137-149`), with 64-byte commit IDs (`:71`). That shape is a near-exact match for `objects/<ab>/<sha256>` in corpora-builder's HISTORY layout. But it is a proof of concept by the maintainers' own label, and it is **not** what a colocated repo uses.

**There is no S3/R2 backend in the open-source tree.** Google's cloud-backed deployment (Piper/CitC-shaped) is the motivating use case named in the architecture doc; it is not code you can read here.

## The finding that matters most for `.flave`

§8.2's compatibility claim is:

> `jj` uses a git-compatible backend and colocates (`jj git init --colocate`), so … any user or CI system that only speaks git sees a normal git repo. **`jj` is our interface to history; git remains the interchange format.**

That is true, and **it is only half the repository.** The `GitBackend` cannot store everything `jj`'s model carries, so it keeps the remainder outside git (`docs/technical/architecture.md:76-86`):

> Commit data that is available in Jujutsu's model but not in Git's model is stored in a `StackedTable` in **`.jj/repo/store/extra/`**. That is currently the **change ID** and the **list of predecessors**. For commits that don't have any data in that table, which is any commit created by `git`, we use an empty list as predecessors, and **the bit-reversed commit ID as change ID**.

Confirmed in code: `store_path.join("extra")` and the `extra_metadata_store: TableStore` field (`lib/src/git_backend.rs:293`, `:179`). Separately, `jj` writes `refs/jj/keep/` refs so Git GC does not collect commits still reachable from the operation log (`lib/src/git_backend.rs:99`).

So a colocated `.flave` bundle has two halves with different portability:

| Half | Lives in | Survives a git-only round-trip? |
|---|---|---|
| Commits, trees, file blobs | `.git/` | **Yes.** This is the real interchange win. |
| Change IDs, predecessors | `.jj/repo/store/extra/` | **No** — regenerated as bit-reversed commit IDs |
| Operation log + heads | `.jj/repo/op_store/`, `op_heads/` | **No** |
| Working-copy state | `.jj/working_copy/tree_state`, `checkout` | **No** |

**Send someone a `.flave` bundle as git, and they receive the content and lose the undo.** §8.2 names *stable change IDs across rewrites* as the thing that lets an agent durably reference *"the change where I restructured the metrics section"* — that ID is in `extra/`, not in git, and a git-only recipient gets a bit-reversed commit hash instead, which is exactly the churn §8.2 says git commit hashes suffer from.

This does not invalidate the decision. It sharpens it: **`jj` is excellent as a local history engine for a single author, and its interchange story is git's, not its own.** Any sync design must carry `.jj/` deliberately or accept that history is local-only.

### Git LFS: no — and the failure is silent

`docs/git-compatibility.md:72` states it in three words:

> **Git LFS: No.** ([#80](https://github.com/jj-vcs/jj/issues/80))

A grep for `lfs` or `smudge` across the whole source returns nothing: **jj does
not run git's clean/smudge filters at all.** In an LFS repo, jj's working-copy
snapshot therefore sees what LFS smudged onto disk — the real file — and stores
*that*, overwriting the pointer.

**Confirmed the expensive way, 2026-08-22.** `jj git init --colocate` in a client
corpus repo whose `.gitattributes` carried `*.pdf filter=lfs`. A single `jj
describe` + `jj new`, touching no files, produced a commit reading `78 updated ·
282.5 MB` with diffstat lines like `Bin 131 -> 729490 bytes`. That signature — a
~130-byte binary becoming megabytes — is an LFS pointer being replaced by its own
content. Reverted; nothing pushed.

Nothing warns you. jj prints "Initialized repo", the commit looks ordinary, and
`git status` is clean before and after because LFS keeps real bytes on disk by
design. Only the diffstat gives it away.

This matters for the study's central question in a specific way: **a corpus is
markdown plus large binaries**, which is precisely why these repos use LFS, and
precisely the shape jj handles worst. jj's own roadmap has "Better support for
large files" as future work (`docs/roadmap.md:78`).

Guardrail: `ai-labs/context-v/reminders/Never-Run-JJ-In-A-Git-LFS-Repo.md`.

### And `.jj/` is the thing you must not blind-sync

The working copy takes a real file lock — `working_copy.lock` via `FileLock::lock` (`lib/src/local_working_copy.rs:2645`, `lib/src/lock/unix.rs:32`) — and `workspace_store` locks with a sibling `.lock` file (`lib/src/workspace_store.rs:112`). The operation log is an append-only DAG whose heads are separate mutable state (`lib/src/op_store.rs:359`, `Operation { view_id, parents, metadata, … }`).

That is a live database with lock files, which is precisely the shape the 2026-07-08 exploration warned about:

> Continuously syncing a live `.git` working tree with any file-sync tool (Dropbox, Nextcloud, Syncthing, Seafile alike) is a well-known way to corrupt a git repository.

`.jj/` is strictly worse than `.git/` for this, because it holds *more* mutable state and because a corrupted op log destroys the undo history rather than just the content (which git still has). **Blind file-sync of a `jj` repo is not a viable transport.** The viable shapes are: push/pull to a git remote (transport is git, not the filesystem), or an app-mediated exchange of bundles.

## Conflict semantics — the genuinely differentiated part

`jj` records conflicts as **first-class values in the tree** rather than as a blocked operation. A merge never hard-fails; the resulting commit *contains* conflicts, which are represented (`lib/src/conflicts.rs`, `lib/src/merge.rs`, `lib/src/conflict_labels.rs`) and resolvable later. §8.4 leans on this correctly — *"the only tolerable behavior for a non-developer receiving a colleague's edits."*

Measured against this study's checklist, that is a real advantage over every file-sync entry, all of which resolve conflicts by **renaming and keeping both** and thereby handing a non-technical person two files and no guidance. It is worth being precise about what it buys, though: `jj` makes the conflict *representable and non-blocking*. It does not make it *understood*. Someone still has to resolve it, and for prose the resolution UI is entirely on the application.

## Operational story

Single static binary, no daemon, no server. Optional Watchman integration for large working copies — and note that Watchman is the **only** non-test fsmonitor (`lib/src/fsmonitor.rs:39-49`), so "watch the filesystem" means "install Watchman," not "we ship a watcher." For a `.flave` bundle (small, single-author) this is irrelevant; for a 517-file / 156MB client corpus it is a real dependency question.

## How it scores against the study checklist

| Checklist item | jj |
|---|---|
| **Unit of sync** | The repository. Nesting is submodules — a `SubmoduleStore` factory exists but `DefaultSubmoduleStore` is minimal |
| **Where history lives** | In the VCS, split across five stores |
| **Content addressing** | Yes, whole-object. Git backend: SHA-1/SHA-256 per git. SimpleBackend: Blake2b-512 |
| **Blob-storage story** | **Trait-ready, implementation-absent.** Four traits to write, in Rust, against a fast-moving upstream |
| **Large binaries** | **Git LFS unsupported.** In an LFS repo jj commits the real bytes over the pointers, silently |
| **Conflict semantics** | Best in the study — recorded, not blocking. Resolution UI is still yours to build |
| **Asymmetry** | None structural. Read-only is a remote-permissions matter, not a repo property |
| **Hand-recoverability** | The working copy is plain files. History needs `jj` (or git, minus change IDs and the op log) |
| **Labels / legibility** | Commit descriptions + `jj op log` with human-readable operation descriptions. Raw material for a progress feed, not a feed |
| **Operational cost** | One binary. Watchman optional. No server |

## Read next

- `lib/src/backend.rs:728-880` — the whole `Backend` trait in one sitting; note every `async` and every stream return
- `lib/src/default_backend_factories.rs:31-56` — the shortest possible proof of what actually ships
- `docs/technical/architecture.md:29-98` — the storage-independence principle, then `GitBackend`'s extra-metadata section, back to back
- `lib/src/simple_backend.rs:107-149` — the object layout that most resembles corpora-builder's `objects/<ab>/<sha256>`

## Related

- [[Profile__Restic]] and [[Profile__Kopia]] — the same content-addressed-history bet, made *natively against object storage*, which is the comparison this profile exists to enable
- [[Profile__Automerge]] — the other "history lives in the document" answer, arrived at from the CRDT side
- `ai-labs/flave-ai/context-v/specs/Master-Flave-An-Agent-Native-Document-Format-and-Publisher.md` §8.2, §8.4 — the decision under test
- `ai-labs/corpora-builder/context-v/plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History.md` — the HISTORY decision that went the other way

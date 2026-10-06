---
name: Seafile Profile
slug: seafile
upstream: https://github.com/haiwen/seafile
upstream_secondary: https://github.com/haiwen/seafile-server
pinned_sha: 2ebf6ac8 (seafile, v9.0.21, 2026-08-07) · 8c47d5f (seafile-server, v13.0.15-server+32, 2026-08-11)
license: GPLv2 (client/daemon) · AGPLv3 (server) — both with an OpenSSL linking exception
maintainer: haiwen (Seafile Ltd.) — open-core; Community Edition here, Professional Edition closed
study: studies/sync-and-content-version-control
profile_path: studies/sync-and-content-version-control/seafile
profile_kind: File sync-and-share system (C daemon + C/Go server)
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.0.1
status: Draft
site_uuid: cfc5aa8a-0ba6-42c9-b0ad-33129e9738b8
hex_code: z1byzx
lede: >-
  Git's object model with content-defined chunking underneath and a
  human-readable description on every commit — and the S3 backend is the paid tier.
summary: >-
  Profile of Seafile (Community Edition, both repos) as pinned in the
  sync-and-content-version-control study. It is the study's closest
  approximation to the stated ask — per-directory sync, content-addressed blob
  storage, real history — and the entry that shows what the ask costs when
  someone builds all three layers at once. Covers the commit/fs/block object
  model, Rabin-fingerprint CDC parameters, the storageBackend seam and the
  finding that only the filesystem backend ships in the open-source tree,
  per-library read-only mode and history retention, and the SFConflict naming
  a non-technical person actually meets. Read it before concluding that
  "seasync" is a new lightweight tool.
tags:
  - Profile
  - Seafile
  - File-Sync
  - Content-Addressed-Storage
  - Content-Defined-Chunking
  - Open-Core
publish: true
from: "studies/sync-and-content-version-control"
from_path: "context-v/profiles/Profile__Seafile.md"
---
# Seafile — Profile

A profile of Seafile Community Edition as it lives in this study, pinned across two repos: `seafile/` (the client daemon and CLI, `2ebf6ac8`, v9.0.21, 2026-08-07) and `seafile-server/` (`8c47d5f`, nearest tag `v13.0.15-server`, 2026-08-11). Both are needed — the object model is duplicated across them and the server carries the Go fileserver where the storage seam lives.

**Why two repos and why this one first.** Seafile is the closest existing system to the ask that opened this study — *per-directory sync, blob storage underneath, real version history, non-technical users on the other end*. It is also the system reached indirectly: the [seasync](https://github.com/seasync) org that prompted the search publishes **unofficial Seafile clients** (Android/Kotlin, a macOS menubar app). There is no separate "seasync" engine. Anyone arriving at seasync has arrived at Seafile, which the 2026-07-08 exploration already evaluated and passed over — so this profile exists to make that pass-over an informed one rather than a repeat.

## TL;DR

Seafile stores each **library** (its name for a synced directory) as **git's data model, reimplemented**: a commit points at a root directory object, directories hold dirents, files hold an ordered list of block IDs, and blocks are content-addressed. The one real departure from git is underneath the file: where git stores a whole-file blob, Seafile splits files with **content-defined chunking** (Rabin fingerprint), so an edit in the middle of a large file re-uploads a chunk rather than the file.

Objects are namespaced per library and split into three stores — `commit`, `fs`, `block` (`seafile-server/fileserver/objstore/objstore.go:10-14`). Each store goes through a `storageBackend` interface (`:16-27`) with four methods, which is a well-drawn seam.

**And in the open-source tree there is exactly one implementation of it.** `New()` hardwires `newFSBackend` (`:31-36`); the C side ships `common/obj-backend-fs.c` and `common/obj-backend-riak.c`. `grep -ril s3` across `seafile-server/` returns three files, all of them tests or the Rabin checksum table. **The S3 / Ceph / Swift backends are Seafile Professional**, per the [admin manual's Pro deployment section](https://haiwen.github.io/seafile-admin-docs/12.0/setup/setup_with_s3/).

**One sentence:** *Seafile is git's object model plus content-defined chunking plus a sync daemon plus a web UI, engineered as one product for exactly this use case — and the blob-storage half of the ask is behind the commercial license.*

## The object model — recognisably git, with one real change

Read `seafile-server/fileserver/` for the clean version; the Go rewrite of the server is more legible than the C original and the shapes are identical.

**Commit** (`fileserver/commitmgr/commitmgr.go:19-46`) carries `CommitID`, `RepoID`, `RootID`, `ParentID`, `SecondParentID`, `Ctime`, `CreatorID` — plus fields git has no equivalent for: `Desc` (a human description), `DeviceName`, `ClientVersion`, and the flags `Conflict`, `NewMerge`, `Repaired`. Encryption material (`Magic`, `RandomKey`, `Salt`, `PwdHash`) rides on the commit too, which is how per-library client-side encryption works.

> **`Desc` is the field this study should notice.** It is a human-written reason attached to a version, in a product aimed at people who will never type `git commit`. Every entry in this study that gets the legibility layer right does it with some version of this field.

**SeafDir** (`fileserver/fsmgr/fsmgr.go:184-190`) is `{version, type, dirents[]}` — the tree.

**Seafile** (`:28-35`) is the file object: `{version, type, size, block_ids[]}`. **A file is an ordered list of block hashes.** This is the departure from git, and it is the whole reason Seafile can sync a large edited file efficiently.

Objects are JSON, not a custom binary pack. `toJSON` even hand-builds the encoding with a comment explaining why (`fsmgr.go:37-38`): the C implementation emits spaces after `,` and `:` and sorts keys, so the Go standard library's encoder would produce a different byte string and therefore a different object ID. Content addressing over a JSON serialization is a fragile contract, and this comment is the scar.

### Content-defined chunking — the actual parameters

`seafile-server/common/cdc/cdc.c:25-32`:

| Constant | Value |
|---|---|
| `BLOCK_SZ` (target average) | 1 MiB |
| `BLOCK_MIN_SZ` | 256 KiB |
| `BLOCK_MAX_SZ` | 4 MiB |
| `BLOCK_WIN_SZ` (rolling window) | 48 bytes |
| `BREAK_VALUE` | `0x0013` |

Rabin fingerprint over a 48-byte window, cut when the low bits match `BREAK_VALUE`. A 1 MiB average chunk is **large** — restic and Kopia both target ~1 MiB too, but for a corpus of markdown files averaging a few KB, chunking does nothing at all: every file is one block, below `BLOCK_MIN_SZ`, and dedup degrades to whole-file. **CDC earns its keep on the PDFs, not the prose.**

## Where history lives, and what it costs

History lives in the store, per library, as a commit DAG. Two controls matter and both are per-library rather than global:

- `set_repo_history_limit(repo_id, days)` / `get_repo_history_limit(repo_id)` (`seafile-server/python/seaserv/api.py:394-404`)
- `clean_up_repo_history(repo_id, keep_days)` (`:776-777`)

So history is **retained by policy and garbage-collected**, not kept forever. That is the honest answer to a question corpora-builder's HISTORY design currently leaves open — content-addressed checkpoints are cheap, but "cheap" is not "free," and somebody eventually has to name a retention window and write the GC. Seafile names it per library.

`seafile-server/fuse/` ships `seaf-fuse`, a **read-only FUSE mount** exposing libraries as directories. That is the hand-recoverability escape hatch: browse the store without the web UI. It is read-only and it is a FUSE mount, so it is a debugging and export tool, not a working surface.

## Conflict semantics — what the client actually sees

`gen_conflict_path` (`seafile/common/vc-common.c:584-617`) is worth reading in full because it is the entire non-technical-user conflict experience, in thirty lines:

```c
g_string_printf (conflict_path, "%s (SFConflict %s %s).%s",
                 copy, modifier, time_buf, ext);
```

A conflicted `Q3-Update.md` becomes `Q3-Update (SFConflict alice@example.com 2026-08-22-14-31-07).md`. Extension-preserving (the `dot`/`ext` split above it), so the file still opens in the right app.

This is **rename-and-keep-both**, the same family as Syncthing's `.sync-conflict-*`. Measured against this study's checklist: it never loses data and it never blocks, and it also never *resolves* anything. The person receives two files with similar names and no indication of what differs. Compare [[Profile__Jujutsu]], where a conflict is a recorded value in the tree that an application can render — a better primitive, attached to a system with no sync transport.

### Asymmetry is a first-class property

`repo->is_readonly` on the client repo record (`seafile/daemon/repo-mgr.h:88`), reported up through sync status (`daemon/sync-mgr.c:1446`) and gating the sync path (`:3043`). Combined with server-side per-library permissions, this gives the structural read-only tier that `augment-it/context-v/explorations/Syncthing-For-Collaborator-Access-To-The-Corpus.md` reached for with Syncthing's `Receive Only` — but enforced by a server that owns the permission, rather than by a folder-type setting on the collaborator's own machine. **That is a materially stronger guarantee**, and it is the clearest thing Seafile offers over the peer-to-peer entries.

## Operational story — this is the cost

Three separately-built C/Go/Python components (`seaf-daemon`, `seafile-controller`, `fileserver`, `notification-server`, Seahub/Django), a MySQL or SQLite database, and a data directory. Platform-specific filesystem watchers written by hand — `wt-monitor-macos.c` (FSEvents), `wt-monitor-linux.c` (inotify), `wt-monitor-win32.c`. The daemon is GPLv2; the server is AGPLv3, which is worth flagging for anything hosted.

Also worth flagging: `seafile-server/configure.ac:5` still declares `AC_INIT([seafile], [6.0.1])` while the client declares `9.0.21` and the server's own nearest tag is `v13.0.15-server`. Build-file version strings in this project are not a reliable signal; use tags and commit dates.

## How it scores against the study checklist

| Checklist item | Seafile |
|---|---|
| **Unit of sync** | The **library** — a named directory with its own history, permissions, retention, and optional encryption. Best-matched unit in the study for "per-dir sync" |
| **Where history lives** | The store, per library, as a commit DAG with GC and a retention window |
| **Content addressing** | Yes, at three levels: commit / fs-object / block, with Rabin CDC below the file |
| **Blob-storage story** | Seam is right, **implementation is Pro-only.** OSS = filesystem (+ Riak) |
| **Conflict semantics** | Rename-and-keep-both, `(SFConflict <modifier> <timestamp>)`, extension preserved |
| **Asymmetry** | **Yes, server-enforced** — `is_readonly` per library. Strongest in the study |
| **Hand-recoverability** | Poor without the tool. `seaf-fuse` gives a read-only browse; there is no plain tree on disk |
| **Labels / legibility** | `Commit.Desc` + web UI history view. The closest thing in the study to a shipped progress surface |
| **Operational cost** | **Highest in the study.** Multi-component server, database, web app, hand-written per-platform watchers |

## The reason this is not simply the answer

It does the job. The costs are specific, and none is about quality:

1. **The blob-storage half is the paid tier.** The exact property that motivated the search is where the open-core line falls.
2. **`live/` does not exist.** corpora-builder's HISTORY layout keeps a real markdown tree in the bucket so `rclone sync` reconstitutes a hand-editable corpus with nothing installed. Seafile's server-side store is opaque objects; the plain tree exists only in a client's working directory. Constraint 1 — *files-as-truth, hand-recoverable* — does not survive.
3. **It is a product, not a library.** There is no way to take the object model and use it under `.flave` or under `corpora`. You adopt the server or you do not.
4. **Agents are not a user it was designed for.** Everything here assumes a human with a desktop client. Nothing exposes "what changed and why" as data an agent or a feed could render — `Commit.Desc` is displayed, not queryable as a stream.

## Read next

- `seafile-server/fileserver/objstore/objstore.go` — 56 lines, the whole storage seam, and the shortest proof that only the filesystem backend ships
- `seafile-server/fileserver/fsmgr/fsmgr.go:28-35` and `:184-190` — the file and directory objects; note `block_ids`
- `seafile-server/common/cdc/cdc.c:25-32` — the chunking constants, then ask what they do to a 4 KB markdown file
- `seafile/common/vc-common.c:584-617` — the entire non-technical conflict experience
- `seafile-server/python/seaserv/api.py:394-404`, `:776` — per-library history retention, the question CAS designs postpone

## Related

- [[Profile__Syncthing]] — the same rename-and-keep-both conflict answer, with no server and no history
- [[Profile__Restic]] and [[Profile__Kopia]] — the same content-addressed store, natively on S3, with no sync and no UI
- [[Profile__Jujutsu]] — the same commit-DAG shape, with genuinely better conflict semantics and no transport
- `self-host-stack/context-v/explorations/Instantly-Synced-Team-Folder-Nextcloud-vs-Alternatives.md` — where Seafile was first evaluated and passed over

---
name: restic Profile
slug: restic
upstream: https://github.com/restic/restic
pinned_sha: a80be1478
pinned_date: 2026-08-01
version_at_pin: "v0.19.1 (nearest tag)"
license: BSD-2-Clause
maintainer: restic org — Alexander Neumann et al.
study: studies/sync-and-content-version-control
profile_path: studies/sync-and-content-version-control/restic
profile_kind: Content-addressed snapshot backup program (Go, single binary)
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
site_uuid: 4479c1f7-b333-48c1-a27e-2c1ca44daa5e
hex_code: 5ftjfs
lede: >-
  Its on-disk layout is data/<ab>/<sha256> plus snapshots/<id> — which is
  corpora-builder's unbuilt Phase 4, already shipped and hardened since 2014.
summary: >-
  Profile of restic as pinned in the sync-and-content-version-control study,
  and the entry that most directly tests whether corpora-builder's HISTORY
  decision should be written or adopted. Covers the repository format
  (write-once SHA-256-named files, packs, index, snapshots), the CDC parameters,
  the eleven backends including native S3 and rclone, the ExpirePolicy
  retention grammar, and the two places restic does not fit the ask: it has no
  live browsable tree in the bucket and its Snapshot carries tags and computed
  statistics but no human-written reason.
tags:
  - Profile
  - Restic
  - Content-Addressed-Storage
  - Cloudflare-R2
  - Snapshots
  - Corpora-Builder
publish: true
from: "studies/sync-and-content-version-control"
from_path: "context-v/profiles/Profile__Restic.md"
---
# restic — Profile

A profile of restic as it lives in this study (`studies/sync-and-content-version-control/restic`, pinned at `a80be147`, nearest tag `v0.19.1`, 2026-08-01). BSD-2-Clause, Go, one static binary.

This entry exists to answer one question honestly: **is `corpora-builder`'s unbuilt Phase 4 just restic?** The HISTORY decision (`ai-labs/corpora-builder/context-v/plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History.md`, 2026-08-08) proposed *"a content-addressed object store plus checkpoint manifests, written by corpora-builder into the same bucket… Git's data model, minus git, on a substrate that has neither."* restic has shipped exactly that since 2014.

## TL;DR

restic backs up a directory into a **repository** that can live on a local disk, SFTP, or an object store. Every file in the repository is named by the **SHA-256 of its contents**, and **written once, never modified** (`doc/design.rst:31-45`). Large files are split by content-defined chunking; blobs are batched into **pack files**; an **index** maps blob IDs to (pack, offset, length); a **snapshot** is a small JSON document pointing at a tree.

The design doc states the invariant that makes the whole thing safe on a dumb store (`doc/design.rst:33-38`):

> All files in a repository are only written once and never modified afterwards. Writing should occur atomically to prevent concurrent operations from reading incomplete files. **This allows accessing and even writing to the repository with multiple clients in parallel.** Only the `prune` operation removes data from the repository.

**One sentence:** *restic is the HISTORY decision, already written, already hardened, already speaking S3 — minus the browsable live tree and minus any place to write down why a version exists.*

## The layout, next to the one we specced

`doc/design.rst:92-117` gives the repository layout. Set against the HISTORY bucket diagram, the correspondence is not approximate:

| corpora-builder HISTORY | restic | Note |
|---|---|---|
| `objects/<ab>/<sha256>` | `data/<ab>/<sha256>` | **Same scheme, same two-hex fan-out.** restic packs many blobs per file; ours is one object per file |
| `checkpoints/<ts>.json` | `snapshots/<id>` | JSON manifest naming a tree |
| `HEAD.json` | — | restic has no HEAD; snapshots are a set, ordered by `Time` |
| — | `index/` | **We have no index.** restic needs one because blobs are inside packs |
| — | `keys/`, `locks/`, `config` | Encryption keys, lock files, and repo config |
| `live/` — the browsable markdown tree | — | **restic has no equivalent, and this is the real gap** |

The two-character prefix directory, the SHA-256 naming, the immutability, the "restore is: read a manifest, write those blobs back" model — all of it is here. The design doc even names the sanity property we'd have wanted: because the filename *is* the content hash, `sha256sum` on any repository file verifies it with no restic involved (`doc/design.rst:44-49`).

### Chunking and packs

Content-defined chunking with a Rabin polynomial, stored per-repository in `config` as `chunker_polynomial` so chunk boundaries are stable and repository-specific (`doc/design.rst:63-84`). Sizes (`doc/design.rst:705-706`):

> Files smaller than **512 KiB** are not split, Blobs are of **512 KiB to 8 MiB** in size. The implementation aims for **1 MiB** Blob size on average.

Same conclusion as [[Profile__Seafile]]: for a corpus of few-kilobyte markdown files, chunking is inert — every file is one blob. It earns its keep on the PDFs.

Blobs are then batched into **pack files** kept under ~8 MiB (`doc/design.rst:309`), each with an encrypted trailing header describing its contents (`:152-213`). This is the one structural thing our design lacks and would eventually need: **one object per file is fine at 517 files and painful at 50,000**, because every object is an S3 PUT and every read is a GET. Packing amortizes both. The `index/` directory exists solely to make packed blobs findable (`doc/design.rst:250-275`).

Encryption is not optional: AES-256-CTR with Poly1305-AES MAC, `IV || CIPHERTEXT || MAC`, 32 bytes overhead per file (`doc/design.rst:50-61`). For client-confidential corpora that is a feature, not a tax — it makes bucket-level compromise insufficient.

## Backends — eleven of them, and two are already in our stack

`internal/backend/`: `local`, `sftp`, `rest`, **`s3`**, `azure`, `b2`, `gs`, `swift`, **`rclone`**, plus `mem`/`mock`/`dryrun` for tests. Wrapped by `retry`, `sema` (concurrency limiting), `limiter` (bandwidth), `cache`, and `logger` decorators.

Two of those matter here specifically:

- **`s3`** — R2 is S3-compatible for everything restic uses, and critically **restic does not need object versioning**, which is the exact capability R2 lacks and which forced the HISTORY decision in the first place. restic's immutability is achieved by never rewriting a key, not by asking the store for versions.
- **`rclone`** — restic can drive an rclone process as its backend. The tree already decided on rclone for the R2 leg (`augment-it`, `JuiceFS-Pinned-Path-Off-Local-Substrate`), so this composes with a decision already made rather than competing with it.

## Retention — the grammar we don't have

`ExpirePolicy` (`internal/data/snapshot_policy.go:14-28`):

```go
type ExpirePolicy struct {
    Last, Hourly, Daily, Weekly, Monthly, Yearly int
    Within, WithinHourly, WithinDaily, WithinWeekly, WithinMonthly, WithinYearly Duration
    Tags []TagList  // keep all snapshots that include at least one of the tag lists
}
```

Richer than [[Profile__Syncthing]]'s four-interval thinning curve, and it does something neither the curve nor our design does: **`Tags` can pin a snapshot out of expiry entirely.** "Keep every checkpoint the client labelled, thin the autosaves" is one policy field, not a feature.

corpora-builder's plan says checkpoints are "nearly free" and never names a retention window. That is true per-checkpoint and false in aggregate the moment an autosave loop runs for a year. `ExpirePolicy` is the vocabulary that question wants.

## Where it does not fit — and these are the reasons, not excuses

**1. There is no `live/`.** This is the decisive one. Property 1 of the HISTORY bucket layout is that `rclone sync r2:corpora-x/live ./corpus` reconstitutes a hand-editable markdown corpus **with no corpora-builder installed** — constraint 1, *files-as-truth, hand-recoverable*. A restic repository is packs and encrypted blobs. Getting files out requires restic and a key.

restic softens this without closing it: `restic mount` gives a FUSE view of every snapshot as a directory tree (`internal/fuse/`, `cmd/restic/cmd_mount.go`), and `restic ls`, `dump`, `find`, and `diff` all read without a full restore. But a FUSE mount is a tool, not a bucket you can point Obsidian, `rg`, or another agent at.

**2. `Snapshot` has no description field.** `internal/data/snapshot.go:17-34` carries `Time`, `Parent`, `Tree`, `Paths`, `Hostname`, `Username`, `Tags`, `ProgramVersion`, `Summary` — and **no free-text reason**. Compare Seafile's `Commit.Desc`. The closest thing is `Tags []string`, which is a label, not a sentence.

This matters for the goal that started all of this: *making invisible progress visible.* A checkpoint a client can read as *"revised the funder-fit section after Tuesday's call"* is the product. Tags do not carry that.

Partial credit, and it is real: `SnapshotSummary` (`:36-53`) records `FilesNew`, `FilesChanged`, `FilesUnmodified`, `DirsNew`, `DirsChanged`, `DataAdded`, `TotalFilesProcessed` at backup time. That is a machine-diffable *what changed*, computed for free, and it is exactly the raw material a progress feed needs under the human sentence. **`Summary` + a `Desc` field restic doesn't have = the legibility layer.**

**3. It is a backup tool, and the semantics show.** Snapshots are an unordered set keyed by time, not a DAG with a current pointer — no `HEAD`, no branches, no merge. `Parent` exists purely to speed up scanning. For "save a version, list versions, restore one" that is enough. For "two people edited, reconcile" it is not, and restic makes no claim otherwise.

## How it scores against the study checklist

| Checklist item | restic |
|---|---|
| **Unit of sync** | Not a sync tool. The unit of *history* is the repository; one repository per corpus/client is the natural mapping |
| **Where history lives** | The store — write-once content-addressed files in a bucket |
| **Content addressing** | Yes, thoroughly. SHA-256, CDC below 8 MiB blobs, packed, indexed |
| **Blob-storage story** | **Native and proven.** `s3` and `rclone` backends; **needs no object versioning**, so R2 is fine |
| **Conflict semantics** | None — not a concurrent-edit system. Multiple *writers to the repo* are safe (append-only + locks) |
| **Asymmetry** | Repository-level: append-only keys and separate `keys/` mean a restricted credential can be a real boundary |
| **Hand-recoverability** | **Poor.** Encrypted packs; needs restic + a key. `mount`/`dump` soften it |
| **Labels / legibility** | `Tags` yes, **free-text reason no.** `SnapshotSummary` gives good machine-side "what changed" |
| **Operational cost** | **Lowest of the history-bearing entries.** One binary against a bucket. No server, no daemon, no database |

## The verdict this profile was written to reach

**Phase 4 as specced is a subset of restic, and restic is better at the subset.** The `data/<ab>/<sha256>` + `snapshots/` correspondence is exact, and restic additionally ships packing, an index, encryption, eleven backends, a retention grammar, `diff`, and eleven years of hardening.

**But Phase 4's two distinguishing requirements are the two things restic will not do:** keep a plain browsable `live/` markdown tree in the bucket, and attach a human-written reason to a version.

Which points at a third option the plan never considered — **not "write it" and not "adopt it," but split it**:

- `live/` stays exactly as designed: `rclone`-synced plain markdown in the bucket, hand-recoverable, constraint 1 preserved.
- History becomes a restic repository beside it, with the client's label as a `--tag`, and `restic diff` doing the work `corpora diff` was going to.
- The only thing corpora-builder writes is the thin part that was always the actual product: **the label, the feed that renders it, and the "save a version" gesture that never says commit.**

That is worth costing before writing `history/cas.py`. The plan's own framing supports it — *"the sunk cost of reversing is roughly 250 lines of Python."* Deciding not to write those 250 lines costs nothing at all.

## Read next

- `doc/design.rst:28-120` — repository format and layout; read it directly against the HISTORY bucket diagram
- `doc/design.rst:152-213` — the pack format, i.e. the thing one-object-per-file will eventually need
- `internal/data/snapshot.go:17-53` — what a snapshot carries, and the missing `Desc`
- `internal/data/snapshot_policy.go:14-28` — the retention grammar
- `internal/backend/` — eleven backends; note `s3` and `rclone` side by side

## Related

- [[Profile__Kopia]] — the same bet, later, with different opinions about compression, caching, and mountability
- [[Profile__Seafile]] — the same object model with the sync, the UI, and the `Desc` field restic lacks
- [[Profile__Jujutsu]] — content-addressed history designed for authoring rather than archiving
- `ai-labs/corpora-builder/context-v/plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History.md` — the HISTORY decision and unbuilt Phase 4 this profile tests

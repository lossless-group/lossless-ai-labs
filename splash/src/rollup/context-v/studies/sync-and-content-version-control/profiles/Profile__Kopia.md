---
name: Kopia Profile
slug: kopia
upstream: https://github.com/kopia/kopia
pinned_sha: 4ebb2be6
pinned_date: 2026-08-21
version_at_pin: "v0.23.1 (nearest tag)"
license: Apache-2.0
maintainer: kopia org — Jarek Kowalski et al.
study: studies/sync-and-content-version-control
profile_path: studies/sync-and-content-version-control/kopia
profile_kind: Content-addressed snapshot backup with per-directory policy tree (Go, single binary + server)
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
site_uuid: 614c535a-806a-4a22-a06b-ef7d4c08105d
hex_code: 59jzq6
lede: >-
  Its snapshot manifest has the free-text Description field restic lacks, and
  its policies attach per directory and inherit — the ask's own shape, in the store.
summary: >-
  Profile of Kopia as pinned in the sync-and-content-version-control study,
  read as the direct comparison to restic. Covers the five-layer architecture
  (blob / content / object / manifest / snapshot), the pluggable splitter
  registry, the ten storage providers plus the readonly wrapper that makes
  asymmetry structural at the storage layer, and the two features that make
  Kopia the closest fit in the study for the make-progress-visible goal — a
  snapshot manifest carrying Description, key-value Tags, and manual Pins, and
  a per-directory policy tree whose effective values record which level supplied
  each field.
tags:
  - Profile
  - Kopia
  - Content-Addressed-Storage
  - Snapshots
  - Policy-Inheritance
  - Corpora-Builder
publish: true
from: "studies/sync-and-content-version-control"
from_path: "context-v/profiles/Profile__Kopia.md"
---
# Kopia — Profile

A profile of Kopia as it lives in this study (`studies/sync-and-content-version-control/kopia`, pinned at `4ebb2be6`, nearest tag `v0.23.1`, 2026-08-21). Apache-2.0, Go, one binary that is also a server.

Read this immediately after [[Profile__Restic]]. They make the same bet — content-addressed snapshots natively into a bucket — and the differences are exactly where the Lossless ask lives.

## TL;DR

Kopia is restic's design with two additions that turn out to matter here more than any performance difference:

1. **`snapshot.Manifest` carries `Description string`** (`snapshot/manifest.go:22`) — the human-written reason restic has no field for.
2. **Policies attach to a directory path and inherit down the tree** (`snapshot/policy/policy_tree.go`, `policy_merge.go`) — retention, compression, file selection, and hooks, configured *per directory*, which is the literal shape of "per-dir sync with version control."

Architecturally it is cleanly layered, and the layers are worth naming because they are the vocabulary any home-grown design ends up reinventing:

| Layer | Package | Job |
|---|---|---|
| **blob** | `repo/blob` | *"simple storage of immutable, unstructured binary large objects"* (`repo/blob/doc.go:1`) — the provider seam |
| **content** | `repo/content` | Encryption, dedup, packing of blobs into content-addressed units |
| **object** | `repo/object` | Splitting large streams into contents; reassembly |
| **manifest** | `repo/manifest` | *"managing JSON-based manifests in repository"* (`repo/manifest/manifest_manager.go:1`) |
| **snapshot** | `snapshot/` | Directory trees, policies, retention, restore |

**One sentence:** *Kopia is restic plus a description field, plus a per-directory inheriting policy tree, plus a server and web UI — which makes it the closest thing in this study to the syncbox as described, still missing only the sync.*

## The two features that matter for this study

### `Description`, `Tags`, and `Pins` on the manifest

`snapshot/manifest.go:18-40`:

```go
type Manifest struct {
	ID     manifest.ID `json:"id"`
	Source SourceInfo  `json:"source"`

	Description string          `json:"description"`
	StartTime   fs.UTCTimestamp `json:"startTime"`
	EndTime     fs.UTCTimestamp `json:"endTime"`

	Stats            Stats  `json:"stats"`
	IncompleteReason string `json:"incomplete,omitempty"`
	RootEntry        *DirEntry `json:"rootEntry"`
	RetentionReasons []string  `json:"-"`
	Tags             map[string]string `json:"tags,omitempty"`
	Pins             []string          `json:"pins,omitempty"`
}
```

Four fields here that restic's `Snapshot` does not have, and each answers something the ask needs:

- **`Description`** — the free-text reason. *"Revised the funder-fit section after Tuesday's call."* This is the field the make-progress-visible goal has been missing in every other entry except Seafile's `Commit.Desc`, and unlike Seafile's it sits in a store that talks to R2 natively.
- **`Tags map[string]string`** — key-value, not restic's flat `[]string`. `client=reach-edu`, `kind=checkpoint` vs `kind=autosave` is expressible without string conventions.
- **`Pins []string`** — named manual holds that keep a snapshot out of expiry. `UpdatePins` (`:43`) adds and removes them. "The client asked us to keep this one" is a pin, not a policy exception.
- **`RetentionReasons []string`** — computed, not persisted (`json:"-"`), explaining *why* a given snapshot survived the last expiry pass. A retention system that can explain itself.

`IncompleteReason` deserves a note too: a snapshot can be recorded as partial with a stated cause, rather than either succeeding or vanishing. Useful for anything running unattended.

### The per-directory policy tree

`snapshot/policy/` is the largest idea in the entry. Policies are objects attached to a `SourceInfo` (host + user + path) and merged down the directory tree (`policy_tree.go`, `policy_merge.go`, `policy_manager.go:42-52`). The policy kinds are separate files and each is genuinely per-directory:

`retention_policy.go` · `compression_policy.go` · `files_policy.go` · `scheduling_policy.go` · `splitter_policy.go` · `upload_policy.go` · `error_handling_policy.go` · `logging_policy.go` · `actions_policy.go`

`RetentionPolicy` (`retention_policy.go:23-31`) is the restic grammar plus one good idea:

```go
KeepLatest, KeepHourly, KeepDaily, KeepWeekly, KeepMonthly, KeepAnnual *OptionalInt
IgnoreIdenticalSnapshots *OptionalBool
```

`IgnoreIdenticalSnapshots` is the fix for the failure mode an autosave loop guarantees: a hundred snapshots a day of an unchanged corpus, each cheap in bytes and each costing a manifest and a listing row.

The genuinely unusual move is the parallel `*PolicyDefinition` structs (`retention_policy.go:34-37`, `actions_policy.go:17-20`). For every field in the effective policy, Kopia records **which policy level supplied that value** as a `SourceInfo`. Effective configuration with provenance, per field. Anyone who has debugged inherited config knows what that is worth.

**`ActionsPolicy`** (`actions_policy.go:6-14`) is a hook seam: `BeforeFolder` / `AfterFolder` (explicitly *not* inherited) and `BeforeSnapshotRoot` / `AfterSnapshotRoot` (inherited). That is where "run the quality scan before checkpointing" or "re-ingest to Chroma after" would attach without writing an orchestrator.

## Storage — providers plus a wrapper stack

`repo/blob/`: `s3`, `azure`, `b2`, `gcs`, `gdrive`, `filesystem`, `sftp`, `webdav`, `rclone`. Same story as restic — **S3-compatible is a first-class target and no object versioning is required**, so R2 is fine, and `rclone` composes with a transport decision the tree already made.

The decorators around them are the more interesting half: `readonly`, `retrying`, `throttling`, `logging`, `storagemetrics`, `sharded`, `beforeop`. Two are worth calling out:

- **`readonly`** (`repo/blob/readonly/readonly_storage.go`) — a wrapper that refuses every mutation and reports `IsReadOnly() true`. Structural asymmetry **at the storage layer**, one level below where [[Profile__Syncthing]] puts it (folder type) and [[Profile__Seafile]] puts it (server permission). Combined with a read-scoped R2 token, a client-facing replica becomes read-only in two independent ways.
- **`sharded`** — the directory-fan-out strategy (`data/<ab>/…`) as a configurable concern rather than a hardcoded scheme.

`repo/ecc/` adds optional Reed-Solomon error correction over blobs, which no other entry in this study offers.

## Splitters — pluggable, unlike everyone else

`repo/splitter/`: `splitter_fixed.go`, `splitter_buzhash32.go`, `splitter_rabinkarp64.go`, plus a pool. Default is **`DYNAMIC-4M-BUZHASH`** (`repo/splitter/splitter.go:88-89`) — a 4 MiB average, notably larger than restic's 1 MiB and Seafile's 1 MiB.

And because there is a `splitter_policy.go`, **the chunking algorithm is a per-directory setting**. Prose directories get fixed or large-average splitting; a PDF directory gets buzhash. No other entry exposes this at all, and for a corpus that mixes 4 KB markdown with 40 MB reports it is the right knob to have.

Compression is likewise per-policy (`compression_policy.go`) across `zstd`, `lz4`, `s2`, `gzip`, `pgzip`, `deflate` (`repo/compression/`). restic added zstd repository-wide; Kopia makes it a per-directory choice.

## Where it still does not reach

**1. It does not sync.** Same as restic: a snapshot is a one-way capture. There is no bidirectional reconciliation, no conflict model, no "the client edited it too." `kopia server` and its web UI serve *browsing and triggering snapshots*, not a shared editing surface.

**2. There is still no `live/` tree.** The repository is packed, encrypted contents. `kopia mount` (`cli/command_mount.go`, `internal/server/api_mount.go`) gives a FUSE view and the server offers object download, but the bucket does not hold a plain markdown tree anyone could `rclone sync` and open in Obsidian. Constraint 1 — *files-as-truth, hand-recoverable* — does not survive here either.

**3. More machinery than restic.** Five layers, a policy engine, a server, a web UI, ECC, six compressors. All well-factored, and all surface area. restic's *"one binary, one repository, six commands"* is a real advantage if the only requirement is snapshots.

## How it scores against the study checklist

| Checklist item | Kopia |
|---|---|
| **Unit of sync** | Not a sync tool. Unit of *policy and history* is the **directory**, which is the ask's own unit |
| **Where history lives** | The store — content-addressed, packed, encrypted, in a bucket |
| **Content addressing** | Yes, and the splitter is pluggable and per-directory (default `DYNAMIC-4M-BUZHASH`) |
| **Blob-storage story** | **Native.** Nine providers incl. `s3` and `rclone`; no object versioning needed |
| **Conflict semantics** | None. Not a concurrent-edit system |
| **Asymmetry** | **`readonly` storage wrapper** — structural, at the lowest layer |
| **Hand-recoverability** | Poor. Packed + encrypted; `mount` and the server soften it |
| **Labels / legibility** | **Best in the study.** `Description` + key-value `Tags` + `Pins` + `RetentionReasons` + `Stats` |
| **Operational cost** | One binary, optionally a server. Higher conceptual surface than restic |

## What this changes about the Lossless decision

restic proved the HISTORY design was already built. **Kopia proves the two things restic couldn't do are also already built** — everything except the browsable `live/` tree:

- The free-text reason on a version → `Description`
- Per-directory retention and behaviour → the policy tree
- Structural read-only for a client replica → `readonly` + a read-scoped token
- Pin the checkpoints that matter, thin the rest → `Pins` + `IgnoreIdenticalSnapshots`
- Run the quality scan around a checkpoint → `ActionsPolicy`

Which sharpens the split proposed in [[Profile__Restic]] into something more specific and cheaper:

> `live/` stays exactly as designed — plain markdown in the bucket via rclone, hand-recoverable. History becomes a **Kopia** repository beside it, one per client, with the client's sentence as `--description` and `client=<slug>` in `Tags`. What corpora-builder writes is only the gesture, the sentence, and the feed that renders `Description` + `Stats` for someone who will not read a diff.

**The honest counterweight:** this trades ~250 lines of Python for a Go binary in the deployment, a repository format we do not control, and a `restore` step between the bucket and a human. Whether that trade is good depends entirely on whether the `live/` tree stays canonical. **If `live/` is the truth and history is a safety net, adopt. If history is the truth, write it.** The plan should say which.

## Read next

- `snapshot/manifest.go:18-40` — read it directly against restic's `internal/data/snapshot.go:17-34`; the diff is the study's answer on legibility
- `snapshot/policy/retention_policy.go:23-37` — the retention grammar and, below it, the per-field provenance struct
- `snapshot/policy/actions_policy.go:6-14` — the hook seam
- `repo/blob/readonly/readonly_storage.go` — structural read-only in 60 lines
- `repo/splitter/splitter.go:88-89` — the default, then `snapshot/policy/splitter_policy.go` for why it is per-directory

## Related

- [[Profile__Restic]] — the same bet, simpler, with no description field and no policy tree
- [[Profile__Seafile]] — the other entry with a human reason on a version (`Commit.Desc`), plus the sync Kopia lacks
- [[Profile__Syncthing]] — the transport that would have to sit beside this
- `ai-labs/corpora-builder/context-v/plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History.md` — Phase 4, and the `live/` property that decides adopt-vs-write

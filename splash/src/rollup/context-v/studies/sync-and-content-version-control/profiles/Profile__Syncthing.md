---
name: Syncthing Profile
slug: syncthing
upstream: https://github.com/syncthing/syncthing
pinned_sha: 38ac58c82
pinned_date: 2026-08-20
version_at_pin: "v2.1.4-rc.1 (nearest tag)"
license: MPL-2.0
maintainer: The Syncthing Foundation / syncthing org
study: studies/sync-and-content-version-control
profile_path: studies/sync-and-content-version-control/syncthing
profile_kind: Peer-to-peer continuous file synchronization daemon (Go)
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
site_uuid: 55e6066c-f5cc-401e-b131-4fd14fa7be74
hex_code: 96r08u
lede: >-
  Closes a question two Lossless docs left open: a receive-only device does not
  silently orphan the collaborator's edit — it flags it, counts it, and offers Revert.
summary: >-
  Profile of Syncthing as pinned in the sync-and-content-version-control study.
  It is the study's transport-only entry — no server, no store, no commit graph
  — and the one that resolves the open question in augment-it's Syncthing
  exploration by reading folder_recvonly.go directly. Covers the four folder
  types as a structural asymmetry lever, the FlagLocalReceiveOnly mechanism and
  Revert, fixed-size (not content-defined) SHA-256 blocks and what that costs,
  the .stversions versioner family including the staggered thinning curve worth
  stealing, and why history here is per-device and local rather than shared.
tags:
  - Profile
  - Syncthing
  - File-Sync
  - Peer-To-Peer
  - Conflict-Resolution
  - Augment-It
publish: true
from: "studies/sync-and-content-version-control"
from_path: "context-v/profiles/Profile__Syncthing.md"
---
# Syncthing — Profile

A profile of Syncthing as it lives in this study (`studies/sync-and-content-version-control/syncthing`, pinned at `38ac58c8`, nearest tag `v2.1.4-rc.1`, 2026-08-20). MPL-2.0, Go, single binary, no server.

This is the study's **transport-only** entry, and the one the Lossless tree has leaned toward twice without ever installing it — first in `self-host-stack/context-v/explorations/Instantly-Synced-Team-Folder-Nextcloud-vs-Alternatives.md` (2026-07-08), then in `ai-labs/augment-it/context-v/explorations/Syncthing-For-Collaborator-Access-To-The-Corpus.md` (2026-07-17). The second doc ended with five genuinely open questions. **Two of them are answered by thirty lines of source, and this profile answers them.**

## TL;DR

Syncthing continuously synchronizes a folder between named devices over a direct (or relayed) TLS connection. Devices authenticate by device ID — which *is* the certificate fingerprint — so there is no account system, no server, and no central authority. Files are split into **fixed-size** SHA-256 blocks and only changed blocks transfer.

It has **no history** in any sense this study means. What it has is a `versioner` — a per-device, local, opt-in archive of superseded file *copies* under `.stversions/`. There is no commit, no manifest, no shared timeline, and nothing another device can query.

**One sentence:** *Syncthing is the transport layer alone, done extremely well, with an honest local file-archive bolted on where history would go.*

## The finding: receive-only does not orphan the edit

`augment-it`'s exploration asked, and left open:

> **Is `Receive Only` actually conflict-proof in practice**, or does it just relocate the conflict to "collaborator made a local edit, now it's silently orphaned and never synced anywhere"?

The doc comment at the top of `lib/model/folder_recvonly.go:29-57` answers it precisely, and the answer is better than the doc feared:

> - Local changes are scanned and versioned as usual, but get the **`FlagLocalReceiveOnly`** bit set.
> - When changes are sent to the cluster this bit gets converted to the Invalid bit … and also the Version gets set to the empty version. **The reason for clearing the Version is to ensure that other devices will not consider themselves out of date due to our change.**
> - The database layer **accounts sizes per flag bit, so we can know how many files have been changed locally.** We use this to trigger a **"Revert"** option on the folder when the amount of locally changed data is nonzero.
> - To revert we take the files which have changed and reset their version counter down to zero. The next pull will replace our changed version with the globally latest. As this is a user-initiated operation **we do not cause conflict copies when reverting.**
> - When pulling normally … with local changes, **normal conflict resolution will apply. Conflict copies will be created, but not propagated outwards.**

So the collaborator's edit is:

- **not lost** — it stays on disk, and normal conflict handling still produces a `.sync-conflict-*` copy locally if the file changes upstream;
- **not propagated** — the empty Version means nobody else is told they are behind;
- **not silent** — the size-per-flag accounting surfaces "you have N locally changed files," and the UI offers Revert.

The implementation note at `:56-57` is the tell that this is a cheap, well-factored feature rather than a mode: *"a `receiveOnlyFolder` is just a `sendReceiveFolder` that sets an extra bit on local changes and has a Revert method."*

**Verdict for the augment-it design:** `Receive Only` is a real structural single-writer guarantee, and the collaborator's failure mode is *visible and reversible*, not orphaned. The remaining caveat is honest and small — the visibility lives in **Syncthing's own UI**, so a collaborator who never opens it will not see the count. That is an onboarding problem, not a data problem.

### Four folder types, and the fourth is interesting

`lib/config/foldertype.go:13-18`:

| Type | Meaning |
|---|---|
| `sendreceive` | Symmetric multi-writer (the default, including on unparseable input — see `UnmarshalText`'s `default:`) |
| `sendonly` | This device publishes, never accepts |
| `receiveonly` | This device accepts, never publishes |
| `receiveencrypted` | Holds an **encrypted** replica it cannot read |

`receiveencrypted` is the one worth noting for client work: an untrusted device (a VPS, a cheap always-on box) can carry a full replica without being able to read it. That is a genuine answer to the "always-on hub" problem option B of the augment-it exploration reached for, and it does not require running Syncthing inside the Railway container.

Note the failure-open default in `UnmarshalText` (`foldertype.go:38-50`): an unrecognized type string silently becomes `sendreceive`. A typo in config gives you multi-writer, not an error.

## Blocks — fixed-size, and that is a deliberate difference

`lib/protocol/protocol.go:47-57`: `MinBlockSize = 128 KiB`, `MaxBlockSize = 16 MiB`, `DesiredPerFileBlocks = 2000`. Valid block sizes are powers of two between those bounds (`lib/protocol/bep_fileinfo.go:96-101`), and the size for a given file is chosen so it lands near 2000 blocks. Hashing is SHA-256 (`lib/scanner/blocks.go:12,34,125`).

**This is fixed-size chunking, not content-defined chunking.** Contrast [[Profile__Seafile]] (Rabin, 1 MiB average) and [[Profile__Restic]] / [[Profile__Kopia]] (both CDC). The consequence is the classic one: insert a byte at the front of a large file and every subsequent block boundary shifts, so every block re-hashes and re-transfers. For markdown, CSV appends, and whole-file rewrites — the actual Lossless workload — this is irrelevant, since files are far below `MinBlockSize` and are transferred whole either way. For a large PDF that gets re-exported, Syncthing re-sends more than restic would store.

Also worth knowing: **no dedup across files.** Blocks are per-file in the index; two identical PDFs in two client folders are two full copies. Every other content-addressed entry in this study dedups them to one.

## Conflicts — rename and keep both

`conflictName` (`lib/model/folder_sendrecv.go:2237-2239`):

```go
return name[:len(name)-len(ext)] + time.Now().Format(".sync-conflict-20060102-150405-") + lastModBy + ext
```

`Q3-Update.md` → `Q3-Update.sync-conflict-20260822-143107-ABCD123.md`, extension preserved, device short-ID appended. Structurally identical to Seafile's `(SFConflict …)` and with the same limitation: the person gets two files and no help. This is the study's second data point that **every file-sync system resolves conflicts by not resolving them**, which is the strongest available argument for making the shared folder structurally asymmetric rather than relying on people to behave.

## Where history would be: `.stversions/`

`lib/versioner/` is a small, honest package. The interface is four methods (`versioner.go:20-25`): `Archive`, `GetVersions`, `Restore`, `Clean`. A `FileVersion` is `{VersionTime, ModTime, Size}` — **no hash, no author, no label, no reason** (`:27-31`). Versions land under `.stversions` (`util.go:35`), named with a `20060102-150405` timestamp (`versioner.go:40`).

Four strategies ship: `trashcan`, `simple`, `staggered`, `external`.

**The `staggered` interval curve is the one thing here worth stealing** (`lib/versioner/staggered.go:49-54`):

```go
interval: [4]interval{
    {30,               60 * 60},            // first hour  -> 30 sec between versions
    {60 * 60,          24 * 60 * 60},       // next day    -> 1 h  between versions
    {24 * 60 * 60,     30 * 24 * 60 * 60},  // next 30 days-> 1 day between versions
    {7 * 24 * 60 * 60, maxAge},             // next year   -> 1 week between versions
},
```

That is a retention policy expressed as **progressive thinning**: dense near now, sparse in the past, default `maxAge` ~1 year (`:39-42`). corpora-builder's HISTORY design currently has no retention story at all — "checkpoints are nearly free" is true per-checkpoint and untrue in aggregate once an autosave loop runs for a year. This curve is a ready-made answer, and it is four lines.

**But do not mistake `.stversions` for history.** It is:

- **per-device** — each machine keeps its own archive of what *it* overwrote; there is no shared timeline;
- **whole-file copies** — no content addressing, no dedup, so keeping N versions of a 10 MB PDF costs 10N MB;
- **unlabelled** — nothing carries a human reason, so nothing can render a progress feed;
- **inside the synced folder**, at `.stversions/`, which means it is on the path a naive backup or ingest would walk.

## Operational story

One static Go binary per device, a local web UI, and a device-ID exchange to pair. NAT traversal via the project's public discovery and relay servers by default, both self-hostable — and for client-confidential corpora, *whether device IDs alone are sufficient auth* was flagged as unresearched in the augment-it doc and remains so here; it is a policy question, not a code question. No server, no database, no accounts. Cheapest operational footprint in the study by a wide margin.

## How it scores against the study checklist

| Checklist item | Syncthing |
|---|---|
| **Unit of sync** | The folder, shared per-device by folder ID. No nesting |
| **Where history lives** | **Nowhere shared.** A per-device local file archive under `.stversions/` |
| **Content addressing** | Block-level SHA-256 for transfer only; **fixed-size**, no cross-file dedup, not a store |
| **Blob-storage story** | **None.** A peer is always a Syncthing daemon on a real machine. Cannot target S3/R2 at all |
| **Conflict semantics** | Rename-and-keep-both: `.sync-conflict-<ts>-<device>` |
| **Asymmetry** | **Yes, four folder types** — and `receiveencrypted` also covers the untrusted-hub case |
| **Hand-recoverability** | **Best in the study.** The folder is just the folder. Delete Syncthing and nothing changes |
| **Labels / legibility** | None. `FileVersion` carries no author and no reason |
| **Operational cost** | **Lowest in the study.** One binary per device |

## What this settles for the Lossless design

1. **`Receive Only` is a real guarantee** and the collaborator's edit is visible and revertible, not orphaned. The augment-it exploration's option (C) — laptop-to-laptop mesh, receive-only collaborators, R2/rclone as an unrelated backup — is sound as specified.
2. **Syncthing can never be the history layer.** Not "is weak at" — cannot. No shared timeline exists to render.
3. **Syncthing can never reach R2.** Already correctly recorded in the 2026-07-13 pickup note; the code confirms it. A peer is a daemon, always.
4. **The staggered thinning curve is portable** and belongs in whatever checkpoint retention corpora-builder eventually writes.

## Read next

- `lib/model/folder_recvonly.go:29-57` — the doc comment that closes the open question; read it before designing any collaborator tier
- `lib/config/foldertype.go` — 50 lines, all four types, including the failure-open default
- `lib/versioner/staggered.go:49-54` — the thinning curve
- `lib/protocol/protocol.go:47-57` — fixed block sizes, and why they are fixed
- `lib/model/folder_sendrecv.go:2237-2248` — the conflict name a client will actually see

## Related

- [[Profile__Seafile]] — the same conflict answer, plus the server, store, and history Syncthing declines to have
- [[Profile__Restic]] and [[Profile__Kopia]] — the inverse trade: real history into a bucket, no sync at all
- `ai-labs/augment-it/context-v/explorations/Syncthing-For-Collaborator-Access-To-The-Corpus.md` — the doc this profile closes two open questions in
- `self-host-stack/context-v/explorations/Instantly-Synced-Team-Folder-Nextcloud-vs-Alternatives.md` — where the lean toward Syncthing was first recorded

---
title: "A Syncbox for Client Document Folders — Where Does History Actually Live?"
lede: "The ask is one product. The prior art says it's three layers, and nothing on the shelf does all three on a bucket."
date_created: 2026-08-22
date_modified: 2026-10-09
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.0.2
status: Open
site_uuid: dfe7d586-edcf-4d9c-b6ff-e3b4362f2e06
hex_code: 8tg9j7
summary: >-
  Exploration of the per-directory blob-backed synced folder with version
  control that clients could tinker in. Consolidates four prior explorations
  and two contradictory resolved decisions across self-host-stack, augment-it,
  corpora-builder and flave-ai, then reads them against the six references
  pinned in studies/sync-and-content-version-control. Argues the ask is three
  separable layers (transport, history, legibility), that the history layer is
  already shipped by restic and Kopia, that legibility is the only genuinely
  unbuilt part, and that the corpora-builder HISTORY decision and the flave
  spec 8.2 jj decision need reconciling before any package is written.
tags:
  - Exploration
  - Sync
  - Version-Control
  - Content-Addressed-Storage
  - Corpora-Builder
  - Flave
  - Jujutsu
  - Cloudflare-R2
publish: true
---

# A Syncbox for Client Document Folders

## Why Care?

Clients are about to become participants. The corpora we build for them
(`corpora-builder`), the documents we generate from that research (`flave-ai`),
the memos and decks — all of it is currently a one-way delivery. The clients want
to tinker. And there is a second, quieter motive: **a lot of the work we do is
invisible**, and a folder that visibly changes is the cheapest proof of progress
there is.

The shape that keeps suggesting itself is *"Dropbox, but for an era where agents
work fluently in Markdown, JSON, CSV, HTML, JS, CSS — and with version control
underneath, per directory, on blob storage."* Version control used the way
business teams use Dropbox, not the way engineering teams use git.

This document argues that **the shape is right and the packaging is wrong** —
that what reads as one product is three layers with three different best answers,
that two of the three are already solved by software we can pin and read, and
that the remaining one is both the smallest and the only part that is actually
ours.

It also surfaces a live contradiction: **two resolved decisions in this tree,
six days apart, answer the history question in opposite directions.** That has to
be reconciled before anything gets written, because both of them want to consume
whatever gets built.

## The prior art, and it is more than we remembered

Four documents circled this before today. None closed.

| Doc | Date | Where it landed |
|---|---|---|
| `self-host-stack/context-v/explorations/Instantly-Synced-Team-Folder-Nextcloud-vs-Alternatives.md` | 2026-07-08 | Compared Nextcloud / Syncthing / Seafile. Leaned **Syncthing**. Status still `Open`; nothing installed. |
| `ai-labs/augment-it/context-v/explorations/Syncthing-For-Collaborator-Access-To-The-Corpus.md` | 2026-07-17 | Proposed **asymmetric** sync — collaborators `Receive Only` — so single-writer is structural. Five open questions. Never built. |
| `ai-labs/corpora-builder/context-v/plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History.md` | 2026-08-08 | The **HISTORY** decision. Phases 0–3 and 6 shipped; **Phase 4 unbuilt**. |
| `ai-labs/flave-ai/context-v/specs/Master-Flave-An-Agent-Native-Document-Format-and-Publisher.md` §8.2, §8.4 | 2026-08-14 | **Every `.flave` bundle is a `jj` repo**, agent-driven. Collaboration staged v1 async → v2 review → v3 CRDT. |

The 2026-07-08 doc also recorded, in passing, the footgun this whole area keeps
walking into:

> Continuously syncing a live `.git` working tree with any file-sync tool
> (Dropbox, Nextcloud, Syncthing, Seafile alike) is a well-known way to corrupt a
> git repository.

Keep that sentence. It comes back below with teeth.

### The contradiction

**corpora-builder, 2026-08-08:**

> R2 does not support object versioning… **they are one problem, and SUBSTRATE
> determines the answer.** Once the object store is primary and the object store
> has no history, version control must be application-level. There is nothing
> left to choose. **HISTORY: version control is a content-addressed object store
> plus checkpoint manifests… Git's data model, minus git.**

Property 4 of that design: *"'Save a version' never says 'commit.' … **There is
no git to hide.**"*

**flave-ai, 2026-08-14 — six days later:**

> **RESOLVED · every `.flave` is a `jj` repo. The agent runs all VCS operations
> under the hood.**

Both are marked resolved. Both are defensible *for their own artifact*. And the
syncbox as asked — one backend serving corpora and `.flave` alike — cannot
inherit both. **This is the decision on the table**, not "how do I build a
syncbox."

### Prior-art index — everything in the tree that touches this

*Added 2026-10-09.* The table above is what this doc argued from. This is the
complete map, so nobody has to re-run the search: wikilink for Obsidian, repo
path for agents and `grep`.

**Before this doc — the threads it consolidates**

| Doc | Path | Date | What it contributes |
|---|---|---|---|
| [[JuiceFS-Pinned-Path-Off-Local-Substrate]] | `ai-labs/augment-it/context-v/explorations/` | 2026-06-18 | Live cloud-mount tried end-to-end and rejected: "a network drive, not Dropbox." Origin of the rclone→R2 decision |
| [[Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge]] | `ai-labs/context-v/explorations/` | 2026-07-06 | The substrate thread this inherits from |
| [[Instantly-Synced-Team-Folder-Nextcloud-vs-Alternatives]] | `self-host-stack/context-v/explorations/` | 2026-07-08 | Nextcloud vs. Syncthing vs. Seafile for a 3-person team folder; leaned Syncthing, Papermark for external shares; the `.git`-in-a-sync-folder footgun |
| [[Pickup-2026-07-13]] | `ai-labs/augment-it/context-v/plans/pickups/` | 2026-07-13 | Re-confirmed rclone→R2 for backup; ruled Syncthing out of that leg (no S3/R2) |
| [[Syncthing-For-Collaborator-Access-To-The-Corpus]] | `ai-labs/augment-it/context-v/explorations/` | 2026-07-17 | Asymmetric `Receive Only` collaborator mirrors; two of its open questions close here |
| [[Corpora-Builder-System-Design]] | `ai-labs/corpora-builder/context-v/explorations/` | 2026-07-20 | Corpus building rebuilt three times; why it earned its own repo |
| [[Self-Hosting-the-Vault-via-Ignis]] | `content-farm/context-v/explorations/` | 2026-07-20 | Adjacent: shared *browser* access to the vault instead of syncing files |
| [[Corpora-Builder-MVP-R2-Native-With-Checkpoint-History]] | `ai-labs/corpora-builder/context-v/plans/` | 2026-08-08 | The HISTORY decision — hand-built CAS + checkpoints |
| [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] §8.2, §8.4 | `ai-labs/flave-ai/context-v/specs/` | 2026-08-14 | Every `.flave` is a `jj` repo; collaboration staged async → review → CRDT |

**The study** — `ai-labs/studies/sync-and-content-version-control/` (README holds
the full matrix). The body below cites six references; the shelf has since grown
to eight, adding git-annex (question 6's binaries case) and Rclone-UI.

[[Profile__Syncthing]] · [[Profile__Seafile]] · [[Profile__Restic]] ·
[[Profile__Kopia]] · [[Profile__Jujutsu]] · [[Profile__Automerge]] ·
[[Profile__Git-Annex]] · [[Profile__Rclone-UI]]

**After this doc — what acted on it**

| Doc | Path | Date | What it did |
|---|---|---|---|
| [[Sync-Corpora-to-R2-and-Show-Clients-What-Changed]] | `ai-labs/context-v/plans/` | 2026-08-22 | **The plan this exploration produced.** rclone mirror shipped; feed read side shipped; Kopia / Syncthing / Automerge parked behind named triggers |
| [[Corpus-Change-Feed]] | `ai-labs/corpora-builder/context-v/specs/` | 2026-08-22 | The legibility layer, specced and signed off |
| [[Sync-Dirs-in-Pseudomonorepo-Architecture]] | `context-v/explorations/` (anchor root) | 2026-08-22 | Same-day sibling, different problem: syncing dirs *inside* the tree (skills, changelogs, vault) |
| [[Back-Up-The-Content-Ingest-Corpus-Volume]] | `ai-labs/augment-it/context-v/plans/` | 2026-09-10 | The deployed corpus on a Railway volume has no second copy — the backup leg, reopened for the hosted surface |

## The reframe: it is three layers, not one product

| Layer | The question it answers | Where the unglamorous 90% lives |
|---|---|---|
| **Transport** | how bytes move between machines | NAT traversal, reliable FSEvents, resumable partial transfers, conflict semantics |
| **History** | what did this look like before | content addressing, packing, indexing, retention, GC |
| **Legibility** | what changed, and why should a client care | — |

The third column is the argument. Transport and history are *deep* problems with
mature implementations. Legibility has no column entry because **nobody has built
it**, and it is the layer the invisible-progress goal actually needs.

The 2026-07-08 exploration already made this move once, correctly, when it
separated *sync* from *external share links* and concluded "Syncthing for the
first, Papermark for the second." Same discipline, one level deeper.

## What the study found

Six references pinned in
[`ai-labs/studies/sync-and-content-version-control`](../../studies/sync-and-content-version-control),
one profile each. The full matrix is in that README; the findings that change
what we do are these.

### 1. `seasync` is Seafile

The tool that prompted this round is not a tool. [seasync](https://github.com/seasync)
is an org publishing **unofficial Seafile clients** (Android, macOS menubar).
Arriving there is arriving at Seafile — Option C of the 2026-07-08 exploration,
already evaluated and passed over.

The instinct was still well-calibrated: Seafile genuinely is *per-library sync +
content-addressed block storage + real history*. But **its S3 backend is
Professional Edition.** The open-source `fileserver/objstore/objstore.go` draws a
clean four-method storage seam with exactly one implementation behind it —
filesystem. The open-core line falls precisely on the property that motivated the
search.

### 2. Phase 4 is restic. Almost exactly.

The HISTORY bucket layout next to restic's repository layout:

| corpora-builder HISTORY | restic |
|---|---|
| `objects/<ab>/<sha256>` | `data/<ab>/<sha256>` |
| `checkpoints/<ts>.json` | `snapshots/<id>` |
| — | `index/`, `keys/`, `locks/`, `config` |
| `live/` — browsable markdown tree | **— (nothing)** |

Same content-addressed scheme, same two-hex fan-out, plus packing, an index,
encryption, eleven backends, a retention grammar, and eleven years of hardening.
Critically, **restic needs no object versioning** — its immutability comes from
never rewriting a key. That is the exact R2 gap that forced HISTORY to go
application-level in the first place, and it turns out not to force anything.

**Kopia goes further and supplies what restic lacks.** Its `snapshot.Manifest`
carries a free-text **`Description`**, key-value `Tags`, manual `Pins` that hold a
snapshot out of expiry, and computed `RetentionReasons`. Its policies — retention,
compression, file selection, chunking algorithm, before/after hooks — **attach per
directory and inherit**, which is the literal shape of "per-dir sync with version
control," already built.

So: *"save a version, label it, list versions, restore one, diff two, thin the
old ones, pin the ones that matter, run the quality scan around it"* — all of it
ships today, on R2, in one Go binary.

### 3. `jj` + blob storage is four backends, and colocation is half a repository

The `Backend` trait is genuinely cloud-shaped — async throughout, streaming
reads, and a `concurrency()` doc that says *"a cloud-backed backend may want to
set it to 100 or so."* But `StoreFactories` registers **five independent backend
kinds**, and only `GitBackend` is production-grade; `SimpleBackend` is labelled a
proof of concept by the maintainers. Putting `jj` on a bucket means implementing
`Backend`, `OpStore`, `OpHeadsStore`, and `IndexStore`, in Rust, against a
fast-moving upstream.

**And the finding that most affects §8.2:** a colocated repo splits in half.
Content lives in `.git/` and travels. **Change IDs, predecessors, and the entire
operation log live in `.jj/` and do not** — `GitBackend` stores them in a
`StackedTable` at `.jj/repo/store/extra/` precisely because git's model has
nowhere to put them. A git-only recipient gets the document and **a bit-reversed
commit ID instead of a stable change ID** — which is exactly the churn §8.2 cites
as git's failing.

§8.2 is not wrong. It is narrower than it reads: **`jj` is an excellent local
history engine for a single author, and its interchange story is git's, not its
own.** Also — `.jj/` holds lock files and mutable op-log heads, which makes it
strictly *worse* than `.git/` to blind-sync. The 2026-07-08 footgun applies
double.

### 4. Receive-only does not orphan the collaborator's edit

`augment-it`'s open question — *does `Receive Only` just relocate the conflict to
"collaborator edited, now it's silently orphaned"?* — is answered in the doc
comment at `lib/model/folder_recvonly.go`. The edit is scanned and flagged
`FlagLocalReceiveOnly`, sent outward with an **empty Version so no other device
is told it is behind**, counted by per-flag size accounting, and offered back as a
user-initiated **Revert**. Not lost, not propagated, **not silent**.

Option (C) of that exploration is sound as specified. The one honest caveat: the
visibility lives in Syncthing's own UI, which is an onboarding problem, not a data
problem.

### 5. Every file-sync system resolves conflicts by not resolving them

Seafile: `Q3-Update (SFConflict alice@example.com 2026-08-22-14-31-07).md`.
Syncthing: `Q3-Update.sync-conflict-20260822-143107-ABCD123.md`. Same answer,
different string. **A non-technical person receives two files with similar names
and no guidance.**

Only Automerge merges. And Automerge costs the filesystem — a document is a
`Map`/`List`/`Text` object graph, so `rg`, Obsidian, rclone, Chroma ingest, and
every agent that reads a directory stop working without an export step. There is
also **no truncate, compact, or GC anywhere in its API**; full history is retained
by construction.

**Therefore: structural asymmetry is not a compromise, it is the correct answer**
until someone actually needs two people editing one paragraph simultaneously.
Make one side read-only *structurally* — Syncthing folder type, Kopia's
`readonly` storage wrapper, a read-scoped R2 token, Seafile's server permission —
and the conflict cannot occur.

### 6. Nothing does all three layers on a bucket

The two entries that speak S3 natively (restic, Kopia) do not sync and leave no
plain tree. The two that leave a plain tree (`jj`, Syncthing) cannot reach a
bucket at all. The one that does everything (Seafile) puts the bucket behind a
paid licence and keeps no plain tree server-side.

**That gap is the finding.** It is also, precisely, the size of the thing worth
building.

## Where this points

Not a recommendation yet — this is an exploration and the tenancy, identity, and
`.flave`-vs-corpus questions below are genuinely open. But the option space has
narrowed to something nameable.

### The shape that survives the reading

**Transport:** rclone to R2 for the operator↔bucket leg (already decided,
already working). Syncthing with `receiveonly` folders for any human↔human live
mirror, per-client folder scoping, `receiveencrypted` if an always-on untrusted
hub is ever wanted. **Do not write this layer.**

**History:** a Kopia repository per client, beside `live/` in the same bucket.
Client's sentence → `--description`. `client=<slug>`, `kind=checkpoint|autosave`
→ `Tags`. "Keep this one" → `Pins`. Thin the rest with the retention policy and
`IgnoreIdenticalSnapshots`. **Do not write this layer either.**

**Legibility:** ours, and small. The gesture that says "save a version" without
saying commit; the sentence that goes with it; and the **feed** that renders
`Description` + `Stats` + a diff for someone who will not read a diff. This is
the product. It is also the entire answer to the invisible-progress motive, and
it is the only part no pinned reference supplies.

**And `live/` stays exactly as designed** — plain markdown in the bucket,
`rclone sync`-able, hand-recoverable with nothing installed. That property is
what makes adopting a history engine safe: if Kopia is ever wrong, `live/` is
still the corpus.

### The test that decides adopt-vs-write

> **If `live/` is canonical and history is a safety net → adopt.**
> **If history is canonical and `live/` is a projection of it → write it.**

The plan does not currently say which, and every downstream question depends on
it. Naming it is the next concrete step.

### On `.flave` — the assumption to break

The ask was *"this syncbox backend would be used as a package to `.flave`
document folders."* The reading suggests that is the wrong coupling:

- A `.flave` bundle is small, single-author, and wants **keystroke-grained undo
  of agent operations**. That is `jj`'s operation log, and §8.2 is right.
- A client corpus is 517 files and 156MB with PDFs, and wants **labelled
  checkpoints in a bucket with retention**. That is Kopia, and HISTORY was right
  about the shape while being wrong that it had to be hand-written.

These are different problems with different correct engines. **What they can share
is the surface, not the store** — the same "save a version" gesture, the same
`Description` field, the same feed — which is the knots-style
blueprint-and-copy-from pattern this tree already uses, not a package dependency
across three apps.

The contradiction between the two resolved decisions then dissolves: neither is
overturned; they were never answering the same question.

## Open questions — genuinely unresolved

1. **Is `live/` canonical?** The adopt-vs-write test above. Owner's call.
2. **Do we operate a Kopia binary in the deploy?** Adopting means a Go binary in
   the container, a repository format we do not control, and a `restore` step
   between bucket and human. Against ~250 lines of Python we already know how to
   write. The trade is only good if answer 1 is "`live/` is canonical."
3. **What renders the feed, and where does a client see it?** didi.sh surface?
   A per-client web view? An email digest? The whole legibility argument is
   theoretical until this has an address.
4. **Tenancy.** Bucket-per-client was the HISTORY answer and R2 tokens scope per
   bucket. Does a Kopia repository per client fit that cleanly, and does the
   client ever get a credential of their own?
5. **Does the client write at all, or only read?** Everything above assumes
   structural asymmetry. The original ask said *"I will want to automatically
   have the latest that they have,"* which is symmetric. If that is a real
   requirement rather than an aspiration, the conflict problem returns and none
   of the file-sync entries solve it.
6. **Binaries and the corpus.** PDFs are where content-defined chunking earns its
   keep and where whole-file sync is most wasteful. Not modelled here. If it
   turns out to be the hard part, `git-annex` and `Perkeep` are the references to
   pin next.

## Explicitly not covered

- No installation, credentials, or deployment of anything. Nothing here is stood
  up; `jj` and `rclone` are not even on the operator's PATH today.
- No decision on questions 1–6.
- No design for the feed surface, which is the part being argued as the real
  product.
- No treatment of the SurrealDB canonical layer. "Corpus access" and
  "canonical-layer access" remain different problems, as the 2026-07-17 doc said.

## Cross-references

- [`ai-labs/studies/sync-and-content-version-control`](../../studies/sync-and-content-version-control) — the study, six pinned references, one profile each
- `ai-labs/corpora-builder/context-v/plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History.md` — the HISTORY decision and the unbuilt Phase 4
- `ai-labs/flave-ai/context-v/specs/Master-Flave-An-Agent-Native-Document-Format-and-Publisher.md` §8.2, §8.4 — the `jj` decision and the collaboration staging
- `ai-labs/augment-it/context-v/explorations/Syncthing-For-Collaborator-Access-To-The-Corpus.md` — two of its open questions close here
- `self-host-stack/context-v/explorations/Instantly-Synced-Team-Folder-Nextcloud-vs-Alternatives.md` — where Seafile and Syncthing were first weighed
- [[Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge]] — the substrate thread this inherits from

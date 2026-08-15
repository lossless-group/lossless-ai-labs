---
title: "Corpora-Builder MVP — R2-Native Storage With Application-Level Checkpoint History"
lede: "Four decisions taken 2026-08-08 end the recurring stall: Python core, R2-native behind a storage seam, reach-edu as the proving corpus, Tauri as the destination. R2 has no object versioning — which means the blob choice determines the version-control design rather than competing with it. The answer is a live browsable tree plus a content-addressed object store with checkpoint manifests: git's model, minus git, on a substrate that has neither."
date_authored_initial_draft: 2026-08-08
date_authored_current_draft: 2026-08-08
date_last_updated: 2026-08-08
at_semantic_version: 0.0.0.1
status: Draft
publish: false
category: Plan
augmented_with: Claude Code on Claude Opus 5 (1M context)
authors:
  - Michael Staton
tags:
  - Plan
  - Corpora-Builder
  - Storage-Substrate
  - Cloudflare-R2
  - Version-Control
  - Content-Addressed-Storage
  - Tauri
  - MVP
from: "corpora-builder"
from_path: "context-v/plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History.md"
---
# Corpora-Builder MVP — R2-Native With Checkpoint History

## Why this plan exists

corpora-builder has three design documents and zero lines of code. Every prior
attempt stalled on the same two words — *blob storage* and *version control* —
and the operator's own diagnosis is that this was never a difficulty problem:
**it was a decision problem.**

This plan takes the decisions and sequences the build.

### The scope correction that shapes everything

An earlier framing had corpora-builder's first job be *schema reconciliation* —
making augment-it, memopop, and strategy-curator agree on one source-file
format. That is deferred. The operator's stated need is narrower and more
urgent:

> *"We don't need to make it consumable by the other ai-labs apps yet. I just
> want to get something running as I keep running into the need to create
> corpora."*

So corpora-builder v0 is **a tool the operator runs to build corpora.** It
adopts the schema from [[Source-File-Schema-Reconciliation]] because that
schema is good and already paid for — not as a treaty three apps must sign.
Cross-app adoption is a later phase, and nothing in this plan depends on it.

The consequence for sequencing: **capture is the first runnable artifact**, not
the quality scan. The itch is *"I have a link and I need it in a corpus."*

## The four decisions (2026-08-08)

Named, not numbered — these get referred to by name throughout this plan and in
later sessions.

| Decision | Question | Chosen |
|---|---|---|
| **TARGET** | What is v0 | **The real target — remote-first, Tauri as the destination.** Not a schema kit, not a local-only app. |
| **SUBSTRATE** | Where the bytes live | **R2-native behind a storage interface.** Option B from [[Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge]] Thread 4 — promoted from "lean, for discussion" to decided. |
| **PROVING-CORPUS** | What we test against | **augment-it's `clients/reach-edu/corpus/`** — 517 markdown files, 57 funder dirs, 140 in inbox, 156MB. |
| **LANGUAGE** | What it's written in | **Python** (`uv`, per the ai-labs convention). |

### HISTORY — the decision that made itself

**R2 does not support object versioning.** Verified against Cloudflare's S3
compatibility matrix: `PutBucketVersioning` and `GetBucketVersioning` are
unimplemented, `ListObjectVersions` is absent, `versionId` on `GetObject` is
unsupported, and object lock (`x-amz-bucket-object-lock-enabled`) is likewise
not implemented. Lifecycle rules exist but lack the versioning-dependent
actions.

This is why blob storage and version control kept feeling like one unsolvable
knot: **they are one problem, and SUBSTRATE determines the answer.** Once the
object store is primary and the object store has no history, version control
must be application-level. There is nothing left to choose.

**HISTORY: version control is a content-addressed object store plus checkpoint
manifests, written by corpora-builder into the same bucket.** Git's data model,
minus git, on a substrate that has neither.

### The option parked, not dismissed — a snapshotting filesystem on a VM

W2 of the operator wishlist put **BTRFS, JuiceFS, and git-native content
engines** on the table alongside plain blob storage, and noted that choosing one
makes containerized deployment mandatory rather than optional. That option was
dropped from the decision set above by omission, not by argument. Correcting
that here, because it is a genuinely reasonable alternative and it will come
back.

**The case for it is strong and should be stated plainly:** the HISTORY design
above is a hand-rolled reimplementation of copy-on-write filesystem snapshots.
BTRFS gives snapshots in O(1), browsable as directories, restorable with `cp`,
with block-level dedup available out-of-band via `duperemove`. ZFS gives the
same plus `zfs send`, which makes off-host snapshot backup a first-class
operation. On either, `CorpusStore` collapses to plain `pathlib` and every tool
in the tree — `rg`, git, rclone, Obsidian, the augment-it scripts — works with
no adapter at all.

**Why it is parked anyway:** it requires operating a host. Disk to provision and
grow, snapshot retention to police, and backups *of the snapshots* — because
snapshots share a disk with the data and are therefore not a backup. R2 needs
none of that and was already stood up and credential-verified on 2026-06-18.

Against that ongoing cost, the corpus's actual access patterns do not ask for
POSIX. Capture writes one file; the scan reads 517; Chroma ingest reads all;
retrieval hits an index rather than files. No mmap, no locking, no in-file
random access. The one real POSIX need is the operator wanting to `rg` the
corpus and open it in an editor — and rclone already delivers that as genuine
local files, which is precisely what
[[JuiceFS-Pinned-Path-Off-Local-Substrate]] chose over a live mount in June.

A VM today would therefore sit in the middle: a host to operate, without yet
serving a need one of the two ends does not already cover.

**The trigger that brings it back** — the same clause JuiceFS was deferred
under, which has still not fired:

- **Deployment stops being optional** (Phase 7's containerized surface), or
- **a second person edits a corpus concurrently**, making single-writer
  discipline untenable, or
- **the corpus outgrows a laptop**, making local-first mirrors impractical.

**Why being wrong is cheap.** This is what the `CorpusStore` seam exists for. A
`PosixStore` is a near-trivial implementation, and the checkpoint layer swaps
from CAS-manifests to filesystem snapshots behind an unchanged `checkpoint()`
call — the application never learns which substrate it is on. The sunk cost of
reversing is roughly 250 lines of Python, not a migration.

**Standing instruction:** when Phase 7 begins, re-open this section before
choosing a host. A snapshotting filesystem and a containerized deploy are the
same decision, and Phase 7 is where it gets made.

## Bucket layout — the whole design in one diagram

```
r2://corpora-<workspace-slug>/
  live/                                  # the browsable, hand-recoverable tree
    <domain-type>/<domain-slug>/
      index.md                           # the domain definition
      sources/2026-08-08_some-title.md
      sources/2026-08-08_some-title.pdf  # binary sibling, named to match
    inbox/
      2026-08-08_untriaged-thing.md
  objects/<ab>/<sha256>                  # immutable, content-addressed blobs
  checkpoints/2026-08-08T17-04-00Z.json  # manifest: path -> sha256, + label
  HEAD.json                              # pointer to the current checkpoint
```

Five properties this buys, each answering a constraint that previously felt in
conflict:

1. **`live/` is a real markdown tree.** `rclone sync r2:corpora-x/live ./corpus`
   reconstitutes a hand-editable corpus at any moment, with no corpora-builder
   installed. **Constraint 1 (files-as-truth, hand-recoverable) survives going
   R2-native** — which was the objection the system-design doc raised against
   letting the object store become primary. It is answered by writing the live
   tree as ordinary bytes at ordinary paths.
2. **`objects/` + `checkpoints/` give real history** on a store with none.
   Restore is: read a manifest, write those blobs back into `live/`.
3. **Checkpoints are nearly free.** Content addressing dedups automatically — a
   checkpoint of a 156MB corpus in which three files changed writes three
   objects. History cost tracks *edits*, not corpus size.
4. **"Save a version" never says "commit."** W1's hidden-command-layer
   requirement is satisfied by construction rather than by hiding git behind a
   UI. There is no git to hide.
5. **The cache is trivially correct.** Content-addressed objects are immutable,
   so a local read-through cache keyed by sha256 never needs invalidation —
   which is what makes a 517-file scan tolerable over a network store.

**Cost sanity check:** 156MB live + ~156MB initial objects ≈ 312MB. At R2's
~$0.015/GB-month that is well under a cent per month, with zero egress. Storage
cost is not a design input here.

### Tenancy

**One bucket per workspace.** R2 API tokens scope to buckets, which makes
bucket-per-client the *structural* isolation boundary that
[[Per-Client-Privacy-and-the-Path-Off-Local]] argued for — the legible answer
to "where does our data sit" is "its own bucket, and only your workspace's
credentials can read it."

`workspace_slug` is a config constant in v0. It is threaded through every store
call from day one so that wiring [[Id-Didi-Sh-Identity-Service|didi.sh]]
workspaces later (W7) is a swap, not a rewrite. **This plan does not block on
didi.sh.**

> **Verify at implementation:** confirm R2 API token scoping is per-bucket in
> the current Cloudflare dashboard before committing to bucket-per-client. If
> tokens turn out to be account-scoped only, fall back to prefix-per-client and
> record the downgrade here.

## Repository shape

```
corpora-builder/
├── core/                          # the Python package — `corpora`
│   ├── pyproject.toml             # uv-managed
│   ├── src/corpora/
│   │   ├── store/
│   │   │   ├── base.py            # CorpusStore ABC — the seam
│   │   │   ├── local.py           # LocalFsStore
│   │   │   ├── r2.py              # R2Store (boto3, S3 API)
│   │   │   └── cached.py          # read-through sha256-keyed cache
│   │   ├── model/
│   │   │   ├── frontmatter.py     # round-trip YAML, preserves unknown keys
│   │   │   ├── source.py          # SourceFile
│   │   │   └── domain.py          # Domain (type, slug)
│   │   ├── capture/
│   │   │   ├── from_url.py        # link-first
│   │   │   ├── from_file.py       # file-first, link-recovered (W3)
│   │   │   ├── binary.py          # sibling download, sha256, size cap
│   │   │   └── naming.py          # filename grammar + collision suffix
│   │   ├── history/
│   │   │   ├── cas.py             # objects/
│   │   │   └── checkpoint.py      # checkpoints/, HEAD.json
│   │   ├── scan.py                # quality scan
│   │   └── cli.py
│   └── tests/
├── app/                           # Tauri shell — Phase 7
├── context-v/
├── changelog/
└── splash/
```

## Phases

### Phase 0 — Scaffold and record the decisions

- `uv` project under `core/`, pytest, ruff.
- Write `context-v/decisions/` (or `explorations/`) entry recording all five
  decisions above, and
  amend [[Corpora-Builder-System-Design]] Tension 3 from open to resolved.
- Amend [[Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge]] Thread 4:
  option B chosen, with the R2-no-versioning finding as the reason the
  version-control half resolves along with it.

**Done when:** `uv run pytest` passes on an empty suite and the decisions are on
disk where the next session finds them.

### Phase 1 — The storage seam

`CorpusStore` ABC: `read`, `write`, `exists`, `stat`, `list(prefix)`, `delete`.
Three implementations: `LocalFsStore`, `R2Store`, and `CachedStore` (a
read-through decorator).

**Done when:** the reach-edu corpus round-trips into a dev bucket and back out
byte-identical, and the same test suite passes against both `LocalFsStore` and
`R2Store` with no test-side branching.

### Phase 2 — Model and frontmatter

`SourceFile` as a pydantic model of the canonical schema from
[[Source-File-Schema-Reconciliation]]. Two behaviours are non-negotiable and
both are lessons already paid for elsewhere in the tree:

- **Round-trip preserves unknown keys.** memopop learned this expensively on
  2026-08-08: a save payload omitting `sensitivity` plus a serializer that
  emitted only known keys silently stripped the field governing external
  citability from 8 sources.
- **Detect stranded content past the closing fence.** A stray `---` mid-file
  truncated ImmuneCo's frontmatter on 2026-07-14 and hid 13 of 93 sources from
  every consumer for three weeks. Grep found them; the parser did not. This is a
  loud validation error, not a warning.

**Done when:** every one of reach-edu's 517 files parses, and files that
round-trip through the writer are byte-identical modulo deliberate edits.

### Phase 3 — Capture, link-first *(the first thing that scratches the itch)*

```bash
corpora add <url> --domain topic/ocean-energy      # metadata-only, cheap
corpora add <url> --domain topic/ocean-energy --fetch   # + full body
```

Jina fetch for metadata and body, two-tier per constraint 3, binary sibling
download with sha256 and `download_status` recorded even on failure, canonical
`<YYYY-MM-DD>_<slug>.md` naming with collision suffix, written through the store
into `live/`. Unresolved items land in `live/inbox/`.

**Done when:** the operator can add a link to a corpus from the terminal and the
file appears in R2, correctly named and framed. **From this point corpora-builder
is useful daily**, and every later phase is improvement rather than prerequisite.

### Phase 4 — Checkpoint history

`corpora checkpoint "<label>"`, `corpora log`, `corpora restore <id>`,
`corpora diff <id> <id>`. Implements `objects/`, `checkpoints/`, `HEAD.json` per
the HISTORY decision.

**Done when:** a checkpoint over reach-edu's 156MB completes, a subsequent
checkpoint after editing three files writes exactly three new objects, and
restore reproduces the earlier tree byte-identically.

### Phase 5 — Capture, file-first (W3)

Drag in a PDF with no URL: extract title/author, reverse-search for the
canonical link, confirm metadata, then file. Unresolved objects park in the
inbox. This is the inverse of Phase 3 and the operator wishlist item most likely
to be reached for in practice.

### Phase 6 — Quality scan

Generalize the ten metrics already specified in
[[First-Pass-Corpus-Quality-Scan-for-reach-edu]] into a re-runnable
`corpora scan` that emits both the human report and the machine-diffable
metrics JSON. Runs against a `CorpusStore`, so local and R2 are the same code
path.

**Done when:** the scan runs against reach-edu and its numbers reconcile with
the 2026-06-18 baseline — making that baseline's before/after promise real for
the first time.

### Phase 7 — Surfaces: FastAPI sidecar + Tauri shell

Copy the memopop-native architecture wholesale — it is proven in-tree: Rust
`SidecarManager` lazy-spawns `.venv/bin/python -m src.server`, polls `/healthz`,
respawns on death; webview talks to the sidecar over `localhost`; SSE goes
direct. Per [[Design-Front-Loading-and-the-Fable-Build-Loop]], `DESIGN.md`
exists before the first component, with two-tier tokens and the three-mode
contract from day one.

Two gotchas already recorded in memopop's handoff, inherited free: **Tauri
capability changes need a full dev restart** (Vite HMR will not pick up an ACL
edit, and the failure mode looks exactly like the feature silently not working),
and **the Rust `api_dispatch` is an allowlist whose fallback is `not_found`**, so
every new sidecar route needs an explicit entry.

## What this plan deliberately does not do

- **No cross-app schema adoption.** augment-it and memopop keep their own
  writers untouched. Revisit only when corpora-builder has proven itself on the
  operator's own workflow.
- **No didi.sh dependency.** `workspace_slug` is a constant; identity wiring is
  a later swap.
- **No SurrealDB.** Files are the truth; the queryable index layer (W4) waits
  until there is enough corpus motion to justify it.
- **No snapshotting filesystem on a VM.** Parked with an explicit trigger, not
  dismissed — see "The option parked, not dismissed" above. Re-open it at
  Phase 7, when host choice and substrate choice become one decision.
- **No corpus relocation.** reach-edu's corpus is *mirrored up* to a dev bucket
  as a proving fixture. It is not moved out of augment-it, and augment-it's
  pipeline continues reading it where it sits. Client data does not migrate as
  a side effect of a tooling build.

## Open questions

1. **R2 API token scoping granularity** — per-bucket assumed; verify before
   locking bucket-per-client (flagged inline above).
2. **Who writes to `live/` besides corpora-builder?** If augment-it's
   content-ingest eventually writes to the same bucket, the single-writer
   assumption behind checkpoints needs revisiting. Not a v0 concern — v0 has one
   writer.
3. **Checkpoint cadence.** Manual-only (`corpora checkpoint`) in v0. W1 also
   asks for continuous Dropbox-style sync; whether that means auto-checkpoint on
   idle, or sync-without-checkpoint plus explicit save moments, is a UX question
   that wants the Tauri surface to exist before it is answered.
4. **Does the inbox live inside `live/` or beside it?** Drawn inside above,
   which makes it checkpointed like everything else. Correct by default —
   flagged in case triage volume argues otherwise.

## Related

- [[Corpora-Builder-System-Design]] — the tensions this plan resolves (Tension 1 → app; Tension 3 → R2-native).
- [[Source-File-Schema-Reconciliation]] — the schema adopted here, minus the cross-app treaty.
- [[Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge]] — Thread 4, whose option B is now decided.
- [[JuiceFS-Pinned-Path-Off-Local-Substrate]] — why not JuiceFS; the still-valid R2 credential recipe.
- [[First-Pass-Corpus-Quality-Scan-for-reach-edu]] — the ten metrics Phase 6 generalizes.
- [[Design-Front-Loading-and-the-Fable-Build-Loop]] — the design-system discipline Phase 7 inherits.
- `memopop-ai/context-v/handoffs/2026-08-08-Source-Approval-Shipped-Enforcement-Unrun.md` — the frontmatter failures Phase 2 defends against.

---
title: "Storage Seam — one interface, three implementations, and the workspace that names the bucket"
lede: "A CorpusStore over local, R2, and cache, proven by one conformance suite that runs against every backend with no test-side branching."
date_created: 2026-08-08
date_modified: 2026-08-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Draft
spec_reference: "[[../plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History]] — Phase 1"
tags:
  - Spec
  - Corpora-Builder
  - Storage-Substrate
  - Cloudflare-R2
  - Identity
  - Phase-1
site_uuid: 9761a313-bc42-4cef-a20c-7e98a2bb0a9b
hex_code: y3v71z
date_authored_initial_draft: 2026-08-08
date_authored_current_draft: 2026-08-08
publish: true
from: "corpora-builder"
from_path: "context-v/specs/Storage-Seam.md"
---
# Storage Seam

## Why Care?

The SUBSTRATE decision put the object store first: R2 is where corpus bytes
live, reached over the S3 API. But that decision is only survivable because it
sits behind an interface. Two things depend on the seam existing before anything
is built on top of it:

1. **The parked filesystem option.** BTRFS/ZFS on a VM was deferred with an
   explicit re-open trigger at Phase 7. That deferral is only cheap if
   `PosixStore` is a later implementation rather than a migration. The seam is
   what makes being wrong about R2 cost ~250 lines instead of a rewrite.
2. **Everything downstream reads and writes through it.** Capture, checkpoint
   history, and the quality scan are all defined in the plan as operating over a
   `CorpusStore`. Getting the interface wrong is expensive in a way that getting
   an implementation wrong is not.

The load-bearing test is `STORE-11`: **one conformance suite, every backend, no
branching in the tests.** A seam whose test suite has to know which
implementation it is talking to is not a seam.

## Scope

**In:** the `CorpusStore` interface; `LocalFsStore`; `R2Store` over the S3 API;
`CachedStore` as a read-through decorator; the `WorkspaceResolver` interface with
a static-config implementation; bucket naming derived from workspace identity.

**Out:** the `live/` vs `objects/` vs `checkpoints/` layout (that is Phase 4 —
this phase is bytes at keys, nothing about what the keys mean); frontmatter
parsing (Phase 2); anything that fetches from the network other than R2 itself;
didi.sh network integration (see
[[What-Corpora-Builder-Needs-From-didi-sh]] — the seam lands now, the wiring at
Phase 7).

## Behaviour

1. `CorpusStore` is an abstract base class with six operations: `read`, `write`,
   `exists`, `stat`, `list`, `delete`. Keys are `/`-separated strings, never
   `Path` objects — the object store has no directories and the interface should
   not pretend otherwise.
2. `read` on a missing key raises `KeyNotFound`, never returns empty bytes. A
   silent empty read is how a corrupted corpus looks healthy.
3. `write` replaces any existing value at that key. Overwrite is not an error.
4. `list(prefix)` returns full keys under the prefix, recursively, sorted. It
   does not simulate directory listing.
5. `stat` returns size in bytes and a content hash the store can compute cheaply.
6. Bytes are bytes. Any payload that survives a round-trip on one backend
   survives it on all of them — including non-UTF-8 binary (PDFs are the point)
   and non-ASCII characters in keys.
7. `CachedStore` wraps any other store with a local read-through cache. A second
   read of unchanged content does not reach the backing store. A write
   invalidates that key.
8. `WorkspaceResolver` returns a workspace identity — slug, display name, and
   **its storage location (bucket + prefix)**. `StaticWorkspaceResolver` reads
   it from config. Nothing outside a resolver names a bucket or a prefix, so
   swapping in a didi.sh-backed resolver later changes no call site.
9. A store may be scoped to a key prefix. Scoping is transparent: callers pass
   unprefixed keys and `list` returns unprefixed keys. This is what lets a
   corpus share a bucket a client already uses for other things.

> **Amended 2026-08-08, during implementation.** Behaviour 8 originally said the
> bucket was *derived* as `corpora-<slug>`. First contact with the real account
> disproved it: the corpus lives in bucket `reach-edu` under prefix `corpora/`.
> Buckets are provisioned by people, sometimes before this tool existed, so a
> derivation rule cannot be the source of truth — it survives only as the
> default for newly provisioned workspaces (`WORKSPACE-03`). The spec was wrong;
> the test was not weakened to fit the code.

## Tests

| ID | Given / When / Then |
|---|---|
| `STORE-01` | Given a store and a key, when bytes are written and then read, then the bytes returned are identical to those written |
| `STORE-02` | Given a store, when `read` is called for a key never written, then `KeyNotFound` is raised — not empty bytes, not `None` |
| `STORE-03` | Given a store, when `exists` is called before and after a write to the same key, then it returns `False` then `True` |
| `STORE-04` | Given keys written under two different prefixes, when `list` is called with one prefix, then only keys under that prefix are returned, sorted |
| `STORE-05` | Given a key written at a nested path, when `list` is called with a parent prefix, then the full key is returned — listing is recursive, not one level |
| `STORE-06` | Given an existing key, when `delete` is called, then `exists` returns `False` and a subsequent `read` raises `KeyNotFound` |
| `STORE-07` | Given written bytes, when `stat` is called, then it reports the correct byte length and a content hash that changes when the content changes |
| `STORE-08` | Given a key holding one value, when a different value is written to the same key, then a read returns the new value and no error was raised |
| `STORE-09` | Given a non-UTF-8 binary payload containing null bytes, when it is written and read back, then the bytes are identical — PDFs must survive |
| `STORE-10` | Given a key containing non-ASCII characters and spaces, when bytes are written and read back at that key, then the round-trip succeeds and `list` returns the key unchanged |
| `STORE-11` | Given the conformance suite above, when it runs against `LocalFsStore` and `R2Store` in turn, then every test passes against both with no implementation-specific branching in the test bodies |
| `STORE-12` | Given a `CachedStore` over a counting backing store, when the same key is read twice, then the backing store is read exactly once |
| `STORE-13` | Given a `CachedStore` that has cached a key, when that key is written through the cache and then read, then the new value is returned — a stale cache never wins |
| `STORE-14` | Given the PROVING-CORPUS on disk, when every key is copied through a store and read back, then the file count matches and every file's sha256 is unchanged |
| `WORKSPACE-01` | Given a static resolver configured with a workspace slug, when the workspace is resolved, then the slug and display name are returned |
| `WORKSPACE-02` | Given a workspace resolved from config, when its storage location is read, then the bucket comes from the workspace record rather than a derivation — reality: `reach-edu`, not `corpora-reach-edu` |
| `WORKSPACE-03` | Given a workspace with no bucket recorded, when it is resolved, then it gets the provisioning default `corpora-<slug>` |
| `WORKSPACE-04` | Given a store scoped to a prefix, when a key is written and listed, then the caller sees the unprefixed key and the object lands under the prefix — the prefix is invisible above the seam |

**Not in the automated suite, run deliberately:**

- **Real R2.** `STORE-11` runs `R2Store` against `moto`'s in-process S3 so the
  suite stays offline and fast. A real-bucket run is gated behind
  `CORPORA_R2_LIVE=1` and executed by hand — moto proving an S3 client correct
  is not the same as R2 accepting it.

  > **Run 2026-08-08 against `reach-edu/corpora/`: all ten conformance
  > behaviours passed identically to moto.** No divergence found — including the
  > two most likely to differ, non-UTF-8 binary with null bytes (`STORE-09`) and
  > non-ASCII keys with spaces (`STORE-10`). 38 tests, 16s wall clock against
  > ~1s for moto. Every write was scoped to a unique `corpora/_conformance/<uuid>/`
  > prefix and swept on teardown; the bucket was verified clean afterwards, since
  > `reach-edu` is client-owned.
- **The reach-edu round-trip.** The plan's acceptance is that the PROVING-CORPUS
  (517 files, 156MB) round-trips byte-identically. It depends on a sibling repo
  being present, so it is gated behind a path env var rather than assumed.
  Read-only against `augment-it/clients/reach-edu/corpus/`; writes go to the dev
  bucket only, per the Autonomy-Gates RED list.

## Acceptance

```
uv run python scripts/spec_status.py --spec Storage-Seam --require-green
```

exits 0, `bash scripts/check.sh` passes its blocking rungs, the two deliberate
runs above have been done, and the operator has walked it (Gate 4).

## Open questions

1. **Does `stat` need a modification time?** Not needed by Phase 4 — checkpoints
   key on content hash, not mtime — so it is omitted rather than guessed. Add it
   when something asks.
2. **Cache eviction.** `CachedStore` has none in this phase. The corpus is
   156MB and disks are large; a bound can be added when a corpus outgrows one.
   Noted so its absence is a decision, not an oversight.
3. **Concurrent writers.** The design assumes one writer, which is true while
   corpora-builder is single-operator. Named here because it is the same
   assumption whose failure re-opens the parked filesystem option.

## Related

- [[../plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History]] — Phase 1, and the parked-filesystem trigger this seam protects
- [[../loops/Spec-to-Shipped-With-TDD]] — the loop this runs through
- [[../contracts/Autonomy-Gates]] — the RED list this phase's dev-bucket-only rule comes from
- `id-didi-sh/context-v/explorations/What-Corpora-Builder-Needs-From-didi-sh.md` — why `WorkspaceResolver` is a seam and not a client

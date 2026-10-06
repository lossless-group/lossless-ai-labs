---
title: "Binary Ingest and the bin/ Store — one copy, optimized, fetched on demand"
lede: "78 files are 90.5% of the corpus bytes. Compress once, store once by hash, fetch when asked, delete locally without fear."
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.3.0
status: Draft
spec_reference: "[[../../../context-v/plans/Sync-Corpora-to-R2-and-Show-Clients-What-Changed]]"
tags:
  - Spec
  - Corpora-Builder
  - Binary-Assets
  - Content-Addressed-Storage
  - PDF
site_uuid: b45d5098-b08d-4fff-ac61-b5648622f24e
hex_code: mmz3kp
publish: true
from: "corpora-builder"
from_path: "context-v/specs/Binary-Ingest-And-Bin-Store.md"
---
# Binary Ingest and the `bin/` Store

## Why Care?

The reach-edu corpus is **1,715 text files and 78 binaries**, and the binaries
are **90.5% of the bytes** — 282 MB against 30 MB. That ratio causes every
storage problem this project has:

- It is why the repo needs **Git LFS**, which is why **jj corrupted it** on
  2026-08-22 (jj runs no smudge/clean filters; one save rewrote 78 pointers into
  282 MB of real bytes).
- It is why **half the bytes are duplicated** — `corpus/` and
  `2026-07-28_corpus/` hold the same 34 PDFs, byte-identical, because a snapshot
  was the only way to share work before the R2 mirror existed.
- It is why a four-year-old MacBook Air is a constraint at all.

And almost none of those bytes are earning their place. **The Bloomberg annual
report is 38 MB**; at Ghostscript `/ebook` it is **9.1 MB with its text layer
byte-for-byte intact**. Publishers have no incentive to optimize; we pay for it
forever, in every copy.

Three moves fix all of it, and they compose:

| | Result |
|---|---|
| Optimize on ingest | 282 MB → ~70 MB |
| Store once by content hash | → ~35 MB (the duplicates collapse) |
| Fetch on demand | → **~0 MB baseline** |

**The deeper reason, though, is not storage.** Under content addressing a binary
**cannot conflict** — a changed PDF is a different hash, therefore a different
object, and two people can never disagree about `bin/3f/3f2a….pdf`. That
collapses the entire multi-writer conflict problem onto text, which is the only
place merge actually works. The text/binary split is architecture, not a
size optimization.

## Scope

**In:** PDF optimization at capture with a text-layer invariant; the
`bin/<ab>/<sha256><ext>` content-addressed store; the frontmatter join carrying
both hashes; `fetch` / `evict` / `verify` verbs; the migration for the 78
existing binaries.

**Out:**

- **Non-PDF optimization.** `docx`/`pptx`/`xlsx` are reserved in `.gitattributes`
  but none exist yet. They go in `bin/` unoptimized until one shows up.
- **Removing LFS or introducing jj.** Consequences of this spec, not part of it.
  Sequenced in the plan.
- **The client-facing download UI.** This spec defines the *states* a surface
  renders; Phase 3 builds the surface.
- **Any change to text handling.** Markdown, JSON and YAML are untouched.

## Behaviour

1. **The key is the content hash.** A binary is stored at
   `bin/<first-two-hex>/<sha256><ext>` — the same two-hex fan-out as `restic`,
   `Kopia`, and the parked HISTORY design. Identical content stored twice
   produces one object, with no dedup logic.

2. **Optimization happens once, at ingest, before hashing.** What is stored is
   the optimized artifact, so its hash addresses what you will actually retrieve.
   Ghostscript `/ebook` (150 DPI) is the default: measured at **24% of original**
   on the real corpus, still sharp full-screen. `/screen` is 72 DPI and too soft
   for desktop reading.

   **Optimization must be deterministic.** Ghostscript embeds a creation
   timestamp, a document `/ID`, and XMP metadata, so two runs over the same input
   produce different bytes and therefore different keys. Three flags remove all
   three sources — `-dOmitInfoDate=true -dOmitID=true -dOmitXMP=true` — and were
   measured to give byte-identical output across runs. Without them a migration
   cannot be re-derived, which is how 24 orphan objects were created on
   2026-08-22 ([[../issues/Orphaned-Bin-Objects-From-A-Half-Migration]]).

3. **The text layer is an invariant, not a hope.** Extract text before and after.
   If the post-optimization text length falls below **98%** of the original, the
   optimization is **rejected** and the original bytes are stored. A corpus
   grounds factual claims; an optimization that costs extraction is not a
   saving.

4. **A scanned PDF is never optimized.** If the original yields fewer than
   **200 characters** of extractable text, the images *are* the content and
   downsampling destroys it. Store the original.

5. **Optimization never loses provenance.** The wrapper records the *original*
   alongside the stored one:

   | field | meaning |
   |---|---|
   | `binary_key` | `bin/3f/3f2a….pdf` — what is stored, what you can fetch |
   | `binary_sha256` / `binary_bytes` | the stored (possibly optimized) artifact |
   | `source_sha256` / `source_bytes` | **what the publisher actually served** |
   | `optimized` | `true` when the two differ, `false` when stored verbatim |

   Without `source_sha256`, "here is the source" points at something we altered
   and cannot prove was faithful. This extends the existing `BinaryAsset`
   (`src/model/source.py:112`), which already carries `sha256` and `bytes`.

6. **`bin/` is written once and never rewritten.** No re-compression, no
   re-packing, no zipping. An object at a hash key is immutable by construction,
   so any process that touches it again is a bug.

7. **Verification never downloads.** `CorpusStore.stat()` returns size and
   content hash; a binary is verified present-and-intact by comparing that
   against the wrapper. Walking 78 binaries costs 78 `stat` calls and no bytes.

8. **Absent is a first-class state, not an error.** A binary that is referenced
   but not local reports **`not_downloaded`** with everything needed to get it —
   key, size, and where it lives. It does not raise, and it does not silently
   fetch. *(Operator decision, 2026-08-22: "Fail with a clear 'not downloaded,
   click to get'.")*

9. **Eviction is safe by construction, and checked anyway.** `evict` deletes a
   local copy only after confirming the remote holds the same hash — the
   `numcopies` rule from [[Profile__Git-Annex]], whose unsafe-drop message is the
   whole safety model in one paragraph. Refuses, with a reason, when it cannot
   verify.

10. **Missing binaries never degrade retrieval.** Every binary has a wrapper
    `.md` carrying its extracted text and metadata, and that is what agents and
    Chroma read. A binary is the **human-verifiable original**, so absence costs
    a human a click and costs an agent nothing.

11. **Migration is additive and reversible.** Existing binaries are hashed into
    `bin/` and their wrappers updated. **Originals are not deleted by this spec.**
    Removing them is a separate, explicitly-confirmed step, per the RED-list rule
    on deleting corpus content.

12. **Storing an object and writing its pointer are one operation.** A binary in
    `bin/` that no wrapper references is garbage, not progress — and because
    optimization is lossy in *identity* as well as bytes, an unreferenced
    optimized object cannot be traced back to its source. Migration writes the
    wrapper in the same pass, or it has not migrated anything.

13. **Both copies are stored.** The optimized artifact is the working copy and
    what `binary_key` points at; the publisher's original stays retrievable at
    its own content key. *Operator, 2026-08-22: "there's usually no use for it.
    But every once in a while there might be a need to access the original."*
    That only holds if it is actually there. Cost is the sum of both, which the
    local cache does not pay — a fetch takes the working copy unless asked
    otherwise.

14. **A wrapper is patched, never re-rendered.** `SourceFile.parse()` →
    `render()` is a re-serialization: it reorders keys, normalises quoting,
    coerces timestamps, and drops nested keys the dataclass does not model. Run
    over 34 real wrappers it produced **250 discrepancies**, including dropping
    `binary_asset.content_type` and `size_bytes`. Migration edits the lines it
    means to edit and leaves every other byte alone, and the property is
    checkable, and the check is the gate: **the diff is additions only.** Across
    the real 34 that measured 119 lines added, 0 removed, 0 pre-existing values
    changed, and every body byte-identical.

15. **An existing key is never redefined.** `sha256`, `size_bytes` and
    `content_type` keep the meanings the corpus already gave them — the
    publisher's file. The optimized artifact gets *new* names,
    `optimized_sha256` / `optimized_bytes`. A key whose meaning silently changes
    is worse than a missing key: nothing can tell which era a file is from.

16. **Migration is idempotent by memory, not only by re-derivation.** A file
    whose sibling wrapper already carries a `binary_key` with a matching
    `source_sha256` is **skipped** — not re-read, not re-optimized, not
    re-uploaded. Determinism (Behaviour 2) makes re-derivation *safe*; this rule
    makes it *unnecessary*, which is what keeps a second run cheap and a
    thousand-file corpus tractable.

## Tests

| ID | Given / When / Then |
|---|---|
| `BIN-01` | Given bytes and an extension, when a key is derived, then it is `bin/<first-two-of-sha256>/<sha256><ext>` and is stable across calls |
| `BIN-02` | Given the same bytes ingested twice under different filenames, when both are stored, then one object exists and both wrappers reference the same key |
| `BIN-03` | Given a text-bearing PDF, when it is ingested with optimization enabled, then the stored bytes are smaller than the source and the wrapper records `optimized: true` |
| `BIN-04` | Given a text-bearing PDF, when it is optimized, then extracted text length is at least 98% of the original's |
| `BIN-05` | Given a PDF whose optimization would drop text below the threshold, when it is ingested, then the **original** bytes are stored and `optimized` is `false` |
| `BIN-06` | Given a scanned PDF yielding under 200 characters, when it is ingested, then optimization is skipped and the original is stored |
| `BIN-07` | Given an optimized ingest, when the wrapper is read, then `source_sha256` and `source_bytes` describe the publisher's file and differ from `binary_sha256`/`binary_bytes` |
| `BIN-08` | Given a verbatim ingest, when the wrapper is read, then `source_sha256` equals `binary_sha256` and `optimized` is `false` |
| `BIN-09` | Given a stored binary, when it is verified, then the check uses `stat` only and reads no object bytes |
| `BIN-10` | Given a wrapper whose `binary_key` is absent from the store, when it is verified, then the result reports `missing` for that key rather than raising |
| `BIN-11` | Given a stored binary whose bytes have been altered, when it is verified, then the result reports a hash mismatch rather than passing |
| `BIN-12` | Given a binary present remotely but not locally, when its status is read, then it reports `not_downloaded` carrying key and size, and nothing is fetched |
| `BIN-13` | Given a `not_downloaded` binary, when it is fetched, then it becomes present locally and its sha256 matches `binary_sha256` |
| `BIN-14` | Given a local binary whose hash is confirmed present remotely, when it is evicted, then the local copy is gone, the wrapper is unchanged, and a later fetch restores identical bytes |
| `BIN-15` | Given a local binary that cannot be confirmed remotely, when eviction is attempted, then it is refused with a stated reason and the local copy survives |
| `BIN-16` | Given a corpus of existing binary siblings, when migration runs, then every binary has a `bin/` object **and its sibling wrapper carries the matching `binary_key`, both digests and both sizes**, and **no original file is deleted** |
| `BIN-17` | Given migration has already run **with optimization enabled**, when it runs again, then no object is written, no wrapper changes, and **the optimizer is not invoked** — idempotence holds on the optimized path, not only the verbatim one |
| `BIN-18` | Given the conformance checks above, when they run against `LocalFsStore` and an in-memory store in turn, then all pass against both with no implementation-specific branching in the test bodies |
| `BIN-19` | Given the same binary referenced by wrappers in two different corpora, when it is fetched for the second corpus, then the local cache serves it and no remote read occurs |
| `BIN-20` | Given a cached binary, when the cache is cleared, then no wrapper changes, the remote object is untouched, and a later fetch restores identical bytes |
| `BIN-21` | Given Ghostscript is not installed, when a PDF is ingested, then the original bytes are stored, `optimized` is `false`, and the capture succeeds rather than failing |
| `BIN-22` | Given the same PDF optimized twice by the configured compressor, when both outputs are hashed, then the digests are identical — optimization is deterministic |
| `BIN-23` | Given a binary whose wrapper already records a `binary_key` for its current `source_sha256`, when migration runs, then that file is skipped and the compressor is never called for it |
| `BIN-24` | Given a binary whose wrapper records a `binary_key` for a **different** `source_sha256`, when migration runs, then it is re-ingested and the wrapper is updated to the new key |
| `BIN-25` | Given a real-shaped wrapper, when a pointer is applied, then the change is **additions only** — no pre-existing line is removed or rewritten, nested keys such as `content_type` survive, `sha256` is not redefined, and re-applying changes nothing |
| `BIN-26` | Given an optimized ingest during migration, when the store is listed, then **both** the optimized working copy **and** the publisher's original are present, each at its own content key |

**Not in the automated suite, run deliberately:**

- **The real 78.** Migration against `augment-it/clients/reach-edu/corpus`,
  gated behind a path env var. What it proves is not correctness but the
  numbers: how much the corpus actually shrinks, how many duplicates collapse,
  and whether any PDF trips the text-layer guard. **Read-only on the source; all
  writes to a dev prefix.**
- **Eyes on three optimized PDFs.** Open the Bloomberg report, a chart-heavy WEF
  report, and one scan-like document at full screen. The invariant proves text
  survived; only a human can say the images still look right.

## Acceptance

```
uv run python scripts/spec_status.py --spec Binary-Ingest-And-Bin-Store --require-green
```

exits 0, `bash scripts/check.sh` passes its blocking rungs, both deliberate runs
above have been done, and the operator has walked it (Gate 4).

**The walk-through question:** *would you send an optimized PDF to a client as
the source you cited?* If not, the threshold is wrong, and the fix is in the
setting rather than in the code.

## Open questions

1. ~~**Does `bin/` live inside the repo or only in R2?**~~ **Resolved
   2026-08-22: neither — two scopes, one key.**

   | | location | scope |
   |---|---|---|
   | **remote** | `r2://<client-bucket>/corpora/bin/<ab>/<sha256><ext>` | **per client, isolated** |
   | **local cache** | `~/Library/Caches/corpora/bin/<ab>/<sha256><ext>` (XDG on Linux) | **per machine, shared across every corpus** |

   `bin/` is **never in a repo.** That is what keeps git at ~30 MB, makes LFS
   unnecessary, and makes jj safe.

   **The remote is deliberately not shared across clients**, even though content
   addressing would dedup it for free. The key is `sha256(content)` and leaks
   nothing about a machine or a person — but two wrappers naming the same hash
   reveal that two corpora hold the same document, and a shared remote would
   dissolve the bucket-per-client isolation the tenancy design makes structural.
   Duplicating a 9 MB optimized report across two buckets costs fractions of a
   cent; the isolation is worth vastly more.

   **The local cache is shared, and that is where "don't download it twice"
   comes from.** Both wrappers name the same hash, the machine holds one copy
   keyed by it, and `fetch` finds it already present. Fetched once, used by every
   corpus — precisely *because* the remote copies are separate objects that
   happen to share a name.

   Two consequences worth stating:

   - **Eviction becomes cache eviction, which is non-destructive by definition.**
     Clearing a cache cannot lose data, which is a stronger guarantee than
     Behaviour 9's `numcopies` check and needs no bookkeeping at all. Behaviour 9
     still governs deleting a *remote* object; nothing in this spec does that.
   - The MacBook Air constraint becomes **one cache size budget**, not a
     per-corpus decision.

   [[Storage-Seam]] anticipated this: *"Cache eviction. `CachedStore` has none in
   this phase… Noted so its absence is a decision, not an oversight."* This is
   when it is needed. `CachedStore` is in-memory today
   (`src/store/cached.py:24`); the disk-backed, machine-level version is a new
   implementation of the same seam, and its own docstring already argues it is
   correct by construction — *"an object named by its own sha256 can never
   change, so a cache keyed on it never needs invalidating."*
2. ~~**What is `numcopies` here, concretely?**~~ **Resolved 2026-08-22: one R2
   bucket is enough, for now.** Operator's call, and it is cheap to be wrong
   about — under the resolution to (1) the only thing ever deleted locally is a
   *cache entry*, which is lossless by definition. Nothing in this spec deletes
   a remote object.

   **Deferred, with a trigger:** redundancy beyond the single bucket — a
   scheduled copy of the R2 bucket to a second location, with a restore path.
   Re-open when the corpus becomes something a client depends on rather than
   something we maintain for them, or when a second operator's work is only in
   the bucket. **Not now**, and explicitly not this spec's problem.
3. **Ghostscript as a dependency — and it makes W1 mandatory.** `gs` is a system
   binary, not a Python package, so it cannot live in `pyproject.toml` and no
   `uv sync` will produce it.

   That is not a gap in this spec so much as the first hard instance of a
   requirement already recorded. The 2026-07-20 operator wishlist, W1, said: *"The
   local install is **one artifact** — a containerized/VM setup that brings every
   tool with it. No 'first install git, then…' onboarding."* Until now the
   motivating example was git. **Ghostscript is the second, and unlike git it is
   something no collaborator would ever plausibly already have.**

   Operator, 2026-08-22: *"We are at some point soon going to have to have an
   installer or an installable native app with its own appIcon art… The installer
   should, if it doesn't automatically, create some kind of virtual env or
   container image or something, and install everything it needs."*

   So the resolution is a hand-off, not a decision here: **`gs` is a named input
   to Phase 7's packaging**, alongside the Python venv the memopop sidecar
   architecture already assumes. Recorded there so it is a packaging requirement
   rather than a surprise during a build.

   Until Phase 7 exists, optimization degrades rather than fails: **if `gs` is
   absent, ingest stores the original verbatim and records `optimized: false`.**
   A missing optimizer must never block a capture.

## Related

- [[../loops/Spec-to-Shipped-With-TDD]] — the loop this runs through
- [[../contracts/Autonomy-Gates]] — the RED-list rule behind Behaviour 11
- [[Storage-Seam]] — `CorpusStore.stat()`, which Behaviour 7 relies on
- [[Source-File-Model]] — `BinaryAsset`, which Behaviour 5 extends
- [[Corpus-Change-Feed]] — the sibling read-only surface, and the same seam argument
- `ai-labs/studies/sync-and-content-version-control/context-v/profiles/Profile__Git-Annex.md` — `numcopies`, and why safe deletion needs bookkeeping
- `ai-labs/context-v/reminders/Never-Run-JJ-In-A-Git-LFS-Repo.md` — the incident that made binaries the hard part

---
title: "24 Orphaned bin/ Objects From a Half-Migration"
lede: "A test that checked the object existed but never the pointer. Ghostscript's nondeterminism turned a sequencing mistake into 24 untraceable objects."
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Open
site_uuid: 0652b0c2-3c8e-4afa-813f-a9e946771442
hex_code: 0ma6pw
tags:
  - Issue
  - Corpora-Builder
  - Binary-Assets
  - Ghostscript
  - Test-Discipline
publish: true
from: "corpora-builder"
from_path: "context-v/issues/Orphaned-Bin-Objects-From-A-Half-Migration.md"
---
# 24 Orphaned `bin/` Objects From a Half-Migration

## What happened

On 2026-08-22, migration ran against `clients/reach-edu/corpus` and wrote **34
objects into `r2://reach-edu/corpora/bin/`**. It did **not** update the wrapper
`.md` files. Nothing points at those objects.

Ten are recoverable: they were stored verbatim, so the key *is* the source hash
and each maps to exactly one file on disk. **Twenty-four are not.** They were
optimized, and Ghostscript's output was nondeterministic, so re-running the
optimizer produces *different bytes and a different key* rather than reproducing
them. There is no way to say which source file produced which object.

Nothing is at risk. The source PDFs are untouched, the repo is clean, a verified
263 MB zip backup exists at `~/lossless-backups/`, and the orphans cost fractions
of a cent. The cost is entirely rework.

## The operator's read, which was correct

> The whole point was to make sure that the binary files were in fact immediately
> linked directly to the pointer file? I am not sure why you didn't hardwire that
> in first, now you're going to have to do more work to assure that all the local
> pointer files point to the right hosted binary.

## Root cause: a test that did not test its promise

`BIN-16` promised:

> …then every binary has a `bin/` object **and an updated wrapper**, and no
> original file is deleted

The implementing test asserted the object existed and that no original was
deleted. **It never looked at a wrapper.** It went green, the ledger reported
`0 missing`, and the promise was unmet.

`BIN-17` repeated the shape. It promised idempotence and exercised it with
`optimize=False` — the one path where idempotence was already guaranteed by
content addressing. On the optimized path it was false, and untested.

This is precisely the failure the ledger exists to prevent, stated in the repo's
own words: *"a promise with no test is the one failure that looks like success."*
The ledger only checks that an ID **has** a test, not that the test covers the
promise. **That gap is closed by reading, not by tooling** — the review step is
comparing the assertion to the row, and it was skipped.

## The second cause: nondeterminism nobody checked

Ghostscript embeds a creation timestamp, a document `/ID`, and XMP metadata.
Measured:

```
run 1: 545641ed80485782f216daf45503858e8942a1997fea78b4bd6e111b294bd4b5
run 2: 52b7db1e439ff341b938e91f143f6098e7096256583ca4ce3176b59ec0065be2
```

Same input, same flags, different bytes. Content addressing over a
nondeterministic transform means **the artifact's identity is created once and
cannot be recreated** — so failing to record it loses it permanently.

**It is fixable.** Three flags give byte-identical output across runs:

```
-dOmitInfoDate=true -dOmitID=true -dOmitXMP=true
```

`SOURCE_DATE_EPOCH` is not needed. Verified on the 38 MB Bloomberg report.

## Why determinism was never the real requirement

Worth stating, because it is the load-bearing insight and it is easy to draw the
wrong lesson.

The operator asked whether Ghostscript could run locally and the hash be applied
before upload. **It already worked that way** — optimize, hash the result, upload
at that key. Where the process runs is irrelevant; the timestamp is *inside the
PDF*.

But the instinct was right about the shape of the fix. **Determinism was never
required.** Optimize once, record the link, and the key is authoritative forever
— you never re-derive. Nondeterminism only mattered *because* the link was not
written. **The link is the fix; determinism is insurance.**

## What changed as a result

Spec `Binary-Ingest-And-Bin-Store.md`, `0.0.0.3 → 0.0.2.0`:

- **Behaviour 2** now requires deterministic optimization and names the flags.
- **Behaviour 12 (new):** storing an object and writing its pointer are *one
  operation*. An unreferenced object is garbage, not progress.
- **Behaviour 13 (new):** migration is idempotent *by memory* — a file whose
  wrapper already records a `binary_key` for its current `source_sha256` is
  skipped, never re-optimized. Determinism makes re-derivation safe; this makes
  it unnecessary.
- **`BIN-16`** now requires the wrapper to carry the key and both digests.
- **`BIN-17`** now requires idempotence **with optimization enabled**, and that
  the optimizer is not invoked on a second run.
- **`BIN-22` / `BIN-23` / `BIN-24`** added for determinism, skip-if-mapped, and
  re-ingest-when-source-changed.

## Recovery

1. Re-run migration with the corrected code — deterministic, wrapper-writing.
   The 10 verbatim objects re-derive to identical keys and cost nothing; the 24
   optimized ones are created fresh, this time referenced.
2. **Sweep the 24 orphans.** Provably unreferenced once step 1 lands: every key
   in `bin/` that no wrapper names. Requires explicit operator confirmation —
   deleting from a client bucket is on the RED list.

## The lesson worth carrying

**Write the pointer in the same operation that writes the thing.** Anything else
is a distributed transaction with no rollback, and content addressing over a
lossy transform makes the failure permanent rather than merely untidy.

And the narrower one: **when a spec row says "X and Y", the test asserts X and
Y.** A green ledger means every ID has *a* test, not the *right* test.

## Related

- [[../specs/Binary-Ingest-And-Bin-Store]] — amended in response
- [[../loops/Spec-to-Shipped-With-TDD]] — the review step that would have caught it
- [[../contracts/Autonomy-Gates]] — the RED-list rule governing the sweep
- `changelog/2026-08-22_03.md` — the ship note that reported the incomplete state honestly but shipped it anyway

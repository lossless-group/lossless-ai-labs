---
name: git-annex Profile
slug: git-annex
upstream: https://git.joeyh.name/git/git-annex.git
pinned_sha: 6bc1790845
pinned_date: 2026-08-21
version_at_pin: "10.20260717 (nearest tag)"
license: AGPL-3+
maintainer: Joey Hess
study: studies/sync-and-content-version-control
profile_path: studies/sync-and-content-version-control/git-annex
profile_kind: Large-file manager layered on git (Haskell)
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
site_uuid: 93ecf7d9-e814-4e7c-b365-fc1a007de0d0
hex_code: ytq3zv
lede: >-
  Content is optional. git tracks which copies exist where, and refuses to drop
  the last one — the bookkeeping that makes deleting a local file safe.
summary: >-
  Profile of git-annex as pinned in the sync-and-content-version-control study,
  added when the study's own stated trigger fired — the binary-sibling problem
  turned out to be the hard part. It is the reference implementation for the
  design corpora-builder arrived at independently: content-addressed binaries,
  fetched on demand, evictable to reclaim space. Covers the git-annex branch as
  an auto-mergeable location log, numcopies as the safety rule that makes drop
  non-destructive, trust levels, and the two reasons to read it rather than
  adopt it.
tags:
  - Profile
  - Git-Annex
  - Content-Addressed-Storage
  - Large-Files
  - Corpus
publish: true
from: "studies/sync-and-content-version-control"
from_path: "context-v/profiles/Profile__Git-Annex.md"
---
# git-annex — Profile

A profile of git-annex as it lives in this study (`studies/sync-and-content-version-control/git-annex`, pinned at `6bc17908`, nearest tag `10.20260717`, 2026-08-21). AGPL-3+, Haskell, by Joey Hess. Canonical remote is `git.joeyh.name` — there is **no GitHub mirror**; `github.com/joeyh/git-annex` does not exist.

**Pinned because the study's own trigger fired.** The README's not-in-the-study list said: *"git-annex, DVC, Perkeep, ostree — real prior art on content-addressed large-file storage. Held back to keep the question narrow; **add them if the binary-sibling problem (PDFs in a corpus) turns out to be the hard part.**"*

It turned out to be the hard part. A corpus is 1,715 text files and 78 binaries, and **the binaries are 90.5% of the bytes** — they broke jj (via LFS), they dominate sync cost, and they are the reason a 4-year-old laptop is a constraint. git-annex is the system built for exactly that ratio.

## TL;DR

git-annex is not a VCS. It is a **large-file manager layered on git**: git tracks a small pointer for each big file, the content lives in `.git/annex/objects/` addressed by a content-derived key, and **the content is optional**. You `git annex get` what you need and `git annex drop` what you do not, and git-annex maintains enough bookkeeping to know whether dropping is safe.

**One sentence:** *git-annex is the answer to "I want version control over a directory whose bytes I cannot afford to carry," and its distinguishing contribution is not the content-addressing — it is the location bookkeeping that makes deletion provably safe.*

## The three ideas worth taking

### 1. The `git-annex` branch — a location log that auto-merges

Location tracking lives in a **separate orphan branch**, not in the working tree (`doc/internals.mdwn:62-70`):

> This branch is not connected to your master, etc branches. It is used for internal tracking of information about git-annex repositories and annexed objects.

And the design constraint that makes it work across peers (`:71-74`):

> The files stored in this branch are all designed to be **auto-merged by simply concatenating them together**. So each line has a timestamp, to allow the most recent information to be identified.

```
e605dca6-446a-11e0-8b2a-002170d25c55 laptop   timestamp=1317929189.157237s
26339d22-446b-11e0-9101-002170d25c55 usb disk timestamp=1317929330.769997s
```

That is a CRDT in a text file — append-only, order-independent, last-timestamp-wins — solving multi-peer metadata merge without a CRDT library. Compare [[Profile__Automerge]], which needs a whole runtime for the general case; git-annex needed only this shape and built exactly it.

### 2. `numcopies` — why dropping is safe

The rule that turns "free up space" from a risk into an operation (`doc/git-annex-drop.mdwn:25-36`):

```
drop photo2.jpg (unsafe)
  Could only verify the existence of 0 out of 1 necessary copies
  Rather than dropping this file, try using: git annex move
  (Use --force to override this check, or adjust numcopies.)
failed
```

**It verifies a copy exists elsewhere before deleting locally.** `numcopies` (and `mincopies`) are settings, globally in the branch's `numcopies.log` and per-path via `.gitattributes`.

This is the piece an in-house design is most likely to skip and most likely to regret. Eviction feels safe when the remote is right there — until the one time it is not.

### 3. Trust levels

`git annex trust` / `semitrust` / `untrust` (`doc/git-annex-trust.mdwn` and siblings). A remote's claim to hold a copy counts differently depending on how much you trust it. An untrusted remote's copy does not satisfy `numcopies`.

Relevant if a client's machine ever holds corpus binaries: it should be untrusted, so its copies never count toward "safe to drop here."

## What it does not solve

- **It is not object storage.** Reaching R2 means a *special remote*, which is a separate configuration layer.
- **Symlink or pointer-file mechanics leak.** In the classic mode annexed files are symlinks into `.git/annex/objects`, which surprises tools that expect files. Unlocked pointer files improve this and bring their own subtleties.
- **Haskell.** Reading it to learn the design is fine. Extending or embedding it is a different commitment from a Python codebase.
- **AGPL-3+.** Fine to run and read; a consideration if anything were ever vendored.

## How it scores against the study checklist

| Checklist item | git-annex |
|---|---|
| **Unit of sync** | The file, with content decoupled from the pointer |
| **History lives in** | git, for pointers; content is unversioned by design |
| **Content-addressed** | **Yes, and it is the whole point.** Pluggable key backends (`SHA256E` and friends, `Backend/Hash.hs`) |
| **Blob-storage story** | Via special remotes — S3-compatible included, but a layer you configure |
| **Conflicts** | Content cannot conflict (immutable, hash-named). The location log auto-merges |
| **Structural read-only** | Trust levels, which is a richer answer than a read-only flag |
| **Plain files on disk** | Present-or-absent by design; symlink/pointer mechanics are visible |
| **Human reason per version** | None of its own — inherits git's commit messages |
| **Retention policy** | **`numcopies` / `mincopies`** — the best answer in the study to "is it safe to delete this here" |
| **Ops cost** | One binary, no server. Haskell toolchain if you build it |

## Why read it rather than adopt it

The corpora-builder design arrived independently at git-annex's core model — content-addressed binaries, fetched on demand, evictable. That convergence is evidence the model is right, and it means the useful question is which parts to copy rather than whether to adopt.

**Copy:** `numcopies`-style verification before any local delete; the timestamped append-only location log if multiple machines ever hold copies; trust levels if a client machine ever does.

**Do not copy:** the symlink mechanics, and the assumption that git is where pointers live. corpora-builder already has `CorpusStore` with `exists()` and `stat()` returning size and hash, which is the verification primitive git-annex builds by hand — the seam from Phase 1 does this job already.

## Read next

- `doc/internals.mdwn:62-95` — the git-annex branch; the auto-merge-by-concatenation trick is the best idea here
- `doc/git-annex-drop.mdwn:25-36` — the unsafe-drop message, which is the whole safety model in one paragraph
- `doc/git-annex-whereis.mdwn` — the query that makes location tracking legible
- `Backend/` — `Hash.hs`, `URL.hs`, `WORM.hs`, `VURL/` — the key varieties

## Related

- [[Profile__Restic]] and [[Profile__Kopia]] — content-addressing for snapshots rather than for optional-presence
- [[Profile__Seafile]] — its virtual-drive mode is the same on-demand idea inside a sync product
- [[Profile__Jujutsu]] — which has no LFS support at all, the incident that made binaries the study's hard part
- `ai-labs/corpora-builder/context-v/specs/Binary-Ingest-And-Bin-Store.md` — the spec this informs

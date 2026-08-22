---
title: "Never Run jj in a Git LFS Repo"
lede: "jj does not run smudge/clean filters. In an LFS repo it commits the real bytes over the pointers — 282 MB in one save."
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.0.1
status: Active
site_uuid: e45b1c48-20a6-4144-9852-d153f73b2bc8
hex_code: 2lqnhl
summary: >-
  Guardrail from a 2026-08-22 incident. `jj git init --colocate` was run in the
  reach-edu client repo, which tracks PDFs with Git LFS. jj has no LFS support
  and does not run git's smudge/clean filters, so its first working-copy snapshot
  replaced 78 LFS pointer files with 282 MB of real PDF bytes in a single commit.
  Fully reverted, nothing pushed. Check `.gitattributes` for `filter=lfs` before
  running jj anywhere, and treat LFS and jj as mutually exclusive per repo.
tags:
  - Reminder
  - Jujutsu
  - Git-LFS
  - Corpus
  - Client-Data
publish: true
---

# Never Run jj in a Git LFS Repo

**Rule.** Before running `jj git init` anywhere, check for Git LFS:

```bash
grep -l "filter=lfs" .gitattributes 2>/dev/null && echo "STOP — LFS repo, jj will corrupt it"
git lfs ls-files | head        # non-empty = LFS in use
```

If the repo uses LFS, **jj is not an option there.** Not "use it carefully" —
the two are mutually exclusive.

## Why

jj's own compatibility table says it outright
(`studies/sync-and-content-version-control/jj/docs/git-compatibility.md:72`):

> **Git LFS: No.** ([#80](https://github.com/jj-vcs/jj/issues/80))

A grep for `lfs` or `smudge` across the whole jj source returns nothing. **jj does
not run git's clean/smudge filters at all.** So when jj snapshots a working copy
in an LFS repo, it sees what LFS *smudged onto disk* — the real file — and stores
that, silently replacing the pointer.

## What it actually did

`jj git init --colocate` in `augment-it/clients/reach-edu/`, whose
`.gitattributes` carries:

```
*.pdf  filter=lfs diff=lfs merge=lfs -text
*.docx filter=lfs diff=lfs merge=lfs -text
```

One `jj describe` + `jj new` — a "save" that touched **no files** — produced a
commit reading:

```
78 updated · 282.5 MB
 .../2026-06-10_ed559688-pdf.pdf   | Bin 131 -> 729490 bytes
 .../2025-2026-annual-report.pdf   | Bin 133 -> 39846808 bytes
```

**`Bin 131 -> 729490` is the signature.** A ~130-byte binary becoming megabytes
is an LFS pointer being overwritten with its own content. The pointer is three
lines:

```
version https://git-lfs.github.com/spec/v1
oid sha256:3471b398…
size 729490
```

Had that been pushed, the client's repo would have gained 282 MB of blobs that
LFS was specifically configured to keep out of it — and un-pushing it means a
history rewrite on a client repo.

## How to apply

- **Check before you init.** The grep above, every time, in any repo you did not
  personally create.
- **The failure is silent and looks like success.** jj reports "Initialized repo"
  and a normal-looking commit. Only the diffstat gives it away, and only if you
  read it. There is no warning.
- **`git status` will not save you.** The working tree is clean before and after;
  LFS keeps real bytes on disk by design. The corruption is in what gets
  *committed*, not in what you see.
- **Recovery, if it already happened and nothing was pushed:** `rm -rf .jj`,
  then `git reset --hard <the commit you were on>`, then `git checkout main` —
  jj's colocate moves the branch ref, so a reset alone leaves you detached.
  Confirm with `git show HEAD:<a.pdf> | head -1` returning the LFS version line.
- **This does not touch the `.flave` decision.** flave's spec §8.2 chose jj for
  `.flave` bundles, and those carry no LFS. The rule is per repo, not per tool.

## The wider lesson

The corpus repos use LFS *because* a corpus is markdown plus large binaries, and
that is exactly the shape jj handles worst. Any future "adopt jj for the corpus"
proposal has to answer this first, and the honest answer today is that it cannot:
choosing jj means dropping LFS, and dropping LFS means the PDFs go into git
proper.

## Related

- `../../studies/sync-and-content-version-control/context-v/profiles/Profile__Jujutsu.md` — the jj profile, which now records this
- `../../flave-ai/context-v/specs/Master-Flave-An-Agent-Native-Document-Format-and-Publisher.md` §8.2 — the jj decision this does *not* overturn
- `../../../context-v/reminders/Check-The-Substrate-Before-Reasoning-On-Top-Of-It.md` — the sibling guardrail; this is the same lesson applied to a tool instead of a store

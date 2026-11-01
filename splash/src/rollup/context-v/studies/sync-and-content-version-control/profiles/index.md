---
from: "studies/sync-and-content-version-control"
from_path: "context-v/profiles/index.md"
---

# Profiles

* [Automerge — Profile](Profile__Automerge.md) - The only entry where two people editing the same paragraph is a solved case rather than a second file with a longer name — and it costs you the filesystem.
* [git-annex — Profile](Profile__Git-Annex.md) - Content is optional. git tracks which copies exist where, and refuses to drop the last one — the bookkeeping that makes deleting a local file safe.
* [Jujutsu (`jj`) — Profile](Profile__Jujutsu.md) - The storage layer is five pluggable backends, not one — and only two of the five have a shipped implementation you could put in a bucket.
* [Kopia — Profile](Profile__Kopia.md) - Its snapshot manifest has the free-text Description field restic lacks, and its policies attach per directory and inherit — the ask's own shape, in the store.
* [Rclone UI — Profile](Profile__Rclone-UI.md) - The only entry that solves the trigger problem — 5,167 lines of Rust registering jobs with launchd, crontab, and Task Scheduler behind one trait.
* [restic — Profile](Profile__Restic.md) - Its on-disk layout is data/<ab>/<sha256> plus snapshots/<id> — which is corpora-builder's unbuilt Phase 4, already shipped and hardened since 2014.
* [Seafile — Profile](Profile__Seafile.md) - Git's object model with content-defined chunking underneath and a human-readable description on every commit — and the S3 backend is the paid tier.
* [Syncthing — Profile](Profile__Syncthing.md) - Closes a question two Lossless docs left open: a receive-only device does not silently orphan the collaborator's edit — it flags it, counts it, and offers Revert.

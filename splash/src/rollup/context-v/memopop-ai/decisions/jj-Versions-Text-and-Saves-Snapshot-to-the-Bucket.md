---
type: Decisions
title: "jj Versions Text, and a Save Snapshots to the Bucket"
lede: "Every draft is versioned without the client touching version control, and a single save backs the whole workspace up."
publish: true
date_created: 2026-10-10
date_modified: 2026-10-10
date_authored_initial_draft: 2026-10-10
date_authored_current_draft: 2026-10-10
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5 (1M context)
at_semantic_version: 0.0.0.1
status: Decided
tags:
  - Decision
  - MemoPop
  - Version-Control
  - Jujutsu
  - Backups
site_uuid: 51c14f72-25f2-4d81-a6f8-7623faace226
hex_code: o8qbnk
from: "memopop-ai"
from_path: "context-v/decisions/jj-Versions-Text-and-Saves-Snapshot-to-the-Bucket.md"
---
# jj Versions Text, and a Save Snapshots to the Bucket

## The decision

- **jj versions text only:** research files, section drafts, sources,
  scorecards, configs, and the other text artifacts. The server commits after
  every saved artifact. The client never sees jj or types a command.
- **Large files stay out of jj.** Decks, datarooms, PDFs, and images live in
  the firm's bucket, not the jj working copy.
- **No BTRFS.** Backup is a client-initiated **save**: the `save_snapshot` tool
  takes a snapshot of the workspace and writes it to the firm's private bucket.

Decided 2026-10-10 by Michael Staton.

## Why

- **Clients won't run git.** History has to happen without them, and jj fits
  that: no staging area, every edit is already a change, and its operation log
  makes any action undoable.
- **jj doesn't run Git LFS.** In an LFS repo it commits the real bytes over the
  pointers ([[Never-Run-JJ-In-A-Git-LFS-Repo]]). Keeping binaries out of jj
  removes the problem instead of working around it.
- **Railway, the host, doesn't let us choose a volume's filesystem**, so BTRFS
  snapshots would mean leaving it. A save to the bucket gives the client the
  same outcome: a point they can return to.

## Still open

- **What takes the snapshot.** Kopia per firm (labelled snapshots, retention,
  native bucket support) or Railway volume backups mirrored with rclone. The
  exploration leans Kopia.
- **Migrating the eleven existing firms**, including the three whose repos use
  Git LFS, into fresh jj workspaces.

## Related

- [[MemoPop-as-a-Claude-Connector]] — the exploration this came from, including
  the BTRFS / Kopia / Railway comparison
- [[One-Workspace-Per-Firm-With-a-Private-Bucket]]
- [[Corpus-Change-Feed]] — the change-record shape a save should report

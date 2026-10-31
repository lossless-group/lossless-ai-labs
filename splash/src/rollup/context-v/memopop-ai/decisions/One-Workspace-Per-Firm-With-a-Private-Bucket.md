---
type: Decisions
title: "One Workspace per Firm, with a Private Bucket"
lede: "Each client firm gets one workspace on our server holding all its deals, plus a private bucket of its own for originals and backups."
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
  - Multi-Tenancy
  - Object-Storage
site_uuid: a61fa9b9-482b-4e4a-bffb-3cb7c5a9a6ec
hex_code: 4mt6c9
from: "memopop-ai"
from_path: "context-v/decisions/One-Workspace-Per-Firm-With-a-Private-Bucket.md"
---
# One Workspace per Firm, with a Private Bucket

## The decision

- **One workspace per client firm**, holding all of that firm's deals. This is
  the shape `io/<firm>/deals/<deal>/` already has. Everyone the firm brings in
  sees all of its deals; per-deal access can be added inside a workspace later.
- **The server disk is canonical.** The workspace sits on the server's volume
  exactly as the code expects it, so nothing has to be rewritten to run hosted.
- **Each firm gets its own private bucket.** It holds the original materials
  (decks, datarooms, PDFs, images) and every backup snapshot. Provisioned by
  hand at first, automatically once didi.sh takes payments.

Decided 2026-10-10 by Michael Staton.

## Why

- **It matches the code and the data we already have.** Eleven firms already
  live as `io/<firm>/`, and the orchestrator reads that layout directly.
- **A firm's data stays separable.** One bucket per firm means a client's files
  can be handed over, exported, or deleted without touching anyone else's.
- **A firm, not a deal, is who signs up.** The firm is a didi.sh entity, and
  the sign-in token names it.

## Related

- [[MemoPop-as-a-Claude-Connector]] — the exploration this came from
- [[jj-Versions-Text-and-Saves-Snapshot-to-the-Bucket]] — what goes in the
  bucket and when
- [[A-Syncbox-For-Client-Document-Folders]] — the storage reasoning this reuses

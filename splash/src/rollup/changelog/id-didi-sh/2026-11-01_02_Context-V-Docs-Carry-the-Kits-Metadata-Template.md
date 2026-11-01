---
site_uuid: 9a457150-3fcb-4b98-9760-b5e0558bab5f
hex_code: 9onuup
title: "id-didi-sh's Docs Drop the Repo-Name Tag and Fill a Missing Date"
lede: "The OKF sweep's second pass: the repo's own name comes out of seven tag lists, and one reminder gets its date and status in standard form."
publish: true
date_created: 2026-11-01
date_modified: 2026-11-01
date_authored_initial_draft: 2026-11-01
date_authored_current_draft: 2026-11-01
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5 (1M context)
tags:
  - Changelog
  - Context-Vigilance
  - Open-Knowledge-Format
  - Normalization-Sweep
files_changed:
  - context-v/explorations/ (2 docs)
  - context-v/issues/ (1 doc)
  - context-v/plans/ (3 docs)
  - context-v/reminders/ (2 docs)
  - changelog/2026-11-01_02_Context-V-Docs-Carry-the-Kits-Metadata-Template.md
from: "id-didi-sh"
from_path: "changelog/2026-11-01_02_Context-V-Docs-Carry-the-Kits-Metadata-Template.md"
---
# id-didi-sh's Docs Drop the Repo-Name Tag and Fill a Missing Date

## Why Care?

[[2026-11-01_01_Every-Context-V-Doc-Now-Declares-Its-Type]] made `id-didi-sh/context-v/` an Open Knowledge Format bundle. This pass brings the same docs up to the Context Vigilance Kit's baseline frontmatter, so the splash, the corpus roll-up, and any agent reading them get the same fields in the same shape on every doc.

## What's New?

- **The `Id-Didi-Sh` tag comes off seven docs.** Every doc here is about this repo, so its name says nothing about a doc's topic, and all seven already name the repo in their body. The other nine keep it: their bodies name the repo only through a spec filename or the `id.didi.sh` host, or not at all.
- **The UTC-dates reminder gains a `date_modified`** (2026-08-21, its last commit before the sweep), **its `augmented_with` becomes a one-item list**, the string kept word for word, and **its status `Authoritative` becomes `Active`**, the kit's name for a rule in force.

## Under the Hood

- Part of the tree-wide OKF sweep; see the Context Vigilance Kit's plan, [[Retrofit-Every-Repo-to-OKF-Then-the-Kit-Frontmatter]].
- Every edit was made by hand. No body line changed, no key was deleted, and no `publish`, lede, or other status value moved.
- Every doc already had a `site_uuid` and `hex_code`, so no IDs were minted for docs.
- Left for a later status pass, which reads each doc with the operator: three docs with no `status` (the loop log, the OAuth note, the canonical-spec reminder), and a few statuses that git suggests have moved on, such as the OAuth plan still at `Ready` though its issue is `Resolved`.

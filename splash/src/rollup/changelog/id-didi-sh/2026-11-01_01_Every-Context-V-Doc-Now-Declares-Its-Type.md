---
site_uuid: 19d3d101-be9f-4fe3-982e-24454725db3a
hex_code: u0sb2v
title: "Every id-didi-sh Doc Now Says What It Is"
lede: "The identity service's 17 plans, issues, and notes now declare their type, and every folder has an index an agent can scan."
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
  - context-v/index.md
  - context-v/explorations/index.md
  - context-v/issues/index.md
  - context-v/loops/index.md
  - context-v/notes/index.md
  - context-v/plans/index.md
  - context-v/reminders/index.md
  - context-v/explorations/ (2 docs)
  - context-v/issues/ (7 docs)
  - context-v/loops/ (1 doc)
  - context-v/notes/ (1 doc)
  - context-v/plans/ (3 docs)
  - context-v/reminders/ (2 docs)
  - splash/src/content.config.ts
  - changelog/2026-11-01_01_Every-Context-V-Doc-Now-Declares-Its-Type.md
from: "id-didi-sh"
from_path: "changelog/2026-11-01_01_Every-Context-V-Doc-Now-Declares-Its-Type.md"
---
# Every id-didi-sh Doc Now Says What It Is

## Why Care?

`id-didi-sh/context-v/` holds the implementation-local thinking behind the didi.sh identity service: the OAuth plan, the entities-and-keys loop, the open issues about roles and invites. Until today an agent had to open each file to learn what kind of doc it was. Now the folder is an Open Knowledge Format (OKF) v0.2 bundle, so any OKF reader can list what's here and what each doc is for without opening a thing.

## What's New?

- **16 docs declare their `type`**, the Train-Case name of the folder they live in: `Explorations`, `Issues`, `Loops`, `Notes`, `Plans`, `Reminders`. The OAuth plan already had one.
- **`context-v/index.md`** marks the bundle with `okf_version: "0.2"` and lists its six folders.
- **Six folder indexes**, one line per doc with its lede. The UTC-dates reminder has no lede, so its line is the title alone.
- **The splash skips `index.md`** when loading `context-v/`, so the indexes stay navigation for agents and don't become pages. The build still loads all 17 docs (6 published, 11 held back by `publish: false`).

## Under the Hood

- Part of the tree-wide OKF sweep; see the Context Vigilance Kit's plan, [[Retrofit-Every-Repo-to-OKF-Then-the-Kit-Frontmatter]].
- Every edit was made by hand, one file at a time. The whole doc diff is 16 added `type:` lines and nothing removed. No dates moved: this is a compliance change, not a content change.
- `notes/` isn't one of the kit's canonical folders. It keeps its name and its doc is typed `Notes`; no folder was renamed.

---
date_created: YYYY-MM-DD
date_modified: YYYY-MM-DD
title: "PRODUCT vX.Y.Z — Release Title"
lede: "What this release does in one attention-grabbing sentence"
publish: true
authors:
  - Firstname Lastname
augmented_with:
  - Pi on Claude Sonnet 4.5
release_version: "X.Y.Z"
files_changed:
  - path/from/project-root/src/important-file.ts
tags:
  - Release
  - PRODUCT-NAME
from: "dididecks-ai"
from_path: "context-v/agent-skills/changelog-conventions/templates/release.md"
---
# PRODUCT vX.Y.Z — Release Title

## Why Care?

The headline change. Why does this release matter to the people using PRODUCT? One paragraph, audience-facing.

## What's New?

### Highlights

- Top 3-5 user-facing changes
- Each one phrased as a benefit, not a task

### Added

- New features or capabilities

### Changed

- Behavior changes that existing users will notice
- Note any breaking changes prominently

### Fixed

- Bug fixes worth calling out

### Deprecated

- Anything being phased out, with the timeline if known

### Removed

- Anything taken away in this release

## Upgrade Notes

If users need to do anything to upgrade — say so. Migration scripts, config changes, before/after examples.

```diff
- old usage
+ new usage
```

## The Story Behind This Release

> *(Optional.)* What shaped this release? What did we learn between the last release and this one? What was hard, what surprised us, what we'd do differently.

## Thanks

If contributors landed work in this release, name them.

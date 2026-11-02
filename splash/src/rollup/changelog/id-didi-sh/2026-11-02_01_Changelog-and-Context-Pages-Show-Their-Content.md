---
site_uuid: 8147ec07-da22-4d41-aaf3-6da79c049749
hex_code: h4itey
title: "Changelog and Context Pages Show Their Content"
lede: "Every changelog and context-v page on the splash published a title over an empty body. They now render through Lossless Flavored Markdown."
publish: true
date_created: 2026-11-02
date_modified: 2026-11-02
date_authored_initial_draft: 2026-11-02
date_authored_current_draft: 2026-11-02
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5 (1M context)
tags:
  - Splash
  - LFM
files_changed:
  - splash/package.json
  - splash/.npmrc
  - splash/pnpm-lock.yaml
  - splash/src/lib/markdown.ts
  - splash/src/components/markdown/
  - splash/src/pages/changelog/[...slug].astro
  - splash/src/pages/context-v/[...slug].astro
  - splash/src/styles/prose.css
from: "id-didi-sh"
from_path: "changelog/2026-11-02_01_Changelog-and-Context-Pages-Show-Their-Content.md"
---
## Why Care?

The splash is where people read this repo's changelog and docs, and its 20 detail
pages had no body text. The build still passed and every URL loaded, so nothing
flagged it.

## What's New?

- **Bodies render through LFM,** installed from JSR, the same way as our other
  splashes.
- **Links work:** wikilinks go to the matching page here, and relative links go
  to the file on GitHub.

---
title: "PlayChrome — DEPRECATED thin shim around DeckChrome"
lede: "Deprecated as of v0.2. Use `<DeckChrome>` directly. Kept as a thin shim so any external code still importing `PlayChrome` keeps working through the transition. v0.1's heavy dark bottom-bar chrome was replaced by the calmstorm-flavored floating capsule per the `Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives` plan. Remove in v0.3."
artifact_kind: component
ownership: shell
mode: play-ui
status: deprecated
shell_version_introduced: 0.1.0-rc.0
deprecated_in: 0.2.0
slated_for_removal: 0.3.0
composes:
  - DeckChrome (just re-exports)
composed_by: []
theming_tokens_consumed: []
plan_of_record: "[[../../plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]]"
file: apps/deck-shell/src/components/PlayChrome.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-14
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Deprecated
  - Removal-Pending
from: "dididecks-ai"
from_path: "context-v/sitemap/components/PlayChrome.md"
---
# PlayChrome

## Status

⚠️ **Deprecated.** Use `<DeckChrome>` directly. PlayChrome is a thin shim that re-exports DeckChrome with the original v0.1 prop shape preserved.

## Migration path

- New consumers: import `<DeckChrome>` directly
- Existing consumers: continue importing `<PlayChrome>` works; both render the same chrome. Migrate when convenient.
- Slated for removal in v0.3 of the shell

## Why the deprecation

v0.1's heavy dark bottom-bar chrome consumed viewport real-estate continuously and didn't theme cleanly. The calmstorm-flavored floating capsule (DeckChrome) idle-fades, themes via `--ddd-chrome-*` tokens, and exposes a richer two-axis navigation contract (primary slot prev/next + secondary variant cycling). The old PlayChrome had no path to that behavior without a public-API break — DeckChrome is the redo.

## Related

- [[DeckChrome]] — the replacement
- [[../../plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives]]

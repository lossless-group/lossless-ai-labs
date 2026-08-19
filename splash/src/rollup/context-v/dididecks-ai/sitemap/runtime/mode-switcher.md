---
title: "runtime/mode-switcher — TS factory createModeSwitcher({client, defaultMode, respectSystemPreference}); per-client localStorage namespace"
lede: "Three-mode state machine factory, namespaced to `{client}:mode` in localStorage and installed as a `window.modeSwitcher` singleton."
artifact_kind: runtime
ownership: shell
mode: both
status: shipped
shell_version_introduced: 0.2.0
runtime_type: "TS factory module — installs window.modeSwitcher singleton"
composed_by:
  - ModeToggle (inline-imports + calls createModeSwitcher on mount)
  - "chroma-decks/src/utils/mode-switcher.js (side-effect shim — calls createModeSwitcher({client: 'chroma-decks', defaultMode: 'light', respectSystemPreference: true}) at module top-level so legacy importers get the same singleton)"
public_api:
  - "createModeSwitcher(opts: ModeSwitcherOptions): ModeSwitcher"
  - "Mode type: 'light' | 'dark' | 'vibrant'"
  - "VALID_MODES: readonly Mode[]"
opts:
  - "client: string (required) — localStorage namespace"
  - "defaultMode?: Mode (default 'light')"
  - "respectSystemPreference?: boolean (default false; opt-in to prefers-color-scheme: dark first-visit)"
events:
  - "dispatches 'mode-change' on window with {detail: {mode}}"
storage:
  - "localStorage[`${client}:mode`] (writes on apply)"
plan_of_record: "[[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]]"
file: apps/deck-shell/src/runtime/mode-switcher.ts
authors:
  - Michael Staton
date_authored_initial_draft: 2026-06-06
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
  - Lifted-From-Chroma
date_created: 2026-06-06
date_modified: 2026-06-07
publish: true
site_uuid: 5ba29148-17fd-4b51-a1b1-2fd3fc5c5c49
hex_code: o2ycp1
date_authored_current_draft: 2026-06-06
from: "dididecks-ai"
from_path: "context-v/sitemap/runtime/mode-switcher.md"
---
# runtime/mode-switcher

## Why per-client namespace

Multiple decks deploying on overlapping preview domains (e.g. `*.vercel.app`) collide on `localStorage` keys. The `chroma-decks:mode` vs `humain-vc-decks:mode` namespace prevents accidental cross-talk where opening one preview deck changes another's persisted mode.

## Singleton discipline

`createModeSwitcher()` returns the existing `window.modeSwitcher` if one is already installed — multiple `ModeToggle` instances on the same page call it on mount, but only the first call actually constructs. Subsequent calls just return the existing singleton. This is what lets a landing page with one `ModeToggle` plus a scroll-page mounted as a fragment with another `ModeToggle` share consistent state.

## Default-mode + prefers-color-scheme

`defaultMode` is the per-client brand canon (light for chroma + humain; could be dark for a darker-canon brand). `respectSystemPreference` is opt-in — off by default because brand canon usually beats OS preference (a vibrant-brand site looking dark just because the user's MacBook is in dark mode is wrong by default).

When `respectSystemPreference: true` AND no stored mode AND `prefers-color-scheme: dark` matches → mode boots to `dark` instead of `defaultMode`.

## Status

- ✅ Shipped — humain consumes via ScrollDeckPage → ModeToggle; chroma consumes via local shim file

## Related

- [[../components/ModeToggle]] — the UI surface that invokes this factory
- [[../components/ScrollDeckPage]] — bundles ModeToggle (and therefore this runtime)
- [[../../agent-skills/theme-system/SKILL.md]] — three-mode theme architecture
- [[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]]

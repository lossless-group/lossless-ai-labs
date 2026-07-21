---
title: "SlideShell — shared per-slide chrome (padding, min-height, snap-align, optional consumer-provided mark)"
lede: "Outer `<section>` that wraps a slide's content with the shared layout discipline: `min-height: 100vh`, fluid clamp-based padding, `scroll-snap-align: start`, flex-column body wrapper with content-max-width, optional vertical alignment + background variant. The original chroma version embedded `<ChromaMark>` directly; the shell version exposes `<slot name=\"mark\">` so consumers plug their own mark (Wordmark, ChromaMark, HumainMark, etc.) — the shell stays brand-agnostic. Lifted from `chroma-decks/src/layouts/SlideShell.astro` on 2026-06-06."
artifact_kind: component
ownership: shell
mode: both
status: shipped
shell_version_introduced: 0.2.0
composes: []
composed_by:
  - "chroma-decks per-slide files (proto, enhanced-*) via local shim re-export"
  - "(humain consumers haven't reached for it yet — humain's slot sections are inline in scroll pages, not factored into per-slide files)"
theming_tokens_consumed:
  - --ddd-slide-min-height
  - --ddd-slide-padding-y
  - --ddd-slide-padding-x
  - --ddd-slide-bg
  - --ddd-slide-bg-surface
  - --ddd-slide-body-gap
  - --ddd-slide-body-max-width
  - --ddd-slide-mark-offset
  - (fallback chain to --color-background, --color-surface)
props:
  - "class?: string (optional class added to <section>)"
  - "align?: 'start' | 'center' | 'end' (default 'center'; body vertical alignment)"
  - "bg?: 'background' | 'surface' (default 'background')"
  - "dataSlot?: string (forwards to <section data-slot>)"
  - "dataVariant?: string (forwards to <section data-variant>)"
  - "dataSlotTitle?: string"
  - "dataSlotSlug?: string"
slots:
  - "(default) — slide content"
  - "mark — consumer-supplied mark plugged into top-right corner (e.g. <ChromaMark size={32} />)"
plan_of_record: "[[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]]"
file: apps/deck-shell/src/components/SlideShell.astro
authors:
  - Michael Staton
date_authored_initial_draft: 2026-06-06
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
  - Lifted-From-Chroma
from: "dididecks-ai"
from_path: "context-v/sitemap/components/SlideShell.md"
---
# SlideShell

## Mark slot pattern (departure from chroma original)

The original chroma `SlideShell` hard-coded `<ChromaMark size={32} />` and accepted a `showMark` boolean. The shell version inverts the pattern:

```astro
<SlideShell align="center" bg="background">
  <Fragment slot="mark"><MyWordmark /></Fragment>
  <h1>Slide content</h1>
</SlideShell>
```

Consumers plug their own mark (or omit it entirely by passing no `slot="mark"`). Chroma's `chroma-decks/src/layouts/SlideShell.astro` shim file conditionally plugs `<ChromaMark size={32} />` based on the original `showMark` prop, preserving the on-screen result for legacy callers.

## CSS prefix discipline

All classes prefixed `.ddd-slide-*` (e.g. `.ddd-slide`, `.ddd-slide-body`, `.ddd-slide-mark`). Visual values read through `--ddd-slide-*` tokens with sensible fallbacks; consumers don't need to declare new tokens.

## Why not in ScrollDeckPage?

`SlideShell` is per-*slide*; `ScrollDeckPage` is per-*page* (a whole variant). A slide using `SlideShell` would be ONE child of a `ScrollDeckPage`'s slot. Today humain's slot sections are inline in scroll pages (raw `<section>` blocks) — humain hasn't factored to per-slide files yet, so SlideShell isn't load-bearing in humain. Chroma uses it heavily in per-slide files for `enhanced-v2` + `enhanced-v3`.

## Status

- ✅ Shipped — chroma consumes via shim; humain not yet reaching for it

## Related

- [[ScrollDeckPage]] — the page-level wrapper; SlideShell is per-slide chrome inside
- [[SlideCanvas]] — the Play-UI sibling; SlideCanvas is rigid 16:9, SlideShell is responsive scroll-section
- [[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]]

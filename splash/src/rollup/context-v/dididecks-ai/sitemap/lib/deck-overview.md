---
title: "lib/deck-overview — registry + filesystem walker; loadDeckOverview(deckSlug) returns DeckOverview with variants/slots/per-slide-file flags"
lede: "Build-time data loader for landing dashboards. `loadDeckOverview(deckSlug)` returns a `DeckOverview` object — variant cards + per-variant slot lists + counts. Reads `decksRegistryPath` + `slotsRegistryPath` + `slidesComponentsRoot` from the shell's resolved options on `globalThis.__dididecksShellOptions`, so any client-site can call it without the shell knowing the consumer's import paths. Substantiation counts (people, headshots, investor firms, portfolio companies) from the chroma original were deliberately dropped — those are per-client substantiation layers; each client implements its own counts on top of this base if needed."
artifact_kind: lib
ownership: shell
mode: n/a
status: shipped
shell_version_introduced: 0.2.0
public_api:
  - "loadDeckOverview(deckSlug: string = 'pitch'): Promise<DeckOverview>"
  - "DeckOverview interface — { deckSlug, deckTitle, variants: VariantSummary[], unionOfSlotNumbers: string[], totals: {...} }"
  - "VariantSummary interface — { slug, label, status, lastUpdated, registeredSlotCount, authoredSlotCount, staticPortCount, slots: SlotPortStatus[] }"
  - "SlotPortStatus interface — { slot, variant, title?, slug?, fileExists, filePath?, isStaticPort, isRegistered }"
data_inputs:
  - "globalThis.__dididecksShellOptions.absolute.decksRegistry → DECKS array"
  - "globalThis.__dididecksShellOptions.absolute.slotsRegistry → SLOTS map"
  - "globalThis.__dididecksShellOptions.absolute.slidesComponentsRoot → walked for {slot}-{slug}.astro files"
composed_by:
  - "consumer-site landing pages (chroma + humain — and chroma's local deck-overview.ts wraps the shell version to add substantiation counts)"
async: true
plan_of_record: "[[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]]"
file: apps/deck-shell/src/lib/deck-overview.ts
authors:
  - Michael Staton
date_authored_initial_draft: 2026-06-06
date_last_updated: 2026-06-07
at_semantic_version: 0.2.0
status_tags:
  - Shipped
  - Lifted-From-Chroma
from: "dididecks-ai"
from_path: "context-v/sitemap/lib/deck-overview.md"
---
# lib/deck-overview

## Why async

Reads the deck registry via `loadDecksRegistry()` from the shell's `registry-loader`, which uses esbuild to evaluate the consumer's TS registry as a data-URL module. That's an async operation. Calmstorm + chroma's local `deck-overview.ts` was sync because it imported the registry directly via TS imports — the shell version can't do that (it doesn't know the consumer's import paths), so async is structural.

This API drift is the main reason the chroma migration of `lib/deck-overview.ts` is HELD (per [`Lift-Chroma-Decks-Generic-Code-into-Shared-Shell`](../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell.md) Phase 4 status). Chroma's landing-page callsite still uses chroma's local sync version; humain consumes the shell async version directly.

## What was dropped from the chroma original

Substantiation counts:
- `peopleCount` (from `data/team/*.md`)
- `headshotCount` (from `public/people/*.{jpg,png,...}`)
- `investorFirmCount` (from `data/investors/{firm}/` subdirs)
- `portfolioCompanyCount` (from `data/investors/*/portfolio/*.md`)

These are per-client substantiation layers. The DeckStatsPanel handles the "People" + "Companies" tile counts via its own globs against `/data/**`, so they're surfaced — just not from this lib. Each client that needs richer substantiation counts can wrap this lib + add its own walks.

## SlotPortStatus shape — what `isStaticPort` means

A per-slide file at `src/components/slides/{variant}/{slot}-{slug}.astro` is "static-port" if:
1. It imports `SlideCanvas` (the file content matches `/import\s+SlideCanvas\b/`)
2. It wraps content in `<SlideCanvas ...>` (`/<SlideCanvas[\s>]/`)
3. It has NO `<script>` tag

The third criterion is load-bearing: Play-UI's no-JS contract means a `<script>` tag in a per-slide file disqualifies it from clean static print/export.

## Status

- ✅ Shipped — humain consumes via landing page; chroma still on local sync copy pending API reconciliation

## Related

- [[../components/DeckMatrix]] — the rich matrix component that doesn't directly use this lib (it has its own reads) but covers the same data
- [[../components/DeckStatsPanel]] — the tile-row component that ALSO has its own glob reads (matches `/data-assets/*` route globs)
- [[../../models/Deck-Variant-Slot-Registry-Data-Model]] — the underlying registry data model
- [[../../plans/Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]] — Phase 4 covers this lift; status: partial (humain ✓, chroma held)

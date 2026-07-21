---
title: "Slot 01 — Cover (faithful Play-UI recreation of the scroll-deck cover section)"
lede: "First seed per-slide component authored under Phase A+.4. Faithful recreation of the cover section from the scroll variant — same headline, eyebrow, v3-cover class. Proves that the Play-UI runtime can render a real slot identical to its Scroll-UI counterpart. Self-contained styles + imports `../../../styles/global.css` so v3-* tokens resolve in standalone play context."
artifact_kind: per-slide-component
ownership: consumer
variant_slug: enhanced-v3
slot: "01"
slug: cover
status: shipped
classification: faithful-recreation
injects_into_shell_slot:
  route: /play/[deck]/[variant]/[slot]
  deck: pitch
  variant: enhanced-v3
  slot: "01"
file: src/components/slides/enhanced-v3/01-cover.astro
shell_artifact_consumed: "[[../../../../../../ai-labs/dididecks-ai/context-v/sitemap/routes/play-slot]]"
authors:
  - Michael Staton
date_authored_initial_draft: 2026-05-12
date_last_updated: 2026-05-15
at_semantic_version: 0.1.0
status_tags:
  - Shipped
  - Phase-A-Plus-Seed
from: "dididecks-ai/chroma-decks"
from_path: "context-v/sitemap/slides/enhanced-v3/01-cover.md"
---
# Slot 01 — Cover

## Why this exists

Phase A+.4 seed. Two slots were authored to prove the rank → decompose → recreate → present loop end-to-end:

- This one (Cover) — **faithful recreation** to prove Play-UI parity with Scroll-UI.
- [[15-ask]] — **deliberate redesign** to prove Play-UI can render *better* than Scroll-UI.

## Status

- ✅ Renders at `/play/pitch/enhanced-v3/01/`.
- ⚠️ Currently authored as `min-height: 100vh`; A++.4 will drop that once SlideCanvas / ContentFit fully wrap the slot.

## Related

- [[15-ask]] — sibling seed slot.
- [[05-bottleneck]] — decompose-stub-only sibling (not yet recreated).
- [[../../routes/scroll-pitch-enhanced-v3]] — Scroll-UI page where the original cover section lives.

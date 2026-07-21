---
title: "Slot 15 — Ask (deliberate Play-UI redesign of the closing slot)"
lede: "Second seed per-slide component authored under Phase A+.4. Deliberate redesign at component-library quality: mega-numeral `$12M` hero, two-column Round / Status `<dl>` blocks, milestones footer, no inline `<pre>` blocks. Proves Play-UI can render *better* than Scroll-UI, which is the whole point of Phase 2 of the deck-iteration-workflow. Plan deviation: the original A+.4 spec said 'slot 16 — ask'; section reconciliation landed Ask at slot 15 with Colophon at 16."
artifact_kind: per-slide-component
ownership: consumer
variant_slug: enhanced-v3
slot: "15"
slug: ask
status: shipped
classification: deliberate-redesign
injects_into_shell_slot:
  route: /play/[deck]/[variant]/[slot]
  deck: pitch
  variant: enhanced-v3
  slot: "15"
file: src/components/slides/enhanced-v3/15-ask.astro
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
from_path: "context-v/sitemap/slides/enhanced-v3/15-ask.md"
---
# Slot 15 — Ask

Sibling of [[01-cover]]. Same Phase A+.4 origin; same migration trajectory (A++.4 will drop `min-height: 100vh` once SlideCanvas wraps it).

## Related

- [[01-cover]] — faithful-recreation sibling.
- [[05-bottleneck]] — decompose-stub-only.
- [[../../routes/scroll-pitch-enhanced-v3]] — Scroll-UI source of the original.

---
title: "Citation Registry for reach-edu-hub Narratives"
lede: "One hex code per unique article, held once per client. Narratives cite [^abc123] inline; definitions resolve from here. Codes are minted once and never renumbered — reorder, split, or scramble content freely without breaking claim–source pairing."
date_created: 2026-07-28
date_modified: 2026-07-28
at_semantic_version: 0.0.1.0
status: Draft
category: Reference
tags: [Citations, LFM, Hex-Codes, Registry, reach-edu]
authors:
  - Michael Staton
augmented_with: "Claude Code (Fable 5)"
from: "dididecks-ai/reach-edu-hub"
from_path: "context-v/narratives/citations/README.md"
---
# Citation Registry — reach-edu-hub narratives

Per LFM rule 2 (`lossless-flavored-markdown` skill): inline references use stable
hex codes (`[^1ucdcd]`), never sequential numbers. Sequential numbers break the
moment content is reordered, split, or copy-pasted between documents — the
memopop assembler's positional-renumbering pain (`manage-memo-citations` skill)
is the counterexample this design avoids. Render order is resolved at build
time; the code is the durable identity.

## Files

- **`registry.csv`** — source of truth. One row per unique article:
  `hexcode, title, source_url, published, capture_path, origins, added`.
  - `hexcode` — minted once (random 6-char lowercase hex, ≥1 letter), never
    reused, never renumbered. If an article drops out of every narrative, its
    row stays (codes are permanent identities).
  - `capture_path` — path into `augment-it/clients/reach-edu/corpus/` where the
    verbatim Jina capture lives (empty = not yet captured).
  - `origins` — where the article entered the registry
    (`mega-gifts-research`, `narrative:<slug>`), pipe-separated.
- **`definitions.md`** — generated, paste-ready footnote definitions in the form
  `[^abc123]: 2026, Jan 04. [Title](https://…)`. Regenerate from the CSV; do not
  hand-edit (edit the CSV, then regenerate).

## Discipline

1. **Citing in a narrative:** find the article in `registry.csv`, use its code
   inline with a **single space before each mark, Obsidian-friendly**
   (`…claim. [^abc123] [^def456]` — never `…claim.[^abc123][^def456]`), and
   copy its definition line from
   `definitions.md` into the narrative's `## Citations` block. Definitions may
   sit anywhere in the doc; render matches them by code.
2. **New article:** add a row to `registry.csv` with a freshly minted code
   (check uniqueness against the `hexcode` column), then cite it. Capture the
   article into the augment-it corpus inbox when it matters enough to preserve
   verbatim, and backfill `capture_path`.
3. **Never renumber, never recycle.** A code that exists means that pairing is
   claimed forever, even across future decks and one-pagers.
4. **Same article everywhere.** All Reach surfaces (strategy narratives, decks,
   one-pagers) cite the same code for the same article — that's why the
   registry is per-client, not per-document.

## Provenance

Seeded 2026-07-28 from two pools: the mega-gifts-by-topic funding research
(`augment-it/clients/reach-edu/outputs/2026-07-28_mega-gifts-by-topic/`, 81
articles, all captured in the corpus) and the source lists of the seven
June-2026 strategy narratives (46 articles, mostly uncaptured). 125 unique
articles after overlap.

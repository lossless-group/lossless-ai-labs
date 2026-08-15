---
title: "Browse Corpus — a screen for the work that already exists"
lede: "The first surface. Read-only, local-first, pointed at the 892 files already built for reach-edu. Brought forward from Phase 7 because the operator has been reading terminal output while waiting for something to click on, and a Tauri shell was never the cheapest way to give them one."
date_created: 2026-08-08
date_modified: 2026-08-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Draft
spec_reference: "[[../plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History]] — Phase 7, pulled forward"
tags:
  - Spec
  - Corpora-Builder
  - UI
  - Browse
from: "corpora-builder"
from_path: "context-v/specs/Browse-Corpus.md"
---
# Browse Corpus

## Why Care?

The plan put every surface at Phase 7 behind a Tauri shell. That sequencing was
the agent's, not the operator's, and it produced four phases of terminal output
for someone who said plainly: *"I'm waiting for a UI I can use."*

A Tauri app was never the cheapest way to a first screen. A FastAPI server and
one served page reuse the storage seam, the model, and capture exactly as they
are. Tauri remains available; it stops being the gate.

The first screen is **read-only against the local corpus** for two reasons.
reach-edu already holds 892 files representing real work the operator cannot
currently see well — so there is something worth looking at on the first load,
rather than an empty state. And read-only cannot damage a client corpus, which
means the screen can ship before the triage-and-rewrite questions are settled.

## Scope

**In:** listing sources under a prefix with their parsed metadata; filtering by
domain directory; free-text search over title and excerpt; opening one source's
raw text; surfacing damaged files rather than hiding them; a served page.

**Out:** every kind of write — no capture, no triage, no promotion, no edit.
Authentication (a localhost surface for one operator). R2 (the seam makes it a
config change when wanted). Tauri packaging.

## Behaviour

1. `corpora serve [--local <dir>]` starts a local HTTP server and prints its URL.
2. `GET /api/sources` returns every source under a prefix with `path`, `title`,
   `status`, `content_pulled`, `published_at`, `excerpt`, and its domain folder.
3. **A damaged file appears in the listing with its error**, never omitted. The
   ImmuneCo failure was 13 sources being silently absent from a count; a browse
   screen that drops what it cannot parse repeats exactly that.
4. `GET /api/source?path=` returns one source's raw text, unmodified.
5. Search matches title and excerpt, case-insensitively.
6. Listing is sorted newest-`fetched_at` first, because the question a corpus
   browser answers most often is "what did I just add".
7. The server writes nothing, ever. It opens the store read-only in the sense
   that no handler calls `write` or `delete`.

## Tests

| ID | Given / When / Then |
|---|---|
| `BROWSE-01` | Given a store holding source files, when sources are listed, then each entry carries path, title, status, content_pulled, published_at and excerpt |
| `BROWSE-02` | Given sources under two different domain folders, when listing is filtered by one prefix, then only that folder's sources are returned |
| `BROWSE-03` | Given a file whose frontmatter is damaged, when sources are listed, then it appears with an `error` field rather than being omitted from the results |
| `BROWSE-04` | Given a search term matching a title and another matching only an excerpt, when each is searched, then both match case-insensitively |
| `BROWSE-05` | Given sources with different `fetched_at` values, when listed, then they are ordered newest first |
| `BROWSE-06` | Given a path, when one source is loaded, then its raw text is returned byte-identical to what is stored |
| `BROWSE-07` | Given a request for a path outside the corpus, when it is loaded, then it is refused rather than served |
| `BROWSE-08` | Given a source with no `excerpt` in its frontmatter, when it is listed, then the excerpt falls back to the first real prose in its body, skipping navigation chrome |
| `BROWSE-09` | Given both the `live/<type>/<slug>/sources/` layout and reach-edu's pre-existing `funders/<slug>/` and `strategies/<slug>/sources/`, when domains are derived, then each reads as an operator would name it |

## Acceptance

```
uv run python scripts/spec_status.py --spec Browse-Corpus --require-green
```

exits 0, and the operator has opened the page against the real reach-edu corpus
and found something they recognise (Gate 4).

## Open questions

1. **Does this become the Tauri app's webview, or stay a separate web surface?**
   W5 wants both eventually. Deferred until there is a reason to choose.
2. **Plain HTML now, SvelteKit later?** The house style says Phase 7 inherits
   memopop-native's SvelteKit + Svelte 5. This screen is one self-contained page
   with no build step, deliberately, so it exists today. If it grows past a few
   hundred lines it should become the real thing rather than sprawl.

## Related

- [[Storage-Seam]] · [[Source-File-Model]] · [[Capture-Link-First]]
- [[../loops/Spec-to-Shipped-With-TDD]] · [[../contracts/Autonomy-Gates]]

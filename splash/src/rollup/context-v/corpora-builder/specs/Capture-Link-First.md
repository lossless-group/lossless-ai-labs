---
title: "Capture, Link-First — the first command that pays for itself"
lede: "Phase 3. `corpora add <url>` turns a link into a filed source: fetched, named, deduped, and written to R2. Metadata-only by default, because the origin lesson of this whole tree is that bulk enrichment goes haywire — grounding cost is spent on survivors, never on candidates."
date_created: 2026-08-08
date_modified: 2026-08-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Draft
spec_reference: "[[../plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History]] — Phase 3"
tags:
  - Spec
  - Corpora-Builder
  - Capture
  - Two-Tier-Fetch
  - Phase-3
from: "corpora-builder"
from_path: "context-v/specs/Capture-Link-First.md"
---
# Capture, Link-First

## Why Care?

This is the phase the project was asked for. The operator's words, at the point
the whole thing was still three design documents:

> *"I just want to get something running as I keep running into the need to
> create corpora."*

Phases 1 and 2 are plumbing — bytes at keys, and a parser that does not lie.
This is the first command that is useful on its own, and after it every later
phase is improvement rather than prerequisite.

## Scope

**In:** `corpora add <url>`; fetching metadata and optionally body; the
two-tier gate; dedup by `normalized_url`; filing under a domain or into the
inbox; binary siblings; recording failures as facts.

**Out:** file-first capture with link recovery (Phase 5); triage and promotion
(a source lands as `candidate` and nothing here promotes it); checkpointing
(Phase 4); anything that edits an existing source file — which is what defers
`Source-File-Model`'s open question 0 one more phase, since this command only
ever creates.

## Behaviour

1. `corpora add <url> --domain <type>/<slug>` writes one source file at
   `live/<type>/<slug>/sources/<YYYY-MM-DD>_<title-slug>.md`.
2. **Two-tier by default.** A bare `add` writes metadata only — title,
   publisher, `published_at`, a short excerpt — and sets `content_pulled:
   false`. `--fetch` pulls the full body and sets it true.

   This is the origin lesson of the tree, not a performance tweak: augment-it
   exists because bulk AI enrichment went haywire. Gate every enrichment step;
   spend grounding cost on survivors, never on candidates.
3. **Dedup by `normalized_url`.** If a source with the same normalised URL
   already exists in the target, no second file is written and the command
   reports the existing path.
4. **A failure is a fact.** An unreachable URL still writes a file, with the
   failure in `machine_verdict` and `content_pulled: false`. A source that
   404s is information — it is how you learn a citation rotted.
5. **Nothing here writes `verdict`.** Reachability is not approval, permanently.
6. With no `--domain`, the source lands in `live/inbox/`. The inbox is
   capture-first staging and the richest bucket, not a cleanup queue.
7. A URL that resolves to a PDF gets a **binary sibling** sharing the markdown's
   stem, with `sha256`, byte length, and `download_status` — recorded **even
   when the download failed**, because absence cannot distinguish "never tried"
   from "tried and got a 403".
8. Fetching is behind an injectable interface. The test suite performs no
   network I/O; a live fetch is a gated, deliberate run like `STORE-14`.

## Tests

| ID | Given / When / Then |
|---|---|
| `CAPTURE-01` | Given a reachable URL and a domain, when `add` runs, then a file exists at `live/<type>/<slug>/sources/<date>_<title-slug>.md` carrying `url`, `fetched_at`, and `status: candidate` |
| `CAPTURE-02` | Given a URL whose normalised form already exists in the target, when `add` runs again, then no second file is written and the existing path is reported |
| `CAPTURE-03` | Given a URL that cannot be fetched, when `add` runs, then a file is still written, `machine_verdict` records the failure, and `content_pulled` is false |
| `CAPTURE-04` | Given no `--fetch`, when `add` runs against a page with a long body, then only an excerpt is stored and `content_pulled` is false |
| `CAPTURE-05` | Given `--fetch`, when `add` runs, then the full body is stored below the frontmatter and `content_pulled` is true |
| `CAPTURE-06` | Given no domain, when `add` runs, then the source lands under `live/inbox/` |
| `CAPTURE-07` | Given any fetch outcome whatsoever, when `add` runs, then `verdict` is empty — no machine result is ever promoted to an analyst verdict |
| `CAPTURE-08` | Given a URL with tracking params and a `www.` host, when `add` runs, then `normalized_url` is the canonical form while `url` keeps exactly what was passed |
| `CAPTURE-09` | Given a URL serving a PDF, when `add` runs, then a binary sibling sharing the markdown stem is written and `binary_asset` carries its sha256, byte length, and `download_status: ok` |
| `CAPTURE-10` | Given a PDF URL whose download fails, when `add` runs, then `binary_asset` is still recorded with a failing `download_status` and no sibling is written |
| `CAPTURE-11` | Given a page whose body exceeds the excerpt cap, when `add` runs without `--fetch`, then the excerpt is truncated to the cap |
| `CAPTURE-12` | Given a target already holding a file with the same name from a different URL, when `add` runs, then the new file gains a `_2` suffix rather than overwriting |
| `CAPTURE-13` | Given a fetch that succeeds, when `add` runs, then `origin` records how the source arrived and `fetched_at` is an ISO-8601 UTC instant |
| `CAPTURE-14` | Given Jina's real response shape, where preamble lines are blank-line separated and the body follows a `Markdown Content:` marker, when it is parsed, then the preamble keys are extracted and the body begins after the marker |
| `CAPTURE-15` | Given a body opening with skip-links and a nav list, when an excerpt is taken, then it starts at the first real prose and carries no markdown link syntax |
| `CAPTURE-16` | Given a newly captured source, when it is written, then it states `status` and `content_pulled` explicitly rather than relying on a reader's defaults |

**Not in the automated suite, run deliberately:** a live fetch against a real
URL, writing into the dev bucket. Gated behind `CORPORA_LIVE_FETCH=1`, like
`STORE-14` and `CORPUS-01`. Mocked HTTP proves the code shape; it says nothing
about what Jina returns for a real page.

## Acceptance

```
uv run python scripts/spec_status.py --spec Capture-Link-First --require-green
```

exits 0, `bash scripts/check.sh` passes its blocking rungs, and the operator has
added a real link to a real corpus and looked at the file (Gate 4).

## Open questions

1. **Which fetcher?** Jina (`r.jina.ai`) is what augment-it and memopop both
   use, and its preamble carries title and published date. Behind the interface,
   so a second implementation is additive.
2. **Excerpt cap of 200 characters** — inherited from the blueprint, still
   untested against how an analyst triages. Unchanged, still open.
3. **Should `add` ever create the domain it files into?** For now yes,
   implicitly, because refusing to file a source because a folder does not exist
   is friction with no safety benefit. Revisit if domains grow a definition file
   that matters.

## Related

- [[Source-File-Model]] — Phase 2, the schema this writes
- [[Storage-Seam]] — Phase 1, what it writes through
- [[Source-File-Schema-Reconciliation]] — the two-tier fetch rule, constraint 3
- [[../loops/Spec-to-Shipped-With-TDD]] · [[../contracts/Autonomy-Gates]]

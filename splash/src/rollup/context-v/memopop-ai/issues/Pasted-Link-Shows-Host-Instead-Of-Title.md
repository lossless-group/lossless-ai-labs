---
title: "Pasted Link Shows the Host Instead of the Title"
lede: "Pasting an a16z article into the approval surface produced a row reading `a16z.com` — while the preview pane directly beneath it displayed `Title: GMV Retention: The Marketplace Metric Most Ignore` and `Published Time: 2022-04-28`. The metadata is fetched and parsed correctly; it just never reaches the row. Three separate defects on the same path: paste fetches nothing, preview discards what it learns, and the preview pane renders Jina's header block as if it were article content."
date_authored_initial_draft: 2026-08-08
date_authored_current_draft: 2026-08-08
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-08-08
at_semantic_version: 0.0.0.1
status: Open
publish: false
category: Issue
augmented_with: Claude Code on Claude Opus 5 (1M context)
authors:
  - Michael Staton
tags:
  - Issue
  - Memopop-Native
  - Source-Curation
  - Metadata
  - Jina
  - Two-Tier-Fetch
from: "memopop-ai"
from_path: "context-v/issues/Pasted-Link-Shows-Host-Instead-Of-Title.md"
---
# Pasted Link Shows the Host Instead of the Title

## Reproduction

1. Open the source-approval surface on any deal.
2. Paste `https://a16z.com/gmv-retention-the-marketplace-metric-most-ignore/` into **Add a source URL**.
3. The row appears titled **`a16z.com`**.
4. Click **Preview**. The pane shows:

```
Title: GMV Retention: The Marketplace Metric Most Ignore

URL Source: https://a16z.com/gmv-retention-the-marketplace-metric-most-ignore/

Published Time: 2022-04-28T03:20:24+00:00

Markdown Content:
Imagine you're running a marketplace startup — let's call it ACo — that allows consu…
```

The correct title and publication date are sitting on screen, one row below the field that should be showing them.

## What is actually broken

Not the fetch, and not the parse. `parse_jina_preamble()` handles this shape correctly and is unit-tested against it. The metadata never travels from the fetch response into the row the analyst is looking at.

**Defect A — paste performs no fetch at all.**
`sources.svelte.ts` → `add()` is pure local state:

```ts
this.rows = [...this.rows, blankRow(clean, { verdict: 'approved', ...partial })];
```

`blankRow` leaves `title: ''`, and the template falls back to `{row.title || hostOf(row.url)}` — hence `a16z.com`. Nothing is ever requested.

This contradicts the convention we already wrote. `agent-skills/source-with-extracts-md` §"Two-tier fetch": *"On save, pull cheap metadata + a ~200-char excerpt (Jina Reader). Only on promote pull the full body."* The cheap tier is skipped entirely on the paste path.

**Defect B — preview learns the metadata and throws it away.**
`preview()` writes only into the preview cache:

```ts
this.previews = { ...this.previews, [url]: res.ok ? (res.markdown ?? '') : … };
```

`this.rows` is never touched, so a title the server just parsed is discarded client-side. Note the server *does* persist it: `apply_fetch` falls back to `headers["Title"]`, so `inputs/sources/<date>_gmv-retention-….md` on disk almost certainly has the right `title` and `published_at`. **The file is correct and the UI is lying** — which is the worst possible split, because the analyst approves against the wrong-looking list.

**Defect C — the preview pane renders the preamble as content.**
`parse_jina_preamble()` runs inside `source_file.apply_fetch` on the persistence path only. The `markdown` field returned to the webview is still the raw Jina string, so `Title: / URL Source: / Published Time: / Markdown Content:` render as the first four lines of the "article". Cosmetic relative to A and B, but it is what made the bug visible, and it undercuts Preview's job — answering *"is this real content"* — by putting four lines of machine header in front of the content.

## Why it matters beyond cosmetics

- **Re-search is silently disabled.** `attempt_url_recovery` requires a title and returns `None` without one. Every pasted source is born un-recoverable.
- **The filename is wrong.** `source_filename()` falls back to the URL when untitled, so a paste-then-approve can file as `2026-08-08_a16z-com-gmv-retention-….md` instead of a title slug.
- **Sorting and scanning break down.** A list of 80 rows reading `a16z.com`, `cbinsights.com`, `cbinsights.com` is unscannable — exactly the "going through them takes forever" complaint the frontloaded surface exists to fix.
- **`published_at` goes missing** on the row, so recency is invisible at the moment of judgment.

## Proposed fix

**1. Paste fires the cheap tier (fixes A).**
`add()` returns immediately with the row so the UI stays responsive, then a background metadata fetch fills `title` / `publisher` / `published_date` / `excerpt` in place. Row shows the host as a placeholder with a subtle "fetching…" state, then resolves. Failure leaves the host — degraded, never blocking.

**2. Fetch responses update the row (fixes B).**
Both paste-fetch and Preview merge their result into `this.rows`, with the analyst's own edits winning: never overwrite a non-empty `title` a person typed. One shared `applyFetchedMetadata(url, res)` so the two paths cannot drift.

**3. Return a parsed body, not the raw string (fixes C).**
`/actions/fetch-source` already parses the preamble for persistence — return the parsed `markdown` plus the lifted `title` / `published_at` as response fields, rather than making the client re-parse. The server is already doing the work.

## Decision points

1. **Fetch on paste, or on blur/add-batch?** One paste is one fetch, but an analyst pasting ten links in a row would fire ten. Lean: fetch immediately, cap concurrency at ~3.
2. **Does the cheap tier persist a source file?** Currently only Preview writes one. If paste fetches metadata, it could write a `candidate` file with no body. Lean: **yes** — that is precisely the candidate tier the convention describes, and it makes the on-disk state match the list from the first moment.
3. **Should Preview strip the preamble, or show it collapsed?** The header is occasionally useful (it is the provenance). Lean: strip from the body, surface `published_at` in the row's meta line where it belongs.
4. **Retro-fix existing rows?** ImmuneCo's 79 sources already carry titles, so this only affects newly pasted ones. A "fetch missing metadata" bulk action could backfill any row whose title is empty. Defer until it is actually needed.

## References

- `agent-skills/source-with-extracts-md` — the two-tier fetch rule this path violates.
- [[Constraining-Memo-Writing-to-an-Approved-Source-Set]] — the surface.
- `corpora-builder/context-v/blueprints/Source-File-Schema-Reconciliation.md` — canonical `title` / `published_at` semantics.
- `src/lib/stores/sources.svelte.ts` — `add()`, `preview()`.
- `apps/memopop-orchestrator/src/curation/source_file.py` — `parse_jina_preamble()`, `apply_fetch()`.
- `apps/memopop-orchestrator/src/server/sources_api.py` — `/actions/fetch-source`.

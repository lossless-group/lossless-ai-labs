---
title: "Ranked Search — Pagefind over the manifest"
lede: "Substring matching cannot rank, stem, or take two words in any order. Pagefind can. It indexes the manifest, and never replaces it."
publish: true
date_created: 2026-08-23
date_modified: 2026-08-23
date_authored_initial_draft: 2026-08-23
date_authored_current_draft: 2026-08-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: Draft
site_uuid: 1078a6c2-f544-4371-a4b7-8a0856fa4046
hex_code: k2yzeo
tags:
  - Spec
  - Corpora-Builder
  - Retrieval
  - Search
  - Pagefind
from: "corpora-builder"
from_path: "context-v/specs/Ranked-Search.md"
---
# Ranked Search

## Why Care?

With [[Search-Index]] in place, search is fast. It is still `needle in haystack`
against four strings, which means:

- `apprenticeship funding` finds nothing unless those two words sit adjacent in
  that order.
- `funding` never finds a source that says *funded*.
- Results come back in date order, so the best match is wherever it happens to
  fall.
- The focus chips carry no counts until you click one.

Pagefind answers all four, and it is already in this tree — the splash pages use
it. What it does **not** do is stay fresh.

## The decision everything else follows from

**Pagefind does not replace the manifest.**

Pagefind has no incremental add: one new source means rebuilding the whole index.
At 832 records that is seconds, but it means the capture path cannot keep it
current, and a search index silently lagging the corpus is the failure this whole
line of work exists to prevent.

So the two coexist, with distinct jobs:

| | Manifest | Pagefind |
|---|---|---|
| Freshness | updated on every capture | rebuilt on demand |
| Job | listing, filtering, exactness | ranking, stemming, facets |
| Cost | one read | a static bundle, chunk-loaded |
| When absent | the corpus is read | the manifest answers |

## Scope

**In:** building a Pagefind bundle from the manifest; serving it from the
sidecar; a client wrapper that searches it, reports staleness, and falls back.

**Out:** semantic search; Pagefind's own UI components; multi-focus filtering
(natively supported, still gated on multi-valued data existing).

## Behaviour

### 1. Pagefind indexes the manifest, not the corpus

One extract, two consumers. Each entry becomes an `addCustomRecord` whose content
is the source's searchable text and whose `meta.path` is its corpus key. Nothing
re-reads the corpus, so building the search index costs whatever the manifest
costs and nothing more.

### 2. The bundle lives at `index/pagefind/`, served by the sidecar

Written into the corpus store like the manifest, which keeps a private bucket
private and works identically for a local directory. The sidecar serves it at
`/pagefind/*` with correct content types — the WebAssembly module included, since
the runtime refuses to stream-compile anything else.

Only keys under `index/` are written. Building a search index must not be able to
modify a source.

### 3. `domains:` become filters — and stay searchable words

The filter is the natural fit: Pagefind filters are faceted and return counts,
which is exactly the `"12 in Workforce Development · 832 in the corpus"` shape
already hand-built in [[Strategy-Focus]]. An exact tag routed through the filter
also stays exact, where the text index would tokenise
`strategy:adult-literacy-numeracy` and stem the pieces.

**But the tags are indexed as text as well, and that is not redundancy.**
Strategy-Focus Behaviour 1 promises that typing `literacy` reaches a source
carrying `strategy:adult-literacy-numeracy` even when neither its title nor its
excerpt says the word. Filters answer exact values, not words inside them — so
tags that were *only* filters would quietly drop that promise. They go in both
places: filters for narrowing and counting, prose for recall.

They go in **as words**, not as raw tags — "adult literacy numeracy" rather than
`strategy:adult-literacy-numeracy` — because of the rule below.

### 4. What is indexed is what gets read

**Pagefind excerpts from the same text it matches on.** The index is therefore
not only an index; it is what a reader ends up looking at, and anything put in
for recall can surface in a result.

A first version fed in the corpus key, raw and de-punctuated, so that typing part
of a path would rank a source. It worked, and every result then displayed
`live strategies adult literacy numeracy sources 2026 05 06 source 089.md` as
though it were prose. Visible the moment results were rendered under the search
box; invisible while they were only filtering a list.

So the key is not indexed. It lives in `meta.path`, which is what the client
joins on, and the loss is small: a filename in this corpus is a slug of its own
title, and the title is indexed.

Two consequences worth knowing before reading the code:

- The builder widens Pagefind's word characters to include `:` `-` `_` `/` `.`,
  or a corpus key is torn apart before it ever reaches the filter.
- Pagefind loads its filter index **lazily**. Until something asks for the
  filters, a search reports every count as absent — measured, not read in a doc.
  The client asks once, up front, and only on the path that needs counts.

### 5. Search returns keys; rows come from the manifest

Pagefind ranks and returns corpus keys. Rows are then built the same way every
other listing builds them. Stuffing row JSON into Pagefind metadata would put
row-shaping in a second place, and two row-builders drift.

### 6. A stale bundle is reported and bypassed

The build records the fingerprint of the manifest it was built from. When that
does not match the current manifest, the client says the ranking is stale and
falls back to the server's manifest-backed search — which is always current,
because capture keeps it so. **Serving stale ranking silently is worse than
serving unranked results honestly**, so the reason is a sentence the UI shows,
not a log line.

### 7. Ranking works on rows in hand, and only while it holds all of them

Ranked search reorders rows the client already has, which is what makes it
instant rather than a round trip per keystroke — the manifest is what made
fetching them all affordable in the first place.

It is only *correct* while those rows are everything the current domain and focus
select — **the current listing's total, not the corpus total.** A hit ranked
outside the fetched window has no row to render, so it would disappear rather
than merely rank low. When a selection outgrows the window, ranking stands down
and the server searches. **A silent cap reads as "covered everything" when it
did not.**

Judging coverage against the corpus instead stood ranking down the instant any
focus chip was clicked — 41 rows held, 847 in the corpus. It looked like a
deliberate fallback and was a comparison against the wrong number, which is why
the browser drive is part of the loop and not a formality.

### 8. A result says why it matched, and costs one fetch to say it

Pagefind returns matches lazily: the ranked list is cheap, and each result's
`data()` is a **separate round trip** for that record's fragment. It carries the
title, the focus values, and the passage that matched with `<mark>` around the
terms — which is what makes a result say *why* it matched instead of showing the
same first 240 characters of body that every source shows.

**Resolve only what you draw.** Resolving every match cost **615 fetches and
821ms for one query** on an 845-source corpus, measured against local files; over
HTTP to the sidecar it is the reason search felt slow. The count comes from the
result list, which needs no fetch; the visible page is resolved in parallel.

The excerpt is rendered as HTML, so it is first reduced to text plus `<mark>`.
Pagefind escapes fragment content itself — but "the library escapes it" is a
claim that stops being true the day the library changes.

### 9. Results appear under the search box, not only in the list

Modelled on `context-vigilance-kit/splash`, whose search is a panel under the
input rather than a filter on a list further down. The two answer different
questions — the list is *"show me everything matching, so I can work through
it"*, the panel is *"did the thing I am thinking of come back"* — and only the
first existed.

Eight results: title, the matching passage, the `domains:` tags. It renders from
**rows**, not from Pagefind, so a corpus with no search index still gets a panel;
with an index the same rows arrive ranked and marked.

### 10. No Node, no bundle, no failure

`check.sh` already runs two blocking Node rungs and already skips them when Node
is absent, so the Python side stays runnable on a machine that has never built
the frontend. `reindex` does the same: the manifest is written, the Pagefind
build is skipped with a message, and the exit status is success.

Likewise a corpus with no bundle at all searches through the manifest and returns
the same rows.

## Tests

Ownership is split across both suites; the ledger merges them.

| ID | Suite | Given / When / Then |
|---|---|---|
| `SEARCH-01` | node | Given a source whose text contains two query words separated by others, when both are searched in either order, then it matches — which substring search cannot do |
| `SEARCH-02` | node | Given a source containing a morphological variant of a query word, when the base word is searched, then it matches |
| `SEARCH-03` | node | Given one source matching in its title and another only in its body, when both are searched, then the title match ranks higher |
| `SEARCH-04` | node | Given sources across several focuses, when a query is filtered to one focus, then only that focus's sources return, and every focus reports its count for that query |
| `SEARCH-05` | node | Given a tag needle of the form `type:slug`, when it is searched, then the tagged sources resolve through the filter rather than the text index, preserving the FOCUS-01 promise |
| `SEARCH-06` | node | Given a bundle whose recorded fingerprint does not match the current manifest, when the search mode is decided, then it is the server's manifest-backed listing, and the reason names staleness in words a person can read |
| `SEARCH-07` | node | Given no bundle at all, or a corpus with no manifest, when the search mode is decided, then it is the server's manifest-backed listing rather than an error |
| `SEARCH-08` | py | Given a corpus and a manifest, when the search index is built, then only keys under `index/` are written and no source is modified |
| `SEARCH-09` | py | Given a machine with no Node on PATH, when the search index is built, then it is skipped with a stated reason and reported as success |
| `SEARCH-11` | node | Given more sources selected by the current filter than the client is holding rows for, when coverage is judged, then ranking stands down in favour of the server and says why — and a filter narrower than the window is still covered by its own rows |
| `SEARCH-12` | node | Given a query matching far more sources than are drawn, when a page of results is taken, then the count covers every match, each drawn row costs at most one fragment fetch, and each hit carries the marked passage that matched — reduced to text and `<mark>`, nothing else |
| `SEARCH-10` | py | Given a built bundle, when the sidecar serves it, then each file is returned with the content type its runtime requires, and a path escaping the bundle is refused |

## Acceptance

`uv run python scripts/spec_status.py --spec Ranked-Search --require-green` exits
0, and the operator has walked the surface (Gate 4).

## Related

- [[Search-Index]] — the manifest this indexes and falls back to
- [[Strategy-Focus]] — the focus vocabulary these filters carry
- [[../plans/Search-Index-Then-Pagefind]] — the two-phase plan, and the risks

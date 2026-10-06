---
title: "Search Index, Then Pagefind"
lede: "Search reads 845 files. Phase 1 writes a manifest so it reads one. Phase 2 puts Pagefind on top of that manifest, not in place of it."
publish: true
date_created: 2026-08-23
date_modified: 2026-08-23
date_work_started: 2026-08-23
date_work_completed: 2026-08-23
date_authored_initial_draft: 2026-08-23
date_authored_current_draft: 2026-08-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.2.0
status: Shipped
site_uuid: 8488d56c-0b2a-434a-a232-7912e46749ec
hex_code: mszo2b
tags:
  - Plan
  - Corpora-Builder
  - Retrieval
  - Search
  - Pagefind
summary: >-
  Two sequenced phases against the 5.8-second search. Phase 1 writes a per-source
  manifest to the corpus so a listing costs one read instead of 845, and closes
  the FOCUS-07 gap the Strategy-Focus spec named but did not build. Phase 2 adds
  Pagefind for ranked, faceted full-text search, indexing the manifest rather
  than the corpus. The load-bearing decision is that Pagefind does NOT replace
  the manifest — Pagefind has no incremental add, so it cannot stay fresh on
  capture, and the manifest is what keeps the listing honest between rebuilds.
  Phase 2 is explicitly optional and gated on Phase 1's measured result.
from: "corpora-builder"
from_path: "context-v/plans/Search-Index-Then-Pagefind.md"
---
# Search Index, Then Pagefind

## Outcome — both phases shipped 2026-08-23

Specs [[../specs/Search-Index]] (`INDEX-01`…`10`) and [[../specs/Ranked-Search]]
(`SEARCH-01`…`11`) are green, 0 missing. Measured on a synthetic 845-source
corpus shaped like reach-edu — 241 tagged, 604 untagged, nine domain
declarations. **Nothing was written to a client bucket**; reindexing writes into
the corpus, so measuring against reach-edu on R2 needs the operator's word.

| | unindexed | indexed |
|---|---|---|
| page load | 200 reads | **1** |
| search | 845 reads | **1** |
| search + focus | 854 reads | **10** (manifest + nine `index.md`) |

Four things the plan did not anticipate, all found by building or driving it:

1. **The bundle is 866 objects** — Pagefind writes one fragment per record. A
   delete-then-rewrite would be ~1,700 R2 operations per rebuild against a
   client's bucket. Fragment names are content-addressed, so an unchanged
   rebuild now resends **14 files, not 866**; adding one source resends 22.
2. **`domains:` had to be both filters and indexed text.** As filters only, the
   Strategy-Focus promise that typing `literacy` reaches
   `strategy:adult-literacy-numeracy` would have died quietly — filters answer
   exact values, not words inside them.
3. **Pagefind loads its filter index lazily.** Until something asks for the
   filters, an identical query reports every count as absent. Measured, not read
   in a doc.
4. **Coverage was judged against the wrong number.** Ranking stands down when it
   holds fewer rows than the listing selects — but comparing against the *corpus*
   total stood it down on every focus chip (41 rows held, 847 in the corpus). It
   looked like a deliberate fallback. Found by driving it, not by reading it.

`prose_excerpt` moved to `src/model/text.py`: the manifest has to compute the
same excerpt a direct read does, and `src/capture/__init__` eagerly imports
`add`, so importing it from the capture package was a cycle. The call site
`from src.capture.fetch import prose_excerpt` still works.

Gate 4 — the operator walk-through — has **not** happened, so both specs stay
`Draft`. A green ledger proves the code does what the tests say; only the
operator judges whether it does what they meant.

## Why Care?

`list_sources` opens **every file in the corpus** when a search term is present.
Against reach-edu on R2 that is 845 round-trips and 1.2–5.8 seconds, versus 0.48s
for an unsearched page. The gap is what produced `BROWSE-17` — the operator
reported "search filters once, then stops," which turned out to be a fast request
landing before a slow one still in flight. The stale-response guard fixed the
symptom. **This plan fixes the cause.**

Two documents already name the fix and decline to build it:

- `Strategy-Focus.md` §4 — *"the fix when it does is an index, not 845 reads: a
  small manifest written on capture and on re-tag… **Not built.**"*
- `Show-The-Filesystem-Of-A-Workspace.md` — *"structure lives in the key; painting
  it costs zero reads"* — which is why `/api/meta` and `/api/tree` are already
  fast and search is not. Search needs what is *inside* the files, so the only
  way to stop reading them is to have written the answer down.

`Strategy-Focus.md` also stakes a test on the day this lands: `FOCUS-07` asserts
that a plain page load **misses** a source tagged into a strategy it does not
live under. That assertion inverts here, deliberately, and the spec says so:
*"the day it changes, a test says so."*

## Scope

**In:** a per-source manifest in the corpus (Phase 1); Pagefind for ranked,
faceted search over that manifest (Phase 2).

**Out:**

- **Semantic search.** "About apprenticeship funding" rather than "contains the
  word" is an embedding problem, and Chroma is already wired across this tree for
  it. Neither phase here touches meaning.
- **A hosted search service.** Turbopuffer and friends are the wrong shape: 832
  documents is far below where their economics start, and client corpora leaving
  the machine is a decision, not a perf tweak.
- **Extending `CorpusStore`.** See *Open question 1* — there is a free win in
  `list_stat()` and it changes the storage seam, so it stays out.

## Phase 1 — The manifest

### Goal

A search costs **one read**. A page load costs **zero**. Measured as read counts,
never as wall-clock — a second-count promise passes on a fast laptop and rots.

### Decisions

**1. It lives in the corpus, at `index/sources.jsonl`.**

The alternative is a machine-local cache alongside `BinStore`. Rejected: the
manifest is *derived from the corpus and identical for everyone who has it*, so
making each machine rebuild it wastes 845 reads per clone to avoid one small
object. In the corpus it travels with the bytes, and the git-backed change feed
gets a readable diff of what a capture did.

Taking this as the default rather than raising it as Gate 1, per
[[../contracts/Autonomy-Gates]]: a question with a defensible answer is noise.

**2. JSONL, one entry per key, sorted by key.**

Sorted so a diff shows what changed rather than a reshuffle — the same reasoning
as `FIELD_ORDER` in the frontmatter model. Line-per-entry so a damaged manifest
costs one source rather than the file.

**3. It stores what the file says. Never what this machine knows.**

Every `SourceRow` field that comes from parsing the file: `title`, `url`,
`status`, `content_pulled`, `published_at`, `fetched_at`, `excerpt`, `domains`,
`binary_key`, `binary_bytes`, `binary_optimized`, and `error`.

Two fields are deliberately absent:

- **`domain`** — derivable from the key by `_domain_of`. Storing a derived value
  is how it drifts.
- **`binary_state`** — whether those bytes are on *this* machine. Baking a
  per-machine truth into a shared file is the exact bug `BinStore`'s two-bucket
  test exists to catch. It stays computed per request.

**`error` is in the manifest, and this is load-bearing.** `browse.py`'s module
docstring names the ImmuneCo failure: 13 sources silently absent from a count. An
index that quietly omits what it could not parse reproduces that with a speedup
attached.

**4. The excerpt stored is the excerpt an unindexed listing computes.**

reach-edu's 845 files carry no `excerpt:` field — they predate it — so the
listing falls back to `prose_excerpt(body, 240)`. Search matches that computed
preview. Store `source.excerpt or prose_excerpt(...)`, byte-identical, or the
appearance of an index silently changes what search finds.

**5. Freshness is per-key, and drift repairs itself incrementally.**

The manifest records the key set it was built from. `list_sources` already calls
`store.list(prefix)`; compare the two:

- **Key in the store, not in the manifest** → read that one file. An index five
  captures behind costs five reads, not 845.
- **Key in the manifest, not in the store** → drop it.
- **Key in both** → trust the manifest.

The uncovered case is an **edit in place** — a source retagged by the CLI or by
hand, same key, new `domains:`. That is invisible to a key-set comparison, and
the honest answer is that the response reports `index_stale` and `corpora
reindex` exists. Named here so nobody discovers it from a wrong answer, and
asserted by `INDEX-05`.

**6. The write path keeps it current.**

`add_source` updates the entry for the key it just wrote. `corpora reindex`
(and `POST /api/reindex`, writable-only) rebuilds from scratch.

**7. One row-builder, two callers.**

Extract the `SourceRow(...)` construction out of `list_sources` so the read path
and the manifest path produce rows through the *same* function. Two builders
drift, and the drift shows up as "search finds different things than the page."

### Spec

New: `context-v/specs/Search-Index.md`, IDs `INDEX-01`…`INDEX-10`.

| ID | Given / When / Then |
|---|---|
| `INDEX-01` | Given a corpus with a current manifest, when sources are listed with a search term, then the matching rows are returned and the manifest is the only object read |
| `INDEX-02` | Given a file whose frontmatter is damaged, when the manifest is built and the corpus listed from it, then the file still appears carrying its parse error rather than being omitted |
| `INDEX-03` | Given a writable server and a current manifest, when a source is captured, then the manifest gains exactly that entry and no other file is read |
| `INDEX-04` | Given keys present in the store but absent from the manifest, when sources are listed, then only those keys are read, they appear in the listing, and the response reports the index as stale |
| `INDEX-05` | Given a source edited in place after the manifest was written, when sources are listed, then the manifest's older values are served and the listing reports staleness — the case a key-set comparison cannot see |
| `INDEX-06` | Given one manifest and two machines, when a source with a binary is listed on a machine without those bytes cached, then `binary_state` reads `not_downloaded` regardless of what the manifest holds |
| `INDEX-07` | Given the same corpus listed with and without a manifest, when both listings are compared, then every row is field-identical including the fallback excerpt |
| `INDEX-08` | Given a corpus with no manifest at all, when sources are listed, then the listing works by reading files, exactly as before |
| `INDEX-09` | Given a manifest in the corpus, when sources and the corpus tree are listed, then the manifest appears in neither — it is the app's business, not the operator's |
| `INDEX-10` | Given a corpus, when `reindex` runs twice with nothing changed in between, then it writes byte-identical manifests |

**Amendment required, and it is a Gate 2 item.** `FOCUS-07` currently asserts
that a plain page load misses a cross-tagged source. With a manifest, narrowing
happens on the row rather than the key, so it *finds* it. `Strategy-Focus.md` §4
must be rewritten and `FOCUS-07` inverted. This is amending a spec because
reality changed, not to make existing code pass — but it changes a spec's intent,
so it needs the operator's sign-off before implementation, not after.

### Steps

1. `src/index/manifest.py` — `Entry`, `Manifest`, `build`, `load`, `save`,
   `diff_keys`. Pure functions over an injected store, no HTTP, testable without
   a server, per the `browse.py` precedent.
2. Extract `row_from_source()` in `browse.py`; both paths call it.
3. `list_sources` consults the manifest, reads only uncovered keys, returns
   `index_stale`.
4. `add_source` updates the entry after `store.write`.
5. `corpora reindex` in `src/cli.py`; `POST /api/reindex` gated on `writable`.
6. `build_tree` skips `index/`; `/api/tree`'s total moves accordingly.
7. `/api/sources` surfaces `index_stale`; the app shows a rebuild affordance
   **only** when the server is writable — an affordance that does nothing is
   worse than none.

### Verification

- `bash scripts/check.sh` green; report the mypy count.
- `uv run python scripts/spec_status.py --spec Search-Index --require-green`.
- **Measured against reach-edu, before and after**, in read counts and seconds,
  cold. That number is the changelog.
- A CDP drive: search, clear, search again, capture with the sidecar writable,
  confirm the new source appears without a reindex.

### Exit

If Phase 1 takes search to roughly the 0.48s an unsearched page costs, **the
speed problem is solved and Phase 2 is a quality question, not a performance
one.** Decide there, with the number in hand.

## Phase 2 — Pagefind

### Goal

Ranked, tokenised, faceted search: multi-word queries, morphological variants,
results ordered by relevance rather than by date, and focus chips carrying counts.

### The decision that shapes everything else

**Pagefind does not replace the manifest.** Pagefind has no incremental add — a
new source means rebuilding the whole index. At 832 records that is seconds, but
it means the capture path cannot cheaply keep it fresh, and a search index that
silently lags the corpus is the failure this whole plan exists to prevent.

So the two coexist, with distinct jobs:

| | Manifest | Pagefind |
|---|---|---|
| Freshness | updated on every capture | rebuilt on demand |
| Job | listing, filtering, exactness | ranking, tokenising, facets |
| Cost | one read | a static index, chunk-loaded |
| Fallback | — | falls back to the manifest |

### Decisions

**1. Pagefind indexes the manifest, not the corpus.** One extract, two consumers.
`addCustomRecord` per entry via Pagefind's NodeJS indexing API — no HTML to crawl,
because there is no site here.

**2. Output lands at `index/pagefind/` in the store; the sidecar serves it at
`/pagefind/*`.** Keeps a private R2 bucket private, and works identically for a
`LocalFsStore`. The frontend loads `pagefind.js` from the sidecar origin it
already talks to.

**3. `domains:` become Pagefind *filters*, not indexed text.** This is the
natural fit — Pagefind filters are faceted and return counts, which is exactly the
`"12 in Workforce Development · 832 in the corpus"` shape already hand-built in
`Strategy-Focus.md`. It also protects `FOCUS-01`: the needle `strategy:adult`
survives tokenisation because it resolves through the filter rather than the text
index.

**4. Search returns paths; rows come from the sidecar.** Pagefind ranks and
returns keys, the app asks for those rows, the manifest answers with zero reads.
The alternative — stuffing row JSON into Pagefind `meta` — duplicates row-shaping
into a second place, which decision 7 of Phase 1 exists to prevent.

**5. Node is required, and absent Node degrades rather than fails.** `check.sh`
already runs two blocking Node rungs and already skips them when Node is missing.
Reuse that exactly: `reindex` writes the manifest, skips the Pagefind build, says
so, exits 0.

**6. A Pagefind index older than the manifest is reported and bypassed.** The app
says the ranking is stale and searches the manifest instead. Serving stale
ranking silently is worse than serving unranked results honestly.

### Spec

New: `context-v/specs/Ranked-Search.md`, IDs `SEARCH-01`…`SEARCH-10`. Ownership
is split across both suites; the ledger already merges them.

| ID | Suite | Given / When / Then |
|---|---|---|
| `SEARCH-01` | node | Given a source whose title contains two words separated by others, when both words are searched in either order, then it matches — which substring search cannot do |
| `SEARCH-02` | node | Given a source containing a morphological variant of a query word, when the word is searched, then it matches |
| `SEARCH-03` | node | Given one source matching in its title and another only in its excerpt, when both are searched, then the title match ranks higher |
| `SEARCH-04` | node | Given sources across several focuses, when a query is filtered to one focus, then only that focus's sources return and every focus reports its count for that query |
| `SEARCH-05` | py+node | Given the same query run through Pagefind and through the manifest, when the result sets are compared, then the counts agree |
| `SEARCH-06` | node | Given the exact tag needle `strategy:<slug>`, when it is searched, then the tagged sources resolve through the filter rather than the text index, preserving the `FOCUS-01` promise |
| `SEARCH-07` | node | Given a Pagefind index older than the manifest, when a search runs, then the app reports the ranking as stale and answers from the manifest |
| `SEARCH-08` | node | Given no Pagefind index at all, when a search runs, then it answers from the manifest and the rows are identical to Phase 1's |
| `SEARCH-09` | py | Given a corpus, when the search index is built, then only keys under `index/pagefind/` are written and no source is modified |
| `SEARCH-10` | py | Given a machine with no Node on PATH, when `reindex` runs, then the manifest is written, the Pagefind build is skipped with a message, and the exit status is success |

### Steps

1. `app/scripts/build-search-index.mjs` — read the manifest, `createIndex`,
   `addCustomRecord` per entry with `filters: { focus: [...] }`, `writeFiles`.
2. `reindex` shells out to it after writing the manifest; skips on no Node.
3. Sidecar mounts `/pagefind/*` from the store with correct content types (the
   WASM binary included).
4. `app/src/lib/search.ts` — a thin wrapper: lazy `import(/* @vite-ignore */ …)`,
   `search()`, `filters()`, staleness check, manifest fallback. Pure enough to
   test under `node --test`, following `domains.ts` and `latest.ts`.
5. Wire the focus chips to Pagefind filter counts.

### Risks, named before they cost a day

- **The `pagefind` npm package downloads a platform binary on install.** Check
  what that means for an offline build and for the Tauri bundle *before*
  committing to it. If it is hostile, the fallback is the `pagefind_extended`
  CLI invoked directly.
- **Tauri CSP is currently `null`**, so the dynamic module import and WASM load
  work today. Hardening it later must allowlist `wasm-unsafe-eval` and the
  sidecar origin, or search breaks in the packaged app and nowhere else.
- **Vite will try to bundle `pagefind.js`.** `/* @vite-ignore */` on the dynamic
  import is the known fix; without it the build fails confusingly.
- **Index size in a client's bucket.** ~832 records should be a few hundred KB
  chunked. Measure it. If it is meaningfully worse, move the Pagefind output
  machine-local — the manifest stays in the corpus either way.

## Open questions

1. **`list_stat()` on the storage seam.** S3's `ListObjectsV2` already returns
   ETag and size in the same response `list()` throws away. A seam method
   returning `(key, size, etag)` would close the edit-in-place gap in `INDEX-05`
   for **zero extra requests**. It changes `CorpusStore`, which everything sits
   on, so it is out of scope here — but it is the cheapest available upgrade and
   worth its own decision doc.
2. **Should `reindex` run on sidecar start when stale?** Convenient, and it makes
   a read-only server behave differently from a writable one in a way that is
   easy to misread. Default: no. Surface staleness, let the operator act.
3. **Multiple simultaneous focuses.** Pagefind filters support it natively, which
   is the first time the "eventual shape" in `Strategy-Focus.md` §6 becomes cheap
   rather than invented. Still gated on there being multi-valued data.

## Gates

| Gate | Where |
|---|---|
| 2 | Sign-off on `Search-Index.md` **and** on the `FOCUS-07` inversion in `Strategy-Focus.md` before any Phase 1 code |
| 4 | Operator walk-through after Phase 1, with the measured before/after in hand — this is also the decision point on whether Phase 2 runs at all |
| 2 | Sign-off on `Ranked-Search.md` before any Phase 2 code |
| 4 | Operator walk-through after Phase 2 |

## Related

- [[../specs/Strategy-Focus]] — names this index in §4 and stakes `FOCUS-07` on it
- [[../specs/Browse-Corpus]] — `BROWSE-15` (page loads read only their page) and
  `BROWSE-17` (the stale-response guard this makes almost unnecessary)
- [[../specs/Corpus-Tree]] — the keys-not-bodies discipline this extends to bodies
- [[../loops/Spec-to-Shipped-With-TDD]] — the loop both phases run through
- [[../../../context-v/blueprints/Show-The-Filesystem-Of-A-Workspace]] — the
  read-count-not-wall-clock rule

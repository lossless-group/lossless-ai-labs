---
title: "Search Index — the manifest that stops search reading the corpus"
lede: "A search opens every file: 845 reads, up to 5.8 seconds. A manifest in the corpus makes it one, and closes the gap FOCUS-07 named."
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
site_uuid: 5240e8b1-5e20-4145-9368-e4ee425e9c9a
hex_code: 5ofskf
tags:
  - Spec
  - Corpora-Builder
  - Retrieval
  - Search
from: "corpora-builder"
from_path: "context-v/specs/Search-Index.md"
---
# Search Index

## Why Care?

`list_sources` opens **every file in the corpus** when a search term is present.
Against reach-edu that is 845 round-trips and 1.2–5.8 seconds, versus 0.48s for
an unsearched page. That gap produced `BROWSE-17`: the operator reported "search
filters once, then stops," which was a fast request landing before a slow one
still in flight. The guard fixed the symptom.

Everything a search needs is a small fixed set of fields per source. Writing them
down once turns 845 reads into one.

`Strategy-Focus.md` §4 named this and declined to build it, staking `FOCUS-07` on
the day it arrived. It has arrived, and that test inverts.

## Scope

**In:** a manifest of per-source fields at `index/sources.jsonl`; incremental
maintenance on capture; explicit rebuild; and the listing path that consults it.

**Out:** ranked or tokenised search (see [[Ranked-Search]]); semantic search
(Chroma, elsewhere in this tree); extending `CorpusStore` with a stat-bearing
`list()` — see *Open questions*.

## Behaviour

### 1. It lives in the corpus, at `index/sources.jsonl`

A machine-local cache was the alternative. Rejected: the manifest is derived from
the corpus and identical for everyone holding it, so a per-machine copy spends
845 reads per clone to avoid one small object. In the corpus it travels with the
bytes, and the git-backed change feed gets a readable diff of what a capture did.

JSONL, one entry per line, **sorted by key**. Sorted so a diff shows what changed
rather than a reshuffle — the same reasoning as `FIELD_ORDER` in the frontmatter
model. One line per entry so a damaged manifest costs one source, not the file.

**No timestamp is stored.** Freshness is decided per-key (Behaviour 5), not by a
clock, and a `built_at` would make two rebuilds of an unchanged corpus differ.
Where a fingerprint is needed it is the sha256 of the manifest's own bytes.

### 2. It stores what the file says, never what this machine knows

Every field of a listing row that comes from parsing the file: `title`, `url`,
`normalized_url`, `status`, `content_pulled`, `published_at`, `fetched_at`,
`excerpt`, `domains`, `binary_key`, `binary_bytes`, `binary_optimized`, `error`.

Two fields are deliberately absent:

- **`domain`** — derivable from the key by `_domain_of`. A stored derived value
  is a value that drifts.
- **`binary_state`** — whether those bytes are on *this* machine. Baking a
  per-machine truth into a shared file is exactly the bug `BinStore`'s
  two-bucket test exists to catch. It stays computed per request.

### 3. A file that will not parse is in the manifest, carrying its error

`browse.py` opens by naming the ImmuneCo failure: 13 sources silently absent from
a count. An index that quietly omits what it could not parse reproduces that with
a speedup attached. The entry records the error and the listing renders it, the
same as an unindexed listing does.

### 4. The stored excerpt is the excerpt an unindexed listing computes

reach-edu's 845 files carry no `excerpt:` — they predate the field — so the
listing falls back to the first real prose in the body, and search matches *that*.
The manifest stores the same computed string, so the arrival of an index does not
silently change what search finds.

### 5. Freshness is per-key, and drift repairs itself incrementally

The manifest is compared against the keys the store actually reports:

| | |
|---|---|
| in the store, not in the manifest | read that one file; the listing reports itself stale |
| in the manifest, not in the store | dropped |
| in both | the manifest answers |

An index five captures behind therefore costs five reads, not 845.

**The uncovered case is an edit in place** — same key, changed content, from the
CLI or by hand. A key-set comparison cannot see it. The honest answer is that the
listing reports `index_stale` when it knows, `reindex` exists, and this paragraph
means nobody discovers the limit from a wrong answer.

### 6. Capture keeps it current, and never creates it

`add_source` updates the entry for the key it just wrote — **only if a manifest
already exists.** Whether a corpus is indexed stays an explicit operator
decision, made by running `reindex`; a corpus that has never been indexed behaves
exactly as it did before this spec.

Capture's duplicate check reads through the same seam: covered keys are answered
from the manifest, uncovered keys are read. Before this it opened every file
under the prefix on every capture.

### 7. Narrowing by focus consults the row, not the key

With a manifest, a plain page load can see a source's `domains:` without reading
it — so a source tagged into a focus whose folder it does not live under is
found. **This inverts `FOCUS-07`**, which asserted the miss and said in its own
row that the day it changed, a test would say so.

### 8. The manifest is the app's business

It appears in neither the source listing nor the corpus tree. The test from
[[../../../context-v/blueprints/Show-The-Filesystem-Of-A-Workspace]] is not "is
this internal?" but "does this level tell the reader anything?" A derived cache
does not.

### 9. Rebuilding is deterministic

`reindex` on an unchanged corpus writes byte-identical bytes. That is what makes
the fingerprint in [[Ranked-Search]] meaningful, and it is why Behaviour 1
forbids a timestamp.

## Tests

| ID | Given / When / Then |
|---|---|
| `INDEX-01` | Given a corpus with a current manifest, when sources are listed with a search term, then the matching rows are returned and the manifest is the only object read |
| `INDEX-02` | Given a file whose frontmatter is damaged, when the manifest is built and the corpus is listed from it, then the file still appears carrying its parse error rather than being omitted |
| `INDEX-03` | Given a current manifest, when a source is captured, then the manifest gains exactly that entry and no source file is read |
| `INDEX-04` | Given keys present in the store but absent from the manifest, when sources are listed, then only those keys are read, they appear in the listing, and the listing reports itself stale |
| `INDEX-05` | Given a source edited in place after the manifest was written, when sources are listed, then the manifest's older values are served — the case a key-set comparison cannot see, and the reason `reindex` exists |
| `INDEX-06` | Given one manifest and two machines, when a source carrying a binary is listed on a machine without those bytes cached, then `binary_state` reads `not_downloaded` regardless of what the manifest holds |
| `INDEX-07` | Given the same corpus listed with and without a manifest, when the two listings are compared, then every row is field-identical, including the fallback excerpt |
| `INDEX-08` | Given a corpus with no manifest at all, when sources are listed, then the listing works by reading files exactly as it did before |
| `INDEX-09` | Given a manifest in the corpus, when sources and the corpus tree are listed, then it appears in neither |
| `INDEX-10` | Given a corpus, when the manifest is rebuilt twice with nothing changed in between, then both rebuilds produce byte-identical bytes |

## Open questions

1. **`list_stat()` on the storage seam.** S3's `ListObjectsV2` returns ETag and
   size in the same response `list()` discards. A seam method returning
   `(key, size, etag)` would close the edit-in-place gap in Behaviour 5 for zero
   extra requests. It changes `CorpusStore`, which everything sits on, so it is
   out of scope here and worth its own decision.
2. **Should the sidecar reindex on start when stale?** Convenient, and it makes a
   read-only server behave differently from a writable one in a way that is easy
   to misread. Default: no.

## Acceptance

`uv run python scripts/spec_status.py --spec Search-Index --require-green` exits
0, and the operator has walked the surface (Gate 4).

## Related

- [[Strategy-Focus]] — names this index in §4 and stakes `FOCUS-07` on it
- [[Browse-Corpus]] — `BROWSE-15` (a page reads only its page) and `BROWSE-17`
  (the stale-response guard this makes nearly unnecessary)
- [[Ranked-Search]] — what sits on top of this manifest
- [[../plans/Search-Index-Then-Pagefind]] — the two-phase plan

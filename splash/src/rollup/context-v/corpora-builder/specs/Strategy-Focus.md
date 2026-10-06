---
title: "Strategy Focus"
lede: "A strategy chip narrows the list and compounds with search. The corpus count rides alongside, so a subset always says what it is a subset of."
publish: true
date_created: 2026-08-22
date_modified: 2026-08-23
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.4.0
status: Draft
site_uuid: 2e7b4c96-8a01-4d3f-b25e-6c9f0a17d834
hex_code: t8pv2c
tags:
  - Spec
  - Corpora-Builder
  - Navigation
  - Retrieval
  - Frontend
from: "corpora-builder"
from_path: "context-v/specs/Strategy-Focus.md"
---
# Strategy Focus

## Why

Every source in reach-edu belongs to the client. When someone sits down to draft
a strategy document or a presentation, they want **all** of it available — and a
pointer that says *mainly look here*.

That is what the `domains:` frontmatter field is:

```yaml
domains:
  - "strategy:adult-literacy-numeracy"
```

Measured across all 845 sources on 2026-08-22:

| | |
|---|---|
| carry a `domains:` list | 241 |
| carry none | 604 |
| multi-valued | **0** |
| disagreeing with their own folder | **0** |
| prefixes in use | `strategy` (223), `topic` (18) |

**Read that table as a pointer, not as a half-finished taxonomy.** A source with
no `domains:` is not unclassified; it is simply not the first place to look for
any particular strategy. Backfilling the 604 would destroy the signal by making
everything equally emphasised — which is why this spec does not.

### The zero was read wrong (corrected 2026-08-23)

`multi-valued: 0` was taken to mean *multi-domain sources do not exist here*, and
two decisions were built on that reading. **It means the opposite of what it was
read to mean.**

Multi-domain membership in this corpus is expressed as **one pointer file per
folder**, not as a longer list in one file. Measured the same day:

| | |
|---|---|
| distinct `source_uuid`s | 194 |
| filed in exactly one folder | 115 |
| filed in **two or more** | **79** (126 extra pointers) |
| deepest fan-out | one source in **six** folders |
| multi-valued `domains:` | still **0** |

Each pointer is ~1.1KB: the canonical `source_uuid`, `status: metadata-only`,
the lede, and its own empty `# Extracts` skeleton — carrying exactly the one
`domains:` value that names the folder it sits in. The body is not there. The
canonical content lives in SurrealDB per
[[../../../augment-it/context-v/specs/Source-Content-Storage-SurrealDB-Primary-Local-As-Toggle]],
which makes `corpus_path` optional and puts Extracts per *usage* — and a filing
into a second strategy is a second usage.

**That is the design, not drift.** A corpus that will get very large has to hand
an agent a *scoped* set of sources when it drafts, because accuracy and
attribution are the whole product; a source that genuinely bears on two
strategies belongs in both scopes, with its own extracts in each. The pointer is
what makes that cheap.

So `domains:` is single-valued **by construction**. The number to reason from is
79, not 0.

## The one rule everything follows from

**Focus narrows, and compounds with search.**

`apprenticeship` → 56. `apprenticeship` + *Workforce Development* → 12.
`apprenticeship` + *Rural Income Boosts* → 4.

**This is the second version of this rule.** The first read "mainly look here" as
*emphasis*: focus returned everything, ordered, with the tagged sources first.
That is a defensible reading of the words and it was wrong in practice. Driven in
a real browser it was indistinguishable from nothing happening — 200 rows on
screen, 82 matches, so only the top of the list moved and rows 83–200 were
unrelated. The operator's report was *"I searched a strategy, a tag cloud came
up, I clicked a tag, I didn't see it further filter."*

What preserves access to the rest of the corpus is not that the list stays whole.
It is that **the toggle is a toggle** — one click back — and that `corpus_total`
rides alongside `total`, so a narrowed list always says what it is a subset of:
**"12 in Workforce Development · 832 in the corpus"**. A single number is what
makes a filter look like the whole world.

## Behaviours

### 1. The tag is searchable text

Typing `literacy` reaches a source carrying `strategy:adult-literacy-numeracy`
even when neither its title nor its excerpt contains the word. The tag is part of
what a source *says about itself*, so search treats it that way.

### 2. Focus narrows, and reports both numbers

`focus=strategy:workforce-development` returns only that strategy's sources, with
`corpus_total` beside `total`.

### 3. The type vocabulary is read from the corpus, never assumed

**This is the load-bearing decision.** The types are open: reach-edu declares
`strategy` and `topic`; another client uses `thesis`. There is no rule that maps
a tag to a folder across that. `strategy`/`strategies` tempts a `+s` —
**`thesis`/`theses` breaks it on the first try**, and whatever replaces the rule
breaks on the client after that.

Each domain already states the answer, in the `index.md` sitting in its folder:

```yaml
type: "strategy"
slug: "adult-literacy-numeracy"
title: "Adult Literacy & Numeracy"
```

So the join is read: nine reads in reach-edu, one per declaration, not one per
source. That also supplies the human label for the toggle — *Adult Literacy &
Numeracy*, not `adult-literacy-numeracy` — and makes **nesting free**, because
the folder is wherever the `index.md` is, at any depth.

A folder with no `index.md` is not a focus. Nothing is invented for it.

### 4. Narrowing happens on the row, once a manifest exists

**Revised 2026-08-23.** This section used to describe a gap and name its fix. The
fix shipped: [[Search-Index]].

A plain page load used to narrow on the *key*, because reading 845 files to check
a tag was the only alternative. That left exactly one case wrong — a source
tagged into a focus whose folder it does not live under was found by a search and
missed by a page load. `FOCUS-07` asserted both halves precisely so that the day
it changed, a test would say so.

With a manifest, every source's `domains:` is legible for the cost of one object.
**Narrowing now consults the row on every path**, the gap is closed, and
`FOCUS-07` is inverted rather than deleted — the ID stays, the promise moves.

A corpus with no manifest still narrows on the key for a page load and on the row
under search. That is the older behaviour, kept because a corpus that has never
been indexed has to keep working.

### 5. Chips are grouped by their declared type

A row of unlabelled chips is legible only to someone who already knows the
corpus — the operator's own reaction was *"oh, the tags are strategies."* Each
group carries its declared type as a heading (`STRATEGY`, `TOPIC`, and whatever
a client's corpus declares), read from the data like everything else here.

### 6. Multiple focuses are the eventual shape, one is the current one

One focus at a time is what ships, and the API takes a single `focus`.

**The reason given here was wrong** — "zero multi-valued data" — and is corrected
above: 79 sources are filed across two or more folders. The honest reason is
narrower. A focus selects a *folder*, and a source in six folders is reached by
any of the six; what a second simultaneous focus would mean — union or
intersection — has never been asked for by anyone drafting against this corpus.
That is a question to put to an operator, not one to answer by guessing.

### 7. A domain reference is not a tag

**This spec called them tags until 2026-08-23, and they are not.** A source
carries both fields and they answer different questions:

| | `domains:` | `tags:` |
|---|---|---|
| example | `strategy:workforce-development` | `Workforce-Development` |
| shape | `kind:slug`, colon-separated, lowercase | **Train-Case**, minor words lowercase (`AI-at-Work`) |
| vocabulary | declared by an `index.md` in the corpus | free |
| structure | **cascades** — Behaviour 8 | flat |
| what it is | a **scope**: which corpus this belongs to | a **label**: what it is about |

Measured across reach-edu, 2026-08-23:

| | |
|---|---|
| carry `domains:` | 241 · 8 distinct values · **every one exactly two segments** |
| carry `tags:` | 191 · 88 distinct values · **100% Train-Case**, zero exceptions |
| overlap in shape | **none** — no domain value is Train-Case, no tag contains a colon |

`Workforce-Development` exists as a tag *and* `strategy:workforce-development` as
a domain reference. Same idea, two fields — and only one of them is a scope an
agent can be pointed at. Calling a domain reference a tag is how a scope quietly
becomes a keyword.

### 8. A domain reference cascades; a tag does not

Per [[../../../context-v/specs/Flexible-Entity-Relationships-to-Mirror-Messy-IRL-Collaboration]]
— *the cascade is invoked, not stored*. A reference names a chain, and naming a
**shorter** chain reaches everything beneath it:

```
focus                              matches
strategy                        →  strategy:workforce-development
domain:strategy                 →  domain:strategy:workforce-development
strategy:workforce-development  →  itself only
```

The path already behaves this way — `_in_domain` is
`d == domain or d.startswith(domain + "/")`, which is why `funders/` is a legal
filter and the combobox's Backspace walks up it. This gives the reference the
same cascade the path has.

**Segment-aware, or it is wrong.** `strategy` must not match
`strategy-two:something`. The test is on the separator, not the string — exactly
the trap `_in_domain` already avoids with `/`.

A `tags:` value never cascades. It has no separator to cascade on, and it is a
label rather than a scope.

### 9. A declaration is not a source

`index.md`, `AGENTS.md` and `README.md` describe the corpus rather than being
captured material, and are excluded from the listing. Thirteen such files in
reach-edu were being rendered with no URL and `status: candidate` —
indistinguishable from a source we found and never fetched — and inflating the
count. `845 sources` was 832 sources plus 13 documents *about* them.

This stopped being cosmetic the moment `index.md` became the file that supplies
the type vocabulary. The document that names a domain cannot also be listed as
one of its unprocessed leftovers.

## Tests

| ID | Given / When / Then |
|---|---|
| `FOCUS-01` | Given a source whose `domains:` names a strategy, when a word from that tag is searched, then the source matches even though its title and excerpt do not contain it |
| `FOCUS-02` | Given a corpus with sources inside and outside a strategy, when that strategy is focused, then only that strategy's sources are returned, newest first |
| `FOCUS-03` | Given a focus, when the listing is returned, then `total` counts the matches and `corpus_total` still counts the whole corpus |
| `FOCUS-04` | Given a corpus declaring an unfamiliar type (`thesis`, whose plural no rule would guess) and a nested one, when the focuses are derived, then both resolve from their own `index.md` and a folder without one is not offered |
| `FOCUS-05` | Given a focus, when a page is requested, then it holds only that focus's sources, newest first, and reports both counts |
| `FOCUS-06` | Given no focus, when the listing is returned, then order is unchanged and `total` equals `corpus_total` |
| `FOCUS-07` | Given a source tagged into a strategy whose folder it does not live in, when that strategy is focused, then a manifest-backed page load finds it and an unindexed page load does not — and neither admits untagged matches |
| `FOCUS-08` | Given a nested, unfamiliar type, when it is focused, then it narrows exactly like a familiar one, with no code that knows its name |
| `FOCUS-09` | Given a source whose `domains:` reference is a longer chain than the focus, when that shorter chain is focused, then the source is included — and focusing the full chain still matches only itself |
| `FOCUS-10` | Given two references sharing a leading string but not a leading segment, when the shorter is focused, then the sibling is excluded — the match is on the separator, never on the string |
| `FOCUS-11` | Given a source carrying both a Train-Case `tags:` value and a `domains:` reference, when a focus is applied, then only the reference decides, and no tag is ever treated as a scope |

## Related

- `context-v/specs/Browse-Corpus.md` — the listing this extends, and `BROWSE-17`, the stale-response guard search needed once a search cost 5.8s
- `context-v/specs/Domain-Navigation.md` — the *exclusive* verb, deliberately kept separate
- `context-v/specs/Corpus-Tree.md` — the same keys-not-bodies discipline
- [[Search-Index]] — the manifest that closed the gap §4 used to name

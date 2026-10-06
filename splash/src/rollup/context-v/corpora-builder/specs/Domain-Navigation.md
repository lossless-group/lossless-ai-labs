---
title: "Domain Navigation"
lede: "112 folders in a dropdown is a list you scroll, not a list you use. Type any near-match; backspace walks back a segment at a time."
publish: true
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: Draft
site_uuid: 8c4d17b2-6e0a-4f39-9d51-2b7ea6c30f48
hex_code: k4wq8n
tags:
  - Spec
  - Corpora-Builder
  - Navigation
  - Frontend
from: "corpora-builder"
from_path: "context-v/specs/Domain-Navigation.md"
---
# Domain Navigation

## Why

reach-edu carries **112 domains across 845 sources**, and 66 of them live under
one parent:

```
funders/            66      strategies/       8      topics/     2
gov-entities/       14      think-tanks/      7      inbox/      3
associations-networks/ 8    (+ 4 singletons)
```

A `<select>` with 112 options is a control you scroll rather than one you use,
and the operator's report is exactly that — *"with so many dirs it makes it quite
unnavigable."*

Two things are wrong and they are separate problems:

1. **Finding one.** You know it is Ascendium; you should not have to know it is
   spelled `funders/ascendium-education` and sorted between `funders/annie-e-casey`
   and `funders/ballmer-group`.
2. **Getting back out.** Once the filter reads `funders/ascendium-education`,
   widening to *all funders* means editing a string by character. It should be
   one keystroke.

## What a domain is

A path, one or two segments, derived from the key by `_domain_of` in
`src/server/browse.py`. Two layouts are in the wild — `live/<type>/<slug>/sources/`
from this tool, and `<type>/<slug>/` from reach-edu's pre-existing corpus — and
both collapse to `<type>/<slug>`. Measured across reach-edu: **no domain is
deeper than two segments**, and every one is lowercase-and-dashed.

That last fact is a property of *today's data*, not a guarantee. Matching must
not depend on it.

## Behaviours

### 1. A near match finds it

Typing matches **case-insensitively and separator-insensitively**. `Ascendium
Education`, `ascendium-education`, `ASCENDIUM_EDUCATION` and `ascendium
education` all normalise to the same thing and all find
`funders/ascendium-education`.

This is the operator's example verbatim, and it matters because the strings that
arrive from the world — a funder's own name on their own website — are
Title Case With Spaces, while the folder is not.

### 2. Ranked, not merely filtered

A filter that returns 40 rows in alphabetical order has not helped. Matches rank:

| Rank | Kind | `gates` finds |
|---|---|---|
| 1 | exact | — |
| 2 | the whole path starts with the query | — |
| 3 | the **last segment** starts with it | — |
| 4 | every query word appears somewhere | `funders/the-gates-foundation` |
| 5 | the query is a subsequence | `funders/bill-and-melinda-gates` (were it present) |

Ties break by **depth**, then alphabetically. Broad before narrow is the order
you want when you are unsure, so `strategies` precedes
`strategies/workforce-development`.

**Depth, not string length.** The first draft of this spec said "shorter path
first," which is true across depths and meaningless within one. Rendered, it put
`funders/`'s sixty-six children in the order *ecmc, blackrock, bridgespan,
judy-dimon, todd-fisher* — sorted by how long their names happen to be, which is
indistinguishable from random and is the exact complaint this component exists to
answer. Within a depth the order is strictly alphabetical.

Subsequence is the "near match for anything" rung: it survives dropped letters,
which is what a typo usually is.

### 3. Backspace walks the path, not the characters

When the value **names a real domain or a real prefix**, and the caret is at the
end, Backspace deletes a whole segment:

```
funders/ascendium-education   →   funders/   →   (empty)
```

Two presses, as the operator described. When the value is *not* a real domain or
prefix — mid-typing, a typo, something new — Backspace is an ordinary Backspace.

**No hidden mode flag.** The rule is a function of the text and the corpus, which
means it is explainable in one sentence and cannot desynchronise from what the
operator sees. A `justSelected` boolean would have been easier to write and
impossible to reason about three keystrokes later.

### 4. The prefix is semi-separate

At `funders/` the list shows only that parent's children, and shows each one with
the shared prefix **dimmed** so the eye reads the part that differs. The prefix
is not a separate control — you can still type through it, past it, or delete
into it — but it stops being visual noise repeated 66 times.

### 5. Filtering and filing are the same control

The header's filter and the capture form's destination use one component. The
difference is one flag: the filter accepts only domains that exist; capture
accepts a new one, because filing a source somewhere new is how a domain gets
created.

### 6. Reachable without a mouse

`↓`/`↑` move, `Enter` commits, `Escape` closes then clears, `Tab` completes to the
highlighted row. The listbox carries `role`/`aria-activedescendant` so the active
row is announced rather than merely highlighted.

## Explicitly not in this spec

**Aliases.** `Ascendium Education` matching `ascendium-education` is *string
normalisation*, and it is all this spec buys. It does not help with
`Bill & Melinda Gates Foundation` → `the-gates-foundation`, or an organisation
that renamed. Real aliases need somewhere to live in the corpus — a manifest per
domain, or an `also_known_as` list — which is a **corpus format change** and a
separate piece of work. Normalisation is not a down payment on it; it is a
different mechanism that happens to cover the easy half.

**Casing at the directory level.** Directories stay lowercase-dashed. Nothing
here changes what is written to disk.

## Tests

| ID | Given / When / Then |
|---|---|
| `DOMAIN-01` | Given a domain spelled lowercase-and-dashed, when it is queried as `Ascendium Education`, `ASCENDIUM_EDUCATION` or `ascendium  --  education`, then every spelling ranks it first |
| `DOMAIN-02` | Given queries that match in different ways, when scored, then exact beats whole-path prefix beats word-anywhere |
| `DOMAIN-03` | Given `funders/ascendium-education`, when the query is just `ascendium`, then it matches on the last segment without the parent being typed |
| `DOMAIN-04` | Given a multi-word query, when only some words appear in a domain, then it does not match; when all appear in any order, it does |
| `DOMAIN-05` | Given a query with a letter dropped, when ranked, then the intended domain is still found by subsequence |
| `DOMAIN-06` | Given a query matching nothing, when ranked, then the result is empty rather than the full list |
| `DOMAIN-07` | Given several domains scoring equally, when ranked, then shallower paths sort first and same-depth siblings sort alphabetically — never by name length |
| `DOMAIN-08` | Given an empty or whitespace-only query, when ranked, then every domain is returned |
| `DOMAIN-09` | Given `funders/ascendium-education`, when a segment is chopped twice, then the value passes through `funders/` and ends empty |
| `DOMAIN-10` | Given a single-segment value, when a segment is chopped, then it goes straight to empty |
| `DOMAIN-11` | Given the corpus's domain list, when a real domain or a real prefix is tested, then it is navigable; when a partial word or typo is tested, then it is not |
| `DOMAIN-12` | Given a prefix no domain starts with, when tested, then it is not navigable |
| `DOMAIN-13` | Given a domain with and without a parent, when split for display, then the prefix and remainder are returned separately |
| `DOMAIN-14` | Given a string with runs of separators, when normalised into words, then the runs collapse and no empty word is emitted |

## Related

- `context-v/specs/Browse-Corpus.md` — where `domains` reaches the client
- `app/DESIGN.md` — the control primitive this component must inherit
- `src/server/browse.py` — `_domain_of`, the definition being navigated

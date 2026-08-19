---
title: "<Spec Name> — <what it delivers, in a phrase>"
lede: "<One to three sentences. A subtitle, not an abstract — if it wants to grow, start a `## Why Care?` section instead.>"
date_created: YYYY-MM-DD
date_modified: YYYY-MM-DD
authors:
  - Michael Staton
augmented_with:
  - Claude Code on <model>
semantic_version: 0.0.0.1
status: Draft
tags:
  - Spec
  - Corpora-Builder
site_uuid: 73151013-2337-4989-916e-8e83121d58ef
hex_code: kc5ay6
publish: false
from: "corpora-builder"
from_path: "context-v/specs/_TEMPLATE-Spec-With-Tests.md"
---
<!--
  TEMPLATE — copy, don't edit in place. The leading underscore keeps this file
  out of the ledger's glob, so its example IDs are never counted as promises.

  The one thing that makes a spec runnable-against is the `## Tests` table.
  Everything else here is the usual context-vigilance shape.
-->

# <Spec Name>

## Why Care?

<The problem this solves and what breaks without it. Concrete over abstract —
name the failure that motivated the spec, ideally one that actually happened.>

## Scope

**In:** <what this spec covers>

**Out:** <what it deliberately does not, and where that lives instead>

## Behaviour

<Numbered prose describing what the system does. Observable outcomes, not
implementation. This is what the test table below is derived from — if a
behaviour here has no test, either it isn't really promised or the table is
incomplete.>

## Tests

<!--
  RULES — these are enforced by scripts/spec_status.py, not by good intentions.

  · IDs are `<STEM>-<NN>`, uppercase stem, two-digit-or-more tail.
  · IDs are STABLE FOREVER. Never renumber — renumbering silently orphans every
    @pytest.mark.spec marker pointing at the old name.
  · Retire an ID by striking it (`~~STEM-04~~`) and saying why in the row.
    Never reuse a retired ID.
  · Write OBSERVABLE BEHAVIOUR. "then a file exists at <path> with <field>"
    survives a rewrite; "then it calls normalize_url()" does not.
  · NO Status column. Status is derived by running the ledger. A hand-written
    status is a lie waiting to happen.
  · An ID here with no @pytest.mark.spec("<ID>") test is MISSING and fails the
    build. That is deliberate: a promise with no test is the one failure mode
    that looks like success.
-->

| ID | Given / When / Then |
|---|---|
| `STEM-01` | Given <precondition>, when <action>, then <observable outcome> |
| `STEM-02` | Given <precondition>, when <action>, then <observable outcome> |
| `~~STEM-03~~` | Retired YYYY-MM-DD — <why; where the behaviour went instead> |

## Acceptance

`uv run python ../scripts/spec_status.py --spec <This-Spec-Stem> --require-green`
exits 0, and the operator has walked the surface (Gate 4).

## Related

- [[../loops/Spec-to-Shipped-With-TDD]] — the loop this spec is run through
- [[../contracts/Autonomy-Gates]] — where an agent stops
- <the exploration or decision this spec descends from>

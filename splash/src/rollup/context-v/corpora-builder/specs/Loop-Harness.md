---
title: "Loop Harness — the ledger that lets an agent run unattended"
lede: "The smallest possible spec, written first so the harness proves itself: spec test IDs bind to test functions, status is derived by running the suite, and a promise with no test is a build failure. If this spec is green, the loop's bookkeeping can be trusted; everything else is built on top of it."
date_created: 2026-08-08
date_modified: 2026-08-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Signed-Off
tags:
  - Spec
  - Corpora-Builder
  - Loop
  - TDD
  - Autonomy
from: "corpora-builder"
from_path: "context-v/specs/Loop-Harness.md"
---
# Loop Harness

## Why Care?

[[../loops/Spec-to-Shipped-With-TDD]] asks an agent to run unattended and report
honestly on where it got to. That is only safe if "where it got to" is
**derived** rather than asserted — the failure that
[[Design-Front-Loading-and-the-Fable-Build-Loop]] named exactly:

> *"context-v has no machine-checkable task state — 'which tasks remain' lives
> in prose, and prose is what today's loops silently lose track of."*

This spec is the fix, and it is deliberately the first one: it makes the
bookkeeping itself testable. It is also the worked example every later spec
copies — the shape of the test table below is the contract, not just this file's
contents.

## Scope

**In:** the `spec` pytest marker; the results file written on every run; the
`spec_status.py` join; the three exit conditions (missing, require-green,
tdd-floor); ID parsing including retirement.

**Out:** anything about corpora. This spec is about the harness only.

## Behaviour

1. A test function binds to one or more spec IDs via `@pytest.mark.spec("<ID>")`.
2. Every pytest run writes `core/.spec-results.json` mapping each spec ID to a
   worst-wins outcome across its claiming tests.
3. `scripts/spec_status.py` parses each spec's `## Tests` table, joins to the
   results, and prints GREEN / RED / MISSING / RETIRED per ID.
4. A spec ID with no implementing test is **MISSING** and always exits non-zero.
5. `--require-green` exits non-zero if anything is RED. `--tdd-floor` exits
   non-zero if anything is already GREEN.
6. An ID struck through in the table (`~~ID~~`) is RETIRED and excluded from
   totals — IDs are never renumbered or reused.

## Tests

| ID | Given / When / Then |
|---|---|
| `HARNESS-01` | Given a test marked `@pytest.mark.spec("HARNESS-01")`, when the suite runs, then `core/.spec-results.json` contains that ID with outcome `passed` |
| `HARNESS-02` | Given a spec whose `## Tests` table lists an ID, when that ID is parsed, then it appears in the active set with its stem and numeric tail intact |
| `HARNESS-03` | Given a spec table row whose ID is struck through (`~~ID~~`), when that spec is parsed, then the ID lands in the retired set and not the active set |
| `HARNESS-04` | Given a spec ID that no test function claims, when status is classified, then it is reported MISSING |
| `HARNESS-05` | Given one spec ID claimed by two tests where one fails, when outcomes are joined, then the ID resolves RED — worst-wins, never best-wins |
| `HARNESS-06` | Given a `## Tests` section followed by another `##` heading, when the spec is parsed, then IDs appearing after that heading are not collected |

## Acceptance

`uv run python ../scripts/spec_status.py --spec Loop-Harness --require-green`
exits 0.

## Related

- [[../loops/Spec-to-Shipped-With-TDD]] — the loop this harness serves
- [[../contracts/Autonomy-Gates]] — Gate 3, which this makes enforceable
- [[Design-Front-Loading-and-the-Fable-Build-Loop]] — the exploration that named the gap

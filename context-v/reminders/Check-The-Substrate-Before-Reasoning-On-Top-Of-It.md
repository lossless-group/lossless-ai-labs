---
title: "Check the Substrate Before Reasoning On Top Of It"
lede: "A decision recorded in a plan is not a fact about the system. List the store before designing anything that writes to it."
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.0.1
status: Active
site_uuid: c14cf4be-0ca3-407c-8c8c-2c1cfc562ff8
hex_code: x3ej0s
summary: >-
  Guardrail born from a 2026-08-22 session in which several turns of design
  reasoning about which version-control engine to adopt were rendered moot by a
  single read-only bucket listing. Plans record intent; they do not report state.
  Before designing over any store, list it. Includes the second half of the same
  lesson: when a decision has produced no artifacts, that is evidence about the
  decision, not about execution speed.
tags:
  - Reminder
  - Storage-Substrate
  - Verification
  - Planning
publish: true
---

# Check the Substrate Before Reasoning On Top Of It

**Rule.** Before designing, recommending, or building anything that reads from or
writes to a store — a bucket, a database, a volume, a queue — **look inside it
first**. A read-only `list` is cheap, takes seconds, and is the difference
between advice and speculation.

## Why

On 2026-08-22 an agent read `corpora-builder`'s MVP plan, saw
**`SUBSTRATE: R2-native — decided`**, and spent several turns reasoning carefully
about which version-control engine should sit on top of that bucket — pinning six
upstream references, writing profiles, and producing a recommendation to adopt
one over hand-building another.

The operator then said: *"I don't think it's syncing with the bucket."*

One read-only listing:

```
bucket='reach-edu'  prefix='corpora/'
TOTAL under prefix: 0 objects, 0.0 MB
```

**Zero.** Fourteen days after the decision, nothing had ever been written. The
whole adopt-versus-build question was moot, because there was nothing to version.
The real gap was a rung earlier and much more boring — the phases built a
forward-only capture path and nobody ever scoped a migration for the 892 files
that already existed.

None of the reasoning was wrong. All of it was premature, and the check that
would have caught it took under a minute.

## The general failure

**A plan records intent. It does not report state.** `status: Decided`,
`RESOLVED`, and `Done when:` are all statements about what someone meant to do.
Treating them as observations about a running system is the mistake, and it is an
easy one because well-written plans in this tree read like descriptions of
reality — that is what makes them good documents and what makes them dangerous to
read passively.

## How to apply

- **Before designing over a store, list the store.** `list_objects_v2` with the
  configured prefix, `SELECT count(*)`, `ls` the volume. Report the number.
- **Check the whole container too, not just the configured prefix.** In the case
  above, the prefix held 0 objects but the bucket held 9 under an unrelated
  `backups/` — which is how you learn the credentials are fine and the wiring is
  fine and nothing has used it.
- **Confirm the tool is the one doing the work.** The corpus was growing, just
  through git, by a different path, while the program specced to own it had never
  touched it. "Is anything happening?" and "is this thing making it happen?" are
  different questions.
- **Prefer the read-only probe over the inference.** Credentials that authenticate
  and a `list` that returns are proof; a passing test suite against `moto` or a
  local fixture is not.
- **Say the number out loud.** "0 objects" ends a debate that adjectives cannot.

## The second half: absence is evidence

When a recorded decision has produced **no artifacts over a meaningful stretch**,
that is data about the decision, not about how busy everyone has been.

The honest response is the one the same plan already modelled for its parked
BTRFS/ZFS option — *"the trigger that brings it back … has still not fired"* —
applied evenly. If a decision's own justification named triggers and none of them
fired, and the work has visibly routed around it, **downgrade it to
`Deferred` with the trigger written down.** That is not abandoning it; it is
declining to let it block everything else while it waits.

Worked example: `../plans/Prove-The-Substrate-Before-Building-History.md`.

## Related

- `../plans/Prove-The-Substrate-Before-Building-History.md` — the plan this reminder came out of
- `../explorations/A-Syncbox-For-Client-Document-Folders.md` — the reasoning the empty bucket reordered
- `../../corpora-builder/context-v/specs/Storage-Seam.md` — already models the right instinct: its conformance suite is gated behind a deliberate run against a **real** bucket, because *"moto proving an S3 client correct is not the same as R2 accepting it"*

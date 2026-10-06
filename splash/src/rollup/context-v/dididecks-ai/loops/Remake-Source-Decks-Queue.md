---
title: "Loop: Remake every source deck in a queue"
lede: "Runs the Remake-Source-Deck-into-Design-Variants plan once per queued source deck, one deck per iteration, until the queue is empty or a deck is blocked on a human."
publish: false
date_created: 2026-10-02
date_modified: 2026-10-02
date_authored_initial_draft: 2026-10-02
date_authored_current_draft: 2026-10-02
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Draft
experimental_folder: true
tags:
  - Loop
  - Subagent-Orchestration
  - Deck-Iteration-Workflow
calls: "[[Remake-Source-Deck-into-Design-Variants]]"
from: "dididecks-ai"
from_path: "context-v/loops/Remake-Source-Decks-Queue.md"
---
# Loop: Remake source decks from a queue

> `context-v/loops/` is an experimental folder (see `context-vigilance`).
> This doc is the durable definition; Claude Code's `/loop` is one way to run it.

## Scope

Every deck listed in the queue file. Each entry is one full run of
[[Remake-Source-Deck-into-Design-Variants]].

## The queue

`context-v/loops/queues/remake-queue.md` (create it if missing). One deck
per line, using the plan's variables:

```text
- [ ] COMPANY=Acme   CLIENT_SITE=client-sites/acme-decks   SOURCE_DECK=client-sites/acme-decks/inputs/acme-seed.pdf
- [ ] COMPANY=Globex CLIENT_SITE=client-sites/globex-decks SOURCE_DECK=client-sites/globex-decks/inputs/deck.pptx N_VARIANTS=4
- [x] COMPANY=EventCut ... (done 2026-10-03: 3 variants, all PASS)
- [!] COMPANY=Initech ... (blocked: extraction audit failed twice; renders unreadable)
```

`[ ]` is pending, `[x]` is done, and `[!]` is blocked on a human.

## Each iteration

1. Take the first `[ ]` line. If there isn't one, exit.
2. Run the plan with that line's variables. The plan is the orchestrator; this loop doesn't add any steps.
3. Mark the line `[x]` with the one-line result, or `[!]` with the reason it stopped.
4. Commit the queue file update.

**One deck per iteration, run in sequence, not in parallel.** Each plan
already fans out N designers. Running several decks at once multiplies the
subagent count, lets dev servers collide, and makes failures hard to
attribute.

## Exit conditions

- No `[ ]` lines remain → report the summary of every line and stop.
- Three `[!]` lines in a row → stop. Something systemic is wrong (the toolchain, the shell, or the prompts), and grinding on won't fix it.

## How to run it

```text
Run context-v/loops/Remake-Source-Decks-Queue.md
```

Or self-paced, under Claude Code's `/loop`:

```text
/loop Run context-v/loops/Remake-Source-Decks-Queue.md, one deck per iteration
```

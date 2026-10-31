---
type: Decisions
title: "Three Kinds of Error, and Optional Steps Never Block"
lede: "A blocked memo is the worst outcome. Every error says whether MemoPop is down, the request is wrong, or the step can be skipped."
publish: true
date_created: 2026-10-10
date_modified: 2026-10-10
date_authored_initial_draft: 2026-10-10
date_authored_current_draft: 2026-10-10
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5 (1M context)
at_semantic_version: 0.0.0.1
status: Decided
tags:
  - Decision
  - MemoPop
  - Error-Handling
  - API-Design
site_uuid: 3aef82fc-4a30-4a61-934f-88b21bf9186c
hex_code: e2dgeg
from: "memopop-ai"
from_path: "context-v/decisions/Three-Kinds-of-Error-and-Optional-Steps-Never-Block.md"
---
# Three Kinds of Error, and Optional Steps Never Block

## The decision

**Every error belongs to one of three kinds**, and each kind tells Claude
exactly what to do:

| Kind | Means | Claude should |
|---|---|---|
| **Down** | MemoPop is unreachable, timed out, or failed on our side. Nothing was saved | Tell the partner MemoPop is unavailable and try again later. Never retry in a tight loop |
| **Invalid** | The request is wrong: bad input, unknown deal, wrong firm, a step submitted out of order | Fix the request using the message, or ask the partner for what's missing. Never resend it unchanged |
| **Skipped** | One step's agent is out of service, but the memo can go on without it | Tell the partner in one line and call `next_step`. The run continues |

**Optional steps skip; they never block.** Every enhancement (citations,
tables, diagrams, the one-pager, scoring) is optional. The server records
each skip on the deal: `list_deals` shows it, the compiled memo's run report
lists it, and the step can be re-run once its agent is back.

**Only required steps may block**, and the list stays short: creating the
deal, submitting a section's research, submitting a section's draft, and
compiling. Even then, a "down" error costs nothing, because nothing was saved
and the partner picks up where they left off.

**Tests cover each kind.** CI checks that every failure returns the right
kind, and that switching off any optional agent produces a skip rather than a
block.

Decided 2026-10-10 by Michael Staton.

## Why

A partner mid-memo, with Claude stopped and nothing useful to say, is the
worst experience the product can give. Most failures don't need to stop the
memo; they only need to be recorded so the step can be run again later.

## Still open

Whether a section's research may also be skipped, with Claude drafting from
the partner's materials alone.

## Related

- [[MemoPop-as-a-Claude-Connector]] — the exploration this came from
- [[No-Tool-Ships-Without-Its-Docs-and-Tests]] — the error format every tool
  uses
- [[The-Server-Hands-Claude-the-Method-One-Step-at-a-Time]] — the steps that
  can skip or block

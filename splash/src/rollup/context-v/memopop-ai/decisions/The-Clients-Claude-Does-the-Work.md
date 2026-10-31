---
type: Decisions
title: "The Client's Claude Does the Work"
lede: "In v1 we pay for almost no model calls. The partner's own Claude writes the memo; MemoPop supplies the method and keeps the work."
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
  - Claude-Connector
  - Pricing-And-Cost
site_uuid: babcfeab-7366-491f-a88b-19695dee0200
hex_code: qi5q6j
from: "memopop-ai"
from_path: "context-v/decisions/The-Clients-Claude-Does-the-Work.md"
---
# The Client's Claude Does the Work

## The decision

**In v1, the client's own Claude (Desktop, web, or mobile) does all the
reading, research, and writing.** MemoPop's server supplies the method, holds
the deal's materials and artifacts, versions them, backs them up, and compiles
the finished memo.

**v2** adds the server-side pipeline: our own model calls, paid through
provisioned tokens or the client's own keys, and our research APIs
(Perplexity, Tavily, and the rest).

Decided 2026-10-10 by Michael Staton.

## Why

- **The value is the method, not the model calls.** Months of iteration
  produced a staged method that writes better memos than any the operator has
  seen, and better than anyone they've sent them to has seen. Packaging that
  method is the product; v1 is *a staged instruction set for better output*.
- **Clients already pay for Claude.** Running on their subscription means we
  meter almost nothing, so billing can wait.
- **Partners are already in Claude all day.** No new app to install or learn.

## What this rules out for v1

- A "generate the whole memo" job on our server.
- Research APIs on our keys. In v1, research is Claude's own web search plus
  what the partner adds.
- Payments and token provisioning, which stay with the later didi.sh billing
  work.

## Related

- [[MemoPop-as-a-Claude-Connector]] — the exploration this came from
- [[The-Server-Hands-Claude-the-Method-One-Step-at-a-Time]] — how the method
  reaches Claude

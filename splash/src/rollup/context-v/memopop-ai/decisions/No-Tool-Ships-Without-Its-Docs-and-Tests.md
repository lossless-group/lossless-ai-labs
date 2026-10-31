---
type: Decisions
title: "No Tool Ships Without Its Docs and Tests"
lede: "MemoPop's connector is our first API, so it sets the habit: every tool has docs written for agents, CI tests, and a live health check."
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
  - API-Docs-For-Agents
  - Testing
  - Monitoring
site_uuid: 629349e9-0e52-4fd0-b510-716f410259f7
hex_code: sgem23
from: "memopop-ai"
from_path: "context-v/decisions/No-Tool-Ships-Without-Its-Docs-and-Tests.md"
---
# No Tool Ships Without Its Docs and Tests

## The decision

**A tool is done only when all three exist:**

1. **Docs written for agents.** For every tool: when to call it and when not
   to; each input, with an example; what it returns; what it changes on the
   server; how long it takes; every error it can return and what to do about
   each; and what to call next. One source feeds the MCP tool description, the
   OpenAPI spec, `memopop.didi.sh/llms.txt`, and a readable page at
   `memopop.didi.sh/docs`.
2. **Contract tests in CI.** Each tool is called against a test firm and a
   test deal: the normal case, bad input, a missing deal, and a request from
   the wrong firm (which must fail). The build also fails if any tool's docs
   entry is incomplete.
3. **A health check on the live server.** A scheduled run takes a test deal
   through create, add a small deck, one research step, one draft, and compile
   on `memopop.didi.sh`, and alerts when a step fails or slows down.

**And five conventions, set before the first tool:**

- **One error format:** a code, a plain-language message, and what to do next,
  always one of the three error kinds.
- **Repeat-safe creates:** `create_new_deal` twice for the same company returns
  the existing deal.
- **Paging** on anything that lists, starting with `list_deals`.
- **A version from day one,** so a change can't break a client's Claude in the
  middle of a memo.
- **A test firm** in production that holds no client data, for the health check
  to sign in as.

Decided 2026-10-10 by Michael Staton.

## Why

- **This is our first API,** and every later one will copy its habits.
- **For Claude, the docs are the interface.** A tool description is what
  Claude reads when deciding what to call, so a vague description is a broken
  feature.
- **Clients will find failures before we do** unless something is checking the
  live server.

## Related

- [[MemoPop-as-a-Claude-Connector]] — the exploration this came from
- [[Three-Kinds-of-Error-and-Optional-Steps-Never-Block]] — the error kinds
- [[Phase-1-One-Operation-Set-Four-Callers]] — flave's version of declaring each
  operation once

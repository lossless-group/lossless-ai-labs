---
type: Decisions
title: "The Server Hands Claude the Method One Step at a Time"
lede: "Claude never holds the whole pipeline. It asks for the next step, does it, hands back the artifact, and asks again."
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
  - Model-Context-Protocol
  - Agent-Workflow
site_uuid: f7c6e118-a28b-4841-8feb-18519a0b465d
hex_code: hdivtr
from: "memopop-ai"
from_path: "context-v/decisions/The-Server-Hands-Claude-the-Method-One-Step-at-a-Time.md"
---
# The Server Hands Claude the Method One Step at a Time

## The decision

**The method lives on the server as a sequence of steps.** The plugin's skill
stays thin: it tells Claude this is a multi-step pipeline with an artifact and
audit trail, and to ask the server for each step. Claude calls `next_step`,
gets that step's instruction and only the artifacts it needs, does the work,
and calls `submit_artifact`. The server saves and checks the artifact, logs
it, and advances.

**Every agent becomes a step.** Today's agent prompts and the LangGraph
workflow's nodes become the step definitions: each step declares its
instruction, the artifacts it reads, and what a finished artifact must look
like.

Decided 2026-10-10 by Michael Staton.

## The flow

0. **Start the deal and bring the materials.** Create the deal if it has no
   record; add the deck, dataroom, financials, notes, and links. Materials can
   keep arriving at any point.
1. **Research, one section at a time.** Claude builds each section's research
   file and shows it to the partner, who comments and adds their own research
   before the next section.
2. **Drafting, one section at a time.** Claude receives only that section's
   approved research and the drafting and formatting instructions, and submits
   the finished section.
3. **Enhancements, one at a time.** Citations, tables, diagrams, the one-pager,
   scoring.
4. **Compile.** Claude asks for the HTML and PDF; the server assembles them.

One conversation per memo by default. If it fills up, a new chat that says
*continue the Acme memo* picks up from the server's state.

## The tools

`list_deals`, `create_new_deal`, `add_materials`, `next_step`,
`submit_artifact`, `get_artifact`, `save_snapshot`, `compile`.

## Why

- **The method improves without anyone reinstalling.** Change a step on the
  server and every client's next memo uses it.
- **Order and gates are enforced, not requested.** Claude can't draft a section
  before its research is approved, because the server won't hand out that step.
- **Small context per step.** Claude carries one instruction and one artifact,
  never the whole memo, which keeps each step sharp and the conversation long.
- **The method stays ours.** It isn't shipped as a skill file a client can copy.

## Related

- [[MemoPop-as-a-Claude-Connector]] — the exploration this came from
- [[Grill-Me-Per-Section-User-Input-Moment]] — the per-section human moment in
  step 1
- [[Three-Kinds-of-Error-and-Optional-Steps-Never-Block]] — what happens when a
  step fails

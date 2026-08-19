---
site_uuid: a8f6bec3-49a5-440e-93ad-3de403cb531a
hex_code: qhmnt6
title: "Generate DD Questions & Checklist"
lede: >-
  Some users don't want the memo — they want the gaps phrased as questions to carry into founder meetings. Same pipeline, different artifact.
summary: "Plan for a third memo mode that emits a due-diligence question checklist instead of a finished memo. Records the user demand that motivated it, identifies `memo_mode` as the existing extension point (currently a two-value Literal in workflow.py, main.py and outline_loader.py), and lists what has to be decided before building. Seeded 2026-08-17 during the context-v frontmatter sweep from a stub that read only 'Generate evaluation files.' Sibling of the outline-editing spec — both are requests to change the product's output shape rather than its research."
status: Draft
publish: false
date_created: 2026-05-03
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
tags:
  - Plan
  - MemoPop
  - Due-Diligence
  - Memo-Mode
  - Seed
from: "memopop-ai"
from_path: "context-v/plans/Generate-DD-Questions-&-Checklist.md"
---
# Generate DD Questions & Checklist

> **Status: seed.** Captures a real user request and the concrete extension point
> it maps onto. Not yet a buildable plan — see *Open questions*.

## The demand

Prospective users have said they want to run the market research, but **the
output they want is not a finished memo.** They want a draft of suggested
due-diligence questions, shaped as a checklist they can mark complete as they
work through it — including questions to put to founders in later meetings.

The distinction is sharper than it first sounds. A memo is an argument: it
asserts a view and marshals evidence for it. A DD checklist is the inverse
artifact — it enumerates **what is not yet known**, and its value is measured by
how well it covers the gaps rather than how convincing it reads.

The research phase is the same. Only the terminal artifact differs.

## Why this is cheap — `memo_mode` already exists

MemoPop already branches on mode. Today it takes exactly two values:

```python
# src/workflow.py:577
memo_mode: LiteralType["consider", "justify"] = "consider"
```

- `consider` — prospective analysis
- `justify` — retrospective justification

Both are threaded through `src/main.py` (as CLI `choices`), `src/outline_loader.py`,
and the outlines themselves, where each section carries `ModeSpecificGuidance`
with fields including `emphasis`, `tone`, `required_elements`, and — directly
relevant here — **`guiding_questions_add`**.

Every outline declares `compatible_modes: ["consider", "justify"]`.

So the shape of the change is legible: **a third mode**, with per-section
guidance that redirects each section's output from assertion to open question.
The outlines already carry guiding questions per section; a DD mode is closer to
*surfacing what the guiding questions failed to resolve* than to inventing a new
analysis.

## What makes it non-trivial

1. **A checklist is stateful; a memo is not.** "Mark complete after performing
   the DD" means the artifact is written to after generation. Nothing in the
   current output path does that — memos land as static markdown under
   `io/<client>/deals/<Company>/outputs/`. This needs a persistence story, and it
   is the same unanswered question as in [[Reorder-and-Edit-Direct-Outline]]:
   where does user-mutable state live?
2. **Question quality is the whole product here.** A memo can carry a weak
   paragraph. A checklist of thirty generic questions ("what is the TAM?") is
   worthless — the user could write those themselves. The questions have to be
   *specific to what the research actually failed to establish*, which means the
   mode depends on the pipeline knowing what it could not confirm.
3. **This overlaps existing validation work.** `Post-Generation-Quality-Agents`,
   `Anti-Hallucination-Source-Validation-and-Removal`, and
   `Faked-Sources-from-Perplexity` all concern knowing when a claim is unsupported.
   **An unsupported claim and an open DD question are close to the same object
   viewed from two directions.** Whatever tracks source confidence is plausibly
   the same machinery that should generate this checklist. Check before building
   anything parallel.
4. **Founder-meeting questions are a different register** from desk-research gaps.
   The request explicitly includes them. Those are questions no amount of public
   research answers, and identifying them is a judgment about what is *knowable
   externally* — not just what was *found*.

## Open questions

- Third `memo_mode` value, or a separate output renderer over an existing mode's
  run? A mode change touches every outline's `compatible_modes`.
- Does every existing outline get the new mode, or only some? Firm-customized
  outlines (`io/<client>/templates/outlines/`) would each need per-section
  guidance written.
- Where does completion state persist, and is a partially-ticked checklist
  re-generatable without losing the ticks?
- Is the checklist derived from a full memo run (generate, then invert), or does
  the pipeline short-circuit before synthesis? The former is cheaper to build and
  wastes generation; the latter is the thing users actually asked for.
- Output format — markdown checkboxes are portable and Obsidian-native; a real UI
  in `memopop-native` is more useful and much more work.

## Prior art to read first

- `src/workflow.py` — where `memo_mode` branches
- `src/schemas/outline_schema.py` — `ModeSpecificGuidance`, especially
  `guiding_questions_add`
- `apps/memopop-orchestrator/context-v/specs/Post-Generation-Quality-Agents.md`
- `apps/memopop-orchestrator/context-v/blueprints/Anti-Hallucination-Source-Validation-and-Removal.md`
- `apps/memopop-orchestrator/context-v/issue-resolution/Faked-Sources-from-Perplexity.md`

## Related

- [[Reorder-and-Edit-Direct-Outline]] — the sibling request; both are users asking
  to change the product's output shape rather than its research
- [[Multi-Agent-Orchestration-for-Investment-Memo-Generation]]

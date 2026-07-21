---
from: "dididecks-ai"
from_path: "context-v/agent-skills/context-vigilance/references/doc-type-guide.md"
---

# Which `context-v/` Folder? — Decision Guide

Use this when the right folder isn't obvious. Six folders, three modes.

## Quick decision tree

```
Do you know what you're trying to build?
├── No → research / weigh tradeoffs?         → explorations/
└── Yes
    ├── Defining what & why & scope          → specs/
    ├── Step-by-step plan referencing a spec → prompts/
    ├── Codifying a pattern / architecture   → blueprints/
    ├── Short correction AI keeps needing    → reminders/
    └── Documenting a debugging journey      → issues/
```

## Folder-by-folder

### `specs/` — Living specifications

**Yes, this is a spec if:**
- It defines what something is, why it exists, what it does
- It will be referenced by prompts
- It is intended to be kept current as the system evolves
- Multiple people / sessions will read it as the source of truth

**No, this is not a spec if:**
- It's a one-time implementation plan (→ prompts/)
- It's a pattern observation rather than a thing being built (→ blueprints/)
- It's still being figured out (→ explorations/)

### `prompts/` — Step-by-step implementation docs

**Yes, this is a prompt if:**
- It's a structured plan to implement something defined in a spec
- It's broken into discrete, verifiable steps
- An AI assistant could follow it from top to bottom

**No, this is not a prompt if:**
- It's a single chat message you copy-paste (those are ephemeral, don't commit them)
- It defines what to build rather than how (→ specs/)
- It's a research scratchpad (→ explorations/)

### `blueprints/` — Codified patterns

**Yes, this is a blueprint if:**
- It explains how a part of the system works (architecture, data flow, naming)
- It is meant to be followed by future contributions
- It captures proprietary thinking — the "why we do it this way"

**No, this is not a blueprint if:**
- It's a project being built (→ specs/)
- It's a one-line correction (→ reminders/)

### `reminders/` — Battle scars turned into guardrails

**Yes, this is a reminder if:**
- It's short (often one paragraph)
- It exists because an AI made the same mistake repeatedly
- It is loaded into context when AI starts drifting

**No, this is not a reminder if:**
- It's longer than ~10 lines and has structure (→ blueprint)
- It explains a system rather than correcting behavior (→ blueprint)

### `explorations/` — Journey docs without a known destination

**Yes, this is an exploration if:**
- The question's answer isn't known when you start
- You're surveying options, weighing tradeoffs, or thinking out loud
- It might end with "we don't need this" — and that's a valid outcome

**No, this is not an exploration if:**
- You already know the answer and are documenting it (→ spec or blueprint)
- It's a debugging session (→ issues/)

### `issues/` — Issue resolution journeys

**Yes, this is an issue doc if:**
- It captures the path through a painful, non-obvious bug
- The point is that nobody should retrace this trail
- It includes red herrings, dead ends, and the eventual root cause

**No, this is not an issue doc if:**
- The bug was obvious and the fix was a one-liner (just commit and move on)
- It's a pattern observation about how to avoid bugs in general (→ blueprint)

## Common confusions

| Confusion | Resolution |
|---|---|
| Spec vs. blueprint | Specs describe **what is being built**. Blueprints describe **how the existing system works**. |
| Prompt vs. exploration | Prompt = "execute this plan." Exploration = "figure out what the plan should be." |
| Reminder vs. blueprint | Reminder is a sharp correction. Blueprint is the underlying explanation. A reminder often *links to* a blueprint. |
| Issue vs. exploration | Issues have a defined goal (fix the thing). Explorations have an open question. |

## When two folders both fit

Pick the one that the document's *primary* reader needs. If the primary reader is "future me trying to implement something" → prep mode. If it's "future me trying to understand the system" → reflective mode. If it's "future me trying not to retrace my steps" → journey mode.

When still tied, ask the user.

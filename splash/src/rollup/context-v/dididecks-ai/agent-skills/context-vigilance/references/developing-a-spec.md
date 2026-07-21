---
from: "dididecks-ai"
from_path: "context-v/agent-skills/context-vigilance/references/developing-a-spec.md"
---

# Developing a Spec

How to actually *develop* a spec with the user, as a rhythm — not as a single write-once act. This is the most discussion-heavy doc-type in `context-v/`, and the one most likely to go off the rails into "spend 90 minutes editing a doc instead of building." This file encodes the rhythm we've found that avoids that.

Scoped specifically to **specs**. Other doc-types (blueprints, prompts, etc.) have their own rhythms; if those formalize, they'll get their own reference files.

## When to follow this

- The user wants to build something non-trivial and there isn't yet a spec
- The user says "let's spec this", "draft a spec", "before we build", or similar
- You're about to start implementation work that lacks a documented "what & why"
- A new project, site, package, or major feature is being initiated

## The rhythm (numbered, but not rigid)

### 1. Locate the right `context-v/`

Walk up from cwd. If you're inside a child of a [pseudomonorepo](../pseudomonorepos/SKILL.md), the spec **may belong in the parent's `context-v/specs/`** rather than the child's — especially if it spans multiple children or is initiating a new child. Ask the user if it's not obvious. Load the `pseudomonorepos` skill if you haven't already.

### 2. Drop a stub, then return focus to discussion

The pattern that saves time: **create the file early with frontmatter only**, then *stop editing it* and resume talking with the user.

```yaml
---
title: "Working title (will be revised)"
lede: "One-sentence hook — newsroom-style, written to make a reader want to keep reading. Revisable; aim for a placeholder that's already trying to do its job."
date_created: YYYY-MM-DD
date_modified: YYYY-MM-DD
authors:
  - User Name
augmented_with:
  - Pi on Claude Sonnet 4.5
semantic_version: 0.0.0.1
tags:
  - Spec
status: Draft
---

# Working title

<!-- developing -->
```

That's it. One H1, one HTML comment as a placeholder. Filename in Train-Case (see `doc-type-guide.md`).

**About the `lede`:** specs often get published — they're not just internal artifacts. Many will be rendered on a Lossless Astro Knots site (in a list view, preview card, or OpenGraph snippet) where the lede is the only line a reader sees before deciding to click through. Write it as a *hook*, not a *description*. `description` is also accepted as the field name (some prior art uses it), but `lede` is preferred — the word itself signals the job. See the `changelog-conventions` skill for the deeper newsroom rationale.

**Why stub-first:** the file existing means it's findable by other agents and by future-you. The empty body means you haven't prematurely committed to a structure. Discussion shapes the structure.

### 3. Receive prior art generously

The user will share `context-v/` files, code, or links as "prior art" or "reference." **Do not fret about the quality of prior art.** It may be:

- Outdated (no longer represents current thinking)
- Incomplete (stub-shaped or partially written)
- Inconsistent with current naming conventions
- Overlapping with several other docs

This is normal. The Lossless tree drifts faster than it converges. Read prior art for **signal, not gospel**. Ask the user when something is ambiguous; don't reverse-engineer intent in silence.

### 4. Discuss → write → discuss

The dialog drives the spec, not the other way around. As the discussion produces clarity, **append to the spec** without trying to make it narratively clean:

- Add sections (`## Goals`, `## Non-goals`, `## Constraints`, `## Phases`) as topics arise
- Add bullet points as decisions get made
- Leave `// TBD` markers where consensus hasn't formed
- Don't reorder, don't rewrite for flow, don't worry about prose

Bias toward **show the user what just got captured** in chat (a one-line summary) rather than re-pasting the whole evolving doc. They can open the file if they want to see it whole.

### 5. Handle stale prior art (the "intern" pattern)

If during the discussion you notice that a prior-art `context-v/` file is **incomplete or outdated** — meaning it no longer reflects what the user is now saying — surface it:

> "The blueprint at `[[Some-Blueprint]]` says X, but you just described Y. Want to update that file too?"

If the user says yes, **the ideal behavior is to delegate that update to a background agent** — an "intern" that listens to the ongoing discussion and revises the stale doc as relevant content surfaces, returning to the user only for stage-gate decisions. That keeps the primary dialog focused on the new spec instead of spending 30 minutes off-task editing old files.

**Reality check (2026):** most current agent harnesses (pi included) don't have first-class background subagents that can passively monitor a conversation. Approximate the behavior with whichever degrades best in the current tool:

- **If a parallel agent session is feasible:** open one (separate pi session, Claude Code subagent, separate terminal) and hand it the stale file plus a brief on what's changing. Resume primary dialog. Surface its outputs at natural pauses.
- **If not:** keep a running list inside the spec (`## Stale prior art to update later`) noting which files need revision and what direction. Batch the updates at the end, or after sign-off, as a separate task.

Either way: **don't let stale-doc cleanup hijack the primary spec dialog.** Note it, decide who/when, move on.

### 6. The sign-off gate

Before any implementation begins, the user explicitly signs off on the spec.

This is a hard gate: **do not start writing implementation prompts or code until the user says some version of "spec is good, let's build."** Common phrasings: "approved," "ship it," "go," "let's go," "looks good, proceed."

When the user signs off:

1. Update frontmatter: `status: Signed-Off`
2. Update `date_modified` and bump `semantic_version` (typically `0.0.1.0` or `0.1.0.0` — see `versioning.md`)
3. **Now** do the narrative pass: re-read the whole doc and revise for clarity, flow, and audience (User + Agent + Reader, per the SKILL). Reorder sections. Tighten prose. Resolve `// TBD` markers or move them to `## Open questions`. This is the only point where prose-polish is worth doing — before sign-off it's wasted effort against a moving target.
4. Confirm the cleaned-up version with the user.

### 7. Pair the spec with prompts (what comes after sign-off)

A **spec** describes *what & why*. A **prompt** describes *how*, step by step, for one chunk of execution.

If the spec contains Phases, Steps, Approaches, Milestones, or any other natural chunking, **pre-load matching prompts in `context-v/prompts/`** before starting implementation. One prompt per chunk. Each prompt:

- Has a `## Spec reference` linking back to the spec (`[[../specs/My-Spec]]`)
- Names the chunk it implements (Phase 1, Step 3, etc.)
- Lists the verifiable success criteria for that chunk
- Is invokable by the user pasting it (or telling an agent "load this prompt") instead of re-typing stream-of-consciousness

Prompts are how a multi-task workflow gets chunked from a multi-phase spec. **Pre-loaded prompts save a stream-of-consciousness re-explanation** every time a chunk starts — that's the point.

If chunking isn't obvious yet at sign-off, that's fine — write the first prompt for the first chunk, ship it, then write the next prompt when you reach the next chunk.

## Status values for specs (Train-Case)

Status is a **rendering string, not a machine enum.** Train-Case signals "this is for humans / display" — automated pipelines should not switch on these values, because spelling and casing will drift across files. (See `frontmatter-spec.md` for the broader convention.)

Conventional progression for specs:

| Value | Meaning |
|---|---|
| `Draft` | Stub exists, frontmatter only or minimal body. Default for new specs. |
| `In-Discussion` | Actively being shaped through dialog. Body is appending faster than it's polishing. |
| `Signed-Off` | User has explicitly approved. Narrative pass done. Ready to pair with prompts. |
| `Implementing` | One or more prompts in `context-v/prompts/` are actively executing this spec. |
| `Shipped` | Implementation complete. Spec is now historical / reference. |
| `Stale` | No longer represents current thinking. Either supersede with a new spec (use `superseded_by:`) or revise. |
| `Superseded` | Replaced by another spec. Pair with `superseded_by: [[New-Spec]]`. |

These are conventions, not enforced. If a user file uses different values, respect them; if they use these, follow the progression.

## Anti-patterns

- ❌ **Editing the spec for narrative clarity while still discussing.** You're polishing a moving target. Wait for sign-off.
- ❌ **Letting stale prior-art cleanup take over the primary dialog.** Note it, defer it, or delegate it.
- ❌ **Starting implementation before sign-off.** Even small implementation choices encode spec assumptions. Get the gate first.
- ❌ **Writing one giant prompt for a multi-phase spec.** Chunk it.
- ❌ **Pasting the whole evolving spec back to the user every turn.** They can open the file. Summarize what changed in one line.
- ❌ **Reverse-engineering user intent from prior art when the user is right there.** Ask.

## Cross-references

- [[SKILL]] — the broader `context-vigilance` skill
- [[frontmatter-spec]] — full frontmatter rules including the status field and Train-Case rationale
- [[doc-type-guide]] — how to choose between specs, prompts, blueprints, etc.
- [[versioning]] — when to bump `semantic_version`
- [[philosophy]] — why we externalize memory and treat docs as code
- `pseudomonorepos` skill — when the spec belongs in a parent repo's `context-v/`
- `astro-knots` skill — Astro-Knots-specific concerns to surface during a new-project spec

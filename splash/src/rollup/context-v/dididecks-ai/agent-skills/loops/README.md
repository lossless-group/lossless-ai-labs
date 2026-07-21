---
title: "Loops — recurring maintenance disciplines that keep the repo legible over time"
lede: "A new context-v category for skills that aren't one-shot specs or plans but **recurring rhythms** — the small, regular maintenance moves that keep a fast-moving repo readable to humans + agents who weren't there when the work happened. Each loop lives as its own subdirectory with a SKILL.md, optional scripts/, and templates/. Companion concept (TBD): `context-v/pairing/` for human-agent collaboration disciplines."
date_authored_initial_draft: 2026-06-07
date_last_updated: 2026-06-07
at_semantic_version: 0.0.1.0
status: Initial-Draft
category: Loops-Index
authors:
  - Michael Staton
from: "dididecks-ai"
from_path: "context-v/agent-skills/loops/README.md"
---
# Loops · Recurring Maintenance Disciplines

## What this directory is

The other `context-v/` subdirectories hold **artifacts** — a spec is a thing; a plan is a thing; a model is a thing. This subdirectory holds **disciplines** — patterns the team runs repeatedly to keep the artifacts current.

A `loop` answers:

- **When does this fire?** (the trigger — pre-commit hook, weekly cadence, before a release, after a particular kind of change)
- **What does it do?** (the recipe — a script, a checklist, a sequence of commands)
- **What does it produce?** (the artifact — a regenerated file, a commit, an opened PR, a flagged drift report)
- **What's the failure mode if skipped?** (drift in human comprehension, broken links, stale counts, surprises for joiners)

The pattern matters because **fast-moving repos accumulate drift the moment maintenance is left to "whenever I remember."** A loop turns "should remember" into "the tool reminds." For dididecks-ai specifically: directory shape changes, new submodules land, slot counts shift, brand assets churn. None of these need a spec change; all of them benefit from a small repeated update applied automatically or on a regular cadence.

## What's in here

| Loop | When it fires | What it produces |
|---|---|---|
| [`maintain-filemap/`](./maintain-filemap/SKILL.md) | Before commits that touch directory shape; on a weekly cadence; before releases | Updated `FILEMAP.md` at each repo root showing the tree to depth 3 with curator annotations |

## What's NOT a loop (and goes elsewhere)

| Looks similar, lives elsewhere | Where it actually lives |
|---|---|
| A one-time migration ("lift these 5 components into the shell") | `context-v/plans/` |
| A spec for a new feature ("how the audit registry works") | `context-v/specs/` or `context-v/models/` |
| A general agent skill consumed across repos ("how to write a changelog entry") | `context-v/agent-skills/` |
| A standing reminder ("don't push to main without explicit ask") | `context-v/reminders/` |
| A rendered map of what currently exists | `context-v/sitemap/` |

The line: if the thing **runs on a schedule or trigger and updates an artifact**, it's a loop. If it's a one-shot or read-only reference, it's something else.

## Authoring a new loop

Same SKILL.md frontmatter shape as the skills under `context-v/agent-skills/`:

```yaml
---
name: <loop-name-in-kebab>
description: >
  A description that's *triggering* — names the verbs, contexts, and
  conditions an agent should react to. Example: "Use whenever the
  directory shape changes (new top-level dir, new submodule, rename),
  or before a release, to regenerate FILEMAP.md so collaborators can
  see the repo's current layout without cloning."
---
```

Plus a body that documents:

1. **When to fire** — explicit triggers (commit kinds, time-based, manual)
2. **The recipe** — exact commands or a `scripts/` invocation
3. **The artifact** — what file(s) get touched
4. **Detection** — how to tell the loop is overdue (drift between committed and regenerated)
5. **Composition** — which other loops or skills it interlocks with (e.g., this fires the `changelog-conventions` skill if the change warrants an entry)

## Pairing — a sibling concept (TBD)

`context-v/pairing/` is reserved for a sibling discipline category: **human-agent and agent-agent collaboration patterns**. Not yet authored. Candidate first-pairing-patterns:

- "Reviewer hands the agent a screenshot; agent grounds proposed fix in the source code; pair iterates"
- "Two agents in parallel — one researches, one drafts; main loop synthesizes"
- "Spec drafted by agent; human shapes the lede; agent fills the body from the lede + tags"
- "Long-running ingest with human-checkpoint gates between checkpoints"

When that subdirectory gets stood up, its first inhabitants would be patterns we've already used repeatedly in dididecks-ai work but haven't formalized.

## See also

- `context-v/agent-skills/` — the upstream skills snapshotted into this repo; loops can reference them
- `context-v/plans/` — one-shot implementation plans; loops can be authored ALONGSIDE a plan that needs ongoing maintenance after it ships
- `context-v/sitemap/` — the static map of current artifacts; loops can update sitemap entries as a side-effect of their main work

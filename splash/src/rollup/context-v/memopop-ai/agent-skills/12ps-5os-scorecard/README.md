---
from: "memopop-ai"
from_path: "context-v/agent-skills/12ps-5os-scorecard/README.md"
---

# 12Ps within 5Os — Early-Stage Scorecard (Claude Skill)

A guided venture-investment scorecard that captures each IC member's evaluative judgment —
and how it changes as they learn — so that belief-revision itself becomes retraceable data.
Built on the "12Ps within 5Os" framework. The skill produces a scorecard artifact only; it
never issues an invest/pass verdict, and it hands CRM writes to a separate CRM skill.

## What's in this folder

```
12ps-5os-scorecard/
├── SKILL.md                       # the skill: workflow the agent follows
├── README.md                      # this file
└── references/
    ├── 12ps-5os-rubric.yaml       # the framework — source of truth (definitions, 1–5 rubrics)
    ├── 12ps-5os-rubric.md         # human-readable rubric + worksheet
    ├── firm-metadata.md           # EDIT THIS: firm name, default weights, event vocabulary
    ├── stage-lens.md              # how the scoring bar shifts by round (pre-seed/seed/A)
    └── output-schema.md           # snapshot files, naming, new-information capture, JSON/CSV
```

## Install (Claude Desktop / Claude Team)

1. Unzip this bundle so you have the `12ps-5os-scorecard/` folder (with `SKILL.md` at its root).
2. In Claude Desktop, open **Customize → Skills** (or your Team's **Organization → Skills** to
   share it firm-wide), add the skill, and point it at this folder (or upload the zip if the UI
   takes a zip). `SKILL.md` must sit at the folder root.
3. To share with colleagues on a Team plan, an org owner enables skill sharing, then shares it
   to each member (it appears under "Shared with you" until they toggle it on) — or provisions
   it org-wide so everyone gets it automatically.

For Claude Code, drop the unzipped `12ps-5os-scorecard/` folder into your skills path (e.g.
`~/.claude/skills/`) or your project's `.claude/skills/`, and it's discovered automatically.

## Make it yours — edit `references/firm-metadata.md`

This is the one file to change to re-home the skill to your firm. It holds:
- **firm name** (used in the orientation preamble),
- **default weights** — 1 per factor by default; O-weights sum to 5, each O's P-weights sum to
  3 (weights are shares of a fixed pool, so raising one lowers others),
- **event vocabulary** — Prior, AfterLLM, AfterMgmt, AfterExpert, AfterIC; extend as needed,
- an optional **IC roster**.

The framework rubric, the workflow, and the schema are firm-agnostic — you shouldn't need to
touch them. If you want to change how the scoring bar reads by stage, edit `stage-lens.md`
(the numeric bars there are a sensible starting calibration, not gospel — tune to your firm).

## How it runs (quick tour)

- **Orientation + acknowledgment** on first use (skippable for repeat users).
- **Choose a workflow:** *anchored* (fast, accepts LLM anchoring), *co-deliberation* (rigorous,
  LLM scores blind and is revealed only after you commit yours), or *elicitation* (you lead,
  the LLM just structures your judgment).
- **Choose granularity:** score the 5 O's, or opt into P-level precision.
- **Confirm weights** (and the agent captures *why* on any change off the default).
- **Snapshots over time:** an independent `Prior`, then an after-snapshot at each influencing
  event (LLM dialogue, management meeting, expert call, IC discussion…). At each event the
  agent captures the **new information** that entered and **what influenced any change** —
  labeled evidence vs. judgment.
- **Output:** the agent asks where it should go — files (JSON spine + CSV rollup + a dated deal
  aggregate), CRM/DB (handed to your CRM skill), or both.

## Editing the skill

Everything here is plain Markdown/YAML — open any file and edit. The fastest way to iterate is
to install the folder, then ask Claude (Desktop or Code) to adjust it; it can read and rewrite
these files directly. If you edit `SKILL.md`'s frontmatter, keep the `description` value's
quoting intact (it's double-quoted because it contains colons) and under ~1024 characters.

## Design guarantees (please preserve if you edit)

- **No verdict.** The rolled-up number is a weighted mean of scores — analytical substrate, not
  a recommendation. IC members decide; the tool informs.
- **Independence before influence.** In co-deliberation the LLM's read is generated blind and
  revealed only after the human commits theirs (a sequencing guarantee, not cryptographic).
- **Immutable snapshots.** A written snapshot is never edited; new events append new snapshots.
- **Capture the *why*.** Weight changes and score revisions record their reasoning at the moment
  they happen — that's the retraceable belief-revision this tool exists to preserve.

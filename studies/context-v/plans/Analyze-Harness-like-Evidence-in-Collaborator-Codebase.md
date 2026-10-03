---
title: "Analyze Harness-like Evidence in a Collaborator Codebase"
lede: "Step 1 of 3: read a collaborator's repo for every sign of how they work with coding agents, and inventory it with paths and dates."
date_created: 2026-10-03
date_modified: 2026-10-03
date_authored_initial_draft: 2026-10-03
date_authored_current_draft: 2026-10-03
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
semantic_version: 0.0.1.0
tags:
  - Plan
  - Studies
  - Collaborations
  - Agentic-Coding
  - Context-Engineering
status: Ready
site_uuid: 51efba2f-3319-4bf2-b6b0-2cc2da29ea91
hex_code: z9hwef
publish: true
---

# Analyze Harness-like Evidence in a Collaborator Codebase

**Step 1 of 3** in a collaboration study. The method and ground rules are in
[[Explore-Collaborator-Codebases-for-Insights-Comparative-Highlights]]
(`studies/context-v/explorations/`). Read it before starting.

| Step | Plan | Depends on |
|---|---|---|
| **1** | **Analyze-Harness-like-Evidence-in-Collaborator-Codebase** (this) | — |
| 2 | Compare-Contrast-Harness-like-Artifacts-between-Lossless-&-Collaborator | Step 1 output |
| 3 | Generate-HTML-Page-for-Lossless-and-Collaborator-rendered-in-AI-Labs-Splash | Steps 1 and 2 output |

The kickoff prompt (`studies/context-v/prompts/Kickoff-Collaborator-Codebase-Analysis.md`)
fills in the parameters below and hands this plan to a subagent.

## Parameters

| Name | Meaning | Example |
|---|---|---|
| `{collaborator}` | Folder slug under `studies/collaborations/` | `example-app` |
| `{codebase}` | Path to their read-only mount | `studies/collaborations/example-app/example-app-codebase/` |
| `{notes}` | Where your output goes | `studies/collaborations/example-app/` |

## The question

**How does this person work with coding agents to build their system?**

We're not reviewing their product or their code quality. We're looking for the
*harness around the code*: everything they've set up so that an agent (Claude
Code, Cursor, Codex, Gemini, whatever) can do useful work in this repo, and
everything the agent work has left behind. Treat the repo as an archaeological
site. Some evidence is deliberate (an instruction file). Some is incidental
(a commit message that reads like an agent wrote it).

## What to look for

Search widely. Most of these won't exist, and an absence is a finding too.
For each category, record what's there, where, how big it is, and how alive it
is (first and last commit touching it).

1. **Instruction sets.** `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`,
   `.cursor/rules/`, `.github/copilot-instructions.md`, `.windsurfrules`,
   system prompts checked into the repo, and instructions nested in
   subfolders. Note how they're layered and whether they contradict each other.
2. **Harness configuration.** `.claude/` (`settings.json`, `commands/`,
   `skills/`, `agents/`, hooks), `.mcp.json` and other MCP config, and
   equivalents for other harnesses. Note which tools are allowed or blocked,
   what hooks run, and which MCP servers are wired in.
3. **Skills and commands.** Read every skill and slash command in full.
   What repeatable know-how did they package? Is it about the domain, the
   stack, or the workflow?
4. **Context engineering.** `docs/`, `Notes/`, `TODO.md`, architecture notes,
   design docs, ADRs, scratch files. What does an agent read before starting
   work, and how does it find it? Is anything written *for* an agent rather
   than a human?
5. **Specs and plans.** Anything written before code: specs, sprint plans,
   measurement designs, checklists, "V2" folders. How detailed? Do they get
   updated after the work ships?
6. **Memory.** Anything that carries what happened from one session to the
   next: changelogs, decision logs, session notes, handoff files, TODO
   histories, a `memory/` folder. If there's no changelog, what plays that
   role? (The git log, PR descriptions, `TODO.md`?)
7. **Git as evidence.** Run `git log` with stats over the whole history.
   Look for `Co-Authored-By` trailers, agent-shaped commit messages, branch
   naming, PR merge patterns, commit cadence, and how large commits are. How
   many of their 26-ish remote branches look like agent work sessions?
8. **Verification.** Tests, test checklists, scripts that check agent output,
   CI workflows, measurement or evaluation designs. How do they know the
   agent's work is right?
9. **Stack choices that help (or fight) agents.** Monolith versus monorepo,
   framework, hosting, typing, how config and secrets are handled. Only note
   these where they bear on agent work.

## Method

1. Record the snapshot first: `git -C {codebase} rev-parse HEAD`, the date of
   the last commit, the commit count, and the remote branch list.
2. Map the tree (`find` to depth 3, ignoring `node_modules`, `.git`, build
   output). Note the size of each top-level folder.
3. Sweep for the categories above. Grep for filenames and for telltale
   phrases ("you are", "agent", "Claude", "prompt", "skill", "MCP").
4. Read the instruction sets, skills, commands and context docs **in full**.
   Skim the rest.
5. Sample the git history: the first 20 commits, the last 50, and a sample
   from each active branch.
6. Write the output.

## Output

One file: `{notes}/01-Harness-Evidence__{collaborator}.md`, with frontmatter
like this plan's (`status: Draft`, `publish: true`). Sections:

1. **Snapshot.** SHA, last commit date, commit count, branch count, and a
   one-paragraph description of what the system is.
2. **Inventory table.** One row per artifact: category, path, size (lines),
   first and last commit date, and a one-line description.
3. **Category findings.** One subsection per category above. What exists,
   with paths and short quotes (a few lines at most). What's absent.
4. **How they work: the inferred workflow.** A narrative of their loop, as
   best the evidence shows: how an idea becomes agent work becomes a commit.
   Include one Mermaid diagram of that loop. Label every claim **observed**
   (cited) or **inferred** (reasoning shown).
5. **Standouts.** Three to seven things that look unusually good, unusual, or
   worth a closer look in step 2.
6. **Open questions.** What you couldn't tell from the code alone, phrased so
   we could ask them.

## Guardrails

- **Read-only.** Never commit, push, branch, stash, check out, install, or
  run anything inside `{codebase}`. Read files and run read-only git commands
  (`log`, `show`, `ls-remote`, `branch -r`) only. No `npm install`, no builds.
- **Cite everything.** Every finding gets a path (and line numbers where they
  help) relative to `{codebase}`. A finding without a path doesn't go in.
- **Short quotes only.** Quote a few lines to show the shape. Don't copy
  whole files; the repo is theirs and it's private.
- **No secrets.** If you come across keys, tokens, or credentials, don't
  record them. Note only that a secret is committed at that path, and flag it
  in your report so we can tell them privately.
- **Describe, don't judge yet.** Comparison and recommendations belong to
  step 2. Here, only "standouts" leans toward evaluation.
- **Don't touch Lossless files** except your one output file.

## Done when

- [ ] The output file exists with all six sections.
- [ ] Every inventory row has a path that exists at the recorded SHA.
- [ ] All nine categories are covered, including the ones that are absent.
- [ ] The workflow diagram is valid Mermaid.
- [ ] `git -C {codebase} status` is clean, and the only new file anywhere is
      the output file.

**Report back** in under 200 words: the output path, the five strongest
findings, any secrets flagged, and anything that blocked you.

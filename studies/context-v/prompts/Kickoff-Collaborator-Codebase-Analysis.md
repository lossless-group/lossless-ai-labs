---
title: "Kickoff: Collaborator Codebase Analysis"
lede: "Act as VP of Engineering: run three subagents in sequence to compare a collaborator's agentic-coding harness with ours."
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
  - Prompt
  - Kickoff
  - Studies
  - Collaborations
  - Subagents
site_uuid: 48579756-ec16-426e-9b97-32de5a805f3e
hex_code: bq6oul
publish: true
---

# Kickoff: Collaborator Codebase Analysis

## Your role

You are **VP of Engineering** for this study. You don't do the analysis
yourself. You prepare the ground, brief three subagents **one after another**
(each depends on the one before), review each one's output against its plan
before releasing the next, and report to Michael at the end.

Read these first:

- The method: `studies/context-v/explorations/Explore-Collaborator-Codebases-for-Insights-Comparative-Highlights.md`
- The three plans in `studies/context-v/plans/`:
  1. `Analyze-Harness-like-Evidence-in-Collaborator-Codebase.md`
  2. `Compare-Contrast-Harness-like-Artifacts-between-Lossless-&-Collaborator.md`
  3. `Generate-HTML-Page-for-Lossless-and-Collaborator-rendered-in-AI-Labs-Splash.md`

## Parameters for this run

Fill in `<collaborator>` when you start the run. It isn't written here,
because this prompt is public and reused for every collaborator.

| Name | Value |
|---|---|
| `{collaborator}` | `<collaborator>`: the folder slug under `studies/collaborations/` |
| `{codebase}` | `studies/collaborations/<collaborator>/<collaborator>-codebase/` |
| `{notes}` | `studies/collaborations/<collaborator>/` |
| `{lossless_projects}` | `augment-it/`, `memopop-ai/` |
| `{public_name}` | `The Collaborator` |
| `{route_slug}` | `silo-to-silo-01` |

Why these two Lossless projects: the collaborator seems to have built a
monolith, while augment-it and memopop-ai are monorepos. The architecture
difference is part of what we're comparing.

All paths are relative to `ai-labs/`.

## Step 0: preflight (you do this yourself)

1. **Mount the Lossless projects.** On some machines `augment-it` and
   `memopop-ai` are registered but never cloned. Check with
   `git submodule status augment-it memopop-ai`. A leading `-` means not
   cloned. Clone with `git submodule update --init augment-it memopop-ai`
   (non-recursive first). Then look at each one's own submodules and clone
   only the ones that hold harness artifacts (instructions, skills,
   `context-v/`). Skip vendored upstreams.
2. **Check the tree layer is readable.** `../CLAUDE.md`,
   `../context-v/agent-skills/`, `CLAUDE.md`. Note whether the vendored
   `archify` skill is cloned (step 2 can use it if so).
3. **Record the snapshot.** The HEAD SHA of `{codebase}`, `augment-it`,
   `memopop-ai` and ai-labs, with today's date. Every subagent's output must
   match these SHAs.
4. **Check the collaborator mount is clean and read-only.**
   `git -C {codebase} status` must be empty. Keep the output so you can show
   at the end that nothing changed.
5. **Record what's already dirty** with `git status --short` in ai-labs, so
   you can tell your subagents' changes apart from earlier ones.

If any step fails, stop and tell Michael. Don't improvise around it.

## Steps 1–3: brief, wait, review, release

For each step, launch **one** `general-purpose` subagent, wait for it to
finish, then review. Never run two steps at once.

### The brief

Subagents don't see this conversation, so each brief must stand on its own:

```
You are step {n} of 3 in a Lossless collaboration study. Your full
instructions are in:
  ai-labs/studies/context-v/plans/{plan file}
Read that plan and the exploration it links to before doing anything else.

Parameters:
  {the parameter table, filled in}

Snapshot (your output must match these SHAs):
  {the SHAs from step 0}

Inputs from earlier steps:
  {paths to step 1 and 2 output, as relevant}

Follow the plan's Guardrails exactly. Don't commit or push. When you're
done, check every item in the plan's "Done when" list and report back in the
format the plan asks for.
```

### The review gate

Before you release the next step, read the output in full. Then:

- [ ] **Check the "Done when" list yourself.** Don't take the report's word
      for it.
- [ ] **Spot-check five citations.** Open the cited paths. Do they exist at
      the recorded SHA, and do they say what's claimed?
- [ ] **Check guardrails.** `git -C {codebase} status` is still clean, and
      `git status` shows only the expected new files.
- [ ] **Check the substance.** Step 1: an inventory, not a review. Step 2:
      fair both ways, with at least one Lossless lesson drawn from them.
      Step 3: zero hits from the anonymity grep over `splash/dist/`.

If the output falls short, send the **same** subagent specific corrections
(SendMessage, not a fresh agent, so it keeps its context). Allow one round
of fixes. If it still falls short, stop and bring it to Michael with what's
wrong.

Between steps, post Michael a one-line status, for example "Step 1 done:
23 artifacts inventoried, starting step 2".

## Step 4: wrap-up (you)

1. Give Michael a short report covering:
   - The three output paths.
   - The top three insights each way, taken from step 2.
   - What you'd want him to look at on the page before it ships, with the
     preview command (`pnpm preview` in `splash/`).
   - Anything the subagents flagged, especially committed secrets in the
     collaborator's repo. Give those to Michael privately; don't write them
     into any file.
   - Proof that `{codebase}` is untouched.
2. **Don't commit or push.** Propose the commits (following
   `git-conventions`) and wait for Michael's go-ahead. Pushing ai-labs
   deploys the splash page publicly.
3. Once Michael approves shipping, draft a changelog entry following
   `changelog-conventions`, **anonymized** like `changelog/2026-10-03_01.md`:
   no collaborator name, account, repo or product, and `<collaborator>` in
   the list of changed files.
4. Leave the new submodule clones of `augment-it` and `memopop-ai` in place.
   Mention them in the report; don't commit them.

## Things a VP doesn't do

- Write the analysis, the comparison or the page yourself, even when a
  subagent is slow.
- Release step 2 before step 1 passes review, or step 3 before step 2 does.
- Touch anything inside `{codebase}`.
- Fix drift you notice in Lossless projects along the way. Note it in the
  report instead.

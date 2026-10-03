---
title: "Compare and Contrast Harness-like Artifacts between Lossless and a Collaborator"
lede: "Step 2 of 3: set our harness beside theirs. What's shared, similar, different, missing, and what each side should do about it."
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
  - Comparative-Highlights
status: Ready
site_uuid: 19b43f02-30e7-443f-a7dd-68fcf7d49674
hex_code: yrq380
publish: true
---

# Compare and Contrast Harness-like Artifacts between Lossless and a Collaborator

**Step 2 of 3** in a collaboration study. The method and ground rules are in
[[Explore-Collaborator-Codebases-for-Insights-Comparative-Highlights]]
(`studies/context-v/explorations/`). Read it before starting.

| Step | Plan | Depends on |
|---|---|---|
| 1 | Analyze-Harness-like-Evidence-in-Collaborator-Codebase | — |
| **2** | **Compare-Contrast-Harness-like-Artifacts-between-Lossless-&-Collaborator** (this) | Step 1 output |
| 3 | Generate-HTML-Page-for-Lossless-and-Collaborator-rendered-in-AI-Labs-Splash | Steps 1 and 2 output |

## Parameters

| Name | Meaning | Example |
|---|---|---|
| `{collaborator}` | Folder slug under `studies/collaborations/` | `example-app` |
| `{codebase}` | Path to their read-only mount | `studies/collaborations/example-app/example-app-codebase/` |
| `{notes}` | Where step 1's output is and where yours goes | `studies/collaborations/example-app/` |
| `{lossless_projects}` | The Lossless projects to compare against | `augment-it/`, `memopop-ai/` |

## Inputs

- **Step 1's output:** `{notes}/01-Harness-Evidence__{collaborator}.md`. This
  is your evidence on their side. Go back to `{codebase}` only to check a
  claim or fill a gap, and say when you did.
- **The Lossless side.** Step 1 didn't cover it, so you build that inventory
  yourself, using the same nine categories. Two layers:
  1. **The projects:** each of `{lossless_projects}`. These are monorepos;
     the collaborator's repo is probably a single-app monolith. The
     architecture difference is part of the story, so note how each side's
     harness follows from its shape.
  2. **The tree they inherit:** what every Lossless project gets from above
     it. That's `ai-labs/CLAUDE.md`, the anchor `../CLAUDE.md` (`AGENTS.md`),
     the shared skills in `../context-v/agent-skills/` (one source of truth,
     linked into `~/.claude/skills` with GNU Stow), the `context-v/`
     convention (`context-vigilance` skill), `changelog/`
     (`changelog-conventions`), git conventions (`git-conventions`), the
     Chroma corpus over past sessions (`../context-v-corpus/`), and the
     browser-drive verification blueprint.

  Don't inventory the whole tree. Stop at what actually reaches
  `{lossless_projects}`, and keep the tree layer to a page.

## Two layers first

Before bucketing, split both inventories by layer (see "Two harnesses, not
one" in the exploration):

- **Developer-agents harness:** how coding agents help build the software.
- **In-product-agents harness:** how the product's own agents generate its
  output. For Lossless, that means memopop-orchestrator's memo pipeline
  (and augment-it's in-product agents, if any).

**Compare only within a layer.** Never pair one side's product artifact
with the other side's dev artifact. A content-generation ledger is not a
counterpart to an issues folder. Then produce a **layer map**: for each
side and each layer, a depth rating (thin, moderate or deep) with a
one-line justification. The layer map is the headline of the whole study.

## The four comparisons

Run the four comparisons **inside each layer**. Sort every artifact from
both sides into exactly one bucket within its layer. Then write a
narrative for each bucket. Prose, with paths on both sides, not just a table.

1. **Shared.** Both sides have essentially the same artifact (for example,
   both keep a `CLAUDE.md`). Compare how each is written and maintained.
2. **Similar.** Same job, different form (for example, their `docs/` against
   our `context-v/`, or their `TODO.md` against our plans and changelog).
   This is usually the richest bucket. Say what each form gains and loses.
3. **Different.** Something on one side with no counterpart on the other,
   where the absence is a deliberate fit for that context.
4. **Missing.** Something on one side with no counterpart on the other,
   where the other side would probably benefit from it. Note which way the
   gap runs.

"Different" against "missing" is a judgment call. Make it explicitly and
give your reasoning.

## Insights and recommendations

Four separate sections. Keep them separate, because they'll be shown to
different readers.

Organize each of the four by layer. Expect the strongest lessons to flow
across layers: each side teaches from the layer where it's deep and learns
in the layer where it's thin. Say so plainly if the evidence shows that.

- **Insights for Lossless.** What their silo shows us about our own. Include
  where we may be overbuilt.
- **Insights for the Collaborator.** What our silo shows about theirs.
- **Recommendations for Lossless.** Concrete and ranked. Each one names the
  artifact in their repo that inspired it, the place it would land in ours,
  and a rough effort (S, M, or L).
- **Recommendations for the Collaborator.** **Five at most**, ranked by
  payoff for *their* setup. Each one gives the smallest useful version (not
  our full convention), the evidence in their repo that makes it relevant,
  and a pointer to our artifact as a worked example. Translate, don't
  transplant: a single-app repo doesn't need a pseudomonorepo's machinery.

## Diagrams

Use Mermaid by default. If the vendored `archify` skill is available
(`../context-v/agent-skills/archify/`, a git submodule that may not be
initialized), you may use it for architecture views instead. At least these:

1. **Layer map.** Two sides by two layers, showing depth in each cell.
2. **Side-by-side harness maps, one per layer.** Each side's artifacts
   grouped by category, with shared and similar pairs linked across.
3. **Workflow loops per layer.** The developer loop for each side, and the
   in-product generation loop for each side (their exam pipeline, our memo
   pipeline). Use step 1's diagrams for theirs.
4. **Shape against harness.** How monolith and monorepo architecture each
   shape where the instructions and context live.
5. **(Optional) A bucket overview.** Counts or a quadrant of
   shared, similar, different, and missing.

Every diagram must be valid Mermaid that renders on GitHub. Step 3 will
rebuild them as visuals, so keep the labels short and the structure clear.

## Output

One file: `{notes}/02-Compare-Contrast-Harness-Artifacts__{collaborator}.md`,
with frontmatter like this plan's (`status: Draft`, `publish: true`). Section
order:

1. **Highlights.** Five to eight bullets a busy reader could stop after,
   led by the layer map's headline.
2. Snapshot (both SHAs, and what was compared).
3. **Layer map.**
4. The diagrams.
5. Shared, Similar, Different, Missing (the narratives), within each layer.
6. Insights for Lossless, then Insights for the Collaborator.
7. Recommendations for Lossless, then Recommendations for the Collaborator.
8. Open questions to ask them.

## Guardrails

- **Read-only everywhere** except your one output file. That includes
  `{lossless_projects}`. Note our own drift; don't fix it.
- **Cite both sides** with paths (theirs relative to `{codebase}`, ours
  relative to `ai-labs/` or the anchor root).
- **Be fair to both sides.** "Ahead" is a single axis at best. If every
  insight flows from us to them, you've missed something. Look again at
  their domain craft and at the places where their simplicity wins.
- **Write for both readers.** The collaborator may read this. Be candid and
  kind, and avoid talking down.
- **No secrets** from either side.

## Done when

- [ ] Every artifact in step 1's inventory, and every Lossless artifact you
      inventoried, has a layer and sits in exactly one bucket within it.
- [ ] No pairing crosses layers.
- [ ] The layer map rates all four cells, each with a justification.
- [ ] All four insight and recommendation sections exist. Collaborator
      recommendations are five or fewer.
- [ ] At least three Mermaid diagrams, all valid.
- [ ] At least one Lossless recommendation comes from something they do
      better.
- [ ] `git status` shows only the new output file (plus whatever was
      already dirty before you started).

**Report back** in under 200 words: the output path, the top three insights
each way, and any judgment calls you'd like a human to check.

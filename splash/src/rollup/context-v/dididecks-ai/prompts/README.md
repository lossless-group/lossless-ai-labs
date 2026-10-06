---
title: "DidiDecks prompt templates: how they compose"
lede: "Prompts are single-role subagent briefs with variables. A plan sequences prompts. A loop runs a plan over a queue. You only ever call one of them."
publish: false
date_created: 2026-10-02
date_modified: 2026-10-02
date_authored_initial_draft: 2026-10-02
date_authored_current_draft: 2026-10-02
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Draft
tags:
  - Prompt-Templates
  - Subagent-Orchestration
  - Deck-Iteration-Workflow
from: "dididecks-ai"
from_path: "context-v/prompts/README.md"
---
# DidiDecks prompt templates

These files let anyone run the DidiDecks remake pipeline without improvising
the instructions in chat. Fill in a few variables, point Claude Code at one
file, and it does the rest.

## The logic: Loop → Plan → Prompt

Three layers, and each one calls only the layer below it:

| Layer | Folder | What it is | Who runs it |
|---|---|---|---|
| **Loop** | `context-v/loops/` | Runs a plan repeatedly: over a queue of source decks, or until an exit condition holds. | The top-level Claude Code session, optionally under `/loop`. |
| **Plan** | `context-v/plans/` | A multi-step sequence with gates. Takes the **VP Eng / orchestrator** role. Spawns subagents, hands each one a prompt, checks the work, and decides what happens next. | The top-level session. |
| **Prompt** | `context-v/prompts/` | **One role, one job, one subagent.** Has declared inputs, declared outputs on disk, and a verify step. Never spawns other agents. | A subagent. |

Rule of thumb: **anything with more than one role in it is a plan.** If you
catch a prompt saying "then hand off to…", that part belongs in the plan.

You only ever call **one** file:

- One source deck → call the **plan**.
- Many source decks, or "keep going until they all pass" → call the **loop**.
- Redoing one step, like re-auditing an extraction or redesigning one variant → call that **prompt** directly.

## How to call it

**Easiest: the slash command.** From a Claude Code session opened at the
`dididecks-ai` repo root:

```text
/remake-deck "Edit on the Spot" eventcut-ai client-sites/eventcut-ai/inputs/2026-08-02_EventCut_Deck/EventCut-Deck-2026-08-02.pdf N_VARIANTS=3
```

The command lives at `.claude/commands/remake-deck.md` and is committed, so
it arrives with `git pull`. It only maps the arguments onto the plan below.

**Or by hand** (copy, fill in, paste into Claude Code):

```text
Run context-v/plans/Remake-Source-Deck-into-Design-Variants.md with:
  COMPANY=EventCut
  CLIENT_SITE=client-sites/eventcut-ai
  SOURCE_DECK=client-sites/eventcut-ai/inputs/2026-08-02_EventCut_Deck/EventCut-Deck-2026-08-02.pdf
  DECK_SLUG=pitch
  N_VARIANTS=3
```

Leave out any variable that has a default. If a required variable is missing,
the orchestrator asks for it before doing anything else.

## The variable contract

Every template uses the same names in `{{DOUBLE_BRACES}}`. Only plans and
loops take variables from a human. Prompts receive theirs from the plan.

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `COMPANY` | yes | n/a | Display name of the company the deck is about. |
| `CLIENT_SITE` | yes | n/a | Path to the client-site submodule, e.g. `client-sites/eventcut-ai`. Must already exist (if it doesn't, run `setup-new-dddecks-workspace` first). |
| `SOURCE_DECK` | yes | n/a | Path to the source deck: a PDF, a PPTX, or a folder of slide images. |
| `DECK_SLUG` | no | `pitch` | Which deck in `src/data/decks.ts` the variants attach to. Created if missing. |
| `N_VARIANTS` | no | `3` | How many clean-room design variants to fan out. |
| `SOURCE_SLUG` | no | derived: `YYYY-MM-DD_<Company>_<Deck>` | Folder name for the extraction outputs. |
| `CONTENT_POLICY` | no | `rewrite-ok` | `verbatim`: copy stays word-for-word. `rewrite-ok`: copy may be rewritten, reordered, merged, or cut. **Facts are locked in both modes**: every number, name, and claim must trace back to the extraction. |
| `BRAND_POLICY` | no | `client-brand` | `client-brand`: use the client's brand. The source of truth, in order: the site's `DESIGN.md`, then the palette observed in the extraction narrative. `theme.css` counts only if it is the deck's theme; some sites' `theme.css` styles the hub, not the deck. The orchestrator names the source in the brief. `free`: designers may invent a visual identity. |
| `INCLUDE_FAITHFUL` | no | `false` | When `true`, adds one extra variant that rebuilds the source deck's own layout (design-only redo). This is the only variant allowed to see the source layout. |
| `VARIANT_SLUG` | (set by plan) | next free `v1…vN` | Assigned per variant by the orchestrator. Subagents never pick their own. |
| `SCRATCH_DIR` | (set by plan) | `<session scratchpad>/<VARIANT_SLUG>/` | Each designer's private temp folder, which keeps the clean room clean. |

## Where outputs land (the filesystem contract)

```
{{CLIENT_SITE}}/
├── inputs/{{SOURCE_SLUG}}/                     # original deck (gitignored: client material)
├── src/content/source-decks/{{SOURCE_SLUG}}/   # STRUCTURED + SEMI-STRUCTURED (committed)
│   ├── slides.json                             #   per-slide blocks, data, image refs
│   ├── layout.md                               #   per-slide layout narrative
│   └── data/NN-<name>.csv                      #   tables and chart series
├── src/assets/source-decks/{{SOURCE_SLUG}}/    # extracted images, logos, headshots (committed)
├── context-v/narratives/Source-Deck-Extraction--{{SOURCE_SLUG}}.md   # UNSTRUCTURED verbatim transcript (committed)
├── design-drafts/{{DECK_SLUG}}/{{VARIANT_SLUG}}.html # one coherent HTML file per variant
├── src/components/scroll/{{DECK_SLUG}}/{{VARIANT_SLUG}}/Section__<Name>.astro
└── src/pages/scroll/{{DECK_SLUG}}/{{VARIANT_SLUG}}/index.astro
```

`inputs/` stays out of git. Everything a collaborator needs to keep working
is committed.

## The templates

| File | Role | Called by |
|---|---|---|
| [[Extract-Source-Deck]] | Extractor / transcriber | plan, step 1 |
| [[Audit-Source-Deck-Extraction]] | Extraction auditor | plan, step 2 |
| [[Design-Deck-Variant-as-Single-HTML]] | Clean-room deck designer | plan, step 3 (×N in parallel) |
| [[Refactor-HTML-Variant-into-Astro-Scroll-Sections]] | Astro engineer | plan, step 4 (×N) |
| [[Verify-Variant-Plays-in-Scroll-Shell]] | Shell QA | plan, step 5 (×N) |
| [[Remake-Source-Deck-into-Design-Variants]] (plan) | VP Eng / orchestrator | you, or the loop |
| [[Remake-Source-Decks-Queue]] (loop) | Queue runner | you |

## What comes after

These templates stop at a deck that plays in the **Scroll-UI**. Converting
the chosen variant to Play-UI (rigid 16:9, no JS) is a separate motion; see
the anchor-root prompt `Port-Astro-Deck-Sections-to-Slides` and the
`deck-iteration-workflow` skill.

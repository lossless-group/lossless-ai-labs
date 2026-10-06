---
name: remake-deck
description: Remake a company's source pitch deck (PDF, PPTX, or folder of slide images) into N clean-room design variants that play in the DidiDecks Scroll-UI shell. The agent takes the VP Eng / orchestrator role and runs the dididecks-ai plan `Remake-Source-Deck-into-Design-Variants`, which extracts and audits the deck, fans out N designers who each produce one coherent HTML + Tailwind deck without seeing the original layout or each other, refactors each into Astro `Section__<Name>.astro` components rendered from one `index.astro`, wires the deck registry, and verifies every variant in the shell. Use whenever the user says "/remake-deck", "remake this deck", "redesign their deck", "give me three takes on this pitch deck", "turn this PDF deck into dididecks variants", or hands over a client's source deck under dididecks-ai and wants new designs from it. Arguments are company, client-site, source-deck path, plus optional KEY=value overrides (N_VARIANTS, DECK_SLUG, CONTENT_POLICY, BRAND_POLICY, INCLUDE_FAITHFUL). Composes with deck-iteration-workflow (this is its Phase 1, done N times in parallel), astro-knots, theme-system, and setup-new-dddecks-workspace (run that first if the client-site doesn't exist yet).
from: "dididecks-ai"
from_path: "context-v/agent-skills/remake-deck/SKILL.md"
---
# remake-deck

A thin entry point. The real procedure lives in the `dididecks-ai` repo as
versioned context-v documents, so the pipeline evolves in one place and this
skill never drifts from it:

| Layer | File (relative to the `dididecks-ai` root) |
|---|---|
| Variables, filesystem contract, how the layers compose | `context-v/prompts/README.md` |
| **The plan you execute** (orchestrator) | `context-v/plans/Remake-Source-Deck-into-Design-Variants.md` |
| Subagent briefs, one per role | `context-v/prompts/{Extract-Source-Deck, Audit-Source-Deck-Extraction, Design-Deck-Variant-as-Single-HTML, Refactor-HTML-Variant-into-Astro-Scroll-Sections, Verify-Variant-Plays-in-Scroll-Shell}.md` |
| Batch runner over many decks | `context-v/loops/Remake-Source-Decks-Queue.md` |

## Step 1: Find the dididecks-ai repo

Walk up from the current directory looking for
`context-v/plans/Remake-Source-Deck-into-Design-Variants.md`. Also try
`./ai-labs/dididecks-ai/` and `./dididecks-ai/` below the current directory. On
the maintainer's machine it's
`~/code/lossless-monorepo/ai-labs/dididecks-ai`. If none of these exist, ask
the user for the path once. Don't guess further.

If the chat has **no file or shell access** at all (a plain web chat with no
connected workspace), say so plainly: this pipeline writes files and runs a
build, so it needs an agent with the repo on disk. Stop there.

## Step 2: Map the arguments

Read `context-v/prompts/README.md`, then map the user's arguments:

1. The first argument is `COMPANY`. Quote multi-word names.
2. The second is `CLIENT_SITE`. Accept `client-sites/<slug>` or a bare `<slug>`.
3. The third is `SOURCE_DECK`.
4. Any `KEY=value` pairs override the defaults in the README's variable table.

If any of the three required arguments is missing, ask for all the missing ones in one
question. Don't ask anything else up front; the plan's step 0 covers the rest.

## Step 3: Execute the plan as orchestrator

Read the plan file end to end and follow it. You hold the VP Eng role. You
brief subagents and judge their work; you don't extract, design, or write
Astro yourself.

### If your harness can't spawn subagents

Some agent chats have no subagent or task tool. Run the same plan with
each role played **in sequence, in your own context**, and make up for the
lost isolation:

- **Extract → audit:** after extracting, re-open the renders and audit as if
  someone else did the work. Report audit findings separately from extraction.
- **Design:** the clean room is the part that matters. Design each variant
  from `slides.json`, the CSVs, and the assets *only*. Finish and save one
  variant before starting the next, don't re-open an earlier draft while
  designing a later one, and use sharply different design seeds. Tell the user
  the variants were designed in sequence by one agent, so divergence is weaker
  than in a parallel run.
- Default `N_VARIANTS` to 2 in this mode unless the user asked for more. It's
  slow, and context fills up.

Tell the user which mode you're running in, in one line, before step 1 of the plan.

## Step 4: Report

Use the report format at the end of the plan. Always include the variant URLs
(`/scroll/<deck>/<variant>/`), every `[NEEDS: ...]` placeholder, and the
client flags from the extraction audit. Those are the things a human acts on
next.

## Don't

- Don't paraphrase the plan or prompts from memory. They change; read them each run.
- Don't edit the pipeline docs during a run unless the user asks. Collect
  friction from the subagents' reports and offer the fixes at the end.
- Don't commit to a client-site's `development` branch without the user's
  go-ahead.

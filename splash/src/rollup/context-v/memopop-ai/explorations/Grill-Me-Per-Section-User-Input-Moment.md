---
title: "Grill Me: A Per-Section User-Input Moment in MemoPop Runs"
lede: "A proposed pause-point in the orchestrator where, for any given section, MemoPop turns the question around and grills the user — surfacing what it found, what's ambiguous, and what choice the user (not the model) should make about the synthesized output. First user is the competitive section, where the gap between an exhaustive research file and a synthesized memo section is large enough that the model shouldn't pick the synthesis frame alone. Designed generic from day one so other sections can adopt it without re-architecting."
date_authored_initial_draft: 2026-06-09
date_authored_current_draft: 2026-06-09
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-06-09
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Exploration
tags:
  - Grill-Me
  - User-Input
  - Human-In-The-Loop
  - Orchestrator
  - MemoPop-UI
  - Competitive-Analysis
  - Section-Synthesis
  - Architecture
authors:
  - Michael Staton
from: "memopop-ai"
from_path: "context-v/explorations/Grill-Me-Per-Section-User-Input-Moment.md"
---
# Grill Me — A Per-Section User-Input Moment in MemoPop Runs

## The problem

For some memo sections, the gap between the **exhaustive research artifact** and the **synthesized section that ships in the memo** is too large for the model to bridge on its own without making a frame choice that should belong to the user.

The clearest case is competitive analysis (see [[competitive-analysis]] in `context-v/agent-skills/`):

- The research file should be **exhaustive**: every competitor classified on two axes (stage ring × competitor type), with notes, sources, and reasoning for every noisewashing-vs-genuine-threat reclassification.
- The memo section must be **synthesized**: a table, a list grouped by ring or type, a concentric-ring diagram, or a 2×2 — collapsed to something a partner can scan in under a minute.

A model picking the synthesis frame unaided will default to whatever pattern its training distribution suggests, which is often not what the *firm* wants, not what the *deal* needs, and not what the *partner reading the memo* will respond to. The same competitive corpus could land as:

- A 4-quadrant matrix (price × segment, or moat × growth)
- A concentric-ring landscape diagram
- A grouped list by ring (early stage / scaleup / incumbent) with noisewashing called out
- A short "the 3 competitors who matter" prose paragraph and a footnoted long list
- A heads-up table of direct competitors only, with the rest deferred to the research file

All five are defensible. None is universally right. The right frame depends on a judgment the user holds and the model doesn't.

## The proposal

Introduce an optional **grill-me moment** in the orchestrator run: a checkpoint where, for any section configured to use it, the pipeline pauses *after* research/classification is complete and *before* the section is synthesized into final-memo form. At that checkpoint, MemoPop turns the question around — instead of asking the user to fill in a blank, it presents what it found and asks the user to make a short list of choices that determine the synthesis frame.

The name "grill me" captures the inversion: usually the user briefs the system; here the system briefs the user and asks them to pick.

### Why "generic from day one"

The user's call. Competitive is the first adopter — but `team`, `market`, `risks`, and `recommendation` all have the same shape: exhaustive research, multiple defensible synthesis frames, a firm/partner preference that the model can't infer. Building this as a per-section mechanism (rather than a competitive-section feature) means later adopters wire in by adding a `grill_me:` block to their outline section, not by adding a second code path.

## Where it fits in the orchestrator run

Today's pipeline (per `apps/memopop-orchestrator/CLAUDE.md`):

```
deck_analyst → research → writer (section-by-section)
  → trademark/socials/link/citation enrichment
  → toc → citation_validator → fact_checker → validator → supervisor
```

The grill-me checkpoint sits **between the section's research/classification step and the writer's synthesis of that section**:

```
[section research, exhaustive]
    ↓
[classification / structuring within the research file]
    ↓
GRILL-ME CHECKPOINT  ← pause, present, ask user to pick synthesis frame
    ↓
[writer synthesizes the section using the user's frame choice]
    ↓
[downstream enrichment unchanged]
```

For sections without a configured grill-me block, the pipeline proceeds as today. For sections with one, the pipeline halts on the checkpoint until the UI returns a user decision, then resumes with that decision injected into the writer's context.

This means grill-me is **opt-in per section, per outline** — not a global mode change.

## What the user sees at the moment

For the competitive section, the UI presents:

1. **What we found.** A compact summary of the research corpus: count of competitors by ring × type, the few flagged for noisewashing-vs-genuine-threat reclassification, sources used.
2. **What's ambiguous.** Explicit calls-out: e.g., "we classified Microsoft Azure as `genuine threat` rather than `noisewashing` — confirm/flip?" or "we found 11 candidates for `direct`; the taxonomy says this is too many — which 3 should be the front-page direct competitors?"
3. **Synthesis frame options.** A short menu of frames the writer could use, each with a one-line preview (table / ring diagram / grouped list / front-page short list + long footnote / matrix on which two axes). Recommended frame at the top, with the reasoning.
4. **Free-text override.** "Tell us what you actually want."

The user's response — frame choice, reclassifications, free-text — becomes structured input that the writer agent reads alongside the research file.

## Schema sketch

A `grill_me` block on an outline section (`templates/outlines/`) would look roughly like:

```yaml
sections:
  - number: 6
    name: "Competitive Landscape"
    filename: "06-competitive-landscape.md"
    grill_me:
      enabled: true
      summarize:
        - "count_by_ring_and_type"
        - "noisewashing_reclassifications"
        - "sources_used"
      ambiguities:
        - rule: "direct_count > 3"
          prompt: "We found {n} direct competitors; the taxonomy says this is too many. Pick the front-page set."
        - rule: "any noisewashing_to_genuine_threat reclassifications"
          prompt: "Confirm or flip each reclassification."
      frame_options:
        - id: "ring_diagram"
          label: "Concentric-ring landscape diagram"
          recommend_when: "competitors span 3+ rings"
        - id: "grouped_list"
          label: "List grouped by ring, noisewashing called out"
          recommend_when: "competitors cluster in 1-2 rings"
        - id: "front_page_short_list"
          label: "3 competitors that matter, long list footnoted"
          recommend_when: "direct_count <= 3 and adjacent_count <= 5"
        - id: "matrix_2x2"
          label: "2×2 matrix on user-chosen axes"
      free_text: true
```

The orchestrator side reads this block, runs the summary/ambiguity computations against the research artifact, and emits a checkpoint event for the UI.

## Open design questions

1. **Sync or async pause?** Does the orchestrator halt the whole run until the user answers (simple, but blocks other sections), or does it proceed with sections that don't need grill-me and circle back? Async is better for long memo generation; sync is simpler to build.
2. **Headless / batch mode behavior.** If the run is unattended (CLI batch, scheduled job), grill-me should fall through to the `recommend_when` default rather than block forever. This needs to be a documented fallback, not an emergent behavior.
3. **State persistence.** The user's grill-me answers should land in `state.json` so a re-run can replay them by default and only re-prompt if the underlying research changed materially.
4. **Where the UI hook lives.** MemoPop native app already has the "✨ Curate Best Sources" pattern (per the orchestrator's CLAUDE.md §architectural direction). Grill-me checkpoints can probably reuse the same UI checkpoint mechanism — worth confirming before designing a parallel one.
5. **Does grill-me replace, or supplement, the existing evaluator agents?** For competitive specifically, `competitive_landscape_evaluator.py` already does some judgment work. Grill-me probably *moves* the framing judgment from evaluator-to-user rather than adding a second pass; the evaluator becomes a pre-grill prep step.
6. **How exhaustive should the "ambiguities" detection be?** Hand-authored rules per section vs. a model-generated "things I'd grill the user about" list. Probably both — rules for the deterministic stuff, model-generated for the judgment-call stuff.

## Why this isn't just "ask the model harder"

The model can produce any of the five competitive synthesis frames competently. What it cannot do is know which one *this firm, this partner, this deal* wants. That information lives outside the corpus. Asking the model to guess wastes a real opportunity to capture a 30-second user decision that materially improves the section. Grill-me is the mechanism for capturing that decision at the moment it would otherwise be guessed.

## Adoption sequence

1. Land the [[competitive-analysis]] taxonomy skill (done, this run).
2. Spec the orchestrator checkpoint protocol — what event the pipeline emits, what payload the UI expects, what payload the UI returns.
3. Add the `grill_me:` block to the competitive section of one outline and wire the orchestrator to honor it.
4. Build the UI checkpoint moment in MemoPop, starting with the competitive section's grill-me payload as the first concrete case.
5. Generalize: once the competitive moment works, document the schema and invite other sections (`team`, `risks`, `recommendation`) to add their own `grill_me:` blocks.

## See also

- [[competitive-analysis]] — taxonomy this builds on (`ai-labs/memopop-ai/context-v/agent-skills/competitive-analysis/SKILL.md`)
- `apps/memopop-orchestrator/CLAUDE.md` — current pipeline shape and the "two recent explorations" section on architectural direction
- `apps/memopop-orchestrator/context-v/Containerizing-Internal-Comments-and-Recommendations-for-Consideration.md` — related pattern for human-in-the-loop input
- `context-v/explorations/Separating-Retrieval-from-Generation-in-Agent-Pipelines.md` — related, on splitting agent responsibilities
- `context-v/explorations/Curating-only-valid-Sources-across-Runs.md` — the existing user-checkpoint precedent in the native app

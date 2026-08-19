---
site_uuid: 42fd6e14-b179-405c-974e-1b4a4fb92607
hex_code: 88kbs6
title: "Reorder and Edit the Direct Outline"
lede: "Every memo MemoPop generates is shaped by a YAML outline, and today the only way to change one is to open the file in an editor. Anyone who isn't running Claude Code against the repo — which is to say, every prospective customer — can browse outlines in the native app but cannot reorder a section, edit a prompt, or fork a template."
summary: "Seed spec for outline editing in memopop-native. Establishes the gap (the outline layer is the product's main configuration surface and has no write UI), the constraints the YAML schema imposes on any editor, and the open questions that need answering before this can be built. Deliberately unfinished — written 2026-08-17 during the context-v frontmatter sweep to convert a three-word stub into something continuable. Filed under prompts/ but it is a feature spec; see the note on placement."
status: Draft
publish: false
date_created: 2025-11-28
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
tags:
  - Spec
  - Outline
  - MemoPop-Native
  - Feature-Idea
  - Seed
from: "memopop-ai/memopop-native"
from_path: "context-v/specs/Reorder-and-Edit-Direct-Outline.md"
---
# Reorder and Edit the Direct Outline

> **Status: seed.** This document exists to hold the idea and its constraints so
> the next person does not have to rediscover them. It is not a finished spec and
> should not be implemented from as-is.

> **Provenance.** Created 2025-11-28 as an empty file at
> `apps/memopop-orchestrator/context-v/prompts/Reorder-and-Edit-Direct-Outline.md`
> and never written. Moved here and seeded 2026-08-17: it is a **spec**, not a
> prompt, and the feature is a `memopop-native` UI concern rather than an
> orchestrator one. **Only this copy exists** — the orchestrator file was deleted.
> The two apps are separate git repositories, so the move is a delete plus an add
> and git will not record it as a rename.
>
> Paths below are given from the **memopop-ai repo root** rather than relative to
> this file, since the spec spans both apps.

## The gap

MemoPop's orchestrator runs against an **outline** — a YAML document that defines
the memo's sections, the guiding questions for each, the vocabulary rules, and the
mode-specific guidance. The outline is the primary configuration surface of the
product. It is what makes a memo an Alpha Partners 7 Cs memo rather than a
12 Ps memo.

**There is no way to edit one without a text editor and repo access.**

`memopop-native` already ships outline UI — `OutlineGallery.svelte`,
`OutlineCard.svelte`, `OutlineDetail.svelte`, backed by
`src/lib/stores/outlines.svelte.ts`. All of it is **read-only**. `OutlineDetail`
is 422 lines and its only interactive controls are Close, Cancel, and
"try on company." There is no input, no textarea, no drag handle, no save path.

So a user can browse the outline catalogue and pick one. They cannot:

- reorder sections
- edit a section's guiding questions
- add or remove a section
- fork a stock outline into a firm-specific variant
- see what actually differs between a stock outline and their customized one

Every one of those is currently a Claude-Code-and-a-YAML-file operation. That
makes the operator the only person who can configure the product, which is the
thing this spec exists to fix.

## What the editor has to respect

From `apps/memopop-orchestrator/src/schemas/outline_schema.py` and the outlines
under `apps/memopop-orchestrator/templates/outlines/` and
`apps/memopop-orchestrator/io/<client>/templates/outlines/`:

- **`metadata`** — `outline_type` (`direct_investment` | `fund_commitment`),
  `version`, `description`, `compatible_modes`, and optionally `firm` and
  `extends`. **`extends` is the inheritance hook**: a custom outline names a base
  outline by path. Any editor that flattens an inherited outline on save destroys
  that relationship.
- **`vocabulary`** — categorised `preferred` / `avoid` term lists, each term
  carrying `first_use` / `subsequent` / `definition` / `usage` / `instead` /
  `reason`. This is a substantial nested structure and is **global across
  sections**, with per-section overrides.
- **Sections** — each with guiding questions and per-mode guidance
  (`ModeSpecificGuidance`: `emphasis`, `recommendation_options`, `tone`,
  `required_elements`, `required_analysis`, `guiding_questions_add`,
  `rationale_focus`).
- **`compatible_modes`** gates which outlines are offered for a given run
  (`consider`, `justify`, …). Editing sections without re-checking mode
  compatibility can produce an outline the orchestrator will refuse.

The YAML also carries **comments that are load-bearing for humans** — the
Alpha Partners outline opens with three comment lines explaining the framework,
and `notes:` blocks carry multi-paragraph rationale. A naive
parse-edit-serialize round-trip strips comments and reorders keys. This is the
same failure the `context-vigilance` frontmatter spec warns about for frontmatter,
and it applies here with more force because these files are hand-authored and
long-lived.

## Open questions — answer before building

1. **Who owns the edited outline?** A user-edited outline is per-firm data, but
   stock outlines are shipped assets under `templates/outlines/`. Does editing
   fork into `io/<client>/templates/outlines/`, or into a database?
2. **Where does it persist?** The orchestrator reads YAML off disk via
   `outline_loader.py`. A native-app editor writing to a server-side file is a
   very different architecture from one writing to a store the orchestrator then
   reads. **This is the decision the rest of the spec hangs on.**
3. **Does `extends` survive editing?** Forking a base outline and editing three
   sections should stay a diff against the base, not a full copy — otherwise
   improvements to the stock outline never reach the customized one.
4. **Comment and key-order preservation.** Round-trip via `ruamel.yaml` rather
   than `pyyaml` if the file stays the source of truth.
5. **Validation on save.** `tools/validate_outlines.py` exists. It should run
   before an edited outline is accepted, and its errors need a UI.
6. **Reordering semantics.** Are section numbers meaningful (the generated output
   uses `01-executive-summary.md`-style names) or purely positional? Reordering
   must not orphan already-generated section files for in-flight deals.

## Prior art in the tree

- `apps/memopop-orchestrator/src/outline_loader.py` — how outlines are read today
- `apps/memopop-orchestrator/src/schemas/outline_schema.py` — the dataclass
  contract any editor must satisfy
- `apps/memopop-orchestrator/tools/validate_outlines.py` — existing validation,
  reusable as a save gate
- `apps/memopop-orchestrator/io/alpha-jwc/templates/outlines/alpha-jwc-7Cs-customized.yaml`
  — a real customized outline; the shape the editor must be able to produce
- `apps/memopop-native/src/lib/components/OutlineDetail.svelte` — the read-only
  surface an editor would extend (422 lines; controls are Close, Cancel, and
  "try on company" — nothing that writes)

## Related

- [[Multi-Agent-Orchestration-for-Investment-Memo-Generation]]
- [[Generate-DD-Questions-&-Checklist]] — another output-shape request from the
  same class of user, and likely a sibling of this one

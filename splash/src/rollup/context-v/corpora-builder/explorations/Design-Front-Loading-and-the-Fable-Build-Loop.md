---
title: "Design Front-Loading and the Fable Build Loop"
lede: "If frontier models can now carry complex builds end-to-end, the leverage moves to the documents. Can we front-load design so hard that the whole system gets built in a TDD loop — and impose design-system discipline from commit one?"
date_created: 2026-07-20
date_modified: 2026-07-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
semantic_version: 0.0.0.1
tags:
  - Exploration
  - Build-Method
  - Spec-Driven-Development
  - Design-System
  - Context-Vigilance
status: Open
from: "corpora-builder"
from_path: "context-v/explorations/Design-Front-Loading-and-the-Fable-Build-Loop.md"
---
# Design Front-Loading and the Fable Build Loop

## The question

Two method questions, forked out of [[Corpora-Builder-System-Design]] so that doc stays about the system:

1. **The build loop.** Given how far frontier models have come on complex, long-horizon tasks (Fable-class; Kimi-class models drawing similar reviews), can we front-load enough system design and documentation that a model builds *the whole of corpora-builder* in a spec-driven TDD loop — red/green per task, looping until the system is done — rather than the session-by-session, human-paced rhythm every ai-labs project has used so far? And if so, what manages the loop: OpenSpec, Spec Kit, our own context-v conventions, or a hybrid?
2. **Design-system strictness.** Most ai-labs projects have ignored the Lossless design-system practice — concurrently maintaining brand guidelines, a component library, and a design system that is more or less a reflection of actual code. The UIs of augment-it, dididecks, and memopop have all diverged and are probably messy if not total chaos. Can corpora-builder be strict about this from day one, and become the reference the sibling design systems converge toward?

## Why we don't already know

Context-vigilance already pairs specs with prompts, and the pseudomonorepos lifecycle already says "Start" means writing the spec first. But in practice the loop has always had a human in the driver's seat every session: the spec informs the prompt, the prompt runs, a person evaluates, repeat. We have **never** run a front-loaded, mostly-autonomous build where the documents are complete enough that the model's loop is *verification-bound* (tests pass? spec satisfied?) rather than *instruction-bound* (waiting for the next prompt). Whether our docs can carry that weight — and where the human gates belong — is genuinely untested.

On the design-system side, the tools all exist in the skills tree (`maintain-design-md`, `theme-system`, the component conventions) — what's missing is evidence that imposing them *before* UI code exists produces convergence rather than ceremony.

## Options — what manages the loop

### Option A — GitHub Spec Kit (in-tree prior art)

[Spec Kit](https://github.com/github/spec-kit) is already installed in augment-it as the `speckit-*` skill family (`speckit-specify` → `speckit-plan` → `speckit-tasks` → `speckit-implement`, plus `speckit-constitution`, `speckit-analyze`, `speckit-clarify`). Its process: constitution → spec → plan → dependency-ordered tasks, each small enough to implement and test in isolation — explicitly "like TDD for your AI agent".

**Pros:** already in the tree, so adoption is a copy not a leap; the constitution concept maps well onto our reminders/blueprints; task decomposition is the part context-v lacks.
**Cons:** heavier ceremony; its artifacts (`spec.md`, `plan.md`, `tasks.md`) are a parallel documentation universe that will drift from `context-v/` unless we deliberately bridge them.

### Option B — OpenSpec (Fission-AI)

[OpenSpec](https://github.com/Fission-AI/openspec) is a lighter spec-driven-development tool for coding agents: agent-agnostic markdown, change-proposal-shaped deltas, spec state the agent can read across every repo.

**Pros:** lighter than Spec Kit; the change-delta shape suits a long-lived system better than one-shot feature specs; markdown-native, so closer to context-v's grain.
**Cons:** no in-tree experience; younger tool; same drift risk against `context-v/`.

### Option C — context-v native

Use only our own conventions: specs + prompts in `context-v/`, the `verify` skill as the green gate, `/loop` (or workflows/ultracode fan-out) as the harness, changelog entries as the progress trail.

**Pros:** zero new vocabulary; everything publishes to the splash/web like all our other work; the loop artifacts *are* the documentation.
**Cons:** context-v has no machine-checkable task state — "which tasks remain" lives in prose, and prose is what today's loops silently lose track of. This is exactly the "in ways we have not yet" gap: we'd be building our own task ledger.

### Option D — Hybrid (context-v as the human/publishing layer, SDD tool as the loop ledger)

`context-v/` keeps what it's good at — the why, the explorations, the blueprints, the publishable narrative — and the SDD tool (A or B) owns the machine layer: task decomposition, completion state, the loop's stopping condition. Cross-linked both ways; the constitution/spec files cite `[[context-v]]` docs as their source of intent.

## The loop shape (whatever tool wins)

1. **Front-load** — the six artifacts listed in [[Corpora-Builder-System-Design]] (domain-model spec, lifecycle blueprint, quality-scan tool spec, sync/checkpoint UX spec, tenancy tiers, didi.sh primitives), plus `DESIGN.md` and schema/contract files, plus a **test plan per spec section**. Human-paced, sign-off gated. This is most of the calendar time, deliberately.
2. **Decompose** — generate the dependency-ordered task ledger from the specs.
3. **Loop** — per task: write the failing test, implement to green, run the full suite, verify against the spec, mark the ledger, next task. Loop-until-dry, with fan-out (workflows/ultracode) where tasks are independent.
4. **Gate** — humans re-enter at spec amendments, at design-review checkpoints, and at anything user-facing. Same philosophy as the corpus itself: gate the enrichment steps; autonomy between gates, never across them.

## Design-system discipline (the strict version)

- **`DESIGN.md` exists before the first component** — authored per `maintain-design-md` (Stitch spec), tokens locked, imagery recipe included.
- **Two-tier tokens, three-mode contract** from `theme-system`, from day one — no "we'll tokenize later".
- **The component library is a reflection of actual code**: every shipped component appears in a living inventory page (the splash is a natural host), and drift between DESIGN.md and runtime CSS is treated as a bug, not a backlog item.
- **Convergence thesis:** the three sibling apps' design systems should converge over time. corpora-builder doesn't export a package to them (the no-shared-dependency rule stands); it becomes the *cleanest reference*, and convergence travels knots-style — blueprint + copy-from — exactly like every other pattern in this tree.
- The build loop enforces this mechanically: UI tasks in the ledger cite DESIGN.md tokens by name, and the verify step checks rendered output against the modes.

## Tentative direction

Pilot **Option D with Spec Kit as the ledger** (in-tree prior art beats novelty; swap to OpenSpec only if Spec Kit's ceremony fights us), on corpora-builder's first runnable artifact — the generalized quality-scan tool — as a low-stakes rehearsal before the loop runs against the whole system. Front-load first regardless: no loop starts until the six artifacts and DESIGN.md are signed off.

## Outcome

Open. Ends when the rehearsal loop (quality-scan tool) has run and we've decided the tool, the gates, and whether the whole-system loop is a go.

## Related

- [[Corpora-Builder-System-Design]] — the system this method builds
- [[Source-Curation-Gate]] — the gate philosophy this loop borrows (autonomy between gates, never across them)
- augment-it's `speckit-*` skill family — in-tree Spec Kit prior art
- `maintain-design-md`, `theme-system` skills — the design-system machinery being imposed

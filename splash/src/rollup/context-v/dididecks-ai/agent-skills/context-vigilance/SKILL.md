---
name: context-vigilance
description: Lossless Group's framework for managing context-v/ directories in any project. Use whenever creating, updating, or organizing files in any context-v/ folder (specs, prompts, blueprints, reminders, explorations, issues), or when the user asks about context engineering, AI co-development workflow, or the "context-v" convention. Enforces directory roles, the four-part epoch.major.minor.patch versioning, YAML frontmatter standard, wikilink cross-references, and the prep/reflective/journey cognitive modes.
from: "dididecks-ai"
from_path: "context-v/agent-skills/context-vigilance/SKILL.md"
---
# Context Vigilance

A framework for Human + AI collaboration: **manage the context available to AI and collaborators with the same rigor you manage code.** Every Lossless project has a `context-v/` directory with (commonly) six subdirectories, organized into three cognitive modes: **Prep, Reflective, and Journey**.

**Norms, not rules.** Patterns here are loosely enforced. The team is generative-first; consistency emerges when attention focuses on a project, file, or pattern. Be generous reading existing files (they may pre-date current norms or be experiments) and careful writing new ones. See `references/philosophy.md` for the deeper rationale.

**Drift policy:** When you encounter inconsistencies (mismatched frontmatter, deviating filenames, partial-convention adoption), **observe, note, surface, but do not auto-fix as a side effect of unrelated work.** Cleanup happens only with explicit user permission. The user runs parallel agent sessions; silent normalization creates conflicts. (This rule lives globally in `~/.pi/agent/AGENTS.md`; restated here for redundancy.)

Reference: <https://www.lossless.group/projects/gallery/context-vigilance>

## When to use this skill

- The user asks you to create or edit any file under a `context-v/` directory
- The user mentions specs, prompts, blueprints, reminders, explorations, or issues in the Lossless sense
- Starting a new project and setting up `context-v/`
- The user asks about context engineering, AI co-development, or "the context-v thing"

## The Six Directories

### Prep Mode (paired: spec ↔ prompt)

The work of deciding what to build *is* the work — "prep" here is not "minor pre-work", it's the deliberate forward construction phase. Specs and prompts are the artifacts.

- **`context-v/specs/`** — Living specifications. What you're building and why. Constantly updated. Single source of truth. Every prompt references a spec.
- **`context-v/prompts/`** — Step-by-step, prompt-by-prompt implementation documents (NOT single chat messages). Each prompt references specs/blueprints/reminders. Success at each step is verifiable before moving on.

> A prompt without a spec is a vibe. A prompt within a spec is engineering.

### Reflective Mode (paired: blueprint ↔ reminder)

- **`context-v/blueprints/`** — Codified patterns, architecture decisions, proprietary thinking. Institutional knowledge AI needs to respect the system (e.g., "how our extended markdown flavor works", component organization, naming rationale).
- **`context-v/reminders/`** — Short, sharp corrections born from repeated AI mistakes (e.g., "We don't use React. Astro + Svelte for interactivity. Do not hard-validate frontmatter."). Battle scars turned into guardrails.

### Journey Mode (unpaired)

- **`context-v/explorations/`** — Documents where the destination is unclear. Research, prototype tradeoffs, option-space mapping, thinking out loud with AI as partner. Ends when you've learned enough to write a spec — or decided you don't need one.
- **`context-v/issues/`** — Issue-resolution journey logs. The painful, winding path through debugging. Capture so no human or AI has to retrace it.

### When you find a seventh folder

The six are convention, not a closed set. Experimentation is normal — you'll encounter folders that don't match the six (e.g., `notes/`, `decisions/`, `changelog/`, `plans/`, `research/`). When that happens:

1. **Don't fight it.** Read what's there.
2. **Identify the cognitive mode** (planning / reflection / journey / something new).
3. **Discuss with the user** whether the folder should be assimilated (promoted to a new convention), folded (contents moved into one of the six), or kept as project-specific.
4. **Default to keeping it** if unsure. Re-organizing someone's mental model mid-session is rude.

## Conventional Frontmatter

Frontmatter in `context-v/` is **scattered in practice** — some files have lots of properties, some have very few. When creating new files, lead with this baseline:

```yaml
---
title: "Human-readable title"
date_created: YYYY-MM-DD
date_modified: YYYY-MM-DD
authors:
  - Author Name
semantic_version: 0.0.0.1
tags:
  - Relevant-Tag
  - Another-Tag
---
```

When editing existing files, **respect what's there**. Don't add fields the file didn't have unless they're genuinely useful. Don't remove fields you don't recognize.

Key conventions (full details in `references/frontmatter-spec.md`):

- **All property names are `snake_case`** — enforced by Obsidian's frontmatter rendering. Never camelCase or kebab-case keys.
- Update `date_modified` whenever you edit the file
- `semantic_version` is **four-part `epoch.major.minor.patch`** — see `references/versioning.md`
- `authors` is **humans only**, always a list. AI agents are tracked separately under `augmented_with` (format: `Pi on Claude Sonnet 4.5`). See `references/frontmatter-spec.md`.
- `tags` use **Train-Case** values (e.g., `Markdown-Rendering`, `Issue-Resolution`) — Obsidian convention
- `status` uses **Train-Case** values too — it's a display string, not a machine enum
- `lede` (or `description`) is optional on any doc-type — a one-sentence newsroom hook for preview cards / OG snippets / list views

## Status discipline

The `status:` field is the load-bearing signal of where a document sits in its lifecycle. A directory full of `status: Draft` plans, half of which actually shipped, is a directory you can't trust. **Status reflects reality** — promote it as work lands.

Canonical values (Train-Case display strings, not machine enums):

`Draft` → `In-Review` → `Signed-Off` → `Implementing` → `Shipped` · `Partially-Shipped` · `Deferred` · `Stale` · `Superseded` · `Archived`

Companion fields that must move with status:

- **`Shipped`** — set `date_first_published: YYYY-MM-DD`; optionally `post_ship_note:` for things learned after ship.
- **`Partially-Shipped`** — set `date_first_published:` for the first shipped slice; append a `## Remaining work (as of YYYY-MM-DD)` section enumerating what's done and what's left.
- **`Deferred`** — set `deferral_note:` explaining the named reason.
- **`Superseded`** — set `superseded_by: [[Successor-Doc]]`.

In every case, bump `date_last_updated` (or `date_modified`) on the same edit. Status changes are meaningful edits.

**When to update:** when you ship a substantial portion, defer explicitly, supersede, or notice the field doesn't match reality during a sweep.

**When NOT to update:** mid-session as a side effect of unrelated work (drift policy — surface, don't silently normalize); for docs authored by someone else whose ship state you're not sure about (ask first); as a way to "tidy up" without a real ship event to point at.

Full reference: `references/status-discipline.md`. The periodic sweep procedure: `lossless-monorepo/context-v/habits/Maintain-Status-Discipline-Across-Context-V-Files.md`.

## Cross-references

Cross-referencing is how humans and agents focus on a limited scope at any moment — **humans have context windows too.** Three styles, all valid:

1. **Obsidian-style backlinks (preferred):** `[[path/to/Filename.md]]` or `[[Filename]]`
2. **Standard Markdown links:** `[link text](../specs/Some-Spec.md)`
3. **Backtick paths:** `` `context-v/specs/Some-Spec.md` `` for references the reader isn't expected to click

Use whichever serves the reader. Backlinks are preferred because most `context-v/` directories are symlinked into Obsidian vaults, where `[[wikilinks]]` unlock graph view, autocomplete, and backlink panes.

Common linking patterns:

- prompts → link the spec they implement
- reminders → link the blueprint that explains the pattern
- explorations & issues → link whatever they relate to

## Audience: User + Agent + Reader

Almost everything in `context-v/` is destined for public web publishing through one of the Lossless [Astro Knots](https://www.lossless.group/projects/gallery/astro-knots) sites. So every document balances three audiences:

1. **The User** writing or editing it
2. **The Agent** that will load it as context in some future session
3. **The Reader** who lands on it on the web with no prior context

Practical implications:

- **Lead with marketing. Lead with why. Lead with something anyone can understand.** Get into technical detail deeper in the doc.
- **The first paragraph should be readable by an outsider.** The rest can be specialized.
- **Fork early; don't wait for "too long."** Long-context-window models (Opus 4.7 with 1M tokens, etc.) can technically ingest huge documents — but **creativity, cross-referencing, and human-agent cooperation all degrade as a single doc grows**, regardless of what the model can accept. The trigger to split is *anxiety about length*, not a word count: when you (or the user) notice you're scrolling past sections to reach the one that matters, that's the cue. The practice is **fork-and-cross-reference**, not "split when forced." Pre-emptively factor self-contained sub-systems into sibling specs, reusable patterns into blueprints, and specific debugging journeys into issues — each linked from the parent. The parent doc keeps the *map*; the children carry the *detail*. See `references/philosophy.md` for the longer rationale.
- **Common split shapes when forking:** marketing/why stays at the top (or its own short doc), pattern/architecture → blueprint, thing-being-built → spec, how-to-build-it → prompt. Whatever fits.

## Filename conventions

Use **Train-Case** for filenames: `Train-Case.md`. Same convention as tags. Matches existing examples like `When-Claud-Code-and-When-Pi.md`, `Migrating-Study-to-its-own-Pseudomonrepo.md`.

## Decision tree: which folder?

- Defining what to build, with criteria & scope? → **specs/**
- Step-by-step implementation plan referencing a spec? → **prompts/**
- Capturing how/why a system is designed (pattern, architecture)? → **blueprints/**
- Short correction the AI keeps needing? → **reminders/**
- Don't know the answer yet, need to research/weigh options? → **explorations/**
- Debugging a specific painful problem and capturing the path? → **issues/**

When in doubt, see `references/doc-type-guide.md`.

## Templates

When creating a new file, start from the matching template in `templates/`:

- `templates/spec.md`
- `templates/prompt.md`
- `templates/blueprint.md`
- `templates/reminder.md`
- `templates/exploration.md`
- `templates/issue.md`

## Typical flow for a `context-v/` task

Not a checklist — a default rhythm. Adjust to the situation.

1. **Locate the project's `context-v/`.** Walk up from cwd if needed. Some repos have multiple (e.g., one per sub-project).
2. **Survey what's there.** Look at sibling files for tone, depth, and frontmatter conventions. Match them.
3. **Pick the folder** using the decision tree. If nothing fits, see *When you find a seventh folder* above.
4. **Copy the matching template** from `templates/` if helpful, or write from scratch matching nearby files.
5. **Frontmatter:** today's date for both `date_created` and `date_modified`. Start at `0.0.0.1`. Add the user as author. If you (an AI) contributed materially, add yourself under `augmented_with` (e.g., `Pi on Claude Sonnet 4.5`) — not under `authors`.
6. **Lead with the why.** First paragraph readable by an outsider.
7. **Cross-link** to related docs using `[[wikilinks]]`.
8. **Filename & tags:** Train-Case (`My-New-Doc.md`, tags like `- New-Pattern`).
9. **When editing an existing doc:** bump `semantic_version` per `references/versioning.md` and update `date_modified`. Respect existing frontmatter shape.
10. **If the doc is ballooning, propose a split** before continuing. Better two clean docs than one bloated one.

## Developing a spec (the rich case)

Specs have more rhythm than the other doc-types: stub-first, discuss-then-write, handle stale prior art without hijacking the primary dialog, sign-off gate before implementation, narrative pass *after* sign-off, and pair with prompts for chunked execution. The full rhythm lives in `references/developing-a-spec.md` — load it whenever you're initiating or developing a spec with the user.

## The philosophy (tl;dr)

- AI doesn't learn between sessions → externalize memory as loadable docs
- Context windows have limits (humans too) → modular docs designed for selective loading and cross-linking
- Specs align everyone again, better → AI makes specs cheap to write and cheaper to keep current
- We publish in public → docs serve users, agents, and outside readers simultaneously
- Norms over rules → generative first, consistency emerges with attention

For the deeper version, see `references/philosophy.md`.

---
type: Specs
title: "Survey: a Scoped Dashboard of context-v"
lede: "One command turns every context-v/ folder in scope into a dashboard, a task list, and a map, the way graphify turns code into a graph."
description: "Spec for /cv:survey: scope resolution across a tree of repos, a deterministic scanner, and a three-mode HTML view plus an agent-readable report."
summary: "Product spec (VP Product voice) for a scan-then-render command that builds a dashboard, task list, and global map over the context-v/ folders in a chosen scope (one repo, a subtree, a lineage, or a whole tree). Read before building or changing the survey scripts; spikes live in agent-skills/survey/ and are compared in the Spikes section."
publish: true
date_created: 2026-10-28
date_modified: 2026-10-28
date_authored_initial_draft: 2026-10-28
date_authored_current_draft: 2026-10-28
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.2.0
status: Draft
tags:
  - Context-Vigilance
  - Dashboards
  - Pseudomonorepos
  - Agent-Skills
  - Three-Mode-Theming
site_uuid: 18a720d6-a5d8-4a3f-ae8c-d6ca8cc6aa17
hex_code: 3joaat
from: "context-vigilance-kit"
from_path: "context-v/specs/Survey-a-Scoped-Dashboard-of-Context-V.md"
---
# Survey: a Scoped Dashboard of context-v

## Why Care?

A `context-v/` folder is easy to write into and hard to see. One repo with thirty docs is fine. A tree of repos, each with its own `context-v/`, is not: our own tree has 93 of them holding about 2,200 docs, and nobody (human or agent) can answer *"what's in flight, what's stuck, what did we promise and never close"* without opening files one by one.

Graphify answers *"what is this codebase"* with one command and a file you open. Archify answers *"how does this system flow"* the same way. **Survey** answers *"what is the state of our context"*: run it, and get a dashboard, a task list, and a map of every `context-v/` in the scope you asked for.

The scope is the point. Inside one repo it's a status page for that project. At the root of a tree it's a portfolio view across every child. In between, it can follow just the repos relevant to today's work.

## Role and voice

Written as **VP Product**: what it is, who it's for, what done looks like. Engineering choices appear only where they constrain the product (zero dependencies, privacy). The **Spikes** section at the end is written as VP Engineering and compares the first attempts.

## Who it's for

1. **The operator** at the start of a week or a session: "what's open across everything I own?"
2. **An agent** at `/cv:kickoff`: a cheap, structured read of the scope before choosing what to load. The agent reads the report, not the HTML.
3. **A collaborator** handed one repo: "what's the state of this project's thinking?"

## The jobs it does

Added 2026-10-28, after the first spikes, from the operator:

1. **Status:** what's in flight, open, stuck, and done, at the chosen scope.
2. **Cleanup:** find messy metadata and stubs, then delete, complete, or close them on purpose. Signals: `empty` (under 40 words of prose), maturity by content lines (`stub` under 100, `worked-on` from 500, the same cut as the corpus manifest), `maybe_done` (every checkbox ticked, status still open), stale open docs, missing or mismatched frontmatter, and unmapped statuses. The survey lists candidates; a separate, deliberate pass edits them.
3. **Think like a CTO:** *who is making progress quickly*, and *which specs and issues are in my option set to assign*.
   - **Momentum** comes from one `git log` per repo over a 90-day window: commits in 7 and 30 days, agent-assisted share (from `Co-Authored-By` trailers), commits touching `context-v/`, docs added, docs closed. A repo counts as the operator's when the operator (`git config user.name`) committed there in 30 days; forks and pinned upstream repos are listed separately so their authors don't inflate "who's moving."
   - **Option set:** *ready to assign* (Signed-Off, Ready, Approved), *needs a decision* (In-Review, Proposed), *open issues*, and *stalled in flight* (in flight but untouched for 30 days, or in a quiet repo). Ranked by readiness: acceptance criteria present, maturity, recent change, repo momentum, minus stale.

## What it produces

One run, one output folder, three things in it:

| Output | For | Shape |
|---|---|---|
| `survey.json` | tools, future runs, diffing | Every doc in scope with path, repo, folder, type, title, lede, status (raw and normalized), dates, open-checkbox count, health flags |
| `SURVEY.md` | agents (and terminals) | The same picture in a few hundred lines: counts, in-flight work, open tasks, drift. Modeled on graphify's `GRAPH_REPORT.md` |
| `survey.html` | humans | A single self-contained page (no network, no build step) with three views and three modes |

### The three views

1. **Dashboard.** Counts by repo × lifecycle bucket and by folder. Freshness (what moved this week, what hasn't moved in 90 days). Health: missing frontmatter, missing `type`, missing lede, statuses that don't map to the canon.
2. **Task list.** The actionable slice: specs and plans that are `Signed-Off` or `Implementing`, issues still open, the newest handoff per repo, and unchecked `- [ ]` items inside plans, prompts, and handoffs, each linked to its file and line.
3. **Map.** The tree itself: repos nested as they sit on disk, each showing its `context-v/` folders and a status mix, so you can see where the thinking is dense, where it's thin, and where it's stale.

### The three modes (hard rule)

Every survey page ships **light, dark, and vibrant** modes, per the `theme-system` contract used by every Astro Knots site and splash: `data-mode` on `<html>`, a pre-paint script so there is no flash, a labeled three-button toggle, and the choice remembered per viewer. Tier 1 named tokens plus Tier 2 semantic tokens per mode. The default palette borrows the kit splash's (amber, sodium, lime on ink); a repo with a `DESIGN.md` or `theme.css` may later supply its own.

## Scopes

Scope is resolved from where you run it plus one flag. A **repo** is any directory with a `.git` entry (a folder for a clone, a file for a submodule). Each `context-v/` belongs to the nearest repo above it.

| Scope | Flag | What's included | Typical use |
|---|---|---|---|
| **Repo** | `--scope repo` | This repo's `context-v/` folders only; child repos excluded | Status page for one project |
| **Tree** | `--scope tree` (default at a repo with child repos) | This repo and every repo below it | Portfolio view; at the anchor root it's the **global view** |
| **Lineage** | `--scope lineage` | This repo and every ancestor repo up to the top | "What did the parents decide that governs me?" |
| **Pick** | `--repos a,b,c` | Named repos (paths or names), each scanned as `repo` | The handful relevant to today's task |

`context-v-corpus` is the natural home of the global view: a tree scan from the anchor root, run there.

**Always skipped:** `node_modules/`, `dist/`, `.git/`, every `context-v/extra/` (scratch, private by convention), the corpus's collated copies (`context-v-corpus/corpus/`), and anything listed in a `.surveyignore` at the scope root. Upstream study repos (read-only `studies/` mounts) are skipped by default because they aren't ours; `--include-studies` brings them in.

## Status normalization

Status in the wild is messy. A sample of `ai-labs/` alone: `Draft` 334, `Shipped` 89, `Active` 81, `Open` 57, `shipped` 51, `Resolved` 23, `Open · Jotted` 16, `Reference` 11, `Proven-Once` 6, and a long tail. The survey keeps the raw value and adds a **lifecycle bucket**:

| Bucket | Raw values (case-insensitive, first word wins) |
|---|---|
| **Open** | Draft, Proposed, Open, In-Review, Jotted, Idea, Stub |
| **In flight** | Signed-Off, Ready, Implementing, In-Progress, Active |
| **Done** | Shipped, Partially-Shipped (flagged partial), Resolved, Decided, Complete |
| **Parked** | Deferred, Stale, Blocked, Untested |
| **Closed** | Superseded, Archived |
| **Reference** | Reference, As-observed-*, Proven-Once, Living |
| **Unmapped** | anything else, listed verbatim in the health panel |
| **None** | no `status:` key |

The survey **never edits a doc.** Per the drift policy, it surfaces (unmapped statuses, missing keys, `Draft` untouched for 90+ days) and leaves fixing to a deliberate pass.

## Command and skill shape

- **Skill:** `agent-skills/survey/` with `SKILL.md` and `scripts/`. Ships in the `cv` plugin as `/cv:survey`; any Agent Skills tool gets it as "the survey skill."
- **Two stages, like graphify:** `scan.py` (deterministic, no judgment) writes `survey.json`; `render.py` writes `SURVEY.md` and `survey.html` from it. Re-rendering never rescans.
- **The agent's part:** pick the scope (ask if it's unclear), run the scripts, read `SURVEY.md`, and reply with the three or four things that most need attention. The agent adds judgment; the scripts add none.
- **Output location:** `context-v/extra/survey/` in the scope root by default. That folder is already gitignored by the practice, so a survey of private work never lands in a commit by accident. `--out` overrides.
- **Where our own views live (2026-10-28):** the code stays in this kit; the views of the Lossless tree live in `context-v-corpus`, built by its `scripts/refresh-survey.sh` into `survey/views/<scope>/` and copied into the corpus splash (`splash/public/survey/`). The kit's splash carries copies as examples (`splash/public/examples/survey/`), on its `/survey/` page.
- **`--public`** drops docs marked `publish: false` or `private: true`, repos under `client-sites/` or `collaborations/`, and absolute paths, for a survey meant for a public page. Optional; our own views don't use it.

## Hard constraints

1. **Python 3 standard library only.** PyYAML is used when present, with the same top-level-key fallback the frontmatter hook uses. No `pip install` to get a dashboard.
2. **The HTML is one file.** Inline CSS, inline JS, inline data. Opens from disk, works offline, can be attached or published as-is.
3. **Read-only.** Never writes outside the output folder.
4. **Fast enough to run casually:** a full tree scan of ~2,500 docs under 5 seconds. Dates come from frontmatter, falling back to file mtime; no per-file `git log`.
5. **Private by default.** Outputs land in a gitignored folder. Nothing generated from real project content is committed to this kit.

## Acceptance criteria

- [ ] `/cv:survey` in a single repo with no children produces all three outputs for that repo alone.
- [ ] At the anchor root with `--scope tree`, every `context-v/` in the tree except skipped paths appears, attributed to the right repo.
- [ ] `--scope lineage` from a leaf lists the leaf and each ancestor, nothing else.
- [ ] Every doc with a `status:` lands in exactly one bucket; unmapped values are listed verbatim with counts.
- [ ] The task list shows unchecked `- [ ]` items with file and line, and each links to the file.
- [ ] The HTML toggles light, dark, and vibrant with no flash on load, and remembers the choice.
- [ ] The HTML renders with JavaScript disabled enough to read the dashboard (counts are server-rendered into the markup).
- [ ] `SURVEY.md` for the full tree fits in under 600 lines.
- [ ] The scan of the whole Lossless tree finishes in under 5 seconds on a laptop without git (`--no-git`), and under 10 with it.

## Open questions

- **Name.** `survey` (verb and noun, already the word the context-vigilance skill uses for "look at what's there"). Alternatives: `lookout`, `vista`, `overview`. Decide before it ships.
- **Is "Active" in flight or reference?** In this tree it's used both ways (blueprints that are current, plans being worked). First pass: in flight for specs, plans, prompts, issues; reference for blueprints, reminders, habits.
- **Diffs.** Comparing two `survey.json` files ("what moved since last Monday") is the obvious second feature. Out of scope for v1, but the JSON should carry a `generated_at` and stable doc IDs (`site_uuid`, else path) so it's possible.
- **Publishing.** The corpus could publish its global survey to its splash. That needs the `publish:` and private-file filters the roll-up already applies. Later.
- **GitHub tasks.** The `gh-cli-projects-tasks-conventions` skill links tasks to context-v docs; a later version could join open GitHub items to the docs they point at.

## Spikes (VP Engineering)

One shared scanner, three throwaway renderers, each trying a different answer to "what should the first screen be?" All three honor the three-mode rule. Code: `agent-skills/survey/scripts/` (`scan.py` is meant to survive; the `spike_*.py` renderers are meant to be compared, then merged or thrown out). No `SKILL.md` yet, so nothing is discoverable as a skill until this spec is signed off.

- **Spike A, Ledger:** dense, table-first dashboard. Repo × bucket matrix, sortable doc table, health panel.
- **Spike B, Board:** task-first. Kanban columns by lifecycle bucket, plus the open-checkbox list, filtered by repo.
- **Spike C, Map:** tree-first. Nested repos as a collapsible map with status-mix bars and freshness heat.

### Findings, round one (2026-10-28)

All three were run against four real scopes (this kit alone, `ai-labs` as a tree, the kit's lineage, and the whole Lossless tree) and checked in all three modes with headless-Chrome screenshots.

**The scanner earned its keep first.** The first whole-tree run reported 1,651 docs. 619 of those were copies: splash roll-ups at `splash/src/rollup/context-v/<child>/` that mirror child repos' docs into the parent. All three renderers surfaced it as "folders named after repos." The scanner now skips `rollup/` directories and any `context-v/` under a `src/` segment. Real count: **1,032 docs in 50 repos with a `context-v/`** (105 repos scanned), in 2.2s. `ai-labs` on its own dropped from 522 to 56.

| Spike | Best at | Weak at | Page size (whole tree) |
|---|---|---|---|
| **A, Ledger** | "Where is the open work piled up?" The repo × lifecycle matrix reads in one glance and every cell clicks through to the doc table | One-row matrix at repo scope; the health panel is swamped by `no_type` (most docs predate the OKF `type` rule) | 1.0 MB |
| **B, Board** | "What should I work on?" The In-flight column (85 items, newest first, with checkbox counts) is the most useful single thing any spike produced | At tree scope, Open (461) is mostly hygiene, not work; client-site `narratives/` drafts crowd it | 0.6 MB |
| **C, Map** | Finding things across 105 repos: nested tree, status-mix bars, search that opens a match's parents | You have to drill to learn what's in flight; the freshness strip is mostly grey because most dates are old | 0.6 MB |

**Recommendation (VP Eng):** one page, three tabs, built by one `render.py`, with the **default tab chosen by scope**: Board for `repo`, `lineage`, and `pick`; Ledger for `tree`. Map is always the second tab, with its heat grid capped to the top 20 repos. Keep Board's In-flight column and checkbox rail, Ledger's matrix and click-through table, Map's tree and search; drop the rest.

**Before merging, settle these** (each spike answered them differently):

1. **One definition per metric.** "Open tasks" came out as 811 (checkboxes in task folders) in Ledger and Board and 1,406 (every folder) in Map. The spec's definition wins: task folders only.
2. **One bucket palette.** The spikes gave "open" and "in flight" different colors. Bucket colors become Tier 2 tokens, defined once per mode.
3. **Health ranks actionable flags first.** `unmapped_status`, `yaml_error`, and `stale` before `no_type` and `no_lede`, which collapse into one "pre-OKF" line until the tree is migrated.
4. **Domain folders.** `narratives/` and `slides-content/` (deck workspaces) count as reference, not open work, unless their status says otherwise.
5. **`file://` links** work locally but not from a published page. Fine for v1 (output is local by design); revisit with publishing.
6. **Known scanner gap:** the anchor's `context-v/agent-skills` is itself a submodule, so its skills show as an empty repo. Treat a repo whose root *is* an `agent-skills/` folder as skills.

Spike files (`spike_ledger.py`, `spike_board.py`, `spike_map.py`) stay until the merged `render.py` replaces them.

## Related

- [[Commands-and-Agent-Skills-for-Context-V]]: the full command catalog this joins
- [[Context-V-Is-an-OKF-Profile]]: why every doc has a `type`, which the survey groups by
- `agent-skills/pseudomonorepos/`: the tree shape that scopes are built on
- `theme-system` and `maintain-splash-pages` (Lossless skills): the three-mode contract

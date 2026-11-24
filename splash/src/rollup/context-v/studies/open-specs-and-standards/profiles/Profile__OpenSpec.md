---
title: "OpenSpec — Profile"
name: OpenSpec Profile
slug: open-spec
upstream: https://github.com/Fission-AI/OpenSpec
package: "@fission-ai/openspec"
license: MIT
study: studies/open-specs-and-standards
profile_path: studies/open-specs-and-standards/open-spec
profile_kind: tool
date_created: 2026-05-03
date_modified: 2026-11-23
site_uuid: 56d76ea2-ed67-469a-897b-fd3e6e9b481e
hex_code: f54hn2
date_authored_initial_draft: 2026-05-03
date_authored_current_draft: 2026-11-23
lede: >-
  An LLM should never re-emit a whole spec to change one line, so changes ship
  as `ADDED` / `MODIFIED` / `REMOVED` deltas.
summary: >-
  Profile of OpenSpec as pinned in this study. It is the lightweight pole of the spec-and-workflow
  cluster; read it against the Spec Kit profile, which makes nearly the opposite choice at every
  fork, and the GSD profile, which abandons the spec format entirely for orchestration. Covers the
  parseable `Requirement:` / `Scenario:` heading grammar with RFC 2119 keywords, the delta-spec
  change model and what it buys for brownfield work, the `schema.yaml` artifact DAG the agent
  queries via `openspec status --json`, the specs-versus-changes source-of-truth split, and the
  propose-apply-archive loop (`/opsx:*` commands in 1.x, `openspec-*` skills since 2.0). The upstream repo dogfoods itself, so its own `openspec/` directory is a
  live source of worked examples. Use it as the reference for delta-style spec discipline.
authors:
  - Michael Staton
status: Reference
publish: true
type: Profiles
from: "studies/open-specs-and-standards"
from_path: "context-v/profiles/Profile__OpenSpec.md"
---
# OpenSpec — Profile

A profile of OpenSpec as it lives in this study (`studies/open-specs-and-standards/open-spec/`). Cites pinned paths so you can jump to source rather than trust paraphrase.

## TL;DR

OpenSpec is a **lightweight spec layer that sits between you and your AI coding assistant**. Instead of describing what you want in chat (where it's ephemeral and unverifiable) or in a heavyweight design doc (which the AI can't navigate), you write small, structured markdown files in a known shape. The CLI and a set of agent skills (`/openspec-propose`, `/openspec-apply-change`, … since 2.0; the `/opsx:*` slash commands in 1.x) drive the AI through *create proposal → write delta specs → design → tasks → implement → archive*, and the spec format is engineered so an LLM can locate, read, and update exactly the right slice without re-reading the world.

It is **not** a methodology, a project tool, or a doc site. It is a markdown convention plus a CLI that produces machine-readable status (`openspec status --json`) and machine-readable instructions (`openspec instructions <artifact> --json`) so an agent can self-navigate.

## Why this is better than "just write a normal spec"

A normal spec is a single long markdown file with prose, written once, gone stale by week two, and unreadable by an LLM without loading the whole thing into context. OpenSpec replaces that with four separable improvements:

### 1. Conventions that an LLM can parse deterministically

Specs use a fixed structural grammar — see `docs/concepts.md:80-111`:

```markdown
# Auth Specification
## Purpose
## Requirements
### Requirement: <name>           ← parseable anchor
The system SHALL ...              ← RFC 2119 keyword
#### Scenario: <name>             ← parseable anchor
- GIVEN ... WHEN ... THEN ...     ← Given/When/Then
```

- `### Requirement:` and `#### Scenario:` are stable heading anchors. The CLI and the agent locate units of behavior by heading match, not by fuzzy search.
- RFC 2119 keywords (`MUST`, `SHALL`, `SHOULD`, `MAY`) carry intent in one word — see `concepts.md:131-134`. No "we should probably" ambiguity.
- Scenarios are written in Given/When/Then so they map 1:1 onto tests.

The point isn't ceremony — it's that **the spec is a tree of named, addressable nodes** instead of free prose.

### 2. Data compression: delta specs, not full rewrites

This is the single biggest win for brownfield work. Instead of editing the full `spec.md`, a change ships a *delta* — see `concepts.md:348-408`:

```markdown
# Delta for Auth
## ADDED Requirements
### Requirement: Two-Factor Authentication ...
## MODIFIED Requirements
### Requirement: Session Expiration ...   (Previously: 30 minutes)
## REMOVED Requirements
### Requirement: Remember Me              (Deprecated in favor of 2FA)
```

Three keywords — `ADDED`, `MODIFIED`, `REMOVED` — encode the diff. On archive, OpenSpec merges the delta into the main spec automatically (`concepts.md:392-397`). Two refinements since the previous pin: removing the last requirement of a capability can retire the capability and delete its spec file when the change declares `retire_capabilities: true` (`concepts.md:397`), and 2.1.1 warns when a `MODIFIED` requirement grows past a size threshold.

**What this buys you:**
- The agent never has to re-emit the whole spec to change one line.
- Two changes can touch the same spec file in parallel without conflicting (different requirements).
- Reviewers see *what changed*, not unchanged context.
- The archive (`changes/archive/<date>-<name>/`) preserves the full delta forever — audit trail without bloat in the active spec.

### 3. Navigation: a dependency graph the agent queries

A change is a **folder**, not a document — see `concepts.md:188-215`:

```
openspec/changes/add-dark-mode/
├── proposal.md      # why + scope + approach
├── design.md        # technical approach
├── tasks.md         # implementation checklist
└── specs/ui/spec.md # delta against the main UI spec
```

Each artifact is one file, with one job. A `schema.yaml` declares the dependency DAG between them — `concepts.md:414-435`:

```yaml
artifacts:
  - id: proposal   { requires: [] }
  - id: specs      { requires: [proposal] }
  - id: design     { requires: [proposal] }
  - id: tasks      { requires: [specs, design] }
```

> **DAG = Directed Acyclic Graph.** A set of nodes (here: artifacts) connected by one-way arrows (here: `requires`) where the arrows never form a loop.
>
> - **Directed** — `tasks` requires `specs`, but `specs` does not require `tasks`. Each arrow points one way.
> - **Acyclic** — no cycles. You can't have `A → B → C → A`. Following the arrows always terminates.
>
> Drawn out, the OpenSpec DAG looks like:

```mermaid
flowchart TD
    P([proposal<br/>requires: none])
    S([specs<br/>requires: proposal])
    D([design<br/>requires: proposal])
    T([tasks<br/>requires: specs, design])

    P --> S
    P --> D
    S --> T
    D --> T

    classDef root fill:#d4edda,stroke:#155724,color:#155724
    classDef leaf fill:#cce5ff,stroke:#004085,color:#004085
    class P root
    class T leaf
```

> Why the structure matters: because it's acyclic, OpenSpec can compute a valid order to walk through the artifacts (a *topological sort*). Because it's directed, finishing `proposal` *unlocks* `specs` and `design`, not the other way around. That's how `openspec status --json` correctly labels each node `done`, `ready`, or `blocked`. The same data structure powers build systems (Make, Bazel), task runners (Airflow), package resolvers, and git history.

The agent doesn't guess what to do next. It runs `openspec status --change <name> --json` and gets back which artifacts are `done`, `ready`, or `blocked` — see `docs/opsx.md:501-533`. `openspec status --all` now reports every active change in one call. Then `openspec instructions specs --change <name> --json` returns the template, the dependency paths to read, and what gets unlocked next.

**Dependencies are enablers, not gates** (`concepts.md:458`). You can skip `design.md` if it's a one-line change. You can edit `proposal.md` mid-implementation. The graph tells the agent what's *possible*, not what's *required*.

### 4. Separation: source-of-truth vs. proposed work

`openspec/specs/` is the merged, current truth. `openspec/changes/` is everything in-flight. See the diagram at `concepts.md:31-43`. A beta feature, **Stores**, moves the same `openspec/` shape into a repo of its own so one plan can span several code repos and be shared via `git push` (`README.md:104-116`, `docs/stores-beta/user-guide.md`). This is the same idea as `main` vs. feature branches in git, applied to specs. Each change folder is a unit of review; archive is the merge:

```mermaid
flowchart LR
    subgraph InFlight["openspec/changes/add-2fa/ (in-flight)"]
        direction TB
        Prop[proposal.md]
        Des[design.md]
        Tsk[tasks.md]
        Delta["specs/auth/spec.md<br/><b>ADDED</b> 2FA requirement<br/><b>MODIFIED</b> session timeout<br/><b>REMOVED</b> remember-me"]
    end

    Truth[("openspec/specs/auth/spec.md<br/>source of truth")]
    Archive[("openspec/changes/archive/<br/>YYYY-MM-DD-add-2fa/<br/>audit trail, full context")]

    Delta -->|"archive<br/>merges deltas"| Truth
    InFlight -->|"folder moves<br/>to archive/"| Archive

    classDef truth fill:#d4edda,stroke:#155724,color:#155724
    classDef archive fill:#e2e3e5,stroke:#383d41,color:#383d41
    classDef delta fill:#fff3cd,stroke:#856404,color:#856404
    class Truth truth
    class Archive archive
    class Delta delta
```

The deltas merge into the main spec, the change folder is preserved date-stamped in `changes/archive/`, and `specs/auth/spec.md` now describes the new behavior — ready for the next change to delta against.

## What's actually inside this submodule

Mapping the upstream layout you'll be reading:

| Path | What's there |
|------|--------------|
| `open-spec/README.md` | Pitch, install, Stores (beta), comparisons (vs. Spec Kit, vs. Kiro) |
| `open-spec/docs/concepts.md` | The spine. Read this first. Specs, changes, deltas, schemas, archive |
| `open-spec/docs/getting-started.md` | First-run walkthrough with a worked dark-mode example |
| `open-spec/docs/opsx.md` | The OPSX workflow — fluid actions, schema-driven, agent queries CLI for state |
| `open-spec/docs/commands.md` | Per-command reference (skills since 2.0) |
| `open-spec/docs/how-commands-work.md` | The terminal-versus-chat distinction (still written with `/opsx:*` names) |
| `open-spec/docs/cli.md` | Terminal-side reference (`openspec init`, `status`, `validate`, `view`) |
| `open-spec/docs/customization.md` | How to define your own schema with custom artifacts |
| `open-spec/docs/multi-language.md` | Multi-language support (`openspec init --language`) |
| `open-spec/docs/supported-tools.md` | Supported AI tools and how each invokes the skills |
| `open-spec/docs/stores-beta/` | Stores: planning in its own repo (beta) |
| `open-spec/skills/` | The twelve `openspec-*` skills that 2.0 installs (`openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, …) |
| `open-spec/openspec/specs/` | OpenSpec's *own* specs — dogfooded. 44 capability specs, useful as exemplars |
| `open-spec/openspec/changes/` | OpenSpec's in-flight work. Real-world delta-spec examples |
| `open-spec/src/` | TypeScript implementation: `cli/`, `commands/`, `core/`, `prompts/` |
| `open-spec/schemas/` | Built-in schema definitions (`spec-driven` is default) |
| `open-spec/website/`, `open-spec/docs-lab/` | The openspec.dev site and draft docs |

Two artifacts to read in the dogfood folder for vivid examples:
- `open-spec/openspec/specs/artifact-graph/` — the DAG engine specced in its own format.
- `open-spec/openspec/changes/install-skills-globally/` — a real multi-artifact change folder (the earlier example, `workspace-foundation/`, has been archived).

## How to get started (if you actually wanted to use it)

### Install once

```bash
curl -fsSL https://openspec.dev/cli/install.sh | sh   # standalone binary, no Node needed (README.md:123)
# or: npm install -g @fission-ai/openspec@latest      # needs Node.js 22.20.0+ (README.md:132)
# or: brew install openspec
```

### Initialize per-project

```bash
cd your-project
openspec init
```

This creates `openspec/` (with `specs/` + `changes/`) and installs the OpenSpec skills. Since 2.0 there are no per-tool command files: skills are written once to `.agents/skills/` and linked for tools that read elsewhere. Since 2.1, `openspec init --tools <ids>` installs them **globally** through Vercel's `skills` installer by default; `--scope project` keeps them in the repo. The agent now has the OpenSpec workflow available without any extra prompting.

Optional: switch from the default `core` profile (`propose`, `explore`, `apply`, `update`, `sync`, `archive`) to the expanded one (adds `new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`) — see `docs/getting-started.md:50`:

```bash
openspec config profile        # pick "expanded"
openspec update                # regenerates skill files
```

### The everyday loop

```mermaid
flowchart LR
    Idea([idea])
    E["/opsx:explore<br/>(optional thinking)"]
    Pr["/opsx:propose<br/>scaffold change folder"]
    Ap["/opsx:apply<br/>work tasks.md"]
    Sy["/opsx:sync<br/>(optional)"]
    Ar["/opsx:archive<br/>merge deltas → specs/"]

    Idea --> E
    Idea --> Pr
    E -.-> Pr
    Pr --> Ap
    Ap --> Sy
    Sy --> Ar
    Ap --> Ar

    Ap -->|"spec/design wrong?<br/>edit any artifact, continue"| Ap

    classDef opt fill:#fff3cd,stroke:#856404,color:#856404
    classDef done fill:#d4edda,stroke:#155724,color:#155724
    class E,Sy opt
    class Ar done
```

| 1.x command | 2.x skill | Output |
|-------------|-----------|--------|
| `/opsx:explore` *(optional)* | `/openspec-explore` | Investigation conversation — no artifacts created |
| `/opsx:propose <idea>` | `/openspec-propose` | `openspec/changes/<name>/` with all four artifacts |
| `/opsx:apply` | `/openspec-apply-change` | Works through `tasks.md`, ticking checkboxes |
| — | `/openspec-update-change` | Revises an in-flight change (added to the core profile) |
| `/opsx:sync` *(optional)* | `/openspec-sync-specs` | Pre-merges deltas into `specs/` for review |
| `/opsx:archive` | `/openspec-archive-change` | Merges deltas, moves change folder to `archive/` |

Codex invokes the same skills as `$openspec-propose` (`README.md:150`). The diagram above keeps the 1.x names, which much of `docs/` still uses. That's the happy path on the default `core` profile. The expanded profile splits propose into new (just scaffold) and continue (one artifact at a time) for when you want to think more carefully — see `docs/opsx.md:175-179`.

The self-loop on apply (`/opsx:apply`, now `/openspec-apply-change`) is the philosophical heart of OpenSpec: when implementation reveals the spec was wrong, you edit the artifact and keep going. There's no phase-lock to break.

### When you discover the spec was wrong mid-implementation

Just edit the artifact and keep going. There's no phase-lock to break. The whole reason OPSX exists is to drop the legacy "planning phase → implementation phase → archive phase" gating in favor of *actions you can take in any order* (`docs/opsx.md:48-58`, `319-360`).

## Mental model for using it well

- **Specs are behavior contracts, not implementation plans.** If the implementation can change without the externally observable behavior changing, it doesn't go in the spec — it goes in `design.md` (`concepts.md:136-154`).
- **Default to "Lite" specs.** A few requirements with a couple of scenarios each. Reserve full ceremony for cross-team API or migration work (`concepts.md:155-170`).
- **Let the agent draft, you provide intent.** The intended loop is: human gives intent + constraints, agent converts to behavior-first requirements, validation confirms structure (`concepts.md:171-180`).
- **Keep `proposal.md` short.** Intent / Scope / Approach. If it's growing, that's a signal the change is too big and should be split.
- **Treat `tasks.md` as the only mutable progress surface.** Checking boxes is how the agent and human stay in sync about what's done.

## When NOT to reach for this

- Pure greenfield prototyping where you're still finding the shape — the spec layer is overhead until requirements stabilize.
- One-shot scripts and throwaway tools — folder-per-change is too much ceremony.
- Domains where the value is in code-shaped artifacts (typed schemas, OpenAPI, protobuf). Use the right typed format and let OpenSpec wrap it only if humans need behavior-level requirements alongside.

## Comparisons (per the upstream README)

- **vs. GitHub Spec Kit** — Spec Kit is more thorough but enforces phase gates and Python tooling. OpenSpec is lighter and lets you iterate freely.
- **vs. AWS Kiro** — Kiro locks you into its IDE and Claude-only models. OpenSpec runs in any AI assistant via its skills.
- **vs. nothing** — vague chat prompts produce unpredictable results. OpenSpec gets human + AI to agree on observable behavior before code is written.

(Source: `README.md:185-191`.)

## Changes since the previous pin (2026-05-01 → 2026-11-19)

`0ca74762dc03` → `0c737dc1b543`, 487 commits. Package `@fission-ai/openspec` went from v1.3.1 to **v2.1.1**, through v1.4–v1.17, **v2.0.0** (2026-11-11), v2.1.0, and v2.1.1; tags now carry both `vX.Y.Z` and `@fission-ai/openspec@X.Y.Z`. License unchanged (MIT). The lede still holds: the delta format is unchanged (`docs/concepts.md:348-408`).

- **2.0: skills only.** OpenSpec no longer writes `/opsx:*` command files; each command became a skill (`openspec-propose`, invoked as `/openspec-propose`, or `$openspec-propose` in Codex). Skills are written once to `.agents/skills/` and linked per tool. `delivery` config is retired; Amazon Q Developer support was dropped (`CHANGELOG.md`, 2.0.0).
- **2.1: global skills** via Vercel's `skills` installer; `openspec update` asks whether to keep skills in the project or switch to global.
- **Installation**: a standalone binary with no Node requirement; the npm package now needs Node 22.20.0+ (it needed 20.19 at the previous pin); a Homebrew formula.
- **Stores (beta)**: planning in a separate repo shared across code repos (`docs/stores-beta/`).
- **CLI**: `openspec status --all`, `openspec init --language`, a vendor-neutral `agents` tool target, `retire_capabilities` for removing a capability's last requirement.
- The project's own specs grew from about 35 to 44 capabilities.

## One-line summary

> OpenSpec wins by replacing prose specs with a parseable tree of *requirements* and *scenarios*, replacing edits with *deltas*, and exposing the artifact graph through a CLI the agent can query — so the LLM navigates and updates surgically instead of re-reading and re-emitting the whole document.

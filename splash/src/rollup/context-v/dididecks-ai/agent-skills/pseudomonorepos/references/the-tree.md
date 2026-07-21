---
from: "dididecks-ai"
from_path: "context-v/agent-skills/pseudomonorepos/references/the-tree.md"
---

# The Tree (Living Snapshot)

Current state of the `lossless-monorepo` pseudomonorepo and its descendants. **This is a living doc** — update it when the tree changes, when a child's intent shifts, or when reality drifts from intent.

> **Important:** Most pseudomonorepos here are imperfectly maintained. The tables below describe **intent** and **rough state**, not guarantees of completeness or freshness.

## The Anchor

| | |
|---|---|
| **Name** | `lossless-monorepo` |
| **Repo** | <https://github.com/lossless-group/lossless-monorepo> |
| **Local path** | `~/code/lossless-monorepo/` (varies per collaborator) |
| **Status** | Active, root-level **imperfectly maintained** |
| **Role** | Anchor pseudomonorepo for The Lossless Group |

The root has its own `context-v/`, plus children. Some children are themselves pseudomonorepos (nesting).

## Rank-ordered children

Ordered by current importance / activity, not alphabetically.

### 1. `ai-labs/`

| | |
|---|---|
| **Path** | `~/code/lossless-monorepo/ai-labs/` |
| **Intent** | Work where we monkey with AI + Agents on complex workloads |
| **Reality** | Active. Where this skills repo originated. Multi-agent orchestration experiments live here (e.g., `investment-memo-orchestrator/`). |
| **Likely a pseudomonorepo?** | Yes — has multiple sub-projects. Check for nested `context-v/`. |

### 2. `astro-knots/`

| | |
|---|---|
| **Path** | `~/code/lossless-monorepo/astro-knots/` |
| **Intent** | The family of websites — feature-rich, opinionated, following the Astro Knots conventions (see `astro-knots` skill) |
| **Reality** | Active. ~10+ sites at varying maturity. New sites added at ~1 every few weeks. |
| **Likely a pseudomonorepo?** | Yes — each site is its own repo. |

### 3. `content-farm/`

| | |
|---|---|
| **Path** | `~/code/lossless-monorepo/content-farm/` |
| **Intent** | Tools and infrastructure for content development |
| **Reality** | Currently **almost entirely Obsidian plugins** — Obsidian is the team's content authoring environment. |
| **Likely a pseudomonorepo?** | Yes — multiple plugin repos. |

### 4. `tidyverse/`

| | |
|---|---|
| **Path** | `~/code/lossless-monorepo/tidyverse/` |
| **Intent** | Tools, libs, scripts for cleaning up other things |
| **Reality** | Active but lower-volume than the top three. |
| **Likely a pseudomonorepo?** | Maybe — depends on how many child tools have grown into their own repos. |

## Other directories at the root

The `lossless-monorepo` root has many other directories beyond the four named children — including individual project repos, shared `data/`, `docs/`, `flake-modules/`, scripts, and dotfiles. They are **not** pseudomonorepo children in the formal sense, but they may still have `context-v/` worth checking.

When unsure whether a sibling dir is a pseudomonorepo: apply the identifier from `anatomy.md` (`.git` + `context-v/` = yes).

## Maintenance & root-level helpers

Useful scripts that already exist at `~/code/lossless-monorepo/`:

- `reattach-all-submodule-remotes.sh`
- `switch-all-to-development-branch.sh`
- `switch-all-to-master-branch.sh`

When working with submodules across the tree, **check these first** before writing your own.

## How to update this doc

When the tree changes:

1. Bump `semantic_version` per the four-part scheme
2. Update `date_modified`
3. Add or remove a child entry
4. If a child's "intent" or "reality" shifts meaningfully, edit those rows
5. If a brand-new tree level appears (deep nesting), document it here

This is a `context-v/`-style living doc, even though it lives in a skill. Same discipline applies.

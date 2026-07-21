---
from: "dididecks-ai"
from_path: "context-v/agent-skills/pseudomonorepos/references/anatomy.md"
---

# Anatomy of a Pseudomonorepo

What makes a directory a pseudomonorepo (vs. a true monorepo, vs. a plain folder of repos).

## Definition

A **pseudomonorepo** is a parent git repo that:

1. **Owns a `context-v/`** spanning the children
2. **Includes children** — often as git submodules, sometimes as plain folders, sometimes both
3. **Does NOT** share builds, package manifests, or workspace tooling across children (that would make it a true monorepo)
4. **Is loosely structured** but **intentionally aware** of what its children are doing

The defining feature is **#1 — the parent `context-v/`**. Without it, you don't have a pseudomonorepo, you have a folder.

## What it isn't

| It's not... | Because... |
|---|---|
| A true monorepo | No shared `package.json`/workspace config; no shared build pipeline |
| A `pnpm`/`yarn` workspace | Children don't share dependencies or symlinked node_modules |
| An Nx / Turborepo | No task orchestration across children |
| A loose folder of repos | The parent maintains intentional cross-cutting context |
| A git superproject (only) | Submodule mechanics are the *means*, not the *purpose* |

A pseudomonorepo *might* contain a true monorepo as one of its children. That's expected. See "Nested pseudomonorepos" in `SKILL.md`.

## How to identify one

Quick checks, in order:

1. Does the directory contain `context-v/`?
2. Does it have child directories that are themselves git repos (check for nested `.git` or `.gitmodules` references)?
3. Does it have its own `.git` at the top level?

If yes to all three: it's a pseudomonorepo.

If 1 + 2 but the parent isn't a repo: it's a *forming* pseudomonorepo. Worth surfacing to the user.

If 2 + 3 but no `context-v/`: it's a folder of repos pretending to be a pseudomonorepo. Suggest creating `context-v/` if the children warrant cross-cutting context.

```bash
# Quick identifier
is_pseudomonorepo() {
  [ -d "$1/.git" ] && [ -d "$1/context-v" ]
}
```

## Submodules — when and why

Children are commonly added as git submodules. Pros:

- Children stay authoritative (no copy-paste drift)
- Parent can pin children to specific commits
- Each child's history is preserved

Cons (be honest about them):

- Submodules are clunky to update (`git submodule update --remote`, etc.)
- Detached HEAD inside the submodule is a frequent foot-gun
- Pull requests don't span submodule boundaries cleanly
- Collaborators forget to init/update them

The team has scripts for managing this — look for `reattach-all-submodule-remotes.sh`, `switch-all-to-development-branch.sh`, etc., at the root of `lossless-monorepo`. When you find yourself fighting submodules, **check for an existing script before writing one.**

## Children that aren't submodules

Sometimes a child is just a plain folder, not a submodule. Reasons:

- It hasn't been promoted to its own repo yet (still incubating)
- It's intentionally tied to the parent's lifecycle
- Submodules were tried and abandoned for that child

Both shapes are valid. The pseudomonorepo's `context-v/` covers both.

## When to create a new pseudomonorepo level

Create a new pseudomonorepo level when:

- You have **3+ related projects** that benefit from cross-cutting context
- Those projects are large enough to warrant their own repos
- A parent `context-v/` would have meaningful content (cross-cutting blueprints, shared specs)

Don't create one when:

- It's a single project with sub-modules of code (use a true monorepo)
- The "cross-cutting context" is empty or aspirational only

## Aspirational vs. actual

Most pseudomonorepos in the Lossless tree are **imperfectly maintained**. Specifically:

- Parent `context-v/` is often sparse
- Some children are stale or abandoned
- Cross-references between levels are inconsistent
- The README at the root may not reflect current children

Treat the structure as **a working sketch**, not a finished system. When working in it, your search-first discipline is what fills the gaps.

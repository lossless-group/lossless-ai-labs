---
from: "dididecks-ai"
from_path: "context-v/agent-skills/pseudomonorepos/references/branch-alignment.md"
---

# Branch Alignment Across the Tree

Pseudomonorepos and their children share a three-tier branch model: **development → main → master**. The aspiration is that the parent and every submodule sit on the same tier at the same time.

## The three tiers

| Branch | Role | Rhythm |
|---|---|---|
| `development` | Where most activity happens. The working edge. | Most commits land here. |
| `main` | Promoted from `development` when it reaches something noteworthy. | Periodic. |
| `master` | Stable. Only updated when the dust has settled. | Rare. |

> **Lazy reality:** when humans skip the discipline, work piles up in `development` and never gets promoted. Sometimes `main` ends up being treated as the working branch instead of `development`. `master` is often the most stale branch in the repo — that's expected, not a bug.

## The alignment expectation

When the **parent pseudomonorepo** is on `development`, **every submodule should also be on `development`**. Same for `main` and `master`. Mixed tiers across the tree are a smell — they make the parent's submodule pointers harder to reason about and break scripts like `switch-all-to-development-branch.sh`.

```
parent on development  →  all submodules on development
parent on main         →  all submodules on main
parent on master       →  all submodules on master
```

The team has root-level scripts to enforce this (`switch-all-to-development-branch.sh`, `switch-all-to-master-branch.sh`). Use them before writing your own.

## When a submodule lacks a tier

Not every repo has all three branches. Common gaps:

- New repos created with only `master` (GitHub default for older repos) or only `main` (newer default)
- Repos that never bothered to branch `development` off

When you encounter a missing tier and need it, **create the missing branch from the leading branch** and push it. This is non-destructive (a fresh branch, not a force update):

```bash
# Inside the submodule. Common case: development missing, master is leading.
git branch development origin/master
git push origin development:development
```

Mirror this for `main` if missing (`git branch main origin/master && git push origin main:main`), or `master` if missing (rare).

## When a tier is *behind* where it should be

If the parent expects `development` but the submodule's `origin/development` is behind `origin/master` or `origin/main`, you have a choice:

1. **Fast-forward `development` to catch up** — recommended when there's no conflict (the leading branch's history fully includes development's). This is non-destructive: a normal push to a non-default branch.

   ```bash
   # Inside the submodule. Brings development up to main's tip.
   git push origin origin/main:development
   ```

2. **Switch the submodule anyway** — accepting that the parent's gitlink will roll backwards. Almost always wrong. Don't do this without explicit user direction.

## When a tier is *ahead* of where it should be

If `development` is ahead of `main`/`master`, that's normal — it means there's unpromoted work. Don't auto-promote. Promotion (development → main, main → master) is a deliberate human decision tied to the lifecycle phases (see `lifecycle-workflow.md`):

- `development` → `main` happens when work reaches something noteworthy
- `main` → `master` happens when changes have settled and proven stable

## After changing submodule branches: sync `.gitmodules`

The parent's `.gitmodules` records the expected branch per submodule (`branch = development`). When you change which branch a submodule tracks:

1. Update the `branch =` line in the parent's `.gitmodules`
2. Run `git submodule sync` so `.git/config` picks up the change
3. Stage `.gitmodules` and the submodule pointer in the parent

A submodule entry without a `branch =` line is a smell — it means `git submodule update --remote` won't know which branch to follow.

## Reality check before pushing

Before fast-forwarding any branch (especially `development`):

```bash
# Are you actually fast-forwarding, or sneaking in a non-FF update?
git rev-list --count origin/development..origin/main   # should be > 0
git rev-list --count origin/main..origin/development   # should be 0 for a clean FF
```

If both are non-zero, the branches have diverged — don't FF. Surface to the user.

## Pushing to default branches

Direct pushes to a repo's default branch (often `master` or `main`) are typically blocked by branch protection. Push to `development` or a feature branch instead, and let the human merge upward through the lifecycle. If you need to land WIP somewhere safe before a destructive operation (like relocating a submodule), push it to `development` even if the work was based on `master` — fast-forward `development` to `master`'s tip first if needed, then commit on top.

## Honest note

Most of the lossless tree drifts out of alignment over time. **Observe and surface, but do not auto-realign** as a side effect of unrelated work — branch realignment touches shared remotes and breaks parallel agent sessions. Treat alignment as a deliberate, explicitly-authorized task, the same way the skill treats `context-v/` normalization.

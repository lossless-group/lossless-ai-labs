---
from: "dididecks-ai"
from_path: "context-v/agent-skills/pseudomonorepos/references/search-first.md"
---

# Search First: Finding Prior Work Before Creating New

The behavioral discipline at the heart of this skill. Concrete recipes for the "walk up + search" routine.

## Why this matters

Every minute spent finding a prior blueprint is worth ten minutes not spent rewriting it. More importantly: **disconnected work is the failure mode this whole framework is built to prevent.** A new spec that ignores three existing related ones isn't progress — it's noise.

## The walk-up routine

```bash
# Find every context-v/ from cwd up to filesystem root
walk_up_context_v() {
  local dir="$PWD"
  while [ "$dir" != "/" ]; do
    [ -d "$dir/context-v" ] && echo "$dir/context-v"
    dir="$(dirname "$dir")"
  done
}

walk_up_context_v
```

Result: a list of `context-v/` directories from your current location up to the root.

## Topic search (the most common move)

When the user gives you a task, identify 1-3 keywords that capture it. Then:

```bash
# Filename search
find ~/code/lossless-monorepo -type d -name context-v 2>/dev/null \
  | xargs -I {} find {} -type f -iname '*KEYWORD*'

# Content search (case-insensitive, recursive)
find ~/code/lossless-monorepo -type d -name context-v 2>/dev/null \
  | xargs grep -ril 'keyword'

# Tag search (Train-Case tags in YAML frontmatter)
find ~/code/lossless-monorepo -type d -name context-v 2>/dev/null \
  | xargs grep -rl '^  - Keyword$'
```

Substitute `rg` (ripgrep) where available — it's faster and respects gitignore by default.

## Reading the results

When you get hits, **don't just dump them at the user.** Triage:

1. **Direct match** — same topic, same level. Show first.
2. **Adjacent match** — related topic, possibly extendable. Show with brief why.
3. **Tangential match** — overlapping keywords but different intent. Mention only if hits are sparse.

Format your report:

> Found related work:
> - `astro-knots/context-v/blueprints/Image-Pipeline.md` (direct match — exists, may extend)
> - `lossless-monorepo/context-v/explorations/Cdn-Strategies.md` (adjacent — may inform)
> - `tidyverse/context-v/issues/Image-Cleanup-Crons.md` (tangential — different layer)
>
> Recommendation: extend the blueprint and link to the exploration. Want me to draft?

## When to short-circuit

Skip the search when:

- The user explicitly says "just ship" / "don't search" / "we'll refactor later"
- The task is trivially small (typo fix, one-line update)
- You've already searched on this topic in the same session (cache it mentally)

When you skip, **say so**:

> Skipping the search-first routine — shipping. Will note this for refactor.

Then log the debt (next section).

## Logging refactor debt

When you ship without searching, leave a marker so the work can be reconnected later. Two acceptable forms:

### Inline in the file you just shipped

Add a comment or a frontmatter field:

```yaml
---
...
refactor_debt: "Shipped without checking for prior patterns. Candidates: search 'image pipeline', 'cdn'."
---
```

### As a `context-v/issues/` one-liner

Create a minimal issue doc:

```markdown
---
title: "Refactor Debt: New X shipped without prior-pattern search"
date_created: 2026-05-03
date_modified: 2026-05-03
authors:
  - AUTHOR
semantic_version: 0.0.0.1
tags:
  - Refactor-Debt
  - Reconnect
status: open
---

Shipped `path/to/new-thing.md` (or code) on 2026-05-03 without searching for prior work.
Candidates to reconnect:
- (keyword 1)
- (keyword 2)
```

Either is fine. The point is **the marker exists** so the connection can be made on a later pass.

## Anti-patterns

- ❌ Silently writing a duplicate of an existing blueprint
- ❌ "I didn't find anything" without showing the search you ran
- ❌ Refactor-debt markers with no keywords (useless on the next pass)
- ❌ Searching only the immediate `context-v/` and skipping the walk-up

## When you can't find anything

That's a real result. Report it:

> Searched `lossless-monorepo`, `astro-knots`, `ai-labs`, `tidyverse` for "X" — no prior work found. Proceeding to draft new.

Then proceed. Negative results are valuable: they suggest the new doc you're about to write is genuinely novel and may itself become prior work for future searches.

---
name: git-conventions
description: The Lossless Group's git commit message conventions — structured headers with action verbs and effort groupings, paragraph-spaced bodies that explain impact before implementation, and "Also included" riders for minor changes. Use when writing commit messages, reviewing commits, or when the user mentions "commit message format", "git conventions", or asks how to structure a commit.
from: "dididecks-ai"
from_path: "context-v/agent-skills/loops/git-conventions/SKILL.md"
---
# Git Conventions

The Lossless Group's conventions for git commit messages — making history readable, searchable, and useful for future-you.

**Status:** Initial scaffold (May 2026) — documenting observed patterns from lossless-monorepo.

## When to use this skill

- Writing commit messages (any repo)
- Reviewing commits before push
- Teaching commit conventions to collaborators
- User asks "how should I format this commit?"
- User mentions "commit message", "git conventions", "effort grouping"

## Core Patterns

### 1. Header Syntax

Two accepted patterns:

**Pattern A: Single effort grouping**
```
{action}({effort-grouping}): {narrative description}
```

**Pattern B: Multiple effort groupings or chained actions**
```
{action}({effort-1}, {effort-2}): {narrative description}
{action}({effort-1}), {action}({effort-2}): {narrative description}
```

**Examples:**
```
feat(theme-system): Add vibrant mode verification checklist
fix(mode-switcher, theme.css): Vibrant mode now dark-based with neon effects
doc(README), skill(astro-knots): Update vibrant mode guidance
```

### 2. Common Action Verbs

| Action | When to use |
|--------|-------------|
| `feat` | New feature, new capability |
| `fix` | Bug fix, correction |
| `doc` | Documentation changes |
| `refactor` | Code restructure without behavior change |
| `style` | Formatting, whitespace (no logic change) |
| `test` | Adding/updating tests |
| `chore` | Maintenance, deps, tooling |
| `skill` | Skill file changes (lossless-skills repo) |
| `changelog` | Changelog entry added/updated |

### 3. Effort Groupings

**What is an effort grouping?** The part of the codebase this commit touches — a package, a site, a system, a concern.

**Examples:**
- `skill(theme-system)` — changes to theme-system skill
- `feat(reach-edu-hub)` — new feature in reach-edu-hub site
- `fix(mode-switcher, theme.css)` — bug fix touching both files/systems
- `doc(README, CANDIDATES)` — documentation changes in both files

**Guideline:** Use the most specific grouping that makes sense. If a commit touches multiple unrelated areas, consider splitting into multiple commits.

### 4. Body Structure (The Important Part)

**Rule: Use paragraph spacing to separate concerns. Do not lump.**

**Structure:**

1. **First paragraph: Sense-making summary**  
   Anyone (future-you, a new contributor, a stakeholder) should understand what this commit does and why.

2. **Second paragraph: Impact**  
   What changes does this commit introduce? Focus on **what the changes do**, not how they're implemented.

3. **Third+ paragraphs: Breakdown by concern**  
   Cluster related changes. One paragraph per cluster. Each paragraph explains a cohesive set of changes.

4. **Affected files list**  
   List files changed that align with the header. Makes git log searchable.

5. **"Also included:" section (optional)**  
   Minor changes, formatting tweaks, riders that aren't worth their own commit. Keeps commit history clean.

**Example structure:**
```
fix(mode-switcher, theme.css): Vibrant mode now dark-based with neon effects

Problem: Light and vibrant modes were indistinguishable because vibrant
mode only set effect tokens and inherited light mode's white background.

Solution: Vibrant mode now comprehensively overrides all surface/text/border
tokens. Uses color-mix() for glassmorphic surfaces, multi-color neon gradients
(lime → cyan → blue → violet), and high glow opacity (0.55 vs 0.22 in dark).

CSS changes (theme.css):
- Added named tokens for vibrant palette (cyan-bright, violet-deep, lime-terminal)
- Vibrant mode block now sets background, surface, text, border
- Multi-stop gradient definition for headlines

Mode switcher (mode-switcher.js):
- No changes needed — switcher already supported three modes

Files changed:
- src/styles/global.css
- src/pages/brand-kit/index.astro

Also included:
- Fixed typo in README
- Removed debug console.log from Header.astro
```

### 5. Pre-Commit Checklist: Changelogs & Context-v

**Before you commit, CONSIDER (don't assume) two things:**

#### Should a changelog be written?

**When to write a changelog:**
- At the **conclusion or final stages** of a coherent flow of work
- When implementing a spec or completing a sequence of related prompts
- When something of substance changed that matters to humans, the team, or users

**Frequency expectations:**
- **1 or fewer per day** = meeting expectations
- **Up to 5 per day** on heavy shipping days
- It depends on the coherence of the commit set

**Why this matters:**
- Changelogs are a **trust-reinforcing rhythm**
- They're **breadcrumbs** on progress/decisions/changes of substance
- They're for humans, not machines

**Common mistake:** Rushing to commit without considering if a changelog is needed, then having to make a tiny "oops(changelog): add missing entry" commit or amend+force-push. Causes drag.

#### Do README or context-v files need updating?

**Not a hard rule**, but worth considering:
- Has the project's purpose shifted? Update README.
- Did we make decisions that should be documented? Update `context-v/` files.
- Are specs, blueprints, or prompts now stale? Flag or update them.

**Why this matters:**
- Keeps `context-v/` accurate to current thinking and practice
- Prevents future confusion about why decisions were made
- Reduces "wait, why did we do it this way?" conversations

**Common mistake:** Same as changelogs — rushing to commit, then realizing context is stale, then making an "oops(context-v): update stale spec" commit.

**The discipline:** Pause before `git commit`. Ask:
1. Is this the end of a coherent flow of work? → Consider changelog.
2. Did we make decisions or changes that shift context? → Consider updating `context-v/` or README.

If yes to either, do it **in the same commit** or **before committing**. Don't rush.

### 6. Key Principles

**Sense-making first:** The first paragraph should explain what and why in plain language. Assume the reader knows nothing about the context.

**Impact over implementation:** Explain what changes, not how you changed it. "Vibrant mode now dark-based" (impact) before "Changed --color-surface value" (implementation).

**Paragraph spacing matters:** Blank lines between concerns makes commits scannable. Lumped paragraphs are hard to parse.

**List riders explicitly:** If you're sneaking in unrelated changes (typo fix, debug cleanup), list them under "Also included:" so they don't pollute the main narrative.

**Affected files consistency:** Files listed should match the effort groupings in the header. If the header says `(mode-switcher, theme.css)`, those files should appear in the body.

## Pre-Commit Anti-Patterns

❌ **Rush to commit without considering changelog:**
```bash
git commit -m "feat: implement new feature"
# Later: "Oh, I should have written a changelog"
# Now: Either make tiny oops commit or amend+force-push
```

✅ **Pause, consider, include if needed:**
```bash
# Write changelog entry if this completes coherent work
vim changelog/2026-05-04_02.md
git add changelog/
git commit -m "feat: implement new feature

See changelog/2026-05-04_02.md for details."
```

❌ **Rush to commit with stale context-v:**
```bash
git commit -m "refactor: change approach"
# Later: "The spec is now wrong"
# Now: Either update separately or amend
```

✅ **Update context-v in same commit:**
```bash
# Update stale spec while making the change
vim context-v/specs/Feature-Spec.md
git add context-v/
git commit -m "refactor: change approach

Updated spec to reflect new implementation strategy."
```

## Common Mistakes (Headers & Bodies)

❌ **Vague headers:**
```
fix: updates
feat: changes to theme
```

✅ **Specific headers:**
```
fix(mode-switcher): Vibrant mode toggle now persists to localStorage
feat(theme-system): Add two-tier token architecture reference
```

❌ **Lumped body:**
```
Fixed vibrant mode and also updated docs and added new tokens and fixed a typo in README and changed the mode switcher and...
```

✅ **Paragraph-spaced body:**
```
Fixed vibrant mode by making it dark-based instead of light-based.

Theme changes:
- Added cyan-bright, violet-deep, lime-terminal named tokens
- Vibrant mode block now sets all surface/text/border tokens

Documentation:
- Updated setup playbook with vibrant verification checklist
- Added examples to quickstart guide

Also included:
- Fixed typo in README
```

## Push-output gotchas

### GitHub's Dependabot banner is unreliable — don't surface it as actionable

When `git push` completes, GitHub may print a `remote:` banner like
`GitHub found N vulnerabilities on <repo>'s default branch`. **Treat this
as noise, not signal.** Observed on lossless-group repos:

- The banner count is computed independently of the Dependabot alerts UI
  and drifts from it; counts stay pinned for weeks after the underlying
  lockfile entries are gone.
- It fires even when Dependabot is **disabled** for the repo.
- Walking through the listed advisories with Claude Code and resolving
  the lockfile entries has not moved the banner count in practice.

**Don't** raise it to the user as a follow-up action on an unrelated push
(e.g. a marketplace-compliance push). If the user is actively working on
dependency hygiene, that's a different conversation.

## Cross-skill ties

- **`changelog-conventions`** — commit messages often become changelog entries
- **`context-vigilance`** — commit message structure mirrors document frontmatter discipline

## Commit messages also serve four audiences

Commit messages surface publicly via the GitHub commits view, via push-time release notes, via the parent pseudomonorepo's rolled-up changelog feed, and via search engines indexing the commit pages. They carry the **same four-audience discipline** that `changelog-conventions` codifies for `README.md`, changelog entries, and release narratives:

1. **General audience** — the header has to land in two seconds (a passer-by reading the repo's commits page should grok what shipped)
2. **Nerds passing by** — the first body paragraph should explain *what* changed and *why* it matters, in human terms (not just a file-diff narration)
3. **Nerds paying close attention** — subsequent paragraphs name specific files, behaviors, edge cases, and any non-obvious decisions
4. **Internal team** — the tail can carry SHAs, Co-Authored-By, ticket numbers, follow-up notes

Same principle as the long-form docs: **sequence the content from broadest to most-specific** so each reader gets dropped at the right station. The pre-commit checklist (§5) and the body-structure conventions (§4) already encode much of this in mechanics; the audience cascade is the framing that makes the *why* legible.

For the full framing (including the "long files are fine if you stamp a TOC" rule that applies to release narratives), see the `changelog-conventions` skill, section **"These are marketing artifacts, not internal documentation"**.

## What's Not Here Yet (TBD)

- [ ] `references/header-patterns.md` — comprehensive action verb + effort grouping catalog
- [ ] `references/body-structure.md` — deep dive on paragraph spacing and impact-first writing
- [ ] `references/examples.md` — 10+ real commit messages from lossless repos annotated
- [ ] `templates/commit-message-template.txt` — boilerplate for git commit.template

## Development Notes

This skill is being extracted from commit history across:
- `lossless-skills` repo
- `astro-knots` monorepo
- Individual site repos (reach-edu-hub, fullstack-vc, etc.)

Observed patterns will be documented incrementally.

## See also

- Changelog conventions skill (similar structured writing discipline)
- Context-vigilance skill (frontmatter structure parallels commit headers)

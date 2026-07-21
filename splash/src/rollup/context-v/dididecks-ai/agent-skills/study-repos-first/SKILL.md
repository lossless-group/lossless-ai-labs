---
name: study-repos-first
description: The Lossless Group's discipline of pinning a curated collection of upstream repos (a "study") around a domain question *before* designing or coding in that domain. Use when starting work that touches conventions, file formats, schemas, protocols, or any decision where prior art exists; when the user mentions "study", "studies/", "reference collection", "prior art", "pin a submodule", or names of existing studies (open-specs-and-standards, memory-layers-for-agents, data-analytics-specifications-and-standards); when scaffolding a new study, extending one, or deciding whether something belongs in a study vs. a project. Encodes the "read upstream code, don't paraphrase from training data" behavior.
from: "dididecks-ai"
from_path: "context-v/agent-skills/study-repos-first/SKILL.md"
---
# Study Repos First

> A *study* is a curated reference collection — a directory of upstream specs, prior art, reference implementations, papers, or codebases — pinned as git submodules **before** a decision is made or a feature is built. It is not a project (it ships nothing) and not documentation (it lives, it's checked-out code). It is a reading list with structure, pinned so it never rots out from under us.

This skill is **foundational and iterative**. It will be expanded as we work through real studies together. Treat the contents as the current best understanding, not the final word.

## When to use this skill

- Starting any task in `ai-labs/` (or any pseudomonorepo) where the question is about **conventions** — naming, file shapes, folder layouts, schemas, protocols, manifest formats — rather than novel logic
- The user says "let's study X", "what's the prior art on X", "how do other projects handle X", "pin a reference", "add a submodule under studies/"
- A design decision is on the table and the temptation is to let the agent fill in patterns from training data
- Scaffolding a new `studies/<topic-slug>/` directory
- Adding a reference to an existing study (new submodule, README update)
- Deciding whether a study has outgrown a subdirectory and should be promoted to its own repo (the `lossless-group/study-<slug>` pattern)
- Reading from a study to ground a current implementation question

## The behavioral core (this is the actual skill)

**Don't paraphrase from training data when pinned upstream code is — or could be — one `cd` away.**

When a domain question comes up:

1. **Check if a study already covers it.** Look in `ai-labs/studies/` (and any `studies/` directory walking up the tree). If a study exists, *read from the pinned submodules*, not from memory.
2. **If no study exists and the question is meaningful**, propose one. Frame the question first; pick a slug; set up the directory.
3. **Cite findings with file paths** — `studies/<topic>/<repo>/<file>:<line>` — so the user can jump to the upstream source.
4. **Do not summarize or paraphrase upstream specs into prose** unless asked. The upstream repo is the artifact. A paragraph paraphrasing `llms.txt` is a hot take that will rot.

The two failure modes this skill exists to prevent:

- **Generating plausible-but-stale conventions** that the agent recalled from training data when real upstream code disagrees.
- **Reinventing patterns** (front-matter shapes, lockfile structures, skill manifests) that three or four mature projects have already converged on.

## What a study is — and isn't

| Is | Isn't |
|---|---|
| A curated reference collection pinned at known SHAs | A summary or paraphrase of those references |
| Scoped to a single domain question | A junk drawer of "stuff we might read someday" |
| Read from during development to answer concrete questions | A teaching or onboarding artifact |
| Self-contained — submodules nest *inside the study* | A project that ships, builds, or runs in CI |
| Stable — submodule SHAs are pinned and don't auto-bump | Living docs that update on every upstream commit |

## How to set up a new study

Follow `studies/README.md` (the canonical version in each pseudomonorepo) and `studies/CLAUDE.md`. The shape:

1. **Name the question.** A study is for a domain question, not a wishlist. Examples that work: *"How do open specs structure agent-facing files?"*, *"What conventions exist for AI evaluation harnesses?"* Write the question into the study's `README.md` first; everything else hangs off it.

2. **Pick the directory.** `studies/<topic-slug>/`. Use a slug that reads naturally (`open-specs-and-standards`, not `oss`).

3. **Pin references as submodules.** For each upstream you want to study, add it as a git submodule **inside the study**, not at the root of ai-labs. Submodules pin a SHA; what you read today is what someone reads in a month, even if the upstream rewrites history.

4. **Write the README.** At minimum:
   - The question being investigated.
   - For each reference: link, maintainer, one-paragraph "why this is here".
   - Optionally: a reading-checklist or list of sub-inquiries (what to compare, what to extract).

5. **Add an inquiry log** when the work warrants it: a `context-v/inquiry/` (or similar) folder for in-progress notes, tree dumps, and findings. Inquiry notes are *yours*, separate from the upstream material.

6. **Promote when it grows.** When a study accumulates more than four or five references, or starts to grow its own tooling (parsers, scripts, visualizations), promote it to its own GitHub repo at `lossless-group/study-<topic-slug>` and make it a single submodule of `ai-labs`. The in-place subdirectory becomes a submodule pointer; the study's nested references stay nested. See `open-specs-and-standards/` as the worked example.

## How to extend an existing study

The user may say "add a reference" or "extend the study". Default workflow:

1. **Confirm the study's question is still the right home.** If it isn't, suggest a *new* study rather than stretching scope. Boundless studies become junk drawers.
2. **Add the upstream as a submodule inside the study's repo** — not at the ai-labs root. Studies are self-contained.
3. **Update the study's README** to include the new reference: link, maintainer, one-paragraph "why this is here". Match the section structure already in the README; don't invent a new section unless the reference genuinely doesn't fit.
4. **Stage and let the user review** before committing. Don't auto-commit submodule additions — the user typically reviews the README addition alongside the gitlink.

### The submodule add command, concretely

From inside the study directory (e.g. `studies/open-specs-and-standards/`):

```bash
git submodule add <repo-url> <local-path>
```

The `<local-path>` should be a sensible slug derived from the repo name. After adding, the parent's `.gitmodules` will gain a new entry and the gitlink will appear unstaged.

## Anti-patterns

- **Writing summaries instead of pinning code.** A paragraph paraphrasing what `llms.txt` does isn't a study — it's a hot take that will rot. The upstream repo *is* the artifact.
- **Boundless scope.** A study without a question becomes a junk drawer. When in doubt, split into two studies.
- **Treating it like docs.** A study isn't trying to teach. It's a place to *find evidence* when a decision is on the table.
- **Auto-bumping submodule SHAs to upstream HEAD.** Pinned SHAs are the point. Bump only when explicitly asked.
- **Adding submodules at the ai-labs root** instead of nested inside the study. Studies are self-contained.
- **Writing "summary" or "interpretation" docs into a study repo** without the user's go-ahead. Studies are reading lists, not commentary.

## Cross-skill ties

This skill composes with the others:

- **`pseudomonorepos`** — `studies/` lives inside a pseudomonorepo. Walk up the tree to check whether a parent-level study covers the same question before creating one in a child.
- **`context-vigilance`** — inquiry notes that *do* belong in `context-v/` (questions you're chasing, comparisons you're making) follow context-vigilance conventions: frontmatter, wikilinks, the four cognitive modes.
- **`git-conventions`** — when committing a new submodule or study, the commit message follows the standard structure (`new(study): ...`, `update(study): add <ref>`).

When working on a study, **multiple skills apply.** Don't pick one — let them all inform what you do.

## Typical flow when a domain question arises

1. **Locate yourself.** `pwd`. Walk up to find the nearest `studies/` directory (and any nested ones).
2. **Scan for an existing study** that names this domain. Check `studies/<slug>/README.md` for the question.
3. **If found:** read the relevant submodule(s). Cite paths. Answer from upstream code.
4. **If not found:** ask the user — *"there's no study for this; want to set one up, or shortcut?"* — and follow the setup steps above if they say yes.
5. **If shipping fast** without a study, log refactor debt: *"answered X without grounding in pinned upstream — candidate study: <topic>"*. Honesty about the shortcut is what makes the refactor possible.

## See also

- `studies/README.md` (in each pseudomonorepo) — canonical concept doc, current studies index
- `studies/CLAUDE.md` (in each pseudomonorepo) — operational instructions for working in `studies/`
- `pseudomonorepos/SKILL.md` — the surrounding tree-walking discipline
- `context-vigilance/SKILL.md` — conventions for inquiry notes that live in `context-v/`

---

**Status:** foundational. This skill will grow as we work through real studies. Expected refinements over time: concrete patterns for inquiry notes, reusable READMEs, the "promote to standalone repo" mechanics, the comparison/extraction templates, and the boundary between "study" and "project".

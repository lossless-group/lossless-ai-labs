# Studies

A *study* is a curated reference collection — a directory of upstream specs,
prior art, reference implementations, papers, or codebases — gathered
**before** a decision is made or a feature is built. It is not a project (it
ships nothing) and not documentation (it lives, it's checked-out code). It is
a reading list with structure, pinned in git so it never rots out from under
us.

This directory holds those collections. Each subdirectory is one study, named
for its topic.

## Why studies exist

The temptation in AI work is to start coding and let the agent fill the gaps
from training data. That works for routine code. It fails for *convention*:
how we name files, structure folders, shape data, or talk to other systems.
Conventions are choices that have already been made by someone else, and the
"right" answer is usually the one that converges across three or four mature
projects in the same space.

A study is the cheap way to get that convergence in front of you and the
agent before you commit to a design.

## Why frontload them

- **Better decisions.** A choice backed by a small evidence base of real
  implementations beats a gut take, and the conversation with stakeholders is
  shorter when the evidence is one `cd` away.
- **Less reinvention.** Patterns like front-matter schemas, lockfile shapes,
  or skill manifests have already been worked out. Studying them surfaces
  the trade-offs other people already paid for.
- **Reusable across projects.** A study lives outside of any one feature
  branch. Later work in the same domain references the same pinned SHAs.
- **Better context for agents.** Pointing an agent at a study ("look at how
  `open-spec` handles change proposals in `studies/open-specs-and-standards/open-spec/`")
  produces grounded answers. Asking it to recall the same thing from training
  data produces plausible-but-stale ones.

## Why reference them during development

The study is meant to be opened, not just cited. When a question comes up
mid-build — "what should this front-matter field be called?", "how do we
version this schema?" — the answer should come from the study, not be
re-derived. The study is the project's institutional memory for that domain.

## How to set one up properly

1. **Name the question.** A study is for a domain question, not a wishlist.
   Examples: "How do open specs structure agent-facing files?",
   "What conventions exist for AI evaluation harnesses?". Write the question
   into the study's `README.md` first; everything else hangs off of it.

2. **Pick the directory.** Create `studies/<topic-slug>/`. Use a slug that
   reads naturally (`open-specs-and-standards`, not `oss`).

3. **Pin references as submodules.** For each upstream you want to study,
   add it as a git submodule. Submodules pin a SHA, so what you read today
   is what someone reads in a month — even if the upstream rewrites history.

4. **Write the README.** At minimum:
   - The question being investigated.
   - For each reference: link, maintainer, one-paragraph "why this is here".
   - A reading-checklist or list of sub-inquiries to drive a pass through
     the material (what to compare, what to extract).

5. **Add an inquiry log.** Optional but useful: a `context-v/inquiry/` (or
   similar) folder where you keep your in-progress notes, tree dumps, and
   findings as you read. These are *yours*, separate from the upstream
   material.

6. **Promote when it grows.** When a study accumulates more than four or
   five references, or starts to grow its own tooling (parsers, scripts,
   visualizations), promote it to its own GitHub repo and make it a single
   submodule of `ai-labs`. Pattern: `lossless-group/study-<topic-slug>`. The
   in-place subdirectory becomes a submodule pointer; the study's nested
   references stay nested. See `open-specs-and-standards/` for a worked
   example.

## Anti-patterns

- **Writing summaries instead of pinning code.** A paragraph paraphrasing
  what `llms.txt` does isn't a study — it's a hot take that will rot. The
  upstream repo *is* the artifact.
- **Boundless scope.** A study without a question becomes a junk drawer.
  When in doubt, split into two studies.
- **Treating it like docs.** A study isn't trying to teach. It's a place to
  *find evidence* when a decision is on the table.

## Current studies

- [open-specs-and-standards](./open-specs-and-standards) — what conventions
  have converged for human + AI agent cooperation through files
  (`AGENTS.md`, `SKILL.md`, `llms.txt`, `DESIGN.md`, MCP, A2A, etc).

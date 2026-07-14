# CLAUDE.md — Studies

This directory holds *studies*: curated reference collections of upstream
specs, prior art, and reference implementations, pinned as git submodules.
Each subdirectory is one study, scoped to a single domain question. See
[README.md](./README.md) for the full concept.

## How to use studies in this directory

When the user asks a question, plans a feature, or makes a design decision
that touches a domain a study covers, **read from the study before
generating from training data**. The pinned upstream code is more reliable
than recalled patterns.

Concretely:

- If asked about file conventions, agent-facing formats, or open standards
  → look in `studies/open-specs-and-standards/`. Grep, read, cite paths.
- If a study exists for the domain at hand, mention it and read from it
  rather than answering from memory.
- Cite findings with file paths (`studies/<topic>/<repo>/<file>:<line>`)
  so the user can jump directly to the source.

## Skills sync — opening & closing habit

Lossless skills live in `context-v/skills/<name>/` at the anchor monorepo root
(`/Users/mpstaton/code/lossless-monorepo/context-v/skills`). Claude Code only
discovers a skill when it has its **own** direct-child symlink at
`~/.claude/skills/<name>` — a symlinked *parent* dir does **not** expose the
skills nested inside it. A skill that's authored but never linked is invisible
to every session.

- **Opening (session start):** sync so any skills added since last session are linked.
- **Closing (after authoring or editing any skill):** sync again — newly-linked
  skills load in the *next* session, not the current one.

```bash
bash /Users/mpstaton/code/lossless-monorepo/context-v/skills/sync-skills-symlinks.sh
```

Idempotent: links every `context-v/skills/*` dir with a top-level `SKILL.md`
that isn't already linked; never clobbers a non-symlink. Re-run it freely.

## How to add to or modify a study

The user may ask to "add a reference" or "extend a study." Default workflow:

1. Confirm the study's question is still the right home for the new
   reference. If it isn't, suggest a new study instead of stretching scope.
2. Add the upstream as a submodule **inside the study's repo** (not inside
   ai-labs). Studies are self-contained.
3. Update the study's README to include the new reference (link,
   maintainer, one-paragraph "why this is here").
4. Stage and let the user review before committing.

## How to start a new study

If the user asks to start a new study:

1. Get the **question** in writing first. A study without a question is a
   junk drawer.
2. **Before adding a single reference, decide in-place vs. promoted.**
   Every existing study in this directory (`open-specs-and-standards`,
   `memory-layers-for-agents`) is a **single submodule** pointing at its
   own `lossless-group/study-<topic-slug>` repo — reference repos are
   nested *inside that repo*, never registered directly in
   `ai-labs/.gitmodules`. If you already expect (or the candidate-repo
   research turns up) more than ~4-5 references, **create and populate the
   standalone repo first**, then register it as ai-labs's single
   submodule. Registering references flat in `ai-labs/.gitmodules` and
   promoting afterward means unwinding every gitlink and re-adding them
   one level deeper — real, avoidable rework (this happened once already,
   2026-07-13, with `agent-harnesses` and `conversational-ui-and-native-shells`).
3. Create `studies/<topic-slug>/` and follow the setup steps in the parent
   `README.md`.

## What not to do

- **Don't summarize study contents into prose** unless asked. The value of
  a study is the upstream code, not paraphrase. If asked for an overview,
  prefer a short index over a long synthesis.
- **Don't write "summary" or "interpretation" docs into a study repo**
  without the user's go-ahead. Studies are reading lists, not commentary.
- **Don't auto-update submodule pointers** to upstream HEAD. Pinned SHAs
  are the point. Bump them only when explicitly asked.
- **Don't treat a study as a project.** No build, no CI, no features. If
  something looks like it wants to ship, it belongs in `packages/` or its
  own repo, not `studies/`.

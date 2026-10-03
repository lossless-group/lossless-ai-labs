---
title: "Explore Collaborator Codebases for Insights — Comparative Highlights"
lede: "When a friend has built their own agentic-coding silo next to ours, compare the silos both ways: what we can learn from them, and what they can learn from us."
date_created: 2026-10-03
date_modified: 2026-10-03
date_authored_initial_draft: 2026-10-03
date_authored_current_draft: 2026-10-03
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
semantic_version: 0.0.1.0
tags:
  - Exploration
  - Studies
  - Collaborations
  - Comparative-Highlights
  - Agentic-Coding
status: Draft
site_uuid: 7e9e48e8-9905-4811-ba9f-c1bd5790a139
hex_code: 8z39yb
publish: true
---

# Explore Collaborator Codebases for Insights — Comparative Highlights

## The situation this is for

A normal study goes wide. We pin anywhere from a few to tens of open-source
codebases that answer one domain question, then read them before making a
decision in one of our projects. The upstream repos are strangers' work, and
the flow is one way: we read, we take ideas.

A **collaboration study** is a different shape. A friend, or a possible
collaborator, who is also deep into agentic coding or vibe coding has built
their own systems and architecture in their own silo. We have our silo too.
The question isn't "what has converged across the field?" It's:

> **If we put our two silos side by side, what can each of us learn from
> the other?**

That question runs both ways on purpose:

1. **What we learn from them.** They solved problems we haven't hit, or
   solved ones we have hit in a different way. A silo that grew without
   our conventions is a natural control group. Where we ended up in the
   same place independently, that's a signal. Where they found something
   simpler, we should notice.
2. **What they learn from us.** Some friends and collaborators see us (The
   Lossless Group) as "ahead", or further down the rabbit hole. They want
   to know what to take from our setup. That deserves a deliberate answer,
   grounded in their code, not a generic tour of everything we do.

## How this differs from a regular study

| | Regular study | Collaboration study |
|---|---|---|
| Subject | Many public upstreams | One friend's codebase (sometimes a few repos) |
| Question | One domain question | "Silo vs silo: what transfers?" |
| Direction | One way (we read, we learn) | Two way (both sides learn) |
| Access | Public, pinned SHAs | Often private, by invitation |
| Publishable | Yes (`publish: true`) | Yes, like the rest of `studies/`. We can make a case private later if it needs to be |
| Output | Evidence for a decision | **Comparative highlights** for each side |
| Relationship | None | A person whose trust matters more than the findings |

### Where the code lives

Regular studies follow the pattern in `studies/README.md` and
`studies/context-v/prompts/Create-a-new-Study.md`: each study is its own
`lossless-group/study-<slug>` repo, with references nested inside it as
submodules. That doesn't fit here:

- The collaborator's repo is often **private**. Nested in a study repo,
  it won't clone for anyone who wasn't given access, so the study can't
  be cloned with all its references the way the others can.
- We only need **one copy** of their code, and no nested references.

So `studies/collaborations/` is a **plain folder in ai-labs**, not a
promoted `study-*` submodule repo (decided 2026-10-03). Each collaborator
gets one folder, with their code mounted read-only inside it as an
ai-labs submodule beside our notes:

```
studies/collaborations/<name>/
├── README.md               # what this is, ground rules, link here
├── <name>-codebase/        # their repo, an ai-labs submodule (read-only)
└── *.md                    # our notes and comparative highlights
```

The submodule's `.gitmodules` entry carries a comment marking it as not
ours and read-only.

## The comparison: dimensions to walk

These are prompts, not a checklist to fill in mechanically. Skip any that
don't apply. For each one, note what **they** do, what **we** do, and
which way the insight flows.

1. **Agent configuration surface.** `CLAUDE.md` / `AGENTS.md`, slash
   commands, skills, settings, hooks. How much do they tell the agent, and
   where? Do instructions live in one file or many? How do they stop them
   drifting?
2. **Context management.** Our `context-v/` (specs, plans, prompts,
   explorations, issues, …) against whatever they use: a `docs/` folder,
   `Notes/`, a `TODO.md`, nothing at all. What does the agent read before
   it starts work?
3. **Skills and reuse.** Do they package repeatable know-how for the agent?
   Is it per repo or shared? Compare with our single-source
   `lossless-agent-skills` setup and its symlink sync.
4. **Planning to shipping.** How an idea becomes a spec, then a plan, then
   commits. Sprints, phases, loops, PRs. How much ceremony, and does it
   pay for itself?
5. **Verification.** Tests, checklists, browser drives, measurement
   designs. How do they know the agent's work is right?
6. **Git and history.** Commit-message conventions, branching, PR
   discipline, changelogs. Can a reader (or an agent) reconstruct *why*
   from the history?
7. **Architecture and stack.** Hosting, data layer, functions or servers,
   auth, secrets. Choices made for agent-friendliness compared with
   choices made despite it.
8. **Harness and model choices.** Which agents and models they use for
   what, and how they work around each one's quirks.
9. **Domain craft.** The thing their app is actually good at. This is
   often where the most surprising lessons are, and the least likely to
   show up in our own work.

## Deliverable: comparative highlights

One file per collaborator, in `studies/collaborations/<name>/`, shaped
roughly like this:

- **Snapshot.** What the codebase is, the commit we read (SHA + date), and
  which parts we looked at.
- **Convergences.** Places where both silos arrived at the same idea on
  their own. These are the most trustworthy patterns.
- **What we could take from them.** Concrete, each with a file path in
  their repo and the place it would land in ours.
- **What they could take from us.** Concrete, each tied to something we
  actually saw in their repo, with a pointer to our skill, file, or
  convention. Rank by payoff for *their* setup, not by how proud we are
  of it.
- **Deliberate differences.** Places where each silo's choice is right for
  its own context. Name them so nobody "fixes" them.

Keep the "what they could take from us" half to a handful of items. If
there are twenty, they will adopt none.

## Ground rules

- **Read-only.** Never commit, push, branch, or refactor inside their repo.
  Notes live on our side.
- **Ideas, not code.** We borrow patterns, not their source. If a snippet
  is worth copying, ask them.
- **Public, like the rest of `studies/`.** Our notes are public as part of
  ai-labs. Write them as if the collaborator will read them, because they
  might. Leave out secrets, credentials, and anything they've told us in
  confidence. If a case needs to be private, we'll move it later.
- **Translate, don't transplant.** Our conventions grew from a
  27-project pseudomonorepo. Much of it is overhead for a single-app repo.
  Suggest the smallest version that would help them.
- **"Ahead" is a single axis at best.** Being further into agent tooling
  doesn't make us better at their domain, their product, or shipping to
  real users. Go in expecting to learn at least as much as we teach.
- **Cite paths and SHAs.** Same discipline as any study. A finding without
  a file path is a hot take.

## First case

A friend's private app, mounted in its own folder under
`studies/collaborations/` on 2026-10-03 (about 280 commits, last on
2026-10-01). Seen at the top level so far, before any real reading:

- **Agent surface:** `.claude/` with `commands/`, `skills/`, and
  `settings.json`. They package agent know-how per repo, much as we do.
  What's in those skills is the first thing to compare.
- **Context:** `docs/` holds design and architecture notes (exam
  generator architecture, check-in flow, exam-integrity measurement
  designs, TTS providers, privacy). Also `Notes/`, `TODO.md`, and a
  builder folder. This is their counterpart to `context-v/`.
- **Stack:** Firebase (Hosting / App Hosting, Firestore and its rules,
  Storage, Functions).
- **Domain:** spoken exams or dialog assessment with integrity measurement
  (speech rate, lexical signals). Probably the richest seam for "what we
  learn from them".

Notes go in that collaborator's folder, beside the mounted code.

## Open questions

- **How do we share the "what they could take from us" half?** A markdown
  file they can read, a call walking through it, or a PR to *their* repo
  that adds a starter `context-v/` or skill (only if they ask)?
- **Reciprocity.** Do we invite them to run the same pass on our silo?
  Their view of where our setup is overbuilt might be the most useful
  output of all.

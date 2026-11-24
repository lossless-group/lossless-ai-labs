---
type: Explorations
title: "Memory for Context-V, and the Hindsight Question"
description: "Should the kit add an agent-memory layer, and is Hindsight the one to recommend?"
lede: "Context-v is already agent memory that people can read. Hindsight is memory that writes itself. The question is how the two fit together without context-v becoming a second copy."
summary: "Hindsight (Vectorize) went 1.0 in October 2026 and now ships one Coding Agents package that gives about twenty harnesses a shared memory bank per repo, fed automatically from git history and past sessions. It seeds five pages per repo (component map, core concepts, conventions, key decisions, initiatives) that overlap heavily with what context-v folders already hold. This exploration compares the two, lists four ways the kit could respond, and recommends a two-way bridge: recommend Hindsight as a companion bound to the `memory` role, ingest context-v into the bank so recall carries the written record, and have `reflect` turn well-proven observations into candidate context-v docs a human approves. It proposes a two-week trial on this repo in local-daemon, opt-in-only mode, with done-conditions, and lists the costs and risks."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.1.0
status: Open
tags:
  - Exploration
  - Context-Vigilance
  - Agent-Memory
  - Hindsight
  - Companions
  - Roles-Not-Tools
  - Claude-Code
site_uuid: ecafe167-3238-4d1e-b886-7efb5b23f92a
hex_code: jhtyqh
from: "context-vigilance-kit"
from_path: "context-v/explorations/Memory-for-Context-V-and-the-Hindsight-Question.md"
---
# Memory for Context-V, and the Hindsight Question

## Why care?

The kit's own README says context-v is "agent memory you can read, edit, and version like code." That claim now has competition. Hindsight's pitch to coding agents is nearly the same promise, delivered the other way round: nobody writes anything, and the agent still starts each session knowing the project's decisions.

If we ignore it, two things happen. People who install both get two records of the same project that drift apart. And context-v.dev keeps describing memory as a problem only context-v solves, which a visitor who has just read about Hindsight won't believe.

If we copy it, we drop the thing context-v is for: a record a person reviews, in git, that survives without a running service.

So the useful question isn't "Hindsight or context-v." It's which half of the job each should do, and what the kit should say about it.

## What Hindsight is now

Hindsight is already in the `memory-layers-for-agents` study, with a full profile (`ai-labs/studies/memory-layers-for-agents/context-v/profiles/Profile__Hindsight.md`). The pin was taken 2026-05-26, before the releases that made it popular. It was moved to v1.2.3 (2026-11-21) on 2026-11-23 and the profile now covers 1.x, but here is the short version of what changed.

- **1.0 shipped on 2026-10-13**, and 1.2.3 on 2026-11-19. The repo (`vectorize-io/hindsight`, MIT) has about 62,700 stars as of 2026-11-22.
- **The core design is unchanged.** Memory is typed at write time: world facts, the agent's own experiences, and observations consolidated from both, with curated mental models on top. Three verbs: `retain`, `recall`, and `reflect`, an agent loop over the bank's own contents that has to cite the memory IDs it used. Everything runs on one Postgres. The profile covers this in depth.
- **Hindsight Models (2026-11-03).** Vectorize trained a small decision model (`hs-decide-1-flash`), a reranker, and an embedding model for memory work, with open weights and a hosted API. The decision model takes over the many small judgments (is this fact new, does this memory matter here) that used to go to a general LLM. Vectorize reports 2.5x cheaper and 2x faster.
- **One Coding Agents package replaced the per-agent plugins.** The old Claude Code plugin, which is the one our pinned copy has, is retired. The new package (`npx @vectorize-io/hindsight-coding-agents install claude-code`) wires about twenty harnesses, including Claude Code, Codex, opencode, Cursor CLI, Copilot CLI, Devin and pi, to **one bank per repo** (`coding-agent::{gitProject}`), shared by every agent.
- **Ingestion is automatic.** Git history and agent transcripts flow into the bank in the background. A hook injects relevant memories before each prompt, and a Stop hook retains after each reply.
- **It seeds five pages per repo**, each synthesized from the bank and refreshed on a schedule: *Component map*, *Core concepts*, *Conventions and patterns*, *Key decisions and rationale*, and *Initiatives and enhancements*. Agents read them through `hindsight_search_pages`, `hindsight_list_pages` and `hindsight_read_page`. You can reword them (`pages`) or add your own (`customPages`) in `~/.hindsight/coding-agent.json`.
- **The evidence it cites.** On AMB's sdebench (61 real repo tasks, three runs each), every agent solved 60 or 61 of the 61 with or without memory. What changed was corrections per task (Claude Code 0.85 → 0.36) and cost per task ($0.445 → $0.338). These figures come from Vectorize's own page; treat them as vendor-reported until we see them run elsewhere. Their framing is the honest one, though: memory doesn't make a good agent solve more, it saves the round trips where you stop it and explain a decision it couldn't have known.

That last point is the reason it's worth our time. It's the same failure context-v exists to prevent.

## Where it overlaps with context-v

Hindsight's five pages map almost one to one onto context-v folders:

| Hindsight page | What context-v already has |
|---|---|
| Component map | `blueprints/`, `mirrors/`, and graphify's code graph |
| Core concepts | `specs/`, glossary-style `reminders/` |
| Conventions and patterns | `habits/`, `reminders/`, agent skills |
| Key decisions and rationale | `decisions/`, the decisions log at the end of specs and explorations |
| Initiatives and enhancements | `plans/`, `explorations/`, `changelog/` |

The difference is who writes them and who checks them.

| | context-v | Hindsight |
|---|---|---|
| Written by | a person and an agent, on purpose | an LLM, from transcripts and commits, automatically |
| Reviewed | in a diff, before it lands | not reviewed; consolidation rewrites it as evidence arrives |
| Lives in | the repo, in git | a Postgres bank (cloud, self-hosted, or a local daemon) |
| Survives without a service | yes | no |
| Readable by a stranger | yes; that's one of the three readers | only through the control plane or the agent |
| Catches what nobody wrote down | no | yes; this is its whole advantage |
| Cost | attention | an LLM call per extraction and per page refresh |

Context-v is curated memory. Hindsight is captured memory. Each covers the other's blind spot. Context-v misses whatever nobody thought to write down. Hindsight holds things nobody has checked, and reshapes them whenever new evidence comes in.

We also already built a manual version of Hindsight: the Chroma collections `claude-code-sessions` and `claude-code-tool-traces` in `context-v-corpus`, which we re-ingest by hand. Hindsight does the same capture continuously, sorts each memory by type, and synthesizes from it. That's an argument for at least testing it, and a warning: it would also be a second store of the same transcripts.

## Four ways the kit could respond

### A. Say nothing; context-v is the memory

Keep the zero-infrastructure story and change nothing. Cheapest. But it ignores what people are installing, and it leaves the drift problem to every user who runs both.

### B. Recommend Hindsight as a companion, like graphify, Archify and Floorplan

Add it to `DEPENDENCIES.md` and the getting-started page, pointing at the vendor's package and never copying it, as we do for the others. Bind it to the `memory` role in `context-v/config.md`. This is the minimum honest answer, but on its own it creates two unconnected records.

### C. Bridge the two (recommended)

Recommend Hindsight as in B, and connect the two directions:

1. **Context-v into the bank.** The written record should be what recall finds first, not a transcript that disagrees with it. Ingest `context-v/` through `hindsight_ingest_document` with a `source:context-v` tag, and use `customPages` and `pages` so the seeded pages are asked about the docs (for example, *Key decisions and rationale* reads `decisions/` first). With `observationScopes: "per_source"`, "what the docs say" and "what was said in sessions" stay separate and can be compared.
2. **Bank into context-v, through a person.** The `reflect` skill already closes out work. It gains one step: ask Hindsight what it has observed often (a high `proof_count`) that no context-v doc covers, and propose each one as a draft in `decisions/`, `reminders/` or `habits/`, citing the memory IDs. A person accepts, edits, or drops each draft. Nothing becomes part of the record without review.
3. **The boundary stays the one we already set** in the portable-plugin exploration: context-v is the shared, durable record, and memory is a private cache. Nothing exists only in memory. The bridge just makes the cache useful in both directions.

This keeps the kit's tenet (companions are recommended, never required; every skill works without them) and gives context-v something new to say: the docs are what memory is checked against.

### D. Build our own capture layer

Extend the Chroma ingesters into continuous capture with typed extraction. No. That's Hindsight, rebuilt worse, and the study exists so we don't do this.

## What it would cost, and what could go wrong

- **The default sends your prompts to Vectorize.** The installer's default server mode is `cloud`. For our repos and clients' repos, the trial has to use `--server daemon` (local) or a self-hosted server, and the kit's guidance has to say so plainly.
- **Memory is on for every repo by default.** Set `optInOnly: true` with explicit `optInPaths`. A cloned client repo shouldn't start being remembered because someone opened it. Hindsight deliberately has no repo-carried config, so this lives in each person's `~/.hindsight/coding-agent.json`, not in the kit.
- **Transcripts hold secrets.** Retained sessions can contain keys and client details. Hindsight has an optional per-bank Memory Defense setting that redacts secrets and personal data before storage; turn it on for any bank that holds client work.
- **macOS needs a current Rust toolchain** for the local daemon, because one of its dependencies (`litellm`) ships no Mac wheels. Fact extraction also needs an LLM: an API key, or the Claude Code CLI with no key.
- **LLM spend.** Every extraction and every page refresh is a call. The new decision model is meant to cut this. Measure it during the trial.
- **Two truths.** Hindsight has no supersession chain. When a decision changes, the old fact stays and only the observation above it moves on. If a context-v doc and a Hindsight page disagree, the agent has to know the doc wins. That's an instruction for the kit's agent skills, and it has to be tested, not assumed.
- **Churn.** The plugin we pinned in May was retired within six months, and the tool names were renamed once already. Whatever the kit says about Hindsight should point at the vendor's docs, not restate their config.

## Proposed trial

Two weeks on this repo (`context-vigilance-kit`), local daemon, opt-in only, Claude Code first.

1. ~~Bump the study pin in `memory-layers-for-agents` and refresh the Hindsight profile for 1.x and the Coding Agents package.~~ Done 2026-11-23.
2. Install with `--server daemon --import-conversations`, opted in for this repo only, with Memory Defense on.
3. Ingest `context-v/` with a `source:context-v` tag, and set `customPages` so the decisions and conventions pages read the docs first.
4. Work normally. Note every time the agent had to be corrected on a project decision, with and without memory, as a rough repeat of the sdebench measure.
5. At the end, read the five pages against context-v and sort every difference: Hindsight is wrong, the doc is stale, or the doc is missing.

**Done when:**

- We know whether corrections dropped, roughly, and what it cost in LLM spend.
- Every page-versus-doc difference is sorted into one of those three outcomes, and each "doc is missing" became a doc or a deliberate no.
- We can say whether the `reflect` bridge (step 2 under C) is worth building.

If it earns its place, then the kit changes: a `DEPENDENCIES.md` entry, a getting-started companion card, a `memory` row in the config example, the `reflect` step, and a context-v.dev pattern page.

## What context-v.dev would say

A new pattern page, roughly: **Curated memory and captured memory.** Context-v is the record a person signs off on. A memory layer like Hindsight captures what nobody wrote down. Use both, point the memory at the docs, and turn what it learns into docs you review. That's a stronger claim than "context-v is agent memory," and it's one a visitor who has heard of Hindsight can check against what they know.

## Open questions

- **"Memory for context-v.dev" could mean three things.** This exploration reads it as memory for the kit and the practice it teaches. It could also mean memory on the website itself (a visitor asking questions that remembers them), or for the corpus site at `lossless-group.github.io/context-v-corpus`, which already has Pagefind and Chroma behind it. Those are different projects.
- **Does Hindsight replace graphify as the default `memory` provider?** The portable-plugin exploration made graphify the default because it needs no LLM and no database. They do different jobs: graphify maps code structure, and Hindsight remembers decisions. The likely answer is to split the roles: graphify for `context.code_graph`, Hindsight for `memory`.
- **One bank per repo, or one per pseudomonorepo?** Our tree has 27 projects and many share conventions. A shared bank with `retainTags: ["project:{gitProject}"]` is possible; per repo is the default.
- **Does a Hindsight bank replace the Chroma session collections, or sit beside them?** Running both doubles the cost of storing the same transcripts.
- **Should the kit ship a Hindsight-aware skill, or only instructions?** Hindsight ships its own companion skill. We'd rather not vendor it; a few lines in `reflect` and `kickoff` may be enough.

## See also

- `ai-labs/studies/memory-layers-for-agents/context-v/profiles/Profile__Hindsight.md`: the full profile (pinned at v1.2.3, 2026-11-21)
- `ai-labs/studies/memory-layers-for-agents/README.md`: the other memory systems studied (Mem0, Letta, Graphiti, Supermemory, Beads, and more)
- [[Context-V-as-a-Portable-Plugin-Any-Agent-Can-Install]]: the `memory` role, its providers, and the rule that nothing exists only in memory
- [Hindsight Coding Agents docs](https://hindsight.vectorize.io/sdks/integrations/coding-agents)
- [Introducing Hindsight Models](https://hindsight.vectorize.io/blog/2026/11/03/hindsight-models) (2026-11-03)
- [Hindsight is 20/20: Building Agent Memory that Retains, Recalls, and Reflects](https://arxiv.org/abs/2512.12818) (arXiv, December 2025)

---
name: pstack Profile
slug: pstack
upstream: https://github.com/backnotprop/pstack
package: "`npx skills add backnotprop/pstack` (mirror, any Agent-Skills harness); `/add-plugin pstack` in Cursor; `/plugin marketplace add cursor/plugins` then `/plugin install pstack@cursor-plugins` in Claude Code"
license: MIT
maintainer: Lauren Tan (Poteto) upstream at `cursor/plugins/pstack`; standalone mirror kept by backnotprop
study: studies/agent-skill-packs
profile_path: studies/agent-skill-packs/pstack
profile_kind: engineering skill pack with a separate principles layer, one router skill with 22 playbooks, two plugin manifests, a per-harness adapter, and a two-branch mirror process
title: "pstack — Profile"
status: Reference
authors:
  - Michael Staton
date_created: 2026-11-22
date_modified: 2026-11-22
site_uuid: 21391de2-e995-467c-9477-bc88c117fe6b
hex_code: gn0cjm
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
lede: >-
  Fifty-eight skills, twenty-four of them one-rule principles, nearly all
  switched off for model invocation and reached instead through one router,
  `poteto-mode`, that matches a task to one of 22 playbooks and reads each
  principle it applies; shipped with two plugin manifests, a ten-page guide, a
  Claude Code adapter, and a mirror that logs every upstream check.
summary: >-
  Source-cited profile of `pstack` as mirrored by backnotprop from Poteto's
  `cursor/plugins/pstack` (pinned at c3464c1, plugin version 0.15.46, MIT).
  Covers the principles-vs-workflows split, the router-plus-playbooks shape,
  the `disable-model-invocation` stance that turns triggering into an explicit
  act, the per-role model settings file, the Claude Code mapping doc, the
  `worker.md` kickoff that carries rules into subagents, the `upstream`/`main`
  mirror branches and `SYNC-LOG.md`, and a direct comparison with our own
  `lossless-agent-skills`. Read it when deciding how to layer a pack, how to
  make it installable by strangers, or how to keep a mirror honest.
publish: true
type: Profiles
from: "studies/agent-skill-packs"
from_path: "context-v/profiles/Profile__pstack.md"
---
# pstack — Profile

A profile of `pstack` as it lives in this study (`studies/agent-skill-packs/pstack/`, pinned at `c3464c1`, 2026-11-20). Every claim cites a pinned path relative to the submodule. Read it alongside [[Profile__seo-skills]], [[Profile__mattpocock-skills]], and [[Profile__gstack]]. This entry is the study's clearest case of a pack with a separate *principles* layer and a single router that decides which skills run.

## TL;DR

- **58 skills, two layers.** 24 `principle-*` skills hold one engineering rule each; 34 task skills (`architect`, `arena`, `swarm`, `interrogate`, `tdd`, `unslop`, `blast-radius`, …) do the work. The README calls the principles "twenty-four short skills, one principle each" (`README.md:304`) and tables them by group: core, architecture, verification, delegation, meta (`README.md:309-334`).
- **One router.** `poteto-mode` matches a task to one of 22 playbooks under `skills/poteto-mode/playbooks/`, copies its steps into a todo list, and routes to other skills as steps fire (`skills/poteto-mode/SKILL.md:118-122`; `README.md:177-181`).
- **Model invocation is off almost everywhere.** 57 of 58 skills set `disable-model-invocation: true`; only `setup-pstack` leaves it on (`skills/setup-pstack/SKILL.md:1-4`). Skills load because the user typed them or because `poteto-mode` told the agent to read them.
- **Built for strangers.** Two plugin manifests (`plugin.json:1-21`; `.cursor-plugin/plugin.json:1-31`), a ten-page guide (`docs/guide/README.md:7-16`), a help skill (`skills/poteto-help/SKILL.md:9`), a Claude Code adapter (`docs/harness/claude-code.md:1-68`), and a table of which skills need which others (`README.md:50-63`).
- **The mirror is disciplined.** `upstream` holds Cursor's files untouched, `main` holds the mirror's edits, and sync is a merge (`MIRROR.md:5-30`). `SYNC-LOG.md` has 35 rows from 2026-10-04 to 2026-11-20, including days with no change (`SYNC-LOG.md:3-41`).

## Why this exists — the design bet

The bet: **an agent writes less and better code if it carries a small set of named rules it has actually read, and if one entry point decides which workflow and which rules apply.** Poteto frames the pack against "slop code": "the goal is not to maximize loc, in fact it's the opposite" (`README.md:85-87`). Parallelism is the payoff: "when you can go deep on one agent and trust it to write good, verifiable code, you can truly parallelize with confidence" (`README.md:89`).

The principles are kept separate so they can be cited by name. "The standalone files are there so other skills can reference a principle by name, and so the index can point at the full rule for each" (`README.md:304`). The router enforces reading over recall: "Cite only principles whose leaf SKILL.md you read this session" (`skills/poteto-mode/SKILL.md:15`). The guide turns the names into a steering vocabulary for the human: "You don't invoke principles. You use their names to steer" (`docs/guide/08-principles.md:5`), with examples such as "apply prove it works. run the real import flow and show me the written records" (`docs/guide/08-principles.md:17-19`).

Two refusals define scope:

- **No planning skill.** "personally, i don't believe in planning. the best spec is code" (`README.md:350`).
- **Not one person's style forever.** "`poteto-mode` is my style. you may not want exactly that" (`README.md:354`); `/automate-me` drafts a `<your-name>-mode` from your own transcripts (`README.md:356`).

## What's inside this submodule

```
pstack/
├── plugin.json                    agent-plugins.org schema, v0.15.46
├── .cursor-plugin/plugin.json     Cursor manifest: skills ./skills/, agents ./agents/, logo, tags
├── skills/
│   ├── poteto-mode/               router: SKILL.md (122 lines), worker.md,
│   │   ├── playbooks/             22 playbooks (bug-fix, feature, hillclimb, shipping, …)
│   │   └── scripts/               watch-pr (TS + tests), worktree-audit.sh, bootstrap.ts
│   ├── principle-*/               24 one-rule skills, 9-21 lines each
│   ├── poteto-help/ setup-pstack/ onboarding and per-role model config
│   ├── statechart/                TLA+ -> Mermaid compiler with a test corpus
│   └── 30 other task skills       architect, arena, swarm, interrogate, tdd, unslop, …
├── agents/                        poteto-agent.md (delegate wrapper), comment-sicko.md
├── automations/benny/             dormant Cursor-only pack, 3 skills, not registered
├── docs/guide/                    README + 10 pages + images
├── docs/harness/claude-code.md    Cursor-name -> Claude Code mapping tables
├── MIRROR.md  SYNC-LOG.md         mirror process and its log
└── README.md                      mirror section (lines 1-75) + upstream README (77-370)
```

The `SKILL.md` files run from 7 lines (`skills/bro/SKILL.md`, `skills/in-your-own-words/SKILL.md`) to 162 (`skills/poteto-help/SKILL.md`). Principles are tiny: `principle-encode-lessons-in-structure` is two sentences of body (`skills/principle-encode-lessons-in-structure/SKILL.md:7-11`).

## How it scores against the study checklist

### Shape

Flat. Every skill is `skills/<name>/SKILL.md`, and the only grouping is the `principle-` name prefix. Grouping happens in prose instead: the README's principle table has a `group` column (`README.md:309`), and the router's index uses bold headings Core, Architecture, Verification, Delegation, Meta (`skills/poteto-mode/SKILL.md:35-72`). Workflow depth lives *inside* one skill: the 22 playbooks are files under `skills/poteto-mode/playbooks/`, not skills of their own (`README.md:146-171`). Code ships next to the skill that runs it, with tests (`skills/poteto-mode/scripts/watch-pr/*.test.ts`; `skills/statechart/scripts/test/`).

### Layers

Three layers, each with a clear job:

| Layer | What it holds | Source |
|---|---|---|
| Principles | One rule, one trigger condition in `description` | `skills/principle-prove-it-works/SKILL.md:3,9-11` |
| Task skills | A workflow that cites principles and other skills by name | `skills/teach/SKILL.md:11` (runs `how` and `why`); `skills/teach/SKILL.md:19` (writes through `unslop`) |
| Router | Non-negotiables, the principles index, autonomy rules, subagent and model defaults, harness mappings, playbook list | `skills/poteto-mode/SKILL.md:13-122` |

Skills call each other by path, not by restating: "Bundled skills live at `../<name>/SKILL.md` from this file" (`skills/poteto-mode/SKILL.md:11`), and the authoring playbook says "Delegate to other skills by path. Don't restate" (`skills/poteto-mode/playbooks/authoring-a-skill.md:10`). The README spells out the dependency graph for people installing a subset: 18 skills stand alone, and a table lists what to co-install for the rest, e.g. `blast-radius` needs `arena`, `how`, `why`, `unslop` (`README.md:46-63`).

Rules reach subagents through a file, not memory. Every kickoff starts "`Read <path>/worker.md before anything else.`" (`skills/poteto-mode/SKILL.md:20`), and `worker.md` fixes the bar, the stop conditions, and the PR shape (`skills/poteto-mode/worker.md:1-11`). The `poteto-agent` wrapper reads `poteto-mode` in full before any work (`agents/poteto-agent.md:10`).

### Install

| Harness | How | Source |
|---|---|---|
| Any Agent-Skills harness | `npx skills add backnotprop/pstack`, pick skills and agents from a searchable list | `README.md:34-40` |
| Cursor | `/add-plugin pstack`; manifest points at `./skills/` and `./agents/` | `README.md:97-99`; `.cursor-plugin/plugin.json:29-30` |
| Claude Code | `/plugin marketplace add cursor/plugins`, `/plugin install pstack@cursor-plugins`; commands become `/pstack:<name>` | `README.md:103-110` |

Upstream generates the Claude Code copy and CI fails when it is stale (`README.md:112`). Harness differences are written down, not guessed: the router's Harness section maps subagent tools, transcript paths, and skill folders for Claude Code, Codex, Pi, and OpenCode (`skills/poteto-mode/SKILL.md:102-112`), and `docs/harness/claude-code.md` gives full Cursor-to-Claude-Code tables for tools, subagent fields, model slugs, paths, and Cursor-only features, with a fixed skip line for the last (`docs/harness/claude-code.md:5-68`).

Configuration is per user, not per skill. `/setup-pstack` writes one model-per-role file: `~/.cursor/rules/pstack-models.mdc`, `~/.claude/rules/pstack-models.md`, or `~/.agents/pstack-models.md` (`skills/setup-pstack/SKILL.md:8-12`), versioned with a `# defaults: 3` line so re-runs can tell old defaults from user choices (`skills/setup-pstack/SKILL.md:24-34,54-74`). Every skill falls back to defaults when the file is absent (`README.md:358`).

### Triggering

Explicit, almost entirely. With `disable-model-invocation: true` on 57 skills, descriptions do not auto-load anything. They act as a menu for humans and a trigger list for the router. Principle descriptions all lead with "Apply when…" (`skills/principle-attack-the-premise/SKILL.md:3`; `skills/principle-never-block-on-the-human/SKILL.md:3`), and the router's index repeats each condition so the agent can match it without loading every leaf (`skills/poteto-mode/SKILL.md:33-72`). Task skill descriptions name the slash command and phrasings: "Use for /arena, 'arena this', 'throw it in the arena'" (`skills/arena/SKILL.md:3`).

Two exceptions to plain text triggering: `typescript-best-practices` adds a `paths: ["**/*.ts", "**/*.tsx"]` glob (`skills/typescript-best-practices/SKILL.md:3-4`), and `poteto-mode` can be made sticky as a Cursor custom mode (`README.md:185`). In Claude Code "The `Skill` tool refuses most pstack skills", so the adapter says to `Read` the `SKILL.md` instead (`docs/harness/claude-code.md:12`). For lost users, `/poteto-help` answers, hands back a prompt, and does not start work, "because a pstack run spends real tokens" (`skills/poteto-help/SKILL.md:9`; `docs/guide/README.md:26`).

### Sync

The mirror keeps Cursor's files and its own edits apart on two branches: "`upstream` holds Cursor's files exactly, with no local edits. `main` is `upstream` plus this mirror's edits" (`MIRROR.md:7-8`). Sync is an `rsync --delete` onto `upstream` followed by `git merge upstream` on `main` (`MIRROR.md:14-30`). Conflicts keep Cursor's meaning and reapply the harness-neutral wording (`MIRROR.md:32`). Scope is policed: "Carry only bug fixes. A PR that changes what a skill tells the agent … belongs upstream at cursor/plugins. Decline it here" (`MIRROR.md:36`). A grep catches new Cursor-only words after each sync (`MIRROR.md:41-45`). Every check gets a row, "Add one also when nothing changed upstream" (`MIRROR.md:47`), and the log records when a local patch was dropped because upstream shipped its own fix (`SYNC-LOG.md:8`). The README's mirror section is fenced by `<!-- mirror:start -->` / `<!-- mirror:end -->` so the upstream README below it stays verbatim (`README.md:1,75`).

The mirror's own edits are listed for users: harness-neutral rewrites plus two community fixes not yet upstream (`README.md:67-74`).

***

## Compared with lossless-agent-skills

Our baseline is `context-v/agent-skills/` at the anchor root (`lossless-agent-skills`). Paths below are relative to that folder.

**Where pstack is more advanced:**

| Dimension | pstack | lossless-agent-skills |
|---|---|---|
| Shape | One domain (engineering), 58 skills, principle prefix plus group column | 43 top-level folders with a `SKILL.md`, one flat directory; a single README table (`README.md:20-57`) mixes repo conventions (`git-conventions`, `context-vigilance`), Astro site rules (`astro-knots`, `theme-system`), VC analysis (`market-capture-analysis`), CRM operation (`lossless-crm-interface-guidelines`), and event prep (`event-prep`) |
| Principle layer | 24 one-rule skills the router indexes and cites | None. Rules live inside long workflow skills; the `pseudomonorepos` description alone is one paragraph of triggers and rules (`pseudomonorepos/SKILL.md:3`) |
| Router | `poteto-mode` plus 22 playbooks | None. Every skill is model-invoked from its own description |
| Dependency map | Co-install table (`pstack README.md:50-63`) | Skills cite each other in prose; no table of what needs what |
| Manifest | Two plugin manifests with version | None; no `plugin.json` or marketplace entry anywhere in the repo |
| Install for outsiders | `npx skills add`, Cursor plugin, Claude Code marketplace | Clone the whole repo into `~/.claude/skills` or `pi install` (`README.md:71-105`); no way to take a subset |
| Per-harness docs | Harness section plus `docs/harness/claude-code.md` | "Clone anywhere and point your tool's skills configuration at the directory" for Codex and others (`README.md:95-97`) |
| User docs | Ten-page guide, help skill | Per-skill `SKILL.md` only; no guide pages |
| Versioning | `version` in both manifests, sync log per check | No pack version; history lives in `changelog/` |

Two practices hurt outside use in particular. First, our sync tooling is built for our own machines: `sync-skills-symlinks.sh` scans the whole monorepo for `context-v/agent-skills/` and `context-v/skills/` folders and lets the most recently modified copy win (`sync-skills-symlinks.sh:11-29`), which means nothing to someone who cloned only this repo. Second, skills are copied into projects as real directories: `ai-labs/dididecks-ai/context-v/agent-skills/` holds 16 skill folders that share names with the anchor (`pseudomonorepos`, `theme-system`, `astro-knots`, …), and its `theme-system/SKILL.md` already differs from the anchor's. `AUTHORING.md` forbids exactly this ("Don't vendor a copy into a project's `context-v/skills/`", `AUTHORING.md:63`). pstack avoids the problem by having one install target and a router that reads siblings by relative path (`skills/poteto-mode/SKILL.md:11`).

Small drift worth noting, not fixing here: our `CLAUDE.md` still says the repo mounts at `context-v/skills/` (`CLAUDE.md:6`), and `README.md` names the repo `lossless-skills` in its install commands (`README.md:76,92`).

**What we do that pstack does not:**

- **Public skills, private config.** A gitignored `config/private.json` per skill, documented by a committed `private.example.json`, read by instruction, with a pre-push audit grep (`README.md:154-249`). Five skills use it (`lossless-crm-interface-guidelines`, `hubspot-interface`, `augment-speakers-panelists`, `cloudflare-artifacts-interface`, `maintain-splash-pages`). pstack's only user config is the model file.
- **A written policy for third-party skills.** `THIRD-PARTY.md:9-17` picks submodule, fork, vendored copy, or mined pack by situation, and says never to copy a dependency's instructions into ours (`THIRD-PARTY.md:33-36`). pstack bundles everything it ships and simply lists what it does not (`pstack README.md:338-346`).
- **A changelog and a public site.** 49 entries in `changelog/` and a `splash/` Astro site deployed by `.github/workflows/pages.yml`. pstack's history is the sync log and plugin version.
- **Breadth.** Our pack covers a whole practice (content, CRM, VC analysis, events), not one discipline. That is also why it needs grouping more than pstack does.
- **Model-invoked triggering.** Our long descriptions let skills load without the user knowing their names. pstack trades that away for predictability.
- **Pi and Stow.** `pi install` support (`README.md:73-77`) and a `.stow-local-ignore` for Linux machines (`.stow-local-ignore:1-21`).

## What we'd borrow

1. **A plugin manifest with a version.** Add a `plugin.json` on the `agent-plugins.org` schema and a `.claude-plugin/` marketplace entry so `npx skills add lossless-group/lossless-agent-skills` and `/plugin install` let people pick a subset. Model: `plugin.json:1-21`, `.cursor-plugin/plugin.json:29-30`, `README.md:34-40`.
2. **A principle layer split out of the long skills.** Pull the repeated rules (search before creating, never commit inside vendored submodules, `***` not `---`, one source of truth) into short `principle-*` skills with "Apply when…" descriptions, and have workflow skills cite them by name. Model: `skills/principle-prove-it-works/SKILL.md:1-11`, `README.md:304`.
3. **A router or help skill per domain.** Group our 43 skills into domains (repo conventions, Astro sites, VC analysis, CRM, events) and give each a short router that indexes its skills and triggers, plus one `lossless-help` that answers "which skill fits" without starting work. Model: `skills/poteto-mode/SKILL.md:31-72,118-122`, `skills/poteto-help/SKILL.md:9-20`.
4. **A co-install table.** One table in our README of which skills need which others, so a subset install does not break. Model: `README.md:46-63`.
5. **A harness adapter doc.** Write down how our Claude Code wording maps to pi and Codex instead of "point your tool at the directory." Model: `docs/harness/claude-code.md:1-68`, `skills/poteto-mode/SKILL.md:102-112`.
6. **A `worker.md` for subagents.** Our CLAUDE.md rules do not reach delegates reliably. A short file every subagent kickoff names on its first line would carry the HARD STOP and git rules. Model: `skills/poteto-mode/SKILL.md:20`, `skills/poteto-mode/worker.md:1-11`.
7. **The two-branch mirror and a sync log for our forks.** `humanizer`, `talk-normal`, and `floorplan` are forks; an `upstream` branch plus a per-check log would make their drift visible. Model: `MIRROR.md:5-47`, `SYNC-LOG.md:3-8`.
8. **`/correct` as the answer to repeated corrections.** Fix a mistake class with architecture, then types and lint, then a test, and write a rule last, keeping a table of rule to enforcer. This matches our own "guardrails go in context-v" habit but goes further. Model: `skills/correct/SKILL.md:17-30`, `skills/principle-encode-lessons-in-structure/SKILL.md:7-11`.

## One-line summary

> `pstack` is the study's layered pack: 24 one-rule principles and 34 task skills, almost all hidden from model invocation and reached through one router with 22 playbooks, shipped with two manifests, a guide, a help skill, and a Claude Code adapter, and mirrored on two branches with a log of every upstream check; compared with it, `lossless-agent-skills` is broader and better at keeping private config out of public skills, but flat, unversioned, unrouted, and installable only whole.

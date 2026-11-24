---
title: "How the Packs Define Agents"
lede: "Only pstack ships agent definition files: two Markdown files with frontmatter, registered through a Cursor plugin manifest. gstack and Matt Pocock define no agents at all; their skills spawn generic subagents and describe the role in the prompt. None uses an agent-definition spec."
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Open
site_uuid: 1070442d-b959-42a0-b179-44cf21cb9111
hex_code: ga0wy3
summary: >-
  Compares how pstack, gstack, and mattpocock-skills define and start agents,
  with file structure and pinned citations. pstack is the only one with agent
  files (agents/poteto-agent.md, agents/comment-sicko.md), registered by its
  Cursor plugin manifest and translated for Claude Code by a harness doc, plus a
  worker.md every spawned agent must read. gstack's "roles" are skills; it
  dispatches generic subagents inline and rewrites the call per harness in
  hosts/*.ts. Matt Pocock names subagent roles in skill prose (implementer,
  merger, exploration) and requires a fresh context. Folders named "agents" in
  gstack and Matt Pocock hold Codex skill metadata, not agents. None of the
  three uses any of the agent-definition specs surveyed in the
  agent-workspace-bundles study; all three build on Agent Skills, and pstack's
  root manifest declares the agent-plugins.org schema.
publish: true
type: Explorations
tags: [Agents, Subagents, Agent-Skills, Plugin-Manifests, Skill-Packs]
from: "studies/agent-skill-packs"
from_path: "context-v/explorations/How-the-Packs-Define-Agents.md"
---
# How the Packs Define Agents

Paths are relative to each pack's submodule in this study. For the wider
landscape of agent-definition formats, see
[Ways to Define an Agent](https://github.com/lossless-group/study-agent-workspace-bundles/blob/main/context-v/explorations/Ways-to-Define-an-Agent.md)
in the agent-workspace-bundles study. Profiles: [[Profile__pstack]],
[[Profile__gstack]], [[Profile__mattpocock-skills]].

## At a glance

| | pstack | gstack | mattpocock-skills |
|---|---|---|---|
| Agent definition files | **Yes, 2** (`agents/*.md`) | None | None |
| How a subagent is started | Named type `poteto-agent` (or a general agent told to read the skill) | Generic subagent, prompt written inline in the skill | Generic subagent, role described in skill prose |
| Rules every subagent gets | `skills/poteto-mode/worker.md`, named on the first line of every kickoff | Shared preamble rendered into each skill | "Start every subagent with a fresh context window" |
| Per-harness handling | A mapping doc for Claude Code | Typed host adapters rewrite the dispatch call | None needed: no harness-specific fields |
| What "agents" folders hold | Real subagent definitions | `agents/openai.yaml`: Codex metadata for the root skill | `skills/*/agents/openai.yaml`: Codex metadata per skill; `.agents/`: maintainer docs |
| Specs used | Agent Skills; agent-plugins.org manifest schema | Agent Skills shape (extended frontmatter); an AGENTS.md digest | Agent Skills; Claude Code plugin manifest |
| Agent-definition spec (Agent Spec, ADL, Agent Format, `.af`, …) | No | No | No |

***

## pstack: real agent files

```
pstack/
├── plugin.json                  root manifest, $schema agent-plugins.org 1.0.0
├── .cursor-plugin/plugin.json   Cursor manifest: "skills": "./skills/", "agents": "./agents/"
├── agents/
│   ├── poteto-agent.md          the delegate for /poteto-mode runs (10 lines)
│   └── comment-sicko.md         a single-purpose reviewer that deletes comments (32 lines)
├── skills/poteto-mode/
│   ├── SKILL.md                 the runner: plans, spawns, reviews
│   └── worker.md                rules for any agent it starts
└── docs/harness/claude-code.md  how the Cursor fields map onto Claude Code
```

**The file format.** Markdown with YAML frontmatter, then a prompt body, the
same shape as Claude Code's `.claude/agents/<name>.md`.
`agents/poteto-agent.md:1-6` carries four fields: `name`, `description`,
`is_background: true`, and `model: claude-opus-5-5-xhigh-fast`. The last two
are Cursor's: `is_background` is a Cursor field, and the model is a Cursor slug
that puts reasoning level and speed in the name. `comment-sicko.md` has only
`name` and `description`.

**Registration.** The Cursor manifest points at the folder
(`.cursor-plugin/plugin.json:29-30`). The root `plugin.json` declares the
agent-plugins.org schema (`plugin.json:2`) but lists no skills or agents.

**How it's used.** The skill is the planner and the agent is the worker.
`poteto-mode` says to use `subagent_type: "poteto-agent"` for any subagent it
spawns inside a playbook step (`skills/poteto-mode/SKILL.md:86`), and the agent's
first instruction is to read the `poteto-mode` skill in full before any work.
Where the harness hasn't registered the agent, the skill falls back to a general
subagent whose prompt starts "Read <this file's absolute path> in full…"
(`skills/poteto-mode/SKILL.md:107`). Separately, every agent started for any
reason gets `Read <path>/worker.md before anything else.` as the first line of
its kickoff (`skills/poteto-mode/SKILL.md:20`); `worker.md` holds the
operator's rules (PR shape, when to stop, never ask the user mid-run).

**Portability cost.** The Claude Code mapping doc has to translate: the agents
become `pstack:poteto-agent` and `pstack:comment-sicko`, and the `model:` line
must never reach the API, so every spawn passes `model` and `effort` explicitly
(`docs/harness/claude-code.md:15-22`). The file format travels; the frontmatter
values don't.

***

## gstack: roles are skills, agents are generic

```
gstack/
├── <role>/SKILL.md.tmpl → SKILL.md   office-hours, plan-ceo-review, review, qa, cso, ship, …
├── hosts/*.ts                         one typed adapter per harness (13)
├── agents/openai.yaml                 Codex metadata for the root gstack skill
├── agents-digest/gstack-AGENTS.md     the rules compressed into an AGENTS.md-style file
├── codex/SKILL.md                     a second opinion from the Codex CLI
└── crew/ + captain/                   many agent lanes under one controller (Capy machines only)
```

**No agent files.** The "CEO", "eng manager", and "QA lead" in gstack's pitch
are skills the current agent follows, not separate agents. When a skill needs a
separate worker, it dispatches a general-purpose subagent and writes the prompt
inline. `/ship`, for example, "dispatches the /document-release subagent"
(`ship/SKILL.md.tmpl:353`), and `/document-release` has a section for "When
dispatched as a subagent" (`document-release/SKILL.md.tmpl:47`).

**Per-harness dispatch.** The skill text is written for Claude Code's Agent
tool; the host adapters rewrite it. In Codex it becomes `spawn_agent` with
`fork_turns: "none"`, then `wait_agent` (`hosts/codex.ts:9-11`, rewrites at
`:59-63`); in Antigravity, `invoke_subagent` (`hosts/agy.ts:10`). The adapters
are gstack's answer to the problem pstack's mapping doc solves by hand.

**Other "agent" pieces, none of them agent definitions:**
- `agents/openai.yaml` is Codex UI metadata for the root skill: a display name,
  a default prompt, and `allow_implicit_invocation: true`
  (`agents/openai.yaml:1-6`).
- `agents-digest/gstack-AGENTS.md` is the pack's rules "compressed for agent
  hosts without a full skill install" (`agents-digest/gstack-AGENTS.md:1-4`):
  AGENTS.md as a fallback for skills.
- `codex/` wraps a different vendor's agent as a CLI for reviews and second
  opinions.
- `crew/` and `/captain` run many agent threads from one controller, but only on
  Capy machines (`crew/README.md:1-12`).

***

## mattpocock-skills: roles in prose, a rule about context

```
mattpocock-skills/
├── .claude-plugin/plugin.json          a "skills" array; no agents
├── .agents/                            docs for the agents maintaining the repo
│   ├── invocation.md, install-block.md, writing-docs.md
│   └── adr/0001-…, 0002-…
└── skills/<bucket>/<skill>/
    ├── SKILL.md
    └── agents/openai.yaml              Codex metadata for that skill (38 of 39)
```

**No agent files.** The plugin manifest lists skills only
(`.claude-plugin/plugin.json:21`). Subagents are named roles inside skill prose.
`implement-spec` runs an **exploration subagent**, a fresh **implementer
subagent** per ticket in its own worktree, and a **merger subagent**, and talks
to them "primarily through context pointers" rather than pasted context
(`skills/engineering/implement-spec/SKILL.md:15-42`). `chief-of-staff`
(in-progress) coordinates subagents toward a long-running goal
(`skills/in-progress/chief-of-staff/SKILL.md:3-18`).

**One repo-wide rule.** "Every skill that dispatches a subagent says to start it
with a fresh context window", because some harnesses (Codex) fork the parent
conversation by default (`CLAUDE.md:27`).

**The "agents" folders.** Each `agents/openai.yaml` holds Codex skill-picker
metadata and, for user-invoked skills, `policy.allow_implicit_invocation:
false` (`.agents/invocation.md:10`). `.agents/` is maintainer documentation,
in the AGENTS.md family.

***

## What it means for our packs

- **Two workable patterns.** pstack's (a skill that plans plus a named agent
  file that works) gives a stable role and a place for its rules. gstack's and
  Matt Pocock's (generic subagent, role in the prompt) needs no extra file and
  nothing to register per harness.
- **Keep agent files to `name`, `description`, and the prompt.** pstack's
  `model` and `is_background` are where portability breaks; its Claude Code doc
  exists to undo them.
- **Whichever pattern, give delegates the rules.** pstack's `worker.md` and
  Matt Pocock's fresh-context rule both address the same gap: a subagent starts
  without the parent's instructions unless something hands them over.
- **No spec to adopt yet.** None of the three uses an agent-definition spec.
  What they share is Agent Skills, plus a plugin manifest to install them.

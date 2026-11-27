---
title: "Ways to Define an Agent"
lede: "Skills have one spec with real reach. Agents don't: from the outside, A2A's Agent Card has backing; from the inside (prompt, model, tools, subagents, control flow), sixteen formats compete and none leads."
date_created: 2026-11-22
date_modified: 2026-11-26
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-26
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.3
status: Open
site_uuid: 273e5e90-daaf-49df-befb-4237b25761f9
hex_code: 9ag7o7
summary: >-
  A survey, taken 2026-11-22, of the formats that define an agent as a file
  the way the Agent Skills spec defines a skill. Separates the layers that
  have settled (Agent Skills, AGENTS.md, MCP, the A2A Agent Card) from the one
  that hasn't: defining an agent from the inside. Lists seven cross-framework
  specs (Oracle's Agent Spec, Next Moca's ADL, Agent Format, prime-vector's
  Open Agent Spec, AgentSPEX, Letta's Agent File, Paperclip's Agent
  Companies spec) and nine formats tied to one
  framework or harness. Sits in this study because a bundle has to describe
  the agent that produced it, and Letta's Agent File is already pinned here.
publish: true
type: Explorations
tags: [Agents, Specifications, Agent-Skills, A2A, Agent-File]
from: "studies/agent-workspace-bundles"
from_path: "context-v/explorations/Ways-to-Define-an-Agent.md"
---
# Ways to Define an Agent

## The question

Is there a standard way to define an agent, the way
[Agent Skills](https://agentskills.io/specification) defines a skill? A
LangGraph agent is a graph written in Python and run by the framework; there is
no file you could hand to another runtime. What would that file look like, and
does anyone with clout define it?

**Short answer, as of 2026-11-22: no single standard.** The layers around the
agent have settled. The agent itself has not.

## Skills vs. agents, technically

A **skill** is instructions the current agent follows. It is a folder with a
`SKILL.md`; only its `description` sits in context until it is used, and then
its body is read into the *same* context window. Nothing separate comes back.

An **agent** (in harness terms, a subagent) is a separate worker the current
agent starts and hands a task to. It is usually one Markdown file: frontmatter
(`name`, `description`, often `tools` and `model`) plus a system prompt. It runs
in a *fresh* context window, can have fewer tools or a different model, and
returns only a final report.

Folders named "agents" are not always agents. In the agent-skill-packs study,
`pstack/agents/` holds real subagent definitions (`poteto-agent.md`, spawned by
the `poteto-mode` skill), while Matt Pocock's `.agents/` holds instructions for
the agents maintaining his repo, and each skill's `agents/openai.yaml` is Codex
metadata for that skill.

***

## The layers

| Layer | What it defines | Standard | Clout |
|---|---|---|---|
| Skills | Instructions an agent loads | Agent Skills | High: most harnesses read it |
| Repo guidance | What an agent should know about a codebase | AGENTS.md | High: in the Linux Foundation's Agentic AI Foundation with MCP |
| Tools | How an agent reaches tools and data | MCP | High: same foundation |
| An agent from the outside | What a running agent can do, where to reach it, how to authenticate | A2A Agent Card | Real, for agents running as network services |
| An agent from the inside | Its prompt, model, tools, subagents, control flow | Several competing specs | Low so far |

The A2A Agent Card is profiled in
`studies/open-specs-and-standards/context-v/profiles/Profile__Agent-2-Agent.md`.
It is deliberately opaque: a card publishes an agent's skills and endpoints,
never its prompts, memory, or tools. It is the OpenAPI of agents, not the
`SKILL.md` of agents.

***

## Defining an agent from the inside

### Specs that aim to be a standard

| Spec | Who | Format | What it covers | Note |
|---|---|---|---|---|
| **Open Agent Specification (Agent Spec)** | Oracle | YAML/JSON | Agents and multi-step workflows | Peer-reviewed ([arXiv:2510.04173](https://arxiv.org/abs/2510.04173), [CAIS 2026](https://www.caisconf.org/program/2026/papers/open-agent-specification-a-unified-representation-for-ai-agents/)). Its runtime, WayFlow, runs the files directly. Adapters translate a spec into LangGraph, AutoGen, and CrewAI. Its authors report that runtimes give different results from the same spec. |
| **Agent Definition Language (ADL)** | Next Moca | YAML | Identity, tools, permissions, governance metadata | Apache 2.0, early 2026; pitched as "OpenAPI for agents" ([InfoQ](https://www.infoq.com/news/2026/02/agent-definition-language/)) |
| **Agent Format** | [agentformat.org](https://agentformat.org/) | `.agf.yaml` | Model, instructions, tools | Bills itself as vendor-neutral |
| **Open Agent Spec** | prime-vector | YAML + CLI | Generates agents for different model providers | Spec at v1.6.1 ([GitHub](https://github.com/prime-vector/open-agent-spec)). Not the same as Oracle's despite the name. |
| **AgentSPEX** | Academic ([arXiv:2604.13346](https://arxiv.org/pdf/2604.13346)) | A language for specifying agents and how they run | Research only so far | |
| **Agent File (`.af`)** | Letta | JSON | Memory, tools, prompts, model settings | An export format, secrets nulled on export. Pinned in this study as [`agent-file`](../../agent-file). |
| **Agent Companies spec** (`agentcompanies/v1-draft`) | Paperclip | Markdown + YAML frontmatter (`COMPANY.md`, `TEAM.md`, `AGENTS.md`, `PROJECT.md`, `TASK.md`) | Agents, the org chart above them, starter projects and tasks; skills by shortname | An extension of Agent Skills, not a rival to it. Commit-pinned `sources[]` and secrets exported as declared inputs without values. Draft; Paperclip is the only implementer so far. [Spec](https://github.com/paperclipai/paperclip/blob/dadbc495b3cbdc171fddc40d09aafcc3e9206305/docs/companies/companies-spec.md); pinned as [`paperclip`](../../paperclip), profiled in [`Profile__Paperclip.md`](../profiles/Profile__Paperclip.md). Added 2026-11-26. |

### Formats tied to one framework or harness

| Format | Framework | Shape |
|---|---|---|
| **Declarative agents** | Microsoft Agent Framework | YAML or JSON loaded by an `AgentFactory` ([docs](https://learn.microsoft.com/en-us/agent-framework/agents/declarative)); [declarative workflows](https://learn.microsoft.com/en-us/agent-framework/workflows/declarative) too |
| **Copilot declarative agents** | Microsoft 365 Copilot | JSON manifest: instructions, actions, knowledge sources, capabilities |
| **`agents.yaml` + `tasks.yaml`** | CrewAI | Each agent has a role, goal, and backstory; each task names its agent; Python wires them |
| **Agent YAML** | AIGNE (ArcBlock) | [YAML agent definitions](https://www.arcblock.io/docs/aigne-framework/developer-guide-advanced-topics-defining-agents-with-yaml-9dc03e) |
| **Subagent Markdown** | Claude Code (`.claude/agents/`), Cursor (pstack's `agents/`) | Frontmatter plus a prompt body. Same shape across harnesses; each adds its own fields (Cursor's `is_background`). |
| **Agent Config** | Google ADK | YAML agent config. *Not confirmed in the 2026-11-22 survey.* |
| **cagent** | Docker | YAML agent definitions. *Not confirmed in the 2026-11-22 survey.* |
| **`langgraph.json`** | LangGraph | Deployment config pointing at Python code; the graph itself lives in code |
| **`Agent` class on a Durable Object** | [Cloudflare Agents SDK](https://github.com/cloudflare/agents) (MIT, `agents@0.34.1`, 2026-11-25) | No definition file: the agent is a TypeScript class whose state persists in its own Durable Object, with scheduling, WebSockets, and sleep when idle. A tool defined without an `execute` function waits for human approval ([workshop](https://labs.cloudflare.dev/agents/), [docs](https://developers.cloudflare.com/agents/)). The opposite of a file-defined agent: the definition is code and the state lives on the platform. Whether that state can be exported as a bundle is unchecked. Added 2026-11-26; not pinned (listed as a candidate in `memory-layers-for-agents/README.md`). |

***

## What to take from it

- **Every format defines the same few things:** a model, instructions, tools,
  and sometimes subagents and a workflow. They differ on file shape and on
  whether control flow belongs in the file at all.
- **Oracle's Agent Spec is the strongest candidate** for a portable definition
  of a LangGraph-style workflow, but nobody else has adopted it yet.
- **Subagent Markdown is the de facto shape** and matches `SKILL.md`. For
  agents shipped inside a skill pack, that is the format least likely to need
  rewriting when a spec settles.
- **For an agent running as a service** (MemoPop, event-hog), the A2A Agent
  Card is the standard with backing for saying what it does.
- **For this study's question,** a bundle that records the agent that produced
  it has three candidates: Letta's Agent File and Paperclip's Agent Companies
  spec (both pinned) and Oracle's Agent Spec (worth pinning next). The
  Agent Companies spec is the only one built on `SKILL.md`, so it matches the
  de facto subagent Markdown shape.

Most sources here are vendor docs or self-published write-ups. Treat adoption
claims as unverified, and check a format's own repo before relying on version
details.

## Sources

- [Agentic AI Foundation announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [Open Agent Specification, arXiv:2510.04173](https://arxiv.org/abs/2510.04173)
- [Open Agent Specification at CAIS 2026](https://www.caisconf.org/program/2026/papers/open-agent-specification-a-unified-representation-for-ai-agents/)
- [Agent Definition Language (InfoQ)](https://www.infoq.com/news/2026/02/agent-definition-language/)
- [Agent Format](https://agentformat.org/)
- [prime-vector/open-agent-spec](https://github.com/prime-vector/open-agent-spec)
- [AgentSPEX, arXiv:2604.13346](https://arxiv.org/pdf/2604.13346)
- [Agent Companies Specification (Paperclip, pinned at `dadbc49`)](https://github.com/paperclipai/paperclip/blob/dadbc495b3cbdc171fddc40d09aafcc3e9206305/docs/companies/companies-spec.md)
- [Microsoft Agent Framework: Declarative Agents](https://learn.microsoft.com/en-us/agent-framework/agents/declarative)
- [Microsoft Agent Framework: Declarative Workflows](https://learn.microsoft.com/en-us/agent-framework/workflows/declarative)
- [Cloudflare Agents SDK](https://github.com/cloudflare/agents), [docs](https://developers.cloudflare.com/agents/), [workshop](https://labs.cloudflare.dev/agents/)
- [AIGNE: Defining Agents with YAML](https://www.arcblock.io/docs/aigne-framework/developer-guide-advanced-topics-defining-agents-with-yaml-9dc03e)
- [Declarative Agent Specification survey (Zylos)](https://zylos.ai/research/2026-04-22-declarative-agent-specification-configuration-languages/)
- [Agent Configuration as Code (Zylos)](https://zylos.ai/research/2026-05-18-agent-configuration-as-code-declarative-definitions/)

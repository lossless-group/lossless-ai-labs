---
from: "studies/open-specs-and-standards"
from_path: "context-v/profiles/index.md"
---

# Profiles

* [12-Factor Agents](Profile__12-Factor-Agents.md) - Nothing to install — thirteen essays whose answer to "who owns the prompts, the context, the state, the control flow?" is always *you*.
* [Agent2Agent (A2A) Protocol](Profile__Agent-2-Agent.md) - The load-bearing commitment isn't the JSON-RPC — it's *opacity*. An A2A agent publishes skills, never its prompts, memory, or tools.
* [AGENTS.md](Profile__AGENTS-md.md) - The entire specification is one precedence rule: the closest `AGENTS.md` to the edited file wins. No schema, no validator.
* [Frictionless Specs](Profile__Frictionless-Specs.md) - This one specs *datasets*: every RFC 2119 "MUST" in the prose maps onto a constraint in a published JSON-Schema profile.
* [GSD (Get Shit Done)](Profile__GSD.md) - GSD's wager is that the limiting factor is context rot, not spec rigor — so it ships no spec grammar and resets the window per task.
* [llms.txt](Profile__llms-txt.md) - The only behavioral semantic in the whole format is an H2 named `## Optional` — links there may be dropped when context is tight.
* [MCP-API](Profile__MCP-API.md) - However many APIs a user registers, the model only ever sees two tools: `ListAvailableApis` and `CallApi`.
* [Model Context Protocol (MCP)](Profile__Model-Context-Protocol.md) - The three *client* primitives — Sampling, Roots, Elicitation — let a server use the host's model without ever getting the user's key.
* [OpenSpec](Profile__OpenSpec.md) - An LLM should never re-emit a whole spec to change one line, so changes ship as `ADDED` / `MODIFIED` / `REMOVED` deltas.
* [OpenUI](Profile__OpenUI.md) - JSON spends ~30% of its bytes on punctuation an LLM has no reason to emit; the same seven UIs cost 47–67% fewer tokens in OpenUI Lang.
* [Spec Kit](Profile__Spec-Kit.md) - No plan gets past the Simplicity, Anti-Abstraction, and Integration-First gates without a written, paper-trailed exception.
* [Superpowers](Profile__Superpowers.md) - A SessionStart hook injects the bootstrap skill as `<EXTREMELY_IMPORTANT>` before the agent has written its first word.
* [Symphony](Profile__Symphony.md) - OpenAI shipped the spec, not the product: 2169 lines of RFC 2119 with sections *deliberately made redundant* for coding agents.

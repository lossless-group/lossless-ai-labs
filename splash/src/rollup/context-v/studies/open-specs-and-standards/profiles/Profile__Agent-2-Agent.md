---
name: Agent2Agent (A2A) Protocol Profile
slug: agent-2-agent
upstream: https://github.com/a2aproject/A2A
package: a2a-sdk (Python), @a2a-js/sdk (JS), a2a-go (Go), a2a-java (Java), A2A (.NET/NuGet)
license: Apache 2.0
maintainer: Linux Foundation; donated by Google; 8-company TSC (Google, Microsoft, Cisco, AWS, Salesforce, ServiceNow, SAP, IBM Research)
study: studies/open-specs-and-standards
profile_path: studies/open-specs-and-standards/agent-2-agent
profile_kind: wire-protocol
date_created: 2026-05-05
from: "studies/open-specs-and-standards"
from_path: "context-v/profiles/Profile__Agent-2-Agent.md"
---
# Agent2Agent (A2A) Protocol — Profile

A profile of the A2A protocol as it lives in this study (`studies/open-specs-and-standards/agent-2-agent/`). Cites pinned paths so you can jump to source rather than trust paraphrase. Read this alongside [`Profile__OpenSpec.md`](./Profile__OpenSpec.md), [`Profile__Spec-Kit.md`](./Profile__Spec-Kit.md), [`Profile__GSD.md`](./Profile__GSD.md), [`Profile__12-Factor-Agents.md`](./Profile__12-Factor-Agents.md), and [`Profile__AGENTS-md.md`](./Profile__AGENTS-md.md). Among the six, A2A is the only one that is **a wire protocol** — bytes on the network between processes.

## TL;DR

A2A is **an open wire protocol for one AI agent to talk to another over HTTP** (`README.md:48-50`):

> An open protocol enabling communication and interoperability between opaque agentic applications.
>
> The Agent2Agent (A2A) protocol addresses a critical challenge in the AI landscape: enabling gen AI agents, built on diverse frameworks by different companies running on separate servers, to communicate and collaborate effectively — as agents, not just as tools.

Concretely, it specifies (`README.md:84-88`):

- **Standardized communication:** JSON-RPC 2.0 over HTTP(S), or gRPC, or HTTP+JSON — the same semantic model in three transport bindings.
- **Agent discovery:** via "Agent Cards" — a self-describing manifest at a known URL.
- **Flexible interaction:** synchronous request/response, server-sent-event streaming, or asynchronous push notifications.
- **Rich data exchange:** text, files, structured JSON.
- **Enterprise-ready:** signed Agent Cards (JWS), security schemes, multi-tenancy, OAuth 2.0 with PKCE.

A2A v1.0 shipped as a stable, production-ready standard (`docs/announcing-1.0.md:1-7`). Stewardship: Linux Foundation, donated by Google, governed by an 8-company Technical Steering Committee — Google, Microsoft, Cisco, AWS, Salesforce, ServiceNow, SAP, IBM Research (`GOVERNANCE.md:5-14`). The partner ecosystem is large: `docs/partners.md` lists **166 named organizations**.

If OpenSpec/Spec Kit/GSD/AGENTS.md govern *how a developer drives an AI assistant*, and 12-Factor Agents governs *how you architect an agent application*, A2A governs **how two agentic applications talk to each other across organizational and technology boundaries** — the public-internet layer for agents.

## Why a wire protocol — and why not just MCP?

MCP confusion has been the most common framing question in the ecosystem, so the v1.0 announcement addresses it head-on (`docs/announcing-1.0.md:28-32`):

> MCP and A2A solve different layers of the problem. MCP is commonly used for tool and context integration **at the individual agent level**. A2A focuses on **communication and coordination between agents**. In practice, many systems will use both: MCP inside agents, A2A between agents.

The site puts it as a memorable triangle (`docs/index.md:21-26`):

> Build with **ADK** *(or any framework)*, equip with **MCP** *(or any tool)*, and communicate with **A2A** to remote agents, local agents, and humans.

So: **MCP = agent ↔ tool. A2A = agent ↔ agent.** Different layer, complementary. The v1.0 announcement adds context (`docs/index.md:128-130`): IBM ACP was incorporated into A2A; Cisco's `agntcy` framework leverages both A2A and MCP. A2A is positioned as "the public internet that allows AI agents to interoperate."

The structural problem the protocol solves (`README.md:73-80`):

- **Break down silos** — connect agents across ecosystems built on different frameworks (LangGraph, CrewAI, Semantic Kernel, custom).
- **Enable complex collaboration** — let specialized agents delegate sub-tasks to other specialized agents.
- **Promote open standards** — prevent the alternative future where every vendor's agent talks only to its own.
- **Preserve opacity** — the headline architectural commitment: agents collaborate **without sharing internal memory, proprietary logic, or specific tool implementations**.

That last point is the most consequential. Tool-level integration (MCP) requires you to expose the tool. A2A's *opaque agent* model means an A2A agent surfaces only its capabilities and skills — not the prompts, the model, the memory, or the tools behind them. That's what makes cross-organization collaboration tractable.

## The four primitives

You can read the entire wire spec out of one file: `specification/a2a.proto` (796 lines). Four message types carry the load.

### 1. `AgentCard` — the self-describing manifest

`a2a.proto:356-393`. The fixed-location JSON document an agent serves so other agents can discover it. Required fields:

```protobuf
message AgentCard {
  string name = 1;                              // "Recipe Agent"
  string description = 2;                       // human-readable purpose
  repeated AgentInterface supported_interfaces; // url + protocol_binding + protocol_version
  string version = 5;                           // "1.0.0"
  AgentCapabilities capabilities = 7;           // streaming? push_notifications? extensions?
  map<string, SecurityScheme> security_schemes; // OAuth 2.0, API key, mTLS, etc.
  repeated SecurityRequirement security_requirements;
  repeated string default_input_modes;          // media types accepted
  repeated string default_output_modes;         // media types produced
  repeated AgentSkill skills;                   // discrete capabilities
  repeated AgentCardSignature signatures;       // RFC 7515 JWS signatures
  optional string icon_url = 14;
}
```

Three structural points:

- **Multiple interfaces, multiple protocol versions per agent.** `AgentInterface` (`a2a.proto:336-350`) bundles `url + protocol_binding + protocol_version`, and `AgentCard.supported_interfaces` is a list. The same agent can advertise *both* a v0.3 JSON-RPC interface and a v1.0 gRPC interface — backward-compatible migration is built into the format. The v1.0 announcement (`docs/announcing-1.0.md:34-38`) calls this out as the migration story.
- **Skills are discoverable, not hidden.** `AgentSkill` (`a2a.proto:430-447`) declares `id + name + description + tags + examples + input_modes + output_modes + security_requirements`. A client agent can scan an Agent Card and decide whether the remote agent has what it needs without invoking it.
- **Signed Agent Cards are first-class.** `AgentCardSignature` (`a2a.proto:451-461`) holds RFC 7515 JWS signatures of the card itself. v1.0 highlights this as a cryptographic-trust primitive (`docs/announcing-1.0.md:15`): *"establishing trust before interaction across organizational boundaries."*

### 2. `Task` — the core unit of action

`a2a.proto:163-184`. Every interaction either creates a Task or updates one:

```protobuf
message Task {
  string id;                       // server-assigned UUID
  string context_id;               // groups related tasks/messages
  TaskStatus status;               // current state + status message
  repeated Artifact artifacts;     // outputs as they're produced
  repeated Message history;        // conversation history
  google.protobuf.Struct metadata; // arbitrary extension
}
```

The `TaskState` enum (`a2a.proto:187-208`) is the protocol's lifecycle vocabulary:

| State | Meaning |
|-------|---------|
| `TASK_STATE_SUBMITTED` | Acknowledged, queued |
| `TASK_STATE_WORKING` | Actively processing |
| `TASK_STATE_INPUT_REQUIRED` | **Interrupted** — waiting on user input |
| `TASK_STATE_AUTH_REQUIRED` | **Interrupted** — waiting on auth |
| `TASK_STATE_COMPLETED` | Terminal — success |
| `TASK_STATE_FAILED` | Terminal — error |
| `TASK_STATE_CANCELED` | Terminal — canceled before completion |
| `TASK_STATE_REJECTED` | Terminal — agent declined to perform |

Note the two **interrupted** states (`INPUT_REQUIRED`, `AUTH_REQUIRED`). They are not terminal — the task can resume. This is the equivalent of 12-Factor's "pause between tool selection and tool invocation" (`Profile__12-Factor-Agents.md` Factor 8) at the *protocol* layer. Long-running, human-in-the-loop, and OAuth-redirect flows are accommodated natively.

### 3. `Message` — the unit of communication

`a2a.proto:260-277`:

```protobuf
message Message {
  string message_id;             // creator-assigned
  string context_id;             // groups conversations
  string task_id;                // optional task association
  Role role;                     // ROLE_USER (client) or ROLE_AGENT (server)
  repeated Part parts;           // content fragments
  google.protobuf.Struct metadata;
  repeated string extensions;    // URIs of extensions used
  repeated string reference_task_ids; // cross-references to other tasks
}
```

Three things worth noticing:

- **Role is binary, not LLM-style.** `ROLE_USER` means the *client agent* (regardless of whether a human or another agent is actually behind it). `ROLE_AGENT` means the *server agent*. There is no `system` or `tool` role — A2A is between two opaque parties, not three (`a2a.proto:245-252`).
- **Cross-task references are first-class.** `reference_task_ids` lets a message in one task pull in context from another. This is how multi-agent orchestration patterns (Task A's output feeds Task B) are wired without joining state across servers.
- **Extensions are URI-identified.** A message declares which extensions are present via `extensions[]` URIs (`a2a.proto:417-427`), and an extension can require client compliance (`required = true`). This is the protocol's evolution mechanism.

### 4. `Part` — the content fragment

`a2a.proto:221-242`. The atom of message content:

```protobuf
message Part {
  oneof content {
    string text = 1;                    // plain text
    bytes raw = 2;                      // file bytes (base64 in JSON)
    string url = 3;                     // file URL
    google.protobuf.Value data = 4;     // arbitrary structured JSON
  }
  google.protobuf.Struct metadata;
  string filename;                      // optional, for files
  string media_type;                    // MIME type (e.g. "text/plain", "image/png")
}
```

The `oneof` is the load-bearing design choice: one Part is exactly one of {text, inline bytes, URL pointer, structured data}. A message is a list of Parts, so multimodal payloads (text + image + structured JSON) are just heterogeneous Part lists. URL-vs-bytes is caller's choice — large files can pass by reference.

### Bonus: `Artifact` — the unit of output

`a2a.proto:280-293`. Tasks accumulate `Artifact` records as they progress, each with its own `artifact_id`, name, parts, and metadata. Streaming artifact updates flow as `TaskArtifactUpdateEvent` (`a2a.proto:308-322`) with `append` and `last_chunk` flags — chunks are appended client-side until `last_chunk == true` closes the artifact.

## The 11 RPCs

The `A2AService` definition (`a2a.proto:18-140`) declares exactly 11 operations. With the gRPC HTTP annotations applied, each maps to a stable REST URL:

| RPC | HTTP | Purpose |
|-----|------|---------|
| `SendMessage` | `POST /message:send` | Send a message; server may create or update a Task |
| `SendStreamingMessage` | `POST /message:stream` | Same, but server streams `TaskStatusUpdateEvent` / `TaskArtifactUpdateEvent` (SSE) |
| `GetTask` | `GET /tasks/{id}` | Latest state of a task |
| `ListTasks` | `GET /tasks` | List with filtering — **new in v1.0** |
| `CancelTask` | `POST /tasks/{id}:cancel` | Cancel an in-progress task |
| `SubscribeToTask` | `GET /tasks/{id}:subscribe` | Stream updates for a non-terminal task |
| `CreateTaskPushNotificationConfig` | `POST /tasks/{task_id}/pushNotificationConfigs` | Register a webhook for async updates |
| `GetTaskPushNotificationConfig` | `GET /tasks/{task_id}/pushNotificationConfigs/{id}` | Retrieve one config |
| `ListTaskPushNotificationConfigs` | `GET /tasks/{task_id}/pushNotificationConfigs` | List all configs for a task |
| `DeleteTaskPushNotificationConfig` | `DELETE /tasks/{task_id}/pushNotificationConfigs/{id}` | Remove a webhook |
| `GetExtendedAgentCard` | `GET /extendedAgentCard` | Authenticated extended card with sensitive fields |

Three things worth noticing:

- **Three transport bindings, equivalent semantics.** Every RPC is reachable as JSON-RPC 2.0, gRPC, or HTTP+JSON. The v1.0 announcement frames this as the deliberate web-alignment move (`docs/announcing-1.0.md:20-25`): *"In its simplest form, an A2A interaction can begin with a single HTTP request."*
- **Three update modes.** Synchronous (`SendMessage` waits for terminal state, controlled by `return_immediately` in `SendMessageConfiguration` — `a2a.proto:155-160`); streaming (`SendStreamingMessage` / `SubscribeToTask` over SSE); push (webhook config registered via `*PushNotificationConfig` RPCs). A client picks the mode that fits its workload.
- **Multi-tenancy is in the URL shape.** Every RPC has an additional binding under `/{tenant}/...` (`a2a.proto:24-28` and elsewhere). One endpoint can host many agents — a v1.0 enterprise commitment (`docs/announcing-1.0.md:14`).

## What's actually inside this submodule

```text
agent-2-agent/
├── README.md                       # 128 lines — pitch, SDKs, what's next
├── GOVERNANCE.md                   # 84 lines — TSC composition, Linux Foundation charter
├── MAINTAINERS.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md
├── CHANGELOG.md
├── LICENSE                         # Apache 2.0
├── specification/
│   ├── a2a.proto                   # 796 lines — the normative source of truth (v1.0 elevated this)
│   ├── buf.gen.yaml, buf.yaml, buf.lock  # Buf toolchain for proto codegen
│   └── json/                       # JSON Schema generated from the proto
├── adrs/
│   ├── adr-001-protojson-serialization.md  # The first architecture decision record
│   └── adr-template.md
├── docs/                           # MkDocs source for a2a-protocol.org
│   ├── index.md                    # Landing page
│   ├── specification.md            # 3611 lines — prose normative specification
│   ├── announcing-1.0.md           # 55 lines — v1.0 launch post
│   ├── whats-new-v1.md             # 990 lines — v0.3 → v1.0 migration guide, breaking changes
│   ├── partners.md                 # 173 lines, 166 partner orgs
│   ├── community.md, definitions.md, roadmap.md
│   ├── topics/, tutorials/, sdk/   # Per-topic docs
│   ├── llms.txt                    # LLM-friendly site index (opt-in convention)
│   └── assets/, stylesheets/
├── mkdocs.yml                      # Site config
├── lychee.toml                     # Link checker config
├── requirements-docs.txt           # Python deps for the docs build
└── scripts/
```

If you only have time for three files: `specification/a2a.proto` (the wire spec — read it directly), `docs/announcing-1.0.md` (the v1.0 framing in 55 lines), and `docs/whats-new-v1.md` (the v0.3 → v1.0 breaking-change ledger — useful even if you weren't on v0.3, because it shows the design tensions the protocol has resolved).

The SDKs are *not* in this repo — they're in sibling repositories under the `a2aproject` org (`README.md:94-99`):

| Language | Package | Repo |
|----------|---------|------|
| Python | `a2a-sdk` | `a2aproject/a2a-python` |
| Go | `github.com/a2aproject/a2a-go` | `a2aproject/a2a-go` |
| JavaScript | `@a2a-js/sdk` | `a2aproject/a2a-js` |
| Java | (Maven) | `a2aproject/a2a-java` |
| .NET | `A2A` | `a2aproject/a2a-dotnet` |

## Governance — the eight-company TSC

`GOVERNANCE.md:3-14` names the Technical Steering Committee at v1.0:

| Company | Representative |
|---------|----------------|
| Google | Todd Segal — Principal Engineer |
| Microsoft | Darrel Miller — Partner API Architect |
| Cisco | Luca Muscariello — Distinguished Engineer |
| Amazon Web Services | Abhimanyu Siwach — Senior Software Engineer |
| Salesforce | Stephen Petschulat — Principal Architect |
| ServiceNow | Sean Hughes — Director of Open Science |
| SAP | Sivakumar N. — Vice President |
| IBM Research | Kate Blair — Director of Incubation |

This is the structural fact that makes A2A different from "a Google protocol." The TSC has the same shape as OCI (Open Container Initiative) and CNCF projects: each org gets one voting seat, decisions require quorum + majority, meetings are public, GitHub is the source of truth for significant decisions (`GOVERNANCE.md:78-82`). The "startup phase" (8 founding orgs as appointment-based seats) transitions to a "steady state" composition 18 months in (`GOVERNANCE.md:33-37`).

The Mission and Scope (`GOVERNANCE.md:18-26`) is narrowly drawn: the protocol, an SDK, and documentation. Specifically *not* in scope: agent runtimes, frameworks, hosting, or implementations of agents themselves. That narrowness is intentional — it's what makes the standard a standard rather than a product.

The partner list (`docs/partners.md`) — 166 named organizations — is the breadth signal: AWS, Adobe, Atlassian, Bloomberg, Box, Cohere, Datadog, Deloitte, Salesforce, ServiceNow, and 156 others. Whether all 166 ship A2A endpoints today is a separate question; the list is the public commitment surface.

## What v1.0 actually changed

`docs/whats-new-v1.md` (990 lines) is the migration ledger from v0.3.0. Four themes (`whats-new-v1.md:5-44`):

1. **Protocol maturity.** The .proto file was elevated from a gRPC-specific implementation artifact to the *normative source of truth*. Formal references to RFC 8785 (JSON canonicalization, used for Agent Card signatures) and RFC 7515 (JWS).
2. **Type safety and clarity.** Discriminator `kind` fields removed in favor of JSON member-based polymorphism (so `Part` uses a real `oneof` rather than a `kind: "text" | "file" | "data"` tag). Enums moved from `kebab-case` to `SCREAMING_SNAKE_CASE` for ProtoJSON conformance — **breaking**.
3. **Developer experience.** Operations renamed to method form (`message/send` → `SendMessage`, `tasks/get` → `GetTask`). Compound IDs simplified. Per-interface protocol versioning so an Agent Card can advertise both v0.3 and v1.0 endpoints simultaneously.
4. **Enterprise features.** Signed Agent Cards (JWS + JSON canonicalization), formal binding equivalence guarantees, mTLS, OAuth 2.0 Device Code flow (RFC 8628), PKCE-required Authorization Code flow, cursor-based pagination.

The most consequential breaking change is the JSON polymorphism shift: any v0.3 client that pattern-matched on `kind` fields needs to switch to JSON member-name discrimination. The migration is visible in `Part`'s `oneof content` (`a2a.proto:225-234`) — there is no `kind` field; the message member that's set tells you the type.

## How to get started

### Read the protocol

There is no install step *for the protocol*. Read three files in order:

1. `specification/a2a.proto` (the wire spec — 796 lines).
2. `docs/announcing-1.0.md` (the framing — 55 lines).
3. `docs/whats-new-v1.md` (what changed — 990 lines, but skim).

Then `docs/specification.md` (3611 lines, prose normative spec) for the parts the .proto can't express — error semantics, push notification flows, mTLS handshakes, etc.

### Build an A2A server

Pick an SDK and stand up a minimal agent. Python is the canonical path (`README.md:95`):

```bash
pip install a2a-sdk
```

Minimum viable A2A server:

1. Serve an Agent Card at a known URL (typically `/.well-known/agent.json` or similar — see the spec).
2. Implement at least `SendMessage` and `GetTask`. Optionally add streaming and push notifications.
3. Declare your skills, supported input/output media types, and security schemes in the Agent Card.

The DeepLearning.AI course (`README.md:59-71`) walks the full server-side flow — *Make agents A2A-compliant: expose agents built with frameworks like Google ADK, LangGraph, or BeeAI as A2A servers.*

### Build an A2A client

Inverse path:

1. Fetch an Agent Card from the remote agent's URL.
2. Verify the signature (if present) and the security requirements.
3. Pick an `AgentInterface` (URL + binding + version) the client supports.
4. Send messages; handle Task lifecycle states; pick polling, streaming, or push for updates.

### Compose multi-agent workflows

The DLAI course's later modules (`README.md:69-71`) cover sequential and hierarchical orchestration of A2A agents — including "build a healthcare multi-agent system using different frameworks." That's the canonical worked example for multi-agent A2A.

## Mental model for using it well

- **Treat the Agent Card as the contract surface.** The card is the only thing a remote client sees. Its skill descriptions, security schemes, and supported interfaces are your public API. Sign it (JWS) so consumers can verify identity. Version it deliberately.
- **Tasks are long-lived; messages are not.** A Message is one turn of conversation; a Task is the unit of state across turns. Multi-turn conversations live in the Task's `history`. Cross-Task work uses `Message.reference_task_ids`. Don't flatten everything into messages.
- **Lean on `INPUT_REQUIRED` / `AUTH_REQUIRED`.** Don't busy-loop the client when human input is needed. Transition to the interrupted state, let the client decide whether to subscribe via SSE, register a push webhook, or poll.
- **Pick the update mode by client deployment, not by preference.** Streaming SSE is great for interactive chat clients; push notifications win for long-running tasks where the client may not be online; polling fits CI/CD and batch systems. The protocol supports all three from the same Task.
- **Don't expose tools or memory in the Agent Card.** That defeats the opacity guarantee (`README.md:80`). Skills are *behaviors*, not *implementations*.
- **Use extensions for nonstandard fields, not metadata.** `Message.metadata` and `Task.metadata` are escape hatches for private use. Real cross-vendor extensions go in `AgentExtension` (`a2a.proto:417-427`) with a stable URI and a `required` flag so clients know whether they need to understand it.
- **Always implement v0.3 and v1.0 in parallel during migration.** The Agent Card's multi-interface design (`docs/announcing-1.0.md:34-38`) exists for exactly this — advertise both, retire v0.3 once your clients have moved.

## When NOT to reach for this

- **You're inside one process, one runtime.** A2A is a network protocol with HTTP overhead, JSON serialization, signed manifests, and TLS handshakes. If your "agents" are functions in the same Python process, you're paying for nothing. Use ordinary function calls or in-process actor frameworks.
- **You need agent-to-tool integration.** That's MCP. A2A doesn't talk to your database, your shell, or your filesystem — it talks to other agents that might.
- **Your "agent" is a single LLM call wrapped in a function.** A Task lifecycle, push notification configs, and Agent Cards are heavyweight. If your application doesn't have long-running tasks, doesn't need cross-server discovery, and isn't crossing organizational boundaries, the README, your auth provider, and a `POST /chat` endpoint are enough.
- **Strict latency budgets in tight loops.** Every A2A call is at minimum an HTTP round-trip. If you're inside a per-token-decoding loop or a real-time control system, A2A is too coarse-grained.
- **You're not exposing this externally.** A2A's structural payoff is *cross-organization* and *cross-framework* interop. If both ends are owned by the same team on the same stack, the standardization buys you very little.
- **You can't tolerate the v1.0 breaking changes' migration cost.** The `kind` → JSON-member-polymorphism switch and the `kebab-case` → `SCREAMING_SNAKE_CASE` enum change are real. If you have many v0.3 clients you can't update, the per-interface protocol versioning helps but doesn't eliminate the work.

## A2A vs. the other five — the honest comparison

A2A operates at a different layer of the stack than the other artifacts in this study. The comparison is therefore axis-by-axis, not feature-by-feature.

| Axis | A2A | AGENTS.md | OpenSpec | Spec Kit | GSD | 12-Factor Agents |
|------|-----|-----------|----------|----------|-----|------------------|
| **What it is** | Wire protocol | File convention | Markdown convention + CLI | Methodology + Python CLI | Multi-runtime installer + 65 commands | Manifesto / principles |
| **Layer** | Network — between agent processes | Repo — context for the AI editing your code | Repo — feature-level specs for AI to implement | Repo — feature-level specs + phase gates | Repo — orchestrated end-to-end build | App architecture — how *you* design an agent |
| **Audience** | Engineers building agentic services that interoperate | Developers using AI assistants in a codebase | Developers using AI assistants in a codebase | Developers using AI assistants in a codebase | Solo / small-team builders using AI assistants | Engineers building agent products |
| **Primary artifact** | `AgentCard`, `Task`, `Message`, `Part`, `Artifact` (proto messages on the wire) | `AGENTS.md` file at root + nested | `openspec/specs/` + `openspec/changes/` | `specs/NNN-feature/` + `.specify/` | `.planning/` directory | 13 essays |
| **Toolchain** | Five SDKs (Python, Go, JS, Java, .NET) + any HTTP client | None | Node/npm | Python (uv/pipx) | Node/npm + multi-runtime install | None |
| **Ecosystem reach** | 8-company TSC + 166 partner orgs + Linux Foundation | 23 agents + 60k+ repos + Linux Foundation | ~25 integrations | ~30 integrations | 16 runtimes | N/A |
| **Versioning** | Per-`AgentInterface` declared protocol version (v0.3 + v1.0 advertisable simultaneously) | None | Schema-driven | Constitution + extensions/presets | Tier system | None |
| **Security** | Signed Agent Cards (JWS), security schemes, OAuth 2.0 + PKCE, mTLS | Advisory text in markdown | None first-class | Phase-gate driven | Hooks + injection scanning | Factor 7 (human approval as a tool) |

The clean way to think about how they fit together: a developer building a customer-facing agent product might use **12-Factor Agents** principles to architect the service, **AGENTS.md** at the root of the codebase so AI assistants know the build/test commands, **OpenSpec or Spec Kit or GSD** to drive the AI through implementing each feature, and **A2A** as the protocol that the resulting service exposes to other agents on the open internet. They are stackable, not competitive.

The most important thing A2A shares with AGENTS.md (and only AGENTS.md): both are stewarded by the Linux Foundation as neutral standards. That governance shape is what separates a real ecosystem standard from a vendor's marketing artifact, and it's the structural reason A2A is positioned to do for agent communication what HTTP did for client-server communication.

## One-line summary

> A2A wins by being the only artifact in this study that lives **on the wire between processes**: a Linux-Foundation-governed, eight-company-TSC, Apache-2.0-licensed protocol with Agent Cards (signed manifests), Tasks (long-lived units of work), and three transport bindings (JSON-RPC, gRPC, HTTP+JSON) — making it the standard for two opaque agentic applications, built on different frameworks by different vendors, to discover each other and collaborate without exposing internal state, memory, or tools.

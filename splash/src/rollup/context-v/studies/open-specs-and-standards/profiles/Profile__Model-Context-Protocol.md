---
name: Model Context Protocol (MCP) Profile
slug: modelcontextprotocol
upstream: https://github.com/modelcontextprotocol/modelcontextprotocol
package: SDK packages live in sibling repos (Python, TypeScript, Java, C#, Go, Kotlin, Rust, Swift, …)
license: Code/spec Apache 2.0; Docs CC BY 4.0
maintainer: Linux Foundation ("Model Context Protocol a Series of LF Projects, LLC"); BDFL governance (Lead → Core → Maintainers → Contributors); created by David Soria Parra and Justin Spahr-Summers
study: studies/open-specs-and-standards
profile_path: studies/open-specs-and-standards/modelcontextprotocol
profile_kind: wire-protocol
date_created: 2026-05-05
from: "studies/open-specs-and-standards"
from_path: "context-v/profiles/Profile__Model-Context-Protocol.md"
---
# Model Context Protocol (MCP) — Profile

A profile of MCP as it lives in this study (`studies/open-specs-and-standards/modelcontextprotocol/`). Cites pinned paths so you can jump to source rather than trust paraphrase. Read this paired with [`Profile__Agent-2-Agent.md`](./Profile__Agent-2-Agent.md) — MCP and A2A are sibling wire protocols at different layers (agent ↔ tool vs. agent ↔ agent).

## TL;DR

MCP is **the open wire protocol for an LLM application to talk to tools, data sources, and prompt templates** — the standard surface across "Hosts, Clients, and Servers" that lets an agent fetch resources, invoke tools, and load prompts the same way regardless of which model is in the host (`docs/specification/2025-11-25/index.mdx:7-11`):

> Model Context Protocol (MCP) is an open protocol that enables seamless integration between LLM applications and external data sources and tools. Whether you're building an AI-powered IDE, enhancing a chat interface, or creating custom AI workflows, MCP provides a standardized way to connect LLMs with the context they need.

The shape (`docs/specification/2025-11-25/index.mdx:35-46`):

- **JSON-RPC 2.0** message format, **stateful** connections, capability negotiation up front.
- Three roles: **Hosts** (LLM applications that initiate connections), **Clients** (connectors inside the host), **Servers** (services that provide context and capabilities).
- Inspired explicitly by the **Language Server Protocol** — *"In a similar way, MCP standardizes how to integrate additional context and tools into the ecosystem of AI applications."*

What servers offer to clients:

- **Resources** — context and data, for the user or model to use.
- **Prompts** — templated messages and workflows.
- **Tools** — functions for the model to execute.

What clients offer to servers:

- **Sampling** — server-initiated agentic behaviors (recursive LLM calls).
- **Roots** — server-initiated inquiries into URI/filesystem boundaries it may operate in.
- **Elicitation** — server-initiated requests for additional information from users.

The repo at `modelcontextprotocol/` is **the spec, the schema, and the docs** — not the SDKs. SDK packages live in sibling repos under the same org (Python, TypeScript, Java, C#, Go, Kotlin, Rust, Swift…).

Created by **David Soria Parra** and **Justin Spahr-Summers** (`README.md:20`). Now stewarded by the **Linux Foundation** as *Model Context Protocol a Series of LF Projects, LLC* (`GOVERNANCE.md:3`, `docs/community/governance.mdx:10`). License: code and spec under Apache 2.0; documentation under CC BY 4.0.

If A2A is the public-internet protocol *between* opaque agents, MCP is **the inside-the-agent protocol from the agent to the tools that agent uses**. The two were designed to compose, and both ended up at the Linux Foundation as Apache-2.0 standards.

## Why a wire protocol — and the LSP analogy

The single best framing is the explicit Language Server Protocol comparison (`docs/specification/2025-11-25/index.mdx:42-46`). LSP solved a combinatorial problem: *N* editors × *M* languages = *N×M* integrations, until LSP turned it into *N + M*. MCP attempts the same trick for AI: *N* AI applications × *M* tool/data sources = *N×M* integrations, until MCP makes it *N + M*. Every host that speaks MCP can use every server that speaks MCP.

The eight design principles in `docs/community/design-principles.mdx` are the project's published priors for evaluating proposals. They are unusually clear; if you only read one supporting doc, read this one. The condensed argument:

| Principle | Plain reading |
|-----------|---------------|
| **Convergence over choice** | One way to solve a problem; harder decisions upfront beat fragmentation. *(`design-principles.mdx:8-12`)* |
| **Composability over specificity** | Don't add features that can be built from existing primitives. The surface stays small. *(`:14-18`)* |
| **Interoperability over optimization** | Features must degrade gracefully across widely varying hosts/servers/models. Capability negotiation is the mechanism. *(`:20-22`)* |
| **Stability over velocity** | "Adding to a protocol as widely adopted as MCP is easy. Removing from it is nearly impossible." Optimize for decades, not quarters. *(`:24-28`)* |
| **Capability over compensation** | Don't add permanent structure to work around temporary model limitations — the limitation fades, the complexity remains. *(`:30-34`)* |
| **Demonstration over deliberation** | Working implementations beat theoretical debate. *(`:36-38`)* |
| **Pragmatism over purity** | Theoretical elegance loses to real-world utility. *(`:40-42`)* |
| **Standardization over innovation** | Codify what already works across multiple implementations; experiment via extensions, not the spec. *(`:44-48`)* |

Two of those — **stability** and **convergence** — are doing most of the day-to-day work. Together they explain why MCP says "no" to a lot.

## The four primitives (server side)

You can grok MCP from four primitives plus the lifecycle that connects them. The schema (`schema/2025-11-25/schema.ts`) is 2587 lines, ~150 exported types — but the conceptual surface is small.

### 1. `Initialize` + capability negotiation

`schema/2025-11-25/schema.ts` exports `InitializeRequest` / `InitializeResult` / `InitializedNotification` / `ClientCapabilities` / `ServerCapabilities`. Every connection opens with a handshake: client says "here are the protocol versions and features I can speak"; server replies with the version it picked and which capabilities it offers. Nothing else fires until both sides have agreed.

This is the mechanism that makes "interoperability over optimization" work: a smart client and a basic server can still talk; a fancy server and a minimal client still get useful interaction. Servers don't assume; they advertise.

### 2. `Resources` — addressable context

`docs/specification/2025-11-25/server/resources.mdx`. URI-addressable units of context (files, database rows, API responses, anything fetchable). The server lists them via `ListResourcesRequest`, the client reads via `ReadResourceRequest`, and both sides can subscribe (`SubscribeRequest` / `ResourceUpdatedNotification`) for change notifications. Resources are *for the user or model to use* — they're not action; they're context.

### 3. `Tools` — model-invocable functions

`docs/specification/2025-11-25/server/tools.mdx`. Functions an LLM can call. Each tool has a name, description, and input schema. The host typically requests user consent before invoking. The protocol is explicit (`docs/specification/2025-11-25/index.mdx:96-103`):

> Tools represent arbitrary code execution and must be treated with appropriate caution. In particular, descriptions of tool behavior such as annotations should be considered untrusted, unless obtained from a trusted server. Hosts must obtain explicit user consent before invoking any tool.

### 4. `Prompts` — templated user-invokable workflows

`docs/specification/2025-11-25/server/prompts.mdx`. Server-provided prompt templates the user can pick (often surfaced as slash commands in the client UI — see `docs/specification/2025-11-25/server/slash-command.png`). The user, not the model, triggers them.

## The three client-side primitives

Less well known than tools/resources/prompts, but they're what differentiates MCP from a one-way "tool-calling" interface. The server can request work from the client too, when the client has declared the capability.

- **Sampling** (`docs/specification/2025-11-25/client/sampling.mdx`) — the server can ask the host's LLM to perform a recursive completion. Lets a server orchestrate agentic behaviors using the host's model and credentials, with **explicit user approval** built into the contract (`docs/specification/2025-11-25/index.mdx:104-110`): users approve sampling, control the prompt, and control what the server gets to see.
- **Roots** (`docs/specification/2025-11-25/client/roots.mdx`) — server asks "what URIs/filesystem paths am I allowed to operate in?" The client returns the explicit boundary set. This is the per-session sandbox surface, exposed as a protocol primitive instead of a per-server config.
- **Elicitation** (`docs/specification/2025-11-25/client/elicitation.mdx`) — server requests additional information from the user (think structured forms in-flow). The client renders the prompt, gathers the input, returns it.

These three flip the directionality: not just "model calls tool," but "tool needs the model to decide something" or "tool needs more from the user." This is what distinguishes MCP from MCP-shaped JSON-RPC layers.

## The lifecycle and base protocol

`docs/specification/2025-11-25/basic/`. Four files anchor the wire format:

| File | What it covers |
|------|----------------|
| `index.mdx` | JSON-RPC 2.0 framing, message classes, capability shape |
| `lifecycle.mdx` | initialize → initialized → operational → shutdown |
| `transports.mdx` | stdio, Streamable HTTP, SSE — how to actually carry the JSON-RPC frames |
| `authorization.mdx` | OAuth 2.0 + RFC 8628 device flow + PKCE for HTTP-based servers |

Two transport bindings cover most deployments:

- **stdio** — the parent process spawns the server as a subprocess and communicates over stdin/stdout. The default for local MCP servers (filesystem, git, sqlite, etc.).
- **Streamable HTTP** — server is a remote HTTP endpoint; client sends JSON-RPC requests, server can respond either inline or stream multiple messages back. Replaces the older SSE-only transport.

Auth (`authorization.mdx`) is OAuth 2.0 with the standard enterprise plumbing — Authorization Server Metadata (RFC 8414), Protected Resource Metadata (RFC 9728), Dynamic Client Registration (RFC 7591), and PKCE-required Authorization Code flow (RFC 7636). SEPs in `seps/` extend this — e.g., `seps/991-enable-url-based-client-registration-using-oauth-c.md`, `seps/2207-oidc-refresh-token-guidance.md`.

## Versioning — date-based, not SemVer

`CLAUDE.md` (the repo's own AGENTS.md, named CLAUDE.md and symlinked from AGENTS.md):

> Specifications use **date-based versioning** (YYYY-MM-DD), not semantic versioning:
>
> - `schema/[YYYY-MM-DD]/` and `docs/specification/[YYYY-MM-DD]/` — released versions
> - `schema/draft/` and `docs/specification/draft/` — in-progress work

In this checkout, four released versions are present:

```
schema/2024-11-05/   ← initial public release (the version Claude Desktop shipped)
schema/2025-03-26/
schema/2025-06-18/
schema/2025-11-25/   ← current LATEST_PROTOCOL_VERSION
schema/draft/        ← in-progress next version
```

The `LATEST_PROTOCOL_VERSION` constant in `schema/2025-11-25/schema.ts` is the marker. Date versioning composes well with the "stability over velocity" principle: each frozen date is permanent and citable; the draft is a moving target.

## TypeScript-first schema

`README.md:11-13`:

> The schema is defined in TypeScript first, but made available as JSON Schema as well, for wider compatibility.

Workflow per `CLAUDE.md`:

```bash
# Edit:
schema/[version]/schema.ts

# Generate JSON Schema + Schema Reference document:
npm run generate:schema
```

`schema.ts` is the source of truth; `schema.json` and `schema.mdx` are generated artifacts. JSON examples live under `schema/[version]/examples/[TypeName]/` and validate against their type — `Tool/example-name.json` validates against the `Tool` schema. Examples are referenced in `schema.ts` via `@includeCode` JSDoc tags so the docs site shows the same examples the validators consume.

This is a structurally different choice than A2A's `.proto`-first approach (where the .proto file was elevated to normative in v1.0). Different language, same idea: one normative source, deterministic codegen for everything else.

## SEPs — Specification Enhancement Proposals

`seps/` (32 files in this checkout). Each `NNN-slug.md` file is one proposal. Procedure documented in `docs/community/sep-guidelines.mdx`. The README pointer is intentionally minimal (`seps/README.md`):

> See https://modelcontextprotocol.io/community/sep-guidelines

A sample of in-flight or recently-landed SEPs gives a sense of the surface:

| SEP | Topic |
|-----|-------|
| `932` | MCP governance (the founding governance SEP) |
| `985` | Align OAuth 2.0 Protected Resource Metadata with RFC 9728 |
| `986` | Specify format for tool names |
| `1024` | MCP client security requirements for local servers |
| `1303` | Input validation errors as tool execution errors |
| `1577` | Sampling with tools |
| `1613` | JSON Schema 2020-12 as default dialect for tool inputs |
| `1686` | Tasks (long-running work) |
| `1730` | SDK tiering system |
| `1850` | PR-based SEP workflow |
| `1865` | MCP Apps — interactive user interfaces for MCP |
| `2085` | Governance succession and amendment |
| `2133` | Extensions |
| `2148` | Contributor ladder |
| `2243` | HTTP standardization |

Read `932` (governance) and `2133` (extensions) first if you want the meta-process. `1865` (MCP Apps) and `2133` (Extensions) are the experimentation-vs-spec membrane the design principles describe.

## Governance — LF Project, BDFL technical model

`GOVERNANCE.md` and `docs/community/governance.mdx:6-38`. Two layers:

**Legal/IP layer:** Linux Foundation, *"Model Context Protocol a Series of LF Projects, LLC"* (`GOVERNANCE.md:3`). All code/spec contributions under Apache 2.0; documentation under CC BY 4.0.

**Technical layer** (`docs/community/governance.mdx:22-29`):

| Role | Scope |
|------|-------|
| **Lead Maintainers (BDFL)** | Final decision authority |
| **Core Maintainers** | Overall project direction |
| **Maintainers** | Working Groups, SDKs, components |
| **Contributors** | Issues, PRs, discussions |

This is the Python/PyTorch model — Benevolent Dictator for Life at the top, Core Maintainers running the spec, Maintainers running components/SDKs/working groups, Contributors at the door. Crucially (`docs/community/governance.mdx:38`):

> Membership in the technical governance process is for individuals, not companies. That is, there are no seats reserved for specific companies, and membership is associated with the person rather than the company employing that person.

That's a deliberate and non-trivial divergence from A2A's company-seated TSC. A2A has named org seats (Google / Microsoft / Cisco / AWS / Salesforce / ServiceNow / SAP / IBM Research). MCP has named individuals. Different governance philosophies, both stewarded by the Linux Foundation.

Decision cadence: Core Maintainers meet biweekly; Steering Group meets in-person every 3–6 months. All discussion recorded on Discord (`docs/community/governance.mdx:42`).

The contributor ladder lives at `docs/community/contributor-ladder.mdx` (and SEP `2148`).

## What's actually inside this submodule

```text
modelcontextprotocol/
├── README.md                      # 28 lines — pitch, schema/docs pointers
├── AGENTS.md                      # 90 lines — repo-level agent instructions
├── CLAUDE.md → AGENTS.md          # Symlink
├── GOVERNANCE.md                  # 11 lines — LF Project legal frame
├── ANTITRUST.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md, MAINTAINERS.md, SECURITY.md
├── LICENSE                        # MIT (the repo); spec/code under Apache 2.0 per GOVERNANCE
├── package.json, package-lock.json, tsconfig.json, eslint.config.mjs
├── typedoc.config.mjs, typedoc.plugin.mjs
│
├── schema/                        # The protocol schema, date-versioned
│   ├── 2024-11-05/                # Initial release
│   ├── 2025-03-26/
│   ├── 2025-06-18/
│   ├── 2025-11-25/                # Current LATEST_PROTOCOL_VERSION
│   │   ├── schema.ts              # 2587 lines — TypeScript source of truth
│   │   ├── schema.json            # Generated JSON Schema
│   │   └── schema.mdx             # Generated reference docs
│   └── draft/                     # In-progress next version
│
├── docs/                          # Mintlify documentation site
│   ├── specification/             # Per-version normative spec
│   │   ├── 2024-11-05/, 2025-03-26/, 2025-06-18/, 2025-11-25/, draft/
│   │   └── 2025-11-25/
│   │       ├── index.mdx          # Spec landing page
│   │       ├── architecture/      # Hosts/Clients/Servers diagrams + framing
│   │       ├── basic/             # Base protocol, lifecycle, transports, authorization
│   │       ├── server/            # Resources, prompts, tools, utilities
│   │       ├── client/            # Sampling, roots, elicitation
│   │       ├── changelog.mdx
│   │       └── schema.mdx
│   ├── community/                 # Governance, design principles, SEP process, ladders
│   │   ├── design-principles.mdx
│   │   ├── governance.mdx
│   │   ├── sep-guidelines.mdx
│   │   ├── contributor-ladder.mdx
│   │   └── working-interest-groups.mdx
│   ├── docs/                      # Guides and tutorials
│   ├── extensions/                # Extension docs (MCP Apps, others)
│   ├── registry/                  # MCP server registry docs
│   ├── examples.mdx, clients.mdx, snippets/, images/, logo/
│   └── docs.json                  # Mintlify navigation manifest
│
├── seps/                          # Specification Enhancement Proposals (32 files)
│   ├── README.md, TEMPLATE.md
│   └── NNN-slug.md ×30
│
├── blog/                          # Hugo blog (announcements, posts)
├── plugins/                       # Mintlify-side skill/plugin scaffolds
├── scripts/, tools/               # Repo tooling (schema gen, doc gen, formatters)
└── migrate_seps.js                # SEP migration utility
```

If you only have time for four files, in this order: `docs/specification/2025-11-25/index.mdx` (the spec landing page, ~150 lines), `docs/community/design-principles.mdx` (the project's published priors, ~50 lines), `schema/2025-11-25/schema.ts` (the wire spec — skim the ~150 exported types), and `docs/community/governance.mdx` (the BDFL + LF model). That's the spine.

## How to get started

### As a server author

The intended path: pick an SDK (Python, TypeScript, Java, C#, Go, Kotlin, Rust, Swift — see the registry / `docs/clients.mdx`) and stand up a minimal server implementing one of:

- **Resources** — expose data via URIs.
- **Tools** — expose functions.
- **Prompts** — expose templated user workflows.

You don't need all three. Servers declare capabilities at handshake; the client adapts. `docs/specification/2025-11-25/server/index.mdx` walks the contract; `schema/2025-11-25/schema.ts` is the type surface.

### As a client / host author

Implement the JSON-RPC 2.0 lifecycle (`docs/specification/2025-11-25/basic/lifecycle.mdx`), pick your transport (stdio for local servers; Streamable HTTP for remote), and decide which client capabilities to advertise — sampling/roots/elicitation are all opt-in. `docs/specification/2025-11-25/client/` covers each.

The non-negotiables in any host implementation come from the **Security and Trust & Safety** section (`docs/specification/2025-11-25/index.mdx:80-121`):

- **User consent and control** — explicit consent for all data access and operations; clear UI for review.
- **Data privacy** — explicit consent before exposing user data; no transmit-elsewhere without consent.
- **Tool safety** — treat tool descriptions/annotations as untrusted unless from a trusted server; explicit consent before any tool invocation.
- **LLM sampling controls** — explicit user approval; user controls whether sampling occurs, the prompt, and what the server sees; *the protocol intentionally limits server visibility into prompts*.

The spec is candid that it cannot enforce these at the protocol level; hosts SHOULD build them in.

### Contributing to the protocol itself

Per `CLAUDE.md`:

```bash
npm run prep             # Full prep before committing (check, generate, format)
npm run generate:schema  # JSON + MDX from schema.ts
npm run check            # All checks
```

Substantive changes go through the SEP process (`docs/community/sep-guidelines.mdx`, SEP `1850` for the PR-based workflow). Issues in this repo are template-gated: blank issues are disabled, SDK bugs go to the SDK repos, Claude-specific behavior goes to `anthropics/claude-ai-mcp` (per `CLAUDE.md`). SEPs are *pull requests*, not issues — they add a file to `seps/`.

## Mental model for using it well

- **Capabilities, not assumptions.** Don't probe; declare. Both client and server announce what they can do at `initialize`. Code that assumes a remote feature works without checking the negotiated capability set is broken.
- **Tool descriptions are untrusted by default.** A malicious or compromised server can craft tool descriptions that try to manipulate the model. Treat them as data from the network, not as instructions. Host UIs should display tool descriptions to users in a way that doesn't get injected back into the model's context as authority.
- **Resources are read; tools are write-shaped (probably).** Reading a resource is informational. Calling a tool is action — even if the tool happens to read. The user-consent threshold differs accordingly.
- **Stateful is a feature, not an accident.** MCP connections are explicitly stateful. Reconnection logic, retry on disconnect, and session resumption are real concerns. Sessions enable subscriptions, sampling round-trips, and elicitation.
- **Hosts own the model; servers ask politely.** A server that wants the host's LLM uses **sampling**, with the user's explicit per-request approval. The server doesn't get the user's API key; it gets a result back. This is the trust boundary that makes "expose my agent's brain to a third-party tool" safe.
- **Roots are the boundary; servers stay inside.** A filesystem MCP server should ask for roots, not assume `/`. Servers crossing root boundaries is a security bug, not a feature request.
- **Use extensions for experimentation; SEPs to standardize what wins.** This is the explicit design loop (`design-principles.mdx:8-12`, `:44-48`). MCP Apps, registry, and similar live as extensions until enough implementations converge.
- **Don't compensate for current model weakness in the spec.** "Capability over compensation" is a real constraint. Workarounds for what gpt-N can't do today become permanent if added to the protocol; better to layer them in the host.

## When NOT to reach for this

- **Inside one process, or one SDK, or one runtime.** MCP is JSON-RPC 2.0 over a transport. If your tools are functions in the same process, calling them as functions is faster and simpler. MCP is for *cross-process / cross-vendor* tool-calling.
- **Agent-to-agent communication.** Wrong layer. Use **A2A** for agent ↔ agent ([`Profile__Agent-2-Agent.md`](./Profile__Agent-2-Agent.md)). MCP is agent ↔ tool.
- **Realtime / streaming media.** Not the protocol's design point. JSON-RPC framing is request/response with notifications layered on top. For streaming media or low-latency control, use a domain-appropriate protocol.
- **You can't tolerate the trust boundary.** Servers are untrusted by default; hosts must enforce consent. If your environment cannot accept a "server can request the model do X, user must approve" loop, sampling/elicitation aren't usable.
- **You need fine-grained semantic types.** MCP's tool input schemas are JSON Schema (now standardizing on JSON Schema 2020-12 per SEP `1613`). If you need richer type machinery (linear types, refinement types, dependent types), MCP isn't your layer.
- **You're committed to a vendor's proprietary tool integration.** MCP's whole pitch is the open standard — the LSP-shaped escape from N×M integration. If you're locked to a proprietary substitute, you're getting most of the cost and none of the network effects.

## MCP vs. A2A — the close pair

The two protocols are deliberately complementary. From the A2A v1.0 announcement (`Profile__Agent-2-Agent.md` cites this), and from the MCP design principles, they were built to compose. The differences:

| Axis | MCP | A2A |
|------|-----|-----|
| **Layer** | Inside the agent — agent ↔ tool / data / prompt | Between agents — agent ↔ agent |
| **Audience** | LLM application authors integrating tools | Service authors exposing agentic functionality |
| **Roles** | Hosts / Clients / Servers | Client agents / Server agents (peer roles) |
| **Wire format** | JSON-RPC 2.0 | JSON-RPC 2.0, gRPC, or HTTP+JSON (three bindings) |
| **Connection model** | Stateful, capability-negotiated | Task-oriented, with `INPUT_REQUIRED` / `AUTH_REQUIRED` interrupted states |
| **Discovery** | Capability negotiation at `initialize` | `AgentCard` (signed JWS, advertised at known URL) |
| **Versioning** | Date-based (YYYY-MM-DD), latest = `2025-11-25` | Per-`AgentInterface` declared protocol version (v0.3 + v1.0 advertisable simultaneously) |
| **Extension model** | SEPs + extensions catalog (e.g. MCP Apps) | `AgentExtension` with stable URI + `required` flag |
| **Steward** | Linux Foundation (LF Projects, LLC); BDFL governance with individual seats | Linux Foundation; 8-company TSC with named org seats |
| **Origin** | Anthropic (Soria Parra + Spahr-Summers) | Google donation |
| **License** | Code/spec Apache 2.0; docs CC BY 4.0 | Apache 2.0 |
| **First normative artifact** | `schema/[version]/schema.ts` (TypeScript) | `specification/a2a.proto` (protobuf) |
| **Schema source-of-truth** | TypeScript-first, JSON Schema generated | Proto-first, JSON Schema generated |

The intended composition: an A2A server agent can use MCP servers internally to access tools, data, and prompts — and expose the *agent itself* to other agents via A2A. *MCP inside agents, A2A between agents.*

## MCP vs. the rest of this study

Updating the seven-way comparison from the A2A profile to position MCP:

| Artifact | Layer | Time of consumption |
|----------|-------|---------------------|
| **MCP** | Process — agent ↔ tool/data/prompt | Inference — agent fetching context or invoking a tool |
| **A2A** | Network — agent ↔ agent | Inter-agent runtime |
| **llms.txt** | Website | Inference — LLM using a site to answer a question |
| **AGENTS.md** | Repository | Edit time — agent changing your code |
| **OpenSpec / Spec Kit / GSD** | Repository | Edit time — developer drives an agent through a spec |
| **12-Factor Agents** | App architecture | Design time |
| **Symphony** | Operations — daemon over agents | Runtime — daemon dispatching agents from tickets |

Stack them: a project's published docs site has `/llms.txt` at root for inference-time external LLM use; the repo has `AGENTS.md` for coding agents; features are specced via OpenSpec/Spec-Kit/GSD; the agent product the project ships follows 12-Factor principles; that agent talks to its tools via **MCP** and to peer agents via **A2A**; in operations, a daemon like Symphony picks tickets and dispatches Codex into per-issue workspaces. All eight artifacts compose; none replace each other.

## One-line summary

> MCP wins by being the LSP-of-AI: an open, JSON-RPC-2.0, capability-negotiated, stateful wire protocol that takes the *N×M* integration problem of "every AI app × every tool/data source" and collapses it to *N+M* — with three server-side primitives (Resources / Tools / Prompts), three client-side primitives (Sampling / Roots / Elicitation), an explicit security model that hosts (not the protocol) enforce, a TypeScript-first schema, date-based versioning, and Linux Foundation BDFL governance with individual rather than corporate seats — making it the natural complement to A2A: MCP inside agents, A2A between them.

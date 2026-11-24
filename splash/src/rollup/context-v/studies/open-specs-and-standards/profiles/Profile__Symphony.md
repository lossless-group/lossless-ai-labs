---
title: "Symphony — Profile"
name: Symphony Profile
slug: symphony
upstream: https://github.com/openai/symphony
package: null (reference impl in Elixir; spec invites you to build your own)
license: Apache 2.0
maintainer: OpenAI
study: studies/open-specs-and-standards
profile_path: studies/open-specs-and-standards/symphony
profile_kind: service-spec
date_created: 2026-05-05
date_modified: 2026-11-23
site_uuid: 121b61c5-8196-4f26-821c-647ebf75673d
hex_code: tk1uds
date_authored_initial_draft: 2026-05-05
date_authored_current_draft: 2026-11-23
lede: >-
  OpenAI shipped the spec, not the product: 2312 lines of RFC 2119 with
  sections *deliberately made redundant* for coding agents.
summary: >-
  Profile of Symphony as pinned in this study. It is the study's only operations-layer artifact — a
  long-running daemon that turns an issue tracker into the work queue for a fleet of coding agents,
  taking the developer out of the per-feature loop entirely. Covers the four primitives
  (`WORKFLOW.md` as in-repo policy with YAML front matter plus a strict Liquid prompt body, the
  normalized Issue record, the per-issue Workspace and its two safety invariants, the eleven-phase
  Run Attempt state machine), the poll-reconcile-dispatch loop, the distinction between
  continuation retries and failure backoff, the deliberate in-memory-only recovery model, and the
  soft coupling to Codex app-server. Flagged as an engineering preview by its own README — read the
  safety invariants as the minimum bar, not the finished hardening.
authors:
  - Michael Staton
status: Reference
publish: true
type: Profiles
from: "studies/open-specs-and-standards"
from_path: "context-v/profiles/Profile__Symphony.md"
---
# Symphony — Profile

A profile of Symphony as it lives in this study (`studies/open-specs-and-standards/symphony/`). Cites pinned paths so you can jump to source rather than trust paraphrase. Read alongside the other profiles in this study — Symphony is structurally different from all of them: a **specification for a service**, written by OpenAI, that turns an issue tracker into the work queue for a fleet of coding agents.

## TL;DR

Symphony is **a normative service specification** (`SPEC.md`, 2312 lines, RFC-2119 keywords throughout — `SPEC.md:8-10`) plus a reference implementation in Elixir (`elixir/`) for a long-running daemon that turns an issue tracker into a queue of work for coding agents. The thesis (`README.md:3-4`):

> Symphony turns project work into isolated, autonomous implementation runs, allowing teams to manage work instead of supervising coding agents.

What it does (`SPEC.md:18-29`):

> Symphony is a long-running automation service that continuously reads work from a configured issue tracker, creates an isolated workspace for each issue, and runs a coding agent session for that issue inside the workspace.

Earlier pins read "an issue tracker (Linear in this specification version)". The spec is now tracker-generic; see "Changes since the previous pin" below.

The four operational problems it solves:

1. **Turns issue execution into a repeatable daemon workflow** instead of manual scripts.
2. **Isolates agent execution in per-issue workspaces** so commands run only inside per-issue directories.
3. **Keeps the workflow policy in-repo** (`WORKFLOW.md`) so teams version the agent prompt and runtime settings with their code.
4. **Provides enough observability** to operate and debug multiple concurrent agent runs.

It is **not** a coding agent itself — it dispatches OpenAI Codex (in `app-server` mode) into workspaces and gets out of the way. Ticket writes (state transitions, comments, PR links) are typically performed by the agent, not by the orchestrator. The agent now does this through provider-native tools that Symphony executes with the configured tracker credential, so the Codex child process never needs the raw token (`SPEC.md:36-44`).

The README is explicit about how the spec is intended to be consumed (`README.md:21-27`):

> ### Option 1. Make your own
>
> Tell your favorite coding agent to build Symphony in a programming language of your choice:
>
> > Implement Symphony according to the following spec:
> > https://github.com/openai/symphony/blob/main/SPEC.md

That is the load-bearing framing: the spec is written *to be implemented by a coding agent*. Section 6.4 (`SPEC.md:605-609`) calls this out explicitly:

> This section is intentionally redundant so a coding agent can implement the config layer quickly.

If OpenSpec/Spec Kit/GSD/AGENTS.md govern how a developer drives an AI assistant on a single feature, A2A governs how agents talk to each other on the wire, and 12-Factor Agents governs how you architect agents — Symphony governs **how you take the developer out of the loop entirely** by wiring the issue tracker directly to a fleet of coding agents.

> [!WARNING]
> The README labels Symphony "a low-key engineering preview for testing in trusted environments" (`README.md:11`). Read the spec and reference impl with that posture; the safety invariants in §9.5 are real but the production-grade hardening is *your* job.

## Why a service spec instead of a tool?

Most artifacts in this study are *tools* (OpenSpec CLI, Spec Kit CLI, GSD installer) or *file conventions* (AGENTS.md). Symphony's published artifact is a **service specification** — a 2312-line RFC-2119 document that you implement. Three structural reasons:

### 1. The spec is the product

The Elixir implementation in `elixir/` is labeled "prototype software intended for evaluation only … presented as-is. We recommend implementing your own hardened version based on `SPEC.md`" (`elixir/README.md:6-9`). OpenAI is publishing the *idea* and a *reference*, not the production runtime.

This makes Symphony genuinely portable across stacks. The eight numbered components (`SPEC.md:75-117`) — Workflow Loader, Config Layer, Issue Tracker Adapter (renamed from "Client"), Orchestrator, Workspace Manager, Agent Runner, Status Surface, Logging — are implementable in any language with subprocess control and HTTP. The spec is structured in six abstraction layers (`SPEC.md:122-141`) precisely to make porting easy: Policy / Configuration / Coordination / Execution / Integration / Observability.

### 2. The spec is written for a coding agent to implement

Multiple sections explicitly note their redundancy is for AI implementers — Section 6.4 ("Core Config Fields Summary (Cheat Sheet) — intentionally redundant so a coding agent can implement the config layer quickly", `SPEC.md:605-609`), Section 18 ("Implementation Checklist (Definition of Done)", `SPEC.md:2212-2236`). The spec is doing for service specifications what AGENTS.md does for repo conventions: optimizing for an LLM reader, not just a human reader.

### 3. The spec is in-repo policy, not central runtime config

The spec's most-emphasized design choice is `WORKFLOW.md`: a per-repository file with YAML front matter (config) + Markdown body (the agent's prompt template). It lives in the repo, gets versioned with the code, and is the single source of truth for how Symphony should behave for that project (`SPEC.md:330-331`):

> The workflow file is expected to be repository-owned and version-controlled.

Combined with mandatory dynamic reload (`SPEC.md:562-571`) — the daemon **MUST** detect `WORKFLOW.md` changes and re-apply config without restart — this means *changing how your agents work is a commit*, not a deploy. That's the inversion that makes Symphony a coherent ops model.

## The four primitives

You can grok the architecture from four entities and the lifecycle that connects them.

### 1. `WORKFLOW.md` — the repository contract

`SPEC.md:318-517`. A Markdown file with optional YAML front matter:

```markdown
---
tracker:
  kind: linear                 # Elixir impl also ships github, jira, asana, gitlab adapters
  provider:                    # adapter-owned keys (flat before the Sept 2026 pin)
    project_slug: "my-project-abc"
  required_labels: []          # an issue must carry every listed label to dispatch
  active_states: [Todo, "In Progress"]
  terminal_states: [Done, Cancelled]
polling: { interval_ms: 30000 }
workspace: { root: ~/code/symphony-workspaces }
hooks:
  after_create: |
    git clone --depth 1 https://github.com/myorg/myrepo .
agent:
  max_concurrent_agents: 10
  max_turns: 20
codex:
  command: codex app-server
  approval_policy: never
  thread_sandbox: workspace-write
---

You are working on a Linear ticket {{ issue.identifier }}.

Issue context:
Title: {{ issue.title }}
Description: {{ issue.description }}

Instructions:
1. This is an unattended orchestration session. Never ask a human for follow-up.
2. ...
```

Two things load-bearing:

- **Front matter is the typed config.** Six top-level keys: `tracker`, `polling`, `workspace`, `hooks`, `agent`, `codex` (`SPEC.md:357-366`). Unknown keys are ignored for forward compatibility. Extensions may add top-level keys without changing the core schema.
- **Body is a strict template.** The Markdown body is the per-issue prompt template, rendered with Liquid-compatible semantics (`SPEC.md:493-502`). **Unknown variables MUST fail rendering. Unknown filters MUST fail rendering.** Template inputs are `issue` (full normalized issue record) and `attempt` (null on first run, integer on retry).

Look at `elixir/WORKFLOW.md:1-40` for the canonical example: it shows `after_create` hook cloning the Symphony repo itself (Symphony is dogfooded), a Codex command with `gpt-5.5`-class model + `xhigh` reasoning, and `approval_policy: never` for fully unattended runs.

### 2. `Issue` — the work item

`SPEC.md:154-197`. Normalized record fetched from the tracker:

```text
id              -- REQUIRED opaque dispatch identity (map key; may be a board-entry
                   or project-item ID rather than the underlying ticket ID)
native_ref      -- OPTIONAL non-secret provider identifiers for provider-native tools
identifier      -- REQUIRED human-readable ("ABC-123"), unique within tracker scope
title, description
priority        -- lower = higher priority in dispatch sort
state           -- REQUIRED provider-native state name
branch_name     -- if tracker provides
url, assignee_id, labels, blocked_by, created_at, updated_at
dispatchable    -- REQUIRED adapter-derived eligibility (assignment, board, blockers)
```

The protocol distinguishes (`SPEC.md:295-316`):
- **`Issue ID`** for tracker refresh calls and internal map keys, treated as opaque.
- **`Native Ref`**, preserved for provider tools and prompts, never interpreted by core logic.
- **`Issue Identifier`** for human-readable logs and workspace naming.
- **`Workspace Key`** = sanitized `identifier` (any character not in `[A-Za-z0-9._-]` replaced with `_`), plus a stable hash suffix of at least 64 bits whenever sanitizing changed the identifier, so two identifiers that sanitize alike cannot share a workspace.
- **`Normalized Issue State`** — compared after trimming and `lowercase`.

The tracker boundary is a generic adapter contract (`SPEC.md:1179-1323`). An adapter implements two reads, `fetch_issues_by_states` and `fetch_issues_by_ids`; it owns auth, pagination, scope selection, and the `dispatchable` decision; and it may expose provider-native agent tools. The spec tells implementers not to add generic comment/state/attachment CRUD "merely to make providers look alike" (`SPEC.md:1181-1184`). `tracker.kind` selects the adapter and `tracker.provider` holds adapter-owned keys (`SPEC.md:375-400`). The Elixir implementation ships adapters for Linear, GitHub Issues, Jira Cloud, Asana, and GitLab (`elixir/lib/symphony_elixir/<provider>/adapter.ex`), each with an agent tool (`linear_graphql`, `github_api`, `jira_rest`, `asana_api`, `gitlab_api`; `elixir/README.md:24-28`).

### 3. `Workspace` — the per-issue isolation boundary

`SPEC.md:221-230`, `SPEC.md:851-941`. One filesystem directory per issue:

```
<workspace.root>/<workspace_key>/
```

The two **safety invariants** are the most important portability constraints in the entire spec (`SPEC.md:928-941`):

> **Invariant 1:** Run the coding agent only in the per-issue workspace path. Before launching the coding-agent subprocess, validate `cwd == workspace_path`.
>
> **Invariant 2:** Workspace path MUST stay inside workspace root. Normalize both paths to absolute. Require `workspace_path` to have `workspace_root` as a prefix directory. Reject any path outside the workspace root.

These two checks are what makes "let an agent loose to run shell commands" tractable. Combined with Codex's own sandbox (`codex.thread_sandbox`, `codex.turn_sandbox_policy`), they're a defense-in-depth posture.

Workspaces persist across runs by default (`SPEC.md:865`); successful runs do not auto-delete. This lets continuation runs pick up from the previous attempt's state rather than re-cloning every time.

Four lifecycle hooks (`SPEC.md:420-442`, `SPEC.md:905-926`):

| Hook | When | Failure semantics |
|------|------|-------------------|
| `after_create` | Workspace newly created | **Fatal** — aborts workspace creation |
| `before_run` | Before each agent attempt | **Fatal** — aborts current attempt |
| `after_run` | After each agent attempt (any outcome) | Logged and ignored |
| `before_remove` | Before workspace deletion | Logged and ignored; cleanup proceeds |

Default hook timeout: `60000` ms. The `after_create` hook is where you typically `git clone` your repo into the workspace.

### 4. `Run Attempt` — the state machine

`SPEC.md:233-243`, `SPEC.md:676-691`. Each attempt walks through eleven explicit phases:

1. `PreparingWorkspace`
2. `BuildingPrompt`
3. `LaunchingAgentProcess`
4. `InitializingSession`
5. `StreamingTurn`
6. `Finishing`
7. `Succeeded` *(terminal)*
8. `Failed` *(terminal)*
9. `TimedOut` *(terminal)*
10. `Stalled` *(terminal)*
11. `CanceledByReconciliation` *(terminal)*

Distinct terminal reasons matter because retry logic and logs differ (`SPEC.md:692`).

Above the run-attempt machine sits the **issue orchestration state machine** (`SPEC.md:640-662`):

```mermaid
stateDiagram-v2
    [*] --> Unclaimed
    Unclaimed --> Claimed: poll tick picks it up
    Claimed --> Running: worker spawned
    Running --> RetryQueued: worker exit (normal or abnormal)
    RetryQueued --> Running: retry timer fires + still eligible
    Running --> Released: tracker state turns terminal
    RetryQueued --> Released: retry path completes without re-dispatch
    Released --> [*]
```

The crucial nuance (`SPEC.md:662-674`): **a successful worker exit does not mean the issue is done forever.** A worker may run multiple back-to-back Codex turns within its lifetime (capped at `agent.max_turns`, default 20). After each turn, the worker re-checks the tracker. If still active, it starts another turn on the *same live thread* in the *same workspace* — sending only continuation guidance, not the full original prompt. After worker exit, the orchestrator schedules a 1-second continuation retry to re-check whether the issue still needs work.

This is why "the agent finished" and "the ticket is done" are decoupled: only a tracker state change ends Symphony's interest in an issue.

## The orchestration loop

`SPEC.md:733-849`. Every poll tick (default `30000` ms, `5000` ms in the reference workflow):

1. **Reconcile running issues.** Two-part reconciliation:
   - **Stall detection** (`SPEC.md:823-829`). For each running issue, compute `elapsed_ms` since the last Codex event (or `started_at` if no event yet). If it exceeds `codex.stall_timeout_ms` (default `300000` / 5 minutes), terminate the worker and queue a retry.
   - **Tracker state refresh** (`SPEC.md:831-839`). Fetch current state for every running issue. If terminal → terminate worker + clean workspace. If still active → update snapshot. If neither → terminate without cleanup.
2. **Dispatch preflight validation.** `SPEC.md:591-603`. Check workflow file parses, `tracker.kind` is present and supported, the selected adapter accepts `tracker.provider` after defaults and `$VAR` resolution, `codex.command` is non-empty. Failure: skip dispatch this tick, keep reconciliation, emit operator-visible error. Don't crash.
3. **Fetch candidate issues.** Tracker query for issues in `active_states`.
4. **Sort by dispatch priority.** (a) `priority` ascending for values 1..4, others after, (b) `created_at` oldest first, (c) `identifier` lexicographic tie-breaker (`SPEC.md:771-774`).
5. **Dispatch eligible issues until slots are exhausted.** Eligibility (`SPEC.md:756-766`):
   - Has `id`, `identifier`, `title`, `state`.
   - State in `active_states`, not in `terminal_states`.
   - Adapter-provided `dispatchable` is `true`.
   - Carries every label in `tracker.required_labels`.
   - Not already in `running` or `claimed`.
   - Global concurrency slots available (`max_concurrent_agents`, default 10).
   - Per-state concurrency slots available (`max_concurrent_agents_by_state`).
   - The earlier core "Todo with non-terminal blockers" rule moved into the adapters: blocker semantics now surface only through `dispatchable` (`SPEC.md:1278`). The Jira adapter, for example, honors blocking issue links.
6. **Notify observability.**

### Retry and backoff

`SPEC.md:790-812`. Two backoff curves:

- **Continuation retry after clean worker exit:** fixed `1000` ms.
- **Failure-driven retry:** `delay = min(10000 * 2^(attempt - 1), agent.max_retry_backoff_ms)` — exponential backoff capped at `300000` ms (5 minutes) by default.

A retry timer fires → re-fetch active candidates → look up the specific issue by `issue_id` → dispatch if still eligible and slots available, else release claim.

### Recovery

The orchestrator state is **in-memory only** (`SPEC.md:50-58`):

> Support tracker/filesystem-driven restart recovery without requiring a persistent database; exact in-memory scheduler state is not restored.

Restart recovery is **tracker-driven** (re-poll, re-claim) and **filesystem-driven** (workspaces are preserved across runs and indexed by sanitized identifier). On startup, Symphony queries the tracker for issues in terminal states and removes their workspaces (`SPEC.md:841-849`) — preventing stale workspace accumulation.

This is a deliberate simplification: no Postgres, no Redis, no durable queue. The tracker is the source of truth for *what work exists*; the filesystem is the source of truth for *what work has happened*.

## Codex as the agent (and the soft coupling)

The spec is mostly agent-agnostic, but one component is Codex-specific: the `codex.*` config block (`SPEC.md:463-491`) and the agent-runner subprocess protocol (`SPEC.md:105-110`):

- `codex.command` — default `codex app-server`. Launched via `bash -lc` in the workspace.
- `codex.approval_policy` / `thread_sandbox` / `turn_sandbox_policy` — **pass-through values** whose enums are owned by Codex itself, not Symphony. The spec explicitly says (`SPEC.md:466-473`): inspect via `codex app-server generate-json-schema` rather than relying on a hand-maintained enum.
- `codex.turn_timeout_ms` (default `3600000` / 1h), `codex.read_timeout_ms` (default `5000`), `codex.stall_timeout_ms` (default `300000` / 5m).

The Agent Runner launches the Codex app-server as a subprocess, speaks a JSON-line protocol over stdio, and translates Codex events (turn starts, token counters, rate limits, errors) into orchestrator state updates. Live session metadata (`LiveSession`, `SPEC.md:245-265`) tracks `session_id = <thread_id>-<turn_id>`, PID, last event/timestamp/message, token counters (input/output/total + last reported), and `turn_count`.

In principle the protocol is replaceable. In practice, Symphony v1 ships with Codex assumed.

## What's actually inside this submodule

```text
symphony/
├── README.md                       # 41 lines — pitch, two paths to use it
├── SPEC.md                         # 2312 lines — the normative source of truth
├── NOTICE                          # Apache 2.0 + © 2025 OpenAI
├── LICENSE
├── docs/                           # Smoke-test notes
└── elixir/                         # Reference implementation
    ├── README.md                   # Setup, run, Burrito releases, per-adapter config (405 lines)
    ├── WORKFLOW.md                 # Canonical example workflow (used to develop Symphony itself)
    ├── AGENTS.md                   # Agent-facing instructions for THIS repo's contributors
    ├── mix.exs, mix.lock           # Elixir package manifest
    ├── mise.toml                   # Erlang/Elixir version manager config
    ├── Makefile
    ├── lib/                        # Elixir/OTP implementation; one dir per tracker adapter
    ├── test/
    ├── config/
    ├── priv/                       # Static assets (Phoenix observability optional UI)
    └── docs/
```

If you only have time for three files: `SPEC.md` end-to-end (it is the canonical artifact), `elixir/WORKFLOW.md` as a worked example, and `README.md` for the framing.

The Elixir implementation is OTP-style — supervised processes, GenServers for orchestrator state, a Phoenix-based optional observability surface (`elixir/README.md:119`). It's a good idiomatic reference if you're porting to another concurrent runtime (Go's goroutines, Rust's tokio, Erlang/OTP itself), but per the warning at `elixir/README.md:6-9` it's not what OpenAI runs in production.

## How to get started

### Option A — implement it from the spec (the recommended path)

`README.md:21-27`. Hand the spec to a coding agent and ask it to build the implementation in your language of choice:

```text
Implement Symphony according to the following spec:
https://github.com/openai/symphony/blob/main/SPEC.md
```

The spec's redundancy and explicit Section 18 implementation checklist (`SPEC.md:2212-2236`) are designed for this workflow. The minimum required surface for **Core Conformance** (§18.1):

- Workflow path selection (explicit + cwd default)
- `WORKFLOW.md` loader with YAML front matter + prompt body split
- Typed config layer with defaults and `$VAR` resolution
- **Dynamic `WORKFLOW.md` watch/reload/re-apply** for both config and prompt
- Polling orchestrator with single-authority mutable state
- Issue tracker adapter with state-list + ID-refresh reads (no longer "client (Linear)")
- Workspace manager with sanitized, collision-resistant per-issue workspaces
- All four workspace lifecycle hooks, with `hooks.timeout_ms` (default 60000)
- Coding-agent app-server subprocess client with the targeted transport/framing protocol
- Strict prompt rendering with `issue` + `attempt` variables
- Exponential retry queue with continuation retries after normal exit, configurable backoff cap
- Reconciliation that stops runs on terminal/non-active tracker states
- Workspace cleanup for terminal issues (startup sweep + active transition)
- Structured logs with `issue_id`, `issue_identifier`, `session_id`
- Operator-visible observability

### Option B — run the Elixir reference

`README.md:28-36`, `elixir/README.md:56-75`:

```bash
# Prereqs: mise, Linear API key, harness-engineered codebase
git clone https://github.com/openai/symphony
cd symphony/elixir
mise trust
mise install
mise exec -- mix setup
mise exec -- mix build
mise exec -- ./bin/symphony ./WORKFLOW.md
```

The Elixir impl uses `mise` to manage Erlang/Elixir versions, reads tracker credentials per adapter (for Linear, `LINEAR_API_KEY`), and expects a copy of `WORKFLOW.md` at the path you provide. Since v0.0.1 (July 2026) there is also a no-build path: self-contained Burrito executables for macOS and Linux on arm64 and x86_64, published on `v*` tags and as a rolling `nightly` prerelease (`elixir/README.md:77-104`). They still need `codex`, `git`, and tracker credentials on the machine.

### Either way — set up your repo

Symphony works best on codebases that have adopted *harness engineering* (`README.md:17-19`) — a term OpenAI has its own write-up for. Concretely that means: deterministic build, tests that an agent can run unattended, lint/format that fail loudly on regression, and (in the canonical workflow) a Linear board with the agreed-upon states. The reference `WORKFLOW.md` adds custom Linear states `Rework`, `Human Review`, and `Merging` to the defaults (`elixir/README.md:51-53`).

## Mental model for using it well

- **The tracker is the queue.** Don't try to inject work via APIs or files — file an issue in the configured tracker, watch Symphony pick it up. `required_labels` gives you an opt-in label gate so only labeled issues dispatch. This is the inversion that makes the model coherent.
- **`WORKFLOW.md` is policy, not config.** It encodes "what does success mean for this project" via the prompt body, plus the runtime knobs needed to enforce it. Treat changes to it like merging a change to your CI config — review, version, ship together with code.
- **Workspaces are persistent state.** A workspace from a previous attempt is a feature, not a leak. Continuation turns assume the workspace exists. Don't write hooks that wipe state on `before_run` unless you mean it.
- **Two safety invariants are the whole game.** §9.5: agent runs only in workspace path; workspace path stays inside workspace root. Encode both as explicit checks in your runner. Defense in depth: also rely on Codex's `thread_sandbox` and `turn_sandbox_policy`.
- **Continuation retries are not failure retries.** A clean worker exit followed by a 1-second continuation retry is the *normal* path for a long-running ticket. Backoff is only for failures. Logging and alerts should distinguish the two.
- **Stall detection is more important than timeouts.** Codex turns can legitimately run for an hour (default `turn_timeout_ms = 3600000`). What you actually want to detect is *no events flowing* — that's `stall_timeout_ms`. Tune it down if you have shorter expected turn cadence.
- **Dispatch validation should never crash the daemon.** Per-tick failures skip dispatch but keep reconciliation. The orchestrator runs forever; a bad `WORKFLOW.md` edit shouldn't take down the supervisor.
- **Keep `max_turns` finite and generous.** 20 is the default. Higher means longer continuation chains; lower forces the orchestrator to schedule new workers more often. The trade-off is "live thread context" vs. "fresh agent context."
- **`max_concurrent_agents_by_state` is a load-shedding lever.** You probably don't want 10 agents simultaneously in `Merging` — that's where collisions happen. Per-state caps let you pinch points where conflicts cluster.

## When NOT to reach for this

- **You don't have a tracker, or you don't want one to be authoritative.** Symphony's whole control loop is "tracker says active → run agent; tracker says terminal → stop." If you don't have a tracker with an adapter (Linear, GitHub Issues, Jira Cloud, Asana, GitLab in the Elixir impl, or one you write) being the source of truth for work, the model doesn't fit.
- **You need supervised, interactive coding sessions.** Symphony's intended posture is unattended (`elixir/WORKFLOW.md:69`: *"This is an unattended orchestration session. Do not ask a human to perform follow-up actions"*). For human-in-the-loop pair programming, this is the wrong shape.
- **You're not on Codex.** v1 of the spec hard-codes Codex app-server's stdio protocol, sandbox policies, and event schema. The spec is structured for agent pluggability but the v1 conformance bar is Codex.
- **You can't tolerate "preview" software in your delivery loop.** The README's own warning (`README.md:11`) is explicit: *"Symphony is a low-key engineering preview for testing in trusted environments."* If a stuck agent or a rogue git operation would be career-ending, this is too early.
- **You want approvals, audit logs, or RBAC.** The spec mentions implementations targeting "trusted environments with a high-trust configuration" (`SPEC.md:33-34`). Approval policies, sandboxing strength, and operator confirmation are explicit non-goals in v1 — you build them on top.
- **You can't expose the tracker API surface to the daemon.** Symphony's process needs a tracker credential with broad read access, and the agent's writes go through provider-native tools (`linear_graphql`, `github_api`, …) that Symphony executes with that credential. The child process no longer sees the token, but the daemon still holds it. If your security model can't extend that trust, the architecture doesn't fit.

## Symphony vs. the other six profiles — the honest comparison

Symphony lives at a different layer of the AI-assisted-development stack than every other artifact in this study. Below the row labeled "Layer," each profile describes what kind of artifact it is and what surface it constrains.

| Axis | Symphony | A2A | AGENTS.md | OpenSpec | Spec Kit | GSD | 12-Factor Agents |
|------|----------|-----|-----------|----------|----------|-----|------------------|
| **What it is** | Service spec + Elixir reference impl | Wire protocol | File convention | Markdown convention + CLI | Methodology + Python CLI | Multi-runtime installer + commands | Manifesto / principles |
| **Layer** | Operations — long-running daemon over a fleet of agents | Network — agent ↔ agent | Repo — context for the AI editing your code | Repo — feature specs | Repo — feature specs + phase gates | Repo — orchestrated build | App architecture |
| **Audience** | Platform/devops teams running unattended agent fleets | Engineers building interoperable agentic services | Developers using AI assistants in a codebase | Developers using AI assistants | Developers using AI assistants | Solo / small-team builders | Engineers building agent products |
| **Primary artifact** | `WORKFLOW.md` + the daemon's filesystem of per-issue workspaces | Wire messages over HTTP | `AGENTS.md` at root + nested | `openspec/specs/` + `openspec/changes/` | `specs/NNN-feature/` | `.planning/` directory | 13 essays |
| **Maintainer** | OpenAI | Linux Foundation (donated by Google) | Linux Foundation (Agentic AI Foundation) | Fission AI | GitHub | OpenGSD (open-gsd/gsd-core; originally TÂCHES / gsd-build) | HumanLayer / Dex Horthy |
| **Toolchain** | Elixir reference; intended to be reimplemented | Five SDKs (Python/Go/JS/Java/.NET) + any HTTP client | None | Node/npm | Python (uv/pipx) | Node/npm + 16-runtime install | None |
| **Loop primitive** | Tracker poll → workspace → Codex app-server session | RPC: Task lifecycle states | None | `/opsx:propose → apply → archive` | `/speckit.constitution → specify → plan → tasks → implement` | `discuss → plan → execute → verify → ship` | The 4-step agent loop (LLM → tool → result → repeat) |
| **Trigger** | Issue state change in tracker | Inbound HTTP | Editing a file with an agent | Developer running a slash command | Developer running a slash command | Developer running a slash command | The application's own event source |
| **Human in the loop?** | Optional — handoff state like `Human Review` | Optional — `INPUT_REQUIRED` task state | Always — chat | Always — author specs, run commands | Always — author specs, run gates | Always — drives the loop | Whatever you build |

A productive way to think about how they fit together at the limit:

- A team runs **Symphony** as their delivery daemon.
- Each repo Symphony manages has an **AGENTS.md** at root telling the Codex agent how to build/test/lint.
- Each ticket Symphony picks up references a feature specced via **OpenSpec / Spec Kit / GSD**, depending on team preference, so the Codex agent has structured intent to implement against.
- The agent product Symphony spawns is itself architected per **12-Factor Agents** principles.
- If that agent needs to delegate sub-work to *another* agentic service (a research bot, a data agent, a deployment bot), it does so via **A2A**.

All seven plug together. None are substitutes; they occupy different layers.

## Changes since the previous pin (2026-04-27 → 2026-09-15)

`58cf97da06d5` → `be10a1b79df7`, 35 commits. Releases in range: **v0.0.1** (2026-07-17), **v0.0.2** (2026-07-24), **v0.0.3** (2026-09-15), plus a rolling `nightly` tag. License unchanged (Apache 2.0).

- **The spec is no longer Linear-only.** §1, §3, §4.1.1, §5.3.1, and §11 were rewritten around a generic tracker adapter (`SPEC.md:1179-1323`). The Issue record gained `native_ref`, `assignee_id`, and a REQUIRED `dispatchable`; `id` became an opaque dispatch identity (`SPEC.md:156-197`). `SPEC.md` grew from 2169 to 2312 lines.
- **Five adapters in the reference implementation**: Linear, GitHub Issues, Jira Cloud, Asana, GitLab, each under `elixir/lib/symphony_elixir/<provider>/` with `adapter.ex`, `client.ex`, and `agent_tool.ex`.
- **Tracker credentials stay with the daemon.** Provider-native tools run inside Symphony with host-side auth, and declared tracker-token environment variables are stripped from the Codex child (`SPEC.md:36-44`, `SPEC.md:143-150`, `elixir/README.md:24-28`).
- **Config shape changed**: adapter keys moved under `tracker.provider`; `tracker.required_labels` added (`SPEC.md:375-400`). The Linear adapter still accepts the old flat keys.
- **Workspace keys are collision-resistant** via a hash suffix when sanitizing changes the identifier (`SPEC.md:307-312`).
- **Blocker gating moved out of the core scheduler** into adapters via `dispatchable` (`SPEC.md:756-766`, `SPEC.md:1278`).
- **Burrito release binaries** for four platforms (`elixir/README.md:77-104`) and a `nightly` prerelease built from every push to `main`.
- Smaller: failed workspace setup retries, last-good config is kept when a reload is invalid, input-blocked sessions are surfaced in the dashboard and API, and the dashboard links issues back to the tracker.

## One-line summary

> Symphony wins by inverting the developer-vs-agent loop entirely: instead of a developer driving an AI assistant feature-by-feature, a long-running daemon polls the issue tracker (Linear first, now any tracker with an adapter), spins up Codex sessions in isolated per-issue workspaces, and runs them to ticket completion — all governed by a single in-repo `WORKFLOW.md` whose YAML frontmatter sets policy and whose Markdown body is the prompt — and OpenAI ships it as a 2312-line normative spec written explicitly to be reimplemented by the very coding agents it's designed to orchestrate.

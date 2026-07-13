# Conversational UI and Native Shells — Study

## The question

> How do native, cross-platform conversational UI applications — especially
> ones built with Tauri (Rust backend + web frontend) — structure frontend
> state management, multi-conversation/multi-context switching (e.g.
> swapping between different "workspaces" or agent personas), local file
> persistence (chat history, settings), and integration with backend agent
> processes or MCP servers?

This study exists in service of a concrete decision: whether to extend
`memopop-ai/apps/memopop-native/` (a working Tauri 2 + SvelteKit shell with
a proven Rust `SidecarManager`) into a multi-context native chat app that
swaps between augment-it, dididecks-ai, and memopop-ai backends at runtime.
See
`ai-labs/context-v/plans/Study-Agent-Harnesses-and-Conversational-UI-Before-Cross-Product-Shell.md`
for the full plan this study serves. Sibling study:
[[../agent-harnesses]] covers runtime/backend harness behavior; this one
covers frontend/native-shell architecture.

## What we are looking at, repo by repo

Working checklist per entry:

- **Stack.** Tauri, Electron, or other — and why that matters for the
  memopop-native build-stack question.
- **State management.** How is conversation/app state modeled and kept in
  sync between the native shell and its backend?
- **Multi-context switching.** Is there a "workspace" or "persona" concept
  that can be swapped at runtime, and how does the adapter/data layer
  change underneath it?
- **Local persistence.** What's on disk — SQLite, JSON, a KV store — and
  where?
- **MCP-client integration.** If the app is an MCP host, how does it
  discover, enable/disable, and invoke MCP servers?

## The design space at a glance

| Bet | Entry |
|---|---|
| Tauri + React; clean local-first multi-provider persistence via Rust backend | [Kaas](./kaas) |
| Tauri + SvelteKit; multi-agent delegation, long-term memory, MCP, "Skills" loading — closest feature match, early-stage | [openagent](./openagent) |
| Tauri **and** Electron dual-shipped; MCP host (stdio + SSE), per-tool enable/disable, real Electron→Tauri migration | [Dive](./dive) |
| Electron (comparison); mature local persistence (SQLite→PGlite), MCP-client + server marketplace | [5ire](./5ire) |
| Electron (comparison); workspace-based multi-context switching — closest existing pattern to "swap backend products" (verdict: shallow, see inquiry notes) | [anything-llm](./anything-llm) |
| Tauri 2 desktop + real Rust/Axum server, dual-backend (also ships a Next.js web path) sharing one `api-contract.yaml`; genuine per-workspace adapter swap, ACP/MCP/A2A surfaces | [routa](./routa) |
| Tauri 2 + Rust (Tokio) + React; spawns one isolated `codex app-server` process per workspace over JSON-RPC/stdio — small, low-adoption, but an architecturally honest process-level adapter-swap example | [open-vibe](./open-vibe) |
| Web app (Node/Express + MongoDB), no native shell — pinned anyway for its backend/file-persistence design: per-file-type pluggable storage strategy (`local`/`s3`/`firebase`/`azure_blob`/`cloudfront`, mixable per avatar/image/document) and a `skill`/`routes/skills.js` surface | [librechat](./librechat) |

## Sub-inquiries driving this reading pass

1. How does `Dive`'s Electron→Tauri migration inform keeping `memopop-native`
   as the host vs. starting fresh?
2. How does `anything-llm`'s workspace-switch model compare to our
   `WorkspaceAdapter` (one adapter per app, fixed at build time) — does it
   support swapping the *adapter itself* at runtime, which is what we'd need?
3. How does `openagent`'s "Skills" loading work, and does it transfer to
   swapping skillsets when switching between augment-it/dididecks/memopop?

Notes go in `context-v/inquiry/`, cited by path
(`studies/conversational-ui-and-native-shells/<repo>/<file>:<line>`), not
paraphrased as prose.

## Excluded (verified, not just assumed)

- **`chatboxai/chatbox`** — confirmed Electron despite reputation; an open
  issue on the repo literally asks the maintainer to switch to Tauri.
- **`DrJonBrock/luke-desktop`** — considered and excluded: essentially a
  single-commit MCP-integration scaffold from Dec 2024, not actively
  developed; Dive and 5ire already cover MCP-client ground more robustly.
- **Msty** — confirmed closed-source/proprietary, not inspectable.
- **`CherryHQ/cherry-studio`** — confirmed Electron despite reputation as a
  "modern" client; wrong runtime for this study's Tauri focus.
- **Enconvo** — no verifiable open-source repo surfaced; appears closed.
- **`onyx-dot-app/onyx`** — genuinely Tauri (MIT, ~10MB vs Electron's
  150MB) but the desktop app is a thin webview shell pointed at one
  `server_url` in a JSON config; switching backend means editing config
  and restarting, not a runtime adapter swap. Worth a footnote as a
  lightweight mature Tauri-wrapper pattern, not pinned.
- **`Austin-Patrician/multi-cli-studio`** — real Tauri repo, but adoption
  signals too thin to recommend confidently yet.
- **Open WebUI** (`open-webui/open-webui`) — the de facto market-standard
  chat UI, but verified as primarily a self-hosted web app: Python backend,
  SvelteKit frontend, server-side SQLite/Postgres persistence (multi-user
  by design, not per-user local files). It does have an official desktop
  wrapper, `open-webui/desktop` — Electron, "Early Alpha," architecturally
  a wrapper around the same web app rather than a ground-up native client.
  Not pinned: doesn't meet the native-shell bar Kaas/Dive/5ire/AnythingLLM
  set, though its MCP support (native since v0.6.31, Streamable-HTTP) and
  "Workspace" concept (model + knowledge + tools + prompt, bound and
  switchable — directly comparable to AnythingLLM's workspaces) are worth
  knowing about if the market-standard-UX question ever outweighs the
  native-shell one.

## Related

- `ai-labs/context-v/plans/Study-Agent-Harnesses-and-Conversational-UI-Before-Cross-Product-Shell.md`
  — the plan this study serves
- [[../agent-harnesses]] — the sibling study for runtime/backend harness
  behavior
- `memopop-ai/apps/memopop-native/` — the in-house Tauri shell this study
  informs a decision about

---
name: Dive Profile
slug: dive
upstream: https://github.com/OpenAgentPlatform/Dive
package: n/a (desktop app; ships as both `@tauri-apps` binaries and Electron/electron-builder binaries from one repo)
license: MIT
maintainer: Open Agent Platform (OpenAgentPlatform org; primary committer ckaznable)
study: studies/conversational-ui-and-native-shells
profile_path: studies/conversational-ui-and-native-shells/dive
profile_kind: Dual-shell (Tauri + Electron) MCP Host desktop app, React + Jotai frontend, Python MCP host subprocess
date_created: 2026-07-13
---

# Dive — Profile

A profile of Dive as it lives in this study (`studies/conversational-ui-and-native-shells/dive/`). `LICENSE:3` confirms MIT, Copyright 2025 Open Agent Platform. Read alongside `Profile__Kaas.md` (Tauri + React, single shell, everything in Rust) and `Profile__AnythingLLM.md` (Electron, workspace-switching) — Dive is the study's answer to "what does it look like to run the exact same product on two different native shells at once," and its MCP architecture is the study's clearest example of **the shell being reduced to a process supervisor around a separately-versioned, language-agnostic backend**, rather than the shell owning the agent logic itself.

## TL;DR

The README states the architecture plainly:

> Dive is an open-source MCP Host Desktop Application that seamlessly integrates with any LLMs supporting function calling capabilities... 🏗️ **Dual Architecture**: Modern Tauri version alongside traditional Electron version for optimal performance

Mechanically: **the actual MCP host is not Rust or TypeScript at all — it's a separate Python package, `dive_mcp_host`, pinned as its own git submodule** (`.gitmodules:1-3`, pointing at `https://github.com/OpenAgentPlatform/dive-mcp-host.git`, mounted at `mcp-host/` and left uninitialized in this pinned checkout). Both native shells do the same three things and nothing more: (1) write four JSON config files (`mcp_config.json`, `model_config.json`, `dive_httpd.json`, `plugin_config.json`, `command_alias.json`) to a per-shell config dir, (2) spawn `dive_httpd` as a child process — either via `uv run dive_httpd` in dev or a bundled Python interpreter in production (`electron/main/service.ts:171-184`; the Tauri equivalent in `src-tauri/src/host.rs:74-104`) — and (3) forward the port that process reports back to the webview. Everything an agent conversation actually needs — LLM calls, MCP client connections, tool listing, tool enable/disable, conversation history, skills — lives behind that Python HTTP server's `/api/*` routes, called with plain `fetch()` from React (`src/atoms/toolState.ts:64-79`, `src/components/ToolDropDown.tsx:92-99`). The frontend never imports a provider SDK or an MCP client library directly; it is an HTTP client to a localhost server that happens to be co-located and lifecycle-managed by whichever native shell launched it.

If you want one sentence: **Dive proves that a Tauri/Electron dual-shell strategy is cheap specifically because neither shell does anything domain-specific — both are ~500-line process supervisors that spawn the same Python `dive_httpd` binary, write the same JSON config files, and pipe its stdout/stderr to a log; the actual MCP host, LLM dispatch, and per-tool enable/disable state all live in a separately-versioned submodule reachable only over HTTP, so swapping the shell (or running both simultaneously) costs almost nothing.**

## The MCP host is a submodule, not in-process code

- **`mcp-host/` is a pinned git submodule, checked out empty in this study.** `.gitmodules:1-3` points it at `OpenAgentPlatform/dive-mcp-host.git`, branch `main` — a separate repo the shell code never vendors or inlines. `BUILD.md`'s architecture diagram spells this out directly: `mcp-host  # git submodule for dive-mcp-host` (`BUILD.md`, final block).
- **The dev/prod split is a straight Python-invocation difference, duplicated near-verbatim in both shells.** Tauri's `HostProcess::get_host_cmd()` (`src-tauri/src/host.rs:74-104`) runs `uv run dive_httpd` under `#[cfg(debug_assertions)]`, or in release mode execs a bundled `python3 -I -c "...from dive_mcp_host.httpd._main import main; main()"` against a `deps_dir` populated at build time. Electron's `startHostService()` (`electron/main/service.ts:171-184`) does the identical two-branch dispatch — `uv run dive_httpd` in dev, a resolved `pyBinPath`/`dive_httpd` binary (macOS) or the same `site.addsitedir(...); from dive_mcp_host.httpd._main import main` incantation (other platforms) in production. Same Python entrypoint, same two config knobs (`--port 0 --report_status_file <bus>`), independently reimplemented in Rust and Node.
- **Port discovery crosses the shell boundary via a filesystem "bus" file, not stdout parsing.** Both shells pass `--report_status_file <path>` and watch that file for a JSON line reporting the bound port: Electron via `fse.watch(busPath, ...)` parsing `message.server.listen.port` (`electron/main/service.ts:226-252`), Tauri via the analogous `HostProcess.file_path` set from `PROJECT_DIRS.bus` (`src-tauri/src/host.rs:52,65`). Once the port is known it's forwarded to the webview (`win.webContents.send("app-port", ...)` in Electron) so the frontend's `fetch()` calls target the right `localhost:<port>`.
- **Electron additionally manages a Node.js runtime download for Linux** (`downloadNodejs()`, `electron/main/service.ts:337-387`, pulling a pinned `NODEJS_VERSION = "22.22.0"` tarball) and a `uv pip install --target` dependency sync for the Python host (`installHostDependencies()`, `electron/main/service.ts:389-441`, hashing `uv.lock` to skip reinstall) — bootstrap concerns absent from the Tauri path, which instead resolves prebuilt binaries via `crate::dependency::{NODEJS_BIN_DIR, UV_BIN_DIR}` (`src-tauri/src/host.rs:146-166`) baked in at package time.
- **A separate Rust-native MCP server ships in-repo for built-in tools.** `packages/dive-mcp/src/service/{fetch,fs,echo}.rs` is a small stdio MCP server compiled as its own binary (`DEF_MCP_BIN_NAME`, referenced in `src-tauri/src/host.rs:14,60-63`) and auto-registered into `mcp_config.json` under the reserved name `__SYSTEM_DIVE_SERVER__` (`host.rs:23,229-246,296-321`; the identical logic is duplicated in `electron/main/service.ts:60-88`) — giving both shells a zero-dependency Fetch/File-Manager/Bash tool without needing `npx`/`uvx` at all.

## Per-tool enable/disable — server-level toggle plus per-sub-tool exclude list, both server-persisted

- **The config shape has two independent enable axes.** Each entry in `mcp_config.json`'s `mcpServers` map carries `enabled: bool` (the whole server on/off, defaulted to `true` on write — `host.rs:250-251`, `ToolDropDown.tsx:87-89`) and, separately, an `exclude_tools: string[]` naming which of that server's individual tools are switched off while the server itself stays enabled (`ToolDropDown.tsx:170-175, 290-293, 379-383`). Transport is inferred, not required: `cfg.transport = cfg.url ? "sse" : "stdio"` (`ToolDropDown.tsx:83-85`) — a bare `command` implies stdio, a bare `url` implies SSE.
- **Toggling is optimistic-UI over a POST, with a client-held config snapshot as the source of truth between round-trips.** `toggleTool()` (`ToolDropDown.tsx:155-209`) mutates a `mcpConfigRef` ref-held copy of the whole `mcpServers` map, flips one server's `enabled`, and POSTs the *entire* config to `/api/config/mcpserver` (`updateMCPConfig`, `ToolDropDown.tsx:74-110`) — there is no per-server PATCH endpoint; every toggle round-trips the full server list. A `?force=1` query param exists for the forced-restart path (`forceRestartMcpConfigAtom`, `src/atoms/toolState.ts` ~100-110).
- **Sub-tool toggling reconstructs `exclude_tools` from the currently-checked set, not from a diff.** `toggleSubTool()`/`subToolPost()` (`ToolDropDown.tsx:211-325`) recompute `exclude_tools = tool.tools.filter(t => !t.enabled).map(t => t.name)` on every change and re-POST the whole server config; disabling every sub-tool auto-flips the parent server's own `enabled` to `false` (`ToolDropDown.tsx:229-233`), and re-enabling the parent with all sub-tools off auto-resets `exclude_tools: []` and flips every sub-tool back on (`ToolDropDown.tsx:170-175`) — enabling a dead server always means "enable everything," never "enable the server with nothing selected."
- **Failure is surfaced per-server via a `disabled` UI flag, not a blocking error.** If the backend's response includes `errors: [{error, serverName}]`, the client sets that one server's `disabled = true` locally and re-POSTs to persist the rollback (`ToolDropDown.tsx:112-129, 181-192`) — so a misconfigured MCP server degrades to a visibly-broken toggle (red `Switch`, tooltip explaining "command not found" vs. generic start failure, `ToolDropDown.tsx:640-656`) rather than blocking the rest of the tool list.
- **Tool state is fetched fresh from the host on every dropdown open**, not just once at app start: `onOpen` re-runs `loadMcpConfig` → `loadOapTools` → `loadTools` (`ToolDropDown.tsx:749-760`), and `loadToolsAtom` (`src/atoms/toolState.ts:61-81`) cross-references `/api/tools` against `/api/config/mcpserver` so a tool whose server entry was deleted out-of-band doesn't linger in the list.

## The dual-shell strategy in practice — one Tauri backend added, one platform reverted

- **Tauri was added as a parallel backend, not a rewrite.** `git log` shows `b328115 feat: add tauri backend` (2025-07-28) as the origin commit, followed by ~40 tauri-tagged commits over the following year (`git log --oneline --all | grep -ic tauri` → 40) — steady incremental parity work (per-provider model lists, file download, image paste, codesigning, MS Store config, deep-link, updater endpoints), not a single big-bang cutover.
- **macOS was moved onto Tauri, then explicitly reverted to Electron 25 days later — and never moved back.** `7639393 chore: change the macos release to electron build from tauri build` (2025-08-22) edited only `.github/workflows/release.yml` (7 lines changed) — a CI/packaging decision, not a code removal; the Tauri macOS build path (`electron-builder.json`, macOS codesigning in `src-tauri/src/codesign.rs`) still exists in-tree. The current README's platform table (`README.md`, "Platform Availability") still shows macOS as Electron-only with Tauri marked `🔜` (upcoming) — **as of this pinned checkout, roughly eleven months after the initial Tauri backend landed, macOS Tauri has still not shipped**, while Windows and Linux both ship Tauri today.
- **Windows and Linux actively prefer Tauri in the README's own install guidance** ("Tauri Version (Recommended): Smaller installer (<30MB), modern architecture" for Windows; a working Tauri option for Linux too), while macOS users are told to "Download the .dmg version" (Electron) with no Tauri alternative offered.
- **The two shells share almost nothing at the source level beyond the `mcp-host` contract and a `shared/` directory of small cross-shell utilities** (`shared/preload.js`, `shared/keymap.ts`, `shared/oap.ts`) — everything else is duplicated per-shell: two IPC layers (`electron/main/ipc/*.ts` vs. `src-tauri/src/command/*.rs`), two process-spawn implementations, two Vite configs (`vite.config.ts` for Tauri's `dev:tauri`/plain `build`, `vite.config.electron.ts` for Electron's `dev`/`build:electron` — `package.json` scripts block). **Read literally: this is what "cheap to run two shells" costs in practice** — not zero, but bounded to shell-glue code, because the thing that would be expensive to duplicate (the agent/MCP logic) was never in the shell to begin with.
- **The takeaway for a Tauri-first shell (e.g. `memopop-native`) deciding whether to build in-place vs. start fresh:** Dive's structure argues for *not* needing to decide up front — if the actual agent/tool logic is pushed into a subprocess reachable over local HTTP (regardless of its implementation language), the shell becomes a thin, replaceable supervisor, and adding a second shell later is an incremental cost proportional to how much shell-specific glue (tray icons, deep links, native file dialogs, updater) has accumulated — which is exactly the set of things Dive's ~40 Tauri commits were mostly fixing.

## What's inside this submodule

| Path | What's there |
|---|---|
| `mcp-host/` | Git submodule (uninitialized in this pinned checkout) → `dive-mcp-host` — the actual Python MCP host (`dive_httpd`), owns LLM dispatch, MCP client connections, conversation persistence |
| `src-tauri/src/host.rs` | `HostProcess` — spawns/monitors `dive_httpd`, writes the four JSON config files, registers the built-in Rust MCP server |
| `src-tauri/src/command/*.rs` | Tauri `#[tauri::command]` surface — `host.rs`, `llm.rs`, `oap.rs`, `path.rs`, `system.rs`, `lipc.rs` |
| `src-tauri/src/state/{mcp,oap}.rs` | Tauri-managed state wrapping MCP/OAP client handles |
| `electron/main/service.ts` | Electron equivalent of `host.rs` — process spawn, bus-file port discovery, Node/Python dependency bootstrap |
| `electron/main/ipc/*.ts` | Electron IPC handlers — `llm.ts`, `oap.ts`, `path.ts`, `system.ts`, `menu.ts` |
| `packages/dive-mcp/src/service/{fetch,fs,echo}.rs` | Built-in stdio MCP server (Rust) — Fetch/File-Manager/Bash tools, registered as `__SYSTEM_DIVE_SERVER__` |
| `packages/dive-core/src/lib.rs` | Shared Rust core crate referenced by `dive-mcp` and `src-tauri` |
| `shared/{preload.js,keymap.ts,oap.ts}` | The actual cross-shell-shared source — small, deliberately minimal |
| `src/components/ToolDropDown.tsx` | Per-tool and per-sub-tool enable/disable UI — the file to read for the "swap context, load/unload tools" mechanism |
| `src/atoms/toolState.ts` | `toolsAtom`, `mcpConfigAtom`, `loadToolsAtom` — Jotai state backing the tool dropdown, all `fetch()`-backed |
| `vite.config.ts` / `vite.config.electron.ts` | Separate Vite configs per shell — confirms the build pipelines diverge, not just the packaging step |
| `BUILD.md` | Explicitly diagrams `mcp-host` as a submodule and documents the four ways to configure an MCP server (GUI, direct config edit, in-app editor, custom `.dive/scripts`) |
| `MCP_SETUP.md` | User-facing MCP server setup instructions (stdio + SSE + OAP-managed) |
| `docker/`, `scripts/docker/build-win.sh` | Cross-platform Windows build via Docker from macOS/Linux hosts |

If you read three files: `src-tauri/src/host.rs` alongside `electron/main/service.ts` (read them side by side — the duplication *is* the finding), and `src/components/ToolDropDown.tsx` (the complete per-tool/per-sub-tool enable-disable state machine).

## Mental model for using it well

- **Treat `mcp-host` as the product; the shell is disposable plumbing.** Neither `src-tauri/` nor `electron/` contains an LLM call, a tool-calling loop, or conversation state — that's all in the Python submodule, reached over `fetch("/api/...")`. If you're evaluating Dive as a reference for "should our shell own the agent logic or proxy to a subprocess," the entire repo is the worked answer: proxy to a subprocess.
- **Expect two of everything shell-specific, one of everything domain-specific.** IPC commands, process spawning, dependency bootstrap, Vite config — all duplicated per shell. LLM dispatch, MCP client management, tool enable/disable state, conversation history — all single-sourced in `mcp-host`.
- **Read `mcp_config.json`'s `enabled`/`exclude_tools` pair as the full state machine for "swap context, dynamically load/unload skills and MCP servers."** Server-level and tool-level toggles are independent axes, both persisted server-side via a full-config POST (no per-entity PATCH), and both surfaced through the same `ToolDropDown` component that also renders OAP-hosted (cloud-managed) tools identically to locally-configured ones (`isOapTool()`, `ToolDropDown.tsx:417-419`).
- **Don't expect the Tauri/Electron split to be feature-parity by default** — the platform-availability table is the living record of where parity actually stands (macOS Tauri still pending after ~11 months), and the divergence tracks accumulated shell-native surface area (codesigning, deep links, tray, updater) rather than the agent logic.

## When NOT to reach for this

- **You want a single-shell reference with everything in one language.** Dive's value is specifically the dual-shell comparison; if you want a clean single-stack Tauri+Rust example, `kaas` is the better read (persistence and provider dispatch both live in Rust, no cross-language subprocess boundary).
- **You want an in-process MCP client implementation to copy.** Dive's actual MCP client/host logic lives in the separate `dive-mcp-host` Python repo, not checked out in this pinned submodule — reading `dive/` alone will not show you MCP protocol handling, only the shell-side process supervision around it.
- **You need typed, compile-time-checked communication between shell and backend.** The shell↔host boundary is a bare `fetch()` against a JSON HTTP API with no shared schema between Rust/TS and the Python server — contrast with Kaas's typed `#[tauri::command]`/`invoke<T>()` surface for its (in-process) backend.
- **You want a minimal-dependency build.** Dive's production build bundles or downloads a Python interpreter, `uv`, and (on Linux) a Node.js runtime, per-platform, in addition to the shell runtime itself (`electron/main/service.ts:337-441`, `src-tauri/src/dependency.rs`) — a materially heavier bootstrap than a pure-Rust or pure-JS shell.

## How this compares to the rest of the study

| Axis | Kaas | dive | anything-llm |
|---|---|---|---|
| **Shell** | Tauri (Rust) + React | Tauri **and** Electron (dual, same React frontend) | Electron |
| **Agent/tool logic location** | In-process Rust (`LLMClient` enum) | Out-of-process Python submodule (`dive_mcp_host`/`dive_httpd`), reached via `fetch()` over localhost HTTP | (see `Profile__AnythingLLM.md`) |
| **MCP support** | None | Native — stdio and SSE transport, plus OAP-hosted cloud MCP servers | (see `Profile__AnythingLLM.md`) |
| **Per-tool enable/disable** | N/A (no tool-calling) | Two axes: server-level `enabled` + per-sub-tool `exclude_tools`, both full-config POST to `/api/config/mcpserver` (`ToolDropDown.tsx`) | (see `Profile__AnythingLLM.md`) |
| **Shell↔backend transport** | Typed `#[tauri::command]`/`invoke()` + `window.emit` string-sentinel streaming | Plain `fetch()` against a local Python HTTP server; no shared schema | (see `Profile__AnythingLLM.md`) |
| **Cross-shell duplication** | N/A (single shell) | Two full process-supervisor implementations (`host.rs` vs. `service.ts`) sharing only `shared/{preload.js,keymap.ts,oap.ts}` | (see `Profile__AnythingLLM.md`) |
| **Migration evidence** | N/A | Tauri backend added 2025-07-28 (`b328115`); macOS reverted to Electron 2025-08-22 (`7639393`, CI-only change) and still Electron-only ~11 months later per README | (see `Profile__AnythingLLM.md`) |
| **Best fit** | Local-first, credential-private multi-provider chat client, backend as trust boundary | Reference for "shell as thin process supervisor around a language-agnostic agent backend," and for realistic dual-shell migration cost/timeline | (see `Profile__AnythingLLM.md`) |

Dive's load-bearing contribution to this study is **evidence that a dual Tauri/Electron shell strategy is tractable specifically because the agent/MCP logic was pushed out of both shells entirely** — into a separately-versioned Python subprocess reached over plain HTTP — and **honest, dated evidence of how migrations actually go**: incremental, platform-by-platform, with at least one explicit revert (macOS) that has stayed reverted for the better part of a year.

## One-line summary

> Dive is a Tauri-and-Electron dual-shell MCP Host where neither shell contains any agent logic — both spawn the same Python `dive_httpd` subprocess (a separate `dive-mcp-host` submodule), write the same four JSON config files, and forward its localhost port to a shared React frontend that talks to it over plain `fetch()`; per-tool control is a two-axis `enabled`/`exclude_tools` toggle persisted via full-config POST from `ToolDropDown.tsx`, and the git history shows Tauri added mid-2025 with macOS explicitly reverted to Electron three weeks later and still not migrated back roughly eleven months on — the clearest real-world data point in this study for how much a shell migration actually costs and how long "in progress" can stay in progress.

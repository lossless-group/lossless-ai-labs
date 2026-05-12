---
title: "Moving an Agent Orchestrator to an API"
lede: "The orchestrator is a Python CLI today. To plug it into memopop-native, we need an HTTP-shaped surface. Three options, ranked by effort and time-to-value."
date_authored_initial_draft: 2026-04-30
date_authored_current_draft: 2026-04-30
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-04-30
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Exploration
tags: [Python, FastAPI, Tauri-Framework, API-Design, LangGraph, Sidecar-Process, Agent-Orchestration]
authors:
  - Michael Staton
image_prompt: A blueprint-style cutaway of a desktop application — a translucent native window on the left, a Python service icon on the right, a glowing localhost connector arcing between them, agent worker silhouettes lined up inside the Python service, soft violet uplight, technical annotations in monospaced font.
date_created: 2026-04-30
date_modified: 2026-04-30
from: "memopop-ai"
from_path: "context-v/explorations/Moving-an-Agent-Orchestrator-to-an-API.md"
---
# Moving an Agent Orchestrator to an API

Here's what the investigation turned up — the short version, then a recommendation.

## What the orchestrator actually is

A Python 3.11+ CLI. **No server.** You run `python -m src.main "Company Name"` and it executes a LangGraph DAG synchronously — ~30 specialized agents (deck analyzer, researchers, writers, validators, fact-checkers, scorecard, exporter) running in sequence for **15–45 minutes per memo**.

Output is a directory of ~50 files: per-section markdown, research JSON with citations, validation reports, a final assembled `.md` + `.docx` + a one-pager `.html` / `.pdf`.

The clean Python entry point already exists — `generate_memo()` in `src/workflow.py:571` takes a company name plus a dozen optional kwargs and returns the final state.

## Three viable shapes for an API

### 1. `subprocess.Popen` the existing CLI

Lowest effort. Tauri (or a tiny FastAPI shim) spawns `python -m src.main ...`, streams stdout line-by-line as progress, and watches for files appearing in the output directory.

- **Pros:** zero changes to the orchestrator. Works today.
- **Cons:** fragile to argument-shape changes, harder to recover from mid-run failures, no structured progress events.

### 2. Local FastAPI sidecar — bundled with Tauri

Run a FastAPI server alongside the Tauri app on `localhost:<port>`, calling `generate_memo()` as a function in a background thread or process.

- `POST /memos` returns a `job_id`.
- `GET /memos/{id}/status` polls.
- SSE or WebSocket streams progress.
- Tauri's Rust side launches the sidecar on app start.

No network dependency, no auth needed, runs on the user's machine, uses the user's Anthropic key. The transport seam from session 02 stays unchanged — `/memos` is just another route the dispatcher knows about, except now it talks HTTP instead of IPC.

### 3. Hosted FastAPI server — deploy somewhere

Same FastAPI, but in a container on Fly.io, Railway, or a VPS. Tauri talks to a hosted URL.

Now you need:

- Auth.
- Multi-tenant isolation.
- BYO API keys (or you eat them — at $5–20+ per memo of Claude / Tavily, that's not viable for a free tier).
- Persistent storage for output files.
- File-serving back to the client.
- A queue (Celery or RQ) because a single 30-minute job blocks the worker.

## Recommendation: start with option 2 (local sidecar)

Reasons:

- **It matches the spec's mental model** of memopop-native as a "thin shell over the Python orchestrator." The orchestrator *is* on the user's machine — they cloned it. We just need a thin HTTP shim, not a deployment.
- **BYO API keys stays simple** — the orchestrator already reads from `.env` in the cloned repo. No secrets to manage server-side.
- **The Transport interface from session 02 was built for this swap.** `LocalTransport` today routes `/memos` to a Rust dispatcher; tomorrow it routes to `http://localhost:8765/memos`. Components don't notice.
- **The work is small.** Write `serve.py` (~100 lines of FastAPI wrapping `generate_memo` in a `BackgroundTasks` job, with SSE for log streaming), make Tauri spawn it as a sidecar process on app start, register `/memos` routes in the Rust dispatcher to forward to the sidecar.
- **Hosted comes later, when you actually need it** (sharing memos publicly, demo URLs, multi-user). The same FastAPI moves to a container basically unchanged — the delta between local and hosted is auth + storage + job queue, and you don't need any of that yet.

## The one real gotcha

The orchestrator assumes it runs from the repo root: templates are resolved by relative path, and the resume script uses `cwd=Path(__file__).parent.parent`.

- For the local sidecar this is fine — Tauri spawns it with `cwd` set to the user's anchored repo path.
- For hosted, you bake the templates into the image.

Not a blocker either way.

## Open questions before starting

- **Python env on the user's machine.** Are we OK with the user needing a working Python env in their cloned orchestrator repo? That's the floor today regardless — no API wrap changes that. The sidecar runs `python -m ...` from their repo, using their venv.
- **Streaming progress vs. log tailing.** Do we want structured streaming events (SSE: each agent step emits "research started", "validation complete") or is "tail the stdout log" enough for now? The orchestrator already prints status messages during the run, so even log-tailing gives reasonable feel-good progress without changing Python code.
- **Where the deal config gets persisted before kickoff.** The captured payload currently sits in the `ready_to_run` flow stage in memory. Probably written to `io/{firm}/deals/{deal}/config.json` — that's the orchestrator's existing shape — and then the API call references the deal directory.

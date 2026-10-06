---
title: "The Sidecar Port Is Adopted, Not Owned"
lede: "Tauri probes 8787 and uses whatever answers. A stray dev sidecar becomes the app's backend, silently, and the app looks fine."
publish: true
date_created: 2026-08-23
date_modified: 2026-08-23
date_authored_initial_draft: 2026-08-23
date_authored_current_draft: 2026-08-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: Draft
site_uuid: 71201993-7353-4b26-b724-f45e5b02f3b4
hex_code: 0tjns6
tags:
  - Reminder
  - Corpora-Builder
  - Tauri
  - Agent-Discipline
from: "corpora-builder"
from_path: "context-v/reminders/The-Sidecar-Port-Is-Adopted-Not-Owned.md"
---
# The Sidecar Port Is Adopted, Not Owned

## What happened

An agent started a sidecar on `127.0.0.1:8787` against a **synthetic test
corpus** while working. The operator then launched the desktop app. The app came
up, listed sources, and showed focus chips reading *Ocean Energy* and
*Automation* — fixtures from the agent's scratch directory, rendered as though
they were the client's corpus.

Nothing errored. Nothing looked broken. The app was simply pointed at the wrong
corpus.

Separately, the agent's `vite dev` held **1420**, so `tauri dev` died with
`Port 1420 is already in use` — the loud half of the same mistake, and the only
half that announced itself.

## Why

`src-tauri/src/lib.rs::ensure_sidecar` opens with:

```rust
// Probe first, always. A tracked handle proves nothing about a live process.
if healthz_ok().await {
    return Ok(());
}
```

That probe is right, and it exists for a good reason — a handle the Rust side is
holding proves nothing about whether the process is alive. **But its converse is
that any process answering `/healthz` on 8787 is adopted as the backend**, with
no check that it is the one this app would have spawned. `/healthz` reports a
label; nobody compares it to anything.

## The rule

**An agent must not leave a sidecar or dev server on the app's ports.**

- `8787` — the sidecar. Occupying it silently redirects the desktop app.
- `1420` — `vite dev`, and `tauri.conf.json` uses `--strictPort`, so it fails
  outright rather than moving.

When a running instance is needed for verification, use different ports and
point the frontend at the other one:

```bash
uv run python -m src.cli --local <corpus> serve --port 8788
cd app && VITE_CORPORA_API=http://127.0.0.1:8788 bunx vite dev --port 1421
```

`VITE_CORPORA_API` exists for exactly this. The packaged app never sets it, so
8787 stays the contract.

**And before killing anything on 8787, look at what it is.** `curl -s
localhost:8787/healthz` reports the label. A sidecar reading `Reach Edu` is the
operator's session, not litter — killing it takes their app's backend out from
under them.

## Still open

The adoption is unverified. `ensure_sidecar` could compare `/healthz`'s label
against the workspace it is about to serve, and spawn its own on a mismatch
rather than adopting a stranger. Not built; this reminder is the mitigation.

## Related

- `app/src-tauri/src/lib.rs` — `ensure_sidecar`
- `context-v/specs/Browse-Corpus.md` — `/healthz` and the CORS origin contract
- [[../contracts/Autonomy-Gates]] — what an agent may do unattended

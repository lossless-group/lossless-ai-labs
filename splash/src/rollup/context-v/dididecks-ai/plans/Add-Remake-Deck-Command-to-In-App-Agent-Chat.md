---
title: "Plan: Add /remake-deck as a command in the DidiDecks in-app agent chat"
lede: "Let a user type /remake-deck in the app's AI command lane and get N verified design variants back as a reviewable proposal, by running the existing remake pipeline on a worker instead of in a terminal."
publish: false
date_created: 2026-10-02
date_modified: 2026-10-02
date_authored_initial_draft: 2026-10-02
date_authored_current_draft: 2026-10-02
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Draft
tags:
  - Plan
  - In-App-Agent-Chat
  - Subagent-Orchestration
  - Remake-Deck
  - Frontend
builds_on:
  - "[[Remake-Source-Deck-into-Design-Variants]]"
  - "[[Remote-Mount-Contract-for-In-App-Agent]]"
  - "[[In-App-Agent-Chat-As-Built-vs-As-Specced]]"
from: "dididecks-ai"
from_path: "context-v/plans/Add-Remake-Deck-Command-to-In-App-Agent-Chat.md"
---
# Plan: /remake-deck in the in-app agent chat

## Where things stand (2026-10-02)

- **The pipeline exists and works.** `/remake-deck` runs today from Claude Code
  (`.claude/commands/remake-deck.md`) and from any Agent-Skills chat (the
  `remake-deck` skill). Both execute
  [[Remake-Source-Deck-into-Design-Variants]]. It was dry-run end to end on
  EventCut's deck: three variants, all verified in the shell.
- **The app's chat is a mock.** `apps/frontend` (your collaborator's SvelteKit
  app, June 2026) has an **AI command lane**:
  - `src/lib/components/editor/AiCommandPanel.svelte` posts free text to
    `POST /api/dididecks/ai-commands`.
  - `src/lib/server/dididecks/aiCommands.ts` returns a fake proposal (it appends
    " refined" to the first field).
  - The proposal mutates nothing until it is accepted, and an accepted proposal
    still has to pass `guardrails.ts`.
  - State is in-memory, and the app deploys to Vercel serverless (`docs/VERCEL_DEPLOYMENT.md`).
- **There is no shared chat package.** `@lossless/in-app-agent` was never built
  (see [[In-App-Agent-Chat-As-Built-vs-As-Specced]]). This plan doesn't wait for it.

## The core constraint

A remake run takes **30–60 minutes**. It spawns about 10 subagents, renders PDFs,
runs `astro check`, `pnpm build`, and a dev server, drives headless Chrome, and
writes files into a client-site git repo. **None of that can run inside a
Vercel function.** Vercel functions are short-lived and stateless, and they have
no repo checkout and no browser.

So the app only *starts* and *watches* the job. A **worker** with a repo
checkout does the work.

## Shape

```
AiCommandPanel  ── "/remake-deck ..." ──▶  POST /api/dididecks/ai-commands
                                              │  parse slash command
                                              ▼
                                       create RemakeJob (queued)
                                              │
                         ┌────────────────────┴────────────────────┐
                         ▼                                         │
                   Remake worker  ── progress events ──▶  GET /api/.../jobs/:id (SSE or poll)
                   (repo checkout + Claude Agent SDK              │
                    running the plan as orchestrator)             ▼
                         │                                  AiCommandPanel shows
                         ▼                                  step-by-step progress
                   pushes branch remake/<date>-<deck>
                         │
                         ▼
                   AiChangeProposal: "3 variants ready"  ── Accept ──▶ merge branch into
                   (links to preview URLs, NEEDS list,                  the client-site's development
                    client flags)                       ── Reject ──▶ delete branch
```

This keeps the app's existing rule: **AI commands create proposals; nothing
lands until a human accepts it.** The dry run already used the same isolation:
all output went to a throwaway branch, never to `development`.

## Phases

### Phase 1: Slash-command registry in the command lane (frontend only, no AI)

- In `aiCommands.ts`, recognize commands that start with `/` before the
  free-text path. Add a small registry: `{ name, argsSchema, handler, scope: 'deck' | 'workspace' }`.
- `/remake-deck` parses `<Company> <client-site> <source-deck>` plus `KEY=value`
  pairs into the plan's variables (the same mapping as `.claude/commands/remake-deck.md`).
  Reject bad input with a clear message, and don't create a proposal.
- `AiCommandPanel.svelte`: when the text starts with `/`, show autocomplete
  and argument hints, and add a "Remake this deck" preset beside the existing
  presets. On `/decks/new`, wire the "Upload existing deck" card to the same command.
- Extend the `AiCommand` status union with `'running'` and `'failed'`. It lives in `packages/shared/src/dididecks.ts`.

**Done when:** typing `/remake-deck` shows hints, and a valid command creates a
job record with `status: queued`. The job doesn't run yet.

### Phase 2: The worker (local first)

- A small Node service (proposed: `apps/remake-worker/`) that takes a job,
  checks out the client-site, creates the `remake/<date>-<deck>` branch, and runs
  the plan through the **Claude Agent SDK**. The orchestrator's system prompt is
  the plan file, each prompt file is registered as a subagent definition, and
  the working directory is the dididecks-ai checkout.
- It emits progress events at each of the plan's gates (extracted, audited,
  designer k done, refactored, verified), so the panel can show real progress
  rather than a spinner.
- It stores the client-site's viewer passcode as a worker secret for the verify
  step. The passcode never travels through the app.
- **Run it locally first**, next to `pnpm dev` of the frontend, and prove
  one job end to end on a throwaway client-site before deploying anything.

**Done when:** a command typed in the local app produces a pushed branch
with N verified variants, and the panel shows each gate as it passes.

### Phase 3: Proposal, accept, reject

- When a job finishes, it creates an `AiChangeProposal` whose summary lists the
  variants (label, concept, preview URL), every `[NEEDS: ...]` placeholder, and
  the client flags from the extraction audit.
- **Accept** merges the branch into the client-site's `development` branch
  (fast-forward or merge commit), then bumps the gitlink later as usual.
  **Reject** deletes the branch.
- Previews: either the worker keeps a dev server up per job, or the branch is
  pushed and Vercel builds a preview deployment of the client-site. The second
  needs no long-lived worker process.

### Phase 4: Deploy the worker

- Host it where long jobs and a filesystem are normal. Railway is already in use
  in this tree (`use-railway` skill, `*.didi.sh`), so it's the default candidate.
- The app needs a job store that survives Vercel's in-memory resets. This is the
  first real persistence the frontend needs; see the decisions below.

## Decisions to make before Phase 2

1. **Where the worker runs.** Railway is the recommendation. The alternative is
   a Tauri/desktop sidecar on the user's own machine (the `memopop-native`
   SidecarManager pattern from [[In-App-Agent-Chat-As-Built-vs-As-Specced]]),
   which keeps client decks off our servers.
2. **Whose API key pays.** Managed key (`docs/MANAGED_AI_PROVIDER_MVP.md` already
   sketches the admin provider screen) or BYOK. A run is roughly 1–2M tokens, so
   this is also a pricing and entitlements question (`canRunAiCommand`).
3. **Repo access for the worker.** A GitHub App or a deploy key per client-site.
   Client-site repos are private, and some hold client-confidential material.
4. **The job store.** Turso/libSQL, matching the client-sites' auth DB, is the
   lowest-friction option.

## Coordination

`apps/frontend` is your collaborator's code. Phase 1 changes her command lane
and the shared types, so agree the slash-command registry shape with her before
building it. Phases 2–4 are additive (a new app, new routes) and touch her code
only at the job and proposal endpoints.

## Related

- `astro-knots/context-v/agent-skills/generate-site-design-variants`, a
  parallel skill doing the same N-variant fan-out for whole sites. If both
  stabilize, the worker could run either.

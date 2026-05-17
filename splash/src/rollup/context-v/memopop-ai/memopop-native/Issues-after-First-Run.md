---
from: "memopop-ai/memopop-native"
from_path: "context-v/Issues-after-First-Run.md"
---


1. It wrote to the wrong dir after you said you fixed it. I already moved it to the correct location. If a user is choosing a firm, or has created a firm, the conventions are clear

io/{firm-name}/deals/{Dealname}/outputs/{Dealname}-v{version} with convention 0.0.1 as version

2. It should have created a new version, not overwritten the old one.  We haven't even begun to think about ticking the option to resume from a previous version that stopped midway through.  We have the function, but the MemoPop native app shouldn't even know to call it yet. 

3. Probably the most important thing is: the log viewer was glitch, and seemed to eat a lot of memory.  My computer basically froze towards the end of MemoPop's run. While it was running, the window log viewer kept going black, every 20-20 seconds or so. 

4. Probably related to the last two, the checklist of milestones updated only after it was all run.  That was pretty weird.  It should have updated in real time.

All three fixes landed cleanly.

  1. Log viewer memory + glitching (Issue 3) — flow.svelte.ts and LogStream.svelte:
  - Events array capped at 2,000 in the store (rolling window via slice(-2000) when exceeded).
  Milestones uncapped — they're small and the checklist needs the full pipeline.
  - Rendered lines capped at 1,000 in the LogStream pane. When earlier lines are dropped, a small ⋯ N
   earlier lines hidden — full log on disk in server-log.txt banner appears at the top of the pane so
   you know they're not lost.
  - Auto-scroll coalesced via requestAnimationFrame. Multiple events arriving in the same frame now
  trigger one layout calculation instead of N.

  2. Checklist not updating in real time (Issue 4) — should resolve as a side effect of #1.
  Milestones come through the same SSE bus as logs; when the webview wasn't thrashing, milestones
  reactively flow to the checklist normally. If they still lag after the next run, it's a different
  bug and we'll dig deeper.

  3. Sidecar shutdown reliability — src-tauri/src/lib.rs:
  - Now handles BOTH CloseRequested (user clicks close / Cmd+W / Cmd+Q on macOS) AND Destroyed.
  Either fires manager.shutdown(), which kills the Python child via the stored CommandChild. This is
  the change that prevents today's debug cycle from happening again — quitting the app actually
  terminates the sidecar.

  Build status: bun run check clean (only pre-existing warnings), cargo check clean.

  Issues 1 and 2 (wrong dir, no version bump): not directly touched in this pass — they're already
  fixed in code (the scaffold landed earlier). They'll resolve as soon as a fresh sidecar runs the
  new code.

  To verify all four issues are fixed, the sequence is:

  1. Quit MemoPop. Verify the sidecar is gone: ps aux | grep 'src.server' | grep -v grep should
  return nothing. If it's still there (PID 66363), kill 66363 manually as a safety net — until you're
   running the new Tauri build, the new shutdown handler isn't active yet.
  2. Reopen MemoPop (bun run tauri dev from memopop-ai/apps/memopop-native). The Rust shell will
  recompile with the CloseRequested handler and frontend changes will be live.
  3. Kick off a memo for ChromaDB on alpha-partners. Expected:
    - Files land at io/alpha-partners/deals/ChromaDB/outputs/ChromaDB-v0.0.1/. (Or v0.0.2 if you
  didn't move yesterday's output/ChromaDB-v0.0.1/ — the scaffold creates the firm-scoped tree, but
  version_mgr reads io/alpha-partners/versions.json for history.)
    - Logs persist to that output dir AND to .logs/runs/{job_id}__ChromaDB-vX.Y.Z.{jsonl,txt}.
    - The log pane stays responsive — should not freeze, and the checklist on the left should tick
  over phases live as milestones arrive.
    - Quitting MemoPop kills the sidecar within a second.
  4. Kick off a second memo for ChromaDB. It should auto-increment to the next version (v0.0.2 or
  v0.0.3) — not overwrite.

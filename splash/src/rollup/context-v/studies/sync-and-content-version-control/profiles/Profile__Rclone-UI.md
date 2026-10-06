---
name: Rclone UI Profile
slug: rclone-ui
upstream: https://github.com/rclone-ui/rclone-ui
homepage: https://rcloneui.com/
pinned_sha: da6e134
pinned_date: 2026-08-21
version_at_pin: "v3.7.3"
license: Apache-2.0
maintainer: rclone-ui org (independent of the rclone project itself)
study: studies/sync-and-content-version-control
profile_path: studies/sync-and-content-version-control/rclone-ui
profile_kind: Desktop GUI over rclone — Tauri shell, React front end, Rust scheduler
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.0.2
status: Draft
site_uuid: 3216cd55-a2b8-4971-9355-60a963460599
hex_code: 9u06dv
lede: >-
  The only entry that solves the trigger problem — 5,167 lines of Rust registering
  jobs with launchd, crontab, and Task Scheduler behind one trait.
summary: >-
  Profile of Rclone UI as pinned in the sync-and-content-version-control study.
  Unlike every other entry it is a surface rather than an engine, and it earns
  its place for two things neither the study nor the Lossless plans had an answer
  to. It proves rclone has an HTTP daemon API — correcting a claim made during
  the exploration that rclone is batch-only — and it ships a cross-platform OS
  scheduler abstraction with four backends plus append-only JSONL run history and
  synthesized crash detection. Also records what it does not have: no file
  version history of any kind, and a React UI layer the tree prohibits.
tags:
  - Profile
  - Rclone
  - Rclone-UI
  - Tauri
  - Scheduling
  - Cross-Platform
publish: true
from: "studies/sync-and-content-version-control"
from_path: "context-v/profiles/Profile__Rclone-UI.md"
---
# Rclone UI — Profile

A profile of Rclone UI as it lives in this study (`studies/sync-and-content-version-control/rclone-ui`, pinned at `da6e134`, v3.7.3, 2026-08-21). Apache-2.0. Tauri shell, React + HeroUI + Tailwind front end, Rust backend. Site: <https://rcloneui.com/>.

**This entry is a different kind from the rest.** Every other reference here is an *engine* — a store, a transport, a VCS. This is a **surface** over one of them, and it is pinned because it answers two questions the engines left open and one the Lossless plans got wrong.

## The correction it forces

During the 2026-08-22 exploration
(`lossless-monorepo/context-v/explorations/Sync-Dirs-in-Pseudomonorepo-Architecture.md`)
the claim was made that **rclone is a batch tool with no daemon**. That is right
about *watching* and **wrong about running as a service.**

rclone has a full HTTP remote-control API (`rclone rcd`), and this app is built
entirely on it (`lib/rclone/client.ts:54`, `baseUrl: 'http://localhost:5572'`).
Endpoints in use:

| Endpoint | What it gives |
|---|---|
| `/core/stats` | Live transfer statistics, filterable by `group: job/<id>` |
| `/core/transferred` | **The list of transferred items**, grouped by job |
| `/job/status` | Async job state |
| `/job/batch` | Batched job submission |
| `/sync/sync`, `/sync/bisync` | Async submission of one-way and bidirectional syncs |

So rclone can be a long-running service driven programmatically over HTTP. The
exploration's conclusion does not change — there is still no file *watcher* — but
"batch tool, invoke and exit" was too narrow, and any design that wants live
progress out of rclone should reach for `rcd` rather than parsing stdout.

`/core/transferred` matters most here: it is a per-item record of what moved,
grouped by job (`lib/rclone/api.ts:178-231`). For the **transport** layer that is
a change record, ready-made.

## The genuinely valuable part: a cross-platform scheduler

The exploration ended on a residue it could not resolve:

> Watching is cross-platform. **Keeping the watcher alive at login is not.**
> There is no portable "run this at login" primitive.

**`src-tauri/src/scheduler/` is 5,167 lines of Rust that solves exactly that.**
A `SchedulerBackend` trait (`mod.rs:78`) with per-OS implementations selected by
`#[cfg(target_os = ...)]`:

| File | Lines | Backend |
|---|---|---|
| `mod.rs` | 771 | The trait, dispatch, reconcile |
| `cronconv.rs` | 958 | Cron expression conversion/validation |
| `runner.rs` | 876 | The headless run path (the binary re-invokes itself) |
| `launchd.rs` | 593 | **macOS user-mode** — per-user LaunchAgents |
| `history.rs` | 545 | Append-only JSONL run history |
| `schtasks.rs` | 524 | **Windows** — Task Scheduler via `schtasks.exe`, full XML task definitions |
| `crontab.rs` | 474 | **Linux, and macOS system-mode** |
| `storeread.rs` | 228 | Reading app dirs/config from the runner process |
| `jobfile.rs` | 130 | Job spec on disk |
| `winjob.rs` | 68 | Windows job-object kill semantics |

### The launchd doc comment is the reason to read this

`launchd.rs:1-12` explains *why* LaunchAgent over crontab on macOS, and it is
exactly the hard-won detail a study exists to capture:

> Chosen over crontab for user mode because a LaunchAgent runs inside the user's
> Aqua login session — it has the login Keychain, session-mounted `/Volumes`, and
> (crucially) **TCC attributes protected-folder access to the app's own code
> signature**, so the task inherits the grants the user gave Rclone UI rather than
> needing Full Disk Access on `/usr/sbin/cron`.

And a second design note worth stealing: **enabled state is durable via file
location, not `launchctl disable`**, because launchctl's override database is not
reliably inspectable.

macOS therefore uses *two* backends — LaunchAgent for user-mode, crontab for
system-mode — which is a distinction the exploration's one-line "macOS = launchd"
did not capture.

### Run history, and the silent-failure answer

`history.rs` is an **append-only JSONL file per task**, written only by the runner
process while the GUI only reads — explicitly to avoid two processes writing one
store file (`history.rs:1-5`). Rotation at 512 KB keeping 200 lines; runner logs
rotate at 1 MB.

The record shape (`lib/scheduler.ts:36-53`):

```ts
lastFinished?: {
    runId: string; ts: string; success: boolean; error?: string
    durationMs: number; jobids?: number[]
    stats?: { bytes?: number; transfers?: number; errors?: number }
    /** Synthesized: the run left a started event but no finished one (crash/power loss). */
    interrupted?: boolean
}
warning?: string  // installed+enabled but the OS won't fire it
```

Two things there are directly on point for the Lossless work:

1. **`interrupted` is synthesized** from a `started` event with no matching
   `finished`. That is the answer to the failure mode the exploration named and
   left open — *"a watcher that dies stops syncing without saying so… the new
   failure is 'we thought it was automatic'."* You detect it by pairing events,
   not by asking the OS.
2. **`warning` covers installed-but-won't-fire** — e.g. the macOS background item
   toggled off in System Settings. A health signal distinct from "it failed."

`{ ts, success, durationMs, stats: { bytes, transfers, errors } }` is also
recognisably a sibling of the `Change` record specced in
`corpora-builder/context-v/specs/Corpus-Change-Feed.md`. Same instinct, different
subject: that one describes *what changed in a corpus*, this one *what a sync run
did*. They are complementary, not competing.

## What it does not have

**No file version history, of any kind.** Worth stating plainly because the name
invites the opposite guess:

- **`lib/rclone/versions.ts` is a false lead.** It manages *which rclone binary
  version* the app runs — `listDownloadedVersions`, `AvailableRelease`,
  `DownloadProgress`, config-path symlink management. Nothing to do with file
  history. Do not chase it.
- **No `--backup-dir` or `--suffix` support.** A grep across `lib/` and `src/`
  finds no use of rclone's own poor-man's versioning. So the app cannot show you
  a previous version of a file, and neither can rclone underneath it without
  flags this app does not pass.

So on the study's central question — *at which layer does history live* — this
entry answers **nowhere**, exactly like [[Profile__Syncthing]], and for the same
reason: it is transport, and transport does not keep history.

**The UI layer is React**, with HeroUI and Tailwind. React is a hard prohibition
across the tree, so **none of the front end is liftable**. The **Rust** half is,
and it is the half worth reading. Treat `src/` and `lib/` as illustration of what
the Rust exposes, not as source to borrow.

**The embedded document viewers are a non-finding.** It bundles `@embedpdf/*` for
PDF and `@extend-ai/react-docx|pptx|xlsx` for Office formats. Tempting to note as
useful for a corpus that carries 41 binaries — but it solves a problem a
client-facing surface does not have. **A reader already owns viewers.** A PDF
link opens in the browser's native viewer; a `.docx` or `.xlsx` downloads and
opens in whatever the reader already uses. Building an in-app viewer to avoid a
download is effort spent on a step nobody objects to, and it drags a heavy render
dependency into a surface whose whole job is to be light.

The reason this app has them is that it is a **desktop file manager** — the user
is browsing remote storage and wants to look without downloading. That is a
genuinely different product from a change feed.

## How it scores against the study checklist

| Checklist item | Rclone UI |
|---|---|
| **Unit of sync** | Whatever rclone's is — a path pair |
| **Where history lives** | **Nowhere.** Run history only, not file history |
| **Content addressing** | None of its own; inherits rclone's hashing for comparison |
| **Blob-storage story** | Everything rclone supports, which is everything |
| **Conflicts** | Surfaces rclone `bisync`'s conflict flags; adds no semantics |
| **Structural read-only** | Not modelled; a job is a job |
| **Plain files on disk** | Yes — it is rclone |
| **Labels / legibility** | Task names and run history. **No human reason per version**, because no versions |
| **Retention policy** | History rotation only (512 KB / 200 lines) |
| **Ops cost** | A desktop app. But the *scheduler* is a library-shaped chunk of Rust |

## What to take from it

Ranked by usefulness to the Lossless plans:

1. **The `SchedulerBackend` trait and its four implementations.** This is the
   cross-platform "run this on a schedule at login" answer the exploration said
   did not exist. Even read-only, it settles what the per-OS mechanisms are and
   why — the TCC reasoning alone is worth the pin.
2. **`interrupted` by event-pairing.** The cheapest possible answer to "did the
   automation quietly die," and it needs no OS cooperation.
3. **`rclone rcd` + `/core/transferred`.** If the fan-out ever wants live
   progress or a per-item record of what moved, it is an HTTP call, not stdout
   parsing.
4. **Append-only JSONL, single writer, GUI reads only.** A small, correct pattern
   for exactly the "two processes and one state file" trap.

## Read next

- `src-tauri/src/scheduler/launchd.rs:1-12` — read the doc comment before anything else
- `src-tauri/src/scheduler/mod.rs:78` — the trait, then follow the `cfg(target_os)` arms
- `src-tauri/src/scheduler/history.rs:1-30` — the JSONL + rotation contract
- `lib/scheduler.ts:16-60` — the TS-side view of a task, its status, and the history line union
- `lib/rclone/api.ts:178-231` — `/core/transferred` and how a job's items are grouped
- **Skip** `lib/rclone/versions.ts` unless you care about managing rclone binaries

## Related

- [[Profile__Syncthing]] — the other entry with transport but no history
- [[Profile__Kopia]] — where a `Description` per version lives, which this has no equivalent of
- `lossless-monorepo/context-v/explorations/Sync-Dirs-in-Pseudomonorepo-Architecture.md` — the exploration this corrects on `rcd`, and whose scheduling residue this resolves
- `ai-labs/corpora-builder/context-v/specs/Corpus-Change-Feed.md` — the sibling record shape
- `ai-labs/corpora-builder/scripts/mirror_corpus.sh` — the CLI-only approach this is the GUI counterpart to

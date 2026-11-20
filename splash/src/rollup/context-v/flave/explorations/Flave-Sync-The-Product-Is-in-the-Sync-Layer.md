---
title: "Flave Sync — The Product Is in the Sync Layer"
lede: "The format and the instruction kit are free, and every chat that follows them makes .flave files. The business is what keeps track of those files: find them, file chat exports by id, offload them, sync them, share them, and pull a collaborator's changes. Dropbox and iCloud can store a .flave. They can't understand it."
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
at_semantic_version: 0.0.0.1
status: Open
publish: true
site_uuid: 67871c05-2688-476f-b4fd-edf97178bea7
hex_code: fsyn4k
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
categories: Exploration
spec_reference: "[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]"
continues:
  - "[[A-Flave-Is-the-Zip-for-an-Agent-Session]]"
  - "[[The-Flave-Document-Service-Not-A-Forge]]"
  - "[[A-Syncbox-For-Client-Document-Folders]]"
tags:
  - Exploration
  - Flave
  - Sync
  - Business-Model
  - Sharing
  - Offload
  - Cloudflare-Artifacts
type: Explorations
from: "flave"
from_path: "context-v/explorations/Flave-Sync-The-Product-Is-in-the-Sync-Layer.md"
---
# Flave Sync — The Product Is in the Sync Layer

## Why care?

The primary use case changed on 2026-11-19. Flave is no longer first a desktop
app with its own agent chat. It is an **instruction kit**: a prompt or link
given to Claude, ChatGPT, Perplexity or a local model kit like LM Studio,
saying *"use this format; organize and store files like this."* The chat's own
sandbox keeps the folder, and the person asks for it, or the chat offers it, as
a `.flave` at any time.

That makes the format and the kit the free part, and a lot of `.flave` files
the result. The owner's framing of where a company could be:

> Where I was thinking there might be a "startup" style product is actually
> saving/syncing these files to a remote server, and having Dropbox-style
> sharing there. In addition to Dropbox and iCloud, having a system-level
> feature that can "ripgrep" all .flave files and give the user an easy way to
> "sync or offload" those files so they can save space on their hard drive,
> sync and share, etc. Also to sync from whatever a collaborator did, like pull
> the updates down from the cloud.

The precedent is Obsidian: the app and the Markdown are free, and Obsidian Sync
is what people pay for. Here the format and the kit are free, and **Flave Sync**
is the product.

This also gives a home to work that the instruction-kit use case parked: the
Artifacts remotes (spec §8.5), the in-chat connector, `jj`, the Syncbox
exploration's legibility layer, and the Tauri build, which becomes the desktop
sync client.

## Why people wouldn't just use Dropbox or iCloud

> [!important] **The core argument for the product.**
> Dropbox and iCloud store a `.flave` folder, but they don't understand it:
>
> - **They corrupt version history.** Syncing a live `.git` or `.jj` folder
>   through Dropbox, iCloud or Syncthing is a known way to break the repository
>   ([[A-Syncbox-For-Client-Document-Folders]]).
> - **They sync your secrets.** They'd upload `.secrets` and `.env` along with
>   everything else.
> - **They can't tell versions apart.** Two exports of the same document are
>   just two folders. A flave sync knows they're one document, by the `id` in
>   `flave.yaml`.
> - **Merging is all or nothing.** A collaborator's edit replaces your copy or
>   produces a "conflicted copy" file.
> - **Sharing exposes raw files.** A share link shows the folder's files, not
>   the finished deliverable.

Each of these follows from something the spec already fixes, which is why a
format-aware sync can do what a general one can't:

| Dropbox / iCloud problem | What flave already has that fixes it |
|---|---|
| Breaks `.git` / `.jj` | History is a git remote (§8.5); sync pushes and pulls through git, never by copying the history folder |
| Uploads secrets | `.secrets`, `.env` and `dist/` are never shared, by rule (§5.8), and every outbound path scans for keys (§10.2 rule 7) |
| Can't tell versions apart | Every flave has an immutable UUIDv7 `id` in `flave.yaml` (§5.3) |
| All-or-nothing merges | Plain text files merge line by line; `jj` keeps real conflicts as reviewable state instead of guessing (§8.4) |
| Shares raw files | Every deliverable is a view rendered from the files (§9.2, §11); a link serves the rendered view |

## The pieces

### 1 · Find every flave on the machine

- **The index is small.** Every flave has an `id`, a `title` and a `modified`
  date in `flave.yaml`. A library is a list of those plus where each one lives.
- **Full-text search is ripgrep over plain text.** A flave is Markdown, YAML,
  CSV, JSON and code, so searching every flave on a disk is what ripgrep
  already does well. The Tauri client can use the same Rust crates ripgrep is
  built on.
- **The operating system can help.** On macOS, registering `.flave` as a
  package type (§5.4.1) makes Finder show each one as a single document, and
  Spotlight can index it.

### 2 · Catch chat exports automatically

This is the step that joins the free kit to the paid product:

1. A chat export lands in `~/Downloads` as `Name.flave.zip`.
2. The client watches Downloads, unpacks each export, and reads its `id`.
3. It files the export into the library as **a new version of the document
   you already have**, not as a second folder.

Exporting from Claude becomes saving, with no manual filing. A collaborator
who exported from their own chat produces a version of the same document, too.

### 3 · Offload to save disk space

Two levels:

- **Simple, first:** "Move to cloud" uploads the flave and leaves a small stub
  locally: `flave.yaml` plus a preview image. Opening the stub downloads the
  rest. Large media and data are already stored as links rather than files in
  history (§8.5), which keeps both the stub and the repo small.
- **Seamless, later:** the operating-system feature iCloud, Dropbox and
  OneDrive use for files that show in Finder but download on open. On macOS
  that is Apple's File Provider framework; on Windows, the Cloud Files API.
  Linux has no standard equivalent. This is real engineering and belongs in a
  second phase.

### 4 · Sync, and pull a collaborator's changes

- Each flave is a git remote, with Cloudflare Artifacts first-class (§8.5).
- Pulling is a fetch plus a `jj` merge. Real conflicts are kept for review,
  never resolved by guessing.
- **Nobody sees git.** People see a sentence: *"Anna updated this 2 hours ago:
  3 sections changed, 1 new chart."* That is the legibility layer the Syncbox
  exploration called the only genuinely unbuilt part, and the
  structured change record corpora-builder already specifies is the shape it
  wants.

### 5 · Share

The sharing needs in §8.5 map onto Artifacts operations: a read token for a
reader, a read-only fork for a frozen snapshot, a fork per collaborator for
someone who works on it, and a push-triggered rebuild so a link serves the
rendered deliverable from `dist/`. Identity is didi.sh.

This also answers spec **D-31** (whose account holds a chat-exported repo):
**the person's own Flave Sync account.**

### 6 · Save from inside the chat

The MCP connector parked for the kit returns as a button inside the chat:
*"save to my flave library."* The chat commits straight to the person's repo,
and the Downloads step is skipped. `self-host-stack/hubs/event-hog-mcp` already
runs this pattern on Artifacts.

## A first version that doesn't become Dropbox

A menu-bar app (the Tauri build, repointed) that:

1. indexes and searches every flave on the machine;
2. picks up chat exports from Downloads and files them by `id`;
3. pushes and pulls to Artifacts, with the change sentence for each pull;
4. offloads with an explicit button and a local stub.

**After that:** File Provider / Cloud Files integration for seamless offload,
the in-chat connector, and rendered share links.

## How it fits with the instruction kit

| Layer | Price | What it is |
|---|---|---|
| **The format** | Free, open | The spec; a folder of plain files |
| **The instruction kit** | Free | `FLAVE.md`, a starter skeleton, `flave_check.py`, setup notes per chat product. Makes `.flave` files in any chat |
| **Flave Sync** | Paid | Find, file, offload, sync, share, pull. Keeps track of every `.flave` the kit produces |

The kit is distribution; sync is the business. The kit should work with no
account at all, so the format stays useful on its own, and sync earns its place
by doing what Dropbox and iCloud can't.

## Open questions

1. **Storage cost model.** Artifacts bills per operation and per GB-month.
   What's the free tier, and does offload (storage only, rare reads) price
   differently from active sync?
2. **Teams.** Is sharing per document, or does a team get a shared library
   with its own namespace? Namespaces carry jurisdiction permanently (§8.5).
3. **Does sync need `jj` on the user's machine?** The client could carry `jj`
   as a library, or merge with git alone and keep `jj` operator-side, as the
   "Not a Forge" stub suggested.
4. **Mobile.** Reading a flave on a phone is the rendered view. Editing on a
   phone would be a different product.
5. **What happens to an export whose `id` is new?** A new document in the
   library, but which folder? Probably a default inbox, sorted later.

## Related

- [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]: §5.3 (`id`),
  §5.4.1 (package type), §5.8 (secrets), §8.4, §8.5 (remotes), §10.2, §11
- [[A-Flave-Is-the-Zip-for-an-Agent-Session]]: what a flave carries
- [[The-Flave-Document-Service-Not-A-Forge]]: the round trip this completes
- [[A-Syncbox-For-Client-Document-Folders]]: transport, history, legibility

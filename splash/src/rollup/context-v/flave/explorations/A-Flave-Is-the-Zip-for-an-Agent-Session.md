---
title: "A Flave Is the Zip for an Agent Session"
lede: "The deliverable you see in a chat is a view. The work is in the sandbox behind it: installs, connector calls, scripts, queries, JSON. A .flave can carry all of it, secrets excepted, and it doesn't need Cloudflare Artifacts to exist. Artifacts is the best answer yet to the sharing half."
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
at_semantic_version: 0.0.2.0
status: Resolved-Into-Spec
publish: true
site_uuid: afafa693-da44-4eeb-8e25-15b647c0914a
hex_code: orycgx
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
categories: Exploration
spec_reference: "[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]"
continues:
  - "[[The-Flave-Document-Service-Not-A-Forge]]"
  - "[[A-Syncbox-For-Client-Document-Folders]]"
tags:
  - Exploration
  - Flave
  - Agent-Sandbox
  - Portability
  - Secrets
  - Cloudflare-Artifacts
  - Object-Storage
  - MCP
type: Explorations
from: "flave"
from_path: "context-v/explorations/A-Flave-Is-the-Zip-for-an-Agent-Session.md"
---
# A Flave Is the Zip for an Agent Session

> [!success] **Folded into the master spec 2026-11-19** as D-29 (§5.7, the
> sandbox directories), §5.8 (`config/`, `.env`, `.secrets`) and D-30 (§8.5,
> remotes). The owner chose to grow the flave spec rather than define a
> separate bundle format (open question 1), and asked for a `config` and a
> `.secrets` alongside `.env`. Where this document and the spec differ, **the
> spec wins**: `tools/` became `config/`, and `.flave/local/` became the
> root-level `.env` and `.secrets`.

## Why care?

A chat with Claude, ChatGPT or Perplexity is a sandbox. What the person sees at
the end is an artifact: a deck, a report, a chart, a page. What actually
happened is behind it. The agent installed packages, called connectors and
APIs, wrote scripts and SQL, fetched data, saved intermediate JSON, and threw
most of it away when the session ended.

The owner's framing (2026-11-19):

> I want an AI-native file type (which is actually a directory) that comes with
> conventions and docs that allows users to export all work from inside an
> agent chat, or download or save to remote server. Sharing and working on it
> should be included as functionality. MCP-style tool calls, API integrations,
> configs and secrets like that should be included (but not shared with
> others). Think Dropbox for the agentic era.
>
> In theory this is like a Zip for all of that. The "Artifacts" (what people
> see, what is exported, what can be clicked on) is just a UI or display file
> that is generated or connects with other files.

That is flave's thesis pointed one level lower. The master spec already says
the workings travel with the document and publishing flattens them (§4,
principle 4), and D-28 already says a flave is a folder of plain files that
agents write and every deliverable is a view of them. What the spec doesn't yet
hold is the **sandbox**: the environment, the tools, the code that ran, and the
secrets it ran with.

This exploration asks three things:

1. What would a `.flave` need to add to carry a whole agent session?
2. How do secrets travel with it without being shared?
3. Where does it live? Does it need Cloudflare Artifacts, object storage, or
   just a server's filesystem?

## 1 · What the sandbox holds, and where it lands in the bundle

Most of a sandbox already has a home in the spec. Five things don't.

| What happened in the sandbox | Where it goes in the bundle | In the spec today? |
|---|---|---|
| Prose, notes, the transcript | `content/`, `.flave/agent/` | **Yes** (§5.2, §9.4) |
| Data it fetched or produced | `data/` with a row in `_sources.yaml` | **Yes** (§5.2) |
| Images, screenshots, PDFs | `assets/` with `_manifest.yaml` | **Yes** |
| Charts and other displays | `viz/`, `figures/` | **Yes** |
| The deliverable people click on | `surfaces.json` + theme, exported to `dist/` | **Yes**, as views (§11, D-28) |
| **Scripts and queries it wrote** | `scripts/`, `queries/` | **No** (only `sql` fences, parked) |
| **What it installed** | `env/`: lockfiles and a recipe, never the binaries | **No** |
| **Connectors and API integrations** | `tools/`: MCP server config, API declarations | **No** |
| **What ran, in what order, on what** | `runs/`: one small record per run | **No** |
| **Keys, tokens, personal settings** | `.flave/local/`, never shared (§2) | **No** |

Sketch of the additions, next to what exists:

```
Q3-Update.flave/
├── flave.yaml
├── content/  data/  assets/  viz/  figures/  theme/   # as today
├── scripts/                 # code the agent wrote: .py, .ts, .sh
│   └── fetch_arr.py
├── queries/                 # .sql, one query per file, named
│   └── arr_by_segment.sql
├── env/                     # how to rebuild the sandbox, not the sandbox itself
│   ├── pyproject.toml + uv.lock
│   ├── package.json + pnpm-lock.yaml
│   └── environment.md       # anything a lockfile can't say ("needs duckdb CLI")
├── tools/
│   ├── mcp.json             # servers it used; secrets by name: ${secret:HUBSPOT_TOKEN}
│   └── apis/
│       └── hubspot.yaml     # base URL, auth scheme, secret name, scopes used
├── runs/
│   └── 2026-11-19T14-02_fetch_arr.yaml   # command, inputs (sha256), outputs (sha256), exit
├── dist/                    # exported views; derived and disposable
└── .flave/
    ├── agent/               # transcript, plan, scratch (§9.4)
    └── local/               # NEVER leaves this machine (§2)
        ├── secrets.env
        └── settings.yaml
```

Three design notes:

- **Recipes, not snapshots, for the environment.** A container image is
  hundreds of megabytes and goes stale. A lockfile is a few kilobytes, is
  readable by any agent, and rebuilds the same thing. flave-ai already does
  this for itself with `flake.nix`.
- **Outputs are kept, so re-running is optional.** A connector's data will have
  changed by next week, and the recipient may not have the key. The bundle
  keeps what came out (`data/`, with provenance) so it can be read and
  published without running anything. `runs/` records how it was made. That
  makes the bundle *legible* without promising it is *reproducible*.
- **`runs/` is the provenance §1 promised.** *"This number came from this query
  on this file, fetched from HubSpot on this date"* is three hashes and a
  command. That's the chain the positioning doc found no tool carries
  (Synthesis §9, "data provenance").

## 2 · Secrets: carried by name, never by value

The rule: **the bundle says which secrets it needs; the values live elsewhere.**

Three tiers:

| Tier | Example | Where it lives | Travels on share? |
|---|---|---|---|
| **Shared config** | which MCP servers, which API, which scopes, the secret's *name* | `tools/`, `env/` | **Yes** |
| **Personal settings** | my preferred model, my agent autonomy level | `.flave/local/settings.yaml` | **No** |
| **Secret values** | `HUBSPOT_TOKEN=pat-…` | OS keychain, or `.flave/local/secrets.env` | **Never** |

The recipient opens the bundle and is asked for their own HubSpot token, or
works without it from the saved data. The prior art agrees on this shape:

- **MCP Bundles (`.mcpb`)**, the format behind Claude Desktop's one-click
  extensions: `manifest.json` declares `user_config` fields, a field marked
  `"sensitive": true` is collected from the user and stored in the OS
  keychain, and the server config refers to it as `${user_config.api_key}`.
  This is the closest existing model; `tools/mcp.json` should borrow its
  placeholder syntax rather than invent one.
- **Letta's Agent File (`.af`)** exports an agent's memory, tools and prompts,
  and sets every secret to `null` on export.
- **Claude Code** splits `settings.json` (shared, committed) from
  `settings.local.json` (personal, ignored). `.flave/local/` is the same idea.

**The leak isn't the secrets file. It's the script.** An agent in a sandbox
pastes a key straight into `fetch_arr.py` or a curl line in the transcript far
more often than it reads one from an env file. So `.flave/local/` being
ignored isn't enough. Two guards:

- **The share path scans for secret-shaped strings** (`sk-`, `ghp_`, `pat-`,
  `art_v\d+_`, high-entropy tokens) across every file that will leave, and
  refuses to publish or push until each one is moved to a secret reference. This
  is the clearance scan (§11, M2) with one more pattern list, not a new system.
- **The skill tells agents never to inline a key** (§4 below), and the
  validator flags it on write.

Note that `.flave/local/` must be excluded from **history** too, not only from
export. `jj` snapshots the working copy automatically, so an unignored secrets
file is in the history the moment it's written. It belongs in the bundle's
ignore file from M0.

## 3 · Where it lives: it doesn't need Artifacts

**Yes, it can just be put on a server as part of the filesystem.** A flave is a
folder, and history inside it is `jj` over a git backend (§8.2). Anything that
can hold a folder, or be a git remote, can hold a flave. The format must not
depend on any one host.

Three hosts, one format:

| Host | What it is for a flave | Good at | Costs |
|---|---|---|---|
| **A server's filesystem** | The folder sits on disk; a bare git repo beside it is the remote | Simplest; works today; any tool reads it; serve `dist/` as a static site | You run the server, its auth, its backups |
| **Object storage (R2, S3)** | The folder mirrored under a prefix (`live/`), history as a separate store | Cheap, no server, already the corpora answer ([[A-Syncbox-For-Client-Document-Folders]]) | Not a filesystem: no atomic rename, no git; needs rclone or a history tool (Kopia) on top |
| **Cloudflare Artifacts** | A git remote per bundle | Sharing, built in (below); no server; agents can reach it from a chat | Git-shaped constraints; billed per operation; open beta |

### What Artifacts actually adds

Artifacts isn't a new kind of storage. It's **a git host that makes a repo
cheap enough to have one per document, per collaborator, or per chat**, with
access built in. Read against the "Not a Forge" stub, it fills the hole that
stub named, and it does so without being a forge:

| The stub's need | What Artifacts gives |
|---|---|
| *"The bucket is the transport"* | One repo per flave, at a URL. No host to run |
| *"The client sees a reader, not a repository"* | A push event can trigger a Worker that rebuilds `dist/` and serves it. The client gets a link, never the repo |
| *"An endpoint accepts a returned bundle"* | **Fork.** A collaborator gets their own fork with their own write token; their work comes back as a branch to merge with `jj` |
| Share read-only | A `read` token with a short TTL, or a read-only fork as a frozen snapshot |
| *"Auth is didi.sh"* | Still true: didi.sh decides who you are; it mints the Artifacts token for that repo |

The sharing half of the ask (*"sharing and working on it should be included as
functionality"*) maps almost one-to-one onto Artifacts' token-per-repo and
fork model. That's the strongest argument for it.

### And what it doesn't do

- **It doesn't carry `jj`'s operation log.** Only the git half of a colocated
  repo travels; change ids and undo history stay local (Syncbox finding 3).
  Fine: the op log is the author's undo, not the shared record.
- **1 GB per repo, and git history keeps every version forever.** Large data
  and media belong in R2, referenced from `assets/_manifest.yaml` and
  `data/_sources.yaml` by URL and sha256 (the git-annex pattern). This is the
  one place the format should bend: **big binaries are pointers, not files in
  history**, on any host.
- **It doesn't hold secrets.** A repo token grants the whole repo, so nothing
  personal can live in it. Same rule as §2: local only.
- **It's billed per operation** and in open beta. A flave that autosaves every
  keystroke and pushes each one would be a bill. Push on a gesture or a
  debounce of minutes, not on save.

**Recommendation:** define the remote as *"a git remote"*, and treat Artifacts
as the first-class implementation of it, not a dependency. A bare repo on a
server works the same way for anyone who wants to self-host. The format doesn't
change either way.

## 4 · Exporting from inside a chat

This is the hardest part, and it isn't storage. A chat's sandbox belongs to the
vendor, and none of them offers "export everything as a folder." Waiting for
them is not a plan. Three ways in, from cheapest:

1. **Download a zip.** The agent assembles the folder in its sandbox and
   offers it as a file. Works in any chat with code execution today, needs no
   integration, and only needs the agent to know the conventions.
2. **A skill that teaches the conventions.** An Agent Skill (`flave-bundle`)
   tells any agent where scripts, queries, runs and tool configs go, to keep
   keys out of files, and to write a `runs/` record per execution. The
   bundle's own `README.md` / `AGENTS.md` repeats the essentials, so an agent
   that opens a flave without the skill still knows the rules.
3. **A remote MCP connector that saves to a remote.** The chat agent calls
   `flave.save`, `flave.write_file`, `flave.share`; the connector commits to the
   flave's repo as the signed-in person. **This tree already has one working:**
   `self-host-stack/hubs/event-hog-mcp` is a remote MCP server over Cloudflare
   Artifacts, one repo per event, used from Claude chats, where *"every write
   is a git commit authored by the person who made it."* A flave connector is
   that pattern with a different directory layout.

So the product is three small things, not one big one: **the format spec, a
skill, and a connector.** The desktop editor is a fourth way to work on the
same folder, not a prerequisite for the other three.

## 5 · Prior art worth pinning

Nothing found does all of this, but several formats each do one part well.
Candidates for a study (`study-agent-workspace-bundles`), not yet pinned:

| Format | The part it does well |
|---|---|
| **RO-Crate** (research object crate) | The same shape from science: a folder, one metadata file at its root describing every file and where it came from, and an optional `ro-crate-preview.html` as the human view |
| **Frictionless Data Package** | Typed data files with schemas, in a folder with a `datapackage.json` |
| **MCP Bundles (`.mcpb`)** | Tool config with secrets declared as sensitive and kept in the keychain |
| **Letta Agent File (`.af`)** | An agent's memory, tools and prompts in one file; secrets nulled on export |
| **Dev Containers / Nix flakes** | Rebuilding an environment from a small recipe |
| **git-annex** | Big files as pointers in git, content elsewhere |

RO-Crate is the one to read first. It's a decade of thinking about "a folder
of work plus enough metadata to trust it" and it already separates the payload
from a generated human view.

## 6 · Rebuilding and running the sandbox

*Added 2026-11-19, from a follow-up discussion. The runtimes discussed here are
pinned in
[`study-agent-workspace-bundles`](https://github.com/lossless-group/study-agent-workspace-bundles).*

A flave's `env/` says what the work needs. Something still has to rebuild that
environment and run the scripts in it. That is two separate questions, and
most confusion here comes from treating them as one.

### Two questions, not one

| Question | What answers it | Example tools |
|---|---|---|
| **What is installed?** | A reproducible environment: exact versions of every tool and library, rebuilt the same way anywhere | Nix flakes, devenv, Flox, `uv` lockfiles, Dev Containers |
| **What can the running code reach?** | Isolation: a wall between the script and your files, keys, network and system | Containers, gVisor, microVMs, WebAssembly |

**Nix answers the first and not the second.** A flake pins every package, and
`nix develop` gives you that exact toolchain in a shell. It's *ephemeral* in
the sense that the packages exist only in that shell. But a script run there
runs **as you**: it can read your home folder, your SSH keys and a flave's
`.secrets`, reach the network, and delete files. (Nix sandboxes its *build*
step on Linux; running the result is not sandboxed.)

**Isolation tools answer the second and not the first.** A container, gVisor or
a microVM decides what the code can touch, but says nothing about which Python
or which DuckDB is inside.

The analogy: Nix is the recipe and a perfectly stocked pantry. The sandbox is
a kitchen with locked doors. A great recipe doesn't stop a cook you've never
met from walking into your bedroom.

**They compose.** Nix can build container images directly (`dockerTools`,
`nix2container`), so a common pattern is Nix for the exact environment and a
container or microVM to run it in.

**Platforms.** Nix runs natively on Linux and macOS; on Windows only inside
WSL2 (Linux in a VM). macOS builds reproduce less exactly than Linux ones,
because some packages differ by platform.

### Beyond Docker: the isolation layers

Docker is one assembly of parts that now exist separately, plus stronger walls
it never had. From least to most isolation:

| Layer | Examples | What it is |
|---|---|---|
| **Low-level OCI runtimes** | `runc` (Docker's default), `crun` (C; faster start, less memory), `youki` (Rust) | The piece that actually starts a container: gives a process its own view of files, network and processes. A component under an engine, not a choice you'd make instead of Nix |
| **Container engines** | containerd + `nerdctl`, Podman, Docker | Run OCI images. containerd is what runs under both Docker and Kubernetes. Podman needs no daemon and runs without root |
| **Container VMs on a desktop** | Apple `container`, Colima (open source), OrbStack (closed source), Docker Desktop | On a Mac, containers always run inside a Linux VM; these make it fast. Apple's gives each container its own lightweight VM |
| **Sandboxed kernel** | gVisor | A user-space kernel between the container and the real one, so an escape lands in gVisor. Stronger than a container, lighter than a VM |
| **MicroVMs** | Firecracker, Cloud Hypervisor, Kata Containers | A real VM boundary that boots in a fraction of a second. The standard for running code nobody reviewed |
| **Hosted agent sandboxes** | E2B, Cloudflare Sandbox, Daytona, Modal, Vercel Sandbox | What chat products and agent frameworks call to run code. Mostly Firecracker or gVisor underneath |
| **WebAssembly** | Pyodide, Wasmtime, WasmEdge, StackBlitz WebContainers | Code runs in a browser or a tiny runtime with nothing installed. A reader could re-run a flave's Python script from a web page |

### Firecracker is not tied to Amazon

Firecracker is open source (Apache-2.0). AWS wrote it and runs Lambda on it,
but it depends only on Linux's built-in virtualization. From its
`docs/getting-started.md`:

- **Needs:** Linux on x86_64 or ARM64, and read/write access to `/dev/kvm`.
  `tools/devtool checkenv` in its repo checks a machine.
- **Runs on:** your own Linux hardware with virtualization enabled (the owner's
  NixOS machine likely qualifies; `lsmod | grep kvm` to check); rented bare
  metal (Hetzner, OVH, Equinix Metal); cloud VMs only where the provider
  exposes KVM inside the VM (nested virtualization).
- **AWS is the restrictive one:** the doc says EC2 supports KVM only on `.metal`
  instance types, so an ordinary EC2 VM can't run it. Google Cloud and Azure
  offer nested virtualization on some machine types.
- **Hosted:** E2B (open source and self-hostable), Fly.io and Vercel Sandbox run
  Firecracker on their own machines.
- **Doesn't run on** macOS (no KVM; Apple's answer is `container`), Windows
  outside a Linux VM, or a Linux VM without nested virtualization.

### What this means for a flave

- **`env/` is the recipe.** Lockfiles always; a Nix flake or a
  `devcontainer.json` when the environment needs more than a language's
  package manager. The host chooses how to rebuild it.
- **Your own bundle, your own scripts:** Nix (or `uv`) alone is enough. You
  trust the code; you want it to rebuild identically.
- **A bundle someone sent you:** both. The recipe recreates their environment,
  and isolation stops their scripts from reading your `.secrets` or your home
  folder. That's M6 (*"I open a stranger's `.flave` and nothing can hurt me"*).
- **Which wall, by where the reader is:** a Mac gets Apple `container` or a
  Linux VM; a Linux server gets Firecracker or gVisor; a browser gets
  Pyodide; a chat gets whatever sandbox its vendor runs. The format names none
  of them.

## Open questions

1. **Is this still flave, or a layer under it?** Flave as specced is a
   document format whose center is publishing to audiences. A whole agent
   session is broader. Two options: grow the flave spec with `scripts/`,
   `queries/`, `env/`, `tools/`, `runs/`, or define a plain "agent bundle"
   format and make flave a bundle with a document in it. The first is simpler;
   the second lets a bundle exist with no deliverable at all.
2. **Who owns the remote for a chat export?** If a person exports from
   claude.ai through the connector, whose Artifacts account holds the repo:
   Lossless's, the person's, or their company's? This decides billing,
   jurisdiction, and what "delete my data" means.
3. **What does a recipient do with `runs/`?** Read it as provenance only, or
   offer "re-run this" when they have the keys? Re-running needs the sandbox
   rebuilt from `env/`, which drags in M6's trust model.
4. **How much of the transcript travels?** `.flave/agent/` holds thinking the
   author never meant to ship (§9.4 already excludes it from publish). Sharing
   a working copy is different from publishing. Does a collaborator get it?
5. **Does a fork come back by merge or by proposal?** The stub left this open;
   Artifacts makes the fork cheap but doesn't answer it.

## Suggested next steps

1. Owner's call on open question 1, since it decides where the additions are
   written.
2. Pin the study in §5 and read RO-Crate and `.mcpb` before specifying
   `tools/` and the bundle metadata.
3. Write the `flave-bundle` skill first. It's the cheapest of the three pieces,
   works in every chat today via download, and forces the conventions to be
   written down.
4. Prototype the connector by copying `event-hog-mcp`'s Artifacts plumbing
   (knots-style, copied not shared), with the secret scan on its push path.

## Related

- [[Flave-Sync-The-Product-Is-in-the-Sync-Layer]]: the follow-up. With the instruction kit as the primary use case, sync is where the product is, and why Dropbox and iCloud can't do it

- [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]: §4, §5.2,
  §8.2, §9.2 (D-28), §9.4, §11
- [[The-Flave-Document-Service-Not-A-Forge]]: the stub this partly answers
- [[A-Syncbox-For-Client-Document-Folders]]: transport, history, legibility;
  why `jj`'s op log doesn't travel
- [[Positioning-Flave-Against-the-Content-Authoring-Tools-Study]]: the
  provenance gap
- `context-v/agent-skills/cloudflare-artifacts-interface/SKILL.md`: tokens,
  forks, limits and cost, tested live
- `self-host-stack/hubs/event-hog-mcp/src/index.ts`: a remote MCP server over
  Artifacts, one commit per write

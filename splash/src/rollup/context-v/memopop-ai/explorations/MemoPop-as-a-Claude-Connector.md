---
title: "MemoPop as a Claude Connector"
lede: "Clients won't open our app. They'll ask Claude, and Claude will reach their deals, sources, and memo history through a connector."
date_created: 2026-10-10
date_modified: 2026-10-10
date_authored_initial_draft: 2026-10-10
date_authored_current_draft: 2026-10-10
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5 (1M context)
at_semantic_version: 0.0.0.12
status: Open
category: Exploration
site_uuid: cd25a70b-8760-4014-a380-f9023bfc27f5
hex_code: bo4fvf
summary: >-
  Exploration of hosting memopop-orchestrator as a per-client workspace that
  clients reach through a Claude connector (remote MCP) authenticated by
  didi.sh, instead of the local Tauri sidecar the 2026-04-30 exploration chose.
  Covers who does the LLM work (the client's Claude vs. our pipeline), the
  requirement that every CLI command and agent gets an endpoint with
  agent-facing docs and health tests, and the storage question: server disk
  canonical, a private bucket per client, and whether jj and BTRFS are the
  right history and backup layers. Grounded in a 2026-10-10 audit of the
  orchestrator's filesystem I/O. Ends in open questions, not a plan.
tags:
  - MemoPop
  - Claude-Connector
  - Model-Context-Protocol
  - Hosted-API
  - Didi-Sh
  - Version-Control
  - Jujutsu
  - BTRFS
  - Cloudflare-R2
  - API-Docs-For-Agents
publish: true
type: Explorations
from: "memopop-ai"
from_path: "context-v/explorations/MemoPop-as-a-Claude-Connector.md"
---
# MemoPop as a Claude Connector

## Why Care?

An investment memo is a month of analyst work compressed into a document a
partner reads in ten minutes. MemoPop already produces one: about thirty agents,
a deck and dataroom in, a sourced and scored memo out. But today it only runs
on the operator's laptop, behind a desktop app a client will never install.

Clients already have an assistant open all day: Claude, on desktop and phone.
If MemoPop is a **connector** in that assistant, a partner can say *"pull up the
Acme deal, what changed since the last version, and tighten the competition
section"* and Claude does it against their own workspace. No new app, no
onboarding beyond one sign-in.

That shift changes three things at once: where the work runs, who pays for the
model calls, and how a client's drafts are kept safe and versioned. This doc
works through all three before anything gets built.

## Decided (2026-10-10)

Each decision below also has its own record in `context-v/decisions/`:
[[The-Clients-Claude-Does-the-Work]],
[[The-Server-Hands-Claude-the-Method-One-Step-at-a-Time]],
[[One-Workspace-Per-Firm-With-a-Private-Bucket]],
[[jj-Versions-Text-and-Saves-Snapshot-to-the-Bucket]],
[[Host-the-Connector-on-Railway-at-memopop-didi-sh]],
[[Sign-In-Through-didi-sh-OAuth]],
[[No-Tool-Ships-Without-Its-Docs-and-Tests]], and
[[Three-Kinds-of-Error-and-Optional-Steps-Never-Block]].

- **The client's Claude does the work by default.** Claude Desktop and mobile
  run the memo method; the connector supplies the workspace, versions, and
  backups. The server-side pipeline with our own API keys and research APIs
  (Perplexity, Tavily, and the rest) is **v2**.
- **The product is a staged instruction set.** Months of iteration produced a
  method that writes better memos than any the operator has seen, and better
  than anyone they've sent them to has seen. Packaging that method so a
  client's Claude follows it, stage by stage, is the core of v1.
- **jj versions text only.** Section drafts, research notes, sources,
  scorecards, configs, and other text outputs and artifacts. Decks, datarooms,
  PDFs, and images are not versioned by jj; they live in the client's bucket.
- **No BTRFS.** Backup is a client-initiated **save**: one command that takes a
  snapshot of the workspace and writes it to the client's private bucket.
- **The server hands Claude the method one step at a time.** The plugin's
  skill stays thin: it tells Claude this is a multi-step pipeline with an
  artifact and audit trail, and to ask the server for each step. Claude calls
  `next_step` and gets that stage's instruction (today's agent prompt) plus the
  artifacts it needs, does the work, and calls `submit_artifact`. The server
  saves and checks the artifact, logs it, and advances. The method stays on the
  server, improves without anyone reinstalling, and its order and gates are
  enforced rather than requested. The LangGraph workflow's 35 nodes and the 42
  agents' prompts become the step definitions.
- **The server disk is canonical, and each client gets a private bucket**
  (provisioned by hand at first, automatically later).
- **Host: Railway.**
- **One workspace per client firm**, holding all of that firm's deals, the
  shape `io/<firm>/deals/<deal>/` already has. Everyone the firm brings in sees
  all of its deals; per-deal access can be added inside a workspace later.
- **No UI to log into at first.** Claude is the only interface.
- **Sign-in goes through didi.sh OAuth.** Claude is the OAuth client and
  didi.sh the server; its sign-in page is the only screen a client sees. As of
  2026-10-10 id.didi.sh has none of the OAuth server endpoints on any branch;
  what it needs is tracked in id-didi-sh's
  [[Claude-Connectors-Need-didi-sh-to-Be-an-OAuth-Server]].
- **The connector lives at `memopop.didi.sh`**, pointed straight at Railway,
  not at a path on the Vercel-served `didi.sh`. No new domain to buy, no proxy
  hop in front of streamed responses.

## The memo flow, step by step

One conversation per memo by default. The server holds every artifact, so the
conversation carries instructions and the one artifact a step needs, never the
whole memo. A "start a new chat and say *continue the Acme memo*" handoff is
the safety valve if a long run fills the conversation.

0. **Start the deal and bring the materials.** A partner says *start a memo on
   Acme*. If no deal exists, Claude creates one (company name, URL, stage,
   which memo template) and the server sets up its folder. The partner then
   adds what they have: the deck, the dataroom, financials, call notes, links.
   The server keeps the originals in the client bucket and turns each into
   text the later steps can read, which is the job today's deck and dataroom
   agents already do. Materials can keep arriving at any point in the run.
1. **Research, one section at a time.** Claude builds a research file for each
   outline section, shows it to the partner, and waits. The partner comments and
   adds their own research before the next section. This is the per-section
   human moment [[Grill-Me-Per-Section-User-Input-Moment]] explored. In v1,
   research is Claude's own web search plus what the partner adds; our research
   APIs arrive in v2.
2. **Drafting, one section at a time.** For each section Claude receives only
   that section's approved research file and the drafting and formatting
   instructions. The finished section goes back to the server as the artifact.
3. **Enhancements, one at a time.** Citations, tables, diagrams, the one-pager,
   scoring: today's enhancement agents, each a separate step over the saved
   sections.
4. **Compile.** Claude asks for the HTML and PDF. The server assembles the
   memo with the export tooling it already has (pandoc, WeasyPrint) and returns
   links. Nothing at the end is confusing for Claude; it is a request, not a
   task.

Every step is short, every artifact is saved and versioned as it lands, and
the partner sees and shapes the research before any prose is written.

### The connector's tools

The step-by-step design keeps the connector small. The method lives on the
server as steps, so Claude needs only these tools:

| Tool | What it does |
|---|---|
| `list_deals` | The firm's deals and where each one stands |
| `create_new_deal` | Starts a deal that has no record yet: company, URL, stage, memo template |
| `add_materials` | Attaches a deck, dataroom, financials, notes, or links to a deal; the server keeps the original and extracts text |
| `next_step` | Hands Claude the next instruction and the artifacts that step needs |
| `submit_artifact` | Saves a finished research file, section draft, or enhancement |
| `get_artifact` | Reads back any saved artifact or extracted material |
| `save_snapshot` | The partner's "save": a backup snapshot to the client bucket |
| `compile` | Assembles the memo and returns HTML and PDF links |

**Open on `add_materials`: how the file bytes reach the server.** A file the
partner drops into Claude lands in Claude's sandbox, not on our server, and a
200 MB dataroom won't fit through a tool call. Three candidates, probably all
three in the end:

- **Links.** The partner pastes a DocSend, Google Drive, or Dropbox link and
  the server fetches it. Simplest, and how a lot of deal material already moves.
- **An upload link.** `add_materials` returns a one-time upload page under
  `memopop.didi.sh`; the partner drops the files there in a browser. Works on
  every Claude surface.
- **Small files inline.** A short memo or a one-page financial summary can go
  through the tool call as text.

Extraction can run longer than Claude's 240-second tool limit, so
`add_materials` returns at once and `list_deals` reports when the materials
are ready.

### No tool ships without its docs and tests

This is our first API, so the habits it sets are the ones every later API
inherits. A tool counts as done only when all three of these exist:

1. **Agent-facing docs.** Written for Claude first, because the description
   *is* what Claude reads when deciding what to call. Every tool's entry says:
   when to call it and when not to; each input, with an example; what it
   returns; what it changes on the server; how long it takes; every error it
   can return and what to do about each; and what to call next. One source
   feeds the MCP tool description, the OpenAPI spec, an `llms.txt` at
   `memopop.didi.sh/llms.txt`, and a readable page at `memopop.didi.sh/docs`.
2. **Contract tests in CI.** Each tool is called against a fixture firm and a
   fixture deal: the normal case, bad input, a missing deal, and a request
   from the wrong firm (which must fail). A test also checks that every tool
   has a complete docs entry, so an undocumented tool fails the build.
3. **A health check on the live server.** A scheduled run walks a test deal
   through the whole flow (create, add a small deck, one research step, one
   draft, compile) against `memopop.didi.sh`, signed in as a test firm, and
   alerts when a step fails or slows down.

Conventions to settle once, here, before the first tool:

- **One error shape** for every tool: a code, a plain-language message, and
  what the caller should do next. The code always belongs to one of the three
  kinds below.
- **Repeat-safe creates.** Calling `create_new_deal` twice for the same company
  returns the existing deal rather than making a second one.
- **Paging** on anything that lists, starting with `list_deals`.
- **Versioning.** The API carries a version from day one, so a change to a
  tool's inputs can't silently break a client's Claude mid-memo.
- **A test firm** that lives in production but holds no client data, for the
  health check to sign in as.

### Three kinds of error, and almost none of them block

A blocked memo is the worst outcome: the partner is mid-run, and Claude stops
with nothing useful to say. So every error tells Claude which of three kinds it
is, and each kind has one clear response:

| Kind | Means | Claude should |
|---|---|---|
| **Down** | The API is unreachable, timed out, or failed on our side. Nothing was saved | Tell the partner MemoPop is unavailable, and try again later. Never retry in a tight loop |
| **Invalid** | The request is wrong: bad input, unknown deal, wrong firm, a step submitted out of order | Fix the request using the message, or ask the partner for what is missing. Never resend it unchanged |
| **Skipped** | One step's agent is out of service, but the memo can go on without it | Tell the partner in one line, and call `next_step`. The run continues |

**Skipped is the default for anything optional.** Every enhancement
(citations, tables, diagrams, the one-pager, scoring) is optional by
definition, so one broken enhancement never stops a memo. The server records
each skip on the deal; `list_deals` shows it, `compile` lists what was skipped
in the run report, and the step can be re-run once the agent is back.

**Only required steps may block**, and the list should stay short: creating
the deal, submitting a section's research or draft, and compiling. Even then,
a "down" error on a required step costs nothing, because nothing was saved and
the partner can pick up where they left off.

The tests cover each kind: CI checks that every tool returns the right kind for
each failure, and that switching off any optional agent produces a skip rather
than a block.

## What Claude can do with it (checked 2026-10-10)

From Claude's connector and plugin documentation:

- **A plugin bundles skills and a connector, installed together once.**
  "You build a plugin: a package people add once and then use on claude.ai,
  in the desktop and mobile apps, in Cowork, and in Claude Code." The skills
  "teach Claude your workflows, such as the sequence of steps, the defaults,
  and what good output looks like"; the connector reaches the product. That is
  the staged instruction set and the workspace in one install. Chat, Cowork,
  and Claude Code load different parts of a plugin, so the platform-support
  table needs checking before design.
- **Claude reaches the server from Anthropic's cloud, not the user's device**,
  on every surface. The server must be publicly reachable; Railway is.
- **OAuth per user**, with Dynamic Client Registration or a registered client,
  callback `https://claude.ai/api/mcp/auth_callback`, and token refresh. This
  is the front door didi.sh still lacks.
- **Supported:** tools, prompts, resources (text and binary), image results,
  MCP Apps (interactive UI in the conversation). **Not supported:** sampling,
  resource subscriptions. Every tool must declare `readOnlyHint` and
  `destructiveHint`.
- **Limits on claude.ai and Desktop:** about 150,000 characters per tool result
  and **240 seconds per tool call**. Anything longer, such as v2's full pipeline
  run, has to be a start-then-poll pair of tools.
- **Distribution:** as a custom connector by URL (no review), as a plugin, or
  listed in the directory after review (any paid plan can submit).
- **Mobile:** connectors work on mobile; installing one there is in beta, so
  setup happens on desktop or web.

Sources: [Build an MCP server for Claude](https://claude.com/docs/connectors/building),
[Build for Claude](https://claude.com/docs/build/overview),
[Custom connectors using remote MCP](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp),
[Use skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude).

## What changed since April

[[Moving-an-Agent-Orchestrator-to-an-API]] (2026-04-30) weighed three shapes
and chose a **local FastAPI sidecar** spawned by the Tauri app. It said a
hosted server could come later, "when you actually need it (sharing memos
publicly, demo URLs, multi-user)", and listed what hosting would cost: auth,
multi-tenant isolation, BYO keys, persistent storage, file serving, a queue.

That sidecar shipped (`src/server/`, 22 routes). Two of the hosting costs have
since been paid elsewhere in the tree:

- **Auth.** didi.sh is the shared identity service across memos, decks, and
  augment-it ([[Didi-sh-One-Login-One-Agent-Three-Services]]). What it still
  lacks is the standard OAuth front door that off-the-shelf clients, Claude
  among them, know how to use ([[What-OAuth-and-OIDC-Actually-Are-and-What-didi-sh-Still-Needs]]).
- **Serving capabilities, not secrets.** [[Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal]]
  and [[Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane]] already argue
  for a remote MCP endpoint that holds credentials server-side and hands people
  capabilities. A MemoPop connector is that idea with a product attached.

What's new is the **primary surface**: not the Tauri app, not a web app, but
Claude itself.

## The shape: three layers

| Layer | What it is | Who runs it |
|---|---|---|
| **Instruction sets** | Skills that teach Claude the memo method: how to read a deck, curate sources, write and score a section, revise against feedback | Client's Claude, from a skill we publish (the `hope-ai` pattern) |
| **Connector** | A remote MCP server: tools over the client's workspace, authenticated by didi.sh OAuth | Us, hosted |
| **Workspace server** | The orchestrator, its per-client disk, versions, backups, and the tools Claude's sandbox can't run | Us, hosted |

### Who does the LLM work?

This is the question that decides cost and architecture, and it has two
answers that can coexist:

1. **Claude does the thinking; the connector does the doing.** The client's own
   Claude subscription reads, reasons, and writes. Connector tools supply what
   it can't do alone: the client's files and history, deck and dataroom
   processing, paid research APIs, branded PDF and DOCX export (pandoc,
   WeasyPrint), and saving a version. **We pay for almost no model calls.**
2. **The pipeline runs as a job.** "Generate a full memo" stays a 15–45 minute,
   thirty-agent LangGraph run on our server, started by a tool and watched by
   polling. The model calls are ours (or the client's provisioned tokens), and
   the output is more consistent than freehand.

Mode 1 is the cheap, conversational one and suits revision work. Mode 2 is the
heavy, reproducible one and suits the first draft. A plausible product is
**mode 2 for the first draft, mode 1 for everything after**. That needs testing,
not assuming. Whether Claude's code sandbox can do meaningful work here, and
what network access it has, still needs checking against current Claude
documentation.

### Billing, later

The intended end state: didi.sh takes payment, and payment provisions a token
budget, through trustedrouter.com or by the client supplying their own
Claude, Perplexity, and OpenAI keys. At first the operator provisions each
client by hand. Mode 1 matters here too: the more work the client's own Claude
does, the less there is to meter.

## Every command and every agent gets an endpoint

The connector is only as good as what it can reach. Today it can reach very
little of the orchestrator:

| Surface | Count | Reachable over HTTP today |
|---|---|---|
| CLI commands (`cli/*.py`) | 31 | 1 (`export_branded`, shelled out from `/actions/export-memo`) |
| Agents (`src/agents/*.py`) | 42 | Only as part of a full run |
| Workflow graph nodes (`workflow.py`) | 35 | Only as part of a full run |
| Server routes | 22 | — |
| Test files touching the server | 3 of 25 | — |

Commands like `improve_section`, `revise_section`, `refocus_section`,
`score_memo`, `generate_one_pager`, `enrich_citations`, and
`resume_from_interruption` are exactly the verbs a partner will ask Claude for.
Each needs to be callable on its own.

Three requirements, from the operator:

1. **Every command and every agent has an API endpoint.** The cleanest way to
   keep that true is **one operation registry with several callers**: each
   operation is declared once (name, input schema, output schema, long-running
   or not), and both the REST routes and the MCP tools are generated from it.
   An operation that exists in one surface and not the other is then a build
   failure, not a drift someone notices months later. flave is converging on
   the same seam from the editor side ([[Phase-1-One-Operation-Set-Four-Callers]]),
   which is worth reading before designing this one.
2. **API docs written primarily for agents.** FastAPI already emits OpenAPI.
   On top of that, every operation needs a description an agent can act on:
   when to call it, what it costs in time and money, what it changes on disk,
   what to call next. Those descriptions are what Claude sees as tool
   descriptions, so they *are* the product's UX. An `llms.txt` at the API root
   ties them together.
3. **Tests that monitor the health of the API.** Two tiers: contract tests in
   CI that call every operation against a small fixture deal (cheap model,
   mocked research APIs), and a scheduled synthetic check against the deployed
   server that exercises the connector end to end. A registry makes the first
   tier mechanical: one generated test per operation.

## Storage and versioning

### What the code does today

From the 2026-10-10 audit of the orchestrator:

- **Everything is plain files under the working directory.** `io/<firm>/` is
  about 3.4 GB across eleven firms (one firm is 2.3 GB). There is no database.
  At least twelve modules hardcode `Path("io")` and ignore `MEMO_IO_ROOT`.
- **Runs are already immutable.** Each run writes a new
  `outputs/<Deal>-vX.Y.Z/` folder and never touches an old one. The few files
  that change in place are `deal.json`, `Sources.md` (with `.bak` copies),
  the firm's brand config, and `versions.json`, which every deal of a firm
  shares with no locking.
- **Each `io/<firm>` is a private git submodule today.** The code never commits;
  git history exists only because the operator commits by hand.

So a large part of the history problem is already solved by the run layout.
What needs versioning is the drafting *between* runs (sections Claude revises
in mode 1) and the handful of mutable inputs.

### Decided

- **The server disk is canonical.** It holds the workspace exactly as the code
  expects it, so nothing has to be rewritten to run hosted.
- **Each client gets their own private bucket.** Provisioned per client,
  ideally automatically, by hand at first.

### jj for draft history: a good fit, with one hard constraint

jj suits this work better than git for the same reasons
[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] §8.2 chose it: no
staging area, every edit is already a change, and the operation log makes any
action undoable. The client never sees it; the server runs it after each
operation, the way flave's agent runs it under the hood.

The constraint: **jj does not run Git LFS filters**
([[Never-Run-JJ-In-A-Git-LFS-Repo]]). In an LFS repo it commits the real bytes
over the pointers. Three of the current firm repos use LFS (`humain`,
`alpha-jwc`, `lossless`). So jj can't be dropped into today's firm repos as-is.
On the server it would need fresh jj repos per client workspace, with large
binaries (decks, datarooms, PDFs) kept outside the jj working copy and stored
content-addressed in the bucket instead.

The [[A-Syncbox-For-Client-Document-Folders]] study also found that jj's change
IDs and operation log live in `.jj/`, which git-only tools can't read, so jj's
interchange story is git's, not its own. That's fine when the server is the
only writer.

### BTRFS for snapshots: right idea, wrong host

BTRFS gives instant, cheap snapshots of the whole workspace that are browsable
as directories, which is a strong backup primitive. corpora-builder considered
it and parked it behind a trigger
([[Corpora-Builder-MVP-R2-Native-With-Checkpoint-History]]).

**Railway, the chosen host, doesn't let you choose a volume's filesystem.**
Its volumes are managed for you and come with scheduled volume backups instead.
BTRFS would mean a host where we control the disk: a VPS from
`self-host-stack/`, or a Fly machine with its own formatting step.

Three ways to get the same outcome:

| Option | Snapshots | Backup to client bucket | Host |
|---|---|---|---|
| **BTRFS + send/receive** | Instant, whole-volume | Snapshot streamed to the bucket | VPS |
| **Kopia per client** | Per-directory, labelled, retention and pins | Native S3/R2 repository | Any, including Railway |
| **Railway volume backups + rclone** | Railway's schedule | rclone mirror per client | Railway |

Kopia was the [[A-Syncbox-For-Client-Document-Folders]] study's pick for the
history layer: its snapshots carry a free-text description, tags, pins, and
per-directory policies, and it needs no filesystem support. **jj for drafting
history plus Kopia for backup to the client's bucket** gets most of what BTRFS
offers without leaving Railway.

### The backup report

"Run a backup, save, and report to the backup bucket" maps onto the
legibility layer the corpora work already built: a structured change record
(`{when, who, sentence, files_added, files_changed, files_removed, bytes}`)
rendered as a feed a client can read without reading a diff
([[Corpus-Change-Feed]]). The same record shape should work here, emitted after
each saved version and each backup.

## What has to change in the code

From the same audit, before the orchestrator can be hosted:

1. **No auth anywhere.** It binds to `127.0.0.1:8765`, and CORS allows only
   localhost and Tauri.
2. **The API passes local file paths.** `deck_path` and `dataroom_path` come in
   as paths on the caller's disk, and responses return local paths for "Reveal
   in Finder". Hosted, these become uploads and downloads.
3. **Job state is in memory, one job at a time.** A restart forgets the job
   list (finished runs on disk still appear). stdout is redirected
   process-wide, so jobs can't run in parallel without moving to separate
   processes.
4. **Twelve modules ignore `MEMO_IO_ROOT`** and need to honour it, so a
   workspace can live anywhere on the volume.
5. **Laptop-only paths.** `slides/slide_cdn.py` hardcodes `/Users/mpstaton/...`
   and reads `~/.secrets`.
6. **System tools in the image.** pandoc, WeasyPrint's libraries, poppler,
   tesseract, Ghostscript, ffmpeg, ImageMagick (in place of macOS `sips`), and
   node.
7. **Unlocked shared files.** `versions.json` and `Sources.md` are
   read-modify-write with no locking: fine for one user, a race for several.

## Open questions

1. ~~Mode 1, mode 2, or both?~~ Decided: the client's Claude does the work
   (mode 1); API keys and research APIs are v2.
2. ~~What can Claude's sandbox do?~~ Answered in *What Claude can do with it*.
3. ~~Tenancy boundary.~~ Decided: one workspace per firm.
4. ~~Where do large binaries live?~~ Decided: in the client bucket, outside jj.
5. **Migrating the eleven existing firms.** Their git history, and the three
   LFS repos, need a one-time import path into whatever replaces them.
6. **Registry first, or connector first?** Generating REST and MCP from one
   registry is the clean end state; a small hand-written connector over the
   existing 22 routes is the fast demo.

## Related

- [[Moving-an-Agent-Orchestrator-to-an-API]] — the April exploration this one
  supersedes on the "hosted comes later" point
- [[A-Syncbox-For-Client-Document-Folders]] and
  [[Sync-Corpora-to-R2-and-Show-Clients-What-Changed]] — the storage reasoning
  this reuses: server disk canonical, adopt history tools rather than write them
- [[Never-Run-JJ-In-A-Git-LFS-Repo]] — the hard constraint on jj
- [[Didi-sh-One-Login-One-Agent-Three-Services]],
  [[What-OAuth-and-OIDC-Actually-Are-and-What-didi-sh-Still-Needs]] — auth
- [[Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal]],
  [[Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane]] — the remote MCP
  capability plane
- [[Phase-1-One-Operation-Set-Four-Callers]] — flave's version of the one
  operation registry
- `ai-labs/studies/sync-and-content-version-control` — Kopia, restic, jj, and
  Syncthing, pinned and profiled

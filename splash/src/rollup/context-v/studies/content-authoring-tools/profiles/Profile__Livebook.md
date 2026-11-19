---
name: Livebook Profile
title: Livebook — Profile
slug: livebook
upstream: https://github.com/livebook-dev/livebook
pinned_sha: 427774a1
pinned_date: 2026-11-17
version_at_pin: "nightly (rolling tag); mix.exs @version 0.20.0-dev"
license: Apache-2.0
maintainer: livebook-dev org — most active recent committers Jonatan Kłosko, Alexandre de Souza, Wojtek Mach
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/livebook
profile_kind: Interactive notebook (Elixir/Phoenix LiveView web app) whose file is a Markdown subset
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Reference
site_uuid: e1d0f27e-f2c5-45d5-9bf5-090add7809f5
hex_code: c75xwz
lede: >-
  The notebook whose file is just Markdown with HTML comments for the leftovers,
  and the only entry that documents a Claude Code hook for pushing an agent's
  file edit into the live session.
summary: >-
  Profile of Livebook as pinned in the content-authoring-tools study. Covers the
  `.livemd` format (H1 = notebook, H2 = section, elixir fences = code cells,
  `<!-- livebook:{json} -->` comments for everything Markdown cannot say),
  outputs-off-by-default, Smart cells as generated code plus base64 attrs,
  branching sections, notebook stamping, deployment as apps, and the `/dev/sync`
  endpoint that diffs an externally edited file into a running session. Read
  against Jupyter's `.ipynb` and the sibling notebook entries.
tags:
  - Profile
  - Livebook
  - Notebooks
  - Elixir
  - Markdown
  - Agent-Editable
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Livebook.md"
---
# Livebook — Profile

A profile of Livebook as it lives in this study (`studies/content-authoring-tools/livebook`, pinned at `427774a1`, 2026-11-17; the only tag reachable is the rolling `nightly`, and `mix.exs:9` says `0.20.0-dev`). Apache-2.0. An Elixir / Phoenix LiveView web app, also shipped as a desktop app and a Docker image.

## TL;DR

`.livemd` is "a subset of Markdown, which means that every Live Markdown is valid Markdown" (`lib/livebook/live_markdown.ex:4-5`). An H1 is the notebook, every H2 starts a section, every `elixir`/`erlang` fence is a code cell, adjacent prose is a Markdown cell, and anything Markdown cannot express rides in `<!-- livebook:{...} -->` JSON comments (`live_markdown.ex:11-52`). Outputs are off by default.

**One sentence:** *Livebook is the cleanest "the notebook is a Markdown document" answer in the study, and it has already shipped the agent loop: edit the file with any tool, then POST `/dev/sync` and the running session diffs itself to match.*

## How it works

- **Stack.** Elixir, Phoenix LiveView, CodeMirror in the browser (`README.md:9`). Code runs in a separate runtime: a fresh Elixir node, an attached node, or inside an existing Mix project (`README.md:23`).
- **Serializer.** `Livebook.LiveMarkdown.Export` (457 lines) and `.Import` (747 lines) under `lib/livebook/live_markdown/`. Import returns the notebook plus a list of warnings, so loose Markdown is coerced rather than rejected (`live_markdown.ex:101-109`).
- **Execution model.** Not reactive by default. Sections run top to bottom; each cell carries a validity of `:fresh | :evaluated | :stale | :aborted` (`lib/livebook/session/data.ex:146`), and a cell goes stale when its "snapshot" of parent cells and inputs changes (`data.ex:160-165`). A per-cell `reevaluate_automatically` flag opts into re-running (`export.ex:233`).
- **Branching sections.** A section may have a parent, in which case it "logically follows its parent section and has no impact on any further sections" (`lib/livebook/notebook/section.ex:7-9`). Saved as `<!-- livebook:{"branch_parent_index":1} -->` (`export.ex:170-177`).
- **Package environment.** The setup cell (an optional code block between the H1 and the first H2, `live_markdown.ex:48-50`) holds `Mix.install([...])`, so dependencies live in the file.

## What's on disk

The smallest fixture, `test/support/notebooks/with_two_sections.livemd`, verbatim:

````markdown
# Notebook

## First section

This is the first section.

```elixir
length([1, 2, 3])
```

## Second section

This is the second section.
````

A Smart cell (from `lib/livebook/notebook/learn/intro_to_vega_lite.livemd:72-81`) is the generated code plus a comment holding what the UI form needs to regenerate it:

````markdown
<!-- livebook:{"attrs":{"chart_title":"Iris","height":200,...},"kind":"Elixir.KinoVegaLite.ChartCell","livebook_object":"smart_cell"} -->

```elixir
Vl.new(width: 400, height: 200, title: "Iris")
|> Vl.data_from_values(iris, only: ["petal_length", "petal_width", "species"])
|> Vl.mark(:point)
```
````

That bundled sample is in the legacy shape. The current exporter base64-encodes `attrs` "because attributes may include arbitrary values, including sequences like `-->` that would mess our format" (`export.ex:213-229`). The importer accepts both (`import.ex:251-259`). Other annotations: `{"break_markdown":true}`, `{"force_markdown":true}`, `{"output":true}`, `app_settings`, `file_entries`, and a trailing stamp (`live_markdown.ex:22-46`).

**Outputs.** `persist_outputs` defaults to `false` (`lib/livebook/notebook.ex:183`). When it is on, only textual outputs are written (`live_markdown.ex:93-95`), each as a fenced block tagged `<!-- livebook:{"output":true} -->` (`export.ex:293-298`). Rich JS outputs are included only if the widget implements an export (`export.ex:27-40`, `:260-270`).

**Cell identity.** None in the file. Cell ids are minted with `Utils.random_id()` on load (`lib/livebook/notebook/cell/code.ex:36`). Positions and headings are the only addresses.

## Agent reach

**Read: yes, trivially.** It is Markdown; `grep`, an LLM, or any CommonMark parser reads it.

**Write: yes, and Livebook has built the round trip.** `docs/dev_endpoints.md` documents three local JSON endpoints, off by default and rejecting any request with an `Origin` header (`:9-11`):

- `POST /dev/open` opens a file as a session (`:41`).
- `POST /dev/sync` "syncs the on-disk file into the running session" (`:23-25`). Under the hood, `handle_cast(:sync_file)` re-parses the file and `Livebook.Session.DataSync.sync/3` "diffs data with an updated notebook and returns a list of operations" applied as if a collaborator made them (`lib/livebook/session.ex:1635-1660`, `lib/livebook/session/data_sync.ex:9-21`).
- `POST /dev/restamp` re-signs a rewritten notebook, carrying the old stamp's permissions over (`:61-69`).

The doc then gives a **ready-made Claude Code `PreToolUse`/`PostToolUse` hook** on `Edit|Write` for `*.livemd` files (`docs/dev_endpoints.md:103-176`) and a git-diff restamping script (`:178-200`). No MCP server, no AI completion, and no LLM features in core at this pin (grep of `lib/` for openai/anthropic/mcp finds only a Bumblebee Whisper example in `lib/livebook/runtime/definitions.ex:387`).

**Where a text edit can bite:** Smart cell `attrs` are base64, so an agent can edit the generated code but not the form state without decoding; and the stamp at the end of the file is invalidated by any edit, which matters for secrets and app deployment (next section).

## What's clever or unique

- **The format degrades to plain Markdown, not to garbage.** Strip every `<!-- livebook -->` comment and you still have a readable document with headed sections and fenced code. Nothing in the study's notebook group beats that for "a human who has never heard of the tool can read it."
- **Comments as the escape hatch, encoded defensively.** Everything non-Markdown goes in one comment shape, and the one field that can contain arbitrary bytes is base64'd so `-->` can never break the file (`export.ex:220-222`).
- **Agent edits become collaborative operations.** `/dev/sync` does not reload; it diffs, so other connected users see the agent's change as edits, and autosave runs immediately afterwards so the file is re-normalized (`session.ex:1648-1655`). This is the most finished "agent edits the file, the live app follows" loop in the notebook group.
- **Notebook stamping.** Each save is signed with a machine key, and the stamp stores which secrets and file systems the notebook may use; a foreign stamp revokes them on open (`docs/stamping.md:5-9`). With Livebook Teams the stamp is an org signature and deployments refuse unstamped notebooks (`:11-24`). It is a trust layer on a plain-text file, which almost no other entry has.
- **Notebook → app with no new artifact.** `app_settings` in the leading comment (`github_stars.livemd:1`) turns the same `.livemd` into a deployed app; `LIVEBOOK_APPS_PATH` deploys a folder of them on boot (`README.md:190-194`) and `livebook deploy` pushes to Teams (`lib/livebook_cli/deploy.ex:13`).
- **Smart cells: UI that writes code you keep.** A form generates source, and the source is what is stored and run; "convert to a regular Code cell" is a one-way exit (`intro_to_vega_lite.livemd:83-85`).

## Costs / limits

- No stable cell ids in the file, so external tools (comments, review, agent ops by id) have nothing durable to point at.
- Rich outputs are mostly not persisted; a `.livemd` is source, not a record of a run.
- Elixir/Erlang first. Other languages exist (an `intro_to_python.livemd` ships), but the format's code-cell rule is about Elixir/Erlang fences (`live_markdown.ex:18`).
- Stamps are invalidated by any text edit, so agent-edited notebooks need `/dev/restamp` before secrets or Teams deployment work again.
- `/dev/*` is a security footgun if the instance is exposed to the network (`docs/dev_endpoints.md:13`).

## Relevance to flave

- **Steal the shape: executable fences inside LFM, metadata in comments.** `.livemd` proves a notebook can be a Markdown document first. If flave grows `sql` fences (spec §7.4), they should be ordinary fences with attributes (the spec already writes ` ```sql name=arr_by_segment `), and anything that cannot live in a fence info string should go in one well-defined escape hatch, encoded so it cannot break the file.
- **Do not persist outputs in the source document.** Livebook's default (`persist_outputs: false`) matches flave's thesis that `data/` plus the query is the truth. Rendered results belong in the publish step or a sidecar, not in `content/*.md`.
- **Do better on identity than Livebook does.** Livebook's random-on-load cell ids are its main gap; flave §8.1 already freezes deterministic block ids at M0, and executable fences should get them too (`name=` is the natural key).
- **Copy `/dev/sync` almost literally.** flave's "file watching" next step is exactly this: re-parse, diff into operations, apply through the same op set the UI uses. Livebook's version proves the diff-into-ops approach keeps collaborators and autosave coherent.
- **Stamping is a model for clearance.** A signature over the file that carries permissions is close to what flave's monotonic clearance check needs at publish time.

## Read next

- `lib/livebook/live_markdown.ex:1-81`: the whole format, specified in a comment
- `lib/livebook/live_markdown/export.ex:187-300`: cells, Smart cells, outputs
- `lib/livebook/session.ex:1635-1660` and `lib/livebook/session/data_sync.ex`: file → operations diff
- `docs/dev_endpoints.md`: the agent hook recipe
- `docs/stamping.md`: signing a plain-text notebook

## Related

- [[Profile__Pluto]]: plain source instead of Markdown, reactive, with stable cell UUIDs
- [[Profile__Deepnote]]: YAML blocks with ids, content hashes, and outputs split into snapshots
- [[Profile__mystmd]] and [[Profile__Evidence]]: the other "Markdown with executable fences" bets
- [[Profile__Notebook-Kit]]: the same question answered with HTML instead of Markdown

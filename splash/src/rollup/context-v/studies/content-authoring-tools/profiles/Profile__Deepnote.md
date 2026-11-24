---
name: Deepnote Profile
title: Deepnote — Profile
slug: deepnote
upstream: https://github.com/deepnote/deepnote
pinned_sha: 10992a6
pinned_date: 2026-11-19
version_at_pin: "@deepnote/cli@0.13.0-2-g10992a6 (monorepo; packages versioned separately)"
license: Apache-2.0
maintainer: Deepnote (company) — most active recent committers Tomas Kislan, James Hobbs, Srihari Thyagarajan
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/deepnote
profile_kind: Open-sourced notebook format, converter, CLI, MCP server, and local runner (TypeScript pnpm monorepo) for a commercial cloud notebook
date_created: 2026-11-19
date_modified: 2026-11-23
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Reference
site_uuid: d83e562c-3004-4521-8a81-87efa1351d1f
hex_code: l3rjtu
lede: >-
  A commercial notebook that open-sourced its file format as YAML blocks with
  content hashes, moved outputs into sidecar snapshot files, and shipped an MCP
  server and agent-only blocks before shipping a local UI.
summary: >-
  Profile of Deepnote's open-source monorepo as pinned in the
  content-authoring-tools study. Covers what was actually open-sourced (the
  `.deepnote` YAML spec and Zod schema, `@deepnote/blocks`, a converter to and
  from ipynb / Quarto / percent / Marimo, a CLI, an MCP server, a reactivity
  DAG, a local runner, cloud-sync clients; not the cloud UI), the source-vs-
  snapshot split with `contentHash` and `snapshotHash` provenance, SQL blocks
  that compile to Python, and the `agent` block type. Read against Jupyter's
  `.ipynb` and the sibling notebook entries.
tags:
  - Profile
  - Deepnote
  - Notebooks
  - YAML
  - MCP
  - Agent-Editable
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Deepnote.md"
---
# Deepnote — Profile

A profile of Deepnote's open-source repository as it lives in this study (`studies/content-authoring-tools/deepnote`, pinned at `10992a6`, 2026-11-19, two commits past `@deepnote/cli@0.13.0`). Apache-2.0. A TypeScript pnpm monorepo of packages around a commercial product, Deepnote Cloud.

## TL;DR

What was open-sourced is **the format and the tooling around it, not the notebook app.** The README's own roadmap says a local version of the Cloud UI, a local AI agent, bring-your-own-keys, and your own compute are still "soon" (`README.md:45-52`). Today you edit `.deepnote` files in the VS Code / Cursor / Windsurf extension (a separate repo, `README.md:109`) and run them through the CLI or local runner.

The packages (`AGENTS.md`): `blocks` (schema, types, Python codegen), `convert`, `cli`, `mcp`, `reactivity`, `runtime-core`, `local-runner`, `cloud`, `cloud-sync`, `cloud-mock`, `database-integrations`, `federated-auth`. The kernel-side helper the generated Python calls (`_dntk`) lives in the separate Deepnote Toolkit repo (`README.md:109`).

**One sentence:** *Deepnote is the most agent-tooled notebook format in the study, with an MCP server, a skill, and an `agent` block type, but its file is a structured YAML record of blocks, not a document a person would write by hand.*

## How it works

- **Schema.** A Zod schema is the source of truth (`packages/blocks/src/deepnote-file/deepnote-file-schema.ts`); `FILES.md` is the prose spec. A file holds one notebook (`FILES.md:26`, `:340-342`) plus `integrations` and an optional `environment` (`FILES.md:61-69`).
- **Blocks, not cells.** Every block has `id`, `blockGroup`, `type`, `content`, a string `sortingKey`, optional `contentHash` (`sha256:<hex>`), `metadata`, and, for executable blocks, `executionCount` and `outputs` (`deepnote-file-schema.ts:67-80`; `FILES.md:85-96`). Types include `code`, `markdown`, `sql`, `visualization`, `dataframe`, `image`, `input`, heading/paragraph text blocks (`FILES.md:100-114`), and `agent` (`deepnote-file-schema.ts:274`).
- **Execution.** Blocks are compiled to Python and run on a Jupyter-compatible kernel. A SQL block becomes `_dntk.execute_sql(<query>, '<connection env var>', ...)` assigned to the block's `deepnote_variable_name` (`packages/blocks/src/blocks/sql-blocks.ts:16-38`, `:91-113`).
- **Reactivity.** `@deepnote/reactivity` builds a DAG with `getDagForBlocks` and finds what to re-run with `getDownstreamBlocks` (`packages/reactivity/README.md`). It shells out to a Python AST analyzer that also extracts Jinja variables from SQL (`packages/reactivity/src/scripts/ast-analyzer.py:7`, `:251`), so a SQL block that references `{{ region }}` depends on whichever block defines `region`. A notebook's `executionMode` is `block` or `downstream` (`deepnote-file-schema.ts:592`).

## What's on disk

`test-fixtures/simple.deepnote`, verbatim except trimmed to two blocks:

```yaml
metadata:
  createdAt: 2025-01-01T00:00:00.000Z
  modifiedAt: 2025-01-01T00:00:00.000Z
project:
  name: simple-test
  id: 00000000-0000-0000-0000-000000000001
  notebooks:
    - id: 00000000-0000-0000-0000-000000000002
      name: Notebook1
      blocks:
        - blockGroup: "0"
          id: 00000000-0000-0000-0000-000000000003
          sortingKey: "0"
          type: markdown
          content: "# Hello World"
        - blockGroup: "2"
          id: 00000000-0000-0000-0000-000000000005
          sortingKey: "2"
          type: code
          content: |
            x = 1
            y = 2
            print(x + y)
version: 1.0.0
```

A SQL block from `examples/3_integrations.deepnote:14-33`, with its integration referenced by id and its result bound to a variable:

```yaml
        - blockGroup: c55d86401aca4829a7ad351dbfbbf38d
          content: |-
            SELECT * FROM default.hackernews
            WHERE type = 'story' ...
          id: 13db6a85530043f5aad25fdcc34f6329
          metadata:
            sql_integration_id: 100eef5b-8ad8-4d35-8e5e-3dfeeb387d4d
            deepnote_variable_name: stories
          sortingKey: x
          type: sql
          contentHash: sha256:80d4bb4e...
```

**Outputs: by default in a sidecar.** A `.snapshot.deepnote` is the same format with outputs filled in, Jupyter-shaped (`FILES.md:118-147`, `:149-162`), stored under `snapshots/` as `{project}_{project-id}_{notebook-id}_{latest|timestamp}.snapshot.deepnote` (`FILES.md:175-202`). `_latest` accumulates per-block outputs from different runs; timestamped snapshots are immutable whole-notebook runs (`FILES.md:215-240`). Inline `outputs` in the source file remain possible "when snapshots are disabled" (`FILES.md:96`).

## Agent reach

**Read: yes.** YAML, a published Zod schema, and an agent-facing `references/schema.ts` in the skill.

**Write: yes, and directly supported three ways.**

1. **Plain text edit.** It is YAML; an agent can add a block by hand. The constraints are invented ids, a `blockGroup`, and a `sortingKey` that sorts in the right place.
2. **MCP server** (`packages/mcp`): 17 tools, `deepnote_read`, `_cat`, `_validate`, `_diff`, `_create`, `_add_block`, `_edit_block`, `_remove_block`, `_reorder_blocks`, `_add_notebook`, `_convert_to`, `_convert_from`, `_run`, and four snapshot tools including `_snapshot_split` and `_snapshot_merge` (`packages/mcp/src/tool-names.ts:1-26`). `deepnote_run` can dry-run an execution plan and return truncated outputs inline (`packages/mcp/src/tools/execution.ts:189-232`).
3. **An agent skill** shipped in the repo (`skills/deepnote/SKILL.md`, with per-block-type and per-CLI-command references), plus an `AGENTS.md`/`CLAUDE.md` for coding agents.

And the format itself has an **`agent` block**: a prompt instead of code; when run, an agent reads the notebook so far, writes and runs Python blocks, and explains in Markdown (`docs/deepnote-cli-agent-blocks.md:9-17`). The model is a field on the block, `deepnote_agent_model: claude-opus-5-5`, with Anthropic, OpenAI, or any OpenAI-compatible endpoint (`:36-55`). `deepnote run x.deepnote --prompt "..."` appends one from the terminal (`:19-25`).

## What's clever or unique

- **Source / outputs split with hash provenance.** The source file "only change[s] when code changes, not when outputs change" (`FILES.md:168`). Each output-bearing block carries `contentHash` (`computeContentHash` in `packages/convert/src/snapshot/hash.ts:10-13`), so you can tell whether an output still matches its code. `snapshotHash` folds all block hashes, the environment hash, format version, and integration ids, explicitly **excluding** timestamps and outputs, answering "has the code, environment, or integrations changed since this snapshot was taken?" (`FILES.md:282-300`). The spec is honest about the gap: this is code provenance, "not data provenance" (`FILES.md:173`).
- **`snapshot_merge` with a staleness guard.** Merging outputs back into a source file can skip blocks whose code changed since the snapshot (`packages/mcp/src/tools/snapshots.ts:173-197`). That is the operational payoff of per-block content hashes.
- **SQL as a first-class block that joins the Python graph.** The query is stored as plain SQL, the connection by integration id, the result as a named variable, and Jinja references in the SQL are dependency edges. That is the full shape of a `sql` fence inside a reactive document.
- **The converter is the on-ramp and the exit.** `.ipynb`, Quarto, percent-format `.py`, and Marimo `.py` in both directions, preserving platform metadata on round-trip (`README.md:78-83`). Deepnote sits as a hub between the plain-text formats rather than a silo.
- **Agent-first sequencing.** MCP, a skill, agent blocks, and a CLI agent shipped before a local UI. Few notebook projects have made that bet so explicitly.

## Costs / limits

- **Not something a human writes.** UUIDs, `blockGroup`, `sortingKey`, and Markdown split into `text-cell-*` blocks make it a serialization, not a document. Compare [[Profile__Livebook]], where stripping the metadata leaves a readable page.
- **Open core.** The editor UI is the VS Code extension or the Cloud; the kernel helper is in another repo; the roadmap items (local UI, local agent, own compute) are not here yet (`README.md:45-52`).
- **Reactivity needs Python 3 and `jinja2` on the machine** even though the package is TypeScript (`packages/reactivity/README.md`).
- **Spec drift.** `FILES.md:79` lists `executionMode` values `block` or `all`; the schema accepts `block` or `downstream` (`deepnote-file-schema.ts:592`), and the skill agrees with the schema.
- **`docs/` is mostly Cloud product documentation** (AI, billing, integrations), not documentation of the open packages.

## Relevance to flave

- **Adopt the source-vs-snapshot split.** flave's `content/` should never hold rendered results; if executable fences run, their results belong in a sidecar keyed by block id, the way `snapshots/*_latest.snapshot.deepnote` sits beside the source. This keeps `jj` diffs to prose and code.
- **Hash each fence's content and record it with its output.** Deepnote's `contentHash` + `snapshotHash` is cheap, and it is exactly the "is this figure still true?" check flave needs. flave can go one step further than Deepnote admits it does: fold `data/_sources.yaml` sha256 values into the hash, giving data provenance as well as code provenance.
- **Model `sql` fences on Deepnote's SQL block, in fence form.** Plain SQL body, connection by reference (flave: a `data/` path or DuckDB), a required result name, and dependencies from references. flave's ` ```sql name=arr_by_segment ` already has the right parts.
- **Expose fences to agents as operations, not just text.** Deepnote's `add_block` / `edit_block` / `reorder_blocks` / `run` MCP tools are a ready vocabulary for flave's "one operation set with four callers."
- **Do not copy the file shape.** flave's promise is that the document is LFM; Deepnote's YAML record is what you get when the format serves the app first.

## Changes since the previous pin (2026-11-19 → 2026-11-19)

No change: the pin is still `10992a61d3b3` (two commits past `@deepnote/cli@0.13.0`), the latest commit on upstream `main` as of 2026-11-23, so every citation above stands.

## Read next

- `FILES.md`: the whole format, snapshots, and hashing in 346 lines
- `packages/blocks/src/deepnote-file/deepnote-file-schema.ts`: the Zod schema
- `packages/blocks/src/blocks/sql-blocks.ts:16-113`: SQL block to Python
- `packages/reactivity/README.md` and `src/scripts/ast-analyzer.py`: the dependency DAG
- `packages/mcp/src/tool-names.ts` and `docs/deepnote-cli-agent-blocks.md`: the agent surface

## Related

- [[Profile__Livebook]]: Markdown file, outputs off by default, no ids
- [[Profile__Pluto]]: plain source file with UUIDs, reactive, outputs only in exports
- [[Profile__Evidence]]: SQL in Markdown rendered into reports, the closest analogue to Deepnote's SQL blocks
- [[Profile__mystmd]] and [[Profile__Notebook-Kit]]: text-first formats Deepnote's converter does not target

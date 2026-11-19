---
name: Pluto Profile
title: Pluto — Profile
slug: pluto
upstream: https://github.com/JuliaPluto/Pluto.jl
pinned_sha: db2a5cdf
pinned_date: 2026-11-11
version_at_pin: "v1.0.4-src-10-gdb2a5cdf (Project.toml says 1.1.0)"
license: MIT
maintainer: JuliaPluto org — Fons van der Plas, Paul Berg, Panagiotis Georgakopoulos, et al. (Project.toml authors)
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/pluto
profile_kind: Reactive notebook (Julia server + Preact frontend) whose file is a runnable .jl script
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
site_uuid: ced62b08-0c9f-4377-9467-db7b1b7ee83d
hex_code: 7hdr6y
lede: >-
  A notebook saved as a Julia script in dependency order, so `julia notebook.jl`
  just runs, with the display order and the whole package lockfile tucked into
  comments and string literals at the bottom.
summary: >-
  Profile of Pluto.jl as pinned in the content-authoring-tools study. Covers the
  `.jl` file format (UUID-delimited cells written in topological order, a
  trailing "Cell order:" footer for display order and folding, per-cell TOML
  metadata, disabled cells as block comments, Project.toml and Manifest.toml
  embedded as two fixed-UUID cells), reactivity via PlutoDependencyExplorer,
  hot reload from file, outputs living only in HTML exports, and the AI prompt
  builder that walks the dependency graph. Read against Jupyter's `.ipynb` and
  the sibling notebook entries.
tags:
  - Profile
  - Pluto
  - Notebooks
  - Julia
  - Reactivity
  - Agent-Editable
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Pluto.md"
---
# Pluto — Profile

A profile of Pluto.jl as it lives in this study (`studies/content-authoring-tools/pluto`, pinned at `db2a5cdf`, 2026-11-11, ten commits past `v1.0.4`; `Project.toml:4` already reads `1.1.0`). MIT. A Julia web server with a Preact frontend; notebooks are reactive.

## TL;DR

Pluto notebooks are "saved as pure Julia files ... which you can then import as if you had been programming in a regular editor all along" (`README.md:47`). Cells may sit in any order on screen, because dependency analysis decides execution order (`README.md:40-41`). The save function writes the cells **in topological order**, which "guarantees that you can run the notebook file outside of Pluto, with `julia my_notebook.jl`" (`src/notebook/saving and loading.jl:30`).

**One sentence:** *Pluto is the study's strongest answer to "is the notebook a real program?", and its file is the most careful example of hiding notebook structure inside a host language's comments, but an agent must respect a UUID-and-footer protocol to add a cell.*

## How it works

- **Stack.** Pure Julia server (`src/`), Preact + CodeMirror frontend (`frontend/`), workers via `Malt`, messages via `MsgPack` (`Project.toml:7-40`).
- **Reactivity.** Each cell's defined and referenced variables are analyzed by `ExpressionExplorer` and `PlutoDependencyExplorer` (both deps in `Project.toml`). `run_reactive_core!` resolves the topology (expanding macros if needed), finds downstream cells, and re-runs them, deleting the old values of variables assigned by re-run cells (`src/evaluation/Run.jl:55-100`). Disabled cells disable everything downstream (`Run.jl:85-92`).
- **One definition per variable** is the price of order-free cells; reactivity errors come back through `PlutoDependencyExplorer.ReactivityError` (`src/evaluation/RunBonds.jl:37`).
- **Package environment per notebook.** Pluto's built-in package manager writes the notebook's own `Project.toml` and `Manifest.toml` into the file (below), so a notebook carries its exact dependency lockfile.

## What's on disk

`sample/Basic no cell order.jl`, abridged. The cells appear in execution order; screen order is the footer.

```julia
### A Pluto.jl notebook ###
# v0.20.14

using Markdown
using InteractiveUtils

# ╔═╡ b2d786ec-7f73-11ea-1a0c-f38d7b6bbc1e
md"""
# The Basel problem
...
"""

# ╔═╡ b2d792c2-7f73-11ea-0c65-a5042701e9f3
sqrt(sum(seq) * 6.0)

# ╔═╡ b2d79330-7f73-11ea-0d1c-a9aad1efaae1
n = 1:100000

# ╔═╡ b2d79376-7f73-11ea-2dce-cb9c449eece6
seq = n .^ -2
```

`sample/notebook_with_metadata.jl` shows the rest of the protocol:

```julia
# ╔═╡ 8399ed34-7dc4-11eb-16ec-e572834e149d
# ╠═╡ disabled = true
#=╠═╡
x = 7
  ╠═╡ =#

# ╔═╡ 00000000-0000-0000-0000-000000000001
PLUTO_PROJECT_TOML_CONTENTS = """
[deps]
"""

# ╔═╡ Cell order:
# ╠═88c83d42-7dc4-11eb-1b5e-a1ecad4b6ff1
# ╠═8399ed34-7dc4-11eb-16ec-e572834e149d
# ╟─00000000-0000-0000-0000-000000000001
```

The grammar, all in `src/notebook/saving and loading.jl`:

| Marker | Meaning | Where |
|---|---|---|
| `### A Pluto.jl notebook ###` + `# v…` | Header and Pluto version | `:5`, `:35-36` |
| `#> key = value` | Notebook metadata as TOML | `:6`, `:39-46` |
| `# ╔═╡ <uuid>` | Start of a cell; the UUID is the cell's identity | `:9`, `:75` |
| `# ╠═╡ key = value` | Per-cell metadata as TOML | `:10`, `:77-83` |
| `#=╠═╡ … ╠═╡ =#` | Disabled (or skipped-as-script) cell, wrapped in a block comment so the script still runs | `:15-16`, `:88-92` |
| UUIDs `…0001` / `…0002` | Embedded `Project.toml` / `Manifest.toml` as Julia string literals | `:18-19`, `:112-124` |
| `# ╠═` / `# ╟─` + uuid under `Cell order:` | Display order; `╟─` means code folded | `:11-12`, `:126-136` |

**Outputs: none in the `.jl`.** Outputs live only in exports: the static HTML export injects a "statefile" (and optionally the notebook file) into `editor.html` (`src/notebook/Export.jl:123-151`), and warns past 32 MB.

## Agent reach

**Read: yes.** It is a Julia file; the box-drawing delimiters are greppable and the code is unescaped.

**Write: yes, if the agent follows the protocol, and the loader is forgiving when it doesn't:**

- A cell whose header is not a valid UUID, or whose UUID is duplicated, gets a fresh one with a warning (`saving and loading.jl:250-262`).
- A cell present in the body but missing from `Cell order:` is appended to the end rather than dropped (`:320-329`).
- Code that contains the delimiter `# ╔═╡ ` is silently rewritten on save, "sorry!" (`:85-86`).

**Hot reload exists but is off by default.** `auto_reload_from_file` ("watch notebook files for outside changes and update running notebook state automatically") defaults to `false` (`src/Configuration.jl:53`, `:78`). When on, a `watch_file` loop (`src/webserver/SessionActions.jl:161`) calls `update_from_file`, which diffs added, removed, changed, folded, order, and package changes and re-runs only what changed (`src/evaluation/Run.jl:575-603`).

**AI features: prompt building, not an agent.** `enable_ai_editor_features` defaults to `true` (`Configuration.jl:51`, `:75`). "Ask AI" builds a prompt from the current cell, its output, the variables it uses, and **every upstream cell from the dependency graph**, wrapped in `<pluto-ai-context-*>` tags, for the user to copy into a chatbot (`frontend/components/AIContext.js:133-160`). A "Fix with AI" button posts syntax errors to a Pluto-hosted endpoint after a permission prompt (`frontend/components/FixWithAIButton.js:9-10`, `:59-62`). No MCP server or CLI for agents.

## What's clever or unique

- **Two orders in one file.** Body order is execution order (so the script runs); the footer is display order (so the story reads well). Jupyter has one order and lets them drift; Pluto stores both and computes one from the other.
- **The file runs outside the tool, and goes out of its way to.** It prepends `using Markdown` / `using InteractiveUtils` and, if `@bind` is used, injects a mock `@bind` so UI-bound variables get defaults instead of errors (`saving and loading.jl:49-58`).
- **The lockfile is inside the notebook.** Two fixed-UUID cells hold `Project.toml` and `Manifest.toml` as string literals: a reproducible environment that travels with a single file and still parses as Julia.
- **Stable, author-independent cell identity.** Every cell has a UUID in the text, and the diff-based hot reload keys on it. This is what Livebook's file lacks.
- **The dependency graph feeds the AI context.** Instead of sending the whole notebook, Pluto sends the cell's actual upstream slice (`AIContext.js:144-148`). That is the right unit of context for an agent editing one cell of a reactive document.

## Costs / limits

- The delimiter protocol is real syntax: a new cell needs a UUID line, and a well-behaved writer also updates the footer.
- Topological save order means a small edit that changes dependencies can move cells around in the file, producing noisy diffs.
- Julia only, and one-definition-per-variable rules out some ordinary script patterns.
- Hot reload is opt-in and partly marked "experimental, will be removed" (`Configuration.jl:79-80`).
- The Manifest is embedded verbatim, so package updates produce large diffs in the notebook file.

## Relevance to flave

- **Stable ids in the text, keyed by the tool.** Pluto's UUID-per-cell is the model for flave §8.1; executable fences in flave need an id that survives reordering, and `name=` on a `sql` fence should be required and unique, the way Pluto's UUID is.
- **Reactivity by named dependency is the right model for `sql` → `vega-lite data=`.** flave's §7.4 example is already a two-node DAG. Copy Pluto's rule: one definition per name, and resolve run order from references, not position.
- **Keep outputs out of the source.** Pluto's `.jl` has zero outputs; results appear only in exports. flave's publish step is the equivalent of Pluto's HTML statefile export.
- **Embed the environment, not just the code.** Pluto's in-file Manifest is the precedent for flave pinning its DuckDB version and `data/_sources.yaml` hashes so a query re-runs the same way six months later.
- **Give agents the upstream slice, not the whole document.** Pluto's AI context builder is a small, copyable idea for flave's embedded chat.

## Read next

- `src/notebook/saving and loading.jl:1-140`: the whole writer, in 140 lines
- `src/notebook/saving and loading.jl:200-330`: the forgiving loader
- `src/evaluation/Run.jl:55-100` and `:575-610`: reactive run and hot reload
- `frontend/components/AIContext.js:133-200`: dependency-aware prompt builder
- `sample/notebook_with_metadata.jl`: every format feature in one small file

## Related

- [[Profile__Livebook]]: Markdown instead of source, linear rather than reactive, no ids in the file
- [[Profile__Deepnote]]: YAML blocks, a reactivity DAG built by Python AST analysis, outputs in snapshot files
- [[Profile__Notebook-Kit]]: Observable's reactive notebooks, whose reactive-notebook essay Pluto's README links (`README.md:40`)
- [[Profile__mystmd]]: executable Markdown aimed at publishing rather than running

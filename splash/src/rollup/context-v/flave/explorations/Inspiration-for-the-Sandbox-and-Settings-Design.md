---
title: "Inspiration for the Sandbox and Settings Design"
lede: "What flave's sandbox directories and its config, .env and .secrets split borrow from RO-Crate, Letta's Agent File and MCP Bundles, and what else is worth reading alongside them."
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
at_semantic_version: 0.0.0.1
status: Reference
publish: true
site_uuid: 23dbde5f-2bee-4a89-9d10-43a374a1b116
hex_code: 8skbds
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
categories: Exploration
spec_reference: "[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]"
study_reference: "https://github.com/lossless-group/study-agent-workspace-bundles"
tags:
  - Exploration
  - Flave
  - Prior-Art
  - RO-Crate
  - Agent-File
  - MCP-Bundles
  - Secrets
type: Explorations
from: "flave"
from_path: "context-v/explorations/Inspiration-for-the-Sandbox-and-Settings-Design.md"
---
# Inspiration for the Sandbox and Settings Design

*Moved here 2026-11-19 from §5.9 of
[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]], unchanged. The
spec's §5.7 (the sandbox directories) and §5.8 (`config/`, `.env`, `.secrets`)
are the decisions; this is where the thinking behind them came from.*

§5.7 and §5.8 borrow from three existing formats. Each does one part of what a
flave now has to do. All three are pinned in
[`study-agent-workspace-bundles`](https://github.com/lossless-group/study-agent-workspace-bundles),
alongside the sandbox runtimes that could rebuild a flave's `env/`.

| Format | What it is | What flave takes from it |
|---|---|---|
| **[RO-Crate](https://www.researchobject.org/ro-crate/)** (Research Object Crate) | A convention from research data: any folder becomes a crate by adding one `ro-crate-metadata.json` at its root, which describes every file and where it came from. An optional `ro-crate-preview.html` is the human view | The closest match to flave's whole shape: **a folder of work, one file of metadata and provenance, and a generated human view kept separate from the payload.** Read first before extending `_sources.yaml` and `runs/` |
| **[Letta Agent File (`.af`)](https://github.com/letta-ai/agent-file)** | An open format for exporting a stateful agent: memory, tools, system prompt and model settings in one file | **Secrets are set to `null` on export.** The structure of the agent travels; the keys don't. Same rule as `.secrets` (§5.8) |
| **[MCP Bundles (`.mcpb`)](https://github.com/modelcontextprotocol/mcpb)** | The zip format behind Claude Desktop's one-click extensions: a local MCP server plus a `manifest.json` | **`user_config` fields marked `"sensitive": true`** are collected from the user and stored in the OS keychain, and the server config refers to them as `${user_config.api_key}`. The model for `config/secrets.yaml`, `${secret:NAME}` and keychain pointers |

Also worth reading alongside them: Frictionless Data Package (typed data files
with a `datapackage.json`), Dev Containers and Nix flakes (rebuilding an
environment from a small recipe, as `env/` does), git-annex (big files as
pointers in git, as §8.5 requires), and Claude Code's `settings.json` /
`settings.local.json` split (shared vs. personal, as `config/` vs. `.env`).

## Related

- [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]: §5.7, §5.8, §8.5
- [[A-Flave-Is-the-Zip-for-an-Agent-Session]]: the exploration that led to §5.7 and §5.8
- [`study-agent-workspace-bundles`](https://github.com/lossless-group/study-agent-workspace-bundles): the pinned formats and runtimes

---
title: "Browser-drive verification as a kit practice — operationalizing the Playwright-MCP rung across every Lossless repo"
lede: "The kit's adaptation of the anchor-root blueprint: not just HOW an agent drives a browser before a human walks the surface, but how the practice ROLLS OUT — the core-MCP registry, the idempotent per-repo wiring, and the CLAUDE.md block that travels with it."
date_created: 2026-07-22
date_modified: 2026-07-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
semantic_version: 0.0.0.1
adapted_from: "lossless-monorepo/context-v/blueprints/Browser-Drive-Verification-For-Agent-Sessions.md"
tags:
  - Blueprint
  - Browser-Automation
  - Playwright-MCP
  - MCP-Rollout
  - Core-MCPs
  - Context-Vigilance-Kit
status: Draft
publish: true
from: "context-vigilance-kit"
from_path: "context-v/blueprints/Browser-Drive-Verification-For-Agent-Sessions.md"
---
# Browser-drive verification — the kit's rollout draft

> **Draft adaptation.** The pattern itself is specified at the anchor root:
> `lossless-monorepo/context-v/blueprints/Browser-Drive-Verification-For-Agent-Sessions.md`.
> This file is the context-vigilance-kit's angle on it — the kit
> operationalizes practices across the whole tree, so its concern is
> *rollout and consistency*, not re-stating the mechanics.

## The pattern, in one paragraph

UI-bearing work gets a browser-drive rung between scripted E2E and the human
walk-through: the agent wires **Playwright MCP** at project scope
(`claude mcp add -s project playwright -- npx @playwright/mcp@latest`, lands
in the committed `.mcp.json`, loads next session), drives the click-path
named in the phase plan (navigate → click → type → assert on accessibility
snapshots, screenshots only for visual questions), with reads unrestricted
and writes gated to each repo's designated safe target. `claude --chrome`
is the interactive sibling for watch-me-drive sessions. The drive proves
buttons *work*; the human still judges *usable*.

## What the kit adds — rollout machinery (proposed, unbuilt)

1. **A core-MCP registry.** One canonical file in this kit (proposed:
   `scripts/core-mcps.json`) declaring the tree's foundational servers and
   their scope guidance — the same role `sync-skills-symlinks.sh` plays for
   skills. Candidate registry as of 2026-07-22:
   - `playwright` — universal, project scope, every UI-bearing repo
   - `chroma` — universal, already user-scope laptop-wide + project scope at ai-labs
   - `surrealdb` — conditional, project scope where the canonical layer is in play (augment-it precedent: `scripts/mcp-surrealdb.sh`)
2. **An idempotent wiring script.** Proposed `scripts/ensure-core-mcps.sh
   <repo-path>`: merges missing core entries into the target repo's
   `.mcp.json` (create-if-absent, never clobber existing entries, never
   touch non-core entries) and prints what changed. Run as an
   opening-habit sibling to the skills sync.
3. **The traveling CLAUDE.md block.** The canonical instruction block lives
   in the anchor root `CLAUDE.md`; every Lossless-owned repo's `CLAUDE.md`
   carries it verbatim. When the block changes, the kit is where the
   "re-propagate" sweep should live (proposed:
   `scripts/sync-claude-md-blocks.sh`, marker-comment-delimited so the
   sweep is mechanical).
4. **Corpus visibility.** Because this kit's ingest scripts feed the Chroma
   collections, drive scripts and their outcomes (named in plans +
   changelogs per the pattern) become searchable prior art — "has this
   surface been browser-driven before" becomes a `search-lossless-corpus`
   query, for free.

## Open questions (draft status is real)

- [ ] Does the registry belong here or in the anchor root's `context-v/`?
  (Leaning here — the kit is the only repo whose *job* is cross-tree
  operationalization; the root blueprint stays the human-readable spec.)
- [ ] Marker-comment convention for the traveling block
  (`<!-- lossless:core-mcps:start/end -->`?) — needed before any sync
  script can be trusted not to clobber hand-edits.
- [ ] Should `ensure-core-mcps.sh` also verify `npx @playwright/mcp` is
  runnable (node present, network) or stay pure-config?

## Related

- Anchor-root blueprint (the spec of record): `lossless-monorepo/context-v/blueprints/Browser-Drive-Verification-For-Agent-Sessions.md`
- `ai-labs/augment-it/context-v/loops/Loop-through-Spec-Write-Plans-Implement-Test-Changelog-Commit.md` — the loop whose ladder gains the rung
- This kit's `scripts/ingest-all.sh` + the four Chroma collections — the corpus that makes drive history searchable
- `context-v/skills/sync-skills-symlinks.sh` at the anchor root — the opening-habit precedent the wiring script copies

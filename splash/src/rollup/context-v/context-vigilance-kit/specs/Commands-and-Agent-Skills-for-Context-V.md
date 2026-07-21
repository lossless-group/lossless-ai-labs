---
title: "Commands and Agent Skills for context-v"
lede: "Reference catalog of every command, slash command, and agent skill the context-vigilance-kit ships — name, status, trigger, signature, purpose, and where the implementation lives. Modeled on Spec-Kit's pattern of making the agent-facing surface discoverable to Claude Code via .claude/commands/ and .claude/skills/, so adopters see the kit's full vocabulary natively at session start."
date_authored_initial_draft: 2026-06-01
date_authored_current_draft: 2026-06-01
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-06-01
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Specification
tags:
  - Context-Vigilance
  - Agent-Skills
  - Slash-Commands
  - Claude-Code
  - Spec-Kit
  - Reference-Catalog
authors:
  - Michael Staton
date_created: 2026-06-01
date_modified: 2026-06-01
from: "context-vigilance-kit"
from_path: "context-v/specs/Commands-and-Agent-Skills-for-Context-V.md"
---
# Commands and Agent Skills for context-v

## Audience

Adopters of `context-vigilance-kit` — anyone who runs `cv-init` on a pseudomonorepo. Also: lead engineers onboarding a team to the kit, and agents (Claude Code or similar) that need to discover the kit's vocabulary at session start.

## Purpose

A consolidated catalog of every command, slash command, and agent skill the kit ships, with status, trigger, signature, output, and cross-references. The companion spec [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-V]] defines the **system behavior** (three loops, applicability, philosophy). This spec defines the **surface area** users and agents discover.

Two reasons this catalog matters:

1. **Adoption clarity.** New users need a single place to see "what's in here, what does it do, when does it fire."
2. **Agent discoverability.** Claude Code auto-loads `.claude/skills/` and `.claude/commands/` from project scope at session start. **Spec-Kit** (GitHub's spec-driven-development library) uses this exact mechanism to make commands available natively. The kit follows the same convention so adopting agents see the surface without extra wiring.

## Loading model — how agents and users discover kit assets

The kit ships three classes of agent-facing assets, each with a different discovery mechanism:

| Asset class | Lives in | Discovery mechanism |
|---|---|---|
| **Agent Skills** | `<senior-root>/.claude/skills/<skill-name>/SKILL.md` (project scope) OR `~/.claude/skills/<skill-name>/SKILL.md` (user scope, per [[feedback_skill_authoring_in_lossless_skills]]) | Claude Code auto-loads; activates when the user's intent matches the skill's `description` field |
| **Slash Commands** | `<senior-root>/.claude/commands/<command-name>.md` | Claude Code auto-loads; appear in the slash menu and as `/<name>` invocations |
| **CLI Commands** | `<kit_root>/scripts/<command>` (Lossless: `ai-labs/context-vigilance-kit/scripts/`) | Invoked in the terminal by the user; agents invoke via `Bash` |

`cv-init` wires all three so adopting trees have the catalog active from the first session after init.

## Agent Skills

Three skills total. One existing; two introduced by the [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-V]] spec.

### `search-lossless-corpus`

| Field | Value |
|---|---|
| **Status** | **Existing** (implemented, in active use) |
| **Trigger shape** | Q&A phrasing — *"did we already…"*, *"what did we decide…"*, *"how did we fix…"*, *"where did we put…"* |
| **Auto-fire?** | No — activates by intent match against user message |
| **Purpose** | Ground answers about prior decisions, shipped work, history, failures, and locations in the corpus instead of training-data folklore |
| **Output** | Cited answer (`source_path` + timestamp + repo slug per claim); never a chunk dump |
| **Discipline** | Decompose → execute → evaluate → synthesize; cap at 5 Chroma queries per question |
| **Skill file** | `context-v/skills/search-lossless-corpus/SKILL.md` |
| **Scoped to** | All four collections (selected per sub-query, not fanned out) |

**Not changed by this kit version.** Stays scoped to Q&A grounding; the new skills handle session-start loading and recency catch-up. **Anti-pattern**: don't chain into kickoff/catch-up on the same trigger — distinct surfaces.

### `kickoff-context-v`

| Field | Value |
|---|---|
| **Status** | **Planned** (v0 implementation in [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-V]] Loop 1) |
| **Trigger shape** | **Auto-fires at session start** when applicability passes AND opening user message lacks context-v file references |
| **Auto-fire?** | Yes — agent enforces the discipline humans skip |
| **Purpose** | Replace hand-loading and dir-scan with semantic file selection while keeping the user as the picker |
| **Output** | Files loaded into context (via `Read`) after the user picks from a three-bucket triage |
| **Flow** | Agent asks *"any known relevant context-v files?"* → user lists files OR says "help me find" OR "no context needed" → on help-me-find, agent queries `context-vigilance-corpus` + `changelog-corpus` (roles), groups hits by `source_path`, presents three buckets (Hard include / Maybe — have on hand / Ignore), user picks, agent `Read`s the picks |
| **Distance threshold** | None — conversational evaluation does the work; no hard numeric trip-wire |
| **No-match fallback** | Loud — agent says so and falls back to dir-scan |
| **Skill file** | `context-v/skills/kickoff-context-v/SKILL.md` (to be authored in lossless-skills) |
| **Scoped to** | `context-vigilance-corpus` + `changelog-corpus` (roles, resolved via `config.collections.*`) |

### `catch-up-on-context-v`

| Field | Value |
|---|---|
| **Status** | **Planned** (v0 implementation in [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-V]] Loop 3) |
| **Trigger shape** | **Auto-fires as nudge at session start** (after kickoff resolves) when delta-meaningfulness threshold clears AND `nudge.state == "on"` AND `now > muted_until`; also via explicit slash command |
| **Auto-fire?** | Yes (nudge policy — auto opt-in, mutable) |
| **Purpose** | Keep users ambiently aware of recent context-v / changelog activity; meeting-prep digest for distributed teams |
| **Output** | Three-level digest (repo → tag → files, recency desc) OR overflow-mode truncation with auto-narrow prompt for wide windows |
| **Default nudge threshold** | Last session >3 days ago OR ≥5 context-v files modified in last 2 weeks |
| **Default window (nudge)** | 2 weeks |
| **Mute mechanism** | `mute-for-today` / `mute-for-week` / `cv-config nudge off` |
| **Overflow handling** | Default cap 50 files; auto-narrow prompt above |
| **Skill file** | `context-v/skills/catch-up-on-context-v/SKILL.md` (to be authored in lossless-skills) |
| **Scoped to** | `context-vigilance-corpus` + `changelog-corpus` (roles) |

## Slash Commands

Explicit, parameter-driven invocations of the retrieval surfaces. Live in `<senior-root>/.claude/commands/*.md`; appear in the Claude Code slash menu.

### Catch-up family

| Command | Signature | Purpose | Status |
|---|---|---|---|
| `/catch-up-2w` | no args | Fast trigger: 2-week recency digest | **Planned** |
| `/catch-up-1m` | no args | Fast trigger: 1-month recency digest | **Planned** |
| `/catch-up` | `--window <N{d\|w\|m\|y}>` | Explicit window (3m/6m/1y trigger overflow handling) | **Planned** |
| `/catch-up` | `--scope <source_repo_slug>` | Limit digest to one repo's subtree | **Planned** |
| `/catch-up` | `--by-author <name>` | Filter by author (requires `fm_authors` allowlist patch from Loop 2) | **Planned (v0 data, v1 UI)** |
| `/catch-up` | `--max-files <N>` | Override overflow cap (default 50) | **Planned** |
| `/catch-up` | `--since <ISO date>` | Explicit cutoff instead of window | **Planned** |
| `/catch-up` | `--alphabetical` | Tag buckets in alphabetical order instead of most-recently-active | **Planned (v1 toggle)** |

### Kickoff (rarely needed explicitly — the skill auto-fires)

| Command | Signature | Purpose | Status |
|---|---|---|---|
| `/kickoff` | no args | Manual re-fire of kickoff (after `no context needed` was said earlier in session, or after Claude Code's context compaction) | **Planned** |

## CLI Commands

User-facing scripts under `<kit_root>/scripts/`. Invoked from terminal; agents invoke via `Bash`. All write to `<senior-root>/.context-vigilance/` unless flagged otherwise.

### Setup and configuration

| Command | Signature | Purpose | Status |
|---|---|---|---|
| `cv-init` | `[--senior-root <path>]` | One-time ceremony: asks for / accepts senior root, writes `.context-vigilance/config.json`, the SessionStart hook in `<senior-root>/.claude/settings.json`, the wrapper script, and per-collection manifest skeletons | **Planned** |
| `cv-dismiss` | `[path]` | Write `.context-vigilance-skip` marker at `path` (or cwd) so any session under it sees kit as not-applicable | **Planned** |
| `cv-undismiss` | `[path]` | Remove the marker | **Planned** |
| `cv-config` | `get <key>` / `set <key> <value>` / `list` | Read or write `.context-vigilance/config.json` entries — nudge state, collection name overrides, thresholds | **Planned** |
| `cv-help` | no args | List all kit commands + skills + slash commands with one-line summary; pointer to this spec | **Planned (v0 stretch)** |

### Ingestion

| Command | Signature | Purpose | Status |
|---|---|---|---|
| `ingest-to-chroma.py` | `[--changed-since]` / `[--force-rebuild]` / `[--reset]` / `[--limit <N>]` / `[--query "..."]` / `[--collection <name>]` | Ingest context-v markdown into `context-vigilance-corpus` (role). Existing script; `--changed-since` + sidecar manifest support added in v0. | **Existing + Patch** |
| `ingest-changelogs-to-chroma.py` | same flag shape | Ingest `<repo>/changelog/` entries into `changelog-corpus` (role) | **Existing + Patch** |
| `ingest-claude-sessions-to-chroma.py` | `[--reset]` / `[--limit <N>]` | **Opt-in, privacy-sensitive.** Ingest Claude Code session transcripts into `claude-code-sessions`. **Never auto-fired by the SessionStart hook.** | **Existing** |
| `ingest-all.sh` | `[--with-sessions]` / `[--with-traces]` / `[--with-claude]` / `[--reset]` / `[--dry-run]` / `[--only-context-v]` / `[--only-changelog]` / `[--only-claude]` | Master orchestrator. Default runs the two safe ingesters. Opt-in flags add privacy-sensitive collections. | **Existing** |

### Diagnostics

| Command | Signature | Purpose | Status |
|---|---|---|---|
| `smoke-test-chroma.py` | no args | Verify Chroma connectivity, list collections, sample-query | **Existing** |

## Hooks (not user-invoked, but worth cataloging)

| Hook | Trigger | Purpose | Status |
|---|---|---|---|
| `<senior-root>/.context-vigilance/scripts/session-start.sh` | Claude Code `SessionStart` event | Runs applicability check, then incremental `--changed-since` ingest of `context-vigilance-corpus` + `changelog-corpus` (roles). Best-effort; fails silently if Chroma unreachable. **Never** fires session/trace ingesters. | **Planned** |

## Status summary

For each asset class, where v0 lands:

- **Already shipped:** `search-lossless-corpus` skill; all `ingest-*.py` scripts; `ingest-all.sh`; `smoke-test-chroma.py`.
- **v0 implementation** (per [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-V]] implementation slice): `kickoff-context-v` skill, `catch-up-on-context-v` skill, `cv-init`, `cv-dismiss`, `cv-undismiss`, `cv-config`, the SessionStart hook + wrapper script, the `--changed-since` patches to the two ingesters, the `fm_authors` allowlist patch, the `/catch-up-*` and `/kickoff` slash commands.
- **v0 stretch:** `cv-help`, hook verbose-logging mode.
- **v1+:** `/catch-up --by-author` UI surface, theme summarization for wide windows, per-project last-session tracking, resume-after-compaction trigger, `owner:` schema activation, kit governance for multi-steward adopters, distribute kit as PyPI / Homebrew package.

## Discoverability story

Three entry points for users encountering the kit:

1. **This spec** as the canonical catalog (versioned, lives in `context-v/specs/`).
2. **`cv-help`** as the at-the-terminal quick reference (v0 stretch).
3. **Claude Code's native slash menu** for the `/catch-up*` and `/kickoff` commands (auto-discovered from `<senior-root>/.claude/commands/`).

For agents adopting **Spec-Kit-style** command loading: the kit's `.claude/commands/*.md` files are the contract. Agents that scan project-scope `.claude/` directories at session start (Claude Code's default behavior) discover them automatically once `cv-init` has run. No additional registration step.

## Naming conventions

- **Skill names:** kebab-case verb-phrases (`kickoff-context-v`, `catch-up-on-context-v`). The verb signals the trigger shape (kickoff at session start; catch-up at intervals). Sibling names share construction (`-context-v` suffix).
- **Slash commands:** kebab-case, prefer fast-trigger short forms (`/catch-up-2w`) over flag-driven full forms when the parameter is fixed and frequently used.
- **CLI commands:** `cv-` prefix for kit-level commands (`cv-init`, `cv-dismiss`, `cv-config`). Existing ingester scripts keep their descriptive Python-style names (`ingest-to-chroma.py`) since they predate the `cv-` namespace.

## Related

- [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-V]] — companion spec defining the system behavior (three loops, applicability model, philosophy). This spec is the surface catalog; that spec is the system contract.
- [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] — parent exploration both specs close.
- [[search-lossless-corpus]] — the existing skill cataloged above.
- [[context-vigilance]] — the directory-roles practice this kit supports.
- [[pseudomonorepos]] — the tree-shape discipline defining "senior root."
- [[chroma-local]] — generic Chroma usage reference.
- [[Profile__Beads]] — prior art for the `cv-init` / `cv-dismiss` / `cv-config` family ([[Profile__Beads]]'s `bd init` / `bd setup` / `bd remember` family). The `cv-help` pattern echoes `bd prime`'s discoverability mechanism.
- **Spec-Kit** (github.com/github/spec-kit) — GitHub's spec-driven-development library; the model for `.claude/commands/`-based command discovery this catalog follows.

## Outcome

*(Open. Update as commands and skills are implemented per [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-V]] implementation slice. Mark `status: Final` when every **Planned** item above is implemented and at least one external adopter has discovered the surface via `cv-help` or the Claude Code slash menu on their own tree.)*

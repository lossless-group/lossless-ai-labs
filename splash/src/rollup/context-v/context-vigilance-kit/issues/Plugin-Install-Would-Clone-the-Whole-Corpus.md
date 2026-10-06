---
type: Issues
title: "Issue: Plugin Install Would Clone the Whole Corpus"
description: "Why the kit moved to a fresh repo, separate from the corpus whose history it would have shipped."
lede: "Installing the cv plugin would download 55 MB of our private working history. The kit and the corpus need separate repos."
summary: "Blocks the MVP plugin's distribution step. Records why the kit (plugin, templates, starters, neutral examples) and the corpus (collated context-v, manifests, ingesters, splash) must live in separate repositories, what goes where, and the decisions still open before the split is executed."
publish: false
date_created: 2026-10-01
date_modified: 2026-10-01
date_authored_initial_draft: 2026-10-01
date_authored_current_draft: 2026-10-01
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.2.0
status: Partially-Resolved
tags:
  - Issue
  - Context-Vigilance
  - Claude-Code
  - Plugin
  - Distribution
  - Repo-Structure
  - Privacy
site_uuid: d7a91409-ef76-4100-adb8-a9e9c4380246
hex_code: soyegn
from: "context-vigilance-kit"
from_path: "context-v/issues/Plugin-Install-Would-Clone-the-Whole-Corpus.md"
---
# Issue: Plugin Install Would Clone the Whole Corpus

## Why care?

We want to make context-v available to anyone. Realistically, that starts with direct collaborators on specific projects. Installing it should give a newcomer templates, a starter scaffold, and a few neutral examples, and nothing else.

Today the plugin is specced to ship from this repo. That repo is mostly *our* corpus: a collated copy of every `context-v/` document across the Lossless tree, plus the manifests, ingesters, and splash built on top of it. An installer would download all of it, including the parts of its git history we already regret publishing. The spec accepted this as a clone-weight tradeoff. On inspection it isn't really about clone weight. It's a boundary problem: one repo is trying to serve three audiences that need different things.

## Symptom

[[MVP-to-Claude-Code-Plugin]] puts the plugin inside this repo and points `.claude-plugin/marketplace.json` at a subdirectory (`plugin/harnesses/claude-code/`). Its *Clone-weight tradeoff* paragraph accepts the cost "for MVP" and defers a lean sibling repo to tier 2. Measured on 2026-10-01:

| What | Size |
|---|---:|
| Packed git history (`git count-objects`) | 15 MiB packed |
| Uncompressed blob history under `corpus/` | **54.6 MB (~95% of all history)** |
| `corpus/` in the working tree | 23 MB, 42 source-repo folders |
| `corpus-manifest.md` | 496 KB |
| Everything the plugin actually needs (skills, commands, templates) | ≈ tens of KB |

Weight isn't the only problem. Two commits show that **this repo's history already holds material a stranger should never be handed**:

- `8c9aaa5` stopped a storage-credential identifier and an auth salt/hash from being published at HEAD. Both had been redacted at source but survived in a stale collate.
- `c1ab105` stopped confidential client deck content from being published at HEAD. Its own message says the objects remain reachable in history and that purging is "a separate decision because it means force-pushing a public repo."

Every clone of this repo, including the clone a plugin install performs, delivers that history.

## Environment

- Repo: `lossless-group/context-vigilance-kit`. **Public.** Mounted as an `ai-labs` submodule on branch tier `development`. `development` = `main` = `master` = `a66b17e` at the time of writing.
- The corpus is committed on purpose: the GitHub Pages CI can't reach the source repos, so the splash builds from the collated copies.
- No plugin code exists yet (no `.claude-plugin/`, no `plugin/`). This is the cheapest moment to change the shape.

## Audiences: three of them, not one

| Audience | Needs | Doesn't need |
|---|---|---|
| **Anyone** (strangers, the eventual public) | Plugin: skills, `/cv:*` commands, templates, starter scaffold, neutral examples | Anything Lossless-specific |
| **Collaborators on a specific project** (the realistic first adopters) | The plugin, plus *that project's own* `context-v/`, which already lives in the project repo they clone | The tree-wide corpus |
| **Collaborators across many projects** (core team) | The corpus, manifests, Chroma/Graphiti ingesters, splash, tree-walking scripts | Nothing excluded |

The first two audiences never need the corpus. The second audience is the important result: a project collaborator gets full project context from the project repo plus the plugin. The corpus is a cross-project tool, not a prerequisite.

## Options considered (hypothesis log)

Append-only. Wrong turns stay.

### H1 — Delete `corpus/` from HEAD, keep one repo

**Reasoning:** If the working tree is light, the clone is light.
**Test:** Measured how blob history is distributed (table above).
**Result:** ❌
**Learned:** About 95% of history is `corpus/`. A full clone still carries all of it, along with the leaked material. HEAD-only fixes don't change what a clone delivers.

### H2 — Rely on the plugin loader fetching only the subdirectory

**Reasoning:** The marketplace entry points at `plugin/harnesses/claude-code/`. Maybe install does a sparse or shallow fetch of just that path.
**Test:** Not run. Whether `/plugin marketplace add` and `/plugin install` clone the whole repo, shallow-clone it, or sparse-checkout the subdirectory is **unverified**.
**Result:** ❓ but moot
**Learned:** Even the best case leaves two problems. (a) Anyone who follows the repo link or clones it gets everything. (b) The repo's public identity ("the context-v kit") stays tangled with our internal corpus. The audience boundary should be structural, not something an install mechanism happens to provide.

### H3 — Purge history (`git filter-repo`) and force-push

**Reasoning:** This fixes both weight and leakage in place.
**Result:** ❌ as the *answer to this issue*, though possibly still wanted for the leakage (see open questions)
**Learned:** Force-pushing a public repo with a Pages deploy and submodule pointers in a parent tree is a high-blast-radius operation. Even after a purge, the corpus would still be sitting next to the plugin. The two problems are separate and should be decided separately.

### H4 — Split into two repos: a lean kit and the corpus ✅ (proposed)

**Reasoning:** Each audience gets a repo shaped for it. The kit starts with **fresh history**, so nothing that was ever in the corpus can reach a plugin installer. The corpus repo keeps its history, splash, Pages deploy, and CI unchanged.
**Result:** Proposed, pending the decisions below.

This is the "lean sibling repo" the MVP spec deferred to tier 2. It is promoted to a **precondition of the MVP's distribution step**, because once a marketplace URL is published, moving it means breaking adopters.

## Root cause

One repo was asked to be three things: the public face of the practice, the plugin distribution source, and the internal cross-project corpus. The corpus had to be committed so Pages CI could build it. That made the repo heavy and turned every `include: true` in `sources.md` into a publication decision. The plugin spec inherited that coupling instead of questioning it.

## Proposed fix: the split

### Repo 1: the kit (public, lean, fresh history)

Everything an installer receives. Nothing in it may come from `corpus/`.

```
context-vigilance-kit/            ← (name: see decision D1)
├── .claude-plugin/marketplace.json
├── plugin/
│   ├── core/
│   │   ├── skills/               ← context-vigilance (+ pseudomonorepos) after the portability pass
│   │   ├── commands/             ← init, new, kickoff, prep, implement
│   │   └── templates/            ← every doc-type, incl. the missing plan.md
│   └── harnesses/claude-code/
├── starters/                     ← what /cv:init lays down: the folder skeleton, context-v/README.md,
│                                    the .gitignore line, the AGENTS.md / CLAUDE.md snippet
├── examples/                     ← NEUTRAL: a fictional project walked through one
│                                    exploration → spec → plan → shipped arc. Synthetic, never
│                                    derived from real Lossless docs.
├── context-v/                    ← the kit's own specs (the plugin specs move here)
├── changelog/
└── README.md                     ← adopter-facing front door
```

**Examples are a reference, not part of the scaffold.** `/cv:init` writes `starters/` into an adopter's repo. `examples/` stays in the plugin for the agent (and the curious human) to read, and is never copied into the adopter's tree.

### Repo 2: the corpus (collaborators across projects)

Everything else, unchanged and with history intact: `corpus/`, `sources.md`, `corpus-manifest.md`, `skills-manifest.md`, every `scripts/` collator and ingester, `splash/` + `.github/workflows/pages.yml`, `.mcp.json`, Graphiti compose and requirements, and the corpus-facing `context-v/` docs (Chroma, Graphiti, frontmatter sweeps, handoffs).

### Where each existing `context-v/` doc goes

| Doc | Goes to |
|---|---|
| `specs/MVP-to-Claude-Code-Plugin.md` | kit |
| `specs/Commands-and-Agent-Skills-for-Context-V.md` | kit (it's the full command catalog; tier 2 references the corpus) |
| `explorations/Context-V-as-a-Claude-Code-Plugin.md` | kit |
| `specs/Systematizing-Chroma-as-Loading-Mechanism-for-Context-v.md` | corpus |
| `explorations/Graphiti-Over-The-Lossless-Corpus.md`, `explorations/Code-Comments-Sections-as-Context-V.md` | corpus |
| `plans/Tidy-Context-Vigilance-Files-Across-All.md`, `handoffs/*`, `reminders/Chroma-and-Graphiti-Gotchas.md`, `blueprints/Sweep-for-Frontmatter-Consistency-&-Improvements.md` | corpus |
| `blueprints/Browser-Drive-Verification-For-Agent-Sessions.md` | corpus for now (Lossless-tree rollout draft) |
| this issue | kit |

### Seams that cross the split

- **`build-corpus-manifest.py`** is generic tree-walking logic. A generalized descendant (`/cv:scan`, `/cv:status`) belongs in the kit at tier 1, written fresh against the kit's needs. Copied, not moved; the corpus keeps its own.
- **Tier 2 (`/cv:init chroma`)** lives in the kit as an *optional* path and must not require the corpus repo. Our corpus is one instance of what that tier produces, not a dependency of it.
- **The skills** stay sourced from `lossless-agent-skills`. The kit vendors portability-passed copies, so a vendoring/sync step is needed (the spec already plans one).

## Decisions needed before executing

- **D1. Which repo keeps the name `context-vigilance-kit`?**
  - **(a)** Rename the current repo to something like `context-vigilance-corpus` and create a fresh `context-vigilance-kit`. *Lean.* The good name goes to the public-facing thing. GitHub redirects git URLs after a rename, but **the Pages URL `lossless-group.github.io/context-vigilance-kit/` does not redirect**, so the splash moves.
  - **(b)** Keep the current repo as-is and create a new kit repo under a new name (e.g. `context-v`, `cv-plugin`). Nothing existing moves, but the kit's name is weaker.
- **D2. Corpus repo visibility.** The corpus exists for multi-project collaborators. Should it go **private**? The public splash could stay as a curated subset or move elsewhere. A private repo would also contain any leaked history without a force-push.
- **D3. Purge the leaked history or not.** This is independent of the split. If the corpus stays public, the objects from `8c9aaa5` and `c1ab105` remain reachable. Confirm the credential behind the leaked identifier has been **rotated** regardless.
- **D4. Starter scope.** Should `starters/` also lay down `changelog/`, or stay strictly `context-v/`? This ties to the MVP spec's open question about bundling `changelog-conventions`.
- **D5. Local layout under `ai-labs/`.** Mount the new kit as a second submodule beside the corpus. If D1(a) renames the existing repo, also decide whether its local path changes. **Changing it is a repo relocation and triggers the pseudomonorepos HARD STOP checklist**, with one acknowledgment per precondition.

### Decided 2026-10-01

- **D1 → (a), renamed `context-v-corpus`.** This repo keeps its history and becomes the corpus. A fresh repo takes the name `context-vigilance-kit` for the public kit.
- **D5 → the corpus moves to the anchor root** at `lossless-monorepo/context-v-corpus/`. It walks the whole tree, so it belongs at the root and not under `ai-labs/`. The new kit mounts at `ai-labs/context-vigilance-kit/`. The relocation preconditions were checked first (Linux copy clean; the operator confirmed anything gitignored on the Mac is recoverable).
- **Ordering constraint.** After the rename, GitHub redirects the old URL to `context-v-corpus` only until a new repo claims `context-vigilance-kit`. Every clone must be re-pointed (submodule entries, the Mac working copy's `origin`) **before** the new kit repo is created. Otherwise a stale clone silently fetches an unrelated repo.
- **D2 → the corpus stays public for now.** Private was the intent, but the website's splash pulls from public repos, and reworking that isn't worth it yet. Revisit when the splash's data path changes.
- **D3 → the operator rewrites the history.** On the Mac: delete the GitHub repo, drop the offending commits locally, and recreate `context-v-corpus` with the clean history under the same name.
- **D4 → `/cv:init` offers `changelog/` as an option** in the starter scaffold. To be folded into the MVP spec amendment.

### Progress (2026-10-01)

- [x] Issue committed in the old repo (`8fe376b`).
- [x] GitHub repo renamed `context-vigilance-kit` → `context-v-corpus`. Its functional references were updated: Pages base path, repo links, Chroma data-dir, collator exclusions (`23207ed`). The splash now serves at `lossless-group.github.io/context-v-corpus/`.
- [x] Corpus mounted at the anchor root and removed from `ai-labs` (anchor `2296a13a`, ai-labs `02200bc`). Anchor `AGENTS.md`, `ai-labs/CLAUDE.md`, `ai-labs/README.md`, and all three `.mcp.json` files point at the new path.
- [x] New kit initialized at `ai-labs/context-vigilance-kit/` with fresh history. The three plugin docs and this issue were copied in, and the corpus keeps their history.
- [x] `context-vigilance-kit` created on GitHub (public, default `master`). All three tier branches were pushed at once, so a stray push from a stale clone is rejected rather than landing corpus history here. The operator chose to go ahead before re-pointing the Mac clone.
- [x] Mounted as the `ai-labs/context-vigilance-kit` submodule, tracking `development`.
- [ ] **Mac working copy (when available):** its old checkout at `ai-labs/context-vigilance-kit` still has `origin` = the old URL, which now resolves to *this* repo. Re-point it with `git remote set-url origin https://github.com/lossless-group/context-v-corpus.git`. Then move its gitignored state (`.env`, `splash/.env`, `.chroma/`, `.graphiti-state/`) into a fresh `context-v-corpus/` checkout at the anchor root, and move the old checkout and its `.git/modules/ai-labs/modules/context-vigilance-kit` gitdir aside before pulling `ai-labs`.
- [ ] Amend [[MVP-to-Claude-Code-Plugin]] so its directory contract and clone-weight paragraph reflect the split.
- [ ] Follow-up outside this repo: `ai-labs/dididecks-ai/CLAUDE.md` still names `ai-labs/context-vigilance-kit/scripts/` as the ingest path.

## Execution order (once decided)

1. Settle D1–D5 and record them in a `decisions/` entry.
2. Create the kit repo with fresh history: `README.md`, `context-v/`, `changelog/`, and this issue.
3. Move the three plugin docs (and this issue) into the kit. Leave a one-line pointer behind in the corpus repo.
4. Amend [[MVP-to-Claude-Code-Plugin]]: replace the *Clone-weight tradeoff* paragraph with a link to this issue, and point the directory contract and marketplace commands at the kit repo.
5. Add the kit as a submodule of `ai-labs` and bump the parent pointer.
6. Resume the MVP implementation slice in the kit, from step 2 (scaffold `plugin/`).

## Prevention

- **Rule for the kit repo: nothing generated from real Lossless content is ever committed there.** Examples are synthetic, and vendored skills pass the portability pass first. Candidate for a `contracts/` entry in the kit once it exists.
- **Measure before accepting a "tradeoff."** The spec called clone weight acceptable without measuring it. The measurement showed the cost was history, not size, and that reframed the whole decision.

## Related

- [[MVP-to-Claude-Code-Plugin]]: the spec whose distribution step this blocks
- [[Context-V-as-a-Claude-Code-Plugin]]: the status-layer exploration; its `cv status` tooling lands in the kit
- [[Commands-and-Agent-Skills-for-Context-V]]: the full command catalog
- [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-v]]: tier 2, which stays independent of our corpus
- [[pseudomonorepos]]: the relocation preconditions that apply to D5

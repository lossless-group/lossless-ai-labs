---
title: "MVP: context-v as a Claude Code Plugin"
lede: "The fastest path to a true kit is not the Chroma memory system the June specs planned — it's a plugin: the context-vigilance skill we already wrote, a scaffolder, and doc templates, packaged so `/plugin install` is the whole onboarding. Chroma becomes an upgrade an adopter grows into, invoked as `/cv:init chroma` only when their tree earns it."
date_authored_initial_draft: 2026-07-21
date_authored_current_draft: 2026-08-02
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-08-02
at_semantic_version: 0.0.0.5
status: Draft
augmented_with: Claude Code (Fable 5)
category: Specification
tags:
  - Context-Vigilance
  - Claude-Code
  - Plugin
  - Agent-Harness
  - Agent-Skills
  - Slash-Commands
  - MVP
authors:
  - Michael Staton
date_created: 2026-07-21
date_modified: 2026-08-02
publish: true
from: "context-vigilance-kit"
from_path: "context-v/specs/MVP-to-Claude-Code-Plugin.md"
---
# MVP: context-v as a Claude Code Plugin

## Audience

Anyone who wants to adopt the context-vigilance practice with nothing but an agent harness and a git repo — starting with the first outside collaborator, who reaches us through two public repos and should not need our private skills tree, our symlink farm, or our Chroma corpus to get value on day one. Also: future-us, deciding what belongs in the MVP versus the tiers above it.

## Purpose — and what this reframes

The two June specs — [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-v]] and [[Commands-and-Agent-Skills-for-Context-V]] — planned the kit's agent surface Chroma-first: session-start hooks, incremental ingest, nudge policies, a `cv-init` ceremony that writes config, manifests, and hook wrappers. Every item is still marked **Planned**. This spec inverts the build order rather than replacing those specs: they become the **tier-2 contract** (the "your tree got big" upgrade), and the MVP becomes a plugin whose value chain has zero infrastructure links in it.

The reasoning is a dependency-chain argument. The specced loops (kickoff retrieval, catch-up digests) only pay off against a *populated* corpus — which needs ingesters, which need manifests and config, which need a ceremony, which needs Python + uv + an embedding model download. A fresh adopter has an empty corpus; every link in that chain is friction with no payoff. Meanwhile the thing that actually carries the practice — the [[context-vigilance]] skill, its decision tree, templates, and frontmatter discipline — is finished and battle-tested, but trapped in the private anchor's skills submodule where no outside adopter can reach it.

And there is a first-hand confirmation: we built the Chroma tier for ourselves and *haven't been using it*. If the authors aren't using it, it is not day-one material for anyone.

## Philosophy — load-bearing tenets

- **Install is the onboarding.** One `/plugin install` (or marketplace add) delivers the practice. No clone-and-symlink, no Python environment, no ceremony with questions.
- **The skill is the product; the tooling is packaging.** The IP is the practice encoded in [[context-vigilance]]. Everything else in the MVP exists to put that skill into an adopter's harness and scaffold their first `context-v/`.
- **Zero-infrastructure default; infrastructure by explicit invocation.** Nothing in the MVP requires a vector DB, a hook, a config file, or a background process. Chroma is reached only by asking for it, later, by name.
- **Don't assume our vocabulary.** Adopters will not know the term "pseudomonorepo," but their *agent* should — bundle the [[pseudomonorepos]] skill so Claude can recognize and navigate multi-repo trees on the adopter's behalf, without the adopter learning the concept first.
- **Harness-neutral core, harness-specific adapters.** Claude Code is the first harness, not the only one. Adding a second harness should mean adding a folder (or a config file), not restructuring content.

## Hard constraints

- `/cv:init` performs **no Chroma work and asks no Chroma questions**. The vector-DB tier is reached only by an explicit later invocation (see *The Chroma seam* below).
- No changes to the kit's existing corpus machinery (`sources.md`, collators, manifests, ingesters, splash). The plugin is additive, in its own directory.
- No linter / validator in the MVP. "Norms, not rules" is the ethos; `cv lint` stays indefinitely deferred.
- Skills vendored into the plugin must pass a **portability pass** — no Lossless absolute paths, no references to private repos, no Lossless-only assumptions presented as universal.
- The June specs are not deleted or rewritten by this spec; they are re-tiered (see *Relationship to the June specs*).

## The plugin shape — directory contract

```
context-vigilance-kit/
├── .claude-plugin/
│   └── marketplace.json              ← marketplace entry; its `source` points at plugin/harnesses/claude-code
│                                       (subdirectory sources are confirmed supported)
└── plugin/
    ├── core/                         ← harness-neutral source of truth
    │   ├── skills/
    │   │   ├── context-vigilance/    ← vendored from the private skills tree (portability pass applied)
    │   │   └── pseudomonorepos/      ← vendored likewise (portability pass REQUIRED — see below)
    │   ├── commands/                 ← harness-neutral command prose (markdown)
    │   │   ├── init.md
    │   │   ├── new.md
    │   │   ├── kickoff.md
    │   │   ├── prep.md
    │   │   └── implement.md
    │   └── templates/                ← spec / plan / prompt / blueprint / reminder / exploration / issue
    └── harnesses/
        ├── claude-code/              ← the first adapter: a valid Claude Code plugin directory
        │   ├── .claude-plugin/plugin.json   ← name: "cv" (the command namespace)
        │   ├── skills/               ← projected (or symlinked) from core/skills
        │   └── commands/             ← projected (or symlinked) from core/commands
        └── <future-harness>/         ← adding a harness = adding a folder here
```

**Projection mechanics.** Content is authored once in `core/`. The Claude Code adapter is populated from core by relative symlinks (git supports them; least moving parts) with a tiny `scripts/build-plugin.py` projection script as the fallback if the plugin loader turns out not to follow symlinks. **Verification gap to close before shipping:** confirm whether Claude Code's plugin loader resolves symlinked `skills/` and `commands/` dirs; if not, the projection script becomes the mechanism and CI (or a pre-commit hook) keeps the adapter in sync with core.

**Why adapter folders and not "Claude Code layout is the core."** Harnesses disagree about manifest formats and directory names, but they increasingly agree about the *content*: markdown skills and markdown commands. Keeping core harness-neutral means a future `harnesses/opencode/` or `harnesses/codex/` is a manifest plus a projection mapping — a folder and a config file, exactly the extensibility bar this spec sets. We do **not** build a second adapter in the MVP; we only refuse to make the first one load-bearing for the content.

**Clone-weight tradeoff (accepted for MVP).** Plugins install by cloning the repo, and this repo carries a committed `corpus/` of Lossless content plus large manifests. Accepted for the MVP because it keeps one public repo and zero migration work. If clone weight or corpus-content leakage becomes a real complaint, the escape hatch is a lean sibling repo that vendors only `plugin/` — noted as a tier-2 decision, not taken now.

## Command surface — tier model

**Namespacing (decided, verified against docs 2026-07-21).** Claude Code plugin commands are *always* invoked as `/<plugin-name>:<command>` — the colon is the namespace separator, and no un-namespaced short form exists for plugin commands (that form is reserved for standalone `.claude/commands/`). The plugin is therefore named **`cv`**, with command files `init.md`, `new.md`, `kickoff.md`, `prep.md`, `implement.md`, yielding `/cv:init`, `/cv:new`, `/cv:kickoff`, `/cv:prep`, `/cv:implement`. Reference: code.claude.com/docs/en/plugins.md.

### Tier 0 — the MVP

| Command | Signature | Behavior |
|---|---|---|
| `/cv:init` | no args | Scaffold `context-v/` at the repo root: the eight canonical folders + `extra/` + `sitemap/`; append `context-v/extra/` to `.gitignore`; drop a short `context-v/README.md` orienting a cold reader; `.gitkeep` in each empty folder so the scaffold commits. Offer (don't force) a CLAUDE.md / AGENTS.md snippet pointing the agent at the practice. **No questions asked. No Chroma. No config files.** |
| `/cv:new` | `<type> "<Title>"` | Create a doc from the matching `core/templates/` template: Train-Case filename, frontmatter filled (title, today's dates, author from git config, `semantic_version: 0.0.0.1`, `status: Draft`). Types: spec, plan, prompt, blueprint, reminder, exploration, issue. |
| `/cv:kickoff` | no args | The session-start loading conversation, **dir-scan-backed**: ask for known-relevant context-v files; on "help me find," Glob/Grep the local `context-v/` (and, via the bundled [[pseudomonorepos]] skill, any child repos' `context-v/` dirs); present the three-bucket triage (hard include / have on hand / ignore) from the June spec — that conversational shape is kept verbatim, only the retrieval backend changes. Manual invocation only; no auto-fire, no nudge machinery. |
| `/cv:prep` | `[<file>]` | **Role: senior product manager.** Guide the **explore → spec → plan (→ prompt)** arc — see *The prep arc* below. With a file: assess which rung the doc sits on and drive its promotion to the next one. Without: survey `context-v/` for arc-ready docs (explorations mature enough to spec, specs whose phases want extraction into plans) and propose the next move. |
| `/cv:implement` | `<@context-v/.../spec-or-plan.md>` | **Role: lead engineer.** Execute a signed-off spec or plan in a loop — implement, verify against the doc's acceptance criteria, iterate — until the criteria are satisfied or a genuine blocker surfaces. See *`/cv:implement` — the execution loop* below. |

### The prep arc — what `/cv:prep` guides

The most-used real-world rhythm of the practice is **explore → spec → plan**: work starts as one or more explorations; an exploration that has learned enough gets *adapted* into a spec; the spec proposes phases or steps that are proto-plans; plans get written at the altitude an agent harness natively understands (Claude Code plan-mode output belongs in `context-v/plans/` — that is exactly why `plans/` was promoted to canon). The [[context-vigilance]] skill already names the modes; `/cv:prep` is the tooling that walks a doc across them.

**Role framing: `/cv:prep` puts the agent in the role of senior product manager.** The PM asks *why*, scopes, challenges vagueness, insists every promotion carries explicit acceptance criteria forward, and gates the spec sign-off — and **does not write implementation code**. Code is the other role's job (see the execution loop below). The role boundary is what keeps prep sessions from collapsing into premature implementation. Per-rung semantics:

- **Exploration → spec.** Promotion is an *adaptation*, not a move: `/cv:new spec` from the template, carry over what the exploration settled, link back with `[[wikilink]]`, and close the exploration honestly (the skill's own definition — an exploration "ends when you've learned enough to write a spec"). Follows the `developing-a-spec` rhythm from the skill's references: stub-first, discuss-then-write, sign-off gate before implementation.
- **Spec → plan.** Extract the spec's phases/steps into a sequenced `plans/` doc that references the spec. When the harness has a native plan mode, `/cv:prep` is the landing pad: plan-mode output gets written into `context-v/plans/` with conforming frontmatter instead of evaporating at session end.
- **Plan → prompt** (optional rung). For work that will be executed in verifiable chunks across sessions, per the existing prompts discipline.

Every promotion cross-links parent and child, bumps the source doc's `status` per the status discipline, and **never deletes the upstream doc** — the arc is a chain of artifacts, not a pipeline that consumes them. `/cv:prep` and `/cv:kickoff` stay distinct surfaces: kickoff loads context into a session; prep advances a document up the altitude ladder. Don't fold one into the other.

### `/cv:implement` — the execution loop

**Role: lead engineer.** Where `/cv:prep` ends (a signed-off spec or plan with acceptance criteria), `/cv:implement <@context-v/.../spec-or-plan.md>` begins. The role handoff *is* the arc's payoff: the PM produced the artifact; the engineer consumes it without re-litigating the why.

The loop:

1. **Load the target doc in full**, plus whatever it wikilinks as load-bearing (the spec it implements, the blueprints it must respect).
2. **Gate on acceptance criteria.** If the doc has none — no acceptance-criteria section, no verifiable Outcome, no per-phase done-conditions — **stop and bounce back to `/cv:prep`** to add them. Implementing against an unverifiable doc is the anti-pattern this command exists to prevent ("a prompt without a spec is a vibe" — same logic, one rung down).
3. **Mark the doc `status: Implementing`** (per the status discipline; this is a meaningful edit — bump `date_modified`).
4. **Implement → verify → iterate.** Work the doc's phases/steps in order; after each, verify against its stated criteria by *exercising the behavior* (build, run, test — not just "the code exists"). Loop until every criterion is satisfied or a genuine blocker surfaces.
5. **Close honestly.** All criteria met → `status: Shipped` + `date_first_published`. Stopping early → `status: Partially-Shipped` + a `## Remaining work (as of date)` section enumerating what's done and what's left. Blocked → report the blocker; never mark shipped on hope.

The loop stays inside the target doc's scope — scope changes discovered mid-implementation go back through `/cv:prep` (the PM role), not silently absorbed by the engineer. In harnesses with a native loop-runner (Claude Code's `/loop`), `implement.md` is written so the runner can drive iteration; the command itself does not depend on one.

### Tier 1 — pseudomonorepo-aware usage (spec'd here, built after MVP proves out)

| Command | Signature | Behavior |
|---|---|---|
| `/cv:scan` | `[--root <path>]` | Walk the tree from the root, find every `context-v/` directory (and candidate legacy dirs), report the shape. The adopter-facing descendant of `assemble-context-v-sources.py`, minus `sources.md` curation. This is where the pseudomonorepos concept becomes *operational* for adopters rather than just ambient in the agent. |
| `/cv:init --child` | `[path]` | Scaffold a `context-v/` in a child repo, cross-linking parent and child per the pseudomonorepos discipline. |

### Tier 2 — the Chroma seam

The entire surface of [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-v]] and the Planned items of [[Commands-and-Agent-Skills-for-Context-V]] live behind one explicit gate:

```
/cv:init chroma
```

**Decision: subcommand, not a question.** The alternative considered was an interactive question inside `/cv:init` ("set up vector search? y/N"). Rejected: a question is friction paid by *every* adopter at the moment of least commitment, to serve the few who are ready for it. A named subcommand costs nothing until wanted, is discoverable in help text, and reads as what it is — an upgrade. The name is `chroma` rather than `vector-db` because concrete beats generic while there is exactly one implementation; if a second backend ever exists, `vector-db --provider <name>` can supersede it, and `chroma` remains an alias.

What `/cv:init chroma` will do is exactly the June specs' `cv-init` ceremony (config.json, manifests, SessionStart hook, incremental-ingest patches) — unchanged in content, changed only in *when it happens*: after the adopter's corpus is big enough that dir-scan hurts. The [[search-lossless-corpus]]-shaped Q&A skill and the auto-firing kickoff/catch-up loops also live at this tier, since they are only meaningful against a populated collection.

## Bundled skills

| Skill | Why it ships by default | Portability pass |
|---|---|---|
| `context-vigilance` | The practice itself — folder roles, frontmatter, versioning, status discipline, templates. The reason the plugin exists. | Light: strip Lossless-internal references (`~/.pi/agent/AGENTS.md` drift-policy pointer, lossless.group URLs kept only as attribution), keep templates and references intact. |
| `pseudomonorepos` | Adopters won't know the term; their agent should carry the concept — recognizing multi-repo trees, search-first-before-creating, where a `context-v/` belongs at each level. This is what makes `/cv:kickoff` and (later) `/cv:scan` work beyond a single flat repo. | **Heavy — required before shipping.** The current skill embeds Lossless-specific machinery: the HARD STOP relocation protocol with our incident dates, `the-tree.md` (our tree's living state), our branch-tier model, absolute paths. The vendored copy keeps the *concepts* (tree shapes, context roll-up, search-first, relocation risk in generic form) and drops the Lossless instance data. |

Candidate third skill, deliberately **not** in the MVP: `changelog-conventions`. It pairs naturally with the practice but widens the surface; revisit after the first adopter's feedback (open question below).

## Relationship to the June specs

- [[Commands-and-Agent-Skills-for-Context-V]] remains the catalog of the *full* surface; this spec implements roughly its smallest slice and re-homes the rest at tier 2. Its `cv-dismiss` / `cv-undismiss` / `cv-config` family, the `/catch-up` flag matrix, and the SessionStart hook all move behind `/cv:init chroma`.
- [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-v]] remains the tier-2 system contract in full. Its three-bucket kickoff triage is adopted *now* (dir-scan-backed) — the conversational design survives the deferral of its retrieval backend.
- Neither spec's status is changed by this document alone; when this spec is signed off, both should get a status note recording the re-tiering (a `decisions/` entry is the natural artifact for that moment).

## What stays exactly as it is

- All existing kit machinery: `sources.md`, the collators, both manifests, `corpus/`, the splash, the ingesters, `.mcp.json`, `.chroma/`. Untouched, un-moved.
- The private skills tree and `sync-skills-symlinks.sh` for our own use — vendoring into `plugin/core/` is a copy with a portability pass, not a relocation.
- The privacy posture on session/trace ingestion (opt-in, manual, never part of any init path).
- The context-v folder taxonomy — the plugin scaffolds it; it does not reinterpret it.

## Distribution — install path and official listing

Verified against code.claude.com/docs/en/discover-plugins.md and plugins-reference.md, 2026-07-21. Three rungs, climbed in order:

1. **Self-published (day one).** The kit repo carries `.claude-plugin/marketplace.json` whose entry's `source` points at `plugin/harnesses/claude-code/` (subdirectory sources are supported). Adopters run:
   ```
   /plugin marketplace add lossless-group/context-vigilance-kit
   /plugin install cv@context-vigilance-kit
   ```
   Git URLs, local paths, and remote `marketplace.json` URLs also work as marketplace sources — useful for the collaborator testing from a fork.
2. **Community marketplace.** Submit to `anthropics/claude-plugins-community` (users add it manually). Broader discoverability, low bar.
3. **Official Anthropic-curated marketplace** (`claude-plugins-official` — auto-registered in every Claude Code install, so listing here *is* "being an official plugin"). Individual authors submit via `platform.claude.com/plugins/submit`. Run `claude plugin validate` before submitting — the review pipeline runs the same check.

Rung 1 is an MVP deliverable; rungs 2–3 gate on the dogfood + first-adopter acceptance tests passing, since a directory listing is a publish event.

## Implementation slice

Each step reviewable before the next lands:

1. **Check the collaborator's output first.** He has been exploring exactly this plugin-ization with his own Claude Code instance; converge with what he produced rather than forking (origin: 2026-07-21 onboarding thread).
2. **Scaffold `plugin/core/` + `plugin/harnesses/claude-code/`** with `plugin.json` (name: `cv`) and the symlink projection; write `.claude-plugin/marketplace.json` at the kit root with its `source` pointing at the adapter subdirectory.
3. **Portability pass + vendor `context-vigilance`** into `core/skills/` (templates come with it).
4. **Portability pass + vendor `pseudomonorepos`** — the heavy pass; produces the generic-concepts variant.
5. **Author the five tier-0 commands** (`init.md`, `new.md`, `kickoff.md`, `prep.md`, `implement.md`) in `core/commands/`. `prep.md` encodes the arc semantics and the PM role, leaning on the vendored skill's `developing-a-spec` reference rather than restating it; `implement.md` encodes the engineer role, the acceptance-criteria gate, and the loop.
6. **Resolve the symlink verification gap** — test `/plugin install` from a scratch clone on a machine without the private tree; if the loader won't follow symlinks, add `scripts/build-plugin.py` and wire it as a pre-commit projection.
7. **Dogfood on a fresh throwaway repo**: install, `/cv:init`, `/cv:new exploration "Test"`, `/cv:prep` it into a spec and a plan with acceptance criteria, `/cv:implement` the plan to Shipped, and `/cv:kickoff` a follow-up session. The whole path must work with no Python and no Chroma present.
8. **Hand it to the collaborator** — his install-from-cold is the real acceptance test.

## Open questions

- **Scaffold weight.** Eight canonical folders on day one, or a starter subset with the rest documented? Current lean: all eight + `extra/` + `sitemap/` — empty folders are cheap, and the scaffold teaching the full taxonomy is part of the value. Revisit if the first adopter reports it as noise.
- **`changelog-conventions` as a third bundled skill** — pairs well, widens surface. Decide after first-adopter feedback.
- **Lean sibling repo** if clone weight of the corpus-carrying kit becomes a real adopter complaint (tier-2 decision).

## Anti-patterns this spec forbids

- **Any Chroma touchpoint in `/cv:init`** — no question, no config stub, no "we noticed you don't have a vector DB" nudge. The seam is `/cv:init chroma`, full stop.
- **Editing `plugin/harnesses/*/` content directly.** Core is the source of truth; adapters are projections.
- **Vendoring skills without the portability pass** — shipping our absolute paths, incident history, or private-repo references to adopters.
- **Building a second harness adapter speculatively.** The abstraction earns its keep by *existing*, not by being exercised before a real second harness shows up.
- **A linter.** Norms, not rules.

## Related

- [[Commands-and-Agent-Skills-for-Context-V]] — the full surface catalog; this spec implements its smallest slice and re-tiers the rest.
- [[Systematizing-Chroma-as-Loading-Mechanism-for-Context-v]] — the tier-2 system contract behind `/cv:init chroma`.
- [[Collate-Context-Files-into-Context-Vigilance-as-Repo-&-Project]] — the founding exploration; its Track 4 ("open spec & tooling") is what this spec finally starts building, by packaging rather than by specification-writing.
- [[context-vigilance]] — the practice skill; the plugin's payload.
- [[pseudomonorepos]] — the tree-shape skill; bundled so the agent carries the concept adopters won't know.
- **OpenSpec** and **Spec-Kit** — the prior-art plugin shapes: skills + commands + templates, installed in one step; the model this MVP follows.
- **[spec-workflow-mcp](https://github.com/Pimzino/spec-workflow-mcp)** (`Pimzino/spec-workflow-mcp`, GPL-3.0, 4.3k★) — the same spec-driven-development prior art as OpenSpec/Spec-Kit, but delivered as an **MCP server** (+ web dashboard on :5000, + VSCode extension) rather than a plugin, and worth reading against this spec on three specific seams:
  - **The arc-as-explicit-artifacts.** It hard-codes a Requirements → Design → Tasks sequence with **approval gates** and **task progress tracking** — a near-exact analog to our `/cv:prep` (explore → spec → plan) sign-off gate and `/cv:implement` execution loop. Concrete prior art for what the prep sign-off and the implement loop look like when made first-class, and for the on-disk shape (it lands artifacts in a `.spec-workflow/` dir: `specs/`, `design/`, `tasks/`, `approvals/`) — directly comparable to our `context-v/` taxonomy.
  - **The dashboard we don't have yet.** Its real-time spec/task dashboard is exactly the surface our kit lacks — today we only emit markdown manifests (`corpus-manifest.md`, `skills-manifest.md`). A plausible tier-2 / splash-adjacent idea, and a working reference for it.
  - **Plugin-vs-MCP build shape.** It's the counterfactual to this spec's core bet: it chose an MCP server (a running process, a port, a dashboard) where we chose a zero-infrastructure plugin. Reading *why* it went MCP-first sharpens our own "plugin now, `/cv:init chroma` MCP seam later" tiering.
  - **Caveat: GPL-3.0.** Unlike the permissive OpenSpec/Spec-Kit we model on, this is copyleft — fine to *study*, but a real constraint if any code (not just ideas) were ever vendored. Read for patterns, not for lifting.

## Outcome

*(Open. Update as implementation steps land. Mark `status: Final` when one external adopter — starting from a cold clone, with no Python environment and no access to the private tree — installs the plugin, runs `/cv:init` and `/cv:new`, and produces a convention-conforming context-v doc without human assistance from us.)*

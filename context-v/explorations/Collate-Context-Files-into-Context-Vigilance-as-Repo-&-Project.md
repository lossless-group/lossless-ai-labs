---
title: "Collate Context Files into Context Vigilance as Repo & Project"
lede: "A long-running, everywhere-distributed practice — context-v/ across a tree of pseudomonorepos — finally graduates into a project of its own, with a collator, a splash, and a vector index."
date_created: 2026-05-07
date_modified: 2026-05-07
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.2.0
tags:
  - Exploration
  - Context-Vigilance
  - Context-Engineering
  - ChromaDB
  - Vector-Database
  - Splash-Pages
  - Pseudomonorepos
  - Content-Rollup
status: Open
---

# Collate Context Files into Context Vigilance as Repo & Project

## What this is, in one paragraph

For roughly 1.5 years we have been practicing **Context Vigilance** — our term for the discipline of treating the context handed to AI collaborators with the same rigor as code — across every project in the [[lossless-monorepo]] tree. The practice produced a forest of `context-v/` directories: at the root pseudomonorepo, at each child pseudomonorepo (`ai-labs`, `astro-knots`, `content-farm`, `tidyverse`, `lfm`), inside individual children's submodules, and inside studies. The practice exists; what does **not** exist is a single project that *aggregates* it, presents it to the world, and turns it into a substrate that agents can query semantically. This exploration scopes that project.

The work has three intents, treated as parallel tracks rather than a strict sequence:

1. **Collate.** Build a process that pulls from every `context-v/` directory across the tree — local filesystem first, GitHub Content API as the remote fallback — and merges the result into one canonical content set with provenance preserved.
2. **Splash.** Stand up a splash page for the project using the [[maintain-splash-pages]] skill, so the practice has a public face the way our other "important" repos do.
3. **Index.** Kick off a [[ChromaDB]] integration so the collated content becomes a vector store. This is our first deliberate ChromaDB project; one of the goals is to learn ChromaDB by using it on something we already understand deeply.
4. **Open spec & tooling.** Codify the `context-v/` directory pattern as a publishable open specification — file-format conventions, frontmatter contract, naming rules, the six-folder taxonomy, the cognitive-mode framing — accompanied by reference tooling (validator, scaffolder, collator) so other teams can adopt the practice without reverse-engineering it from our repos. Informed primarily by the [[open-specs-and-standards]] study, secondarily by [[memory-layers-for-agents]].

## Why we don't already know the answer

A few things make this genuinely non-obvious rather than a "just do it":

- **~~Where does the project live?~~ Resolved 2026-05-07: `ai-labs/`.** Even though Context Vigilance is a practice that applies to every project everywhere — not just to AI work, and not just inside [[lossless-monorepo]] — the project itself lives as a child of [[ai-labs]]. The reasoning: `ai-labs` is our pseudomonorepo for *AI experiments graduating into real products*, in the convention of companies that have a team figuring things out. Context Vigilance, the *project*, is one of those experiments-becoming-a-product. The collator's reach *up* into `lossless-monorepo/` and across siblings is a feature of what it does, not a constraint on where it sits. Original options weighed below for posterity:
  - Child of [[ai-labs]] **— chosen**.
  - Sibling of `ai-labs` directly under `lossless-monorepo` (peer pseudomonorepo) — rejected because the project is still in lab phase, not graduated.
  - Its own top-level repo outside any pseudomonorepo — rejected for the same reason; premature.
- **Push vs. pull.** Should each `context-v/` host *push* to the collator, or should the collator *pull* on a schedule / at build time? The pseudomonorepo skill's `references/content-rollup.md` argues for pull via the GitHub Content API at build time. That argument was made for splash pages rolling up `changelog/` and `context-v/` from submodules. Whether it generalizes to *every* `context-v/` in the tree is the open question.
- **What counts as "the corpus"?** Specs, prompts, blueprints, reminders, explorations, and issues all live in `context-v/`. Some are short and dense (reminders); some are long and narrative (explorations, issues). Some are aspirationally public; some are scratch. A naive "vectorize everything" run will pollute the index. We need a curation rule.
- **Vector DB choice is mostly settled, but not entirely.** ChromaDB is the explicit ask here, and the [[ChromaDB]] note already lives at `content/tooling/Software Development/Databases/ChromaDB.md`. But [[Qdrant]], [[LanceDB]], [[Weaviate]], [[Pinecone]], [[Milvus]] all have notes in the same directory — meaning we have already evaluated, however lightly, the alternatives. Worth surfacing why ChromaDB wins for *this* job and not another, so the decision is durable.
- **Relationship to the [[memory-layers-for-agents]] study.** That study was pinned precisely to inform decisions like this one. Before deep-designing, we should re-read what we put there.

## Why this is overdue

The honest version: every conversation across the tree currently starts with the agent walking up directories, grepping for prior work, surfacing what it finds, and asking the user to weigh which to extend. That is what the [[pseudomonorepos]] skill explicitly prescribes — "search prior work at every level's `context-v/`" — and it works. But it is **O(n) on every invocation** where n is the size of the tree, and the tree only grows. A semantic index with provenance is the obvious next move; we just have not committed the time to it.

A second, less obvious driver: **we publish in public.** Almost every `context-v/` doc is destined for an [[Astro Knots]] site eventually. A collator that produces a unified content set is also the natural feedstock for the long-promised "Lossless Changelog" umbrella view at the org level — see the closing note in `references/content-rollup.md` of the pseudomonorepos skill.

## The four tracks

### Track 1 — Collate

**The question.** What is the right mechanism to pull from every `context-v/` directory in the tree into a single canonical store, while preserving provenance (which repo, which path, which branch, which commit)?

**Options under consideration:**

- **Option 1A — Filesystem walk.** A script that walks `~/code/lossless-monorepo/` for every `context-v/` directory and reads the markdown directly. Cheapest to prototype; works only on a machine that has all submodules checked out at the desired branches. Brittle to drift between collaborators' machines.
- **Option 1B — GitHub Content API at build time.** The mechanism the pseudomonorepos skill already prescribes for splash content-rollup. Authenticated requests against `/contents/context-v/` for each registered submodule, branch derived from `.gitmodules`. Handles the multi-machine problem; bounded by the 5000-req/hr authenticated rate limit. Requires the parent repo to *know* its full submodule list — which the root `.gitmodules` provides for direct children, but **does not** provide for nested submodules of submodules.
- **Option 1C — Hybrid.** Filesystem when running locally inside the tree; GitHub API when running in CI or remote. Same code path, different fetcher. Likely the right shape long-term, more code to maintain near-term.
- **Option 1D — Push from each child via webhook.** Each child repo emits a webhook on push to its tracked branch; the collator ingests. More moving parts, but the only option that gets near-real-time updates without polling.

**Tentative lean.** Start with **1A (filesystem walk)** for a working prototype this week, with a clean abstraction over "fetcher" so **1B (GitHub Content API)** can slot in without rewriting the collator. **1D** is over-engineered for the current cadence of `context-v/` writes (rare bursts, not a stream).

**Open sub-questions:**

- Does the collator preserve full markdown + frontmatter, or normalize to a single schema? Strong instinct: preserve full source, *additionally* emit a normalized index. Don't lose information at ingest.
- How are provenance and source path encoded? Probably as added frontmatter keys (`source_repo`, `source_path`, `source_branch`, `source_commit_sha`, `collated_at`) on a *copy* of the file, never on the original.
- Do we collate `changelog/` too, or only `context-v/`? They are sister artifacts in the [[pseudomonorepos]] universal-directories pattern. The "Lossless Changelog" umbrella ambition argues for collating both — possibly via the same collator, with a folder distinction in the destination.

### Track 2 — Splash

**The question.** What does the splash page for "Context Vigilance as Repo & Project" look like, and where does it live in the tree?

**What we know.** The [[maintain-splash-pages]] skill is canonical for the *how*. The relevant prompts that skill demands an answer to, before any code:

1. *Does this repo deserve a splash?* — **yes**. It will be shared outside the team (this is one of the more legible Lossless practices to external collaborators), it has — by definition — a non-trivial corpus to surface, and the question "where do I read about Context Vigilance?" already gets asked.
2. *Codified visual posture or creative?* — **getting creative**. The skill warns explicitly against the "same hero composition + recolored tokens" trap that bit the first three splashes. Context Vigilance is the *meta* project — the practice that all the other splashes share — so its splash should look unmistakably distinct from the per-repo splashes. Lean into typographic and layout *moves*, not palette swaps.

**Reference to walk before scaffolding:** the most recent splash is `lfm/splash/` per the maintain-splash-pages skill. Read it for structure, then deliberately diverge in shape.

**Open sub-questions:**

- **Where does the splash live?** `ai-labs/context-vigilance-kit/splash/`. Public-facing it points to **`contextvigilance.com`** (primary, no-hyphen for spoken/typed brand) with `context-vigilance.com` registered defensively and 301-redirected.
- **What is the *hero* of the splash?** The practice itself? The collated corpus? A live "what shipped this week across the tree" feed? Probably all three, layered.
- **Search via Pagefind or via ChromaDB?** Pagefind is the splash convention. ChromaDB is the third track of this exploration. They are not mutually exclusive — Pagefind for keyword search, ChromaDB for semantic. Worth shipping Pagefind first because it is on the well-trodden splash path.

### Track 3 — ChromaDB kickoff

**The question.** What is the smallest useful ChromaDB integration we can ship, and what does the path from "first index built" to "agents in the wild query it" look like?

**Why ChromaDB specifically.** From the existing [[ChromaDB]] note in `content/tooling/Software Development/Databases/`: it's local-first, Python-native, lightweight in dependencies, and pleasant to iterate on. For a first vector-DB project where the *learning* is the goal, ChromaDB's friction floor is the lowest of the candidates already evaluated ([[Qdrant]], [[LanceDB]], [[Weaviate]], [[Pinecone]], [[Milvus]]). We are not optimizing for production scale yet; we are optimizing for "play with it on Tuesday, have something working by Thursday."

**Smallest useful slice (proposed):**

1. Collate Track 1's output into a flat directory of markdown.
2. Chunk by section (`##` headings) — each chunk carries the parent file's frontmatter as metadata.
3. Embed with a small local model first (Ollama-served, since `ai-labs` already defaults to local AI per its README) — measure quality before reaching for OpenAI/Anthropic embeddings.
4. Persist in ChromaDB with metadata = `source_repo`, `source_path`, `doc_type` (spec/blueprint/etc.), `tags`.
5. Expose a CLI query: `cv-query "how do we handle frontmatter for explorations?"` → top-k chunks with provenance.

**Open sub-questions:**

- **Embedding model?** Local Ollama-served first (free, fast iteration). Re-evaluate against a hosted model once we have a query set to grade on.
- **Where does Chroma persist?** Local SQLite-backed for the first cut. Server mode if the splash needs live query.
- **How does it integrate with the splash?** v0: not at all — Chroma is a CLI/agent tool. v1: an API endpoint the splash hits. v2: in-page semantic search bar. Don't conflate the slices.
- **How does this connect to [[memory-layers-for-agents]]?** That study exists precisely to inform vector-DB and memory-architecture choices. It should be re-read before sealing any decision in this track. Possible outcome: the Chroma kickoff *becomes* the first concrete experiment that study was set up to enable.

### Track 4 — Open spec & tooling for others

**The question.** What would it take to publish "Context Vigilance" as an *open specification* that another team can adopt — a file-format and folder convention with a real validator, scaffolder, and (eventually) a registry — rather than as a Lossless-internal practice that lives only in our `context-v/` directories and skills?

**Why this is its own track.** Tracks 1–3 produce *our* tools acting on *our* corpus. Track 4 is what happens when we lift the convention out of our own tree and propose it to the world. The two questions are coupled — the spec should describe what the collator and the index actually consume — but they can move at different speeds. We can collate before we publish; we cannot publish coherently without first having collated.

**The studies do most of the heavy lifting.** Two studies in this directory are *exactly* on point. Both have their own `context-v/` — read those *first*, before walking the pinned upstream repos directly:

- **[[open-specs-and-standards]]** at `ai-labs/studies/open-specs-and-standards/`. The curated entry point is its own `context-v/profiles/` directory, which holds a `Profile__<Name>.md` for each pinned candidate — these are the digested, opinionated summaries; the upstream submodules are the raw source if a profile is insufficient. Adjacent to that, `context-v/inquiry/Filesystem-Naming-Conventions.md` already starts addressing one of this track's open questions. The profiles most directly relevant to Track 4:
  - [[Profile__AGENTS-md]] — how a "README for agents" gets named, scoped, and adopted multi-vendor. Closest precedent for *naming* a single canonical artifact.
  - [[Profile__OpenSpec]] — Fission AI's brownfield-first, slash-command-driven flow. Precedent for *iterative, change-proposal-shaped* spec evolution.
  - [[Profile__Spec-Kit]] — GitHub's `specify` CLI. Precedent for *first-party tooling that gives the spec teeth*.
  - [[Profile__llms-txt]] — Jeremy Howard's `/llms.txt`. Precedent for *root-level discovery* — does Context Vigilance want a `/context-v.md` alongside the directory, the way `llms.txt` sits at the site root?
  - [[Profile__Frictionless-Specs]] — Data Package family. Precedent for *small composable specs* over one monolith. Probably the right shape for a context-v spec that isn't a 50-page document.
  - [[Profile__12-Factor-Agents]] — methodology-as-content. Precedent for *content lives as `content/factor-XX-*.md` files* — directly analogous to how our six folders work.
  - [[Profile__Model-Context-Protocol]] — TypeScript-authored, JSON-Schema-emitted, Mintlify-published. Precedent for *one source of truth, multiple machine-readable views*.
  - The remaining profiles (`Profile__Agent-2-Agent`, `Profile__GSD`, `Profile__MCP-API`, `Profile__OpenUI`, `Profile__Superpowers`, `Profile__Symphony`) are adjacent — skim before sealing decisions to make sure they are not closer precedents than expected.
- **[[memory-layers-for-agents]]** at `ai-labs/studies/memory-layers-for-agents/` — secondarily relevant. No `profiles/` directory yet (candidate work item: bring it in line with the open-specs study). When the spec describes what gets stored, indexed, recalled, and evicted, the storage-topology and write-policy axes from `mem0`, `neo`, and `statebench` become load-bearing. Especially the "schema of a memory" question — the same question, applied to a `context-v/` doc, asks: *what fields does a single context-v file carry, and how is that codified?*

**Working sketch (deliberately rough — to be refined against the studies above):**

- The spec is **not one file**. Borrowing from `frictionless-specs`, it is a small family: one for the directory contract, one for frontmatter, one for the cognitive-mode framing (Prep / Reflective / Journey), optionally one for naming.
- The spec lives in **its own repo** under `lossless-group/`, not nested inside `ai-labs/`. Following the `ai-skills` precedent: spec, template, reference implementations as sibling top-level directories.
- A **validator CLI** ships alongside (Python, since `ai-labs` is Python-default) — `cv lint`, `cv scaffold`, `cv collate`. The collator from Track 1 *becomes* the reference implementation of `cv collate`.
- The site at the spec's repo splash uses [[maintain-splash-pages]] (closing the loop with Track 2).

**What the studies probably show us when re-read with this track in mind** (verifiable, not yet verified):

- The naming question — `context-v/` vs. `CONTEXT-V/` vs. a single root file — has been answered different ways across the candidates. The study's own [[Filesystem-Naming-Conventions]] inquiry already opens this up and is the right place to continue it. Lifting the right precedent matters more than inventing.
- The "how does an agent *find* the file" question (the discovery axis from the open-specs study's reading checklist) is the one we have answered weakest. We rely on agents walking up the tree because [[pseudomonorepos]] tells them to. A published spec needs a discovery story that does not assume the pseudomonorepos skill is loaded.
- The "cross-domain transfer" axis from the open-specs study — *does this generalize beyond developer projects?* — is exactly the bet Track 4 is making. The studies have probably already surfaced which precedents transfer (12-factor-agents content-as-files, Data Package's small composable shape) vs. which do not (heavy schema-first specs that need a validator stack).

**Open sub-questions:**

- **Sequencing.** The user has stated this should follow Tracks 1 & 2. That seems right: shipping the spec before having a working collator is publishing furniture without having sat in it. Confirm this ordering survives a closer look at the studies.
- **More studies likely needed before sealing this track.** Plausible additions, to be decided *after* Track 1 and Track 2 have shipped:
  - A study of **documentation-site generators** that publish open specs (Mintlify — already adjacent via MCP — Docusaurus, Astro Starlight). Where does our spec render?
  - A study of **registry / discovery patterns** — how does a spec get found and version-tracked once published? (Schema.org, JSON Schema Registry, the npm registry experience for `@fission-ai/openspec`).
  - A study of **context-engineering tooling** in the wild — the half-dozen "context aggregator" projects that have sprung up since 2024. Are we converging with them or diverging?
- **What does the spec *not* cover?** Probably: tooling specifics (those are reference implementations, not spec), our internal naming conventions for tags, our preferred sites. The spec should be the minimum that lets another team adopt the practice; everything else is reference material.
- **Is `[[Lossless Flavored Markdown]]` ([[lfm]]) part of the spec or a layer above it?** Answering this probably requires re-reading the [[lfm]] context-v before this track is sealed. Strong instinct: the spec describes *Markdown with conventional frontmatter and cross-links*, and lfm is one (Lossless-flavored) instance of that — but other adopters might choose plain Markdown or their own flavor.

## v0 implementation plan — source map + collator + privacy boundary

With placement (`ai-labs/`), name (`context-vigilance-kit`), and domain (`contextvigilance.com`) settled, the first concrete implementation step has three parts: a curated **source map**, an **assembly script** that maintains it, and a **privacy boundary** that prevents the kit from colliding with the ai-labs splash rollup.

### The source map artifact

A single file at `ai-labs/context-vigilance-kit/sources.md`. The frontmatter is the machine-consumable part — the script reads it; the collator reads it. The body is human curation rationale the script preserves on re-run. Pattern echoes [[Profile__design-md]] (YAML values + Markdown rationale in one file).

Sketched frontmatter shape (subject to refinement):

```yaml
sources:
  - path: /Users/mpstaton/code/lossless-monorepo/context-v
    kind: context-v
    include: true
  - path: /Users/mpstaton/code/lossless-monorepo/ai-labs/context-v
    kind: context-v
    include: true
    note: "This kit's own home — included so its own specs/plans surface in the corpus."
  - path: /Users/mpstaton/code/lossless-monorepo/content
    kind: legacy
    include: true
    note: "Pre-context-v. Essays, concepts, vocabulary — much of it is blueprint-shaped."
```

Open sub-questions for the schema:

- Which `kind:` values exist? At minimum: `context-v` (formal, six-folder), `legacy` (pre-context-v, structure varies), `study-context-v` (those that live inside studies). Add others only if the user identifies a class the script needs to behave differently on.
- What fields does a `legacy` entry need that a `context-v` entry doesn't? Probably a `subdirs:` whitelist (since legacy dirs lack the canonical six-folder shape).
- Is `branch:` needed at v0? **No** — v0 is filesystem-only. `branch:` slots in when Track 1 graduates to the GitHub Content API hybrid (Option 1B/1C from Track 1).

### The assembly script

`ai-labs/context-vigilance-kit/scripts/assemble-context-v-sources.py` — Python, matching ai-labs' default per its [README](../../README.md). The user explicitly named `.ts (or .py)`; defaulting to `.py` here, easily flipped if a TS runtime fits better.

Behavior:

1. Walk a configured root (default: `/Users/mpstaton/code/lossless-monorepo/`) plus any extra roots passed via flag.
2. Find every `context-v/` directory.
3. Optionally include user-flagged `kind: legacy` candidates (the script does not auto-promote arbitrary directories to `legacy`; the user adds those by hand to `sources.md`).
4. Read existing `sources.md` if present and treat every entry there as **authoritative** — never silently overwrite curation.
5. Append newly-discovered `context-v/` paths with `include: false` and `note: "auto-discovered YYYY-MM-DD; review."` so the user opts new sources in deliberately.
6. Emit a clean diff on re-run — additions and disappearances surfaced; existing entries untouched unless their on-disk presence changed.

The collator itself is a separate concern, downstream of the source map. v0 collator just reads `sources.md`, walks the included paths, copies each file (preserving frontmatter), and writes to `corpus/` with provenance keys added (`source_repo`, `source_path`, `collated_at`).

### Privacy / no-collision boundary against ai-labs splash rollup

Two failure modes to avoid:

1. **Duplicate rollup.** The ai-labs splash rolls up `context-v/` content from its children. If `context-vigilance-kit/context-v/` *contained a copy of every other context-v in the tree*, the splash would surface duplicates — original from each child, plus the collated copy under the kit. The user flagged this directly: *"the same context-v file doesn't end up colliding with itself."*
2. **Surfacing intermediate artifacts.** Some collated content is machine-shaped (chunked, embedded metadata) and shouldn't appear in human-facing rollups even once.

Cleanest separation — by directory, not by flag:

- **The kit's own `context-v/`** (`ai-labs/context-vigilance-kit/context-v/`) holds only specs, plans, prompts, blueprints, reminders, explorations *about the kit itself*. Normal Lossless content. The ai-labs splash should surface this just like any other child's `context-v/`.
- **The collated corpus** lives at `ai-labs/context-vigilance-kit/corpus/` — *deliberately not* under `context-v/`. The splash's rollup walks `context-v/` directories; it doesn't reach into `corpus/`. No splash-side configuration needed; the boundary is enforced by location.
- **Per-file opt-out as escape hatch.** A `private: true` frontmatter key, documented in the kit's eventual published spec; rollup tooling filters on it. **v0 does not need this** — the `corpus/` placement is sufficient. Add the flag the first time we hit a real edge case.

This means **no project-level `private: true`**. The kit's own specs/plans/etc. are public Lossless content; only the collated corpus sits outside the rollup's reach, by directory placement alone.

### Order of operations for v0

1. Scaffold `ai-labs/context-vigilance-kit/` with: `context-v/` (its own specs etc.), `scripts/`, `corpus/` (gitignored or `.gitkeep`-only at first), and a stub `README.md`.
2. Write `assemble-context-v-sources.py`. Run it once. User curates the resulting `sources.md`.
3. Write the v0 collator (separate script: `collate.py`). Reads `sources.md`, populates `corpus/`.
4. Confirm the ai-labs splash (when it exists) does not pick up `corpus/`. If splash work is downstream, this is a deferred verification.
5. Hand off to Track 3 (ChromaDB) once `corpus/` has real content.

This v0 plan only addresses Track 1 and the Track 2 boundary. Tracks 3 (Chroma) and 4 (open spec + tooling) follow once the corpus exists.

## Decision parameters (what would close this exploration)

This exploration ends — and produces a spec — when we have answered:

- **~~Placement:~~ Resolved 2026-05-07.** Project lives as a child of [[ai-labs]]. See "Why we don't already know" above for rationale.
- **~~Project name:~~ Resolved 2026-05-07: `context-vigilance-kit`.** The `-kit` suffix matches the project's multi-artifact trajectory (collator → start-scripts → autogenerated AGENTS.md → commands → skills → MCP) better than `-lib` (single library) or `-package` (single shippable artifact), and echoes the [[Profile__Spec-Kit]] precedent already pinned in the [[open-specs-and-standards]] study. Repo path: `ai-labs/context-vigilance-kit/`. Eventual GitHub repo: `lossless-group/context-vigilance-kit`. Brand domain: `contextvigilance.com`.
- **Track 1 prototype:** filesystem walk works end-to-end on the current tree, output inspected manually, provenance verified.
- **Track 2 splash:** scaffolded under the chosen placement, hero direction agreed upon, Pagefind wired.
- **Track 3 ChromaDB:** first index built, one query path working, performance and quality smell-tested.
- **Track 4 spec & tooling:** the [[open-specs-and-standards]] profiles re-read with this track in mind; a decision recorded on the *shape* of the spec (one file vs. a Frictionless-style family); a stub repo or directory chosen for where the spec will live; whether additional studies are needed identified and listed (not necessarily started). Track 4 is *deliberately ordered after* Tracks 1 and 2 — Track 4 only seals once we have furniture worth sitting on.

When tracks 1, 2, and 3 have a working v0 and Track 4 has a recorded direction, this exploration's outcome line gets filled in with a link to the spec that supersedes it, and the spec drives the next iteration.

## Cross-references

- [[pseudomonorepos]] skill — particularly `references/content-rollup.md` (the GitHub Content API mechanism) and the 5-phase lifecycle workflow
- [[context-vigilance]] skill — the practice this project codifies into a tool
- [[maintain-splash-pages]] skill at `lossless-monorepo/context-v/skills/maintain-splash-pages/` — splash conventions and the "creative vs. codified" gate
- [[study-repos-first]] skill — the discipline of pinning prior art before designing
- [[memory-layers-for-agents]] study at `ai-labs/studies/memory-layers-for-agents/` — load before sealing the Chroma design
- [[open-specs-and-standards]] study at `ai-labs/studies/open-specs-and-standards/` — primary input for Track 4. Start at `studies/open-specs-and-standards/context-v/profiles/` (curated `Profile__*.md` summaries) and the `inquiry/Filesystem-Naming-Conventions.md` doc, before walking the upstream submodules
- [[ChromaDB]] tooling note at `content/tooling/Software Development/Databases/ChromaDB.md`
- Sibling exploration [[When-Claud-Code-and-When-Pi]] in this directory
- Parent-level [[Refactor-MemoPop-Site-to-Splash]] plan — adjacent splash work in flight

## Outcome

*(Open. Update when this exploration produces a spec, or when we decide a track is not pursued and capture why.)*

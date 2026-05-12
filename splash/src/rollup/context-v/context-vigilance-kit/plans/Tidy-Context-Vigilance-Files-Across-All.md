---
title: "Tidy Context Vigilance Files Across All"
lede: "A phased, manifest-driven plan to bring every context-v file in the corpus to a state we are proud of — starting with the most-developed docs, fanning out to idea-started ones, with concurrent duplicate detection and ruthless decisions on merge / kill / relocate as we go."
date_created: 2026-05-08
date_modified: 2026-05-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.1
tags:
  - Plan
  - Context-Vigilance
  - Tidying
  - Frontmatter
  - Deduplication
  - Splash-Page
  - ChromaDB
status: Draft
from: "context-vigilance-kit"
from_path: "context-v/plans/Tidy-Context-Vigilance-Files-Across-All.md"
---
# Tidy Context Vigilance Files Across All

## What this plan is for

The corpus collator pulled **583 context-v files** from across the Lossless tree into one place. The corpus manifest reports the shape of that pile: `worked-on (110)`, `idea-started (263)`, `stub (210)`, with `59` files missing frontmatter scattered across the buckets. Some files are mature; many are partial; some are duplicates of each other under different filenames in different repos. None of it has been audited with the new conventions in mind.

This plan walks the corpus *bucket by bucket* to bring every file we care about to **"we are proud of it"** state — frontmatter that meets convention, structure that fits its doc-type, cross-links that actually resolve, no contradictions with sibling docs. **Stubs are deliberately out of scope here**; this plan tidies what already has substance, then `idea-started` becomes the next category, and stubs get their own track later (probably "fill-out with agent support" per the corpus manifest's frontmatter-fill-out lists).

Concurrently — not as a final phase — we hunt **duplicates**: same idea, two files, often in different repos. For each duplicate cluster we make a real-time decision: merge, kill, or leave; and *where in the tree* the surviving copy should live.

## Goals & acceptance criteria

A file is "tidied" when **all** of the following are true. The list is the per-file Definition of Done.

1. **Frontmatter is complete and convention-conforming** per [[context-vigilance]] skill:
   - `title`, `date_created`, `date_modified`, `authors`, `semantic_version`, `tags`, `status` present
   - Optional but encouraged where applicable: `lede`, `augmented_with`, `description`, `purpose`
   - All keys `snake_case`; tag values `Train-Case`; dates `YYYY-MM-DD`
   - `semantic_version` follows `epoch.major.minor.patch`
2. **First paragraph is readable by an outsider** — the User + Agent + Reader audience principle. No team-internal jargon in the lede.
3. **The doc fits its folder** — a spec is a spec, a blueprint is a blueprint, a prompt references a spec, a reminder is short. Mis-filed docs get relocated.
4. **Cross-links resolve.** `[[wikilinks]]` to docs that actually exist in the tree (or get fixed/removed). No dangling references.
5. **No surface contradictions** with sibling docs in the corpus. If two docs disagree on naming or convention, the disagreement is either resolved (one wins, one updates) or surfaced as an open question in both.
6. **Marked as tidied** — frontmatter gets a `tidied_at: <ISO date>` key so the manifest can show progress. Re-running `build-corpus-manifest.py` will surface these once the manifest schema is extended (Phase 0).

A file is *consciously left untidied* only with a reason recorded in `tidied_at_skipped_reason: "..."`. Empty stubs do not count as tidied; they're a different problem.

## Inputs we already have

| Artifact | Path | Role |
|---|---|---|
| Corpus | `corpus/<repo-slug>/...` | The collated copies; *not* the originals (we edit originals, then re-collate) |
| Corpus manifest | `corpus-manifest.md` | The work queue — bucket, content_lines, has_frontmatter per file |
| Skills manifest | `skills-manifest.md` | Skills are tracked separately; not part of this tidy pass |
| Source map | `sources.md` | Curated sources — paths to the originals to edit |
| ChromaDB collection | `.chroma/context-vigilance-corpus` | 4,833 chunks indexed; available for near-duplicate hunts |
| Splash | `splash/` | `pnpm build` and `pnpm dev` surface ID collisions and schema failures |
| Path-from-monorepo-root field | every manifest entry | Click-to-open in Windsurf / Cursor / VS Code / Trae from the rendered manifest |

## Phase 0 — Tooling (lay the rails first)

Three small scripts need to land before the tidy work scales. Each is small enough for one work session.

### 0.1 `scripts/find-near-duplicates.py` — ChromaDB-driven duplicate hunt

For every chunk in the corpus, query Chroma for its top-K nearest neighbors above a similarity threshold and group results into clusters. Output `corpus-duplicates.md` — a manifest of suspected duplicate clusters with:
- The cluster's docs (path-from-monorepo-root, clickable)
- Pairwise distances
- Matching chunk text snippets so a human can judge in seconds

This is the headline use of having Chroma at all for this corpus. The threshold and chunk-vs-doc grouping are knobs to tune; start strict (cosine distance < 0.3) and loosen.

### 0.2 Manifest schema extension — surface tidied progress

Extend `build-corpus-manifest.py` so each entry also carries `tidied_at` (read from the source file's frontmatter, null if absent), and `summary` includes:
- `tidied: N`
- `tidied_by_bucket: {worked-on, idea-started, stub}`
- `untidied_worked_on_remaining`

Then "progress" is observable from one re-run.

### 0.3 `scripts/tidy-queue.py` — sorted work queue

Reads the corpus manifest and outputs the next-N candidates to tidy, ordered by:
1. Bucket priority (`worked-on` before `idea-started`)
2. `tidied_at IS NULL` (skip already-tidied)
3. `has_frontmatter` desc (frontmatter present = lower fix-cost = higher yield)
4. `content_lines` desc (more content = higher value)

Output: a markdown work queue with clickable paths-from-monorepo-root, ready to paste into a new agent session as the to-do list.

## Phase 1 — Worked-on (110 files)

> **108 already have frontmatter; 2 do not.** Smallest fix surface, biggest content. This bucket pays back fastest.

**Per-file workflow.** Open the file, then for each acceptance criterion above, fix what's missing. Keep edits small and surgical — this is tidying, not rewriting. If a file needs a *rewrite*, surface that as a different task and move on.

**Sub-batching.** Group the 110 by `source_repo_slug` and tidy one repo at a time. Reasons:
- Conventions drift per repo; tidying within one repo holds context loaded
- Each repo's docs cross-reference each other more than they cross-reference others; fix in clusters
- Commits stay scoped to one submodule, which respects the [[feedback_submodule_propagation]] rule

**The 2 missing-frontmatter outliers** get visited first inside Phase 1 — they're small enough to add frontmatter without rereading content carefully, and the manifest's `frontmatter_fillout_candidates.worked-on` list points right at them with content_line counts.

**Per-repo close-out.** When a repo's worked-on docs are all tidied, run `pnpm build` from the splash. Any new warnings (broken slugs, orphaned wikilinks rendered weirdly, etc.) are tail risks introduced by our edits — fix them before moving to the next repo.

**Phase 1 done when:** 100% of worked-on files have `tidied_at` set, `pnpm build` is clean, and one re-run of `build-corpus-manifest.py` shows `tidied_by_bucket.worked-on == 110`.

## Phase 2 — Idea-started (263 files)

> **245 with frontmatter, 18 without.** Three times the volume of Phase 1, more partial content per file, more "what was I going to write here" moments.

Same per-file workflow as Phase 1, but with a triage step at the front:

1. **Is the idea still valid?** If the doc captures a problem we no longer have, an architecture we abandoned, or a convention we replaced, *kill it* — don't tidy what we'll regret tidying. Killed files get archived (move to `<repo>/context-v/extra/` per the existing escape-hatch convention; the collator already excludes that folder).
2. **Is the idea valid but the doc thin?** If <100 content lines might be enough for a reminder or a stub-spec, fine. If it should be 600 lines and is currently 150, mark it `status: "Stub - Wants Fillout"` rather than forcing it through Phase 1 acceptance criteria. The fill-out track will pick it up later.
3. **Is the idea valid AND the doc substantively there?** Apply the Phase 1 workflow.

**The 18 missing-frontmatter outliers** in this bucket — same drill: visit first within their repo's pass, lift the [[Profile__AGENTS-md]]-style sparse-frontmatter shape (title + lede + dates + status) as the minimum, ship.

**Phase 2 done when:** every idea-started file is either tidied, killed (archived to `extra/`), or explicitly marked `status: "Stub - Wants Fillout"` with a one-line note about what it needs.

## Phase 3 — Duplicate detection & consolidation (concurrent)

> Run *concurrently* with Phases 1 and 2, not after. Duplicates discovered during Phase 1 tidy work get resolved immediately so we don't tidy something we're about to merge into another file.

### 3.1 Surface duplicate candidates

Two channels:

- **Astro / build-time collisions.** `pnpm build` and `pnpm dev` warn on slug collisions in the corpus content collection. Slug collisions = same path-from-corpus, which only happens if the collator wrote two files to the same destination. Rare but real (e.g., two repos with `context-v/specs/Foo.md` would collide if the collator used a flat layout — currently they don't because of `corpus/<repo-slug>/` prefixing, but watch for the case anyway).
- **Semantic / content collisions.** `find-near-duplicates.py` (Phase 0.1) groups chunks by similarity. A cluster of 3+ docs scoring distance < 0.3 against each other = real duplicate suspect.

### 3.2 Decision framework — merge / kill / leave

For each duplicate cluster:

| If… | Then… |
|---|---|
| All docs say roughly the same thing, one is the most thorough | **Merge** the unique bits into the thorough one; **kill** the others (archive to `extra/` with a one-line redirect note pointing at the survivor) |
| Docs are about the same *topic* but with different *audiences / scopes* (e.g., a spec and a reminder of the same convention) | **Leave** both; ensure they cross-link `[[ ]]` to each other |
| Docs contradict each other on convention | **Resolve** — pick the convention, update both, leave both (or merge if redundant after resolution) |
| One doc is published external (`content/specs/` open-call) and others are internal | **Leave** the open-call as is; **merge or kill** the internal duplicates so the public-facing version is canonical |
| Cluster is dominated by a study repo's reference content | **Leave entirely** — studies are read-only by convention |

### 3.3 Placement — where does the merged survivor live?

This question matters more than the merge itself; getting it wrong creates the next tidy cycle. Rules in priority order, walking from leaf to root:

1. **If the content is specific to one project / submodule** (e.g., a spec for a feature that lives only in `image-gin`) → it stays in that project's `context-v/`.
2. **If the content is specific to one child pseudomonorepo** (cross-cutting within `astro-knots/` but not beyond it) → it lives at that child's `context-v/`. E.g., theme conventions across the Astro-Knots family of sites belong at `astro-knots/context-v/blueprints/`.
3. **If the content is cross-cutting across multiple children** of `lossless-monorepo` (touches `astro-knots/`, `content-farm/`, and `ai-labs/` equally) → it lives at the parent's `lossless-monorepo/context-v/`. The pseudomonorepos skill is explicit about the parent owning "the space between" children.
4. **If the content is a publishable proposal** ("we thought of this; someone please build it") → `content/specs/` (kind: open-call).
5. **If the content is published as a Lossless Skill** → it belongs in the `lossless-skills` repo at `lossless-monorepo/context-v/skills/<skill-name>/`. The skills manifest tracks these; the corpus manifest excludes them.
6. **If the content is a study reference** (upstream code, prior art) → it stays in the study; we never edit study contents during tidy.

**The leaf → root direction is intentional.** Default is *as low as possible* in the tree; promote to the parent only when the content actually spans children. Promoting too aggressively turns parents into junk drawers.

### 3.4 Mechanic of merging

When merging A → B (B survives):
- Move every unique paragraph / section from A into B, preserving the strongest framing
- Update B's frontmatter: bump `semantic_version` (minor at minimum), update `date_modified`, append A's authors to B's `authors` if distinct
- Add a back-reference in B's `Related` section: `Merged from [[A-original-slug]] (archived 2026-MM-DD)`
- Move A to `<A's repo>/context-v/extra/` with a single line at the top: `> Superseded by [[B-slug]]; archived 2026-MM-DD.`
- Re-run the collator and the manifest after the merge so subsequent passes see the new state

## Phase 4 — Stub triage (deliberately not this plan)

The 210 stubs are a different problem class. They get their own plan once Phases 1–3 land, leveraging the manifest's `frontmatter_fillout_candidates` lists and likely an agent batch-fill workflow. Do not tidy stubs as part of this plan; it is wasted motion until the upstream "fill-out with agent support" track exists.

## The `tidied_at` signal

Add to a tidied file's frontmatter:

```yaml
tidied_at: 2026-05-08
tidied_by:
  - Michael Staton
  - Claude Code on Claude Opus 4.7   # if AI-augmented
```

Optional sibling for explicitly-skipped files:

```yaml
tidied_at_skipped_reason: "killed in duplicate-merge: see [[surviving-doc-slug]]"
```

The corpus manifest (after Phase 0.2) will read these and report progress. The splash can eventually surface a "tidied %" badge per repo.

## Working rhythm

- **One repo per session.** Don't spread tidy work thin across the tree; commit progress in coherent submodule-scoped batches. Each session ends with a commit that respects [[feedback_submodule_propagation]] (commit inside the child submodule; do not auto-bump the parent gitlink).
- **Re-run the manifest after each repo.** Numbers should drop visibly per session. Track in `changelog/` entries at the kit level using [[changelog-conventions]].
- **Surface duplicate clusters as you trip over them.** Even before the formal `find-near-duplicates.py` script lands, manual recognition during Phase 1 tidy work is the highest-signal duplicate detection — *if* it gets logged. Maintain a running list at `context-v/issues/Duplicate-Clusters-Found.md` for resolution during Phase 3.
- **Ship the splash with each pass.** `pnpm build` after every repo's pass = continuous integration of the tidy work into the public catalog. Don't batch.

## Open questions

- **Should `tidied_at` propagate into Chroma metadata** so retrieval queries can prefer tidied content? Probably yes; light extension to `ingest-to-chroma.py` to surface the field. Decide after Phase 1 confirms the signal is reliable.
- **What's the merge-conflict policy when two repos' files become The Survivor in different clusters?** Likely: only one can win per cluster, but a doc can absorb content from multiple losers across clusters. Watch for this during Phase 3.
- **Do we eventually need a `Killed-Duplicates.md` registry** at the parent `lossless-monorepo/context-v/` level so the merger trail is auditable across the whole tree? Probably yes once kill counts exceed ~10. Defer the decision until then.
- **How does this plan interact with the [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] vector ingestion?** Tidy edits → re-collate → re-ingest. The ingester is idempotent on stable IDs, so the loop is mechanical. Cost: a few minutes per re-run. Acceptable.
- **Do `content/lost-in-public/*` legacy entries deserve the same care** as `context-v/` files, or should they get a coarser pass (frontmatter only, no structural rewrites)? Lean: coarser. They're labeled `kind: legacy` for a reason.

## Outcome

*(Open. Update with progress and final summary when Phases 1–3 are substantively complete. The tidy is iterative; "complete" means `tidied_by_bucket.worked-on == 110` and `tidied_by_bucket.idea-started >= 90% of survivors after Phase 2 kills`. Adjust thresholds during execution.)*

## Related

- [[Collate-Context-Files-into-Context-Vigilance-as-Repo-&-Project]] — the parent exploration in `ai-labs/context-v/explorations/`; this plan is a downstream concrete-execution doc
- [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] — adjacent exploration; ChromaDB infrastructure powers Phase 0.1 near-duplicate detection
- [[context-vigilance]] skill — the canonical convention reference for the acceptance criteria
- [[pseudomonorepos]] skill — the placement rules in Phase 3.3 are derived from the tree-walking discipline this skill encodes
- [[changelog-conventions]] skill — used for per-session ship notes during execution
- [[maintain-splash-pages]] skill — the splash is the visible health-check for tidy progress
- `corpus-manifest.md` (kit root) — the work queue
- `skills-manifest.md` (kit root) — adjacent inventory; out of scope for this plan but informs Phase 3 (skills are not corpus duplicates)
- `sources.md` (kit root) — source-of-truth for which paths are in scope

## Sequenced kickoff (suggested)

1. Phase 0.1 — write `find-near-duplicates.py`, generate first `corpus-duplicates.md`
2. Phase 0.2 — extend `build-corpus-manifest.py` to surface `tidied_at`
3. Phase 0.3 — write `tidy-queue.py`, generate first work queue
4. Phase 1, repo 1 — pick the smallest worked-on cluster (probably `lfm` or one of the plugin-modules), tidy, commit, re-run manifest
5. Calibrate per-file effort, then scale across remaining repos
6. Run Phase 3 concurrently from session 2 onward — every batch of tidied files goes through duplicate-detection before the next batch starts

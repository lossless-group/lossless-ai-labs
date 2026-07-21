---
title: "Systematizing Chroma as the Loading Mechanism for context-v"
lede: "Chroma has the data — 5,224 context-v chunks plus 257 changelog entries across the Lossless tree — but we still load context by hand or by Claude Code dir-scan. This spec names the three loops that turn the corpus from a Q&A snapshot into a living loading system: an agent that auto-fires the working-set ask at session start, a nudge policy that keeps users ambiently aware of recent activity, and a portable freshness ceremony so any pseudomonorepo can adopt the same shape."
date_authored_initial_draft: 2026-06-01
date_authored_current_draft: 2026-06-01
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-06-01
at_semantic_version: 0.0.0.2
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Specification
tags:
  - Chroma
  - Context-Engineering
  - Context-Vigilance
  - Memory-Layers
  - MCP
  - Retrieval
  - Pseudomonorepos
authors:
  - Michael Staton
date_created: 2026-06-01
date_modified: 2026-06-01
from: "context-vigilance-kit"
from_path: "context-v/specs/Systematizing-Chroma-as-Loading-Mechanism-for-Context-v.md"
---
# Systematizing Chroma as the Loading Mechanism for context-v

## Audience

This spec is written for **any organization adopting `context-vigilance`** as a discipline for distributed context-engineering across a pseudomonorepo tree. The Lossless Group's own choices are used as the worked example throughout. The contract is the public interface; instance names, paths, and thresholds are per-org configuration.

## What this closes

The 2026-05-07 exploration [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] picked **Option A** (local `PersistentClient` + first-party MCP server) and we shipped it: four collections live in `ai-labs/context-vigilance-kit/.chroma/`, the MCP server is wired in `.mcp.json`, the [[search-lossless-corpus]] skill encodes a decompose → execute → evaluate → synthesize discipline, and `ingest-all.sh` populates the collections. The exploration's status is still **Open**. This spec closes it by naming the system that turns the corpus from a built-but-underused snapshot into the actual loading mechanism for every session.

## The diagnosis

Live state on 2026-06-01:

| Collection (Lossless instance) | Docs |
|---|---|
| `claude-code-tool-traces` | 11,253 |
| `claude-code-sessions` | 6,929 |
| `context-vigilance-corpus` | 5,224 |
| `lossless-changelog` | 257 |

"We don't really use Chroma" is not a data problem — the substrate is full. Reading the live code and the user's stated rhythm:

> *"We just either load known context-v files into Claude Code at the beginning of session with skill `context-vigilance`, or after loading agent-skill we ask to scan for relevant files in more or less the appropriate places. But we are kind of growing out of relying on loading by hand, or even quick scans by Claude Code."*

Two technical seams account for the gap:

1. **[[search-lossless-corpus]] is Q&A-shaped only.** Every trigger in `context-v/skills/search-lossless-corpus/SKILL.md:14-22` is *"did we already…"* / *"what did we decide…"* — answer-grounding. **No trigger shape for "I'm about to work on X, load the right context-v files"** and no shape for *"what's been moving across the tree lately, catch me up."* Those are the missing trigger surfaces.
2. **Ingestion is a deliberate batch.** `ingest-all.sh` is a manual command. The script is **already idempotent with stable IDs** (`ingest-to-chroma.py:155-157`: `{repo_slug}::{path}::{chunk_idx}`), and metadata is rich enough (`ingest-to-chroma.py:48-52`, `:206-217`). Incremental re-ingest is one flag away — until it lands, every context-v edit silently stales the embeddings.

But the deeper gap underneath the technical seams is **the agent isn't auto-firing the right conversational patterns**. The user states it plainly:

> *"Auto-loading is better because humans forget these things so discipline needs to be enforced."*

That's the load-bearing reframe of this spec. The substrate is fine. The skill discipline is fine. What's missing is **the agent acting as the discipline-enforcer at session start** — auto-asking for working-set context, auto-nudging about recent activity, auto-keeping the corpus fresh — plus a portable infrastructure so the same pattern works for any organization that adopts the kit.

## Philosophy — load-bearing tenets

- **Humans forget; the agent shouldn't.** Auto-fire conversational patterns at session start so the discipline (load context, catch up on changes) doesn't depend on the human remembering. The user picks the content; the agent enforces the *asking*.
- **Permissive distribution; no permission gating.** `context-vigilance` is emergent context-engineering across distributed teams of any size. Anyone with repo access adds, changes, archives. Access control is GitHub's job. **The kit does not build permission logic.** Anti-pattern flag for future-us.
- **Embeddings are commodity; write/recall policy is the differentiator.** Per the [[memory-layers-for-agents]] study: the storage primitive is interchangeable; the disciplines around *when to remember*, *how to scope*, and *when to retire* are what make a memory layer load-bearing. This spec is a discipline layer, not a storage layer.
- **Taxonomy-neutral.** The kit imposes no foreign schema on the files it indexes. `context-v/` files keep their own structure (kinds: `specs/`, `prompts/`, `blueprints/`, `reminders/`, `explorations/`, `issues/`, `plans/`). Chroma sits *beside* the files, never above them.
- **Portable to any pseudomonorepo.** The same shape adopts cleanly to client trees via the `cv-init` ceremony. Lossless's choices are the worked example; the spec contract is the public interface.

## Hard constraints

- No refactoring of any context-v file's contents or location.
- No imposed taxonomy layer (no `decisions/corrections/gotchas` or similar foreign categorization).
- No deletion or replacement of [[search-lossless-corpus]] — it keeps its Q&A purpose. The new skills are additive, with distinct trigger shapes.
- No auto-ingestion of session/trace collections (privacy-sensitive per `ingest-all.sh:6-14`); they stay opt-in and manual.
- No permission gating built into the kit.

## Naming contract — collection roles vs instance names

The spec uses **canonical role names** for the public contract. Instance names are per-org overrides recorded in `.context-vigilance/config.json`:

| Role (canonical, public) | Mandatory? | Lossless instance | Privacy posture |
|---|---|---|---|
| `context-vigilance-corpus` | Yes | `context-vigilance-corpus` (matches default) | Standard |
| `changelog-corpus` | Yes | `lossless-changelog` (override) | Standard |
| `claude-code-sessions` | No (opt-in) | `claude-code-sessions` (matches default) | Privacy-sensitive |
| `claude-code-tool-traces` | No (opt-in) | `claude-code-tool-traces` (matches default) | Privacy-sensitive |

All references in skill code resolve via the indirection `config.collections.<role>` → instance name. Skills travel between organizations unchanged. When the spec body cites concrete Lossless examples or `where`-filter snippets, instance names appear; conceptual statements always use role names.

## The system — three loops

### Loop 1 — `kickoff-context-v`: working-set conversational flow

The auto-fired session-start ask that replaces hand-loading and dir-scan as the primary loading mechanism.

**Trigger.** Auto-fires at session start when applicability passes (see Loop 2). Behavior:

1. **Read the opening user message** for context-v file references — `@mentions`, pasted absolute paths, pasted relative paths.
2. **If references present** → stay quiet on kickoff; the user is driving the working set. Continue to Loop 3 (catch-up nudge).
3. **If no references** → agent asks:
   > *"Any known relevant context-v files? List them, paste paths, say 'help me find', or say 'no context needed'."*

**Branches.**

- *User lists files* → agent `Read`s each in full. Done.
- *User says "help me find"* → run the Chroma path below.
- *User says "no context needed"* → respect it; don't re-ask this session.

**Chroma path (the help-me-find branch).**

- Query both `context-vigilance-corpus` (role) and `changelog-corpus` (role) via `mcp__chroma__chroma_query_documents`. The dual query reflects the Q6-locked decision: context-v carries the *intent*, changelog carries the *adjacent shipped work*.
- Phrase the query as a natural-language description of the task — semantic embeddings reward coherent phrasing over keyword stuffing (per [[search-lossless-corpus]] `SKILL.md:52`).
- Start `n_results=20` (chunk-level), group by `source_path`, dedupe chunks-per-file.
- **Present a three-bucket triage** (no hard distance threshold; conversational evaluation does the work):
  - **(1) Hard include** — strong matches the agent recommends loading in full.
  - **(2) Maybe — have on hand for search/scan** — kept in awareness, not loaded; agent can `Read` them on request later in the session.
  - **(3) Ignore** — surfaced as off-topic but listed so the user can verify the agent isn't missing something.

  Each entry annotated: `[repo-slug] source_path › fm_title › fm_date_modified → one-line excerpt`. Display dates so the user can spot recency mismatches mid-bucketing.
- **User redistributes by name.** Agent loads only what the user confirms.
- **Recency-mismatch flagging.** If the agent sees a hit on a topic that has been mentioned in recent work (heuristic check against the catch-up window), it flags suspected supersession in plain language: *"This hit is from 2025-11; you have a more recent doc on this topic — possibly superseded?"* The flag does not auto-demote; the user decides.

**No-match fallback.** If Chroma returns no hits whose content the agent judges relevant (qualitative, not score-based), the agent **says so** and falls back to the existing dir-scan rhythm:
> *"The corpus didn't surface strong matches for `{task}`. Falling back to a directory scan — which subtrees should I look in?"*

**Anti-pattern.** Don't chain `kickoff-context-v` into [[search-lossless-corpus]] on the same turn. They serve different intents; the trigger surface is the disambiguator. If kickoff didn't surface a needed answer, the user can invoke Q&A grounding explicitly.

### Loop 2 — Freshness infrastructure: `cv-init` + incremental ingest + dismissal

The portable, applicability-gated infrastructure that all three skills sit on.

**The `cv-init` ceremony (one-time per machine/tree).**

```bash
cv-init                              # interactive: walks up from cwd, asks to confirm or override senior root
cv-init --senior-root /path/to/root  # non-interactive
```

Writes:

- `<senior-root>/.context-vigilance/config.json` — the configuration record:
  ```json
  {
    "senior_root": "/path/to/root",
    "kit_root": "/path/to/root/path/to/context-vigilance-kit",
    "dismissed_paths": [],
    "collections": {
      "context_vigilance_corpus": "context-vigilance-corpus",
      "changelog_corpus": "changelog-corpus"
    },
    "nudge": { "state": "on", "muted_until": null },
    "last_session_at": null
  }
  ```
  Orgs override `collections.<role>` to their instance names: Lossless edits `changelog_corpus` to `"lossless-changelog"`.
- `<senior-root>/.claude/settings.json` — adds a `SessionStart` hook that runs the freshness loop.
- `<senior-root>/.context-vigilance/manifests/<role>.json` — per-collection sidecar manifests recording `{path: {mtime, ingested_at}}` for incremental ingest.
- `<senior-root>/.context-vigilance/scripts/session-start.sh` — the hook wrapper that runs the applicability check and the ingest commands.

**Dismissal via `.context-vigilance-skip` marker files.**

```bash
cv-dismiss [path]   # writes <path>/.context-vigilance-skip
cv-undismiss [path] # removes it
```

A nested subtree opts out by carrying the marker at its root. Marker is a plain file — `cat`, `rm`, `git diff`-able. Use cases: sensitive client subtree, sandbox repo, experimental branch you don't want indexed.

**Applicability check (shared by hook + both new skills).**

Walk up from cwd. If no `.context-vigilance/config.json` is reachable → not applicable. Otherwise: if any ancestor between cwd and senior root carries `.context-vigilance-skip` → not applicable. Otherwise → applicable.

When *not applicable*:
- Freshness hook exits 0 silently (zero cost).
- `kickoff-context-v` / `catch-up-on-context-v` don't auto-load. Explicit invocation still works (you may know better).

**Ingester patches (`ingest-to-chroma.py` and `ingest-changelogs-to-chroma.py`).**

1. **Add `--changed-since` flag.** Walk `sources.md`; for each markdown file, compare `os.path.getmtime` against the manifest entry. Re-embed only files whose `mtime` exceeds the recorded value, or are new. Stable IDs (`ingest-to-chroma.py:155-157`) mean upsert overwrites cleanly with no orphans. Write the manifest at the end of a successful run. Add `--force-rebuild` as the explicit override.
2. **Add `"authors"` to `METADATA_FRONTMATTER_KEYS`** (the tuple at `ingest-to-chroma.py:48-52`) so author-level `where`-filters are queryable when needed. Costs nothing for solo use today; data captured for any larger-team adopter.
3. **Document `"owner"` as a future schema slot** — the ingester accepts it without code change when adopters with reporting hierarchy start writing `owner:` in frontmatter.

**The SessionStart hook config (`<senior-root>/.claude/settings.json`).**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "<senior-root>/.context-vigilance/scripts/session-start.sh"
      }
    ]
  }
}
```

The `session-start.sh` wrapper:
1. Runs the applicability check; if not applicable, exits 0.
2. Runs `ingest-to-chroma.py --changed-since` against `context-vigilance-corpus` (role).
3. Runs `ingest-changelogs-to-chroma.py --changed-since` against `changelog-corpus` (role).
4. Both ingesters are idempotent; if Chroma is unreachable, they fail silently and let session start proceed (the hook is best-effort freshness, not a gate).
5. **Never** auto-fires the privacy-sensitive `claude-code-sessions` / `claude-code-tool-traces` ingesters.

**Verification gap to close before shipping.** Confirm Claude Code's settings.json discovery semantics for nested `.claude/settings.json` files — does it merge across the tree or shadow with nearest-wins? If shadowing, document the dismissal alternative: child trees that need their own settings either inherit explicitly or live with the shadow (which dismisses kit applicability anyway — fine outcome).

### Loop 3 — `catch-up-on-context-v`: nudge policy + recency digest

The auto-opt-in nudge that keeps users ambiently aware of what's been moving across the tree.

**Trigger.** After Loop 1 (kickoff) resolves, agent checks **delta meaningfulness**:

- *Time delta*: `now - config.last_session_at > 3 days`, OR
- *Volume delta*: ≥5 files in `context-vigilance-corpus` modified since `config.last_session_at` (queryable via `where={"fm_date_modified": {"$gt": last_session_at}}`).

If either threshold clears AND `config.nudge.state == "on"` AND `now > config.nudge.muted_until`, agent nudges:
> *"There have been [N] context-v updates since your last session [Δ days ago]. Want a quick catch-up digest? Y / N / mute-for-today / mute-for-week."*

**Default state.** `nudge.state = "on"` (auto opt-in). Mute mechanism:
- `mute-for-today` → sets `nudge.muted_until = end-of-day`.
- `mute-for-week` → sets `nudge.muted_until = now + 7d`.
- `cv-config nudge off` → permanent mute (sets `nudge.state = "off"`).

After session opens (or kickoff resolves), the hook updates `config.last_session_at` to `now`.

**Explicit invocation (always works regardless of nudge state).**

```
/catch-up-2w
/catch-up-1m
/catch-up --window 3m
/catch-up --window 6m --scope astro-knots
/catch-up --since 2026-05-01 --max-files 100
```

Fast triggers `/catch-up-2w` and `/catch-up-1m` map to default 2-week and 1-month windows. Longer windows (3m, 6m, 1y) require explicit `--window` and trigger overflow handling.

**Query mechanics.**

- Query both `context-vigilance-corpus` and `changelog-corpus` (roles) with a `where` filter on `fm_date_modified > {since}` (fall back to `ingested_at > {since}` when frontmatter dates are missing).
- Optional `--scope <source_repo_slug>` to limit to one repo's subtree.
- Optional `--by-author <name>` once the `fm_authors` patch lands.
- Group by `source_path`, dedupe chunks-per-file.

**Output — the meeting-prep digest.**

Three-level hierarchy: **repo → tag → files (recency desc).**

```
=== ai-labs ===
  ## Auth
    - context-v/specs/Auth-Patterns.md            › 2026-05-29 → one-line lede
    - context-v/explorations/JWT-Rotation.md      › 2026-05-22 → one-line lede

  ## Memory-Layers
    - context-vigilance-kit/context-v/specs/Systematizing-Chroma-...md › 2026-06-01 → ...
    - studies/memory-layers-for-agents/context-v/profiles/Profile__Beads.md › 2026-05-28 → ...

  ## (Untagged)
    - context-v/plans/Sprint-2026-22.md           › 2026-05-28 → ...

=== astro-knots ===
  ## Auth
    - sites/fullstack-vc/context-v/specs/Auth-System.md › 2026-05-31 → ...
  ...
```

Conventions:
- **Denormalized tag grouping**: a file with N tags appears under each of its N tags within its repo. The cost of repetition is accepted for the scan-by-topic value.
- **Tag bucket order within repo**: most-recently-active topic floats to top (bucket sort key = max `fm_date_modified` of files in bucket). Default. v1 toggle: `--alphabetical` for stable view.
- **Repo order**: same logic — most-recently-active repo floats to top.
- **`(Untagged)` bucket** per repo for files lacking `fm_tags`. Surfaces them rather than dropping.
- **Tag case-folding**: tags case-folded for grouping (`Auth` and `auth` are one bucket). Display uses the most-common canonical casing among bucketed files.
- **One-line excerpt source**: chunks ingested by `ingest-to-chroma.py:200-203` already prepend `[title] / ## heading` to embedded text — the one-line summary falls out of the chunk preamble cleanly; no extra LLM call needed for the basic digest.

**Overflow handling for wide windows.**

Pre-query size estimate via Chroma's `where`-filtered count. If file count > **overflow threshold** (default `50`, tunable via `--max-files`):

**v0 — sorted truncation + auto-narrow prompt:**
> *"Showing 50 of 287 files modified in the last 6 months. Narrow by `--scope <repo>`, `--by-author <name>`, shrink the window, or `--max-files 100` to widen the cap."*

Hard cap is loud, not silent.

**v1 — theme summarization** (deferred): when the window is too wide for a useful file list, agent produces a prose theme readout:
> *"Major themes in the last 6 months: (1) Auth system rework in astro-knots/fullstack-vc, 15 files; (2) memopop orchestrator pipeline, 22 files; …"*

User drills into a theme to get the file list. This is the meeting-prep equivalent of a quarterly-review readout.

## What stays exactly as it is

- All 24,000+ documents across the four collections.
- All `context-v/` files, in their current locations, with their current taxonomy and frontmatter conventions.
- The `context-v/` kinds (`specs/`, `prompts/`, `blueprints/`, `reminders/`, `explorations/`, `issues/`, `plans/`).
- [[search-lossless-corpus]] for its actual purpose — Q&A grounding (*"did we already…"*).
- [[context-vigilance]] as the directory-roles discipline for *writing* context-v files.
- The privacy posture on `claude-code-sessions` / `claude-code-tool-traces` ingestion (opt-in, manual, never auto-fired).
- Stable-ID chunk schema (`{repo_slug}::{path}::{chunk_idx}`).
- The existing `ingest-all.sh` master script and its opt-in flags for session/trace collections.

## Implementation slice

In sequence — each step is reviewable before the next lands:

1. **Patch `ingest-to-chroma.py`** with `--changed-since` + sidecar manifest support + `"authors"` added to `METADATA_FRONTMATTER_KEYS`. Smoke-test: edit one context-v file, run with `--changed-since`, confirm only that file re-embeds.
2. **Patch `ingest-changelogs-to-chroma.py`** with the same `--changed-since` shape and manifest. Smoke-test analogously.
3. **Author `cv-init` and `cv-dismiss` scripts** in `context-vigilance-kit/scripts/`. `cv-init` writes config, hook config, manifest skeletons, and the `session-start.sh` wrapper. `cv-dismiss` writes/removes marker files.
4. **Author `cv-config` script** for nudge-state and collection-name overrides. Minimal — `get` / `set` / `list` against `.context-vigilance/config.json`.
5. **Run `cv-init` on the Lossless tree** with `--senior-root /Users/mpstaton/code/lossless-monorepo`. Verify the hook fires at session start, runs sub-second on no-op, ~seconds when files have changed.
6. **Author `kickoff-context-v` skill** in the lossless-skills repo (per [[feedback_skill_authoring_in_lossless_skills]]), then run `sync-skills.sh`. SKILL.md encodes: auto-fire trigger contract, three-bucket triage flow, no-match fallback rule, anti-pattern about chaining with [[search-lossless-corpus]].
7. **Author `catch-up-on-context-v` skill** the same way. SKILL.md encodes: auto-fire nudge trigger contract, delta-meaningfulness threshold, mute mechanism, fast-trigger shorthand, output digest shape (repo → tag → files), overflow handling.
8. **Smoke-test the loop on ≥3 real tasks**: open a fresh session, observe kickoff auto-asking, walk through bucket triage, observe catch-up nudge, confirm the file set selected matches what would have been hand-loaded (target: ≥80% overlap on the top-5).
9. **Verify Claude Code settings.json nested-discovery semantics** (merge vs shadow) and document the resolution in this spec under Loop 2.

Each step lands as its own PR / commit so the rollback unit is small. **No step changes a context-v file's contents or location.**

## Escalation path (v1+)

Not in scope for v0. Pinned so future-us doesn't re-derive:

- **Chroma's Context-1** for the kickoff query step. Per [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] §1: a 20B agentic search model with multi-hop retrieval and self-editing context, ~25× cheaper than a frontier model on the same task. Drop-in replacement for the single-shot `query_documents` call; file-selection mechanics unchanged.
- **Theme summarization** for catch-up wide windows (3m+).
- **Author-filter UI** for multi-person digests: `/catch-up-2w --by-author Alex`. The `fm_authors` data lifted in v0 is the substrate.
- **Per-project last-session tracking**, if the senior-root-global digest proves noisier than useful in single-subtree work.
- **Resume-after-compaction trigger**: re-fire kickoff after Claude Code's context compaction so the post-compaction agent has the working set re-asserted.
- **`owner:` schema activation**: when adopters with reporting hierarchy emerge, promote `owner` from documented-slot to lifted metadata; author-style filters apply.
- **Cross-pseudomonorepo federation**: if multiple senior roots exist on one machine (different client trees), expose a `cv-list-roots` and per-root scoping. Probably never needed but worth noting.
- **Kit governance** for larger organizations: when a tree has multiple human stewards, decide who owns `cv-config` changes. Out of scope for solo and small-team use; design when the first multi-steward adopter surfaces.
- **Distribute the kit as a package** (PyPI / Homebrew) so client adopters don't need to vendor the kit into their tree.

## Open questions for v0

Minor calibrations that smoke-test step 8 will pressure-test:

- **Delta-meaningfulness threshold default** — current proposal: *last session >3 days ago **OR** ≥5 context-v files modified in 2w*. Tunable via `cv-config`. Adjust if v0 nudges too often or not enough.
- **Overflow threshold default** — current proposal: 50 files. Tunable via `--max-files`. Adjust if catch-up digests routinely truncate or never fill.
- **Tag case-folding canonical casing** — display using most-common variant across the bucketed files, or always Title-Case? Recommend most-common; flip to Title-Case if the variability is distracting.
- **Hook silence on Chroma unavailability** — exit-0-silently is safe but undebuggable. Add a `--verbose` flag for diagnostic mode that logs to `<senior-root>/.context-vigilance/hook.log`. Recommend yes.

## Anti-patterns this spec explicitly forbids

- **Reorganizing `context-v/` files** to "improve retrieval." The metadata schema already carries everything needed.
- **A second taxonomy layer** (`decisions/corrections/gotchas` or similar). The kinds in `context-v/` are the taxonomy. Period.
- **Permission gating** — access control belongs in GitHub, not in the kit.
- **Chaining `kickoff-context-v` into [[search-lossless-corpus]]** on the same trigger. They serve different intents.
- **Auto-ingesting session/trace collections** in the SessionStart hook.
- **Returning chunks to the user from `kickoff-context-v`**. The output of kickoff is *which files to load*, not search results.
- **Hardcoding collection names in skill code**. Always resolve via `config.collections.<role>` indirection.
- **Hardcoding Lossless paths in client-portable code**. The senior root is configured per-instance via `cv-init`.
- **Building a hard distance threshold for file selection**. The conversational evaluation does the work; numeric trip-wires duplicate a discipline that already works.

## Related

- [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] — parent exploration; this spec closes it.
- [[Memory-Layers-for-the-In-App-Chat-Package]] — sibling exploration on a different memory surface (in-app chat). Different problem; cross-pollination possible later.
- [[memory-layers-for-agents]] (study) — sixteen profiled memory systems. Confirms the "embeddings are commodity; write/recall *policy* is the differentiator" thesis. Worth re-reading [[Profile__Beads]] for the `bd init` / setup-ceremony pattern this spec adopts.
- [[search-lossless-corpus]] — existing Q&A skill; sibling to the new skills, not replaced.
- [[context-vigilance]] — directory-roles practice for *writing* context-v.
- [[chroma-local]] — generic local-Chroma usage; PersistentClient lifecycle; `where`-operator reference.
- [[pseudomonorepos]] — the tree-shape discipline this spec's portability story rests on.
- [[update-config]] — skill for wiring the `SessionStart` hook into `settings.json`.
- [[feedback_skill_authoring_in_lossless_skills]] — discipline for authoring the new skills in lossless-skills and syncing.

## Outcome

*(Open. Update on each implementation step's landing. Mark `status: Final` when both new skills are auto-firing for ≥ 1 week of real Lossless use AND the hook has run cleanly for the same period AND at least one external/client adopter has run `cv-init` successfully on their own tree.)*

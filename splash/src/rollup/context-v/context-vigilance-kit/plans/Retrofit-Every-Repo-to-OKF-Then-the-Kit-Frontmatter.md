---
type: Plans
title: "Plan: Retrofit Every Repo to OKF, Then to the Kit's Frontmatter"
description: "A repo-by-repo sweep that adds the OKF type to every context-v doc, then the kit's baseline frontmatter, in repos whose three branch tiers are at parity."
lede: "The kit made every doc declare a type. 945 older docs across 47 repos don't, yet. Here's the sweep that fixes it."
summary: "Execution plan for a directed normalization sweep across the Lossless tree, decisions settled 2026-10-28. Only repos whose development, main, and master are present and at parity are swept; the rest go on a logged list for their own troubleshooting. Per swept repo: Phase 1 makes context-v an OKF v0.2 bundle, Phase 2 adds the kit's baseline frontmatter from facts only (no reading pass, no today's dates). Each phase is one commit, one changelog entry, pushed to all three tiers. The corpus roll-up runs after. Push to main and master is authorized."
publish: true
date_created: 2026-10-28
date_modified: 2026-11-01
date_authored_initial_draft: 2026-10-28
date_authored_current_draft: 2026-11-01
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.1.0
status: Signed-Off
tags:
  - Plan
  - Open-Knowledge-Format
  - Normalization-Sweep
  - Pseudomonorepos
spec_reference: "[[Context-V-Is-an-OKF-Profile]]"
site_uuid: 00bbcd8f-c6ba-4f17-ab50-769124637364
hex_code: 4xhazp
from: "context-vigilance-kit"
from_path: "context-v/plans/Retrofit-Every-Repo-to-OKF-Then-the-Kit-Frontmatter.md"
---
# Plan: Retrofit Every Repo to OKF, Then to the Kit's Frontmatter

## Why Care?

The kit's newest rule is also its simplest: every `context-v/` doc declares a `type`, the name of its folder. That one field makes a `context-v/` folder an [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format) bundle that any OKF tool can read. See [[Context-V-Is-an-OKF-Profile]].

We made the rule after writing a thousand docs without it. The first survey of the Lossless tree ([[Survey-a-Scoped-Dashboard-of-Context-V]]) counted **945 of 994 docs missing `type`**, across **47 repos** (skill files aside). Every one is a one-line fix, which is exactly why it should be a deliberate sweep and not something fixed by accident in unrelated work.

## Decisions (2026-10-28, operator)

1. **Only sweep repos at branch parity.** `development`, `main`, and `master` must all be present and at the same commit. Anything else is logged, not fixed: it needs its own troubleshooting.
2. **Missing tiers get created**, from the tier(s) that exist, when those agree.
3. **Up to two changelog entries per repo:** one for OKF compliance, one for the metadata template. The second is written only when Phase 2 actually changed something; a repo whose docs already carry the template gets one entry, not an entry describing a change that didn't happen (pilot, `lossless-changelog`, 2026-10-28).
4. **Compliance changes are not content changes.** No sweep ever writes today's date into `date_modified`, `date_last_updated`, `date_authored_current_draft`, or bumps `at_semantic_version`.
5. **No reading pass.** Only values that are facts get written. The corpus is a roll-up, so it is refreshed after the sweep, not edited.
6. **Push to `main` and `master` is authorized** for this sweep.
7. **The anchor's `context-v/` is the trunk:** leftovers, or the broadest practice abstractions (stack preferences, workflow preferences). It's swept like any repo when at parity. Loose docs sitting directly in any repo's `context-v/` root are logged for filing, not typed.
8. **Agents edit by hand. No script writes frontmatter.** Scripted frontmatter edits have caused real damage in this tree. Every change to a doc is made by an agent reading that doc and editing it with its editor's Edit tool, one doc at a time. Scripts and commands may only *read*: the parity gate (git), the survey (inventory and verification), `git log` for dates, `uuidgen` for IDs the agent then pastes in.

### Added after the pilot (2026-10-29, operator)

9. **Soft-impose the metadata standards, not just the missing keys.** The standards are now comprehensive and settling, so Phase 2 also brings existing frontmatter up to them, by hand, value preserved: non-standard key spellings renamed (`version:` → `at_semantic_version:`), `status` and `tags` values in Title-Case (`draft` → `Draft`, `in review` → `In-Review`), and `authors` / `augmented_with` / `tags` written as YAML lists when they're a bare string. See the normalization table under Phase 2.
10. **`date_modified` older than the file's last commit is fine.** Files get moved and renamed constantly in this tree, and a move is a commit. Never "correct" an existing `date_modified` from git.
11. **Author spelling variants stay as written.** `Michael P. Staton` is not swept to `Michael Staton`; the aggregation layer resolves variants through an authors list with aliases. See `astro-knots/sites/lossless-changelog/context-v/plans/Maintain-an-Authors-List-Enables-Naming-Aliases.md`.

### Added during the 2026-10-31 batch (operator)

12. **An existing `type` that doesn't match its folder is corrected.** `type: issue` in `issues/` becomes `type: Issues`. OKF requires `type` to equal the folder name in Train-Case, so this restores the rule rather than changing meaning. Grep the repo's code for readers of the old value first.
13. **Package and tool names aren't tags.** `pnpm`, `pptxgenjs` and the like come out of `tags`. If the body doesn't already mention the tool, add it there. A tag is a topic.
14. **Uncommitted work in the operator's checkout gets committed**, as its own commit before the sweep, not left behind. Secrets (`.env*`, credentials) and nested git repos are never committed.
15. **Bring every local tier current at the end, including the checked-out branch** (`git merge --ff-only`), so the operator never has to pull after a sweep.
16. **Each agent mints its own IDs, one at a time, at the moment it writes them.** Never mint a pool into a shared file: two agents drawing from one pool wrote the same 8 `site_uuid`/`hex_code` pairs into two repos each on 2026-10-31.

### Added during the astro-knots sweep, 2026-11-01 (operator)

17. **Repo names aren't tags either.** `mpstaton-site` and the like come out of `tags` when the body already names the repo. This extends decision 13; a framework or product that is the doc's subject (Astro, Svelte, Vercel) stays.
18. **`"[]"` in a date key becomes an empty value.** The key stays, since present-but-empty means "not yet". A quoted date (`"2026-05-04"`) parses the same as a bare one and is left alone.
19. **Status values follow the expanded vocabulary in `status-discipline.md`**: planned work, issues, decisions, standing docs, any doc. That reference lists the variants found in the tree. Its "plain rename" rows are normalizations a sweep makes; its "read first" rows go to a status sweep the operator confirms.

## Scope

**In:** every repo in the Lossless tree with a `context-v/`, newest commit first. The survey's tree scan from the anchor root is the inventory: `python3 agent-skills/survey/scripts/scan.py <anchor> --out survey/views/global`.

**Out, always:**

- **Repos that aren't ours to edit:** everything under any `studies/` folder (including `studies/collaborations/**`), vendored skills (`context-v/agent-skills/archify`, `chroma-agent-skills`), and the forks and outside repos the survey lists as active without the operator.
- **Copies:** `splash/src/rollup/**`, `context-v-corpus/corpus/**`. They regenerate from the originals in the wrap-up.
- **Skill files:** `context-v/agent-skills/**` follow the Agent Skills contract, not this one.
- **Scratch:** `context-v/extra/**`.
- **The kit's `master`:** the Claude plugin directory watches it, so it moves only for tagged releases. The kit is already OKF-conformant; if it qualifies for Phase 2, that phase lands on `development` and `main` and rides to `master` with the next release.

## The two lists the sweep keeps

Both live at the anchor, since they're about the whole tree, and are regenerated (not appended) on every run:

- **`lossless-monorepo/context-v/issues/Repos-Not-at-Branch-Parity.md`:** each skipped repo, why, and the SHAs (see the gate below). This is the troubleshooting backlog.
- **`lossless-monorepo/context-v/issues/Loose-Docs-in-Context-V-Roots.md`:** docs directly in a `context-v/` root, with no folder to type them (38 today: 16 in one orchestrator app, 12 in `lfm`, the rest scattered). Each wants filing into a folder, or promoting to the anchor if it's practice-wide.

## Phase 0: the parity gate (read-only)

For each repo, after `git fetch origin --prune`:

| Check | Pass | Fail → logged, skipped |
|---|---|---|
| **Present** | `development`, `main`, `master` all exist on `origin` | — (missing tiers are created first, see below) |
| **Parity** | all three point at the same commit | the three SHAs, and which tier is ahead |
| **Local not ahead** | no local tier branch has commits its `origin` tier lacks | the branch and its unpushed count |
| **context-v clean** | no uncommitted changes under `context-v/` in the working copy | the dirty paths |

**Creating a missing tier.** If the tiers that do exist all point at one commit, create the missing ones there and push them (`git push origin <sha>:refs/heads/<tier>`). If the existing tiers disagree, the repo fails parity and is logged instead.

Dirty files *outside* `context-v/`, and a working copy checked out on a feature branch, don't fail the gate: the sweep never touches the working copy (next section).

## How a qualifying repo is swept

One subagent per repo, briefed by a VP Eng orchestrator (`/cv:loop`, with this plan as the target).

1. `git worktree add <scratch>/<repo> origin/development`: a separate checkout, so the operator's working copy is never switched, stashed, or edited.
2. Make the Phase 1 edits there by hand: open each doc, read its frontmatter, add what's missing with the Edit tool. Then verify, write the changelog entry, commit.
3. Push the one commit to all three tiers at once: `git push --atomic origin HEAD:development HEAD:main HEAD:master`. At parity, that's a fast-forward on each.
4. Make the Phase 2 edits on top, the same way, by hand: verify, changelog entry, commit, atomic push.
5. If a push is rejected (someone pushed meanwhile), parity is broken: stop, log the repo, move on.
6. Fast-forward the operator's local tier branches that aren't checked out (`git fetch origin development:development`, and so on). The checked-out branch is left for the operator to pull; the run's report lists them.
7. `git worktree remove`.

### Phase 1: OKF conformance

- [ ] Every doc in a folder gets `type: <Folder-In-Train-Case>`, from its top folder under `context-v/` (`sitemap/routes/x.md` → `Sitemap`). The line goes at the end of the frontmatter block; nothing else moves. A doc with no frontmatter gets a minimal block: `type`, plus `title` from its first H1
- [ ] Non-plural or non-canonical folders keep their names (`issue-resolution/` → `type: Issue-Resolution`). **No folder renames in this sweep:** renames break links. The survey surfaces the plural-rule gap for later
- [ ] Unparseable YAML (5 docs tree-wide) is fixed by the agent, minimally, in this commit
- [ ] Root `context-v/index.md` declares `okf_version: "0.2"`. An existing one with another shape isn't rewritten; it's listed in the run report
- [ ] Each folder gets an `index.md`, one line per doc, using the doc's `description`, else `lede`, else the title alone. An existing `index.md` is left alone and listed if its shape differs
- [ ] **Changelog:** `changelog/<date>_NN.md` per `changelog-conventions`, e.g. "Every context-v Doc Now Declares Its Type", creating `changelog/` if the repo has none
- [ ] **Commit** per `git-conventions`, e.g. `chore(context-v): Make context-v an OKF bundle: every doc declares its type`

### Phase 2: the kit's metadata template, facts only

Each field is written only when it's absent, and only from a fact. Existing values are never changed.

| Field | Set from | Never |
|---|---|---|
| `title` | the doc's first H1 | a filename |
| `date_created` | `date_authored_initial_draft` if present, else the file's first commit (`git log --diff-filter=A --follow`) | `stat`, today |
| `date_modified` | the file's last commit **before the sweep** | today |
| `site_uuid`, `hex_code` | minted by command (`uuidgen`, `/dev/urandom`), checked tree-wide for duplicates first | typed by a model |
| `authors` | human commit authors of the file; agent co-authors filtered out | an agent |
| `created:`, `date:` (legacy keys) | renamed to `date_created`, `date_authored_initial_draft`, values verbatim, **only after grepping the repo for readers of the old key** | a rename that breaks an ingester |

**Normalization of existing values (decision 9).** Same discipline: by hand, one doc at a time, the value kept verbatim apart from the change named here.

| Found | Becomes | Never |
|---|---|---|
| `type: issue` in `issues/` (decision 12) | `type: Issues` | retyping a doc to a different folder than the one it's in |
| a package or tool name in `tags` (decision 13) | removed from `tags`; mentioned in the body if it isn't already | dropping a topic tag |
| a repo name in `tags` (decision 17) | removed from `tags` when the body already names the repo | removing it when the body doesn't |
| `date_*: "[]"` (decision 18) | the key with an empty value | deleting the key; touching a quoted real date |
| `version: 0.1.0.0` (no `at_semantic_version` present) | `at_semantic_version: 0.1.0.0` | bumping the value; touching `semantic_version:`, which is a permanent alias |
| `status: draft`, `status: in review` | `status: Draft`, `status: In-Review` (Title-Case, hyphenated) | changing which status it is |
| a status in the "plain rename" rows of `status-discipline.md` (decision 19): `In-Progress`, `Implemented`, `Authoritative`, `As-observed-from-filesystem`, `Open · Jotted` | `Implementing`, `Shipped`, `Active`, `Reference`, `Open` | a "read first" row (`Published`, `Proposed`, `Idea`, `Planned`, …), which goes to the operator |
| `tags` values in lowercase or kebab-case | Title-Case, hyphenated (`markdown-rendering` → `Markdown-Rendering`) | adding, dropping, or merging tags |
| `authors: Name` or `augmented_with: Tool on Model` as a bare string | a one-item YAML list | changing the name or model string |
| `date_modified` earlier than the last commit | left alone (decision 10) | "correcting" it from git |
| an author spelling variant | left alone (decision 11) | rewriting it to the canonical name |

**Not written:** `description`, `lede`, `tags`, `publish` (they need reading), `status` (it must reflect reality), `at_semantic_version`, `augmented_with`, and every `date_authored_*` beyond the fallback above. No empty placeholder keys either: a key appears only with a real value. The survey's cleanup worklist carries the rest forward.

- [ ] **Changelog:** a second entry, e.g. "context-v Docs Carry the Kit's Metadata Template"
- [ ] **Commit:** e.g. `chore(context-v): Fill the kit's baseline frontmatter from git history`

### Verification, per repo, before each push

- [ ] A read-only survey scan of the repo (`scan.py <repo> --scope repo --no-git`) reports no docs missing `type` (Phase 1), and the conformance check in `references/okf.md` prints nothing
- [ ] The agent reads its own `git diff` in full: it touches only frontmatter lines, new `index.md` files, and the changelog entry; no body line changed
- [ ] No line in the diff contains today's date outside the changelog entry and its own frontmatter

## Order and pacing

1. **No editing tool gets built.** The sweep is agent work (decision 8). What the kit gains instead is the agent brief: these phase checklists, written into the `upgrade` skill so any adopter can hand the same retrofit to an agent with `/cv:upgrade`.
2. **Gate the whole tree first** (read-only git commands) and write both lists. That alone shows how much of the tree qualifies.
3. **Pilot:** two small qualifying repos, end to end, then a pause for the operator to read the diffs and the four changelog entries.
4. **Then newest commit first**, up to four repos in parallel. Repos are separate git repos, so parallel agents never share a checkout.
5. **Wrap-up:**
   - One `chore(submodule): bump <names>` commit per parent at parity, pushed to all three tiers, at the end, not per repo.
   - Run the roll-ups: `context-v-corpus/scripts/refresh-corpus.sh --apply`, and the splash roll-ups that copy child docs (e.g. `ai-labs/splash`'s `pnpm rollup:sync`). Chroma re-ingest stays the operator's call.
   - Re-run the survey from the anchor root and attach the before and after counts to the run report.

## Acceptance criteria

- [ ] `Repos-Not-at-Branch-Parity.md` lists every repo skipped, with the reason and SHAs
- [ ] Every qualifying repo has `development`, `main`, and `master` at the same commit after the sweep
- [ ] In swept repos, the survey reports `no_type` = 0, apart from logged loose docs
- [ ] No sweep commit changes a body line, and no sweep edit writes today's date into a doc's frontmatter
- [ ] Every minted `site_uuid` is unique tree-wide
- [ ] Each swept repo has two changelog entries, each pushed with the commit it describes
- [ ] No working copy was switched, stashed, or modified; the report lists checked-out branches now behind their remote
- [ ] The corpus and splash roll-ups are refreshed

## Related

- [[Context-V-Is-an-OKF-Profile]]: the decision this enforces
- [[Survey-a-Scoped-Dashboard-of-Context-V]]: the inventory and the verifier
- `agent-skills/context-vigilance/references/okf.md`: the conformance rules and check
- `agent-skills/context-vigilance/references/frontmatter-spec.md`: baseline fields and the directed-sweep rules this plan follows
- `agent-skills/loop/`: how the orchestrator runs it

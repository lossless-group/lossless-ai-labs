---
name: Matt Pocock Skills Profile
slug: mattpocock-skills
upstream: https://github.com/mattpocock/skills
package: "`claude plugin install mattpocock-skills@claude-plugins-official` for Claude Code; the repo's own `@mattpocock` marketplace for Codex, Copilot CLI, and VS Code; `gemini skills install --path skills/<bucket>` for Gemini; `npx skills@latest add mattpocock/skills` for everything else"
license: MIT
maintainer: Matt Pocock (`mattpocock`)
study: studies/agent-skill-packs
profile_path: studies/agent-skill-packs/mattpocock-skills
profile_kind: governed single-author engineering skill pack with maturity buckets, an invocation split, a router skill, a plugin manifest, and a docs page per promoted skill
title: "Matt Pocock Skills — Profile"
status: Reference
authors:
  - Michael Staton
date_created: 2026-11-22
date_modified: 2026-11-22
site_uuid: f5b82888-ca6e-4d93-a4e4-d82a289988cb
hex_code: yhbuut
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
lede: >-
  Thirty-nine skills from one engineer's daily practice, sorted by maturity
  rather than topic, split into ones you type and ones the agent may reach
  for, shipped as a self-updating plugin, and held in shape by a written
  scope bar, a folder of recorded rejections, and a router that must be
  re-synced every time a skill changes.
summary: >-
  Source-cited profile of `mattpocock/skills` (pinned at abeeaf9,
  2026-11-19, plugin version 1.3.2, MIT). Covers the five buckets
  (engineering, productivity, misc, in-progress, deprecated) and what
  "promoted" means; the user-invoked vs model-invoked split and the
  "Call the Skill tool" dependency rule; the `ask-matt` router and the
  rule that keeps it honest; the plugin manifest and the canonical
  install block across six harnesses; the docs page every promoted skill
  owes; and the governance layer (`SCOPE.md`, `.out-of-scope/`,
  issue templates, a 14-day needs-info close). Ends with a comparison
  against our own `lossless-agent-skills` and a short list of what to
  borrow. Read it when deciding how to make a skill pack usable by
  people who are not its author.
publish: true
type: Profiles
from: "studies/agent-skill-packs"
from_path: "context-v/profiles/Profile__mattpocock-skills.md"
---
# Matt Pocock Skills — Profile

A profile of `mattpocock/skills` as it lives in this study (`studies/agent-skill-packs/mattpocock-skills/`, pinned at `abeeaf9`, 2026-11-19). Every claim cites a pinned path relative to the submodule unless it names our own repo. Read it alongside [[Profile__pstack]], [[Profile__seo-skills]], and [[Profile__gstack]]. This entry is the study's example of a *governed* pack: the interesting parts are less the skills themselves than the rules that decide what gets in, how it ships, and how the pack stays consistent with its own docs.

## TL;DR

- **39 skills in five maturity buckets.** 20 in `engineering/`, 7 in `productivity/`, 8 in `in-progress/`, 4 in `misc/`, and an empty `deprecated/` (`CLAUDE.md:1-7`; `skills/deprecated/README.md:3`). Only the first two are **promoted**: 27 skills, which is exactly the plugin's `skills` array (`.claude-plugin/plugin.json:21-49`).
- **One axis for invocation.** "**User-invoked** skills are reachable only when you type them … **Model-invoked** skills can be invoked by you _or_ reached for automatically" (`README.md:211`). The README, bucket READMEs, and docs pages all group by it.
- **A router that is not allowed to lie.** `ask-matt` maps every user-reachable skill into one main flow, two on-ramps, and standalones (`skills/engineering/ask-matt/SKILL.md:13-97`); any skill change must re-sync it, because "a stale one it still routes to, is a router that lies" (`CLAUDE.md:21`).
- **Managed installs first.** One canonical install block, copied verbatim everywhere, leads with routes that update themselves (`.agents/install-block.md:3-18`). Claude Code installs from the official marketplace with one command (`README.md:34-38`).
- **Closed to new skills, open to observed failures.** An issue stays open only with an observed failure that fits the philosophy (`SCOPE.md:7-12`); new-skill proposals are closed outright (`SCOPE.md:18`), and nine `.out-of-scope/` files record 27 prior rejected requests by issue number.

## Why this exists — the design bet

The bet: **small, composable skills that encode engineering fundamentals beat frameworks that own the whole process.** The README names the alternatives and the objection: "Approaches like GSD, BMAD, and Spec-Kit try to help by owning the process. But while doing so, they take away your control and make bugs in the process hard to resolve" (`README.md:17`). The answer is skills that are "small, easy to adapt, and composable" (`README.md:19`), organized around four failure modes: misalignment (`README.md:113-128`), verbosity cured by a shared domain language (`README.md:130-158`), code that doesn't work cured by feedback loops (`README.md:167-183`), and the "ball of mud" cured by caring about module design (`README.md:185-203`).

A second bet sits under the governance: **every skill is permanent maintenance surface, so the catalog stays small.** "Every skill is permanent maintenance surface: it has to stay in step with the others, with the docs pages, with `ask-matt`'s routing map, and with the plugin manifest" (`.out-of-scope/new-skills.md:7`). The test for a new skill is composability: "if you can compose the behaviour from existing skills, it doesn't get a new skill" (`.out-of-scope/new-skills.md:9`).

## What's inside

```
mattpocock-skills/
├── README.md, SCOPE.md, CONTRIBUTING.md, GLOSSARY.md, CHANGELOG.md
├── CLAUDE.md  (AGENTS.md is a symlink to it)    repo invariants for agents
├── .agents/
│   ├── install-block.md      canonical install wording, per harness
│   ├── invocation.md         user- vs model-invoked, Skill-tool dependency rule
│   ├── writing-docs.md       docs-page template and "done when" list
│   └── adr/0001-…, 0002-…    setup-pointer split; ship as a plugin
├── .out-of-scope/            9 recorded rejections, each with prior issue numbers
├── .claude-plugin/plugin.json, marketplace.json
├── .changeset/  .github/{ISSUE_TEMPLATE,workflows}/
├── docs/{engineering,productivity}/<skill>.md   human-facing pages (28)
├── scripts/link-skills.sh, check-frontmatter.mjs, sync-plugin-version.mjs
└── skills/
    ├── engineering/   20  (11 user-invoked, 9 model-invoked)   promoted
    ├── productivity/   7  (5 user-invoked, 2 model-invoked)    promoted
    ├── in-progress/    8  beta, public, not in the plugin
    ├── misc/           4  frozen
    └── deprecated/     0  empty by policy
```

Every skill folder carries an `agents/openai.yaml` beside `SKILL.md` for Codex picker metadata (`.agents/invocation.md:10`). `SKILL.md` files run from 7 lines (`grill-me`, `grill-with-docs`, `wait-what`) to 170 (`pr`). The two grill skills are pure composition: `grill-with-docs` is one line, "Call the Skill tool twice, for "grilling" and "domain-modeling"" (`skills/engineering/grill-with-docs/SKILL.md:7`).

## How it scores against the study checklist

### Shape: grouped by maturity, not by domain

Buckets mean *how much the author stands behind a skill*, not what it is about: `engineering/` is "daily code work", `misc/` is "kept around but rarely used, not promoted", `in-progress/` is "beta: public on purpose, feedback wanted, not shipped in the plugin" (`CLAUDE.md:3-7`). Promotion is a bundle of obligations. A promoted skill must appear in the top-level README with a link to its `SKILL.md`, in `plugin.json`'s `skills` array, and in a docs page; non-promoted skills must appear in none of them (`CLAUDE.md:9,13,17`). Graduation is a release event: 1.3.0 "Graduate[s] **`implement-spec`** into the **Engineering** bucket, so it ships in the Claude Code plugin, gets a docs page, and is routed by `ask-matt`" (`CHANGELOG.md:57`).

Retirement is explicit too. `misc/` is frozen: "Bug reports, feature requests and PRs against them are closed", because the author isn't running them and "can't tell whether a fix is right" (`.out-of-scope/frozen-misc-skills.md:3,7`). `deprecated/` is empty because "a retired skill is deleted, and the changeset that removes it names whatever replaced it" (`skills/deprecated/README.md:3`). A removed promoted skill keeps its docs page, marked archived, so the published URL still resolves (`.agents/writing-docs.md:7`); `docs/engineering/resolving-merge-conflicts.md:1` is one.

### Layers: orchestrators on top, disciplines underneath, vocabulary at the bottom

The invocation split doubles as a layering rule. User-invoked skills "orchestrate"; model-invoked skills "hold the reusable discipline"; "A user-invoked skill may invoke model-invoked skills, but never another user-invoked one" (`README.md:211`; `.agents/invocation.md:8`). `ask-matt` names a third layer, "Vocabulary underneath": `domain-modeling` and `codebase-design`, "each the single source of truth for its vocabulary" (`skills/engineering/ask-matt/SKILL.md:62-67`). `grilling` is the shared interview primitive behind five other skills (`README.md:257`).

Cross-references follow one rule: name the Skill tool, never link across folders. "Dependencies are expressed as an explicit instruction to **call the Skill tool** with the named skill … not deep `../other-skill/FILE.md` cross-references, and not a bare `/skill`-style mention" (`.agents/invocation.md:16`). One skill per call (`:20`). A user-invoked dependency becomes an instruction to the human: "tell the user to run `/setup-matt-pocock-skills`" (`:22`). ADR 0001 adds a hard/soft split: only skills whose output is *wrong* without per-repo config carry the setup pointer; the rest degrade gracefully and stay "token-light" (`.agents/adr/0001-explicit-setup-pointer-only-for-hard-dependencies.md:5-10`). The pointer text appears verbatim in six skills (e.g. `skills/engineering/to-spec/SKILL.md:9`).

Per-repo state lives in the user's repo, not the pack. `/setup-matt-pocock-skills` writes `docs/agents/issue-tracker.md`, `domain.md`, and `triage-labels.md` and a pointer block into the project's agent file (`skills/engineering/setup-matt-pocock-skills/SKILL.md:49,70,93-104`). The pack's own `GLOSSARY.md` fixes its shared terms (Issue tracker, Issue, Decision ticket, Triage role) with "_Avoid_" lists (`GLOSSARY.md:7-19`).

### Install: one block, six harnesses, managed first

| Harness | Route | Updates itself? | Source |
|---|---|---|---|
| Claude Code | `@claude-plugins-official` | Yes, by default | `.agents/install-block.md:13` |
| Codex | `@mattpocock` marketplace | Yes, at startup | `:14` |
| Copilot CLI | `@mattpocock` marketplace | After a one-time `autoUpdate: true` | `:15` |
| VS Code | Install Plugin From Source | Yes, daily | `:16` |
| Gemini CLI | `gemini skills install --path` per promoted bucket | No | `:17,76` |
| Everyone else | skills.sh (`npx skills@latest add`) | No | `:18,91-99` |

The block is enforced as text: "`README.md`, `.changeset/*`, and every page under `docs/` must say **this** and nothing else. Change it here first, then propagate" (`.agents/install-block.md:3`). Untested harnesses are named as untested: "Nobody has run Auggie, Droid, Qwen or Goose against this repo" (`:22`). The two routes are declared exclusive because installing both gives "every skill twice" (`:121`; `README.md:27`).

ADR 0002 records why the plugin took until v1.2: bucketed folders didn't fit Codex's single-path `skills` field, and Codex drops symlinks on install (`.agents/adr/0002-ship-as-a-claude-code-plugin.md:7-17`). Its dated updates record acceptance into Claude Code's official marketplace (`:30-41`) and Codex later accepting an array (`:43-47`). Versioning is automated: changesets drive a "chore: version skills" PR, and `npm run version` copies `package.json`'s version into `plugin.json` (`package.json:13`; `scripts/sync-plugin-version.mjs:1-4`; `.github/workflows/release.yml:29-35`). CI parses every `SKILL.md` frontmatter with the same YAML parser the skills.sh installer uses (`scripts/check-frontmatter.mjs:1-2`; `.github/workflows/check.yml:27-28`).

`scripts/link-skills.sh` symlinks skills into `~/.claude/skills` and `~/.agents/skills`, skipping `misc/` and `deprecated/` but deliberately including `in-progress/` "because this local install is exactly where that feedback loop runs" (`scripts/link-skills.sh:18-31`). It is labelled "dev-only … not a supported installer" (`:4-6`). In-progress skills reach outsiders only by name, one at a time (`skills/in-progress/README.md:5-9`).

### Triggering: description style depends on who invokes

For user-invoked skills, "The `description` is **human-facing** … Strip trigger lists"; for model-invoked ones it "keeps rich trigger phrasing … so auto-invocation fires" (`.agents/invocation.md:5-6`). The contrast is visible: `wait-what` is "Stop. That last message did not land: re-pitch it." (`skills/productivity/wait-what/SKILL.md:3`), while `tdd` reads "Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor"" (`skills/engineering/tdd/SKILL.md:3`). User-invoked status is set twice and must agree: `disable-model-invocation: true` for Claude Code, `policy.allow_implicit_invocation: false` for Codex (`.agents/invocation.md:5,10`; `skills/engineering/ask-matt/agents/openai.yaml:4-5`). The test for keeping a skill model-invoked: "_could the model usefully reach for this autonomously?_ (Reuse is the reason to extract a skill, not the test.)" (`.agents/invocation.md:6`).

Because most skills are user-invoked, the human is the trigger index, and the pack spends effort on that index. Docs pages exist to relieve "cognitive load": "you are the index that has to remember they exist … The pages are collectively a distributed router; each is a node" (`.agents/writing-docs.md:5`). `ask-matt` is the central node. It reads a skill's `SKILL.md` before describing it, since its summaries "are for orientation only" (`skills/engineering/ask-matt/SKILL.md:11`), a rule added in 1.3.2 after an issue (`CHANGELOG.md:7`).

Name collisions with harness built-ins are not solved by renaming; the answer is namespaced invocation such as `/mattpocock-skills:code-review` (`.out-of-scope/harness-name-collisions.md:3,11-16`), with five prior requests recorded (`:24-28`).

### Sync: not a mirror

This is upstream, not a fork, so there is nothing to sync from. The inward sync problem is consistency among its own surfaces, and the repo answers it with written invariants rather than generation: README, bucket README, plugin manifest, docs page, and `ask-matt` must all agree (`CLAUDE.md:9-21`). Only two of those are checked by machine (frontmatter parse; plugin version via `check-plugin-version`, `package.json:14`). The rest rely on the agent reading `CLAUDE.md`, and the pinned tree shows small drift: `skills/in-progress/README.md:11-17` lists 7 of the 8 in-progress skills (no `chief-of-staff`); `SCOPE.md:24-31` lists 8 of the 9 `.out-of-scope/` files (no `lazy-load-writing-for-agents.md`); ADR 0002 still mentions a `personal/` bucket the tree doesn't have (`.agents/adr/0002-ship-as-a-claude-code-plugin.md:9`).

## Governance in detail

| Mechanism | What it does | Source |
|---|---|---|
| The bar | Issue stays open only with an observed failure from a real session *and* a fit with the philosophy; "Reactions and +1 comments do not count" | `SCOPE.md:7-12` |
| Bucket rules | `misc/` issues all closed; new skills closed | `SCOPE.md:14-18` |
| Recorded rejections | One file per rejected concept, with the reasoning and every prior issue number | `.out-of-scope/*.md`; e.g. `question-limits.md:3-18` |
| Routing of requests | Bugs and changes are issues; questions, new skills, and harness or tracker support go to Discussions; PRs open to collaborators only | `CONTRIBUTING.md:7-15`; `.github/ISSUE_TEMPLATE/config.yml:1-14` |
| AI-written issues | One problem per issue, short, repro first, no pasted specs or rewritten `SKILL.md` files | `CONTRIBUTING.md:17-25` |
| Issue template | Required checkboxes for reading `SCOPE.md`, one problem, duplicate search; required "What went wrong" with harness and model | `.github/ISSUE_TEMPLATE/idea.yml:14-38` |
| needs-info | One round of questions, then closed after 14 days, never auto-staled | `SCOPE.md:33-35`; `.github/workflows/needs-info.yml:3-6,22-32` |
| Changelog | Changesets entries cite PR, commit, and the originating issue | `CHANGELOG.md:7-45` |
| House prose rules | No em-dashes anywhere; every subagent starts with a fresh context window | `CLAUDE.md:25-27` |

The rejections are the most reusable part. Each states a principle, not just a "no": tracker backends are limited to what the author runs because "Every issue-tracker backend hard-codes a CLI shape into the skills" (`.out-of-scope/mainstream-issue-trackers-only.md:13`); harness question tools are out because "Structured pickers push the model towards multiple-choice questions" (`.out-of-scope/native-question-tool.md:9`); recursion guards are out because "The harness should be responsible for stopping infinite subagent loops, not skills" (`.out-of-scope/subagent-recursion.md:7`). Each rejection also says where the requester's need should go instead: their own `CLAUDE.md`, a skills.sh copy, or the harness.

The docs-page contract is the other half. Every promoted skill gets `docs/<bucket>/<name>.md`, published at `aihero.dev/skills-<name>`, with four sections that make it "worth reading": What it does, When to reach for it, Common questions, It's working if (`CLAUDE.md:17`; `.agents/writing-docs.md:3,17`). "Common questions" must come from evidence (issues, changelog, the author's wiki) and "the count stays honest to the evidence" (`.agents/writing-docs.md:48-54`). Pages carry no install commands, because hand-written copies "went stale against the widget" (`:19`). The `tdd` page shows the honesty bar in practice, naming an open gap and its issue number (`docs/engineering/tdd.md:21`).

## Compared with lossless-agent-skills

Our pack is `context-v/agent-skills/` at the anchor root (pinned for this comparison at `5f47596`, 2026-11-22). Paths below are relative to that directory.

| | mattpocock-skills | lossless-agent-skills |
|---|---|---|
| Count and shape | 39 skills, five maturity buckets (`CLAUDE.md:1-7`) | 43 top-level `SKILL.md` dirs in one flat directory, plus nested vendored skills (`README.md:109-117`) |
| Catalog | README grouped by bucket, then user- vs model-invoked (`README.md:209-258`) | One table of 36 rows mixing dev conventions, Astro-site rules, VC/CRM workflows, and event prep (`README.md:20-57`); 12 shipped skills have no row (e.g. `remake-deck`, `decile-hub-connector`, `slim-file-sizes`) |
| Maturity | Promotion = README + manifest + docs page + router entry | Inline "*(Draft)*" labels on some rows (`README.md:36,52-55`); `CANDIDATES.md` backlog |
| Invocation | Every skill declared user- or model-invoked, set in two harnesses (`.agents/invocation.md:5-10`) | None of our skills uses `disable-model-invocation`; all rely on `description` (`README.md:119`) |
| Install | Self-updating plugin on 4 harnesses, skills.sh elsewhere (`.agents/install-block.md:11-18`) | Clone the whole repo into a skills dir or `pi install git:…` (`README.md:73-105`); symlink scripts for our own machines (`sync-skills-symlinks.sh:1-32`) |
| Router | `ask-matt`, kept in sync by rule | None |
| Human docs | A page per promoted skill, fixed template | The README row is the only human-facing summary |
| Scope | Written bar, closed to new skills, 9 recorded rejections | "If you find a sharper way to express it, open a PR" (`README.md:16`); "Discuss first" (`README.md:125`) |
| Versioning | Changesets, semver, `plugin.json` version synced | Dated `changelog/` entries (49 files), no version |

**Where Pocock's pack is more advanced.** It treats the pack as a product with a release process: a version, a manifest, an automated version PR, and CI that catches a frontmatter error before an installer silently skips the skill. It separates *what the author stands behind* (promoted) from *what is merely present* (misc, in-progress), and every downstream surface keys off that one distinction. And it makes invocation a deliberate choice per skill, with description style following from it.

**Where it is more usable by people outside its author.** An outsider gets one install command that keeps itself current, receives only the 27 promoted skills, can ask `ask-matt` which one to use, and can read a page per skill before trying it. An outsider installing ours clones everything, including skills that only work against our Twenty instances or our Astro sites, with no signal for which skills are general and which are Lossless-specific. Our install section also names the repo `lossless-skills` (`README.md:76,82,92`) while `CLAUDE.md` calls it `lossless-agent-skills` and says it is mounted at `context-v/skills/` (`CLAUDE.md:1,6`), which is the pre-2026-08-22 path (`sync-skills-symlinks.sh:39-40`).

**What we do that it doesn't.**

- **Public skills, private config.** A documented pattern for keeping operator particulars in a gitignored `config/private.json` with a committed example and a pre-push audit grep (`README.md:154-249`). Pocock's pack pushes all per-repo state into the user's project via a setup skill, which works for engineering conventions but has no answer for skills whose method is general and whose data is private.
- **A third-party policy.** `THIRD-PARTY.md:11-17` decides between submodule, fork, vendored copy, mined pack, and study reference, and says how our skills should depend on someone else's (`THIRD-PARTY.md:31-36`). Pocock's pack vendors nothing.
- **Multi-location discovery.** `sync-skills-symlinks.sh` finds skills anywhere in a tree of nested repos and resolves duplicate names by recency (`sync-skills-symlinks.sh:11-29`); `.stow-local-ignore` supports GNU Stow on Linux. His `link-skills.sh` serves one repo.
- **A dead-end record, informally.** `CANDIDATES.md` asks that abandoned candidates be struck through "with a one-line reason. Don't delete — the dead-end record is itself useful" (`CANDIDATES.md:179`). That is the seed of `.out-of-scope/`, though it covers our own ideas, not outside requests.
- **Breadth.** Non-engineering skills (memo analysis, CRM, events, expenses) that a single-domain pack would refuse by design.

## What we'd borrow

1. **Maturity buckets with promotion as a bundle of obligations.** At minimum a `status:` frontmatter field (draft, stable, frozen) and a README grouped by it, so outsiders can tell our stable conventions from experiments (`CLAUDE.md:1-9`; `skills/in-progress/README.md:3`).
2. **A plugin manifest that ships a curated subset.** A `.claude-plugin/plugin.json` listing only general-purpose skills, leaving client- and operator-specific ones out, would give outsiders a one-command, self-updating install (`.claude-plugin/plugin.json:21-49`; `.agents/adr/0002-ship-as-a-claude-code-plugin.md:11`).
3. **A router skill kept honest by rule.** One user-invoked skill mapping our flows (context-v, changelog, git, splash, deck work), plus a `CLAUDE.md` line requiring it be updated whenever a skill is added or renamed (`skills/engineering/ask-matt/SKILL.md:9-13`; `CLAUDE.md:21`).
4. **Declared invocation per skill.** Mark orchestration skills (event prep, deck iteration) as user-invoked and strip their trigger lists, which also shrinks always-loaded description text (`.agents/invocation.md:5-6`).
5. **`.out-of-scope/` for decisions, not just ideas.** Promote `CANDIDATES.md`'s strike-through habit into one file per rejected concept with the principle behind it (`.out-of-scope/new-skills.md:1-21`).
6. **A canonical install block.** One file holding the install wording that README and docs must copy, so `lossless-skills` vs `lossless-agent-skills` drift can't recur (`.agents/install-block.md:3`).
7. **Frontmatter CI.** Parse every `SKILL.md` with a strict YAML parser in a GitHub Action (`scripts/check-frontmatter.mjs:1-46`; `.github/workflows/check.yml:10-28`). Our `CLAUDE.md` already warns that a mismatched `name:` silently breaks triggering (`CLAUDE.md:24-25`, ours); a check would catch it.

## One-line summary

> `mattpocock/skills` is the study's governed pack: 39 MIT skills sorted by how much the author stands behind them, 27 of them promoted into a self-updating plugin with a docs page each, split into skills you type and skills the agent may reach for, routed by `ask-matt`, and protected by a written scope bar and nine recorded rejections; its consistency rests mostly on written invariants rather than checks, and the pinned tree shows three small places where those invariants have already slipped.

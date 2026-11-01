---
name: ND Skills Profile
slug: nd-skills
upstream: https://github.com/jpoindexter/nd-skills
package: "`npx skills add jpoindexter/nd-skills` for the invocable skills; `./install.sh` from a clone to also sync a managed always-on block into `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`; per-skill `agents/openai.yaml` for Codex"
license: MIT
maintainer: Jason Poindexter (`jpoindexter`)
study: studies/adhd-and-executive-function-skills
profile_path: studies/adhd-and-executive-function-skills/nd-skills
profile_kind: executive-function taxonomy skill pack with a manual router, an always-on index block, and static regression checks
title: "ND Skills — Profile"
status: Reference
authors:
  - Michael Staton
date_created: 2026-10-29
date_modified: 2026-10-31
site_uuid: 3b979b50-aeb3-4390-add0-68a250b36868
hex_code: oxo3ee
date_authored_initial_draft: 2026-10-29
date_authored_current_draft: 2026-10-29
lede: >-
  Twenty-five small skills, each named for one executive-function construct or
  barrier, kept always-on by a 24-line index block and fired by numeric
  thresholds; v2 adds a router, rules mined from 3,278 real sessions, and a
  consent budget for every unprompted nudge.
summary: >-
  Source-cited profile of `jpoindexter/nd-skills` (pinned at 8b697d1,
  v2.1.0-4-g8b697d1, MIT), the successor to the unlicensed
  `neurodivergent-agent-skills` the study used to pin, and the collection's
  executive-function taxonomy. Covers the one-skill-per-construct layout, the
  manual `nd` router and the model-invoked `nd-executive-function-router`, the
  always-on index block that `install.sh` syncs into Claude Code and Codex,
  every numeric trigger threshold, the constraint ledger, the conversation
  audit that produced the v2 guardrails, the static (phrase-presence)
  regression checks, the companion pack (`autism-layer`, `biz-weekly-review`,
  `nd-interrupt-budget`, `nd-inbox-digest`), and the working-memory threshold
  contradiction that survived the rewrite. Read it when deciding how to split
  executive-function support into skills, how to keep many skills cheaply
  always-on, or how to govern an agent that can speak unprompted.
publish: true
type: Profiles
from: "studies/adhd-and-executive-function-skills"
from_path: "context-v/profiles/Profile__ND-Skills.md"
---
# ND Skills — Profile

A profile of `nd-skills` as it lives in this study (`studies/adhd-and-executive-function-skills/nd-skills/`, pinned at `8b697d1`, `v2.1.0-4-g8b697d1`). Every claim cites a pinned path relative to the submodule. Read it alongside [[Profile__I-Have-ADHD]], [[Profile__Claude-ADHD-Skills]], [[Profile__ADHD-Claude-Skill]], [[Profile__AuDHD-Executive-Function]], [[Profile__ADHD-Copilot]], [[Profile__DSH-ADHD-Copilot]], [[Profile__ADHD-Skills]], and [[Profile__ADHD-Study-Coach]]. This entry is the study's taxonomy: it splits executive-function support into many narrow skills and gives most of them a number that says when to fire.

## TL;DR

- **25 skills, one per barrier.** The README counts "24 focused behaviors plus one manual router" (`README.md:3`), tabled at `README.md:74-100`. Fourteen are the original `nd-*` constructs (inhibition, set-shifting, working memory, time blindness, …); v2.0 added six (router, functional minimums, decomposition, goal persistence, environment scaffold, emotion regulation) (`README.md:23-25`); v2.1 added the manual `nd` router (`README.md:19-21`); v2.2 added a four-skill "companion pack" (`README.md:14-16`).
- **Two layers of triggering.** The skills are invocable on their own, and `install.sh` syncs a 24-line index of one-sentence rules into `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` between HTML-comment markers (`install.sh:103-127`; `templates/claude-always-on.md:1-30`). The block "routes only from explicit task signals; it does not load every full skill body into every response" (`README.md:52`).
- **Numbers everywhere.** 8 research turns, 10 turns of hyperfocus, 3 failed attempts, 3 options, <15% word overlap, 5:1 capture:ship, 2.5× estimates, 3 nudges a day (full table below).
- **v2 is evidence-driven.** A redacted mining script scanned 3,278 local Claude and Codex session files and found four confirmed failure clusters (constraint loss, stopping at milestones, completion claims beyond evidence, asking what the repo could answer), each mapped to specific skill edits (`docs/conversation-audit-2026-07-21.md:5-67`).
- **The regression "evals" are static.** `scripts/check_behavior_regressions.py` checks only that required phrases still appear in the named `SKILL.md` files (`scripts/check_behavior_regressions.py:19-30`). The audit doc says so: "These static checks prove rule coverage, not future model compliance" (`docs/conversation-audit-2026-07-21.md:79`).
- **The working-memory contradiction persists.** The skill re-states context "When context grows long (> 15 turns)" (`skills/nd-working-memory/SKILL.md:42`); the always-on block says "re-state active context every 5 turns in sessions longer than 10 turns" (`templates/claude-always-on.md:18`), and the README repeats the block's version (`README.md:104`).

## Why this exists — the design bet

The bet: **executive function is not one thing, so an agent should carry one small, separately triggerable rule per construct, and most rules should fire on a countable signal rather than on the model's judgment.** Each original skill opens with a "What this addresses" section naming the construct (for example "Inhibitory control: the executive function that stops you from acting on impulse", `skills/nd-inhibit/SKILL.md:8-10`; "Cognitive flexibility (set shifting)", `skills/nd-setshift/SKILL.md:8-10`) and a "Science basis" section explaining why the threshold is what it is (`skills/nd-inhibit/SKILL.md:42-46`).

v2 adds a second bet on top: **diagnosis-free, state-based support.** The README tagline changed to "Diagnosis-free neurodivergent-support behaviors" (`README.md:8`), and every always-on block opens "Apply these patterns from explicit task state without requiring diagnostic disclosure. Keep support proportional and user-controlled." (`templates/claude-always-on.md:4`). The router treats state "as temporary and user-controlled, never as a diagnosis or identity" (`skills/nd-executive-function-router/SKILL.md:8`), and several skills forbid inferring capacity "from terse writing, typos, silence, or communication style alone" (`skills/nd-executive-function-router/SKILL.md:37`; `skills/nd-emotion-regulation/SKILL.md:36`; `skills/nd-sensory-load/SKILL.md:64`).

Three refusals define scope:

- **No user profile.** "No source text, diagnostic assessment, or personal profile is bundled." (`README.md:126`). Persisted state is task state only: "Store task state, not diagnoses, inferred traits, or unnecessary private biography." (`skills/nd-working-memory/SKILL.md:73`).
- **No coaching ritual.** The router is for users who want support "without wanting an intake or coaching ritual" (`skills/nd-executive-function-router/SKILL.md:3`), and must "Not turn support into an assessment questionnaire" (`:29`). The manual router must "not return a catalog, assessment, or coaching questionnaire" (`skills/nd/SKILL.md:28`).
- **No blocking.** "Never block." recurs as a rule (`skills/nd-research-gate/SKILL.md:42`; `skills/nd-complexity-gate/SKILL.md:51`; `skills/nd-inhibit/SKILL.md:40`).

## What changed from `neurodivergent-agent-skills`

The predecessor is not in this submodule, but the history shows the line of descent. The first two commits (both 2026-07-13, co-authored by Claude Sonnet 4.6) are "initial release" with 16 files (14 `SKILL.md`, `README.md`, `LICENSE`) and "port install.sh and companion files from predecessor repo" (`git log 8d945e3`, `2af5685`). The initial README described "14 agent skills … executive-function guards for ADHD, autism, and dyslexia" (`git show 8d945e3:README.md:3-5`).

| Change | Before (`8d945e3` / `2af5685`) | Now (`8b697d1`) |
|---|---|---|
| License | none in the predecessor | MIT (`LICENSE:1-3`) |
| Skill count | 14 | 25 (`README.md:3`) |
| Always-on block | inline heredoc in `install.sh` | separate `templates/claude-always-on.md` and `templates/codex-always-on.md`, synced by an awk block-replacer that preserves surrounding content (`install.sh:16-85`) |
| Framing | "guards for ADHD, autism, and dyslexia" | "Diagnosis-free" (`README.md:8`) |
| Research-gate reset | a "command executed that changed state" or "test run" reset the count | read-only commands "do not reset the counter merely because a tool or shell command ran" (`skills/nd-research-gate/SKILL.md:22-28`) |
| Research-gate "build it now" | ask the user to name one finding | implement the clear recommendation; ask only when findings differ materially (`skills/nd-research-gate/SKILL.md:38`) |
| Frontmatter | `tags:` arrays | `tags:` removed; Codex metadata moved to `agents/openai.yaml` for the 11 newer skills |
| Evidence | none | conversation audit, mining script, regression cases (`docs/`, `scripts/`, `evals/`) |

The two templates are identical apart from the marker comments and heading (`templates/claude-always-on.md:1-2,30` vs `templates/codex-always-on.md:1-2,30`).

## What's inside this submodule

```
nd-skills/
├── skills/
│   ├── nd/                              manual router (/nd, $nd), explicit-only
│   ├── nd-executive-function-router/    model-invoked router
│   ├── nd-{choicereduce,closuregate,complexity-gate,hyperfocus-guard,inhibit,
│   │      research-gate,selfmonitor,sensory-load,setshift,task-initiation,
│   │      taskboundary,time-blindness,velocity-check,working-memory}/   the original 14
│   ├── nd-{functional-minimums,task-decomposition,goal-persistence,
│   │      environment-scaffold,emotion-regulation}/                    v2.0 additions
│   └── autism-layer/ biz-weekly-review/ nd-interrupt-budget/ nd-inbox-digest/   v2.2 companion pack
│       (11 of the 25 also carry agents/openai.yaml)
├── templates/claude-always-on.md, codex-always-on.md   24-line always-on index
├── install.sh                         copies skill folders, syncs the managed block
├── evals/behavior-regressions.json    12 phrase-presence cases
├── scripts/check_behavior_regressions.py   static checker (49 lines)
├── scripts/audit_conversations.py     redacted JSONL miner (400 lines)
└── docs/conversation-audit-2026-07-21.md
```

The whole repo is 2,337 lines; the 25 `SKILL.md` files run 30 to 87 lines each (`skills/nd-inbox-digest/SKILL.md` is shortest, `skills/nd-working-memory/SKILL.md` longest).

## How it scores against the study checklist

### Locus of intervention: output, task flow, and a little persisted task state

All three loci appear, split by skill. **Output shape:** `nd-sensory-load` sets default density ("One idea per paragraph", "No paragraphs longer than 4 lines", `skills/nd-sensory-load/SKILL.md:25-30`) and `nd-choicereduce` caps visible options (`skills/nd-choicereduce/SKILL.md:32-42`). **Task flow:** gates and guards interrupt research spirals, drift, hyperfocus, and retry loops. **State:** `nd-working-memory` keeps a "constraint ledger" of Target, Must, Must not, Authority, Done evidence (`skills/nd-working-memory/SKILL.md:25-37`) and, when interruption risk is material, persists it "in the project's existing task, handoff, roadmap, or notes system" (`:57-71`).

v2 shifts the weight toward the agent's own reliability: goal persistence ("Carry the finish line, not just the current step", `skills/nd-goal-persistence/SKILL.md:8`), evidence classes `executed` / `code-path` / `assumed` (`:37-42`), and restart packets that refresh "live state and authority before acting" (`skills/nd-task-decomposition/SKILL.md:20-21`). These are as much agent-quality rules as ND supports.

### Triggering: three paths

| Path | Mechanism | Source |
|---|---|---|
| Always-on index | `install.sh` writes one rule line per skill into `CLAUDE.md` / `AGENTS.md` between markers | `install.sh:103-127`; `templates/claude-always-on.md:6-29` |
| Model invocation | each skill's `description`; Codex `allow_implicit_invocation: true` on 10 of the 11 `openai.yaml` files | e.g. `skills/nd-interrupt-budget/agents/openai.yaml:6-7` |
| Manual router | `/nd [task]` (Claude Code), `$nd [task]` (Codex); `status` and `off` controls | `README.md:54-63`; `skills/nd/SKILL.md:39-43` |
| Router stays explicit | `allow_implicit_invocation: false`, enforced by the regression script | `skills/nd/agents/openai.yaml:6-7`; `scripts/check_behavior_regressions.py:32-36` |

The manual router picks "one primary sibling skill and at most two supporting skills" and reads their `SKILL.md` files before applying them (`skills/nd/SKILL.md:14`), then states the route in one line and executes (`:28`). `off` stops optional scaffolds but keeps "safety, explicit constraints, and required agent instructions" (`:42`). The installer refreshes the block on every run and handles a legacy tail from older block layouts (`install.sh:41-71`).

### Trigger heuristics: the exact numbers

| Threshold | Skill | Source |
|---|---|---|
| 8+ consecutive research turns without a file, artifact, deliverable test, commit, or deploy | `nd-research-gate` | `skills/nd-research-gate/SKILL.md:16-28,42`; `templates/claude-always-on.md:12` |
| 10+ consecutive turns deep in one area; "Do not interrupt until turn 10+" | `nd-hyperfocus-guard` | `skills/nd-hyperfocus-guard/SKILL.md:17,38` |
| Same error 3+ times; 3+ similar tool calls; >20 tool calls in a debug session | `nd-setshift` | `skills/nd-setshift/SKILL.md:17-20` |
| 3 more failures after the pivot → second pivot | `nd-setshift` | `skills/nd-setshift/SKILL.md:46-47` |
| 3 similar failed attempts → hand off to `nd-setshift` | `nd-goal-persistence` | `skills/nd-goal-persistence/SKILL.md:57` |
| 3 consecutive off-goal actions → name the drift | `nd-inhibit` | `skills/nd-inhibit/SKILL.md:37-38,46` |
| >3 options → show top 3, "show 3 more" on request | `nd-choicereduce` | `skills/nd-choicereduce/SKILL.md:22,32-44` |
| <15% word overlap; new vocabulary absent from the last 5 turns | `nd-taskboundary` | `skills/nd-taskboundary/SKILL.md:22-25` |
| Item >50% complete (50-80% band) → one question, exactly 3 answers | `nd-closuregate` | `skills/nd-closuregate/SKILL.md:18,33-41` |
| 2+ complexity signals → suggest planning | `nd-complexity-gate` | `skills/nd-complexity-gate/SKILL.md:16,38` |
| 7-day capture:ship ratio >5:1 (or ships = 0); "healthy" ≈ 3:1 | `nd-velocity-check` | `skills/nd-velocity-check/SKILL.md:28-35,47` |
| Best case × 2.5 = realistic estimate | `nd-time-blindness` | `skills/nd-time-blindness/SKILL.md:38-43` |
| Task >3 steps; conversation >10 turns → apply | `nd-working-memory` | `skills/nd-working-memory/SKILL.md:17-18` |
| Re-state context at >15 turns | `nd-working-memory` (skill body) | `skills/nd-working-memory/SKILL.md:42` |
| Re-state every 5 turns in sessions >10 turns | `nd-working-memory` (always-on block, README) | `templates/claude-always-on.md:18`; `README.md:104` |
| Context >70% full → offer to compress | `nd-sensory-load` | `skills/nd-sensory-load/SKILL.md:50` |
| Paragraphs ≤4 lines; one bold item per reply | `nd-sensory-load` | `skills/nd-sensory-load/SKILL.md:29-30` |
| "5-minute version" warm-up for frozen sessions | `nd-task-initiation` | `skills/nd-task-initiation/SKILL.md:56-57` |
| ≤1 activation bridge | `nd-task-initiation` | `skills/nd-task-initiation/SKILL.md:44` |
| 1 primary + ≤2 supporting skills | `nd` | `skills/nd/SKILL.md:14,48` |
| ≤3 nudges per local day (person-set); never twice within 30 min; same reason ≤1/day; 1 pending at a time | `nd-interrupt-budget` | `skills/nd-interrupt-budget/SKILL.md:15-17,26` |
| ≤3 actions; example window "unread, last 7 days, … at most 15"; body excerpt e.g. "first 300 characters" | `nd-inbox-digest` | `skills/nd-inbox-digest/SKILL.md:15,18,20` |
| Exactly 4 labelled lines; ≤2 options | `autism-layer` | `skills/autism-layer/SKILL.md:14,17` |
| 3+ fronts in a week is "the violation"; ≤3 commitments for next 7 days; 1 hard recommendation | `biz-weekly-review` | `skills/biz-weekly-review/SKILL.md:21,24` |

The README now admits that turn counts are a proxy: "A turn count is the only signal a chat agent has, and it is a weak proxy for what those skills are about (time lost, attention gone elsewhere)" (`README.md:104`). It proposes three host-supplied "ambient signals" (idle time, front app, clock) so a rule "can say '20 minutes' instead of '8 turns'" (`README.md:106-108`), with Heel, a macOS companion, as the example host (`README.md:110`).

### The working-memory contradiction

It persists, and v2 spread it. The skill body still applies at "past 10 turns" (`skills/nd-working-memory/SKILL.md:18`) but re-states only "When context grows long (> 15 turns)" (`:42`), which the initial release also said (`git show 8d945e3:skills/nd-working-memory/SKILL.md:36`). The predecessor's `install.sh` block said "every 5 turns in sessions longer than 10 turns" (`git show 2af5685:install.sh:45,84`). The same wording now sits in both templates (`templates/claude-always-on.md:18`; `templates/codex-always-on.md:18`) and in the new "Ambient signals" section ("`nd-working-memory` every 5 turns", `README.md:104`). Because the always-on block is what loads every session and the body loads only on invocation, the block's 5-turn cadence is the one most sessions will follow. The regression cases do not cover this threshold (`evals/behavior-regressions.json:4-75`).

The README flags a second gap in the same skill: it names "one durable working surface but this repo gives it no schema", and proposes `outcome`, `target`, `must`, `must_not`, `authority`, `done_evidence` without adding it (`README.md:112`).

### State: task state in the user's own files, never a profile

There is no store of its own. `nd-working-memory` writes to the project's existing notes and forbids a parallel plan: "Use one working surface. Update the existing source of truth rather than maintaining a second contradictory plan … Do not claim the memory is durable until the target file or store has been read back." (`skills/nd-working-memory/SKILL.md:71`). `nd-setshift` reads prior failure logs such as "ERRORS.md or similar" before a complex fix (`skills/nd-setshift/SKILL.md:22,26-30`). `nd-velocity-check` tracks captures and ships "mentally (or read them from a log if available)" (`skills/nd-velocity-check/SKILL.md:24`). The companion pack is written against a host's task lists and actions (`park_idea`, `add_task`, `say`, `actions`) and tells a plain agent to map them to its own equivalents (`skills/biz-weekly-review/SKILL.md:29-31`; `skills/autism-layer/SKILL.md:22-24`).

### Grounding: practitioner books, a few papers, and the author's own logs

The README lists seven sources, from Dawson and Guare's *Smart but Scattered* to Oxford's NESTL toolkit (`README.md:114-124`), and each v2 skill ends with a "Source Basis" naming which ones it paraphrases (e.g. `skills/nd-functional-minimums/SKILL.md:46-48`). Older skills cite specific research inline: Rabinovici et al. 2015 for inhibition (`skills/nd-research-gate/SKILL.md:46`), Schwartz 2004 for choice (`skills/nd-choicereduce/SKILL.md:50`), Sweller 1988 for cognitive load (`skills/nd-sensory-load/SKILL.md:68`), Kahneman and Tversky for the planning fallacy (`skills/nd-time-blindness/SKILL.md:65`). Some thresholds are justified by assertion rather than citation: the 2.5× rule is "a rough empirical correction based on … Hofstadter's Law and variations" (`skills/nd-time-blindness/SKILL.md:67`), and the 5:1 ratio "is approximate" (`skills/nd-velocity-check/SKILL.md:47`). `biz-weekly-review` borrows from James Clear, Gary Keller, and Gay Hendricks (`skills/biz-weekly-review/SKILL.md:37-39`).

The most distinctive grounding is empirical and personal: the audit of the author's own archives.

### Tone rules and anti-nag

- **Name once, never moralize.** Hyperfocus: "Name the hyperfocus session (once, gently)" and "Never moralize. Hyperfocus is not a failure." (`skills/nd-hyperfocus-guard/SKILL.md:25,40`). Velocity: "Surface it once and move on." (`skills/nd-velocity-check/SKILL.md:37`).
- **One question, one-tap dismiss.** Closure gate: "On 'skip': Proceed immediately. No second question." (`skills/nd-closuregate/SKILL.md:42`).
- **No invented urgency.** "Use urgency only when a real deadline already exists. Never invent consequences." (`skills/nd-task-initiation/SKILL.md:51`); the router bans "manufacture urgency, gamify pressure, moralize output, or create praise dependence" (`skills/nd-executive-function-router/SKILL.md:38`).
- **Invitations, not orders.** `autism-layer` bans "you should", "you need to", "just do" (`skills/autism-layer/SKILL.md:17`).
- **No praise.** "No praise, no streaks, no 'great week'." (`skills/biz-weekly-review/SKILL.md:27`).
- **Silent unless budgeted.** `nd-interrupt-budget` is the study's most explicit anti-nag rule set: silent by default, a person-set budget that is "never inferred" and cannot be earned back from behaviour (`skills/nd-interrupt-budget/SKILL.md:14-20`), and "Do not describe the budget as a limit on the person; it is a limit on the agent." (`:27`). Activity signals "only say when not to speak" (`:20`).
- **Less self-announcement.** The audit counted 6,115 visible self-monitor markers in 61,279 Codex assistant messages and tightened `nd-selfmonitor` so routine reversible edits are checked silently (`docs/conversation-audit-2026-07-21.md:71`; `skills/nd-selfmonitor/SKILL.md:23,40-44`).

Some older skills still use emoji markers in their scripted lines (💡, 📊, ⚠, ↩; e.g. `skills/nd-hyperfocus-guard/SKILL.md:26`, `skills/nd-velocity-check/SKILL.md:32`), which sits awkwardly with `nd-sensory-load`'s "compressed, predictable" default.

### Packaging

Plain `SKILL.md` folders plus `agents/openai.yaml` for 11 of them, installed by `npx skills add` or by `install.sh` (`README.md:30-46`). The installer copies "complete skill folders including `agents/openai.yaml` metadata" (`README.md:46`; `install.sh:87-101`) and honours `ND_SKILLS_TARGET_HOME` for testing (`install.sh:9`). There are no hooks, no plugin manifests, and no per-harness ports beyond Claude Code and Codex.

## The conversation audit and the regression checks

`scripts/audit_conversations.py` streams `~/.claude/projects/**/*.jsonl` and `~/.codex/{sessions,archived_sessions}` (`scripts/audit_conversations.py:326-367`), matches user corrections against regexes such as `constraint_miss`, `premature_completion`, `stopped_before_goal` (`:22-97`), and redacts emails, `/Users/` paths, UUIDs, URLs, and tokens before storing excerpts (`:133-138`). Its docstring: "never copies full messages, tool results, hidden reasoning, or file contents" (`:2-5`).

The recorded run covered 3,278 session files, 13.2 GB, 90,248 assistant messages, and 9,751 user messages (`docs/conversation-audit-2026-07-21.md:5-11`). The authors treat matches as "retrieval candidates, not automatic proof" (`:19`). Confirmed clusters and the fixes they drove:

| Cluster | Evidence | Fix |
|---|---|---|
| Constraints lost across execution | 128 correction messages | constraint ledger in `nd-working-memory`; target + must-not checks in `nd-inhibit` (`:23-33`) |
| Stopping at milestones | 9 explicit, 232 generic "continue" prompts | new `nd-goal-persistence` (`:35-45`) |
| Completion claims beyond evidence | 3 paired corrections | all-executed evidence rule (`:47-56`) |
| Asking what the environment could answer | 2 paired, 16 candidates | inspect-before-asking in four skills (`:58-67`) |

`evals/behavior-regressions.json` holds 12 cases, each a scenario, a skill list, and required phrases (`evals/behavior-regressions.json:3-76`). The checker only confirms those phrases still appear in the skill text (`scripts/check_behavior_regressions.py:19-30`). The audit doc is already stale about it: it describes "six conversation-derived synthetic cases … plus a manual-router invocation case" (`docs/conversation-audit-2026-07-21.md:77`), but the four companion-pack cases were added later (`evals/behavior-regressions.json:52-75`). Compare [[Profile__I-Have-ADHD]], whose evals generate and blind-judge real responses.

## Mental model for using it well

1. **Read the always-on block as the real spec.** It is what loads every session (`README.md:52`), and where it disagrees with a skill body (working memory), the block wins in practice.
2. **Use the ledger even without the rest.** Outcome, Target, Must, Must not, Authority, Done evidence (`skills/nd-working-memory/SKILL.md:25-37`; `skills/nd/SKILL.md:13`) is the piece the audit shows earning its keep.
3. **Treat the counts as defaults.** The authors call turn counts "a weak proxy" (`README.md:104`); swap in clock time if your host has it.
4. **Expect overlaps.** `nd-research-gate`, `nd-hyperfocus-guard`, and `nd-inhibit` all detect drift from slightly different signals (8 turns, 10 turns, 3 actions); the router exists to pick one (`skills/nd/SKILL.md:22,48`).
5. **Port `nd-interrupt-budget` to anything that can speak first.** It is host-agnostic and written as rules plus a completion check (`skills/nd-interrupt-budget/SKILL.md:12-31`).

## How this compares to the rest of the study

Sibling cells summarize each sibling profile's findings; see those profiles for path-level citations.

| | nd-skills | i-have-adhd | claude-adhd-skills | adhd-claude-skill | audhd-executive-function | adhd-copilot | dsh-adhd-copilot | adhd-skills | adhd-study-coach |
|---|---|---|---|---|---|---|---|---|---|
| **Locus** | Output + task flow + task-state ledger, per EF construct | Agent output only | Time awareness + reminders + journaling | Session flow (outcome first, park drift) | Whole daily system (HTML workbench) | Coaching + adaptive profile | Behavioral coaching via one tool | Ritual reviews over org-mode | Study sessions |
| **Trigger** | Always-on index block + model-invoked + manual `/nd` | User-invoked; opt-in SessionStart hook | `UserPromptSubmit` hooks | `/adhd` subcommands | Daily run | Co-triggered profile tracker | `adhd_breakdown` keyword router | Ritual commands | Router-picked modes |
| **Signature number** | 8 turns, 10 turns, 3 errors, 3 options, <15% overlap, 3 nudges/day | ≤5 list items; 3 "still broken" turns | — | — | 48 h / 7 d / 14 d | 4+ threads, ≤2 checkpoints | <60 s steps | 30-minute target | 1/3/7/16/35/90-day ladder |
| **State** | User's existing notes; no profile | None (on/off bit) | SQLite + Obsidian | `~/.claude/adhd/` JSON + `parked.md` | User profile file | Consented, re-uploaded profile | — | org-mode files (read only) | JSON or Progress Card |
| **Evidence of effect** | Session-archive audit; static phrase checks | Blind-judged evals | — | — | — | — | — | 28 ADRs | Evidence-graded `RESEARCH.md` |
| **License** | MIT | MIT | MIT | MIT | MIT | none | MIT | CC-BY-SA-4.0 | MIT |

Two contrasts are worth keeping:

- **Against [[Profile__I-Have-ADHD]]:** both cap output, but i-have-adhd applies limits to one reply's shape, while nd-skills applies them to conversation history to decide *when* to step in. Both found the same debugging threshold: three failed attempts (`skills/nd-setshift/SKILL.md:17`).
- **Against [[Profile__ADHD-Copilot]] and [[Profile__AuDHD-Executive-Function]]:** those keep a user profile; nd-skills refuses one (`README.md:126`) and stores only task state. `nd-interrupt-budget` also answers the question [[Profile__Claude-ADHD-Skills]]'s nudges leave open: who decides how often the agent may speak.

## How this compares to our own work

**`talk-normal`** (`context-v/agent-skills/talk-normal/skill/SKILL.md` at the anchor root) uses the same install mechanism: an idempotent script writes a delimited block into `AGENTS.md` and replaces it in place on re-run (`talk-normal/skill/SKILL.md:17,29`), exactly what `sync_managed_block` does (`install.sh:16-85`). Overlap and conflict:

- Both lead with the answer and cut length (`talk-normal/skill/SKILL.md:42`; `skills/nd-sensory-load/SKILL.md:54,57`).
- talk-normal bans "conditional next-step menus" (`talk-normal/skill/SKILL.md:43`). nd-skills scripts several: closure gate's three options (`skills/nd-closuregate/SKILL.md:37-41`), hyperfocus guard's three branches (`skills/nd-hyperfocus-guard/SKILL.md:30-33`). Installed together, they disagree on how an interruption should end.

**`hope-ai`'s `personal-strategic-plan` skill** (`ai-labs/hope-ai/context-v/agent-skills/personal-strategic-plan/SKILL.md`) shares more with the v2.2 companion pack than with the original constructs:

- **Never miss twice.** PSP: "name the next concrete step for tomorrow morning: never miss twice" (`personal-strategic-plan/SKILL.md:245-247`). `biz-weekly-review` rule 4 is the same James Clear rule, plus the diagnosis that "two in a row is a design problem (cue gone, too big, reward dead)" (`skills/biz-weekly-review/SKILL.md:23`).
- **Concentrate, don't stack.** PSP layers "Two to five habits per goal" (`personal-strategic-plan/SKILL.md:215`); `biz-weekly-review` names ONE front and parks the rest (`skills/biz-weekly-review/SKILL.md:21`).
- **Counts of reps, not outcomes.** PSP scores leading indicators weekly and outcomes only at Day 30/60/90 (`personal-strategic-plan/SKILL.md:84-86`); `biz-weekly-review` sets commitments as "counts of things sent, shipped, published, not outcomes or deadlines" (`skills/biz-weekly-review/SKILL.md:24`).

The takeaway for hope-ai: PSP's morning and evening check-ins are user-initiated today (`personal-strategic-plan/SKILL.md:239-247`). If hope-ai ever sends a check-in unprompted, `nd-interrupt-budget` is a ready contract for it, and its "budget is never inferred" rule (`skills/nd-interrupt-budget/SKILL.md:20`) fits PSP's habit-layering stance.

## When NOT to reach for this

- **You want a single, predictable reply style.** Twenty-four rules can fire on one reply; [[Profile__I-Have-ADHD]] is one ruleset.
- **You need measured effect.** The checks prove the rule text exists, not that models follow it (`docs/conversation-audit-2026-07-21.md:79`).
- **You need time-based triggers today.** Counts are turn-based unless your host supplies ambient signals (`README.md:104-110`); [[Profile__Claude-ADHD-Skills]] has a working clock hook.
- **The user wants a coach or a profile.** nd-skills deliberately has neither (`skills/nd-executive-function-router/SKILL.md:3`; `README.md:126`); see [[Profile__ADHD-Copilot]] or [[Profile__ADHD-Study-Coach]].
- **You run talk-normal or another always-on style block.** Closers and option menus conflict, as noted above.
- **You need one canonical working-memory cadence.** Resolve the 5-turn vs 15-turn split before relying on it.

## One-line summary

> `nd-skills` is the study's executive-function taxonomy: 25 MIT-licensed skills, each a narrow rule with a countable trigger (8 research turns, 10 hyperfocus turns, 3 failures, 3 options, 3 nudges a day), kept always-on by a 24-line index block synced into Claude Code and Codex, routed by `/nd`, and tightened in v2 by an audit of 3,278 of the author's own sessions; its checks prove the rules are written down, not that they are followed, and its working-memory cadence still says 5 turns in one place and 15 in another.

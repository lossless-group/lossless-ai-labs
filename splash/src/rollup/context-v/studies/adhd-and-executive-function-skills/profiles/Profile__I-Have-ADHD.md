---
name: I Have ADHD Profile
slug: i-have-adhd
upstream: https://github.com/ayghri/i-have-adhd
package: Claude Code plugin marketplace (`claude plugin marketplace add ayghri/i-have-adhd`), plus native manifests for Codex, Gemini CLI, Qwen Code, Kimi, OpenCode, Pi/OMP, Grok, and Antigravity; plain `SKILL.md` for Cursor and any other agent-skills harness
license: MIT
maintainer: Ayoub G. (`ayghri`)
study: studies/adhd-and-executive-function-skills
profile_path: studies/adhd-and-executive-function-skills/i-have-adhd
profile_kind: always-on output-style skill, distributed cross-harness, with evals
date_created: 2026-10-29
site_uuid: 6d50de62-7b9a-4009-9724-6371dc41912b
hex_code: c8qr7h
date_authored_initial_draft: 2026-10-29
date_authored_current_draft: 2026-10-29
lede: >-
  A 142-line ruleset that changes the shape of every reply (action first,
  numbered steps, five-item lists) and does nothing else: no state, no
  nudges, no task flow.
summary: >-
  Source-cited profile of `ayghri/i-have-adhd` (pinned at v0.4.1), the anchor
  reference of the ADHD and executive-function skills study and the purest
  example of the output-shape approach. Covers the "five facts" premise, the
  ten rules and their numeric thresholds, the six override conditions, the
  pre-send check, the opt-in always-on hook and its per-harness equivalents,
  the eval harness and its recorded (failed) release gate, and how the repo
  keeps one canonical `SKILL.md` in sync across about ten runtimes. An agent
  should read this when deciding whether an ADHD-support need is really an
  output-format problem, when designing a style skill that must persist across
  turns and topic changes, or when packaging one skill for many harnesses.
publish: true
from: "studies/adhd-and-executive-function-skills"
from_path: "context-v/profiles/Profile__I-Have-ADHD.md"
---
# I Have ADHD — Profile

A profile of `i-have-adhd` as it lives in this study (`studies/adhd-and-executive-function-skills/i-have-adhd/`, pinned at `1ecea19`, tag `v0.4.1`). Every claim cites a pinned path relative to the submodule. Read it alongside [[Profile__ND-Skills]], [[Profile__Claude-ADHD-Skills]], [[Profile__ADHD-Claude-Skill]], [[Profile__AuDHD-Executive-Function]], [[Profile__ADHD-Copilot]], [[Profile__DSH-ADHD-Copilot]], [[Profile__ADHD-Skills]], and [[Profile__ADHD-Study-Coach]]. This entry sits at the narrow end of the study's design space: it changes only how the agent writes.

## TL;DR

The whole behavior is one file, `skills/i-have-adhd/SKILL.md` (142 lines). It opens with a one-line thesis: "The reader has ADHD. Output is not just brief. It is shaped so an ADHD brain can act on it." (`skills/i-have-adhd/SKILL.md:13`). From five facts about how ADHD changes reading (`skills/i-have-adhd/SKILL.md:21-29`) it derives ten rules (`:31-117`), six override conditions (`:119-128`), and a five-item pre-send deletion check (`:130-142`).

The skill is **off by default and user-invoked**: `disable-model-invocation: true` (`skills/i-have-adhd/SKILL.md:4`), and Codex gets the same posture from `policy.allow_implicit_invocation: false` (`skills/i-have-adhd/agents/openai.yaml:6-7`). Once invoked, it stays on for the session until the user says "stop adhd mode" or "normal mode" (`skills/i-have-adhd/SKILL.md:15-19`). An optional SessionStart hook injects it into every session when a flag file exists (`hooks/always-on.mjs:1-3,16-20`).

Everything else in the repo (about 14k lines) is distribution and verification: manifests for roughly ten harnesses (`AGENTS.md:25-52`), a byte-identical Cursor mirror enforced by CI (`.github/workflows/cursor-skill-sync.yml:3-25`), translated READMEs and install guides (`.github/readme/`, `.github/install/`), and a blind-judged eval harness whose first recorded run improved every rubric dimension but **failed its own release gate** (`evals/RESULTS.md:22-51`).

## Why this exists — the design bet

The bet: **for a reader with ADHD, most of what goes wrong in an agent conversation is the shape of the reply, and fixing that shape is enough to be worth a skill on its own.** The README states the user-facing promise as "A skill for your coding assistant that stops it from burying the answer. Action first. Steps numbered. No 'Hope this helps!'" (`README.md:38`). The Chinese README says the same: "让它别把答案埋进长篇大论" ("stop it from burying the answer in long-winded prose") (`.github/readme/README.zh-CN.md:38`).

The five facts are the load-bearing premise (`skills/i-have-adhd/SKILL.md:23-29`):

1. Working memory is small: "Anything not on screen is forgotten" (`:25`).
2. "Knowing the answer is not doing the answer" (`:26`).
3. "Starting is the hardest step" (`:27`).
4. "Time estimates feel uniform" (`:28`).
5. "Dopamine is scarce. Visible progress matters." (`:29`).

Each fact maps onto a rule: working memory → restate state every turn (rule 5); starting → lead with the action and end with a two-minute next step (rules 1, 3); time blindness → concrete estimates (rule 6); dopamine → make wins visible (rule 7).

Three deliberate refusals define the scope:

- **No user state.** Nothing is written about the user, their tasks, or their history. The only persisted bit anywhere is "is the mode on" (Pi stores `{ enabled }` as a session entry, `extensions/i-have-adhd.ts:33-35,173-179`; Claude Code uses a flag file, `hooks/always-on.mjs:16-20`).
- **No task-flow steering.** The skill never asks the user to plan, park, or reflect. Rule 4 even tells the agent to resolve mid-work questions itself rather than hand them back (`skills/i-have-adhd/SKILL.md:71`).
- **No diagnosis claims.** The README tagline is "No ADHD diagnosis needed!" (`README.md:5`), and contributions may not "misrepresent medical information or imply that this skill diagnoses ADHD" (`CONTRIBUTING.md:50`).

The repo also limits itself to response structure as policy: "Skill changes must stay focused on response structure and usability" (`CONTRIBUTING.md:44`).

## What's inside this submodule

```
i-have-adhd/
├── skills/i-have-adhd/
│   ├── SKILL.md                  canonical ruleset (142 lines)
│   └── agents/
│       ├── openai.yaml           Codex interface + allow_implicit_invocation: false
│       └── gemini.toml           self-contained Gemini /command, rules condensed inline
├── .cursor/skills/i-have-adhd/SKILL.md   byte-identical mirror (CI-enforced)
├── hooks/
│   ├── hooks.json                SessionStart matcher startup|resume|clear|compact
│   ├── always-on.mjs             Node hook (default)
│   ├── always-on.sh              POSIX fallback
│   └── always-on.ps1             PowerShell fallback
├── extensions/
│   ├── i-have-adhd.ts            Pi / OMP native extension (toggle, status, compaction)
│   └── context-compat.ts         helper: is the newest marker "rules" or "disabled"
├── .opencode/                    plugin (V1 server() + V2 setup()) and /command
├── .claude-plugin/ .codex-plugin/ .agents/plugins/   Claude + Codex manifests, marketplace
├── gemini-extension.json GEMINI.md qwen-extension.json kimi.plugin.json plugin.json package.json
├── evals/                        14 cases, rubric, RESULTS.md, one multi-turn scenario
├── scripts/                      run_evals.py, judge.py, run_scenario_eval.py, compat checks
├── tests/                        unittest suites for hooks, judge, evals, OpenCode, OMP
├── README.md INSTALL.md AGENTS.md CONTRIBUTING.md
└── .github/readme/ .github/install/  11 README and 8 INSTALL translations
```

`AGENTS.md:25-38` is the repo's own map and confirms these roles. `GEMINI.md:5` imports the canonical skill with `@./skills/i-have-adhd/SKILL.md` rather than copying it.

## How it scores against the study checklist

### Locus of intervention: the agent's output, only

All ten rules govern what the agent writes (`skills/i-have-adhd/SKILL.md:31-117`). Rule 5 comes closest to task flow, but it only asks the agent to restate progress ("Step 3 of 5 done: schema updated. Next: backfill the new column.", `:78`) and to use the harness's own task tool when one exists, "one item per step, one in progress at a time" (`:80`). The user's task list is never modeled.

### Triggering: user-invoked, sticky, with an opt-in always-on path

| Path | Mechanism | Source |
|---|---|---|
| Explicit invoke | `/i-have-adhd` (Claude Code, Qwen, Grok), `$i-have-adhd` (Codex) | `INSTALL.md:880-881` |
| Model invocation blocked | `disable-model-invocation: true`; Codex `allow_implicit_invocation: false` | `skills/i-have-adhd/SKILL.md:4`; `skills/i-have-adhd/agents/openai.yaml:6-7` |
| Persistence once on | "do not expire after a few turns and they do not lapse when the topic changes. If you are unsure whether they still apply, they do." | `skills/i-have-adhd/SKILL.md:17` |
| Off switch | "stop adhd mode" or "normal mode", confirm in one line | `skills/i-have-adhd/SKILL.md:19` |
| Always-on (Claude Code) | SessionStart hook fires only if `~/.claude/.i-have-adhd-always` exists | `hooks/always-on.mjs:16-20`; `hooks/hooks.json:3-11` |
| Always-on (OpenCode) | flag at `~/.config/opencode/.i-have-adhd-always`, pushed into the system prompt | `.opencode/plugins/i-have-adhd.mjs:28-53,94-99,123-132` |
| Always-on (Pi/OMP) | `--adhd` flag, `alwaysOn` config, or flag file | `extensions/i-have-adhd.ts:161-171,181-185` |
| Always-on (Gemini) | installing the extension loads `GEMINI.md`, so it is on from message one | `INSTALL.md:316-322` |

The hook matcher is `startup|resume|clear|compact` (`hooks/hooks.json:5`), so the ruleset is re-injected after context compaction. The Pi extension does the same on `session_compact` and tracks whether the newest marker is "rules" or "disabled" so it never injects twice (`extensions/i-have-adhd.ts:98-111,134-159,239`). The install guide sums up the posture: "if you did not turn it on, it is off" (`INSTALL.md:885`).

### Trigger heuristics: the exact numbers

| Threshold | Rule | Source |
|---|---|---|
| ≤ 5 items per visible group | Rule 9, cap lists | `skills/i-have-adhd/SKILL.md:103-105` |
| No step contains "and then" twice | Rule 2, bounded steps | `skills/i-have-adhd/SKILL.md:44` |
| One next action, doable in < 2 minutes | Rule 3 | `skills/i-have-adhd/SKILL.md:59` |
| 3 consecutive "still broken" turns → stop iterating code, name the assumption, ask one diagnostic question | Override 3, debug spiral | `skills/i-have-adhd/SKILL.md:125` |
| 2 to 4 ranked options, recommendation first | Override 5, when the options are the answer | `skills/i-have-adhd/SKILL.md:127` |
| Exactly one clarifying question on real ambiguity | Override 4 | `skills/i-have-adhd/SKILL.md:126` |
| Time estimates in concrete units ("About 15 minutes ... An afternoon if not") | Rule 6 | `skills/i-have-adhd/SKILL.md:84-87` |
| First-line / last-line test before sending | Pre-send check | `skills/i-have-adhd/SKILL.md:140` |

The list cap carries an explicit guard against information loss: it "shapes presentation only; it must not limit analysis, search, tool results, candidate generation, or retained information" (`skills/i-have-adhd/SKILL.md:107`). There are no turn-count or word-overlap triggers of the kind [[Profile__ND-Skills]] uses. The debug-spiral rule is the only conversation-history threshold, and it is tested by a six-turn scenario whose criteria include "After the third `Still broken` turn, `failure-3` stops proposing code changes" (`evals/scenarios/persistence-topic-switch-stop/case.jsonl:1`).

### State: none about the user

The only persistence is the on/off bit: a flag file the user creates and deletes by hand (`INSTALL.md:154-174`), or a Pi session entry (`extensions/i-have-adhd.ts:81-96`). Rule 1 of the five facts is honored by restating state in the reply instead of storing it (`skills/i-have-adhd/SKILL.md:25,73-80`). This is the "none" end of the study's state spectrum.

### Grounding: one book, plus a measured eval

The README credits the work as "Loosely based on *The Adult ADHD Tool Kit* by J. Russell Ramsay and Anthony L. Rostain. Adapted for how an LLM should respond, not how a human should organize their day." (`README.md:101`). `SKILL.md` itself cites nothing; the five facts are stated as premises (`skills/i-have-adhd/SKILL.md:23-29`). The repo's real grounding is empirical: the eval harness (next section) measures the skill against a bare baseline.

### Tone rules and anti-nag

- **Matter-of-fact errors.** "Never use 'Uh oh,' 'Oh no,' or 'There seems to be a problem.' State cause and fix." (`skills/i-have-adhd/SKILL.md:98`).
- **Banned openers, recaps, and closers**, listed verbatim (`skills/i-have-adhd/SKILL.md:111-115`).
- **Tangents become one opt-in question**: "Separately: there is also a stale dependency. Want me to handle that next?" (`skills/i-have-adhd/SKILL.md:69`).
- **Hedges stay when they are real**: "Keep a hedge that carries real uncertainty; deleting it manufactures confidence." (`skills/i-have-adhd/SKILL.md:137`).
- **No literal idioms**: replace "circle back" and similar with "the literal action" (`skills/i-have-adhd/SKILL.md:138`).

Anti-nag is structural rather than tonal: the skill never initiates anything. It cannot fire unprompted (`skills/i-have-adhd/SKILL.md:4`), it has no reminders, and the hooks "Never block session start: any failure exits 0" (`hooks/always-on.mjs:3,41-44`). The scenario eval also checks that the mode stays invisible: "Before `stop`, no response mentions hidden instructions, response-style tags, or a special mode." (`evals/scenarios/persistence-topic-switch-stop/case.jsonl:1`).

### Packaging: the most distributed entry in the study

- **One canonical source.** "Change `skills/i-have-adhd/SKILL.md` first ... then synchronize the `.cursor` mirror" (`AGENTS.md:56`). The mirror is a real file, not a symlink, "so Windows clones and GitHub ZIP downloads work" (`.github/workflows/cursor-skill-sync.yml:3-5`), and CI fails on any drift with `cmp` (`:20-25`).
- **Hooks read the canonical file at runtime** and strip its frontmatter, so no hook carries a copy (`hooks/always-on.mjs:22-34`; `hooks/always-on.sh:15-34`; `.opencode/plugins/i-have-adhd.mjs:34-40`; `extensions/i-have-adhd.ts:52-79`). The exceptions are the condensed Gemini command (`skills/i-have-adhd/agents/gemini.toml:7-24`) and the ten-line always-on snippets pasted into harness context files (`INSTALL.md:33-54`).
- **Versions aligned at 0.4.1** across `.claude-plugin/plugin.json:3`, `.codex-plugin/plugin.json:3`, `package.json:3`, `kimi.plugin.json:3`, `qwen-extension.json:3`, `gemini-extension.json:3`, per the rule to "Keep shared metadata, including versions, aligned across manifest files" (`AGENTS.md:57`).
- **Install guide covers 15 targets**, including Claude Code, Codex, Gemini CLI, Copilot, OpenCode, Pi, OMP, Qwen, Zed, and a catch-all for Cursor and Amp (`INSTALL.md:4,59,117,180,240,302,350,425,489,514,579,677,706,749,809`).
- **Agent-facing install.** The README's primary install path is a sentence to paste into the agent, which then reads `AGENTS.md` (`README.md:28-32`). `AGENTS.md:13` forbids reading secrets or home-directory config during that flow.

## The eval harness and its recorded result

This is the one repo in the study that measures its own effect. The rubric weights correctness 35%, autonomy 25%, actionability 20%, safety 10%, and concision 10% (`evals/rubric.md:10-16`). Grading is blind by construction: conditions are relabelled A/B/C with a deterministic per-group permutation (`evals/README.md:81-87`), and only the region between `judge:begin` and `judge:end` reaches the grader (`evals/README.md:89-93`; `evals/rubric.md:3-19`). Runners isolate the call from the operator's config with `--setting-sources ""`, specifically so the repo's own always-on flag cannot leak into the baseline (`evals/README.md:35`; `evals/runners.example.json:10-15`).

The first recorded run (2026-08-02, 14 cases × 3 trials, model pinned as `claude-opus-4-8`) is in `evals/RESULTS.md:6-15`:

| Dimension | Baseline | Candidate | Δ |
|---|---:|---:|---:|
| Correctness | 4.333 | 4.524 | +0.190 |
| Autonomy | 3.762 | 4.167 | +0.405 |
| Actionability | 3.905 | 4.619 | +0.714 |
| Concision | 3.429 | 4.571 | +1.143 |
| Weighted | 4.045 | 4.473 | +0.427 |

(`evals/RESULTS.md:22-29`.) Gains concentrate in state-reporting cases: `multi-step-progress` +2.53 and `error-report` +2.40 (`evals/RESULTS.md:57-58,72-76`). The release gate still **failed**, because the rule "It has no blocking findings" is absolute and the candidate had 3 blockers against the baseline's 7 (`evals/RESULTS.md:38-51`; `evals/rubric.md:21-26`).

The honest finding to carry forward is the one regression: `partial-success` dropped 0.63, and the authors name a plausible mechanism. Rule 8's "cause, then fix" "pressures the model to name a cause even when the evidence does not identify one" (`evals/RESULTS.md:88-99`). The authors also flag their own limits: three trials, and a judge from the same model family (`evals/RESULTS.md:101-108`).

## Mental model for using it well

1. **Treat it as a reply formatter, not a coach.** It changes every message and nothing else. If the problem is starting, drifting between sessions, or remembering, this skill touches it only through the reply's first and last lines.
2. **Read the overrides before the rules.** Six conditions let the task beat the shape: "explain" requests, destructive actions, debug spirals, real ambiguity, rules that would delete the answer, and harness system prompts (`skills/i-have-adhd/SKILL.md:121-128`). Rules 5 and 6 of that list say "the constraint wins, the shape stays" (`:127-128`).
3. **Expect friction with honest uncertainty.** The eval's one regression is a forced cause (`evals/RESULTS.md:88-99`). Pair rule 8 with the pre-send hedge exception (`skills/i-have-adhd/SKILL.md:137`) when evidence is thin.
4. **Fork to tune.** The README's tuning path is fork, edit `SKILL.md`, reinstall (`README.md:86-97`). A fork must bump `version` or `claude plugin update` skips it (`INSTALL.md:143`).
5. **The pre-send check is the cheapest part to steal.** Delete the announcing first sentence, the "anything else?" last sentence, "by the way" sidebars, empty hedges, and idioms, then apply the first-line/last-line test (`skills/i-have-adhd/SKILL.md:132-140`).

## How this compares to the rest of the study

Sibling cells come from the study README's blurbs (`../README.md`); see each sibling's profile for path-level citations.

| | i-have-adhd | nd-skills | claude-adhd-skills | adhd-claude-skill | audhd-executive-function | adhd-copilot | dsh-adhd-copilot | adhd-skills | adhd-study-coach |
|---|---|---|---|---|---|---|---|---|---|
| **Locus** | Agent output only | Output + task flow, per EF construct | Time awareness + reminders + journaling | Session flow (outcome first, park drift) | Whole daily system (HTML workbench) | Coaching + adaptive profile | Behavioral coaching | Ritual reviews over org-mode | Study sessions |
| **Trigger** | User-invoked; opt-in SessionStart hook | Model-invoked by numeric thresholds | Hooks (date, prompt submit) | `/adhd` subcommands | Daily run | Co-triggered profile tracker | Skill invocation (DeepSeek Harness) | Ritual commands | Coach skill |
| **Signature number** | ≤ 5 list items; 3 "still broken" turns | 8+ turns, 3 errors, 3 options, <15% overlap | — | — | — | — | — | 30-minute target | — |
| **State** | None (on/off bit) | — | SQLite + Obsidian vault | `~/.claude/adhd/` JSON + `parked.md` | User profile file | Consented profile | — | org-mode files | User-carried Progress Card |
| **Packaging** | ~10 harness manifests, evals, CI | 25 `SKILL.md` files, always-on templates, regression evals | Skills + Python hooks | One `SKILL.md` | Skill + references | 3 skills (en/zh) | One skill | Personal repo | Skill + `universal/` variant |
| **License** | MIT | none | MIT | MIT | MIT | none | MIT | CC-BY-SA-4.0 | MIT |

Two contrasts are worth keeping:

- **Against [[Profile__ND-Skills]]:** both use numeric limits, but i-have-adhd applies them to the shape of one reply (list cap, step size), while the nd-* skills apply them to conversation history to decide *when* to intervene. The only history-based rule here is the three-turn debug spiral (`skills/i-have-adhd/SKILL.md:125`).
- **Against [[Profile__ADHD-Claude-Skill]] and [[Profile__Claude-ADHD-Skills]]:** those keep state and act on drift across sessions. i-have-adhd answers drift inside a reply only ("Suppress tangents", `skills/i-have-adhd/SKILL.md:64-71`) and forgets everything at session end.

## How this compares to our own work

**`talk-normal`** (`context-v/agent-skills/talk-normal/skill/SKILL.md` at the anchor root; the file sits under `skill/`, not at the top of the skill directory) is the nearest relative. Both ban the same openers and closers ("Great question", "Hope this helps", `talk-normal/skill/SKILL.md:41-43`), both lead with the answer, and both cap lists (`:42,45`). The differences:

- talk-normal's target is "slop" and its metric is character reduction, "71% on GPT-4o-mini, 56% on GPT-5.4" (`talk-normal/skill/SKILL.md:13,62-64`). i-have-adhd's target is acting on the reply, and its metric is a weighted quality score in which concision is only 10% (`evals/rubric.md:16`).
- talk-normal is a one-time installer that writes a delimited block into `AGENTS.md` and is "permanently less verbose until you uninstall" (`talk-normal/skill/SKILL.md:17-19`). i-have-adhd is off until invoked and turns off by phrase (`skills/i-have-adhd/SKILL.md:4,19`).
- talk-normal forbids "conditional next-step menus" (`talk-normal/skill/SKILL.md:43`). i-have-adhd *requires* one concrete next action at the end of every open reply (`skills/i-have-adhd/SKILL.md:57-62`). Running both at once would conflict on closers.

**`hope-ai`'s `personal-strategic-plan` skill** (`ai-labs/hope-ai/context-v/agent-skills/personal-strategic-plan/SKILL.md`) is on the opposite side of the study's locus axis: it steers task flow and keeps state in `tracker.yaml` plus weekly logs (`personal-strategic-plan/SKILL.md:163-175`). It shares two instincts with i-have-adhd:

- **A small, concrete next step after a miss.** PSP: "If they missed, name the next concrete step for tomorrow morning: never miss twice." (`personal-strategic-plan/SKILL.md:245-247`). i-have-adhd: one action "in under two minutes" (`skills/i-have-adhd/SKILL.md:59`).
- **Bounded time.** PSP check-ins are "about 5 minutes" (`personal-strategic-plan/SKILL.md:242,245`); i-have-adhd insists on minute-level estimates (`skills/i-have-adhd/SKILL.md:82-87`).

The practical takeaway for hope-ai: its replies could adopt i-have-adhd's shape rules (restate "where am I this week" state, show wins concretely) without importing any of its scope. The two do not overlap in what they store or schedule.

## When NOT to reach for this

- **The need is between sessions.** Parking ideas, reminders, time awareness, or remembering the user's patterns all need state. Look at [[Profile__ADHD-Claude-Skill]], [[Profile__Claude-ADHD-Skills]], or [[Profile__ADHD-Copilot]].
- **The user wants the agent to run their day.** That is [[Profile__AuDHD-Executive-Function]]'s territory.
- **Evidence is thin and the honest answer is "unknown cause".** Rule 8 pushes toward a stated cause; the eval caught this (`evals/RESULTS.md:88-99`).
- **Another always-on style skill is already installed.** Closers conflict with talk-normal as noted above, and both write to the same reply.
- **You need clinical or research grounding.** The skill cites no studies and the repo forbids medical claims (`CONTRIBUTING.md:50`). [[Profile__ADHD-Study-Coach]] rates its evidence; this one does not.
- **Long-form explanation is the deliverable.** The override allows it (`skills/i-have-adhd/SKILL.md:123`), but at that point the skill contributes little beyond "no preamble".

## One-line summary

> `i-have-adhd` is the study's output-shape reference: one MIT-licensed, 142-line `SKILL.md` of five facts, ten rules, six overrides, and a pre-send check that makes every reply start with an action and end with a two-minute next step, kept off until invoked, sticky until "stop adhd mode", distributed byte-for-byte to about ten harnesses, and measured (+0.43 weighted, gate still failed on blockers) instead of merely asserted.

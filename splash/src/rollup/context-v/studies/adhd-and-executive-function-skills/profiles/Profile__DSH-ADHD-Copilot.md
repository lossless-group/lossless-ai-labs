---
name: DSH ADHD Copilot Profile
slug: dsh-adhd-copilot
upstream: https://github.com/zimai233/dsh-adhd-copilot
package: dsh-adhd-copilot (npm, v0.1.0), installed as a DeepSeek Harness plugin via `dsh plugin --profile <p> add dsh-adhd-copilot` or `add github:zimai233/dsh-adhd-copilot#<sha>`
license: MIT
maintainer: zimai233 (`skills/adhd-copilot/SKILL.md:7`; sole author of the single pinned commit)
study: studies/adhd-and-executive-function-skills
profile_path: studies/adhd-and-executive-function-skills/dsh-adhd-copilot
profile_kind: behavioral-coaching harness plugin (one routing tool + verbatim Chinese skill)
date_created: 2026-10-29
site_uuid: 8132526d-8206-4073-8302-e95259d5fca8
hex_code: 4vljod
date_authored_initial_draft: 2026-10-29
date_authored_current_draft: 2026-10-29
lede: >-
  An ADHD coaching skill turned into a deterministic keyword router: one
  `adhd_breakdown` tool that maps a stuck user to one of eight modules and
  hands back a single next action under 60 seconds.
summary: >-
  Source-cited profile of zimai233/dsh-adhd-copilot (pinned 6527cb6) for the
  ADHD and executive-function skills study. Covers the "lower the cost of
  starting, never ask for self-discipline" bet; the eight-module M1-M8
  methodology (task breaker, external brain, dopamine architect, launch ritual,
  gamifier, time auditor, failure reset, router); the emotion > structure >
  start priority rule; every numeric threshold (1-3 steps, <60 s per step,
  30-second closing action, 10/30/60/90 battery tiers, 15 + 20 minute time
  buffers); and the gap between what the Chinese skill text says and what the
  JavaScript router actually does. Read it when designing a state-routed
  coaching skill, when deciding whether to compile a skill's judgment into
  code, or when you need the study's only non-Claude-harness packaging data
  point.
publish: true
from: "studies/adhd-and-executive-function-skills"
from_path: "context-v/profiles/Profile__DSH-ADHD-Copilot.md"
---
# DSH ADHD Copilot — Profile

A profile of `dsh-adhd-copilot` as pinned in this study (`studies/adhd-and-executive-function-skills/dsh-adhd-copilot/`, commit `6527cb6`, the repo's only commit, dated 2026-08-14). Paths below are relative to the submodule root. The skill text is almost entirely Chinese; quotes carry an English translation. Read it alongside [[Profile__I-Have-ADHD]], [[Profile__ND-Skills]], [[Profile__Claude-ADHD-Skills]], [[Profile__ADHD-Claude-Skill]], [[Profile__AuDHD-Executive-Function]], [[Profile__ADHD-Copilot]], [[Profile__ADHD-Skills]], and [[Profile__ADHD-Study-Coach]].

## TL;DR

`dsh-adhd-copilot` is a **plugin for DeepSeek Harness (dsh)**, not a Claude skill. It ships two things:

1. **A coaching methodology** written as a standard `SKILL.md` plus 11 reference files (`skills/adhd-copilot/SKILL.md:1-108`, `skills/adhd-copilot/references/*.md`). It defines seven user states (A-G), eight modules (M1-M8), seven output rules, and a pre-send check.
2. **One agent-callable tool, `adhd_breakdown`** (`src/index.js:537-592`), that keyword-scans the task text, picks a module by a fixed priority order, and returns a rendered coaching reply.

The plugin registers only the tool. The source comment says dsh has no confirmed `skills` service, so the Markdown skill rides along in the npm tarball as "the deliverable value" and is not loaded by the harness (`src/index.js:20-23`, `package.json:7`). The behavior the agent actually gets at runtime is the JavaScript router, not the prose.

Core principle, verbatim: "永远只推动下一步，不要求完成全部。内容质量永远高于格式。" ("Always push only the next step; never require finishing everything. Content quality always beats format.") (`README.md:7`).

## Why this exists — the design bet

The bet: **for an ADHD user, the plan is part of the problem, so the agent should hand out one small next action, not a plan.**

- "AI 很擅长做计划——但对 ADHD 大脑来说，计划本身就是问题的一部分。" ("AI is great at planning, but for ADHD brains the plan itself is part of the problem.") (`README.md:11`; English at `README.md:125`).
- It explicitly refuses the willpower framing: "不要求自律，而是通过降低启动成本、提供外部结构、陪伴执行和即时反馈" ("it does not demand self-discipline; it lowers the cost of starting, provides external structure, accompanies execution, and gives instant feedback") (`skills/adhd-copilot/SKILL.md:15`).
- Every reply must be a **takeaway action** the user can do without returning to the chat; all feedback loops are optional (`skills/adhd-copilot/SKILL.md:33`).
- A **quality floor** sits above every formatting rule: when a rule makes the answer lose information or sound mechanical, break the rule (`skills/adhd-copilot/references/core-workflow.md:33-37`).

The second, quieter bet is architectural: **compile the routing judgment into deterministic code**. Where most entries in this study trust the model to read a `SKILL.md` and decide, this one hands the model a tool whose description says "Call it instead of dumping a full plan" (`src/index.js:546-547`). The routing is a substring match over a keyword table (`src/index.js:106-153`).

The README frames the plugin as filling an empty category in the dsh ecosystem: "行为 / 心理健康分类目前是空的" ("the behavioral / mental-health category is currently empty") (`README.md:5`, `README.md:19`).

## What's inside this submodule

```
dsh-adhd-copilot/                     (pinned 6527cb6, 1 commit)
├── README.md                         229 lines; Chinese (1-112) then English (115-229)
├── package.json                      npm metadata + dsh bundle hook (1-18)
├── cordis.patch.yml                  3-line plugin registration (id: adhd-copilot)
├── LICENSE                           MIT
├── src/index.js                      592 lines: MODULES table, SIGNALS keyword table,
│                                     scanState, 8 module builders, adhdBreakdown,
│                                     renderBreakdown, apply(ctx) tool registration
├── test/index.test.js                127 lines, node:test
└── skills/adhd-copilot/
    ├── SKILL.md                      108 lines: when to use, principles, routing,
    │                                 output rules, modules, anti-patterns, safety
    └── references/
        ├── core-workflow.md          five cognitive facts, pre-flight gate, status card
        ├── state-scanner.md          A-G routing table, self-service menu, lazy profile
        ├── output-discipline.md      seven output rules, exceptions, pre-send check
        ├── M1-task-breaker.md        can't start
        ├── M2-external-brain.md      overwhelm
        ├── M3-dopamine-architect.md  no motivation (battery menu)
        ├── M4-body-double.md         distractible / wants company
        ├── M5-interest-gamifier.md   gamification, opt-in only
        ├── M6-time-auditor.md        time misjudgment
        ├── M7-adhd-reset.md          self-blame
        └── M8-router.md              can't decide how
```

Packaging details:

- `package.json:5-7`: pure ESM, `main: src/index.js`, and `files` ships `src`, `skills`, `cordis.patch.yml`, `README.md`, `LICENSE`.
- `package.json:13-17`: a `dsh.bundle.patch` field points at `cordis.patch.yml`, which inserts `id: adhd-copilot` (`cordis.patch.yml:1-3`). The plugin follows a cordis-style shape: `export const name`, `export const inject = ['tools']`, and `apply(ctx)` (`src/index.js:26-27`, `:537`).
- Zero runtime dependencies; `package.json` declares none, and the source header says "Pure ESM, zero build step, zero runtime dependencies" (`src/index.js:16-18`).

## How it scores against the study checklist

### Locus of intervention

**The user's task flow, mediated through the agent's output.** Every module ends in one concrete action for the user to take away (`skills/adhd-copilot/SKILL.md:32-33`). It has more output-shape rules than most entries (seven rules in `references/output-discipline.md:3-31`), but they serve the task-flow goal: first line is an action, the last line is a 30-second next step. It keeps no persistent state (see State below).

At runtime the locus narrows further. The harness registers the tool but not the skill (`src/index.js:20-23`), so intervention happens when the model chooses to call `adhd_breakdown` and relays the string it returns (`src/index.js:588-590`).

### Triggering

- **Skill (prose):** model-invoked from the description, which lists English and Chinese trigger phrases ("can't start", "procrastinating", "failed again", "拖", "做不了", "好多事", "没动力", "又失败了") (`skills/adhd-copilot/SKILL.md:3`). It must stay silent on one-line questions and chit-chat: "Do NOT activate for: 一句话提问、闲聊。无任务信号时保持静默。" ("one-line questions, small talk; stay silent when there is no task signal") (`skills/adhd-copilot/SKILL.md:28`).
- **Tool (code):** model-invoked from the tool description (`src/index.js:540-547`); `task` is the only required parameter (`src/index.js:582`).
- **Pre-flight gate**, three branches: tiny request → answer directly; clear task / anxiety / procrastination → full flow; no task signal → silent (`references/core-workflow.md:11-16`). In code the gate is narrower: it fires only when `task` is empty or whitespace (`src/index.js:423-424`). Judging whether a request is "tiny" is left entirely to the model.
- **Routing inside the tool** is a substring match over a per-state keyword list (`src/index.js:107-136`), checked in priority order (`src/index.js:139-153`). No match returns the A-G self-service menu (`src/index.js:177-197`, `:428`). The prose says keywords are hints, not hard routing (`references/state-scanner.md:5`); the code treats them as hard routing.

### Trigger heuristics (exact numbers)

| Heuristic | Value | Source |
|---|---|---|
| Steps per turn | 1-3, "跑完再要" (ask for more after finishing) | `references/M1-task-breaker.md:10`; `SKILL.md:78` |
| Duration per step | <60 seconds | `references/M1-task-breaker.md:11` |
| Closing action | one action doable within 30 seconds | `references/output-discipline.md:15-16` |
| General info lists | ≤5 items, else split "now / later"; action lists still ≤3 | `references/output-discipline.md:11-13` |
| "Then"s per step | no more than two | `references/output-discipline.md:12` |
| Now-zone in overwhelm | exactly 1 task + 1 Next Action | `references/M2-external-brain.md:10` |
| Battery tiers | 10% / 30% / 60% / 90% | `references/M3-dopamine-architect.md:10` |
| Battery menu | 10-30% → first step + one sensory stimulus; 60% → standard; 90% → standard + extra | `references/M3-dopamine-architect.md:13-17` |
| Battery cut-offs in code | `<= 30` light start; `<= 60` standard; else "add more" | `src/index.js:251`, `:265`, `:278-288` |
| Menu durations | 5-min appetizer, 20-min main, 10-min side (adjustable) | `references/M3-dopamine-architect.md:19-23` |
| Time audit | prep 15 min + execution + interruption buffer 20 min | `references/M6-time-auditor.md:11-18`; `src/index.js:342-344` |
| Default estimate when missing | 60 minutes, floor 1 | `src/index.js:341` |
| Self-blame response | 3 steps, ending in one 30-second action | `references/M7-adhd-reset.md:9-12` |
| Decision paralysis | 2-3 framings, then converge to 1 action | `references/M8-router.md:10-22` |
| Stuck loop | three consecutive "still not working" → stop iterating, question the assumption, ask one diagnostic question | `references/output-discipline.md:37` |
| Self-service menu | 7 options, A-G | `references/state-scanner.md:24-33`; `test/index.test.js:94` |
| Status card | one line, active-task mode only (after M1 / M2 / M4) | `references/core-workflow.md:39-45` |

**Priority for mixed states:** "情绪 > 结构 > 启动" (emotion > structure > start): handle F self-blame and E no-motivation first, then B clearing, then A starting (`references/core-workflow.md:26-31`; `SKILL.md:44`). The code extends that order to `['F', 'E', 'B', 'A', 'C', 'D', 'G']` (`src/index.js:139`), so C (distractible), D (time misjudgment), and G (can't decide) only win when none of the first four match. The prose never ranks C, D, or G.

### State

**None that persists.** This is a deliberate, stated honesty rule.

- "不承诺跨会话记忆：仅在平台有长期记忆时持久化。" ("No cross-session memory promises; persist only if the platform has long-term memory.") (`README.md:109`).
- The user profile is lazy and optional: ask about interests only when M5 needs them, about durations only when M6 needs them, and persist across sessions "仅平台有长期记忆时" ("only when the platform has long-term memory"); otherwise never ask the user to carry it (`references/state-scanner.md:35-41`).
- M6 calibrates once per session and bans "我记住了，下次更准" ("I've remembered, I'll be more accurate next time") (`references/M6-time-auditor.md:21-27`).
- In-conversation state is a one-line **status card**, e.g. `[M1 · 已完成 2 步 · 下一步：删除旧文件]` ("M1 · 2 steps done · next: delete the old files") (`references/core-workflow.md:39-47`). It lets the agent resume when the user comes back after an M4 launch (`references/M4-body-double.md:19-22`).
- The tool takes M2's `parked` / `dropped` lists as comma-separated arguments each call (`src/index.js:573-580`); nothing is stored.

### Grounding

**Lived practice, not cited research.** The "five cognitive facts" are stated without sources: small working memory, knowing ≠ doing, starting is hardest, distorted time sense, scarce dopamine (`references/core-workflow.md:3-9`). The README calls the method "经过实战打磨" ("battle-tested") (`README.md:19`). No reference file cites Barkley, Ramsay & Rostain, or learning science. Contrast [[Profile__ADHD-Study-Coach]] and [[Profile__AuDHD-Executive-Function]], which carry research files.

### Tone rules and anti-nag mechanics

- **Anti-patterns** (`SKILL.md:89-95`): no full breakdown list at once ("the list itself is a burden"), no "here are 20 options, pick one" ("that is evasion"), no empty praise ("加油你能行", "come on, you can do it"), no fake timers ("AI cannot show up on its own"), no lecturing ("你应该自律", "you should be self-disciplined").
- **Praise bound to a concrete act:** "你打开了文件，这一步完成了。" ("You opened the file; this step is done.") Showing up and trying counts as a win (`references/core-workflow.md:49-53`).
- **Non-blocking returns:** "做完回复'完成'" ("reply 'done' when finished") is optional (`references/M1-task-breaker.md:19`). M4 closes with "我在这，你去做。做完了回来或不回来都行。" ("I'm here, go do it. Come back or don't, either is fine.") (`references/M4-body-double.md:17`).
- **No fake timers:** "假装有计时器，承诺'10 分钟后我提醒你'" ("pretending to have a timer, promising 'I'll remind you in 10 minutes'") is an anti-pattern (`references/M4-body-double.md:34`), restated in `README.md:108`.
- **Self-blame gets the shortest reply**, flagged "最高优先级、最短响应" ("highest priority, shortest response"); the tone builds in "失败可原谅" ("failure is forgivable"), with no judging, lecturing, or chicken-soup platitudes (`references/M7-adhd-reset.md:7`, `:14-15`).
- **Gamification is opt-in only.** Unrequested RPG framing is called "油腻" ("greasy") (`references/M5-interest-gamifier.md:6-7`, `:17-18`).
- **Pre-send check** deletes an announcing first sentence, a "need anything else?" closer, asides, and hedges ("或许", "大概": "perhaps", "probably"), and turns metaphors into actions ("回到正轨" → "关掉那个标签页": "get back on track" → "close that tab") (`references/output-discipline.md:41-48`). Final test: can a user who reads only the first and last lines tell what to do next and what just happened? (`references/output-discipline.md:50-51`).
- **Safety:** an execution aid, not diagnosis or treatment; on crisis or self-harm signals, gently suggest professional help and do not push the task (`SKILL.md:97-100`).

### Packaging

A single npm package with one tool, one skill directory, and a `node:test` suite (`package.json:10-12`). The tests check SKILL.md frontmatter (`test/index.test.js:25-30`), that exactly 11 reference files exist (`:32-41`), keyword routing for all seven states (`:59-68`), the pre-flight and fuzzy-menu branches (`:83-98`), M3 battery handling (`:100-112`), and M7 brevity (`:114-119`). It ships no evals of model behavior.

One test asserts the skill files are **verbatim copies** of a source at `../../adhd-copilot/skills/adhd-copilot` and skips when that path is absent (`test/index.test.js:43-57`). The upstream source is not published in this repo. In this study the sibling `adhd-copilot/` (dsx0511) uses a different layout (`skills/adhd-copilot-en`, `skills/adhd-copilot-zh`, `skills/adhd-profile-tracker`), so the test would skip here. Lineage between the two is unverified.

## Where the code and the prose disagree

Read these before copying the router pattern.

1. **M5 is unreachable through the tool.** `SIGNALS` has entries for states A-G but none for M5 (`src/index.js:107-136`), so `scanState` never returns `M5` and the `case 'M5'` branch (`src/index.js:437`) is dead code. The `narrative` parameter (`src/index.js:564-568`) has no effect. That matches the opt-in intent, but no code path implements opting in.
2. **The tool returns Markdown text, not the JSON the README shows.** The README presents a JSON breakdown (`README.md:56-68`). `execute` returns `renderBreakdown(adhdBreakdown(args))` with `output.schema: { type: 'string' }` (`src/index.js:584-590`). The JSON is the internal intermediate.
3. **The M1 render's first line names the task; it is not an action.** Rule 1 says the first line must be the next action (`references/output-discipline.md:5-9`). The renderer opens with `${b.task}，先别想完成。只做第一步：` ("<task>, don't think about finishing. Just do the first step:") (`src/index.js:465`), and a test locks that in (`test/index.test.js:79`). This follows the M1 output format, which puts the task name first (`references/M1-task-breaker.md:15-17`). The two references contradict each other.
4. **The keywords are broad.** `'启动'` ("start") routes to M1, `'太多'` ("too many") routes to M2, `'failed'` routes to M7, and `'how to'` routes to M8 (`src/index.js:110-134`). Because F is checked first, any message containing "failed" goes to the self-blame reset (`src/index.js:139`).
5. **M2's next action ignores the task.** It is hardcoded to "打开空白文档，写第一段" ("open a blank document, write the first paragraph") (`src/index.js:218`).
6. **Task text is echoed into every step template.** In `「${task}」` (`src/index.js:161`), `task` is the full user sentence. In the README example the task is the clean noun "周报" ("weekly report") (`README.md:62`). The test passes a whole sentence (`test/index.test.js:71`), so real output reads "open the file related to「I've been putting off the weekly report for two weeks」".

## Mental model for using it well

- **Read the prose as the spec and the JS as one lossy compilation of it.** The methodology lives in `skills/adhd-copilot/`; `src/index.js` compiles a subset into keyword tables and string templates.
- **The useful core is three rules.** At most 3 steps, each under 60 seconds (`M1-task-breaker.md:10-11`). End on a 30-second action (`output-discipline.md:15-16`). Handle emotion before structure before starting (`core-workflow.md:26-31`). Most of the rest follows from these.
- **State priority is the most portable idea.** Telling the agent to address self-blame before breaking down the task is a cheap rule that would change most coaching skills in this study.
- **The honesty rules are the anti-nag design.** It has no timers, no required check-ins, no promised memory, and returning is optional. It avoids nagging by never claiming abilities the agent lacks; it does not rely on dismiss buttons.
- **Treat the tool as a demo for any harness without skill loading.** If your harness loads `SKILL.md` natively, the prose alone (108 + ~390 lines) is the better artifact, and the model handles routing better than substring matching.

## How this compares to the rest of the study

Sibling characterizations come from the study README (`../README.md:25-33`, `:56-146`); see each sibling's profile for cited detail.

| Entry | Locus | Triggering | State | Grounding | Packaging |
|---|---|---|---|---|---|
| **dsh-adhd-copilot** | Task flow, via one next action | Model calls a tool; keyword router inside | None; one-line status card in chat | Practice ("five facts", no citations) | npm dsh plugin: 1 tool + verbatim Chinese skill; `node:test` |
| [[Profile__I-Have-ADHD]] | Output shape | Model-invoked + opt-in SessionStart hook | None (flag file for always-on) | "Five facts" about ADHD reading | ~10 harness manifests, evals, tests |
| [[Profile__ND-Skills]] | Agent behavior per EF construct | Model-invoked, 24 skills + router | None | Named EF constructs | Multi-skill repo |
| [[Profile__Claude-ADHD-Skills]] | Time awareness + reminders | Hooks on prompt submit | SQLite + Obsidian vault | See profile | Skills + Python hooks |
| [[Profile__ADHD-Claude-Skill]] | Session scope / drift | `/adhd` subcommands | `~/.claude/adhd/` files | See profile | Single `SKILL.md` |
| [[Profile__AuDHD-Executive-Function]] | Agent is the external EF system | Daily run | Per-user profile file | Research file | Skill + references |
| [[Profile__ADHD-Copilot]] | Coaching + research-discussion monitor | Co-triggered with profile tracker | Consented profile across sessions | See profile | 3 skills (en/zh/tracker) |
| [[Profile__ADHD-Skills]] | Ritual reviews; user does the work | User-invoked rituals | org-mode files | Personal method (GTD, zettelkasten) | Personal skill set |
| [[Profile__ADHD-Study-Coach]] | Learning flow | Model-invoked | User-carried Progress Card | Cited research with strength ratings | Skill + `universal/` variant |

This entry adds two things to the study. It is the **only one that moves routing out of the model into code**, and the **only non-Claude harness** (DeepSeek Harness, registered through cordis-style `inject` / `apply`). It is also the closest to [[Profile__ADHD-Copilot]] in name and bilingual audience; any shared lineage is unconfirmed (see Packaging).

## How this compares to our own work

**`ai-labs/hope-ai/` (PSP agent skill).** Both protect the user from overcommitting, in different units. hope-ai works in habits over 100 days: "If a plan adds more than one or two new habits in Week 1 … say so plainly and help them layer it" (`hope-ai/context-v/agent-skills/personal-strategic-plan/SKILL.md:93-95`). dsh works in steps per turn: 1-3, each under 60 seconds. hope-ai's "One goal at a time. Don't dump a whole plan on the member" (`SKILL.md:77-78`) matches dsh's anti-pattern against a full breakdown list (`dsh SKILL.md:91`). hope-ai's evening check-in, "Celebrate hitting base as a win. If they missed, name the next concrete step for tomorrow morning: never miss twice" (`SKILL.md:245-247`), is the weekly-scale version of M7's reset (`references/M7-adhd-reset.md:9-12`) and of "showing up counts as a win" (`references/core-workflow.md:52`). The difference is state: hope-ai keeps a PSP folder and a `tracker.yaml` (`SKILL.md:30-31`); dsh refuses all persistence it can't guarantee. Two dsh ideas hope-ai could borrow: the **emotion-first priority rule** for check-ins after a missed day, and the **battery-tiered menu** for the morning check-in.

**`talk-normal` (output-style skill).** Both cut filler and lead with the point. talk-normal: "Lead with the answer" and end with "a concrete recommendation or next step when relevant" (`context-v/agent-skills/talk-normal/prompt.md:21-23`). dsh: first line is an action, last line is a 30-second step (`references/output-discipline.md:5-16`), and the pre-send check deletes announcing openers and "anything else?" closers (`:41-48`). Both are bilingual and target Chinese filler. They differ on structure: talk-normal allows numbered steps "only when the content has natural sequential or parallel structure" (`prompt.md:30`), while dsh makes numbering mandatory for multi-step tasks (`references/output-discipline.md:11`). They would conflict if loaded together, so dsh's quality floor (`core-workflow.md:33-37`) is the rule that settles it.

## When NOT to reach for this

- **You're on Claude Code or another harness that loads skills natively.** The plugin's runtime value is the tool, and its keyword router is weaker than the model reading the prose. Use the `skills/adhd-copilot/` text directly.
- **You need persistence, a profile, or reminders.** It persists nothing by design. See [[Profile__ADHD-Copilot]] (profile tracker), [[Profile__Claude-ADHD-Skills]] (SQLite nudges), or [[Profile__ADHD-Claude-Skill]] (`~/.claude/adhd/` files).
- **You need research grounding to cite.** The cognitive facts are uncited.
- **Your users write in English.** The skill text, module names, rendered replies, and most routing keywords are Chinese; English keyword coverage is a handful per state (`src/index.js:110-134`).
- **You want something tested on model behavior.** The tests cover the pure functions only; it has no evals.
- **You need a mature dependency.** v0.1.0, one commit (`package.json:3`).

## One-line summary

> `dsh-adhd-copilot` packages a Chinese ADHD coaching method (seven states, eight modules, "emotion > structure > start", 1-3 steps under 60 seconds, end on a 30-second action, no fake timers, no promised memory) as a DeepSeek Harness plugin whose only runtime surface is a keyword-routed `adhd_breakdown` tool (`src/index.js:537-592`), with the Markdown skill shipped alongside but unloaded (`src/index.js:20-23`). That makes it the study's one example of compiling a skill's judgment into code, and a clear look at what that compilation loses.

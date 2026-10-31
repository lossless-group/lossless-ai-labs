---
name: ADHD Copilot Profile
slug: adhd-copilot
upstream: https://github.com/dsx0511/adhd-copilot
package: "Claude Code plugin via marketplace (`/plugin marketplace add https://github.com/dsx0511/adhd-copilot`, then `/plugin install adhd-copilot@adhd-copilot-marketplace`), or manual copy of `skills/<name>/` into `.claude/skills/`"
license: "NONE (no LICENSE file at the pinned commit; README and both plugin manifests declare MIT, but no license text ships; treat as all rights reserved, quote sparingly)"
maintainer: Shuxiao Ding (github.com/dsx0511); single "Initial commit" 1f428ec, 2026-03-31
study: studies/adhd-and-executive-function-skills
profile_path: studies/adhd-and-executive-function-skills/adhd-copilot
profile_kind: co-triggered coaching skill pair plus consented adaptive user profile
date_created: 2026-10-29
site_uuid: 05a00357-9d4f-493e-98ab-43f21edcb28e
hex_code: mu8sox
date_authored_initial_draft: 2026-10-29
date_authored_current_draft: 2026-10-29
lede: >-
  A coaching skill that splits itself in two: one half talks the user out of being stuck,
  the other half quietly takes notes on what worked and asks permission before keeping them.
summary: >-
  Source-cited profile of the adhd-copilot submodule in the ADHD and executive-function study,
  the collection's "companion plus adaptive profile" entry. Covers the three-skill layout (an
  English and a Chinese copilot that share one `name`, plus a co-triggering `adhd-profile-tracker`),
  the three daily scenarios (can't start, can't stop, anticipatory anxiety), the research-mode
  "Thread Checkpoint" with its exact numeric thresholds (4+ unresolved threads, max 2 checkpoints per
  session), and the consent-gated profile whose storage path is claude.ai's upload sandbox, which
  makes it a user-carried file in practice. Records three drift findings: a missing license file,
  duplicate skill names, and a dependency on a `research-copilot` skill that does not ship. Read it
  when deciding how to split coaching from memory, how to gate profile writes on consent, or how to
  set a divergence threshold for research sessions.
publish: true
from: "studies/adhd-and-executive-function-skills"
from_path: "context-v/profiles/Profile__ADHD-Copilot.md"
---
# ADHD Copilot — Profile

A profile of `dsx0511/adhd-copilot` as pinned in this study (`studies/adhd-and-executive-function-skills/adhd-copilot/`, commit `1f428ec`). Every claim cites a pinned path relative to the submodule. Read it beside [[Profile__DSH-ADHD-Copilot]] (the other coaching entry, same "copilot" framing, written for a different harness), [[Profile__ADHD-Study-Coach]] (the other entry whose state is a file the user carries between chats), and [[Profile__ADHD-Claude-Skill]] (state as real files under `~/.claude/`). Where [[Profile__I-Have-ADHD]] changes how every answer reads, this repo changes what the agent *does* when the user is stuck, and adds a second skill whose only job is to remember.

## TL;DR

- **Three skills, one plugin.** `skills/adhd-copilot-en/SKILL.md` (233 lines), `skills/adhd-copilot-zh/SKILL.md` (229 lines), and `skills/adhd-profile-tracker/SKILL.md` (170 lines), plus a 45-line starter profile at `skills/adhd-profile-tracker/assets/adhd-profile-starter.md`. The marketplace install puts all three in at once (`README.md:69`).
- **Two modes in the copilot.** Daily Mode covers three scenarios: can't start, can't stop, anticipatory anxiety (`skills/adhd-copilot-en/SKILL.md:48-100`). Research Mode is a "background cognitive monitor" that runs beside a `research-copilot` skill (`skills/adhd-copilot-en/SKILL.md:104-106`).
- **Hard numbers.** A 2-minute first step (`en/SKILL.md:58`); plan steps of 5-25 minutes with a 5-minute break every 2-3 steps (`en/SKILL.md:199-200`); 1-3 options at a time (`en/SKILL.md:193`); no intervention for the first 3-4 topic switches, a Thread Checkpoint at 4+ unresolved threads, at most 2 full checkpoints per session (`en/SKILL.md:173-177`).
- **The profile tracker is the distinctive part.** It co-triggers "whenever adhd-copilot is active" (`adhd-profile-tracker/SKILL.md:6-7`), observes along four dimensions, and at session end *proposes* updates the user must approve (`adhd-profile-tracker/SKILL.md:104-119`). It "never records anything without user consent" (`adhd-profile-tracker/SKILL.md:9`).
- **State is a file the user re-uploads.** The tracker reads `/mnt/user-data/uploads/adhd-profile.md` (`adhd-profile-tracker/SKILL.md:29`) and tells the user to "upload this file at the start of your next conversation" (`adhd-profile-tracker/SKILL.md:119`). That is a claude.ai upload path, not a Claude Code path, even though the README sells it as a Claude Code skill (`README.md:3`).
- **No research citations, no hooks, no evals, no scripts.** The only "citation" match in the repo is the phrase "Citation chain deepens understanding of one topic" (`en/SKILL.md:122`). The grounding is a three-point model of the ADHD brain (`en/SKILL.md:36-44`) and the author's own self-report in the starter profile (`assets/adhd-profile-starter.md:12-19`).

## Why this exists — the design bet

The bet is that **coaching and memory are different jobs and should be different skills.** The copilot tells the agent how to respond in the moment. The tracker is told outright that it does not intervene: "You do NOT handle ADHD strategies or interventions directly — that's the main copilot's job" (`adhd-profile-tracker/SKILL.md:16`). Its four jobs are load, observe, propose, write (`adhd-profile-tracker/SKILL.md:17-20`). Splitting them lets the same memory layer serve both language versions (`README.md:12`).

The second bet is that **a generic strategy list loses to the user's own data.** The tracker's highest-value section is "User's Own Hacks", labeled "most important section" in the profile template (`adhd-profile-tracker/SKILL.md:152-154`), because those "are the most valuable, always more effective than generic advice" (`adhd-profile-tracker/SKILL.md:58`). On load, the profile reorders the copilot's behavior: prefer strategies marked effective, avoid rejected ones, and quote the user's hack back to them (`adhd-profile-tracker/SKILL.md:85-88`).

The third bet is specific to the author's own work: **research divergence is an ADHD failure mode worth its own mode.** Part B names four patterns ("Thread spawning without closure", "Depth-to-breadth collapse", "Novelty chasing", "The 'I'll come back to it' graveyard", `en/SKILL.md:110-115`) and then separates them from "productive divergence" that must not be interrupted (`en/SKILL.md:119-123`). The starter profile shows where this came from: the author lists research fields in generative AI, computer vision, diffusion models, segmentation, and autonomous driving (`assets/adhd-profile-starter.md:36`), and the example prompt is "explore diffusion models for segmentation" (`README.md:119`).

## What's inside this submodule

```
adhd-copilot/                                   (7 tracked files, 1 commit)
├── README.md                                   146 lines; layers, principles, install, adaptive loop
├── .claude-plugin/
│   ├── marketplace.json                        marketplace "adhd-copilot-marketplace", plugin v1.0.0
│   └── plugin.json                             "skills": "./skills/" (line 20)
└── skills/
    ├── adhd-copilot-en/SKILL.md                233 lines, fully English
    ├── adhd-copilot-zh/SKILL.md                229 lines, daily mode Chinese, research mode English
    └── adhd-profile-tracker/
        ├── SKILL.md                            170 lines; load / observe / adjust / propose / format
        └── assets/adhd-profile-starter.md      45 lines, in Chinese, pre-filled from the author's self-report
```

- `README.md:7-10` is the language table: the zh version runs daily mode in Chinese and research mode in English; the en version is English throughout.
- `README.md:16-44` lays out the three layers (Daily, Research, Adaptive Learning).
- `README.md:137-142` is the four-step adaptive loop (first session defaults, observe, propose at end, read on next start).
- `.claude-plugin/plugin.json:20` points the plugin at the whole `skills/` directory, so all three skills load together.
- The en and zh copilots are structurally parallel: both have Core Philosophy, Part A, Part B, General Interaction Principles, Tool Usage, Quick Decision Flow (zh headings at `zh/SKILL.md:29,41,97,175,209,214`). Part B in the zh file is in English, matching the language rule "日常模式用中文，科研模式用英文" ("daily mode in Chinese, research mode in English", `zh/SKILL.md:178`).
- The zh Quick Decision Flow adds a Step 1 the en file lacks: pick the mode by language, "科研内容用英文进入科研模式，否则用中文进入日常模式" ("research content: enter research mode in English; otherwise daily mode in Chinese", `zh/SKILL.md:218`).

## How it scores against the study checklist

### Locus of intervention

**User's task flow first, persistent state second, output shape barely.** Daily Mode changes what the user does next: break the task to an "absurdly small" step (`en/SKILL.md:57`), design "exit ramps" not "emergency brakes" (`en/SKILL.md:79`), externalize a looping thought (`en/SKILL.md:97`). Research Mode changes the conversation's direction with a Thread Map and a re-anchoring question (`en/SKILL.md:133-155`). The tracker owns persistent state. Output-shape rules exist but are thin compared with [[Profile__I-Have-ADHD]]: empathize in 1-2 sentences, then a plan; 1-3 options (`en/SKILL.md:190-194`). The copilot can also write artifacts: markdown checklist files for plans, time-blocking visualizations, and markdown files when checkpoints get long (`en/SKILL.md:215-219`).

### Triggering

- **Copilot: model-invoked from the description.** The `description` lists daily scenarios and keyword triggers ("ADHD/attention/focus/distraction/procrastination/executive function/\"can't start\"/\"can't stop\"...", `en/SKILL.md:6-11`) and research triggers ("frequently jumps between topics ... accumulates too many unclosed exploration threads", `en/SKILL.md:12-16`). The README repeats this as "activates automatically when Claude Code detects relevant context" (`README.md:101-111`).
- **Research mode: co-triggered with another skill.** It "works alongside the research-copilot skill" (`en/SKILL.md:106`) and "should co-trigger" with it (`en/SKILL.md:16`). No `research-copilot` ships in this repo; the only occurrences are references to it.
- **Tracker: co-triggered with the copilot.** "This skill should activate whenever adhd-copilot is active" (`adhd-profile-tracker/SKILL.md:6-7`). There is no hook enforcing this; co-triggering depends entirely on the model honoring two descriptions at once.
- **No slash command, no SessionStart hook.** Nothing in `.claude-plugin/` declares hooks or commands (`plugin.json:1-21`).

### Trigger heuristics (exact numbers)

| Heuristic | Value | Source |
|---|---|---|
| First step size | 2 minutes ("2-minute launch method") | `en/SKILL.md:58`, `zh/SKILL.md:51` |
| Plan step length | 5-25 minutes | `en/SKILL.md:70,199` |
| Break cadence | 5-minute break every 2-3 steps | `en/SKILL.md:200` |
| Options per turn | 1-3; offer 2-3 when need is unclear | `en/SKILL.md:193-194` |
| Empathy budget | 1-2 sentences before the plan | `en/SKILL.md:191` |
| ADHD-pattern signal | 3+ substantially different topics in quick succession | `en/SKILL.md:128` |
| Grace period | first 3-4 topic switches: no intervention | `en/SKILL.md:173` |
| Checkpoint trigger | 4+ unresolved threads | `en/SKILL.md:174`; default restated in `assets/adhd-profile-starter.md:33,44` |
| Checkpoint cap | max 2 full Thread Checkpoints per session, then one-liners | `en/SKILL.md:177` |
| Override | user frustrated or overwhelmed: intervene immediately | `en/SKILL.md:176` |
| Adaptive threshold | low capacity (e.g. 3) → earlier; high capacity → relax to 5-6 | `adhd-profile-tracker/SKILL.md:81-83` |
| Example capacities | "some people: 3, others: 6" | `adhd-profile-tracker/SKILL.md:65` |

The zh file carries the same research-mode numbers verbatim (`zh/SKILL.md:164-171`). The 4-thread default is the one threshold the profile is explicitly meant to tune, which makes it the only *adaptive* numeric trigger in the repo.

### State

- **One markdown profile, `adhd-profile.md`.** Load path: `/mnt/user-data/uploads/adhd-profile.md` (`adhd-profile-tracker/SKILL.md:28-30`). If absent, "First session. Run with defaults. Start observing." (`adhd-profile-tracker/SKILL.md:33`).
- **Write path is a handoff, not a file write.** After consent, the agent generates the updated file and tells the user to upload it next time (`adhd-profile-tracker/SKILL.md:119`). The Chinese starter says the same: upload this file at the start of each new conversation; at the end the skill may suggest updates, and you save the new version ("每次开始新对话时上传此文件 ... 确认后会生成新版本供你替换保存", `assets/adhd-profile-starter.md:6-7`).
- **Schema** (`adhd-profile-tracker/SKILL.md:125-170`): Last Updated; Main Difficulty Distribution (five categories with frequency words); Effective Strategies; Ineffective / Rejected Strategies; User's Own Hacks; Personal Patterns (help-seeking times, stuck task types, research thread capacity, hyperfocus triggers, preferred style); Progress Log; Current Adjustments ("because [reason], so [specific change]").
- **Four observation dimensions** feed it: difficulty type frequency, what works and what doesn't, personal patterns and triggers, progress and change (`adhd-profile-tracker/SKILL.md:41-73`).
- **Practical consequence.** In Claude Code there is no `/mnt/user-data/uploads/`, and nothing tells the agent where else to look or write. The README's manual install puts skills in `~/.claude/skills/` (`README.md:80-82`) but says nothing about where the profile lives. So the working state model is the same as [[Profile__ADHD-Study-Coach]]'s pasted Progress Card: the user carries the file.

### Grounding

**Lived experience plus a short folk model; no cited research.** The Core Philosophy names three characteristics: "Dopamine-driven", "Limited working memory", "Different time perception" (`en/SKILL.md:40-44`). None is attributed to a source. The starter profile is the author's own self-report, each difficulty marked "显著" (significant) with the user's words quoted, e.g. starting is "极度困难" (extremely hard) (`assets/adhd-profile-starter.md:13-16`). The boundaries section disclaims clinical authority: not a doctor or therapist, no medication advice (`en/SKILL.md:210-211`). Compare [[Profile__ADHD-Study-Coach]], which rates the strength of each research citation.

### Tone rules / anti-nag

- **Never lecture.** "Never say 'you just need to start'" (`en/SKILL.md:56`); avoid "you should..." phrasing (`en/SKILL.md:187`); no "I understand how you feel" (`en/SKILL.md:188`).
- **Never judge.** Hyperfocus "isn't 'lack of self-control'" (`en/SKILL.md:78`); reframe self-blame as "your brain just needs a different startup sequence" (`en/SKILL.md:206`), then redirect "from 'why' to 'what next'" (`en/SKILL.md:207`).
- **Permission to stop.** The launch template ends "If not, that's totally fine — you've already broken the 'zero' state" (`en/SKILL.md:68`).
- **Ask, don't command.** Re-anchoring is "a question, not a command" (`en/SKILL.md:151`); when the user picks a thread the agent says it is "holding the other threads" (`en/SKILL.md:155`).
- **Anti-nag budget in research mode.** Grace period, a 2-checkpoint cap, lighter one-liners afterward ("Quick check — we're branching again. Intentional?", `en/SKILL.md:160`), and "Never interrupt mid-thought" (`en/SKILL.md:178`).
- **Consent before memory.** Transparent, user can veto, non-judgmental vocabulary ("patterns" and "preferences," never "symptoms," "problems," or "deficits"), gradual, humble ("I noticed what seems like...") (`adhd-profile-tracker/SKILL.md:112-117`). Proposals happen "only when you observed noteworthy new information", not after every message (`adhd-profile-tracker/SKILL.md:106`).
- **Quiet load.** The tracker applies the profile silently and does not announce "I've loaded your profile" (`adhd-profile-tracker/SKILL.md:32`). That fits "no secret recording" (`:113`) because the user uploaded the file themselves.
- **Praise rules.** Progress mentions are "Brief and genuine. Never effusive or condescending." (`adhd-profile-tracker/SKILL.md:100`).
- **"Just wants to talk" is a valid state.** "Be present, don't rush to give advice" (`en/SKILL.md:231`).

### Packaging

A Claude Code plugin with a one-plugin marketplace (`.claude-plugin/marketplace.json:8-24`, `plugin.json:1-21`), version `1.0.0`, three skills under `skills/`. No hooks, commands, evals, tests, or harness ports beyond Claude Code. Two packaging defects at this commit:

1. **Duplicate skill name.** Both copilots declare `name: adhd-copilot` (`en/SKILL.md:2`, `zh/SKILL.md:2`), and the marketplace path installs both (`README.md:69`). The manual path avoids the clash only because the README tells you to copy one of them into `adhd-copilot/` (`README.md:76-90`).
2. **License mismatch.** `README.md:146`, `plugin.json:10`, and `marketplace.json:14` all say MIT, but no LICENSE file is tracked (7 files total). Treat as all rights reserved.

## Mental model for using it well

1. **Read the copilot as a decision tree with seven leaves.** The Quick Decision Flow (`en/SKILL.md:222-233`) maps the message to start / stop / trapped by a commitment / planning / self-blame / research divergence / just talk. When unclear, the fallback is a single question listing the three daily states (`en/SKILL.md:233`). That question is the cheapest thing to copy.
2. **Treat the tracker as a protocol, not a store.** What is reusable is the order: load quietly, observe along four fixed dimensions, propose with the user's veto, write once. Where the file lives is the part to replace.
3. **Separate the two thresholds.** "3+ topics in quick succession" (`en/SKILL.md:128`) is a *detection* signal; "4+ unresolved threads" (`en/SKILL.md:174`) is the *action* threshold. Productive divergence (`en/SKILL.md:119-123`) suppresses both.
4. **Make the profile tune the trigger.** The one place memory changes a number is thread capacity (`adhd-profile-tracker/SKILL.md:81-83`). That is the clearest example in the study of a profile changing a threshold, not just tone.
5. **Expect co-triggering to be soft.** Both co-triggers (copilot + research-copilot, copilot + tracker) rely on description text. If you need them reliably, use a hook ([[Profile__Claude-ADHD-Skills]], [[Profile__I-Have-ADHD]]) or a slash command ([[Profile__ADHD-Claude-Skill]]).

## How this compares to the rest of the study

Sibling cells come from the study README's design-space table and per-repo blurbs (`../README.md:25-33`, `:56-146`), not from deep reads.

| Entry | Locus | Triggering | State | Grounding | Anti-nag signature |
|---|---|---|---|---|---|
| **adhd-copilot** | task flow + research direction; profile | description; co-trigger with tracker and `research-copilot` | `adhd-profile.md` re-uploaded by user | folk model + author's self-report | 4-thread grace, max 2 checkpoints, consent before writes |
| [[Profile__I-Have-ADHD]] | output shape | always-on SessionStart hook (opt-in file) | none (opt-in marker file) | "five facts" about reading | shape only, no interventions |
| [[Profile__ND-Skills]] | per-EF-construct skills | description, numeric triggers | none noted | EF taxonomy | narrow skills with thresholds (8+ turns, 3+ errors, <15% overlap) |
| [[Profile__Claude-ADHD-Skills]] | time awareness, reminders, journal | hooks on prompt submit | SQLite + Obsidian | lived experience | nudges need user input to fire |
| [[Profile__ADHD-Claude-Skill]] | session discipline | `/adhd` subcommands | `~/.claude/adhd/` files | lived experience | park, don't follow |
| [[Profile__AuDHD-Executive-Function]] | whole external EF system | daily workbench | `references/user-profile.md` | `references/research.md` | everything clickable or checkable |
| [[Profile__DSH-ADHD-Copilot]] | behavioral coaching | DeepSeek Harness skill | none noted | coaching framing | lower the cost of starting |
| [[Profile__ADHD-Skills]] | ritual reviews | user-run rituals | org-mode files | personal practice | target durations; user does the work |
| [[Profile__ADHD-Study-Coach]] | learning sessions | description | pasted Progress Card | cited, strength-rated research | card treated as data |

Where adhd-copilot is distinctive: it is the only entry whose profile is **written by the agent from observation and gated on per-session consent**. [[Profile__AuDHD-Executive-Function]] also reads a user profile, but the study README describes it as input, not as something the agent proposes edits to. It is also the only entry with a dedicated **research-divergence** mode, which overlaps in spirit with `nd-research-gate` in [[Profile__ND-Skills]] (8+ turns without a state change, per `../README.md:73`) but counts unresolved threads instead of turns.

## How this compares to our own work

**`ai-labs/hope-ai/` (the PSP skill, `hope-ai/context-v/agent-skills/personal-strategic-plan/SKILL.md`).**

- *Shared tone.* PSP asks for "warm, direct, and practical" (`personal-strategic-plan/SKILL.md:9`); adhd-copilot asks for "Warm, direct, not verbose" (`en/SKILL.md:185`). Both cap new load: PSP warns against too many new habits at once (`personal-strategic-plan/SKILL.md:3`), adhd-copilot caps options at 1-3.
- *Different state model.* PSP keeps progress in `tracker.yaml` plus one `log/week-NN.yaml` per week (`personal-strategic-plan/SKILL.md:165-168`) and explicitly handles three setups: files, a Project (hand back changed files), or a single chat (`personal-strategic-plan/SKILL.md:100-103`). adhd-copilot assumes a single upload path and has no fallback. PSP's "say which setup you're in" rule is the fix adhd-copilot's tracker needs.
- *Different unit of memory.* PSP records what the member *did* against numbers. adhd-copilot's profile records what *worked for them* (strategies, hacks, thread capacity). A PSP check-in could borrow the "Effective / Rejected / Own Hacks" sections without touching the scorecard.
- *Consent.* PSP's privacy rule keeps personal details out of anything shared (`personal-strategic-plan/SKILL.md:96-99`); adhd-copilot gates every profile write on a visible proposal. They are complementary, and PSP has no equivalent of "propose, then write".

**`talk-normal` (`context-v/agent-skills/talk-normal/skill/SKILL.md`).** talk-normal is an always-on output-style installer that injects rules into `AGENTS.md` and is "not a workflow skill you invoke per turn" (`talk-normal/skill/SKILL.md:17-19`). It is bilingual English and Chinese, like this repo, but it bilingualizes one ruleset, while adhd-copilot forks into two skill files with the same `name`. talk-normal belongs with [[Profile__I-Have-ADHD]] on the output-shape end. adhd-copilot works on task flow and memory and could run under talk-normal without conflict, apart from the copilot's light humor and emoji Thread Map (`en/SKILL.md:89,143-146`).

## When NOT to reach for this

- **You need reliable cross-session memory in Claude Code.** The profile path is claude.ai's upload sandbox (`adhd-profile-tracker/SKILL.md:29`), and there is no write-to-disk step. Use [[Profile__ADHD-Claude-Skill]] (`~/.claude/adhd/`) or [[Profile__Claude-ADHD-Skills]] (SQLite) as the state reference.
- **You want research mode standalone.** It is written to sit beside a `research-copilot` that is not in this repo (`en/SKILL.md:106`).
- **You need guaranteed triggering.** No hooks, no commands; both co-triggers are description-only.
- **You need evidence-graded rules.** Nothing is cited. Use [[Profile__ADHD-Study-Coach]] or [[Profile__AuDHD-Executive-Function]] for grounding.
- **You want to copy text.** No LICENSE file at `1f428ec`; quote briefly and cite.
- **You only want output formatting.** Use [[Profile__I-Have-ADHD]] or talk-normal; this repo's output rules are a few lines inside a coaching skill.

## One-line summary

> adhd-copilot splits ADHD support into a coach (three daily scenarios plus a research-mode Thread Checkpoint at 4+ unresolved threads, capped at 2 per session) and a co-triggered tracker that proposes consent-gated profile updates, but at this commit the profile lives at a claude.ai upload path, so the user carries the memory themselves.

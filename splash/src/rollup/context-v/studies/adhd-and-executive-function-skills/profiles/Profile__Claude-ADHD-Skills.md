---
name: Claude ADHD Skills Profile
slug: claude-adhd-skills
upstream: https://github.com/ravila4/claude-adhd-skills
package: none (git clone, then `cp -r skills/* ~/.claude/skills/` and `cp hooks/* ~/.claude/hooks/`; hooks wired by hand into `~/.claude/settings.json`)
license: MIT
maintainer: Ricardo Avila (`ravila4`, sole committer at the pin)
study: studies/adhd-and-executive-function-skills
profile_path: studies/adhd-and-executive-function-skills/claude-adhd-skills
profile_kind: Claude Code hooks + SQLite nudges + Obsidian journaling
title: "Claude ADHD Skills — Profile"
status: Reference
authors:
  - Michael Staton
date_created: 2026-10-29
date_modified: 2026-10-31
site_uuid: 16dba865-80cd-4ee6-98a3-da9f4e8d73d6
hex_code: tby3zs
date_authored_initial_draft: 2026-10-29
date_authored_current_draft: 2026-10-29
lede: >-
  Give the agent a clock and a sticky note, then let an Obsidian vault
  remember yesterday: time blindness solved with two `UserPromptSubmit` hooks
  and a 4-column SQLite table.
summary: >-
  Source-cited profile of ravila4/claude-adhd-skills (pinned at f99e0a3) for
  the adhd-and-executive-function-skills study. It is the study's hooks
  reference: a date-injection hook and a SQLite-backed `nudge` skill that
  surfaces due reminders on every prompt submit, plus a conversational
  `daily-journal` skill and an `obsidian-vault` skill that turn an Obsidian
  vault into cross-session memory. Covers the four skills, the three Python
  hook scripts, the template CLAUDE.md where the actual ADHD pacing rules
  live, every concrete threshold, the state model, and the honest limits
  (nudges cannot fire without user input). Read this when designing
  time-awareness or reminder hooks, choosing a cross-session state store, or
  deciding whether ADHD support belongs in a skill, a hook, or CLAUDE.md.
publish: true
type: Profiles
from: "studies/adhd-and-executive-function-skills"
from_path: "context-v/profiles/Profile__Claude-ADHD-Skills.md"
---
# Claude ADHD Skills — Profile

A profile of `claude-adhd-skills` as pinned in this study (`studies/adhd-and-executive-function-skills/claude-adhd-skills/`, commit `f99e0a3`). Paths below are relative to that submodule. Read it alongside [[Profile__I-Have-ADHD]] (output shape), [[Profile__ND-Skills]] (EF taxonomy), [[Profile__ADHD-Claude-Skill]] (session enforcer with file state), [[Profile__AuDHD-Executive-Function]] (agent as external EF), [[Profile__ADHD-Copilot]] (adaptive profile), [[Profile__DSH-ADHD-Copilot]] (behavioral coaching), [[Profile__ADHD-Skills]] (org-mode rituals), and [[Profile__ADHD-Study-Coach]] (learning domain). This entry is the one that puts the intervention in the **harness**, not in the prompt.

## TL;DR

Four skills, three hook scripts, one template `CLAUDE.md`, and a settings snippet (`README.md:9-31`). The load-bearing pieces are not skills at all; they are two `UserPromptSubmit` hook commands (`settings.json.example:1-16`):

1. `echo "Today is $(date '+%A, %B %d, %Y'). Time: $(date '+%H:%M')"`, which gives the agent the wall clock on every turn (`settings.json.example:6`).
2. `python3 ~/.claude/hooks/check_alerts.py`, which prints any due, unacknowledged reminder from a SQLite table (`hooks/check_alerts.py:25-48`).

The skills then *use* that clock: `nudge` writes reminders (`skills/nudge/SKILL.md:27-37`), `daily-journal` picks planning, mid-day or reflection mode from the hour (`skills/daily-journal/SKILL.md:80-100`), and `obsidian-vault` governs where notes land so the vault can serve as memory between sessions (`README.md:7`). A fourth skill, `test-driven-development`, is general practice the author keeps because his `CLAUDE.md` references it (`README.md:18`).

The ADHD-specific behavior rules are not in any skill. They sit in the template `CLAUDE.md` under "Focus and Pacing" (`CLAUDE.md:54-61`). The author's own framing is "(No ADHD required!)" (`README.md:3`) and "scaffolding for staying organized while developing with AI agents" (`README.md:5`).

## Why this exists — the design bet

The README names three problems and one mechanism for each (`README.md:5`):

- **Time blindness:** "time awareness (so Claude knows when to tell me to stop)". The agent has no clock unless a hook supplies one.
- **Lost context across days:** "Obsidian integration (so I can store research and reconstruct what I was doing yesterday)".
- **Unkept intentions:** "a nudge system (so promises to 'wrap up in 30 minutes' actually stick)".

The bet: **an agent can only enforce pacing if it can perceive time, and it can only perceive time if the harness injects it.** So the intervention lives in hooks and an external store, not in output style. The vault is the second half of the bet. "Because agents can read and write to the vault, it becomes a shared memory between sessions. I can point a new Claude instance at yesterday's journal entry and ask the agent to catch up instead of re-explaining context" (`README.md:7`).

The repo also takes a stance on what the agent should *not* do in the journal: "Commits are not what matters... Conversation first, data second" (`skills/daily-journal/SKILL.md:25-32`). Activity data jogs memory; it never authors the entry.

## What's inside this submodule

```
claude-adhd-skills/                     (9 commits, all 2026-02-28, one author)
├── README.md                           134 lines; install + customization
├── CLAUDE.md                           80-line template; Focus and Pacing at :54-61
├── settings.json.example               the two UserPromptSubmit hooks
├── LICENSE                             MIT
├── .gitignore                          *.db ignored (alerts.db never committed)
├── hooks/
│   ├── add_alert.py                    86 lines; parses +30m / +2h / HH:MM / full datetime
│   ├── check_alerts.py                 52 lines; the hook; prints due, unacked alerts
│   └── ack_alert.py                    35 lines; sets acknowledged = 1
├── skills/
│   ├── nudge/SKILL.md                  91 lines
│   ├── daily-journal/
│   │   ├── SKILL.md                    325 lines; time-aware conversational journal
│   │   ├── scripts/collect_day_data.py 653 lines; git + ~/.claude/projects JSONL scan
│   │   ├── templates/                  daily-log.md, writing-guidelines.md
│   │   └── references/                 9 files: modes, sections, callouts, log formats,
│   │                                   high-signal patterns, session patterns, caveats
│   ├── obsidian-vault/
│   │   ├── SKILL.md                    264 lines
│   │   └── references/                 vault_structure.md, markdown_formatting.md
│   └── test-driven-development/SKILL.md 145 lines; Logic Gate + Iron Rule
└── examples/daily-log/                 three real entries (2026-01-24, 02-06, 02-07)
```

One historical note visible in git: commit `c88d549` ("Move work-tracker to branch") deleted `hooks/work.py` (237 lines) and `skills/work-tracker/SKILL.md` (116 lines) from `main`. No such branch exists on the remote at the pin (`git branch -a` shows only `main`). The example log `examples/daily-log/2026-02-06.md:22` describes it as planned: "Time tracking skill/hook... SQLite + hook, same pattern as the alerts skill... periodic elapsed-time reminders, ADHD-friendly break suggestions". At this pin, elapsed-time tracking is not shipped.

## How it scores against the study checklist

### Locus of intervention

Mostly **user task flow plus persistent state**, with almost nothing on output shape.

- Task flow: nudges fire a "reason - action" note that tells the agent what to do, e.g. "User asked to stop at 11 PM - wrap up current work and suggest break" (`skills/nudge/SKILL.md:53-69`). The template `CLAUDE.md` asks the agent to break complex work into focused steps, suggest breaks, and suggest stepping away after significant completions (`CLAUDE.md:58-60`).
- Persistent state: SQLite for reminders, Obsidian for journal and notes.
- Output shape: only inside journal entries. User voice goes in blockquotes, LLM context in `[!info]` callouts, technical detail in `<details>` (`skills/daily-journal/SKILL.md:163-199`). The writing guidelines ban "dramatic language" and "narrative arc" (`skills/daily-journal/templates/writing-guidelines.md:37-42`). Nothing governs the shape of ordinary chat replies, which is the whole point of [[Profile__I-Have-ADHD]].

### Triggering

| Piece | Trigger | Source |
|---|---|---|
| Date/time line | Always-on, `UserPromptSubmit` hook | `settings.json.example:3-8` |
| Due-nudge check | Always-on, `UserPromptSubmit` hook | `settings.json.example:9-13` |
| `nudge` | Model-invoked from description; told to set nudges **proactively** | `skills/nudge/SKILL.md:3`, `:12-16` |
| `daily-journal` | User-invocable (`userInvocable: true`, `[--date YYYY-MM-DD] [--quick]`) and model-invoked on "what did I work on today/this week?" | `skills/daily-journal/SKILL.md:1-6` |
| `obsidian-vault` | Model-invoked on any note create/update/organize | `skills/obsidian-vault/SKILL.md:1-22` |
| Focus and Pacing rules | Always-on via `~/.claude/CLAUDE.md` | `README.md:76-82`; `CLAUDE.md:54-61` |

### Trigger heuristics (exact numbers)

| Threshold | Where | Source |
|---|---|---|
| Set a nudge when a focus session runs **2+ hours** without breaks | `nudge` | `skills/nudge/SKILL.md:15` |
| Suggest a break when stuck **over an hour** | template `CLAUDE.md` | `CLAUDE.md:59` |
| Relative nudge times `+Nm` / `+Nh`; absolute `HH:MM` (today) or `YYYY-MM-DD HH:MM` | `add_alert.py` | `hooks/add_alert.py:26-57` |
| Nudge due when `due_at <= now`, compared at **minute** resolution as strings | `check_alerts.py` | `hooks/check_alerts.py:25-38` |
| Hook timeout **5000 ms** each | settings | `settings.json.example:7`, `:12` |
| Journal mode: **before noon** planning, **12-5pm** mid-day check, **after 5pm** reflection, **Saturday/Sunday** lighter touch + `weekend` tag | `daily-journal` | `skills/daily-journal/SKILL.md:84-99` |
| Commands section only if **3+** significant bash commands (trivial `ls`/`cat`/`cd` excluded) | `daily-journal` | `skills/daily-journal/references/section_guide.md:52-55` |
| "Main Issues" capped at **3-5** | writing guidelines | `skills/daily-journal/templates/writing-guidelines.md:66` |
| User requests truncated to **200** chars when mined from session logs | collector | `skills/daily-journal/scripts/collect_day_data.py:277-295` |
| Key-moment tagging by keyword: "memory"/"scale" → INSIGHT, "refactor" → ACTION, "test" + "passing"/"failed"/"error" → TESTING, "commit" → COMPLETION, error regex → PROBLEM (first 100 chars) | collector | `skills/daily-journal/scripts/collect_day_data.py:334-391` |
| Raw-journal detection: no H2 headers, mostly code blocks, no frontmatter | `daily-journal` | `skills/daily-journal/references/modes_and_workflows.md:68-90` |

The keyword tagger is crude by design; the skill treats its output as a memory jogger, "Never as the source of truth for what mattered" (`skills/daily-journal/SKILL.md:141-147`).

### State

Two stores, both outside the conversation:

1. **SQLite** at `alerts.db` beside the hook scripts (`DB_PATH = Path(__file__).parent / "alerts.db"`, `hooks/check_alerts.py:8`; same in `hooks/add_alert.py:9`, `hooks/ack_alert.py:8`). After the README install that is `~/.claude/hooks/alerts.db` (`README.md:45-46`). Schema: `id`, `due_at TEXT`, `message TEXT`, `created_at`, `acknowledged INTEGER` (`skills/nudge/SKILL.md:79-91`; created idempotently in `hooks/check_alerts.py:11-22`). `.gitignore` excludes `*.db` (`.gitignore:1`).
2. **Obsidian vault**: `Daily Log/YYYY-MM-DD.md` for journals, `YYYY-MM-DD - Meeting Topic.md` for meetings, topic folders for everything else (`skills/obsidian-vault/SKILL.md:26-57`). Morning mode reads yesterday's entry and surfaces its "Tomorrow's focus" and "Open questions" (`skills/daily-journal/SKILL.md:104-112`), which is the cross-session handoff.

Read-only inputs: the collector scans every `.git` directory one level under `~/Projects` (default, `--projects-dir` overrides; `skills/daily-journal/scripts/collect_day_data.py:139-160`, `:629-633`) and every `*.jsonl` under `~/.claude/projects` whose mtime matches the target date (`:227-256`).

### Grounding

**Lived experience, no research citations.** The template states: "I have ADHD (mainly distraction component) and can lose track of time when hyperfocused" (`CLAUDE.md:56`). The README says the patterns are ones "I have found... help me" (`README.md:31`). A repo-wide search turns up no clinical or learning-science references. The engineering grounding is explicit instead: Feathers, Martin, Kleppmann (`CLAUDE.md:23-33`) and obra's Red/Green TDD skill (`README.md:18`). Compare [[Profile__ADHD-Study-Coach]], which rates the strength of every research citation, and [[Profile__AuDHD-Executive-Function]], which loads a `references/research.md` first (study `README.md:100-107`).

### Tone rules / anti-nag

- **Ask, don't assume.** "Conversation first, data second" (`skills/daily-journal/SKILL.md:32`). Data is offered only after the user has shared, and the user can say "no, that was just mechanical" (`:122-125`). Anti-patterns include "Fill in feelings or reflections without asking" and "Write in third person about the user" (`:310-319`).
- **Rest is valid.** Weekend mode asks "Did you rest?" "(rest is valid!)" (`skills/daily-journal/SKILL.md:131-137`); "Hobby projects are valid. Tooling optimization is valid" (`:34`).
- **No erasure of past thinking.** Strike through, don't delete: "even wrong thinking has value" (`skills/daily-journal/SKILL.md:270-288`).
- **Narrow nudge scope.** Not for work finishing this turn, not for memory, not for process monitoring (`skills/nudge/SKILL.md:18-21`).
- **Dismissal is explicit.** A fired nudge repeats on every prompt until the agent runs `ack_alert.py <id>` (`hooks/check_alerts.py:41-48`; `skills/nudge/SKILL.md:71-77`). There is no snooze, no recurrence, and no cap on repeats. That is the main nag risk: if the agent forgets to ack, the user sees the same "⏰ ALERTS DUE" line every turn.
- **Collegial, not deferential.** "We're colleagues... no formal hierarchy"; "Concur through action, not validation" (`CLAUDE.md:44-45`). Pushback is mandatory (`:48-49`).

There is no shame-free-language rule, no "never lecture" rule, and no "stop" phrase to disable the behavior beyond removing the hooks.

### Packaging

Copy-in only. No plugin manifest, no `.claude-plugin/`, no installer script, no evals, no tests (tree above). Install is `cp -r skills/* ~/.claude/skills/` and `cp hooks/* ~/.claude/hooks/` (`README.md:35-47`), a manual settings merge (`README.md:49-74`), filling `{PLACEHOLDERS}` in `CLAUDE.md` (`README.md:76-89`), and hand-editing the `obsidian-vault` description to include your vault path (`README.md:91-102`). Requirements: Claude Code, Python 3.10+, Obsidian, SQLite3, optional `obsidian-semantic` (`README.md:124-130`). The collector is a `uv run --script` with no dependencies (`skills/daily-journal/scripts/collect_day_data.py:1-4`). Claude Code only: the hooks use Claude Code's `UserPromptSubmit` event and the collector reads `~/.claude/projects`.

## Mental model for using it well

Think of it as **three layers with different owners**:

| Layer | Owner | Lifetime | Job |
|---|---|---|---|
| Hooks (`date`, `check_alerts.py`) | Harness | Every prompt | Perception: what time is it, is anything due |
| `CLAUDE.md` Focus and Pacing | Agent policy | Every session | Judgment: when to suggest a break or a stop |
| SQLite + Obsidian | Disk | Across sessions | Memory: what was promised, what happened yesterday |

Practical consequences:

1. **Nudges are prompt-gated.** "Nudges require user input (prompt submission) to fire" (`skills/nudge/SKILL.md:21`). If you walk away hyperfocused on something else, nothing fires. The nudge catches you only on your next message to the agent. For build polling the skill says use `sleep` in Bash instead (`:21`).
2. **Write nudges as notes to the agent, not to the human.** Format is `reason - action to take` (`skills/nudge/SKILL.md:53-69`), so the future agent knows *why* it is interrupting.
3. **Run the journal twice a day if you want continuity.** The morning planning mode depends on yesterday's evening entry existing (`skills/daily-journal/SKILL.md:104-112`).
4. **Keep the data in its place.** Lead with open questions; offer the collector's output only afterward or when the user says they can't remember (`skills/daily-journal/SKILL.md:139-147`).
5. **Search the vault before writing to it.** `obsidian-semantic search "<topic>" -n 5` before creating a note; read target notes before linking, "never guess from titles" (`skills/obsidian-vault/SKILL.md:129-131`, `:239-261`).

## How this compares to the rest of the study

Sibling characterizations below come from the study README, not from deep reads.

| Entry | Locus | Trigger | State | Grounding | Packaging |
|---|---|---|---|---|---|
| **claude-adhd-skills** | Task flow + state | Always-on hooks + model-invoked skills | SQLite + Obsidian vault | Lived experience | Copy-in; Claude Code only |
| [[Profile__I-Have-ADHD]] | Output shape | Always-on via opt-in SessionStart hook | None | "Five facts" about ADHD reading | ~10 harness manifests, evals, tests (study `README.md:56-65`) |
| [[Profile__ND-Skills]] | Agent behavior per EF construct | Model-invoked, numeric triggers (8+ turns, 3+ repeats, <15% overlap) | None | EF constructs | 24 skills plus an `nd` router (study `README.md:67-78`) |
| [[Profile__ADHD-Claude-Skill]] | Task flow | `/adhd` subcommands | Files under `~/.claude/adhd/` | Not stated | Single `SKILL.md` (study `README.md:90-98`) |
| [[Profile__AuDHD-Executive-Function]] | Agent produces the whole workbench | Daily | `references/user-profile.md` | `references/research.md` | Skill + references (study `README.md:100-107`) |
| [[Profile__ADHD-Copilot]] | Coaching + profile | Co-triggered tracker | Consented profile | Not stated | 3 skills, en/zh (study `README.md:109-117`) |
| [[Profile__DSH-ADHD-Copilot]] | Behavioral coaching | Skill | Not stated | Not stated | DeepSeek Harness (study `README.md:119-126`) |
| [[Profile__ADHD-Skills]] | Ritual reviews; user does the writing | User-invoked rituals with target durations | org-mode files | Personal | GTD + brain skills (study `README.md:128-136`) |
| [[Profile__ADHD-Study-Coach]] | Learning flow | Skill | User-carried Progress Card | Rated research citations | Claude + `universal/` variant (study `README.md:138-146`) |

What only this repo has: **harness-injected time on every turn** and **a timed reminder queue**. Closest neighbors: [[Profile__ADHD-Claude-Skill]] also persists state outside the chat, but per workstream and drift-focused, while this repo persists per time and per day. [[Profile__ADHD-Skills]] is the closest on "external vault, user does the reflection": org-mode there, Obsidian here.

## How this compares to our own work

**`ai-labs/hope-ai/` (PSP skill).** Both run a morning-and-evening rhythm. hope-ai's check-ins are "about 5 minutes": morning picks "the one avoided task to do first", evening counts against base and stretch with "never miss twice" (`hope-ai/context-v/agent-skills/personal-strategic-plan/SKILL.md:237-253`). `daily-journal` has the same split (`skills/daily-journal/SKILL.md:80-137`) but only *records*; it never scores. Both refuse to let the agent invent the user's account: hope-ai "never submit[s] it for them" (`personal-strategic-plan/SKILL.md:255-264`), and `daily-journal` forbids filling in feelings without asking (`skills/daily-journal/SKILL.md:310-319`). Both keep state in plain files outside the chat (`tracker.yaml` + `log/week-NN.yaml`, `personal-strategic-plan/SKILL.md:163-180`, versus Obsidian dailies). What hope-ai lacks and this repo has is perception: hope-ai cannot know it is morning unless told. A `date` hook like `settings.json.example:6` would let hope-ai pick morning or evening check-in mode without asking. The other transferable piece is hope-ai's "a day that isn't listed is 'not logged yet' and never counts as a miss" (`personal-strategic-plan/SKILL.md:173-175`), which is the anti-shame rule this repo's journal doesn't state.

**`talk-normal`** (`context-v/agent-skills/talk-normal/skill/SKILL.md`). talk-normal is an always-on output-style modifier installed into `AGENTS.md` that cuts verbosity "by 56-71% (measured)" (`talk-normal/skill/SKILL.md:4`, `:13-19`). That is the [[Profile__I-Have-ADHD]] axis. This repo is orthogonal: it does nothing to reply length. The two compose cleanly. talk-normal shapes the reply, and the hooks here add the clock and the reminder queue around it.

## When NOT to reach for this

- **You want every reply easier to read.** Nothing here changes response shape. Use [[Profile__I-Have-ADHD]] or talk-normal.
- **You need an alert while you're away from the agent.** Nudges fire only on your next prompt (`skills/nudge/SKILL.md:3`, `:21`). Use an OS notification or calendar.
- **You don't use Obsidian.** Two of four skills assume a vault, and `obsidian-vault` must be hand-edited with its path (`README.md:91-102`).
- **You're not on Claude Code.** The hooks and the session-log collector are Claude Code specific (`settings.json.example:3`; `skills/daily-journal/scripts/collect_day_data.py:232`).
- **You need elapsed-time or focus-session tracking.** It was removed from `main` before the pin (commit `c88d549`). The "2+ hours" heuristic relies on the agent noticing duration from the per-turn clock.
- **You want research-backed interventions.** This is one engineer's working setup, honestly labeled as such (`CLAUDE.md:56`; `README.md:31`).
- **You want a packaged, tested artifact.** No manifest, evals, or tests. Copy-in and customize.

## One-line summary

> claude-adhd-skills treats time blindness as a perception problem: two `UserPromptSubmit` hooks give the agent the clock and a SQLite reminder queue on every turn, and an Obsidian vault written by a conversational, ask-first journal carries yesterday into today. Nothing else in the study puts the intervention this firmly in the harness instead of the prompt.

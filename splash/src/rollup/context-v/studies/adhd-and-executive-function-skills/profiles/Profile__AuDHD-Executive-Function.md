---
name: AuDHD Executive Function Profile
slug: audhd-executive-function
upstream: https://github.com/assafkip/audhd-executive-function
package: "No package or manifest. Copy the folder to `.claude/skills/audhd-executive-function/` in a project and add an enforcement block to that project's `CLAUDE.md` (README.md:64-81)"
license: MIT
maintainer: Assaf Kipnis (LICENSE copyright line; sells a paid "Playbook" and Claude Code kits from the same README)
study: studies/adhd-and-executive-function-skills
profile_path: studies/adhd-and-executive-function-skills/audhd-executive-function
profile_kind: output-contract skill (single SKILL.md + research base + user-profile template)
date_created: 2026-10-29
site_uuid: d8fa66a4-ac5e-4cfa-976c-7cd088db0a04
hex_code: cmix8s
date_authored_initial_draft: 2026-10-29
date_authored_current_draft: 2026-10-29
lede: >-
  The far end of the study: the agent stops advising and becomes the user's
  executive function, handing over a daily HTML workbench where every item is
  text to copy, a link to click, or a box to check.
summary: >-
  Source-cited profile of the audhd-executive-function submodule (pinned at
  4877e3c, MIT), a five-file Claude Code skill written by a founder with AUDHD
  for founder-style outreach work. Covers the "one rule" (copy-paste, click, or
  check off), the seven actionability rules, the energy-curve section order,
  the banned-word substitution table, the "never present options" decision
  elimination stance, the 48-hour / 7-day / 14-day crack-detection thresholds,
  and the ten-item quality gate. Scores it against the study checklist and
  records the honest gaps: no YAML frontmatter (so it is not model-invocable
  from a description), no state store of its own, no hooks, and a research
  file that names Barkley, Mahan, and Dodson but carries no citations. Read it
  when deciding how far an EF skill should go toward doing the work for the
  user, or when you need a concrete shame-free vocabulary list.
publish: true
from: "studies/adhd-and-executive-function-skills"
from_path: "context-v/profiles/Profile__AuDHD-Executive-Function.md"
---
# AuDHD Executive Function — Profile

A profile of `assafkip/audhd-executive-function` as pinned in this study (`studies/adhd-and-executive-function-skills/audhd-executive-function/`, commit `4877e3c`). All paths below are relative to that submodule. It sits at the opposite pole from [[Profile__I-Have-ADHD]]: that skill reshapes how each answer *reads*; this one replaces the answer with a pre-built workday. Read it alongside state-keepers such as [[Profile__ADHD-Claude-Skill]] and [[Profile__Claude-ADHD-Skills]], which keep memory across sessions, something this skill assumes the user's other tools already do.

## TL;DR

- **The whole skill is one rule.** "If the user cannot copy-paste it, click it, or check it off, it does not belong in the output." (`SKILL.md:13-17`, repeated at `README.md:5`)
- **The agent is the executive function, not a coach.** "The daily HTML is not a briefing. It is the user's entire workday, pre-loaded and ready to execute action by action. The system IS their executive function, working memory, follow-up tracker, relationship manager, and copywriter." (`SKILL.md:9`)
- **The system decides; the user executes.** Who to contact, what to say, in what order, and through which channel are all the agent's calls (`SKILL.md:101-105`). The user only copies, clicks, pastes, and checks (`SKILL.md:107-111`). Offering options is banned outright (`SKILL.md:113-118`).
- **The domain is narrow.** Every example is outreach: DMs, follow-up emails, pipeline, "temperature scores", cooling contacts (`SKILL.md:26-42`, `SKILL.md:155-173`). It is a founder or salesperson's day, not a general EF aid.
- **Five files, no machinery.** `SKILL.md` (219 lines), `README.md` (128), `references/research.md` (100), `references/user-profile.md` (66), `LICENSE`. No hooks, no scripts, no manifests, no evals.
- **No frontmatter.** `SKILL.md:1` opens straight into `# AUDHD Executive Function Skill`; there is no `name:` / `description:` block. Activation depends on a hand-added `CLAUDE.md` rule (`README.md:74-81`), not on model discovery.

## Why this exists — the design bet

The README frames the problem as informational output: "Most AI output is informational: scores, summaries, 'you have 8 hot prospects.' For an AUDHD brain, a number without an attached next step is noise that burns decision energy." (`README.md:30`). Its answer is not to make the information clearer but to remove the step between information and action: "This skill does not ask you to try harder. It removes the need." (`README.md:46`).

The bet rests on Barkley's external-scaffolding idea, stated as "the system IS the executive function" (`references/research.md:60-62`), and on seven deficits the research file names: working memory, task initiation (the Wall of Awful), task-switching cost, decision fatigue, time blindness, object permanence for tasks, and rejection-sensitive dysphoria (`references/research.md:6-32`). Each one maps to a rule:

| Deficit (research.md) | Design response (SKILL.md) |
|---|---|
| Working memory / object permanence (`:8-9`, `:28-29`) | No cross-references, everything inline (`:23-24`); relationship context inline (`:141-151`) |
| Wall of Awful (`:11-17`) | All messages pre-written; Quick Wins first; recent wins before scary tasks (`:122-133`) |
| Decision fatigue (`:22-23`) | System decides; never present options (`:99-118`) |
| Time blindness (`:25-26`) | Every item carries estimated minutes; day total at top (`:63`, `:187`) |
| RSD (`:31-32`) | Banned-word table; effort, not outcome, metrics (`:71-95`, `:201`) |

What makes it AUDHD rather than ADHD-only is a short section on the autism side: "Rigid structures populated with dynamic content. Layout never changes. Information changes daily." (`references/research.md:39`), and "'Flexible rails' - consistent sequence that tolerates skipped steps. Missing one module must not invalidate others." (`references/research.md:44`). That becomes the skill's independence rule: "Every section is independently completable" (`SKILL.md:137`) and quality check 10 (`SKILL.md:219`).

The repo history shows the origin: commit `bf2b844` is "Generalize skill for any user - remove personal info, add profile template", so the skill began as one person's private daily-output contract and was genericized afterward.

## What's inside this submodule

```
audhd-executive-function/            (pinned 4877e3c, 6 commits total)
├── SKILL.md                         219 lines. The whole contract. No frontmatter.
├── README.md                        128 lines. Install guide, FAQ framing, paid-playbook links (:120-128)
├── LICENSE                          MIT, Copyright (c) 2026 Assaf Kipnis
└── references/
    ├── research.md                  100 lines. Deficits, AUDHD-vs-ADHD differences, design principles
    └── user-profile.md              66 lines. Fill-in template: what works, what fails, energy, tools, voice
```

`SKILL.md` is organized as named rule blocks, several marked "(ENFORCED)":

- **THE ONE RULE** (`:13-17`)
- **ACTIONABILITY RULES (ENFORCED)**: A1 No Cross-References through A7 Friction-Ordered (`:21-42`)
- **STRUCTURE RULES**: section order and per-item required fields (`:46-67`)
- **LANGUAGE RULES (ENFORCED)**: banned words with replacements, progress framing (`:71-95`)
- **DECISION ELIMINATION** (`:99-118`)
- **WALL OF AWFUL MITIGATION** (`:122-137`)
- **RELATIONSHIP CONTEXT (INLINE)** (`:141-151`)
- **CRACK DETECTION (AUTOMATIC)** plus Temperature Dashboard Wiring (`:155-173`)
- **VISUAL DESIGN PRINCIPLES** (`:177-187`)
- **ANTI-PATTERNS (NEVER DO)**, ten items (`:191-202`)
- **QUALITY CHECK (ALL MUST PASS)**, ten tests (`:206-219`)

The skill tells the agent to read both reference files first, at project-local paths: `.claude/skills/audhd-executive-function/references/research.md` and `.../user-profile.md` (`SKILL.md:5-7`). Those paths only resolve if the folder is installed per-project, as the README says (`README.md:66-70`); a user-level install under `~/.claude/skills/` would break them.

## How it scores against the study checklist

### Locus of intervention

**Output and task flow, merged into one artifact.** The output is a single HTML page (`SKILL.md:3`, `README.md:19`) whose content *is* the user's task flow: each item is "the literal next physical thing the user does. Not 'Follow up with Sarah' but the actual email text in a copy box" (`SKILL.md:26-27`). Ghost-writing is part of the intervention: messages are "pre-written in user's voice" (`SKILL.md:103`), learned from 2-3 pasted real messages in the profile (`references/user-profile.md:59-66`). It does not keep its own state (see State below).

### Triggering

**User-invoked by request, enforced by a `CLAUDE.md` rule.** No frontmatter means no description for the model to match on (`SKILL.md:1`). The README's install step 2 adds this block to `CLAUDE.md` (`README.md:76-81`):

```markdown
## AUDHD Executive Function Rule (ENFORCED)

Every output the user will act on must follow the `audhd-executive-function` skill.
Read `.claude/skills/audhd-executive-function/SKILL.md` before generating any actionable output.
```

Then the user asks for the daily schedule (`README.md:87-89`). The scope is broad in principle ("governs how ALL daily outputs are structured", `SKILL.md:3`) but everything concrete is about the daily HTML.

### Trigger heuristics (exact numbers)

The thresholds are about the user's relationships and work queue, not about conversation turns:

| Threshold | Effect | Source |
|---|---|---|
| Meetings in the past **48 hours** | Produce follow-up items with full draft text | `SKILL.md:32-33` |
| Awaiting reply **> 7 days** | Auto-generate follow-up draft, after checking sent mail so it never nudges a thread the user already answered | `SKILL.md:159` |
| No interaction **> 14 days** | Flag with re-engagement draft or auto-close | `SKILL.md:160` |
| Contact score trending down with no action above | Recovery draft MUST be generated and linked; "A downtrend without a linked action is a broken dashboard row" | `SKILL.md:171-172` |
| **3+** carried-forward items | Never list together; spread across energy types | `SKILL.md:200` |
| Start with **2-3** Quick Wins | Momentum before harder tasks | `SKILL.md:130`, `references/research.md:91` |
| Friction tiers **2-minute < 5-minute < 10-minute** | Sort order, lowest first | `SKILL.md:41-42` |
| Quick Wins **2-3 min**, Messages **3-5 min** each | Section sizing | `SKILL.md:49-50` |
| Task switching needs **20%** buffer minimum | Research claim; surfaces as "transition buffers" | `references/research.md:20`, `:74` |
| Zero-action section | Omit it entirely | `SKILL.md:198` |

The 20% figure and the "transition rituals" (`references/research.md:96-97`) are not carried into any SKILL.md rule; the energy-mode batching is, as the section order (`SKILL.md:48-54`).

### State

**None of its own.** No files written, no database, no hook. Carried-forward status, contact scores, sent-message history, and meeting logs are all read from wherever the user's agent already has them: "It is not a replacement for your CRM or your calendar. It is the layer on top that turns their data into a workday" (`README.md:60`). The only persistent file is the hand-edited `references/user-profile.md`, which "stays local to your project" (`references/user-profile.md:4`). The anti-pattern list does claim one state duty: "If step 3 requires step 1's output, the system carries it forward. User never holds intermediate state." (`SKILL.md:202`), but where it is carried is left to the host project.

### Grounding

**Named frameworks plus lived experience, no citations.** `references/research.md:3-4` lists "Barkley (scaffolding), Mahan (Wall of Awful), Dodson (interest-based nervous system), PMC, Nature, CHADD, ADDitude, Cleveland Clinic, ADDA, and 30+ additional sources", and `README.md:101-108` repeats it. The file contains no URLs, no reference list, and no paper titles (a grep for `http` in `references/research.md` returns 0). Specific claims such as "Switching requires 20% buffer time minimum" (`:20`) are unsourced. The author's position is explicit: "Built by a founder with AUDHD who got tired of productivity systems designed for neurotypical brains." (`README.md:114`). Treat it as a practitioner's synthesis, not evidence; compare [[Profile__ADHD-Study-Coach]], which rates the strength of each source.

### Tone rules / anti-nag

This is the most concrete anti-shame vocabulary in the study. A banned-word table with replacements (`SKILL.md:73-84`):

| Never | Use instead |
|---|---|
| overdue | carried forward |
| missed | ready when you are |
| failed | didn't land |
| forgot | not yet done |
| behind | in progress |
| you need to | you could |
| nobody responded | awaiting reply |
| ghosted | no reply yet |
| "urgent" as pressure | calm fact: "Meeting with Alex is at 11:30am" |
| dropped the ball, you should have | (never) |

Supporting rules:

- **Effort, not outcome.** "You sent 4 messages yesterday" (`SKILL.md:87`); "'0 replies received' triggers RSD. Track effort only." (`SKILL.md:201`)
- **Show what was done.** Completed items stay visible, struck through (`SKILL.md:93-95`).
- **Skip without shame.** A skipped item "moves to 'carried forward' without commentary" (`SKILL.md:136`).
- **Alerts are not alerts.** Crack-detection items appear "as normal checklist items with copy-paste text. Not as alerts. Not as warnings. Just the next action." (`SKILL.md:165`)
- **Visual calm.** "No animations, no flashing, no bright alert colors for shame"; red only as a factual time indicator (`SKILL.md:180-181`).
- **Questions are not tasks.** "'Would you like to...' is not a task. The action is." (`SKILL.md:197`)

The anti-nag mechanism is unusual: instead of interrupting less, the skill never interrupts at all. It speaks only when asked for the day, and everything it has to say is folded into that one page. There is no dismiss button because there is nothing to dismiss.

Note the tension with consent: "Never present options" and "The follow-up is already there" (`SKILL.md:113-118`) mean the agent drafts messages the user did not ask for, in the user's voice. The override is editing: "One comment, ready to copy. User edits if they want to." (`SKILL.md:115`)

### Packaging

Single unversioned `SKILL.md` plus two reference files; no harness manifests, no hooks, no tests, no evals. The version lives only in prose: "Version 1.1 - updated 2026-05-28" (`README.md:15`). The README doubles as a sales page, with question-shaped headings ("How do I stop my AI from giving me dashboards instead of actions?", `README.md:28`) and a footer selling a "$39" playbook, kits, and a booked call (`README.md:120-128`); commit `114480a` is titled "Rewrite README as AIO funnel". The skill text itself is free of upsell.

## Mental model for using it well

1. **Treat SKILL.md as an output contract with a test suite.** The ten-item quality check (`SKILL.md:206-219`) is the spec: copy-paste, link, time, context, zero-decision, no-shame, crack, inline, order, independence. If you port anything, port the checklist; it is what turns the prose into something an agent can self-verify.
2. **The skill needs data it does not fetch.** Crack detection requires sent mail (`SKILL.md:159`), meeting history (`:32-33`), and contact scores (`:167-173`). Without a CRM, inbox, and calendar wired into the agent, the output degrades to the "Read [X] first" fallback (`SKILL.md:66-67`).
3. **Fill in the voice section or the drafts are generic.** `references/user-profile.md:59-66` asks for 2-3 real sent messages; this is what makes "pre-written in user's voice" (`SKILL.md:103`) work.
4. **Keep dashboards wired or drop them.** Every FYI row must link to an action above it (`SKILL.md:167-173`). It is the cleanest statement in the study of "analytics without an action is waste" (`SKILL.md:36`).
5. **Install it per project**, because the reference paths in `SKILL.md:6-7` are project-relative.

## How this compares to the rest of the study

Sibling summaries are from the study `README.md` plus a light skim of each repo's skill files.

| Entry | Locus | Triggering | State | Distinctive move |
|---|---|---|---|---|
| **AuDHD Executive Function** (this) | Output that *is* the task flow (daily HTML) | `CLAUDE.md` rule + user request; no frontmatter | None; reads the host's CRM/inbox data | Agent decides and ghost-writes; user only copies, clicks, checks |
| [[Profile__I-Have-ADHD]] | Output shape of every reply | Always-on via SessionStart hook opt-in | Flag file only | Five-facts ruleset, packaged for ~10 harnesses, with evals |
| [[Profile__ND-Skills]] | Conversation flow, per EF construct | Model-invoked, 24 skills + `nd` router | None | Turn-count and word-overlap thresholds (8+ turns, 3+ repeat errors, <15% overlap) |
| [[Profile__Claude-ADHD-Skills]] | Time awareness + reminders | Hooks on prompt submit | SQLite + Obsidian vault | Nudges that fire only when the user types |
| [[Profile__ADHD-Claude-Skill]] | Session scope | `/adhd` subcommands | `~/.claude/adhd/` JSON + markdown | Outcome before code; park drift per workstream |
| [[Profile__ADHD-Copilot]] | Coaching + profile | Co-triggered skills (en/zh) | Consented user profile | Proposes profile edits, asks before writing |
| [[Profile__DSH-ADHD-Copilot]] | Behavioral coaching | DeepSeek Harness skill | None | "Lower the cost of starting" micro-steps |
| [[Profile__ADHD-Skills]] | Ritual reviews | User-invoked GTD/zettel rituals | org-mode files | Agent asks and critiques; user does the writing |
| [[Profile__ADHD-Study-Coach]] | Learning sessions | Model-invoked | User-carried Progress Card | Rated research strength per rule |

The sharpest contrast is with [[Profile__ADHD-Skills]]: there the agent deliberately leaves the cognitive work to the user; here the agent takes all of it, including the writing. The closest overlap is with `nd-choicereduce` in [[Profile__ND-Skills]], which caps options at 3 where this skill caps them at 1 (`SKILL.md:113-118`, anti-pattern 4 at `:196`).

## How this compares to our own work

**`ai-labs/hope-ai/` (the `personal-strategic-plan` skill).** Both score effort over outcome. The PSP skill: "A week is scored on what the member did, never on what happened as a result" (`hope-ai/context-v/agent-skills/personal-strategic-plan/SKILL.md:82-86`); this skill: "Track effort only" (`SKILL.md:201`). Both protect the user from overload, but differently: PSP flags "more than one or two new habits in Week 1" and helps layer them (`personal-strategic-plan/SKILL.md:93-95`), where this skill spreads 3+ carried items across energy types (`SKILL.md:200`). The postures are opposite on authorship: PSP says "Their words first. Draft from what they tell you. Sharpen, don't replace." and works "one goal at a time" with confirmation (`personal-strategic-plan/SKILL.md:77-81`), while this skill writes everything and asks nothing. Worth borrowing for PSP check-ins: the banned-word table (`SKILL.md:73-84`) and "completed items stay visible" (`SKILL.md:94`), both of which fit its weekly scorecard tone.

**`talk-normal`** (`context-v/agent-skills/talk-normal/skill/SKILL.md`). Both kill the trailing offer: talk-normal bans "hypothetical follow-up offers, no conditional next-step menus ('If you want I can also...')" (`talk-normal/skill/SKILL.md:43`); this skill bans "Would you like me to draft a follow-up?" in favor of the draft already being there (`SKILL.md:117-118`). talk-normal shapes prose length in every reply as an always-on `AGENTS.md` block (`talk-normal/skill/SKILL.md:17-19`); this skill ignores prose style and governs one artifact. They compose: talk-normal for chat, this contract for the daily page.

## When NOT to reach for this

- **Coding or research sessions.** Nothing here handles drift, hyperfocus inside a conversation, or turn-level pacing; see [[Profile__ADHD-Claude-Skill]] or [[Profile__ND-Skills]].
- **When the user should own the words.** Ghost-writing outreach in the user's voice is the point here and the wrong move for reflective, coaching, or learning work ([[Profile__ADHD-Skills]], [[Profile__ADHD-Study-Coach]], hope-ai's PSP).
- **Without connected data.** No CRM, inbox, or calendar means no crack detection and few pre-writable drafts.
- **As an evidence source.** `references/research.md` is unsourced; cite the primary literature, not this file.
- **As a model-invoked skill.** Without frontmatter (`SKILL.md:1`) it will not auto-load from a description; add one or keep the `CLAUDE.md` rule.

## One-line summary

> The agent stops reporting and starts pre-doing: one HTML page where every item is already-written text, a link, a time estimate, and a checkbox, phrased so that nothing reads as a failure (`SKILL.md:13-17`, `:73-84`, `:206-219`).

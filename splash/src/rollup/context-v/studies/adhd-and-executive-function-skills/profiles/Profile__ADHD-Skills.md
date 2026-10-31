---
name: ADHD Skills Profile
slug: adhd-skills
upstream: https://github.com/RobotDisco/adhd-skills
package: Claude Code plugin marketplace (`/plugin marketplace add RobotDisco/adhd-skills`, then `/plugin install gtd@adhd-skills` or `brain@adhd-skills`)
license: CC-BY-SA-4.0
maintainer: Gaelan D'costa (`RobotDisco`), solo personal repo
study: studies/adhd-and-executive-function-skills
profile_path: studies/adhd-and-executive-function-skills/adhd-skills
profile_kind: ritual-review skills over an external org-mode system
date_created: 2026-10-29
site_uuid: 80995a4d-2ac2-40aa-ae75-2d6e684a4711
hex_code: pwfzpn
date_authored_initial_draft: 2026-10-29
date_authored_current_draft: 2026-10-29
lede: >-
  The agent runs the ritual and asks the hard question; the user does the
  writing, and the agent never touches the files.
summary: >-
  Source-cited profile of RobotDisco/adhd-skills for the ADHD and executive
  function study, the entry that occupies the "ritual reviews over an external
  system" corner. Covers the four skills (gtd-triage, gtd-review,
  brain-weekly-review, brain-process-notes), the org-mode and org-roam files they
  read but deliberately do not write, the fixed ritual order and time boxes, the
  named-guardrail phrases used against planning spirals, and the 28 ADRs that
  carry the reasoning. An agent should read this when designing a review or
  check-in skill where the user's own cognitive work is the point, when choosing
  between agent-writes and agent-asks state models, or when comparing how the
  study's entries keep coaching from turning into nagging.
publish: true
from: "studies/adhd-and-executive-function-skills"
from_path: "context-v/profiles/Profile__ADHD-Skills.md"
---
# ADHD Skills — Profile

A profile of `RobotDisco/adhd-skills` as pinned in this study (`studies/adhd-and-executive-function-skills/adhd-skills/`, commit `b86797e` on `trunk`). Every claim cites a path inside the submodule so you can check the source rather than trust the paraphrase. Read it alongside [[Profile__I-Have-ADHD]], [[Profile__ND-Skills]], [[Profile__Claude-ADHD-Skills]], [[Profile__ADHD-Claude-Skill]], [[Profile__AuDHD-Executive-Function]], [[Profile__ADHD-Copilot]], [[Profile__DSH-ADHD-Copilot]], and [[Profile__ADHD-Study-Coach]]. The nine together map where an executive-function skill can put its intervention.

## TL;DR

adhd-skills is **one person's GTD and zettelkasten system, packaged as four Claude Code skills that run review rituals over files the agent reads but does not write**. The README says so up front: "a personal collection ... curated for my own setup ... not a general-purpose toolkit" (`README.md:1-9`). It ships two plugins, `gtd` and `brain`, from one marketplace manifest (`.claude-plugin/marketplace.json:8-19`).

- `gtd-triage` processes `~/Documents/gtd/inbox.org` one item at a time and outputs a grouped action list (`gtd/skills/gtd-triage/SKILL.md:1-11`, `:63-88`).
- `gtd-review` runs an 8-phase health check of `personal.org` (`gtd/skills/gtd-review/SKILL.md:42-193`).
- `brain-weekly-review` puts one random org-roam note through a shape check, then asks five reflection prompts (`brain/skills/brain-weekly-review/SKILL.md:29-103`).
- `brain-process-notes` is a longer session that mines the journal and critiques notes (`brain/skills/brain-process-notes/SKILL.md:55-193`).

What sets it apart in this study is the **write boundary**. Each skill's output is a list for the user to carry out in Emacs: "Don't move files yourself" (`gtd/skills/gtd-triage/SKILL.md:98`), and "You do not create, edit, or delete notes" (`brain/skills/brain-process-notes/SKILL.md:26-37`). The agent supplies the structure and the pushback. The user does the deciding and the typing.

## Why this exists — the design bet

The repo's `CLAUDE.md` sets the agent's scope. Its job is "building and evolving the system, not operating it day-to-day," and the stated goal is "a self-sufficient setup that runs without Claude in the loop" (`CLAUDE.md:12-17`). Skills for rituals are named as "an explicit exception": they earn a place only "if a skill genuinely reduces friction more than a native tooling equivalent would" (`CLAUDE.md:14-17`). The bet has three parts.

1. **The external system holds the state, and the agent runs the ritual.** Org-mode files are the system of record (`gtd/references/system-vocab.md:3-14`). The skills read them and walk the user through a fixed sequence. The full weekly ritual is `gtd-triage` → `gtd-review` → `brain-weekly-review`, run in one session (`CLAUDE.md:210-212`; `adr/0018-weekly-review-ritual.md:16-60`).
2. **The cognitive work has to stay with the user.** The brain skills spell this out: "Both are the user's cognitive work — your job is to respond, not to do" (`brain/skills/brain-weekly-review/SKILL.md:14-16`). "Writing the user's notes for them removes the cognitive exercise this whole system exists to build" (`brain/skills/brain-process-notes/SKILL.md:33-37`). For criteria 5–7 (own words, a claim, a ramification), the rule is "Probe ... never draft them" and "hold the silence" (`brain/skills/brain-process-notes/SKILL.md:170-173`).
3. **Every rule is grounded in a named ADHD mechanism.** `CLAUDE.md` lists ten: time blindness, task-initiation friction, working memory, object permanence, decision fatigue, interest-driven activation, dopamine and completion, hyperfocus, rejection sensitivity, and the personal-time category error (`CLAUDE.md:30-59`). It also requires "be specific about *which* friction it reduces. 'ADHD-friendly' is a claim with implications, not a label to attach" (`CLAUDE.md:68-69`).

The repo also records its reasoning as ADRs: 28 numbered decisions in `adr/` (`adr/0001-note-maturity-lifecycle.md` through `adr/0028-archive-status-overlay.md`). `CLAUDE.md:19-23` requires an ADR for any significant decision. No other entry in the study keeps a decision record like this.

## What's inside this submodule

```
adhd-skills/                                  (b86797e, trunk; 36 commits, 2026-05-30 → 2026-07-13)
├── .claude-plugin/marketplace.json           two plugins: gtd, brain (:8-19)
├── README.md                                 plugins, install, influences table (:83-96)
├── CLAUDE.md                                 coaching posture, 12 design principles, vocab, rituals (283 lines)
├── SOURCES.md                                annotated influences, with read-directly vs. secondhand flags (218 lines)
├── LICENSE                                   CC-BY-SA-4.0
├── adr/0001 … 0028                           decision records (Context / Decision / Alternatives / Consequences)
├── gtd/
│   ├── references/
│   │   ├── system-vocab.md                   file map, Sunsama vs. personal.org routing, section rules
│   │   ├── org-conventions.md                project, habit, and property conventions
│   │   └── rituals.md                        daily ritual timing (8am / 11:45 / 5pm / 9pm)
│   └── skills/
│       ├── gtd-triage/SKILL.md (+ references/decision-rules.md)
│       └── gtd-review/SKILL.md (+ references/review-checklist.md)
└── brain/
    ├── references/note-quality-criteria.md   seven-criteria bar, per-kind table (300 lines)
    └── skills/
        ├── brain-weekly-review/SKILL.md
        └── brain-process-notes/SKILL.md (+ references/extraction-test.md)
```

Layout follows the repo's own authoring rule: SKILL.md bodies hold "the process and behavioral rules," and lookup tables live in `references/*.md`, which the skill reads at the start of each session (`CLAUDE.md:274-283`). Each skill opens with a "Before you start" block that lists the reference files to read (`gtd/skills/gtd-triage/SKILL.md:20-29`; `gtd/skills/gtd-review/SKILL.md:22-38`; `brain/skills/brain-process-notes/SKILL.md:39-53`). `brain-process-notes` explains why: assessing against "a stale or half-remembered version of the bar is a real failure mode here — it has already happened once" (`:51-53`).

Two drift notes, observed and not fixed:

- `CLAUDE.md:5` points at `TODO.md`, which is not in the pinned tree.
- `README.md:33-48` documents only `brain-weekly-review`; `brain-process-notes` ships without a README entry.

ADR 0021 (context layering) is still `Status: Proposed` and has unfilled "**Decide:**" prompts (`adr/0021-context-layering.md:4`, `:52-75`).

## How it scores against the study checklist

### Locus of intervention: the user's task flow, over persistent external state

The skills don't reshape the agent's prose the way [[Profile__I-Have-ADHD]] does. They steer a review session: one item at a time, a fixed order of phases, and an end summary for the user to act on (`gtd/skills/gtd-triage/SKILL.md:44-90`; `gtd/skills/gtd-review/SKILL.md:161-193`). The changes land in org files, made by the user in Emacs (`gtd/skills/gtd-review/SKILL.md:164`). In triage the agent decides and moves on: "State the routing decision and move on — don't ask. The user will correct you if you're wrong" (`gtd/skills/gtd-triage/SKILL.md:52-53`). In the brain skills it does the opposite and holds back answers (`brain/skills/brain-process-notes/SKILL.md:170-173`). So the locus depends on which executive function the ritual protects:

- In triage, the agent takes the decision load.
- In note work, the agent leaves the thinking with the user.

### Triggering: model-invoked from the description, with no hooks

All four skills auto-trigger from the frontmatter `description` (`README.md:22-23`, `:30-31`, `:47-48`; e.g. `gtd/skills/gtd-triage/SKILL.md:3-10`). The repo ships no hooks and no always-on layer. ADR 0021 explains the limit: "a plugin cannot inject always-on context ... nothing that loads into every session's system prompt automatically" (`adr/0021-context-layering.md:37-42`). For that reason the author puts the "don't edit my notes" guardrail at repo or user level and keeps it out of a skill, "where it would only apply on-demand" (`adr/0021-context-layering.md:68-71`). Skills chain only through prose hand-offs. `gtd-review` checks the inbox first and points to `gtd-triage` (`gtd/skills/gtd-review/SKILL.md:36-38`). It ends with "Don't stop here," continuing into `brain-weekly-review` (`gtd/skills/gtd-review/SKILL.md:195-198`).

### Trigger heuristics: exact numbers

| Threshold | Value | Source |
|---|---|---|
| Triage time box | 15 minutes; "surface it if the session runs long" | `gtd/skills/gtd-triage/SKILL.md:57-59` |
| Two-minute rule | under ~5 min → do it now, don't schedule; triage/processing only, never mid-focus-block | `gtd/skills/gtd-triage/SKILL.md:103`; `CLAUDE.md:156-158` |
| Effort sizes | `0:15` · `0:30` · `1:00` · `2:00`, spaced ~2× because "human time perception is logarithmic" | `CLAUDE.md:160-167`; `gtd/skills/gtd-triage/references/decision-rules.md:41` |
| Effort ceiling | over `2:00` → flag as a project / decompose | `gtd/skills/gtd-triage/references/decision-rules.md:44`; `CLAUDE.md:167` |
| Review time box | 30 minutes; "Name it if the session runs long" | `gtd/skills/gtd-review/SKILL.md:20` |
| Healthy-review expectation | 20–30 minutes; longer means the Active board is too large | `adr/0018-weekly-review-ritual.md:79-80` |
| Deadline horizon | every `DEADLINE:` in the next 14 days must have a scheduled NEXT with lead time | `gtd/skills/gtd-review/SKILL.md:42-49` |
| Broken habit | `LAST_REPEAT` more than two cycles past | `gtd/skills/gtd-review/SKILL.md:57-59`; `gtd/skills/gtd-review/references/review-checklist.md:52-53` |
| Stale WAITING | older than one week → follow up | `gtd/skills/gtd-review/SKILL.md:83-84`; `review-checklist.md:73` |
| Someday promotion test | "a scheduled slot and the motivation to start this in the next two weeks" | `gtd/skills/gtd-review/SKILL.md:125-128` |
| Brain weekly review | 15–20 minutes total; random-note encounter 3–5 min; "One exchange only" | `brain/skills/brain-weekly-review/SKILL.md:18`, `:29`, `:54` |
| Reflection prompts | five, delivered one at a time | `brain/skills/brain-weekly-review/SKILL.md:81-89` |
| Note-critique bound | "well past 5–6 notes" → offer to bank it | `brain/skills/brain-process-notes/SKILL.md:176-180` |
| Note quality bar | seven criteria (atomic, self-retrieving title, ≥1 link, lifecycle tag, own words, a claim, a ramification) | `brain/references/note-quality-criteria.md:26-49` |
| Overcommitment | count `:project:` items in Active; "if the count is high, name it" (no number given) | `gtd/skills/gtd-review/SKILL.md:92-93` |

The overcommitment check is the one qualitative threshold. Every other rule has a number.

### State: an external org-mode / org-roam system the agent only reads

State lives in plain files the user already maintains:

- `inbox.org`, `personal.org`, and `gtd.org`, plus generated `jira/*.org` and `gcal/*.org` that are marked "**Read-only — do not hand-edit**" (`gtd/references/system-vocab.md:5-12`).
- The org-roam tree at `~/Documents/brain`, including daily journal files at `notes/journal/YYYY/MM/YYYY-MM-DD.org` (`brain/skills/brain-process-notes/SKILL.md:68-70`).

Sync and backup come from Seafile file history, which is why inbox DONE items are "deleted, not archived" (`gtd/skills/gtd-triage/SKILL.md:40`). The agent keeps no state of its own: no `~/.claude/` files and no database. Backlinks are approximated by grepping for a note's `:ID:` string, because the skill has no access to the org-roam database (`brain/skills/brain-process-notes/SKILL.md:148-150`; `brain/references/note-quality-criteria.md:275`).

The journal works as a "one-way feed." Value is extracted from it into the permanent graph, and new nodes are never created inside journal files (`adr/0023-journal-one-way-fleeting-feed.md:20-30`; `brain/skills/brain-process-notes/SKILL.md:111-116`).

### Grounding: named sources, with honesty about how they were absorbed

`README.md:83-96` lists 12 influences: Barkley, Dr. K, How to ADHD, Midwest Magic Cleaning, Jesse J. Anderson, David Allen, Developer Tea, Conn & McLean, Ahrens, Adler & Van Doren, Matuschak, and Luhmann. `SOURCES.md` annotates each one and states how well it was absorbed. "Where it's been absorbed secondhand ... that's noted too — secondhand understanding is useful but should be held with less confidence" (`SOURCES.md:7-9`). Barkley, the most-cited voice, is "Not read directly — absorbed via Claude summaries and secondary sources" (`SOURCES.md:17-18`). Dr. K's module, by contrast, was "Worked through directly" (`SOURCES.md:45`).

No other entry flags its own grounding confidence this way. Notice the ingredients: lived experience, practitioner methods, and clinical models. There are no peer-reviewed citations or strength ratings like [[Profile__ADHD-Study-Coach]]'s.

### Tone rules / anti-nag

The anti-nag strategy is **naming instead of blocking**. Each guardrail is a short phrase the agent says, followed by moving on:

- Triage: *"That's decomposition — let's note it and move on."* (`gtd/skills/gtd-triage/SKILL.md:57-58`)
- Review: *"That's planning — let's note it and stay in review mode."* (`gtd/skills/gtd-review/SKILL.md:116-117`)
- Someday, "the highest-risk phase for planning spirals": *"Someday review is a yes/no pass."* (`gtd/skills/gtd-review/SKILL.md:131-133`)
- Bigger work: *"worth capturing as a task?"* (`brain/skills/brain-weekly-review/SKILL.md:57`). The process-notes version makes the choice explicit and says "Either is fine" (`brain/skills/brain-process-notes/SKILL.md:189-193`).

Shame-free framing is a written rule:

- "Frame failures of the system as system bugs, not user failures" (`CLAUDE.md:49-51`).
- "If something isn't getting used, the system is wrong — don't ask the user to try harder" (`CLAUDE.md:63-64`).
- A lapsed habit is flagged "for anchor review, not guilt" (`gtd/skills/gtd-review/SKILL.md:57-59`), with the fix being "replace the anchor, not restart with willpower" (`review-checklist.md:52-53`).
- Active gets trimmed by "demote without guilt" (`gtd/skills/gtd-review/SKILL.md:148-150`).
- ADR 0008 measures personal time on separate success terms, because work metrics applied to rest "generates unavoidable shame" (`adr/0008-personal-time-success-metric.md:8-14`).

It also refuses to pad:

- "Do not manufacture a thread" (`brain/skills/brain-weekly-review/SKILL.md:99-103`).
- "don't manufacture a finding to seem useful" (`brain/skills/brain-process-notes/SKILL.md:97`).
- A skipped prompt moves on "without pressing" (`brain/skills/brain-weekly-review/SKILL.md:107`).
- After reflection, "No summary needed — the user has just done the reflection themselves" (`brain/skills/brain-weekly-review/SKILL.md:115-116`).

One guardrail points at the system itself: watch for "the system-as-procrastination-object trap ... If the user is in a tweak-spiral, name it" (`CLAUDE.md:70-71`; `brain/skills/brain-process-notes/SKILL.md:199-203`).

### Packaging

- One Claude Code marketplace manifest with two plugins (`.claude-plugin/marketplace.json:1-20`), installed per plugin (`README.md:54-66`).
- Claude Code only: no other harness manifests, no evals, no tests.
- New skills are authored with `/skill-creator` (`CLAUDE.md:259-265`). Skill names take a domain prefix (`gtd-*`, `brain-*`) to avoid collisions like "inbox" meaning email (`CLAUDE.md:267-272`).
- The skills hard-code the author's paths (`~/Documents/gtd/`, `~/Documents/brain`) and keybindings (`C-c n r`, `brain/skills/brain-weekly-review/SKILL.md:33`).
- They also hard-code the author's tools: Sunsama, org-timeblock, and Seafile (`gtd/references/system-vocab.md:20-25`; `gtd/references/rituals.md:31`).

## Mental model for using it well

- **Read it as a pattern library.** It isn't an installable tool for anyone but its author. The reusable parts are the shapes: the "Before you start" read list, the fixed phases, the time box with "name it if it runs long," the guardrail phrases, and the grouped summary with empty buckets left out (`gtd/skills/gtd-triage/SKILL.md:90`; `gtd/skills/gtd-review/SKILL.md:193`).
- **Decide per ritual whether the agent decides or asks.** Triage removes decisions ("Make the call. Don't ask.", `gtd/skills/gtd-triage/SKILL.md:97`). Reflection and note work protect the user's thinking ("the first move is theirs", `brain/skills/brain-process-notes/SKILL.md:173`). Both are in the same repo on purpose.
- **Prefer "explicit decision" states to rescheduling.** ADR 0012 rejects default rescheduling as "avoidance" and requires Re-activate / PAUSED / ABANDONED; "Drift is not a state" (`adr/0012-stuck-project-intervention-policy.md:19-40`). This is a reusable rule for any check-in skill.
- **Pre-decide while energy is good; execute without deliberating.** Design principle 10 (`CLAUDE.md:108-112`) and the decision-timing hierarchy (5pm decide, 9pm capture only, 8am confirm; `gtd/references/rituals.md:72-79`) are the most portable ideas here.
- **Put always-on guardrails outside the skill.** Plugin skills load on demand, so a "never write files" rule inside a skill only applies after the skill triggers (`adr/0021-context-layering.md:37-42`, `:68-71`).

## How this compares to the rest of the study

Sibling cells are taken from the study README's blurbs (`../README.md:23-33`, `:56-145`), not from a full read of each sibling.

| Entry | Locus | Triggering | State | Agent writes the user's artifacts? |
|---|---|---|---|---|
| [[Profile__I-Have-ADHD]] | agent output shape | always-on via SessionStart hook (opt-in) | none | n/a |
| [[Profile__ND-Skills]] | agent behavior per EF construct | model-invoked on numeric triggers | none | n/a |
| [[Profile__Claude-ADHD-Skills]] | time awareness + nudges | hooks on prompt submit | SQLite + Obsidian vault | yes (journaling) |
| [[Profile__ADHD-Claude-Skill]] | session focus | `/adhd` subcommands | `~/.claude/adhd/` JSON + markdown | yes (parks drift) |
| [[Profile__AuDHD-Executive-Function]] | agent as external EF | daily run | user profile + research refs | yes (HTML workbench) |
| [[Profile__ADHD-Copilot]] | coaching + adaptive profile | co-triggered skills | consented profile | yes, with consent |
| [[Profile__DSH-ADHD-Copilot]] | behavioral coaching | DeepSeek Harness skill | none noted | n/a |
| **[[Profile__ADHD-Skills]]** | **user's review ritual** | **model-invoked from description** | **external org-mode / org-roam, read-only to agent** | **no, by hard rule** |
| [[Profile__ADHD-Study-Coach]] | learning sessions | skill + `universal/` variant | user-carried Progress Card | no (user carries it) |

On sub-inquiry 3 (state models), adhd-skills sits at the "external vault" end with [[Profile__Claude-ADHD-Skills]]. The difference is who writes: claude-adhd-skills journals into Obsidian, and adhd-skills refuses to (`brain/skills/brain-process-notes/SKILL.md:26-31`). On sub-inquiry 4 (anti-nag), it adds a mechanic none of the blurbs mention: a verbatim named phrase, followed by moving on.

## How this compares to our own work

**hope-ai / personal-strategic-plan** (`ai-labs/hope-ai/context-v/agent-skills/personal-strategic-plan/SKILL.md`). The two share a lot:

- Both pace one item at a time. Compare PSP's "One goal at a time ... Ask, draft one section, confirm, move on" (`SKILL.md:77-78`) with triage's per-item pass.
- Both push back on overcommitment. Compare PSP's "Protect them from their own ambition" with its threshold of more than one or two new habits in Week 1 (`SKILL.md:94-95`), and adhd-skills' overcommitment check and "Default to fewer states" (`CLAUDE.md:72-73`).
- Both separate the process measure from the outcome. PSP scores the process weekly and the outcome only at Day 30/60/90 (`SKILL.md:81-86`). adhd-skills' principle 8 says "Outcome measures without upstream triggers are decoration" (`CLAUDE.md:101-104`).

The difference is the write boundary. PSP drafts for the member and tells it to "never make them deal with files" (`SKILL.md:8-11`). adhd-skills refuses to write, because the writing is the exercise. Two ideas are worth borrowing into PSP check-ins:

- ADR 0012's "explicit decision, never default-reschedule" rule for stalled goals.
- The 14-day deadline horizon scan.

**talk-normal** (`context-v/agent-skills/talk-normal/`, rules in `prompt.md`). talk-normal is an always-on output-style installer. It writes its rules into `AGENTS.md` (`~/.claude/skills/talk-normal/SKILL.md`, "What this skill does"), and it shapes every reply: "Lead with the answer," no filler, "Never restate the question" (`talk-normal/prompt.md`). That puts it in the same cell as [[Profile__I-Have-ADHD]]. adhd-skills has no output-style rules beyond "Be brief; no padding" and "No summary needed" (`brain/skills/brain-process-notes/SKILL.md:160`; `brain/skills/brain-weekly-review/SKILL.md:115-116`). The two compose without conflict: talk-normal controls how replies read, and adhd-skills controls what the session does.

## When NOT to reach for this

- **You want something installable for a general user.** The paths, Emacs keybindings, Sunsama routing, and Tulip-specific work rules are the author's own (`gtd/references/system-vocab.md:20-25`; `gtd/skills/gtd-triage/references/decision-rules.md:10`). The README disclaims general use (`README.md:7-9`).
- **The user isn't on org-mode, or has no external system yet.** The skills assume `personal.org` sections (`* Routine`, `* Active`, `* Someday`, `* Tickler`) and org properties (`gtd/references/system-vocab.md:8`, `:29-49`).
- **You want the agent to do the work.** If the goal is to take the load off entirely, [[Profile__AuDHD-Executive-Function]] is the right reference. Here the agent is barred from writing (`brain/skills/brain-process-notes/SKILL.md:26-37`).
- **You need always-on behavior or in-session monitoring.** There are no hooks, and the author documents that a plugin can't add an always-on layer (`adr/0021-context-layering.md:37-42`). Look at [[Profile__I-Have-ADHD]] or [[Profile__Claude-ADHD-Skills]].
- **You plan to copy text into our skills.** CC-BY-SA-4.0 is share-alike (`README.md:98-100`), so adapting its prose into a differently licensed Lossless skill carries obligations. Borrow patterns, cite paths, and don't paste.

## One-line summary

> adhd-skills makes the agent a ritual runner with a hard write boundary: it reads your org-mode system, walks you through fixed, time-boxed reviews with named guardrails against planning spirals, and leaves every decision it can't safely make, and every word of your notes, for you to do in Emacs.

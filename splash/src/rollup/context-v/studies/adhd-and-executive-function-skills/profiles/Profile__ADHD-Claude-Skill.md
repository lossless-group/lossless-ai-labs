---
name: ADHD Claude Skill Profile
slug: adhd-claude-skill
upstream: https://github.com/Leonw98/adhd-claude-skill
package: Single SKILL.md copied to ~/.claude/skills/adhd/ by install.sh (curl | bash) or install.ps1 (irm | iex); no registry package
license: MIT
maintainer: Leon Wilkinson (`Leonw98/adhd-claude-skill`)
study: studies/adhd-and-executive-function-skills
profile_path: studies/adhd-and-executive-function-skills/adhd-claude-skill
profile_kind: user-invoked session enforcer with file-based workstream state
date_created: 2026-10-29
site_uuid: b87f88a6-9a57-415c-b4ef-2cdc0985daf5
hex_code: eo4l51
date_authored_initial_draft: 2026-10-29
date_authored_current_draft: 2026-10-29
lede: >-
  Write the outcome down before any code moves, then park every tangent in the
  workstream it actually belongs to.
summary: >-
  Source-cited profile of `Leonw98/adhd-claude-skill` for the ADHD and
  executive-function skills study, occupying the "session enforcer with
  persistent state" corner of the design space. Covers the `/adhd` dispatch
  table, the planning-vs-outcome session split, the three strictness levels
  that decide what happens to off-topic asks, keyword smart-routing of parked
  ideas across workstreams, and the `~/.claude/adhd/` file layout
  (`workstreams.json`, per-workstream `parked.md` and `mission.md`,
  `sessions/current.json`). An agent should read this when the question is how
  to hold one outcome across a session, how to capture drift without losing
  it, or how to lay out cross-session state as plain files with no runtime,
  hook, or database.
publish: true
from: "studies/adhd-and-executive-function-skills"
from_path: "context-v/profiles/Profile__ADHD-Claude-Skill.md"
---
# ADHD Claude Skill — Profile

A profile of `adhd-claude-skill` as it lives in this study (`studies/adhd-and-executive-function-skills/adhd-claude-skill/`, pinned at `28084e8`). Every claim cites a path inside the submodule. Read it alongside [[Profile__I-Have-ADHD]] (output shape), [[Profile__ND-Skills]] (EF taxonomy), [[Profile__Claude-ADHD-Skills]] (hooks and SQLite nudges), [[Profile__AuDHD-Executive-Function]] (agent as the whole external EF system), [[Profile__ADHD-Copilot]] (adaptive profile), [[Profile__DSH-ADHD-Copilot]] (behavioral coaching), [[Profile__ADHD-Skills]] (ritual reviews) and [[Profile__ADHD-Study-Coach]] (learning domain).

## TL;DR

One file does all the work: `skill/SKILL.md` (169 lines), dispatched on `/adhd` and its subcommands (`skill/SKILL.md:1-4`). The skill states three jobs up front (`skill/SKILL.md:8-11`):

1. "Force a written outcome before any code moves."
2. "Catch off-topic drift mid-session and route it to a parked-ideas file (scoped to the right workstream, not the current one if the idea belongs elsewhere)."
3. "Surface parked items at session start so they don't get lost forever."

There is no runtime, hook or script beyond the installers. The README is explicit: "There's no runtime: the agent reads the SKILL.md and follows the flows described inside" (`README.md:117-119`). State is plain files under `~/.claude/adhd/` (`skill/SKILL.md:22-36`). The whole mechanism is the model reading a JSON session file and applying a strictness rule to every subsequent request (`skill/SKILL.md:100-112`).

In one sentence: **a scope guard for vibe-coding sessions that turns "while we're here..." into an append-only parked-ideas entry in the right project's file.**

## Why this exists — the design bet

The README opens with the problem: "Vibe coding goes off-topic. ADHD makes it worse." (`README.md:5`). The three principles (`README.md:96-100`) are the bet:

- **"Write the outcome before the work. A sentence you've typed is harder to drift away from than an intention you've only thought."** The intervention is a commitment device, captured before execution.
- **"Defend it from drift. Off-topic isn't bad — but it shouldn't masquerade as the work. Park it visibly."** Drift is not suppressed; it is relocated into a file.
- **"Route parked ideas to the right workstream, not the current one."** This is the distinctive move in the collection. A tangent about freelance invoicing raised while in project A goes to the `freelance` file, not A's (`README.md:90-91`).

The bet is that the cheapest executive-function prosthetic for a solo coder is **scope control plus a trustworthy capture inbox**. You can let go of a tangent because you know it will come back at the next session start (`skill/SKILL.md:64-67`). It leaves the shape of the agent's output alone, has nothing to say about time blindness or task initiation, and does not coach. It is about holding one outcome.

## What's inside this submodule

```
adhd-claude-skill/                         (2 commits, pinned 28084e8)
├── skill/SKILL.md                         169 lines. The entire skill: dispatch, 7 flows, enforcement, rules
├── data-template/                         Copied to ~/.claude/adhd/ only where files are missing
│   ├── README.md                          69 lines. User-facing guide to the data folder, incl. recovery
│   ├── workstreams.json                   Empty registry: { "workstreams": [] }
│   └── workstreams/_unclassified/parked.md  Fallback bucket header
├── examples/workstreams.example.json      Populated registry: myproject / freelance / personal
├── install.sh                             POSIX installer, 86 lines
├── install.ps1                            Windows installer, 80 lines
├── .github/workflows/lint-skill.yml       CI: frontmatter + installer repo-name checks
├── .gitattributes                         LF for .sh, CRLF for .ps1
├── README.md                              131 lines. Pitch, commands, strictness, smart-routing, roadmap
└── LICENSE                                MIT, Copyright (c) 2026 Leon Wilkinson
```

Points worth reading in the source:

- **Frontmatter carries the dispatch hint.** `name: adhd`, and a description that enumerates every subcommand as a trigger (`skill/SKILL.md:2-3`). The description ends with "Works across projects via a global workstream registry."
- **Dispatch table.** First token of args picks one of twelve rows: empty/`start`, `init`, `park <text>`, `park`, `parked`, `parked --all`, `done`, `workstreams`, `workstreams add <name>`, `workstreams remove <name>`, `mission`, `status` (`skill/SKILL.md:38-55`).
- **Cross-platform path note.** `$HOME/.claude/adhd/` on POSIX, `$env:USERPROFILE\.claude\adhd\` on Windows, but forward slashes inside `workstreams.json` (`skill/SKILL.md:13-20`, `skill/SKILL.md:168`).
- **Upgrade-safe installers.** `install.sh` always overwrites `SKILL.md` ("that's the upgrade payload", `install.sh:51-53`) but copies data-template files only if missing (`install.sh:55-75`). `install.ps1` mirrors it (`install.ps1:14-15`, `install.ps1:47`, `install.ps1:52-63`). Both work from a local clone or by downloading a tarball (`install.sh:19-41`).
- **CI as a guardrail on the one file that matters.** The lint job checks the opening `---`, a closing `---` within the first 30 lines, `name: adhd` and a `description:` field (`.github/workflows/lint-skill.yml:14-30`), and that both installers reference `Leonw98/adhd-claude-skill` (`.github/workflows/lint-skill.yml:32-38`).
- **Demo is a placeholder.** The README embeds `docs/demo.gif` (`README.md:12`) with "Recording coming soon" (`README.md:14`); no `docs/` directory exists at this pin.

## How it scores against the study checklist

### Locus of intervention: the user's task flow, backed by persistent state

The skill leaves the agent's prose alone (unlike [[Profile__I-Have-ADHD]]). It changes **what work the agent agrees to do** during a session. In an active outcome session, "For EVERY subsequent user request in this conversation" the agent classifies the request as on-topic or off-topic and applies strictness (`skill/SKILL.md:102-108`). The only output-shape rule is a visibility marker: prefix the first reply on a new topic with `[outcome: <outcome>]` (`skill/SKILL.md:112`, repeated as a rule at `skill/SKILL.md:167`).

Planning sessions turn the locus around: the agent is told "Do not execute code edits" and to help "draft a spec and a one-line kickoff phrase the user can fire in a future outcome session" (`skill/SKILL.md:69`). This separates exploration from execution.

### Triggering: user-invoked slash command, then conversation-scoped enforcement

- Activation is explicit: "Use when the user types /adhd ... or any /adhd subcommand" (`skill/SKILL.md:3`). No hook, no SessionStart injection, no co-trigger.
- Once a session starts, enforcement is model-held: the rule applies to every request "in this conversation" (`skill/SKILL.md:102`). The only anchor across context loss is the file: "If uncertain about the active outcome (e.g. you've been compacted), re-read `sessions/current.json`" (`skill/SKILL.md:110`).
- Nothing re-arms enforcement in a *new* conversation. A forgotten session leaves a stale `current.json`; the data README's recovery advice is "just delete the file or run `/adhd done`" (`data-template/README.md:66-69`). Start Flow refuses to open a second session while one is active (`skill/SKILL.md:62`).

### Trigger heuristics: almost no numbers; drift detection is model judgment

The collection's other entries use turn counts and overlap thresholds (see [[Profile__ND-Skills]]). This one does not. Off-topic is defined by example, not threshold: "different feature, different bug, different project, tangent question, 'while we're here...'" (`skill/SKILL.md:105`). Smart-routing fires on "a strong keyword match" against a workstream's `keywords` list (`skill/SKILL.md:121`), with "strong" left undefined. The README's roadmap admits this: "Keyword smart-routing only — ambiguous ideas could benefit from LLM classification in a v2" (`README.md:109`).

The concrete numbers that do exist are display caps and size limits:

| Number | Where it applies | Source |
|---|---|---|
| 1+ parked entries (counted as lines starting with `## `) | Triggers the surface/ignore/review prompt at start | `skill/SKILL.md:64` |
| 5 | Newest titles shown on "Surface" | `skill/SKILL.md:65` |
| >10 → show newest 10 | `/adhd parked` truncation, then "<N> more — read the file" | `skill/SKILL.md:136` |
| 3 | Titles per workstream in `parked --all` | `skill/SKILL.md:135` |
| 60 chars | Fallback length of a derived parked-entry title | `skill/SKILL.md:169` |
| 1 sentence | The outcome | `skill/SKILL.md:70` |
| 1-3 sentences | A mission | `skill/SKILL.md:30`, `skill/SKILL.md:156` |
| 1-2 words | A workstream name (lowercase, no spaces) | `skill/SKILL.md:82` |
| 3 levels | Strictness: super-strict / mid / loose; vague "Other" defaults to mid | `skill/SKILL.md:70` |

### State: plain files under `~/.claude/adhd/`

The layout is spelled out (`skill/SKILL.md:24-36`):

- `workstreams.json`: registry of `{ name, paths[], keywords[], mission }` (`skill/SKILL.md:26`). Example with a path-bound project and two concept-only workstreams (`examples/workstreams.example.json:1-22`).
- `workstreams/<name>/parked.md`: append-only, newest at the bottom (`skill/SKILL.md:29`). Entry format is a `## YYYY-MM-DD HH:MM — <title>` heading plus the full text (`skill/SKILL.md:123-129`).
- `workstreams/<name>/mission.md`: optional north-star (`skill/SKILL.md:30`).
- `workstreams/_unclassified/parked.md`: fallback bucket (`skill/SKILL.md:31-32`, `data-template/workstreams/_unclassified/parked.md:1-4`).
- `sessions/current.json`: `{ workstream, mode, outcome, strictness, started }`, existing "only while a session is active" (`skill/SKILL.md:33-35`, `skill/SKILL.md:71-74`). Done Flow deletes it (`skill/SKILL.md:145`).

Workstream resolution is cwd-based: Start Flow matches the current folder against each workstream's `paths` (`skill/SKILL.md:61`). Concept-only workstreams such as `personal` have no paths and are reached only by keyword routing or by picking them (`skill/SKILL.md:84`).

Data-protection rules are strict for a prompt-only skill. `parked.md` is never overwritten and never pruned without confirmation (`skill/SKILL.md:165`); `workstreams remove` needs confirmation and "DO NOT delete `workstreams/<name>/` directory (data preserved)" (`skill/SKILL.md:151`, `skill/SKILL.md:166`). The installer preserves existing data on re-run (`install.sh:55-66`). The cost of append-only shows up in the roadmap: "No dedupe of parked ideas" (`README.md:107`).

### Grounding: lived experience, no citations

No file cites research. The rationale is the three principles (`README.md:96-100`) and the opening "Vibe coding goes off-topic. ADHD makes it worse." (`README.md:5`). This puts it at the opposite end from [[Profile__ADHD-Study-Coach]], which rates the evidence behind each rule.

### Tone rules / anti-nag

There are no shame-free language rules and no "never lecture" clause. The anti-nag mechanics are structural:

- **User-chosen severity.** The user picks strictness per session (`skill/SKILL.md:70`). `loose` does the work and only logs it under `## Drift log YYYY-MM-DD` (`skill/SKILL.md:108`). `mid` asks "Park this, or escalate into the outcome?" (`skill/SKILL.md:107`).
- **Override always exists.** Even in super-strict mode, "do it anyway" proceeds, but the item is also parked with `[executed despite super-strict]` (`skill/SKILL.md:106`). The skill records the override and lets it through.
- **Terse confirmations.** Lock-in is one line (`skill/SKILL.md:75`). After parking: "Don't recap the content" (`skill/SKILL.md:130`).
- **Fewer prompts in strict mode.** The park-destination prompt is skipped when smart-route confidence is high and the user is in super-strict mode, "so we don't double-prompt" (`skill/SKILL.md:122`).
- **Ignore is an option.** Parked items at start can be ignored with one choice (`skill/SKILL.md:64-66`).
- **Framing.** "Off-topic isn't bad" (`README.md:99`).

The weak spot is volume: in `mid` mode every off-topic request costs an `AskUserQuestion` round trip (`skill/SKILL.md:107`), and Park Flow itself can ask up to three questions (text, smart-route redirect, destination: `skill/SKILL.md:116-122`).

### Packaging

A single `SKILL.md` for Claude Code only, plus a data template, two installers and one CI lint (see the tree above). There are no evals, tests, other-harness manifests or plugin manifest. Contributing is "Edit `skill/SKILL.md` ... Run `./install.sh` ... Test the change in a fresh Claude Code session" (`README.md:121-124`). Compare [[Profile__I-Have-ADHD]], which ships manifests for about ten harnesses plus evals.

## Mental model for using it well

1. **Run `/adhd init` once per area of your life, not per repo.** Workstreams can span several paths (`examples/workstreams.example.json:5`) or none (`examples/workstreams.example.json:11-12`). The routing value comes from keywords (`skill/SKILL.md:85`), so spend the setup minute on them.
2. **Decide planning vs. outcome honestly.** Planning sessions forbid code edits and produce a kickoff phrase for a later outcome session (`skill/SKILL.md:69`). That kickoff phrase becomes the next outcome.
3. **Pick strictness by how much you trust yourself today.** Super-strict when the outcome is urgent, loose when you want a record of drift rather than friction (`README.md:71-77`).
4. **Watch the `[outcome: ...]` prefix.** It is the only in-flow visibility signal (`skill/SKILL.md:112`). If it stops appearing after compaction, the model is meant to re-read `current.json` (`skill/SKILL.md:110`).
5. **Always close with `/adhd done`.** It reports duration, drift and parked counts, offers a parked item as the next outcome, and deletes the session file (`skill/SKILL.md:140-145`). Skipping it leaves a stale session that blocks the next start (`skill/SKILL.md:62`).
6. **Treat `parked.md` as an inbox you review.** There is no weekly review or dedupe yet (`README.md:107`, `README.md:110`); `parked --all` is the manual substitute (`skill/SKILL.md:135`).

## How this compares to the rest of the study

Sibling characterizations come from the study README (`../README.md:25-33`), not from re-reading each repo.

| Entry | Locus | Triggering | State | Distinctive move |
|---|---|---|---|---|
| [[Profile__ADHD-Claude-Skill]] | Task flow (scope) | `/adhd` command, then conversation-scoped | `~/.claude/adhd/` JSON + markdown | Cross-workstream routing of parked ideas; strictness dial |
| [[Profile__I-Have-ADHD]] | Agent output shape | Always-on / opt-in SessionStart hook | None | Answer-first ruleset across ~10 harnesses with evals |
| [[Profile__ND-Skills]] | Per-EF-construct interventions | Model-invoked from descriptions | Mostly none | Numeric triggers (8+ turns, 3+ repeated errors, <15% word overlap) |
| [[Profile__Claude-ADHD-Skills]] | Time awareness, reminders | Hooks on prompt submit | SQLite + Obsidian vault | Nudges surfaced by hook |
| [[Profile__AuDHD-Executive-Function]] | Whole external EF system | Daily run | Reference + user-profile files | Daily HTML workbench |
| [[Profile__ADHD-Copilot]] | Coaching + monitoring | Co-triggered profile tracker | Consented user profile | Proposes profile updates at session end |
| [[Profile__DSH-ADHD-Copilot]] | Behavioral coaching | Skill invocation (DeepSeek Harness) | None noted | Micro-steps, launch rituals, self-blame recovery |
| [[Profile__ADHD-Skills]] | Ritual reviews | User-invoked rituals | org-mode files | Agent asks and critiques; user writes |
| [[Profile__ADHD-Study-Coach]] | Learning sessions | User-invoked | User-carried Progress Card | Evidence-rated rules |

What this entry contributes that no sibling does: **parking is a routing problem, not just a capture problem.** [[Profile__Claude-ADHD-Skills]] stores reminders and [[Profile__ADHD-Skills]] triages into GTD. Only this skill decides at capture time *which* project an interrupting thought belongs to (`skill/SKILL.md:117-122`). It is also the only entry that puts a user-selected severity dial on the agent's willingness to follow a tangent (`skill/SKILL.md:105-108`).

What it lacks next to siblings: numeric drift detection, any time awareness (it computes session duration only at `done`, `skill/SKILL.md:141`), output-shape rules, and research grounding.

## How this compares to our own work

**`ai-labs/hope-ai/` (Personal Strategic Plan skill).** Both keep a user's commitments in a folder the agent reads and writes, and both resist taking on too much. The PSP skill's equivalent of "one outcome" is "One goal at a time. Don't dump a whole plan on the member" (`hope-ai/context-v/agent-skills/personal-strategic-plan/SKILL.md:77-78`), and it says to warn when "a plan adds more than one or two new habits in Week 1" (`.../SKILL.md:93-95`). The differences:

- Horizon. `/adhd` holds one outcome for one sitting. The PSP holds 100 days, scores process weekly and scores outcomes only at Day 30/60/90 (`.../SKILL.md:81-86`).
- Audience. The PSP user is "usually not technical; never make them deal with files, markdown, or code" (`.../SKILL.md:11`) and has three storage modes (folder, Project, single chat) (`.../SKILL.md:100-103`). `/adhd` assumes Claude Code, a cwd, and `~/.claude/`.
- What hope-ai could borrow: the parked-ideas inbox, as a place for goals or habits a member wants to add mid-program that the "protect them from their own ambition" rule (`.../SKILL.md:93`) would otherwise just push back on. Logged instead of refused, then surfaced at the next weekly session, the way `/adhd` surfaces them at session start (`skill/SKILL.md:64-67`).

**`talk-normal` (anchor root, `context-v/agent-skills/talk-normal/skill/`).** talk-normal is an always-on output-style modifier installed into `AGENTS.md` (`talk-normal/skill/SKILL.md:17-19`) with rules like "Lead with the answer" and "Never restate the question" (`talk-normal/skill/prompt.md:21`, `prompt.md:25`). It sits next to [[Profile__I-Have-ADHD]] in the design space, and `/adhd` sits on the other axis entirely. They compose without conflict: `/adhd` adds the one-line `[outcome: ...]` prefix and short confirmations (`skill/SKILL.md:75`, `skill/SKILL.md:130`), which fit talk-normal's terseness. Running both gives output that is short *and* scoped to one outcome.

## When NOT to reach for this

- **You want the agent to sound different.** It has no output-shape rules beyond the outcome prefix. Use [[Profile__I-Have-ADHD]] or talk-normal.
- **You need enforcement that survives without remembering to type `/adhd`.** There is no hook (`README.md:117-119`). [[Profile__Claude-ADHD-Skills]] shows the hook-driven alternative.
- **You need objective drift detection.** Off-topic is the model's judgment call (`skill/SKILL.md:105`), and keyword routing fires on an undefined "strong keyword match" (`skill/SKILL.md:121`, `README.md:109`).
- **The user is not in Claude Code.** Paths, `AskUserQuestion` and the installers all assume it (`skill/SKILL.md:15-20`, `install.sh:16-17`).
- **Task initiation or time blindness is the problem.** The skill assumes you already know the outcome you want to write down. For "can't start", see [[Profile__DSH-ADHD-Copilot]]; for time, [[Profile__Claude-ADHD-Skills]].
- **Many interruptions in `mid` mode.** Every off-topic request becomes a question (`skill/SKILL.md:107`), which can become its own source of interruption.

## One-line summary

> `adhd-claude-skill` is a prompt-only Claude Code skill that makes you write one outcome before work starts, applies a user-chosen strictness (refuse, ask, or log) to every off-topic request, and appends each tangent to the `parked.md` of the workstream it belongs to, which may not be the one you're in, so it resurfaces at the next session start. All of it is plain files under `~/.claude/adhd/`, with no hook, database or research citations.

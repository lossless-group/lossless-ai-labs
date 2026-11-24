---
title: "Superpowers — Profile"
name: Superpowers Profile
slug: superpowers
upstream: https://github.com/obra/superpowers
maintainer: Jesse Vincent (obra) and Prime Radiant (https://primeradiant.com)
license: MIT
study: studies/open-specs-and-standards
profile_path: studies/open-specs-and-standards/superpowers
profile_kind: methodology
date_created: 2026-05-07
date_modified: 2026-11-23
site_uuid: 9e3c8cc9-d1ce-49df-b80f-f3d138fbd91c
hex_code: v8etlx
date_authored_initial_draft: 2026-05-07
date_authored_current_draft: 2026-11-23
lede: >-
  A SessionStart hook injects the bootstrap skill as `<EXTREMELY_IMPORTANT>`
  before the agent has written its first word.
summary: >-
  Profile of Superpowers as pinned in this study. Framed correctly, it is a software-development
  methodology delivered as a multi-harness plugin, not a skill collection — the study's clearest
  example of behavior-shaping over capability-extending. Covers the 15 skills and their Iron Laws,
  the SessionStart context-injection bootstrap and why the bundle is dead weight without it, the
  subagent-driven-development pattern with its per-task review and its prohibition on parallel
  implementers, the multi-harness substrate (now 15+ harnesses) that works because skills name
  roles rather than tool names, the behavioral tests that check the agent does the right thing, and the
  contributor guide's 94%-rejection anti-slop posture. Ends with an honest fit note against
  Lossless conventions: the techniques are worth lifting; wholesale adoption probably is not.
authors:
  - Michael Staton
status: Reference
publish: true
type: Profiles
from: "studies/open-specs-and-standards"
from_path: "context-v/profiles/Profile__Superpowers.md"
---
# Superpowers — Profile

A profile of Superpowers as it lives in this study (`studies/open-specs-and-standards/superpowers/`). Cites pinned paths so you can jump to source rather than trust paraphrase.

## TL;DR

Superpowers is **not a skill collection — it is a software-development methodology** delivered as a multi-harness plugin. Its central premise is that AI coding agents fail in *predictable, namable ways* — they skip tests, claim done without verification, fix symptoms instead of causes, accept feedback performatively — and the only way to prevent each failure mode is to install a skill that names it, lists its rationalizations, and forbids it.

Concretely, you get:

- **15 carefully-tuned skills** covering the full SDLC (`README.md:340-365`)
- **A SessionStart hook** that injects a bootstrap skill (`using-superpowers`) into context before the agent says its first word (`hooks/session-start`)
- **A "subagent-driven-development" pattern** that dispatches a fresh subagent per task, reviews each task for both spec compliance and code quality, finishes with one whole-branch review, and tells the reviewer to *not trust the implementer's report* (`skills/subagent-driven-development/task-reviewer-prompt.md:64-71`)
- **Cross-harness support** for Claude Code, Codex (App and CLI), Antigravity, Cursor, Devin CLI, Factory Droid, Gemini CLI, GitHub Copilot CLI, Grok Build CLI, Kimi Code, OpenCode, Pi, Qwen Code, Hermes Agent, and Muse — same skill files, platform-specific tool mappings (`README.md:52-306`)
- **A measured, anti-slop stance** documented as 94% PR rejection from AI agents that didn't read the contributor guide (`AGENTS.md:3-20`)

It is **the most aggressive behavior-shaping skill bundle in the public agent-tooling space.** Every skill has an "Iron Law" (all-caps absolute) and most have a "Red Flags" table mapping common rationalizations to the reality the skill exists to enforce.

## Why this exists — the central argument

Jesse Vincent's pitch in the README (`README.md:36-46`):

> "It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it *doesn't* just jump into trying to write code. Instead, it steps back and asks you what you're really trying to do. Once it's teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest. After you've signed off on the design, your agent puts together an implementation plan that's clear enough for an enthusiastic junior engineer with poor taste, no judgement, no project context, and an aversion to testing to follow."

The README pitch is unchanged, but the `writing-plans` skill itself moved away from it in v6.4.2: the plan's reader is now "an engineer who … write[s] idiomatic code in the project's language once they know the exact interface and the exact test" (`skills/writing-plans/SKILL.md:10`), replacing "zero context, questionable taste."

The mental model embedded there is the project's philosophy: **assume the agent has poor taste and will skip steps if it can.** Then build the rails that make skipping impossible.

Read [the original release announcement](https://blog.fsck.com/2025/10/09/superpowers/) for the longer-form argument. The key claim of the project is that *behavior-shaping is more important than capability-extending* in agent tooling — agents are already capable enough; what they need is discipline.

## What's actually inside this submodule

| Path | What's there |
|---|---|
| `superpowers/README.md` | Pitch, install per harness, basic workflow, philosophy |
| `superpowers/AGENTS.md` | Contributor guidelines — the 94%-rejection-rate audit, what they will not accept. Canonical since v6.4.1; `CLAUDE.md` was removed from the repo in v6.4.2 |
| `superpowers/skills/` | 15 skills, each a directory with `SKILL.md` and supporting files (several now split detail into `references/`) |
| `superpowers/hooks/hooks.json` | SessionStart hook config (Claude Code, Copilot CLI; now with a `powershell` form) |
| `superpowers/hooks/hooks-cursor.json` | Cursor-specific hook config |
| `superpowers/hooks/session-start` | Bash script — reads `using-superpowers/SKILL.md` and injects it as `<EXTREMELY_IMPORTANT>` context at session start |
| `superpowers/.<harness>-plugin/` | Per-harness manifests: `.claude-plugin`, `.codex-plugin`, `.cursor-plugin`, `.antigravity-plugin`, `.devin-plugin`, `.hermes-plugin`, `.kimi-plugin`, `.muse-plugin`, plus `.opencode/` and `.pi/` |
| `superpowers/scripts/` | Marketplace sync and packaging (`sync-to-codex-plugin.sh`, `package-codex-plugin.sh`), version bumping, shell lint |
| `superpowers/tests/` | Per-harness and per-skill test directories; `tests/claude-code/` holds **behavioral tests** that run headless Claude Code (`claude -p`) |
| `superpowers/docs/` | Per-harness install guides, `porting-to-a-new-harness.md`, design specs and plans |
| `superpowers/gemini-extension.json` | Gemini CLI extension manifest (points at `GEMINI.md` for context) |
| `superpowers/RELEASE-NOTES.md` | Active changelog — at v7.0.2 as of this pin |

### The 15 skills

From the upstream `README.md:340-365` plus directory listing. Each lives at `skills/<slug>/SKILL.md`:

| Slug | One-line role |
|---|---|
| `using-superpowers` | **Bootstrap.** The skill the SessionStart hook injects at startup. Establishes the "Red Flags" discipline and mandates `Skill` tool invocation before any other response. |
| `brainstorming` | Draws out why you want the thing, sizes the work, then proposes approaches. Hard-gates building on approval of a design doc. Saves design to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`. |
| `writing-plans` | Implementation plan authoring: bite-sized tasks that record decisions (files, signatures, spec values, tests) rather than transcribing code, plus Global Constraints and Review Focus sections. Saves to `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`. |
| `using-git-worktrees` | Isolation discipline — detects existing worktrees (with submodule guard), prefers native harness tools, falls back to `git worktree add` inside the project (`.worktrees/`). |
| `subagent-driven-development` | Fresh subagent per task, one reviewer per task returning spec and quality verdicts, one whole-branch review at the end. The distinctive pattern. |
| `executing-plans` | Native (inline) execution: the session implements every task itself under the same workspace and ledger rules as SDD, with one final review. Rebuilt in v6.4.1 from a 64-line stub. |
| `test-driven-development` | RED-GREEN-REFACTOR enforcement. Iron Law: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST. |
| `systematic-debugging` | Root-cause-first. Iron Law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST. |
| `verification-before-completion` | Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE. |
| `requesting-code-review` | Dispatches a code-reviewer subagent with precision-crafted context (never session history). |
| `receiving-code-review` | Anti-performative-agreement — forbids "You're absolutely right!" responses; mandates technical evaluation. |
| `dispatching-parallel-agents` | Pattern for delegating 2+ independent tasks with isolated context per agent. |
| `finishing-a-development-branch` | Verify tests → detect environment → present merge/PR/keep menu → cleanup with provenance discipline. "Discard" left the menu in v6.2.0; it happens only on explicit request. |
| `writing-skills` | **Meta.** Applies TDD to skill authoring: pressure-test scenarios are tests, the SKILL.md is production code, agent violations are test failures. |
| `diagnosing-superpowers` | **New in v6.4.1.** Works out what went wrong in a session with evidence, then exports a scrubbed bundle or drafts an issue. |

## The bootstrap mechanic (the most interesting technical detail)

How does Superpowers get a skill to "auto-trigger" without the user invoking it? Through a SessionStart hook that **injects the bootstrap skill's full content into context** at startup.

The hook config (`hooks/hooks.json:1-18`):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
            "powershell": "& \"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
            "shell": "bash",
            "async": false
          }
        ]
      }
    ]
  }
}
```

It fires at session startup, after `/clear`, and after `/compact`. The `powershell` form (v7.0.2) lets Copilot on Windows run it.

The hook script reads the bootstrap skill and emits it as a context injection (`hooks/session-start:24-49`). Since v7.0 it avoids `cat`, `dirname`, and command substitution so that it survives a broken `PATH` and starts no child processes:

```bash
IFS= read -r -d '' using_superpowers_content < "$skill_md" || true

session_context="<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your
'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills,
use the 'Skill' tool:**\n\n${using_superpowers_escaped}\n</EXTREMELY_IMPORTANT>"

# Output context injection as JSON.
# Cursor hooks expect additional_context (snake_case).
# Claude Code hooks expect hookSpecificOutput.additionalContext (nested).
# Copilot CLI (v1.0.11+) and others expect additionalContext (top-level, SDK standard).
```

The body of `using-superpowers/SKILL.md` then contains the discipline that drives auto-loading of *other* skills (`skills/using-superpowers/SKILL.md:10-16`):

> "If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill. IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT. This is not negotiable. You cannot rationalize your way out of this."

The bootstrap itself shrank: v6.1.0 compressed `using-superpowers/SKILL.md` (it is about 3.2 KB at this pin, down from about 5.4 KB) to cut per-session token cost.

Not every harness uses a hook. Codex dropped its SessionStart hook in v6.1.0 because it triggers skills reliably on its own, and Antigravity has no session-start event, so it bootstraps through skill discovery: the `using-superpowers` description says "Use when starting any conversation."

The technique generalizes: **a SessionStart hook is a hammer for installing always-on behavior**, and the strength of the behavior is purely a function of how forcefully the injected text speaks. Superpowers leans hard on this. Most other skill collections (including ours) do not.

## The lifecycle

```mermaid
flowchart LR
    Idea([idea])
    B[brainstorming<br/>→ specs/]
    P[writing-plans<br/>→ plans/]
    W[using-git-worktrees<br/>→ isolation]
    S[subagent-driven-development<br/>→ fresh subagent per task]
    F[finishing-a-development-branch<br/>→ merge/PR/keep/discard]
    Idea --> B --> P --> W --> S --> F
    S -.->|tdd / debug / review<br/>fire inside each task| S
```

The flow is end-to-end: the agent doesn't write code until brainstorming has produced an approved design doc, doesn't execute until you have reviewed the saved plan, and doesn't merge until finishing-a-development-branch has verified the test suite. Since v6.3.0 the ceremony scales: brainstorming sizes the work and does a quick, clear task right away, agrees a small change in chat, and writes a full design document only for a project. Each gate is enforced by the skill itself, not by user vigilance.

### Specs and plans live in known places

- **Specs:** `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- **Plans:** `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`

The naming and path are conventional, but the agent will create them automatically when invoking the relevant skill. User preference can override.

## The Iron Laws

Each skill has an Iron Law — an all-caps absolute that gates the skill's purpose. The four central ones:

| Skill | Iron Law | Citation |
|---|---|---|
| test-driven-development | "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST." | `skills/test-driven-development/SKILL.md` |
| verification-before-completion | "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE." | `skills/verification-before-completion/SKILL.md:14-17` |
| systematic-debugging | "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST." | `skills/systematic-debugging/SKILL.md:14-20` |
| brainstorming | "Nothing gets built until your human partner approves the design doc: the short one for a small change, the full one for a project." (a `<HARD-GATE>` block; it replaced the earlier "Do NOT invoke any implementation skill…" wording and moved from the top of the file to near the end) | `skills/brainstorming/SKILL.md:269-283` |

Each Iron Law is paired with a "Red Flags" table of common rationalizations agents use to avoid the law, mapped to the reality the law enforces. From `skills/test-driven-development/SKILL.md:37-45`:

> "Write code before the test? Delete it. Start over. Don't keep it as 'reference'. Don't 'adapt' it while writing tests. Don't look at it. Delete means delete. Implement fresh from tests. Period."

This is the project's house style. It is *intentional*: behavior-shaping content is dense, repetitive, and adversarially-aware because it is competing with the agent's instinct to find the path of least resistance.

## Subagent-driven-development (the distinctive pattern)

Of all the skills, `subagent-driven-development` (SDD) is the one most worth understanding for its own sake. It is an agent-orchestration pattern that few other projects implement at this level of detail.

**Setup:** the parent agent has read the plan; each task is a unit of work with file paths, code, and verification steps written explicitly.

**Per-task loop:**

1. **Implementer subagent.** Fresh dispatch (no shared session history). Implements, tests, commits, and self-reviews. Reports one of four statuses: `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, `BLOCKED`.

2. **Task review.** One fresh reviewer subagent per task, using `skills/subagent-driven-development/task-reviewer-prompt.md`. Until v6.0.0 this was two stages with two templates (`spec-reviewer-prompt.md`, then `code-quality-reviewer-prompt.md`); they were merged so the reviewer reads the diff once and returns both a spec-compliance verdict and a quality verdict, plus a "can't verify from the diff" verdict. The skeptical instruction survives (`task-reviewer-prompt.md:64-71`):

   > "## Do Not Trust the Report
   >
   > Treat the implementer's report as unverified claims about the code. It may be incomplete, inaccurate, or optimistic. Verify the claims against the diff. Design rationales in the report are claims too … Judge the code on its merits — a stated rationale never downgrades a finding's severity."

   Reviewers are read-only, and the controller may not tell a reviewer what to ignore or pre-rate severity.

3. **Fix loops.** If the reviewer finds issues, the *same* implementer is resumed to fix them, and a scoped re-review checks the fixes. Loops until approved.

4. **One broad review at the end.** A single whole-branch review on the most capable model, instead of re-reviewing task by task.

Task text and diffs move as files (`scripts/task-brief`, `scripts/review-package` under the skill), and a per-plan workspace at `.superpowers/sdd/<plan-basename>/` holds the progress ledger so a controller that loses context can resume.

**One striking constraint** (`skills/subagent-driven-development/SKILL.md:235`): "Never dispatch multiple implementation subagents in parallel (conflicts)." Implementers are sequential. The rationale is conflicts: parallel implementers stomp on each other's files.

**Continuous execution** (`skills/subagent-driven-development/SKILL.md:17`):

> "Continuous execution: Do not pause to check in with your human partner between tasks. Execute all tasks from the plan without stopping. The only reasons to stop are the four named below, or all tasks complete."

The four are an irreversible or destructive operation, a security-sensitive action, an outside side effect such as a merge or push, and a plan too broken to proceed. Everything else gets a recorded "Ruling" in the ledger and work continues (added in v6.3.0 after a session sat blocked for almost nine hours).

That captures the SDD bet: *the human partner did the work upfront in brainstorming and writing-plans*; if those gates were honored, the agent should be able to run uninterrupted for the duration of the plan. Jesse claims (`README.md:42`) "It's not uncommon for your agent to work autonomously for a couple hours at a time without deviating from the plan you put together."

## Multi-harness substrate

Superpowers ships the *same skill files* to many harnesses. At the previous pin (v5.1.0) the README listed seven; at this pin it has install sections for fifteen (`README.md:52-306`). A selection:

| Harness | Install command | Bootstrap | Tool mapping |
|---|---|---|---|
| Claude Code | `/plugin install superpowers@claude-plugins-official` | `hooks/hooks.json` | `skills/using-superpowers/references/claude-code-tools.md` |
| Codex CLI / App | `/plugins` → search "superpowers" → install | None since v6.1.0; Codex triggers skills itself | `references/codex-tools.md` |
| Antigravity | `agy plugin install https://github.com/obra/superpowers` | Skill discovery (no hook event) | `references/antigravity-tools.md` |
| Gemini CLI | `gemini extensions install …superpowers` | (extension lifecycle) | `references/gemini-tools.md` (removed in v6.1.0, restored in v6.2.0) |
| OpenCode (V1 and 2.0.4+) | `opencode.json` plugin entry | plugin's own injection | `.opencode/INSTALL.md` |
| Pi | Pi package entry | `.pi/` extension | `references/pi-tools.md` |
| Hermes Agent | git clone | native loader, first turn | `references/hermes-tools.md` |
| Muse | `muse plugins install ./` | `.muse-plugin/` SessionStart | `references/muse-tools.md` |
| Cursor | `/add-plugin superpowers` | `hooks/hooks-cursor.json` | (cursor tool names) |
| Devin CLI, Factory Droid, GitHub Copilot CLI, Grok Build CLI, Kimi Code, Qwen Code | per-harness commands in the README | various | (native names) |

**Key insight:** the skills do not contain hardcoded tool names. They reference *roles* (read a file, write a file, dispatch a subagent). Per-harness tool-mapping reference docs translate roles into local tool names. This is how the same skill text works across so many tools. v6.1.0 trimmed those reference files to the notes that still carry weight (subagent dispatch, task tracking, instruction-file paths), and `docs/porting-to-a-new-harness.md` now documents the three pieces a new integration needs.

There's a synchronization script at `scripts/sync-to-codex-plugin.sh` that mirrors the upstream into OpenAI's plugin marketplace as `prime-radiant-inc/openai-codex-plugins`, and `scripts/package-codex-plugin.sh` builds a deterministic Codex archive.

## The opinionated stance (AGENTS.md)

The project's contributor guide (now `AGENTS.md`; `CLAUDE.md` is gone) opens with a direct address to AI agents (`AGENTS.md:3-9`):

> "If You Are an AI Agent
>
> Stop. Read this section before doing anything.
>
> This repo has a 94% PR rejection rate. Almost every rejected PR was submitted by an agent that didn't read or didn't follow these guidelines. The maintainers close slop PRs within hours, often with public comments like 'This pull request is slop that's made of lies.'
>
> Your job is to protect your human partner from that outcome. Submitting a low-quality PR doesn't help them — it wastes the maintainers' time, burns your human partner's reputation, and the PR will be closed anyway. That is not being helpful. That is being a tool of embarrassment."

Since the previous pin it adds two rules: every contribution discloses model, harness, version, and installed plugins (`AGENTS.md:17`), and every PR carries a human-written summary under 200 words (`AGENTS.md:26`). v7.0.1 added that agent-written PRs fixing someone else's issue are closed unless a maintainer asked for one (`AGENTS.md:52`).

What they explicitly will not accept (`AGENTS.md:36-76`):

- **Third-party dependencies.** "Superpowers is a zero-dependency plugin by design."
- **"Compliance" rewrites of skill content** without eval evidence. They've extensively tuned the language; rewriting it to match Anthropic's published guidance gets rejected.
- **Project-specific or personal configuration.** Belongs in a separate plugin.
- **Bulk or spray-and-pray PRs.** No batch-mode issue-fixing sessions.
- **Speculative fixes.** Must solve a real experienced problem, not a theoretical one.
- **Domain-specific skills.** Core is general-purpose only.
- **Fork-specific changes.** No rebrand or fork-feature merges.
- **Fabricated content.** Invented claims, hallucinated functionality.
- **Bundled unrelated changes.** One problem per PR.

**Acceptance test for new harness support** (`AGENTS.md:78-88`): a real integration must auto-trigger `brainstorming` when the user says "Let's make a react todo list" — proving the SessionStart hook is wired correctly. Manually copying skill files in or wrapping with `npx skills` shims doesn't count.

This document is itself a study artifact. The fact that it had to be written, and had to be this direct, is evidence about the state of agentic open-source contribution.

## Tests as proof of life

The `tests/claude-code/` directory contains **behavioral tests, not unit tests** — they invoke `claude -p` (headless mode) and check whether the skill-loaded agent actually does the right thing.

The most striking example at the previous pin was the code-review test, `tests/claude-code/test-requesting-code-review.sh`, which planted a SQL injection and a plaintext-password bug and asserted the reviewer flagged them at Critical/Important severity and refused to approve. It was deleted on 2026-05-06 (commit `12ef68d`), with the commit message saying a cross-harness, semantically judged "drill" (`code-review-catches-planted-bugs`) replaces it. Since v6.0.2 that eval harness lives in a separate repository rather than a submodule here, so the planted-bug scenario is no longer readable in this pin. What remains in `tests/claude-code/` (SDD integration, worktree policy, executing-plans scripts) still runs `claude -p` and checks behavior.

This is meaningful. It is not asking "does the SKILL.md parse?" It is asking "given this skill is loaded, does the agent under test catch a planted SQL injection?" The skills are evaluated against the behavior they shape, end-to-end. The release notes now routinely report blind-graded eval counts for skill wording changes (for example, brainstorming's filler questions dropping from 41 to 23 in v7.0.2); these are vendor-reported.

## Mental model for using it well

- **Trust the discipline; don't rationalize past it.** Most of the work the skills do is anti-rationalization. If you find yourself saying "this case is different," the Red Flags table almost certainly anticipated that exact rationalization.
- **Each skill is the answer to a specific failure mode.** The skill exists because someone observed an agent failing in that way. Don't read the skill as ceremony; read it as a recovered lesson.
- **"Human partner" is deliberate** (`AGENTS.md:114`). The terminology centers the human as a collaborator in shared decision-making, not a passive consumer of agent output. Agent-tool projects that say "the user" are subtly different.
- **The bootstrap is the wedge.** Once `using-superpowers` is loaded, the rest of the discipline propagates because it forces the agent to invoke the `Skill` tool before anything else. Without the SessionStart hook, the bundle is dead weight.
- **SDD is the differentiator.** If your harness has subagent support, SDD is usually preferred. Since v6.4.1, executing-plans is a real alternative rather than a stub: the plan handoff offers both and recommends one per plan (`skills/executing-plans/SKILL.md:49-60`).

## When NOT to reach for this

- **You already have a workflow you're satisfied with.** Superpowers is not subtle; it changes how the agent behaves at every step. If the changes you want are surgical, write a custom skill or two; don't adopt the whole methodology.
- **You prefer lightweight skill content.** The discipline-density of these skills is intentional but heavy. If your team's preference is lean SKILL.md files (like ours typically are), Superpowers will feel over-instrumented.
- **Your skills are domain-specific.** Superpowers core won't accept domain-specific contributions. You can fork or build alongside, but you can't merge.
- **You don't want SessionStart context injection.** The bootstrap mechanic loads about 3 KB of `<EXTREMELY_IMPORTANT>` text into every session (down from about 5 KB before v6.1.0). If your context budget is already tight, that's a real cost.

## Comparisons

**vs. Anthropic's `ai-skills` reference (also in this study).** Anthropic's skills repo is a *specification reference* — schema, examples, template. Superpowers is a *populated, opinionated bundle.* They aren't competing; they're at different layers of the stack. Anthropic defines what a skill is; Superpowers ships a curated set of them with a methodology wrapped around.

**vs. OpenSpec / Spec Kit (also in this study).** OpenSpec and Spec Kit are *spec-driven workflow frameworks* — they teach the agent to author specs in a structured format and drive implementation off them. Superpowers wraps a similar idea (the `brainstorming` and `writing-plans` skills) but inside a much larger methodology that also includes worktree management, subagent orchestration, code review, debugging, and finishing. Spec-driven dev is one phase of Superpowers; for OpenSpec it's the whole product.

**vs. a hand-curated `.claude/skills/` directory (e.g., ours).** Superpowers is a curated set with strong opinions about what belongs. A hand-curated set like ours can host domain-specific skills and lean SKILL.md content. Different scope, different velocity. You could in principle install Superpowers *alongside* a custom skills directory; they don't conflict.

**vs. nothing.** "Just write a CLAUDE.md and let the agent do its thing" is the baseline. Superpowers' bet is that ad-hoc instructions in a single CLAUDE.md decay quickly under pressure (the agent rationalizes past them) whereas a SessionStart-injected bootstrap with skill-tool gating doesn't.

## Fit with our context (honest note)

A few real tensions between Superpowers' shape and our standing conventions:

1. **They prohibit domain-specific skills upstream; we have several.** `astro-knots`, `lossless-flavored-markdown`, `theme-system` are highly domain-specific to The Lossless Group's work. Superpowers' contributor rules would reject every one of them. This isn't a problem — we'd never PR them upstream — but it does mean our skill bundle has a different shape: fewer, denser, narrower skills there; more, leaner, broader skills here.

2. **Their behavior-shaping content is dense; ours is lean.** A typical Superpowers skill SKILL.md is ~200-400 lines with Iron Laws, Red Flags tables, rationalization-prevention sections, and explicit anti-pattern lists. Our skills are typically 50-200 lines. Theirs is the right choice for adversarial pressure-testing across millions of agent sessions; ours is the right choice for a smaller, trusted team. Worth borrowing the *technique* of an Iron Law and a Red Flags table for skills that warrant it (e.g., `git-conventions` could use this) without adopting the volume.

3. **The SessionStart bootstrap is a serious mechanic we don't currently use.** Our skills load on demand via the harness's auto-discovery (description-matching). Superpowers loads its bootstrap unconditionally at every session start. The trade-off: their approach guarantees baseline discipline; ours preserves context budget. For specific high-stakes workflows we might consider a hook of our own.

4. **The "human partner" terminology is interesting.** We don't currently use it; we say "user" or "you" depending on the skill. Whether to adopt it is a small but real choice — language shapes how the agent thinks about the relationship.

What's worth learning from Superpowers regardless of whether we adopt it:

- **The SessionStart context-injection pattern.** A hammer for installing always-on behavior. Worth keeping in our toolkit.
- **Per-task review with explicit reviewer skepticism.** One reviewer returns both a spec-compliance and a quality verdict (two separate stages before v6.0.0). Tell the reviewer "don't trust the implementer's report." This is sophisticated subagent orchestration that we could lift directly.
- **TDD applied to skill authoring** (`writing-skills`). The pressure-scenario-as-test methodology is principled and we should consider it for high-stakes skills.
- **Behavioral tests** (plant SQL injection → verify reviewer catches it). Most skill repos test that the SKILL.md parses; Superpowers tests that the agent behaves correctly. Bar is higher.
- **Iron Laws as a writing technique.** When a skill has one absolute that must hold, name it in all caps and make it the load-bearing claim of the document.
- **The anti-slop posture.** Their AGENTS.md is pointed and effective. We don't have the same scale problem (low-volume contributions, mostly internal), but if we ever did, this is the template.

This profile is a study, not an adoption recommendation. We are unlikely to install Superpowers wholesale — our skills are too domain-specific to coexist cleanly, and we'd lose more than we gained. But the techniques are worth knowing in detail.

## Changes since the previous pin (2026-05-04 → 2026-11-03)

`f2cbfbefebbf` → `22f0b463e7a5`, 247 commits. Releases in range: v6.0.0–v6.0.3 (June), v6.1.0, v6.1.1, v6.2.0, v6.3.0, v6.4.1, v6.4.2, **v7.0.0** (2026-10-09), v7.0.1, **v7.0.2** (2026-11-03). License unchanged (MIT). The lede of this profile still holds for Claude Code, Cursor, and Copilot.

- **SDD restructured (v6.0.0).** Two reviewer prompts became one `task-reviewer-prompt.md` with two verdicts; a final whole-branch review was added; diffs and briefs move as files via `task-brief` and `review-package`; every dispatch must name a model. v6.2.0 made the workspace plan-scoped and v6.3.0 replaced stalls with recorded rulings.
- **Brainstorming rewritten (v7.0.x).** It asks why first, sizes the work, offers options with a recommendation, uses a "builder check" subagent instead of a spec-document reviewer, and gates building on an approved design doc (`skills/brainstorming/SKILL.md:269-283`).
- **Planning changed (v6.4.x).** Plans record decisions instead of transcribing code, carry Global Constraints, Interfaces, and Review Focus sections, and must be reviewed by you before anything runs. `executing-plans` became a real inline mode.
- **Harness spread.** New: Kimi Code, Pi, Antigravity (v6.0.0), Devin CLI, Hermes Agent, Grok Build (v6.3.0), OpenCode 2, Muse, Qwen Code (v6.4.1). Codex dropped its SessionStart hook; Gemini CLI was removed then restored.
- **New skill**: `diagnosing-superpowers` (v6.4.1). Skill count is now 15.
- **Contributor rules**: `AGENTS.md` replaced `CLAUDE.md`; disclosure of model/harness and a human-written PR summary are required.
- **Tests**: the planted-SQL-injection bash test was removed in favor of an out-of-repo eval drill; the `evals` submodule was dropped in v6.0.2.
- **Worktrees** now live in the project (`.worktrees/`) instead of `~/.config/superpowers/worktrees/`.

## One-line summary

> Superpowers is a complete agent-development methodology delivered as a multi-harness plugin: a SessionStart hook injects a bootstrap skill that mandates `Skill`-tool invocation before any response, fifteen tightly-tuned skills enforce Iron Laws (no production code without failing tests, no completion claims without verification, no fixes without root cause investigation) via Red Flags rationalization tables, and a "subagent-driven-development" pattern dispatches a fresh subagent per task with a per-task reviewer that is explicitly told *not to trust* the implementer's report.

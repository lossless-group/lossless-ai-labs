---
type: Explorations
title: "Context-V as a Portable Plugin Any Agent Can Install"
description: "How the kit installs into any coding agent, with Claude Code first: the design and its decisions log."
lede: "A human pastes one line, and their agent does the rest. The last mile of the cv plugin is an install contract written for agents, with Claude Code as the first harness, not the only one."
summary: "Picks up the plugin work after the kit split. Surveys how Superpowers, OpenSpec, Spec Kit, and GSD reach many harnesses, reviews the new Claude Code mods as the home for gates and a status pane, and proposes six changes to the MVP spec: commands ship as user-invocable skills in `agent-skills/`, the repo root is the plugin, the arc gains `loop` (VP of Engineering) and `reflect` (close-out and release), install climbs three rungs (native plugin, skills-folder drop-in, AGENTS.md floor), an agent-readable INSTALL.md is the entry point, and integrations (tracker, chat, docs, design, deploy, agent memory, context tools) are roles bound to tools in an optional context-v/config.md with names-only .env.example entries. Ends with the ordered build list and its done-conditions."
publish: true
date_created: 2026-10-05
date_modified: 2026-10-05
date_authored_initial_draft: 2026-10-05
date_authored_current_draft: 2026-10-05
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.4.0
status: Open
tags:
  - Exploration
  - Context-Vigilance
  - Claude-Code
  - Plugin
  - Agent-Skills
  - Agent-Harness
  - Distribution
  - AGENTS-md
  - Claude-Code-Mods
  - Integrations
  - Graphify
  - Chroma
  - Archify
site_uuid: 3c68612f-73c8-4cd6-a482-b84ab5b45ebf
hex_code: z6x6z9
from: "context-vigilance-kit"
from_path: "context-v/explorations/Context-V-as-a-Portable-Plugin-Any-Agent-Can-Install.md"
---
# Context-V as a Portable Plugin Any Agent Can Install

## Why care?

The kit now has its own lean repo, so a plugin install no longer drags our corpus along. What's left is the part an adopter actually touches: getting the practice into their agent.

The bar we want is low on purpose. A person should read a few lines, paste one of them into whatever agent they use, and the agent should take it from there: install the skill, scaffold `context-v/`, explain what it did, and stop. If the instructions only work in Claude Code, we've built a Claude Code plugin. We want a practice that happens to install nicely into Claude Code.

## The question

What is the smallest set of files that lets **any** capable coding agent install context-v from a short instruction, gives Claude Code users the native `/plugin install` path, and doesn't make Claude Code's layout load-bearing for the content?

## Why we don't already know

- **The MVP spec settled the Claude Code shape and predates the split.** [[MVP-to-Claude-Code-Plugin]] puts content in `plugin/core/` and projects it into `plugin/harnesses/claude-code/` by symlink. It flags its own gap: nobody has checked whether the plugin loader follows symlinks. The issue [[Plugin-Install-Would-Clone-the-Whole-Corpus]] still lists "amend the MVP spec for the split" as open.
- **Commands don't travel; skills do.** The MVP surface is five slash commands. Slash-command formats differ by harness (Claude's `/cv:init`, Gemini's TOML commands, Codex prompts, Cursor rules). The [Agent Skills](https://agentskills.io/specification) `SKILL.md` format, meanwhile, is now read by Claude Code, Pi, Codex, OpenCode, Cursor, and others. The spec was written before that mattered.
- **"Install" means different things per harness.** Some have plugin marketplaces, some only read a skills folder, and some only read `AGENTS.md`. One instruction has to cover all three.
- **The collaborator thread is unread.** An outside collaborator was exploring this same plugin-ization in his own Claude Code instance as of 2026-07-21. Step 1 of the MVP slice says to converge with his output before building. That hasn't happened yet.

## Where things stand (2026-10-05)

| Piece | State |
|---|---|
| The practice (`context-vigilance` skill, references, templates) | Mature, but lives in the private tree's `lossless-agent-skills`. Six templates; **no `plan.md` template** yet. |
| `pseudomonorepos` skill | Mature, Lossless-specific. Needs the heavy portability pass before it can ship. |
| Kit repo | Public, fresh history, docs only. No `.claude-plugin/`, no skills, no commands, **no `LICENSE`**. |
| MVP spec | Draft. Its directory contract and clone-weight paragraph are stale after the split. |
| Command catalog spec | Draft. Tier-2 (Chroma) catalog; not part of this mile. |
| Status-layer exploration | [[Context-V-as-a-Claude-Code-Plugin]]: `cv status`, hooks as gates. Tier 1+, not this mile. |

Nothing installable exists. "Last mile" is honest about the design, not the code: the design is mostly settled, and the build is about a day of work plus testing.

## Decisions log

Append-only. What was decided, when, and what it changed.

**2026-10-05, second pass (with the operator):**

1. **The destination is this repo,** `lossless-group/context-vigilance-kit` at `ai-labs/context-vigilance-kit`. The org's skills tree (`lossless-agent-skills`) is the source we copy from; it is not the deliverable. Improvements to `context-vigilance` are made in the kit's copy. Pushing them back upstream is a later, separate step.
2. **The skills folder is `agent-skills/`** (change 2).
3. **Graphify, Chroma, and Archify are recommended, not bundled,** via `DEPENDENCIES.md` and offers in `INSTALL.md` (see *Recommended companions*). This reverses the earlier bundling draft. The graphify skill was separately added to `lossless-agent-skills` (commit `d8063c2`) for the org's own use.
4. **Skill-writing rules adopted**, from a summary of Anthropic's updated skills guide (`content-md/lossless/Sources/Transcripts/Anthropic Just Revealed 10 NEW Rules for Claude Skills.md`). Secondhand; specifics to be checked against Anthropic's guide:
   - **One level deep, contents lists.** `SKILL.md` links every reference and template directly. Any file over ~100 lines starts with a short contents list.
   - **Freedom labels.** Steps in a skill are tagged **open** (judgment), **shaped** (a template is the default, departing is fine with a reason), or **exact** (one right answer). `context-vigilance` says which parts of the practice are which, and a clarified loop records the freedom the developer chose per step.
   - **Checklists live in the skills,** not as files copied into adopters' folders. Process checklists, with go-back lines, live in the workflow skills. Document checklists ("done when") live at the end of each template. Repo-specific additions live in the repo's clarified loop doc.
   - **Third-person `description`s**, and nothing the model already knows.
5. **One hook ships in `cv`:** before a Write or Edit to `context-v/**` (excluding `extra/`), check the frontmatter. It enforces only:
   - the YAML parses;
   - `title` is present;
   - `date_created` and `date_modified` are `YYYY-MM-DD`, and modified isn't earlier than created;
   - `site_uuid` is a lowercase UUID v4 (the property is `site_uuid`, not `uuid`);
   - `hex_code` is six characters of `[a-z0-9]`;
   - `site_uuid` and `hex_code` never change on edit.

   New files must have all five fields. On edits to older files, a field is checked only if present. Non-snake_case keys are warned about, not blocked. Nothing else is checked: `status`, versions, and tags take judgment. Bigger gates stay with the later `cv-mod`.
6. **Build now:** `LICENSE` (MIT, as the org skills repo uses), `agent-skills/` (ported `context-vigilance` and `pseudomonorepos`, plus the seven workflow skills), `starters/`, the hook, `.claude-plugin/`, `INSTALL.md`, `DEPENDENCIES.md`, a README install block, and an amendment note on the MVP spec. **Not now:** the synthetic `examples/` project, other harness manifests, `cv status`, `cv-mod`.

**2026-10-05, license (with the operator):**

7. **License: MPL-2.0, not MIT** (this replaces the "MIT" in item 6). It's a file-level copyleft: changes to the kit's own files are shared back, and the kit can sit alongside anything. `LICENSING.md` adds a permission so adoption isn't scary. Copies of templates and starters, and every doc people write with the kit (their `context-v/`, changelogs, handoffs), are theirs under any terms. It also says we expect most organizations to keep their `context-v/` content proprietary, and that sharing is encouraged. The `LICENSE` text is Mozilla's official copy, checked against an independent copy on disk.

## Findings: how others reach many harnesses

The `studies/open-specs-and-standards` collection pins four tools that solved this. Two families emerge.

### Family 1: an installer CLI writes into each harness's folder

- **OpenSpec:** `npm i -g @fission-ai/openspec`, then `openspec init` writes slash commands and skills into `.claude/skills/`, `.cursor/`, and so on. About 25 tools supported.
- **Spec Kit:** `uv tool install specify-cli`, then `specify init . --integration claude|codex|...`. About 30 integrations, one installer module per tool.
- **GSD:** `npx get-shit-done-cc`. A 16-runtime installer that rewrites command syntax per runtime (`/gsd:cmd` vs `/gsd-cmd`).

These are thorough, and each one carries a Node or Python toolchain plus per-harness installer code that someone has to maintain. That cuts against the MVP's tenet: *install is the onboarding, zero infrastructure*.

### Family 2: one content tree, thin manifests, an agent-readable fallback

**Superpowers** (`obra/superpowers`, pinned 2026-05-04) is the closest model, and its shape is worth copying nearly verbatim:

```
superpowers/
├── skills/                      ← the only content. 14 skills, no commands/ dir at all
├── .claude-plugin/plugin.json   ← ~15 lines of metadata
├── .claude-plugin/marketplace.json   ← "source": "./" — the repo root IS the plugin
├── .codex-plugin/plugin.json    ← "skills": "./skills/"
├── .cursor-plugin/plugin.json   ← "skills": "./skills/"
├── gemini-extension.json        ← points at GEMINI.md, which @-includes a SKILL.md
├── .opencode/INSTALL.md         ← for OpenCode, the install IS a document
├── hooks/                       ← one SessionStart script, branches on env vars per harness
└── AGENTS.md -> CLAUDE.md
```

Three things in there answer our question directly:

1. **No projection layer.** Every manifest points at the same `skills/` folder. Adding a harness means adding a small JSON file, which is the extensibility bar the MVP spec set without the symlink machinery it proposed. That machinery would also have failed: Claude Code's plugin loader **rejects symlinks that escape the plugin directory** (docs: *Plugin loading reference*). The MVP adapter at `plugin/harnesses/claude-code/` would be the plugin root, and its links to `../../core/` point outside it.
2. **Skills only, no commands.** Workflows that other tools ship as commands ship here as skills. That's why one tree serves seven harnesses.
3. **The OpenCode install is a sentence:** *"Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md"*. The human pastes a line, and the agent reads a document written for it. That's the pattern the user asked for, already in the wild.

One part we should **not** copy: Superpowers injects its bootstrap skill at every session start, wrapped in `<EXTREMELY_IMPORTANT>`. That's a hook (infrastructure the MVP rules out), and it's the behavior-forcing posture our "norms, not rules" ethos rejects. An `AGENTS.md` pointer does the same job of making the agent aware of the practice, in every harness, with no hook.

### The floor under everything: AGENTS.md

`AGENTS.md` is the widest-adopted agent file there is (23+ agents; Pi reads `AGENTS.md` or `CLAUDE.md`). **Claude Code now reads it too**, through a built-in mod (`cc-plugin-agents-md`, on by default). So one `AGENTS.md` snippet reaches Claude Code and nearly every other harness without a `CLAUDE.md` copy or symlink. An agent with no plugin system and no skills folder will still read it. So the worst-case install is a short paragraph in `AGENTS.md` that points at the practice's docs. That always works.

## Findings: Claude Code mods (launched October 2026)

Claude Code now has **mods** ([overview](https://code.claude.com/docs/en/plugins/mods/overview), [reference](https://code.claude.com/docs/en/plugins/mods/reference)). This is new and outside model training data, so here are the facts read from the docs on 2026-10-05:

- **A mod is a plugin with JavaScript or TypeScript event handlers** that run *inside* Claude Code's process. The files are `hooks/hooks.json` (`"modules": ["./register.js"]`) plus a module exporting `register(on)`. It installs, updates, and is listed exactly like any plugin: `/plugin install name@marketplace`. **A plugin can hold a mod alongside skills and MCP servers.**
- **What a mod can do that a skill can't:** draw panes and a band above the prompt (buttons, inputs, markdown), restyle Claude Code's own interface, intercept and hold or rewrite a tool call (`tool.call`, `tool.check`), add a `/command` that runs code immediately with no Claude turn, read and write files (`$.fs.read`, 4 MiB limit), run processes (`$.process.run`), and keep shared state across hooks.
- **Events that matter to us:** `tool.call` (a Write/Edit is about to land in `context-v/`), `session.start`, `prompt.context`, `skill.prompt` (a skill's text is expanded), `session.compact`, `turn.complete`, and `ui.render` for drawing. Settings-hook events are also exposed as `classic.<Event>`.
- **Trust cost:** a mod runs with the user's full permissions, isn't sandboxed, sees every prompt and tool call, and can approve tool calls. The docs tell users to install only from authors they trust. `claude plugin validate ./dir` lists a mod's `hooks:` and `calls:` before install.
- **Reach:** hooks run in the terminal, Desktop, VS Code, `claude -p`, and the Agent SDK. Panes draw only in the terminal and Desktop. Requires Claude Code v2.1.287+ (some features 2.1.289). Users can switch all mods off with `disableAllHooks` or `--safe-mode`, and **the plugin's skills still load** when they do.
- **Not portable.** A mod is Claude Code's API. No other harness runs it.

### What mods mean for context-v

Mods are the first real home for the parts of the practice the status-layer exploration ([[Context-V-as-a-Claude-Code-Plugin]]) called *gates*, and they answer its "hooks are the layer we have zero of" point. Each candidate, mapped:

| Gate or surface from earlier docs | As a mod | Report-only, per the drift policy? |
|---|---|---|
| Frontmatter validity on write (the `revisions:` YAML trap) | `tool.call` on Write/Edit into `context-v/**`: parse the YAML, and if it breaks, hold the call and show why | Yes. It blocks or warns; it never rewrites the content |
| Status / companion-field coherence (`Shipped` without `date_first_published`) | Same hook, warning only | Yes |
| Loop precondition gate (don't implement against a `Draft` spec) | `skill.prompt` when `implement` expands: read the target's `status`, refuse unless `Signed-Off` | Yes |
| `cv status` (the dashboard we lack; cf. spec-workflow-mcp's) | A `/cv-status` mod command that walks `context-v/` and opens a pane: docs by status, stale Drafts, dangling `spec_reference`. No Claude turn, no tokens | Read-only by construction |
| Kickoff nudge | `session.start` adds one line: "this repo has N context-v docs, 3 In-Review" | Read-only |

That's a real upgrade over settings hooks (shell scripts that can only allow, block, or add context). It's also exactly the part that ties us to Claude Code, and it asks adopters for far more trust than markdown does. Three consequences for the plan:

1. **The mod is a separate, optional plugin in the same marketplace**: `cv` (skills only, harmless markdown) and, later, `cv-mod` (or `cv-gates`). Someone installing the practice should never be asked to trust executable code to get it. This also keeps `cv` identical in every harness.
2. **The mod is the Claude-Code-only enhancement tier, never the practice itself.** Every gate a mod enforces must also exist as prose in the skill, so Pi and Codex users get the norm even without the enforcement. A mod checks what the skill already says; it never introduces a rule the skill doesn't state.
3. **The mod is not this mile.** It depends on the status parser (`cv status`) that the status-layer exploration says to prove as a script first. Build order: skills plugin → status script → mod that wraps it.

Two smaller observations:

- **Mod commands vs. skill commands.** A mod `/command` runs code instantly; a skill `/cv:init` starts a Claude turn. `init` and `new` need judgment (titles, filenames, scaffold choices) and should stay skills. Only pure reads like `status` are worth making mod commands.
- **The `plugin-authoring` skill is built in.** Claude Code ships a skill for writing mods (`cc-plugin-plugin-authoring`), so a future session can ask Claude to draft `cv-mod` against the current API. Don't rely on model memory for it.

## Proposal: six changes to the MVP spec

### 1. Commands become user-invocable skills

Author `init`, `new`, `kickoff`, `prep`, `implement`, `loop`, and `reflect` as skills under `agent-skills/`, not as `commands/*.md`. In Claude Code, a plugin skill is also a slash command (`/cv:init`), takes arguments (`$ARGUMENTS`, `$0`, `$1`), and can be kept from firing on its own with `disable-model-invocation: true` (docs: *Skills*). `commands/` isn't deprecated; we just don't need it. In every other Agent Skills harness the same file works as a skill the user names ("use the cv init skill"). One format, every harness.

Each workflow skill keeps its body short and leans on the main `context-vigilance` skill for the rules, the same way the spec already says `prep` should lean on `developing-a-spec`.

**The folder is `agent-skills/`, not `skills/`.** That's the name of the canonical `context-v/agent-skills/` folder, of our `lossless-agent-skills` repo, and of the Agent Skills spec itself, so an adopter sees one name everywhere. It costs one manifest line. Claude Code's `plugin.json` takes `"skills": "./agent-skills/"`, which *adds to* the default `skills/` scan rather than replacing it (docs: *Plugin manifest reference*), so with no `skills/` folder present there's nothing to shadow. Codex and Cursor manifests take the same `skills` path field (Superpowers sets it). Rung 2 copies the folder's *contents*, so the name never reaches the harness. One thing to watch: an Agent Skills tool that discovers skills in a repo by convention, without a manifest, may only look for `skills/`. If we hit one, a `skills -> agent-skills` symlink *inside* the repo is allowed, since it doesn't leave the plugin directory.

### 2. The repo root is the plugin

Drop `plugin/core/` + `plugin/harnesses/`. The split made the repo lean enough to be the plugin itself:

```
context-vigilance-kit/
├── .claude-plugin/
│   ├── plugin.json              ← name: "cv", skills: "./agent-skills/"
│   └── marketplace.json         ← one entry, "source": "./"
├── agent-skills/                ← plugin.json: "skills": "./agent-skills/"
│   ├── context-vigilance/       ← vendored, portability-passed; carries references/ + templates/
│   ├── pseudomonorepos/         ← vendored, heavy portability pass
│   ├── init/  new/  kickoff/  prep/  implement/  loop/  reflect/   ← the seven workflows, as skills
├── starters/                    ← what init lays down (folder skeleton, context-v/README.md, AGENTS.md snippet)
├── examples/                    ← synthetic, read-only reference
├── INSTALL.md                   ← the agent-facing install contract (see below)
├── DEPENDENCIES.md              ← required: none; recommended: graphify, Chroma, Archify
├── hooks/                       ← one PreToolUse hook: frontmatter check on context-v/**
├── AGENTS.md                    ← for agents working ON the kit
├── LICENSE
├── README.md                    ← human front door; the paste-one-line block lives at the top
├── context-v/  changelog/       ← the kit's own docs (ship inside the plugin; small, harmless)
```

**One thing to verify:** the docs don't show `"source": "./"` (the marketplace root as the plugin itself); their examples point at subdirectories. Superpowers ships exactly that and is listed in the official marketplace, so it works in practice. `claude plugin validate` in step 7 settles it. If it fails, the fallback is a one-line move: put the plugin in `cv/` and point `source` there, with `agent-skills/` inside it. Keep any symlinks inside the plugin folder.

Other harness manifests (`.codex-plugin/`, `gemini-extension.json`, `.cursor-plugin/`) get added **only when someone has installed through them and it worked**. Until then, those harnesses use rung 2 below. This keeps the MVP's "don't build a second adapter speculatively" rule, because an untested manifest is a claim we can't back up.

### 3. Install climbs three rungs, best available first

| Rung | Who | What happens | Gets you |
|---|---|---|---|
| **1. Native plugin** | Claude Code today; others as manifests are proven | `/plugin marketplace add lossless-group/context-vigilance-kit` → `/plugin install cv@context-vigilance-kit`. An agent can do this itself through Bash: `claude plugin marketplace add ...` and `claude plugin install ...` are non-interactive, then `/reload-plugins` | Namespaced `/cv:*`, updates through the harness |
| **2. Skills-folder drop-in** | Any Agent Skills harness without a working plugin path (Pi, Codex, OpenCode, ...) | Clone the kit once, then copy or link `agent-skills/*` into that harness's skills dir (e.g. `~/.agents/skills/` for Pi and others). Claude Code reads only `~/.claude/skills/` and a project's `.claude/skills/`, not `.agents/skills/`, but Claude Code users should be on rung 1 anyway | Same skills, un-namespaced; updates by `git pull` |
| **3. AGENTS.md floor** | Anything that reads `AGENTS.md`, now including Claude Code | Append the starter snippet to the project's `AGENTS.md`, pointing at the kit's `agent-skills/context-vigilance/SKILL.md` by URL | The practice as instructions; no auto-loading |

A fourth, Claude-Code-only tier sits *above* rung 1 and is opt-in: the `cv-mod` plugin (see the mods section). `INSTALL.md` mentions it and never installs it unasked.

The agent picks the highest rung its harness supports. A person never has to know which rung they're on.

### 4. INSTALL.md is the product's front door for agents

The README gets one block for humans:

> **Install with your agent.** Paste this into Claude Code, Codex, Cursor, Pi, or any coding agent:
>
> `Fetch and follow https://raw.githubusercontent.com/lossless-group/context-vigilance-kit/master/INSTALL.md`
>
> Claude Code users can also run `/plugin marketplace add lossless-group/context-vigilance-kit` and then `/plugin install cv@context-vigilance-kit`.

`INSTALL.md` is written to be executed by an agent, not read by a person. Draft contract:

1. **Identify yourself.** Name the harness you're running in. If you can't tell, say so and use rung 2 if you have a skills folder, otherwise rung 3.
2. **Ask once, then act.** Confirm with the user: install user-wide or just for this project, and whether to scaffold `context-v/` afterwards. Don't ask anything else. Specifically, ask nothing about vector databases, hooks, or config.
3. **Install at the highest rung available** (exact commands per rung, per known harness, with paths).
4. **Touch only what's listed.** The skills destination, and (only if the user agreed) the project's `context-v/`, `.gitignore` line, and `AGENTS.md`/`CLAUDE.md` snippet. Never overwrite an existing file; append, or show the diff and ask.
5. **Verify.** Prove the skill is discoverable (Claude Code: `/cv:init` appears; elsewhere: the harness lists the skill, or reading `agent-skills/context-vigilance/SKILL.md` succeeds).
6. **Report and stop.** Say what was installed, where, at which rung, how to update, and how to uninstall. Then offer the first move (`init`, or `new exploration "..."`). Don't start one unasked.

Every step is idempotent: running `INSTALL.md` twice changes nothing the second time. That's also the upgrade path.

**On trust.** "Fetch and follow a URL" asks the user to trust what's at that URL. We make it reasonable to: `INSTALL.md` is short, readable, pinned to `master` (the stable tier), runs no scripts, and writes nowhere it hasn't named. Paste-a-URL should never mean pipe-to-shell.

### 5. The arc gains `loop` and `reflect`

The MVP arc stopped at "implemented." In practice the work continues past that point: someone runs the build at a larger scale than one engineer, and someone closes out the cycle so the next session can start cold. Two more skills cover those, and the arc becomes a cycle:

```
kickoff ──▶ prep ──▶ implement ─┬─▶ reflect ──▶ (handoff) ──▶ next kickoff
                     loop ──────┘
```

| Skill | Role the agent takes | Input | Leaves behind |
|---|---|---|---|
| `kickoff` | none; loads context | the repo's `context-v/`, the last handoff | the right docs in context |
| `prep` | senior product manager | an exploration, spec, or plan | the next rung of the doc, with acceptance criteria |
| `implement` | lead engineer, hands on | one signed-off spec or plan | working code, `status: Implementing` → `Shipped` |
| `loop` | **VP of Engineering**, directing subagents | the same, at larger scope | the same, built by a team under a clarified process |
| `reflect` | **engineering lead closing the cycle** | what just shipped, and the session | as-built docs, issues, changelog, handoff, release, `ship()` commit |

#### `loop`: implement, run as a team under a clarified process

`implement` is one engineer working through a doc in a single context. `loop` keeps the same entry gate (no acceptance criteria → bounce back to `prep`) but changes who does the work. The primary agent becomes the VP of Engineering. It decomposes, staffs, reviews, integrates, and escalates, and it **doesn't write the code itself** apart from trivial glue. Subagents do the building, each one following the `implement` contract on its own slice.

**"Follow the clarified loop," not "follow our loop."** Every developer has their own process, so the skill doesn't impose one. It makes the developer's process explicit and saved:

1. **Find the loop.** Look in `context-v/loops/` for a loop doc that fits this work, then in `AGENTS.md` for stated process. If one fits, use it.
2. **If none fits, propose the default** (below) as a draft and ask a few targeted questions instead of a questionnaire: how deep should review go, what counts as verified here (tests, typecheck, a browser drive, a human walkthrough), one commit per package or per phase, is parallel work allowed, where is the human gate. Questions about *which tools* (ticket system, chat) don't belong in the loop doc. Their answers go into the config (change 6), and the loop names only the role.
3. **Write the clarified loop to `context-v/loops/<Name>.md`** with `status: Draft`, before running it. After one clean run it becomes `Proven-Once`, the lifecycle `augment-it`'s loops already use. The next `loop` call reuses it without asking again.
4. **Run it.** A process problem found mid-run gets written back into the loop doc, not just fixed silently in place.

So the clarification is itself an artifact. It's context-v applied to the developer's own process.

**The default loop: a professional baseline to start from.** It's drawn from two loops already proven in this tree (`augment-it`'s *Implement-Feature Loop* and *Loop through a Spec*) and from Superpowers' subagent-driven development:

- **Setup (once).** Load the target doc and everything it marks load-bearing. Gate on acceptance criteria. Mark it `Implementing`. Break it into work packages, each with a done-condition and a file scope. Mark which packages are independent. Open the changelog entry the beats will go into.
- **Per package:**
  1. **Brief** a fresh implementer subagent with the package's scope, files, done-condition, conventions, and what it must not touch. A fresh context for each package avoids context rot, which is GSD's whole argument.
  2. **Review independently.** A separate reviewer subagent checks the diff in two passes: first whether it meets the spec, then code quality. The reviewer is told *not* to trust the implementer's report.
  3. **Verify by running things**, cheapest check first: typecheck and lint, then tests, then running it and watching logs, then a browser drive for UI. "The code exists" doesn't count as verified.
  4. **Integrate.** One package, one commit, per the repo's convention. Append a changelog beat while the details are fresh. If tickets exist, close the ticket with the commit hash.
- **Rules the VP holds:**
  - The implementer is never its own reviewer.
  - Run packages in parallel only when they touch no shared files, ideally in separate worktrees. Superpowers forbids parallel implementers outright, which is the safe default.
  - Scope creep becomes a new package or goes back to `prep`. It never widens the current package.
  - If the same blocker shows up on two passes in a row, stop and escalate to the human.
- **Exit.** All criteria are met and verification is green. Then comes the human gate: give the operator a short click-path to judge usability. Their findings re-enter the loop as packages. After that, hand off to `reflect`.

**Across harnesses.** Claude Code, Codex, OpenCode, and Cursor can all run subagents. Where a harness can't (Pi, out of the box), `loop` falls back to running in one session with explicit role switches. "Now reviewing as the reviewer" is weaker than a fresh context, so the skill says so instead of pretending otherwise. Claude Code extras like `/loop` pacing, worktree isolation, and agent teams are used when present and never required.

#### `reflect`: close the cycle so the next session starts cold

`reflect` runs after `implement` or `loop`, or on its own at the end of a working session. Its order matters, because everything has to land in the same `ship()` commit:

1. **Discuss before writing.** Start with what the agent observed: what was built versus what was planned, the workarounds, what broke. Then ask the user a few questions: what felt awkward to use, what surprised them, what they'd do differently. Same discuss-then-write rhythm as `developing-a-spec`.
2. **Document what was actually built.** Update the spec or plan with an as-built section covering where reality diverged from the plan, and set `status` honestly: `Shipped`, or `Partially-Shipped` with a `## Remaining work (as of <date>)` section.
3. **File what was found.** Each real problem hit along the way becomes an issue. Where it goes follows the `tracker` setting in the config (see change 6): a `context-v/issues/` doc with its hypothesis log, a ticket, or both linked together. Usability problems go the same way, or to `explorations/` if they're open questions rather than bugs.
4. **Name the next steps.** Put them in the doc's remaining-work section, or as stub explorations or plans. Don't leave them only in chat.
5. **Write the changelog entry**, polishing the beats if `loop` left any.
6. **Write a handoff** in `context-v/handoffs/`: what landed, what's mid-flight, what the next session must know, and which docs to load first. That's what the next `kickoff` reads.
7. **If this is a release:** bump the version wherever the repo keeps it (manifest, package file, tags; find it, don't assume), write release notes from the changelog entries since the last tag, and tag.
8. **Commit and push.** Header: `ship(feature, <capability>): <what someone can now do>`. The body links the changelog entry, the spec or plan, and the handoff. If the repo has its own commit convention, use that instead. Before pushing, say which branch is going to which remote. Never force-push, and confirm before pushing straight to a protected or default branch.

#### Recommended companions, not bundled

Graphify, Chroma, and Archify make context-v noticeably better, and newcomers should be pushed toward them. They are **not** copied into the kit. (An earlier draft of this section bundled them; reversed on 2026-10-05, see *Decisions log*.)

- **They aren't ours and they move on their own schedule.** Graphify's skill must match its Python package's version; Archify is ~8 MB and needs Node 18+. Copies inside the kit go stale, and we'd own refreshing them.
- **Each has its own installer that works across agents.** `graphify install` alone sets itself up in a dozen-plus harnesses. Installing from upstream gets newcomers the current version.
- **The kit stays the practice and nothing else.** It works with none of them.

How "strongly suggest" works instead:

1. **`DEPENDENCIES.md` at the kit root.** *Required:* none. *Recommended:* each companion with one line on what it adds to context-v, a link, and its install command.
2. **`INSTALL.md` offers each one** after the kit is installed, in plain language, and installs only on a yes.
3. **The kit's skills use them when present and never require them.** `kickoff` reads `graphify-out/` if it exists, else scans `context-v/`. `prep` and `reflect` offer an Archify diagram if Archify is installed. Tier-2 retrieval points at the Chroma skills.

| Companion | Upstream | What it adds | Runtime |
|---|---|---|---|
| Graphify | `safishamsi/graphify` | A map of the codebase that `kickoff` reads and `reflect` refreshes | Python (`graphifyy`) |
| Chroma skills | `chroma-core/agent-skills` | Correct Chroma usage once semantic search over `context-v/` is wanted | none until used |
| Archify | `tt-a1i/archify` | Diagrams checked against the repo: spec diagrams in `prep`, as-built vs. planned in `reflect` | Node 18+ |

**Disclosure.** Michael Staton is an investor in Chroma. `DEPENDENCIES.md` says so next to the Chroma entry.

`reflect` needs conventions the MVP didn't bundle: a changelog-entry shape and a commit header. Rather than bundling all of `changelog-conventions` and `git-conventions`, which carry a lot of Lossless specifics, `reflect` gets two short default references (changelog entry, `ship()` header) and defers to whatever the repo already does. That partly answers the MVP spec's open question about bundling `changelog-conventions`.

### 6. Integrations are roles, bound to tools in one config

Loops and `reflect` reach outside the repo all the time: file a ticket, post a ship note, update the docs site, check the design system. Teams differ completely on *where* (GitHub Projects, Plane, Linear, Jira; Slack, Teams, Buzz; Notion, Confluence, Outline). If skills and loop docs named tools, every adopter would have to fork them.

So the skills and loops name **roles**, and one config file maps each role to the team's tool. That's the same split the June Chroma spec already made for collections (`config.collections.*` names roles, and the config resolves them), so the two merge into one file.

**`context-v/config.md`**: YAML frontmatter for agents to parse, and a prose body for everything YAML can't say. Markdown rather than JSON because it's a context-v document like any other: versioned, readable, and allowed to explain itself.

```markdown
---
context_v_config: 1
integrations:
  tracker:                       # where issues and tasks live
    provider: plane              # context-v | github-issues | github-projects | plane | linear | jira
    via: mcp:plane               # mcp:<server> | cli:<tool> | api
    base_url_env: PLANE_BASE_URL
    auth_env: PLANE_API_KEY
    project: LOSSLESS
    issues: both                 # context-v | tracker | both (doc holds the reasoning, ticket links to it)
    confirm: always              # always | first-time | never
  chat:                          # ship notes, blockers, release announcements
    provider: slack              # slack | teams | discord | buzz | none
    via: mcp:slack
    channel: "#ship-log"
    post_on: [ship, release, blocked]
    confirm: always
  docs:      { provider: outline, via: mcp:outline }
  design:    { provider: design-md, source: DESIGN.md }    # or figma, penpot, storybook
  code_host: { provider: github, via: cli:gh }
  deploy:    { provider: railway, via: mcp:railway }
  release:   { version_source: package.json, notes_from: changelog }
  memory:                        # what the agent remembers across sessions
    provider: graphify           # DEFAULT. graphify | harness (Claude Code auto-memory, etc.) | graphiti | mem0 | letta | beads | none
    personal: harness            # per-person preferences stay in the harness's own memory
    write: ask                   # ask | allowed | never: may a loop or reflect write lessons here?
  context:                       # where the agent looks things up
    code_graph: { provider: graphify, via: cli:graphify }   # DEFAULT
    retrieval: { provider: none }                  # tier 2: chroma (local or cloud), with collection roles
    docs_lookup: { provider: context7, via: mcp:context7 }   # current library docs over model memory
---

# Notes for agents

Anything the YAML can't say: "tickets for client work go to the client's Plane
project, not ours", "never post to #general", "the docs site lags master by a release".
```

**Rules that make it safe:**

- **Missing config means context-v defaults.** No file, or no `tracker`, means issues go to `context-v/issues/`, nothing gets posted anywhere, and the release notes stay in `changelog/`. The practice works with zero integrations, which keeps the MVP's zero-infrastructure tenet.
- **Created on demand, never by `init`.** The MVP spec's hard constraint (no config files and no questions in `init`) stays. The first time a loop or `reflect` needs a role that isn't configured, it asks once ("no tracker is set up: keep issues in `context-v/issues/`, or set one up?") and writes the answer to the config.
- **No secrets in the config, ever.** It names environment variables (`auth_env: PLANE_API_KEY`). Their names go into **`.env.example`**: added as a marked `# context-v integrations` block if the repo already has one, created if it doesn't. Values live in `.env`, and the agent checks `.gitignore` covers it before writing anything. When a role goes through an MCP server, auth usually lives in the MCP config instead, and the entry needs no env vars.
- **Anything outward-facing asks first by default.** Posting to chat or creating tickets is publishing. `confirm: always` is the default, and a team can relax it role by role.
- **The context-v doc stays the source of truth.** With `issues: both`, the doc holds the reasoning and hypothesis log, and the ticket holds status and assignment, its body a link to the doc (the convention our `gh-cli-projects-tasks-conventions` skill already uses).
- **Closest config wins in nested repos.** A child repo inherits its parent's config and overrides individual roles, the same precedence rule as `AGENTS.md`.

**Memory and context tools are roles too, with one boundary.** The `memory` and `context` roles say which agent-memory layer and lookup tools a team uses, so `kickoff` knows to query the code graph or retrieval store before a dir-scan, and `reflect` knows whether a lesson can go into memory as well as into a doc. The boundary: **`context-v/` stays the durable, human-readable record.** A memory layer can index or recall from it, and `reflect` can mirror a lesson into memory, but nothing exists *only* in memory. Memory is a private cache; context-v is the shared record. The `memory-layers-for-agents` study (Graphiti, Mem0, Letta, Beads, Honcho, and others) is the catalog for the `provider` values.

**Graphify is the default for `memory` and `context.code_graph` when it's installed.** It's the fastest option we've studied: no LLM and no database in its write path (tree-sitter parsing, Leiden clustering, one `graph.json`), so building a project's graph takes seconds, and every edge says whether it was read from the source or inferred. Two rules keep the default within the zero-infrastructure tenet:

- **Reading is free.** `kickoff` checks for `graphify-out/GRAPH_REPORT.md` and uses it when present, with or without a config. That's just reading a file.
- **Building is offered.** Building the graph needs the `graphifyy` Python package, which the skill installs on first use. So `kickoff` and `reflect` *offer* to build or refresh it, and never do it silently.

Graphiti stays a listed `memory` provider for teams that want a temporal knowledge graph and are willing to run a graph database and pay for an LLM call per episode. It isn't the default.

**Not adapters.** The kit ships no Linear client or Slack client. `via` tells the agent which tool it already has: an MCP server, a CLI, or an API it can call. If the named route isn't available in the session, the agent says so and falls back to the context-v default instead of guessing.

## Options for this mile

### Option A: Claude Code plugin only, exactly as specced

**Pros:** the spec is written; the smallest new decision count.
**Cons:** keeps the unverified symlink projection; commands don't carry to other harnesses; "agents take it from here" only works for one harness.

### Option B: Superpowers shape, Claude manifest + INSTALL.md *(leaning)*

**Pros:** one content tree with no projection; every harness gets something on day one through rungs 2 and 3; the only harness-specific file is a short JSON manifest; matches prior art that already works in seven harnesses.
**Cons:** amends a Draft spec's directory contract and command format; workflow skills are less discoverable outside Claude Code than slash commands would be (the user has to name them, or `AGENTS.md` lists them).

### Option D: lead with a Claude Code mod

**Pros:** the strongest Claude Code experience: a live status pane, gates on writes, instant `/cv-status`.
**Cons:** executable code with full user permissions in front of a markdown practice; Claude-Code-only; needs a status parser that doesn't exist yet. Right as a later, optional `cv-mod` plugin. Wrong as the product.

### Option C: an installer CLI (`npx context-v init`), OpenSpec/GSD style

**Pros:** precise per-harness placement; can rewrite syntax per harness.
**Cons:** puts a Node or Python toolchain in front of the practice; we'd maintain per-harness installer code; contradicts the zero-infrastructure tenet. Revisit only if rung 2 proves too fiddly for agents to do by hand.

## The build, in order

Each step has a done-condition an agent can check.

1. **Read the collaborator's output.** *Done when:* his findings are linked here and any conflict with this proposal is resolved or recorded.
2. **Amend [[MVP-to-Claude-Code-Plugin]]** with the six changes above, and close that item on the issue. *Done when:* the spec's directory contract matches the tree above and the clone-weight paragraph points at the issue.
3. **Add `LICENSE`** (MIT matches Superpowers and is the low-friction choice; the operator decides). *Done when:* the file exists. A public plugin without a license isn't installable in good conscience.
3b. **Write `DEPENDENCIES.md`** listing graphify, Chroma, and Archify as recommended, with links, install commands, and the Chroma disclosure. *Done when:* `INSTALL.md` offers each one from it.
4. **Vendor `context-vigilance`** with the light portability pass, and add the missing `plan.md` template. *Done when:* `grep -rE '/Users/|lossless-monorepo|~/.pi' agent-skills/` returns nothing.
5. **Vendor `pseudomonorepos`** with the heavy pass: concepts kept, our tree, incident dates, and branch tiers dropped. *Done when:* same grep is clean, and a reader who has never seen our tree can follow it.
6. **Write the seven workflow skills** and `starters/`, plus the default loop template `loop` proposes. *Done when:* each has `name`, a trigger-quality `description`, and a body under ~150 lines that defers to `context-vigilance`.
6b. **Write the config reference**: a `config.md` template in `starters/` (commented, every role set to the context-v default), the role vocabulary, and the `.env.example` block convention. *Done when:* `loop` and `reflect` name only roles, and a repo with no config runs both end to end.
7. **Write `.claude-plugin/plugin.json` and `marketplace.json`**, then run `claude plugin validate`. *Done when:* validation passes.
8. **Write `INSTALL.md` and the README block.** *Done when:* both exist, and `INSTALL.md` names every path it may write.
9. **Cold-install tests**, each in a throwaway repo on a machine or account without the private tree:
   - Claude Code, rung 1: `/plugin install`, `/cv:init`, `/cv:new exploration "Test"`, then a small `/cv:loop` run on a two-package plan and `/cv:reflect` to close it (changelog, handoff, `ship()` commit on a throwaway remote).
   - Pi or Codex, rung 2: paste the one line, then ask for an exploration.
   - Any agent, rung 3: paste the one line with skills unavailable, and confirm the `AGENTS.md` snippet alone produces a conforming doc.
   *Done when:* all three produce a doc that passes the frontmatter spec with no help from us. This is the MVP spec's own Outcome condition, widened from one harness to three.
10. **Tag `v0.1.0`** on `master` and write the changelog entry. Community and official marketplace listings stay gated behind step 9, as the spec already says.

**After this mile:** the `cv status` script (from the status-layer exploration), then `cv-mod` wrapping it: the status pane, the write-time frontmatter check, and the `implement` precondition gate. Each is report-only and backed by prose that already exists in the skill.

## Open questions

- **Name collision when we dogfood.** Our machines already link `context-vigilance` from `lossless-agent-skills`. Installing the plugin adds `cv:context-vigilance` beside it. Which one wins for us, and do we drop the symlinked copy once the plugin is the source?
- **Which way does vendoring sync?** The spec says the kit vendors from `lossless-agent-skills`. After the portability pass the two copies diverge on purpose. Is the kit copy downstream forever (re-pass on every upstream change), or does the generic version become upstream and ours become the Lossless overlay?
- **Should the workflow skills auto-trigger?** `init` and `implement` change files, and they should probably run only when asked (Claude Code: `disable-model-invocation: true`). `kickoff` and `prep` might reasonably fire on intent. Decide per skill.
- **Bare names collide outside Claude Code.** In Claude Code the skills are namespaced (`/cv:loop` sits beside the built-in `/loop` without clashing). Dropped into a shared `~/.agents/skills/` at rung 2, though, `new`, `init`, and `loop` are bare names that will collide with someone else's skills. Options: name the folders `cv-init` and so on, and accept `/cv:cv-init` in Claude Code; or have `INSTALL.md` rename them at rung 2. The second breaks the spec's rule that `name` matches the folder unless `INSTALL.md` edits both. Undecided.
- **What should the default loop be?** The draft above is a starting point for discussion, not a decision: review depth, whether tickets are part of the default, and whether the human gate is mandatory or offered.
- **Is "engineering lead closing the cycle" the right role for `reflect`?** Alternatives: release manager (if releases dominate), or the PM again (if the retro and next steps dominate).
- **Should `ship()` be proposed upstream?** The verb is proven in two `augment-it` loops, which say to propose it to `git-conventions` once it proves out. It isn't in that skill's verb table yet. `reflect` would make it a public convention, so it's worth upstreaming first.
- **Config: `context-v/config.md` or a hidden `.context-v/config.md`?** Inside `context-v/` it's visible and versioned with the practice, but tree-wide collators (like our corpus) would ingest it as a document. Harmless, since it holds no secrets, but noisy. A hidden folder avoids that and is harder for humans to find.
- **Per-person overrides.** The tracker project is per repo, but who gets pinged, and one person's preferred chat channel, are per person. Is a gitignored `config.local.md` worth it, or is env enough?
- **How big is the role vocabulary?** `tracker`, `chat`, `docs`, `design`, `code_host`, `deploy`, `release`, `memory`, and `context` (retrieval, code graph, docs lookup) cover our loops. Calendar, CI, analytics, and CRM are candidates. Start small and let the config's prose body hold anything unlisted.
- **Pin `INSTALL.md` to a tag or to `master`?** A tag makes installs reproducible. `master` makes the one-liner evergreen. The branch-tier model suggests `master`, since it is the stable tier.
- **Does `changelog/` belong in the starter?** Decided as an *offer* in D4 of the issue; it still needs a home in `starters/` and a line in `INSTALL.md`'s single question.

## Tentative direction

Option B. Amend the spec, ship skills only (in `agent-skills/`), extend the arc with `loop` and `reflect`, make the repo root the plugin, ship one manifest (Claude Code) plus `INSTALL.md`, and let rungs 2 and 3 carry every other harness until someone proves a native manifest for it. Treat Claude Code mods as the home for gates and the status pane, shipped later as a separate opt-in `cv-mod` plugin in the same marketplace.

## Outcome

(Open. Close when step 2 lands the amendment, or when step 9's three cold installs pass, whichever this exploration is still useful for.)

## Related

- [[MVP-to-Claude-Code-Plugin]]: the spec this proposes to amend
- [[Plugin-Install-Would-Clone-the-Whole-Corpus]]: why the repo root can now be the plugin
- [[Context-V-as-a-Claude-Code-Plugin]]: the status layer and hooks; the mile after this one
- [[Commands-and-Agent-Skills-for-Context-V]]: the full catalog, tier 2
- `ai-labs/studies/open-specs-and-standards/`: profiles of Superpowers, OpenSpec, Spec Kit, GSD, and AGENTS.md; the Superpowers submodule holds the manifests quoted above
- [Claude Code mods overview](https://code.claude.com/docs/en/plugins/mods/overview) and [reference](https://code.claude.com/docs/en/plugins/mods/reference), read 2026-10-05; sample mods in `anthropics/claude-code-playground`, built-in mod source in `anthropics/claude-code/mods` (`agents-md` is a small, readable example)
- `ai-labs/augment-it/context-v/loops/Implement-Feature-Loop.md` and `Loop-through-Spec-Write-Plans-Implement-Test-Changelog-Commit.md`: both `Proven-Once`; the source of the default loop and of the `ship(feature, …)` bookend
- [[Commands-and-Agent-Skills-for-Context-V]] and `Systematizing-Chroma-as-Loading-Mechanism-for-Context-v` (now in `context-v-corpus`): the June `config.json` with collection roles that change 6 folds in
- The `gh-cli-projects-tasks-conventions` skill: the task-body-is-a-link-to-the-context-v-doc convention behind `issues: both`
- `Profile__Superpowers.md` and `Profile__GSD.md` in the open-specs study: subagent-driven development with two-stage review, and fresh context per task
- `ai-labs/context-v/explorations/When-Claud-Code-and-When-Pi.md`: Pi reads Agent Skills and `AGENTS.md`, which makes it the natural rung-2 test harness

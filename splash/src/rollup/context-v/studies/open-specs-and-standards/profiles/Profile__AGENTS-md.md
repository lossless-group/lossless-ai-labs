---
name: AGENTS.md Profile
slug: agents-md
upstream: https://github.com/agentsmd/agents.md
package: null
license: per repo (site code under repo's LICENSE)
maintainer: Agentic AI Foundation (Linux Foundation), originated by OpenAI Codex, Amp, Jules, Cursor, Factory
study: studies/open-specs-and-standards
profile_path: studies/open-specs-and-standards/agents-md
profile_kind: file-convention
date_created: 2026-05-05
from: "studies/open-specs-and-standards"
from_path: "context-v/profiles/Profile__AGENTS-md.md"
---
# AGENTS.md — Profile

A profile of AGENTS.md as it lives in this study (`studies/open-specs-and-standards/agents-md/`). Cites pinned paths so you can jump to source rather than trust paraphrase. Read this alongside [`Profile__OpenSpec.md`](./Profile__OpenSpec.md), [`Profile__Spec-Kit.md`](./Profile__Spec-Kit.md), [`Profile__GSD.md`](./Profile__GSD.md), and [`Profile__12-Factor-Agents.md`](./Profile__12-Factor-Agents.md). Among the five, AGENTS.md is the **smallest** in scope and the **largest** in adoption.

## TL;DR

AGENTS.md is **a single-file convention**: an optionally-present `AGENTS.md` at the repository root (and optionally in subdirectories) that contains agent-facing context an AI coding tool reads automatically (`README.md:5-9`):

> AGENTS.md is a simple, open format for guiding coding agents. Think of AGENTS.md as a README for agents: a dedicated, predictable place to provide context and instructions to help AI coding agents work on your project.

It is **not** a tool, **not** a CLI, **not** a methodology, **not** a markdown grammar. There is no schema, no required heading set, no validator. The site says it explicitly (`components/FAQSection.tsx:13-16`):

> **Are there required fields?** No. AGENTS.md is just standard Markdown. Use any headings you like; the agent simply parses the text you provide.

The single rule that gives the convention its power (`components/FAQSection.tsx:18-21`):

> **What if instructions conflict?** The closest AGENTS.md to the edited file wins; explicit user chat prompts override everything.

The repository at `agents-md/` *is* the marketing site for the convention — a Next.js app served at https://agents.md (`README.md:36-39`). The repo itself dogfoods the convention via its own `AGENTS.md` (`agents-md/AGENTS.md`) telling agents to use `pnpm dev` and never `pnpm build` during interactive sessions. The convention itself is "put markdown in this file, agents will read it."

If OpenSpec/Spec Kit/GSD answer "**how should I structure work for an agent?**", and 12-Factor Agents answers "**how should I architect an agent application?**", AGENTS.md answers "**where should the project's agent-facing context live so every agent finds it the same way?**" Different layer, smaller scope, broader reach.

## Why this is different from "just put it in README"

The site's own answer (`components/WhySection.tsx:17-25`):

> README.md files are for humans: quick starts, project descriptions, and contribution guidelines.
>
> AGENTS.md complements this by containing the extra, sometimes detailed context coding agents need: build steps, tests, and conventions that might clutter a README or aren't relevant to human contributors.

The argument has three legs (`WhySection.tsx:27-55`):

1. **Give agents a clear, predictable place for instructions.** Every agent looks in the same file at the same path — no per-tool config to discover.
2. **Keep READMEs concise and focused on human contributors.** Agent-specific build commands, "do not run X," "always use the dev server," etc. don't belong in human-onboarding docs.
3. **Provide precise, agent-focused guidance that complements existing README and docs.** Not a replacement; an addition.

The closing pitch (`WhySection.tsx:57-60`):

> Rather than introducing another proprietary file, we chose a name and format that could work for anyone. If you're building or using coding agents and find this helpful, feel free to adopt it.

That last clause is the load-bearing one. AGENTS.md exists because the alternative was a fragmented landscape of `.cursor-rules`, `CLAUDE.md`, `.aider.conf.yml` `read:` directives, `gemini/settings.json`, `.windsurf/rules`, etc. — every coding agent inventing its own context file. AGENTS.md is the schelling-point answer.

## The four rules

The entire convention fits in four observable rules, distilled from the FAQ and the How-To section:

### 1. Any markdown — no required headings

`FAQSection.tsx:13-16`. There's no spec to violate. The closest thing to a recommended skeleton is in the README's minimal example (`README.md:12-33`), which uses three sections — *Dev environment tips*, *Testing instructions*, *PR instructions* — but those are illustrative, not normative. The site's How-To (`HowToUseSection.tsx:18-26`) lists "popular choices":

- Project overview
- Build and test commands
- Code style guidelines
- Testing instructions
- Security considerations

…and explicitly invites you to add anything else you'd tell a new teammate (`HowToUseSection.tsx:32`).

### 2. Closest file wins; chat overrides everything

`FAQSection.tsx:18-21`. The precedence rule for nested files: the agent walks up from the edited file to the nearest `AGENTS.md`, and that one's instructions take effect. A subdirectory's `AGENTS.md` therefore overrides a root-level one for files under that subdirectory. **Explicit user chat prompts override every AGENTS.md** at any level.

This single precedence rule is what makes the convention scale to large repos:

> **Large monorepo? Use nested AGENTS.md files for subprojects.** Place another AGENTS.md inside each package. Agents automatically read the nearest file in the directory tree, so the closest one takes precedence and every subproject can ship tailored instructions. **For example, at time of writing the main OpenAI repo has 88 AGENTS.md files.** (`HowToUseSection.tsx:36-40`)

### 3. Listed commands get run

`FAQSection.tsx:23-26`:

> **Will the agent run testing commands found in AGENTS.md automatically?** Yes — if you list them. The agent will attempt to execute relevant programmatic checks and fix failures before finishing the task.

This is the rule that turns AGENTS.md from a passive document into an active spec. List `pnpm lint && pnpm test` under "Testing instructions" and a compliant agent will run those before finishing — and try to fix failures. List a deploy command and you've authorized the agent to attempt it.

### 4. Living documentation, no migration ceremony

`FAQSection.tsx:28-29`:

> **Can I update it later?** Absolutely. Treat AGENTS.md as living documentation.

And the migration recipe for projects that already have a different agent-context file (`FAQSection.tsx:32-47`):

```bash
mv AGENT.md AGENTS.md && ln -s AGENTS.md AGENT.md
```

Rename, symlink for backward compatibility, done. The same pattern works for `.cursor-rules`, `CLAUDE.md`, etc. — you don't lose tools that read the old name.

## What's actually inside this submodule

The repo is the **marketing site for the convention**, not an implementation. There is nothing to install — the convention is already supported by the agents listed below. The repo content:

```text
agents-md/
├── README.md                           # 49 lines — pitch + the minimal AGENTS.md example
├── AGENTS.md                           # 43 lines — the repo dogfooding its own convention (Next.js dev rules)
├── package.json                        # Next.js + Tailwind + TypeScript app
├── pages/
│   ├── _app.tsx, _document.tsx
│   └── index.tsx                       # Composes Hero + sections into the homepage
├── components/
│   ├── Hero.tsx                        # Top-of-page hero + tagline
│   ├── WhySection.tsx                  # "Why AGENTS.md?" — README-vs-AGENTS distinction
│   ├── HowToUseSection.tsx             # 4-step adoption guide; nested-files note
│   ├── ExamplesSection.tsx             # Embedded code example
│   ├── ExampleListSection.tsx          # 4 hard-coded "who uses AGENTS.md" repo cards + 60k+ search link
│   ├── CompatibilitySection.tsx        # The 23-agent ecosystem marquee
│   ├── FAQSection.tsx                  # The four behavioral rules
│   ├── AboutSection.tsx                # Origin + Linux Foundation stewardship
│   ├── Section.tsx, CodeExample.tsx, Footer.tsx, icons/
└── public/
    └── logos/                          # Per-agent logos for the marquee
```

Two files to read end-to-end:

- `README.md` — for the framing and the minimal example.
- `AGENTS.md` (this repo's own one) — as a worked example of the convention. It's a tight 43-line file with four sections (use the dev server, keep deps in sync, coding conventions, useful commands recap). Notice it states a *prohibition* (`AGENTS.md:11-15`): **"Do _not_ run `npm run build` inside the agent session"** — that's the kind of agent-specific instruction that doesn't belong in a human README but is exactly what AGENTS.md is for.

Two files to skim:

- `components/CompatibilitySection.tsx:14-142` — the 23 supported agents and their docs links.
- `components/FAQSection.tsx` — every observable rule of the convention is in here.

The rest of the repo is presentational Next.js / Tailwind code for the marketing site. It's a useful artifact of "this is what good site code looks like," but it isn't part of the spec.

## The compatibility list (as of this study's pin)

`components/CompatibilitySection.tsx:14-142` lists 23 supported agents/tools. By origin:

**Originating collaborators** (`AboutSection.tsx:6-13`): OpenAI Codex, Amp, Jules (Google), Cursor, Factory.

**Other adopters** in the marquee:

| Agent | Vendor / Origin | Configured how |
|-------|-----------------|----------------|
| Codex | OpenAI | Native default |
| Amp | Sourcegraph | Native default |
| Jules | Google | Native default |
| Cursor | — | Native default |
| Factory | — | Native default |
| RooCode | — | Native default |
| Aider | — | Add `read: AGENTS.md` to `.aider.conf.yml` (`FAQSection.tsx:50-65`) |
| Gemini CLI | Google | Set `context.fileName: "AGENTS.md"` in `.gemini/settings.json` (`FAQSection.tsx:67-87`) |
| goose | Block | Native default |
| Kilo Code | — | Native default |
| opencode | — | Native default (see `opencode.ai/docs/rules/`) |
| Phoenix | — | Native default |
| Zed | — | Native default (see `zed.dev/docs/ai/rules`) |
| Semgrep | — | Native default |
| Warp | — | Native default (project-scoped rules) |
| Coding agent | GitHub Copilot | Native default |
| VS Code | Microsoft | Native default |
| Ona | — | Native default |
| Devin | Cognition | Native default |
| Windsurf | Cognition | Native default |
| Autopilot & Coded Agents | UiPath | Native default |
| Augment Code | — | Native default |
| Junie | JetBrains | Native default |

That's almost the entire current-generation coding-agent ecosystem on a single file convention. Compare this to the per-tool fragmentation that was the alternative — `.cursor-rules`, `CLAUDE.md`, `.windsurf/rules`, etc., each only readable by one product.

## Adoption signal

`ExampleListSection.tsx` ships four hardcoded high-profile examples (`ExampleListSection.tsx:22-45`) — `openai/codex` (Rust), `apache/airflow` (Python), `temporalio/sdk-java` (Java), `PlutoLang/Pluto` (C++). The eye-catching number is in the link below the list (`ExampleListSection.tsx:75-80`):

> **View 60k+ examples on GitHub** — https://github.com/search?q=path%3AAGENTS.md+NOT+is%3Afork+NOT+is%3Aarchived&type=code

60,000+ non-fork, non-archived public repos shipping an AGENTS.md at the time the site was built. For comparison, the worked example of monorepo nesting from the same site (`HowToUseSection.tsx:38`) — *"the main OpenAI repo has 88 AGENTS.md files"* — shows the within-repo adoption pattern.

## Stewardship

`AboutSection.tsx:20-32`:

> AGENTS.md is now stewarded by the **Agentic AI Foundation under the Linux Foundation**.

That move is the convention's most consequential governance event: it takes the format out of any single vendor's hands and gives it the same kind of neutral home that Open Container Initiative (OCI) and CNCF give container/cloud-native standards. For a file-format convention to become a real standard rather than a marketing label, it needs that. AGENTS.md has it.

## How to use it

The site lays out a four-step adoption (`HowToUseSection.tsx:6-41`):

### 1. Add AGENTS.md

Create `AGENTS.md` at the repo root. Most coding agents will scaffold one if you ask. The repo's own `AGENTS.md` (`agents-md/AGENTS.md`) is a 43-line worked example with four sections.

### 2. Cover what matters

Headings to consider (`HowToUseSection.tsx:18-26`):

- **Project overview** — one paragraph an agent can read for context before its first edit.
- **Build and test commands** — the exact CLI invocations.
- **Code style guidelines** — language, file layout, naming, type-vs-JS preferences.
- **Testing instructions** — what to run, what passing means, what to update when changing code.
- **Security considerations** — what not to touch, what to escalate.

The README's minimal example (`README.md:12-33`) shows three sections — *Dev environment tips*, *Testing instructions*, *PR instructions* — with concrete `pnpm` commands and a PR title format.

### 3. Add extra instructions

`HowToUseSection.tsx:32`: *"Commit messages or pull request guidelines, security gotchas, large datasets, deployment steps: anything you'd tell a new teammate belongs here too."* Two patterns worth highlighting from the repo's own `AGENTS.md`:

- **Prohibitions, not just affordances.** This repo's `AGENTS.md:11-15` tells agents not to run `pnpm build` because it breaks HMR. Encoding the *don'ts* is at least as important as the *dos*.
- **Useful commands recap.** A small table at the bottom of `AGENTS.md` (`AGENTS.md:30-37`) listing every command and its purpose. Agents can look this up before invoking arbitrary scripts.

### 4. For monorepos: nest

Place an `AGENTS.md` at the root and one inside each package or subproject that needs different rules. The agent walks up from the edited file to the nearest `AGENTS.md`. The OpenAI main repo's 88-file pattern is the upper-end reference.

### 5. Migrate existing per-tool files

`FAQSection.tsx:32-47`. If your repo already has a `CLAUDE.md`, `.cursor-rules`, `AGENT.md` (singular), or similar:

```bash
mv AGENT.md AGENTS.md && ln -s AGENTS.md AGENT.md
```

You unify under AGENTS.md and keep the old filename as a symlink so any tool that hasn't migrated yet still finds the same content.

## Mental model for using it well

- **AGENTS.md is the contract surface, not the content.** Every agent in the ecosystem agrees to look at this file. What you *put in it* is your team's choice. Treat it like `package.json` — the location is the standard, the contents are yours.
- **Encode the prohibitions.** "Always do X" is useful; "never do Y" prevents class-of-error mistakes the agent would otherwise make. The repo's own `AGENTS.md` is mostly prohibitions ("do not run `npm run build`") because those are the constraints the dev environment can't self-enforce.
- **List runnable commands explicitly.** The "agents will run what you list" rule (`FAQSection.tsx:23-26`) cuts both ways — be precise. `pnpm test` is a different commitment than "run the tests."
- **Nest for monorepos.** A top-level `AGENTS.md` for the cross-cutting rules; per-package files for build/test commands and language-specific style. Closest-wins precedence does the rest.
- **Don't overengineer.** No frontmatter, no schema, no required headings. If you find yourself building a parser, you've left the convention. The contract is "agents will parse the markdown text you provide" — that's it.
- **Update like docs, not like code.** It's living documentation (`FAQSection.tsx:28-29`). Don't gate updates behind a heavy review; treat it like README maintenance.
- **Symlink the legacy names during migration.** `mv && ln -s` is the migration recipe. Don't break tools mid-transition.

## When NOT to reach for this

- **You want a spec format with structure.** AGENTS.md has none by design. If you need *Requirement / Scenario / RFC 2119 keyword* structure, that's OpenSpec. If you need *constitution + phase gates*, that's Spec Kit. AGENTS.md is intentionally below that layer.
- **You want a workflow.** AGENTS.md doesn't tell the agent *what to do* — it tells the agent *what's true about this project*. For workflow orchestration use GSD or Spec Kit's command pipeline.
- **You're building an agent product, not using one.** AGENTS.md is for projects you're working in. If you're shipping an agent application, the principles in 12-Factor Agents are the relevant artifact.
- **Your repo is genuinely simple.** A single 200-line script doesn't need a project-overview file for agents. The README is enough. Adopt AGENTS.md when the gap between "what humans need to know" and "what agents need to know" actually opens up.
- **You need behavioral guarantees, not best-effort.** AGENTS.md is parsed best-effort by each tool — there's no validator, no enforcement. If you need guarantees that an agent *cannot* run a forbidden command, use the host runtime's permission system (Claude Code's settings.json, Cursor's deny lists, etc.). AGENTS.md is advisory.

## AGENTS.md vs. the other four — the honest comparison

| Axis | AGENTS.md | OpenSpec | Spec Kit | GSD | 12-Factor Agents |
|------|-----------|----------|----------|-----|------------------|
| **What it is** | A file convention | A markdown convention + CLI | A methodology + Python CLI + templates | A multi-runtime installer + 65 commands + 33 subagents | A manifesto / set of design principles |
| **Primary artifact** | `AGENTS.md` (root + nested) | `openspec/specs/` + `openspec/changes/` | `specs/NNN-feature/` + `.specify/` | `.planning/` directory | 13 essays |
| **Required structure** | None | `Requirement:` + `Scenario:` headings, RFC 2119 keywords, ADDED/MODIFIED/REMOVED deltas | User-story priorities + acceptance scenarios + `[NEEDS CLARIFICATION]` markers | XML `<task>` blocks with `<verify>` and `<done>` | None — applied as principles in your own code |
| **What it constrains** | The *file location* agents look at | The grammar of specs and how changes diff | The phases/gates an LLM walks through to produce code | The orchestrator that drives the LLM | The architecture of agent applications |
| **Toolchain** | None | Node/npm | Python (uv/pipx) | Node/npm + multi-runtime install | None |
| **Ecosystem reach** | **23+ agents, 60k+ repos, Linux Foundation steward** | ~25 integrations | ~30 integrations | 16 runtimes | N/A — applied principles |
| **Layering** | Sits *under* OpenSpec/Spec Kit/GSD | Replaces prose specs | Replaces prose PRDs | Drives implementation end-to-end | Architectural advice for agents you build |

The relationship to the other tools is **subordinate, not competitive**: a project using OpenSpec, Spec Kit, or GSD typically *also* has an `AGENTS.md` at root telling the agent how to build, test, and lint the code that those tools have planned. The site's own framing (`WhySection.tsx:50-51`) — "*provide precise, agent-focused guidance that complements existing README and docs*" — extends naturally to "complements existing spec and workflow tooling," too.

## One-line summary

> AGENTS.md wins by being the smallest possible convention — one file, no schema, one rule (closest wins, chat overrides) — and by getting 23 coding agents and 60k+ repos to agree to read it, so it has become the de-facto schelling point for agent-facing project context across an otherwise fragmented ecosystem.

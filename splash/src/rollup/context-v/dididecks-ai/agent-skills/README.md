---
from: "dididecks-ai"
from_path: "context-v/agent-skills/README.md"
---

# Agent Skills · dididecks-ai

This directory is the **shared snapshot** of the agent skills that load during work on `dididecks-ai`. Collaborators each maintain their own copy of these skills wired into whatever coding agent they use (Claude Code at `~/.claude/skills/`, Pi at `~/.pi/skills/`, Cursor's rules, etc.). This directory exists so that snapshot is *visible* — checked into the repo, reviewable in PRs, and a reliable point of comparison when an agent's behavior drifts.

## How to use this directory

**Two complementary modes, depending on which way the wind is blowing:**

1. **Keep your local skills current with this directory.** Periodically diff your `~/.claude/skills/<skill-name>/` (or your equivalent) against the matching `context-v/agent-skills/<skill-name>/` here. If the version here is newer or different, refresh your local copy. This is how a collaborator joining the repo gets to the same baseline the rest of the team works against.

2. **If you iterate on or author a new skill, push it back to this directory.** Edit your local copy, validate it works in your agent, then copy the updated `SKILL.md` (and any helper files) back into `context-v/agent-skills/<skill-name>/` here and commit. Even if your local management system is the source of truth for *you*, the repo copy is the source of truth for the *team*.

> Each collaborator will have their own system for managing agent-skills on their machine. Collaborators should make sure their skills are current with `dididecks-ai`'s agent-skills in `context-v`. Alternately, if they iterate on or create agent-skills, they should update them in the `dididecks-ai` repo as best they can.

## What's in here (as of authoring)

Sixteen skills, picked for their direct load-bearing relevance to dididecks-ai work. The set divides roughly:

### Tree + process discipline (always relevant)

| Skill | What it does |
|---|---|
| `pseudomonorepos` | Parent-of-children repos, branch-tier alignment, HARD STOP rules for relocation, content roll-up |
| `context-vigilance` | `context-v/` directory roles, frontmatter, version-stamping, four-mode (prep/reflective/journey/spec) discipline |
| `astro-knots` | Astro convention family — framework rules, approved deps, hard prohibitions (React/JSX/Angular) |
| `changelog-conventions` | How `changelog/` entries are structured, frontmatter discipline, four-audience cascade |
| `git-conventions` | Commit message format (action verbs, effort groupings, paragraph-spaced bodies, "Also included" riders) |
| `study-repos-first` | The "pin upstream code before designing" discipline for studies-driven decisions |

### Deck-building (domain-specific to dididecks-ai)

| Skill | What it does |
|---|---|
| `setup-new-dddecks-workspace` | **Stub.** Scaffold a new `client-sites/<slug>/` end-to-end — submodule, brand import (website-parse OR source-code-copy), DESIGN.md, theme tokens, auth surface, corpus connection, starter Scroll-UI deck. Composes the other skills; first run is The Lossless Group as its own client. |
| `deck-iteration-workflow` | The phased workflow: single-page narrative → individual slides → componentization → features → full deck → advanced interactivity |
| `slide-target` | Load the full working context for ONE slide (deck/variant/slot) — section file, slot registry, narrative slot, rank status, live URLs, design tokens — and scope work to it. First of the `slide-*` family (target → improve → rank → decompose); the agent-side "context broker" for slide-by-slide iteration. |
| `maintain-design-md` | How a per-client `DESIGN.md` is authored (Google Stitch spec + Lossless extensions); the three-mode invariant |
| `theme-system` | Two-tier token architecture (named `__` + semantic kebab), three-mode contract (light/dark/vibrant), `--fx-*` effect dials |

### Asset + data ingest

| Skill | What it does |
|---|---|
| `crawl-fetch-ingest` | Crawl a firm's site / a PDF; ingest people + portfolio metadata as canonical `.md` files; four-checkpoint cascade with confidence flagging |
| `generate-consistent-og-images` | Ideogram v3 recipe for share imagery; pulls locked tokens from `DESIGN.md`; WhatsApp/iMessage as primary unfurl surface |
| `overlay-svg-text` | Brand-typed text overlays (Hack Bold gradient h1, thin sans eyebrow, Poor Story handwriting) on top of generated imagery |

### Splash + content

| Skill | What it does |
|---|---|
| `maintain-splash-pages` | The repo-level `splash/` convention — GitHub Pages target, changelog rollup, marketing-up-top discipline |
| `lossless-flavored-markdown` | LFM directives (callouts, embeds, citations) and how sites consume them via the `@lossless-group/lfm` package |
| `open-graph-share-seo-geo` | Share-preview engineering: OG metadata, sitemap.xml, robots.txt, `llms.txt` standard for GEO |

### Search

| Skill | What it does |
|---|---|
| `search-lossless-corpus` | The four-step agentic-search loop against the local Chroma RAG (collections: `context-vigilance-corpus`, `lossless-changelog`, `claude-code-sessions`, `claude-code-tool-traces`) |

## Skills NOT included here

Some Lossless skills exist that are deliberately not snapshotted into this repo, either because they're meta (about managing the source-of-truth skills repo itself) or because they're specific to a different vertical:

- **`chroma-agent-skills`** — submodule covering chroma-DB-specific agent tooling, not the dididecks chroma-decks client
- **`AUTHORING.md` / `CANDIDATES.md`** — internal to the upstream lossless-skills repo
- **`sync-skills.sh`** — the upstream's symlink-management script for getting skills into `~/.claude/skills/` and `~/.pi/skills/`

If you find a skill that's not here and that you wish *was* here for a reason load-bearing to dididecks-ai work, **copy it in and update the table above** as part of the same commit.

## Skills authoring discipline (one-paragraph version)

A skill is a directory: `<skill-name>/SKILL.md` is the entry point, optional `references/`, `templates/`, `routines/`, `scripts/` sit alongside. The `SKILL.md` frontmatter has at minimum `name:` and `description:` — the description is what an agent reads to decide whether to load the skill, so write it to be *triggering*: name the verbs, contexts, and user-utterance patterns that should fire it. The body is the discipline itself in prose, written for an agent (terse, code-shaped, table-friendly). See the upstream `AUTHORING.md` for the full guidance.

## See also

- Upstream source: `~/code/lossless-monorepo/context-v/skills/` (on the maintainer's machine; not the same path on every collaborator)
- Each skill's own `SKILL.md` is the source of truth for what that skill does
- `../specs/Dididecks-AI-Slide-Decks-as-Code.md` — the deck-OS spec these skills support

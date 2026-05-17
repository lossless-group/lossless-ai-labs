---
title: "Init DidiDecks as Core Submodule of AI-Labs"
lede: "Carve out dididecks-ai as its own repo and re-attach it to ai-labs as a git submodule, following Lossless pseudomonorepo discipline — branch-aligned tiers, rollup-friendly context-v, splash-page on day one, and the parent's gitlink as the single point of truth."
date_created: 2026-05-11
date_modified: 2026-05-16
date_first_published: 2026-05-11
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.1.0
tags:
  - Plan
  - Pseudomonorepo
  - Git-Submodule
  - Dididecks
  - AI-Labs
  - Repo-Init
  - Branch-Alignment
status: Shipped
from: "dididecks-ai"
from_path: "context-v/plans/Init-DidiDecks-as-core-Submodule-of-AI-Labs.md"
---
# Init DidiDecks as Core Submodule of AI-Labs

> Plan of record for promoting `dididecks-ai` from "a folder full of specs at `ai-labs/context-v/`" to a first-class child of the `ai-labs/` pseudomonorepo — its own GitHub repo, its own branch-tier (development → main → master), its own `context-v/` and `changelog/`, its own splash page, and a `branch =`-aware submodule pointer from `ai-labs/`. Steps preserved verbatim from the user's outline; each step is filled out with concrete actions, commands, and verification.

## Pseudomonorepo discipline this plan honors

- **The parent owns the space between children.** `ai-labs/` aggregates context across `memopop-ai`, `dididecks-ai`, and future children. Their internals are theirs. (See `pseudomonorepos` skill.)
- **Branch alignment across the tree.** Every Lossless submodule rides a three-tier model: `development` → `main` → `master`. Each tier created from the start so we don't pay the cost later. (See `references/branch-alignment.md` in the pseudomonorepos skill.)
- **Universal directories.** Every repo level has both `context-v/` and `changelog/` as siblings at the root. We aspire to parallel placement; we'll set that up correctly from day one.
- **Rollup-friendly content.** The parent splash and `ai-labs/`-level splash should be able to surface this submodule's `changelog/` and `context-v/` via the GitHub Content API. That implies (a) `branch =` is set in `.gitmodules`, (b) directory shapes are conventional, (c) no surprises.
- **Lifecycle phases.** Each phase of this plan corresponds to a Start → Progress → Reflect → Publish loop position. Tracked in changelog entries as we go.

## 1. Move Astro-Knots projects `reach-edu-hub` and `calmstorm-decks` to `ai-labs/dididecks-ai/` as `client-sites/*`

**Final location:** `ai-labs/dididecks-ai/client-sites/reach-edu-hub` and `ai-labs/dididecks-ai/client-sites/calmstorm-decks`.

### Why

Both sites were originally added as submodules of `astro-knots/sites/`. They are, in practice, **client engagements that exercise the DidiDecks pattern** — not generic astro-knots sites. Re-parenting them under `dididecks-ai/client-sites/` aligns their *narrative parent* with their *git parent*, makes them legible to the upcoming DidiDecks splash page, and lets the rollup mechanism surface their changelogs alongside the rest of the dididecks family.

The sites themselves do not move on GitHub — they remain their own repos at their existing URLs. Only the *parent reference* changes.

### Constraints

- **Each site's Vercel deploy is wired to its own repo**, not to astro-knots. Re-parenting must not break deploys. (Verify: open Vercel project → confirm git remote points at the site's own repo, not `astro-knots`.)
- **Site git history is sacred.** Re-parenting touches `.gitmodules` in both astro-knots (remove) and dididecks-ai (add). The site repos themselves are not modified.
- **`development` branch alignment** — when re-adding under dididecks-ai, set `branch = development` in `.gitmodules` so the gitlink follows the working branch.

### Actions

1. **Pre-flight (in `astro-knots/`):**
   ```bash
   cd ~/code/lossless-monorepo/astro-knots
   git status                              # clean working tree before touching submodules
   cat .gitmodules | grep -A2 calmstorm-decks
   cat .gitmodules | grep -A2 reach-edu-hub
   ```
2. **Defer the astro-knots-side removal** until *after* step 5 (the submodule is registered against `ai-labs/dididecks-ai/`). Two parents pointing at the same submodule for a brief window is fine; an *orphaned* gitlink is not.
3. **In step 5,** when `dididecks-ai/` is its own repo, perform inside it:
   ```bash
   cd ~/code/lossless-monorepo/ai-labs/dididecks-ai
   mkdir -p client-sites
   git submodule add -b development <git@github.com:lossless-group/calmstorm-decks.git> client-sites/calmstorm-decks
   git submodule add -b development <git@github.com:lossless-group/reach-edu-hub.git>     client-sites/reach-edu-hub
   git submodule sync
   git submodule update --init --recursive
   ```
4. **Then in `astro-knots/`:**
   ```bash
   cd ~/code/lossless-monorepo/astro-knots
   git submodule deinit sites/calmstorm-decks
   git rm sites/calmstorm-decks
   git submodule deinit sites/reach-edu-hub
   git rm sites/reach-edu-hub
   git commit -m "relocate(submodules): move calmstorm-decks and reach-edu-hub to dididecks-ai pseudomonorepo"
   ```
   The `pnpm-workspace.yaml` in astro-knots also needs the corresponding `sites/...` lines removed (or they'll throw on `pnpm install`).

### Verification

- Both sites' Vercel deploys are still green after the parent flip.
- `git submodule status` in `dididecks-ai/` shows both, on `development`, with valid SHAs.
- `git submodule status` in `astro-knots/` no longer mentions them.
- A `pnpm install` at the `astro-knots/` root succeeds.

## 2. Move Dididecks Context-V files into `ai-labs/dididecks-ai/context-v/`

> [!NOTE] Rollup behavior of pseudomonorepos Context-V
>
> A recent habit change we have implemented is that the "splash page" in `splash/` (hosted through Github Pages) now collates and publishes a rollup of all the context-v projects in the pseudomonorepo — however nested. This means that the splash page will now show all the Context-V files in the pseudomonorepo, and will be updated automatically when new files are added and commit/pushed to the repository.

### Files to move

From `ai-labs/context-v/` → `ai-labs/dididecks-ai/context-v/`:

| Source | Destination |
|---|---|
| `ai-labs/context-v/specs/Dididecks-AI-Slide-Decks-as-Code.md` | `dididecks-ai/context-v/specs/Dididecks-AI-Slide-Decks-as-Code.md` |
| `ai-labs/context-v/specs/Dididecks-AI-DD-Ready-Citation-and-Source-Access.md` | `dididecks-ai/context-v/specs/Dididecks-AI-DD-Ready-Citation-and-Source-Access.md` |
| `ai-labs/context-v/specs/Dididecks-AI-Visual-and-Diagram-Component-Library.md` | `dididecks-ai/context-v/specs/Dididecks-AI-Visual-and-Diagram-Component-Library.md` |
| `ai-labs/context-v/explorations/Dididecks-AI-Business-Model.md` | `dididecks-ai/context-v/explorations/Dididecks-AI-Business-Model.md` |
| *(this file)* `ai-labs/context-v/plans/Init-DidiDecks-as-core-Submodule-of-AI-Labs.md` | `dididecks-ai/context-v/plans/Init-DidiDecks-as-core-Submodule-of-AI-Labs.md` *(once executed, this plan lives with its outcome)* |

### Scaffold the destination

```bash
cd ~/code/lossless-monorepo/ai-labs/dididecks-ai
mkdir -p context-v/{specs,prompts,blueprints,reminders,explorations,issues,plans}
mkdir -p changelog
```

Six canonical subdirectories + `plans/` (already in adopted use at the `ai-labs/` level — assimilated, not introduced fresh). `changelog/` as a top-level sibling of `context-v/` per the universal-directories aspiration in the `pseudomonorepos` skill.

### Path adjustments after the move

Wikilinks in the moved files reference both **prior-art outside dididecks-ai** (which stays at the same absolute location, but the relative depth changes) and **the calmstorm-decks site** (which is *also* moving — from `astro-knots/sites/` to `dididecks-ai/client-sites/`). New relative paths from `dididecks-ai/context-v/specs/`:

| Target | Old path (from `ai-labs/context-v/specs/`) | New path (from `dididecks-ai/context-v/specs/`) |
|---|---|---|
| `astro-knots/context-v/...` | `../../astro-knots/context-v/...` | `../../../../astro-knots/context-v/...` |
| `astro-knots/sites/calmstorm-decks/...` *(moves)* | `../../astro-knots/sites/calmstorm-decks/...` | `../../client-sites/calmstorm-decks/...` |
| `lossless-monorepo/context-v/...` (root) | `../../../context-v/...` | `../../../../context-v/...` |
| Business-model exploration | `../explorations/Dididecks-AI-Business-Model` | `../explorations/Dididecks-AI-Business-Model` *(unchanged — same parent-relative)* |
| Sibling specs (within dididecks context-v) | `Dididecks-AI-DD-Ready-Citation...` | *(unchanged)* |

These adjustments happen in the **second commit** of step 5 (per user's note: "Change relative paths to context-v files and prior art, serve as second commit").

### Actions

1. Move files with `git mv` *if* we want to preserve cross-history; otherwise plain `mv` is fine since the files only exist in one repo's history.
2. After move, run a grep over the moved files for any `../../astro-knots/sites/calmstorm-decks/...` or `../../astro-knots/...` patterns and update them per the table above.
3. Update the parent spec's `Related` section to reflect the sibling specs' new location (they're now siblings *within the same context-v/*, so the cross-spec wikilinks `[[Dididecks-AI-DD-Ready-Citation-and-Source-Access]]` stay unchanged — good).
4. Re-bump `at_semantic_version` on the parent spec to reflect the relocation (minor, since the content didn't change semantically).

### Verification

- `dididecks-ai/context-v/specs/` contains the three specs.
- `dididecks-ai/context-v/explorations/` contains the business-model doc.
- `dididecks-ai/context-v/plans/` contains this plan once executed.
- All wikilinks render correctly in Obsidian (open the vault rooted at `lossless-monorepo/` and verify the graph view connects).
- A grep for `../../astro-knots/sites/calmstorm-decks` returns *zero* hits in the moved files.

## 3. Generate a Splash page using Astro for Didi labs

Use the context-v files to spec content hierarchy and marketing language for a splash page. Reference the agent-skills and `/Users/mpstaton/code/lossless-monorepo/context-v/habits/Maintain-a-Github-Splash-Page-for-each-Repo.md`.

Milestone is it builds and renders on local.

### Scope

A first-pass marketing splash at `dididecks-ai/splash/` — Astro Knots conventions, GitHub Pages publish target, package-isolated from the upcoming `dididecks-ai` core library, dark-mode default.

The splash is *not* the DidiDecks product. It is the README-on-the-web for the project — what `lossless-group.github.io/dididecks-ai/` (or the future custom domain) will serve. It introduces the project, surfaces the context-v rollup, and changelog, and points at the GitHub repo.

### Skills and references to load

- `maintain-splash-pages` skill — the canonical pattern (memopop-site, content-farm/splash, lfm/splash are reference implementations).
- `astro-knots` skill — Astro 6, no React, Svelte for interactivity, hard prohibitions list.
- `theme-system` skill — two-tier tokens, three-mode contract.
- `lossless-flavored-markdown` skill — if the splash renders any markdown content (it will, for the context-v rollup).
- `open-graph-share-seo-geo` skill — for unfurl + sitemap + llms.txt from day one.
- `generate-consistent-og-images` skill — splash OG card; must precede sharing.
- `maintain-design-md` skill — write `DESIGN.md` at `dididecks-ai/splash/DESIGN.md` before any non-trivial visual decision is locked.
- `~/code/lossless-monorepo/context-v/habits/Maintain-a-Github-Splash-Page-for-each-Repo.md` — habit doc.

### Content hierarchy (drawn from the context-v files we just wrote)

Lead with **The Due Diligence Bar -- Didi** from the parent spec — that's the central hook for the splash hero. Then:

1. **Hero** — "Decks for Due Diligence, not for vibes." The DD framing as the headline.
2. **The two North Stars** — NS-1 (two-sided private/public) and NS-2 (player so good they present live).
3. **The Design Principles strip** — six or seven cards summarizing the recurring needs (citation discipline, non-destructive iteration, MVP-always, Keynote-grade export, etc.).
4. **The system map** — the ingest → wow-ify → variant → publish → export → re-integrate ASCII flow from the parent spec, rendered as an actual diagram.
5. **The sibling-spec gallery** — short cards linking to the two sibling specs and the business-model exploration. (Surfaced via the context-v rollup mechanism.)
6. **Built-in-public footer** — link to GitHub, mention OSS posture (without committing to a license yet — that's a business-model question still in exploration).

### Mechanics

```bash
cd ~/code/lossless-monorepo/ai-labs/dididecks-ai
mkdir -p splash
cd splash
pnpm create astro@latest -- --template minimal --typescript strict --no-install
# Then adapt: add @lossless-group/lfm, copy markdown rendering pattern from
# astro-knots/sites/mpstaton-site, scaffold theme.css per theme-system skill,
# add @astrojs/sitemap, write robots.txt, add /llms.txt.
```

Package-isolation: `dididecks-ai/splash/` is a totally separate `package.json` from whatever the future `dididecks-ai` core library publishes. The splash never imports from the core; the core never imports from the splash. This is the `maintain-splash-pages` discipline — do not regress.

### Verification (milestone)

- `pnpm install && pnpm dev` inside `dididecks-ai/splash/` serves a working site at `localhost:4321`.
- `pnpm build` produces a `dist/` with no errors.
- The hero renders the DD framing.
- At least one card per sibling spec is visible.
- Dark mode is the default; theme toggle works.
- The OG image exists at `public/og/default.jpg` and unfurls correctly in iMessage (test via `Cmd+L` paste into a chat with yourself).

## 4. Use gh to create the repo, push as development, main, and master

Write README.md. Git init, create branches at parity. Push.

### Why all three branches at once

Per the `pseudomonorepos` branch-alignment discipline: every Lossless submodule rides a three-tier model. Creating all three at init time costs nothing and avoids the "humans got lazy" drift the skill warns about. The `branch =` line in the parent's `.gitmodules` (set in step 5) will point at `development`.

### Actions

1. **Author a minimal `README.md`** at `dididecks-ai/README.md`:

   ```markdown
   # DidiDecks-AI

   A code-first slide-deck operating system for Due-Diligence-grade content,
   built by [The Lossless Group](https://lossless.group).

   - Living spec: [`context-v/specs/Dididecks-AI-Slide-Decks-as-Code.md`](./context-v/specs/Dididecks-AI-Slide-Decks-as-Code.md)
   - Splash (in progress): [`splash/`](./splash/)
   - Part of the [ai-labs](https://github.com/lossless-group/ai-labs) pseudomonorepo.

   Status: early architecture. Not yet implementing.
   ```

2. **Author a minimal `LICENSE`** — placeholder (e.g., `Copyright (c) 2026 The Lossless Group. License terms TBD; see context-v/explorations/Dididecks-AI-Business-Model.md`) until the OSS license question lands.

3. **Author a `CLAUDE.md`** at `dididecks-ai/CLAUDE.md` — minimal pointer file: project intent, link to the parent spec, instructions for agents to load the `context-vigilance` and `astro-knots` skills before working here.

4. **Author the first `changelog/` entry** at `dididecks-ai/changelog/2026-05-11_01.md` per `changelog-conventions` skill — covering the init itself.

5. **Init git + branches:**

   ```bash
   cd ~/code/lossless-monorepo/ai-labs/dididecks-ai
   git init
   git add .
   git commit -m "init(dididecks-ai): scaffold context-v, splash, changelog, README"
   git branch -M development
   git branch main
   git branch master
   ```

6. **Create the GitHub repo and push:**

   ```bash
   gh repo create lossless-group/dididecks-ai --public --source=. --remote=origin --description "A code-first slide-deck OS for Due-Diligence-grade content."
   git push -u origin development
   git push origin main
   git push origin master
   gh repo edit lossless-group/dididecks-ai --default-branch development
   ```

### Verification

- `gh repo view lossless-group/dididecks-ai --json defaultBranchRef,visibility` returns `development` as default and the chosen visibility.
- `git branch -r` shows `origin/development`, `origin/main`, `origin/master`.
- `gh repo view lossless-group/dididecks-ai --web` opens to the README.

## 5. cd back into `ai-labs`, rm dir, add as submodule

Change relative paths to context-v files and prior art, serve as second commit.

### Why the rm-then-re-add dance

Until step 5, `ai-labs/dididecks-ai/` was an *embedded* git repo — its own `.git/` directory inside a parent that didn't track it. Git tolerates this but warns. To make it a proper submodule (with a gitlink in the parent and a `branch =` line in `.gitmodules`), we remove the embedded copy and re-add it via `git submodule add`. The contents on disk look identical after; the *parent's* tracking changes from "ignored embedded repo" to "tracked submodule pointer at SHA X on branch development."

### Actions

1. **Stash anything uncommitted inside the embedded repo first:**
   ```bash
   cd ~/code/lossless-monorepo/ai-labs/dididecks-ai
   git status   # must be clean. Commit/push anything outstanding before proceeding.
   ```

2. **Remove the embedded directory from ai-labs' working tree** (the repo itself, on GitHub, is unaffected):
   ```bash
   cd ~/code/lossless-monorepo/ai-labs
   rm -rf dididecks-ai
   ```

3. **Add as a submodule, tracking the development branch:**
   ```bash
   git submodule add -b development git@github.com:lossless-group/dididecks-ai.git dididecks-ai
   git submodule update --init --recursive
   ```

4. **Verify `.gitmodules` carries the `branch =` line** (a `.gitmodules` entry without it is a smell per the pseudomonorepos branch-alignment guidance):

   ```ini
   [submodule "dididecks-ai"]
       path = dididecks-ai
       url = git@github.com:lossless-group/dididecks-ai.git
       branch = development
   ```

5. **First commit in ai-labs — the submodule registration:**
   ```bash
   cd ~/code/lossless-monorepo/ai-labs
   git add .gitmodules dididecks-ai
   git commit -m "add(submodule): dididecks-ai pseudomonorepo child, tracking development"
   ```

6. **Second commit — path adjustments inside the moved context-v files.** Per step 2's path-adjustment table, fix wikilinks that depend on the new nesting depth:

   ```bash
   cd ~/code/lossless-monorepo/ai-labs/dididecks-ai
   # Edit the four context-v files, update paths per the table in step 2.
   git add context-v/
   git commit -m "fix(context-v): update wikilink relative paths after submodule promotion"
   git push origin development
   ```

7. **Update ai-labs' gitlink** to point at the new SHA:
   ```bash
   cd ~/code/lossless-monorepo/ai-labs
   git add dididecks-ai
   git commit -m "update(submodule): bump dididecks-ai pointer after context-v path fixes"
   ```

8. **Final sweep — also remove the now-stale copies from `ai-labs/context-v/specs/` and `ai-labs/context-v/explorations/`**, since the canonical home is now inside the submodule:
   ```bash
   cd ~/code/lossless-monorepo/ai-labs
   git rm context-v/specs/Dididecks-AI-Slide-Decks-as-Code.md
   git rm context-v/specs/Dididecks-AI-DD-Ready-Citation-and-Source-Access.md
   git rm context-v/specs/Dididecks-AI-Visual-and-Diagram-Component-Library.md
   git rm context-v/explorations/Dididecks-AI-Business-Model.md
   git commit -m "cleanup(context-v): remove dididecks specs+exploration; canonical home moved to submodule"
   ```

### Verification

- `cd ai-labs && git submodule status` shows `dididecks-ai` on `development` at a valid SHA.
- `cat ai-labs/.gitmodules` shows the `branch = development` line.
- `cd ai-labs/dididecks-ai && git status` shows clean working tree.
- The duplicate spec files no longer exist in `ai-labs/context-v/`.
- The splash builds and renders (`pnpm dev` inside `dididecks-ai/splash/`).
- The astro-knots side is also clean (sites removed from there per step 1).
- A walk of the tree from `lossless-monorepo/` finds the dididecks specs in *exactly one place* — the canonical home inside the submodule.

## After this plan is executed

The next plans in line (out of scope for *this* plan, but worth flagging):

1. **Roll up content into the ai-labs splash** — once `ai-labs/splash/` exists (or is built), wire it to pull `dididecks-ai/context-v/` and `dididecks-ai/changelog/` via the GitHub Content API per `references/content-rollup.md` in the `pseudomonorepos` skill.
2. **Roll up further into the lossless-monorepo splash** — same mechanism, one level up.
3. **Promote `branch = development` discipline across the rest of the ai-labs children** (memopop-ai etc.) so the whole pseudomonorepo is uniform.
4. **Write the first DidiDecks implementation prompt** under `dididecks-ai/context-v/prompts/` — likely "scaffold the core repo structure beyond the splash" or "extract the calmstorm-decks pattern into a reusable primitive."

## Cross-references

- [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — parent spec; the *why* this submodule exists.
- [[../specs/Dididecks-AI-DD-Ready-Citation-and-Source-Access]] — sibling spec; moves with this plan.
- [[../specs/Dididecks-AI-Visual-and-Diagram-Component-Library]] — sibling spec; moves with this plan.
- [[../explorations/Dididecks-AI-Business-Model]] — exploration; moves with this plan.
- `pseudomonorepos` skill — branch alignment, submodule init, content rollup mechanics.
- `context-vigilance` skill — the framework this plan honors.
- `maintain-splash-pages` skill — splash-page conventions referenced in step 3.
- `astro-knots` skill — splash-tech prohibitions and conventions.
- `changelog-conventions` skill — for the `changelog/2026-05-11_01.md` first entry written in step 4.
- `~/code/lossless-monorepo/context-v/habits/Maintain-a-Github-Splash-Page-for-each-Repo.md` — habit doc referenced in step 3.

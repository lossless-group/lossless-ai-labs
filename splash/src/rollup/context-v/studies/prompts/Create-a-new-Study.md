---
title: Create a New Study
purpose: A step-by-step checklist for spinning up a new study from scratch
audience: future Claude sessions taking over this work
from: "studies"
from_path: "context-v/prompts/Create-a-new-Study.md"
---
# Create a New Study

## What & why (read once, then skip)

A *study* is a curated reference collection — a directory of upstream specs,
prior art, or reference implementations, pinned as git submodules — gathered
*before* a decision or implementation. It is not a project (ships nothing)
and not docs (it's living code). See `studies/README.md` and
`studies/CLAUDE.md` for the full concept.

Each study lives as its **own GitHub repo** under `lossless-group/`, named
`study-<topic-slug>`, and is registered as a single submodule of
`ai-labs` at `studies/<topic-slug>/`. Inside that repo, each upstream
reference is a nested submodule. Worked examples to mirror:
`studies/open-specs-and-standards/` and `studies/memory-layers-for-agents/`.

## Inputs to confirm with the user before starting

- [ ] **The question.** One sentence. Without it, the study becomes a junk
      drawer. Refuse to start until this exists.
- [ ] **The slug.** Topic-shaped, kebab-case, reads naturally
      (`open-specs-and-standards`, not `oss`). Used both as the directory
      name and (with `study-` prefix) as the GitHub repo name.
- [ ] **Initial reference list.** URLs of upstream repos to pin. Three to
      five is a healthy start. More than ten is probably two studies.
- [ ] **Visibility.** Public unless the user says otherwise.

## Phase 0 — Verify candidate repos exist on GitHub

Before pinning anything, confirm each candidate URL resolves and capture
stars + description:

```bash
for slug in <owner>/<repo> <owner>/<repo> ...; do
  gh api "repos/$slug" --jq '"\(.full_name)\t\(.description // "(no description)")\t\(.stargazers_count)★"'
done
```

If anything 404s, surface it to the user before continuing — they may have
mistyped or the repo may be private.

## Phase 1 — Build the new study repo locally

Working dir: `ai-labs/studies/<slug>/`.

- [ ] `mkdir -p studies/<slug> && cd studies/<slug>`
- [ ] `git init -b main`
- [ ] Write `.gitignore` (minimum: `.DS_Store`, `node_modules`, `.venv`,
      `venv`, `__pycache__`, `.env`).
- [ ] Add each upstream as a submodule, **one at a time**:
      ```bash
      git submodule add <upstream-url> <local-dirname>
      ```
      Use absolute URLs. Do **not** add submodules in parallel (`&`) inside
      one repo — they collide on `.git/modules/<repo>/index.lock`.
- [ ] Write `README.md`. Required sections:
      - The question being investigated (h2).
      - Per-repo entries: link, maintainer, one-paragraph "why this is
        here". Group them by sub-theme if there are more than ~4.
      - A reading checklist or list of sub-inquiries to drive the actual
        study work.
- [ ] (Optional) Add a `context-v/inquiry/` folder for in-progress notes
      that should travel with the study.
- [ ] Stage explicitly (never `git add .` or `git add -A`):
      ```bash
      git add .gitignore .gitmodules README.md <each-submodule-name> [context-v]
      ```
- [ ] Commit:
      ```bash
      git -c user.name=mpstaton -c user.email=mpstaton@gmail.com commit -m "..."
      ```
      Subject style: `study(<slug>): seed study with <short list>`.

## Phase 2 — Create the GitHub repo and push

From inside the study dir:

```bash
gh repo create lossless-group/study-<slug> \
  --public \
  --description "<one-sentence framing of the study question>" \
  --source . \
  --remote origin \
  --push
```

Verify:
```bash
gh api repos/lossless-group/study-<slug> --jq '{url, default_branch, visibility}'
```

## Phase 3 — Wire into ai-labs as a single submodule

Working dir: `ai-labs/` (root).

- [ ] Remove the local copy so the submodule add can clone fresh from the
      remote you just pushed:
      ```bash
      cd /Users/mpstaton/code/lossless-monorepo/ai-labs
      rm -rf studies/<slug>
      ```
- [ ] Add as a submodule:
      ```bash
      git submodule add https://github.com/lossless-group/study-<slug>.git studies/<slug>
      ```
- [ ] Recursively initialize so the nested upstream submodules populate
      locally too (the submodule clone above only fetches the wrapper repo):
      ```bash
      git submodule update --init --recursive studies/<slug>
      ```
      This may take a while for large upstreams; don't poll, prefer
      `run_in_background` or a Monitor watching for `checked out` lines.

## Phase 4 — Update the index docs

- [ ] Append a one-line entry to `studies/README.md` under "Current
      studies" pointing at the new study with its question.
- [ ] If the study deserves prominent mention, add a short
      summary/why/why-it's-cool block to `ai-labs/README.md` under
      `## Studies`. Keep the tone of existing entries (terse, specific).

## Phase 5 — Stage but do not commit ai-labs

Default behavior: leave the new submodule pointer staged in ai-labs and
hand it back to the user for review. Only commit ai-labs when the user
explicitly asks.

When you do commit, **stage paths explicitly** — never `git add -A`:

```bash
git add .gitmodules studies/<slug> studies/README.md README.md
```

`git status` may show unrelated `m`-content modifications (lowercase, e.g.
`m investment-memo-orchestrator`) and untracked files (`?? ...`). Those
belong to the user's other in-flight work — do not stage them.

## Common pitfalls

- **Index lock collision.** `git submodule add` calls in parallel inside
  the same repo collide on `.git/modules/<repo>/index.lock`. Run them
  serially. (Adding submodules in *different* study repos in parallel is
  fine.)
- **Working directory drift.** Bash tool calls share a working directory
  across calls; if you `cd` into a study repo, later `gh` and `git`
  invocations will resolve to that repo. Use `git -C <path>` for clarity
  when operating across repos in one batch.
- **`.gitmodules` not auto-cleaned by `git rm --cached`.** Even though it
  *should* auto-stage the deletion, in practice you may need to edit
  `.gitmodules` by hand, then `git add .gitmodules`.
- **Relative submodule URLs (`../foo.git`).** Resolve relative to the
  *parent repo's* origin URL, not relative to the user's intent. For
  third-party upstreams, always use absolute URLs.
- **Recursive clone for downstream users.** After Phase 3, anyone cloning
  ai-labs needs `git clone --recurse-submodules` (or
  `git submodule update --init --recursive` post-clone) to pull through to
  the study's nested specs.
- **Studies-CLAUDE.md as guidance.** Re-read `studies/CLAUDE.md` for the
  norms about not auto-summarizing study contents into prose, not bumping
  pinned SHAs without being asked, and not treating a study as a project.

## Verification before handing back

- [ ] `gh repo view lossless-group/study-<slug>` shows the repo as public
      (or whatever was requested), default branch `main`.
- [ ] Roundtrip clone in `/tmp` succeeds:
      ```bash
      git clone --recurse-submodules \
        https://github.com/lossless-group/study-<slug>.git
      ```
      All nested upstreams check out cleanly.
- [ ] In ai-labs, `studies/<slug>/.git` is a *file* whose `gitdir:` points
      into `.git/modules/studies/<slug>/`.
- [ ] `git diff --cached --name-only` in ai-labs shows only the files you
      intended to stage (typically `.gitmodules`, `studies/<slug>`, plus
      any docs you edited).
- [ ] No unrelated files leaked into the staged set (no
      `.claude/settings.local.json`, no submodule pointer bumps for
      `investment-memo-orchestrator` or `memopop-ai`, etc.).

## When to skip steps

- **Tiny / exploratory study.** If the user just wants to "park a
  reference somewhere" and there's no clear question yet, push back. A
  study without a question rots fast. Prefer a single-line note in
  `studies/README.md` until the question crystallizes.
- **Already-promoted study.** If the study already exists as a
  `lossless-group/study-*` repo and you're just adding a reference, jump
  straight to: `cd` into the study dir → `git submodule add` → update its
  README → commit & push the study repo → update the ai-labs submodule
  pointer.

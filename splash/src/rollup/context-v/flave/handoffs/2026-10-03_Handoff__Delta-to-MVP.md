---
title: "Handoff — the delta to MVP, 2026-10-03"
lede: "Read this first if you're picking up flave. The editor works. The part that is the product, one document published to several audiences with proof nothing leaked, has no code yet. Here is that work, in order, with the decisions that gate it."
date_created: 2026-10-03
date_modified: 2026-10-03
date_authored_initial_draft: 2026-10-03
date_authored_current_draft: 2026-10-03
at_semantic_version: 0.0.0.1
status: Draft
publish: true
site_uuid: 9c37a7f8-4125-481f-afb1-b5a333bc849c
hex_code: sl98yo
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
summary: >-
  Session handoff at the point a second collaborator joins. States what is built,
  what the MVP is (§1.1's editor plus M2's audience claim), and the full work list
  for audience displays: the decisions that gate it, eight build steps with binary
  done-conditions, four design gaps that need answers before code, and three spec
  fixes. Evidence and longer reasoning live in the companion exploration
  The-MVP-Delta-and-Per-Audience-Versioning. Consumers: the next human or agent
  session choosing what to build.
tags:
  - Handoff
  - Flave
  - MVP
  - Audiences
  - Clearance
  - Versioning
from: "flave"
from_path: "context-v/handoffs/2026-10-03_Handoff__Delta-to-MVP.md"
---
# Handoff — the delta to MVP

> [!note] `handoffs/` is an experimental context-v folder
> It holds end-of-session state, so the next session (yours, a collaborator's,
> or an agent's) can resume without re-deriving it. The evidence behind
> everything here is in
> [[The-MVP-Delta-and-Per-Audience-Versioning]]: the tests run, the code read,
> and the spec sections quoted.

**Repo state:** `development`, `main`, and `master` all at `1940770`. Tests 69/69,
`pnpm prove` green, splash live with the new Collaborate docs.

## 🔴 Waiting on the owner

These gate the audience work. None is large; all are decisions only the spec
owner can make.

1. **Sign off on §1.1's v0 slices.** Precondition 3 of
   [[Phase-0-The-Live-Render-Loop]]. It has been open since 2026-08-20, while
   the work built on it shipped anyway.
2. **Settle what "v1" means.** The master spec uses it for two things: §1.1's
   small *"clearance and audiences"* step, and §13's *"v1 is M0–M8"*, nine
   milestones. §1.1 overrides §13, but §13 was never renumbered. Recommend
   renaming §1.1's tiers (MVP-editor / MVP-audiences) and adding one line to §13.
3. **Close D-21:** register is a fixed ladder (`verbatim` / `full` / `brief`).
   That is already the recommendation. Write down the case it can't express
   (see design gap D below) so the limit is a decision, not a surprise.
4. **Close D-13:** yes to the headless CLI. `flave publish --audience` *is* a
   CLI, so the MVP needs it either way.
5. **Close D-04:** an integer format version, needed the moment `flave.yaml`
   is read.
6. **Pick the clearance syntax.** The heading form in §11.1 does not work (see
   spec fix 1). Recommend directives only for the MVP.

## What the MVP is

Taking §1.1 as the scope contract: **the editor (v0) plus M2's claim**:

> *"I produce five levels from one document (private notes, transcript, team,
> LP, public), **none of which drift**, and I can **prove** the public one
> contains nothing private."*

| Half | State |
|---|---|
| **Editor** (§1.1 v0) | ✅ Mostly built. Slices 1, 2, 3, 5 done; slice 4 partial (one fixed `workspace/` folder, no picker, `flave.yaml` unread). Tauri runs on NixOS |
| **Audience displays** (§1.1 v1 / M2) | ❌ **No code.** Only the four `--color-clearance-*` tokens exist, unused |

## ★ The audience-display work

This is the known work, in the order it should happen.

### A. Build steps

Each step has a binary done-condition, in the style of §1.1's slices.
**Steps 1–5 are the "prove nothing private leaked" half** of M2, well specified
and small. **Step 8 is the "none of which drift" half** and needs design gap C
answered first. The two halves can ship separately.

| # | Step | Done when | Size |
|---|---|---|---|
| 1 | **Read `flave.yaml`**: `publish.audiences` as *(clearance, register, target)* triples; defaults when the file is absent | A fixture bundle loads its five audiences | S |
| 2 | **`selectAudience(tree, audience)`**: a pure MDAST → MDAST function. Clearance inherits down the tree; untagged blocks take the most restrictive declared clearance (**fail closed**); variants fall back `brief` → `full` → `verbatim`, never to empty | Unit tests: a `private` node never survives a `public` select; a missing `brief` falls back to `full` | M |
| 3 | **A publish render mode**: no `data-src-start` / `data-src-end`, no HTML comments, no other `data-*` scaffolding | The published snapshot contains no `data-` attributes | S |
| 4 | **`flave publish --audience X`** → `html-single` (Svelte SSR already works in the tests) | Five files from one fixture document | M |
| 5 | **The clearance scan**: for an artifact at clearance *C*, search the output bytes for the content of every block above *C*. Any hit fails the publish | Planting a private sentence in a public render fails the publish | S–M |
| 6 | **Audience picker in the editor preview**, rendering through the same `selectAudience` | Switching audience changes the preview, with no second code path | S |
| 7 | **A publish log**: audience, timestamp, source state, output hash, scan result, appended on every publish | "What did the LP get, and is it current?" is one lookup | S |
| 8 | **Derived variants and staleness**, after gap C is decided | Editing a `full` variant marks its derived `brief` stale, in the editor and in `flave publish` | M–L |
| — | **Dogfood gate** (§13) | A real document published to a real outside reader with the scan passing, **and** the bundle sent to a real collaborator who edits it | — |

### B. Design gaps: answer these before writing the affected code

**A — Publishing must not reuse the editor's render path.** *(Blocks step 2–4.)*
`FlaveMarkdown.svelte` renders an unregistered directive's children, so
`:::section{clearance=private}` shows its content in the editor today. That is
correct for editing and fatal for publishing. The rule from §11.1 becomes
concrete: **prune the MDAST before it reaches the renderer**; never render
everything and hide.

**B — Where published artifacts live.** *(Blocks step 4, 7.)*
§5.2 calls `.flave/cache/` disposable, so published files and the publish log
can't go there. Pick a path, e.g. `publish/<audience>/` plus
`publish/log.yaml`. Match the log's fields to the **structured change record**
that [[The-Flave-Document-Service-Not-A-Forge]] is waiting on, so that service
inherits it rather than redesigning it.

**C — How "derived" and "stale" actually work.** *(Blocks step 8.)*
§11.1 says derived variants record their source and go stale when it changes,
but not how. Open questions:
1. **Where the provenance lives.** Recommend inline:
   `:::variant{register=brief derived-from=full source-hash=…}`. It is the most
   legible to an agent; the cost is noisier diffs.
2. **What counts as a change.** Recommend a hash of the source variant's
   *normalized MDAST*, so re-wrapping a line doesn't flag everything stale.
3. **Granularity.** Per variant block, so the message can name the section.
4. **Who regenerates.** An agent, on request, showing a diff. Never automatic.

**Freeze this before anyone writes a derived variant.** §8.4's argument for
freezing block addressing early applies identically: retrofitting provenance into
existing documents is the migration that poisons a format.

**D — Two audiences, same register, different wording.** *(Informs D-21.)*
Team and LP might both be `full` but need different framing. The model's only
answer is to split the content by clearance, which conflates *who may see it*
with *how we say it*. That is exactly the fusion §11.1 forbids. Fine to accept
for the MVP; just record it when closing D-21.

### C. Spec fixes

1. **§11.1's heading syntax does not parse.** Tested on `@lossless-group/lfm`
   0.6.0: `## Unit economics {#unit-econ clearance=team}` stays literal heading
   text. The clearance is never applied, and `clearance=team` would be
   *published*. It fails open, which is the worst possible failure here.
   **Fix:** use directives (`:::section{clearance=…}`), which parse correctly
   today; add a lint that fails on `{…clearance=…}` left in any heading; treat
   heading attributes as an upstream LFM PR (the D-16 route), never a fork.
2. **§8.1 claims explicit `{#id}` heading ids win over derived ones.** Same
   cause, same result: false in LFM 0.6.0.
3. **§13's "v1 is M0–M8"** needs the clarifying line from owner item 2.

## Also open, not on the audience path

- **No codified browser drive.** Flagged in three changelog entries.
- **Phase 2** done conditions 4 (CSS token diagnostics while typing) and 5 (a
  second bundle sharing the theme).
- **Folder picker**, which finishes v0 slice 4.
- **Phase 1** (one operation set, four callers) serves M3/M4, not the MVP.
  Despite its name, it isn't next.
- **`theme.css` copies have drifted.** `splash/` gained container and gutter
  tokens on 2026-10-03; `apps/editor/` didn't. Harmless; resync when convenient.
- **Ubuntu getting-started path** is documented, not yet run on Ubuntu. Nix on
  non-NixOS is untested.

## Landed this session (2026-10-03)

- **Collaborate docs** on the splash: Getting Started for Linux/Ubuntu and for
  Nix, rendered through LFM. See `docs/getting-started/`.
- **`.envrc`** (`use flake`): with direnv, `cd flave` loads the devshell.
- **Floors, not pins**: flake uses `nodejs` / `pnpm`; CI uses pnpm latest and
  Node `lts/*`.
- **Splash:** Astro 7, astro-pagefind 2, LFM 0.6.0, and margins on the six
  reading pages that had none.
- **CI:** every Pages action moved to its Node 24 major.

## How to start

1. Get it running: `docs/getting-started/` (or the
   [Collaborate page](https://lossless-group.github.io/flave/collaborate/)).
2. Read §1.1 and §11.1 of
   [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]: about 400
   lines between them, and the whole audience model.
3. Read [[The-MVP-Delta-and-Per-Audience-Versioning]] for the evidence.
4. Pick up at **step 1** once owner items 3–6 are closed. Step 2 is the heart
   of it, and it is a pure function with no UI, so it is a good first change
   to make with an agent beside you.

## See also

- [[The-MVP-Delta-and-Per-Audience-Versioning]]: the analysis this hands off
- [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]: §1.1, §5.2, §8.1, §8.4, §11.1, §13, §14
- [[Phase-0-The-Live-Render-Loop]], [[Phase-2-The-Workspace-And-The-Files-Surface]]
- [[The-Flave-Document-Service-Not-A-Forge]]: the change record the publish log should match

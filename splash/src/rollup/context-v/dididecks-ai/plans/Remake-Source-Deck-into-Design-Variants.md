---
title: "Plan: Remake a source deck into N clean-room design variants"
lede: "The orchestrator plan. As VP Eng you extract a source deck, audit the extraction, fan out N clean-room designers, refactor each design into Astro sections, wire the registry, and prove every variant plays in the Scroll-UI shell."
publish: false
date_created: 2026-10-02
date_modified: 2026-10-02
date_authored_initial_draft: 2026-10-02
date_authored_current_draft: 2026-10-02
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Draft
tags:
  - Plan
  - Subagent-Orchestration
  - Deck-Iteration-Workflow
  - Scroll-UI
  - Clean-Room-Design
calls:
  - "[[Extract-Source-Deck]]"
  - "[[Audit-Source-Deck-Extraction]]"
  - "[[Design-Deck-Variant-as-Single-HTML]]"
  - "[[Refactor-HTML-Variant-into-Astro-Scroll-Sections]]"
  - "[[Verify-Variant-Plays-in-Scroll-Shell]]"
called_by: "[[Remake-Source-Decks-Queue]]"
prior_art: "client-sites/eventcut-ai (faithful + continuum / zero / hypercut, built by hand 2026-08)"
from: "dididecks-ai"
from_path: "context-v/plans/Remake-Source-Deck-into-Design-Variants.md"
---
# Plan: Remake a source deck into N design variants

> Variables and the filesystem contract: `context-v/prompts/README.md`
> Skills to load: `deck-iteration-workflow`, `astro-knots`, `theme-system`, `pseudomonorepos` (for commits)

## Your role

You are **VP Engineering and subagent orchestrator**. You don't extract,
design, or write Astro yourself. You brief subagents with the prompt files,
check their work against the gates below, and decide what happens next.
You personally own only four things: **the variables, the gates, the
shared-file edits (registry, dev server), and the final report.**

How to brief a subagent: tell it to read its prompt file, give it the
resolved values for every `{{VARIABLE}}`, and give it its own specific
values (`VARIANT_SLUG`, design seed). Don't paraphrase the prompt into the
brief; point at the file. Read the subagent's report and the files it
wrote; never take a "done" on faith.

## Step 0: Resolve the variables

1. Parse the variables the human passed in. If any **required** variable (`COMPANY`, `CLIENT_SITE`, `SOURCE_DECK`) is missing, ask once, listing all the missing ones together.
2. Check that `{{CLIENT_SITE}}` exists and has `src/pages/scroll/`. If it doesn't, stop and recommend `setup-new-dddecks-workspace`.
3. Fill in the defaults (see the README table). Derive `SOURCE_SLUG`.
4. Read `{{CLIENT_SITE}}/src/data/decks.ts`. Pick `N_VARIANTS` free variant slugs for `{{DECK_SLUG}}` (`v1…vN`, skipping any that are taken), plus `faithful` if `INCLUDE_FAITHFUL=true` and it's free.
5. Check `git status` in `{{CLIENT_SITE}}` and note the branch. Don't start on top of someone else's uncommitted work in the same files.
6. Print the resolved variable table back to the human in one block, then continue. Don't wait for confirmation unless something was ambiguous.

## Step 1: Extract (1 subagent)

Brief one subagent with [[Extract-Source-Deck]].

**Gate:** all five outputs exist, `slides.json` parses, and the slide count is plausible.

**Skip** this step if `src/content/source-decks/{{SOURCE_SLUG}}/slides.json` already exists *and* the narrative has an audit PASS noted. Re-running a variant fan-out shouldn't re-extract.

## Step 2: Audit (1 fresh subagent, never the extractor)

Brief a new subagent with [[Audit-Source-Deck-Extraction]].

- `FIX-AND-RECHECK` → send the punch list back to an extractor subagent (a fresh one with the extractor prompt and the punch list), then re-audit. **Maximum two rounds.** If it still fails after two rounds, stop and report to the human. Don't design on bad content.
- `PASS` → append `Audited: PASS (YYYY-MM-DD)` to the narrative's provenance section, and carry the open client flags forward into the final report.

## Step 3: Design (N subagents, in parallel, isolated from each other)

Write N **design seeds** before spawning anything. A seed is one sentence of
creative direction, and the seeds must differ on at least two axes (tone,
type, density, light versus dark, which slide is the hero, how the story is
structured). For example:

- `v1`: "Editorial magazine: serif display, generous white space, the problem told as a long-form opener."
- `v2`: "Dark and data-forward: the market and traction numbers are the heroes, with big-number moments."
- `v3`: "Product-led: open on the product in action, and let every later slide hang off that image."

In each designer's brief, name the brand source explicitly when `BRAND_POLICY=client-brand`: `DESIGN.md` if it exists, otherwise the extraction's observed palette. Use `theme.css` only after confirming it styles the deck and not the hub.

Spawn all N designers **in one message**, so they run concurrently, each with
[[Design-Deck-Variant-as-Single-HTML]], its own `VARIANT_SLUG`, its own
seed, and **its own `SCRATCH_DIR`** (`<session scratchpad>/<VARIANT_SLUG>/`).
Subagents share the session scratchpad by default, so without separate
folders one designer's screenshots leak into another's clean room. Never pass one designer's seed, output, or report to another. If
`INCLUDE_FAITHFUL=true`, spawn one more designer with the seed "faithful:
rebuild the source layout from `layout.md`, design-only redo", and lift the
`layout.md` restriction for that designer only.

**Gate, per variant:**

- The file exists, and its `<section>` count matches the reported slide list.
- Fact check: sample at least 5 numbers from the HTML and find each one in `slides.json` or a CSV. **Any invented fact fails the variant.** Send the specific lines back to the same designer.
- Divergence check: open all N drafts side by side. If two variants are close (same layout skeleton, same palette mood), send the later one back with a sharper seed. N near-identical decks is a failed fan-out.

## Step 4: Refactor to Astro (N subagents, parallel)

For each variant that passed, brief a subagent with
[[Refactor-HTML-Variant-into-Astro-Scroll-Sections]]. These can run
concurrently because each writes only under its own `{{VARIANT_SLUG}}/` folders.

Tell each subagent that its siblings are running in parallel, so it runs
`astro check` only and skips `pnpm build`.

**Gate:** once all N are done, run `pnpm exec astro check && pnpm build` yourself,
once. Route any errors back to the owning variant's subagent.

## Step 5: Wire the registry (you, once)

Using the `VariantRef` and `SlotRef[]` each refactor subagent returned:

1. Add each `VariantRef` to `{{DECK_SLUG}}`'s `variants` array in `src/data/decks.ts`. Create the deck entry first if it doesn't exist (with a thumbnail at `public/thumbs/{{DECK_SLUG}}.svg`; a plain placeholder is fine).
2. Add each variant's `SlotRef[]` to `SLOTS` in `src/data/slides.ts`.
3. `pnpm build` again.

## Step 6: Verify in the shell (N subagents, parallel)

Start **one** dev server yourself (`pnpm dev` in `{{CLIENT_SITE}}`, in the
background), and pass its URL as `BASE_URL`.

Log in once, because the deck routes are gated: POST the site's
`VIEWER_PASSCODE` from its `.env` to `/api/access/verify` as form fields
`passcode` and `redirect=/`, saving cookies to a jar in your scratch
directory. Don't echo the value into the transcript:

```bash
set -a; . ./.env; set +a
curl -s -o /dev/null -c "$JAR" -H "Origin: $BASE_URL" -X POST --data-urlencode "passcode=$VIEWER_PASSCODE" -d redirect=/ "$BASE_URL/api/access/verify"   # without Origin, Astro's CSRF check returns 403
curl -s -o /dev/null -w '%{http_code}' -b "$JAR" "$BASE_URL/scroll/"   # expect 200, not 302
```

If `.env` or the passcode is missing, verify can only reach `PARTIAL`. Say so.
Pass the jar path as `COOKIE_JAR`, and brief one subagent per variant with
[[Verify-Variant-Plays-in-Scroll-Shell]].

- `FAIL` → route each defect to a refactor subagent for that variant (the design isn't the problem), then re-verify. **Maximum two rounds per variant.**
- `PARTIAL` (no browser available) is acceptable. Say so plainly in the report; don't call it a pass.

Stop the dev server when you're done. On Astro 7, `astro dev` daemonizes, so stop it with `pnpm exec astro dev stop`, not by killing the shell.

## Step 7: Commit and report

1. Commit inside `{{CLIENT_SITE}}` per `git-conventions`. Commit the extraction and the variants separately (two commits). Don't commit `inputs/`. Don't bump the parent submodule pointer mid-session; that happens once, at wrap-up.
2. Report to the human:

```text
{{COMPANY}} · {{DECK_SLUG}} · {{N_VARIANTS}} variants

Extraction: <n> slides, audit PASS (round <k>), <n> client flags
Variants:
  v1 "<label>": <concept>       /scroll/{{DECK_SLUG}}/v1/   verify: PASS
  v2 ...
Placeholders needing client input: <list>
Open client flags: <list>
Not done: <anything skipped, with the reason>
Next: a human picks a favorite on /scroll/{{DECK_SLUG}}/, ranks slides in the TOC, then Play-UI conversion.
```

## Failure rules

- Any gate that fails twice → stop that branch and report it. Don't loop forever. The rest of the variants keep going.
- Never "fix it yourself" by writing design or Astro in the orchestrator context. Brief a subagent. Your context is for judgment.
- Never edit `inputs/` or another variant's folders.

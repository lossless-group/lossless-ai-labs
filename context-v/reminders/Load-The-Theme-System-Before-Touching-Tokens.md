---
title: "Load the theme system before touching tokens"
lede: "Three layers, two axes, three modes. And the ai-labs palette is augment-it's — not the shared-styles package nothing renders."
publish: true
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: Active
site_uuid: 3a55eb14-9c1f-4e7a-8f2d-4b0c5e9a7d61
hex_code: q7m2vd
tags:
  - Reminder
  - Design-System
  - Theme-System
  - AI-Labs
---

# Load the theme system before touching tokens

**Before writing or renaming a single design token in any ai-labs app, load the
`theme-system` skill and read
`astro-knots/context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md`.**

Do not reverse-engineer the convention from whichever app you happen to be
reading. augment-it's `DESIGN.md` is an *elaboration* of the house system, with
its own federation vocabulary on top. Taking it as the source produces something
that is nearly right and wrong in the ways that matter.

## What the house system actually says

| | |
|---|---|
| **Three layers** (§2.3) | named palette → theme bindings → consumers |
| **Two tiers of token** (§2.1) | `--color__magenta-electric` (raw, `__`) → `--color-accent` (role, `-`) |
| **`--fx-*` is semantic tier** (§9.2) | an effect, not a third naming layer |
| **Two axes** | `data-theme` = which brand · `data-mode` = light / dark / vibrant |
| **Three modes, never two** (§1) | and **vibrant is dark-based** — the named classic error is letting it inherit light's white background |
| **Font roles are descriptive** (§2.4) | `--font-body`, `--font-code`, `--font-reading` — not `--font-sans` / `--font-mono` |

Collapsing `data-theme` into `data-mode` is the easy mistake. It costs nothing
until a second brand exists, and then it costs everything.

## The palette is augment-it's

**`memopop-ai/packages/shared-styles` is not the family brand. Nothing renders
it.** memopop-native does not import it despite its CLAUDE.md saying it does —
it draws violet (`#5b21b6`, `#a855f7`) out of ~700 hardcoded literals and two
locally-reinvented token sets. augment-it draws electric magenta `#c75bfb`. Both
live surfaces are one violet-magenta family; shared-styles is a fourth palette
nothing paints.

Source colour from `augment-it/packages/theme/theme.css`. It is the most
built-out surface in the tree and the only palette here with a contrast pass
behind it.

**Converging the didi.sh brand onto that palette is separate, deliberate work.**
It is not something to do as a side effect of restyling an app — which is what
the `data-theme` axis exists to keep possible.

## Renaming tokens changes nothing visible

Obvious in hindsight, and worth stating because it was reported as convergence:
a rename is invisible by construction. If the ask is "make it look like the
family," the deliverables are the base face, the borders, the density and the
palette. The vocabulary is worth fixing too — it is what lets a component move
between repos — but it is bookkeeping, and it must not be described as a
visual result.

## Render it before claiming it

Headless Chrome against a fixture page carrying the real `tokens.css` and the
real markup costs about a minute and needs no backend:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --force-device-scale-factor=2 --window-size=1180,900 \
  --screenshot=/tmp/dark.png file:///tmp/harness/dark.html
```

That found a defect three careful readings did not: in the dark palette
`--color__graphite-800` and `-700` are the same hex, so every card drawn as
`border: 1px solid var(--color-border)` over `var(--color-surface)` painted
nothing. It is augment-it's open gate **A22**, and it travels with the palette.

## Related

- [[Check-The-Substrate-Before-Reasoning-On-Top-Of-It]] — same failure shape, one layer down
- `corpora-builder/app/DESIGN.md` — a worked local example
- `corpora-builder/app/scripts/design-drift.mjs` — the five rules as checks

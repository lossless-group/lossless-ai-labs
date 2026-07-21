---
name: theme-system
description: The Lossless Group's theme and mode architecture — two-tier token system, three-mode contract (light/dark/vibrant), theme.css organization, and design system conventions. Use when setting up themes/modes for any Astro Knots site, debugging mode toggles, working with CSS tokens, or when the user mentions "vibrant mode", "two-tier tokens", "theme.css", or design system patterns.
from: "dididecks-ai"
from_path: "context-v/agent-skills/theme-system/SKILL.md"
---
# Theme System

The Lossless Group's firm-wide conventions for theme architecture, visual modes, and design token systems.

**Status:** Initial scaffold (May 2026) — actively developing from astro-knots patterns.

## When to use this skill

- Setting up theme/mode architecture for a new site
- Debugging mode toggle issues (light/dark/vibrant not working)
- Implementing two-tier token systems
- Deciding between `theme.css` vs `global.css` organization
- Creating `/brand-kit` or `/design-system` reference pages
- User mentions "vibrant mode", "two-tier tokens", "mode switcher", "theme architecture"

## Core Principles (WIP)

### 1. Three-Mode Contract (Not Two)

Every Lossless site ships with **three modes**, not two:

- **Light** — clean, minimal, high readability
- **Dark** — code-editor feel, moderate intensity
- **Vibrant** — neon energy, loud gradients, glassmorphic surfaces

**Why three?** Stakeholder management. Nerds pick dark, traditionalists pick light, design-forward stakeholders pick vibrant. The toggle ends the "which mode" argument before it starts.

**Critical:** Vibrant mode is **dark-based** (like dark mode, not light mode). Common error: vibrant inherits light mode's white background. See `references/vibrant-mode-implementation.md` (TBD).

### 2. Two-Tier Token System

Tokens come in **two tiers**:

- **Tier 1: Named tokens** (`--color__blue-azure`, `--font__lato`)
  - Raw values, BEM-ish `__` separator
  - Private to the theme (components don't read these directly)
- **Tier 2: Semantic tokens** (`--color-primary`, `--font-body`)
  - Kebab-case, what Tailwind utilities and components consume
  - Reference named tokens via `var()`

**Why two tiers?** Client iteration. When a client wants a different primary color, you add/change a named token and re-point the semantic token. Components don't change.

See `references/two-tier-tokens.md` (TBD).

### 3. File Organization

- **`theme.css`** — all token definitions (named + semantic), mode blocks
- **`global.css`** — imports `@tailwindcss`, imports `theme.css`, base resets

See `references/file-organization.md` (TBD).

## Cross-skill ties

- **`astro-knots`** — this skill extracts patterns from astro-knots sites
- **`context-vigilance`** — `/brand-kit` and `/design-system` pages follow doc conventions

## Canonical References

Sites with strong implementations:

- **`sites/fullstack-vc`** — vibrant mode reference (lines 90-130 of `theme.css`)
- **`sites/hypernova-site`** — canonical mode switcher utilities
- **`sites/reach-edu-hub`** — most recent setup (May 2026) following corrected patterns

## What's Not Here Yet (TBD)

This skill is actively under development. Planned content:

- [ ] `references/vibrant-mode-implementation.md` — full guide to dark-based vibrant mode
- [ ] `references/two-tier-tokens.md` — deep dive on token architecture
- [ ] `references/file-organization.md` — theme.css vs global.css vs utilities
- [ ] `references/mode-switcher-utilities.md` — JS utilities pattern
- [ ] `references/brand-kit-page.md` — required sections and patterns
- [ ] `references/design-system-page.md` — component catalog conventions
- [ ] Templates for common token sets (minimal, comprehensive)

## Development Notes

This skill is being extracted from:
- `astro-knots/context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md`
- `astro-knots/context-v/prompts/New-Site-Quickstart-Guide.md` §6
- `astro-knots/references/playbooks/new-site-setup.md` §8-9
- Live implementations in `sites/fullstack-vc`, `sites/hypernova-site`, `sites/reach-edu-hub`

Content will be migrated and refined incrementally. For now, cross-reference those sources.

## See also

- Astro Knots blueprint: `astro-knots/context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md`
- Design system maintenance: `astro-knots/context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions.md`

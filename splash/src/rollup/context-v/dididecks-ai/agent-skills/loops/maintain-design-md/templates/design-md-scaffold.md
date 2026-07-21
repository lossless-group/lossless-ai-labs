---
# ─── DESIGN.md scaffold ────────────────────────────────────────────────
# Drop this file at the root of a Lossless project. Fill in the
# ★-marked fields with the project's actual values (read from the
# runtime CSS — do NOT invent). Delete the placeholder comments once
# the file is real. The eight prose sections below must appear in this
# canonical order; sections can be omitted but never reordered.
#
# Spec reference: https://github.com/google-labs-code/design.md
# Lossless reference implementation: content-farm/splash/DESIGN.md

version: alpha
name: ★ Project Name — Design Variant         # e.g. "Reach Edu Hub — Astro Knots Dark"
description: >-
  ★ One paragraph describing the visual identity. Mention the runtime
  source-of-truth path so future agents know where to read the actual values.

# ─── Colors ──────────────────────────────────────────────────────────
# Map every CSS custom property in the runtime `:root` block. Standard
# names (recommended, not required): primary, secondary, tertiary,
# neutral, surface, on-surface, error.
colors:
  # ★ Surfaces (backgrounds, tonal layers)
  surface-base: "#XXXXXX"
  surface-elevated: "#XXXXXX"
  surface-card: "#XXXXXX"

  # ★ Brand accents
  primary: "#XXXXXX"
  primary-soft: "#XXXXXX"
  accent: "#XXXXXX"

  # ★ Text on surfaces
  on-surface: "#XXXXXX"
  on-surface-soft: "#XXXXXX"
  on-surface-dim: "#XXXXXX"

  # ★ Borders
  border: "#XXXXXX"
  border-strong: "#XXXXXX"

# ─── Typography ──────────────────────────────────────────────────────
# Most systems define 9–15 levels. Standard names: display-lg/md/sm,
# headline-lg/md/sm, body-lg/md/sm, label-lg/md/sm. Pick what the
# project actually uses.
typography:
  display-hero:
    fontFamily: ★ FontFamilyName
    fontSize: ★Xrem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: ★ FontFamilyName
    fontSize: ★Xrem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  body-md:
    fontFamily: ★ FontFamilyName
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  # ...add the rest of the levels the project actually defines

# ─── Rounded (corner radii) ──────────────────────────────────────────
rounded:
  sm: ★Xpx
  md: ★Xpx
  lg: ★Xpx
  xl: ★Xpx
  full: 9999px

# ─── Spacing scale ───────────────────────────────────────────────────
# Mix of rem-anchored scale entries and layout-named tokens.
spacing:
  base: 1rem
  "2": 0.5rem
  "4": 1rem
  "6": 1.5rem
  "8": 2rem
  "12": 3rem
  "16": 4rem
  container-max: 1200px
  container-padding: 24px
  gutter: 16px

# ─── Components ──────────────────────────────────────────────────────
# Each reusable component in src/components/ should have an entry here.
# Use {token-references} so values stay in sync.
components:
  # ★ Add entries for the project's actual components — examples below
  # are placeholders only.
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-base}"
    rounded: "{rounded.full}"
    padding: "12px 22px"
  card-default:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.6}"

# ─── Off-spec extensions (optional) ───────────────────────────────────
# Project-specific extension blocks live here. Spec-compliant consumers
# preserve unknown frontmatter keys per the Stitch spec's Consumer
# Behavior table. Known Lossless extensions:
#
#   imagery:   — Ideogram OG-image recipe (owned by `generate-consistent-og-images` skill)
#   modes:     — light/dark/vibrant mode variants (owned by `theme-system` skill)
#   icons:     — icon stroke conventions, icon set roster
from: "dididecks-ai"
from_path: "context-v/agent-skills/loops/maintain-design-md/templates/design-md-scaffold.md"
---
# ★ Project Name — Design System

> The runtime source of truth is `★ src/path/to/theme-or-base-layout.css`.
> This document is the human- and agent-readable contract that explains
> intent. Keep the two in sync when either changes.

## Brand & Style

★ Describe the project's *emotional* register. Playful or professional?
Dense or spacious? What metaphors recur? What's the build-in-public
posture? What does an agent need to know to make a stylistic decision
that *feels like this project* when no specific rule covers the case?

## Colors

★ Prose explanation of the palette. Why these colors? How does each
signal (primary = the action, accent = noteworthy)? How are borders
tiered (default / strong / accent)? What's the relationship between
surface tones?

## Typography

★ Why this family or families? What does each cue? What's the
reading-width convention? Are headlines mono or sans?

## Layout & Spacing

★ Container model (fixed-max / fluid / grid)? Vertical rhythm rule?
Grid-gap conventions? Centering convention (explicit margin-inline /
margin shorthand)?

## Elevation & Depth

★ Flat or shadow-heavy? What signals "higher in the stack" — tonal
layers, borders, shadows, blur? Where is glow / shadow reserved?

## Shapes

★ Rounded scale assignments — what kinds of elements get which radius?
Border conventions? Icon stroke / fill conventions?

## Components

★ One subsection per reusable component. Each should answer: what it
looks like, what props/variants exist, what scope-specific overrides
are documented, and any cross-component contracts (e.g. "the footer's
GitHub icon shares its 36×36 round shape with the share button").

### ★ ComponentName

★ Prose for this component.

## Do's and Don'ts

★ Hard rules distilled from prior mistakes. Each bullet should pair the
rule with its *why* (or a brief incident reference) so the next agent
knows whether the rule still applies to a new edge case. Add a bullet
whenever a visual mistake gets corrected.

- **Do** ...
- **Don't** ...

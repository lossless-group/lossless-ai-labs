---
title: "Three-Modes Derivation for chroma-decks"
lede: "How light / dark / vibrant get derived from Chroma's light-only brand. Captures the value choices, why we made them, and the dramatic-lean posture the user picked. Canonical reference: astro-knots/sites/fullstack-vc/src/styles/theme.css and the theme-system skill."
date_created: 2026-05-11
date_modified: 2026-05-11
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.1.0
tags:
  - Theme-System
  - Three-Modes
  - Chroma
  - Token-Derivation
  - Dramatic-Lean
status: Draft
from: "dididecks-ai"
from_path: "context-v/blueprints/Three-Modes-Derivation.md"
---
# Three-Modes Derivation for chroma-decks

> Chroma's brand is **light-mode only.** Dark and vibrant don't exist upstream. We improvise from the existing palette, respecting the **warm-black brand character** (`#27201c`, not `#0a0a0a`). User's directive: **go dramatic, unleashed.**

## Canonical anchors

- **theme-system skill** — three-mode contract, two-tier tokens, `--fx-*` effect tokens, "**vibrant is dark-based, not light-based**" (critical anti-pattern).
- **`astro-knots/sites/fullstack-vc/src/styles/theme.css`** — reference implementation. We adapt its structure (`.theme-*` wrapper class, per-mode `[data-mode="..."]` blocks, `--fx-*` intensity dials, Tailwind v4 `@theme {}` exposure, `.theme-transition` smoothing).
- **`astro-knots/sites/fullstack-vc/src/utils/mode-switcher.js` + `ModeToggle.astro`** — the switcher utility and component pattern we port.

## What changes per-mode (the intensity dial)

Per the canon, **mode is more than a color swap.** Each mode owns:

| Dimension | Light | Dark | Vibrant |
|---|---|---|---|
| Surface palette | white-on-near-white | warm-black-on-cream | deeper-warm-black + orange-tinted surfaces |
| `--fx-glow-opacity` | 0.06 (minimal) | 0.22 (moderate) | 0.55 (max) |
| `--fx-glow-spread` | 8px | 24px | 48px |
| `--fx-headline-gradient` | subtle 2-stop warm hint | 2-stop warm sweep | 3-stop warm-to-teal sweep |
| Card shadow | drop shadow only | ring + drop | orange-glow + ring |
| Border accents | neutral-90 | warm-border | chroma-orange direct |
| Mental register | dev-doc clean | warm studio | neon DD lab |

## Tier 1 — Named tokens (raw palette)

Already extracted from trychroma.com production CSS (see `Chroma-Brand-and-Deck-Notes.md`):

```
--color__white               #ffffff
--color__sidebar-white       #fafafa
--color__neutral-95          #f5f5f5
--color__neutral-90          #e5e5e5
--color__neutral-60          #a1a1a1
--color__neutral-45          #737373
--color__neutral-10          #171717
--color__neutral-05          #0a0a0a
--color__chroma-black        #27201c   warm brand "black" — load-bearing
--color__chroma-orange       #f05100   primary brand accent
--color__chroma-teal         #009588   secondary accent
--color__chroma-ocean        #104e64   tertiary
--color__chroma-amber        #fcbb00   quaternary
--color__chroma-orange-soft  #f99c00
--color__destructive         #df2225
```

**Additions to support dark + vibrant** (these are "things we have" now, not invented decorations):

```
--color__chroma-shadow       #1a1410   even-darker warm black (vibrant background)
--color__chroma-cream        #fbf8f1   warm near-white (dark/vibrant foreground)
--color__chroma-cream-muted  #d4cfc2   warm muted text on dark surfaces
--color__chroma-border-warm  #3a312b   warm border for dark/vibrant surfaces
```

Total Tier 1 named tokens: 15 (existing) + 4 (new) = 19. Held to discipline — we only add what's required for the modes to exist.

## Tier 2 — Cross-mode brand layer (`.theme-chroma`)

Tokens that **stay the same across modes** — the "this is Chroma" layer:

```
--color-primary              var(--color__chroma-black)
--color-accent-1             var(--color__chroma-orange)
--color-accent-2             var(--color__chroma-teal)
--color-accent-3             var(--color__chroma-ocean)
--color-destructive          var(--color__destructive)
--color-status-active        var(--color__chroma-teal)
--color-status-attention     var(--color__chroma-orange)

--font-display               var(--font__inter)
--font-body                  var(--font__inter)
--font-mono                  var(--font__ibm-plex-mono)
```

## Mode: light (defensible, current)

Clean dev-doc register. The values we already have, formalized.

```
--color-background           var(--color__white)
--color-surface              var(--color__neutral-95)
--color-text                 var(--color__neutral-05)
--color-text-muted           var(--color__neutral-45)
--color-border               var(--color__neutral-90)

--fx-glow-opacity            0.06
--fx-glow-spread             8px
--fx-card-shadow             0 1px 3px rgba(39, 32, 28, 0.06), 0 1px 2px rgba(39, 32, 28, 0.04)
--fx-card-shadow-hover       0 4px 12px rgba(39, 32, 28, 0.08)
--fx-card-bg                 var(--color__white)
--fx-card-border             var(--color__neutral-90)
--fx-card-border-hover       var(--color__chroma-black)
--fx-headline-gradient       linear-gradient(120deg, var(--color__chroma-black) 0%, var(--color__chroma-orange) 100%)
--fx-flare-color             var(--color__chroma-orange)
```

## Mode: dark (dramatic — "warm studio")

Warm brand-black is the surface. Cream is the text. Orange/teal accents stay; their meaning doesn't change. The character is **a darkroom with warm lamps**, not a code editor.

```
--color-background           var(--color__chroma-black)
--color-surface              color-mix(in srgb, var(--color__chroma-orange) 4%, var(--color__chroma-black))
--color-text                 var(--color__chroma-cream)
--color-text-muted           var(--color__chroma-cream-muted)
--color-border               var(--color__chroma-border-warm)

--fx-glow-opacity            0.22
--fx-glow-spread             24px
--fx-card-shadow             0 0 0 1px var(--color__chroma-border-warm), 0 4px 14px rgba(0, 0, 0, 0.45)
--fx-card-shadow-hover       0 0 0 1px var(--color__chroma-orange), 0 8px 24px rgba(240, 81, 0, 0.18)
--fx-card-bg                 color-mix(in srgb, var(--color__chroma-orange) 4%, var(--color__chroma-black))
--fx-card-border             var(--color__chroma-border-warm)
--fx-card-border-hover       var(--color__chroma-orange)
--fx-headline-gradient       linear-gradient(135deg, var(--color__chroma-orange), var(--color__chroma-amber))
--fx-flare-color             var(--color__chroma-orange)
```

**Why this is dramatic and not safe:** the *background itself is the brand black* — not a neutral dark gray, not a graphite, not pure black. Few sites commit to a warm-black background. Chroma's identity demands it.

## Mode: vibrant (dramatic — "neon DD lab")

**Dark-based per the skill canon.** Deeper warm-shadow background (a notch below dark). Surfaces tinted orange via `color-mix`. Headlines run a three-color sweep. Glows are large and saturated. Borders are orange direct.

```
--color-background           var(--color__chroma-shadow)
--color-surface              color-mix(in srgb, var(--color__chroma-orange) 14%, var(--color__chroma-shadow))
--color-text                 var(--color__chroma-cream)
--color-text-muted           color-mix(in srgb, var(--color__chroma-orange) 30%, var(--color__chroma-cream))
--color-border               var(--color__chroma-orange)

--fx-glow-opacity            0.55
--fx-glow-spread             48px
--fx-card-shadow             0 0 0 1px color-mix(in srgb, var(--color__chroma-orange) 60%, transparent),
                             0 0 24px color-mix(in srgb, var(--color__chroma-orange) 35%, transparent)
--fx-card-shadow-hover       0 0 0 1px var(--color__chroma-teal),
                             0 0 36px color-mix(in srgb, var(--color__chroma-teal) 55%, transparent)
--fx-card-bg                 color-mix(in srgb, var(--color__chroma-orange) 12%, var(--color__chroma-shadow))
--fx-card-border             color-mix(in srgb, var(--color__chroma-orange) 70%, transparent)
--fx-card-border-hover       var(--color__chroma-teal)
--fx-headline-gradient       linear-gradient(
                               120deg,
                               var(--color__chroma-amber) 0%,
                               var(--color__chroma-orange) 45%,
                               var(--color__chroma-teal) 100%
                             )
--fx-flare-color             var(--color__chroma-amber)
```

**The dramatic moves:**
- **Background is warmer + deeper** than dark mode (`#1a1410` vs `#27201c`). The eye reads it as "the dark lab one step further."
- **Surfaces are visibly orange-tinted** (14% orange-mixed into shadow). Card surfaces glow with subtle warmth even before any `--fx-*` effects apply.
- **Headlines do a warm-to-cool sweep** through Chroma's actual chart palette — amber → orange → teal. This is *the* signature visual of vibrant mode. Every section header is a small light show.
- **Borders are orange direct.** No gray softening. The frame is the color.
- **Hover transitions from orange to teal**, exploiting Chroma's two-accent system.

## Mode switching mechanism

Port `mode-switcher.js` + `ModeToggle.astro` from fullstack-vc. Three buttons (sun / moon / star) cycle light → dark → vibrant. Mounts to top-right of every page (or just `/scroll/pitch/` for v0.1 if we want it contained). Persists choice in `localStorage`. Honors `prefers-color-scheme` on first visit. Dispatches `mode-change` event for other listeners.

**For v0.1 placement:** include the toggle on every page so dev-time iteration is easy. We can hide it for production-shipped slides later by gating on an env flag or a route check.

## What ships in this round

1. New Tier 1 tokens added to `theme.css` (4 new named).
2. `.theme-chroma` cross-mode brand layer.
3. Three `[data-mode="..."]` blocks (light, dark, vibrant) with full `--fx-*` token sets.
4. Tailwind v4 `@theme {}` exposure block.
5. `.theme-transition` class for smooth switching.
6. `src/utils/mode-switcher.js` (ported, namespace-clean).
7. `src/components/basics/ModeToggle.astro` (ported, three icons sized for chroma-decks).
8. Toggle wired into `/`, `/scroll/`, `/scroll/pitch/`, `/play/` chrome.
9. `--fx-headline-gradient` applied to the cover `<h1>` and section `<h2>` in `/scroll/pitch/` so the mode swap has a visible signature.
10. `data-mode="light"` set as a sensible default in the no-JS path (still progressively enhanced by the switcher).

## Out of scope (this round)

- A `/brand-kit` reference page showing all tokens. Comes later — `maintain-design-md` and `maintain-splash-pages` skills both call for it eventually.
- A `/design-system` component catalog. Same — later.
- Per-deck mode lock (some decks always present in dark, etc.). Defer until a real use case appears.

## Acceptance signal

Spin `pnpm run dev`, navigate to `/scroll/pitch/`, click the toggle three times. Each mode should feel *meaningfully different* — not just darker/lighter. The headline gradient is the tell: subtle → warm sweep → multi-color sweep.

If vibrant feels merely *darker than dark*, it has failed. It should feel **louder**.

---
version: alpha
name: AI-Labs Splash — Bench (Astro Knots · mono-forward)
description: >-
  Design system for the ai-labs pseudomonorepo splash. Instrumented, bench-feeling
  surface with a blueprint-grid backdrop, mono-forward typography, sodium-amber
  primary, electric-cyan trace, and plum-magenta signal. Default mode is dark
  ("bench"); light ("field notebook") and vibrant ("signal / demo") are first-
  class. Tokens mirror the CSS custom properties in `src/styles/theme.css` —
  that file is the runtime source of truth; this DESIGN.md is the human- and
  agent-readable contract.

# ─── Colors ────────────────────────────────────────────────────────────
colors:
  # Tier 1 — named (raw values, mode-invariant). These are not consumed by
  # components directly; they're the inputs to the semantic tier below.

  # Brand spine — instrument-panel signal hues.
  sodium: "#ffb733"               # accent · amber LED
  sodium-deep: "#c98a1a"
  sodium-soft: "#ffd684"
  cyan-trace: "#5cc8ff"           # thread · oscilloscope trace
  cyan-deep: "#1c8fc9"
  cyan-soft: "#b5e4ff"
  plum: "#d96fff"                 # signal · pop accent
  plum-deep: "#9a3cc2"
  plum-soft: "#f0bdff"

  # Bench neutrals — the ink/paper axis. Harder-edged than lfm's warm cream.
  ink-bench: "#0a0e14"            # body bg in dark mode
  ink-deeper: "#050709"           # vibrant bg + code surface
  ink-1: "#0e1219"
  ink-2: "#141923"
  ink-3: "#1c2330"
  ink-4: "#2a3140"

  steel-100: "#e6ebf2"
  steel-200: "#c9d2dd"
  steel-300: "#a3aebd"
  steel-400: "#7a8597"
  steel-500: "#5a6477"
  steel-600: "#3e4658"
  steel-700: "#2a3140"

  paper: "#f4f1ea"                # field-notebook cream (light mode bg)
  paper-soft: "#ebe6d8"
  paper-deep: "#dcd5c0"

  # Tier 2 — semantic. These are what components read. Rebound per
  # <html data-mode>; values below are the dark-mode (default) bindings.
  bg: "{colors.ink-bench}"
  bg-soft: "{colors.ink-1}"
  bg-elevated: "{colors.ink-2}"
  bg-card: "{colors.ink-3}"        # rendered at 86% alpha at runtime
  bg-code: "{colors.ink-deeper}"

  text: "{colors.steel-100}"
  text-soft: "{colors.steel-200}"
  text-dim: "{colors.steel-400}"
  text-dimmer: "{colors.steel-500}"
  text-faint: "{colors.steel-600}"

  accent: "{colors.sodium}"
  accent-soft: "{colors.sodium-soft}"
  accent-deep: "{colors.sodium-deep}"

  thread: "{colors.cyan-trace}"
  thread-soft: "{colors.cyan-soft}"
  thread-deep: "{colors.cyan-deep}"

  signal: "{colors.plum}"
  signal-soft: "{colors.plum-soft}"
  signal-deep: "{colors.plum-deep}"

  border: "#e6ebf2"                # rendered at 8% alpha at runtime
  border-strong: "#e6ebf2"         # rendered at 18% alpha
  border-accent: "{colors.sodium}" # rendered at 36% alpha

# ─── Typography ────────────────────────────────────────────────────────
# Three families. The defining move vs. sibling splashes is that JetBrains
# Mono is the *dominant* family for eyebrows, metadata, labels, status pills,
# and any number/identifier — not just for code. Space Grotesk handles display
# (h1/h2); Inter Tight handles body prose.
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 4rem               # clamp(2.4rem, 5.6vw, 4rem) at top end
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: -0.02em
  display-h2:
    fontFamily: Space Grotesk
    fontSize: 2.4rem             # clamp(1.6rem, 3vw, 2.4rem)
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: -0.02em
  display-h3:
    fontFamily: Space Grotesk
    fontSize: 1.2rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  lede:
    fontFamily: Space Grotesk
    fontSize: 1.25rem            # clamp(1.05rem, 1.4vw, 1.25rem)
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: Inter Tight
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  eyebrow:
    fontFamily: JetBrains Mono
    fontSize: 0.72rem
    fontWeight: 500
    letterSpacing: 0.18em
  label:
    fontFamily: JetBrains Mono
    fontSize: 0.68rem
    fontWeight: 500
    letterSpacing: 0.14em
  meta:
    fontFamily: JetBrains Mono
    fontSize: 0.78rem
    fontWeight: 400
    letterSpacing: 0.04em
  mono-pill:
    fontFamily: JetBrains Mono
    fontSize: 0.7rem
    fontWeight: 500
    letterSpacing: 0.08em
  code:
    fontFamily: JetBrains Mono
    fontSize: 0.92em
    fontWeight: 400

# ─── Rounded — squarer than lfm; bench cards feel cut, not poured ──────
rounded:
  sm: 2px
  md: 3px
  lg: 5px
  full: 999px

# ─── Spacing — invariant ───────────────────────────────────────────────
spacing:
  "1": 0.25rem
  "2": 0.5rem
  "3": 0.75rem
  "4": 1rem
  "5": 1.25rem
  "6": 1.5rem
  "8": 2rem
  "10": 2.5rem
  "12": 3rem
  "16": 4rem
  "20": 5rem
  "24": 6rem
  # Blueprint-grid step sizes — drive the body::before grid overlay.
  grid-step-fine: 8px
  grid-step: 32px
  # Layout container max width.
  container-max: 76rem

# ─── Components ────────────────────────────────────────────────────────
components:
  # The defining card chrome.
  bench-card:
    backgroundColor: "{colors.bg-card}"
    borderColor: "{colors.border}"
    borderWidth: 1px
    rounded: "{rounded.md}"
    padding: "{spacing.6}"
    hover-borderColor: "{colors.border-strong}"
  bench-card-label:                # the drawer-tab corner label
    backgroundColor: "{colors.bg-elevated}"
    borderColor: "{colors.border-strong}"
    color: "{colors.text-dim}"
    typography: "{typography.label}"
    padding: "4px 10px"
    position: top-left
    rounded: "{rounded.md} 0 {rounded.sm} 0"
  bench-card-status:               # the corner pill
    position: top-right
    offset: "{spacing.3}"

  # Status / metadata pill — the third recurring chrome element.
  pill:
    typography: "{typography.mono-pill}"
    padding: "2px 8px"
    rounded: "{rounded.full}"
    borderColor: "{colors.border-strong}"
    backgroundColor: "{colors.bg-elevated}"
    color: "{colors.text-soft}"
  pill-accent:                     # variant — accent border + color
    color: "{colors.accent}"
    borderColor: "{colors.border-accent}"
  pill-thread:
    color: "{colors.thread}"
  pill-signal:
    color: "{colors.signal}"

  # Tag chip — squarer than pill, used inside cards and entry-list rows.
  chip:
    typography: "{typography.eyebrow}"
    fontSize: 0.7rem
    padding: "1px 6px"
    rounded: "{rounded.sm}"
    borderColor: "{colors.border}"
    color: "{colors.text-dim}"

  # Eyebrow — the leading ch.0X · {section} micro-label.
  eyebrow:
    typography: "{typography.eyebrow}"
    color: "{colors.thread}"
    prefix-rule-width: 18px        # short hairline rendered with ::before
    prefix-rule-color: currentColor
    prefix-rule-opacity: 0.6

  # The header brand mark — three colored circles on a grid square.
  brand-mark:
    primary-dot-color: "{colors.accent}"
    thread-dot-color: "{colors.thread}"
    signal-dot-color: "{colors.signal}"
    grid-square-stroke: "{colors.text-dim}"
    grid-square-opacity: 0.4

  # Mode toggle — three-button segmented control.
  mode-toggle:
    backgroundColor: "{colors.bg-elevated}"
    borderColor: "{colors.border-strong}"
    rounded: "{rounded.md}"
    button-active-bg: "{colors.accent}"
    button-active-color: "{colors.bg}"
    button-rest-color: "{colors.text-dim}"

  # Hero readout — the right-column roster of latest changelog entries.
  hero-readout:
    backgroundColor: "{colors.bg-card}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    row-grid: "7rem 1fr auto"      # from-slug · title · timestamp

  # Gradient text — used sparingly on a single hero word.
  gradient-text:
    background: "linear-gradient(95deg, {colors.accent} 0%, {colors.thread} 55%, {colors.signal} 100%)"
    backgroundClip: text
    color: transparent

  # Background — fixed blueprint grid overlay on body.
  blueprint-grid:
    fine-step: "{spacing.grid-step-fine}"
    major-step: "{spacing.grid-step}"
    line-color: "{colors.border}"          # at 4% alpha
    line-color-strong: "{colors.border}"   # at 7% alpha
    mask: linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.35) 60%, transparent)

# ─── Modes (off-spec extension, owned by theme-system skill) ───────────
# Three first-class modes. `dark` is the default. `vibrant` is dark-based per
# theme-system: it inherits the ink axis, then pushes sodium + plum saturation
# and adds plum-tinted shadows. `light` is paper-based, but still bench-
# feeling — the grid lines stay; the type stays mono-forward.
modes:
  dark:
    role: bench (default)
    bg: "{colors.ink-bench}"
    text: "{colors.steel-100}"
    accent: "{colors.sodium}"
    thread: "{colors.cyan-trace}"
    signal: "{colors.plum}"
    color-scheme: dark
  light:
    role: field notebook
    bg: "{colors.paper}"
    text: "{colors.ink-bench}"
    accent: "{colors.sodium-deep}"
    thread: "{colors.cyan-deep}"
    signal: "{colors.plum-deep}"
    color-scheme: light
  vibrant:
    role: signal / demo
    bg: "{colors.ink-deeper}"
    text: "#fff4dc"
    accent: "{colors.sodium}"
    thread: "{colors.cyan-trace}"
    signal: "{colors.plum}"
    shadow-card: 0 0 0 1px rgba(255,183,51,0.14), 0 22px 52px -28px rgba(217,111,255,0.5)
    color-scheme: dark

# ─── Imagery — Ideogram v3 recipe (owned by generate-consistent-og-images) ──
# Locked recipe for share imagery. Two variables per request: `aspect_ratio`
# (one entry from the enum below) and `prompt` (subject + composition only).
# Every other field is constant across the whole image family.
imagery:
  provider: ideogram
  endpoint: POST https://api.ideogram.ai/v1/ideogram-v3/generate
  content_type: multipart/form-data

  # ── Locked defaults — DO NOT vary per request ───────────────────────
  defaults:
    style_type: AUTO              # REQUIRED with style_reference_images.
    magic_prompt: OFF             # off → no rewrite drift across requests.
    rendering_speed: QUALITY      # use TURBO/FLASH only when iterating.
    seed: 4096                    # ai-labs canonical seed; bump only on rebrand.

  # ── Locked negative prompt — short on purpose ───────────────────────
  # The last clauses ("oversized subject", "subject in top half") defend
  # the SVG overlay zone in tall aspect ratios. Don't extend without a
  # demonstrated failure mode worth excluding.
  negative_prompt: >-
    text, typography, lettering, logos, watermarks, central subject
    filling frame, photorealistic human faces, saturated, rainbow,
    vibrant, oversized subject, subject in top half

  # ── Locked color palette — weighted toward the bench surface ────────
  # ink-bench dominates (0.45) so the dark bench surface is the ground.
  # Sodium carries primary glow; cyan adds the instrument-trace highlight;
  # plum reserves the dramatic signal. Steel-200 pulls the subject up
  # without going stark white.
  color_palette:
    members:
      - { color_hex: "#0a0e14", color_weight: 0.45 }   # ink-bench (surface)
      - { color_hex: "#ffb733", color_weight: 0.20 }   # sodium (primary accent)
      - { color_hex: "#5cc8ff", color_weight: 0.15 }   # cyan-trace (thread)
      - { color_hex: "#d96fff", color_weight: 0.10 }   # plum (signal)
      - { color_hex: "#c9d2dd", color_weight: 0.10 }   # steel-200 (subject pass-through)

  # ── Locked style reference — the canonical aesthetic anchor ─────────
  # The .png lives alongside the .jpg deliverables so it can be re-uploaded
  # as `style_reference_images` on every generation. If no reference exists
  # yet (first run), generate one using only `color_palette` + `style_type:
  # AUTO`, save its PNG here, then point this field at it and proceed with
  # the canonical recipe for every subsequent variant.
  style_reference:
    path: public/ogimage__AI-Labs--Default.png
    mime: image/png

  # ── Aspect ratio enum — pick one per request ────────────────────────
  # Lossless ships WhatsApp / iMessage first — banner_tall is a first-class
  # deliverable, not a secondary variant. Format keys are cross-project canon.
  aspect_ratios:
    banner: 16x9                  # OG / Twitter / Slack / generalized share
    portrait: 4x5                 # LinkedIn portrait, Instagram feed
    portrait_tall: 9x16           # Stories, Reels, TikTok
    square: 1x1                   # avatars, square unfurls, fallbacks
    banner_tall: 3x4              # WhatsApp / iMessage previews (Lossless default tall)
    banner_tall_max: 2x3          # dramatic-tall variant

  # ── Prompt convention — the ONLY free-text per request ──────────────
  # Two clauses: (1) empty region declared as first-class subject with
  # concrete content; (2) subject zone. Explicit numeric proportions.
  # Subject for ai-labs leans on the bench/instrument-panel metaphor:
  # isometric workbench surfaces, signal traces, parallel modules, blueprint
  # rule lines, sodium-glint markings. NOT humans, NOT logos.
  prompt:
    pattern: "Top 1/3 of frame is empty negative space, {empty_region_content}. Bottom 2/3 contains {subject}."
    max_chars_recommended: 220
    subject_themes:
      # Canonical subjects for the ai-labs family. Each must read as
      # bench/instrument, not as marketing illustration.
      - isometric bench surface with three signal traces drawn in parallel
      - isometric instrument panel with three labelled module faces aligned in a row
      - a stack of three parallel paper-cut blueprint plates rising from a graph-paper surface
      - three transparent rack modules drifting above a blueprint horizon
      - a quill rule drawing a single hairline across a bench surface dotted with sodium and cyan markers
    forbid:
      # Already encoded via locked channels; never repeat in the prompt.
      - brand names (Lossless, ai-labs, child product names)
      - color names (sodium, amber, cyan, plum, magenta, dark, warm)
      - aesthetic adjectives (bench, instrumented, mono-forward, blueprint)
      - texture descriptors (isometric, paper-cut, atmospheric) unless the
        subject genuinely requires them and the style_reference image
        already establishes them as canon

  # ── Output convention — naming + preservation ───────────────────────
  output:
    public_dir: public
    naming: "ogimage__AI-Labs--{Format}.jpg"
    formats:
      - Default                   # alias of Banner; the canonical share image
      - Banner
      - BannerTall                # WhatsApp / iMessage default tall
      - BannerTallMax
      - Portrait
      - PortraitTall
      - Square
    archive_dir: .ogimage-archive       # dot-prefixed; outside public/
    candidates_dir: .ideogram-candidates # dot-prefixed; outside public/

---

# AI-Labs Splash — Design System

> The runtime source of truth is `src/styles/theme.css`'s `:root` and
> `:root[data-mode='...']` blocks; this document is the human- and agent-
> readable contract that explains intent. Keep the two in sync when either
> changes.

## Brand & Style

The ai-labs splash reads as an **applied AI testbed** — a workbench surface
holding three product modules, instrument-panel signal hues, a faint blueprint
grid running underneath everything. Not steampunk, not "lab coats and beakers,"
not generic dark-tech-startup. Closer to a measured engineering bench at night:
quiet, instrumented, deliberate.

The defining typographic move is **mono-forward** — JetBrains Mono is the
dominant family for eyebrows, metadata, labels, status pills, and any
identifier or number. Space Grotesk handles display; Inter Tight carries body
prose. Sibling Lossless splashes lean *editorial* (memopop sans, lfm serif);
this one leans *instrumented*.

Three modes are first-class: **dark** ("bench") is the default; **light**
("field notebook") inherits the paper axis but keeps the bench affordances
(grid, mono-forward, hairline borders); **vibrant** ("signal / demo") is
dark-based, pushes sodium and plum, and adds plum-tinted shadow falloff for
demo settings where the splash needs to read across a room.

The voice is **instrumented / log-entry**: short, matter-of-fact, with eyebrows
read like chapter markers (`ch.01 · ai-labs`, `ch.02 · active builds`). No
marketing-deck adjectives, no manifesto-tone, no over-elaboration. Words like
*roster*, *housing*, *graduated*, *signal*, *trace*, *readout* are
preferred over *vibrant*, *amazing*, *unleash*, *empower*.

## Colors

Two tiers. **Named tokens** are raw values, mode-invariant — the inputs.
**Semantic tokens** are what components consume — `bg`, `text`, `accent`,
`thread`, `signal`, `border`, etc. — and get rebound per `<html data-mode>`.
Components must read semantic tokens only; hard-coded hex values break mode
switching silently.

The **brand spine** is three signal hues:

- **`sodium`** (#ffb733) — the primary accent. Amber LED, hand-labelled drawer
  tab, instrument-panel reading. Drives all calls-to-act, the eyebrow underline,
  the corner labels. Sparing use; every appearance should read as meaningful.
- **`cyan-trace`** (#5cc8ff) — the secondary thread. Oscilloscope-trace blue.
  Carries cross-references — the "trace" between sections, the gradient on
  display-text, secondary affordances.
- **`plum`** (#d96fff) — the dramatic signal. Used sparingly; the vibrant mode
  pushes it forward; the dark mode reserves it for noteworthy callouts.

The **bench neutrals** are ink (dark) ↔ paper (light) ↔ steel (intermediate).
Dark mode's `ink-bench` (#0a0e14) is harder-edged than lfm's warm cream or
memopop's deep ink — closer to the surface of a measurement instrument.

Mode bindings:

| Semantic | Dark (bench) | Light (field notebook) | Vibrant (signal) |
|---|---|---|---|
| `bg` | `ink-bench` | `paper` | `ink-deeper` |
| `text` | `steel-100` | `ink-bench` | `#fff4dc` |
| `accent` | `sodium` | `sodium-deep` | `sodium` |
| `thread` | `cyan-trace` | `cyan-deep` | `cyan-trace` |
| `signal` | `plum` | `plum-deep` | `plum` |

Borders are rendered from a single hex (`#e6ebf2` in dark, `#0a0e14` in light)
at varying alpha levels (8% / 18% / 36%) — the alpha *is* the strength signal.

## Typography

Three families, intentional split:

- **Space Grotesk** (display) — `h1`/`h2`/`h3` and the lede. Variable-axis
  grotesque sans; tight tracking; reads "engineered display" without going
  brutalist. Used at clamp-scaled sizes; max display at the hero.
- **Inter Tight** (body) — prose paragraphs and reading text. Optimized for
  short paragraphs at 1rem on a dark surface. Never used in headlines or
  eyebrows.
- **JetBrains Mono** (mono — the dominant family) — eyebrows, metadata,
  labels, status pills, kbd-like fragments, code, every number, every
  identifier. **This is the defining type move**. Where memopop reaches for
  sans and lfm reaches for serif, this splash reaches for mono.

Conventions:

- Eyebrows are `0.72rem` mono at `0.18em` letter-spacing, uppercase, with a
  short hairline prefix rule. They lead every section.
- Status pills are `0.7rem` mono at `0.08em` letter-spacing. Three accent
  variants (`pill--accent` / `pill--thread` / `pill--signal`) plus a soft
  default.
- Body paragraphs stay Inter Tight; never use mono for paragraph prose. Mono
  in paragraphs reads as code; we want it to read as instrument labelling.
- The lede uses display Space Grotesk (not body Inter) — it bridges the hero
  headline and the body, on purpose.

Never introduce a fourth family. Three is the contract.

## Layout & Spacing

Container model: a single fixed `--container-max` of `76rem` centered with
`--space-6` (24px) inline padding. Sections add vertical rhythm via
`padding: var(--space-16) 0` (64px) with a hairline top border that signals
section change without being heavy. First section drops the top border.

Spacing scale is a power-of-1.25-ish progression — `0.25rem`, `0.5rem`,
`0.75rem`, `1rem`, `1.25rem`, `1.5rem`, `2rem`, `2.5rem`, `3rem`, `4rem`,
`5rem`, `6rem`. Components reach for the scale tokens, never raw `px`
values; spot-tuning lives only where the scale is the wrong instrument
(e.g. the 2px focus-ring offset).

The hero uses an asymmetric two-column split (`split--hero`) at `≥56rem`:
left column carries the pitch (eyebrow + h1 + lede + meta-strip); right
column carries the "readout" — a live roster of the latest changelog entries
that demonstrates the rollup mechanism. Below `56rem`, both columns stack.

Other grids use `repeat(auto-fit, minmax(<min>, 1fr))`:

- Product roster: `minmax(18rem, 1fr)`.
- Discipline strip: `minmax(16rem, 1fr)`.
- Studies row: `minmax(16rem, 1fr)`.
- Context-v cards: `minmax(20rem, 1fr)`.

## Elevation & Depth

Flat by default. The blueprint grid runs as a fixed `body::before`
pseudo-element behind every page — two layered linear gradients (8px fine,
32px major) at low alpha, masked to fade to transparent below the fold.
That's the ambient lighting; no other background gradient layer competes.

Cards earn a hairline border (`--color-border`) and a shadow that's mostly
*depth* (`shadow-card`) rather than glow. Hover thickens the border (`-strong`),
no lift. Elevated surfaces use `--color-bg-elevated` and a one-step-stronger
shadow.

Vibrant mode is the exception: cards there gain a faint plum-tinted shadow
falloff to add demo-room presence. Light mode drops shadow intensity
proportionally; ink-on-paper doesn't want the same depth signal as a glowing
bench.

The header is sticky (`top: 0`) with a 10px backdrop-blur so the brand mark
and mode toggle stay reachable while scrolling, without breaking the bench
surface.

## Shapes

Cut, not poured. The radius scale is deliberately small:

- `sm: 2px` — chip / inline kbd.
- `md: 3px` — bench cards, panels, the search popover.
- `lg: 5px` — only used for the brand mark's outer square.
- `full: 999px` — pills only.

This is squarer than lfm (which uses 2/4/8/12) and much squarer than
memopop (which uses 8/16/24-style glass shapes). Pills stay round so they
read as semantic markers; everything else stays slab.

## Components

### Bench-card (the defining card chrome)

A hairline-bordered card with a **mono label-tab clipped to the top-left
corner**, like a hand-labelled drawer. Status pill sits in the top-right.
Body is offset top by `--space-5` so it clears the label tab. Hover thickens
the border; no lift, no glow.

Used for: the three product roster cards, the three discipline cards, the
three studies cards, the changelog list items, the context-v list items, the
context-v detail header.

Variants are driven by the label-tab text (`project`, `product`, `tooling`,
`context-v`, `changelog`, `branches`, `study · 0X`). The corner label is the
single most defining bench affordance — every card has one; cards without
one don't read as part of the system.

### Pill (status indicator)

Pill-shaped (`rounded.full`), JetBrains Mono `0.7rem` at `0.08em`
letter-spacing. Three accent variants:

- `pill--accent` — sodium border + sodium text. The primary status indicator.
- `pill--thread` — cyan border + cyan text. Used for version stamps and
  intermediate states.
- `pill--signal` — plum border + plum text. Reserved for noteworthy callouts.
- (default) — neutral border + soft text. Used for low-key meta like a
  legacy status.

Never put more than one status pill on a single card; the cross-product
signal collapses otherwise.

### Chip (tag indicator)

Squarer cousin of pill (`rounded.sm`, no rounded edges), used inside cards
for tag rows. JetBrains Mono `0.7rem`, dim color, hairline border. Wraps
freely; no slice limit — every tag is visible.

### Eyebrow (section marker)

The `ch.0X · {section}` marker that leads every section. JetBrains Mono
`0.72rem` at `0.18em` letter-spacing, in `--color-thread` (cyan), with a
short hairline prefix rendered as `::before`. The chapter-style numbering
is the instrument-log voice expressed at the section level — a section
without an eyebrow doesn't read as part of the bench.

### Hero readout

A right-column aside on the hero, showing the latest three changelog entries
across the whole tree. Three-column row grid: `7rem 1fr auto` — slug · title
· date. Demonstrates the rollup mechanism above the fold; doubles as a
proof-of-life signal that the splash is current.

### Mode toggle (three-button segmented control)

Inline-flex group of three icon buttons (sun / moon / star). Pressed state
fills the button with `--color-accent` (sodium) and inverts text to
`--color-bg`. Persists choice to `localStorage` under
`ai-labs-splash-mode`. The pre-paint inline script in `BaseLayout` reads
the persisted value and writes `<html data-mode="...">` before first paint,
preventing FOUC on mode-switched visits.

### Brand mark

Three colored circles on a grid square, in the header. Sodium dot top-left
(accent), cyan dot middle-right (thread), plum dot bottom-center (signal).
Hairline grid square outlines the canvas. Reads as "instrument panel"; works
at favicon size as well (16px / 32px).

### Gradient text

A single-word gradient applied sparingly — currently only on the word
"testbed" in the hero h1. Background-clipped gradient flows
sodium → cyan → plum (the brand spine in left-to-right order). Never apply
to whole phrases; the move dilutes if reused.

### Background — blueprint grid

A fixed `body::before` pseudo-element renders two layered 1px-line linear
gradients: an 8px fine grid + a 32px major grid, both at low alpha (4% /
7%). The whole layer is masked top-to-bottom with a linear-gradient mask
that fades to transparent ~60% down the page, so the grid never competes
with prose below the fold. Pure CSS; no images.

## Imagery

All ai-labs splash imagery is generated via Ideogram's v3 generate endpoint.
The frontmatter's `imagery:` block is the **complete locked recipe** —
every field there stays constant across every request. The two things that
vary per call are `prompt` (subject + composition) and `aspect_ratio` (one
entry from the enum). Everything else — style reference, color palette,
style type, magic-prompt flag, negative prompt, seed, rendering speed — is
identical request-to-request.

### The locked channels (don't touch per request)

- **`style_reference_images`** — `public/ogimage__AI-Labs--Default.png`,
  uploaded on every request. The canonical aesthetic anchor: bench surface,
  three signal traces, blueprint-grid backdrop, sodium-glint markers,
  cyan-trace highlights, plum reserve. If this file doesn't exist yet (first
  generation), seed it by running once with only `color_palette` + `style_type:
  AUTO` and save the PNG output here.
- **`color_palette.members`** — five weighted members. `ink-bench` (#0a0e14)
  dominates at 0.45 so the dark bench surface is the ground. Sodium at 0.20
  is the primary accent; cyan-trace at 0.15 is the thread; plum at 0.10 is
  the dramatic signal; steel-200 at 0.10 keeps the subject from going stark
  white.
- **`style_type: AUTO`** — required when `style_reference_images` is uploaded;
  the v3 API rejects `DESIGN` / `REALISTIC` / `FICTION` in that combination.
  AUTO lets the reference image carry the aesthetic, which is the entire
  point of locking the channel.
- **`magic_prompt: OFF`** — non-negotiable. Magic-prompt rewrites the prompt
  before generation; rewriting is the largest source of drift across
  "identical" requests. Off keeps the prompt verbatim and consistency holds.
- **`negative_prompt`** — short on purpose:
  `text, typography, lettering, logos, watermarks, central subject filling
  frame, photorealistic human faces, saturated, rainbow, vibrant, oversized
  subject, subject in top half`. The trailing `oversized subject` /
  `subject in top half` exclusions defend the SVG-overlay zone in tall
  aspect ratios.
- **`seed: 4096`** — fixed canonical seed for the ai-labs family. Bump only
  when the visual canon itself shifts (rebrand, new reference image, palette
  redo).
- **`rendering_speed: QUALITY`** — for production assets. `TURBO` / `FLASH`
  are for prompt iteration only.

### The variable channels (the only things you change)

- **`prompt`** — one sentence, ≤220 characters, two clauses:
  1. **Empty region first** — declare the top region as empty negative space
     and give it concrete content (a "dark gradient sky", a "muted
     atmospheric backdrop"). The model treats both clauses as renderings,
     which is how we keep the subject from growing up into the overlay zone.
  2. **Subject second** — what the bottom 2/3 contains. ai-labs subjects
     lean on the bench/instrument metaphor: workbench surfaces, signal
     traces, parallel modules, blueprint rule lines, sodium glint markings.
     **Never humans, never logos, never literal product UI screenshots.**

  Canonical subject themes (rotate across the format set so the family reads
  as variations on a theme, not five unrelated images):

  - *isometric bench surface with three signal traces drawn in parallel*
  - *isometric instrument panel with three labelled module faces aligned in a row*
  - *a stack of three parallel paper-cut blueprint plates rising from a graph-paper surface*
  - *three transparent rack modules drifting above a blueprint horizon*
  - *a quill rule drawing a single hairline across a bench surface dotted with sodium and cyan markers*

  The number **three** recurs on purpose — it echoes the three active
  products housed in the pseudomonorepo. The subject is always *three* of
  something instrument-like, never one or many.

- **`aspect_ratio`** — pick from `imagery.aspect_ratios`:

  | Format key | Ideogram value | Use for |
  |---|---|---|
  | `banner` | `16x9` | OG / Twitter / Slack |
  | `portrait` | `4x5` | LinkedIn portrait, IG feed |
  | `portrait_tall` | `9x16` | Stories, Reels, TikTok |
  | `square` | `1x1` | Avatars, square unfurls |
  | `banner_tall` | `3x4` | **WhatsApp / iMessage default** |
  | `banner_tall_max` | `2x3` | Dramatic-tall variant |

### Naming + preservation

Save canonical deliverables to `public/` as:

```
public/ogimage__AI-Labs--Default.jpg          # alias of Banner; canonical share
public/ogimage__AI-Labs--Banner.jpg
public/ogimage__AI-Labs--BannerTall.jpg       # WhatsApp / iMessage default
public/ogimage__AI-Labs--BannerTallMax.jpg
public/ogimage__AI-Labs--Portrait.jpg
public/ogimage__AI-Labs--PortraitTall.jpg
public/ogimage__AI-Labs--Square.jpg
```

Plus the `.png` style reference at
`public/ogimage__AI-Labs--Default.png` (re-uploaded on every request).

Per the `generate-consistent-og-images` skill's **preservation discipline**:

- Raw candidates from each run land in `.ideogram-candidates/<subject>-<aspect>-<timestamp>/` (dot-prefixed, outside `public/` so static-site frameworks don't deploy them).
- When replacing a canonical JPEG, move the old one to `.ogimage-archive/ogimage__AI-Labs--{Format}--{YYYY-MM-DD}.jpg` *before* writing the new one. The unfurler URL stays stable; old bytes survive in archive with a date stamp.

## Do's and Don'ts

- **Do** lead every section with an eyebrow (`ch.0X · {section-name}`). The
  chapter-style numbering is the instrument-log voice; sections without it
  don't read as part of the bench.
- **Do** keep JetBrains Mono as the dominant family for any non-prose text —
  eyebrows, metadata, labels, status pills, numbers, identifiers. That's the
  defining type move; weakening it weakens the bench feel.
- **Do** use the bench-card label tab on every card. It's the single most
  defining card affordance; cards without one don't belong to the system.
- **Do** lean on the number *three* in imagery — three signal traces, three
  modules, three plates. It echoes the three active products housed in the
  pseudomonorepo.
- **Do** persist the mode choice and resolve it pre-paint. Mode toggling
  must never FOUC; the inline pre-paint script in BaseLayout is mandatory.
- **Do** keep the blueprint grid as the *only* ambient lighting layer. No
  radial mesh, no gradient washes — those belong to sibling splashes.

- **Don't** introduce a fourth typeface. Space Grotesk + Inter Tight +
  JetBrains Mono is the contract; a fourth dilutes the mono-forward signal.
- **Don't** use mono for paragraph prose. Mono in paragraphs reads as code;
  we want it to read as instrument labelling. Body prose is Inter Tight.
- **Don't** hard-code color hex values in components. Every value must come
  from a semantic token (`var(--color-*)`); hard-coding breaks mode
  switching silently.
- **Don't** apply the gradient-text move to more than one or two words at
  a time. It's a hero accent; reusing it on phrases dilutes the move.
- **Don't** soften the bench-card corners past `rounded.md` (3px). The
  squarer geometry is the divergence from sibling splashes; rounding it up
  drifts us back toward lfm's printer's-mark feel.
- **Don't** add a second background layer behind the blueprint grid. The
  grid is the ambient ground; a second layer (mesh / wash / noise) breaks
  the bench feel.
- **Don't** put humans, logos, or product screenshots in OG imagery. The
  family is instrument-abstract for a reason — the moment a face appears,
  the splash reads as a marketing site, not a testbed.
- **Don't** vary `seed`, `magic_prompt`, `style_type`, `color_palette`, or
  `style_reference_images` per Ideogram request. Two channels vary
  (`prompt` and `aspect_ratio`); the rest are locked at the project level
  exactly so that variation looks like family, not chaos.
- **Don't** overwrite a canonical OG JPEG in place when re-running. Archive
  the previous bytes to `.ogimage-archive/ogimage__AI-Labs--{Format}--{YYYY-MM-DD}.jpg`
  first, then write the new pick to the canonical path. The unfurler URL
  stays stable; byte history is preserved.
- **Don't** put raw Ideogram candidates inside `public/`. Static-site
  frameworks deploy everything there verbatim — ~1.4 MB per PNG ships to
  GitHub Pages otherwise. Candidates live in `.ideogram-candidates/`,
  dot-prefixed, outside `public/`.

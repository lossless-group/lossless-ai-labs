---
title: "Codify the deck design system & component library — author DESIGN.md, showcase it on /design-system, and refactor every kept element onto theme/mode tokens"
lede: "Building six strategy decks produced a real, reusable design system — deck-primitives.css (a 15-class component vocabulary) plus a set of recurring section compositions (cover, stat slide, field template, two-column contrast, numbered flow, accent callout, tier cards, ask/close). None of it is documented or shown on /design-system, and there is no DESIGN.md. This plan codifies the system: author a DESIGN.md per the maintain-design-md (Google Stitch) spec, add the deck primitives + patterns to the /design-system page, and — the gating discipline — promote an element into the documented system ONLY once it reads the Tier-2 semantic + --fx-* tokens and works in light/dark/vibrant with no hardcoded colors. That last bar is what 'requires refactoring': the strategy decks are already token-driven, but the older story/automation/homepage sections hardcode dark:/vibrant: triples and must be reconciled (or explicitly excluded) for one coherent system."
date_authored_initial_draft: 2026-06-29
date_authored_current_draft: 2026-06-29
date_authored_final_draft:
date_first_published: 2026-06-29
date_last_updated: 2026-06-29
at_semantic_version: 0.0.1.0
status: Planned
augmented_with: Claude Code (Opus 4.8, 1M context)
category: Plan
tags:
  - Design-System
  - Component-Library
  - DESIGN-md
  - Deck-Primitives
  - Theme-System
  - Three-Modes
  - Token-Alignment
  - Refactor
  - Dididecks-Shell
authors:
  - Michael Staton
related:
  - "[[Deck-Collections-A-Menu-Layer-Above-Single-Deck-Convergence]]"
  - "[[Integrate-Reach-Edu-Hub-into-Dididecks-Shell]]"
  - "maintain-design-md (skill)"
  - "theme-system (skill)"
from: "dididecks-ai/reach-edu-hub"
from_path: "context-v/plans/Codify-Deck-Design-System-and-Component-Library.md"
---
# Codify the deck design system & component library

> **For a fresh session.** Everything below is the standing inventory + plan so
> the next session can execute without re-discovering. Skills to load:
> **`maintain-design-md`** (authors DESIGN.md per the Google Stitch spec) and
> **`theme-system`** (two-tier tokens, three-mode contract). Also `astro-knots`.

## Why this plan exists

Six strategy decks (rural-income, literacy-numeracy, agentic-product-lab,
agent-workflow-maxxing, reverse-engineer-funding, frontier-job-demand) were built
on a shared, token-driven design system that emerged along the way:
`src/styles/deck-primitives.css`. It works and looks good — but it is **not
documented and not on `/design-system`**, and the site has **no `DESIGN.md`**.
The goal is to *codify* what's worth keeping: write it down (DESIGN.md), show it
(/design-system), and make sure every kept element is genuinely token-aligned.

## The gating discipline (the "requires refactoring" bar)

**An element is "in the design system" only if it reads the Tier-2 semantic +
`--fx-*` tokens and renders correctly in light / dark / vibrant with no hardcoded
colors and no per-element `dark:` / `vibrant:` class triples.** Runtime CSS is the
source of truth; `DESIGN.md` is the contract that describes it (per
`maintain-design-md`). So the flow per element: audit → refactor to tokens if
needed → only then document + showcase.

## Inventory A — the component library (deck-primitives.css)

Already token-driven; these are the keep-and-codify primitives:

- **Frame / layout:** `.deck-section` (+ the dark-mode `.deck-card` rescope lives
  here), `.deck-grid`, `.deck-rule`, `.deck-accent-bar`, `.deck-kicker`.
- **Type:** `.deck-eyebrow`, `.deck-h1`, `.deck-h2`, `.deck-gradient`
  (mode-aware `--fx-headline-gradient` text fill), `.deck-lede`.
- **Surface:** `.deck-card` (+ `[data-mode="dark"]` rescope of `--color-text-muted`
  + de-saturated surface — the dark-mode fix; consider generalizing).
- **Data / labels:** `.deck-stat`, `.deck-stat-label`, `.deck-chip`, `.deck-verify`.
- **Effect:** `.deck-glow` (intensity scales with `--fx-glow-opacity`).

## Inventory B — recurring section patterns (candidates to componentize)

These compositions repeat across decks; each is a candidate to extract into a
reusable Astro component (e.g. `src/components/deck/*`) so they're showcased and
DRY, OR to document as named patterns if extraction is premature:

- **Cover** — eyebrow + gradient `h1` + lede + accent-bar footer + glow.
- **Statement / thesis** — centered gradient headline + 2–3 effect cards
  (e.g. agent-workflow T03, rural-income T03).
- **Stat / data slide** — `.deck-stat` hero(s) + supporting cards
  (reverse-engineer T02 power-law; literacy-numeracy T04; frontier field slides).
- **Field / front template** — eyebrow `Field/Front 0N` + `h2` + 2-card
  (bottleneck / agents-do OR program / fit) + stat + chip tools row. Used across
  agent-workflow fronts (T04–T08) and frontier fields (T04–T06). The strongest
  extraction candidate (a `<DeckFront>` / `<DeckField>` component with props).
- **Two-column contrast** — literacy-numeracy T05, rural-income T06,
  reverse-engineer T07.
- **Numbered flow** — literacy-numeracy T07, agentic-product-lab T08,
  reverse-engineer T05.
- **Accent-bordered callout** — `border-left: 3px var(--color-accent)`; the
  voice-first (agentic T09) and social-caveat (agent-workflow T08) blocks.
- **Tier cards** — funder pipeline national/regional/local (rural-income T10).
- **Ask / close** — two-column "Reach / Funders" + glow (rural-income T11,
  literacy-numeracy T10, others).

## Owner-flagged reference treatment — editorial v2 (`/scroll/story/editorial`)

**The owner specifically liked the patterns in the Story v2 "editorial" deck
(`src/layouts/sections/story/version-2/**`, route `/scroll/story/editorial`),
and called out its *color uses* in particular.** This is a load-bearing
reference for the design system's *aesthetic* — capture and preserve it. Note the
catch: this deck predates deck-primitives and is **hardcoded with Tailwind
built-in palette classes (not tokens)**, so the job is to *preserve the treatment
while translating it onto tokens*, then document it (likely as a named
"editorial" treatment / variant in the design system).

What's distinctive about its color use (from the actual classes):

- **Confident, frequent orange accent** — `text-orange-500` is the most-used
  color (≈60 hits): the brand orange (`--color-accent` / `orange-saccharine
  #ff8300`) used *liberally* for eyebrows, emphasis, and rules, not sparingly.
- **Two-accent interplay (orange + cyan/teal)** — `text-cyan-400/700/300`
  alongside the orange; the teal (`--color-secondary` / `teal-ocean`,
  `teal-bright`) plays a real second-accent role rather than being incidental.
- **Tonal hierarchy via opacity, not extra gray tokens** — light text as
  `text-stone-50` stepped through `/85 /80 /75 /65 /40`; hairlines as
  `border-stone-50/15`, `border-orange-500/30`. The muted ramp is *alpha on the
  text color*, which is exactly the move the dark-mode `.deck-card` rescope
  already generalizes (`color-mix(... var(--color-text) N%, transparent)`).
- **Editorial voice paired with color** — `font-serif` + `italic` (Playfair,
  `--font-heading`) is inseparable from the color feel here; document the pair
  together.
- **Indigo/purple ground** — `indigo-950` (`--color-primary` / `purple-midnight`)
  for grounds and dark surfaces.

Codification implication: these map cleanly onto existing tokens
(orange→`--color-accent`, cyan→`--color-secondary`, stone-50→text on dark,
indigo-950→`--color-primary`), so the refactor is a *translation*, not a redesign.
Preserve: the **accent-forward, two-accent (orange + teal), opacity-ramp-muted,
serif-italic** editorial treatment — and consider codifying it as a documented
treatment/variant the design system offers (so other decks can opt into the
look the owner liked).

## Inventory C — the token system (theme.css = runtime source of truth)

Already present and the basis for the DESIGN.md frontmatter:
- **colors:** `--color-primary` / `-500` / `-700`, `--color-secondary`,
  `--color-accent`, `--color-background`, `--color-surface`, `--color-text`,
  `--color-text-muted`, `--color-border` (Tier-2 semantic; Tier-1 named tokens
  `--color__*` are private).
- **typography:** `--font-body`/`--font-sans` (Soleil), `--font-heading`/
  `--font-display` (Playfair), `--font-mono`.
- **fx (elevation/effects, per-mode):** `--fx-headline-gradient`,
  `--fx-card-shadow`, `--fx-card-shadow-hover`, `--fx-glow-opacity`,
  `--fx-glow-spread`.
- **modes:** light / dark / vibrant via `[data-mode]` + the `.dark` class variant.

## Refactor candidates (the drift to reconcile)

These predate deck-primitives and hardcode `dark:`/`vibrant:` Tailwind triples
instead of tokens — they do NOT meet the gating bar:
- `src/layouts/sections/story/**` and `story/version-2/**` (the original story deck)
  — NOTE: `story/version-2/**` is the **owner-flagged editorial treatment** above;
  treat it as preserve-the-look-while-translating-to-tokens, not just "drift."
- `src/layouts/sections/automation/**`
- `src/pages/index.astro` (homepage), `src/pages/brand-kit/index.astro`,
  `src/pages/design-system/index.astro`
- `src/components/basics/Header.astro` (uses hardcoded triples; works, but is
  not token-driven — decide whether chrome is in-scope for the deck design system
  or its own thing)

Decision needed: migrate these onto tokens/primitives for one coherent system, OR
scope the design system to "deck primitives" only and leave site chrome as a
separate (documented) concern. Recommendation: codify deck-primitives first
(clean win), then migrate story/automation sections as a second pass.

## Work plan (phases)

1. **Audit & decide scope.** Confirm which elements are "kept." Run the drift
   check: `grep -rE 'dark:|vibrant:' src/layouts/sections/{rural-income,literacy-numeracy,agentic-product-lab,agent-workflow-maxxing,reverse-engineer-funding,frontier-job-demand}` should be empty (the strategy decks are clean); the older sections will light up.
2. **Refactor to the bar.** For each kept element not yet token-driven, replace
   hardcoded colors / `dark:`/`vibrant:` triples with `var(--color-*)` / `--fx-*`.
   Generalize the dark-mode `.deck-card` rescope if other surfaces need it.
3. **(Optional) Extract patterns into components.** Promote the highest-value
   repeating compositions (esp. the field/front template) into
   `src/components/deck/*` Astro components with props, so they're reusable and
   showcaseable. Keep the CSS in deck-primitives.css.
4. **Author `DESIGN.md`** at the repo root, per `maintain-design-md`:
   frontmatter token groups from theme.css (`colors`, `typography`, `rounded`,
   `spacing`, `components` for the deck primitives) + a `modes:` extension for
   light/dark/vibrant; the eight prose sections in canonical order; the
   runtime-source-of-truth blockquote pointing at `theme.css` + `deck-primitives.css`.
   (No DESIGN.md exists yet — this is a bootstrap.)
5. **Rebuild `/design-system`** to showcase the system: a live gallery of each
   deck primitive and each named pattern, ideally rendered in all three modes (or
   with the mode toggle), replacing the current Header/ModeToggle-only page.
6. **Sync `DESIGN.md` ↔ runtime** and add a Do's/Don'ts section capturing what
   we learned (e.g. "muted text on a card surface needs the dark-mode rescope —
   don't use the page-background muted token inside cards").

## Cross-cutting — lift to the shell

`deck-primitives.css` + the extracted pattern components + the DESIGN.md token
contract are strong **lift candidates for `@dididecks/shell`** (every client deck
would inherit them). Sequence per the chroma→shell promotion discipline: codify
in reach first (this plan), prove across the six decks, then promote the generic
parts into `apps/deck-shell/`. See [[Integrate-Reach-Edu-Hub-into-Dididecks-Shell]]
and the deck-collections exploration.

## Acceptance criteria

- `DESIGN.md` exists at the reach root, spec-compliant, describing the deck
  primitives + tokens + three modes, with the runtime-source-of-truth note.
- `/design-system` shows every kept primitive (and the named patterns), correct
  in light/dark/vibrant.
- Every documented element is token-driven (no hardcoded colors / no `dark:`/
  `vibrant:` triples) — the drift grep over kept elements is clean.
- A clear, recorded decision on whether older story/automation/chrome are
  in-scope (migrated) or out-of-scope (documented as separate).

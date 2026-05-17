---
title: "Chroma Brand & Deck Notes (pre-scaffold)"
lede: "Source-of-truth design tokens, typography, and content-source notes for the upcoming `chroma-decks` client-site. Extracted directly from trychroma.com's production CSS bundle and the Alpha Partners investment memo. Lives in dididecks-ai/context-v/explorations/ until Phase 2 of [[../plans/Init-Chroma-Decks-Client-Site]] scaffolds the chroma-decks repo — at which point this file's substance is promoted into `chroma-decks/DESIGN.md` (Stitch-spec format)."
date_created: 2026-05-11
date_modified: 2026-05-11
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.1.0
tags:
  - Chroma
  - Design-Tokens
  - DESIGN-md
  - Brand-Notes
  - Pre-Scaffold
  - Light-Mode-Only
status: Draft
from: "dididecks-ai"
from_path: "context-v/explorations/Chroma-Brand-and-Deck-Notes.md"
---
# Chroma Brand & Deck Notes

> Pre-scaffold notes for `dididecks-ai/client-sites/chroma-decks`. Source: trychroma.com production CSS bundle (`/_next/static/chunks/14s5j3w7jgn-s.css`) fetched 2026-05-11, and `ai-labs/ChromaDB-v0.0.3.pdf` (Alpha Partners investment memo, 34 pp). Authoritative for the **light** mode only — `dark` and `vibrant` are placeholders awaiting a separate brand-iteration session with the user.

## How this file feeds the scaffold

- **Phase 2 of the init plan** copies the calmstorm-decks `DESIGN.md` structure into the new repo. At that point, the **token blocks below replace the calmstorm values** and the structure stays.
- **The deck-content-source notes** become the seed of `chroma-decks/corpus/README.md` (which itself is git-ignored per Phase 5).
- **The brand-iteration follow-up** for modes 2 and 3 references this file as the starting point — "here's what we extracted from production; here's what we propose to add."

## 1. Framework signal (load-bearing for the scaffold)

trychroma.com is **Next.js + Tailwind v4 + shadcn/ui token shape**. The CSS uses the canonical shadcn semantic-token names: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`, `--card`, `--popover`, `--destructive`, plus `--sidebar-*` and `--chart-*` families.

**Implication for the scaffold:** calmstorm-decks uses a Material-style semantic token set (`surface`, `on-surface`, `surface-container-*`, `inverse-surface`). **Chroma's site uses shadcn semantics.** We have two valid options:

1. **Keep calmstorm's Material shape**, map Chroma's shadcn values into it. Pros: continuity across client-sites. Cons: we paper over what Chroma actually uses.
2. **Adopt shadcn semantics in chroma-decks**, recognizing the client site mirrors the client's own system. Pros: brand-truth. Cons: chroma-decks diverges from calmstorm's token shape, weakens the cross-engagement template.

**Recommendation: option 2.** A client-site's job is to feel like the client's site; mirroring their token vocabulary is downstream of that. The `Client-Site-Baseline-v2.md` reflection (Phase 6) captures this choice as a deliberate per-engagement axis, not a regression.

## 2. Color tokens — light mode (extracted, verbatim)

All values lifted directly from the production CSS. Hex is the implementation; the `lab()` companions Tailwind v4 emits are noted where useful.

### Surface / text neutrals

| Token | Hex | Role |
|---|---|---|
| `--background` | `#ffffff` | Main page background |
| `--foreground` | `#0a0a0a` | Primary text |
| `--card` | `#ffffff` | Card surface |
| `--card-foreground` | `#0a0a0a` | Card text |
| `--popover` | `#ffffff` | Popover/overlay surface |
| `--popover-foreground` | `#0a0a0a` | Popover text |
| `--muted` | `#f5f5f5` | Quiet surface (chips, code bg, subtle blocks) |
| `--muted-foreground` | `#737373` | Metadata, secondary text |
| `--secondary` | `#f5f5f5` | Secondary action surface |
| `--secondary-foreground` | `#171717` | Secondary action text |
| `--accent` | `#f5f5f5` | Hover state surface |
| `--accent-foreground` | `#171717` | Hover state text |
| `--border` | `#e5e5e5` | Dividers, card borders |
| `--input` | `#e5e5e5` | Form input borders |
| `--ring` | `#a1a1a1` | Focus ring |

### Primary / destructive

| Token | Hex | Role |
|---|---|---|
| `--primary` | `#171717` | Primary action (near-black, not blue) |
| `--primary-foreground` | `#fafafa` | Primary action text |
| `--destructive` | `#df2225` | Error / destructive action |

### Brand-specific accents (the load-bearing color character)

This is the **Chroma color signal.** The neutrals above are nearly stock shadcn; what makes the site visually Chroma are these warm accents, applied sparingly:

| Token | Hex | Role |
|---|---|---|
| `--color-chroma-black` | `#27201c` | **Brand "black" — warm, not neutral.** Distinct from `--foreground: #0a0a0a`. Used for the wordmark, hero typography, and feature accents. |
| `--chart-1` | `#f05100` | Vivid orange — primary brand accent |
| `--chart-2` | `#009588` | Teal — secondary accent |
| `--chart-3` | `#104e64` | Deep ocean blue — tertiary accent |
| `--chart-4` | `#fcbb00` | Amber yellow — quaternary accent |
| `--chart-5` | `#f99c00` | Orange-amber — quinary accent |

> **Use them like Chroma uses them.** The site is overwhelmingly white-on-warm-black with surgical pops of `--chart-1` (orange) and `--chart-2` (teal). The amber/ocean tones are mostly chart-only. Slides should mirror this restraint — don't smear all five accents across every slide.

### Sidebar tokens (carried for parity)

trychroma.com defines a separate `--sidebar-*` family identical in shape to the main surface tokens, but with `--sidebar: #fafafa` (very-slightly-off-white) instead of pure `#ffffff`. Carry these forward in the scaffold so any sidebar-pattern slides feel native.

## 3. Typography

**Two families, both from the production CSS:**

- **Body / display:** `var(--font-inter)` — **Inter** (sans-serif, geometric, the de-facto Vercel-era developer-tooling typeface).
- **Mono / code:** `var(--font-ibm-plex-mono)` — **IBM Plex Mono** (developer-tooling-credible monospace).
- **Code-block fallback chain:** `Fira Code, Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace`.

**Font weights observed:**

| Weight | Variable |
|---|---|
| 300 | `--font-weight-light` |
| 400 | `--font-weight-normal` |
| 500 | `--font-weight-medium` |
| 600 | `--font-weight-semibold` |
| 700 | `--font-weight-bold` |

**Loading mechanism in the scaffold:** Astro 6 native Fonts API in `astro.config.mjs` (same pattern as calmstorm — see `client-sites/calmstorm-decks/astro.config.mjs:21`). Load `Inter` and `IBM Plex Mono` from `fontsource()`, expose as `--font__inter` and `--font__ibm-plex-mono` CSS variables so the deck's `theme.css` can reference them.

## 4. Geometry / radii

| Token | Value | Note |
|---|---|---|
| `--radius` | `0.625rem` (10px) | Base radius — buttons, cards, inputs |
| `--radius-md` | `calc(var(--radius) - 2px)` | Tightened mid-tier |
| `--radius-xs` | `0.125rem` (2px) | Pills, badges |

Round-but-not-pill. Carry forward.

## 5. Visual register (qualitative, for the deck)

- **Technical-credible, not playful.** Developer-tooling tone — like Vercel, Linear, Resend, modern Stripe docs.
- **Generous whitespace.** Sections breathe. Don't pack.
- **Sparing color.** Color is *information*, not decoration. The orange means something when it appears.
- **Code is first-class.** Mono blocks aren't an afterthought — they're a hero element. Slides about the product should let code speak.
- **Lowercase comfortable.** "chroma" lowercase in body copy is on-brand; reserve title-case for proper nouns and slide titles.

## 6. Three-modes plan (per the init plan)

Per [[../plans/Init-Chroma-Decks-Client-Site]] § "Three-modes scaffolding from day one — load-bearing": all three slots exist in `theme.css` from the first commit. **Only the light mode carries real values now.** The other two are documented as `TBD — brand-iteration session pending`:

- **`light` (DEFAULT)** → values in §2 above. This is what the user sees.
- **`dark` → TBD.** Likely inverts the neutral scale (`#27201c` → `#fafafa` for surface, etc.) but the warm-black-not-neutral-black character means a naive invert will feel wrong. Iterate in session.
- **`vibrant` → TBD.** Lossless three-modes convention: the "saturated / energetic" mode. For Chroma this probably means promoting `--chart-1` (orange) to a primary surface accent rather than a chart-only color. Iterate in session.

**Scaffolded but stubbed.** A future agent should not interpret the empty `dark`/`vibrant` blocks as a bug to fix — they are deferred work, owned by a follow-up session.

## 7. Logo / wordmark

- **Wordmark SVG:** `https://www.trychroma.com/_next/static/media/chroma-wordmark.0~1c352v-zy35.svg?dpl=dpl_8AttJ8XsDfXgbA5qN3bTYhVN4uzv`
- **Save as:** `chroma-decks/public/brand/chroma-wordmark.svg` during Phase 2.
- **Convention:** never inline the wordmark; always reference the saved SVG so a brand-asset swap is one-file.

## 8. Deck-content source (corpus material)

The PDF at `ai-labs/ChromaDB-v0.0.3.pdf` (175 KB, 34 pp) is **not** the founder's pitch deck — it's an **Alpha Partners investment memo about Chroma**, titled "ChromaDB - Investment Memo | Alpha Partners", dated May 01 2026, marked Confidential. This is **corpus material**, the substantiation layer feeding the deck. **Do not commit** (user instruction). Stage into `chroma-decks/corpus/` during Phase 5; corpus is git-ignored.

### Memo table of contents (for narrative scaffolding)

This is the structural prior for what slides eventually live under `chroma-decks/src/pages/scroll/{deck-slug}/`. The narrative spine is already mapped out:

1. **Executive Summary** — Market Position & Traction · Product & Differentiation · Funding & Business Model · Investment Thesis
2. **Origins** — Developer-First Vector Database Opportunity · Infrastructure Bottleneck · Minutes-Not-Hours Promise · Market Position and Momentum
3. **Opening** — Vector Database Imperative · Market Opportunity and Timing · Differentiated Positioning · Investment Perspective
4. **Organization** — Team Composition and Expertise · Operating Model and Culture · Product Positioning and Adoption
5. **Offering** — Product Architecture and Capabilities · Market Position and Differentiation · Offering Coherence and Go-to-Market Fit
6. **Opportunity**
7. **Risks & What Could Go Wrong**
8. **Market Timing and Enterprise Readiness**
9. **Open-Source Monetization Model**

**Implication:** the *founder's* deck (a separate artifact we still need from the user — see init plan, open questions) will be the **client-side** narrative; the Alpha Partners memo is the **DD-receiving-side** narrative. The deck we build can pull substantiation from the memo without copying its structure.

## 9. Open follow-ups (not blocking the scaffold)

- **Founder's actual deck.** Still not in hand. Plan open-question #2. Once located, also stages into `corpus/`.
- **MemoPop-generated Chroma memos.** Per the engagement context, multiple variants exist. Location TBD. Stage all variants into `corpus/memopop/` once we know where they live.
- **First deck slug.** Plan open-question #1. Suggest `chroma-series-c` or `chroma-pitch-2026` pending user choice.
- **Auth gating in v0.1.** Plan open-question #4. Default to open preview, gate later if needed.
- **Brand-iteration session.** Dedicated session, separate from this scaffold, to land real `dark` and `vibrant` palettes.

## 10. Anti-patterns (don't do)

- **Don't smear all five chart colors across the deck.** They're for chart cells and surgical accents, not slide backgrounds.
- **Don't substitute `#0a0a0a` for `#27201c` in brand contexts.** The neutral black and the warm chroma-black are not interchangeable — the warm tone is identity-load-bearing.
- **Don't add a third typeface.** Inter + IBM Plex Mono is the system. A "display" or "editorial" face would dilute brand-truth.
- **Don't auto-invert for dark mode.** Wait for the brand-iteration session.
- **Don't use Material/M3 semantic-token names in chroma-decks.** trychroma.com uses shadcn semantics; mirror it.

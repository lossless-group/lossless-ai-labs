---
title: "MemoPop AI — Ideogram OG Image Brief"
lede: "Creative brief for generating OpenGraph and changelog hero images via Ideogram. A house-style prefix and suffix that any per-image scene description plugs into so the family stays coherent across the splash page, changelog entries, and context-v notes."
date_created: 2026-05-05
date_modified: 2026-05-06
at_semantic_version: 0.1.0.0
status: Active
augmented_with: Claude Code (Claude Opus 4.7)
category: Blueprint
publish: true
authors:
  - Michael Staton
  - AI Labs Team
tags:
  - Ideogram
  - OpenGraph
  - Creative-Brief
  - Visual-Identity
  - Image-Generation
applies_to: memopop-ai
banner_image: https://ik.imagekit.io/xvpgfijuw/Image-Gin/2026-05/MemoPop_AI_banner_image_1778062509552_xx6m5xkS4.webp
portrait_image: https://ik.imagekit.io/xvpgfijuw/Image-Gin/2026-05/MemoPop_AI_portrait_image_1778062510781_U9YgfZq12.webp
square_image: https://ik.imagekit.io/xvpgfijuw/Image-Gin/2026-05/MemoPop_AI_square_image_1778062511281_HsQ6nGdqD.webp
from: "memopop-ai"
from_path: "context-v/MemoPop-Creative-Brief.md"
---
# MemoPop AI — Ideogram OG Image Brief

A creative brief for generating MemoPop's OpenGraph and changelog hero images. Wrap any per-image scene description in the prefix and suffix below so the family stays coherent across splash, changelog entries, and context-v notes.

## Tool settings

- **Aspect ratio:** 1200×630 (use 16:9 — close enough)
- **Style:** Design or Illustration (never Realistic)
- **Magic Prompt:** OFF — these prompts are tuned

## Prefix

Paste this before your scene description.

```
Editorial technical illustration in the lineage of a precision blueprint
cutaway or exploded axonometric — schematic drawing rendered as a polished
modern asset, not a sketch. The subject is the central object; everything
else is annotation, structural lines, and soft volumetric depth. 
```

## Your scene

A single descriptive paragraph. Concrete nouns, named components, optional callout labels in quoted strings (Ideogram will render quoted strings as monospaced text in the image).

Examples already in the repo's `image_prompt:` frontmatter fields:

A perspective view of an investment memo with charts and graphs is sitting on a desk, it looks much larger than normal relative to the desk.  The charts and graphs are beaming up into the room, as if a magical box has been opened -- think Raiders of the Lost Ark style escaping.

> A blueprint cutaway of a desktop application's runtime — translucent native window on the left, a glowing localhost wire to a Python sidecar on the right, version-numbered folders stacking like floors of a building, a labeled `.logs/` drawer at the bottom.

> An exploded-axonometric drawing of a small Astro site on a workshop bench, with five tributary cables labeled 'orchestrator', 'native', 'web-app', 'site', 'monorepo' converging into it; a tri-state toggle switch hovers above, casting three colored shadows.

## Suffix

Paste this after your scene description.

```
House palette — strict: deep ink ground #0a0a14; cyan-electric #04e5e5 and
aqua-bright #6fffd6 for primary structures and energized beams; plum-electric
#bf23f7 and cerise #ec3a8c for secondary accents and signal moments;
chartreuse #c8ff2e reserved for the single most important callout; bone
#f6f1e6 for any paper or cream passages. Treat color as functional — each
hue carries information about a layer or stage, never decorative.

Light and surface: soft directional uplight from below-left in violet-to-cyan,
warm rim from upper-right in amber, cool ambient fill. Lines monoline 1.5pt,
crisp; selective inner glow on energized elements; restrained drop shadows;
no texture noise.

Typography for any in-image labels: monospaced — JetBrains Mono or similar —
at small scale in cyan with low opacity, set on short horizontal leader-lines
terminated by small filled dots. For any display word in the image, a
high-contrast modern serif similar to Fraunces, used sparingly. Never
sans-serif marketing type.

Composition: hero subject centered or golden-ratio offset, generous negative
space, technical annotations radiating outward, ~8% safe interior margin on
all sides for OG text overlay. 1200×630 landscape.

Voice: VC-grade editorial — sophisticated, credible, restrained, built for an
investment-professional audience that respects craft. Nerdy-honest. Not slick.

Avoid: stock-photo realism; cliché AI imagery (glowing brains, neural-network
webs, floating abstract orbs, generic data streams, magnifying glasses on
charts); corporate handshakes; hands on keyboards; overlapping logos;
watermarks; lens flares; motion blur; busy generic gradient meshes; cyberpunk
neon as a substitute for design; hyperrealistic faces; 2018-SaaS-hero
illustration vibes; isometric people. No emojis in the image.
```

## Palette reference

| Role | Token | Hex |
|---|---|---|
| Ground (default / dark) | `--color__ink` | `#0a0a14` |
| Ground (vibrant) | `--color__obsidian` | `#050510` |
| Ground (light / boardroom) | `--color__bone` | `#f7f3e9` |
| Primary structure | `--color__cyan-electric` | `#04e5e5` |
| Primary glow | `--color__aqua-bright` | `#6fffd6` |
| Secondary accent | `--color__plum-electric` | `#bf23f7` |
| Energy / signal | `--color__cerise` | `#ec3a8c` |
| Single hero highlight | `--color__chartreuse` | `#c8ff2e` |
| Warm callout | `--color__amber` | `#ffb84d` |
| Paper / cream | `--color__bone` | `#f6f1e6` |
| Dark-mode primary | `--color__cyan-deep` | `#028f8f` |
| Dark-mode accent | `--color__plum-deep` | `#6b1496` |

These mirror Tier 1 of `apps/memopop-site/src/styles/theme.css`. Keep the brief and the theme in sync — if a token name or value moves, update both.

## Worked example — fully assembled

Prefix + scene + suffix becomes one continuous prompt:

> Editorial technical illustration in the lineage of a precision blueprint cutaway or exploded axonometric — schematic drawing rendered as a polished modern asset, not a sketch. The subject is the central object; everything else is annotation, structural lines, and soft volumetric depth. Subject: a stylized "M" mark composed of three vertical agent-stems of varied heights, each topped with a glowing pop-dot, sitting on a single horizontal baseline that reads as an investment memo; behind it, a faint exploded view of a desk-scale orchestrator, its agent threads arcing inward toward the M. House palette — strict: deep ink ground #0a0a14; cyan-electric #04e5e5 and aqua-bright #6fffd6 for primary structures and energized beams; plum-electric #bf23f7 and cerise #ec3a8c for secondary accents and signal moments; chartreuse #c8ff2e reserved for the single most important callout; bone #f6f1e6 for any paper or cream passages. *[…rest of suffix…]*

## Per-mode variants

The default brief assumes the **dark / operator** ground. Two variants for when the asset needs to live in a different mode:

### Vibrant variant

Swap `#0a0a14` ground for `#050510`. Lift saturation across the board. Chartreuse `#c8ff2e` becomes the primary structure color; cerise `#ec3a8c` becomes the energy color. Composition rules stay the same. Use this for demo/launch posts and conference assets.

### Boardroom (light) variant

Swap the ground for bone `#f7f3e9`. Primary structure becomes plum-deep `#6b1496`; primary glow becomes cyan-deep `#028f8f`; warm callout becomes amber-deep `#c97800`. Everything else stays. Use this for printed/PDF assets and slides shown to LPs.

## Quick checklist before generating

- [ ] Aspect 16:9 (≈ 1200×630)
- [ ] Style is *Design* or *Illustration*, not *Realistic*
- [ ] Magic Prompt is OFF
- [ ] Scene names concrete components (not "agents" or "data" abstractly)
- [ ] Hex colors from the palette table appear in the prompt
- [ ] No avoided clichés in the scene description
- [ ] ~8% interior margin reserved for OG text overlay

## Where this is used

- `apps/memopop-site/changelog/*.md` — `image_prompt:` frontmatter on each entry feeds the scene
- `context-v/**/*.md` — same field; rendered above the title on the detail page (when present)
- Splash hero (future) — when we eventually generate a static OG image for the root URL

## See also

- `apps/memopop-site/src/styles/theme.css` — Tier 1 named tokens (source of truth for the palette)
- `apps/memopop-site/src/components/MemoMark.astro` — the "M" mark referenced in the worked example

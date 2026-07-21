---
name: overlay-svg-text
description: How to overlay on-brand SVG text on Lossless OG / share imagery — Hack Bold gradient-filled h1, thin sans eyebrow, Poor Story handwritten note. Use whenever a generated OG image needs title/eyebrow/sub text composited on top before it ships (the empty-region zone from `generate-consistent-og-images` is the canvas this skill paints into), whenever an unfurl preview looks too anonymous without a wordmark or subtitle, whenever a fundraise-deck slide needs a brand-flavored title overlay on a hero image, whenever the user says "overlay text on the OG image", "add a title to the banner", "make the unfurl say something", "drop a wordmark on this", or names this skill directly. Encodes the brand-wide type system (Hack Bold for gradient h1, thin sans for eyebrow, Poor Story for handwritten notes), the per-site gradient-from-DESIGN.md discipline (the brand SVGs are raster-baked references, not editable gradient sources — the editable gradient lives in each project's DESIGN.md), the canonical SVG fill-with-gradient pattern (simpler and more portable than mask/union for this use case), and the sharp-based compositing pipeline that writes JPEG-out for delivery per the open-graph-share-seo-geo skill.
from: "dididecks-ai"
from_path: "context-v/agent-skills/overlay-svg-text/SKILL.md"
---
# Overlay SVG Text on Brand Imagery

> Two layers of brand identity on every share image. The base image — generated via `generate-consistent-og-images` — already follows the empty-region-first composition rule, leaving the top 1/3 of the frame deliberately clean. **This skill paints that clean zone** with three text elements: a thin sans eyebrow, a Hack-Bold gradient-filled h1, and a Poor Story handwritten note. Everything else (layout, colors, font weights) is locked at the project's `DESIGN.md` level.

## When to use this skill

- An OG image was just generated and needs a wordmark / title overlay before it ships
- An existing OG image looks too anonymous in unfurls — needs a brand-flavored title or subtitle
- A fundraise-deck slide / hero illustration needs a brand-consistent title overlay
- A user-facing share preview is launching and needs the project's name + a one-liner baked in
- The user says: "overlay text on this", "add a title to the banner", "make the unfurl say something", "drop a wordmark on this", "compose the OG with text"

## The Lossless brand type system for overlays

Three text elements, in canonical vertical order from top of frame to bottom of overlay zone:

| Element | Font | Weight | Color | Notes |
|---|---|---|---|---|
| **Eyebrow** | Project's display sans (or Inter as fallback) | Thin (200) or Light (300) | white at 70–80% alpha, OR `--color-text-soft` | Often uppercase with wide tracking (`0.18em–0.24em`); the project's `typography.eyebrow` token wins if present |
| **H1 (gradient)** | **Hack Bold** (Hack Nerd Font Mono Bold is what most Lossless dev machines have installed) | Bold (700) | **gradient-filled** from the project's `imagery.gradient` or `components.gradient-text.background` in DESIGN.md | Monospaced + gradient is the brand's "data" aesthetic — short noun-phrase or shell-command-style; never sentence-case prose |
| **Note (handwritten)** | **Poor Story** (Google Fonts, Korean handwriting family) — preferred. Any cartoonish handwriting font is acceptable as fallback (e.g. Caveat, Patrick Hand, Indie Flower) | Regular | **white** (`#ffffff`) — almost always | The handwriting/Hack contrast is the brand move; never serif, never another mono |

The three elements together compose the brand's signature: **clean thin sans label → monospaced gradient title → cartoonish white handwritten phrase**. The handwriting/mono contrast is the most-defining axis; don't lose it by going all-sans or all-mono.

## Where the gradient comes from

**Not** from `trademark__The-Lossless-Group--Vibrant.svg` or `gradient__The-Lossless-Group--Rounded-Rectangle.svg`. Those files are raster-baked exports (each is a `<clipPath>` of glyph/shape paths with a base64 JPEG as the fill) and the gradient inside them isn't an editable `<linearGradient>` element — it's pixel data. Treat them as **visual reference only**.

The editable gradient for any given project lives in that project's `DESIGN.md`. Look in this order:

1. **`imagery.gradient`** — a Lossless extension key if the project has declared an OG-specific gradient
2. **`components.gradient-text.background`** — most Lossless splashes define this for their hero gradient-text move
3. **The brand-spine colors** (`accent`, `accent-warm`, `thread` — or `primary`, `secondary`, `tertiary`) at 0% / 55% / 100% stops

For the **lossless-agent-skills** splash, that resolves to:

```
linear-gradient(90deg, #5eead4 0%, #fbbf24 55%, #e879f9 100%)
                       (teal)      (amber)        (magenta)
```

For the **ai-labs** splash:

```
linear-gradient(95deg, #ffb733 0%, #5cc8ff 55%, #d96fff 100%)
                       (sodium)    (cyan)        (plum)
```

Per-project gradient + brand-wide type system = images that look like family with a project on each member. **Use Lossless Group's brand gradient (teal/violet/etc. — the JPEG-baked one) only when the overlay belongs to The Lossless Group itself**, e.g. a corporate splash, an "About" page, a consulting-firm asset. Site-specific imagery uses site-specific gradients.

## The SVG-text-with-gradient technique

Two compatible patterns. The first is the default; the second is for the rare cases where you need the gradient to extend past the letterforms or to be clipped by a more complex shape.

### Pattern A — `fill="url(#gradient)"` on `<text>` (default)

```xml
<svg width="1312" height="736" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#5eead4"/>
      <stop offset="55%"  stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#e879f9"/>
    </linearGradient>
  </defs>
  <text x="64" y="120"
        font-family="Hack Nerd Font Mono, Hack, ui-monospace, monospace"
        font-weight="700"
        font-size="96"
        fill="url(#brand)">
    Agent Skills
  </text>
</svg>
```

The gradient renders inside each glyph's bounding box. Simple, portable across librsvg / resvg / browser / sharp. **This is what 95% of overlays should use.**

### Pattern B — gradient rectangle clipped by text (mask/union style)

```xml
<defs>
  <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">...</linearGradient>
  <clipPath id="text-clip">
    <text x="64" y="120"
          font-family="Hack Nerd Font Mono"
          font-weight="700"
          font-size="96">
      Agent Skills
    </text>
  </clipPath>
</defs>
<rect x="0" y="0" width="1312" height="200"
      fill="url(#brand)"
      clip-path="url(#text-clip)"/>
```

Use this when the gradient should sweep across a region wider than the text itself (e.g., the gradient should flow as if it were on a banner behind the text but be visible only through the letterforms). For all simple cases, Pattern A is shorter and renders identically.

## The compositing pipeline

The base OG image is a JPEG; the overlay is an SVG; the output is a JPEG with the SVG painted on top. The cleanest tool for this is `sharp` (Node, librsvg under the hood). The canonical script lives at `templates/compose-overlay.mjs` in this skill.

```bash
# One-time install at the splash project root:
pnpm add -D sharp

# Then run:
node templates/compose-overlay.mjs \
  --base public/ogimage__Lossless-Agent-Skills--BannerImage.jpg \
  --overlay overlays/banner.svg \
  --out public/ogimage__Lossless-Agent-Skills--BannerImage--overlaid.jpg \
  --quality 90
```

The script:
1. Reads the base JPEG and gets its dimensions
2. Reads the SVG, validates that its `width`/`height` match the base (or scales it)
3. Composites the SVG at (0, 0) — the SVG positions its own elements internally
4. Writes the result as JPEG at the chosen quality (default 90; the `open-graph-share-seo-geo` skill targets ~85–95 for OG)
5. Archives the prior canonical JPEG to `.ogimage-archive/<name>--<YYYY-MM-DD>.jpg` first if the output path already exists

### Alternative renderers (when sharp isn't an option)

- **`rsvg-convert`** (librsvg CLI, Homebrew): `rsvg-convert overlay.svg -o overlay.png` then composite with `ffmpeg -i base.jpg -i overlay.png -filter_complex "[0][1]overlay=0:0" out.jpg`
- **`resvg`** (Rust, faster than librsvg): `resvg overlay.svg overlay.png` + same ffmpeg step
- **ImageMagick**: `convert base.jpg overlay.svg -composite out.jpg` — works but text rendering is less reliable than librsvg

Sharp is the documented default because it's already in the Astro Knots ecosystem and produces byte-identical output to librsvg-CLI without the two-step PNG→JPEG dance.

## Font availability

Sharp's renderer (librsvg under the hood) reads fonts via fontconfig on Linux/macOS and via the system font store on Windows. For the local-dev case where fonts are installed in `~/Library/Fonts/` (macOS) or `~/.fonts/` (Linux), no extra step is needed — just reference the family name in the SVG's `font-family` attribute.

For CI builds (GitHub Actions, Vercel build container, etc.) where the host doesn't have Hack or Poor Story installed, **embed the WOFF2 binary as a data URL inside the SVG**:

```xml
<defs>
  <style type="text/css">
    @font-face {
      font-family: 'Hack Bold';
      src: url(data:font/woff2;base64,d09GMgABAAAA...) format('woff2');
      font-weight: 700;
    }
    @font-face {
      font-family: 'Poor Story';
      src: url(data:font/woff2;base64,d09GMgABAAAA...) format('woff2');
      font-weight: 400;
    }
  </style>
</defs>
```

Recipe to generate the data URL:

```bash
# Convert TTF/OTF to WOFF2 (smaller, faster decode)
# pnpm dlx fonttools (or use python -m fontTools.ttLib if installed)
fonttools ttLib --woff2 ~/Library/Fonts/HackNerdFontMono-Bold.ttf
# Then base64-encode:
base64 -i HackNerdFontMono-Bold.woff2 | tr -d '\n' > hack-bold.b64
```

A WOFF2-embedded SVG balloons by ~80–250 KB (Hack Bold is ~200 KB WOFF2; Poor Story is ~80 KB WOFF2). Acceptable for a one-time composited PNG/JPEG output — the resulting raster is the only thing that ships, the SVG is intermediate.

## Layout — where the three elements sit inside the empty-region zone

The base OG image was generated with `Top 1/3 of frame is empty negative space` as the locked composition. The overlay's safe zone is therefore the top third of the canvas. Within that:

```
┌────────────────────────────────────────────────┐ ← y = 0
│  ┌─ padding 6% of height ─┐                    │
│  │                         │                    │
│  ┃ EYEBROW · THIN · ALLCAPS                     ← ~12% down (eyebrow baseline)
│  │                         │                    │
│  ┃ Gradient H1 Title       ← ~22% down (h1 baseline; bold mono)
│  │                         │                    │
│  ┃ ✎ a handwritten phrase, white  ← ~30% down  │
│  │                         │                    │
└──┴─────────────────────────┴────────────────────┘ ← y = floor(height / 3)
       ↑                                          ↑
   left padding 5–6%                       right edge stays clean
```

Vertical positions are expressed as percentages of the canvas height so the same SVG template re-aspects cleanly when fed different dimensions. For the four canonical aspect ratios from `generate-consistent-og-images`:

| Format | Dimensions | Top-zone height | Eyebrow y | H1 y | Note y |
|---|---|---|---|---|---|
| `BannerImage` | 1312×736 | 245 px | ~88 px | ~162 px | ~221 px |
| `BannerImageTall` | 896×1120 | 373 px | ~134 px | ~246 px | ~336 px |
| `PortraitImage` | 736×1312 | 437 px | ~157 px | ~289 px | ~394 px |
| `SquareImage` | 1024×1024 | 341 px | ~123 px | ~225 px | ~307 px |

The compose script computes these from the base image dimensions; never hard-code pixel positions for a specific aspect ratio in the template SVG. **Author the SVG once with percentage-based y-values; the script substitutes them per output.**

## The flow

Five steps. Steps 1–2 are setup; steps 3–5 are the per-image work.

### Step 1 — Confirm the base imagery is ready

The base JPEGs must already exist (output of `generate-consistent-og-images`). If they don't, hand off to that skill first. The overlay paints onto what's there; it can't conjure a base.

### Step 2 — Resolve the gradient

Read the project's `DESIGN.md`:

1. Look for `imagery.gradient` (an extension key on some projects)
2. Fall back to `components.gradient-text.background`
3. Fall back to constructing `linear-gradient(<angle>, <accent>, <accent-warm>, <thread>)` from the project's brand-spine semantic colors

For the **lossless-agent-skills** splash:

```css
linear-gradient(90deg, #5eead4 0%, #fbbf24 55%, #e879f9 100%)
```

For **ai-labs**:

```css
linear-gradient(95deg, #ffb733 0%, #5cc8ff 55%, #d96fff 100%)
```

Translate to SVG `<linearGradient>` stops; `x1/y1/x2/y2` derives from the CSS angle.

### Step 3 — Author the overlay SVG

Use `templates/overlay.svg` as the starting point. Fill in:

- The gradient stops (from step 2)
- The eyebrow text + the project's display-sans family
- The H1 text (short — 1–3 words; the gradient sweeps across one phrase, not a paragraph)
- The handwritten note (a phrase, never a full sentence; ≤32 chars reads best at any aspect ratio)
- The canvas `width` and `height` (match the base image exactly)

For multi-aspect runs (BannerImage + BannerImageTall + PortraitImage + SquareImage), author **one SVG template** with percentage-based positions and let the compose script re-render it per output. Don't hand-author four separate SVGs.

### Step 4 — Composite

Run `node compose-overlay.mjs --base <jpg> --overlay <svg> --out <jpg>` (or the per-format loop variant in the same script).

The script archives any existing canonical at `.ogimage-archive/<name>--<YYYY-MM-DD>.jpg` before writing the new one (per the `generate-consistent-og-images` preservation discipline).

### Step 5 — Verify visually

Open the output JPEG. Check:

- **Eyebrow is readable but not loud** — wide tracking + thin weight + 70–80% white alpha. If it's the loudest element, the rest of the brand hierarchy collapses.
- **H1 gradient is visible inside the letterforms, not bleeding outside them** — if the gradient looks pixelated or banded, the gradient stops are too close together or the canvas is too narrow.
- **Handwritten note reads as a note, not a headline** — Poor Story at the right size feels like a margin scribble. If it looks like a second headline, scale down or pick a more whimsical handwriting fallback.
- **No clipping at the safe-zone boundary** — the bottom of the handwritten note should be ≥1.5em above the subject's top edge in the base image.

If the overlay clips the subject (text overlapping the robots / bench / terminal in the base), the base image's empty-region zone wasn't large enough. Re-generate the base via `generate-consistent-og-images` with a longer "Top 1/3" clause or `Top 40%` in the prompt; don't shrink the overlay text below readable size to work around it.

## Anti-patterns

- **Cloning the Lossless Group brand SVGs as the gradient source.** They're raster-baked — there's no real gradient to extract, only a JPEG inside a clipPath. Use the project's DESIGN.md gradient instead. The brand SVGs are visual reference for the *aesthetic* (mono + gradient), not source data.
- **Putting Hack on the eyebrow or the handwritten note.** Hack is reserved for the gradient H1. The mono/handwriting contrast is the brand move; collapsing both to mono erases it.
- **Sentence-case prose in the H1.** Gradient on a phrase that wraps to two lines breaks the gradient's continuity — letters at the start of line 2 read in colors that don't follow from where line 1 left off. Keep H1 to 1–3 words, one line.
- **A handwritten note longer than ~32 characters.** The handwriting font becomes hard to read past that length; the move is "marginalia," not "subtitle."
- **Hard-coded pixel positions for a specific aspect ratio in the SVG template.** Use percentage-based y-values + let the compose script re-render per output. Otherwise you maintain four separate SVGs and they drift.
- **Outputting PNG when the deliverable is OG / share imagery.** Per the `open-graph-share-seo-geo` skill: JPEG-over-WebP for unfurler compatibility. Sharp's `.jpeg({ quality: 90 })` is the canonical output step.
- **Overwriting the canonical OG JPEG in place.** Same preservation rule as `generate-consistent-og-images` — archive the prior bytes to `.ogimage-archive/<name>--<YYYY-MM-DD>.jpg` before writing the new one. The unfurler URL stays stable; byte history survives.
- **Embedding fonts every time when running locally.** Wasteful when fontconfig already finds Hack and Poor Story in `~/Library/Fonts/`. Embed only for CI / cross-machine portability or when the SVG itself is the deliverable.
- **Letting the eyebrow tracking go below `0.12em`.** The brand eyebrow is wide-tracked on purpose; tight tracking reads as body type and breaks the hierarchy.
- **Choosing a serif or another mono as the handwriting fallback when Poor Story is unavailable.** The whole point of the handwritten element is the *contrast* against Hack. A serif or another mono erases the contrast. Pick Caveat, Patrick Hand, Indie Flower, Shadows Into Light, etc. — cartoonish-handwriting only.

## See also

- `templates/overlay.svg` — the canonical SVG scaffold with placeholders for gradient stops, eyebrow, h1, and handwritten note
- `templates/compose-overlay.mjs` — the canonical Node script that composites SVG onto JPEG via sharp, with multi-aspect loop + archive discipline
- `generate-consistent-og-images` skill — the upstream skill that produces the base JPEGs this skill overlays text onto; defines the empty-region-first composition that creates the overlay safe zone
- `maintain-design-md` skill — where the gradient stops actually live (`components.gradient-text.background` or `imagery.gradient`); this skill is a *consumer* of those tokens, not an author
- `open-graph-share-seo-geo` skill — the delivery-side discipline (JPEG-over-WebP, cache headers, the `og:image:type` invariant); cares that the overlaid JPEG ends up on the right URL, not how the text was painted
- Google Fonts — Poor Story: <https://fonts.google.com/specimen/Poor+Story>
- Source Foundry — Hack: <https://sourcefoundry.org/hack/>

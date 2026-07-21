---
title: Humain Ventures — Brand Extraction & Deck Redesign Notes
type: exploration
status: in-progress
fetched_at: 2026-06-06
upstream_url: https://www.humain.vc/
related_files:
  - ../../DESIGN.md
  - ../../corpus/management-supplied/2025-10-17_Humain-Deck-VCLab.pdf
from: "dididecks-ai/humain-vc-decks"
from_path: "context-v/explorations/Humain-Brand-and-Deck-Notes.md"
---
# Humain Ventures — Brand Extraction & Deck Redesign Notes

This exploration documents how `DESIGN.md` was derived from humain.vc and what we know about the deck redesign engagement at intake.

## Extraction provenance

**humain.vc** is a Vite-built SPA. The 1KB HTML shell loads a single CSS bundle:

- Production CSS: `https://www.humain.vc/assets/index-zwbOMG5o.css` (~64KB, fetched 2026-06-06)
- Production JS: `https://www.humain.vc/assets/index-DcRKxIMB.js` (~347KB)

Because routing is client-side, sub-pages (`/thesis`, `/portfolio`, `/leadership`) cannot be crawled by HTML scrapers — the same bundle serves every URL. All content surfaced during extraction came from the homepage's hydrated DOM via Tavily Extract (advanced mode) plus the raw CSS bundle.

### Token shape (matches shadcn)

humain.vc uses shadcn's token vocabulary verbatim:
- HSL space-separated format (`H S% L%`)
- Semantic names: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`
- Plus project-specific named tokens: `--bio-green`, `--bio-green-glow`, `--deep-navy`, `--hero-bg`, `--navy-mid`, `--section-dark`

Two-tier mapping in `DESIGN.md` mirrors this exactly so a port to `theme.css` is mechanical.

### Palette summary

The site is **two colors plus neutrals**: deep navy (`hsl(220 50% 8%)` ≈ `#0a1326`) and bio green (`hsl(164 60% 40%)` ≈ `#29a380`). Everything else is grayscale or pale-green accent. The chroma-decks DESIGN.md describes a similar two-pop-color discipline; HUMAIN is even stricter — there is no equivalent of chroma's amber/ocean chart colors.

### Typography

- **Display:** Space Grotesk (weights 400/500/600/700)
- **Body:** Inter (weights 400/500/600/700)
- **Mono:** generic ui-monospace fallback stack (no opinionated mono shipped)

Note: humain.vc does **not** ship a custom monospace family. If the deck Tech-Bio slides feature code blocks or technical citations, we have latitude to introduce IBM Plex Mono or similar without violating brand truth, but document the addition here when it happens.

## What's missing from the upstream

The following could not be extracted from humain.vc and need a follow-up:

1. **SVG wordmark.** Only `favicon.png` and `favicon.ico` ship. The deck PDF in `corpus/management-supplied/` likely contains the wordmark — extract via Affinity Designer or `pdftk burst` + Inkscape trace, or request a clean SVG from the client.
2. **Dark-mode palette.** The site is light-only with dark sections. A standalone dark mode (deep-navy-as-page-surface) is a brand-iteration decision deferred per the [[theme-system]] skill's three-modes contract.
3. **Vibrant-mode palette.** Not yet authored. See above.
4. **Iconography conventions.** No icon system is visible in the rendered homepage. Probably introduced via Lucide-style line icons by default; revisit when building deck slides.
5. **Photo treatment beyond portraits.** Hero background (`hero-bg-BgFvsHtj.png`) is the only abstract imagery captured. Treatment direction (molecular forms, computational overlays, etc.) needs sign-off before generative imagery work.

## Brand voice signals captured

From the homepage hydrated content:

- Tagline: **"The Age of Biology Has Begun."**
- Positioning: **"AI is turning biology into an engineering discipline."**
- Distinguisher: **"This is not Biotech. It is Tech Bio."**
- Three thesis pillars:
  1. **Tech Bio** — Biology Is Becoming an Engineering Discipline
  2. **The Lifespan Project** — Fixing the Incentives (prevention-first health systems)
  3. **Consumer Health** — Consumers Should Choose (wearables + continuous biosensing)
- Founder-facing voice: **"Early partner · Deep technical underwriting · High-conviction support"**
- Pull-quotes featured: Jensen Huang (NVIDIA), Eric Schmidt (Google), Steve Jobs (Apple) — all centered on AI×biology

These map directly to the deck-redesign thesis surfaces. The deck PDF (intake-supplied) should be cross-referenced against these pillars to identify slot-level redesign opportunities.

## Next steps

1. **Page-burst the intake deck.** `pdftk` or similar to get per-page PNGs from `corpus/management-supplied/2025-10-17_Humain-Deck-VCLab.pdf` for slide-by-slide planning.
2. **Extract the wordmark.** Either from the deck PDF or by asking the client.
3. **Scaffold the Astro project.** Match the chroma-decks layout: `src/data/{decks,slides,play-availability}.ts`, `src/styles/theme.css` (port from this DESIGN.md), `src/pages/scroll/<deck>/<variant>/index.astro`.
4. **Install the auth surface** from the calmstorm pattern (`Install-Auth-Surface-from-Calmstorm-Pattern.md` plan, to be ported).
5. **First Scroll-UI variant.** Probably `pitch/proto/` — direct port of the intake deck into responsive sections, then iterate to `enhanced-v1+`.

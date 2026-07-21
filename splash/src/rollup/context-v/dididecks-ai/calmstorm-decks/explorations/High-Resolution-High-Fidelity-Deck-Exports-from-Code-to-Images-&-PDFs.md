---
title: "High-Resolution, High-Fidelity Deck Exports — From Code to Images & PDFs"
authored_by: Michael Staton & Claude (Opus 4.7, 1M context)
date: 2026-05-07
date_modified: 2026-05-08
semantic_version: 0.0.1.0
status: Shipped v1 — usable for internal sharing, known geometric limitations
category: Exploration
tags:
  - Deck-Exports
  - PDF-Generation
  - Headless-Browser
  - Screenshot-Pipeline
  - Print-To-PDF
  - Playwright
  - Puppeteer
  - Static-Site-Constraints
  - Known-Limitations
from: "dididecks-ai/calmstorm-decks"
from_path: "context-v/explorations/High-Resolution-High-Fidelity-Deck-Exports-from-Code-to-Images-&-PDFs.md"
---
## The ask, in one line

Send the three scroll decks (`/thesis`, `/thesis/version-2`, `/thesis/version-3`)
and the slide-by-slide variant chooser to a busy LP **as a PDF or image bundle**,
because the gated-site auth flow is too much friction to ask of them right now.
Solve it once, well, because every Astro Knots deck-style site will need this.

## The honest reframing

The user already named the asymmetry: this is a one-shot for the LP today, but
**deck export from a code-driven site is a recurring need across the
calmstorm-decks pattern** — which we expect to replicate. So the right framing
isn't "what's the fastest way to get screenshots tonight" but "what's the
pipeline we want to live with for every deck site, and is tonight's send the
right moment to invest in it?"

A few hard truths to set up the option space:

1. **No PDF library "gets it perfect" out of the box for design-heavy decks.**
   Custom fonts, gradients, full-bleed images, transforms, scroll-triggered
   layouts — every renderer trips on at least one of these. The honest pipeline
   is: render in a real browser, capture, then assemble.
2. **Headless Chromium is the only renderer with full parity to what the LP
   sees in their own Chrome.** Anything that re-implements layout (wkhtmltopdf,
   pure-JS rasterizers like `html2canvas`, `dom-to-image`) will diverge on
   subtle but expensive details (font metrics, CSS grid edge cases,
   `backdrop-filter`, modern color functions).
3. **The site is gated.** Whatever pipeline we pick has to either run against
   `localhost` (no gate) or know how to authenticate — cookie injection,
   visiting the cover with the code, or running against a build with the gate
   bypassed.
4. **Two output shapes, not one.** Scroll decks want **one tall image per deck
   variant** (or a paginated PDF that mimics scrolling). Per-slide pages want
   **one image per slide**, possibly stitched into a PDF. Different tools
   optimize for different shapes.
5. **Fonts are the silent killer.** Whatever we choose must wait for
   `document.fonts.ready` before snapping, or every export ships with a brief
   FOUT flash baked in.

## Options on the menu

Roughly ordered from "lowest ceremony" to "most pipeline."

### A. Manual browser print → "Save as PDF"

Open each deck in Chrome, ⌘P, "Save as PDF," send it.

**Pros:**
- Zero new dependencies. Zero code.
- Uses the browser the LP would use anyway.
- Fastest path to "send them something tonight."

**Cons:**
- Manual every time. Three decks × every revision = real human cost.
- Page break placement is at the mercy of the browser. Scroll decks become
  awkward multi-page PDFs with mid-section breaks unless we engineer
  `page-break-inside: avoid` and `@page` rules — which we haven't.
- No control over device pixel ratio; PDFs look fine but screenshots taken from
  the same flow are 1x by default.
- No automation to roll into the build.

### B. Manual full-page screenshots via Chrome DevTools

DevTools → ⌘⇧P → "Capture full size screenshot." One PNG per deck. Optionally
combine in Preview (drag PNGs into one PDF).

**Pros:**
- Captures the whole scroll deck as a single tall PNG, which is honestly the
  most faithful representation of a scroll narrative.
- Retina if your display is Retina.
- Zero code.

**Cons:**
- Manual. Three decks tonight is fine; thirty over the project lifetime is not.
- DevTools full-page capture has historically had quirks at extreme heights
  (>16k pixels) — some scroll decks may exceed this.
- Stitching PNGs into a PDF in Preview is fine but loses any selectable text;
  the PDF becomes purely raster.

### C. Headless Chromium `--print-to-pdf` from the CLI

`chrome --headless --print-to-pdf=out.pdf --no-margins http://localhost:4321/thesis`

**Pros:**
- One-line invocation, scriptable.
- Selectable text in the output.
- No npm dependency; uses installed Chrome.

**Cons:**
- Same page-break problems as Option A — scroll decks paginate however Chrome
  decides unless we add print CSS.
- Limited control: you can't easily wait for fonts, scroll-triggered animations,
  or lazy images before snapping.
- No first-class device pixel ratio control for raster output.
- CLI flags drift between Chrome versions.

### D. Playwright — `page.pdf()` for PDFs, `page.screenshot()` for images

Spin up Chromium via Playwright, navigate, wait for `networkidle` and
`document.fonts.ready`, then call `page.pdf({ printBackground: true })` or
`page.screenshot({ fullPage: true, type: "png" })`.

**Pros:**
- **First-class waiting primitives**: wait for fonts, network, custom selectors,
  arbitrary JS conditions.
- `deviceScaleFactor: 2` (or 3) yields crisp Retina raster output.
- Both PDF and PNG from the same script — produce both deliverables in one run.
- Cookie injection trivial: `context.addCookies([...])` to bypass the gate.
- Same browser engine the LP uses.
- Maintained, well-documented, modern.
- Easy to iterate: a small `scripts/export-decks.ts` that loops through a list
  of routes.

**Cons:**
- Adds a dev dependency (Playwright + a Chromium binary, ~150MB).
- `page.pdf()` only works in headless Chromium — fine for our case, but worth
  knowing.
- Page breaks in the PDF still need print CSS engineering for scroll decks to
  paginate cleanly. Without it, PDFs from scroll pages look like one tall
  ungapped column or break awkwardly.
- Custom transforms / `position: sticky` / scroll-triggered layouts may render
  differently in print vs. screen — needs verification.

### E. Puppeteer — same shape as Playwright

`puppeteer.launch()` → `page.goto()` → `page.pdf()` / `page.screenshot()`.

**Pros:**
- Identical capability set to Playwright for our needs.
- Smaller surface area if all you want is Chrome.

**Cons:**
- Maintained but increasingly second-fiddle to Playwright in the broader
  ecosystem (Microsoft is pouring effort into Playwright; Google's investment
  in Puppeteer is less aggressive).
- No appreciable advantage over Playwright for this use case.
- Default download is a recent Chromium; locking to a specific version is
  fiddlier than Playwright.

### F. Decktape (and similar slide-specific exporters)

Decktape is a Node CLI specifically for exporting slide decks (Reveal.js,
impress.js, deck.js, etc.) to PDF. It uses Puppeteer under the hood and knows
how to step through slides.

**Pros:**
- Purpose-built for decks. Handles slide-by-slide pagination automatically if
  the framework matches.
- Mature.

**Cons:**
- **Doesn't know our framework.** calmstorm-decks is custom Astro, not
  Reveal.js. Decktape's "generic" plugin can sometimes work via keypress
  navigation, but our scroll-decks aren't keypress-driven and our per-slide
  pages aren't a single SPA. Adapter work required.
- Likely more setup time than rolling our own Playwright loop.

### G. Pageres / Pageres-CLI

Sindre Sorhus's `pageres` is a screenshot CLI. Wraps Puppeteer.

**Pros:**
- One-liner per URL.
- Good for static, full-page PNGs of arbitrary URLs.

**Cons:**
- Less control than direct Playwright/Puppeteer when we want font waits,
  cookie injection, or custom DPRs beyond the basic.
- No PDF output. Image-only.
- Adds a wrapper between us and the browser primitives we'd want anyway.

### H. Image-to-PDF stitching (`sharp` + `pdf-lib`, or ImageMagick)

Capture per-slide PNGs (via D, E, or B), then assemble into a PDF with
`pdf-lib` (pure JS) or ImageMagick's `convert *.png deck.pdf`.

**Pros:**
- The PDF *exactly* matches the captured pixels — no print-CSS surprises.
- Cleanest path for **per-slide** deliverables: one PNG per slide → one PDF
  page per slide.
- Page sizing is whatever you make it (16:9 for slides, tall narrow for scroll
  variants if you want one-PDF-per-deck).

**Cons:**
- The output PDF is purely raster — no selectable text, no copy-paste.
- Two-step pipeline (capture, then stitch). More moving parts than `page.pdf()`.
- For scroll decks specifically, "one giant tall page" PDF is technically
  correct but awkward to read on a normal PDF reader. Slicing the tall PNG
  into letter-sized pages is yet another step.

### I. CSS Paged Media + Paged.js polyfill

Author the deck with `@page`, `page-break-*`, running headers — let Paged.js
turn the live document into print-ready paginated output, then capture via
headless Chromium.

**Pros:**
- "Real" print typography. Headers, footers, page numbers, all CSS-driven.
- Same source for screen and print.

**Cons:**
- Substantial design effort to author print-aware CSS for already-shipped decks.
- Overkill for "send the LP a snapshot tonight."
- Worth considering for *future* decks that are designed print-first; not for
  this retrofit.

### J. Hosted services (Urlbox, Browserless, ScreenshotOne)

POST a URL, get a PNG/PDF back. Some support cookies and custom JS waits.

**Pros:**
- No local setup. Useful in CI without managing Chromium.
- Often higher pixel limits than DevTools full-page capture.

**Cons:**
- Money and an external dependency, for a problem we can solve locally with
  free tools.
- Sending a *gated* deck URL to a third-party renderer is a real privacy
  question — it means the deck content (which is LP-private) is rendered on
  someone else's infra.
- Not justifiable for our scale.

### K. macOS `screencapture` CLI / native tools

`screencapture -R 0,0,1920,1080 out.png` against a visible browser window.

**Pros:**
- Zero-deps, native, fast.
- Useful escape hatch when the browser-based capture is failing for some
  reason (e.g., a subtle DPR issue).

**Cons:**
- Requires a visible window — not headless, not CI-friendly.
- Geometry-fiddly.
- Better as a fallback than a pipeline.

## What "high fidelity" actually requires

Independent of tool choice, the deliverable looks crisp only if **all** of
these are handled:

- **Fonts loaded before capture**: `await page.evaluate(() => document.fonts.ready)`
- **Network idle before capture**: `await page.goto(url, { waitUntil: "networkidle" })`
- **Lazy-loaded images forced to load**: scroll the page programmatically to
  trigger any IntersectionObserver-based loaders before snapping.
- **Custom waits for scroll-triggered animation**: if any element transforms in
  on scroll, we either disable that animation in an export mode, or scroll past
  it and wait.
- **Device pixel ratio ≥ 2** for raster outputs to look right on Retina.
- **Viewport sized to the design**: for scroll decks, set viewport width to
  whatever the design is laid out at (likely 1440 or 1920); for slide pages,
  match the canvas (e.g., 1920×1080 for 16:9).
- **`prefers-color-scheme` and `prefers-reduced-motion` set deliberately** so
  the export reflects the intended theme/mode, not whatever default the
  headless browser picks.
- **Gate bypass**: either run against localhost (where we can disable the gate
  via env var), or inject the auth cookie that the cover page sets after a
  correct code submission.

The good news: all of these are first-class in Playwright. They're more
painful in everything else.

## Findings — what to actually expect from each

**Scroll decks (`/thesis`, `/thesis/version-2`, `/thesis/version-3`):**
A single tall PNG per deck via `page.screenshot({ fullPage: true })` is the
most LP-faithful artifact — it preserves the scroll-narrative reading order
without imposed page breaks. Stitching three such PNGs into one PDF (for
emailability) is one extra `pdf-lib` step.

**Per-slide variant pages (`/{slug}`, `/drafts/{slug}/...`):**
A loop over the slide route registry, capturing a viewport-sized PNG each, then
stitching to a single PDF is the cleanest deliverable. This *is* the
"slide deck PDF" experience the LP expects from a fundraise deck.

**The auth gate:**
Easiest path is to expose an env var like `DECK_GATE_DISABLED=true` for local
exports, or to have the export script POST the code to the cover page first and
inherit the cookie. Either is a few lines.

**Where the fidelity actually slips:**
Anecdotally across past projects, the killers are: (1) custom web fonts loaded
via `@font-face` not awaiting `fonts.ready`, (2) gradients with `oklch()` /
`color-mix()` rendered slightly differently in print mode vs screen mode, and
(3) full-bleed background images cropped by `@page` margins. These are
solvable with awareness, not solvable by switching libraries.

## What we shipped (v1, 2026-05-08)

We landed Option **D + H** (Playwright + `pdf-lib` stitching) as
`scripts/export-decks.ts` plus a co-located `scripts/README.md`. See
[`scripts/export-decks.ts`](../../scripts/export-decks.ts).

The pipeline, end-to-end:

1. **Port auto-discovery.** Scans `localhost:4321–4340` in parallel,
   matches the homepage HTML against a `Calm/Storm` fingerprint. Picks
   the first port that is calmstorm-decks. Necessary because running
   multiple Astro Knots sites at once routinely occupies 4–12 ports.
   Override with `BASE_URL=...` or widen the scan with `PORT_SCAN=...`.
2. **Gate bypass via `addInitScript`.** Sets
   `localStorage[cs_unlock] = "1"` and adds the unlocked class to
   `<html>` *before* any page script runs. The site's inline gate-check
   sees an unlocked state and never paints the cover.
3. **Fidelity gates.** For every page: `waitForLoadState("networkidle")`,
   `document.fonts.ready`, programmatic scroll-tour to flush lazy
   loaders, then a second network-idle settle.
4. **Chrome injection.** A single `addStyleTag` hides DeckHeader,
   DeckNav (fixed prev/next), the scroll-snap nav-hint and slide-counter
   overlays, and the inline prev/next nav at the bottom of chooser
   pages. Runtime stays untouched — chrome only disappears in headless.
5. **Per-section capture for scroll decks.** Disables `scroll-snap-type`
   on `.deck-wrapper` (otherwise snap fights `scrollIntoViewIfNeeded`)
   and force-applies `reveal-shown`/`is-visible`/`revealed` plus
   `opacity:1; transform:none` on every `[data-reveal]` element so no
   slide is captured mid-fade. Walks `section.slide`, captures each
   element, stitches per-deck PNGs into a multi-page PDF (one slide per
   page) via `pdf-lib`.
6. **Per-slide chooser pages.** Captured at 1920×1080 viewport, full
   page, then stitched into a 17-page PDF.

Output layout (`exports/<ISO-timestamp>/`):

```
scroll-decks/
├── v1-v1-baseline.pdf            ← 17-page PDF, one slide per page
├── v1-v1-baseline/               ← per-section PNGs
├── v2-v2-alternate.pdf
├── v2-v2-alternate/
├── v3-v3-editorial.pdf
└── v3-v3-editorial/
slides/
├── 01-disclaimer-confidential.png
└── … (17 chooser-page PNGs)
slides-deck.pdf
```

`exports/` is git-ignored. Every Astro Knots deck site that follows the
calmstorm-decks pattern can copy `scripts/export-decks.ts` plus three
devDependencies (`playwright`, `pdf-lib`, `tsx`) and it should work
unchanged.

## Known limitations (the rough edges that keep this from being a "show off" deliverable)

The v1 output is acceptable for **internal sharing with an LP who needs
the content but not the polish.** It is not yet acceptable as a
client-facing "show off" artifact. The shortfall is geometric, not
fidelity-of-pixels.

### Glitch 1 — sections aren't normalized to a 16:9 canvas

`page.locator("section.slide").screenshot()` captures each section at
its rendered bounding box. Sections were authored for scroll-snap with
`--deck-height: calc(100vh - 3rem)`, which is *roughly* viewport-sized
but not enforced and not 16:9. So:

- Each captured PNG has whatever dimensions the section happens to
  render at, which varies per slide based on content height.
- The stitched PDF inherits those dimensions per page (we set the PDF
  page size to the embedded image), so pages within the same PDF have
  slightly different aspect ratios.
- The PDF doesn't drop cleanly into PowerPoint or Keynote as a
  "uniform deck" — every slide imports at a different size.
- Print-quality reproduction (any service that wants letter or A4 or
  16:9 1920×1080) requires re-paginating.

**Why this is hard to fix in the export script alone:** to enforce
16:9 we'd need to (a) set a strict 1920×1080 viewport, (b) override
every section to *exactly* those dimensions, and (c) accept that any
section whose content overflows at fixed height will get clipped.
Option (c) is the honest blocker — some sections are scroll-tolerant
by design, not slide-tolerant. Forcing them to 1080px tall would
truncate content silently.

### Glitch 2 — bleed from neighboring sections leaks into top/bottom margins

When you scroll a `section.slide` into view inside the
(scroll-snap-disabled) deck wrapper, the surrounding sections are still
rendered immediately above and below in the DOM. If a section's
content extends slightly past its own bounding box (margin collapse,
absolutely-positioned decorative elements that escape, oversize
backgrounds), or if the wrapper's gap between sections isn't perfectly
zero, you get a thin slice of the previous or next section visible at
the top and bottom of the captured PNG.

The chrome-hiding CSS resets `padding-top` on `.deck-wrapper` but
doesn't enforce `overflow: hidden` on each section, so any decorative
element with a negative margin or absolute-positioned escape is still
visible in the capture.

### Glitch 3 — captures still depend on `scrollIntoViewIfNeeded` heuristics

Playwright's `scrollIntoViewIfNeeded` does the right thing 95% of the
time, but it doesn't guarantee pixel-perfect alignment of the section's
top edge to the wrapper's top. Sub-pixel offsets occasionally cause a
single-pixel band of the previous section to remain visible at the top
of the capture. Compounds with Glitch 2.

## Where to take this when "show off" quality is the bar

Three paths, ordered by ceremony:

### Path 1 — Export-mode CSS, applied via the script

Add overrides to the existing `addStyleTag` injection that force every
`section.slide` to a fixed canvas:

```css
section.slide {
  width: 1920px !important;
  height: 1080px !important;
  overflow: hidden !important;        /* kills neighbor bleed */
  page-break-after: always;
  contain: layout paint;               /* isolate from siblings */
}
.deck-wrapper {
  display: block !important;           /* drop scroll-snap geometry */
  height: auto !important;
  overflow: visible !important;
}
```

Then capture via `page.screenshot({ clip })` with manually computed
1920×1080 rects per section, or simply set the viewport to 1920×1080
and use `section.screenshot()` (it'll respect the new fixed dims).

**Pros:** zero changes to site code. Re-runs faster than re-authoring.
**Cons:** sections that genuinely don't fit 1920×1080 will silently
clip. Author needs to know which sections are "slide-tolerant" — in
practice, audit each section before shipping the export.

### Path 2 — `?export=1` query param, opt-in export mode in the site itself

Site-side: read the query param in `BaseThemeLayout` (or equivalent),
toggle a `data-export` attribute on `<html>`, and ship export-mode CSS
in the source — strict 16:9 canvas, no chrome, no scroll-snap, every
`section.slide` is `overflow: hidden`. Author can check
`/thesis?export=1` in their own browser and see the deliverable
exactly as it'll capture. The export script just appends `?export=1`
to every URL.

**Pros:** the site owns the export contract — what you see in the
browser is what the LP gets. Easy to debug.
**Cons:** export-only concerns now bleed into runtime CSS. Risk of
drift between "scroll-mode" and "export-mode" layouts; one might pass
review while the other regresses silently. Adds a maintenance lane.

### Path 3 — Re-author with a strict canvas wrapper from day one

Wrap every section in a `<div class="slide-canvas">` with `width:
1920px; height: 1080px; overflow: hidden;` baked into the design
system, and let scroll mode show the canvas as-is (with the sticky
header etc.) while export mode just hides chrome. This is the cleanest
endpoint and the most work.

**Pros:** scroll deck and export deck become *the same artifact*, just
viewed differently. No drift possible.
**Cons:** retrofit on calmstorm-decks is non-trivial — every section
component needs review. Better suited for the *next* deck site than
this one.

## Recommended path for the next iteration

If a "show off" export is needed before the next deck site, start with
**Path 1** — it's the smallest diff and forces the question of which
sections are slide-tolerant to surface explicitly. If the answer turns
out to be "most of them, with a few that need re-authoring," promote to
**Path 3** for those specific sections rather than across the whole
deck.

If we know we're starting another deck site soon (and we are — the
fundraise deck workspace is the recurring pattern documented in
`Build-a-Fundraise-Deck-Workspace.md`), do **Path 3** in that next
site's design system from day one. Bake the 16:9 canvas into the
section primitive, treat scroll mode as one rendering of it, and the
export script becomes a five-line affair.

## Outcome

**Shipped v1** as
[`scripts/export-decks.ts`](../../scripts/export-decks.ts) —
auto-discovers port, bypasses gate, hides chrome, captures per-section,
stitches into per-deck PDFs. Acceptable for internal sharing.

**Not yet "show off" quality** — see Glitches 1–3 above. Documented for
the next iteration. The user's stated working plan is to record a
video walkthrough of the live UI for the client moment, and use the
PDF exports for asynchronous sharing only.

## Related

- [[Gate-Sensitive-Information-with-Simple-Code]] — explains the auth
  gate the exporter has to bypass.
- [`scripts/export-decks.ts`](../../scripts/export-decks.ts) — the
  shipped exporter.
- [`scripts/README.md`](../../scripts/README.md) — usage, flags, the
  silent-killer table, and the "replicate this in another deck site"
  section.
- `context-v/blueprints/Build-a-Fundraise-Deck-Workspace.md` (in the
  parent astro-knots repo) — the overall deck workspace pattern this
  exporter plugs into; the right place to bake the 16:9 canvas
  primitive (Path 3) for the next deck site.
- `src/lib/scroll-decks.ts`, `src/lib/slides.ts`, `src/lib/gate.ts` —
  the three registries the exporter reads from. Keep these stable; the
  exporter and any sibling deck site's exporter both depend on the
  shape.

---
title: "Exporting the Strategy Decks to Google Slides"
lede: "The seven strategy decks live as code — Astro Scroll-UI sections, not slides in any format Google Slides understands. Getting them into Slides for a stakeholder who wants to open, present, or lightly edit them in the tool she already knows is a real pipeline question, not a five-minute export. This names the actual path: what format has to exist first, what's proven prior art from calmstorm-decks, and what reach-edu-hub is missing today to make it clean."
date_authored_initial_draft: 2026-07-07
date_authored_current_draft: 2026-07-07
date_last_updated: 2026-07-07
at_semantic_version: 0.0.1.0
status: Seedling — recommendation pending sign-off
augmented_with: Claude Code on Claude Sonnet 5
category: Exploration
tags:
  - Deck-Export
  - Google-Slides
  - PPTX
  - Playwright
  - Screenshot-Pipeline
  - Play-UI
  - Scroll-UI
  - Static-Site-Constraints
  - Known-Limitations
authors:
  - Michael Staton
related:
  - "../../../calmstorm-decks/context-v/explorations/Gate-Sensitive-Information-with-Simple-Code.md"
  - "../../../calmstorm-decks/context-v/explorations/High-Resolution-High-Fidelity-Deck-Exports-from-Code-to-Images-&-PDFs.md"
  - "./Deck-Collections-A-Menu-Layer-Above-Single-Deck-Convergence.md"
  - "../../CLAUDE.md — Scroll-UI vs. Play-UI naming discipline"
from: "dididecks-ai/reach-edu-hub"
from_path: "context-v/explorations/Exporting-Strategy-Decks-to-Google-Slides.md"
---
# Exporting the Strategy Decks to Google Slides

## The ask, in one line

Get the seven strategy decks (`/scroll/{deck}/{variant}`) into Google Slides,
so a stakeholder can open, present, and maybe lightly edit them in a tool she
already knows — without asking "do we need to make them SVGs or PPTs first?"
being an open question every time.

## The honest reframing

Short answer to "SVG or PPT first": **neither, directly — PNG, then PPTX.**
SVG doesn't help here (confirmed below); PPTX is the right *assembly*
format, but the thing that has to exist first isn't a file format, it's a
**canvas**. Here's why that matters more than it sounds like it should.

1. **Google Slides doesn't import code, HTML, or a live URL.** The only way
   content gets into Slides is: (a) `.pptx`/`.key`/`.odp` file import, or
   (b) the Slides API creating shapes/images programmatically. Either way,
   something has to render the Astro deck into pixels or shapes *before*
   Slides ever sees it.
2. **The clean way to get pixels is a headless browser, not a converter.**
   This is already solved and documented for this exact family of sites —
   see [[High-Resolution-High-Fidelity-Deck-Exports-from-Code-to-Images-&-PDFs]]
   in calmstorm-decks. No PDF/HTML-to-slide library "gets it perfect" for a
   design-heavy deck (custom fonts, gradients, full-bleed images); the only
   renderer with full parity to what a human sees is a real Chromium,
   captured with Playwright.
3. **Reach's strategy decks don't have a slide canvas yet — only a scroll
   canvas.** This is the piece that's specific to reach-edu-hub and wasn't
   true for calmstorm at the time of that doc. dididecks-ai's own naming
   convention (`../../CLAUDE.md`) draws a hard line between two coordinated
   implementations of every deck:
   - **Scroll-UI** — what exists today for all seven strategies. Responsive
     sections in one long page, laid out for reading, not for a fixed 16:9
     stage.
   - **Play-UI** — standalone components at
     `src/components/slides/{variant}/{slot}-{slug}.astro`, rendered inside
     `SlideCanvas` at a rigid 1920×1080, no responsive CSS, no JS. **None of
     the seven strategy decks have these yet** — `src/components/slides/`
     doesn't exist in reach-edu-hub at all (confirmed by directory listing).
     Only `basics/`, `citations/`, `markdown/`, `ui/`.
4. **Calmstorm already hit this exact wall and named the fix.** Calmstorm's
   export pipeline (Playwright + `pdf-lib`, shipped and working) captures
   *scroll sections* directly, and its own retro names three geometric
   glitches that fall out of that: sections aren't normalized to 16:9,
   neighbor-section bleed leaks into the capture, and sub-pixel
   `scrollIntoViewIfNeeded` misalignment. That doc's own recommendation for
   "the next deck site" is to bake a strict 16:9 canvas into the section
   primitive from day one — which is *precisely* what Play-UI + `SlideCanvas`
   already is, architecturally, in `@dididecks/shell`. reach-edu-hub already
   has the shell. It just hasn't built the Play-UI files that would let this
   export skip calmstorm's glitches entirely.
5. **The site is gated now, too.** As of today, the whole hub sits behind
   `src/middleware.ts` (passcode or `@reach.edu` email). Whatever captures
   these decks has to either run against `localhost` with the gate disabled,
   or authenticate — the same problem calmstorm's exporter solved for its
   own gate, adapted for ours.

## What "high fidelity" actually requires

Unchanged from calmstorm's findings — every point below applies to reach-edu-hub
verbatim, so no need to re-derive it:

- Wait for `document.fonts.ready` before capturing (custom fonts are the
  silent killer).
- `waitForLoadState("networkidle")`, then a scroll-tour to flush any
  lazy-loaded images, then one more idle wait.
- `deviceScaleFactor: 2` for crisp Retina-equivalent raster.
- Viewport matched to the design — 1920×1080 for Play-UI slides specifically
  (this is exact, not approximate, once Play-UI exists — the whole point of
  `SlideCanvas`).
- `colorScheme` and `reducedMotion` set deliberately, not left to headless
  Chromium's defaults.
- **Gate bypass.** New for reach-edu-hub: either run the capture against a
  build with `RUH_GATE_PASSCODE`/`RUH_ALLOWED_EMAIL_DOMAIN` unset (gate
  effectively open in that environment) or have the capture script inject
  the `ruh_gate=granted` cookie via `context.addCookies([...])` before
  navigating — the same shape as calmstorm's `addInitScript` localStorage
  trick, adapted to a real HttpOnly cookie instead.

## Options on the menu

Ordered lowest-ceremony to most-pipeline, same framing as the calmstorm
precedent.

### A. Manual, one deck at a time, today

Open each Scroll-UI deck in a real browser, screenshot each section by hand
(DevTools "Capture node screenshot," or just a careful window screenshot),
and paste the resulting PNGs into a blank Google Slides deck — one image per
new slide, sized to fill.

**Pros:** zero code, zero new dependencies, ships *this week* if the
stakeholder meeting is close. Doesn't require Play-UI to exist at all.

**Cons:** fully manual, every deck, every revision. Section boundaries are
whatever the responsive layout happens to render at your window size — no
guaranteed 16:9, so images will look inconsistently sized in Slides. Not a
pattern; a one-off favor.

**Verdict:** the honest escape hatch if this needs to exist before Play-UI
work can happen. Not a foundation to build on.

### B. Automate today's shape: Playwright over Scroll-UI sections → pptxgenjs

Reuse calmstorm's `export-decks.ts` pattern almost as-is — Playwright
navigates each `/scroll/{deck}/{variant}` route, captures each
`section.deck-section` element as a PNG — but instead of stitching into a
PDF with `pdf-lib`, assemble a `.pptx` with
[PptxGenJS](https://github.com/gitbrent/PptxGenJS): one slide per PNG, sized
full-bleed. Upload the `.pptx` to Google Drive, open with Google Slides.

**Pros:** no Play-UI prerequisite — works against what exists today. Reuses
a proven capture pattern almost line-for-line (chrome-hiding, fidelity
waits, gate-cookie injection). PPTX-with-full-bleed-images is a
well-trodden, high-fidelity import path into Slides (confirmed below).

**Cons:** inherits calmstorm's three named glitches exactly, because the
root cause — sections authored for scroll, not for a fixed slide canvas —
is identical here. Every slide in the resulting Slides deck will be a
*slightly different aspect ratio*, because each section's rendered height
varies with its content. That looks noticeably off in a presentation tool
where slides are expected to be uniform.

**Verdict:** works, ships faster than C, but produces a visibly rougher
deck. Reasonable *only* as a stopgap while Play-UI work is in flight.

### C. Build Play-UI first, then export — the clean path (recommended)

1. Run the shell's existing decompose-first workflow
   (`/api/slide-decompose`, `DecomposeFirstPlaceholder`) to generate the
   Play-UI counterpart for each of the ~70 slots across the seven strategy
   decks. This is real design work per CLAUDE.md's own framing — "recreate,
   don't extract" — not a mechanical port; Claude is explicitly worse at the
   rigid, no-JS, fixed-aspect constraint than at responsive Scroll-UI, so
   budget real iteration here, not a batch script.
2. Once Play-UI files exist, capture each one via the shell's own
   `/play/[deckSlug]/[variantSlug]/[slot]` route (or the print-mode
   surface at `/play/[deckSlug]/[variantSlug]/print/`, which already lays
   every slot out as one `page-break-after: always` page at the design's
   native 1920×1080). A Playwright script does exactly what calmstorm's
   `/dev/shot/{slot}/{variant}` capture does: `page.goto()` →
   `.slide-canvas` element screenshot at `deviceScaleFactor: 2` — no
   glitches, because `SlideCanvas` enforces the fixed canvas by
   construction. No neighbor bleed (each slide is its own route, not a
   scrolled-into-view section sharing a DOM with its siblings). No
   sub-pixel misalignment (no `scrollIntoViewIfNeeded` involved at all).
3. Assemble the resulting PNGs into a `.pptx` with PptxGenJS — one 16:9
   (13.333in × 7.5in) slide per PNG, ordered by the deck's slot registry
   (`src/data/slides.ts`), full-bleed.
4. Upload to Google Drive → **Open with → Google Slides**, or **File → Save
   as Google Slides** to fully convert rather than just preview. Share with
   the stakeholder.

**Pros:** the only path that produces a *uniform*, presentation-grade deck
— every slide the same aspect ratio, no bleed, no clipping. Reuses the
`@dididecks/shell` architecture exactly as it was designed to be reused.
Once Play-UI exists, the export script itself is genuinely small (the
calmstorm doc's own words: "the export script becomes a five-line affair"
once the canvas is baked in from day one — which Play-UI already is).

**Cons:** real upfront cost — Play-UI doesn't exist for any of the seven
decks yet, and per the CLAUDE.md framing this is the *harder* surface for
an LLM to author well. This is not a "run a script tonight" deliverable;
it's "invest in Play-UI once, per deck, then exporting is cheap forever
after."

**Verdict:** the right foundation if this needs to happen more than once —
and it will, since decks get revised and new strategies get added. Treat
Play-UI construction as the actual project; the Slides export at the end
of it is nearly free.

### D. Same PNGs, pushed via the Slides API instead of a manual pptx upload

Identical capture step to Option C, but instead of assembling a local
`.pptx`, use the Slides API (`presentations.batchUpdate` with
`createSlide` + `createImage` requests) to push each PNG directly into a
specific, already-shared Google Slides file.

**Pros:** no manual "upload the pptx, then open it" step — useful if this
needs to re-sync on a schedule (e.g., regenerate on every deck revision)
and land in the *same* Slides file/URL the stakeholder already has open or
bookmarked, rather than a new file each time.

**Cons:** meaningfully more setup — a Google Cloud project, OAuth
credentials or a service account, Drive + Slides API scopes, and someone
who owns token refresh/expiry. `CreateImageRequest` only accepts
**PNG/JPEG/GIF, under 50MB, ≤25 megapixels** — confirmed current
([Google's own docs](https://developers.google.com/slides/api/guides/add-image)) —
so the PNG capture step doesn't change, only the delivery mechanism.

**Verdict:** worth it only if "regenerate and re-share the same link"
becomes a recurring need. Don't build this before Option C proves the
capture pipeline works; it's a delivery-mechanism upgrade on top, not a
different pipeline.

### E. True editable-text recreation (native Slides shapes, not flattened images)

Instead of one image per slide, walk each Play-UI slide's rendered DOM
(Playwright can read computed styles, bounding boxes, and text content per
element) and emit matching native objects — PptxGenJS `addText`/`addShape`
calls, or Slides API `createShape`/`insertText` requests — positioned to
match. The result is a Slides deck where the stakeholder can actually click
into a text box and retype a word, not just view a picture of one.

**Pros:** the only option that yields *real* in-Slides editability.

**Cons:** substantial new engineering with no existing prior art in this
codebase to build from — effectively a DOM-to-native-Slides layout
compiler, one mapping per distinct slide template (title slides, stat-card
grids, funder-pipeline tables, etc. all lay out differently). And even done
well, the fidelity ceiling is *lower* than the flattened-image path,
because Slides' native shape/text model is a materially reduced subset of
what the site's CSS can do: no custom `@font-face` unless the font is
separately uploaded to Slides' font picker, no gradient text or
`backdrop-filter`, no CSS grid — several of the deck's signature visual
details (gradient headlines, glass-morphism cards) have no native Slides
equivalent at all and would need to degrade to something plainer.

**Verdict:** only worth it if "edit text inside Slides itself" is a real,
named requirement — not a nice-to-have. If the actual need is "present
this deck and maybe tweak a word," the honest answer is: edit the Astro
source and re-export, the same discipline the site already lives by
everywhere else. Revisit this only if that answer turns out to be
insufficient in practice.

### On SVG specifically — why it's not the missing piece

Checked directly rather than assumed: the Slides API's `CreateImageRequest`
supports **PNG, JPEG, and GIF only** — SVG is not accepted, and inserting one
via any workaround (e.g. browser extensions that "expand" supported
formats) rasterizes it to a bitmap anyway, which is exactly what a direct
PNG capture already gives you with one less step
([source](https://developers.google.com/slides/api/guides/add-image),
corroborated across multiple current how-to write-ups on SVG-in-Slides
workarounds). The only place SVG could theoretically matter is as an
intermediate representation for Option E's vector-shape recreation — but
Playwright's direct DOM/style introspection is strictly richer than
round-tripping through an SVG export, so there's no reason to introduce
SVG as a step anywhere in this pipeline.

## Recommendation

**Short-term (if a stakeholder meeting is close and can't wait):** Option A.
It's a manual favor, not a pattern, and everyone should know that going in.

**The actual investment worth making:** Option C. Build Play-UI for the
seven strategy decks (the real work — budget it as such, not as a script),
capture through the shell's existing `/play` surface, assemble via
PptxGenJS, hand off as a `.pptx` that opens natively in Google Slides. This
is the same conclusion calmstorm's own retro reached for "the next deck
site" — reach-edu-hub already has the architecture that recommendation was
pointing at ( `@dididecks/shell` + `SlideCanvas` ); it's just not populated
for these seven decks yet.

**Not recommended yet:** Option D (API push) and Option E (editable
recreation) — both are real upgrades on top of Option C, not substitutes
for it, and neither has a concrete need behind it today.

## Questions to resolve before building

1. **Timeline pressure.** Is there a specific meeting driving this, or is
   "get it into Slides" a standing capability we want? Decides A-as-bridge
   vs. going straight to C.
2. **Editability requirement.** Does the stakeholder need to type inside
   Slides, or just open/present/maybe reorder? Decides whether Option E is
   ever worth revisiting.
3. **Which decks, and how often.** All seven, or a subset for this specific
   stakeholder? One-time export, or does this need to re-run every time a
   deck's content is audited/updated (as just happened with the citation
   pass across all seven)?
4. **Where the file lives.** A Drive folder we hand-manage per export
   (Option C), or a single persistent Slides URL that gets refreshed in
   place (Option D)?
5. **Who owns the gate bypass long-term.** The capture script needs a way
   past `src/middleware.ts` — an env-var escape hatch for capture runs, or
   cookie injection against a real deployment. Whoever builds the exporter
   should also decide which.

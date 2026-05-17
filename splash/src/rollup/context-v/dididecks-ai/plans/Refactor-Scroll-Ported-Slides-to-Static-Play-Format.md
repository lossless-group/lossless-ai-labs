---
title: "Refactor scroll-ported slides into true static play-format slides (per-client, repeat for every deck)"
lede: "Operational plan, reusable across every dididecks client engagement, for converting per-slide files that were COPIED from scroll-deck sections (and therefore still carry scroll-mode idioms — vw/vh/clamp viewport units, IntersectionObserver-driven reveals, marquees, transitions, breakpoint media queries) into the static-only HTML/CSS/Tailwind form @dididecks/shell's /play and /print routes require. The calmstorm-decks `src/slides/by-title/` fileset is the reference implementation; this plan extracts its discipline so any client deck (chroma-decks today, future engagements tomorrow) can be ported the same way. Includes the rationale, the checklist, the per-slide procedure, the verification loop, and the anti-patterns to flag during code review."
date_authored_initial_draft: 2026-05-14
date_authored_current_draft: 2026-05-14
date_authored_final_draft: 2026-05-14
date_first_published: 2026-05-14
date_last_updated: 2026-05-16
at_semantic_version: 0.0.1.0
status: Shipped
post_ship_note: |
  Discipline applied to chroma-decks enhanced-v2 (17 slides) on 2026-05-14.
  Reusable for future client engagements — file stays "Shipped" because
  the per-client repeat-application is part of normal use, not an
  outstanding deliverable.
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Plan
tags:
  - Dididecks-Shell
  - Scroll-to-Play-Refactor
  - Static-Slide-Format
  - SlideCanvas
  - No-JS-In-Play
  - Reusable-Plan
  - Per-Client
  - Calmstorm-Parity
  - Deck-Iteration-Workflow
  - Phase-1-To-Phase-2-Bridge
authors:
  - Michael Staton
from: "dididecks-ai"
from_path: "context-v/plans/Refactor-Scroll-Ported-Slides-to-Static-Play-Format.md"
---
# Refactor scroll-ported slides into true static play-format slides

> Operational plan for converting per-slide `.astro` files that were copy-pasted from scroll-deck sections into the **static-only HTML/CSS/Tailwind** form `@dididecks/shell`'s `/play` and `/print` routes require. Reusable across every client deck — chroma-decks is the first application; the same procedure repeats unchanged for the next client.

## When this plan applies

Run this plan whenever any of these are true for a client deck variant:

- A per-slide file under `<client>/src/components/slides/<variant>/{slot}-{slug}.astro` exists, but **rendering it in `/play/<deck>/<variant>/<slot>/` produces a blank or visibly broken canvas** while the same content renders fine in the scroll deck.
- The per-slide file uses any of the scroll-mode idioms enumerated in §3 ("Anti-pattern catalog").
- A new variant is being added to a client and you're at the "Phase 2 → Phase 3" boundary of the [[deck-iteration-workflow]] skill: scroll-mode prototype works, now you need a true static play deck for PDF export and `/play` mode.

**Skip this plan when:**

- The slides were authored static-first against a 1920×1080 design canvas from the start (rare in practice — most engagements do scroll-first iteration).
- The deck is scroll-only by design and `/play` mode is out of scope.
- The slides import `<SlideCanvas>` themselves and follow the calmstorm pattern already.

## 1. Why the two filesets exist

`@dididecks/shell` exposes two presentation modes for any deck:

| Mode | Route | What it renders | Hard constraints on slide content |
|---|---|---|---|
| **Scroll** | `/scroll/<deck>/<variant>/` | One big page, slides as `<section data-slot="..">` blocks inlined into a single `index.astro`. Scrolls in the browser. | Viewport-relative sizing is **fine** (vw/vh/clamp). JS is **fine** (animations, IntersectionObserver reveals, marquees). |
| **Play** | `/play/<deck>/<variant>/<slot>/`, `.../print/` | One slide at a time, each rendered inside `<SlideCanvas>` at a fixed 1920×1080 design stage, scaled via pure CSS (`container-type: size` + `transform: scale(calc(100cqw / 1920px))`) to fit whatever container the runtime gives it. | **No JavaScript** in slide content (the canvas-scaling has to work on a printed PDF and on no-JS browsers; reveal animations don't fire). **No viewport-relative units** (vw/vh/clamp) because the design stage is fixed-size, not viewport-derived. **No media queries** beyond `print`. |

The two modes share the *narrative* but **not the code**. Calmstorm-decks made this explicit by keeping `src/layouts/sections/teaser/*` as the scroll surface and `src/slides/by-title/*` as the play surface — copy-once-then-adapt, never re-import. We adopt the same discipline.

> Reference comment from `client-sites/calmstorm-decks/src/slides/by-title/03-venture-team-v1.astro` (verbatim):
>
> > "Adapted from src/layouts/sections/teaser/T03-VentureTeam.astro by COPY. The source is untouched."
> > "Mobile breakpoints dropped — canvas always renders 16:9."
> > "Body text bumped from 0.7rem → 0.95rem for readability at canvas size."

## 2. The static play-format contract

A "true play-format slide" obeys all of:

1. **Self-wraps in `<SlideCanvas>`.** The slide file imports `<SlideCanvas>` and renders its content inside it. The shell route never wraps slides — slides bring their own canvas. This is what calmstorm does and what the shell's `[slot].astro` should NOT do.
2. **Fixed-pixel / fixed-rem at 1920×1080 design scale.** Every length, font-size, padding, gap is in `px` or `rem` — not `vw`, `vh`, `vmin`, `vmax`, or `clamp(..., vw, ...)`. The canvas is the *only* viewport-aware layer; slide content lives in a pretend infinite 1920×1080 world.
3. **No JavaScript.** No `<script>` blocks. No reveal animations driven by IntersectionObserver. No marquees. No data-fetching. No setInterval. Static HTML/CSS/Tailwind only.
4. **No mobile breakpoints.** Drop every `@media (max-width: ...)` rule. The play canvas always renders 16:9; there is no responsive narrowing to handle.
5. **No `data-reveal` / `.reveal-item` opacity-0 starting state.** Either delete the markers entirely, or rely on `SlideCanvas`'s force-resolve rule (which pins them to `opacity: 1 !important`). Prefer deletion — it makes the slide self-contained.
6. **Inline `<style>` allowed and encouraged.** Calmstorm uses inline component-scoped styles per slide. Avoid adding new entries to shared stylesheets that the scroll deck also reads — drift becomes painful.
7. **Visual weight scaled UP for canvas viewing.** Calmstorm explicitly bumped headshots 56→88px and body text 0.7→0.95rem when porting. Scroll-mode rendering tends to be smaller; canvas rendering needs to read at presentation distance. Expect to bump most type and image sizes 20–40% upward.
8. **All content statically inlined.** Customer marquees → static rows. Looping carousels → grids. Auto-advancing tickers → snapshots with a "as of <date>" caption.

If a file fails any of these, it's not a play-format slide — it's a scroll port wearing the wrong filename.

## 3. Anti-pattern catalog (scan-for-these)

When grepping a candidate slide file, the following patterns mean "still scroll-ported, not yet refactored":

| Anti-pattern | Pattern to grep | Why it breaks play mode |
|---|---|---|
| Viewport-clamp sizing | `clamp(.*vw`, `clamp(.*vh`, `clamp(.*vmin` | At viewport ≠ 1920×1080 the clamp resolves to the viewport-derived value, not the design value — content scales wrong inside the canvas |
| Raw viewport units | `\b[0-9]+vw\b`, `\b[0-9]+vh\b` | Same as above — vw/vh resolve against the actual viewport, not the canvas |
| Reveal opt-in | `data-reveal`, `class="reveal-item`, `opacity-0` paired with reveal | Stays invisible without the scroll-deck's IntersectionObserver |
| Inline `<script>` | `<script` (anywhere in slide file) | Disallowed in play mode |
| Marquees / animation | `animate-marquee`, `@keyframes` referencing scroll | Looks wrong in print; visually distracting in play |
| Mobile breakpoints | `@media \(max-width`, Tailwind `sm:` / `md:` / `lg:` prefixes | Irrelevant — canvas is always 16:9 |
| Wrap-by-route assumption | Slide does NOT import `<SlideCanvas>` | Slide expects the route to wrap it; correct shape is self-wrap |
| Shared CSS leak | `import "../../../styles/global.css"` pulling Tailwind utility classes used only for scroll-deck atoms | Often fine, sometimes load-bearing — flag for review case-by-case |

## 4. The per-slide refactor procedure

For each slot in the variant, in slot order:

### Step A — open the source pair

Open two files side-by-side:

- **Source (scroll, read-only):** the corresponding `<section data-slot="<NN>">` block inside `<client>/src/pages/scroll/<deck>/<variant>/index.astro`. This is the narrative source-of-truth — text content, layout intent, brand atoms used.
- **Target (play, will-edit):** `<client>/src/components/slides/<variant>/{slot}-{slug}.astro`. This is the file being refactored. Today it's either a scroll-section paste (the bad state we're fixing) or empty.

### Step B — rewrite the frontmatter

The target's frontmatter must:

1. Import `<SlideCanvas>` from the shell or the client's local SlideCanvas wrapper.
2. Import only the CSS / data files the slide actually needs. Resist re-importing the whole `global.css` if the slide doesn't need it — that pulls in Tailwind base layers that may not be needed.
3. Add a header comment block following the calmstorm pattern:

   ```
   /**
    * Slide <NN> · <Title> — variant <variant>
    *
    * Adapted from <path/to/scroll/source> by COPY. The source is untouched.
    *
    * Adaptation notes vs source:
    *   - <bump in size, layout shift, marquee→static, etc.>
    *   - <each meaningful deviation listed>
    */
   ```

### Step C — rewrite the structure

Wrap the slide content in `<SlideCanvas title="...">`:

```astro
<SlideCanvas title={`Slide ${slot} · ${title} (${variant})`}>
  <section class="slide slide-<slot>-<slug>" data-slot={slot} data-variant={variant}>
    {/* content */}
  </section>
</SlideCanvas>
```

The `class="slide"` token matches calmstorm's SlideCanvas force-resolve selector. The slot/slug class allows per-slide style scoping.

### Step D — strip + replace viewport idioms

Grep within the target for each anti-pattern in §3. For each hit:

- `clamp(2rem, 5vw, 7rem)` → pick the **upper** value: `7rem`. Calmstorm always sized for the canvas's full design dimensions; the clamp's high bound is where the slide was meant to land at maximum viewport. (For padding/margins you may instead pick the design-intended exact px — judgment call documented in the adaptation note.)
- `text-[clamp(2rem, 4vw, 3.5rem)]` → likewise pick the upper. For headlines often safer to bump *past* the upper to compensate for canvas viewing distance (headshots-56→88 pattern).
- `vh`-based heights → use explicit `px` values. The canvas is 1080px tall.
- `data-reveal` / `class="reveal-item"` → delete the attributes and any associated `opacity-0` / `translate-*` starting state.
- `<script>` blocks → delete; the behavior they implemented (marquee, ticker, type-on-load animation) gets replaced with a static snapshot.
- Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) → keep the unprefixed class only; delete the prefixed variants.

### Step E — bump visual weight if needed

Calmstorm's empirical observation: scroll-rendered slides feel right at viewport scale but **look thin and small inside a 1920×1080 canvas viewed at presentation size**. After Step D, eyeball the slide in `/play/<deck>/<variant>/<slot>/` and:

- Body type below 0.95rem → bump
- Headshots / portraits below 88px → bump
- Numeric "hero" figures (the 14M, $2.4M etc.) → check they're at least `text-[6rem]` equivalent; calmstorm-decks often goes higher
- Padding around the outer slide frame → expect 3–5rem rather than 1–2rem

Record every bump in the file header's "Adaptation notes vs source" block. This becomes its own documentation when someone wonders why play and scroll diverge.

### Step F — drop content that doesn't work statically

- **Marquee customer ticker** → static row of customer names, e.g. `flex flex-wrap gap-x-8 gap-y-3`. Calmstorm-decks already has this exact replacement in the chroma 03-traction port — preserve it.
- **Animated counters** → static final number with `as of <date>` caption.
- **Looping autoplay carousels** → grid of all the slides at once, or a hero + thumbnails layout.
- **Live-data fetches** → bake the values from the most recent successful fetch directly into the markup, with a captioned timestamp.

### Step G — verify rendering

Visit `/play/<deck>/<variant>/<slot>/` and confirm:

- Slide renders inside the canvas (visible content, no white-on-white, nothing pushed off-canvas)
- All text is readable at canvas scale
- No `[data-reveal]` invisibility
- No console JS errors
- Keyboard nav still works (← / → walks slots; this is the shell's job, not the slide's)

Also visit `/play/<deck>/<variant>/print/` and confirm the slide appears in the print preview at the right proportions and content fits within the page-break boundaries.

## 5. Verification loop (across all slots in a variant)

After all slots are refactored:

```bash
# From the client root:
pnpm dev

# Walk every slot:
open http://localhost:4321/play/<deck>/<variant>/01/    # → arrow-key through every slot

# Then export:
open http://localhost:4321/play/<deck>/<variant>/print/  # → browser-print to PDF
```

Diff the resulting PDF against the most recent previously-shipped export in `<client>/exports/` to catch unintended regressions.

## 6. Time budget per variant

Calmstorm anchored at roughly **20–40 minutes per slide** when porting carefully (slot 1 takes longest while you internalize the pattern; slots 8+ go fast). For a 16-slot variant, budget **6–10 hours total** spread across one or two sittings.

Don't try to batch all 16 in one Claude session without checkpoints. After every 3–4 slides, commit the work and visually verify in the browser. Drift accumulates fast otherwise.

## 7. Reusable application order

Per client deck:

1. Identify which variants need this refactor (typically the latest one being readied for play / PDF export).
2. For each variant in scope, apply the per-slide procedure to every slot.
3. After all slots are done, run §5 verification.
4. Commit per variant (one commit per variant keeps blame readable).
5. Update the client's `context-v/plans/` with a one-line "applied this plan on <date> for variant <X>" entry — small, but tells future engagements which decks have been done.

## 8. Cross-references

- [[client-sites/calmstorm-decks/src/slides/by-title/]] — the canonical reference implementation
- [[client-sites/calmstorm-decks/src/components/slides/SlideCanvas.astro]] — the canvas component the slides self-wrap in
- [[apps/deck-shell/src/components/SlideCanvas.astro]] — the shell's SlideCanvas (pure-CSS scaling via container queries; the slides this plan produces must work inside it)
- [[apps/deck-shell/src/routes/play/[deckSlug]/[variantSlug]/[slot].astro]] — the route that renders the refactored slides
- [[context-v/skills/deck-iteration-workflow]] — the methodology that frames this plan as a Phase 1.5 step between scroll prototype and full play deck
- [[context-v/skills/pseudomonorepos]] — the tree-walking discipline; check whether sibling clients have similar refactor work pending
- [[context-v/plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives.md]] — sibling plan that landed the play-runtime chrome this plan's output will be played inside
- [[client-sites/chroma-decks/context-v/plans/Sync-Enhanced-v2-Scroll-Aesthetic-Into-Play-Deck.md]] — chroma's specific shelved plan; refactor of every enhanced-v2 slot under §4 is the work that plan was waiting on

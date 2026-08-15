---
title: "Quick Slides Assembly to Demo Deal Coverage"
lede: "One slide per deal, in an hour. Our commentary in one column, the company's own OpenGraph card in the other — and where we hold their deck, an optimized PDF made playable inside the DidiDecks shell. A time-boxed assembly that borrows memopop's settled PDF pipeline and dididecks' scroll/play shell rather than inventing anything."
date_created: 2026-08-12
date_modified: 2026-08-12
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.2
status: Partially-Shipped
date_first_published: 2026-08-12
revisions:
  - "2026-08-12 — v0.0.0.2 — Stages 0–3 shipped against 9 deals in lossless-decks. Stage 4 (play-from-PDF) reduced to a filmstrip + PDF link; full Play-UI deferred."
  - "2026-08-12 — v0.0.0.1 — initial plan, authored while the roster was being gathered."
tags:
  - Plan
  - Dididecks
  - Memopop
  - Deal-Flow
  - Venture-Partner
  - Time-Boxed
  - Candidate-Blueprint
---

## Why Care?

A Venture Partner relationship is only worth what you can *show*. "I have deal access
to these fifteen companies" is a claim; a deck where each company gets a slide — our
read on the left, the company's own public self-presentation on the right, and their
actual pitch deck one click away when we hold it — is evidence. This plan is how that
deck gets assembled in about an hour, by composing two systems that already exist in
this pseudomonorepo instead of building a third.

It starts in `ai-labs/` deliberately: neither child repo owns the whole job.
**memopop-ai** already settled how to turn a startup's PDF deck into something small
enough to serve and readable enough to trust. **dididecks-ai** already has a shell that
does table-of-contents, Scroll-UI, and Play-UI. The seam between them — "their PDF, our
shell, one slide per deal" — is a parent-level concern, and if it works twice it becomes
a blueprint.

**This is time-boxed to ~1 hour.** The stages below are ordered so that stopping at the
end of *any* stage still leaves something shareable. Stage 4 is explicitly the cut line.

---

## What we're borrowing (verified, with paths)

### From `memopop-ai/apps/memopop-orchestrator/` — the PDF pipeline

The library choices are already made and in `pyproject.toml`:

| Library | Version | Role |
|---|---|---|
| `PyMuPDF` (imported as `fitz`) | 1.26.6 | fast render, page geometry, rebuild |
| `pdf2image` (wraps Poppler) | 1.17.0 | higher-quality render path |
| `pdfplumber` | 0.11.9 | table/text extraction (cap tables, datarooms) |
| `pypdf` / `pypdfium2` | 6.4.1 / 5.6.0 | manipulation |
| `pillow` | 12.0.0 | compression, `optimize=True` |

The settled render settings live in `src/agents/deck_analyst.py`:

- **Archival/readable path** — `dpi=150` via `convert_from_path(...)` (Poppler), falling
  back to `fitz.Matrix(dpi/72, dpi/72)` + `get_pixmap()` when Poppler is absent. The code
  comments 150 DPI as "good balance of quality/size" — that judgment is the one we inherit,
  not re-litigate.
- **Compressed path** — `img.save(buf, format="JPEG", quality=85, optimize=True)`, and a
  cheaper `fitz.Matrix(0.5, 0.5)` + `quality=70` variant used for vision triage.

Also there and worth knowing exists: `src/agents/inject_deck_images.py` (slide-placement
rules), `cli/capture_docsend.py` (DocSend capture), `templates/deck-classification-guide.md`,
and the specs `context-v/specs/Deck-Analyzer-Agent.md` + `Introducing-a-PDF-Parser-Agent.md`.

> **Known gap, decide in Stage 3:** the orchestrator renders *pages to images*. It does not
> currently re-assemble those images back into a slimmed PDF. Rebuilding is one short
> PyMuPDF loop (`doc.new_page()` + `insert_image()`) — no new dependency needed. Don't reach
> for `img2pdf` or Ghostscript; PyMuPDF is already in the lockfile.

### From `dididecks-ai/apps/deck-shell/` — the shell

`@lossless-group/dididecks-shell` v0.4.0, an Astro 7 integration. The pieces this plan uses:

- **Routes:** `src/routes/toc.astro`, `toc-deck.astro`, `play/`, `data-assets/companies.astro`
- **Scroll/Play components:** `ScrollDeckPage.astro`, `DeckOverlay--Scroll-UI.astro`,
  `DeckFrame--Play-UI.astro`, `DeckOverlay--Play-UI.astro`, `SlideCanvas.astro`,
  `SlideShell.astro`, `SlidePaginator.astro`, `ModeToggle.astro`, `DeckMatrix.astro`
- **Runtime:** `src/runtime/mode-switcher.ts`

**The single highest-leverage fact in this whole plan** is in `src/types/index.ts`: the
shell scans every `.astro` file under `scrollPagesRoot` (default `./src/pages/scroll`) for
`<section data-slot="…" data-variant="…">` and merges discovered slots into the registry.
The scroll deck is the *existence authority* for slots; `src/data/slides.ts` is only a
title/slug supplement.

> **Therefore: adding one `<section data-slot="deal-<slug>">` per deal gives us the
> table of contents for free.** No registry bookkeeping in the hour.

`src/types/index.ts` also carries `distributionTier?: "private" | "shared" | "public"` —
which is where the confidentiality decision below gets enforced.

**What the shell does NOT have:** any PDF viewer. `grep -i pdf` across `apps/deck-shell/src`
returns exactly one hit — `routes/play/[deckSlug]/[variantSlug]/print.astro`, which is
print-*out*, not PDF-*in*. Play-from-their-PDF is net-new work. This is why it's Stage 4.

### From the `crawl-fetch-ingest` skill — the company card

`dididecks-ai/context-v/agent-skills/crawl-fetch-ingest/scripts/og-fetch.ts` is a ready
OpenGraph.io wrapper: reads `OPENGRAPH_IO_API_KEY` from env, takes a URL, supports
`--cache-dir` with sha1-keyed JSON caching, prints JSON to stdout, non-zero exit on error.
That is precisely the right-hand column — their own image, their own title, their own
description, fetched once and cached.

Companion material in the same skill: `schema/company.md`, `routines/triage-brand-assets.md`.
And `apps/deck-shell/src/routes/data-assets/companies.astro` is already OG-aware — check it
before writing a new card component.

Related skills worth loading only if a stage stalls: `deck-iteration-workflow`, `slide-target`,
`open-graph-share-seo-geo`. `setup-new-dddecks-workspace` is a **stub** — it will not help today.

---

## Two decisions to make before Stage 0 (60 seconds each)

**1. Which client-site hosts this deck?** Existing sites are `calmstorm-decks`,
`chroma-decks`, `eventcut-ai`, `humain-vc-decks`, `lossless-decks`, `reach-edu-hub`.

> **Recommendation: `client-sites/lossless-decks`.** It already exists, is already in the
> pnpm workspace, and already has `src/pages/scroll/firm/` plus `src/data/{decks.ts,slides.ts}`.
> This deck is The Lossless Group presenting its own deal access — it *is* the firm deck.
> Scaffolding a new submodule costs more than the hour allows.

**2. What is the distribution tier?** Deal materials shared under access, going to one
partner firm. Set `distributionTier: "private"` (or `"shared"`) at the shell options level
and do not publish a public route. Founders' decks are theirs, not ours to make crawlable —
this is the one thing in the hour that is not reversible later.

---

## Stage 0 — The deal roster becomes data (~5 min)

Everything downstream reads one file. Write it before writing any slide.

Create `src/data/deals.ts` in the chosen client-site:

```ts
export interface Deal {
  slug: string;            // "acme-robotics" — drives data-slot, file names, PDF path
  name: string;            // display name
  url: string;             // homepage — the ONLY input og-fetch.ts needs
  accessNote: string;      // how we have access (one line, ours)
  commentary: string[];    // our read — 2–4 bullets, the left column
  stage?: string;          // Seed / Series A / …
  deckPath?: string;       // path to their PDF if we hold one; omit if not
}

export const deals: Deal[] = [ /* … as Michael supplies them … */ ];
```

**Do not block on completeness.** A deal with `url` and nothing else still renders a card.
A deal with `commentary` and no `url` still renders a slide. `deckPath` is the only field
that gates a later stage.

**Exit criteria:** the file typechecks and every company Michael named has a row.

---

## Stage 1 — Fetch the OpenGraph cards (~10 min, runs unattended)

Batch `og-fetch.ts` over every `deal.url`, caching to a directory inside the client-site so
the results are committed and the deck builds without network:

```bash
cd /Users/mpstaton/code/lossless-monorepo/ai-labs/dididecks-ai/client-sites/lossless-decks
# one call per deal; cache dir is committed so builds are offline-safe
../../context-v/agent-skills/crawl-fetch-ingest/scripts/og-fetch.ts \
  "https://example.com" --cache-dir ./src/data/og-cache
```

Wrap that in a tiny loop over `deals`. Confirm `OPENGRAPH_IO_API_KEY` is in env **first** —
if it's missing, that's a 30-second fix at the start or a 10-minute derail in the middle.

**Fallbacks, in order, when OG data is thin or the fetch fails** (early-stage companies
often have no `og:image`): Firecrawl scrape → Tavily extract → hand-written title +
description + the company's favicon. The card must never render empty; a card with a name
and one sentence still beats a hole. Log which deals fell back — that's Stage 6 work.

**Exit criteria:** one cached JSON per deal, and a noted list of which ones are degraded.

---

## Stage 2 — One slide per deal (~20 min) — *this is the shippable core*

One `.astro` page under `src/pages/scroll/` containing one `<section>` per deal. Because
the shell scans for `data-slot`, the TOC populates itself.

```astro
<section data-slot={`deal-${deal.slug}`} data-variant="v1">
  <div class="deal-slide">
    <div class="deal-slide__commentary">   <!-- ours -->
      <h2>{deal.name}</h2>
      <p class="deal-slide__access">{deal.accessNote}</p>
      <ul>{deal.commentary.map(c => <li>{c}</li>)}</ul>
    </div>
    <aside class="deal-slide__card">       <!-- theirs, from OG cache -->
      <!-- og:image, og:title, og:description, link out -->
    </aside>
  </div>
</section>
```

Rules that keep this inside the time box:

- **One component, N instances.** `DealSlide.astro` renders any `Deal`. Zero per-company
  bespoke layout in the first pass.
- **Two-column CSS grid, stacking under ~900px.** Commentary left, card right.
- **Scroll-UI only.** Per the standing convention, Scroll-UI and Play-UI are two coordinated
  implementations, not two views of one thing — design in scroll mode now, recreate as play
  later. Do not try to author both in this hour.
- **Style with existing theme tokens.** No new token work today.

**Exit criteria:** `pnpm dev` serves a scroll page with every deal, and the shell's
`/toc` route lists every deal slot without any hand-editing of `slides.ts`.

> **If the hour is nearly gone here — stop and ship.** Stages 3 and 4 are additive.

---

## Stage 3 — Optimize the decks we hold (~15 min, parallel with Stage 2 review)

For every deal with a `deckPath`, run the memopop pipeline settings against it. The script
lives in memopop (that's where the deps are); the output lands in the client-site.

```
their.pdf
  → render each page @ 150 DPI          (pdf2image/Poppler; fitz.Matrix fallback)
  → JPEG, quality=85, optimize=True     (Pillow)
  → rebuild into a single PDF           (PyMuPDF: new_page + insert_image)
  → public/decks/<deal-slug>.pdf
```

Run it with `uv` from the orchestrator, not plain `pip`:

```bash
cd /Users/mpstaton/code/lossless-monorepo/ai-labs/memopop-ai/apps/memopop-orchestrator
uv run python <the-slimming-script>.py --in <their.pdf> --out <deal-slug>.pdf --dpi 150 --quality 85
```

**Report the numbers.** Before/after filesize per deck, and eyeball page 1 and one
dense-chart page at 100% zoom. If a chart-heavy deck goes illegible at q85, bump *that
deck* to q92 rather than raising the global default — 150/85 is the settled baseline and
one exception shouldn't move it.

**Text-layer note:** rasterizing kills selectable text and any links inside the deck. For a
"look at these companies" artifact that's an acceptable trade. If a founder's deck has live
links that matter, keep the original for that one.

**Exit criteria:** an optimized PDF per held deck in `public/decks/`, with a filesize table.

---

## Stage 4 — Make their PDF playable in the shell (~15 min) — **the cut line**

The shell has no PDF-in path. Three options, cheapest first:

| Option | Cost | Trade |
|---|---|---|
| **A. `<iframe src="/decks/<slug>.pdf">` inside a `SlideCanvas`** | ~5 min | Browser-native viewer; our chrome doesn't wrap the pages; mobile is poor |
| **B. Page images as slides** — reuse Stage 3's JPEGs, one per Play-UI slide | ~15 min | Real shell paging, `SlidePaginator` and `ModeToggle` work as designed; no PDF viewer needed at all |
| **C. `pdf.js` canvas component** | ≫ the hour | Correct long-term answer; not today |

> **Recommendation: B.** Stage 3 already produced the page images — Option B consumes them
> instead of throwing them away, and it's the only option where the deck *actually plays in
> our shell* rather than in Chrome's. Fall back to A only if Play-UI wiring fights back.

Whichever is chosen, keep the optimized PDF downloadable — the partner firm will want to
forward it.

**Exit criteria:** from a deal slide, one click reaches that company's deck, paged.

---

## Second pass (only if Stage 4 lands early)

- **Stage 5 — the framing slides.** Cover, "how we source", a coverage matrix by
  stage/sector, and a closing "what a Venture Partner relationship unlocks". The deal
  slides are the evidence; these make it an argument.
- **Stage 6 — repair the degraded cards.** Every deal flagged in Stage 1 gets real brand
  assets via `crawl-fetch-ingest`'s `routines/triage-brand-assets.md`.
- **Stage 7 — Play-UI parity** for the deal slides themselves (not just the embedded decks).
- **Stage 8 — browser-drive verification.** Per the tree-wide convention, drive the click
  path with Playwright MCP before asking anyone to walk it: land on `/toc` → click a deal →
  confirm the OG card rendered → click through to the deck → page forward twice. Name the
  path here so it's codified rather than living in a session transcript.

---

## Remaining work (as of 2026-08-12)

**Shipped this session** — Stages 0–3, live at `/scroll/deals/v1/` in
`dididecks-ai/client-sites/lossless-decks` (branch `development`):

- 9 deals across 2 sections; 11 slots auto-registered via the `data-slot` scan
- All 9 OG cards fetched and cached offline at `src/data/og-cache/`
- `scripts/slim_deck.py` in memopop — the reusable slimmer, now with viewer-chrome cropping
- Impulse Labs deck: 28.0 MB → 1.4 MB (4.9%), DocSend chrome stripped

**Not done, in priority order:**

1. **Commentary is empty on all 9 deals.** Only Michael can write it. The slides render a
   "pending" state so the gap is visible rather than silent.
2. **Two degraded cards** — ContextMemory (no OG tags, no image at all) and Verdant (no OG
   tags, only a 64px logo-mark). Stage 6 triage.
3. **Impulse deck is 13 of 15 pages.** The DocSend counter reads "N / 15"; captures stop at
   13. Pages 14–15 need re-capture.
4. **Hover artifact** — DocSend's next-page arrow is burned into some captured pages
   (it sat under the cursor). Cropping can't remove it; only re-capture or the real PDF can.
5. **Play-UI** — Stage 4 landed as a filmstrip + PDF link, not true in-shell paging. Option B
   (page JPEGs as Play-UI slides) is still the right next move; the JPEGs already exist.
6. **Framing slides** (Stage 5) — cover, sourcing, coverage matrix, closing.

## Correction — the `data-slot` scan does NOT do what this plan first claimed

The plan's "single highest-leverage fact" was wrong, and it's worth recording why so
nobody re-derives it.

`registry-loader.ts → scanScrollFile` is **a regex over each page's source text**
(`fs.readFile` + `/<section\b([^>]*)>/gi`). It matches literal `<section data-slot=…>`
written in the `.astro` file. Deal sections are emitted by `<DealSlide />`, a component —
so the scanner sees nothing. **Components are invisible to the scan.**

Two consequences, both now handled:

1. **The TOC must be fed from `src/data/slides.ts`** (the documented manual supplement).
   That file also **cannot import `deals.ts`**: the shell transpiles it and evaluates it as
   a `data:text/javascript` module, and a data: URL has no hierarchical base — any relative
   import throws `ERR_UNSUPPORTED_RESOLVE_REQUEST`. So the slot list is literal and must be
   kept in sync with `deals.ts` by hand, in the same order.
2. **`SLOTS` is keyed by variant alone, not deck+variant.** A second deck reusing `v1`
   merges its slots into the first deck's TOC. The deal deck therefore uses the variant
   `coverage-v1`, and lives at `/scroll/deals/coverage-v1/` with its TOC at
   `/toc/deals/coverage-v1`. Verified: the firm deck's TOC stays clean.

The `data-slot` attributes are still worth carrying — the runtime uses them for ranking
pills and Play-UI slot identity. They just don't populate the TOC.

## Findings worth keeping

- **`og-fetch.ts` reads the wrong env var.** The script expects `OPENGRAPH_IO_API_KEY`;
  `~/.secrets` defines `OPEN_GRAPH_IO_API_KEY`. Bridged at the call site this session, not
  fixed in place (drift policy — the skill is shared). One of the two names should win.
- **The existing lossless-decks slides carry no `data-slot`.** `src/pages/index.astro` and
  `scroll/firm/v1/index.astro` also fail typecheck — `ModeToggle` requires a `client` prop
  neither passes. Pre-existing; surfaced, not fixed.
- **Screenshot decks carry the viewer's identity.** The DocSend captures included the
  viewing account's avatar and a page counter. Anything screenshot-sourced needs the crop
  pass before it goes to a third party — this generalizes well past this deck.

## Risks, named up front

1. **`OPENGRAPH_IO_API_KEY` not in env.** Kills Stage 1 silently-ish. Check first.
2. **Early-stage companies have no OG image.** Expect ~a third to be thin. The fallback
   ladder in Stage 1 exists for exactly this; don't improvise per-company.
3. **PDF re-assembly is the one unwritten piece.** Everything else is composition. If the
   PyMuPDF rebuild loop misbehaves, Stage 4 Option B doesn't need it at all — the page
   images alone are sufficient. Route around it rather than debugging it.
4. **Scope creep into bespoke slides.** Fifteen deals × "just a small tweak" is the hour.
   One component, N instances, until Stage 2's exit criteria are met.
5. **Confidentiality.** Founders' decks under a private/shared tier only. No public route,
   no sitemap entry, and per `open-graph-share-seo-geo` discipline, nothing that makes these
   unfurl publicly.

---

## Why this could become a blueprint

If it works, the reusable pattern is not "a deal-coverage deck" — it's:

> **Their public self-presentation (OG) + our private commentary + their own long-form
> artifact (PDF), assembled one-entity-per-slot into a shell that already handles TOC,
> scroll, and play — where the scroll sections are the registry.**

That shape recurs: a portfolio review, an LP update, a conference speaker roster, a
partner directory. The candidate blueprint name is
**`Entity-Per-Slot-Deck-Assembly-From-Public-Cards-and-Private-Artifacts`**, and it should
be written only after a second, different engagement uses it — one run is an anecdote.

## See also

- `[[Study-Agent-Harnesses-and-Conversational-UI-Before-Cross-Product-Shell]]`
- `dididecks-ai/context-v/agent-skills/crawl-fetch-ingest/SKILL.md`
- `memopop-ai/apps/memopop-orchestrator/context-v/specs/Deck-Analyzer-Agent.md`
- `memopop-ai/apps/memopop-orchestrator/context-v/specs/Introducing-a-PDF-Parser-Agent.md`
- `dididecks-ai/apps/deck-shell/src/types/index.ts` — the `scrollPagesRoot` scan contract

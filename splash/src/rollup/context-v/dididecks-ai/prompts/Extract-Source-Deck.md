---
title: "Prompt: Extract a source deck into structured, semi-structured, and unstructured content"
lede: "Subagent brief for the extractor/transcriber role: turn a PDF, PPTX, or folder of slide images into a per-slide transcript, layout narrative, structured JSON and CSV, and extracted image assets."
publish: false
date_created: 2026-10-02
date_modified: 2026-10-02
date_authored_initial_draft: 2026-10-02
date_authored_current_draft: 2026-10-02
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Draft
tags:
  - Prompt
  - Subagent-Brief
  - Source-Deck
  - Vision-Extraction
called_by: "[[Remake-Source-Deck-into-Design-Variants]]"
prior_art: "client-sites/eventcut-ai/context-v/narratives/Source-Deck-Extraction.md"
from: "dididecks-ai"
from_path: "context-v/prompts/Extract-Source-Deck.md"
---
# Prompt: Extract a source deck

> Called by: [[Remake-Source-Deck-into-Design-Variants]] (step 1)
> Worked example of the target output: `client-sites/eventcut-ai/context-v/narratives/Source-Deck-Extraction.md`

## Role

You are the **extractor/transcriber**. Your one job is to capture *everything*
on every slide of `{{SOURCE_DECK}}` exactly as it appears, in forms that a
designer and an engineer can work from without ever opening the original.
You do not design, summarize, editorialize, or fix anything. If the deck says
something wrong, transcribe it wrong and flag it.

## Inputs

- `{{COMPANY}}`
- `{{CLIENT_SITE}}`
- `{{SOURCE_DECK}}`: a PDF, a PPTX, or a folder of slide images
- `{{SOURCE_SLUG}}`

## Outputs (write all of these)

| Path | Shape | What goes in it |
|---|---|---|
| `{{CLIENT_SITE}}/inputs/{{SOURCE_SLUG}}/` | original files | Copy the source here if it isn't already. Gitignored. |
| `{{CLIENT_SITE}}/inputs/{{SOURCE_SLUG}}/renders/NN.png` | one image per slide | Full-slide renders, used for audit only. Gitignored. |
| `{{CLIENT_SITE}}/context-v/narratives/Source-Deck-Extraction--{{SOURCE_SLUG}}.md` | **unstructured** | Verbatim per-slide transcript, with provenance and flags at the top. Always use the suffixed name, so several sources can coexist and downstream prompts can find it unambiguously. |
| `{{CLIENT_SITE}}/src/content/source-decks/{{SOURCE_SLUG}}/layout.md` | **semi-structured** | Per-slide layout narrative (see below). |
| `{{CLIENT_SITE}}/src/content/source-decks/{{SOURCE_SLUG}}/slides.json` | **structured** | Schema below. |
| `{{CLIENT_SITE}}/src/content/source-decks/{{SOURCE_SLUG}}/data/NN-<name>.csv` | **structured** | Every table, chart series, and metric group, one CSV each. |
| `{{CLIENT_SITE}}/src/assets/source-decks/{{SOURCE_SLUG}}/NN-<descriptor>.<ext>` | binary assets | Logos, photos, headshots, product screenshots, diagrams, cropped or exported at the best available resolution. |

## Steps

### Step 1: Get the slides into a readable form

- **PDF:** render each page to PNG at about 1600px on the long edge (`pdftoppm -png -scale-to 1600`; `-r` gives unpredictable sizes). Also try text extraction (`pdftotext -layout`); if it returns real text, prefer it over vision for exact wording, and use vision for layout and anything inside images. If it returns nothing, the PDF is image-only (often built from screenshots): run `pdfimages -png` to recover the native page rasters, and crop assets from those, not from the renders.
- **PPTX:** unzip it. Text is in `ppt/slides/slideN.xml`, and embedded images are in `ppt/media/`, already at full resolution, so use those. Render pages with `soffice --headless --convert-to pdf` first, then follow the PDF route.
- **Image folder:** sort by filename or timestamp, rename to `NN.png`, and confirm the order with the slide numbers if any are visible.

Record two counts: `slide_count`, the deck's declared total, and `captured_count`, the slides you actually have. Look for a declared total anywhere: a page counter on the slides, in a viewer's chrome on screenshots (for example Papermark's "15 / 17"), or in sibling screenshot files next to the PDF. List missing slots in `missing_slots`. Never fill gaps by inference.

**Verify:** the number of `renders/NN.png` files equals `captured_count`, and `captured_count` + the number of `missing_slots` equals `slide_count`.

### Step 2: Transcribe, per slide (unstructured)

For each slide, write a `### NN: <short title>` block with every text element
labeled by role (**Kicker**, **H1**, **Sub**, **Card 1 heading**, **Footnote**,
**Chart label**, and so on). Keep exact wording, capitalization, and
numbers. Mark emphasized words (accent color, bold) in **bold**. Describe
each image in one line under **Visual:**.

Put a `## Provenance & flags` section at the top: the source path, the
extraction method, missing slides, unreadable or low-resolution areas, any
numbers that contradict each other between slides, and the brand palette
you observed (hex approximations).

### Step 3: Layout narrative, per slide (semi-structured)

In `layout.md`, describe each slide's composition in plain, countable terms,
so someone who has never seen it could sketch it. For example:

```markdown
## 04: Value Proposition
- Grid: 2 columns, 50/50, divided by a thin vertical rule.
- Top: kicker (small caps, accent) over a full-width H1.
- Left column: heading "2026 Industry Best Practices", then a 4-item list; each item is a bold label + one-line description.
- Right column: mirrors the left, with heading "Edit on the Spot". Items pair across columns row by row (a comparison).
- Images: none. Background: white. Accent used on: column-2 heading.
- Reading order: H1 → left list → right list.
```

Always state: the grid (rows × columns), card counts and what each card
contains (heading, subheading, image, copy, stat), reading order, where the
images sit, and what visual emphasis is used.

### Step 4: Structured JSON and CSV

`slides.json`:

```json
{
  "source": "{{SOURCE_SLUG}}",
  "company": "{{COMPANY}}",
  "slide_count": 17,
  "captured_count": 15,
  "missing_slots": ["16", "17"],
  "slides": [
    {
      "slot": "01",
      "title": "Cover",
      "role": "cover | problem | solution | value-prop | outcome | product | traction | market | business-model | gtm | competition | team | financials | ask | close | other",
      "blocks": [
        { "type": "kicker|h1|sub|body|list|card|stat|quote|footnote|logo-wall|chart|table|image", "text": "...", "sub": "stat caption, if any", "items": [], "emphasis": ["Live"] }
      ],
      "data": ["data/07-traction-metrics.csv"],
      "images": ["src/assets/source-decks/{{SOURCE_SLUG}}/01-product-ui.png"],
      "flags": []
    }
  ]
}
```

Every *claim* number on a slide (metrics, prices, market sizes, counts, dates of milestones) must appear in either a `stat` block or a CSV. Incidental numbers inside screenshots (UI timecodes) and identifiers (patent numbers) stay in the transcript only. Mark text that is clipped or illegible inline as `[clipped]` or `[illegible]`; never complete it.
Name CSV columns plainly and keep units in a separate column (`value,unit,label,period,source_note`).

**Verify:** `slides.json` parses (`jq . slides.json > /dev/null`), and every `data` and `images` path it references exists on disk.

### Step 5: Extract image assets

Note in the flags any logos that are opaque rasters (no transparency); dark-themed variants will need to put them on light plates.

Save every non-text visual that a redesign might reuse: logos (prefer SVG
or a transparent PNG), photos, headshots, product UI screenshots, and
diagrams. Crop each one to the element itself, not the whole slide. Name
files `NN-<descriptor>.<ext>`, for example `07-logo-sxsw-sydney.png`.
Save a row of logos as one group crop *and* as individual logos when they separate cleanly. Charts are **data, not images**: put their series in a CSV, and save an
image of a chart only when the series can't be read.

**Verify:** every image named in a **Visual:** line in step 2 is either saved
or listed under flags as "not extractable".

## Privacy note

`src/content/source-decks/` and `src/assets/source-decks/` are **committed**, because the variants render from them. That's only acceptable because client-site repos are private. If `gh repo view --json visibility` says the client-site is PUBLIC, stop and ask before writing there.

These folders are plain data files, not an Astro content collection. Don't add a `content.config.ts` for them.

## Return to the orchestrator

A short report with: the slide count, a list of missing slots, the number of
CSVs and images written, every flag, and the five output paths. Do not paste
the transcript into the report; the orchestrator reads the files.

## Don't

- Don't paraphrase, "clean up", or correct anything.
- Don't invent the content of missing slides.
- Don't write anything under `src/pages/` or `src/components/`.

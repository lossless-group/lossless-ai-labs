---
name: triage-brand-assets
description: Sub-workflow of crawl-fetch-ingest. Walks every brand asset that was fetched for a firm through a quality review, classifying each into good-to-go / not-urgent-passable / urgent-rework / deferred-for-now so the user can prioritize manual cleanup.
from: "dididecks-ai"
from_path: "context-v/agent-skills/crawl-fetch-ingest/routines/triage-brand-assets.md"
---
# Routine — Triage Brand Assets

A subroutine of `crawl-fetch-ingest`. After CP3 (portfolio companies) finishes, brand-asset quality is **mostly good but not uniform** — sometimes the strip is suspect, sometimes the foreground is too light or too dark for its frame, sometimes the resolution won't scale. This routine is the human-in-the-loop checkpoint that catches those cases before publishing.

## When to invoke

The user says something like:
- "triage the brand assets"
- "review the logos for {firm}"
- "classify the brand assets"
- "audit the portfolio logos"
- "walk through the assets"

Default scope is **the most recently worked-on firm**. If multiple firms exist in `<cwd>/data/firms/`, ask which one (or accept a `--firm <slug>` argument).

## Output

A `review_status` field on each company's `portfolio/{co-slug}.md` frontmatter, set to one of:

| Status | Meaning |
|---|---|
| `pending` | Default. Not yet reviewed. |
| `good-to-go` | Asset is clean and ready to publish as-is. |
| `not-urgent-passable` | Works but could be upgraded later (e.g., raster instead of SVG, or low resolution). |
| `urgent-rework` | Visibly broken or wrong (missing, wrong company, bg-strip failed, light-on-light, etc.). Will look bad in production. |
| `deferred-for-now` | User explicitly chose to skip this round. Re-surface next pass. |

Plus optional `review_notes: "..."` for any human note, and `reviewed_at: <ISO timestamp>`.

## Workflow for Claude

When invoked:

### 1. Run the auto-classifier

```bash
~/.claude/skills/crawl-fetch-ingest/scripts/triage-classify.py <firm-dir>
```

Outputs a JSON report with one entry per company describing the suggested classification + the signals that led to it (file format, size, dimensions, % opaque pixels, mean foreground luminance, bg color detected, whether a frame `bgColor` is wired for it in the deck, etc.).

The classifier never persists anything on its own — it only **suggests**. The agent must confirm with the user before writing.

### 2. Present the summary

Show counts per suggested classification, with the urgent + flagged cases listed by name:

```
Triage scan complete for calm-storm-ventures:
  good-to-go ........... 14 (no action needed unless you disagree)
  not-urgent-passable .. 8
  urgent-rework ........ 5  → Squaremind, 9am-Health, Visible, lillian-care, lindus-health
  deferred-for-now ..... 0

Walk through the 5 urgents now? (yes / show all / let me pick / cancel)
```

### 3. Conversational walk-through

For each asset in the chosen subset, present a compact dossier and ask for a classification:

```
[3/5] Visible
  File:           portfolio/trademark__Visible.png  (12 KB, 800×800, alpha)
  Source:         og:image from www.calmstorm.vc/portfolio/visible
  bg-strip:       ImageMagick flood-fill, 14.1% removed, detected bg #000000
  Foreground:     mean luminance 234 (very light glyphs)
  Deck frame:     dark (bgColor #000000) — light glyphs visible
  Suggestion:     urgent-rework — only 14% stripped, suggests the strip got confused
                  and most of the original raster is intact. Risk: bg color
                  detection wrong, glyph + bg both dark.
  Open the file:  /Users/.../portfolio/trademark__Visible.png

Classify as: [g]ood-to-go  [n]ot-urgent-passable  [u]rgent-rework  [d]efer  [s]kip-to-next  [q]uit
```

The user types a single letter. The agent persists the choice to the `.md` frontmatter:

```yaml
review_status: urgent-rework
review_notes: ""              # any free-form text the user added
reviewed_at: 2026-05-10T15:00:00Z
```

Then move to the next.

### 4. Optional one-letter shortcuts

- `[m]essage` — capture a free-form note for this asset (e.g., "ask client which logo variant is canonical")
- `[o]pen` — `open <path>` to view the file in Preview / browser
- `[h]omepage` — `open <homepage>` to inspect the company's brand directly
- `[r]eclassify-all-from-here` — set the same class for this + all remaining

### 5. End-of-routine summary

```
Triage complete for calm-storm-ventures. Final tally:
  good-to-go ........... 16
  not-urgent-passable .. 7
  urgent-rework ........ 3
  deferred-for-now ..... 1

Urgent-rework list (suggested next moves):
  - Visible:       try Brandfetch tier 4 — site has no usable SVG path
  - lillian-care:  trainCase produced "Lilliancare"; rename + try logo-hunt on lilliancare.com
  - 9am-Health:    foreground luminance unstable; manual cleanup in Figma recommended

Deferred:
  - aiomics: user marked for later — re-surface next triage pass.
```

## Auto-classification rubric

The classifier scores each asset across a handful of axes, then chooses the worst-case bucket among the axes that flagged:

| Axis | Check | Worst-case bucket |
|---|---|---|
| **Existence** | File at the path in `logo:` frontmatter exists | `urgent-rework` if missing |
| **Format** | `svg` → automatic `good-to-go` for the format axis | `good-to-go` for svg |
| **bg-strip success** | If `logo_bg_stripped: true`, check `pct_transparent` (recomputed) | <30% = urgent-rework, 30–60% = not-urgent-passable, ≥60% = good-to-go |
| **Foreground luminance** | Mean luminance of opaque pixels (PNG/raster only). Reads frame context: if the deck assigns a dark frame, light glyphs are fine; if no bgColor (default white frame), light glyphs are bad. | Light glyphs on white frame = urgent-rework |
| **Resolution** | Width or height (raster only) | <80px = urgent-rework, 80–200px = not-urgent-passable, ≥200px = good-to-go |
| **File size** | Disk size | <500 B = urgent-rework (probably broken), 500 B – 4 MB = good-to-go, >4 MB = not-urgent-passable |
| **Flagged unresolved** | `status: unresolved` or `status: flagged` in frontmatter | `urgent-rework` regardless of other signals |

The agent's job during the walk-through is to **confirm or override** the suggestion. The classifier is wrong sometimes — that's why the human is in the loop.

## Persistence rules

- Only fields `review_status`, `review_notes`, `reviewed_at` are written. Nothing else in the frontmatter is touched.
- If `review_status` is already set (from a prior pass), surface that to the user with "Last reviewed YYYY-MM-DD as X. Re-classify? (y/N)". Skip without prompting if `--skip-already-reviewed`.
- All writes are idempotent. Re-running the routine on a fully-reviewed firm is a no-op unless the user accepts the re-classify prompts.

## Note on scope

This routine reviews **brand assets** (portfolio company logos). The same pattern extends to person assets (headshots — wrong person, low-res, missing) but is **not** implemented as part of this routine. If the user wants person-asset triage, write a sibling routine `triage-person-assets.md` rather than overloading this one.

---
site_uuid: fa6db2c3-6f9c-40c7-bb76-912a13e75986
hex_code: hkz4c1
title: "/data-assets/slides — reviewer audit of the slide tier, one row per slot, adapted-vs-stub per variant"
lede: "The third data-assets audit and the only one never promoted to the shell — adapted-vs-stub per variant, living only in calmstorm-decks."
summary: "Documents a shipped-but-unpromoted route. Its two siblings — [[data-assets-companies]] and [[data-assets-people]] — were lifted into `apps/deck-shell/` on 2026-05-17 and grew substantially in the move; this one was left behind in `client-sites/calmstorm-decks/` and has not been touched since 2026-05-10. Read this before rebuilding slide-audit tooling from scratch, and before assuming the data-assets trio is uniformly available: it is not. Written during the context-v frontmatter sweep as a capture of work that was otherwise only discoverable by reading calmstorm's page tree."
artifact_kind: route
ownership: client-local
mode: n/a
status: Shipped
route_pattern: "/data-assets/slides"
prerender: true
discovery_glob: "src/slides/by-title/{NN}-{slug}-v{1,2,3}.astro"
status_registry: "data/audits/slides.json"
composes:
  - SlidesStatusListTable
composed_by: []
plan_of_record: ""
file: client-sites/calmstorm-decks/src/pages/data-assets/slides.astro
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
date_created: 2026-08-17
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
date_authored_final_draft:
at_semantic_version: 0.0.1.0
status_tags:
  - Shipped
  - Client-Local
  - Not-In-Shell
tags:
  - Sitemap
  - Route
  - Slide-Audit
  - Dididecks
  - Calmstorm-Decks
publish: true
from: "dididecks-ai"
from_path: "context-v/sitemap/routes/data-assets-slides.md"
---
# /data-assets/slides

## Why this document exists

The `data-assets` audit trio was built in `calmstorm-decks`. Two thirds of it
was promoted: `companies.astro` and `people.astro` now live at
`apps/deck-shell/src/routes/data-assets/` and are documented as
[[data-assets-companies]] and [[data-assets-people]]. The companies page roughly
doubled in the move (175 → 422 lines) and picked up support for all three known
data layouts.

**`slides.astro` was not promoted.** It has no shell equivalent, no sibling doc,
and no changes since the day it was written. It was found only by walking
calmstorm's page tree during the 2026-08-17 context-v frontmatter sweep, which
is the argument for writing it down.

## What it does

One row per slide slot (17 in calmstorm), three variant cells per row (v1 / v2 /
v3). Each cell answers a single question: **is this variant a real adaptation, or
still a stub wrapper?**

Header counters: total slots, slots with at least one adaptation, slots fully
adapted (3/3), total adapted files, and stub count derived as
`totalSlots * 3 - totalAdaptedFiles`.

## The adapted-vs-stub heuristic

There is no flag in the file saying which it is. `src/lib/slide-status.ts`
decides by inspecting the import statement:

```js
// wrappers import a Section from layouts/sections; adaptations import only
// SlideCanvas and write the content inline
isAdapted = !/import\s+Section\s+from\s+["'][^"']*\/layouts\/sections\//.test(text)
```

File size is captured alongside it, so a suspiciously small "adaptation" is
visible as a quality outlier the same way a missing favicon is on the companies
page.

**This is a heuristic and will misreport** any variant that adapts its content
inline while still importing a Section for an unrelated reason. Worth knowing
before trusting a count.

## Review status — the part that actually persists

Four verdicts plus an implicit fifth:

| Key | Label |
|---|---|
| `urgent-redo` | urgent |
| `non-urgent-could-be-better` | non-urgent |
| `passable` | passable |
| `perfect` | perfect |
| *(absent from registry)* | pending |

Verdicts are keyed by `slideId` (the filename minus `.astro`) in
`data/audits/slides.json`, written through `POST /api/slide-status`
(`src/pages/api/slide-status.ts` — the endpoint is real, not aspirational).

The reviewing itself happens in the player, not on this page: open
`/play/section/{NN}` and press <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd>/<kbd>4</kbd>
for the four verdicts, <kbd>0</kbd> to clear. The audit page is the readout.

Practically this is a **dev-time workflow** — it writes to a file in the repo. It
gets bundled as a Vercel function in production for completeness, but persisting
a review verdict on a deployed instance writes somewhere ephemeral.

## Data flow

- `loadSlideStatusRows()` in `src/lib/slide-status.ts` — build-time only, uses
  `node:fs`, must not be imported from client code
- Walks `src/slides/by-title/`, joins against the `data/audits/slides.json`
  registry, returns one row per slot
- Rendered by `<SlidesStatusListTable rows={...} />`
- **Also consumed by `src/pages/index.astro`** — the deck root renders this table
  in place of a bare table of contents, so the loader has two callers, not one

## Render posture

- `noindex,nofollow` in the head
- Prerendered — unlike the companies and people audits, which were switched to
  `prerender = false` on 2026-05-17 so they route through the consumer's auth
  middleware. **A slide-tier audit exposes far less than a portfolio graph, but
  the asymmetry is unexamined rather than deliberate.** Worth a decision if this
  is ever promoted.
- Cross-links in the header to `/data-assets/companies`, `/data-assets/people`,
  and `/play`

## If this gets promoted to the shell

Three things the two promoted siblings had to solve and this one has not:

1. **Slot count is hard-coded to calmstorm's 17.** The shell versions discover
   across layouts rather than assuming one.
2. **`SLIDES` and the `by-title` directory convention** are calmstorm-shaped.
   Other client sites organize slides differently — see [[../../specs/Dididecks-AI-Slide-Decks-as-Code]].
3. **The prerender/auth decision above.**

## Related

- [[data-assets-companies]] — promoted sibling, SSR-gated, all three data layouts
- [[data-assets-people]] — promoted sibling, `role_class`-filtered
- [[play-slot]] — where the review verdicts are actually entered
- [[../components/SlideRankPill]] — the other slide-quality surface

## Removed dangling reference — 2026-08-17

The page's on-screen copy used to end with *"See
`context-v/prompts/Port-Astro-Deck-Sections-to-Slides.md` for the workflow."*
**That file never existed** — `calmstorm-decks` has no `context-v/prompts/`
directory at all, and the filename appears nowhere in the tree. The sentence was
removed from `slides.astro` during the context-v sweep rather than left pointing
at nothing.

**The workflow it promised is still undocumented.** The regex in
`src/lib/slide-status.ts` is currently the only definition of what separates an
adaptation from a wrapper, and it is a heuristic rather than a rule anyone wrote
down. If the porting workflow gets documented, this page is where to link it.

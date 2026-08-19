---
title: "Entity-Per-Slot Deck Assembly From Public Cards and Private Artifacts"
lede: "One entity per slot: their public card, our private read, their own artifact — assembled into a shell whose sections are the registry."
date_created: 2026-08-18
date_modified: 2026-08-18
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Draft
tags:
  - Blueprint
  - Dididecks
  - Deck-Assembly
  - Entity-Per-Slot
  - Open-Graph
  - Confidentiality-By-Architecture
site_uuid: 8cdc81aa-d21f-499f-8ab5-a62beff73e79
hex_code: fyumco
date_authored_initial_draft: 2026-08-18
date_authored_current_draft: 2026-08-18
publish: false
---

## Why Care?

Some decks are arguments. This kind is **evidence** — a roster where each entity gets a
slot, and each slot answers "who are they, what do we think, and can I see the primary
source?" without the reader taking our word for any of it.

The reusable move is not "a deal-coverage deck." It is:

> **Their public self-presentation + our private commentary + their own long-form
> artifact, assembled one-entity-per-slot into a shell that already handles TOC, scroll,
> and play — where the scroll sections are the registry.**

That shape recurs well past its first use: a portfolio review, an LP update, a conference
speaker roster, a partner directory, a vendor bake-off. Anywhere the unit of the document
is *an entity* and the credibility comes from *not being the only voice on the slide*.

**Evidence base: one confirmed run** (2026-08-12, ~9 entities, assembled in about an
hour by composing two existing systems rather than building a third). One run is an
anecdote. Treat the stage sequence as settled and the *generalization* as provisional
until a second, materially different engagement uses it.

## The three inputs, and why the mix is the point

| Input | Source | Whose voice | Confidentiality |
|---|---|---|---|
| **The public card** | OpenGraph fetch over the entity's own URL | Theirs, public | None — it is already on the open web |
| **The private read** | Hand-written, 2–4 bullets | Ours | Internal; the whole reason the deck is access-gated |
| **The long-form artifact** | A PDF the entity gave us | Theirs, shared on terms | **Highest** — see the rules below |

A slide with only our commentary is a claim. A slide with only their card is a link dump.
The combination is what makes it evidence: the reader sees how the entity presents itself,
sees what we independently think, and can open the primary document to check both.

## The architectural spine

**One data file is the registry.** Every downstream stage reads a single typed array,
one row per entity. Slug drives the DOM slot id, the asset directory, and the artifact
filename — so nothing needs a second lookup table.

```ts
interface Entity {
  slug: string;         // drives data-slot, asset paths, artifact filename
  name: string;
  url: string;          // the ONLY input the card fetcher needs
  commentary: string[]; // our read — the private column
  artifactPath?: string;// their PDF, if we hold one AND may show it
}
```

**The sections are the registry.** The shell scans rendered markup for `data-slot` and
builds its own table of contents. Consequence: adding an entity is adding a row, never
touching navigation. Corollary worth knowing before you rely on it — a slot only registers
if it actually renders, so a section that errors out disappears from the TOC silently
rather than loudly.

**Nothing blocks on completeness.** A row with a `url` and nothing else still renders a
card. A row with commentary and no `url` still renders a slot. Only the artifact column
gates a later stage. This is what lets assembly start before the roster is finished.

## The degradation ladder

Early-stage entities frequently have no `og:image` and thin metadata. Expect roughly a
third to be degraded, and decide the ladder *once* rather than improvising per entity:

1. OpenGraph fetch over the entity's own URL
2. Structured scrape fallback
3. Search-extract fallback
4. Hand-written title + one sentence + the entity's favicon

**A card must never render empty** — a name and one sentence beats a hole. Log which rows
fell back; that list is the triage queue, and it is more useful than a pass/fail count.

## Artifact handling

Rasterize page-by-page, recompress, rebuild into a single PDF. The settled baseline is
**150 DPI, JPEG quality 85** — good size/quality balance, roughly a 95% reduction on a
photo-heavy deck. If one chart-dense artifact goes illegible, bump *that one* rather than
moving the global default.

Two things to know before you commit to this:

- **Rasterizing kills the text layer** and any live links inside the document. For a
  "look at these entities" artifact that trade is fine. If an entity's links matter,
  keep their original for that one.
- **Screen-captured material carries the viewer's identity.** Captures taken from a
  hosted document viewer embed the viewing account's avatar and viewer chrome in the
  page images.

## Confidentiality by architecture

This is the part most worth codifying, because it is the part that fails quietly.

1. **Prefer an entity-supplied file over a screen capture.** A document delivered through
   a tracked viewer was shared *on terms*. Re-hosting a cropped copy routes around both
   the sender's tracking and their consent — and a crop is not a fix for that, it is a
   cover for it. Every entity in a roster like this is one we have a live relationship
   with; asking for a shareable copy costs one message and removes the question.
2. **An incomplete capture is a request to make, not a capture to redo.** Missing pages
   and burned-in hover artifacts both resolve the same way: ask for the source file.
3. **The registry lives in the private repo. Always.** Entity names, access notes, and
   our commentary belong in the data file inside the access-gated site — never in the
   plan, the blueprint, or any doc in a public repo. Method documentation describes the
   *shape*; the private repo holds the *instances*. This blueprint is itself the worked
   example: it is publishable precisely because it names no one.
4. **Private or shared distribution tier only.** No public route, no sitemap entry,
   nothing that lets these unfurl in a link preview. This is the one decision in the
   build that is not reversible later — set it before the first slide exists.
5. **Ignore the artifacts in git.** Binaries and the registry stay untracked even in the
   private repo, so a later visibility flip cannot retroactively expose them.

## Stage sequence

| Stage | Output | Notes |
|---|---|---|
| 0 | The registry file | Write it before any slide. Everything reads it. |
| 1 | Cached cards, one per entity | Runs unattended. Cache committed so builds are offline-safe. |
| 2 | One slot per entity | **The shippable core.** One component, N instances. |
| 3 | Optimized artifacts | Parallel with Stage 2 review. Report before/after sizes. |
| 4 | Artifact playable in-shell | The cut line. A filmstrip plus a link is an acceptable landing. |
| 5 | Framing slides | Cover, sourcing, coverage matrix, closing. |
| 6 | Degraded-card triage | Work the fallback log from Stage 1. |

Stages 0–3 are the hour. Everything after is optional and should be treated as such when
the clock is the binding constraint.

## Failure modes, named

1. **Scope creep into bespoke slides.** N entities x "just a small tweak" *is* the hour.
   One component, N instances, until Stage 2's exit criteria are met.
2. **Commentary is the long pole and only one person can write it.** Render an explicit
   "pending" state so the gap is visible rather than silent, and ship the frame around it.
3. **Missing API credentials kill Stage 1 semi-silently.** Check env first — a 30-second
   fix at the start, a 10-minute derail in the middle.
4. **Artifact re-assembly is the only genuinely unwritten piece.** Everything else is
   composition. If the rebuild loop misbehaves, route around it — the page images alone
   satisfy Stage 4's fallback. Do not debug it on the clock.

## See also

- [[Quick-Slides-Assembly-to-Demo-Deal-Coverage]] — the run this generalizes from
- `dididecks-ai/apps/deck-shell/` — the shell providing TOC, scroll, and play
- `crawl-fetch-ingest` skill — the card fetcher and its fallback ladder
- `open-graph-share-seo-geo` skill — why the distribution tier must be set first

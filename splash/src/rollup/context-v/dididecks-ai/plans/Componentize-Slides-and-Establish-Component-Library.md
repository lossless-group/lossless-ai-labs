---
title: "Componentize Slides and Establish Component Library"
lede: "Walk the calmstorm-decks slide deck page-by-page, extracting raw inline HTML+CSS into a properly-taxonomized Astro component library while simultaneously building the design system that backs it. The end state: every slide variant composes from named, reusable parts; `components/basics/` stops being a dumping ground; and the work doubles as the first concrete proof of the sibling Visual-and-Diagram-Component-Library spec."
date_created: 2026-05-11
date_modified: 2026-05-16
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.3.0
tags:
  - Plan
  - Calmstorm-Decks
  - Component-Library
  - Design-System
  - Componentization
  - Slide-Iteration-Workflow
  - Directory-Taxonomy
  - Non-Destructive-Refactor
  - Distribution-Tier-Awareness
  - Privacy-Paradigm
status: Deferred
deferral_note: |
  Destination retargets per the Chroma-Parity exploration's Open Question
  #4: from `client-sites/calmstorm-decks/src/components/` to
  `apps/deck-shell/components/`. The one-paragraph in-body edit reflecting
  that retarget has not been applied. Drift to watch: DeckOverlay--Scroll-UI
  and DeckOverlay--Play-UI (landed 2026-05-15) are the FIRST instances of
  this componentization living in the shell; future componentization should
  follow that pattern — paired --Scroll-UI / --Play-UI suffix discipline
  where the UI mode matters, mode-agnostic naming where it doesn't.
  The substance of this plan remains valid; only its execution venue moved.
from: "dididecks-ai"
from_path: "context-v/plans/Componentize-Slides-and-Establish-Component-Library.md"
---
# Componentize Slides and Establish Component Library

> Plan of record for the slide-by-slide componentization sweep of `client-sites/calmstorm-decks`. The goal is **not** a big-bang refactor; it is a disciplined per-slide cadence where each slide we touch lands on a shared vocabulary of named Astro components and shared design-system tokens, while every untouched slide keeps working unchanged. The work is also the first concrete substrate for the sibling spec `Dididecks-AI-Visual-and-Diagram-Component-Library.md` — what we extract here becomes the seed corpus of the library that all future client-sites will inherit.

## Why this plan exists

### The lazy-naming problem

`src/components/basics/` has drifted into a generic dumping ground. It currently holds six files:

- **Real basics** — universal chrome the entire deck relies on: `DeckHeader.astro`, `DeckNav.astro`, `MetaTags.astro`, `GateScript.astro`.
- **Mis-shelved** — feature surfaces for the audit dashboard that were dropped into `basics/` because no other directory existed: `AssetsDataPanel.astro`, `SlidesStatusListTable.astro`.

That second bucket is the symptom. The cause is that **the project never established a taxonomy** beyond `basics / markdown / slides`. So every time a new piece of UI got built, the easiest place to drop it was `basics/`. Repeated, this rots into "everything is basics" — which is the same as having no taxonomy at all.

This plan fixes the taxonomy **first**, then walks the slides, so the per-slide extractions land in the right place from minute one rather than being moved twice.

### The duplication problem

Three near-identical copies of every slide section currently exist:

- `src/layouts/sections/teaser/T01..T17` — the original v1 scroll deck (~3.4k lines).
- `src/layouts/sections/teaser-v2/T01..T17` — v2 scroll deck (~3.4k lines).
- `src/layouts/sections/teaser-v3/T01..T17` — v3 scroll deck (~3.4k lines).
- `src/slides/by-title/{nn}-{slug}-v{1,2,3}.astro` — 51 SlideCanvas-wrapped 1920×1080 variants (~11.2k lines).

Each file redeclares the same scoped CSS for the same conceptual pieces: an eyebrow, a section title, a subtitle, a card, a chip, a count badge. The cost of changing the "card" style today is editing it in 51+17×3 = 102 places. The cost of changing it after componentization is one file.

### The "componentize what's not Astro yet" problem

Even within a single slide file, large chunks of `.astro` are still raw HTML+CSS that *should* be small named Astro components. The slide-by-slide cadence is the cheap forcing function: we don't refactor in the abstract — we componentize **only the parts the slide in front of us actually uses**, and leave the rest alone until its slide's turn comes up.

### The privacy-paradigm constraint (added in v0.0.2)

The parent spec `Dididecks-AI-Slide-Decks-as-Code.md` (NS-1 and §"Eventually: Individual ↔ Team private workspaces") commits the system to **three distribution tiers**, not one. Componentization must respect them from the start, because some "internet convention" components are **only legal at the publish tier** — rendering them at a lower tier is a privacy leak.

| Tier | What it is | What may be rendered into the dist |
|---|---|---|
| `private` | **Individual-private.** Default for new content. One author, local workspace, never published. Calmstorm's current cover-page-gate posture for `/thesis*` belongs here. | Base meta (charset, viewport, title), `<meta name="robots" content="noindex,nofollow">`, GateScript. **No** OG image, **no** Twitter Card, **no** sitemap entry, **no** llms.txt entry, **no** JSON-LD, **no** third-party analytics. |
| `shared` | **One-to-several, default private.** Team-private or sent to a known small audience (LPs, advisors). The link is *expected to unfurl* in iMessage / Slack / WhatsApp for the invited recipient, but is **not** discoverable. | Above, PLUS OG image + Twitter Card (so unfurls work for the invited correspondent — the unfurl bot is a *known* lookup, not discovery). Still **no** sitemap, **no** llms.txt, **no** JSON-LD, **no** third-party analytics, still `noindex,nofollow`. |
| `public` | **One-to-many publish.** The firm-public surface — material the firm *wants* found. SEO-discoverable and GEO-legible (LLM-ingestable via llms.txt). | All of the above plus canonical URL, OpenGraph + Twitter Card, sitemap entry, robots.txt allowance, llms.txt and llms-full.txt entries, JSON-LD Article/CreativeWork schema, first-party analytics if any. |

**Implication for the component library.** A subset of components — call them "convention components" — emit HTML *whose presence in the dist is itself a privacy claim*. Examples: an `<og:image>` tag is a claim that this URL is shareable to a known audience; a `<link rel="canonical">` is a claim that this URL is the public address of the content; a sitemap entry is a claim that the URL is publicly listable. These cannot live anywhere in `basics/` or `primitives/` without a tier-awareness layer wrapping them.

**The chosen design (subject to revision in Phase 0):**

1. **Add `src/components/publish/`** to the taxonomy as a peer of `basics/`. It holds components that **only render at `public` tier** — `LlmsTxtEntry`, `SitemapEntry`, `JsonLdDeckSchema`, `CanonicalLink`, `PublishAnalytics`. They are imported by page layouts but gated by the tier resolver — they are not unconditionally mounted.
2. **Add `src/components/share/`** as a second peer. It holds components that render at `shared` AND `public` tiers — `OpenGraphMetaTags`, `TwitterCardMetaTags`. Same gating discipline: imported by layouts, gated by the resolver. The split between `publish/` and `share/` matters because the `shared` tier wants unfurls but not discovery.
3. **`basics/MetaTags.astro` becomes tier-aware.** It always emits the base bits (charset, viewport, title, description); it conditionally emits `noindex,nofollow` (at `private` + `shared`) or omits it (at `public`); it never emits OG, Twitter Card, canonical, or JSON-LD by itself — those come from `share/` and `publish/`. Result: `MetaTags` stays a true basic.
4. **Tier resolution lives in `src/lib/distribution-tier.ts`.** A function `getDistributionTier(pathname: string)` reads from a per-deck config (probably the `calmstorm: { ... }` block in `package.json`, or a sibling `deck.config.ts`). The PageAsDeckWrapper consumes it. **Tier is page-level metadata, not slide-level** — slides inherit their tier from the deck they're part of, by design (a partner cannot mistake a single slide's tier mid-presentation).
5. **`robots.txt` and `public/llms.txt` are dist-level, not component-level.** A build-time script (or Astro integration) emits them based on which pages resolve to `public` tier. Out of scope for v1 of this plan; flagged for follow-up.

**What this changes in this plan:**

- Phase 0's taxonomy migration now includes creating `publish/` and `share/` (empty), in addition to the previously-named `audit/`, `primitives/`, `patterns/`, `diagrams/`.
- A new **Phase 0.5** audits the existing `basics/MetaTags.astro` and any inline OG / Twitter Card emissions across pages to identify what's leaking which tier — *before* the slide-by-slide loop starts.
- Calmstorm's current deck is in `private` tier today (it has cover-page gating + `noindex` + `robots.txt: Disallow: /`). The migration should not silently promote it to `shared` or `public` by adding OG components mid-loop. **All decks default to `private`; promotion is explicit.**

**What this plan does *not* try to design.** The full publish pipeline (the NS-1 white-label surface, the OAuth-gated DD-tier session telemetry from `Confidential-Access-v2`, the team-private sync semantics) is parent-spec territory and gets its own plan. This plan only commits to making the component library *not foreclose* the tier model — same discipline the parent spec applies to v1 vs. v2+ workspaces.

### Alignment with prior commitments

- **Non-destructive iteration** (Design Principle #3 of `Dididecks-AI-Slide-Decks-as-Code`). Variants are kept side-by-side; we never overwrite a working v1 to make v2. Same discipline applies here: the section files in `teaser/`, `teaser-v2/`, `teaser-v3/` and the 51 slide variants **stay where they are** while we build the library underneath them. A slide is "migrated" only when the migrated version is proven and the user accepts it.
- **Existing utility classes**. `src/styles/theme.css` already publishes `.slide`, `.slide-warm`, `.slide-content`, `.eyebrow`, `.section-title`, `.subtitle`, `.affiliation-chip`, `.reveal-item`. The component-library work *uses these classes as the underlying paint*; the components are named React/JSX-style wrappers around the existing utility CSS, not a parallel CSS system.
- **`deck-iteration-workflow` skill**. Per-slide cadence, narrative-source-aware, variant-preserving.

## The corrected component taxonomy

This is the directory layout under `src/components/`. Established **before** any slide work begins so extractions land in the right place.

```
src/components/
├── basics/        ← universal chrome that renders at EVERY tier. DeckHeader,
│                    DeckNav, MetaTags (the tier-aware base meta), GateScript,
│                    future Href, ExternalLink. Rule: if it lives on every
│                    page regardless of distribution tier, it's a basic.
│                    Analytics is NOT here — first-party-only analytics
│                    belongs in `publish/` because it's a publish-tier claim.
│
├── share/         ← components that render at `shared` AND `public` tiers
│                    only. OpenGraphMetaTags, TwitterCardMetaTags, future
│                    UnfurlImageHint. Imported by layouts but gated by the
│                    tier resolver — never unconditionally mounted. Rule:
│                    if its presence in the dist is a claim that this URL
│                    is shareable to a known correspondent, it's share/.
│
├── publish/       ← components that render at `public` tier ONLY.
│                    LlmsTxtEntry, SitemapEntry, JsonLdDeckSchema,
│                    CanonicalLink, PublishAnalytics. Same gating
│                    discipline. Rule: if its presence in the dist is a
│                    claim that this URL is publicly discoverable, it's
│                    publish/.
│
├── audit/         ← audit-dashboard surfaces. AssetsDataPanel,
│                    SlidesStatusListTable. Anything that powers the
│                    `/data-assets`, `/`, `/changelog` audit views.
│                    Rule: if it shows the state of the deck rather than
│                    *being* the deck, it's audit.
│
├── slides/        ← slide-infrastructure components. SlideCanvas (the
│                    1920×1080 stage), future SlideBackdrop, SlideChrome,
│                    RevealGroup. Things every slide *shell* uses, not
│                    things a slide's *content* uses.
│
├── primitives/    ← atomic deck-content building blocks. Eyebrow,
│                    SectionTitle, Subtitle, Card, Chip, Plate, KpiTile,
│                    Callout, Bullet, RevealItem. One concept each.
│                    No layout responsibility — they don't decide where
│                    they sit, only what they look like.
│
├── patterns/      ← composed recurring slide-content patterns built FROM
│                    primitives. SlideHeader (Eyebrow + SectionTitle +
│                    Subtitle), TeamCard, PortfolioCategoryCard, KpiRow,
│                    MomentumPanel. These DO have a layout opinion.
│                    Rule: a pattern shows up on ≥2 slides; if it's
│                    one-slide-only, it stays inline in that slide.
│
├── diagrams/      ← (later) the universe described in the sibling spec
│                    Dididecks-AI-Visual-and-Diagram-Component-Library:
│                    Matrix2x2, ValueChain, Stack, Venn, Sankey, Timeline.
│                    Out of scope for v1 of this plan; the directory is
│                    created empty so future work has a home.
│
└── markdown/      ← unchanged. LFM renderers. AstroMarkdown, Callout,
                     CodeBlock, MarkdownImage.
```

### Why this split (the rule-of-thumb test)

When a new piece of UI lands, ask in order:

1. **Does its presence in the dist make a publicness claim?** (sitemap entry, llms.txt entry, canonical URL, JSON-LD, third-party analytics) → `publish/`.
2. **Does it support unfurling to a known correspondent?** (OG image, Twitter Card) → `share/`.
3. Is it on every page regardless of tier? → `basics/`.
4. Does it show the deck's *state* rather than the deck's *content*? → `audit/`.
5. Is it part of the slide *shell* itself? → `slides/`.
6. Does it represent **one concept** with no layout opinion? → `primitives/`.
7. Is it a **composition of primitives** used on ≥2 slides? → `patterns/`.
8. Is it a recurring *visual / mental model*? → `diagrams/` (later).
9. Otherwise — it stays inline in the slide that owns it. **One-slide-only is not promoted.**

This is deliberately stricter than what's there today. The "promote on ≥2 uses" rule is the discipline that prevents `patterns/` from becoming the next `basics/`. The "tier-claim first" rule (steps 1–2) is the discipline that prevents privacy leaks by accidental component placement.

## Phase 0 — Taxonomy migration (do this once, do it first)

Before touching any slide content, lock the directory taxonomy:

1. Create empty directories: `src/components/share/`, `src/components/publish/`, `src/components/audit/`, `src/components/primitives/`, `src/components/patterns/`, `src/components/diagrams/`.
2. **Move** (with `git mv` to preserve history):
   - `src/components/basics/AssetsDataPanel.astro` → `src/components/audit/AssetsDataPanel.astro`
   - `src/components/basics/SlidesStatusListTable.astro` → `src/components/audit/SlidesStatusListTable.astro`
3. Update **all** import paths referencing those two files. Search-and-replace, then `pnpm dev` to verify.
4. Confirm `src/components/basics/` now contains only: `DeckHeader.astro`, `DeckNav.astro`, `MetaTags.astro`, `GateScript.astro`. These are the canonical basics.
5. Commit as a single move-only commit: `refactor(components): split audit surfaces out of basics/ into audit/`. **No content changes** in this commit — pure relocation, so the diff is reviewable as taxonomy alone.

This is the only "big" move in the plan. Everything after is per-slide and incremental.

## Phase 0.5 — Distribution-tier audit and resolver (new)

Before Phase 1 primitives, audit and harden the tier-awareness layer. This is one commit (or a tight pair) and unblocks the rest of the work.

1. **Audit current emissions.** Grep `src/pages/`, `src/layouts/`, and `src/components/` for: `og:`, `twitter:`, `<link rel="canonical"`, `application/ld+json`, references to `llms.txt`, `sitemap`, third-party analytics scripts (Plausible, GA, PostHog, etc.). Document what is currently emitted **and at which route**. The current state likely has very little of this — calmstorm is in `private` tier — but the audit nails down the baseline.
2. **Read the existing posture.** `Gate-Sensitive-Information-with-Simple-Code.md` documents the current cover-page gate + `noindex` + `robots.txt: Disallow: /` setup. Capture which deck routes are gated and which (if any) leak. Capture `vercel.json` for `X-Robots-Tag` headers if present.
3. **Build `src/lib/distribution-tier.ts`.** Single function: `getDistributionTier(pathname: string): "private" | "shared" | "public"`. Reads from a per-deck config — start with a literal map (`/thesis` → `private`, etc.), refactor to read from `package.json` or a sibling config later. **Default tier for unmapped routes is `private`.** Fail-closed.
4. **Refactor `basics/MetaTags.astro`** to be tier-aware: take an optional `tier` prop, but if omitted, resolve via `getDistributionTier`. Always emit base meta. Emit `noindex,nofollow` for `private` and `shared`. Never emit OG/Twitter/canonical/JSON-LD itself — those go in `share/` and `publish/`.
5. **Leave `share/` and `publish/` empty for now.** They get populated when (and only when) a deck route is intentionally promoted to that tier. The first real fill will not be in this plan.
6. **Commit:** `refactor(meta, lib): introduce distribution-tier resolver + tier-aware MetaTags`. Verify `/thesis*` routes still emit `noindex` and still gate via cover page — no regression in privacy posture.

The deliverable of Phase 0.5 is: every page now goes through a tier resolver before it emits convention HTML. Promoting a deck from `private` to `shared` or `public` later becomes a config change, not a component-import change.

## Phase 1 — Seed the primitives layer from existing CSS

`src/styles/theme.css` already publishes the underlying utility classes for the most common primitives. Wrapping them in Astro components is mostly a typing/ergonomics win; the actual visual contract continues to live in CSS.

Seed `src/components/primitives/` with the small set of primitives **every slide currently uses**:

| Primitive | Wraps | First-pass API |
|---|---|---|
| `Eyebrow.astro` | `<p class="eyebrow">` | `<Eyebrow>Team</Eyebrow>` |
| `SectionTitle.astro` | `<h2 class="section-title">` | `<SectionTitle level={2}>...</SectionTitle>` |
| `Subtitle.astro` | `<p class="subtitle">` | `<Subtitle>...</Subtitle>` |
| `Chip.astro` | `<span class="affiliation-chip">` (rename TBD) | `<Chip variant="affiliation">...</Chip>` |
| `RevealItem.astro` | `<* class="reveal-item" data-reveal>` | `<RevealItem as="article" delay={150}>...</RevealItem>` |

Build these **without** touching any slide. Each primitive is < 30 lines. Each is a thin wrapper that takes children and props and emits the existing class names. They are immediately usable; the slides will start consuming them in Phase 2.

**Acceptance check for Phase 1:** the dev build passes, no slide visually changes, and `src/components/primitives/` has the five files above with corresponding tests-by-eye via the existing routes.

## Phase 2 — Slide-by-slide componentization (the long phase)

This is the bulk of the work. **One slide section at a time**, in numbered order (01 → 17). Each section gets the same treatment:

### Per-slide cadence (the loop)

For slide section `nn` (e.g., `03-venture-team`):

1. **Read the three variants.** Open `src/slides/by-title/{nn}-{slug}-v1.astro`, `-v2.astro`, `-v3.astro` side by side. Note what is *the same across all three* (candidates for promotion) and what is *intentionally different* (stays variant-local).
2. **Read the three teaser sources.** `src/layouts/sections/teaser/T{nn}-*.astro`, `teaser-v2/T{nn}-*.astro`, `teaser-v3/T{nn}-*.astro`. These are the source files the slide variants were COPIED from. They are still being consumed by the assembled scroll decks at `/thesis`, `/thesis/version-2`, `/thesis/version-3` — **do not delete them yet.**
3. **Identify the patterns.** What composed structure is reused ≥2 times across these six files? (e.g., for slide 03, "TeamCard" is reused 4× in v1 and 4× in v2; it is a pattern.) Promote it to `src/components/patterns/{Pattern}.astro`. Build the pattern from primitives (Phase 1) plus the slide-specific layout CSS.
4. **Identify any new primitives.** Did this slide use something more atomic than what's already in `primitives/`? (e.g., a `Plate` for v3's bottom chrome, a `KpiTile` for slide 14.) Add it to `primitives/`.
5. **Migrate v1 first.** Rewrite `src/slides/by-title/{nn}-{slug}-v1.astro` to compose from primitives + patterns. **Keep the file path the same** — we're rewriting in place. The variant page stays the test surface; we're just replacing the body with composed components.
6. **Verify visually.** Open the slide route in the dev server. Compare against the pre-migration version (git can show it). Pixel-parity is the target. If it shifts, fix the primitive/pattern CSS — not the slide.
7. **Repeat for v2 and v3** of the same slide section.
8. **Update the teaser sources last.** Once all three slide-by-title variants are componentized and verified, update the corresponding `teaser/`, `teaser-v2/`, `teaser-v3/` files to consume the same primitives + patterns. The assembled scroll decks at `/thesis*` should be checked again after.
9. **Commit the slide section as one logical unit.** `ship(slide-{nn}-{slug}): componentize across v1/v2/v3 + teaser sources`. The commit message lists what got promoted to `primitives/` and `patterns/`.

### What stays inline (resist over-extraction)

- One-off layouts that only this slide uses.
- Variant-specific decorative chrome (v3's bottom plate marks, e.g.) **unless** the same chrome appears on a second slide's v3 — then promote.
- Slide-specific data binding logic. The pattern receives data; it doesn't fetch it.

### Order of slides

Take them in narrative order — `01-disclaimer-confidential` → `17-fund-terms` — for two reasons:
1. The narrative order is the order a reader hits them, so the early slides are the highest-leverage ones to get right.
2. Patterns extracted from early slides are likely to be reused by later slides. Going in order maximizes that reuse.

Estimated per-slide effort: 30–60 minutes for the simple slides (track-record, fund-terms), up to 2–3 hours for the dense ones (venture-team, portfolio-snapshot, market-momentum). Total: roughly 25–40 hours of focused work. **Not a single-session task.** Treat each slide section as a discrete, committable unit.

## Phase 3 — Promote the patterns the slides revealed

After ~8–10 slide sections have been migrated, pause and review `src/components/patterns/`. Some patterns will turn out to be:

- **Truly recurring** — keep, polish the API, document in a short header comment.
- **One-slide-only after all** — demote back to inline in their owning slide. (The "≥2 uses" rule is enforceable in retrospect.)
- **Almost-duplicates** — two patterns that turned out to be the same thing with different prop names. Merge.

This phase is a **cleanup pause**, not new work. It prevents `patterns/` from becoming `basics/`-style sprawl. Repeat the pause at the ~16-section mark.

## Phase 4 — Build `/design-system/` (overview) and `/component-library/` (catalog) as two distinct routes

Once Phase 2 is complete (all 17 slide sections componentized), build the two-route reference surface. Both routes are `private` tier (noindex, behind the cover-page gate), both serve **two audiences simultaneously — stakeholders and AI agents** — and the access path goes through the audit dashboard, not the presentation header.

### Why two routes, not one

The astro-knots family (dark-matter, fullstack-vc, banner-site) collapses everything into a single `/design-system/` route. We **deliberately diverge** for DidiDecks because component-iteration is the core product loop — the embedded chat composes new slides from named components, and stakeholders iterate on specific components per engagement. A single hub conflates two different jobs. Split:

- **`/design-system/`** — the high-level **contract**. Color tokens, typography scale, mode contract (light/dark/vibrant), shadow/rounded/spacing scales, the eight prose sections of the Stitch open spec, the imagery recipe. **Stable**. Changes here ripple through every component. **Audience:** anyone orienting to the visual identity for the first time — new contributor, new client, new agent. **The live rendering of `DESIGN.md`** — same source of truth, two surfaces.
- **`/component-library/`** — the **catalog**. One hub page → categorized menu → one sub-page per component with variants, props, CSS contract, and demo data. **Iterative**. This is where a stakeholder says "the team-card needs more breathing room around the headshot" and the iteration happens on that exact sub-page in isolation. **Audience:** anyone making changes to a specific component, plus agents looking up which primitives/patterns exist before composing a slide.

The discipline: `/design-system/` answers *"what are the rules?"* — `/component-library/` answers *"what's in the kit, and what does each piece do?"*

### Both routes are agent-readable

DidiDecks's defining loop is the embedded chat composing slides from named components. **Claude needs to read the library before it can compose from it.** Three concrete agent-affordances:

1. **`DESIGN.md` at the repo root remains the canonical contract** (per the `maintain-design-md` skill). It is *already* agent-readable — Google Stitch open spec, YAML frontmatter with token groups, eight prose sections. `/design-system/` is the **live HTML rendering** of `DESIGN.md`, not a parallel source. When the tokens drift, `DESIGN.md` is updated first; the route re-renders from it.
2. **A component registry at `src/components/registry.ts`** enumerates every primitive and pattern with: import path, category (`primitives` | `patterns` | `slides` | `basics` | `audit` | `share` | `publish` | `diagrams`), one-line purpose, props schema (typed), CSS contract (tokens read), example invocations, and the demo route for the component. This is the **machine-readable index** that the agent consumes. Build the registry incrementally — each component added in Phase 2 lands its registry entry in the same commit.
3. **`/component-library/llms.txt` and `/component-library/llms-full.txt`** generated at build time from the registry. The `llms.txt` is a concise outline (component names + one-liners + sub-page URLs); the `llms-full.txt` is the full prose-form catalog with props, contracts, and example usages. Despite the calmstorm deck being `private` tier site-wide, **these manifests are explicitly emitted because they target *internal* agents reading from the repo, not external crawlers.** They live next to the route, not at the site root, so they aren't discoverable from `/llms.txt` (which the build skips for `private` decks per the tier discipline).

The result: a human opens the route and sees demos; an agent reads the registry (or its `llms.txt` projection) and gets a typed manifest of what's composable. Same source, two projections.

### Route structure

```
src/pages/
├── design-system/
│   ├── index.astro              ← live rendering of DESIGN.md prose + token tables
│   ├── tokens.astro             ← color / typography / shadow / rounded / spacing tables
│   ├── modes.astro              ← light / dark / vibrant side-by-side (when modes ship)
│   └── imagery.astro            ← OG / share-image recipe (per the `imagery:` DESIGN.md block)
│
└── component-library/
    ├── index.astro              ← category-grouped card hub (dark-matter pattern)
    ├── basics/                  ← one page per file in src/components/basics/
    │   ├── deck-header.astro
    │   ├── deck-nav.astro
    │   ├── meta-tags.astro
    │   └── gate-script.astro
    ├── primitives/              ← one page per primitive
    │   ├── eyebrow.astro
    │   ├── section-title.astro
    │   ├── subtitle.astro
    │   ├── chip.astro
    │   ├── card.astro
    │   └── reveal-item.astro
    ├── patterns/                ← one page per pattern
    │   ├── team-card.astro
    │   ├── portfolio-category-card.astro
    │   └── …
    ├── slides/                  ← slide infrastructure (SlideCanvas)
    ├── audit/                   ← audit surfaces (AssetsDataPanel, SlidesStatusListTable)
    ├── share/                   ← share-tier components (only documented; gating discipline noted)
    ├── publish/                 ← publish-tier components (same)
    └── diagrams/                ← (later — the visual-library)
```

The category sub-routes mirror `src/components/` 1:1 — same taxonomy on disk and on the web, so an agent or contributor can navigate either way without translating.

### Per-component sub-page contract

Each component sub-page (e.g. `/component-library/primitives/eyebrow`) lands the same five sections:

1. **Live demo** — at least the default invocation. For components with variants, all variants visible side-by-side. For mode-sensitive components, all three modes side-by-side (light / dark / vibrant) — once modes ship.
2. **Props** — typed table: name, type, default, required, one-line purpose.
3. **CSS contract** — the tokens this component reads from `theme.css`. Stable list.
4. **Composes from** — for patterns: which primitives the pattern is built on. For primitives: typically empty. For slides: which patterns it uses.
5. **Used by** — the slide sections (and routes) that currently consume this component. This is the *iteration leverage* — a stakeholder editing the team-card sees immediately which slides will be affected.

Sections 2–5 are pulled directly from the component's registry entry. Section 1 is hand-authored once per component.

### Access path

The deck root at `/` is the audit dashboard (post-gate menu pane). Add two tiles to `AssetsDataPanel.astro` (which after Phase 0 lives at `src/components/audit/AssetsDataPanel.astro`):

- **Design System** → `/design-system/` — for orienting to the visual identity.
- **Component Library** → `/component-library/` — for iterating on a specific component.

Both tiles are seeded into the dashboard in the same commit that creates `/design-system/index.astro` and `/component-library/index.astro` — discoverability lands with the route. **Not in the `DeckHeader` presentation chrome.** The presentation header stays Table of Contents · Scroll · Changelog — the deck-viewing audience never sees these audit surfaces. The split between presentation chrome (for the LP walking through the deck) and audit chrome (for contributors and stakeholders iterating) is preserved.

### Maintenance discipline

Per the fullstack-vc precedent: **every new component lands its `/component-library/{category}/{name}.astro` sub-page AND its `src/components/registry.ts` entry in the same change that introduces the component.** No drift, ever. The Phase 2 per-slide loop already commits each slide section as a logical unit — registry entries for any primitives or patterns extracted in that loop land in the same commit.

### What stays in `data-assets/`

The existing audit pages — `companies.astro`, `people.astro`, `slides.astro` — stay where they are. They show the *state* of the deck's content (which companies are represented, which people have headshots, which slides are at which status). The component library shows the *building blocks* available to assemble decks. Different things; different routes. The audit dashboard surfaces both.

## What this plan does *not* do

- **Does not touch `src/styles/theme.css`** except additively. The existing token system is sound; the work here is consuming it more disciplinedly, not replacing it.
- **Does not introduce React, JSX, or any framework Astro forbids.** Pure `.astro` components. Per `astro-knots` hard prohibitions.
- **Does not generalize to other client-sites yet.** `client-sites/reach-edu-hub` is on its own track. The library that emerges here is the *seed* of the cross-site library described in the sibling spec — promotion to a shared package (under `dididecks-ai/packages/` or similar) is a separate, future plan.
- **Does not build the diagram primitives** (Matrix2x2, ValueChain, Sankey, etc.) described in `Dididecks-AI-Visual-and-Diagram-Component-Library.md`. That work is sequenced *after* this plan completes and has its own spec.
- **Does not delete the `teaser/`, `teaser-v2/`, `teaser-v3/` directories.** They are kept as the assembled-scroll-deck implementations and migrated alongside their corresponding by-title variants in Phase 2 step 8.

## Open questions to resolve as we go

These do not block starting — they are flagged for resolution mid-flight:

1. **Where does the line sit between `primitives/` and `patterns/` for `Card`?** A team-card and a portfolio-category-card and a kpi-card all share a "framed surface" idea. Do we have one `Card.astro` primitive that the patterns wrap, or do we keep them fully separate? Likely answer: yes, a `Card.astro` primitive — but the call comes when slide 03 is migrated and we see what falls out naturally.
2. **Naming for what `affiliation-chip` becomes as a primitive.** `Chip.astro` is the obvious name, but the variant prop space (`affiliation`, `count`, `tag`, `flag`) needs to be enumerated as more slides reveal usages.
3. **Should `RevealItem` swallow the `data-reveal` + `--delay` ergonomics entirely**, or do we keep the data-attribute hook accessible for slide-specific stagger orchestration? Likely the wrapper exposes a `delay={N}` prop and a `disabled` opt-out, but the SlideCanvas reveal script needs to be re-checked for assumptions.
4. **Audit-dashboard relocation downstream effects.** Phase 0 moves two files. Verify no documentation, no `splash/` reference, no external link assumes `src/components/basics/AssetsDataPanel.astro`.

## Cross-references

- Parent spec: `context-v/specs/Dididecks-AI-Slide-Decks-as-Code.md`
- Sibling spec (downstream): `context-v/specs/Dididecks-AI-Visual-and-Diagram-Component-Library.md`
- Sibling plan (precedent for engagement-level plans): `context-v/plans/Init-Chroma-Decks-Client-Site.md`
- Workflow skills loaded for this work: `deck-iteration-workflow`, `astro-knots`, `context-vigilance`, `theme-system`, `maintain-design-md`.

## Status / next step

**Status:** Draft, ready for user review.

**Immediate next step on approval:** Execute Phase 0 (the directory move + import-path update for `AssetsDataPanel` and `SlidesStatusListTable`, plus creation of empty `share/` and `publish/` peers) as a single commit. Then execute Phase 0.5 (distribution-tier audit + resolver + tier-aware `MetaTags`) as a second commit. Pause for user confirmation before starting Phase 1 primitives.

## Cross-references for the privacy paradigm

- Parent spec NS-1 (two-sided system, private workspace ↔ publish surface): `context-v/specs/Dididecks-AI-Slide-Decks-as-Code.md`, §"NS-1" and §"Eventually: Individual ↔ Team private workspaces".
- Current gating posture for calmstorm-decks (cover page + noindex + Disallow): `client-sites/calmstorm-decks/context-v/explorations/Gate-Sensitive-Information-with-Simple-Code.md`.
- The DD-tier persistent-session model that future `publish/` work will integrate with: `Confidential-Access-v2-Persistent-Sessions-and-Telemetry` (referenced from parent spec NS-1).
- Skill: `open-graph-share-seo-geo` for the technical details of which meta tags / sitemap / llms.txt conventions to emit at the `public` tier when that work happens.

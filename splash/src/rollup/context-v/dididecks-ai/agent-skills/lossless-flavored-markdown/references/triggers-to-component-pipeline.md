---
from: "dididecks-ai"
from_path: "context-v/agent-skills/lossless-flavored-markdown/references/triggers-to-component-pipeline.md"
---

# Triggers → Component Pipeline

The paradigm is the spec. Everything else — the trigger map, the variant registry, the popover system, the OG fetcher, the citation resolver — is implementation of one idea:

> **User configurations declare syntax-triggers. Each trigger maps a markdown pattern to a component in the consuming framework. The pipeline normalises authoring syntax to component nodes and lets the framework render them.**

This file is for understanding *how* that pipeline works, *what* it currently produces, and *why* the result feels MDX-class without the JSX-shaped lock-in. Read it when you want to know what LFM can do — or when you're about to add a new trigger and need to know where it plugs in.

## The pipeline in four stages

```
                                                              ┌─────────────────┐
  ┌──────────────┐    ┌────────────┐    ┌──────────────┐     │  Site framework │
  │  .md source  │ ─> │ tokenize   │ ─> │ trigger      │ ──> │  components     │
  │              │    │ (remark)   │    │ match +      │     │  (Astro/Svelte/ │
  │              │    │            │    │ normalise    │     │   Solid/HTML)   │
  └──────────────┘    └────────────┘    └──────────────┘     └─────────────────┘
                          │                  │                     │
                       CommonMark         lookup in          render component
                       + GFM              trigger map         with parsed props
                       + directives       → component name    + slotted children
                       + obsidian         + props + children
                       callouts
                       + code fences
```

### Stage 1 — Tokenize

Standard `unified` / `remark` parsing pipeline. LFM stacks plugins:

- `remark-parse` — CommonMark baseline
- `remark-gfm` — tables, task lists, strikethrough, autolinks
- `remark-directive` — `:`, `::`, `:::` directive syntax
- `remark-callout` (custom) — Obsidian `> [!type]` syntax → directive AST nodes
- `remark-frontmatter` + Zod — YAML frontmatter validation
- `remark-fence-component` (custom) — fenced code blocks with non-language idents route to components

Output: a unified AST with directive nodes, fence nodes, and standard CommonMark/GFM nodes mixed together.

### Stage 2 — Trigger match

Each directive / Obsidian-callout / fence-routed node carries a `name`. The pipeline looks up that name in the **trigger map** — a YAML config that's the merge of:

1. `@lossless-group/lfm/triggers/default.yaml` (built-in, ~20 triggers)
2. `src/config/lfm-triggers.yaml` (site-specific, additive)

Match resolves to: a **component name**, a **props schema**, and any **defaults** the trigger declares.

### Stage 3 — Normalise

The matched node is rewritten into a uniform shape — call it a *component node*:

```ts
interface ComponentNode {
  type: 'lfm-component';
  componentName: string;           // resolves to a file path via component_path
  props: Record<string, unknown>;  // validated against the trigger's schema
  children?: AstNode[];            // for container directives (`:::`)
  meta: {
    sourceLine: number;
    triggerName: string;
    variant?: string;              // if `variant="…"` was declared
  };
}
```

This is the moment all the polyglot syntaxes converge. `:::callout{type="warning"}`, `> [!warning]`, and a Markdoc-shaped `{% callout type="warning" %}` all produce identical `ComponentNode`s. Downstream code never sees the original syntax.

### Stage 4 — Render

The consuming framework (Astro, in the primary case) walks the AST and dispatches each `ComponentNode` to its registered component. Astro Knots sites use a single `<LfmRenderer>` component that recurses the tree; other frameworks would write their own.

The renderer:
- Loads the component file from `component_path` (resolved at build time, not runtime)
- Passes `props` (validated)
- Passes `children` as the default slot
- Wraps with any class/style/data-* attributes the author declared (Layer 1, see [extensibility.md](extensibility.md))

## The current trigger catalogue (versatility evidence)

LFM is early but already covers a wide span of content patterns. The catalogue grows; here's what's in production today, grouped by what they *do* for content:

### Information density — telling readers "this matters"

| Trigger | Component | What it produces |
|---|---|---|
| `:::callout{type="warning"}` (or `> [!warning]`) | `Callout` | Coloured admonition with icon, title, body — six built-in types (info, tip, warning, danger, note, success) |
| `:badge[Stable]{variant="success"}` | `Badge` | Inline pill for status, version, dates — six variants |
| `:::details{title="…"}` | `Details` | Collapsible disclosure — `<details>` element with custom styling |

### Source attribution — earning reader trust

| Trigger | Component | What it produces |
|---|---|---|
| `[^hexcode]` + `[^hexcode]:` | `Citation` + `Popover` | Inline marker → on-hover popover with OG-fetched preview |
| `:::link-preview` | `LinkPreview` | Card / row / compact preview with OG image, title, description, attribution |
| `:::link-rollup` | `LinkRollup` | Multi-source preview block — useful for "further reading" |

### Media — making content feel less like a document

| Trigger | Component | What it produces |
|---|---|---|
| `::image{float="right" caption="…" source="…"}` | `Image` | Magazine-style figure with float, caption, source attribution |
| `:::image-gallery` | `ImageGallery` | Grid / masonry / carousel of images |
| Bare URL on its own line | `MediaEmbed` | Auto-detected YouTube / Vimeo / Loom / Spotify / etc. embed |
| ` ```mermaid ` | `Mermaid` | Diagram rendered via Mermaid.js |
| ` ```card-carousel ` | `CardCarousel` | YAML-driven card slider |
| ` ```image-grid ` | `ImageGrid` | Layout-only grid for arbitrary `::image` directives |

### Composition — structuring the page itself

| Trigger | Component | What it produces |
|---|---|---|
| `---slide---` | (slide separator) | Section boundary in deck-style content |
| `:::dialog{participants="…"}` | `Dialog` | Chat-bubble UI with role-aware avatars |
| Auto-generated TOC | `Toc` | Heading-hierarchy navigation |
| Wikilinks / backlinks | `WikiLink` | Cross-document linking with bidirectional resolution |

### Tier 3 wishlist (designed, not yet shipped)

Multi-column layouts, tabs, numbered procedures, Tufte sidenotes, JSON Canvas, Obsidian Bases (`.base` database views), full math/LaTeX, transclusion (`![[file.md]]`).

The point of the wishlist isn't aspiration — it's that the *paradigm* doesn't need to change to ship any of these. Each is a trigger entry plus a component file. The pipeline is the load-bearing piece; everything above is content the team adds when the use case shows up.

## The richness gradient — same content, three drafts

**Plain markdown (the mundane baseline):**

```markdown
Note: aging is accelerating toward 2.1B people 60+ by 2050 [1]. See the
research at https://helpage.org/research and the related video at
https://www.youtube.com/watch?v=dQw4w9WgXcQ.

[1]: https://helpage.org/research
```

What renders: a paragraph, a footnote at the end. Two URLs as plain links. Mundane.

**LFM with directives:**

```markdown
:::callout{type="key-insight" title="The demographic shift"}
Aging is accelerating toward **2.1B people 60+ by 2050**.[^1ucdcd]
:::

:::link-preview{format="card" aside="right-escape"}
https://helpage.org/research
:::

https://www.youtube.com/watch?v=dQw4w9WgXcQ

[^1ucdcd]: 2025-09-21. [Population ageing](https://helpage.org/research).
```

What renders: a styled callout with a hex-stable citation that pops a preview on hover, a Tufte-style aside link-preview card, an embedded YouTube player. Same content, four orders of magnitude more density.

**LFM with Obsidian aliases (same paradigm, different surface):**

```markdown
> [!key-insight] The demographic shift
> Aging is accelerating toward **2.1B people 60+ by 2050**.[^1ucdcd]

[^1ucdcd]: 2025-09-21. [Population ageing](https://helpage.org/research).
```

The Obsidian author writes what feels native; the pipeline normalises to the same `ComponentNode` as the directive form. Both ship to the same site, render identically.

## Sub-pipelines worth knowing about

Several triggers depend on shared infrastructure that runs alongside the main pipeline.

### OG fetch sub-pipeline

Citations, link-previews, link-rollups, and media embeds all need OpenGraph metadata. LFM fetches it **at build time** so popovers and previews appear instantly on hover (no client round trip). Default config:

```js
ogFetch: {
  enabled: true,
  timeout: 5000,           // 5s per URL — never bump above 10s in CI
  maxConcurrent: 10,
  cacheDir: '.lfm-cache/', // commit-able; speeds re-builds
  cacheTtl: '7d',
  fallback: 'graceful',    // missing OG → render link without preview
}
```

The cache (`.lfm-cache/og-data.json`) is conventionally committed to the repo. Re-builds are near-instant; CI invalidates per the TTL. **Don't bump `timeout` above 10s** — one unreachable URL stalls the whole build.

The metadata schema is canonical across all consumers:

```ts
interface LinkPreviewData {
  url: string;
  hexId: string;            // 6-char, links back to citation marker if applicable
  title?: string;
  description?: string;
  image?: string;           // absolute URL
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;       // must match actual bytes (see open-graph skill, rule 3)
  siteName?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  fetchedAt: string;        // ISO 8601 — when the build fetched
  sourceCatalogueId?: string; // optional bridge to canonical Sources collection
}
```

Cross-skill seam: `imageType` follows the [open-graph-share-seo-geo](../../open-graph-share-seo-geo/) rule that the declared MIME type must match the bytes the fetcher actually receives — not the URL extension.

### Popover sub-pipeline

Popovers (citations on hover) use **shared event delegation** at the document level, not per-marker listeners:

- One delegated mouseover listener handles all citations on the page.
- One reusable popover element repositions on hover instead of mounting/unmounting per citation.
- The OG metadata for every citation is embedded as JSON in the page bundle (from the fetch pipeline above), so hover never triggers a network request.

A doc with 200 citations adds *one* listener and *one* DOM node, not 400.

### Source-promotion bridge (forward-looking)

A locally-generated citation hex (e.g. `[^1ucdcd]` made up at draft time) is fine for one-off use. When a source gets cited across multiple documents, it's promoted to the canonical **Sources collection** — a content collection with one entry per source, owning the hex ID. From then on, the popover/card pulls the user-curated description from the Sources entry rather than the raw OG data.

This is partial today (`sourceCatalogueId` on `LinkPreviewData` exists; the promotion workflow is manual). The pipeline already knows how to consume it; the catalogue tooling is the late piece.

## Why "early but robust"

**Early:** the trigger catalogue is ~20 entries. Tier 3 wishlist is roughly the same size again. The Sources collection bridge is partial. Wikilinks are Beta. Math/LaTeX isn't shipped. There's no GUI for editing the trigger map.

**Robust in versatility:** every common content pattern that a long-form site reaches for — admonitions, citations with previews, captioned images, embedded media, dialog blocks, code with diagrams, structured aside cards — already has a trigger. Adding a new one is a YAML entry plus a component file. Backward compatibility is additive: new triggers don't change existing behaviour.

The robustness is in the **paradigm**, not in any specific component. New components ship without changing the parser, the renderer, or any consumer's existing markdown. That property is what makes LFM ship-ready even while the catalogue is still growing.

## Adding a new trigger — the recipe

When a new content pattern shows up enough that it deserves a trigger:

1. **Author the component** at `src/components/lfm/<Name>.astro` (or the framework's equivalent).
2. **Register the trigger** in `src/config/lfm-triggers.yaml`:
   ```yaml
   - name: pricing-table
     syntax:
       - pattern: ':::pricing-table{$attrs}\n$children\n:::'
     component: PricingTable
     component_path: src/components/lfm/PricingTable.astro
     props:
       tiers:     { required: true,  type: number, min: 1, max: 5 }
       highlight: { required: false, type: string }
   ```
3. **(Optional) Add variants** in `src/config/lfm-variants.yaml` if the same component should ship multiple presets.
4. **Use it.** No markdown spec changes needed; no parser changes needed; no other site has to know.

For the full trigger map schema, the variant registry, and the validation policies (`strictAttributes: 'error' | 'warn' | 'silent'`), see [extensibility.md](extensibility.md).

## Debugging recipe

When a trigger doesn't render, walk the pipeline backwards:

```bash
# Stage 4 (render) — is the component file resolving?
grep -r "component_path" src/config/lfm-triggers.yaml
ls -la <component_path-from-yaml>

# Stage 3 (normalise) — are the props validating?
pnpm lfm:check    # runs trigger map + frontmatter validation

# Stage 2 (match) — is the trigger name in the map?
pnpm lfm:list-triggers   # prints merged default + site triggers

# Stage 1 (tokenize) — does the markdown parse at all?
pnpm lfm:render path/to/file.md > /tmp/out.html
```

For OG-fetch-specific debugging (popovers blank, link previews missing image):

```bash
# Was the URL fetched?
jq '.["https://example.com/article"]' .lfm-cache/og-data.json

# What does the URL actually return to the build's user-agent?
curl -sIA "lfm/1.x (+https://lossless.group)" "https://example.com/article" | grep -iE 'content-type|og:'

# Force a re-fetch
rm -rf .lfm-cache && pnpm build
```

## Cross-skill seams

- **[open-graph-share-seo-geo](../../open-graph-share-seo-geo/)** — the OG sub-pipeline shares its metadata schema with the page-level OG meta tags. `imageType`-must-match-bytes is the same rule. The Image-Gin / Ideogram banner conventions feed both.
- **[theme-system](../../theme-system/)** — every component the pipeline produces consumes `--lfm-*` CSS custom properties. The pipeline produces semantically-styled output; mode-switching is the theme system's job.
- **[extensibility.md](extensibility.md)** (this skill) — the three customisation layers (per-instance attrs / variant registry / theme tokens) all hook into the pipeline at Stage 3 (normalise) without modifying it.
- **[syntax-and-directives.md](syntax-and-directives.md)** — every trigger's authoring syntax, the polyglot aliases, and the reserved-attribute list.

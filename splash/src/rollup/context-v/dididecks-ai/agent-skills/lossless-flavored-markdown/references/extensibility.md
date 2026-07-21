---
from: "dididecks-ai"
from_path: "context-v/agent-skills/lossless-flavored-markdown/references/extensibility.md"
---

# LFM Extensibility — The Three Layers

LFM is opinionated, but not rigid. Sites customise it through three stacking layers. Reach for the lowest layer that solves your problem.

```
┌────────────────────────────────────────────────────────────────┐
│ Layer 3 — Theme tokens (CSS custom properties)                 │  Site-wide style
├────────────────────────────────────────────────────────────────┤
│ Layer 2 — Variant registry (lfm-variants.yaml)                 │  Site-wide structure
├────────────────────────────────────────────────────────────────┤
│ Layer 1 — Per-instance attributes (class, style, data-*, etc.) │  Per-author override
├────────────────────────────────────────────────────────────────┤
│ The package — @lossless-group/lfm built-ins                     │  The defaults
└────────────────────────────────────────────────────────────────┘
```

## Layer 1 — Per-instance attributes

For one-off overrides inline in the markdown.

```markdown
:::callout{type="warning" class="hero-callout" data-priority="high" aria-live="polite"}
Body
:::

::image{src="/hero.jpg" alt="Hero" style="border-radius: 1rem;"}
```

**Allowed attributes** (always pass through to the rendered component):
- `class` — additional CSS class names
- `style` — inline style (sandboxed; `url()`, `javascript:`, `@import` stripped)
- `id` — DOM id (use sparingly; auto-slug is usually better)
- `data-*` — any data attribute
- `aria-*` — any ARIA attribute
- `role`

**Reserved attributes** (component-managed; silently ignored when set inline):

| Attribute  | Owned by                      | Why reserved                                              |
| ---------- | ----------------------------- | --------------------------------------------------------- |
| `format`   | `link-preview`, `link-rollup` | Auto-derived from URL host + content                       |
| `type`     | `link-preview`                | Auto-detected (article/video/image/audio)                  |
| `slug`     | All page-level components      | Generated from title for URL stability                    |
| `hex-id`   | citations                      | Must match the citation marker; can't be overridden inline |

If you need to override a reserved attribute, do it at Layer 2 (variant registry) instead.

## Layer 2 — Variant registry (`lfm-variants.yaml`)

Site-wide overrides without forking the package. Lives at `src/config/lfm-variants.yaml`:

```yaml
# src/config/lfm-variants.yaml

callout:
  variants:
    - name: investment-thesis
      extends: callout
      defaults:
        type: tip
        class: investment-thesis-callout
      schema:
        # Override the type enum for this variant only
        type: { enum: [tip, key-risk, data-point] }

    - name: hero-callout
      extends: callout
      defaults:
        type: info
        class: hero-callout
      schema:
        size: { enum: [normal, large, xl], default: large }

link-preview:
  variants:
    - name: source-card
      extends: link-preview
      defaults:
        format: card
        aside: right-escape
      reserved:
        # Allow authors to override `format` for this variant only
        format: false
```

Then in markdown:

```markdown
:::callout{variant="investment-thesis" type="key-risk"}
Regulatory exposure remains the largest single risk.
:::

:::link-preview{variant="source-card"}
https://example.com/article
:::
```

### Variant validation policy

In `astro.config.mjs`:

```js
remarkLfm({
  variants: {
    strictAttributes: 'error',  // 'error' | 'warn' | 'silent'
    unknownVariant: 'error',
  }
})
```

- **`error`** — fail the build. Recommended for production CI.
- **`warn`** — log to console, render anyway. Good for dev.
- **`silent`** — render anyway, no log. Avoid; hides typos like `variant="invester-card"`.

## Layer 3 — Theme tokens (CSS custom properties)

Site-wide *visual* customisation without touching markup or YAML. LFM components consume a documented set of CSS custom properties:

```css
:root {
  /* Callouts */
  --lfm-callout-info-bg:    color-mix(in srgb, var(--accent-info) 8%, transparent);
  --lfm-callout-info-fg:    var(--accent-info-strong);
  --lfm-callout-warning-bg: color-mix(in srgb, var(--accent-warning) 8%, transparent);
  --lfm-callout-warning-fg: var(--accent-warning-strong);
  /* … and so on for tip/danger/note/success */

  /* Cards (link-preview, link-rollup) */
  --lfm-card-bg:           var(--surface-1);
  --lfm-card-border:       var(--border-subtle);
  --lfm-card-radius:       var(--radius-md);

  /* Citations */
  --lfm-citation-marker-fg: var(--accent-strong);
  --lfm-citation-marker-bg: var(--accent-subtle);

  /* Aside layout (Tufte-style escapes) */
  --lfm-aside-track-width:    320px;
  --lfm-aside-track-gap:      2rem;

  /* Dialog/chat */
  --lfm-dialog-human-bg:      var(--surface-2);
  --lfm-dialog-ai-bg:         color-mix(in srgb, var(--accent) 6%, transparent);
}
```

For the full token list and the two-tier (raw / semantic) token system, see the [theme-system skill](../../theme-system/). LFM tokens are downstream of the theme-system tokens — they reference, never duplicate.

## How to register a new component

The full path: trigger map → component file → variant registry (optional).

### Step 1 — Add to `lfm-triggers.yaml`

```yaml
# src/config/lfm-triggers.yaml

triggers:
  - name: pricing-table
    syntax:
      - pattern: ':::pricing-table{$attrs}\n$children\n:::'
    component: PricingTable
    component_path: src/components/lfm/PricingTable.astro
    props:
      tiers:     { required: true,  type: number, min: 1, max: 5 }
      highlight: { required: false, type: string }
      currency:  { required: false, type: string, default: USD }
```

### Step 2 — Author the component

```astro
---
// src/components/lfm/PricingTable.astro
interface Props {
  tiers: number;
  highlight?: string;
  currency?: string;
}
const { tiers, highlight, currency = 'USD' } = Astro.props;
---

<table class="lfm-pricing-table" data-tiers={tiers}>
  <slot />
</table>

<style>
  .lfm-pricing-table {
    /* use Layer 3 tokens */
    background: var(--lfm-card-bg);
    border-radius: var(--lfm-card-radius);
  }
</style>
```

### Step 3 — Use it in markdown

```markdown
:::pricing-table{tiers="3" highlight="pro"}
- Starter: $9
- Pro: $29
- Enterprise: $99
:::
```

### Step 4 (optional) — Add variants

```yaml
pricing-table:
  variants:
    - name: launch-special
      extends: pricing-table
      defaults:
        highlight: pro
        class: launch-special-table
```

## Reserved component names

LFM ships these names; sites cannot reuse them for custom components:

`callout`, `link-preview`, `link-rollup`, `image`, `image-gallery`, `details`, `dialog`, `badge`, `card-carousel`, `image-grid`, `mermaid`, `code`.

If you have a use case that overlaps semantically (e.g. "I want my own callout system"), prefer a Layer 2 variant rather than a new top-level component.

## Cross-skill seam — design tokens

LFM extensibility Layer 3 is "consume theme tokens". The tokens themselves are defined in the [theme-system skill](../../theme-system/) — two-tier (raw / semantic), three-mode (light / dark / vibrant). LFM components are designed to be mode-agnostic: they reference semantic tokens, the mode-switching is the theme-system's job.

When you add a new token in a custom LFM component, namespace it under `--lfm-*` so it's discoverable.

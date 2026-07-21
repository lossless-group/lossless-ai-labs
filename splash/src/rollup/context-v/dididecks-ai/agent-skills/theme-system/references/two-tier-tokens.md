---
from: "dididecks-ai"
from_path: "context-v/agent-skills/theme-system/references/two-tier-tokens.md"
---

# Two-Tier Token System

> **Status:** Scaffold — content being migrated from astro-knots blueprint §2.1.

## The Architecture

Two tiers of CSS custom properties:

### Tier 1: Named Tokens (Private)

Raw values with BEM-ish `__` separator. Components do NOT read these directly.

```css
:root {
  --color__blue-azure: #2563eb;
  --color__cyan-bright: #06b6d4;
  --font__lato: 'Lato', system-ui, sans-serif;
}
```

### Tier 2: Semantic Tokens (Public)

Kebab-case tokens that reference named tokens via `var()`. This is what Tailwind utilities and components consume.

```css
.theme-default {
  --color-primary: var(--color__blue-azure);
  --font-body: var(--font__lato);
}
```

## Why Two Tiers?

**Client iteration:** When a client wants a different primary color, you:
1. Add a new named token: `--color__new-blue: #...`
2. Re-point the semantic token: `--color-primary: var(--color__new-blue);`
3. Components don't change — they still read `var(--color-primary)`

## Mode-Specific Overrides

Each mode redefines semantic tokens:

```css
[data-mode="light"] {
  --color-surface: #f8fafc;
  --color-text: #000000;
}

[data-mode="dark"] {
  --color-surface: #0f172a;
  --color-text: #ffffff;
}

[data-mode="vibrant"] {
  --color-surface: color-mix(...);
  --color-text: #ffffff;
}
```

Components read `var(--color-surface)` which resolves differently per mode.

---

**TBD:** Effect token patterns, scale generation, Tailwind v4 @theme integration.

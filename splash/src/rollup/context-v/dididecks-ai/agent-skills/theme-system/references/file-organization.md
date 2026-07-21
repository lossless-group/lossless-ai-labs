---
from: "dididecks-ai"
from_path: "context-v/agent-skills/theme-system/references/file-organization.md"
---

# File Organization: theme.css vs global.css

> **Status:** Scaffold — patterns being documented from fullstack-vc and reach-edu-hub.

## The Pattern

### `global.css` (Entry Point)

Imports, resets, and base application:

```css
@import "tailwindcss";
@import "./theme.css";

html {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-body);
}

body {
  margin: 0;
  min-height: 100vh;
}
```

### `theme.css` (Token Definitions)

All token definitions — named tokens, semantic tokens, mode blocks:

```css
/* Tier 1: Named tokens */
:root {
  --color__blue-azure: #2563eb;
  /* ... */
}

/* Tier 2: Theme layer */
.theme-default {
  --color-primary: var(--color__blue-azure);
  /* ... */
}

/* Mode: light */
[data-mode="light"] {
  --color-background: #ffffff;
  /* ... */
}

/* Mode: dark */
[data-mode="dark"] {
  --color-background: #020617;
  /* ... */
}

/* Mode: vibrant */
[data-mode="vibrant"] {
  --color-background: #000000;
  /* ... */
}
```

## When to Split Further

Sites with multiple brands can split:
- `theme-default.css`
- `theme-water.css`
- `theme-nova.css`

Then `theme.css` imports the active theme conditionally.

---

**TBD:** Multi-brand architecture, conditional imports, utilities.css patterns.

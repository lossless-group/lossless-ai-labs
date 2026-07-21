---
from: "dididecks-ai"
from_path: "context-v/agent-skills/theme-system/references/vibrant-mode-implementation.md"
---

# Vibrant Mode Implementation

> **Status:** Scaffold — content being migrated from astro-knots playbook and fullstack-vc implementation.

## The Critical Rule

Vibrant mode is **dark-based**, not light-based. It's "dark mode but louder."

**Common error:** Only setting effect tokens (`--fx-glow-opacity`) causes vibrant to inherit light mode's white background, making light and vibrant indistinguishable.

## Required Token Overrides

Vibrant mode MUST set:

```css
[data-mode="vibrant"] {
  /* Surface & structure — MUST set all of these */
  --color-background: /* dark, not white */;
  --color-surface: /* glassmorphic with color-mix() */;
  --color-text: /* light on dark */;
  --color-border: /* neon accent, not gray */;
  
  /* Effect tokens — high intensity */
  --fx-glow-opacity: /* 0.5+ */;
  --fx-glow-spread: /* 40px+ */;
  
  /* Gradients — multi-color, 4+ stops */
  --fx-headline-gradient: /* lime → cyan → blue → violet */;
}
```

## Canonical Example

See `sites/fullstack-vc/src/styles/theme.css` lines 90-130.

## Verification Checklist

- [ ] Background is dark (not white)
- [ ] Borders are neon bright (not gray)
- [ ] Headline gradient is multi-color (4+ stops)
- [ ] Glows are visibly stronger than dark mode
- [ ] Light and vibrant are obviously different at first glance

---

**TBD:** Full implementation guide, color-mix() patterns, glassmorphic surface techniques.

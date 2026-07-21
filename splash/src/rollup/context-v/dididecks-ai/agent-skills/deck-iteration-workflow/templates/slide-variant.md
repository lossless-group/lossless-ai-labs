---
title: Slide Variant Template
date_created: 2026-05-04
date_modified: 2026-05-04
authors:
  - Michael Staton
semantic_version: 0.0.0.1
tags:
  - Template
  - Slide
  - Variant
from: "dididecks-ai"
from_path: "context-v/agent-skills/deck-iteration-workflow/templates/slide-variant.md"
---
# Slide Variant Template

Template for creating slide variants using the deck iteration workflow.

## Base Slide Structure

```astro
---
// Frontmatter properties for this slide variant
slug: "slide-slug"
title: "Slide Title"
---

<!-- Slide Content -->
<div class="relative w-full h-full flex flex-col items-center justify-center p-8 bg-white">
  <h1 class="text-4xl font-bold text-gray-900 mb-6">Slide Title</h1>
  <div class="text-lg text-gray-700">
    <!-- Slide content goes here -->
  </div>
</div>
```

## Variant-Specific Considerations

When creating variants:
1. **Maintain structural consistency** with base slide
2. **Document design decisions** in comments
3. **Keep iteration focused** on the core message
4. **Test accessibility** of variant designs
5. **Note key differences** from base in frontmatter

## Example Usage

```astro
---
slug: "overview"
title: "Overview Slide"
variant: "v1"
---

<!-- Implementation details would go here -->
```

## Versioning Guidelines

Each variant gets its own semantic version:
- `0.0.0.1` - Initial draft
- `0.0.0.2` - Iteration based on feedback
- `0.1.0.0` - First major version after initial iteration
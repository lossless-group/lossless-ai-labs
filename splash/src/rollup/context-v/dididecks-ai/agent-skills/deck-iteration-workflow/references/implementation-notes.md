---
title: Implementation Notes for Deck Iteration Workflow
date_created: 2026-05-04
date_modified: 2026-05-04
authors:
  - Michael Staton
semantic_version: 0.0.0.1
tags:
  - Implementation
  - Notes
  - Workflow
from: "dididecks-ai"
from_path: "context-v/agent-skills/deck-iteration-workflow/references/implementation-notes.md"
---
# Implementation Notes for Deck Iteration Workflow

These notes elaborate on key aspects of implementing the deck iteration workflow in practice.

## Key Implementation Patterns

### Slide Structure

Each slide in the deck should follow these structural guidelines:

1. **Consistent Header:** Thin header showing brand information
2. **Main Content Area:** Full viewport height for slide content
3. **Consistent Aspect Ratio:** 16:9 standard (locked until all other requirements are satisfied)
4. **Responsive Design:** Properly scale for different screen sizes

### Inline Tailwind Approach

- **No CSS files:** All styling decisions live directly on elements
- **Readability over tidiness:** Long class lists are acceptable if they improve readability
- **Built-in tokens only:** No custom themes or palettes created in early phases
- **Explicit naming:** Use Tailwind's built-in naming conventions

### Variant Management

When creating slide variants, maintain consistency in file naming and folder structure:

- Base variants in `/pages/drafts/{slug}-{variant}.astro`
- Theme-specific variants in `/pages/theme/{theme}/{slug}-{variant}-{theme}.astro`
- Canonical files without variant suffix in main `/pages/{slug}.astro`

## Common Challenges and Solutions

### Challenge: CSS Conflicts in Early Iterations
**Solution:** Start with inline Tailwind to isolate styling decisions and avoid conflicts.

### Challenge: Repeated Patterns
**Solution:** Componentize after establishing clean patterns rather than before.

### Challenge: Design System Overhead
**Solution:** Build design systems only after achieving aesthetic harmony to provide clarity.

### Challenge: Version Control of Variants
**Solution:** Use Git to track all variants and promote the best ones to canonical status.

## Technical Notes

### Astro Componentization (Phase 3)

Note on flow: Astro section components are the *starting point* in Phase 1 (single-page scroll deck), and per-slide HTML pages are generated *from* those sections in Phase 2. The "componentization" motion below happens in Phase 3, where reusable Astro components are extracted from the per-slide pages and repeated patterns are consolidated.

When extracting reusable components from the per-slide pages:
1. Preserve the rendered output exactly — componentization should not change what the user sees
2. Maintain semantic structure of content
3. Move text content to frontmatter variables
4. Keep component structure consistent across slides

### Navigation Implementation

1. Basic navigation with next/previous buttons should be implemented with simple HTML buttons
2. Keyboard shortcuts should be implemented using JavaScript event listeners
3. Slide counter should update automatically based on current position
4. Navigation should be intuitive and unobtrusive

### PDF Integration

When extracting text from PDF decks:
1. Create frontmatter properties for all significant text elements
2. Maintain a running list of created properties for consistency
3. Use extracted data to inform variant development
4. Keep original PDF as reference for design inspiration

## Maintenance Approach

### Regular Review Points

1. **Iteration Review:** After each phase, review progress and identify areas for improvement
2. **Variant Evaluation:** Assess which variants should be promoted to canonical status
3. **Design System Maturation:** Determine when to solidify design system elements
4. **Feature Planning:** Plan next phases based on what's been learned

### Version Control Best Practices

1. **Commit Early, Commit Often:** Make frequent small commits with clear messages
2. **Branch Strategy:** Use feature branches for major developments
3. **Tagging:** Use semantic versioning for significant milestone commits
4. **Revert Strategy:** Keep history that allows easy reverting to previous stable versions

## Collaboration Patterns

### With AI Assistants

1. Use AI for generating multiple variants quickly
2. Have human review and select best variants
3. Document decisions for future reference in reminders/blueprints
4. Keep AI focused on structure and content, not just styling

### With Clients

1. Provide playable prototypes early to get feedback
2. Show variant options during client review processes
3. Clearly communicate the iterative process
4. Demonstrate progress through versioned developments

This workflow is designed to be flexible enough to adapt to various project requirements while maintaining consistency with established patterns in the Lossless Group's workflows.
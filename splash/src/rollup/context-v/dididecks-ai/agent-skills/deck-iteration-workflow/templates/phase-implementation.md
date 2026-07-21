---
title: Phase Implementation Template
date_created: 2026-05-04
date_modified: 2026-05-04
authors:
  - Michael Staton
semantic_version: 0.0.0.1
tags:
  - Template
  - Implementation
  - Phase
from: "dididecks-ai"
from_path: "context-v/agent-skills/deck-iteration-workflow/templates/phase-implementation.md"
---
# Phase Implementation Template

Template for implementing each phase of the deck iteration workflow.

## Phase 1: Single Page Scroll Decks with Astro Sections and Tailwind

Goal: Iteration and creativity within a scope that can be reasoned about by agents, yet as components at the section level that can be composed for later variant selection.

Why full narrative vs indidual slides first?  Coding agents / Generative AI just tend to do better at creative flow and beautiful design when they can reason about the whole thing at once.

- Deck content is reviewed as a full narrative, Agent benefits from reasoning about it as w whole.
- Agent is encouraged to experiment _using inline tailwind only_ around _the boundaries_ with theme and layout, not stick to tokens.
- Page dir is verified or created
- Variant numeric is incremented with conventions, if needed
- Each slide is generated as an Astro section component, with sequence and topic/role influencing the naming.
- No JavaScript is used

### Phase 2: Individual HTML with Inline Tailwind

### Objectives
- Generate a navigable menu where human clients can browse options for each section/slide.
- Import section components from Phase 1 / or reference them to create individual HTML slides.
- Reason about vertical scroll vs horizontal click/keyboard rendering animations. Create a variant where appropriate.

### Deliverables
- {N} teaser deck slides in HTML with inline Tailwind
- Single slide deck now navigable horizontally.
- Menu system for browsing options on a per slide basis.
 - Table of Contents page for easy navigation to specific slides.
 - Dynamic variant selection page per slide.

### Success Criteria
- All slides are playable and error-free
- Design has aesthetic harmony
- No major CSS conflicts or issues

## Phase 3: Astro Conversion Cleanup

### Objectives
- Extract remaining property/values from inline content to content file or frontmatter
- Componentize repeating design elements
- Begin building design system

### Deliverables
- {N} slides as Astro components
- Frontmatter properties for all text elements
- Core design system elements identified
- Initial brand-kit and design-system pages

### Success Criteria
- All slides function as Astro components
- Text content properly extracted to frontmatter
- Components maintain original design integrity

## Phase 4: Feature Enhancement

### Objectives
- Add dynamic features and interactions
- Implement advanced CSS features
- Introduce JavaScript where necessary
- Refine design system elements

### Deliverables
- Enhanced slides with dynamic features
- Refined and solidified design system
- Improved navigation and user experience

### Success Criteria
- Features work consistently across slides
- Design system is stable and well-documented
- Navigation is intuitive and smooth

## Phase 5: Full Deck Completion of Priority Theme / Chosen Slides

### Objectives
- Apply same methodology to full deck
- Leverage learnings from teaser deck
- Maintain consistency in design and approach

### Deliverables
- Full {N}-slide deck completed
- Consistent experience across all slides
- Final polished design and functionality

### Success Criteria
- Full deck is playable and functional
- All slides maintain aesthetic consistency
- Design system supports the full experience

## Phase 6: Advanced Interactivity, Animations, and Data Visualization

### Objectives
- Create variants of components, layouts, and pages rather than iterating on working files.
- Add advanced animations and transitions
- Implement data visualization components
- Enhance user interaction patterns
- Current stack preferences include Svelte, GSAP, and D3.js
- Interest in ObservableHQ libraries, and Vega-Lite

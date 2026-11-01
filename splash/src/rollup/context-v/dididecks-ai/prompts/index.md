---
from: "dididecks-ai"
from_path: "context-v/prompts/index.md"
---

# Prompts

* [DidiDecks prompt templates: how they compose](README.md) - Prompts are single-role subagent briefs with variables. A plan sequences prompts. A loop runs a plan over a queue. You only ever call one of them.
* [Prompt: Audit a source-deck extraction against the original](Audit-Source-Deck-Extraction.md) - Subagent brief for an independent auditor who checks the extractor's output slide by slide against the renders, then returns pass, or a punch list.
* [Prompt: Design a clean-room deck variant as one coherent HTML file](Design-Deck-Variant-as-Single-HTML.md) - Subagent brief for one of N parallel designers: design the whole deck from the extracted content alone, with liberal creativity, as a single HTML + CSS + Tailwind file. No peeking at the original or at sibling variants.
* [Prompt: Extract a source deck into structured, semi-structured, and unstructured content](Extract-Source-Deck.md) - Subagent brief for the extractor/transcriber role: turn a PDF, PPTX, or folder of slide images into a per-slide transcript, layout narrative, structured JSON and CSV, and extracted image assets.
* [Prompt: Refactor a single-HTML deck variant into Astro Section__ components](Refactor-HTML-Variant-into-Astro-Scroll-Sections.md) - Subagent brief for the Astro engineer role: split one approved HTML draft into Section__<Name>.astro files rendered in order from a single index.astro inside the shell's ScrollDeckPage, without changing how it looks.
* [Prompt: Verify a deck variant plays through the Scroll-UI shell](Verify-Variant-Plays-in-Scroll-Shell.md) - Subagent brief for shell QA: drive the variant's /scroll/ route in a real browser and confirm pagination, counter, mode toggle, rank pill, and responsive layout work, then return pass or a defect list.

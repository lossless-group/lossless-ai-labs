---
title: "Character Cast for Live Agent Indication"
lede: "Personify the orchestrator's agents as a cast of named, faced characters. A row of portraits sits above the run panel; the ones currently doing work glow, with a live caption underneath describing what each is up to right now."
date_authored_initial_draft: 2026-05-03
date_authored_current_draft: 2026-05-03
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-03
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Specification
tags:
  - Tauri-Framework
  - User-Experience
  - Agent-Personification
  - Svelte-5
  - Live-State
authors:
  - Michael Staton
image_prompt: "Six steam-punk portraits arranged in a horizontal row above a workshop bench. Three of them have a soft golden halo pulsing around their oval frames; the other three rest in dark brass borders. Below each lit portrait, a small brass plate is etched with a phrase like 'Revising a section' or 'Compiling final draft'. Background is a dimly lit Victorian study with diagrams and ledgers."
date_created: 2026-05-03
date_modified: 2026-05-03
from: "memopop-ai"
from_path: "context-v/specs/Character-Cast-for-Live-Agent-Indication.md"
---
# Character Cast for Live Agent Indication

> Draft — captures the working understanding from session 2026-05-03. Not yet implemented. Edit freely.

## Why

The fastest-growing agentic AI products lean hard on personification: agents have faces, names, and titles. Users don't think "the LangGraph workflow is at the validation node" — they think *Fact-Checker is reviewing my work right now.* It's the same shift, decades earlier, from "the database is running a query" to "Clippy needs your attention." Personality is the difference between watching a progress bar and watching a team work for you.

memopop-native already has six steam-punk character portraits committed to `assets/`. They're unused. This spec wires them into the JobView so that during a memo run, the user sees their crew at work in real time.

## What ships

A horizontal row of six character portraits sits above the existing 3-column grid (checklist / file tree / log). Each portrait carries a name and, when its character is active, a live caption describing the specific job at hand. Active characters glow with a slow breathing pulse on their borders. Inactive characters stay visible but quiet — dark borders that blend with the page background, no animation, no caption.

Multiple characters can glow simultaneously. That's not a bug; it's the truth of what's happening (the validation stage runs both the fact-checker and the scorecard generator, so both are working). A future iteration tightens this so exactly one character glows at any moment, but v1 honors the data we already have.

## The cast (initial mapping)

Six portraits live in `assets/`:

| Filename | Character | Role |
|---|---|---|
| `images__Charachters--Steam-Punk__Financial-Analyst.png` | Financial-Analyst | Reads the pitch deck, extracts numbers and structure |
| `images__Charachters--Steam-Punk__Researcher.png` | Researcher | External research — perplexity searches, competitive landscape |
| `images__Charachters--Steam-Punk--Writer.png` | Writer | Drafts memo sections, revises summaries |
| `images__Charachters--Steam-Punk--Editor.png` | Editor | Enrichments, table-of-contents, citation assembly, polish |
| `images__Charachters--Steam-Punk__Fact-Checker.png` | Fact-Checker | Citation validity and claim verification |
| `images__Charachters--Steam-Punk__Scorecard-Generator.png` | Scorecard-Generator | Quality scoring and the scorecard navigator |

Coverage: every stage the orchestrator emits (`deck_analysis`, `research`, `competitive`, `writing`, `enrichment`, `assembly`, `validation`, `artifacts`) has at least one character. Infrastructure stages (`start`, `complete`) deliberately have nobody — those aren't personalities, they're plumbing.

## Source of truth — the cast file

The cast lives in a single human-editable markdown file at `assets/characters.md`. The location is deliberate:

- Next to the portrait images, because the file *is* the manifest for them.
- At the repo level, not inside the SvelteKit app, because Mike will edit it by hand to tune captions.
- Markdown so it can carry prose alongside the YAML — context for future-Mike or future-Claude reading the file blind.

### Frontmatter schema

```yaml
---
title: "memopop-native Character Cast"
version: 1
characters:
  - id: editor                          # kebab-case, stable, never displayed
    name: "Editor"                       # display name shown under portrait
    image: "images__Charachters--Steam-Punk--Editor.png"
    role: "Polishes the draft into a deliverable"  # tooltip / longform; optional
    stages:                              # MilestoneStage values claimed by this character (v1)
      - enrichment
      - assembly
    default_caption: "Polishing the draft"  # shown when active but no fresher caption applies
    agents:                              # agent-level captions (v2; ignored in v1)
      - id: enrich_links
        caption: "Wiring up references"
      - id: enrich_socials
        caption: "Hunting LinkedIn profiles"
      - id: enrich_visualizations
        caption: "Drawing the diagrams"
      - id: toc
        caption: "Building the table of contents"
      - id: assemble_citations
        caption: "Compiling final draft"
      - id: cleanup_sections
        caption: "Removing dead sources"
---
```

### Field reference

| Field | Required | What it does |
|---|---|---|
| `id` | yes | Stable identifier referenced internally. Never displayed. Kebab-case. |
| `name` | yes | Display name under the portrait (≤14 chars renders cleanly at 80px portrait width). |
| `image` | yes | Filename inside `assets/`. Resolved relative to that directory at runtime. |
| `role` | no | Free-form longer description. Tooltip on hover; not shown otherwise. |
| `stages` | yes (v1) | Array of `MilestoneStage` values. Character is active whenever the latest milestone's stage is in this list. |
| `default_caption` | yes | Shown under the name when the character is active and no `agents[].caption` matches. Should be a present-tense action phrase (≤30 chars works). |
| `agents` | no (forward-compat) | Per-agent captions. In v2, when one of these agents is the active agent, its `caption` replaces `default_caption`. v1 ignores this list. |

Mike controls every caption by editing this file. No code changes needed to retitle "Wiring up references" → "Linking sources" — just edit the markdown, save, the next render picks it up.

## What the user sees

### Layout

Above the existing 3-column grid (`PhaseChecklist | ArtifactBrowser | LogStream`), a single horizontal row spans the full width. Six portrait cells distributed evenly. Approximate sizing: portrait ~72×72px, name below in a 12px label, caption below in a 11px italic label. Cell height ~140px including padding. Row collapses gracefully on narrow viewports (the same `<1100px` breakpoint that drops the log column).

The row sits between the run-status header (title / status pill / elapsed timer / Stop button) and the grid. It's persistent during the run.

### States

Each character is in exactly one state at any moment:

- **Resting** (default): Portrait visible. Border is dark, near the page background — characters are present on the team but not "popping." No caption. No animation.
- **Active**: Border lights up and breathes (CSS animation, ~1.6s ease-in-out cycle, opacity from 1.0 to 0.55 and back, plus a subtle box-shadow halo). Caption appears under the name.
- **Done** (post-stage, future polish — out of scope for v1): Border returns to resting tone. Optional small checkmark in a corner. No glow. v1 just returns to resting once the stage advances; we'll revisit if it's confusing in practice.

There is no "failed" state in v1. If the run errors, every character returns to resting; the existing failure banner conveys the status.

### Caption resolution (v1)

For each character, when active, the caption is the most recent milestone label whose `stage` is in this character's `stages` list. If no such milestone has fired yet (active by virtue of being a "future" stage somehow — shouldn't happen in v1 but defensible), fall back to `default_caption`.

The milestone label is what the existing `MilestoneExtractor` already produces (`"Drafting: Counter Cyclicality"`, `"Adding contextual links"`, `"Fact-checking claims"`, etc.). It's already structured and readable; v1 surfaces it directly.

### Caption resolution (v2)

Server-side, the `MilestoneExtractor` patterns gain an optional `agent: str` field. Patterns that already correspond to a specific agent get tagged. Milestones flow through the same bus with `{stage, label, agent}`.

Client-side caption resolution becomes:
1. If a milestone's `agent` matches one of this character's `agents[].id`, use that agent's `caption`.
2. Else if a milestone's `stage` is in this character's `stages`, use the milestone's `label`.
3. Else `default_caption`.

This is the slot where Mike's hand-tuned phrasing takes over. The frontmatter already carries `agents:` from day one, so v2 is a server-only change that lights up captions Mike has already authored.

## Active-state derivation (client-side)

The flow store gains a derived view:

```ts
// activeCharacters: Set<characterId>
//   A character is active if there is at least one milestone in flow.stage.milestones
//   whose stage ∈ character.stages, AND no later milestone has advanced past the
//   character's claimed stages.
//
// captionFor(characterId): string
//   Most recent milestone whose stage ∈ character.stages → its label.
//   Falls back to character.default_caption when active but no matching milestone yet.
```

"Advanced past" is judged by the same `maxPhaseIndex` notion `PhaseChecklist` already uses. A character is active when:
- One of its stages is the current latest reached, AND
- No success-level milestone for ALL of its stages has fired (i.e., the character isn't fully done with its territory).

A character that owns multiple stages (Editor: enrichment+assembly) stays active across both. It only goes back to resting once a milestone for a *later* character's stage fires.

For the v1 multi-character glow (Fact-Checker + Scorecard-Generator both lit during validation): both characters claim `validation` in their `stages` list, so both are active throughout the validation stage. Their captions diverge as the underlying milestones advance ("Validating research citations" → Fact-Checker; "Running scorecard for X" → Scorecard-Generator) once we have v2's agent-aware tagging.

## Implementation outline

### New files

- `assets/characters.md` — the cast manifest (frontmatter + prose).
- `apps/memopop-native/src/lib/components/CharacterRow.svelte` — the row of portraits, sourced from the manifest.
- `apps/memopop-native/src/lib/characters.ts` — parses the manifest at build/runtime and exposes a typed `Character[]`. Caption-resolution helpers live here.

### Manifest delivery

Two options for getting the markdown into the running app:

1. **Build-time**: import as a string via Vite's `?raw` suffix; parse with `gray-matter` at module load. Manifest is baked into the bundle. Editing requires a dev-server reload. ✅ Simpler, faster, fine for v1.
2. **Runtime**: add a Tauri command that reads `assets/characters.md` from the repo root at app start. Edits hot-reload without rebuilding. Worth it once Mike is iterating frequently on captions.

Ship v1 with option 1. The manifest is small and changes infrequently in early use; the simplicity wins.

### Image delivery

Tauri's webview can't `<img src="file://...">` outside the bundled assets. Options:

1. **Bundle into the app**: copy `assets/*.png` into `apps/memopop-native/static/characters/` at build time. Reference via `/characters/{filename}` from the webview. Build step is a copy script.
2. **Tauri asset protocol**: register the `assets/` directory as an allowed asset scope; reference via `convertFileSrc(absolute_path)`. More flexible (works for arbitrary user-supplied portraits later) but more setup.

Ship v1 with option 1. Same logic as the manifest: small, changes infrequently, simplicity wins.

### Existing flow store changes

`flow.svelte.ts` doesn't strictly need changes. `CharacterRow.svelte` reads `flow.stage.milestones` directly, derives active set + captions client-side. If derivation gets expensive on long runs, memoize.

### v2 server-side hook (deferred)

When ready to upgrade to agent-precise glow:

1. Add `agent: Optional[str]` to the `_Pattern` dataclass in `src/server/milestones.py`.
2. Tag the patterns where the active agent is unambiguous from the log line. Some patterns can't (a log line that just says `✓ Citations updated` doesn't tell you which agent printed it) — leave those un-tagged and let v1 fallback handle them.
3. The `MilestoneExtractor.process()` call adds the `agent` field to the milestone dict when present.
4. Client-side caption resolution prefers `agent`-matched captions; falls back to stage-matched labels.

No frontmatter rewrite. No new event types. Pure additive.

## Open questions

1. **Portrait frame**: is the dark-resting border circular (like a portrait coin) or rectangular (like a Polaroid)? The source PNGs are roughly square; either works. Defer to actual implementation — try circular first, it's cleaner with the steam-punk aesthetic.
2. **Glow color**: stage-based (research = blue, writing = purple, validation = amber)? Or one universal "active" color? My instinct: universal, because the stage info is already conveyed by which character is glowing. Defer.
3. **Caption truncation**: at portrait width ~80px, captions over ~30 chars wrap or ellipsize. Mike's hand-tuned `agents[].caption` should be ≤30 chars; the v1 milestone label fallback may exceed (e.g., `"Drafting: CAGR (Compound Annual Revenue Growth)"`). Truncate with ellipsis, full label on hover/tooltip? Or rely on a `text-overflow: ellipsis` and trust the user reads the milestones panel for detail. Defer to implementation.
4. **What happens during resume runs**: the `submit_resume` worker emits the same milestone events as a fresh run, so character activation should "just work" — but the user sees Researcher light up briefly even though the resume actually skipped that agent. Is that misleading? Probably acceptable; the run banner already labels it as a resume. Watch for confusion.

## What's deliberately out of scope

- Done-state visualization (small checkmark, "I'm tired" pose, etc.). v1 just returns to resting.
- User-editable `default_caption` overrides at runtime (e.g., a settings panel). Edit the markdown, restart.
- Multiple casts (different character sets per firm or memo type). Single cast, single file, all firms share it. Revisit when there's a real reason to differentiate.
- Animations beyond the breathing border. No "nodding," no "thinking dots," no entry/exit transitions. The breathing border is the entire vocabulary.
- Failure-specific characters or captions. Run-failure is conveyed by the existing red banner; characters just stop glowing.

## Acceptance check (when v1 is built)

A person who has never seen MemoPop before should be able to:

1. Start a memo run.
2. Watch the row for ~10 seconds.
3. Point at the glowing portrait and say *"that one is doing the research right now"* — without ever reading the milestones list.

If they can do that, v1 is good.

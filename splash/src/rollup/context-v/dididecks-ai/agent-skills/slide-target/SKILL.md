---
name: slide-target
description: Load the full working context for ONE DidiDecks slide (deck/variant/slot) so an agent can iterate on it slide-by-slide without re-explaining where things live. The first of the `slide-*` skill family (target → improve → rank → decompose). Use whenever the user wants to work on a specific slide of a DidiDecks/Astro deck — "let's work on slide 2", "fix this card", "/slide-target rural-income v1 02", "go slide by slide", "target the funder-pipeline slide" — or when iterating on a client-site deck under dididecks-ai (reach-edu-hub, chroma-decks, etc.). Assembles the section file, the slides.ts slot, the narrative slot, the rank/audit status, the live URLs, and the design-system tokens for exactly that slide, then scopes all work to it. Composes with deck-iteration-workflow and theme-system.
from: "dididecks-ai"
from_path: "context-v/agent-skills/slide-target/SKILL.md"
---
# slide-target

Load everything needed to work on **one slide** of a DidiDecks deck, then keep
the work scoped to that slide. This is the agent-side analogue of augment-it's
"context broker → ActiveView" pattern: instead of re-describing which slide and
where its files live every time, you name the slide once and the skill assembles
the **context slab** for it.

First of the `slide-*` family. Later siblings (not yet built): `slide-improve`
(apply a design pass), `slide-rank` (set the audit status), `slide-decompose`
(scaffold the Play-UI counterpart). Designed to be extractable into a publishable
"DidiDecks slide skills" library.

## When to use

- The user wants to iterate on a specific slide: *"let's do slide 2"*, *"fix the
  four cards"*, *"work on the funder-pipeline slide"*, *"/slide-target rural-income v1 02"*.
- Any slide-by-slide deck iteration under `dididecks-ai/client-sites/*`.

## Invocation forms

- `/slide-target <deck> <variant> <slot>` — fully explicit, e.g.
  `/slide-target rural-income v1 02`.
- `/slide-target <slot>` — infer `<deck>`/`<variant>` from the most recently
  discussed deck in the conversation (confirm if ambiguous).
- `/slide-target` (no args) — **Tier-1 bridge**: if
  `<client-root>/.dididecks/active-slide.json` exists (written by the deck's dev
  shell as the user scrolls), read `{deck, variant, slot}` from it. If it doesn't
  exist, ask for the slide.

Slot is the zero-padded slot id (`01`, `02`, `09`, `10`…), matching `data-slot`.

## Resolution algorithm — assemble the context slab

Run these against the **client-site root** (the nearest ancestor of the cwd that
has `src/data/decks.ts`; if the user is in the monorepo root, ask which client).

1. **Section component (the thing you edit).** Grep for the slide's section:
   ```
   grep -rl 'data-slot="<NN>"' <root>/src | xargs grep -l 'data-variant="<variant>"'
   ```
   This finds the file whether the deck uses standalone section components
   (e.g. reach: `src/layouts/sections/<deck>/T<NN>-*.astro`) or inline
   `<section>`s in the scroll page (e.g. chroma's `src/pages/scroll/.../index.astro`).
   Also note the Play-UI counterpart if it exists:
   `src/components/slides/<variant>/<slot>-<slug>.astro`.
2. **Slot registry entry.** In `src/data/slides.ts`, `SLOTS["<variant>"]` → the
   entry with `slot === "<NN>"` (its `title`, `slug`).
3. **Deck registry entry.** In `src/data/decks.ts`, the deck `<deck>` and the
   variant `<variant>` (title, label, status, lede).
4. **Narrative slot (source of truth for content).** If a narrative exists, find
   the matching slide in it:
   - strategies: `context-v/narratives/strategies/<deck>/README.md`
   - otherwise look under `context-v/narratives/` for the deck's outline.
   Read the slot's bullet/section so edits stay faithful to the narrative.
5. **Rank / audit status.** In `data/audits/slides.json`, the key
   `"<deck>/<variant>/<NN>"` → `{scroll, play}` status (urgent-redo /
   could-be-better / passable / perfect / pending).
6. **Live URLs.** Scroll: `/scroll/<deck>/<variant>` (jump with `#s-<N>` where N
   is the 1-based section index). Play (if the per-slide file exists):
   `/play/<deck>/<variant>/<slot>`. TOC: `/toc/<deck>/<variant>`.
7. **Design system (so edits stay on-brand).** `src/styles/deck-primitives.css`
   (the token-driven section vocabulary) and `src/styles/theme.css` (the Tier-2
   semantic + `--fx-*` tokens). Edits should compose these, not hardcode colors.

Read items 1, 4, and 7 in full; surface 2/3/5/6 as a compact header so the user
sees what's loaded.

## Then: work scoped to the slide

- **Stay on this slide.** Only touch the section file from step 1 (and, for a
  shared fix, `deck-primitives.css`/`theme.css` — but call that out explicitly,
  since it affects every slide).
- **Honor the design system.** Use the `deck-*` primitives and the brand tokens
  (`--color-*`, `--fx-*`). No per-element `dark:`/`vibrant:` hardcoding — the
  tokens make all three modes work. If a bug is mode-specific (e.g. dark-mode
  contrast), reproduce/verify in that mode.
- **Stay faithful to the narrative** (step 4). Flag unverified figures with the
  `deck-verify` marker rather than inventing numbers.
- **After editing**, offer to update the rank in `data/audits/slides.json` (or,
  once `slide-rank` exists, hand off to it) and tell the user the live URL to
  re-check.

## Notes

- Variant slugs are currently **globally unique per client** (the shell keys
  `SLOTS` by variant alone). If a slot lookup is ambiguous, that constraint was
  violated — see the dididecks shell limitation note.
- The Tier-1 bridge file (`.dididecks/active-slide.json`) is written by the deck
  dev shell from the SlideRankPill's IntersectionObserver. If it's not there yet,
  the explicit-args form is the path.

## See also

- `deck-iteration-workflow` — the Scroll-UI-first → variant rhythm this scopes into.
- `theme-system` / `maintain-design-md` — the token + design-system discipline.
- `dididecks-ai/client-sites/reach-edu-hub/context-v/explorations/Deck-Collections-A-Menu-Layer-Above-Single-Deck-Convergence.md` — the deck/variant/collection model.
- augment-it `context-v/specs/Chat-Context-Awareness-Architecture.md` — the context-broker pattern this borrows (ActiveView → context slab).

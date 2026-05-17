---
title: "Restore Calmstorm's nav-chrome elegance as themable shell primitives (separate structure/behavior from styling)"
lede: "@dididecks/shell v0.1's PlayChrome solved the navigation contract but discarded calmstorm-decks' deliberately elegant chrome — floating bottom-right capsule, glassy white/grey/black, fade-on-idle, two-axis nav (variant cycling + section walking), custom tooltips, tabular-num counter — and replaced it with a heavy dark bottom bar that always claims viewport real-estate. This plan lifts the calmstorm chrome forward as package-level primitives in apps/deck-shell/, with structure and behavior cleanly separated from visual styling via a CSS-custom-property theming contract. Consumers (chroma-decks today; future client sites tomorrow) inherit a sensible neutral default (calmstorm's plain white/grey/black) when client-specific tokens aren't supplied, and override with their own design system when they are. Hybrid of port-and-replace + re-skin: port the bones, ship the calmstorm look as the universal fallback, then let chroma-decks (and others) light them up with their own brand."
date_authored_initial_draft: 2026-05-14
date_authored_current_draft: 2026-05-14
date_authored_final_draft:
date_first_published: 2026-05-14
date_last_updated: 2026-05-16
at_semantic_version: 0.0.1.0
status: Partially-Shipped
augmented_with: Claude Code (Opus 4.7, 1M context)
category: Plan
tags:
  - Dididecks-Shell
  - Deck-Chrome
  - DeckNav
  - DeckHeader
  - PlayChrome-Replacement
  - Calmstorm-Parity
  - Themable-Primitives
  - CSS-Custom-Properties
  - Two-Axis-Navigation
  - Glass-UI
  - Idle-Fade
  - Custom-Tooltips
  - Mode-Toggle
  - PageAsDeckWrapper
  - Phase-B-Foundation
authors:
  - Michael Staton
from: "dididecks-ai"
from_path: "context-v/plans/Restore-Calmstorm-Nav-Elegance-as-Themable-Shell-Primitives.md"
---
# Restore calmstorm's nav-chrome elegance as themable shell primitives

> The shell's `PlayChrome` ships the right *contract* (← / → / Space / Home / End / F / C / T / Esc) but the wrong *aesthetic* — a heavy dark bottom bar that always claims viewport space, no idle fade, no tooltips, no variant axis, no glass. Calmstorm-decks' `DeckNav` + `DeckHeader` are the elegant reference. This plan ports the calmstorm chrome forward as **themable shell primitives** so the elegance becomes a package-level property, with structure/behavior cleanly separated from styling so each consumer can re-skin without forking the components.

## Background — the concrete gap

| Concern | Calmstorm `DeckNav` (211 LOC) | Shell `PlayChrome` v0.1 (185 LOC) |
|---|---|---|
| Form factor | Floating capsule, fixed bottom-right, z-100 | Solid bottom bar spanning the viewport |
| Idle state | `opacity-30` → `100` on hover / focus-within | Always 100% opacity |
| Theme | Glass: `white/85 backdrop-blur`, `gray-300` borders, `gray-700` text | Dark hard-coded (`#0b0d10` / `#e6e9ee`) |
| Density | 28×28 buttons, `rounded-sm` (boxy) | 36px wide, `rounded: 6px` (chunky) |
| Nav axes | **Two**: ← → cycles variants; ↑ ↓ walks sections | **One**: ← → walks slots only |
| Counter | Inline tabular-num pill `3 / 17 · v2 of 4` | Separate label in bottom bar |
| Tooltips | Custom CSS, right-anchored, 120ms ease | None (native `title` — slow + ugly) |
| Boundary handling | `data-at-first` / `data-at-last` hide irrelevant arrows | Buttons grey-disable |
| Mode toggle | `SlideshowMode__Scroll-or-Play.astro` (65 LOC) exists | Absent from shell |
| Scroll-side coordination | `PageAsDeckWrapper` broadcasts `deck:section-changed`; nav listens | No scroll-side primitive at all |
| Cross-variant section anchor | Nav appends `#s-N` to variant URLs so position survives the hop | N/A (no variant axis) |

The shell delivered the *functionality*. The elegance was discarded. **This plan brings the elegance back, and makes it inheritable.**

## Design principle for this pass — structure first, styling second

Borrowed straight from the user's framing: *"the functionality and the style … should be separated as much as possible from the actual functionality, so that it can inherit system/semantic style tokens specific to that client deck."*

That means every primitive in this plan obeys the same discipline:

1. **Structure** — DOM shape, semantics, ARIA, data-attrs for state — lives in the component.
2. **Behavior** — keyboard handlers, event bus (`deck:section-changed`), boundary detection — lives in the component.
3. **Styling** — color, border, radius, blur, font — comes from **CSS custom properties** that the component reads but never sets directly on its own root.

Consumer sites override the custom properties at any wrapping element. If they override nothing, they get the calmstorm-flavored neutral default (plain white/grey/black) which is fine for any deck.

### Theming contract — the custom properties the chrome reads

A defined namespace, prefixed `--ddd-chrome-*`, declared with sensible neutral fallbacks in the shell's stylesheet, overridable at any wrapping element:

```css
:root {
  /* Surface */
  --ddd-chrome-bg:           rgb(255 255 255 / 0.85);
  --ddd-chrome-bg-hover:     rgb(249 250 251);
  --ddd-chrome-backdrop:     blur(8px);

  /* Border + radius */
  --ddd-chrome-border:       rgb(209 213 219);
  --ddd-chrome-radius:       2px;        /* calmstorm's rounded-sm */

  /* Type */
  --ddd-chrome-fg:           rgb(55 65 81);    /* gray-700 */
  --ddd-chrome-fg-strong:    rgb(15 23 42);    /* slate-900 */
  --ddd-chrome-fg-muted:     rgb(107 114 128); /* gray-500 */
  --ddd-chrome-font:         ui-sans-serif, system-ui, sans-serif;
  --ddd-chrome-font-mono:    ui-monospace, "SFMono-Regular", Menlo, monospace;
  --ddd-chrome-size-counter: 11px;
  --ddd-chrome-size-button:  12px;

  /* Behavior */
  --ddd-chrome-idle-opacity: 0.3;
  --ddd-chrome-fade-ms:      200ms;

  /* Tooltip */
  --ddd-chrome-tooltip-bg:   rgb(15 23 42 / 0.95);
  --ddd-chrome-tooltip-fg:   white;
}
```

Chroma-decks overrides at, say, the play-route layout: orange brand on `--ddd-chrome-fg-strong`, cream on `--ddd-chrome-bg`, charcoal on `--ddd-chrome-fg`. Same DOM. Same behavior. Different skin.

If a consumer override is **partial**, the un-overridden token falls back to the neutral default — there's no all-or-nothing.

## Scope

### In scope (Phase 1 — this plan)

1. **`<DeckChrome>` package primitive** — replaces `PlayChrome.astro`. Floating bottom-right capsule, idle-fade, two-axis nav, custom tooltips, tabular-num counter. Reads CSS custom properties for everything visual; ships neutral defaults inline so it works zero-config.
2. **`<DeckHeader>` package primitive** — minimal top-bar with brand-slot + counter + mode-toggle slot. Slotted, so consumers drop in their own `<Wordmark>` rather than the shell holding chroma branding.
3. **Mode-toggle primitive** — `<ModeToggleScrollPlay>` ported from calmstorm's `SlideshowMode__Scroll-or-Play.astro`, slotted into `<DeckHeader>` or usable standalone.
4. **Keyboard contract preservation** — the existing ← / → / Space / Home / End / F / C / T / Esc handler stays, lifted into `<DeckChrome>` unchanged so v0.1 consumers don't break.
5. **Boundary-state data-attrs** — `data-at-first`, `data-at-last` driven by the component's knowledge of slot index; CSS hides the irrelevant arrow.
6. **Custom-tooltip subsystem** — same `::before` / `::after` pattern calmstorm uses, parameterized via custom properties so right-anchoring vs. left-anchoring becomes a single token flip.
7. **Tabular-num counter** with the calmstorm format `slot / total · variant of N`, also driven by props.
8. **Neutral default theme** documented as `themes/neutral.css` in the shell — calmstorm-flavored, what every consumer gets when they override nothing.
9. **Chroma-decks consumer override sheet** — `chroma-decks/src/styles/dididecks-chrome.css` overriding the namespace with chroma orange / cream / charcoal. Proof-of-concept for the theming contract.
10. **PlayChrome backwards-compat shim** — `PlayChrome.astro` becomes a thin wrapper around `<DeckChrome>` so any in-flight code that imports it keeps working. Deprecate in a follow-up.

### Out of scope (Phase 2 / 3 — sibling plans)

- **`<PageAsDeckWrapper>` for the scroll deck.** Calmstorm's load-bearing piece that makes the scroll deck feel coordinated (`deck:section-changed` broadcast, deep-link `#s-N` anchors, intersection-observer-driven section state). Needs its own plan; depends on the events `<DeckChrome>` listens for, so the event contract gets defined here and the wrapper consumes it later.
- **Variant-axis URL discipline** beyond simple linking. Calmstorm's "preserve `#s-N` across the variant cycle" trick assumes consistent section indexing across variants; needs to be re-asserted as a convention or made resilient before shipping.
- **TOC re-skin.** The shell's TOC route was built ad-hoc and probably has the same drift. Treat as a separate cosmetic pass once `<DeckChrome>` is the template.
- **Print/PDF chrome.** `print.astro` deliberately ships no nav (correct). No work to do unless we want a print-only deck header (footer date, slide number, deck title) — separate question.
- **Touch gestures.** Calmstorm's nav is keyboard + click. Touch swipe is a Phase 3 nicety, not a Phase 1 elegance gap.

## Execution

### Step 1 — Define the theming contract (the CSS namespace)

File: `apps/deck-shell/src/styles/chrome-tokens.css`

Declare every `--ddd-chrome-*` property at `:root` with the neutral / calmstorm-flavored default. This is a **catalog** — no consumer is required to override anything. The neutral default *is* the calmstorm look.

Document each token with a one-line comment for what it controls. This file is the contract.

### Step 2 — Build `<DeckChrome>` to replace `PlayChrome`

File: `apps/deck-shell/src/components/DeckChrome.astro`

Form factor: floating capsule, fixed bottom-right, `z-100`. Two row-flex groups:

1. Counter pill (left): `{slot} / {total} · {variantLabel}` if `counter` prop supplied.
2. Buttons (right): `↑ ↓` (section nav, optional via `showSectionNav` prop), `‹ ›` (variant cycling, optional via `showVariantNav` prop), TOC link, Fullscreen, Help.

Idle-fade via `:hover` / `:focus-within` flipping `opacity`. Custom tooltips via `::before` / `::after` parameterized by `--ddd-chrome-tooltip-*`. Boundary-state data-attrs (`data-at-first` / `data-at-last`) driven by props.

Slot a `<slot />` for the rendered slide. The component owns nothing in the content area — just the floating nav.

Keyboard handler script preserved verbatim from v0.1 PlayChrome (← / → / Space / Home / End / F / C / T / Esc). No behavior change.

**Props (initial draft):**

```ts
interface Props {
  // Slot context (required)
  slot: string;
  totalSlots: number;
  variantLabel: string;

  // Navigation hrefs
  prevHref: string | null;
  nextHref: string | null;
  firstHref: string;
  lastHref: string;
  tocHref: string;

  // Optional second axis — variant cycling
  prevVariantHref?: string;
  nextVariantHref?: string;
  variantCounter?: string;       // e.g., "v2 of 4"
  cycling?: boolean;             // if true, variant arrows never grey out

  // Toggles
  showSectionNav?: boolean;      // default true
  showVariantNav?: boolean;      // default false (most consumers won't need it on play)
  showHelp?: boolean;            // default false until Help is built

  // Behavior
  enableKeyboard?: boolean;      // default true
}
```

### Step 3 — Build `<DeckHeader>`

File: `apps/deck-shell/src/components/DeckHeader.astro`

Minimal top strip. Three slots:
- `brand` — consumer drops in their wordmark / logo
- `counter` — optional; in many decks the floating nav already shows it
- `mode-toggle` — usually `<ModeToggleScrollPlay>`

Styling reads the same `--ddd-chrome-*` namespace. No background by default — fully transparent and only paints where the consumer slots content.

### Step 4 — Build `<ModeToggleScrollPlay>`

File: `apps/deck-shell/src/components/ModeToggleScrollPlay.astro`

Port of calmstorm's `nav/SlideshowMode__Scroll-or-Play.astro`. Knows the current mode (scroll vs play) by parsing `Astro.url.pathname`; links to the sibling URL preserving deck + variant slugs. Two-pill segmented control, same theming namespace.

### Step 5 — Define and document the event contract

The Phase-2 `<PageAsDeckWrapper>` will broadcast section state. Define the events now so `<DeckChrome>` can listen:

```ts
window.dispatchEvent(new CustomEvent("ddd:section-changed", {
  detail: { index: number, isFirst: boolean, isLast: boolean, sectionId?: string }
}));

window.dispatchEvent(new CustomEvent("ddd:section-prev"));
window.dispatchEvent(new CustomEvent("ddd:section-next"));
```

Namespaced `ddd:` rather than calmstorm's `deck:` because dididecks may live alongside other deck systems in the same DOM. `<DeckChrome>` wires the section-nav buttons to dispatch `ddd:section-prev` / `ddd:section-next` and updates `data-at-first` / `data-at-last` from `ddd:section-changed`. No-op when the wrapper isn't mounted — Play routes don't need it, only Scroll routes do.

### Step 6 — Author the neutral default theme

File: `apps/deck-shell/src/styles/themes/neutral.css`

`@import` from `chrome-tokens.css` (the catalog), then assign calmstorm-flavored values to every token. Document it as *"the universal default — clean, neutral, light theme. Override at your route layout if you have brand tokens."*

### Step 7 — Author the chroma-decks override (proof of concept)

File: `client-sites/chroma-decks/src/styles/dididecks-chrome.css`

Override the namespace at `:root` (or scoped to a play-route layout):

```css
:root[data-deck-skin="chroma"] {
  --ddd-chrome-bg:           rgb(251 248 241 / 0.92);      /* cream */
  --ddd-chrome-fg:           #27201c;                       /* dark brown */
  --ddd-chrome-fg-strong:    #f05100;                       /* chroma orange */
  --ddd-chrome-fg-muted:     rgb(39 32 28 / 0.5);
  --ddd-chrome-border:       rgb(39 32 28 / 0.18);
  --ddd-chrome-radius:       3px;
  --ddd-chrome-tooltip-bg:   rgb(39 32 28 / 0.95);
  --ddd-chrome-tooltip-fg:   #fbf8f1;
}
```

Confirms the contract works end-to-end before any other consumer touches it.

### Step 8 — Backwards-compat shim

File: `apps/deck-shell/src/components/PlayChrome.astro`

Rewrite as a thin wrapper around `<DeckChrome>` with the same props the v0.1 surface exposed. Any code still importing `PlayChrome` keeps working. Mark deprecated in a comment; remove in v0.3.

### Step 9 — Update the shell `/play/[slot]` route

The route currently imports `PlayChrome`. Switch to `DeckChrome` directly (shim only exists for external consumers). No behavior change.

### Step 10 — Smoke test against chroma-decks enhanced-v2 play deck

Visit `/play/pitch/enhanced-v2/01/` through `/play/pitch/enhanced-v2/16/`. Confirm:

- Floating capsule appears bottom-right, fades to 30% when idle, lights up on hover
- Keyboard nav unchanged (← / → / Space / Home / End / F / C / T / Esc all work)
- Counter renders `01 / 16 · Enhanced v2`
- Tooltips appear with the 120ms ease
- Boundary state hides `←` on slot 01 and `→` on slot 16
- Chroma override skin applies when `<html data-deck-skin="chroma">` is set; neutral default applies otherwise
- TOC link still works
- `print.astro` route is untouched and still renders chrome-free

### Step 11 — Documentation

Update `apps/deck-shell/README.md`:

- New "Theming" section listing the `--ddd-chrome-*` namespace + a copy-pasteable override snippet
- "Migrating from v0.1's `PlayChrome`" — the shim exists, but encourage direct `<DeckChrome>` use
- The mode-toggle and event-contract additions

## Theming contract — full catalog (Step 1 fleshed out)

| Token | Purpose | Neutral default | Notes |
|---|---|---|---|
| `--ddd-chrome-bg` | Capsule background | `rgb(255 255 255 / 0.85)` | Uses alpha so backdrop-blur reads |
| `--ddd-chrome-bg-hover` | Button hover bg | `rgb(249 250 251)` | gray-50 |
| `--ddd-chrome-backdrop` | Backdrop filter | `blur(8px)` | Sets glass effect |
| `--ddd-chrome-border` | Capsule + button border | `rgb(209 213 219)` | gray-300 |
| `--ddd-chrome-radius` | Capsule + button radius | `2px` | calmstorm's `rounded-sm`; chroma uses `3px` |
| `--ddd-chrome-fg` | Button text color | `rgb(55 65 81)` | gray-700 |
| `--ddd-chrome-fg-strong` | Hover / counter-number text | `rgb(15 23 42)` | slate-900 |
| `--ddd-chrome-fg-muted` | Counter label, separators | `rgb(107 114 128)` | gray-500 |
| `--ddd-chrome-font` | Button + counter font | `ui-sans-serif, system-ui, sans-serif` | |
| `--ddd-chrome-font-mono` | Counter tabular-nums | `ui-monospace, ...` | |
| `--ddd-chrome-size-counter` | Counter font-size | `11px` | calmstorm value |
| `--ddd-chrome-size-button` | Button glyph size | `12px` | calmstorm value |
| `--ddd-chrome-button-h` | Button height | `28px` | calmstorm `h-7` |
| `--ddd-chrome-button-w` | Button width | `28px` | square; arrow buttons square |
| `--ddd-chrome-idle-opacity` | Floating nav idle opacity | `0.3` | calmstorm value |
| `--ddd-chrome-fade-ms` | Fade transition duration | `200ms` | calmstorm uses 200 |
| `--ddd-chrome-z` | Floating-nav z-index | `100` | calmstorm uses `z-[100]` |
| `--ddd-chrome-tooltip-bg` | Tooltip background | `rgb(15 23 42 / 0.95)` | slate-900 alpha |
| `--ddd-chrome-tooltip-fg` | Tooltip text | `white` | |
| `--ddd-chrome-tooltip-radius` | Tooltip radius | `4px` | |
| `--ddd-chrome-tooltip-pad` | Tooltip padding | `0.4rem 0.65rem` | calmstorm value |

If a consumer overrides **none** of these, they get the calmstorm look. If they override **all** of these, they get whatever brand identity they want. The component never knows the difference.

## Non-goals

- **Replacing the keyboard contract.** It works; it stays. Step 2 lifts it verbatim.
- **Building a help overlay.** `--ddd-chrome-` namespace anticipates it (`showHelp` prop, future `?` key) but Phase 1 doesn't ship it.
- **Animations between slots.** Out of scope; v0.1 doesn't have them and the elegance gap is the nav, not the transition.
- **Dark-mode auto-detection.** Consumers handle that via the `data-deck-skin` (or `:root[data-mode="dark"]`) attribute and a separate override block. The chrome doesn't try to be clever.

## Risk + mitigation

- **Risk: Step 8's backwards-compat shim drifts from `<DeckChrome>` over time.** Mitigation: shim is < 20 lines and just passes props through. Marked `@deprecated` so it shows up in autocomplete. Remove in v0.3.
- **Risk: Token namespace clashes with consumer's existing design tokens.** Mitigation: `--ddd-chrome-*` prefix is unique enough; if a real conflict surfaces, namespace bump (`--dididecks-chrome-*`) is cheap.
- **Risk: Phase-2 `<PageAsDeckWrapper>` slips, `<DeckChrome>` ships with section-nav buttons that do nothing on scroll routes.** Mitigation: section-nav `<button>`s default to `display: none` on Play routes (no event bus listener attached); section-nav only renders when consumer explicitly sets `showSectionNav={true}`. Calmstorm's pattern; preserves it.
- **Risk: Two-axis nav confuses users who only see one axis on most routes.** Mitigation: variant nav defaults `showVariantNav={false}`. Only the routes that *have* a sibling-variant context (e.g., a deck-chooser layout) opt in.

## Success criteria

- [ ] Floating bottom-right capsule appears on every `/play/*` route in chroma-decks; fades to 30% when idle.
- [ ] All v0.1 keyboard shortcuts still work unchanged.
- [ ] Counter renders `01 / 16 · Enhanced v2` in tabular-num.
- [ ] Custom tooltips appear with 120ms ease, right-anchored.
- [ ] Boundary-state hides irrelevant arrow on first / last slot.
- [ ] `data-deck-skin="chroma"` applies the chroma orange/cream skin; absence yields the neutral calmstorm look.
- [ ] `PlayChrome` shim still importable; emits a deprecation marker in the comment header.
- [ ] `apps/deck-shell/README.md` documents the theming namespace + mode-toggle slot.
- [ ] No regressions in `/play/[slot]` rendering, TOC links, or `print.astro` (which stays chrome-free).

## Phasing

### Phase 1 (this plan)

Steps 1–11 above. Lands `<DeckChrome>` + `<DeckHeader>` + `<ModeToggleScrollPlay>` + theming contract + chroma override. Deprecates `PlayChrome`. **No scroll-side coordination yet.**

### Phase 2 (sibling plan, deferred)

- Port `<PageAsDeckWrapper>` from calmstorm. Make `/scroll/pitch/enhanced-v2/` a coordinated deck rather than a scroll page. Wire it to the `ddd:section-*` event contract this plan establishes.
- Variant cycling on scroll routes (the `←` `→` axis of calmstorm `DeckNav`).
- Cross-variant deep-link discipline (`#s-N` preservation).

### Phase 3 (further out)

- Help overlay (`?` key).
- Presenter notes drawer.
- Touch gestures.
- TOC re-skin to match `<DeckChrome>` aesthetic.

## Cross-references

- [[apps/deck-shell/src/components/PlayChrome.astro]] — current v0.1 component being replaced
- [[apps/deck-shell/README.md]] — shell package surface; will gain a Theming section
- [[client-sites/calmstorm-decks/src/components/basics/DeckNav.astro]] — the structural + behavioral reference (211 LOC)
- [[client-sites/calmstorm-decks/src/components/basics/DeckHeader.astro]] — header reference (91 LOC)
- [[client-sites/calmstorm-decks/src/components/nav/SlideshowMode__Scroll-or-Play.astro]] — mode-toggle reference (65 LOC)
- [[client-sites/chroma-decks/context-v/plans/Sync-Enhanced-v2-Scroll-Aesthetic-Into-Play-Deck.md]] — shelved sibling plan; will unshelf *after* this one lands so the play-deck sync inherits the new chrome
- [[context-v/plans/Phase-A-Plus-In-Deck-Ranking-Shared-Nav-and-Play-Runtime.md]] — Phase A+ plan that produced the v0.1 `PlayChrome` being replaced
- [[context-v/plans/Stand-Up-Dididecks-Shell-and-Ship-Chroma-TOC-Ranking.md]] — original shell scaffolding plan
- [[~/.claude/skills/context-vigilance]] — the skill governing this document's frontmatter + directory placement

## Remaining work (as of 2026-05-16)

This plan is partially shipped. The themable-chrome skeleton is in place; the sibling primitives and the chroma override aren't yet.

### Shipped
- **Step 1 — theming contract.** `apps/deck-shell/src/styles/chrome-tokens.css` exists with the `--ddd-chrome-*` namespace.
- **Step 2 — `<DeckChrome>`.** `apps/deck-shell/src/components/DeckChrome.astro` (470 LOC) replaces v0.1's `PlayChrome`. Idle-fade, floating capsule, two-axis nav, custom tooltips, tabular-num counter, keyboard contract preserved verbatim. See [[../sitemap/components/DeckChrome]].
- **Step 5 — event contract.** Defined in the DeckChrome header comment; listeners + reserved dispatchers wired (`ddd:section-changed`, `ddd:section-prev/next`).
- **Step 6 — neutral default theme.** `apps/deck-shell/src/styles/themes/neutral.css` exists.
- **Step 8 — `PlayChrome` backwards-compat shim.** Now a 79-LOC `@deprecated` wrapper around `DeckChrome`.
- **Step 9 — `/play/[slot]` consumes DeckChrome** (via the shim; direct migration pending).

### Not yet shipped
- **Step 3 — `<DeckHeader>`.** Not built. Brand slot + counter + mode-toggle slot, transparent default. Sitemap stub queued at [[../sitemap/components/DeckHeader]] (not yet authored).
- **Step 4 — `<ModeToggleScrollPlay>`.** Not built. Port of calmstorm's `nav/SlideshowMode__Scroll-or-Play.astro`. Sitemap stub queued at [[../sitemap/components/ModeToggleScrollPlay]] (not yet authored).
- **Step 7 — chroma override sheet.** `client-sites/chroma-decks/src/styles/dididecks-chrome.css` does not exist. Proof-of-concept for the theming contract — without it, we haven't actually verified that overriding `--ddd-chrome-*` at `:root[data-deck-skin="chroma"]` works end-to-end. Authoring this is the single highest-value remaining item.
- **Step 10 — smoke test against chroma's enhanced-v2 play deck.** Not yet run with override applied.
- **Step 11 — `apps/deck-shell/README.md` Theming section + Migrating-from-v0.1 + event-contract docs.** Not yet authored.

### Side artifacts this plan produced
- **`<DeckOverlay--Scroll-UI>` and `<DeckOverlay--Play-UI>`** landed 2026-05-15 as composition wrappers around `DeckChrome` + `SlideRankPill`. They live in the same "themable chrome via `--ddd-chrome-*`" family as the primitives this plan calls for. See [[../sitemap/components/DeckOverlay--Scroll-UI]] and [[../sitemap/components/DeckOverlay--Play-UI]].

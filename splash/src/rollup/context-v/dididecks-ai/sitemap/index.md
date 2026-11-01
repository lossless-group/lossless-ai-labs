---
from: "dididecks-ai"
from_path: "context-v/sitemap/index.md"
---

# Sitemap

* [Sitemap — Living Map of the DidiDecks Universal-Frontend-over-Client-Decks Architecture](README.md) - One mini-spec per `@dididecks/shell` artifact — the universal layer; per-client overrides live in each client-site's own `context-v/`.

## Components

* [DeckChrome — themable floating navigation capsule for Play-UI (and eventually Scroll-UI variant cycling)](components/DeckChrome.md) - Floating bottom-right nav capsule replacing v0.1's dark PlayChrome bar; styling comes only from `--ddd-chrome-*` custom properties.
* [DeckFrame--Play-UI — Play-UI chrome wrapper around SlideCanvas, plus the keyboard contract](components/DeckFrame--Play-UI.md) - Play-UI's outer frame at `/play/[deck]/[variant]/[slot]/` — `<SlideCanvas>` plus the floating DeckChrome and document keyboard listener.
* [DeckMatrix — the rich audit-rated dual-surface matrix; the deck-level review surface, embeddable on any landing](components/DeckMatrix.md) - The embeddable variants × slots matrix: each cell pairs a Scroll-UI and Play-UI rating, with `≠` flagging where the two surfaces disagree.
* [DeckOverlay--Play-UI — the floating overlay layer for Play-mode decks](components/DeckOverlay--Play-UI.md) - Single mount point on the play-slot route composing DeckChrome and SlideRankPill; its `<section data-slot>` wrap is the play-mode adapter.
* [DeckOverlay--Scroll-UI — the floating overlay layer for Scroll-mode decks](components/DeckOverlay--Scroll-UI.md) - Layout-neutral (`display: contents`) mount for the affordances riding over a scroll deck — each a named slot consumers can rearrange.
* [DeckStatsPanel — the 4-tile quick-stats row above the matrix on landing pages (Variants · Slide Files · People · Companies)](components/DeckStatsPanel.md) - Four-tile stats row above `DeckMatrix` — Variants, Slide Files, People, Companies — counted from the same globs `/data-assets/*` uses.
* [DecomposeFirstPlaceholder — empty-slot fallback rendered when a per-slide file doesn't exist yet](components/DecomposeFirstPlaceholder.md) - Empty-slot fallback on the play route — an invitation to begin the rank → decompose → recreate loop, deliberately not an error state.
* [DididecksNav — shell-injected global header linking Scroll · TOC · Play · Changelog](components/DididecksNav.md) - Shell-injected global header auto-mounted on `/toc/*` and `/play/*`, with links derived from the consumer's own deck registry.
* [ModeToggle — three-mode color-toggle (light → dark → vibrant) with per-client localStorage namespace](components/ModeToggle.md) - Fixed top-right button cycling light → dark → vibrant, persisted under a per-client `{client}:mode` key so co-hosted decks don't collide.
* [PageAsDeckWrapper — Scroll-UI navigation primitive: scroll-snap + keyboard + section counter + reveal-on-intersect](components/PageAsDeckWrapper.md) - Wraps `<section data-slot data-variant>` children in a scroll-snap deck: keyboard contract, section counter, and `#s-N` hash nav.
* [PlayChrome — DEPRECATED thin shim around DeckChrome](components/PlayChrome.md) - Deprecated as of v0.2 — a thin shim around `<DeckChrome>` kept so external imports keep working. Removed in v0.3.
* [ScrollDeckPage — THE single shell overlay for a scroll-deck variant page; one-import wiring](components/ScrollDeckPage.md) - Collapses the three shell imports a variant page used to need — pagination, rating pill, mode toggle — into one component and mount site.
* [SlideCanvas — pure-CSS 16:9 wrapper that scales a 1920×1080 stage to fit any canvas](components/SlideCanvas.md) - Pure-CSS 16:9 stage — container queries scale a 1920×1080 design size to any canvas, so the Play-UI scaling pipeline needs no JS.
* [SlideRankPill — floating five-button classifier for the active slot (rename pending → SlideClassifierPill)](components/SlideRankPill.md) - Bottom-right floating pill exposing the five-state classifier for the active slot, found via IntersectionObserver over `section[data-slot]`.
* [SlideShell — shared per-slide chrome (padding, min-height, snap-align, optional consumer-provided mark)](components/SlideShell.md) - Outer `<section>` with shared per-slide layout plus a `<slot name="mark">` — consumers plug their own mark, the shell stays brand-agnostic.

## Lib

* [lib/deck-overview — registry + filesystem walker; loadDeckOverview(deckSlug) returns DeckOverview with variants/slots/per-slide-file flags](lib/deck-overview.md) - `loadDeckOverview(deckSlug)` reads registry paths off `globalThis.__dididecksShellOptions`, so the shell never needs the consumer's imports.

## Routes

* [/api/slide-decompose — non-destructive stub generator for the Phase 1 → Phase 2 transition](routes/api-slide-decompose.md) - Dev-only route that writes an empty per-slide stub and refuses to overwrite — 409 if the file exists. Static Vercel builds never carry it.
* [/api/slide-rank — read + write per-slide classifier state into the consumer's audits file](routes/api-slide-rank.md) - Dev-only GET/POST over `data/audits/slides.json` — `'pending'` is never persisted; posting it deletes the entry. 404s in production builds.
* [/data-assets/companies — reviewer audit of portfolio-company metadata + brand assets across every engagement layout](routes/data-assets-companies.md) - Reviewer audit over `data/**/portfolio/*.md` — companies are told from people by the *absence* of `role_class`. SSR'd behind auth.
* [/data-assets/people — reviewer audit of team / advisor / portco-ceo metadata + headshots across every engagement layout](routes/data-assets-people.md) - Reviewer audit over `data/**/{team,portfolio}/*.md` — people are told from companies by the *presence* of `role_class`. SSR'd behind auth.
* [/data-assets/slides — reviewer audit of the slide tier, one row per slot, adapted-vs-stub per variant](routes/data-assets-slides.md) - The third data-assets audit and the only one never promoted to the shell — adapted-vs-stub per variant, living only in calmstorm-decks.
* [/dev/icons — recurring design-review workbench](routes/dev-icons.md) - A kept design-review workbench — one `/dev/*` page rendering every candidate for a visual-primitive decision side by side, in real context.
* [/play/[deckSlug]/[variantSlug]/ — variant-index redirect to slot 01](routes/play-index.md) - Enumerates every (deck, variant) and 302s to slot 01 — unconditionally today, so slot-less variants like chroma's proto land on a 404.
* [/play/[deckSlug]/[variantSlug]/print/ — one-shot PDF export surface; renders the whole variant stacked for the browser print dialog](routes/play-print.md) - Stacks every slot as SlideCanvas instances with `page-break-after: always`; no `@page` override, so the browser picks paper size.
* [/play/[deckSlug]/[variantSlug]/[slot]/ — single-slot Play-UI renderer with keyboard nav](routes/play-slot.md) - Static per-slot route: dynamic-imports `slides/{variant}/{slot}-{slug}.astro` into SlideCanvas, falling back to DecomposeFirstPlaceholder.
* [/toc/[deckSlug]/ — deck-level dual-surface review matrix (one row per slot × one column per variant)](routes/toc-deck.md) - The deck-level review matrix: variants × slots with dual-surface ratings per cell, distinct from the per-variant `/toc/[deck]/[variant]/`.
* [/toc/[deckSlug]/[variantSlug]/ — bird's-eye-view audit dashboard with rank pills + scaffold buttons](routes/toc.md) - Per-variant TOC — one row per slot with five rank pills and a scaffold button POSTing to `/api/slide-decompose`. Read-write in dev only.

## Runtime

* [runtime/mode-switcher — TS factory createModeSwitcher({client, defaultMode, respectSystemPreference}); per-client localStorage namespace](runtime/mode-switcher.md) - Three-mode state machine factory, namespaced to `{client}:mode` in localStorage and installed as a `window.modeSwitcher` singleton.

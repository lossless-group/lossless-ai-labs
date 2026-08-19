---
title: "A Structural Frontend for Single-Tenant Client Sites — What Step One Actually Requires"
lede: "The shell ships review tooling, not a frontend — every new client re-clones auth, routes, styles, and a landing page."
date_authored_initial_draft: 2026-08-04
date_authored_current_draft: 2026-08-04
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-08-04
at_semantic_version: 0.0.0.1
status: Draft
category: Exploration
augmented_with: Claude Code on Claude Opus 5 (1M context)
authors:
  - Michael Staton
tags:
  - Exploration
  - Dididecks-AI
  - Dididecks-Shell
  - Structural-Frontend
  - Single-Tenant
  - Multi-Tenant
  - Auth-Surface
  - Deck-Primitives
  - Version-Drift
  - Client-Sites
  - Step-One
date_created: 2026-08-04
date_modified: 2026-08-04
publish: false
site_uuid: 28b8cfa5-4823-452f-9808-553101cff974
hex_code: yqa320
from: "dididecks-ai"
from_path: "context-v/explorations/Structural-Frontend-for-Single-Tenant-Client-Sites.md"
---
# A Structural Frontend for Single-Tenant Client Sites

## Why care?

When a client lands on their DidiDecks URL, DidiDecks should *be* the site. Not a
deck viewer bolted onto a bespoke frontend — the whole experience: a landing page,
a way to browse decks, gated access, the reading surface, the presentation runtime.
The client's brand inherits locally; everything else is the same product every other
client gets.

That is **step one**: a *structural frontend*, where each custom client-site is
effectively the only DidiDecks instance on that URL. **Step two** is the distal
goal — a single `dddecks.ai` where self-serve clients get that same experience
without a repo of their own.

This exploration answers a narrower question: **are we set up for step one?** The
short answer is no, and the reason is specific. `@dididecks/shell` is a *review-tooling*
integration. It owns how you inspect and present a deck that already exists. It does
not own the site around the deck. So every new client re-clones the site, and the
clones drift.

## The question

What would `@dididecks/shell` have to absorb before a new client-site is a
*configuration* rather than a *clone*?

Parameters of the decision:

- The scroll reading surface stays hand-authored `.astro`. That is deliberate
  (decks-as-code, DD-grade) and this exploration does not relitigate it — see
  [[Bridging-PLG-Self-Serve-with-Previous-Approach]] for that fork.
- Everything *around* the hand-authored sections is in scope.
- Solutions should be the same motion step two needs, not a detour from it.

## Why we don't already know

The shell was scoped in [[Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]]
as "only the chrome travels" — and it delivered exactly that. The framing was right
for its moment. What has changed is the count: six client-sites now, and the
per-client clone cost has become visible in a way it wasn't at two.

The evidence arrived through eventcut-ai. It was scaffolded by cloning chroma-decks,
and building it required substantial local improvisation of things that *felt* like
they should have been shell concerns. That improvisation is the data.

## Findings — what the shell owns, and what it doesn't

### What it owns

Ten injected routes, all inspection/presentation:

```
/toc/[deckSlug]                      /play/[deckSlug]/[variantSlug]
/toc/[deckSlug]/[variantSlug]        /play/[deckSlug]/[variantSlug]/[slot]
/api/slide-rank                      /play/[deckSlug]/[variantSlug]/print
/api/slide-decompose                 /dev/icons
/data-assets/companies               /data-assets/people
```

Plus components: `ScrollDeckPage`, `PageAsDeckWrapper`, `SlidePaginator`,
`ModeToggle`, `DeckOverlay--{Scroll,Play}-UI`, `SlideCanvas`, `DeckMatrix`, the
citation family, and `chrome-tokens.css`.

### What it doesn't own

| Surface | Shell provides | Per-client reality |
|---|---|---|
| Auth | nothing | ~19 files cloned per site |
| Scroll reading surface | zero routes | hand-authored per deck (reach 11, eventcut 7, chroma 6) |
| Style vocabulary | zero | `deck-primitives.css` exists only in reach |
| Landing / deck index / nav | nothing | every client hand-rolls `index.astro` |

### The feature-set claim is already false

Installed shell version, per site, as of 2026-08-04:

```
chroma-decks     0.1.0    ← three minors behind
reach-edu-hub    0.1.0    ← three minors behind
eventcut-ai      0.3.1
humain-vc-decks  0.3.1
lossless-decks   0.3.1
calmstorm-decks  (no shell dependency at all — 63 bespoke pages)
```

chroma and reach cannot have the unified citation popover, `SlidePaginator`, or the
chrome-token reference refactor — those shipped in 0.2.0/0.3.1. Six sites, three
feature sets, one non-consumer. Nothing pins or reports this; it was invisible until
queried directly.

## The five workstreams

### 1. Lift auth into the shell

**The strongest single win.** The auth surface is ~19 files reproduced per client:

```
src/lib/auth/{lossless_id,oauth-github,passcode,session,token,types}.ts
src/lib/db/{index,schema}.ts
src/middleware.ts
src/pages/access/index.astro
src/pages/access/link/[token].astro
src/pages/access/oauth/github/{start,callback}.ts
src/pages/api/access/{verify,logout,debug-cookie}.ts
drizzle/0000_*.sql + drizzle/meta/*
```

Diffing chroma-decks against eventcut-ai shows the delta is *configuration, not
logic*: `session.ts` is byte-identical; `middleware.ts` differs by 10 lines,
`verify.ts` by 20, `access/index.astro` by 8 — and those differences are the
per-client drift table from
[[Scaffold-EventCut-and-AngelHouse-Client-Sites]] (cookie name, app slug, seed orgs,
site URL). That table is the entire legitimate variance. Everything else is copy.

**Clone-drift is already producing real bugs.** eventcut's
[[Migrate-Off-AstroDB-and-Bump-Shell-to-Astro7]] renamed `ASTRO_DB_*` → `TURSO_*`,
but `scripts/invite.ts` still reads `ASTRO_DB_REMOTE_URL`, `ASTRO_DB_APP_TOKEN`, and
`ASTRO_DATABASE_FILE` (lines 97–106). The migration touched the files the plan
enumerated and missed the one it didn't. Shared code would have made that
impossible; cloned code makes it inevitable, once per client, forever.

**Shape:** shell owns middleware + routes + schema + Drizzle migrations, driven by an
`auth: {}` block on the integration options carrying exactly the drift table.
The client-site keeps its `.env` and nothing else.

**Caveat to resolve first:** calmstorm-decks and chroma-decks are still on
`@astrojs/db`; only eventcut ran the libSQL migration. The lift should target the
migrated shape and treat migrating the older sites as separate, explicitly-scoped
work — the same boundary
[[Migrate-Off-AstroDB-and-Bump-Shell-to-Astro7]] already drew.

### 2. Ship `deck-primitives.css` + `play-primitives.css` as shell-owned opt-in imports

reach-edu-hub prototyped both, and they are parallel vocabularies by design:

- `deck-primitives.css` (269 lines) — `.deck-section` `.deck-h1` `.deck-h2`
  `.deck-lede` `.deck-eyebrow` `.deck-kicker` `.deck-card` `.deck-grid` `.deck-stat`
  `.deck-chip` `.deck-rule` `.deck-accent-bar` `.deck-gradient` `.deck-glow`
  `.deck-verify`
- `play-primitives.css` (241 lines) — the same vocabulary under `.play-*`, plus
  `.play-canvas` `.play-corner--{tl,tr,bl,br}` `.play-cite` `.play-sources`

They read only Tier-2 semantic and `--fx-*` tokens, so they stay on-brand and
mode-aware without per-element variant classes. The `changelog/2026-06-29_01.md`
entry already named this "the drag-and-drop convergence target" — it just never moved.

**The cost of not shipping it:** eventcut hand-rolled `.slide`, `.eyebrow`,
`.slide-h2`, `.slide-sub`, `.vp-card`, `.funnel`, `.arch-box` and dozens more, inline,
across four variant pages. That is the bulk of ~4,250 lines of deck source.

**Opt-in, not injected.** A shell that *imposes* a content vocabulary repeats the
`SlideShell` mistake (§5). Consumers import it; it does not arrive uninvited.

### 3. Shell-owned landing, deck index, and nav — driven off `decks.ts`

Today a new client-site renders nothing useful until someone hand-writes
`index.astro`, a deck index, and navigation. The registries to drive all three
already exist and are already shell-read (`decks.ts`, `slides.ts`).

reach additionally proved the layer above: `collections.ts` + `DeckCollectionMenu`,
a curated ordered set of *peer* decks that references decks by slug without renaming
them or touching `/scroll/{deck}/{variant}/` URLs. That is the right shape for a
multi-deck client landing page, and it is the second lift candidate the
2026-06-29 changelog named.

**Success criterion:** `pnpm create` a new client-site, set the drift table, run
`pnpm dev` — and get a working, gated, branded site with an empty deck shelf,
*before* authoring a single slide.

### 4. Pin all consumers to one version and make drift visible

Without this, "essentially the same feature set" cannot be asserted no matter what
lands in workstreams 1–3. Two sites are three minors behind right now and nothing
surfaced it.

Minimum viable: a script that reads each client-site's installed
`@dididecks/shell` version and fails (or reports) on mismatch, run in the parent
repo. Better: a shell-exported version constant the TOC route displays, so drift is
visible in the product rather than only in the tree.

Open sub-question: `workspace:*` (humain, lossless) versus a pinned registry range
(chroma, reach, eventcut) are two different upgrade stories. Picking one is part of
this workstream.

### 5. Decide `SlideShell`'s fate

`SlideShell.astro` ships `<style is:global>` asserting `.ddd-slide` layout —
`min-height:100vh`, clamp padding, flex column, `max-width:1280px`. **Two client-sites
independently refused it.** In eventcut, `src/layouts/SlideShell.astro` and
`src/layouts/PageAsDeckWrapper.astro` survive as *orphaned shims* — imported by
nothing, still importing `ChromaMark` from the clone origin.

That is the clearest signal in the tree: the one shell primitive that asserts slide
*layout* rather than *chrome* was too opinionated to use, so it was quietly worked
around — twice, by different people, without either instance being reported as a
problem.

Two ways out:

- **De-opinionate** — move every asserted value behind a `--ddd-slide-*` token and
  drop `is:global`, making it a genuinely neutral wrapper.
- **Deprecate** — accept that primitives-plus-plain-`<section>` is what both reach
  and eventcut converged on independently, and let the vocabulary in §2 be the
  answer.

Deciding either way is cheap. Leaving it undecided means every future client
rediscovers the same dead end.

## The lesson underneath all five

Four of the five are the same motion: **convert a per-client clone into shell
configuration.** That is also precisely what step two needs — the multi-tenant
version is the same conversion with the tenant boundary at a URL instead of at a
repo. Work here is not a detour from `dddecks.ai`; it is the on-ramp.

The exception is workstream 5, which is a decision rather than a build.

## What this does not close — the step-two blockers

Two blockers sit beyond step one and are **not** addressed by any of the five:

1. **Decks are hand-authored `.astro`, not data.** Named in
   [[Scaffold-EventCut-and-AngelHouse-Client-Sites]]: *"the load-bearing blocker —
   DD-grade decks are hand-authored `.astro`, not store-served data — makes the
   hosted paradigm a multi-day build."* Self-serve requires slides to be
   authorable without a repo. [[Bridging-PLG-Self-Serve-with-Previous-Approach]]
   proposes the hybrid (spec rows an agent compiles to Play-UI components); that
   remains the live proposal and remains unbuilt.
2. **`SLOTS` is keyed by variant slug alone**, not `deckSlug + variantSlug`. Sibling
   decks cannot reuse a variant name; reach works around it by keeping variant slugs
   globally unique. Under multi-tenancy, two tenants both using `v1` collide. Filed
   in `changelog/2026-06-29_01.md` as the next shared-tooling task; still open.

Neither blocks step one. Both block step two.

## Tentative direction

Sequence by unblock-value, not by size:

1. **Workstream 4 first** (version pinning + drift visibility). It is the smallest
   and it is the measurement instrument for everything after — without it there is
   no way to verify that 1–3 actually reached every consumer.
2. **Workstream 5** (a decision, not a build) — it constrains the design of 2.
3. **Workstream 2** (primitives) — highest ratio of lines-saved to risk, and it is a
   lift of already-proven code rather than new design.
4. **Workstream 1** (auth) — the biggest win and the biggest change. Do it after
   the drift instrument exists, because it touches every consumer at once.
5. **Workstream 3** (landing/index/nav) — depends on 2 for its vocabulary.

Open, and deliberately not decided here:

- Does the auth lift target only libSQL/Drizzle sites, leaving `@astrojs/db` sites
  on the old path until separately migrated? (Leaning yes.)
- `workspace:*` or pinned registry ranges as the single convention? (Undecided.)
- Does calmstorm-decks ever become a shell consumer, or is it accepted as a
  permanent bespoke outlier? (Unexamined — 63 pages, zero shell dependency.)

## Outcome

(Open. Fill in when this produces a plan or is superseded.)

## Related

- [[Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module]] — where the shell's
  "only the chrome travels" scope was set
- [[Bridging-PLG-Self-Serve-with-Previous-Approach]] — the step-two authoring-unit
  fork; the hybrid proposal that unblocks self-serve
- [[Scaffold-EventCut-and-AngelHouse-Client-Sites]] — the per-client drift table
  that becomes the auth config surface
- [[Migrate-Off-AstroDB-and-Bump-Shell-to-Astro7]] — the libSQL shape the auth lift
  should target
- [[Lift-Chroma-Decks-Generic-Code-into-Shared-Shell]] — the prior lift, and where
  `SlideShell` came from
- [[Cloud-Workspace-for-Dididecks]] — the step-two spec this exploration feeds
- `changelog/2026-06-29_01.md` — names `deck-primitives.css`, deck collections, and
  the `SLOTS` keying limitation as open work

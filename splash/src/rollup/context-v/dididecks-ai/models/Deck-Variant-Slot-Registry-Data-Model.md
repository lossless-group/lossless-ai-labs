---
title: "Deck / Variant / Slot — the deck-OS registry"
lede: "The spine of dididecks. Each client carries TypeScript modules at src/data/{decks,slides}.ts that the shell's registry-loader evaluates at build time to derive what decks + variants + slots exist. The filesystem is the source of truth for slot existence — the scroll-page section annotations are scanned and reconciled against the manual map. Translating this to a DB means modeling the registry the same way it composes today: deck → variants → slots, plus derived runtime state."
date_authored_initial_draft: 2026-06-07
date_last_updated: 2026-06-07
at_semantic_version: 0.0.1.0
status: As-observed-from-filesystem
applies_to:
  - client-sites/calmstorm-decks
  - client-sites/chroma-decks
  - client-sites/humain-vc-decks
schema_authority:
  - apps/deck-shell/src/registry-loader.ts (the evaluator)
  - apps/deck-shell/src/types/index.ts (the shared types)
from: "dididecks-ai"
from_path: "context-v/models/Deck-Variant-Slot-Registry-Data-Model.md"
---
# Deck / Variant / Slot · Data Model

## What this model represents

The conceptual spine of dididecks: **deck → variant → slot**.

- A **Deck** is the conceptual artifact ("pitch", "lp-update", "town-hall"). Lives at `/scroll/{deck}/`.
- A **Variant** is a whole-deck composition of that artifact — a complete authoring of the deck in one design direction ("proto", "enhanced-v2", "tech-bio-canon", "lab-notebook"). Lives at `/scroll/{deck}/{variant}/`.
- A **Slot** is one slide's worth of content, identified by a slot number (`01`, `01b`, `05b`, `16`) — slot identity is what *coordinates the same conceptual content across variants*. Slot 05 in `proto` is "the same thing" as slot 05 in `enhanced-v2`, just rendered differently.

The deck-as-app is what this registry projects through to the shell's routes.

## Where it lives in the filesystem

Three TypeScript modules per client at `src/data/`, identical interfaces across all three clients:

| Module | Purpose | Authoring discipline |
|---|---|---|
| `src/data/decks.ts` | Hand-authored. Exports `DECKS: Deck[]` with one entry per deck and inline `variants: VariantRef[]`. | Edit when adding a deck or variant. |
| `src/data/slides.ts` | Optional. Exports `SLOTS: SlotsByVariant` — a title/slug supplement for slot scanner. Empty in humain; populated in chroma. | Optional supplement; per-section `data-slot-title` / `data-slot-slug` attrs in scroll pages win. |
| `src/data/play-availability.ts` | Generated-from-filesystem. Uses `import.meta.glob` to discover which `src/components/slides/{variant}/{slot}-{slug}.astro` files exist. Identical across clients (mechanical copy). | Don't edit. |

## The canonical TS interfaces (verbatim from the shell's types)

```ts
export type DeckStatus = "stub" | "draft" | "presentable" | "shipped";

export interface VariantRef {
  slug: string;          // URL slug — appears in /scroll/{deck}/{variant}/
  label: string;         // Human-readable label for choosers
  lede: string;          // One-line description
  status: DeckStatus;
  lastUpdated: string;   // ISO date
}

export interface Deck {
  slug: string;
  title: string;
  lede: string;
  thumb: string;         // relative to public/ — e.g. "/thumbs/pitch.svg"
  lastUpdated: string;   // ISO date — most recent variant update
  status: DeckStatus;    // rolls up from variants — "highest" status across them
  variants: VariantRef[]; // ordered; first listed is the canonical default
}

export interface SlotRef {
  slot: string;          // "01", "01b", "05b" — letter suffix supported
  title: string;
  slug: string;          // kebab-case ID used for play-UI file lookup
}

export type SlotsByVariant = Record<string, SlotRef[]>;
```

## The two sources of slot truth — and which one wins

Slot identity has two sources:

1. **The scroll-page `<section>` annotations.** Every scroll-deck variant page at `src/pages/scroll/{deck}/{variant}/index.astro` authors slot sections like:

   ```astro
   <section
     data-slot="01"
     data-variant="proto"
     data-slot-title="Cover"
     data-slot-slug="cover"
   >
     ...
   </section>
   ```

   The shell's `registry-loader` scans these at build time via `scanScrollDeckSlots()`. **The slot exists if the section exists.**

2. **The hand-authored `src/data/slides.ts` map.** Optional supplement:

   ```ts
   export const SLOTS: SlotsByVariant = {
     "enhanced-v3": [
       { slot: "01", title: "Cover — RFC-001", slug: "cover" },
       { slot: "02", title: "Abstract — the thesis", slug: "abstract" },
       // …
     ],
   };
   ```

**Reconciliation rules** (from `registry-loader.ts` → `loadSlotsRegistry()`):

- For each variant that the scanner found sections for: the scanner's slots win for identity; the manual map fills in `title` / `slug` if a `data-slot-title` or `data-slot-slug` attr was missing on the section.
- For each variant in the manual map that the scanner didn't find: preserved as-is. Used for Play-UI-only variants (no scroll page yet) and for the transition period when a scroll page exists but doesn't yet carry the `data-slot` annotations.

**The load-bearing invariant:** scroll page is the source of truth for slot *existence*; slides.ts is title/slug *supplement*.

## Play-UI availability — derived from filesystem

`src/data/play-availability.ts` uses Vite's `import.meta.glob` to enumerate `/src/components/slides/**/*.astro`. A slot is "play-UI playable" if AND ONLY IF its per-slide file exists at `src/components/slides/{variant}/{slot}-{slug}.astro`.

```ts
const SLIDE_FILES = import.meta.glob("/src/components/slides/**/*.astro");

export function playableSlotsByVariant(): Map<string, string[]>;
export function playableVariantsForDeck(deck: Deck): string[];
```

The registry NEVER asserts play-UI availability. The filesystem is the source of truth.

## Per-client variations

| Aspect | Calmstorm | Chroma | Humain |
|---|---|---|---|
| `DECKS` array length | 1 deck (`pitch`) | 1 deck (`pitch`) | 1 deck (`pitch`) |
| Variant count | (older — pre-variant-spree) | 4 (`proto`, `enhanced-v1`, `enhanced-v2`, `enhanced-v3`) | 3 (`proto`, `tech-bio-canon`, `lab-notebook`) |
| `SLOTS` in slides.ts | partial | populated (especially `enhanced-v3` with 16 slots) | empty (sections carry their own attrs) |
| Lettered slot subslots used | yes (e.g. `01b`) | yes (`01b`, `09b`) | no — sequential `01`–`29` |
| Per-slide play files | most slots authored | partial (enhanced-v2, enhanced-v3 partially ported) | none (no Play-UI work yet) |
| Audit registry populated | yes | yes (most populated) | empty (no ratings yet) |

## What's load-bearing

- **`Deck.slug`** — primary key; the `/scroll/{slug}/` URL
- **`VariantRef.slug`** — composite-key part: `(deck.slug, variant.slug)` is the variant identity
- **`SlotRef.slot`** + variant — composite-key triple: `(deck.slug, variant.slug, slot)` is slot identity
- **`SlotRef.slug`** — composite with `slot` for the play-UI filename `{slot}-{slug}.astro`
- **`data-slot` + `data-variant` attrs** on scroll-page sections — the scanner's discovery signal
- **Existence of per-slide play file** — solely determines play-UI availability

## Translation to a remote DB

### Prisma schema sketch

```prisma
model Deck {
  id          String   @id @default(cuid())
  slug        String                          // pitch | lp-update | …
  engagement  String                          // calmstorm-decks | chroma-decks | humain-vc-decks

  title       String
  lede        String?  @db.Text
  thumb_path  String?                         // relative to public/
  status      String                          // stub | draft | presentable | shipped
  last_updated DateTime

  variants    Variant[]

  @@unique([engagement, slug])
}

model Variant {
  id          String   @id @default(cuid())
  deck_id     String
  deck        Deck     @relation(fields: [deck_id], references: [id])
  slug        String                          // proto | enhanced-v1 | tech-bio-canon | …
  position    Int                             // order in chooser; "first listed is canonical default"

  label       String
  lede        String?  @db.Text
  status      String
  last_updated DateTime

  // Derived flags (from filesystem at sync time)
  has_scroll_page    Boolean @default(false)  // scroll page exists at src/pages/scroll/…
  play_slot_count    Int @default(0)          // count of per-slide files in src/components/slides/{variant}/

  slots       Slot[]

  @@unique([deck_id, slug])
}

model Slot {
  id          String   @id @default(cuid())
  variant_id  String
  variant     Variant  @relation(fields: [variant_id], references: [id])
  slot        String                          // 01 | 01b | 05b | 16 (letter-suffix supported)
  position    Int                             // sort order (parsed from slot string)

  title       String
  slug        String                          // kebab-case; for {slot}-{slug}.astro lookup

  // Derived flags
  has_scroll_section Boolean @default(false)  // discovered via data-slot/data-variant scan
  has_play_file      Boolean @default(false)  // src/components/slides/{variant}/{slot}-{slug}.astro exists

  // The audit ratings live in a separate table (see Slide-Audit-Registry)
  audits      SlideAudit[]

  @@unique([variant_id, slot])
  @@index([variant_id, slot])
}
```

### Important: this table is a *projection*, not authoritative

The TS modules in `src/data/` remain the source of truth for `Deck.slug`, `Variant.slug`, `SlotRef.title` etc. The DB rows are derived from them on sync. **Editing a Deck row in the DB directly will not change the deck** — the TS module would still ship the old value on next deploy.

This may or may not be what your collaborator wants. Two paths:

- **Read-only DB projection** (recommended for the deck-spine): all writes go to `src/data/*.ts`; sync job rebuilds rows on commit. Use the DB only for query/index/join across engagements.
- **Authoritative DB**: flip the source of truth to the DB; `src/data/*.ts` regenerates from the DB at build time. Requires a code-gen step in the build. Defer this until there's a clear UI need for editing decks/variants/slots from outside a code editor.

## How the shell consumes this

| Surface | What it reads |
|---|---|
| `/scroll/` (deck gallery) | `DECKS` array — renders one card per deck |
| `/scroll/{deck}/` (variant chooser) | `DECKS[*].variants` — renders variant cards |
| `/scroll/{deck}/{variant}/` (the scroll page itself) | hand-authored Astro file; not derived from this registry — the registry is one-way (registry → shell), not the other way |
| `/play/{deck}/{variant}/{slot}/` | reconciled `SLOTS` (scanned + manual) + per-slide-file glob |
| `/toc/{deck}/{variant}/` | reconciled `SLOTS` for the TOC rendering |
| `DeckStatsPanel` (landing) | `DECKS` + `SLOTS` + per-slide-file globs for counts |
| `DeckMatrix` (landing + `/toc/[deck]`) | `DECKS` + `SLOTS` + per-slide-file globs + audit registry |

## Open questions for the collaborator

1. **Engagement scoping:** the same Deck.slug `pitch` appears in all three clients. Should the DB use `(engagement, slug)` composite-unique (recommended), or canonical Deck rows that cross engagements? Recommendation: composite-unique per engagement. Decks are per-engagement artifacts, not canonical entities.

2. **Letter-suffix slot ordering:** slot `01b` sorts between `01` and `02`. Storing `slot` as a string requires comparator-aware indexing. Recommendation: store both `slot` (text) and `position` (int, computed at sync time using the `compareSlotNumeric` function from the registry-loader).

3. **Scroll-page section storage:** the `<section data-slot data-variant>` blocks are authoring artifacts; the DB doesn't need them per se. But it IS useful to know which slots have which `has_scroll_section: true`. Recommendation: just store the flag, not the section markup.

4. **Variant chooser order:** the array order in `decks.ts` is meaningful ("first listed is canonical default"). DB needs a `position` integer to preserve order. Recommendation: sync sets `position` from array index.

5. **Cross-variant slot identity:** slot `05` in `proto` and slot `05` in `enhanced-v2` represent the same conceptual content. Should there be a `ConceptualSlot` table that links them? Recommendation: skip for now; the slot number IS the cross-variant identifier; no separate table needed.

## See also

- [`Slide-Audit-Registry-Data-Model.md`](./Slide-Audit-Registry-Data-Model.md) — the per-slot per-surface rating layer that hangs off Slot rows
- `apps/deck-shell/src/registry-loader.ts` — the canonical evaluator
- `apps/deck-shell/src/types/index.ts` — the canonical type declarations
- `context-v/agent-skills/deck-iteration-workflow/SKILL.md` — the variant-iteration workflow that drives variant creation

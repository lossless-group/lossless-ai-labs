---
name: setup-new-dddecks-workspace
description: Scaffold a new dididecks-ai client workspace end-to-end — submodule scaffold under `client-sites/<slug>/`, DESIGN.md from the client's brand identity, theme tokens, auth-surface wiring, initial substantiation-corpus connection, and a Scroll-UI starter deck the deck-iteration-workflow can pick up from. Two source-of-branding modes — **website-parse** (crawl the client's public site for tokens, fonts, logos via `crawl-fetch-ingest`) and **source-code-copy** (lift `theme.css` / `DESIGN.md` / brand assets directly from an existing repo when the client is us, an adjacent Lossless property, or otherwise hands over their source). Use whenever a new engagement starts and a `client-sites/<slug>/` submodule does not yet exist; whenever the user says "set up a workspace for <client>", "scaffold a new client", "we have a new client", "spin up a deck site for <firm>"; whenever The Lossless Group itself or any other internal Lossless property needs a deck-site of its own (source-code-copy mode triggers automatically when the brand source is a sibling Lossless repo); and as the cloud-workspace evolves, whenever the equivalent flow needs to fire from a chat surface rather than a CLI. Composes the existing skills — does not re-implement them — for crawl-fetch-ingest, maintain-design-md, theme-system, generate-consistent-og-images, deck-iteration-workflow, and pseudomonorepos (the submodule and branch-tier discipline).
from: "dididecks-ai"
from_path: "context-v/agent-skills/setup-new-dddecks-workspace/SKILL.md"
---
# setup-new-dddecks-workspace

> **STUB — 2026-06-08.** Skeleton only. Phases are named, sibling skills it will compose are linked, but the inside of each phase is **[awaits first run]**. The trigger engagement that produces the first real run is **The Lossless Group as its own client** (we need a deck for our own firm), and the substantive content of this skill will be authored against that engagement so it generalizes from real evidence rather than speculation.

## What this skill is for

A new dididecks-ai client engagement is currently a hand-rolled sequence: clone the calmstorm-decks (or chroma-decks) submodule pattern, edit `package.json`, rewrite `DESIGN.md`, paste in theme tokens, swap brand assets, set up `astro:db` for auth, scaffold a Scroll-UI starter. The sequence is real, the discipline is documented across half a dozen other skills, but no skill ties them together into "create a workspace for `<slug>`." This is that skill.

Its trajectory:

1. **Today — a local CLI-shaped workflow.** A maintainer (Michael, mostly) walks the phases with this skill loaded as a checklist. Each phase produces files committed inside the new submodule.
2. **Soon — a chat-surface workflow.** As `dididecks-ai` evolves toward the cloud-workspace described in [[../../explorations/Bridging-PLG-Self-Serve-with-Previous-Approach]] and [[../../specs/Cloud-Workspace-for-Dididecks]], this skill becomes the contract that a self-serve user's "create a deck site" flow executes against. The user's chat ("I want a deck site for Acme Co; here's their URL") triggers the equivalent of this skill.
3. **Long-term — the agent-emits-component pattern.** Per the bridging exploration, slide content becomes spec rows in Postgres that an agent reads/writes; this skill emits the *skeleton* and a publish step does the rest.

The skill is authored as a checklist of phases that are stable across all three trajectories. The difference between trajectories is **who runs the checklist** (maintainer / chat agent / server-side job), not what's on it.

## When to use this skill

- A new engagement is starting and no `client-sites/<slug>/` submodule exists yet
- An internal Lossless property needs a deck site (The Lossless Group itself, or any sibling property under the lossless-monorepo)
- A self-serve user (eventually) signs up and asks for a deck-site scaffold
- An existing submodule needs to be rebuilt cleanly (rare — usually `git checkout` an earlier state, not re-scaffold)
- The user says "set up a workspace for <X>", "spin up a deck site for <X>", "scaffold a new client", "we have a new client"

## When NOT to use this skill

- An existing client-site needs a *new deck* — that's `deck-iteration-workflow`, not this skill
- An existing client-site needs new branding or theme work — that's `maintain-design-md` + `theme-system`
- A new piece of *substantiation corpus* needs to be ingested for an existing client — that's `crawl-fetch-ingest`
- The relocation HARD STOP from `pseudomonorepos` applies (moving an existing repo into the tree) — that is a different operation with three preconditions and is never this skill's job

## Two source-of-branding modes

The first concrete phase — importing brand identity — branches on where the source of truth lives.

### Mode A — website-parse

The default, used when the client is external and only their public web presence is available.

- Crawl the client's marketing site with `crawl-fetch-ingest`
- Extract: primary palette, fonts, logo (SVG preferred), favicon, OG image, hero imagery
- Run the heuristics: extract used colors from CSS, map type stack to the `theme-system`'s two-tier tokens, pull `og:image` for share preview
- Output: a draft `DESIGN.md` per `maintain-design-md`, draft `theme.css` per `theme-system`, an `assets/brand/` folder with logos/favicons

### Mode B — source-code-copy

Used when the client is us, an adjacent Lossless property, or any case where we have direct access to a repo with the brand already encoded.

- Identify the source repo (e.g., `lossless-monorepo/splash/` for The Lossless Group itself)
- Lift: `DESIGN.md`, `src/styles/theme.css`, brand-asset files
- Reconcile: the source repo may have additional theme dimensions we don't need (e.g., a vibrant mode); strip or preserve per the new workspace's needs
- Output: same target shape as Mode A, but the inputs are code-to-code copies, not crawl-derived guesses

**For the trigger engagement (Lossless Group as its own client):** Mode B. Source is the lossless-monorepo's existing splash + DESIGN.md.

## Phases

Each phase produces named files and a clear "done" condition. Substantive bodies are **[awaits first run]** and will be filled in against the Lossless-Group trigger.

### Phase 0 — Decide the slug and scope  [awaits first run]

- Slug convention: `<client-shortname>-decks` (e.g., `lossless-decks`, `podium-decks`)
- Decide: native workspace, cloud workspace (per [[../../specs/Cloud-Workspace-for-Dididecks]]), or both
- Decide: which branch tier (development / main / master) — matches parent per `pseudomonorepos` branch-alignment

### Phase 1 — Scaffold the submodule  [awaits first run]

- Create the repo on GitHub under `lossless-group/<slug>`
- Add as a submodule per `pseudomonorepos` discipline: `.gitmodules` entry with the matching `branch =` line
- Seed: `package.json`, `astro.config.mjs`, `tsconfig.json`, `pnpm-lock.yaml`, `.gitignore`
- Verify: workspace inclusion in `pnpm-workspace.yaml` if the engagement is workspace-linked (chroma-decks pattern) vs standalone (calmstorm-decks pattern) — record the decision in the new submodule's own `context-v/`

### Phase 2 — Import brand identity  [awaits first run]

- Pick Mode A (website-parse) or Mode B (source-code-copy) per the section above
- Produce: `DESIGN.md` (per `maintain-design-md`), `src/styles/theme.css` + `global.css` (per `theme-system`), `src/assets/brand/` with logo/favicon
- For OG / share imagery: scaffold the `imagery:` block in `DESIGN.md` (per `generate-consistent-og-images`) — actual image generation is deferred to Phase 6
- **Mode B reconciliation when the source predates the three-mode discipline:** the source `theme.css` likely uses a flat single-mode palette (no light/dark/vibrant separation, no two-tier semantic discipline). Do NOT ship the legacy file verbatim. *Translate* it into the convention; preserve the verbatim source at `references/source--<name>.legacy.css` so the lineage from the parent brand is auditable. See *Tailwind brand-token wiring* below for the layer the translation produces.

### Phase 2.5 — Wire brand tokens through to Tailwind  [awaits first run]

This is small but high-leverage. The `@theme` block (and any `@utility` declarations) is what makes the brand reachable by an LLM coding agent generating Tailwind classes. Skipped, the agent falls back to inline `style="..."` or invents one-off classes — which silently dilutes the brand across slides.

See the *Tailwind brand-token wiring* section below for the full discipline; the per-engagement work is:

- Mirror a curated subset of named brand colors into `@theme` (so utilities like `bg-jaguar`, `text-cyan-aqua` exist)
- Add `@utility` declarations for any brand-load-bearing visual that doesn't fit a single token — at minimum, the signature gradient (`bg-signature` / `text-signature` for gradient-filled text)
- Decide which compound utilities (if any) earn their place — defer until first-deck evidence shows repeated patterns; over-baking compounds locks in the wrong shapes

### Phase 3 — Wire the auth surface  [awaits first run]

- Per the parent ai-labs exploration `[[Shared-Auth-for-Applied-AI-Labs]]` and the per-engagement auth model
- Seed `db/config.ts` with `Identity`, `Session`, `MintedToken`, `Organization`, `Membership` tables
- Per the organization-as-domain convention: seed `lossless.group` (operating-team org) plus the client's domain (e.g., `lossless.group` again if the client IS Lossless — interesting edge case to surface explicitly)
- Decide: per-client-site Turso DB (engagement-anchored auth) or shared (PLG product)

### Phase 4 — Connect the substantiation corpus  [awaits first run]

- Per `[[../../models/Substantiation-Corpus-Data-Model]]`
- Decide: filesystem-anchored (`<client>/corpus/`, gitignored) or object-storage-anchored (MinIO / R2 per the bridging exploration)
- For the Lossless-Group trigger: this is itself a discovery — where does *our own* substantiation corpus live?

### Phase 5 — Seed the data layer  [awaits first run]

- Per the three-layout convention in `[[../../models/README]]` — pick single-firm-anchored / multi-investor / flat operating-company
- Seed minimal Person + Company records to verify the discovery globs render
- For the Lossless-Group trigger: flat operating-company layout (Lossless IS the firm)

### Phase 6 — Scaffold a starter Scroll-UI deck  [awaits first run]

- Hand off to `deck-iteration-workflow` Phase 1 (single-page narrative)
- This skill ends here; deck-iteration-workflow picks up

### Phase 7 — Generate OG / share imagery  [awaits first run]

- Per `generate-consistent-og-images` and `overlay-svg-text`
- Ship at least a primary OG image so the deploy unfurls before any deck content is final

### Phase 8 — Verify the deploy path  [awaits first run]

- For native / current pattern: stand up a Vercel project, wire env vars per the per-engagement `Install-Auth-Surface-from-Calmstorm-Pattern` plan
- For cloud-workspace clients (when that pattern exists): wire to the central server-side build per the bridging exploration's "publish step"

## Tailwind brand-token wiring (the three-layer convention)

Lossless theme files carry tokens through **three** layers, not two. The `theme-system` skill describes the first two (named + functional); the third is the porting that makes the brand reachable from Tailwind utility classes. All three layers live in `src/styles/theme.css`:

| Layer | Convention | Example | Read by (by convention) |
|---|---|---|---|
| **1. Named** (brand inventory) | `--color__<thing>-<descriptor>` with BEM-ish `__` separator. Raw values. Mode-invariant. Private *by default*. | `--color__purple-heart: hsl(272, 73%, 55%)` | Tier 2 + Tier 3. By components only as an escape hatch (see *Reach order* below). |
| **2. Functional** (semantic) | `--color-<role>` kebab-case. References Tier 1 via `var()`. Rebound per `<html data-mode>`. | `--color-primary: var(--color__purple-heart)` | Components (via CSS) AND Tier 3. |
| **3. System** (Tailwind exposure) | `@theme { --color-<role>: var(--color-<role>) }` block. Mirrors Tier 2 into Tailwind's namespace AND ports a *curated subset* of Tier 1 named colors so brand-explicit utilities exist. | `--color-primary: var(--color-primary)` AND `--color-purple-heart: var(--color__purple-heart)` | Components (via Tailwind utilities) AND Tailwind's utility-class generator. **This is the first reach for component code.** |

### Reach order in component code

Component code (Astro files, CSS classes, inline class= attributes) should reach for layers in this order, with the next layer used only when the previous one doesn't carry the meaning:

1. **System first.** Tailwind utility classes — `bg-primary`, `text-text-muted`, `font-display`, `bg-signature`. This is the default authoring surface, what an LLM coding agent should generate by default, and what survives a theme refresh untouched.
2. **Functional next.** CSS `var(--color-primary)` inside a custom property, a one-off `<style>` block, or a Tailwind arbitrary value like `bg-[var(--color-primary)]`. Used when the agent needs the semantic role but Tailwind doesn't have the exact utility shape (e.g., a `linear-gradient` mixing two semantic stops).
3. **Named as last resort.** `var(--color__purple-heart)` or the utility shortcut `bg-purple-heart`. Fine for creativity — sometimes a slide *needs* "Lossless purple" specifically rather than whatever primary the current mode resolves to. **But every use of a named variable is a refactor candidate.** If the same named color appears in 3+ places, it has earned a new functional role (probably a new Tier 2 token) or a new compound utility. Pull it back up the stack.

This hierarchy holds in both CSS and Tailwind. The refactor obligation is the load-bearing part: named-tier reaches drift the brand if left in place, because they bypass the mode cascade and lock in a fixed look that won't respond to a future theme swap.

### What to mirror into Tier 3

### Why three layers, not two

**The three-layer discipline is DRY at cross-project, cross-repo scale.** Inside one codebase DRY means "don't repeat yourself"; here it means "don't re-author the same slide for every client." A slide layout written for one `client-sites/<X>/` repo should drop into another with the *same component code* and pick up the destination's brand automatically — no line-by-line translation of colors, fonts, or spacing. That works only when components reach through the abstraction layers in the right order:

- **System-tier utilities** (`bg-primary`, `text-display`, `font-display`) resolve to the destination's mode-aware semantic values. No work to repurpose.
- **Functional-tier vars** (`var(--color-primary)` in arbitrary CSS values or `bg-[var(--color-primary)]`) resolve the same way. Also no work.
- **Named-tier reaches** (`bg-purple-heart`, `var(--color__cyan-aqua)`) carry a *source-specific* color into the destination, where that name may not exist or mean something different. **These are the points repurposing breaks.**

The three-layer discipline is what makes "this slide layout was perfect for Calmstorm, let's use it for Lossless" a free operation rather than a refactor. Across the dididecks tree — calmstorm-decks, chroma-decks, humain-vc-decks, reach-edu-hub, lossless-decks, future engagements — Phase 1-3 outputs of `deck-iteration-workflow` (the single-page narrative, the individual slides, the cleaned-up componentization) become shareable assets, not single-use ones. **The deck-OS spec's eventual catalog of reusable slide patterns rides on this contract; without three-layer discipline, the catalog can't exist.**

Secondary payoffs (real but not the lead motivation):

- **Per-engagement client iteration** — swap Tier 1 named values mid-engagement, components keep working (the original two-tier framing in the `theme-system` skill).
- **Three-mode runtime switching** — Tier 2 cascade per `data-mode` (also the original framing).
- **Agent-authoring affordance** — Tier 3 makes the brand reachable from utility-class generation, so an LLM coding agent doesn't drop to inline `style=""` and silently dilute the brand. This is the surface payoff; the structural payoff is the recyclability above.

### What to mirror into Tier 3

- **All Tier 2 (functional) tokens.** These are the default reach for components.
- **A curated subset of Tier 1 (named) brand colors.** Pick the ones authors will reach for *deliberately* — the signature gradient stops, the signature primary (`purple-heart`), the peak accent (`cyan-aqua`), 2-3 darks, 2-3 lights. Skip the rare ones.
- **Brand-load-bearing compounds via `@utility`.** At minimum, the signature gradient as `bg-signature` and `text-signature` (gradient-filled text). Custom utilities are Tailwind v4's `@utility` directive.

### What NOT to mirror

- Every named color from Tier 1 — too much surface area, makes the agent's autocomplete noisy, devalues the curated brand picks.
- Mode-specific values directly — Tier 2 already handles modes via the cascade; Tier 3 mirrors *references* to Tier 2, not the resolved values.
- Compound utilities before you have evidence — a `card-bench` shortcut baked in before the first deck shows whether that compound is real will lock in the wrong shape. Defer to second-deck.

### Maintenance triggers

When this layer wants attention:

- **Adding a new named brand color** → consider whether to also mirror it into `@theme` for agent affordance. If the new color is for a *one-off illustration*, no; if authors will reach for it, yes.
- **Adding a new functional token** → always mirror into `@theme`. Functional tokens are the default agent-authoring surface and must be in the namespace.
- **An LLM-generated slide reaches for `style="background: ..."` or invents a new class** → that's the smoke signal. Whatever it reached for probably belongs in `@theme` or as a new `@utility`.
- **A theme refresh changes a named color's value** → no Tier 3 change needed (the `var()` reference still resolves), but DESIGN.md needs to update per `maintain-design-md`.

### Reference implementation

`client-sites/lossless-decks/src/styles/theme.css` carries the canonical version of this pattern as of 2026-06-08. Read it end-to-end as the worked example. The `lossless.group` source — `lossless-monorepo/site/src/styles/lossless-theme.css` — is preserved verbatim at `client-sites/lossless-decks/references/source--lossless-theme.legacy.css` to show what a *pre-three-mode, pre-three-layer* brand file looks like, so the translation work is auditable.

## Output shape (canonical, target)

When this skill finishes, the new submodule looks like:

```
client-sites/<slug>/
├── DESIGN.md                              # per maintain-design-md
├── README.md
├── package.json
├── pnpm-lock.yaml
├── astro.config.mjs
├── tsconfig.json
├── .gitignore
├── context-v/
│   ├── plans/Install-Auth-Surface-from-Calmstorm-Pattern.md
│   └── (per-engagement context)
├── data/                                  # per models/README layout
│   ├── audits/slides.json                 # initially empty
│   └── (Person / Company / Firm seeds)
├── corpus/                                # gitignored, or object-storage pointer
├── db/
│   ├── config.ts                          # Identity, Session, MintedToken, Organization, Membership
│   └── seed.ts
├── src/
│   ├── assets/brand/                      # logo, favicon, OG source
│   ├── styles/
│   │   ├── theme.css                      # two-tier tokens per theme-system
│   │   └── global.css
│   ├── pages/scroll/<deck>/<variant>/index.astro
│   └── components/slides/<variant>/       # initially empty, deck-iteration-workflow fills
└── public/
    ├── favicon.svg
    ├── og-banner.jpg
    └── (other static)
```

## The trigger engagement — The Lossless Group as its own client

We need a deck for our own firm. This skill's first real run is that engagement, with these specifics:

- **Slug:** `lossless-decks` (pending confirmation — see Phase 0)
- **Branding source:** Mode B (source-code-copy). Source repo: the existing splash sites under the lossless-monorepo, the parent `DESIGN.md`, and the published brand assets at <https://lossless.group/>.
- **Layout:** flat operating-company (we are the firm; no investor container needed)
- **Substantiation corpus:** TBD — discovery item. Likely the existing context-v across the lossless-monorepo plus a curated subset of changelog and shipped artifacts.
- **Auth model:** engagement-anchored Turso DB. `Organization.id = "lossless.group"` for both the operating team and the client (same entity).
- **Deploy target:** TBD — likely a private subdomain initially.

The first run of this skill will fill in the **[awaits first run]** sections by doing the work and recording what actually happens, not what we predicted would happen.

## Sibling skills this skill composes

- [[../pseudomonorepos/SKILL]] — submodule scaffolding, `.gitmodules` discipline, branch-tier alignment
- [[../loops/maintain-design-md/SKILL]] — `DESIGN.md` authoring per Google Stitch spec + Lossless extensions
- [[../theme-system/SKILL]] — two-tier tokens, three-mode (light/dark/vibrant) contract
- [[../crawl-fetch-ingest/SKILL]] — Mode A website-parse for branding import
- [[../generate-consistent-og-images/SKILL]] — share imagery scaffold
- [[../overlay-svg-text/SKILL]] — branded SVG overlays on top of generated OG
- [[../deck-iteration-workflow/SKILL]] — picks up at Phase 6; this skill hands off to it
- [[../context-vigilance/SKILL]] — for the new submodule's own `context-v/` discipline
- [[../changelog-conventions/SKILL]] — for the new submodule's `changelog/` directory

## Specs this skill implements against

- [[../../specs/Dididecks-AI-Slide-Decks-as-Code]] — the parent OS spec
- [[../../specs/Cloud-Workspace-for-Dididecks]] — the cloud-mode equivalent flow (stub, waiting on decisions)
- [[../../explorations/Bridging-PLG-Self-Serve-with-Previous-Approach]] — the PLG-vs-DD-grade fork that determines whether this skill runs as CLI checklist (DD-grade) or chat-surface flow (PLG)
- [[../../models/README]] — the data-model layouts this skill seeds against

## Status discipline

- **2026-06-08** — Stub authored. All phases are placeholders.
- **First real run** — author the Lossless-Group engagement; fill in **[awaits first run]** sections from observation.
- **Second real run** — when the next external client lands, run this skill with Mode A (website-parse) and reconcile the differences from the Mode B first run.
- **Promote out of stub** — when this skill has been run for ≥2 distinct engagements and the sibling skills it composes have been exercised in both modes.

## See also

- `../README.md` — index of all skills in this directory (add this skill to the table)
- `../../specs/Dididecks-AI-Slide-Decks-as-Code.md` — the deck-OS spec
- `../../explorations/Bridging-PLG-Self-Serve-with-Previous-Approach.md` — the architectural fork this skill straddles
- The four reference client-sites: `client-sites/calmstorm-decks` (single-firm-anchored), `client-sites/chroma-decks` (multi-investor), `client-sites/humain-vc-decks` (flat operating-company), `client-sites/reach-edu-hub` (education-sector precedent)

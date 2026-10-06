---
title: "Bring the spike under the credential design system"
lede: "The splash already has a real three-mode design system — verdigris, copper, and security-teal on vault-black. The Phoenix app has never seen it: it is stock generator output, down to the framework logo and the orange light theme. Five increments to close the gap, starting with the two DESIGN.md files that currently describe a different product entirely."
publish: false
date_created: 2026-08-21
date_modified: 2026-08-21
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
semantic_version: 0.0.0.1
status: Draft
tags:
  - Plan
  - Id-Didi-Sh
  - Design-System
  - Theme-System
  - Modes
  - Elixir
  - Phoenix
site_uuid: 07fe3f7f-73ea-4055-b095-c5670f180e76
hex_code: 62q852
date_authored_initial_draft: 2026-08-21
date_authored_current_draft: 2026-08-21
from: "id-didi-sh"
from_path: "context-v/plans/Bring-The-Spike-Under-The-Credential-Design-System.md"
---
## Where we are

The `feature/entities-and-keys` spike works. Eight commits landed entities,
memberships, credentials-at-rest, lending cascades, the resolve path, and a
lender surface — ending with `bc006f0`, which fixed a JS bundle that had never
built and had made "every LiveView a photograph."

None of that work touched design. The spike and the landing page are two
different products visually, and the documents that are supposed to arbitrate
between them describe a third.

### Three surfaces, three design languages

| Surface | Where it actually lives | Design state |
|---|---|---|
| `site/` | **didi.sh** — `site: 'https://didi.sh'`, `base: '/'`, served by **Vercel**. The public landing page. | The real thing — see below |
| `splash/` | **lossless-group.github.io/id-didi-sh/** — `base: '/id-didi-sh/'`, GitHub Pages on push to `main` (`.github/workflows/pages.yml`). Carries `/changelog`, `/context-v`, `/search`. | Same tokens as `site/` |
| `lib/id_didi_sh_web/` | **Fly app `id-didi-sh`** (`fly.toml`, region `lax`). `/`, `/access`, `/keys` | Stock Phoenix 1.8 generator output |

The two Astro surfaces are a **deliberate split, not a duplication**: `site/` is
the marketing landing page on its own domain, `splash/` is the developer surface
on Pages. `site/astro.config.mjs` says so in a comment — *"the dev surfaces live
on the splash."* They share one design system on purpose.

### The splash design system is good, and it is already correct

`splash/src/styles/theme.css` is a full, conforming implementation of the
Lossless theme contract — it does not need to be invented, only ported:

- **Two-tier tokens.** Tier 1 named (`--color__verdigris`, `--font__mono`),
  Tier 2 semantic, rebound per mode.
- **Three modes on `data-mode`** — `dark` (default), `light`, `vibrant`.
- **Vibrant is dark-based**, as the contract requires: "UV lamp" — the
  blacklight check, where hidden features fluoresce violet while the
  verdigris security thread stays lit. It does not inherit light's paper.
- **A posture with a reason.** "Credential": the service dresses like an
  identity document. Guilloche line-work as background ornament, stamp chrome
  for statuses, mono-forward data fields, terse datasheet voice.
- **A brand spine deliberately distinct from its siblings** — verdigris +
  copper + security-teal, on a green-black vault axis rather than blue-black.
  The file names the distinction explicitly: not memopop (cyan + plum), not
  augment-it (magenta-iris), not lfm (ink-violet + sienna + moss).
- **Fonts:** Space Grotesk display, IBM Plex Sans body, IBM Plex Mono data.

### Both DESIGN.md files describe augment-it

`splash/DESIGN.md` and `site/DESIGN.md` are byte-identical verbatim copies of
**augment-it's** design contract. They open `name: Augment It — Splash` and
specify the magenta-violet-iris wordmark gradient, the ink-pad neutral axis,
and JetBrains Mono — none of which is true of didi.sh.

This is worse than missing documentation. The `maintain-design-md` discipline
holds that runtime CSS is the source of truth and `DESIGN.md` is the contract
agents read. Any agent told to "match the design system" will read these files
and confidently build a magenta augment-it surface. Fix this first; it is
cheap and it unblocks everything else.

### The Phoenix app is untouched generator output

- `assets/css/app.css` — Tailwind 4 + daisyUI with the two stock Phoenix
  themes: Phoenix-purple dark, and a **Phoenix-orange light theme marked
  `default: true`**. Zero verdigris, zero copper.
- `page_html/home.html.heex` — still the Phoenix welcome page, including the
  framework's own logo SVG and the coral `#EE7868` background blobs. This is
  what a visitor hitting the app root sees today.
- `layouts/root.html.heex` — `<.live_title default="IdDidiSh" suffix=" · Phoenix Framework">`.
  No brand fonts loaded.
- The stock theme script uses **`data-theme` with `light` / `dark` / `system`**.
  The splash uses **`data-mode` with `dark` / `light` / `vibrant`**. Two
  different attributes, two different vocabularies, and opposite defaults —
  the app defaults to light, the splash defaults to dark.

### The gap is smaller than it looks

Most of the ~20 routes in `router.ex` are JSON API and carry no styling at all.
The entire HTML surface is about 730 lines:

| File | Lines |
|---|---|
| `live/keys_live.ex` | 290 |
| `controllers/page_html/home.html.heex` | 199 |
| `components/layouts.ex` | 160 |
| `components/layouts/root.html.heex` | 44 |
| `controllers/access_html/show.html.heex` | 27 |
| `controllers/access_html/done.html.heex` | 10 |

Plus `components/core_components.ex`. That is the whole job.

## The plan

Ordered by leverage. Each increment ends in something observable.

### 1. Make the contract tell the truth

Rewrite `splash/DESIGN.md` from `splash/src/styles/theme.css`, which is
self-documenting enough to transcribe. Per `maintain-design-md`: the Stitch
frontmatter token groups, then the eight prose sections. Delete the augment-it
carryover wholesale rather than editing it down — nothing in it is salvageable.

**Observable:** `grep -i augment splash/DESIGN.md` returns nothing, and the
`colors:` block matches the Tier-1 names in `theme.css`.

### 2. Share the theme instead of copying it

`site/src/styles/theme.css` and `splash/src/styles/theme.css` are byte-identical,
and `site/`'s copy still carries a header comment reading `theme.css —
id-didi-sh/splash`. Both surfaces *should* share one design system — that part is
correct. What is wrong is that they share it by duplication, so the next edit
lands in one file and silently diverges the other.

Extract the tokens to one file both projects import (a small workspace package,
or a relative import from a shared `design/` directory), and fix the stale
header comment.

**Observable:** editing one token file changes both surfaces; no file claims to
be a copy of another.

### 3. Port the tokens into Phoenix — DONE 2026-08-21

Add `assets/css/theme.css` carrying the same two-tier tokens and the same
three `data-mode` blocks, imported from `app.css`. Then re-point the daisyUI
theme plugin variables at the semantic tokens instead of the Phoenix defaults,
so every daisyUI component inherits brand color without markup changes.

Reconcile the attribute contract: standardize on **`data-mode`** with
`dark` / `light` / `vibrant`, dark as default, matching the splash. The stock
script in `root.html.heex` gets rewritten to match — including dropping
`system` in favor of the three explicit modes, or keeping `system` only as an
initial-resolution strategy that resolves to `dark` or `light`.

Load Space Grotesk, IBM Plex Sans, and IBM Plex Mono.

**Observable:** toggling `data-mode` on `<html>` in devtools moves the app
through all three modes, and vibrant lands on vault-black rather than paper.

**How it landed.** daisyUI already owns `--color-accent`, which collides with
the splash's token of the same name. Rather than fight it, the brand maps
*onto* daisyUI's slots — so every daisyUI component inherits credential colour
with no markup changes — and the didi-only concepts (security thread, guilloche
pitch, stamp ink) are namespaced `--didi-*`. Both attributes ride `<html>` and
are kept equal: `data-theme` for daisyUI, `data-mode` for the posture CSS and
the splash contract. Three daisyUI themes replace the two generator ones;
`vibrant` was added to the `dark:` custom-variant since it is dark-based.

### 4. Replace the Phoenix welcome page — DONE 2026-08-21

`home.html.heex` still ships the framework's logo. Replace it with the
credential posture — and reuse the splash's actual copy and ornament rather
than inventing a second pitch.

Fix the `<.live_title>` suffix while in the file.

**Observable:** the app root no longer contains the string `EE7868`, and no
Phoenix logo.

**How it landed.** Not a second marketing page — didi.sh owns that. The app
root is a service datasheet: the three-artifact contract, links to `/access`
and `/keys`, and a mode switcher so the specimen can be held under each light.
199 lines down to 113. `page_controller_test.exs` now asserts the contract
renders and refutes the generator's tagline and coral blobs.

### 5. Dress the spike surfaces

`keys_live.ex`, `access_html/show`, `access_html/done`, `layouts.ex`, and
`core_components.ex` — in that order. With step 3 done, much of this is
already carried by daisyUI inheriting the tokens; what remains is the posture
layer: stamp chrome on statuses, mono data fields, guilloche where it earns
its place.

**Observable:** a browser drive through `/`, `/access`, `/keys` in all three
modes, per the browser-drive-verification pattern, before the human walk.

## Open questions

1. **Does the app share the splash's mode toggle UI, or get its own?** The
   splash is static Astro; the app is LiveView. The token layer ports cleanly;
   the switcher component does not.
2. **Does `data-mode` persist per user once someone is signed in**, or stay in
   `localStorage`? This is an identity service — it plausibly knows the user.
3. **Does the Phoenix app get a custom domain of its own** (`id.didi.sh`) with
   its own chrome, or does it stay a headless service that consumers dress?
   The answer changes how much of increments 4–5 is worth doing.

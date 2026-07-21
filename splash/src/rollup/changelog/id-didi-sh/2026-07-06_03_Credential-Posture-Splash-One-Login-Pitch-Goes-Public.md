---
date_created: 2026-07-06
date_modified: 2026-07-06
title: "Credential-posture splash — the one-login pitch goes public"
lede: "The repo gets its GitHub Pages presence: an Astro splash dressed as an identity document — guilloche engraving, a SPECIMEN ID card as the hero object, stamp chrome — pitching one login to fast-track DD-ready materials, with the three services near-copied from ai-labs/splash and a CTA pointed at id.didi.sh."
publish: true
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
files_changed:
  - splash/ (new — Astro 7 site, ~40 files)
  - .github/workflows/pages.yml
  - README.md
tags:
  - Progress-Update
  - Splash
  - GitHub-Pages
  - Astro
  - Didi-Platform
  - Credential-Posture
from: "id-didi-sh"
from_path: "changelog/2026-07-06_03_Credential-Posture-Splash-One-Login-Pitch-Goes-Public.md"
---
## Why Care?

The identity service now has a public face that says what the platform is
for: **one login to fast-track DD-ready materials**. The three services —
memos (MemoPop), decks (DidiDecks), and augment-it — are pitched with
marketing copy near-copied from the ai-labs splash, and the CTA points at
the account-creation surface (`id.didi.sh`, live with spec increment 5;
the splash says invite-only-while-in-build honestly until then).

## What's Here

- **The credential posture.** Per the maintain-splash-pages divergence
  discipline, this splash diverges in shape, not just hue: guilloche
  line-work (banknote/passport engraving) as the background ornament, a
  SPECIMEN didi.sh ID card as the hero object (real UUIDv7 from the
  walking-skeleton proof, EdDSA, scope: memos · decks · augment-it), stamp
  chrome for statuses, IBM Plex + Space Grotesk type, datasheet voice.
  Three modes: dark ("the vault", default), light ("security paper"),
  vibrant ("UV lamp").
- **The credential datasheet** — the three-artifact contract (cookie, API,
  JWKS) rendered as a ledger, with the no-passwords / invite-only /
  signup-happens-in-the-app posture stated plainly and a link to the spec
  of record.
- **The standard splash plumbing**, lifted from augment-it/splash (Astro 7,
  Pagefind 2, sitemap): changelog + context-v rendered with lenient
  schemas, search over detail pages (page_count 3, per convention), sort
  controls, mode toggle, `/id-didi-sh/` base on GitHub Pages via the
  bootstrap-on-first-run workflow.
- **An OG banner** (1200×630) in the same posture — headline, mono
  subline, the specimen card — authored as SVG and rasterized via
  qlmanage + sips (no image-gen dependency).

## What's Next

The Pages workflow deploys on this push; first-load check at
https://lossless-group.github.io/id-didi-sh/ once the action completes.
When `id.didi.sh` deploys (increment 5), the CTA goes from promise to
door.

---
title: "Scaffold eventcut-ai and angelhouse client-sites from the chroma-decks template"
date_created: 2026-08-02
date_modified: 2026-08-02
authors:
  - Michael Staton
augmented_with: Claude Opus 4.8 on Claude Code
semantic_version: 0.0.0.1
status: Implementing
lede: "Two new gated deck client-sites — eventcut-ai (eventcut.ai) and angelhouse (angelhouse.life) — stood up via the proven per-client-repo ritual, cloning chroma-decks' wired auth + shell rather than the deferred shared-host idea."
tags:
  - Client-Site
  - Scaffold
  - Auth-Surface
  - Chroma-Decks-Derivative
  - EventCut
  - AngelHouse
publish: false
site_uuid: 7299100c-8f0a-4ac8-8fdf-a76b84d9f851
hex_code: v911wg
date_authored_initial_draft: 2026-08-02
date_authored_current_draft: 2026-08-02
from: "dididecks-ai"
from_path: "context-v/plans/Scaffold-EventCut-and-AngelHouse-Client-Sites.md"
---
## Why Care?

We evaluated moving off the per-client-repo model to a single hosted multi-tenant
deck host. Verdict: the platform half (auth, shell, Turso, Vercel) is reusable, but
the load-bearing blocker — DD-grade decks are hand-authored `.astro`, not
store-served data — makes the hosted paradigm a multi-day build. **Deferred.**
Today we ship two decks the known way and keep the momentum.

Remote-host idea captured for a future day, not this one.

## Decision

- **Path:** keep the current system — one private GitHub repo per client, mounted as
  a submodule under `dididecks-ai/client-sites/`.
- **Template:** clone `chroma-decks` (most-wired: auth middleware + `@dididecks/shell`
  + Turso + Vercel all present).
- **Gating:** reuse the passcode/session gate as-is.

## Per-client drift checklist (apply to each: eventcut-ai, angelhouse)

| Item | chroma value | eventcut-ai | angelhouse |
|---|---|---|---|
| dir | `client-sites/chroma-decks` | `client-sites/eventcut-ai` | `client-sites/angelhouse` |
| GitHub | `lossless-group/chroma-decks` | `lossless-group/eventcut-ai` (private) | `lossless-group/angelhouse` (private) |
| domain (org id) | `trychroma.com` | `eventcut.ai` | `angelhouse.life` |
| `SESSION_COOKIE` | `cd_session` | `ec_session` | `ah_session` |
| `APP_SLUG` / AuthEvent default | `chroma-decks` | `eventcut-ai` | `angelhouse` |
| `dididecksShell({client})` | `chroma-decks` | `eventcut-ai` | `angelhouse` |
| `site` URL | `chroma-decks.vercel.app` | prod TBD | prod TBD |
| seed orgs | lossless.group + trychroma.com | lossless.group + eventcut.ai | lossless.group + angelhouse.life |

## Phases (per client)

1. **Copy tree** — rsync chroma-decks → new dir, EXCLUDING `.git node_modules dist
   .vercel .astro auth.db* corpus/ exports/`. (corpus/exports carry chroma's private
   material — never copy.)
2. **Reset content to stub** — wipe chroma slides (`src/components/slides/*`,
   `src/pages/scroll/*`, `src/pages/play/*`), `data/{team,investors}`, `public/{people,thumbs,brand}`,
   `context-v/*`, `changelog/*`; empty `src/data/decks.ts` + `slides.ts` registries.
   Keep: auth, shell wiring, styles/primitives, layouts, `/access`, `/api/access`.
3. **Apply drift** — the table above (cookie, app_slug, shell client, seed orgs, package.json).
4. **Init + private repo** — `git init`, `gh repo create lossless-group/<client> --private`, push `development`.
5. **Mount submodule** — add under `client-sites/` with `branch = development` per pseudomonorepos discipline.
6. **Turso DB** — create per-client remote DB; wire `ASTRO_DB_REMOTE_URL` / `ASTRO_DB_APP_TOKEN`. (needs user's turso auth)
7. **Vercel project** — one per client; set env. (needs user's vercel auth)
8. **Deck content** — build scroll deck from the user-supplied source material; Play-UI counterparts after.

## Open / needs-user

- Source decks for both clients (user has them, will drop in on start).
- Turso + Vercel steps need the user's authenticated CLIs.
- Prod domains (custom vs `*.vercel.app`) — decide at deploy time.

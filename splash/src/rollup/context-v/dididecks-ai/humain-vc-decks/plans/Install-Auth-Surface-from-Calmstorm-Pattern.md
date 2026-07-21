---
title: Install Auth Surface — port from chroma-decks / calmstorm-decks pattern
type: plan
status: not-started
created: 2026-06-06
related:
  - "[[../explorations/Humain-Brand-and-Deck-Notes.md]]"
  - "/Users/mpstaton/code/lossless-monorepo/ai-labs/dididecks-ai/client-sites/chroma-decks/src/lib/auth/"
  - "/Users/mpstaton/code/lossless-monorepo/ai-labs/dididecks-ai/client-sites/chroma-decks/db/"
  - "/Users/mpstaton/code/lossless-monorepo/ai-labs/dididecks-ai/CLAUDE.md#auth-surface-conventions"
from: "dididecks-ai/humain-vc-decks"
from_path: "context-v/plans/Install-Auth-Surface-from-Calmstorm-Pattern.md"
---
# Install Auth Surface — port from chroma-decks / calmstorm-decks pattern

The deck client-sites (calmstorm-decks, chroma-decks, future) install a shared auth pattern: middleware-gated routes, `Identity` + `Session` + `MintedToken` tables in astro:db, OAuth via `arctic`, magic-link redemption, passcode tier-3 fallback. This plan ports that pattern into humain-vc-decks.

**Status:** not started. The v0.1 scaffold ships *without* auth (output: `"static"`, no middleware, every route public). Auth installs in v0.2 once the deck has presentable content worth gating.

## What needs to land

| Area | Files to author | Source to port from |
|---|---|---|
| **DB schema** | `db/config.ts`, `db/seed.ts` | `client-sites/chroma-decks/db/` |
| **DB deps** | Add `@astrojs/db`, `@libsql/client`, `arctic` to `package.json`; add `dotenv` to dev | `client-sites/chroma-decks/package.json` |
| **Astro config** | Flip `output: "static"` → `output: "server"`; add `db()` to integrations; add the `ASTRO_DATABASE_FILE` vs `ASTRO_DB_REMOTE_URL` guard at config top | `client-sites/chroma-decks/astro.config.mjs` |
| **Middleware** | `src/middleware.ts` — gates every route, intercepts `/access/*` callbacks, attaches session to context | `client-sites/chroma-decks/src/middleware.ts` |
| **Auth lib** | `src/lib/auth/{session,token,passcode,oauth-github,lossless_id,types}.ts` | `client-sites/chroma-decks/src/lib/auth/` |
| **Pages** | `src/pages/access/index.astro` (magic-link request) + `src/pages/access/passcode.astro` (tier-3 fallback) | chroma's `/access/` pages |
| **API endpoints** | `src/pages/api/access/*` (magic-link mint, OAuth callback, session create/destroy) | chroma's `/api/access/` |
| **Org seeding** | Seed `lossless.group` + `humain.vc` as the two organizations (domain-as-id convention per ai-labs CLAUDE.md) | inline in `db/seed.ts` |
| **Env** | `.env.example` enumerating: `ADMIN_PASSCODE`, `VIEWER_PASSCODE`, `SESSION_SECRET`, GitHub OAuth client id/secret, `ASTRO_DATABASE_FILE` (local) or `ASTRO_DB_REMOTE_URL` + `ASTRO_DB_APP_TOKEN` (Vercel) | chroma's `.env.example` |
| **Invite CLI** | `scripts/invite.ts` for minting magic-link invites | chroma's `scripts/invite.ts` |
| **Package script** | `pnpm invite` registered in package.json | — |

## Sequencing

1. **Schema + seeds first.** Author `db/config.ts`. Seed both organizations. Verify `astro db push` works against a local libSQL file.
2. **Lib then middleware.** Copy `src/lib/auth/` from chroma. Adapt `lossless_id.ts` to recognize `@humain.vc` as a privileged client domain. Wire `src/middleware.ts`.
3. **Pages + API last.** `/access/` UI uses the same Inter + Space Grotesk + bio-green discipline as the main deck.
4. **First invite + login.** Mint an invite via `pnpm invite michael@lossless.group`. Verify magic-link → session → access to `/scroll/pitch/proto/`.
5. **Deploy.** Add Turso remote URL + token to Vercel env. Build with `--remote`.

## Organization seeding

Per ai-labs CLAUDE.md "domain-as-id" convention, seed two organizations on first migrate:
- `id: "lossless.group"` · `slug: "lossless"` (operating-team org)
- `id: "humain.vc"` · `slug: "humain"` (client this deck represents)

Personal-email signups (gmail.com, etc.) bucket as `id: "personal"`.

## Open questions

- Does Humain want a custom-domain shipped (`decks.humain.vc`)? If so, defer until DNS is theirs to manage. v0.x can ship at `humain-vc-decks.vercel.app`.
- Does Humain want GitHub OAuth, or magic-link-only? Chroma installed both; calmstorm started magic-link-only. Default: install both, ship with GitHub OAuth disabled until they ask.

## See also

- `../../../chroma-decks/context-v/plans/Install-Auth-Surface-from-Calmstorm-Pattern.md` — chroma's own port plan (the reference implementation that succeeded).
- `apps/deck-shell/src/` — note that auth is **not** in the shared shell; each client-site installs its own, intentionally (per-client distribution tier + audience differs).

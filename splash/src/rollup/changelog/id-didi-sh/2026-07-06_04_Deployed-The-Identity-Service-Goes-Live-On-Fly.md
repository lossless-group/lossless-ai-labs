---
date_created: 2026-07-06
date_modified: 2026-07-06
title: "Deployed — the identity service goes live on Fly"
lede: "The walking skeleton left the laptop: id-didi-sh runs on Fly.io in lax with the libSQL file on a mounted volume, secrets set without ever being displayed, JWKS serving the production Ed25519 key at id-didi-sh.fly.dev — and a TLS cert issued for id.didi.sh, two DNS records away from the real domain."
publish: true
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
files_changed:
  - fly.toml
  - Dockerfile
  - .dockerignore
  - rel/overlays/bin/{server,migrate}
  - lib/id_didi_sh/release.ex
  - landing/ (new — Vercel-ready apex conversion surface)
  - README.md
tags:
  - Progress-Update
  - Deploy
  - Fly-Io
  - Identity-Service
  - Elixir
  - Vercel
  - Didi-Platform
from: "id-didi-sh"
from_path: "changelog/2026-07-06_04_Deployed-The-Identity-Service-Goes-Live-On-Fly.md"
---
## Why Care?

An identity service that only runs on one laptop can't identify anyone. As of
today the didi.sh identity plane is real infrastructure: the same walking
skeleton proven this morning now answers at
**https://id-didi-sh.fly.dev/** — JWKS serving the production Ed25519 public
key, the database on a persistent volume, migrations applied at boot. A TLS
certificate is issued for **id.didi.sh**; the moment two DNS records land in
Vercel (the didi.sh registrar), the platform's canonical URL is live and the
landing page's "Create your didi.sh ID" CTA has a real destination behind it.

## What's New?

- **Deploy artifacts, hand-tuned.** `mix phx.gen.release --docker` generated
  the multi-stage Dockerfile pinned to the exact toolchain (Elixir 1.20.2 /
  OTP 29.0.3); the hand-written `fly.toml` carries the identity posture —
  `lax` region, port 8080, a Fly Volume at `/data` for the libSQL file, and
  `auto_stop_machines: off` because the identity plane must not cold-start
  under JWKS and refresh traffic from every service.
- **Migrations at boot, deliberately.** The `[processes]` command runs
  `migrate && server` on the machine itself — never a Fly `release_command`,
  which executes on an ephemeral machine that does *not* mount the volume
  and would migrate a database that instantly vanishes. The classic
  Fly-plus-SQLite trap, pre-avoided in config.
- **Secrets without exposure.** `SECRET_KEY_BASE` and the private
  `ID_SIGNING_JWK` were generated and piped straight into
  `fly secrets set` — verified structurally (Ed25519, private half present)
  without the values ever appearing in a terminal, transcript, or clipboard.
  The production signing key is distinct from the gitignored dev keypair.
- **Cert + DNS runway.** `fly certs add id.didi.sh` issued; the README's
  deploy runbook now covers the whole sequence from `brew install flyctl`
  through the Vercel DNS records.

## The launch-day wrinkle

The Fly web launcher (pointed at the GitHub repo) deployed *before any
secrets existed*, so the first machine crash-looped on
`SECRET_KEY_BASE is missing` and the dashboard raised its
"machines restarting a lot" flag. The diagnosis was already written in the
runbook: set the two secrets, `fly deploy` to converge, and version 3 booted
clean. The launcher also created its own volume from our committed
`fly.toml` while a second was being created by hand — the duplicate is
destroyed; one `idds_data` volume remains, attached, with scheduled
snapshots on.

## Also included

- **`landing/`** — the didi.sh apex conversion surface, derived from the
  splash (same credential posture, dev surfaces stripped, CTA-focused),
  Vercel-ready with the one-time wiring documented in `landing/README.md`.
  The domain is registered at Vercel, so the apex assignment is
  dashboard-only work.

## What's Next

DNS records for `id` (A → `66.241.125.92`, AAAA → `2a09:8280:1::140:453c:0`)
in Vercel, then `fly certs check id.didi.sh` confirms and the canonical URL
is live. Litestream→R2 backup lands before real client accounts exist
(volume snapshots are the interim recovery story). Then the increments
resume: augment-it's verify adapter (2) against the deployed service, and
invites + the LiveView admin (3) — the increment that onboards reach-edu
and humain-vc.

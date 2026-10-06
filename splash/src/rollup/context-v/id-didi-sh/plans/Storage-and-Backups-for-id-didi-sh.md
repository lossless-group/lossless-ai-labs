---
title: "Storage and backups for id-didi-sh"
lede: "Move to Turso, because being able to log in and fix a row by hand beats driver purity when there is one operator. Backups stop being a project and become a checkbox."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
semantic_version: 0.0.0.1
status: Draft
tags:
  - Plan
  - Id-Didi-Sh
  - Storage
  - Turso
  - Backups
site_uuid: 3c9a1e77-52b8-4a4f-9c1a-6d8f4b2e5a13
hex_code: bk9wqt
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
publish: false
from: "id-didi-sh"
from_path: "context-v/plans/Storage-and-Backups-for-id-didi-sh.md"
---
# Storage and backups for id-didi-sh

## Decision (Michael, 2026-08-20): move to Turso

> *"Turso is easy because I can log into it and fix things by hand."*

That is the deciding criterion and it beats the alternatives on the axis that
actually matters here. There is **one operator**. A hosted database with a
console he can open and repair is worth more than a marginally purer driver on a
file he can only reach by `fly ssh`.

This supersedes the storage note in
`ai-labs/context-v/specs/Id-Didi-Sh-Identity-Service.md` (2026-07-06), which
chose a local libSQL file with Turso as the *named upgrade path*. We are taking
the upgrade path now, earlier than planned, because the reason to defer it —
no Elixir driver — has changed.

## What this settles

- **Litestream is moot.** It was the durability answer for a local file. Turso
  handles replication and point-in-time restore itself. Do not build the sidecar.
- **Backups become a checkbox**, not a project: confirm Turso's PITR window
  covers us and move on.
- **`fly.toml`'s `[mounts] idds_data` volume becomes vestigial** once migrated.
  Leave it until the cutover is proven, then remove.
- **Migrate-at-boot can stay or go.** With a remote database, Fly release
  commands would now work (the ephemeral-machine/volume problem disappears).
  Not worth changing until something forces it.

## The driver, which is the only real work

`ecto_libsql` — unofficial, Rust NIFs, supports local files, remote Turso, and
embedded replicas with sync.
[hex](https://hex.pm/packages/ecto_libsql) · [GitHub](https://github.com/ocean/ecto_libsql)

**Known risk, accepted:** Turso is moving off libSQL toward their new engine, and
`ecto_libsql` expects to enter maintenance mode. There is still no *official*
Elixir SDK. Accepted because the data is tiny, the schema is portable, and the
escape hatch is real — libSQL keeps the SQLite file format, so falling back to
`ecto_sqlite3` on a local file is a config change, not a rewrite.

If the driver turns out to be a fight, **stop and say so** rather than grinding.
The fallback is to stay on `ecto_sqlite3` and revisit.

## Cutover

Small, because there is essentially no data — one real account and one unused
client account.

1. Create the Turso database. Capture `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
   as Fly secrets.
2. Swap `{:ecto_sqlite3, ...}` for `{:ecto_libsql, ...}` in `mix.exs`; point
   `IdDidiSh.Repo` at the Turso URL in `config/runtime.exs`.
3. Run the two existing migrations against Turso.
4. Re-seed rather than migrate data: `mix id.seed` / `mix id.org` / `mix id.member`
   already exist, and there are two accounts. Do not write a data-migration script
   for this.
5. Prove it: sign in with a magic link, hit `/api/me`, fetch
   `/.well-known/jwks.json`. All three green = cut over.
6. Remove the Fly volume once a week has passed without incident.

## Credential encryption still matters

Turso holds the ciphertext; `CREDENTIAL_ENCRYPTION_KEY` lives in Fly secrets.
Recovery needs **both**. Keep the key in a password manager as well, so a Fly
problem is not simultaneously a key-loss event. Ciphertext and key must not share
one failure domain.

## Gate on the entities work

Increment 3 of [[Entities-and-Keys-Implementation-Plan]] — the one that starts
storing other people's API keys — should land **after** this cutover, so
credentials are never written to the unreplicated volume in the first place.

Increments 1 and 2 (entities, memberships) are unaffected and can proceed now.

## Related

- [[Entities-and-Keys-Implementation-Plan]] — the work this sequences with
- `ai-labs/context-v/specs/Id-Didi-Sh-Identity-Service.md` — the 2026-07-06
  storage decision this supersedes

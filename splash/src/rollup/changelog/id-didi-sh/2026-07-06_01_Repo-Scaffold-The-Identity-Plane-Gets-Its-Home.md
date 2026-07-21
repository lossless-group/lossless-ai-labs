---
date_created: 2026-07-06
date_modified: 2026-07-06
title: "Repo scaffold — the identity plane gets its home"
lede: "id-didi-sh exists: the repo for the didi.sh identity service, scaffolded with the tree's universal directories, a README that carries the contract and the increment plan, and a CLAUDE.md that marks this as the Lossless tree's polyglot (Elixir) exception."
publish: true
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
files_changed:
  - README.md
  - CLAUDE.md
  - .gitignore
  - context-v/reminders/Canonical-Spec-Lives-in-Ai-Labs.md
  - changelog/2026-07-06_01_Repo-Scaffold-The-Identity-Plane-Gets-Its-Home.md
tags:
  - Progress-Update
  - Scaffold
  - Identity-Service
  - Didi-Platform
  - Elixir
from: "id-didi-sh"
from_path: "changelog/2026-07-06_01_Repo-Scaffold-The-Identity-Plane-Gets-Its-Home.md"
---
## Why Care?

The didi.sh platform decision (one login, one agent, three services) was made
and specced today at the ai-labs level. This scaffold turns the identity
plane from a spec into a place — the repo the Phoenix walking skeleton lands
in next, mounted as an `ai-labs` submodule per pseudomonorepo discipline.

## What's Here

- **README** — the service in brief: the three-artifact contract (cookie,
  API, JWKS), the headless-first GTM constraint, the Elixir/Phoenix +
  libSQL-file stack with the Turso upgrade path, the consumer table, and the
  six implementation increments as a living checklist.
- **CLAUDE.md** — agent instructions marking this repo as the tree's
  polyglot exception, with the six load-bearing invariants (invite-only, no
  passwords, asymmetric-only session signing, headless-first, no shared
  packages with consumers, libSQL file store).
- **context-v/ + changelog/** — the universal directories, seeded with a
  reminder that the spec of record stays in the ai-labs parent.
- **.gitignore** — Elixir/Phoenix-shaped, with database files and secrets
  excluded from day one.

## What's Next

Increment 1: the Phoenix walking skeleton — `mix phx.new`, migrations,
keypair, magic-link issue → redeem → cookie → offline verify → `/api/me`,
proven by a curl script.

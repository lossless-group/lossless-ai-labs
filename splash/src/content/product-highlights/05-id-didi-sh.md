---
title: didi.sh
slug: id-didi-sh
order: 5
status: active build
label: infrastructure
repo: https://github.com/lossless-group/id-didi-sh
tags:
  - elixir
  - phoenix
  - identity
  - sso
lede: |
  The identity plane behind `id.didi.sh`. One small owned auth service: create an account once from inside whichever app invited you, and you're signed in across memos (MemoPop), decks (DidiDecks), and Augment It via a single `.didi.sh` session cookie. The tree's deliberate polyglot exception — Elixir/Phoenix where everything else is TypeScript — because a session service is exactly the workload BEAM was built for.
---

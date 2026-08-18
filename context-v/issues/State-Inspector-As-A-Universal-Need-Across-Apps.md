---
title: "State-Inspector as a universal need — every ai-labs app hides its state from the people running it"
lede: "No ai-labs app can answer \"what does it currently believe?\" — rune singletons, deck state, LangGraph FlowState, none inspectable."
date_created: 2026-07-24
date_modified: 2026-07-24
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
semantic_version: 0.0.0.1
origin_instance: "ai-labs/augment-it/context-v/issues/No-User-Visibility-Into-State-Needs-A-State-Inspector.md"
tags:
  - Issue
  - Oversight
  - Usability
  - AI-Labs
  - State-Inspector
  - Observability
  - Cross-App-Pattern
status: Open · Jotted
site_uuid: 3bf9227d-f5d3-44e3-b961-ea619a04b052
hex_code: 9ep3mv
date_authored_initial_draft: 2026-07-24
date_authored_current_draft: 2026-07-24
---

# State-Inspector — a universal need across the ai-labs apps

## The pattern

Every app in this tree accumulates runtime state across multiple substrates,
and none of them offer a surface that answers **"what does the app currently
believe?"** Non-technical users won't open it — but the operator debugging a
desync, and the agent verifying a flow end-to-end, both need it. Today the
answer is DevTools + terminal + reading storage by hand, per app, per
substrate.

## Per-app instances (the same hole, different substrates)

| App | Where state hides |
|---|---|
| **augment-it** | Per-remote Svelte rune singletons (deliberately unshared across federation), `augment-it:*` localStorage keys, WS session frames, server-side stores, SurrealDB. Full inventory in the origin instance (see frontmatter). |
| **dididecks-ai** | Deck/variant/slide position, theme + mode state, auth-surface state, scroll-vs-play divergence per slide — spread across localStorage, URL, and per-site stores. |
| **memopop-ai** | LangGraph **FlowState** — the deepest case: server-side graph state that drives multi-agent orchestration, visible only in logs/checkpoints, never to the analyst watching a run. (Deliberate architectural contrast with augment-it's thin orchestrator — which makes its inspector need *bigger*, not smaller.) |

## The shape of a fix (jotted)

- **A blueprint, not a package.** Per the standing rule, the three apps
  share patterns knots-style (blueprint + copy-from), never a runtime
  dependency. The deliverable up here is a
  `context-v/blueprints/State-Inspector-Pattern.md` once one app proves an
  implementation — augment-it is the natural proving ground (its issue is
  already scoped).
- **Common contract candidates, regardless of substrate:** read-only
  first; a named registry of state locations per app; a recent-events tap
  (window events / WS frames / graph transitions); snapshot-on-demand
  rather than live-streaming as v1.
- **Agent leverage is half the point:** an inspector surface (or verb —
  `/state`) gives browser-drive verification and chat agents something to
  assert against, not just humans something to read.

## Open questions

- [ ] Prove in augment-it first, then extract the blueprint — or write a
  thin blueprint now so dididecks/memopop sessions at least *name* their
  state registries as they work?
- [ ] Is memopop's FlowState inspector a different genus (server-side run
  introspection, closer to a trace viewer) that shares the name but not
  the pattern? Decide when extracting the blueprint, not before.

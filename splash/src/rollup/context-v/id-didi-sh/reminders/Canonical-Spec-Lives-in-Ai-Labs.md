---
title: "The canonical spec lives in the ai-labs parent, not here"
lede: "This repo's context-v/ holds implementation-local docs only. The spec of record — contract, session model, schema, increments — is ai-labs/context-v/specs/Id-Didi-Sh-Identity-Service.md. Read it before changing anything load-bearing."
date_created: 2026-07-06
date_modified: 2026-07-06
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
tags:
  - Reminder
  - Id-Didi-Sh
  - Context-Vigilance
from: "id-didi-sh"
from_path: "context-v/reminders/Canonical-Spec-Lives-in-Ai-Labs.md"
---
# The canonical spec lives in the ai-labs parent

Because id-didi-sh is a **platform-level** service (it serves memos, decks,
and augment-it equally), its spec belongs at the level that spans them:
`ai-labs/context-v/specs/Id-Didi-Sh-Identity-Service.md`, with the platform
frame in
`ai-labs/context-v/explorations/Didi-sh-One-Login-One-Agent-Three-Services.md`.

What belongs in *this* repo's `context-v/`:

- implementation-local blueprints (e.g. the exqlite-against-libSQL build
  recipe once proven, the Litestream supervision shape)
- issues found while building
- prompts for repeatable local tasks

What does **not** belong here: contract changes, schema redesigns, new
credential pathways. Those edits go to the parent spec first, then get
implemented here — never the reverse.

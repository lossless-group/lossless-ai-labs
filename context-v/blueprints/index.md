# Blueprints

* [Chat-As-Verb-Surface Patterns — How the In-App Chat Calls Skills, MCP Tools, and Scripts; How it Reads State and Anticipates Lightly](Chat-As-Verb-Surface-Patterns.md) - Five conventions that let three apps share a chat surface without sharing a package, starting with capability adapters and one envelope.
* [Entity-Per-Slot Deck Assembly From Public Cards and Private Artifacts](Entity-Per-Slot-Deck-Assembly-From-Public-Cards-and-Private-Artifacts.md) - One entity per slot: their public card, our private read, their own artifact — assembled into a shell whose sections are the registry.
* [Install Auth Across Applied AI Labs Apps](Install-Auth-Across-Applied-AI-Labs-Apps.md) - Don't re-derive the auth pattern — astro-knots already shipped it. This is the ai-labs handle: what to pull in, which DB, what to translate.
* [Per-App Workspace Conventions — Discipline, Not a Shared Package](Per-App-Workspace-Conventions.md) - No universal `@lossless/workspace` package. What every app shares is the shape: singleton state, an activeView union, a capability registry.
* [Show the Filesystem of a Workspace](Show-The-Filesystem-Of-A-Workspace.md) - Every ai-labs app sits on a folder the user cannot see. The tree is the same five decisions each time; the backend is the only part that differs.
* [The Source Curation Gate — A Convergent Prune-and-Promote Surface for AI-Assisted Web Research](Source-Curation-Gate.md) - Three apps grew the same organ — a human prune-and-promote step between retrieval and generation that the writer cannot then escape.

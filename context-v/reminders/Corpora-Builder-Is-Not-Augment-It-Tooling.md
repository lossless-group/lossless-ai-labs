---
title: "corpora-builder Is Not augment-it Tooling"
lede: "It was born inside augment-it and split out. The relationship is inheritance, not overlap — and its purpose is bigger than either app."
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.0.1
status: Active
site_uuid: 00633331-3e0a-4433-881b-cc52bb138b8f
hex_code: tuzpjo
summary: >-
  Origin and purpose guardrail for agents working anywhere near corpora-builder,
  augment-it, dididecks-ai, or memopop-ai. corpora-builder was built inside
  augment-it because both centered on augmenting record sets for a client, then
  split out once it proved useful standalone and as a didi.sh suite component.
  So the corpus sitting in augment-it/clients/<slug>/corpus/ is a legacy of
  origin rather than a design decision, and the two programs are currently
  disconnected in fact. Also states the purpose the whole thing rests on — no
  guesswork on factual claims in documents of consequence — which is why the
  corpus is a hard boundary and not a retrieval convenience.
tags:
  - Reminder
  - Corpora-Builder
  - Augment-It
  - DidiDecks
  - MemoPop
  - Corpus
publish: true
---

# corpora-builder Is Not augment-it Tooling

Short, sharp orientation for any agent that touches `corpora-builder`,
`augment-it`, `dididecks-ai`, or `memopop-ai`. The layout of this tree invites a
wrong inference, and the wrong inference leads to bad architectural suggestions.

## Origin — inheritance, not overlap

**Rule.** `corpora-builder` was **built inside `augment-it`** and later split out
into its own repo. Treat it as a product that was born there, not as tooling
`augment-it` owns and not as a peer that happens to overlap.

**Why it was there:** both centered on the same use case — *augmenting record
sets for a client* — and the first corpus corpora-builder needed was one
`augment-it` already had. As it built out, the owner recognized it is useful as a
**standalone app** *and* as one that **integrates into the didi.sh venture-capital
suite** alongside `dididecks-ai` and `memopop-ai`. That is when it earned its own
repo.

**What follows, and this is the part agents get wrong:**

- **The corpus at `augment-it/clients/<slug>/corpus/` is a legacy of origin, not a
  design decision.** Nobody chose to put a corpus inside a record-enrichment app;
  it was already there when corpora-builder split out. Do not reason backwards
  from its location to a principle.
- **They are currently disconnected in fact.** As of 2026-08-22 the reach-edu
  corpus (892 files, git submodule `lossless-group/augment-reach-edu`) is edited
  through augment-it's tooling, while corpora-builder has **never written a byte**
  to it or to its R2 bucket. If a session finds this confusing, that is the
  correct reaction — it is unfinished, not intentional.
- **Moving a corpus toward corpora-builder is a handover, not a copy.** Frame it
  that way in any plan.
- **Never propose a shared package.** Three consumers — `augment-it` (record
  sets), `dididecks-ai` (decks), `memopop-ai` (memos) — makes shared code
  tempting and it remains prohibited. Integration is a **service with a verb
  contract and file formats** (the `source.*` vocabulary), never an import across
  the three apps. See [[Preferred-Stack]] and the standing no-shared-dependency
  rule.

## Purpose — no guesswork on factual claims

**Rule.** The corpus is a **hard boundary**, not a retrieval convenience. When
generating anything factual for a client-facing artifact, claims come from the
corpus or they do not get made.

**Why, in the owner's framing (2026-08-22):**

> Because of the rise of agents, ever more capable models at lower and lower token
> cost, we can assume that **millions of people will bump into the fact that they
> are drafting documents of consequence and can't risk hallucination** and the
> inaccuracies that come from it. The only real solution for now is to tightly
> restrict drafting documents and decks to a "corpus" or "corpora" — **no
> guesswork allowed for factual-level claims.**

This is the thesis the whole product rests on, and it is why corpora-builder is
**foundational to the suite rather than a peer within it**. `dididecks-ai` and
`memopop-ai` both generate documents of consequence; under this rule the corpus is
not a feature they integrate, it is the substrate they are only trustworthy on
top of.

**How to apply:**

- **Do not fill gaps from training data** when authoring memo or deck content for
  a client. A missing fact is a capture task, not a paraphrase opportunity.
- **Provenance is per claim, not per document.** A corpus boundary constrains
  *retrieval*; it does not stop a model interpolating between retrieved facts, and
  a sentence routinely mixes a checkable claim with a judgment. Hex-code citations
  and the LFM citation conventions are the enforcement mechanism, not formatting.
- **A weak corpus turns hallucination into confident citation of bad sources**,
  which is harder to catch because it looks rigorous. That makes the quality scan
  load-bearing rather than hygiene — treat corpus quality as the product's
  trustworthiness, and surface it rather than burying it.
- **Say what is missing.** "The corpus does not support this claim" is a correct
  and useful output. Filling the hole silently is the failure this whole system
  exists to prevent.

## Related

- `../plans/Sync-Corpora-to-R2-and-Show-Clients-What-Changed.md` — where the origin was recorded and what it changes
- `../../corpora-builder/context-v/explorations/Corpora-Builder-System-Design.md` — the operator wishlist and the domain model
- `../explorations/A-Syncbox-For-Client-Document-Folders.md` — the substrate and history reasoning around it
- `../../../context-v/reminders/Check-The-Substrate-Before-Reasoning-On-Top-Of-It.md` — the tree-wide guardrail from the same session

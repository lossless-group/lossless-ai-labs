---
title: "Dididecks-AI: Business Model Exploration"
lede: "Build in public, copyleft where we can, copyright where it matters, hosted + Forward Deployed humans as the real growth engine. This is the option-space; sign-off on a model is downstream of usage signal."
date_authored_initial_draft: 2026-05-11
date_authored_current_draft: 2026-05-11
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-11
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Exploration
tags:
  - Business-Model
  - Open-Source
  - Hosted-Services
  - Forward-Deployed-Engineering
  - Pricing
  - Dididecks
authors:
  - Michael Staton
image_prompt: "A craftsman's tool wall in a workshop, where some tools are unlocked and free for any visitor to take, others are chained to brass placards reading 'service contract,' and a small table near the door has two coffee chairs labeled 'Forward Deployed.' Warm gaslight, sawdust, restrained palette."
date_created: 2026-05-11
date_modified: 2026-05-11
from: "dididecks-ai"
from_path: "context-v/explorations/Dididecks-AI-Business-Model.md"
---
# Dididecks-AI: Business Model Exploration

> **Exploration, not spec.** This document maps the option-space around how Dididecks-AI is licensed, priced, sold, and supported. It deliberately lives in `explorations/` rather than `specs/` because the destination is genuinely unclear — sign-off on a model is downstream of usage signal we don't yet have. Sibling to [[../specs/Dididecks-AI-Slide-Decks-as-Code]].

## Why this is an exploration, not a spec

The parent spec, [[../specs/Dididecks-AI-Slide-Decks-as-Code]], names "build-in-public + copyleft + hosted upsell + Forward Deployed Engineers / Designers" as Input #5. That's a *philosophy*, not yet a model. The architectural specs (parent + two siblings) define *what we are building*; this doc explores *how it earns its keep*. Per the `context-vigilance` skill, business model belongs in `explorations/` until the destination becomes clearer.

## The starting philosophy (from the parent spec)

Lossless Group's stance:

- **Build in public.** The work is visible — code, decisions, changelog, post-mortems. Not because openness is morally superior, but because *legible work compounds* over time in ways that closed work doesn't.
- **Copyleft where we can.** Permissive licenses (MIT / Apache 2.0) by default, copyleft (AGPL) where the obligation to share-back is the right discipline.
- **Copyright where it matters.** The hosted runtime, the deployment infrastructure, the curated agent-skills pack, the FDE methodology — these stay proprietary or trade-secret.
- **Let the tinkerers play.** OSS users who want to self-host and never pay us a dime are not lost revenue — they are *distribution* and *credibility.* Some fraction of them become paid customers later; all of them are reputation surface.
- **Upsell to hosted + value-add.** The growth engine is *not* seat-based SaaS pricing. The growth engine is **hosted services for customers who don't want to operate the runtime themselves**, plus **Forward Deployed humans for customers who need the work done, not just the tool given.**

## The customer segments (a working taxonomy)

| Segment | Behavior | What they pay for |
|---|---|---|
| **Tinkerers / Hackers** | Self-host the OSS, BYO-keys, customize aggressively | Nothing. They are distribution. |
| **Independent operators** (solo GPs, EIRs, fractional partners) | Self-host or use lightweight hosted tier, BYO-keys | A modest hosted tier (managed runtime + backups + updates). |
| **Established VCs, hands-on partners** | Hosted tier, may BYO-keys or use our billing | Hosted tier + access to the curated skill pack + occasional FDE engagement. |
| **Established VCs, busy managing partners** | Hosted tier, billing through us, FDE-driven | Hosted tier + heavy FDE/FDD engagement. *This is the high-margin core.* |
| **Institutional LPs, regulated funds** | Containerized self-host, BYO-keys, FDE-driven onboarding | Enterprise self-host license + heavy FDE engagement + custom compliance work. |

The architectural specs are designed to serve *all five* simultaneously. The pricing model is the layer that captures value differently at each tier.

## The Forward Deployed motion

Forward Deployed Engineers (Palantir's coinage) and Forward Deployed Designers — practitioners who **embed with the client** to do the work, not just train the client on the tool. Why this is the right growth engine for Dididecks-AI specifically:

1. **The customer is too busy to operate the tool themselves** even though the tool is good. The same logic that makes "chat-in-app, not terminal" right at the UX layer makes "we drive it for you" right at the service layer.
2. **The output is high-stakes.** A managing partner does not want to risk an LP meeting on a tool they only half-understand. An FDE-rendered deck, ready Tuesday for Wednesday, is what they will pay for.
3. **It is a learning surface.** Every FDE engagement teaches us what to bundle into the next agent-skill, what to add to the visual library, what to fix in the citation system. The product gets sharper *because* we deploy humans alongside it, not despite.
4. **It is high-margin** in a category where SaaS-margins-per-seat would be capped low (these customers don't have headcount; they have one managing partner per fund).
5. **It is not infinitely scalable** — and that's fine. The OSS + hosted tiers are what scale; FDE is the discriminator at the top.

## Pricing dimensions (option-space, not commitment)

### Dimension 1 — Runtime hosting

- **Self-hosted, BYO-keys** — free (OSS).
- **Self-hosted, hosted-billing** — small markup over API costs. (Rare in practice; if you can self-host, you can BYO-keys.)
- **Our-hosted, BYO-keys** — modest monthly fee for the managed runtime; client pays their own LLM bill.
- **Our-hosted, hosted-billing** — bundled. We absorb LLM cost into the subscription with a markup.
- **Containerized enterprise self-host** — enterprise license, support contract, white-glove onboarding.

### Dimension 2 — Skill pack tier

- **Open skill pack** — bundled with the OSS install. Always free.
- **Curated skill pack** — additional pre-tuned skills for DD-grade work (citation, visual library, brand-ingestion, deck-iteration). Part of the hosted subscription.
- **Custom skills** — built for one client during an FDE engagement. Client owns. Some may be promoted to the curated pack later (with consent).

### Dimension 3 — Forward Deployed engagement

- **None** — client self-serves.
- **Project-based** — one FDE/FDD for one deck or one engagement window. Hourly or fixed-fee.
- **Retainer** — ongoing FDE coverage. Quarterly or annual.
- **Embedded** — FDE works on-site / dedicated, treated as an extension of the firm's team.

## Open questions

1. **Pricing levels.** What do the actual numbers look like at each tier? Hosted base, hosted+LLM, enterprise self-host? We don't know yet; we need usage signal.
2. **The "Forward Deployed" labor pool.** Who *are* the FDEs/FDDs? Lossless Group practitioners initially. Then? A contractor network? A partner-with-design-agencies model?
3. **The OSS license itself.** MIT? Apache 2.0? AGPL (to force hosted competitors to share-back)? BSL with a future date conversion? Each has different implications for adoption vs. defensibility.
4. **The skill-pack copyright question.** Are the curated skills part of the OSS install (bundled, copyright Lossless, free to use, not free to fork)? Or are they a separate, licensed product? Probably the former, but worth deciding.
5. **The "hosted billing" markup.** When clients use our LLM-billing tier, what's the markup? Cost-plus? Tiered? Flat per-deck? Per-token-with-cap?
6. **Channel partnerships.** Do we partner with design agencies, MBB firms, or fund-admin platforms to bring Dididecks to clients we wouldn't otherwise reach? Or stay direct?
7. **The exit posture.** If this works, it is acquirable by a deck-tool incumbent (Pitch, Canva, Gamma's eventual acquirer) or by a portfolio-tooling incumbent (Carta, Affinity, Visible). Worth not optimizing for, but worth not foreclosing either.

## What we are NOT exploring here

- Specific dollar amounts (need usage signal first).
- Equity / venture financing posture (separate doc, separate decision).
- Hiring plans (downstream of revenue).
- M&A posture (premature).
- Brand and marketing (a different exploration entirely).

This document is about the *shape* of the model, not the *parameters.*

## Related

- [[../specs/Dididecks-AI-Slide-Decks-as-Code]] — parent spec; this exploration exists to free the spec from carrying business-model weight.
- [[../specs/Dididecks-AI-DD-Ready-Citation-and-Source-Access]] — sibling spec; citation-archive hosting has cost implications relevant here.
- [[../specs/Dididecks-AI-Visual-and-Diagram-Component-Library]] — sibling spec; the curated library is a hosted-tier value-add discussed here.
- `pseudomonorepos` skill — for why explorations live in `explorations/` and not `specs/`.
- `context-vigilance` skill — for the discipline of putting unfinished-thinking in `explorations/` rather than `specs/`.

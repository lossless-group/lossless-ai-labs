---
title: "Bridging PLG Self-Serve with the Previous Approach"
lede: "A collaborator moved faster than expected and stood up Postgres on her own server, anchoring the data layer on cheap self-hosted infrastructure instead of the Powabase track the Cloud-Workspace spec was drifting toward. She's also angling for product-led-growth self-serve, where users won't tolerate triggering builds. The previous direction — Play-UI as static, no-JS, rigid-aspect Astro components authored by an agent — was DD-grade by construction. This exploration walks the gap between the two stances, names the actual disagreement (it's about the unit of authoring, not the engine), proposes a hybrid where slides live as structured spec rows that an agent writes and a build step compiles to Play-UI components, and pulls the PLG-vs-DD-grade fork into the open as a deliberate product decision rather than a drifted one."
date_authored_initial_draft: 2026-06-07
date_authored_current_draft: 2026-06-07
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-06-07
at_semantic_version: 0.0.0.1
status: Draft
category: Exploration
augmented_with: Claude Code on Claude Opus 4.7 (1M context)
authors:
  - Michael Staton
tags:
  - Exploration
  - Dididecks-AI
  - Product-Led-Growth
  - Self-Serve
  - Cloud-Workspace
  - Postgres
  - Object-Storage
  - Authoring-Unit
  - Agent-Chat
  - Build-Step
  - Spec-Row
  - PLG-vs-DD-Grade
  - Cloudflare-R2
  - MinIO
  - Powabase-Drop
date_created: 2026-06-07
date_modified: 2026-06-07
from: "dididecks-ai"
from_path: "context-v/explorations/Bridging-PLG-Self-Serve-with-Previous-Approach.md"
---
# Bridging PLG Self-Serve with the Previous Approach

> **Exploration, not spec.** Captures a conversation between Michael and Claude on 2026-06-07 reacting to (a) a collaborator who moved faster than expected and stood up Postgres on her own server, (b) the surfaced cost of Powabase ($150/mo base) which made the original Cloud-Workspace engine recommendation untenable, and (c) the collaborator's product-led-growth (PLG) self-serve angle, which conflicts with the build-time SSG/Play-UI discipline pinned in [[../specs/Dididecks-AI-Slide-Decks-as-Code]] and the CLAUDE.md. This is the journey-mode doc that lays out the gap so the next spec edit is reactable rather than guessed-at. Sibling to [[Cloud-Variant-of-Dididecks-AI-Workspace]] (parent exploration) and [[../specs/Cloud-Workspace-for-Dididecks]] (downstream spec, currently a stub).

## What changed since the Cloud-Workspace spec was stubbed

Three facts surfaced in the 2026-06-07 conversation that the existing Cloud-Workspace stub does not yet reflect:

1. **Powabase is out.** Real cost is ~$150/month for the tier we'd actually use. Pre-revenue, that's not justified. The exploration [[Cloud-Variant-of-Dididecks-AI-Workspace]] tentatively recommended Powabase as the Shape-B engine because RLS is a Postgres feature; that reasoning still holds, but Powabase specifically is not the only Postgres on the table.
2. **A collaborator has already stood up Postgres on her own server.** Decision 2 of the Cloud-Workspace spec ("which engine") is functionally pinned by fait accompli: **self-hosted Postgres**, not Powabase, not Turso. What we lose vs. Powabase is the managed Auth + managed Storage + managed RLS migrations layer. Each of those has to be picked up explicitly.
3. **The collaborator is angling for product-led-growth (PLG) self-serve.** Self-serve users will not tolerate triggering builds, monkeying with files, or learning what `pnpm build` means. Either the agent does it for them, or there's a "publish" button that hides the build behind a server-side job.

Each of those facts is real and each pushes the architecture in a slightly different direction than the existing spec drift assumed.

## The disagreement is not about the engine

On the surface this looks like a Postgres-vs-something disagreement. It is not. Both of us are on Postgres now. The actual disagreement — and it is a real one, worth resolving deliberately — is about **the unit of authoring**:

### Her model — slide = row in a database

A `slide` table with typed columns (title, headline, eyebrow, layout, theme) plus a JSON column for the soft parts (bullets, callout positions, asset references). Templates pull at request time, or at publish time, and the template *is* the rendering logic.

- **Pros:** Cheap to operate at scale per-user. Self-serve users edit fields in a form, the template re-renders, they see the result. Classic SaaS CMS pattern. Multi-tenant by default. Search/filter/sort across slides becomes trivial SQL.
- **Cons:** Constrains expressiveness to whatever the template parameterizes. "Make the headline bigger here" either becomes a new template variant or the user can't do it. The DD-grade decks we've shipped (Calmstorm, Chroma) have per-slide design discipline that no fixed template captures.

### His (Michael's) model — slide = `.astro` component file, emitted by an agent

The Play-UI `.astro` file IS the slide. The agent chat is the authoring surface. Self-serve users never see code; they describe what they want, the agent emits the file. Data flows in from DB columns or object storage at build time.

- **Pros:** Maximum expressiveness — each slide can be visually unique because it IS its own component. Aligns with the Play-UI discipline pinned in `dididecks-ai/CLAUDE.md` ("no responsive CSS, no JS, static letterbox to 1920×1080"). Aligns with the "recreate, don't extract" decomposition pattern in `/api/slide-decompose`. The agent IS the product surface, not a layer above it.
- **Cons:** Requires a build step to ship. Self-serve users hit this build step somewhere — either the agent triggers it, or a "publish" button does. Authoring iteration without a build is harder (the spec row would have to be a thing the agent reads/writes between builds).

Both are internally consistent. Neither is wrong. They imply very different operational shapes.

## The hybrid that I think actually resolves it

**Unit of authoring = a structured spec row in Postgres. Two consumers of that row:**

1. **Agent chat** reads the spec and iterates conversationally. "Make the headline bigger." "Add a third bullet." "Swap the headshot." The agent writes back to the spec row. Real-time, no build needed for the authoring loop.
2. **Publish step** reads the spec and emits the Play-UI `.astro` component file, then runs the Astro build. The "publish" button the user presses IS this — and the build happens on the server, not the user's machine. Sub-30s for ~20 slides on a small VPS is plausible; if it isn't, that's a real engineering target, not a vibe.

The DB schema becomes (sketch, not final):

```sql
CREATE TABLE slide (
  id           uuid PRIMARY KEY,
  deck_id      uuid NOT NULL REFERENCES deck(id),
  slot         text NOT NULL,        -- e.g. "05" — coordinates with the registry
  variant      text NOT NULL,        -- e.g. "enhanced-v3"
  spec         jsonb NOT NULL,       -- the agent reads/writes this
  status       text NOT NULL,        -- 'draft' | 'published' | 'archived'
  built_at     timestamptz,          -- last successful build of this slide
  built_hash   text,                 -- hash of spec at build time, for skip-rebuild
  updated_at   timestamptz NOT NULL DEFAULT now(),
  workspace_id uuid NOT NULL REFERENCES workspace(id),
  UNIQUE (deck_id, slot, variant)
);
```

The `spec` jsonb is the contract between the agent and the build step. The agent writes a structured spec ("here is what this slide should be"). The build step is a **deterministic transform** from `spec` → `.astro` component file → Astro build output.

### What this preserves on both sides

| Constraint | Where it's satisfied |
|---|---|
| Self-serve users never trigger a build manually | They press "publish"; the server-side job runs it |
| Self-serve users don't write code | They chat with the agent; the agent emits the file |
| DD-grade output stays SSG, no-JS, rigid-aspect Play-UI | The build emits `.astro` components per the existing pattern |
| Real-time read/write during authoring | Postgres rows + agent chat surface — no FS write needed during iteration |
| Brand assets, headshots, source PDFs | Object storage (see next section) |
| DB stays a projection, not the source of truth for shipped decks | The **shipped artifact** is the build output; the DB carries authoring state |
| The collaborator's "deck content as properties" instinct | Properties ARE in the DB (in the `spec` jsonb); they just don't BYPASS the build for the shipped surface |
| The "code-first / files-as-source" instinct already pinned in the parent spec | The shipped surface is still files. The agent emits them. The DB is the *staging* state. |

### What this changes from the current shape

- The static-content directory layout (`data/**/*.md` for Person/Company/Firm) doesn't change for the **existing DD-grade engagements**. Calmstorm, Chroma, Reach, Podium continue using the filesystem-as-source pattern. They don't need PLG; they have us.
- The new shape is for **net-new engagements that start in PLG mode** and for any DD-grade engagement that explicitly opts into the cloud workspace (Decision 1 of [[../specs/Cloud-Workspace-for-Dididecks]]).
- The build step needs to be **invocable from the server**, not just from a developer's laptop. This is the real engineering investment.

## Object storage — separate from the Postgres question

Even with Postgres holding spec rows, object storage is still needed for:

- **Substantiation Corpus** (PDFs, raw decks, source material — currently in gitignored `<client>/corpus/` directories on Michael's laptop)
- **Brand assets** (logos, headshots — currently checked into the client-sites repos)
- **User uploads from self-serve users** (logos they paste in, screenshots, source PDFs they want the agent to read from)

Postgres `bytea` is fine for kilobytes; bad for megabytes. Two viable options:

### Cloudflare R2

- $0.015/GB/month storage. **Zero egress fees.** S3-compatible API.
- For ~10GB of corpus + assets across engagements: ~$0.15/month.
- Right answer for the "we want this to scale to many clients without surprise bandwidth bills" case.

### MinIO self-hosted on the collaborator's server

- $0 marginal cost (it runs on the same VPS as Postgres).
- Same S3-compatible API as R2 — code is portable between them.
- Right answer for "she already has the server, let's not add another vendor."
- Migration to R2 later is straightforward if disk or bandwidth becomes the bottleneck.

**Recommendation pending discussion:** Start with MinIO on her server. The S3 API means moving to R2 is a config change, not a rewrite. R2 is the upgrade path when bandwidth costs or geographic distribution warrant it.

### What gets stored where

| Asset type | Where | Why |
|---|---|---|
| Slide spec rows | Postgres `slide.spec` jsonb | Indexable, queryable, agent reads/writes |
| Built `.astro` component files | Filesystem in build container, then static-deployed | They ARE the deck; same as today |
| Substantiation Corpus (PDFs, source decks) | Object storage, per-workspace prefix | Large blobs, infrequently accessed |
| Brand assets uploaded by users | Object storage, per-workspace prefix | Referenced from spec rows by URL/key |
| Built static deck output (HTML/CSS/assets) | Static host (Vercel / Cloudflare Pages / Netlify / the collaborator's server) | Public-or-gated reads, served at scale |
| Auth-Surface tables (Identity, Session, MintedToken) | Existing per-engagement `astro:db` / Turso | Decoupled from workspace runtime; per-client-site |
| Engagement-Telemetry (PageView, Action) | Existing per-engagement `astro:db` / Turso | Same — runs on the publish target |
| Workspace ACLs (who can edit which deck) | Postgres `workspace_member` table | Decoupled from per-engagement publish-side auth |

## The PLG vs DD-grade fork — pull it into the open

This is the deeper thing the conversation surfaced. The original Dididecks-AI spec describes a high-touch, DD-grade product: agent-augmented authoring, files-as-source, fundraise-process-aligned. The collaborator's PLG framing is a different product:

| Attribute | DD-grade (current) | PLG (collaborator's framing) |
|---|---|---|
| Onboarding | Lossless engagement, hand-rolled `client-sites/<name>/` submodule | Sign up, see a template gallery, click "use this" |
| Authoring surface | Code + agent chat + scroll-UI/play-UI discipline | Agent chat only; user never sees code |
| Editing latency expectation | "I see it after the next deploy" is fine | "I see it after I press save" is the bar |
| Pricing model | Engagement-priced (fixed fee, retainer, equity) | Tier-priced (free, $X/mo, $XX/mo for teams) |
| Source of differentiation | Forward-deployed Lossless humans, design discipline, DD-readiness | Speed-to-first-deck, template breadth, agent quality |
| Output discipline | Fundraise-grade, citation-bearing, audit-ready | "Looks decent, is fast, is mine" |
| Competitive frame | McKinsey deck team, boutique fundraise consultants | Pitch, Tome, Gamma, Beautiful.ai |
| Operating cost per user | High (humans involved) | Low (must be low for tier pricing to work) |

These are arguably **two products sharing one backend**, not one product. The hybrid above can serve both, but the surfaces around it diverge:

- DD-grade keeps its `client-sites/<name>/` submodule pattern, keeps its filesystem-as-source for the static content, keeps its forward-deployed engagement model.
- PLG gets a new surface — likely `app.dididecks.ai` or similar — where users sign up, pick a template, chat with the agent, and press publish. No submodule, no engagement, no Lossless human in the loop.

Both write to the same Postgres. Both can use the same agent. Both can use the same build step. The difference is in the **onboarding flow** and the **billing model**, not in the data layer.

### Why this matters for the next conversation with the collaborator

If she's optimizing for PLG and Michael's optimizing for DD-grade and neither of us has said so out loud, every architectural decision will pull in two directions at once. **Naming the fork is the cheap move.** Picking the fork doesn't have to happen this week — but acknowledging that both products are in play does.

This is plausibly **Decision 5** of the Cloud-Workspace spec, additional to the four already named:

- Decision 1 — Architectural shape (A, B, or both)
- Decision 2 — Database engine *(pinned by fait accompli to self-hosted Postgres)*
- Decision 3 — Platform-operator access posture
- Decision 4 — Tenancy boundary
- **Decision 5 (new) — Product fork: do we serve PLG and DD-grade as one product or two, and if two, do they share a backend?**

## What the existing live engagements need vs. what this exploration enables

A reality check on urgency. The three live DD-grade engagements (Calmstorm, Chroma, Reach) plus the imminent Podium one **do not need any of this** to ship. Their gaps are smaller and were named in the prior gap analysis:

1. **Substantiation Corpus is on Michael's laptop.** Object storage fixes this in an afternoon (R2 or MinIO; either works).
2. **Slide-Audit-Registry writes the filesystem.** Migrate `data/audits/slides.json` to a Postgres row. Smallest cleanest win.
3. **Calmstorm's per-Vercel-project setup feels "piecemeal."** It isn't broken; it's just three concerns (publish, auth, corpus) conflated. Naming them as separate surfaces is the meeting framing.

The cloud workspace + agent-authoring + PLG-self-serve stack is for **net-new engagements and the PLG product**, not for the existing DD-grade engagements. We should not retrofit them in a hurry.

## Open questions this exploration does not close

- **Does the collaborator agree with the spec-row + build hybrid?** It splits the difference, but splitting the difference sometimes pleases no one. Worth a direct conversation, not a Slack message.
- **What is the build latency target for PLG?** "Sub-30s for a 20-slide deck" is a guess. If self-serve users expect sub-5s, the architecture needs to be different (runtime rendering for the PLG tier, with the build still available for DD-grade publish).
- **Where does the agent run?** Server-side (her Postgres-bearing server, presumably) or client-side (browser-hosted, with API calls to Anthropic/OpenAI directly)? The privacy story differs a lot.
- **What's the auth model for PLG?** The existing Auth-Surface model is engagement-anchored (one Turso DB per `client-sites/<name>/`). PLG needs a single multi-tenant auth surface. That's not necessarily Postgres — it could be a separate Turso for the PLG product specifically — but the call should be deliberate.
- **What does "publish" mean in the PLG case?** A public URL? A gated URL with auth? Both as user-selectable options? This intersects with the existing publish-target patterns in `client-sites/`.
- **How does the agent emit a `.astro` file that respects the Play-UI no-JS rigid-aspect discipline?** This is a real prompt-engineering / tool-design question. The current pattern is that humans (with Claude's help) write these files; the agent emits them is a step further.
- **Is there a version of this that ships without Postgres at all for the PLG tier?** SQLite-on-the-server + object storage for blobs is a simpler stack. Postgres earns its place when concurrency or RLS or analytics is needed; for a small PLG MVP, it may be overkill. Worth a sentence even if the answer is "stick with Postgres, she's already deployed it."

## Provisional next steps

1. **A user discussion with the collaborator** — read this together, confirm the spec-row + build hybrid is acceptable to her, confirm she's OK with PLG and DD-grade being explicitly framed as two products sharing a backend.
2. **Cloud-Workspace spec update** — fold the four shifts in this exploration into [[../specs/Cloud-Workspace-for-Dididecks]]:
   - Pin Decision 2 to **self-hosted Postgres**, drop Powabase from the recommendation
   - Add the slide-as-spec-row + build-emits-component authoring model to Section 2
   - Add object storage (MinIO now, R2 later) as a sibling decision in Section 2
   - Add Decision 5 (PLG vs DD-grade product fork) to the decisions list
   - Defer Decisions 1 and 3 as before
3. **A reminder file** — "Postgres is self-hosted on a collaborator's server, not Powabase, not Turso." This is the kind of fact an agent will keep mis-remembering; worth a reminder in `context-v/reminders/`.
4. **For Calmstorm next week** — none of this changes. The existing Vercel deploy is fine; the corpus-on-laptop gap is the only real one, and R2 or MinIO fixes it in an afternoon. Frame the meeting as "three separate surfaces, not one rebuild."
5. **For the new client this week** — if they fit the PLG shape, this exploration is the early-read on what they're signing up for. If they fit the DD-grade shape, they get the existing `client-sites/<name>/` pattern and none of the cloud-workspace stack is in their critical path.

## Related

- **Parent stub spec, currently waiting on these decisions:** [[../specs/Cloud-Workspace-for-Dididecks]]
- **Parent exploration with the privacy properties + threat model + four architectural shapes:** [[Cloud-Variant-of-Dididecks-AI-Workspace]]
- **The two-sided architecture this entire conversation extends:** [[../specs/Dididecks-AI-Slide-Decks-as-Code]] § NS-1
- **Data model index the collaborator should treat as the schema contract:** [[../models/README]]
- **The runtime-mutable model that's the first migration target:** [[../models/Slide-Audit-Registry-Data-Model]]
- **The mutable corpus that's the first object-storage target:** [[../models/Substantiation-Corpus-Data-Model]]
- **Auth pattern that does NOT move with this exploration (stays on per-engagement Turso):** [[Install-Auth-Across-Applied-AI-Labs-Apps]]
- **Workspace adapter contract any new adapter must conform to:** [[Per-App-Workspace-Conventions]]
- **In-app-agent contract the agent-chat surface must honor:** [[Remote-Mount-Contract-for-In-App-Agent]]
- **Sibling business-model exploration where the PLG-vs-DD-grade fork has been latent:** [[Dididecks-AI-Business-Model]]
- **Live engagements that do NOT need any of this to ship:** `client-sites/calmstorm-decks`, `client-sites/chroma-decks`, `client-sites/reach-edu-hub`
- **Imminent engagement that also does NOT need any of this:** `client-sites/podium-education/` (to be scaffolded per the existing pattern)

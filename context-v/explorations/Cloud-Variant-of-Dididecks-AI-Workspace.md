---
title: "Cloud Variant of the Dididecks-AI Workspace — Recreating Local Privacy When the Filesystem Isn't Yours"
lede: "Podium Education has a deck they want redesigned, and the engagement raises a question we've been deferring: the main dididecks-ai spec mandates a native (Tauri) workspace because that's where the hard data-privacy constraint lives, but several plausible clients can't or won't install a desktop app to participate. This exploration walks what it would take to ship a cloud variant of the dididecks-ai workspace that *meets the same privacy bar local-fs gets for free* — without abandoning open-source contributors who use the local filesystem path. The destination isn't pinned: the goal is to name the privacy properties local-fs is silently providing, decompose them into things a cloud runtime would have to do explicitly, and surface the forks (per-client containers vs shared runtime with row-level isolation vs local-fs-with-cloud-publish vs browser-only ephemeral) so the right one can be picked rather than drifted into."
date_created: 2026-06-05
date_modified: 2026-06-05
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7 (1M context)
semantic_version: 0.0.0.1
status: Draft
tags:
  - Exploration
  - Dididecks-AI
  - Cloud-Workspace
  - Privacy-Model
  - Multi-Tenant
  - Threat-Model
  - Open-Source-Collaborators
  - Local-vs-Cloud
  - Podium-Education
  - Trigger-Engagement
  - Applied-AI-Labs
---

# Cloud Variant of the Dididecks-AI Workspace

## What this exploration is for

The dididecks-ai project currently has one workspace shape: the **native (Tauri-pattern) desktop app** inherited from memopop-ai. That commitment is not casual — [[Dididecks-AI-Slide-Decks-as-Code]] § "NS-1: A two-sided system" makes the native-not-browser stance load-bearing for two stated reasons:

1. **Attention.** Busy professionals lose the thread in browser tabs; a native app holds focus.
2. **Privacy.** "The native shell is where the hard data-privacy constraint lives — self-hosting / containerizing source data, near-zero leakage risk, runtime under the client's control."

Both are real. But several plausible client shapes can't or won't install a desktop app:

- The **client whose IT will not approve a third-party desktop binary** on partner machines on a six-day turnaround.
- The **multi-collaborator engagement** where five people at the firm need to touch the deck and only one of them has a laptop where install is even possible.
- The **outside-firm contributor** (designer, agency, ghost-writer) who is being paid by the client and needs to participate without being onboarded into a desktop install.
- The **podium-education trigger that produced this doc** — a deck they want redesigned, where the right-shaped surface to do that work in is in genuine question.

Each of those shapes is "a thing we will get asked to support." We have been deferring the question by pointing at the native app and shrugging. This exploration is for picking the answer up.

**This document is not** the spec for a cloud workspace, nor a pitch for abandoning native. It is the journey-mode doc that picks apart what local-fs privacy actually consists of, names what a cloud runtime would have to do to match each property, lays out the credible architectural shapes, and surfaces the open questions so the next step (likely a spec or two) is reactable rather than guessed-at.

When this exploration converges to enough alignment, the next move is a spec — likely `[[Cloud-Workspace-for-Dididecks.md]]` plus per-app prompts. If the **OSS-collaborator vs commercial-client adapter** sub-question grows past a section, it forks to its own exploration: `[[Storage-and-Identity-Adapters-for-Dididecks-Workspaces.md]]`. If the **podium-education engagement** produces enough engagement-specific decisions to be worth their own doc, those go to `dididecks-ai/client-sites/podium-education/context-v/` (the client-site that does not yet exist — see § Open questions).

## What is not being re-litigated

To save us from re-walking ground the main spec already covered:

- **NS-1's two-sided architecture remains.** Native workspace ↔ white-label publish surface. The cloud variant is **an additional workspace shape**, not a replacement for the native one. Some engagements ship native; some ship cloud; some ship both.
- **NS-1's "attention" argument for native still holds for the engagements where it holds.** Cloud is for engagements where attention is the lesser cost than install friction or collaboration friction.
- **The publish target stays unchanged.** Whatever the workspace shape, the deck still lands on the white-label per-client-site surface (calmstorm-decks, chroma-decks, reach-edu-hub, etc.). Auth at the publish layer is already solved by [[Install-Auth-Across-Applied-AI-Labs-Apps]].
- **OSS contribution to the dididecks platform itself** continues to work via local-fs and the existing pseudomonorepo pattern. The cloud workspace is a runtime variant *for client work*, not a replacement for the way the codebase is developed.

## The question this exploration asks

> If we offered a cloud-hosted workspace for dididecks-ai where a client could do deck-development work in a browser tab, **what would have to be true for that workspace to be as private as a local filesystem on the user's laptop?**

Phrased that way because "is the cloud secure" is the wrong question — security is a posture, not a state. **The right question** is which of the privacy properties that local-fs silently provides we are willing to give up, which we are not, and how each of the non-give-up properties is reconstructed when the runtime is no longer the user's own machine.

## What local-fs privacy is actually made of

Local-fs feels private not for one reason but for a stack of them, most of which are invisible until you try to replicate them somewhere else. Naming them explicitly:

| Property | What local-fs gives you for free | What it would take in cloud |
|---|---|---|
| **Storage isolation** | OS user permissions + disk encryption (FileVault, LUKS). Other processes on the same disk cannot read your files. | Per-workspace storage isolation: separate buckets/keys per workspace, server-side encryption with per-workspace KMS keys, no cross-workspace `LIST` capability. |
| **Compute isolation** | One process per app per user. No noisy-neighbor; no shared address space with other tenants. | Either single-tenant containers per workspace (real isolation, real cost) or shared multi-tenant with strict request-scoped permission checks (cheap, weaker isolation). |
| **Network isolation** | Files do not traverse a network on read/write. Confidentiality is "not transmitted." | Every read and write is a network call. Confidentiality is "transmitted but encrypted, authenticated, and authorized." TLS everywhere, no plaintext anywhere, per-request authz on every operation. |
| **Secret isolation** | `.env` on the user's machine. Plaintext at rest, but only readable by the user's OS account. | Secrets in a KMS, decrypted at runtime, never written to a workspace's storage, never visible in logs, scoped so workspace A's secrets cannot be read by code running for workspace B. |
| **Identity binding** | "You" is implicit — whoever is logged into the laptop has access. | "You" is explicit — a session, an org, a workspace ID, an authorization on every operation. The auth blueprint covers this; the workspace primitive adds per-workspace ACLs on top. |
| **Tamper-evidence** | Filesystem timestamps + git log. Imperfect but it's *yours* and not subject to silent rewrite by an upstream. | Append-only audit log written to a separate medium (separate DB, separate bucket, separate trust boundary) so the workspace itself cannot rewrite its own history. |
| **Data residency** | Wherever your laptop physically is. | Explicit. Some clients will require US-only or EU-only and will ask. |
| **Backup & recovery** | Time Machine / your responsibility / your fault if you lose it. | Our responsibility. Encrypted snapshots, per-workspace, restorable by client request, retained for a stated window. |
| **Auditability of the platform operator** | Nobody is auditing you. | Clients with mature security will ask "can a Lossless engineer see my files?" The answer cannot be "trust us." It has to be a policy backed by an architecture. |
| **Termination behavior** | You delete the folder and it's gone (modulo backups). | "Right to be forgotten" is a real workflow: per-workspace delete that walks every storage layer, plus a stated retention window for backup expiry. |

Each row is something local-fs gives you without thinking about it and the cloud variant has to give back with an explicit mechanism. Some are easy (TLS, KMS, per-workspace buckets are standard practice). Some are genuinely hard (the "can a Lossless engineer see my files" question depends on whether we can stomach a no-platform-operator-access architecture, which has real ops cost).

**The pattern across the table:** local-fs makes "default deny everyone except me" the cheap default. Cloud makes "default allow whoever has the credentials" the cheap default, and we have to construct the deny-by-default posture from primitives that don't ship with it.

## A working threat model

Without a threat model, "private" means whatever the reader wants it to mean. The shapes worth defending against:

1. **External attacker, no insider access.** Random internet, credential stuffing, exposed endpoints. **Defense:** standard web hygiene + the auth blueprint we already have.
2. **Authorized client user A trying to read client user B's workspace.** Same platform, different tenants. **Defense:** per-workspace authz on every operation, no cross-workspace LIST/READ APIs, no fuzzy ACLs.
3. **An authorized user inside one client firm exfiltrating data they have legitimate access to** (e.g., a partner downloads the whole deck before leaving the firm). **Defense:** out of scope for the workspace primitive. The deck content is in the workspace because they're allowed to see it; exfiltration controls are a client-firm IT problem, not a dididecks problem. We can offer audit trails so the firm knows; we cannot prevent.
4. **A Lossless engineer (us) inappropriately reading a client's workspace.** This is the one that distinguishes "trust me" architectures from "you can verify" architectures. **Defense:** ranges from "policy + audit log" (cheap, weak) to "per-workspace encryption keys held by the client, we genuinely cannot read it" (expensive, strong, complicates support). Most clients accept the middle option (we can read but logs prove when we did).
5. **A compromised Lossless engineer machine or compromised CI.** An attacker gets our supply chain. **Defense:** build artifact signing, env-var scoping, no production credentials on engineer laptops, separate prod vs dev infrastructure. This is hygienic regardless of the workspace shape.
6. **A compromised hosting provider (Vercel, AWS, Powabase) is reading clients' data.** Defense: encryption-at-rest with keys we hold, plus contractual + jurisdictional posture. We are unlikely to win against a determined nation-state attacker at the host level; we can win against opportunistic ones.

Most of the architectural decisions below are decisions about **threats 2, 4, and 6**. Threats 1, 3, 5 are addressed by general hygiene that applies regardless of which shape we pick.

## Four architectural shapes, ranked by privacy strength

### Shape A — Per-client containers, single-tenant per workspace

Each client (or each workspace, if a client has several) gets a dedicated container/VM running a private dididecks instance. Storage, compute, and secrets are per-container. Cross-tenant access is structurally impossible because the tenants don't share a runtime.

- **Privacy strength:** Highest. Threat 2 becomes "the attacker has to break out of a container," not "the attacker has to find a missing `WHERE tenant_id = ?` clause."
- **Cost:** Highest. Provisioning, monitoring, patching, scaling — per workspace.
- **Latency to first deck:** Highest. Spinning up a fresh instance for a new engagement is minutes-to-hours, not seconds.
- **Where this fits:** High-stakes engagements where the client's security team will read our SOC 2 / architecture diagrams before signing. Likely the right shape for the eventual paid tier.
- **Where this misfits:** Hackathon-grade engagements, OSS-shaped collaboration, anything where "spin up an instance" is itself the friction we were trying to avoid.

### Shape B — Shared runtime, row-level isolation in Postgres (Powabase variant)

One dididecks-cloud runtime, one Powabase project, with Postgres row-level security (RLS) enforcing `workspace_id = current_user_workspace()` on every table. Storage isolation via per-workspace S3-compatible buckets or Powabase Storage with per-workspace prefixes + signed URLs.

- **Privacy strength:** Medium. RLS is real if every table has it and every query goes through it; one missing policy is one cross-tenant read away from a breach.
- **Cost:** Lowest at scale. One runtime serves many workspaces.
- **Latency to first deck:** Lowest. Create a workspace row and you're done.
- **Where this fits:** Most engagements that are not security-graded. The default cloud shape for a "we ship cloud as the affordable tier" play.
- **Where this misfits:** Clients whose security team specifically asks "do other tenants share infrastructure with me." The honest answer is yes.
- **Open question:** Does Powabase's GoTrue + RLS combo make this materially easier than rolling our own RLS on Turso + libSQL? (Likely yes — RLS is a Postgres feature, not a libSQL one. This may be the deciding factor for the engine choice on the cloud workspace specifically, even though [[Install-Auth-Across-Applied-AI-Labs-Apps]] is engine-agnostic.)

### Shape C — Local-fs workspace + cloud publish-only

The workspace stays on the user's machine (native app, or even just a folder + CLI). The cloud is **only** the publish target. No deck-development work ever leaves the user's machine; only the rendered/published output is uploaded.

- **Privacy strength:** Native-equivalent for the development side; same as current publish-target auth for the publish side.
- **Cost:** Lowest infrastructure. We don't run a development runtime in the cloud.
- **Where this fits:** Clients who *will* install but want collaborators to *view* via the cloud surface. Many engagements probably fit here once you ask carefully.
- **Where this misfits:** Multi-collaborator development, the "five people at the firm need to touch this" case. This shape doesn't solve the actual driver.
- **Important honest read:** This is what we already have. Calling it out as a "shape" is partly to remind us that "do nothing and frame it as a feature" is a real choice with a real story.

### Shape D — Browser-only ephemeral workspace

A pure-browser workspace: deck state in IndexedDB / OPFS, no server-side storage during development, optional sync to git when the user opts in. The cloud serves the app code but not the deck data.

- **Privacy strength:** High in a different way — the data never leaves the user's browser during development. Closer to local-fs than Shape A or B.
- **Cost:** Low infrastructure; high engineering investment to get the editor + LLM-call orchestration working entirely browser-side.
- **Where this fits:** Single-author engagements where the user wants zero install and zero "is my data on your servers" anxiety.
- **Where this misfits:** Multi-collaborator (no shared state by definition), large corpora (browser storage is finite), and AI work that requires server-side orchestration (which is most of it).
- **Worth noting:** This is the shape farthest from current architecture. Tempting because it's the cleanest privacy story; risky because it requires re-implementing capabilities the native shell already does.

### A meta-observation on the four shapes

None of them is *the answer*; the right architecture is probably **two of them living side by side**:

- **Shape A or B for cloud-mode commercial engagements** (pick A for security-graded, B for the default tier — same dididecks runtime, different deployment posture per engagement).
- **Shape C continues to exist** for engagements that don't need cloud-mode development; the native app and the publish surface are unchanged.
- **Shape D is parked** unless a specific engagement asks for it. Useful to remember exists; expensive to build speculatively.

The dididecks codebase should support both A/B (cloud) and C (local) **behind the same workspace adapter interface**, so that the choice of runtime is configuration, not a fork. The [[Per-App-Workspace-Conventions]] blueprint already names the `WorkspaceAdapter` shape; this is one of the things it's for.

## The OSS-collaborator constraint and what it implies

The user's framing makes this explicit: **OSS contributors keep using local-fs.** That isn't just a nicety; it has architectural consequences.

If the cloud variant ships with a different data model than the local one — different field names, different IDs, different file-vs-row distinctions — then OSS contributions to the platform stop being interchangeable with cloud-mode usage. A bug fixed on local-fs has to be re-fixed for cloud, and vice versa.

The clean way out is the **same workspace contract, different storage adapters**:

- A `LocalFilesystemWorkspaceAdapter` for OSS contributors and native-mode users — reads/writes a `.dididecks/` directory in the deck repo, exactly the way the current pattern does.
- A `CloudWorkspaceAdapter` (Shape A) or a `MultiTenantWorkspaceAdapter` (Shape B) for cloud engagements — reads/writes via the cloud runtime's storage and auth layer.

Both implement the same `WorkspaceAdapter` interface defined in `@dididecks-ai/workspace` (per [[Per-App-Workspace-Conventions]]). The deck-editing code, the slide components, the AI-design-agent flows are oblivious to which adapter is mounted.

**This is the seam that lets us ship cloud without forking the codebase, and lets OSS contributors keep contributing without needing cloud access.**

The remaining question is whether the adapter interface is rich enough to express the privacy primitives the cloud adapter needs (per-workspace ACLs, tamper-evident audit log, signed URLs for asset reads) without leaking cloud-specific assumptions into the local adapter's API surface. That's the genuine design work and is a strong candidate for the `[[Storage-and-Identity-Adapters-for-Dididecks-Workspaces.md]]` sub-exploration.

## The Podium Education trigger, specifically

The engagement that produced this exploration is a Podium Education deck redesign. A few engagement-shaped questions that this broader exploration helps frame:

1. **Does Podium Education need cloud-mode workspace, or only cloud-mode publish?** If the deck redesign work happens between Lossless and a single Podium contact, Shape C (local workspace + cloud publish) probably suffices. If the redesign involves a Podium designer or marketing team participating in iteration, Shape B is the more honest answer.
2. **Does Podium have a security review process we're going to trip on?** Education-sector clients sometimes do, sometimes don't. Worth asking before committing to a shape.
3. **Is there a privacy reason Podium's deck couldn't live in the same Powabase project as our other client decks?** If Shape B is the path and clients share infrastructure, that needs to be a clean conversation with the client, not a thing we hope they don't ask about.
4. **What does this engagement look like as a `client-sites/podium-education/` submodule?** The other live engagements (calmstorm-decks, chroma-decks, reach-edu-hub) all live as submodules under `dididecks-ai/client-sites/`. Podium Education would follow that pattern for the *publish target* regardless of which workspace shape we pick.

The engagement is the trigger but is **not** the place to over-optimize. The pattern we land on should be reusable for the next education-sector engagement (Reach is already there; more will come), not bespoke for Podium.

## Open questions

Things this doc surfaces but does not answer:

- **Engine choice for the cloud workspace specifically.** [[Install-Auth-Across-Applied-AI-Labs-Apps]] is engine-agnostic. But Shape B (RLS-based multi-tenancy) is a Postgres feature, not a libSQL feature. Does that tip the cloud variant toward Powabase even though dididecks-ai's per-client-site auth defaults to Turso? Probably yes, but the question deserves a deliberate answer.
- **Do we need a "can a Lossless engineer see my files" architectural answer, or a policy answer?** The architectural answer (per-workspace client-held keys) is expensive and ops-heavy. The policy answer (audit logs + signed terms) is cheap and is what most SaaS does. Which posture do we want, and is the answer different for different client tiers?
- **What is the right tenancy boundary — per workspace, per deck, per client?** A client may have multiple decks across multiple engagements; they may want them in one workspace or several. Per-workspace is the cleanest default but has cost implications for Shape A.
- **How does the in-app-agent chat surface (see [[Remote-Mount-Contract-for-In-App-Agent]]) work in a cloud variant?** The chat is already designed for the workspace pattern; the question is whether the LLM calls happen client-side or server-side and what that does to the privacy story (e.g., if the LLM call goes from the cloud runtime to Anthropic/OpenAI, the client's data is now traversing a third boundary).
- **Does the cloud workspace also serve as the publish target, or are those separate runtimes?** Probably separate (different uptime requirements, different audience, different attack surface) — but worth being explicit.
- **What's the cheapest credible MVP for a Podium-shaped engagement** that lets us prove the cloud shape without committing to the full architecture? Likely Shape C + an honest conversation about adding shape B if/when needed.
- **Does memopop-ai have the same need?** Memopop's primary mode is also native (Tauri). The cloud-variant question is parallel. If the answer is the same architecturally, this should fork to a cross-cutting `@lossless/workspace-runtime` shape; if the answers diverge, the apps each implement their own.
- **Where does the podium-education submodule live in git?** New repo under `lossless-group/`? Submodule the way calmstorm/chroma/reach are? Public or private? These are engagement-specific decisions that should follow the existing pattern unless there's a reason to deviate.

## Provisional next steps

Not a commitment, just the natural progression if this exploration converges:

1. **A user discussion** — read this, react to it, pick a default architectural shape for the cloud variant (likely B) and confirm Shape C continues to be supported for engagements that fit it.
2. **A spec** — `[[Cloud-Workspace-for-Dididecks.md]]` in `dididecks-ai/context-v/specs/`, written after the architectural shape is picked. The spec pins the contract and the security posture; this exploration becomes the prior-art link.
3. **A sub-exploration** if the adapter question is rich enough — `[[Storage-and-Identity-Adapters-for-Dididecks-Workspaces.md]]` in `ai-labs/context-v/explorations/`, working out the interface that makes both local-fs and cloud adapters first-class.
4. **The Podium engagement scaffold** — `client-sites/podium-education/` as a submodule following the calmstorm/chroma/reach pattern, with its own `context-v/` recording engagement-specific decisions. Whether the workspace runs cloud or local is an engagement-level decision recorded in that submodule's specs.
5. **A reminder file** if any of the privacy properties in the table above turn out to be ones an agent keeps mis-remembering — e.g., "the cloud workspace does not have an admin UI that lists across tenants" as a reminder.

## Related

- **Source of the native-only stance:** [[Dididecks-AI-Slide-Decks-as-Code]] § "NS-1: A two-sided system"
- **The auth pattern that the publish target and the cloud workspace both inherit from:** [[Install-Auth-Across-Applied-AI-Labs-Apps]]
- **The parent confidential-access blueprint that the auth pattern is anchored on:** [[Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]]
- **The workspace pattern this cloud variant has to be compatible with:** [[Per-App-Workspace-Conventions]]
- **The in-app-agent contract that drives the workspace from a chat surface:** [[Remote-Mount-Contract-for-In-App-Agent]]
- **Live engagements that exercise the local-fs / native pattern today:** `dididecks-ai/client-sites/calmstorm-decks`, `chroma-decks`, `reach-edu-hub` (the closest precedent for an education-sector client; podium-education will likely follow its submodule pattern)
- **Sibling app with the same native-vs-cloud question latent:** `memopop-ai` (Tauri + Svelte 5 + FastAPI sidecar). If the cloud variant turns out to be a cross-cutting `@lossless/workspace-runtime`, both apps inherit from it.
- **External — Powabase as the candidate runtime for Shape B:** <https://docs.powabase.ai/concepts/platform-overview>

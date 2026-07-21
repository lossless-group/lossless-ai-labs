---
title: "Cloud Workspace for Dididecks"
lede: "A cloud-hosted, browser-accessible workspace variant for dididecks-ai engagements where installing the native desktop app is the wrong friction — without abandoning the local-filesystem path that open-source contributors and security-graded engagements still depend on. Same WorkspaceAdapter contract, additional storage and identity adapters, explicit reconstruction of the privacy properties that local-fs gives us for free."
date_authored_initial_draft: 2026-06-05
date_authored_current_draft: 2026-06-05
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-06-05
date_created: 2026-06-05
date_modified: 2026-06-05
at_semantic_version: 0.0.0.1
status: Draft
category: Specification
augmented_with: Claude Code on Claude Opus 4.7 (1M context)
authors:
  - Michael Staton
tags:
  - Cloud-Workspace
  - Dididecks-AI
  - Multi-Tenant
  - Privacy-Model
  - Threat-Model
  - Workspace-Adapter
  - Storage-Adapter
  - Identity-Adapter
  - Powabase
  - Postgres-RLS
  - Open-Source-Collaborators
  - Podium-Education
  - Trigger-Engagement
from: "dididecks-ai"
from_path: "context-v/specs/Cloud-Workspace-for-Dididecks.md"
---
# Cloud Workspace for Dididecks

> **Stub — 2026-06-05.** Frontmatter + question + north star + section placeholders only. The substantive thinking lives in the parent exploration [[Cloud-Variant-of-Dididecks-AI-Workspace]]. This spec exists so other agents and future-us can find it; structure will fill in once the architectural-shape and engine decisions are made in discussion with the user. Sections marked **[awaits discussion]** are gated on those decisions. Sections marked **[awaits prior art]** are gated on a sibling artifact this spec will inherit from once it exists. Do not promote past `Draft` until at least the four "Decisions this spec must pin" below are closed.

## The Question This Spec Will Answer

When a dididecks-ai engagement's workspace shape needs to be **cloud-hosted and browser-accessible** rather than native-Tauri-on-the-user's-laptop, what is the contract that workspace honors — for storage isolation, identity binding, network-traversal privacy, tamper-evidence, OSS-collaborator parity, and termination — such that the workspace meets the **same privacy bar that local-fs gives the native shell for free**, and such that the choice of runtime (cloud vs native) is **configuration, not a fork in the codebase**?

## Relationship to the parent spec

[[Dididecks-AI-Slide-Decks-as-Code]] § "NS-1: A two-sided system" mandates a native (Tauri) workspace, partly because "the native shell is where the hard data-privacy constraint lives — self-hosting / containerizing source data, near-zero leakage risk, runtime under the client's control."

**This spec does not contradict NS-1.** It adds a *second* workspace shape that meets the same privacy bar through different mechanisms, for engagements where install friction or multi-collaborator dynamics make the native shell the wrong fit. Both shapes ship; engagements pick one.

## The North Star

> **A lofty, likely-unreachable, directional aspiration:** a cloud workspace where the privacy properties a client can verify (separation, encryption, residency, audit, termination, operator access) are **at least as strong, and at least as legible, as the privacy properties of the native shell on their own laptop** — without the engagement having to install anything, and without us having to fork the codebase.

What that means in practice (to be sharpened through discussion):

- **Same WorkspaceAdapter contract** as the native shell. The deck-editing code, slide components, AI-design-agent flows, in-app-agent chat surface are oblivious to which adapter is mounted.
- **Per-workspace isolation that the client can reason about.** Not "we have a column called `workspace_id`"; an architecture where cross-tenant access is structurally constrained, not policed by application code alone.
- **Explicit reconstruction** of every privacy property in the parent exploration's ten-row table. Each row gets a named mechanism in this spec; no property is left to be "implicit because cloud."
- **OSS collaborators keep using local-fs.** The cloud adapter is *additive* to the local-fs adapter, not a replacement. Both adapters implement the same interface and the same bugs get fixed once.
- **Engagement-level configuration.** Which adapter runs for which engagement is a per-`client-sites/<name>/` decision recorded in that submodule's specs, not a global flag.

## Decisions this spec must pin (before promotion past Draft)

The exploration [[Cloud-Variant-of-Dididecks-AI-Workspace]] surfaced four decisions that this spec cannot move forward without. Listed here so the gate is visible:

### Decision 1 — Architectural shape: A, B, or both

Per the exploration's "Four architectural shapes" section:

- **Shape A** — per-client containers, single-tenant per workspace. Highest privacy, highest cost.
- **Shape B** — shared runtime, Postgres RLS-isolated, Powabase variant. Medium privacy, lowest cost at scale.
- **Both** — Shape B as the default cloud tier, Shape A as the upgrade for security-graded engagements.

**Recommendation pending discussion:** Both, with Shape B as default and Shape A as the security-graded upgrade path. Shape C (local-fs + cloud publish) is treated as a sibling, not part of this spec.

### Decision 2 — Database engine for the cloud workspace specifically

[[Install-Auth-Across-Applied-AI-Labs-Apps]] is engine-agnostic (Turso or Powabase). But **Shape B's row-level isolation is a Postgres feature**, not a libSQL feature. This likely tips the cloud workspace toward **Powabase** even though dididecks-ai's per-client-site auth defaults to Turso.

**Recommendation pending discussion:** Powabase for the cloud workspace runtime. Per-client-site publish targets stay on whichever engine each site already uses. Native-mode workspaces continue using whatever storage they always have.

### Decision 3 — Platform-operator access posture

The "can a Lossless engineer see my files" question. From the exploration's threat-model section:

- **Policy answer** — audit logs + signed terms; engineers can read but every read is logged.
- **Architectural answer** — per-workspace client-held keys; engineers structurally cannot read without the client's key release.

These have very different ops costs and very different sales conversations.

**Recommendation pending discussion:** Policy posture for the default cloud tier (Shape B); architectural posture as the upgrade for engagements that demand it (Shape A, with client-held KMS keys). Both postures need their cost — ops cost, support cost, sales-cycle cost — written into this spec before promotion.

### Decision 4 — Tenancy boundary

Per workspace? Per deck? Per client (firm)? Each choice has cost and UX implications.

**Recommendation pending discussion:** Per workspace as the default boundary. A client may have one workspace or several; decks live inside workspaces; workspaces never share data. Per-workspace billing follows naturally.

## Prior art pointers

This spec inherits from, and must remain consistent with:

- [[Cloud-Variant-of-Dididecks-AI-Workspace]] — parent exploration. The privacy-properties table, threat model, and architectural-shape comparison live there; do not duplicate.
- [[Dididecks-AI-Slide-Decks-as-Code]] § NS-1 — the two-sided architecture this spec extends.
- [[Per-App-Workspace-Conventions]] — the WorkspaceAdapter shape any new adapter must conform to.
- [[Install-Auth-Across-Applied-AI-Labs-Apps]] — the auth pattern the cloud workspace inherits from for session, identity, telemetry, and the dual-source `readEnv` discipline.
- [[Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]] (parent astro-knots blueprint) — the source-of-truth schema and middleware contract behind the auth pattern.
- [[Remote-Mount-Contract-for-In-App-Agent]] — how the in-app-agent chat surface drives the workspace; the cloud variant must honor the same contract.

If [[Storage-and-Identity-Adapters-for-Dididecks-Workspaces]] gets written as a sub-exploration (per the parent exploration's "Provisional next steps"), it becomes a sibling source-of-truth for the adapter interface and this spec inherits from it.

## Sections this spec will contain when complete

Each is a placeholder. Filled in after the four decisions above are closed.

### 1. Privacy-property contract  [awaits discussion]

A row-by-row mechanism for each of the ten properties in the parent exploration's table. For each property: the local-fs version, the cloud version, the threat it defends against, the verifiable evidence the client can ask for.

### 2. Storage adapter contract  [awaits prior art — likely [[Storage-and-Identity-Adapters-for-Dididecks-Workspaces]]]

The `CloudWorkspaceAdapter` (Shape B) and `SingleTenantWorkspaceAdapter` (Shape A) interfaces, both implementing the same `WorkspaceAdapter` shape from [[Per-App-Workspace-Conventions]]. What gets stored where (Postgres rows vs object storage vs KMS), what the signed-URL story is for asset reads, what the audit log format is and where it goes.

### 3. Identity and tenancy contract  [awaits discussion — Decision 4]

How a workspace is created, who can read it, who can write it, how role grants work, how identity-as-domain (per the ai-labs convention) maps onto workspace ACLs, how revocation works, how termination cascades.

### 4. Threat model and mitigations  [awaits discussion — Decisions 1, 3]

The six threat shapes from the parent exploration, each with the specific mechanism this spec mandates against it. The architectural-vs-policy posture choice (Decision 3) determines the shape of the "Lossless engineer access" row.

### 5. Network and runtime topology  [awaits discussion — Decisions 1, 2]

Per Decisions 1 and 2: how Shape A and Shape B are deployed (Vercel? AWS? per-workspace containers via Fly.io / Railway / a Kubernetes setup we own?), where Powabase sits in the topology, how secrets are scoped per workspace, how the in-app-agent's LLM calls route (client-side via signed Anthropic/OpenAI calls? server-side via our own proxy?) and what that does to the privacy story.

### 6. Local-fs adapter parity guarantees  [will inherit from adapter contract]

The OSS-collaborator promise. What the local-fs adapter does that the cloud adapter must also do, and vice versa. The seams where divergence is acceptable (e.g., cloud-only features like multi-collaborator presence) and the seams where divergence breaks the parity guarantee.

### 7. Engagement-onboarding flow

How a new engagement picks cloud vs native at install time. Where the per-engagement decision is recorded (`client-sites/<name>/context-v/specs/`). What the migration path is if an engagement starts native and needs to move to cloud (or vice versa) — and what gets lost in either direction.

### 8. Backup, retention, and termination

Snapshot cadence per workspace. Retention windows. Restore SLA. Right-to-be-forgotten workflow that walks every storage layer (DB rows, object storage, KMS keys, audit log) and what gets retained vs deleted in each. Compliance posture (US-only / EU-only data residency if any client asks).

### 9. Trigger engagement: Podium Education

A concrete engagement-level read of this spec. Per the parent exploration: does Podium need cloud-mode *workspace* or only cloud-mode *publish*? Does Podium have a security review process? Does the engagement scaffold as `client-sites/podium-education/` follow the calmstorm/chroma/reach submodule pattern? This section is the engagement-specific application of the rest of the spec, not a duplicate.

### 10. Non-goals

Explicit list of things the cloud workspace does **not** try to be. Likely candidates: replacement for the native shell, defense against authorized-user exfiltration (a client-firm IT problem), defense against nation-state attackers at the host provider level, support for offline use after disconnection, support for SOC 2 / ISO certification on day one.

### 11. Open questions

The exploration's open-questions list, narrowed by which questions the spec closes and which it explicitly punts.

### 12. Out-of-scope, deferred to siblings

Anything that fits the workspace conversation but belongs in a sibling document. Likely: the cloud variant of [[Remote-Mount-Contract-for-In-App-Agent]] specifically; cross-app workspace-runtime shape if memopop-ai also adopts cloud (would fork to `@lossless/workspace-runtime` exploration).

## Status discipline note

This spec sits in `dididecks-ai/context-v/specs/` because the immediate consumer is the dididecks-ai workspace. **If the architectural pattern turns out to be cross-cutting** — i.e., memopop-ai's eventual cloud variant is structurally the same — the canonical version moves to `ai-labs/context-v/specs/` and this file becomes a dididecks-specific override or an inheritance pointer. That migration is a deliberate move, not a side-effect.

## Sign-off gate

Per the context-vigilance "developing a spec" rhythm, this spec does not transition to `In-Review` until:

1. The four decisions above (1: shape, 2: engine, 3: platform-operator access, 4: tenancy boundary) have been closed with the user.
2. Sections 1 (privacy-property contract) and 4 (threat model and mitigations) are filled in based on those decisions.
3. The [[Storage-and-Identity-Adapters-for-Dididecks-Workspaces]] sub-exploration has either been written (and this spec inherits from it) or has been deliberately punted to be folded directly into Section 2 of this spec.

Until those three gates close, treat this spec as **a scaffolding doc that holds the place for the real work**, not as a contract anyone should implement against.

## Related

- **Parent exploration (source of the substantive thinking):** [[Cloud-Variant-of-Dididecks-AI-Workspace]]
- **Parent spec (the two-sided architecture this extends):** [[Dididecks-AI-Slide-Decks-as-Code]]
- **Workspace conventions any adapter must conform to:** [[Per-App-Workspace-Conventions]]
- **Auth inheritance:** [[Install-Auth-Across-Applied-AI-Labs-Apps]] and the parent [[Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]]
- **Chat-surface contract the cloud variant must honor:** [[Remote-Mount-Contract-for-In-App-Agent]]
- **Likely sibling sub-exploration:** [[Storage-and-Identity-Adapters-for-Dididecks-Workspaces]] (does not yet exist; see parent exploration's "Provisional next steps")
- **Live engagements that exercise the native / local-fs path today:** `client-sites/calmstorm-decks`, `client-sites/chroma-decks`, `client-sites/reach-edu-hub`
- **Trigger engagement:** Podium Education — `client-sites/podium-education/` (submodule does not yet exist; scaffold per calmstorm/chroma/reach pattern)

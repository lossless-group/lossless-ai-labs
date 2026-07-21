---
title: "Corpora-Builder System Design"
lede: "Corpus building has been rebuilt as a sub-feature three times across ai-labs. This exploration surveys what those iterations actually taught us, and sketches the system that deserves its own repo."
date_created: 2026-07-20
date_modified: 2026-07-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
semantic_version: 0.0.1.0
tags:
  - Exploration
  - Corpus-Building
  - Corpora
  - Context-Vigilance
  - RAG
status: Open
from: "corpora-builder"
from_path: "context-v/explorations/Corpora-Builder-System-Design.md"
---
# Corpora-Builder System Design

## The question

What is the right shape for a standalone system whose whole job is **building corpora** — capturing, triaging, fetching, filing, and quality-checking the source material that grounds everything downstream (decks, memos, enriched record sets, agent answers, RAG collections)?

More precisely: which of the patterns proven inside [[augment-it]] and the context-vigilance practice graduate into `corpora-builder` as first-class product, which stay behind as app-specific plumbing, and where does this system sit relative to its siblings (augment-it, dididecks-ai, memopop-ai) — given the tree's hard rule that **patterns travel knots-style (blueprint + copy-from sample code), never as a shared package**?

## Why we don't already know

Corpus building inside augment-it exists in **two overlapping generations** that were never reconciled:

- **Generation A — the funder/record-set + pack model** ([[Funder-Content-Corpus-Workflow]]): the aboutness axis. Content files under `corpus/funders/<funder-slug>/`, where the slug is the funder's identity, not the publisher's. Records arrive by CSV upload; packs fire per-record; the operator curates what enters.
- **Generation B — the domain-first curator model** (`corpus.ts` domain functions, the shell's "Build Corpora" flow, the `inbox-curation` agent skill): a generic `(type, slug)` domain — `strategy | thesis | topic | category | market-segment` — each a folder with an `index.md` definition and a `sources/` subdirectory. reach-edu calls domains "strategies", humain-vc calls them "theses"; the backend is fully generic and only the UI pins the noun.

The live reach-edu corpus on disk runs a **three-bucket reconciliation** of both (`clients/reach-edu/corpus/AGENTS.md`), which works but is a truce, not a design. Meanwhile several threads the corpus work depends on all "came due at once" and remain open ([[Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge]]): where the corpus substrate lives off-local (R2-native vs host-volume + rclone vs JuiceFS), bucket-per-client isolation, editor/viewer auth, and deployment. The triage layer is largely unbuilt — didi's inbox-triage capability "doesn't exist yet" — and the SurrealDB↔filesystem convergence gap means corpus files carry no `org_slug` link. A fresh repo is the chance to design from what we now know rather than patch the truce.

## What the prior art settled (carry these forward as givens)

These decisions were paid for with real failures and should be treated as constraints, not options:

1. **Files are the truth.** Markdown + YAML frontmatter is the source of truth; databases (SurrealDB, Chroma) index it. Triage is a `git mv` plus a frontmatter edit — the data model stays boring and recoverable by hand ([[Corpus-Inbox-Capture-and-Triage]]).
2. **Verbatim at ingest; never summarize on the way in.** Extraction at ingest is where corruption is born. Derived layers point back at spans ([[Corpus-Grounded-Generation-of-Decks-and-Memos]]).
3. **Two-tier fetch (gated enrichment).** `source.add` writes metadata-only (title + excerpt); `source.fetch` pulls the full body + binary sibling later, explicitly. Discovery stays cheap; grounding cost is spent only on survivors. This generalizes augment-it's origin lesson: gate every enrichment step — bulk AI enrichment going haywire is what created the product.
4. **The source-curation gate is per-object and pre-generation.** A human prune/rank/provenance-stamp step sits between retrieval and generation. Triage per-URL post-generation produced a 99.7% reject rate in OfficialPulse; the unit of work was the bug ([[Source-Curation-Gate]]).
5. **Aboutness over publisher.** The filing slug answers "who/what is this *about*", not "who published it". Tags (`strategy_slugs`, Train-Case-free but dash-enforced, casing preserved) carry many-to-many membership; a strategy is *reconstructed by query*, never by nesting.
6. **Extracts live in the body as LFM directives, never mirrored into YAML.** Quote text breaks YAML; the `remark-directive` parse *is* the structured extraction, so there is no mirror to drift.
7. **The inbox is capture-first staging, not a corpus.** Immutable `captured_*` fields, null-until-triage `triaged_*` fields, and a second-pass requirement. It is also the *richest* bucket, not a cleanup queue — the reach-edu quality scan treated 140 inbox files as first-class inventory ([[First-Pass-Corpus-Quality-Scan-for-reach-edu]]).
8. **Binaries ride alongside.** PDFs are downloaded as siblings (sha256, size, content-type in a `binary_asset` block; git-lfs; Ghostscript compression over 3MB) because Jina text loses citable page/figure fidelity and remote URLs rot ([[Download-PDFs-into-Corpus-Inbox]]).
9. **Consumption is a separate pipeline.** Chroma ingest runs with content-hash change detection, stable IDs, per-kind collections, and set-diff GC ([[Track-and-Ingest-Lossless-Content-into-Chroma]]). The corpus is INPUT; decks and memos are produced elsewhere.
10. **Client data is the privacy boundary.** Client-private content stays in per-client repos/scopes; only patterns, specs, and skills get lifted into public context-v.

## The open design tensions

### Tension 1 — What *is* corpora-builder: app, harness, or discipline?

**Option A — A standalone app** (fourth sibling): its own UI (inbox, curation gate, quality dashboard), its own storage, its own didi surface. Pro: the corpus finally gets a front door that isn't borrowed from a CSV-enrichment product. Con: immediately re-raises the auth/deployment/substrate threads, and risks becoming augment-it-minus-records.

**Option B — A reference implementation + blueprint kit**: the canonical `corpus.ts`-descended domain model, the `source.*` verb vocabulary, the frontmatter schemas, the quality-scan scripts — shipped as copy-from sample code the siblings adopt knots-style. Pro: honors the no-shared-dependency rule perfectly; cheapest path to unifying Generations A and B. Con: no operator surface of its own; the pattern only lives where someone copies it.

**Option C — A corpus *service* with thin surfaces** (the augment-it workspace stance applied here): a thin orchestrator over domain services that own their data, with chat-verb and microfrontend surfaces mounted *into* the sibling apps rather than a monolithic app of its own. Pro: matches the deliberately-small-remotes thesis; didi's `source.*` verbs already assume this shape. Con: "service shared by three apps" flirts with the shared-dependency prohibition and needs a careful contract (verbs + file formats, not imported code).

### Tension 2 — Reconciling Generation A and Generation B

The domain-first model (B) is the more general substrate — a funder is arguably just a domain of type `funder` (or the aboutness tag on sources within other domains). But record-set lineage (`record_uuid` surviving promotions) is load-bearing for augment-it and shouldn't be forced into the generic model. Leaning: corpora-builder's canonical model is **domain-first with funders as a domain type**, and record-set lineage remains an augment-it-side concern that *points into* the corpus rather than shaping it.

### Tension 3 — Where the corpus lives

Local filesystem + per-client git worked for two clients; it does not survive cloud deployment, multi-operator editing, or didi-in-the-browser. The unresolved substrate question (R2-native vs volume + rclone vs JuiceFS) belongs to *this* repo now. Whatever is chosen must preserve constraint 1 (files-as-truth, hand-recoverable) — which argues against anything that makes the object store the primary and the files a cache.

### Tension 4 — How much of context-vigilance is the same system?

Corpus building **is** context-vigilance applied to client source material: same frontmatter-as-truth, same wikilinks, same Chroma read-side. The context-vigilance-kit ingest scripts and the client-corpus ingest are near-twins. Should corpora-builder subsume the ingest side of the kit, or stay a sibling that shares conventions? Leaning: share conventions and the collection-naming scheme; do not merge repos — the kit serves the Lossless tree, corpora-builder serves client corpora, and the privacy boundaries differ.

## Operator wishlist (2026-07-20) — requirements from the field

Direct input from the operator (Michael), captured before any spec hardens. These are *forces*, not yet decisions — but several of them re-weight the tensions above, so they belong in this doc rather than a side note.

### W1 — Remote corpora are the source of truth; local feels like Dropbox

In multi-user workspaces, the **remote** copy of a corpus is authoritative. Version control underneath is git or [Jujutsu](https://github.com/jj-vcs/jj) — but the command layer is hidden. The people who need corpora as RAG inputs to their own work are mostly **non-technical and terminal-avoidant**: they will not install git, and they will not open a shell. So:

- The local install is **one artifact** — a containerized/VM setup that brings every tool with it. No "first install git, then…" onboarding.
- In-app local additions and edits get **automated sync** (Dropbox/Karakeep-style continuous) *plus* explicit **version-control-save moments** ("checkpoint this") that map to commits underneath without ever saying the word "commit".
- The command layer is reachable two ways for those who want it: a simple UI, and **agent chat** (didi issuing `source.*`-style verbs).

This *flips the polarity of Tension 3*: the earlier lean treated local files as primary and warned against the object store becoming primary. The reconciliation: **files-as-truth survives, but the truth lives in the remote**; every local workspace is a syncing, versioned replica. Constraint 1 (hand-recoverable markdown + frontmatter) still holds — it just holds *on the server too*.

### W2 — Storage substrate: blob is normal, fancy filesystems are on the table

Plain blob storage (R2/S3) is the default assumption, but there may be reasons to run a real filesystem with snapshots/dedup underneath — BTRFS, [JuiceFS](https://juicefs.com/) (POSIX over object storage), or even git-native content engines like [mycorrhiza](https://github.com/bouncepaw/mycorrhiza). If we go that way, **containerized deployment stops being optional** — the substrate has to ship with the app (which dovetails with W1's one-artifact install). This upgrades Tension 3 from "pick a substrate" to "pick a substrate *and* own its packaging".

### W3 — Frictionless capture of any corpus object

A clean UI to add anything: usually a link, but also **drag-and-drop files**. When the object arrives as a file (PDF, report, publication) with no URL, the system should **reverse-search from title/author to find the canonical link on the web** and assure the necessary metadata before the object settles into the corpus. This extends the two-tier fetch (constraint 3) with a *third entry mode*: file-first, link-recovered — the inverse of `source.add`'s link-first, body-later. The inbox (constraint 7) is the natural landing zone for objects whose canonical link or metadata is still unresolved.

### W4 — SurrealDB, universal IDs, and the tenancy spectrum

SurrealDB's role: smart indexing, universal IDs, metadata — the queryable layer over files-as-truth. But tenancy is a spectrum, not a policy: current collaborators **don't care** that their work feeds a multi-client Surreal instance; future users may want more **control or privacy** as a condition of using the product at all. The design needs to name its tenancy tiers explicitly (shared multi-client instance → isolated namespace → bring-your-own instance) rather than inherit whatever the first deployment happened to be. This composes with constraint 10 (client data as the privacy boundary) and closes the `org_slug` convergence gap flagged in the pain points.

### W5 — Dual surfaces: Tauri-native primary, web secondary

Assume **concurrent development of a Tauri native app and a web UI**. The Tauri app is the primary workspace and is also the delivery vehicle for W1's local VM/container. The web UI carries the Dropbox/Google-Drive-style browse/share experience. This substantially settles Tension 1: corpora-builder *is* an app (Option A's endpoint), but reached by the Option B→C road — model and verbs first, surfaces second.

### W6 — Indexing, cross-references, and citations to Lossless conventions

Corpora must be indexed for easy lookup, cross-reference, and **citation embedding per Lossless conventions** (wikilinks, hex-code citations — there is a whole Obsidian vault that manages/imposes this today; that discipline should become an **agent skill** the system carries). The target use cases are explicitly dual:

1. **RAG/KAG operations** that limit agent work to tightly controlled sources (the corpus as a hard boundary, not a suggestion), and
2. **professional consulting output** — decks and memos with proper citations. Not necessarily MLA/Chicago, but formal styles should be easy to emit when a client wants them.

One corpus, two consumers; the citation metadata captured at ingest (W3's canonical-link assurance) is what makes both possible.

### W7 — didi.sh is the identity and workspace layer

Auth and workspace management ride on [[Id-Didi-Sh-Identity-Service|id-didi-sh]] — one account across memos, decks, augment-it, and now corpora. Workspaces, API keys, and related primitives **may need to be built into didi.sh in parallel** before corpora-builder can work properly. That makes id-didi-sh a build-order dependency, not just an integration: the corpora-builder spec should enumerate exactly which identity primitives it needs (workspace membership, roles like editor/viewer, per-workspace API keys for RAG consumers) so the didi.sh side can be specced concurrently.

### Method notes (forked out)

Two further wishlist items are about *how we build*, not *what*: front-loading design so a frontier model (Fable-class, Kimi-class) can build the whole system in a spec-driven TDD loop, and imposing real design-system discipline from day one (the augment-it/dididecks/memopop UIs have diverged). Those are explored in the sibling doc [[Design-Front-Loading-and-the-Fable-Build-Loop]] — kept separate so this doc stays about the system.

## Tentative direction

The operator wishlist settles the destination: corpora-builder **is an app** — Tauri-native primary workspace bundling the local container, web UI in the Drive/Dropbox style, remote corpora as source of truth, didi.sh as the identity/workspace layer. But the *road* is still model-first (the old Option B→C sequencing): the domain model, frontmatter schemas, `source.*` verb vocabulary, and lifecycle get specced and proven as blueprint + reference code before surfaces multiply. That sequencing mirrors how augment-it itself was built (workspace before chat), and it is also what the front-loaded build-loop method ([[Design-Front-Loading-and-the-Fable-Build-Loop]]) requires: the loop can only run against specs that already exist.

First concrete artifacts to produce from this exploration:

1. A **spec** for the unified corpus domain model (Generation A ⊎ B reconciliation, frontmatter schemas as the contract).
2. A **blueprint** for the corpus lifecycle (capture → triage → fetch → file → quality-scan → ingest), lifted from the prior art but app-agnostic — now including W3's file-first/link-recovered entry mode.
3. The **quality-scan script** generalized from the reach-edu first-pass scan into a re-runnable, corpus-agnostic tool — the first runnable thing this repo ships.
4. A **sync-and-checkpoint UX spec** for W1: how automated sync and "save a version" map onto git/jj underneath without exposing either, and what the Tauri app's one-artifact install actually contains.
5. A **tenancy-tiers section** in the domain-model spec (W4): shared instance → isolated namespace → bring-your-own, with `org_slug`/workspace IDs threaded from didi.sh through SurrealDB to file frontmatter.
6. A **didi.sh primitives list** (W7): the exact workspace/role/API-key capabilities corpora-builder needs, handed to [[Id-Didi-Sh-Identity-Service]] so the two can be built in parallel.

## Outcome

Open. Ends when the domain-model spec is written and signed off.

## Related

- [[Funder-Content-Corpus-Workflow]] — augment-it spec, Generation A
- [[Corpus-Inbox-Capture-and-Triage]] — augment-it spec, capture-first inbox
- [[Download-PDFs-into-Corpus-Inbox]] — binary-sibling discipline
- [[First-Pass-Corpus-Quality-Scan-for-reach-edu]] — the quality-scan prior art
- [[Source-Curation-Gate]] — ai-labs blueprint, the per-object human gate
- [[Corpus-Grounded-Generation-of-Decks-and-Memos]] — the consumption side
- [[Two-Clients-One-Flow-Corpora-Auth-and-Deployment-Converge]] — the open substrate/auth/deployment threads
- [[Track-and-Ingest-Lossless-Content-into-Chroma]] — the Chroma read-side pipeline
- [[Design-Front-Loading-and-the-Fable-Build-Loop]] — sibling exploration: the build method (spec-driven loop, design-system discipline)
- [[Id-Didi-Sh-Identity-Service]] — the identity/workspace layer this system rides on (W7)

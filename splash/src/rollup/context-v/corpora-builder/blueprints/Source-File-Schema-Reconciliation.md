---
title: "Source-File Schema Reconciliation — One Way to Name, Fetch, and File a Source"
lede: "Three apps built the same source-file model with different names. This fixes the canonical field set — adopted copy-from, not as a package."
date_authored_initial_draft: 2026-08-08
date_authored_current_draft: 2026-08-08
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-08-08
at_semantic_version: 0.0.0.1
status: Draft
publish: false
category: Blueprint
augmented_with: Claude Code on Claude Opus 5 (1M context)
authors:
  - Michael Staton
tags:
  - Blueprint
  - Corpora-Builder
  - Source-Curation
  - Frontmatter-Schema
  - Convergence
  - Augment-It
  - MemoPop
site_uuid: b59ddbd8-17b3-4b18-8a45-003505c69603
hex_code: 8d61qg
from: "corpora-builder"
from_path: "context-v/blueprints/Source-File-Schema-Reconciliation.md"
---
# Source-File Schema Reconciliation

> The first artifact of [[Corpora-Builder-System-Design]]'s **Tension 1, Option B** — *"the canonical `corpus.ts`-descended domain model, the `source.*` verb vocabulary, the frontmatter schemas … shipped as copy-from sample code the siblings adopt knots-style."* Written now, ahead of corpora-builder having surfaces of its own, because a third app just shipped a source-capture surface and the window to converge is closing.

## Why now

memopop shipped a source-approval surface on 2026-08-06 that fetches page content via Jina, shows it, and **throws it away**. Fixing that means writing a source file — and the moment it writes one, memopop becomes the third generation of a schema that already exists twice. Either the three converge now or we get the same three-bucket truce the reach-edu corpus is already living with (`clients/reach-edu/corpus/AGENTS.md`).

## What already agrees (the good news)

Nobody has to be talked out of anything. The three implementations converged independently because they descend from the same constraints:

| Concept | augment-it `content-ingest/src/corpus.ts` | memopop `agent-skills/source-with-extracts-md` | strategy-curator `src/types.ts` |
|---|---|---|---|
| Filename | `<YYYY-MM-DD>_<title-slug>.md` | `<date>_<query-slug>/` + `<title-slug>.md` | `source_slug` (the on-disk stem) |
| When we pulled it | `fetched_at` | `fetched_at` | — |
| When it was published | `published_at` *(lifted out of Jina preamble to top level)* | `published_at` | `published_date` |
| Dedup identity | — | `normalized_url` | `normalized_url` |
| Lifecycle | — | `status: candidate → promoted → archived\|rejected` + `content_pulled` | `status: metadata-only \| fetched` + `content_pulled` |
| Provenance | `pack_id`, `captured_from` | `origin`, `search_query`, `engine` | — |
| Miscellany | `extra_metadata: {}` | *(flat fields)* | — |
| Binary sibling | `binary_asset{}` + `download_status` *(recorded even on failure)* | `asset_path` | `binary_filename`, `binary_bytes` |
| Collision | `_<suffix>` on the stem | — | — |

Four things are effectively settled and should be treated as givens:

1. **Files are the truth.** Markdown + YAML frontmatter; SurrealDB and Chroma index it. Triage is a `git mv` plus a frontmatter edit. (Constraint 1 of the system design.)
2. **`fetched_at` ≠ `published_at`.** When we pulled it is not when it was written. Both matter; conflating them makes staleness unanswerable.
3. **Two-tier fetch.** Cheap metadata + short excerpt on capture; full body or PDF only on promote. Never pay for content on a candidate that may be rejected.
4. **Aboutness over publisher.** The filing slug answers *what is this about*, not *who published it*. Membership is by tag and reconstructed by query, never by nesting. (Constraint 5.)

## What disagrees (the actual work)

Three real divergences, not stylistic:

**D1 — Lifecycle vocabulary.** `metadata-only | fetched` (strategy-curator) vs `candidate | promoted | archived | rejected` + `content_pulled` (memopop). These encode different things: the first is *how much have we pulled*, the second is *where is this in the analyst's decision*. **Both are needed and they are orthogonal.** Collapsing them is the mistake.

**D2 — Flat fields vs `extra_metadata`.** augment-it pushes unknown Jina/OG keys into `extra_metadata: {}` and lifts `published_at` out of it. memopop keeps everything flat. Flat reads better by hand; the catch-all survives upstream metadata changing shape.

**D3 — Provenance vocabulary.** `pack_id` / `captured_from` (a pack fired) vs `origin` / `search_query` / `engine` (a search surfaced it). Same question — *how did this get here* — different capture mechanics.

## The canonical set

Required is deliberately tiny. Everything else degrades gracefully; a file with only `url` is valid.

```yaml
---
# --- identity (url required; normalized_url is the dedup key) -------------
url: https://www.ocean-energy-systems.org/news/iea-oes-releases-annual-report/
normalized_url: ocean-energy-systems.org/news/iea-oes-releases-annual-report
title: "IEA-OES Annual Report (release announcement)"      # as FETCHED, not as claimed
publisher: "IEA Ocean Energy Systems (OES)"
authors: []

# --- time (never conflate these two) --------------------------------------
fetched_at: 2026-06-27T14:31:00Z      # when WE pulled it
published_at: 2025-03-01              # when the source was authored

# --- lifecycle (D1: two orthogonal axes, both kept) -----------------------
status: candidate                     # candidate | promoted | archived | rejected
content_pulled: false                 # false until the full body/PDF lands on promote
excerpt: "The IEA-OES annual report finds installed capacity reached…"   # ~200 chars
description: "Annual stocktake of global ocean-energy capacity."         # OG/Jina blurb

# --- provenance (D3: unified) ---------------------------------------------
origin: searxng                       # searxng | perplexity | analyst-paste | pack | inbox
origin_detail:                        # the mechanics, shape varies by origin
  search_query: "ocean energy market size"
  engine: google
  # pack_id: official-blog-pack       # when origin == pack

# --- membership (aboutness, many-to-many, never nesting) ------------------
domains: [ocean-energy]               # (type, slug) domain refs — strategy/thesis/topic
sections: [opportunity, opening]      # deliverable sections this serves
tags: []
rank: 1                               # 1 = primary
sensitivity: citable_externally       # | internal_only

# --- judgment -------------------------------------------------------------
verdict: ""                           # analyst: approved | rejected. NEVER a machine result.
verdict_reason: ""
machine_verdict: "HTTP 200 (body verified)"   # validator reachability — separate on purpose
confidence:
note: ""

# --- binary companion (recorded even when the download failed) ------------
binary_asset:
  filename: iea-oes-annual-report-2025.pdf
  bytes: 4210332
  sha256: …
  downloaded_at: 2026-06-27T14:32:10Z
  download_status: ok                 # ok | size_capped | http_error | unsupported_type | fetch_failed

# --- catch-all (D2: flat above, miscellany below) -------------------------
extra_metadata: {}
---
```

### Three rulings worth stating plainly

**Keep both lifecycle axes (D1).** `status` is the analyst's decision; `content_pulled` is how much we have on disk. A source can be `promoted` with `content_pulled: false` (promote queued, fetch pending) or `candidate` with content already cached. One field cannot express that.

**Flat for the known set, `extra_metadata` for the rest (D2).** Every field above is flat and hand-editable. Unrecognized Jina/OG keys land in `extra_metadata` rather than polluting the top level. `published_at` is lifted out of it because sort/filter UIs read it as first-class — augment-it already does exactly this in `liftPublishedAt`.

**`verdict` is a person; `machine_verdict` is a machine.** memopop learned this the expensive way on 2026-08-06: ImmuneCo carried 34 verdicts reading `HTTP 200 (body verified)`, which are *reachability* results. Counting them as approvals is the precise category error the whole membership-gate effort exists to correct — **reachability is not approval**. Two fields, permanently.

## Filename and layout

```
<YYYY-MM-DD>_<slug>.md          # slug from title; falls back to the URL when untitled
<YYYY-MM-DD>_<slug>_<n>.md      # collision suffix
<YYYY-MM-DD>_<slug>.<ext>       # binary sibling, named to match its markdown
```

Where the file *sits* stays app-specific and that is fine — augment-it files under `clients/<client>/corpus/<domain-slug>/`, memopop under a per-search folder with a `_search.md` manifest. The **filename grammar** and the **frontmatter** are the contract; the directory tree is each app's business, because it encodes that app's tenancy model.

## Extracts stay out of YAML

Quotes, stats, and claims are punctuation-heavy strings full of `: " $ % [ ] |` — every character that breaks YAML. They live in the **body** as Lossless Flavored Markdown container directives under `# Extracts`, sectioned `## Quotes` / `## Claims` / `## Stats` / `## References`. The parse *is* the extraction, so there is no second structured copy to keep in sync. Carried forward verbatim from `source-with-extracts-md`; adopters must not re-invent this as YAML.

## Adoption rule

**Copy-from, knots-style. Not a package.** `corpora-builder/README.md` states it: *"corpora-builder does not become a shared dependency of the other ai-labs apps — patterns travel knots-style (blueprints + copy-from sample code), not as an npm package the siblings import."* A shared library across a Python orchestrator, a Node service, and a Tauri app would be three bindings and a release cadence nobody wants.

This blueprint is the contract. Each app owns its writer:

| App | Writer | Adoption |
|---|---|---|
| augment-it | `services/content-ingest/src/corpus.ts` | rename toward canonical; keep `extra_metadata` as-is |
| memopop | *(unwritten — the gap)* | write `src/curation/source_file.py` to this schema |
| corpora-builder | reference implementation | the copy-from source of record |

Divergence is allowed when an app genuinely needs it — but it gets **documented here**, not invented silently. That is the difference between a convention and a truce.

## Open questions

1. **Who owns `normalized_url` normalization?** memopop already has `canonical_url()` in `src/curation/best_sources.py` (lowercase host, drop `www.`, strip tracking params, collapse http/https). Is that the canonical algorithm, or does the JS side have its own? They must not disagree, or dedup silently fails across apps.
2. **Does `domains` belong here yet?** Generation A ⊎ B reconciliation is unresolved (Tension 2). The field is reserved above; the *semantics* wait on the domain-model spec.
3. **`source_uuid`.** strategy-curator carries one from a shared sources registry; memopop has no registry. Adding it to files before the registry exists would write a field nothing can resolve. Deferred until W4's tenancy tiers land.
4. **Does the excerpt length stay 200 chars?** Cheap enough to raise; the number is arbitrary and untested against how analysts actually triage.

## References

- [[Corpora-Builder-System-Design]] — Tension 1 (Option B), the settled constraints, the operator wishlist.
- `augment-it/services/content-ingest/src/corpus.ts` — `buildFrontmatter`, `addToCorpus`, `addToInbox`, `liftPublishedAt`.
- `augment-it/apps/strategy-curator/src/types.ts` — the `Source` view model.
- `augment-it/context-v/specs/Corpus-Inbox-Capture-and-Triage.md` — the inbox frontmatter schema.
- `memopop-ai/agent-skills/source-with-extracts-md/SKILL.md` — the per-source file shape and the LFM extract directives.
- `memopop-ai/agent-skills/sources-md-curation` — the per-deal `Sources.md` **list** (distinct from the per-source file).
- `memopop-ai/context-v/plans/Constraining-Memo-Writing-to-an-Approved-Source-Set.md` — where the verdict / machine_verdict split was learned.

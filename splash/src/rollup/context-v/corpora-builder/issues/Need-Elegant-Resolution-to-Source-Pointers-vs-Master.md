---
title: "Need an Elegant Resolution to Source Pointers vs. Master"
lede: "One source, many folders, is the design. But for 75 sources the body sits in an untriaged inbox file the scoped read never reaches."
publish: true
date_created: 2026-08-23
date_modified: 2026-08-23
date_authored_initial_draft: 2026-08-23
date_authored_current_draft: 2026-08-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.4.0
status: Open — Stopgap Proposed, Not Built
site_uuid: 666ec300-f412-4ed9-893a-099cc67e6938
hex_code: xu3mtx
tags:
  - Issue
  - Corpora-Builder
  - Source-Curation
  - SurrealDB
  - Scoped-Corpora
  - Augment-It
  - Cross-Repo
from: "corpora-builder"
from_path: "context-v/issues/Need-Elegant-Resolution-to-Source-Pointers-vs-Master.md"
---
# Need an Elegant Resolution to Source Pointers vs. Master

## The shape of it

A source can be filed into more than one domain folder. **That is deliberate and
it is the product**: a corpus that will get very large has to hand an agent a
*scoped* set of sources when it drafts, because accuracy and attribution are the
whole point. A source bearing on two strategies belongs in both scopes, with its
own extracts in each.

The mechanism is a small pointer file per folder, with the canonical body kept
elsewhere. What is unresolved is *where elsewhere is*, and today the answer
differs per source.

## What is actually there

Measured across reach-edu on 2026-08-23 — 832 sources, every file parsed:

| | |
|---|---|
| filed in a domain folder | 737 |
| sitting in `live/inbox/` | 95 (80 `pending`, 14 `gated`) |
| carrying a `source_uuid` | 320 |
| distinct `source_uuid`s | 194 |
| filed in **two or more** folders | **79** (126 extra pointers; one source in six) |
| carrying `reference_of` | 28 |
| multi-valued `domains:` | **0** — single-valued by construction, one value per pointer |

And the number that matters most:

| filed sources | `content_pulled` |
|---|---|
| `candidate` | 496 · **false** |
| `metadata-only` | 170 · **false** |
| `fetched` | 71 · true |

**Only 71 of 737 filed sources carry a body.** Meanwhile:

> **80 titles exist both in `live/inbox/` and in a domain folder. In 75 of them,
> the inbox copy is the one holding the real body.**

So for those 75, an agent scoped to a strategy gets identity, lede and an empty
`# Extracts` skeleton — and the actual content is in a file that scoping never
reaches, because `live/inbox/` is not a strategy.

## The two rulings, and why neither is wrong

Two canonicality decisions exist, five weeks apart, about different things:

- **2026-07-25** — [[../../../augment-it/context-v/agent-skills/triage-inbox-w-suggestions/SKILL]]:
  *"the inbox file is canonical — option (a)."* Call the capability so the uuid
  exists, then **merge** the inbox file's body over the metadata-only stub at
  `corpus_path` and delete the inbox original. Reference copies get
  `reference_of` frontmatter.
- **2026-08-02** — [[../../../augment-it/context-v/specs/Source-Content-Storage-SurrealDB-Primary-Local-As-Toggle]]:
  *"SurrealDB is the primary content store."* The body is a `content` field on
  the canonical `sources` row; Extracts live per `source_usages`; `corpus_path`
  becomes **optional**, populated only where a local mirror exists.

They are compatible: the first describes how a capture becomes a filing, the
second says where the bytes ultimately live. **The problem is that neither has
run for these 75.** The merge step never happened, so the inbox file still says
`inbox_status: pending` and still holds the body; and the DB-primary migration is
listed in that spec's own "Still open" as unstarted, across three diverging
copies.

The result is not a wrong design. It is a **half-executed one**, and the half
that is missing is the half that puts content inside a scope.

## What actually hurts, in order

1. **A scoped read is mostly bodyless.** 666 of 737 filed sources have no body
   where the scope can see it. For drafting-with-attribution — the entire
   justification for scoping — that is the issue.
2. **Two ingestion paths produced files for the same URL and nothing reconciled
   them.** `source.add` writes metadata-only stubs into strategy folders; a
   research run wrote fat inbox files carrying `strategy_slugs: [...]`. Both are
   correct on their own terms. The inbox file names the strategies it belongs to
   and never got fanned into them.
3. **`reference_of` is specified and barely used** — 28 files. So a pointer is
   not reliably distinguishable *as* a pointer by reading it; today you infer it
   from `status: metadata-only` and a small byte count.
4. **Duplicated search results**, which is how this surfaced. Cosmetic, and
   explicitly [deferred](../../changelog/2026-08-23_03.md) — flat markdown is
   fast and easy at this size.

## Not the problem

- **The fan-out itself.** 126 extra pointers is ~140KB, and the fan-out is what
  makes a scoped read one `list()` call with no join and no database running.
  That is a feature to preserve in whatever replaces this, not a cost to remove.
- **`multi-valued: 0`.** Read as "multi-domain sources do not exist here" once
  already, and it means the opposite — see
  [[../specs/Strategy-Focus]], corrected 2026-08-23.

## Options, none chosen

1. **Run the triage merge.** Smallest step, no architecture change: for the 75,
   merge the inbox body onto the filed pointer(s), stamp `reference_of` on the
   non-primary copies, delete the inbox original. Leaves the body duplicated
   across N folders — at ~9KB each that is real but not large.
2. **Body in one filing, `reference_of` in the rest.** One folder holds the
   content; siblings point at it. Preserves the one-`list()`-call scope for
   *identity* but not for *content*, so an agent must resolve a pointer.
3. **SurrealDB-primary, as already specified.** Pointers stay thin forever;
   content is fetched by `source_uuid`. Matches the 2026-08-02 decision, and
   costs a running database for what is currently a folder read.
4. **Body beside the corpus, addressed by hash** — the `bin/` pattern this repo
   already uses for PDFs, extended to text. Pointers reference a content-address;
   the bytes exist once; a scoped read is still a folder read plus one fetch.

Option 4 is the one this repo already has machinery for, and it is the only one
that keeps "the corpus is files you can read without our software" true.

## Proposed stopgap — a multibox (operator, 2026-08-23)

> Add a **multibox** alongside the inbox, where the body — the master — goes.
> Update the pointers to reference the multibox. The inbox goes back to meaning
> exactly one thing: **awaiting triage**. And a **gatedbox** for what could not
> be triaged at all.

This separates two ideas currently sharing one folder: *"nobody has looked at
this yet"* and *"this is where the text lives."* `live/inbox/` holds 95 files
today, 80 `pending` and 14 `gated`, and the gated ones are failed fetches
(Cloudflare interstitials, `access-denied`) — not work awaiting a decision. The
inbox is doing three jobs. This gives it one.

It also does something none of the four options above do: it makes a pointer
**self-describing**. `reference_of` is specified and on 28 files; a `body_key`
that every pointer carries removes the guesswork about which copy is which.

### The key must be `normalized_url` — this is settled by the data

The multibox needs one filename per source, which means the corpus needs an
identity. Measured 2026-08-23 across the 737 filed sources:

| candidate key | coverage | verdict |
|---|---|---|
| basename | 649 distinct for 737 files | **no** — 36 basenames mean more than one source |
| `source_uuid` | 241 / 737 | **no** — a third of the corpus has none |
| `normalized_url` | 226 today, **737 after backfill** | **yes** |

**Every filed source carries a `url:`.** All 511 without a `normalized_url` are
derivable from it with **zero network calls**, by the `normalize_url` already in
`src/model/urls.py`. That backfill is the real first step, and it is mechanical.

Basename is not merely lossy, it is *wrong*: `2026-06-10_just-a-moment.md`
appears in four funder folders and those are four **different** blocked fetches
that happen to share Cloudflare's title. Keyed by basename a migration would
merge four distinct failures into one body.

After the backfill:

| | |
|---|---|
| distinct identities | **637** |
| filed in 1 folder | 557 |
| filed in 2 | 62 |
| filed in 3 | 17 |
| filed in 5 | 1 |

### What it changes elsewhere

- **`live/multibox/` must not count as a domain.** `_domain_of` would report
  `multibox`, putting it in the combobox and inflating the source count by 637.
  It needs the same treatment `index/` has — excluded from the *listing*, but
  **kept in the Files tree**, because unlike a derived cache the bodies are the
  operator's own content and a client asking where their text went deserves to
  see it.
- **The search manifest should carry `body_key`**, so a scoped read knows where
  the text is without opening every pointer.
- **Search gets substantially better, for the first time.** Today the index sees
  a title and ~240 characters of lede, because that is all a pointer holds. With
  bodies in one place the builder can index the actual text. This is the largest
  single upside and it is a side effect, not the goal.

### And a gatedbox (operator, 2026-08-23)

> The inbox is supposed to be for **triage**. Quite a few in there could not be
> triaged properly.

Right, and those are a different queue. A blocked fetch is not a decision waiting
to be made — it is a **fetch waiting to succeed**. Mixing them makes the inbox
read as 95 pending decisions when it is really 80 decisions plus 14 things
nobody *could* decide about.

Three boxes, one question each:

| box | the question it holds | the action that empties it |
|---|---|---|
| `live/inbox/` | has anyone decided where this goes? | a human or agent triages it |
| `live/gatedbox/` | did the fetch produce anything to decide about? | retry, a different fetcher, a manual paste |
| `live/multibox/` | where is the text? | nothing — it is the answer |

#### It half-exists already — as `inbox/gated/`

Correcting this issue's own first reading: `gated` is not only a frontmatter
value. **`live/inbox/gated/` is a real folder**, in augment-it at
`clients/reach-edu/corpus/inbox/gated/` and mirrored to R2. Alongside it sits
`inbox/_triage-runs/`. The R2 layout today:

| under `live/inbox/` | files |
|---|---|
| flat — awaiting triage | 80 |
| `gated/` | 14 |
| `_triage-runs/` | 1 |

augment-it's triage prompt already encodes the concept too
(`services/workspace/src/chat.ts`): *"every capture leaves inbox/ for a bucket, a
domain, a stream, **gated**, or a deliberate park"*, and *"Fetch-blocked capture
(403/CAPTCHA/paywall)? → gated, not discarded: the URL is still wanted."*

So the proposal is not "invent a gatedbox" — it is **promote the existing one out
of the inbox**. As a child of `inbox/` it still counts as inbox, which is exactly
why the inbox reads as 95 when only 80 of those are decisions.

#### Gating is not only an inbox state

The finding that makes this more than tidying. Scanning all 832 sources for
fetch failures:

| where the blocked fetches are | count |
|---|---|
| `live/inbox/gated/` — correctly parked | 8 of the 14 there |
| **filed inside a domain folder** | **7** |
| `live/_discarded/` | 1 |

Three funder folders hold a Cloudflare interstitial titled *"Just a moment…"*,
`mae-philanthropies` holds two *Vercel Security Checkpoint* pages, and
`think-tanks/brookings` holds one more. **Those are inside scoped corpora right
now.** An agent drafting against Arnold Ventures can retrieve, quote and cite
*"Just a moment…"* — which is precisely the failure mode scoping exists to
prevent, since accuracy and attribution are the whole product.

So the gatedbox has to receive things **out of domain folders**, not merely
divert new arrivals from the inbox.

#### What `gated` already means, read from the data

Of the 14 currently marked `gated`, **13 are fetch failures** in six different
disguises — and only 8 match an obvious title blocklist:

| what it actually was | count |
|---|---|
| Cloudflare / Access Denied / Vercel checkpoint | 8 |
| `Robot Challenge Screen` | 2 |
| `Fetch failed (HTTP 524 <none>)` | 1 |
| `Page Unavailable` | 1 |
| title is the bare URL — no metadata extracted at all | 1 |
| **a real article, gated on judgement** | **1** |

Two consequences:

1. **A title blocklist is not a gate rule.** It missed five of thirteen. The
   field designed to record this is `machine_verdict` — *"reachability is not
   approval"* — and it is **empty on nearly all of them**. Making capture always
   record it turns the gatedbox from a heuristic into a mechanical sort. That is
   the cheap fix hiding inside this issue.
2. **Keep judgement-gating out of it.** One of the 14 is a genuine article held
   back on a human call, not a fetch failure. A gatedbox that swallows it
   silently converts a decision the operator wanted to make into a retry queue
   nobody will look at. Fetch failures move; judgement stays in the inbox, where
   deciding is the point.

### Open before building

1. **Filename shape.** `<slug>--<sha8-of-normalized-url>.md` stays readable and
   is collision-proof; a bare digest is neither. `source_filename(...)` already
   takes a `taken` set and could do this without a new convention.
2. **Do single-filing sources move too?** Moving all 637 means "a filed source
   is always a pointer" — one rule, one shape. Leaving the 557 in place means
   the answer to *"where is the body"* is conditional, and gaining a second
   filing later mutates the first. **Recommend: all of them.**
3. **Do not promote the failures.** Five `just-a-moment` files and the 14 gated
   inbox entries are blocked fetches, not text.

### Migration, in order

1. **Record `machine_verdict` on capture, always.** Not a migration — it makes
   every step below mechanical instead of heuristic, and it is the one change
   that stops this recurring.
2. Backfill `normalized_url` on 511 filed sources. No network. Reversible.
3. Sweep fetch failures into `live/gatedbox/` — the 8 gated inbox entries, and
   the **7 sitting in domain folders**, which is the half that affects drafting.
   Leave the judgement-gated one where it is.
4. Create `live/multibox/`; move the 75 inbox bodies into it; stamp `body_key`
   on every pointer sharing that identity.
5. Flip those inbox files to triaged, or delete them per the 2026-07-25 ruling.
6. `live/inbox/` now means one thing: awaiting a decision.

Step 3 is the one worth doing first even if nothing else happens. It is small,
it is reversible, and until it runs there are seven pages inside scoped corpora
that an agent can cite and a reader cannot verify.

**Writes into a client corpus.** Steps 2–5 mutate reach-edu and are not
unattended work.

## This has to land in augment-it too

**corpora-builder and augment-it write the same corpus and are separate repos.**
The intent is that corpora-builder eventually becomes a submodule of augment-it;
until then any convention agreed here has to be **implemented twice, on purpose**,
and this section is the checklist so the second implementation is not discovered
later by divergence.

augment-it is on `rebuild/turbo-rsbuild`, and it holds its own on-disk copy of
this corpus at `clients/reach-edu/corpus/` — the third diverging copy the
SurrealDB spec's own open questions name (laptop, Railway volume, git).

### The surface that would change

| file | what it owns |
|---|---|
| `services/content-ingest/src/corpus.ts` | **the whole path model** — `addToInbox` (writes `corpus/inbox/`, stamps `inbox_status: "pending"`), `addToCorpus`, `addSourceFile` landing at `<type-plural>/<slug>/sources/`, `addDomainIndex`, `retypeDomainFiles` |
| `services/content-ingest/src/promote.ts` · `handlers.ts` · `binary-asset.ts` | promotion out of the inbox, and the PDF sibling that has to move with a source |
| `services/workspace/src/chat.ts` | the triage prompt — already names `gated` as a destination |
| `scripts/jina-fetch-mega-gifts-sources.mjs` | writes `inbox_status: gated` and lands files in `inbox/gated/` |

### Two divergences that already exist

1. **Different roots.** augment-it writes
   `clients/<client>/corpus/<type-plural>/<slug>/sources/…` (from `CLIENTS_ROOT`,
   default `/clients`); corpora-builder writes `live/<type>/<slug>/sources/…`.
   `_domain_of` already strips a leading `live/` to reconcile them.
   **Consequence:** the boxes must be specified **relative to the corpus root** —
   *"a sibling of `inbox/`"* — never as literal keys, or `live/multibox/` and
   `corpus/multibox/` become two different conventions with one name.
2. **Different ways to map a type to a folder.** augment-it uses a
   `DOMAIN_FOLDERS` table with a `` `${type}s` `` fallback; corpora-builder
   refuses that rule and reads `type`/`slug` out of each folder's own `index.md`,
   because the fallback is what `thesis`/`theses` breaks. Both work today only
   because the table happens to cover every type in use. A new box does not have
   to care — but a new *domain type* does, and that is the same class of bug.

### The consistency rule while they are separate

Whatever is agreed here lands as **spec first, in one place, referenced by both**
— this issue and `Strategy-Focus.md` on this side, and the storage spec on
augment-it's. Then two implementations against one written contract, rather than
two implementations that agree by memory. A convention only present in code is
one that diverges the first time either repo is touched alone.

## What would make this urgent

An agent drafting from a scoped corpus and citing a source it could not read.
That is reachable today for 666 of 737 filed sources, so the honest statement is
that scoping currently delivers **which sources**, not **what they say**.

## Related

- [[../specs/Strategy-Focus]] — where the `0 multi-valued` misreading was corrected
- [[../specs/Binary-Ingest-And-Bin-Store]] — the content-addressed `bin/` pattern option 4 would extend
- [[../specs/Capture-Link-First]] — the two-tier fetch gate that leaves `content_pulled: false` on purpose
- `../../changelog/2026-08-23_03.md` — where the duplicated results surfaced

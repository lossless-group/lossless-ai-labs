---
title: "Sync Corpora to R2, and Show Clients What Changed"
lede: "The R2 prefix has held zero objects for fourteen days — and the corpus grew anyway, in git. Mirror first, version later."
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.2
status: Draft
site_uuid: 9345909f-1569-4e5e-b1cc-227428f849fd
hex_code: nmaw8l
applies_to:
  - ai-labs
  - ai-labs/augment-it
  - ai-labs/corpora-builder
  - ai-labs/flave-ai
summary: >-
  Sequenced plan responding to a bucket audit that found the corpora R2 prefix
  completely empty while the reach-edu corpus grew by real work in git. Argues
  the R2-native SUBSTRATE decision should be downgraded from decided to
  deferred-with-a-trigger, that git is already serving as the history layer and
  should keep doing so, that the client-facing progress feed is the only
  genuinely unbuilt part and can be built against git today, and that the
  syncbox pattern generalizes to .flave as a document service rather than a
  self-hosted forge. Phases 0-3 are actionable now; everything else is parked
  behind a named trigger.
tags:
  - Plan
  - Corpora-Builder
  - Augment-It
  - Flave
  - Storage-Substrate
  - Cloudflare-R2
  - Version-Control
  - Client-Facing
publish: true
---

# Sync Corpora to R2, and Show Clients What Changed

## The plan in one table

Three engines, one per layer, staged by **trigger** rather than by date — plus the
one piece nobody sells, which is the only thing we write.

| | What | Layer | When | Where below |
|---|---|---|---|---|
| **1** | **rclone** → R2 | Transport | **✅ Done 2026-08-22** | Phase 1 |
| **2** | **the feed** — the sentence and the render | **Legibility** | **✅ Read side done 2026-08-22** | Phase 2, 3 |
| **3** | **Kopia** — a repo per client, beside `live/` | History | When R2 becomes primary | Parked, trigger 2 |
| **4** | **Syncthing** — `receiveonly` collaborator mirrors | Transport, human↔human | When a named person asks for live access | Parked, trigger 4 |
| **5** | **Automerge** — CRDT | Simultaneous editing | Probably never. Only if two people must edit one paragraph at once | Parked, trigger 5 |

**Steps 1 and 2 are the plan. Steps 3–5 are pre-decided answers waiting on
triggers**, so that when one fires nobody re-runs the research —
`ai-labs/studies/sync-and-content-version-control` already did it, six references
deep, one profile each.

**Git is the history layer until step 3 fires.** It already is one, and nobody
counted it — see below.

## Why Care?

On 2026-08-08 the corpora-builder plan made four decisions, of which the
load-bearing one was **SUBSTRATE: R2-native behind a storage interface**.
Everything downstream — the `live/` / `objects/` / `checkpoints/` layout, the
HISTORY decision to hand-build content-addressed version control, Phase 4 — hangs
off it.

**Fourteen days later the bucket prefix is empty.** Audited 2026-08-22:

| Checked | Result |
|---|---|
| `r2://reach-edu/corpora/` (the configured workspace prefix) | **0 objects** |
| `r2://reach-edu/` entire bucket | 9 objects, 3.4 MB, all under `backups/` — unrelated |
| corpora-builder → R2 wiring | Fully configured; credentials authenticate and `list` succeeds |
| Bytes ever written through it | **None** |
| `rclone` on the operator machine | **Not installed, no config** |

Meanwhile the corpus itself grew. The plan's PROVING-CORPUS baseline was *517
markdown files, 140 in inbox*. It is now **845 markdown files, 95 in inbox**, 892
files total, 156 MB. The inbox shrank while the total grew — that is triage.
**Two weeks of real work happened, through a different path, and none of it went
near the bucket.**

That is not a plan being executed slowly. **That is a plan the work is routing
around**, and the honest response is to change the plan rather than push harder
on it.

> [!success] **No emergency here**
> The first read of "156 MB on one laptop" looks alarming and is wrong. The
> corpus is a git submodule — `lossless-group/augment-reach-edu` — with 886 files
> tracked, a clean working tree, and `main` in sync with `origin/main`. It is
> committed, pushed, and offsite. Nothing is at risk. This plan is about
> sequencing, not rescue.

## The thing that was hiding in plain sight

**The corpus is already versioned.** It sits in git with a commit DAG, human
messages, a remote, and offsite copies. The capability HISTORY proposed to
hand-build — *"git's data model, minus git"* — is already present as **git**,
and it went uncounted because the plan assumed R2-primary and stopped looking at
what was true.

So re-read SUBSTRATE's own justification for leaving git:

> Local filesystem + per-client git worked for two clients; it does not survive
> **cloud deployment**, **multi-operator editing**, or **didi-in-the-browser**.

Has any of the three fired? Cloud deployment: no. Multi-operator: no.
didi-in-the-browser: no. **None.**

That is precisely the discipline the same document applies to the parked
BTRFS/ZFS option — *"the trigger that brings it back … has still not fired."*
Applied evenly, it says the trigger to **leave** git has not fired either.

## What this plan decides

1. **Downgrade SUBSTRATE from decided to deferred-with-a-trigger.** Not
   reversed — R2 stays the destination, and the `CorpusStore` seam stays exactly
   as built. It stops being the thing everything waits on.
2. **Git is the history layer until a trigger says otherwise.** Do not write
   Phase 4. Do not adopt Kopia yet.
3. **The client-facing progress feed is the product**, it is the only genuinely
   unbuilt layer, and it can be built against git this week.
4. **Mirror the corpus into `live/` anyway** — cheap, reversible, and the only
   way to turn "is `live/` hand-recoverable" from an intention into a fact.

Full reasoning and the prior art it rests on:
[[../explorations/A-Syncbox-For-Client-Document-Folders]] and the six pinned
references in `ai-labs/studies/sync-and-content-version-control`.

## The gap nobody scoped

Worth naming because it explains the empty bucket better than any theory about
priorities. corpora-builder's Phases 0–3 built a **capture** path: a new URL
arrives, gets fetched, and is written to `live/<domain>/sources/`. It works.

**There is no migration path.** Nothing moves the 892 files that already exist
into the bucket. Capture is forward-only; backfill was never a phase. So the
bucket could only ever have filled with sources captured *after* Phase 3 landed,
through a tool the actual corpus work was not using.

Second, smaller gap: **`live/` was never specced.** `Storage-Seam.md` explicitly
scoped it out — *"the `live/` vs `objects/` vs `checkpoints/` layout (that is
Phase 4 — this phase is bytes at keys, nothing about what the keys mean)"* — but
Phase 3 needed somewhere to write, so `live/` arrived as a de facto convention
ahead of the phase meant to define it. It is consistent everywhere it appears
(`src/capture/add.py:34,48-52`, `src/server/browse.py:57-63`, `src/cli.py:203`).
It is just undocumented.

## Phases

### Phase 0 — Record what is true *(ai-labs, corpora-builder)*

No code. Make the documents match reality so the next session does not
re-derive it.

- Amend the corpora-builder plan: **SUBSTRATE → `Deferred`**, with the three
  triggers named explicitly (below) and the 2026-08-22 audit numbers recorded
  in-line. Use the same amendment style already used in `Storage-Seam.md`
  (*"Amended 2026-08-08, during implementation"*) — the spec was wrong, say so,
  do not weaken it retroactively.
- Amend `Storage-Seam.md`: `live/` **exists and is load-bearing** as of Phase 3,
  cite the four call sites, and note it preceded the phase meant to define it.
- Mark Phase 4 (checkpoint history) **`Deferred`** with a `deferral_note`
  pointing at this plan.

**Done when:** a reader of the corpora-builder plan learns the bucket is empty
and why, without opening this document.

### Phase 1 — Mirror what exists *(augment-it, corpora-builder)* — ✅ **Shipped 2026-08-22**

The cheapest useful move in the whole plan. Roughly thirty minutes.

- Install `rclone`; configure the `reach-edu` R2 remote from the credentials
  already in `corpora-builder/.env`.
- `rclone sync` `augment-it/clients/reach-edu/corpus/` →
  `r2://reach-edu/corpora/live/`. **One direction only, laptop → bucket.**
- Verify the round trip: `rclone sync` back down to a scratch directory and
  confirm file count and per-file `sha256` match the source.
- Record the result in `corpora-builder/changelog/`.

**Why it is worth doing even though nothing depends on it:** it closes the June
rclone→R2 backup decision that was recorded as settled and never stood up; it
populates `live/` for the first time; and it converts *"`live/` is
hand-recoverable"* from a design intention into a measured fact. If the answer
turns out to be no, that is worth knowing before anything is built on it.

**Explicitly not in this phase:** two-way sync, scheduling, or making R2
authoritative. This is a mirror. The laptop and git remain the truth.

**Done when:** `live/` holds 892 objects, the down-sync reproduces the tree
byte-identically, and the numbers are in the changelog.

> [!success] **Shipped 2026-08-22 — and the target number was wrong**
> `live/` holds **886** objects, not 892. The six-file difference is `.DS_Store`,
> excluded deliberately; 886 is exactly what `git ls-files corpus` reports, so
> the bucket now mirrors what git tracks. 153.7 MiB up in 28 seconds, pulled back
> into an empty directory, **886/886 files with every `sha256` identical**.
> Hand-recoverability is now measured rather than intended: `grep -rl "rural"`
> on the recovered tree returns 46 hits with no corpora-builder installed.
> Repeatable via `corpora-builder/scripts/mirror_corpus.sh <src> [--verify]`,
> which uses `copy` not `sync` (the destination is a client-owned bucket and a
> mirror should not be able to delete there) and configures rclone from
> environment variables so no R2 secret is persisted to disk.
> Full numbers: `corpora-builder/changelog/2026-08-22_01.md`.

### Phase 2 — The legibility layer, against git *(corpora-builder)* — ✅ **Read side shipped 2026-08-22**

The actual product, and the answer to the invisible-progress problem. No
reference in the study supplies this; every one of them scores *none* on it.

Three pieces:

1. **The gesture.** "Save a version" that never says *commit*. Against git today
   this is a commit with a required human message and a `client=<slug>` trailer.
2. **The sentence.** The reason, written by a person, in a client's language.
   *"Revised the funder-fit section after Tuesday's call."* Git already carries
   this; the study found only Seafile's `Commit.Desc`, Kopia's `Description`, and
   Automerge's change `message` do — and git is the one already in the tree.
3. **The feed.** A rendered "what changed and why" for someone who will not read
   a diff. `git log --stat` supplies the machine side (files new / changed /
   removed) for free; the sentence supplies the human side.

**Design instruction that outlives the substrate:** design the feed to consume a
**structured change record** — `{when, who, sentence, files_added,
files_changed, files_removed, bytes}` — never `git log` output directly. Every
candidate engine can emit that shape (Kopia's `Description` + `Stats`,
Automerge's `diff(before, after) → Vec<Patch>`, restic's `SnapshotSummary`), so
the surface survives an engine change. **This is the one place in the plan where
getting the interface right matters more than getting the implementation right.**

**Done when:** a reach-edu-shaped feed renders the last ten changes with reasons,
from real repository data, and a non-technical reader can tell what happened.

> [!success] **Shipped 2026-08-22 — the read side**
> `corpora changes` over the real reach-edu corpus in **0.23 seconds**. All
> sixteen `FEED-*` IDs green, mypy clean, ladder passing. Built in
> **corpora-builder**, not augment-it as this plan originally annotated — the
> origin clarification made corpora-builder the owner of the corpus concept, and
> it already had the CLI surface and the spec-driven loop.
> **Still open from this phase: the gesture.** "Save a version" as a *write*,
> with a required sentence, is its own spec — this one is read-only like
> `Browse-Corpus`. Nothing here creates a change.
> Spec: `corpora-builder/context-v/specs/Corpus-Change-Feed.md` ·
> Ship note: `corpora-builder/changelog/2026-08-22_02.md`

### Phase 3 — The client read surface *(augment-it, didi.sh)*

Where the feed lives so a client can see it. Auth via didi.sh; per-client scope;
read-only.

Deliberately after Phase 2, because the feed is worth building even if the first
version is something you screenshot into an email. **A feed with no address is
still a feed; an address with no feed is nothing.**

**Done when:** a named person outside Lossless can open a URL and see what
changed in their corpus this month.

## Parked, each behind a named trigger

Nothing below is rejected. Each is a good answer to a question that has not been
asked yet, and each gets re-opened the moment its trigger fires — the same
discipline the corpora-builder plan applied to BTRFS/ZFS.

| Parked | Trigger that re-opens it |
|---|---|
| **R2 as primary substrate** | Deployment stops being optional (a hosted surface writes the corpus), **or** a second person edits concurrently, **or** the corpus outgrows a laptop |
| **Kopia adopted for history** | R2 becomes primary *and* `live/` stays canonical. If history ever becomes canonical and `live/` a projection of it, **write Phase 4 instead** — do not adopt an opaque format you do not control as the source of truth |
| **Phase 4 — hand-built CAS + checkpoints** | Kopia is evaluated and rejected on a specific, written reason. Not by default |
| **Syncthing for collaborator mirrors** | A named person asks for live corpus access and a periodic export is genuinely not enough. `receiveonly` on every collaborator device; per-client folder scoping |
| **CRDT / real-time multiplayer** | Two people genuinely need to edit the same document simultaneously. Until then structural asymmetry is the cheaper correct answer |

Evidence for each is in the six profiles under
`ai-labs/studies/sync-and-content-version-control/context-v/profiles/`.

## On `.flave` — the remote is a document service, not a forge

Decoupling `.flave` from the corpora substrate is settled for now: a
single-author bundle wanting keystroke-grained operation-log undo (`jj`, §8.2)
and a 156 MB client corpus wanting labelled checkpoints are different problems.
**They share the surface, not the store** — the same gesture, the same sentence,
the same structured change record from Phase 2, copied knots-style rather than
depended on across apps.

But the owner's objection (2026-08-22) is correct and should not be filed away:

> As of the current direction, it would be great on my computer, but
> collaborating on it or sending it out **has no resolution**. In theory `jj`
> could solve for it if we have a remote that acts as a kind of self-hosted
> SourceForge — but most customers/users would never access the UI.

That is right, and it identifies a real hole. The rungs:

| Rung | Needs | Status |
|---|---|---|
| Great on my computer | Local history + agent undo | **Done in spec** — §8.2, `jj` |
| Send it to someone | Bundle export | **Done in spec** — §5.1, the directory zips |
| They read it | Published HTML | **Done in spec** — §11, the flatten contract |
| **They edit, it comes back, it merges** | A place to put it + merge on return | **The hole** |
| Feels like Quip / Airtable | Presence, live cursors, no send/receive at all | §8.4 v3, deferred, correctly |

**The forge is the wrong shape, for exactly the stated reason.** A Gitea or
Forgejo instance is a developer UI. Clients will never log into it. Operating one
buys a sync endpoint wearing a website nobody in the audience will visit.

**What the remote actually has to be:** a **document service** — per-document
prefix in a bucket, didi.sh auth, a client-facing *reader* built from the §11
flatten output, and an endpoint that accepts a returned bundle. `jj` stays where
it is good: on the operator's and the app's side, doing the merge when the bundle
comes home. **The client never sees a repository, a commit, or a branch. The
bucket is the transport; there is no forge.**

Which is the same shape as the corpora recommendation — *bucket + plain
artifacts + client-facing read surface + history on the operator side* — and that
symmetry is why the pattern is worth writing down once and copying twice, rather
than turning into a shared package.

**Not scoped here.** This section names the hole and rules out one wrong answer.
The document service wants its own spec in `flave-ai/context-v/specs/`, and it
should not start until Phase 2 exists, because it is the same feed and the same
structured change record pointed at a different artifact.

## Answered while writing this — corpora-builder's origin and scope

Owner, 2026-08-22:

> I built corpora-builder within augment-it because it centered around the same
> use case — augmenting record sets for a client. But as we built it out, I
> realized that it's useful as a **standalone app**, as well as one that
> **integrates into the didi.sh venture capital suite** of dididecks-ai and
> memopop-ai.

This resolves what were the plan's two most consequential open questions, and it
changes Phase 1's meaning rather than its steps.

**corpora-builder is not augment-it tooling that got promoted. It is a product
that happened to be born inside augment-it**, because the first corpus it needed
was one augment-it already had. The "two programs, one corpus, no defined
relationship" reading in the audit was wrong in an instructive way: they were
*one* program, and the relationship is **inheritance, not overlap**.

Three consequences worth carrying:

1. **The corpus living in `augment-it/clients/reach-edu/corpus/` is a legacy of
   origin, not a design decision.** Nobody chose to put a corpus in a
   record-enrichment app; it was already there when corpora-builder split out.
2. **Phase 1 is the first step of a handover, not a copy.** Mirroring
   `augment-it/clients/reach-edu/corpus/` into corpora-builder's `live/` is not a
   category error — it is the corpus starting to move to the program that now
   owns the concept. Whether augment-it later *reads* from there, keeps its own,
   or drops it is a separate decision, and Phase 1 does not force it because the
   mirror is one-way and non-destructive.
3. **Three consumers, not one.** augment-it (record sets), dididecks-ai (decks),
   and memopop-ai (memos) all want corpora, which is the strongest argument yet
   for corpus-as-its-own-thing. It also re-raises the standing prohibition on
   sharing dependencies across `ai-labs` apps: the answer is a **service with a
   verb contract and file formats** — the `source.*` vocabulary already sketched
   in the corpora-builder system design — **never an imported package**.

## Still open

1. **What does augment-it read from, after Phase 1?** Its own submodule, or
   corpora-builder's bucket? Not forced by this plan, but it is the next
   decision after the mirror lands, and it is the one that makes the handover
   real rather than notional.
2. **Standalone versus suite — which ships first?** A standalone corpora-builder
   and a suite-integrated one imply different next surfaces (its own Tauri shell
   per the MVP plan's Phase 7, versus a didi.sh-mounted view). The MVP plan
   assumes the former; the answer above allows both, so the sequencing is now
   genuinely open rather than assumed.
3. **Is the second client (`humain-vc`) in the same shape?** Not audited. It has
   a corpus directory; nothing else was checked.
4. **Retention.** Git has no thinning story and an autosave-shaped gesture will
   make one necessary. Kopia's per-directory policy + pins and Syncthing's
   four-line staggered curve are both in the study when it matters. Named so its
   absence is a decision.

## Related

- [[../explorations/A-Syncbox-For-Client-Document-Folders]] — the exploration this plan acts on
- `ai-labs/studies/sync-and-content-version-control` — six pinned references, one profile each
- `ai-labs/corpora-builder/context-v/plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History.md` — the plan being amended
- `ai-labs/corpora-builder/context-v/specs/Storage-Seam.md` — the seam that makes being wrong about R2 cheap
- `ai-labs/flave-ai/context-v/specs/Master-Flave-An-Agent-Native-Document-Format-and-Publisher.md` — §8.2, §8.4, §11
- `ai-labs/augment-it/context-v/explorations/Syncthing-For-Collaborator-Access-To-The-Corpus.md` — the parked collaborator tier

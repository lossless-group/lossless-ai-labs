---
title: "The Flave Document Service — Not a Forge"
lede: "Local history is solved and reading is solved. The hole is the round trip: they edit, it comes back, it merges. A forge is the wrong shape for it."
version: 0.0.0.1
at_semantic_version: 0.0.0.1
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
categories: Technical-Specification
status: Stub
publish: false
site_uuid: 92c667fe-967d-4a61-b015-7d72a7014d28
hex_code: 88jpqc
summary: >-
  STUB. Captures a 2026-08-22 discussion, not a design. Names the one collaboration
  rung the master spec leaves unresolved — a returned edit with nowhere to land and
  nothing to merge it — and rules out one wrong answer, the self-hosted forge,
  because its UI is for developers and this audience will never open it. Sketches
  the shape that survives: a document service where the bucket is the transport,
  jj stays operator-side, and the client sees a reader rather than a repository.
  Do not develop until the structured change record from the ai-labs plan exists.
tags:
  - Spec
  - Stub
  - Flave
  - Collaboration
  - Jujutsu
  - Client-Facing
from: "flave"
from_path: "context-v/specs/The-Flave-Document-Service-Not-A-Forge.md"
---
# The Flave Document Service — Not a Forge

> [!warning] **This is a stub, deliberately**
> It records a discussion held 2026-08-22 so the reasoning is not lost, and it
> rules out one answer. It is **not** a design, and it should not be developed
> into one yet — see *Do not start this yet* at the bottom.

## The hole

[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] resolves most of
the collaboration ladder. Laid out as rungs, the gap is obvious and it is exactly
one:

| Rung | What it needs | Status |
|---|---|---|
| Great on my computer | Local history, agent undo | **Done in spec** — §8.2, `jj` |
| Send it to someone | Bundle export | **Done in spec** — §5.1, the directory zips |
| They read it | Published HTML | **Done in spec** — §11, the flatten contract |
| **They edit, it comes back, it merges** | Somewhere to put it, and a merge on return | **The hole** |
| Feels like Quip or Airtable | Presence, live cursors, no send/receive at all | §8.4 v3 — deferred, correctly |

The owner's framing (2026-08-22):

> As of the current direction, it would be great on my computer, but
> collaborating on it or sending it out **has no resolution**. In theory `jj`
> could solve for it if we have a remote that acts as a kind of self-hosted
> SourceForge — but in some ways most customers/users would never access the UI,
> so other than it existing as a way to scaffold something like a repo with all
> features on a remote bucket/blob, not sure what it does.

That is the right diagnosis and the right suspicion.

## What is ruled out: the forge

A self-hosted Gitea/Forgejo/SourceForge-shaped remote is the obvious answer and
the wrong one, for the reason stated: **a forge is a developer UI.** Clients will
never log into it. Operating one buys a sync endpoint wearing a website nobody in
the audience will visit, plus a host to patch, back up, and authenticate against
for no user-facing return.

The suspicion that it would be *"a way to scaffold something like a repo… on a
remote bucket/blob"* is precisely right, and it is the tell: if the only thing a
forge contributes is *a place bytes live, addressed per document*, that is object
storage, and object storage does not need a forge in front of it.

A supporting finding from `ai-labs/studies/sync-and-content-version-control`
(see `context-v/profiles/Profile__Jujutsu.md`): **a colocated `jj` repo does not
travel whole.** Content lives in `.git/` and moves fine, but change IDs,
predecessors, and the entire operation log live in `.jj/repo/store/extra/` and
`.jj/repo/op_store/` — outside git. A git-only recipient receives the document
and gets a bit-reversed commit ID in place of a stable change ID. So even with a
forge, the thing §8.2 chose `jj` *for* would not be what crossed the wire.

## The shape that survives

Sketch, not a design:

- **The bucket is the transport.** One prefix per document. No forge, no host.
- **Auth is didi.sh**, consistent with every other surface in the suite.
- **The client sees a reader, not a repository** — built from §11's flatten
  output, which already exists in the spec. No commits, no branches, no
  revision graph, nothing borrowed from a developer tool.
- **An endpoint accepts a returned bundle.** That is the whole write path for v1.
- **`jj` stays operator-side and app-side**, doing the merge when the bundle comes
  home. Its first-class conflict representation (§8.4) is what makes a returned
  edit safe to accept, and that value is fully realized without the client ever
  touching it.

**The client never learns a version-control concept.** That is the design
constraint, not a nicety.

### Why this is the same shape as the corpora answer

Worth recording because the symmetry is the reusable part: *bucket + plain
artifacts + a client-facing read surface + history on the operator side* is the
identical conclusion reached independently for client corpora in
`ai-labs/context-v/plans/Sync-Corpora-to-R2-and-Show-Clients-What-Changed.md`.

Two products, one pattern. Per the standing no-shared-dependency rule across
`ai-labs` apps, that means **write the pattern down once and copy it twice** —
knots-style, blueprint plus sample code — never a package or service shared
between flave, augment-it, and corpora-builder.

## Open, and deliberately unanswered here

1. **Does the returned bundle merge automatically, or land as a proposal?**
   §9.1's `propose` contract already exists for agents, and §8.4 v2 points it at
   humans. That is probably the answer, but it is not decided here.
2. **What does the client edit *with*?** Read-only reader plus "send me back a
   file" is v1 and may be enough for a long time. A browser-based edit surface is
   a much larger question that drags in §7's three-layer editing model.
3. **How does a document get addressed and shared?** A URL per document implies
   an id scheme; §5.3's UUIDv7 `id:` is the obvious candidate and is already
   immutable per document.
4. **Where does the Quip/Airtable feel actually come from?** It is worth being
   honest that the round-trip rung does not deliver it. That feel is presence and
   liveness, which is §8.4 v3 and a CRDT. Closing this hole makes collaboration
   *possible*; it does not make it *feel live*. See
   `studies/sync-and-content-version-control/context-v/profiles/Profile__Automerge.md`
   for what that tier costs — chiefly that the document stops being files, and
   that no history can ever be discarded.

## Do not start this yet

Two reasons, both about sequencing rather than merit:

1. **It is the same feed pointed at a different artifact.** Phase 2 of the
   ai-labs plan specifies a **structured change record** —
   `{when, who, sentence, files_added, files_changed, files_removed, bytes}` —
   as the interface every progress surface consumes. This service wants exactly
   that record. Building it first means designing the interface twice.
2. **The master spec has unshipped v0 slices.** §1.1's cut is still unsigned and
   Phase 0 landed only 2026-08-20. A collaboration tier ahead of a finished
   single-player editor is the wrong order.

**Trigger to develop this into a real spec:** the structured change record exists
and is rendering somewhere, **and** a named person outside Lossless has asked to
edit a `.flave` and send it back.

## Related

- [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] — §5.1, §8.2, §8.4, §9.1, §11
- `ai-labs/context-v/plans/Sync-Corpora-to-R2-and-Show-Clients-What-Changed.md` — the sibling conclusion and the structured change record
- `ai-labs/context-v/explorations/A-Syncbox-For-Client-Document-Folders.md` — the exploration behind both
- `ai-labs/studies/sync-and-content-version-control/context-v/profiles/Profile__Jujutsu.md` — why a colocated repo does not travel whole
- `ai-labs/studies/sync-and-content-version-control/context-v/profiles/Profile__Automerge.md` — what the Quip-feel tier actually costs

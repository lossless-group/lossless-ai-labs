---
title: "Corpus Change Feed — what changed in a client's corpus, and why"
lede: "A change record any history engine can emit, and a feed that renders it for someone who will never read a diff."
date_created: 2026-08-22
date_modified: 2026-08-22
date_authored_initial_draft: 2026-08-22
date_authored_current_draft: 2026-08-22
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.3
status: Signed-Off
spec_reference: "[[../../../context-v/plans/Sync-Corpora-to-R2-and-Show-Clients-What-Changed]] — Phase 2"
tags:
  - Spec
  - Corpora-Builder
  - Client-Facing
  - Version-Control
  - Phase-2
site_uuid: 82951453-3d0a-4eea-8715-a680ecb35fd5
hex_code: xwmtc5
publish: true
from: "corpora-builder"
from_path: "context-v/specs/Corpus-Change-Feed.md"
---
# Corpus Change Feed

## Why Care?

A client whose corpus we maintain currently has **no way to see that we did
anything**. The files change, the work is real, and it is entirely invisible
unless someone writes an email about it. That is the problem this spec exists to
solve, and it is the one part of the whole substrate/history/sync question that
**no existing tool supplies** — a study of six mature systems (`jj`, Seafile,
Syncthing, restic, Kopia, Automerge) found every one of them scoring *none* on
"renders what changed for a non-technical reader."

Two things make it worth speccing rather than scripting.

**First, the interface outlives the engine.** History for this corpus currently
lives in git. It may later live in a Kopia repository, or in corpora-builder's
own checkpoints. Those are open questions with named triggers. If the feed reads
`git log` directly, answering any of them means rebuilding the surface. If it
reads a **change record**, the engine swaps underneath and nothing above it
notices. This is the same seam discipline that made `CorpusStore` worth building,
for the same reason.

**Second, the raw material is already good, and is about to be wasted.** The
corpus repo's real commit subjects read like this:

```
triage(carnegie): corporation folds into foundation — the incomplete rebrand resolves to one org
capture(bloomberg-philanthropies): 2025–2026 annual report — PDF + wrapper, registered as annual_report
progress(corpora, inbox-triage): batches 5-6 close the drain — inbox 66→4, all residue deliberately parked
```

A client can read the half after the colon. Nobody has ever shown it to one.

## Scope

**In:** the `Change` record and its field contract; a `ChangeSource` interface
with a git-backed implementation; scoping to a corpus path prefix; parsing the
Lossless commit-header convention into structured fields; two renderers, JSON
and prose; a `corpora changes` CLI command.

**Out:**

- **The gesture** — "save a version" as a *write*, with a required sentence.
  That is a separate spec because this one is read-only, in the same way
  [[Browse-Corpus]] is. Nothing here creates a change.
- **The hosted client surface** — auth, per-client scoping, a URL a client opens.
  That is Phase 3 of the plan and belongs to didi.sh.
- **Any second `ChangeSource` implementation.** `KopiaChangeSource` is what the
  seam is *for*; it is not built until Kopia's trigger fires. The conformance
  suite (`FEED-14`) is what keeps that cheap.
- **Summarising or rewriting a sentence with an LLM.** See Behaviour 5.

## Behaviour

1. **`Change` is the unit, and it is engine-agnostic.** A change carries: a
   stable `id`, a UTC `when`, a `who`, the raw `subject`, an optional parsed
   `verb`/`scope`/`sentence`, and four path lists — `added`, `changed`,
   `removed`, `renamed` (pairs). Counts and total `bytes` are derived from the
   paths, never stored independently, so they cannot drift from them.

2. **`ChangeSource` is an interface.** One method, `changes(prefix, limit)`,
   returning `Change` records newest-first. `GitChangeSource` is the first and
   currently only implementation. Nothing above the interface knows what engine
   it is talking to.

3. **Everything is scoped to a corpus prefix.** A change that touches no file
   under the prefix does not appear at all — not as an empty entry. A change that
   touches some files under the prefix appears carrying *only* those paths.

4. **The Lossless commit header is parsed, not assumed.** `verb(scope): subject`
   splits into `verb`, `scope`, and `sentence`. A subject that does not match the
   convention yields `verb=None`, `scope=None`, and `sentence` equal to the whole
   raw subject. **The raw `subject` is always retained** regardless.

5. **The feed never invents a reason.** If a change has no usable sentence, the
   prose render shows the change with its counts and *no reason line*. It does
   not summarise the diff, guess intent, or call a model. An absent reason renders
   as absent — which is honest, and is the only thing that creates pressure to
   write a real one. This is the corpus-boundary discipline applied to our own
   output: a gap is stated, not filled.

6. **Timestamps are UTC at rest, viewer-local at render.** Per the tree-wide
   reminder. `Change.when` is always timezone-aware UTC; formatting for a reader
   happens in the renderer and nowhere else.

7. **Binary files are first-class.** PDFs and other non-markdown files appear in
   the path lists exactly like markdown. A corpus is not only its prose, and the
   ImmuneCo failure — thirteen sources silently absent from a count — is the
   standing reason nothing gets dropped quietly here.

8. **Renames are renames.** A path that moved appears in `renamed` as an
   `(old, new)` pair, not as a removal plus an addition. A client reading
   "removed the Carnegie file, added the Carnegie file" would draw the wrong
   conclusion from a correct diff.

9. **Truncation is always reported.** `limit` caps how many changes are
   returned, and a capped result says so. A large path list is likewise capped in
   the *prose* render with an explicit "+N more" — never silently. A feed that
   quietly drops rows reads as "that is everything," which is the failure this
   whole product exists to prevent.

10. **Two renderers over one record.** `to_json` produces the stable machine
    shape; `render_prose` produces the human one. **Neither reads git.** Adding a
    surface later — a web view, an email digest — means a third renderer, not a
    second reader.

11. **Nothing is written, ever.** No handler and no renderer calls `write` or
    `delete`, and the git implementation uses read-only plumbing only.

## Tests

| ID | Given / When / Then |
|---|---|
| `FEED-01` | Given a repository with a commit touching the corpus, when changes are read, then each record carries id, when, who, subject, and the four path lists |
| `FEED-02` | Given a change with two added and one removed path, when its counts and total bytes are read, then they equal what the path lists imply rather than a separately stored number |
| `FEED-03` | Given a commit touching only files outside the corpus prefix, when changes are read for that prefix, then that commit is absent from the results entirely |
| `FEED-04` | Given a commit touching files both inside and outside the prefix, when changes are read, then the record carries only the paths inside it |
| `FEED-05` | Given a subject of the form `verb(scope): sentence`, when it is parsed, then verb, scope, and sentence are separated and the raw subject is still retained |
| `FEED-06` | Given a subject that does not match the convention, when it is parsed, then verb and scope are absent and sentence equals the whole raw subject |
| `FEED-07` | Given a change whose sentence is empty, when it is rendered as prose, then the change appears with its counts and no reason line, and no summary is generated |
| `FEED-08` | Given commits made in a non-UTC local timezone, when changes are read, then every `when` is timezone-aware UTC |
| `FEED-09` | Given commits at different times, when changes are read, then they are ordered newest first |
| `FEED-10` | Given a commit that adds a PDF alongside a markdown file, when changes are read, then both paths appear in `added` |
| `FEED-11` | Given a commit that moves a file from one path to another, when changes are read, then it appears once in `renamed` as an (old, new) pair and in neither `added` nor `removed` |
| `FEED-12` | Given more changes than the requested limit, when changes are read, then exactly `limit` are returned and the result reports that it was truncated |
| `FEED-13` | Given a change touching more paths than the prose renderer displays, when it is rendered, then the omitted count is stated explicitly rather than the list simply ending |
| `FEED-14` | Given the conformance suite above, when it runs against `GitChangeSource` and against an in-memory fake `ChangeSource` in turn, then every test passes against both with no implementation-specific branching in the test bodies |
| `FEED-15` | Given a set of changes, when they are serialized to JSON and read back, then the records are equal to the originals, and no renderer invoked any store write or delete |
| `FEED-16` | Given a commit that only modifies an existing file, when changes are read, then its path appears in `changed` and in neither `added` nor `removed` |

**Not in the automated suite, run deliberately:**

- **The real corpus repo.** The suite builds its own throwaway repositories so it
  stays fast and hermetic. A run against
  `augment-it/clients/reach-edu/corpus` — the `augment-reach-edu` submodule, 886
  tracked files, real history back to at least 2026-07-24 — is gated behind a
  path env var and executed by hand. **What it proves is not correctness but
  usefulness:** whether the last ten changes, rendered as prose, are something a
  client could actually read. A green suite against synthetic fixtures says
  nothing about that.

## Acceptance

```
uv run python scripts/spec_status.py --spec Corpus-Change-Feed --require-green
```

exits 0, `bash scripts/check.sh` passes its blocking rungs, the deliberate run
above has been done, and the operator has walked the surface (Gate 4).

**The walk-through question is not "does it work."** It is: *reading this, would
a client understand what we did for them last month?* If the answer is no, the
spec passed and the feature failed, and the fix is likely in how sentences get
written rather than in this code.

## Open questions — resolved by default, 2026-08-22

Signed off by the operator with the observation that makes these answerable:

> The questions you have seem real but the reality is it is all kind of arbitrary
> because we only have corpora for two clients and neither of them have used it on
> their own, only me. I would imagine **any kind of record of activity is better
> than nothing.**

That is right, and it sorts the questions into one that is expensive to be wrong
about and three that are not. **Only the record shape and the `ChangeSource` seam
are costly to change later** — everything else is a filter or a renderer tweak,
measured in hours. So the three below take defaults now rather than waiting for
users who do not exist yet.

1. **Unit — a commit, or a week?** *Default: per change.* Grouping is a renderer
   concern and the record supports it. Revisit when someone says a day of commits
   reads as noise.
2. **Does a client see `inbox/` and `_discarded/`?** *Resolved: **both, no
   exclusions**.* The first draft proposed hiding `_discarded/` on the grounds
   that a reject pile invites an awkward conversation. **The operator overruled
   it, and was right:** *"discarded shows work too (it takes a lot of time to go
   through everything)."* Deciding a source does not belong **is** labour, and it
   is precisely the invisible labour this feed exists to surface. Hiding it would
   under-report the work. No filter — the feed shows the whole corpus prefix.
3. **History from before the feed existed?** *Default: no floor — show all of
   it.* Early subjects are developer-shaped and will render without a reason line
   per Behaviour 5. That is honest, and the sparseness is itself information about
   when the discipline started.

**The one that stays open, because it is the expensive one:** whether the
`Change` field set survives contact with a second engine. `FEED-14` is the test
that answers it, and it cannot be fully answered until a `KopiaChangeSource`
exists. Until then the seam is a bet, not a proof.

## Related

- [[../../../context-v/plans/Sync-Corpora-to-R2-and-Show-Clients-What-Changed]] — Phase 2, which this implements
- [[../loops/Spec-to-Shipped-With-TDD]] — the loop this spec is run through
- [[../contracts/Autonomy-Gates]] — where an agent stops
- [[Browse-Corpus]] — the sibling read-only surface, and the source of the never-drop-what-you-cannot-parse rule
- [[Storage-Seam]] — the same seam argument, made once already for storage
- `lossless-monorepo/context-v/reminders/Dates-Are-UTC-At-Rest-Viewer-Local-At-Render.md` — Behaviour 6
- `ai-labs/studies/sync-and-content-version-control` — where every engine scored *none* on this surface

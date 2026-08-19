---
title: "Source-File Model — the schema becomes code, and two silent failures become loud"
lede: "The schema as a round-tripping dataclass — the stray `---` that hid 13 of ImmuneCo's 93 sources is now a hard error, not a silent one."
date_created: 2026-08-08
date_modified: 2026-08-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Draft
spec_reference: "[[../plans/Corpora-Builder-MVP-R2-Native-With-Checkpoint-History]] — Phase 2"
tags:
  - Spec
  - Corpora-Builder
  - Frontmatter-Schema
  - Source-Curation
  - Phase-2
site_uuid: 3198ebde-726a-4eb4-8275-18f9805ffc99
hex_code: w7ug39
date_authored_initial_draft: 2026-08-08
date_authored_current_draft: 2026-08-08
publish: true
from: "corpora-builder"
from_path: "context-v/specs/Source-File-Model.md"
---
# Source-File Model

## Why Care?

Phase 1 moves bytes. This phase is where bytes become a *source* — and where the
corpus stops being a folder and starts being something a memo can be grounded in.

The schema is not up for redesign. [[Source-File-Schema-Reconciliation]] settled
it after three apps independently converged on the same shape, and its three
rulings are carried here verbatim. What this phase adds is enforcement, because
the schema being written down did not stop either of these:

**The ImmuneCo truncation.** A stray `---` on its own line mid-file closed the
frontmatter early, so 13 of 93 sources parsed as prose body. They were on disk
the whole time — a `grep` found them, a diff looked fine, only the parser
disagreed. Every consumer silently worked with 80 for three weeks. Dated to
2026-07-14, found 2026-08-08.

**The `sensitivity` strip.** A save payload omitted a field and the serializer
emitted only keys it recognised, so a round-trip deleted the flag governing
whether a source may be cited outside the firm. Eight sources were downgraded
from `internal_only` without anyone touching them.

Both are the same failure in different clothes: **the file said one thing and
the parser reported another, quietly.** A corpus that grounds client
deliverables cannot fail quietly. So both become loud here, with tests.

## Scope

**In:** the `SourceFile` dataclass and its canonical field order; frontmatter
read/write that preserves unknown keys; stranded-content detection; the
filename grammar; URL normalisation for dedup; the `binary_asset` block.

**Out:** fetching anything (Phase 3); the `live/` layout and checkpointing
(Phase 4); parsing extract *contents* — the body is carried verbatim and its
LFM directives are somebody else's parse; the `Domain` model beyond what a
source needs to reference one.

## Behaviour

1. `SourceFile` is a **dataclass**, matching `memopop-orchestrator`'s
   `src/curation/source_file.py`. Only `url` is required; every other field
   degrades gracefully. A file carrying nothing but a `url` is valid.
2. **Frontmatter key order is fixed, not alphabetical** — a `FIELD_ORDER` list —
   so a git diff of a curated file shows what changed rather than a reshuffle.
3. **Unknown keys survive a round-trip.** Anything the model does not recognise
   is preserved and re-emitted. The serializer never emits only-what-it-knows.
4. **Content after the closing fence is an error**, not silently-body. If YAML
   ends and more `key: value` lines follow that look like frontmatter, raise.
5. `fetched_at` (when we pulled it) and `published_at` (when it was written) are
   separate fields and never conflated.
6. `status` and `content_pulled` are **orthogonal**. `status` is the analyst's
   decision (`candidate | promoted | archived | rejected`); `content_pulled` is
   how much is on disk. A source may be `promoted` with `content_pulled: false`.
7. `verdict` is written by a person; `machine_verdict` by a machine. Nothing in
   this codebase may write `verdict`. Reachability is not approval.
8. The **body is carried verbatim.** An existing `# Extracts` section survives a
   rewrite untouched, and this phase never generates one. Quotes and stats are
   punctuation-heavy strings that break YAML; the markdown parse *is* the
   structured extraction, so there is no second copy to drift.
9. `binary_asset` is recorded **even when the download failed**, carrying
   `download_status` so a failure is a fact rather than an absence.
10. Filenames are `<YYYY-MM-DD>_<title-slug>.md`, falling back to the URL when
    untitled, with `_<n>` on collision. A binary sibling shares the stem.
11. **Aliases are read, not rewritten.** The real corpus predates the canonical
    schema: 637 of 845 reach-edu files carry `exact_url` rather than `url`, and
    179 carry `published_date` rather than `published_at`. Those are read into
    the canonical fields so the model can actually see them, and re-emitted
    under the key the file already used. Reading a corpus must never migrate it.
12. `normalize_url` is the dedup key: lowercase scheme and host, https over
    http, drop `www.`, strip default ports, drop tracking params, sort remaining
    params, drop the fragment.

## Tests

| ID | Given / When / Then |
|---|---|
| `SOURCE-01` | Given a `SourceFile` with every field populated, when it is rendered and read back, then the parsed model equals the original |
| `SOURCE-02` | Given a file whose frontmatter carries a key the model does not know, when it is read and re-rendered, then that key and its value are still present |
| `SOURCE-03` | Given a source with `fetched_at` and `published_at` set to different dates, when it round-trips, then both survive distinctly |
| `SOURCE-04` | Given `status: promoted` and `content_pulled: false`, when the source round-trips, then both values survive — the two axes are independent |
| `SOURCE-05` | Given a rendered file, when its frontmatter keys are read in order, then they follow `FIELD_ORDER` rather than alphabetical or insertion order |
| `SOURCE-06` | Given a source with `machine_verdict` set and `verdict` empty, when it round-trips, then `verdict` is still empty — no machine result is promoted to an analyst verdict |
| `SOURCE-07` | Given a file whose body contains an `# Extracts` section, when the model is read and re-rendered unchanged, then that section is byte-identical |
| `SOURCE-08` | Given a `binary_asset` whose `download_status` is a failure, when it round-trips, then the block and its failure status survive — a failed download is recorded, not omitted |
| `SOURCE-09` | Given frontmatter containing only `url`, when it is parsed, then it yields a valid `SourceFile` and re-renders without inventing fields |
| `SOURCE-10` | Given a source whose `sensitivity` is `internal_only`, when it round-trips through a caller that never mentions `sensitivity`, then the value is unchanged |
| `SOURCE-11` | Given a file using the Generation-A key `exact_url` (or `published_date`), when it is parsed, then the canonical `url` (or `published_at`) is populated from it |
| `SOURCE-12` | Given such a file, when it round-trips, then it is re-emitted under its ORIGINAL key — reading a corpus never silently migrates its schema |
| `SOURCE-13` | Given a parsed file, when it is re-rendered unmodified, then no modelled default is added that the file did not already carry |
| `PARSE-01` | Given a file with a stray `---` mid-frontmatter followed by more `key: value` lines, when it is parsed, then a `StrandedContent` error is raised naming the first stranded key |
| `PARSE-02` | Given a well-formed file whose body legitimately contains `---` as a horizontal rule, when it is parsed, then no error is raised and the body is preserved |
| `PARSE-03` | Given a file with no frontmatter at all, when it is parsed, then it yields a `SourceFile` with an empty url and the whole text as body |
| `PARSE-04` | Given plain markdown with no frontmatter, when it is parsed and re-rendered, then it is byte-identical — a corpus holds READMEs and notes, and reading one must not graft frontmatter onto it |
| `NAME-01` | Given a title and a fetch date, when a filename is built, then it is `<YYYY-MM-DD>_<title-slug>.md` with the slug lowercased and punctuation collapsed to single dashes |
| `NAME-02` | Given a source with no title, when a filename is built, then the slug falls back to the URL rather than to "untitled" |
| `NAME-03` | Given a filename that already exists in the target, when a second is built, then it gains a `_2` suffix before the extension and the binary sibling shares the stem |
| `URL-01` | Given URLs differing only by scheme, `www.`, trailing slash, default port, fragment, or tracking params, when each is normalised, then all produce the same key |
| `URL-02` | Given two URLs differing in a meaningful query parameter, when each is normalised, then they produce different keys — normalisation must not over-collapse |
| `CORPUS-01` | Given the PROVING-CORPUS, when every markdown file is parsed, then all parse without error and the count matches the files on disk |

**Not in the automated suite, run deliberately:** `CORPUS-01` is gated behind
`CORPORA_PROVING_CORPUS`, like `STORE-14`. It is the test that matters most —
845 real markdown files written by three different generations of tooling are a
harsher parser test than anything hand-written.

## Acceptance

```
CORPORA_PROVING_CORPUS=../augment-it/clients/reach-edu/corpus \
  uv run python scripts/spec_status.py --spec Source-File-Model --require-green
```

exits 0 and `bash scripts/check.sh` passes its blocking rungs.

## Open questions

0. **Cosmetic rewrite on first write.** Measured against the PROVING-CORPUS
   2026-08-08: rendering a parsed file changes **0 of 845 semantically** — no key
   lost, no value altered — but **840 of 845 textually**, because PyYAML
   normalises quote style (`"reach-edu"` → `reach-edu`) and `FIELD_ORDER`
   reorders keys. The reordering is deliberate; the re-quoting is PyYAML being
   PyYAML.

   Consequence: the first time anything writes to an existing corpus file, git
   shows a large diff for no semantic change. Two ways out, undecided —
   **accept it** as a one-time normalisation after which diffs are clean, or
   **adopt `ruamel.yaml`**, which round-trips formatting faithfully at the cost
   of a dependency and a slower parse. Nothing writes to a corpus until Phase 3,
   so this can wait — but not past then.

1. **Does `normalize_url` need to match memopop's `canonical_url` exactly?** Not
   for this phase — corpora-builder is not yet consumed by anything else, and
   the operator deferred cross-app convergence. Recorded because the day a
   second writer appears, a silent dedup mismatch is the failure mode.
2. **Excerpt length.** 200 chars, carried from the blueprint, still untested
   against how an analyst actually triages. Open question 4 there, unchanged.
3. **Should `authors` be parsed into structured names?** No. Publisher metadata
   is inconsistent enough that a list of strings is honest and a parsed name is
   a guess.

## Related

- [[Source-File-Schema-Reconciliation]] — the schema this implements, and its three rulings
- [[Storage-Seam]] — Phase 1, what these files are written through
- `memopop-ai/context-v/handoffs/2026-08-08-Source-Approval-Shipped-Enforcement-Unrun.md` — where both enforced bugs were found
- [[../loops/Spec-to-Shipped-With-TDD]] · [[../contracts/Autonomy-Gates]]

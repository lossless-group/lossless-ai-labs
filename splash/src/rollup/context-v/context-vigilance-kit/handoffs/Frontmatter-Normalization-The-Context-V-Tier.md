---
site_uuid: 7a5005d0-a2a7-48cb-8054-2bd1be395754
hex_code: 25e2eo
title: "Frontmatter Normalization — The Context-V Tier"
lede: "The changelog tier was mechanical: dates in filenames, write-once entries, outward-facing by default. None of that is true here. 753 living documents across 41 repos, where the date has to come from git, the lede has to be written, and `publish: false` does not keep a document out of the corpus."
summary: "The procedure for bringing `context-v/**.md` onto the frontmatter standard, written after completing the changelog tier. Covers what makes this tier different in kind from changelog work, the per-repo order, the date-derivation rule when no filename date exists, why the lede is authoring rather than normalization, and the publish-gate asymmetry between the two Chroma ingesters that makes `publish: false` misleading on a context-v document. Read alongside [[Frontmatter-Normalization-Remaining-Repos]], which covers the changelog tier and the three traps that still apply."
publish: true
date_created: 2026-08-17
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
status: In-Progress
tags:
  - Frontmatter
  - Normalization
  - Handoff
  - Context-Vigilance
  - Graphiti
  - Chroma
  - Publish-Gate
from: "context-vigilance-kit"
from_path: "context-v/handoffs/Frontmatter-Normalization-The-Context-V-Tier.md"
---
# Frontmatter Normalization — The Context-V Tier

## Why care?

The point of this work is not tidiness. It is that **Graphiti and Chroma read
frontmatter**, and a corpus spanning 40+ repos is only as retrievable as its
metadata. A document with no date lands at the wrong point in the temporal
graph. A document with no `lede` returns a bare title in a search hit. A
document with no `site_uuid` mints a fresh node on every re-ingest, so its
history through the graph is unrecoverable.

The changelog tier is where this started. It is now done to the extent it can
be — see [[Frontmatter-Normalization-Remaining-Repos]]. **This tier is larger
and different in kind.**

## How this differs from the changelog tier — read before starting

Four assumptions that held for `changelog/` all fail here.

| | `changelog/` | `context-v/` |
|---|---|---|
| **Filename carries a date** | Yes — `2026-04-27_01.md`. A guaranteed last-resort anchor. | **No.** `Maintain-Embeddable-Slides.md`. No fallback of any kind. |
| **Write-once** | Yes — initial and current draft stay equal forever. | **No.** Living documents revised over months; the editorial pair genuinely diverges. |
| **Outward-facing by default** | Yes — 364 `true` to 1 `false` tree-wide. | **No.** Individual repos run 47 `false` to 5 `true`. |
| **`publish: false` removes it from retrieval** | Yes, from the Graphiti episode set. | **No — and this is the trap. See below.** |

### The publish-gate asymmetry — the most important thing in this document

The two ingesters do **not** agree on what `publish: false` means.

```
scripts/ingest-changelogs-to-chroma.py   → skips `private: true` OR `publish: false`
scripts/ingest-changelogs-to-graphiti.py → skips `private: true` OR `publish: false`
scripts/ingest-to-chroma.py  (context-v) → skips `private: true` ONLY
```

`publish` appears **zero times** in `ingest-to-chroma.py`. Verified 2026-08-17.

So on a `context-v/` document, **`publish: false` does not keep it out of the
Chroma corpus.** It gates the published website. It does nothing else. Only
`private: true` excludes a context-v document from retrieval.

Two consequences, and both matter:

1. **Do not reach for `publish: false` as a confidentiality control on a
   context-v doc.** It will not do what it looks like it does. If a document
   genuinely must not be retrievable, it needs `private: true` — or, better per
   the standard, genericize the sentence and keep the document useful.
2. **There is an existing exposure worth checking first.**
   `ai-labs/dididecks-ai/context-v/reminders/Auth-Loose-Ends.md` carries
   plaintext passcodes and a production database hostname. `publish: false`
   was applied to it. That does not remove it from the corpus. Those
   credentials want rotating regardless, but the retrieval question is separate
   and immediate.

**Decide before sweeping** whether the asymmetry is intentional (context-v is
internal-by-nature, so everything is fair game for our own retrieval) or a
defect to fix in the ingester. The sweep's `publish` decisions mean different
things depending on the answer.

## Current state

**753 documents across 41 repos.** Excluding `context-v/skills/` (see the open
question below), **631 across 40**.

| Category | Files | Nature of the work |
|---|---|---|
| No frontmatter at all | **107** | Authoring — needs title, lede, dates, publish |
| Missing `date_created` | **104** | Mechanical — derive per the rule below |
| Missing `publish` | **405** | Judgment — one decision per document |
| Missing `lede` / `description` | **160** | **Authoring — cannot be scripted** |

Largest blocks:

| Repo | Total | No-FM | No-date | No-publish | No-lede |
|---|---|---|---|---|---|
| `context-v/skills` | 122 | 61 | 40 | 39 | 9 |
| `astro-knots` | 99 | 18 | 3 | 68 | 3 |
| `memopop-orchestrator` | 77 | 0 | 0 | 0 | 5 |
| `dididecks-ai` | 69 | 0 | 0 | 0 | 2 |
| `ai-labs` | 40 | 2 | 2 | 38 | 4 |
| `reach-edu-hub` | 32 | 1 | 4 | 31 | 0 |
| `fullstack-vc` | 28 | 0 | 0 | 0 | 18 |
| `content-farm` | 28 | 0 | 2 | 28 | 10 |
| `memopop-ai` | 28 | 6 | 5 | 17 | 0 |
| `calmstorm-decks` | 22 | 2 | 19 | 20 | 19 |

Note `memopop-orchestrator` (77) and `dididecks-ai` (69) are already swept —
they appear here only for their missing ledes, which the earlier sweep
correctly declined to fabricate.

## The procedure

### 1. Scope the repo — originals only

Roll-ups are derived. Editing one is always wrong, and a naive `find` surfaces
the corpus copy first. Exclude:

```
context-vigilance-kit/corpus/     lossless-changelog/src/stream/
*/splash/src/rollup/              site/src/generated-content/
mpstaton-site/src/content/context-v/
*/context-v/agent-skills/         */context-v/extra/     (gitignored)
```

Also exclude the **67 third-party pinned repos** under `ai-labs/studies/` —
enumerate them by remote, not by guessing:

```bash
find . -name .git -maxdepth 6 -not -path "*/node_modules/*" | while read g; do
  d=$(dirname "$g"); r=$(git -C "$d" remote get-url origin 2>/dev/null)
  case "$r" in *lossless-group*|"") ;; *) echo "${d#./}";; esac
done
```

**Enumerate a repo's `context-v/` directories from the filesystem, not from a
config.** Locating files by reading what a site renders finds only what the
site already points at — anything else is invisible to the sweep in exactly the
way it is invisible to the site. The changelog tier hit this: one repo had
split its log across two directories and each half looked complete from where
it stood. Walk the tree instead:

```bash
find . -type d -name context-v -not -path '*/node_modules/*' -not -path '*/dist/*'
```

### 2. Derive the date from git — there is no filename fallback here

This is the sharpest operational difference from the changelog tier. A
changelog entry always had `2026-04-27` in its name. A context-v document has
`Maintain-Embeddable-Slides.md`. **If frontmatter has no date, git is the only
honest source.**

Precedence, per the spec:

1. An existing frontmatter date on the file
2. A date in the filename or parent directory *(usually absent here)*
3. A date stated in the document body
4. `git log --diff-filter=A --follow --format=%ad --date=short -- <file> | tail -1`
5. `stat` — last resort, and treat it as suspect

**Never lead with `stat`.** Whole directories in this tree report a birthtime
from a bulk copy or machine recovery. The tell is a uniform birthtime across
files of obviously different ages.

For a *living* document, `date_authored_current_draft` is a real question, not
a copy of the initial draft. Use the last substantive commit
(`git log -1 --format=%ad --date=short -- <file>`), and **do not** use
`date_modified` — Obsidian bumps mtime on a mere file open, so it overstates
recency and is not evidence of a revision.

### 3. Check the consumers, not just the schema

The changelog tier taught this the hard way in `lfm`, and it applies here
wherever context-v is rendered.

**A lenient schema is not proof a change is safe.** Two independent things can
break:

- **The schema** — if a field is required and you remove it, the build fails.
  Loud and obvious.
- **The consuming code** — it reads a *list of field names in order* and takes
  the first that resolves. If that list was written before the newer field
  names existed, and a document depends solely on an old name, the value
  silently resolves to nothing. The build passes. The page renders. The field
  is just blank, and sorting treats it as absent.

The relaxed schema is the more dangerous case, because the strict one at least
fails loudly.

Repos that render `context-v/` and therefore need this check:
`mpstaton-site` (rolls context-v into a collection), any `splash/` site, and
`site/src/generated-content/`. **Verify by building before *and* after**, and
diff the rendered output — a zero-diff is the only real proof.

### 4. The lede is authoring — budget for it, don't script it

**160 documents have no lede.** This is the largest genuinely creative block in
the whole sweep, and no script can do it. A lede requires having read the
document and judged what is interesting about it.

Extraction produces garbage that then renders on exactly the surfaces the field
exists for. Real failures from a prior extraction pass in this tree:

| Symptom | Cause |
|---|---|
| `lede: "---"` | Captured a horizontal rule |
| `lede: "…allows each firm (e.g."` | Split on the period inside `e.g.` |
| `title: "Summary"` / `"Overview"` | Took the first `##` — four docs ended up sharing one meaningless title |

**If the document is a genuine stub, leave the lede empty.** An empty lede on
an empty document is accurate; an invented one is a promise the page cannot
keep.

Note `summary` is now a defined field too — agent-facing, distinct from `lede`.
It can be written in the same pass and is the more valuable of the two for
retrieval. Do not confuse them: `lede` earns a human's click and flows into
OpenGraph; `summary` tells an agent what the document is for and where it sits
in the workflow.

### 5. `publish` — one decision per document, and count first

No safe tree-wide default. Count the repo's own convention before deciding:

```bash
grep -rh '^publish:' --include='*.md' context-v/ | sort | uniq -c
```

Calibration from completed repos:

- **`memopop-orchestrator` ran 47 `false` to 5 `true`.** A content-only rule
  marked 26 documents publishable; a screened re-read kept 3. Substance and
  sensitivity run in the *same* direction — the meatier a context-v doc is, the
  more client detail it tends to carry.
- **`fullstack-vc`'s members-only session narratives are deliberately public.**
  Marking those `false` was wrong.

The rule is **genericize rather than hide**, and the document's job comes first.
If it is materially better with the specific names in it, keep them and set
`publish: false` — it stays in the repo for us. Variable and env-var *names*,
architecture, schemas, and candid post-mortems are all fine to publish.

**And remember the asymmetry:** on a context-v document `publish: false` is a
website gate, not a retrieval gate.

### 6. Identity fields — mint on originals only

`site_uuid` (lowercase v4) and `hex_code` (6 chars of `[a-z0-9]`) are
write-once. Generate with a command, never let the model type one — seven
`site_uuid` values already in this tree contain non-hex characters, each an
agent emitting a plausible-looking string.

```bash
uuidgen | tr 'A-Z' 'a-z'
LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c6; echo
```

Collect existing codes into a set before minting and add each new one as you
go. **Scope the collection grep** — a tree-wide grep times out and returns
empty, which reads as "no collisions" when it means "no data." Assert the set
is non-empty before trusting it.

**Mint on originals only.** Roll-up copies regenerate from the original and
inherit the value; that shared uuid is the feature — it is what distinguishes
"eight copies of one document" from "eight different documents." One blueprint
in this tree resolves to eight paths and correctly shares one uuid.

### 7. Order within a repo

1. **Mechanical first** — dates and identity. Additive, no judgment, verifiable.
2. **Build and diff** if anything renders the directory.
3. **`publish` pass** — read each document. Cannot be delegated: the permission
   classifier correctly blocks a subagent from flipping `false` → `true` on
   relayed authority.
4. **Ledes and summaries last** — the expensive, genuinely creative part.

Commit path-scoped at each stage. Every repo swept so far had unrelated dirt —
submodule pointers, lockfiles, concurrent sessions.

## Suggested repo order

**Start mechanical and self-contained**, to prove the pattern before spending
judgment:

| Repo | Files | Why first |
|---|---|---|
| `ai-labs/corpora-builder` | 13 | 2 mechanical, no renders, no client data |
| `ai-labs/memopop-ai` | 28 | 11 mechanical, already familiar from the changelog pass |
| `content-farm/plugin-modules/*` | ~28 | small, uniform, no client data |

**Then the large internal repos** — `astro-knots` (99, of which 68 are publish
decisions), `ai-labs` (40), `content-farm` (28).

**Client repos last, with the confidentiality screen**: `calmstorm-decks`,
`reach-edu-hub`, `chroma-decks`, `humain-vc-decks`, `lossless-decks`,
`eventcut-ai`. The `dididecks-ai` sweep moved 34 of 66 documents to internal —
expect a similar ratio and budget reading time accordingly.

**Lede-only repos** (`memopop-orchestrator` 5, `fullstack-vc` 18,
`dididecks-ai` 2, `content-farm` 10) are pure authoring and can be batched
whenever there is appetite for writing rather than sweeping.

## Open question — is `context-v/skills/` in scope?

**122 files, 101 mechanical, 61 with no frontmatter — the single largest block,
and excluded from the totals above pending a decision.**

The case for excluding it: those files are `references/*.md`, `README.md`,
`CLAUDE.md` — **skill internals that happen to live under a `context-v/`
path**, not context-v documents. This tree already excludes
`*/context-v/agent-skills/` on exactly that logic, since `SKILL.md` frontmatter
is a machine contract Claude Code parses. The same reasoning appears to apply
one directory up.

If in scope, the tier total is **753**. If out, **631** — and the exclusion
belongs in `context-vigilance/references/frontmatter-spec.md` so no future
audit re-surfaces it.

## See also

- [[Frontmatter-Normalization-Remaining-Repos]] — the changelog tier: what was
  completed, the three traps, and the resolver pattern
- [[Tidy-Context-Vigilance-Files-Across-All]] — the broader quality plan this
  sweep clears the way for
- [[Graphiti-Over-The-Lossless-Corpus]] — why the temporal anchors matter
- `context-v/skills/context-vigilance/references/frontmatter-spec.md` — the
  authority on the standard itself
- `context-v/skills/context-vigilance/references/status-discipline.md` —
  companion-field rules for `Shipped` / `Deferred` / `Superseded`

---
site_uuid: 7a5005d0-a2a7-48cb-8054-2bd1be395754
hex_code: 25e2eo
title: "Frontmatter Normalization — The Context-V Tier"
lede: "821 living documents: the date must come from git, the lede must be written, and `publish: false` does not keep a doc out of the corpus."
summary: "The procedure for bringing `context-v/**.md` onto the frontmatter standard, written after completing the changelog tier. Covers what makes this tier different in kind from changelog work, the per-repo order, the date-derivation rule when no filename date exists, why the lede is authoring rather than normalization, and the publish-gate asymmetry between the two Chroma ingesters that makes `publish: false` misleading on a context-v document. Read alongside [[Frontmatter-Normalization-Remaining-Repos]], which covers the changelog tier and the three traps that still apply."
publish: true
date_created: 2026-08-17
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
date_authored_final_draft:
date_work_started: 2026-08-17
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.1.0.0
status: Partially-Shipped
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

The changelog tier is where this started and it is **complete** — all 436
entries, see [[Frontmatter-Normalization-Remaining-Repos]]. **This tier is
larger and different in kind.**

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

## Current state — updated 2026-08-17, mid-sweep

**The original counts in this document were wrong, and the correction matters.**
It said 753 documents / 631 excluding skills. The real figure was **948 / 825**.
The gap was almost entirely `ai-labs/augment-it` — **181 files** that landed
after this handoff was first written, and the single largest block in the tier.
**Re-audit from the filesystem before trusting any count in a handoff**; a stale
inventory silently scopes work out.

Scope now settled at **821 documents** (`context-v/skills/` excluded by decision,
see below; the count moved from 825 as stubs were deleted and documents written).

### Progress this session

| Field | Was | Now | How |
|---|---|---|---|
| No frontmatter at all | 38 | **0** | blocks created, bodies untouched |
| `hex_code` | 788 | **4** | generated, never typed |
| `site_uuid` | 776 | **4** | as above |
| `date_authored_current_draft` | 594 | **50** | := `initial_draft` where absent |
| `date_authored_initial_draft` | 551 | **50** | `date_modified` if within 7d of `date_created`, else `date_created` |
| `date_created` | 101 | **28** | own-repo git first-commit |
| `publish` | 581 | **581** | untouched by design — see below |
| `lede` | 183 | in progress | authoring |

The residual 4 identifiers are the hard-denied `site/` files. Integrity after
~1,800 field writes: **0 broken frontmatter blocks, 0 duplicate keys, 0 non-ISO
dates, 0 inverted editorial pairs, 0 invalid identifiers in scope.**

### Decisions taken (do not re-litigate)

1. **`context-v/skills/` is OUT of scope.** Codified as rule 9 in
   `frontmatter-spec.md`. Removes 123 files and ~101 phantom gaps from every
   future audit. This was the "open question" at the bottom of this document; it
   is now closed.
2. **The publish-gate asymmetry is INTENTIONAL and ratified.** On a context-v
   document `publish` gates the website only. Chroma and Graphiti deliberately
   read everything. **Do not "fix" `ingest-to-chroma.py`.** `private: true` is the
   sole retrieval control. Codified in the spec.
3. **`habits/` is a real experimental folder**, now codified in the
   `context-vigilance` skill: a habit is an obligation with a trigger and a scope
   (*do X, on this trigger*), where a reminder is a correction (*when you do X,
   do it this way*).
4. **Never derive a date over an existing frontmatter value.** Two errors were
   made this session doing exactly that by hand — a README habit backdated by 7
   months, and a spec by 10 days. The *scripts* never did it; they refuse by
   construction. **Hand-authoring was the weak link, not automation.**

### The migration trap — dates predate their repos

context-v files move: a parent pseudomonorepo gets created, or a child repo is
carved out (memopop split into four). **The owning repo's first commit is then
the date of the MOVE, not of authorship.** Measured: 36 documents demonstrably
lived in another repo first, gaps up to **407 days**.

Handled by never overwriting an existing `date_created` — a migrated file carries
its date along. Cross-repo archaeology was considered and rejected: it would have
changed exactly one of 64 files, by 20 days. Evidence preserved in
`context-v-cross-repo-dates.csv`.

**But where the date was ALREADY wrong, this matters commercially.** Five
augment-it documents claimed `2026-05-18` while git proved authorship in
July–August 2025 — understating a live client engagement by ~10 months. Corrected
2026-08-17. **When a client repo's dates are evidence of work performed, check
them against the pre-move repo's history before quoting them.**

## What the changelog tier learned that applies here

Four things, in descending order of how much they will cost if ignored.

### 1. The publish flag is not an aggregation control — and this tier is where that bites hardest

The changelog sweep ended with a client's confidential fundraise position on a
live public URL. Cause: a private client repo had marked its entries
`publish: true`, meaning "publish on the client's own gated site," and a public
roll-up script read that flag as consent.

Both roll-up scripts now gate on repository visibility and on whether the source
is client work, default-deny and failing closed. **But context-v is the richer
target.** Changelog entries describe what shipped; `context-v/` holds the specs,
plans, and explorations — the reasoning, the alternatives rejected, the client
detail that motivated a decision. If an aggregation boundary is going to leak
something expensive, it leaks it from here.

Before setting a single `publish` value in this tier, confirm which roll-ups
consume the repo and what they do with the flag.

### 2. Visibility is necessary but not sufficient

`reach-edu-hub` is a **public** repo and a named client engagement. A gate that
checks only repository visibility will pass it. "Private" and "confidential" are
different properties — client work is excluded structurally, by where it lives in
the tree, not by whether GitHub calls the repo private.

### 3. Screen before setting publish, never after

Setting the value and screening afterwards is precisely how the leak happened.
On every repo swept after that lesson the screen ran first, and it earned its
keep: a memo pipeline enumerated by company name, an LP share-label naming a real
firm, a lead investor in four incidental asides, and an internal deal-directory
layout.

The screen is three greps — credential-shaped assignments, known client and
portfolio names, financial figures — and takes under a minute per repo.

### 4. Trap 1b: a lenient schema hides a broken consumer

Recorded in full in the changelog handoff. The short version: a schema that
requires nothing still lets the *consuming* code break, because that code walks
a list of field names that may predate the editorial convention. Found live, with
the newest entry rendering at the bottom of a list.

**This tier has more of these waiting.** Roughly fourteen `context-v/` page
chains across the splashes still do not know the editorial keys. They are not
broken yet only because this tier is unswept — the moment a context-v document
depends solely on `date_authored_*`, they blank. Fix the chains *before*
sweeping, not after. The changelog tier proved that order matters.

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

## ~~Open question~~ — RESOLVED 2026-08-17: `context-v/skills/` is out of scope

Those files are `references/*.md`, `README.md`, `SKILL.md` — **skill internals
that happen to live under a `context-v/` path**, authored against the
skill-authoring contract rather than this spec, with the loader as their consumer
rather than a rendered surface or a retrieval layer. Same logic that already
excludes `*/context-v/agent-skills/`, one directory up.

**Codified as rule 9 in `context-vigilance/references/frontmatter-spec.md`** so no
future audit re-surfaces it. An audit that counts them reports ~123 extra files
and ~101 phantom gaps.

## Remaining work

Two blocks, both genuinely non-mechanical, plus cleanup.

### 1. `publish` — 581 decisions

**Untouched, deliberately.** Cannot be mechanized; requires reading each document.
This is the field that put a client's fundraise position on a public URL during
the changelog tier.

- **Screen before setting, never after.** Three greps per repo. The credential
  screen has already run tree-wide over `context-v/` and came back clean apart
  from `dididecks-ai/context-v/reminders/Auth-Loose-Ends.md` (now `private: true`).
- **Count the repo's own convention first** — the split is not uniform.
  `memopop-orchestrator` runs 73 `false` to 8 `true`; `dididecks-ai` is ~50/50;
  the five `ai-labs/studies/*` repos have **no `publish` key at all**, so every
  one there is a fresh judgment with no convention to inherit.
- **Client repos last:** `calmstorm-decks`, `reach-edu-hub`, `chroma-decks`,
  `humain-vc-decks`, `lossless-decks`, `eventcut-ai`, `the-water-foundation`.

### 1b. The confidentiality screen — RUN AND CLEARED, 2026-08-18

All eight client-facing repos screened before any `publish` value was set. Do not
re-run this from scratch; re-run only what has changed since.

**Visibility, checked with an UNAUTHENTICATED API call** (an authenticated call
succeeds against private repos and defeats the purpose):

| Repo | Visibility |
|---|---|
| `reach-edu-hub` | **PUBLIC** |
| `fullstack-vc` | **PUBLIC** |
| `calmstorm-decks`, `chroma-decks`, `humain-vc-decks`, `lossless-decks`, `eventcut-ai`, `the-water-foundation` | private |

**Credential + high-entropy screen: zero hits across all eight.** The only
credential exposure in the whole tier remains `dididecks-ai`'s `Auth-Loose-Ends.md`,
already gated with `private: true` and pending credential rotation.

**`reach-edu-hub` — cleared by the operator, 2026-08-18.** The screen surfaced
REACH's live fundraise position in six `pitch.md` files: $25M goal over three
years, $6M committed, Carnegie Corporation ($2M) and Schusterman named as
committed funders, ~$3M in motion, an August 2026 cohort close, and enrollment
scaling 3,400 → 7,500. Two of those documents self-label "(Internal)". All of it
sits in a public repo.

**Operator ruling: fine to publish.** REACH is a non-profit running a public
campaign and is not protecting these figures. **Do not flag this again**, and do
not genericize it — the specificity is the point in a fundraising narrative.

Two things that follow from the ruling rather than contradict it:

- **The "(Internal)" labels in those two titles are now misleading.** They say
  Internal in a public repo about material deliberately published. Worth removing
  so the next reader does not trust the label over the reality.
- **A passcode on the deployed site does not protect the GitHub repo.** These are
  different surfaces, and the screen must check repository visibility rather than
  assume the site's auth covers the source. That assumption is what would have let
  this pass unexamined.

The other 272 financial hits in `reach-edu-hub` are **publicly reported
philanthropy figures with footnote citations** to Fortune, Forbes, and press
releases — funder-landscape research, not client confidences. A naive
`\$[0-9]+M` grep flags all of them; do not treat that count as a finding.

**`fullstack-vc`** — clean. One financial hit, a survey quote. The repo
self-describes as build-in-public.

### 2. Ledes — 183, of which 151 warrant one

~243,000 words to read, median 1,241 per document. The 5 genuine stubs get **no
lede** — an invented one is a promise the page cannot keep.

**Do the publish call and the lede in the SAME read.** The blueprint sequences
them as separate passes, but both require reading the document, and a sharper
lede comes out of having just decided whether the thing is publishable — both
questions turn on "what is actually interesting here." Two passes means reading
151 documents twice.

Composition: 55 study profiles (uniform, no client data — the right place to
start), 35 narratives (fullstack-vc all-hands + calmstorm — **client**),
45 reminders/issues/plans, ~46 other.

### 3. Cleanup carried forward

- **Rotate the credentials** in `Auth-Loose-Ends.md`. `private: true` removes it
  from retrieval; it does **not** remove the passcodes and production Turso
  hostname from git history. Only rotation does.
- **[[Malformed-Site-UUIDs-At-Source-In-Content-Repo]]** — 6 invalid `site_uuid`
  values whose sources live in `content/`. Roll-up regeneration propagates them
  rather than fixing them.
- **Two template files carry unparseable dates** — `YYYY-MM-DD` and `2026-MM-DD`.
  Instructive for a human, but `z.coerce.date()` yields `Invalid Date` rather than
  rejecting, and the `lenient*` helpers only preprocess `''` and `null`. Latent
  build bug if either template ever lands in a rendered collection.
- **The roll-up is likely to be rebuilt** from GitHub CMS / CDN endpoints so
  content reaches the website and splash pages directly. Whatever replaces the
  current script inherits the invalid-identifier problem above.

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

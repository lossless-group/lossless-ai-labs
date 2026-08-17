---
site_uuid: dc046628-0c3a-417a-86c0-5b8198918a1c
hex_code: 5p7nj9
title: "Frontmatter Normalization — Remaining Repos"
lede: "The legacy `date:` key is retired from every changelog in the tree and the build-breaking trap is gone — but 'no legacy key' turned out not to mean 'conforms to the standard.' 143 entries across 25 repos still lack the editorial pair or any frontmatter at all."
summary: "Tracking document for the tree-wide frontmatter normalization sweep. Records which repos are complete, the fresh per-repo audit of what remains, the three repo-specific traps that are not inferable from the standard, the resolver pattern that makes a `date:` rename safe in an Astro site, and the worked precedent for retiring the legacy key and minting identity fields in one pass. Read this before starting any frontmatter work in the tree; it supersedes its own earlier file counts, which double-counted third-party pinned repos. The two frontmatter-spec references it points at are the authority on the standard itself — this document only tracks state and hazards."
publish: true
date_created: 2026-08-15
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-15
date_authored_current_draft: 2026-08-17
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.4.0
status: Partially-Shipped
tags:
  - Frontmatter
  - Normalization
  - Handoff
  - Context-Vigilance
  - Agent-Sweeps
  - Publish-Gate
from: "context-vigilance-kit"
from_path: "context-v/handoffs/Frontmatter-Normalization-Remaining-Repos.md"
---
# Frontmatter Normalization — Remaining Repos

## Why care?

A tree-wide audit found markdown files missing `date_created` or lacking
frontmatter entirely. Six repos have since been swept. This document hands off
the rest.

The important part is not the file list — it's the **three repo-specific traps**
below. Each was discovered by nearly breaking something, and none is inferable
from the standard. Trap 1 now has a **proven remedy**, applied three times.

## Current state

### What is finished, and what "finished" does not mean

**The legacy `date:` key is retired from every changelog frontmatter in the
tree.** Zero remain. The only surviving occurrence is inside a fenced
documentation example in `banner-site`, which is body text and correctly left
alone. The build-breaking trap is gone with it — no content collection anywhere
still declares a required `date`.

**That is not the same as the changelog tier conforming to the standard, and
this document previously conflated the two.** The sweep targeted repos by
*rename count*. Repos that had skipped straight from no-convention to
`date_created` — never using `date:` at all — registered zero renames and were
never visited.

**143 entries across 25 repos remain**, of 435 total:

| | Files | Nature |
|---|---|---|
| Missing the editorial pair | **130** | Mechanical — derive from `date_created` |
| No frontmatter at all | **13** | Authoring — needs a title and a written lede |

Largest: `self-host-stack` (23), `self-host-stack/hubs/lossless-at` (23),
`content-farm/plugin-modules/perplexed` (14), `astro-knots` (12),
`context-v/skills` (9), `content-farm` (8), `hypernova-site` (7),
`ai-labs/id-didi-sh` (7), `chroma-decks` (7).

**Enumerate a repo's content directories before assuming there is one.** Do not
locate entries by reading the collection config — that finds only what the site
already renders, and anything the config does not point at is invisible to the
sweep in exactly the way it is invisible to the site. Walk the filesystem
instead:

```bash
find . -type d -name changelog -not -path '*/node_modules/*' -not -path '*/dist/*'
```

A repo can also split its log across two directories, with each half looking
complete from where it stands. That is worth checking for its own sake, not
just for the sweep — the halves can be visible to different audiences.

### 137 entries swept, 11 repos

| Repo | Files | Commit | Scope |
|---|---|---|---|

| Repo | Files | Commit | Scope |
|---|---|---|---|
| `ai-labs/context-vigilance-kit` | 12 | `b5c3673` | full |
| `ai-labs/dididecks-ai` | 85 | `c68bd8c` | full |
| `ai-labs/memopop-ai/apps/memopop-orchestrator` | 100 | `e35d919` | full |
| `astro-knots/sites/fullstack-vc` | 58 + 32 | `d3da15f` + *uncommitted* | **full** — `context-v/` swept earlier; changelog legacy key retired and identity minted 2026-08-17 |
| `astro-knots/sites/dark-matter` + nested `changelog` repo | 29 + 4 | *uncommitted* | changelog renames + `context-v/` frontmatter |
| `astro-knots/sites/banner-site` | 12 | *uncommitted* | changelog renames |

Plus, from this session: `mpstaton-site` (8), `memopop-ai` (14),
`image-gin` (10), `lfm` (9), `arthouse-site` (4), `lmstud-yo` (3),
`metafetch` (2), `eventcut-ai` (1), `ai-labs` (13). All committed and pushed.

**The `context-v/` tier is handed off separately** — see
[[Frontmatter-Normalization-The-Context-V-Tier]]. It is 753 documents across 41
repos and differs in kind: no filename dates, living documents, and a
publish-gate asymmetry that makes `publish: false` mean something different
there.

### `fullstack-vc` is complete — and is the worked precedent

The repo that forced this document's original exception is now the furthest
along, and its changelog is the **first in the tree to carry identity fields**.

- **29 legacy `date:` keys deleted** (28 entries + 1 release). This was a
  deletion, not a rename: every entry already carried
  `date_authored_initial_draft` with an identical value — verified 28/28 with
  zero mismatches *before* touching anything.
- **32 entries given `site_uuid` + `hex_code`**, generated from a real RNG. All
  32 uuids are valid v4, all 32 hex codes match `[a-z0-9]{6}`, zero duplicates
  among themselves and zero against the 9 that already existed elsewhere (41
  hex codes tree-wide, 41 distinct).
- **Build verified with the legacy key fully absent** — the first time the
  fallback chain carried the whole load rather than sitting behind `date`.
  Rendered dates diffed **byte-identical** to the pre-sweep baseline.

The one-pass script that did both lives at
`scripts/` in spirit but was run from the session scratchpad; its two guards are
what make it safe to reuse:

1. **Refuse to delete `date:` unless the editorial key exists AND the values are
   equal.** Anything else is reported and skipped, never guessed at.
2. **Collect every `hex_code` already in the tree into a set before minting,**
   and add each new one to that set as it goes — so a collision cannot slip
   through within the run or against existing files.

Note the second guard matters more than it looks: a naive tree-wide `grep` for
existing codes **times out** on this corpus and silently returns nothing, which
would read as "no collisions" when it actually means "no data." Scope the grep to
directories that plausibly contain the key, and sanity-check the count is
non-zero before trusting a uniqueness result.

### The earlier counts were inflated — read this before quoting a number

This document previously reported *652 files across 47 repos*. That number
**double-counted third-party pinned repos.** `ai-labs/studies/` contains 67
foreign upstream repos (`vectorize-io/hindsight`, `getzep/graphiti`,
`apache/arrow`, `jgm/pandoc`, …). They are **not ours to edit**, and one of them
alone (`hindsight`) contributed 48 changelog files to the old total.

**Any audit of this tree must exclude, at minimum:**

```
node_modules/  .git/  dist/  .astro/  .vercel/
ai-labs/studies/**                        # any repo whose origin is NOT lossless-group
context-vigilance-kit/corpus/             # roll-up
lossless-changelog/src/stream/            # roll-up
*/splash/src/rollup/                      # roll-up
site/src/generated-content/               # generated
mpstaton-site/src/content/context-v/      # roll-up
*/context-v/agent-skills/                 # vendored copies of canonical skills
*/context-v/extra/                        # gitignored scratch
ai-labs/augment-it/  content/             # operator-excluded
```

Enumerate foreign repos with:

```bash
find . -name .git -maxdepth 6 -not -path "*/node_modules/*" | while read g; do
  d=$(dirname "$g"); r=$(git -C "$d" remote get-url origin 2>/dev/null)
  case "$r" in *lossless-group*|"") ;; *) echo "${d#./}";; esac
done
```

**Roll-up hygiene is already correct** and needs no fix: `sources.md` only walks
for `context-v/` directories, which foreign repos don't have, and
`ingest-changelogs-to-chroma.py` skips `/studies/` outright. Hindsight's 48
changelog entries enter neither corpus. Our own studies' `context-v/` *is*
captured, which is right.

## The standard

Do not restate it from this document — **read the source**, which is now
accurate:

- `context-v/skills/context-vigilance/references/frontmatter-spec.md`
- `context-v/skills/changelog-conventions/references/frontmatter-spec.md`

Both skills auto-load in a fresh session. Point agents at those file paths as the
authority rather than pasting rules into prompts — inconsistent restatement
between batches is what produced the only real errors in this sweep.

Required keys, in brief:

| Scope | Keys |
|---|---|
| `context-v/**.md` | `date_created`, `date_modified`, `publish` |
| `changelog/**.md` | `date_authored_initial_draft`, `date_authored_current_draft`, `publish` |

Both specs now also define `summary` (agent-facing counterpart to `lede`) and the
write-once identity pair `site_uuid` / `hex_code`. Those are optional but should
be written on **new** files going forward; retrofitting them is a separate
directed pass with its own hazard (see *Identity fields* below).

## The three traps

### 1. A key rename can break a build — and there is now a fix for it

`date:` → `date_authored_initial_draft:` is sanctioned **for changelog entries
only**, and in an Astro site it is not safe by default.

**The failure has two shapes, and the second is worse:**

- **Hard failure.** A collection declaring `date: z.coerce.date()` — *required* —
  fails validation on every entry the moment the key is renamed. The build exits
  non-zero. Loud, but at least obvious.
- **Silent failure.** Index pages commonly filter on `entry.data.date` being
  truthy (`.filter(e => e.data.title && e.data.date)`). An entry that survives
  validation without the key **silently vanishes from the changelog index**.
  Nothing announces it. `banner-site` and `dark-matter` both had this.

**Status: RESOLVED tree-wide.** No content collection anywhere still declares a
required `date`. Verified 2026-08-17.

| Repo | State |
|---|---|
| `fullstack-vc`, `dark-matter`, `banner-site`, `mpstaton-site` | Fixed — schema tolerant, renderers resolve through a fallback chain |
| `twf_site`, `reach-edu-hub`, `memopop-site` (`lenientDate`) | Were already lenient |
| Everything else | No schema reads `date` |

Re-run the check before trusting this, since a new collection can reintroduce it:

```bash
grep -rn --include="*.ts" -E "^\s*date:\s*z\.(coerce\.)?date\(\)\s*,?\s*$" . | grep -v node_modules
```

**But see 1b below — this check alone is not sufficient.**

#### The remedy — applied three times, now routine

1. **Make every date spelling optional** in the collection schema — `date`,
   `date_authored_initial_draft`, `date_authored_current_draft`, `date_created`,
   `date_modified`, each `.nullable().optional()`. Nothing date-shaped stays
   required.
2. **Add a resolver** returning the first key that parses, falling back to the
   `YYYY-MM-DD` in the entry id. Reference implementations:
   - `astro-knots/sites/fullstack-vc/src/lib/changelog-date.ts`
   - `astro-knots/sites/banner-site/src/utils/changelog-date.ts`
   - `astro-knots/sites/dark-matter/src/lib/dates/resolveEntryDate.ts`
3. **Route every renderer through it** — including sort comparators
   (`entryDateMs`) and truthiness filters (`hasEntryDate`). Miss a filter and you
   get the silent failure above.
4. **Then** rename the keys.

**Check the legacy key FIRST in the precedence chain.** Not deference to the old
standard — it makes the change provably zero-diff (entries carry both keys with
identical values during transition, so no rendered date can move), and a
hand-authored `date` is more trustworthy than a `stat`-derived editorial key
(trap 2). Once `date` is dropped from a file the editorial keys take over with no
code change. That is what makes the rename file-at-a-time rather than a flag day.

**Verification that actually proves something** — build at three points and diff
the rendered output:

```bash
pnpm build                      # baseline, before any change
# ...apply schema + resolver...
pnpm build && diff <before> <after>   # plumbing must be ZERO-diff
# ...apply renames...
pnpm build && diff <before> <after>   # must STILL be zero-diff
```

For an **SSR** site a passing build only proves schema validation — it does not
prove the page renders. Run the server and drive the routes:

```bash
pnpm dev --port 4399
curl -s localhost:4399/changelog | grep -c "Invalid Date\|NaN"   # must be 0
```

`dark-matter` renders changelog SSR and needed exactly this; its three views
(`/changelog`, `/changelog/variant-1`, `/changelog/variant-3`) plus detail pages
were driven live before the work was called done.

#### 1b. A LENIENT schema is not proof the rename is safe — the harder variant

Trap 1 as scanned above finds *strict* schemas. `lfm` proved that is only half
the check, and the half that fails loudly.

`lfm`'s splash schema accepted every date spelling and even falls back to
storing raw frontmatter when validation fails. The scan said "clean." It was
the most dangerous repo in the sweep.

The exposure was in the **consumer**, not the schema. Both changelog pages
resolved a date through a list of field names, taking the first that resolves:

```js
date_modified ?? date_first_published ?? date_created ?? date
```

`date_authored_initial_draft` is not on that list — the list was written when
`date` was the newest spelling that existed. And
`changelog/2026-04-22_01.md` carried **only** `date:`.

Renaming it away would have left the chain nothing to resolve: build passes,
page renders, entry appears — with a **blank where the date was**, and a sort
key of `0` sinking it to the bottom of the index. No error, no warning, no log
line. Detectable only by opening that one page.

**The strict schema is the safer case.** It fails loudly and you fix it. The
lenient one lets the problem through silently.

**The check is therefore two questions, not one:**

1. Does any schema *require* the key being removed? *(build failure)*
2. Does every chain that reads a date know the editorial keys — and does any
   file depend **solely** on the key being removed? *(silent blank)*

**The remedy:** append the editorial keys to the end of each chain, preserving
existing precedence, and verify that change is zero-diff **on its own** before
renaming any content. Worked example in `lfm/splash/src/pages/changelog/`.

Any consumer written before the editorial convention landed has this blind
spot. Grep for chains, not just schemas:

```bash
grep -rn "date_modified ??\|date_created ??\|\.data\.date\b" src --include="*.astro" --include="*.ts"
```

### 2. Filesystem dates lie — `stat` is the last resort

Whole directories in this tree carry a birthtime from a bulk copy or machine
recovery rather than from authorship. Observed: ~100 changelog entries spanning
five months all reporting `created=2026-05-06`, and release-notes files reporting
the birthtime of *the day the sweep ran* while git dated them nine months earlier.

Source precedence, per the spec:

1. existing frontmatter on the file
2. a date in the filename or parent directory name
3. a date stated in the document body
4. `git log --diff-filter=A --follow --format=%ad --date=short -- <file> | tail -1`
5. `stat` — and treat the result as suspect

The tell is a uniform birthtime across files of obviously different ages.

### 3. `publish` is a judgment, and its default is repo-specific

There is **no safe tree-wide default.** Tree-wide the split runs roughly 2:1
toward `true`, but individual repos run the other way, deliberately. Count before
deciding:

```bash
grep -rh '^publish:' --include='*.md' context-v/ | sort | uniq -c
```

Two calibration points from this sweep:

- **`memopop-orchestrator` ran 47 `false` to 5 `true`.** A content-only rule
  ("real content → true") marked 26 documents publishable; a screened re-read
  kept 3. Substance and sensitivity run in the *same* direction — the meatier a
  `context-v/` doc is, the more client detail it tends to carry.
- **`fullstack-vc`'s members-only session narratives are deliberately public.**
  Participants consent; their headshots are already served by the site. Marking
  those `false` was wrong.

The rule is **genericize rather than hide**, and the document's job comes first:
if it is materially better with the specific names in it, keep them and set
`publish: false`. It stays in the repo for us. Variable and env-var *names*,
architecture, schemas, and candid post-mortems are all fine to publish.

## Suggested order

### ✅ Done 2026-08-17: `fullstack-vc` — 29 legacy keys retired, 32 entries given identity

See *`fullstack-vc` is complete* above for what was done and the two guards worth
reusing. **Uncommitted.**

⚠️ **Stage path-scoped when committing it.** `fullstack-vc`'s working tree also
holds an unrelated in-flight Turso migration (new `scripts/*-turso.mjs`, new
tool entries, `package.json`, and `context-v/issues/Retire-Legacy-Astro-DB-Layer-for-Direct-Turso-Access.md`).
`git add -A` there would sweep up someone else's work.

### ✅ Done — every rename, and every trap

All renames are complete and trap 1 is resolved tree-wide. The remaining work
is a different shape: entries that never used `date:` at all, and so never
registered as renames.

### Next: the editorial pair — 130 entries, mechanical

These carry `date_created` / `date_modified` but no `date_authored_initial_draft`,
so Graphiti anchors them on a filesystem date instead of an authored one.
Derive the pair from `date_created` and leave `date_modified` alone — it is
bumped by a mere file open and is not evidence of a substantive revision. For a
write-once changelog entry the spec expects both editorial dates to stay equal.

| Repo | Files |
|---|---|
| `self-host-stack` | 23 |
| `self-host-stack/hubs/lossless-at` | 23 |
| `content-farm/plugin-modules/perplexed` | 14 |
| `astro-knots` | 12 |
| `context-v/skills` | 9 |
| `content-farm` | 8 |
| `ai-labs/id-didi-sh` | 7 |
| `ai-labs/dididecks-ai/client-sites/chroma-decks` | 7 |
| `astro-knots/sites/hypernova-site` | 1 (plus 6 with no frontmatter) |
| …18 more repos | 1–5 each |

Mostly additive and low-risk, but **run the 1b check per repo** — several of
these render their changelog, and a lenient schema is not proof the change is
safe.

### Then: the no-frontmatter files — 120

| Repo | Files |
|---|---|
| `astro-knots` | 22 |
| `astro-knots/sites/hypernova-site` | 6 |
| `ai-labs/memopop-ai` | 6 |
| `astro-knots/sites/twf_site` | 4 |
| `content-farm/plugin-modules/perplexed` | 4 |
| `content-farm/plugin-modules/cite-wide` | 4 |
| `.` (lossless-monorepo root) | 4 |
| `ai-labs/dididecks-ai/client-sites/*` | 6 across three client repos |

**These are authoring work, not a script.** Each needs a written lede, and a lede
is written, never extracted (see the spec). Budget accordingly.

### Last: the 504 `publish` decisions

The judgment tier. Bulk sits in `calmstorm-decks` (39), `ai-labs` (39),
`reach-edu-hub` (31), `content-farm` (28). **Note the client-site repos** —
`calmstorm-decks`, `reach-edu-hub`, `chroma-decks`, `humain-vc-decks`,
`lossless-decks`, `eventcut-ai` are named client engagements and need the
confidentiality screen with the same care `dididecks-ai` needed (that sweep moved
34 of 66 documents to internal).

## Open scoping question — `context-v/skills/`

**The canonical skills tree is the single largest block: 102 mechanical, 61 with
no frontmatter.** It is deliberately excluded from the 331 total above, pending
an operator decision.

The case for excluding it: those files are `references/*.md`, `README.md`,
`CLAUDE.md` — **skill internals that happen to live under a `context-v/` path**,
not `context-v/` documents. This handoff already excludes `context-v/agent-skills/`
on exactly that logic (`SKILL.md` frontmatter is a machine contract Claude Code
parses). The same reasoning appears to apply one directory up.

If it should be swept, the tree total becomes **433**. If it is out of scope,
**331** stands and the exclusion belongs in the spec so no future audit
re-surfaces it.

## Operational notes

- **Edit originals, never rollups.** `context-vigilance-kit/corpus/`,
  `astro-knots/sites/lossless-changelog/src/stream/` and `splash/src/rollup/` are
  derived. A naive `find` for a repo name will surface the corpus copy first —
  resolve paths through `sources.md` or the changelog walker instead.
- **Stage path-scoped.** Every repo swept so far had unrelated dirt — submodule
  pointers, lockfiles, untracked scripts, concurrent sessions.
- **Watch for nested repos.** `dark-matter/changelog` is its own git repo inside
  `dark-matter`. Two commits, ordered: changelog first, then the parent (which
  will show a moved submodule pointer).
- **Frontmatter-only edits.** A `date:` inside a fenced code block in the body is
  not frontmatter. Detect the `---` fences and operate between them; a blind
  `sed s/^date:/.../` will corrupt documentation examples.
- **A mid-flight `publish` correction cannot be delegated.** The permission
  classifier blocks a subagent from flipping `false` → `true` on relayed
  authority, correctly. Whoever holds the operator's actual instruction must
  apply those edits directly.
- **Known spec defect:** *"never flip `publish` false → true"* cannot distinguish
  a standing decision from a value the current sweep wrote minutes earlier. It
  wants an explicit carve-out for values written by the running sweep.

### Identity fields — do NOT retrofit with a naive script

`site_uuid` / `hex_code` are now in both specs and in the templates, so **new**
files get them. A retrofit pass over the ~2,700 existing documents is an operator
decision, and a careless one is destructive: roll-up copies mean a `find`-based
pass would assign **different** `site_uuid`s to copies of the same document,
permanently breaking the dedup property that justifies the field. One blueprint
in this tree resolves to eight paths across originals, roll-ups, and generated
content — all correctly sharing one uuid today.

**`fullstack-vc/changelog` (32 entries) is the worked precedent for doing it
safely.** What made it safe: it was operator-directed, and it touched **originals
only** — `changelog/` in the source repo, never a roll-up path. Roll-ups
regenerate from the original and inherit the value, which is the correct
direction. Any future retrofit should follow the same rule: mint on the original,
let derivation carry it, and never walk a `corpus/`, `stream/`, `rollup/`, or
`generated-content/` path.

Also: **never let an agent type an identifier.** Seven `site_uuid` values already
in the tree contain non-hex characters (`…a2f98752z7b9`, `…396h-4rb4…`,
`y8f59v34-…`) — each a model emitting a plausible-looking string instead of
calling a generator. Use `uuidgen | tr 'A-Z' 'a-z'` and
`LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c6`.

## Known issues surfaced, not fixed

These change existing values rather than adding keys, so each needs its own
directed pass:

- **Broken ledes.** Seven were repaired by hand in `memopop-orchestrator`. More
  exist: `lede: "---"` where an extractor captured a horizontal rule, ledes
  truncated mid-sentence on the period inside `e.g.`, and six files whose `title`
  is `"Summary"` or `"Overview"` taken from the first `##`. A lede is written,
  never extracted — see the spec.
- **`summary:` used where `lede:` belongs** across most of `fullstack-vc`'s older
  changelog entries (22 of them). This is now a **name collision**, not just
  untidiness: the specs define `summary` as the agent-facing field. A renderer
  doing `lede ?? summary` — `fullstack-vc` has one — will render agent prose in a
  human slot on any file that adopts the new meaning without a `lede`. The fix is
  to write real ledes, not to shorten the summaries.
- **Date disagreeing with filename:** `dark-matter/changelog/releases/2025-12-06_01.md`
  carries `2025-12-25` — a 19-day gap. Preserved verbatim through the rename
  rather than guessed at. The filename is usually the better source.
- **Stale documentation teaching the old key:** `banner-site/changelog/2026-01-19_02.md`
  contains a fenced frontmatter example using `date:`. Left alone — rewriting a
  shipped changelog body edits a historical record — but it will keep teaching the
  deprecated spelling. Arguably wants relocating to a `context-v/` doc.
- **Three `memopop-orchestrator` entries dated 2025-04 appear to be 2026 entries**
  with a year typo propagated from filename into frontmatter. Fixing means
  renaming files.
- **Credential values committed:** `dididecks-ai/context-v/reminders/Auth-Loose-Ends.md`
  carries plaintext passcodes and a production database hostname. `publish: false`
  does not fix that — those want rotating.
- **Two unfixed access-control weaknesses** described in
  `dididecks-ai/context-v/specs/Calmstorm-Auth-Inventory.md`. Engineering bugs,
  not disclosure settings.

## See also

- [[Graphiti-Over-The-Lossless-Corpus]] — the other thread in this session; the
  frontmatter work directly improved its temporal anchors (undated changelog
  entries fell from 77 to 26).
- [[Tidy-Context-Vigilance-Files-Across-All]] — the broader quality plan this
  sweep clears the way for.
- `context-v/skills/context-vigilance/references/frontmatter-spec.md`
- `context-v/skills/changelog-conventions/references/frontmatter-spec.md`

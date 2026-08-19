---
site_uuid: be782923-68a6-49cc-860e-bf1000124262
hex_code: 5js64i
title: "Sweep for Frontmatter Consistency & Improvements"
lede: "The running order for a frontmatter sweep across 40+ repos — including the two steps that, taken out of order, published client material."
summary: "The reusable method for normalizing frontmatter across a pseudomonorepo tree, distilled from the changelog-tier sweep completed 2026-08-17. Covers the phase order and why each phase must precede the next, the four traps that are not inferable from the standard, the aggregation-boundary rule that makes `publish` unsafe as a disclosure control, the three-point build-diff that constitutes proof, and the script guards worth reusing. Read this before starting a sweep of any tier in any repo; read the two handoffs for the state of a specific tier."
publish: true
date_created: 2026-08-17
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
date_authored_final_draft:
date_work_started: 2026-08-15
date_work_completed: 2026-08-17
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.1.0.0
status: Shipped
tags:
  - Blueprint
  - Frontmatter
  - Agent-Sweeps
  - Context-Vigilance-Kit
  - Retrieval-Quality
  - Confidentiality
from: "context-vigilance-kit"
from_path: "context-v/blueprints/Sweep-for-Frontmatter-Consistency-&-Improvements.md"
---
# Sweep for Frontmatter Consistency & Improvements

## Why care?

**A frontmatter sweep is not tidiness.** Graphiti and Chroma read frontmatter, so
a corpus is only as retrievable as its metadata. A document with no date lands at
the wrong point in the temporal graph. A document with no stable id mints a fresh
node on every re-ingest, so its history through the graph is unrecoverable. A
document with no `lede` returns a bare title in a search hit.

That framing matters because it decides what "done" means. Done is not "every
file has the keys." Done is "every consumer can answer the question it was built
to answer."

**And a sweep is more dangerous than it looks.** It touches every document in a
tree, including documents about client work, and it sets a flag called `publish`.
Run in the wrong order it will put confidential material on the open internet —
which is what happened on 2026-08-17, and is why the phase order below is the
substance of this blueprint rather than a preamble.

## When to run one

- A tier (`changelog/`, `context-v/`) has drifted from the standard and a
  retrieval layer is about to read it
- A legacy key is being retired tree-wide
- New fields have been added to the standard and existing documents should adopt
  them going forward

**Not** as a side effect of unrelated work. A sweep is operator-directed, and the
`context-vigilance` skill's drift policy applies: observe, note, surface, don't
auto-fix.

## The running order

Each phase exists because doing it later costs more than doing it first. This is
the load-bearing part of the document.

### 1. Audit against the standard, not against your task list

Build the work list by checking every file against the spec — not by looking for
the thing you set out to change.

The changelog sweep declared itself complete when the legacy `date:` rename was
done. It wasn't: 143 entries across 25 repos had skipped straight from
no-convention to `date_created`, never used `date:` at all, registered zero
renames, and were never visited. They were found only by re-auditing against the
standard afterwards.

**Exclusions any tree-wide audit needs.** Get these wrong and the numbers are
fiction:

```
node_modules/  .git/  dist/  .astro/  .vercel/
*/corpus/  */src/rollup/  */src/stream/  */generated-content/   # derived
*/context-v/agent-skills/                                       # vendored
*/context-v/extra/                                              # gitignored
```

Plus every third-party pinned repo. Enumerate them by remote rather than by
memory — this tree has 67, and one of them alone contributed 48 files to an
early count:

```bash
find . -name .git -maxdepth 6 -not -path "*/node_modules/*" | while read g; do
  d=$(dirname "$g"); r=$(git -C "$d" remote get-url origin 2>/dev/null)
  case "$r" in *lossless-group*|"") ;; *) echo "${d#./}";; esac
done
```

### 2. Enumerate content directories from the filesystem

**Never locate files by reading a site's collection config.** That finds only
what the site already points at, which means anything else is invisible to you in
exactly the way it is invisible to the site.

One repo had split its changelog across `changelog/` and `src/content/changelog/`.
The site rendered one half; the corpus ingester — whose skip list starts with
`/src/` — read the other. Each half looked complete from where it stood.

```bash
find . -type d -name changelog -not -path '*/node_modules/*' -not -path '*/dist/*'
```

### 3. Screen for confidentiality — before setting any publish value

**This is the step whose order caused the incident.** Setting `publish: true`
across a repo and screening afterwards is how a client's fundraise position
reached a public URL.

Three greps, under a minute per repo:

```bash
# credential-shaped assignments
grep -rniE "(password|passcode|secret|api[_ -]?key|token)[\"']?\s*[:=]\s*[\"']?[A-Za-z0-9_/+.-]{8,}" changelog/ \
  | grep -viE "process\.env|import\.meta\.env|<your|placeholder|example"

# high-entropy strings
grep -rhoE "\b(gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,})" changelog/

# known client, portfolio, and investor names; financial figures
grep -rniE "\$[0-9][0-9,.]*\s?(M|B|k)|valuation|run rate|runway|ARR" changelog/
```

The named-entity grep needs a list, and the list is repo-specific. Build it from
the client's own material, not from memory.

**Genericize or gate — the choice is about the document's job.** If the specific
names are illustrative, replace them and keep the document public: memo slugs
demonstrating case-insensitive routing work identically as `Example-Company`. If
the specifics *are* the analysis — a post-mortem whose numbers carry the
argument — keep them and set `publish: false`. The document stays in the repo for
us.

### 4. Fix the consumers before renaming anything

Renaming a key breaks two independent things, and the obvious check only finds
one of them. See *Trap 1* and *Trap 1b* below. Fix chains first, prove that
change is zero-diff on its own, and only then touch content.

### 5. Mechanical first, judgment last

1. **Dates and identity** — additive, verifiable, no judgment
2. **Build and diff** if anything renders the directory
3. **`publish`** — one decision per document, cannot be delegated
4. **Ledes and summaries** — the expensive, genuinely creative part

Commit path-scoped at each stage. Every repo swept had unrelated dirt: moved
submodule pointers, lockfiles, another session's work in progress.

## The traps

### Trap 1 — a strict schema fails the build

A content collection declaring `date: z.coerce.date()` as *required* fails
validation on every entry the moment the key is renamed. Loud, obvious, easy to
scan for:

```bash
grep -rn --include="*.ts" -E "^\s*date:\s*z\.(coerce\.)?date\(\)\s*,?\s*$" . | grep -v node_modules
```

### Trap 1b — a LENIENT schema hides a broken consumer

**The scan for Trap 1 walks straight past this one, and it is the dangerous
half.**

A schema that requires nothing still lets the *consuming code* break. That code
walks a list of field names and takes the first that resolves:

```js
date_modified ?? date_first_published ?? date_created ?? date
```

Written before the editorial convention existed, that list has never heard of
`date_authored_initial_draft`. Retire `date:` from a file whose only date was
`date:` and the chain resolves to nothing. **Build passes, page renders, date is
blank, sort key is zero.** No error, no log line.

Found live on a splash where the newest changelog entry was rendering at the
bottom of the list, unnoticed.

**The strict schema is the safer case** — it fails loudly and you fix it.

The check is two questions:

1. Does any schema *require* the key being removed?
2. Does every chain that reads a date know the editorial keys — and does any file
   depend **solely** on the key being removed?

The remedy: append the new keys to the **end** of each chain, preserving
precedence, and verify that change is zero-diff before touching content. Grep for
chains, not just schemas:

```bash
grep -rn "date_modified ??\|date_created ??\|\.data\.date\b" src --include="*.astro" --include="*.ts"
```

One more layer: if the chain result is passed to `.toISOString()`, the new keys
must also be **declared in the schema** so they coerce to `Date`. Undeclared,
they arrive as raw strings through `.passthrough()` and the build dies.

### Trap 2 — filesystem dates lie

Whole directories carry a birthtime from a bulk copy or machine recovery.
Observed: ~100 entries spanning five months all reporting the same `created`
date. Derivation precedence, `stat` last:

1. Existing frontmatter on the file
2. A date in the filename or parent directory
3. A date stated in the body
4. `git log --diff-filter=A --follow --format=%ad --date=short -- <file> | tail -1`
5. `stat` — suspect

**Derive editorial dates from `date_created`, never `date_modified`.** Obsidian
bumps mtime on a mere file open, so it is not evidence of a substantive revision.

### Trap 3 — `publish` is a judgment with no safe default

Tree-wide the split runs ~2:1 toward `true`; individual repos run the other way
deliberately. Count before deciding:

```bash
grep -rh '^publish:' --include='*.md' context-v/ | sort | uniq -c
```

Substance and sensitivity run in the *same* direction — the meatier a `context-v/`
document is, the more client detail it tends to carry. One repo ran 47 `false` to
5 `true`, and a content-only rule ("real content → true") got 26 documents wrong.

## The aggregation-boundary rule

**`publish: true` is not authorisation to appear on a public aggregator.**

The flag is set by whoever authored the entry, for *their* repo's surface. A
private client repo can legitimately mark every entry `publish: true` meaning
"publish on the client's own gated site." A roll-up script that reads that as
consent will republish it to the world.

Roll-ups must gate on **repository visibility** and on **whether the source is
client work**, default-deny, failing closed.

**And visibility alone is insufficient.** A public repo can still be a client
engagement — "private" and "confidential" are different properties. Exclude
client work *structurally*, by where it lives in the tree, so a client added next
month is denied without anyone updating a list.

Detect visibility with an **unauthenticated** API call — a public repo returns
200, a private one 404, because an anonymous caller cannot see it at all. An
authenticated call succeeds against private repos and defeats the purpose.

Reference implementations: `ai-labs/splash/scripts/rollup-sync.ts` (container
rule) and `astro-knots/splash/src/loaders/rollupFetch.ts` (denylist + allowlist).

## What counts as proof

**Build at three points and diff the rendered output.**

```
pnpm build                                   # baseline, before anything
# ...schema + consumer chains...
pnpm build && diff <before> <after>          # plumbing must be ZERO-diff
# ...content changes...
pnpm build && diff <before> <after>          # must STILL be zero-diff
```

A zero-diff after the plumbing change is what proves the chain fix is safe in
isolation. Without that intermediate build you cannot tell a chain bug from a
content bug.

**For an SSR site a passing build proves only schema validation.** It does not
prove the page renders. Run the server and drive the routes:

```bash
pnpm dev --port 4399
curl -s localhost:4399/changelog | grep -c "Invalid Date\|NaN"   # must be 0
```

## Script guards worth reusing

Three, each of which caught something real:

**Refuse to act on ambiguity.** Deleting a legacy key is safe only when the
replacement exists *and the values match*. Anything else is reported and skipped,
never guessed at. This surfaced a file whose filename and frontmatter disagreed
by 19 days.

**Collect before minting.** Gather every existing identifier into a set before
generating new ones, and add each new one as you go, so a collision cannot slip
through within a run or against existing files.

**Assert your inputs are non-empty.** A tree-wide `grep` for existing identifiers
times out on a corpus this size and returns nothing — which reads as "no
collisions" when it means "no data." Scope the grep and refuse to proceed on an
empty set:

```python
assert taken, "refusing: existing-identifier set came back empty"
```

**Never let the model type an identifier.** Seven `site_uuid` values in this tree
contain characters that are not hex digits — each one an agent emitting a
plausible-looking string instead of calling a generator.

```bash
uuidgen | tr 'A-Z' 'a-z'
LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c6; echo
```

## Anti-patterns

- **Extracting a lede.** It is the one field that requires having read the
  document. Extraction produces `lede: "---"`, sentences broken on the period
  inside `e.g.`, and four documents sharing the title `"Summary"`.
- **Editing a roll-up.** They are derived. A naive `find` surfaces the corpus copy
  first; resolve through `sources.md` or the source repo.
- **Backfilling work dates.** Nobody remembers when work started six months ago,
  and a guessed timeline is worse than none.
- **`git add -A`.** Every repo had unrelated dirt.
- **Assuming a fix is live because it is committed.** It is live when it reaches
  the branch `.gitmodules` names, which is not necessarily the branch the repo is
  checked out on.
- **Fixing a submodule and stopping.** The parent's changelog holds copies of
  submodule entries.

## See also

- [[Frontmatter-Normalization-Remaining-Repos]] — the changelog tier, complete;
  carries the per-repo record
- [[Frontmatter-Normalization-The-Context-V-Tier]] — the tier still open, and why
  it differs in kind
- `context-v/skills/context-vigilance/references/frontmatter-spec.md` — the
  standard itself
- `context-v/skills/changelog-conventions/references/frontmatter-spec.md`

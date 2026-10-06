---
title: "The MVP Delta, and What 'A Version Per Audience' Actually Requires"
lede: "The editor half of the MVP is mostly built. The half that is the product, one document published to several audiences with proof that nothing leaked, has no code yet, two underspecified mechanisms, and one syntax in the spec that does not parse."
date_created: 2026-10-03
date_modified: 2026-10-03
date_authored_initial_draft: 2026-10-03
date_authored_current_draft: 2026-10-03
at_semantic_version: 0.0.0.1
status: Draft
publish: true
site_uuid: fa4345aa-0197-4d18-ad9b-70b4f9fbe68f
hex_code: hzfvf3
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
categories: Exploration
tags:
  - Exploration
  - Flave
  - MVP
  - Audiences
  - Clearance
  - Versioning
  - Gap-Analysis
from: "flave"
from_path: "context-v/explorations/The-MVP-Delta-and-Per-Audience-Versioning.md"
---
# The MVP Delta, and What "A Version Per Audience" Actually Requires

A review of `context-v/` against the code, written 2026-10-03 as a new
collaborator joins. It answers two questions: **how far is flave from its MVP?**
and **how does one file become a different version for each audience?** The
second one is the collaborator's particular interest, and it is also where the
spec is thinnest.

Everything below was checked against the repo at `1940770`, not paraphrased from
the spec. Where a claim was tested, the test is shown.

## 1. First, which MVP? The spec uses "v1" for two different things

| Where | "v1" means | Size |
|---|---|---|
| [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] §1.1 | **Clearance and audiences**, the small thing after the editor. *"Small once v0 exists, because it is a remark plugin and an output filter."* | Small |
| Same spec, §13 | **M0 through M8**: format, render, publish, edit, agent, data, trust, deck, paged. *"This is a large v1 and the spec should not pretend otherwise."* | Very large |

Both readings are in the master spec, and they conflict. §1.1 was added
later, at the owner's intervention (*"something quite simple should be way
better than the current vibe"*), and it says §13 *"is not a queue to start at the
top of."* So §1.1 wins, but §13 was never renumbered, and anyone reading the
milestone table first will think the MVP is nine milestones away.

**This review takes the MVP to be §1.1's v0 + v1**: the editor, plus the core
claim D-01 named as the only thing that justifies the product. In §13's terms,
that is **M2's claim**, carried on top of the editor that already exists:

> *"I produce five levels from one document (private notes, transcript, team,
> LP, public), **none of which drift**, and I can **prove** the public one
> contains nothing private."*

> [!tip] Recommendation
> Rename §1.1's tiers so they can't collide with §13: call them **MVP-editor**
> and **MVP-audiences**, or **v0 / v0.5**, and add one line at the top of §13
> saying its "v1" is the full roadmap, not the MVP.

## 2. What has actually shipped

### The editor half (§1.1 v0): mostly done

| v0 slice (§1.1) | Status | Evidence |
|---|---|---|
| 1 · The probe | ✅ Done | Live render loop; `pnpm prove` green |
| 2 · Full port | ✅ Done | Callout, CodeBlock, Table, Citation, Sources; 69 tests pass |
| 3 · Extensibility | ✅ Done | Trigger-pack registry; `MetricCard`, `Badge` registered without touching the dispatcher |
| 4 · Folders | ◐ Partial | Opens **one fixed** `workspace/` folder. No folder picker, `flave.yaml` not read |
| 5 · Styles | ✅ Done | Live `themes/lossless.css` editing, saved to disk |
| Tauri (un-cut by D-26) | ✅ Done on NixOS | Ubuntu path documented 2026-10-03, not yet run on Ubuntu |

Still open from the phase plans:

- **Owner sign-off on §1.1's slices.** Precondition 3 of
  [[Phase-0-The-Live-Render-Loop]], never met.
- **No codified browser drive.** Flagged in three changelog entries running.
- **Phase 2:** done conditions 4 (CSS token diagnostics while typing) and 5 (a
  second bundle sharing the theme) are not met.
- **Phase 1 (one operation set, four callers): not started.** It is not on the
  MVP path; it serves M3/M4. Worth saying, because "Phase 1" sounds like it comes
  next.

### The audience half (§1.1 v1, M2's claim): nothing

There is **no clearance, register, variant, audience, or publish code anywhere**
in `apps/`, `packages/`, `src-tauri/`, or `scripts/`. The only traces are the
four `--color-clearance-*` tokens in `theme.css`, which are reserved for this
feature and used by nothing yet.

That is not a criticism. §1.1 sequenced it after the editor on purpose (*"you
cannot test five audience versions of a document before you have documents"*).
But it means **the part of the MVP that is the product is 0% built.**

## 3. The delta, piece by piece

Every row is from §11.1 or M2. Sizes are relative (S/M/L), not estimates.

| Piece | Spec | Status | Size | Notes |
|---|---|---|---|---|
| `flave.yaml` with `publish.audiences` | §5.3, §11.1 | ❌ | S | Shape is fully specified; nothing reads it |
| Clearance marking on blocks | §11.1 | ❌ ⚠️ | S–M | **The specified heading syntax does not parse** (see §4.1) |
| Clearance inheritance + fail-closed default | §11.1 | ❌ | S | A tree walk; well specified |
| Register variants + fallback (`brief`→`full`→`verbatim`) | §11.1 | ❌ | S | `:::variant{register=…}` parses today; nothing selects |
| Audience filter: build only what publishes | §11.1 "redaction removes" | ❌ | M | The core module. Must be a **separate path**, not the editor's render (see §4.2) |
| `flave publish --audience X` | §1.1, §11 | ❌ | M | No CLI exists at all. **D-13 is open** |
| `html-single` output | §11 | ❌ | M | Svelte SSR already works in tests, so a start exists |
| Clearance scan over output bytes | §11.1 | ❌ | S–M | Mechanically simple once the filter exists |
| Per-audience preview in the editor | §11.1 | ❌ | S | An audience picker that re-renders through the same filter |
| Derived variants and staleness | §11.1 | ❌ ⚠️ | M–L | **Underspecified** (see §4.3) |
| Cross-audience diff | §11.1 | ❌ | S | Falls out of the filter |
| A record of what was published to whom | — | ❌ ⚠️ | S | **Not in the spec at all** (see §4.4) |
| Leak vectors | §11.1 | ❌ | varies | For the MVP, only `data-*` and HTML comments apply; charts, images, and SQL aren't built yet |

## 4. Versioning a file per audience, examined closely

### What the spec gets right

The model is sound, and it's worth restating in plain terms:

- **There is one file, not five.** Audience versions are not copies. They are
  *renditions* built from one source at publish time. That is the whole cure
  for *"knowledge workers write and rewrite and cut and paste."*
- **Two separate axes.** **Clearance** (who may see this fact:
  `private` → `team` → `lp` → `public`) is about safety and can be checked by a
  machine. **Register** (how it's said: `verbatim`, `full`, `brief`) is an
  editorial choice. An audience is a *(clearance, register, target)* triple.
  Keeping them apart is what makes "nothing private leaked" provable.
- **Fail closed.** An untagged block takes the most restrictive clearance among
  the declared audiences. Forgetting to tag something never publishes it.
- **Derived versions go stale; they are never silently regenerated.** A brief
  variant generated from the full one is marked stale when the full one changes.
  Regenerating shows a diff, so hand-edits survive.

### 4.1 The heading syntax in §11.1 does not parse, and it fails open

§11.1's example marks a section with a heading attribute:

```markdown
## Unit economics {#unit-econ clearance=team}
```

Tested against `@lossless-group/lfm` 0.6.0 on 2026-10-03:

```text
{"type":"heading", "children":[{"type":"text",
  "value":"Unit economics {#unit-econ clearance=team}"}], ...}
```

LFM has no heading-attribute syntax. The braces stay in the heading's text, so
**the clearance is never applied, and the literal text `clearance=team` would be
published in the heading.** That is the worst failure mode this feature can
have: a marking that silently does nothing. (§8.1's claim that *"explicit ids via
`{#id}` win over derived ones"* is false for the same reason.)

**The directive form works today:**

```text
:::section{clearance=private}  →  {"type":"containerDirective","name":"section",
                                    "attributes":{"clearance":"private"}, ...}
:::variant{register=brief}     →  {"type":"containerDirective","name":"variant",
                                    "attributes":{"register":"brief"}, ...}
```

> [!tip] Recommendation
> For the MVP, **mark clearance with directives only** (`:::section{clearance=…}`,
> or a `clearance` attribute on any container directive). That needs no upstream
> work. Heading attributes can follow as an upstream LFM PR, the same route D-16
> already recommends for footnotes and cross-refs, and the no-fork rule in §15
> requires it anyway. Either way, **add a lint that fails on any `{…clearance=…}`
> text left in a heading.** That turns this silent failure into a loud one.

### 4.2 The editor renders everything, so publish cannot reuse it

`FlaveMarkdown.svelte`'s fallback renders an unregistered directive's
**children**. That is the right behaviour for an editor (unknown syntax degrades
to its content), and it means `:::section{clearance=private}` displays its
content in the preview today.

It also means **publishing must not be "render, then hide."** §11.1 already
demands this (*"constructed output, never render-then-suppress"*). The code
makes it concrete: the audience filter has to prune the **MDAST tree before it
reaches the renderer**, and the published output must come only from the
pruned tree.

Related, and easy to miss: the renderer stamps **`data-src-start` /
`data-src-end` offsets on every block** for source mapping. §11.1 lists `data-*`
attributes as a leak vector, because they map straight back to internal
structure. The publish path needs a renderer mode that emits neither.

### 4.3 "Derived" and "stale" need a mechanism the spec doesn't give

§11.1 says derived variants record their source and go stale when it changes.
It does not say **how**, and the answer decides the file format:

1. **Where does "derived from" live?** The candidates are inline on the
   directive (`:::variant{register=brief derived-from=full source-hash=9f2c…}`),
   a sidecar file, or the `jj` history. Inline is the most legible to an agent
   (Principle: the bundle is plain files), at the cost of noisier diffs.
2. **What is "changed"?** A content hash of the source variant's normalized
   MDAST is the simplest rule that doesn't fire on whitespace edits. A hash of the
   raw bytes would flag a stale rendition every time someone re-wraps a line.
3. **Granularity.** Per variant block is the only granularity that gives a
   useful message ("the public summary of *Unit economics* is stale"). Per
   document would be noise.
4. **Who regenerates?** An agent, invoked by the user, producing a diff. It is
   never automatic. That follows from the spec; it just needs writing next to
   the mechanism.

**Recommendation:** inline attributes plus a normalized-MDAST hash, decided and
frozen *before* anyone writes a derived variant. §8.4's argument for freezing
block addressing at M0 applies identically: retrofitting provenance into
documents people already have is the migration that poisons a format.

> [!note] The honest split in M2's claim
> M2 promises two things. **"I can prove the public one contains nothing
> private"** needs the filter and the scan, which are well specified and fairly
> small. **"None of which drift"** needs this staleness mechanism, which is
> neither. They can ship separately: authored-only variants still give five
> provably-safe levels from one file, and drift detection follows.

### 4.4 Nothing records which version went to which audience

"Version" can mean three different things here, and the spec covers two of
them:

| Meaning | Example question | Covered by |
|---|---|---|
| **Per audience** (renditions) | "What does the LP see?" | §11.1, well |
| **Over time** (history) | "What did this section say last month?" | §8.2, `jj` |
| **Per delivery** (what was sent) | "Which version did the LP actually receive, and does it still match?" | **Nothing** |

The third is the one a knowledge worker gets burned by. It is also cheap: a
**publish log** written on every successful publish, with the audience, the
timestamp, the source state (a `jj` change id, or a git commit before `jj`
exists), the output's hash, and the scan result. That lets anyone answer *"is
what the LP has still current?"*, and it is exactly the shape of the
**structured change record** that
[[The-Flave-Document-Service-Not-A-Forge]] is waiting on. Building it here means
the document service inherits it instead of designing it twice.

Note that `.flave/cache/` (§5.2) is specified as *disposable*. Published
artifacts and their log must not live there.

### 4.5 A question the two-axis model leaves open

The model assumes an audience's text differs only by **register**. But a team
version and an LP version might both be `full` and still need different
*wording*, for example a different framing for investors. Today the only
answer is to split the content by clearance, which conflates "who may see this"
with "how we'd say it to them." That is the exact fusion §11.1 warns against.

This is **D-21** (fixed register ladder vs. open vocabulary) arriving from a
different direction. The recommendation to keep the ladder fixed for the MVP
still holds. Just close D-21 with this case written down, so the limit is a
decision, not a surprise.

## 5. A suggested order for the MVP-audiences build

Each step has a binary done-condition, in the same style as §1.1's v0 slices:

| # | Step | Done when |
|---|---|---|
| 0 | **Decisions:** owner signs §1.1; rename the tiers; close D-21 (fixed), D-13 (yes, CLI), D-04 (format version); pick the clearance syntax | Recorded in §14 |
| 1 | `flave.yaml` reader with `publish.audiences`, defaults when absent | A fixture bundle loads its five audiences |
| 2 | `selectAudience(tree, audience)`: a pure MDAST → MDAST function. Clearance inheritance, fail-closed, variant fallback | Unit tests: a `private` node never survives a `public` select; a missing `brief` falls back to `full`, never empty |
| 3 | Publish render mode with no `data-src-*`, no comments | Snapshot contains no `data-` attributes |
| 4 | `flave publish --audience X` → `html-single` | Five files from one fixture document |
| 5 | **Clearance scan**: output bytes vs. the content of every block above the artifact's clearance | Planting a private sentence in a public render fails the publish |
| 6 | Audience picker in the editor preview, through the same function | Switching audience changes the preview; no separate code path |
| 7 | Publish log | Each publish appends one record; "what did the LP get?" is one lookup |
| 8 | Derived variants + staleness (after §4.3 is decided) | Editing a `full` variant marks its derived `brief` stale in the editor and in `flave publish` |
| — | **Dogfood gate** (§13) | A real document published to a real external reader with the scan passing, and the bundle sent to a real collaborator who edits it |

Steps 1–5 are the provable-safety half of M2, and they are where §1.1's
"small once v0 exists" is true. Step 8 is the no-drift half, and it is the one
that needs design before code.

## See also

- [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]: §1.1, §5.2, §5.3, §8.1, §8.2, §11.1, §13, §14 (D-04, D-13, D-16, D-21)
- [[Phase-0-The-Live-Render-Loop]]: outstanding items, including sign-off
- [[Phase-2-The-Workspace-And-The-Files-Surface]]: done conditions 4 and 5
- [[The-Flave-Document-Service-Not-A-Forge]]: the structured change record the publish log should match
- `docs/getting-started/`: how to run what exists today

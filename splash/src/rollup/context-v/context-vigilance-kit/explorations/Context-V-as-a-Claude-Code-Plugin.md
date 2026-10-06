---
type: Explorations
title: "Context-V as a Claude Code Plugin"
description: "Making context-v conventions checkable with commands, hooks, and a status index, not just remembered."
lede: "The conventions are good and the agent still forgets them. A plugin turns context-v's workflows into commands and its frontmatter into queries — so a loop's preconditions get checked instead of remembered."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.1.0
status: Draft
tags:
  - Context-Vigilance
  - Claude-Code
  - Plugins
  - Slash-Commands
  - Loop-Engineering
  - Machine-Readable-Status
  - Spec-Driven
  - OpenSpec
publish: true
site_uuid: 765935b7-e154-4c6e-a47b-db6cf6c1264c
hex_code: da2e89
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
from: "context-vigilance-kit"
from_path: "context-v/explorations/Context-V-as-a-Claude-Code-Plugin.md"
---
# Context-V as a Claude Code Plugin

## Why care?

Context Vigilance works. Across 27 repos there are 1,166 `context-v/` documents, a
settled eight-folder taxonomy, and enough shared vocabulary that a fresh agent
session can orient itself in a repo it has never seen. That is the whole bet, and
it paid.

But every one of those conventions is enforced the same way: **an agent reads a
document and chooses to be conscientious about it.** That works beautifully for
one focused session and degrades exactly where it matters most — on a long
autonomous run, at hour three, on the fifth phase of a loop, which is precisely
when nobody is watching.

The fix is not more documentation. It is to take the parts of the practice that
are *already mechanical* and make them mechanical: **turn the workflows into
commands, and turn the frontmatter into queries.** A Claude Code plugin — call it
`cv` — is the packaging that makes that distributable across the tree instead of
re-explained per repo.

## The question

What is the smallest `cv` plugin that makes context-v's conventions *checkable*
rather than *recalled* — and which parts of the practice should deliberately stay
prose?

## Why we don't already know

Three things make this non-obvious.

**1. Most of context-v is genuinely judgment, and should stay that way.** "Lead
with the why." "Fork early; don't wait for too long." "Be generous reading
existing files, careful writing new ones." None of that compiles. A plugin that
tried to enforce the whole practice would be wrong about the practice. The
interesting question is the boundary, not the totality.

**2. The norms-not-rules ethos actively resists mechanization.** The skill says
so outright: *"Norms, not rules... consistency emerges when attention focuses."*
And the drift policy forbids auto-fixing inconsistencies as a side effect of
unrelated work. Any tooling here has to **report without normalizing** — a linter
that silently rewrites frontmatter would break a core rule of the practice and
create conflicts across the user's parallel agent sessions.

**3. We nearly reached for someone else's answer.** The prompt that produced this
doc was a live question: *do we need something like OpenSpec to make loop
engineering reliable?* Working through it (see below) landed on **no** — but the
reasoning surfaced exactly which one primitive we're missing, which is more useful
than either a yes or a generic no.

## What already exists (and how close it is)

More of this is built than it looks.

| Piece | Where | State |
|---|---|---|
| The conventions | `context-v/skills/context-vigilance/` | Mature — eight folders, frontmatter spec, status discipline, versioning |
| Corpus walker | `scripts/build-corpus-manifest.py` | Walks all 1,166 files; splits YAML from content; buckets by size |
| Skills inventory | `scripts/build-skills-manifest.py` | Tracks 27 skills against the Anthropic SKILL.md spec |
| Retrieval | `scripts/ingest-*.py`, `query-graphiti.py`, `smoke-test-chroma.py` | Four Chroma collections, ~28k chunks; Graphiti bet in flight |
| Loop definitions | `augment-it/context-v/loops/` | Four loops, one `status: Proven-Once` |
| Skill distribution | `context-v/skills/sync-skills-symlinks.sh` | Idempotent symlink sync |

**The gap is smaller and sharper than "build a plugin."** `build-corpus-manifest.py`
already opens every file in the corpus and finds the frontmatter block — then
counts its lines and **throws the contents away.** It reports `yaml_lines` and
`has_frontmatter: yaml_lines > 0`. It never reads a single *field*.

So the corpus manifest can currently answer *"how developed is this document?"*
(by `content_lines` bucket) but not *"where is this document in its lifecycle?"*
(by `status`). The walker, the traversal, the exclusion rules, the JSON emitter —
all done. What's missing is parsing the block it already located.

## The core gap — machine-readable status

`status:` is the load-bearing signal of the whole practice. The skill defines a
real lifecycle:

```
Draft → In-Review → Signed-Off → Implementing → Shipped
        · Partially-Shipped · Deferred · Stale · Superseded · Archived
```

with companion fields that must move in lockstep — `date_first_published` on
Shipped, `deferral_note` on Deferred, `superseded_by` on Superseded.

**Today that lifecycle is prose.** Nothing checks it. Which means:

- A loop's precondition — *"a Signed-Off spec with a phase decomposition"* — is
  enforced by an agent reading frontmatter and being honest about what it saw.
  Nothing stops a loop starting against a `Draft`.
- *"A directory full of `status: Draft` plans, half of which actually shipped, is
  a directory you can't trust"* — the skill names this failure and offers a manual
  sweep habit as the remedy.
- `spec_reference` links plans to specs, but nothing verifies the target exists,
  and nothing surfaces a spec whose plans have all shipped while it still says
  `Implementing`.

This is the one place where OpenSpec is unambiguously ahead. Not its delta specs
(`ADDED`/`MODIFIED`/`REMOVED` — real, but they solve brownfield spec churn, which
is not our current pain), and not its `Requirement:`/`Scenario:` grammar. The part
worth taking is **`openspec status --json`**: the agent doesn't reason about what
to do next, it *queries* and gets back `done` / `ready` / `blocked`.

We already have the fields. We are not reading them.

> **On adopting OpenSpec wholesale — the answer was no,** and our own study says
> why. `studies/open-specs-and-standards/context-v/profiles/Profile__OpenSpec.md`,
> under *When NOT to reach for this*: *"Pure greenfield prototyping where you're
> still finding the shape — the spec layer is overhead until requirements
> stabilize."* Worth revisiting once something has shipped a v0 and we are
> *changing* specs rather than writing them. Steal the status query now; leave the
> rest pinned in the study.

## The translation — four plugin primitives, four things we already have

The reason "make context-v a plugin" is the right frame is that Claude Code's
plugin primitives map almost one-to-one onto layers of the practice that already
exist:

| Plugin primitive | context-v layer | What it becomes |
|---|---|---|
| **Skills** | The conventions | Already done — `context-vigilance`, `changelog-conventions`, `git-conventions`. Bundling replaces `sync-skills-symlinks.sh` |
| **Slash commands** | The workflows | `/cv:new`, `/cv:status`, `/cv:ship`, `/cv:loop` — the rhythms currently re-typed as prose |
| **MCP server / CLI** | The corpus | `cv status --json` over frontmatter; the Chroma + Graphiti queries already scripted |
| **Hooks** | The gates | Precondition checks that fire without being remembered |

The skills layer is mature, the corpus layer is half-built, and the command and
hook layers don't exist. **That ordering is the roadmap.**

### The one that matters most: hooks

Skills and commands still route through agent conscientiousness — a skill has to
be loaded and heeded, a command has to be invoked. **A hook fires whether or not
the agent thought about it.** That is the only layer that actually closes the
"degrades on a long run" failure mode, and it is the layer we have zero of.

Candidates, in rough order of value:

- **Loop precondition gate** — refuse to enter an implement phase when the
  referenced spec is not `Signed-Off`. Turns the loop's stated precondition into
  an actual precondition.
- **Frontmatter validity on write** — catch the `revisions:` YAML trap the loop
  doc calls out by name (*"any list item containing `: ` breaks standard YAML
  parsers"* — it bit four files on the proving run, two of them pre-existing).
- **Status/companion-field coherence** — `Shipped` without `date_first_published`,
  `Superseded` without `superseded_by`.
- **Dangling `spec_reference`** — a plan pointing at a spec that moved or was
  renamed.

Note what is *not* on that list: anything that rewrites a file. Per the drift
policy, every one of these **reports and blocks; none normalize.**

## Options for form factor

### Option A — Scripts only, no plugin

Extend `build-corpus-manifest.py` to parse frontmatter fields and emit a status
index. Stop there.

**Pros:** smallest possible step; the walker already exists; the afternoon-sized
version of this whole doc; zero new distribution machinery.
**Cons:** still opt-in — an agent has to decide to run it. Doesn't close the
long-run degradation. No hooks, so no gates.

### Option B — Full `cv` plugin (skills + commands + hooks + MCP)

**Pros:** the complete translation; hooks make preconditions real; one install per
repo replaces symlink sync and per-repo CLAUDE.md restatement.
**Cons:** largest surface; the plugin manifest shape needs verifying against
current Claude Code docs before committing to it; risks over-mechanizing parts of
the practice that should stay prose.

### Option C — Status layer first, plugin shell later *(leaning)*

Ship the status index as a script (Option A), prove it against the real corpus and
against one loop run, **then** wrap the proven pieces in a plugin.

**Pros:** matches how `loops/` itself was validated — proven once, then codified.
Each step independently useful. The binary done-condition is available immediately
(*"does `cv status` correctly classify the 1,166 docs?"* has an answer; *"is the
plugin good?"* does not).
**Cons:** two passes over some of the work.

The bias toward C comes from the flave spec's own anti-loop reasoning, which
applies to building this as much as to building anything else: *"Agent
implementation is fast when there is a working reference to port, a binary
done-condition it can check itself, and a boring toolchain."* Option C has all
three. Option B has none of them yet.

## What would need to be true

- **A status index that beats the manual sweep.** Concretely: `cv status --json`
  reports every doc's `status`, its companion-field coherence, and dangling
  `spec_reference`s across all 1,166 files. Done-condition: it reproduces what a
  manual sweep would find, and finds things a manual sweep misses.
- **One loop run gated by it.** The loop doc's precondition checked mechanically
  rather than read. That is the proof this was worth doing.
- **Nothing auto-fixed.** If the first version of this normalizes frontmatter as a
  side effect, it has broken the practice it was meant to serve.

## Open questions

- **Where does `cv` live?** This kit is the obvious host, but the plugin has to
  install into repos that don't vendor the kit. Does it ship from a marketplace
  repo, or does every repo get the kit as a submodule?
- **Does `status` stay a display string?** The skill is explicit that it's
  *"a display string, not a machine enum."* A status query pushes toward enum
  discipline. That tension is real and should be resolved deliberately rather than
  by whoever writes the parser.
- **What happens to the 59 frontmatter-less files** when a gate starts caring? Are
  they grandfathered, or does the corpus need a pass first?
- **Do the four experimental folders** (`loops/`, `handoffs/`, `decisions/`,
  `contracts/`) get commands, or does mechanizing them freeze a shape that is
  deliberately still drifting?
- **Plugin manifest specifics** — the exact shape of a Claude Code plugin
  (`plugin.json`, `commands/`, `hooks/`, bundled `.mcp.json`) needs checking
  against current docs before Option B is costed. Treated here as a known-unknown,
  not a settled design.

## Related

- [[../../../augment-it/context-v/loops/Loop-through-Spec-Write-Plans-Implement-Test-Changelog-Commit]] —
  the loop whose preconditions this would enforce; `status: Proven-Once`
- [[../../../studies/open-specs-and-standards/context-v/profiles/Profile__OpenSpec]] —
  where the status-query idea comes from, and why we're not adopting the rest
- [[../../../flave-ai/context-v/specs/Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] —
  §1.1's anti-loop reasoning (binary done-conditions, boring toolchains)
- [[Graphiti-Over-The-Lossless-Corpus]] — the sibling bet on the *query* side of
  the corpus; temporal questions this status layer would not answer
- `scripts/build-corpus-manifest.py` — the walker that already finds the
  frontmatter and discards it
- `context-v/skills/context-vigilance/references/status-discipline.md` — the
  lifecycle a status index would encode

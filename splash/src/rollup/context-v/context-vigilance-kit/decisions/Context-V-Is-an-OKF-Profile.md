---
type: Decisions
title: "Context-V Is an OKF Profile"
description: "Context-v folders conform to Open Knowledge Format v0.2, with context-v's taxonomy, lifecycle, and IDs layered on top."
lede: "Any tool that reads Open Knowledge Format can read a context-v folder. The price is one frontmatter field and an index file."
publish: true
date_created: 2026-10-05
date_modified: 2026-10-05
date_authored_initial_draft: 2026-10-05
date_authored_current_draft: 2026-10-05
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Shipped
date_first_published: 2026-10-05
tags:
  - Decision
  - OKF
  - Interoperability
  - Frontmatter
  - Context-Vigilance
generated: { by: "human:mpstaton", at: 2026-10-05T22:54:45Z }
verified: { by: "human:mpstaton", at: 2026-10-05T22:54:45Z }
sources:
  - id: okf-spec
    resource: https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md
    title: Open Knowledge Format (OKF) v0.2
    last_modified: 2026-08-21T00:00:00Z
  - id: okf-v01
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf
    title: OKF v0.1, frozen snapshot
  - id: okf-guide
    resource: https://okf.md/spec/
    title: OKF, an annotated guide
site_uuid: f8825d50-bac2-4770-a381-0983db29c55e
hex_code: f65jrg
from: "context-vigilance-kit"
from_path: "context-v/decisions/Context-V-Is-an-OKF-Profile.md"
---
# Context-V Is an OKF Profile

## Why care?

Context-v is a folder of markdown files with YAML frontmatter. So is the Open Knowledge Format (OKF), an open spec from Google Cloud for knowledge that "people write, agents generate, and organizations exchange."[^okf-spec] OKF deliberately defines almost nothing: no taxonomy, no lifecycle, no body structure. Context-v is exactly those things. They stack.

Making context-v conformant means any OKF tool (visualizers, validators, other organizations' agents) can read a `context-v/` folder. It also means the kit can honestly say *this is a standard format with opinions on top*, not *learn our format*.

## The decision

**A `context-v/` folder is an OKF v0.2 bundle.** Context-v is a *profile* of OKF: it adds a folder taxonomy, a status lifecycle, four-part versions, and identity fields, and keeps everything OKF requires.

Decided 2026-10-05 by Michael Staton, after reading the v0.2 spec[^okf-spec], the frozen v0.1 text[^okf-v01], and an annotated guide[^okf-guide].

## What OKF requires, and where context-v stands

OKF v0.2 conformance has three rules:[^okf-spec]

1. Every non-reserved `.md` file has parseable YAML frontmatter. **Already true.** The kit's hook enforces it before writes to `context-v/`.
2. Every frontmatter block has a non-empty `type`. **The one real gap.**
3. `index.md` and `log.md`, when present, follow OKF's shape. **We use neither yet,** and `context-v/README.md` (no frontmatter) breaks rule 1.

## What changes

1. **`type` on every doc.** **The value is the folder's own name, plural, in Train-Case:** `type: Specs`, `type: Plans`, `type: Explorations`, `type: Issues`, `type: Decisions`, `type: Loops`, `type: Handoffs`, …. Type always matches the folder, so it's never a judgment call, and a check can verify it. Templates carry it, `/cv:new` and the shortcuts set it, and the hook requires it on new files. Existing docs get it in a deliberate pass, never as a side effect of other work.
   - **Folder types stay open.** Context-v's folders were always a starting set; people and agents create new ones when the work calls for it. OKF doesn't constrain that either, since it registers no types centrally.[^okf-spec] Two rules: folder names are plural, and a doc in any folder declares that folder's name as its `type` (`research-notes/` → `type: Research-Notes`).
2. **`index.md` replaces `context-v/README.md`.** It's in OKF's shape (headings plus a linked list with one-line descriptions, no frontmatter), and the root one declares `okf_version: "0.2"`. Folder-level `index.md` files are optional; `/cv:kickoff` reads them, and `/cv:reflect` keeps them current. They do for agents what the README did for people: a table of contents to read before opening anything.
3. **Map, don't rename.** Context-v keeps its own fields. OKF fields are added only where they carry something new:
   - `description`: the one-line summary OKF tools show in indexes and search.
   - `verified: { by: "human:<id>", at: … }`, written when `/cv:prep` records a sign-off. A human verifier makes the doc *human-reviewed* in OKF's trust tiers, so our sign-off gate becomes machine-readable.
   - `generated: { by, at }`, derivable from `authors` and the dates, and written when useful.
4. **`sources` and our hex-code citations are the same idea.** OKF keys per-claim footnotes to `sources[].id`, not positions, because "agents constantly rewrite these documents."[^okf-spec] That's the reason we use hex codes. A doc's citation keys serve as `sources[].id` values. This decision doc uses them.
5. **A reference in the context-vigilance skill (`references/okf.md`)** holds the mapping below.

## Status: keep ours, map for OKF readers

OKF v0.2 fixes `status` to `draft | stable | deprecated`, with absent meaning `stable`.[^okf-spec] Context-v uses the same key for a richer lifecycle. We keep ours, because it carries the workflow, and publish this mapping for OKF consumers:

| context-v `status` | OKF `status` |
|---|---|
| `Draft`, `In-Review` | `draft` |
| `Signed-Off`, `Implementing`, `Shipped`, `Partially-Shipped` | `stable` |
| `Stale`, `Superseded`, `Archived`, `Deferred` | `deprecated` |

An OKF tool reading a raw context-v doc sees an unrecognized status value. The spec forbids rejecting documents over unknown fields, but doesn't say how to read an unknown value of a known field. If that becomes a real problem, an export step can rewrite `status` on the way out, without touching the source.

## Alternatives passed over

- **Ignore OKF.** It costs nothing today. But the overlap is so large that staying incompatible would be a choice to be insular, and a gift to anyone who wants to fork the practice into OKF.
- **Adopt OKF wholesale, dropping context-v's fields.** It loses the lifecycle, versions, IDs, and folder taxonomy: the parts that make the practice work. OKF explicitly leaves those to producers.
- **Rename our `status` to avoid the clash.** It would break every existing doc and every reader of them, for one external consumer's benefit. The mapping costs less.
- **Generate a separate OKF export and leave context-v untouched.** Two copies drift. Conformance in place, at the cost of one field, is cheaper and keeps one source of truth.

## Still open

- **`agent-skills/` sits outside the bundle.** Skill files follow the Agent Skills spec, and adding `type` to `SKILL.md` may trip strict skill validators; their `references/` files have no frontmatter at all. OKF already expects schemas like `.proto` files to live beside a bundle, not inside it.
- **`extra/`** is scratch with no frontmatter, but it's gitignored, so a cloned bundle never contains it.
- ~~**Links.**~~ **Settled 2026-10-06: wikilinks stay.** OKF doesn't require any link style; conformance is frontmatter and `type` only. A repo declares its link syntax in `context-v/config.md` under `links:` (default: wikilinks, resolved by filename). OKF's reference visualizer only follows markdown links, which is a limitation of that demo tool; a 31-line patch makes it follow wikilinks too.
- **`log.md`.** Whether `/cv:reflect` also appends a `log.md` (OKF's per-folder change history) alongside `changelog/`.
- **Datetimes.** OKF timestamps are full datetimes with a UTC offset; our `date_*` fields stay date-only. OKF fields we add use OKF's form.

## As built (2026-10-05)

- Every template carries `type` (the folder's name) and `description`; a `decision` template and the `/cv:decide` shortcut are new.
- `/cv:new` and its shortcuts set `type` and add the doc's line to its folder's `index.md`.
- The frontmatter check requires `type` on new files and rejects one that doesn't match the folder. It skips `index.md`, `log.md`, and `config.md`.
- `/cv:init` writes an OKF-shaped `context-v/index.md` (declaring `okf_version: "0.2"`) instead of a README. `/cv:kickoff` reads the indexes first; `/cv:reflect` keeps them current.
- `/cv:prep` records a sign-off as `verified: { by: "human:<id>", at: … }`.
- `references/okf.md` in the context-vigilance skill holds the mappings and a conformance one-liner.
- This repo's `context-v/` has `type` and `description` on every doc, plus indexes. It passes the three conformance rules, and OKF's reference visualizer renders all six docs, including this one's *human-reviewed* trust tier and its sources.

**What the visualizer showed:** zero links between docs, because that demo tool follows only standard markdown links. That's a tool limitation, not an OKF requirement (see *Still open*, now settled).

## How we'll know it worked

- ✅ The kit's own `context-v/` passes OKF's three conformance rules.
- ✅ It opens in the OKF reference visualizer without errors.
- ⬜ A newly scaffolded repo (`/cv:init`, then `/cv:explore`) is conformant from the first doc. Waits on a first live install.

## Related

- [[Context-V-as-a-Portable-Plugin-Any-Agent-Can-Install|The portable-plugin exploration]]: the kit's design and its decisions log
- The frontmatter hook (`hooks/check-frontmatter.py`): where `type` becomes required

[^okf-spec]: Open Knowledge Format (OKF) v0.2
[^okf-v01]: OKF v0.1, frozen snapshot
[^okf-guide]: OKF, an annotated guide

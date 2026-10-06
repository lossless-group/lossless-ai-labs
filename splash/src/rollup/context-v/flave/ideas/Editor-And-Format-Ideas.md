---
title: "Ideas — the editor surface and the format"
lede: "Fifteen ideas captured from a working session, sorted by what they would actually cost. Four are nearly free because the groundwork already shipped; two need work upstream in lfm before flave can touch them; one is already an open decision in the spec under a different name."
date_created: 2026-08-21
date_modified: 2026-08-21
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Open
spec_reference: "[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]"
tags:
  - Ideas
  - Flave
  - Editor
  - Themes
  - Provenance
  - Vega-Lite
  - Linting
publish: true
site_uuid: dde8b507-cc63-423a-ab3f-e64d0be4dbfe
hex_code: 3r1gdh
date_authored_initial_draft: 2026-08-21
date_authored_current_draft: 2026-08-21
from: "flave"
from_path: "context-v/ideas/Editor-And-Format-Ideas.md"
---
# Ideas — the editor surface and the format

## What `context-v/ideas/` is

A **ninth folder**, outside the eight canonical ones, created 2026-08-21.

The distinction that earns it a folder: an **exploration** is a question you are
actively working ("should we adopt OpenSpec?"), and it ends when you know enough
to write a spec. An **idea** is a thing somebody wants that nobody has started
thinking about yet. Forcing ideas into `explorations/` makes that folder look
busy with work nobody is doing, and forcing them into `specs/` implies a
commitment that has not been made.

Ideas graduate: into an exploration when the question gets interesting, into a
spec section when the answer is known, or into the bin. Nothing here is
committed, and the cost estimates are the point — an idea whose groundwork
already shipped should not sit at the same priority as one that needs a new
plugin written upstream.

---

## Tier 1 — nearly free, because the groundwork already shipped

**Theme mode toggle (dark / light / vibrant).** `themes/lossless.css` already
defines all three: `[data-mode='dark']` at line 99, `light` at 146, `vibrant`
at 187, each with its own full token set including the callout tones added
2026-08-20. Nothing needs authoring — the app needs a control that stamps
`data-mode` on the root element. This is the single highest ratio of visible
change to work in the whole list.

**Theme applier as a dropdown.** The Files rail already lists `themes/`, and
§5.6 made the workspace theme library real. A dropdown is that list, plus
writing the chosen name into `flave.yaml`. The only genuinely new piece is
`flave.yaml` itself, which M0 has to freeze anyway.

**CSS linter in the editor.** `scripts/check-styles.mjs` already encodes both
rules — `:global()` in a plain stylesheet, and `var(--token)` that `theme.css`
does not define. Today it runs at proof time. The Phase 2 plan already names
surfacing it as an editor diagnostic; this idea is that, and the rule does not
need to be rewritten, only re-hosted in `@codemirror/lint`.

**YAML linter in the editor.** Same shape. `scripts/check-frontmatter.mjs`
already parses every frontmatter block and checks required keys. In-editor it
becomes live diagnostics, and once `flave.yaml` has a schema it validates
against that too.

> [!success] Why these four are grouped
> Each one is a **re-host, not an invention.** The rule, the token set, or the
> file list already exists and has been exercised. That is a different kind of
> work from the tiers below, and mixing them on one backlog hides it.

---

## Tier 2 — editor surface and ergonomics

**Resizable columns, by mouse or keyboard.** Worth stating explicitly that this
does **not** breach §7.2's capability ceiling. The ceiling forbids mouse-driven
**document layout**, because drag handles must emit positional CSS into the
document. A pane splitter emits app chrome — nothing enters the `.flave`
bundle. The rule is "the mouse reads *the document*", not "the mouse is inert."
Worth writing into §7.2 so nobody re-litigates it later.

**Keyboard bindings cheatsheet.** This is the mitigation §7.2 already knew it
owed. Removing drag made the frame vocabulary undiscoverable, and the command
palette was the only proposed answer. A cheatsheet is the second answer, and it
composes with D-27's rail: it could be a third rail view rather than a modal.

**Resizable document body, responsive preview, snap to standard sizes.**
The most interesting idea in this tier, because **snapping to standard sizes is
`deck` and `paged` arriving through the back door.** §7.1 defines three
surfaces; a width control that snaps to A4, US Letter, or 16:9 is previewing
those geometries before the surfaces are built. Cheap version: a draggable width
with a few named stops. Expensive version: real page geometry, which is M8.
Worth being deliberate about which one is being asked for.

---

## Tier 3 — data, provenance, and variables

**YAML that demonstrates provenance from a DB or API.** This is the §1 thesis —
*"a document that keeps its workings"* — at its sharpest, and §5.2 already
reserves `data/_sources.yaml` for exactly it. The unresolved part is not the
file format but the **liveness question**: a value fetched from an API is either
frozen with its fetch timestamp and hash, or it is live and the document's
claims change without anyone editing it. D-19 already parks the network tier
behind the trust tier for that reason. Recommend the frozen-with-provenance form
first; it is most of the value and none of the risk.

**Reference section populated from `sources.json`.** Note what already exists:
as of 2026-08-21 the renderer builds a Sources bibliography from
`tree.data.citations`, which lfm assembles from footnote definitions in the
markdown. A `sources.json` would be a **second** source of the same section, and
two sources for one rendered thing is the drift shape §5.5 warns about. The
version worth building is a merge with a stated precedence, or `sources.json` as
the store the markdown *references* rather than duplicates.

**Standardised variable syntax pulling from data in the `.flave` package.**
Genuinely new, and probably the biggest idea here. Prior art worth reading
before designing: Decile Hub's `custom_data_points` / variables system is a
merge-tag model for exactly this problem, documented in the
`decile-hub-connector` skill. The hard questions are what happens when a
variable does not resolve (blank, error, or last known value), and whether a
variable can carry a clearance — because a private number leaking through a
public variable is precisely the §11.1 failure the clearance scan exists to
prevent.

**Vega-Lite charts styled to match.** §6.3 already resolved the chart tier
(Observable Plot default, Vega-Lite where a spec suffices). The *"with styles to
match"* half is the new idea and the good one: a chart that ignores the theme is
a foreign object in the document. Mechanically this is generating a Vega-Lite
config from the same tokens `theme.css` carries — which is the tokens pipeline
(§5.5, D-20) earning its keep on a second output. Note this makes the tokens
pipeline more valuable than it looked, and D-25 says hand-edited CSS stays legal
until that pipeline exists.

---

## Tier 4 — rich content

**Code snippets that toggle between languages.** A trigger-pack, and a good
first non-trivial one — tabs over sibling fenced blocks. Needs no renderer
change, which makes it a useful proof that the extensibility story holds for
something with state.

**Bare link handling with OpenGraph.** ⚠️ **Needs upstream work in lfm.**
`src/plugins/Bare-Link-Provider-Catalog.md` documents 7 providers (4 stable, 3
planned) and describes the plugin's behaviour precisely — *"walks paragraph
nodes, finds the bare-URL signal, tries each provider's matchers in order, and
on first hit replaces the paragraph with a `leafDirective`"* — but
**`remark-bare-link` itself does not exist**. The catalog is a specification
with no implementation. lfm does ship `lfm-og-fetcher` and `lfm-link-preview`,
both opt-in, and OG fetching needs network access, which D-19 parks behind the
trust tier.

**Video embeds and bare video links.** Same blocker, same catalog: `youtube-video`
is `status: stable` in the document, and the taxonomy already covers
`video | short | playlist | audio | tweet | gist | embed`. **The good news is
that the output shape is a `leafDirective`, which flave's trigger-pack registry
already renders** — so once the plugin exists upstream, video embeds are a
component plus one line of registration, exactly like `::badge`.

**Image APIs and CDNs.** Touches `assets/_manifest.yaml` (§5.2) and the existing
`prep-images-for-embed` skill, which already encodes the measured
content-negotiation result — upload JPEG, never WebP — and the alt-text
discipline. The tension to resolve: §5.2 says the bundle *carries* its assets,
and a CDN URL means it does not. Probably both, with the CDN as a publish-time
optimisation rather than a storage decision.

---

## Tier 5 — trust

**Signatures.** ⚠️ **Already an open decision under a different name.** §14's
**D-11** — *"Do we sign bundles?"* — is OPEN with the recommendation *"defer,
reserve manifest space."*

Worth disambiguating before this goes further, because two different products
are hiding in one word:

1. **Bundle signing** — cryptographic provenance: this `.flave` came from whom
   it claims and has not been altered. That is D-11, and it pairs with §10's
   capability model and the "I open a stranger's `.flave` and nothing can hurt
   me" claim at M6.
2. **Document signatures** — a human signing a document's *contents*, the way a
   contract is signed. Entirely different: an audience-facing feature with legal
   weight, closer to the publishing story than the trust story.

If the second is what was meant, it is a new decision and not D-11.

## See also

- [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] — §5.2, §5.5,
  §5.6, §6.3, §7.1, §7.2, §11.1, and D-11 / D-19 / D-20 / D-25 / D-27
- [[Phase-2-The-Workspace-And-The-Files-Surface]] — where the two linters are
  already scheduled
- `lfm/src/plugins/Bare-Link-Provider-Catalog.md` — the provider spec with no
  implementation behind it

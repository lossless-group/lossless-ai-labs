---
title: "Study Kickoff — Content Authoring Tools"
status: pre-draft, working discussion
date: 2026-05-02
slug-candidate: content-authoring-tools
remote-candidate: lossless-group/study-content-authoring-tools
---

# Content Authoring Tools — Study Kickoff

## The provisional question

> Which content-authoring tools treat **Markdown (and adjacent open
> formats) as first-class citizens** in their data model — such that
> an AI agent can read from and write into the same store the human
> uses, without going through an app-specific cloud API?

The framing is borrowed directly from the *everything-as-code* study's
thesis: vendor-locked artifact stores force agents to guess (or to
integrate with the vendor's AI). Markdown-first authoring tools let
*any* agent read and revise your work because the artifact is plain
text on disk.

Two adjacent questions worth keeping in scope:

1. Where does the tool actually *write* the file? (local FS, Git, a
   sync service that syncs files, a database that hides files, a
   pure cloud API)
2. What's the smallest delta a tool would need to add to be
   "agent-friendly" without becoming agent-native? (e.g. a watch-folder
   hook, a CLI export, a typed schema for blocks)

## What this study is *not*

- Not a survey of "best note-taking apps" — that's a product
  comparison and a different audience.
- Not a study of agent UIs (Claude Code, Cursor, etc.) — those are
  agent-side; this is artifact-store-side.
- Not a study of file *formats* (Markdown, MDX, YAML, JSONCanvas) —
  that's `everything-as-code`. Cross-reference, don't duplicate.

## Provisional pin criterion (revised after Anytype call)

A tool earns a pin if it satisfies all three:

- **(a) Open, agent-reachable store.** The user's artifact lives in
  a store an agent can read and write *without going through a
  vendor's cloud*. Two flavors qualify:
  1. **Files-first** — Markdown (or another open format) on local
     disk or in Git. The path of least resistance.
  2. **Local-first object store with open SDK** — a non-file data
     model (object graph, encrypted store, etc.) is OK *if* the
     project is open source and offers a programmatic interface an
     agent can drive locally. Anytype is the worked example.
- **(b) Bidirectional reach.** An agent can both *read* and *write*
  into the same store the human uses, with the tool seeing the
  agent's writes as first-class content.
- **(c) Live ecosystem.** Active maintenance, real users, and
  enough adoption that working with it isn't a science project.

The criterion preserves the `everything-as-code` v3 framing
(**open + agent-fluent + ecosystem adoption**) but explicitly
broadens "open" beyond plain-text-on-disk. The line we're drawing
is between *vendor cloud as the only API* (excluded) and *local
software with an open programmatic interface* (included).

## Candidate set — organized by sub-cluster

### A. Personal Knowledge Management (PKM)

Tools designed for sustained, networked personal note-taking and
"second brain" workflows.

- **[Obsidian](https://obsidian.md/)** — local Markdown vault with YAML
  frontmatter and `[[wikilinks]]`. Closed-source app, **fully open file
  format**. Plugin ecosystem (community + official, including Bases for
  databases and Canvas/JSONCanvas for whiteboards — both already pinned
  in `everything-as-code`). Strong default for the agent-friendly PKM
  story today. Vault on disk = agent reads and writes are trivial.

- **[Joplin](https://joplinapp.org/)** — open source, encrypted,
  cross-platform notes. Stores notes as Markdown internally with
  metadata. End-to-end encryption is the headline feature.


- **[Logseq](https://logseq.com/)** — open source. Local Markdown
  *or* org-mode files. Outline-first model (every line is a block).
  Self-hostable, plugin ecosystem. Files on disk; agent-readable.

- **[Anytype](https://anytype.io/)** — local-first, encrypted, P2P-sync
  via the Anytype network. Custom internal format (object graph, not
  raw Markdown), but exports to Markdown. Open source.
  Repo: https://github.com/anyproto/anytype-ts (TypeScript desktop
  client). Core: `anyproto/anytype-heart` (Go).
  **Confirmed in scope.** Implies the pin criterion needs to admit
  *local-first-but-not-file-first* stores when the data model is open
  and an agent can read/write programmatically via SDK. See criterion
  refinement note below.

- **[Dendron](https://www.dendron.so/)** — VS Code extension, hierarchical
  Markdown notes. Project status uncertain in 2024-2025; verify before
  pinning.

- **[Foam](https://foambubble.github.io/foam/)** — VS Code extension,
  markdown-based, networked notes. Lower momentum than Obsidian but
  same artifact model.

- **[SilverBullet](https://silverbullet.md/)** — open source, browser-based,
  "Markdown power tool." Pages are Markdown files; runs as a server.

- **[Trilium / TriliumNext](https://github.com/TriliumNext/Trilium)** —
  open source hierarchical notes; supports Markdown content but uses
  an internal SQLite-backed structure for the tree, attributes, and
  relations. Project transitioned from `zadam/trilium` (original
  maintainer stepped back) to the community-led `TriliumNext/Trilium`
  fork, which is now the canonical repo (35k★, very active — last
  push within days). Local-first; agents can reach the store via the
  ETAPI (external API) or by reading the SQLite DB directly.
  **Confirmed in scope** under the broadened criterion (open source,
  local-first store, programmatic interface). Cousin of Anytype in
  shape: open data model that isn't plain Markdown files, but
  reachable by an agent without going through a vendor cloud.

- **[AppFlowy](https://github.com/AppFlowy-IO/AppFlowy)** — open
  source "Notion alternative" (70k★, very active). Tagline:
  *"achieve more without losing control of your data"* — which
  is essentially this study's thesis verbatim. Built on Rust + Flutter,
  local-first with optional self-hosted sync. Docs / databases /
  kanbans / wikis. Local data lives in flowy-data files on disk; the
  app is open enough that agent integration via the local store or
  the SDK is feasible. **Confirmed in scope** under the broadened
  criterion. The strongest *Notion-shaped* candidate that respects the
  vendor-neutrality thesis — worth comparing head-to-head with
  Anytype as the two leading "Notion alternatives that actually mean
  it."

- **[Reflect](https://reflect.app/)** — proprietary; networked notes
  with built-in AI. Cloud-only. **Negative exemplar candidate.**

- **[Mem](https://mem.ai/)** — proprietary AI-native notes. Cloud-only.
  **Negative exemplar candidate.**

- **[Roam Research](https://roamresearch.com/)** — proprietary, EDN-based
  format internally, cloud-first. Hugely influential in the PKM space
  but locked. **Negative exemplar candidate.**

- **[Notion](https://notion.so/)** — proprietary block database, API
  available but not file-first. The canonical negative exemplar for
  this study.

- **[Bear](https://bear.app/)** — Apple-only, proprietary SQLite
  database. Closed file format. **Negative exemplar.**

- **[Apple Notes](https://www.icloud.com/)** — proprietary. **Negative
  exemplar.**

### B. Lightweight memos / micro-publishing

Personal Twitter / mini-blog tools with Markdown.

- **[memos](https://github.com/usememos/memos)** — self-hosted,
  open source, lightweight memo service. Markdown-first. Fits the
  "personal micro-blog" niche. *User-named candidate.*

- **[Mataroa](https://mataroa.blog/)** — minimal blogging platform.
  Markdown-first. Hosted (free) or self-host.

- **[Bear Blog](https://bearblog.dev/)** — minimal, Markdown blogs.

- **[Standard Notes](https://standardnotes.com/)** — encrypted,
  open source, end-to-end. Notes synced through their service but
  the format is recoverable.

- **[Telescope (telegram)](https://telesc.pe/)** and
  **[Hashnode](https://hashnode.com/)** — adjacent (publishing
  tools that accept Markdown), more product than format.

### C. Collaborative document editors

Real-time co-editing tools that respect Markdown.

- **[HedgeDoc](https://hedgedoc.org/)** (formerly CodiMD) —
  open source, real-time collaborative Markdown editor. Self-hostable.
  Forked from HackMD.

- **[HackMD](https://hackmd.io/)** — hosted version of the same family.
  Markdown-first.

- **[Outline](https://www.getoutline.com/)** — open source team wiki.
  Stores in Markdown internally; exposes API. Self-hostable.

- **[Etherpad](https://etherpad.org/)** — older, pre-Markdown-era
  collaborative editor. Mention only.

- **[Notion](https://notion.so/)** — already named above.

- **[Coda](https://coda.io/)** — proprietary, not Markdown-first.
  **Negative exemplar.**

- **[Quip](https://quip.com/)** — Salesforce-owned, proprietary.
  **Negative exemplar.**

- **[Google Docs](https://docs.google.com/)** — cloud-only,
  proprietary internal format, API available. **Negative exemplar.**

- **[Microsoft Loop](https://www.microsoft.com/microsoft-loop)** —
  proprietary, cloud-only. **Negative exemplar.**

### D. Static-site authoring & publishing pipelines

Tools where Markdown is the source-of-truth for published content.

- **[Astro](https://astro.build/)** — content collections, MDX
  support, typed frontmatter. Strong for hybrid sites.

- **[Hugo](https://gohugo.io/)** — Markdown + YAML/TOML frontmatter.
  Single binary, fast.

- **[Eleventy (11ty)](https://www.11ty.dev/)** — flexible, no
  framework lock-in.

- **[Jekyll](https://jekyllbooks.com/)** — the original Markdown
  static-site generator. GitHub Pages default.

- **[Next.js + MDX](https://nextjs.org/docs/pages/building-your-application/configuring/mdx)**
  — common pattern; Markdown lives next to React components.

- **[Quartz](https://quartz.jzhao.xyz/)** — explicitly built to
  publish Obsidian vaults as static sites. Interesting bridge
  between PKM and publishing.

### E. Long-form / book authoring

- **[Quarto](https://quarto.org/)** — cross-reference to
  `everything-as-code`. The slide face is pinned there; the book
  face is here.

- **[Bookdown](https://bookdown.org/)** — books from Markdown via R.

- **[mdBook](https://rust-lang.github.io/mdBook/)** — Rust's book
  tool; the Rust language docs use it.

- **[Scrivener](https://www.literatureandlatte.com/scrivener/)** —
  proprietary, file format opaque. **Negative exemplar.**

- **[Ulysses](https://ulysses.app/)** — Markdown-first but
  proprietary file format. Apple-only. **Negative exemplar
  candidate** (the "uses Markdown but locks you in" case).

### F. Wiki-shaped tools

- **[TiddlyWiki](https://tiddlywiki.com/)** — single-HTML-file
  personal wiki. Idiosyncratic but venerable. Open source.

- **[Wiki.js](https://js.wiki/)** — open source modern wiki, Markdown
  primary content type.

- **[BookStack](https://www.bookstackapp.com/)** — open source wiki
  shaped like books. Markdown supported.

- **[DokuWiki](https://www.dokuwiki.org/dokuwiki)** — flat-file PHP
  wiki, plain text on disk.

### G. Drafting / writing-focused editors

- **[iA Writer](https://ia.net/writer)** — proprietary app, **but**
  fully open Markdown file format. Disk files; agents can reach
  them. Worth a discussion.

- **[Zettlr](https://www.zettlr.com/)** — open source Markdown
  editor with Zettelkasten support.

- **[MarkText](https://github.com/marktext/marktext)** — open
  source Markdown editor.

- **[Typora](https://typora.io/)** — proprietary, Markdown WYSIWYG.

## Provisional cluster recommendations

If we pin one or two per cluster, my hunch (subject to your call):

| Cluster | Pin candidate | Why | Likely mentions |
|---|---|---|---|
| PKM | **Obsidian** + **Anytype** + **AppFlowy** | Three artifact-model archetypes: Obsidian (files-on-disk PKM), Anytype (local-first encrypted object graph with P2P sync), AppFlowy (local-first "Notion alternative" — the head-to-head with Anytype). | Logseq, SilverBullet, Trilium |
| Memos | **memos (usememos)** | self-hosted, Markdown-first, fits the niche cleanly | Mataroa, Bear Blog |
| Collaborative | **HedgeDoc** | real-time + Markdown + self-host = the rare "all three" | Outline, HackMD |
| Static-site | **Astro** *or* skip cluster (already broad ecosystem) | content collections + MDX is the agent-friendly pattern | Hugo, 11ty, Quartz |
| Long-form | cross-reference to Quarto in `everything-as-code` | avoids duplicating | mdBook, Bookdown |
| Wiki | (skip first round?) | older space, less momentum | TiddlyWiki, BookStack |
| Editors | (mention only) | tooling, not artifact-store | iA Writer, Zettlr |

## Open questions to discuss before drafting README

1. ~~**Is Anytype in or out?**~~ **Resolved: in.** Repo:
   https://github.com/anyproto/anytype-ts. Consequence: the pin
   criterion is broadened (see "Provisional pin criterion" above)
   to admit local-first stores with open SDKs, not just files on
   disk. Likely follow-on candidates this admits: AppFlowy (also
   local-first, open SDK), and possibly Trilium.

2. **Should we treat static-site generators as a category, or split
   them off?** Astro/Hugo/11ty are *publishing pipelines*, not
   authoring tools per se. The user authors in any editor and the
   SSG renders. They might belong in a separate "publishing
   pipelines" study.

3. **Does the study want to include a "browse the file format" lens?**
   For each pinned tool: what does a *vault / corpus* look like on
   disk? That's the most useful angle for an agent integrator.

4. **Negative exemplars — name in intro or organize as a side table?**
   The negative list is long (Notion, Roam, Bear, Apple Notes, Coda,
   Quip, Google Docs, Microsoft Loop, Reflect, Mem, Scrivener,
   Ulysses, Typora). Worth a dedicated table that names each with
   its specific lock-in shape (cloud-only, opaque DB, OS-bound, etc.)?

5. **Where do we put the "AI-native" tools (Reflect, Mem, Notion AI)?**
   They're the most direct counter-thesis: tools that bake AI in but
   *only their AI*. Probably the cleanest negative-exemplar entries
   because they're closest in feature surface to what we'd want from
   the positive examples.

## Decision points to close before drafting README

- [ ] Confirm the question phrasing.
- [ ] Confirm pin criterion (a/b/c above).
- [x] Anytype — **in**. Pin criterion broadened to admit
      local-first stores with open SDKs (not just files on disk).
- [ ] Static-site generators — same study or separate?
- [ ] Cluster set: confirm seven clusters (PKM / Memos /
      Collaborative / Static-site / Long-form / Wiki / Editors) or
      collapse some?
- [ ] How many pins per cluster — 1, 2, or "as many as deserve it"?
- [ ] Negative-exemplars table format — flat list, grouped by
      lock-in shape, or per-cluster sidebar?
- [ ] Cross-references to `everything-as-code` (Quarto, JSONCanvas,
      Bases, Markdown substrate) — same "see-also" pattern as the
      open-specs cross-references?

## Notes for myself

Don't pre-empt the user's judgment by pinning too aggressively. The
PKM space has loyal user bases for Logseq vs Obsidian vs Anytype, and
the user uses Obsidian (inferred from prior context) — but the study
question isn't "which one is best," it's "which artifact stores let
agents in." The pin should follow the criterion, not personal taste.

When this study spins up for real:
- Follow the `studies/context-v/prompts/Create-a-new-Study.md`
  checklist.
- Slug: `content-authoring-tools`.
- Remote: `lossless-group/study-content-authoring-tools`.
- Cross-reference the everything-as-code study heavily — Markdown,
  JSONCanvas, Bases, Quarto, MDX all live there.

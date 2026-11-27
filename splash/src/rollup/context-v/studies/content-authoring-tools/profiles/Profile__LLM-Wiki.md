---
name: LLM Wiki Profile
title: LLM Wiki — Profile
slug: llm-wiki
upstream: https://github.com/lucasastorian/llmwiki
pinned_sha: 4d887e8
pinned_date: 2026-11-09
version_at_pin: "none (no tags; master)"
license: Apache-2.0
maintainer: Lucas Astorian
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/llmwiki
profile_kind: AI-compiled wiki — Python MCP server + FastAPI + Next.js over a VaultFS seam (local files + SQLite FTS5, or hosted Postgres + S3), fed by uploads, a watched folder and a Chrome clipper
date_created: 2026-11-27
date_modified: 2026-11-27
date_authored_initial_draft: 2026-11-27
date_authored_current_draft: 2026-11-27
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Reference
site_uuid: 1513608a-49a5-423d-9223-794066579d19
hex_code: xinc1b
lede: >-
  The agent is the author here, not a reader: Claude writes plain Markdown wiki
  pages from your sources over MCP, every claim footnoted back to a file and
  page, and a citation graph plus a lint tool keep the wiki honest between
  nightly runs.
summary: >-
  Profile of LLM Wiki as pinned in the content-authoring-tools study, an
  open-source implementation of Karpathy's LLM Wiki pattern. Covers the
  two-layer workspace (read-only sources, agent-owned wiki/), the guide tool
  that encodes the wiki's writing rules as a prompt, footnote citations parsed
  into a cites/links_to graph in SQLite, exact-match edit and append tools that
  write the file first, staleness propagation, the deterministic lint tool, the
  folder watcher with its write-echo guard, and the local vs hosted VaultFS
  backends.
tags:
  - Profile
  - LLM-Wiki
  - MCP
  - Citations
  - Knowledge-Base
  - Agents
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__LLM-Wiki.md"
---
# LLM Wiki — Profile

A profile of LLM Wiki as it lives in this study (`studies/content-authoring-tools/llmwiki`, pinned at `4d887e8`, 2026-11-09, no tags). Apache-2.0. A Python MCP server (`mcp/`), a FastAPI service (`api/`), a Next.js app (`web/`), a WXT Chrome extension (`extension/`), and a converter for PDF and Office files. The first commit is 2026-04-04; about 200 commits at the pin.

It is the mirror image of [[Profile__Khoj]]. Khoj is an agent that *reads* your notes through a server-side copy. LLM Wiki is an agent that *writes* a Markdown store from your sources, and the store is plain files you can open, edit and commit.

## TL;DR

You run `./llmwiki open ~/research` on a folder. Your files stay where they are. LLM Wiki adds a `wiki/` folder of generated pages and a hidden `.llmwiki/index.db`. You connect Claude over MCP, and Claude reads the sources and writes concept, entity and overview pages with YAML frontmatter and footnote citations back to `file.pdf, p.3`. A nightly Claude Routine folds in whatever arrived since the last run. The same tools run against a hosted Postgres + S3 backend at llmwiki.app.

**One sentence:** *LLM Wiki makes the agent the author of a Markdown knowledge base and treats citations as data, parsing every footnote into a graph edge so the wiki can be linted for orphans, uncited sources and stale pages.*

## How it works

- **Two layers, one rule.** The `guide` tool tells the agent that sources at `/` are "Source of truth. Read-only" and `/wiki/` is the layer "YOU create and maintain" (`mcp/tools/guide.py:9-11`). Claude is told to call `guide` first.
- **The writing rules are a prompt, not a schema.** `guide.py` (535 lines) spells out the wiki's shape: an `overview.md` hub, `concepts/` and `entities/` as "the backbone", an optional `plan.md` with `- [ ]` / `- [~]` / `- [x]` / `- [!]` task states, required frontmatter (`title`, `description`, `date`, at least two `tags`), "at least one visual element" per page (Mermaid, a table, or an SVG asset), and KaTeX with dollar delimiters only (`guide.py:30-138`). It even carries Mermaid syntax gotchas, such as quoting node labels that contain parentheses (`:120-124`).
- **Citations are footnotes with a filename.** "Every factual claim MUST cite its source via markdown footnotes", in the form `[^1]: attention-paper.pdf, p.3`, using the full filename (`guide.py:140-154`).
- **Ingest workflow.** Read the source, discuss it with the user, update concepts and entities, then the overview: "A single source typically touches 5-15 wiki pages" (`guide.py:161-167`). Valuable answers get filed back as pages, so "explorations should compound" (`:173`).
- **Tools.** `guide`, `create_knowledge_base`, `list_knowledge_bases`, `search`, `read`, `create`, `edit`, `append`, `delete`, `lint` (README, "What Claude can do"). In local mode there is one workspace per MCP server entry.

## What's on disk

```
~/research/                  # your files, untouched
  papers/paper.pdf
  wiki/                      # generated pages, plain Markdown
    overview.md
    concepts/attention.md
  .llmwiki/
    index.db                 # SQLite: documents, chunks (FTS5), references, highlights
    cache/                   # extracted text and figures
```

The README says the filesystem is the source of truth and the index is rebuildable with `./llmwiki reindex`, with one exception it states plainly: **highlights, comments, agent replies and clip metadata live only in `index.db`**. Back it up.

Sources are read-only only if they're binary. `_read_only_source_error` lets the agent edit any source whose type is in `TEXT_BACKED_TYPES = {md, txt, svg, csv, json, xml}` (`mcp/tools/write.py:20`, `:29-35`). The guide's "read-only" is a convention for text sources, not something the code enforces.

## Agent reach

| Direction | How | Scope |
|---|---|---|
| **Agent reads sources** | `read` (single file or glob, PDF/Office page ranges, optional image blocks) and `search` over SQLite FTS5 (`mcp/vaultfs/sqlite.py:445-475`) | The whole workspace, including the user's highlights, tagged `[matched: note]` / `[matched: source+note]` / `[annotated]` (`guide.py:175-180`) |
| **Agent writes the wiki** | `create`, exact-match `edit`, `append`, `delete` | Writes the file on disk first, then the index row (`write.py:331-344`; `sqlite.py:504-515`) |
| **Agent queries the graph** | `search(mode="references")`: what a page cites, what links to it, `uncited`, `stale` (`mcp/tools/search.py:111-177`, `:261-265`) | `document_references` table |
| **Agent checks its own work** | `lint`: frontmatter, tag/date index consistency, footnote hygiene, citation resolution, dangling links, orphans, uncited sources, stale pages (`mcp/tools/lint.py:397-404`) | Whole wiki or one path |
| **Human edits by hand** | Any editor; a `watchfiles` watcher re-indexes with a 500 ms debounce (`api/domain/watcher.py:248-260`) | Honors `.llmwikiignore`, falling back to `.gitignore` (`watcher.py:27-34`) |

## What's clever or unique

**Citations parsed into a graph.** After every wiki write, `_sync_references` (`write.py:395-399`) runs `update_references` (`mcp/tools/references.py:65`). Footnote definitions become `cites` edges with an optional page number, parsed from `paper.pdf, p.3` and tolerant of `[name](url)` links and trailing dash commentary (`references.py:10`, `:14-29`). Relative Markdown links between pages become `links_to` edges, skipping images and external URLs (`:11`, `:31+`). The edges replace the old ones in one transaction (`sqlite.py:537-559`). From that, "uncited sources" is one SQL query: non-wiki documents with no incoming `cites` edge (`sqlite.py:608-617`).

**Every write reports its blast radius.** After `edit` or `append`, the tool response lists every page that cites or links to the page just changed, under "**N page(s) reference this document** — consider updating" (`write.py:401-413`). The agent learns what to revisit without asking.

**Footnote-safe append.** `append` keeps the trailing footnote block at the end of the file and renumbers any incoming footnote ids that collide with existing ones (`write.py:146-200`). Two separate appends citing `[^1]` don't clobber each other.

**Exact-match edit, single occurrence.** `edit` refuses an empty `old_string`, refuses if the match isn't unique (`_validate_single_match`), then replaces once and checks a size cap and quiz-block validity before writing (`write.py:302-332`). It's the same contract as coding agents' edit tools, applied to a wiki.

**Frontmatter is the canonical metadata.** Tags and date are read from the file's frontmatter when present and only fall back to tool arguments (`write.py:84-96`). If the caller passes metadata as arguments, `_ensure_wiki_frontmatter` writes it into the file (`:98-128`). `lint` then flags any drift between frontmatter and the index (`lint.py:134-175`).

**Write-echo guard.** App writes call `mark_written(path)`, and the watcher skips those paths for 2 seconds so it doesn't re-index its own output (`watcher.py:20`, `:60-75`; callers in `api/services/local.py`). Separately, the watcher skips re-indexing when a file's SHA-256 or size+mtime matches the indexed row (`watcher.py:149-170`).

**One storage seam.** `VaultFS` (`mcp/vaultfs/base.py`) has a SQLite + filesystem backend and a Postgres + S3 backend with the same method set, so the MCP tools behave identically in local and hosted mode.

## Costs / limits

- **Staleness only flows between wiki pages.** `propagate_staleness` marks pages stale when a page they *link to* changes (`reference_type = 'links_to'`, `sqlite.py:561-571`), and it's called only from wiki writes (`write.py:399`). A source that is re-uploaded or edited does not mark the pages that *cite* it stale, even though the `cites` edges exist. For a wiki whose point is staying current with its sources, that's the gap that matters most.
- **Citations resolve by filename.** Rename `paper.pdf` and every footnote that cites it dangles until rewritten. `lint` catches it, but nothing fixes it.
- **The wiki's quality lives in a prompt.** Page structure, visual requirements and citation discipline are enforced by `guide.py` text, and only partly by `lint`. A different model, or a long session that drifts, gets no hard stop beyond the frontmatter checks.
- **Annotations aren't files.** Highlights, comments and agent replies live only in `index.db`, which breaks the "plain files you can commit" promise for exactly the user-authored layer.
- **Local mode is loopback-only.** The API binds to `127.0.0.1` with no LAN or remote option (README), so one workspace serves one machine.
- **Heavy optional dependencies.** LibreOffice for Word and PowerPoint, and a Mistral API key for good PDF OCR.

## Relevance to flave and Lossless

- **Borrow citations-as-edges.** Our memos and context-v files cite with footnotes and hex codes too. Parsing them into a `cites` / `links_to` table would answer "what cites this source" and "which sources are never cited" with one query, the way `find_uncited_sources` does. It's a natural fit for the `manage-memo-citations` and `repair-memo-citations` skills.
- **Borrow the impact report on write.** Listing backlinks in every edit response is cheap, and it turns "remember to update the related docs" into something the agent sees each time.
- **Borrow footnote-safe append** for any tool that appends to a cited document.
- **Fix their staleness gap in ours.** If we build this, propagate staleness along `cites` edges as well, so a changed source flags the memos or wiki pages built on it.
- **Compare with the Chroma corpus.** Our `context-vigilance-corpus` is a read-side index over hand-written files. LLM Wiki is the write-side counterpart: an agent maintaining the files the index reads. The nightly-Routine model is the same shape as a scheduled agent tending `context-v/`.

## Read next

- `mcp/tools/guide.py:1-200` — the wiki's whole contract, as a prompt
- `mcp/tools/references.py` — footnote and link parsing into graph edges
- `mcp/tools/write.py:146-200`, `:302-413` — footnote-safe append, exact-match edit, impact report
- `mcp/tools/lint.py:110-290` — deterministic wiki hygiene checks
- `mcp/vaultfs/sqlite.py:504-630` — write-to-disk, reference replacement, staleness, uncited and stale queries
- `api/domain/watcher.py` — folder watcher, ignore files, write-echo guard

## Related

- [[Profile__Khoj]] — the opposite direction: an agent that reads a server-side copy of your notes and writes back only through an Obsidian plugin
- [[Profile__SilverBullet]] — plain Markdown files with coding agents as a first-class editor, but no citation model
- [[Profile__mystmd]] — real citations and cross-references from plain Markdown, designed for authors rather than agents
- [[Profile__Outline]] — a team wiki with a strong agent write path, but Markdown is not its storage

---
name: mystmd Profile
title: mystmd — Profile
slug: mystmd
upstream: https://github.com/jupyter-book/mystmd
pinned_sha: 1a09ee32
pinned_date: 2026-11-18
version_at_pin: "citation-js-utils@1.2.11-12-g1a09ee32 (nearest tag, a monorepo package tag; the `mystmd` CLI package reads 1.13.0)"
license: MIT
maintainer: Project Jupyter / jupyter-book org (Jupyter Book and MyST community)
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/mystmd
profile_kind: Markdown dialect + AST spec + TypeScript build toolchain (CLI, parser, transforms, exporters)
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Reference
site_uuid: c0c5a808-ff79-475a-9c32-d93c3b6c8f91
hex_code: wdkbdy
lede: >-
  The entry that already built what LFM keeps promising itself: directives with a
  typed schema, a published AST, numbered cross-references and real citations,
  all from plain Markdown an agent can write without a single API call.
summary: >-
  Profile of mystmd as pinned in the content-authoring-tools study. It is the
  scholarly-Markdown entry: a CommonMark superset whose extension points
  (directives and roles) are declared as typed specs with arg/options/body and
  docs, parsed into a JSON AST that has its own spec, then transformed and
  exported to sites, LaTeX/PDF, Word, Typst and JATS. Covers the plugin model
  (JS objects or any-language executables over stdin/stdout), Jupyter-backed
  execution with a content-hashed cache, labels/cross-references/citations, and
  what it suggests for LFM's directive normalization and flave's parked figures.
tags:
  - Profile
  - MyST
  - Markdown
  - Directives
  - Executable-Documents
  - Citations
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__mystmd.md"
---
# mystmd — Profile

A profile of mystmd as it lives in this study (`studies/content-authoring-tools/mystmd`, pinned at `1a09ee32`, 2026-11-18). MIT (`LICENSE`: "Copyright (c) 2024 Project Jupyter"), TypeScript monorepo, about forty packages under `packages/`.

This is the study's **Markdown-as-a-real-language** entry. Where most entries treat Markdown as a storage format and put the smarts in the app, MyST puts them in the syntax and the AST, and makes the app a build tool.

## TL;DR

MyST is CommonMark plus two extension points borrowed from reStructuredText: **directives** (block) and **roles** (inline) (`packages/myst-spec/README.md:7`). `mystmd` parses that into a standardized AST, runs transforms (cross-references, citations, DOIs, execution), and exports to HTML/React sites, LaTeX/PDF "with specific templates for over 400 journals", Word, Typst and JATS (`README.md:13-19`; `packages/myst-to-*`).

**One sentence:** *mystmd is the most complete answer in the study to "what would a Markdown dialect look like if it were designed for documents that cite, number, cross-reference and compute," and every bit of it is plain text an agent can read and write.*

## How it works

- **Stack.** TypeScript, ESM-only, a turbo/bun workspace (`package.json`). Distributed via npm, PyPI and conda (`README.md:33-40`). The PyPI package is a wrapper around the Node CLI (`packages/mystmd-py`).
- **Pipeline.** `markdown-it-myst` → `myst-parser` (mdast) → `myst-directives` / `myst-roles` run their specs → `myst-transforms` and `myst-cli/src/transforms/` (citations, `crossReferences.ts`, `dois.ts`, `embed.ts`, `inlineExpressions.ts`, `outputs.ts`) → one of `myst-to-html`, `myst-to-tex`, `myst-to-typst`, `myst-to-docx`, `myst-to-jats`, or back out via `myst-to-md` ("Convert a MyST AST to Markdown").
- **The AST is a spec, not an implementation detail.** `myst-spec` "formalizes three formats": the markup syntax, the AST, and suggested semantic HTML/CSS classes, with test cases in `myst`, `mdast` and `html` (`packages/myst-spec/README.md:15-25`). It carries a warning that the schema is still in development (`:3`).
- **Project config** is a `myst.yml` (`docs/myst.yml`), which also lists plugins and external `references` used for cross-project links.

## What's on disk

A MyST document is a `.md` file (or an `.ipynb`). An executable one just adds a `kernelspec` to frontmatter. From `docs/notebooks-with-markdown.md:1-15`:

````markdown
---
title: Executable Markdown Files
kernelspec:
  name: python3
  display_name: Python 3
---

```{code-cell} python
:tag: remove-cell

import matplotlib.pyplot as plt
import numpy as np
```
````

And a labeled figure, from `docs/embed.md`:

```markdown
:::{figure} https://github.com/rowanc1/pics/blob/main/mountains.png
:label: myLabel
Here's a cool figure.
:::
```

Directives can use backtick or colon fences; the colon fence "has better fallback when the contents of the directive includes Markdown in non-MyST renderers (like GitHub)" (`docs/syntax-overview.md:20`). Options are `:key: value` lines, or (beta) inline: `:::{tip .dropdown open="true"} Title` (`docs/inline-options.md`).

## Agent reach

**Read and write: yes, as text.** The source is `.md` plus `myst.yml`; there is no database and no app-owned state. An agent edits the file and runs `myst build` / `myst start`.

- **Structured read:** the AST is JSON and has a schema; the site build writes a `myst.xref.json` index of targets (`packages/myst-cli/src/build/html/index.ts:244-254`).
- **Structured write:** `myst-to-md` serializes an AST back to Markdown, so a tool can edit the tree and write text.
- **No MCP server or AI hook in the pinned tree.** The only LLM mention found was the contribution policy asking contributors to disclose tool use (`docs/contributing.md:31`).

## What's clever or unique

**1. Extensions are typed, self-documenting specs.** A directive is a `DirectiveSpec` object: `name`, `alias`, `doc`, and typed `arg`, `options`, `body`, plus optional `validate` and a `run` that returns AST nodes (`packages/myst-common/src/types.ts:94-103`). Arg types include `'myst'`, meaning "parse this as MyST" (`:63-67`). The admonition directive is 78 lines and declares ten aliases (`note`, `tip`, `warning` …) on one spec (`packages/myst-directives/src/admonition.ts:5-47`). Because every spec carries `doc` strings, the docs site and editor tooling can be generated from them. This is the shape a trigger-pack registration could declare.

**2. Plugins in any language, over stdin/stdout.** Besides JS plugins (`MystPlugin` = `directives` + `roles` + `transforms`, `types.ts:136-145`), an **executable plugin** is any program that answers `--directive`, `--role`, `--transform`, reads AST JSON on stdin and writes AST JSON to stdout (`docs/executable-plugins.md:8-29`). `docs/markup.py` is a complete Python transform in about sixty lines. That makes the AST the contract, not the host language.

**3. Execution is cached by content hash.** For a document with a `kernelspec`, `{code-cell}` blocks and the inline `{eval}` role (`packages/myst-roles/src/inlineExpression.ts:5-6`) run against a Jupyter kernel. The cache key is an MD5 of the kernel name, the executable nodes, and any env vars the page declares it `depends_on_env` (`packages/myst-execute/src/transform.ts:28-65`). Unchanged code is never re-run (`:109-130`).

**4. Numbering, cross-references and citations are core, not plugins.** Any labeled node becomes a target; `[](#target)` with empty text auto-fills "Figure 1" or "Section 1.3.7" (`docs/cross-references.md:29`). `{cite}` comes in about twenty variants (`cite:p`, `cite:t`, `cite:year` …, `packages/myst-roles/src/cite.ts:6-27`), DOIs resolve to CSL-JSON and are cached on disk (`packages/myst-cli/src/transforms/dois.ts:20-26`), and `xref:` links reach into *other* MyST projects (`docs/external-references.md:57-70`).

**5. Widgets with data in the body.** `{anywidget}` takes an ESM module URL as its argument and a JSON5 props object as its body (`packages/myst-directives/src/anywidget.ts:20-45`): a component call whose data is inline text.

## Costs / limits

- **Execution means Jupyter.** `--execute` needs a Jupyter server and kernels per language (`docs/notebooks-with-markdown.md`). There is no SQL-native path; data work goes through a kernel.
- **Two syntaxes for one idea.** MyST's `:::{name}` with `:key:` option lines is not remark-directive's `:::name{key=value}`. The inline-options form gets close, but it is marked beta (`docs/inline-options.md`).
- **The AST spec is explicitly unstable** (`packages/myst-spec/README.md:3`).
- **Heavy toolchain for a single note.** It is a build system with a project file, tuned for books, papers and sites.

## Relevance to flave

- **LFM normalizes directive syntaxes; MyST is one LFM does not yet cover.** `:::{note}` plus `:label:` option lines is the same idea as remark-directive's `:::note{#label}`. Adding MyST colon-fences as an accepted input dialect would open the Jupyter Book corpus to flave. Its inline-options form (`{tip .dropdown open="true"}`) is close to remark-directive attribute syntax already.
- **`DirectiveSpec` is the schema trigger-packs lack.** A trigger-pack is "a Svelte component plus one line of registration". Borrowing MyST's typed `arg/options/body` + `doc` (and Evidence's typed attributes, see [[Profile__Evidence]]) would give each pack validation, autocomplete and generated docs without an inverse serializer.
- **flave's parked cross-refs and figures exist here.** The master spec budgets `remarkCrossRefs` and a **Figure** noun (§7.1, §7.6). MyST's `:label:` + `[](#label)` → "Figure 3" + `myst.xref.json` is a worked design to copy into LFM.
- **Executable plugins over JSON AST** are a cheap way to let agents add transforms in Python or anything else, without touching the Svelte renderer.
- **Hash-keyed execution caching** (`transform.ts:28-65`) is the right shape for flave's `sql` fences: re-run only when query text or inputs change.

## Read next

- `packages/myst-common/src/types.ts:63-145`: the whole extension model in about eighty lines
- `packages/myst-directives/src/admonition.ts` and `figure.ts`: two real specs
- `docs/executable-plugins.md` and `docs/markup.py`: the stdin/stdout plugin contract
- `packages/myst-execute/src/transform.ts:28-170`: cached kernel execution
- `packages/myst-spec/README.md`: the three-format spec idea

## Related

- [[Profile__Notebook-Kit]]: the other "file is the notebook" answer, HTML instead of Markdown, reactive instead of kernel-sequential
- [[Profile__Evidence]]: Markdown plus SQL fences, with typed component attributes
- [[Profile__Livebook]], [[Profile__Pluto]]: notebooks saved as Markdown and as plain source
- [[Profile__Zettlr]]: the other citation-first Markdown entry

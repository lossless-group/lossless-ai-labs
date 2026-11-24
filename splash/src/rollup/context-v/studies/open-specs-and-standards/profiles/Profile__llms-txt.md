---
title: "llms.txt — Profile"
name: llms.txt Profile
slug: llms-txt
upstream: https://github.com/AnswerDotAI/llms-txt
package: llms-txt (PyPI)
license: per repo (Apache-2.0-style; see LICENSE)
maintainer: Jeremy Howard / Answer.AI
study: studies/open-specs-and-standards
profile_path: studies/open-specs-and-standards/llms-txt
profile_kind: file-convention
date_created: 2026-05-05
date_modified: 2026-11-23
site_uuid: fbc2da2e-fd68-4497-bb7c-f0594a3ec864
hex_code: f3v4oq
date_authored_initial_draft: 2026-05-05
date_authored_current_draft: 2026-11-23
lede: >-
  v2 (August 2026) drops the format's one mechanical semantic: `## Optional`
  is now only a convention, and discovery moves to standard link relations.
summary: >-
  Profile of the llms.txt proposal as pinned in this study. It is the website-side counterpart to
  AGENTS.md's repository-side convention, and the two profiles should be read as a pair. Covers the
  strict-but-tiny format (H1 required, blockquote summary, non-heading preamble, H2 link lists),
  the v2 revision (path-scoped files, `rel="alternate"` / `rel="describedby"` discovery, both `.md`
  URL forms, `## Optional` demoted to a convention), the companion convention of serving `.md`
  sidecars at every HTML URL, and the reference Python parser and `llms_txt2ctx` CLI, which still
  ship but are no longer part of the proposal. Also records the honest adoption gap: unlike AGENTS.md and
  A2A, llms.txt is steward-by-personality (Answer.AI / Jeremy Howard) rather than by foundation.
  Use it when publishing docs for LLM consumption or when deciding between llms.txt, robots.txt,
  and sitemap.xml.
authors:
  - Michael Staton
status: Reference
publish: true
type: Profiles
from: "studies/open-specs-and-standards"
from_path: "context-v/profiles/Profile__llms-txt.md"
---
# llms.txt — Profile

A profile of the `/llms.txt` proposal as it lives in this study (`studies/open-specs-and-standards/llms-txt/`). Cites pinned paths so you can jump to source rather than trust paraphrase. Read this alongside the rest of the study — the closest sibling is [`Profile__AGENTS-md.md`](./Profile__AGENTS-md.md), since both are "well-known file" conventions, but they target different surfaces (website vs. repository).

## TL;DR

`llms.txt` is **a proposed well-known file on a website** (`/llms.txt` at the root, or at any subpath) containing a curated, markdown-structured summary of the site for agents to read. The proposal (`nbs/index.qmd:1-8`) is by Jeremy Howard, first dated 2024-09-03 and revised as "v2" on 2026-08-10:

> A proposal to standardise on using an `/llms.txt` file to provide information to help agents use a website.

The v1 description ended "help LLMs use a website at inference time." v2 rewrote the background (`nbs/index.qmd:10-16`) from prediction to report: agents now fetch documentation routinely, thousands of sites publish the file, docs platforms generate it, and Chrome's Lighthouse audits for it.

The proposal has three parts (`nbs/index.qmd:22-36`):

1. **Add an `llms.txt` markdown file** at the site root or at any path, with brief background, guidance, and *links to detailed markdown files*. A file covers the pages under its path; the most specific file applies.
2. **Serve clean markdown copies of every useful HTML page**, either with `.md` appended (`page.html.md`) or with the extension replaced (`page.md`). URLs without filenames use `index.html.md` or `index.md`.
3. **Advertise both with standard link relations** (new in v2): `rel="alternate" type="text/markdown"` for a page's markdown version and `rel="describedby"` for the covering llms.txt, as HTML `<link>` elements or an HTTP `Link:` header (`nbs/index.qmd:28-32`).

It is **not** robots.txt (which is for indexing access control) and **not** sitemap.xml (which lists every page). Where those serve crawlers and search engines, llms.txt is for an agent that needs to use the site's information *right now*, typically while helping a user.

The repo also ships a small Python package (`llms-txt` on PyPI, source under `llms_txt/`) implementing the parser and a `llms_txt2ctx` CLI that expands an `llms.txt` into a single LLM-ready context document. In v1 the proposal described that tool; v2 removed it from the proposal text, though the code still ships. The repo itself is built with `nbdev` (Jupyter notebooks → source + docs → website), and the proposal notes that all nbdev projects now auto-emit `.md` versions of every page (`nbs/index.qmd:40`).

If AGENTS.md is the **repo** schelling-point ("agents editing this codebase look here"), llms.txt is the **website** schelling-point ("LLMs answering questions about this site look here"). Different surface, different layer, similar pattern.

## Why a new well-known file?

llms.txt is designed to coexist with existing web standards, not replace them (`nbs/index.qmd:77-89`):

| File | Audience | Purpose |
|------|----------|---------|
| `/robots.txt` | Search/crawler bots | "Are you allowed to fetch this?" — access control |
| `/sitemap.xml` | Search engines | "Here is every indexable page on the site" — coverage |
| `/llms.txt` | LLMs at inference | "Here is a curated, LLM-readable overview" — context |

Why sitemap isn't enough (`nbs/index.qmd:85-89`):

> sitemap.xml … isn't a substitute for `llms.txt` since it:
>
> - Often won't have the LLM-readable versions of pages listed
> - Doesn't include URLs to external sites, even though they might be helpful to understand the information
> - Will generally cover documents that in aggregate will be too large to fit in an LLM context window, and will include a lot of information that isn't necessary to understand the site.

Why robots.txt isn't enough: it answers "*may* you read this," not "*here is what you need to know*." The proposal's framing (`nbs/index.qmd:81`), now written in the past tense:

> Our expectation was that llms.txt would mainly be useful for *inference* rather than *training*, and that is how it has been used, though training runs could take advantage of the information too.

That distinction is load-bearing. llms.txt is *not* an opt-in/opt-out signal for training crawlers; it's a curated summary for an agent that's already been told to read the site, typically as part of answering a user's prompt.

Why not `/.well-known/` (new in v2, `nbs/index.qmd:83`): RFC 8615 well-known URIs exist only at the origin root, and many authors control only a path on a shared host (a GitHub Pages project site, for example). Like `index.html`, an `llms.txt` describes the path where it sits.

## The format — strict, but tiny

`nbs/index.qmd:48-73`. An `llms.txt` file is markdown in a fixed shape:

```markdown
# Title                              ← H1, REQUIRED, the only required section

> Optional description goes here     ← Blockquote summary, OPTIONAL but recommended

Optional details go here             ← Zero or more non-heading markdown sections
                                      (paragraphs, lists, etc.)

## Section name                      ← Zero or more H2 sections, each containing
                                      a "file list" of links

- [Link title](https://link_url): Optional link details

## Optional                          ← H2 named "Optional": a v2 convention
                                      for secondary links (see below)

- [Link title](https://link_url)
```

The constraints (`nbs/index.qmd:48-55`):

- **An optional byte-order mark** (added in v2).
- **H1 with the project/site name.** *The only required section.*
- **Blockquote summary** containing key information for understanding the rest of the file.
- **Zero or more non-heading markdown sections** (paragraphs, lists) of any type *except headings* — these are the file's preamble.
- **Zero or more H2 sections** with file lists. Each item is a markdown hyperlink `[name](url)`, optionally followed by `:` and notes.

That's it. No frontmatter, no schema, no YAML — but unlike AGENTS.md, there *is* a strict shape because llms.txt is meant to be parsed deterministically (`nbs/index.qmd:24`):

> llms.txt markdown is human and LLM readable, but is also in a precise format allowing fixed processing methods (i.e. classical programming techniques such as parsers and regex).

The reference Python parser (`llms_txt/core.py:34-65`) demonstrates this: a regex pulls out the H1 title, the blockquote summary, and the body; a second pass splits H2 sections; a third pass parses each `- [name](url): description` into `{title, url, desc}`. It's about 100 lines.

### The "Optional" section: from semantic to convention

v1 said the "Optional" section "has a special meaning": its URLs could be skipped when a shorter context was needed. That was the proposal's only behavioral semantic beyond "list links." v2 (`nbs/index.qmd:75`) rewrites it as:

> The "Optional" section is used, by convention, for secondary information: links an agent can skip when a shorter context is needed.

The changes page (`nbs/changes.qmd:13`) gives the reason: the special meaning existed to tell context-expansion tools what to omit, and those tools are no longer part of the proposal. Optional sections remain allowed and useful; they just carry no mechanical semantics. The reference `llms_txt2ctx` CLI still implements the old behavior: its `optional` flag decides whether the section named `Optional` is skipped (`llms_txt/core.py:100-104`, `llms_txt/core.py:119-127`).

## The companion convention: `.md` URLs

The second part of the proposal (`nbs/index.qmd:26`):

> We furthermore propose that pages with information that agents might need provide a clean markdown version of those pages at the same URL as the original page, either with `.md` appended (`page.html.md`) or with the extension replaced by `.md` (`page.md`).

So `/docs/tutorial.html` should also exist at `/docs/tutorial.html.md` or `/docs/tutorial.md`. v1 allowed only the first form; v2 blesses the second because some publishing tools already used it (`nbs/changes.qmd:11`). This means the URLs in your `llms.txt` file lists can point to clean markdown, with no HTML stripping at read time.

v2 adds discovery (`nbs/index.qmd:28-32`). A page points to its markdown version with `rel="alternate" type="text/markdown"` and to its covering llms.txt with `rel="describedby"`, either as `<link>` elements or as an HTTP header that a CDN can add without touching pages:

```
Link: </docs/page.html.md>; rel="alternate"; type="text/markdown", </docs/llms.txt>; rel="describedby"
```

The proposal cites FastHTML's docs as the canonical worked example: [llms.txt](https://www.fastht.ml/docs/llms.txt) at `/docs/`, covering just the documentation pages, and every `*.html` page also reachable as `*.html.md`. Auto-generation is built into `nbdev` (`nbs/index.qmd:40`):

> all nbdev projects now create .md versions of all pages by default

That's the practical answer to "but who's going to maintain dual HTML+markdown?" — your docs generator does it. v2's integrations list (`nbs/index.qmd:133-150`) now leads with platforms that generate llms.txt automatically (Mintlify, GitBook, Yoast SEO, AIOSEO, Wix), followed by plugins for other generators: VitePress (`vitepress-plugin-llms`), Docusaurus (`docusaurus-plugin-llms`), Drupal (`llm_support`), PHP (`llms-txt-php`), and an MCP server for fetching and searching llms.txt files.

## The processing pattern: `llms.txt` → `llms-ctx.txt`

This section describes tooling that v2 removed from the proposal. v1 said it made no recommendation for processing the file, then described the FastHTML pattern of expanding llms.txt into `llms-ctx.txt` (skipping Optional) and `llms-ctx-full.txt` (including it) with `llms_txt2ctx`. v2 replaces that paragraph with a stated expectation (`nbs/index.qmd:36`):

> Agents are expected to view or search `llms.txt` to find the information they need, then follow the relevant links. The links in an llms.txt file should therefore point to LLM-friendly content … The file itself stays small enough to fit in context. The detail lives behind the links, and is fetched only when needed.

So the current consumption model is "read the index, follow links," not "pre-expand everything." The expansion code below still ships in the repo and still works; read it as a reference implementation of the v1 pattern.

The XML-flavored structure is visible in the example file shipped with the repo (`nbs/llms-ctx.txt:1`):

```xml
<project title="llms.txt">
  > A proposal that those interested in providing LLM-friendly content add a /llms.txt file...
  <docs>
    <doc title="llms.txt proposal" desc="The proposal for llms.txt">
      # The /llms.txt file
      Jeremy Howard
      2024-09-03
      ...
    </doc>
  </docs>
</project>
```

Three things load-bearing about this pattern:

- **One file per context budget tier.** `llms-ctx.txt` (skip Optional) is the small/fast version. `llms-ctx-full.txt` (include Optional) is the big/complete version. A consumer picks based on its window size and use case.
- **XML-tagged for prompt engineering.** Anthropic's prompting guidance has long favored XML tags for structured context; the pattern leans into that. The Python `mk_ctx` function (`llms_txt/core.py:100-104`) builds a `<project><docs><doc>...` tree using `fastcore.xml`'s `Sections / Project / Doc` types.
- **Per-link content fetched, comments + base64 images stripped.** `_doc()` in `llms_txt/core.py:85-92` fetches each link, strips HTML comments and inline base64 images, and inserts the result as a `<doc>` element. (0.0.7 removed a stray `print` from this function.) Parallel fetching is the headline optimization (`llms_txt/core.py:95-97`, "Download URLs in parallel" — see also `CHANGELOG.md` 0.0.2).

The CLI is one command (`llms_txt/core.py:119-130`):

```bash
llms_txt2ctx my-llms.txt                 # Print context to stdout
llms_txt2ctx my-llms.txt --optional      # Include the Optional section
llms_txt2ctx my-llms.txt --n-workers 4   # Parallel fetch
```

The flag spelling follows `fastcore.script`, which now hyphenates underscore parameter names; the repo updated its own docs for this in 0.0.7 (`nbs/nbdev.qmd`). Older fastcore versions take `--n_workers`.

You can replicate this in any language; the parsing pattern is small enough that the repo ships a JavaScript implementation (`nbs/llmstxt-js.html`), and the integrations list (`nbs/index.qmd:133-150`) shows VitePress / Docusaurus / Drupal / PHP / VS Code ports.

## What's actually inside this submodule

```text
llms-txt/
├── README.md → nbs/index.qmd        # Symlink: README is the proposal essay itself
├── nbs/                             # nbdev source notebooks + Quarto site
│   ├── index.qmd                    # 155 lines — the proposal, v2 (canonical artifact)
│   ├── changes.qmd                  # 13 lines — what changed from v1 to v2, and why
│   ├── 00_intro.ipynb               # Library intro notebook
│   ├── 01_core.ipynb                # Core parser + llms_txt2ctx implementation notebook
│   ├── nbdev.qmd                    # 154 lines — guide for nbdev integration
│   ├── domains.qmd                  # 86 lines — guidelines for different domain types (with restaurant example!)
│   ├── ed.qmd                       # The "tongue-in-cheek ed editor" example
│   ├── llms.txt                     # The repo's *own* llms.txt — dogfooded
│   ├── llms-ctx.txt                 # 446 lines — pre-expanded context (Optional skipped)
│   ├── llms-ctx-full.txt            # 446 lines — pre-expanded context (Optional included)
│   ├── llms-sample.txt              # Example file
│   ├── llmstxt-js.html              # JavaScript reference implementation
│   ├── _quarto.yml, sidebar.yml, styles.css, favicon.ico, CNAME
│   └── ...
├── llms_txt/                        # Python package source (autogenerated from notebooks)
│   ├── __init__.py
│   ├── core.py                      # 130 lines — parser, context builder, CLI
│   ├── miniparse.py
│   ├── txt2html.py
│   └── _modidx.py
├── tests/
├── pyproject.toml                   # llms-txt (PyPI)
├── CHANGELOG.md
├── LICENSE                          # MANIFEST.in removed in 0.0.7
├── update.sh
└── logo.png
```

If you only have time for two files: `nbs/index.qmd` (the proposal) and `nbs/llms.txt` (the repo's own llms.txt, as the smallest possible worked example):

```markdown
# llms.txt

> A proposal that those interested in providing LLM-friendly content add
> a /llms.txt file to their site. This is a markdown file that provides
> brief background information and guidance, along with links to markdown
> files providing more detailed information.

## Docs

- [llms.txt proposal](https://llmstxt.org/index.md): The proposal for llms.txt
- [Python library docs](https://llmstxt.org/intro.html.md): Docs for `llms-txt` python lib
- [ed demo](https://llmstxt.org/ed.md): Tongue-in-cheek example...
```

That's the entire file (`nbs/llms.txt:1-9`). Ten lines. That brevity is the point.

If you want a longer example, see the FastHTML llms.txt referenced in the proposal (`nbs/index.qmd:93-117`) — a "## Docs", "## Examples", and "## Optional" file with the Starlette docs as an Optional resource the consumer can skip under context pressure.

## How to use it

### As a publisher

1. **Write your `/llms.txt`.** Start from the smallest possible version: `# Site Name`, a one-paragraph blockquote, and one or two H2 sections of curated links. Use clear language, brief link descriptions, no jargon (`nbs/index.qmd:118-123`). Put it at the root, or at the path you control (`/docs/llms.txt` covers `/docs/`).
2. **Serve `.md` versions of useful pages.** If you're using nbdev, this is automatic. Mintlify, GitBook, and Wix generate them for you; for VitePress or Docusaurus, install the corresponding plugin (`nbs/index.qmd:137-147`). If you're rolling your own, sidecar `.md` files at the same URLs (`page.html.md` or `page.md`).
3. **Advertise them.** Add `rel="alternate" type="text/markdown"` and `rel="describedby"` links, as `<link>` elements or a `Link:` header (`nbs/index.qmd:28-32`).
4. **Put secondary content under `## Optional`** if you like. Since v2 this is a convention for links an agent can skip, not a rule any tool must honor.
5. **Test it.** v2's guideline (`nbs/index.qmd:123`) is to ask an agent questions about your content, giving it only your llms.txt as a starting point. `nbs/domains.qmd:5` still ships a script that runs an actual LLM against your file:

   ```bash
   uv run test_llms_txt.py    # or pip install claudette llms-txt requests
   ```

   The repo ships a 27-line script (`nbs/domains.qmd:7-33`) that fetches your `llms.txt`, expands it via `create_ctx`, and feeds it to Claude — so you can iterate on the file by *asking your LLM the questions you expect users to ask*.

6. **Optionally pre-publish `llms-ctx.txt` and `llms-ctx-full.txt`.** This was the v1 FastHTML pattern. v2 no longer recommends it, since agents are expected to read the index and follow links, but nothing stops you serving pre-expanded XML-tagged context for consumers that want one fetch.

### As a consumer (LLM-side)

If you're building an agent that needs to use a website's content, v2's model is: look for a `rel="describedby"` link or a path-scoped `llms.txt`, read it, then fetch only the linked markdown you need. If you want the whole thing expanded up front, the reference CLI still does that:

```bash
pip install llms-txt
llms_txt2ctx https://example.com/llms.txt > context.txt
```

…or call `create_ctx` programmatically (`llms_txt/core.py:112-116`):

```python
from llms_txt import create_ctx
ctx = create_ctx(open('llms.txt').read(), optional=False)
```

Then feed `ctx` into your LLM call as context. The XML-tagged structure works well with Claude; for other models, you may want to convert tags to other formats (the JS port at `nbs/llmstxt-js.html` is an example of an alternative emitter).

### As an integration author

The proposal explicitly invites domain-specific guidance. `nbs/domains.qmd` shows worked examples for:

- **Restaurants** — a `## Menus` section with `Lunch Menu`, `Dinner Menu`, and a `## Optional` `Dessert Menu` (`nbs/domains.qmd:37-60`).
- The implication is that any vertical can adopt the same shape: e-commerce sites describe products and policies, schools describe courses, governments describe legislation, individuals describe their CV.

## Mental model for using it well

- **The file is a curated index, not a full doc dump.** The point is not to list every page (sitemap does that) — it's to surface the few links that, expanded, fit in an LLM's window and answer the questions users will actually ask.
- **Treat the blockquote as load-bearing.** The H1 is just a label. The `> summary` is what an LLM reads first to decide if your site is the right source. Spend real time on that single paragraph.
- **`## Optional` is a hint, not a control.** Anything an agent can skip without losing the core answer can go there, but since v2 no consumer is expected to treat it mechanically. If you find yourself writing four `## Optional` sections, you're putting too much in primary.
- **Write link descriptions, not link names.** `[FastHTML quick start](url): A brief overview of many FastHTML features` is much more useful to an LLM picking which link to follow than `[FastHTML quick start](url)` alone (`nbs/index.qmd:107`). This matters more under v2, where the agent picks links from the index instead of receiving everything pre-expanded.
- **Generate `.md` URLs automatically; don't hand-maintain.** nbdev / VitePress / Docusaurus plugins exist for this reason. Hand-maintained sidecar markdown will rot.
- **Test against an actual LLM, not just regex.** The format being parseable is necessary but not sufficient. The reason `nbs/domains.qmd` ships a Claude test harness is that the structure can be valid while the content is unhelpful — only an end-to-end test catches that.
- **Keep the index small; let links carry the detail.** v2 expects the file itself to fit in context and the detail to be fetched on demand. Pre-publishing `llms-ctx*.txt` remains possible but is no longer the recommended path.
- **Update like docs, not like code.** Like AGENTS.md, this is living documentation. If you do pre-publish expansions, re-run `llms_txt2ctx` whenever upstream link content changes.

## When NOT to reach for this

- **You don't have a website.** `llms.txt` lives at `/llms.txt` on a host. If your content is in a private repo, behind auth, or not on a public URL, the convention doesn't apply — use AGENTS.md (for repos) or pass content directly to your LLM.
- **You're targeting training crawlers, not inference-time agents.** llms.txt is explicitly about inference. If you want to control what's used to train a model, that's robots.txt + per-vendor opt-out signals + legal terms.
- **Your site doesn't fit the "curated index of markdown links" shape.** Highly transactional sites (a checkout flow, a real-time dashboard) aren't well-served. Sites whose value is the page UX rather than the document content are also not a fit.
- **You can't generate clean markdown for your pages.** The `.md` URL companion convention is half the value. If your pages are JS-heavy SPAs that don't have a clean text representation, the links in your `llms.txt` will be next to useless.
- **You need behavioral guarantees from consumers.** Like AGENTS.md and unlike A2A, llms.txt is *advisory*. There's no validator and no enforcement. An LLM may or may not fetch your file. Since v2, `## Optional` is explicitly a convention with no required behavior.
- **Adoption is uneven.** Compared to AGENTS.md (60k+ public repos, 23+ tools, Linux Foundation steward) and A2A (8-company TSC, 166 partners, Linux Foundation steward), llms.txt is community-stewarded by Answer.AI / Jeremy Howard with directories like `llmstxt.site` tracking adopters. Steward-by-personality, not by foundation.

## llms.txt vs. AGENTS.md — the close cousin

These two are the closest siblings in this study. Both are well-known files. Both are markdown. Both target AI/agent consumption. They differ on every other axis:

| Axis | llms.txt | AGENTS.md |
|------|----------|-----------|
| **Surface** | Website (`https://site/llms.txt`) | Repository (`AGENTS.md` at root, plus nested) |
| **Audience** | LLMs answering user questions about the site | Coding agents editing code in this repository |
| **Time of consumption** | Inference time — when an LLM is *using* the site | Edit time — when an agent is *changing* the codebase |
| **Format** | **Strict** — H1 + optional blockquote + sections + link lists | **None** — any markdown structure |
| **Required structure** | H1 only | Nothing |
| **Special semantics** | Most specific path-scoped file wins (v2); `## Optional` is a convention only | "Closest file wins" precedence; chat overrides |
| **Reference parser** | `llms-txt` (PyPI), `llms_txt2ctx` CLI | None — each consumer parses ad hoc |
| **Companion convention** | `.md` URLs sidecar every useful HTML page | Nested `AGENTS.md` files override parents per directory |
| **Stewardship** | Community / Answer.AI / Jeremy Howard | Linux Foundation (Agentic AI Foundation) |
| **Originating collaborators** | Single proposer (Howard, 2024-09-03) | OpenAI Codex, Amp, Jules, Cursor, Factory |
| **Adoption signal** | Per v2: thousands of sites, auto-generation in Mintlify / GitBook / Wix / Yoast, a Lighthouse audit; directory sites (`llmstxt.site`, `directory.llmstxt.cloud`, `llmstxthub.com`); plugin ecosystem (VitePress, Docusaurus, Drupal, PHP, VS Code) | 23+ coding agents support natively; 60k+ public repos |

A site can — and probably should — have both. Your repo's `AGENTS.md` tells coding agents how to build, test, and lint your code. Your published docs site's `/llms.txt` tells LLMs answering questions about your project where the canonical markdown lives. They're complementary, not redundant.

## llms.txt vs. the rest of the study

Where the other artifacts in this study sit:

| Artifact | Layer | Time of consumption |
|----------|-------|---------------------|
| **llms.txt** | Website | Inference — LLM is using your site to answer a question |
| **AGENTS.md** | Repository | Edit time — agent is changing your code |
| **OpenSpec / Spec Kit / GSD** | Repository | Edit time — developer drives an agent through a spec |
| **A2A** | Network — between agents | Inter-agent runtime |
| **12-Factor Agents** | App architecture | Design time — when you're building the agent product |
| **Symphony** | Operations — daemon over agents | Runtime — daemon polls tracker and dispatches agents |

Stack them: a project might publish `/llms.txt` so external LLMs can use its docs at inference time, ship `AGENTS.md` so agents editing it know its build/test commands, use OpenSpec or Spec Kit or GSD to drive feature work, expose an A2A endpoint so other agentic services can call it, follow 12-Factor principles in any agents the project itself ships, and run Symphony as the daemon that picks tickets off Linear and dispatches Codex agents into per-issue workspaces. All seven layers can co-exist; none replace the others.

## Changes since the previous pin (2026-04-29 → 2026-09-25)

`7dd05c5b0b3f` → `3700a0a624a4`, 20 commits. Release in range: **0.0.7** (PyPI package; `llms_txt/__init__.py` at the new pin already reads `0.0.8` for the next release).

- **The proposal is now "v2"** (`nbs/index.qmd:1-8`, dated 2026-08-10), with a new changes page (`nbs/changes.qmd`). This is the change that matters for this profile.
- **`## Optional` lost its special meaning** (`nbs/index.qmd:75`, `nbs/changes.qmd:13`). It is now a convention for secondary links. The previous lede of this profile ("the only behavioral semantic in the whole format") is no longer true.
- **Context expansion left the proposal.** The `llms_txt2ctx` / `llms-ctx.txt` paragraph is gone; agents are expected to read the index and follow links (`nbs/index.qmd:36`). The tool still ships in `llms_txt/core.py` unchanged apart from a removed debug `print`.
- **Discovery via link relations**: `rel="alternate" type="text/markdown"` and `rel="describedby"`, as `<link>` or HTTP `Link:` header (`nbs/index.qmd:28-32`).
- **Path-scoped files**: an `llms.txt` covers the pages under its path and the most specific one applies (`nbs/index.qmd:22`, `:48`), with an explicit argument against `/.well-known/` (`nbs/index.qmd:83`).
- **Both markdown URL forms** (`page.html.md` and `page.md`) and an optional BOM are allowed (`nbs/index.qmd:26`, `:50`).
- Housekeeping: `domains.md` and `ed.md` became `.qmd`; `MANIFEST.in` removed; `pyproject.toml` uses an SPDX `license = "Apache-2.0"` string; regex literals in `llms_txt/miniparse.py` are now raw strings.

## One-line summary

> llms.txt wins by being the *website-side* analogue to AGENTS.md — a well-known file at `/llms.txt` (or any path it covers) with a strict-but-tiny markdown shape (H1 + blockquote + curated link lists), a companion `.md`-URL convention that sidecars clean markdown next to every HTML page, and, since v2, standard `alternate` / `describedby` link relations so agents can find both — all of which lets a website declare "here's what an agent needs to know to use me" without inventing yet another proprietary format. The 100-line Python parser and `llms_txt2ctx` CLI still ship as reference code for the v1 expand-everything pattern.

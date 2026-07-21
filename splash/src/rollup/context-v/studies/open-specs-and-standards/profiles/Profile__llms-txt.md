---
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
from: "studies/open-specs-and-standards"
from_path: "context-v/profiles/Profile__llms-txt.md"
---
# llms.txt — Profile

A profile of the `/llms.txt` proposal as it lives in this study (`studies/open-specs-and-standards/llms-txt/`). Cites pinned paths so you can jump to source rather than trust paraphrase. Read this alongside the rest of the study — the closest sibling is [`Profile__AGENTS-md.md`](./Profile__AGENTS-md.md), since both are "well-known file" conventions, but they target different surfaces (website vs. repository).

## TL;DR

`llms.txt` is **a proposed well-known file at the root of a website** (`/llms.txt`) containing a curated, markdown-structured summary of the site for consumption by LLMs at inference time. The proposal (`nbs/index.qmd:1-6`) is by Jeremy Howard, dated 2024-09-03:

> A proposal to standardise on using an `/llms.txt` file to provide information to help LLMs use a website at inference time.

The motivation (`nbs/index.qmd:9-13`):

> Large language models increasingly rely on website information, but face a critical limitation: context windows are too small to handle most websites in their entirety. Converting complex HTML pages with navigation, ads, and JavaScript into LLM-friendly plain text is both difficult and imprecise.

The proposal has two parts (`nbs/index.qmd:18-23`):

1. **Add an `/llms.txt` markdown file** at the site root with brief background, guidance, and *links to detailed markdown files*.
2. **Serve clean markdown copies of every useful HTML page** at the same URL with `.md` appended (e.g. `/docs/tutorial.html` → `/docs/tutorial.html.md`; URLs without filenames append `index.html.md` instead).

It is **not** robots.txt (which is for indexing access control) and **not** sitemap.xml (which lists every page). Where those serve crawlers and search engines, llms.txt is for **inference-time consumption** by an LLM that needs to use the site's information *right now* — typically while answering a user's question that depends on this site's content.

The proposal sits next to a small Python package (`llms-txt` on PyPI, source under `llms_txt/`) implementing the parser and a `llms_txt2ctx` CLI that expands an `llms.txt` into a single LLM-ready context document (`nbs/index.qmd:27`). The repo itself is built with `nbdev` (Jupyter notebooks → source + docs → website), and the proposal explicitly notes that all nbdev projects now auto-emit `.md` versions of every page (`nbs/index.qmd:31`).

If AGENTS.md is the **repo** schelling-point ("agents editing this codebase look here"), llms.txt is the **website** schelling-point ("LLMs answering questions about this site look here"). Different surface, different layer, similar pattern.

## Why a new well-known file?

llms.txt is designed to coexist with existing web standards, not replace them (`nbs/index.qmd:67-78`):

| File | Audience | Purpose |
|------|----------|---------|
| `/robots.txt` | Search/crawler bots | "Are you allowed to fetch this?" — access control |
| `/sitemap.xml` | Search engines | "Here is every indexable page on the site" — coverage |
| `/llms.txt` | LLMs at inference | "Here is a curated, LLM-readable overview" — context |

Why sitemap isn't enough (`nbs/index.qmd:73-77`):

> sitemap.xml … isn't a substitute for `llms.txt` since it:
>
> - Often won't have the LLM-readable versions of pages listed
> - Doesn't include URLs to external sites, even though they might be helpful to understand the information
> - Will generally cover documents that in aggregate will be too large to fit in an LLM context window, and will include a lot of information that isn't necessary to understand the site.

Why robots.txt isn't enough: it answers "*may* you read this," not "*here is what you need to know*." The proposal's framing (`nbs/index.qmd:71`):

> Our expectation is that `llms.txt` will mainly be useful for *inference*, i.e. at the time a user is seeking assistance, as opposed to for *training*.

That distinction is load-bearing. llms.txt is *not* an opt-in/opt-out signal for training crawlers; it's a curated summary for an LLM that's already been told to read the site, typically as part of answering a user's prompt.

## The format — strict, but tiny

`nbs/index.qmd:39-46`. An `llms.txt` file is markdown in a fixed shape:

```markdown
# Title                              ← H1, REQUIRED, the only required section

> Optional description goes here     ← Blockquote summary, OPTIONAL but recommended

Optional details go here             ← Zero or more non-heading markdown sections
                                      (paragraphs, lists, etc.)

## Section name                      ← Zero or more H2 sections, each containing
                                      a "file list" of links

- [Link title](https://link_url): Optional link details

## Optional                          ← H2 named "Optional" has special semantics
                                      (see below)

- [Link title](https://link_url)
```

The constraints (`nbs/index.qmd:41-45`):

- **H1 with the project/site name.** *The only required section.*
- **Blockquote summary** containing key information for understanding the rest of the file.
- **Zero or more non-heading markdown sections** (paragraphs, lists) of any type *except headings* — these are the file's preamble.
- **Zero or more H2 sections** with file lists. Each item is a markdown hyperlink `[name](url)`, optionally followed by `:` and notes.

That's it. No frontmatter, no schema, no YAML — but unlike AGENTS.md, there *is* a strict shape because llms.txt is meant to be parsed deterministically (`nbs/index.qmd:21`):

> llms.txt markdown is human and LLM readable, but is also in a precise format allowing fixed processing methods (i.e. classical programming techniques such as parsers and regex).

The reference Python parser (`llms_txt/core.py:34-65`) demonstrates this: a regex pulls out the H1 title, the blockquote summary, and the body; a second pass splits H2 sections; a third pass parses each `- [name](url): description` into `{title, url, desc}`. It's about 100 lines.

### The "Optional" section is special

`nbs/index.qmd:65`:

> Note that the "Optional" section has a special meaning — if it's included, the URLs provided there can be skipped if a shorter context is needed. Use it for secondary information which can often be skipped.

This is the proposal's only behavioral semantic beyond "list links." It maps cleanly onto context-budget tuning: a tool expanding the file into an LLM context can drop the `Optional` section first when token pressure is on. The reference `llms_txt2ctx` CLI takes a flag `--optional` controlling this exact behavior (`llms_txt/core.py:99-103`).

## The companion convention: `.md` URLs

The second half of the proposal (`nbs/index.qmd:23`):

> We furthermore propose that pages on websites that have information that might be useful for LLMs to read provide a clean markdown version of those pages at the same URL as the original page, but with `.md` appended.

So `/docs/tutorial.html` should also exist at `/docs/tutorial.html.md`. URLs without filenames get `index.html.md`. This means the URLs in your `llms.txt` file lists can point to clean markdown — no HTML stripping required at inference time.

The proposal cites FastHTML's docs as the canonical worked example: [llms.txt](https://www.fastht.ml/docs/llms.txt) at root, and every `*.html` page also reachable as `*.html.md`. Auto-generation is built into `nbdev` (`nbs/index.qmd:31`):

> all nbdev projects now create .md versions of all pages by default

That's the practical answer to "but who's going to maintain dual HTML+markdown?" — your docs generator does it. Plugins listed in `nbs/index.qmd:122-132` extend this to other generators: VitePress (`vitepress-plugin-llms`), Docusaurus (`docusaurus-plugin-llms`), Drupal (`llm_support`), PHP (`llms-txt-php`).

## The processing pattern: `llms.txt` → `llms-ctx.txt`

The proposal explicitly does not prescribe how to process the file (`nbs/index.qmd:27`):

> This proposal does not include any particular recommendation for how to process the llms.txt file, since it will depend on the application.

But it ships a reference implementation. The FastHTML / Answer.AI pattern (`nbs/index.qmd:27`):

> the FastHTML project opted to automatically expand the llms.txt to two markdown files with the contents of the linked URLs, using an XML-based structure suitable for use in LLMs such as Claude. The two files are: `llms-ctx.txt`, which does not include the optional URLs, and `llms-ctx-full.txt`, which does include them.

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
- **XML-tagged for prompt engineering.** Anthropic's prompting guidance has long favored XML tags for structured context; the pattern leans into that. The Python `mk_ctx` function (`llms_txt/core.py:99-103`) builds a `<project><docs><doc>...` tree using `fastcore.xml`'s `Sections / Project / Doc` types.
- **Per-link content fetched, comments + base64 images stripped.** `_doc()` in `llms_txt/core.py:83-91` fetches each link, strips HTML comments and inline base64 images, and inserts the result as a `<doc>` element. Parallel fetching is the headline optimization (`llms_txt/core.py:94-96`, "Download URLs in parallel" — see also `CHANGELOG.md` 0.0.2).

The CLI is one command (`llms_txt/core.py:118-129`):

```bash
llms_txt2ctx my-llms.txt                 # Print context to stdout
llms_txt2ctx my-llms.txt --optional      # Include the Optional section
llms_txt2ctx my-llms.txt --n_workers 4   # Parallel fetch
```

You can replicate this in any language; the parsing pattern is small enough that the README ships a JavaScript implementation (`nbs/llmstxt-js.html`) and the integrations list (`nbs/index.qmd:122-132`) shows VitePress / Docusaurus / Drupal / PHP / VS Code ports.

## What's actually inside this submodule

```text
llms-txt/
├── README.md → nbs/index.qmd        # Symlink: README is the proposal essay itself
├── nbs/                             # nbdev source notebooks + Quarto site
│   ├── index.qmd                    # 137 lines — the proposal (canonical artifact)
│   ├── 00_intro.ipynb               # Library intro notebook
│   ├── 01_core.ipynb                # Core parser + llms_txt2ctx implementation notebook
│   ├── nbdev.qmd                    # 183 lines — guide for nbdev integration
│   ├── domains.md                   # 86 lines — guidelines for different domain types (with restaurant example!)
│   ├── ed.md                        # The "tongue-in-cheek ed editor" example
│   ├── llms.txt                     # The repo's *own* llms.txt — dogfooded
│   ├── llms-ctx.txt                 # 446 lines — pre-expanded context (Optional skipped)
│   ├── llms-ctx-full.txt            # 446 lines — pre-expanded context (Optional included)
│   ├── llms-sample.txt              # Example file
│   ├── llmstxt-js.html              # JavaScript reference implementation
│   ├── _quarto.yml, sidebar.yml, styles.css, favicon.ico, CNAME
│   └── ...
├── llms_txt/                        # Python package source (autogenerated from notebooks)
│   ├── __init__.py
│   ├── core.py                      # 129 lines — parser, context builder, CLI
│   ├── miniparse.py
│   ├── txt2html.py
│   └── _modidx.py
├── tests/
├── pyproject.toml                   # llms-txt (PyPI)
├── CHANGELOG.md
├── LICENSE, MANIFEST.in
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
- [ed demo](https://llmstxt.org/ed-commonmark.md): Tongue-in-cheek example...
```

That's the entire file (`nbs/llms.txt:1-9`). Eleven lines. That brevity is the point.

If you want a longer example, see the FastHTML llms.txt referenced in the proposal (`nbs/index.qmd:81-105`) — a "## Docs", "## Examples", and "## Optional" file with the Starlette docs as an Optional resource the consumer can skip under context pressure.

## How to use it

### As a publisher

1. **Write your `/llms.txt`.** Start from the smallest possible version: `# Site Name`, a one-paragraph blockquote, and one or two H2 sections of curated links. Use clear language, brief link descriptions, no jargon (`nbs/index.qmd:108-113`).
2. **Serve `.md` versions of useful pages.** If you're using nbdev, this is automatic. If you're using VitePress or Docusaurus, install the corresponding plugin (`nbs/index.qmd:128-129`). If you're rolling your own, sidecar `.md` files at the same URLs.
3. **Mark secondary content as `## Optional`.** Anything an LLM can skip when its context budget is tight goes here. This is the only behavioral knob you have.
4. **Test it.** `nbs/domains.md:5` recommends running an actual LLM against your file:

   ```bash
   uv run test_llms_txt.py    # or pip install claudette llms-txt requests
   ```

   The repo ships a 30-line script (`nbs/domains.md:7-33`) that fetches your `llms.txt`, expands it via `create_ctx`, and feeds it to Claude — so you can iterate on the file by *asking your LLM the questions you expect users to ask*.

5. **Optionally pre-publish `llms-ctx.txt` and `llms-ctx-full.txt`.** If your audience is using LLMs that benefit from pre-expanded XML-tagged context, run `llms_txt2ctx` and serve the output as static files alongside `llms.txt`. Saves consumers a fetch storm.

### As a consumer (LLM-side)

If you're building an agent that needs to use a website's content:

```bash
pip install llms-txt
llms_txt2ctx https://example.com/llms.txt > context.txt
```

…or call `llms_txt2ctx` programmatically (`llms_txt/core.py:111-115`):

```python
from llms_txt import create_ctx
ctx = create_ctx(open('llms.txt').read(), optional=False)
```

Then feed `ctx` into your LLM call as context. The XML-tagged structure works well with Claude; for other models, you may want to convert tags to other formats (the JS port at `nbs/llmstxt-js.html` is an example of an alternative emitter).

### As an integration author

The proposal explicitly invites domain-specific guidance. `nbs/domains.md` shows worked examples for:

- **Restaurants** — a `## Menus` section with `Lunch Menu`, `Dinner Menu`, and a `## Optional` `Dessert Menu` (`nbs/domains.md:37-60`).
- The implication is that any vertical can adopt the same shape: e-commerce sites describe products and policies, schools describe courses, governments describe legislation, individuals describe their CV.

## Mental model for using it well

- **The file is a curated index, not a full doc dump.** The point is not to list every page (sitemap does that) — it's to surface the few links that, expanded, fit in an LLM's window and answer the questions users will actually ask.
- **Treat the blockquote as load-bearing.** The H1 is just a label. The `> summary` is what an LLM reads first to decide if your site is the right source. Spend real time on that single paragraph.
- **`## Optional` is your context budget control.** Anything that an LLM can skip without losing the core answer goes there. If you find yourself writing four `## Optional` sections, you're putting too much in primary.
- **Write link descriptions, not link names.** `[FastHTML quick start](url): A brief overview of many FastHTML features` is much more useful to an LLM picking which link to follow than `[FastHTML quick start](url)` alone (`nbs/index.qmd:96`).
- **Generate `.md` URLs automatically; don't hand-maintain.** nbdev / VitePress / Docusaurus plugins exist for this reason. Hand-maintained sidecar markdown will rot.
- **Test against an actual LLM, not just regex.** The format being parseable is necessary but not sufficient. The reason `nbs/domains.md` ships a Claude test harness is that the structure can be valid while the content is unhelpful — only an end-to-end test catches that.
- **Pre-publish `llms-ctx*.txt` if your audience cares about latency.** Expanding link contents at inference time is N HTTP fetches. Pre-publishing the expansion as a static file is one fetch.
- **Update like docs, not like code.** Like AGENTS.md, this is living documentation. Re-run `llms_txt2ctx` whenever upstream link content changes.

## When NOT to reach for this

- **You don't have a website.** `llms.txt` lives at `/llms.txt` on a host. If your content is in a private repo, behind auth, or not on a public URL, the convention doesn't apply — use AGENTS.md (for repos) or pass content directly to your LLM.
- **You're targeting training crawlers, not inference-time agents.** llms.txt is explicitly about inference. If you want to control what's used to train a model, that's robots.txt + per-vendor opt-out signals + legal terms.
- **Your site doesn't fit the "curated index of markdown links" shape.** Highly transactional sites (a checkout flow, a real-time dashboard) aren't well-served. Sites whose value is the page UX rather than the document content are also not a fit.
- **You can't generate clean markdown for your pages.** The `.md` URL companion convention is half the value. If your pages are JS-heavy SPAs that don't have a clean text representation, the links in your `llms.txt` will be next to useless.
- **You need behavioral guarantees from consumers.** Like AGENTS.md and unlike A2A, llms.txt is *advisory*. There's no validator and no enforcement. An LLM may or may not fetch your file. An agent may or may not respect `## Optional`.
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
| **Special semantics** | `## Optional` H2 = skippable for shorter context | "Closest file wins" precedence; chat overrides |
| **Reference parser** | `llms-txt` (PyPI), `llms_txt2ctx` CLI | None — each consumer parses ad hoc |
| **Companion convention** | `.md` URLs sidecar every useful HTML page | Nested `AGENTS.md` files override parents per directory |
| **Stewardship** | Community / Answer.AI / Jeremy Howard | Linux Foundation (Agentic AI Foundation) |
| **Originating collaborators** | Single proposer (Howard, 2024-09-03) | OpenAI Codex, Amp, Jules, Cursor, Factory |
| **Adoption signal** | Directory sites (`llmstxt.site`, `directory.llmstxt.cloud`); plugin ecosystem (VitePress, Docusaurus, Drupal, PHP, VS Code) | 23+ coding agents support natively; 60k+ public repos |

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

## One-line summary

> llms.txt wins by being the *website-side* analogue to AGENTS.md — a single well-known file at `/llms.txt` with a strict-but-tiny markdown shape (H1 + blockquote + curated link lists, with `## Optional` as the context-budget knob), a companion `.md`-URL convention that sidecars clean markdown next to every HTML page, and a 100-line Python parser plus `llms_txt2ctx` CLI that expands the file into XML-tagged Claude-ready context — all of which lets a website declare "here's what an LLM needs to know to use me at inference time" without inventing yet another proprietary format.

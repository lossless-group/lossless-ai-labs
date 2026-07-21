---
from: "dididecks-ai"
from_path: "context-v/agent-skills/astro-knots/references/playbooks/llms-txt-and-md-sidecars.md"
---

# Playbook: `/llms.txt` + `.md` Sidecars

How an Astro-Knots site declares itself LLM-friendly using the [llms.txt proposal](https://llmstxt.org). Two artifacts, both small:

1. A `/llms.txt` at the site root — a curated, markdown-structured index for LLMs at inference time.
2. A `.md` sidecar next to every useful HTML page — same URL, `.md` appended (e.g. `/docs/foo` → `/docs/foo.md`).

**Source profile:** `studies/open-specs-and-standards/context-v/profiles/Profile__llms-txt.md` in the open-specs-and-standards study (cites the original Howard / Answer.AI proposal at `nbs/index.qmd`).

> Astro does **not** auto-generate either of these the way nbdev / VitePress / Docusaurus do. There's a gap. Fill it deliberately on sites where it matters.

## When to ship this

Ship llms.txt + sidecars when **both** are true:

- The site has content an external LLM would plausibly want to use to answer a user's question — docs, blueprints, study profiles, knowledge bases, public CV/resume content, product docs.
- That content is in markdown collections (Astro content collections, `src/content/`) — so `.md` sidecars are essentially free.

Skip on sites that are mostly transactional, gated, or whose value is the page UX rather than the document content (calmstorm-decks before public launch, ephemeral splash pages, deck-only sites).

## What to ship (the two-file pattern)

### 1. `public/llms.txt`

The simplest possible version is a static file at `public/llms.txt`. Astro serves `public/` verbatim, so it lands at `/llms.txt` automatically. Hand-written or generated — the file itself is small.

Minimum viable shape (per the proposal):

```markdown
# <Site Name>

> One-paragraph summary of what this site is and what an LLM should know to use it. This is the most-read line in the file — spend real time on it.

## Docs

- [Page Title](https://site.com/path.md): One-line description of why an LLM might fetch this.
- [Another](https://site.com/other.md): Description.

## Optional

- [Secondary content](https://site.com/extra.md): Skippable when context is tight.
```

Three rules:

- **Use absolute URLs** in the link list (consumers fetch them; relative URLs break that).
- **Link to the `.md` sidecar URL** (with `.md` appended), not the HTML page. The whole point is clean markdown.
- **Use `## Optional`** for anything an LLM can skip when its context window is tight. This is the proposal's only behavioral semantic.

For sites with stable content collections, prefer **generating** `llms.txt` at build time from the collection rather than hand-maintaining. A small `src/pages/llms.txt.ts` endpoint that iterates `getCollection('docs')` and emits the file is ~40 lines.

### 2. `.md` sidecar route

Astro content collections store the raw markdown as `entry.body`. A single dynamic endpoint serves every entry's markdown at the same URL with `.md` appended:

```ts
// src/pages/docs/[...slug].md.ts
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const entries = await getCollection('docs');
  return entries.map(entry => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

export async function GET({ props }) {
  const { entry } = props;
  return new Response(entry.body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
```

Adapt `[...slug].md.ts` per collection (`/blueprints/[...slug].md.ts`, `/profiles/[...slug].md.ts`). The HTML page lives at `/docs/foo`; the markdown sidecar lives at `/docs/foo.md`. Same URL shape, `.md` appended.

If you have non-collection pages worth serving as markdown (a single `about` page, a top-level `index`), expose them similarly — either copy the source `.md` into `public/` with the right filename, or write a small endpoint per page.

## Dogfood: link `llms.txt` from `MetaTags.astro`

The OpenGraph playbook (`references/playbooks/opengraph-system.md`) defines `MetaTags.astro` as the place all `<head>` metadata lives. Add one line so LLM-aware tooling can discover the file:

```astro
<link rel="alternate" type="text/markdown" href="/llms.txt" />
```

Optional but cheap. Tools that look for `llms.txt` will find it via the homepage URL anyway, but the explicit `<link rel="alternate">` makes it discoverable from any page on the site.

## How this composes with other playbooks

- **`opengraph-system.md`** — the `<head>` is already centralized; add the `<link rel="alternate">` there, not in individual pages.
- **`new-site-setup.md`** — drop a placeholder `public/llms.txt` (just `# <Site Name>` + one-line summary) at scaffold time, even if the link list isn't ready. Future-you fills it in. This is the same logic as scaffolding `MetaTags.astro` before per-page SEO is dialed in.
- **`github-pages-deploy.md`** — `public/llms.txt` ships verbatim on GitHub Pages, no extra config needed. The `.md` sidecar endpoint pattern works on static-export Astro builds because content collections + endpoints with `getStaticPaths` pre-render at build time.
- **LFM (forthcoming skill)** — when LFM is shipping, the markdown stored in `entry.body` will likely include LFM-extended syntax. The sidecar endpoint emits it as-is, which is the right behavior: LLMs benefit from the extra structure, not less.

## When to skip

- **Gated workspace sites** (calmstorm-decks pre-launch, anything with `noindex=true` by default per the OG playbook). If you don't want search engines indexing it, you don't want LLMs ingesting it either.
- **Sites where `entry.body` is not the canonical content.** If your content collection is just a thin wrapper over a CMS, the CMS's own export is more authoritative than re-emitting it from Astro.
- **Decks / slide-only sites.** The "one slide per scroll page" model doesn't carry inference value as standalone markdown.

## What this is *not*

This playbook is **not** about feeding your site into LLM training crawlers — that's robots.txt + per-vendor opt-out. llms.txt is for *inference time*: the moment a user asks an LLM a question and the LLM needs to use your site to answer.

It is also **not** a replacement for `sitemap.xml`. Astro's sitemap integration still belongs on every public site. llms.txt complements it: sitemap is "every page for crawlers," llms.txt is "the curated subset an LLM should read first."

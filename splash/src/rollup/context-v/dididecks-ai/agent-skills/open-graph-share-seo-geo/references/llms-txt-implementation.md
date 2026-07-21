---
from: "dididecks-ai"
from_path: "context-v/agent-skills/open-graph-share-seo-geo/references/llms-txt-implementation.md"
---

# llms.txt — implementation reference

The full porting template for `/llms.txt` and `/llms-full.txt` on any
content-heavy Astro site. Read the parent `SKILL.md` first for the rules
and rationale; this file is the concrete recipe.

The canonical reference is `ai-labs/context-vigilance-kit/splash/`. Anything
in this file that diverges from that splash is a bug — fix the splash *and*
this doc rather than letting them drift.

## Directory layout

```
splash/
├── src/
│   ├── llms/
│   │   ├── README.md          # token vocabulary, scoped to this site
│   │   ├── llms.md            # template for /llms.txt
│   │   └── llms-full.md       # template for /llms-full.txt (optional)
│   ├── pages/
│   │   ├── llms.txt.ts        # endpoint — assembles /llms.txt
│   │   └── llms-full.txt.ts   # endpoint — assembles /llms-full.txt
│   └── lib/
│       └── seo.ts             # already present; provides STATIC_SEO.siteName
└── astro.config.mjs           # `site` and `base` are read by the endpoints
```

The `src/llms/` directory is a *peer* of `src/lib/`, `src/pages/`, etc. —
not nested under `src/content/`, because these markdown files are templates
for an endpoint, not entries in an Astro content collection.

## Markdown template — `src/llms/llms.md`

The body is whatever voice fits the site. The example below is the
context-vigilance-kit version — adapt the prose, keep the token shape.

````markdown
# Site Title

> {{SITE_NAME}}

One-paragraph framing of what this site is, who it serves, and why an LLM
ingesting it might benefit. Reference {{ENTRY_COUNT}} and {{REPO_COUNT}}
inline if those numbers help orient the reader.

## Reference

- [Full-text search]({{SEARCH_URL}}): one-line description.
- [Full corpus content]({{LLMS_FULL_URL}}): every corpus entry concatenated as raw markdown — preferred ingest target for LLMs that can handle a single large document.
- [Source repository](https://github.com/ORG/REPO): one-line description.
- [Lossless Group](https://lossless.group): the org that maintains this practice.

## Corpus

One short paragraph framing what's in the corpus. Grouped by source repository.

{{CORPUS_INDEX}}
````

## Markdown template — `src/llms/llms-full.md`

````markdown
# Site Title — Full Corpus

> {{SITE_NAME}}

{{ENTRY_COUNT}} documents from the corpus, concatenated as raw markdown for
LLM ingest. Each document is preceded by a metadata header (title, source
repo, source path, canonical URL, last-modified date) and separated by a
horizontal rule.

See also: {{LLMS_INDEX_URL}} (link index, lighter weight).

{{CORPUS_BODIES}}
````

## Token vocabulary file — `src/llms/README.md`

The site's local README documents which tokens its templates use, what each
substitutes to, and which are required vs optional. Copy-paste from the
context-vigilance-kit version and edit for site-specific tokens. Without
this file, future editors cannot know what's available.

## Endpoint — `src/pages/llms.txt.ts`

```ts
/**
 * /llms.txt — corpus link index for LLM consumers.
 *
 * Spec: https://llmstxt.org/
 *
 * The human-editable prose template lives at `src/llms/llms.md` (with token
 * documentation in `src/llms/README.md`). This file is the dumb assembler:
 * load template, compute dynamic values, substitute tokens.
 */

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { STATIC_SEO } from '@lib/seo';
import template from '../llms/llms.md?raw';

export const GET: APIRoute = async () => {
  const site = import.meta.env.SITE ?? 'https://example.com';
  const base = import.meta.env.BASE_URL ?? '/';
  const root = new URL(base, site).toString().replace(/\/$/, '');

  const all = await getCollection('corpus'); // adapt collection name per site
  const published = all.filter(
    (e) => (e.data as any).publish !== false && (e.data as any).private !== true,
  );

  // Group by source repo (or other organizing axis)
  const byRepo = new Map<string, typeof published>();
  for (const entry of published) {
    const repo = (entry.data as any).source_repo_slug || 'unknown';
    if (!byRepo.has(repo)) byRepo.set(repo, [] as any);
    byRepo.get(repo)!.push(entry);
  }
  const repos = [...byRepo.keys()].sort();
  for (const repo of repos) {
    byRepo.get(repo)!.sort((a, b) => {
      const ta = ((a.data as any).title ?? a.id).toLowerCase();
      const tb = ((b.data as any).title ?? b.id).toLowerCase();
      return ta.localeCompare(tb);
    });
  }

  const corpusLines: string[] = [];
  for (const repo of repos) {
    corpusLines.push(`### ${repo}`);
    corpusLines.push('');
    for (const entry of byRepo.get(repo)!) {
      const data = entry.data as any;
      const title = data.title ?? entry.id;
      const url = `${root}/corpus/${entry.id}/`;
      const lede = data.lede ?? data.description ?? data.summary;
      corpusLines.push(lede ? `- [${title}](${url}): ${lede}` : `- [${title}](${url})`);
    }
    corpusLines.push('');
  }

  const tokens: Record<string, string> = {
    SITE_NAME: STATIC_SEO.siteName,
    ENTRY_COUNT: String(published.length),
    REPO_COUNT: String(repos.length),
    SEARCH_URL: `${root}/search/`,
    LLMS_FULL_URL: `${root}/llms-full.txt`,
    LLMS_INDEX_URL: `${root}/llms.txt`,
    CORPUS_INDEX: corpusLines.join('\n').trimEnd(),
  };

  const body = template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(tokens, name) ? tokens[name] : match,
  );

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
```

## Endpoint — `src/pages/llms-full.txt.ts`

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { STATIC_SEO } from '@lib/seo';
import template from '../llms/llms-full.md?raw';

export const GET: APIRoute = async () => {
  const site = import.meta.env.SITE ?? 'https://example.com';
  const base = import.meta.env.BASE_URL ?? '/';
  const root = new URL(base, site).toString().replace(/\/$/, '');

  const all = await getCollection('corpus');
  const published = all.filter(
    (e) => (e.data as any).publish !== false && (e.data as any).private !== true,
  );

  published.sort((a, b) => {
    const ra = ((a.data as any).source_repo_slug || 'unknown').toLowerCase();
    const rb = ((b.data as any).source_repo_slug || 'unknown').toLowerCase();
    if (ra !== rb) return ra.localeCompare(rb);
    const ta = ((a.data as any).title ?? a.id).toLowerCase();
    const tb = ((b.data as any).title ?? b.id).toLowerCase();
    return ta.localeCompare(tb);
  });

  const bodyParts: string[] = [];
  for (const entry of published) {
    const data = entry.data as any;
    const title = data.title ?? entry.id;
    const repo = data.source_repo_slug || 'unknown';
    const sourcePath = data.source_relative_path || entry.id;
    const url = `${root}/corpus/${entry.id}/`;

    bodyParts.push('---');
    bodyParts.push('');
    bodyParts.push(`## ${title}`);
    bodyParts.push('');
    bodyParts.push(`- Source repo: \`${repo}\``);
    bodyParts.push(`- Source path: \`${sourcePath}\``);
    bodyParts.push(`- Canonical URL: ${url}`);
    if (data.date_modified) {
      const dm = data.date_modified instanceof Date ? data.date_modified : new Date(data.date_modified);
      if (!Number.isNaN(dm.getTime())) bodyParts.push(`- Last modified: ${dm.toISOString().slice(0, 10)}`);
    }
    bodyParts.push('');
    bodyParts.push(entry.body ?? '');
    bodyParts.push('');
  }

  const tokens: Record<string, string> = {
    SITE_NAME: STATIC_SEO.siteName,
    ENTRY_COUNT: String(published.length),
    LLMS_INDEX_URL: `${root}/llms.txt`,
    CORPUS_BODIES: bodyParts.join('\n').trimEnd(),
  };

  const body = template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(tokens, name) ? tokens[name] : match,
  );

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
```

## Porting walkthrough — adapting to a new splash

1. **Identify the content collection**, the publish/private gate, and the
   organizing axis (source repo, category, date). For corpus-based splashes
   it's `getCollection('corpus')` grouped by `source_repo_slug`. For a blog
   it might be `getCollection('blog')` grouped by tag.
2. **Match the publish gate to whatever the page templates use.** Copy the
   exact predicate from the corresponding `[...slug].astro` so they cannot
   drift. If the rendered HTML excludes drafts, the LLM-facing files must
   exclude them too.
3. **Confirm `STATIC_SEO.siteName` exists** in the site's `src/lib/seo.ts`.
   If the site uses a different name for its static SEO registry, swap the
   import accordingly. Do not hardcode the site name in the endpoint.
4. **Verify the path alias `@lib`** resolves in the site's `tsconfig.json`.
   If not, adjust the import.
5. **Create `src/llms/{llms.md, llms-full.md, README.md}`** — copy the
   templates above and tailor the prose to the site's voice. Tokens stay
   the same unless you need new ones.
6. **Create `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts`** —
   copy the endpoints above. Adapt the collection name, the URL pattern
   (`${root}/corpus/${entry.id}/` may differ), and the grouping axis if
   the site organizes content differently.
7. **Build and inspect.** `pnpm build`, then `ls -lh dist/llms*.txt`. The
   index should be tens to hundreds of KB; the full file scales with content.
8. **Spot-check the substituted output.** No `{{TOKEN}}` should remain in
   the rendered files. The blockquote should show the site name. The
   reference links should resolve.
9. **Add the optional discoverability link to `BaseLayout.astro`:**
   ```html
   <link rel="alternate" type="text/markdown" href={`${base}llms.txt`} title="llms.txt for this site" />
   ```

## Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| `{{TOKEN}}` still appears in output | Token name typo in template OR not in endpoint's tokens map | Check both files; missing tokens pass through unchanged on purpose |
| Endpoint emits but file is missing from `dist/` | Filename doesn't end `.txt.ts` | Astro routes the URL based on the filename minus `.ts` — must be `llms.txt.ts`, not `llms.ts` |
| URLs are relative or rooted at wrong domain | `import.meta.env.SITE` is unset or wrong in `astro.config.mjs` | Confirm `site:` is set and matches the deployed origin |
| `/llms-full.txt` is multiple MB and slowing builds | Expected — it's a full concatenation | If genuinely too big, split by collection or skip `/llms-full.txt` and ship only `/llms.txt` |
| Drafts appearing in `/llms-full.txt` | Publish gate copy-pasted from outdated source | Re-derive the predicate from the live `[...slug].astro` and replace |
| Crawler can't find the file via convention discovery | Site is on a path-deployed GitHub Pages URL | Expected until custom domain lands; add `<link rel="alternate" type="text/markdown">` for explicit discoverability |

## When to NOT use this pattern

- **Single-page marketing sites with no content collection.** The whole point is iteration over a corpus. If you'd just be listing 5 pages, write `/llms.txt` as a static `public/llms.txt` with hand-edited link list.
- **Slide-deck-only sites (fundraise decks).** Crawl-and-cite is rarely the goal; access gates often apply.
- **Sites where the rendered HTML is the canonical source.** If your content is HTML-first (heavy interactivity, forms, JS-rendered), `/llms-full.txt` from a markdown collection won't reflect the actual site. In those cases, omit `/llms-full.txt` and ship only `/llms.txt` with link descriptions.

## Reference

- [The llms.txt specification](https://llmstxt.org/)
- Canonical Lossless implementation: `ai-labs/context-vigilance-kit/splash/`
- Parent skill: [SKILL.md](../SKILL.md) — the broader OG/SEO/GEO conventions this fits into

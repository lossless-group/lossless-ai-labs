---
from: "dididecks-ai"
from_path: "context-v/agent-skills/open-graph-share-seo-geo/references/sitemap-implementation.md"
---

# Sitemap & robots.txt — implementation reference

The full porting template for `@astrojs/sitemap` + `robots.txt` + the head link tag on any Astro site we ship. Read the parent `SKILL.md` first for the rules and rationale; this file is the concrete recipe.

The five Lossless splashes (cvk, astro-knots, content-farm, memopop-site, lfm) all ship this pattern. Anything in this file that diverges from those splashes is a bug — fix the splash *and* this doc rather than letting them drift.

## Three artifacts

1. **`@astrojs/sitemap` integration** in `astro.config.mjs` — auto-generates `dist/sitemap-index.xml` + `dist/sitemap-0.xml` at build time.
2. **`public/robots.txt`** — copied through to `dist/robots.txt`, points crawlers at the absolute sitemap URL.
3. **`<link rel="sitemap" type="application/xml">`** in `BaseLayout.astro` — in-document discoverability.

## Step 1 — Install the integration

```bash
# pnpm splashes (cvk, content-farm, astro-knots, lfm):
pnpm add @astrojs/sitemap --ignore-workspace

# bun splashes (memopop-ai):
bun add @astrojs/sitemap
```

The `--ignore-workspace` flag is required on Lossless splashes that opt out of their parent's pnpm-workspace per the splash habit.

## Step 2 — Update `astro.config.mjs`

```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
// ... any existing integrations (pagefind, etc.)

export default defineConfig({
  site: 'https://lossless-group.github.io',
  base: '/your-repo/',
  trailingSlash: 'ignore',

  integrations: [
    // ... existing integrations stay where they are
    sitemap({
      filter: (page) =>
        !page.includes('/llms.txt') &&
        !page.includes('/llms-full.txt') &&
        !page.endsWith('/404/') &&
        !page.endsWith('/404'),
    }),
  ],
});
```

Two things to preserve when editing:

- **Existing integrations.** If the splash already has `pagefind()`, keep it. Sitemap goes alongside, not in place of.
- **Existing `build.format`, `trailingSlash`, etc.** Those interact with the URLs Astro emits. Don't change them while adding sitemap.

If the splash had no `integrations` array at all (e.g., astro-knots before this rollout), add one fresh containing only `sitemap()`.

## Step 3 — Create `public/robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://lossless-group.github.io/your-repo/sitemap-index.xml
```

The `Sitemap:` URL **must be absolute and must include the base path** for path-deployed splashes. Compute it from `astro.config.mjs`:

```
${site}${base}sitemap-index.xml
```

For the five Lossless splashes today:

| Splash | Sitemap URL |
|---|---|
| cvk | `https://lossless-group.github.io/context-vigilance-kit/sitemap-index.xml` |
| astro-knots | `https://lossless-group.github.io/astro-knots/sitemap-index.xml` |
| content-farm | `https://lossless-group.github.io/content-farm/sitemap-index.xml` |
| memopop-site | `https://lossless-group.github.io/memopop-ai/sitemap-index.xml` |
| lfm | `https://lossless-group.github.io/lossless-flavored-markdown-package/sitemap-index.xml` |

When a splash moves to a custom domain (e.g., `contextvigilance.com`), update both `astro.config.mjs` (`site` to the domain, `base` to `'/'`) and `robots.txt` (the `Sitemap:` line).

## Step 4 — Add `<link rel="sitemap">` to `BaseLayout.astro`

```astro
<link rel="icon" type="image/svg+xml" href={`${base}favicon.svg`} />
<link rel="sitemap" type="application/xml" href={`${base}sitemap-index.xml`} />
<link
  rel="alternate"
  type="text/markdown"
  href={`${base}llms.txt`}
  title="llms.txt for this site"
/>
```

Place the sitemap and llms.txt links together near the favicon — they're all root-relative resource hints that belong in the same neighborhood.

## Step 5 — Build and verify

```bash
pnpm build  # or `bun run build` on memopop

ls -lh dist/sitemap-*.xml dist/robots.txt
# Expected: sitemap-index.xml, sitemap-0.xml, robots.txt all present

# URL count — Astro emits single-line minified XML, so use grep -o not grep -c
grep -o '<url>' dist/sitemap-0.xml | wc -l

# Filter verification — these should all return empty
grep -E '/llms\.txt</loc>' dist/sitemap-0.xml
grep -E '/llms-full\.txt</loc>' dist/sitemap-0.xml
grep -E '/404/</loc>' dist/sitemap-0.xml
# (Note: matching <loc> closing tag avoids false positives on corpus content
# with "llms" or "404" in their slugs)

cat dist/robots.txt
# Expected: User-agent: *, Allow: /, Sitemap: <absolute URL>

grep 'rel="sitemap"' dist/index.html
# Expected: the link tag with the correct base path

grep 'rel="alternate" type="text/markdown"' dist/index.html
# Expected: the llms.txt link tag
```

## The URL-counting gotcha

Astro's sitemap output is single-line minified XML. **`grep -c '<url>' dist/sitemap-0.xml` always returns `1`** because it counts matching lines, not occurrences. This catches every developer the first time they verify.

The right command:

```bash
grep -o '<url>' dist/sitemap-0.xml | wc -l
```

Or with `xmllint`:

```bash
xmllint --xpath 'count(//*[local-name()="url"])' dist/sitemap-0.xml
```

## Filter design — what to exclude, what to include

| Route pattern | Filter behavior | Why |
|---|---|---|
| `/llms.txt` | Exclude | LLM endpoint, not a search-engine page |
| `/llms-full.txt` | Exclude | Same, plus multi-MB content wastes crawl budget |
| `/404/` | Exclude | Status page, not content |
| `/search/` | **Include** | A legitimate user destination; useful in search results |
| `/changelog/` index + entries | Include | Real content |
| `/context-v/` index + entries | Include | Real content |
| `/corpus/` index + entries | Include | Real content (cvk specifically) |
| Other API/JSON endpoints | Exclude (extend filter) | Same reasoning as llms.txt |

If a splash adds new `.txt`, `.json`, or other non-HTML routes, extend the filter. Don't relax the existing exclusions.

## Multi-splash variants we've encountered

Across the five-splash rollout, agents observed:

- **No pre-existing integrations array** (astro-knots/splash) — create one fresh containing only `sitemap()`. Other integrations can be added later.
- **bun-managed splash** (memopop-ai) — use `bun add` instead of `pnpm add`. The integration's runtime behavior is identical.
- **Long base paths** (lfm/splash uses `/lossless-flavored-markdown-package/`, not `/lfm/`) — read `astro.config.mjs` carefully when computing the absolute Sitemap URL for `robots.txt`.
- **Incidental dep bumps** (`pnpm add` may upgrade Astro to match the registry's latest minor) — not a sitemap concern, but worth noticing in the diff before committing.

## Custom-domain migration recipe

When a splash moves from `lossless-group.github.io/<repo>/` to a custom domain:

1. **`astro.config.mjs`**: change `site` to the domain (e.g., `https://contextvigilance.com`), change `base` to `'/'`.
2. **`public/robots.txt`**: update the `Sitemap:` line to the new absolute URL.
3. **No code changes** in the integration call or BaseLayout — `${base}sitemap-index.xml` and `${base}llms.txt` automatically become `/sitemap-index.xml` and `/llms.txt`.
4. **Submit the new sitemap** to Google Search Console / Bing Webmaster Tools so they discover the moved content quickly.

## When to NOT use `@astrojs/sitemap`

- **Slide-deck-only sites and gated decks** — you don't want a sitemap pointing search engines at content that's behind an access gate. Skip the integration; ship a `robots.txt` with `Disallow: /` instead.
- **Static one-page landings with a single route** — overkill. The sitemap would have one URL. Just rely on the canonical link.
- **Sites that genuinely don't want to be indexed** — internal tooling, admin dashboards, design-system viewers. Ship `robots.txt` with `Disallow: /` and skip the integration entirely.

## Cross-skill ties

- **llms.txt** lives in [`references/llms-txt-implementation.md`](llms-txt-implementation.md) and the `## llms.txt` section of `SKILL.md`. Sitemap and llms.txt are *complementary* — sitemap for search engines, llms.txt for LLMs. Both are filtered carefully so they don't pollute each other.
- **Splash habit** at `context-v/habits/Maintain-a-Github-Splash-Page-for-each-Repo.md` lists sitemap+robots as part of "what every splash ships."
- **Sitemap habit** at `context-v/habits/Maintain-Sitemap-and-Robots-across-Significant-Sites-&-Splash-Pages.md` codifies when this applies and how it's maintained.

## Reference

- [`@astrojs/sitemap` documentation](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Sitemaps protocol (sitemaps.org)](https://www.sitemaps.org/)
- [Google Search Central — Sitemap docs](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- Canonical Lossless implementations: all five splashes listed in the table above.

---
name: open-graph-share-seo-geo
description: How to make a page unfurl reliably in iMessage, WhatsApp, Slack, Discord, LinkedIn, and X; surface to search engines via sitemap.xml + robots.txt; and stay legible to generative engines (GEO), including the llms.txt standard for LLM corpus ingest. Use when adding or debugging OpenGraph / Twitter Card metadata, picking an OG image format, choosing where to host the image, fixing pages that "won't unfurl", auditing share previews, scaffolding /llms.txt and /llms-full.txt, or adding @astrojs/sitemap + robots.txt to a splash or marketing site. Encodes the JPEG-over-WebP rule, the ImageKit content-negotiation gotcha, the absolute-URL requirement, the og:image:type-must-match-bytes invariant, the cache-busting recipe for forcing a re-unfurl, the prose-in-markdown source-of-truth pattern for llms.txt, and the sitemap filter that keeps non-HTML routes (llms.txt, 404) out of the search-engine index.
from: "dididecks-ai"
from_path: "context-v/agent-skills/open-graph-share-seo-geo/SKILL.md"
---
# OpenGraph, Share, SEO & GEO

> Make the link unfurl. Make it fast. Make it match the bytes.

Lossless Group convention for share metadata across all sites (Astro Knots, plugin pages, splash, fundraise decks). Optimized for **iMessage and WhatsApp first** (the channels we share through most), with Slack, Discord, LinkedIn, X, Facebook, and generative engines (Perplexity, ChatGPT, Claude, Gemini) as concentric rings around that.

## When to use this skill

- Adding or auditing `<head>` meta tags on any page that gets shared
- "It's not unfurling in iMessage / WhatsApp / Slack" debugging
- Picking the OG image format (`.webp` vs `.jpg` vs `.png`)
- Deciding where to host the OG image (`/public` vs CDN)
- Building or modifying a `MetaTags`-style component
- Reviewing or shipping a marketing splash, plugin page, blog post, fundraise deck
- Setting up GEO (Generative Engine Optimization) on a content-heavy page
- Scaffolding `/llms.txt` and `/llms-full.txt` for LLM corpus ingest, or porting that pattern to a new splash
- Adding `@astrojs/sitemap` + `robots.txt` to a splash or marketing site for proper search-engine discoverability

## Hard rules (Why + How to apply)

### 1. Host the OG image on a remote CDN, not `/public`

**Rule:** Default OG image goes on a CDN (ImageKit, Cloudflare Images, S3+CloudFront, Vercel Blob). Do not point `og:image` at a local `/public/og.png` served by GitHub Pages or a static host.

**Why:** Local assets behind GitHub Pages unfurl intermittently in iMessage, WhatsApp, and Slack. The original page renders fine, but the unfurler silently skips the image — usually because of slow first-byte time, missing `Content-Length`, missing CORS, or aggressive negative caching. CDNs (ImageKit in particular) ship the right headers (`access-control-allow-origin: *`, `cache-control: public, max-age=…`, accurate `content-length`, `etag`) and serve from edges close to the unfurler.

**How to apply:** When scaffolding a new site's OG defaults, upload the banner to ImageKit first and reference the absolute URL. Treat `/public/og-default.png` as a fallback only — better yet, do not bother committing it.

### 2. Prefer JPEG over WebP for the bytes the unfurler receives

**Rule:** The image bytes that reach iMessage, WhatsApp, Slack, Discord, LinkedIn, X, and Facebook should be **JPEG**. PNG is a fine second choice for graphics with text. WebP is risky.

**Why:** WebP support across unfurlers is uneven and historically silent-failing. iMessage and WhatsApp have both shipped versions that ignore WebP previews entirely. JPEG is universally accepted, ~95 KB at 1200×630 for a photographic banner — small enough that no unfurler chokes on it.

**How to apply:** If you are exporting from Image-Gin / Figma / Photoshop, export JPEG. If you are using ImageKit transformations, request `?tr=f-jpg` or rely on its content negotiation (see rule 3). To convert an existing local file, the user is likely to have `ffmpeg` installed — `ffmpeg -i in.webp out.jpg` is the simplest one-liner; see [references/seo-best-practices.md](references/seo-best-practices.md) for more conversion recipes.

### 3. `og:image:type` must match the actual bytes the unfurler receives — not the URL extension

**Rule:** Verify with `curl -sI` (no `Accept` header) what `content-type` the server returns. Whatever that is — `image/jpeg`, `image/png`, `image/webp` — is what goes in `<meta property="og:image:type">`. The URL's file extension is not authoritative.

**Why:** ImageKit (and many modern CDNs) content-negotiate via `Vary: Accept`. A URL ending in `.webp` will serve `image/webp` to a Chrome browser that sends `Accept: image/webp`, but `image/jpeg` to an unfurler that doesn't. If your meta tag declares `image/webp` but the unfurler downloads `image/jpeg`, strict validators (and some unfurlers) bail. Match the declared type to the bytes most unfurlers actually receive.

**How to apply:** Before committing, run:
```bash
curl -sI "<your-og-image-url>" | grep -iE "content-type|content-length|vary"
```
The `content-type` line is what you put in `og:image:type`. If `vary: accept` is present, you are content-negotiated — declare the JPEG/PNG response (the no-`Accept` default), not the WebP variant.

### 4. Absolute URLs only

**Rule:** Every `og:image`, `og:image:secure_url`, `og:url`, `twitter:image`, and canonical `href` is a fully qualified `https://…` URL.

**Why:** Unfurlers do not know the origin. A path like `/og.png` resolves to *their* origin (often nothing) and is dropped. This bites especially hard on sites served under a base path (GitHub Pages `/repo-name/`).

**How to apply:** In Astro, build the absolute URL from `Astro.site` (or `Astro.url.origin`) plus `import.meta.env.BASE_URL` plus the path. Branch on `startsWith('http')` so absolute URLs pass through untouched. See the `MetaTags.astro` pattern in any Astro Knots site.

### 5. Always emit the full image-meta sextet

**Rule:** Every page emits all six OG image properties:

```html
<meta property="og:image"            content="https://cdn.example.com/banner.jpg" />
<meta property="og:image:secure_url" content="https://cdn.example.com/banner.jpg" />
<meta property="og:image:type"       content="image/jpeg" />
<meta property="og:image:width"      content="1200" />
<meta property="og:image:height"     content="630" />
<meta property="og:image:alt"        content="Descriptive alt text — one short sentence." />
```

Plus the Twitter card pair:
```html
<meta name="twitter:card"     content="summary_large_image" />
<meta name="twitter:image"    content="https://cdn.example.com/banner.jpg" />
<meta name="twitter:image:alt" content="Descriptive alt text — one short sentence." />
```

**Why:** Width and height let the unfurler reserve layout space without downloading the image. Type lets it skip formats it cannot render. Alt is required for accessibility *and* used by some clients (Slack) as the fallback caption. `secure_url` is legacy but still consulted by older clients. Omitting any of these turns into "sometimes it shows, sometimes it doesn't."

### 6. Standard banner dimensions: 1200 × 630

**Rule:** Default OG banners are **1200 × 630** (the "Image-Gin wide" standard). Plugin/page-specific overrides may use other ratios but must declare matching width/height in the meta tags.

**Why:** 1200 × 630 is the largest size Facebook/LinkedIn/X render without re-cropping, the size iMessage and WhatsApp expect for "rich" previews, and small enough (~90–150 KB JPEG) for fast unfurling. 1408 × 704 and similar non-standard sizes get center-cropped or downscaled inconsistently.

**How to apply:** Image-Gin is configured to export 1200 × 630. If you are hand-cropping in Figma, snap to that size. Never declare width/height that do not match the actual file.

### 7. Cache-bust to force a re-unfurl

**Rule:** When you change an OG image or the meta tags and the old preview keeps showing, append `?v=2` (or any new query string) to `og:url` and the share URL.

**Why:** iMessage, WhatsApp, Slack, and Discord cache OG metadata **per exact URL**, often for days. They do not honor `Cache-Control` from your origin for this — only a different URL invalidates. Most have no public "force re-fetch" button.

**How to apply:** For one-off shares, just paste `https://example.com/page?v=2`. For a permanent re-unfurl on a marketing page, bump a version in the canonical URL and add a redirect from the old. For Facebook/LinkedIn, use their debuggers (see references/unfurler-matrix.md).

## The minimum viable `<head>`

```html
<!-- Title + description -->
<title>Page Title — site-name</title>
<meta name="description" content="One-sentence description, ≤155 characters, no trailing site-name." />
<link rel="canonical" href="https://example.com/page" />

<!-- OpenGraph -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="site-name" />
<meta property="og:title" content="Page Title — site-name" />
<meta property="og:description" content="Same one-sentence description." />
<meta property="og:url" content="https://example.com/page" />
<meta property="og:image" content="https://cdn.example.com/banner.jpg" />
<meta property="og:image:secure_url" content="https://cdn.example.com/banner.jpg" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Descriptive alt text." />

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Page Title — site-name" />
<meta name="twitter:description" content="Same one-sentence description." />
<meta name="twitter:image" content="https://cdn.example.com/banner.jpg" />
<meta name="twitter:image:alt" content="Descriptive alt text." />
```

For `og:type=article` add `article:published_time`, `article:modified_time`, `article:author`, and one `article:tag` per tag.

## Character limits (truncate at render, not source)

| Field          | Limit | Notes                                                              |
| -------------- | ----- | ------------------------------------------------------------------ |
| `<title>`      | 60    | Including site-name suffix. Truncate at word boundary with ellipsis. |
| `description`  | 155   | Same string for `<meta>`, `og:description`, `twitter:description`. |
| `og:image:alt` | 420   | Practically: one short sentence.                                   |

Store the long version in your SEO registry; truncate inside the `MetaTags` component.

## GEO (Generative Engine Optimization) — the bonus layer

Generative engines (Perplexity, ChatGPT search, Claude, Gemini, Google AI Overviews) consume the same `<head>` metadata as social unfurlers, plus a few extras. The OpenGraph rules above already cover ~80% of GEO. Add these:

1. **JSON-LD `Article` schema** for blog/changelog/long-form pages. `@context: https://schema.org`, `@type: Article` (or `BlogPosting`, `NewsArticle`), `headline`, `description`, `image`, `datePublished`, `dateModified`, `author`. Generative engines use this as ground truth more than they use OG tags.
2. **Clear, factual first paragraph.** The first 200 characters of body text are what gets quoted. Lead with the claim, not a hook.
3. **`<h1>` matches `<title>` semantically.** Engines penalize divergence between them as a relevance signal.
4. **Stable canonical URLs.** Do not let GEO-indexable content live behind query-string variants. Always set `<link rel="canonical">`.
5. **`robots.txt` allows AI crawlers** (or the specific ones you want to be cited by). The default is conservative — explicitly allow `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` if you want to be cited.

For the deeper schema.org patterns, defer to the page-type-specific spec when one exists in `context-v/` of the project. For broader on-page and technical SEO concerns that also feed GEO (canonicals, sitemaps, breadcrumbs, anti-patterns), see [references/seo-best-practices.md](references/seo-best-practices.md).

## Sitemap & robots.txt — proper search-engine discoverability

Every Lossless Astro site that wants to be indexed (every splash, every marketing site, anything other than gated decks) ships `sitemap-index.xml` + `sitemap-0.xml` plus `robots.txt`. The Astro team maintains an official integration that handles 95% of this for free.

### The integration

[`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — official, maintained by Astro Core. Install + add to integrations array. It walks every static route Astro emits at build time and writes `dist/sitemap-index.xml` + `dist/sitemap-0.xml` with absolute URLs derived from the `site` + `base` config you already have.

```bash
pnpm add @astrojs/sitemap
# or, on bun-based splashes (memopop):
bun add @astrojs/sitemap
```

```js
// astro.config.mjs
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lossless-group.github.io',
  base: '/your-repo/',
  integrations: [
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

### Hard rules (Why + How to apply)

#### Rule SM-1: Filter non-HTML routes out of the sitemap

**Why:** sitemaps are for HTML pages search engines can rank and serve to humans. The `/llms.txt` and `/llms-full.txt` endpoints are markdown for LLM consumers — they're not pages a Google searcher should land on. Likewise `/404` is a status page, not content. Including them pollutes the index, can confuse crawlers, and (in the case of `/llms-full.txt` at multiple MB) wastes crawl budget.

**How to apply:** every Lossless splash uses the filter shown above. Copy it verbatim. If your site adds new non-HTML endpoints, extend the filter — don't remove existing exclusions.

#### Rule SM-2: Ship `public/robots.txt` with an absolute `Sitemap:` line

**Why:** robots.txt is the canonical discovery path. Crawlers fetch `/robots.txt` first and follow the `Sitemap:` directive to find the sitemap. Without it, you depend on the crawler stumbling onto `/sitemap-index.xml` by convention — which works for Google but isn't guaranteed elsewhere.

**How to apply:** create `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://your-host/your-base/sitemap-index.xml
```

The `Sitemap:` URL must be **absolute** (with protocol and full path). If your splash is path-deployed under GitHub Pages, the path must be in the URL — e.g., `https://lossless-group.github.io/content-farm/sitemap-index.xml`. Astro copies `public/` files through to `dist/` unchanged, so robots.txt deploys to `/robots.txt` at the host root.

For path-deployed splashes the file *also* deploys at `/your-base/robots.txt` — which is fine. Crawlers always check the host root first.

#### Rule SM-3: Add `<link rel="sitemap">` to BaseLayout's `<head>`

**Why:** small, harmless, helps tools that prefer in-document discovery (some site auditors, some custom crawlers). Costs nothing.

**How to apply:**

```astro
<link rel="sitemap" type="application/xml" href={`${base}sitemap-index.xml`} />
```

Place it near the favicon `<link>` tag — both are root-relative resource hints that belong together.

#### Rule SM-4: One integration call, one filter, no `customPages`

**Why:** the integration auto-discovers every page Astro emits. We don't have hand-rolled routes that need explicit registration. Adding `customPages` is a smell — it usually means someone is trying to fix a routing problem in the wrong place.

**How to apply:** never pass `customPages`. If a page isn't in the sitemap, it's because (a) the filter is excluding it, (b) it's not actually being rendered, or (c) it's an API/endpoint route and shouldn't be there. Diagnose at the source.

### Counting URLs (the gotcha)

Astro emits **single-line minified XML**. `grep -c '<url>' dist/sitemap-0.xml` returns `1` because it counts *lines*, not occurrences. Use:

```bash
grep -o '<url>' dist/sitemap-0.xml | wc -l
```

This catches everyone the first time. Add it to whatever verification recipe lives near the splash.

### Verification

```bash
# 1. Sitemap exists and is non-empty
ls -lh dist/sitemap-*.xml

# 2. URL count matches expectations (one per HTML page, minus filtered routes)
grep -o '<url>' dist/sitemap-0.xml | wc -l

# 3. Filtered routes are absent
grep -E 'llms\.txt|llms-full\.txt|/404/' dist/sitemap-0.xml
# (corpus content with "llms" or "404" in slugs is fine — the filter operates on
# the deployed page URL, not on slug substrings within other URLs)

# 4. robots.txt has the absolute Sitemap: line
cat dist/robots.txt

# 5. Head tag is present
grep 'rel="sitemap"' dist/index.html
```

### Reference implementations

All five Lossless splashes ship this pattern as of 2026-05-09:

| Splash | URLs | Base |
|---|---|---|
| `ai-labs/context-vigilance-kit/splash` | 463 | `/context-vigilance-kit/` |
| `astro-knots/splash` | 162 | `/astro-knots/` |
| `content-farm/splash` | 95 | `/content-farm/` |
| `ai-labs/memopop-ai/apps/memopop-site` | 128 | `/memopop-ai/` |
| `lfm/splash` | 17 | `/lossless-flavored-markdown-package/` |

For the full porting recipe with copy-paste-ready config, robots.txt, and head tags, see [references/sitemap-implementation.md](references/sitemap-implementation.md).

## llms.txt — give the model the corpus directly

The [llms.txt standard](https://llmstxt.org/) is the GEO concentric ring beyond meta tags and JSON-LD: a small markdown file at the host root that lists (or contains) the machine-readable corpus of a site, ready for LLM ingest in one fetch. Where OpenGraph optimizes for the social unfurler, llms.txt optimizes for the model.

### When to ship it

- Any site with a substantive content collection — corpus, changelog, docs, blog — that you'd want models to cite or learn from
- Splash pages that aggregate child-repo content (memopop, content-farm, lfm, context-vigilance-kit)
- Documentation sites
- Marketing splashes with substantial long-form content (case studies, blog posts)

Skip it for pure UI-shell sites with no content (a single landing page), one-shot fundraise decks, and slide-only sites.

### Two files (the second is optional but encouraged)

1. **`/llms.txt`** — markdown link index. Sections per content collection, each entry as `- [Title](url): description`. Small (10s–100s of KB).
2. **`/llms-full.txt`** — concatenated raw markdown bodies of every entry, with metadata headers (title, source, canonical URL, last-modified). The preferred ingest target — avoids per-page HTTP overhead and HTML noise. Large (multi-MB on content-heavy sites).

### Hard rules (Why + How to apply)

#### Rule LLM-1: Source of truth for prose lives in markdown, not TypeScript

**Why:** Voice and framing are human-edited, not dev-edited. Putting "Treat context with the same vigilance as code…" inside a `.ts` template literal forces a developer-flavored review process for what should be a copy edit. Splash maintainers will avoid the file. The text rots.

**How to apply:** Create `src/llms/llms.md` (and `src/llms/llms-full.md` if shipping the optional companion). Each is a complete markdown document with `{{TOKEN}}` placeholders for dynamic values. The endpoint imports the markdown via Vite's `?raw` query, substitutes tokens, and emits. See [references/llms-txt-implementation.md](references/llms-txt-implementation.md) for the canonical template.

#### Rule LLM-2: The endpoint is a dumb assembler, not a writer

**Why:** Keeping all prose in markdown means the `.ts` file changes only when you add new dynamic capabilities. No drift between voice and code. Devs and writers stop stepping on each other.

**How to apply:**
```ts
import template from '../llms/llms.md?raw';
// ... build tokens map ...
const body = template.replace(/\{\{(\w+)\}\}/g, (m, n) =>
  Object.prototype.hasOwnProperty.call(tokens, n) ? tokens[n] : m,
);
```
Missing tokens pass through unchanged so typos in the markdown surface in the output instead of silently disappearing.

#### Rule LLM-3: Use absolute URLs in the file, computed at build time

**Why:** The spec assumes a crawler reads `/llms.txt` as a single document and follows the links. Relative URLs require the crawler to remember the base — many won't, and you cannot test which ones will.

**How to apply:** Read `import.meta.env.SITE` and `import.meta.env.BASE_URL`, compute `root = new URL(base, site).toString().replace(/\/$/, '')`, and build all links as `${root}/path/`. When the site moves to a custom domain, all the URLs update automatically — no endpoint change needed.

#### Rule LLM-4: Apply the same publish/private gate the rendered HTML uses

**Why:** Anything not in the rendered HTML shouldn't be in the LLM-facing files either. Otherwise drafts marked `publish: false` leak via `/llms-full.txt` to a model that then quotes them publicly.

**How to apply:** Filter the content collection with the same predicate the page templates use. For Lossless splashes that's typically `data.publish !== false && data.private !== true`. The endpoint must use *exactly* the same filter as `[...slug].astro` for the corresponding collection — copy-paste the predicate so they cannot drift.

#### Rule LLM-5: Build statically, never at request time

**Why:** Generating `/llms-full.txt` over a 500-doc corpus on every request would blow up render budgets. Build-time static generation amortizes the cost across deploys.

**How to apply:** Use Astro static endpoints (the default `output: 'static'` mode), not SSR/server endpoints. The endpoint files are TypeScript that emits a `Response` once at build, written to `dist/llms.txt` and `dist/llms-full.txt`. Confirm in build output that both filenames appear in the rendered list.

### Conformance gap on GitHub Pages splashes

The spec assumes the file lives at the host root: `https://host/llms.txt`. Splashes deployed under a path on `lossless-group.github.io` (e.g., `/context-vigilance-kit/`) place the file at the path, not the host root. **Convention-based discovery (a crawler that just GETs `/llms.txt` from the host) won't catch them until DNS for the custom domain lands.**

Tools pointed explicitly at the path-based URL still work today. The endpoint code doesn't need to change when the domain flips — `import.meta.env.SITE` and `BASE_URL` are read at build time and emit absolute URLs, so when `astro.config.mjs` flips `base` to `'/'` and `site` to the custom domain, conformance kicks in automatically.

For path-deployed sites in the meantime, add a discoverability link to `<head>`:

```html
<link rel="alternate" type="text/markdown" href="/llms.txt" title="llms.txt for this site" />
```

Optional per spec, but cheap insurance.

### Token vocabulary (canonical Lossless implementation)

| Token | Replaced with |
|---|---|
| `{{SITE_NAME}}` | Static site name from your SEO registry (`STATIC_SEO.siteName`) |
| `{{ENTRY_COUNT}}` | Number of published entries in the primary collection |
| `{{REPO_COUNT}}` | Number of distinct source repos (for rolled-up splashes) |
| `{{SEARCH_URL}}` | Absolute URL to the site's search page |
| `{{LLMS_FULL_URL}}` | Absolute URL to `/llms-full.txt` |
| `{{LLMS_INDEX_URL}}` | Absolute URL to `/llms.txt` |
| `{{CORPUS_INDEX}}` | Generated link list grouped by source — used in `llms.md` |
| `{{CORPUS_BODIES}}` | Generated concatenation of raw markdown bodies — used in `llms-full.md` |

Add tokens as the site needs them. Document each one in the site's `src/llms/README.md` so future editors can see the vocabulary.

### Verification

```bash
# 1. The file deploys at the expected path
curl -sI "<host>/llms.txt" | grep -iE "content-type|content-length"
# Expected: content-type: text/markdown; charset=utf-8

# 2. Tokens substituted correctly (no leftover {{TOKEN}} in output)
curl -s "<host>/llms.txt" | grep -oE '\{\{[A-Z_]+\}\}'
# Expected: empty

# 3. Spot-check a few corpus links resolve
curl -s "<host>/llms.txt" \
  | grep -oE 'https?://[^)]+' | head -5 \
  | xargs -I {} curl -s -o /dev/null -w "%{http_code} {}\n" {}
# Expected: all 200s

# 4. Full content file is non-trivial size
curl -s "<host>/llms-full.txt" | wc -c
# Expected: hundreds of KB to multiple MB on content-heavy sites
```

### Reference implementation

`ai-labs/context-vigilance-kit/splash/` — full pattern: `src/llms/{llms.md, llms-full.md, README.md}` plus `src/pages/{llms.txt.ts, llms-full.txt.ts}`. The kit's splash renders 460 corpus entries from 27 source repos as a 132 KB index plus a 5.7 MB full-content companion. Built in ~30ms total at deploy time.

For the full porting recipe, code template, and walkthrough of adapting the pattern to a new splash or content-heavy site, see [references/llms-txt-implementation.md](references/llms-txt-implementation.md).

## Verification recipe

Before merging changes that touch OG metadata:

```bash
# 1. Confirm the bytes the unfurler will receive
curl -sI "<og-image-url>" | grep -iE "content-type|content-length|vary"

# 2. Confirm the meta tags actually render
curl -s "<page-url>" | grep -iE 'og:|twitter:'

# 3. Manual unfurl test — the only ground truth
#    Send the URL to yourself in iMessage and WhatsApp.
#    Both must show: image, title, description.
```

For Facebook/LinkedIn/X debuggers and per-client quirks (TTLs, fallbacks, what each one ignores), see [references/unfurler-matrix.md](references/unfurler-matrix.md).

## Common failure modes (and the fix)

| Symptom                                         | Likely cause                              | Fix                                                        |
| ----------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| iMessage shows title only, no image             | Image is WebP or hosted on slow origin    | Switch to JPEG on a CDN. Re-share with `?v=2`.             |
| WhatsApp shows old image after update           | Per-URL cache                             | Append `?v=N` query string                                 |
| Slack unfurls, others don't                     | `og:image:type` mismatch with actual bytes | `curl -sI` the image, fix the meta tag                     |
| LinkedIn unfurl is stale                        | LinkedIn caches for ~7 days               | LinkedIn Post Inspector → "Inspect" forces re-fetch        |
| Facebook shows wrong image                      | Old scrape cached                          | Facebook Sharing Debugger → "Scrape Again"                 |
| Image renders zoomed / cropped weirdly          | Wrong width/height declared OR not 1200×630 | Re-export at 1200×630, fix meta tag                        |
| Local dev unfurl test fails                     | Page is not publicly reachable            | Deploy to a preview URL — unfurlers cannot reach localhost |

## See also

- [references/unfurler-matrix.md](references/unfurler-matrix.md) — per-client TTLs, debuggers, image format support, and known bugs.
- [references/seo-best-practices.md](references/seo-best-practices.md) — titles, headings, URL structure, schema beyond Article, sitemaps, Core Web Vitals, image SEO, anti-patterns, pre-launch audit checklist.
- [references/user-tools-for-image-generation.md](references/user-tools-for-image-generation.md) — which image-generation tool the user prefers (currently Ideogram), with a swap-out config block agents read to decide how to call it.
- [references/llms-txt-implementation.md](references/llms-txt-implementation.md) — full template for `/llms.txt` and `/llms-full.txt` endpoints, the markdown source-of-truth pattern, porting walkthrough.
- [references/sitemap-implementation.md](references/sitemap-implementation.md) — `@astrojs/sitemap` integration, robots.txt template, head link tag, the URL-counting gotcha, porting walkthrough.

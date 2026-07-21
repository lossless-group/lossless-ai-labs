---
from: "dididecks-ai"
from_path: "context-v/agent-skills/open-graph-share-seo-geo/references/seo-best-practices.md"
---

# SEO Best Practices

On-demand reference for traditional SEO concerns the main `SKILL.md` doesn't already cover. The OG / share-preview rules in `SKILL.md` handle the social and GEO-adjacent layer; this file covers crawlability, structured content, and technical SEO.

> **Lossless Group posture:** SEO is a side-effect of writing well-structured, fast, semantically honest pages — not a checklist to bolt on. Most of these rules are "do the obvious thing"; the value is in *not skipping* the obvious thing.

## When to use this file

- Auditing an Astro Knots site before launch
- "We're not ranking for X" debugging
- Adding structured data (JSON-LD) beyond `Article`
- Setting up `sitemap.xml` / `robots.txt` for a new site
- Reviewing page speed / Core Web Vitals failures
- Writing the title and meta description for a new page

## Title tags

**The single most consequential ranking signal you control.** Search engines treat the `<title>` as the primary topical claim of the page.

- **Pattern:** `Specific Topic — Site Name` (em-dash separator). Reserve the suffix for site-wide consistency.
- **Length:** ≤60 characters including the suffix. Google truncates around 580 px, which averages ~60 chars but varies by character width.
- **Front-load the keyword.** "OpenGraph debugging guide — content-farm" beats "content-farm: a guide to debugging OpenGraph".
- **Unique per page.** Two pages with the same `<title>` is a duplicate-content signal. The Astro Knots `MetaTags` component takes a bare title and appends the suffix — that pattern enforces uniqueness as long as the bare title varies.
- **Match `<h1>` semantically, not literally.** They should describe the same thing; they don't have to be the same string. A page about "Debugging OpenGraph in iMessage" can have `<title>OpenGraph debugging guide — content-farm</title>` and `<h1>Debugging OpenGraph share previews in iMessage</h1>`.

## Meta description

Already covered in `SKILL.md` (155-char limit, same string used for `og:description` and `twitter:description`). Additional notes:

- **Not a ranking factor**, but it controls the SERP snippet — write for click-through, not for keywords.
- **Lead with the value proposition,** not the topic. "Make share previews unfurl in iMessage and WhatsApp — the JPEG/WebP rule, the cache-bust trick, the `curl -sI` recipe" beats "This page covers OpenGraph metadata for social sharing."
- **No site-name suffix** in the description. That's `<title>`'s job.
- **No truncation ellipsis at the source** — let the SERP truncate. Truncating at the source means *every* surface (SERP, OG, Twitter card) gets the same artificial cut-off.

## Heading hierarchy

- **Exactly one `<h1>` per page.** This is the page's primary heading. In Astro, the page template sets it; do not let layout components emit one.
- **Headings are a tree, not a font-size selector.** `<h2>` for top-level sections, `<h3>` for sub-sections, `<h4>` rarely. If you need `<h5>` or `<h6>`, the page is probably better split.
- **Skip-level jumps are a smell.** `<h2>` → `<h4>` (skipping `<h3>`) breaks accessibility and signals confused information architecture to crawlers.
- **Headings describe the section that follows them.** Do not use a heading as decoration or a callout.

## URL structure

- **Lowercase, hyphenated, no underscores.** `/blog/og-debugging` not `/blog/OG_Debugging` or `/blog/ogDebugging`.
- **Short and meaningful.** `/blog/og-debugging` beats `/blog/2026/05/05/how-to-debug-opengraph-share-previews-in-imessage-and-whatsapp`.
- **No trailing slashes** *or* always trailing slashes — pick one and `301` the other to it. Inconsistency creates duplicate URLs.
- **No file extensions** in canonical URLs (`.html`, `.php`). Astro outputs clean URLs by default.
- **No query parameters in canonical content URLs.** Reserve `?v=N` for cache-busting only; never let it be the canonical version.
- **Stable forever.** If a URL ships, it stays. Renames require a `301` redirect from the old URL to the new one — set it up before you delete the old route.

## Canonical URLs

- **Every page declares `<link rel="canonical" href="https://example.com/page" />`** — even if it's its own canonical. Removes ambiguity for crawlers.
- **Absolute URL only** (same rule as OG; see `SKILL.md` rule 4).
- **Match the URL structure** decision above — if you trail-slash, the canonical trail-slashes.
- **Pages that *are* duplicates** (printable view, query-string variants, AMP) point their canonical at the primary URL.

## Schema.org / JSON-LD

The `Article` schema is in `SKILL.md`'s GEO section. Other types worth knowing:

### `BreadcrumbList` — for any page below the root

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://example.com/blog" },
    { "@type": "ListItem", "position": 3, "name": "Post Title" }
  ]
}
```

Google renders breadcrumbs in the SERP for any page that ships this. Cheap win.

### `Organization` — site-wide, in the layout

One per site, in the root layout. Include `name`, `url`, `logo`, `sameAs` (array of social URLs).

### `WebSite` with `SearchAction` — if the site has search

Enables the in-SERP search box. Only ship this if the search URL pattern actually works.

### `FAQPage`, `HowTo`, `Product`, `Recipe`

Use when the page genuinely is one of these. Google penalizes "schema spam" — declaring `FAQPage` on a page that isn't a FAQ can demote the whole site.

### Validation

- [Schema.org validator](https://validator.schema.org) — strict, catches everything.
- [Google Rich Results Test](https://search.google.com/test/rich-results) — Google's view, including which rich-result eligibilities are unlocked.

## `sitemap.xml`

- **One per site.** At `/sitemap.xml`. Listed in `robots.txt` as `Sitemap: https://example.com/sitemap.xml`.
- **Include only canonical URLs.** No duplicates, no redirects, no 404s, no `noindex` pages.
- **Include `lastmod`** — accurate ISO 8601 dates. Crawlers use this to prioritize re-crawls.
- **Astro:** `@astrojs/sitemap` integration generates this from your routes. Configure with the canonical site URL.
- **For sites > 50,000 URLs:** split into a sitemap index (`sitemap-index.xml`) referencing per-section sitemaps.

## `robots.txt`

- **At the root.** `/robots.txt`. Cached aggressively — changes can take 24 h to propagate.
- **Default: allow all, block specific paths.** Whitelisting is fragile.
- **Block `/api/`, `/draft/`, internal admin paths.** Never block `/_astro/` or static asset directories — that hides CSS/JS from crawlers and tanks rendering.
- **Reference the sitemap** at the bottom: `Sitemap: https://example.com/sitemap.xml`.
- **AI crawler policy:** see `SKILL.md` GEO section. The Astro Knots default is to allow `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`.

Minimum viable:
```
User-agent: *
Disallow: /api/
Disallow: /draft/

Sitemap: https://example.com/sitemap.xml
```

## Image SEO

OG image rules are in `SKILL.md`. For non-OG body images:

- **Descriptive `alt` text on every meaningful image.** Decorative images get `alt=""` (the empty attribute is intentional and correct — it tells screen readers to skip).
- **Filenames are a weak ranking signal.** `og-debugging-imessage-flowchart.jpg` beats `IMG_4392.jpg`.
- **`width` and `height` attributes** on every `<img>` to prevent layout shift (Cumulative Layout Shift / CLS). Astro's `<Image>` component handles this.
- **Lazy-load below-the-fold images:** `loading="lazy"`. Above-the-fold images: `loading="eager"` and `fetchpriority="high"` on the LCP image.
- **Responsive images** with `srcset` and `sizes` for hero / banner / large content images. Astro's `<Image>` and `<Picture>` handle this.
- **Modern formats** (AVIF first, WebP fallback, JPEG/PNG last) for body images — opposite of the OG rule, because the body audience is real browsers, not unfurlers. Astro generates these from the source.
- **Format conversion at the CLI:** the user is likely to have `ffmpeg` installed locally, so agents can convert images between formats without adding a dependency. Common one-liners:
  ```bash
  ffmpeg -i in.webp out.jpg                                  # WebP → JPEG (good for OG)
  ffmpeg -i in.png   -q:v 3 out.jpg                          # PNG → JPEG, quality ~85
  ffmpeg -i in.jpg   -c:v libaom-av1 -still-picture 1 out.avif  # JPEG → AVIF for body images
  ffmpeg -i in.png   -c:v libwebp out.webp                   # PNG → WebP
  ffmpeg -i in.jpg   -vf "scale=1200:630" out.jpg            # Resize/crop to OG banner size
  ```
  Prefer ffmpeg over installing `cwebp` / `avifenc` / `imagemagick` for one-off conversions. For batch pipelines or specialty tuning, the dedicated tools have more knobs.

## Core Web Vitals

Google's three-metric framework. Affects rankings, especially on mobile.

| Metric | What it measures                                | Target  | Common fix                                            |
| ------ | ----------------------------------------------- | ------- | ----------------------------------------------------- |
| LCP    | Largest Contentful Paint — when the hero loads  | < 2.5 s | `fetchpriority="high"` on hero image; preload fonts   |
| INP    | Interaction to Next Paint — first input lag     | < 200 ms | Drop blocking JS; defer non-critical scripts         |
| CLS    | Cumulative Layout Shift — visual stability      | < 0.1   | `width`/`height` on images; reserve space for ads/embeds |

Astro Knots sites tend to score well by default — the danger zone is when someone adds a third-party widget (chat, analytics with auto-tracking, embedded video player) without checking the impact.

**Measure with:**
- [PageSpeed Insights](https://pagespeed.web.dev) — Google's official tool, includes field data from the Chrome User Experience Report.
- Chrome DevTools → Lighthouse → "Performance" — local lab data.
- `web-vitals` npm package for production RUM if you want field data on your own.

## Mobile-first

- **Google indexes the mobile version.** Desktop-only or desktop-better is ranking suicide.
- **Viewport meta tag:** `<meta name="viewport" content="width=device-width, initial-scale=1" />`. Not optional.
- **Tap targets** ≥ 44 × 44 px. Spacing between adjacent links ≥ 8 px.
- **Test on a real phone, not just Chrome DevTools' device toolbar.** The toolbar lies about touch behavior and font rendering.

## HTTPS / security

- **HTTPS-only.** No exceptions. `HTTP/2` if your host supports it.
- **HSTS header** (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`) once you're confident the site is permanently HTTPS. Submit to the HSTS preload list for the strongest guarantee.
- **No mixed content.** A single `http://` resource on an `https://` page tanks the security indicator and can break embedded media.

## Multilingual (hreflang)

Only relevant if the site has translated versions.

- Each page declares `<link rel="alternate" hreflang="<lang>" href="<url>" />` for every translation, *including itself*.
- Plus an `x-default` for the language-selector / fallback page.
- Astro Knots default is English-only; this is a forward-looking note.

## Anti-patterns

| Don't                                                  | Why                                                              |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| Keyword stuffing                                       | Pattern-matched and demoted since ~2012                          |
| Hidden text (`color: white` on white)                  | Treated as cloaking; manual penalty risk                         |
| Doorway pages (one page per keyword variant)           | Manual penalty risk                                              |
| Auto-generated thin content                            | Helpful Content Update (2022+) demotes wholesale                 |
| Buying links / link schemes                            | Manual penalty risk                                              |
| `noindex` on pages you want indexed                    | Surprisingly common; always grep `noindex` before launch         |
| Blocking crawlers in `robots.txt` then expecting indexing | Disallow stops crawl, which means no `noindex` is ever seen — page can stay indexed forever |
| Schema spam (declaring `FAQPage` on non-FAQ pages)     | Google demotes the whole domain                                  |
| Cloaking (different content to crawlers vs users)      | Manual penalty risk; one of the few clear-cut violations         |
| Infinite scroll without paginated URLs                 | Crawlers stop at page 1; everything below is invisible           |
| Slow Time to First Byte (> 600 ms)                     | Limits crawl budget; tanks LCP                                   |

## Audit checklist (before launching a new Astro Knots site)

1. Every page has a unique `<title>` and `description`.
2. Every page has an absolute `<link rel="canonical">`.
3. Every page has the OG sextet (see `SKILL.md` rule 5).
4. `sitemap.xml` is generated and lists only canonical URLs.
5. `robots.txt` exists, references the sitemap, allows the AI crawlers we want.
6. Every meaningful image has descriptive `alt`; decorative ones have `alt=""`.
7. `<h1>` count is exactly 1 per page (use a CSS selector audit: `document.querySelectorAll('h1').length`).
8. No `noindex` on production pages.
9. PageSpeed Insights mobile score ≥ 90 on the homepage.
10. JSON-LD validates on Schema.org validator and Google Rich Results Test.
11. HTTPS works; HTTP redirects to HTTPS with `301`.
12. Manual share test in iMessage and WhatsApp (see `SKILL.md` rule 7).

## Tools cheat sheet

| Need                            | Tool                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| Crawl + audit your own site     | [Screaming Frog SEO Spider](https://www.screamingfrog.co.uk/seo-spider/) (free up to 500 URLs) |
| Validate JSON-LD                | [Schema.org validator](https://validator.schema.org)       |
| Validate rich results           | [Google Rich Results Test](https://search.google.com/test/rich-results) |
| Page speed (lab + field)        | [PageSpeed Insights](https://pagespeed.web.dev)            |
| Search Console (after launch)   | [Google Search Console](https://search.google.com/search-console) |
| Bing equivalent                 | [Bing Webmaster Tools](https://www.bing.com/webmasters)    |
| Quick SERP simulator            | Google itself — `site:example.com` to see what's indexed   |

## See also

- `../SKILL.md` — OG/share-preview rules, GEO, the seven hard rules
- `unfurler-matrix.md` — per-client share-preview behavior

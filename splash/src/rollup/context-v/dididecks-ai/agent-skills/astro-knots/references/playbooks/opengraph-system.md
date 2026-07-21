---
from: "dididecks-ai"
from_path: "context-v/agent-skills/astro-knots/references/playbooks/opengraph-system.md"
---

# Playbook: Elegant Open Graph System

How every Astro-Knots site exposes share-card metadata (OpenGraph, Twitter, canonical, robots) in a single, consistent shape.

**Source spec:** `lossless-monorepo/content/lost-in-public/blueprints/Maintain-an-Elegant-Open-Graph-System.md` (status: Implemented).

**Reference implementations** (load these when scaffolding a new site):

- `astro-knots/sites/calmstorm-decks/` — gated workspace variant (default `noindex=true`, single PNG OG image under `/public/`).
- `astro-knots/sites/reach-edu-hub/` — public variant (default `noindex=false`, ImageKit-hosted OG image, char-limit truncation, article-meta support).

> The blueprint described a `buildOgMeta()` helper returning a meta-tag array. Both shipped sites converged on a tighter pattern instead — a single Astro component that emits the `<head>` tags directly, paired with a typed registry. **Use the realized pattern, not the spec's array helper.** The spec's principles (one source of truth, layout owns rendering, absolute URLs, dev-friendly fallbacks) still apply.

## The two-file architecture

Every site implements exactly these two files. Names are not negotiable — keep them identical across sites so a contributor moving between sites finds them in the same place.

### 1. `src/lib/seo.ts` — the registry

A single typed module that holds:

- **Site-wide constants:** `SITE_NAME`, `SITE_TAGLINE`, `TITLE_SUFFIX`.
- **Default OG image:** `DEFAULT_OG_IMAGE` (path or absolute URL), plus its real `WIDTH`, `HEIGHT`, and `ALT`. Real pixel dimensions matter — strict unfurlers (LinkedIn, iMessage) reject mismatches.
- **The `SeoEntry` type:** `{ title; description; ogImage? }`. Bare title only — the suffix is appended by the helper.
- **Per-route registries:** keyed by slug or href. Common shapes:
  - `SLIDE_SEO: Record<slug, SeoEntry>` — for slide-chooser pages.
  - `SCROLL_DECK_SEO: Record<href, SeoEntry>` — for scroll decks (normalize trailing slash on lookup).
  - `STATIC_SEO: { root, changelogIndex, ... }` — for one-off pages.
- **Helpers:** `getSlideSeo(slug)`, `getScrollDeckSeo(href)`, `buildPageTitle(title)`. Optionally `truncate(s, limit)` and `CHAR_LIMITS` (see "Public sites" below).

The registry is the source of truth. Pages should look up their entry rather than inlining strings, so SEO copy can be reviewed in one place.

### 2. `src/components/basics/MetaTags.astro` — the renderer

A single Astro component that takes `{ title, description, ogImage?, ogType?, noindex?, canonical?, ... }` and emits, in order:

1. `<title>` (with suffix appended)
2. `<meta name="description">`
3. `<meta name="robots">`
4. `<link rel="canonical">`
5. **OpenGraph:** `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`, `og:image:alt`.
6. **Article-only** (when `ogType === 'article'`): `article:published_time`, `article:modified_time`, `article:author`, `article:tag` (one per tag).
7. **Twitter / X:** `twitter:card="summary_large_image"`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt`.

Rendered as the **first child of `<head>`** in every user-facing page — typically via a thin `BoilerPlateHTML.astro` wrapper that forwards props to `<MetaTags>` and adds the `<meta charset>`, viewport, favicon, and any no-flash boot script.

**Always emit absolute URLs** for `og:image` and `og:url`. Use:

```ts
const siteUrl = (Astro.site?.toString() ?? Astro.url.origin).replace(/\/$/, "");
const canonicalUrl = canonical ?? `${siteUrl}${Astro.url.pathname}`;
const absoluteOgImage = ogImage.startsWith("http")
  ? ogImage
  : `${siteUrl}${ogImage.startsWith("/") ? ogImage : `/${ogImage}`}`;
```

This requires `site` to be set in `astro.config.mjs`. If it isn't, fix that first — relative OG URLs silently break unfurls on every platform.

## Two policy axes

Sites differ on two axes. Decide both before the first PR.

### Axis 1: gated vs public

| | Gated (e.g. calmstorm-decks) | Public (e.g. reach-edu-hub) |
|---|---|---|
| `MetaTags` default `noindex` | `true` | `false` |
| `<meta name="robots">` default | `noindex, nofollow, noarchive, nosnippet` | `index, follow` |
| Posture | Opt **out** of indexing per page | Opt **in** to noindex per page |

Gated sites are deck workspaces, internal hubs, fundraise materials. Public sites are anything you want LinkedIn / Google to surface.

### Axis 2: where the OG image lives

| | Local (`/public/`) | Image CDN (ImageKit) |
|---|---|---|
| When | Single canonical share image, rarely changes | Site goes through deploy churn (Vercel previews, domain changes, LFS) |
| URL shape | Site-relative path resolved to absolute at render time | Absolute `https://ik.imagekit.io/...` URL hard-coded as default |
| Fallback | None needed | Keep a copy at `/public/` as a last resort |

The reach-edu-hub `seo.ts` documents *why* it chose ImageKit (stability across Vercel deploys, permissive CORS, no Git LFS pointer regressions). Apply that reasoning: if a site has had unfurl breakage from infra moves, the CDN-hosted default earns its keep. Otherwise `/public/` is simpler.

## Public-site additions

Public sites ship two extras that gated sites can skip:

- **Char limits + truncate:** `CHAR_LIMITS = { title: 60, description: 155, siteName: 30 }` plus a `truncate(s, limit)` helper. Apply at render time so authors write naturally and the meta still survives unfurler clipping.
- **Article meta:** `publishedTime`, `modifiedTime`, `author`, `tags?[]` props on `<MetaTags>`, emitted only when `ogType === 'article'`. Required for any blog/changelog/post page that should unfurl as an article.

## Checklist for a new site

1. Set `site: 'https://...'` in `astro.config.mjs`. **First.**
2. Decide gated vs public → drives `noindex` default.
3. Decide OG image hosting (local vs CDN) → drives `DEFAULT_OG_IMAGE`.
4. Drop a default OG image at the chosen location. Real dimensions, ideally 1200×630 (or whatever the design demands — record real width/height).
5. Create `src/lib/seo.ts` with the constants, `SeoEntry` type, registries, and helpers. Copy from a reference site and retokenize.
6. Create `src/components/basics/MetaTags.astro`. Copy from the closer reference (gated → calmstorm-decks; public → reach-edu-hub) and retokenize.
7. Wire `<MetaTags>` into the boilerplate HTML wrapper (`BoilerPlateHTML.astro` or equivalent) as the first child of `<head>`.
8. Pages call `<MetaTags title={...} description={...} />` directly, OR look themselves up via `getSlideSeo(slug)` / `getScrollDeckSeo(href)` / `STATIC_SEO.x` from `seo.ts`.
9. QA: open the site in production, paste URLs into LinkedIn Post Inspector, Twitter/X card validator, and Facebook Sharing Debugger. Real fetch — not a screenshot.

## Anti-patterns

- ❌ Inlining `<meta property="og:...">` tags in individual page heads. Always go through `<MetaTags>`.
- ❌ Relative `og:image` URLs. Always resolve to absolute.
- ❌ Multiple `<title>` or `<meta name="description">` tags from layouts stacking up — `<MetaTags>` owns these, no other layout should emit them.
- ❌ Inventing per-site prop names. Keep `<MetaTags>` props identical across sites; future-you moves between sites cleanly.
- ❌ Placing the OG image registry in a component file rather than `src/lib/seo.ts`. The registry is data, not a component.
- ❌ Skipping `og:image:width`/`og:image:height`/`og:image:type`. Strict unfurlers (LinkedIn especially) reject images without them.

## Cross-references

- Source blueprint: `lossless-monorepo/content/lost-in-public/blueprints/Maintain-an-Elegant-Open-Graph-System.md`
- Related blueprint: `lossless-monorepo/content/lost-in-public/issue-resolution/Optimizing-Share-Functionality-Across-Content.md`
- Files to copy from on a new site:
  - Gated reference: `astro-knots/sites/calmstorm-decks/src/lib/seo.ts` + `src/components/basics/MetaTags.astro`
  - Public reference: `astro-knots/sites/reach-edu-hub/src/lib/seo.ts` + `src/components/basics/MetaTags.astro` + `src/layouts/BoilerPlateHTML.astro`

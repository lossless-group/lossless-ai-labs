---
from: "dididecks-ai"
from_path: "context-v/agent-skills/lossless-flavored-markdown/references/frontmatter-schema.md"
---

# LFM Frontmatter Schema

The recommended frontmatter fields for LFM content, the Zod schema patterns sites use to validate them, and the conventions that overlap with `context-vigilance` and `changelog-conventions`.

## Field categories

### Identity (required)

```yaml
title: "Some Article"
slug: some-article            # auto-derived from filename if omitted
lede: |                       # 1-3 sentence summary used in popovers, OG, and indexes
  Why this matters and what the reader gets.
```

### Dates (ISO 8601, always)

```yaml
date_authored_initial_draft: 2026-04-01
date_authored_current_draft: 2026-05-05
date_published: 2026-05-05
date_modified: 2026-05-12
```

ISO 8601 = `YYYY-MM-DD` for date-only, `YYYY-MM-DDTHH:MM:SSZ` for datetime. **Never** use locale-formatted dates in frontmatter — they lose meaning when the file moves between systems.

### Classification

```yaml
tags:
  - astro
  - markdown
  - tooling
category: engineering         # one-of from a per-site enum
status: Published             # Draft | Review | Published | Archived
```

The `status` workflow:

- **Draft** — author working; do not surface in indexes or sitemaps.
- **Review** — content complete; awaiting review. May surface to internal previews only.
- **Published** — public. Surface everywhere.
- **Archived** — was public, intentionally retired. Keep URL alive (301 to successor or leave with banner) but exclude from indexes.

Sites filter content collections on `status === 'Published'` for production builds.

### Versioning

```yaml
at_semantic_version: 0.0.1.1       # epoch.major.minor.patch
```

The four-part scheme is the [`context-vigilance`](../../context-vigilance/) convention — read that skill for the decision rules. For LFM content the most common pattern:

- **epoch** — bumped only when the document's premise changes (rare).
- **major** — bumped when the structure or main argument changes substantially.
- **minor** — bumped when sections are added/removed.
- **patch** — bumped for typo fixes, citation additions, polish.

### Display hints

```yaml
image: /og/some-article.jpg        # OG image (absolute URL preferred)
image_prompt: |                    # for Image-Gin / Ideogram regeneration
  Editorial illustration of [subject], muted palette, banner aspect 1200x630.
toc: true                          # auto-generate table of contents
layout: article                    # which Astro layout to use
```

The `image_prompt` field is the source-of-truth for regenerating the OG image. When the article is updated and the banner needs a refresh, this is what gets fed to the image-gen tool. See the [open-graph-share-seo-geo skill](../../open-graph-share-seo-geo/SKILL.md) for the OG image rules and [user-tools-for-image-generation.md](../../open-graph-share-seo-geo/references/user-tools-for-image-generation.md) for the current preferred tool (Ideogram).

### AI co-authorship

```yaml
augmented_with:
  - "claude-opus-4.7"
  - "claude-sonnet-4.6"
authors:
  - Michael Staton
```

`augmented_with` is the Lossless Group's transparency convention — list any AI tool that materially contributed to the content. Distinct from `authors`, which lists the humans accountable for it.

### Provenance

```yaml
source_repo: lossless-monorepo/astro-knots
source_path: src/content/posts/some-article.md
canonical_url: https://example.com/posts/some-article
```

`canonical_url` matters when content is mirrored across multiple sites — only one is canonical.

## Full Zod schema (recommended baseline)

Drop into `src/content/config.ts` for any Astro Knots site:

```ts
import { defineCollection, z } from 'astro:content';

const lfmContent = defineCollection({
  type: 'content',
  schema: z.object({
    // Identity
    title: z.string().min(1).max(100),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    lede: z.string().min(1).max(500),

    // Dates
    date_authored_initial_draft: z.coerce.date().optional(),
    date_authored_current_draft: z.coerce.date().optional(),
    date_published: z.coerce.date().optional(),
    date_modified: z.coerce.date().optional(),

    // Classification
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    status: z.enum(['Draft', 'Review', 'Published', 'Archived']).default('Draft'),

    // Versioning
    at_semantic_version: z.string().regex(/^\d+\.\d+\.\d+\.\d+$/).optional(),

    // Display
    image: z.string().url().or(z.string().startsWith('/')).optional(),
    image_prompt: z.string().optional(),
    toc: z.boolean().default(true),
    layout: z.string().default('article'),

    // AI co-authorship
    augmented_with: z.array(z.string()).default([]),
    authors: z.array(z.string()).default([]),

    // Provenance
    source_repo: z.string().optional(),
    source_path: z.string().optional(),
    canonical_url: z.string().url().optional(),
  }),
});

export const collections = {
  posts: lfmContent,
  // … other collections
};
```

Sites extend the baseline with collection-specific fields (e.g., a `decks` collection adds `slide_count`, a `changelog` collection adds `version`).

## Cross-skill conventions

### `context-vigilance`
- `at_semantic_version` — same scheme as `context-v/` files.
- `status` — same workflow (Draft → Review → Published → Archived).
- `lede` — used in `context-v/` for one-line search hits; same role in popovers.

### `changelog-conventions`
- Changelog entries use `publish: true | false` instead of `status` (legacy reasons; aligned in spirit).
- `date_published` and `date_modified` are universal across content types.
- `lede` is required on changelog entries.

### `open-graph-share-seo-geo`
- `image` (absolute URL) → `og:image` and `twitter:image`.
- `lede` (or first 155 chars of body) → `description` / `og:description`.
- `title` → `<title>` (with site-name suffix appended at render).
- `image_prompt` is *not* surfaced publicly; it's a regeneration aid.

## What NOT to put in frontmatter

- **HTML or markdown formatting in `lede`.** It gets rendered raw in popovers and OG descriptions. Plain text only.
- **Long body content.** If the value spans more than ~3 lines of YAML, it belongs in the body, not frontmatter.
- **Computed values.** If something can be derived from the body or another field, derive it. Don't store it.
- **Secrets.** Frontmatter ships to the client.

# Source of truth: human-editable prose for the llms.txt endpoints

These markdown files are read at build time by the endpoints in
`src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts`. The endpoints are
deliberately dumb — they do token substitution and append the dynamic
content rolled up from the `changelog` and `context-v` content collections.
**All voice, framing, and structural prose lives here, not in TypeScript.**

If you want to tweak the wording on `/llms.txt` or `/llms-full.txt`, edit
the corresponding `.md` file in this directory and rebuild. No code changes.

## Files

- `llms.md` — template for `/llms.txt` (the link index).
- `llms-full.md` — template for `/llms-full.txt` (the concatenated full content).

## Tokens (substituted at build time)

| Token | Replaced with |
|---|---|
| `{{SITE_NAME}}` | `SITE_NAME` from `src/lib/seo.ts` (`Lossless AI-Labs`) |
| `{{CHANGELOG_COUNT}}` | Number of entries in the `changelog` collection |
| `{{CONTEXTV_COUNT}}` | Number of entries in the `context-v` collection |
| `{{REPO_COUNT}}` | Number of distinct `from` (source peer) values across both collections |
| `{{SEARCH_URL}}` | Absolute URL to `/search/` on the deployed site |
| `{{LLMS_FULL_URL}}` | Absolute URL to `/llms-full.txt` |
| `{{LLMS_INDEX_URL}}` | Absolute URL to `/llms.txt` |
| `{{CHANGELOG_INDEX}}` | Generated changelog link list, grouped by `from`, sorted by date desc within each group (used in `llms.md`) |
| `{{CONTEXTV_INDEX}}` | Generated context-v link list, grouped by `from`, sorted alphabetically by title within each group (used in `llms.md`) |
| `{{CORPUS_BODIES}}` | Concatenation of raw bodies from both collections, each entry preceded by a metadata header (used in `llms-full.md`) |

Tokens are simple `{{NAME}}` placeholders — no Mustache, no Handlebars, no
templating engine. If a token is missing in the markdown, the endpoint emits
the file without it. If you add a new dynamic value, register it in the
endpoint's substitution map and document it here.

## Per-splash adaptations vs. the reference impls

The llms.txt endpoints were ported from `ai-labs/memopop-ai/apps/memopop-site/`
(which itself was a port from `context-vigilance-kit/splash/`). The ai-labs
shape differs from each in small ways:

1. **Two collections, like memopop.** `changelog` and `'context-v'` are
   separate Astro content collections (see `src/content.config.ts`). The
   endpoints read both and produce two top-level sections in `/llms.txt`
   (`## Changelog` and `## Context-V`). `/llms-full.txt` concatenates from
   both, with a `Kind:` field in each entry's metadata header to disambiguate.
2. **URL shape uses `entry.id` directly.** Detail pages route at
   `${base}changelog/${entry.id}/` and `${base}context-v/${entry.id}/`.
   `entry.id` already includes the `<peer>/` prefix for rolled-up entries
   (e.g. `memopop-ai/2026-05-01_01`) and is bare for parent-authored entries
   (e.g. `2026-05-11_01`). The endpoints emit the same URLs the rendered
   HTML uses — no synthesis from `from + slug` like memopop did, because
   that would prepend `ai-labs/` to parent-authored URLs that don't have it.
3. **Provenance via `from`.** Every rolled-up entry carries `from`,
   `from_kind`, and `from_path` stamped by `scripts/rollup-sync.ts`.
   Parent-authored entries default `from` to `ai-labs` via the
   `readProvenance` fallback. Grouping in `/llms.txt` happens by `from`.
4. **No publish/private gate.** The `[...slug].astro` detail pages render
   every entry without filtering on `data.publish` or `data.private`. The
   endpoints match that behavior. If a gate is later added to the page
   templates, re-derive the predicate here too.

## Why a separate directory and not `src/lib/` or `src/content/`?

`src/lib/` is for code (TypeScript). `src/content/` is for Astro content
collections, which expect specific schemas and Astro-managed loaders. These
files are neither — they're prose templates that the build step reads as raw
strings via Vite's `?raw` import. Giving them their own directory keeps the
purpose obvious and makes the source-of-truth boundary easy to find.

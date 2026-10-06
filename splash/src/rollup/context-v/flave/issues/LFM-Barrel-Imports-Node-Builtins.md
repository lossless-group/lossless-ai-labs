---
title: "The lfm barrel imports node builtins, so it cannot be bundled for a browser"
lede: "A consumer that only wants `parseMarkdown` still drags `node:crypto`, `node:fs` and `node:path` into the bundle, because the main entry re-exports OGCache. Same class of defect lfm already documented for plantuml — but in the front door."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Open
tags:
  - Issue
  - Lossless-Flavored-Markdown
  - Packaging
  - Browser-Build
  - Upstream
publish: true
site_uuid: e8746326-f97c-4991-be23-9744503c0312
hex_code: 5qsauj
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
from: "flave"
from_path: "context-v/issues/LFM-Barrel-Imports-Node-Builtins.md"
---
# The lfm barrel imports node builtins

## Symptom

Building `@flave/editor` (Vite 7, browser target) against `@lossless-group/lfm@0.5.1` fails:

```text
"createHash" is not exported by "__vite-browser-external", imported by
  .../@lossless-group/lfm/dist/index.js
```

The editor imports exactly one thing from lfm — `parseMarkdown`.

## Cause

`src/index.ts:120` re-exports the OG cache from the package's main entry:

```ts
export { OGCache, loadOGCache, hashUrl } from './utils/og-cache.js';
```

and `src/utils/og-cache.ts:16-18` imports three node builtins at module scope:

```ts
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
```

Because the imports are at module scope rather than behind a lazy call, any
bundler resolving the barrel must resolve them — whether or not the consumer
ever constructs an `OGCache`.

## Why this is already a known shape

lfm's own [[JSR-Export-Map-Omits-the-Formats-Subpaths]] records the exact
reasoning for a sibling module:

> `plantuml` is not re-exported here, because importing a node builtin into
> this barrel would make it unusable in a browser context. Import it by
> subpath: `@lossless-group/lfm/formats/plantuml`.

That discipline was applied to `formats/plantuml` and not to
`utils/og-cache`. The rule is right; its application is incomplete.

## Blast radius

Every browser consumer of the barrel. Today that is flave's editor. It would
equally hit any Astro island or client-side component importing `parseMarkdown`
directly — the astro-knots sites do their parsing at build time, in node, which
is why nobody has hit it yet. Same "why nobody has hit it" shape the sibling
issue documents.

## Workaround in place (flave-side, temporary)

`apps/editor/vite.config.ts` aliases the three builtins to
`src/node-builtin-stub.ts`, whose exports throw with a named error if anything
ever actually calls them. The OG cache is only constructed when `ogFetch` is
enabled, which the editor never does — so the stubs are unreachable, and loud
rather than silent if that changes.

This is a consumer-side patch for a package-side problem. It should be deleted,
not maintained.

## Fix (upstream, lfm)

Move `og-cache` behind a subpath export, exactly as `formats/plantuml` was:

- drop the re-export from `src/index.ts`
- add `"./utils/og-cache"` to `exports` in both `package.json` and `deno.json`
- note it in the README beside the existing plantuml caveat

Worth checking `lfm-og-fetcher` in the same pass — anything reaching the
network or the filesystem probably belongs on the same side of that line.

## See also

- [[Phase-0-The-Live-Render-Loop]] — the phase that surfaced this
- `lfm/context-v/issues/JSR-Export-Map-Omits-the-Formats-Subpaths.md` — the
  sibling issue whose reasoning this extends

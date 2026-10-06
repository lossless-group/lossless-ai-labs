---
title: "splash and site have no agreed division of labor"
lede: "Two Astro surfaces on two hosts, sharing one design system by file copy and one duplicated landing page. Neither the boundary nor the interlinking was ever decided; the changelog lives on only one of them."
date_created: 2026-08-21
date_modified: 2026-08-21
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
semantic_version: 0.0.0.1
status: Open
tags:
  - Issue-Resolution
  - Splash
  - Site
  - SEO
  - Deploys
  - Id-Didi-Sh
site_uuid: c5838369-05f4-4bdd-b1cb-ceaae661fa7b
hex_code: e8z7vs
date_authored_initial_draft: 2026-08-21
date_authored_current_draft: 2026-08-21
publish: false
from: "id-didi-sh"
from_path: "context-v/issues/Splash-And-Site-Have-No-Agreed-Division-Of-Labor.md"
---
# splash and site have no agreed division of labor

## What

The repo ships two Astro projects to two different hosts:

| | `site/` | `splash/` |
|---|---|---|
| Address | **didi.sh** (+ `www`) | **lossless-group.github.io/id-didi-sh/** |
| Host | Vercel, scope `colearn-labs`, Root Directory `site` | GitHub Pages, `.github/workflows/pages.yml`, on push to `main` |
| `base` | `/` | `/id-didi-sh/` |
| Pages | one: `index.astro` | index, `/changelog`, `/context-v`, `/search` |
| Search | none | Pagefind |

The split is real and intentional — `site/astro.config.mjs` carries the comment
*"the dev surfaces live on the splash."* What was never decided is **where the
boundary actually falls**, and the drift shows in four places:

1. **The changelog exists on exactly one surface.** didi.sh has no `/changelog`
   route at all. The build log — the thing that demonstrates momentum to anyone
   evaluating this — lives only on a `github.io` path.
2. **The landing page is duplicated.** `splash/src/pages/index.astro` reproduces
   the marketing pitch already on didi.sh: the same `#services` and `#credential`
   sections, the same three service cards. Two canonical-looking copies of one
   page, on two domains.
3. **The design system is shared by file copy, not import.**
   `site/src/styles/theme.css` and `splash/src/styles/theme.css` are
   byte-identical, and `site/`'s copy still opens with a header reading
   `theme.css — id-didi-sh/splash`. Both `DESIGN.md` files were, until
   2026-08-21, verbatim copies of augment-it's contract.
4. **Interlinking was one-directional until today.** didi.sh linked out to the
   splash in three places; the splash linked back in zero. Fixed in `204b38a`
   (brand logo plus a footer entry), but the fix was reactive — nobody had
   decided what the link graph between the two surfaces should be.

## Why it matters

**SEO is the argument for keeping both, and the current shape actively wastes
it.** Two indexed surfaces that link to each other are worth more than one, and
the splash is a legitimate second property pointing authority at the apex
domain. But that only works if the two surfaces are *different*. Right now the
splash's index duplicates didi.sh's landing page, which means the strongest page
on the secondary property is a near-copy of the primary one — the classic way to
split ranking signal instead of concentrating it. Meanwhile the genuinely unique,
regularly-updated, keyword-rich content — the changelog — sits on the
`github.io` subpath where it accrues nothing to didi.sh.

**The changelog is the wrong thing to keep off the money domain.** It is the only
part of this project that updates weekly, reads as substance to a stranger, and
carries the vocabulary somebody would actually search. On didi.sh it would give
the domain a growing corpus and a reason for repeat visits. On the splash it is
effectively a private build log with a public URL.

**The duplication will drift, quietly.** Two copies of `theme.css`, two
`DESIGN.md` files, two copies of one landing page. The DESIGN.md files already
proved this: both were augment-it's document, wrong in the same way, for weeks,
because nobody edits two files when they think they are editing one.

## Options

1. **Changelog moves to the site; splash keeps `/context-v` + `/search`.**
   didi.sh gains `/changelog`, which becomes the canonical, indexed location.
   The splash drops its duplicate landing index and becomes an honestly-named
   developer surface: working docs, issues, plans, full-text search. Each
   surface has content the other does not. The splash links up to didi.sh; the
   site links out to the splash for the deep docs.

2. **Changelog on both, one canonical.** didi.sh renders it and carries
   `rel="canonical"`; the splash keeps its copy pointing at didi.sh. Preserves
   both reading paths, but requires the canonical tag to be right forever, and
   an entry rendered twice is a maintenance surface, not a feature.

3. **Everything moves to didi.sh; retire Pages.** One domain, all authority
   concentrated, no cross-domain seam, Pagefind comes along. Costs the second
   indexed property and the inbound-link argument entirely — and the `splash/`
   → Vercel move is real work (content collections read `../changelog` and
   `../context-v` from the repo root; the Vercel Root Directory would need to
   accommodate that).

4. **Leave the split, fix only the duplication.** Extract one shared token file,
   delete the splash's duplicate landing index, and stop. Cheapest; leaves the
   changelog where it earns nothing for the domain.

## Recommendation

**Option 1.** It is the only one that gives each surface a reason to exist and
puts the compounding content on the domain that should compound.

Sequence it as:

1. Extract `theme.css` to one file both projects import — the prerequisite for
   any further divergence, and it fixes the stale header comment.
2. Add `/changelog` (index + detail) to `site/`, reading the same
   `../changelog` collection the splash already reads.
3. Remove `/changelog` from `splash/`, or `301` it — decide which before
   building, since the splash's existing URLs are already indexed.
4. Replace the splash's duplicate landing index with a real developer-surface
   index: what this repo is, what the docs are, where the source lives.
5. Deliberately design the link graph in both directions rather than patching it
   when someone reports a dead end. At minimum: site → splash for deep docs,
   splash → site on brand and footer (already done), and both → `id.didi.sh`.

## Open questions

1. **Do the splash's existing `/changelog/` URLs need redirects?** They are
   indexed and were just refreshed with two new entries. GitHub Pages cannot
   serve a real `301` without a meta-refresh hack.
2. **Does `site/` want Pagefind**, or is search a developer-surface feature that
   stays on the splash?
3. **Does the splash keep its own domain** (`log.didi.sh`, `build.didi.sh`) if it
   ever moves to Vercel, or does the `github.io` path stay part of the point —
   a second property on a different domain is worth more for links than a
   subdomain of the first.
4. **Which surface owns `/context-v`?** The recommendation assumes the splash,
   but plans and issues marked `publish: false` never render anywhere, so the
   public value of that route is currently thin.

## Related

- `context-v/plans/Bring-The-Spike-Under-The-Credential-Design-System.md` —
  increment 2 covers the shared-token extraction this issue depends on
- `splash/DESIGN.md`, `site/DESIGN.md` — corrected 2026-08-21; both had
  described augment-it
- `204b38a` — the interlinking fix that surfaced this issue

---
name: astro-knots
description: The Lossless Group's Astro Knots conventions — vision, tech hierarchy, approved frameworks, and hard prohibitions for the family of ~10+ Astro sites and the Lossless Flavored Markdown ecosystem. Use whenever working on an Astro project in the lossless-monorepo (or any sibling repo), scaffolding new sites, choosing dependencies, building components, integrating LFM, or when the user mentions "Astro Knots", "LFM", "Lossless Flavored Markdown", or "pseudomonorepo". Hard prohibitions on React, JSX, Angular, and unnecessary dependencies.
from: "dididecks-ai"
from_path: "context-v/agent-skills/astro-knots/SKILL.md"
---
# Astro Knots

> A vision-mission masquerading as a stack: use the Internet as it was originally, idealistically intended.

Astro Knots is The Lossless Group's umbrella for a family of conventions across **~10+ Astro sites at various stages**, built around Astro + Extended Markdown + SCM workflows + APIs. Think JAMstack with a steeper opinion gradient — and no one's heard of it yet.

Reference site: <https://www.lossless.group/projects/gallery/astro-knots>

## When to use this skill

- Working in any Astro project under `lossless-monorepo` or a sibling repo
- Scaffolding a new Astro site (multiple new sites per quarter is normal)
- Choosing or adding dependencies — **always check tech rules below before installing anything**
- Building components, page layouts, content pipelines
- Integrating [Lossless Flavored Markdown (LFM)](https://jsr.io/@lossless-group/lfm)
- User mentions "Astro Knots", "LFM", "extended markdown", "pseudomonorepo", or any of the ~10 site names
- Code review or refactor on an Astro Knots project

## The vision (don't skip)

1. **Internet as originally intended.** Documents, links, hypertext. Composable, not bundled. Readable URLs. Fast pages. Open formats.
2. **Build in public.** Ship code and content together. Document thinking *while* shipping, not after.
3. **Generate meaningful content while shipping.** Every project produces durable thought-artifacts (specs, blueprints, explorations). The work and the writing are the same activity.
4. **Forefront of Human + AI + Agent collaboration.** Aspire to make a meaningful contribution to how humans and agents build things together. The `context-v/` framework is one such contribution; LFM is another.

If a proposal contradicts these, push back before implementing.

## The Tech Hierarchy

A strict preference order. Always reach for the lowest level that works.

1. **HTML & CSS** — first choice. Semantic HTML, modern CSS (grid, flexbox, container queries, `@supports`, native nesting). If HTML+CSS can do it, do not reach higher.
2. **Vanilla JS** — when interactivity is genuinely needed. Web standards (Fetch, IntersectionObserver, custom elements) before any helper.
3. **A small focused package** — when vanilla JS would require reinventing something hard. Prefer single-purpose, low-dep, ideally tree-shakeable libraries.
4. **A framework** — last resort, and only one of the approved few below.

> Fewer dependencies is always better. Dependencies are liabilities, not assets.

## Approved Frameworks (and only these)

| Framework | When to use | Why approved |
|---|---|---|
| **Astro** | Default site framework | Server-first, ships zero JS by default, partial hydration on demand |
| **Svelte** | Interactivity that genuinely benefits from reactivity / SSR | Compiles to small vanilla JS; no virtual DOM tax |
| **GSAP** | Animations that exceed CSS animations / transitions | Battle-tested; only when CSS truly can't |
| **Reveal.js** | One of three presentation-as-code renderings | Plain-HTML slides authored as Markdown |

> Two other presentation renderings exist alongside Reveal. // TBD: confirm which (likely Marp and/or Slidev). Update this table when confirmed.

### Conditional / experimental

We will *test* new tools but stay skeptical. Anything not in the approved list is on probation by default.

## Hard Prohibitions

These are not vetoes-with-exceptions. They are **no**.

- ❌ **React** — bundle weight, virtual DOM tax, ecosystem sprawl
- ❌ **JSX** in any form — including in Astro components (Astro supports `.astro` syntax; use it)
- ❌ **Angular**
- ❌ **Any "bloat" framework** that violates the Tech Hierarchy

If a third-party tool *requires* React/JSX/Angular as a runtime dep, find another tool or build the slice we need. If the user explicitly asks for React, push back and offer the equivalent in approved tech. Only proceed if they confirm with full understanding.

## Auth-gated routes must not be prerendered

If a site uses `output: "server"` plus a middleware-based auth gate (Astro's `src/middleware.ts` checking a session cookie, a token, an `Astro.locals` role, anything), **every route the gate is supposed to protect must declare `export const prerender = false`.** Period. No exceptions.

**Why this is load-bearing:**

In `output: "server"` mode, a route opts out of server-rendering with `export const prerender = true` — Astro bakes the route's output into static HTML at build time, and the hosting platform (Vercel, Netlify, GitHub Pages, etc.) serves that HTML straight from its CDN edge. **Middleware runs only on requests served by the SSR runtime.** Static files served by the CDN go around the runtime entirely:

```
USER → CDN → static /play/variant/v2.html       ← middleware NEVER runs
                                                  ← auth gate is invisible
                                                  ← anyone with the URL gets in
```

vs. the server-rendered version:

```
USER → CDN → SSR function → middleware → /play/variant/[variant].astro render
                            ← auth gate ALWAYS runs
```

The dev-mode symptom is sneakier than the production hole: prerendered routes in dev with `output: "server"` *do* run through middleware, but the request context Astro hands to that middleware **doesn't surface the inbound `Cookie` header reliably**. The middleware reads `cookies.get("session")` → `undefined` → bounces to `/access`, even though the browser is correctly sending the cookie. Operators see a "login works once, then loops" symptom that looks like a cookie bug. It's a prerender bug.

**The rule:**

| Route is... | `prerender` must be |
|---|---|
| In the middleware's public allowlist (`/changelog`, `/access`, public-facing marketing pages, etc.) | `true` is fine — middleware passes through anyway |
| Under the gate (any path the middleware protects) | **`false`. Always.** |
| Unsure | `false` and prove the case for `true` later |

**When sweeping an existing site,** grep every `export const prerender = true` and cross-reference against the middleware's `PUBLIC_PREFIXES` / equivalent. Anything prerendered AND gated is a silent production bypass. Fix immediately; this is not a polish-pass concern.

**Realized example:** `calmstorm-decks` shipped `/play/variant/[variant].astro` and `/play/section/[slot].astro` as `prerender = true` with a `getStaticPaths()` enumerating variants. The dev symptom was an unbreakable auth loop ("submit code, land on a page once, then every navigation bounces"). The production exposure was that anyone with the URL could play the deck. Fix: flip both to `prerender = false`, then restart the dev server (Astro doesn't HMR the prerender flag). See `dididecks-ai/changelog/2026-05-17_02.md` for the full debugging trace and the helper-pattern hardening that came out of it.

## Lossless Flavored Markdown (LFM)

Our first true package. Polyglot but lean: extended markdown syntax → component render pipeline. More daring than CommonMark, less rigid than MDX. **Any syntax can be added as a trigger to render a component.**

- Production: <https://jsr.io/@lossless-group/lfm>
- Philosophy: assimilate the best ideas, let anyone try anything

A dedicated `lfm` skill is **forthcoming**. Until it lands:

- Prefer LFM-friendly content patterns when authoring `.md` files for Astro Knots sites
- If the user wants extended markdown syntax (callouts, embeds, transclusions, etc.), reach for LFM-shaped solutions, not MDX
- Don't suggest MDX as an alternative

## Pseudomonorepos

Our coined term — see `references/pseudomonorepos.md`. Brief: a parent repo that adds child repos as **git submodules**, primarily so the parent can host a `context-v/` that aggregates context across the children. Not a true monorepo (no shared build, no shared deps), not loosely coupled either.

Implication: when working in a child repo, also check the parent's `context-v/` for relevant blueprints/specs. Headaches in implementation often have answers in the parent.

A dedicated `pseudomonorepos` skill **exists** — load it whenever working in this tree. It encodes the search-first discipline that composes with everything else.

## How to behave (decision rules)

When the user asks for X, default behavior:

| Ask | Default response |
|---|---|
| "Add React" / "use React" | Push back. Offer Astro + Svelte equivalent. |
| "Use MDX" | Push back. Offer LFM-shaped approach. |
| "Install [framework]" | Check Tech Hierarchy. If not approved, ask why and propose alternative. |
| "Add a UI library" | Strong skepticism. Most often: write the component in Astro/Svelte. |
| "Animate this" | CSS first. GSAP only if CSS genuinely can't do it. |
| "Make it interactive" | Vanilla JS or Svelte. Justify before reaching higher. |
| "Build a slide deck" | Markdown + Reveal (or one of the other two). |
| "Document this work" | Use `context-v/` per the `context-vigilance` skill. |
| "Add `prerender = true` to a route" | If the site uses `output: "server"` + middleware auth, refuse unless the route is in the middleware's public allowlist. See "Auth-gated routes must not be prerendered" above. |

## Frontmatter & YAML conventions (toward standardization)

These apply to **every** YAML-bearing file in an Astro Knots site or its `context-v/` — content collections, specs, prompts, blueprints, reminders, changelogs, deck slides, everything.

### Wrap long string values in double quotes

Any string value that's longer than a few words — descriptions, ledes, titles with punctuation, URLs that contain query strings or fragments, error messages, prompts — wraps in double quotes (`"`).

```yaml
# Do
title: "Secure Document Sharing — #1 DocSend Alternative"
description: "An open-source document and data-rooms sharing platform. Free alternative to DocSend with custom branding."
og_image: "https://www.papermark.com/_static/meta-image.png?v=2&utm=share"
lede: "A safe, non-judgemental support session — nobody here knows what they're doing either."

# Don't (works until it doesn't)
title: Secure Document Sharing — #1 DocSend Alternative   # `#` starts a YAML comment → silent truncation
description: An open-source platform: free alternative.   # `:` mid-string can break parsing
og_image: https://example.com/img.png?a=1&b=2             # `&` is a YAML anchor sigil
```

**Why:** long human-authored strings reliably contain at least one of `:` `#` `&` `*` `>` `|` `!` `%` `@` ` `` ` `` `,` `[` `]` `{` `}` — every one of which has special YAML meaning unquoted. Wrapping in `"` makes the value a literal string and removes the entire class of "works locally, breaks in CI" bugs. Cheap to do, expensive to debug.

### Lenient parsing is required at the loader

We never use a strict YAML parser for content frontmatter. The expected behavior is property-level recovery: drop bad keys, keep the document, surface a precise warning, escalate only for load-bearing keys. See `[[YAML-Frontmatter-Parsing-Must-Be-Lenient]]` in any site's `context-v/reminders/` (or in `astro-knots/context-v/reminders/`) for the pattern. Strict parsers turn one author typo into a site-wide outage and are not acceptable in this stack.

### Keys are `snake_case`. Tags are `Train-Case`.

Already covered in the `context-vigilance` skill, restated here because it's the same surface: property names use `snake_case` (Obsidian renders them that way), tag *values* use `Train-Case`. Never camelCase keys, never lowercase tags.

## Initiating a new Astro-Knots project

A new Astro-Knots site (or package, or study) gets initiated **through a spec**, not by jumping straight into `pnpm create astro`. The *how* of developing that spec is generic and lives in the `context-vigilance` skill — specifically `references/developing-a-spec.md`. Load that reference whenever the user wants to initiate a new project.

Before writing any spec stub:

1. **Check whether the parent dir is a pseudomonorepo.** Walk up from cwd; load the `pseudomonorepos` skill. If yes, the new spec almost certainly belongs in the **parent's** `context-v/specs/`, not in a not-yet-created child's. Confirm with the user.
2. **Drop a stub** in the right `context-v/specs/` (frontmatter + H1 only), then return focus to discussion. Don't try to draft the spec body in advance of the conversation.
3. **Then proceed through the rhythm in `developing-a-spec.md`** — receive prior art, discuss → write → discuss, surface stale context-v files, sign-off gate, narrative pass, prompt-pairing.

**After spec sign-off, before implementation:** load the setup playbook at `references/playbooks/new-site-setup.md` — the 12-step flow from repo creation through deploy config. For executable commands and file templates, cross-reference `astro-knots/context-v/prompts/New-Site-Quickstart-Guide.md` in the monorepo.

**Deploying to GitHub Pages instead of Vercel** (for splash pages, per-repo landing sites, free static hosts): load `references/playbooks/github-pages-deploy.md`. It captures the canonical workflow shape, the `astro.config.mjs` `base` setting, and the three setup-time gotchas every new GitHub Pages repo hits — Pages-not-provisioned (`enablement: true`), branch-not-allowed (environment protection rule), and Source-still-on-"Deploy from a branch". Pay the setup tax once per repo, then the workflow handles itself.

**Adding share-card metadata** (OpenGraph / Twitter / canonical / robots): load `references/playbooks/opengraph-system.md`. It encodes the realized two-file pattern shipped in calmstorm-decks and reach-edu-hub — `src/lib/seo.ts` registry + `src/components/basics/MetaTags.astro` renderer — plus the gated-vs-public and local-vs-CDN policy axes that drive defaults. Source blueprint: `lossless-monorepo/content/lost-in-public/blueprints/Maintain-an-Elegant-Open-Graph-System.md`.

**Making the site LLM-friendly at inference time** (public docs, blueprints, study profiles, anything an external LLM might want to use to answer a user's question): load `references/playbooks/llms-txt-and-md-sidecars.md`. Two artifacts: `public/llms.txt` (curated index) and a `[...slug].md.ts` endpoint per content collection (raw markdown sidecar at the same URL with `.md` appended). Astro doesn't auto-generate either the way nbdev / VitePress / Docusaurus do — fill the gap deliberately. Skip on gated/noindex sites. Source profile: `studies/open-specs-and-standards/context-v/profiles/Profile__llms-txt.md`.

## Cross-skill ties

- **`context-vigilance`** governs *how* we document. **`astro-knots`** governs *what* we build (and the values around it). They compose: blueprints in a project's `context-v/blueprints/` should reflect Astro Knots tech principles.
- **`pseudomonorepos`** — shipped. Composes directly with this skill: walk the tree, search before creating, log refactor debt when shipping fast.
- Forthcoming: **`lfm`** (Lossless Flavored Markdown).

## See also

- `references/philosophy.md` — the vision in depth, build-in-public practice
- `references/tech-stack.md` — full rationale for each approved/prohibited tech
- `references/ecosystem.md` — the family of sites, LFM, pseudomonorepos, roadmap
- `references/playbooks/new-site-setup.md` — the 12-step new-site flow (default-Vercel deploy)
- `references/playbooks/github-pages-deploy.md` — workflow shape, `astro.config.mjs` `base`, and the three setup-time gotchas every new GitHub Pages repo hits
- `references/playbooks/opengraph-system.md` — the `seo.ts` + `MetaTags.astro` pattern for share-card metadata (OG, Twitter, canonical, robots), with gated-vs-public and local-vs-CDN policy axes
- `references/playbooks/llms-txt-and-md-sidecars.md` — `/llms.txt` + `.md` sidecar route pattern for making public Astro sites LLM-friendly at inference time

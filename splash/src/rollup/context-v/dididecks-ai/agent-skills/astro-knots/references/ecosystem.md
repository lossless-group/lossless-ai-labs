---
from: "dididecks-ai"
from_path: "context-v/agent-skills/astro-knots/references/ecosystem.md"
---

# Astro Knots Ecosystem

The family of sites, packages, and conventions under the Astro Knots umbrella.

## The sites

We have **~10+ Astro sites at various stages of development and maintenance**, with new ones added at a pace of roughly one every few weeks. Each is its own repo, often added as a git submodule to a parent **pseudomonorepo** for context aggregation.

// TBD: enumerate the active sites, their purposes, and stages. Suggested fields per site:
// - name
// - repo URL
// - status (active, maintenance, archived)
// - audience
// - notable patterns or conventions originated here

When working on a specific site, look for its `context-v/` first. If the site lives inside a pseudomonorepo, also check the parent's `context-v/` for cross-site blueprints.

## Packages

### Lossless Flavored Markdown (LFM)

- **Production:** <https://jsr.io/@lossless-group/lfm>
- **Status:** First true package; actively developed
- **Position:** Polyglot but lean extended markdown syntax → component render pipeline
- **Comparison:** More daring than CommonMark, less rigid than MDX
- **Defining feature:** Any syntax can be added as a trigger to render a component
- **Philosophy:** Assimilate the best ideas; let anyone try anything

A dedicated `lfm` skill is forthcoming. Until then, when working with content for Astro Knots sites:

- Prefer LFM-shaped patterns over MDX
- Don't suggest MDX as an alternative when the user wants extended markdown
- Look for `lfm` integrations in existing sites for reference patterns

## Pseudomonorepos

Our coined term. Brief definition:

> A parent repo that adds child repos as **git submodules**, primarily so the parent can host a `context-v/` that aggregates context across the children. Not a true monorepo (no shared build, no shared deps, no workspace tooling). Not loosely coupled either (the parent maintains intentional context about the children).

### Why

The pattern emerged because:

1. Each child project deserves its own repo for clean SCM, deploys, and access control
2. But headaches in one child often have answers (or related decisions) in another
3. A parent `context-v/` lets us write blueprints that span children
4. Submodules keep the children authoritative (no copy-paste drift)

### How

Typical layout:

```
pseudomonorepo/
├── .git
├── .gitmodules            # references each child as a submodule
├── context-v/             # parent-level context spanning children
│   ├── specs/
│   ├── blueprints/        # cross-cutting patterns
│   ├── prompts/
│   ├── reminders/
│   ├── explorations/
│   └── issues/
├── child-repo-a/          # submodule
├── child-repo-b/          # submodule
└── child-repo-c/          # submodule
```

Each child also has its own `context-v/`. Specific implementation headaches → child's `context-v/issues/`. Cross-cutting patterns → parent's `context-v/blueprints/`.

A dedicated `pseudomonorepos` skill **exists** — see `pseudomonorepos/SKILL.md`.

## SCM workflows (the "S" in Astro + Markdown + SCM + APIs)

// TBD: confirm what "SCM" specifically means in the Astro Knots formulation. Likely a set of conventions around:
// - submodule management for pseudomonorepos
// - branch naming and PR conventions
// - commit message conventions (we use `skill(<name>):` style for this skills repo)
// - automated content sync between repos and sites

When confirmed, expand this section or split into its own reference doc.

## API conventions (the "A")

// TBD: enumerate the API patterns common across Astro Knots sites. Suggested topics:
// - which APIs are commonly integrated (GitHub, Imagekit, etc.)
// - patterns for fetching at build time vs. runtime
// - caching strategies
// - error handling conventions

## Skills roadmap

Planned and in-progress skills related to Astro Knots:

| Skill | Status | Purpose |
|---|---|---|
| `astro-knots` | ✅ this one | Umbrella vision + tech rules |
| `context-vigilance` | ✅ shipped | `context-v/` documentation framework |
| `lfm` | 🚧 planned | Lossless Flavored Markdown patterns and integration |
| `pseudomonorepos` | ✅ shipped | Submodule-based context aggregation, search-first discipline |
| `lossless-house-style` | 💭 candidate | Voice, formatting, citation conventions for prose |
| `monorepo-nav` | 💭 candidate | Quick orientation map for `lossless-monorepo` |

When a forthcoming skill lands, update this table and link from `astro-knots/SKILL.md`.

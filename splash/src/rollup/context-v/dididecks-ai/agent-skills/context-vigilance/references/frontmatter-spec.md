---
from: "dididecks-ai"
from_path: "context-v/agent-skills/context-vigilance/references/frontmatter-spec.md"
---

# Frontmatter Spec for `context-v/` Documents

> **In practice, frontmatter is scattered.** Some files are richly tagged with status, supersedes, related, aliases. Others have only `title` and `date_created`. Both are fine. This document describes the *aspirational* baseline for new files — not a validator's checklist.

Most Markdown files under `context-v/` start with YAML frontmatter delimited by `---` lines. Be generous reading; be thoughtful writing.

## Property names: always `snake_case`

**All frontmatter property names in `context-v/` are `snake_case`.** This is not a stylistic preference — **Obsidian's frontmatter rendering and property indexing enforce it**, and most Lossless `context-v/` directories are symlinked into Obsidian vaults. camelCase and kebab-case keys break Obsidian's property panel and graph indexing.

- ✅ `date_created`, `augmented_with`, `semantic_version`, `superseded_by`, `implements_spec`, `related_blueprint`
- ❌ `dateCreated`, `augmented-with`, `SemanticVersion`, `supersededBy`

The rule applies to **keys only.** Values are governed separately:

- `tags` values → **Train-Case** (e.g., `Markdown-Rendering`)
- `status` values → **Train-Case** (e.g., `In-Discussion`, `Signed-Off`) — see the `status` row below
- `authors`, `augmented_with` values → free-form human-readable strings
- Dates → `YYYY-MM-DD`

When introducing a new property anywhere in the tree (in a doc, a template, a tool, a script): name the key in `snake_case`, no exceptions. When you encounter an existing file with a non-`snake_case` key, surface it to the user rather than silently renaming — some sites' build tooling or content collections may be reading the field by its current name.

## Canonical example

```yaml
---
title: "Maintain an Extended Markdown Render Pipeline"
lede: "Why our markdown pipeline is the asset — and where it's heading next."
date_created: 2026-03-30
date_modified: 2026-05-03
authors:
  - Michael Staton
augmented_with:
  - Pi on Claude Sonnet 4.5
semantic_version: 0.1.2.0
tags:
  - Markdown
  - Rendering
  - Astro
---
```

## Baseline fields (recommended for new files)

| Field | Type | Notes |
|---|---|---|
| `title` | string | Human-readable. Quote it if it contains a colon. Title Case. |
| `lede` *(or `description`)* | string | **Optional on any `context-v/` doc-type** — spec, prompt, blueprint, exploration, reminder, issue. Newsroom-style hook: one sentence that makes a reader want to keep reading. **`lede` is preferred** over `description` because the word itself signals the job (*grab attention*); both are accepted. Many `context-v/` docs are destined for public web rendering through Astro Knots sites, so the lede also doubles as the OpenGraph / preview-card / list-view summary. Add it whenever the doc might be surfaced anywhere a reader sees only one line before deciding to click. See the `changelog-conventions` skill for the deeper rationale and concrete examples. |
| `date_created` | YYYY-MM-DD | Set once on creation. Never change. |
| `date_modified` | YYYY-MM-DD | Update on every meaningful edit. |
| `authors` | list of strings | **Humans only.** Always a list, even with one entry. |
| `augmented_with` | list of strings | AI tools used. Format: `<tool> on <model name version>`. Include whenever an AI agent contributed materially. |
| `semantic_version` | string `e.M.m.p` | Four-part. See `versioning.md`. New docs start at `0.0.0.1`. |
| `tags` | list of strings | **Train-Case** (e.g., `Markdown-Rendering`). At least one tag. |

If an existing file is missing any of these, **don't silently add them while doing unrelated edits** — surface the gap to the user first. Frontmatter changes are a separate concern from content changes.

## Optional fields

Add as needed; do not invent fields without precedent in the project. Common ones seen in the wild:

| Field | Purpose |
|---|---|
| `status` | **Train-Case display string** (e.g., `Draft`, `In-Review`, `Signed-Off`, `Implementing`, `Shipped`, `Partially-Shipped`, `Deferred`, `Stale`, `Superseded`, `Archived`). Treat as a rendering string for humans, **not a machine enum** — don't switch on these values in code, since spelling and casing drift across files. The Train-Case casing is the signal: "this property exists for display, not for build/render-pipeline branching." Update status as work lands; don't let it rot at `Draft`. Companion fields are required for `Shipped`, `Partially-Shipped`, `Deferred`, and `Superseded` — see `status-discipline.md` for the full lifecycle, companion-field rules, and the `## Remaining work` section convention. Spec-specific progression lives in `developing-a-spec.md`. |
| `date_first_published` | `YYYY-MM-DD`. The ship date, set when `status:` first becomes `Shipped` or `Partially-Shipped`. Never updated after — it anchors when the work first landed. |
| `post_ship_note` | Multiline string. Things learned after `Shipped`. Useful when later work invalidates or sharpens a claim the plan made. See `status-discipline.md`. |
| `deferral_note` | Multiline string. Required when `status: Deferred`. Names the reason and (where known) the expected unblocker. |
| `supersedes` | wikilink or filename of the doc this one replaces |
| `superseded_by` | reverse of above |
| `related` | list of `[[wikilinks]]` to related docs |
| `aliases` | alternate titles for Obsidian linking |

## Author conventions

**Strong Lossless preference: `authors` is for humans only.** Even when an AI agent produced most of the prose, the human directing the work is the author. AI tooling is tracked separately under `augmented_with`.

### `authors`

- Use the human's full preferred name (not a handle)
- Always a list, even with one entry
- Order: alphabetical or by contribution — team's call, no hard rule

### `augmented_with`

- The AI tool(s) used. Format: `<tool> on <model name and version>`
- Examples: `Pi on Claude Sonnet 4.5`, `Claude Code on Claude Opus 4`, `Cursor on GPT-5`, `Aider on Claude Sonnet 3.7`
- ul-list form, one entry per tool/model pair
- Include this field whenever an AI agent contributed materially — the more, the more important to disclose
- Avoid generic strings (`"AI Assistant"`, `"ChatGPT"`) — always specify both tool and model
- The point: honesty about augmentation matters more than credit allocation

## Tag conventions

- **Train-Case**: `Markdown-Rendering`, not `markdown-rendering`, `MarkdownRendering`, or `markdown_rendering`
- This is an Obsidian convention — Obsidian treats `#Markdown-Rendering` as a single tag, while underscores and other separators behave inconsistently
- Single-word tags are still capitalized: `Spec`, `Astro`, `Markdown`
- Singular over plural when ambiguous: `Spec`, not `Specs`
- Reuse existing tags in the project before inventing new ones — survey with:
  ```bash
  grep -rhA20 '^---' context-v/ | grep -E '^  - [A-Z]' | sort -u
  ```

## Date format

Always `YYYY-MM-DD`. No timestamps. No timezones. If you genuinely need a timestamp, use a separate field like `last_run: 2026-05-03T14:32:00Z` rather than overloading the date fields.

## Title quoting

Quote when the title contains:
- a colon (`:`)
- a leading number (`2026 Plan`)
- special YAML characters (`#`, `&`, `*`, `!`, `|`, `>`, `'`, `"`, `%`, `@`, `` ` ``)

When in doubt, double-quote.

## Validation philosophy

The Lossless team **does not hard-validate** frontmatter (this is itself a reminder). Be lenient about reading existing files; be thoughtful when writing new ones. Files older than current conventions are not bugs.

If a file's frontmatter is genuinely broken (malformed YAML, missing `title`), fix it as a `patch` bump and note the fix in the body or a commit message. Don't auto-migrate property names or styles unless explicitly asked.

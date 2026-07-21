---
from: "dididecks-ai"
from_path: "context-v/agent-skills/changelog-conventions/references/frontmatter-spec.md"
---

# Changelog Frontmatter Spec

The complete frontmatter contract for `changelog/` entries.

## Mandatory (hardcoded for last few months and forward)

```yaml
---
date_created: YYYY-MM-DD
date_modified: YYYY-MM-DD
title: "Title in title case"
lede: "Attention-grabbing one-line subtitle"
publish: true
authors:
  - Firstname Lastname
augmented_with:
  - Pi on Claude Sonnet 4.5
---
```

### Field-by-field

#### `date_created`
- ISO date with dashes (`2026-05-04`)
- Set once on creation. Never change.
- Typically auto-set by Obsidian's templater plugin

#### `date_modified`
- ISO date with dashes
- Updated when the entry is edited
- Obsidian's templater sometimes updates this on file open without real changes — that's a known harmless artifact, don't fight it
- For changelog entries specifically, this is rarely meaningful (entries usually aren't edited after publish), but the field stays for consistency with `context-v/` files

#### `title`
- Human-readable. Title case.
- Quote it if it contains a colon, leading number, or special YAML characters
- Aim for clarity over cleverness — but not at the expense of being readable

#### `lede`
- The most distinctive field
- **Purpose:** grab attention. The reader should want to keep reading.
- One sentence. No more.
- Avoid generic ledes ("Updates to the project") — make it specific
- Examples:
  - ✅ `"From zero to four shipped skills in one Claude session — and a backlog longer than the shipped list."`
  - ❌ `"Various improvements and changes."`

#### `publish`
- **Always `true`** for new entries
- Obsidian publisher uses this field to decide what goes to the published site
- Do not deviate — `publish: false` is reserved for explicit reasons (e.g., draft, sensitive)
- This is the most strictly enforced field on the platform

#### `authors`
- **Humans only.** AI agents are tracked separately under `augmented_with` (see below).
- Always a YAML list, even with one author
- **Preferred form:** ul list (one author per line)
  ```yaml
  authors:
    - Michael Staton
  ```
- **Tolerated form:** inline list (`[Michael Staton, Other Person]`) — works but harder to diff and read
- Use the human's full preferred name

#### `augmented_with`
- The AI tool(s) used to produce the entry. Tracked separately from `authors` because **AI agents augment human authorship; they don't co-author.**
- Format: `<tool> on <model name and version>`
  - ul-list, one entry per tool/model pair
- Examples:
  ```yaml
  augmented_with:
    - Pi on Claude Sonnet 4.5
    - Claude Code on Claude Opus 4
    - Cursor on GPT-5
  ```
- Include this field whenever an AI agent contributed meaningfully — even (especially) when it produced most of the words. Honesty about augmentation matters more than authorship credit.
- Avoid generic strings like `"AI Assistant"` or `"ChatGPT"`. Specify the tool *and* the model.

## Strongly recommended optional fields

### `files_changed`
- **List of paths**, project-root-relative
- Format: ul-list, one path per line
  ```yaml
  files_changed:
    - src/components/NameOfComponent.astro
    - src/styles/global.css
    - context-v/blueprints/Component-Pattern.md
  ```
- Why include it: makes seeing what actually moved trivial — for readers, for diffs across rendered changelogs, for the future "Lossless Changelog" aggregator
- Not required, but include it whenever the entry is about file-level changes (almost always)
- Paths are from the **project root** (the repo containing the changelog), not from the changelog file itself

## Optional fields (use as needed)

### `tags`
- Train-Case (e.g., `Skills`, `Pseudomonorepo-Pattern`)
- At least one tag is recommended for taxonomy/filtering on rendered sites

### `semantic_version`
- Four-part `epoch.major.minor.patch` (see `context-vigilance/references/versioning.md`)
- For release entries, this is essentially the version being announced
- For standard changelog entries, optional — a changelog entry isn't itself a versioned doc

### `release_version`
- Used in `releases/` subfolder. The version string the entry announces.
- Example: `release_version: "1.2.0"` or `release_version: "0.0.0.1"`

### `related`
- List of `[[wikilinks]]` to related context-v/ docs (the spec this implements, the blueprint this codifies)
- Helps the aggregator render entries with context

### `aliases`
- Obsidian convention for alternate titles
- Useful for SEO when the title is internal-flavored but a public reader would search differently

### `image` / `cover_image`
- For changelog entries that get rendered prominently on Astro Knots sites
- Path or URL

## Validation philosophy

- **Be lenient reading.** Older entries (more than a few months back) often have fewer or different fields. They are not bugs.
- **Be careful writing.** New entries should have all six mandatory fields.
- **Don't auto-migrate.** Don't go through old entries adding `lede` or normalizing `authors`. Show, don't enforce.
- If a frontmatter is genuinely broken (malformed YAML), fix it in a small dedicated edit, not as a side effect of unrelated work.

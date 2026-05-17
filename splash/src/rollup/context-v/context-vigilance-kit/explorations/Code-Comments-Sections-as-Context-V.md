---
title: "Code-Comment Sections as Context-V Source"
lede: "JSDoc treats code comments as the source of truth for API documentation. The same move might work one level up — treating *certain section-level comment blocks* in a codebase as the source of truth for context-v entries that today live as standalone markdown. The question is which kinds of context belong embedded in source files versus floating beside them."
date_created: 2026-05-11
date_modified: 2026-05-11
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7 (1M context)
semantic_version: 0.0.0.1
status: Draft
tags:
  - Code-Comments
  - JSDoc
  - Source-of-Truth
  - Context-Engineering
  - AST-Extraction
  - Build-Time-Tooling
  - Drift
from: "context-vigilance-kit"
from_path: "context-v/explorations/Code-Comments-Sections-as-Context-V.md"
---
# Code-Comment Sections as Context-V Source

## Why care?

Most of the load-bearing "why does this exist?" knowledge in a codebase doesn't live in `context-v/`. It lives in **section-level code comments**: the 30-line block at the top of a file explaining the module's purpose; the `// ===== Connection pool =====` divider with a paragraph below it about why the pool is configured the way it is; the decision-record comment above a confusing function explaining the three approaches considered and the one chosen. These blocks have the same shape as a context-v entry — a title, a *why*, and the constraints — but they live where the agent doesn't look unless it's already reading that file.

Context-V's working assumption is that agents need this kind of context loaded *before* they touch the code. Today the way to surface it is to copy it into a markdown file under `context-v/` and let it drift from the source. JSDoc faced the same problem one floor down (function-level API docs drifting from the code) and solved it by making the comment-adjacent-to-the-code the source of truth and projecting the docs out at build time. The question this exploration opens: **can section-level comments serve the same role for context-v entries?**

If yes, the kit gains a new ingest path — extract structured comment sections into the corpus alongside hand-authored `.md` files — and a hand-wavier but more important shift: the *act of writing context-v* becomes part of writing the code, not a separate hygiene chore that decays.

## The JSDoc analogy, made precise

JSDoc works because three things line up:

1. **The content has a natural anchor in the source code.** A `/** ... */` block sits immediately above the function it documents. Move the function, the block moves with it.
2. **A parser knows how to extract it.** TypeScript's compiler, every IDE's language server, and `typedoc` all read the same AST.
3. **The output is a projection, not the source.** You never edit the generated HTML; you edit the comment. The HTML is regenerated.

For *context-v entries* derived from code comments, all three need an analogue:

1. **Anchor.** A section-level comment block lives at the top of a file (for "what this module is") or above a code region (for "why this region exists"). The anchor isn't a function — it's a *file* or a *region*. That's less precise than JSDoc's function-binding but workable.
2. **Parser.** A simple AST walk that finds top-of-file block comments and any block comment preceded by `// ===== Title =====`-style dividers. Tree-sitter would handle this trivially across languages.
3. **Projection.** A build-time script emits one `.md` file per extracted block into `context-v/<some-folder>/`, with frontmatter generated from the comment's marker (or hand-written in YAML inside the comment, like JSDoc tags).

The shape of a marker comment could be as simple as:

```ts
/**
 * @context-v
 * @type blueprint
 * @title Connection-Pool Sizing Rationale
 * @tags Database, Postgres, Pooling, Performance
 *
 * The pool is intentionally capped at 20 connections even though
 * Postgres can handle far more. Reason: …
 */
```

The script reads the file, finds blocks with `@context-v`, parses the JSDoc-style tags into frontmatter, and emits `context-v/blueprints/Connection-Pool-Sizing-Rationale.md` whose body is the comment prose. The source of truth is the comment; the `.md` is a projection regenerated on every build.

## What kinds of code-comment content qualify

Not every comment belongs as context-v. Most should stay where they are. The candidates are sections that already function as *context for humans landing on the codebase cold* — the same audience context-v files target.

| Comment shape | Fits context-v? | Why |
|---|---|---|
| **File-top "what this is, why it exists, what it doesn't do"** | Often yes | Same shape as a short blueprint. The file is the natural anchor. |
| **Decision-record block** above a confusing region ("we tried X, settled on Y because Z") | Yes | Identical shape to an exploration's recommendation section. |
| **Constraint / invariant block** ("don't change this without also updating …") | Yes — as a reminder | Reminders are short, sharp, and load-bearing. Perfect match. |
| **JSDoc on a function** | No | Already covered by JSDoc. Lives in API docs, not context-v. |
| **One-line `// fix typo`** | No | Not context, just a note. |
| **TODO/FIXME** | Sometimes | Only if it carries *rationale* — "FIXME: works only because [X assumption]; revisit when [Y]". |
| **Section divider with a paragraph below** | Often yes | The paragraph is the why; the divider is the anchor. |

A useful litmus test: **if an agent loading this file's content into a session would benefit from seeing this comment block *without* the surrounding code, it's a context-v candidate.** If the block only makes sense alongside the code, it stays a comment.

## What this *changes* about how we write context-v

Today's flow when working in a codebase:

1. Edit some code.
2. Notice the explanation should be captured.
3. Open a separate `.md` file in `context-v/`.
4. Write the explanation.
5. Link back to the file you were editing.
6. Commit both.

The friction is in step 3 — opening a different file in a different tree, breaking flow. Most of the time, the explanation ends up as a code comment that someday someone might promote. It rarely happens.

The proposed flow:

1. Edit some code.
2. Write the explanation as a marker comment **next to the code you just changed**.
3. Build script extracts it into `context-v/` on the next commit hook or CI run.

Step 3 disappears as a separate cognitive load. The *act* of writing context-v collapses into the act of writing code.

The cost is real: the resulting `.md` files are now generated artifacts, which means edits flow comment-first or get lost on the next build. That's the same trade JSDoc takes — you don't edit `typedoc` HTML, you edit the comment.

## Tradeoffs and gotchas

Where this is likely to bite:

- **Refactor coupling.** Move the file, the context-v entry moves with it (good); rename the file, the projected `.md` renames too (potentially breaks inbound `[[wikilinks]]` unless the script keeps a stable slug from frontmatter rather than from path).
- **Mixing concerns.** A file might host code *and* a substantial blueprint-shaped comment. Reading the file becomes harder when the comment runs 200 lines. The fix: cap how long an embedded section can be before the tool nudges you to fork it into a standalone `.md`.
- **Language coverage.** JSDoc is JavaScript-specific. The marker convention here would need to work across TS, Python, Rust, Go, etc. Tree-sitter can parse block comments in all of them, but the *grammar of the marker* needs to be ASCII-only and parser-independent so writing the comment is the same in any language.
- **Two sources of truth temptation.** Once a generated `.md` exists, someone will edit it directly. The build needs to either round-trip (rare and painful) or detect drift and fail loudly. Probably the latter — fail the build if a generated `.md` has uncommitted edits the source comment doesn't.
- **What about deletion?** A comment removed from source should remove the `.md`. That's mechanical. But what if the `.md` has accumulated inbound links? The build needs to surface "you're about to delete a doc with N inbound links — confirm" rather than silently dropping.

## Mechanism sketches (three flavors)

### A. Extract on commit
A pre-commit hook walks staged source files, extracts marker comments, writes `.md` files, stages them too. Simple, no CI dependency. Cost: the hook runs even when you're not editing context-v-marked sections, so it needs to be fast (tree-sitter, no full project scan).

### B. Build-time projection (the typedoc model)
A standalone command (`pnpm context-v:extract` or similar) walks the whole project, regenerates the `.md` corpus, and the build step fails if `git status` shows the corpus changed. CI catches drift; humans don't have to think about it during local work. Cost: corpus changes are an extra commit; the loop "edit comment → build → commit corpus" feels weird.

### C. No extraction — virtual projection
The kit's splash builder reads source files directly during corpus collation and surfaces marker comments alongside hand-authored `.md` files. No `.md` files ever materialize; the projection lives only in the rendered corpus. Cost: anything outside the splash (e.g., an agent loading the file system) doesn't see the embedded context unless it runs the same parser.

(C) is the lightest commitment but only solves the splash's view of the world. (A) and (B) are heavier but make embedded context visible everywhere.

## Open questions

- **Is the JSDoc analogy strong enough to justify a new convention, or does this just become "use code comments well and copy the good ones into context-v manually"?** The discipline matters more than the tool. If the answer is "humans should just be vigilant about both," tooling is premature.
- **What's the right marker?** `@context-v` inside a JSDoc-style block is one option. A separate `// === Context-V: Title ===` divider is another. The first is parser-friendly across languages; the second is human-friendly but harder to parse cleanly.
- **Should the *type* of context-v entry (blueprint / reminder / exploration / spec) be inferable from where the comment lives**, or always declared by tag? Inferring (e.g., "comments under `// ===== Architecture =====` become blueprints") is magic; declaring is verbose. Probably declare.
- **What about cross-references *out* of code comments?** If a marker comment references `[[Some-Spec.md]]`, does the projection resolve it? Probably yes, same as any other `.md` — but the source-of-truth `.md`s in `context-v/specs/` might reference back to the line in the source file, which means generated `.md`s need to record their source path for round-trip linking.

## What would unblock a spec

Two cheap experiments worth running before committing to any of the above:

1. **Audit one Lossless project** — e.g., `lossless-flavored-markdown/lfm` or `tidyverse/cite-wide` — and tag every top-of-file and section-level comment as "would-be-context-v" or "stays a comment." Get a rough count and a feel for how often the pattern actually shows up. If it's <10 sections per project, this isn't worth tooling.
2. **Hand-extract three or four** of the strongest candidates into actual `context-v/blueprints/*.md` files **without** tooling, manually copy-pasted. Live with them for two weeks. Do they decay faster or slower than the source comments? If faster, that's evidence the source comment really is the better source of truth.

After those, if the signal is real, write a spec covering the marker grammar, the extraction tool, and the drift-detection story.

## Related

- [[../../README]] — the kit's framing for what context-v *is*
- The JSDoc spec: [usejsdoc.org](https://jsdoc.app/) — the existing model this would extend
- [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) — the parser that makes "extract block comments across all languages" cheap
- This exploration is unpaired; if it converges, the natural next artifact is a blueprint (`context-v/blueprints/Code-Comment-Markers-for-Context-V.md`) describing the marker grammar and the projection contract.

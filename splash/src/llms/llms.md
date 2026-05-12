# Lossless AI-Labs

> {{SITE_NAME}}

Applied AI testbed becoming home to core products. The `lossless-ai-labs` pseudomonorepo houses the AI experiments that have started to graduate into products — `context-vigilance-kit` (the context-vigilance toolkit and corpus collator), `memopop-ai` (the multi-agent investment-memo workspace), and `dididecks-ai` (slide decks as code) — each tracked as a git submodule with its own branches, its own `changelog/`, and its own `context-v/`.

This splash is the public face of the workspace. It surfaces {{CHANGELOG_COUNT}} changelog entries (every meaningful change across the parent and the three children) and {{CONTEXTV_COUNT}} context-v notes (specs, explorations, plans, prompts, and reminders — the durable thinking that lives next to the code), rolled up from {{REPO_COUNT}} peers in the pseudomonorepo.

## Reference

- [Full-text search]({{SEARCH_URL}}): Pagefind-indexed across the changelog and context-v notes. Filter by `kind:` (Changelog/Context), `from:<peer>`, or `tag:<value>`.
- [Full corpus content]({{LLMS_FULL_URL}}): every changelog entry and context-v note concatenated as raw markdown — preferred ingest target for LLMs that can handle a single large document.
- [Source repository (lossless-ai-labs)](https://github.com/lossless-group/lossless-ai-labs): the pseudomonorepo this splash rolls up.
- [Lossless Group](https://lossless.group): the org that maintains this practice.

## Changelog

Every meaningful change across the pseudomonorepo, grouped by source peer. Parent-authored entries (structural moves, splash work, submodule promotions) live under `ai-labs`; child entries roll up from each submodule's own changelog.

{{CHANGELOG_INDEX}}

## Context-V

Specs, explorations, plans, prompts, blueprints, and reminders from across the workspace — the durable thinking that lives next to the code. Convention from [`lossless-monorepo/context-v`](https://github.com/lossless-group/lossless-monorepo/tree/main/context-v) and codified in the `context-vigilance` skill.

{{CONTEXTV_INDEX}}

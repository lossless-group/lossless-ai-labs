# dialogiq — collaboration study

A friend's app (`jdema-io/pub-interface`, private), studied silo-to-silo:
what can we learn from how they build, and what can they learn from us?

- **[`dialogiq-codebase/`](./dialogiq-codebase)** is their repo, mounted as
  an ai-labs submodule. It is **read-only**: never commit, push, branch, or
  refactor inside it. It's private, so it only clones for people they've
  given access to.
- Everything else in this folder is our notes.

The method, comparison dimensions, and ground rules live in
[`../../context-v/explorations/Explore-Collaborator-Codebases-for-Insights-Comparative-Highlights.md`](../../context-v/explorations/Explore-Collaborator-Codebases-for-Insights-Comparative-Highlights.md).

**Current pin:** `475febfbbbce` (2026-11-21, "Merge pull request #15"). The
notes were first written against `eedd1353` (2026-10-01) and refreshed at this
pin on 2026-11-23.

## Changes since the previous pin (2026-10-22 → 2026-11-21)

48 commits (44 non-merge, every one with a Claude trailer: 43 Opus 5.5, 1
Fable 5.2), all between 2026-11-14 and 2026-11-21. Nothing was committed from
2026-10-23 to 2026-11-13.

- **The dev harness barely moved.** Still no `CLAUDE.md`, `AGENTS.md`, CI,
  changelog or MCP config. `.claude/settings.json` is unchanged since
  2026-08-20. The only `.claude/` edit: the `verify` skill now seeds the
  named EU database `dialogiq-eu`, so the skill gets updated when the stack
  changes.
- **The repo now serves two sites.** The classroom-recording feature became
  Harvest, then Basil, on its own Hosting site (basil.fm, folder `basil/`),
  sharing the same functions. `README.md` grew from 173 to 497 lines, but it
  covers `/record` and Basil, not the platform.
- **Data moved to the EU** (`dialogiq-eu` and `harvest` Firestore databases).
- **This round's exam work was platform work:** exam pools (one link, one
  exam drawn per student), connection grace time, held answers on dropped
  links, STT backups (Gemini 3.5 Transcribe, Soniox), fast LLM failover.
- **New product-layer guards:** `functions/lib/markHold.js` holds AI marks
  that look wrong (no answers, invented quotes, coverage mismatch), added
  after an incident on 2026-11-19. Per-exam mark equating is calibrated from
  sim matrices.
- **The exam chain itself was not touched** (`EXAM_CRAFT.md`, the rulebook
  and `/exam-build` last changed 2026-10-22). The template-lag contradiction
  the first read flagged was fixed before the previous pin (2026-10-14).

Details, with corrected paths and line numbers, are in
[01](./01-Harness-Evidence__dialogiq.md) and
[02](./02-Compare-Contrast-Harness-Artifacts__dialogiq.md).

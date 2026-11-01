# phoenixcapera — collaboration study

A developer's rebuild of dididecks-ai as a full-stack product, studied
silo-to-silo: what can we learn from how they build, and what can they
learn from us?

- **[`instadeck-v2/`](./instadeck-v2)** is their repo, mounted as an
  ai-labs submodule. It is **read-only**: never commit, push, branch, or
  refactor inside it. It's private, so it only clones for people they've
  given access to.
- **[`deck-v4/`](./deck-v4)** is their later derivative of `instadeck-v2`
  (created 2026-10-23 with new Git history). Its README calls it
  an isolated test; a 2026-10-26 contract in `instadeck-v2` calls it the
  product authority. Same rules: read-only, private, never commit, push,
  branch, or refactor inside it.
- Everything else in this folder is our notes.

The method, comparison dimensions, and ground rules live in
[`../../context-v/explorations/Explore-Collaborator-Codebases-for-Insights-Comparative-Highlights.md`](../../context-v/explorations/Explore-Collaborator-Codebases-for-Insights-Comparative-Highlights.md).

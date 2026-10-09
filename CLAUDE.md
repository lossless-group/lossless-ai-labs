# Agent instructions for `ai-labs` (the AI experiments pseudomonorepo)

## What this is

`ai-labs` is a child of `lossless-monorepo` and itself a pseudomonorepo — a
parent that aggregates child repos primarily to host a parent-level
`context-v/`. It is the **default home for AI experiments graduating
into real products**: agent systems, retrieval pipelines, deck generators,
investment-memo orchestration, anything where "is this even a good idea"
hasn't yet been settled.

When in doubt about where to add something new AI-related, default to
`ai-labs`. AI work *can* live elsewhere; in practice it almost always
belongs here first and earns its way out only when it's clearly
cross-cutting.

## Children of this tree

Current children (run `ls` and `cat .gitmodules` for the authoritative
list — this is a snapshot):

| Child | Purpose |
|---|---|
| `augment-it/` | multi-tenant AI data augmentation: federated Svelte 5 microfrontends over TypeScript services on NATS; tenant-defined columns, no hardcoded schema |
| `id-didi-sh/` | the didi.sh identity service — one account across memos/decks/augment-it; **the tree's polyglot exception (Elixir/Phoenix)**; spec of record at `context-v/specs/Id-Didi-Sh-Identity-Service.md` |
| `dididecks-ai/` | slide-deck operating system for due-diligence-grade content; client engagements nested under `client-sites/`, which never roll up to any public surface |
| `memopop-ai/` | multi-agent investment-memo orchestration (LangGraph) |
| `flave-ai/` | flave, an agent-native document format and editor (repo: `lossless-group/flave`); early build, Tauri desktop app over LFM |
| `corpora-builder/` | capture, triage, fetch, and quality-check source corpora (Python + FastAPI, corpora mirrored to R2); born inside augment-it, now its own product. See `context-v/reminders/Corpora-Builder-Is-Not-Augment-It-Tooling.md` |
| `context-vigilance-kit/` | the installable context-v plugin, templates, and starters (fresh repo, 2026-10-01). The tree-wide corpus, Chroma DB, and ingesters moved to `../context-v-corpus/` at the anchor root |
| `hope-ai/` | agent skill, templates, and scripts for the ChoiceCenter 100-day Personal Strategic Plan (PSP); not an app (fresh repo, 2026-10-02) |
| `studies/collaborations/dialogiq/dialogiq-codebase/` | **a friend's app, not ours** (`jdema-io/pub-interface`, private). Mounted only so Michael can review its code, architecture, and harness setup. Read-only: never commit, push, or refactor inside it. Notes sit beside it in `studies/collaborations/dialogiq/`. |
| `studies/collaborations/phoenixcapera/instadeck-v2/` | **another developer's repo, not ours** (private): a rebuild of dididecks-ai as a full-stack product. Same rules: read-only, never commit, push, or refactor inside it. Notes sit beside it in `studies/collaborations/phoenixcapera/`. The splash names neither collaborator. |
| `studies/` | nine pinned reference collections (open-specs, memory-layers, agent-harnesses, sync-and-content-version-control, …); read upstream code, do not paraphrase from training data. `pnpm rollup:sync` snapshots them for the splash |
| `splash/` | GitHub-Pages showcase: product cards, studies, and every public child's changelog + context-v rolled up. `rollup-sync.ts` excludes `client-sites/`, non-public repos, and any file marked `private: true` or `publish: false` |
| `packages/` | pinned upstream AI tooling: `mermaid-js-ai-agent`, `odysseus` |
| `scripts/` | one-off and reusable Python/Node automation |
| `apis/` | API integrations and clients |
| `utils/` | shared utilities |

## Language conventions

- **Python: use `uv`, not plain `pip`.** Every requirements file is
  installable via `uv pip install -r requirements.txt`. Lead with `uv`
  in any docs you author; fall back to `pip` only as a footnote.
- **Node: `pnpm`**, per the workspace.
- **TypeScript** where possible; plain JS only when wrapping legacy
  scripts.

## Skills sync — opening & closing habit

Lossless skills live in `context-v/agent-skills/<name>/` at the anchor monorepo root
(`/Users/mpstaton/code/lossless-monorepo/context-v/agent-skills`, the
`lossless-agent-skills` submodule). Claude Code only
discovers a skill when it has its **own** direct-child symlink at
`~/.claude/skills/<name>` — a symlinked *parent* dir does **not** expose the
skills nested inside it. A skill that's authored but never linked is invisible
to every session.

- **Opening (session start):** sync so any skills added since last session are linked.
- **Closing (after authoring or editing any skill):** sync again — newly-linked
  skills load in the *next* session, not the current one.

```bash
bash /Users/mpstaton/code/lossless-monorepo/context-v/agent-skills/sync-skills-symlinks.sh
```

Idempotent: links every `context-v/agent-skills/*` dir with a top-level `SKILL.md`
that isn't already linked; never clobbers a non-symlink. Re-run it freely.

## Branch tier model

Three tiers, mirrored from the root: **`development` → `main` → `master`**.

Parent on tier X → all submodules on tier X. See the root `CLAUDE.md`
and `context-v/agent-skills/pseudomonorepos/references/branch-alignment.md` for
the FF mechanics, divergence checks, and push-to-default-branch caveats.

## MCP scope

When adding MCP servers, prefer `claude mcp add -s project` so the config
lands in `.mcp.json` and persists across sessions. The `local` scope has
historically lost config in this tree; the `project` scope writes to the
file that gets committed.

The `chroma` MCP server is already configured at user scope (laptop-wide)
and at this project's `.mcp.json` — no further wiring is needed for
Chroma access from any session opened anywhere under `ai-labs/`.

## Local RAG over the Lossless corpus (ChromaDB)

A local Chroma database is wired into Claude Code via the `chroma` MCP server. Four collections aggregate prior Lossless work across the whole tree:

- `context-vigilance-corpus` — section-chunked `context-v/` files across every repo
- `lossless-changelog`        — every `<repo>/changelog/` entry, cross-repo
- `claude-code-sessions`      — every prior Claude Code message turn
- `claude-code-tool-traces`   — every prior tool invocation, with success/error flag

**Use it before answering from training data.** When the user asks a question that prior work might answer — *"what did we decide about X"*, *"when did we ship X"*, *"why did we choose X over Y"*, *"has this errored before"*, *"where did we put X"* — call `mcp__chroma__chroma_query_documents` against the most relevant collection (start with `n_results=5`). If results cover the question, synthesize an answer and cite `source_path` + timestamp + `source_repo_slug` for every claim. If there is a gap, run one more focused query. **Cap at 5 chroma queries per question** — if the corpus has no answer, say so explicitly rather than silently falling back to training data.

The full algorithm (decompose → execute → evaluate → synthesize, plus `where`-filter patterns, anti-patterns, and when NOT to use it) lives in the `search-lossless-corpus` skill, which auto-loads when the question matches the trigger shapes. This block is the backstop so the corpus is known to exist even when the skill description does not match.

Ingestion lives under `context-v-corpus/scripts/` at the anchor root (moved out of `ai-labs/` on 2026-10-01) (`ingest-all.sh` is the master). Do not re-ingest as a side effect of unrelated work — the user runs it deliberately.

## See also

- `../CLAUDE.md` — root, the HARD STOP relocation rules and tree-wide guidance
- `context-v/explorations/ChromaDB-as-Context-Improvement-Across-Everything-Everyone.md` —
  the exploration that produced the Chroma integration
- `../context-v-corpus/README.md` — the corpus, the four collections, the ingest scripts
- `context-v/agent-skills/search-lossless-corpus/SKILL.md` — full querying discipline (via the parent skills tree)

<!-- lossless:browser-drive:start -->
## Browser-drive verification (Playwright MCP + Claude Chrome)

Agents verify UI work by driving a real browser BEFORE asking a human to walk the surface. Two tiers:

- **Codified (default): Playwright MCP** — navigate/click/type, accessibility-tree snapshots, DOM assertions; headless-capable, runs unwatched. Wire it per repo at **project scope** (config lands in the committed `.mcp.json`):

  ```bash
  claude mcp add -s project playwright -- npx @playwright/mcp@latest
  ```

- **Interactive: `claude --chrome`** (or `/chrome` → enable by default) — Claude drives the operator's real Chrome while they watch; screenshots/GIFs + console and network logs.

Rules that make it safe and cheap:

1. Newly added MCP servers load in the **next** session, not the current one (same rule as skills symlinks).
2. Prefer **accessibility snapshots over screenshots** — raster is token-expensive; use it only for visual questions (layout, theme).
3. Browser-driven **reads are unrestricted; writes only against the repo's designated safe target** — never mint test entities in shared/canonical data.
4. The drive's click-path is **named in the phase plan before implementation**; a drive that lives only in a session transcript is not codified.
5. A browser drive proves the buttons **work**; the human walk-through still judges whether the surface is **usable**. It augments the human rung, never replaces it.

Full pattern: `context-v/blueprints/Browser-Drive-Verification-For-Agent-Sessions.md` at the anchor monorepo root (rollout draft: `context-v-corpus/context-v/blueprints/` at the anchor root). Loop integration proven in `ai-labs/augment-it/context-v/loops/`.
<!-- lossless:browser-drive:end -->

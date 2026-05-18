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
| `augment-it/` | newly added; check its own README |
| `dididecks-ai/` | slide-deck operating system for due-diligence-grade content |
| `memopop-ai/` | multi-agent investment-memo orchestration (LangGraph) |
| `context-vigilance-kit/` | operationalizes the context-vigilance practice across the whole Lossless tree; **the only place the local Chroma corpus and MCP server live** |
| `studies/` | pinned upstream repos as reference collections (memory-layers, open-specs, etc.); read upstream code, do not paraphrase from training data |
| `splash/` | GitHub-Pages-deployed showcase for the tree |
| `packages/` | packages graduating toward independent publication |
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

## Branch tier model

Three tiers, mirrored from the root: **`development` → `main` → `master`**.

Parent on tier X → all submodules on tier X. See the root `CLAUDE.md`
and `context-v/skills/pseudomonorepos/references/branch-alignment.md` for
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

Ingestion lives under `ai-labs/context-vigilance-kit/scripts/` (`ingest-all.sh` is the master). Do not re-ingest as a side effect of unrelated work — the user runs it deliberately.

## See also

- `../CLAUDE.md` — root, the HARD STOP relocation rules and tree-wide guidance
- `context-v/explorations/ChromaDB-as-Context-Improvement-Across-Everything-Everyone.md` —
  the exploration that produced the Chroma integration
- `context-vigilance-kit/README.md` — the kit, the four collections, the ingest scripts
- `context-v/skills/search-lossless-corpus/SKILL.md` — full querying discipline (via the parent skills tree)

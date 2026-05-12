# ai-labs

> The Lossless Group's pseudomonorepo for AI experiments graduating into real products. It started as a folder full of API examples and a marimo notebook or two — a "lab for generating tons of content with AI" — and most of that early work has already graduated into real homes elsewhere. Today this repo is the parent that holds our *active* AI product builds, pinned reference studies, and the cross-cutting context that lets agents pick up where the last session left off.

The convention: anything in this tree is either **becoming a product**, **studying prior art** for a domain we'll build in, or **scratch surface** for the next experiment. If something graduates past those modes, it leaves — usually as its own repo, sometimes re-entering as a submodule.

## Active product development

> We aim to build in public and copyleft open-source most of what we do.  Always looking for collaborators, though we tend to go deep on a few things at a time so only the nerdy need reach out.

### MemoPop AI — investment-memo platform for VCs
A true monorepo: Tauri 2 desktop app, Astro marketing site, eventual SvelteKit hosted web app, and a Python multi-agent backend (LangGraph, 30+ agents) exposed via FastAPI. The backend — formerly the standalone `investment-memo-orchestrator` repo — now lives nested at `memopop-ai/apps/memopop-orchestrator/` and the Tauri shell drives it over `localhost:8765`.

→ `memopop-ai/` · [lossless-group/memopop-ai](https://github.com/lossless-group/memopop-ai)

### DidiDecks AI — code-first slide-deck OS for Due Diligence
A code-first slide-deck operating system for receiving-side Due-Diligence-grade content. Specs + splash + two driving client engagements (`calmstorm-decks`, `reach-edu-hub`) carried as nested submodules under `dididecks-ai/client-sites/`. Early architecture; no core implementation yet.

→ `dididecks-ai/` · [lossless-group/dididecks-ai](https://github.com/lossless-group/dididecks-ai)

### Context Vigilance Kit — the corpus tooling
Walks every `context-v/` directory across the Lossless tree (and beyond), buckets files by depth-of-completion, and prepares them for ingestion into a ChromaDB-backed corpus. 583 files inventoried in v0; brand site at [contextvigilance.com](https://contextvigilance.com) (forthcoming). Will graduate to its own top-level repo when v0.1 is ready to leave the nest.

→ `context-vigilance-kit/` · [lossless-group/context-vigilance-kit](https://github.com/lossless-group/context-vigilance-kit)

## Studies — pinned reading lists, not docs

A *study* is a curated reference collection — a directory of upstream specs, prior art, and reference implementations pinned as nested submodules. Each study is scoped to one domain question. Studies don't ship anything; they put real upstream code one `cd` away while we're deciding how to build in that domain. The discipline (read from pinned upstream, don't paraphrase from training data) is enforced session-by-session by `studies/CLAUDE.md`.

| Study | Question |
|---|---|
| [`open-specs-and-standards`](./studies/open-specs-and-standards) | Which file conventions have converged for human + agent cooperation? (`AGENTS.md`, `SKILL.md`, `llms.txt`, `DESIGN.md`, MCP, A2A, OpenSpec, Spec Kit, 12-Factor Agents, Frictionless Data, …) |
| [`memory-layers-for-agents`](./studies/memory-layers-for-agents) | How do production memory systems decide what to remember, when to update, and at what scope? (Mem0, neo, StateBench, …) |
| [`data-analytics-specifications-and-standards`](./studies/data-analytics-specifications-and-standards) | Which open, machine-validatable specs converge across the analytics stack? (Data Package, Parquet, Arrow, Vega-Lite, Plot, ggsql) |

Full concept and add-a-new-study workflow: [`studies/README.md`](./studies/README.md) · [`studies/CLAUDE.md`](./studies/CLAUDE.md).

## Where prior work landed

Earlier strands of work that started in this tree and now live in their own homes (worth knowing about before you go looking for them here):

- **Content generation discipline → [Content Farm repo](https://github.com/lossless-group/content-farm).** The "generate marketing-ready, academic-integrity content at volume" toolkit adopted Obsidian wholesale and grew into a multi-plugin suite (Cite Wide, Image Gin, Perplexed, LMStud Yo, Metafetch) for professional-grade content development and management. Splash: [`lossless-group.github.io/content-farm/`](https://lossless-group.github.io/content-farm/).
- **Image generation → [`image-gin`](https://github.com/lossless-group/image-gin) + [`lossless-skills/generate-consistent-og-images`](https://github.com/lossless-group/lossless-skills/tree/main/generate-consistent-og-images).** The Recraft / Freepik / Ideogram experiments here graduated two ways. For Obsidian users: `image-gin` is the plugin home (AI image generators for contextual images, illustrations, and stock-photo selection — starting with Ideogram and Recraft). For agent workflows: the `generate-consistent-og-images` skill covers OG banners, portraits, squares, and tall WhatsApp/iMessage cards with locked design tokens so the resulting images form a coherent visual family across every Lossless site.
- **Investment-memo orchestrator → MemoPop's backend.** The Python LangGraph orchestrator was a sibling submodule here for a stretch; today it's the FastAPI backend folded into the MemoPop AI true monorepo at `memopop-ai/apps/memopop-orchestrator/`. The Tauri shell drives it over `localhost:8765`.  Backend LangChain and Python API still available at: [`investment-memo-orchestrator`](https://github.com/lossless-group/investment-memo-orchestrator)
- **Per-provider scripts + API calls → [Lossless Skills](https://github.com/lossless-group/lossless-skills).** Many of the patterns now sitting under `apis/`, `scripts/`, and `utils/` are being re-implemented as agent-skills following the Anthropic agent-skills standard. Expect the sandbox here to keep shrinking as more of it lifts into reusable skills.

## Topology

```
ai-labs/                              # this repo — the pseudomonorepo
├── memopop-ai/                       # submodule · active product
├── dididecks-ai/                     # submodule · active product (early)
├── context-vigilance-kit/            # submodule · experiment becoming a product
├── studies/                          # pinned reading lists
│   ├── open-specs-and-standards/     #   submodule
│   ├── memory-layers-for-agents/     #   submodule
│   └── data-analytics-specifications-and-standards/   # submodule
├── packages/                         # vendored / upstream AI tooling
│   ├── Perplexica/                   #   submodule · AI search
│   └── mermaid-js-ai-agent/          #   submodule · diagram agent
├── apis/                             # scratch surface — API examples per provider
├── scripts/                          # one-shot CLI helpers
├── utils/                            # tiny shared TS/Python utilities
├── context-v/                        # parent-level specs / explorations / plans / reminders
├── changelog/                        # narrative ship notes for structural changes
└── .mcp.json                         # project-scope MCP servers (Chroma, etc.)
```

Every submodule above carries its own `README.md`, its own `context-v/`, its own `changelog/`, and is tracked from `ai-labs` via `.gitmodules`. Each child owns its internals; this repo owns *the space between children*.

## Packages — vendored AI tooling

Forks or pins of upstream tools we use directly:

- **[Perplexica](./packages/Perplexica)** — local-first AI search ([lossless-group/Perplexica--lossless](https://github.com/lossless-group/Perplexica--lossless), fork of [ItzCrazyKns/Perplexica](https://github.com/ItzCrazyKns/Perplexica)).
- **[mermaid-js-ai-agent](./packages/mermaid-js-ai-agent)** — agentic Mermaid diagram generation ([disler/mermaid-js-ai-agent](https://github.com/disler/mermaid-js-ai-agent)).

## Sandbox — `apis/`, `scripts/`, `utils/`

The original scratch surface that gave this repo its name. Per-provider snippets, request/response samples, and one-shot scripts that don't justify a package yet.

`apis/` carries directories for: `anthropic`, `freepik`, `gnews`, `groq`, `imagekit`, `jina`, `kroki`, `msty`, `obsidian`, `open-ai`, `open-graph-io`, `perplexica`, `perplexity`, `recraft`. Image generation (Recraft, Freepik), embedding/search (Jina, Perplexity), local LLM (MSTY, Ollama), CDN (ImageKit), open-graph (OpenGraph.io).

`scripts/` carries CLI helpers — Jina site-fetchers, YouTube-to-Fabric-content generators, miscellaneous content-pipeline glue. `utils/` is tiny shared TS — currently just a yaml-frontmatter helper used by several scripts.

When a sandbox experiment grows past "snippet," it either moves into one of the product submodules, earns its own repo, or — increasingly — gets re-shaped as an agent-skill in [`lossless-skills`](https://github.com/lossless-group/lossless-skills). The sandbox here is shrinking on purpose as that migration proceeds.

## Working in ai-labs

### Clone

```bash
git clone --recurse-submodules git@github.com:lossless-group/ai-labs.git
# or, if already cloned:
git submodule update --init --recursive
```

Some submodules carry their own nested submodules (especially the studies). `--recursive` is required to pull all the way through.

### Python environment

```bash
python3 -m venv .venv
source .venv/bin/activate
uv pip install -r python-requirements.txt
```

We default to [`uv`](https://github.com/astral-sh/uv) over plain `pip` (see [`context-v/reminders/Preferred-Stack.md`](./context-v/reminders/Preferred-Stack.md)). Plain `pip` still works as a fallback if you don't have `uv` installed.

### Node environment

```bash
pnpm install                          # at repo root for shared tooling
# splash sites install independently with --ignore-workspace
```

### MCP servers

`.mcp.json` at project scope wires a local ChromaDB MCP server into Claude Code so the context-vigilance corpus is queryable from any session opened inside this tree. Project-scope (not local-scope) is deliberate — config travels with the repo. See [`context-v/explorations/ChromaDB-as-Context-Improvement-Across-Everything-Everyone.md`](./context-v/explorations/ChromaDB-as-Context-Improvement-Across-Everything-Everyone.md).

### Local AI as the default

We bias toward running models locally before reaching for hosted APIs:

- **[MSTY](https://msty.app/)** — multi-model local LLM chat.
- **[Ollama](https://ollama.com/)** — local model runner.

### Bring your own API keys

For the hosted services the sandbox calls out to, drop credentials in a local `.env` (gitignored):

| Service | Used for |
|---|---|
| [Anthropic](https://www.anthropic.com/) | text + agent generation (Claude) |
| [OpenAI](https://platform.openai.com/) | text + image generation |
| [Groq](https://groq.com/) | fast inference |
| [Jina](https://jina.ai/) | search, embeddings, deep-search |
| [Recraft](https://www.recraft.ai/) | image generation |
| [Freepik](https://www.freepik.com/) | stock + generated imagery |
| [ImageKit](https://imagekit.io/) | image CDN |
| [OpenGraph.io](https://opengraph.io/) | OG image fetch |
| [Firecrawl](https://firecrawl.dev/) | structured-output web crawl |

### Data privacy

For any analysis on NDA / FrienDA / confidential material, drop it in a `private-data/` directory (already gitignored). Default posture is build-in-public; the gitignore is the boundary that keeps that posture safe.

## Context-v and changelog discipline

This repo follows the [Lossless context-vigilance practice](https://contextvigilance.com): every project carries a `context-v/` (specs · explorations · plans · reminders · ...) and a sibling `changelog/`. The parent owns the cross-cutting documents that span more than one child:

- **`context-v/specs/`** — durable design contracts (currently empty here; sibling-spec home is each child's own `context-v/specs/`).
- **`context-v/explorations/`** — `ChromaDB-as-Context-Improvement…`, `Collate-Context-Files-into-Context-Vigilance…`, `When-Claud-Code-and-When-Pi`.
- **`context-v/plans/`** — Chroma local UI, Chroma ingest pipeline, custom Chroma MCP, Context Vigilance splash narrative.
- **`context-v/reminders/`** — `Preferred-Stack.md` (uv-over-pip and friends).
- **`changelog/`** — narrative ship notes about structural changes across the pseudomonorepo (e.g. `2026-05-08_01.md` covers the studies pass, the investment-memo monorepo correction, and the Context Vigilance Kit seed).

When working inside a submodule, **don't auto-bump the parent gitlink here** — parent pseudomonorepos get tidied deliberately, not opportunistically. The corresponding submodule-side commit + push is the part you do; the parent bump waits.

## Status

Active. The repo's center of gravity is shifting from "AI labs as in a notebook" to "AI labs as the pseudomonorepo where Lossless products grow up." Expect new submodules to keep arriving on this same shape: a product idea → context-v specs at this level → its own repo with `branch = development` → re-attached as a submodule → its splash and changelog rolling up here.

## See also

- [The Lossless Group](https://lossless.group)
- [`lossless-monorepo`](https://github.com/lossless-group/lossless-monorepo) — the grandparent: habits (`context-v/habits/`) and the LFM markdown package live up there.
- [`lossless-skills`](https://github.com/lossless-group/lossless-skills) — the agent-skills home where many ai-labs script + API patterns are being re-shaped.
- [`content-farm`](https://github.com/lossless-group/content-farm) — the content-generation discipline that grew out of this tree, now an Obsidian plugin suite. Splash: [lossless-group.github.io/content-farm](https://lossless-group.github.io/content-farm/).
- [Context Vigilance](https://contextvigilance.com) — the discipline this repo's `context-v/` is an instance of.

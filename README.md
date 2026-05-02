# A lab space for generating tons of content with AI
Will be a mess, and it will be fun.

# Setup
Make sure you have `python3` and `pip` installed. 
Make sure you have `venv` installed. 
Make sure you have `uv` installed.

# Activate
```bash
python3 -m venv
source .venv/bin/activate
pipx install uv
pip install -r python-requirements.txt
```

# Default to Local AI
Download:
1. [MSTY](https://github.com/mysty-ai/mysty)
2. [Ollama](https://github.com/ollama/ollama)

# YOU WILL NEED YOUR OWN API KEYS for remote LLM services, put in the .env file

1. [Recraft](https://www.recraft.ai/) for **image generation**.
2. [OpenAI](https://platform.openai.com/) for **text generation**.
3. [Jina](https://jina.ai/) for **AI search**.
4. [Anthropic](https://www.anthropic.com/) for **AI search**.
5. [Groq](https://www.groq.com/) for **AI search**.
6. [Imagekit](https://imagekit.io/) for **image storage**.

## Projects

### Investment Memo Orchestrator
A Python-based CLI tool for generating investment memos with AI agents. Uses LangGraph for orchestration.
Submodule: `investment-memo-orchestrator/` → [lossless-group/investment-memo-orchestrator](https://github.com/lossless-group/investment-memo-orchestrator)

### MemoPop AI
AI-powered investment memo generation platform. A Bun monorepo with an Astro marketing site, SvelteKit web app, and Python agent orchestrator.
Submodule: `memopop-ai/` → [lossless-group/memopop-ai](https://github.com/lossless-group/memopop-ai)

## Studies

### Open Specs & Standards
A reading collection of open specifications and conventions for human + AI agent cooperation through files — `AGENTS.md`, `SKILL.md`, `llms.txt`, `DESIGN.md`, MCP, A2A, OpenSpec, Spec Kit, 12-Factor Agents, and Frictionless Data. Each upstream is pinned as a nested submodule so we can study real implementations side by side.

**Why:** every one of our agentic workflows ends up needing a file convention — for context, design tokens, skills, or data shape. Rather than reinvent, we want to learn what's already converging.

**Why it's cool:** it's a single repo where the "specs" are the actual upstream code, not paraphrased summaries. You can `cd` into any of them and grep their build pipeline, parsers, or schema generators.

Submodule: `studies/open-specs-and-standards/` → [lossless-group/study-open-specs-and-standards](https://github.com/lossless-group/study-open-specs-and-standards)

> Note: this submodule has its own nested submodules. To pull all the way through, clone with `git clone --recurse-submodules` or run `git submodule update --init --recursive` after cloning.

## Optional Tooling
Packages Include

### Data Analysis Notebooks
1. [Marimo](https://marimo.ai/) for **Data Analysis Notebooks**.

#### On Data Privacy and NDA/FrienDA.
If you're doing data analysis with Marimo or any other tool, make sure you create a `private-data` directory, which is already listed in the `.gitignore` file. This is to ensure that you don't commit any private data to the repository, which we want to default to build-in-public philsophy and practice.

### AI Search with Local LLMs
1. [Perplexica](https://github.com/ItzCrazyKns/Perplexica) for **AI Search**.
   Submodule: `packages/Perplexica/` → [lossless-group/Perplexica--lossless](https://github.com/lossless-group/Perplexica--lossless)

### Diagram AI Agent
2. [Mermaid Diagram AI Agent](https://github.com/disler/mermaid-js-ai-agent?tab=readme-ov-file)
   Submodule: `packages/mermaid-js-ai-agent/`

## On Open Graph Images
I use [OpenGraph.io](https://opengraph.io/) to generate Open Graph images for the tooling dir. I have been in the process of moving it from script based to Observer/Watcher based, which is in the `tidyverse` submdoule.

# To Run Python Scripts
`source .venv/bin/activate`
`python3 ai-labs/apis/recraft/generate-banner-images-recraft.py`

# To Run Node Scripts
`node ai-labs/apis/imagekit/convertImageToImageKitUrl.js`

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

## Optional Tooling
Packages Include 

### Data Analysis Notebooks
1. [Marimo](https://marimo.ai/) for **Data Analysis Notebooks**.

#### On Data Privacy and NDA/FrienDA.  
If you're doing data analysis with Marimo or any other tool, make sure you create a `private-data` directory, which is already listed in the `.gitignore` file. This is to ensure that you don't commit any private data to the repository, which we want to default to build-in-public philsophy and practice.

### AI Search with Local LLMs
1. [Perplexica](https://github.com/ItzCrazyKns/Perplexica) for **AI Search**.

### Diagram AI Agent
2. [Mermaid Diagram AI Agent](https://github.com/disler/mermaid-js-ai-agent?tab=readme-ov-file)

## On Open Graph Images
I use [OpenGraph.io](https://opengraph.io/) to generate Open Graph images for the tooling dir. I have been in the process of moving it from script based to Observer/Watcher based, which is in the `tidyverse` submdoule.

# To Run Python Scripts
`source .venv/bin/activate`
`python3 ai-labs/apis/recraft/generate-banner-images-recraft.py`

# To Run Node Scripts
`node ai-labs/apis/imagekit/convertImageToImageKitUrl.js`

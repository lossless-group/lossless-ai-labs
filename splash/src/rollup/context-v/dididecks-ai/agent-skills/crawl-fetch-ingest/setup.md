---
name: crawl-fetch-ingest-setup
description: One-time setup for the crawl-fetch-ingest skill — secrets file, MCP servers, helper scripts
from: "dididecks-ai"
from_path: "context-v/agent-skills/crawl-fetch-ingest/setup.md"
---
# Setup — one-time per machine

## 1. API keys via `~/.secrets`

This skill never sees a key in source. Keys live in `~/.secrets` (gitignored, not in any dotfiles repo) and are inherited by Claude Code from the shell at startup.

**`~/.secrets` (chmod 600):**

```bash
# Crawl, fetch, ingest skill
export FIRECRAWL_API_KEY="fc_..."
export TAVILY_API_KEY="tvly-..."
export OPENGRAPH_IO_API_KEY="..."
export JINA_API_KEY="jina_..."     # optional, raises Jina Reader rate limits

# Brand-asset cascade (logo hunt)
export BRANDFETCH_API_KEY="..."    # optional but recommended; free tier 1k req/mo
export GOOGLE_CSE_KEY="..."        # optional, last-resort SVG search via fileType=svg
export GOOGLE_CSE_CX="..."         # optional, CSE engine ID configured for image search
```

**`~/.zshenv` adds one line:**

```bash
[ -f ~/.secrets ] && source ~/.secrets
```

After editing, **restart Claude Code** so MCP server subprocesses inherit the new env vars. Existing sessions started before the keys were added will not see them.

## 2. MCP servers

Two MCP servers are added at user scope (apply to every project):

```bash
claude mcp add -s user firecrawl -- npx -y firecrawl-mcp
claude mcp add -s user tavily -- npx -y tavily-mcp
```

Both servers read their API keys from `process.env` (inherited from your shell), so no `-e KEY=value` flag is needed when `~/.secrets` is sourced.

Verify:

```bash
claude mcp list
# Should show: firecrawl ✓ Connected, tavily ✓ Connected
```

If a server fails to connect with an auth error, the env var isn't reaching it — check that `~/.zshenv` sources `~/.secrets` and that you've restarted Claude Code.

## 3. Helper scripts

`scripts/og-fetch.ts` (OpenGraph.io) and `scripts/jina-reader.ts` (Jina Reader) are run via `pnpx tsx`. The shebang handles this automatically:

```bash
chmod +x scripts/og-fetch.ts scripts/jina-reader.ts
./scripts/og-fetch.ts https://stripe.com
./scripts/jina-reader.ts https://www.sequoiacap.com/our-companies/
```

`tsx` is fetched on demand by `pnpx`; no global install required.

## 4. Local CLIs for asset processing

### ImageMagick (required for `scripts/bg-strip.sh` tier 1)

```bash
brew install imagemagick
magick -version | head -1   # should print: Version: ImageMagick 7.x ...
```

Tier 1 of the background-strip cascade is pure ImageMagick — flood-fill from each corner with the sampled corner color (handles white *and* arbitrary brand-color backgrounds). Deterministic, fast, no model deps.

### rembg (optional, for `scripts/bg-strip.sh` tier 2)

```bash
brew install pipx           # if not already installed
pipx install rembg[cli]
rembg --help                # smoke test; first real call downloads ~170MB model
```

Tier 2 of the background-strip cascade — U²-Net segmentation model, runs locally, MIT-licensed. Handles non-uniform backgrounds, drop shadows, soft edges. **Skip this install if disk space matters; the bg-strip script gracefully degrades when `rembg` is missing** (logs the case as `rembg-unavailable` in the company's `notes`).

## 5. Cache directory

The skill writes raw API responses to:

```
~/.claude/skills/crawl-fetch-ingest/cache/{firm-slug}/
  firecrawl/<hash>.json
  tavily/<hash>.json
  jina/<hash>.md
  og/<hash>.json
```

Auto-created on first use. Hash is `sha1(input).slice(0, 16)` where `input` is the URL (Firecrawl, Jina, OG) or the query string (Tavily). To force re-fetch for a firm: `rm -rf ~/.claude/skills/crawl-fetch-ingest/cache/{firm-slug}/`.

## 6. Symlink (already done at scaffold time)

```bash
ln -s /Users/mpstaton/code/lossless-monorepo/context-v/skills/crawl-fetch-ingest \
      ~/.claude/skills/crawl-fetch-ingest
```

If the symlink is missing, recreate it. The skill source of truth is the `context-v/skills/` repo; `~/.claude/skills/` is just where Claude looks.

## 7. New machine checklist

1. Clone `context-v` repo (with submodules)
2. Create `~/.secrets` with the env vars (chmod 600)
3. Add `[ -f ~/.secrets ] && source ~/.secrets` to `~/.zshenv`
4. Run the two `claude mcp add` commands above
5. `brew install imagemagick`
6. (Optional but recommended) `brew install pipx && pipx install rembg[cli]`
7. Symlink the skill into `~/.claude/skills/`
8. Restart Claude Code
9. Verify with `claude mcp list` and `magick -version`

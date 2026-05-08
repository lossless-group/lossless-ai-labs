# Pi vs. Claude Code

Pi (`@mariozechner/pi-coding-agent`) is a minimal, aggressively-extensible terminal coding harness — an alternative to Claude Code. Here's how they relate.

## Similarities

- Both are terminal-based coding agents you `cd` into a project and talk to.
- Both load **`AGENTS.md` / `CLAUDE.md`** context files (pi reads either) from `~`, parent dirs, and cwd.
- Both can use **Claude models** — pi works with your Anthropic Claude Pro/Max subscription via `/login`, or `ANTHROPIC_API_KEY`.
- Both ship with the same primitive toolset: `read`, `write`, `edit`, `bash` (pi adds `grep`, `find`, `ls`).
- Both support **Agent Skills** (the standard from agentskills.io).

## Key Differences (pi's philosophy)

Pi deliberately *omits* features Claude Code bakes in, expecting you to add them via extensions or pi packages instead:

| Feature | Claude Code | Pi |
|---|---|---|
| Sub-agents | Built-in | Build via extension, or use tmux |
| Plan mode | Built-in | Write to a file, or extension |
| Permission popups | Built-in | Extension, or run in container |
| Built-in to-dos | Yes | Use `TODO.md` |
| Background bash | Yes | Use tmux |
| MCP | Yes | Skipped — use CLI tools w/ READMEs (Skills), or extension |
| Provider lock-in | Anthropic-only | 25+ providers (OpenAI, Gemini, Bedrock, OpenRouter, local, etc.) |
| Sessions | Linear | Tree-structured (`/tree`, `/fork`, `/clone`, branching) |
| Customization | Limited | TS extensions, themes, prompt templates, sharable npm/git packages |
| RPC / SDK | No | Yes (`--mode rpc`, full TS SDK) |

## Practical "switching from Claude Code" tips

1. **Install:** `npm install -g @mariozechner/pi-coding-agent`
2. **Use your Claude subscription:** run `pi`, then `/login` → Anthropic.
3. **Your `CLAUDE.md` files just work** — pi reads them automatically.
4. **Pick the Claude model:** `Ctrl+L` (or `/model`) to switch between Sonnet/Opus/Haiku, `Shift+Tab` cycles thinking levels.
5. **Branching instead of "undo":** use `/tree` (Esc Esc) to jump back to any prior point — much more powerful than Claude Code's linear history.
6. **Add what you miss:** if you want Claude Code-style plan mode, sub-agents, or permission gates, install a pi-package (`pi install npm:...`) or write a small TS extension. The README explicitly says you can "make pi look like Claude Code" via extensions.

## When to pick which

- **Claude Code:** want batteries-included, Anthropic-only, opinionated workflow.
- **Pi:** want a minimal core, multi-provider freedom, and full control to shape the agent (extensions, skills, RPC/SDK embedding, OSS session sharing).

For deeper comparison, see the philosophy section in the pi README and the linked [blog post](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/).

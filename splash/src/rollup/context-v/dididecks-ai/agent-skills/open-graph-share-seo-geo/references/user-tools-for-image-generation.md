---
from: "dididecks-ai"
from_path: "context-v/agent-skills/open-graph-share-seo-geo/references/user-tools-for-image-generation.md"
---

# User Tools — Image Generation

The user is likely to have access to at least one image-generation API. Use this file as the source of truth for **which tool the user currently prefers** and **how an agent should call it**.

This file pairs with the OG / SEO / GEO skill because banner images, plugin tiles, blog hero images, and fundraise-deck illustrations are usually *generated* before they're optimized. If you (the agent) need to make a new banner from scratch, start here.

## When to use this file

- The user says "make a banner / hero / tile / OG image"
- A new plugin page or splash route needs an OG default
- Fundraise decks need slide-specific imagery
- Any time you would otherwise reach for stock photos or clip art

## Swap-out block — current configuration

> **For users:** edit the YAML inside this block when you switch tools, rotate keys, or change scope. The HTML comment markers are how agents locate this block reliably — leave them in.
>
> **For agents:** treat this as the source of truth. Read the block, confirm the tool is reachable, then call it. If `access_method: mcp`, look for the named MCP tools via `ToolSearch` first.

<!-- BEGIN AGENT-CONFIG -->
```yaml
preferred_tool: ideogram
access_method: mcp                      # mcp | sdk | rest | gui-only
mcp_package: "@takeshijuan/ideogram-mcp-server"
env_var: IDEOGRAM_API_KEY
scope: user                             # mcp scope flag passed to `claude mcp add`
relaunch_after_register: true
shared_with:
  - "content-farm/plugin-modules/image-gin"  # same API key
docs: https://developer.ideogram.ai/
strengths:
  - high-quality text rendering inside images (rare among image gens)
  - strong style consistency across multi-image sets
  - reasonable cost per generation
default_dimensions:
  og_banner: "1200x630"                 # see SKILL.md rule 6
  plugin_tile: "1024x1024"
  hero: "1600x900"
default_format_request: jpeg            # match SKILL.md rule 2 for OG; webp/png fine for body
notes: |
  - The full install gotchas live in the user's memory file
    `reference_ideogram_mcp.md` — read that BEFORE attempting to register
    or troubleshoot the MCP. Do not re-derive the install steps.
  - Same Ideogram API key as the image-gin Obsidian plugin.
fallbacks:                              # if Ideogram is unreachable / rate-limited
  - tool: dall-e-3
    access_method: sdk
    notes: via OpenAI SDK if user has OPENAI_API_KEY set
  - tool: flux-pro
    access_method: rest
    notes: via Replicate or fal.ai if user has those keys set
```
<!-- END AGENT-CONFIG -->

## How agents should use this

1. **Read the swap-out block above.** That's authoritative — never use a different tool just because it's available.
2. **If `access_method: mcp`,** look for MCP tools matching the package name via `ToolSearch` (e.g. `ToolSearch query: "ideogram"`). If they're not loaded, the MCP server may not be registered or the harness needs a relaunch — point the user at `reference_ideogram_mcp.md` rather than guessing the install command.
3. **Generate at the dimensions in `default_dimensions`** unless the user asks otherwise. For OG banners specifically, `1200x630` is non-negotiable (see `SKILL.md` rule 6).
4. **Request `default_format_request`** (or the closest the tool supports). For OG banners destined for iMessage / WhatsApp, JPEG. For body images, WebP / AVIF is fine.
5. **Save the output** to the project's image-gin pipeline or a CDN (ImageKit, per `SKILL.md` rule 1). Never commit raw generations to `/public` as the long-term home — they belong on a CDN.
6. **Caption it sensibly.** The agent picking a generation prompt should also pick a sensible `og:image:alt` value. Keep them in lockstep.

## Why Ideogram (current preference)

Stated by the user 2026-05-05. The standout reason: **text rendering inside the image is reliably correct.** Most image-gen tools (DALL-E 3, Stable Diffusion lineage, Midjourney) hallucinate or smear in-image text, which makes them unsuitable for banners that include the product name or a tagline. Ideogram lands the text. For a content-farm banner that says "Content-Farm — Obsidian community plugins", that's the difference between usable and unusable.

Secondary reasons:
- Style consistency across a generated set (useful when banners across plugins should feel like a family).
- API ergonomics are straightforward; the MCP wrapper is one of several solid options.
- Per-generation cost is reasonable for the splash/plugin-page volume.

## Other options the user may have access to

These are not currently preferred but are worth knowing as fallbacks (already in the swap-out block):

| Tool                | Access pattern             | Best for                                     |
| ------------------- | -------------------------- | -------------------------------------------- |
| DALL-E 3            | OpenAI SDK                 | Quick generations when Ideogram is rate-limited; weak text |
| Flux Pro / Schnell  | Replicate / fal.ai REST    | Photorealistic; good prompt adherence; weak text |
| Stable Diffusion XL | Replicate / local ComfyUI  | Tunable, free if local; needs prompt eng     |
| Midjourney          | Discord-only (no API)      | Manual creative; not agent-callable          |

When promoting a new tool to `preferred_tool`, edit the YAML block above. That's the only place the change needs to happen — agents read from there.

## See also

- `../SKILL.md` — OG/share-preview rules; rule 1 (CDN hosting), rule 2 (JPEG), rule 6 (1200×630 dimensions)
- `seo-best-practices.md` — Image SEO section, including `ffmpeg` recipes for converting generations between formats
- User memory `reference_ideogram_mcp.md` — the canonical Ideogram MCP install command and the five gotchas I have already burned cycles on

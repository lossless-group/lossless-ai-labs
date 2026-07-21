---
from: "dididecks-ai"
from_path: "context-v/agent-skills/open-graph-share-seo-geo/references/unfurler-matrix.md"
---

# Unfurler Matrix

Per-client behavior for the channels The Lossless Group cares about, ordered by how much we share through each. Use this when you need to debug a specific client or pick which one to test in first.

## iMessage (Apple)

- **Cache TTL:** Days, per exact URL. No public force-refresh.
- **Image formats:** JPEG ✓, PNG ✓, WebP ✗ (silently dropped on most iOS/macOS versions through 17.x).
- **Image size cap:** ~5 MB; in practice keep ≤ 500 KB or it'll skip.
- **Required tags:** `og:title`, `og:image`, `og:description`. Will fall back to `<title>` and `<meta name="description">` if OG missing.
- **Quirks:**
  - `og:image:secure_url` consulted on older iOS; include it.
  - Animated WebP / GIF: GIF works (first frame), WebP does not.
  - Will *not* render image if `Content-Length` missing on the image response.
- **Force re-unfurl:** Append `?v=N` to the URL.
- **Debug:** No native tool. Send to a second device.

## WhatsApp

- **Cache TTL:** ~30 days per URL. No public force-refresh.
- **Image formats:** JPEG ✓, PNG ✓, WebP ✗ (intermittent).
- **Image size cap:** Hard ~600 KB ceiling for the preview thumbnail; larger images are skipped, not downscaled.
- **Required tags:** `og:title`, `og:image`. Description optional but recommended.
- **Quirks:**
  - Unfurls only the *first* link in a message.
  - Group chats sometimes show the preview to the sender but not all recipients — usually the recipient's WhatsApp had not crawled the URL yet.
  - Aggressive timeout (~5 s); slow origins fail silently.
- **Force re-unfurl:** Append `?v=N`. Or use a fresh URL.
- **Debug:** No native tool.

## Slack

- **Cache TTL:** ~22 hours per URL.
- **Image formats:** JPEG ✓, PNG ✓, WebP ✓ (since 2022, generally fine), GIF ✓.
- **Image size cap:** ~5 MB.
- **Required tags:** `og:title`, `og:image`, `og:description`. Falls back to oEmbed if present.
- **Quirks:**
  - Strict about `og:image:type` matching the bytes — mismatch is one of the few clients that visibly drops the preview.
  - Honors `og:image:width` / `:height` to reserve layout — incorrect values produce visible jank.
  - Will fetch via Slackbot user-agent — ensure this is not blocked by your CDN's bot rules.
- **Force re-unfurl:** Type the URL again with a different fragment (`#x`) or `?v=N`.
- **Debug:** Paste the URL in any channel — preview shows immediately or not at all.

## Discord

- **Cache TTL:** ~24 hours per URL.
- **Image formats:** JPEG ✓, PNG ✓, WebP ✓, GIF ✓ (animated preserved).
- **Image size cap:** ~8 MB for embeds.
- **Required tags:** `og:title`, `og:image`. Discord builds rich embeds around `og:type=article` if `article:author` and `article:published_time` are present.
- **Quirks:**
  - User-agent: `Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)`. Some firewalls block this — whitelist if your image 404s in Discord but works elsewhere.
  - `og:video` produces an inline video player; only set if you actually want that.
- **Force re-unfurl:** Append `?v=N` or wait 24 h.
- **Debug:** No native tool.

## LinkedIn

- **Cache TTL:** ~7 days per URL.
- **Image formats:** JPEG ✓, PNG ✓, WebP ✓.
- **Image size cap:** 5 MB; minimum 1200 × 627 for the large card.
- **Required tags:** `og:title`, `og:image`, `og:description`, `og:url`.
- **Quirks:**
  - Aspect ratio strict: 1.91:1 (1200 × 627–630). Outside that, falls back to small-card layout.
  - Will not re-fetch a URL it has already cached unless forced.
- **Force re-unfurl:** [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) — paste URL → "Inspect" forces re-scrape.
- **Debug:** Post Inspector shows what LinkedIn sees.

## X / Twitter

- **Cache TTL:** ~7 days per URL.
- **Image formats:** JPEG ✓, PNG ✓, WebP ✓ (since 2023).
- **Image size cap:** 5 MB.
- **Required tags:** `twitter:card`, `twitter:title`, `twitter:image`. Falls back to OG tags if Twitter-specific missing.
- **Quirks:**
  - `twitter:card=summary_large_image` requires image ≥ 300 × 157 and ≤ 5 MB at aspect ratio 2:1 (so 1200 × 600 or 1200 × 630 both work).
  - The standalone Twitter Card Validator is gone — only inline-preview testing on x.com works now.
- **Force re-unfurl:** Append `?v=N`.
- **Debug:** Compose a tweet (do not send) — preview renders below the textarea.

## Facebook

- **Cache TTL:** ~30 days per URL.
- **Image formats:** JPEG ✓, PNG ✓, WebP ✓.
- **Image size cap:** 8 MB; minimum 200 × 200, recommended 1200 × 630.
- **Required tags:** `og:title`, `og:image`, `og:url`, `fb:app_id` (optional but recommended for ownership).
- **Force re-unfurl:** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — paste URL → "Scrape Again".
- **Debug:** Sharing Debugger shows the canonical scrape result and any warnings.

## Generative engines (GEO)

These don't "unfurl" but they consume the same metadata when surfacing your page in answers.

| Engine            | Crawler UA                       | Honors OG | Honors JSON-LD | Notes                                                   |
| ----------------- | -------------------------------- | --------- | -------------- | ------------------------------------------------------- |
| Perplexity        | `PerplexityBot`                  | ✓         | ✓              | Heavy on canonical URL; cite-friendly.                  |
| ChatGPT search    | `OAI-SearchBot`, `GPTBot`        | ✓         | ✓              | `GPTBot` is for training; `OAI-SearchBot` for search.   |
| Claude            | `ClaudeBot`, `Claude-Web`        | ✓         | ✓              | `Claude-User` is end-user agent fetches.                |
| Gemini / AI Overviews | `Google-Extended`            | ✓         | ✓ (preferred)  | Schema.org Article is the strongest signal here.        |

Allow these in `robots.txt` if you want to be cited. Block them if you don't. Default Astro Knots policy: allow.

## Decision tree: which client to test first?

1. Sharing primarily through iMessage / WhatsApp? → Test there first; everything else is easier.
2. Sharing primarily through Slack / Discord? → Test there; debuggers are harder to get to than Slack itself.
3. Marketing reach through LinkedIn / X / Facebook? → Use their debuggers to force a re-scrape after every change. They cache long.
4. Concerned about generative-engine citation? → Validate JSON-LD with [Schema.org validator](https://validator.schema.org) and [Google Rich Results Test](https://search.google.com/test/rich-results).

## When in doubt: the `curl` triplet

```bash
# What does the unfurler get when fetching the page HTML?
curl -sA "Mozilla/5.0 (compatible; Slackbot-LinkExpanding 1.0)" "<page-url>" | grep -iE 'og:|twitter:|<title>'

# What does the unfurler get when fetching the OG image?
curl -sIA "Mozilla/5.0 (compatible; facebookexternalhit/1.1)" "<og-image-url>"

# What does a no-Accept-header client (most unfurlers) actually receive?
curl -sI "<og-image-url>" | grep -iE 'content-type|content-length|vary'
```

The third line is the one that catches the ImageKit / WebP-versus-JPEG content-negotiation gotcha that bit us on content-farm.

---
name: generate-consistent-og-images
description: How to generate share-imagery (OpenGraph banners, portraits, squares, tall WhatsApp/iMessage cards) for any Lossless site or splash page so the resulting images form a coherent visual family — via two coexisting techniques: Ideogram illustration, or rasterizing the project's own hero/specimen component with macOS's `qlmanage`+`sips` (or a Playwright screenshot for higher fidelity). Use whenever a site, splash, plugin page, or fundraise deck needs an OG image generated or refreshed; whenever the user says "make an og image", "generate a banner", "we need a share image", "regenerate banners across formats", "the unfurl looks stale", "screenshot the hero for the share image", "turn this component into an OG image"; whenever scaffolding a new Astro Knots site that doesn't yet have an `og:image` or a `DESIGN.md`; whenever per-page or per-component custom illustrative imagery is needed even if it deliberately departs from the OG-image canon; whenever an existing OG image (of either technique) might already be live and a decision is needed about replacing vs. keeping it. Encodes the pattern of (1) choose Ideogram illustration vs. hero rasterization per the Strategy Choice section, (2) check / create a DESIGN.md following the Google Stitch open spec, (3) check / add an `imagery:` recipe block to that DESIGN.md, (4) call Ideogram v3 generate with every field locked except `prompt` and `aspect_ratio` (or rasterize the hero via `qlmanage`+`sips`), (5) save with the canonical naming convention, (6) treat WhatsApp + iMessage chat-preview as the primary share surface and other socials as secondary, (7) run the Case Protocol before wiring anything into a live `og:image` tag. The skill never sees an API key in source — `IDEOGRAM_API_KEY` lives in `~/.secrets` and is inherited from the shell, same pattern as the `crawl-fetch-ingest` skill.
from: "dididecks-ai"
from_path: "context-v/agent-skills/generate-consistent-og-images/SKILL.md"
---
# Generate Consistent OG Images

> Two techniques, either one valid: generate a wordless illustration with Ideogram (two variables per request — aspect ratio and a one-sentence prompt; everything else locked at the `DESIGN.md` level), or rasterize the project's own hero/specimen component with `qlmanage`+`sips`. Illustration quality is stochastic — some runs land, some don't — while a hero rasterization is deterministic and on-message whenever the hero already says the thing. Pick per project, or per format, and let both coexist.

## When to use this skill

- A site, splash page, plugin page, or fundraise deck needs an OG image generated for the first time
- An existing OG image needs to be refreshed (rebrand, stale visual, new feature launch)
- A new format is needed alongside an existing one (e.g. you have `banner` but now need `banner_tall` for WhatsApp / iMessage)
- The user asks for "an image for this page" or "an image for this component" that may or may not follow the OG canon
- Scaffolding a new Astro Knots site that doesn't yet have a `DESIGN.md` at all
- "The link unfurl looks wrong" — the OG image is missing, off-brand, or in the wrong format

## Philosophy (Lossless OG preference)

The Lossless Group **optimizes share imagery for mobile chat previews — iMessage and WhatsApp first** — and treats LinkedIn / Twitter / Bluesky / Slack as concentric rings around that target.

In practice this means:

- **Tall aspect ratios get production attention**, not just landscape banners. `3x4` (WhatsApp / iMessage default) and `2x3` (extra-tall) variants are first-class assets, not afterthoughts.
- **Subject lives in the lower portion of the frame** by default so the top half stays clean for the receiver's preview crop (chat platforms aggressively top-crop tall images).
- **The 1200×630 OG-canonical banner is one format among several**, not the only target. Other social-specific banners (LinkedIn portrait, Twitter Card) are still produced when needed, but never at the expense of a polished tall variant.

This shapes the aspect-ratio enum below and the naming convention.

## Strategy choice — illustrated (Ideogram) vs. rasterized hero/specimen

There are **two independent, coexisting techniques** for producing a Lossless OG image. Neither is "the" canonical one — pick per project, or even per format, and keep both around rather than treating a later choice as an implicit rejection of the earlier one. This decision comes before any generation work starts.

### Technique A — Ideogram illustration (the rest of this skill)

A wordless spot-illustration generated per the recipe below, with title/eyebrow text composited on top afterward via the `overlay-svg-text` skill. Best fit when the project's pitch is **editorial or metaphor-driven** — there's no single UI element that says the thing, so a subject canon (a mailroom, a vault, a sprout) has to be invented to carry it.

Trade-off to plan around: **quality is stochastic.** Even with `magic_prompt: OFF`, a fixed seed, and every channel locked, some generations land exactly right and others fall flat — the only fix is generating multiple candidates and picking a winner (which is why the recipe defaults to `num_images: 4`). Budget for that variance; don't expect the first run to be the final one.

### Technique B — Rasterize the site's own hero / specimen component

Skip illustration entirely and turn the project's **own hero object** — a credential-specimen card, a data mockup, a real UI element that already carries real content (real IDs, real copy, real brand tokens) — directly into the OG image. Best fit when **the hero already says what the OG image needs to say**: data-forward products, anything with a "here's the actual artifact" pitch, dashboards, specimen/credential UI. Reproducing that as a wordless illustration would throw away the information that makes it convincing.

How:

1. **Author (or reuse) an HTML/CSS or SVG version of the hero object.** Real markup, not a photo/illustration — pull colors and type directly from the project's `DESIGN.md` tokens (don't re-derive them). Use real data where the project has it (a real UUID, a real timestamp, real copy already live on the page) rather than lorem-ipsum placeholders — the realism is the point. Give the focal content generous padding — see the gotcha below.
2. **Rasterize with macOS's built-in CLI tools — no Node/Puppeteer/Satori pipeline required:**
   ```bash
   qlmanage -t -s 1200 -o /tmp/og-render path/to/hero.html   # or hero.svg
   sips -c 630 1200 /tmp/og-render/hero.html.png --out /tmp/og-render/cropped.png
   sips -s format jpeg /tmp/og-render/cropped.png --out public/og-banner.jpg
   ```
   `qlmanage -t` drives QuickLook's own generator for the file type — it has one for both `.html` and `.svg`, so raw HTML/CSS heroes work directly, not just vector art. **Two verified gotchas:** `-s <size>` always produces a **square** canvas — it does not respect the page's own declared width/height, so a 1200×630-styled page still comes out 1200×1200. And `sips -z <height> <width>` (resize) **squashes non-uniformly** rather than cropping — visibly distorts the content. Use `sips -c <height> <width>` (`--cropToHeightWidth`, a true center-crop) to reach the target aspect ratio instead. Because the crop centers on the square canvas rather than on your content, verify the output visually — CSS-centered content can still land off-center after the pad-to-square step. Full recipe + the test that surfaced both gotchas: `lost-in-public/practices/Generating OG Images with qlmanage and sips.md`.
3. **Higher-fidelity alternative:** screenshot the live component in a headless browser (Playwright's `page.screenshot()` at a fixed viewport) instead of hand-authoring separate markup. This guarantees pixel-parity with the real rendered site — actual fonts, gradients, CSS masks/filters, JS-driven layout — at the cost of a Playwright dependency. Prefer this over the `qlmanage` route when the hero relies on CSS/JS features QuickLook's renderer may not reproduce faithfully (it's WebKit-based but not a full browser tab — untested against remote web-font loads, CSS filters/masks, and JS-driven layout).
4. **Same naming convention, same preservation discipline** as the Ideogram path — archive the outgoing file before overwriting, don't skip the format-per-surface thinking just because there's no Ideogram call involved.

### Choosing per project

- Ask: *does the hero/specimen already say what we want the OG image to say?* If yes, Technique B is often the safer default — deterministic, on-message, no illustration-quality lottery.
- Technique A is the better fit for subjects with no single UI element that captures the pitch — metaphor, narrative, abstract concepts.
- **The two can coexist across formats within the same project** — e.g. `banner` as a rasterized hero, `banner_tall`/`portrait`/`square` as illustrated variants for surfaces where a wordless scene works better. The naming convention already supports per-format independence; nothing about picking Technique B for one format obligates using it for all of them.
- Precedent: id-didi-sh's live `og:image` is a rasterized SPECIMEN credential-card hero (Technique B, from `qlmanage`+`sips`, 2026-07-06). A full illustrated safety-deposit-box-vault set (Technique A) was generated for the same project on 2026-07-07 and kept on disk as an available alternative rather than replacing the hero rasterization — see the Case protocol below for how that coexistence decision gets made.

## Prerequisites

### `IDEOGRAM_API_KEY` in `~/.secrets`

Same pattern as the `crawl-fetch-ingest` skill: keys never live in source.

```bash
# ~/.secrets (chmod 600)
export IDEOGRAM_API_KEY="..."
```

```bash
# ~/.zshenv adds one line (already in place if other Lossless skills work)
[ -f ~/.secrets ] && source ~/.secrets
```

No MCP server is required. Ideogram's v3 endpoint accepts a direct HTTPS request with `Api-Key` header. Bash + `curl` is enough. If a future MCP wrapper is preferred, register it the same way the firecrawl/tavily wrappers are registered in `crawl-fetch-ingest`'s `setup.md` — but it's not necessary for this skill.

### A target project with a known visual identity

The skill assumes the project has *some* established aesthetic. If it doesn't — brand-new site, no design decisions yet — that conversation has to happen before image generation. Use the `astro-knots` skill or pair with the user on a `Brand & Style` first pass before invoking this one.

## Case protocol — is a different OG image already live?

Before generating anything — or before wiring newly-generated images into the site's actual meta tags — check what the project's SEO/meta component *actually serves* as `og:image` today. `DESIGN.md`'s presence or absence of an `imagery:` block says nothing about what's live: a project can have a fully-authored imagery recipe and still ship a completely different, hand-crafted image in production, or vice versa. Conflating "`DESIGN.md` has no `imagery:` block yet" with "there's no OG image yet" is the mistake this protocol prevents.

### Step 0 — Detect what's actually live

Before Step 1 of the flow below, grep the site's meta-tag surface (`MetaTags.astro`, `seo.ts`, `Layout.astro`, or whatever the project calls it) for `og:image`, `DEFAULT_OG`, `ogImage`, or equivalent. Identify:

- The file currently referenced.
- Its provenance if discoverable (`git log --follow -- <path>`, `git blame`, the commit message) — this often reveals *how* it was made (a hand-authored SVG rasterized via a one-off tool, a prior Ideogram run, a screenshot, a design export) and *why* it looks the way it does.
- Its design language — is it wordless/illustrated (this skill's convention, text composited on top afterward via `overlay-svg-text`), or does it bake copy / a UI mockup directly into the image (a different, equally valid convention)?

### Step 1 — Classify against the newly-generated (or about-to-be-generated) set

- **Case A — nothing live, or a broken/generic placeholder.** Proceed with the normal flow below. No confirmation needed.
- **Case B — the live image already follows this skill's convention** (matches the `ogimage__{Project}--{Format}.{ext}` naming pattern, or `DESIGN.md`'s `imagery:` block clearly describes it). Treat this as a refresh — archive + replace per the Preservation Discipline below. No need to stop and ask.
- **Case C — the live image is a *different design language* than what this skill produces** — hand-authored, text-driven, a UI mockup, a screenshot, anything that isn't the wordless-illustration-plus-overlay convention. **This is not a stale instance of the same thing; it may be a different, deliberate choice.** Do not assume it should be replaced.

### Step 2 — For Case C, generate freely but gate the *wiring* step on confirmation

Generating the illustrated candidate set is cheap and can proceed regardless of the final wiring decision — the assets are useful independent of what ends up live. What must wait for explicit sign-off is the step that **edits the site's actual meta-tag source** (`DEFAULT_OG`, an `ogImage` prop default, etc.) to point at the new set. Ask, don't assume — offer options along these lines rather than picking one silently:

> "The project already ships `<X>` as its OG image — a different design language (text-driven / hand-crafted / etc.) than the illustrated set. Replace it entirely, keep it as primary and use the new set only for formats that don't exist yet, or generate one candidate first so you can compare side-by-side before deciding?"

This is a genuine judgment call about the project's visual identity, not a mechanical decision this skill can make on its own.

### Step 3 — Treat the decision as provisional until the user has seen the live result

A user answering "replace it" is answering from memory of the old image against a *description* of the new one — not against the two rendered side by side in context. Don't burn the reversibility this buys you: **archive the outgoing image, never delete it** (same rule as the Preservation Discipline below), and keep the wiring change small and obviously reversible — one file swap plus one config edit, not a multi-file refactor. If the user reverses the decision after seeing the composited result live, that's not a failure of the protocol — it's exactly the case the protocol is designed to make cheap to recover from.

*Precedent: id-didi-sh, 2026-07-07 — a fully-generated and text-overlaid illustrated set was wired in as the default `og:image` after the user said "replace it entirely," then reverted back to the original hand-rasterized banner once they saw the result live and preferred it. Because the original had been archived rather than deleted, the revert was a two-file copy and a one-line edit in `seo.ts` — not a redo.*

## The flow

Five steps, in order. Steps 1–2 are setup the first time the skill runs against a project; steps 3–5 are the per-image work that repeats. Run the **Case protocol** above first if there's any chance an OG image is already live — it determines whether Step 5's wiring is a free action or a gated one.

### Step 1 — Check (or create) `DESIGN.md`

Look for `DESIGN.md` at the project root.

- **If present:** verify it has YAML frontmatter and the standard Google Stitch spec sections (`Brand & Style`, `Colors`, `Typography`, `Layout`, `Elevation & Depth`, `Shapes`, `Components`).
- **If absent:** **hand off to the `maintain-design-md` skill** to bootstrap one. That skill owns the canonical authoring flow, the spec mapping, and the scaffold template (`templates/design-md-scaffold.md`). Once a first-pass `DESIGN.md` exists, return here to add the `imagery:` extension and proceed.

The skill cannot proceed to image generation without a `DESIGN.md` because the imagery recipe (next step) references its color palette tokens.

### Step 2 — Check (or add) the `imagery:` block to `DESIGN.md`

The `imagery:` block is **outside the Google Stitch spec's standard token groups**, but spec-compliant consumers preserve unknown top-level keys (per the spec's "Consumer Behavior for Unknown Content" table). It's safe to keep there as the single source of truth.

The canonical block lives at `templates/imagery-block.yaml` in this skill. Open that file, adapt three things to the target project, paste into the project's `DESIGN.md` frontmatter (after `components:`, before the closing `---`):

| Field | What to adapt |
|---|---|
| `style_reference.path` | The project's canonical hero/banner image. If the project has none yet, generate a one-off using a quick prompt + the project's `colors:` palette, save it, and use that as the reference for all subsequent runs. |
| `color_palette.members` | Map from the project's `colors:` tokens to Ideogram's `color_hex` + `color_weight` shape. Weight the surface background highest (0.4–0.5) and brand accents lower. |
| `defaults.seed` | Pick a fixed seed for the project. Any integer is fine; bump only when the canon shifts. |

Everything else in `templates/imagery-block.yaml` — `style_type: AUTO`, `magic_prompt: OFF`, `rendering_speed: QUALITY`, the `aspect_ratios` enum, the `negative_prompt` set, the `prompt` constraints — is **project-agnostic and should be copied verbatim**. The whole point of locking those is that they don't vary across projects either.

> **API constraint worth knowing:** `style_type: AUTO` is required whenever `style_reference_images` is uploaded. The v3 endpoint rejects `DESIGN` / `REALISTIC` / `FICTION` in that combination with the error *"Please use AUTO or GENERAL style type with style_codes, style_reference_images or style_preset."* The reference image carries the aesthetic; `AUTO` lets it through.

The matching prose section (`## Imagery`) belongs in the body of `DESIGN.md` immediately before `## Do's and Don'ts`. The reference implementation in `content-farm/splash/DESIGN.md` is the canonical example.

### Step 3 — Construct the request

Read the project's `DESIGN.md` `imagery:` block. The Ideogram request is built by:

1. Taking every field from `imagery.defaults` as-is.
2. Taking `imagery.color_palette` as-is.
3. Uploading the file at `imagery.style_reference.path` as `style_reference_images`.
4. Taking `imagery.negative_prompt` as-is.
5. **Picking one entry** from `imagery.aspect_ratios` for `aspect_ratio` — based on the user's stated target format (see § "The aspect-ratio enum" below).
6. **Authoring one prompt** for the `prompt` field — see § "Prompt convention" below.

No other field varies. If the user asks to vary something else (e.g., "use a brighter palette"), that's a `DESIGN.md` change, not a per-request override.

### Step 4 — Call Ideogram v3 generate

The canonical curl call lives at `templates/ideogram-request.sh`. Substitute `{prompt}` and `{aspect_ratio}` and run. The script reads `IDEOGRAM_API_KEY` from the environment (`~/.secrets`).

```
POST https://api.ideogram.ai/v1/ideogram-v3/generate
Content-Type: multipart/form-data
Api-Key: $IDEOGRAM_API_KEY
```

The response carries a `url` for each generated image. **Images expire on the Ideogram side**; download immediately to the target project's `public/` (or equivalent static asset directory).

### Step 5 — Save with the canonical naming convention

```
ogimage__{Site-Name}--{Format-Or-Variant}.{ext}
```

- `Site-Name` — the project's canonical name in PascalCase or Hyphen-Joined-PascalCase: `Content-Farm`, `Reach-Edu-Hub`, `Calmstorm-Decks`, `Perplexed`.
- `Format-Or-Variant` — one of: `Default`, `Banner`, `BannerTall`, `BannerTallMax`, `Portrait`, `PortraitTall`, `Square`. `Default` aliases whichever format is the canonical share image (typically `Banner`).
- Extension: prefer `.jpg` per the `open-graph-share-seo-geo` skill's JPEG-over-WebP rule. Convert from Ideogram's PNG output with `ffmpeg -i in.png -q:v 2 out.jpg` (quality 2 is near-lossless and lands ~95 KB at 1200×630).

Example set for `content-farm`:

```
public/ogimage__Content-Farm--Default.jpg          # the canonical banner (also serves as style_reference)
public/ogimage__Content-Farm--Banner.jpg           # alias of Default
public/ogimage__Content-Farm--BannerTall.jpg       # WhatsApp / iMessage default tall
public/ogimage__Content-Farm--BannerTallMax.jpg    # dramatic-tall variant
public/ogimage__Content-Farm--Portrait.jpg         # LinkedIn portrait / IG feed
public/ogimage__Content-Farm--PortraitTall.jpg     # Stories / Reels / TikTok
public/ogimage__Content-Farm--Square.jpg           # avatars, square unfurls
```

If the image is destined for a CDN (per the `open-graph-share-seo-geo` skill's "host the OG image remotely" rule), upload there as well; the same file naming travels.

## The aspect-ratio enum

| Format key | Ideogram `aspect_ratio` | When to use |
|---|---|---|
| `banner` | `16x9` | Default share — OpenGraph, Twitter / X, Slack, generic |
| `banner_tall` | `3x4` | **WhatsApp & iMessage chat-preview cards (the Lossless default tall)** |
| `banner_tall_max` | `2x3` | Dramatic-tall variant; use when the subject genuinely benefits from height |
| `portrait` | `4x5` | LinkedIn portrait, Instagram feed post |
| `portrait_tall` | `9x16` | Instagram Stories, Reels, TikTok |
| `square` | `1x1` | Avatars, square OG fallbacks, Discord embeds |

The keys live in `imagery.aspect_ratios` of the project's `DESIGN.md`; the values may differ if a project has a different target mix, but the **format names** stay the same across projects so cross-site automation can talk in one vocabulary.

## Prompt convention

The `prompt` is the **only free-text channel** in the request. Two ingredients per prompt, nothing else:

1. **Subject** — what the image depicts. One short noun phrase. *"Isometric sprout growing from a stack of paper-cut tiles"*, *"Three nested transparent cubes drifting above a horizon line"*, *"A spool of thread unwinding into a typeset block of characters"*.
2. **Composition — empty space as a first-class subject.** This is the rule that matters most for share imagery (where SVG overlay text needs clean room). **Lead the prompt with the empty region** — declare it explicitly, give it concrete content (a "dark gradient sky", a "muted atmospheric backdrop"). Then state what fills the bottom region. The model treats both clauses as renderings the sky is just as describable as the quill — and the subject can't grow into the overlay zone because the sky is already there.

   **Bad framing** (subject-first; produces 85%-tall subjects that swallow the overlay zone):

   > *"An isometric quill pen with paper-leaf feathers, growing from a stack of paper-cut card tiles, in the lower third of the frame, top two-thirds open."*

   **Good framing** (empty-region-first, two clauses, explicit numeric split):

   > *"Top 1/3 of frame is empty negative space, dark gradient sky. Bottom 2/3 contains an isometric quill pen with paper-leaf feathers, growing from a stack of paper-cut card tiles."*

   Three rules that survive aspect-ratio changes:
   - **Lead with the empty region**, not the subject. The first sentence describes what's empty *and what content fills that emptiness* (a sky, a backdrop, a gradient).
   - **Use explicit numeric proportions** ("top 1/3 / bottom 2/3"), never soft terms ("lower portion", "below the horizon").
   - **Reinforce in `negative_prompt`** with the specific failure mode you observe (e.g. `subject in top half`). The negative prompt isn't a substitute for the positive empty-region declaration — it's a *belt* alongside the positive *suspenders*.

   The underlying principle: **empty space won't be left as residue. It has to be declared, named, and given content** — otherwise the subject expands to fill the canvas. This was discovered empirically over iter1 → iter2 → iter3 on the Perplexed OG set; iter1 and iter2 used subject-first framing and produced subjects at 75-85% canvas height; iter3 used empty-region-first framing and produced subjects at 40-65% canvas height with the upper region genuinely empty.

Target ≤220 characters total. Past that, hard composition asks start losing to subject elaboration.

**Forbidden in the prompt** (already encoded via locked channels, never repeat):

- Brand names (`Lossless`, `Content Farm`, plugin names)
- Color words (`cyan`, `dark`, `warm`)
- Aesthetic adjectives (`vibrant-minimal`, `build-in-public`, `monospace`)
- Texture descriptors (`paper-cut`, `isometric`, `atmospheric`) — *unless* the subject genuinely requires them and the style reference image already establishes them as canon

Composition templates that survive aspect-ratio shifts cleanly. Note the two-clause structure — empty-region declaration first (with concrete content), subject placement second:

- `Top 1/3 of frame is empty negative space, dark gradient sky. Bottom 2/3 contains {subject}.`
- `Left 1/3 of frame is empty negative space, soft atmospheric backdrop. Right 2/3 contains {subject}.`
- `Top half of frame is empty atmospheric gradient. Bottom half contains {subject}, centered horizontally.`
- `Top-right 2/3 of frame is empty negative space, dark muted sky. Bottom-left 1/3 contains {subject}.`

## When to break the rules (per-page / per-component custom imagery)

The locked recipe is for **share imagery** — the assets a third party sees when a link is unfurled. The user / team may also need:

- A hero illustration for a specific page or section
- An icon-like image for a component card
- A decorative asset embedded in long-form content
- A presentation slide background

These are **legitimate departures** from OG-image canon. They may use different palette weights, different aspect ratios, different style references, even a different `style_type`. When the user asks for one of these:

1. Confirm out loud that this is a *display* asset, not a *share* asset. ("Just so I have this right — this image is meant to live inside the page as illustration, not be the page's OG share preview. Is that correct?")
2. Author a prompt that's free of OG-image constraints — the "subject in lower third" rule doesn't apply when there's no SVG overlay to leave space for.
3. Pick the aspect ratio that fits the layout slot, even if it's not in the `aspect_ratios` enum (use Ideogram's `resolution` field instead of `aspect_ratio` for pixel-exact sizing).
4. Save *outside* the `ogimage__` naming convention. `illustration__Section-Name--Variant.jpg`, `hero__Page-Name.jpg`, or whatever the project's local convention is — but never use the `ogimage__` prefix, since that name implies the canonical recipe was followed.

The point: **don't pollute the OG-image set with one-off custom imagery**, and don't constrain one-off custom imagery with OG-image rules.

## Two short worked examples

### Example A — refreshing the splash's WhatsApp tall variant

User says: "Regenerate the WhatsApp tall card for content-farm."

```bash
# 1. Project: content-farm/splash. DESIGN.md exists, imagery: block exists.
#    No setup work needed.

# 2. Pick aspect ratio: banner_tall (3x4)
# 3. Author one-sentence prompt with subject + composition:
PROMPT="Top 1/3 of frame is empty negative space, dark gradient sky. Bottom 2/3 contains an isometric sprout growing from a stack of paper-cut tiles."

# 4. Call Ideogram (see templates/ideogram-request.sh):
bash templates/ideogram-request.sh "$PROMPT" 3x4

# 5. Download response[0].url, convert PNG → JPEG, save as:
#    public/ogimage__Content-Farm--BannerTall.jpg
```

### Example B — bootstrapping a brand-new splash

User says: "I just scaffolded reach-edu-hub. Generate the OG banner."

```bash
# 1. Check for DESIGN.md at reach-edu-hub/ → absent
# 2. Pair with the user to author DESIGN.md from the spec:
#    - Frontmatter token groups (colors, typography, rounded, spacing, components)
#    - Eight prose sections in spec order
#    Reference: github.com/google-labs-code/design.md and
#               content-farm/splash/DESIGN.md as a shape example
# 3. No style_reference exists yet. Generate a one-off with only color_palette
#    + style_type=AUTO to seed the canon, save as the reference, then add
#    the imagery: block pointing at it.
# 4. Now run the canonical recipe across banner, banner_tall, portrait, square.
```

## Preservation discipline — never replace prior runs

Ideogram generations are non-deterministic in composition (even with seed + every other parameter locked) and expensive in attention to curate. When we land a "good" image after multiple iterations, the prior candidates and the prior canonical pick are **historical record** worth keeping — they justify the final pick, document what was tried, and give a baseline if a future run drifts.

Two preservation layers:

### Layer 1 — raw candidates auto-archive per run

The `templates/ideogram-request.sh` script writes each run into a fresh timestamped directory:

```
<project>/.ideogram-candidates/<subject>-<aspect>-<YYYYMMDD-HHMMSS>/
  candidate-0.png
  candidate-1.png
  candidate-2.png
  candidate-3.png
  response.json     ← Ideogram's echo: actual prompt, seed used, resolution, expired URL
```

The dot-prefixed parent directory (`.ideogram-candidates/`) sits **outside** the project's static-asset directory (`public/`, `static/`, etc.) so Astro / 11ty / Next / any static-site framework doesn't deploy 1.4MB PNGs to production. Per-run subdirs are timestamped → **never overwritten across runs**. Two BannerTall passes done an hour apart produce two distinct subdirectories.

Decide per project whether to `.gitignore` `.ideogram-candidates/`. Pro keeping in git: auditable history of every gen pass. Con: PNGs bloat repo size. Lossless default: **keep in git** unless the repo is shared with non-team contributors who'd be confused by the byte size.

### Layer 2 — canonical JPEGs archive on replacement

The canonical-named files (`ogimage__{Site}--{Format}.jpg`) live in `public/` because the splash needs them at deploy time. When you re-run the recipe and pick a NEW winner for the same format, **don't overwrite the existing canonical file directly**. Instead:

1. Move the current `ogimage__{Site}--{Format}.jpg` to `<project>/.ogimage-archive/ogimage__{Site}--{Format}--{YYYY-MM-DD}.jpg` (creating the archive directory if needed — also dot-prefixed, also outside `public/`).
2. Write the new pick to the canonical path.

```bash
# Pseudo-recipe — the actual ffmpeg step lives in your conversion script:
ARCHIVE="<project>/.ogimage-archive"
mkdir -p "$ARCHIVE"
if [[ -f "public/ogimage__Perplexed--BannerTall.jpg" ]]; then
  mv "public/ogimage__Perplexed--BannerTall.jpg" \
     "$ARCHIVE/ogimage__Perplexed--BannerTall--$(date +%Y-%m-%d).jpg"
fi
ffmpeg -y -i "<new-pick>.png" -q:v 2 "public/ogimage__Perplexed--BannerTall.jpg"
```

The unfurler URL stays stable (it's still `…/ogimage__Perplexed--BannerTall.jpg`); only the bytes behind it change. Old bytes survive in `.ogimage-archive/` with a date stamp so you can A/B which version unfurled how.

### Why both layers matter

- **Raw candidates** answer "what else did we generate that day?"
- **Canonical archives** answer "what did the splash actually serve last quarter?"

Without Layer 1, repeat runs erase candidates we considered. Without Layer 2, the splash's deployed history becomes irrecoverable as soon as you generate v2.

## Anti-patterns

- **Putting brand or palette words in the Ideogram prompt** — that's what the locked channels are for. Repeating them in the prompt only dilutes attention budget for subject + composition.
- **Varying `magic_prompt` across requests in a set** — single biggest source of "why don't these match." If on for one, on for all (and expect more drift).
- **Varying the seed across requests in a set** — same logic. Different seeds = different interpretations of identical parameters. Fix the seed at the project level; only override when iterating one prompt at a time.
- **Subject-first framing for overlay-bearing imagery.** Saying *"subject in the lower third"* alone is not strong enough — the subject grows up into the overlay zone regardless. **Lead the prompt with the empty region as its own renderable thing**, give it concrete content (a "dark gradient sky"), and put the subject in the second clause. Reinforce in `negative_prompt` with the failure mode (`subject in top half`). Empty space won't be left as residue; it has to be declared, named, and given content. See the "Composition" subsection above for the full rule and the iter1→iter3 evidence that drove the refinement.
- **Long negative prompts** — each token competes with the positive prompt. Stay close to the seven-token canonical list in the template.
- **Treating the 1200×630 OG banner as the only deliverable** — Lossless ships WhatsApp / iMessage first. Always produce `banner_tall` alongside `banner`.
- **Naming a one-off custom illustration with the `ogimage__` prefix** — that prefix means "the canonical recipe was followed." Custom imagery uses a different prefix; see § "When to break the rules".
- **Authoring a new `DESIGN.md` by copying Content Farm's tokens** — the *shape* of `content-farm/splash/DESIGN.md` is canonical (frontmatter groups, eight prose sections in order). The *values* (palette, fonts, sizes) belong to Content Farm and must be re-authored for each new project.
- **Overwriting canonical OG JPEGs in place when re-running.** See § "Preservation discipline" — archive the old one with a date suffix before writing the new one. The unfurler URL stays stable; the byte history is preserved.
- **Putting raw candidates inside `public/`.** Static-site frameworks deploy everything under `public/` verbatim. ~16 MB of PNG candidates ships to GitHub Pages otherwise. Keep raw candidates at `<project>/.ideogram-candidates/` — dot-prefixed, outside `public/`.
- **Using `style_type: DESIGN` with a style reference.** API rejects the combo. Use `AUTO` whenever `style_reference_images` is set.
- **Wiring a newly-generated set into the live `og:image` meta tag without checking what's already there.** `DESIGN.md` having (or lacking) an `imagery:` block doesn't tell you what's actually live in production. Run the **Case protocol** section above — a hand-crafted or text-driven image already shipping is a deliberate choice, not a stale placeholder, until proven otherwise.

## See also

- `templates/imagery-block.yaml` in this skill — the canonical `imagery:` recipe block, ready to drop into a new `DESIGN.md`
- `templates/ideogram-request.sh` in this skill — the canonical curl invocation
- `content-farm/splash/DESIGN.md` — the canonical full-example of a Lossless `DESIGN.md` with both the standard Stitch sections and the `imagery:` recipe
- `maintain-design-md` skill — owns Step 1 of this flow when no `DESIGN.md` exists, plus the maintenance discipline (drift audits, when code changes should bounce back into the doc)
- `open-graph-share-seo-geo` skill — sibling skill on the *delivery* side: where to host the file, what HTTP headers it needs, JPEG-over-WebP rule, the `og:image:type` invariant, cache-busting recipes
- `crawl-fetch-ingest` skill — the precedent for the `~/.secrets` pattern this skill borrows
- `astro-knots` skill — when scaffolding a new site that needs a `DESIGN.md` from scratch
- Google Stitch DESIGN.md spec — <https://github.com/google-labs-code/design.md>
- Ideogram v3 generate API — <https://developer.ideogram.ai/ideogram-api/api-overview>

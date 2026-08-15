---
title: "AI Editing Model Timeline — the engine under a zero-marginal-cost editor"
date_created: 2026-08-02
date_modified: 2026-08-02
authors:
  - Michael Staton
augmented_with: Claude Code on Claude Opus 4.8
semantic_version: 0.0.0.2
status: Draft
lede: "The models that read, transcribe, and enhance footage that already exists got steadily better and cheaper across 2024-2026 — the reason EventCut's marginal cost per edit trends toward zero. This is an editor, not a text-to-video studio."
tags:
  - EventCut
  - Market-Research
  - AI-Models
  - Video-Editing
  - Cost-Curve
from: "dididecks-ai/eventcut-ai"
from_path: "context-v/narratives/AI-Model-Cost-Capability-Timeline.md"
---
## Why Care?

EventCut is an **AI-powered video editor**. It takes footage that **already
exists** — a conference talk, an interview, a panel — and uses AI to watch it,
transcribe it, find the highlights, cut the dead air, reframe it, and clean it
up, so an editor who could publish 10 clips from an event can publish 100. It is
**not** a generative text-to-video studio: it does not invent footage from a
prompt. That distinction matters, because the two live in different markets with
different buyers and different cost curves. The buyer here is an editor with real
tape and a deadline; the cost that matters is **per minute of source processed**,
not per second of hallucinated video.

EventCut's core economic claim is that it is a **zero-marginal-cost editor**: the
human and production cost of one more published clip collapses toward zero, and
the only variable cost left is **tokens** — AI inference. That is only credible
if the models doing the editing work are cheap and getting cheaper, and capable
and getting more capable. Both are true, on a steep two-year curve. This document
is the cited substantiation behind the decks' timeline slide, and it feeds the
typed dataset at `src/data/model-timeline.ts`.

The work runs on **three tracks** — all operating on existing footage:

1. **Understand** — the editing intelligence. Long-context video comprehension,
   scene/shot/speaker recognition, find-the-moment. Decides *what* to cut.
2. **Transcribe** — the ASR backbone of text-based editing. Turn speech into text
   so you can edit video by editing text, and strip filler and silence.
3. **Enhance** — operate *on* the clip: upscale, denoise, reframe, interpolate,
   segment/roto, relight. AI applied to real pixels, not a prompt.

Text-to-video generation (Sora, Veo, Runway-gen, Kling, Seedance, LTX) is a
**different, adjacent market** and is deliberately excluded from the thesis. A
generative model might occasionally fill b-roll or extend a shot inside an edit,
but it is an adjunct, not the product.

## Track 1 — Understand (footage intelligence)

From "can a model even watch a video" to "read two hours and pinpoint the exact
moment" — while an entire cheap tier (Flash, mini, nano, and open weights) opened
underneath, all through mid-2026.

- **2025-01 — Qwen2.5-VL (Alibaba, open).** Long-video comprehension plus event
  localization; set the open-VLM bar for reading footage. Self-hostable at ~$0
  marginal, or ~$0.20–0.90 / 1M hosted.[^qw25vl]
- **2025-04 — Llama 4 Scout / Maverick (Meta, open).** Natively-multimodal open
  MoE; Scout's 10M-token context ingests long footage as frames. ~$0.19–0.49 / 1M
  hosted, or free weights.[^llama4]
- **2025-06 — Gemini 2.5 Pro / Flash, GA (Google).** Native audio and video in
  one stack; hour-scale video with timestamped reasoning. Flash-Lite at $0.10 /
  $0.40 per 1M opens the cheap watch-the-footage tier.[^gem25]
- **2025-08 — GPT-5 + mini + nano (OpenAI).** Unified reasoning and vision,
  stronger frame and screenshot reading. A ~25× intra-family ladder: GPT-5 at
  $1.25 / $10, **nano at $0.05 / $0.40** per 1M.[^gpt5]
- **2025-09 — Qwen3-VL (Alibaba, open).** Native up-to-two-hour video with
  text-timestamp alignment for find-the-moment localization; matches Gemini 2.5
  Pro perception. Apache-2.0, or ~$0.40 / $0.90 per 1M hosted.[^qw3vl]
- **2025-11 — Gemini 3 Pro (Google).** State-of-the-art video understanding:
  ~100% needle-in-video to 30 minutes, 99.5% to 2 hours, explicit timestamp
  grounding. $2 / $12 per 1M.[^gem3]
- **2025-11 — Claude Opus 4.5 (Anthropic).** Flagship vision and agentic, with a
  large token-efficiency gain. Vision-tier price **cut 3×** to $5 / $25 (from
  $15 / $75 on Opus 4 / 4.1).[^opus45]
- **2026-05 — Claude Opus 4.8 (Anthropic).** Frontier vision and agentic computer
  use; the strongest footage-reasoning tier, holding $5 / $25.[^opus48]
- **2026-06 — Claude Sonnet 5 (Anthropic).** Near-Opus-4.8 quality, the most
  agentic Sonnet, vision retained — cheap enough to run per-clip at $2 / $10
  intro (then $3 / $15).[^sonnet5]

## Track 2 — Transcribe (the text-based-editing backbone)

Text-based editing (cut the video by cutting the transcript, kill filler and dead
air) rests on ASR. It got cheaper and more accurate at the same time.

- **2025-03 — ElevenLabs Scribe v2.** Transcription with speaker diarization
  included, all-in at **$0.004 / min**.[^scribe]
- **2025-03 — gpt-4o-transcribe (OpenAI).** Whisper successor at **4.1% WER** vs
  Whisper v3's 5.3%; $0.006 / min ($0.003 for mini).[^gpt4otx]
- **2025-06 — Deepgram Nova-3.** Fast STT for caption and transcript pipelines,
  $0.0043 / min batch.[^nova3]
- **2026-02 — AssemblyAI Universal-3.** Speech language model with
  natural-language keyterm prompting for names and jargon, ~$0.006 / min.[^univ3]
- **Ongoing — Whisper Large v3 Turbo (OpenAI, open).** The open-weight baseline
  under most editing tools; free self-hosted.[^whisper]

## Track 3 — Enhance (operate on the existing clip)

AI applied to real pixels: sharpen, smooth, reframe, relight, isolate, cut. The
techniques that needed a VFX artist or an expensive plugin in 2024 became a flat
subscription — or free and open — by 2026.

- **2024-07 — SAM 2 (Meta, open).** Promptable video object segmentation and
  tracking with memory — the roto and object-isolation backbone. Free,
  Apache-2.0.[^sam2]
- **2025-02 — Project Starlight (Topaz Labs).** The first diffusion model for
  video restoration — restore and upscale degraded footage.[^starlight]
- **2025-06 — SeedVR (ByteDance, open).** Diffusion-transformer generic video
  restoration at arbitrary resolution; free weights and code.[^seedvr]
- **2025-07 — Runway Aleph (Runway).** In-context editing of *real* footage —
  object add/remove, relight, new camera angles, restyle — from a text
  instruction on the clip. $0.336 / sec via API.[^aleph]
- **2025-10 — Topaz Video AI (Topaz Labs).** Upscale to 8K, frame-interpolate,
  stabilize, denoise; ships as Premiere and Nuke panels. Moved to $299/yr
  Personal, $699/yr Pro.[^topazvai]
- **2025-10 — ReframeAnything (OpusClip).** Object-tracking active-speaker
  auto-reframe to 9:16 / 1:1 / 16:9 plus highlight detection on long uploads.
  **1 credit = 1 minute of source**, free to 60 min/mo.[^reframe]
- **2026-01 — SeedVR2 (ByteDance, open).** One-step diffusion restoration —
  high-res restore in a single denoising step; free research release.[^seedvr2]
- **Ongoing — DaVinci Resolve Neural Engine (Blackmagic).** Super Scale upscale,
  temporal/spatial denoise, AI stabilize, Magic Mask roto, Smart Reframe — free
  tier, or $295 one-time for Studio.[^resolve]

## It's already shipping as agents

The agentic editor is not hypothetical — it's live, just not yet built the
EventCut way (event-native, throughput-first):

- **2025-04 — Descript Underlord.** Agentic co-editor: removes filler and
  silence, flags bad takes, suggests B-roll, on a text-based timeline.[^underlord]
- **2025-08 — OpusClip Agent Opus.** End-to-end autonomous agent: research →
  edit → publish-ready clips, no timeline.[^agentopus]
- **2026-04 — Adobe Premiere Agentic AI Assistant.** Workflow-orchestration agent
  plus Creative Agents for end-to-end production.[^premiere26]
- **2026-07 — Google Gemini Omni in Vids.** Edit *any* existing video by
  describing the change: color, denoise, replace backgrounds, relight.[^gvids]

And the market is pricing this neighborhood aggressively: **Mirage** (formerly
Captions) raised **$75M in March 2026** (~$500M prior valuation); **OpusClip** is
at a **$215M valuation** (March 2025); the ASR layer these tools ride on shows
**ElevenLabs at $11B** (Feb 2026) and **Deepgram at $1.3B** (Jan 2026).[^mirage][^opusfund][^eleven][^deepgram]

## The cost collapse, for editing

1. **Transcription got cheaper AND better at once:** gpt-4o-transcribe hit 4.1%
   WER at $0.006/min; ElevenLabs Scribe v2 runs $0.004/min with diarization
   included.[^gpt4otx][^scribe]
2. **Flagship footage-understanding cut 3×:** Claude Opus fell from $15/$75
   (Opus 4) to $5/$25 (Opus 4.5) and held it through Opus 4.8.[^opus45][^opus48]
3. **Open VLMs reach Gemini-2.5-Pro-class perception at ~$0 marginal:** Qwen3-VL
   (Apache-2.0) reads two-hour video self-hosted.[^qw3vl]
4. **Diffusion video restoration** went from nonexistent to a $299/yr commodity
   (Topaz Starlight) — and $0 open (SeedVR / SeedVR2) — in about a year.[^starlight][^seedvr]
5. **Find-the-highlight + auto-reframe is priced per source-minute:** OpusClip
   bills 1 credit = 1 minute of uploaded video, free to 60 min/mo.[^reframe]

## Caveats

- The exact release months for several open research items (SeedVR2, and some
  relighting/interpolation papers) rest on arXiv preprint numbering and are
  approximate; the model existence and capability are confirmed.
- Some transcription and enhancement prices are drawn from 2026 aggregator
  pricing pages rather than vendor pages; treat as directional anchors.
- Anthropic model lineup (Opus 4.5 → 4.8, Sonnet 5) and OpenAI GPT-5.x dates were
  cross-checked against multiple 2025-2026 sources; later point-releases
  (GPT-5.4+, Gemini 3.1+, Opus 5) surfaced only on low-authority pages and are
  intentionally excluded.

## Sources

[^qw25vl]: 2025-01. [Qwen2.5-VL](https://qwenlm.github.io/blog/qwen2.5-vl/). Qwen.
[^llama4]: 2025-04-05. [The Llama 4 herd](https://ai.meta.com/blog/llama-4-multimodal-intelligence/). Meta AI.
[^gem25]: 2025-06. [Advancing the frontier of video understanding with Gemini 2.5](https://developers.googleblog.com/en/gemini-2-5-video-understanding/). Google Developers Blog. Pricing: [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).
[^gpt5]: 2025-08. [GPT-5 / GPT-5-nano API pricing](https://pricepertoken.com/pricing-page/model/openai-gpt-5-nano). pricepertoken.
[^qw3vl]: 2025-09-23. [Qwen3-VL: Sharper Vision, Deeper Thought](https://qwen.ai/blog?id=99f0335c4ad9ff6153e517418d48535ab6d8afef). Qwen.
[^gem3]: 2025-11. [Gemini 3 Pro Sets New Vision Benchmarks](https://blog.roboflow.com/gemini-3-pro/). Roboflow.
[^opus45]: 2025-11. [Claude Opus 4.5: price cut and specs](https://claudefa.st/blog/models/claude-opus-4-5). claudefa.st.
[^opus48]: 2026-05-28. [Anthropic releases new model, Opus 4.8](https://www.axios.com/2026/05/28/anthropic-opus-release-mythos). Axios.
[^sonnet5]: 2026-06-30. [Introducing Claude Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5). Anthropic.
[^scribe]: 2026. [Speech-to-Text APIs in 2026: benchmarks & pricing](https://futureagi.com/blog/speech-to-text-apis-in-2026-benchmarks-pricing-developer-s-decision-guide/). Future AGI.
[^gpt4otx]: 2026. [GPT-4o-Transcribe vs Whisper review 2026](https://tokenmix.ai/blog/gpt-4o-transcribe-vs-whisper-review-2026). TokenMix.
[^nova3]: 2026-07. [Speech-to-Text API pricing](https://www.buildmvpfast.com/api-costs/transcription). buildmvpfast.
[^univ3]: 2026-07. [Speech-to-Text API pricing (AssemblyAI Universal-3)](https://www.buildmvpfast.com/api-costs/transcription). buildmvpfast.
[^whisper]: 2026. [OpenAI Whisper API pricing 2026](https://diyai.io/ai-tools/speech-to-text/openai-whisper-api-pricing-2026/). diyai.
[^sam2]: 2024-07. [Segment Anything Model 2 (SAM 2)](https://ai.meta.com/sam2/). Meta AI.
[^starlight]: 2025-02-13. [Topaz Labs unveils Project Starlight, the first diffusion AI model for video enhancement](https://www.prnewswire.com/news-releases/topaz-labs-unveils-project-starlight-the-first-diffusion-ai-model-for-video-enhancement-302376630.html). PRNewswire.
[^seedvr]: 2025-06. [SeedVR: generic video restoration](https://github.com/IceClear/SeedVR). GitHub (ByteDance / IceClear).
[^aleph]: 2025-07-25. [Introducing Runway Aleph](https://runwayml.com/research/introducing-runway-aleph). Runway.
[^topazvai]: 2026. [Topaz Video Review 2026: Is $299/Year Worth It](https://www.videoproc.com/resource/topaz-video-ai-review.htm). VideoProc.
[^reframe]: 2026. [Opus Clip Review 2026 (ReframeAnything, highlight detection)](https://www.ssemble.com/blog/opus-clip-review-2026). Ssemble.
[^seedvr2]: 2026-01. [SeedVR2: one-step diffusion video restoration](https://github.com/IceClear/SeedVR). GitHub (ByteDance / IceClear).
[^resolve]: 2026. [AI Video Editing in DaVinci Resolve: the complete 2026 guide](https://www.premierecopilot.com/en/blog/ai-video-editing-davinci-resolve). PremiereCopilot.
[^underlord]: 2025-04. [Descript Season 6: Meet Underlord](https://www.descript.com/blog/article/descript-season-6-meet-underlord). Descript.
[^agentopus]: 2026. [From Chat to Action: How Agentic AI Is Transforming Video Creation](https://www.opus.pro/blog/from-chat-to-action-how-agentic-ai-is-transforming-video-creation). OpusClip.
[^premiere26]: 2026-04-15. [Adobe extends leadership in video](https://blog.adobe.com/en/publish/2026/04/15/adobe-extends-leadership-video-unleashing-new-ai-powered-creation-firefly-reinventing-color-editors-in-premiere). Adobe.
[^gvids]: 2026-07. [Edit any video with Gemini Omni in Vids](https://workspaceupdates.googleblog.com/2026/07/generate-higher-quality-ai-video-clips-and-edit-any-video-with-Gemini-Omni-in-Vids.html). Google Workspace Updates.
[^mirage]: 2026-03-24. [Mirage raises $75M to build models for AI video app Captions](https://techcrunch.com/2026/03/24/mirage-raises-75m-to-continue-building-models-for-its-ai-video-editing-app-captions/). TechCrunch.
[^opusfund]: 2026. [OpusClip revenue, valuation & funding](https://sacra.com/c/opusclip/). Sacra.
[^eleven]: 2026-02-04. [ElevenLabs raises $500M from Sequoia at $11B valuation](https://techcrunch.com/2026/02/04/elevenlabs-raises-500m-from-sequioia-at-a-11b-valuation/). TechCrunch.
[^deepgram]: 2026. [Speech-to-Text APIs in 2026 (Deepgram $1.3B)](https://futureagi.com/blog/speech-to-text-apis-in-2026-benchmarks-pricing-developer-s-decision-guide/). Future AGI.

---
title: "In-App Chat as the Agent Surface for Client Apps"
lede: "Instead of trying to fit dozens of anticipated client requests — 'redesign this slide', 'run the writer agent on the updated research', 'export in my brand kit' — into navigation, buttons, and command menus across dididecks-ai, memopop-ai, and augment-it, wire up a single chat surface inside each app that calls an LLM with our patterns, skills, and project context already loaded. Paying clients use our keys; lingering post-engagement clients bring their own. The chat is the menu."
date_created: 2026-05-17
date_modified: 2026-05-17
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.1
tags:
  - Chat-UI
  - In-App-Agent
  - BYOK
  - Skills
  - Context-Vigilance
  - LangGraph
  - MCP
  - Dididecks
  - Memopop
  - Augment-It
  - Shared-Pattern
  - Microfrontend
status: Draft
---

# In-App Chat as the Agent Surface for Client Apps

## What this exploration is for

We just refactored `dididecks-ai` to separate client content from the UI shell and bolted on authentication ([[Shared-Auth-for-Applied-AI-Labs]]). The same shell pattern is queued for `memopop-ai` and (soon) `augment-it`. With the shell now a real seam, the obvious next thing to push through it is **a single chat surface that lets a logged-in client user do agent-level work without us having to design a button for every possible request.**

The motivating observation: we serve 1–3 clients at a time, but they **linger**. After the engagement ends they keep wanting things — a slide redesigned, a different aesthetic variant, the writer agent re-run on updated research, an export in their brand kit. None of it is paid time-and-materials anymore, but it's also not the kind of work we want to lose entirely — these are the people who refer the next engagement. A chat-with-our-system surface lets them self-serve **within the confines of our methods**, with the LLM cost falling on them via BYOK, while paying clients get the same surface with our keys.

This is a journey-mode doc. The destination isn't pinned. The goal is to converge on enough shape that the first per-app implementation (likely dididecks) seeds the others, and to capture the option space so a later spec can be written without re-walking it.

## Prior art in the tree

Worth reading before extending this:

- [[Shared-Auth-for-Applied-AI-Labs]] — the auth substrate this rides on. Org-scoped identity, viewer tier, BYOK ergonomics map onto the same user records.
- `dididecks-ai/context-v/explorations/Chroma-Parity-and-the-Path-to-a-Shared-Deck-UI-Module.md` — the shell extraction this chat surface plugs into.
- `dididecks-ai/context-v/specs/Dididecks-AI-Slide-Decks-as-Code.md` — the actual surface the agent edits (slides-as-code is what gives chat-driven edits a tractable target).
- `memopop-ai/context-v/specs/Character-Cast-for-Live-Agent-Indication.md` — the personification pattern; the chat surface should reuse "named characters doing work" rather than inventing a new agent-presence vocabulary.
- [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] — the corpus the in-app agent should retrieve from, not just the model's training data.
- `context-vigilance-kit/` — the skills and context-v conventions the agent should treat as authoritative.

If this exploration converges, the spec is probably `In-App-Agent-Chat-Core-Package.md` plus per-app prompts, paralleling how the auth exploration is structured.

## What the client is actually asking for

To stay concrete, here's the menu we keep redesigning instead of just wiring up chat. Per app:

**Dididecks-ai** (slide-deck operating system):
- "Make slide 7 less corporate."
- "Try a Chroma-style variant of this section."
- "Swap the chart on slide 4 for a Sankey."
- "Re-export with the founder's brand kit."
- "Generate three OG-image variants for this deck."
- "Why did the proto fail to deploy yesterday?"

**Memopop-ai** (multi-agent investment-memo orchestration):
- "Run the writer agent on the updated research."
- "Re-score the comparables now that we added two new ones."
- "Export this memo as a one-pager."
- "Which sources does paragraph 3 of the market section rely on?"
- "Add an analyst character to the cast for sector teardowns."

**Augment-it** (newest, scope still soft):
- (TBD — but the same shape: ask in English, the agent invokes the right internal tool.)

The pattern across all three is **"verb on a noun the system already knows about"**. The system already knows what a slide, a deck, a memo, a research bundle, a brand kit, a character is. Chat just lets the user name the verb and the noun without us having to wire each combination into UI.

## The architecture, sketched

Four layers, from outside in:

### 1. Chat UI (per app, but shared package)

A microfrontend component, in the spirit of `@dididecks/shell`, that ships:

- A message list with streaming responses.
- A composer with attachments (slide refs, memo refs, brand-kit refs — typed by the host app).
- The character-cast row from the Memopop spec, showing which agent(s) are currently working.
- A settings panel for BYOK (per-user API key, model selection, redaction toggles).
- A transcript persisted per `(org, user, project)` so the lingering client picks up where they left off.

This is the only part the client sees. It looks the same across dididecks/memopop/augment-it; only the slot of "what nouns can I attach" differs.

### 2. Skill / capability registry (per app)

Each host app registers a set of **capabilities** the chat agent is allowed to call. These are the operational analogue of our authored skills under `context-v/skills/`. In dididecks they look like:

```
slide.edit(deck_id, slide_id, instruction)
slide.variant(deck_id, slide_id, style)
deck.export(deck_id, brand_kit_id, format)
deck.og_image(deck_id, count)
deck.diagnostics(deck_id)
```

In memopop they look like:

```
agent.run(agent_name, input_ref)
memo.score_section(memo_id, section, criteria)
memo.export(memo_id, format)
memo.citations(memo_id, paragraph_id)
cast.add(role_descriptor)
```

The registry is what bounds the agent. The LLM **must** invoke a registered capability to do anything that changes state; freeform code-execution is not on the menu. This is what makes "within the confines of our system" enforceable rather than aspirational.

### 3. Context layer

Three sources, ranked:

1. **Live project state.** The current deck/memo/research — read directly from the host app's stores (libSQL/Turso per the auth doc, or the slides-as-code repo).
2. **The Lossless corpus via Chroma.** The four collections already wired (`context-vigilance-corpus`, `lossless-changelog`, `claude-code-sessions`, `claude-code-tool-traces`). The in-app agent gets read access to the subset relevant to the current app + the current org's prior work. This is how the agent "knows our patterns" without us re-paraphrasing them into a system prompt.
3. **The skills themselves.** Skill SKILL.md bodies are loaded as retrievable context, not stuffed into a megaprompt. The agent picks which to consult based on the user's message — the same trigger-shape pattern we already use in Claude Code.

### 4. Model + key routing

This is where paying vs. lingering diverges.

- **Paying client → our keys.** The chat hits Anthropic / OpenAI / etc. through our server with our key, our rate limits, our redaction. Conversation logged to our side for product learning (with consent baked into the auth doc's terms).
- **Lingering / unpaid client → BYOK.** Same UI, same capability registry, same context layer. The model call is proxied through our server (so we can still apply the capability gate and the redaction layer) but billed to their key. Their key is stored encrypted at the user record, never leaves the server, and is shown back masked. Anthropic, OpenAI, and (cheaply) a hosted Llama variant are all candidates — pick whichever the user has.

A third tier is worth mentioning: **viewer-only**, no chat. The auth doc already contemplates a viewer tier for published surfaces — chat is off there.

## The harder questions

### Q1. How does the agent edit a slide without breaking it?

Slides-as-code makes this tractable: the agent generates a patch against the slide's source files, the patch is applied to a branch (per Astro Knots conventions), and the user sees a preview before merge. The chat UI shows "I changed slides/07-market-size.astro and slides/07-market-size.theme.css — preview / accept / discard." Never auto-merge to the live deck.

This is the same loop Claude Code already runs; we're just exposing a shaped subset of it to a non-developer through chat.

### Q2. Is this LangGraph or just direct tool-use?

We've messed around with LangGraph in memopop. The honest answer is: **most chat turns are single-tool calls** ("re-run the writer agent", "export this") and don't need a graph. The few that need orchestration ("run writer, then re-score, then export") *are* graphs — but the graph is the existing memopop agent graph, not a new one composed at chat time. Chat is the **trigger** for graphs that already exist, not a graph itself.

For dididecks, where there's no LangGraph today, direct tool-use against the capability registry is probably enough for v1. Graduate to a graph only when a use case actually demands it.

### Q3. What stops the agent from going off-script?

Three guards:

1. **Capability registry as the only side-effect surface.** No `bash`, no arbitrary file write, no `fetch`. If the LLM wants to do something, it picks a registered capability or it returns text-only.
2. **System prompt anchored in the loaded skills.** "Use Lossless patterns. If a request doesn't map to a registered capability, explain what you'd do and ask the user to escalate to a paid engagement." This is the polite refusal path — it converts a request we can't service into either a sale or a "no" the user can live with.
3. **Per-org policy.** An org admin can disable capabilities (e.g., "no exports without my approval") via the same admin powers the auth doc contemplates.

### Q4. Where does the transcript live?

Per-user, per-project, in the host app's libSQL. Indexed into Chroma's `claude-code-sessions`-equivalent collection (probably a new `client-app-sessions` collection) so the corpus learns from real client usage, not just our internal dev work. This closes the loop: today's client question becomes tomorrow's retrievable answer.

### Q5. Is this one package or three?

The chat UI + capability registry + key-routing layer is **one shared package** (call it `@lossless/in-app-agent` for now, lives in `ai-labs/packages/`). The capability **definitions** live per-app — dididecks ships its registry, memopop ships its registry. The package gives them: the component, the registry interface, the BYOK plumbing, the Chroma client wrapper, the transcript store interface.

This is the same shape as the auth exploration's "shared core + per-app adapters" recommendation, and the same shape as the `@dididecks/shell` microfrontend extraction. Three different problems, one repeated architectural move — which is itself probably the [[pseudomonorepos]] pattern worth naming.

## What's deliberately out of scope

- **Voice.** Text only for v1. Voice is a multiplier on a working system, not a foundation.
- **Multi-user collaborative chat.** One user per session for v1. Org-shared transcripts can come later.
- **Agent-initiated chat ("the writer agent wants to ask you something").** Tempting, but adds a notification surface and a presence model we don't have. Keep chat user-initiated.
- **Cross-app chat.** A user asking dididecks' chat about a memopop memo. Cross-app belongs at the roll-up tier the auth doc already stubs out; not v1.

## Open forks

1. **Streaming via SSE vs. WebSocket.** SSE is simpler, fits one-direction model output. WebSocket needed only if we add server-pushed agent presence. Default SSE; revisit if presence proves valuable.
2. **Tool-call format.** Anthropic-native tool-use vs. a model-agnostic abstraction. Lean Anthropic-native for our keys; abstract for BYOK so OpenAI/others work without a second code path. Likely use the AI SDK or a thin in-house wrapper.
3. **Where the agent runtime lives.** In the host app's server (per-app, easier auth) vs. a shared `agent-runtime` service (single deploy, easier observability). Per-app for v1, factor out only if duplication hurts.
4. **What "Lossless patterns" means in the system prompt.** A static cheat sheet vs. a Chroma query at every turn vs. a hybrid (small static spine, retrieved details). Hybrid is almost certainly right; the spine is short, the details are large and changing.

## Next step

If this lands as a reasonable shape, the spec to write is `In-App-Agent-Chat-Core-Package.md` here in `ai-labs/context-v/specs/`, with:

- Capability registry schema.
- BYOK storage + proxy contract.
- Chat UI component API (so dididecks and memopop slot it in identically).
- Transcript schema (and the Chroma collection that mirrors it).
- A v1 acceptance scenario for dididecks: lingering client logs in with their Anthropic key, asks "give me a Chroma-style variant of slide 4", agent picks `slide.variant`, generates patch on a branch, user previews and accepts.

When that spec exists, the dididecks implementation prompt follows, then memopop's, then augment-it's — each one adapting the registry, not rewriting the surface.

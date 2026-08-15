---
title: "Quick-Look Window for Source Verification"
lede: "Replace the browser hand-off during source approval with a reusable Tauri WebviewWindow. Arc costs seconds of cold start when it's carrying a day's worth of tabs, and the obvious alternative — an inline iframe — is disqualified by measurement: 14 of 24 real ImmuneCo sources send X-Frame-Options, including NEJM, Lancet, PMC, Science, WHO and Forbes, and cross-origin that failure is silent. A second webview is a top-level navigation, so frame policy never applies; it renders 100% of sources with no browser cold start. ~20 lines across two files plus one capability entry."
date_authored_initial_draft: 2026-08-08
date_authored_current_draft: 2026-08-08
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-08-08
at_semantic_version: 0.0.0.1
status: Draft
publish: false
category: Plan
augmented_with: Claude Code on Claude Opus 5 (1M context)
authors:
  - Michael Staton
tags:
  - Plan
  - Memopop-Native
  - Tauri
  - Source-Curation
  - Quick-Look
  - X-Frame-Options
from: "memopop-ai"
from_path: "context-v/plans/Quick-Look-Window-for-Source-Verification.md"
---
# Quick-Look Window for Source Verification

> Extends [[Constraining-Memo-Writing-to-an-Approved-Source-Set]] Phase 4 — the approval surface shipped 2026-08-06. Operator friction: **Open** hands off to Arc, which is slow to surface when loaded with a day's tabs, and all the analyst needs is "is this real content".

## The measurement that decides the design

The instinct is an inline iframe. It is wrong, and not marginally. Probing the first 24 real sources in `io/humain/deals/ImmuneCo/inputs/Sources.md`:

```
FRAMEABLE: 10    BLOCKED: 14    (of 24)

BLOCKED  nejm.org · thelancet.com · science.org · pmc.ncbi.nlm.nih.gov
         who.int · epa.gov · forbes.com · finance.yahoo.com
         healthcareitnews.com · hklaw.com · klgates.com · bvp.com · moldco.com
OK       cbinsights.com · qz.com · fiercehealthcare.com · cdc.gov · seekingalpha.com …
```

**58% refuse framing, and they are the institutional sources most worth verifying.** Three compounding problems:

1. `X-Frame-Options: DENY | SAMEORIGIN` on the majority, plus `frame-ancestors 'self'` CSP on several (yahoo, klgates, who.int).
2. The failure is **silent** cross-origin — no reliable `onerror`, no readable `contentDocument`. You cannot detect the blank box to show a fallback, so the UI would lie.
3. Several "frameable" ones answered 403 to a plain probe (businesswire, seekingalpha, cdc.gov) — bot-blocking that may render a challenge page rather than the article.

Tauri is not the constraint: `app.security.csp` is `null`, so `frame-src` is unrestricted. The refusal is entirely the publishers'.

## The design

A **reusable, labelled `WebviewWindow`**. Loading a URL in a second webview is a *top-level navigation*, so frame policy does not apply — every source renders, including the 14 that refuse iframes. WebKit is already resident in the process, so there is no browser cold start.

Reuse is the important part: clicking through 79 candidates must not spawn 79 windows. One label (`quick-look`); if it exists, navigate it and focus; if not, create it.

```ts
// SourceApproval.svelte
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

async function quickLook(url: string) {
  const existing = await WebviewWindow.getByLabel('quick-look');
  if (existing) {
    await existing.emit('navigate', { url });   // or close+recreate; see Decision 2
    await existing.setFocus();
    return;
  }
  const w = new WebviewWindow('quick-look', {
    url,
    title: 'Quick look',
    width: 1100,
    height: 900,
    center: true,
  });
  w.once('tauri://error', () => { /* fall back to openUrl(url) */ });
}
```

### Capability wiring (the non-obvious bit)

`src-tauri/capabilities/default.json` currently scopes everything to `windows: ["main"]`. Two additions:

1. `core:webview:allow-create-webview-window` on the main window's capability.
2. A capability entry covering the `quick-look` label, or the window gets created with no permissions and cannot talk back.

Both permissions already exist in the generated schema (`core:webview:allow-create-webview-window`, `core:window:allow-close`) — nothing to install.

### Where it hangs in the UI

Replace the current title-click behavior in `SourceApproval.svelte`. **Keep `openUrl` available** as a secondary action — sometimes the analyst genuinely wants the page in a real browser with their extensions, logins, and paywall subscriptions. Proposal:

- **Title click** → quick-look window (the common case).
- **Open ↗** small action → the system browser (the escape hatch, and the fallback when `tauri://error` fires).

## Non-goals

- Not a reader, not an annotator, not a screenshot tool. It renders a URL and closes.
- No content extraction — that is **Preview**'s job (server-side Jina fetch), which already works on 100% of sources precisely because no browser policy is involved. The two are complements: quick-look answers *"what does this look like"*, preview answers *"what does it say"*.
- No session/cookie sharing with the analyst's browser. Paywalled sources will show their paywall — which is itself useful signal, and exactly what the `VERIFIED_GATED` verdict already records.

## Decision points

1. **Window vs. tab-strip.** One reused window is the v1. If the analyst wants two sources side by side, that is a second window with a different label, not a redesign.
2. **Navigate vs. recreate.** Tauri 2's API for re-pointing an existing webview at a new URL is more awkward than closing and recreating. Recreating is ~instant and dodges history/state carry-over between unrelated sources. Lean: **close + recreate**, measure, revisit only if it flickers.
3. **Does quick-look mark the source as looked-at?** Tempting — a `viewed_at` stamp would let the UI grey out what has been eyeballed. But it conflates "I looked" with "I judged", which is the same category error the machine-verdict split just corrected. Lean: **no**, keep viewing free of consequence.
4. **Kill it on stage exit?** A quick-look window outliving the approval surface is confusing. Lean: close it when `SourceApproval` unmounts.

## Acceptance

- Clicking a title on a **frame-blocked** source (nejm.org, who.int) renders the real page — the case an iframe cannot do at all.
- Clicking a second title reuses the same window rather than opening another.
- With the sidecar down, quick-look still works (it is a direct navigation, nothing to do with the API).
- If window creation fails, the click falls back to `openUrl` and the analyst still gets the page.
- Closing the approval surface leaves no orphan window.

## Cross-references

- [[Constraining-Memo-Writing-to-an-Approved-Source-Set]] — the surface this extends.
- [[Sources-Curation-UI-Tool]] — the standalone tool whose Jina preview became **Preview**.
- `agent-skills/source-with-extracts-md` — the two-tier fetch lifecycle that governs what preview *content* is for; quick-look deliberately stays outside it (viewing is not capture).

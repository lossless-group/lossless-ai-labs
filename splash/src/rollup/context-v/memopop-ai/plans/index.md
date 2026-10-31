---
from: "memopop-ai"
from_path: "context-v/plans/index.md"
---

# Plans

* [Add People Crawl Command to MemoPop Native](Add-People-Crawl-Command-to-Memopop-Native.md) - Wire the orchestrator's `extract_team_roster` command into the MemoPop Native UI as a per-investor button — and as a batch action that runs it 5–20 times per memo, once for each co-investor in the round.
* [Constraining Memo Writing to an Approved Source Set](Constraining-Memo-Writing-to-an-Approved-Source-Set.md) - Every gate in the pipeline tests whether a URL resolves; none tests whether it was approved. Adds the missing membership predicate.
* [Generate DD Questions & Checklist](Generate-DD-Questions-&-Checklist.md) - Some users don't want the memo — they want the gaps phrased as questions to carry into founder meetings. Same pipeline, different artifact.
* [In-App Chat Surface for MemoPop Native — A Plan](In-App-Chat-Surface-for-Memopop-Native.md) - A Svelte chat drawer for MemoPop Native: a sidecar `/chat/turn` routes each turn to answer, propose, or invoke over the app's own verbs.
* [Include Validation Analysis as Action Items](Include-Validation-Analysis-as-Action-Items.md) - A 200 proves a server answered — not that the page isn't a paywall, or says what the memo claims it says. Hand the residue to a human.
* [Metadata on Paste — Make an Added Link Name Itself](Metadata-On-Paste-For-Source-Curation.md) - The fetch and the parse already work — the metadata just never reaches the row, so a pasted a16z article displays as `a16z.com`.
* [Quick-Look Window for Source Verification](Quick-Look-Window-for-Source-Verification.md) - 14 of 24 real sources send `X-Frame-Options`, so source preview gets its own Tauri WebviewWindow rather than an inline iframe.
* [Sources Curation UI — A Local Tool for Converging a Sources.md](Sources-Curation-UI-Tool.md) - A single-file local tool bound to one `Sources-aggregated.md`: edit, preview via Jina, re-search via SearXNG, save `inputs/Sources.md`.
* [Streams and a Stream-Index for the Sources Curation UI — A Plan](Streams-and-a-Stream-Index-for-the-Curation-UI.md) - A recurring publisher like `rockhealthcapital.com/insights/` is a stream, not a citable source — it belongs in `stream-index.md`.
* [Team and People Metadata Ingestion](Team-and-People-Metadata-Ingestion.md) - Six phases to take any company URL → structured TeamRoster JSON the MemoPop app can render as cards. Each phase ships independently and is verifiable on its own.
* [Upgrade the MemoPop AI splash with three-mode theming, context-v rollup, peer-aware discovery, and Pagefind](Upgrade-Memopop-Splash-with-Themes-Context-V-and-Pagefind.md) - Brings the pre-convention memopop-site up to the splash bar: three-mode theming, a context-v rollup, peer-dir discovery, and Pagefind.

---
from: "memopop-ai"
from_path: "context-v/explorations/index.md"
---

# Explorations

* [Crawl for Better Team Structured Output](Crawl-for-Better-Team-Structured-Output.md) - The orchestrator writes prose about teams but never returns the structured roster the app needs to render cards: names, titles, photo URLs.
* [Curating Only Valid Sources Across Runs](Curating-only-valid-Sources-across-Runs.md) - Downstream curation cannot fix what `citation_enrichment.py` invents upstream — 65 fabricated `example.com` URLs in a single run.
* [Grill Me: A Per-Section User-Input Moment in MemoPop Runs](Grill-Me-Per-Section-User-Input-Moment.md) - A pause-point where MemoPop grills the user — the competitive section's synthesis frame is a judgment the model shouldn't make alone.
* [Human-Curated Source Sets and Per-Firm RAG for Memo Narrative](Human-Curated-Source-Sets-and-Per-Firm-RAG-for-Memo-Narrative.md) - Keep Perplexity's take as quarantined commentary and route real research through validated harvesters plus a per-firm standing RAG store.
* [MemoPop as a Claude Connector](MemoPop-as-a-Claude-Connector.md) - Clients won't open our app. They'll ask Claude, and Claude will reach their deals, sources, and memo history through a connector.
* [Moving an Agent Orchestrator to an API](Moving-an-Agent-Orchestrator-to-an-API.md) - The orchestrator is a Python CLI today. To plug it into memopop-native, we need an HTTP-shaped surface. Three options, ranked by effort and time-to-value.
* [Separating Retrieval from Generation in Agent Pipelines](Separating-Retrieval-from-Generation-in-Agent-Pipelines.md) - An agent that both searches the web and writes the prose fabricates URLs — 65 `example.com` links in a single memo run.
* [Where Investor-Firm Rosters Live](Where-Investor-Firm-Rosters-Live.md) - When a deal artifact bundle includes the investor's team roster, where does that roster live? Inside the deal folder it duplicates on every co-investor; in a global firms index it loses deal context. Stub for a real exploration.

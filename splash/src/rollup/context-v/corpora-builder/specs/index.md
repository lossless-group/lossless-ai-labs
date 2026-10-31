---
from: "corpora-builder"
from_path: "context-v/specs/index.md"
---

# Specs

* [Binary Ingest and the bin/ Store — one copy, optimized, fetched on demand](Binary-Ingest-And-Bin-Store.md) - 78 files are 90.5% of the corpus bytes. Compress once, store once by hash, fetch when asked, delete locally without fear.
* [Browse Corpus — a screen for the work that already exists](Browse-Corpus.md) - The first surface: read-only over reach-edu's 892 existing files. Pulled out of Phase 7 because Tauri was never the cheapest first screen.
* [Capture From The Screen — the surface stops being a viewer](Capture-From-The-Screen.md) - Paste a URL and watch it get filed. Writing is opt-in at the server (`--writable`) because the first corpus this screen saw was a client's.
* [Capture, Link-First — the first command that pays for itself](Capture-Link-First.md) - `corpora add <url>` fetches, names, dedupes, and files a link as a source — metadata-only by default, because bulk enrichment goes haywire.
* [Corpus Change Feed — what changed in a client's corpus, and why](Corpus-Change-Feed.md) - A change record any history engine can emit, and a feed that renders it for someone who will never read a diff.
* [Corpus Tree](Corpus-Tree.md) - A corpus is a folder the client can't see. The tree is built from keys alone, so showing 944 files costs zero reads.
* [Domain Navigation](Domain-Navigation.md) - 112 folders in a dropdown is a list you scroll, not a list you use. Type any near-match; backspace walks back a segment at a time.
* [Header Chrome](Header-Chrome.md) - The workspace becomes a switcher, not a label. The mode toggle shows one icon and says what the next click gets you.
* [Loop Harness — the ledger that lets an agent run unattended](Loop-Harness.md) - Spec IDs bind to test functions, status is derived by running the suite, and a promise with no test is a build failure.
* [Ranked Search — Pagefind over the manifest](Ranked-Search.md) - Substring matching cannot rank, stem, or take two words in any order. Pagefind can. It indexes the manifest, and never replaces it.
* [Search Index — the manifest that stops search reading the corpus](Search-Index.md) - A search opens every file: 845 reads, up to 5.8 seconds. A manifest in the corpus makes it one, and closes the gap FOCUS-07 named.
* [Source-File Model — the schema becomes code, and two silent failures become loud](Source-File-Model.md) - The schema as a round-tripping dataclass — the stray `---` that hid 13 of ImmuneCo's 93 sources is now a hard error, not a silent one.
* [Storage Seam — one interface, three implementations, and the workspace that names the bucket](Storage-Seam.md) - A CorpusStore over local, R2, and cache, proven by one conformance suite that runs against every backend with no test-side branching.
* [Strategy Focus](Strategy-Focus.md) - A strategy chip narrows the list and compounds with search. The corpus count rides alongside, so a subset always says what it is a subset of.
* [Spec template](_TEMPLATE-Spec-With-Tests.md) - The template a new spec is copied from, not a spec itself.

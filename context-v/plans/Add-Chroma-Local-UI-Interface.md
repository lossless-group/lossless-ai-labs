---
title: "Add a Chroma Local UI Interface"
lede: "Local Chroma in PersistentClient mode is an embedded SQLite library with no UI of its own. Three paths to a browseable surface — from a 30-line inspect script tonight to a /chroma route in the splash later — laid out in increasing commitment."
date_created: 2026-05-08
date_modified: 2026-05-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.1
tags:
  - Plan
  - ChromaDB
  - UI
  - Splash-Page
  - Inspection-Tooling
status: Draft
---

# Add a Chroma Local UI Interface

## What this plan is for

We hear "Chroma is running" and reach for a browser. **Local Chroma in `PersistentClient` mode isn't actually running anything browseable** — it's an embedded SQLite library that gets opened, written, and closed by every Python process that imports it. The MCP server (`chroma-core/chroma-mcp`) is "running" only in the sense that Claude Code spawns it as a stdio subprocess on demand; nothing is bound to a port.

So the literal question — "how do I open it?" — has no native answer. This plan documents three routes to actually *see* what's in Chroma, in increasing build cost. Pick one (or sequence them).

## Path A — `scripts/inspect-chroma.py` (≈30 lines, do tonight if needed)

A throwaway-ish CLI that:
- Lists every collection with size + metadata description
- For one chosen collection, prints the first N documents (id, source path, content preview)
- Runs an ad-hoc query: `python inspect-chroma.py --query "..."`
- Doesn't fight the MCP server's lock — opens a `PersistentClient` against the same `.chroma/` dir read-only

Not a UI; a stdout-based browser. Right answer when the question is "did the ingest land what I expected?" and not "I want to scroll through this visually."

**Build cost:** 30 minutes including a couple of CLI flags. Lives at `context-vigilance-kit/scripts/inspect-chroma.py`. Throwaway when Path C lands.

## Path B — `chroma run` server + community admin UI

Run Chroma in HTTP-server mode against the same `.chroma/` data directory, then point a community admin UI (chroma-admin, vector-admin, others) at the local server.

```bash
chroma run --path /Users/mpstaton/code/lossless-monorepo/ai-labs/context-vigilance-kit/.chroma --port 8000
```

Tradeoffs:
- **Concurrency caveat.** SQLite-backed PersistentClient + a separate `chroma run` process can both want write-locks on the same database. Read-only inspection while the server is up is fine; running the corpus ingester or the (forthcoming) transcript ingester while the server is up risks lock contention. Either keep the server up only for inspection sessions, or migrate to "always-on server mode" and reconfigure the MCP from `--client-type persistent` to `--client-type http`.
- **No bundled UI.** `chroma run` ships an HTTP API, not a web frontend. The community admin tools are separate installs and have varying freshness.
- **Operational drift.** A long-running local server is one more process to babysit. For a small team, this matters.

**Build cost:** 1-2 hours including evaluating which community admin tool currently works against Chroma 1.5.x. May be brittle as Chroma's API evolves between minors.

## Path C — `/chroma` route in the splash (the proper Lossless answer)

The kit's splash is already an Astro 5/6 site that builds against the corpus. Add a `/chroma` route — or a section of `/`, or a sibling page — that:
- Lists collections (sizes, last ingested, schema)
- Surfaces sample documents per collection with their metadata
- Provides a search input that calls a small endpoint or uses Pagefind for keyword search and a Chroma-backed semantic query for similarity
- Plays nicely with the splash's existing dark/light/vibrant theme contract per the [[theme-system]] skill

Two implementation options inside the splash:
- **Build-time data fetch.** A loader queries Chroma during `astro build`, materializes a JSON snapshot, the page renders the snapshot statically. Works for inspection; doesn't support live querying.
- **Runtime API.** A small adapter (Astro endpoint or a sibling Bun/Python service) exposes Chroma queries over HTTP; the splash hits it client-side. Supports live similarity search; introduces "is the local server running?" coupling.

Recommend: **build-time data fetch first** for inspection (fast, static, no concurrency). Layer runtime API in v1 if/when the splash itself becomes the canonical inspection tool.

**Build cost:** 2-4 hours for the build-time variant including layout + theme integration. More if we want runtime querying.

## Recommended sequence

| When | Path | Why |
|---|---|---|
| Tonight if needed | A — `inspect-chroma.py` | Fastest visibility; no commitment; throwaway |
| When the splash gets v0.1 polish | C — `/chroma` route, build-time | Right Lossless aesthetic; reuses existing splash plumbing; doubles the splash's value |
| Skip B unless we go server-mode anyway | B — `chroma run` + admin tool | Only worth it if we migrate the MCP to HTTP client mode for other reasons (collaborator sharing, etc.) |

In other words: A is a stopgap, C is the proper home, B is a lateral move we don't need.

## Open sub-questions

- **Where does the inspection live in the menu?** A `/chroma` route is one answer; making it a panel on the catalog index (`/`) is another. Decide during Path C build.
- **Does the splash need to render *transcript* collections too** once the [[Write-Custom-Chroma-MCP-Server]] ingester ships? Probably yes — but transcripts have privacy implications even after redaction. Maybe transcripts get an *unpublished* preview-only route, never deployed to GitHub Pages. Settle when the transcript ingester is real.
- **Pagefind vs. Chroma for the splash search box.** Pagefind is the standard splash convention (keyword); Chroma is what we just installed (semantic). They're complementary. Both probably belong in v1: keyword default, "semantic search" toggle.
- **Does inspect-chroma.py belong in the kit forever, or get deprecated when /chroma lands?** Lean: deprecate, leave a redirect note.

## Cross-references

- [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] — parent exploration; UI inspection was implicit in Track 3 but never spec'd
- [[Collate-Context-Files-into-Context-Vigilance-as-Repo-&-Project]] — the splash is Track 2, this plan extends it
- [[Write-Custom-Chroma-MCP-Server]] — sibling plan; the transcript ingester will need this UI to verify it's working correctly
- [[maintain-splash-pages]] skill — the convention reference for any work in `splash/`
- [[theme-system]] skill — token contract any new splash route must follow
- `context-vigilance-kit/splash/src/pages/` — where the new route would live
- `context-vigilance-kit/.chroma/` — the persistent data directory

## Outcome

*(Open. Update when Path A or Path C ships — or when we discover a fourth path that obsoletes both.)*

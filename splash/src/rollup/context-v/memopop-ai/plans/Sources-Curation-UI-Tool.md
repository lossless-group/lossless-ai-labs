---
title: "Sources Curation UI — A Local Tool for Converging a Sources.md"
lede: "A small, disposable, single-file local web tool that binds a curation UI to one Sources-aggregated.md: page through each source, edit its metadata, delete/reorder, preview its content via Jina, type a new search term and fire SearXNG, and pull relevant results back into the list. Reuses the orchestrator's existing src/curation parsing + fetch; adds no dependencies. Saves a converged inputs/Sources.md (backed up, never clobbering the worksheet). Built for the immediate ImmuneCo curation, refactor-friendly later."
date_authored_initial_draft: 2026-06-27
date_last_updated: 2026-06-27
date_created: 2026-06-27
date_modified: 2026-06-27
at_semantic_version: 0.0.0.1
status: Draft
category: Plan
augmented_with: Claude Code on Claude Opus 4.8 (1M context)
authors:
  - Michael Staton
tags:
  - Plan
  - Source-Curation
  - Tooling
  - SearXNG
  - Jina
  - MemoPop-Orchestrator
  - Sources-Md
related_skills:
  - sources-md-curation
  - context-vigilance
from: "memopop-ai"
from_path: "context-v/plans/Sources-Curation-UI-Tool.md"
---
# Sources Curation UI — A Local Tool

> The immediate, focused build behind the [[Source-Curation-Gate]] pattern — scoped to **one file** at a time, not the full per-app surface. First target: `io/humain/deals/ImmuneCo/outputs/ImmuneCo-v0.0.3/Sources-aggregated.md` (57 sources, many flagged 403/timeout). Disposable by design; if it earns its keep we refactor it toward the gate. Composes with [[sources-md-curation]] (the lifecycle this tool drives).

## Goal

A local web UI that lets the analyst converge an aggregated source list into a final `inputs/Sources.md`, by:

1. **Navigating** each source (list + focus pane).
2. **Editing** metadata: title, publisher, published_date, url, sections, rank, sensitivity, note.
3. **Pruning / reordering**: delete, move up/down, add a blank entry.
4. **Previewing content**: fetch the source via Jina on demand (read-only).
5. **Searching**: type a new query, fire **SearXNG**, see results, **add** any result into the list.
6. **Saving**: write a converged `inputs/Sources.md` (backed up), optionally flipping `mode: codified`.

Non-goals (v0): storing per-source fetched content/extracts (that's the per-source-with-extracts file, a later refactor), embedding-based relevance scoring, multi-file/global pool, auth, packaging.

## Shape

One Python file: `apps/memopop-orchestrator/tools/curate_sources.py` — a FastAPI app serving an embedded no-build HTML/JS page. Run with the orchestrator venv; opens on `localhost:8770`. Reuses `src/curation/sources_md.py` (`parse_frontmatter`) and `src/curation/fetch.py` (`fetch_url_markdown`). No new dependencies (FastAPI, uvicorn, httpx, pyyaml already present).

```
GET  /                 → the single-page UI
GET  /api/sources      → { file, meta, sources[], body }   (parsed from the target file)
POST /api/save         → { meta, sources[], body, mode, target } → writes inputs/Sources.md (+backup)
POST /api/search       → { query } → SearXNG JSON proxy → normalized results[]  (or disabled msg)
POST /api/fetch        → { url } → Jina preview { title, markdown (truncated), via }
```

## Data handling (the careful parts)

- **Parse raw, not via `load_sources_md`.** That loader maps to `SourceEntry`, which *drops* `title`/`publisher`/`published_date`. The tool uses `parse_frontmatter()` to keep the full per-source dict.
- **Preserve `# verdict:` signal.** Verdicts (and `# cited in N`) live as YAML *comments*, which `yaml.safe_load` discards. A regex pass extracts `url → verdict` from the frontmatter text and attaches it to each source, so the UI can flag the 403/timeout/error entries (the junk to prune). On save they're written back as real `verdict:` fields (no longer lossy comments).
- **Canonical field order on serialize:** `url, title, publisher, published_date, sections, rank, sensitivity, verdict, note` via `yaml.safe_dump(sort_keys=False, allow_unicode=True)`. Top-level meta keys (`mode, deal, firm, dates, at_semantic_version, curated_by, augmented_with`) preserved; body (How built / Excluded / Open questions) preserved verbatim.
- **Save target default = `<deal>/inputs/Sources.md`** (deal dir derived as `file.parents[2]`). If it already exists, back it up to `Sources.md.bak-<timestamp>` first. The aggregated worksheet is **never overwritten** unless `target: "inplace"` is explicitly chosen.
- **Mode toggle:** save payload carries `mode`; UI defaults to leaving it `aggregated`, with an explicit "Save as codified" action that sets `mode: codified` (the [[sources-md-curation]] promotion step).

## SearXNG

- Base URL from `SEARXNG_URL` env (augment-it's stack publishes `searxng:8080` internally; host needs a published port). Call `GET {SEARXNG_URL}/search?q=...&format=json` (JSON format must be enabled in the instance's `settings.yml`).
- **Graceful degradation:** if `SEARXNG_URL` is unset or the instance is unreachable, `/api/search` returns `{ ok: false, reason }` and the UI shows a "set SEARXNG_URL to enable search" notice. Everything else (nav/edit/delete/save/preview) works without it.

## Run

```bash
cd apps/memopop-orchestrator
source .venv/bin/activate              # or use .venv/bin/python directly
export SEARXNG_URL=http://localhost:8080   # optional; enables the search panel
python tools/curate_sources.py \
  --file io/humain/deals/ImmuneCo/outputs/ImmuneCo-v0.0.3/Sources-aggregated.md \
  --port 8770
# → open http://127.0.0.1:8770
```

`--file` defaults to the ImmuneCo aggregated path. `tools/curate_sources.py` inserts the orchestrator root on `sys.path` so `src.curation` imports resolve when run as a script.

## Safety & boundaries

- The target file is inside the **firm-private submodule** `io/humain/` — editing it *is* the analyst task here; commits land in that submodule's history (don't bump the parent gitlink as a side effect, per [[feedback_submodule_propagation]]).
- Always-backup before write; never overwrite the aggregated worksheet by default.
- Tool is host-local (`127.0.0.1` only).

## Refactor path (later, if it earns it)

- Per-source content + LFM extracts → the per-source-with-extracts file ([[source-with-extracts-md]] / the gate).
- Multi-search capture folders + dedup pool (the `_search.md` design).
- Graduation into the [[In-App-Chat-Surface-for-Memopop-Native]] surface as `source.*` verbs, rather than a standalone tool.

## Acceptance

- Loads all 57 ImmuneCo sources with titles + verdicts visible; error-verdict entries visually flagged.
- Edit a title/sections/rank, delete one, reorder one → Save → `inputs/Sources.md` written, backup present, file re-parses cleanly (`load_sources_md` returns it; count matches).
- With `SEARXNG_URL` set: a query returns results; "add" inserts one into the list and it survives Save.
- Without `SEARXNG_URL`: search panel shows the notice; all other features work.

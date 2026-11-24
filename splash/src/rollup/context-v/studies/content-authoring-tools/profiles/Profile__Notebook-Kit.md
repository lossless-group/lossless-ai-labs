---
name: Notebook Kit Profile
title: Notebook Kit — Profile
slug: notebook-kit
upstream: https://github.com/observablehq/notebook-kit
pinned_sha: 28b4701
pinned_date: 2026-11-22
version_at_pin: "v2.11.0-7-g28b4701 (seven commits past v2.11.0)"
license: ISC
maintainer: Observable, Inc.
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/notebook-kit
profile_kind: Notebook file format (HTML) + CLI / Vite plugin / JS API for preview and static build
date_created: 2026-11-19
date_modified: 2026-11-23
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Reference
site_uuid: 29f2852a-af83-41c8-a159-de0fe9bd16e2
hex_code: thuy9v
lede: >-
  A notebook that is one HTML file of `<script>` tags, where every SQL query and
  Python cell is run once, frozen into a cache file, and shipped as a snapshot.
  It is the cleanest answer in the study to "data the reader can see without
  database access".
summary: >-
  Profile of Observable Notebook Kit as pinned in the content-authoring-tools
  study. It is the HTML-as-file-format entry: a `<notebook>` element holding one
  `<script>` per cell, typed by MIME type (JS, TS, Markdown, HTML, SQL, TeX, DOT,
  Node, Python, R). Covers the format and its serializer, reactivity via unbound
  references compiled onto the Observable Runtime, `${}` interpolation inside
  Markdown and SQL cells, and the build-time caching of query and data-loader
  results into `.observable/cache` so static sites ship snapshots, not
  credentials.
tags:
  - Profile
  - Observable
  - Notebook
  - HTML
  - Reactive
  - SQL
  - DuckDB
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Notebook-Kit.md"
---
# Notebook Kit — Profile

A profile of Observable Notebook Kit as it lives in this study (`studies/content-authoring-tools/notebook-kit`, pinned at `28b4701`, seven commits past `v2.11.0`, 2026-11-22). ISC, TypeScript, from Observable, Inc.

This is the study's **HTML-as-source** entry. It is the open half of "Notebooks 2.0". The closed half is Observable Desktop (macOS) and the hosted platform (`docs/index.html:53-56`).

## TL;DR

A notebook is a plain `.html` file: a `<notebook>` root, an optional `<title>`, and "one `<script>` element per cell" (`docs/kit.html:72-75`). The cell's `type` attribute is its language. The kit gives you `notebooks preview`, `notebooks build`, `notebooks download` (pulls an observablehq.com notebook down as HTML) and `notebooks query` (`docs/kit.html` CLI section), plus a Vite plugin and a low-level parse/transpile API.

**One sentence:** *Notebook Kit makes the notebook a file any text editor, diff tool or agent can handle, and makes data a build artifact: queries run once, are cached as JSON next to the notebook, and readers get the snapshot.*

## How it works

- **Format ↔ model.** `deserialize()` / `serialize()` map HTML to a `Notebook` object and back (`src/lib/serialize.ts:7`, `:32`). The model is small: `NotebookSpec` has `cells`, `title`, `theme`, `readOnly` (`src/lib/notebook.ts:54-63`). `CellSpec` has `id`, `value`, `mode`, `pinned`, `hidden`, `output`, `format`, `database`, `since` (`:72-90`).
- **Twelve cell modes**: `js`, `ts`, `ojs`, `md`, `html`, `tex`, `dot`, `sql`, `sql.view`, `node`, `python`, `r` (`src/lib/notebook.ts:18-30`).
- **Reactivity.** Each JS cell is parsed for top-level declarations and unbound references. `transpile()` turns the cell into a function whose parameters are its `inputs` and which returns its `outputs` (`src/javascript/transpile.ts:104-113`). That function is then defined on the Observable Runtime, which re-runs dependents when an input changes.
- **Template cells.** Markdown, HTML and SQL cells are parsed as tagged template literals, so `${expr}` works inside prose and queries (`src/javascript/template.ts`; the docs use `${tex\`\TeX\`}` inside Markdown, `docs/kit.html:115`).
- **Build.** A Vite plugin renders Markdown/HTML statically and swaps in dynamic content on load (`docs/kit.html` Vite API). Hot updates redefine only cells whose rendered hash changed: "unchanged cells continue running" (`src/runtime/hot.ts:50-53`).

## What's on disk

The canonical hello-world (`docs/kit.html:81-90`):

```html
<!doctype html>
<notebook>
  <title>Hello, world!</title>
  <script type="text/markdown">
    # Hello, world!
  </script>
  <script type="module" pinned>
    1 + 2
  </script>
</notebook>
```

A real SQL cell from the docs, which are themselves notebooks (`docs/databases.html:84-91`):

```html
<script id="3" type="application/sql" pinned="" database="duckdb" output="trips">
  SELECT
    DATE_TRUNC('hour', pickup_datetime) AS date,
    COUNT(*) AS count
  FROM read_parquet("fhvhv_tripdata_2025-06.parquet")
  GROUP BY 1
  ORDER BY 1 DESC
</script>
```

`output="trips"` exposes the result as a variable that the next JS cell passes to Observable Plot. Next to the notebook sits `.observable/`: `databases.json` (credentials), `cache/` (query and loader results), `dist/` (built site) (`docs/databases.html:135-141`).

## Agent reach

**Read and write: yes, as text.** The docs say the format "is intended to be simple, human-readable, and human-editable … easy to review diffs … to search, to find-and-replace" (`docs/kit.html:66`). An agent edits `<script>` bodies and runs `notebooks build`.

- **Gotchas an agent must respect:** four-space indentation is trimmed from every cell line (`docs/kit.html:94`), a literal `</script>` inside a cell must be escaped as `<\/script>` (`:232`), and the optional `id` attribute "gives cells a stable identity for editing" (`:229`).
- **Programmatic:** `deserialize` → edit `Notebook` → `serialize` is a full round-trip API (`src/index.ts:6-7`). `notebooks query --database duckdb '…'` runs a query from the shell.
- **No MCP or AI hook in the kit.** AI is a stated selling point of the proprietary Desktop/web editor (`docs/index.html:80-92`), not of this repo.

## What's clever or unique

**1. HTML as the container, `<script type>` as the cell boundary.** Browsers ignore unknown script types, so the file is valid HTML and safe to open. Editors highlight it without plugins, and each cell is a delimited, attribute-tagged block an agent can address by `id`. Markdown is just one cell type (`text/markdown`) among twelve.

**2. Query results are snapshots by design.** "query results are automatically saved to a `.observable/cache` directory … to ensure that everyone sees the same data, and to enable point-in-time analysis" (`docs/databases.html:25`). The cache file name is a hash of the database name plus the query strings and params (`src/databases/index.ts:96-97`). At build time a SQL cell is rewritten to `FileAttachment("<cache>.json").json().then(DatabaseClient.revive)` (`src/vite/observable.ts:168-182`). To refresh, delete the cache file or click Play in Desktop (`docs/databases.html:31`). `since` sets the oldest acceptable age of a cached result (`src/lib/notebook.ts:89-90`).

**3. Readers never touch the database.** "Notebook Kit builds a static site … which includes the saved query results. Query results can therefore be shared without giving readers access to your database" (`docs/databases.html:147`). If you want live client-side querying, `database="var:db"` points a SQL cell at a browser-side client such as DuckDB-Wasm (`:160`).

**4. Python and R as data loaders, not kernels.** `text/x-python` / `text/x-r` / Node cells run as child processes. Their stdout is piped to a cache file whose `format` (`csv`, `json`, `parquet`, `arrow`, `png` …, `notebook.ts:32-47`) decides how it is read back (`src/vite/observable.ts:191-213`; `docs/data-loaders.html:94`). It is a polyglot notebook with no kernel protocol.

**5. SQL as safe tagged templates.** `sql`, `sql.view`, `sql.ident`, `sql.text`, and per-dialect `sql.variant` build parameterized fragments rather than strings (`src/runtime/stdlib/sql.ts:8-28`).

## Costs / limits

- **Static output means frozen data.** Dynamic queries "are only suitable for use within Observable Desktop, while previewing … or when using a client-side database" (`docs/databases.html:157`).
- **`.observable/` mixes secrets and data.** The docs recommend gitignoring the whole folder (`:135-141`), which also drops the cached results that make a notebook reproducible for anyone else.
- **Indentation-sensitive cells.** Fixed four-space trimming is acknowledged as provisional (`docs/kit.html:94`).
- **The editor is not open.** Desktop and the AI features are proprietary. The kit is the format plus build tooling.
- **No citations, cross-references or numbering.** Markdown cells are rendered Markdown with interpolation, nothing more.

## Relevance to flave

- **Snapshot caching is flave's §7.5 "rung 2" already built.** flave's ladder prefers a "pinned fetch into `data/` … as of send time". Notebook Kit's hash-named `.observable/cache/*.json` plus `since` is a concrete, tested design for that, and for flave's parked `sql` fences: cache the result inside the bundle, keyed on query hash, so a `.flave` renders without DuckDB or credentials.
- **`output=` names a cell's result for downstream use.** That is exactly flave §7.4's `sql name=arr_by_segment` → `vega-lite data=arr_by_segment`. The kit proves this binding works with reactivity on top.
- **Cell `id` as stable identity.** It matches flave's insistence on stable block ids from M0, and it is the same rationale ("stable identity for editing").
- **The counterpoint on syntax.** HTML `<script>` cells are very agent-legible but very un-Markdown. flave stays with LFM directives and fences. The kit is evidence that the cell boundary, not the language, is what makes a document addressable.
- **Separate secrets from data.** Don't repeat `.observable/`'s mix. Keep credentials out of the bundle and keep cached data in it, under clearance.

## Changes since the previous pin (2026-11-19 → 2026-11-22)

`c74943aa13bf` → `28b4701794cf`, 6 commits, no release (still after `v2.11.0`). The file format, the cache and the Vite plugin's cell handling are unchanged.

- **The README now documents the whole format for agents.** It grew from a link to the docs into a self-contained reference: cell types, `<script>` attributes, four-space trimming, data loaders, the `.observable/cache` and `databases.json`, and the CLI (`README.md`, commit `ccd3cb2`, "Help agents when they install notebook-kit").
- **Snowflake key-pair authentication.** `databases.json` entries can set `privateKey`, `privateKeyPath` and `privateKeyPass`, which switch the driver to `SNOWFLAKE_JWT` (`src/databases/snowflake.ts`, `docs/databases.html`).
- **Arrow and Parquet attachments decode 64-bit integers as `BigInt` by default**, and `arrow()` / `parquet()` accept Flechette options to override (`src/runtime/stdlib/fileAttachment.ts`). Code reading large-integer columns from Arrow or Parquet files may see a different type.
- New `Generators.disposable` (`src/runtime/stdlib/generators/disposable.ts`). pnpm users no longer need to install the default fonts by hand (`src/vite/config.ts`), so that step left `docs/kit.html` and its line citations above shifted by six.

## Read next

- `docs/kit.html:64-254`: the file format, written as a notebook
- `src/lib/notebook.ts` and `src/lib/serialize.ts`: the full model and round-trip
- `src/vite/observable.ts:160-215`: how SQL and loader cells become cached file attachments
- `docs/databases.html:20-160`: the caching FAQ, the clearest statement of the snapshot philosophy
- `src/javascript/transpile.ts:95-115`: the inputs/outputs compilation behind reactivity

## Related

- [[Profile__Evidence]]: the opposite bet on data. Evidence moved *away* from build-time snapshots toward live warehouse queries
- [[Profile__mystmd]]: the Markdown answer to executable documents, with kernels instead of reactivity
- [[Profile__Pluto]]: reactive notebooks saved as plain source, the closest sibling in execution model
- [[Profile__Livebook]], [[Profile__Deepnote]]: other open notebook file formats

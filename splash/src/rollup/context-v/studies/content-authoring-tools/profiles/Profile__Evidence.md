---
name: Evidence Profile
title: Evidence — Profile
slug: evidence
upstream: https://github.com/evidence-dev/evidence
pinned_sha: 5e44dad26
pinned_date: 2026-11-22
version_at_pin: "@evidence-dev/bigquery@2.0.12-189-g5e44dad26 (nearest tag is a legacy-era package tag from 2026-02-06; `cli/` and `core/` package.json read 0.0.1)"
license: MIT
maintainer: Evidence (evidence-dev); this repo is a read-only mirror of a larger private repo
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/evidence
profile_kind: Markdown + SQL report format, Bun CLI and SvelteKit renderer, fronting the Evidence Studio SaaS
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
site_uuid: 747dac84-89f1-4409-b068-3b7f0c18d542
hex_code: rohh1n
lede: >-
  Named SQL fences plus Markdoc tags that write their own SQL. The pinned repo is
  a rewrite that abandoned in-browser DuckDB for live warehouse queries, which is
  the exact trade flave's parked `sql` fences have not yet made.
summary: >-
  Profile of Evidence as pinned in the content-authoring-tools study. The pinned
  tree is not legacy Evidence (Svelte components, DuckDB-WASM, `sources/`) but
  "Evidence Studio core": Markdoc `{% tag %}` components, named ```sql fences in
  ClickHouse or a warehouse's native dialect, `{{query}}` composition, SQL files
  addressable by path, and custom components that are themselves Markdown files
  with typed attribute frontmatter. Covers the data-resolution pipeline,
  agent-facing surfaces (CLI `query`/`validate`/`lineage`, Studio MCP, a
  version-controlled `agent/` directory of context and SKILL.md files), and what
  the DuckDB-to-warehouse move means for flave.
tags:
  - Profile
  - Evidence
  - BI
  - SQL
  - Markdoc
  - Reports
  - MCP
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Evidence.md"
---
# Evidence — Profile

A profile of Evidence as it lives in this study (`studies/content-authoring-tools/evidence`, pinned at `5e44dad26a4d`, 2026-11-22). MIT (`LICENSE`: "Copyright (c) 2026 Evidence"). TypeScript/Svelte, with a Bun-built CLI.

This is the study's **Markdown-as-BI-report** entry. Read the pinned tree as a **new product**, not as the Evidence you may remember. `AGENTS.md:7` says "This is a read-only projection of a larger repo", and `docs/migration-guide.mdx:6` draws the line itself: *"Legacy Evidence is a static website generator: Markdown and DuckDB SQL which queries data you package up in a build step. Evidence Studio has a live connection to a database, and an updated set of components that can generate SQL."*

## TL;DR

A page is a `.md` file. SQL lives in named code fences, components are Markdoc tags (`{% line_chart … /%}`), and a component's `data=` can be a table, an inline query, or a `.sql` file path (`docs/core-concepts/markdown.mdx:20-76`). The README now opens: *"Evidence is an agent-ready tool for creating reports using your data"* (`README.md:8`).

**One sentence:** *Evidence is the most agent-ready entry in this group, with Markdown pages, a query CLI, an MCP server and an `agent/` skills folder, and it got there by giving up the self-contained, in-browser data bundle in favor of a live warehouse.*

## How it works

- **Layout.** `core/` (components, query engine, rendering primitives) and `cli/` (the `evidence` CLI that renders reports, built with Bun) (`AGENTS.md`). The CLI wraps a SvelteKit app with a custom adapter (`cli/README.md` architecture diagram).
- **Syntax.** Components use Markdoc syntax (`docs/core-concepts/markdown.mdx:22`). Markdoc config is in `core/src/markdoc/config.ts`. Built-in tags live one folder each under `core/src/user-components/tags/`.
- **SQL engine.** Fences "run the ClickHouse SQL dialect … (unless you are using a Direct connector)" (`markdown.mdx:36`). `defaultDialect = new ClickHouseDialect()` (`core/src/sql-dialect.ts:35`), with dialect classes for Snowflake, BigQuery, Postgres, MotherDuck, Databricks, Redshift, SQL Server, Athena, Fabric and Cube (`:10-20`).
- **Where the data lives.** Either the managed **Evidence Warehouse** (Evidence extracts from about 140 connector pages listed under `docs/data-sources/`, `docs/evidence-warehouse.mdx`), or a `connection.yaml` direct connector for self-hosting/offline work (`docs/cli/connections.mdx`). `evidence serve` self-hosts "no Evidence Studio account … required", but only with a direct connector (`docs/cli/commands.mdx:288-306`).

## What's on disk

Project folders: `pages/`, `queries/`, `components/`, `partials/`, plus a reserved `agent/` (`docs/features/evidence-agent.mdx:35`). A page with a named query and a component, from `docs/core-concepts/markdown.mdx:39-50`:

````markdown
```sql ten_daily_orders
select * from demo.daily_orders limit 10
```

{% table
    data="ten_daily_orders"
%}
````

A real fixture page (`cli/test-environment/pages/order-analysis.md`) shows inputs driving charts, with no SQL written at all:

```markdown
{% dropdown id="channel_filter" data="demo.order_headers"
   value_column="sales_channel" title="Sales Channel" initial_value="All" /%}

{% line_chart data="demo.order_headers" x="date" y="count(*)"
   series="sales_channel" date_grain={{time_grain}}
   filters=["payment_filter"] /%}
```

## Agent reach

**Read and write: yes, as text, and the product is designed around it.** Pages, queries and components are `.md` / `.sql` files in a Git repo. The CLI install docs assume "Claude Code / Cursor etc" (`README.md:22`).

- **CLI for agents:** `evidence query` (json/jsonl/csv output, `--file`, stdin), `tables`, `describe`, `schema`, `lineage --json` (where a table is used across pages, models and queries), and `evidence validate --json` for syntax and SQL errors (`docs/cli/commands.mdx:86-180`). An agent can check its own write before a human looks.
- **MCP:** a **Studio MCP** at `https://evidence.studio/api/mcp` (query data, read published reports, runs as the signed-in user) and a no-auth **Docs MCP** (`docs/mcp/overview.mdx`, `docs/mcp/studio.mdx`). Both are hosted, not in this repo.
- **Agent customization as files:** `agent/context/*.md` is always loaded, and `agent/skills/<name>/SKILL.md` loads on demand. Both are version-controlled with the pages (`docs/features/evidence-agent.mdx:35-53`). Even the migration path is a SKILL.md you hand to your coding agent (`docs/migration-guide.mdx:12-18`).

## What's clever or unique

**1. Components write the SQL.** `{% bar_chart data="orders" x="order_date" y="sum(sales)" /%}` takes a table and an *aggregate expression*. The component generates the query (`core/src/user-components/COMPONENT_SYSTEM.md:21-27`). The resolution pipeline is two stages: interpolate `{{variables}}`, then, if the name matches an inline query or SQL file, substitute it as a parenthesized subquery (`:56-67`). Prose authors get charts without writing `GROUP BY`, and filters compose in as `WHERE` clauses.

**2. Queries compose by reference.** Inside a fence, `{{top_categories}}` inlines another named query as a subquery (`docs/core-concepts/markdown.mdx:53-76`). `data="/queries/orders_by_date"` addresses a `.sql` file by project path, and a leading slash means project root (`docs/features/sql-files.mdx`). Named fences and `.sql` files share one namespace.

**3. User-defined components are Markdown files with a typed schema.** `components/kpi_card.md` becomes `{% kpi_card /%}` (`docs/core-concepts/custom-components.mdx:10`). Frontmatter declares `attributes:` with types `string | number | boolean | column | query | format | sql | date_range | comparison | filter` (`:56`). Types drive autocomplete, and call sites are validated "while you type". A `preview:` block is "the component's built-in test fixture" (`:79-94`). Runtime values flow through, so an input passed to a component "becomes a real filter reference (the query re-runs when the input changes)" (`:70`). There is a `{% html %}` escape hatch with an `evidence.query()` JS SDK, run in a sandbox (`:215`; `core/src/user-components/sandbox/`).

**4. Lineage is a first-class command.** `evidence lineage table orders` answers "where is this table used?" across pages, models and queries, per branch (`docs/cli/commands.mdx:153-168`). That is dependency provenance, not just rendering.

**5. The agent's knowledge ships with the repo.** `agent/context/` replaces org-level custom instructions, so business definitions ("Revenue always means net revenue") are versioned and reviewed like code (`docs/features/evidence-agent.mdx:39-49`).

## Costs / limits

- **Not self-contained.** Data lives in a warehouse, not in the project. The migration guide lists the trade: "Support for one data warehouse only", "SQL written in native dialect not DuckDB", "SQL executes against a backend, not in browser with WASM" (`docs/migration-guide.mdx:34-36`). A page is unreadable as a report without a live connection.
- **Studio gravity.** The managed warehouse, the agent and the Studio MCP are Studio-only (`<StudioOnly />` snippets). `evidence dev` defaults to `evidence login` (`docs/cli/connections.mdx`). Self-hosting works but loses the managed engine.
- **A mirror, not the source.** Contributions go upstream through a sync (`AGENTS.md:7-11`, `copy.bara.sky`). The nearest Git tag predates the rewrite.
- **Narrow genre.** No citations, footnotes or cross-references. It is a reporting format, not a document format.
- **Scalar-only component attributes**: lists must be passed as comma-separated strings (`custom-components.mdx:285`).

## Relevance to flave

- **The named `sql` fence is a convergent design.** Evidence's `` ```sql ten_daily_orders `` and flave §7.4's `` ```sql name=arr_by_segment `` are the same idea. Evidence adds `{{name}}` composition between fences and path-addressed `.sql` files, both worth adopting when the fences are unparked.
- **Evidence left DuckDB-WASM; flave is headed toward it, and the reasons point opposite ways.** Evidence moved to live warehouses because BI wants fresh numbers (`migration-guide.mdx:6`, `:34-36`). flave's thesis is "a document that keeps its workings": the data ships *in* the file. So flave should keep DuckDB-over-`data/` and borrow the cache-the-result snapshot from [[Profile__Notebook-Kit]], not Evidence's live connection.
- **Typed attributes are the missing half of trigger-packs.** A trigger-pack is "a Svelte component plus one line of registration". Evidence's `attributes:` frontmatter (typed, `required`, `default`, `options`, `preview:` fixture) is a declarative schema a pack could carry alongside its component. It gives agents validation and autocomplete without an inverse serializer. Compare MyST's `DirectiveSpec` in [[Profile__mystmd]].
- **Aggregate-expression attributes (`y="sum(sales)"`)** are a good model for flave Figures (§7.6): a figure that names a dataset and an expression, not a full query.
- **`validate --json` and `lineage --json` are the agent loop flave needs**: write, check, see what depends on it. `agent/skills/*/SKILL.md` inside the project is a direct precedent for shipping a document's own agent instructions inside the `.flave` bundle.

## Changes since the previous pin (2026-11-19 → 2026-11-22)

Old pin `b0aa37512924`, new pin `5e44dad26a4d`: 5 commits, no tags in range (this mirror has no release tags for Studio). The Markdown authoring surface, named fences, component-generated SQL, CLI and agent folders described above are unchanged. Small changes worth knowing:

- **Filter state can be quoted in prose.** `table_filter` gains `.literal` (active values as comma-separated text) and `.summary` (an English clause such as *"Region is West or East and Order Total is between 100 and 500"*), usable as `{{orders.summary | all records match}}` in page text (`core/src/user-components/tags/table_filter/schema.ts:133-150`, `docs/components/table_filter.mdx`). Prose that describes its own filters is a pattern a generated report can use.
- **Inline SQL is checked by planning, not running.** The editor's inline-query validation now asks the query engine for a plan instead of executing the query (`core/src/metadata/inline-query-metadata.svelte.ts`, `core/src/user-components/interfaces/query-service.ts`). This is the in-editor counterpart of `evidence validate`.
- Excel exports now keep table formatting (ExcelJS replaced by `hucre`, `core/src/shims/excel/`), and the toolchain moved to Node 24 (`AGENTS.md`).

## Read next

- `docs/core-concepts/markdown.mdx`: the whole authoring surface in one page
- `core/src/user-components/COMPONENT_SYSTEM.md`: how `data=` resolves to SQL
- `docs/core-concepts/custom-components.mdx`: typed attributes, `preview:` fixtures, slots
- `docs/migration-guide.mdx`: the legacy-to-Studio delta, stated by the vendor
- `docs/features/evidence-agent.mdx` and `docs/cli/commands.mdx`: the agent surfaces

## Related

- [[Profile__Notebook-Kit]]: the snapshot-the-data counterpoint (`.observable/cache`), with SQL as a cell type
- [[Profile__mystmd]]: typed directive specs and the scholarly features Evidence lacks
- [[Profile__Deepnote]]: the other data-notebook entry with SQL blocks
- [[Profile__Outline]]: another doc tool whose agent surface is a hosted API/MCP

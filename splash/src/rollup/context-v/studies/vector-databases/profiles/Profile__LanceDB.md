---
name: LanceDB Profile
slug: lancedb
upstream: https://github.com/lancedb/lancedb
package: lancedb (PyPI), @lancedb/lancedb (npm), lancedb (crates.io)
license: Apache-2.0
maintainer: LanceDB Inc. ("LanceDB Devs <dev@lancedb.com>", `lancedb/lancedb`)
study: studies/vector-databases
profile_path: studies/vector-databases/lancedb
profile_kind: embedded vector database + columnar file format
date_created: 2026-05-27
site_uuid: 98f06e5c-1d9a-497a-abea-0236fc99624b
hex_code: p7pens
date_authored_initial_draft: 2026-05-27
date_authored_current_draft: 2026-11-23
lede: >-
  The database *is* the file format: a `.lance` directory DuckDB, Polars, and
  Pandas read with no LanceDB process running.
summary: >-
  Source-cited profile of LanceDB for the vector-databases study, occupying the
  columnar-portability corner of the design space. Covers the Lance columnar
  format as the single storage primitive, Arrow-typed schemas with no payload
  blob, `merge_insert` as the upsert path, DataFusion SQL strings as the filter
  language (the most expressive in the study), RRF hybrid search with pluggable
  rerankers, and the manifest-log versioning that gives `checkout`, tags, and
  `restore`. An agent should read this when the question is disk-format
  portability, migration cost, or querying an embedding store from ordinary data
  tooling — the profile ends with a concrete sketch of what it would look like
  to move the Lossless context-v / changelog / session corpora off Chroma onto
  `.lance` tables, and an honest note that today's workload does not justify it.
publish: true
type: Profiles
title: "LanceDB — Profile"
date_modified: 2026-11-23
authors:
  - Michael Staton
status: Reference
from: "studies/vector-databases"
from_path: "context-v/profiles/Profile__LanceDB.md"
---
# LanceDB — Profile

A profile of LanceDB as it lives in this study (`studies/vector-databases/lancedb/`). Cites pinned paths so you can jump to source rather than trust paraphrase. Read this alongside [[Profile__Chroma]], [[Profile__Qdrant]], [[Profile__Weaviate]], [[Profile__Milvus]], and [[Profile__pgvector]] — the six together define the design space the study is mapping.

## TL;DR

LanceDB is **a thin retrieval layer over the [Lance columnar file format](https://github.com/lance-format/lance)**. The repo's own framing is explicit: "It is a wrapper around Lance. There are two editions: LanceDB Embedded (in-process, like SQLite) and LanceDB Enterprise (a server cluster reached over HTTP)" (`AGENTS.md:1-3`). The core is Rust (`rust/lancedb/`), with PyO3 Python bindings (`python/`), napi-rs Node.js bindings (`nodejs/`), and a Java client (`java/`). All four SDKs are in-process — there is no separate server to run for the OSS path.

The architectural bet, in one image: **the database IS the file format**. A "table" is a `.lance` directory (`rust/lancedb/src/database/listing.rs:42`, `:283` — `LANCE_FILE_EXTENSION = "lance"`), a "database" is a directory of `.lance` directories (`rust/lancedb/src/database/listing.rs:219-237`), every record is an [Apache Arrow](https://arrow.apache.org/) `RecordBatch` row (`rust/lancedb/src/lib.rs:92-97`), and every write produces a new version of the manifest with the old one preserved (`rust/lancedb/src/table.rs:2966-3087`). Vectors are just `FixedSizeList<Float16/Float32>` columns sitting next to whatever scalar columns the schema declares (`rust/lancedb/src/lib.rs:86-88`).

Everything else — IVF_PQ / IVF_HNSW / IVF_SQ / RabitQ for ANN (`rust/lancedb/src/index.rs:108-133`), BTree / Bitmap / LabelList / FM / ZoneMap / NGram / BloomFilter / RTree for scalar prefilter (`rust/lancedb/src/index/scalar.rs:31-205`), BM25 full-text via Lance's inverted index (`rust/lancedb/src/index/scalar.rs:207-211`), Reciprocal Rank Fusion for hybrid search (`rust/lancedb/src/rerankers/rrf.rs:23-43`), object-storage URIs (`s3://`, `gs://`, `az://`) on the same code path as local files (`rust/lancedb/src/lib.rs:66-69`), tags + time-travel checkout (`rust/lancedb/src/table.rs:336-352`, `:3040-3087`) — is **scaffolding around that single columnar primitive**.

If you want one sentence: **LanceDB is what you get when you take Apache Arrow, write it to disk as a versioned columnar file with one column happening to be a vector, and bolt the smallest possible retrieval surface on top — which makes its disk format trivially readable by DuckDB / Polars / Pandas and makes "migrating off" a non-question for anything that already speaks Arrow.**

## Why this exists — the design bet

Every other entry in this study treats *the vector index* as the load-bearing object and *the file on disk* as an implementation detail. LanceDB inverts that. The pinned Cargo manifest names fifteen `lance*` crates pulled directly from `github.com/lance-format/lance` at tag `v15.0.0-beta.28` (`Cargo.toml:22-36`). LanceDB's own Rust crate is no longer small: `rust/lancedb/src/` grew from about 45k to about 155k lines between the May and November 2026 pins (33 top-level files and 18 subdirectories), most of it Enterprise-facing surface (SQL jobs, Functions, materialized views, authz, catalogs). The storage bet below is unchanged. The bet is:

1. **A columnar file format is a better primitive than a vector index.** Vectors are just one column type. Filters, projections, and ANN should be operations on that columnar storage — not bolted on after the fact.
2. **Arrow compatibility is migration insurance.** A `.lance` directory is readable by any Arrow consumer: `to_lance()` returns a `lance.LanceDataset` (`python/python/lancedb/table.py:4652`), and `PyarrowDatasetAdapter` wraps any table as a `pyarrow.dataset.Dataset` (`python/python/lancedb/integrations/pyarrow.py:124`) which DuckDB / Polars / Pandas can scan directly. Compare to [[Profile__Chroma]] where the on-disk SQLite + HNSW binary is opaque outside the Chroma binary.
3. **Embedded-first like [[Profile__Chroma]], but on durable storage.** No server, no daemon — but tables can live on `s3://`, `gs://`, `az://`, `oss://` with the same SDK shape as local files (`rust/lancedb/src/lib.rs:66-69`, `rust/lancedb/src/database/listing.rs:70-79`).
4. **Versioning is a feature of the format, not the app.** Every write is a new manifest; `checkout(version)`, `checkout_tag(tag)`, `restore()`, `list_versions()` are first-class (`rust/lancedb/src/table.rs:3040-3087`). Tags are an explicit `Tags` trait (`rust/lancedb/src/table.rs:336-352`). Since the first pin, tables also have branches (`create_branch`, `checkout_branch`, `table.rs:3393, 3419`) and a `delta(from, to)` API for version-to-version row changes (`table.rs:3004`). Time travel is the load-bearing operational story.

## Storage topology

| Layer | Backend | Purpose | Code |
|---|---|---|---|
| Database | A directory (or `s3://` prefix) | Holds a flat listing of `.lance` table directories | `rust/lancedb/src/database/listing.rs:219-237` |
| Table | A single `.lance` directory | Manifest + data fragments + index files; columnar | `rust/lancedb/src/database/listing.rs:42,283` |
| Vector column | Arrow `FixedSizeList<Float16/Float32>` | One column in the table schema, nothing special | `rust/lancedb/src/lib.rs:86-88` |
| Vector index | IVF_PQ default, or HNSW / IVF_SQ / IVF_RQ / IVF_HNSW_PQ / IVF_HNSW_SQ / IVF_HNSW_Flat / IvfFlat | Side-car index files inside the `.lance` directory | `rust/lancedb/src/index.rs:108-133`; `rust/lancedb/src/index/vector.rs:181-430` |
| Scalar index | BTree (default) / Bitmap / LabelList / FM / ZoneMap / NGram / BloomFilter / RTree | Speeds up prefilter on scalar columns | `rust/lancedb/src/index/scalar.rs:31-205` |
| FTS index | BM25 over a Lance inverted index (re-exported from `lance_index::scalar::FullTextSearchQuery`); tokenizers include `jieba` + `lindera` | Built-in full-text search | `rust/lancedb/src/index/scalar.rs:207-211`; `rust/lancedb/Cargo.toml:46` |
| Manifest history | Lance manifest log inside the `.lance` directory | Versions + tags + branches; supports time travel | `rust/lancedb/src/table.rs:2966-3087` |

There is no separate metadata DB, no SQLite sidecar, no in-memory hash table for IDs. Compare to [[Profile__Chroma]] (SQLite + HNSW binary), [[Profile__Mem0]] (`mem0/memory/storage.py:102-149` SQLite history.db), or [[Profile__Qdrant]] (RocksDB segments). LanceDB has **one** on-disk artifact and the artifact happens to be readable by every Arrow consumer in the ecosystem.

## Schema — typed columns, no payload blob

LanceDB tables are **schema-on-write Arrow tables**. The Rust quick-start makes this explicit:

```rust
// rust/lancedb/src/lib.rs:110-118
let schema = Arc::new(Schema::new(vec![
    Field::new("id", DataType::Int32, false),
    Field::new(
        "vector",
        DataType::FixedSizeList(Arc::new(Field::new("item", DataType::Float32, true)), ndims),
        true,
    ),
]));
```

There is no opaque `payload: JSON` field the way [[Profile__Qdrant]] or [[Profile__Chroma]] expose. If you want a `tags: List[String]` column, you declare it in the Arrow schema and LanceDB knows it's a list-of-strings — which is *why* `LabelList(LabelListIndexBuilder)` (`rust/lancedb/src/index.rs:50-54`) can build a real `array_contains_all` / `array_contains_any` index against it. The Pydantic adapter (`python/python/lancedb/pydantic.py:230-485`, `_py_type_to_arrow_type` through `LanceModel`) projects Pydantic v1/v2 models down to Arrow types — `LanceModel` is the conventional way Python users declare a schema.

Schema evolution is a real operation, not a re-ingest: `add_columns`, `alter_columns`, `drop_columns` are first-class (`rust/lancedb/src/table/schema_evolution.rs`, exported at `rust/lancedb/src/table.rs:101, 137`).

Compare to [[Profile__Weaviate]]: both are schema-typed, but Weaviate's types are GraphQL-flavored and class-oriented; LanceDB's types are Arrow-flavored and columnar. Compare to [[Profile__pgvector]]: both let "structured data live here too", but pgvector inherits the Postgres engine while LanceDB inherits the Arrow ecosystem (DuckDB, Polars, Pandas, Substrait, DataFusion).

## Write policy — append-only, with merge_insert for upsert

The default `add(data, mode="append")` (`python/python/lancedb/table.py:2482`) appends an Arrow batch as a new fragment. Every write produces a new manifest version (`rust/lancedb/src/table.rs:2966`). Old versions are not deleted until `cleanup_old_versions()` runs (`python/python/lancedb/table.py:6318`), which since the first pin is also exposed as cleanup jobs with previews (`rust/lancedb/src/table/cleanup.rs`).

Upsert / update-or-insert / partial-replace use **`merge_insert`**, the SQL-MERGE-shaped operation (`rust/lancedb/src/table/merge.rs:69-175`):

- `when_matched_update_all(condition)` — replace matched rows, optionally gated by an SQL condition like `"target.last_update < source.last_update"` (`rust/lancedb/src/table/merge.rs:130-143`)
- `when_not_matched_insert_all()` — insert what's only in the source (`rust/lancedb/src/table/merge.rs:145-150`)
- `when_not_matched_by_source_delete(filter)` — delete what's only in the target (`rust/lancedb/src/table/merge.rs:159-172`)

The result is a typed `MergeResult { version, num_inserted_rows, num_updated_rows, num_deleted_rows, num_attempts }` (`rust/lancedb/src/table/merge.rs:25-57`) — the `num_attempts` field exposes the optimistic-concurrency retry loop, which is how concurrent writers reconcile (no global lock).

There is also `RTEWriteSpec` for high-write workloads (`rust/lancedb/src/table.rs:357-371`, installed with `Table::enable_rte` at `table.rs:2795`) — a MemWAL path with bucket/identity/unsharded sharding that requires an unenforced primary key. It was called `LsmWriteSpec` at the first pin and was renamed in October 2026 (#4075). This is an explicit acknowledgment that the default file-format write path is read-optimized.

## Recall API

The query surface is uniform across vector, scalar, FTS, and hybrid (`rust/lancedb/src/query.rs:396-570`):

```rust
table.query()
    .nearest_to(query_vec)?            // optional vector search
    .full_text_search(FtsQuery::new("hello world".into()))  // optional FTS
    .only_if("status = 'active' AND year > 2020")          // SQL filter
    .select(Select::Columns(vec!["id".into(), "title".into()]))
    .limit(20)
    .execute()
    .await?
```

**Filter expressivity**: filters are **SQL strings** parsed via DataFusion (`rust/lancedb/src/query.rs:430`). Full SQL expressivity — `=`, `!=`, `>`, `<`, `IN`, `BETWEEN`, `LIKE`, boolean `AND`/`OR`/`NOT`, nested predicates, function calls. There is also a typed `only_if_expr(datafusion_expr::Expr)` for local queries (`rust/lancedb/src/query.rs:455`) and a Substrait `ExtendedExpression` variant in `QueryFilter` (`rust/lancedb/src/query.rs:810-815`). The richest filter surface in this study.

**Prefilter vs. postfilter**: prefilter is the default — the filter is pushed into the ANN traversal, and a scalar index on the filter column accelerates it (`rust/lancedb/src/query.rs:506-530`). `postfilter()` switches to the lossier post-pass (`rust/lancedb/src/query.rs:530`, `:615`).

**Hybrid search** fuses vector results and FTS results via Reciprocal Rank Fusion (`rust/lancedb/src/rerankers/rrf.rs:23-43`, citing Cormack-Clarke-Buettcher SIGIR 2009 with default k=60). The Python `rerankers/` package adds Cohere, Voyage, Jina, ColBERT, cross-encoder, OpenAI, AnswerDotAI, MRR, and linear-combination rerankers (`python/python/lancedb/rerankers/`) — so the BYO-reranker story is real.

**Output**: results are an Arrow `RecordBatch` stream by default; `to_arrow()`, `to_pandas()`, `to_polars()`, `to_pylist()`, `to_pydantic(model)` all work on the same stream (`python/python/lancedb/query.py:1452-1680`). No bespoke result class.

## Versioning, tags, and time travel

Distinguishing feature in this study. Every write increments a `u64` version (`rust/lancedb/src/table.rs:2966`). The full Tags trait (`rust/lancedb/src/table.rs:336-352`) supports `list`, `get_version(tag)`, `create(tag, version)`, `update(tag, version)`, `delete(tag)` — analogous to git tags. `checkout(version)` puts the table into a read-only "detached HEAD" view (`rust/lancedb/src/table.rs:3040`, `:4389` — implemented as `dataset.as_time_travel(version)`), `checkout_tag(tag)` does the same by name, `restore()` (`rust/lancedb/src/table.rs:3080`, `:4473`) makes a checked-out version the new HEAD (the only write allowed in time-travel mode), and `checkout_latest()` returns to normal (`rust/lancedb/src/table.rs:3066`).

`list_versions()` returns the version history (`rust/lancedb/src/table.rs:3085`); the implementation just delegates to the underlying Lance dataset.

This is the answer to "rollback" and "audit trail" without bolting on a separate event log.

## Eviction & compaction

There is no agent-style memory eviction (no TTL, no LRU on records). Compaction is **file-level**, a property of the Lance format. Two operations matter:

- `optimize` (`rust/lancedb/src/table/optimize.rs`, exported `rust/lancedb/src/table.rs:91-92`) — merges small fragments, rebuilds indices over new data, prunes outdated index entries.
- `cleanup_old_versions(older_than, delete_unverified)` (`python/python/lancedb/table.py:6318`) — deletes manifests + fragments older than a cutoff. **Until this is called, time-travel still works.**

The `OptimizeAction` enum (`rust/lancedb/src/table/optimize.rs`, re-exported at `rust/lancedb/src/table.rs:128-131`) lets callers choose `Compact` / `Prune` / `Index` independently. Compare to [[Profile__Chroma]] where compaction is largely implicit and HNSW rebuilds are coarser.

## Scopes & namespacing

LanceDB has two layers of scoping. (1) A "database" is a directory or URI prefix — multi-tenancy by URI is the simplest pattern: `s3://bucket/tenant-a/`, `s3://bucket/tenant-b/`. (2) The `LanceNamespace` abstraction (`rust/lancedb/src/database.rs:23`, `rust/lancedb/src/database/namespace.rs`) adds explicit `namespace_path: Vec<String>` segments inside a database (`rust/lancedb/src/database.rs:53-54`, `:69-70`) — closer to schemas in Postgres or datasets in BigQuery.

There is no first-class per-tenant index isolation (unlike [[Profile__Qdrant]]'s collections-as-tenants pattern). The intended model is "one table = one tenant" or "one URI prefix = one tenant", with namespaces providing logical grouping.

## Operational story

Three deployment shapes, **same SDK surface**:

1. **Embedded / in-process** — `pip install lancedb` (Python), `npm install @lancedb/lancedb` (Node), `cargo add lancedb` (Rust). Path string in, table out. SQLite-like, no daemon (`AGENTS.md:1-3`, which now calls this edition "LanceDB Embedded").
2. **Object storage** — same SDK, but the URI is `s3://`, `gs://`, `az://`, or `oss://`. Cargo features `aws` / `azure` / `gcs` / `oss` gate the relevant object_store backends (`rust/lancedb/src/lib.rs:33-37`). The `storage_options` builder takes credentials inline (`rust/lancedb/src/lib.rs:73-84`). This is the moat — your table lives on durable, cheap, multi-region storage with no compute to provision.
3. **LanceDB Enterprise (remote)** — `db://dbname` URIs, gated by the `remote` Cargo feature (`rust/lancedb/src/lib.rs:38`, `rust/lancedb/src/remote.rs`, `rust/lancedb/src/remote/table.rs`). The REST client is `reqwest`-backed (`rust/lancedb/Cargo.toml:77`). The repo now says "Enterprise" for the server product and keeps "LanceDB Cloud" only for the legacy hosted service (`AGENTS.md:5-9`). The client is OSS; the server is not.

The `docker-compose.yml` in the repo is for **integration tests** (`localstack` for S3, DynamoDB, KMS — `docker-compose.yml:1-15`), not for running LanceDB itself. There is no LanceDB server image in this OSS repo.

## Serialization — the load-bearing claim

The README headlines "Built on the Lance columnar format for efficient storage and analytics" (`README.md:52`). What this actually means in code:

- The format is owned by a sibling repo, `github.com/lance-format/lance`, pinned at `v15.0.0-beta.28` across fifteen crates (`Cargo.toml:22-36`). LanceDB is small *because Lance does the heavy lifting*.
- A table on disk is a directory of Arrow-encoded fragments + a manifest log. The constant `LANCE_FILE_EXTENSION = "lance"` (`rust/lancedb/src/database/listing.rs:42`) is the entire file-extension contract.
- `table.to_lance()` returns a `lance.LanceDataset` directly (`python/python/lancedb/table.py:4652`), and `PyarrowDatasetAdapter` (`python/python/lancedb/integrations/pyarrow.py:124`) lets any `pyarrow.dataset.Dataset` consumer scan a LanceDB table without going through LanceDB. That is the answer to "could a non-AI program parse this": yes — DuckDB's `pyarrow_dataset` scan reads it; Polars' `scan_pyarrow_dataset` reads it (`python/python/lancedb/table.py:5041`); Pandas' `to_arrow().to_pandas()` reads it (`python/python/lancedb/table.py:1682`).
- Query results are `RecordBatch` streams (`rust/lancedb/src/query.rs:4-47`, `rust/lancedb/src/arrow.rs`), not bespoke result objects. There is no serialization layer between "what LanceDB stores" and "what any Arrow tool reads".

This is the checklist item every other entry in this study handles poorly. [[Profile__Chroma]]'s SQLite + HNSW binary is opaque outside the Chroma binary. [[Profile__Qdrant]]'s RocksDB segments are opaque outside Qdrant. [[Profile__Weaviate]]'s LSM segments are opaque outside Weaviate. [[Profile__Milvus]]'s segment files are opaque outside Milvus. [[Profile__pgvector]] is locked inside a Postgres data directory. **Only LanceDB's on-disk form is consumable by general-purpose tooling without the DB binary running.**

## Migration cost

Asymmetric in a way that matters.

**Out of LanceDB → anywhere that reads Arrow**: trivial. `table.to_arrow()` is one call; `table.to_lance()` returns a `LanceDataset` consumable by DuckDB, Polars, Pandas, anything with an Arrow reader. The data is already in the format the rest of the data ecosystem speaks. IDs, vectors, metadata are all just columns.

**Into LanceDB from anything that produces Arrow**: trivial. `db.create_table(name, data)` accepts pyarrow `Table`, `RecordBatch`, Pandas DataFrame, list-of-dict, or a Pydantic `LanceModel` (`python/python/lancedb/table.py:2482`, `python/python/lancedb/pydantic.py`). `data.lance` directories produced by the standalone `lance` library are openable as LanceDB tables directly.

**Into LanceDB from [[Profile__Chroma]] / [[Profile__Qdrant]] / [[Profile__Weaviate]] / [[Profile__pgvector]]**: an export step (the source DB's own dump/scroll API) → Arrow batch → `create_table`. The work is in the source export, not the LanceDB ingest.

**Out of LanceDB to a non-Arrow vector DB**: the source side is `to_arrow()`; the cost lives on the destination side.

Compare to [[Profile__Chroma]] migration: every direction is an ETL. Compare to [[Profile__pgvector]]: migration is "pg_dump + a `CREATE EXTENSION vector`" if the destination is also pgvector; otherwise also an ETL.

## What's inside this submodule

| Path | What's there |
|---|---|
| `rust/lancedb/src/` | Rust core — `lib.rs`, `connection.rs`, `database.rs`, `table.rs`, `query.rs`, `index.rs`, `rerankers.rs`, `embeddings.rs`, `remote.rs`, `arrow.rs`, `expr.rs`, `data/`, `io/`; plus, since the first pin, `sql.rs`, `job.rs`, `function.rs`, `materialized_view.rs`, `view.rs`, `graph.rs`, `catalog.rs`, `authz/`, `dataloader.rs`, `blob.rs` |
| `rust/lancedb/src/index/` | `vector.rs` (IVF_PQ / IVF_HNSW / IVF_SQ / RabitQ builders), `scalar.rs` (BTree / Bitmap / LabelList / FM / ZoneMap / NGram / BloomFilter / RTree / FTS), `waiter.rs` |
| `rust/lancedb/src/table/` | `merge.rs` (`merge_insert`), `add_data.rs`, `delete.rs`, `update.rs`, `optimize.rs`, `cleanup.rs`, `schema_evolution.rs`, `dataset.rs`, `delta.rs`, `computed_columns.rs`, `primary_key.rs`, `datafusion/`, `merge/lsm.rs` |
| `rust/lancedb/src/database/` | `listing.rs` (directory-of-tables), `namespace.rs` (lance-namespace integration) |
| `rust/lancedb/src/remote.rs`, `remote/` | LanceDB Enterprise client (gated by `remote` feature) |
| `python/python/lancedb/` | Python SDK — `db.py`, `table.py`, `query.py`, `pydantic.py`, `schema.py`, `embeddings/`, `rerankers/`, `integrations/pyarrow.py`, `remote/`; plus `sql.py`, `functions.py`, `materialized_view.py`, `graph.py`, `authz.py`, `permutation.py` |
| `python/src/` | PyO3 bindings (Rust ↔ Python) |
| `nodejs/lancedb/`, `nodejs/src/` | TypeScript SDK + napi-rs bindings |
| `java/` | Java client |
| `docs/src/{index.md,python/,js/,java/,embeddings/}` | mkdocs source |
| `dockerfiles/Dockerfile`, `docker-compose.yml` | **Integration-test scaffolding only** (localstack S3/DynamoDB); not a runtime image |

If you read only one file: `rust/lancedb/src/lib.rs` — the top-of-crate doc-tests are the most concise tour of the whole API surface (connect → create_table → add data → create_index → query) and they're code that actually compiles.

## Mental model for using it well

- **Think of the table like a Parquet file with a vector column.** If a Polars or DuckDB user would reach for Parquet, a LanceDB user reaches for `.lance`. The difference is the side-car ANN index and the versioned manifest.
- **Don't put a JSON blob in a column.** The whole point is typed columns that filters and indices can reason about. If you find yourself stuffing payload into a `json: string` column, you're using the wrong DB.
- **Use `merge_insert` for upsert.** `add(mode="append")` is the wrong call when you have natural keys.
- **Use scalar indices liberally.** Prefilter pushes the SQL filter into the ANN traversal; a BTree or Bitmap on the filter column is the difference between fast and slow (`rust/lancedb/src/query.rs:486-490`).
- **Time-travel and tag releases.** `table.tags().create("ingest-2026-05-27", version)` is cheap and is the audit trail you didn't write.
- **Compact periodically.** A million append-only writes leave a million small fragments. `optimize()` + `cleanup_old_versions()` are the maintenance loop.

## When NOT to reach for this

- **You need server-side ACLs, per-row authz, multi-tenant fairness.** LanceDB Embedded keeps security at the object-store / filesystem layer. The client now carries an authorization API (`rust/lancedb/src/authz/`), but it is enforced by the Enterprise server, not by embedded tables. [[Profile__Milvus]] / [[Profile__Weaviate]] have richer authz stories.
- **You need a transactional, joinable RDBMS for everything else.** [[Profile__pgvector]] wins — you get vectors plus the rest of Postgres in one engine.
- **You're committed to a non-Arrow stack** (pure JSON-document orientation, Cypher queries, GraphQL-first). [[Profile__Weaviate]] is GraphQL-native; LanceDB is Arrow-native.
- **You need single-digit-ms p99 ANN at billions of vectors with thousands of concurrent writers.** [[Profile__Milvus]]'s separated compute/storage cluster is the design point.
- **Your data won't fit a typed schema.** If every row really does have a different shape, schemaless [[Profile__Chroma]] / [[Profile__Qdrant]] is the easier fit.

## How LanceDB compares to the rest of this study

| Axis | LanceDB | [[Profile__Chroma]] | [[Profile__Qdrant]] | [[Profile__Weaviate]] | [[Profile__Milvus]] | [[Profile__pgvector]] |
|---|---|---|---|---|---|---|
| **Storage primitive** | `.lance` columnar dir | SQLite + HNSW binary | RocksDB segments | LSM segments | Object-storage segments | Postgres heap |
| **Schema** | Arrow, typed | Schemaless | Schemaless + payload | GraphQL classes | Schema-on-write | SQL columns |
| **Default ANN index** | IVF_PQ | HNSW | HNSW | HNSW | HNSW (pluggable) | HNSW / IVFFlat |
| **Filter language** | SQL (DataFusion) | `$eq/$gt/$in/$and/$or/$not` | typed JSON predicate | GraphQL `where` | bool expression | full SQL |
| **Filter push-down** | Prefilter default, postfilter opt-in | Pre/post | Push-into-ANN | Pre/post | Pre/post | Index-driven |
| **Hybrid retrieval** | RRF built-in + pluggable rerankers | Search primitives (Cloud) | Sparse + dense | Module-based | Hybrid pipelines | Manual |
| **Deployment** | Embedded + S3/GCS + Cloud | Embedded + server + Cloud | Embedded + server + cluster | Server + cluster | Distributed only | Postgres extension |
| **Versioning** | Native (manifest log + tags) | None | Snapshot/backup | None | None | PITR via base Postgres |
| **Non-DB tools can read disk?** | **Yes — any Arrow consumer** | No | No | No | No | Yes via SQL |
| **License** | Apache-2.0 | Apache-2.0 | Apache-2.0 | BSD-3-Clause (enterprise `wl/` tree since v1.40) | Apache-2.0 | PostgreSQL |

## How this compares to the Lossless Group's actual workflow

The Lossless Group's local Chroma instance (`ai-labs/context-vigilance-kit/`) ingests four kinds of corpus: `context-v/` files, `changelog/` entries, Claude session transcripts, and tool traces — all of which are **already text-with-metadata**, all of which are *already* candidates for grep, sort, group-by, and ad-hoc SQL. The current setup makes the embedding store opaque to anything that isn't Chroma.

LanceDB's columnar bet maps onto that workflow precisely:

- A `context_v.lance` table with columns `(repo_slug, source_path, section, body, embedding, modified_at)` could be queried via the LanceDB SDK *and* `duckdb.sql("SELECT repo_slug, count(*) FROM 'context_v.lance' GROUP BY 1")` without the LanceDB binary running.
- A `claude_sessions.lance` table with `(session_id, ts, role, content, embedding, tool_name)` could be sliced by time / role / tool in DuckDB or Polars for the same kinds of "what did I do last week" queries the `search-lossless-corpus` skill answers, without booting an embedded vector engine.
- Versioning via `tags().create("ingest-${date}", version)` matches the ingest-as-a-discrete-event shape `ingest-all.sh` already produces.

For the workflow where the consumer is a human reading markdown plus an agent running RAG, the "non-AI program can parse it" property is not theoretical — it's the difference between *querying our own corpus the way data engineers query data* vs. *getting it back through one specific MCP server*.

That said, the migration question this study scopes is "what would we give up if we left [[Profile__Chroma]]?" — and the honest answer for our scale is *application ergonomics, dashboard UI in Chroma Cloud, and the muscle memory of `chromadb.PersistentClient`*. Whether that trade is worth the columnar-portability story depends on whether we ever actually want to query our embedding store from DuckDB. Today we don't. Tomorrow, when we want to join changelog metadata against session transcripts and pivot by tool name, we might.

## Changes since the previous pin (2026-05-26 → 2026-11-23)

Pin moved from `a9f49c815063` (nearest tag `python-v0.33.0-beta.1`) to `b5ec7d6af433`: 1,167 commits. LanceDB moved to one version number across its SDKs; stable releases in range run from **v0.33.0** (2026-07-28) through **v0.38.0**, **v0.39.0**, **v0.40.0**, and **v0.41.0** (2026-10-29), and this pin is tagged **v0.42.0-beta.25** (`Cargo.toml` workspace version `0.42.0-beta.25`). The underlying Lance format dependency moved from `v7.0.0-rc.1` to `v15.0.0-beta.28` (`Cargo.toml:22-36`). There is no release-notes file beyond a new `rust/lancedb/CHANGELOG.md` that covers only unreleased Blob v2 changes, so this summary comes from the commit log and code. Every file:line citation above was re-located.

What matters for this profile:

- **The storage thesis holds.** Tables are still `.lance` directories under a listing database (`rust/lancedb/src/database/listing.rs:42, 219-237`), records are still Arrow `RecordBatch`es, and `to_lance()` / `PyarrowDatasetAdapter` still hand the data to any Arrow consumer. The lede is still accurate for LanceDB Embedded.
- **The repo grew around an Enterprise product.** `AGENTS.md:1-9` now names two editions, LanceDB Embedded and LanceDB Enterprise, and reserves "LanceDB Cloud" for the legacy hosted service. Most new code is client surface for Enterprise: SQL query handles and durable jobs (`rust/lancedb/src/sql.rs`, `job.rs`), Functions (UDF-backed computed columns, renamed from `@udf` to `@function` in Python), materialized views, views, secrets, storage integrations, a deployment-wide authorization API (`rust/lancedb/src/authz/`), and property graphs over tables queried with SQL/PGQ `GRAPH_TABLE` (`rust/lancedb/src/graph.rs`). Local computed columns and materialized views sit behind the `experimental-functions` Cargo feature, off by default (`rust/lancedb/src/lib.rs:39-43`). A `lancedb` CLI binary was added (`rust/lancedb/cli/`).
- **Versioning got richer.** Branches (`create_branch`, `checkout_branch`, tag-based branch creation), `table.delta(from, to)` for version-to-version row changes (`rust/lancedb/src/table.rs:3004`), and cleanup jobs with previews. This strengthens the time-travel argument in the profile.
- **More scalar and text indexes.** FM (exact `LIKE`), ZoneMap, NGram, BloomFilter, and RTree scalar indexes joined BTree / Bitmap / LabelList (`rust/lancedb/src/index.rs:33-75`); FTS gained JSON-field indexing, an experimental 256-entry posting block format, a code analyzer, and BM25F via `CombinedFieldsQuery` in Python.
- **The high-write path was renamed.** `LsmWriteSpec` became `RTEWriteSpec` with `Table::enable_rte` / `disable_rte` (#4075), and it now requires an unenforced primary key (`rust/lancedb/src/table/primary_key.rs`).
- **Breaking SDK changes to expect.** Several `feat!` commits: lazy iterators for table and namespace listings, typed query errors in Python, an explicit scan-order contract for local queries, and order-preserving `take` offsets. Code written against the first pin may need small edits.

## One-line summary

> LanceDB is what you get when the database IS the file format — an Apache-2.0 Rust core over the [Lance columnar format](https://github.com/lance-format/lance), embedded-first like [[Profile__Chroma]] but with versioned, time-traveled, object-storage-native `.lance` directories that any Arrow consumer (DuckDB, Polars, Pandas) reads without the LanceDB binary — which makes its serialization the most portable in this study and its migration cost asymmetrically cheap on the way out.

---
name: Chroma Profile
slug: chroma
upstream: https://github.com/chroma-core/chroma
package: chromadb (PyPI), chromadb (npm), chroma (crates.io)
license: Apache-2.0
maintainer: Chroma (chroma-core org)
study: studies/vector-databases
profile_path: studies/vector-databases/chroma
profile_kind: embedded-db + server + hosted-platform
date_created: 2026-05-27
from: "studies/vector-databases"
from_path: "context-v/profiles/Profile__Chroma.md"
---
# Chroma — Profile

A profile of Chroma as it lives in this study (`studies/vector-databases/chroma/`). The Lossless Group runs Chroma in production — `ai-labs/context-vigilance-kit/` ingests `context-v/`, `changelog/`, Claude session transcripts, and tool traces into four local Chroma collections surfaced via the `chroma` MCP server. This is the baseline the rest of the study reads against: [[Profile__Qdrant]], [[Profile__Weaviate]], [[Profile__Milvus]], [[Profile__LanceDB]], [[Profile__pgvector]].

## TL;DR

Chroma is a **collection-oriented embedded context database** — the design center is "open `chromadb` as a Python import, get a working store backed by SQLite + HNSW on disk, scale up to a server or to Chroma Cloud without changing the API." The framing on the README is explicit: *"the open-source data infrastructure for AI"* (`README.md:5`), and the Rust crate doubles down — *"Chroma is an open-source AI-native search database... Where the language models provide reasoning, Chroma focuses on search"* (`rust/chroma/README.md:3-7`). The deliberate refusal to use the words "vector DB" in marketing is the positioning bet.

The record unit is **document + embedding + metadata + (optional) URI** keyed by string `id`, scoped by a **(tenant, database, collection)** triple. Persistence is split across two SQLite files in `<persist_dir>/chroma.sqlite3` (sysdb + WAL + metadata + FTS5) and per-segment HNSW index files (`<persist_dir>/<segment-uuid>/`). Filters use a MongoDB-style operator language — `$eq / $ne / $gt / $gte / $lt / $lte / $in / $nin / $and / $or / $contains / $not_contains / $regex / $not_regex` — exhaustively listed at `chromadb/base_types.py:128-158`. The 1.x release line **rewrote the core in Rust** (the entire `rust/` tree, with the Python CLI now just calling `chromadb_rust_bindings.cli(args)` at `chromadb/cli/cli.py:54`) and shipped a **Schema + Search hybrid-retrieval API** layered above the legacy `query()` surface — Knn + Rrf + Val + Sum + Sub + Min/Max as composable Rank expressions (`chromadb/execution/expression/operator.py:1043-1185`).

If you want one sentence: **Chroma is an embedded vector DB whose API surface (Client, Collection, `add`/`get`/`query`/`update`/`delete`) is small enough to learn in a sitting, whose persistence is a SQLite file you can `sqlite3` into, and whose 1.x Rust rewrite quietly added a hybrid-search query algebra without disturbing the four-function getting-started shape on the front page.**

## Why this exists — the design bet

The phrase "AI-native search database" appears on the README — not "vector DB." Three bets follow from that framing:

1. **Embedded should be the default, not the deployment of last resort.** `chromadb.PersistentClient(path=...)` and `chromadb.EphemeralClient()` are the headline constructors (`chromadb/__init__.py:170-228`); `HttpClient`/`AsyncHttpClient` (`chromadb/__init__.py:260-370`) and `CloudClient` (`chromadb/__init__.py:373-443`) are layered above the same `ClientAPI` interface. Three deployment modes, one Python surface. The contrast with [[Profile__Qdrant]] (server-first) and [[Profile__Milvus]] (k8s-first) is the entire point.
2. **Collections are the namespacing primitive, not a convenience.** Every read/write is `(tenant, database, collection)`-scoped (`chromadb/api/models/Collection.py:60-77, 119-127`). Multi-tenancy in Chroma is "give each tenant their own collection (or their own database)" — there is no per-row tenant index because there doesn't need to be.
3. **The wire format hides whether you're embedded or networked.** The same `Collection.add(ids=, documents=, metadatas=, embeddings=)` call works against `PersistentClient`, `HttpClient`, or `CloudClient`. That symmetry is the migration story when local Chroma outgrows its host — and it is also why Chroma Cloud's Schema + Search additions could be backfilled into OSS without a breaking change.

## Storage topology

For the OSS single-node path (`PersistentClient`):

| Layer | Backend | What's in it | Code |
|---|---|---|---|
| SysDB | `chroma.sqlite3` tables | tenants, databases, collections, segments, segment_metadata | `chromadb/migrations/sysdb/00001-…` through `00009-…` |
| Write-Ahead Log | `embeddings_queue` table | append-only operation log keyed by `seq_id` | `chromadb/migrations/embeddings_queue/00001-embeddings.sqlite.sql:1-10` |
| Metadata segment | `embeddings` + `embedding_metadata` tables | per-record key/value rows (string/int/float typed columns) | `chromadb/migrations/metadb/00001-embedding-metadata.sqlite.sql:1-22` |
| Full-text segment | `embedding_fulltext_search` FTS5 virtual table | trigram-tokenized document text | `chromadb/migrations/metadb/00003-full-text-tokenize.sqlite.sql:1-3` |
| Vector segment | per-collection HNSW index dir | `index_metadata.pickle` + hnswlib binary files | `chromadb/segment/impl/vector/local_persistent_hnsw.py:60-96` |

The architecturally interesting move is the **WAL + segments** split (`chromadb/types.py:49-53, 237-265`, `chromadb/segment/impl/metadata/sqlite.py:58-93`). Writes land in `embeddings_queue` first; metadata and vector segments are independent consumers that catch up off the WAL by `seq_id`. That is why `Collection.count(read_level=ReadLevel.INDEX_ONLY)` exists (`chromadb/api/models/Collection.py:43-60`) — to ask "what's actually in the compacted segment" vs. "what's in the index plus pending WAL." MemPalace's CHANGELOG documents the operational consequence: there's a 30–60 second window after bulk writes where HNSW segment metadata is still flushing, and reads can transiently fail with `Error finding id` (mempalace `CHANGELOG.md:13`).

For the distributed / Cloud path, the same logical layers are remapped onto an S3-backed segment store, an external sysdb, and a separate compactor service — see the entire `rust/` tree (`rust/sysdb/`, `rust/segment/`, `rust/log-service/`, `rust/garbage_collector/`, `rust/worker/`). Single-node Chroma keeps `Collection.version` and `log_position` at 0 (`chromadb/types.py:86-89`); they only mutate in the distributed deployment.

## Schema of a record

The wire-level operation record (`chromadb/types.py:254-260`):

```python
class OperationRecord(TypedDict):
    id: str
    embedding: Optional[Vector]                  # NDArray[float32 | int32]
    encoding: Optional[ScalarEncoding]           # FLOAT32 | INT32
    metadata: Optional[UpdateMetadata]
    operation: Operation                         # ADD | UPDATE | UPSERT | DELETE
```

The metadata value type (`chromadb/base_types.py:119-125`):

```python
MetadataListValue = List[Union[str, int, float, bool]]
Metadata = Mapping[
    str, Optional[Union[str, int, float, bool, SparseVector, MetadataListValue]]
]
```

Notable: **scalars + lists of scalars + sparse vectors**, no nested objects, no JSON blobs. That refusal is load-bearing — it's what lets metadata live in the typed `string_value | int_value | float_value` columns of `embedding_metadata` (`chromadb/migrations/metadb/00001-embedding-metadata.sqlite.sql:10-17`) instead of a generic JSON column, and it's what lets the where-filter operators push down into SQL directly. The contrast with [[Profile__Qdrant]] (rich JSON payloads with nested filtering) and [[Profile__Weaviate]] (typed properties with references) is direct: Chroma trades payload expressivity for a much narrower index.

The Collection model itself (`chromadb/types.py:70-115`) carries `id`, `name`, `configuration_json`, `serialized_schema`, `metadata`, `dimension`, `tenant`, `database`, `version`, `log_position`. The `serialized_schema` field is new in 1.x and stores the index configuration for the (in-progress) Schema + Search world.

## The where-filter language

The full grammar, from `chromadb/base_types.py:128-158`:

```python
LogicalOperator           = Literal["$and", "$or"]
WhereOperator             = Literal["$gt", "$gte", "$lt", "$lte", "$ne", "$eq"]
InclusionExclusionOperator = Literal["$in", "$nin"]
ArrayContainsOperator     = Literal["$contains", "$not_contains"]
WhereDocumentOperator     = Literal["$contains", "$not_contains", "$regex", "$not_regex", "$and", "$or"]
```

Two filter languages run alongside each other:

- **`where`** — operates on metadata. Boolean composition via `$and` / `$or`, scalar comparators, set membership via `$in` / `$nin`, list-element containment via `$contains` / `$not_contains`.
- **`where_document`** — operates on the document text. Substring (`$contains`), regex (`$regex`), and their negations, also composable with `$and` / `$or`.

These are passed to `Collection.get(where=, where_document=)` and `Collection.query(where=, where_document=)` (`chromadb/api/models/Collection.py:129-279`). Both filter languages are evaluated as **pre-filters** in the SQLite metadata segment: SQL `WHERE` clauses get generated via pypika (`chromadb/segment/impl/metadata/sqlite.py:30-40`), and the surviving `id` set is then handed to HNSW as an `allowed_ids` list for the ANN traversal (`chromadb/types.py:287-295`, `VectorQuery.allowed_ids`). The cost model is the usual one: if the filter is highly selective, recall is fine; if it is very narrow vs. the over-fetch budget, you can get empty results from HNSW and need a higher `n_results` or `search_ef`. [[Profile__Qdrant]]'s filter-push-down-into-HNSW story is the direct contrast.

## Indexes — HNSW, SPANN, FTS, inverted

The OSS Python segment still uses `hnswlib` directly (`chromadb/segment/impl/vector/local_persistent_hnsw.py:33`) with tunable params (`chromadb/segment/impl/vector/hnsw_params.py:10-23`):

```
hnsw:space            l2 | cosine | ip      (default: l2)
hnsw:construction_ef  int                   (default: 100)
hnsw:search_ef        int                   (default: 100)
hnsw:M                int                   (default: 16)
hnsw:num_threads      int                   (default: cpu_count)
hnsw:resize_factor    float                 (default: 1.2)
hnsw:batch_size       int                   (default: 100)
hnsw:sync_threshold   int                   (default: 1000)
```

The Rust core duplicates these in `HnswIndexConfig` (`rust/index/src/hnsw.rs:21-29`) and adds **SPANN** (`rust/index/src/spann/`) — the disk-friendly partitioned ANN index Chroma Cloud uses for collections too large to keep fully resident — exposed in the Python API as `SpannIndexConfig` (`chromadb/api/types.py:1641-1675`) with knobs like `search_nprobe`, `split_threshold`, `merge_threshold`, `quantize`. SPANN is **not** available in single-node OSS, but the type exists so the same client code targets either.

The other index types live in the Schema system (`chromadb/api/types.py:1607-1813`):

- `FtsIndexConfig` — full-text search over the `#document` key (FTS5 in single-node)
- `SparseVectorIndexConfig` — for BM25 / SPLADE-style sparse embeddings stored as `SparseVector` payloads
- `StringInvertedIndexConfig`, `IntInvertedIndexConfig`, `FloatInvertedIndexConfig`, `BoolInvertedIndexConfig` — typed inverted indexes per metadata field

Distance functions are L2 / Cosine / Inner Product. The Rust SIMD implementations (`rust/distance/src/types.rs:1`) carry a comment crediting Qdrant: *"Parts of file is copied from https://github.com/qdrant/qdrant/blob/master/lib/segment/src/spaces/simple.rs"* — a small but telling acknowledgement that the inner-loop math is shared across the two systems.

## The query and search APIs — two surfaces

`Collection.query()` (`chromadb/api/models/Collection.py:194-279`) is the legacy four-function path most users know:

```python
collection.query(
    query_embeddings=[[0.1, 0.2, ...]],   # or query_texts=, query_images=, query_uris=
    n_results=10,
    where={"category": "science", "score": {"$gt": 0.5}},
    where_document={"$contains": "vector"},
    include=["metadatas", "documents", "distances"],
)
```

It returns a `QueryResult` (`chromadb/api/types.py:619-…`) — column-major arrays of `ids`, `documents`, `metadatas`, `distances`, optionally `embeddings`.

`Collection.search()` (`chromadb/api/models/Collection.py:350-439`) is the new hybrid surface. The `Search` payload composes four operators (`chromadb/execution/expression/plan.py:39-…`):

```python
search = (Search()
    .where((K("category") == "science") & (K("score") > 0.5))
    .rank(Knn(query=[0.1, 0.2, 0.3]) * 0.8 + Val(0.5) * 0.2)
    .limit(10, offset=0)
    .select(K.DOCUMENT, K.SCORE, "title"))
```

Rank expressions are a small algebra — `Knn` (`operator.py:1043-1110`), `Rrf` for Reciprocal Rank Fusion across multiple Knns (`operator.py:1145-1185`), and arithmetic combinators `Sum`/`Sub`/`Val` (`operator.py:1113-1141`) — so you can fuse a dense vector search + a sparse vector search + a constant prior into one ranked result list without leaving the DB. **Chroma's docstring is explicit that `search()` currently only works against distributed and hosted Chroma** (`chromadb/api/models/Collection.py:355-356`), with `NotImplementedError` for local segment API. This is the single biggest API-surface gap between local OSS and Cloud as of 1.5.x.

The contrast with [[Profile__Weaviate]]'s GraphQL-first hybrid search is informative: Weaviate puts hybrid retrieval in the schema, Chroma puts it in a query algebra layered above an unchanged storage schema.

## Write policy — append + WAL + segment catch-up

Writes are columnar (`Collection.add(ids=, embeddings=, metadatas=, documents=)`, `chromadb/api/models/Collection.py:78-127`). Internally each row becomes an `OperationRecord` with `operation: ADD | UPDATE | UPSERT | DELETE` (`chromadb/types.py:237-260`) appended to `embeddings_queue`. The metadata segment (`chromadb/segment/impl/metadata/sqlite.py:58-67`) and vector segment subscribe to the queue and reconcile asynchronously. `count()`'s `read_level` parameter is the user-visible knob for that asynchrony.

There is **no LLM in the write path** — Chroma is a pure store, embeddings are computed by the caller (or by an `EmbeddingFunction` registered on the collection at create time). The closest thing to "writes do something smart" is `upsert()` which dedupes on `id`; supersession, merging, and extraction are the caller's problem. Compare to [[Mem0]] in the sibling study which calls an LLM on every `add()`.

## Eviction & compaction

In single-node OSS: **none of either is automatic**. The WAL grows monotonically, the SQLite file grows, the HNSW index grows. `delete()` removes records but vacuum is the operator's job. There is no TTL. Backup = copy the persist directory while quiesced.

In the distributed / Cloud path: there is a real `rust/garbage_collector/` crate and a compaction service. Single-node users do not get the benefit. This is the most underappreciated part of choosing Chroma at scale — the OSS embedded mode is designed for "lots of small to medium corpora," not for "one huge corpus that needs continuous cleanup."

The MemPalace project (the heaviest external Chroma user in our study tree) has a recurring class of operational bugs around exactly this seam: HNSW segment writer corruption (`mempalace CHANGELOG.md:23` — palaces stuck on `apply_logs` requiring a `repair --mode from-sqlite` rebuild that bypasses the corrupt index and re-upserts from the SQLite tables), SQLite locks not being released on client close (`mempalace CHANGELOG.md:16`), `max_seq_id` BLOB format drift across Chroma versions (`mempalace CHANGELOG.md:210`). These are the kinds of failure modes you discover after a year of running Chroma at non-trivial volume, and they're worth pricing in.

## Scopes & namespacing

The scoping primitives, in order of containment:

1. **Tenant** (string, default `"default_tenant"` — `chromadb/migrations/sysdb/00004-tenants-databases.sqlite.sql:22`)
2. **Database** (string, default `"default_database"` — same migration, line 24)
3. **Collection** (UUID + human name, unique per database)

Every API call carries `(tenant, database, collection_id)` (`chromadb/api/models/Collection.py:55-60`, etc.). For a single-tenant local deployment you ignore the first two; for Chroma Cloud the tenant is your account.

Within a collection, there is **no further partitioning** — no namespace-like sub-indexes, no per-user shards. If you need that, you create more collections. This is the cheapest scoping primitive in the study (Lossless's `ai-labs/context-vigilance-kit/` runs four collections for the four content classes, which is exactly the intended pattern), and the most painful one if you need per-user isolation across millions of users — that's a "one collection per user" anti-pattern that Chroma will let you do, but [[Profile__Qdrant]]'s per-point payload filtering or [[Profile__Weaviate]]'s multi-tenancy module is more honest about the cost.

## Operational story

Three deployment modes, one API:

1. **Embedded.** `PersistentClient(path=...)` or `EphemeralClient()` — pure in-process, SQLite + HNSW files in a directory. This is what `ai-labs/context-vigilance-kit/` uses and what every prototype starts with.
2. **Self-hosted server.** `chroma run --path /chroma_db_path` (`README.md:23-27`, `chromadb/cli/cli.py`) — wraps the Rust core, exposes HTTP at `:8000`. The Docker recipe is short (`docker-compose.yml:1-40`) — one service, one volume, OTEL env vars, no Postgres, no Neo4j. The Dockerfile (`Dockerfile`, `rust/Dockerfile`) builds the Rust CLI binary.
3. **Chroma Cloud.** `CloudClient(api_key=...)` (`chromadb/__init__.py:373-443`) — the hosted serverless tier with SPANN + Search + tenant management.

Clients exist in Python (`clients/python/` and `chromadb/` itself), JS/TS (`clients/js/`, `clients/new-js/`), Rust (`rust/chroma/src/client/chroma_http_client.rs`), and Go (`go/`). The Rust CLI is the daemon; the Python `chroma` command-line tool just delegates to it (`chromadb/cli/cli.py:48-56`). Mem0 supports Chroma as one of ~30 vector backends (`studies/memory-layers-for-agents/mem0/mem0/vector_stores/chroma.py`); the bigger external use case in our study is MemPalace (`studies/memory-layers-for-agents/mempalace/pyproject.toml:30` — `chromadb>=1.5.4,<2`) which has dedicated Chroma backends for both its `mempalace_drawers` and `mempalace_closets` palaces.

## What's inside this submodule

| Path | What's there |
|---|---|
| `chromadb/` | Python package — public API surface, segment impls, migrations, CLI shim |
| `chromadb/api/` | `Client`, `Collection`, `AsyncCollection`, `types`, `fastapi`, `rust` impls |
| `chromadb/segment/impl/` | Vector segments (HNSW), metadata segment (SQLite) |
| `chromadb/migrations/` | DDL for sysdb / embeddings_queue / metadb / fulltext |
| `chromadb/execution/expression/` | The Search query algebra — `Knn`, `Rrf`, `Sum`, `Val`, `Rank` |
| `rust/` | The 1.x core rewrite — `chroma`, `index` (HNSW + SPANN + FTS), `segment`, `sysdb`, `log-service`, `worker`, `frontend`, `garbage_collector`, `s3heap`, `wal3`, `quantization` |
| `rust/distance/` | SIMD distance kernels (AVX, AVX-512, SSE, NEON) — forked from Qdrant |
| `clients/` | Language clients — `python`, `js`, `new-js` |
| `go/` | Go client and server bits |
| `idl/` | gRPC / Protobuf definitions |
| `k8s/`, `deployments/` | Kubernetes manifests for the distributed deployment |
| `bin/chroma`, `chromadb/cli/cli.py` | The `chroma` CLI (Rust binding under the hood) |
| `examples/`, `sample_apps/` | Cookbooks |
| `docs/` | Wordmarks and assets (real docs live at docs.trychroma.com) |

If you only read three files: `chromadb/__init__.py` (the public surface), `chromadb/base_types.py` (the where-filter grammar and metadata schema), `chromadb/api/models/Collection.py` (the actual method shapes).

## Mental model for using it well

- **Treat the collection as the unit of everything.** Namespace, index, schema, embedding function, distance metric. If you need different settings, you need a different collection. Don't try to be clever with metadata-based tenancy until you've outgrown the per-collection model.
- **Stay below ~10M vectors per collection on single-node.** Above that, the HNSW resident-memory cost and the WAL/segment catch-up window both bite. The MemPalace operational issues cluster on bulk-mine flows that push past this.
- **Pre-filter selectivity matters.** Where-filters generate SQL against `embedding_metadata` before the HNSW traversal. Highly selective filters with low `n_results` can produce empty results — bump `search_ef` or `n_results` rather than retrying blindly.
- **Don't depend on `search()` if you're on OSS single-node.** It currently raises `NotImplementedError` outside distributed / Cloud (`chromadb/api/models/Collection.py:382`). For hybrid retrieval on single-node, run two `query()` calls and fuse client-side.
- **Back up the persist directory whole.** The HNSW pickle files and the SQLite are mutually dependent. Atomic snapshot of the directory or nothing.
- **Mind the embedding function identity.** Chroma persists the EF's `name()` but not its config — opening a collection with a different EF instance silently binds the default (`mempalace CHANGELOG.md` re: SIGSEGV from EF mismatch). Always pass `embedding_function=` explicitly when reopening.

## When NOT to reach for this

- **You need filter expressivity richer than typed scalars.** Nested JSON, geo, deeply structured payloads — [[Profile__Qdrant]] is the right answer; Chroma's metadata schema is deliberately flat.
- **You want one source-of-truth file you can read with non-Chroma tooling.** The SQLite is parseable, but the HNSW index is hnswlib's binary format plus a Python pickle. [[Profile__LanceDB]]'s `.lance` columnar directory is dramatically more portable.
- **Vectors are a small part of your data and you already run Postgres.** [[Profile__pgvector]] inherits transactions, joins, backups, and ACL unchanged; the marginal cost of vector search is `CREATE EXTENSION vector`.
- **You need GraphQL or schema-on-write.** [[Profile__Weaviate]].
- **You need distributed-by-default with multiple ANN backends per collection.** [[Profile__Milvus]].
- **You need first-class hybrid search on single-node OSS *today*.** Chroma is shipping the Schema + Search API, but `Collection.search()` is Cloud-only at 1.5.x.

## How this compares to the rest of the study

| Axis | Chroma | [[Profile__Qdrant]] | [[Profile__Weaviate]] | [[Profile__Milvus]] | [[Profile__LanceDB]] | [[Profile__pgvector]] |
|---|---|---|---|---|---|---|
| **Default deployment** | Embedded | Server | Server | Distributed | Embedded | Postgres ext. |
| **Persistence** | SQLite + HNSW files | RocksDB segments | Custom on disk | Object store + memtable | Lance columnar | Postgres tables |
| **Payload** | Typed scalars + lists + sparse | Rich JSON | Typed properties + refs | Typed fields | Arrow columns | Any Postgres types |
| **Filter language** | `$eq/ne/gt/in/contains/and/or/regex` | Full predicate + geo | GraphQL where | Boolean + arith | SQL predicates | SQL WHERE |
| **Filter push-down** | Pre-filter into HNSW `allowed_ids` | Push-down into HNSW | Push-down | Push-down | Pre-filter | Post-filter (mostly) |
| **Indexes** | HNSW (+ SPANN on Cloud) + FTS5 + inverted | HNSW + quantization | HNSW | HNSW / IVF / DiskANN / ScaNN | IVF_PQ / HNSW | HNSW + IVFFlat |
| **Hybrid search** | `Search()` + Rrf + Knn algebra (Cloud) | Sparse + dense + RRF | Modules | Sparse + dense | FTS + vector | `pgvector` + pg_trgm |
| **Scoping** | tenant / db / collection | collection + payload filter | class + tenant module | collection + partition | dataset / table | schema / table |
| **Migration cost off** | Re-export via SQLite + re-embed | Re-export via REST | Re-export via GraphQL | Re-export via SDK | `.lance` files portable | `pg_dump` |

## One-line summary

> Chroma is the embedded-first, collection-as-namespace context DB whose four-function API hides a SQLite-backed WAL + segments engine, whose 1.x Rust rewrite quietly added a Knn/Rrf query algebra and a SPANN-on-Cloud story, and which earns its keep when you want a vector store you can `pip install` today and `chroma run` or `CloudClient` your way out of when you outgrow the laptop — at the cost of a flat metadata schema, no automatic compaction on single-node, and a hybrid-search surface still partly behind the Cloud door.

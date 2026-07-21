---
name: Milvus Profile
slug: milvus
upstream: https://github.com/milvus-io/milvus
package: pymilvus (PyPI), github.com/milvus-io/milvus/client (Go), pymilvus[milvus-lite] (embedded)
license: Apache-2.0
maintainer: Zilliz; LF AI & Data Foundation
study: studies/vector-databases
profile_path: studies/vector-databases/milvus
profile_kind: distributed-server + embedded (Lite) + hosted (Zilliz Cloud)
pinned_sha: 9a455d61ec
date_created: 2026-05-27
from: "studies/vector-databases"
from_path: "context-v/profiles/Profile__Milvus.md"
---
# Milvus — Profile

A profile of Milvus as it lives in this study (`studies/vector-databases/milvus/`, pinned at `9a455d61ec`, 2026-05-27). Read alongside [[Profile__Chroma]], [[Profile__Qdrant]], [[Profile__Weaviate]], [[Profile__LanceDB]], and [[Profile__pgvector]] — these six together cover the design space the study cares about.

## TL;DR

Milvus is the **Kubernetes-scale** answer to the vector-DB question and the only entry in the study that's **distributed-by-default**. One Milvus deployment is not a process — it's nine roles (proxy, three coordinators, four worker nodes, plus an optional CDC role), three external dependencies (etcd for metadata + service discovery, object storage for durability, a message queue for the write path), and a C++ vector core (Knowhere) embedded in Go via cgo. Same binary boots all of it (`cmd/milvus/util.go:124-175`) — `milvus run standalone` flips on every role inside one process; `milvus run rootcoord|datanode|querynode|…` brings up one role at a time for k8s.

The thesis: **separate compute from storage so each scales independently**. Query nodes do nothing but search; data nodes do nothing but buffer writes and flush; coordinators do nothing but schedule. All state lives in object storage (MinIO/S3/GCS/Azure/Aliyun/Huawei/Tencent — `pkg/objectstorage/*/`) plus etcd (or TiKV) for metadata. Workers are stateless and disposable. A pod restart costs you a few seconds of warmup, not data.

What that bet buys you: **horizontal scale-out on read-heavy and write-heavy workloads independently, multiple ANN backends pluggable per collection** (HNSW is the default; IVF_FLAT, IVF_PQ, IVF_SQ8, SCANN, DiskANN, GPU_CAGRA, GPU_IVF_FLAT, GPU_IVF_PQ, GPU_BRUTE_FORCE, sparse-inverted, and binary variants are all wired in via Knowhere — see `internal/util/vecindexmgr/vector_index_mgr.go` and `internal/util/indexparamcheck/`), **a partition-key model** for multi-tenancy that scales to "hundreds to millions of tenants" (`README.md:92-93`), and **billion-vector workloads** that survive pod churn. What it costs you: nine moving parts, three external dependencies, and Kubernetes — or you accept Standalone mode and lose most of the operational story that justified the architecture in the first place. Milvus Lite (the `pymilvus[milvus-lite]` extra, `client = MilvusClient("file.db")`, `README.md:41-45`) is "for quickstart in python with `pip install`" — not a production target.

If you want one sentence: **Milvus is a separation-of-concerns vector database where every responsibility (write durability, metadata, scheduling, search, indexing, compaction) is a different process and every state-bearing thing is object storage or etcd — pluggable Knowhere ANN backends and a partition-key multi-tenancy model layered on top.**

## Why this exists — the design bet

Pre-Milvus, vector search was either (a) Faiss-in-a-process — fast, in-RAM, no durability, no concurrency story — or (b) a search engine retrofitted with a vector field (OpenSearch, Vespa) where the ANN was a second-class citizen bolted onto inverted-index plumbing. Milvus's bet was that vectors at billion scale need a purpose-built distributed system with the **same shape as a modern OLAP database**:

1. **Separate compute and storage tiers.** Workers are stateless. Persistent state lives in object storage. Scale read with query nodes, write with data nodes, schedule with coordinators — independently.
2. **Multiple ANN backends, one query surface.** Milvus does not have *an* index; it has Knowhere, a C++ vector-index library (`internal/core/src/index/Index.h:26-28`) that wraps Faiss (IVF family), hnswlib (HNSW), DiskANN, ScaNN, NVIDIA CAGRA, and sparse-inverted-index — and exposes them by name in the create-index API.
3. **Asynchronous, message-queue-backed writes.** Inserts go to a WAL (Pulsar / Kafka / RocksMQ / Woodpecker — `configs/milvus.yaml:170-176`), are buffered into segments in memory by data nodes, flushed to object storage as binlogs, and only then become searchable on query nodes after index build. Writers don't block on indexing.
4. **Segment-based storage with background compaction.** Data is sharded into segments (max 1024 MB, `configs/milvus.yaml:637`); compaction merges small segments, applies deletes, and rebuilds indexes (`internal/datacoord/compaction_policy_*.go`).

## Storage topology — the nine roles

| Layer | Role | What it does | Code |
|---|---|---|---|
| Frontend | **proxy** | Validates client requests, routes DML/DDL/DQL, runs ANTLR-parsed filter expressions, applies hybrid-search rerankers | `internal/proxy/`, `cmd/components/proxy.go` |
| Scheduling | **rootcoord** | DDL (create/drop collection), TSO time-tick allocator, RBAC, alias mgmt; `configs/milvus.yaml:292-312` | `internal/rootcoord/` |
| Scheduling | **datacoord** | Segment lifecycle, compaction triggers, GC of orphaned binlogs in object storage; `configs/milvus.yaml:628-793` | `internal/datacoord/` |
| Scheduling | **querycoordv2** | Topology + load balancing of segments across query nodes; segment handoff growing→sealed; `configs/milvus.yaml:402-470` | `internal/querycoordv2/` |
| Scheduling | **mixcoord** | Co-resident bundle of root+data+query coords, the recommended deployment shape in 3.x (`cmd/roles/roles.go:420`) | `internal/distributed/mixcoord/` |
| Worker | **datanode** | Subscribes to message-queue WAL, buffers inserts into growing segments, flushes binlogs to object storage on seal | `internal/datanode/`, `configs/milvus.yaml:795-863` |
| Worker | **querynodev2** | Loads sealed segments from object storage, holds vector indexes in memory/mmap, executes search/query/hybrid | `internal/querynodev2/`, `configs/milvus.yaml:472-614` |
| Worker | **indexnode** | Builds vector + scalar indexes for sealed segments (in 3.x merged into mixed worker role) | `internal/indexnode/`, `configs/milvus.yaml:624-626` |
| Worker | **streamingnode** | New in 3.x — owns the WAL, runs DDL/DCL through the streaming service, replication and CDC; replaces the old MsgStream path | `internal/streamingnode/`, `internal/streamingcoord/`, `docs/agent_guides/streaming-system/` |
| External | **etcd** (or TiKV) | Metadata store + service discovery; `configs/milvus.yaml:18-65` lists ssl, auth, embedded options | dependency only |
| External | **object storage** | Durable binlog + index file storage; backends: MinIO, AWS S3, GCS native, Azure Blob, Aliyun OSS, Huawei OBS, Tencent COS | `pkg/objectstorage/{gcp,aliyun,huawei,tencent}/`, `internal/storage/{minio,azure,gcp_native}_object_storage.go` |
| External | **message queue** | Mutation WAL: Pulsar (cluster default), Kafka, RocksMQ (single-node only), Woodpecker (new 3.x option backed by object storage); `configs/milvus.yaml:170-227` | `pkg/v3/mq/`, `pkg/v3/streaming/walimpls/` |

The role flag struct (`cmd/roles/roles.go:150-168`) is the canonical "what's a Milvus instance" definition — every binary lives or dies by some combination of `EnableProxy`, `EnableMixCoord`, `EnableQueryNode`, `EnableDataNode`, `EnableStreamingNode`, `EnableRootCoord`, `EnableQueryCoord`, `EnableDataCoord`, `EnableCDC`.

## Schema of a record

Milvus is a typed, schema-on-write system — unlike Mem0 or Chroma, you *declare* fields before you insert. Field types from the Go client (`client/entity/field.go:165-206`):

```go
FieldTypeBool        FieldType = 1
FieldTypeInt8/16/32/64
FieldTypeFloat/Double
FieldTypeVarChar     FieldType = 21   // max_length param required
FieldTypeArray       FieldType = 22
FieldTypeJSON        FieldType = 23   // unstructured payload, JSON-path filter
FieldTypeGeometry    FieldType = 24   // WKT/WKB; st_within, st_dwithin, st_contains operators
FieldTypeTimestamptz FieldType = 26

FieldTypeBinaryVector    FieldType = 100   // bit-packed; HAMMING / JACCARD metrics
FieldTypeFloatVector     FieldType = 101   // the default; max 32768 dims (`configs/milvus.yaml:325`)
FieldTypeFloat16Vector   FieldType = 102
FieldTypeBFloat16Vector  FieldType = 103
FieldTypeSparseVector    FieldType = 104   // BM25 / SPLADE / BGE-M3
FieldTypeInt8Vector      FieldType = 105

FieldTypeStruct          FieldType = 201   // nested struct fields
```

Schema flags (`client/entity/schema.go:62-73`) include `AutoID` (Milvus generates the PK), `EnableDynamicField` (extra JSON-like fields beyond declared schema), `Functions` (BM25 / minhash function-bound fields), and `ExternalSource` (read-through to S3-resident data). A field can be tagged `IsPartitionKey` (`internal/proxy/task.go:259-316`) which makes the partition-key model first-class — see *Scopes & namespacing* below. Max field count per collection: 64 (`configs/milvus.yaml:322`); max vector fields: 10 (`configs/milvus.yaml:323`).

Notable for what *can* be in a record but is **not first-class in Chroma**: typed numerics, arrays of scalars, geometry, multiple named vector fields, structs, and a `Function` declaration that lets the DB derive a BM25 sparse vector from a varchar field at write-time (`internal/util/function/bm25_function.go`).

## Index types — what Knowhere actually wires up

Vector-index types are advertised at runtime by the C++ core via cgo (`internal/util/vecindexmgr/vector_index_mgr.go:117-135`) — `mgr.features` is populated from `GetIndexFeatures()` exported from `internal/core/src/segcore/vector_index_c.h`. Each index advertises a bit-flag set:

```go
BinaryFlag        uint64 = 1 << 0
Float32Flag       uint64 = 1 << 1
Float16Flag       uint64 = 1 << 2
BFloat16Flag      uint64 = 1 << 3
SparseFloat32Flag uint64 = 1 << 4
Int8Flag          uint64 = 1 << 5
GpuFlag           uint64 = 1 << 18
MmapFlag          uint64 = 1 << 19
DiskFlag          uint64 = 1 << 21
```

The list of supported index strings is asserted by the `internal/util/indexparamcheck/*_checker.go` files — each is a per-index validator: `hnsw_checker`, `ivf_base_checker`, `ivf_pq_checker`, `ivf_sq_checker`, `bin_ivf_flat_checker`, `diskann_checker`, `scann_checker`, `raft_brute_force_checker`, `raft_ivf_flat_checker`, `raft_ivf_pq_checker`, `sparse_float_vector_base_checker`, `auto_index_checker`. Plus the scalar indexes (`internal/util/indexparamcheck/index_type.go:30-37`): `STL_SORT`, `TRIE`, `BITMAP`, `INVERTED`, `HYBRID` (BITMAP + INVERTED), `NGRAM`, `RTREE` (for geometry).

**AUTOINDEX defaults to HNSW with COSINE** — `{"M": 18, "efConstruction": 240, "index_type": "HNSW", "metric_type": "COSINE"}` (`pkg/util/paramtable/autoindex_param.go:121`). For binary vectors the default is `BIN_IVF_FLAT` / `HAMMING` (`autoindex_param.go:130`).

DiskANN is detected by name (`internal/util/vecindexmgr/vector_index_mgr.go:109-111`) — `indexType == "DISKANN"`. Same for AISAQ (line 113). GPU indexes carry the `GpuFlag` and require GPU build tags (`configs/milvus.yaml:1296-1301`).

## Write policy — async, segment-based, never-blocks-the-client

The write path is **deliberately decoupled from indexing** (`docs/agent_guides/streaming-system/streaming-system.md` is the canonical reference; the high-level shape is summarized here from the configs):

1. Client → proxy → **streaming-node** appends to the WAL (Pulsar/Kafka/RocksMQ/Woodpecker). Returns to client as soon as durable. This is the only synchronous step.
2. **data-node** subscribes to the WAL, accumulates rows in an in-memory *growing segment* until it hits `dataCoord.segment.sealProportion = 0.12 × maxSize = 1024MB` (`configs/milvus.yaml:637-639`) OR `maxIdleTime = 600s` (line 647) OR `maxBinlogFileNumber = 32` (line 651). Then the segment is **sealed**.
3. Sealed segment is flushed to object storage as a set of *binlogs* (one per field, columnar). The `internal/storage/binlog_writer.go` family handles encoding.
4. **index-node** (or merged worker in 3.x) reads the binlogs, builds the vector + scalar indexes via Knowhere, writes index files back to object storage.
5. **query-coord** schedules the sealed-and-indexed segment onto query nodes. They `mmap` or load it into RAM.
6. **data-coord** runs background **compaction** (`configs/milvus.yaml:685-737`) — five policies: `mix` (merge small segments), `levelzero` (apply deletes), `single` (rewrite when delete-ratio passes threshold), `clustering` (k-means-bucket segments on a clustering key for selectivity), and `backfill`. Compaction GC is gated on `dropTolerance = 3600s` (line 699).

**Consistency levels** (`client/entity/schema.go:42-50`): `Strong`, `Bounded` (5s default tolerance), `Session`, `Eventually`, `Customized`. Bounded is the practical default — recall sees writes within a configurable lag.

**Deletes** are tombstones in the WAL (level-0 logs); they apply to segments at search time via a bitmap, and are physically purged on L0 compaction (`configs/milvus.yaml:704-710`). There is no in-place mutation — Milvus is log-structured underneath.

## Recall API — filter, search, hybrid

Three primary endpoints on the proxy (per `internal/proxy/impl.go`): `Search`, `HybridSearch`, `Query` (the no-vector "give me rows matching this filter" path).

Filter expressivity is the most expressive of the study. The ANTLR grammar at `internal/parser/planparserv2/Plan.g4` defines:

- Comparison: `<`, `<=`, `>`, `>=`, `==`, `!=`
- Logical: `&&`/`and`/`AND`, `||`/`or`/`OR`, `not`
- Set: `in`, `not in`
- String: `like 'foo%'`
- JSON: `json_contains`, `json_contains_all`, `json_contains_any` (line 111-113)
- Array: array index access on `Array` fields
- Geometry: `st_within`, `st_dwithin`, `st_contains`, `st_touches`, `st_overlaps`, `st_crosses`, `st_intersects`, `st_equals` (lines 39-40, 127-128) — Milvus does PostGIS-style spatial filtering
- Arithmetic on the LHS for derived predicates

Filters are **pushed down into segment-level scalar indexes** (BITMAP / INVERTED / HYBRID / NGRAM / STL_SORT / TRIE / RTREE) and combined with the ANN traversal via Knowhere's bitset filter — not applied post-search. This is the same shape as Qdrant's pre-filter and the opposite of Chroma's post-filter behavior.

**Hybrid search** is a first-class endpoint (`HybridSearch`). The schema declares multiple named vector fields; the request issues one ANN sub-search per field; the proxy fuses the result sets via a **ranker function** declared in `Schema.Functions`. The ranker dispatch lives in `internal/util/function/chain/rerank_builder.go:43-47`:

```go
DecayRerankerName    = "decay"      // time-decay reranker
ModelRerankerName    = "model"      // calls Cohere/Voyage/Ali/SiliconFlow/TEI/VLLM/Zilliz API
RRFRerankerName      = "rrf"        // reciprocal rank fusion, k defaults to 60.0 (line 69)
WeightedRerankerName = "weighted"   // weighted score sum
```

The RRF default `k = 60.0` matches the canonical Cormack/Clarke/Buettcher 2009 paper recommendation. Model rerankers under `internal/util/function/rerank/` ship adapters for **Ali, Cohere, SiliconFlow, TEI, vLLM, Voyage, Zilliz** out of the box.

## Compaction — five policies, level-aware

Milvus runs five separate compaction policy implementations (`internal/datacoord/compaction_policy_*.go`):

| Policy | Trigger | Purpose |
|---|---|---|
| `mix` | `triggerInterval: 60s` (`configs/milvus.yaml:703`) | Merge segments below `smallProportion = 0.5 × maxRows` into something approaching `compactableProportion = 0.85 × maxRows` (lines 652-655) |
| `levelzero` | `triggerInterval: 10s` (line 705) + size thresholds | Apply buffered delete tombstones; force-trigger at 8MB / 64MB / 10–1000 deltalog files |
| `single` | Per-segment, on delete-ratio | Rewrite a segment when its delete-ratio crosses `single.ratio.threshold = 0.2` (line 717) |
| `clustering` | `triggerInterval: 600s` (line 726) | Re-bucket vectors by a clustering key for high-selectivity filters; uses k-means with up to 10240 centroids (line 733) |
| `backfill` | `triggerInterval: 20s` (line 714) | Catch-up compaction after schema changes or repair |

Prioritization is configurable: `default` (FIFO), `level` (L0 first → mix → clustering), or `mix` (`configs/milvus.yaml:691-695`). Compaction GC runs on `gcInterval: 1800s` and tasks tolerate `dropTolerance: 3600s` before cleanup (lines 699-700).

Garbage collection of orphaned files in object storage runs every `gc.interval = 3600s` with `missingTolerance = 86400s` (24h) before a file with no metadata can be deleted (`configs/milvus.yaml:743-744`). The 24-hour grace window is the load-bearing safety net — it prevents an etcd hiccup from deleting active binlogs.

## Scopes & namespacing — four levels

Milvus models multi-tenancy at four granularities (`README.md:92-93`, `configs/milvus.yaml:298,303`):

1. **Database** — top-level container; `maxDatabaseNum = 64` per cluster (`configs/milvus.yaml:303`). Cheap to create, expensive to query across.
2. **Collection** — the unit a schema + index attaches to. Max 16 shards each (`configs/milvus.yaml:324`).
3. **Partition** — physical sub-bucket *inside* a collection; `maxPartitionNum = 1024` per collection (`configs/milvus.yaml:298`). Queries can target specific partitions to prune the search space.
4. **Partition key** — a special field marked `IsPartitionKey = true` (`internal/proxy/task.go:259-316`); rows are auto-routed to partitions by hash. This is the "millions of tenants" mechanism — you declare `tenant_id` as the partition key once and Milvus handles isolation transparently. `mustUsePartitionKey: false` (`configs/milvus.yaml:337`) is the cluster-wide toggle that forces every collection to declare one.

The partition-key model is the architectural counter-bet against per-tenant collections (which OpenSearch and Weaviate sometimes recommend) — Milvus argues that "N tenants → N collections" doesn't scale past tens of thousands because each collection carries fixed coordinator overhead.

## Operational story — three deployment shapes

Same binary, three shapes (`cmd/milvus/util.go:124-175`):

1. **Milvus Lite** — `pip install pymilvus[milvus-lite]; client = MilvusClient("file.db")` (`README.md:41-45`). Embedded mode, all roles co-resident in one Python-loaded process, file-backed storage. **Quickstart only.** No external etcd, no MinIO, no MQ. Not a production target.
2. **Standalone** — `milvus run standalone` or `scripts/standalone_embed.sh`. One process, all roles set to `true` by `GetMilvusRoles()` (`cmd/milvus/util.go:143-151`), uses RocksMQ for the message queue (`configs/milvus.yaml:170-171`), embedded etcd optional, local MinIO container. The `deployments/docker/standalone/docker-compose.yml` triple — `etcd:3.5.25` + `minio:RELEASE.2024-05-28` + `milvusdb/milvus:v3.0-beta` — is the canonical local-dev shape.
3. **Cluster** — k8s + Helm chart (`deployments/docker/cluster-distributed-deployment/` provides the Ansible reference). Every role is a separate Deployment; etcd is a StatefulSet; MinIO is either bundled or an external S3/GCS/Azure endpoint; Pulsar (or Kafka, or Woodpecker) is the WAL. This is the design center.

Persistence story: in Standalone mode, `localStorage.path` (`configs/milvus.yaml:87-93`) holds the cached binlog + indexes; MinIO holds the canonical copy. In Cluster mode, **only** object storage is canonical — every worker is disposable. Backup is "snapshot the object store + etcd"; point-in-time restore is supported via `dataCoord.snapshot.maxCompactionProtectionSeconds = 604800` (7 days, `configs/milvus.yaml:754`).

## Serialization on disk

Binlog format (`internal/storage/binlog_writer.go`, `internal/storage/event_writer.go`, `internal/storage/payload_writer.go`) is **Apache Arrow / Parquet-derived columnar files** — one file per (segment, field) tuple, with a custom event-header wrapper carrying timestamps and segment lineage. Vector indexes are written as opaque Knowhere-format files (HNSW graph data, IVF cluster files, DiskANN PQ codes, etc.) — these are *not* portable.

The columnar binlogs themselves are loosely Arrow-compatible (`internal/storage/arrow_util.go`), so the scalar columns of a Milvus collection are *in principle* readable by an Arrow consumer that understands the event-header framing. In practice, the tooling assumes you go through `milvus`'s import/export path (`tools/migration/`, `deployments/migrate-meta/`). Compare to LanceDB ([[Profile__LanceDB]]) where `.lance` directories are directly readable by DuckDB / Polars / Pandas.

## What's inside this submodule

| Path | What's there |
|---|---|
| `cmd/` | Entry points: `milvus.go` (main), `roles/roles.go` (the nine-role table), `components/` (one .go per role), `embedded/` (Milvus Lite glue) |
| `client/` | Go client SDK — its own go.mod (`github.com/milvus-io/milvus/client/v3`); separate from the server. Python client (`pymilvus`) is its own repo. |
| `internal/proxy/` | Frontend — auth, validation, query plan parsing (cgo into the C++ planner via `internal/parser/planparserv2/cwrapper/`), hybrid-search rerank dispatch |
| `internal/rootcoord/` | DDL coordinator (create/drop/alter collection), TSO time-tick, RBAC |
| `internal/datacoord/` | Segment lifecycle + compaction policies (`compaction_policy_{mix,l0,single,clustering,backfill}.go`) |
| `internal/querycoordv2/` | Load balancer for sealed segments across query nodes |
| `internal/datanode/`, `internal/querynodev2/` | The actual workers |
| `internal/streamingnode/`, `internal/streamingcoord/` | New WAL service (3.x), replaces legacy MsgStream — DDL/DCL/replication/CDC |
| `internal/compaction/` | Worker-side compaction execution (the coord schedules; this runs) |
| `internal/storage/` | Object-storage abstraction — MinIO, Azure, GCP-native, generic-remote; binlog reader/writer; payload codec |
| `internal/core/src/` | **C++ core** — `segcore/` (sealed/growing segment in-memory layout), `index/` (Knowhere wrappers), `query/`, `expr/`, `exec/`, `mmap/`, `clustering/`, `minhash/`. Built via CMake (`internal/core/CMakeLists.txt`), linked into Go via cgo |
| `internal/util/indexparamcheck/` | Per-ANN-backend parameter validation — HNSW, IVF, DiskANN, SCANN, RAFT/GPU, sparse |
| `internal/util/vecindexmgr/` | Runtime registry of which ANN backends were compiled in (asks the C++ side via cgo) |
| `internal/util/function/` | BM25 derivation, minhash, rerank chain, model-rerank API adapters (Cohere/Voyage/Ali/etc.) |
| `internal/parser/planparserv2/` | ANTLR-based filter-expression parser; `Plan.g4` is the grammar |
| `pkg/v3/` | Public-ish packages: `streaming/`, `mq/`, `objectstorage/`, `util/paramtable`, `log`, `metrics`. **Has its own go.mod** (`github.com/milvus-io/milvus/pkg/v3`). |
| `pkg/objectstorage/` | Cloud-specific object-storage adapters: `aliyun/`, `gcp/`, `huawei/`, `tencent/` (Azure + AWS S3 + MinIO live under `internal/storage/`) |
| `configs/milvus.yaml` | The 1400+-line operational contract — every tuning knob lives here |
| `deployments/` | `docker/standalone/docker-compose.yml`, `docker/cluster-distributed-deployment/` (Ansible), `migrate-meta/`, `upgrade/` |
| `tests/` | Go integration tests under `tests/integration/`; Python regression suites elsewhere |

If you only read one file: `cmd/roles/roles.go`. It is the canonical map of "what is Milvus" — every other directory is the implementation of one of those nine roles.

## Mental model for using it well

- **Decide standalone-vs-cluster up-front.** Milvus Lite is a learning aid; standalone fits on one box but has no HA; cluster needs k8s. There is no graceful "standalone scales to cluster" path — you back up and restore.
- **Pick the index, don't take the default.** AUTOINDEX = HNSW + COSINE is a fine starting point, but Milvus's headline feature is that you *can* pick DiskANN for 10B vectors on SSD, IVF_PQ for memory-constrained recall, or GPU_CAGRA when you have NVIDIA hardware. Picking nothing wastes the architecture.
- **Use the partition key for multi-tenancy.** Do not create one collection per tenant. The partition-key path is the supported scale-out shape; per-tenant collections will hit `maxDatabaseNum = 64` and coordinator overhead long before you expect.
- **Treat WAL choice as load-bearing.** RocksMQ = single-node only. Pulsar = cluster default but operationally heavy. Kafka = if you already run Kafka. Woodpecker = the new 3.x option backed directly by object storage (no separate MQ to operate); explicitly recommended for new instances (`configs/milvus.yaml:170-172`).
- **Hybrid search is the right default for RAG.** Declare a dense vector field, declare a varchar field with a BM25 `Function`, query both, rerank with `rrf` (k=60) or `weighted`. This is the shape Milvus is now tuned for.

## When NOT to reach for this

The honest take for The Lossless Group: **we do not need Milvus today**. Our Chroma corpus is in the thousands-of-documents range, lives on one machine via the `chroma` MCP server, and gets ingested by `context-vigilance-kit/scripts/ingest-all.sh`. Milvus's separation of compute and storage is the right answer to a problem we don't have.

Concrete "do not reach for this" cases:

- **You have fewer than ~10M vectors and one machine to run on.** Chroma ([[Profile__Chroma]]) or LanceDB ([[Profile__LanceDB]]) are correct. Milvus's coordinator overhead is dead weight at that scale.
- **You're already operating Postgres.** pgvector ([[Profile__pgvector]]) inherits the transactional / backup / replication story you've already paid for. Milvus is a parallel operational universe.
- **You need disk format portability.** Milvus binlogs are Arrow-ish but practically read-only-through-Milvus. LanceDB is the right answer.
- **You don't have Kubernetes.** Standalone mode works but you lose the entire reason Milvus exists. Qdrant ([[Profile__Qdrant]]) scales up *then* out from a single binary and is far less painful in the in-between zone.
- **You want one process to operate.** Three external dependencies + nine roles + cgo + four ANN backends = a lot to keep alive. Qdrant or Chroma are dramatically simpler.

The case **for** Milvus, when it earns its complexity: you've grown past Qdrant's single-node ceiling (memory-bound HNSW, no horizontal scale on writes), you have k8s + S3 + Pulsar/Kafka already, you need DiskANN or GPU indexes, and your tenant count is large enough that the partition-key model is the right answer.

## How this compares to the rest of the study

| Axis | Milvus | [[Profile__Chroma]] | [[Profile__Qdrant]] | [[Profile__Weaviate]] | [[Profile__LanceDB]] | [[Profile__pgvector]] |
|---|---|---|---|---|---|---|
| **Topology** | 9 roles + etcd + MQ + object store | One process (or hosted) | One binary; cluster mode optional | One process; cluster optional | In-process / S3-direct | Postgres extension |
| **Default ANN** | HNSW (AUTOINDEX); IVF/DiskANN/SCANN/GPU pluggable per collection | HNSW | HNSW | HNSW | IVF_PQ / HNSW | HNSW + IVFFlat |
| **Index pluggability** | First-class — Knowhere registry | None — HNSW only | Quantization variants of HNSW | HNSW + flat | IVF/HNSW | Two indexes, period |
| **Filter pushdown** | Yes (segment scalar index → bitset → ANN) | Post-filter | Pushed into HNSW traversal | Pushed | Post-filter mostly | Standard SQL planner |
| **Filter language** | ANTLR DSL: `==`/`in`/`like`/`json_contains`/`st_within` | Mongo-ish `$eq`/`$in`/`$and` | Native JSON-payload | GraphQL `where` | DuckDB SQL | Full SQL |
| **Hybrid search** | First-class: BM25 function field + RRF/weighted/model/decay | Schema + Search (Cloud) | Sparse vectors + named multi-vector | Modules (BM25, generative, rerank) | Full-text via Tantivy | tsvector + vector via SQL |
| **Multi-tenancy** | Database / collection / partition / partition-key | Tenant + database + collection | Collection + shard + payload index | Tenant per class | Dataset namespace | Schema / table / row-level |
| **Persistence** | Object storage (canonical) + etcd + MQ | SQLite + duck-typed Parquet | RocksDB + WAL on local FS | LSM + WAL on local FS | Lance format on S3/disk | Postgres heap + WAL |
| **Disk portability** | Arrow-flavored binlogs, but read-through-Milvus | Read with sqlite + parquet | Snapshot tarballs only | Snapshot tarballs only | **Directly readable by DuckDB/Polars/Pandas** | `pg_dump` |
| **Embedded mode** | Milvus Lite (quickstart only) | First-class | First-class via Rust/Python bindings | No | First-class | No |
| **Best fit** | Billion-vector + k8s + multi-tenant | Laptop → small server, baseline RAG | Single-binary scale-up + payload-rich filters | Schema-on-write + RAG modules | Vectors + columnar analytics in one file | "Postgres is already here" |

## One-line summary

> Milvus is a nine-role distributed system that separates compute from storage, hides multiple ANN backends (HNSW, IVF, DiskANN, SCANN, GPU-CAGRA) behind one create-index API, and treats object storage + a message-queue WAL + etcd as the source of truth — which makes it the right default when you need billion-vector scale on Kubernetes and the wrong default for anything that fits on one machine.

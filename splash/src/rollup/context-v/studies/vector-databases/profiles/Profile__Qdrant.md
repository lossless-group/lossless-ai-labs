---
name: Qdrant Profile
slug: qdrant
upstream: https://github.com/qdrant/qdrant
package: qdrant (Docker), qdrant-client (PyPI), qdrant-edge-py (PyPI), qdrant-edge (crates.io)
license: Apache-2.0
maintainer: Qdrant (Andrey Vasnetsov et al.)
study: studies/vector-databases
profile_path: studies/vector-databases/qdrant
profile_kind: vector database (Rust core; server / cluster / embedded)
date_created: 2026-05-27
from: "studies/vector-databases"
from_path: "context-v/profiles/Profile__Qdrant.md"
---
# Qdrant — Profile

A profile of Qdrant as it lives in this study (`studies/vector-databases/qdrant/`). Cites pinned paths so you can jump to source rather than trust paraphrase. Read alongside [[Profile__Chroma]] (the baseline), [[Profile__Weaviate]] (the typed counterpart), [[Profile__Milvus]] (the distributed-first counterpart), [[Profile__LanceDB]] (the columnar-on-disk counterpart), and [[Profile__pgvector]] (the relational counterpart).

## TL;DR

Qdrant is a **payload-first** vector search engine written in Rust (`Cargo.toml:1-14`, version `1.18.1` on this pin). The thesis: a vector database isn't an ANN index with metadata bolted on — it's a **point store** where every point carries a rich JSON payload (`lib/segment/src/types.rs:2010-2012`), filters operate over that payload with full predicate expressivity (geo / range / full-text / nested / boolean composition — `lib/segment/src/types.rs:3370-3388, 3794-3825`), and the filter is **pushed into the HNSW graph traversal** rather than applied as a post-filter on dense-search results.

The filter-push-down is the headline differentiator. The strategy lives in `lib/segment/src/index/hnsw_index/hnsw/vector_index_impl.rs:107-172`: at query time, Qdrant calls `payload_index.estimate_cardinality(filter)` and picks between (a) plain payload-scan + brute scoring (when filter is selective), (b) HNSW graph traversal with the filter checked at every candidate (when filter is permissive), or (c) sample-based cardinality verification when fast estimation is ambiguous. When traversal is chosen and the filter is selective enough that the main HNSW graph would skip too many points, the build also constructs **additional payload links** (`payload_m` / `payload_m0`, `lib/segment/src/index/hnsw_index/config.rs:27-51`) — a second set of edges restricted to points matching each indexed payload condition. This is the "filterable HNSW" technique: the graph itself becomes filter-aware, so recall doesn't collapse when you filter by `tenant_id`.

Three deployment modes share one API: **embedded** (`qdrant-edge` Rust crate + `qdrant-edge-py` PyPI package, `lib/edge/README.md:1-43`), **single-node server** (Docker, port 6333, `Dockerfile`), and **distributed cluster** (Raft consensus via `tikv/raft-rs`, `Cargo.toml:108-118`; shards distributed via a hash ring, `lib/collection/src/hash_ring.rs:22-57`).

If you want one sentence: **Qdrant is a Rust-core vector engine that treats the payload as the central indexing axis, pushes filters into the ANN graph (not after it), ships scalar/binary/product quantization as first-class knobs, supports sparse + named multi-vectors with reciprocal-rank fusion baked in, and scales from in-process embed to Raft cluster on the same wire protocol.**

## Why this exists — the design bet

Qdrant's bets, all visible in the type definitions:

1. **Payload is JSON, not schema-on-write.** `Payload(pub Map<String, Value>)` (`lib/segment/src/types.rs:2010-2012`) — any `serde_json::Map`, no type enforcement at write time. Compare [[Profile__Weaviate]], which insists on declared classes and properties. Qdrant's contract is "write whatever; if you want it filterable, declare a payload index for that field."
2. **Filter expressivity is a first-class surface.** `Filter` has `must`, `should`, `must_not`, and `min_should` — quadrant-style boolean composition (`lib/segment/src/types.rs:3794-3825`). `Condition` covers Field / IsEmpty / IsNull / HasId / HasVector / Nested / nested Filter (`lib/segment/src/types.rs:3370-3388`). `FieldCondition` carries Match / Range / GeoBoundingBox / GeoRadius / GeoPolygon / ValuesCount.
3. **Filter push-down is the recall story.** Post-filtering after ANN search collapses recall when the filter is selective. Qdrant's cardinality-driven strategy (`lib/segment/src/index/hnsw_index/hnsw/vector_index_impl.rs:107-172`) and payload-aware HNSW edges (`payload_m`) keep recall high across the selectivity curve. See also the ACORN selectivity branch (`lib/segment/src/index/hnsw_index/hnsw/search.rs:38-86`) which switches algorithm when the filter is restrictive.
4. **HNSW only for dense.** No IVF, no DiskANN backend in-tree — the choice is "tune HNSW + quantization." Compare [[Profile__Milvus]], where pluggable backends per-collection are the headline.
5. **Quantization is configuration, not migration.** `QuantizationConfig` (`lib/segment/src/types.rs:891-899`) is an enum of `Scalar` / `Product` / `Binary` / `Turbo`, set per-collection at create time and re-applied per-segment without rewriting the original vectors.
6. **One API across embed / server / cluster.** Same REST + gRPC schema (`lib/api/src/rest/schema.rs`, `lib/api/src/grpc/`). Edge skips the network layer and exposes the same operations as Rust/Python bindings (`lib/edge/src/lib.rs`).

## Storage topology

The unit of storage is a **point**: ID + (named) vectors + payload. Points live in **segments** (immutable + write-ahead-log + appendable on top), segments group into **shards**, shards group into **collections**, collections live in a node, and nodes form a cluster.

| Layer | Crate | Code |
|---|---|---|
| Point + payload + vector types | `segment` | `lib/segment/src/types.rs`, `lib/segment/src/data_types/vectors.rs` |
| Segment (vectors + payload + indexes on disk) | `segment` | `lib/segment/src/segment_constructor/`, `lib/segment/src/segment/` |
| Payload index (per-field, e.g. KeywordIndex, IntegerIndex, GeoIndex, TextIndex) | `segment` | `lib/segment/src/index/field_index/` |
| HNSW dense index | `segment` | `lib/segment/src/index/hnsw_index/` |
| Sparse inverted index (BM25-style) | `sparse` | `lib/sparse/src/index/inverted_index/` |
| Quantization (scalar / binary / PQ / Turbo) | `quantization` | `lib/quantization/src/` |
| Write-ahead log (append-only segment files) | `wal` | `lib/wal/src/segment.rs`, `lib/wal/src/lib.rs:12-63` |
| Shard (WAL + segment-holder + optimizers + update worker) | `shard` | `lib/shard/src/{wal.rs,segment_holder/,optimizers/,update.rs}` |
| Collection (shard set + Raft + replica routing) | `collection` | `lib/collection/src/{config.rs,shards/,hash_ring.rs}` |
| Storage / RBAC / dispatcher | `storage` | `lib/storage/src/{rbac/,dispatcher.rs,content_manager/}` |
| REST + gRPC API | `api` | `lib/api/src/{rest/,grpc/}` |
| Edge (in-process Python + Rust) | `edge` | `lib/edge/{src/,python/}` |
| Snapshots (per-shard restorable archives) | `shard` | `lib/shard/src/snapshots/{snapshot_data.rs,snapshot_manifest.rs}` |

The interesting structural point: **payload is stored separately from vectors**. `on_disk_payload: bool` (`lib/collection/src/config.rs:128-135`) controls whether the payload values get loaded into RAM or read from disk on demand — *but indexed payload fields stay in RAM unconditionally*, because the cardinality estimator and filter checker need them hot.

## Schema of a point

A point in Qdrant carries:

```rust
// lib/segment/src/types.rs:2010-2012
pub struct Payload(pub Map<String, Value>);   // serde_json::Map<String, Value>

// lib/segment/src/types.rs:173 (ExtendedPointId)
enum ExtendedPointId { NumId(u64), Uuid(Uuid) }   // ID is u64 OR UUID

// Vectors are named (one or many per point), each can be:
//   Dense (Vec<f32 | f16 | u8>)  — sized + Distance::{Cosine,Dot,Euclid,Manhattan}
//   Sparse (SparseVector with indices + values)
//   MultiDense (e.g. ColBERT-style late-interaction, MaxSim comparator)
// See lib/segment/src/data_types/vectors.rs and lib/segment/src/types.rs:1620-1646
```

A REST upsert body looks like:

```jsonc
{
  "points": [{
    "id": 42,                                       // or a UUID string
    "vector": {                                    // named vector slot(s)
      "text": [0.1, 0.2, /* ... */],               // dense
      "bm25": {"indices": [3, 17, 902], "values": [0.7, 0.3, 0.9]}  // sparse
    },
    "payload": {                                   // arbitrary JSON
      "tenant_id": "acme",
      "geo": {"lat": 51.5, "lon": -0.12},
      "tags": ["alpha", "beta"],
      "ts": "2026-05-27T10:00:00Z"
    }
  }]
}
```

Notable for what's **present**: nested JSON paths are first-class (`JsonPath`, `lib/segment/src/json_path/`). Filters can match `"address.city"` directly. Geo and datetime are native, not stringly-typed. Named multi-vectors (`MultiVectorConfig`, `lib/segment/src/types.rs:1620-1646`) compare via `MaxSim` for late-interaction retrieval (ColBERT et al.).

## Payload indexes — the eight first-class types

Declared per-field via `create_payload_index`:

```
Keyword | Integer | Float | Geo | Text | Bool | Datetime | Uuid
```

Defined as an enum at `lib/segment/src/types.rs:2155-2164`, each with parameter struct at `lib/segment/src/types.rs:2190-2199` (e.g. `TextIndexParams` controls tokenizer + stopwords + min/max gram, `FloatIndexParams` controls range-bucket histogram). Implementations live in `lib/segment/src/index/field_index/{map_index,numeric_index,geo_index/,full_text_index/,bool_index/,null_index/}/`.

The `Text` index is the load-bearing one for hybrid lexical match: tokenizer + token-to-postings map, used by `Match::Text(MatchText { text })` and `Match::Phrase(MatchPhrase { phrase })` (`lib/segment/src/types.rs:2518-2553`).

## Filter push-down — the headline trick

A standard "vector + metadata" engine does **post-filtering**: run ANN, then drop the points that fail the filter. When the filter is selective (e.g. `tenant_id == "acme"` returns 0.1% of points), the ANN candidates almost all get dropped, recall collapses, and you have to massively over-fetch to recover. Qdrant takes three structural steps instead.

### Step 1 — cardinality-driven strategy selection

At query time (`lib/segment/src/index/hnsw_index/hnsw/vector_index_impl.rs:107-172`):

```rust
// estimate how many points the filter will admit
let query_point_cardinality = payload_index
    .with_view(|v| v.estimate_cardinality(query_filter, &hw_counter))?;

if query_cardinality.max < self.config.full_scan_threshold {
    // Filter is so selective it's cheaper to enumerate matches + brute-score
    return self.search_vectors_plain(/* ... */);   // line 122-133
}

if query_cardinality.min > self.config.full_scan_threshold {
    // Filter is permissive enough that traversing the graph wins
    return self.search_vectors_with_graph(/* ... */);   // line 135-146
}

// Ambiguous — run a sampled cardinality check against the actual data
let use_graph = sample_check_cardinality(/* ... */);    // line 152-160
```

`full_scan_threshold` is configurable per HNSW config (`lib/segment/src/index/hnsw_index/config.rs`); default expresses "how many points × bytes is it cheaper to brute-score than traverse." This branch — *small cardinality → plain, large cardinality → graph, ambiguous → sample* — is the recall-preserving move post-filter engines can't make.

### Step 2 — filter as an in-graph predicate

When the graph path is taken, the filter doesn't run *after* — it runs *during* candidate scoring via `FilteredScorer` (`lib/segment/src/index/hnsw_index/point_scorer.rs:53-80`):

```rust
pub struct FilteredScorer<'a> {
    raw_scorer: Box<dyn RawScorer + 'a>,
    filters: ScorerFilters<'a>,  // wraps a FilterContext compiled from the Filter
    scores_buffer: Vec<ScoreType>,
}

// ScorerFilters::check_vector — every neighbor visit consults this:
pub fn check_vector(&self, point_id: PointOffsetType) -> bool {
    check_deleted_condition(point_id, self.vec_deleted, self.point_deleted)
        && self.filter_context.as_ref().is_none_or(|f| f.check(point_id))
}
```

The HNSW traversal greedily walks neighbors, but only adds points to the candidate heap if they pass `check_vector`. A neighbor that fails the filter is still used as a graph hop (so connectivity isn't lost) but isn't returned in the result.

### Step 3 — additional payload links (filterable HNSW)

The risk in step 2 is graph disconnection: if a filter cuts the graph into islands, traversal can't reach matching points it would have found unfiltered. Qdrant's answer is to build **extra edges restricted to indexed payload blocks** during index construction (`lib/segment/src/index/hnsw_index/hnsw/build.rs:121-148, 502-525, 600-625, 627-690`):

```rust
// build.rs:121-124
let payload_m = HnswM::new(
    config.payload_m.unwrap_or(config.m),
    config.payload_m0.unwrap_or(config.m0),
);

// For each indexed payload field, find the points satisfying typical
// conditions on that field, and build an additional small HNSW subgraph
// over just those points — link them into the main graph.
let additional_links_params: Option<_> = (payload_m.m > 0)
    .then(|| payload_index_ref.with_view(|v| v.indexed_fields()))
    .filter(|fields| !fields.is_empty())
    .map(/* ... */);

// build.rs:600-625 — for a given FieldCondition, enumerate matching points
fn condition_points(
    condition: FieldCondition,
    payload_index: &StructPayloadIndex,
    vector_storage: &VectorStorageEnum,
    stopped: &AtomicBool,
) -> OperationResult<Vec<PointOffsetType>> {
    let filter = Filter::new_must(Field(condition));
    payload_index.with_view(|v| {
        let cardinality_estimation = v.estimate_cardinality(&filter, &hw)?;
        Ok(v.iter_filtered_points(/* ... */).collect())
    })
}

// build.rs:630-690 — build_filtered_graph adds these per-condition edges
```

Net effect: the graph carries both unfiltered edges (`m` / `m0`) and per-payload-block edges (`payload_m` / `payload_m0`). When a filter restricts to one block, the payload-edge subgraph is a connected backbone, so traversal stays effective even at high selectivity. This is what `qdrant.tech` documentation calls "filterable HNSW"; the actual code paths are `build.rs:502-525` (build) + `point_scorer.rs:53-80` (search-time check) + `vector_index_impl.rs:107-172` (which-path-to-take).

### Step 4 (optional, opt-in) — ACORN for highly selective filters

`SearchAlgorithm::Acorn` (`lib/segment/src/index/hnsw_index/hnsw/search.rs:60-86`) is an alternative traversal strategy turned on via `params.acorn.enable`. It re-routes graph search when the filter's selectivity falls below `acorn_max_selectivity` (`ACORN_MAX_SELECTIVITY_DEFAULT`, `lib/segment/src/types.rs:582`). The point: even within the filterable-HNSW model, Qdrant lets you swap the traversal heuristic when the workload is filter-dominated.

## Recall API — Query, prefetch, fusion

The current query API (`lib/api/src/rest/schema.rs:566-670`) is a **composable pipeline**:

```jsonc
POST /collections/<name>/points/query
{
  "prefetch": [                                  // optional sub-queries
    { "query": [0.1, 0.2, ...], "using": "text", "limit": 50 },
    { "query": {"indices": [...], "values": [...]}, "using": "bm25", "limit": 50 }
  ],
  "query": { "fusion": "rrf" },                  // combine prefetch results
  "filter": { "must": [{"key": "tenant_id", "match": {"value": "acme"}}] },
  "limit": 10,
  "with_payload": true
}
```

Query types (`lib/api/src/rest/schema.rs:640-670`):

- `Nearest` — classic ANN.
- `Recommend` — positive + negative example vectors.
- `Discover` — context-constrained search (the `discover_search_with_graph` path).
- `Context` — points in positive regions only.
- `OrderBy` — payload-field ordering (non-vector retrieval).
- `Fusion` — `rrf` (Reciprocal Rank Fusion, with `k` and weights — `schema.rs:524-551`) or `dbsf` (Distribution-Based Score Fusion).
- `Rrf` — explicit RRF with parameters.
- `Formula` — score boosting via arbitrary formula.
- `Sample` — random sampling.
- `RelevanceFeedback` — oracle-driven re-ranking.

The **hybrid retrieval** primitive is `prefetch` + `Fusion::Rrf` — you run multiple sub-queries (typically one dense, one sparse / BM25) and fuse the rank lists. This is what Mem0's adapter uses (`studies/memory-layers-for-agents/mem0/mem0/vector_stores/qdrant.py:82-86`) — the `bm25` named sparse vector slot is created at collection-init, then queried alongside the dense vector via prefetch.

## Quantization — first-class, three options

`QuantizationConfig` (`lib/segment/src/types.rs:891-899`):

```rust
pub enum QuantizationConfig {
    Scalar(ScalarQuantization),   // 1 byte/dim — q8 with min/max bounds
    Product(ProductQuantization), // codebook-based, lossier, tunable
    Binary(BinaryQuantization),   // 1 bit/dim — extreme compression
    Turbo(TurboQuantization),     // Qdrant's binary-derived variant
}
```

Implementations under `lib/quantization/src/`:

- `encoded_vectors_u8.rs` — scalar (8-bit) quantization
- `encoded_vectors_pq.rs` — product quantization
- `encoded_vectors_binary.rs` — binary quantization
- `turboquant/` — Qdrant's optimized binary variant

Configured per-collection at create time; the index keeps **both** the quantized form (used as a fast filter during HNSW traversal) and an oversampled rescoring step with the original vectors (the `oversampled_top` parameter at `lib/segment/src/index/hnsw_index/hnsw/search.rs:58`). The trade-off is RAM: binary quantization on a 768-dim collection cuts vector storage to 96 bytes/point, but the full vectors must still be readable for rescoring.

Scalar / product quantization require a rebuild when changed (`supports_appendable() == false`, `lib/segment/src/types.rs:919-924`). Binary and Turbo are appendable — you can flip the knob without re-ingesting.

## Persistence & operational story

### Write path

```
client → REST/gRPC → dispatcher (lib/storage/src/dispatcher.rs)
  → collection.update → shard.update (lib/shard/src/update.rs)
    → WAL append (lib/wal/src/segment.rs — append-only mmap segments)
    → in-memory segment update
    → async: optimizer merges + builds HNSW over closed segments
```

The WAL is the durability story (`lib/wal/src/lib.rs:12-63`): every write hits an append-only mmap'd file before the in-memory state changes. Closed WAL segments are retained per `num_closed_segments_to_retain` (default 1) so a restart can replay.

### Segments and optimization

A shard holds **multiple segments**, each a self-contained mini-database (vectors + payload + indexes). Writes go into an *appendable* segment; the optimizer background job (`lib/shard/src/optimizers/`) merges segments, rebuilds HNSW over the merged points, and atomically swaps. This is how "live re-index" works: you never re-index an entire shard; you re-index the next merged segment.

### Snapshots

`lib/shard/src/snapshots/` defines per-shard snapshots (`snapshot_data.rs`, `snapshot_manifest.rs`, `snapshot_utils.rs`). A snapshot is a tar of the shard directory (segments + WAL state + collection config). Restore creates a new shard from that tar; cross-cluster restore is the standard backup path.

### Distribution — Raft + hash ring

Cluster mode uses Raft (`tikv/raft-rs`, `Cargo.toml:108-118`) for **metadata consensus** (collection config, shard placement). Data is **not** routed through Raft — each shard is independent and the hash ring (`lib/collection/src/hash_ring.rs:22-57`) maps point IDs to shards. Resharding maintains *two* hash rings during transition (`HashRing::Resharding { old, new }`) so reads see both topologies until the migration completes.

Each shard has `replication_factor` copies (`lib/collection/src/config.rs:104-114`). Write consistency is configurable via `write_consistency_factor` — how many replicas must ack before success. The default is 1 (write to leader, replicate asynchronously); set to `replication_factor` for full quorum.

### Three deployment modes — same API

1. **Edge (embedded)** — `qdrant-edge` (Rust) and `qdrant-edge-py` (PyPI), `lib/edge/`. `EdgeShard::create(path, EdgeConfig{...})` (`README.md:80-93`) gives you a single shard in-process. Same `upsert / query / scroll / count` surface as the server.
2. **Single-node server** — `docker run -p 6333:6333 qdrant/qdrant` (`README.md:46-52`). REST on 6333, gRPC on 6334, web UI bundled (`pkg/`).
3. **Distributed cluster** — `docker compose` with multiple `qdrant` nodes joining via Raft. Shards distributed by hash ring; replicas placed across nodes. Re-clustering, resharding, and replica transfer are online operations (`lib/collection/src/shards/transfer/`, `lib/collection/src/shards/resharding.rs`).

### Auth & RBAC

JWT-based, with RBAC under `lib/storage/src/rbac/{auth.rs,ops_checks.rs,auditable_operation.rs}`. Per-collection and per-payload-field access scopes are enforced at the dispatcher layer.

## Scopes & multi-tenancy

Three nested levels:

1. **Collection** — schema-level boundary; one HNSW + payload-index set per collection.
2. **Shard key** — within a collection, points can be routed to specific shards via `sharding_method: "custom"` + `shard_key` (`lib/collection/src/config.rs:98-103`). Used for tenant isolation: each tenant gets its own shards, queries pass `shard_key: "tenant_acme"` to scope the search.
3. **Payload filter** — `must: [{"key": "tenant_id", "match": {"value": "acme"}}]` — the cheapest scope, but filter selectivity drives the cardinality strategy above.

The opinionated tenancy advice from Qdrant's own skills (`README.md:42` → `https://github.com/qdrant/skills`): use a **payload filter + payload index on `tenant_id`** for hundreds of tenants; use **custom shard keys** for tens of large tenants where physical isolation matters.

## Serialization on disk

A shard's directory under `storage/collections/<name>/<shard-id>/` contains:

- `wal/` — append-only WAL segments (mmap'd binary blocks)
- `segments/<segment-uuid>/` per closed segment:
  - `vector_storage/` — vectors (mmap'd or in-memory; quantized form lives here too)
  - `payload_storage/` — JSON-style payload (mmap or in-memory, per `on_disk_payload`)
  - `payload_index/` — per-field indexes (each its own subdirectory)
  - `hnsw_graph/` — HNSW edges + per-level structure
  - `segment.json` — metadata (creation time, point count, indexed fields)

The format is **not portable** to non-Qdrant programs — vectors are stored as compact binary blobs, HNSW edges as serialized link containers (`lib/segment/src/index/hnsw_index/graph_links.rs`), payload as `rmp-serde` (MessagePack) or a custom format under `lib/gridstore/`. A snapshot tar is the portable unit; a directory walk by a non-Qdrant program is not.

Compare [[Profile__LanceDB]], where the on-disk form is Apache Arrow / Lance columnar files readable by DuckDB / Polars / Pandas directly.

## Migration cost — moving Chroma → Qdrant

Both API surfaces use collection + filter dict + payload, so the mental model maps:

| Concept | Chroma | Qdrant |
|---|---|---|
| Container | Collection | Collection |
| Record | `(id, embedding, document, metadata)` | `(id, vector, payload)` |
| Filter language | `$eq / $ne / $gt / $in / $and / $or / $not` | `must / should / must_not / min_should` with Match / Range / Geo / ... |
| Where applied | post-filter on ANN result | push-down into HNSW (default) |
| Index | HNSW (only) | HNSW (only; ACORN as alternative traversal) |
| Multi-tenant scope | metadata filter | filter, shard key, or both |

Practical moves: (1) re-embed isn't required if you keep the same model; (2) IDs port directly (both accept arbitrary string/UUID/int); (3) Chroma metadata becomes Qdrant payload 1:1 — but to get push-down benefit you must declare `create_payload_index` on each field you filter by; (4) hybrid retrieval needs explicit BM25 sparse-vector ingestion (the Mem0 adapter shows this pattern at `studies/memory-layers-for-agents/mem0/mem0/vector_stores/qdrant.py:80-86`). The biggest behavioral change is **filter recall under selectivity** — workloads that were silently lossy in post-filter mode will surface more matches in push-down mode, sometimes enough to require re-tuning `top_k`.

## How Mem0 uses Qdrant (concretely)

Mem0's Qdrant adapter (`studies/memory-layers-for-agents/mem0/mem0/vector_stores/qdrant.py:1-90`) is the canonical "memory layer on top of Qdrant" reference, and the reason Qdrant is the default backend per [[Profile__Mem0]] (see TL;DR and §storage-topology there).

What it exercises:

- **Dual deployment**: `path=` for embedded, `url+api_key=` for server/cloud (`qdrant.py:60-76`). Same code path; the same `QdrantClient` swaps under the hood.
- **Payload indexes are declared at collection create** (`_create_filter_indexes`, `qdrant.py:143-158`) so every Mem0 filter benefits from push-down.
- **Filter operators map directly** to Qdrant's `FieldCondition`: `eq → MatchValue`, `ne → MatchExcept`, `in → MatchAny`, `nin → MatchExcept(list)`, `gte/lte/gt/lt → Range`, full-text contains → `MatchText` (`qdrant.py:224-298`).
- **Boolean composition**: Mem0's `AND/OR/NOT` filter trees translate to nested `Filter { must, should, must_not }` via `_create_filter` (`qdrant.py:298-372`).
- **Hybrid retrieval (v3)**: BM25 lives in a `bm25` named sparse-vector slot (`qdrant.py:80-86, 88`), populated via `fastembed`. Search prefetches both dense and sparse, then fuses (Qdrant's RRF).

If you want the cleanest reference for how to drive Qdrant from a real application, that adapter — `~600 LoC of Python` — is it.

## Mental model for using it well

- **Declare a payload index for every field you filter by.** Without one, the filter still works, but cardinality estimation degrades to a full scan and the push-down advantage is lost. The `indexed_fields()` call at `lib/segment/src/index/hnsw_index/hnsw/build.rs:131` is what makes filterable HNSW *filterable*.
- **Use `prefetch + rrf` for hybrid, not application-side fusion.** RRF is implemented in-process per shard (`lib/api/src/rest/schema.rs:524-551`), so the rank-fusion math doesn't pay a network round-trip.
- **Set `payload_m` if you have a few high-selectivity tenants.** Letting the index build extra edges per indexed-block is the structural fix for "Tenant A is 0.1% of the corpus and recall tanks." Cost: longer index build, more RAM per indexed field.
- **Use scalar quantization first, binary only when you've measured.** Binary cuts RAM by ~30× but is workload-sensitive; scalar gets you 4× with little quality loss on most real models.
- **Prefer shard-key isolation only when you have <100 large tenants.** For 10k small tenants, payload filter + index is dramatically cheaper than 10k shards.

## When NOT to reach for this

- **You want one in-process Python import and a `Client()` constructor.** Qdrant Edge exists (`lib/edge/python/`), but its developer ergonomics still trail [[Profile__Chroma]] for "I want a vector DB for this notebook."
- **Your storage layer must be readable by non-Qdrant tools.** The on-disk form is Qdrant-specific (`lib/segment/src/index/hnsw_index/graph_links.rs`, custom mmap structures). For Arrow / Parquet portability, [[Profile__LanceDB]] is the right choice.
- **You're already operating Postgres and "just need vectors."** [[Profile__pgvector]] is one `CREATE EXTENSION` away and inherits all of Postgres's operational story.
- **You need a typed graph of objects with references, not points.** [[Profile__Weaviate]]'s schema-on-write + cross-references is a closer fit; Qdrant has nested-payload filters but no concept of a `references` field type.
- **You want billions of points distributed across compute and storage tiers from day one.** [[Profile__Milvus]] is distributed-by-design; Qdrant is "scale up first, distribute when you must." Both can do it; Milvus is the bet that distribution is the only thing that matters.

## How this compares to the rest of the study

| Axis | Qdrant | [[Profile__Chroma]] | [[Profile__Weaviate]] | [[Profile__Milvus]] | [[Profile__LanceDB]] | [[Profile__pgvector]] |
|---|---|---|---|---|---|---|
| **Language** | Rust | Rust + Python | Go | Go (+ C++ for engine) | Rust | C (Postgres ext) |
| **Payload model** | JSON, untyped | metadata dict | schema-on-write (typed) | typed fields | Arrow columns | Postgres row |
| **Filter push-down** | Yes (cardinality-driven) | Post-filter | Yes | Yes | Yes (column predicate) | Yes (SQL planner) |
| **Filterable HNSW** | Yes (`payload_m`) | No | Partial | Per-backend | N/A | No (planner picks) |
| **ANN algorithms** | HNSW (+ ACORN traversal) | HNSW | HNSW (+ flat) | HNSW / IVF / DiskANN / ScaNN / GPU | HNSW + IVF | HNSW + IVFFlat |
| **Quantization** | Scalar / Product / Binary / Turbo (first-class) | Limited | PQ + SQ | Multiple | None native | None native |
| **Sparse vectors** | Native (inverted index) | No (Cloud only) | Via modules | Native | No native | No native |
| **Hybrid (RRF)** | Native (prefetch + fusion) | Cloud tier | Native | Native | Manual | Manual |
| **Multi-vector** | Native (MaxSim) | No | Limited | Limited | Limited | Limited |
| **Deployment modes** | Embed + server + cluster | Embed + server + cloud | Server + cluster | Standalone + cluster + Lite | Embed + server | Postgres ext |
| **Distribution** | Raft (metadata) + hash ring | Cloud only | Native cluster | Distributed by design | Object-store-friendly | Postgres replication |
| **Disk format portability** | Qdrant-specific | Qdrant/SQLite-ish | Weaviate-specific | Milvus-specific | Arrow / Lance (portable!) | Postgres pages |
| **Best fit** | Filter-heavy production agent stacks; Mem0 default | Embedded / context-DB framing | Typed object graph; RAG modules | k8s-scale, billions of vectors | Vectors + columnar analytics | "I already run Postgres" |

## One-line summary

> Qdrant is a Rust-core vector engine whose central bet is that the **payload is the index** — JSON in, with filters pushed into the HNSW traversal (not bolted on after), backed by per-condition payload-aware graph edges (`payload_m`), cardinality-driven strategy selection, native sparse + multi-vector + RRF for hybrid retrieval, three deployment modes on one API, and quantization as a first-class config knob — which is why Mem0 ships it as the default backend and why it's the most direct "migrate off Chroma" candidate by API shape.

---
name: Weaviate Profile
slug: weaviate
upstream: https://github.com/weaviate/weaviate
package: weaviate-server (Docker), weaviate-client (Python/Go/JS/Java/.NET)
license: BSD-3-Clause
maintainer: Weaviate B.V. (weaviate org)
study: studies/vector-databases
profile_path: studies/vector-databases/weaviate
profile_kind: networked-server + distributed-cluster + modular-runtime
date_created: 2026-05-27
from: "studies/vector-databases"
from_path: "context-v/profiles/Profile__Weaviate.md"
---
# Weaviate — Profile

A profile of Weaviate as it lives in this study (`studies/vector-databases/weaviate/`). Cites pinned `file:line` so you can jump to source rather than trust paraphrase. Read this alongside [[Profile__Chroma]] (the baseline), [[Profile__Qdrant]] (the untyped-JSON-payload counterpoint), [[Profile__Milvus]] (the other distributed entry), and — across the study line — [[Profile__RetainDB]] from `memory-layers-for-agents`, which makes the same typing bet at a higher abstraction layer.

## TL;DR

Weaviate is a **schema-on-write** vector database written in Go (BSD-3-Clause, ~70 modules, Raft consensus, GraphQL + REST + gRPC). The thesis: an embedding store is more useful when the records around the embeddings are *typed* — classes with named properties, primitive types (`text`, `int`, `boolean`, `uuid`, `geoCoordinates`, `phoneNumber`, `blob`, plus `cref` for cross-references) — and when the database itself owns the **embedding-and-RAG pipeline** through pluggable modules (`text2vec-*`, `reranker-*`, `generative-*`, `multi2vec-*`).

The architectural shape is hexagonal — `cmd/weaviate-server/` is the entry point, `adapters/handlers/{rest,grpc,graphql}/` are the inbound ports, `usecases/` is the application core (schema, traverser, objects, classification, multitenancy, backup), and `adapters/repos/db/` is the outbound storage adapter wrapping a custom LSM (`lsmkv`) plus three vector indexes (HNSW, flat, dynamic). Modules plug in via the `modulecapabilities.Module` interface (`entities/modulecapabilities/module.go:45-49`).

The distinguishing axis vs. [[Profile__Chroma]] is **schema-on-write**: classes and properties are declared, validated against a type system, and rejected if malformed *before* any object can be stored (`usecases/schema/class.go:1041-1091`). The distinguishing axis vs. [[Profile__Qdrant]] is the same trade-off as static-vs-dynamic typing in programming languages — Weaviate forces a class declaration; Qdrant accepts an arbitrary JSON payload per point. The distinguishing axis vs. [[Profile__Milvus]] is data-model framing — Weaviate is closer to a knowledge graph (cross-references are first-class, GraphQL is the primary query language); Milvus is closer to vectors-plus-metadata at k8s scale.

If you want one sentence: **Weaviate is a typed, modular, GraphQL-fronted vector database where classes have schemas, properties have data types (including cross-references between objects), embedding/reranking/generation lives in the DB as pluggable modules, hybrid search fuses BM25 and vectors via alpha-weighted RRF, multi-tenancy is a first-class collection-level switch, and cluster mode runs on Hashicorp Raft.**

## Why this exists — the design bet

Three bets distinguish Weaviate from the rest of the field:

1. **Typed schema at the storage layer is load-bearing.** Where [[Profile__Chroma]] accepts an arbitrary `metadata` dict per record and [[Profile__Qdrant]] accepts an arbitrary JSON `payload` per point, Weaviate requires you to declare a class with named properties and primitive types up front (`entities/schema/data_types.go:26-72`, `entities/models/class.go:31-72`). Class names must match `[A-Z][_0-9A-Za-z]{0,254}` (`entities/schema/validation.go:80`). Property writes that don't match the declared type are rejected at the validation gate. This buys you GraphQL auto-generation, cross-references, type-aware filters, and BM25 over `text`-typed fields — at the cost of a migration step every time the shape changes.
2. **The database owns the embedding-and-RAG pipeline.** The 68 directories under `modules/` (`ls modules/ | wc -l = 68`) cover ~20 `text2vec-*` providers (OpenAI, Cohere, HuggingFace, Voyage, Jina, Google, AWS, Mistral, Ollama, transformers, and a built-in `text2vec-weaviate`), ~10 `generative-*` providers (Anthropic, OpenAI, Cohere, Google, Mistral, Anyscale, Databricks, Ollama, NVIDIA, xAI), ~7 `reranker-*` providers (Cohere, Jina, Voyage, NVIDIA, transformers, ContextualAI), plus `multi2vec-*`, `img2vec-*`, `qna-*`, `sum-*`, `ner-*`, `text-spellcheck`, and four backup providers (`backup-{azure,filesystem,gcs,s3}`). Every module implements `Name() / Init() / Type()` (`entities/modulecapabilities/module.go:45-49`); types are enumerated as an enum (`Text2Vec`, `Text2TextGenerative`, `Text2TextReranker`, `Multi2Vec`, `Ref2Vec`, `Backup`, `Offload`, `Usage`, etc. — same file, lines 24-43). The DB takes the burden of "embed before write, rerank before return, generate at query time" off the application.
3. **GraphQL as the primary query language.** REST is generated from `openapi-specs/` via go-swagger; gRPC v1 lives in `adapters/handlers/grpc/v1/`; but the *expressive* surface — where you say "give me `Article { title, author { ... on Person { name } } }` with `nearText`, `where`, and `hybrid` arguments" — is GraphQL (`adapters/handlers/graphql/local/local.go:26-49`, `adapters/handlers/graphql/local/get/get.go:36-64`). Cross-references resolve as `graphql.NewUnion` types (`adapters/handlers/graphql/local/get/class_builder_references.go:25-65`), which is how a stored "ref to another object" becomes a first-class traversable edge in the query language.

## Storage topology

| Layer | Backend | Purpose | Code |
|---|---|---|---|
| **REST** | go-swagger generated handlers | OpenAPI surface (objects, schema, batch, backup, tenants) | `adapters/handlers/rest/`, generated from `openapi-specs/` |
| **gRPC v1** | Hand-written service | High-throughput `Search`, `BatchObjects`, `BatchDelete`, `BatchReferences`, `TenantsGet`, `Aggregate` | `adapters/handlers/grpc/v1/service.go:269` |
| **GraphQL** | tailor-platform/graphql resolvers built from the live schema | Expressive query language: `Get`, `Aggregate`, `Explore`, cross-ref traversal, `nearText`/`nearVector`/`hybrid` | `adapters/handlers/graphql/local/local.go:26-49` |
| **Use-case core** | Pure Go business logic | Schema validation, object CRUD, traverser/explorer, multitenancy, backup, classification | `usecases/{schema,objects,traverser,multitenancy,backup,classification}/` |
| **DB → Index → Shard → Store** | Custom LSM (`lsmkv`) + HNSW/flat/dynamic | Objects, inverted index, BM25 term frequencies, vector index per shard | `adapters/repos/db/` |
| **LSM strategies** | `replace` / `setcollection` / `mapcollection` / `roaringset` / `roaringsetrange` | KV / inverted multi-value / BM25 frequencies / roaring bitmap filtering | `adapters/repos/db/lsmkv/strategies.go:22-50` |
| **Vector index** | HNSW (primary), flat (brute-force), dynamic (auto-switch) | ANN with PQ/BQ/SQ compression | `adapters/repos/db/vector/{hnsw,flat,dynamic}/` |
| **Cluster** | Hashicorp Raft + BoltDB log store + FileSnapshotStore | Distributed schema consensus, leader-only writes, snapshot restore | `cluster/store.go:24-25, 452, 506` |
| **Persistence** | Filesystem under `PERSISTENCE_DATA_PATH` | Per-shard LSM directories + HNSW commit log + Raft `raft.db` | `cluster/store.go:60` (`raftDBName = "raft.db"`), `usecases/config/environment.go:649` |
| **Modules** | 68 pluggable Go packages | Vectorization, reranking, generation, backup, usage | `modules/` |

The CLAUDE.md inside the repo (`weaviate/CLAUDE.md`) gives the canonical reading order: *DB holds Indices (one per class), each Index manages Shards and multi-tenancy, each Shard contains an LSM Store for objects + properties, vector index(es), and an inverted index for filtering*. The three LSM bucket strategies — `Replace` (KV), `Set` (inverted multi-value), `Map` (BM25 term frequencies) — are the load-bearing primitives.

## Schema of a class (collection)

From `entities/models/class.go:31-72`:

```go
type Class struct {
    Class               string                    // e.g. "Article" — must match ClassNameRegexCore
    Description         string
    Properties          []*Property               // declared up front, type-checked
    VectorIndexType     string                    // "hnsw" | "flat" | "dynamic" | "hfresh"
    VectorIndexConfig   interface{}               // index-specific knobs (PQ/BQ/SQ etc.)
    VectorConfig        map[string]VectorConfig   // named vectors (multi-vector-per-object)
    Vectorizer          string                    // "text2vec-openai" | "text2vec-cohere" | "none" | ...
    ModuleConfig        interface{}               // per-module knobs (model name, dimensions, ...)
    InvertedIndexConfig *InvertedIndexConfig      // BM25 k1/b, stopwords, IndexNullState, IndexTimestamps
    MultiTenancyConfig  *MultiTenancyConfig       // Enabled, AutoTenantCreation, AutoTenantActivation
    ReplicationConfig   *ReplicationConfig        // factor, async replication
    ShardingConfig      interface{}               // virtualPerPhysical, desiredCount, function
    ObjectTTLConfig     *ObjectTTLConfig          // optional per-class object TTL
}
```

The 17 primitive data types (`entities/schema/data_types.go:27-72`):

```
cref            // cross-reference to another object — the graph-flavored primitive
text, text[]    // strings; tokenized for BM25
int, int[]
number, number[]
boolean, boolean[]
date, date[]
uuid, uuid[]
geoCoordinates  // lat/lng pair, queryable via WithinGeoRange
phoneNumber
blob, blobHash  // binary
object, object[] // nested objects (with NestedProperties recursively)
// Deprecated:
string, string[]  // pre-v1.19; migrated to text + tokenization
```

The `Property` struct (`entities/models/property.go:39-73`) carries `DataType []string` (an array because a `cref` property can target multiple classes — `["Person", "Organization"]`), three indexing toggles (`IndexFilterable`, `IndexSearchable`, `IndexRangeFilters`), and a `Tokenization` enum (`word | lowercase | whitespace | field | trigram | gse | kagome_ja | kagome_kr`).

Notable for what's **present** that [[Profile__Chroma]] doesn't have at the storage layer: typed primitives, cross-references (`cref`), nested objects (`object`/`object[]`), per-property indexing knobs, tokenization choice per property, and `MultiTenancyConfig` as a class-level switch. Notable for what's **absent**: no payload-level JSON blob — if your data doesn't fit the declared properties, the class must be migrated. This is the cost side of the typing bet.

## Write policy — schema-on-write, validated before storage

The validation entry point is `validateClassInvariants` (`usecases/schema/class.go:1041-1091`):

```go
func (h *Handler) validateClassInvariants(ctx, class, originalName, classGetterWithAuth, relaxCrossRefValidation) error {
    if _, err := schema.ValidateClassName(originalName); err != nil { return err }      // ^[A-Z][_0-9A-Za-z]{0,254}$
    for _, property := range class.Properties {
        if err := h.validateProperty(class, ..., property); err != nil { return err }     // type, name, tokenization, indexing
    }
    if err := h.validateVectorSettings(class); err != nil { return err }                  // HNSW/flat/dynamic + PQ/BQ/SQ
    if err := h.moduleConfig.ValidateClass(ctx, class); err != nil { return err }         // text2vec-* knows its own valid models
    if err := validateMT(class); err != nil { return err }                                // multi-tenancy + sharding incompatibility
    if err := replica.ValidateConfig(class, h.config.Replication); err != nil { return err }
    // ObjectTTL + inverted-index validation also run here.
    return nil
}
```

This is the architectural contrast with [[Profile__Chroma]] (which has no schema validation — anything goes in `metadata`) and [[Profile__Qdrant]] (which validates only that the vector dimension matches the collection's declared dimension; payload is free-form JSON). Weaviate refuses the write if any of these gates fails.

Cross-class-defined references are validated for target-class existence (`relaxCrossRefValidation: false`) except during restore, where the order of class creation is non-deterministic — the `relaxCrossRefValidation` parameter is the escape hatch for that one case (`class.go:1041, 1043`).

Object writes flow through `adapters/repos/db/crud.go` and `batch.go`. Cross-references between objects are added via `(db *DB) AddReference` (`adapters/repos/db/crud.go:276`), with the reference structure defined in `entities/models/single_ref.go:33` and `batch_reference.go:33-41` — the wire-format beacon is `weaviate://localhost/objects/<uuid>/<className>/<propertyName>`.

## Recall API — three surfaces, one query model

REST (`/v1/objects`, `/v1/graphql`, `/v1/schema`, `/v1/batch/objects`, `/v1/batch/references`, `/v1/backups/{backend}`) is for control-plane and small reads. gRPC v1 (`adapters/handlers/grpc/v1/service.go:269-322`) is the high-throughput data-plane — `Search`, `BatchObjects`, `BatchDelete`, `BatchReferences`, `Aggregate`, `TenantsGet`, `BatchStream`. GraphQL (`adapters/handlers/graphql/local/`) is the expressive read surface.

A representative GraphQL query against a schema-declared class:

```graphql
{
  Get {
    Article(
      hybrid: { query: "vector databases", alpha: 0.75 }
      where: { path: ["wordCount"], operator: GreaterThan, valueInt: 500 }
      limit: 10
    ) {
      title
      wordCount
      author {                          # cref property → union resolution
        ... on Person   { name }
        ... on Organization { name url }
      }
      _additional { score explainScore vector }
    }
  }
}
```

Filter operators (`entities/filters/filters.go:21-39`) are the full set this study's checklist asks about:

```
OperatorEqual, OperatorNotEqual,
OperatorGreaterThan, OperatorGreaterThanEqual, OperatorLessThan, OperatorLessThanEqual,
OperatorAnd, OperatorOr, OperatorNot,
OperatorWithinGeoRange, OperatorLike, OperatorIsNull,
ContainsAny, ContainsAll, ContainsNone
```

15 operators including `Like` (regex via `entities/filters/like_regexp.go`), geo-distance (`WithinGeoRange` with a `GeoRange{*GeoCoordinates, Distance float32}` — `filters.go:159-164`), boolean composition (`And`/`Or`/`Not` as `Operands []Clause`), null-check, and three contains-variants. Filters compose to a nested `Clause` tree (`filters.go:152-157`). This is materially richer than [[Profile__Chroma]]'s `$eq/$ne/$gt/$in/$and/$or/$not` and on par with [[Profile__Qdrant]].

## Hybrid search — alpha-weighted RRF or relative-score fusion

The hybrid retrieval entry point is `hybrid.Search` (`usecases/traverser/hybrid/searcher.go:75-153`). The alpha parameter (`searcher.go:82`) is the dial: `alpha=0` is pure BM25, `alpha=1` is pure vector, intermediate values fuse both. The fusion runs two parallel searches and combines them:

```go
alpha := params.Alpha
if alpha < 1 {
    res := processSparseSearch(sparseSearch())   // BM25 over inverted index
    found, weights, names = append(..., (1-alpha), "keyword")
}
if alpha > 0 {
    res := processDenseSearch(...)               // HNSW (or flat/dynamic)
    found, weights, names = append(..., alpha, "vector")
}
fused := performFusion(params.FusionAlgorithm, weights, found, names)
```

Two fusion algorithms ship: **ranked fusion** (`usecases/traverser/hybrid/hybrid_fusion.go:22-81`) — RRF with a hard-coded `k=60`:

```go
score := float32(weights[resultSetIndex] / float64(i+60))  // TODO replace 60 with a class-configured variable
```

— and **relative-score fusion** (same file, lines 93-182) — min/max-normalize each list's scores into `[0,1]`, then sum the weighted normalized scores. The relative-score path is the one Weaviate's docs recommend as default in modern versions because it preserves more signal than RRF when one stream has a long tail of low-confidence matches.

Cutoff distance and Autocut are layered on top: `params.WithDistance` truncates the dense list at the vector-distance threshold (`searcher.go:102-116`); `params.Autocut` (`searcher.go:149-151`) applies the standard Weaviate autocut heuristic to the fused list.

BM25 defaults (`usecases/config/config_handler.go:57-58`): `k1 = 1.2`, `b = 0.75` — the textbook Robertson values — configurable per-class via `InvertedIndexConfig.BM25.K1` / `.B`.

## Indexes — HNSW with PQ/BQ/SQ compression, dynamic switching

HNSW is the default (`adapters/repos/db/vector/hnsw/index.go:285-462`). Defaults from `entities/vectorindex/hnsw/config.go:27-32`:

```
MaxConnections (M)        = 32
EFConstruction            = 128
DynamicEFMin              = 100
DynamicEFMax              = 500
DynamicEFFactor           = 8
```

Three compression schemes ride on top (`entities/vectorindex/hnsw/config.go:60-114`):

- **PQ** (Product Quantization) — `Segments`, `Centroids`, `TrainingLimit`, `Encoder.{Type, Distribution}`. Train on first N vectors, then encode subsequent vectors against the trained codebook.
- **BQ** (Binary Quantization) — single bit per dimension, ~32x compression with cheap Hamming distance.
- **SQ** (Scalar Quantization) — int8 per dimension, ~4x compression, with `RescoreLimit` to refine the top-K with full-precision distances after the quantized first pass.

The **flat** index (`adapters/repos/db/vector/flat/index.go`) is brute-force for small datasets — no graph overhead. The **dynamic** index (`adapters/repos/db/vector/dynamic/index.go`) auto-switches from flat to HNSW when the shard crosses a configured threshold, which is the "you don't have to choose at schema-creation time" answer to small-collection performance.

Filter expressivity at search time is push-down through the inverted index (LSM `roaringset`/`roaringsetrange` strategies, `adapters/repos/db/lsmkv/strategies.go:25-26`) — filterable properties produce roaring bitmaps that intersect with the HNSW candidate set, rather than post-filtering after ANN return.

## Multi-tenancy — first-class, class-level toggle

Multi-tenancy is a `MultiTenancyConfig` block on the class (`entities/models/multi_tenancy_config.go:28-38`):

```go
type MultiTenancyConfig struct {
    Enabled              bool  // turn it on for this class
    AutoTenantCreation   bool  // accept writes to unknown tenants → create on first write
    AutoTenantActivation bool  // accept reads on cold tenants → activate (load shard) on demand
}
```

A multi-tenant class **cannot** also declare a `ShardingConfig` (`usecases/schema/class.go:646-647`) — the two distribution models are mutually exclusive. The tenant API (`usecases/schema/tenant.go:35-94`) supports `AddTenants`, with a per-collection cap (`MaxTenantsPerCollection`, enforced as a typed `LimitExceededError`).

Once enabled, every read/write request **must** carry a `tenant` parameter; the data lives in a per-tenant shard with its own LSM directory, its own HNSW index, its own inverted index. Tenant isolation is physical, not just logical — this is the answer to "I accidentally returned tenant A's data to tenant B," which is structurally impossible because the query never touches tenant A's files.

Compared to [[Profile__RetainDB]]'s `scope` column (USER / SESSION / PROJECT / AGENT / TASK / DOCUMENT — `studies/memory-layers-for-agents/retaindb` per [[Profile__RetainDB]] §Scopes & namespacing): RetainDB treats scope as a row-level discriminator under one shared index; Weaviate treats it as a shard-level discriminator with separate indexes. Same isolation guarantee at very different storage costs (Weaviate scales to millions of tenants because each tenant is small; RetainDB scales to many millions of records across a smaller tenant count).

## Cluster mode — Hashicorp Raft, schema consensus, write replication

The cluster layer (`cluster/`) runs Hashicorp Raft (`go.mod:54-55`: `github.com/hashicorp/raft v1.7.2` + `github.com/hashicorp/raft-boltdb/v2 v2.3.1`). Architecture (`cluster/store.go`):

- One Raft store per node, BoltDB-backed log (`raftDBName = "raft.db"`, line 60).
- `Store.Open` (`store.go:431`) creates the Raft node via `raft.NewRaft(st.raftConfig(), st, st.logCache, st.logStore, st.snapshotStore, st.raftTransport)` (line 452).
- `FileSnapshotStore` for periodic snapshots (line 506).
- `Raft` (`cluster/raft.go:31-44`) is the leader-aware client wrapper — `Apply` and `Query` operations forward to the current leader.

Schema changes are Raft-applied (`cluster/raft_apply_endpoints.go`, `cluster/store_apply.go`) — every node sees the same class definitions in the same order. Object writes are leader-coordinated with configurable replication factor (`entities/models/replication_config.go`). The `replication` and `replica` subpackages handle async replication, consistency levels, and read repair.

This is the only system in this study that ships a distributed consensus layer in the same repository (vs. [[Profile__Milvus]], which separates compute and storage into multiple processes coordinated through etcd, message queues, and object storage). Weaviate's "cluster mode" is closer to a single-process replicated system than a microservices architecture.

## Persistence & serialization

- **Data directory**: `PERSISTENCE_DATA_PATH` env var (`usecases/config/environment.go:649`). Per-class indexes nest as `<data-path>/<class-lowercased>/<shard>/`.
- **LSM segments**: Custom format under `adapters/repos/db/lsmkv/`. Five strategies (`strategies.go:22-50`) — `replace` (KV), `setcollection` (multi-value), `mapcollection` (BM25 frequencies), `roaringset` (roaring bitmap), `roaringsetrange` (range-queryable roaring). Segment files use a Weaviate-specific header layout; **a non-Weaviate program cannot parse these cleanly without the binary**. This fails the study checklist's "could a non-AI program parse it" question — contrast with [[Profile__LanceDB]] (Arrow-readable) and [[Profile__pgvector]] (vanilla Postgres tables).
- **HNSW commit log**: Append-only commit log per shard with periodic snapshots (`adapters/repos/db/vector/hnsw/commit_logger.go`, `commit_logger_snapshot.go`). Crash-recovery replays the log.
- **Raft**: BoltDB log (`raft.db`) + `FileSnapshotStore` for cluster-state snapshots.
- **Object serialization**: Custom binary format (`entities/storobj/storage_object.go:69, 112, 126`) — `FromBinaryNetwork`, `FromBinaryDisk`, `FromBinaryUUIDOnlyDisk`. Not portable outside Weaviate.

Migration cost out of Weaviate is non-trivial: there is no Arrow / Parquet / JSON-lines export at the storage layer. You go through REST/gRPC `/objects` paged reads or the cursor API to extract data — N round-trips per N records.

## Eviction & compaction

There is no record-level eviction analogous to [[Profile__Mem0]] / [[Profile__RetainDB]] memory-layer semantics — Weaviate is the primitive below those, and its job is to hold what you tell it to hold.

What it does have:

- **Tombstone cleanup** on HNSW (`adapters/repos/db/vector/hnsw/` — `condensor.go`, `condensor_mmap.go`) reclaims deleted-vector slots periodically.
- **LSM compaction** (`adapters/repos/db/lsmkv/`, multiple `compactor*.go` files) merges segments and drops tombstoned keys, same shape as RocksDB / LevelDB.
- **ObjectTTLConfig** on the class (`entities/models/class.go:50`, `usecases/object_ttl/`) — optional per-object TTL with a sweeper that deletes expired objects. This is the closest Weaviate gets to "eviction."

If you need supersession-as-a-column semantics (the [[Profile__RetainDB]] bet), you build that yourself on top of Weaviate with explicit `validUntil` / `supersededBy` properties and filter on them at query time. Weaviate gives you the typed fields to do it; it doesn't give you the policy.

## Scopes & namespacing

Three concentric scoping mechanisms:

1. **Class** (collection) — the top-level namespace. One class per logical entity type. Cross-references between classes are explicit (`cref` property type) and queryable as GraphQL union types.
2. **Namespace** (a recent addition, `usecases/namespaces/`) — qualified class names of the form `<namespace>:<Class>` (`entities/schema/validation.go:67-80`, `IndexNameRegexCore`). Adds a logical grouping above class without forcing multi-tenancy.
3. **Tenant** — per-tenant physical shard when `MultiTenancyConfig.Enabled = true`. The strongest isolation; required parameter on every operation against a MT-enabled class.

The combination — class + namespace + tenant — gives you a three-level scope tree that maps cleanly onto org → project → user. No equivalent in [[Profile__Chroma]] (which has only collections) or [[Profile__pgvector]] (which inherits Postgres schemas / row-level security).

## Operational story

Two deployment modes:

| Mode | Process | Storage | When |
|---|---|---|---|
| **Single-node Docker** | One container, port 8080 (REST) + 50051 (gRPC) | Local filesystem under `PERSISTENCE_DATA_PATH` | Dev, small production |
| **Distributed Kubernetes / Docker cluster** | N nodes with Raft consensus, optional sidecar inference modules | Local filesystem per node, replicated by config | Production at scale |

The `docker-compose.yml` in the repo (`weaviate/docker-compose.yml`) is a **developer-tooling** file (per its own comment lines 2-4: *"intended only for Weaviate development … should not be used directly"*). It wires Prometheus, Grafana, Keycloak, plus every inference container (`t2v-transformers`, `qna-transformers`, `multi2vec-clip`, `reranker-transformers`, `ollama`, `text2vec-model2vec`, ...) on separate ports. Production users get a smaller compose file from the docs site or run via Helm.

Inference modules deploy as **separate containers** that the Weaviate process talks to over HTTP — `text2vec-transformers` runs at `http://t2v-transformers:8080`, Weaviate calls it on every write to vectorize the text. Hosted modules (OpenAI, Cohere, etc.) are HTTP calls to the provider. This keeps the Weaviate Go binary small (CGO disabled, static linking — `make weaviate` per the repo CLAUDE.md) and the GPU workload isolated.

Telemetry, observability (Prometheus metrics built-in, `docs/metrics.md`), backup (S3/GCS/Azure modules), and authorization (RBAC via Casbin — `go.mod:21` `github.com/casbin/casbin/v2`) are all built-in.

## What's inside this submodule

| Path | What's there |
|---|---|
| `cmd/weaviate-server/` | go-swagger-generated `main.go` — wires REST handlers and starts the server |
| `adapters/handlers/rest/` | REST API (go-swagger generated + `configure_api.go` for wiring) |
| `adapters/handlers/grpc/v1/` | High-throughput gRPC v1 — `Search`, `BatchObjects`, `BatchDelete`, `BatchReferences`, `TenantsGet`, `Aggregate` |
| `adapters/handlers/graphql/` | GraphQL schema generated from the live class schema; `local/get`, `local/aggregate`, `local/explore` resolvers |
| `adapters/handlers/mcp/` | MCP server — Weaviate ships as an MCP-callable backend (modern surface) |
| `adapters/repos/db/` | Storage layer: LSM (`lsmkv/`), vector index (`vector/{hnsw,flat,dynamic,hfresh}/`), inverted index (`inverted/`) |
| `usecases/{schema,objects,traverser,multitenancy,backup,classification,...}/` | Business logic; ~30 sub-packages |
| `entities/{models,schema,filters,modulecapabilities,storobj,vectorindex,...}/` | Domain types and validation; the "what is a Class, what is a Property, what is a Filter" definitions |
| `modules/` | **68 modules** — `text2vec-*` (20), `generative-*` (10), `reranker-*` (7), `multi2vec-*` (8), `multi2multivec-*` (2), `text2multivec-*` (1), `img2vec-*` (1), `qna-*` (2), `sum-*` (1), `ner-*` (1), `text-spellcheck` (1), `ref2vec-centroid`, `backup-*` (4), `offload-s3`, `usage-{gcs,s3}` |
| `cluster/` | Hashicorp Raft cluster layer — `store.go`, `raft.go`, RBAC, replication, snapshots, distributed tasks |
| `grpc/proto/` | Protobuf definitions (regenerate via `make grpc`) |
| `openapi-specs/` | OpenAPI source-of-truth for REST (regenerate via `tools/gen-code-from-swagger.sh`) |
| `client/` | Go client SDK |
| `docs/` | Internal design notes — `metrics.md`, `usage_limits.md`, `runtime-reindex.md`, `proposals/` |
| `test/{acceptance,modules}/` | E2E tests, mostly via testcontainers |

If you only read one file: `usecases/schema/class.go` (1809 lines). Class creation, validation, defaults, multi-tenancy gating, vector-index configuration, module-config validation — the whole schema-on-write story is there.

## Mental model for using it well

- **Declare your classes deliberately.** The typing is the value. A `text` property gets BM25, tokenization, and inverted-index for free; an `int` gets range filters and aggregations; a `cref` gets GraphQL union traversal. Putting everything in one untyped `metadata` blob (Chroma-style) defeats the whole point.
- **Choose a vectorizer module at class-creation time.** `Vectorizer: "text2vec-openai"` means every write automatically embeds the configured `text` properties; `Vectorizer: "none"` means you bring your own vectors per the [[Profile__Chroma]] / [[Profile__Qdrant]] pattern. The choice is per-class — different classes can use different embedding models.
- **Use named vectors when one object needs multiple embeddings.** `VectorConfig: map[string]VectorConfig` (`class.go:62`) lets a single `Product` object carry `title_vector`, `description_vector`, and `image_vector` separately, queried independently with target-vector selection.
- **Turn on multi-tenancy if you have any user-isolated data.** The cost of *not* using it is "I accidentally returned tenant A's data to tenant B." The cost of using it is "each tenant has its own shard," which is fine until you have a million tiny tenants and shard creation overhead dominates — at which point you're better off with row-level scoping ([[Profile__RetainDB]] shape).
- **Use GraphQL for development, gRPC for production hot paths.** GraphQL is expressive; gRPC is fast. They share the same query model under the hood — both go through `usecases/traverser/`.
- **Treat cross-references as the killer feature for relational-shaped data.** "Article → authoredBy → Person, Person → worksAt → Organization" is one GraphQL query in Weaviate; it's two or three round-trips against [[Profile__Chroma]] or [[Profile__Qdrant]] with manual JOIN-in-application-code.

## When NOT to reach for this

- **You want a no-schema, dict-in dict-out experience.** [[Profile__Chroma]] is dramatically simpler when the records are just `{document, metadata}` and you don't care about typing or cross-refs.
- **You want raw payload flexibility per record.** [[Profile__Qdrant]] accepts arbitrary JSON; Weaviate forces a class migration. If your data shape is genuinely heterogeneous, Qdrant is the better fit.
- **Your "other data" already lives in Postgres.** [[Profile__pgvector]] lets you `CREATE EXTENSION` and have vectors in the same database as your transactional tables, with full SQL filter expressivity. The marginal cost of *also* doing vectors is one extension install; the marginal cost of standing up Weaviate alongside Postgres is a whole separate operational tier.
- **You want Arrow-readable persistence.** [[Profile__LanceDB]] writes a columnar Lance format that DuckDB / Polars / Pandas can read directly. Weaviate's LSM is Weaviate-only.
- **You're at billion-vector / multi-billion-vector scale with a strict separation of compute and storage.** [[Profile__Milvus]] is the Kubernetes-native answer when the cluster topology needs to scale storage and compute independently. Weaviate scales horizontally with Raft but doesn't separate the two tiers.
- **Local markdown + `chroma run` is enough.** The Lossless `context-vigilance` discipline + Chroma MCP server already covers the team's current corpus needs. Weaviate's typing and modular RAG pipeline earn their keep when the schema is rich enough to need a type system and the embedding workload is heavy enough to want the DB to manage it.

## How this compares to the rest of the study

| Axis | Weaviate | [[Profile__Chroma]] | [[Profile__Qdrant]] | [[Profile__Milvus]] | [[Profile__LanceDB]] | [[Profile__pgvector]] |
|---|---|---|---|---|---|---|
| **Language** | Go | Python + Rust (core) | Rust | Go + C++ | Rust | C (Postgres ext) |
| **License** | BSD-3-Clause | Apache-2.0 | Apache-2.0 | Apache-2.0 | Apache-2.0 | PostgreSQL |
| **Schema** | **On-write, typed** | On-read (free-form dict) | On-write for vector dim only; payload free-form | On-write, typed | On-write, Arrow schema | SQL DDL |
| **Primary query** | **GraphQL** + REST + gRPC | Python/JS dict API + REST | REST + gRPC + Rust SDK | gRPC + Python SDK | Python/Rust/Node SDK | SQL |
| **Filter operators** | 15 (`Equal..ContainsNone`, geo, `Like`, `IsNull`) | 7 (`$eq..$not`) | Full predicate + range + geo | Boolean + range + IN | SQL/DataFusion subset | Full SQL |
| **Hybrid** | First-class (`alpha` + RRF/RelativeScore) | Recent (Search primitives) | Sparse + dense + RRF | BM25 + vector | Manual fusion | Manual SQL CTE |
| **Cross-references** | **First-class `cref` + GraphQL union** | No | No (single payload) | No | No (one-to-many via join) | Yes (SQL FK) |
| **Modules / RAG pipeline** | **68 built-in modules** | Embedding functions | None — bring-your-own | None — bring-your-own | Pluggable embedding fns | None |
| **ANN index** | HNSW + flat + dynamic; PQ/BQ/SQ | HNSW (SPANN in Cloud) | HNSW + quantization | HNSW / IVF / DiskANN / ScaNN / GPU | IVF-PQ + HNSW | HNSW + IVFFlat |
| **Multi-tenancy** | **Per-class toggle → physical per-tenant shard** | Per-collection (logical) | Per-collection + payload filter | Partition keys | Per-table | Postgres schemas / RLS |
| **Distribution** | Raft consensus, single binary | Single-node (Cloud: managed) | Cluster mode (Raft for schema) | Native distributed (k8s-first) | Embedded; OSS no cluster | Postgres replication |
| **Persistence** | Custom LSM + HNSW commit log | SQLite + binary segments | Custom segments + WAL | Object storage + WAL | **Lance / Arrow (portable)** | Postgres heap + WAL |
| **Best fit** | Typed knowledge-graph-flavored data with built-in RAG pipeline | "Just give me embeddings + metadata" prototypes | Payload-heavy points with rich filters | Billion-scale, k8s-native, separated compute/storage | Vectors-alongside-columnar-data, file-format portability | "Already running Postgres" |

## Cross-study reference — typing at different abstraction layers

[[Profile__RetainDB]] (in `studies/memory-layers-for-agents`) makes the same architectural bet — *typing matters* — but at a different layer of the stack:

- **Weaviate** types at the **storage** layer. Classes have properties; properties have data types (`text`, `int`, `cref`, `geoCoordinates`, ...). The type system describes the *shape* of the record. Cross-references are graph-flavored primitives between objects. The DB validates structure before storage; the application is free to attach any semantic meaning on top.
- **RetainDB** types at the **memory-category** layer. Every memory is a row in one big table; the table has fixed columns (per `studies/memory-layers-for-agents/retaindb/packages/server/prisma/schema.prisma:215-272`); but the `memoryType` enum (`factual` / `preference` / `correction` / `instruction` / `goal` / ...) tags the *semantic role* of the memory. The 13-type enum drives durability, decay-immunity, and supersession policy. The type system describes *what kind of remembered thing* a record is, not *what fields it has*.

These compose well: a memory-layer like RetainDB could store its memories in Weaviate by declaring a `Memory` class with the 13-value `memoryType` as a `text` property and the supersession columns as typed scalars — and would gain Weaviate's GraphQL traversal, cross-references between memories, and module-based embedding/reranking. RetainDB's current Postgres + pgvector choice ([[Profile__pgvector]]) is the simpler operational answer; the Weaviate path would be the answer if the memory model needed graph traversal and module-managed embedding more than it needed SQL-shaped joins.

## One-line summary

> Weaviate is the schema-on-write, GraphQL-fronted, modules-included vector database — typed classes with cross-references between objects, ~68 pluggable modules that own the embedding/reranking/generation pipeline, alpha-weighted hybrid search built in, first-class multi-tenancy as a class-level toggle, Hashicorp Raft for cluster consensus, and BSD-3-Clause licensing throughout — which makes it the right default when the data has structure worth declaring and the wrong default when "just store the dict" is the whole brief.

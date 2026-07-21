---
name: pgvector Profile
slug: pgvector
upstream: https://github.com/pgvector/pgvector
package: pgvector (PostgreSQL extension; vector.control)
license: PostgreSQL License (BSD-style permissive)
maintainer: Andrew Kane (ankane)
study: studies/vector-databases
profile_path: studies/vector-databases/pgvector
profile_kind: postgres-extension
date_created: 2026-05-27
from: "studies/vector-databases"
from_path: "context-v/profiles/Profile__pgvector.md"
---
# pgvector — Profile

A profile of pgvector as it lives in this study (`studies/vector-databases/pgvector/`). Cites pinned paths so you can jump to source rather than trust paraphrase. Read alongside [[Profile__Chroma]], [[Profile__Qdrant]], [[Profile__Weaviate]], [[Profile__Milvus]], and [[Profile__LanceDB]] — pgvector is the entry that consciously cedes "pure vector DB" virtues in exchange for being a Postgres column type.

## TL;DR

pgvector is a Postgres extension — a single `.so` you load with `CREATE EXTENSION vector` (`vector.control:1-4`) — that adds **four new column types** (`vector`, `halfvec`, `sparsevec`, plus first-class `bit` distance ops), **six distance operators** (`<->`, `<#>`, `<=>`, `<+>`, `<~>`, `<%>` per `sql/vector.sql:174-192, 660-668`), and **two index access methods** (`ivfflat`, `hnsw` per `sql/vector.sql:250-262`) to Postgres. That's the entire surface.

The headline fact: the C source is **~13.7k lines total** (`wc -l src/*.c src/*.h`), of which the substantive vector / index logic is roughly 3k. Everything else — filtering, transactions, replication, backups, ACL, point-in-time recovery, foreign data wrappers, logical decoding, ALTER TABLE, JSON, full-text search, GiST/BRIN/B-tree indexes on neighbouring columns — is inherited from Postgres unchanged. The contrast against [[Profile__Qdrant]] (a Rust monolith that re-implements payload, transactions, RBAC, snapshots, raft, etc.) is roughly two orders of magnitude of code, and that is the whole design.

If you want one sentence: **pgvector is the smallest possible answer to "I have Postgres; I want to do nearest-neighbor search" — vectors are just a column type, distances are just operators, and everything else (filters, joins, transactions, ops) is the Postgres you already run.**

## Why this exists — the design bet

Most of the vector DBs in this study (Chroma, Qdrant, Weaviate, Milvus, LanceDB) make the bet that vector search is a *different enough* workload to deserve a purpose-built system with its own storage, payload model, filter DSL, scoping primitives, and operational surface. pgvector makes the opposite bet:

1. **Postgres already solved 95% of the problems a vector DB needs.** Transactions, MVCC, WAL, replication, backups, ACL, FDW, CDC, JSON, full-text search, partitioning. Rebuilding those is the actual cost of a from-scratch vector DB.
2. **A vector is just a `float[]` with a fixed length.** The on-disk layout (`src/vector.h:11-17`) is literally `{varlena_header, int16 dim, int16 unused, float x[dim]}`. That's it. There is no payload model, no metadata schema, no scope abstraction — your row already has columns for those.
3. **Filter expressivity is "all of SQL."** No `where_filter` JSON dialect; you write `WHERE category_id = $1 AND tenant_id = $2 AND created_at > now() - interval '7 days' ORDER BY embedding <-> $3 LIMIT 10`. The planner handles push-down, index combination, partial indexes, partitioning.
4. **Operational story is the Postgres operational story.** If your org runs Postgres, you already know how to back up, replicate, monitor, alert, patch, and upgrade pgvector. There is no second runbook.

The bet pays off when "I have Postgres for transactional data" is already true. It fails when the dataset is large enough that Postgres heap/index sizing, autovacuum, or `maintenance_work_mem` ceilings start dominating — see [[Profile__Milvus]] for the other end of that spectrum.

## Storage topology

| Layer | Backend | Purpose | Code |
|---|---|---|---|
| Value type | Postgres heap (varlena) | The float array itself, TOAST-compressed if large | `src/vector.h:11-17`; `STORAGE = external` in `sql/vector.sql:23-30` |
| Index — exact | Postgres seq scan | Default; perfect recall, full table scan | `README.md:197-198` |
| Index — HNSW | Postgres index AM (`hnsw`) | In-memory graph during build, paged on disk | `src/hnsw.c:266-326`; `src/hnswbuild.c:1-36` |
| Index — IVFFlat | Postgres index AM (`ivfflat`) | K-means centroids + posting lists | `src/ivfflat.c`; `src/ivfbuild.c`; `src/ivfkmeans.c` |
| Durability | Postgres WAL | All inserts WAL-logged via `generic_xlog` | `src/hnswinsert.c:4`; `src/ivfbuild.c:6` |
| Backup / PITR / replication | Postgres (unchanged) | Logical and physical replication just work | inherited |

There is no separate vector store, no separate metadata DB, no separate audit log. A row carrying a vector is a row carrying a vector — `id`, `tenant_id`, `created_at`, `tags jsonb`, `content tsvector`, `embedding vector(1536)` are all colocated columns of the same heap tuple.

## Schema — there is none, you write the table

The "schema of a memory record" question that dominates [[Profile__Mem0]] or [[Profile__Honcho]] profiles is a category error for pgvector. The schema is whatever `CREATE TABLE` you write:

```sql
CREATE TABLE items (
    id          bigserial PRIMARY KEY,
    tenant_id   uuid NOT NULL,
    content     text,
    content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    tags        jsonb,
    created_at  timestamptz DEFAULT now(),
    embedding   vector(1536)
);
```

The four pgvector-supplied types are:

| Type | Per-element bytes | Max dim | Code | When to use |
|---|---|---|---|---|
| `vector(N)` | 4 (float32) | 16,000 | `src/vector.h:4, 11-17` | Default. ANN with HNSW capped at 2,000 dim. |
| `halfvec(N)` | 2 (IEEE 754 binary16) | 16,000 | `src/halfvec.h:54, 60-67` | Cut storage and index size 50% with negligible recall loss. HNSW supports up to 4,000 dim. |
| `bit(N)` | 1/8 (one bit) | 64,000 (HNSW) | native Postgres `varbit` + pgvector ops | After `binary_quantize()` for re-rank pipelines. |
| `sparsevec(N)` | variable | 1B dim, max 16k non-zeros | `src/sparsevec.h:4-5, 17-23` | Learned-sparse retrieval (SPLADE etc.). HNSW only. |

All four are TOAST-able (`STORAGE = external` per `sql/vector.sql:29, 359, 716`) so a 1536-dim vector at 6 KB happily lives in-line on a typical 8 KB page; a 4096-dim vector spills to TOAST automatically.

## Write policy — there is no policy

Insert with `INSERT`, update with `UPDATE`, delete with `DELETE`, upsert with `ON CONFLICT DO UPDATE`. The MVCC contract is the standard Postgres MVCC contract — readers never block writers, writers don't block readers, transactions are ACID, foreign keys cascade, triggers fire. pgvector does not own the write path; it owns the *index maintenance* path. `aminsert = hnswinsert` (`src/hnsw.c:300, 364`) hooks into the standard Postgres index-AM machinery and is called by the heap-AM when a row is inserted or updated, exactly the same way B-tree, GIN, or GiST hook in. WAL is emitted via `generic_xlog` (`src/hnswinsert.c:4`, `src/ivfbuild.c:6`) — meaning physical replication and PITR work without pgvector having to write a single line of replication code.

This is the load-bearing inheritance the rest of this study's entries do not get. [[Profile__Qdrant]] reimplements raft. [[Profile__Milvus]] reimplements pub/sub on top of Pulsar/Kafka. [[Profile__Chroma]] has its own WAL. pgvector reuses Postgres's.

## Recall API — it's just SQL

The whole query surface, per `README.md:131-179`:

```sql
-- nearest neighbors
SELECT * FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
-- nearest by row
SELECT * FROM items WHERE id != 1
  ORDER BY embedding <-> (SELECT embedding FROM items WHERE id = 1) LIMIT 5;
-- distance threshold (needs ORDER BY + LIMIT to use an index)
SELECT * FROM items WHERE embedding <-> '[3,1,2]' < 5;
-- distance as a column
SELECT id, embedding <-> '[3,1,2]' AS distance FROM items;
-- average vectors (built-in aggregate, sql/vector.sql:116-130)
SELECT category_id, AVG(embedding) FROM items GROUP BY category_id;
```

Six distance operators (`sql/vector.sql:174-192` for `vector`; symmetric definitions for `halfvec` at `:516-534` and `sparsevec` at `:828-846`):

| Operator | Distance | C function | File:line |
|---|---|---|---|
| `<->` | L2 (Euclidean) | `l2_distance` | `src/vector.c:573-583` |
| `<#>` | negative inner product (Postgres only does `ASC` index orderbys) | `vector_negative_inner_product` | `src/vector.c:631-641` |
| `<=>` | cosine distance (1 − cosine similarity, clamped to [−1, 1]) | `cosine_distance` | `src/vector.c:665-690` |
| `<+>` | L1 (Manhattan) | `l1_distance` | `src/vector.c:734-744` |
| `<~>` | Hamming (bit) | `hamming_distance` | `sql/vector.sql:652-653, 660-663` |
| `<%>` | Jaccard (bit) | `jaccard_distance` | `sql/vector.sql:655-656, 665-668` |

All four float-distance kernels are written as auto-vectorizable plain C loops (`src/vector.c:558-565, 606-610, 643-660, 718-728`) with `__attribute__((target_clones("default", "fma")))` runtime dispatch when the compiler supports it (`src/vector.c:36-40`). The CPU does the SIMD; pgvector does not ship hand-rolled AVX-512.

**Filter pushdown is not a feature, it's the planner.** `WHERE tenant_id = $1 AND embedding <-> $2 < 0.4 ORDER BY embedding <-> $2 LIMIT 10` is a plan the Postgres planner will choose between (a) seq-scan + filter, (b) B-tree on `tenant_id` + recheck, (c) HNSW index scan + post-filter on `tenant_id`, (d) partial HNSW index per-tenant — based on row estimates and the index it finds. Section `README.md:424-472` walks through the trade-offs explicitly, including the gotcha that approximate indexes **post-filter** — if the selectivity is low you need either `hnsw.ef_search` raised (`README.md:450-454`) or `hnsw.iterative_scan` (`README.md:456-460`, new in 0.8.0 per `CHANGELOG.md`) or **partial indexes** (`README.md:462-466`):

```sql
-- one HNSW index per tenant, query planner picks automatically
CREATE INDEX ON items USING hnsw (embedding vector_l2_ops) WHERE (tenant_id = '...');
```

## Indexes — two algorithms, both inherited into the standard index AM

pgvector implements exactly two index access methods (`sql/vector.sql:250-262`); both register through the standard Postgres `IndexAmRoutine` (`src/hnsw.c:266-326`, `src/ivfflat.c`), which means `CREATE INDEX`, `REINDEX`, `VACUUM`, `pg_stat_progress_create_index`, parallel build workers, and `CREATE INDEX CONCURRENTLY` (`README.md:700-704`) all work unchanged.

### HNSW (`src/hnsw*.c`)

Graph-based ANN per Malkov & Yashunin. Defaults in `src/hnsw.h:46-54`:

| Parameter | Default | Range | Meaning |
|---|---|---|---|
| `m` | 16 | 2–100 | Max connections per layer (layer 0 has `2*m` per `src/hnsw.h:93`) |
| `ef_construction` | 64 | 4–1000 | Candidate list size at build |
| `hnsw.ef_search` | 40 | 1–1000 | Candidate list size at query |
| `hnsw.iterative_scan` | off | off / relaxed / strict | Auto-grow `ef_search` if filter knocks out too many candidates (0.8.0+, `src/hnsw.c:28-33`) |

The build (`src/hnswbuild.c:1-36`) is a two-phase algorithm: build the whole graph in `maintenance_work_mem`, then flush to disk; if it overflows, switch to one-tuple-at-a-time on-disk inserts. Parallel build uses shared memory with relative pointers (`src/hnswbuild.c:11-18`). Build time is sensitive to `maintenance_work_mem` (`README.md:289-318`) — the notice `hnsw graph no longer fits into maintenance_work_mem after N tuples` (`README.md:299-303`) is the operational signal.

### IVFFlat (`src/ivf*.c`)

Inverted-file with k-means centroids. Defaults in `src/ivfflat.h:51-54`:

| Parameter | Default | Meaning |
|---|---|---|
| `lists` | 100 | Number of k-means centroids; rule of thumb `rows/1000` up to 1M, `sqrt(rows)` past that (`README.md:340-342`) |
| `ivfflat.probes` | 1 | How many lists to scan at query; rule of thumb `sqrt(lists)` (`README.md:342`) |
| `ivfflat.max_probes` | `IVFFLAT_MAX_LISTS` | Cap when iterative scan grows probes (`src/ivfflat.c:55-56`) |

Trade-off vs. HNSW (`README.md:208, 336`): IVFFlat builds faster and uses less memory but has worse speed-recall; HNSW needs no training data (index can exist before rows do) but builds slower and uses more memory. The README is unusually direct about this.

### Dimension caps

HNSW indexes are capped at 2,000 dims for `vector` (`src/hnsw.h:25`), 4,000 for `halfvec` (real cap is `HNSW_MAX_NNZ` and per-page math), 64,000 for `bit`, and 1,000 non-zeros for `sparsevec` (`README.md:250-256`). The data type itself goes to 16,000 dims (`src/vector.h:4`); if you have a 4096-dim OpenAI embedding and want an HNSW index, you either store it as `halfvec(4096)` or quantize.

## Quantization — three flavours, all expression-indexable

This is where pgvector gets genuinely clever about scale. Because Postgres supports **expression indexes**, you can index a quantized form of the vector without changing the column type:

```sql
-- index the bit-quantized form, store the float32 (README.md:589-605)
CREATE INDEX ON items USING hnsw ((binary_quantize(embedding)::bit(1536)) bit_hamming_ops);

-- over-fetch on the cheap binary index, then re-rank by full float32
SELECT * FROM (
    SELECT * FROM items
    ORDER BY binary_quantize(embedding)::bit(1536) <~> binary_quantize('[...]') LIMIT 100
) ORDER BY embedding <=> '[...]' LIMIT 10;
```

The `binary_quantize` implementation is 25 lines (`src/vector.c:946-972`) — sign bit per dimension, packed 8-per-byte, auto-vectorizable. The three escalation tiers per `README.md:746-756`:

1. **`halfvec`** — 50% smaller, ~free recall (one cast).
2. **Binary quantization with re-rank** — ~32× smaller index, fits-in-RAM-at-scale (`README.md:730`).
3. **Subvector indexing** (`README.md:640-660`) — index a learned prefix (Matryoshka-style), re-rank with the full vector.

Compare to [[Profile__Qdrant]] which ships scalar/product/binary quantization as first-class index knobs; pgvector achieves equivalent functionality through expression indexes without adding any new index machinery. Smaller surface, same workflows.

## Hybrid search — `tsvector` is already in Postgres

There is no built-in BM25 / RRF / cross-encoder primitive (compare [[Profile__Weaviate]] and Chroma Cloud's `Schema()/Search()` — both ship these). pgvector's hybrid story per `README.md:629-638` is "use Postgres full-text search":

```sql
SELECT id, content
FROM items, plainto_tsquery('hello search') query
WHERE textsearch @@ query
ORDER BY ts_rank_cd(textsearch, query) DESC
LIMIT 5;
```

…and combine the result sets in the application layer with RRF (the README links `examples/hybrid_search/rrf.py` in the Python bindings) or a cross-encoder. This is *less* turnkey than Qdrant/Weaviate hybrid, but materially more flexible — you compose `tsvector`, `vector`, `pg_trgm` trigram similarity, `jsonb` containment, geographic distance from PostGIS, and date ranges into a single CTE-shaped query.

## Scopes & namespacing — there is no scope primitive

Multi-tenancy is **a column**, not a config. The conventional patterns:

- `WHERE tenant_id = $1 ORDER BY embedding <-> $2 LIMIT 10` — single shared table, partial indexes per high-volume tenant.
- `PARTITION BY LIST(tenant_id)` (`README.md:468-472`) — physical partitioning when one tenant overshadows the rest.
- Schema-per-tenant or DB-per-tenant — standard Postgres patterns; pgvector inherits these unchanged.

This is the design's biggest divergence from [[Profile__Mem0]] (which mandates `user_id`/`agent_id`/`run_id` at the API), [[Profile__Honcho]] (which has explicit `peer`/`session` resources), and [[Profile__Letta]] (agent_id-shaped recall). pgvector has no opinion. The downside is that "I accidentally returned tenant A's data to tenant B" is a row-level-security or app-code concern, not something the database refuses to do. The upside is that you get to use `CREATE POLICY ... USING (tenant_id = current_setting('app.tenant'))` — full Postgres row-level security — which is more rigorous than what any other entry in this study can offer.

## Operational story — there isn't a new one

This is the single highest-impact paragraph in the profile. The entire operational story is **the Postgres operational story**:

- **Backups:** `pg_dump`, `pg_basebackup`, WAL archiving — vectors round-trip in `text` (via `vector_out`/`vector_in`, `sql/vector.sql:8-12`) and `bytea` (via `vector_send`/`vector_recv`, `sql/vector.sql:17-21`). A `pg_dump` of a database with 50M vectors is a `pg_dump` of a database with 50M rows; nothing pgvector-specific.
- **Replication:** streaming, logical (via `pgoutput` / decoder plugins), and FDW. All vectors flow.
- **PITR:** standard. WAL is the source of truth.
- **High availability:** Patroni, repmgr, Citus, pg_auto_failover — all unchanged.
- **Sharding:** Citus, PgDog (`README.md:756`), or app-layer sharding. pgvector ships no sharding of its own.
- **Observability:** `pg_stat_statements`, `auto_explain`, `pg_stat_progress_create_index` (the HNSW phase names are right in the source at `src/hnsw.c:117-128`).
- **Hosted:** every major Postgres-as-a-service offering supports pgvector — RDS, Cloud SQL, Supabase, Neon, Crunchy Bridge, Timescale, Aiven — see `README.md` "hosted providers" reference. Migration between them is `pg_dump | pg_restore`.

The contrast: every other entry in this study ships at least one operational concept that didn't previously exist in your stack. pgvector ships zero. If your answer to "how do I back this up" was already settled, it's still settled.

## What's inside this submodule

| Path | What's there | Lines |
|---|---|---|
| `src/vector.{c,h}` | The `vector` type, the four float distance functions, `binary_quantize`, `subvector`, casts, btree opclass, aggregates | 1356 |
| `src/halfvec.{c,h}` | `halfvec` type (IEEE 754 binary16), distances, casts to/from `vector` and `sparsevec` | 1281 |
| `src/sparsevec.{c,h}` | `sparsevec` type, distances, casts | 1306 |
| `src/bitvec.{c,h}` + `bitutils.{c,h}` | Hamming/Jaccard on bit-packed varbit | 316 |
| `src/hnsw*.c` (5 files) | HNSW: AM registration, two-phase build, insert, scan, vacuum, utils | 4533 |
| `src/ivf*.c` (6 files) | IVFFlat: AM registration, k-means training, build, insert, scan, vacuum, utils | 3155 |
| `src/halfutils.{c,h}` | F16C / FLT16 dispatch shims for halfvec | 563 |
| `sql/vector.sql` | The 918-line SQL that wires C functions into types, operators, opclasses, aggregates, casts | 918 |
| `sql/vector--*--*.sql` (36 files) | Upgrade scripts from every released version to the next | — |
| `test/sql/` + `test/expected/` | pg_regress fixtures; the SQL files are the executable API documentation | 14 SQL files |
| `vector.control` | Extension metadata; current `default_version = '0.8.2'` | 4 |
| `Makefile`, `Makefile.win` | PGXS build for Unix and `nmake` build for Windows | — |
| `Dockerfile` | Builds against the official `postgres:18` image | 16 |

If you only read one file: `src/vector.c`. The whole vector type, all four float distances, all the casts, `binary_quantize`, `subvector`, and the aggregates are there in 1356 lines. Then `sql/vector.sql` for the surface and `src/hnsw.h` for the parameter defaults.

## Mental model for using it well

- **Start with no index.** Exact search is `ORDER BY embedding <-> $1 LIMIT N` and gives perfect recall (`README.md:197`). Add an index only when seq scan is the bottleneck — Postgres parallel-workers-per-gather (`README.md:716-719`) often gets you further than you expect.
- **Default to HNSW unless build time matters or you can't afford the RAM.** The README is direct: HNSW wins on speed/recall, IVFFlat wins on build cost. The defaults (`m=16, ef_construction=64, ef_search=40`) are the right starting point per `README.md:317`.
- **Use `halfvec` by default for OpenAI/Cohere embeddings.** They're trained with enough redundancy that float16 loses ~no recall and halves storage. The cast is implicit (`sql/vector.sql:496-497`).
- **Index the filter columns separately.** A B-tree on `tenant_id` plus an HNSW on `embedding` lets the planner pick exact-then-rerank when selectivity is low and approximate-then-recheck when it's high. This is **the** filter-vs-recall lever (`README.md:424-472`).
- **Partial indexes for high-cardinality routing keys.** "One HNSW per tenant" trades disk for predictable per-tenant recall and unblocks RLS.
- **Iterative scans (0.8.0+) when filtering selectivity is unpredictable.** `SET hnsw.iterative_scan = strict_order` is the safer default; `relaxed_order` + a materialized CTE buys recall back (`README.md:478-510`).
- **Binary quantize + re-rank when the index outgrows RAM.** 32× smaller index, ~free with a 100→10 LIMIT funnel (`README.md:589-605`).
- **Treat `CREATE INDEX CONCURRENTLY` as table stakes in production.** Same caveat as any Postgres index.

## When NOT to reach for this

- **You don't already run Postgres** and don't want to start. The whole bet inverts; you're inheriting Postgres's complexity (autovacuum, MVCC bloat, WAL management, `maintenance_work_mem` tuning) for the benefit of a feature you could get with a 200 MB Docker container from [[Profile__Chroma]] or [[Profile__Qdrant]].
- **You need distributed scale-out from day one.** pgvector inherits Postgres's single-writer architecture. Citus / PgDog / sharded-Postgres mitigate but don't eliminate this; if you genuinely have 10B vectors, [[Profile__Milvus]] was built for that and pgvector wasn't.
- **You need built-in hybrid search (BM25 + dense + RRF) without writing SQL.** [[Profile__Weaviate]], [[Profile__Qdrant]], and Chroma Cloud's `Schema()/Search()` ship this as a single API call; pgvector's hybrid story is "compose `tsvector` and `vector` in SQL," which is more powerful but less turnkey.
- **You want a portable on-disk format readable without the DB.** Postgres heap pages are not portable. If "could DuckDB / Polars / Pandas read this directly" is a checklist item, [[Profile__LanceDB]] is the answer; pgvector loses that dimension by construction.
- **HNSW dim limit hits you.** 2,000 dims for raw `vector`, 4,000 for `halfvec`. Beyond that you need quantization, subvector indexing, or a different system.
- **Sub-millisecond p99 ANN at 100M+ scale.** The purpose-built engines win this benchmark, period. pgvector trades a constant factor of pure-ANN performance for everything else Postgres gives you.

## How this compares to the rest of the study

| Axis | pgvector | [[Profile__Chroma]] | [[Profile__Qdrant]] | [[Profile__Weaviate]] | [[Profile__Milvus]] | [[Profile__LanceDB]] |
|---|---|---|---|---|---|---|
| **Substrate** | Postgres extension | Standalone (embedded or server) | Rust server (embedded or distributed) | Go server (cloud-native) | Distributed (k8s-scale) | Embedded over Lance columnar files |
| **Code surface (substance)** | ~3k LoC C | tens of k LoC | hundreds of k LoC Rust | hundreds of k LoC Go | hundreds of k LoC Go/C++ | tens of k LoC Rust |
| **Payload model** | Just other columns in the same row | `documents` + `metadatas` dict | Rich JSON payload with typed indexes | Schema-on-write (classes, properties, refs) | Schema with rich field types | Arrow columns |
| **Filter language** | All of SQL | `$eq/$ne/$gt/$in/$and/$or/$not` dict | Predicate JSON with geo / range / full-text | GraphQL | Boolean expression DSL | SQL (DuckDB) and Pandas/Polars |
| **Index algorithms** | HNSW, IVFFlat | HNSW | HNSW + quantization | HNSW | HNSW, IVF, DiskANN, ScaNN, GPU | IVF-PQ, HNSW |
| **Hybrid search** | DIY: `tsvector` + `vector` in SQL | Cloud-tier Schema()/Search() | First-class (sparse + dense + RRF) | First-class | First-class | First-class (FTS module) |
| **Multi-tenancy** | Columns + partial indexes + RLS | Collection per tenant | Named collections w/ per-collection RBAC | Multi-tenancy module (since 1.20) | Database/collection/partition | Dataset per tenant |
| **Transactions** | Full ACID (Postgres) | None | Per-collection | Per-class | Eventually consistent | Snapshot isolation |
| **On-disk portability** | Postgres heap (not portable) | SQLite + parquet | RocksDB-style | Custom binary | Object storage segments | Arrow columnar (DuckDB/Polars-readable) |
| **Operational story** | Same as Postgres | New runbook | New runbook | New runbook | New k8s stack | None (in-process) |
| **Best fit** | "I already run Postgres" | Embedded-first prototyping | High-performance standalone ANN | Schema-typed RAG with modules | k8s-scale vector + structured | Vectors-plus-columns analytics |

## The stealth load-bearing primitive of agent memory

A reading of [[Profile__Honcho]], [[Profile__Letta]], [[Profile__RetainDB]], [[Profile__Hindsight]], [[Profile__Volt]], and [[Profile__Mem0]] (when configured with the pgvector backend) shows the same pattern repeatedly: each one ships a memory-shaped API on top of Postgres-with-pgvector. The pgvector profile is therefore the *substrate* profile for most of the [[memory-layers-for-agents]] study — not because it competes on memory semantics, but because it is the smallest possible substrate that gives those systems (a) ACID for the relational truth (peers, sessions, audit), (b) ANN for the embeddings, and (c) one operational story to debug instead of two.

If you read this profile and then re-read [[Profile__Honcho]] or [[Profile__Letta]], the same architectural pattern keeps surfacing: "Postgres for the durable truth, pgvector for the embeddings, application code for the opinionated layer above." The pgvector entry's job in this study is to make that pattern legible.

## One-line summary

> pgvector is a ~3k-LoC Postgres extension that adds four vector column types, six distance operators, and two index access methods — and inherits, unchanged, the entire transactional, replicated, backup-ed, RLS-protected, full-text-searchable, SQL-filterable, Citus-shardable, hosted-everywhere operational surface of Postgres, which is why almost every "memory layer for agents" worth reading runs on top of it.

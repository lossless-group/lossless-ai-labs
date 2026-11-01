---
from: "studies/vector-databases"
from_path: "context-v/profiles/index.md"
---

# Profiles

* [Chroma — Profile](Profile__Chroma.md) - The hybrid retrieval in Chroma's docs raises `NotImplementedError` on a laptop — `Collection.search()` is gated behind Cloud.
* [LanceDB — Profile](Profile__LanceDB.md) - The database *is* the file format: a `.lance` directory DuckDB, Polars, and Pandas read with no LanceDB process running.
* [Milvus — Profile](Profile__Milvus.md) - One Milvus deployment is not a process — it is nine roles, three external dependencies, and a C++ ANN core reached through cgo.
* [pgvector — Profile](Profile__pgvector.md) - About 3k lines of substantive C, and it inherits MVCC, WAL, replication, PITR, and row-level security completely untouched.
* [Qdrant — Profile](Profile__Qdrant.md) - Qdrant estimates a filter's cardinality *before* searching, which is why recall doesn't collapse the moment you filter on `tenant_id`.
* [Weaviate — Profile](Profile__Weaviate.md) - The database itself calls OpenAI to embed on write and Cohere to rerank on read — the RAG pipeline lives inside the store, not the app.

---
name: Khoj Profile
title: Khoj — Profile
slug: khoj
upstream: https://github.com/khoj-ai/khoj
pinned_sha: ae229ca8
pinned_date: 2026-08-01
version_at_pin: "2.0.0-beta.28-12-gae229ca8 (nearest tag)"
license: AGPL-3.0
maintainer: khoj-ai (the Khoj team)
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/khoj
profile_kind: AI-first second brain — Python (Django + FastAPI) server over Postgres/pgvector, fed by client plugins (Obsidian, Emacs, desktop, web) that push your files in
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Reference
site_uuid: 5b76273a-91ff-4aff-b192-2786739abfc4
hex_code: x4umbv
lede: >-
  Not an authoring tool but a reader of yours: Khoj gets agent reach by copying
  your notes into its own Postgres, and it writes back only through an editor
  plugin that shows SEARCH/REPLACE diffs and waits for you to click Apply.
summary: >-
  Profile of Khoj as pinned in the content-authoring-tools study. It is the
  opposite-direction entry: rather than a store an agent can reach, it is an
  agent that ingests your store. Covers the push-based indexing pipeline
  (clients upload changed files to /api/content), heading-ancestry Markdown
  chunking, hash-diffed incremental embedding into pgvector with a cross-encoder
  reranker, the research agent's grep/view/list tools over server-side file
  copies, its MCP client, long-term memories, and the Obsidian plugin's
  none/read/write file-access modes with Apply/Cancel edit blocks.
tags:
  - Profile
  - Khoj
  - RAG
  - Agents
  - MCP
  - Obsidian
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Khoj.md"
---
# Khoj — Profile

A profile of Khoj as it lives in this study (`studies/content-authoring-tools/khoj`, pinned at `ae229ca8`, nearest tag `2.0.0-beta.28`, 2026-08-01). AGPL-3.0. A Python server (Django ORM + FastAPI routes) with web, desktop, Android, Obsidian, and Emacs clients under `src/interface/`.

This entry answers the study question from the other side. [[Profile__Joplin]] and [[Profile__Notesnook]] are stores that decide how much an agent may reach. Khoj **is** the agent, and the store it reasons over is its own copy of yours.

## TL;DR

You point a client at your notes (an Obsidian vault, an org-mode tree, a folder on the desktop app), plus optional Notion and GitHub connectors. The client uploads changed files to the Khoj server. The server chunks them, embeds them into Postgres with pgvector, and serves chat, search, research, and automations over that corpus with any configured LLM. Agents (custom personas with their own knowledge), long-term memories, web search, code execution, computer use, and external MCP tools layer on top.

**One sentence:** *Khoj reaches your notes by making a server-side copy of them, so it reads well and writes only through a client plugin, and it shows exactly what an agent-over-notes needs that a plain-files format does not provide.*

## How it works

- **Stack.** `pyproject.toml:38-96`: FastAPI, Django 5.1, `pgvector`, `sentence-transformers`, `mcp`. The Docker compose stack is `pgvector/pgvector:pg15`, a `terrarium` code sandbox, SearXNG, a `khoj-computer` operator container, and Khoj itself (`docker-compose.yml:3-45`). Single-user local installs can use an embedded Postgres via `pgserver` (`src/khoj/app/settings.py:126-139`; `documentation/docs/get-started/setup.mdx:201`).
- **Ingest is push, not watch.** The server never opens your vault. The Obsidian plugin collects files whose `mtime` is newer than the last sync, batches them as multipart uploads (10 MB / 50 files), and sends an empty blob for each file deleted since then (`src/interface/obsidian/src/utils.ts:124-168`). The server accepts them at `PUT`/`PATCH /api/content` (`src/khoj/routers/api_content.py:75-117`).
- **Chunking.** `MarkdownToEntries` splits recursively by heading level, up to 256 tokens per entry, and *prepends the heading ancestry* to each chunk so a deep section still carries its parents' titles (`src/khoj/processor/content/markdown/markdown_to_entries.py:27`, `:82-101`). Org-mode, PDF, DOCX, plaintext, images, Notion, and GitHub each have a sibling processor under `src/khoj/processor/content/`.
- **Incremental embedding.** Entries are MD5-hashed, and only new or changed hashes are re-embedded (`src/khoj/processor/content/text_to_entries.py:36-37`, `:142-167`). The default bi-encoder is `thenlper/gte-small`, and hits are reranked by a cross-encoder (`src/khoj/database/models/__init__.py:558`; `src/khoj/processor/embeddings.py:117-135`).

## What's on disk

Your files stay where they were; Khoj does not change your vault. The copy lives in Postgres as two models (`src/khoj/database/models/__init__.py:760-798`):

```python
class FileObject(DbBaseModel):
    # Contains the full text of a file that has associated Entry objects
    file_name = models.CharField(max_length=400, ...)
    raw_text = models.TextField()

class Entry(DbBaseModel):
    embeddings = VectorField(dimensions=None)
    raw = models.TextField()
    compiled = models.TextField()      # heading-ancestry-prefixed text that gets embedded
    heading = models.CharField(...)
    file_type = ...  # image | pdf | plaintext | markdown | org | notion | github | conversation | docx
    file_path = ...
    hashed_value = models.CharField(max_length=100)
```

Both are scoped by `user` and optionally by `agent`, which is how a custom agent gets its own knowledge base. `UserMemory` (`:855-864`) is a third embedded store of facts the agent derived from conversations, editable through `/api/memories` (`src/khoj/routers/api_memories.py:18-71`).

## Agent reach

| Direction | How | Scope |
|---|---|---|
| **Khoj reads your notes** | Semantic search over `Entry`, plus `list_files`, `view_file`, and `regex_search_files` over `FileObject` (`src/khoj/utils/helpers.py:415-435`; `src/khoj/routers/helpers.py:3190-3425`) | The uploaded copy, as of last sync |
| **Khoj writes your notes** | Obsidian plugin only: `<khoj_edit>` SEARCH/REPLACE blocks applied to the 3 most recently viewed open files, then **Apply** or **Cancel** (`src/interface/obsidian/src/interact_with_files.ts:56-58`, `:687+`; `chat_view.ts:2223-2290`) | Gated by a per-user `fileAccessMode: 'none' \| 'read' \| 'write'`, default `read` (`chat_view.ts:81`) |
| **Other agents read Khoj** | HTTP API (`/api/search`, `/api/chat`, `/api/content/files`) | No MCP *server* found in `src/khoj` |
| **Khoj calls other tools** | MCP *client* over stdio (local script) or SSE (URL), servers configured in the DB and offered to the research agent (`src/khoj/processor/tools/mcp.py:13-60`; `src/khoj/routers/research.py:501-502`, `:255-259`) | Whatever those servers expose |

## What's clever or unique

**Heading ancestry as chunk context.** Prepending `# Parent\n## Child\n` to every chunk (`markdown_to_entries.py:82-84`) is a one-line fix for the most common RAG failure on notes, where a bullet list under `### Risks` is retrieved without saying whose risks. It splits only as deep as needed. A section that fits in 256 tokens, or has no deeper headings, stays whole (`:86-93`).

**Grep and view next to vectors.** The research agent's tool enum puts `regex_search_files`, `view_file`, and `list_files` beside `semantic_search_files` (`helpers.py:428-431`). `grep_files` is implemented as a database regex over `FileObject.raw_text` with before/after context lines (`routers/helpers.py:3267-3321`). Khoj concluded that embeddings alone are not enough, and gave the model coding-agent-style file tools over a corpus that is not a filesystem.

**Edit proposals in a coding-agent format, inside a notes app.** In `write` mode, the Obsidian plugin injects an Aider-style prompt (`<<<<<<< SEARCH` / `=======` / `>>>>>>> REPLACE`, exact-match, first-occurrence, empty SEARCH means new file or whole-file replace *"while preserving frontmatter"*) (`interact_with_files.ts:105-284`). It parses completed and still-streaming blocks (`:415-444`), validates every block before applying any (`:711+`), keeps per-file backups, and renders a word-level diff preview with Apply/Cancel. **This is the only write path, and it runs in the client against real files, never on the server's copy.**

**Agents are knowledge-scoped personas.** `Entry.agent` and `FileObject.agent` let a custom agent own a corpus distinct from the user's, so the same pipeline serves "my notes" and "the onboarding bot's handbook."

## Costs / limits

- **A copy, not the store.** Answers reflect the last sync. Deletions propagate only when the client sends its empty-blob tombstones. Anything the client doesn't push (another device, a git pull) is invisible until the next sync.
- **Plaintext on a server.** Every note is stored as plaintext `raw`/`compiled` text plus vectors in Postgres. On the hosted app that server is someone else's. Self-hosting fixes custody, but the copy still exists.
- **Write-back is single-client.** Only the Obsidian plugin applies edits. The server has no way to write to the user's files, and edits reach only the 3 most recently active open files (`CONTEXT_FILES_LIMIT`, `interact_with_files.ts:58`).
- **Heavy to run.** Postgres + pgvector, a sentence-transformers model, a cross-encoder, and optional sandbox/search/computer containers.
- **Product focus has drifted.** The README's "New" section points at Pipali, a separate local AI coworker. The pinned commit is about 3.5 months older than the Joplin pin.

## Relevance to flave

- **Borrow heading-ancestry chunking** for any flave retrieval index, keyed to flave's stable block ids instead of line numbers, so a retrieved block always carries its section path.
- **Clearance must travel with the copy.** Khoj copies everything to one index with no per-chunk visibility. A flave index (Chroma, an agent's context, an LP-facing bot as a Khoj-style "agent") must carry each block's `clearance` into the chunk metadata and filter at query time. Otherwise retrieval becomes a back door around the publish-time leak scan.
- **Borrow `none / read / write` plus Apply/Cancel** as the human-facing control for flave's agent-caller of the shared operation set. Note that Khoj's text SEARCH/REPLACE is what flave's named operations should improve on, by addressing block ids rather than exact-match strings.
- **Avoid the push-a-copy architecture.** Flave's workspace *is* files. An agent should read them in place (with a Joplin-style outline/section surface, [[Profile__Joplin]]) rather than through a synced server mirror that can go stale.

## Read next

- `src/khoj/processor/content/markdown/markdown_to_entries.py:73-140` — recursive heading split with ancestry
- `src/interface/obsidian/src/interact_with_files.ts:95-290` — the write-mode prompt and edit-block contract
- `src/khoj/routers/helpers.py:3190-3425` — view/grep/list over a database-backed "filesystem"
- `src/khoj/processor/content/text_to_entries.py:142-200` — hash-diffed incremental embedding
- `src/khoj/processor/tools/mcp.py` — Khoj as an MCP client

## Related

- [[Profile__Joplin]] — exposes notes *to* external agents via MCP; local embeddings, not a server copy
- [[Profile__Notesnook]] — the store Khoj could never index: encrypted at rest, write-only inbox
- [[Profile__Logseq]] and [[Profile__SilverBullet]] — Markdown-file stores a Khoj-style indexer would read cleanly
- [[Profile__Outline]] — the team-wiki side, where an indexer would go through an API rather than files

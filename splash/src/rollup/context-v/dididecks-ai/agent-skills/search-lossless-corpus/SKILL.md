---
name: search-lossless-corpus
description: Use whenever the user asks a question that prior work might already have answered — "what did we decide about X", "when did we ship X", "why did we choose X over Y", "has this failed before", "where did we put X" — and generally to ground answers in The Lossless Group's own corpus instead of training-data folklore. Encodes the four local Chroma collections (`context-vigilance-corpus`, `lossless-changelog`, `claude-code-sessions`, `claude-code-tool-traces`) reachable via the `chroma` MCP server, the four-step agentic-search loop (decompose → execute → evaluate → synthesize), the citation discipline (source path + timestamp + repo slug for every claim), and the metadata-filter patterns that make queries precise. Triggers on questions about prior decisions, shipped work, past Claude Code sessions, recurring tool failures, or any "did we already…" framing. Does not cover Chroma setup, ingestion pipelines, or maintenance — those are handled by [[chroma-local]] and the [[context-vigilance-kit]] scripts.
from: "dididecks-ai"
from_path: "context-v/agent-skills/search-lossless-corpus/SKILL.md"
---
# Search the Lossless Corpus

The Lossless Group keeps a living corpus of its own decisions, shipped work, prior sessions, and tool-failure history in a **local Chroma database** wired into Claude Code via the `chroma` MCP server. Most questions a user asks about *prior work* can be answered from this corpus rather than training data. **Don't paraphrase from training data when the corpus could answer.**

This skill is the discipline that makes the corpus load-bearing. Without it, Chroma sits there full of high-signal records that nobody queries. With it, every "what did we decide about X" question becomes grounded recall — with citations the user can verify in seconds.

## When to use this skill

Trigger when the user's question takes any of these shapes:

- **Decisions** — *"what did we decide about X"*, *"why did we choose X over Y"*, *"what's our stance on X"*
- **Shipping** — *"when did we ship X"*, *"what shipped in May"*, *"did we already do X"*
- **History** — *"what did we talk about last week"*, *"in a prior session we…"*, *"resume where we left off on X"*
- **Failures** — *"has this errored before"*, *"how did we fix X last time"*, *"when did Bash with git rebase fail"*
- **Location** — *"where did we put the X spec"*, *"which repo's changelog mentions Y"*

Trigger also when the user pastes a question that touches Lossless conventions (changelog format, context-v structure, branch-tier model) — the skill canon may have moved since your training cutoff; the corpus reflects current truth.

## The four collections

The MCP server exposes them via tools named `mcp__chroma__chroma_query_documents`, `mcp__chroma__chroma_list_collections`, `mcp__chroma__chroma_get_documents`, etc. Each collection is keyed to a different question shape:

| Collection | Granularity | Best for | Key metadata fields |
|---|---|---|---|
| `context-vigilance-corpus` | Section-level chunks of `context-v/` files | Architecture, specs, plans, conventions, "what do we believe about X" | `source_repo_slug`, `source_path`, `kind`, `chunk_heading`, `fm_title`, `fm_status`, `fm_tags` |
| `lossless-changelog` | Whole changelog entries | "What shipped about X and when", cross-repo | `source_repo_slug`, `source_path`, `fm_date`, `fm_title`, `fm_lede`, `fm_tags` |
| `claude-code-sessions` | One document per message turn | "What did we decide about X", resume context | `session_id`, `project_path`, `turn_role`, `timestamp`, `git_branch` |
| `claude-code-tool-traces` | One document per tool invocation | "When did X tool fail and how did we recover" | `tool_name`, `is_error`, `session_id`, `timestamp`, `git_branch` |

All four live in the same Chroma `PersistentClient` at `/Users/mpstaton/code/lossless-monorepo/ai-labs/context-vigilance-kit/.chroma/`. They are populated by the kit's `ingest-all.sh` script. **You don't ingest from inside this skill.** That work belongs to context-vigilance-kit.

## The agentic-search loop

When a triggering question arrives, run this loop. Cap at **5 chroma queries total per question** — if the corpus doesn't have the answer in five tries, it doesn't have it; say so explicitly.

### 1. Decompose

Read the user's question and break it into 1-3 sub-queries. Each sub-query should target the **one collection most likely to hold its answer**, not all four. Most questions hit one collection. A few hit two (e.g., "what did we decide about X and when did we ship it" → sessions + changelog).

Avoid the temptation to fan out to all four collections — it wastes the query budget and makes synthesis harder.

### 2. Execute

For each sub-query, call `mcp__chroma__chroma_query_documents` with:

- `collection_name`: the picked collection
- `query_texts`: a *natural-language* phrasing of the sub-query (the embedder is semantic; keyword stuffing helps less than coherent phrasing)
- `n_results`: start with **5**. If results look noisy, widen to 10 for one more try.
- `where`: a metadata filter when it makes the query precise. Examples below.

Common `where` filters that narrow effectively:

```python
# Only changelog entries from the ai-labs repo
{"source_repo_slug": "ai-labs"}

# Only tool errors (debugging memory)
{"is_error": True}

# A specific tool's failures
{"$and": [{"tool_name": "Bash"}, {"is_error": True}]}

# Only sessions from a particular project
{"project_path": "/Users/mpstaton/code/lossless-monorepo/ai-labs"}

# Only context-v files in a specific kind
{"kind": "spec"}
```

Chroma supports `$and`, `$or`, `$in`, `$nin`, `$gt`, `$lt`, `$eq`, `$ne` operators in `where`. See [[chroma-local]] for the full operator reference.

### 3. Evaluate

Read the top results returned. Ask:

- **Does this cover the question?** If yes, stop and proceed to synthesis.
- **Is there a gap?** If the results gesture toward the answer but miss a piece, run one more focused query against the gap. Don't re-run the same query — that wastes budget.
- **Are the results stale?** Records carry `ingested_at` and frontmatter dates. If a result references a renamed file or removed convention, prefer to verify against the current code rather than recommending from the record. (See "When the memory lies" below.)

### 4. Synthesize

Combine results into one answer. The user wants the answer, not a search report. Do not dump raw chunks; summarize. But **always cite**, every claim, with:

- The `source_path` or `source_repo_slug` + `source_relative_path`
- The `timestamp` or `fm_date` if available
- A clickable reference the user can open: `file_path:line_number` for code/markdown, `session_id` for prior sessions

Citation template:

> "We decided to use `PersistentClient` for v0 ([ai-labs] `context-v/explorations/ChromaDB-as-Context-Improvement-Across-Everything-Everyone.md`, 2026-05-07). The reasoning was that local PersistentClient survives the four deployment shapes without rewriting the API surface, and ladder-up is decided by collaborator joining, splash live-query, or session-transcript volume — none of which apply yet."

The point of citing is that the user can independently verify, course-correct your reading, or surface staleness. A grounded answer without citations is half-grounded.

## Practical query patterns

The shapes that come up most often:

**"What did we decide about X."** → query `claude-code-sessions` with the topic. Filter `where={"turn_role": "assistant"}` if the user wants the *answer* shape; leave unfiltered if they want the *discussion* shape.

**"When did we ship X."** → query `lossless-changelog`. Cross-repo by default; add `where={"source_repo_slug": "<repo>"}` only when the user specifies a repo.

**"How did we fix the X failure last time."** → query `claude-code-tool-traces` with `where={"is_error": True}` first to find the failure, then pivot to `claude-code-sessions` with the matching `session_id` to find the recovery turns. This is the 2-hop pattern.

**"What's our convention for X."** → query `context-vigilance-corpus`. The chunked-by-heading shape means a single chunk usually contains the convention statement plus its rationale.

**"Has this been discussed before."** → query `claude-code-sessions` broadly. If you find prior discussion, summarize the conclusion and ask whether the user wants to continue from there or start fresh.

## Where to pivot from a result

Every result carries metadata that points back to where the full context lives. Use it:

- A `context-vigilance-corpus` hit → open the `source_path` to read the full doc.
- A `lossless-changelog` hit → open the entry's source_path; check `git log` if the entry references a commit.
- A `claude-code-sessions` hit → if the user wants the *full* conversation, they can `claude --resume <session_id>` to re-enter it.
- A `claude-code-tool-traces` hit → the `session_id` + `timestamp` locates the surrounding conversation; the trace's `input` and `output` fields are the failure itself.

## When NOT to use this skill

The skill is for grounding answers in prior work. It's the wrong move when:

- **The question is forward-looking.** "How should we build X" is design, not recall. Recall what we decided about adjacent decisions, sure — but don't pretend the corpus has the answer to a question the team hasn't asked itself yet.
- **The corpus is provably empty on the topic.** If five queries return distant results (distance > 1.5 consistently across collections), the corpus genuinely doesn't have it. Say so. Don't manufacture grounding.
- **The question is about the *current* state of the code.** Code is authoritative; the corpus is frozen at ingest time. Read the code. Use the corpus for *intent and history*, the code for *current behavior*.
- **The user explicitly says "don't check memory" / "ignore prior conversations."** Honor the override. Answer fresh.

## When the memory lies

Records are point-in-time snapshots. A spec from March that named file `foo.md` may have been renamed; a changelog entry that announced flag `--bar` may have shipped with `--baz`. Before recommending an action that depends on a corpus result existing today:

- If the result names a file path → verify the file still exists (`ls` / `Read` on it).
- If the result names a function, flag, or command → grep for it in the current code.
- If the user is about to *act* on the recommendation (not just asking about history), verify first.

"The corpus says X exists" is not the same as "X exists now." Recall is a starting point, not a citation.

## Anti-patterns

- **Fanning out to all four collections by default.** Wastes the 5-query budget. Pick the collection that fits the question shape.
- **Re-running the same query with slightly different wording.** If query 1 returned nothing useful, query 2 with the same intent won't either. Re-decompose.
- **Returning raw chunks instead of a synthesized answer.** The user wanted the answer, not the receipts. Cite, don't dump.
- **Treating a high-distance hit as a real answer.** Distances above ~1.3 on the default `all-MiniLM-L6-v2` embedder usually mean "no real match." Don't manufacture certainty from a soft hit.
- **Querying the corpus for questions the user could answer faster by looking.** "What's in the current branch's diff" is `git diff`, not Chroma.

## Cross-references

- [[chroma-local]] — generic local-Chroma usage (PersistentClient lifecycle, embedding choices, the full `where`-operator reference). Loaded automatically when you're writing Chroma code; complementary to this skill.
- [[context-vigilance]] — what the `context-vigilance-corpus` collection indexes. The shape and rationale of `context-v/`.
- [[changelog-conventions]] — what the `lossless-changelog` collection indexes. The shape and rationale of `<repo>/changelog/`.
- [[pseudomonorepos]] — explains the `source_repo_slug` taxonomy you'll see in metadata across all collections.
- [[Up-and-Running-on-ChromaDB]] (lossless-content `lost-in-public/up-and-running/`) — the narrative of how the corpus came to be; useful when the user asks "why does this exist."

## tl;dr

When the user asks something prior work might know, **run the loop**: decompose into 1-3 sub-queries, hit the right collection, evaluate, synthesize **with citations**. Cap at five queries. Pivot back to source files when the user wants depth. Don't paraphrase training-data when the corpus is right there.

---
title: "Handoff — source approval shipped, enforcement never run"
lede: "The whole curation chain is built, tested, and pushed. Nothing has been enforced on a real memo yet, and ImmuneCo turned out to have been quietly hiding 13 sources since July."
date_created: 2026-08-08
date_modified: 2026-08-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.1.0
status: Active
tags:
  - Handoff
  - MemoPop
  - Source-Curation
  - Membership-Gate
  - Memopop-Native
  - Data-Recovery
from: "memopop-ai"
from_path: "context-v/handoffs/2026-08-08-Source-Approval-Shipped-Enforcement-Unrun.md"
---
## Where things stand

Loop tickets 1–10 of [[../loops/Frontloaded-Source-Approval-Loop]] are done and pushed across five repos. The membership gate exists, the approval surface works, and the analyst can review sources across multiple sittings.

**What has never happened: no approved set has been committed through the UI, and no memo run has ever been constrained by one.** Everything below is the state you resume into.

| Repo | HEAD | Pushed |
|---|---|---|
| `lossless-monorepo` | `d9cbeb82` (development) | ✅ |
| `ai-labs` | `4074bcf` | ✅ |
| `ai-labs/corpora-builder` | `4f882d1` | ✅ |
| `memopop-ai` | `9ace60b` | ✅ |
| `apps/memopop-orchestrator` | `7a92bd4` | ✅ |

169 Python tests pass. `svelte-check`, `cargo check`, and `bun run build` are all clean (0 errors, 0 warnings).

## Do this first

**1. `io/humain` is uncommitted and now contains a data recovery.** This is the only dirty thing in the chain and it is client-confidential, which is why it was left for you.

```
 M deals/ImmuneCo/inputs/Sources.md      ← repaired; see below
 ?? .gitignore                            ← ignores Sources.md.bak-* / .pre-*
 ?? deals/ImmuneCo/inputs/sources/        ← 1 per-source file from an a16z paste
```

It has no `changelog/`. Per the orchestrator's `CLAUDE.md`, firm content changes get logged in the firm's own changelog, so committing this properly means scaffolding one.

**2. Verify the ImmuneCo repair before you trust it.**

```bash
cd apps/memopop-orchestrator
.venv/bin/python -c "
from pathlib import Path; from src.curation import load_sources_md
sm = load_sources_md(Path('io/humain/deals/ImmuneCo/inputs'))
print(len(sm.sources), 'sources |',
      sum(1 for s in sm.sources if s.verdict=='approved'), 'approved')"
# expect: 93 sources | 42 approved
```

Backups sit beside the file (`.pre-splice-*`, `.pre-restore-*`, `.bak-*`), all gitignored.

## The ImmuneCo finding

**93 sources were on disk; the loader saw 80.** A stray `---` on its own line in the middle of the source list truncated the YAML frontmatter, so 13 sources parsed as *prose body* instead. They were in the file the whole time — a `grep` found them, a diff looked fine, only the parse disagreed. Every consumer (the approval UI, the membership gate, the researcher) had been silently working with 80.

It dates to **2026-07-14, commit `bbe294d`** — three weeks before this session, and not caused by the new code. One entry (`ResearchAndMarkets.com`, *"Telemedicine Market Competitive Landscape Report 2025"*) lost its `url:` line in that same event and the URL is unrecoverable from any artifact in the deal; its metadata is preserved as a flagged block in the file body. The approval surface's **Re-search** action takes a title and should find it.

Two things came out of this:

- The file is repaired: 93 visible, 42 approvals intact, `sensitivity` on all 93, two fences.
- `load_sources_md` now **warns loudly** when sources appear past the closing fence, so this can never be silent again. Two tests cover it.

**Separately**, and this one *was* mine: the UI's save payload omitted `sensitivity` while `serialize.clean_source` only emitted known keys, so a round-trip stripped the field from the loader-visible sources and downgraded 8 from `internal_only` — the flag governing external citability. Fixed on both sides (writes now round-trip unmodelled keys), restored by merging pre-session values by URL, and covered by two regression tests.

## Next moves, in order

**1. Curate ImmuneCo for real.** 93 sources, 42 already approved. This is the human gate the loop calls for and the one step nothing else can substitute for. "Approve all unreviewed" is the fast path; the surface autosaves.

**2. Run a constrained memo.** Approving writes `mode: codified`, which is what makes the gate bite. Until a run happens against an approved set, the whole chain is untested end to end.

**3. Then flip enforcement.** It defaults to `flag` — it reports without deleting.

```bash
.venv/bin/python tools/audit_source_membership.py --all   # read-only, safe
MEMOPOP_SOURCE_ENFORCEMENT=enforce                        # when ready
```

The audit currently predicts: Panthalassa **42 of 49 citations off-set**, alpha-partners/ChromaDB 5 of 26, avalanche/ChromaDB 2 of 22.

**4. Watch for the coverage collapse.** `Citation-Coverage-Promoter.md` measured 7-of-33 curated sources actually cited *before* any ceiling existed. Enforcement is the ceiling; that plan is the floor and is unbuilt. The loop has an explicit stop condition: if an enforced run cites under ~⅓ of the approved set, stop and build the promoter first.

## Gotchas that cost time

- **Tauri capability changes need a full `dev:native` restart.** Vite HMR will not pick up an ACL edit. The failure mode is a silent fallback to your system browser, which looks exactly like quick-look not working.
- **`_deal_inputs_dir` imports `get_io_root` *inside* the function.** Patching `src.server.sources_api.get_io_root` does nothing — an ad-hoc script of mine wrote into the real `io/` because of this. Patch `src.paths.get_io_root`. The pytest fixture does it correctly.
- **SearXNG must be running** for candidate discovery: `docker compose up -d searxng` in the orchestrator, then `SEARXNG_URL=http://localhost:8080`. Unset, it degrades to a graceful no-op — search silently returns nothing rather than erroring.
- **The sidecar now loads `.env`** (it never did). If a key-dependent endpoint misbehaves, that is no longer the cause.
- **`graphify-out/` is gitignored** in both repos — 13M of rebuildable cache. Don't commit it; don't delete it either unless you want to pay for the graph again.

## Loose ends

- `ai-labs`'s gitlinks to `memopop-ai` and `corpora-builder` are behind their pushed tips. Advancing them is the deliberate `bump(submodules)` move.
- `description` is declared in the source-file schema and nothing populates it — Jina's preamble does not carry one.
- **Open question from the blueprint:** who owns URL normalization? memopop has `canonical_url()`; if augment-it's JS side differs, cross-app dedup fails silently. Worth settling before augment-it writes files under the shared schema.
- **`CLAUDE.md`'s changelog convention is stale.** It says entries open with a fenced commit block; every real entry opens with `## Why Care?`. The two entries dated 2026-08-06 follow the stale shape and are now the odd ones out.
- Playwright MCP is still not wired here, so no agent has actually clicked through the surface.

## Map

| Concern | File |
|---|---|
| Membership predicate | `src/curation/sources_md.py` — `approved_urls`, `is_approved_url` |
| The gate | `src/agents/remove_invalid_sources.py` — `UNAPPROVED`, `enforcement_mode` |
| Per-source files | `src/curation/source_file.py` |
| LLM-free candidates | `src/curation/candidates.py` |
| Endpoints | `src/server/sources_api.py` |
| Read-only audit | `tools/audit_source_membership.py` |
| The surface | `apps/memopop-native/src/lib/components/SourceApproval.svelte` |
| Its state | `apps/memopop-native/src/lib/stores/sources.svelte.ts` |
| Plan of record | [[../plans/Constraining-Memo-Writing-to-an-Approved-Source-Set]] |
| Shared schema | `corpora-builder/context-v/blueprints/Source-File-Schema-Reconciliation.md` |

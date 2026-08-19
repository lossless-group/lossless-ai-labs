---
site_uuid: 4f58f695-833d-4d08-b29d-ac392ee8859c
hex_code: i9x91y
title: "Include Validation Analysis as Action Items"
lede: >-
  A 200 proves a server answered — not that the page isn't a paywall, or says what the memo claims it says. Hand the residue to a human.
summary: "Plan for turning citation validation output into a reviewable work queue. Establishes why HTTP status is insufficient evidence of source validity, what the current `citation_validator` agent does and does not catch, and the shape of the human-review artifact the original three-word stub called 'evaluation files'. Requires a UI. Distinct from [[Generate-DD-Questions-&-Checklist]] — that one enumerates open research questions for an investor; this one adjudicates whether the sources already cited are real."
status: Draft
publish: false
date_created: 2026-05-08
date_modified: 2026-08-17
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
at_semantic_version: 0.0.1.0
tags:
  - Plan
  - MemoPop
  - Source-Validation
  - Citations
  - Human-Review
  - Seed
from: "memopop-ai"
from_path: "context-v/plans/Include-Validation-Analysis-as-Action-Items.md"
---
# Include Validation Analysis as Action Items

> **Status: seed.** Grounded in the current validator's actual behaviour. The UI
> is named as a requirement, not designed.

## The problem — 200 means almost nothing

`src/agents/citation_validator.py` checks source accessibility like this:

```python
with urllib.request.urlopen(req, timeout=5) as response:
    status = response.getcode()
    if status != 200:
        ...  "URL returned status {status}"
except urllib.error.HTTPError as e:
    ...  "URL not accessible (HTTP {e.code})"
```

A 200 passes. **That is the entire accessibility test**, and it is satisfied by
every one of these:

- **Soft 404s** — a "page not found" template served with 200, which is
  overwhelmingly common on marketing sites and news archives
- **Paywalls and login walls** — the URL resolves, the content does not
- **Cookie/consent interstitials** — 200, and the body is a consent form
- **Parked or expired domains** — 200 from a squatter
- **Redirect to homepage** — the deep link died, the root answered
- **The page is real and simply does not contain the claim** — the most important
  case, and completely invisible to a status check
- **The page changed since it was cited** — the number moved, the quote was edited
- **A plausible-looking hallucinated URL that happens to resolve**

The last one is not hypothetical here. It has its own issue-resolution document:
`Faked-Sources-from-Perplexity`. A generator that invents citations and a checker
that only asks "did a server answer" is the worst possible pairing.

**Only a human can settle most of these.** Hence the original three-word stub:
*"Generate evaluation files."*

## What already exists to build on

| Asset | What it gives |
|---|---|
| `src/agents/citation_validator.py` | extracts citations, checks status, format, and date sanity (future-dated, suspiciously old) |
| `src/validation/url_recovery.py` | recovery path for broken URLs |
| `src/validation/gated_publishers.yaml` | **partially solves the paywall case already** — reputable publishers whose paywalled/login-walled content is treated as `verified-gated` rather than dropped. Also seeds `site:<domain>` drift-recovery queries and per-section `preferred_sources` in outlines. Consumed by `remove_invalid_sources.py`, `url_recovery.py`, `research_enhanced.py`, and the outline templates. |
| `src/curation/fetch.py` | **the important one** — fetches a URL as clean markdown via Jina Reader, falling back to `httpx` + BeautifulSoup, returning `{markdown, title, via}` |
| `src/agents/citation_{corrector,enrichment,assembly,spacing}.py` | the rest of the citation pipeline |
| `src/curation/{sources_md,source_file,best_sources}.py` | source registry |
| `tests/test_sources_md_membership.py`, `test_sources_api.py`, `test_source_file.py` | existing coverage of the source layer |

**`fetch.py` is what makes a good review UI possible.** Because the pipeline can
already retrieve the page as text, a reviewer does not have to open the link and
hunt. The evaluation artifact can show the claim beside the fetched passage and
ask one question. That turns a two-minute tab-switching task into a two-second
judgment, which is the difference between a review queue that gets worked and one
that doesn't.

## The artifact

One row per cited source, carrying enough context to adjudicate without leaving
the surface:

- the claim as it appears in the memo, with its section
- the citation as rendered
- the URL, and where it actually resolved to after redirects
- HTTP status **plus** the machine signals worth pre-computing: did the fetch
  return real content or a consent/login shell, does the fetched text contain the
  claim's key terms, how far did the URL redirect
- an excerpt of the fetched markdown around the best keyword match
- the reviewer's verdict

### Verdicts

Draft vocabulary — the point is that "reachable" and "supports the claim" are
**different axes** and must not collapse into one flag:

| Verdict | Meaning |
|---|---|
| `verified` | page loads and supports the claim |
| `reachable-unsupported` | page loads, does not say this |
| `verified-gated` | paywalled/login-walled but from a publisher on the `gated_publishers.yaml` allow-list — **already a distinct state in the code**, do not collapse it into `inaccessible` |
| `inaccessible` | paywall from an unlisted publisher, consent wall, dead |
| `wrong-target` | redirected somewhere unrelated |
| `fabricated` | no evidence this source ever said it |
| `pending` | not yet reviewed |

`fabricated` should be loud and should feed back into whatever produced it.

## Open questions

1. **Where does the UI live?** `memopop-native` is the obvious home — same
   question as [[Reorder-and-Edit-Direct-Outline]], and both are blocked on the
   same missing answer about where user-mutable state persists.
2. **When does review run?** Post-generation gate before a memo is shareable, or
   an async queue? A gate is stronger and slower.
3. **Does a verdict mutate the memo?** `reachable-unsupported` on a load-bearing
   claim arguably should pull the claim, not just annotate it. That is close to
   what `Anti-Hallucination-Source-Validation-and-Removal` already describes —
   **read it before designing this**, the two may be one feature.
4. **Do verdicts persist across runs?** Regenerating a memo should not discard
   review work on sources that didn't change. This is the same durable-source
   problem as `Curating-only-valid-Sources-across-Runs` and the
   `Source-Curation-Gate` blueprint — a verdict is per-source, not per-memo, and
   should be reusable.
5. **How much can be pre-computed?** Every signal the machine can decide reduces
   the human queue. Soft-404 detection and keyword-presence checks are cheap and
   would likely resolve most rows before a human sees them.

## Explicitly not this

**Not [[Generate-DD-Questions-&-Checklist]].** That produces open questions for an
investor to go answer about a company. This adjudicates whether sources already
cited in a generated memo are real. Both are checklists a human ticks; they share
no content and probably no UI.

## Prior art to read first

- `apps/memopop-orchestrator/context-v/blueprints/Anti-Hallucination-Source-Validation-and-Removal.md`
- `apps/memopop-orchestrator/context-v/issue-resolution/Faked-Sources-from-Perplexity.md`
- `apps/memopop-orchestrator/context-v/specs/Post-Generation-Quality-Agents.md`
- `context-v/explorations/Curating-only-valid-Sources-across-Runs.md`
- `ai-labs/context-v/blueprints/Source-Curation-Gate.md`

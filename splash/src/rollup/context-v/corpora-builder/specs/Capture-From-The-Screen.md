---
title: "Capture From The Screen — the surface stops being a viewer"
lede: "Paste a URL and watch it get filed. Writing is opt-in at the server (`--writable`) because the first corpus this screen saw was a client's."
date_created: 2026-08-08
date_modified: 2026-08-08
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.1
status: Draft
spec_reference: "[[Browse-Corpus]] — the read-only surface this extends"
tags:
  - Spec
  - Corpora-Builder
  - UI
  - Capture
site_uuid: b6710e3f-8f2f-47c6-88ea-f979d48d8774
hex_code: ie25v6
date_authored_initial_draft: 2026-08-08
date_authored_current_draft: 2026-08-08
publish: true
from: "corpora-builder"
from_path: "context-v/specs/Capture-From-The-Screen.md"
---
# Capture From The Screen

## Why Care?

[[Browse-Corpus]] gave the operator a screen. It is a viewer: everything it can
do, it does by reading. Capture exists but only from a terminal, which means the
tool is still something you drive from a shell and occasionally look at.

This closes the loop. Paste, fetch, file, and see it appear in the list.

## The safety problem this creates, and the answer

The very first thing the browse screen was pointed at was
`augment-it/clients/reach-edu/corpus` — **a client corpus, and on the
Autonomy-Gates RED list.** Read-only made that safe. Adding write to the same
server makes it unsafe by default, and "we will remember not to" is not a
design.

So: **writing is opt-in at the server, not at the request.** `corpora serve`
refuses capture unless started with `--writable`. Without it the endpoint returns
403 and the page does not render a capture box at all — the operator is not
offered an action that will fail.

This is the same instinct as the two-tier fetch and the source-curation gate:
gate the step that changes things, and make the gate a thing you pass through
deliberately rather than a warning you read.

## Scope

**In:** a capture box on the page; `POST /api/capture`; the writable gate;
reporting duplicates and failures back to the screen.

**Out:** triage, promotion, editing an existing source — all of which rewrite
files and therefore still wait on `Source-File-Model`'s open question 0.
Authentication. Bulk import.

## Behaviour

1. `corpora serve --writable` enables capture. Without the flag, `POST
   /api/capture` returns 403 and `GET /api/meta` reports `writable: false`.
2. The page renders the capture box only when the server reports `writable`.
3. `POST /api/capture` takes a url, an optional domain, and an optional
   `full` flag, and returns the resulting path, whether it was created, and the
   source's title, status and machine verdict.
4. A duplicate returns `created: false` with the existing path — the screen says
   "already here" rather than reporting a failure, because it is not one.
5. A fetch failure still creates the source and reports the failure, matching
   `corpora add`. A 404 is information.
6. The domain box offers the domains already present in the corpus, and accepts
   a new one typed freely — filing into a domain that does not exist yet is
   ordinary, not an error.

## Tests

| ID | Given / When / Then |
|---|---|
| `WRITE-01` | Given a writable server, when a URL is posted to `/api/capture`, then a source file is created and its path, title and status are returned |
| `WRITE-02` | Given a server started without `--writable`, when a URL is posted to `/api/capture`, then it is refused with 403 and no file is written |
| `WRITE-03` | Given a URL already in the corpus, when it is posted again, then the response reports `created: false` with the existing path and no second file exists |
| `WRITE-04` | Given a server, when `/api/meta` is read, then it reports whether capture is enabled so the page can decide whether to offer it |
| `WRITE-05` | Given a URL that cannot be fetched, when it is posted, then the source is still created and the response carries the failure in `machine_verdict` |
| `WRITE-06` | Given a domain that does not yet exist, when a URL is posted with it, then the source is filed under it without error |

## Acceptance

```
uv run python scripts/spec_status.py --spec Capture-From-The-Screen --require-green
```

exits 0, and the operator has pasted a real URL into the page and seen it land
(Gate 4).

## Related

- [[Browse-Corpus]] — the surface this extends
- [[Capture-Link-First]] — the capture this exposes
- [[../contracts/Autonomy-Gates]] — the RED-list rule that makes the flag necessary

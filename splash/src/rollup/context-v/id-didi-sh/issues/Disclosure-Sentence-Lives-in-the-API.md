---
title: "The removal disclosure sentence lives in the API"
lede: "delete_member returns rendered English alongside the data. Deliberate, but it puts copy in the identity service and will not translate."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
semantic_version: 0.0.0.1
status: Open
tags:
  - Issue-Resolution
  - API-Design
  - Entities
  - Id-Didi-Sh
site_uuid: 9024c058-d7a4-408e-b17f-56cfd1a31be3
hex_code: ua1e49
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
publish: false
from: "id-didi-sh"
from_path: "context-v/issues/Disclosure-Sentence-Lives-in-the-API.md"
---
# The removal disclosure sentence lives in the API

## What

`DELETE /api/entities/:entity_id/members/:didi_id` returns both
`also_member_of` (structured) and `disclosure` (a rendered sentence:
*"Bob will keep access to: Apollo, Q3 Diligence."*).

## Why it was done

If every client composes its own phrasing, one of them eventually omits it — and
the omission is invisible in review because the endpoint still returns 200. Words
in the API make the honest thing the default.

## Why it might be wrong

- Copy in an identity service is copy in the wrong layer.
- It does not localise.
- Clients that want different tone now fight the default.

## Options

1. **Keep both.** Clients may ignore `disclosure` and render from
   `also_member_of`.
2. **Data only.** Drop the sentence; require clients to render it, and check in
   review.
3. **Structured hint** — return a key plus interpolation values
   (`{key: "keeps_access", names: [...]}`) so clients own the words and cannot
   forget the concept.

## Recommendation

Option 3 if this ever needs a second language or a second brand. Option 1 until
then — it is working and the failure it prevents is real.

## Related

- `lib/id_didi_sh_web/controllers/entity_controller.ex`

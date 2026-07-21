---
date_created: 2026-07-06
date_modified: 2026-07-06
title: "id.didi.sh is live — the full loop, clicked"
lede: "DNS validated, the Let's Encrypt cert issued, and the operator clicked a production magic link end to end: an email from no-reply@didi.sh, the scanner-proof /access confirm page at https://id.didi.sh, and a didi_session cookie scoped to .didi.sh. The platform's one-login promise works in production, on the canonical URL, same day the domain was bought."
publish: true
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
files_changed:
  - lib/id_didi_sh_web/controllers/access_controller.ex
  - lib/id_didi_sh_web/router.ex
tags:
  - Progress-Update
  - Milestone
  - Identity-Service
  - DNS
  - TLS
  - Didi-Platform
from: "id-didi-sh"
from_path: "changelog/2026-07-06_07_Id-Didi-Sh-Is-Live-The-Full-Loop-Clicked.md"
---
## Why Care?

Everything before tonight was scaffolding toward one moment: a real person
receives a real email from the platform's own domain, clicks it, and is
signed in across didi.sh. That moment happened — operator-clicked,
production, canonical URL.

## The last stretch

- The `/access` landing shipped (two-step: GET renders a confirm button and
  never touches the token, so mail-scanner prefetch can't burn a single-use
  link; only the explicit POST redeems; `next` redirects are same-site or
  `*.didi.sh` only).
- Resend domain verification completed; sender flipped to `no-reply@didi.sh`
  and the only-send-to-account-owner restriction lifted (client teammates
  can now receive links).
- The `id` A/AAAA records landed in Vercel DNS (after a brief apex detour),
  the CAA set turned out to already include letsencrypt.org via Vercel's
  connect flow, and the cert issued after Let's Encrypt's retry backoff
  from the pre-DNS validation attempts.
- One dinner-length token expiry later: clicked, confirmed, signed in.

## What's Next

Build-order step 3 — the membership gate in augment-it — with the entire
identity plane now operational beneath it. Aniel's membership is one
command once his address is confirmed.

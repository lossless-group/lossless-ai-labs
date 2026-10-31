---
type: Decisions
title: "Host the Connector on Railway at memopop.didi.sh"
lede: "The connector gets its own subdomain pointed straight at Railway. No domain to buy, and no proxy in front of streaming."
publish: true
date_created: 2026-10-10
date_modified: 2026-10-10
date_authored_initial_draft: 2026-10-10
date_authored_current_draft: 2026-10-10
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5 (1M context)
at_semantic_version: 0.0.0.1
status: Decided
tags:
  - Decision
  - MemoPop
  - Railway
  - Hosting
  - Didi-Sh
site_uuid: 9fbebef5-6f4e-4ba9-a1ae-62a847f64987
hex_code: l3q7vm
from: "memopop-ai"
from_path: "context-v/decisions/Host-the-Connector-on-Railway-at-memopop-didi-sh.md"
---
# Host the Connector on Railway at memopop.didi.sh

## The decision

- **Host: Railway.**
- **Address: `memopop.didi.sh`**, a subdomain pointed straight at the Railway
  service. The connector URL, the docs (`/docs`, `/llms.txt`), the upload page,
  and MemoPop's sign-in discovery document all live there.
- **No UI at first.** Claude is the only interface; the didi.sh sign-in page is
  the only screen a client sees.

Decided 2026-10-10 by Michael Staton.

## Why a subdomain, not `didi.sh/memopop/api`

`didi.sh` is the marketing site, served by Vercel. A path on it means Vercel
forwards every connector request to Railway: an extra hop in front of long,
streamed MCP responses, and MemoPop's discovery document would have to be
served from the Vercel site too. A subdomain avoids both, needs no new domain,
and the `custom-domain-cutover` skill already covers `*.didi.sh` to Railway.

## Watch for

Railway sits behind a proxy. Every URL the server advertises in a discovery
document must be `https://`; a proxy that advertised `http://` already broke a
Claude connection once, in the 2026-07-25 Twenty connector test.

## Related

- [[MemoPop-as-a-Claude-Connector]] — the exploration this came from
- [[Claude-Connectors-Need-didi-sh-to-Be-an-OAuth-Server]] — the issue that
  weighed the two addresses

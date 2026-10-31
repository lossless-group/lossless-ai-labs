---
type: Decisions
title: "Sign In Through didi.sh OAuth"
lede: "Partners sign in once with their didi.sh account, and the token says which firm they belong to. didi.sh has to grow OAuth first."
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
  - OAuth
  - Id-Didi-Sh
  - Claude-Connector
site_uuid: 7bd0ae6f-6c80-4712-910a-83c8e3737d00
hex_code: 9ssvaa
from: "memopop-ai"
from_path: "context-v/decisions/Sign-In-Through-didi-sh-OAuth.md"
---
# Sign In Through didi.sh OAuth

## The decision

**Claude signs partners into the MemoPop connector with OAuth, and didi.sh is
the OAuth server.** A partner adds the connector, Claude opens the didi.sh
sign-in page, they use their magic link, and they don't see it again.

- **The token names the person and their firm**, which MemoPop maps to the
  firm's workspace.
- **The token is issued for `https://memopop.didi.sh` only**, so it can't be
  used against another didi.sh app.
- **MemoPop checks tokens itself** against didi.sh's published signing keys,
  and serves its own discovery document naming didi.sh as the sign-in server.

Decided 2026-10-10 by Michael Staton.

## Why

didi.sh is already the one account across memos, decks, and augment-it. A
separate MemoPop login would be a second account for every client, and a
second sign-in system for us to secure.

## The blocker

As of 2026-10-10, id.didi.sh has none of the OAuth endpoints on any branch:
no `/authorize`, `/token`, client registration, or discovery document. The
work is tracked in id-didi-sh's
[[Claude-Connectors-Need-didi-sh-to-Be-an-OAuth-Server]], and both halves have
to be designed together.

## Related

- [[MemoPop-as-a-Claude-Connector]] — the exploration this came from
- [[What-OAuth-and-OIDC-Actually-Are-and-What-didi-sh-Still-Needs]] — the gap
  and the roles
- [[Host-the-Connector-on-Railway-at-memopop-didi-sh]]

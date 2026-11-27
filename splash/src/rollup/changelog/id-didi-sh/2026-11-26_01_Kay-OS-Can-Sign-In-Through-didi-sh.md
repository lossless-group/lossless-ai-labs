---
site_uuid: 515d0eb5-89f1-4a42-854d-3d3766807de9
hex_code: v0lebk
title: "Kay-OS Can Sign In Through didi.sh"
lede: "id.didi.sh can now issue tokens for Kay-OS, making it the second service after MemoPop that a Claude connector can sign into with one didi.sh login."
publish: true
date_created: 2026-11-26
date_modified: 2026-11-26
date_authored_initial_draft: 2026-11-26
date_authored_current_draft: 2026-11-26
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
tags:
  - OAuth
  - Claude-Connectors
  - Kay-OS
  - Id-Didi-Sh
files_changed:
  - config/config.exs
from: "id-didi-sh"
from_path: "changelog/2026-11-26_01_Kay-OS-Can-Sign-In-Through-didi-sh.md"
---
## Why Care?

The point of didi.sh is one login across many services. Until today that meant
one service. A Claude connector could sign into MemoPop through id.didi.sh,
and nothing else was registered. Kay-OS is the second, and the first that
isn't a didi.sh subdomain.

## What's New?

- **`https://mcp.kay-os.lol` is a registered OAuth resource,** named "kay-os".
  When Claude adds a Kay-OS connector and asks id.didi.sh for a token, it gets
  one whose audience is `https://mcp.kay-os.lol`. Because each service checks
  the audience, a Kay-OS token is refused at MemoPop and a MemoPop token is
  refused at Kay-OS.
- **The MCP endpoint path works as-is.** A request for a path under the
  registered address (such as `https://mcp.kay-os.lol/mcp`) is issued for
  `https://mcp.kay-os.lol`, the same rule MemoPop already uses.
- **Nothing else changes for the person signing in.** It's the same magic
  link, the same invite-only rule, and the same consent screen where they
  pick which entity the connector acts for.

## What Kay-OS Still Has to Do

Registration is id.didi.sh's half. Kay-OS's half is still to be built.
Its own connector plan (`kay-os/context-v/plans/Plan-C4-Remote-MCP-Connector.md`)
is still choosing a login, and this makes didi.sh one of the options. To use
it, Kay-OS has to:

1. Publish `/.well-known/oauth-protected-resource` naming
   `https://id.didi.sh` as its authorization server, so Claude knows where to
   send the person.
2. Verify each bearer token against `https://id.didi.sh/.well-known/jwks.json`
   (EdDSA), and reject any token whose audience isn't `https://mcp.kay-os.lol`.
3. Decide who gets in. Every token carries the person's `didi_id` (as `sub`)
   and the entity they chose (as `entity`), so restricting Kay-OS to
   Michael's account is a single check of `sub`.

## Worth Knowing

- **Checked against the production config,** not just dev: the prod build
  lists both MemoPop and kay-os.
- **Adding the next service is a one-line change** to `oauth_resources` in
  `config/config.exs`. That is deliberate: the list of resources is the list
  of services that trust id.didi.sh, and it should be read in one place.

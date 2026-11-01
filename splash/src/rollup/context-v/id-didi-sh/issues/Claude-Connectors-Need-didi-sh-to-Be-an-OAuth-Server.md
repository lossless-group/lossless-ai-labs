---
title: "Claude connectors need didi.sh to be an OAuth server"
lede: "didi.sh knows who a person is. It can't yet tell Claude so, and MemoPop's connector is the first product waiting on that."
date_created: 2026-10-10
date_modified: 2026-10-10
resolved_by: changelog/2026-10-10_01_Claude-Can-Sign-A-Partner-In-Through-didi-sh.md
date_authored_initial_draft: 2026-10-10
date_authored_current_draft: 2026-10-10
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5 (1M context)
at_semantic_version: 0.0.0.1
status: Resolved
site_uuid: d0936bf0-8b54-4931-b77a-827f75ef75c0
hex_code: ov36b9
summary: >-
  Issue recording that id.didi.sh has no OAuth authorization-server endpoints on
  any branch (checked 2026-10-10), and what a Claude connector requires of it.
  First consumer: MemoPop hosted as a Claude connector (remote MCP) with one
  workspace per client firm. Lists the endpoints, Claude-specific requirements
  (callback URL, client identity, PKCE, refresh), the resource-server half that
  lives on the MemoPop side, the https-behind-proxy gotcha, and the
  didi.sh/memopop/api vs. subdomain question.
tags:
  - Issue-Resolution
  - OAuth
  - Model-Context-Protocol
  - Claude-Connector
  - MemoPop
  - Id-Didi-Sh
publish: true
type: Issues
from: "id-didi-sh"
from_path: "context-v/issues/Claude-Connectors-Need-didi-sh-to-Be-an-OAuth-Server.md"
---
# Claude connectors need didi.sh to be an OAuth server

> **Resolved by** `feature/oauth-for-connectors` (2026-10-10), recorded in
> [[Claude-Can-Sign-A-Partner-In-Through-didi-sh]]. id.didi.sh now serves
> discovery, Dynamic Client Registration, authorize with S256 PKCE and one
> consent screen, and a token endpoint with rotating refresh tokens. Access
> tokens are EdDSA JWTs with `aud` = `https://memopop.didi.sh` and
> `entity: {id, slug}`. Proven by OAUTH-01..10 in ExUnit. **Still open:**
> "done when" 1-3 need a live run with a real Claude client against a deploy,
> and 4 (an `id_token` for Onyx) isn't built. Claude supports both DCR and
> CIMD and falls back to DCR when CIMD isn't advertised, so DCR alone was
> implemented. The changelog explains why.

## What

MemoPop is becoming a Claude connector: a remote MCP server that a client
firm's partners reach from Claude Desktop, web, and mobile
([[MemoPop-as-a-Claude-Connector]]). Claude signs people into a connector with
**OAuth**. Claude is the OAuth client; something has to be the OAuth server.
That should be didi.sh, the one identity across memos, decks, and augment-it.

**id.didi.sh has none of the OAuth server endpoints.** Checked 2026-10-10 on
`main`, `development`, `master`, `feature/entities-and-keys`, and
`hygene/test-coverage`: no `/authorize`, `/token`, `/register`, or discovery
document, and no OAuth or PKCE code anywhere in `lib/`. What exists is the hard
half: magic-link sign-in, server-side sessions with revocation, EdDSA signing,
`/.well-known/jwks.json`, `/api/me`, and entities.

[[What-OAuth-and-OIDC-Actually-Are-and-What-didi-sh-Still-Needs]] (2026-08-20)
already maps the gap and explains the roles. This issue adds what Claude's
connector client specifically requires, and the first concrete consumer.

## What Claude requires

From [Build an MCP server for Claude](https://claude.com/docs/connectors/building)
and its authentication pages:

| Requirement | Detail |
|---|---|
| **Spec versions** | Claude follows the MCP authorization specs dated 2025-03-26, 2025-06-18, and 2025-11-25 |
| **Authorization code + PKCE** | OAuth 2.1 style: `/authorize` (browser) and `/token` (code exchange) |
| **Client identity** | Claude can register itself through Dynamic Client Registration (`/register`), or use "Claude's published identity", which the docs recommend. Supporting the published identity may avoid building DCR at all; read the authentication page before choosing |
| **Redirect URI** | Allow `https://claude.ai/api/mcp/auth_callback` for claude.ai, Desktop, and mobile, plus a loopback redirect for Claude Code |
| **Token refresh** | Claude refreshes expired access tokens, so `/token` must support the refresh grant |
| **Discovery** | `/.well-known/oauth-authorization-server` (and `openid-configuration` for OIDC consumers like Onyx) |

## What the endpoints need to do for MemoPop

- **`/authorize` is the only screen a client ever sees.** There is no MemoPop UI
  at first. A partner adds the connector in Claude, Claude opens this page,
  they sign in with the existing magic link, and they never see it again. It
  should say plainly which app is asking (MemoPop) and which firm workspace the
  person will reach.
- **Tokens carry the firm.** One MemoPop workspace per client firm. The firm is
  a didi.sh entity, so the issued token needs to identify the person and the
  entity (or entities) they can reach, for MemoPop to map to a workspace.
- **Tokens are bound to MemoPop.** A token issued for the MemoPop connector
  should not be accepted by another didi.sh consumer. MCP's authorization spec
  uses resource indicators for this; issue tokens with MemoPop as the audience.

## The half that lives on the MemoPop side

The MemoPop server is the **resource server**. It serves
`/.well-known/oauth-protected-resource`, naming id.didi.sh as its authorization
server, and returns `401` with a `WWW-Authenticate` header pointing at that
document when a request has no valid token. It verifies tokens against
`/.well-known/jwks.json`. None of that is didi.sh's code, but the two halves
have to agree on audience, scopes, and claims, so design them together.

## Where the MemoPop connector should live

`didi.sh` is the marketing site on **Vercel**; `id.didi.sh` is Phoenix on
**Fly**; MemoPop's server will be on **Railway**. Serving MemoPop at
`didi.sh/memopop/api` means Vercel proxying every connector request to
Railway. That is likely workable with an external rewrite, but it adds a hop
in front of long-running streamed MCP responses, and the protected-resource
discovery document would have to be served from the Vercel site too.

**Decided 2026-10-10: `memopop.didi.sh`**, pointed straight at Railway. It
avoids both problems, needs no new domain purchase, and the
`custom-domain-cutover` skill already covers `*.didi.sh` to Railway. The
token audience is therefore `https://memopop.didi.sh`, and MemoPop serves its
own `https://memopop.didi.sh/.well-known/oauth-protected-resource`.

## The gotcha already measured

From the 2026-07-25 connector test (Claude Desktop to Twenty's MCP, behind
Railway's proxy): the server advertised `http://` OAuth endpoints because it
didn't trust `X-Forwarded-Proto`, Railway 301'd the POST, and Claude failed
with *"Couldn't register with … sign-in service."* id.didi.sh sits behind
Fly's proxy and MemoPop will sit behind Railway's. **Every URL in every
discovery document must be `https://`.** Check the `.well-known` output first
when a connection fails.

## Done when

1. Adding the MemoPop connector in Claude Desktop opens the didi.sh sign-in,
   and after the magic link Claude is connected.
2. The token MemoPop receives identifies the person and their firm entity, and
   MemoPop rejects tokens issued for other audiences.
3. An expired access token is refreshed without the partner signing in again.
4. The same endpoints serve an OIDC client (Onyx) with discovery and
   `id_token`, per the August note.

## Related

- [[What-OAuth-and-OIDC-Actually-Are-and-What-didi-sh-Still-Needs]] — the gap,
  the roles, and who needs which flow
- [[MemoPop-as-a-Claude-Connector]] — the first consumer
- [[Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane]] — the remote MCP
  capability plane this enables
- [[Id-Didi-Sh-Identity-Service]] — the spec of record

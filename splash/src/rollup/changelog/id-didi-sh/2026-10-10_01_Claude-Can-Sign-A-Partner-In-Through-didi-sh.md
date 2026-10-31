---
date_created: 2026-10-10
date_modified: 2026-10-10
title: "Claude can sign a partner in through didi.sh"
lede: "id.didi.sh is now an OAuth authorization server. A Claude connector can send someone through one magic link and get back a token that names the person and their firm."
publish: true
date_authored_initial_draft: 2026-10-10
date_authored_current_draft: 2026-10-10
date_work_started: 2026-10-10
date_work_completed: 2026-10-10
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5 (1M context)
site_uuid: 08eb6ffa-b3b7-4197-8686-5af4c2137551
hex_code: s4r6xk
summary: >-
  Phase 3 of the MemoPop connector work. id.didi.sh now serves OAuth discovery,
  dynamic client registration, the authorization-code flow with S256 PKCE, and
  a token endpoint with rotating refresh tokens. Access tokens are EdDSA JWTs
  signed with the existing key, audienced to the registered resource
  (https://memopop.didi.sh first), and carry the chosen firm as an entity claim.
  The only new pixels are one consent screen; sign-in reuses /auth and /access.
  Tested end to end in ExUnit (OAUTH-01..10); not yet tested against a real
  Claude client.
tags:
  - Changelog
  - Id-Didi-Sh
  - OAuth
  - Claude-Connector
  - MemoPop
  - Identity-Service
files_changed:
  - priv/repo/migrations/20261010000001_oauth_authorization_server.exs
  - lib/id_didi_sh/oauth.ex
  - lib/id_didi_sh/oauth/client.ex
  - lib/id_didi_sh/oauth/authorization_code.ex
  - lib/id_didi_sh/oauth/refresh_token.ex
  - lib/id_didi_sh_web/controllers/oauth_metadata_controller.ex
  - lib/id_didi_sh_web/controllers/oauth_registration_controller.ex
  - lib/id_didi_sh_web/controllers/oauth_authorize_controller.ex
  - lib/id_didi_sh_web/controllers/oauth_authorize_html/consent.html.heex
  - lib/id_didi_sh_web/controllers/oauth_token_controller.ex
  - lib/id_didi_sh_web/controllers/auth_controller.ex
  - lib/id_didi_sh_web/router.ex
  - config/config.exs
  - test/id_didi_sh_web/controllers/oauth_test.exs
from: "id-didi-sh"
from_path: "changelog/2026-10-10_01_Claude-Can-Sign-A-Partner-In-Through-didi-sh.md"
---
# Claude can sign a partner in through didi.sh

## Why Care?

MemoPop is becoming a Claude connector: a remote MCP server that a firm's
partners reach from Claude Desktop, the web, mobile, and Claude Code. Claude
signs people into a connector with OAuth, which needs an authorization server.
id.didi.sh already knew who a person was (magic links, sessions, an EdDSA key,
JWKS). It just couldn't say so in the protocol Claude speaks.

Now it can. A partner adds the connector, Claude opens id.didi.sh, they click
one magic link and pick their firm, and Claude holds a token MemoPop can verify
offline against `/.well-known/jwks.json`.

## What's New?

| Method | Path | What it does |
|---|---|---|
| GET | `/.well-known/oauth-authorization-server` | RFC 8414 metadata |
| GET | `/.well-known/openid-configuration` | Same server, OIDC Discovery shape |
| POST | `/oauth/register` | RFC 7591 dynamic client registration (JSON) |
| GET | `/oauth/authorize` | Sign-in hop if needed, then the consent screen |
| POST | `/oauth/authorize` | The consent decision |
| POST | `/oauth/token` | `authorization_code` and `refresh_token` grants (form-urlencoded) |

**Every URL in discovery comes from the configured issuer**, never from the
request. Fly's proxy forwards plain http, and the 2026-07-25 Twenty test showed
what an `http://` endpoint in discovery does to Claude. OAUTH-01 sends a plain
http request and requires every URL to be `https://id.didi.sh/...`.

## What a token says

Header: `{"alg": "EdDSA", "kid": <JWKS kid>, "typ": "at+jwt"}`.

```json
{
  "iss": "https://id.didi.sh",
  "sub": "<didi_id>",
  "aud": "https://memopop.didi.sh",
  "entity": { "id": "<entity id>", "slug": "<entity slug>" },
  "scope": "profile offline_access",
  "client_id": "dcr_…",
  "iat": 1760000000,
  "exp": 1760003600,
  "jti": "<uuid7>"
}
```

- Access tokens last one hour. Refresh tokens last 30 days and rotate on every
  use. Codes last 120 seconds and work once.
- **There is no `sid` claim**, so an access token can never pass as a
  `didi_session` cookie. A test proves `/api/me` refuses one.
- Codes, refresh tokens, and client secrets are stored only as SHA-256 hashes.

## How Claude registers, and why only DCR

From [Authentication for connectors](https://claude.com/docs/connectors/building/authentication)
(fetched 2026-10-10): Claude supports both **Dynamic Client Registration** and
**Client ID Metadata Documents** by default. It uses CIMD only when the
authorization server metadata advertises *both*
`client_id_metadata_document_supported: true` and `"none"` in
`token_endpoint_auth_methods_supported`, and **otherwise falls back to DCR**.
Claude Code identifies itself with its own CIMD at
`https://claude.ai/oauth/claude-code-client-metadata`, which declares
`http://localhost/callback` and `http://127.0.0.1/callback`.

We implemented DCR and **do not advertise CIMD**, so every Claude surface takes
the DCR path. CIMD would have the server fetch an arbitrary client URL during
`/authorize` (an outbound-request surface to harden and cache). It mainly pays
off at directory scale, where DCR mints a client per connection, and didi.sh is
invite-only with a handful of partners. It can be added later without changing
anything that exists.

Other Claude-specific requirements, and where they're met:

- **Redirect URIs**: `https://claude.ai/api/mcp/auth_callback` exactly, plus
  loopback on `localhost` *and* `127.0.0.1` with the port ignored (Claude Code
  binds an ephemeral port). Anything else is refused at registration (OAUTH-02)
  and at authorize (OAUTH-04).
- **PKCE**: S256 only, and `code_challenge_methods_supported: ["S256"]` is
  advertised, which the MCP 2025-11-25 spec requires clients to check.
- **`offline_access`** is in `scopes_supported`: Claude appends it to get a
  refresh token when the server lists it.
- **Refresh**: rotated for public clients (MCP 2025-11-25, OAuth 2.1 §4.3.1),
  a dead token answers `invalid_grant`, and the token endpoint parses
  `application/x-www-form-urlencoded` (OAUTH-06..08 send real form bodies).
- **`resource`** (RFC 8707) is required at authorize, per the MCP 2025-06-18
  and 2025-11-25 authorization specs. An unknown resource gets `invalid_target`.

Sources: [Build an MCP server for Claude](https://claude.com/docs/connectors/building),
[Authentication for connectors](https://claude.com/docs/connectors/building/authentication),
[Lazy authentication](https://claude.com/docs/connectors/building/lazy-authentication)
(loopback matching, CIMD details),
[MCP authorization 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization),
[MCP authorization 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization).

## The one new screen (invariant 4, extended on purpose)

The repo's invariant 4 is headless-first: apps own the login pixels. An
authorization server can't follow that rule, because Claude opens our page and
can't render anyone's login. So it's extended as little as possible:

- **The sign-in hop reuses what exists.** Signed out, `/oauth/authorize` sends
  the person to `/auth` with a `return_to`. The magic link carries it, and
  `/access` redirects back. `/auth` accepts only an `/oauth/authorize` return
  path, so it can't be used as a redirector (OAUTH-03).
- **One consent screen** names the app, the host it returns to (with a warning
  when that host is the person's own machine), the product, and the firm. A
  person in several firms picks one (OAUTH-05). The POST re-checks everything
  and never trusts the form's hidden fields.

## The firm in the token

The `entity` claim is the firm the person chose on the consent screen, out of
the entities they can reach (members plus lenders, the same rule as
`/api/entities`). On refresh, the server re-checks that they still belong to it.
If they've been removed, the grant dies.

## Revocation

Each refresh-token family belongs to the didi.sh session that consented.
Signing out through `DELETE /api/session` ends that session, and its refresh
tokens fail from then on (OAUTH-09). A rotated-out refresh token presented again
revokes its whole family (OAUTH-08), and a replayed authorization code revokes
whatever it produced.

While a connector is in use, each refresh rolls the consenting session forward,
the same 30-day window `/api/session/refresh` gives a browser. Without that, a
partner would be silently disconnected 30 days after signing in.

## A deliberate widening of "aud = resource"

Claude sends `resource` as the MCP server URL the person typed, path included
(`https://memopop.didi.sh/mcp`). MemoPop verifies `aud == "https://memopop.didi.sh"`.
So a requested resource at or beneath a registered one (same https origin, path
equal or below) resolves to the **registered** URI, and that's the audience.
Look-alike hosts, other ports, http, queries, and fragments never match
(OAUTH-04), and a grant can't switch audience at the token or refresh step
(OAUTH-10).

## Tests

`mix test`: **106 before, 125 after** (19 new: OAUTH-01..10, several IDs with
more than one case). `mix format --check-formatted` and
`mix compile --warnings-as-errors` are clean.

## Not tested

Nothing here has met a **real Claude client**. Discovery, registration,
authorize, and token are proven against the specs and Claude's published
requirements in ExUnit, not against claude.ai, Desktop, mobile, or Claude Code.
The open questions only a live run answers:

- whether Claude's DCR request asks for `token_endpoint_auth_method: "none"` (handled) or a confidential method (also handled, untested);
- which `resource` value Claude actually sends for MemoPop;
- the round trip through Fly's proxy;
- Claude's 10-second limit on discovery, registration, and token responses.

The consent screen has not been walked by a human, and a magic link opened in
a different browser than the one Claude launched hasn't been tried. That case
should work, because the flow state lives in the URL.

**No `id_token` is issued yet.** The OpenID configuration document exists for
discovery, but an OIDC client like Onyx still needs `id_token` and `userinfo`,
which is the issue's fourth "done when" and remains open.

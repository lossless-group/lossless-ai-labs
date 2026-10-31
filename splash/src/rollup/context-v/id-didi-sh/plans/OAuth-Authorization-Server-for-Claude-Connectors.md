---
type: Plans
title: "OAuth Authorization Server for Claude Connectors"
lede: "Discovery, authorize, token, refresh, and client registration on id.didi.sh, so Claude can sign a partner into MemoPop with one magic link."
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
status: Ready
issue_reference: context-v/issues/Claude-Connectors-Need-didi-sh-to-Be-an-OAuth-Server.md
consumer_spec: memopop-orchestrator/context-v/specs/MemoPop-Connector-API.md
branch: feature/oauth-for-connectors (from main, this repo's working branch)
site_uuid: 7274b371-1f6d-4648-a137-45b3aa873096
hex_code: e9asg4
tags:
  - Plan
  - Id-Didi-Sh
  - OAuth
  - Claude-Connector
  - Elixir
from: "id-didi-sh"
from_path: "context-v/plans/OAuth-Authorization-Server-for-Claude-Connectors.md"
---
# OAuth Authorization Server for Claude Connectors

This is Phase 3 of the MemoPop connector work, run in this repo. Read first:

- `context-v/issues/Claude-Connectors-Need-didi-sh-to-Be-an-OAuth-Server.md`:
  what Claude requires and what MemoPop needs from the tokens.
- `context-v/notes/What-OAuth-and-OIDC-Actually-Are-and-What-didi-sh-Still-Needs.md`:
  the roles and the gap.
- The MemoPop spec's §Auth (in `memopop-orchestrator`), which is the other half:
  MemoPop verifies tokens against `/.well-known/jwks.json`, requires audience
  `https://memopop.didi.sh`, and reads the firm from the entity claim.
- **Current Claude docs** on connector authentication
  ([Build an MCP server for Claude](https://claude.com/docs/connectors/building)
  and its auth pages) and the MCP authorization spec (2025-06-18 and
  2025-11-25). Confirm whether Claude registers through Dynamic Client
  Registration, a Client ID Metadata Document, or both, and implement what
  Claude actually uses. Record the sources in the changelog.

## What to build

1. **Discovery**: `/.well-known/oauth-authorization-server` and
   `/.well-known/openid-configuration`. Every URL comes from configured
   `issuer` (`https://id.didi.sh`), never from the request: Fly's proxy
   forwards plain http, and an `http://` URL here breaks Claude.
2. **Client registration**: DCR (`POST /oauth/register`, RFC 7591) and/or
   Client ID Metadata Documents, per what Claude uses. Redirect URIs allowed:
   `https://claude.ai/api/mcp/auth_callback` and loopback
   (`http://localhost:<port>/…`, `http://127.0.0.1:<port>/…`) for Claude Code.
   Reject any other redirect.
3. **`GET /oauth/authorize`**: authorization code flow with PKCE (S256 only).
   No session → the existing magic-link sign-in, then back here. With a
   session → one consent screen in the existing design system saying which
   app is asking (from the client's name) and which firm the person will
   reach; a person in several entities picks one. `resource` (RFC 8707) is
   required and must be a registered resource; `https://memopop.didi.sh` is
   the first.
4. **`POST /oauth/token`**: `authorization_code` (verifies PKCE, single-use,
   short-lived codes) and `refresh_token` (rotating; a reused refresh token
   revokes the family). Access tokens: EdDSA JWTs signed with the existing
   key (`IdDidiSh.Keys`), `aud` = the resource, `sub` = didi_id,
   `entity` = the chosen entity's id and slug, `scope`, one-hour expiry.
   Store only hashes of codes and refresh tokens.
5. **Revocation**: revoking the didi.sh session revokes its refresh tokens.

## Tests (ExUnit, tag each with its ID: `@tag spec: "OAUTH-01"`)

| ID | Given / When / Then |
|---|---|
| `OAUTH-01` | Discovery documents list every endpoint, and every URL is `https://`, even on a plain-http request |
| `OAUTH-02` | Registration accepts Claude's callback and a loopback redirect, and rejects any other redirect URI |
| `OAUTH-03` | Authorize without a session sends the person through magic-link sign-in and back |
| `OAUTH-04` | Authorize rejects a missing or non-S256 PKCE challenge, an unknown client, an unregistered redirect, and an unknown resource |
| `OAUTH-05` | A person in two entities chooses one; the token carries that entity |
| `OAUTH-06` | Token exchange with the right verifier returns an access token whose `aud` is the resource and which verifies against `/.well-known/jwks.json`; a wrong verifier is refused |
| `OAUTH-07` | An authorization code works once; a second use is refused |
| `OAUTH-08` | A refresh token returns a new pair; reusing the old one is refused and revokes the family |
| `OAUTH-09` | Revoking the session makes its refresh tokens fail |
| `OAUTH-10` | An access token for one resource is not issued with another resource's audience |

Write them first and watch them fail, then implement. Never edit a test to
pass; if one can't pass honestly, stop and report.

## Rules and done

- Work on `feature/oauth-for-connectors` from `main` (this repo's working
  branch, per its CLAUDE.md). Don't push to `main` or `master`, and **don't
  deploy**; the VP Eng merges and deploys with the operator's approval.
- **Invariant 4 (headless-first) is extended, deliberately and minimally.** An
  authorization server has to host `/oauth/authorize`; Claude can't render
  our login. Keep it to the sign-in hop and one consent screen, reuse the
  existing `/access` and magic-link pages, and say so in the changelog.
- The `didi_session` cookie, `/api`, and the JWKS contract don't change. The
  access tokens are a new artifact signed with the same key.
- `mix test` green (record the count before and after), `mix format --check-formatted`,
  `mix compile --warnings-as-errors`.
- A changelog entry per this repo's `changelog/` convention, honest about what
  wasn't tested (anything needing a real Claude client).
- Update the issue doc's status and add a "Resolved by" note.
- Push the branch and report: the test counts, the endpoints, and the exact
  token claims, so the VP Eng can check MemoPop's verifier against them.

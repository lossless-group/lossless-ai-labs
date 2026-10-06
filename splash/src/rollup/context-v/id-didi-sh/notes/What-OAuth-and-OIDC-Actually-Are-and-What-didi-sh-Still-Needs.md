---
title: "What OAuth and OIDC actually are, and what didi.sh still needs"
lede: "OAuth answers 'is this app allowed to act for me.' OIDC adds 'and here is who I am.' didi.sh already does the hard part — knowing who a human is — and is missing only the standard front door that off-the-shelf apps know how to knock on."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
tags:
  - Note
  - Id-Didi-Sh
  - OAuth
  - OIDC
  - MCP
  - Identity
site_uuid: e5fa7bce-ac7d-45e0-83ad-25ca1ec2d90b
hex_code: pdabr5
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
publish: false
from: "id-didi-sh"
from_path: "context-v/notes/What-OAuth-and-OIDC-Actually-Are-and-What-didi-sh-Still-Needs.md"
---
# What OAuth and OIDC actually are, and what didi.sh still needs

A reference note, written because the terms get used as if self-evident and they
are not. Grounded in *our* actors — didi.sh, Onyx, Claude Desktop — rather than
in the abstract.

## The one-line version

**OAuth** is the standard handshake for *"let this app act for me without giving
it my password."*

**OIDC** (OpenID Connect) is a thin layer on top that adds *"…and here is who I
am."*

OAuth answers **permission**. OIDC answers **identity**. Onyx needs the second;
MCP mostly needs the first; they are the same machinery, and OIDC is the
superset.

## The four roles, in our system

| Role | Who, for us |
|---|---|
| **Resource owner** | The human — Jason, Janae, Michael |
| **Client** | The app wanting access — Claude Desktop, ChatGPT, Onyx |
| **Authorization server** | Authenticates the human, issues tokens — **didi.sh** |
| **Resource server** | Holds the data — homebase MCP, or any didi-verifying service |

The single most useful thing to internalise: **didi.sh is the authorization
server.** Everything missing below is about making it *look* like one to software
that has never heard of us.

## The flow, step by step

Claude Desktop connecting to homebase, which is the case that matters:

1. Claude Desktop wants to reach homebase. It has no idea who the human is.
2. It opens the human's browser at didi.sh **`/authorize`**.
3. didi.sh checks whether they are signed in. If not → **magic link, which we
   already have.**
4. It asks: *"Allow Claude Desktop to access homebase as you?"* They click yes.
5. didi.sh redirects back with a short-lived **authorization code**.
6. Claude Desktop trades that code at didi.sh **`/token`** for an **access
   token**.
7. Claude Desktop calls homebase with the token. Homebase verifies it against
   didi.sh's **`/.well-known/jwks.json` — already live.**

Two properties worth noticing, because they are the entire point:

- The human's credential never touches Claude Desktop.
- Homebase never holds a secret for that human — only a signed token it can
  verify offline against JWKS.

## Vocabulary you will meet in the specs

| Term | What it means | Why we care |
|---|---|---|
| **Authorization code** | Short-lived one-time string swapped for a token | The safe flow for anything with a browser |
| **PKCE** | Proof the app redeeming the code is the one that started the flow | **Mandatory in OAuth 2.1.** Stops a stolen code being replayed |
| **DCR** (RFC 7591) | An app registers *itself* and gets a `client_id` on arrival | **Why "just issue a client_id" is not enough for MCP** — Claude Desktop connects to servers nobody pre-registered it with |
| **`id_token`** | Signed JWT carrying identity claims (sub, email, name) | The OIDC part. What lets Onyx create the user row |
| **`/userinfo`** | Endpoint returning the same claims | `/api/me` is effectively this already |
| **Discovery document** | JSON at a well-known URL listing all the endpoints | How a client finds `/authorize` and `/token` without being told |
| **JWKS** | Public keys, so a resource server verifies tokens offline | **We already serve this** |
| **Access token** | What the client presents to the resource server | Ours are EdDSA-signed |
| **Scope** | Which permissions the token carries | Where our workspace/entity model eventually plugs in |

## What didi.sh has vs. what it needs

The hard part of an authorization server is *securely knowing who a human is*.
didi.sh already does that. What is missing is the standard front door.

| Already there | Missing |
|---|---|
| Magic-link auth (`/api/magic-links`) | **`/authorize`** — browser-facing consent step |
| Server-side sessions + revocation | **`/token`** — code → token exchange |
| EdDSA signing (`jose` in `mix.exs`) | **`/register`** — dynamic client registration |
| **`/.well-known/jwks.json`** — live, 200 | **`/.well-known/openid-configuration`** |
| `/api/me` — effectively `userinfo` | **`/.well-known/oauth-authorization-server`** |
| `/api/workspaces` + join | `oauth_clients`, `authorization_codes` tables |

## Who needs which

| Consumer | Needs | Note |
|---|---|---|
| **Onyx SSO** | **OIDC** — discovery, `/authorize`, `/token`, `id_token`, `userinfo` | Onyx's multi-provider OIDC lives in `backend/onyx/server/oidc_multi.py` — the **MIT** path, not `ee/`, so no enterprise licence needed. It "ships dark," 404ing until a provider row exists |
| **Claude Desktop → homebase** | **OAuth 2.1 + PKCE + DCR** | DCR is the one people forget |
| **ChatGPT Desktop / mobile** | Unmeasured | Three of the four matrix cells are still unrun |

Both are the same endpoints. Build OIDC and MCP mostly comes along.

## The gotcha that will bite us, already measured once

From the connector matrix finding of **2026-07-25** (Claude Desktop → Twenty's
native MCP, which passed):

> Twenty behind Railway's proxy advertised `http://` OAuth endpoints (Express not
> trusting `X-Forwarded-Proto`); Railway 301s http POSTs, which killed Claude's
> DCR with *"Couldn't register with …'s sign-in service."* Fix: `TRUST_PROXY=1`.

**The lesson generalises to us:** didi.sh runs behind Fly's proxy. When it starts
serving discovery metadata, every URL in that JSON must be **`https://`**, or
clients fail with opaque errors that look like *their* bug. Check the
`.well-known` output before blaming the client app.

## Why this is worth building — the actual argument

Not architecture for its own sake. The difference is:

- **Without it:** every new tool needs bespoke auth work, and each one is another
  login for three people to manage.
- **With it:** you write the handshake **once**, and every OAuth-speaking app —
  Onyx, Claude Desktop, ChatGPT, whatever ships next quarter — can use didi.sh as
  its login with no integration work on our side.

The near-term payoff is concrete and small: **Jason, Janae and Michael sign into
Onyx with didi.sh**, which retires `AUTH_TYPE=basic` and the deliberately
time-boxed open registration on palmer-ai's instance. The same endpoints are then
the first slice of what MCP needs later.

## Standards, if you need the source

- **OAuth 2.1** (draft, consolidates 2.0 + mandatory PKCE)
- **RFC 6749** — OAuth 2.0 core
- **RFC 7636** — PKCE
- **RFC 7591** — Dynamic Client Registration
- **RFC 8414** — Authorization Server Metadata (`/.well-known/oauth-authorization-server`)
- **RFC 9728** — Protected Resource Metadata (what a resource server publishes)
- **OpenID Connect Core 1.0** — the identity layer

## Related

- `context-v/explorations/Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane.md`
  — line 52 flags the OAuth 2.1 surface as a contract addition, with the
  `didi_session` → MCP token exchange as a cheaper interim
- `ai-labs/context-v/specs/Id-Didi-Sh-Identity-Service.md` — the spec of record;
  contract changes go there first
- `ai-labs/context-v/specs/Flexible-Entity-Relationships-to-Mirror-Messy-IRL-Collaboration.md`
  — the entity / lending model these tokens will eventually carry scopes for
- `ai-labs/context-v/explorations/Secrets-for-Collaborators-Who-Will-Never-Open-a-Terminal.md`
  — OQ#1 (the connector matrix) and OQ#4 (which OAuth surface we actually need)
- `self-host-stack/context-v/specs/Homebase-MCP-One-Connector-Per-Client.md` —
  amendment A1 makes didi.sh the authorization server

---
name: MCP-API Profile
slug: mcp-api
upstream: https://github.com/Parslee-ai/mcp-api
package: not published — runs as containers (mcp-api + mcp-web)
license: MIT
maintainer: Parslee-ai (formerly "AnyAPI" — see CHANGELOG.md)
study: studies/open-specs-and-standards
profile_path: studies/open-specs-and-standards/mcp-api
profile_kind: applied-product
date_created: 2026-05-05
from: "studies/open-specs-and-standards"
from_path: "context-v/profiles/Profile__MCP-API.md"
---
# MCP-API — Profile

A profile of MCP-API as it lives in this study (`studies/open-specs-and-standards/mcp-api/`). Cites pinned paths so you can jump to source rather than trust paraphrase. Read this paired with [`Profile__Model-Context-Protocol.md`](./Profile__Model-Context-Protocol.md) — that profile covers the protocol; **this one is the production-shaped applied product**, what a real-world MCP server looks like once you wrap it in multi-tenancy, billing, secret encryption, and a marketing site.

## TL;DR

MCP-API is **a multi-tenant SaaS platform that turns any REST API into MCP tools**. The pitch (`README.md:5`):

> A multi-tenant SaaS platform that turns REST APIs into MCP (Model Context Protocol) tools. Register any API with an OpenAPI specification and let AI agents call it through a unified interface.

It is **not** a protocol, **not** a specification, **not** a convention. It is a deployed product — running at `mcp-api.ai` (`README.md:182-194`) with a Next.js dashboard, an ASP.NET Core REST API, an MCP server binary that speaks stdio, all on Azure Container Apps backed by Cosmos DB and Azure Key Vault. License: MIT.

The product hypothesis sits exactly inside the gap MCP describes. From the [MCP profile](./Profile__Model-Context-Protocol.md): MCP collapses the *N×M* "every AI app × every tool/data source" integration problem to *N+M*. MCP-API is then **one of the M's** — a generic, reusable MCP server that fans out to *every REST API with an OpenAPI / Swagger / GraphQL / Postman spec*. Register a spec, get tools.

Three feature highlights from `README.md:8-17`:

- **Dynamic API registration** — OpenAPI 3.x, Swagger 2.0, GraphQL introspection, or Postman Collections.
- **Five authentication methods for registered APIs** — None, API Key (header/query/cookie), Bearer Token, Basic Auth, OAuth2 Client Credentials. Per-user AES-256-GCM encrypted; master key in Azure Key Vault.
- **Tier-based limits** — Free / Pro / Enterprise, monthly quotas and registered-API caps.

The MCP server itself exposes only two tools to the model (`src/McpApi.Mcp/DynamicToolProvider.cs:38-50`):

- `ListAvailableApis` — what's registered for this user.
- `CallApi` — execute a registered endpoint by `(apiId, operationId, parametersJson)`.

That two-tool surface is the entire dynamic-dispatch trick. The host model sees those two tools always; behind them, *thousands* of REST endpoints (GitHub alone is 900+ — see `CLAUDE.md:170`) are reachable.

If MCP is the LSP-of-AI standard, **MCP-API is one of the productized servers that proves the standard works in practice** — and shows what hardening, multi-tenancy, secret management, and billing look like once you take an MCP server beyond `npx some-mcp-thing`.

## Why an applied-product profile in a standards study?

The other artifacts in this study are at the **standards / conventions / methodology** layer — wire protocols (A2A, MCP), file conventions (AGENTS.md, llms.txt), repo methodologies (OpenSpec, Spec Kit, GSD), service specs (Symphony), manifestos (12-Factor Agents). MCP-API is the only artifact at the **applied product** layer.

That makes it valuable in a different way:

1. **It demonstrates that MCP composes with real production constraints** — multi-tenancy, secret rotation, SSRF defense, OAuth, tiered billing, Cosmos DB document size limits, dynamic OpenAPI parsing of large surfaces (GitHub's 900+ endpoints).
2. **It surfaces the tradeoffs you only learn from shipping** — the split-storage pattern for documents bigger than Cosmos's 2MB limit, polymorphic JSON auth configs with discriminator-based deserialization, SSRF protection in front of every tool call.
3. **It shows what "a generic MCP server" looks like as a productized SaaS** — separate dashboard, separate REST API, separate MCP server binary, all coordinated through a shared Core library, all deployed as containers behind Azure DNS.

Read the [MCP profile](./Profile__Model-Context-Protocol.md) for *what the protocol commits to*; read this profile for *what one team did with it once they took it past the demo*.

## The product shape

The architecture diagram from `README.md:89-117` is small enough to reproduce in full because it's the whole product:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    src/web      │     │   McpApi.Api    │     │   McpApi.Mcp    │
│   (Next.js)     │────▶│  (REST API)     │     │  (MCP Server)   │
│                 │     │                 │     │                 │
│ • shadcn/ui     │     │ • JWT Auth      │     │ • Token Auth    │
│ • React Query   │     │ • Controllers   │     │ • Tool Provider │
│ • Tailwind CSS  │     │ • CORS          │     │ • Execute Calls │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                       │
                                 └───────────┬───────────┘
                                             │
                                ┌────────────┴────────────┐
                                │      McpApi.Core        │
                                │ • OpenAPI/GraphQL Parse │
                                │ • Auth Handlers         │
                                │ • Cosmos Storage        │
                                │ • Encryption            │
                                └────────────┬────────────┘
                                             │
                                ┌────────────┴────────────┐
                                │     Azure Cosmos DB     │
                                │  • users                │
                                │  • api-registrations    │
                                │  • api-endpoints        │
                                │  • tokens               │
                                │  • usage                │
                                └─────────────────────────┘
```

Three deployable surfaces, one shared library, one document store. Names visible in `src/`:

| Project | Role | Key concerns |
|---------|------|--------------|
| `src/web` | Next.js 14+ dashboard (App Router, shadcn/ui, Tailwind, React Query) | Public landing + auth + protected dashboard at `/apis`, `/tokens`, `/usage` |
| `src/McpApi.Api` | ASP.NET Core REST API | JWT auth, CORS, controllers for APIs/Tokens/Usage |
| `src/McpApi.Mcp` | MCP server binary | Token-based auth on startup, `DynamicToolProvider`, executes calls |
| `src/McpApi.Core` | Shared library | OpenAPI/GraphQL/Postman parsers, auth handlers, Cosmos store, encryption, HTTP client |

The clean separation matters: the **MCP server is a thin tool provider**. All the parsing, storage, auth, and encryption logic lives in `McpApi.Core` and is shared with the REST API. The MCP binary's job is "speak stdio, look up endpoints, execute calls, track usage."

## The four primitives

You can grok the product from four primitives.

### 1. `ApiRegistration` + `ApiEndpoint` — what's been registered

`CLAUDE.md:166-176`. A user registers an API by providing an OpenAPI spec URL. The flow:

1. User registers API via Web UI with OpenAPI spec URL.
2. `OpenApiParser` fetches and parses spec into `ApiRegistration` + `ApiEndpoint` models.
3. `CosmosApiRegistrationStore` saves metadata to `api-registrations` container and endpoints to `api-endpoints` container — *split storage for large APIs like GitHub with 900+ endpoints.*
4. MCP clients call `DynamicToolProvider` which looks up endpoints and executes via `DynamicApiClient`.

Supported source formats (`README.md:127-134`):

| Format | Support |
|--------|---------|
| OpenAPI 3.0/3.1 | Full |
| Swagger 2.0 | Full |
| GraphQL | Introspection-based |
| Postman Collection v2.1 | Full |

Pre-configured "well-known APIs" ship spec URLs for GitHub, Stripe, OpenAI, Slack, Twilio, Microsoft Graph, Spotify, Discord, Notion, and Cloudflare (`CHANGELOG.md:28`). Auto-discovery probes common locations (`/openapi.json`, `/swagger.json`, etc.) for spec endpoints.

### 2. `AuthConfiguration` — polymorphic per-API auth

`CLAUDE.md:208-214`. The auth config for any registered API is one of five concrete subtypes of an abstract base:

```
AuthConfiguration (abstract)
├── NoAuthConfig
├── ApiKeyAuthConfig         (header / query / cookie)
├── BearerTokenAuthConfig
├── BasicAuthConfig
└── OAuth2AuthConfig         (Client Credentials flow)
```

Discrimination uses a custom `AuthConfigurationConverter` with an `authType` JSON discriminator (`CLAUDE.md:210-211`). Falls back to `NoAuthConfig` if the discriminator is missing — handling legacy data.

The Cosmos integration has a load-bearing detail: `CosmosSystemTextJsonSerializer` is required because Cosmos DB defaults to Newtonsoft.Json, which doesn't handle the polymorphic discriminator properly (`CLAUDE.md:213-214`). This is the kind of one-line learning you only get from shipping.

Per-user secrets (API keys, tokens, OAuth client secrets) are encrypted with **AES-256-GCM** (`README.md:14`, `:166`). The master encryption key lives in **Azure Key Vault** (`README.md:17`). Each user's secrets are encrypted with a per-user key derived from the master — so a Cosmos compromise alone doesn't yield secrets.

### 3. `Token` — what the MCP server checks at startup

`README.md:148-155`, `src/McpApi.Mcp/IMcpCurrentUser.cs`. The MCP server isn't authenticated by per-request OAuth. It's a long-lived process that authenticates **once at startup**:

```bash
export MCPAPI_TOKEN="mcp_your-token-here"
dotnet run --project src/McpApi.Mcp
```

The token comes from the web UI at `/tokens` and identifies a single user. Every tool call in that MCP session is scoped to that user's registered APIs and tier limits. Tokens support optional expiration and can be revoked from the UI.

This is the practical answer to "how do you do auth for stdio MCP servers run by an end user." stdio has no per-request token surface; bake the identity into the env at process start.

### 4. `DynamicToolProvider` — the two-tool dynamic dispatcher

`src/McpApi.Mcp/DynamicToolProvider.cs`. The whole MCP server exposes **two tools**, regardless of how many APIs are registered (`DynamicToolProvider.cs:38-50`):

```csharp
[McpServerTool, Description("List all available API tools")]
public async Task<string> ListAvailableApis(CancellationToken ct = default) { ... }

[McpServerTool, Description("Execute a dynamic API call")]
public async Task<string> CallApi(
    [Description("API ID (e.g., 'github')")] string apiId,
    [Description("Endpoint operation ID")] string operationId,
    [Description("Parameters as JSON object")] string? parametersJson = null,
    CancellationToken ct = default) { ... }
```

The model sees `ListAvailableApis` and `CallApi`. It doesn't see GitHub's 900+ endpoints as 900+ tools. It calls `ListAvailableApis` to discover what APIs exist, then `CallApi("github", "repos/get", '{"owner":"foo","repo":"bar"}')` to invoke a specific endpoint.

Three implications worth naming:

- **Two-tool dispatch keeps tool-list payloads small.** If every endpoint were its own MCP tool, the host's tool description payload would explode. Two stable tools, dynamic discovery via `ListAvailableApis`.
- **The model needs to know about the indirection.** It can't pattern-match "GitHub's `repos/get`" to a tool in the canonical sense; it has to learn `CallApi` is the dispatcher.
- **Usage tracking happens before dispatch.** `CallApi` calls `_usageTracking.CheckAndRecordApiCallAsync(UserId, UserTier, ct)` *before* it does anything else (`DynamicToolProvider.cs:58`). A user past their tier limit gets a structured error, not a 402 from the upstream API.

## Multi-tenancy, billing, and tier limits

`README.md:170-177`. Three tiers:

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| API Calls/Month | 1,000 | 50,000 | Unlimited |
| Registered APIs | 3 | 25 | Unlimited |
| Endpoints/API | 50 | 500 | Unlimited |

The interesting product surface is `/usage` in the web UI (`README.md:177`) and the corresponding API endpoints (`CLAUDE.md:158-160`):

```
GET    /api/usage/summary       # Current month usage
GET    /api/usage/history       # Historical usage
```

Cosmos DB containers (per `README.md:111-117`):

- `users`
- `api-registrations` (partition key: `/id`)
- `api-endpoints` (partition key: `/apiId`)
- `tokens`
- `usage`

Billing is implicit in the tier feature comparison — there's no Stripe integration visible in this checkout. The current artifact is the limit-enforcement and usage-tracking infrastructure; payment/upgrade flows would compose on top.

### The Cosmos 2MB document limit and the split-storage pattern

`CLAUDE.md:178-184`. This is the single best example of an "only-by-shipping" learning in the codebase:

> Large APIs exceed Cosmos DB's 2MB document limit. The solution uses two containers:
>
> - `api-registrations` (partition key: `/id`) — API metadata without endpoints
> - `api-endpoints` (partition key: `/apiId`) — Individual endpoint documents
>
> When saving: `UpsertAsync` clears endpoints from registration, `SaveEndpointsAsync` batch-upserts endpoints separately.

GitHub's OpenAPI spec generates 900+ endpoint documents. Storing them inline in the registration document blows past Cosmos's 2MB. So the schema is split: the registration is metadata, the endpoints are individual documents partitioned by `apiId`. It's the textbook NoSQL design pattern, applied to a problem the team likely hit on day-N when they tried to register GitHub.

## Authentication — three layers

The product has three distinct auth surfaces. Don't conflate them.

### Layer 1 — User authentication (humans into the web app)

`CLAUDE.md:200-208`. **GitHub OAuth + JWT for session management:**

- Users authenticate via GitHub OAuth (no email/password — the web app delegates identity entirely).
- After OAuth callback, API issues a JWT access token (15 min, in-memory on frontend) + a refresh token (7 days, httpOnly cookie).
- Auto-refresh on 401 via an axios interceptor in `src/web/src/lib/api.ts`.
- New users are auto-created on first OAuth login.

This is GitHub-only at the moment. The `/api/auth/providers` endpoint is presumably extensible.

### Layer 2 — MCP server authentication (the binary identifying its user)

`README.md:148-155`. **`MCPAPI_TOKEN` environment variable**, generated from the web UI, validated on startup. One token = one user identity for the lifetime of the process. Tokens can have expirations and can be revoked.

### Layer 3 — Registered-API authentication (the platform calling upstream APIs on the user's behalf)

`README.md:158-167`. **Five auth methods**, per registered API, with secrets encrypted per-user:

| Method | Notes |
|--------|-------|
| No Auth | Public APIs |
| API Key | Header, query, or cookie placement |
| Bearer Token | JWT or opaque |
| Basic Auth | Username/password |
| OAuth2 Client Credentials | Full flow with thread-safe token caching and automatic refresh (`CHANGELOG.md:33`) |

OAuth2 client credentials is the only flow in scope; user-delegated OAuth (auth code) for upstream APIs is not — that would require per-user upstream credentials and a much wider consent flow.

## Security posture

`CHANGELOG.md:43-47`. The list is unusually concrete for a `1.0.0`:

- **SSRF protection** with comprehensive URL validation. Blocks private IPs, localhost, and cloud metadata endpoints (the 169.254.169.254 family). Every registered-API URL goes through this validation.
- **OAuth2 token caching** with thread-safe refresh.
- **Secure secret storage** via Azure Key Vault references (the master key never leaves Key Vault; per-user keys are derived).
- **URL-based hashing for unique API IDs** to prevent collision attacks.

The SSRF defense is non-negotiable for this product class: the platform's job is "execute HTTP requests on behalf of users," which is *exactly* the SSRF surface. Without comprehensive URL validation, registering an API with `http://169.254.169.254/...` would let any user pull the host's cloud-metadata credentials. `McpApi.Core/Validation/` is the directory where this lives.

## Infrastructure

`README.md:179-197`. The deployment story is fully Azure-native:

| Resource | What |
|----------|------|
| Domain | `mcp-api.ai` (Namecheap, DNS in Azure DNS) |
| DNS Zone | Azure DNS, resource group `parslee-rg` |
| Frontend | `mcp-web` Container App at `www.mcp-api.ai` |
| API | `mcp-api` Container App at `api.mcp-api.ai` |
| Database | Azure Cosmos DB |
| Secrets | Azure Key Vault |

DNS is in **Azure DNS** specifically so it can be managed programmatically via `az network dns record-set` (`CLAUDE.md:62-100`). The current records are listed verbatim in `CLAUDE.md:50-58`. Email is forwarded via Namecheap MX records.

Deployment is `az acr build` → `az containerapp update`. Two containers, two updates per release.

## What's actually inside this submodule

```text
mcp-api/
├── README.md                       # 282 lines — product pitch, quick start, infra
├── CLAUDE.md                       # 270 lines — agent-facing build/deploy/architecture guide
├── CHANGELOG.md                    # 59 lines — Keep-a-Changelog format, rename history
├── Dockerfile                      # API server image
├── McpApi.sln                      # .NET solution
├── LICENSE                         # MIT
├── CODE_OF_CONDUCT.md, CONTRIBUTING.md, SECURITY.md
├── src/
│   ├── McpApi.Api/                 # ASP.NET Core REST API
│   ├── McpApi.Core/                # Shared library
│   │   ├── Auth/                   # IAuthHandler, polymorphic AuthConfiguration types
│   │   ├── GraphQL/                # Introspection-based parser
│   │   ├── Http/                   # IApiClient, dynamic execution, SSRF validation
│   │   ├── Models/                 # ApiRegistration, ApiEndpoint, Token, etc.
│   │   ├── Notifications/
│   │   ├── OpenApi/                # OpenAPI 3.x / Swagger 2.0 parser
│   │   ├── Postman/                # Postman Collection v2.1 parser
│   │   ├── Secrets/                # AES-256-GCM, Key Vault integration
│   │   ├── Services/               # IUsageTrackingService, IJwtTokenService
│   │   ├── Storage/                # CosmosApiRegistrationStore, IRefreshTokenStore
│   │   ├── Utilities/
│   │   └── Validation/             # URL validation (SSRF defense)
│   ├── McpApi.Mcp/                 # MCP server (stdio)
│   │   ├── DynamicToolProvider.cs  # The two-tool dispatcher
│   │   ├── IMcpCurrentUser.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   └── web/                        # Next.js 14+ frontend
│       ├── src/app/                # App Router pages (auth, dashboard, apis, tokens, usage)
│       ├── src/components/         # shadcn/ui + landing + dashboard
│       ├── src/hooks/, lib/, providers/
│       ├── Dockerfile              # Frontend image (separate from root)
│       └── next.config.ts
└── tests/
```

If you only have time for four files: `README.md` (the pitch + architecture diagram), `CLAUDE.md` (the operational guide — build, deploy, DNS, configuration), `src/McpApi.Mcp/DynamicToolProvider.cs` (the entire MCP-side surface, ~150 lines), and `CHANGELOG.md` (read the security and infrastructure bullets — they're the "what does shipping this actually involve" list).

## How it composes with the rest of the study

The mental hookup is direct:

1. **The MCP standard** ([`Profile__Model-Context-Protocol.md`](./Profile__Model-Context-Protocol.md)) defines the *N+M* contract: any MCP-speaking host can use any MCP-speaking server.
2. **MCP-API is one of the M's** — and a particularly broad one, because it adapter-ifies *every REST API with an OpenAPI/Swagger/GraphQL/Postman spec*. Register the spec; the platform exposes it as MCP tools.
3. **The two-tool dispatch trick** (`ListAvailableApis` + `CallApi`) is what lets the platform scale to GitHub-sized surfaces without exploding the host's tool-list payload.
4. **Per-tenant secret encryption + tier limits + SSRF defense** are the production hardening that turns "a demo MCP server" into "a multi-tenant SaaS."

Read the MCP profile for the *N+M* claim. Read this profile for what "M = generic REST adapter, productized" actually involves.

## How to get started

### As an end user (use the SaaS)

1. Sign up at `mcp-api.ai` via GitHub OAuth.
2. Register an API via the dashboard — paste an OpenAPI URL or pick from well-known APIs (GitHub, Stripe, OpenAI, Slack, Twilio, Microsoft Graph, Spotify, Discord, Notion, Cloudflare).
3. Configure auth for the registered API (API Key / Bearer / Basic / OAuth2). Secrets are encrypted per-user.
4. Generate an MCP token at `/tokens`.
5. Configure your MCP client (e.g. Claude Desktop, Cursor, or any MCP-compatible host) to spawn the MCP server with `MCPAPI_TOKEN` set.

The MCP server is a stdio binary; in your MCP client config, point it at the `McpApi.Mcp` executable (or container) with the token in the env.

### As a self-hoster

`README.md:19-85`. Prereqs: .NET 9.0 SDK, Node.js 20+, Cosmos DB account (or emulator), optional Key Vault.

```bash
git clone https://github.com/Parslee-ai/mcp-api.git
cd mcp-api

# Configure Cosmos / KeyVault / JWT in src/McpApi.Api/appsettings.json

# Run the API server:
dotnet run --project src/McpApi.Api

# Run the frontend:
cd src/web && npm install && npm run dev   # http://localhost:3000

# Run the MCP server (after generating a token in the UI):
export MCPAPI_TOKEN="mcp_your-token-here"
export MCPAPI_COSMOS_CONNECTION_STRING="..."
export MCPAPI_MASTER_KEY="..."
dotnet run --project src/McpApi.Mcp
```

For Azure deployment, see `README.md:222-246` and `CLAUDE.md:36-48` — `az acr build` to push images, `az containerapp update` to deploy.

### As an MCP-API contributor

`CLAUDE.md` is the canonical reference. Key commands:

```bash
dotnet build                                                    # Build solution
dotnet test                                                     # Run tests
dotnet test --filter "GitHubApiRegistrationTests"               # Specific class
docker build -t mcp-api .                                       # API image
docker build -t mcp-web --build-arg NEXT_PUBLIC_API_URL=... src/web   # Frontend image
```

## Mental model for using it well

- **Two-tool dispatch is the whole reason this works.** Don't try to expose every endpoint as its own MCP tool — that breaks for any non-trivial API. Stable `ListAvailableApis` + `CallApi(apiId, operationId, parametersJson)` keeps the tool-list payload small and gives the model a discoverable indirection.
- **Tier limit checks must run before upstream calls.** `DynamicToolProvider.CallApi` checks usage *before* dispatching (`DynamicToolProvider.cs:58-72`). This is the difference between "user gets a clean error" and "user burns billable upstream API calls past their limit."
- **Polymorphic JSON in Cosmos requires `CosmosSystemTextJsonSerializer`.** The default Newtonsoft serializer doesn't handle discriminator-based polymorphism. This is a single-line config in `Program.cs` that took someone an afternoon to debug.
- **Don't store endpoints inline in the registration document.** Cosmos's 2MB doc limit will bite the moment you register GitHub. Split-container storage (`api-registrations` + `api-endpoints`) is the canonical answer.
- **SSRF defense is a hard requirement, not a nice-to-have.** A platform that takes user-supplied URLs and executes them is the textbook SSRF target. Every registered API's URL goes through `McpApi.Core/Validation/` *before* anything else.
- **Three auth layers, distinct.** User → web app (GitHub OAuth + JWT). MCP server → API (env-var token). Platform → upstream API (per-API config, encrypted per-user). Don't conflate them.
- **Per-user encryption with a Key Vault master key.** Secrets in Cosmos are never plaintext, and the master key never leaves Key Vault. A Cosmos breach alone yields ciphertext.
- **Date-based versioning isn't here, but Keep-a-Changelog is.** `CHANGELOG.md` follows Keep-a-Changelog + SemVer, with a clear `[Unreleased]` section tracking the AnyAPI → MCP-API rename.

## When NOT to reach for this

- **Single-API, in-house tool integration.** If you have one API and you control it, write a purpose-built MCP server. This product's value is generic dispatch across many APIs registered by many users.
- **You can't run on Azure.** The product is Azure-native — Cosmos DB, Key Vault, Container Apps, Azure DNS. Porting to AWS/GCP is feasible but non-trivial; the secret encryption and DNS plumbing in particular are tied to specific services.
- **You need user-delegated OAuth flows for upstream APIs.** The current OAuth2 support is Client Credentials only. User-delegated (auth code with PKCE) for upstream APIs would require a much broader consent surface and isn't in scope at v1.0.
- **You can't tolerate the two-tool indirection in the model.** Some hosts/models do better with fan-out (one tool per endpoint) for autocomplete-shaped UI. The two-tool dispatcher trades that for tool-list payload size — usually the right call, but not always.
- **Strict latency budgets.** Every tool call is: model → MCP server → REST API → upstream → back. The platform adds a hop. For sub-100ms latency requirements, this is the wrong layer.
- **You need a "no SaaS" deployment story.** This is a multi-tenant SaaS by design. Single-tenant self-hosting is possible (and the README documents it), but the multi-tenancy infrastructure is paid-for whether you use it or not.

## MCP-API vs. the other artifacts in this study — the position

MCP-API doesn't have a peer in this study; it's at a different layer than everything else. The clean way to position it:

| Artifact | Layer | What kind of artifact |
|----------|-------|------------------------|
| **MCP-API** | **Applied product** | Multi-tenant SaaS that productizes MCP for REST APIs |
| MCP | Process — agent ↔ tool | Wire protocol |
| A2A | Network — agent ↔ agent | Wire protocol |
| llms.txt | Website | File convention |
| AGENTS.md | Repository | File convention |
| OpenSpec / Spec Kit / GSD | Repository | Spec convention + tooling |
| 12-Factor Agents | App architecture | Manifesto |
| Symphony | Operations | Service spec + reference impl |

It is the **only entry where you can `git clone` and `docker run` the result and have a working SaaS at the end.** Everything else in the study is either the standard, the convention, or the methodology that products like this are built *against*.

The right way to read it in this study: as the **proof point for MCP**. The MCP profile makes the *N+M* claim; MCP-API is one of the *M*-side adapters that demonstrates the claim is real.

## One-line summary

> MCP-API wins by being the productized proof point for the MCP standard: a multi-tenant Azure-native SaaS (.NET 9 + Next.js 14 + Cosmos DB + Key Vault) that takes any REST API with an OpenAPI / Swagger / GraphQL / Postman spec and exposes it through a stable two-tool MCP dispatcher (`ListAvailableApis` + `CallApi`) — handling the tier-limited, per-user-encrypted, SSRF-defended, OAuth2-refreshing, Cosmos-2MB-split-storage operational reality that turns "a demo MCP server" into "a SaaS that scales to GitHub's 900-endpoint surface."

---
title: "Secrets for Collaborators Who Will Never Open a Terminal"
lede: "Collaborators who will never open a terminal still carry API keys — so serve capabilities from a remote MCP plane, secrets held server-side."
date_created: 2026-07-24
date_modified: 2026-07-25
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Fable 5
semantic_version: 0.0.0.6
status: Open
tags:
  - Exploration
  - Ai-Labs-Architecture
  - Secrets-Management
  - MCP
  - Didi-Platform
  - Id-Didi-Sh
  - Collaborator-Experience
  - Capability-Plane
site_uuid: d33ff596-1f7d-4d5d-813c-d7a6d299cb4b
hex_code: wzzb9e
date_authored_initial_draft: 2026-07-25
date_authored_current_draft: 2026-07-25
---

# Secrets for Collaborators Who Will Never Open a Terminal

## The question

How do secrets — API keys, database credentials, service tokens — reach the people who need them, when the people who need them are **smart, accomplished professionals who will not practically open a terminal, much less futz with code**? And how much of the classic secrets-management stack (vaults, rotation, manifests) do we actually need underneath whatever answer we pick?

This is not one project's problem. It is the *same* problem, wearing different clothes, in every ai-labs project of note:

| Project | Where it bites |
|---|---|
| **memopop-ai** | Multi-agent memo orchestration burns AI-provider keys; a collaborator running memo flows needs those calls authorized without ever seeing a key |
| **dididecks-ai** | Client-site engagements (and the cloud-variant question) put non-technical client collaborators inside deck workflows backed by credentialed services |
| **augment-it** | The Decile connector, SurrealDB canonical layer, and Firecrawl/Tavily research tools all run on tokens that today live in the operator's `.env` |
| **id-didi-sh** | Is itself the identity plane — and the most likely *implementation home* for the answer (see below) |
| **self-host-stack** (sibling tree) | Managed clients want Claude/GPT Desktop talking to their own Twenty CRM; the client-side constraint there surfaced this whole rabbit hole — see `self-host-stack/context-v/explorations/Per-Client-Self-Host-Stacks-Twenty-First-on-Railway.md` |

## Why Care?

The collaborator persona is worth stating precisely, because it disqualifies most of the industry's tooling on contact:

**They will:** click a link; sign in with Google; install a desktop app (Claude Desktop, GPT Desktop, 1Password); paste one value into one labeled settings field if the instructions have screenshots.

**They will not:** open a terminal; run a CLI; clone a repo; edit a JSON config file; export an environment variable; understand why a token "expired"; tell you it broke (they'll just quietly stop using the thing).

**And crucially — they often have a company card.** This persona routinely carries their own subscriptions: a ChatGPT seat, a Claude plan, maybe their own OpenAI or Anthropic API account expensed monthly. They are not credential-*poor*; they are terminal-poor. The design must accommodate people who can *pay for and own* keys but cannot *plumb* them — which makes "paste your key into a labeled field in a web dashboard" a first-class motion, distinct from anything involving files or shells.

**And they don't fail loudly — they ghost.** They are genuinely capable of doing setup: going and creating API keys, copy-pasting the right value into the right place. But the moment an instruction says "open a terminal and run this bash command" or "open your preferred text editor" — bam. Gone. Just ghosts. An email pulls focus, a meeting needs prep, and the setup tab quietly dies. There is no error report, no support ticket; there is a person who was ready to succeed and an instruction that assumed a different species of user.

A lot of AI tooling assumes everyone has a side hustle as a developer — same tools installed, same absence of fear. It isn't true. Maybe fifty million people on the planet know what "open your terminal" means. Everyone else checks email, looks at their calendar, uses native apps, and wastes time on Meta-shaped feeds. Those are the collaborators, and they are the market.

And the bar sits lower than "terminal": we still have trouble getting people who make $500K a year and hold an MBA to *use Markdown*. Tell them "it's in Markdown" and the honest, reasonable reply is: *"So… Word or Notion?"* — their document universe is exactly those two apps, and a format that is neither does not parse.

### Ground truth — six real collaborators, three clients

This persona is not hypothetical; as of July 2026 it is six specific people across three live clients (candid named profiles live in gitignored `context-v/extra/`, not here). Publish-safe archetypes:

| Archetype | The teaching detail |
|---|---|
| **VP of Advancement, nonprofit university, early 50s** | Raises money online all day; has plausibly never seen a terminal or git |
| **Visionary CEO, same org** | Brilliant, overcommitted, with gems buried in phone email — capture has to meet him in flow, on the phone, or not at all |
| **Managing Partner, VC, Harvard MBA** | Board seats and committees past counting; *used to code — 25 years ago*. Residual fearlessness, zero current tooling |
| **Collaborator between jobs, ex-corporate-venture** | Eager to help; does not know what "terminal" *or "docs"* means. The purest test: if `setup` works for her, it works |
| **PhD in computational biology, loves to tinker** | 90% of his time is phone calls. **Capability doesn't buy retention — time poverty beats skill poverty**, so the constraint holds even for the technical |
| **Legendary founder, knows everyone** | Also 90% on calls |

Three design facts these six establish, each a constraint the option space above must survive:

1. **All of them — all six — use desktop-native *and mobile-native* Claude or GPT.** Mobile was silently out of scope until now. On phones there is no config file, no local process, no fallback of any kind: **remote connectors aren't the best distribution channel, they're the only one that reaches half the actual usage.** This retroactively kills any residual "shipped local config" path for the client tier and adds mobile-app connector support to the desktop-parity spike (open question #1).
2. **Retention is the metric, not setup completion.** Even the collaborators who *could* be set up on Claude Code with a terminal have ~0% retention odds there. A path that survives onboarding but demands maintenance gestures (re-auth by config, token re-pasting, "just update the file") fails on week two instead of day one — same ghost, delayed.
3. **The capability plane must front hosted SaaS, not just self-hosted stacks.** One client runs on Decile Group's hosted CRM (not self-hosted) and may need *augmentation* — meaning the plane holds a third-party SaaS credential server-side and exposes capabilities over it, exactly the [[decile-hub-connector]]/augment-it seam. "Secrets for self-hosted apps" was always too narrow; the plane's real job is *any credentialed service a client org touches*.

### Every client is a mixed stack — there is no "self-host client"

An earlier draft of this thinking sorted the three clients into types (self-host consumer / VC workspace / SaaS augmentation). That taxonomy was a fantasy. In reality **each client has their own stack choices**, and every stack is a mix. CRM is the easiest place to see it: one client gets our self-hosted Twenty; another has a Streak instance that only the CEO uses; another runs on hosted Decile. Same client rosters also carry the apps we deploy for them. Self-hosted-by-us and proprietary-paid-by-them are *ingredient types present in every client's mix*, not client categories.

What makes the mix tractable is that **their proprietary tools all have APIs and API credentials** — and the persona's relationship to those credentials is precisely calibrated to what we've already designed:

- They **won't manage** API credentials — they won't remember how, and asking them to is a ghosting event.
- They **can go get them** — log into Streak or Decile, find the API-key page (agent-guided, one gesture per step), and **add the key somewhere** — a labeled field in the didi.sh admin UI.
- If that somewhere is **synced with the secret manager**, the plane holds the credential from that moment on.
- If **agent-skills for each service are accessed through MCP** (or context files), the collaborator's agent knows *how* to use Streak's API, Decile's API, and our self-hosted APIs the moment the credential lands.

The end state, stated plainly: **they just "talk to Claude" (or GPT) and reach both the self-hosted services we run for them and the proprietary stack they already pay for** — one connector, one conversation, the whole stack. The per-client stack definition therefore isn't "which apps we deployed"; it's the full roster of credentialed services in their working life, each entry pairing a server-side credential with an MCP-served skill for that service. Onboarding a new service to a client's plane = one paste by them + one skill by us. Which yields a clean formatting rule for everything this doc proposes: **raw Markdown is agent-food; humans get rendered surfaces.** The `setup` doc's fetchable `.md` rendition exists for Claude and GPT to consume; the human rendition is always a rendered web page (or a native-app screen) — never a file, never syntax, never "just edit the frontmatter."

Every secrets tool built for engineers assumes the first list is the second list. That assumption is the rabbit hole. Meanwhile these collaborators increasingly run Claude Desktop and GPT Desktop — both of which support **remote MCP connectors** added by URL with a browser-based sign-in. That's the one distribution channel whose UX gestures (click link, sign in) fall entirely inside what our persona will actually do — and both desktop apps must be supported from day one.

## Why we don't already know

Because "secrets management" conflates three problems that have different difficulty curves, and the tooling market only seriously addresses the first two:

1. **Storage & recovery** — where the canonical values live, what survives a lost laptop or a vanished deploy. Solved many times over; operator-tier problem.
2. **Rotation, audit, scoping** — leases, revocation, who-touched-what. Solved by the vault lineage; operator-tier problem.
3. **The terminal-free last mile** — getting a *working credential into a non-technical collaborator's hands* (or better: making that unnecessary). Essentially unaddressed. Every tool's answer is "the CLI" or "the dashboard," both of which fail the persona.

Prior ai-labs art danced around this without landing it: [[Shared-Auth-for-Applied-AI-Labs]] solved the *human login* version (invites over WhatsApp/1Password, no self-serve, no passwords — id-didi-sh shipped it), and [[Cloud-Variant-of-Dididecks-AI-Workspace]] hit the same persona from the "can't/won't install a desktop app" angle. Nobody has yet answered "and how does their AI tooling get credentialed?"

## The option space — storage layer (operator-tier)

Graded first on the operator story, then against the persona. Fuller per-option analysis for the self-host-stack client case lives in the sibling exploration; summarized here at ai-labs altitude:

### Option A — Gitignored `.env` per project + password-manager recovery

What we do today. **Operator:** fine, zero infra, matches monorepo doctrine. **Persona:** total failure — there is no version of "here's your .env" that works. Remains the operator-tier floor regardless of what else we build.

### Option B — SOPS/age encrypted-in-git

**Operator:** versioned secrets, key ceremony per collaborator. **Persona:** worse than A — it *adds* git to the pipeline the persona will never touch. Effectively disqualified across ai-labs; the ceremony taxes the fast-moving solo tier hardest.

### Option C — [OpenBao](https://openbao.org/) (Vault lineage, self-hosted)

**Operator:** real paths, leases, rotation, audit; API-first, so machine consumers (a capability plane) can fetch at runtime. **Persona:** irrelevant directly — no collaborator will ever see it — which is exactly right. A candidate *backing store*, never a distribution surface. Costs: an unseal ceremony and a new single point of failure we run.

### Option D — [Phase](https://phase.dev/) (self-hostable, app/environment-shaped)

Same slot as OpenBao with friendlier operator ergonomics: console UI, per-app/per-environment model that maps 1:1 onto our per-project + per-client shapes, CLI/SDKs, sync integrations, hosted tier as an on-ramp. **Persona:** same as C — invisible, correctly. Younger than the Vault lineage; the C-vs-D choice is a real bake-off, not a coin flip.

### Option E — [secretspec](https://github.com/cachix/secretspec) (declaration layer, not a store)

A `secretspec.toml` per project declaring *which* secrets each app actually reads, provider-agnostic. Attacks the `.env.example`-lies failure mode the monorepo has been burned by. **Persona:** invisible. Composes with any store; near-zero cost; probably adopt regardless.

### Option F — 1Password shared vaults as the distribution channel

Worth taking seriously because it's the *only* incumbent our persona already uses — and [[Shared-Auth-for-Applied-AI-Labs]] already leaned on it for invite delivery. **Operator:** shared vault per collaborator group, done. **Persona:** they can genuinely receive a value here. But then what? The value still has to be *pasted somewhere*, the somewhere is usually a config file, and we've re-derived the terminal. Verdict: legitimate **interim channel for the rare raw-value handoff**; not an architecture.

## The reframe — distribute capabilities, not secrets

The last-mile problem mostly dissolves if we stop trying to move secret *values* to collaborators and instead move **capabilities**: a remote MCP server, deployed by us, that holds every credential server-side and exposes authenticated tools ("query the corpus," "pull the CRM report," "run the memo flow"). The collaborator's Claude Desktop or GPT Desktop adds one connector URL and completes a browser OAuth sign-in. No terminal. No pasted tokens (or at worst, exactly one). No secret ever resident on a collaborator's machine.

What this buys, concretely:

- **Offboarding is revocation, not rotation.** A departing collaborator's access dies with their session/role. The underlying API keys don't need to rotate because they never left the server.
- **Blast radius shrinks to one revocable grant per person** instead of N raw keys per person per project.
- **The persona's two gestures suffice**: click link, sign in.
- **It generalizes past secrets.** The same plane can serve context-v files and agent-skills as MCP resources/prompts — the client-side "context plane" idea from the self-host-stack exploration is this same architecture with a different tenant.

## Setup itself must be agent-guided — docs for humans, context for agents

**We have to bridge that gap.** That's the stance, not an aspiration — and it names a deliverable class this doc would otherwise have missed: every setup path needs **both** normal documentation **and agent-context — setup instructions authored for the collaborator's own agent (Claude Desktop *and* GPT Desktop, native apps, day-one parity) to follow on their behalf.** Concretely: **`setup` is a named skill/context** that both native apps can access — the first entry in the capability plane's catalog, and the one every other capability depends on having worked.

The mechanics of why:

- If the persona has to read normal developer docs, **they won't finish setting up.** (See the ghosting dynamic above — the failure is silent and terminal.)
- If they ask Claude Desktop *"Help me set this up"* and Claude is following setup docs written *for Claude to follow*, **they will probably make it.** Claude issues one instruction at a time, in order, waits, verifies, and never says "open your preferred text editor" unless the docs do. The agent is the bridge across every instruction the persona can't execute — the human does only the motions they're genuinely good at (sign in, create the key, paste it in the labeled field), and the agent does the sequencing, judgment, and error recovery.

So setup content ships in **two renditions of one source of truth**:

1. **Human docs** — screenshots, labeled fields, short paths; the dignity-preserving fallback and the thing a client forwards to a colleague.
2. **The `setup` skill** — the same procedure authored as agent-followable instructions: explicit preconditions, one gesture per step, verifiable success criteria per step ("after pasting, the field shows •••• and a green check"), and recovery branches for the predictable failure modes. An agent-skill whose executor is the *collaborator's own* agent — Claude or GPT — not ours.

**The bootstrap wrinkle:** MCP-served context can't help with setting up the MCP connection itself. So `setup` ships in two slices: the **pre-connector slice** lives at a stable, publicly fetchable, agent-legible URL (markdown; the llms.txt discipline the monorepo already practices via the open-graph-share-seo-geo skill) that a collaborator hands to Claude or GPT Desktop by link; the **post-connector slice** is served by the plane over MCP as resources/prompts — the same tier already planned for context-v and agent-skills, of which `setup` is simply the first and most load-bearing entry.

This also quietly resolves a FullStackVC question from the sibling exploration: the public "take it and go" guide isn't a README — it's a fetchable agent-context doc whose acceptance test is Claude Desktop walking a stranger through it.

## Key ownership economics — flagged, deliberately not resolved here

The reframe answers *distribution* but quietly assumes the keys are **ours**. They won't always be, and whose card is behind a key turns out to have its own lifecycle:

- **Clients:** they use *our* API keys for as long as they're paying us, and stop when they stop. Key custody is part of the managed relationship; offboarding a client is revoking their grants against our keys, not untangling theirs.
- **Non-clients** (FullStackVC-style community, collaborators outside a paid engagement): they bring their own keys — which means they need **an admin UI in didi.sh where they can manage things for themselves and their organization**. Not a vault console, not a CLI: a didi-authenticated dashboard with labeled fields.
- **The individual → org migration:** in small organizations where people have expense accounts, everyone starts with *their own* accounts and keys. Then someone notices the aggregate spend, realizes a team account would reduce it, and the org wants **team-wide/org-wide keys**. Key ownership predictably migrates upward over an org's life, and the data model has to survive that migration without re-onboarding anyone.

### Workspaces as the scoping unit

didi.sh, augment-it, and memopop-ai already share the idea of **workspaces** — and workspaces could be flexible and nested. That makes the workspace, not the org or the person, the natural place a key *attaches*: a personal workspace carries a personal key; a team workspace carries the org-wide key; a nested workspace inherits from its parent unless it overrides. The individual→org migration above then becomes "move where the key hangs in the workspace tree," not a schema change. This interacts directly with open question #6 (scoping grammar) and is **not designed here** — flagged so neither the MCP plane nor the id-didi-sh spec forecloses it.

### The consequence worth stating now

The single MCP server that handles keys **will need account-management admin dashboards** — key entry, key visibility (masked), ownership moves (personal → org), grant management, and billing-adjacent views of who's consuming what. That is a real product surface, not an ops afterthought — and **id-didi-sh was created for exactly this kind of thing**: it is already the place a didi-authenticated human manages identity-adjacent state for themselves and their org. The admin UI belongs on the identity plane regardless of how the one-service-or-two fork (open question #2) resolves for the MCP endpoint itself.

### Why id-didi-sh is the likely implementation home

The single MCP server with secrets server-side is going to be key — and everything it needs for *auth* already exists in [[Didi-sh-One-Login-One-Agent-Three-Services]]'s identity plane, shipped as increment 1 of id-didi-sh:

- **Identity & session**: `didi_id` (UUIDv7), 30-day server-side sessions as the revocation authority, short-lived EdDSA tokens verified locally via JWKS — precisely the shape an MCP authorization layer wants to sit on.
- **Org & role model**: domain-as-id orgs with five roles — the natural scoping lattice for "which capabilities does this person get."
- **Invite-only onboarding, headless-first**: accounts created from inside the app that invited you — the same motion extends to "your workspace invited you; here's your connector."
- **One owned plane, not per-app auth**: the whole point of the two-planes doctrine. A secrets/capability plane bolted onto any single app would violate it; anchored on the identity plane, it serves memos, decks, augment-it, and self-host-stack clients equally.

Whether the capability plane lives *inside* the id-didi-sh service or as a **sibling service that authenticates against it** is an open fork (below) — but the identity anchor is not really in question.

## Open questions

1. **Custom-connector reality across four clients** (the binding constraint, shared with the self-host-stack exploration): which auth flows ChatGPT's desktop app accepts for custom remote MCP servers, whether resources/prompts surface in its UI or only tools — and now the same questions for **Claude mobile and ChatGPT mobile**, since all six real collaborators use the native mobile apps too (see *Ground truth* above). Claude Desktop is the easy quarter. Day-one parity means this spike gates the architecture; the matrix is 2 vendors × 2 form factors.
2. **One service or two — or one per client?** Colocate the capability plane inside id-didi-sh (one deploy, one owned plane, direct session access) vs. a sibling `mcp.didi.sh` that verifies didi tokens via JWKS like any other consumer (blast-radius separation — an MCP bug shouldn't be able to touch the identity store; independent scaling; keeps the identity service's contract small per its own spec discipline). New evidence from the self-host-stack side tilts toward a **third shape: one plane instance per client, deployed inside that client's own Railway project**, with identity staying central via JWKS. Colocation-per-client gets private-network access to the client's databases (no public TCP proxy, no internet-reachable Postgres — the phone reaches the plane over authenticated HTTPS while the DB stays dark), and it's what makes client-facing read/write/report database tools safe enough to contemplate. A central plane would need tunnels or public DB exposure to do the same job. Contract-level decision → belongs in the parent spec, per the id-didi-sh reminder doctrine.
3. **Backing store bake-off**: OpenBao vs. Phase behind the plane — or, at current scale, encrypted-at-rest in the plane's own database with the vault deferred until tenant count justifies it. Honest possibility: the vault is a year-two problem.
4. **OAuth surface**: MCP's authorization spec wants OAuth 2.1 semantics. id-didi-sh would grow authorization-server endpoints (or a token-exchange path from `didi_session` → MCP access token). How much of this both desktop clients *actually* exercise is part of spike #1.
5. **The residual raw-value channel**: some secrets must genuinely reach a human's clipboard (a key pasted into a third-party SaaS field). Does a didi-authenticated web page ("your keys, behind your login, with copy buttons and screenshots") cover it, or does 1Password remain that channel forever?
6. **Scoping grammar**: org → project → capability → (role) — is the existing five-role lattice enough, or do capabilities need their own grants? The workspaces idea (see *Key ownership economics* above) is the live candidate for the unit keys attach to — flexible, possibly nested, shared across didi.sh / augment-it / memopop-ai — but whether workspace becomes a first-class identity-plane concept is a contract question for the id-didi-sh spec.
7. **BYO-key custody**: when a non-client pastes *their* key into the didi.sh admin UI, what do we owe them — encryption posture, visibility (masked-after-entry?), export/delete on departure, and liability when their key is spent through our plane? Deliberately unresolved; must be answered before the non-client tier onboards.

## Findings

### 2026-07-25 — Connector matrix cell #1: Claude Desktop × Twenty native MCP (OAuth) = PASS

First real data point for open question #1, from the self-host-stack Phase 4
operator pilot (Michael's Claude Desktop → palmer-ai's self-hosted Twenty
v2.24.1 on Railway, `https://<instance>/mcp`):

- **The full OAuth dance works end-to-end**: discovery → RFC 7591 dynamic
  client registration → PKCE authorize (Twenty login in browser) → token →
  tool calls as the logged-in user. No API key, no config file, no terminal
  — the persona constraint is satisfiable TODAY for the Claude half.
- **Blocker found and fixed**: Twenty behind Railway's proxy advertised
  `http://` OAuth endpoints (Express not trusting `X-Forwarded-Proto`);
  Railway 301s http POSTs, which killed Claude's DCR with "Couldn't
  register with …'s sign-in service." Fix: `TRUST_PROXY=1` on the server.
  Lesson for the plane: **the OAuth discovery metadata must be
  https-perfect or clients fail with opaque errors** — check the
  `.well-known` output before blaming the client app.
- **Friction observed (verbatim operator experience)**: "I had to keep
  clicking over and over to authorize" — these were Claude Desktop's
  per-tool allow prompts (tool catalog / learn / execute each prompt on
  first use), NOT OAuth re-prompts. Mitigation: choose "Always allow."
  Client-facing docs must warn about this or the persona will interpret it
  as something being broken.
- **UX wrinkle**: a failed connector add leaves a dead entry; re-adding the
  same URL errors with "A server with this URL already exists" — the fix is
  clicking Connect on the EXISTING entry, which is not obvious. Docs
  updated accordingly.
- Still untested: Claude mobile (expected free via account-level
  connectors, unverified), GPT Desktop, GPT mobile — the remaining three
  cells of the 2×2 matrix (Phase 6 stub spike).

*(Still to be filled: GPT Desktop connector spike results; Elixir MCP ecosystem survey from the id-didi-sh side; OpenBao/Phase deployment notes.)*

## Tentative direction

1. **Adopt the reframe as the architecture**: collaborators get capabilities via a remote MCP plane anchored on didi identity; secret values live server-side, full stop. Raw-value distribution is the exception path, not the design.
2. **Operator tier stays boring on purpose**: gitignored `.env` + password-manager recovery, plus `secretspec.toml` manifests (Option E) adopted across ai-labs projects as the honest declaration of what each app reads.
3. **Defer the vault**: no OpenBao/Phase until the capability plane exists and tenant count hurts; run the C-vs-D bake-off then, with Phase's per-app model the ergonomic favorite and OpenBao the lineage favorite.
4. **Spike order**: (1) GPT Desktop + Claude Desktop remote-connector auth against a stub server — this gates everything; (2) the one-service-or-two fork, decided in the id-didi-sh parent spec; (3) first real capability end-to-end for one collaborator who has never opened a terminal, as the acceptance test.
5. **The acceptance test is the persona, agent-guided**: the exploration ends when a named non-technical collaborator, given nothing but a link, asks Claude Desktop "Help me set this up," completes the connector setup with Claude following our agent-context docs, and uses one credentialed capability — zero operator hand-holding, zero terminals, zero ghosting.
6. **Admin dashboards are on the roadmap the moment the plane is**: key management for people and orgs (entry, masked visibility, personal→org ownership moves, grants) is a required product surface of the capability plane, homed on id-didi-sh, with workspaces as the candidate attachment unit. Flagged here deliberately without design — see *Key ownership economics* above.

Implementation-local notes live in `id-didi-sh/context-v/explorations/Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane.md`; contract changes flow to `[[../specs/Id-Didi-Sh-Identity-Service]]` first, per that repo's standing reminder.

## Outcome

*(Open. Expected forks: a capability-plane section or amendment in the id-didi-sh spec; a spike log for the desktop-connector auth question; possibly a shared blueprint once the pattern serves both ai-labs collaborators and self-host-stack clients.)*

## Related

- [[Didi-sh-One-Login-One-Agent-Three-Services]] — the two-planes doctrine this extends
- [[Shared-Auth-for-Applied-AI-Labs]] — the human-login half of the same persona problem
- [[Cloud-Variant-of-Dididecks-AI-Workspace]] — the same persona hit from the installation angle
- [[Remote-Mount-Contract-for-In-App-Agent]] — the in-app agent seam a capability plane would eventually feed
- `self-host-stack/context-v/explorations/Per-Client-Self-Host-Stacks-Twenty-First-on-Railway.md` — the client-tier sibling exploration that surfaced this rabbit hole
- `id-didi-sh/context-v/explorations/Serving-Secrets-Server-Side-as-an-MCP-Capability-Plane.md` — implementation-local notes

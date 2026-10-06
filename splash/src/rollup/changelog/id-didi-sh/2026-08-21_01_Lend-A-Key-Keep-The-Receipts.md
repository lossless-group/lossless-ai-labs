---
date_created: 2026-08-21
date_modified: 2026-08-21
title: "Lend a key, keep the receipts"
lede: "Paste an API key, lend it to a project you're not on, and watch what it pays for. Borrowers spend it; they never see it."
publish: true
date_authored_initial_draft: 2026-08-21
date_authored_current_draft: 2026-08-21
date_work_started: 2026-08-20
date_work_completed: 2026-08-21
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
site_uuid: 5e3aaae3-bd32-4eac-aba9-d6e403642773
hex_code: ai88jr
files_changed:
  - priv/repo/migrations/20260820000003_create_credentials.exs
  - priv/repo/migrations/20260821000001_app_tokens.exs
  - lib/id_didi_sh/vault.ex
  - lib/id_didi_sh/encrypted/binary.ex
  - lib/id_didi_sh/credentials.ex
  - lib/id_didi_sh/credentials/credential.ex
  - lib/id_didi_sh/credentials/cascade.ex
  - lib/id_didi_sh/credentials/loan.ex
  - lib/id_didi_sh/credentials/usage.ex
  - lib/id_didi_sh/entities.ex
  - lib/id_didi_sh/accounts.ex
  - lib/id_didi_sh/accounts/app.ex
  - lib/id_didi_sh_web/controllers/credential_controller.ex
  - lib/id_didi_sh_web/controllers/resolve_controller.ex
  - lib/id_didi_sh_web/live/keys_live.ex
  - lib/id_didi_sh_web/plugs/require_app.ex
  - lib/id_didi_sh_web/plugs/put_didi_token.ex
  - assets/vendor/topbar.js
tags:
  - Progress-Update
  - Identity-Service
  - BYOK
  - Credentials
from: "id-didi-sh"
from_path: "changelog/2026-08-21_01_Lend-A-Key-Keep-The-Receipts.md"
---
## Why Care?

The person holding the credit card is frequently not on the project.

That sentence is the whole feature. A partner expenses the OpenAI account; the analysts who actually burn the tokens were added to the workspace last week and will rotate off next month. The usual answers are all bad: paste the key into a shared doc, put it in an env var somebody screenshots, or add the partner to a project they have no business being in just so the billing works.

didi.sh now has a third answer. You paste a key once, lend it to one or more places, and the people in those places can *spend* it without ever being able to *read* it. When you want it back, you take it back — from everywhere at once, or from one place while the others keep working. And the whole time, you can see exactly what your card paid for and who spent it.

The distinction between spending and reading is the part worth dwelling on. A borrower is a human, and a human never sees the value. Only a registered server-side app can resolve a credential to plaintext, and it has to prove it is itself to do it. The moment a borrower can read the key, lending has quietly become giving, and giving is not a thing you can take back.

## What's New?

- **Credentials, encrypted at rest.** AES-256-GCM via `cloak_ecto` behind `IdDidiSh.Vault`. Create, list, revoke.
- **Lending cascades.** One act of lending names several entities at once — an organization, a workspace, a project — creating one cascade and one loan per entity. Pull the key from all of them, or from one, leaving the rest live.
- **Admin earned by lending.** `effective_role/2` returns `:admin` for anyone with a live loan, membership row or not.
- **A resolve path for apps.** `POST /resolve` is the one route that returns plaintext, and it rejects browsers outright.
- **A meter.** Every use is recorded. Usage is owner-only — not even an entity admin can read it.
- **A surface a human can actually use.** `KeysLive` at `/keys`: paste, lend, watch, take back. No terminal required.
- **Cap enforcement.** Exceeding a cap returns `402`, the one status code that means precisely this.

The suite went from 55 green to 97.

## How it works

Four tables — credentials, cascades, loans, usage — and one query that decides liveness.

A loan is live only if the loan has not ended, its cascade has not ended, the cascade has not expired, and the credential is not revoked. Four independent ways to die, joined once, so no caller can forget a condition it never sees. Revoking a credential therefore ends access everywhere without touching a single loan row.

```
person ──owns──> credential ──cascade──> loan ──> entity
                     │                              │
                     └────── usage ─────────────────┘
                        (owner-only meter)
```

Title never moves. You cannot lend a key you do not own, and only the lender may end a cascade or a loan. An entity admin confiscating someone's credential is not a state this model has.

**Revocation keeps the row.** Deleting a credential would orphan its usage history, and that history is the lender's record of what their card paid for — the thing that makes leaving a key in place reasonable rather than an act of faith. The key stops working; the evidence stays.

## Under the Hood

**The gate is asserted the hard way.** Rather than trusting the Ecto type, the test reads the raw SQLite column with `Repo.query` — bypassing the layer that would decrypt it — and confirms the secret is not in those bytes. A second test JSON-encodes a rendered list and asserts neither of two secrets appears anywhere in the serialized response.

**`render/1` is an allowlist, not a blocklist.** It is built by naming safe fields rather than dropping unsafe ones, so a column added later is invisible until someone deliberately exposes it. An allowlist hides by default; a blocklist leaks by default, and this is the field where that difference is the entire point.

**`RequireApp` rejects rather than ignores.** It does not merely disregard a session cookie — it refuses the request with `app_credential_required`. A test sends both a valid app token *and* a valid session cookie and asserts `403`. If a browser could reach the resolve path just by carrying a cookie, the invariant would be broken by the transport rather than by anyone's intent.

**Apps gained a credential.** The `apps` table was a registry for validating redirect prefixes with no secret in it. Server-to-server calls need an app to prove it is itself, so the raw token is shown once and only its SHA-256 hash is stored — the same discipline `login_tokens` already uses. Re-issuing replaces the old token, which doubles as revocation.

**Ambiguity gets logged, not guessed silently.** Two live loans for the same provider on one entity is a genuine ambiguity a human created, and there is no hierarchy to resolve it. `resolve/4` takes the most recently lent and emits a warning.

**Consequences are named in the API, not just the UI.** Lending returns a notice saying out loud: this lends to everyone in these entities, *including anyone added later*. Putting it in the API means every client says it — including clients nobody has written yet. Same reasoning as the removal disclosure.

**Errors are sentences.** `humanize/1` turns `:label_required` into "Give it a name so you can tell it apart later," and a test asserts the atom never reaches the page.

**Partial and full withdrawal are separate routes**, not one route with a flag. Taking a key back from everywhere and taking it back from one place are different intentions, and they should be hard to confuse at three in the morning.

## The bug that had been sitting there for six weeks

`/keys` rendered beautifully and then ignored every click. A credential "saved" through the UI never reached the database.

The server log had it the whole time: `no route found for GET /assets/js/app.js`. Without the bundle, LiveView never connects — the page renders once server-side and dies. Every LiveView was a photograph.

The breakage predates this work entirely. `mix assets.build` had been failing since **2026-07-06** with `No matching export in vendor/topbar.js for import default`. Nobody noticed because nothing needed JavaScript until now. Headless JSON endpoints and a static `/access` page do not. This LiveView was the first thing that did.

The fix took two attempts, and the second only surfaced in a browser. Adding `export default window.topbar` made the build succeed and the asset serve `200` — which looked like a fix and was not. The vendored IIFE ends `.call(this, ...)`, and in an ES module top-level `this` is `undefined`, so `this.topbar = topbar` threw at runtime. Binding the IIFE to `window` fixes it properly.

**A passing build and a `200` response were both true and both insufficient.**

Why the existing tests were blind: `LiveViewTest` drives the server directly, calling `handle_event` in Elixir with no browser, no bundle, and no websocket. It proves the server half and is *structurally unable* to see whether a browser can reach it. The tests were not wrong — they were testing one layer. Which is exactly what the monorepo's browser-drive doctrine exists to cover, and which got skipped before a URL was handed over.

So it was verified the way it should have been the first time: sign in, paste a key, open the lend panel, tick two places, confirm, then check the database. The credential persisted, the cascade created loans to two entities, and `effective_role` returned `:admin` on exactly those two while the third stayed `org_owner`.

A smoke test now asserts `app.js` exists and is not suspiciously small. It does not replace a browser drive — it catches the cheapest version of this failure for two assertions.

## What's Next

- **Not deployed.** This is local only, deliberately. The storage plan gates credential storage on the Turso cutover so no lent credential is ever written to the unreplicated Fly volume. Writing the code does not breach that; deploying it would.
- The **splash and the app still look like different products** — the splash wears the credential design system, the Phoenix app is stock generator output. Tracked in `[[Bring-The-Spike-Under-The-Credential-Design-System]]`.
- An **aggregate usage view for entity admins** could be added if anyone wants one. Owner-only was chosen as the recoverable mistake.

## References

[^ai88jr]: [[2026-08-21_01_Lend-A-Key-Keep-The-Receipts]]

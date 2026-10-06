---
title: "Loop log — entities and keys"
lede: "One entry per increment: the gate, the result, and anything decided that the plan did not cover."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
tags:
  - Loop
  - Id-Didi-Sh
  - Entities
site_uuid: 7f2c4d81-3ba6-4e19-9c02-1d5e8a3f6b47
hex_code: lp4vnz
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
publish: false
from: "id-didi-sh"
from_path: "context-v/loops/Entities-and-Keys.md"
---
# Loop log — entities and keys

Plan: [[Entities-and-Keys-Implementation-Plan]]. Contract:
`ai-labs/context-v/specs/Flexible-Entity-Relationships-to-Mirror-Messy-IRL-Collaboration.md`.

## Increment 1 — entities schema + context — ✅ PASSED 2026-08-20

**Built:** migration `20260820000001_create_entities`, `IdDidiSh.Entities`
context, `Entity` / `EntityMembership` schemas, `mix id.entity`, 10 tests.

**Gate:** `mix test` green and `mix id.entity` creates an entity and adds a
member. Both observed — suite went 29 → **39 passed**, and against the dev DB:

```
entity 01a0228e-80c9-7725-9f2f-c6f354476acc  project/apollo  Apollo Program
mps@didi.sh is editor in project/apollo
```

**Invariant tests now in the suite:**
- `entities have no parent_id` — a schema assertion, so a future migration
  adding containment fails loudly (Ruling 1)
- `removing a member from one entity leaves other memberships intact` — both
  directions (Ruling 1b)
- `also_member_of/2 powers the removal disclosure`

**Decided in flight, not in the plan:**

1. **`effective_role/2` is membership-only for now, with no lender stub.** The
   plan implied a `lender?` helper returning false until increment 4. Elixir
   1.20's type checker correctly flagged the resulting branch as dead. A stub
   that always returns false lies to both the reader and the compiler, so the
   function is honestly membership-only with a comment marking where increment 4
   slots in.
2. **`mix id.entity` deliberately has no `remove` verb.** Removal must show what
   access survives (Ruling 1b), which is a conversation, not a one-liner. It
   belongs in the API and the LiveView, not a mix task that would let an operator
   remove someone while blind.

**Not done, deliberately:** HTTP endpoints (increment 2).

## Increment 2 — entity HTTP endpoints — ✅ PASSED 2026-08-20

**Built:** `IdDidiShWeb.Plugs.RequireUser`, `EntityController`, six routes under
an `:api_authed` pipeline, 10 controller tests. Suite 39 → **49 passed**, clean
compile.

**Gate:** `DELETE /api/entities/:entity_id/members/:didi_id` returns
`also_member_of`, and removal from one entity leaves the others intact. Both
asserted, including the DB-level check that the surviving membership is really
still there rather than merely reported.

**Decided in flight:**

1. **The disclosure ships as a rendered sentence, not just data.** The response
   carries `also_member_of` (the list) *and* `disclosure` — "Bob will keep access
   to: Apollo, Q3 Diligence." If every client composes its own sentence, some
   client eventually omits it. Putting the words in the API makes the honest
   thing the default.
2. **Survivors are read BEFORE the delete**, so the response describes the world
   the caller is creating rather than racing it.
3. **Auth extracted to a plug.** `MeController` does the three-step check inline
   (token → live session row → user). Copying that per action is how one endpoint
   quietly loses the session-row check, so `RequireUser` does it once.
4. **Creator becomes `org_owner`** of what they create — otherwise an entity is
   born with nobody able to administer it. Note the vocabulary strain: `org_owner`
   on a *project* reads oddly (plan OQ 2, still open).
5. **Adding a non-existent user returns `unknown_user_invite_not_implemented`**
   rather than half-creating something. The invite path through `login_tokens`
   exists but is not wired to entities; named explicitly so it is not mistaken for
   a bug.

**Not done, deliberately:** `PATCH /api/entities/:id` (no caller yet), and
`GET /api/users/:didi_id/entities` — `also_member_of` already covers the
disclosure, and a general "where is this person" endpoint wants an authorization
story of its own.

## Increment 2b — invite by email — ✅ PASSED 2026-08-20

Not in the original plan. Added because increment 2 shipped a limitation
(`unknown_user_invite_not_implemented`) and the machinery to close it already
existed: `login_tokens` carries `kind ∈ magic_link | invite`, and the Resend
adapter is wired.

**Built:** migration adding `login_tokens.entity_id`; `Accounts.issue_invite/2`
and `redeem_invite/1`; `InviteNotifier`; `AccessController` redeeming either
token kind; `EntityController.add_member` inviting when the email is unknown.
Suite 49 → **55 passed**.

**Gate:** invite an unknown email → 202 + mail from `no-reply@didi.sh` → redeem
→ account created **and** membership attached. Asserted end to end, including
that the invite is single-use.

**Decided in flight:**

1. **202, not 201, for an invite.** Adding someone who has never heard of
   didi.sh is not a failure and must not read like one — but it has not happened
   yet either. A 201 would claim a member who cannot sign in.
2. **One landing page, two token kinds.** `/access` tries magic-link then
   invite. The person clicking cannot tell which they hold, so the page must not
   care. Both claims are atomic in their own query, so trying one then the other
   cannot double-claim.
3. **Invite TTL is 7 days**, against 15 minutes for a magic link. An invite is
   often read days later; a sign-in link is used immediately.
4. **Membership attachment is recorded either way** — `invite_membership_attached`
   or `invite_membership_failed` in `auth_events`. A person stranded outside the
   thing they were invited to should leave a trace rather than a silence.
5. **Delivery failure does not lose the invite.** The token row exists whether or
   not the mail sends; the response says `queued_delivery_failed` so an operator
   can resend rather than wonder.

**Stale comment corrected:** `MagicLinkNotifier` said the sender must stay
`onboarding@resend.dev` until didi.sh was verified in Resend. It is verified —
self-host-stack already sends client mail from `no-reply@didi.sh`.

## Increment 3 — credentials, encrypted at rest — ✅ PASSED 2026-08-20

**Built:** `cloak_ecto` + `IdDidiSh.Vault` (AES-256-GCM) + `Encrypted.Binary`
type; migration `20260820000003_create_credentials` with all four tables
(`credentials`, `credential_cascades`, `credential_loans`, `credential_usage`);
`IdDidiSh.Credentials` create / list / revoke; 12 tests. Suite 55 → **65 passed**.

**Gate:** a credential round-trips, and the raw value appears in no API response.
Asserted the strong way — by reading the raw SQLite column with `Repo.query/2`,
bypassing the Ecto type that would decrypt it, and confirming the secret is not
in those bytes. Also asserted that a rendered list, JSON-encoded, contains
neither of two secrets.

**Decided in flight:**

1. **`render/1` is built by naming safe fields, not by dropping unsafe ones.** A
   future column is invisible until someone adds it to the serializer — the
   failure direction you want. A blocklist leaks by default; an allowlist hides
   by default.
2. **Revocation keeps the row.** Deleting a credential would orphan its
   `credential_usage` history, and that history is the lender's record of what
   their card paid for. The key stops working; the evidence stays.
3. **Only the owner may revoke** — `{:error, :not_the_owner}` otherwise. It is
   their key, and an entity admin taking it back is not a thing that can happen.
4. **Short values mask entirely** (`····`) rather than showing four of six
   characters.
5. **The dev/test encryption key is deterministic**, so the suite needs no
   environment setup, and `Vault.init/1` raises in prod when
   `CREDENTIAL_ENCRYPTION_KEY` is missing. The fallback is unreachable where it
   would matter.
6. **All four tables landed in one migration**, per the plan, even though
   increment 3 only uses `credentials`. The lending tables arrive in increment 4
   with no further schema change.

**Not shipped:** this is local only. Per
[[Storage-and-Backups-for-id-didi-sh]], increment 3 must not reach production
before the Turso cutover, so no lent credential is ever written to the
unreplicated Fly volume. Writing the code does not breach that; deploying it
would.

## Increment 4 — lending: cascades, loans, derived admin — ✅ PASSED 2026-08-20

**Built:** `lend/4`, `end_cascade/2`, `end_loan/3`, `live_loans_for_entity/1`,
`lender?/2`, `entities_lent_to/1`; `Entities.effective_role/2` now returns
`:admin` for live lenders; 11 tests. Suite 65 → **75 passed**.

**Gate:** lending to three entities in one act creates **one cascade and three
loans**, the lender is `:admin` in all three **with no membership row anywhere**
(asserted with `refute get_membership/2`), ending the cascade removes admin
everywhere at once, and ending one loan leaves the others live. All four
observed.

**Closed an issue rather than deferring it.**
`also-member-of-Will-Miss-Lenders.md` predicted the removal disclosure would
under-report once lending conferred access. It would have. Fixed in the same
increment that created the risk: `list_entities_for/1` and `also_member_of/2`
now union memberships with entities the person lends to, with a test asserting
that removing Bob from Acme discloses he still reaches Apollo *by lending*.
Issue deleted.

**Decided in flight:**

1. **"Live" is one query, not four scattered checks.** A loan is live only if
   the loan has not ended, its cascade has not ended, the cascade has not
   expired, **and** the credential is not revoked. Four independent ways to die,
   so `live_loans_for_entity/1` joins all of it once. Callers cannot forget a
   condition because they never see them.
2. **Revoking a credential ends access without touching loan rows.** The join
   handles it, so history stays intact — you can still see what was lent to whom
   before the key was pulled.
3. **You cannot lend a key you do not own** (`:not_the_owner`), and only the
   lender may end a cascade or loan (`:not_the_lender`). Title never moves; an
   entity admin cannot confiscate.
4. **Cap terms are stored but not enforced yet** — enforcement is increment 6,
   with the metering. Storing them now means no schema change then.

**Not done:** `wind_down_until` is stored and ignored (plan OQ 5 — decide whether
v1 honours it or drops the column).

## Increment 5 — resolve, and the meter — ✅ PASSED 2026-08-21

**Built:** `apps.token_hash` migration + `App` schema; `Accounts.issue_app_token/1`
and `authenticate_app/1`; `Plugs.RequireApp`; `Credentials.resolve/4`,
`record_usage/2`, `spend_in_period/1`, `usage_for_credential/1`;
`POST /api/internal/resolve`; 9 tests. Suite 75 → **83 passed**, first run.

**Gate:** a registered app resolves a key and a `credential_usage` row appears
with the right entity, calls and cost. Observed.

**The test that matters most:** a request carrying BOTH a valid app token and a
valid user session cookie is **rejected with 403**. Ruling 3's invariant is that
a human borrower never sees a value; if a browser could reach this by carrying a
cookie, the invariant would be broken by the transport rather than by anyone's
intent. So `RequireApp` does not merely ignore the cookie — it refuses the
request and says why.

**Decided in flight:**

1. **`apps` gained a credential.** It was a registry for validating redirect
   prefixes, with no secret. Resolving is server-to-server, so an app now proves
   it is itself: raw token shown once, SHA-256 hash stored, same discipline as
   `login_tokens`. Re-issuing replaces the old token, which is also how you
   revoke.
2. **Cap enforcement landed here rather than in increment 6.** `resolve/4` is
   the only place spend occurs, so checking the cap anywhere else would be
   checking it somewhere it cannot be enforced. Increment 6 keeps the reporting
   half.
3. **Ambiguity is logged, not hidden.** Two live loans for the same provider on
   one entity is a genuine ambiguity a human created — there is no hierarchy to
   resolve it (Ruling 1). Takes the most recently lent and emits a warning.
4. **`no_live_loan` carries a `detail` a human can act on** — "Ask someone to
   lend one." The caller is a program relaying this to a person.
5. **Cap exceeded returns 402 Payment Required**, which is the one status code
   that means exactly this.

**Not done:** `usage_for_credential/1` exists but no endpoint exposes it — that
is increment 6, along with deciding who may read it (issue: plan OQ 4).

## Increment 6 — the lender's surface — ✅ PASSED 2026-08-21

**Built:** `CredentialController` with seven routes — paste, list, revoke, lend
(cascade), pull cascade, pull one loan, usage; 8 tests. Suite 83 → **90 passed**.

**Gate:** the value appears in no response body — asserted over the raw
serialized response for create, list AND usage, not over the struct. `last_four`
comes back so a human can tell two keys apart.

**Decided in flight:**

1. **Usage is OWNER-ONLY** — plan OQ 4, decided. Not even an entity admin can
   read it, and there is a test asserting that. The meter answers *"what is my
   card paying for, and for whom"*; showing per-caller detail to an entity admin
   would tell them who used what without those people having agreed to it. An
   aggregate view for admins can be added if someone actually wants it — the
   narrower default is the recoverable mistake.
2. **Lending returns a `notice` naming the consequence:** *"This lends to
   everyone in 3 entities, including anyone added later."* Ruling 2b requires the
   lending UI to say this out loud; putting it in the API means every client
   says it, including ones nobody has written.
3. **Partial withdrawal and full withdrawal are separate routes**
   (`DELETE /cascades/:id/loans/:entity_id` vs `DELETE /cascades/:id`) rather
   than one route with a flag. Taking a key back from everywhere and taking it
   back from one place are different intentions and should be hard to confuse.

**Not done:** no LiveView yet (increment 7). Everything a lender does is
reachable over HTTP, but a human still needs a client to do it.

## Increment 7 — a human lends a key without a terminal — ✅ PASSED 2026-08-21

**Built:** `KeysLive` at `/keys`, `Plugs.PutDidiToken` (cookie → session bridge
so a LiveView can see who is connected), 5 tests. Suite 90 → **95 passed**.

**Gate:** a human pastes a key and lends it to two places, entirely in a browser.
Driven through the real LiveView — form submit, click the lend button, tick two
checkboxes, confirm — then asserted that the lender is `:admin` in both by
lending.

**Found a product bug while testing.** The flash message renders in the app
layout, and this LiveView has no layout — so a failed paste showed the user
**nothing at all**. The test caught it because the assertion looked for the
sentence rather than for a status code. Fixed by rendering flash inside the
LiveView itself, which is where it belongs for a standalone screen.

**Decided in flight:**

1. **The value is write-only in the UI too** — no reveal toggle, no masked
   echo. `last_four` is the only hint, and a test asserts the secret never
   appears in the rendered page. A reveal button would be the obvious feature
   request and the wrong answer: the moment a borrower can read it, lending has
   become giving.
2. **Errors are sentences, not atoms.** `humanize/1` maps every failure to
   something a person can act on — *"Give it a name so you can tell it apart
   later"* rather than `:label_required` — with a test asserting the atom does
   NOT appear.
3. **The lending consequence is rendered before the confirm button is
   reachable**, and only once at least one place is selected. Ruling 2b as
   markup rather than as a comment.
4. **Cookie → session bridge rather than a custom socket auth.** The token is
   already a signed JWT; putting it in the Plug session adds no new trust and
   avoids a second authentication path to keep correct.

**Remaining:** increment 8 — first real use end to end. And the Turso cutover
still gates deploying any of the credential work.

## Increment 7b — the asset build was broken, and the tests could not see it

**Found by the operator clicking the thing**, which is the wrong way to find it.

`/keys` rendered and then ignored every click. The credential he "saved" never
reached the database. Server log showed the cause:
`no route found for GET /assets/js/app.js` — the bundle was never built, so
LiveView never connected and the page was a photograph.

**Root cause, and it predates this work:** `mix assets.build` has been FAILING
since `3e9f90e` (2026-07-06, the walking skeleton) with
`No matching export in "vendor/topbar.js" for import "default"`. Nobody noticed
because nothing needed JavaScript until now — headless JSON and a static
`/access` page do not. This LiveView is simply the first thing that did.

**Why 95 green tests said nothing.** `LiveViewTest` drives the server directly:
`render_submit/1` calls `handle_event/3` in Elixir. No browser, no bundle, no
websocket. It proves the server half and is structurally blind to whether a
browser can reach it. The tests were not wrong; they were testing one layer.

**The fix took two goes, and the second only appeared in a browser:**

1. Added `export default window.topbar` — the build then succeeded and the asset
   served 200. Looked fixed. **Was not.**
2. The browser threw `TypeError: Cannot set properties of undefined (setting
   'topbar')`. The vendored IIFE ends `.call(this, …)`, and in an ES module
   top-level `this` is `undefined`, so `this.topbar = topbar` explodes at
   runtime. Bound it to `window` explicitly.

A passing build and a 200 response were both true and both insufficient. Only
executing the page caught it.

**Verified by browser drive** (Playwright, per the monorepo's Browser-Drive
Verification doctrine): signed in, pasted a key, opened the lend panel, ticked
places, confirmed — then checked the database. Credential persisted, cascade
created loans to Acme and Q3, `effective_role` returned `:admin` on exactly
those two while Apollo stayed `org_owner`.

**Guardrail added:** `test/id_didi_sh_web/assets_built_test.exs` asserts
`app.js` exists and is not suspiciously small. It does not replace a browser
drive; it catches the cheapest version of this for two assertions. Suite 95 →
**97 passed**.

**The process lesson, recorded because it is the real one:** the doctrine says
drive a browser BEFORE asking a human to walk the surface. I handed over a URL
having never loaded the page. The operator became the test harness.

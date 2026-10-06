---
date_created: 2026-08-23
date_modified: 2026-08-23
title: "First example of event diary share"
lede: "The site said one login and had nowhere to perform one. Now there is a sign-in, and an account page you can actually act on."
publish: true
date_authored_initial_draft: 2026-08-23
date_authored_current_draft: 2026-08-23
date_work_started: 2026-08-23
date_work_completed: 2026-08-23
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
site_uuid: d636037e-f321-41f1-962f-3cf4e0e3eec7
hex_code: ouxn22
summary: >-
  Three gaps closed in one sitting, all of the same shape: capability existed
  and had no surface. `GET /auth` gives the marketing site's call-to-action a
  destination; `GET /account` shows what the credential resolves to; and the
  account page carries the controls for the entity and email operations the API
  had already shipped. Also records a deploy that had simply never run, and a
  read-the-wrong-table bug that made the entities primitive look empty.
tags:
  - Changelog
  - Id-Didi-Sh
  - Auth
  - Entities
  - Identity-Service
files_changed:
  - lib/id_didi_sh_web/controllers/auth_controller.ex
  - lib/id_didi_sh_web/controllers/auth_html.ex
  - lib/id_didi_sh_web/controllers/account_controller.ex
  - lib/id_didi_sh_web/controllers/account_html.ex
  - lib/id_didi_sh_web/controllers/access_html/done.html.heex
  - lib/id_didi_sh_web/router.ex
  - lib/id_didi_sh/accounts.ex
  - site/src/components/Header.astro
  - site/src/pages/index.astro
  - splash/src/components/Header.astro
from: "id-didi-sh"
from_path: "changelog/2026-08-23_01_First-Example-of-Event-Diary-Share.md"
---
# First example of event diary share

## Why Care?

didi.sh said **one login across every service** in its hero, and there was
nowhere to perform one.

The primary call-to-action pointed at `https://id.didi.sh/`, which was a spec
page with three theme toggles on it. Neither the site nor the splash had a
sign-in control anywhere. And `/` on the identity service itself was still
serving Phoenix's generated scaffold — *"Peace of mind from prototype to
production"* — because the real home page had been written, committed and
pushed weeks ago, and simply **never deployed**.

None of that was broken code. All three were capability without a surface.

## What's New?

- **`GET /auth`** — a hosted sign-in. Email in, single-use link out.
- **`GET /account`** — what your credential resolves to, and the controls to
  change it.
- **A `Sign in` control on both didi.sh and the splash.**
- The service's own front page, which had been sitting in `main` undeployed.

## The account page

<img src="https://ik.imagekit.io/xvpgfijuw/id-didi-sh/account-controls/Didi__Account--Entities-and-Controls_20260824T001617Z.jpg" alt="The didi.sh account page showing an editable Name and Handle above a Save profile button, four linked email addresses with a field to link another, and four entities — Palmer AI as a workspace held at org_owner, plus Reach Edu, NextLadder and Humain VC as organizations held at org_admin — each showing its handle in brackets beside an inline field to add a member by email at a chosen role" width="1375" height="1800" decoding="async" />

Signing in used to end at *"your session is live across every didi.sh service,
you can close this page"* — true, and unverifiable, with no link anywhere. The
first question anyone has after signing in is whether it **worked**: which
identity am I, which entities do I belong to, is the key resolving.

So the page answers those, and then lets you act on them: edit your name and
handle, link another address, create an entity, and add someone to any entity
you administer.

**It is the browser view of `GET /api/me`** — same data, same source, no second
notion of identity. Every write calls the same context function the JSON API
calls. One rule, two surfaces; they cannot drift because there is only one place
the rule lives.

The keys section deliberately stops at a link. `/keys` is the lender's screen and
rebuilding paste-lend-meter-revoke here would be a second implementation of the
one thing that must never have two.

## Three decisions worth the words

**A member is added by email, not by `didi_id`.** Nobody knows their own UUID and
nobody should have to. An unknown address gets an **invite** rather than a
refusal — granting access to somebody who has not signed in yet is the common
case, not the exception, and a form that refused it would fail at exactly the
moment it matters.

**Creating an entity makes you its admin, in the same action.** Without that the
entity exists and nobody, including its author, can administer it.

**An email is added, never edited.** `update_profile/2` covers name and handle
only. Editing an address in place would silently move an identity; adding one as
an alias is a different, reversible thing.

## The bug the page had on day one

It shipped read-only, and it **read the wrong table**.

`organizations` (org-wide `memberships`) and `entities` (`entity_memberships`)
both exist — a live decision, recorded in
`context-v/issues/Entities-and-Organizations-Both-Exist.md`. The page listed the
first while the tenancy primitive, and everything the API manages, is the second.
So it reported *one* membership and showed a legacy org, while the entities were
invisible.

The fix is not to pick the newer one and move on. **Both are shown, and the
legacy block is labelled as legacy** — because picking one silently is precisely
how a reader concludes the other is empty, which is the failure that produced
this bug in the first place.

## Under the hood

### The sign-in is a softening, stated

`AccessController` says real sign-in UIs live in the apps, which call
`POST /api/magic-links` from their own screens. That stays true and `/auth` does
not change it. What the headless posture never covered was somebody arriving from
the marketing site with **no app context** — and a call-to-action with no
destination is worse than one that does not exist.

So `/auth` issues the same magic link the API issues and hands off to `/access`,
which already does redemption. No second code path, nothing new minted.

**It never reveals whether an account exists.** Every submission renders the same
*"check your email"* page whether or not the address is known, because a
different answer for a known address is an enumeration oracle. Verified on all
three paths before shipping: the form renders, an unknown address gets the
identical page, a malformed one is refused before anything is issued.

### Auth is checked in the controller, not by the plug

`Plugs.RequireUser` halts with a JSON 401. That is right for the API scope it was
written for and wrong for a browser page, where the answer to *"not signed in"*
is the sign-in page. `/account` redirects to `/auth` instead.

### And it was a deploy, not a push

Worth recording because the diagnosis was three wrong guesses deep before anyone
checked. The home page was not missing and not unpushed: local was **0 ahead, 0
behind** `origin/main`, and the page had landed in `07ade98`. Fly was serving a
build from before it. The "Phoenix error page" was the generated scaffold plus
LiveView's reconnect banner, which reads like an error and is not one.

## What's Next

- **The schema call.** Creating those four made `entities` rows. Whether
  `organizations` collapses into `entities` is still open, and this page now
  makes the split visible rather than hiding it — which is the honest state until
  it is decided.
- **Handles on entities are the identity now.** `[reach-edu]`, `[humain-vc]`,
  `[palmer-ai]`, `[nextladder]` — not the email domain, which cannot work for an
  org whose people hold addresses somewhere else.
- Removing a member, and leaving an entity, are API-only.

## Related

- `context-v/issues/Entities-and-Organizations-Both-Exist.md` — the two-table decision this page stopped hiding
- `context-v/issues/Splash-And-Site-Have-No-Agreed-Division-Of-Labor.md` — why the button went on both surfaces
- `changelog/2026-08-20_01_Entities-Land-Flat-And-Invites-Reach-Strangers.md` — the primitive this surfaces
- `changelog/2026-08-21_01_Lend-A-Key-Keep-The-Receipts.md` — the `/keys` screen this links to

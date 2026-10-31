---
date_created: 2026-10-10
date_modified: 2026-10-10
title: "Signing in no longer sends you off-site"
lede: "A magic link could carry a destination like //evil.example, and /access would send the person there right after a real sign-in. Every destination now passes one rule, twice."
publish: true
date_authored_initial_draft: 2026-10-10
date_authored_current_draft: 2026-10-10
date_work_started: 2026-10-10
date_work_completed: 2026-10-10
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5 (1M context)
site_uuid: c3cd1851-e358-4b07-b1f7-2e98631eafa5
hex_code: mgwr4t
summary: >-
  Fixes an open redirect after sign-in. AccessController accepted any stored
  next that began with "/", including "//evil.example" and "/\evil.example",
  and redirected with `external:`. POST /api/magic-links stored the caller's
  next unchecked. One validator, IdDidiSh.RedirectTarget.sanitize/1, now runs
  when a token is issued and again when it is used. Tested in ExUnit
  (REDIRECT-01..07); not tested in a real browser or in production.
tags:
  - Changelog
  - Id-Didi-Sh
  - Security
  - Open-Redirect
  - Magic-Links
  - Identity-Service
files_changed:
  - lib/id_didi_sh/redirect_target.ex
  - lib/id_didi_sh/accounts.ex
  - lib/id_didi_sh_web/controllers/access_controller.ex
  - lib/id_didi_sh_web/controllers/magic_link_controller.ex
  - lib/id_didi_sh_web/controllers/auth_controller.ex
  - test/id_didi_sh_web/controllers/redirect_test.exs
from: "id-didi-sh"
from_path: "changelog/2026-10-10_02_Signing-In-No-Longer-Sends-You-Off-Site.md"
---
# Signing in no longer sends you off-site

## Why Care?

`POST /api/magic-links` needs no session. Anyone could ask it to email a
real person a real didi.sh sign-in link with `next` set to
`//evil.example`. The person clicks a genuine link from a genuine sender,
signs in, and `/access` sends them with a 302 to a site that can look like
didi.sh and ask for anything. That is the whole attack, and it worked.

## What was wrong

- `AccessController.safe_next/1` treated anything starting with `/` as a
  same-site path. Browsers read `//host` and `/\host` as another site, and
  drop tabs and newlines before parsing, so `/\t/host` works too. It then
  redirected with `external:`, which skips Phoenix's own local-path check.
- `MagicLinkController.create/2` stored `next` exactly as sent, and
  `redeem/2` handed it back to the consumer app to navigate to. A non-string
  `next` (a JSON list or object) crashed the insert with a 500.
- `Accounts.issue_invite/2` stored its `next_path` the same way.
- The OAuth hop on `/auth` already accepted only `/oauth/authorize?…`, which
  kept it from being a redirector. It did not refuse control characters
  after that prefix. It now applies the shared rule first.

## The rule

`IdDidiSh.RedirectTarget.sanitize/1` returns the value unchanged or `nil`.
A destination is a single leading `/` followed by anything but `/` or `\`,
visible ASCII only, no backslash anywhere, no scheme, host, userinfo, or
port, and a path part that still passes once percent-decoded (so
`/%2F%2Fhost` is refused, while an encoded URL inside a query string, which
the OAuth way back carries, is fine). Non-strings and values over 2048
bytes are `nil`. `nil` means the default: the "Signed in" page on
`/access`, and no `next` in the API.

It runs in two places:

1. **When a token is issued**, inside `Accounts.issue_magic_link/2` and
   `Accounts.issue_invite/2`. That covers the API, `/auth`, and both invite
   surfaces. The API controller also cleans `next` before passing it in.
2. **When a token is used**: `POST /access` and the `next` field of
   `POST /api/magic-links/redeem`. Rows written before this change cannot
   slip through. `/access` now redirects with `to:`, so Phoenix's own check
   sits behind ours.

## Behaviour change

`/access` used to accept absolute `https://didi.sh` and `https://*.didi.sh`
URLs as `next`. Under the one rule, a destination is a path, never a host,
so those now land on the "Signed in" page. No caller in the tree passes one
today: augment-it's sign-in sends no `next`, and `scripts/prove-skeleton.sh`
sends `/curator`. The spec's per-app allowed-prefix table (`apps`) would be
the way to bring cross-subdomain destinations back if a consumer needs them.

## Tests

`test/id_didi_sh_web/controllers/redirect_test.exs`, REDIRECT-01..07, 12
tests. Eight failed on `main` before the fix; the four legitimate-path
tests passed both before and after.

| ID | What it proves |
|---|---|
| REDIRECT-01 | The validator refuses 27 hostile or empty values, two absolute didi.sh URLs, and non-strings, and keeps real paths |
| REDIRECT-02 | `/access` refuses a hostile value already stored on a token |
| REDIRECT-03 | `/access` still sends a person to `/account`, and shows "Signed in" with no `next` |
| REDIRECT-04 | `POST /api/magic-links` with a hostile `next`: not stored, not echoed by the JSON redeem, not followed by `/access`; a non-string `next` gets a 202, not a 500 |
| REDIRECT-05 | `/account` survives both redeem paths |
| REDIRECT-06 | An invite with a hostile destination signs in without redirecting |
| REDIRECT-07 | The `/auth` OAuth hop drops a way back with control characters and keeps a real one |

The hostile set includes `//evil.example`, `///evil.example`,
`/\evil.example`, `https://evil.example`, `https:evil.example`,
`javascript:`, `%2F%2Fevil.example`, `/%2F%2Fevil.example`, `/%5C…`,
`/%09/…`, a literal tab, newline, CRLF, and NUL after the slash, leading
whitespace, header-injection attempts both raw and encoded, a bare host,
and the empty string.

`mix test`: **125 before, 137 after** (12 new). No existing test was
changed; OAUTH-03 passes as before. `mix format --check-formatted` and
`mix compile --warnings-as-errors --force` are clean.

## Not tested

- **No real browser.** The tests check the `Location` header the server
  sends, not what Chrome, Safari, or Firefox do with it. The rule refuses
  the known browser tricks rather than relying on any browser to resolve
  them safely.
- **Not deployed**, so nothing has been checked against production, and
  no existing production tokens were inspected. The redeem-side check is
  what covers any hostile `next` already stored there.
- **Consumer apps** that follow the JSON redeem's `next` were not exercised.
  None in the tree do today.

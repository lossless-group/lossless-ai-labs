---
title: "Login appears not persistent on the same browser"
lede: "A refresh or a new tab sends a signed-in person back through the email link. Login should feel very persistent."
date_created: 2026-11-20
date_modified: 2026-11-20
date_authored_initial_draft: 2026-11-20
date_authored_current_draft: 2026-11-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Open
site_uuid: c68c21d7-a26f-4912-9e52-bf239033d4d0
hex_code: adpuu5
summary: >-
  Signed in to didi.sh in Dia and in Zen, a refresh or a second tab sends Michael
  back through the email confirmation link before he can get in. The session
  should survive both.
tags:
  - Sessions
  - Login
from: "id-didi-sh"
from_path: "context-v/issues/Login-Appears-not-Persistent-on-Same-Browser.md"
---
# Login appears not persistent on the same browser

## What happened

On 2026-11-20 Michael was signed in to didi.sh in both Dia Browser and Zen Browser. In both, refreshing the page or opening didi.sh in another tab made him go through the email confirmation link again before he could get in.

## Expected

Login should feel very persistent. In the same browser, a session should survive a refresh, a new tab and a browser restart until it expires or the person signs out.

## Places to look

- Whether the session cookie is set at all, and with what `Max-Age`/`Expires` (a cookie with neither is dropped when the browser closes).
- Its `Domain`, `Path`, `SameSite` and `Secure` attributes, behind the proxy.
- Whether the cookie survives the redirect after the email link is confirmed.
- Both browsers are Chromium/Firefox derivatives with their own privacy defaults, so check one mainstream browser too.

## Why it may matter beyond annoyance

Partners connecting MemoPop in Claude sign in through id.didi.sh. A session that doesn't stick adds an email round-trip to every connect and re-connect.

## Not now

This was logged during the 2026-11-20 work to get Humain on MemoPop's connector, and isn't being worked on during it.

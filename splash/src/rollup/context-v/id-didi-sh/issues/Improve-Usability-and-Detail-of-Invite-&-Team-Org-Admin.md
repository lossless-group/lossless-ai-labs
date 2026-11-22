---
title: "Improve usability and detail of invite & team/org admin"
lede: "After inviting two partners, an admin can't tell whether the emails went out or who is still pending. The v1 invite dashboard is too basic."
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
site_uuid: 3ae43aeb-da15-40e4-b309-90a0205b7ae8
hex_code: lo9njl
summary: >-
  Michael invited two partners of a VC firm to its entity on 2026-11-20.
  Nothing showed that an email was sent, and there was no list of who had been
  invited. Suggests that v1 of the invite dashboard is basic and missing key
  features.
tags:
  - Invites
  - Admin-UI
  - Entities
from: "id-didi-sh"
from_path: "context-v/issues/Improve-Usability-and-Detail-of-Invite-&-Team-Org-Admin.md"
---
# Improve usability and detail of invite & team/org admin

## What happened

On 2026-11-20 Michael invited two other partners of the VC firm to its entity.

- **No sign an email was sent.** After sending an invite, nothing confirms that it went out.
- **No list of invites.** The admin can't see who has been invited, whether they've accepted, or what is still pending.
- **No entity ID shown.** The slug is visible, but the ID isn't. MemoPop's provisioning step asks for both the slug and the ID.

Together these suggest that v1 of the invite dashboard is basic and missing some key features.

## What it probably needs

- A confirmation after sending, naming who it went to.
- A list of invites with their status (sent, accepted, expired), plus resend and revoke.
- The entity ID shown next to its slug, for the services that ask for it.

Related: [[Invite-Redemption-Failure-Is-Logged-Not-Surfaced]], where an invite fails silently on the recipient's side.

## Not now

This was logged during the 2026-11-20 work to get Humain on MemoPop's connector, and isn't being worked on during it.

---
site_uuid: b0886fe4-9b67-48e8-b058-fc6e0f64b225
hex_code: 4zsiqw
title: "Lent Keys Are Encrypted With a Real Key in Production"
lede: "Production was set to encrypt lent API keys with the development key, which is in the public source. No key had been lent yet, so nothing was exposed. Production now uses its own key and won't start without one."
publish: true
date_created: 2026-11-26
date_modified: 2026-11-26
date_authored_initial_draft: 2026-11-26
date_authored_current_draft: 2026-11-26
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
tags:
  - Security
  - Encryption
  - Credentials
  - Id-Didi-Sh
files_changed:
  - config/config.exs
  - test/id_didi_sh/vault_test.exs
from: "id-didi-sh"
from_path: "changelog/2026-11-26_03_Lent-Keys-Are-Encrypted-With-A-Real-Key-In-Production.md"
---
## Why Care?

When someone lends an Anthropic or OpenAI key through `/keys`, didi.sh
stores it encrypted. Encryption only protects anything if the key is secret.

## What Happened

The code was meant to refuse to start in production without its own
encryption key. It decided whether it was running in production by reading a
setting that nothing ever set, so it never believed it was. It fell back to
the development key every time, and that key is written in this repository.

**No key had been lent in production,** so nothing was ever encrypted with
the development key and nothing needs re-encrypting.

## What's New?

- **Production has its own encryption key.** It is stored in Doppler and set
  on Fly, and the development key cannot decrypt anything production
  encrypts. Both were checked on the live service after the deploy.
- **Production won't start without that key,** or with a malformed one.
  Tests now pin this, along with the setting whose absence caused the bug.

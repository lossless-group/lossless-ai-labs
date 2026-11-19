---
name: Notesnook Profile
title: Notesnook — Profile
slug: notesnook
upstream: https://github.com/streetwriters/notesnook
pinned_sha: 8bb25559e
pinned_date: 2026-11-17
version_at_pin: "3.4.16-android (nearest tag)"
license: GPL-3.0-or-later
maintainer: Streetwriters (the Notesnook team)
study: studies/content-authoring-tools
profile_path: studies/content-authoring-tools/notesnook
profile_kind: End-to-end encrypted notes app — encrypted SQLite locally, libsodium E2EE sync over SignalR, rich-text (HTML) content, write-only PGP Inbox API
date_created: 2026-11-19
date_modified: 2026-11-19
date_authored_initial_draft: 2026-11-19
date_authored_current_draft: 2026-11-19
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Reference
site_uuid: 631de14d-2885-48cc-a16c-b17538fdaad0
hex_code: gryw5c
lede: >-
  The entry that encrypts even the database on your own disk, so the only way an
  agent can take part is to drop sealed notes into a write-only, PGP-keyed
  mailbox it can never read back.
summary: >-
  Profile of Notesnook as pinned in the content-authoring-tools study. It is the
  "agent can't read it" counterpoint: notes are TipTap HTML in a SQLite database
  encrypted at rest (SQLite3 Multiple Ciphers, random key in the app key store),
  synced as XChaCha20-Poly1305 ciphertext with Argon2-derived keys. Covers the
  Inbox API, a public-key write-only channel that external services and agents
  can post into, plus monographs (password-encrypted or self-destructing
  published notes), Vericrypt, and Markdown as an export-only format. Compared
  against Joplin (plaintext locally, MCP surface) and Khoj (agent reads a copy).
tags:
  - Profile
  - Notesnook
  - E2EE
  - Privacy
  - Local-First
publish: true
type: Profiles
from: "studies/content-authoring-tools"
from_path: "context-v/profiles/Profile__Notesnook.md"
---
# Notesnook — Profile

A profile of Notesnook as it lives in this study (`studies/content-authoring-tools/notesnook`, pinned at `8bb25559e`, nearest tag `3.4.16-android`, 2026-11-17). GPL-3.0-or-later, TypeScript/React across web, Electron desktop, and React Native mobile, from Streetwriters.

This is the study's **negative exemplar on purpose**. Against the study question (*"can an agent read from and write into the same store the human uses?"*), the answer is *no read, and only a narrow kind of write*. That is the point of the product. It shows what agent reach looks like when confidentiality comes first.

## TL;DR

Everything is encrypted, both on the wire *and* at rest on your device. The local database is SQLCipher-style encrypted, and content is HTML from a TipTap editor rather than Markdown. There is no plugin API, local HTTP API, or MCP server in this repo. The one door in is the **Inbox API**: a service holding an inbox key can encrypt a note to your PGP public key and drop it in, and only your client can open it.

**One sentence:** *Notesnook is what agent integration looks like when the store must stay opaque to everything but the user's own client: a write-only, public-key mailbox instead of a tool surface.*

## How it works

- **Stack.** npm monorepo. `packages/core` is shared logic (collections, sync, vault, monographs), `packages/crypto` and `packages/sodium` wrap libsodium, and `packages/editor` is the TipTap editor. Apps are in `apps/web`, `apps/desktop`, and `apps/mobile` (README "Monorepo structure").
- **Local store.** SQLite through Kysely, with tables for notes, content, relations, notebooks, tags, vaults, monographs, and `inboxitemshistory` (`packages/core/src/database/index.ts:82-96`). On first run the web/desktop client generates a random key, keeps it in the key store (`apps/web/src/common/db.ts:41-44`), and opens the database with `PRAGMA key` (`packages/core/src/database/index.ts:290`). Desktop uses `better-sqlite3-multiple-ciphers` (`apps/desktop/src/api/sqlite-kysely.ts:58`). The web build uses a SQLite3MC WASM build.
- **Crypto.** XChaCha20-Poly1305-IETF for items (`packages/crypto/src/encryption.ts:58`), a secretstream variant for attachments (`:91-105`), and Argon2 for key derivation (`packages/crypto/src/password.ts:34`, `keyutils.ts:51-57`). A per-account data key is wrapped by a password-derived master key. The docs say: *"The server only ever receives ciphertext"* (`docs/help/contents/how-is-my-data-encrypted.md:13`).
- **Sync.** A SignalR hub connection (`packages/core/src/api/sync/index.ts:491`). Merge is per-item by `dateModified`, with a conflict state for notes (`packages/core/src/api/sync/merger.ts`).

## What's on disk

An encrypted SQLite file, so nothing an outside program can parse without the key. Every encrypted value, on the server and in key fields, takes this shape (`packages/crypto/src/types.ts:24-31`):

```ts
export type Cipher<TFormat extends DataFormat> = {
  format: TFormat;
  alg: string;     // e.g. "xcha-argon2i13-<base64 variant>" (encryption.ts:117)
  cipher: Output<TFormat>;
  iv: string;
  salt: string;
  length: number;
};
```

Inside, a note's content is HTML of type `"tiptap"`. Markdown exists only as an output: `toMD()` runs a fork of showdown over the HTML (`packages/core/src/content-types/tiptap.ts:73`, `:88-90`). The docs list Markdown, Markdown + Frontmatter, HTML, plain text, and PDF exports (`docs/help/contents/export-notes-from-notesnook.md:14`). Export is a way out, not a working format.

## Agent reach

| Surface | Read | Write | Notes |
|---|---|---|---|
| **Files** | no | no | Encrypted SQLite; the key lives in the app's key store |
| **Local API / MCP / plugins** | — | — | None found in this repo |
| **Inbox API** | **no** | **yes**, create-only | `POST https://inbox.notesnook.com/` with an inbox API key; the payload is PGP-encrypted to the user's public key (`docs/help/contents/inbox-api/getting-started.md:72`) |
| **Export** | one-shot | no | Markdown/HTML zip, user-initiated |

An agent can **write but not read**, and can only *create* notes, never edit them.

## What's clever or unique

**The Inbox API is an asymmetric agent channel.** The client generates (or imports) a PGP keypair (`packages/core/src/api/user-manager.ts:729-733`), and the docs note the keys are *"validated (round-trip encrypt/decrypt) before being saved"* (`getting-started.md:46`). Each connected service gets its own named, expiring, revocable key, up to 10 (`packages/core/src/api/inbox-api-keys.ts`, `getting-started.md:52`). Items arrive over the sync hub's `SendInboxItems` message (`sync/index.ts:586-592`). The client then decrypts them with the private key (`merger.ts:249`), validates them against a strict zod schema (`merger.ts:207-224`), and runs `sanitizeHtml` on the device, after decryption (`merger.ts:319`). Each item id lands in `inboxitemshistory`, so a replayed item is skipped and a failed one is recorded with its error context (`merger.ts:238-300`). The server only relays ciphertext. A Zapier zap, an RSS bot, or an agent can *contribute* to the store without being able to *read* it.

```ts
// packages/core/src/api/sync/merger.ts:207-224 (trimmed)
const RawInboxItemSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["note"]),
  source: z.string().min(1),        // who sent it: "zapier", "my-agent"
  version: z.literal(1),
  notebookIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  content: z.object({ type: z.enum(["html"]), data: z.string() }).optional()
});
```

**Encrypted at rest, not just in transit.** This is the clean difference from [[Profile__Joplin]], whose local SQLite is plaintext and whose encryption happens only at serialize-for-sync. Notesnook gives a local agent nothing to read.

**Publishing with audience controls built in.** A monograph is a published note at a public URL. It can be **password-encrypted**, in which case the content is encrypted client-side before upload, or set to **self-destruct after one read** (`packages/core/src/api/monographs.ts:45-46`, `:79-130`; `docs/help/contents/publish-notes-with-monographs.md:14`, `:47`). The private vault adds a second password over chosen notes (`packages/core/src/api/vault.ts:88-94`).

**Verifiability as a product feature.** `apps/vericrypt` is a four-step web tool (log in, fetch account salt, enter password, paste sync payload) that lets a user decrypt their own sync traffic and check the encryption claim themselves.

## Costs / limits

- **No agent read path at all**, by design. Summarising, searching, or semantically indexing notes means exporting them first, at which point the privacy guarantee no longer covers that copy.
- **HTML, not Markdown.** The Inbox accepts only `content.type: "html"` (`getting-started.md` "What HTML can I send?"), and Markdown round-trips through showdown on export.
- **Inbox is create-only and needs the hosted relay.** Notes cannot be updated, appended to, or deleted through it. Notebook and tag ids must be copied out of the UI. The relay server code is not in this repo (`docs/help/contents/inbox-api/self-hosting-inbox-api.md` covers self-hosting).
- **No plugin system found**, so the client cannot host an in-process agent the way Joplin's `joplin.ai` plugins can.

## Relevance to flave

- **Encryption and clearance answer different questions.** Notesnook's E2EE asks *who can read the bytes*. Flave's `private → team → lp → public` asks *which audience a block is for*. Flave should not try to enforce clearance with encryption, since the human's own agent must still read `private` blocks. But a published `lp` artifact could follow monographs and be password-encrypted or expiring.
- **Borrow the inbox pattern for untrusted contributors.** A write-only, schema-validated, sanitize-on-receipt drop box (with `source` provenance, per-sender revocable keys, and replay history) is a good shape for agents or collaborators who should add material to a `.flave` workspace without reading its `private` blocks.
- **Note the agent-reach tradeoff.** In this group, how far an agent can reach falls as confidentiality rises: Joplin gives an agent read/write over plaintext, Notesnook gives write-only, and Khoj copies everything to a server. Flave is choosing plaintext files, so its leak protection has to live in the publish step (the v1 scan), not in storage.
- **Avoid HTML-as-storage.** Notesnook's Markdown export is lossy by construction. Flave's "Markdown is the source" stance is the right side of that line.

## Read next

- `packages/core/src/api/sync/merger.ts:207-330` — the inbox pipeline end to end: decrypt, validate, sanitize, record
- `docs/help/contents/inbox-api/getting-started.md` — the external contract an agent would code against
- `apps/web/src/common/db.ts:36-100` — at-rest encryption of the local database
- `packages/core/src/api/monographs.ts` — publish with password or self-destruct
- `docs/help/contents/how-is-my-data-encrypted.md` — the key hierarchy in plain words

## Related

- [[Profile__Joplin]] — E2EE that stops at the device edge, plus a full MCP surface
- [[Profile__Khoj]] — the opposite bet: the agent gets a server-side copy of everything
- [[Profile__Anytype]] — the other encrypted local-first store, with an object graph instead of notes

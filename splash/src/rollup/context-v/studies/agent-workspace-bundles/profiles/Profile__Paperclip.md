---
name: Paperclip Profile
slug: paperclip
upstream: https://github.com/paperclipai/paperclip
package: paperclipai (npm CLI), @paperclipai/* plugins (npm)
license: MIT
maintainer: Paperclip AI (`paperclipai/paperclip`)
study: studies/agent-workspace-bundles
profile_path: studies/agent-workspace-bundles/paperclip
profile_kind: agent-orchestration server + bundle format (Agent Companies spec) + sandbox-provider plugins
pinned_commit: dadbc495b3cbdc171fddc40d09aafcc3e9206305
pinned_commit_date: 2026-11-26
latest_release: v2026.1117.0 (2026-11-18)
date_created: 2026-11-26
site_uuid: 49dafb86-3a4c-4aab-a1a0-02e37a41d75d
hex_code: owrtk6
date_authored_initial_draft: 2026-11-26
date_authored_current_draft: 2026-11-26
lede: >-
  Paperclip ships two bundles, not one. A markdown "company package" is the
  one you share, and it holds no secrets. An encrypted workspace snapshot is
  the one you resume from, and it is never shared.
summary: >-
  Source-cited profile of Paperclip (paperclipai/paperclip, MIT, about 117k
  stars), an orchestration server and UI that runs teams of coding agents
  (Claude Code, Codex, Cursor, OpenClaw and others) as a "company". It is in
  this study for three reasons. It publishes a vendor-neutral bundle format,
  the Agent Companies spec (`agentcompanies/v1-draft`), which extends Agent
  Skills upward with COMPANY.md, TEAM.md, AGENTS.md, PROJECT.md and TASK.md
  and pins its sources to Git commits and hashes. Its exporter turns secrets
  into declared inputs and leaves their values behind. And it runs agents in
  nine sandbox-provider plugins, two of which (E2B, Cloudflare) are already
  pinned in this study. Read this before designing flave's `_sources.yaml`,
  `.secrets` placeholders, or `env/` recipe.
publish: true
type: Profiles
title: "Paperclip — Profile"
date_modified: 2026-11-26
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
status: Reference
tags: [Agent-Orchestration, Bundle-Formats, Agent-Skills, Secrets, Sandboxes, Provenance]
from: "studies/agent-workspace-bundles"
from_path: "context-v/profiles/Profile__Paperclip.md"
---
# Paperclip — Profile

## TL;DR

- **What it is.** A Node.js server and React UI that runs many coding agents as
  one organization, with an org chart, tasks, budgets, approvals and
  heartbeats. The README's tagline: "If OpenClaw is an _employee_, Paperclip is
  the _company_" (`paperclip/README.md`). Created 2026-03-02. Pinned at
  `dadbc49` (2026-11-26). Very active: the repo was pushed on the day of
  pinning, and the latest release is `v2026.1117.0`.
- **Why it's here.** It answers half of this study's question with shipping
  code. **What gets shared** is a markdown package, defined in a spec it
  publishes for others to implement
  (`paperclip/docs/companies/companies-spec.md`). **What gets resumed** is an
  encrypted, content-addressed workspace snapshot
  (`paperclip/doc/workspace-storage.md`, "Experimental remote workspace
  snapshots"). The two have different rules, and keeping them separate is the
  main design lesson.
- **What it isn't.** It isn't a sandbox. It hands execution to provider
  plugins and states plainly that it can't verify their isolation
  (`paperclip/packages/plugins/sandbox-providers/SANDBOX-REQUIREMENTS.md`).

***

## The study checklist, answered

| Checklist item | Paperclip's answer | Where |
|---|---|---|
| **Manifest** | One root markdown file per package kind (`COMPANY.md`, `TEAM.md`, `AGENTS.md`, `PROJECT.md`, `TASK.md`, `SKILL.md`), with YAML frontmatter. Folder convention does the wiring, and `includes:` is needed only for external refs. Vendor detail goes in a `.paperclip.yaml` sidecar | `docs/companies/companies-spec.md` §3–4, §15 |
| **Provenance** | `sources[]` entries with `kind` (`github-file`, `github-dir`, `local-file`, `local-dir`, `url`), `repo`, `path`, `commit`, `blob`, `sha256`, `license`, `attribution`, and `usage: vendored \| referenced \| mirrored`. Strict mode requires `commit`. Importers fail closed on a hash mismatch | spec §12–13 |
| **Secrets** | A secret is declared as an env input: `kind: secret \| plain`, `requirement: required \| optional`, an optional `default`, and `portability: portable \| system_dependent`. Values and provider bindings (`secretId`, `secret_ref`) are never exported. On import, each value the user enters becomes a new local secret | spec §15; `server/src/services/company-portability.ts:568-683`, `:3720-3770` |
| **Rebuild** | Not in the share package. "Vendor-specific adapter/runtime config should not live in the base package" (spec §8). Execution environments are a contract that the sandbox owner meets, not a build step Paperclip runs | `SANDBOX-REQUIREMENTS.md` (opening section) |
| **Isolation** | Delegated to nine provider plugins. Paperclip guards two authorities only: writes to host files (through outbound workspace sync) and calls to the Paperclip API (through its HTTP bridge) | `SANDBOX-REQUIREMENTS.md` "What the boundary protects" |

***

## Bundle 1: the Agent Companies package (shared)

The spec calls itself an "Extension of the Agent Skills Specification", and
its principle #4 is "`SKILL.md` remains owned by the Agent Skills
specification" (spec §2). It extends Agent Skills upward rather than
replacing it. That is the same position flave would need to take toward
Agent Skills.

Principles worth borrowing as written (spec §2):

1. Markdown is canonical.
2. Git repositories are valid package containers.
3. Registries are optional discovery layers, not authorities.
4. External references must be pinnable to immutable Git commits.
5. Slugs and relative paths are the portable identity layer, not database ids.
6. Vendor-specific fidelity belongs in optional extensions, not the base package.

Export rules (spec §16) read like a checklist for a flave exporter:

- omit machine-local ids and timestamps
- omit secret values
- omit machine-specific paths
- prefer `referenced` over silent vendoring for third-party content

An optional `company-package.lock.json` caches resolved refs and hashes. It is
a generated file, and the markdown stays the source of truth (spec §18).

The spec also lists what an importer must show before importing (§13):
missing files, hash mismatches, missing licenses, content that needs a network
fetch, and **"executable content in skills or scripts"**. That last item is
the trust prompt a received flave needs too.

Implementation map: `paperclip/doc/AGENTCOMPANIES_SPEC_INVENTORY.md` indexes
every file involved. The core is `server/src/services/company-portability.ts`
(6,620 lines). The CLI is `paperclipai company export|import`
(`cli/src/commands/client/company.ts`). The UI writes its own ZIP format from
scratch, including CRC32 (`ui/src/lib/zip.ts`).

### How secrets actually get stripped

The code that splits secrets from plain config is
`extractPortableScopedEnvInputs` (`company-portability.ts:609`):

- A bound secret (`type: "secret_ref"`) is exported as a declaration with
  `kind: "secret"`, `defaultValue: ""`.
- A plain value is checked by **key name**. `isSensitiveEnvKey` (`:568`)
  treats a key as secret if it ends in `_key` or `_token`, or contains
  `secret`, `password`, `auth`, `credential`, `jwt`, `cookie`,
  `connectionstring`, and similar. A sensitive key has its default blanked.
- A `PATH` override is dropped, with a warning. Values that look like
  absolute commands are marked `system_dependent`.

**Two caveats that matter for flave:**

1. **Classification is by name only.** A plain variable named `DATABASE_URL`
   or `WEBHOOK_URL` that holds a credential matches none of the patterns, so
   its value is exported as a default. Name-matching is a reasonable safety
   net, but it can't be the only control. Flave should require secrets to be
   declared (`${secret:NAME}`), and treat name-matching as a lint on top.
2. **Required becomes optional.** Every `secret_ref` is exported with
   `requirement: "optional"`, whatever the source agent needed. Whether a
   secret was required doesn't survive the round trip.

On import (`:3720-3770`), a missing required input blocks the import. Each
secret value the user enters becomes a new secret in the local store
(`local-encrypted-provider.ts` by default; `aws-secrets-manager-provider.ts`
is the real alternative, with stubs for GCP and Vault in
`external-stub-providers.ts`). Each value is then rebound as `secret_ref`. If
the import fails partway, the secrets it created are deleted (`:6607`).

***

## Bundle 2: the workspace snapshot (resumed, not shared)

`paperclip/doc/workspace-storage.md` ("Experimental remote workspace
snapshots") and `server/src/services/remote-workspace-snapshot-archive.ts`:

- Snapshots stream through authenticated encryption into S3. A ledger table,
  `execution_workspace_snapshots`, records the parent, generation, writer
  epoch, hashes and manifest digest. The snapshots form a version chain, not
  a single file.
- What's kept: files, modes, empty directories, confined symlinks, and **Git
  state including unpushed history**. Linked worktrees and alternates are
  normalized into standalone repos.
- What's left out, under a versioned capture policy
  (`REMOTE_WORKSPACE_CAPTURE_POLICY_VERSION = 3`):
  - `node_modules` next to a `package.json`, and Python venvs (detected by
    `pyvenv.cfg`), but only if Git doesn't track them
  - sockets and named pipes
  - absolute or escaping symlinks, which are dropped and recorded rather than
    failing the save
  
  Anything else unsupported fails the save.
- **It does not exclude `.env` files.** It doesn't need to, because a snapshot
  never leaves the tenant's encrypted bucket. A flave can't rely on that,
  because a flave is meant to be shared.

This snapshot is the closest prior art for flave's "resume a session"
use case. The company package is the closest for the "share a session" use
case. Paperclip never merges the two, and that keeps the secrets problem
manageable.

The same pattern appears for agent artifacts. A file in a local workspace
"is not enough, because cloud users and reviewers often cannot access the
agent's disk", so deliverables are uploaded to the task. Runners verify each
file's size and SHA-256 when they stage it (`paperclip/doc/AGENT-ARTIFACTS.md`).

***

## Sandboxes: nine plugins and a stated boundary

`paperclip/packages/plugins/sandbox-providers/` holds boxd (KVM microVMs),
Cloudflare, CreateOS, Daytona, E2B, exe.dev, Kubernetes, Modal and Novita.
Each one is a standalone npm package, kept outside the root workspace and
installed at runtime from the Plugins page.

- **Overlap with this study.** The `e2b/` and `cloudflare/` plugins are
  working client code for two runtimes already pinned here (`../e2b`,
  `../cloudflare-sandbox-sdk`). They answer the checklist item about getting
  files in and out of a sandbox. Daytona's
  `DIRECTORY-CONSTRAINT-FINDINGS.md`, `archive-stream.ts` and
  `file-sync-*.test.ts` are the most detailed record of where that breaks.
- **Kubernetes** uses `kubernetes-sigs/agent-sandbox`, an alpha CRD
  (`sandboxes.agents.x-k8s.io/v1alpha1`). It is a candidate pin for this study.
- **The boundary statement** (`SANDBOX-REQUIREMENTS.md`) is the clearest in
  the study. It treats the sandbox as fully untrusted, and protects only host
  writes (through sync) and API calls (through the bridge). It also admits:
  "This repository does not enforce these provider rules today, and Paperclip
  cannot verify them for an externally supplied sandbox."
- The runner image (`doc/runner-image-contract.md`) is a plain file tree with
  no OS or entrypoint, identified by an `inputsDigest`. Images copy paths out
  of it instead of rebuilding.
- `doc/LOW-TRUST-PRESETS.md` adds a `low_trust_review` preset for agents that
  read hostile input. It is containment at the API level, separate from the
  sandbox.

***

## What flave should take

1. **Adopt the Agent Companies `sources[]` object** for `_sources.yaml`,
   or map onto it exactly. It already handles commit, blob, sha256, license,
   attribution and vendored/referenced/mirrored, plus fail-closed
   verification. It also fits the RO-Crate question in this study's
   checklist: `sources[]` is the provenance layer RO-Crate would otherwise
   supply.
2. **Use its env-input shape for `.secrets` declarations**: `kind`,
   `requirement`, `default`, `portability`. Unlike Paperclip, keep
   `requirement` intact on export, and require explicit declaration instead
   of guessing from key names.
3. **Keep "share" and "resume" as two formats.** A flave sent to a stranger
   follows the company-package rules: no values, no absolute paths, no
   machine ids. A flave kept for yourself can use snapshot rules: everything,
   encrypted, chained by generation.
4. **Borrow the importer's warnings** (spec §13), especially flagging
   executable content before running anything.
5. **Consider making a flave a valid Agent Companies package.** The agents
   that produced a session could be written as `AGENTS.md` files with
   `skills:` by shortname. That would make a flave importable by Paperclip,
   and possibly by any future runtime that implements the spec.

## What not to take

- The `.paperclip.yaml` sidecar pattern is sound, but Paperclip's own sidecar
  carries adapter config such as `model: claude-opus-4-6`. A flave's `env/`
  should describe the environment, not one orchestrator's runtime settings.
- The spec is still `v1-draft`, and Paperclip is effectively its only
  implementer. Treat it as strong prior art, not an adopted standard.

***

## One-line summary

Paperclip's Agent Companies spec is a markdown-first, Agent-Skills-compatible
bundle format with commit-pinned provenance and secret declarations without
values, and its encrypted workspace snapshots are a separate resume format;
flave needs both, and should keep them apart the same way.

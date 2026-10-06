---
title: "Splash rollup:sync fails from where the operator actually stands"
lede: "`pnpm rollup:sync` errored at the ai-labs root (no such script) and inside splash/ (pnpm 12 ignored the build allowlist). Both fixed."
date_created: 2026-10-06
date_modified: 2026-10-06
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
semantic_version: 0.0.0.1
tags:
  - Issue
  - Usability
  - AI-Labs
  - Splash
  - pnpm
status: Resolved
site_uuid: f7b9cf9b-73cf-4e04-9198-a5a698798886
hex_code: jynh6c
date_authored_initial_draft: 2026-10-06
date_authored_current_draft: 2026-10-06
publish: true
---

# Splash `rollup:sync` fails from where the operator actually stands

## What happened

Refreshing the splash rollup is a routine step whenever a child ships something
worth showing. On 2026-10-06 it failed twice in a row, in two different ways,
depending on which directory the command ran from.

**From `ai-labs/` (the operator's default shell):**

```
└─> pnpm rollup:sync
Error: ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL
  × Command "rollup:sync" not found
```

The script lives only in `splash/package.json`. The root `package.json` had no
entry for it, so the command an agent tells you to run doesn't exist where you
run it.

**From `ai-labs/splash/`:**

```
Error: ERR_PNPM_IGNORED_BUILDS
  × installing dependencies
  ╰─▶ Ignored build scripts: esbuild@0.27.7, sharp@0.34.5
```

`splash/pnpm-workspace.yaml` approved esbuild and sharp with the
`onlyBuiltDependencies` list. pnpm 12 (12.8.1 here) replaced that key with an
`allowBuilds` map and ignores the old one, so the approval silently stopped
working. Every `pnpm <script>` in the splash (`dev`, `build`, `rollup:sync`)
runs a dependency check first and dies on it. The `ai-labs/` root
`pnpm-workspace.yaml` was already on `allowBuilds`, which is how the drift went
unnoticed.

## Why it matters

- The rollup is how the splash learns about new changelog and context-v work.
  When it's annoying to run, it doesn't get run: the last committed rollup was
  2026-08-18, seven weeks stale, before this refresh.
- The second failure blocks `pnpm dev` and `pnpm build` too, not just the sync.
  CI's `--ignore-workspace` install will hit the same wall once its pnpm is on 12.
- The workaround (call the script with `node --experimental-strip-types`
  directly) works, but only if you know to read `package.json` and copy the
  command out.

## Resolution

1. **`splash/pnpm-workspace.yaml`:** replaced `onlyBuiltDependencies` with
   `allowBuilds: { esbuild: true, sharp: true }`, and updated the file's comment
   to say why.
2. **`ai-labs/package.json`:** added `"rollup:sync": "pnpm --dir splash rollup:sync"`.
   `rollup-sync.ts` resolves every path from its own location
   (`splash/scripts/rollup-sync.ts:28-33`), so it doesn't care where it's
   launched from.
3. **`splash/README.md`:** notes that the root forwards the command.

Verified: `pnpm rollup:sync` now completes from both `ai-labs/` and
`ai-labs/splash/` (271 changelog files, 665 context-v files).

## Open follow-ups

- The same `onlyBuiltDependencies` key is still in our own
  `pnpm-workspace.yaml` files elsewhere in the tree (grepped 2026-10-06,
  upstream study pins excluded): `lfm/splash`, `context-v-corpus/splash`,
  `ai-labs/dididecks-ai/splash`, `ai-labs/dididecks-ai/client-sites/{chroma-decks,reach-edu-hub}`,
  `astro-knots/` and three of its sites (`mpstaton-site`, `banner-site`,
  `lossless-slides-site`), and four `content-farm/plugin-modules/*`. Each is
  the same failure waiting for the next `pnpm` run there. Fix per repo, in that
  repo's own session.
- Update the `maintain-splash-pages` skill's "Locked conventions" so new
  splashes start on `allowBuilds`.

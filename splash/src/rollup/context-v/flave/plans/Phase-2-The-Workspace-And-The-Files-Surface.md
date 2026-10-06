---
title: "Phase 2 — The Workspace and the Files Surface"
lede: "Flave opens a folder, shows you what is in it, and lets you edit the theme that styles what you are reading — so design work is brought in once and reused, never recreated."
date_created: 2026-08-20
date_modified: 2026-08-20
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
semantic_version: 0.0.0.2
status: Draft
spec_reference: "[[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]]"
tags:
  - Plan
  - Flave
  - Workspace
  - Themes
  - File-Tree
  - CodeMirror
  - Design-System
publish: true
site_uuid: 79127dfc-3d02-4e66-9921-020a7b842feb
hex_code: r7u7jd
date_authored_initial_draft: 2026-08-20
date_authored_current_draft: 2026-08-20
from: "flave"
from_path: "context-v/plans/Phase-2-The-Workspace-And-The-Files-Surface.md"
---
# Phase 2 — The Workspace and the Files Surface

## Why care?

Phase 0 proved you can type markdown and watch a styled document appear. It
styled that document with a `theme.css` nobody could see or reach — baked into
the app, invisible to the person whose brand it was supposed to be carrying.

That is backwards. **The theme is the part a person most wants to control**, and
the part most likely to already exist somewhere else: in their website's
stylesheet, in last quarter's deck, in a brand kit somebody made once.

Phase 2 opens the folder. You see the files. You open `themes/lossless.css`,
change a value, and the document you are reading restyles under you. And when
you start the next document, the theme is still there — because it lives in the
workspace, not inside the bundle you just finished.

## The claim

> *I can see the folders and files that make up my work, open any of them,
> and edit the theme that styles the document I am reading — and that theme is
> still there for the next document, because I brought it in once.*

## What the spec now says

Amended 2026-08-20 at the owner's request, before this plan was written:

- **§5.6 — the workspace.** A new layer between §5.2 (inside one bundle) and
  §5.5 (published theme packages): the persistent folders one person accumulates
  and reuses. `themes/`, `components/`, later `assets/`. Cascade unchanged:
  `builtin < workspace < theme < pack < document`.
- **§5.6 — bringing theme work in.** Ships-with starters, import an existing
  stylesheet, or adopt a published package. All three are a copy, never a link.
  A theme arrives with its `DESIGN.md` when it has one, because runtime CSS is
  the source of truth and DESIGN.md is the contract that says what the values
  *mean*.
- **§7.3 — a fifth surface: Files.** The workspace tree. Selecting a file is a
  **read**, so it does not breach §7.2's ceiling; writes still go through
  Source, Compose, the palette or the agent.

Three decisions were settled to get here, one of which was a contradiction
sitting in the spec since 2026-08-14:

| ID | Resolution |
|---|---|
| **D-24** | `themes/` (workspace, plural, chosen **from**) and `theme/` (document, singular, layered **on top**) are different scopes and both exist |
| **D-25** | §5.2's "hand-editing `theme.css` is a lint error" is **conditional on a `tokens.yaml` existing.** With no tokens file, `theme.css` IS the single source and editing it is correct. This is what makes the owner's request a supported workflow instead of a spec violation |
| **D-26** | **OPEN** — how the app reaches the filesystem before Tauri. Rec: dev-server bridge for v0, File System Access API as a progressive upgrade, behind one `WorkspaceFs` interface so Tauri later is a third implementation rather than a rewrite |

## Preconditions

| # | Precondition | State |
|---|---|---|
| 1 | Phase 0's render loop green | ✅ `pnpm prove` rungs 0–2 |
| 2 | A real theme to seed with | ✅ `splash/src/styles/theme.css` + `splash/DESIGN.md` (Press Room, 0.1.1.0) |
| 3 | D-26 resolved | ❌ **Open.** Blocks step 1 and nothing else — the rest of the phase is written against the interface, not the implementation |

## What gets built

### 1 · `WorkspaceFs` — one interface, swappable backends

```ts
interface WorkspaceFs {
  tree(): Promise<FsNode[]>;              // folders + files, lazily expanded
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  watch(path: string, cb: () => void): () => void;
}
```

**Tauri is the first backend** (D-26). The filesystem is exposed as three
explicit Rust commands rather than `tauri-plugin-fs`, because the plugin's
capability scoping is a second permission model to keep in sync and what the app
needs is exactly this contract, rooted at one folder. Every path is resolved
against the root and rejected if it escapes — a traversal in a document can
never reach outside the folder the user opened.

A `MemoryFs` fallback keeps `pnpm dev` working in a plain browser. It is
explicitly **not** persistent and says so in the UI, rather than pretending to
save and losing the work.

### 2 · The Files surface

A tree column over the workspace root. Folders expand, files open in Source.

⚠️ **This makes four columns** — Files, Chat, Source, Document — which is too
many at once on a laptop. Needs a layout decision, logged as **D-27** rather
than guessed at here. Candidates: stack Files above Chat in the left rail;
tab them; or make Files a slide-over. The Source toggle already shipped in
Phase 0 is the precedent for "not everything is visible at once."

### 3 · Open any file, with the right language and linter

The Source pane already runs CodeMirror 6. It gains language modes and
diagnostics per the earlier decision:

| Type | Mode | Diagnostics |
|---|---|---|
| `.md` | `@codemirror/lang-markdown` | — |
| `.css` | `@codemirror/lang-css` | syntax + **unknown-token check reusing `check-styles.mjs`'s rule** |
| `.yaml` | `@codemirror/lang-yaml` | parse errors; `flave.yaml` against its schema |
| `.json` | `@codemirror/lang-json` | parse + schema where one exists |

The CSS token check is the interesting one: the gate written after the
2026-08-20 styling bug becomes an **editor affordance**, telling the author a
token does not resolve *while they type it* rather than at build time.

### 4 · Live theme — the payoff

Editing `themes/lossless.css` restyles the rendered document immediately, with
no reload. Mechanically this is a `<style>` element the app owns, rewritten on
change — the same live loop as Phase 0's markdown, applied to the stylesheet.

### 5 · Seed the workspace

First run creates `themes/lossless.css` from the Press Room theme, with
`DESIGN.md` beside it. A person who never edits it still gets a finished
document; a person who does has a real design system to edit rather than a
blank file.

## Done conditions

Binary, checkable:

1. The Files column lists the workspace, and clicking a file opens it in Source.
2. Editing `themes/lossless.css` restyles the rendered document with no reload.
3. A change made in Source is on disk — reopening the workspace shows it.
4. Referencing an undefined token in a `.css` file raises a diagnostic in the
   editor, not just at build time.
5. A second bundle in the same workspace picks up the same theme without
   copying it.

## Explicitly not in this phase

`tokens.yaml` and the generator (D-25 keeps hand-edited CSS legal until it
exists) · published theme packages and the registry (§5.5, D-18) · frames ·
`assets/` and `data/` as persistent folders · Tauri · the chat surface.

## Open decisions

Both closed by the owner on 2026-08-20, before implementation started:

| ID | Resolution |
|---|---|
| **D-26** | Tauri, brought forward. Viability proven on NixOS first — webkit2gtk 2.52.5, gtk 3.24.52, libsoup 3.6.6, cargo 1.97 via a repo-local flake devshell — because "toolchain trouble generates more loops than logic ever does" and a Tauri build on NixOS is exactly where that bites |
| **D-27** | The left rail toggles Chat ⇄ Files. One rail, two surfaces, never both |

## See also

- [[Phase-0-The-Live-Render-Loop]] — the render loop this builds the folder around
- [[Phase-1-One-Operation-Set-Four-Callers]] — the seam; Files is a read surface
  and does not need it, but "open file" becomes a capability once it exists
- [[Master-Flave-An-Agent-Native-Document-Format-and-Publisher]] — §5.2, §5.5,
  §5.6, §7.3, §14

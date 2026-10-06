---
title: "resolve two important branches — tests and workspaces"
lede: "The workspaces feature is not on feature/workspaces. It is on hygene/test-coverage, unmerged since 2026-08-09, along with a frontmatter sweep and the splash date-chain fix. Nothing on main knows it exists."
date_created: 2026-08-21
date_modified: 2026-08-21
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
semantic_version: 0.0.0.1
status: Open
tags:
  - Issue-Resolution
  - Branches
  - Workspaces
  - Test-Coverage
  - Technical-Debt
  - Id-Didi-Sh
site_uuid: 77d42060-854a-4fa6-9905-4ace5a9e39ea
hex_code: 0j8o4a
date_authored_initial_draft: 2026-08-21
date_authored_current_draft: 2026-08-21
publish: false
from: "id-didi-sh"
from_path: "context-v/issues/Resolve-Two-Important-Branches-Tests-&-Workspaces.md"
---
# resolve two important branches — tests and workspaces

## What

Two branches carry work that never reached `main`, and the names actively
mislead about which holds what.

### `hygene/test-coverage` — 7 commits unmerged

Despite the name, **this branch holds an entire feature**, not just tests:

| Commit | Date | What |
|---|---|---|
| `f7a4e79` | | `new(context-v)` — corpora-builder primitives *(docs now on main)* |
| `b0b417c` | 2026-08-09 | **`feat(workspaces)` — the tenancy boundary** |
| `725c5e3` | | `fix(splash)` — teach the date chains the editorial keys |
| `3ebda2c` | | `fix(frontmatter)` — editorial date pair + identity across all 7 changelog entries |
| `8a6d636` | | `doc(context-v)` — normalize frontmatter across 3 files |
| `faa12eb` | | `fix(splash), doc(claude)` — block scalars, editorial dates, browser-drive block |
| `8af9992` | | `doc(context-v)` — frontmatter sweep: identity, dates, ledes, publish flags |

The feature commit adds real, tested code that `main` has never seen:

```
lib/id_didi_sh/accounts/workspace.ex              (new)
lib/id_didi_sh/accounts/workspace_membership.ex   (new)
lib/id_didi_sh/workspaces.ex                      (new)
lib/id_didi_sh_web/controllers/workspace_controller.ex (new)
priv/repo/migrations/20260809000001_workspaces.exs (new)
test/id_didi_sh/workspaces_test.exs               (new)
test/id_didi_sh_web/controllers/workspace_controller_test.exs (new)
lib/id_didi_sh/accounts.ex                        (modified)
lib/id_didi_sh_web/router.ex                      (modified)
```

Its commit message carries a load-bearing invariant worth not losing:

> Derive membership from an email domain and you have built a system that
> structurally cannot express an advisor. So membership is an explicit grant,
> and the granted person's address is irrelevant to it.

`default_domain` survives only as a **self-signup hint**, read in exactly one
function; `role_of/2` never consults it, and there is a test asserting that
clearing or changing a domain cannot revoke anybody — "because it is the mistake
a future reader is most likely to make while *simplifying*."

### `feature/workspaces` — 1 commit unmerged, and it is not workspaces

`219c9e0 doc(notes): what OAuth and OIDC actually are` — a document whose
content already reached `main` by another route. The branch also holds **older**
copies of `splash/src/components/Header.astro` and
`splash/src/layouts/BaseLayout.astro`, predating the interlinking fix in
`204b38a`.

So the branch named for the feature contains none of it.

## Why it matters

**A tested feature is sitting unmerged and unnamed.** `feat(workspaces)` landed
2026-08-09 and nothing on `main` references it. Twelve days later the entities
work shipped a *different* tenancy model — flat `entities` with
`kind: "organization" | "workspace" | "project"` — which may supersede,
duplicate, or conflict with `accounts/workspace.ex`. Nobody has checked. That
check gets harder every week, and the invariant above is exactly the kind of
thing that gets re-derived badly.

**Both branches will resurrect the augment-it DESIGN.md if merged carelessly.**
Each carries the pre-2026-08-21 copies of `splash/DESIGN.md` and
`site/DESIGN.md` — the verbatim augment-it contract, magenta spine and all. A
merge that takes theirs silently undoes this morning's correction.

**`feature/workspaces` is what the `ai-labs` parent currently points at.**
Resolving it moves the parent's gitlink, so it is not a purely local decision.

**The frontmatter sweep is coupled to a splash change.** `3ebda2c` adds editorial
date keys to the changelog entries; `725c5e3` teaches `splash/src/loaders/frontmatter.ts`
to read them. Taking the docs without the loader means dates render from the
wrong keys. They move together or not at all.

## Findings — the test audit (2026-08-21)

**The spike has real coverage.** `feature/entities-and-keys` carries 15 test
files against `main`'s 6 — a strict superset plus nine new ones, 1190 added
lines, suite 55 → 97 green:

```
credentials_test.exs          entity_controller_test.exs
lending_test.exs              invite_flow_test.exs
entities_test.exs             resolve_test.exs
credential_controller_test.exs  keys_live_test.exs
assets_built_test.exs
```

**`hygene/test-coverage` added no coverage to the auth surface.** Despite the
name, its diff against `main` touches **zero** existing test files. It adds
exactly two, both for its own new feature: `workspaces_test.exs` (231 lines) and
`workspace_controller_test.exs` (154). So there is no auth-hardening work
stranded there — the branch is misnamed twice over.

**So the only tests the spike lacks are the two workspaces files**, and most of
what they assert is about `accounts/workspace.ex`, a module the flat `entities`
model replaces. Nothing needs cherry-picking. Four behaviors, however, are worth
**rewriting against entities** — see below.

### The gap that matters: `default_domain` is inert and nothing says it must stay that way

`priv/repo/migrations/20260820000001_create_entities.exs` carries the column
forward:

```elixir
add :default_domain, :string
add :default_role, :string
```

`entities.ex` writes it once on create (line 65) and **never reads it again.**
`effective_role/2` correctly consults only lending and the membership row. That
is the right behavior — and there is **no test asserting it.**

This is the dangerous shape: a field sitting in the schema, unread, with nothing
locking it down. The workspaces branch had five tests guarding exactly this
("a matching domain does NOT by itself confer access"), and they did not come
across. A future reader sees `default_domain` on an entity and wires it into
`effective_role/2`, reintroducing the domain-derived membership that the
advisor invariant forbids — the mistake `b0b417c` predicted in prose but that
entities no longer tests for.

### What to rewrite against entities (4 tests, small)

1. **`default_domain` confers nothing.** Create an entity with a domain, create
   a user at that domain, assert `effective_role/2` returns `nil`. The direct
   port of the invariant, and the one that prevents the regression above.
2. **The advisor case.** Someone at another company holds a role by explicit
   grant. Entities gets this structurally — there is no domain derivation to
   begin with — but the test is what keeps it structural.
3. **Slug normalization.** Workspaces normalized slugs on upsert; entities
   takes `attrs[:slug]` raw and only rejects an exact duplicate
   (`:slug_taken`). Either normalize and test it, or decide raw slugs are
   intended and note why.
4. **Revoke idempotence, and `via` is recorded.** Entities rejects a bad `via`
   but never asserts a good one is stored, and removal is not tested twice.

### What NOT to port

Everything about `auto_join/2` and `joinable_by_email/1`. Beyond being
workspaces-specific, self-serve joining sits in tension with this repo's
load-bearing invariant #2 — *"the ONLY account-creation path is invite
redemption; never add a self-serve signup endpoint."* Joining a workspace is not
creating an account, so it is not a straight violation, but it is close enough
that it is a **product decision, not a merge decision.** Entities has no
equivalent surface today, and shipping one by merge would be an accident.

## Options

1. **Triage `hygene/test-coverage` as two separate merges.** Cherry-pick the
   frontmatter sweep + splash loader fix as one coherent docs-and-rendering
   change; treat `feat(workspaces)` as its own decision after reconciling it
   against the `entities` model. Highest clarity, most steps.
2. **Reconcile workspaces against entities first, then merge whatever survives.**
   Answer "does `entities(kind: workspace)` replace `accounts/workspace.ex`?"
   before moving any code. If it does, the branch becomes a docs-only merge and
   the feature is deleted with its invariant migrated into the entities model.
3. **Merge `hygene/test-coverage` wholesale into `main`,** resolving DESIGN.md
   conflicts in favor of `main`. Fastest; ships a possibly-superseded tenancy
   model alongside the new one and defers the real question.
4. **Rename the branches to match their contents** and defer everything else.
   Cheapest possible step; removes the trap without paying down anything.

## Recommendation

**Both branches can be deleted, after writing four small tests against
`entities`.** The audit answers what blocked this: there is nothing to salvage
from `hygene/test-coverage` except four behaviors, and they are cheaper to
rewrite than to cherry-pick, because they target a module that no longer exists
in the surviving model.

Sequence:

1. Write the four tests listed above against `entities`, starting with
   `default_domain` confers nothing — that one closes a live regression risk
   whether or not the branches are ever touched again.
2. Take the frontmatter sweep (`3ebda2c`, `8a6d636`, `8af9992`) together with
   the splash loader fix (`725c5e3`, `faa12eb`) as one docs-and-rendering
   cherry-pick. **Resolve `DESIGN.md` in favor of `main`.**
3. Decide `auto_join` as a product question, separately and later. Do not let it
   arrive via a merge.
4. Delete `hygene/test-coverage`. Delete `feature/workspaces` after repointing
   the `ai-labs` parent, which currently tracks it.
5. Merge the spike back to `main`.

`accounts/workspace.ex` and its migration are then deleted with the branch —
the tenancy idea survives as `entities(kind: "workspace")`, and the invariant
survives as tests 1 and 2.

## Open questions

1. ~~Does `entities(kind: "workspace")` supersede `accounts/workspace.ex`?~~
   **Answered: yes, for tenancy and membership.** Not for `auto_join` /
   `joinable_by_email`, which have no equivalent and should be treated as a
   product decision rather than carried over.
2. ~~Does the advisor invariant hold in the entities model?~~ **Answered:
   structurally yes** — entities derives nothing from an email domain — **but
   it is untested**, and `default_domain` sits on the table unread. Test 1
   above closes this.
3. **Does `entities` want slug normalization**, or are raw slugs with a
   `:slug_taken` check the intended contract?
4. **Does didi.sh want domain-based self-signup at all**, given invariant #2
   (invite-only, no self-serve signup endpoint)?
5. **Can `feature/workspaces` be deleted outright** once the `ai-labs` parent is
   repointed?

## Related

- `context-v/plans/Entities-and-Keys-Implementation-Plan.md` — the model that may supersede workspaces
- `context-v/issues/Entities-and-Organizations-Both-Exist.md` — the same duplicate-tenancy question, one layer down
- `context-v/explorations/What-Corpora-Builder-Needs-From-didi-sh.md` — names "workspaces aren't a thing here yet" as a consumer gap
- `ai-labs/context-v/plans/Didi-Login-and-Workspace-Config-for-Corpora.md` — Phase B, which `b0b417c` implements
- `204b38a` — the splash interlinking fix both branches predate

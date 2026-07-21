---
from: "dididecks-ai"
from_path: "context-v/agent-skills/context-vigilance/references/status-discipline.md"
---

# Status Discipline for `context-v/` Documents

> The `status:` field is the load-bearing signal of where a document sits in its lifecycle. A directory full of `status: Draft` plans, half of which actually shipped, is a directory you can't trust. This reference encodes the values, the transitions, the companion fields, and the partial-ship discipline.

## The problem this addresses

`context-v/` directories accumulate plans, specs, explorations, and prompts over weeks and months. Without an explicit status convention, every doc stays at its authored-day default (`Draft`) forever. An agent landing cold cannot tell:

- What's already shipped (and therefore historical, not live work).
- What's in flight (and therefore needs continued attention).
- What was deliberately deferred (and therefore *not* a gap).
- What's stale and should be retired.

This breaks the "loadable docs" contract — context-v/ exists so future agents and humans can land cold and orient quickly. Stale `Draft` everywhere defeats that.

The discipline: **every meaningful state change on a document gets reflected in its `status:` field, with companion fields that explain when, why, and what's left.**

## The status values

`status:` is a **Train-Case display string** — human-readable, not a machine enum (don't switch on values in code; spelling and casing drift). The canonical values:

| Value | Meaning |
|---|---|
| `Draft` | Authored, not yet executed. Default for new files. |
| `In-Review` | Drafted and being discussed/refined before execution. Use for specs especially. |
| `Signed-Off` | Sign-off received; execution authorized. Spec-specific. |
| `Implementing` | Active execution in progress. |
| `Shipped` | All deliverables landed. The plan has fully executed; nothing material remains. |
| `Partially-Shipped` | Some deliverables landed, others did not. Requires a `## Remaining work` section in the body (see below). |
| `Deferred` | Explicitly held; not stale, not abandoned, but execution is on hold for a named reason (often a dependency or a decision pending). Requires a `deferral_note:` field. |
| `Stale` | Authored a while ago, no longer reflects current direction; not retired yet. Use sparingly — usually `Superseded` or archival is better. |
| `Superseded` | Replaced by a newer document. Requires a `superseded_by:` field pointing at the successor. |
| `Archived` | Retired. Kept on disk for historical record, no longer load-bearing. |

Project-specific extensions are fine if they earn their keep. When introducing a new value, prefer Train-Case and document its meaning in the project's CLAUDE.md or a sibling reference.

## The lifecycle

The typical happy path for a plan:

```
Draft → (In-Review →) (Signed-Off →) Implementing → Shipped
```

For partial outcomes:

```
Draft → Implementing → Partially-Shipped → [remaining work shipped over time] → Shipped
```

For held work:

```
Draft → Deferred → [later: Implementing → Shipped, or Superseded, or Archived]
```

Not every step is necessary. The discipline is that **status reflects reality**, not that every plan passes through every value. A plan that ships in the same session it was authored skips straight from `Draft` to `Shipped`.

## Companion fields

When status changes, the relevant companion fields must change with it.

| When status is | Required companion fields |
|---|---|
| `Draft` / `In-Review` | none |
| `Shipped` | `date_first_published: YYYY-MM-DD` (the ship date); optionally `post_ship_note:` (multiline string) for things learned after ship |
| `Partially-Shipped` | `date_first_published:` for the date of the first shipped slice; a `## Remaining work (as of YYYY-MM-DD)` section appended to the body listing what's done and what's left |
| `Deferred` | `deferral_note:` (multiline string) explaining the named reason for deferral and any expected unblocker |
| `Superseded` | `superseded_by: [[Successor-Doc]]` |
| `Stale` / `Archived` | optional `archive_note:` if context isn't obvious |

In every case: **bump `date_last_updated:` (or `date_modified:` for older-style frontmatter) on the same edit.** Status changes are meaningful edits.

## The `## Remaining work` section

For `Partially-Shipped` docs, append a section at the end of the body:

```markdown
## Remaining work (as of YYYY-MM-DD)

This plan is partially shipped. What's done and what's left:

### Shipped
- **Step / phase name.** One-line description of what landed.
- ...

### Not yet shipped
- **Step / phase name.** What it is, why it's still outstanding, any blocker.
- ...

### Side artifacts this plan produced
- Optional. Mentions ancillary deliverables that ended up belonging to a different plan or surfaced unexpectedly.
```

The date in the section heading anchors the snapshot. When another slice ships, update the section in place (don't add a second section) and bump the date.

When everything finally ships, promote `status:` to `Shipped`, optionally fold the section's content into a `post_ship_note:`, and remove the section heading.

## When to update status

Update status (and companion fields) whenever:

1. **You ship a substantial portion** of the plan's deliverables. Don't wait for "100%" — `Partially-Shipped` exists precisely for the in-between state.
2. **You explicitly defer** a plan in favor of another. Set `Deferred` and write the deferral_note.
3. **You replace** a doc with a newer one. Set `Superseded` on the old one, link `superseded_by:`, and link `supersedes:` on the new one.
4. **You're surveying** the directory (e.g., during a status sweep — see the `Maintain-Status-Discipline-Across-Context-V-Files.md` habit) and notice a doc whose status doesn't match reality.

## When NOT to update status

- **Mid-session, as a side effect of unrelated work.** The drift policy applies: surface the gap to the user; don't silently normalize.
- **For docs authored by someone else** whose ship-state you're not sure about. Ask before promoting.
- **As a way to "tidy up"** without genuinely confirming the work shipped. A `Shipped` claim should map to an actual ship event you can point at (a changelog entry, a commit, a release tag).

## Sweep cadence

A standing "status sweep" through a project's `context-v/` is a useful periodic exercise — typically when you're about to author a new plan and want to know what's already live, or after a coherent chunk of work lands and you want the directory to reflect the new state. The full procedure lives in the **Maintain-Status-Discipline-Across-Context-V-Files.md** habit at the monorepo root.

## Anti-patterns

- **`Draft` forever.** Plans that shipped weeks ago still say `Draft`. → Sweep + promote.
- **`Shipped` without `date_first_published`.** No anchor for "when." → Add the date.
- **`Partially-Shipped` without `## Remaining work`.** The whole point is to enumerate what's left. → Author the section.
- **`Deferred` with no `deferral_note`.** "Why deferred? For how long?" — must be answerable. → Add the note.
- **Silent status migrations as a side effect of unrelated edits.** Breaks the drift policy. → Surface, don't normalize.
- **Promoting status without a ship event.** Status is a claim. → Map to a real changelog entry, commit, or release.

## Cross-references

- `frontmatter-spec.md` — the `status:` field definition + companion fields
- `developing-a-spec.md` — spec-specific status progression (`Draft → In-Review → Signed-Off → Implementing → Shipped`)
- `philosophy.md` — why externalized memory matters; the same reasoning underlies status discipline
- The **Maintain-Status-Discipline-Across-Context-V-Files.md** habit at monorepo root — the periodic sweep procedure

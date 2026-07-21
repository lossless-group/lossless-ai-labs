---
from: "dididecks-ai"
from_path: "context-v/agent-skills/changelog-conventions/references/what-counts.md"
---

# What Counts as a Changelog-Worthy Event

The hardest question. Heuristics, not rules.

## The minimum bar

> **A coherent chunk of work shipped — or at least pushed to a remote.**

That's it. Two predicates:

1. **Coherent chunk** — the work has a unified theme. "Implemented X" or "Refined Y" or "Shipped Z." Not "did some stuff."
2. **Shipped or pushed** — there's a state change visible to someone other than you. Deployed, merged, released, or at minimum pushed to a remote where a collaborator could land on it.

## Yes-write-an-entry

- Merged a PR that delivers user-visible value
- Shipped a new convention, blueprint, or skill
- Released a new version of a package
- Added a significant doc that other work will reference
- Completed a multi-day sprint, even if no single commit was the climax
- Resolved a long-running issue with a pattern worth sharing
- Reached a milestone (first 100 users, first paying customer, first contributor)

## No-don't-bother

- Single typo fix
- WIP commits between meaningful checkpoints
- Routine dependency bumps (unless the bump matters)
- Refactors that produce no behavior change and no new pattern
- Internal-only experiments that haven't earned a reader yet

## Edge cases

### "I shipped three small things today"

- If they share a theme: one entry, list them in the body.
- If they're unrelated: one entry per theme, separate `_NN` numbers.

### "I'm not sure if this is shippable yet"

- If you pushed it: it's shippable enough to log.
- If you're still iterating locally: wait.

### "I want to log my work but it's not really 'shipped'"

- This is the gap the **future "tweet-style" subset** is meant to fill.
- For now: either wait until a coherent chunk emerges, or write a short entry and accept that not every changelog needs a press-release lede.

### "I made a mistake that needed reverting"

- Yes, log it. Building in public means logging the dead ends too.
- Lede should still be honest and interesting: `"Reverted Friday's auth change — turns out cookies and edge runtime have feelings."`

## The lede test

If you can't write a compelling lede in one sentence, the work might not have earned an entry yet. Either:

- Wait until you can articulate what's interesting about it
- Combine it with related work into something worth announcing
- Skip the entry entirely

## The story test

A changelog entry is a small journey. Not every chunk of work has the right shape:

- ✅ "Problem → attempt → resolution" — a story
- ✅ "Realization → reframing → shipped result" — a story
- ✅ "Three things converged into one" — a story
- ✅ "We tried this, it didn't work, here's what we learned" — a story (yes, log setbacks)
- ❌ Two paragraphs of miscellaneous CSS fixes — *not a story*. Find the connecting thread or skip.
- ❌ A yak-shaving rabbit hole with no resolution — *not a story by itself*. Combine with the work it served.
- ❌ "Worked on auth today" — a journal entry, not a changelog

If the work doesn't tell a story yet, you have three options: combine, wait, or skip. See `references/voice-and-shape.md` for arc patterns that work.

## Frequency

There's no minimum or maximum. Some weeks: zero entries. Some days: three entries. Pace follows the work, not the other way around.

What matters: when an entry exists, it's worth reading.

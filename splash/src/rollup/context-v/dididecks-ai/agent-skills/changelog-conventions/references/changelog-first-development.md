---
from: "dididecks-ai"
from_path: "context-v/agent-skills/changelog-conventions/references/changelog-first-development.md"
---

# Changelog First Development (CFD)

A working Lossless theory, parallel to the team's earlier rediscovery of spec-driven development through `context-vigilance`.

## The claim

> If you keep a changelog, and that changelog is moving rapidly and means something, the audience and users and clients get the sense that **shit is happening**. The bus is leaving. The cruise ship is full.

The corollary: when a changelog goes quiet for too long, even an actively-developed project starts to *feel* dead to outsiders. Their experience of the project's velocity is the changelog's cadence — not the commits, not the Slack channel, not the team's feeling about it internally.

## Why this matters

Most projects underweight the changelog. They think of it as documentation overhead — something done after the work, if at all, by a junior or a release manager. That misses the leverage:

- **Clients/audiences read changelogs to feel the pulse.** When the pulse is missing, they assume there's no patient.
- **Contributors arrive through changelogs.** A live, well-written changelog is the highest-conversion onboarding artifact a project has.
- **Future contributors (including future-you) reconstruct intent through changelogs.** The "why" gets preserved when the "what" gets logged.
- **AI agents loaded into a project orient via changelogs.** A clear recent changelog gives an agent a free 30 seconds of context that a README can't.

## The parallel to Context Vigilance

The team independently arrived at "spec before code" before realizing it had a name (spec-driven development). The same pattern is happening with changelogs:

- **Context Vigilance** says: write the spec, write it well, refer to it during implementation, keep it current. The spec leads the work.
- **Changelog First Development** says: write the changelog *as if it's leading the work too*. Frame the entry first. If the changelog entry is hard to write, the work itself might be unfocused.

A changelog entry that won't write itself often signals work that hasn't yet earned a story — combine with related effort, or finish the arc before logging.

## Practical implications

### Write entries close to the shipping moment, not after

The longer the gap between ship and changelog, the more you forget. Aim for same-day. Tomorrow is acceptable. A week later is reconstruction.

### Frame the entry before you finish the work, when possible

For multi-day chunks, draft the lede early. The act of drafting reveals whether the work has a coherent arc. If the lede is hard to write, ask why — it's diagnostic.

### Treat changelog cadence as a project health metric

Not the only metric. But a real one. A project where the last changelog is from three months ago is **probably** stalled — not certainly, but probably. Investigate.

### Aggregate across the family

The long-running Lossless goal: aggregate all changelogs across all repos via the GitHub API into a "Lossless Changelog" umbrella feed. CFD assumes this future. Write entries that will render well in that aggregated context — assume the reader doesn't know which repo it's from until they read.

## The tension with "It exists"

The skill's core rule is "it exists" — the lowest possible bar. CFD raises the bar to "it exists, it's frequent, it's meaningful, it tells stories."

These are compatible. The progression is:

1. **Just have a changelog.** ← floor.
2. **Log when meaningful work ships.** ← walking pace.
3. **Write entries that tell stories.** ← jogging.
4. **Frame entries before/during the work, not just after.** ← running. This is CFD.

Most projects haven't reached level 1. Don't let CFD become a reason to skip levels.

## Anti-patterns

- ❌ Daily changelog entries that are status reports ("worked on auth today") — that's a journal, not a changelog
- ❌ Quarterly mega-entries that try to summarize three months — readers can't process them; entries lose specificity
- ❌ Padding the changelog with non-shippable work to look active — readers can tell, and trust collapses fast
- ❌ Entries that describe internal struggles without resolution or learning — that's a journal entry, not a story

## A thought experiment

If you were the Lossless Group's only outside observer — a potential client, a curious reader, a possible contributor — and the only thing you saw was the changelog feed across all the repos for the last 30 days... would you be intrigued or unconvinced?

That's the bar.

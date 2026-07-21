---
title: "Pre-RAG Fundraising-Story Synthesis for Reach University — index, method, and how this changes once RAG/KAG lands"
lede: "Seven recurrent themes pulled by hand from the reach-edu funder corpus (539 files across 57 funders), each framed as a fundraising story with its aligned funder cluster and cited proof points. This is the starter the operator asked for while proper retrieval (remote filesystem + SurrealDB vector/graph) is still a few days out — and an honest note on what synthesis looks like now vs. once RAG/KAG is real."
date_authored_initial_draft: 2026-06-18
date_authored_current_draft: 2026-06-18
date_last_updated: 2026-06-18
at_semantic_version: 0.0.1.0
status: Draft
augmented_with: Claude Code (Opus 4.8, 1M context)
category: Narrative Synthesis
tags: [Narrative, Fundraise, Reach-University, Apprenticeship-Degree, Funder-Fit, Pre-RAG, Corpus-Synthesis, reach-edu]
authors:
  - Michael Staton
date_created: 2026-06-18
date_modified: 2026-06-18
from: "dididecks-ai/reach-edu-hub"
from_path: "context-v/narratives/pre-rag-synthesis/README.md"
---
# Pre-RAG Fundraising-Story Synthesis for Reach University

> **What this is.** A hand-built, read-now synthesis of the recurrent *themes* in the
> reach-edu funder corpus, framed as **fundraising stories** — each one a thesis Reach can
> tell, the cluster of funders it resonates with, and the cited proof points that make it
> credible. The operator asked for a *starter* while real retrieval (remote filesystem +
> SurrealDB, vector + graph) is still days out. This is that starter.
>
> **Provenance note — this crosses two siloed repos.** The narratives live in
> `dididecks-ai/client-sites/reach-edu-hub/` (the deck surface). The source corpus lives in
> `augment-it/clients/reach-edu/corpus/` (the private research store). reach-edu is the one
> client that spans both repos, so every citation below is a path *into augment-it*. When the
> remote-filesystem RAG lands, that cross-repo path becomes a retrieval handle instead of a
> hardcoded relative path.

## The client, in one paragraph (so the stories make sense)

Reach University is the nation's first nonprofit university built entirely around the
**apprenticeship degree** — it "turns jobs into degrees." Learners earn a real, accredited
degree *while employed*, get academic credit for work done on the job, are *paid by their
employer* as they study, and finish with **no student-loan debt** (~$900/yr, ~$75/mo
out-of-pocket after grants). It proved the model in **teaching** (420+ K-12 systems, 8+
states; the U.S. teacher apprenticeship degree) and is now expanding into **behavioral
health and healthcare** via the Apprenticeship College of Health (with the SEIU Healthcare
1199NW Training Fund in Washington). Backbone org: the **National Center for the
Apprenticeship Degree (NCAD)**. Operating states: AL, AR, CA, CO, GA, LA, MS, TX, TN, WA.
*(Source: `the-goodness-web-foundation/...announcement-1m-grant...`, `ballmer-group-ii/...apprenticeship-college-of-health...`)*

## The seven stories (the index)

Each is its own file. They overlap deliberately — a single funder often sits in two or three
stories — because that overlap *is* the strategy: the funders at the intersection of two
stories are the warmest targets.

| # | Story | One-line thesis | Anchor funder cluster |
|---|---|---|---|
| 01 | [The Apprenticeship Degree Is a New Category](01-the-apprenticeship-degree-is-a-new-category.md) | Reach didn't build a program; it built a *category* of higher ed, and the field is converging on it. | Lumina, JFF, Strada, Charles Koch, Stand Together, Hearst, ECMC |
| 02 | [Teaching Already Proved It](02-teaching-already-proved-it.md) | The teacher-shortage fix is built, at scale, with evidence — fund the replication. | Schusterman, Walton, Morgridge, Gates Foundation, Greater Texas, state appropriations |
| 03 | [The Care-Economy Workforce Emergency](03-the-care-economy-workforce-emergency.md) | Behavioral health + healthcare have a talent pool hidden in plain sight; apprenticeship degrees unlock it. | The Goodness Web, Ballmer, Anschutz, Cohen, Quell, Jed/Todd Fisher, Trellis, Hearst, Lilly |
| 04 | [Economic Mobility Without the Debt](04-economic-mobility-without-the-debt.md) | The highest-ROI mobility intervention: a debt-free degree that raises earnings in place. | GitLab Fdn, Arthur Blank, Gates Fdn, UpMobility/Urban Institute, Arnold Ventures, Truist, Benwood, Kellogg |
| 05 | [Workers, Not Employers — Fixing the Broken Talent Marketplace](05-workers-not-employers.md) | The talent marketplace is broken; Reach turns incumbent workers into credentialed talent that *stays*. | Stand Together, Charles Koch, Schultz, JFF, Annie E. Casey, Strada, Hewlett |
| 06 | [Talent Hidden in Plain Sight — Place-Based & Rural Pipelines](06-place-based-and-rural-pipelines.md) | Degrees that don't require leaving town; build the local pipeline where the funder cares. | Zoma, ECMC, Gates Family, Daniels, Greater Texas, Sobrato, S.H. Cowell, Kenneth Rainin |
| 07 | [The AI-Era Learning Institution](07-the-ai-era-learning-institution.md) | As AI reshapes the job pyramid, work-embedded learning is the durable advantage. | GitLab Fdn, Charles Koch, Chan Zuckerberg Initiative (+ inbox future-of-work corpus) |

## How these themes were derived (the method — be skeptical of it)

This was **human-style synthesis, not retrieval**, and you should treat it accordingly:

1. **Full structural scan.** Every funder directory and all 539 file *titles* were read, plus
   tag/url frontmatter. The corpus is unusually coherent — titles alone cluster cleanly.
2. **Strategic deep reads.** A small, deliberately-chosen sample of bodies was read in full —
   the files most likely to carry the load-bearing language and figures (the Goodness Web $1M
   behavioral-health announcement; the Ballmer/Training Fund Apprenticeship College of Health
   launch; the Hearst "Donor's Guide to Apprenticeships"; the inbox apprenticeship-philanthropy
   essays; the DC "Turning Jobs Into Degrees" event attendee list).
3. **Theme clustering by hand.** Recurrent funder priorities were grouped into the seven
   stories above, each cross-referenced to the funders whose titles/bodies evidence that
   priority.

### What that means for trust

- **Recall is title-driven.** I have *not* read all 539 bodies. A funder whose title is
  generic ("Focus Areas", "Just a moment...", a Cloudflare/Vercel challenge page) but whose
  body is rich may be under-weighted or missed. ~30+ files are junk/blocked pages
  (`Robot Challenge Screen`, `Access Denied`, `Vercel Security Checkpoint`, `Just a moment...`)
  and contribute nothing — see the First-Pass corpus-quality plan.
- **Dollar figures** are cited only where they appear in a title or a body I actually read.
  Where a figure would strengthen a story but I haven't verified it, the story says so.
- **Risk of folklore.** Where I describe a funder's priorities from a title alone, my prior
  knowledge of that funder may have leaked in. Each story flags claims that need a body-level
  read before they go in front of a funder.

## Now vs. once RAG/KAG is real — the comparison the operator asked for

The operator's actual question: *"curious how you would synthesize it now vs. once the
RAG/KAG is properly set up."* Here is the honest answer.

### Synthesis **now** (what you're reading)

- **Strength:** fast, holistic, narrative-first. A human strategist wants *stories with an
  arc and a funder cluster*, and that's exactly what hand-synthesis is good at. Cross-funder
  pattern-matching ("six funders are all really funding the same care-economy thesis") is
  natural here and hard to get from naive retrieval.
- **Weakness:** no per-claim grounding (I assert "Anschutz funds mental health at scale" from
  *one* file); recall bounded by what I read; no quantitative funder-fit ranking; no
  contradiction detection; can't cite the exact passage a claim rests on. It is a *best-guess
  map*, not an evidenced one.

### Synthesis with **RAG (vector retrieval over the remote filesystem + SurrealDB)**

- Every claim becomes **traceable to a chunk** — which is exactly the deck's moat per
  `augment-it/.../The-Moat-Is-Grounded-Deliverable-Production-Not-Chat.md`: a slide cites a
  source, and the citation resolves to a real passage.
- **Better recall** (semantic, not title-driven): "which funders fund behavioral-health
  *workforce* (not just mental-health services)?" returns the bodies, including the ones with
  generic titles.
- **Funder-fit as a query, not a guess:** "funders who fund work-based learning AND give
  unsolicited AND have given >$1M" → a ranked, cited list, re-runnable as the corpus grows.
- These seven hand-built clusters become the **eval set**: the query→expected-source pairs the
  First-Pass plan calls for (`Best-Way-to-RAG-Over-the-Corpus.md` §eval). If retrieval can't
  rediscover "the care-economy cluster," the index isn't ready.

### Synthesis with **KAG (knowledge/graph augmentation in SurrealDB)**

- Model **funder → theme → grant → grantee → outcome → geography** as entities and edges. Then
  the stories stop being prose and become *queries*:
  - **Warm-intro pathfinding:** funders one or two hops from Reach's *existing* funders who
    fund the *same* theme.
  - **Whitespace:** themes funded by ≥3 corpus funders where Reach has *no* relationship yet.
  - **De-dup:** the same gift reported by ProPublica + the funder's site + a news outlet
    collapses to one node (the corpus is full of these triplicate "990 / LinkedIn / news"
    sets — see Zoma, Mae, judy-dimon).
  - **The multivariate map:** funder geography × funded theme on one canvas — which is
    literally the payoff slide in `narratives/pipeline-building-automation.md` (Slide 11).
- The narratives here are the **hand-drawn version of what those graph queries should
  generate.** They're the validation target: does the graph reproduce them, then exceed them?

### Net recommendation

Use these seven stories *now* — to scope the deck, to brief the team, to prioritize outreach.
When RAG/KAG lands, **don't throw them away**: promote them to the eval/gold set and let
retrieval (a) re-ground every claim to a citable chunk and (b) surface the funders this
title-level pass under-counted. The hand-synthesis is the hypothesis; RAG/KAG is the test.

## See also

- `augment-it/clients/reach-edu/corpus/` — the source corpus (private; lives in the other repo).
- `augment-it/context-v/plans/First-Pass-Corpus-Quality-Scan-for-reach-edu.md` — the quality
  baseline; explains the junk/blocked-page caveats and the inbox-as-primary-source stance.
- `augment-it/context-v/explorations/Funder-Fit-Engine-Org-Corpora-and-the-Story-Unlock-Cycle.md`
  — the "story unlock cycle" this synthesis is a manual first turn of.
- `narratives/pipeline-building-automation.md` — the sibling deck outline (the Lossless-side
  automation story); Slide 11's multivariate map is the KAG payoff referenced above.
</content>
</invoke>

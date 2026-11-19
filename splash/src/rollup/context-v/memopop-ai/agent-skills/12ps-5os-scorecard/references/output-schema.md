---
from: "memopop-ai"
from_path: "context-v/agent-skills/12ps-5os-scorecard/references/output-schema.md"
---

# Output Schema — Event-Sourced Snapshots, New Information, and Aggregation

This file defines the **artifact** the skill emits: an append-only sequence of scored
snapshots per evaluator, indexed by the *events* that influenced their judgment, plus a
deal-level aggregate. The design goal is that belief-revision is itself retraceable — the
journey of how a view formed and changed, not just the final score, is preserved as data.
Read this before emitting anything.

Firm-specific identity (member names, firm name, event vocabulary) lives in
`firm-metadata.md` and in the runtime dialogue — never hardcode it. Names used below
(illustrative only) are placeholders for "each IC member."

## Core model: evaluators, events, snapshots

- **Evaluator** — one who scores. Each human IC member is an evaluator; each member's
  paired LLM is a *separate* evaluator (the LLM paired to one member's session is not the
  same evaluator as the same model paired to another member — different conditioning).
- **Event** — anything that can influence judgment between two snapshots: independent prior
  (no event), LLM dialogue, a management meeting, an expert/diligence call, IC discussion,
  a data-room review, a follow-on founder call, etc. Events are typed from an
  extensible vocabulary (see `firm-metadata.md`).
- **Snapshot** — an evaluator's scored state at one point in the journey: the scores,
  weights, rationale, and — for any snapshot after the first — the **new information** that
  entered at that event and the revisions it drove. A snapshot is **immutable once written**.

**When the paired LLM snapshots.** The LLM is an evaluator only when it is actually in the
dialogue: it scores at `Prior` (independent blind read) and at events that *are* LLM dialogue
(`AfterLLM`, or a follow-on discussion the human initiates about a prior event). It does NOT
auto-score events it wasn't part of — a management meeting or expert call is between the human
and the outside world, and re-scoring on the human's secondhand summary would only echo the
human's framing, contaminating the independence the tool protects. Consequently a human's
journey and their LLM's journey may differ in length and in which events they contain. Per-
evaluator sequence numbers simply diverge; that is correct and is itself data.

An evaluator's journey is an **append-only sequence**: `00-Prior` (independent, no event),
then `NN-After<Event>` snapshots as influencing events occur. The deal accretes over time —
the skill supports both creating a Prior and appending a later event-snapshot to an existing
deal, recomputing the aggregate each time.

## New information is the primary object at each event

At every after-snapshot, capture the **new information** the event introduced — the facts,
observations, claims, or data the evaluator didn't have before — provenance-tagged, and
captured *whether or not it moved any score*. Then capture the revisions that information
drove. This ordering matters:

- New information that **moved** a score → an evidence-driven revision (link the item to the
  specific fact).
- A score that moved with **no** new information → a judgment/gut update; label it honestly
  as such (not lesser — just different, and worth distinguishing for later analysis).
- New information that **moved nothing** → still logged. "Information that failed to move the
  needle" (an expert confirmed a prior belief; a concern was raised and discounted) is data.

The agent must **actively elicit** this at each after-snapshot: it knows which scores changed
(the prior snapshot is on file), so it walks each changed item and asks what specific new
information drove it, persistently but not naggingly. If the evaluator can't articulate a
reason, record "influence not captured" or label it a gut update — never fabricate a reason.

## Filenames (flat, greppable, sortable)

Deal-level aggregate:
```
YYYYMMDD_<DealName>--12ps5os-Scorecard.<json|csv>
```
Per-evaluator, per-event snapshot:
```
12ps_score--<Evaluator>_<NN-Event>.<json|md>
```
Examples (illustrative evaluator labels only):
```
20260819_Profile-Health--12ps5os-Scorecard.json      # deal aggregate
20260819_Profile-Health--12ps5os-Scorecard.csv       # flat rollup, one row per evaluator-event-item
12ps_score--MemberA_00-Prior.json
12ps_score--MemberA-claude-opus-4-8_00-Prior.json    # that member's paired LLM
12ps_score--MemberA_01-AfterLLM.json
12ps_score--MemberA_02-AfterMgmt.json
12ps_score--MemberA_03-AfterExpert.json
12ps_score--MemberA_04-AfterIC.json
12ps_score--MemberB_00-Prior.json
...
```
- Numeric `NN` prefix keeps the journey ordered and legible; `00` is always Prior.
- LLM evaluator label is `<member>-<model-id>` (real model id, e.g. `claude-opus-4-8`, for
  honest provenance — a later model is correctly a different evaluator).
- Event labels come from the firm's vocabulary; standard set: `Prior`, `AfterLLM`,
  `AfterMgmt`, `AfterExpert`, `AfterIC`. Firms may extend it in `firm-metadata.md`.
- Not every evaluator has the same events (one member takes the expert call, another
  doesn't). That asymmetry is itself data — don't force parity.

## One file per snapshot

Each snapshot is its own file (many small, greppable, easy to append). Do not consolidate an
evaluator's phases into one file — flat-per-snapshot matches the naming convention and feeds
the CSV rollup cleanly.

## Snapshot JSON (the structured spine)

```json
{
  "artifact_type": "scorecard_snapshot",
  "schema_version": "3.0",
  "deal": { "name": "Profile Health", "slug": "profile-health", "date": "2026-08-19" },
  "evaluator": {
    "label": "MemberA",
    "type": "human",                       // human | llm
    "model_id": "",                        // set for llm evaluators
    "paired_with": ""                      // for llm: the member label it was paired to
  },
  "event": {
    "seq": 1,                              // 0 = Prior; increments per event
    "label": "AfterLLM",                   // from firm vocabulary
    "prior_snapshot": "12ps_score--MemberA_00-Prior"   // null for Prior
  },
  "workflow": "co-deliberation",           // anchored | co-deliberation | elicitation
  "granularity": "default",                // default (O-level) | precision (P-level)
  "stage": "seed",
  "o_weights": { "origins": 1.0, "opening": 1.0, "organization": 1.0, "offering": 1.0, "opportunity": 1.0 },
  "o_scores":  { "origins": 4, "opening": 3, "organization": 4, "offering": 4, "opportunity": 2 },
  "weighted_rollup": 3.4,                  // summary, never a verdict
  "new_information": [                      // empty for Prior; the heart of an after-snapshot
    {
      "fact": "CTO walked through their inference-optimization stack unprompted.",
      "source": "management meeting 2026-08-19",
      "affected_items": ["organization"],
      "moved_score": true
    },
    {
      "fact": "Expert confirmed the incumbent's data moat is weaker than assumed.",
      "source": "expert call — named domain expert",
      "affected_items": [],
      "moved_score": false                 // logged even though it moved nothing
    }
  ],
  "revisions": [                           // items whose score changed vs. prior_snapshot
    {
      "item": "organization",
      "prior_score": 3,
      "new_score": 4,
      "update_type": "evidence",           // evidence | judgment (honest gut-vs-fact label)
      "influence": "CTO demo showed the team is deeper than the deck implied.",
      "influence_ref": "management meeting 2026-08-19"
    }
  ],
  "items": [                               // full current scores with rationale (all Os; Ps in precision)
    {
      "kind": "o", "id": "organization", "name": "Organization",
      "weight": 1.0, "weight_changed_from_default": false, "weight_rationale": "",
      "score": 4, "rationale": "...", "source": "...",
      "open_questions": ["Who owns go-to-market if the technical founder stays in the build?"]
    }
  ],
  "frozen": true                           // snapshots are immutable once written
}
```

Notes:
- **Prior** snapshots have `new_information: []` and `revisions: []` — they're the independent
  baseline. Everything after references its `prior_snapshot` and records what moved and why.
- `update_type` is the evidence-vs-judgment label, derived from whether new information backs
  the move. Keep it honest; gut updates are real and recorded as gut updates.
- Offering stays a holistic coherence read (no native Ps) even in precision mode.
- `weighted_rollup` is a weighted mean, explicitly analytical substrate — never a verdict.

## Markdown snapshot (human-readable, optional alongside JSON)

Same content as the JSON, readable: a header (deal, evaluator, event, stage, workflow), the
scores table, the new-information list with provenance, the revisions with influence, and the
narrative. Frontmatter mirrors the JSON keys so MD and JSON stay parallel; JSON is the spine.

## CSV rollup (flat, for aggregation and analysis)

One row per (evaluator × event × item). Columns:
```
deal_slug, deal_date, evaluator_label, evaluator_type, model_id, paired_with,
event_seq, event_label, workflow, granularity, stage,
item_kind, item_id, weight, score, update_type, influence, influence_source, prior_score
```
This is the "aggregate into a total" surface — it makes cross-evaluator, cross-event, and
over-time analysis a straightforward query (e.g. "which event types move scores most?").

## Deal aggregate

`YYYYMMDD_<DealName>--12ps5os-Scorecard.json` holds: deal metadata; the roster of evaluators
and which events each has snapshots for; a manifest of all snapshot files; and the current
per-evaluator latest scores. **Recompute it from whatever snapshots currently exist** each
time a new one is added — it's a derived view over the append-only log, never hand-edited.
The `.csv` aggregate is the flattened rollup described above.

## Destination is a runtime choice (files, CRM/DB, or both)

The emitting agent is context-aware: it **asks where output should go** — files
(JSON/CSV/MD/YAML), CRM/DB insertion, or both — and references other context (which deal,
which instance, existing records) to complete the task. This skill *produces* the artifact;
it does **not** write to any CRM itself. CRM/DB insertion is handed to the firm's dedicated
CRM skill, to which this skill provides the JSON/CSV payload as a clean, record-ready handoff.

## No verdict — schema-level guarantee

Nothing here stores an invest/pass recommendation or manufactured confidence. `weighted_rollup`
is a weighted mean of scores, explicitly analytical substrate. Evaluators decide; artifacts inform.

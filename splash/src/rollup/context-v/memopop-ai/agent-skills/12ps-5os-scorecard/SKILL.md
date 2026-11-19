---
name: 12ps-5os-scorecard
description: "Runs a guided dialogue with a VC professional to snapshot evaluative judgment as it evolves — across time, growing knowledge, and outside influence — so that belief-revision is itself retraceable. Captures a partner's independent read, then how it shifts under LLM dialogue, outside thought partners, and firm discussion; the journey of revision, not just the final score, becomes data. Built on the '12Ps within 5Os' framework — five dimensions (Origins, Opening, Organization, Offering, Opportunity), each informed by twelve underlying Ps. Use whenever a user wants to score, evaluate, or run first-pass diligence on a startup, deal, or investment; mentions the '12Ps', '5Os', 'scorecard', or 'deal scoring'; shares a pitch deck and asks how it stacks up; or is prepping for investment committee. Always establish stage first and choose a workflow (anchored / co-deliberation / elicitation). Produces a scorecard artifact only — never an invest/pass verdict."
from: "memopop-ai"
from_path: "context-v/agent-skills/12ps-5os-scorecard/SKILL.md"
---
# 12Ps within 5Os — Early-Stage Scorecard

This skill helps an investing partner produce a rigorous, honest scorecard for one
early-stage deal. It treats the partner and their paired LLM as *independent evaluators*,
captures each one's judgment at distinct phases of deliberation (independent → post-pair),
and preserves their views separately — so belief-revision is itself retraceable. The output
is a structured, frozen-per-phase artifact designed to pool with other evaluators' cards for
a firm-wide, bottoms-up decision. A guiding principle throughout is decision science:
protect the partner's independent judgment from anchoring, and value a diversity of
independent estimates.

**What this skill does NOT do:** It does not tell anyone whether to invest. It produces
scores, weighted roll-ups, rationale, and open questions — the analytical substrate for a
decision — but never a PASS/INVEST verdict and never a manufactured confidence level.
Investors decide; the model informs. Frame Claude's contributions as *a view on the
record to be argued with*, never as the answer.

## The framework in one breath

Five O's, each answering a question, each informed by three P's:
- **Origins** — "Why would anyone care about you?" (Persona, Pain, Proposition)
- **Opening** — "How big is the problem and how can they compete?" (Problem, Possibility, Positioning)
- **Organization** — "Who is this company?" (People, Process, Product)
- **Offering** — synthesis: how coherently Proposition + Positioning + Product line up
- **Opportunity** — "Is this worth our investment?" (Potential, Progress, Plan)

## Bundled references

- `references/12ps-5os-rubric.yaml` — **source of truth** for dimension definitions,
  evaluation questions, evidence sources, red flags, and 1–5 rubrics. Read before scoring.
- `references/12ps-5os-rubric.md` — human-readable rubric + blank worksheet.
- `references/firm-metadata.md` — **read at the start of every run.** Firm name and
  default weights. The one file to edit to re-home the skill to another firm.
- `references/stage-lens.md` — **read after establishing stage.** Adjusts what each score
  requires by round (pre-seed / seed / Series A).
- `references/output-schema.md` — **read before emitting files.** Evaluator-pair identity,
  the event-sourced snapshot model, filenames, the new-information capture, JSON+CSV+aggregate,
  and the runtime file/CRM/both destination handoff.

## Workflow

### Step 0 — Orientation (show on first use; offer to skip for repeat users)

If this looks like the partner's first run (they seem unfamiliar, ask what the tool does, or
you have no signal they've used it), read the firm name from `references/firm-metadata.md`
and open with a brief orientation. If they clearly know the drill, offer to skip it:
"Want the 30-second intro, or jump straight in?" Don't force the preamble on a repeat user —
that becomes its own friction.

Orientation to convey (in your own words, concise, firm name substituted):

> This is a guided dialogue that fills out a deal scorecard. Its purpose is to:
> 1. Give decision-science techniques a direct role in group investment decisions.
> 2. Foster group discussion and make team analysis more consistent across deals and over time.
> 3. Help make faster and possibly better-calibrated decisions on opportunities.
> 4. Preserve each partner's independent, un-anchored judgment, while
> 5. Leading to a clearer view of the group's judgment after discussion.
>
> Over time this builds: (A) a quantitative, analyzable dataset that sharpens how the firm
> decides, and (B) clearer links between what was observed at decision time and how the
> investment actually performed — quantifying the nuanced judgment calls that are usually
> lost as ephemeral, qualitative discussion. If [FIRM] sticks with it, the tool gets better,
> the data gets better, and the decisioning gets better.

Two honesty notes to preserve when delivering this — do not oversell:
- **"Faster" is a choice, not a guarantee.** The tool can be fast (anchored mode) OR rigorous
  (co-deliberation, which is deliberately slower). Say so. Don't imply rigor is also fast; a
  partner who expects speed and hits a long co-deliberation session loses trust in the tool.
- **The payoff is conditional.** The long-term dataset benefits only accrue if the firm uses
  the tool consistently. Frame (A) and (B) as "if the firm sticks with it," not as automatic.

**Acknowledgment gate.** After presenting the orientation to a first-time user, wait for an
explicit affirmative ("got it", "understood", "let's go", or similar) before moving to Step 1.
This is a deliberate opt-in: a partner who consciously affirms the premise — independent
judgment, no anchoring, the LLM as input not answer — is more likely to honor it. If they
respond with a question instead of an affirmation, answer it, then re-seek the go-ahead rather
than proceeding. Do not gate repeat users who chose to skip the intro; the acknowledgment is
part of onboarding, not a per-deal toll.

Then proceed to Step 1.

### Step 1 — Read firm metadata and establish stage (do not skip)

Read `references/firm-metadata.md` for the firm name and default weights. Then determine
the raise stage — pre-seed, seed, or Series A — because the same dimension is scored
against a very different bar by round (Opportunity is the clearest case). If the stage
isn't clear from what the user gave you, ask directly. Accept unusual answers (e.g.,
deep-tech pre-revenue Series A) and note them.

### Step 2 — Choose the WORKFLOW (this decides anchoring — ask before scoring anything)

This is a decision-science choice and it comes first, because it governs whether Claude is
allowed to expose the partner to its own scores. A revealed LLM score is an **anchor** that
biases the partner's judgment; the partner must consciously choose their exposure to it,
not have it imposed. **Do not score anything until the partner has picked a workflow.**

Present the three workflows plainly and let the partner choose:

- **Anchored (fast).** Claude gives its best-guess scores up front. The partner knowingly
  accepts anchoring in exchange for speed and low effort — "I'm short on time, give me your
  read, and I accept it'll frame my thinking." Legitimate when time is tight and the deal
  isn't contentious, *as long as it was chosen with eyes open*.
- **Co-deliberation (thorough — best practice).** Claude does NOT reveal its own scores
  first. It runs a guided process — questions, considerations, and co-research, chunked O by
  O — to help the partner form their own view to the firm's standard of rigor. Claude scores
  independently and **blind**, writes that read to its own folder without showing it, and
  reveals it only after the human has committed their Prior. This preserves a diversity
  of independent estimates (which decision science says produces better decisions) while
  still getting the value of Claude as a smart, independent thought partner.
- **Elicitation (partner-led).** The partner already has formed views and wants them
  captured. Claude does minimal independent scoring — it structures the partner's stated
  judgment into the artifact, asking clarifying questions but not injecting its own scores
  unless asked.

Record the choice in the `workflow` frontmatter field. It is orthogonal to granularity
(next step) — any workflow can run at O-level or P-level.

**The blindness in co-deliberation is procedural, not cryptographic.** Enforce it by
*sequencing*: generate and write the paired-LLM's Prior snapshot BEFORE eliciting the human's
Prior, and don't reveal the LLM's scores until the human has committed theirs. Be honest that
this is a sequencing guarantee within one session, not a cryptographic one.

### Step 3 — Choose the GRANULARITY

Offer the two granularities explicitly:
- **Default (O-level):** Score the five O's holistically, 1–5. The twelve P's are
  *considerations* that inform each O score — think through them, but don't rate each. Fast,
  and how most deals should be scored.
- **Precision (P-level):** Score the P's individually, 1–5, each weighted within its O,
  rolling up into the O score. Use when a deal warrants a more exacting discussion.
  **Offering stays holistic even in precision mode** — it's a coherence read across three
  borrowed P's (Proposition, Positioning, Product), not a weighted sum of native P's.

Default to O-level if they're unsure.

### Step 4 — Confirm weights (and capture the *why* on any change)

State the weighting plainly: **"The default weight for each factor is 1. The five O's each
weigh 1, summing to 5. Want to change that, or leave it equal?"**

If they leave it equal, proceed. If they change it:
- **Hold the invariant.** Weights are shares of a fixed pool that must sum to the factor
  count (5 for the O's; 3 for the P's within an O in precision mode). Let the partner
  express raw relative preferences however they like, then *normalize* so the tier sums
  correctly, and show them the normalized result. Never make them do the fractions by hand,
  and never store weights that break the sum.
- **Capture the rationale.** Whenever a weight moves off the default, ask *why* and record
  it as the weight's rationale — kept distinct from any score rationale. This is important:
  a weight change is where a partner's implicit investing thesis becomes explicit ("I weight
  Origins down at Series A because by then proof matters more than framing"). Surfacing that
  reasoning is a core purpose of this tool — it makes the partnership's cognitive diversity
  legible instead of leaving it implicit. Don't let a weight change pass without capturing
  the thinking behind it.

### Step 5 — Determine the event: new Prior, or appending to an existing journey?

The journey is **event-sourced** (see `references/output-schema.md`). Each evaluator's scores
are snapshotted at `00-Prior` (independent baseline) and again after each influencing event
(LLM dialogue, management meeting, expert call, IC discussion, etc.). So first determine what
this session is capturing:

- **A new Prior** — the evaluator's independent baseline for a deal not yet scored. Check
  whether any snapshots already exist for this deal; if none, you're creating the Prior.
- **An after-event snapshot** — appending to an existing journey. Load the evaluator's most
  recent snapshot as the `prior_snapshot`, identify the event (from the firm's
  `event_vocabulary`), and capture what the event changed. Ask which event this is if unclear.

Snapshots are **append-only and immutable** — never edit a prior snapshot; always write a new
one that references it.

### Step 6 — Capture the snapshot (Prior = independent; after-event = what moved)

**For a Prior snapshot**, run the workflow chosen in Step 2:
- **Co-deliberation:** Form the paired-LLM's Prior scores independently and write them
  **without revealing them**; guide the human to form their own Prior using questions and
  considerations, not the LLM's scores; reveal only after both Priors are committed. This
  preserves independence (procedurally, via sequencing).
- **Anchored:** Form and reveal the LLM's scores up front; capture the human's with that
  anchor present; do not label it independent.
- **Elicitation:** Capture the human's stated scores and rationale directly; the LLM scores
  minimally or not at all.

For every scored item record score + rationale + `source`. Distinguish researched/inferred
evidence from founder claims. If web search is available and the user agrees, research public
evidence (the rubric's `agent_context` lists topics) and tag it in `source`. **Never invent
evidence** — an unsupported item gets a low score with the gap named as an open question.

**For an after-event snapshot**, the event has introduced **new information** — make that the
primary object of capture (see the schema's "new information is the primary object"):
- Capture the **new information** the event introduced — facts, observations, claims, data
  the evaluator didn't have before — provenance-tagged, **whether or not it moved a score**.
  Information that confirmed a prior belief or was raised and discounted is still logged.
- You know which scores changed (the prior snapshot is on file), so **walk each changed item
  and actively elicit what influenced the change** — the specific fact/observation/argument,
  tied to the event. Persist but don't nag. This is the highest-value data in the artifact;
  it cannot be reconstructed later.
- Label each revision's `update_type` honestly: **evidence** (new information backs the move)
  vs. **judgment** (same facts, changed mind / gut update). Gut updates are real and recorded
  as gut updates — never fabricate a reason to make one look evidence-driven.
- **The paired LLM snapshots only when it is actually in the dialogue.** It scores at
  `Prior` (its independent blind read) and at any event that *is* an LLM dialogue (the
  standard `AfterLLM`, or a follow-on the human initiates — e.g. "let's talk through what the
  management meeting surfaced," which is its own LLM event). The LLM does **not** auto-score
  management meetings, expert calls, or IC discussions it wasn't part of: re-scoring on the
  human's secondhand summary would just echo the human's framing and contaminate the
  independence the tool exists to protect. If the human brings the LLM into a discussion about
  a prior event, treat *that* as an LLM event and snapshot it. The human's and the LLM's
  journeys can therefore differ in length and events — which honestly reflects who was in which
  conversation.

### Step 7 — Roll up and summarize (no verdict)

For each snapshot, compute the weighted roll-up: `sum(O_score × O_weight) / 5` on the 1–5
scale. In precision mode, first roll P's into each O (`sum(P_score × P_weight) / P_count`),
then O's into the top. **This number is a structured summary of the scoring, not a
recommendation.** Do not append a PASS/CONSIDER/COMMIT verdict or a confidence level.

Write a short narrative: the overall read, which O's matter most for this stage (per the
stage lens — carried in narrative, not by secretly reweighting), strengths, concerns, and —
for an LLM evaluator or where the LLM has a distinct view — the read clearly labeled as the
model's, to consider or discard.

### Step 8 — Emit the artifact (ask the destination first)

Be **context-aware about destination**: ask where the output should go — **files, CRM/DB, or
both** — and reference other context (which deal, which instance, existing snapshots) to
complete the task. Do not assume.

- **Files:** write each snapshot as its own file using the flat naming convention
  (`12ps_score--<Evaluator>_<NN-Event>.json`, with `.md` alongside when a readable form is
  wanted), plus the recomputed deal aggregate (`YYYYMMDD_<DealName>--12ps5os-Scorecard.json`)
  and the CSV rollup (one row per evaluator × event × item). Recompute the aggregate from
  whatever snapshots currently exist. Package as a downloadable bundle, or write to disk if
  running in Claude Code against a repo.
- **CRM/DB:** this skill does **not** write to any CRM itself. Produce the JSON/CSV payload as
  a clean, record-ready handoff and pass it to the firm's dedicated CRM skill, which owns the
  instance conventions, object mapping, provenance, and Notes-capture.
- **Both:** write the files and prepare the CRM handoff payload.

JSON is the structured spine; MD/YAML are readable mirrors; CSV is the aggregation surface.
Snapshots are immutable once written.

## Discipline tips for Claude (read these before running)

- **Workflow before scoring — the anchoring choice is the evaluator's, not yours.** Never
  reveal your scores until the IC member has chosen a workflow. In co-deliberation, generate
  your read blind and withhold it until they commit theirs. Silently anchoring the human
  defeats the decision-science purpose of the tool.
- **Stage before scoring, always.** If you're scoring without a known stage, stop and ask.
- **Never manufacture a verdict or confidence.** The evaluator decides; you inform. This is
  non-negotiable — VCs reject tools that pretend to make the call for them.
- **The LLM is an independent evaluator, not an oracle.** In co-deliberation the paired LLM
  gets its own snapshot and blind read — a smart colleague's independent estimate. Present it
  as one input to weight or discard, never as the answer.
- **Snapshots are immutable.** Once a snapshot is written, never edit it. New events produce
  new snapshots that reference the prior one. A mutated Prior is no longer independent.
- **New information is the primary object at each event.** Capture the facts/observations the
  event introduced — provenance-tagged — whether or not they moved a score. Information that
  moved nothing is still data.
- **Actively elicit what influenced each change.** You know which scores moved; walk each and
  ask for the specific influence, tied to the event. Persist but don't nag — this is the
  highest-value data and it can't be reconstructed later.
- **Label evidence vs. judgment honestly.** A move backed by new information is evidence; a
  move on the same facts is a judgment/gut update. Record gut updates as gut updates; never
  fabricate a reason to dress one up as evidence-driven.
- **Preserve divergence; don't blend.** Each evaluator (human and paired LLM) has their own
  snapshots; divergence is a diff between them. Honest separate positions beat one averaged
  mush — the disagreements are the most valuable part of the artifact.
- **Capture the *why* behind every weight change.** That's where an evaluator's implicit
  thesis becomes explicit. Keep it distinct from score rationale.
- **Evidence over assumption; name the source.** Distinguish what you researched from what the
  founder claimed. Flag gaps as open questions rather than filling them with confidence.
- **Honest spread.** Resist clustering at 3. A well-evidenced 1 or 5 is more useful to IC than
  a wall of safe middles.
- **Open questions are first-class.** They aggregate into the deal's diligence checklist
  downstream. Capture them per item, specifically.
- **Ask the destination.** Files, CRM/DB, or both — don't assume. This skill produces the
  artifact; the firm's CRM skill owns any CRM writes.
- **Scorecard, not memo, not synthesis.** Producing the snapshot(s) is done. Memo-writing and
  cross-evaluator roll-up are other skills.
- **Source of truth is the rubric file.** If this SKILL.md and the rubric disagree on a
  definition, the rubric wins.

## Handoff (design intent)

Each snapshot is an atomic, immutable unit of a bottoms-up firm decision. This skill owns
the **per-evaluator event-sourced journey** — every IC member and their paired LLM, from the
independent Prior through each after-event snapshot — plus the recomputed deal aggregate.

A separate **synthesis skill (not built here)** consumes a deal's snapshots — all evaluators,
all events — and produces the firm-level convergence: a **discussion agenda + diligence
checklist**, surfacing where evaluators agree (settle fast), where they diverge on score or
on weight (the heart of the IC conversation), how views moved event to event and what
information drove each move, and where the LLM reads were a distinct contribution worth
weighing or discarding. It may optionally produce an **evolution-of-position analysis**. This
skill's job is to make each snapshot rich, honest, retraceable, and cleanly poolable.

A separate **CRM skill** owns any CRM/DB writes. This skill produces record-ready JSON/CSV
and hands it off; it never writes to a CRM itself.

---
# ============================================================
# FIRM METADATA — the one file to edit when re-homing this skill
# ============================================================
# Everything firm-specific lives here. Swap this file and the whole
# scorecard re-homes to another firm without touching the framework
# or the workflow. The rubric and the SKILL.md are deliberately
# firm-agnostic.

firm:
  name: "HumainVC"
  scorecard_label: "12Ps within 5Os — Early-Stage Scorecard"

# ==========
# DEFAULT WEIGHTS
# ==========
# INVARIANT: within each tier, weights are shares of a fixed pool and
# MUST sum to the number of factors in that tier. Raising one factor
# lowers others; the total never changes. This keeps every partner's
# weights on the same scale so cross-partner comparison is meaningful.
#
#   - The 5 O-weights MUST sum to 5.
#   - Within precision mode, the P-weights inside a given O MUST sum to
#     that O's P-count (3 for Origins, Opening, Organization, Opportunity;
#     Offering is holistic and has no native P-weights — see note).
#
# These are the FIRM defaults. Individual partners may override them with
# their own vector (also sum-checked). The skill default, absent any edit
# here, is 1 for every factor (perfectly equal weighting).

o_weights:            # must sum to 5
  origins: 1.0
  opening: 1.0
  organization: 1.0
  offering: 1.0
  opportunity: 1.0

# P-weights only apply in precision mode. Each O's three P-weights must
# sum to 3. Offering is intentionally omitted: it is a holistic coherence
# read synthesizing Proposition, Positioning, and Product from other Os,
# not a weighted sum of native Ps.
p_weights:
  origins:            # must sum to 3
    persona: 1.0
    pain: 1.0
    proposition: 1.0
  opening:            # must sum to 3
    problem: 1.0
    possibility: 1.0
    positioning: 1.0
  organization:       # must sum to 3
    people: 1.0
    process: 1.0
    product: 1.0
  opportunity:        # must sum to 3
    potential: 1.0
    progress: 1.0
    plan: 1.0

# ==========
# FRAMEWORK ATTRIBUTION
# ==========
# (Intentionally omitted per firm preference. Add a line here if the
# firm later wants to record framework provenance.)
framework_attribution: ""

# ==========
# EVENT VOCABULARY
# ==========
# The journey is event-sourced: each evaluator's scores are snapshotted before any
# discussion (Prior) and again after each event that could influence judgment. This is
# the standard vocabulary; firms may extend it. Labels appear in snapshot filenames as
# NN-<label> (e.g. 01-AfterLLM). "Prior" is always seq 00.
event_vocabulary:
  - "Prior"          # 00 — independent baseline, no event
  - "AfterLLM"       # after human + paired-LLM dialogue
  - "AfterMgmt"      # after a management / founder team meeting
  - "AfterExpert"    # after an expert or diligence call
  - "AfterIC"        # after full investment-committee discussion
  # Add firm- or deal-specific events as needed, e.g. "AfterDataRoom", "AfterCustomerRef".

# ==========
# IC ROSTER (optional)
# ==========
# Optionally list IC members so the agent can address them by name at runtime. Illustrative
# placeholders shown; replace with the firm's members or leave empty to have the agent ask.
ic_members: []       # e.g. ["MemberA", "MemberB", "MemberC"]
from: "memopop-ai"
from_path: "context-v/agent-skills/12ps-5os-scorecard/references/firm-metadata.md"
---
# Firm Metadata

This file is the single source of firm-specific configuration for the
`12ps-5os-scorecard` skill. Edit the frontmatter above to change the firm
name, the default weighting, or to record framework attribution. The skill
reads this file at the start of every run.

## The weighting invariant, in plain terms

Weights are not absolute knobs — they are shares of a fixed pool. The five
O-weights always sum to 5; by default each O is 1 (equal weighting). If a
partner decides Origins deserves 0.7 instead of 1, the freed-up 0.3 must be
redistributed across the other four O's so the total stays at 5. The skill
handles this arithmetic automatically (it normalizes whatever raw preferences
a partner expresses), so no one does fractions by hand — but the stored result
always satisfies sum-to-5.

The point of the invariant is comparability: because everyone's weights sum to
the same total, one partner's 1.4 on People and another's 0.6 on People are
directly comparable statements about how much each cares — not artifacts of
different scales. That comparability is what lets the downstream synthesis
surface the team's cognitive diversity.

## Per-partner overrides

Individual partners weight things differently based on their own investing
thesis, and that is a feature, not noise. Partner weights live in each
partner's own scorecard output (captured at run time), not here. This file
holds only the firm-wide default that partners start from.

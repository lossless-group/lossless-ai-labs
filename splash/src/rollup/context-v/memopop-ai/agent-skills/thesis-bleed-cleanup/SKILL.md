---
title: "Thesis-Bleed Cleanup"
lede: "Multi-agent memo pipelines bleed the same powerful external finding into every section's writer. The same risk thesis ends up cited 6+ times across sections where it does not structurally belong. This skill names the failure mode and gives the editorial pass that confines a thesis to the sections it actually belongs in (typically Executive Summary + Risks + Closing Assessment) and replaces foreign invocations with section-native framing."
date_authored_initial_draft: 2026-06-14
at_semantic_version: 0.0.0.1
usage_index: 0
publish: false
category: Reference
tags: [Multi-Agent, Memo-Editing, Post-Processing, Risk-Framing, MemoPop, Orchestrator]
authors:
  - Michael Staton
augmented_with: "Claude Code (Opus 4.7)"
from: "memopop-ai"
from_path: "context-v/agent-skills/thesis-bleed-cleanup/SKILL.md"
---
# Thesis-Bleed Cleanup

## The failure mode

The MemoPop orchestrator generates each section independently via a per-section writer agent. Every writer agent sees the same shared `1-research/` corpus. When that corpus contains one disproportionately powerful external finding — a peer-reviewed conclusion, an analyst pull-quote, a regulator's warning — each writer agent independently decides it is the most important fact in the room and pulls it in as the section's *frame*.

Result: the same thesis appears as load-bearing argument in six or seven sections that should not be discussing it at all.

We saw this concretely on Panthalassa (`io/alpha-jwc/deals/Panthalassa-Deck-Series-B/outputs/Panthalassa-Deck-Series-B-v0.0.3`): the Springer Nature 2025 finding that "no Marine Energy technology has the capacity to become as ubiquitous as solar and wind, and in many cases the journeys from innovation to implementation have been or could be permanently stalled" was cited verbatim in Executive Summary, Risks, Diligence, Category Leadership, Colossal Market Size, Closing Assessment, and surfaced indirectly in CAGR and Counter-Cyclicality. Eight sections, one finding.

We call this **thesis bleed**.

## Why it happens

Three reinforcing causes:

1. **Shared research, independent writers.** Each section writer agent is run with no awareness of the *other* sections' draft content. There is no orchestrator-level deduplication of which external thesis a section can invoke.
2. **Salience asymmetry in the research corpus.** Peer-reviewed sources and named analysts carry disproportionate authority weight. A writer agent trying to ground its prose will reach for the most-cited-looking source first.
3. **No section-frame contract.** The outline (`templates/outlines/*.yaml`) tells writers what topic each section covers; it does not tell them *which external theses are legitimately load-bearing for that section* vs. which ones should be left to neighbouring sections.

## The rule the cleanup enforces

A powerful external thesis (risk, opportunity, regulatory threat, technology claim) belongs in **three structural homes at most**:

| Home | Role |
|---|---|
| Executive Summary | First framing — the thesis enters the memo here once, briefly. |
| The section whose *job* is that thesis | If it's a risk, it lives in Risks. If it's a market dynamic, it lives in Market Size. If it's a competitive moat, it lives in Category Leadership. **Exactly one** "main home" section. |
| Closing Assessment / Recommendation | Final framing — the thesis re-enters as part of the wrap. |

Every other section should treat that thesis as **out of scope**. The cleanup pass strips invocations from those sections and replaces them with *section-native framing* that answers the section's own question.

## The cleanup procedure

### 1. Identify the bleeding thesis

Ask the human: "Which thesis or finding is being over-invoked? Where does it legitimately belong?" (User input here is the cheapest, highest-quality signal — they wrote the section prompts and they read drafts. Do not try to detect bleed automatically.)

Record:
- A short tag for the thesis (e.g., "tidal-stalled-thesis")
- The verbatim source quote and citation key (e.g., `[^6]`)
- The 3 sections it legitimately belongs in (e.g., `00-executive-summary`, `01-risks`, `10-closing-assessment`)

### 2. Grep the section files

```bash
cd <output-dir>/2-sections
grep -in -E "<distinctive-keyword-1>|<distinctive-keyword-2>|<source-name>" *.md
```

Pick keywords that the bleeding thesis tends to carry — for Panthalassa, "permanently stalled", "ubiquitous as solar and wind", "Springer Nature". For each match, note the section file and line number.

### 3. Classify each match

For every match in a section *outside* the three legitimate homes:

- **Direct quote of the thesis** → strip and reframe (replace with section-native content).
- **Citation of the source as evidence for a different point** → keep, the source serving a *different* role is not bleed.
- **Verbal echo without citation** ("category remains unproven", "innovation-to-implementation barriers", etc.) → strip; these are the most insidious because they invoke the thesis without flagging it.

### 4. Rewrite to section-native framing

The replacement should answer *that section's own question*, not the bleeding thesis's question. Examples from Panthalassa v0.0.3:

| Section | Before (thesis-bleed) | After (section-native) |
|---|---|---|
| Category Leadership / Barriers to Entry | "Technology Uncertainty: what if the technology itself cannot achieve commercial viability?" | "Capital Opportunity Cost: $100M into offshore wind beats $100M into tidal on ROI math — defensibility comes from how punishing the alternative-allocation math is." |
| Colossal Market Size / TAM | "Significant academic skepticism exists regarding ocean energy's ubiquity potential…" *(paragraph deleted entirely)* | — *(replaced with nothing; the TAM section's job is sizing, not viability)* |
| Diligence / Sequencing | "If the academic consensus accurately describes permanent commercialization barriers…" | "Confirming that Panthalassa's approach has a credible path through ocean-energy adoption dynamics establishes the foundation for deeper diligence investment." |

The pattern: replace **inherited doubt** with **section-internal logic**. The category leadership section now talks about *capital opportunity cost* (a competitive-positioning concept) instead of *technology viability* (a risks concept).

### 5. Reassemble the final draft

The orchestrator's `4-final-draft.md` (or `7-<deal>-vX.Y.Z.md`) needs to be regenerated from the edited section files. Two paths:

- **Splice manually** (what we did for Panthalassa v0.0.3): identify the section boundaries in the assembled file by `grep -n "^## "`, replace the body of each affected section with the new `2-sections/*.md` content (minus per-section `### Citations` blocks), keep the consolidated citation footer intact.
- **Re-run reassembly only** via the orchestrator's citation enrichment / assembly step (does not require re-research).

If section edits did not add or remove citation references (`[^N]`), the consolidated citation footer at the bottom of the assembled file stays valid as-is.

### 6. Verify

```bash
python3 -c "
import re
with open('<assembled-draft>.md') as f: t = f.read()
for m in re.finditer(r'<distinctive-keyword>', t):
    line = t[:m.start()].count(chr(10)) + 1
    head = max(t.rfind('## ' + str(i) + '.', 0, m.start()) for i in range(1,11))
    print(f'L{line}: section starts at L{t[:head].count(chr(10))+1}')
"
```

Every remaining match should land in one of the three legitimate homes.

## When NOT to apply this skill

- **The thesis really is load-bearing in five sections.** Some theses (e.g., "this market is winner-take-all") legitimately ripple into multiple sections. The test is whether each invocation does *new analytical work* in that section, or whether it is a copy of the same paragraph. If it is doing new work, leave it.
- **The repetition is the user's deliberate framing choice.** Some memo authors want emphasis through repetition. Ask first.
- **You are mid-pipeline.** This skill is for *post-generation* cleanup. The upstream fix is to give writer agents per-section "off-limits external theses" guidance in the outline YAML, not to edit drafts.

## Upstream fix (eventually)

The right place to prevent thesis bleed is the section outline. Each section in `templates/outlines/*.yaml` could carry an optional field:

```yaml
sections:
  - number: 4
    name: "Category Leadership"
    out_of_scope_theses:
      - "Category viability / technology readiness — belongs in Risks"
      - "Capital efficiency — belongs in section 6"
```

Writer agents would receive this in their prompt and would treat those theses as off-limits. Until that's wired in, this cleanup skill is the manual backstop.

## Related

- [[Grill-Me-Per-Section-User-Input-Moment]] — the per-section human checkpoint pattern that, if extended, could surface bleed during generation rather than after.
- `apps/memopop-orchestrator/CLAUDE.md` §"Architectural direction (2026-05)" — the broader Retrieval/Generation split that, when complete, will give us cleaner control over what each writer sees.
- `apps/memopop-orchestrator/improve-section.py` — the per-section improvement entry point; a future flag could add a "bleed cleanup" mode.

---
name: person-schema
description: Canonical frontmatter shape for team/{slug}.md and portfolio/{slug}-ceo.md (CP1, CP2, CP4 outputs)
from: "dididecks-ai"
from_path: "context-v/agent-skills/crawl-fetch-ingest/schema/person.md"
---
# Person Schema

Used for all people regardless of checkpoint:
- `data/firms/{firm-slug}/team/{person-slug}.md` — CP1 (VC team), CP2 (advisors), supporting partners
- `data/firms/{firm-slug}/portfolio/{co-slug}-ceo.md` — CP4 (portco CEOs)

The shape is the same; `role_class` distinguishes them.

## Recognized `role_class` values

`role_class` is a **relationship category**, not a job title. Two people with different titles ("Partner" and "Principal") share the same `role_class: vc-team` if they're both full-time investing staff. The actual title goes in `title`; the deck-shown label goes in `deck_role_label`.

| Value | Meaning | Where typically found |
|---|---|---|
| `vc-team` | Full-time investing staff: partners, principals, associates, analysts. Default for the firm's core team. | Firm's `/team` page |
| `managing-partner` | Most senior firm leadership — the founders or top-of-pyramid partners. Distinct from `vc-team` because decks often render them separately ("Managing Partners" vs "Team"). | Firm's `/team` page, usually first |
| `venture-partner` | Part-time investing partner, typically a domain expert or successful founder. Sources deals, may sit on ICs, often gets carry. Distinct from `vc-team` (not full-time) and from `supporting-partner` (has formal investing role). | Firm's `/team`, `/venture-partners`, or `/partners` page |
| `operating-partner` | Full-time portfolio-support staff — operators (not investors) embedded at the firm to help portcos with talent, GTM, finance, etc. No investment authority. | Firm's `/team`, `/platform`, or `/operating-partners` page |
| `entrepreneur-in-residence` (EIR) | Temporary resident at the firm, typically a founder between ventures or building their next one with firm support. May or may not become a venture partner / vc-team member later. | Firm's `/team`, `/eir`, or `/residents` page |
| `supporting-partner` | Founder-mentor ecosystem — successful founders who informally advise + co-source. Rarely formal investing role; often unpaid or honorary. (Calm/Storm's term for this is canonical.) | Firm's `/support`, `/supporting-partners`, `/mentors`, or `/community` pages |
| `advisor` | LPAC, Advisory Board, or other formal governance role with fiduciary or oversight responsibility. | Firm's `/team` (separate "Advisors" section), `/lpac`, or `/board` pages |
| `portco-ceo` | CEO (or primary founder) of a portfolio company. | CP4 output, lives next to the company's `.md` |
| `external` | Person named in the deck who couldn't be confidently placed in any of the above. Last resort. | Tavily / external sources |

### Disambiguation tips

The line between several of these is fuzzy in practice. When uncertain:

- **`venture-partner` vs `supporting-partner`** — does the person have a formal investment role (carry, IC seat, deal lead)? If yes → `venture-partner`. If they're purely a founder-mentor / community member → `supporting-partner`. When the firm's own labeling is clear, defer to it.
- **`managing-partner` vs `vc-team`** — if there's a documented hierarchy and this person is at the top, use `managing-partner`. If the firm uses "Partner" uniformly, default everyone to `vc-team`.
- **`operating-partner` vs `vc-team`** — does the person make investment decisions? If no (they help portcos), → `operating-partner`. If yes, → `vc-team`.
- **`entrepreneur-in-residence` vs `venture-partner`** — EIRs are typically temporary and building their own venture; venture partners are continuing roles. If the firm's site says "EIR" → use it; promotion to venture-partner happens at re-fetch time.

Add new values sparingly. Idiosyncratic firm-specific labels ("Academy Partner", "Communication Partner", "Platform Lead", "Chief of Staff") should pick the closest existing `role_class` and preserve the firm's label in `deck_role_label` rather than spawn a new value.

## Frontmatter

```yaml
---
slug: alfred-lin                   # required, kebab-case
name: "Alfred Lin"                 # required
title: "Partner"                   # required if known, the person's current title at the firm
deck_role_label: "Partner"         # optional, the literal label from the source PDF (may differ from title)
role_class: vc-team                # required — see "Recognized role_class values" below for all 9 options
firm_slug: sequoia-capital         # required, links back to the firm
company_slug: null                 # for portco-ceo: the portfolio company they lead

headshot: ./alfred-lin.jpg         # optional, relative path to headshot in same dir
headshot_source: https://www.sequoiacap.com/people/alfred-lin/   # where the image was fetched from

profiles:                          # array of public profile URLs
  - type: linkedin
    url: https://www.linkedin.com/in/alfredlin/
  - type: twitter
    url: https://twitter.com/alfred_lin
  - type: firm-bio
    url: https://www.sequoiacap.com/people/alfred-lin/
  - type: personal-site
    url: null

bio_short: "Partner at Sequoia Capital, focused on consumer and marketplaces."   # one-line tagline (e.g. LinkedIn headline or first sentence of firm bio)

board_seats: []                    # optional, array of company names where they sit on the board

prior_roles:                       # optional, array of prior positions (best-effort from LinkedIn / firm bio)
  - title: "COO"
    org: "Zappos"

education: []                      # optional, array of {school, degree, year}

sources:                           # required, array of URLs that fed this record
  - https://www.sequoiacap.com/people/alfred-lin/
  - https://www.linkedin.com/in/alfredlin/
fetched_at: 2026-05-10T14:00:00Z   # required, ISO timestamp
confidence: high                   # high | medium | low | flagged
status: complete                   # complete | partial | unresolved | flagged
notes: ""                          # free-form, especially for low-confidence matches
---
```

## Body

Free-form. Default structure:

```markdown
## Bio

{Long-form bio paragraph from firm site or LinkedIn About section}

## Notable

- {Investments / portfolio companies they led}
- {Prior exits, IPOs, etc.}
```

## Confidence rubric

- **high** — Found on firm site or verified LinkedIn with name + title + headshot all matching
- **medium** — Found via search, plausible single match, but no firm-site cross-reference
- **low** — Partial data, common-name ambiguity, or asset hunt failed
- **flagged** — Should be reviewed before publishing. `status` should reflect what's missing.

## Slug rules

- Lowercase, kebab-case, ASCII only
- `firstname-lastname` for distinct names
- For ambiguous / common names, append a disambiguator: `john-smith-sequoia`, `jane-doe-advisor`
- Slug must be unique within a firm, not globally — the same person can appear under multiple firms with the same slug

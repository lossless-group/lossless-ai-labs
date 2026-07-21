---
name: firm-schema
description: Canonical frontmatter shape for firm.md (the firm-level metadata file)
from: "dididecks-ai"
from_path: "context-v/agent-skills/crawl-fetch-ingest/schema/firm.md"
---
# Firm Schema

`data/firms/{firm-slug}/firm.md`

Loosely enforced. Add fields freely; converge over time.

## Frontmatter

```yaml
---
slug: sequoia-capital              # required, kebab-case, matches dir name
name: "Sequoia Capital"            # required, display name
homepage: https://www.sequoiacap.com    # required
type: vc-firm                      # vc-firm | family-office | corporate-vc | accelerator | other
hq:                                # optional
  city: Menlo Park
  region: CA
  country: US
founded: 1972                      # optional, year
stages:                            # optional, array of stage strings as the firm describes them
  - Seed
  - Series A
  - Growth
sectors:                           # optional, array
  - SaaS
  - Fintech
  - Health
aum_usd: null                      # optional, number, assets under management in USD if known
linkedin: https://www.linkedin.com/company/sequoia-capital
twitter: https://twitter.com/sequoia
crunchbase: https://www.crunchbase.com/organization/sequoia-capital
logo: ./logo.svg                   # optional, relative path to logo asset in same dir
favicon: ./favicon.ico             # optional, relative path
brand:                             # optional, color tokens if Brandfetch / OG metadata returned them
  primary: "#1a1a1a"
  accent: "#cc0000"
sources:                           # required, array of URLs the data came from
  - https://www.sequoiacap.com
  - https://www.sequoiacap.com/our-companies/
fetched_at: 2026-05-10T14:00:00Z   # required, ISO timestamp of last fetch
confidence: high                   # high | medium | low | flagged
status: complete                   # complete | partial | unresolved
notes: ""                          # free-form
---
```

## Body

Free-form markdown. Typical contents:
- One-paragraph firm summary (from `og:description` or About page)
- Notable investments / case studies if surfaced during crawl
- Anything the human added during review

## Counts

The skill should append a counts section at the end of the body during ingest, e.g.:

```markdown
## Roster (auto-generated)

- Team members (CP1): 12
- Advisors (CP2): 3
- Portfolio companies (CP3): 47
- Portco CEOs (CP4): 47

Last updated: 2026-05-10
```

---
name: seo-skills Profile
slug: seo-skills
upstream: https://github.com/Illyism/seo-skills
package: "`npx skills add Illyism/seo-skills` (all 30, or `--skill <name>`); Claude Code and Cursor plugin manifests in `.claude-plugin/` and `.cursor-plugin/`; `gemini-extension.json` for Gemini CLI (MCP servers only); copy-paste from il.ly/skills for chat apps"
license: MIT (stated in README and plugin manifests; no LICENSE file in the repo)
maintainer: Ilias Ism (`Illyism`)
study: studies/agent-skill-packs
profile_path: studies/agent-skill-packs/seo-skills
profile_kind: domain-grouped marketing skill pack with plugin manifests, preconfigured vendor MCP servers, and paid-API workflows
title: "seo-skills — Profile"
status: Reference
authors:
  - Michael Staton
date_created: 2026-11-22
date_modified: 2026-11-22
site_uuid: f43d9c2b-a986-4801-82bb-526e8b1b9643
hex_code: h8z2ll
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
lede: >-
  Thirty SEO, content, copywriting, and marketing skills sold to founders and
  marketers on one promise: every skill ends in a merged PR or a file in the
  repo, not an audit PDF. Four domain folders, three plugin manifests, three
  preconfigured MCP servers, and a sponsor funnel to the author's own products.
summary: >-
  Source-cited profile of `Illyism/seo-skills` (pinned at a158c36, 2026-11-20,
  manifest version 1.3.0, MIT by statement only). Covers the four domain folders
  and how the README regroups them by job, the plugin manifests for Claude Code,
  Cursor and Gemini, the description-driven triggering, the connection-path
  decision trees and spend caps for Ahrefs and DataForSEO, the vendor skills
  copied from live URLs, and the README's marketing to non-developers. Ends with
  a comparison against lossless-agent-skills and a list of what to borrow.
publish: true
type: Profiles
from: "studies/agent-skill-packs"
from_path: "context-v/profiles/Profile__seo-skills.md"
---
# seo-skills — Profile

A profile of `seo-skills` as it lives in this study (`studies/agent-skill-packs/seo-skills/`, pinned at `a158c36`, 2026-11-20). Every claim cites a pinned path relative to the submodule. Read it alongside [[Profile__pstack]], [[Profile__mattpocock-skills]], and [[Profile__gstack]]. This entry is the study's outlier on audience: the other three packs are written by engineers for engineers, and this one is written for founders and marketers who happen to run a coding agent.

## TL;DR

- **30 skills in four domain folders.** `seo/` holds 20, `content/` 5, `marketing/` 3, `copywriting/` 2. The README headline says "30 open-source `SKILL.md` workflows" (`README.md:4`). Only two skills ship helper scripts (`seo/internal-linking/scripts/internal-link-graph.mjs`, `seo/domain-migration/scripts/verify-redirects.sh`); there are no `references/` folders, so every method is inlined, from 32 lines (`copywriting/understand-customers/SKILL.md`) to 314 (`seo/ahrefs-research/SKILL.md`).
- **One bet, stated everywhere:** output is a diff or a file, never advice. "Workflows that end in a merged PR or a file in your repo, not an audit PDF" (`README.md:4`); "Never stop at 'here is what I found'" (`seo/ahrefs-research/SKILL.md:12`); "Advice in a document is not work" (`seo/seo-autopilot/SKILL.md:27`).
- **Four install paths.** `npx skills add` (`README.md:28-37`), a Claude Code plugin manifest that points at the four folders (`.claude-plugin/plugin.json:25-31`), a Cursor plugin manifest with category, tags and logo (`.cursor-plugin/plugin.json:32-42`), and a `gemini-extension.json` that registers only the three MCP servers (`gemini-extension.json:5-18`). Chat users copy a skill from il.ly/skills (`README.md:46`, `README.md:172`).
- **Paid APIs degrade gracefully.** Ahrefs and DataForSEO each open with a "Step 0" tree: MCP tool, then environment variable, then a free fallback (`seo/ahrefs-research/SKILL.md:16-29`; `seo/dataforseo-serp/SKILL.md:16-27`), with unit or dollar caps (`seo/ahrefs-research/SKILL.md:48-54`; `seo/dataforseo-serp/SKILL.md:48`).
- **It is also a sales channel.** All seven sponsors are the author's own products (`README.md:146-158`), four skills are copies of those products' live `SKILL.md` files, and several method skills end by recommending LinkDR, AI SEO Tracker or GenPPT.

***

## Why this exists — the design bet

The bet: **marketers will hand SEO to a coding agent if each skill names its deliverable up front and ships it into the repo.** The README frames the pack against "prompt packs [that] produce checklists and health scores" and lists what lands instead: "rewritten titles and H1s, refreshed posts, `robots.txt` and bot rules, verified `301` maps, new `/vs/` routes" (`README.md:50-52`). The skills table's middle column is literally "What it ships" (`README.md:63`), and most descriptions lead with a file name: `seo/roast-roadmap.md` (`seo/seo-roast/SKILL.md:3`), `seo/reddit-serp-queue.md` (`seo/reddit-serp/SKILL.md:3`), `seo/outreach-batch-YYYY-MM-DD.md` (`seo/honest-link-outreach/SKILL.md:3`).

Two smaller bets ride on it:

- **Revenue order, not completeness.** `seo-roast` sorts work into tiers and refuses cosmetic fixes until the fatal tier is empty: "Nothing else ships until this tier is empty" (`seo/seo-roast/SKILL.md:21`), because "teams that fix fluff first feel productive while the blocker stays live for another quarter" (`seo/seo-roast/SKILL.md:30`). It must "Never open with a score out of 100" (`seo/seo-roast/SKILL.md:14`).
- **Rules carry their reasons.** The pack has 44 inline `Why:` lines, for example why Ahrefs calls must set `limit` ("one unbounded `top-pages` call on a large domain burns a monthly allowance", `seo/ahrefs-research/SKILL.md:51`).

***

## What's inside

```
seo-skills/                        (a158c36, manifests at v1.3.0)
├── README.md                      catalog, install, workflows, MCP, sponsors, FAQ
├── .claude-plugin/plugin.json     skills: ./seo ./content ./marketing ./copywriting
├── .cursor-plugin/plugin.json     same, plus category, tags, logo
├── gemini-extension.json          MCP servers only
├── .mcp.json                      aiseotracker, scribiz, awesome-tools (HTTP)
├── assets/                        hero, output collage, social preview images
├── seo/        (20)               seo-autopilot, seo-roast, blitz-seo, ahrefs-research,
│                                  dataforseo-serp, proof-kb, vs-and-alternatives,
│                                  internal-linking/scripts/, domain-migration/scripts/,
│                                  seo-title-optimization, blog-refresher, block-ai-scrapers,
│                                  aiseotracker, ai-seo-report, content-coverage, reddit-serp,
│                                  directory-submissions, linkdr, honest-link-outreach,
│                                  awesome-tools
├── content/    (5)                unslop-seo, seo-blog-images, youtube-seo, intro (+examples.md),
│                                  scribiz
├── marketing/  (3)                customer-journey, diff-marketing, parasite-and-pr
└── copywriting/(2)                understand-customers, blitz-copy
```

The pinned clone is a single commit (`git rev-list --count HEAD` returns 1), so the history behind it is not readable here.

***

## How it scores against the study checklist

### Shape: domain folders on disk, job categories in the README

The folders are by domain, but the README regroups the same 30 skills by job: "Technical, research, and on-page", "AI search (GEO)", "Links and directories", "Content and distribution", "Copywriting" (`README.md:61`, `:78`, `:88`, `:97`, `:109`). The two views disagree: `customer-journey` sits in `marketing/` but is listed under AI search (`README.md:82`), and vendor skills like `linkdr` and `awesome-tools` sit in `seo/`. The folders exist mainly so the plugin manifests can name four skill roots (`.claude-plugin/plugin.json:25-30`); the reader-facing taxonomy is the README's.

Engineering skills are split into a separate pack, pointed to in one line: "For engineering skills (AI evals, Chrome Web Store releases), see Illyism/dev-skills" (`README.md:116`). The author keeps audiences in separate repos rather than mixing them in one table.

### Layers: no principles layer; chaining lives in the README and in a shared `seo/` folder

There is no `principle-*` tier as in pstack. Cross-references between skills are rare. The ones that exist are one-liners: `intro` "Works on its own or after title work (see the `seo-title-optimization` skill)" (`content/intro/SKILL.md:18`); `honest-link-outreach` uses Ahrefs "If `AHREFS_API_KEY` is set or the `ahrefs-research` skill is installed" (`seo/honest-link-outreach/SKILL.md:20`); `seo-roast` hands AI-crawler blocking to "the block-ai-scrapers skill" (`seo/seo-roast/SKILL.md:74`).

Composition happens in two other places:

1. **Named workflows in the README.** Six chains, such as "Win buyers leaving a competitor. `ahrefs-research` → `vs-and-alternatives` → `reddit-serp` → `honest-link-outreach`" (`README.md:118-127`).
2. **A shared filesystem contract.** Skills read and write under `seo/` in the user's repo: `seo/data/ahrefs/` (`seo/ahrefs-research/SKILL.md:44`), `seo/data/serp/` (`seo/dataforseo-serp/SKILL.md:39`), `seo/kb/` (`seo/proof-kb/SKILL.md:3`). `seo-autopilot` is the closest thing to an orchestrator. It has "no memory between runs. All of it lives in `seo/`", and it lists the state files (`context.md`, `keyword-map.csv`, `backlog.md`, `log.md`, …) and the daily, weekly and monthly cadence (`seo/seo-autopilot/SKILL.md:29-46`).

### Install: one command, three manifests, one paste path

| Target | Mechanism | Source |
|---|---|---|
| Any Agent Skills harness | `npx skills add Illyism/seo-skills`, `--skill <name>`, `--list` | `README.md:28-37` |
| Claude Code | `-a claude-code`, or the plugin manifest | `README.md:43`; `.claude-plugin/plugin.json:1-32` |
| Cursor | `-a cursor`, or the plugin manifest with `category: marketing` and a logo URL | `README.md:44`; `.cursor-plugin/plugin.json:32-42` |
| Codex, OpenCode, Windsurf, Cline, Roo Code | `.agents/skills/` | `README.md:45` |
| Gemini CLI | extension file with MCP servers, no skills listed | `gemini-extension.json:1-19` |
| ChatGPT, Claude.ai, Perplexity, Grok | copy the Markdown from il.ly/skills | `README.md:46` |

Both plugin manifests also wire `"mcpServers": "./.mcp.json"` (`.claude-plugin/plugin.json:31`), so installing the plugin connects AI SEO Tracker, Scribiz and Awesome Tools (`.mcp.json:1-16`). The version string `1.3.0` is kept identical across all three manifests (`gemini-extension.json:3`; `.claude-plugin/plugin.json:3`; `.cursor-plugin/plugin.json:3`). Individual skills carry their own `metadata.version`, nearly all at `1.0.0`.

### Triggering: "what it ships" plus "Use when" plus quoted phrases

The README explains progressive disclosure to non-developers: "The agent reads only the `name` and `description` at startup and opens the full file when your prompt matches" (`README.md:39`). Descriptions follow one template: deliverable first, then `Use when`, then the user's likely words in quotes. `seo-roast` fires on "roast my SEO", "why don't we rank", "audit my site" (`seo/seo-roast/SKILL.md:3`). The vendor skills add a second trigger, a URL: "Trigger on … or when the user asks you to fetch or run https://linkdr.com/SKILL.md" (`seo/linkdr/SKILL.md:3-9`). One description has no trigger clause at all (`seo/awesome-tools/SKILL.md:3`).

Explicit invocation is taught as the norm. Every row in the skills table has an example prompt that names the skill in backticks (`README.md:63-114`), and the FAQ says "You can also name it" (`README.md:168`). Three skills specify first-run behavior: state the connection path and workflow, then run; "On repeat use, go straight to the output" (`seo/ahrefs-research/SKILL.md:14`; `seo/dataforseo-serp/SKILL.md:14`).

### Sync: not a mirror, but four skills are copies of live vendor files

The pack is upstream, not a fork. Its sync problem is the vendor skills. `linkdr` opens: "This is a copy of linkdr.com/SKILL.md v1.10.0. Fetch the live file before you quote prices. If its version is newer than this one, follow the live file" (`seo/linkdr/SKILL.md:26`). It also checks completeness: "The file is complete only if the last line is page end `END SKILL v1.10.0`" (`seo/linkdr/SKILL.md:28`, sentinel at `:279`; same pattern in `seo/aiseotracker/SKILL.md:22`, `:134`). The frontmatter `source:` field points each skill at its canonical web copy, `il.ly/skills/<name>` for 24 of them (`content/intro/SKILL.md:7`).

***

## Paid APIs and credentials

The two paid-data skills share one structure:

| | Ahrefs (`seo/ahrefs-research/SKILL.md`) | DataForSEO (`seo/dataforseo-serp/SKILL.md`) |
|---|---|---|
| Order of preference | MCP tool, then `$AHREFS_API_KEY`, then CSV export (`:16-27`) | MCP tool, then `$DATAFORSEO_LOGIN`/`$DATAFORSEO_PASSWORD`, then web search (`:16-27`) |
| No-credentials path | Ask the user to export the report as CSV and continue "from the Filter step" (`:23-27`) | Under 10 queries, record top-10 URLs by hand and tag `source=websearch`; at 10 or more, "stop and ask for DataForSEO credentials" (`:24-26`) |
| Why that order | "CSV is slow but keeps the workflow alive when the user has a UI seat and no API plan" (`:29`) | Web search is "personalized and unstable" and wrong for clustering (`:29`) |
| Spend control | Unit formula, `limit` default 100 and never over 500 without OK, minimal `select`, 7-day cache (`:48-54`) | Read `.tasks[0].cost`, keep a running total, stop at the user's budget or `$5` (`:48`) |
| Credential handling | Shell helper reads the env var at call time (`:37-43`) | Basic auth from env vars in a shell helper (`:34-38`) |

Neither skill writes a key to disk or ships a `.env` template; the key is assumed to already be in the environment. DataForSEO also guards against bad data that looks good, a "Poisoned SERP" check for 200 responses that hide brand domains (`seo/dataforseo-serp/SKILL.md:46`).

The author's own services avoid keys. AI SEO Tracker: "There is no static API key. Auth is browser OAuth from the MCP client" (`seo/aiseotracker/SKILL.md:37`). Awesome Tools: "No API key is required" (`seo/awesome-tools/SKILL.md:52`). Scribiz works without a key within a daily allowance (`content/scribiz/SKILL.md:57`). Payment goes through a checkout link the user opens: LinkDR's agent path is "send one `/agent/checkout?...` URL. That is login + review + Stripe" (`seo/linkdr/SKILL.md:33`).

`seo-autopilot` has the clearest action limits: a fill-in `Ship mode` of "PR for review" or "merge when the build passes" (`seo/seo-autopilot/SKILL.md:20`), and "Do not send email, submit a directory listing, create an account or post to social media. Draft it and list it in the report for the owner to send" (`seo/seo-autopilot/SKILL.md:96`).

***

## How it markets itself to non-developers

- **Title and tagline target the job, not the tool.** "SEO Skills for Claude Code, Cursor & AI Agents" (`README.md:1`), then the PR-not-PDF promise (`README.md:4`).
- **Badges and a nav bar.** Stars, Agent Skills spec, "browse il.ly/skills", MIT (`README.md:8-11`); a seven-link nav including "Web catalog" and "FAQ" (`README.md:14-22`).
- **Pictures of outcomes.** A hero showing a terminal install, a merged PR and rising Search Console clicks (`README.md:24`), and an output collage of a `robots.ts` fix, a proof folder, a `/vs/` page and AI citations (`README.md:57`).
- **A FAQ for people who have never seen a skill.** "What are SEO skills for AI agents?", "Can I use them in ChatGPT, Claude.ai, or Perplexity? Yes" (`README.md:162-176`).
- **Plain fill-in setup.** `seo-autopilot` starts with five labeled lines (site, product, conversion, competitors, ship mode) to fill in before scheduling it (`seo/seo-autopilot/SKILL.md:13-21`).
- **A web catalog** at il.ly/skills, linked from badge, nav, install table and FAQ (`README.md:10`, `:15`, `:46`, `:172`).

The funnel is plain to see. The sponsors table lists LinkDR, AI SEO Tracker, GenPPT, Scribiz, Awesome Tools, SEO Roast and XOutlier (`README.md:150-158`). Method skills end in recommendations: `seo-autopilot` has a "Two tools worth adding" section naming LinkDR and AI SEO Tracker (`seo/seo-autopilot/SKILL.md:101-106`), `seo-roast` offers a GenPPT client deck (`seo/seo-roast/SKILL.md:269-271`), and `internal-linking` closes on LinkDR (`seo/internal-linking/SKILL.md:247`). The `linkdr` skill defaults orders to auto-approve and applies a discount code (`seo/linkdr/SKILL.md:36-37`, `:76`), while the README says "You can approve every publisher site before placement" (`README.md:152`). Both statements are true, but the agent's default is the opposite of what the README emphasizes.

The marketing outruns the mechanics a little. Business users are the audience, but most deliverables are repo diffs (`README.md:4`), so a coding agent in a site repo is still the real runtime. The paste-into-ChatGPT path gets the method but not the PR.

***

## Compared with lossless-agent-skills

Baseline: `context-v/agent-skills/` at the anchor root (`lossless-agent-skills`, `5f47596`, 2026-11-22). Paths below are relative to that directory.

### Where seo-skills is ahead, especially for people outside its author

| Dimension | seo-skills | lossless-agent-skills |
|---|---|---|
| Audience focus | One domain per repo; engineering skills sent to a separate pack (`README.md:116`) | One table mixing context-v conventions, Astro rules, CRM interfaces, VC analysis and event prep (`README.md:20-57`) |
| Grouping | Four domain folders plus job-based README sections | Flat top level; 43 `SKILL.md` within two levels, including submodule roots |
| Catalog completeness | All 30 in the table, each with an example prompt | 12 skill folders missing from the README table (`build-a-moodboard`, `decile-hub-connector`, `prep-images-for-embed`, `remake-deck`, `slim-file-sizes`, `write-site-narrative`, and six more) |
| Install | `npx skills add` with per-skill and per-harness flags; plugin manifests | `pi install` or `git clone` the whole repo into the skills directory (`README.md:71-105`), then a sync script (`AUTHORING.md:15-22`) |
| MCP wiring | `.mcp.json` shipped with the plugin | None; MCP servers are set up per repo by hand |
| Chat-app users | Copy from il.ly/skills | No path |
| Usage examples | Example prompt per skill, six named chains | Descriptions only |
| Paid-API fallback | Explicit MCP → env → free fallback trees with spend caps | Interface skills read private config but no common fallback or budget pattern |

Our install docs have also drifted: the README clones `lossless-skills` (`README.md:76`, `:92`), `CLAUDE.md` says the repo is mounted at `context-v/skills/` (`CLAUDE.md:6`) when it is at `context-v/agent-skills/`, and `AUTHORING.md` documents `sync-skills.sh` (`AUTHORING.md:17-19`) while the anchor `CLAUDE.md` uses `sync-skills-symlinks.sh` (both scripts exist). A new outside user would hit all three.

One correction to our working assumption: we do have per-skill docs pages. The splash renders a card and detail page per skill at `/skills/[slug]/` (`splash/README.md:34`), with `llms.txt`, a sitemap and JSON-LD (`splash/README.md:49-57`), live at lossless-group.github.io/lossless-agent-skills (`splash/README.md:5`). Its look is deliberately "Operator/CLI posture (dark default, mono-forward …)" (`splash/README.md:7`), so it is aimed at developers, not business users, and it offers no install or copy button per skill.

### What we do that seo-skills does not

- **Public skills, private config.** A written pattern with `config/private.example.json` as the contract and a pre-push audit grep (`README.md:154-249`; `CLAUDE.md:30-39`), used in five skills (for example `maintain-splash-pages/config/private.example.json:1-11`). seo-skills has no per-operator config; the fill-in lines in `seo-autopilot` live in the prompt.
- **A third-party policy.** `THIRD-PARTY.md:9-17` picks submodule, fork, vendored copy, or mined pack by situation, and says to name a dependency rather than copy it (`THIRD-PARTY.md:31-36`). seo-skills copies vendor skills in and relies on "fetch the live file" to stay current.
- **Composition written into skills.** Skills carry "Composes with" sections and tables (`maintain-splash-pages/SKILL.md:81`; `changelog-conventions/SKILL.md:179`; `maintain-design-md/SKILL.md:215`) instead of relying on README chains.
- **Progressive disclosure through `references/`** (for example `open-graph-share-seo-geo/references/`), where seo-skills inlines everything up to 314 lines.
- **A changelog** (49 entries under `changelog/`), a `LICENSE` file, and contributing rules (`README.md:121-152`). seo-skills has none of the three in the pin.
- **No commercial steering.** Our skills do not route users to paid products we own.

On the overlapping domain: our `open-graph-share-seo-geo` (482 lines) covers unfurl metadata, image format, sitemap, `robots.txt` and `llms.txt` (`open-graph-share-seo-geo/SKILL.md:3`). seo-skills barely touches share previews but goes much further into ranking work: keyword clustering, competitor gaps, link building, AI citation tracking, and crawler blocking (`seo/block-ai-scrapers/SKILL.md:3`). The two complement each other more than they compete; the `robots.txt` advice in `seo/seo-roast/SKILL.md:74-76` is the main overlap to reconcile.

***

## What we'd borrow

1. **A plugin manifest that names grouped skill roots.** `.claude-plugin/plugin.json:25-31` lets a pack keep domain folders and still install in one step. Grouping our flat directory (conventions, sites, CRM/VC, events) would then stop being a discovery problem for outside users.
2. **A "What it ships / Example prompt" catalog, plus named chains.** `README.md:63-114` and `README.md:118-127`. Our README table explains why we care but never shows a prompt or an output.
3. **The connection-path tree with a spend cap.** `seo/ahrefs-research/SKILL.md:16-29`, `:48-54`; `seo/dataforseo-serp/SKILL.md:16-27`, `:48`. Our HubSpot, Decile and CRM interface skills would benefit from the same "MCP, then env, then manual export, and stop at a budget" order.
4. **Fill-in setup lines and a ship-mode switch for business users.** `seo/seo-autopilot/SKILL.md:13-21` and the draft-don't-send rule at `:96`. A fit for `event-prep` and the CRM skills, where the operator is not always a developer.
5. **Version-and-sentinel checks for vendored copies.** `seo/linkdr/SKILL.md:26-28`: "if the live version is newer, follow it", and a last-line sentinel to detect truncation. Our `graphify` `VENDORED.md` records a version but the skill itself does not tell the agent to check it.

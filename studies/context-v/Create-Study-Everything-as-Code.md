The thesis isn't "as-code is good" — it's vendor-neutral artifact formats
   are how you escape the agent-lock-in flywheel. Notion+Notion-AI, Microsoft+Copilot, Figma+Figma-AI
   all bet that you'll keep your work in their proprietary format because their agent grokks it best.
   The countermove is: keep your work in open, plain-text formats so any agent can read it.

  That gives the study a much sharper discriminator than "as-code generally":

  - Pin criterion: Is it an open spec / community-maintained format that competes with a proprietary
  or vendor-controlled artifact, and that any LLM can read without a vendor integration?
  - Negative exemplars (don't pin, just name in the intro): Notion blocks, Confluence pages, Keynote,
   Miro JSON-but-not-portable, Figma files, Excel.

  Curation strategy you suggested — agree. Per category, pin 1–3 leaders and footnote the rest. A
  diagrams-as-code study can spin off later when we're ready to actually compare 10+ tools
  head-to-head. So this study stays at the meta level: what categories have an open winner emerging.

---

## Initial proposed pin set (organized by *what it replaces*)

| Category | Replaces (proprietary / vendor-locked) | Pin | Mention in passing |
|---|---|---|---|
| Citations | Mendeley/Zotero exports, ad-hoc bibliographies | CITATION.cff | BibTeX (older, still relevant) |
| Diagrams | Visio, Lucidchart, Miro flowcharts | Mermaid | PlantUML, D2, Graphviz |
| Canvas / whiteboard | Miro, FigJam | JSONCanvas | tldraw's `.tldr` format |
| Knowledge bases | Notion DB, Airtable | Obsidian Bases | Logseq, Anytype |
| Slides | Keynote, PowerPoint, Gamma, Tome | Slidev | Marp, Quarto, Typst+polylux, reveal.js |
| Site → agent context | scraped HTML, vendor APIs | llms.txt | (cross-ref to open-specs study) |

Two categories I deliberately left off the table for now, pending your call:

- **Documents.** Markdown itself is too foundational to be a study target — it's the substrate. The interesting "pin" candidates are the *richer* doc-as-code formats: AsciiDoc, Pandoc-flavored Markdown, MDX. Worth a slot, or skip the category?
- **Data.** Frictionless Data already sits in `open-specs-and-standards` as the canonical "datasets-as-code." Re-pinning would be redundant. Lean toward cross-referencing.

---

## Three open questions before I draft the README

1. ~~**Slides — Marp or Slidev?**~~ **Resolved.** Pin **Slidev**; mention Marp, Quarto, Typst+polylux. See "Slides — resolved candidate set" below for the rationale.

2. **Documents category — include AsciiDoc/Pandoc/MDX or skip it entirely?**
   - Including risks the study sprawling into "all of doc-as-code" which is a different study.
   - Skipping risks losing the most common artifact (a written doc) from the survey.
   - A middle path: include MDX as the headline pin (because it bridges static text and live components — the "richer Markdown" that's gaining ground), with AsciiDoc/Pandoc as mentions.

3. **Cross-references vs duplication with `open-specs-and-standards`.**
   - `llms.txt` is already pinned there.
   - `frictionless-specs` (datasets-as-code) is already pinned there.
   - Proposal: in this study, both appear in the README's pin table with a "→ pinned in `open-specs-and-standards`" marker, *not* re-added as submodules here. Keeps the two studies non-redundant and the cross-reference visible.

---

## Categories considered and rejected (so far)

- **Slides on the web:** reveal.js and deck.js are *frameworks*, not formats. They render slides; they don't define a portable artifact format. Marp/Slidev are closer to "format" because their source files are the artifact.
- **Resumes:** JSONResume exists, but resumes aren't a high-leverage artifact for human-agent workflows. Defer.
- **Forms / surveys:** SurveyJS, Typeform JSON, Tally — fragmented, no clear winner, low priority for the agent-portability thesis. Defer.
- **Notebooks:** Marimo, Jupyter, and the *notebook* face of Quarto. Hybrids of doc + code execution; belongs in a separate "executable documents" study, not here. (Quarto's *slide* face is in scope — see Slides section.)
- **Workflow:** GitHub Actions YAML, n8n JSON, Argo. These are *infra-as-code adjacent*; the vendor-neutral thesis applies but it's a different domain (CI/CD vs human knowledge work). Defer.

---

## Open thesis-level questions

- **What's the role of "human readability" in the criterion?** A purely machine-readable format an agent can parse but a human can't is not the win we're after. The study's bias seems to be: *both human and agent can read it*. Make this explicit in the README intro?
- **Does "vendor-neutral" require a non-corporate maintainer?** Marp is corporate-led but open. Mermaid is community-led with corporate sponsors. Where's the line between "open enough" and "captured"? Worth articulating.
- **What's the failure mode we're trying to avoid?** Specifically — the user's slides claim was about *speed*. The vendor-lock-in argument is about *swap-ability*. Are those the same study or two separate threads? If the same: the README should connect them ("you can swap agents quickly *because* the artifact is portable"). If separate: pick one as the headline.

---

# Additional candidate categories (from user)

## Infrastructure Configuration Languages

**HCL (HashiCorp Configuration Language)** is the declarative syntax powering Terraform and other HashiCorp tools. Agents readily read, understand, and write HCL because it balances human readability with machine parsability through its block-based structure, supports interpolation and functions, and is provider-agnostic. For users, it serves as a bridge between infrastructure intent and cloud provisioning—you describe what resources you want, and the tooling handles how to create them. [^hsw9sd] [^t8q5bh] [^lycgb1]

**CUE (Configure, Unify, Execute)** takes configuration further by unifying data validation, templating, and policy enforcement in a single language. Agents trained on modern infrastructure tooling understand CUE's type-safe constraints and compositional approach. It helps users define complex system configurations with built-in validation, reducing the cognitive load of managing JSON Schema separately. CUE can import from and export to JSON, YAML, Protobuf, and OpenAPI. [^0sbdno] [^5ujobp]

**Dhall** is a programmable configuration language designed for security-conscious environments with guaranteed termination and no side effects. Its strong type system ensures configurations never fail at runtime if they type-check. For users, Dhall provides the power of computation in configs without the risks of arbitrary code execution. [^3uggqx]

## Visual-to-Text Formats

**DOT (Graphviz)** uses simple text syntax to describe nodes, edges, and graph layouts. Agents fluently generate DOT because it's pure declarative structure—you specify elements and relationships, and rendering engines handle visualization. Users can quickly communicate architectural diagrams, state machines, or dependency graphs through text that agents can both create and modify. [^gq6t38] [^tnpbn3]

**PlantUML** converts plain text descriptions into UML diagrams using an intuitive keyword-based syntax [^ofo6uk] [^j9mivu]. Agents understand the `@startuml`/`@enduml` blocks and relationship operators like `--|>` for inheritance [^ofo6uk]. This lets users collaborate with agents on software architecture, sequence diagrams, and component relationships without touching a mouse [^j9mivu].

**Excalidraw JSON** stores whiteboard-style diagrams in a structured JSON schema with element arrays and application state. While more complex than PlantUML, agents can parse and generate `.excalidraw` files programmatically. Users get the benefit of hand-drawn aesthetic diagrams that are still machine-readable and version-controllable. [^4qhw0v] [^r0rtt7]

---

# What these additions imply (Claude's reflection)

## Scope expansion: operations + knowledge work

The original examples (CITATION.cff, llms.txt, Mermaid, JSONCanvas, Bases) clustered tightly around **knowledge / creative artifacts** — things a person makes to communicate ideas. The infrastructure configuration languages (HCL, CUE, Dhall) belong to a different cluster: **operations artifacts** — things a person makes to instruct systems.

Both fit "everything as code" cleanly, and both fit the vendor-neutrality thesis (HCL escapes AWS Console / Azure Portal lock-in the same way Mermaid escapes Lucidchart lock-in). But it doubles the surface area. Two ways to handle it:

- **(a) Single broad study, two parts.** Sub-divide the README into "Knowledge & creative artifacts" and "Operations artifacts." Each has its own pin set. Defensible — they share the thesis.
- **(b) Two separate studies.** `everything-as-code-knowledge-work` and `everything-as-code-operations` (or `infra-as-code-survey`). Cleaner boundaries, but more setup.

Recommend **(a) with named sub-sections**, because the *thesis* is what binds them. If a sub-section grows past five or six pins, that's the natural moment to fork.

## Pin set, revised with the new categories

| Category | Cluster | Replaces (proprietary / vendor-locked) | Pin | Mention |
|---|---|---|---|---|
| Citations | Knowledge | Mendeley/Zotero, ad-hoc | CITATION.cff | BibTeX |
| Diagrams (structural) | Knowledge | Visio, Lucidchart | Mermaid | PlantUML, DOT/Graphviz, D2 |
| Canvas / whiteboard | Knowledge | Miro, FigJam | JSONCanvas **or** Excalidraw JSON (TBD) | tldraw `.tldr` |
| Knowledge bases | Knowledge | Notion DB, Airtable | Obsidian Bases | Logseq, Anytype |
| Slides | Knowledge | Keynote, PowerPoint, Gamma, Tome | Slidev | Marp, Quarto, Typst+polylux, reveal.js |
| Site → agent context | Knowledge | scraped HTML | llms.txt | (cross-ref to open-specs) |
| Infra config | Operations | AWS Console, Azure Portal, GCP Console | HCL | CUE, Dhall, Pulumi YAML |
| Config / validation | Operations | hand-rolled JSON Schema, ad-hoc YAML | CUE | Dhall, JSON Schema (foundational) |

Note the duplication on **CUE** and **Dhall** between the two infra rows — they straddle "infrastructure" and "config validation" depending on which face is more interesting to the reader. I'd lean *one row* with HCL as the headline pin and CUE / Dhall as siblings, rather than two rows.

## New open questions raised by the additions

4. **Canvas pin — JSONCanvas or Excalidraw JSON?**
   - **JSONCanvas**: Obsidian's open spec, simpler schema, designed as a portable interchange format from day one.
   - **Excalidraw JSON**: richer (hand-drawn aesthetic, application state), wider live usage, but the schema serves a single tool first.
   - JSONCanvas fits the *spec / portable format* thesis cleaner. Excalidraw fits the *real adoption today* thesis better. Pick one to pin and the other to mention?

5. **Diagrams sub-pin — Mermaid alone, or Mermaid + PlantUML?**
   - Originally I had Mermaid alone with PlantUML/D2/Graphviz in the mention column.
   - Your notes treat PlantUML and DOT as first-class entries, not footnotes.
   - Tradeoff: pinning all three makes the diagrams row feel like a survey (which you said you wanted to *avoid* at this level). Pinning Mermaid alone with the others mentioned keeps the meta-study lean and lets a future `study-diagrams-as-code` go deep.

6. **Operations cluster — does the study want it at all?**
   - HCL/CUE/Dhall are mature, well-known, and arguably belong to a different conversation (the existing "infrastructure-as-code" canon). The agent-portability angle is real but less novel.
   - If this study's headline is *new ground for human-agent workflows*, the knowledge-work cluster is more original. The operations cluster might dilute the freshness.
   - Ask: is the operations cluster pulling the study toward a survey of "as-code generally," or is it specifically valuable because **agents working with infra configs are exactly where vendor lock-in bites hardest in production**? If the latter, keep it. If the former, defer to a separate study.

## Decision points to close before drafting README

To unblock the README draft, the smallest set of decisions you'd need to land:

- [ ] Single study with two sub-sections, or split into two? (Recommend single, sub-sectioned.)
- [x] Slides — **Slidev** as headline pin; Marp, Quarto, Typst+polylux as mentions; Gamma/Tome named as negative exemplars.
- [ ] Canvas — JSONCanvas or Excalidraw JSON?
- [ ] Documents category — include MDX/AsciiDoc or skip?
- [ ] Diagrams — pin Mermaid alone (and let a future study go deep) or pin Mermaid + PlantUML + DOT here?
- [ ] Infra row(s) — one row or two? Headline pin: HCL?
- [ ] Cross-reference policy with `open-specs-and-standards` — agreed on "see-also" rather than re-pin?
- [ ] Thesis framing — *speed* (work faster with agents) and *swap-ability* (escape vendor lock-in) as one connected thesis, or pick one as the headline?

---

# Slides — resolved candidate set

The slides category, expanded after discussion. **Slidev** is the headline
pin; the others sit as mentions. Negative exemplars (Gamma, Tome) get named
in the README intro because they sharpen the thesis.

## Pin: Slidev

> Slidev's `.md` + frontmatter — the closest thing to a true
> "presentation as code" spec right now, explicitly designed to be
> written by developers (and agents) rather than clicked through a GUI.

Slidev source is a single Markdown file with YAML frontmatter for slide
metadata, plus optional Vue components for richer behavior. The artifact
*is* the file; there's no hidden binary state, no proprietary editor, no
cloud account required. By Anthony Fu (Vue/Vite ecosystem). Active
development, strong agent affinity (LLMs read Markdown + frontmatter
fluently), and the source format is portable enough that another renderer
could in principle consume it.

## Mention: Marp

Markdown + YAML front matter, very spec-shaped, minimal opinion. Renders
to PDF/HTML/PPTX. Older than Slidev, lower momentum, but the *most
spec-like* of the four — its source files are the most portable. If the
study later wants a "purist" slot for slides-as-spec rather than
slides-as-developer-tool, Marp is the answer.

## Mention: Quarto (`.qmd`)

Posit's structured-Markdown format. The interesting move: *the same
source* compiles to slides, papers, books, dashboards, and blog posts.
Slides are rendered via revealjs under the hood, but the format the human
writes is `.qmd`, not HTML. Heavy adoption in data science and academic
publishing. Strong "everything-as-code" fit because the artifact is
multi-target by design.

(Quarto's notebook face — executable code with output cells — is *out of
scope* for this study; that belongs in a future executable-documents
study.)

## Mention: Typst + polylux

Typst is a typed, compiled typesetting language gaining serious momentum
since 2023 as a TeX successor. `polylux` is the community slides package.
More programming-language-shaped than Markdown — agents can reason about
Typst types and functions, but the human-onramp cost is higher than
Markdown-based formats. Worth flagging as the "where things might go"
entry: if Typst keeps its trajectory, polylux is the slides answer for
people who want real compilation semantics.

## Negative exemplars (named in the README intro)

- **Gamma** — AI-native presentation tool. Cloud SaaS. Beautiful output,
  but the artifact lives inside Gamma's database; you can export but you
  cannot *work in Gamma's source format* outside of Gamma. Maximum vendor
  lock-in disguised as agent-native productivity.
- **Tome** — same pattern. AI-driven, cloud-only, no portable source.

These are the *opposite* of the study's thesis: the agent integration is
great precisely because you're locked into their cloud. Naming them in
the intro makes the contrast concrete.

## Why this picks up cleanly under the thesis

Slides are a high-leverage artifact for human-agent workflows — they're
how ideas get communicated to other people, including non-technical
stakeholders. If your slides live in Keynote, your agent can't help you
revise them; if they live in Slidev, your agent can rewrite the deck from
the same source it uses to understand your code. That direct
substitutability is the headline win.

---

# More candidate categories (from user, round 2 — data & analytics)

## Visualization Specifications (JSON)

**[Vega and Vega-Lite](https://vega.github.io/vega-lite/docs/spec.html)** are the gold standard for declarative, agent-writable visualization specs. They're JSON objects that describe charts by mapping data columns to visual properties (x-axis, y-axis, color, size). Agents can write these fluently because the grammar is explicit: you specify the mark type (bar, point, line), the encoding (which column → which visual channel), and Vega auto-generates axes, legends, and scales. [^5knti2] [^h7ye3w] [^u0aist]

Vega-Lite is the simplified, high-level version — a minimal spec that compiles to full Vega under the hood. For users, this means you can collaborate with an agent to prototype a chart by describing the data and desired visualization in natural language, and the agent outputs a complete JSON spec you can render in Observable, embed in a notebook, or save as a standalone HTML file. [^h7ye3w] [^xev8x2] [^w7m60l]

**[Observable Plot](https://observablehq.com/plot/what-is-plot)** follows the Grammar of Graphics but uses JavaScript API syntax rather than pure JSON. It's more code-like than Vega-Lite but still declarative — agents write `Plot.barY(data, {x: "column", y: "value"})` and the library handles the rest. It's rapidly becoming the standard for embedded web-based analytics visualizations. [^zpc0st] [^8lqxea] [^rx7cqn]

## Tabular Data Formats Beyond CSV

**[Apache Parquet](https://docs.pola.rs/user-guide/io/parquet/)** is the columnar storage format that's replaced CSV for analytics workflows. It's binary, not text, but agents understand the semantic layer: they know when to recommend Parquet over CSV (large datasets, columnar access patterns, type preservation). Tools like Polars and DuckDB treat `.parquet` as a first-class citizen — agents can write Python code that generates, queries, and transforms Parquet files with the same fluency they handle CSVs. [^32wybb] [^r3udn7] [^zxh7tq]

**[Apache Arrow IPC format](https://arrow.apache.org/docs/cpp/ipc.html)** is the in-memory columnar format that Parquet serializes to disk. It's becoming the universal interchange format for analytics — DuckDB, Polars, Pandas, and Spark all understand it natively. For agents, Arrow is the "assembly language" of dataframes — when an agent needs to move data between systems without serialization overhead, it writes Arrow. [^xsm5b6] [^zss1u0] [^c870ii]

## Analytics Workflow Specs (YAML)

**[dbt's YAML model specification](https://docs.getdbt.com/docs/build/latest-metrics-spec)** defines data transformations, semantic models, and metrics as structured YAML files. Agents can read and write these because they're declarative descriptions of data pipelines: which tables to join, which columns to aggregate, how to define a "revenue" metric. The dbt Semantic Layer compiles these YAML specs into optimized SQL at query time. [^tmiuv3] [^kvx1po]

For users working with an agent on data modeling, this means the agent can generate complete dbt project files — `schema.yml`, `dbt_project.yml`, metric definitions — that another analyst can immediately run. [^kvx1po] [^3i133g]

## SQL-as-Format (DuckDB's innovation)

**[DuckDB](https://duckdb.org/docs/current/sql/introduction.html)** blurs the line between database and file format. Agents write SQL queries that operate directly on CSV, Parquet, JSON files without loading them into a database first. The query itself becomes the transformation spec: `SELECT * FROM read_parquet('data/*.parquet') WHERE year > 2020` is both the format description and the execution plan. [^gwqbe1] [^tw80hh] [^flzdf2]

This is agent-fluent because SQL is already a lingua franca for agents — but DuckDB extends that fluency to ad-hoc file analysis. [^flzdf2] [^gwqbe1]

## Why These Work for Agents

The pattern: **declarative grammars with explicit semantics**. Vega specs say "this column is the x-axis, this is the y-axis" — there's no ambiguity. Parquet files carry their schema inline. dbt YAML models declare dependencies explicitly. Agents don't need to guess intent; the format *is* the intent. [^h7ye3w] [^zpc0st]

For users, this creates a powerful collaboration pattern: you describe what you want to visualize or analyze, the agent writes the Vega-Lite JSON or dbt YAML, you tweak it in a text editor, and the tooling renders the result. It's the same "diagrams as code" philosophy you identified with Mermaid, but for data.

---

# Round 2 reflection (Claude)

## The unifying thesis just got handed to us

> "Declarative grammars with explicit semantics. The format *is* the
> intent."

This is the strongest single statement of the study's thesis we've
written so far. It explains *why* every pin in the table works:

- Mermaid says "graph TD" and the layout is determined.
- CITATION.cff has named fields; there's no ambiguity about who the author is.
- HCL has typed blocks; an agent can't misread `resource "aws_s3_bucket"`.
- Vega-Lite says `"x": {"field": "year"}`; the chart axis is unambiguous.
- dbt YAML declares dependencies; the DAG is explicit.

Recommend this become the **headline framing of the README intro**, with
the vendor-lock-in argument as the consequence rather than the lead. Try:

> *Vendor-locked artifacts force agents to guess. Open formats with
> declarative grammars and explicit semantics let agents read, write, and
> revise your work without guessing. This study collects the formats
> where that bargain has been struck successfully — where the file is
> the source of truth, and any agent can consume it.*

## Scope: now three clusters, not two

Round 1 added an Operations cluster on top of the original Knowledge
cluster. Round 2 adds a third: **Data & analytics**. The clusters now:

| Cluster | Examples |
|---|---|
| Knowledge & creative artifacts | citations, diagrams, canvases, knowledge bases, slides, site→agent context |
| Operations artifacts | HCL, CUE, Dhall |
| Data & analytics artifacts | Vega-Lite, Parquet, Arrow, dbt YAML, SQL/DuckDB |

Three clusters in one study is still defensible *if* the README leads
with the unifying thesis ("declarative grammars with explicit
semantics") and uses the clusters as navigational headings, not as
separate study questions. If we want a sharper artifact, we'd split into
three studies. My recommendation is still **single study, three
sub-sections**, but the threshold to fork is closer than it was after
round 1.

## Thesis wrinkle: text vs binary

Parquet and Arrow are *binary* formats. Earlier framing leaned on
"plain-text" as a criterion. Round 2's pattern statement reframes the
criterion correctly: it's **agent-readability through self-describing
schemas**, not text-vs-binary. A Parquet file with embedded schema is
*more* agent-readable than a CSV with no schema. Worth updating the
README's pin criterion to say: "open spec, *and* either plain text *or*
binary with self-describing schema, *and* readable without vendor
integration."

## Pin recommendations for the new categories

| Category | Cluster | Replaces (proprietary / vendor-locked) | Pin | Mention |
|---|---|---|---|---|
| Visualization specs | Data | Tableau, Power BI, Looker | Vega-Lite | Vega (full), Observable Plot |
| Tabular data | Data | proprietary BI exports, .xlsx, raw CSV | Parquet | Arrow IPC, Frictionless Data (cross-ref) |
| Analytics workflow | Data | proprietary ETL UIs (Alteryx, Fivetran configs) | dbt YAML model spec | (none for now) |
| Query-as-spec | Data | locked-in analytics platforms | SQL via DuckDB | (foundational; pin as a *pattern* not a repo) |

A note on **DuckDB**: it's not really a "format" in the same sense as
the others — it's a *runtime* that elevates SQL to a portable analysis
spec. Probably belongs in the README as a one-paragraph "honorable
mention" or "pattern entry," not as a pinned submodule. Pinning the
DuckDB repo itself is fine, but its categorization is meta-level.

## Negative exemplars to add to the intro

- **Tableau / Power BI / Looker** — proprietary visualization tools with
  binary or vendor-XML artifact formats. Workbooks aren't portable; AI
  features are vendor-bound.
- **.xlsx / Google Sheets** — universal but format-poor; ad-hoc
  conventions for what each cell means. Agent can read the bytes but
  must guess the semantics.
- **Alteryx / proprietary ETL** — drag-and-drop transformation
  pipelines stored in vendor-specific formats. The pipeline is locked
  in the tool; only the tool's AI can revise it.

## New open questions raised by round 2

7. **Pin a runtime (DuckDB) as a pattern, or only formats?**
   - Strict reading: this study pins *formats*, and DuckDB is a runtime
     that consumes formats. Skip pinning the repo; describe the pattern
     in prose.
   - Liberal reading: DuckDB is the canonical "agent-fluent file analysis
     runtime" and pinning its repo gives readers concrete code to read.
   - Recommendation: pin the repo, but flag in the README that this entry
     is a *pattern reference*, not a format spec.

8. **Should the README's pin criterion update from "plain text" to
   "agent-readable through self-describing schema"?**
   - This admits Parquet/Arrow as legitimate pins.
   - Risks expanding scope to "any format with a schema," which is
     close to "any format at all."
   - Mitigation: keep the *spirit* (humans should be able to read the
     source of meaning, even if the data payload is binary) by requiring
     the schema itself to be in human-readable form (Parquet's schema is
     introspectable; Arrow's is too).

9. **Three sub-sections in the README, or split into three studies?**
   - Single study with three sub-sections preserves the unifying thesis
     and keeps the "see how the same idea applies across domains"
     reading experience.
   - Splitting gives each cluster a sharper boundary and more room to
     grow.
   - The threshold to fork has been crossed for someone who wants a
     focused artifact on, say, "open data analytics formats." For our
     purposes (an internal study, not a public reference), single study
     wins.

## Updates to the decision points checklist

Add:
- [ ] Pin criterion updated to admit binary-with-self-describing-schema?
- [ ] DuckDB pinned as a pattern reference, or kept in prose only?
- [ ] Visualization pin — Vega-Lite alone, or Vega-Lite + Observable Plot?
- [ ] Three-cluster structure confirmed (Knowledge / Operations / Data & Analytics)?

## Document hygiene note

The doc now has *three* pin tables (initial, round-1 revised, round-2
recommendations). When we move to drafting the actual README, we should
**consolidate to a single canonical pin table** and keep the historical
ones in this discussion doc as a record of how the thinking evolved. I
don't recommend deleting the old tables here — they're useful as a
reasoning trail.

---

# More candidate categories (from user, round 3 — open data formats & chart standards)

[[Open Data Formats]] for charts and data ensure interoperability, enabling machine-readable and non-proprietary exchange. Key open formats include CSV and TSV for structured data, JSON and XML for metadata-rich data, and .odc (OpenDocument Chart) for visualizations. These are often packed as  for transport, with OpenSpec used in AI-driven spec development. [^2inh2d] [^5cur5f] [^hiwk9a] [^wg7jlp] [^bja76r] [^2nw23g]

**Key Open Data & Chart Formats**

- **CSV (Comma Separated Values):** The most standard, machine-readable format for raw chart data.
- **JSON (JavaScript Object Notation):** Common for structured metadata, web APIs, and configuring chart specifications (e.g., in Google Sheets API).
- **ODF (Open Data Format):** Uses CSV for data and XML for metadata, packaged together, supporting statistical software exchange.
- **.odc (OpenDocument Chart):** Part of the OASIS OpenDocument (ODF) technical specification, specifically for charts.
- **S57/000:** An open, standard format for maritime vector charts.
- **GeoJSON / TopoJSON:** Standards for mapping and geospatial chart data. [^2inh2d] [^hiwk9a] [^wg7jlp] [^bja76r] [^22nnzn] [^3e8xum] [^ol7ybg]

**Why Use Open Specs?**

- **Interoperability:** Data can be imported into multiple statistical software packages.
- **Transparency:** Non-proprietary formats prevent vendor lock-in.
- **Accessibility:** Machine-readable formats ensure data can be easily processed and reused.
- **Structure:** Standardizes metadata (DDI-Codebook 2.5) for better data interpretation. [^2inh2d] [^hiwk9a] [^3e8xum] [^ypue6l] [^sp9qh5]

**Open Spec Frameworks**

- **OpenSpec:** A modern approach to AI-assisted Specification Driven Development, using markdown files () for structured requirements.
- **Open Data Product Specification 4.0:** A Linux Foundation standard for defining data quality and metadata. [^5cur5f] [^c6v0kw]

**Metadata and Packaging**

- Open Data often combines CSV data files with XML metadata for comprehensive datasets.
- The  or  files are commonly used in modern AI workflows to define data structure context. [^2inh2d] [^5cur5f]

> *Note from Claude:* The source pasted above has a few empty
> backticks/parens (e.g. "packed as ", "files ()", "The  or  files") —
> looks like template references that didn't render. Worth filling in
> the intended file/format names before this content lands in any
> downstream README so the references are concrete.

[^2inh2d]: https://opendataformat.github.io/specification.html
[^5cur5f]: https://www.youtube.com/watch?v=wZFOW89Lsc0
[^hiwk9a]: https://data.europa.eu/elearning/en/module9/
[^wg7jlp]: https://libguides.uccs.edu/opendata/overview
[^bja76r]: https://en.wikipedia.org/wiki/OpenDocument_technical_specification
[^2nw23g]: https://geo-data-support.sites.uu.nl/open-science-open-data/fair-file-formats/
[^22nnzn]: https://resources.data.gov/resources/podm-field-mapping/
[^3e8xum]: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/charts
[^ol7ybg]: https://opencpn.org/wiki/dokuwiki/doku.php?id=opencpn:manual_advanced:charts:formats
[^ypue6l]: https://www.min.io/learn/open-table-format
[^sp9qh5]: https://opendataformat.github.io/specification.html
[^c6v0kw]: https://opendataproducts.org/v4.0/

---

# Round 3 reflection (Claude)

## Sorting round 3 into four buckets

Round 3 is a mix of *foundational substrate*, *legitimately new pin
candidates*, *niche standards*, and *redundant references to formats
already covered*. Sorted:

### A. Foundational substrate (intro material, not pins)

- **CSV / TSV** — universal but format-poor. The README intro should
  acknowledge them as the floor — every other "data-as-code" format is
  in part a response to "CSV with no schema is a guessing game."
- **JSON / XML** — same: too foundational to "study," but worth naming
  as the substrate for most other pins (Vega-Lite is JSON; HCL emits to
  JSON; .gitmodules is JSON-ish; etc.).

These belong in a one-line "we assume CSV/JSON/XML as substrate; the
study is about *what's built on top*" disclaimer in the README intro.

### B. New pin candidates (genuinely additive)

- **Open Table Formats** — *biggest miss in earlier rounds*. The
  hyperlink in the user's notes [^ypue6l] points at the open-table
  conversation: **Apache Iceberg**, **Delta Lake**, **Apache Hudi**.
  These are the "everything-as-code" answer for *data lakehouses* — the
  table is defined as a directory of Parquet files plus a metadata
  layer that's fully open-spec. As of late 2024 / 2025, **Iceberg** has
  emerged as the default winner of the open-table-format wars
  (Snowflake, Databricks, AWS, Google all offer first-class Iceberg
  support). Recommend pin: **Iceberg**; mention: Delta Lake, Hudi.
- **GeoJSON** — RFC 7946, mature, ubiquitous. The vendor-locked
  alternatives are Esri shapefiles and various proprietary GIS
  formats. Strong pin candidate for "geospatial-as-code." Mention:
  **TopoJSON** (Mike Bostock's compactness extension).
- **Open Data Product Specification (ODPS) 4.0** — Linux Foundation
  standard. Different layer than dbt YAML: dbt is *transformations*;
  ODPS is *the contract for what a data product is* (quality,
  metadata, SLAs). Worth a slot in the Data cluster. Pin candidate.

### C. Niche / specialized (cross-reference, don't pin)

- **S57/000** — open standard for maritime vector charts. Real, but
  the audience is professional cartographers and shipping. Cross-ref
  only, in a "specialized open formats also exist" footnote.
- **DDI-Codebook 2.5** — open metadata standard for social-science
  survey data. Important in its niche (data archives, survey
  research). Cross-ref only.
- **.odc / OASIS OpenDocument Chart** — principled open spec, but
  adoption is essentially zero outside LibreOffice. Worth naming in
  the README as the *cautionary tale*: an open spec doesn't win on
  principle alone; ecosystem adoption matters. Useful contrast to
  Iceberg or GeoJSON, both of which had the same "open standard"
  starting position but won.
- **Code Commenting Standards** — language-bound conventions for
  inline doc comments. A real "as-code" pattern (the comment is
  parsed by tools, IDEs, and LLMs) but niche for this study because
  foundational and language-specific rather than emerging.
  - **TSDoc** (Microsoft, https://tsdoc.org/) — the *spec-tier* entry.
    BNF-style grammar, defined parsing model, versioning. Aims to
    unify how tools (jsdoc, TypeDoc, API Extractor) read doc comments
    across the TS/JS ecosystem.
  - **JSDoc** (https://jsdoc.app/) — the dominant *convention* TSDoc
    is trying to formalize. Reference-shaped, not spec-shaped, but
    the de facto standard in real code.
  - **Javadoc** (Sun/Oracle, the progenitor) — defined the
    `/** @tag */` pattern that JSDoc, TSDoc, and most others copy.
    HTML output; tightly bound to the JDK toolchain.
  - **Doxygen** (https://www.doxygen.nl/) — multi-language doc
    generator (C, C++, C#, Java, Python, and more). Reads its own
    syntax *and* can consume JSDoc/Javadoc/Python docstrings. Has a
    proper manual that's effectively the spec.
  - **GoDoc / pkg.go.dev** — plain comments above declarations are
    the format. No tags. Parsed automatically by `go doc` and the
    package registry. Notable for being radically minimal — the
    "as-code" move via *removal* rather than addition.
  - **RustDoc** — Markdown inside `///` triple-slash comments,
    rendered by `cargo doc`. Notable for executable doctests: code
    blocks in the docs are run as part of `cargo test`. Among the
    most agent-friendly of the language-specific conventions because
    the format is literal Markdown.
  - **Sphinx / reStructuredText docstrings** (Python) — the
    long-standing Python convention, with multiple competing styles
    underneath (Sphinx, Google, NumPy). Sphinx is the renderer; RST
    is the markup; the *convention* is per-project.
  - **mkdocstrings + Markdown docstrings** (Python) — newer pattern
    of writing Python docstrings in plain Markdown rather than RST,
    rendered via MkDocs. Trending up.
  - **YARD** (Ruby) — Ruby's Javadoc-like tool with its own tag
    vocabulary. https://yardoc.org/.
  - **ExDoc / `@moduledoc` / `@doc`** (Elixir) — Elixir bakes
    documentation into the language as module attributes, rendered
    by ExDoc. The doc attribute is part of the AST, not a comment —
    one of the cleaner architectural moves in this space.
  - **Haddock** (Haskell) — has its own grammar inside `-- |` and
    `{-| ... -}` comments.
  - **NaturalDocs** — multi-language tool from the early 2000s,
    less popular now but historically significant for cross-language
    doc generation.

  Why this category is interesting for the study despite being
  niche: TSDoc, ExDoc, and Doxygen are each clean examples of the
  "as-code" move applied to *commenting itself* — taking a domain
  that was pure convention and giving it a formal grammar so tools
  can interop. Worth a sentence in the README intro as evidence the
  pattern recurses (the pattern of "open spec for what was
  convention" applies to docs about code, not just artifacts that
  aren't code).

### D. Already covered

- **OpenSpec** — already pinned in `studies/open-specs-and-standards/`.
  Cross-ref, don't re-pin.
- **OASIS OpenDocument (broader)** — `.odt`, `.ods`, `.odp` are open
  alternatives to `.docx`, `.xlsx`, `.pptx`. Mentioning them in passing
  is fine, but they don't anchor a study slot the way Slidev does for
  slides — adoption is too narrow.

## Pin recommendations after round 3

Adding three rows to the Data & Analytics cluster:

| Category | Cluster | Replaces (proprietary / vendor-locked) | Pin | Mention |
|---|---|---|---|---|
| Open table formats | Data | Snowflake-only / Databricks-only proprietary tables | Apache Iceberg | Delta Lake, Apache Hudi |
| Geospatial | Data (or split: Knowledge?) | Esri shapefiles, ArcGIS proprietary | GeoJSON (RFC 7946) | TopoJSON |
| Data product contracts | Data | proprietary catalog metadata, vendor-only product specs | Open Data Product Spec 4.0 | DDI-Codebook 2.5 (cross-ref) |

(Note: geospatial straddles knowledge and data clusters. A map *is* a
piece of communication, but the *format* is a structured data spec.
Lean Data cluster for now.)

## Cautionary tale to add to the intro

> .odc (OpenDocument Chart) is a fully open spec for charts, in
> production-ready shape, with vendor-neutral governance — and almost
> nobody uses it. Open-spec status alone doesn't earn a pin in this
> study; *agent fluency* and *ecosystem adoption* do. The pins below
> survived both filters.

That contrast tightens the pin criterion considerably and makes the
study's filtering visible to the reader.

## New open questions raised by round 3

10. **Is the "agent fluency + ecosystem adoption" pair the right
    second filter, on top of "open spec"?** Round 3's .odc example is
    the cleanest evidence yet that *open* is necessary but not
    sufficient. Recommend codifying this in the README's pin criterion:
    a format earns a pin if it is **(a) an open spec, (b) something
    current LLMs can read and write fluently, and (c) actively used in
    real human + agent workflows today**.

11. **Geospatial — Data cluster or Knowledge cluster?**
    - As a *format* (encoding rules, coordinate reference systems) →
      Data cluster.
    - As an *artifact* (a map you share with a stakeholder, like a
      slide or diagram) → Knowledge cluster.
    - GeoJSON honestly fits both. Lean Data for the table, but flag in
      the README that it's cross-cluster.

12. **Should there be a "foundational substrate" section in the README
    that names CSV / JSON / XML / Markdown but doesn't pin them?**
    Helps the reader orient: these are the floor; the rest of the
    study is about what's built on top. Yes, recommend including it.

## Updates to the decision points checklist

Add:
- [ ] Pin criterion explicitly states: open spec **+** agent-fluent
      **+** ecosystem adoption (the .odc filter)?
- [ ] Open Table Formats added with **Iceberg** as the pin?
- [ ] **GeoJSON** added; Knowledge or Data cluster?
- [ ] **Open Data Product Specification 4.0** added in the Data cluster?
- [ ] README intro includes a "foundational substrate" call-out
      (CSV/JSON/XML/Markdown) so readers know what the study is *not*
      trying to cover?

## Soft prompt — are we close to ready?

We have ten-plus pin candidates across three clusters, a clear thesis
(declarative grammars with explicit semantics), a sharper pin criterion
(open + agent-fluent + adopted), a list of negative exemplars, and a
worked example of "open-but-didn't-win" (.odc).

That's enough to draft a real README. Further candidate rounds will
mostly be edge cases and refinements rather than new structure. Whenever
you want to switch from *expanding* to *narrowing*, the decision-points
checklist (currently 11 items, several already resolved) is the natural
gate. Happy to keep going either way.

---
from: "dididecks-ai"
from_path: "context-v/models/index.md"
---

# Models

* [Data + content models in dididecks-ai (as-observed-from-filesystem)](README.md) - What the client-sites' filesystem-as-database actually looks like — so the collaborator designing the remote DB stops guessing at shapes.
* [Auth surface — Identity, Session, Token, Organization, Membership, AuthEvent](Auth-Surface-Data-Model.md) - The auth tables that gate every deck — already SQLite-shaped (astro:db on libSQL, Turso remote), unlike the .md-on-disk models.
* [Company — portfolio companies + brand-asset metadata](Company-Data-Model.md) - One markdown file per portfolio company with colocated brand assets; the discriminator against Person is the absence of `role_class`.
* [Deck / Variant / Slot — the deck-OS registry](Deck-Variant-Slot-Registry-Data-Model.md) - The deck → variant → slot spine — `src/data/{decks,slides}.ts` read at build time; the filesystem is source of truth for slot existence.
* [Engagement telemetry — PageView + Action append-only logs](Engagement-Telemetry-Data-Model.md) - Append-only PageView + Action logs in the auth astro:db — the foundation for 'who read what, for how long' reporting back to founders.
* [Firm — VC firm / backer firm metadata](Firm-Data-Model.md) - One `firm.md` per firm-anchored directory — present in calmstorm and chroma's multi-investor layout, absent from humain's flat one.
* [Person — team members, advisors, portfolio CEOs](Person-Data-Model.md) - One markdown file per person plus colocated headshot; `role_class` discriminates vc-team, advisor, portco-ceo, and the rest.
* [Slide audit registry — per-slot dual-surface review ratings](Slide-Audit-Registry-Data-Model.md) - The only runtime-mutable model on disk: one JSON per client holding per-(variant, slot) ratings, written by `/api/slide-rank`.
* [Substantiation corpus — source decks, intake material, raw assets](Substantiation-Corpus-Data-Model.md) - The gitignored `<client>/corpus/` layer — founder PDFs, page-burst PNGs, memos, raw assets. The DB stores pointers to it, never the content.

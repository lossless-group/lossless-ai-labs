---
from: "corpora-builder"
from_path: "context-v/plans/index.md"
---

# Plans

* [Corpora-Builder MVP — R2-Native Storage With Application-Level Checkpoint History](Corpora-Builder-MVP-R2-Native-With-Checkpoint-History.md) - R2 has no object versioning, so history becomes application-level: a browsable tree plus content-addressed objects and checkpoint manifests.
* [didi.sh Auth and Multi-Org Corpora](Didi-Auth-and-Multi-Org-Corpora.md) - Log in once, hold several organizations at once, and read one federated corpus across them. Three catches, and two specs that disagree.
* [Search Index, Then Pagefind](Search-Index-Then-Pagefind.md) - Search reads 845 files. Phase 1 writes a manifest so it reads one. Phase 2 puts Pagefind on top of that manifest, not in place of it.

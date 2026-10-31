---
from: "flave"
from_path: "context-v/issues/index.md"
---

# Issues

* [The lfm barrel imports node builtins, so it cannot be bundled for a browser](LFM-Barrel-Imports-Node-Builtins.md) - A consumer that only wants `parseMarkdown` still drags `node:crypto`, `node:fs` and `node:path` into the bundle, because the main entry re-exports OGCache. Same class of defect lfm already documented for plantuml — but in the front door.

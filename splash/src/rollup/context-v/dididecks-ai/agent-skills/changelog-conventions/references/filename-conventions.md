---
from: "dididecks-ai"
from_path: "context-v/agent-skills/changelog-conventions/references/filename-conventions.md"
---

# Changelog Filename Conventions

## Standard entries: `YYYY-MM-DD_NN.md`

```
changelog/
├── 2026-05-02_01.md
├── 2026-05-04_01.md
├── 2026-05-04_02.md
└── 2026-05-04_03.md
```

- **`YYYY-MM-DD`** — ISO date with dashes, the day the entry is written
- **`_NN`** — daily counter, two digits, starting at `01`
- **`.md`** — Markdown extension

When you write the day's first entry: `_01`. Second entry the same day: `_02`. And so on.

If you discover an existing entry for today and the next number isn't obvious:

```bash
ls changelog/$(date +%Y-%m-%d)_*.md 2>/dev/null | wc -l
```

The result + 1 is your `NN`.

## Release entries: `releases/<version>.md`

For product-style projects with versioned releases:

```
changelog/
└── releases/
    ├── 0.1.0.md
    ├── 0.2.0.md
    ├── 1.0.0.md
    └── 1.0.1.md
```

- Filename = the version being released (no `v` prefix unless the product itself uses one)
- One file per release
- Use whatever versioning scheme the product follows (SemVer, the four-part Lossless `epoch.major.minor.patch`, calendar versioning, etc.)

The `releases/` subfolder is **only for product-style projects.** Pseudomonorepos and meta-repos generally don't have one — their changelogs are continuous, not versioned releases.

## Anti-patterns

- ❌ `changelog-2026-05-04.md` (no daily counter, breaks if you ship twice in one day)
- ❌ `2026-5-4.md` (not zero-padded, breaks lexicographic sorting)
- ❌ `May-4-2026.md` (not ISO, not sortable)
- ❌ `2026-05-04.md` without `_NN` (works until the day you ship twice)
- ❌ Mixing `.md` and `.markdown` extensions in the same project
- ❌ Putting product release messages in `changelog/` proper instead of `changelog/releases/`

## Sorting

The `YYYY-MM-DD_NN.md` pattern sorts correctly lexicographically. `ls changelog/` gives you chronological order. `ls -r changelog/` gives reverse-chronological (newest first), which is usually what you want for a feed.

---
title: "Preferred Stack — uv over pip, and other defaults"
date_created: 2026-05-07
date_modified: 2026-05-07
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7
semantic_version: 0.0.0.1
tags:
  - Reminder
  - Python
  - Tooling
  - Stack-Preferences
status: Active
---

# Preferred Stack — uv over pip, and other defaults

Short, sharp guidance to keep agents from defaulting to the wrong tool when the user has a clear preference. Update as preferences harden.

## Python: use `uv`, not `pip`

**Rule.** When installing Python packages, default to `uv` over `pip`. Use `uv pip install <pkg>` for one-off installs, `uv pip install -r requirements.txt` for project deps, and `uv add <pkg>` when working in a project that already uses a `uv`-managed `pyproject.toml`.

**Why:** the user prefers `uv` for its speed, deterministic resolution, and modern dependency-management ergonomics. Repeated `pip` invocations from agents create friction; the user has explicitly flagged this as a guidance point worth memorializing.

**How to apply:**
- In documentation and READMEs: lead with `uv pip install ...` examples; note the plain `pip` form as a fallback for users who don't have `uv` installed.
- In scripts that bootstrap dependencies: assume `uv` available; fall back to `pip` only with a clear message.
- Don't retroactively reinstall packages that were already installed with plain `pip` in a session — the user has confirmed that's wasted effort. Just switch going forward.
- Don't install pip packages into the user's global / pyenv environment without surfacing the install. Prefer adding to a project's `requirements.txt` or `pyproject.toml` and letting the user run the install command, OR run `uv pip install` and explicitly note what landed where.

## Other defaults (extend as they emerge)

This file is the home for stack-preference reminders that span multiple projects in `ai-labs/`. As new preferences come up — preferred testing framework, preferred logging library, preferred HTTP client, etc. — append a new section here rather than scattering them across project READMEs.

When a preference is project-specific (e.g., "this kit uses `chromadb` for vectors"), document it in the project's own `README.md` or `context-v/blueprints/`. This file is for cross-project defaults only.

## Related

- [[context-vigilance]] skill — for what a reminder is and how it should be shaped
- [[Collate-Context-Files-into-Context-Vigilance-as-Repo-&-Project]] — exploration where the kit's `requirements.txt` lives
- [[ChromaDB-as-Context-Improvement-Across-Everything-Everyone]] — adjacent exploration; Python deps install pattern from this preference applies

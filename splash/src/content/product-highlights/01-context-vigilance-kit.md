---
title: Context Vigilance Kit
slug: context-vigilance-kit
order: 1
status: v0 · four collections live
label: tooling
repo: https://github.com/lossless-group/context-vigilance-kit
tags:
  - corpus
  - chromadb
  - context-v
  - mcp
lede: |
  The local-RAG layer for the whole Lossless tree. Ingests four ChromaDB collections — `context-vigilance-corpus` (every context-v/ file), `lossless-changelog` (every changelog entry), `claude-code-sessions` (every prior agent turn), and `claude-code-tool-traces` (every tool invocation with success/error). Wired into Claude Code via MCP so any session can query prior work instead of paraphrasing from training data.
---

---
from: "dididecks-ai"
from_path: "context-v/architecture/DidiDecks-Frontend-And-Backend-Split.md"
---

# DidiDecks Frontend And Backend Split

## Purpose

This document compiles the useful DidiDecks architecture ideas from:

- `developing/mainarchitecture.md`

into the durable `architecture/` layer.

## Core decision

DidiDecks must be treated as a real SaaS product shell, not just a static deck
UI.

The clean split is:

```text
deck-saas/front-end
  = deployable frontend shell on Vercel
  = routes, components, typed API clients

aistack-backend/app/products/dididecks
  = product backend
  = persistence, auth, billing, deck state, review state, and AI workflows
```

## Frontend architecture

The frontend should contain:

- public marketing pages
- authentication pages
- dashboard app shell
- deck workspace
- billing and upgrade pages
- privacy and legal utility links
- typed API clients

The deployable structure should stay consistent with the current Next.js
product shell under `deck-saas/front-end`.

## Backend architecture

DidiDecks backend behavior should not live in the Vercel frontend.

Backend should own:

- auth/session handling
- users and workspaces
- decks
- slides
- blocks
- reviews
- comments
- analytics
- billing
- webhook-driven subscription updates

## Minimum backend data model

Useful baseline entities from the scratch plan:

- `users`
- `workspaces`
- `decks`
- `slides`
- `reviews`
- `comments`
- `subscriptions`
- `usage`

These should be implemented under AiStack backend ownership, not in the
frontend repo.

## Product shell implications

The dashboard should be a real SaaS surface:

- sidebar navigation
- utility bar
- topbar actions
- stats cards
- recent decks
- AI assistant surface

The deck workspace should be a real product flow:

- deck list
- create deck
- editor
- analytics
- reviews
- comments
- billing
- legal pages

## Current boundary rule

DidiDecks frontend may render the full product shell, but it must not become
the source of truth for:

- persistence
- billing
- auth
- AI command execution
- database writes outside approved APIs

## Related docs

- [../deck-saas/docs/DIDIDECKS_PRODUCT_ARCHITECTURE.md](../deck-saas/docs/DIDIDECKS_PRODUCT_ARCHITECTURE.md)
- [../deck-saas/docs/DIDIDECKS_FRONTEND_CONTRACT.md](../deck-saas/docs/DIDIDECKS_FRONTEND_CONTRACT.md)
- [../deck-saas/docs/DIDIDECKS_BACKEND_CONNECTION.md](../deck-saas/docs/DIDIDECKS_BACKEND_CONNECTION.md)
- [backend.md](./backend.md)
- [api/didideckapi.md](./api/didideckapi.md)

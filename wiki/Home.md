---
id: xcellent1-wiki-home
title: Xcellent1 Lawn Care — Wiki Home
category: architecture
owner: rick
version: 1
last_updated: 2026-04-01
qdrant_collection: doc_sections
tags: [xcellent1, lawn-care, wiki, home, overview]
---

# Xcellent1 Lawn Care Wiki

**Houston Lawn Care Business Management Platform**

Stack: Deno · TypeScript · Supabase · PostgreSQL · Fly.io | Framework: ERC (Empathize → Realize → Conceptualize)

---

## What Is Xcellent1

Xcellent1 is a real commercial lawn care SaaS operation built for a Houston-based lawn care business. It manages clients, crew, jobs, invoicing, payments, and a prospect waitlist. The software side is managed by @travone (Thelastlineofcode) using RicksGarage frameworks.

**Three user roles:** Owner · Crew · Client

**Phases 1–3:** Shipped and operational.
**Current:** Phase 4 — E2E testing + mobile crew UX.

---

## Wiki Navigation

| Section | File | Purpose |
|---|---|---|
| Home | `wiki/Home.md` | This page |
| ERC Flow | `wiki/erc-flow.md` | Phase-gated development discipline |
| Docs Standard | `wiki/docs-standard.md` | Frontmatter contract for all wiki docs |
| Architecture | `wiki/architecture/` | System design, schema, ADRs |
| Runbooks | `wiki/runbooks/` | Operational procedures |
| Agents | `wiki/agents/` | Agent charters and SOUL profiles |

---

## ERC Phase Summary

All features and issues must pass three gates before code ships:

| Phase | Label | Gate | What Happens |
|---|---|---|---|
| Empathize | `erc:empathize` | Exists | Problem validated, pain data recorded |
| Realize | `erc:realize` | ≥60 pts | Spec written, acceptance criteria, peer review |
| Conceptualize | `erc:conceptualize` | ≥90 pts | Architecture approved, @rick sign-off, ready to build |
| Blocked | `erc:blocked` | — | Gate failed, needs rework |

See `wiki/erc-flow.md` for the full phase definitions.

---

## System Architecture

```
Client Browser
    |
    v
Deno Server (server.ts) — port 8000
    |
    +—— Static HTML (web/static/)
    |       ├— owner.html        # Business owner dashboard
    |       ├— crew.html         # Crew daily job list
    |       ├— client.html       # Self-service client portal
    |       └— manage-*.html     # Owner management pages
    |
    +—— REST API (/api/...)
    |       ├— /api/owner/*      # Owner-only endpoints
    |       ├— /api/crew/*       # Crew-only endpoints
    |       └— /api/client/*     # Client-only endpoints
    |
    v
Supabase (PostgreSQL + Auth + Storage)
    ├— Database: clients, jobs, invoices, payments, waitlist
    ├— Auth: JWT with RLS policies
    └— Storage: job-photos bucket
```

---

## Key Docs

- `docs/LACARDIO_DASHBOARD_GUIDE.md` — Owner dashboard guide
- `db/schema.sql` — Full PostgreSQL schema
- `db/SETUP_SUPABASE_STORAGE.md` — Storage bucket setup
- `PHASES_1-3_COMPLETE.md` — Complete API docs + testing checklist

---

## RicksGarage Integration

- **RicksGarage project page:** `wiki/projects/xcellent1.md`
- **Agent context:** `RicksGarage/Xcellent1-Lawn-Care/`
- **Issue prefix:** `X1-###`
- **ERC enforcement:** Labels + CI gate (see `wiki/erc-flow.md`)
- **Perplexity Space:** Xcellent1 Lawn Care (this wiki serves as the knowledge base)

---

## Phase Roadmap

| Phase | Status | Key Features |
|---|---|---|
| 1 | ✅ Complete | Client CRUD, job scheduling, invoicing |
| 2 | ✅ Complete | Waitlist pipeline, client self-service payments |
| 3 | ✅ Complete | Before/after photo upload, payment verification |
| 4 | 🟡 In Progress | E2E tests, mobile crew UX, photo integration |
| 5 | 📋 Planned | AI agent integration, TTS crew assistant, SMS |

---

*Governed by RicksGarage ERC framework. Every issue must pass Empathize → Realize → Conceptualize before code ships.*

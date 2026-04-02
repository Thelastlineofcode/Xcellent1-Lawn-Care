---
id: xcellent1-wiki-home
title: Xcellent1 Lawn Care — Wiki Home
category: architecture
owner: travone
version: 2
last_updated: 2026-04-02
qdrant_collection: doc_sections
tags: [xcellent1, lawn-care, wiki, home, overview, river-parishes, laplace]
---

# Xcellent1 Lawn Care Wiki

**River Parish Lawn Care Business Management Platform**  
**Market:** LaPlace, Louisiana — St. John the Baptist, St. Charles, St. James Parishes

Stack: Deno · TypeScript · Supabase · PostgreSQL · Fly.io | Framework: ERC (Empathize → Realize → Conceptualize)

---

## What Is Xcellent1

Xcellent1 is a real commercial lawn care SaaS operation built for a River Parish-based lawn care business headquartered in LaPlace, Louisiana. It manages clients, crew, jobs, invoicing, payments, and a prospect waitlist. The software side is managed by @travone (Thelastlineofcode) using RicksGarage frameworks.

**Three user roles:** Owner · Crew · Client

**Phases 1–3:** Shipped and operational.  
**Current:** Phase 4 — E2E testing + mobile crew UX.  
**Upcoming:** Phase 5 — AI agent integration, in-app training modules, licensure-gated SOPs.

---

## Crew & Operations

| Crew Member | Role | License Status | SOP File |
|---|---|---|---|
| Lacardio | Lead Field Operator | Landscaping only (pesticide/irrigation/arborist: pending) | `staff/lacardio/SOPs_ERC_v1.1.md` |

**Lacardio's current licensed scope:** Mowing, edging, trimming, mulching, planting, sod installation, cleanup, hardscape blowing.  
**Locked services (license required):** Pesticide application (LDAF), irrigation (LA Plumbing Board), tree work (LA Horticulture Commission), commercial fertilizer (LDAF).  

See `staff/lacardio/SOPs_ERC_v1.1.md` for full field operating procedures with ERC efficiency notes.

---

## Wiki Navigation

| Section | File | Purpose |
|---|---|---|
| Home | `wiki/Home.md` | This page |
| ERC Flow | `wiki/erc-flow.md` | Phase-gated development discipline |
| Docs Standard | `wiki/docs-standard.md` | Frontmatter contract for all wiki docs |
| SOP (Dev) | `wiki/SOP.md` | Developer/project SOP — issue PRD template, merge criteria |
| Gig Worker Model | `wiki/gig-worker-model.md` | Crew contractor model and compensation |
| Stripe Integration | `wiki/stripe-integration.md` | Payment processing setup |
| Voice SEO | `wiki/voice-seo-positioning.md` | Local SEO strategy for River Parishes market |
| Webapp Platform | `wiki/webapp-platform.md` | Frontend platform decisions |
| Owner Interview | `wiki/owner-interview-2026-04-01.md` | Business owner discovery session notes |

**Staff Docs:**

| File | Purpose |
|---|---|
| `staff/lacardio/SOPs_ERC_v1.1.md` | Lacardio field SOPs — all 15 procedures, River Parishes ERC |
| `staff/agents_to_staff.md` | Agent-to-staff mapping and role definitions |
| `staff/jds/` | Job descriptions |

---

## ERC Phase Summary

All features and issues must pass three gates before code ships:

| Phase | Label | Gate | What Happens |
|---|---|---|---|
| Empathize | `erc:empathize` | Exists | Problem validated, pain data recorded |
| Realize | `erc:realize` | ≥60 pts | Spec written, acceptance criteria, peer review |
| Conceptualize | `erc:conceptualize` | ≥90 pts | Architecture approved, @travone sign-off, ready to build |
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

- `staff/lacardio/SOPs_ERC_v1.1.md` — Lacardio field operating procedures (River Parishes)
- `docs/LACARDIO_DASHBOARD_GUIDE.md` — Owner dashboard guide
- `db/schema.sql` — Full PostgreSQL schema
- `db/SETUP_SUPABASE_STORAGE.md` — Storage bucket setup
- `PHASES_1-3_COMPLETE.md` — Complete API docs + testing checklist
- `SOP.md` — Developer project SOP (issue PRD, merge criteria, mobile rules)

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
| 5 | 📋 Planned | AI agent integration, in-app training modules, licensure-gated SOPs for crew |

---

## River Parishes Operating Context

- **Service Area:** LaPlace → Reserve → Edgard → Lutcher → Gramercy → Destrehan (Hwy 61 / River Road corridor)
- **Primary Grass:** St. Augustine (3–4 inch cut), Centipede in older lots
- **Peak Season:** April–October | **Year-round** operation
- **Key Risk:** Flooding, humidity, live oak debris (Jan–March drop), hurricane season (June–November)
- **Licensing Body:** LDAF (pesticide/fertilizer), Louisiana State Plumbing Board (irrigation), LA Horticulture Commission (tree work)

---

*Governed by RicksGarage ERC framework. Every issue must pass Empathize → Realize → Conceptualize before code ships.*  
*Field operations governed by `staff/lacardio/SOPs_ERC_v1.1.md`. Updated 2026-04-02.*

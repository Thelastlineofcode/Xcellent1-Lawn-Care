---
id: xcellent1-wiki-home
title: Xcellent1 Lawn Care — Wiki Home
category: architecture
owner: travone
version: 3
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
**Phase 4:** 🟡 In Progress — Event notifications, crew checklists, lead scoring (spec: `wiki/webapp-platform.md` — `erc:conceptualize`, signed off, ~21hr build).  
**Phase 5:** 📋 Planned — AI agent integration, in-app training modules, licensure-gated SOPs.

---

## Crew & Operations

| Crew Member | Role | License Status | SOP File |
|---|---|---|---|
| Lacardio | Lead Field Operator | Landscaping only (pesticide/irrigation/arborist: pending) | `staff/lacardio/SOPs_ERC_v1.1.md` |

**Lacardio's current licensed scope:** Mowing, edging, trimming, mulching, planting, sod installation, cleanup, hardscape blowing.  
**Locked services (license required):** Pesticide (LDAF), irrigation (LA Plumbing Board), tree work (LA Horticulture Commission), commercial fertilizer (LDAF).  

See `staff/lacardio/SOPs_ERC_v1.1.md` for full field SOPs with ERC efficiency notes.

---

## Wiki Navigation

| Section | File | Purpose |
|---|---|---|
| Home | `wiki/Home.md` | This page |
| ERC Flow | `wiki/erc-flow.md` | Phase-gated development discipline |
| Docs Standard | `wiki/docs-standard.md` | Frontmatter contract for all wiki docs |
| SOP (Dev) | `wiki/SOP.md` | Developer/project SOP — issue PRD template, merge criteria |
| Webapp Platform | `wiki/webapp-platform.md` | Full Phase 4–5 module specs + IDE agent build prompt |
| Gig Worker Model | `wiki/gig-worker-model.md` | Crew contractor model and compensation |
| Stripe Integration | `wiki/stripe-integration.md` | Payment processing setup |
| Voice SEO | `wiki/voice-seo-positioning.md` | Local SEO strategy for River Parishes market |
| Owner Interview | `wiki/owner-interview-2026-04-01.md` | Business owner discovery session notes |

**Staff Docs:**

| File | Purpose |
|---|---|
| `staff/lacardio/SOPs_ERC_v1.1.md` | Lacardio field SOPs — 15 procedures, River Parishes ERC |
| `staff/agents_to_staff.md` | Agent-to-staff mapping and role definitions |
| `staff/jds/` | Job descriptions |

---

## ERC Phase Summary

| Phase | Label | Gate | What Happens |
|---|---|---|---|
| Empathize | `erc:empathize` | Exists | Problem validated, pain data recorded |
| Realize | `erc:realize` | ≥60 pts | Spec written, acceptance criteria, peer review |
| Conceptualize | `erc:conceptualize` | ≥90 pts | Architecture approved, @travone sign-off, ready to build |
| Blocked | `erc:blocked` | — | Gate failed, needs rework |

See `wiki/erc-flow.md` for full phase definitions.

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
    +—— Notification Worker (fly.toml process)
    |       └— polls outbox_events every 30s → Twilio / SendGrid / Realtime
    |
    v
Supabase (PostgreSQL + Auth + Storage + Realtime)
    ├— Database: clients, jobs, invoices, payments, photos, outbox_events
    ├— Auth: JWT with RLS policies
    └— Storage: job-photos bucket
```

---

## Build Status — Phase 4

| Module | ERC Phase | Ready | Est. |
|---|---|---|---|
| M1 — Owner Command Center | Conceptualize ✅ | Ready to build | 6.5 hr |
| M2 — Customer Portal | Conceptualize ✅ | Ready to build | 5 hr |
| M3 — Crew Self-Service | Conceptualize ✅ | Ready to build | 7 hr |
| M4 — Lead Intelligence | Conceptualize ✅ | Ready to build | 2.5 hr |
| M5 — Training System | Empathize ⏳ | Next sprint | TBD |

**IDE agent prompt:** bottom of `wiki/webapp-platform.md`

---

## Key Docs

- `wiki/webapp-platform.md` — Phase 4–5 full spec + IDE agent prompt (**start here**)
- `staff/lacardio/SOPs_ERC_v1.1.md` — Lacardio field operating procedures
- `db/schema.sql` — Full PostgreSQL schema
- `db/migrations/001_phase4_additions.sql` — Phase 4 schema additions (create before building)
- `PHASES_1-3_COMPLETE.md` — Completed API docs
- `SOP.md` — Developer project SOP

---

## RicksGarage Integration

- **Issue prefix:** `X1-###`
- **ERC enforcement:** Labels + CI gate (see `wiki/erc-flow.md`)
- **Perplexity Space:** Xcellent1 Lawn Care (this wiki is the knowledge base)

---

## River Parishes Operating Context

- **Service Area:** LaPlace → Reserve → Edgard → Lutcher → Gramercy → Destrehan (Hwy 61 / River Road corridor)
- **Primary Grass:** St. Augustine (3–4 inch cut), Centipede in older lots
- **Peak Season:** April–October | **Year-round** operation
- **Key Risk:** Flooding, humidity, live oak debris (Jan–March drop), hurricane season (June–November)
- **Licensing Body:** LDAF (pesticide/fertilizer), Louisiana State Plumbing Board (irrigation), LA Horticulture Commission (tree work)

---

*Governed by RicksGarage ERC framework. Every issue must pass Empathize → Realize → Conceptualize before code ships.*  
*Field operations: `staff/lacardio/SOPs_ERC_v1.1.md` | Last updated: 2026-04-02*

---
id: training-system-m5
title: Module 5 — In-App Training & Licensure System
erc_phase: realize
erc_score: 65
owner: travone
created: 2026-04-02
last_updated: 2026-04-02
tags: [training, licensure, ldaf, pesticide, crew, river-parishes, m5]
---

# Module 5 — In-App Training & Licensure System

## Problem Statement

Lacardio currently holds a general landscaping operator license covering 8 service types. Five high-margin service categories — pesticide application, irrigation, commercial fertilizer, tree removal, and major drainage work — are legally locked until he earns specific Louisiana licenses. Without a structured study path and in-app unlock mechanism, those services stay off the menu indefinitely, capping both revenue and crew value. No existing system guides him toward those licenses or rewards him when he earns them.

## Pain Data

- Lacardio has no LDAF Commercial Pesticide Applicator license — cannot legally apply any pesticide, herbicide, or weed killer (confirmed via `staff/lacardio/SOPs_ERC_v1.1.md`, TM-01)
- No irrigation contractor license — cannot install or repair irrigation systems (LA State Plumbing Board requirement)
- No arborist/horticulturist license — cannot perform tree removal or climbing (LA Horticulture Commission)
- No in-app study system exists — licenses require structured prep and Lacardio has no guided path
- ServiceTitan and similar platforms do not provide training content — this is a competitive differentiator built natively

## Root Cause

The `crew_licenses` table has been designed and added to `db/migrations/001_phase4_additions.sql`. The service unlock logic and UI states are defined architecturally. What is missing is: the training content outline for TM-01 (the pilot), the in-app UI spec for training modules, and the unlock trigger logic spec.

---

## Scope

Five training modules, one per locked license track. TM-01 ships first as the pilot. TM-02 through TM-05 follow in order of revenue impact.

| Module | License | Issuing Body | Services Unlocked | Revenue Priority |
|---|---|---|---|---|
| TM-01 | Commercial Pesticide Applicator | LDAF | Pesticide/Herbicide/Weed control | P0 — highest demand |
| TM-02 | Irrigation Contractor | LA State Plumbing Board | Irrigation install/repair | P1 |
| TM-03 | Restricted-Use Fertilizer Applicator | LDAF | Commercial fertilizer programs | P1 |
| TM-04 | Licensed Horticulturist / Arborist | LA Horticulture Commission | Tree removal, climbing, grinding | P2 |
| TM-05 | General Contractor (limited) | LSLBC | Drainage, grading, hardscape (major) | P2 |

---

## TM-01 — LDAF Commercial Pesticide Applicator (Pilot)

### License Overview

- **Issuing body:** Louisiana Department of Agriculture and Forestry (LDAF)
- **Exam:** Written — Core exam + Category 3B (Ornamental & Turf)
- **Cost:** ~$75 application fee (free tier: study materials are LDAF-published PDFs)
- **Renewal:** Every 3 years, 6 CEU credits
- **Study source:** [LDAF Pesticide Division](https://www.ldaf.state.la.us/regulatory-and-environmental-programs/pesticides/)

### Study Content Outline (In-App TM-01)

Each section = one in-app lesson card. Estimated study time: 8–10 hours total.

**Unit 1 — Pesticide Laws & Regulations (Core)**
- Federal Insecticide, Fungicide, and Rodenticide Act (FIFRA) basics
- Louisiana Pesticide Law (La. R.S. 3:3201)
- LDAF licensing requirements for commercial applicators
- Label is the law: reading and interpreting pesticide labels
- Record-keeping requirements for commercial applicators
- *Quiz: 10 questions*

**Unit 2 — Pesticide Safety & Handling (Core)**
- Personal protective equipment (PPE): gloves, goggles, respirators, coveralls
- Signal words: Danger / Warning / Caution
- Routes of pesticide exposure: dermal, inhalation, ingestion, ocular
- First aid and emergency response procedures
- Safe storage: temperature, segregation from food/water, locked storage
- Safe disposal: triple-rinse, empty container disposal (LA requirements)
- *Quiz: 10 questions*

**Unit 3 — Pesticide Application Equipment (Core)**
- Sprayer types: backpack, boom, handheld, granular spreader
- Calibration: calculating application rate (oz/1000 sqft, gallons/acre)
- Nozzle types and spray patterns
- Equipment maintenance and cleaning between applications
- Preventing drift: wind speed, nozzle height, droplet size
- *Quiz: 10 questions*

**Unit 4 — Environmental & Health Hazards (Core)**
- Groundwater and surface water contamination risks (River Parishes: high flood risk)
- Buffer zones near water bodies (bayous, drainage canals common in St. John/St. Charles)
- Integrated Pest Management (IPM) principles
- Pesticide persistence and breakdown in Louisiana climate (heat/humidity accelerates)
- Reporting spills: LDAF hotline, EPA requirements
- *Quiz: 10 questions*

**Unit 5 — Ornamental & Turf Pest Management (Category 3B)**
- Common River Parishes lawn pests: chinch bugs, grubs, armyworms, fire ants, sod webworms
- Common diseases: brown patch (St. Augustine summer fungal), take-all root rot, dollar spot
- Common weeds: nutgrass/nutsedge, dollar weed, spurge, crabgrass
- Pesticide selection by pest type: herbicide vs. insecticide vs. fungicide
- St. Augustine grass pesticide tolerance (sensitive to some herbicides — critical for River Parishes)
- Pre-emergent vs. post-emergent herbicide timing (seasonal calendar for South Louisiana)
- Application timing: early morning, avoid rain within 24hr, temperature windows
- *Quiz: 15 questions*

**Unit 6 — Exam Prep**
- Full 50-question practice exam (Core + 3B combined)
- Answer key with explanations
- LDAF exam registration link + scheduling instructions
- *Pass threshold: 70% on practice exam before exam registration recommended*

---

## In-App Training UI Spec

### Training Module Card (Crew View)

```
[LOCKED 🔒]  Pesticide Application
  Requires: LDAF Commercial Pesticide License
  Progress: 0 / 6 units complete
  [Start Studying →]
```

When `crew_licenses.status = 'active'` for `license_type = 'pesticide_applicator'`:
```
[UNLOCKED ✅]  Pesticide Application
  License: LDAF #XXXXXXXX  Expires: MM/YYYY
  [View SOP TM-01 →]
```

### Training Progress States

| State | UI Indicator | Condition |
|---|---|---|
| Locked | 🔒 gray card | `crew_licenses` row absent or `status = 'pending'` |
| In Progress | 🟡 yellow, progress bar | At least 1 unit complete, license not yet active |
| Exam Ready | 🟠 orange, "Register for Exam" CTA | All units + practice exam ≥70% |
| Unlocked | ✅ green card | `crew_licenses.status = 'active'` |
| Expired | ⚠️ red | `crew_licenses.expiry_date < TODAY` |

### Unlock Trigger Logic

Owner uploads license document in owner dashboard → system sets `crew_licenses.status = 'active'`, `license_number`, `issued_date`, `expiry_date`, `document_url` → Supabase Realtime pushes update to crew view → locked service types in `CHECKLISTS` map become available → owner sees expanded service type options on job creation form.

**No self-certification.** Only owner can mark license active. Prevents crew from unlocking locked services without verified credentials.

---

## Schema (Already Defined)

See `db/migrations/001_phase4_additions.sql` — `crew_licenses` table with RLS. No additional schema needed for TM-01 pilot. Training progress tracked in a new `training_progress` table (added in Phase 5 migration):

```sql
-- Phase 5 migration (not yet written)
CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,     -- 'TM-01' through 'TM-05'
  unit_id TEXT NOT NULL,       -- 'TM-01-U1' through 'TM-01-U6'
  completed BOOLEAN DEFAULT FALSE,
  quiz_score INT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Acceptance Criteria (Realize Gate)

- [x] `crew_licenses` schema designed and in `db/migrations/001_phase4_additions.sql`
- [x] Training content outline written for TM-01 (LDAF pesticide) — 6 units, all quizzes defined
- [x] License unlock logic spec written (owner-only activation, UI state transitions documented)
- [x] Training module card UI states defined (locked / in-progress / exam-ready / unlocked / expired)
- [ ] Lacardio reviews and approves module structure (required before Conceptualize)
- [ ] TM-02 through TM-05 content outlines written

**ERC Score: 65/100** — gate passed. Blocked on Lacardio review before moving to Conceptualize.

---

## Peer Review

- Spec author: @travone
- Business content review: Lacardio (required — must confirm unit topics match real exam prep needs)
- Architecture sign-off: @travone (Conceptualize gate)

---

## References

- `staff/lacardio/SOPs_ERC_v1.1.md` — TM-01 through TM-05 locked service SOPs
- `db/migrations/001_phase4_additions.sql` — `crew_licenses` table
- `wiki/webapp-platform.md` — Module 5 architectural slot
- LDAF Pesticide Division: https://www.ldaf.state.la.us/regulatory-and-environmental-programs/pesticides/
- Louisiana R.S. 3:3201 (Pesticide Law)

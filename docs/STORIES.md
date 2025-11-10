# User Stories - Xcellent1 Lawn Care

## Overview

This document contains all 90+ user stories across 9 epics for the Xcellent1 Lawn Care SaaS platform.

## Priority Legend

- **P0**: Must Have (MVP Blockers) - 18 stories, ~125 points
- **P1**: Should Have (High Value) - 36 stories, ~310 points
- **P2**: Could Have (Nice to Have) - 31 stories, ~310 points
- **P3**: Won't Have (Future Backlog) - 6 stories, ~68 points

---

## Epic 1: Customer Acquisition & Onboarding

**Goal**: Make it effortless for customers to get quotes and book services  
**Success Metrics**: 25% increase in quotes, 50% faster response, 30% conversion

### Story 1.1: Instant Quote Calculator (P0)

**As a** homeowner  
**I want** to get a price estimate instantly on the website  
**So that** I know if the service fits my budget before contacting anyone

**Acceptance Criteria**:

- [x] Simple form: address, lawn size (sqft or lot size), service type (owner dashboard only)
- [x] Returns price range (low-high) in under 2 seconds
- [x] Shows next steps (book now or request custom quote)
- [x] Mobile-responsive design
- [x] Validation for service area (LaPlace/Norco)

**Technical Notes**:

- API endpoint: `POST /api/v1/quotes/estimate`
- Uses pricing heuristics from `pricing.ts`
- Store quote in `leads` table for follow-up

**Story Points**: 8  
**Dependencies**: None

---

### Story 1.2: AI Chat Support 24/7 (P0)

**As a** potential customer  
**I want** to ask questions anytime via chat  
**So that** I get instant answers without waiting for business hours

**Acceptance Criteria**:

- [ ] Chat widget on all pages
- [ ] LangChain agent with Perplexity Sonar integration
- [ ] Handles FAQs (pricing, services, availability, scheduling)
- [ ] Escalates to SMS/email if can't answer
- [ ] Conversation memory across session

**Technical Notes**:

- Use existing `perplexity_research.py` skill
- Store conversations in `chat_sessions` table
- Agent: `intake` handler with LangChain integration

**Story Points**: 13  
**Dependencies**: Perplexity API setup, LangChain integration

**Status:** Future/Backlog

---

### Story 1.3: One-Click Booking (P0)

**As a** customer who received a quote  
**I want** to book a service with one click  
**So that** I can schedule quickly without forms

**Acceptance Criteria**:

- [ ] Pre-filled form with quote details
- [ ] Select preferred date/time from available slots
- [ ] Confirm customer details (name, phone, email)
- [ ] Instant confirmation via SMS + email
- [ ] Add to crew schedule automatically

**Technical Notes**:

- API: `POST /api/v1/jobs`
- Triggers scheduler agent for crew assignment
- Uses Twilio for SMS, SendGrid for email

**Story Points**: 8  
**Dependencies**: Story 1.1, Story 2.3 (scheduling system)

---

### Story 1.4: Mobile-Responsive Forms (P0)

**As a** mobile user  
**I want** all forms to work perfectly on my phone  
**So that** I can book services while on the go


**Acceptance Criteria**:

- [x] Touch-friendly inputs (large tap targets)
- [x] Auto-zoom disabled on input focus
- [x] Progressive form (one question at a time on mobile)
- [x] Works offline with service worker
- [x] Fast load time (<2 seconds on 3G)

**Technical Notes**:

- Tailwind CSS responsive utilities
- PWA manifest and service worker
- Test on iPhone SE and Android devices

**Story Points**: 5  
**Dependencies**: All form-based stories

---

### Story 1.5: Service Area Validation (P1)

**As a** business owner  
**I want** to only accept customers in LaPlace/Norco  
**So that** I don't waste time on leads outside my service area

**Acceptance Criteria**:

- [ ] Geocode address on quote form
- [ ] Show friendly message if outside area
- [ ] Optional: collect lead anyway for future expansion
- [ ] Highlight service area on map

**Technical Notes**:

- Use Google Maps Geocoding API
- Define service boundary polygon
- Store rejected leads separately

**Story Points**: 5  
**Dependencies**: Story 1.1

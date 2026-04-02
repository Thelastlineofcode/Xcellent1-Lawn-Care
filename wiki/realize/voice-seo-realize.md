---
id: voice-seo-realize
title: Voice SEO Positioning — Realize Spec
erc_phase: realize
linked_issue: 26
owner: travone
created: 2026-04-01
tags: [seo, voice-search, schema, gbp, bing, apple, yelp, squanchy]
---

# Realize Spec — Voice Search & SEO Positioning

**Linked Issue:** #26  
**Wiki Spec:** `wiki/voice-seo-positioning.md`  
**Gate 1 Notes:** `wiki/hitl/empathize-voice-seo-2026-04-01.md` ✅  
**Peer Reviewer:** Travone Butler  
**Gate 2 required before implementation:** `wiki/hitl/realize-voice-seo-<date>.md`

---

## Architecture Decision

This feature has two tracks that run in parallel:

1. **Listings track** — Manual one-time claims + ongoing automated maintenance via squanchy agent
2. **Schema track** — JSON-LD additions to the site served from Fly.io (Deno/TypeScript stack)

No database changes. No new backend routes. Schema is injected into HTML `<head>` server-side in `server.ts`.

---

## Implementation Plan

### Track 1 — Platform Listings (One-Time Human Tasks)

These cannot be automated — each platform requires identity verification by the business owner.

| # | Platform | Powers | Action | URL | Time Est. |
|---|---|---|---|---|---|
| 1 | Google Business Profile | Google Assistant, Maps | Claim, verify, fill all fields, add services + photos | https://business.google.com | 30 min |
| 2 | Bing Places | Amazon Alexa, Cortana | Create listing, verify by phone/postcard | https://www.bingplaces.com | 20 min |
| 3 | Apple Business Connect | Siri, Apple Maps | Claim, verify, add hours + photos | https://businessconnect.apple.com | 20 min |
| 4 | Yelp | Alexa (local fallback) | Claim free listing, complete all fields | https://biz.yelp.com | 15 min |

**NAP Standard (must be identical everywhere):**
```
Name:    Xcellent1 Lawn Care
Address: [LaCardio’s confirmed business address — LaPlace, LA]
Phone:   [confirmed phone number]
Website: [confirmed domain]
```

### Track 2 — Schema Markup (Agent Task — feature/voice-seo branch)

**File:** `server.ts` (or extracted to `src/schema.ts` — agent decides based on code audit)

**Schema 1 — LocalBusiness JSON-LD**
```json
{
  "@context": "https://schema.org",
  "@type": "LawnCareService",
  "name": "Xcellent1 Lawn Care",
  "image": "[logo url]",
  "url": "[site url]",
  "telephone": "[phone]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[address]",
    "addressLocality": "LaPlace",
    "addressRegion": "LA",
    "postalCode": "[zip]",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 30.0688,
    "longitude": -90.4801
  },
  "areaServed": [
    "LaPlace, LA", "Norco, LA", "Destrehan, LA", "Luling, LA", "St. Rose, LA"
  ],
  "openingHoursSpecification": [
    {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "07:00", "closes": "18:00"},
    {"@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "07:00", "closes": "14:00"}
  ],
  "priceRange": "$$",
  "sameAs": [
    "[Google Business Profile URL]",
    "[Yelp URL]",
    "[Facebook URL if exists]"
  ]
}
```

**Schema 2 — FAQPage JSON-LD (top 5 voice query patterns)**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Who does lawn care near me in LaPlace Louisiana?",
      "acceptedAnswer": {"@type": "Answer", "text": "Xcellent1 Lawn Care serves LaPlace, Norco, Destrehan, Luling, and St. Rose. Call or book online for a free quote."}
    },
    {
      "@type": "Question",
      "name": "How much does lawn mowing cost in LaPlace LA?",
      "acceptedAnswer": {"@type": "Answer", "text": "Xcellent1 Lawn Care offers competitive rates for residential and commercial lawn mowing in the LaPlace area. Request a free quote online."}
    },
    {
      "@type": "Question",
      "name": "Is Xcellent1 Lawn Care available on weekends?",
      "acceptedAnswer": {"@type": "Answer", "text": "Yes. Xcellent1 Lawn Care serves clients Monday through Saturday in LaPlace and surrounding areas."}
    },
    {
      "@type": "Question",
      "name": "Does Xcellent1 offer fertilization and aeration in Louisiana?",
      "acceptedAnswer": {"@type": "Answer", "text": "Yes. Xcellent1 provides fertilization, aeration, and full lawn care services tuned to Louisiana’s warm-season grass types including St. Augustine, Bermuda, and Zoysia."}
    },
    {
      "@type": "Question",
      "name": "How do I book a lawn care service in Norco or Destrehan LA?",
      "acceptedAnswer": {"@type": "Answer", "text": "Book online at [site url] or call [phone]. Xcellent1 serves Norco, Destrehan, LaPlace, and surrounding St. John and St. Charles Parish communities."}
    }
  ]
}
```

### Track 3 — squanchy Agent Automation

**Task:** Weekly Google Business Profile post generation  
**Agent:** squanchy  
**Trigger:** Cron — every Monday 8am CT  
**Output:** Post drafted + published to GBP via Google My Business API  
**Content rotation:** seasonal tip, service highlight, review request, before/after photo prompt  
**File to create:** `agents/squanchy/gbp-weekly-post.ts` (or `.py` — agent decides based on existing squanchy stack)

---

## Acceptance Criteria (Gate 2 — all must pass before implementation)

- [ ] HITL Gate 2 meeting notes filed: `wiki/hitl/realize-voice-seo-<date>.md`
- [ ] NAP confirmed with LaCardio (exact name, address, phone, website)
- [ ] LocalBusiness JSON-LD schema validated via https://validator.schema.org
- [ ] FAQPage JSON-LD schema validated via https://validator.schema.org
- [ ] Schema injected server-side in `server.ts` — present in HTML `<head>` on every page load
- [ ] All 4 platform listings claimed and verified (LaCardio action items — cannot be delegated to agents)
- [ ] squanchy GBP post agent tested — at least one successful test post before prod
- [ ] Google Search Console connected to site domain
- [ ] Rich results test passes: https://search.google.com/test/rich-results

## Tests

Path: `tests/seo/`

```typescript
// tests/seo/schema.test.ts
// Test 1: LocalBusiness schema present in page HTML
// Test 2: FAQPage schema present in page HTML  
// Test 3: NAP fields match across schema and listing data
// Test 4: areaServed includes all 5 target cities
// Test 5: sameAs URLs are valid and return 200
```

---

## Effort Estimate

| Track | Owner | Est. Time |
|---|---|---|
| Platform listings (4x) | LaCardio (human required) | 1.5 hrs one-time |
| LocalBusiness + FAQPage schema | IDE Agent | 2 hrs |
| squanchy GBP post agent | IDE Agent | 3 hrs |
| Tests | IDE Agent | 1 hr |
| Search Console setup | Travone | 30 min |

**Total ship estimate: 1 working session post Gate 2 approval**

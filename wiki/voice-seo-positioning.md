---
id: voice-seo-positioning
title: Voice Search & SEO Positioning
erc_phase: empathize
owner: travone
created: 2026-04-01
tags: [seo, voice-search, google, alexa, local, schema]
---

# Feature: Voice Search & SEO Positioning

## Problem Statement
LaCardio is receiving pitches from advertisers offering to position Xcellent1 on Alexa and Google Voice Search for a fee. The current site has no structured data, no Google Business Profile optimization, no Bing Places listing (Alexa’s data source), and no Apple Business Connect claim. Paying a third party to do this is wasteful — all core positioning work can be done in-house at zero recurring cost and agents can automate maintenance.

## Pain Data
- Advertisers are pitching paid positioning — LaCardio is the target, implying the gap is visible
- Google Assistant pulls from Google Business Profile + Google Maps [web:101]
- Amazon Alexa uses **Bing** for web search and **Yelp** for local business data — not Google [web:101]
- Apple Siri uses Apple Maps / Apple Business Connect [web:101]
- Voice results load 52% faster than average pages — site performance directly impacts ranking [web:94]
- NAP (Name, Address, Phone) consistency across all directories is the #1 local voice SEO factor [web:98]

## Root Cause
Xcellent1 has no claimed or optimized listings on the three platforms that power every major voice assistant. There is no LocalBusiness schema markup on the site. No FAQ or HowTo schema exists to capture featured snippet / position zero results that voice assistants read aloud.

## Acceptance Criteria (to move to REALIZE)
- [ ] Google Business Profile claimed, verified, and fully populated (services, hours, photos, service areas, weekly posts)
- [ ] Bing Places listing created and verified (powers Alexa + Cortana)
- [ ] Apple Business Connect claimed (powers Siri)
- [ ] Yelp business profile active and accurate (secondary Alexa data source)
- [ ] LocalBusiness JSON-LD schema added to site
- [ ] FAQPage schema added for top 5 voice query patterns (e.g. “lawn care near me Houston”)
- [ ] squanchy agent maintains weekly Google Business Profile posts automatically
- [ ] NAP consistent across all listings and site

## References
- Voice SEO guide: https://almcorp.com/blog/voice-search-seo-2026-complete-guide/
- Multi-assistant optimization: https://www.monsterinsights.com/voice-search-optimization/
- Platform data sources: https://www.agiledigitalagency.com/blog/voice-search-optimisation-professional-services/
- Related issue: to be filed

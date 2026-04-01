---
title: Xcellent1 Lawn Care — Perplexity Space
description: Central knowledge hub for Xcellent1 Lawn Care operations, services, and team docs
slug: index
erc_phase: empathize
tags:
  - overview
  - wiki
  - perplexity-space
---

# Xcellent1 Lawn Care

{% callout type="note" %}
This is the Perplexity Space wiki for **Xcellent1 Lawn Care** — a full-service lawn care company based in LaPlace, LA serving the greater Houston, TX metro area.
{% /callout %}

## Overview

Xcellent1 Lawn Care provides residential and commercial lawn care services across Louisiana and Texas. All documentation in this wiki follows the **RicksGarage ERC framework** for consistent project and operations management.

## ERC Phases

{% erc_status phase="empathize" issue="X1-1" %}

All work items, service requests, and epics move through the ERC workflow:

| Phase | Description |
|-------|-------------|
| `empathize` | Understand client need, scope, and context |
| `realize` | Plan, assign, and resource the work |
| `conceptualize` | Execute, document, and deliver |
| `blocked` | Flagged for escalation or resolution |

## Services

### Residential

- Lawn mowing & edging
- Weed control & fertilization
- Leaf removal
- Core aeration
- Seasonal cleanups

### Commercial

- Property maintenance contracts
- Landscape design & installation
- Irrigation system management
- HOA and multi-family properties

## Service Areas

{% tabs %}
{% tab label="Louisiana" %}
- LaPlace, LA (HQ)
- Metairie, LA
- Kenner, LA
- New Orleans Metro
{% /tab %}
{% tab label="Texas" %}
- Houston, TX
- Katy, TX
- Sugar Land, TX
- Pearland, TX
{% /tab %}
{% /tabs %}

## Wiki Sections

- [Services](/docs/wiki/services/index) — Full service catalog with pricing guides
- [Jobs](/docs/wiki/jobs/index) — Work order and job tracking
- [Staff](/docs/wiki/staff/index) — Team roster and assignments
- [Operations](/docs/wiki/ops/index) — Scheduling, routing, equipment
- [ERC Board](/docs/wiki/erc/index) — Active ERC phase tracking

## Tech Stack

{% figure src="/images/xcellent1-arch.png" alt="Xcellent1 system architecture" caption="System architecture overview" %}

This wiki is authored in **Markdoc** (Stripe-style) with:

- Custom tags: `callout`, `figure`, `tabs`, `tab`, `erc_status`
- Frontmatter schema validation via `markdoc/schema/`
- ERC phase badges for all work items
- Hosted via the web app at `xcellent1.com`

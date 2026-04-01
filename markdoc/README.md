# Markdoc — Xcellent1 Lawn Care

Stripe-style Markdoc implementation for Xcellent1 Lawn Care documentation system.

## Overview

This directory contains the Markdoc configuration, custom tags, node overrides, and schema definitions that power the Xcellent1 wiki and documentation site.

## Structure

```
markdoc/
  config.ts         # Global Markdoc config (nodes + tags + variables)
  nodes.ts          # Custom node overrides (heading, paragraph, fence, etc.)
  tags.ts           # Custom tag definitions (callout, figure, tabs, erc_status, etc.)
  schema/
    service.ts      # Frontmatter schema for service pages
    job.ts          # Frontmatter schema for job/work-order docs
  README.md         # This file
```

## Custom Tags

| Tag | Description | Required Attributes |
|-----|-------------|---------------------|
| `callout` | Alert/notice box | `type` (note/warning/tip/danger) |
| `figure` | Image with caption | `src`, `alt`, `caption` |
| `table` | Responsive data table | `caption` (optional) |
| `tabs` | Tabbed content container | none |
| `tab` | Individual tab panel | `label` |
| `erc_status` | ERC phase status badge | `phase`, `issue` |

## Usage

### Callout

```markdoc
{% callout type="note" %}
This is a note callout.
{% /callout %}
```

### ERC Status Badge

```markdoc
{% erc_status phase="empathize" issue="X1-42" %}
```

### Tabs

```markdoc
{% tabs %}
{% tab label="Louisiana" %}
Content for LA tab.
{% /tab %}
{% tab label="Texas" %}
Content for TX tab.
{% /tab %}
{% /tabs %}
```

## Variables

Global variables available in all docs via `$company.*` and `$services.*`:

- `$company.name` — `Xcellent1 Lawn Care`
- `$company.locations` — `['LaPlace, LA', 'Houston, TX']`
- `$company.erc_phases` — `['empathize', 'realize', 'conceptualize', 'blocked']`
- `$services.residential` — array of residential service slugs
- `$services.commercial` — array of commercial service slugs

## ERC Integration

All docs support ERC phase tracking via the `erc_status` tag and the `erc_phase` frontmatter field. Phases:

- `empathize` — discovery / scoping
- `realize` — planning / resourcing
- `conceptualize` — execution / delivery
- `blocked` — escalation required

## References

- [Markdoc Docs](https://markdoc.dev)
- [RicksGarage ERC Framework](https://github.com/Thelastlineofcode/ricksgarage)
- [Xcellent1 Wiki](/docs/wiki/index.md)

---
id: xcellent1-docs-standard
title: Documentation Standard — Frontmatter Contract (Xcellent1)
category: ops
owner: rick
version: 1
last_updated: 2026-04-01
qdrant_collection: doc_sections
tags: [docs, frontmatter, standards, xcellent1, wiki]
---

# Documentation Standard

The contract every doc in `wiki/` must satisfy for Xcellent1 Lawn Care.

Source of truth: [RicksGarage wiki/docs-standard.md](https://github.com/Thelastlineofcode/RicksGarage/blob/main/wiki/docs-standard.md)

---

## Overview

Every file in `wiki/` must begin with valid YAML frontmatter. Non-compliant docs are invisible to agents and skipped by the docmunch pipeline.

**Hard rule: A doc not in `doc_sections` does not exist to agents.**

---

## Frontmatter Contract

Copy this block verbatim as the first lines of every markdown file:

```yaml
---
id: unique-slug           # kebab-case, globally unique across all docs
title: Human-readable title
category: architecture|agent|ops|api|security|runbook|adr|research
owner: travone            # person responsible for this doc
version: 1                # increment on substantive changes
last_updated: YYYY-MM-DD
qdrant_collection: doc_sections
tags: []                  # lowercase array e.g. [xcellent1, lawn-care, api]
---
```

---

## Field Rules

| Field | Required | Format | Notes |
|---|---|---|---|
| `id` | ✅ | `kebab-case` | Globally unique. Never reuse. |
| `title` | ✅ | Free text | Human-readable, title case |
| `category` | ✅ | Enum (see below) | Determines wiki auto-sync |
| `owner` | ✅ | Person/agent ID | Who is accountable for this doc |
| `version` | ✅ | Integer | Start at 1, increment on substantive edits |
| `last_updated` | ✅ | `YYYY-MM-DD` | Update on every substantive change |
| `qdrant_collection` | ✅ | `doc_sections` | Always this value |
| `tags` | ✅ | Array of lowercase strings | Used for Qdrant payload filtering |

---

## Category Definitions

| Category | Use For | Wiki Auto-Sync |
|---|---|---|
| `architecture` | System design, service maps, ADRs | ✅ Yes |
| `agent` | Agent charters, SOUL profiles | ✅ Yes |
| `ops` | Runbooks, CI/CD, infra operations | ✅ Yes |
| `runbook` | Step-by-step operational procedures | ✅ Yes |
| `adr` | Architecture Decision Records | ✅ Yes |
| `api` | REST/Supabase interface specs | ❌ No |
| `security` | Threat models, auth policies | ❌ No |
| `research` | Spikes, competitive analysis | ❌ No |

---

## Backfill Priority

For existing docs in `docs/` without frontmatter, backfill in this order:

1. `wiki/` files (Home.md, erc-flow.md, docs-standard.md) — done
2. `docs/` files by recency
3. `db/` setup guides

---

## Related

- [Wiki Home](Home.md)
- [ERC Flow](erc-flow.md)
- [RicksGarage Docs Standard](https://github.com/Thelastlineofcode/RicksGarage/blob/main/wiki/docs-standard.md)

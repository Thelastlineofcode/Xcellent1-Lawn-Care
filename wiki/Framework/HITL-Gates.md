---
id: hitl-gates
title: HITL Gates — Human-in-the-Loop Checkpoints
category: framework
owner: travone
version: 1
last_updated: 2026-04-01
tags: [hitl, gates, framework, wfd, erc, review, governance]
---

# HITL Gates — Human-in-the-Loop Checkpoints

HITL Gates are mandatory human review checkpoints embedded into the WFD + ERC framework. No agent, automation, or CI pipeline can advance a feature past a gate without a human-authored meeting notes file committed to the repo. This document is the authoritative spec for all projects under Unity.

---

## Gate Overview

| Gate | Trigger | Blocks | Authority |
|---|---|---|---|
| Gate 0 — Wiki Design | New feature/issue filed | All ERC phases | Travone |
| Gate 1 — Empathize Sign-Off | Empathize complete | Realize phase | Travone |
| Gate 2 — Realize / Design Review | Realize spec complete | Implementation | Travone |
| Gate 3 — Code Review / Merge | Implementation complete | Merge to main | Travone |

---

## xcellent1 Deployment Protocol

xcellent1 is live on Fly.io + Cloudflare. `main` is the source of truth and auto-deploy trigger.

```
  feature/<name>     ← agent iterates (post REALIZE gate only)
        │
        ▼ (PR — HITL Gate 3: Travone reviews)
  main               ← source of truth + auto-deploy trigger
        │
        ▼
  Fly.io + Cloudflare  ← live production
```

**Rules:**
- No direct pushes to main. Every change through a feature branch PR.
- HITL Gate 3 (PR review by Travone) required before any merge to main.
- Agents may NOT merge to main under any circumstances.

---

## Gate Definitions

### Gate 0 — Wiki Design
**Required file:** `wiki/hitl/wiki-design-<feature-slug>-<YYYY-MM-DD>.md`  
**Agent rule:** Draft spec, open wiki PR, STOP. Do not begin empathize until PR is merged.

### Gate 1 — Empathize Sign-Off
**Required file:** `wiki/hitl/empathize-<feature-slug>-<YYYY-MM-DD>.md`  
**Agent rule:** STOP if file absent. Comment on issue: "⛔ HITL Gate 1 required."

### Gate 2 — Realize / Design Review
**Required file:** `wiki/hitl/realize-<feature-slug>-<YYYY-MM-DD>.md`  
**Additional:** Tests committed to `tests/` before implementation begins.  
**Agent rule:** STOP if file absent or tests not committed.

### Gate 3 — Code Review / Merge
**Required:** Copilot review → Travone PR review → HITL Compliance Checklist complete.  
**Agent rule:** NEVER merge to main without explicit human approval on the PR.

---

## Required Meeting Notes Format

**File path:** `wiki/hitl/<gate>-<feature-slug>-<YYYY-MM-DD>.md`

```markdown
# HITL Review — <Gate Name>
**Feature:** <feature name>
**Date:** YYYY-MM-DD
**Attendees:** <names/handles>
**Gate:** wiki-design | empathize | realize | create

## What Was Reviewed
<brief description>

## Decisions Made
<any changes to spec, acceptance criteria, or approach>

## Approval
- [ ] Approved as-is
- [ ] Approved with changes (document above)
- [ ] Rejected — return to previous phase

**Approved by:** <human name/handle>
**Signature:** <date + handle>
```

---

## PR Compliance Checklist

Every PR description must include this. If any box is unchecked, the PR cannot be merged.

```markdown
## HITL Compliance Checklist
- [ ] Wiki PR link: <url>
- [ ] Wiki PR approved by human: YES/NO
- [ ] HITL meeting notes present: wiki/hitl/<file>.md
- [ ] ERC phase at time of PR: wiki-design | empathize | realize | conceptualize
- [ ] Tests defined and passing: YES/NO
- [ ] Copilot review requested: YES/NO
```

---

## Open Issues — Current Gate Status

| Issue | ERC Phase | Gate Needed | Blocker |
|---|---|---|---|
| #23 Crew Performance Self-View | EMPATHIZE | Gate 1 | Commit LaCardio conversation to `wiki/hitl/empathize-crew-performance-2026-04-01.md` |
| #24 Push Notifications | EMPATHIZE | Gate 1 → Gate 2 | Gate 1 meeting notes, then realize spec + tests |
| #21 Autoresearch Loop | PRE-ERC | Gate 0 | Wiki spec PR must be merged before empathize begins |

---

## IDE Agent Enforcement Prompt

```
You are an IDE agent operating under the Unity Development Framework.

BEFORE beginning any implementation task, verify:

1. Does a wiki spec exist for this feature?
   - Path: wiki/<feature-name>.md
   - If NO: Draft wiki spec, open wiki PR, STOP — wait for human approval.
   - If YES: Confirm wiki PR is MERGED (not just open).

2. Does a HITL meeting notes file exist for the current ERC phase?
   - Path: wiki/hitl/<phase>-<feature>-<date>.md
   - If NO: Comment on the issue:
     "⛔ HITL gate required. Please schedule review and commit meeting
      notes to wiki/hitl/ before this phase can proceed."
   - STOP. Do not continue.

3. Only if both checks pass: proceed with implementation on feature/<name> branch.

4. When opening a PR, include the HITL Compliance Checklist.

NEVER merge to main without explicit human approval on the PR.
```

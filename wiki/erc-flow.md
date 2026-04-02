---
id: xcellent1-erc-flow
title: ERC Flow — Empathize, Realize, Conceptualize (Xcellent1)
category: architecture
owner: travone
version: 2
last_updated: 2026-04-02
qdrant_collection: doc_sections
tags: [erc, flow, empathize, realize, conceptualize, phase-gate, xcellent1]
---

# ERC Flow — Empathize → Realize → Conceptualize

ERC is RicksGarage's phase-gated development discipline, applied to Xcellent1 Lawn Care. Every issue, feature, and change must pass through all three phases before code ships. **Agents cannot skip phases.**

Source of truth: [RicksGarage wiki/erc-flow.md](https://github.com/Thelastlineofcode/RicksGarage/blob/main/wiki/erc-flow.md)

---

## Phase 1 — EMPATHIZE

**Label:** `erc:empathize` | **Gate:** Exists (no numeric threshold) | **Owner:** @travone

Empathize is the problem discovery phase. No spec is written, no code is touched. The only output is a validated problem statement with supporting data.

**Required artifacts:**
- `problem_statement` — what is broken and for whom (owner, crew, or client)
- `pain_data` — observed evidence (user reports, operational failures, missing features)
- `root_cause` — why it's happening, not just what

**Xcellent1 examples:**
- Problem: Crew cannot upload before/after photos from mobile
- Pain data: Photo upload button broken on iOS Safari
- Root cause: Supabase Storage CORS policy not configured for mobile browser origin

**Escalate to REALIZE when:** Root cause is validated and at least one stakeholder has confirmed the pain.

---

## Phase 2 — REALIZE

**Label:** `erc:realize` | **Gate:** ≥60 points | **Owner:** Implementation lead + @travone review

Realize is the spec phase. You are designing the solution, not building it. The gate requires a machine-readable spec, acceptance criteria, and peer review.

**Required artifacts:**
- `spec_path` — path to the spec file in the repo
- `acceptance_criteria` — explicit, checkable list
- `peer_reviewer` — named person who reviewed the spec

**Scoring rubric (60pt gate):**

| Criterion | Points |
|---|---|
| Problem statement references real observed data | 15 |
| Acceptance criteria are checkable (not vague) | 20 |
| Spec references actual files/endpoints in this repo | 15 |
| Peer reviewer named and acknowledged | 10 |

**Do not proceed to Conceptualize until score ≥60.**

---

## Phase 3 — CONCEPTUALIZE

**Label:** `erc:conceptualize` | **Gate:** ≥90 points | **Owner:** @travone (architecture sign-off)

Conceptualize is the architecture decision phase. The spec from Realize is approved, the implementation plan is concrete. Only after this gate does any code get written.

**Required artifacts:**
- `architecture_decision` — what pattern, where it lives, why
- `implementation_plan` — ordered file list, dependency chain, effort estimate
- `signoff` — boolean, must be true before implementation begins

**Scoring rubric (90pt gate):**

| Criterion | Points |
|---|---|
| Realize gate was passed (score ≥60) | 20 |
| Architecture decision names specific files and patterns | 25 |
| Implementation plan has ordered steps with file paths | 20 |
| Effort estimate present | 10 |
| Sign-off recorded | 15 |

**Nothing ships without a Conceptualize gate pass.**

---

## ERC Labels Quick Reference

```
erc:empathize    → Problem validated, no spec yet
erc:realize      → Spec written, peer-reviewed, gate ≥60
erc:conceptualize → Architecture approved, gate ≥90, ready to build
erc:blocked      → Phase gate failed, needs rework
```

---

## ERC Phase → Issue Label Mapping

| ERC Phase | GitHub Label | Gate | Next Action |
|---|---|---|---|
| Empathize | `erc:empathize` | Exists | Write spec, find reviewer |
| Realize | `erc:realize` | ≥60 pts | Get architecture sign-off |
| Conceptualize | `erc:conceptualize` | ≥90 pts | Begin implementation |
| Blocked | `erc:blocked` | — | Rework, then re-gate |

---

## Related

- [Wiki Home](Home.md)
- [Docs Standard](docs-standard.md)
- [RicksGarage ERC Flow](https://github.com/Thelastlineofcode/RicksGarage/blob/main/wiki/erc-flow.md)

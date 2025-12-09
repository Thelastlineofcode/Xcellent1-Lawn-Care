# COO Kernel — Advanced Context Engineering Principles

Purpose: capture the core practices and rules that turn AI-assisted coding from noisy output into reliably high-leverage engineering work. This is the canonical "COO Kernel" — a compact, operational set of principles your team (and agents) should follow when using context-heavy AI tools.

Principles
- Context window utilization — keep essential data in the "smart zone" (highest-value context) and avoid blowing it with irrelevant detail.
- Intentional compaction — compress supporting context into dense, factual snippets (examples: input filters, summarized diffs, minimal reproduction steps) so the model can reason without wasting tokens.
- Research → Plan → Implement separation — explicitly separate discovery from design from coding; verify at each handoff with a human check.
- Mental alignment (shared plan) — present clear work plans so humans and agents can align expectations and break work into reviewable milestones.
- Human-in-the-loop validation — require short, discrete human approvals at key checkpoints (design, security, tests, deploy) rather than full manual reviews for every minor change.
- Culture-first adoption — teams must change how they work (short feedback loops, shared mental models, review discipline) to realize the speed and safety gains of AI-assisted development.

Practical guidance
- Keep the active prompt's context < 30% noise: prune logs, telemetry, and irrelevant code; include only a short problem statement, failing trace (if present), and a suggested high-level plan.
- Use intentional compaction patterns:
  - TL;DR plus one-line reasoning for long docs
  - Minimal reproduction snippets for failing tests or bugs
  - Input-output examples for new features
- Research phase outputs (short): 3–5 bullet findings with sources & confidence.
- Planning phase outputs (short): testable acceptance criteria, a 3-step plan, and where to change code.
- Implementation phase outputs (short): small, self-contained changes + unit tests + safety checklist entries.
- Always include a safety checklist before merge: security implications, sensitive data exposure, RLS/Audit checks, regression risk, and monitoring hooks.

Team workflow template (Research → Plan → Implement)
1) Research (LLM/Manual)
   - Goal: learn the current system and constraints
   - Deliverable: 3–5 bullet findings and 1 list of unknowns to resolve
2) Plan (Human + LLM)
   - Goal: design the change and its tests
   - Deliverable: acceptance criteria, one-line API/data contract, list of modified files
3) Implement (Human or Agent)
   - Goal: make a small, test-covered change
   - Deliverable: CI green, unit tests, changelog entry, observability hooks

Checklist (pre-merge)
- Tests added/updated (unit + integration if needed)
- Security review (secrets, permissions, RLS policies) ✅
- Minimal context added to design doc / PR description ✅
- Rollback plan and monitoring scope specified ✅

Measuring success
- Velocity metric: % of changes that follow R→P→I and pass checks without rework
- Quality metric: regression rate and post-deploy incidents
- Team adoption: number of engineers using the kernel and time-to-approval on milestones

See also:
- docs/COO_KERNEL_DEEP_DIVE.md — for checklist templates, prompt patterns, and example PR text (add as needed)

---

Revision: 2025-12-09 — initial COO kernel commit

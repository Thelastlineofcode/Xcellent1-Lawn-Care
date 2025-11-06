# BMAD Agents — Xcellent1 Lawn Care

Scaffolded agents:

- intake — inbound lead processing
- quote — pricing/estimate heuristics
- scheduler — job creation and crew assignment
- invoice — invoice creation and Stripe paylinks
- outbox — reliable delivery worker for notifications
- digest — weekly KPI digest for owner
- review — post-payment review invitations

Each agent contains an `agent.yaml` manifest and a minimal `handler.ts` or `worker.ts` stub.

Use these as the starting point to implement integrations and complete the agent logic.

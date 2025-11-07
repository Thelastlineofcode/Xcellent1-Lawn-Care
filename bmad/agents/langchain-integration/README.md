# LangChain Agent Integration (future implementation)

Purpose: outline how the BMAD agents in this repository (intake, quote, scheduler, invoice, outbox, digest, review) can be augmented or reimplemented as "agentic" workflows using LangChain-style chains, tools and agents. This document is a roadmap and reference for future implementation work; no production code is included here.

Goals

- Provide a clear architecture for integrating LLM-driven agents while retaining reliability (outbox, idempotency) and observability.
- Define interfaces for tools (DB, email/SMS, payments, vision) and example chains for common tasks (pricing, scheduling, invoice handling, review invites).
- Offer an incremental migration plan from current autonomous Deno handlers to agentic services (prototype → staged rollout).

Key Concepts

- Agent: an LLM-powered controller that selects tools and actions to achieve a goal (e.g., produce a price and two suggested slots).
- Tool: a deterministic or networked action that the agent can call (e.g., read lead by id, write outbox event, create invoice, upload photo, call pricing microservice).
- Chain: a sequence of prompts + tool calls that implement a particular behavior, optionally with memory.
- Memory: short or long-term context store (Redis, Supabase table) to preserve conversation/lead context.

Recommended Tech Stack (future)

- LangChain (Python/Node flavors) as orchestration library for agent behavior.
- LLM providers: OpenAI, Anthropic, or local LLM via Llama.cpp/LLM backend in production-fallback designs.
- Tool workers: existing Deno microservices (keep) or new Node/Python adapters exposing the same tool surface.
- Persistence: Supabase/Postgres (existing), plus Redis for short-term memory and rate limiting.
- Observability: structured logs, traces (OpenTelemetry), and an audit table for agent decisions.

Interfaces (tools) to implement

1. DB Tools
   - get_lead(lead_id) -> lead object
   - upsert_lead(lead) -> id
   - create_job(job) -> id
   - list_available_crews(area, date_range)
2. Outbox Tools
   - send_email(template_id, to, vars)
   - send_sms(template_id, to, vars)
   - enqueue_outbox_event(type, payload)
3. Payments Tools
   - create_stripe_checkout(invoice_id) -> paylink
   - verify_stripe_event(idempotency_key) -> boolean
4. Vision/Media Tools
   - analyze_photo(path) -> tags/quality
   - upload_photo(file) -> url
5. System Tools
   - now(), uuid(), fetch_external(url)

Agent Examples (prototypes)

- PricingAgent
  - Input: lead id (with lawn size/questionnaire)
  - Tools used: get_lead, pricing_heuristic (local util), enqueue_outbox_event (QUOTE_PROPOSED)
  - Behavior: compute low/high price, confidence score. If confidence < threshold, add flag for manual review.

- SchedulerAgent
  - Input: accepted quote id
  - Tools: get_lead, list_available_crews, create_job, enqueue_outbox_event (JOB_SCHEDULED)
  - Behavior: find best crew and propose slot(s). Use constraints and routing heuristics as tools.

- InvoiceAgent
  - Input: job completed event
  - Tools: create_invoice (DB), create_stripe_checkout (Payments), enqueue_outbox_event (INVOICE_SENT)
  - Behaviour: idempotent invoice creation and paylink generation.

Safety, Idempotency and Observability

- All tool calls must be idempotent or include an idempotency key.
- Implement a `processed_events` table for webhook/agent dedupe.
- Agents must write an `agent_audit` row for each decision with: agent_name, input_snapshot, chosen_actions, tool_calls, exit_status, timestamp.

Incremental Migration Plan

1. Prototype: Build a single agent in LangChain (local or Node) for the QuoteAgent. Use existing `supabase_client_stub` for tooling. Validate heuristics and confidence thresholds with tests.
2. Canary: Run LangChain QuoteAgent alongside the Deno quote handler; compare outputs for a sample of leads; keep the Deno handler as fallback.
3. Rollforward: Gradually replace other agents (scheduler, invoice) when behavior and observability are satisfactory.

Dev & Testing Recommendations

- Add unit tests for prompt templates and tool adapters. Use recorded provider responses for deterministic testing.
- Create an integration test harness that runs agent code against the file-backed dev DB (`bmad/agents/dev_db.json`).
- Add chaos tests for failure modes (tool unavailability, network failures) to verify retries and outbox behavior.

Security & Cost Controls

- Rate-limit high-cost LLM calls; prefer small-context models for frequent tasks.
- Add attribution headers to tool calls for billing and tracing.
- Validate and sanitize all assistant outputs before writing to DB or calling external systems.

Next artifacts to implement (pickable)

- `bmad/agents/langchain-integration/adapter/` — tool adapters (prototype)
- `bmad/agents/langchain-integration/agents/quote_agent.py` — LangChain prototype (Python)
- CI workflow to run agent unit tests in a sandboxed environment using recorded LLM responses.

If you'd like, I can scaffold the prototype files (adapter stubs, a LangChain QuoteAgent example in Python or Node) and add tests that run against the existing dev DB. Tell me which language (Python or Node) you prefer for the LangChain prototype.

## Perplexity integration

If you prefer Perplexity as the LLM provider, set `PERPLEXITY_API_KEY` in your environment. The Python prototype supports a minimal Perplexity wrapper (using `httpx`) which will be preferred when the key is present. You may also set `PERPLEXITY_API_URL` if you need a non-default endpoint.

Example env vars:

```
export PERPLEXITY_API_KEY=sk_...
export PERPLEXITY_API_URL=https://api.perplexity.ai/v1/answers
```

The Perplexity wrapper is intentionally minimal; confirm the API shape for production use and adjust the response parsing accordingly.

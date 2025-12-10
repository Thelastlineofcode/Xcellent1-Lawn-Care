# Archive Notice

This directory contains prototype LangChain integration work for agentic features (e.g., QuoteAgent, SchedulerAgent, etc.). These prototypes and tests are archived and will not be executed by CI unless explicitly enabled.

Reason for archiving:
- AI/agent work is experimental and out of scope for the MVP.
- To reduce operational complexity and risk, agent features are deferred to a future implementation phase (TTS agent is planned but not active).

How to re-enable:
1. Set the environment variable `ENABLE_AI_TESTS=true` in CI or your local dev environment to run prototype tests.
2. Merge and refactor prototypes into shared modules and implement monitoring/outbox patterns before enabling in production.

For now, treat the files in this directory as documentation and prototyping artifacts only.

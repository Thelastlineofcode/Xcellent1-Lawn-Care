<!-- Archived LangChain integration prototypes -->
# LangChain Agent Integration (ARCHIVED - Future Implementation)

This directory holds copied prototypes and research files for LangChain-based agent integration.
The active project configuration uses `bmad/agents/langchain-integration` as a stubbed/archived location; these files are retained here for historical reference and for future re-enablement.

Location: `bmad/agents/archived/langchain-integration/`

To re-enable prototypes:
1. Set `ENABLE_AI_PROTOTYPES=true` in CI or your local environment for testing.
2. Migrate prototype code into a safe test harness with outbox, idempotency, and auditing logic.

Do not import or reference these modules from production server code.
# LangChain Agent Integration (ARCHIVED)

This directory contains archived LangChain agent prototypes for future reference.

Location: `bmad/agents/archived/langchain-integration/`

Status: Paused — AI and agent prototypes are not part of the active product and are disabled by default. See `docs/AI_SUSPENDED.md` for re-enabling steps.

Files are preserved for research and future implementation. Do not import these modules in the active runtime without re-enabling and securing guard rails.

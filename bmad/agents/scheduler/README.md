# Scheduler Agent

Scheduler agent stub creates job objects from accepted quotes and suggests crew assignments. Implementation TODOs are in `handler.ts`.

Next steps:

1. Implement crew availability heuristics.
2. Write job records to Supabase and emit JOB_SCHEDULED events to outbox.

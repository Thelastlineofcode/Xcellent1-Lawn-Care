# Quote Agent

This agent provides quick pricing heuristics and two suggested time slots for leads. The current implementation is a heuristic stub located in `handler.ts` and should be wired to the leads table and event triggers.

Next steps:

1. Connect to Supabase to read lead data and write job suggestions.
2. Add unit tests for pricing logic.
3. Add confidence scoring to flag manual review when needed.

```markdown
<workflow>

  <step n="1" goal="Read roadmap">
    <action>Open `bmad/agents/archived/langchain-integration/README.md` and review architecture, interfaces and migration plan. Note: prototypes are archived and should not be executed unless re-enabled.</action>
  </step>

  <step n="2" goal="Prototype QuoteAgent">
    <action>Scaffold a small prototype in the language you prefer (Python or Node) under `bmad/agents/archived/langchain-integration/agents/` for reference. If re-enabling, ensure the code is moved to a new active location and audited.</action>
    <action>Implement tool adapters that call the existing `bmad/agents/lib/supabase.ts` (or the supabase stub) for DB interactions.</action>
  </step>

  <step n="3" goal="Add tests and CI">
    <action>Create unit tests for prompt templates and adapters. Add a GitHub Actions workflow to run `deno test` (existing) and agent tests.</action>
  </step>

</workflow>
```

```markdown
<workflow>

  <step n="1" goal="Read roadmap">
    <action>Open `bmad/agents/langchain-integration/README.md` and review architecture, interfaces and migration plan.</action>
  </step>

  <step n="2" goal="Prototype QuoteAgent">
    <action>Scaffold a small prototype in the language you prefer (Python or Node) under `bmad/agents/langchain-integration/agents/`</action>
    <action>Implement tool adapters that call the existing `bmad/agents/lib/supabase.ts` (or the supabase stub) for DB interactions.</action>
  </step>

  <step n="3" goal="Add tests and CI">
    <action>Create unit tests for prompt templates and adapters. Add a GitHub Actions workflow to run `deno test` (existing) and agent tests.</action>
  </step>

</workflow>
```

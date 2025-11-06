<workflow>

  <step n="1" goal="List scaffolded agents">
    <action>Read `agents` field in workflow.yaml</action>
    <action>For each agent path, load agent.yaml and summarize name, description, runtime, and entry</action>
    <template-output>agents_list</template-output>
  </step>

  <step n="2" goal="Create README of agents">
    <action>Write generated summary to {config_source}:output_folder/agents-orchestration-{{date}}.md</action>
  </step>

</workflow>

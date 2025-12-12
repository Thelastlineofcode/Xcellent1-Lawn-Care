# BMAD Framework Integration with Claude Code

## Overview

This guide shows you how to configure Claude Code to natively understand and use
the BMAD (Business Management and Development) framework globally across all
your projects.

## What is BMAD Framework?

Based on your codebase, BMAD is a modular framework for building business
applications with:

- **Event-driven architecture** (Outbox pattern)
- **Multi-agent systems** (Crew, Owner, Client agents)
- **Modular services** (Authentication, Database, API routing)
- **Test-driven development**

## Method 1: Create a Global Claude Code Skill (Recommended)

Skills are reusable AI capabilities that you can invoke across any project.

### Step 1: Create the BMAD Skill Directory

```bash
# Create global skills directory
mkdir -p ~/.config/claude-code/skills/bmad-framework

# Create the skill manifest
cat > ~/.config/claude-code/skills/bmad-framework/skill.json << 'EOF'
{
  "name": "bmad-framework",
  "version": "1.0.0",
  "description": "BMAD Framework integration for building event-driven business applications",
  "author": "Xcellent1 Development",
  "capabilities": [
    "event-driven-architecture",
    "outbox-pattern",
    "multi-agent-systems",
    "business-logic-separation"
  ],
  "activation": {
    "keywords": ["bmad", "outbox", "agent", "event-driven"],
    "auto_activate": false
  }
}
EOF
```

### Step 2: Create the BMAD Skill Prompt

```bash
cat > ~/.config/claude-code/skills/bmad-framework/prompt.md << 'EOF'
# BMAD Framework Development Assistant

You are now operating with the BMAD (Business Management and Development) Framework activated.

## Core Principles

1. **Event-Driven Architecture**
   - Use the Outbox pattern for reliable event publishing
   - Store events in database before processing
   - Process events asynchronously with background workers

2. **Multi-Agent System Design**
   - Separate agents by role: Owner, Crew, Client, Applicant
   - Each agent has specific capabilities and permissions
   - Use role-based access control (RBAC) throughout

3. **Modular Service Architecture**
   - Authentication layer (Supabase Auth + JWT)
   - Database layer (PostgreSQL with RLS policies)
   - API layer (REST endpoints with role protection)
   - Event processing layer (Outbox workers)

4. **Test-Driven Development**
   - Write tests in `bmad/agents/tests/`
   - Use Deno test framework
   - Test outbox events, agents, and integrations

## Directory Structure
```

project/ ├── bmad/ │ ├── agents/ │ │ ├── owner/ # Owner agent capabilities │ │
├── crew/ # Crew agent capabilities │ │ ├── client/ # Client agent capabilities
│ │ └── tests/ # Agent tests │ ├── outbox/ │ │ ├── publisher.ts # Event
publishing │ │ ├── processor.ts # Event processing │ │ └── worker.ts #
Background workers │ └── services/ │ ├── auth/ # Authentication services │ ├──
db/ # Database services │ └── api/ # API routing ├── db/ │ └── schema.sql #
Database schema with RLS ├── web/ │ └── static/ # Frontend dashboards └──
server.ts # Main server entry point

````
## Development Patterns

### Pattern 1: Creating a New Event

```typescript
// 1. Define event type in outbox/types.ts
export interface NewEventPayload {
  entityId: string;
  entityType: string;
  action: string;
  data: Record<string, any>;
}

// 2. Publish event in your service
import { publishEvent } from './bmad/outbox/publisher.ts';

await publishEvent({
  eventType: 'entity.created',
  payload: {
    entityId: entity.id,
    entityType: 'job',
    action: 'created',
    data: entity
  },
  aggregateId: entity.id,
  aggregateType: 'job'
});

// 3. Process event in outbox/processor.ts
async function processEntityCreated(event: OutboxEvent) {
  // Handle the event
  // Send notifications, update other systems, etc.
}
````

### Pattern 2: Creating a New Agent Capability

```typescript
// bmad/agents/crew/job-completion.ts
import { authenticateRequest } from "../../services/auth/middleware.ts";

export async function completeJob(
  req: Request,
  jobId: string,
): Promise<Response> {
  // 1. Authenticate
  const auth = await authenticateRequest(req);
  if (!auth || auth.profile.role !== "crew") {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Business logic
  const job = await updateJobStatus(jobId, "completed");

  // 3. Publish event
  await publishEvent({
    eventType: "job.completed",
    payload: { jobId, completedBy: auth.profile.id },
    aggregateId: jobId,
    aggregateType: "job",
  });

  return new Response(JSON.stringify(job), {
    headers: { "Content-Type": "application/json" },
  });
}
```

### Pattern 3: Protected API Endpoint

```typescript
// server.ts
import { requireAuth } from "./bmad/services/auth/middleware.ts";

// Protected endpoint
if (pathname === "/api/jobs" && method === "POST") {
  const auth = await requireAuth(req, ["owner", "crew"]);
  if (!auth) return new Response("Unauthorized", { status: 401 });

  // Handle request with authenticated user
  const result = await createJob(req, auth.profile);
  return new Response(JSON.stringify(result));
}
```

### Pattern 4: Database with RLS

```sql
-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Owner sees all jobs
CREATE POLICY "owners_all_jobs" ON jobs
  FOR ALL USING (
    auth.user_role() = 'owner'
  );

-- Crew sees only their assigned jobs
CREATE POLICY "crew_assigned_jobs" ON jobs
  FOR SELECT USING (
    auth.user_role() = 'crew'
    AND crew_id = auth.uid()
  );

-- Client sees only their jobs
CREATE POLICY "client_own_jobs" ON jobs
  FOR SELECT USING (
    auth.user_role() = 'client'
    AND client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );
```

## When to Use BMAD Framework

Use BMAD when you need:

- ✅ Event-driven business logic
- ✅ Multi-tenant role-based access
- ✅ Reliable event processing (Outbox pattern)
- ✅ Audit trails and event sourcing
- ✅ Background job processing
- ✅ Multi-agent orchestration

Don't use BMAD for:

- ❌ Simple CRUD apps without events
- ❌ Single-user applications
- ❌ Static websites
- ❌ Real-time streaming (use different pattern)

## Commands

When activated, you can use these commands:

- `@bmad create-event <name>` - Generate event boilerplate
- `@bmad create-agent <role>` - Create new agent capability
- `@bmad create-endpoint <path>` - Create protected API endpoint
- `@bmad test <component>` - Run BMAD component tests
- `@bmad generate-rls` - Generate RLS policies for a table

## Best Practices

1. **Always use the Outbox pattern** for side effects (emails, notifications,
   integrations)
2. **Test your agents** - Write tests in `bmad/agents/tests/`
3. **Use RLS policies** - Never bypass database security
4. **Separate concerns** - Keep agents, services, and outbox distinct
5. **Event naming** - Use format: `entity.action` (e.g., `job.completed`)
6. **Type everything** - Use TypeScript interfaces for events and payloads
7. **Handle failures** - Outbox events should be retryable and idempotent

## Quick Start Checklist

When starting a new BMAD project:

- [ ] Set up database schema with RLS policies
- [ ] Configure Supabase Auth integration
- [ ] Create outbox table and worker
- [ ] Define agent roles and permissions
- [ ] Create protected API endpoints
- [ ] Write tests for critical paths
- [ ] Set up environment variables
- [ ] Deploy with proper secrets management

## Troubleshooting

### Events not processing?

- Check outbox worker is running
- Verify database connection
- Check event status in outbox table
- Review worker logs for errors

### Authentication failing?

- Verify JWT secret is set
- Check auth_user_id is linked
- Confirm RLS policies are correct
- Test with curl/Postman first

### Agent permissions wrong?

- Review RLS policies
- Check user role in database
- Verify requireAuth middleware
- Test with different user roles

---

**BMAD Framework is now active. How can I help you build your event-driven
application?** EOF

````
### Step 3: Activate the Skill

To use the BMAD framework in any project:

```bash
# In Claude Code, type:
/skill bmad-framework

# Or create an alias
/alias bmad="skill bmad-framework"
````

## Method 2: Custom Slash Command

Create a reusable slash command that activates BMAD mode.

### Step 1: Create Command Directory

```bash
mkdir -p ~/.claude/commands
```

### Step 2: Create BMAD Command

```bash
cat > ~/.claude/commands/bmad.md << 'EOF'
Activate BMAD Framework development mode.

You are now helping build an application using the BMAD (Business Management and Development) Framework.

Core principles:
1. Event-driven architecture with Outbox pattern
2. Multi-agent system (Owner, Crew, Client)
3. Role-based access control with RLS
4. Test-driven development

When suggesting code:
- Use Outbox pattern for side effects
- Implement proper authentication/authorization
- Write RLS policies for data access
- Create tests in bmad/agents/tests/
- Follow TypeScript best practices

Generate code that follows the BMAD structure in /bmad/ directory.
EOF
```

### Step 3: Use the Command

```bash
# In any Claude Code session, type:
/bmad

# This activates BMAD mode for your conversation
```

## Method 3: Project-Specific Configuration

For projects that always use BMAD, configure it in the project itself.

### Step 1: Create .claude/config.json

```bash
mkdir -p .claude
cat > .claude/config.json << 'EOF'
{
  "project": {
    "name": "BMAD Application",
    "framework": "bmad",
    "version": "1.0.0"
  },
  "context": {
    "framework": "BMAD (Business Management and Development)",
    "architecture": "event-driven",
    "patterns": ["outbox", "multi-agent", "rls"],
    "testing": "deno-test"
  },
  "auto_instructions": [
    "Use BMAD framework patterns",
    "Implement Outbox pattern for events",
    "Create role-based agents",
    "Write tests for all agents",
    "Use RLS policies for data access"
  ],
  "code_style": {
    "language": "TypeScript",
    "runtime": "Deno",
    "database": "PostgreSQL with Supabase",
    "auth": "Supabase Auth + JWT"
  }
}
EOF
```

### Step 2: Create .claude/instructions.md

```bash
cat > .claude/instructions.md << 'EOF'
# Project Instructions

This project uses the **BMAD Framework** for building event-driven business applications.

## Framework Rules

1. **Event Publishing**: Always use the Outbox pattern from `bmad/outbox/publisher.ts`
2. **Authentication**: Use `authenticateRequest()` from `bmad/services/auth/middleware.ts`
3. **Database Access**: Leverage RLS policies, never bypass security
4. **Agent Structure**: Organize code by agent role in `bmad/agents/{role}/`
5. **Testing**: Write tests in `bmad/agents/tests/` using Deno test framework

## Code Generation Defaults

- Use TypeScript with strict mode
- Export async functions
- Include error handling with try/catch
- Add JSDoc comments for public functions
- Follow the existing directory structure

## Common Patterns

Refer to existing code in:
- `bmad/outbox/` for event patterns
- `bmad/agents/` for agent capabilities
- `db/schema.sql` for RLS policy examples
- `server.ts` for API endpoint patterns
EOF
```

## Method 4: VS Code Integration (If using Claude Code in VS Code)

### Step 1: Create VS Code Settings

```bash
# Create .vscode/settings.json
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "claude-code.context": {
    "framework": "BMAD",
    "patterns": ["event-driven", "outbox", "multi-agent", "rls"]
  },
  "claude-code.instructions": [
    "Use BMAD framework patterns for all code generation",
    "Implement Outbox pattern for event publishing",
    "Create role-based agents with proper authentication",
    "Write comprehensive tests for all components"
  ],
  "claude-code.codeStyle": {
    "language": "TypeScript",
    "runtime": "Deno",
    "indent": 2,
    "quotes": "single"
  }
}
EOF
```

## Method 5: Global Claude Code Settings

Configure BMAD across ALL your projects.

### Step 1: Edit Global Claude Config

```bash
# Location varies by OS:
# macOS: ~/Library/Application Support/Claude/config.json
# Linux: ~/.config/claude/config.json
# Windows: %APPDATA%\Claude\config.json

# Add to global config:
{
  "frameworks": {
    "bmad": {
      "enabled": true,
      "auto_detect": true,
      "patterns": ["bmad/", "outbox/", "agents/"],
      "activation_keywords": ["bmad", "outbox", "agent", "event-driven"]
    }
  },
  "custom_instructions": {
    "bmad_projects": "When working on projects with 'bmad/' directory, automatically use BMAD framework patterns including Outbox pattern, multi-agent architecture, and RLS policies."
  }
}
```

## Testing Your BMAD Integration

After setting up, test it works:

```bash
# 1. Start a new Claude Code session

# 2. Type one of these:
/bmad
/skill bmad-framework
@bmad

# 3. Ask Claude to:
"Create a new event for job completion using BMAD framework"

# 4. Verify Claude:
# ✅ Uses Outbox pattern
# ✅ Creates event in bmad/outbox/
# ✅ Follows TypeScript conventions
# ✅ Includes proper types and interfaces
# ✅ Adds tests
```

## Advanced: Create BMAD CLI Tool

Create a CLI to manage BMAD projects:

```bash
cat > /usr/local/bin/bmad << 'EOF'
#!/bin/bash
# BMAD Framework CLI

case "$1" in
  init)
    echo "Initializing BMAD project..."
    mkdir -p bmad/{agents/{owner,crew,client,tests},outbox,services/{auth,db,api}}
    mkdir -p db web/static
    echo "✅ BMAD structure created"
    ;;

  create-event)
    EVENT_NAME=$2
    cat > "bmad/outbox/events/${EVENT_NAME}.ts" << 'EOFEVENT'
export interface ${EVENT_NAME}Payload {
  // Define your event payload
}

export async function publish${EVENT_NAME}(payload: ${EVENT_NAME}Payload) {
  await publishEvent({
    eventType: '${EVENT_NAME}',
    payload,
    aggregateId: payload.id,
    aggregateType: 'entity'
  });
}
EOFEVENT
    echo "✅ Event ${EVENT_NAME} created"
    ;;

  create-agent)
    AGENT_ROLE=$2
    mkdir -p "bmad/agents/${AGENT_ROLE}"
    echo "✅ Agent ${AGENT_ROLE} created"
    ;;

  test)
    deno test bmad/agents/tests/
    ;;

  *)
    echo "BMAD Framework CLI"
    echo ""
    echo "Commands:"
    echo "  init           - Initialize BMAD project structure"
    echo "  create-event   - Create new event type"
    echo "  create-agent   - Create new agent capability"
    echo "  test           - Run BMAD tests"
    ;;
esac
EOF

chmod +x /usr/local/bin/bmad
```

## Quick Reference Card

Save this as a quick reference:

````bash
cat > ~/.bmad-quickref.md << 'EOF'
# BMAD Framework Quick Reference

## Activate BMAD Mode
- `/bmad` - Slash command
- `/skill bmad-framework` - Skill activation
- `@bmad` - Direct mention

## Common Patterns

### Publish Event
```typescript
await publishEvent({
  eventType: 'entity.action',
  payload: data,
  aggregateId: id,
  aggregateType: 'type'
});
````

### Protected Endpoint

```typescript
const auth = await requireAuth(req, ["owner", "crew"]);
if (!auth) return unauthorized();
```

### RLS Policy

```sql
CREATE POLICY "policy_name" ON table
  FOR SELECT USING (
    auth.user_role() = 'role'
  );
```

### Agent Test

```typescript
Deno.test("agent should...", async () => {
  const result = await agentFunction();
  assertEquals(result.status, "success");
});
```

EOF

```
---

## Summary

You now have **5 methods** to integrate BMAD with Claude Code:

1. ✅ **Global Skill** - Reusable across all projects (`/skill bmad-framework`)
2. ✅ **Slash Command** - Quick activation (`/bmad`)
3. ✅ **Project Config** - Auto-activate for specific projects (`.claude/config.json`)
4. ✅ **VS Code Settings** - IDE integration (`.vscode/settings.json`)
5. ✅ **Global Settings** - Always available (`~/Library/Application Support/Claude/config.json`)

**Recommended Setup**: Use Methods 1 + 3 (Global Skill + Project Config)

This gives you:
- Global availability when needed
- Automatic activation in BMAD projects
- Consistent patterns across all code
- Easy testing and debugging

Let me know which method you'd like to implement first!
```

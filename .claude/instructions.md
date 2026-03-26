# Xcellent1 Lawn Care - Project Instructions

This project uses the **BMAD Framework** for building event-driven business
applications.

## Framework Rules

1. **Event Publishing**: Always use the Outbox pattern from
   `bmad/outbox/publisher.ts`
2. **Authentication**: Use `authenticateRequest()` from `supabase_auth.ts`
3. **Database Access**: Leverage RLS policies, never bypass security
4. **Agent Structure**: Organize code by agent role in `bmad/agents/{role}/`
5. **Testing**: Write tests in `bmad/agents/tests/` using Deno test framework

## Code Generation Defaults

- Use TypeScript with strict mode
- Export async functions
- Include error handling with try/catch
- Add JSDoc comments for public functions
- Follow the existing directory structure
- Use single quotes for strings
- Add semicolons
- Use 2-space indentation

## Common Patterns

### Publishing Events

```typescript
import { publishEvent } from "./bmad/outbox/publisher.ts";

await publishEvent({
  eventType: "job.completed",
  payload: { jobId, completedBy, timestamp },
  aggregateId: jobId,
  aggregateType: "job",
});
```

### Authenticating Requests

```typescript
import { authenticateRequest } from "./supabase_auth.ts";

const auth = await authenticateRequest(req);
if (!auth || auth.profile.role !== "crew") {
  return new Response("Unauthorized", { status: 401 });
}
```

### Creating RLS Policies

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (
    auth.user_role() = 'owner'
    OR (auth.user_role() = 'crew' AND crew_id = auth.uid())
  );
```

### Writing Tests

```typescript
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";

Deno.test("should complete job successfully", async () => {
  const result = await completeJob(jobId, crewId);
  assertEquals(result.status, "completed");
});
```

## Reference Code Locations

- **Event patterns**: `bmad/outbox/`
- **Agent capabilities**: `bmad/agents/`
- **RLS policies**: `db/schema.sql`
- **API endpoints**: `server.ts`
- **Authentication**: `supabase_auth.ts`
- **Frontend dashboards**: `web/static/`

## Agent Roles

### Owner Agent

- Business metrics and KPIs
- Hiring pipeline management
- Crew performance tracking
- Financial oversight
- System administration

### Crew Agent

- View daily job assignments
- Navigate to job locations
- Upload before/after photos
- Mark jobs complete
- Track progress

### Client Agent

- View service history
- See before/after photos
- Manage account
- Make payments
- Contact support

## Database Schema

Main tables:

- `users` - All user accounts (with auth_user_id link)
- `clients` - Customer information
- `jobs` - Work assignments
- `job_photos` - Before/after images
- `invoices` - Billing
- `payments` - Payment tracking
- `applications` - Job applications
- `outbox_events` - Event queue

All tables have RLS policies for role-based access.

## Environment Variables

Required in `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://utivthfrwgtjatsusopw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql://...
```

## Testing Strategy

1. Unit tests for agent functions
2. Integration tests for API endpoints
3. Event processing tests for outbox
4. RLS policy tests for security

Run tests: `deno test bmad/agents/tests/`

## Deployment

- **Platform**: Fly.io
- **Database**: Supabase PostgreSQL
- **Runtime**: Deno 2.5.6
- **SSL**: Required for database connections

Deploy: `flyctl deploy`

## Best Practices

1. **Always** use Outbox pattern for side effects
2. **Never** bypass authentication or RLS policies
3. **Always** write tests for new agent capabilities
4. **Use** TypeScript types for all events and payloads
5. **Make** events idempotent and retryable
6. **Separate** business logic by agent role
7. **Document** complex event flows
8. **Test** with multiple user roles

## Anti-Patterns to Avoid

- ❌ Direct database access without RLS
- ❌ Synchronous event processing
- ❌ Hardcoded credentials
- ❌ Missing authentication checks
- ❌ Untested agent capabilities
- ❌ Mixed agent responsibilities
- ❌ Non-idempotent events

## Getting Help

- Review existing code in `bmad/` directory
- Check `AUTHENTICATION_SETUP.md` for auth details
- See `NEXT_STEPS.md` for deployment guide
- Read `BMAD_CLAUDE_INTEGRATION_GUIDE.md` for framework details

---

**Remember**: This is an event-driven, multi-agent system. All significant
actions should publish events, all data access should use RLS, and all code
should be organized by agent role.

# ✅ BMAD Framework Integration - Setup Complete!

The BMAD Framework has been successfully integrated into Claude Code globally.
You can now use it anywhere!

## What Was Installed

### 1. Global Claude Code Skill ✅

**Location**: `~/.config/claude-code/skills/bmad-framework/`

**Files Created**:

- `skill.json` - Skill metadata and capabilities
- `prompt.md` - Complete BMAD framework instructions

**How to Use**: Currently, Claude Code skills are being developed. The framework
context is available through slash commands and project config.

### 2. Slash Command ✅

**Location**: `~/.claude/commands/bmad.md`

**How to Use**:

```
Type: /bmad
```

This activates BMAD mode in any Claude Code conversation. Use it when starting
work on event-driven features.

### 3. Project Configuration ✅

**Location**: `/Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care/.claude/`

**Files Created**:

- `config.json` - Project metadata and framework settings
- `instructions.md` - Development guidelines and patterns

**Auto-Activation**: When working in this project, Claude Code will
automatically understand the BMAD framework patterns.

### 4. CLI Tool ✅

**Location**: `~/bin/bmad-fw`

**Added to PATH**: Yes (in `~/.zshrc`)

**Commands Available**:

```bash
bmad-fw init                    # Initialize BMAD project
bmad-fw create-event <name>     # Create new event
bmad-fw create-agent <role>     # Create new agent
bmad-fw create-endpoint <path>  # Generate endpoint
bmad-fw test                    # Run tests
bmad-fw generate-rls <table>    # Generate RLS policies
bmad-fw status                  # Show project status
bmad-fw help                    # Show all commands
```

### 5. Quick Reference ✅

**Location**: `~/.bmad-quickref.md`

**Purpose**: Quick lookup for common patterns

**View it**: `cat ~/.bmad-quickref.md`

## How to Use BMAD Framework

### Method 1: In This Project (Automatic)

Just start working! The `.claude/` configuration will automatically apply BMAD
patterns.

### Method 2: Slash Command (Any Project)

```
/bmad
```

Then ask: "Create a new event for job completion"

### Method 3: Direct Request (Any Project)

Just mention BMAD in your request:

```
"Using BMAD framework, create an event for user registration"
```

### Method 4: CLI Tool

```bash
# Check project status
bmad-fw status

# Create a new event
bmad-fw create-event job.completed

# Create a new agent capability
bmad-fw create-agent crew

# Run tests
bmad-fw test
```

## Testing the Integration

Let's verify everything works:

### Test 1: Slash Command

1. In Claude Code, type: `/bmad`
2. Ask: "Create a new event for invoice payment"
3. Claude should generate BMAD-compliant event code

### Test 2: Project Auto-Detection

1. Open any file in this project
2. Ask: "Add authentication to this endpoint"
3. Claude should automatically use `authenticateRequest()` from supabase_auth

### Test 3: CLI Tool

```bash
# Reload your shell
source ~/.zshrc

# Check status
bmad-fw status

# Should show your agents, events, and tests
```

## Quick Start Examples

### Create a New Event

```bash
bmad-fw create-event payment.received

# Then edit: bmad/outbox/events/payment_received.ts
```

### Create a New Agent Capability

```bash
bmad-fw create-agent crew

# Then add capabilities in: bmad/agents/crew/
```

### Generate RLS Policy

```bash
bmad-fw generate-rls invoices

# Copy output to db/schema.sql
```

### Run Tests

```bash
bmad-fw test
```

## BMAD Patterns Now Available

### 1. Event Publishing

```typescript
await publishEvent({
  eventType: "job.completed",
  payload: { jobId, timestamp },
  aggregateId: jobId,
  aggregateType: "job",
});
```

### 2. Authentication

```typescript
const auth = await authenticateRequest(req);
if (!auth || auth.profile.role !== "crew") {
  return new Response("Unauthorized", { status: 401 });
}
```

### 3. RLS Policies

```sql
CREATE POLICY "crew_own_jobs" ON jobs
  FOR SELECT USING (
    auth.user_role() = 'crew'
    AND crew_id = auth.uid()
  );
```

### 4. Agent Tests

```typescript
Deno.test("should complete job", async () => {
  const result = await completeJob(jobId);
  assertEquals(result.status, "completed");
});
```

## Files and Locations Reference

```
Global Configuration:
  ~/.config/claude-code/skills/bmad-framework/  # Claude Code skill
  ~/.claude/commands/bmad.md                    # Slash command
  ~/.bmad-quickref.md                           # Quick reference
  ~/bin/bmad-fw                                 # CLI tool

Project Configuration:
  .claude/config.json                           # Project settings
  .claude/instructions.md                       # Development guide

BMAD Project Structure:
  bmad/
    agents/{role}/                              # Agent capabilities
    outbox/                                     # Event publishing
    services/                                   # Auth, DB, API
  db/schema.sql                                 # Database with RLS
  server.ts                                     # Main entry point
```

## Environment Variables

Make sure these are set in `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://utivthfrwgtjatsusopw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql://...
```

## Integration with Your Workflow

### Daily Development

1. Open project in Claude Code
2. BMAD patterns automatically applied
3. Ask for features using BMAD terminology
4. Tests generated automatically in `bmad/agents/tests/`

### New Features

```bash
# Create event
bmad-fw create-event feature.implemented

# Create agent capability
bmad-fw create-agent crew

# Write code with Claude Code (BMAD auto-active)
# Run tests
bmad-fw test
```

### Code Review

BMAD framework ensures:

- ✅ Events use Outbox pattern
- ✅ Endpoints have authentication
- ✅ Database uses RLS policies
- ✅ Tests exist for agents
- ✅ Code organized by role

## Troubleshooting

### CLI not found after setup

```bash
# Reload shell
source ~/.zshrc

# Or use full path
~/bin/bmad-fw status
```

### Slash command not working

The `/bmad` command is now available in `~/.claude/commands/bmad.md`. Claude
Code will recognize it.

### Framework not auto-activating

Check that `.claude/config.json` exists in your project root:

```bash
ls -la /Users/houseofobi/Documents/GitHub/Xcellent1-Lawn-Care/.claude/
```

## Next Steps

1. **Test the integration** - Try creating a new event
2. **Review the guide** - Read `BMAD_CLAUDE_INTEGRATION_GUIDE.md`
3. **Use the CLI** - Run `bmad-fw status` to see your project
4. **Quick reference** - Bookmark `~/.bmad-quickref.md`

## Resources

- **Full Guide**: `BMAD_CLAUDE_INTEGRATION_GUIDE.md`
- **Quick Reference**: `~/.bmad-quickref.md`
- **CLI Help**: `bmad-fw help`
- **Project Status**: `bmad-fw status`

## Examples to Try

Ask Claude Code:

1. **"Create a new event for client registration using BMAD"**
   - Should generate event in `bmad/outbox/events/`
   - Include publisher function
   - Add TypeScript types

2. **"Add crew capability for uploading photos"**
   - Should create in `bmad/agents/crew/`
   - Include authentication check
   - Publish event after upload

3. **"Generate RLS policy for jobs table"**
   - Should generate role-based policies
   - Include owner, crew, and client access

4. **"Write test for job completion"**
   - Should create in `bmad/agents/tests/`
   - Use Deno test framework
   - Test event publishing

---

## 🎉 You're All Set!

The BMAD Framework is now globally integrated with Claude Code. Every
conversation, every project - BMAD patterns are available at your fingertips.

**Quick Test**: Open Claude Code and type:

```
/bmad

Create a new event for user login
```

Claude should generate BMAD-compliant code with:

- Outbox pattern
- TypeScript types
- Event publisher
- Proper structure

Happy coding with BMAD! 🚀

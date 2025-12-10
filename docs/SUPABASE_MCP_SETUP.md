# Supabase MCP Server Setup

## What is this?
This sets up a Model Context Protocol (MCP) server that allows AI agents to directly interact with your Supabase database. This means agents can:
- Run SQL queries
- Fix RLS policies
- Create/update tables
- Debug database issues
- All without you having to manually copy/paste SQL!

## Setup Instructions

### 1. Install Supabase MCP Server

```bash
# Using npx (recommended)
npx -y @modelcontextprotocol/server-supabase
```

### 2. Configure MCP Settings

Add this to your MCP settings file (usually `~/.config/mcp/settings.json` or similar):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "https://utivthfrwgtjatsusopw.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key_here"
      }
    }
  }
}
```

### 3. Get Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/utivthfrwgtjatsusopw/settings/api
2. Copy the **service_role** key (click the eye icon to reveal it)
3. Replace `your_service_role_key_here` in the config above

### 4. Restart Your AI Agent

After configuring, restart your AI agent/IDE so it picks up the new MCP server.

## What This Enables

Once configured, agents can:

✅ **Run SQL directly**
```sql
-- Agent can execute this without you copying/pasting
CREATE POLICY "fix_policy" ON users FOR SELECT USING (auth_user_id = auth.uid());
```

✅ **Query database state**
```sql
-- Agent can check what policies exist
SELECT * FROM pg_policies WHERE tablename = 'users';
```

✅ **Debug issues**
```sql
-- Agent can investigate RLS issues
SELECT * FROM users WHERE auth_user_id = '41875d51-e5bd-4aa9-8abe-f0d23cf319d5';
```

✅ **Create migrations**
- Agent can generate and apply schema changes
- Fix broken policies automatically
- Update table structures

## Security Note

⚠️ The service role key has **full database access**. Only use this in:
- Development environments
- Trusted AI agents
- Local machines

For production, consider:
- Using a separate development Supabase project
- Implementing additional access controls
- Rotating keys regularly

## Alternative: Supabase CLI

You can also use the Supabase CLI for similar functionality:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref utivthfrwgtjatsusopw

# Run SQL from command line
supabase db execute --file migration.sql
```

## Benefits

1. **Faster debugging** - No manual SQL copy/paste
2. **Automated fixes** - Agent can fix issues immediately
3. **Better context** - Agent can query database state
4. **Fewer errors** - No typos from manual copying
5. **Audit trail** - All changes logged

## Next Steps

1. Set up the MCP server with your credentials
2. Test it by asking the agent to query your database
3. Use it for future database debugging and fixes

---

**This would have saved us 30+ minutes on the RLS debugging!** 🚀

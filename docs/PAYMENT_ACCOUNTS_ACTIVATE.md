# 🚀 FINAL ACTIVATION STEP - Payment Accounts

## Status: System Ready ✅

All code is deployed and tested. **One manual step remains** to activate payment
accounts in your Supabase database.

## Execute Migration (5 minutes)

### Step 1: Go to Supabase Dashboard

```
https://app.supabase.com/project/utivthfrwgtjatsusopw
```

### Step 2: Open SQL Editor

- Click **"SQL Editor"** in left sidebar
- Click **"New Query"**

### Step 3: Copy & Paste Migration

Copy this entire SQL migration and paste into the editor:

```sql
-- Payment accounts table (owner's connected payment methods)
CREATE TABLE IF NOT EXISTS payment_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'cash_app', 'stripe', 'square')),
  account_identifier TEXT NOT NULL,
  account_name TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, payment_method, account_identifier)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_accounts_user ON payment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_method ON payment_accounts(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_primary ON payment_accounts(user_id, is_primary) WHERE is_primary = TRUE;

-- Enable Row Level Security
ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Owners can manage their own payment accounts
CREATE POLICY "Owners can manage their payment accounts" ON payment_accounts FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_payment_accounts_updated_at BEFORE UPDATE ON payment_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE payment_accounts IS 'Owner payment account connections (PayPal, Cash App, Stripe, Square)';
```

### Step 4: Click "Run"

Wait for the green success message. You should see:

```
✓ Query executed successfully
```

### Step 5: Verify Success

In the SQL editor, run this quick verification query:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'payment_accounts'
) AS table_exists;
```

Result should show: `table_exists = true`

## What Gets Created

✅ `payment_accounts` table with all fields ✅ 3 performance indexes\
✅ Row Level Security (RLS) policies ✅ Auto-update trigger for timestamps

## After Migration

### LaCardio Can Immediately:

1. ✅ Log in to https://xcellent1lawncare.com
2. ✅ Navigate to "Payment Accounts" menu
3. ✅ Click "+ Connect Payment Account"
4. ✅ Connect PayPal: `lacardiofrancis@gmail.com`
5. ✅ Connect Cash App: `$LaCardio` (or his $cashtag)
6. ✅ Record payments with proper payment methods

### System Will Track:

- Which clients pay via which method
- All payment details by method type
- Primary account for each payment type
- Account connection dates
- Verification status

## Troubleshooting

**"Column 'payment_method' of relation 'payment_accounts' already exists"**

- Table already created (migration ran successfully before)
- This is fine! Just means the table exists.

**"Permission denied"**

- Make sure you're logged in to the correct Supabase project
- Check you have admin/editor access to the database

**"Function 'update_updated_at_column' does not exist"**

- This function should already exist from the original schema
- If not, you can create it with:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## ✅ Activation Complete When:

After running the migration successfully:

1. ✅ Table exists in Supabase
2. ✅ Indexes created
3. ✅ RLS policies active
4. ✅ Payment Accounts page responds to API calls
5. ✅ LaCardio can connect his first account

---

**Estimated Time**: 2-3 minutes to run migration\
**Risk Level**: Very low - just adding a new table\
**Rollback**: If needed, just drop the table

**Questions?** Check `/docs/PAYMENT_ACCOUNTS_SETUP.md` for detailed
documentation.

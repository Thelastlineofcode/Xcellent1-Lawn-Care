# Payment Accounts Setup Guide

## Overview

The Payment Accounts feature allows LaCardio to connect his PayPal, Cash App,
Stripe, and Square accounts so he can track which clients pay through which
method and manage cashflow effectively.

## Features

✅ Connect multiple payment accounts (PayPal, Cash App, Stripe, Square)\
✅ Set a primary payment method per account type\
✅ Track which payment method clients use\
✅ Receive payments to configured accounts\
✅ Manage account connectivity from the dashboard

## Setup Instructions

### Step 1: Run Database Migration

Since this is a new feature, you need to create the `payment_accounts` table in
your Supabase database:

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project: `utivthfrwgtjatsusopw`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of
   `/db/migrations/001_create_payment_accounts.sql`
6. Click **Run**

The migration will:

- Create the `payment_accounts` table
- Add proper indexes for performance
- Enable Row Level Security (RLS) policies
- Add the update trigger for `updated_at`

### Step 2: Access Payment Accounts Page

Once LaCardio logs in at https://xcellent1lawncare.com, he can:

1. Click **Payment Accounts** in the navigation menu
2. Click **+ Connect Payment Account**
3. Select payment method (PayPal, Cash App, Stripe, or Square)
4. Enter the account identifier:
   - **PayPal**: Your PayPal email address
   - **Cash App**: Your Cash App $cashtag (e.g., $LaCardio)
   - **Stripe**: Your Stripe email address
   - **Square**: Your Square email address
5. Optionally add a nickname (e.g., "Personal" or "Business")
6. Check "Set as primary payment method" if desired
7. Click **Connect Account**

### Step 3: Recording Payments

When recording payments in the **Invoices** page:

1. Click **Record Payment** on any unpaid invoice
2. Enter the payment amount
3. Select the payment method used (Cash, PayPal, Cash App, etc.)
4. (Optional) Add transaction ID or notes
5. Click **Record Payment**

The system will:

- Record payment with the specified method
- Track the payment in the database
- Update client balance
- Mark invoice as paid when fully paid

## Connected Payment Methods

### PayPal

- **Account ID**: Your PayPal email address
- **Good For**: Digital payments, customers with PayPal accounts
- **Setup**: Connect your primary PayPal email

### Cash App

- **Account ID**: Your $cashtag (e.g., $LaCardio)
- **Good For**: Quick mobile payments from younger/tech-savvy clients
- **Setup**: Connect your Cash App $cashtag

### Stripe

- **Account ID**: Your Stripe email
- **Good For**: Credit card processing, online invoicing
- **Setup**: Connect your Stripe account email

### Square

- **Account ID**: Your Square email
- **Good For**: In-person card payments with Square reader
- **Setup**: Connect your Square email

### Venmo

- **Account ID**: Your Venmo username (e.g., @LaCardio)
- **Good For**: Peer-to-peer mobile payments commonly used in the US
- **Setup**: Enter your Venmo username in the Payment Accounts form

### Zelle

- **Account ID**: Your Zelle-registered email or phone number
- **Good For**: Fast bank-to-bank transfers (US)
- **Setup**: Enter your Zelle email/phone in the Payment Accounts form

### Apple Pay and Google Pay

- **Account ID**: These are client-side payment instruments that usually require a card processor (e.g., Stripe or Square) to accept payments. Use `stripe` or `square` as the payment method when you want Apple/Google Pay enabled.
- **Good For**: In-browser or in-app card payments
- **Setup**: Connect a Stripe or Square account to enable Apple Pay / Google Pay checkouts (provider integration required, not offered by default)

## API Endpoints

All payment account management is handled through these endpoints:

```
GET    /api/owner/payment-accounts          - List all payment accounts
POST   /api/owner/payment-accounts          - Create new payment account
PATCH  /api/owner/payment-accounts/:id/primary - Set as primary
DELETE /api/owner/payment-accounts/:id      - Delete payment account
```

## Database Schema

```sql
CREATE TABLE payment_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  payment_method TEXT ('paypal' | 'cash_app' | 'stripe' | 'square'),
  account_identifier TEXT,
  account_name TEXT,
  is_primary BOOLEAN,
  is_active BOOLEAN,
  verification_status TEXT ('pending' | 'verified' | 'failed' | 'expired'),
  connected_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Security Considerations

✅ **Encrypted Storage**: Account identifiers are stored securely in Supabase\
✅ **Row Level Security**: Owners can only access their own payment accounts\
✅ **No Sensitive Data**: We don't store API keys or passwords (verification
happens client-side)\
✅ **Audit Trail**: All connected/disconnected accounts are timestamped

## Troubleshooting

### "Payment method is required" error

- Make sure you selected a payment method before clicking Connect

### Account not appearing in list

- Verify the payment method and account identifier are correct
- Refresh the page
- Check browser console for errors

### Can't delete an account

- The account must be inactive before deletion
- Try setting another account as primary first

## Future Enhancements

- 🔄 Automatic verification of payment accounts
- 📊 Payment tracking by method (analytics dashboard)
- 🔗 Direct integration with PayPal/Cash App APIs
- 💰 Automatic fund transfers to primary account
- 📧 Email notifications when payments received

## Support

For issues or questions about payment accounts:

1. Check the browser console for error messages
2. Review Supabase logs for API errors
3. Verify the database migration was successful
4. Contact support with the error message

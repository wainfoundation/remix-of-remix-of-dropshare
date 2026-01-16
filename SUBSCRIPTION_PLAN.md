# Monthly 10π Subscription

This adds a 20π monthly subscription for Business/Creator accounts:

- Paid tiers: `business`, `creator`
- Free tier: `shopper`
- On expiry: account downgrades to `shopper`
- On renewal: account restores to the user's desired paid type

## Database Changes

Run the migration in `supabase/migrations/20260115_add_subscription_fields.sql`.

Added columns on `public.profiles`:
- `desired_account_type text` — user’s chosen tier (business/creator)
- `subscription_status text` — one of none/active/expired/canceled
- `subscription_plan text` — e.g. `monthly_20pi`
- `subscription_expires_at timestamptz`
- `last_payment_at timestamptz`

## Edge Functions

1) `record-payment` (HTTP)
- Activates/renews `monthly_20pi`, extends `subscription_expires_at` by 30 days
- Restores `account_type` to `desired_account_type` (or provided `accountType`)

2) `subscription-sweeper` (Scheduled)
- Downgrades expired profiles to `shopper` and marks status `expired`

### Deploy + Schedule

1. In Supabase Dashboard → Edge Functions, create and deploy:
   - `record-payment` from `supabase/functions/record-payment/index.ts`
   - `subscription-sweeper` from `supabase/functions/subscription-sweeper/index.ts`
2. Set Secrets (Settings → Edge Functions → Secrets):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Scheduled Trigger (Dashboard → Edge Functions → Scheduled Triggers):
   - Target: `subscription-sweeper`
   - Cron: `0 * * * *` (hourly) or more frequent if desired

## Frontend Wiring

- Signup charges 20π for Business/Creator, then calls `record-payment` to set expiry and status.
- Settings account-type changes now require 10π when switching to Business/Creator and call `record-payment`; switching to Shopper is free and clears subscription fields.
- Existing UI continues to read `profiles.account_type` as the effective tier.
- `desired_account_type` is set during signup for paid tiers to support seamless renewal.

## Notes

- Sandbox mode is supported; backend verification can be added later for production.
- If you allow changing account type in Settings, consider gating business/creator changes via payment and writing the choice to `desired_account_type`.

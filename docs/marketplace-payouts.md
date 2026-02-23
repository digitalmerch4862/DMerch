# Marketplace Payout Flow (Shopee/Lazada Style)

This project now includes a wallet-based payout architecture for multi-seller digital products.

## How Money Flows

1. Buyer pays through PayMongo checkout.
2. Webhook receives successful payment (`checkout_session.payment.paid`).
3. Orders are split per seller and saved with payout fields.
4. Seller net amounts are credited to `seller_balances.pending_amount`.
5. After hold window (`PAYOUT_HOLD_DAYS`), funds move to `available_amount`.
6. Scheduled payout processor sends disbursement to seller bank accounts.
7. Successful payouts create ledger entries and mark orders as `paid`.

## SQL Migration

Run this migration in Supabase SQL Editor:

- `supabase/marketplace_payouts.sql`

It adds seller and payout tables, constraints, and RLS policies.

## New Edge Function

- `supabase/functions/process-payouts/index.ts`

Purpose:

- Releases held earnings to available balances.
- Creates and executes PayMongo disbursements.
- Updates payout, order, and ledger records.

## Required Environment Variables

### `create-checkout`

- `PAYMONGO_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `USD_TO_PHP_RATE` (default: `56`)
- `PLATFORM_FEE_RATE` (default: `0.1`)

### `paymongo-webhook`

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYOUT_HOLD_DAYS` (default: `3`)

### `process-payouts`

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYMONGO_SECRET_KEY`
- `PAYOUTS_CRON_TOKEN` (required for authorization)
- `MIN_PAYOUT_PHP` (default: `100`)

## Triggering Scheduled Payouts

Call `process-payouts` from a cron/scheduler with:

- `Authorization: Bearer <PAYOUTS_CRON_TOKEN>`

Recommended cadence:

- Every 10-30 minutes

## Security Notes

- Keep payout/disbursement calls server-side only.
- Never expose service role key in client code.
- Validate and rotate webhook credentials regularly.
- Consider encrypting bank account numbers with a managed KMS before storing.

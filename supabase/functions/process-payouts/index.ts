import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PAYMONGO_SECRET_KEY = Deno.env.get('PAYMONGO_SECRET_KEY')!
const PAYOUTS_CRON_TOKEN = Deno.env.get('PAYOUTS_CRON_TOKEN') || ''
const MIN_PAYOUT_PHP = Number(Deno.env.get('MIN_PAYOUT_PHP') || '100')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!PAYOUTS_CRON_TOKEN || token !== PAYOUTS_CRON_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: releasableOrders, error: releasableError } = await supabase
      .from('orders')
      .select('id, seller_id, seller_net_amount')
      .eq('payout_status', 'pending')
      .lte('payout_eligible_at', new Date().toISOString())

    if (releasableError) throw releasableError

    const releaseBySeller = (releasableOrders || []).reduce((acc: Record<string, { orderIds: string[], amount: number }>, row: any) => {
      const sellerId = row.seller_id
      if (!sellerId) return acc
      if (!acc[sellerId]) acc[sellerId] = { orderIds: [], amount: 0 }
      acc[sellerId].orderIds.push(row.id)
      acc[sellerId].amount += Number(row.seller_net_amount || 0)
      return acc
    }, {})

    for (const [sellerId, rawPayload] of Object.entries(releaseBySeller)) {
      const payload = rawPayload as { orderIds: string[]; amount: number }
      if (!payload.orderIds.length || payload.amount <= 0) continue

      await supabase
        .from('orders')
        .update({ payout_status: 'ready' })
        .in('id', payload.orderIds)

      await supabase.rpc('increment_seller_balance', {
        p_seller_id: sellerId,
        p_pending_delta: Number((-payload.amount).toFixed(2)),
        p_available_delta: Number(payload.amount.toFixed(2)),
        p_earned_delta: 0,
        p_paid_delta: 0,
      })

      await supabase
        .from('wallet_ledger')
        .insert({
          seller_id: sellerId,
          entry_type: 'release_available',
          amount: Number(payload.amount.toFixed(2)),
          currency: 'PHP',
          description: 'Hold period released to available balance',
          metadata: { order_ids: payload.orderIds }
        })
    }

    const { data: balances, error: balancesError } = await supabase
      .from('seller_balances')
      .select('seller_id, available_amount')
      .gte('available_amount', MIN_PAYOUT_PHP)

    if (balancesError) throw balancesError

    const results: any[] = []

    for (const balance of balances || []) {
      const amount = Number(balance.available_amount || 0)
      if (amount < MIN_PAYOUT_PHP) continue

      const { data: defaultBank, error: bankError } = await supabase
        .from('seller_bank_accounts')
        .select('id, account_holder_name, bank_code, account_number_encrypted')
        .eq('seller_id', balance.seller_id)
        .eq('is_default', true)
        .eq('status', 'active')
        .maybeSingle()

      if (bankError || !defaultBank) {
        results.push({ seller_id: balance.seller_id, status: 'skipped_no_bank' })
        continue
      }

      const { data: readyOrders, error: readyOrdersError } = await supabase
        .from('orders')
        .select('id, seller_net_amount')
        .eq('seller_id', balance.seller_id)
        .eq('payout_status', 'ready')
        .order('created_at', { ascending: true })

      if (readyOrdersError || !readyOrders || readyOrders.length === 0) {
        results.push({ seller_id: balance.seller_id, status: 'skipped_no_ready_orders' })
        continue
      }

      const payoutAmount = Number(
        readyOrders.reduce((sum: number, row: any) => sum + Number(row.seller_net_amount || 0), 0).toFixed(2)
      )

      const { data: payoutRow, error: payoutInsertError } = await supabase
        .from('payouts')
        .insert({
          seller_id: balance.seller_id,
          bank_account_id: defaultBank.id,
          amount: payoutAmount,
          currency: 'PHP',
          status: 'processing',
          provider: 'paymongo'
        })
        .select('id')
        .single()

      if (payoutInsertError) {
        results.push({ seller_id: balance.seller_id, status: 'failed_create_payout', reason: payoutInsertError.message })
        continue
      }

      const disbursementPayload = {
        data: {
          attributes: {
            amount: Math.round(payoutAmount * 100),
            currency: 'PHP',
            recipient_name: defaultBank.account_holder_name,
            account_number: defaultBank.account_number_encrypted,
            bank_code: defaultBank.bank_code,
            description: `DigitalMerch seller payout ${payoutRow.id}`
          }
        }
      }

      const disbursementRes = await fetch('https://api.paymongo.com/v1/disbursements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`
        },
        body: JSON.stringify(disbursementPayload)
      })

      const disbursementData = await disbursementRes.json()

      if (!disbursementRes.ok) {
        await supabase
          .from('payouts')
          .update({
            status: 'failed',
            failure_reason: disbursementData?.errors?.[0]?.detail || 'Failed disbursement request'
          })
          .eq('id', payoutRow.id)

        results.push({ seller_id: balance.seller_id, status: 'failed_disbursement', payout_id: payoutRow.id })
        continue
      }

      const disbursementId = disbursementData?.data?.id || null

      await supabase
        .from('payouts')
        .update({
          status: 'succeeded',
          provider_reference: disbursementId,
          processed_at: new Date().toISOString()
        })
        .eq('id', payoutRow.id)

      await supabase
        .from('payout_items')
        .insert(readyOrders.map((row: any) => ({
          payout_id: payoutRow.id,
          order_id: row.id,
          amount: Number(row.seller_net_amount || 0)
        })))

      await supabase
        .from('orders')
        .update({ payout_status: 'paid' })
        .in('id', readyOrders.map((row: any) => row.id))

      await supabase.rpc('increment_seller_balance', {
        p_seller_id: balance.seller_id,
        p_pending_delta: 0,
        p_available_delta: Number((-payoutAmount).toFixed(2)),
        p_earned_delta: 0,
        p_paid_delta: Number(payoutAmount.toFixed(2)),
      })

      await supabase
        .from('wallet_ledger')
        .insert({
          seller_id: balance.seller_id,
          payout_id: payoutRow.id,
          entry_type: 'payout_debit',
          amount: Number(payoutAmount.toFixed(2)),
          currency: 'PHP',
          description: `Payout sent to bank for ${payoutRow.id}`,
          metadata: {
            disbursement_id: disbursementId,
            order_ids: readyOrders.map((row: any) => row.id)
          }
        })

      results.push({ seller_id: balance.seller_id, status: 'paid', payout_id: payoutRow.id, amount: payoutAmount })
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('process-payouts error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

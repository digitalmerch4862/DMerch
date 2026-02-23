import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PAYOUT_HOLD_DAYS = Number(Deno.env.get('PAYOUT_HOLD_DAYS') || '3')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const webhook = await req.json()

        console.log('Received webhook:', JSON.stringify(webhook, null, 2))

        // PayMongo webhook events
        const eventType = webhook.data?.attributes?.type

        if (eventType === 'checkout_session.payment.paid') {
            const checkoutSession = webhook.data.attributes.data
            const metadata = checkoutSession.attributes.metadata

            // Create order in database
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

            const paymentId = checkoutSession.id
            const { data: existingOrders } = await supabase
                .from('orders')
                .select('id')
                .eq('payment_id', paymentId)
                .limit(1)

            if (existingOrders && existingOrders.length > 0) {
                console.log('Order already processed for payment:', paymentId)
                return new Response(
                    JSON.stringify({ received: true, duplicate: true }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            const parsedItems = JSON.parse(metadata.items || '[]')
            const groupedBySeller = parsedItems.reduce((acc: Record<string, any[]>, item: any) => {
                if (!item?.seller_id) return acc
                if (!acc[item.seller_id]) acc[item.seller_id] = []
                acc[item.seller_id].push(item)
                return acc
            }, {})

            for (const [sellerId, rawItems] of Object.entries(groupedBySeller)) {
                const sellerItems = rawItems as any[]
                const grossPhp = sellerItems.reduce((sum, item: any) => sum + Number(item.gross_php || 0), 0)
                const sellerNetPhp = sellerItems.reduce((sum, item: any) => sum + Number(item.seller_net_php || 0), 0)
                const feePhp = sellerItems.reduce((sum, item: any) => sum + Number(item.platform_fee_php || 0), 0)
                const amountUsd = sellerItems.reduce((sum, item: any) => {
                    const qty = Number(item.quantity || 1)
                    return sum + Number(item.unit_price_usd || 0) * qty
                }, 0)

                const payoutEligibleAt = new Date(Date.now() + PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString()

                const orderData = {
                    user_id: metadata.user_id,
                    seller_id: sellerId,
                    customer_username: metadata.username,
                    amount: grossPhp,
                    amount_php: grossPhp,
                    amount_usd: Number(amountUsd.toFixed(2)),
                    platform_fee_amount: Number(feePhp.toFixed(2)),
                    seller_net_amount: Number(sellerNetPhp.toFixed(2)),
                    payout_status: 'pending',
                    payout_eligible_at: payoutEligibleAt,
                    items: sellerItems,
                    status: 'completed',
                    payment_id: paymentId,
                    created_at: new Date().toISOString()
                }

                const { data: insertedOrder, error: orderError } = await supabase
                    .from('orders')
                    .insert([orderData])
                    .select('id')
                    .single()

                if (orderError) {
                    console.error('Order insert failed:', orderError)
                    continue
                }

                const { error: balanceError } = await supabase.rpc('increment_seller_balance', {
                    p_seller_id: sellerId,
                    p_pending_delta: Number(sellerNetPhp.toFixed(2)),
                    p_available_delta: 0,
                    p_earned_delta: Number(sellerNetPhp.toFixed(2)),
                    p_paid_delta: 0
                })

                if (balanceError) {
                    console.error('Failed to update seller balance:', balanceError)
                }

                const { error: ledgerError } = await supabase
                    .from('wallet_ledger')
                    .insert({
                        seller_id: sellerId,
                        order_id: insertedOrder.id,
                        entry_type: 'credit_pending',
                        amount: Number(sellerNetPhp.toFixed(2)),
                        currency: 'PHP',
                        description: `Pending earnings for order ${insertedOrder.id}`,
                        metadata: {
                            payment_id: paymentId,
                            hold_days: PAYOUT_HOLD_DAYS
                        }
                    })

                if (ledgerError) {
                    console.error('Failed to insert wallet ledger:', ledgerError)
                }
            }
        }

        return new Response(
            JSON.stringify({ received: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PAYMONGO_SECRET_KEY = Deno.env.get('PAYMONGO_SECRET_KEY')!

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

            const orderData = {
                customer_username: metadata.username,
                amount: checkoutSession.attributes.amount / 100, // Convert from centavos
                items: JSON.parse(metadata.items),
                status: 'completed',
                payment_id: checkoutSession.id,
                created_at: new Date().toISOString()
            }

            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])

            if (error) {
                console.error('Database error:', error)
            } else {
                console.log('Order created:', data)
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

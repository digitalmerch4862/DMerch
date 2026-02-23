import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.2'

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
        const { items, user_id, username, currency = 'PHP', origin = 'http://localhost:3000' } = await req.json()

        // Create line items for PayMongo Checkout Session
        const lineItems = items.map((item: any) => ({
            name: item.name,
            amount: Math.round(item.price * 100), // Convert to centavos
            currency: currency,
            description: item.description || 'Digital product',
            quantity: item.quantity,
            images: item.imageUrl ? [item.imageUrl] : []
        }))

        // Create Checkout Session
        const payload = {
            data: {
                attributes: {
                    line_items: lineItems,
                    payment_method_types: [
                        'card',
                        'gcash',
                        'paymaya'
                    ],
                    description: `Order for ${username}`,
                    send_email_receipt: true,
                    show_description: true,
                    show_line_items: true,
                    cancel_url: `${origin}/store`,
                    success_url: `${origin}/orders`,
                    metadata: {
                        user_id: user_id,
                        username: username,
                        items: JSON.stringify(items.map((i: any) => ({
                            id: i.id,
                            name: i.name,
                            price: i.price,
                            quantity: i.quantity
                        })))
                    }
                }
            }
        }

        console.log('Sending to PayMongo:', JSON.stringify(payload, null, 2))

        const paymongoResponse = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`
            },
            body: JSON.stringify(payload)
        })

        const paymongoData = await paymongoResponse.json()

        if (!paymongoResponse.ok) {
            console.error('PayMongo error:', paymongoData)
            return new Response(
                JSON.stringify({
                    error: paymongoData.errors?.[0]?.detail || 'Failed to create checkout session'
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400
                }
            )
        }

        // Return checkout URL
        return new Response(
            JSON.stringify({
                checkout_url: paymongoData.data.attributes.checkout_url,
                checkout_id: paymongoData.data.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})

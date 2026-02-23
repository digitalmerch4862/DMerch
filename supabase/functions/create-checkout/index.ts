import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.2'

const PAYMONGO_SECRET_KEY = Deno.env.get('PAYMONGO_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const USD_TO_PHP_RATE = Number(Deno.env.get('USD_TO_PHP_RATE') || '56')
const PLATFORM_FEE_RATE = Number(Deno.env.get('PLATFORM_FEE_RATE') || '0.1')

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
        const { items, user_id, username, origin = 'http://localhost:3000' } = await req.json()

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('No items provided')
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        const productIds = items.map((item: any) => item.id)
        const { data: productRows, error: productError } = await supabase
            .from('products')
            .select('id, name, description, image_url, seller_id, price_usd')
            .in('id', productIds)

        if (productError) throw productError
        if (!productRows || productRows.length === 0) {
            throw new Error('Products not found')
        }

        const typedProducts = (productRows || []) as any[]
        const productMap = new Map<string, any>(typedProducts.map((row: any) => [row.id, row]))

        const normalizedItems = items.map((item: any) => {
            const product = productMap.get(item.id)
            if (!product) {
                throw new Error(`Product ${item.id} was not found`)
            }

            const quantity = Math.max(1, Number(item.quantity || 1))
            const unitPriceUsd = Number(product.price_usd)
            if (!Number.isFinite(unitPriceUsd) || unitPriceUsd < 1) {
                throw new Error(`Product ${product.name} is below minimum price of USD 1.00`)
            }

            const unitPricePhp = Number((unitPriceUsd * USD_TO_PHP_RATE).toFixed(2))
            const grossPhp = Number((unitPricePhp * quantity).toFixed(2))
            const platformFeePhp = Number((grossPhp * PLATFORM_FEE_RATE).toFixed(2))
            const sellerNetPhp = Number((grossPhp - platformFeePhp).toFixed(2))

            return {
                id: product.id,
                name: product.name,
                description: product.description || 'Digital product',
                quantity,
                imageUrl: product.image_url,
                seller_id: product.seller_id,
                unit_price_usd: unitPriceUsd,
                unit_price_php: unitPricePhp,
                gross_php: grossPhp,
                platform_fee_php: platformFeePhp,
                seller_net_php: sellerNetPhp
            }
        })

        const totals = normalizedItems.reduce((acc, item) => {
            acc.gross_php += item.gross_php
            acc.platform_fee_php += item.platform_fee_php
            acc.seller_net_php += item.seller_net_php
            return acc
        }, { gross_php: 0, platform_fee_php: 0, seller_net_php: 0 })

        const sellerBreakdown = normalizedItems.reduce((acc: Record<string, number>, item) => {
            acc[item.seller_id] = Number(((acc[item.seller_id] || 0) + item.seller_net_php).toFixed(2))
            return acc
        }, {})

        // Create line items for PayMongo Checkout Session
        const lineItems = normalizedItems.map((item: any) => ({
            name: item.name,
            amount: Math.round(item.unit_price_php * 100),
            currency: 'PHP',
            description: item.description,
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
                        items: JSON.stringify(normalizedItems),
                        seller_breakdown: JSON.stringify(sellerBreakdown),
                        order_total_php: String(Number(totals.gross_php.toFixed(2))),
                        platform_fee_php: String(Number(totals.platform_fee_php.toFixed(2))),
                        seller_net_php: String(Number(totals.seller_net_php.toFixed(2))),
                        usd_to_php_rate: String(USD_TO_PHP_RATE)
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

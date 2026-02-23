const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const WEBHOOK_URL = 'https://jfdvbyoyvqriqhqtmyjo.supabase.co/functions/v1/paymongo-webhook';

async function registerWebhook() {
    if (!PAYMONGO_SECRET_KEY) {
        console.error('Missing PAYMONGO_SECRET_KEY environment variable.');
        process.exit(1);
    }

    try {
        const response = await fetch('https://api.paymongo.com/v1/webhooks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        events: ['checkout_session.payment.paid'],
                        url: WEBHOOK_URL
                    }
                }
            })
        });

        const data = await response.json();
        if (data.errors) {
            console.error('Registration failed:', JSON.stringify(data.errors, null, 2));
        } else {
            console.log('Webhook registered successfully:', data.data.id);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

registerWebhook();

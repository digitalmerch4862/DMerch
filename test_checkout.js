const SUPABASE_URL = 'https://jfdvbyoyvqriqhqtmyjo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZHZieW95dnFyaXFocXRteWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTMxOTQsImV4cCI6MjA4NTY2OTE5NH0.t5-BcJx0BYAQcBBIclqTsXvoUAWUzA-rPCtEnWSiuuM';

async function testCheckout() {
    console.log("Testing create-checkout function...");
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                items: [
                    { id: 'test-1', name: 'Test Product', price: 100, quantity: 1, description: 'A test product' }
                ],
                user_id: 'TestUser',
                username: 'TestUser'
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error("Function returned error:", data.error);
            if (data.error.includes("PAYMONGO_SECRET_KEY")) {
                console.log("NOTE: This error is expected if the secret key has not been set in Supabase yet.");
            }
        } else {
            console.log("Success! Checkout URL:", data.checkout_url);
        }
    } catch (error) {
        console.error("Fetch error:", error.message);
    }
}

testCheckout();

const https = require('https');

const SUPABASE_URL = 'https://jfdvbyoyvqriqhqtmyjo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZHZieW95dnFyaXFocXRteWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTMxOTQsImV4cCI6MjA4NTY2OTE5NH0.t5-BcJx0BYAQcBBIclqTsXvoUAWUzA-rPCtEnWSiuuM';

function request(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}${endpoint}`);
        const options = {
            method: method,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = data ? JSON.parse(data) : null;
                    resolve({ status: res.statusCode, body: json });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTest() {
    console.log("1. Creating Test Product...");
    const createRes = await request('POST', '/rest/v1/products', {
        name: "Test Product CRUD",
        price: 10,
        category_name: "Test",
        description: "Temporary test item"
    });

    if (createRes.status !== 201) {
        console.error("Failed to create:", createRes);
        return;
    }
    const product = createRes.body[0];
    console.log("   Created ID:", product.id);

    console.log("\n2. Editing Product (PATCH)...");
    const editRes = await request('PATCH', `/rest/v1/products?id=eq.${product.id}`, {
        name: "Edited Product Name",
        price: 50,
        category_name: "Edited Cat"
    });

    if (editRes.status === 200 || editRes.status === 204) {
        console.log("   Edit successful.");
        // Verify
        const getRes = await request('GET', `/rest/v1/products?id=eq.${product.id}`);
        const updated = getRes.body[0];
        if (updated.name === "Edited Product Name" && updated.price === 50) {
            console.log("   Verification PASSED: Name and Price updated.");
        } else {
            console.error("   Verification FAILED:", updated);
        }
    } else {
        console.error("   Edit Failed:", editRes);
    }

    console.log("\n3. Deleting Product (DELETE)...");
    const delRes = await request('DELETE', `/rest/v1/products?id=eq.${product.id}`);
    if (delRes.status === 200 || delRes.status === 204) {
        console.log("   Delete request successful.");
        // Verify
        const checkRes = await request('GET', `/rest/v1/products?id=eq.${product.id}`);
        if (checkRes.body.length === 0) {
            console.log("   Verification PASSED: Product gone.");
        } else {
            console.error("   Verification FAILED: Product still exists.");
        }
    } else {
        console.error("   Delete Failed:", delRes);
    }
}

runTest();

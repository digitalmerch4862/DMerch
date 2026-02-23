import { test, expect } from '@playwright/test';

/**
 * DMerch Regression Check
 * 
 * This test verifies the core functionality mentioned in QUICK_TEST_GUIDE.md
 * and ensures that critical sidebar sections remain visible.
 */

test.describe('DMerch E2E Regression Suite', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to the local development server
        await page.goto('http://localhost:3000');
        // Wait for the sidebar to hydrate
        await page.waitForSelector('span:has-text("Discover")');
    });

    test('CRITICAL: Sidebar Navigation Sanity Check', async ({ page }) => {
        // 1. Verify Support section (Visible to all)
        const supportHeader = page.locator('span', { hasText: 'Support' });
        await expect(supportHeader).toBeVisible();

        const contactAdminBtn = page.locator('button', { hasText: 'Contact Admin' });
        await expect(contactAdminBtn).toBeVisible();

        // 2. Verify CRM and PayMongo Portal (Visible to Admins)
        // We mock the admin state in localStorage
        await page.evaluate(() => {
            localStorage.setItem('digital_merch_user', JSON.stringify({
                username: 'AdminTest',
                isAdmin: true,
                isLoggedIn: true
            }));
        });
        await page.reload();

        const managementHeader = page.locator('span', { hasText: 'Management' });
        await expect(managementHeader).toBeVisible();

        const crmBtn = page.locator('button', { hasText: 'CRM' });
        await expect(crmBtn).toBeVisible();

        const paymongoPortalLink = page.locator('a', { hasText: 'PayMongo Portal' });
        await expect(paymongoPortalLink).toBeVisible();
    });

    test('CRITICAL: PayMongo Checkout Flow', async ({ page }) => {
        // 1. Log in as a standard user to enable "Add to Cart"
        await page.evaluate(() => {
            localStorage.setItem('digital_merch_user', JSON.stringify({
                username: 'TestBuyer',
                isAdmin: false,
                isLoggedIn: true
            }));
        });
        await page.reload();
        await page.waitForSelector('span:has-text("Discover")');

        // 2. Navigate to "All Products" to ensure we have items in the grid
        const allProductsBtn = page.locator('button', { hasText: 'All Products' });
        await allProductsBtn.click();

        // 2b. Add first available product to cart
        // We target the shopping cart button in the products grid
        const products = page.locator('.flex-grow >> .grid >> div.fade-slide-up');
        await expect(products.first()).toBeVisible();

        const addToCartBtn = products.first().locator('button');
        await expect(addToCartBtn).toBeVisible();

        // Wait for potential animations to settle before clicking
        await page.waitForTimeout(1000);
        await addToCartBtn.click({ force: true });

        // 3. Open Cart/Checkout
        // Target the floating cart button at the bottom right
        const cartFloatingBtn = page.locator('button:has-text("Proceed to Checkout")');
        // Note: The text might be hidden until hover, but Playwright locator works
        await cartFloatingBtn.click();

        // 4. Verify Checkout View
        await expect(page.locator('h2', { hasText: 'Order Integrity' })).toBeVisible();

        // 5. Initialize Payment
        const initBtn = page.locator('button', { hasText: 'Initialize Payment' });
        await expect(initBtn).toBeVisible();

        // Debug: Intercept and log the PayMongo API response
        page.on('response', async (response) => {
            if (response.url().includes('create-checkout')) {
                const status = response.status();
                const body = await response.json().catch(() => ({}));
                console.log(`\n[DEBUG] create-checkout status: ${status}`);
                console.log(`[DEBUG] create-checkout body: ${JSON.stringify(body, null, 2)}\n`);
            }
        });

        await initBtn.click();

        // 6. Verify PayMongo Modal
        // First, check the local modal header (Outside the frame)
        // Using a regex to be resilient to text changes (e.g., 'Secure Payment' vs 'Secure PayMongo Gateway')
        const localHeader = page.getByText(/Secure Pay/i).first();
        await expect(localHeader).toBeVisible({ timeout: 10000 });

        // Second, use frameLocator to verify content INSIDE the PayMongo iframe
        const paymongoFrame = page.frameLocator('iframe[title="PayMongo Checkout"]');

        // We wait for the "Pay" button or "Total" amount to appear inside the frame
        // This confirms the external PayMongo page has successfully loaded
        const paymentDetails = paymongoFrame.getByText(/Pay|Total|Amount/i).first();
        await expect(paymentDetails).toBeVisible({ timeout: 20000 });
    });

    test('UI Regression: Categories Check', async ({ page }) => {
        // Verify all category types are visible in sidebar
        const categories = ['Native Type', 'Subscription Type', 'Course Type'];
        for (const cat of categories) {
            await expect(page.locator('button', { hasText: cat })).toBeVisible();
        }
    });

});

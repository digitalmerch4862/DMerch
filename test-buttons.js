// Button Test Script - Run in Browser Console
// Open http://localhost:3000/ and paste this in the DevTools Console

console.clear();
console.log('🧪 DigitalMerch Button Test Suite\n');

// Test 1: Check if all critical buttons exist
console.log('📋 Test 1: Button Existence Check');
const tests = {
    'Auth Modal Trigger': document.querySelector('button:has([data-lucide="store"])'),
    'Sidebar Best Seller': document.querySelector('button:has([data-lucide="trending-up"])'),
    'Sidebar All Products': document.querySelector('button:has([data-lucide="layout-grid"])'),
};

Object.entries(tests).forEach(([name, element]) => {
    console.log(`  ${element ? '✅' : '❌'} ${name}`);
});

// Test 2: Check for product cards
console.log('\n📦 Test 2: Product Card Buttons');
const productButtons = document.querySelectorAll('button:has([data-lucide="shopping-cart"])');
console.log(`  Found ${productButtons.length} product card buttons`);

// Test 3: Check button types in forms
console.log('\n🔍 Test 3: Form Button Types (Fix Verification)');
const allButtons = document.querySelectorAll('button');
let formButtonsWithoutType = 0;
let totalButtons = allButtons.length;

allButtons.forEach((btn, index) => {
    const hasType = btn.hasAttribute('type');
    const inForm = btn.closest('form');
    const type = btn.getAttribute('type');

    if (inForm && (!hasType || type === null)) {
        formButtonsWithoutType++;
        console.log(`  ⚠️  Button #${index} in form has no type attribute`);
    }
});

console.log(`  Total buttons: ${totalButtons}`);
console.log(`  ${formButtonsWithoutType === 0 ? '✅' : '⚠️'} Buttons in forms without type: ${formButtonsWithoutType}`);

// Test 4: Simulate disabled button click (Should not trigger click sound)
console.log('\n🔇 Test 4: Disabled Button Sound Test');
console.log('  To test: Add product to cart, then click "Staged" button');
console.log('  Expected: NO click sound on disabled/staged button');

// Test 5: Check CRM button text
console.log('\n📊 Test 5: CRM Button Text Check');
const crmButton = Array.from(document.querySelectorAll('button')).find(btn =>
    btn.textContent.includes('CRM')
);
if (crmButton) {
    const text = crmButton.textContent.trim();
    const isCorrect = text === 'CRM' || text.includes('CRM') && !text.includes('Dashboard');
    console.log(`  ${isCorrect ? '✅' : '❌'} CRM button text: "${text}"`);
    console.log(`  Expected: "CRM" (without "Dashboard")`);
} else {
    console.log('  ℹ️  CRM button not visible (user may not be admin)');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📝 Manual Testing Checklist:');
console.log('1. Click "Sign In / Sign Up" - auth modal should open');
console.log('2. Click X button - modal should close (no form submit)');
console.log('3. Reopen modal, click eye icon - should toggle password visibility (no form submit)');
console.log('4. Click Google button - should trigger OAuth (no form submit)');
console.log('5. Add product to cart - should play click sound');
console.log('6. Click "Staged" button - should NOT play click sound');
console.log('='.repeat(50));

console.log('\n✅ Test script complete! Check results above.');

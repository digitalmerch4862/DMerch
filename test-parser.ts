
const testData = `8500 Premium Lightroom Presets-Windows(OS)	https://drive.google.com/file/d/14VsJAt4I1_9idXFLTCqv7FReGp9-TAeW/view?usp=drivesdk	99
A River in Darkness One Man’s Escape from North Korea by Masaji Ishikawa (z-lib.org).epub	https://drive.google.com/file/d/11dbvtag8ibY_TRlyDY81dOephoTabUka/view?usp=drivesdk	99
Adobe Acrobat  macOS Sequoia.pkg	https://drive.google.com/file/d/1KejJk4cJS4AhDPu14XHuZpv4mXXFYFNP/view?usp=drivesdk	99`;

function parseBatch(massUploadText: string) {
    const lines = massUploadText.split('\n').filter(l => l.trim() !== '');
    const products = [];

    for (const line of lines) {
        // Robust Parsing Logic (Copied from App.tsx)
        let name = 'New Item';
        let fileUrl = '';
        let price = 0;

        // 1. Try Tab Split
        let parts = line.split('\t');
        if (parts.length >= 2) {
            name = parts[0]?.trim();
            fileUrl = parts[1]?.trim();
            price = parseFloat(parts[2]?.trim()) || 0;
        } else {
            // 2. Try URL Detection (for flexible copy-pastes)
            const urlMatch = line.match(/(https?:\/\/[^\s,]+)/);
            if (urlMatch) {
                name = line.substring(0, urlMatch.index).trim();
                const remainder = line.substring(urlMatch.index + urlMatch[0].length).trim();
                fileUrl = urlMatch[0];
                // Look for the last number in the remainder
                const priceMatch = remainder.match(/(\d+(\.\d+)?)/);
                price = priceMatch ? parseFloat(priceMatch[0]) : 0;
            } else {
                // 3. Last Resort: Comma split
                const commaParts = line.split(',');
                name = commaParts[0]?.trim();
                price = parseFloat(commaParts[1]?.trim()) || 0;
            }
        }

        products.push({ name, fileUrl, price });
    }
    return products;
}

const results = parseBatch(testData);
console.log(JSON.stringify(results, null, 2));

// Validation
const expectedCount = 3;
if (results.length !== expectedCount) {
    console.error(`FAILED: Expected ${expectedCount} items, got ${results.length}`);
    process.exit(1);
}

const item1 = results.find(r => r.name.includes("8500 Premium"));
if (!item1 || item1.price !== 99) {
    console.error("FAILED: Item 1 parsing incorrect", item1);
    process.exit(1);
}

const item2 = results.find(r => r.name.includes("River in Darkness"));
if (!item2 || item2.price !== 99) {
    console.error("FAILED: Item 2 parsing incorrect", item2);
    process.exit(1);
}

const item3 = results.find(r => r.name.includes("Adobe Acrobat"));
if (!item3 || item3.price !== 99) {
    console.error("FAILED: Item 3 parsing incorrect", item3);
    process.exit(1);
}

console.log("SUCCESS: All items parsed correctly.");

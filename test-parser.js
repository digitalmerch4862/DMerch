
const testData = `8500 Premium Lightroom Presets-Windows(OS)\thttps://drive.google.com/file/d/14VsJAt4I1_9idXFLTCqv7FReGp9-TAeW/view?usp=drivesdk\t99
A River in Darkness One Man’s Escape from North Korea by Masaji Ishikawa (z-lib.org).epub\thttps://drive.google.com/file/d/11dbvtag8ibY_TRlyDY81dOephoTabUka/view?usp=drivesdk\t99
Adobe Acrobat  macOS Sequoia.pkg\thttps://drive.google.com/file/d/1KejJk4cJS4AhDPu14XHuZpv4mXXFYFNP/view?usp=drivesdk\t99`;

function parseBatch(massUploadText) {
    const lines = massUploadText.split('\n').filter(l => l.trim() !== '');
    const products = [];

    for (const line of lines) {
        let name = 'New Item';
        let fileUrl = '';
        let price = 0;

        let parts = line.split('\t');
        if (parts.length >= 2) {
            name = parts[0]?.trim();
            fileUrl = parts[1]?.trim();
            price = parseFloat(parts[2]?.trim()) || 0;
        } else {
            const urlMatch = line.match(/(https?:\/\/[^\s,]+)/);
            if (urlMatch) {
                name = line.substring(0, urlMatch.index).trim();
                const remainder = line.substring(urlMatch.index + urlMatch[0].length).trim();
                fileUrl = urlMatch[0];
                const priceMatch = remainder.match(/(\d+(\.\d+)?)/);
                price = priceMatch ? parseFloat(priceMatch[0]) : 0;
            } else {
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

if (results.length !== 3) {
    console.error(`FAILED: Expected 3 items, got ${results.length}`);
    process.exit(1);
}
if (results[0].price !== 99) { console.log('Item 1 price mismatch'); process.exit(1); }
if (results[1].price !== 99) { console.log('Item 2 price mismatch'); process.exit(1); }
if (results[2].price !== 99) { console.log('Item 3 price mismatch'); process.exit(1); }

console.log("SUCCESS");

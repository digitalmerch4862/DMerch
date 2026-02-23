
const testData = `8500 Premium Lightroom Presets-Windows(OS)\thttps://drive.google.com/file/d/14VsJAt4I1_9idXFLTCqv7FReGp9-TAeW/view?usp=drivesdk\tNative Type\t99
A River in Darkness One Man’s Escape from North Korea by Masaji Ishikawa (z-lib.org).epub\thttps://drive.google.com/file/d/11dbvtag8ibY_TRlyDY81dOephoTabUka/view?usp=drivesdk\tNative Type\t99
Adobe Acrobat  macOS Sequoia.pkg\thttps://drive.google.com/file/d/1KejJk4cJS4AhDPu14XHuZpv4mXXFYFNP/view?usp=drivesdk\tNative Type\t99
Adobe Acrobat DC v21.001.20155 Pre-Cracked FOR MAC(OS)\thttps://drive.google.com/file/d/18B8Kg_omviRIQCJBFDL77-NR93rF1ZhJ/view?usp=drivesdk\tNative Type\t99`;

function parseBatch(massUploadText) {
    const lines = massUploadText.split('\n').filter(l => l.trim() !== '');
    const products = [];
    const CategoryType = { NATIVE: 'Native Type' };

    for (const line of lines) {
        let name = 'New Item';
        let fileUrl = '';
        let category = CategoryType.NATIVE;
        let price = 0;

        let parts = line.split('\t');
        if (parts.length >= 3) {
            name = parts[0]?.trim();
            fileUrl = parts[1]?.trim();
            const potentialPrice = parseFloat(parts[2]?.trim());
            if (!isNaN(potentialPrice) && parts.length === 3) {
                price = potentialPrice;
            } else {
                category = parts[2]?.trim() || CategoryType.NATIVE;
                price = parseFloat(parts[3]?.trim()) || 0;
            }
        } else {
            const urlMatch = line.match(/(https?:\/\/[^\s,]+)/);
            if (urlMatch) {
                name = line.substring(0, urlMatch.index).trim();
                const remainder = line.substring(urlMatch.index + urlMatch[0].length).trim();
                fileUrl = urlMatch[0];
                const priceMatch = remainder.match(/(\d+(\.\d+)?)$/);
                if (priceMatch) {
                    price = parseFloat(priceMatch[0]);
                    const possibleCategory = remainder.substring(0, remainder.lastIndexOf(priceMatch[0])).trim();
                    if (possibleCategory) category = possibleCategory;
                } else {
                    const firstNum = remainder.match(/(\d+(\.\d+)?)/);
                    price = firstNum ? parseFloat(firstNum[0]) : 0;
                }
            } else {
                const commaParts = line.split(',');
                name = commaParts[0]?.trim();
                price = parseFloat(commaParts[1]?.trim()) || 0;
            }
        }
        products.push({ name, fileUrl, category, price });
    }
    return products;
}

const results = parseBatch(testData);
console.log(JSON.stringify(results, null, 2));

if (results.length !== 4) {
    console.error(`FAILED: Expected 4 items, got ${results.length}`);
    process.exit(1);
}
if (results[0].category !== 'Native Type') { console.log('Item 1 category mismatch'); process.exit(1); }
if (results[0].price !== 99) { console.log('Item 1 price mismatch'); process.exit(1); }

console.log("SUCCESS");

const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const dirs = [
    'C:/Users/jegom/.clawdbot/media/inbound',
    'C:/Users/jegom/clawd/ACTAGEN/inbound',
    'C:/Users/jegom/clawd/ACTAGEN/inbound/others'
];

async function scan() {
    console.log("Scanning for Acta 355...");
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.docx'));
        
        for (const file of files) {
            try {
                const fullPath = path.join(dir, file);
                const result = await mammoth.extractRawText({path: fullPath});
                if (result.value.includes("Acta 355") || result.value.includes("16 de noviembre")) {
                    console.log(`MATCH FOUND: ${fullPath}`);
                    console.log(`PREVIEW: ${result.value.slice(0, 200)}...`);
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }
}

scan();
